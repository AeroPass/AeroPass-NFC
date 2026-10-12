from __future__ import annotations

import asyncio
import contextlib
import logging
from typing import Any

from nfc_agent.domain.models import AgentState, ReadingMode, ReaderObservation
from nfc_agent.domain.ports import EmitEvent, NfcReader

logger = logging.getLogger(__name__)


class AgentController:
    """Coordina los modos de lectura y la máquina de estados NFC.

    Solo se permite una sesión de lectura simultánea. La conexión que la inicia
    es su propietaria; detenerla o desconectarla no afecta a otras conexiones.
    """

    def __init__(self, reader: NfcReader, poll_interval: float = 0.35) -> None:
        self._reader = reader
        self._poll_interval = max(0.05, poll_interval)
        self._state = AgentState.IDLE
        self._mode: ReadingMode | None = None
        self._owner_id: str | None = None
        self._task: asyncio.Task[None] | None = None
        self._stop_event: asyncio.Event | None = None
        self._lock = asyncio.Lock()

    @property
    def state(self) -> AgentState:
        return self._state

    @property
    def mode(self) -> ReadingMode | None:
        return self._mode

    def status(self) -> dict[str, object]:
        return {"type": "status", "state": self._state.value,
                "mode": self._mode.value if self._mode else None,
                "reading": self._task is not None and not self._task.done()}

    def is_owner(self, owner_id: str) -> bool:
        return self._owner_id == owner_id and self._task is not None

    async def start(self, owner_id: str, mode: ReadingMode, emit: EmitEvent) -> tuple[bool, str]:
        async with self._lock:
            if self._task is not None and not self._task.done():
                if self._owner_id == owner_id and self._mode == mode:
                    return True, "already_running"
                if self._owner_id == owner_id:
                    return False, "already_reading_another_mode"
                return False, "agent_busy"

            self._owner_id = owner_id
            self._mode = mode
            self._stop_event = asyncio.Event()
            self._state = AgentState.IDLE
            self._task = asyncio.create_task(
                self._run(owner_id, mode, emit, self._stop_event),
                name=f"nfc-reading-{mode.value}",
            )
            return True, "started"

    async def stop(self, owner_id: str) -> bool:
        async with self._lock:
            if self._owner_id != owner_id or self._task is None:
                return False
            task = self._task
            if self._stop_event is not None:
                self._stop_event.set()
        # No se cancela el to_thread en curso: se deja terminar la llamada PC/SC
        # actual y luego el bucle libera el contexto nativo de forma ordenada.
        if task is not asyncio.current_task():
            with contextlib.suppress(asyncio.CancelledError, Exception):
                await task
        return True

    async def shutdown(self) -> None:
        async with self._lock:
            task = self._task
            if self._stop_event is not None:
                self._stop_event.set()
        if task is not None and task is not asyncio.current_task():
            with contextlib.suppress(asyncio.CancelledError, Exception):
                await task

    async def _run(self, owner_id: str, mode: ReadingMode, emit: EmitEvent,
                   stop_event: asyncio.Event) -> None:
        last_reader_error: str | None = None
        last_reader_name: str | None = None
        try:
            await self._set_state(AgentState.WAITING_CARD, emit, mode)
            while not stop_event.is_set():
                try:
                    observation = await self._reader.poll(
                        read_uid=self._state == AgentState.WAITING_CARD
                    )
                except Exception as exc:  # Un fallo del dispositivo no mata el servidor WS.
                    message = f"Fallo consultando el lector NFC: {exc}"
                    if message != last_reader_error:
                        await emit({"type": "error", "code": "READER_ERROR", "error": message})
                        last_reader_error = message
                    await asyncio.sleep(self._poll_interval)
                    continue

                if not observation.reader_available:
                    message = observation.error or "No se detectó ningún lector NFC PC/SC."
                    if message != last_reader_error:
                        await emit({"type": "error", "code": "READER_UNAVAILABLE", "error": message})
                        last_reader_error = message
                    last_reader_name = None
                    if self._state != AgentState.WAITING_CARD:
                        await self._set_state(AgentState.WAITING_CARD, emit, mode)
                    await asyncio.sleep(self._poll_interval)
                    continue

                if observation.reader_name and observation.reader_name != last_reader_name:
                    last_reader_name = observation.reader_name
                    await emit({"type": "reader", "available": True, "name": observation.reader_name})
                if observation.error:
                    message = observation.error
                    if message != last_reader_error:
                        await emit({"type": "error", "code": "NFC_READ_ERROR", "error": message})
                        last_reader_error = message
                elif last_reader_error is not None:
                    await emit({"type": "reader_status", "available": True, "error": None})
                    last_reader_error = None

                if self._state == AgentState.WAITING_CARD:
                    if observation.card_present:
                        if observation.uid:
                            await self._set_state(AgentState.READING, emit, mode)
                            await emit({
                                "type": "uid",
                                "uid": observation.uid.upper(),
                                "mode": mode.value,
                                "reader": observation.reader_name,
                            })
                        await self._set_state(AgentState.CARD_PRESENT, emit, mode)
                elif (self._state == AgentState.CARD_PRESENT
                      and not observation.card_present and not observation.error):
                    if mode == ReadingMode.ONCE:
                        break
                    await self._set_state(AgentState.WAITING_CARD, emit, mode)

                await asyncio.sleep(self._poll_interval)

        except (ConnectionError, asyncio.CancelledError):
            # La conexión WebSocket propietaria se cerró o se detuvo el proceso.
            if isinstance(asyncio.current_task(), asyncio.Task) and asyncio.current_task().cancelling():
                raise
            logger.debug("Conexión propietaria terminada durante la lectura")
        except Exception:
            logger.exception("Error no controlado en el ciclo NFC")
        finally:
            try:
                await self._reader.close()
            except Exception:
                logger.exception("No se pudo liberar limpiamente el lector NFC")
            self._state = AgentState.IDLE
            try:
                await emit({"type": "state", "state": AgentState.IDLE.value, "mode": None})
            except Exception:
                pass
            async with self._lock:
                if self._task is asyncio.current_task():
                    self._task = None
                    self._owner_id = None
                    self._mode = None
                    self._stop_event = None

    async def _set_state(self, state: AgentState, emit: EmitEvent,
                         mode: ReadingMode) -> None:
        if self._state == state:
            return
        self._state = state
        await emit({"type": "state", "state": state.value, "mode": mode.value})

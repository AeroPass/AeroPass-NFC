from __future__ import annotations

import asyncio
import contextlib
import logging
import time
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
        # Política de resiliencia: cuatro minutos para recuperar el lector.
        reconnect_timeout = 240.0
        retry_delay = 0.5
        max_retry_delay = 5.0
        reconnect_started: float | None = None
        last_reader_error: str | None = None
        last_reader_name: str | None = None

        try:
            await self._set_state(AgentState.WAITING_CARD, emit, mode)

            while not stop_event.is_set():
                observation: ReaderObservation | None = None
                poll_error: str | None = None

                try:
                    observation = await self._reader.poll(
                        read_uid=self._state == AgentState.WAITING_CARD
                    )
                except asyncio.CancelledError:
                    raise
                except Exception as exc:
                    # Los errores de la API PC/SC se tratan como una posible
                    # pérdida del hardware y entran en la misma política de retry.
                    poll_error = f"Fallo consultando el lector NFC: {exc}"
                    logger.warning("%s", poll_error)

                unavailable = observation is None or not observation.reader_available
                if unavailable:
                    message = (
                        poll_error
                        or (observation.error if observation is not None else None)
                        or "No se detectó ningún lector NFC PC/SC."
                    )

                    if reconnect_started is None:
                        reconnect_started = time.monotonic()
                        retry_delay = 0.5
                        logger.warning(
                            "Se detectó la desconexión del lector NFC. "
                            "Intentando reconectar durante un máximo de %.0f segundos.",
                            reconnect_timeout,
                        )
                        if self._state != AgentState.RECONNECTING:
                            await self._set_state(AgentState.RECONNECTING, emit, mode)
                        # Libera el contexto PC/SC potencialmente obsoleto. La
                        # siguiente llamada a poll() lo creará de nuevo al reintentar.
                        try:
                            await self._reader.close()
                        except Exception:
                            logger.exception("Error liberando el contexto PC/SC antes del retry")

                    if message != last_reader_error:
                        await emit({
                            "type": "error",
                            "code": "READER_RECONNECTING",
                            "error": message,
                            "retrying": True,
                        })
                        last_reader_error = message

                    elapsed = time.monotonic() - reconnect_started
                    if elapsed >= reconnect_timeout:
                        failure_message = (
                            "No fue posible recuperar el lector NFC tras "
                            f"{int(reconnect_timeout)} segundos. El agente queda "
                            "en espera; inicia una nueva sesión cuando el lector esté disponible."
                        )
                        logger.error("%s", failure_message)
                        await emit({
                            "type": "error",
                            "code": "READER_RECOVERY_TIMEOUT",
                            "error": failure_message,
                            "retrying": False,
                        })
                        break

                    # Espera interrumpible: stop() no tendrá que esperar a que
                    # termine todo el intervalo de reintento.
                    try:
                        await asyncio.wait_for(stop_event.wait(), timeout=retry_delay)
                    except asyncio.TimeoutError:
                        pass
                    retry_delay = min(retry_delay * 2, max_retry_delay)
                    continue

                # El lector volvió a responder: se reinicia la política de retry.
                if reconnect_started is not None:
                    logger.info("Lector NFC recuperado; se reanuda la lectura.")
                    reconnect_started = None
                    retry_delay = 0.5
                    last_reader_error = None
                    last_reader_name = None
                    await emit({
                        "type": "reader_status",
                        "available": True,
                        "error": None,
                        "reconnected": True,
                    })
                    await self._set_state(AgentState.WAITING_CARD, emit, mode)

                assert observation is not None

                if observation.reader_name and observation.reader_name != last_reader_name:
                    last_reader_name = observation.reader_name
                    await emit({
                        "type": "reader",
                        "available": True,
                        "name": observation.reader_name,
                    })

                if observation.error:
                    message = observation.error
                    if message != last_reader_error:
                        await emit({
                            "type": "error",
                            "code": "NFC_READ_ERROR",
                            "error": message,
                        })
                        last_reader_error = message
                elif last_reader_error is not None:
                    await emit({
                        "type": "reader_status",
                        "available": True,
                        "error": None,
                    })
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
                elif (
                    self._state == AgentState.CARD_PRESENT
                    and not observation.card_present
                    and not observation.error
                ):
                    if mode == ReadingMode.ONCE:
                        break
                    await self._set_state(AgentState.WAITING_CARD, emit, mode)

                await asyncio.sleep(self._poll_interval)

        except asyncio.CancelledError:
            raise
        except Exception:
            # Incluye fallos al emitir eventos: si el frontend se desconectó,
            # esta sesión termina, pero el servidor WebSocket sigue aceptando
            # clientes nuevos.
            logger.warning(
                "La sesión de lectura terminó por un error de hardware o transporte.",
                exc_info=True,
            )
        finally:
            try:
                await self._reader.close()
            except Exception:
                logger.exception("No se pudo liberar limpiamente el lector NFC")

            self._state = AgentState.IDLE
            try:
                await emit({
                    "type": "state",
                    "state": AgentState.IDLE.value,
                    "mode": None,
                })
            except Exception:
                # El frontend puede estar desconectado; el cierre local no depende
                # de que el mensaje final llegue al cliente.
                logger.debug("No se pudo notificar el estado final al frontend.")

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

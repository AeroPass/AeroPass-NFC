from __future__ import annotations

import asyncio
import hmac
import json
import logging
import uuid
from contextlib import suppress
from typing import Any

from websockets.asyncio.server import ServerConnection, serve
from websockets.exceptions import ConnectionClosed

from nfc_agent import __version__
from nfc_agent.application.agent_controller import AgentController
from nfc_agent.config import AgentSettings
from nfc_agent.domain.models import ReadingMode
from nfc_agent.transport.protocol import parse_message

logger = logging.getLogger(__name__)


class WebSocketAgentServer:
    def __init__(self, settings: AgentSettings, controller: AgentController,
                 device_id: str) -> None:
        self._settings = settings
        self._controller = controller
        self._device_id = device_id
        self._server: Any | None = None
        self._port: int | None = None

    @property
    def port(self) -> int | None:
        return self._port

    async def serve_forever(self) -> None:
        last_error: OSError | None = None
        origins: list[str | None] = [None, *self._settings.allowed_origins]
        for port in self._settings.ports:
            try:
                self._server = await serve(
                    self._handle_client,
                    self._settings.host,
                    port,
                    origins=origins,
                    max_size=64 * 1024,
                    max_queue=16,
                    ping_interval=20,
                    ping_timeout=20,
                    open_timeout=10,
                    close_timeout=5,
                    compression=None,
                )
                self._port = port
                break
            except OSError as exc:
                last_error = exc
                logger.warning("El puerto %s no está disponible: %s", port, exc)
        if self._server is None or self._port is None:
            raise RuntimeError(
                f"No se pudo iniciar el servidor WebSocket en {self._settings.host}; "
                f"puertos probados: {self._settings.ports}. Último error: {last_error}"
            )

        logger.info("WebSocket local activo en ws://%s:%s", self._settings.host, self._port)
        async with self._server:
            await self._server.serve_forever()

    async def close(self) -> None:
        await self._controller.shutdown()
        if self._server is not None:
            self._server.close()
            await self._server.wait_closed()

    @staticmethod
    async def _send(websocket: ServerConnection, message: dict[str, object]) -> None:
        await websocket.send(json.dumps(message, ensure_ascii=False, separators=(",", ":")))

    async def _handle_client(self, websocket: ServerConnection) -> None:
        owner_id = str(uuid.uuid4())
        token_required = bool(self._settings.auth_token)
        authenticated = not token_required
        logger.info("Frontend conectado desde %s", websocket.remote_address)
        await self._send(websocket, {
            "type": "welcome",
            "dispositivo_id": self._device_id,
            "version": __version__,
            "port": self._port,
            "auth_required": token_required,
            "modes": ["focus", "continuous"],
        })
        try:
            async for raw in websocket:
                command, error = parse_message(raw)
                if error:
                    await self._send(websocket, {"type": "error", "code": "INVALID_MESSAGE", "error": error})
                    continue
                assert command is not None

                if not authenticated:
                    if command.kind != "auth":
                        await self._send(websocket, {
                            "type": "error", "code": "AUTH_REQUIRED",
                            "error": "Autentícate antes de enviar comandos al agente.",
                        })
                        continue
                    if not hmac.compare_digest(
                        (command.token or "").encode("utf-8"),
                        (self._settings.auth_token or "").encode("utf-8"),
                    ):
                        await self._send(websocket, {"type": "error", "code": "AUTH_FAILED", "error": "Token inválido."})
                        continue
                    authenticated = True
                    await self._send(websocket, {"type": "auth_result", "ok": True})
                    continue

                if command.kind == "auth":
                    await self._send(websocket, {"type": "error", "code": "AUTH_NOT_REQUIRED", "error": "La conexión ya está autenticada."})
                elif command.kind == "ping":
                    await self._send(websocket, {"type": "pong"})
                elif command.kind == "status":
                    await self._send(websocket, self._controller.status())
                elif command.kind == "start" and command.mode is not None:
                    started, result = await self._controller.start(owner_id, command.mode, lambda event: self._send(websocket, event))
                    await self._send(websocket, {
                        "type": "ack", "command": "start", "mode": command.mode.value,
                        "ok": started, "result": result,
                    })
                    if not started and result == "agent_busy":
                        await self._send(websocket, {
                            "type": "error", "code": "AGENT_BUSY",
                            "error": "El lector ya está siendo utilizado por otra conexión WebSocket.",
                        })
                elif command.kind == "stop":
                    stopped = await self._controller.stop(owner_id)
                    await self._send(websocket, {"type": "ack", "command": "stop", "ok": stopped,
                                                 "result": "stopped" if stopped else "no_active_session"})
                else:
                    await self._send(websocket, {"type": "error", "code": "INVALID_COMMAND", "error": "Comando no soportado."})
        except ConnectionClosed:
            logger.info("Frontend desconectado")
        except Exception:
            logger.exception("Error procesando una conexión WebSocket")
        finally:
            with suppress(Exception):
                await self._controller.stop(owner_id)

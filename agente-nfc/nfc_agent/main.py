from __future__ import annotations

import asyncio
import logging
import signal

from nfc_agent.application.agent_controller import AgentController
from nfc_agent.config import AgentSettings
from nfc_agent.hardware.pcsc_reader import PcscNativeReader
from nfc_agent.transport.websocket_server import WebSocketAgentServer
from nfc_agent.utils.device_id import get_or_create_device_id
from nfc_agent.utils.logging_setup import configure_logging

logger = logging.getLogger(__name__)


async def _run() -> None:
    settings = AgentSettings.from_env()
    configure_logging(settings.data_dir)
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    device_id = get_or_create_device_id(settings.data_dir)
    reader = PcscNativeReader(reader_name=settings.reader_name)
    controller = AgentController(reader, poll_interval=settings.poll_interval)
    server = WebSocketAgentServer(settings, controller, device_id)
    stop_event = asyncio.Event()
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, stop_event.set)
        except (NotImplementedError, RuntimeError):
            # En Windows, asyncio puede no exponer add_signal_handler.
            pass

    server_task = asyncio.create_task(server.serve_forever(), name="nfc-websocket-server")
    stop_task = asyncio.create_task(stop_event.wait(), name="nfc-shutdown-signal")
    try:
        done, _ = await asyncio.wait((server_task, stop_task), return_when=asyncio.FIRST_COMPLETED)
        if server_task in done:
            await server_task  # Propaga errores de arranque para que el proceso termine con fallo.
        logger.info("Señal de cierre recibida; deteniendo el agente")
    finally:
        stop_task.cancel()
        await server.close()
        if not server_task.done():
            server_task.cancel()
        try:
            await server_task
        except asyncio.CancelledError:
            pass


def main() -> None:
    try:
        asyncio.run(_run())
    except KeyboardInterrupt:
        # Ctrl+C debe producir un cierre limpio, no una traza de error.
        pass
    except Exception:
        logging.basicConfig(level=logging.ERROR)
        logging.getLogger(__name__).exception("No se pudo iniciar el agente NFC")
        raise SystemExit(1)


if __name__ == "__main__":
    main()

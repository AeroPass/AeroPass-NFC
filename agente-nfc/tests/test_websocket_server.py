from __future__ import annotations

import asyncio
import contextlib
import json
import socket
import tempfile
import unittest
from pathlib import Path

from websockets.asyncio.client import connect

from nfc_agent.application.agent_controller import AgentController
from nfc_agent.config import AgentSettings
from nfc_agent.domain.models import ReaderObservation
from nfc_agent.transport.websocket_server import WebSocketAgentServer


class NoCardReader:
    async def poll(self, *, read_uid: bool) -> ReaderObservation:
        return ReaderObservation(True, "Fake NFC Reader", False)

    async def close(self) -> None:
        return None


def unused_loopback_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


class WebSocketServerTests(unittest.IsolatedAsyncioTestCase):
    async def test_welcome_status_start_and_stop_commands(self):
        port = unused_loopback_port()
        settings = AgentSettings(
            host="127.0.0.1",
            ports=(port,),
            allowed_origins=(),
            auth_token=None,
            poll_interval=0.05,
            reader_name=None,
            data_dir=Path(tempfile.mkdtemp(prefix="nfc-agent-ws-test-")),
        )
        controller = AgentController(NoCardReader(), poll_interval=0.05)
        server = WebSocketAgentServer(settings, controller, device_id="test-device")
        task = asyncio.create_task(server.serve_forever())
        websocket = None
        try:
            deadline = asyncio.get_running_loop().time() + 3
            while server.port is None and asyncio.get_running_loop().time() < deadline:
                if task.done():
                    await task
                await asyncio.sleep(0.01)
            self.assertEqual(server.port, port)
            websocket = await connect(f"ws://127.0.0.1:{port}", open_timeout=2)
            async with websocket:
                welcome = json.loads(await asyncio.wait_for(websocket.recv(), 2))
                self.assertEqual(welcome["type"], "welcome")
                self.assertEqual(welcome["dispositivo_id"], "test-device")

                await websocket.send(json.dumps({"type": "status"}))
                status = json.loads(await asyncio.wait_for(websocket.recv(), 2))
                self.assertEqual(status["type"], "status")
                self.assertEqual(status["state"], "idle")

                await websocket.send(json.dumps({"type": "start_focus"}))
                got_start_ack = False
                got_waiting_state = False
                deadline = asyncio.get_running_loop().time() + 2
                while asyncio.get_running_loop().time() < deadline and not (got_start_ack and got_waiting_state):
                    event = json.loads(await asyncio.wait_for(websocket.recv(), 1))
                    got_start_ack |= event.get("type") == "ack" and event.get("command") == "start" and event.get("ok")
                    got_waiting_state |= event.get("type") == "state" and event.get("state") == "waiting_card"
                self.assertTrue(got_start_ack)
                self.assertTrue(got_waiting_state)

                await websocket.send(json.dumps({"type": "stop_reading"}))
                got_stop_ack = False
                deadline = asyncio.get_running_loop().time() + 2
                while asyncio.get_running_loop().time() < deadline and not got_stop_ack:
                    event = json.loads(await asyncio.wait_for(websocket.recv(), 1))
                    got_stop_ack |= event.get("type") == "ack" and event.get("command") == "stop" and event.get("ok")
                self.assertTrue(got_stop_ack)
        finally:
            await server.close()
            if not task.done():
                task.cancel()
            with contextlib.suppress(asyncio.CancelledError, Exception):
                await task


if __name__ == "__main__":
    unittest.main()

from __future__ import annotations

import asyncio
import unittest
from collections import deque

from nfc_agent.application.agent_controller import AgentController
from nfc_agent.domain.models import AgentState, ReaderObservation, ReadingMode


class ScriptedReader:
    def __init__(self, observations):
        self.observations = deque(observations)
        self.last = ReaderObservation(True, "Fake NFC Reader", False)
        self.closed = False
        self.read_uid_calls = 0

    async def poll(self, *, read_uid: bool) -> ReaderObservation:
        if read_uid:
            self.read_uid_calls += 1
        if self.observations:
            self.last = self.observations.popleft()
        await asyncio.sleep(0)
        return self.last

    async def close(self) -> None:
        self.closed = True


class ControllerTests(unittest.IsolatedAsyncioTestCase):
    async def test_focus_reads_once_until_card_is_removed_and_then_rearms(self):
        reader = ScriptedReader([
            ReaderObservation(True, "Fake NFC Reader", False),
            ReaderObservation(True, "Fake NFC Reader", True, "04A1B2C3"),
            ReaderObservation(True, "Fake NFC Reader", True),
            ReaderObservation(True, "Fake NFC Reader", False),
            ReaderObservation(True, "Fake NFC Reader", False),
        ])
        controller = AgentController(reader, poll_interval=0.05)
        events = []

        async def emit(event):
            events.append(event)

        started, result = await controller.start("client-1", ReadingMode.FOCUS, emit)
        self.assertTrue(started)
        self.assertEqual(result, "started")
        await asyncio.sleep(0.20)
        uid_events = [event for event in events if event.get("type") == "uid"]
        self.assertEqual(len(uid_events), 1)
        self.assertEqual(uid_events[0]["uid"], "04A1B2C3")
        self.assertEqual(controller.state, AgentState.WAITING_CARD)
        self.assertTrue(controller.is_owner("client-1"))
        self.assertFalse(await controller.stop("some-other-client"))
        self.assertTrue(await controller.stop("client-1"))
        self.assertTrue(reader.closed)
        self.assertEqual(controller.state, AgentState.IDLE)

    async def test_single_read_mode_finishes_after_removal(self):
        reader = ScriptedReader([
            ReaderObservation(True, "Fake NFC Reader", False),
            ReaderObservation(True, "Fake NFC Reader", True, "11223344"),
            ReaderObservation(True, "Fake NFC Reader", True),
            ReaderObservation(True, "Fake NFC Reader", False),
        ])
        controller = AgentController(reader, poll_interval=0.05)
        events = []

        async def emit(event):
            events.append(event)

        started, _ = await controller.start("legacy-client", ReadingMode.ONCE, emit)
        self.assertTrue(started)
        await asyncio.sleep(0.25)
        self.assertEqual(len([event for event in events if event.get("type") == "uid"]), 1)
        self.assertEqual(controller.state, AgentState.IDLE)
        self.assertFalse(controller.is_owner("legacy-client"))
        self.assertTrue(reader.closed)

    async def test_only_one_websocket_session_can_own_the_reader(self):
        reader = ScriptedReader([ReaderObservation(True, "Fake NFC Reader", False)])
        controller = AgentController(reader, poll_interval=0.2)

        async def emit(_event):
            return None

        first, _ = await controller.start("first", ReadingMode.FOCUS, emit)
        second, result = await controller.start("second", ReadingMode.CONTINUOUS, emit)
        self.assertTrue(first)
        self.assertFalse(second)
        self.assertEqual(result, "agent_busy")
        await controller.stop("first")


if __name__ == "__main__":
    unittest.main()

import unittest

from nfc_agent.domain.models import ReadingMode
from nfc_agent.transport.protocol import parse_message


class ProtocolTests(unittest.TestCase):
    def test_focus_alias(self):
        command, error = parse_message('{"type":"iniciar_enfoque"}')
        self.assertIsNone(error)
        self.assertEqual(command.mode, ReadingMode.FOCUS)

    def test_continuous_alias(self):
        command, error = parse_message('{"type":"start_continuous"}')
        self.assertIsNone(error)
        self.assertEqual(command.mode, ReadingMode.CONTINUOUS)

    def test_legacy_read_command_is_one_shot(self):
        command, error = parse_message('{"type":"leer"}')
        self.assertIsNone(error)
        self.assertEqual(command.mode, ReadingMode.ONCE)

    def test_rejects_invalid_json_and_unknown_types(self):
        command, error = parse_message('{bad json')
        self.assertIsNone(command)
        self.assertIsNotNone(error)
        command, error = parse_message('{"type":"hack"}')
        self.assertIsNone(command)
        self.assertIn("desconocido", error)


if __name__ == "__main__":
    unittest.main()

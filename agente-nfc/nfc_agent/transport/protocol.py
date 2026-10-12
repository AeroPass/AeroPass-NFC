from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

from nfc_agent.domain.models import ReadingMode


@dataclass(frozen=True, slots=True)
class ClientCommand:
    kind: str
    mode: ReadingMode | None = None
    token: str | None = None


COMMANDS: dict[str, ClientCommand] = {
    "start_focus": ClientCommand("start", ReadingMode.FOCUS),
    "iniciar_enfoque": ClientCommand("start", ReadingMode.FOCUS),
    "focus_start": ClientCommand("start", ReadingMode.FOCUS),
    "start_continuous": ClientCommand("start", ReadingMode.CONTINUOUS),
    "iniciar_continuo": ClientCommand("start", ReadingMode.CONTINUOUS),
    "iniciar_lectura_permanente": ClientCommand("start", ReadingMode.CONTINUOUS),
    "continuous_start": ClientCommand("start", ReadingMode.CONTINUOUS),
    "stop_reading": ClientCommand("stop"),
    "detener_lectura": ClientCommand("stop"),
    "stop": ClientCommand("stop"),
    "close_focus": ClientCommand("stop"),
    "cerrar_enfoque": ClientCommand("stop"),
    "detener_lectura_permanente": ClientCommand("stop"),
    "leer": ClientCommand("start", ReadingMode.ONCE),  # protocolo previo
    "ping": ClientCommand("ping"),
    "status": ClientCommand("status"),
    "auth": ClientCommand("auth"),
}


def parse_message(raw: str | bytes) -> tuple[ClientCommand | None, str | None]:
    try:
        payload: Any = json.loads(raw)
    except (json.JSONDecodeError, UnicodeDecodeError, TypeError):
        return None, "El mensaje debe ser JSON válido."
    if not isinstance(payload, dict):
        return None, "El mensaje JSON debe ser un objeto."
    kind = payload.get("type")
    if not isinstance(kind, str):
        return None, "Falta el campo de texto 'type'."
    command = COMMANDS.get(kind.strip().lower())
    if command is None:
        return None, f"Tipo de mensaje desconocido: {kind}."
    if command.kind == "auth":
        token = payload.get("token")
        if not isinstance(token, str):
            return None, "El campo 'token' es obligatorio para autenticarse."
        return ClientCommand("auth", token=token), None
    return command, None

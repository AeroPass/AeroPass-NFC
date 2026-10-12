from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class ReadingMode(str, Enum):
    FOCUS = "focus"
    CONTINUOUS = "continuous"
    ONCE = "once"  # Compatibilidad con el comando histórico {"type": "leer"}.


class AgentState(str, Enum):
    IDLE = "idle"
    WAITING_CARD = "waiting_card"
    RECONNECTING = "reconnecting"
    READING = "reading"
    CARD_PRESENT = "card_present"


@dataclass(frozen=True, slots=True)
class ReaderObservation:
    """Instantánea de un lector PC/SC en un momento concreto."""

    reader_available: bool
    reader_name: str | None = None
    card_present: bool = False
    uid: str | None = None
    error: str | None = None

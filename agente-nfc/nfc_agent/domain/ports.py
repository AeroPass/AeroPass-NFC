from __future__ import annotations

from typing import Awaitable, Callable, Protocol

from nfc_agent.domain.models import ReaderObservation


EmitEvent = Callable[[dict[str, object]], Awaitable[None]]


class NfcReader(Protocol):
    """Puerto de hardware: no expone detalles de una biblioteca concreta."""

    async def poll(self, *, read_uid: bool) -> ReaderObservation:
        """Inspecciona el lector y, si se solicita, obtiene el UID presente."""
        ...

    async def close(self) -> None:
        """Libera los recursos nativos asociados al lector."""
        ...

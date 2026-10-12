from __future__ import annotations

import asyncio
import ctypes
import ctypes.util
import logging
import os
import sys
from dataclasses import dataclass
from typing import Any

from nfc_agent.domain.models import ReaderObservation

logger = logging.getLogger(__name__)

SCARD_S_SUCCESS = 0x00000000
SCARD_SCOPE_USER = 0x00000000
SCARD_SHARE_SHARED = 0x00000002
SCARD_PROTOCOL_T0 = 0x00000001
SCARD_PROTOCOL_T1 = 0x00000002
SCARD_LEAVE_CARD = 0x00000000
SCARD_E_NO_SMARTCARD = 0x8010000C
SCARD_E_READER_UNAVAILABLE = 0x80100017
SCARD_E_NO_READERS_AVAILABLE = 0x8010002E
SCARD_W_REMOVED_CARD = 0x80100069
GET_UID_APDU = bytes((0xFF, 0xCA, 0x00, 0x00, 0x00))


class PcscUnavailableError(RuntimeError):
    """PC/SC no está instalado, no está ejecutándose o no es accesible."""


class PcscOperationError(RuntimeError):
    """Una operación de la API PC/SC devolvió un código de error."""


class _IoRequest(ctypes.Structure):
    _fields_ = [("dwProtocol", ctypes.c_uint32), ("cbPciLength", ctypes.c_uint32)]


@dataclass(frozen=True, slots=True)
class _NativeTypes:
    long: Any
    handle: Any
    encoding: str
    windows: bool


class PcscNativeReader:
    """Implementación PC/SC por API nativa, sin dependencia Python NFC.

    PC/SC está proporcionado por Windows (WinSCard), pcsc-lite en Linux y el
    framework PCSC en macOS. Se conserva el APDU FF CA 00 00 00 usado por el
    lector original; algunos modelos/firmwares pueden requerir otra estrategia.
    """

    def __init__(self, reader_name: str | None = None) -> None:
        self._reader_name = reader_name.strip() if reader_name else None
        self._types: _NativeTypes
        # La API se carga de forma diferida: si el sistema aún no tiene PC/SC,
        # el proceso WebSocket puede seguir activo y reintentar al comenzar una lectura.
        self._lib: Any | None = None
        self._types: _NativeTypes | None = None
        self._context: Any | None = None

    @staticmethod
    def _load_library() -> Any:
        if sys.platform == "win32":
            return ctypes.WinDLL("winscard.dll")
        if sys.platform == "darwin":
            path = "/System/Library/Frameworks/PCSC.framework/PCSC"
            try:
                return ctypes.CDLL(path)
            except OSError as exc:
                raise PcscUnavailableError(f"No se pudo cargar PCSC.framework: {exc}") from exc
        if sys.platform.startswith("linux"):
            path = ctypes.util.find_library("pcsclite") or "libpcsclite.so.1"
            try:
                return ctypes.CDLL(path)
            except OSError as exc:
                raise PcscUnavailableError(
                    "No se pudo cargar pcsc-lite. Instala el servicio/paquete PC/SC del sistema. "
                    f"Detalle: {exc}"
                ) from exc
        raise PcscUnavailableError(f"Sistema operativo no soportado por el adaptador PC/SC: {sys.platform}")

    def _ensure_api(self) -> None:
        if self._lib is not None:
            return
        library = self._load_library()
        self._lib = library
        try:
            self._configure_functions()
        except Exception as exc:
            self._lib = None
            self._types = None
            if isinstance(exc, PcscUnavailableError):
                raise
            raise PcscUnavailableError(f"No se pudo inicializar la API nativa PC/SC: {exc}") from exc

    def _configure_functions(self) -> None:
        windows = sys.platform == "win32"
        if windows:
            long_type = ctypes.c_long  # LONG de Windows tiene 32 bits.
            handle_type = ctypes.c_size_t  # SCARDCONTEXT/SCARDHANDLE son ULONG_PTR.
            self._types = _NativeTypes(long_type, handle_type, "mbcs", True)
            names = {
                "establish": "SCardEstablishContext", "release": "SCardReleaseContext",
                "list_readers": "SCardListReadersA", "connect": "SCardConnectA",
                "disconnect": "SCardDisconnect", "transmit": "SCardTransmit",
            }
        else:
            long_type = ctypes.c_int32
            handle_type = ctypes.c_int32
            self._types = _NativeTypes(long_type, handle_type, "utf-8", False)
            names = {
                "establish": "SCardEstablishContext", "release": "SCardReleaseContext",
                "list_readers": "SCardListReaders", "connect": "SCardConnect",
                "disconnect": "SCardDisconnect", "transmit": "SCardTransmit",
            }

        try:
            self._establish = getattr(self._lib, names["establish"])
            self._release = getattr(self._lib, names["release"])
            self._list_readers = getattr(self._lib, names["list_readers"])
            self._connect = getattr(self._lib, names["connect"])
            self._disconnect = getattr(self._lib, names["disconnect"])
            self._transmit = getattr(self._lib, names["transmit"])
        except AttributeError as exc:
            raise PcscUnavailableError(f"La API PC/SC del sistema está incompleta: {exc}") from exc

        self._establish.restype = long_type
        self._establish.argtypes = [ctypes.c_uint32, ctypes.c_void_p, ctypes.c_void_p,
                                    ctypes.POINTER(handle_type)]
        self._release.restype = long_type
        self._release.argtypes = [handle_type]
        self._list_readers.restype = long_type
        self._list_readers.argtypes = [handle_type, ctypes.c_void_p, ctypes.c_void_p,
                                       ctypes.POINTER(ctypes.c_uint32)]
        self._connect.restype = long_type
        self._connect.argtypes = [handle_type, ctypes.c_char_p, ctypes.c_uint32,
                                  ctypes.c_uint32, ctypes.POINTER(handle_type),
                                  ctypes.POINTER(ctypes.c_uint32)]
        self._disconnect.restype = long_type
        self._disconnect.argtypes = [handle_type, ctypes.c_uint32]
        self._transmit.restype = long_type
        self._transmit.argtypes = [handle_type, ctypes.POINTER(_IoRequest), ctypes.c_void_p,
                                   ctypes.c_uint32, ctypes.POINTER(_IoRequest), ctypes.c_void_p,
                                   ctypes.POINTER(ctypes.c_uint32)]

    @staticmethod
    def _unsigned_code(code: int) -> int:
        return int(code) & 0xFFFFFFFF

    def _ensure_context(self) -> None:
        self._ensure_api()
        assert self._types is not None
        if self._context is not None:
            return
        context = self._types.handle()
        code = self._establish(SCARD_SCOPE_USER, None, None, ctypes.byref(context))
        if self._unsigned_code(code) != SCARD_S_SUCCESS:
            raise PcscUnavailableError(
                f"SCardEstablishContext falló (código 0x{self._unsigned_code(code):08X}). "
                "Comprueba que el servicio PC/SC esté activo."
            )
        self._context = context

    def _list_available_readers(self) -> list[str]:
        self._ensure_context()
        length = ctypes.c_uint32(0)
        code = self._list_readers(self._context, None, None, ctypes.byref(length))
        unsigned = self._unsigned_code(code)
        if unsigned == SCARD_E_NO_READERS_AVAILABLE:
            return []
        if unsigned != SCARD_S_SUCCESS:
            raise PcscOperationError(f"SCardListReaders falló (0x{unsigned:08X}).")
        if length.value == 0:
            return []
        buffer = ctypes.create_string_buffer(length.value)
        code = self._list_readers(self._context, None, ctypes.cast(buffer, ctypes.c_void_p),
                                  ctypes.byref(length))
        unsigned = self._unsigned_code(code)
        if unsigned == SCARD_E_NO_READERS_AVAILABLE:
            return []
        if unsigned != SCARD_S_SUCCESS:
            raise PcscOperationError(f"SCardListReaders falló (0x{unsigned:08X}).")
        assert self._types is not None
        decoded = buffer.raw.decode(self._types.encoding, errors="replace")
        return [item for item in decoded.split("\x00") if item]

    def _read_uid(self, card: Any, protocol: int) -> str:
        request = _IoRequest(protocol, ctypes.sizeof(_IoRequest))
        response_pci = _IoRequest(0, ctypes.sizeof(_IoRequest))
        send_buffer = (ctypes.c_ubyte * len(GET_UID_APDU))(*GET_UID_APDU)
        response_buffer = (ctypes.c_ubyte * 258)()
        response_length = ctypes.c_uint32(len(response_buffer))
        code = self._transmit(
            card, ctypes.byref(request), ctypes.cast(send_buffer, ctypes.c_void_p),
            len(GET_UID_APDU), ctypes.byref(response_pci),
            ctypes.cast(response_buffer, ctypes.c_void_p), ctypes.byref(response_length),
        )
        unsigned = self._unsigned_code(code)
        if unsigned != SCARD_S_SUCCESS:
            raise PcscOperationError(f"SCardTransmit falló (0x{unsigned:08X}).")
        response = bytes(response_buffer[:response_length.value])
        if len(response) < 3:
            raise PcscOperationError("El lector devolvió una respuesta APDU demasiado corta.")
        if response[-2:] != b"\x90\x00":
            raise PcscOperationError(
                f"El lector rechazó la consulta de UID (SW1 SW2={response[-2:].hex().upper()}). "
                "Verifica que el lector soporte el APDU FF CA 00 00 00."
            )
        uid_bytes = response[:-2]
        if not uid_bytes:
            raise PcscOperationError("El lector respondió sin bytes de UID.")
        return uid_bytes.hex().upper()

    def _poll_sync(self, read_uid: bool) -> ReaderObservation:
        try:
            readers = self._list_available_readers()
        except PcscUnavailableError:
            raise
        except Exception as exc:
            return ReaderObservation(False, error=str(exc))

        if not readers:
            return ReaderObservation(False, error="No se detectó ningún lector NFC PC/SC.")
        if self._reader_name:
            matches = [name for name in readers if name == self._reader_name]
            if not matches:
                return ReaderObservation(
                    False, error=f"El lector configurado '{self._reader_name}' no está disponible. "
                                  f"Detectados: {', '.join(readers)}"
                )
            reader_name = matches[0]
        else:
            reader_name = readers[0]

        assert self._types is not None
        card = self._types.handle()
        protocol = ctypes.c_uint32(0)
        encoded_name = reader_name.encode(self._types.encoding, errors="replace")
        code = self._connect(self._context, encoded_name, SCARD_SHARE_SHARED,
                             SCARD_PROTOCOL_T0 | SCARD_PROTOCOL_T1,
                             ctypes.byref(card), ctypes.byref(protocol))
        unsigned = self._unsigned_code(code)
        if unsigned in (SCARD_E_NO_SMARTCARD, SCARD_W_REMOVED_CARD):
            return ReaderObservation(True, reader_name, False)
        if unsigned == SCARD_E_READER_UNAVAILABLE:
            return ReaderObservation(False, reader_name, False,
                                     error="El lector NFC dejó de estar disponible.")
        if unsigned != SCARD_S_SUCCESS:
            return ReaderObservation(
                True, reader_name, False,
                error=f"SCardConnect falló (0x{unsigned:08X}); comprueba el servicio PC/SC y que "
                      "otra aplicación no esté bloqueando el lector."
            )

        uid: str | None = None
        error: str | None = None
        try:
            if read_uid:
                try:
                    uid = self._read_uid(card, int(protocol.value))
                except PcscOperationError as exc:
                    error = str(exc)
            return ReaderObservation(True, reader_name, True, uid, error)
        finally:
            disconnect_code = self._disconnect(card, SCARD_LEAVE_CARD)
            if self._unsigned_code(disconnect_code) not in (SCARD_S_SUCCESS, SCARD_W_REMOVED_CARD):
                logger.debug("SCardDisconnect: 0x%08X", self._unsigned_code(disconnect_code))

    async def poll(self, *, read_uid: bool) -> ReaderObservation:
        # PC/SC es una API bloqueante; se ejecuta fuera del event loop de asyncio.
        return await asyncio.to_thread(self._poll_sync, read_uid)

    def _close_sync(self) -> None:
        if self._context is None:
            return
        context = self._context
        self._context = None
        code = self._release(context)
        unsigned = self._unsigned_code(code)
        if unsigned not in (SCARD_S_SUCCESS,):
            logger.debug("SCardReleaseContext: 0x%08X", unsigned)

    async def close(self) -> None:
        await asyncio.to_thread(self._close_sync)

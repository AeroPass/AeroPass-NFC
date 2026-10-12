from __future__ import annotations

import os
import sys
from dataclasses import dataclass
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def _load_dotenv(path: Path) -> None:
    """Carga un .env sencillo sin dependencias externas; el entorno del SO prevalece."""
    if not path.is_file():
        return
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return
    for line in lines:
        candidate = line.strip()
        if not candidate or candidate.startswith("#") or "=" not in candidate:
            continue
        key, value = candidate.split("=", 1)
        key = key.strip()
        value = value.strip().strip("\"").strip("'")
        if key and key.replace("_", "").isalnum():
            os.environ.setdefault(key, value)


def default_data_dir() -> Path:
    if sys.platform == "win32":
        base = Path(os.environ.get("LOCALAPPDATA", Path.home()))
        return base / "NfcAgent"
    if sys.platform == "darwin":
        return Path.home() / "Library" / "Application Support" / "NfcAgent"
    base = Path(os.environ.get("XDG_DATA_HOME", Path.home() / ".local" / "share"))
    return base / "nfc-agent"


def _parse_int_list(value: str) -> tuple[int, ...]:
    try:
        ports = tuple(dict.fromkeys(int(part.strip()) for part in value.split(",") if part.strip()))
        if not ports or any(port < 1 or port > 65535 for port in ports):
            raise ValueError
        return ports
    except ValueError as exc:
        raise ValueError("NFC_AGENT_PORTS debe contener puertos válidos separados por comas.") from exc


@dataclass(frozen=True, slots=True)
class AgentSettings:
    host: str
    ports: tuple[int, ...]
    allowed_origins: tuple[str, ...]
    auth_token: str | None
    poll_interval: float
    reader_name: str | None
    data_dir: Path

    @classmethod
    def from_env(cls) -> "AgentSettings":
        _load_dotenv(PROJECT_ROOT / ".env")
        host = os.environ.get("NFC_AGENT_HOST", "127.0.0.1").strip() or "127.0.0.1"
        port_text = os.environ.get("NFC_AGENT_PORTS", "8765,8766,8767,8768,8769,8770")
        ports = _parse_int_list(port_text)
        origin_text = os.environ.get(
            "NFC_AGENT_ORIGINS",
            "http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000,http://127.0.0.1:3000",
        )
        origins = tuple(origin.strip() for origin in origin_text.split(",") if origin.strip())
        interval_text = os.environ.get("NFC_AGENT_POLL_INTERVAL", "0.35")
        try:
            interval = float(interval_text)
        except ValueError as exc:
            raise ValueError("NFC_AGENT_POLL_INTERVAL debe ser un número en segundos.") from exc
        if not 0.05 <= interval <= 10:
            raise ValueError("NFC_AGENT_POLL_INTERVAL debe estar entre 0.05 y 10 segundos.")
        data_dir = Path(os.environ.get("NFC_AGENT_DATA_DIR", default_data_dir())).expanduser().resolve()
        token = os.environ.get("NFC_AGENT_TOKEN", "").strip() or None
        if token is not None and len(token) < 16:
            raise ValueError("NFC_AGENT_TOKEN debe tener al menos 16 caracteres si se habilita.")
        reader_name = os.environ.get("NFC_AGENT_READER_NAME", "").strip() or None
        if host not in ("127.0.0.1", "localhost", "::1"):
            # En producción, la API local no debe publicarse en la red por accidente.
            if os.environ.get("NFC_AGENT_ALLOW_REMOTE_BIND", "0") != "1":
                raise ValueError("Por seguridad, NFC_AGENT_HOST debe ser loopback. Para permitir red, configura NFC_AGENT_ALLOW_REMOTE_BIND=1 conscientemente.")
        return cls(host, ports, origins, token, interval, reader_name, data_dir)

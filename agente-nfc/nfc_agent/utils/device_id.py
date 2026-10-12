from __future__ import annotations

import uuid
from pathlib import Path


def get_or_create_device_id(data_dir: Path) -> str:
    data_dir.mkdir(parents=True, exist_ok=True)
    target = data_dir / "device_id.txt"
    if target.exists():
        existing = target.read_text(encoding="utf-8").strip()
        if existing:
            return existing
    device_id = str(uuid.uuid4())
    temporary = target.with_suffix(".tmp")
    temporary.write_text(device_id, encoding="utf-8")
    temporary.replace(target)
    return device_id

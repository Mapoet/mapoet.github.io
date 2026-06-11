#!/usr/bin/env python3
"""Write assets/traj/manifest.json with a fresh updated_at timestamp."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = REPO_ROOT / "assets" / "traj" / "manifest.json"


def main() -> None:
    manifest = {
        "updated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "files": {
            "occultation_events": "occultation_events.json",
            "satellite_orbits": "satellite_orbits.json",
            "visibility_events": "visibility_events.json",
        },
    }
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(MANIFEST_PATH.read_text(encoding="utf-8"))


if __name__ == "__main__":
    main()

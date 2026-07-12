#!/usr/bin/env python3
"""
bridge.py — ROUTER ONLY.

Receives CLI arguments from the TypeScript SDK, determines which action
was requested, delegates to the correct module under py/, and prints a
single JSON line to stdout. No pytubefix logic lives here.

Usage:
    python3 bridge.py <action> <json_payload>

Payload shape:
    {"url": "<youtube_url>", "options": { ... }}

Output shape (always exactly one JSON object on stdout):
    {"error": false, "data": <result>}
    {"error": true, "message": "<msg>", "code": "<CODE>"}
"""
import sys
import json
import os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "py"))

from exceptions import NodeYtApiError  # noqa: E402
from info import get_info  # noqa: E402
from streams import get_streams  # noqa: E402
from download import download  # noqa: E402


def emit(payload: dict) -> None:
    sys.stdout.write(json.dumps(payload))
    sys.stdout.flush()


def main() -> None:
    if len(sys.argv) < 3:
        emit({"error": True, "message": "Missing action or payload", "code": "BAD_REQUEST"})
        sys.exit(1)

    action = sys.argv[1]

    try:
        payload = json.loads(sys.argv[2])
    except json.JSONDecodeError:
        emit({"error": True, "message": "Invalid JSON payload", "code": "BAD_REQUEST"})
        sys.exit(1)

    url = payload.get("url")
    options = payload.get("options") or {}

    try:
        if action == "getInfo":
            result = get_info(url)
        elif action == "getStreams":
            result = get_streams(url)
        elif action == "download":
            result = download(url, options)
        else:
            raise NodeYtApiError(f"Unknown action: {action}", "UNKNOWN_ACTION")

        emit({"error": False, "data": result})
        sys.exit(0)

    except NodeYtApiError as exc:
        emit({"error": True, "message": exc.message, "code": exc.code})
        sys.exit(1)
    except Exception as exc:  # noqa: BLE001 - final safety net, never leak tracebacks
        emit({"error": True, "message": str(exc), "code": "INTERNAL_ERROR"})
        sys.exit(1)


if __name__ == "__main__":
    main()

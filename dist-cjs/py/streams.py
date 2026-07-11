"""Responsible only for stream listing."""
from helpers import build_client, format_stream


def get_streams(url: str) -> list:
    yt = build_client(url)
    return [format_stream(s) for s in yt.streams]

"""Shared utilities used across info.py, streams.py, and download.py.

This is the only place (besides the individual py/ modules) that imports
pytubefix directly, keeping all third-party surface area centralized.
"""
import re

from pytubefix import YouTube as PyTubeFixYouTube
from pytubefix.exceptions import RegexMatchError, VideoUnavailable

from exceptions import InvalidURLError, VideoUnavailableError

# Characters invalid across Windows/macOS/Linux filenames, plus control chars.
_INVALID_CHARS_PATTERN = re.compile(r'[<>:"/\\|?*\x00-\x1f]')


def sanitize_filename(filename: str) -> str:
    """Strip characters that are illegal in filenames on any major OS."""
    sanitized = _INVALID_CHARS_PATTERN.sub("_", filename)
    sanitized = sanitized.strip(" .")
    if not sanitized:
        sanitized = "ytengine_download"
    return sanitized[:200]


def build_client(url: str) -> PyTubeFixYouTube:
    """Construct a pytubefix YouTube client, translating its errors into
    ytengine's own exception types."""
    try:
        return PyTubeFixYouTube(url)
    except RegexMatchError:
        raise InvalidURLError(f"Invalid YouTube URL: {url}")
    except VideoUnavailable:
        raise VideoUnavailableError(f"Video unavailable: {url}")


def format_stream(stream) -> dict:
    """Normalize a pytubefix Stream object into the JSON shape the
    TypeScript SDK expects."""
    return {
        "itag": stream.itag,
        "mimeType": stream.mime_type,
        "type": stream.type,
        "resolution": getattr(stream, "resolution", None),
        "fps": getattr(stream, "fps", None),
        "abr": getattr(stream, "abr", None),
        "codecs": stream.codecs,
        "isProgressive": stream.is_progressive,
        "isAdaptive": stream.is_adaptive,
        "filesize": getattr(stream, "filesize_approx", None),
    }

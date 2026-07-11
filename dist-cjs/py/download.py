"""Responsible only for downloading."""
import os

from exceptions import StreamNotFoundError, DownloadError
from helpers import build_client, sanitize_filename

# downloadVideo() falls back through this priority list before settling
# for whatever the highest available progressive resolution is.
_VIDEO_QUALITY_PRIORITY = ["720p", "480p", "360p"]


def _select_video_stream(yt):
    for quality in _VIDEO_QUALITY_PRIORITY:
        stream = yt.streams.filter(progressive=True, file_extension="mp4", res=quality).first()
        if stream:
            return stream

    stream = yt.streams.get_highest_resolution()
    if not stream:
        raise StreamNotFoundError("No suitable video stream found")
    return stream


def _select_audio_stream(yt):
    stream = yt.streams.get_audio_only()
    if not stream:
        raise StreamNotFoundError("No suitable audio stream found")
    return stream


def _select_custom_stream(yt, itag):
    stream = yt.streams.get_by_itag(itag)
    if not stream:
        raise StreamNotFoundError(f"No stream found for itag {itag}")
    return stream


def download(url: str, options: dict) -> dict:
    yt = build_client(url)

    mode = options.get("mode", "custom")
    output_dir = options.get("outputDir") or os.getcwd()
    itag = options.get("itag")

    if mode == "video":
        stream = _select_video_stream(yt)
    elif mode == "audio":
        stream = _select_audio_stream(yt)
    elif itag is not None:
        stream = _select_custom_stream(yt, itag)
    else:
        raise StreamNotFoundError("No itag or mode provided for download")

    extension = "m4a" if stream.type == "audio" else (stream.subtype or "mp4")
    filename = f"{sanitize_filename(yt.title)}.{extension}"

    try:
        filepath = stream.download(output_path=output_dir, filename=filename)
    except Exception as exc:  # noqa: BLE001
        raise DownloadError(str(exc))

    return {
        "path": filepath,
        "quality": getattr(stream, "resolution", None) or getattr(stream, "abr", None),
        "itag": stream.itag,
        "success": True,
    }

"""Custom exceptions for ytengine's Python execution engine.

Every exception carries a stable `code` that bridge.py forwards to
TypeScript so YTEngineError instances have machine-checkable codes,
independent of message text.
"""


class YTEngineError(Exception):
    def __init__(self, message: str, code: str = "NODETUBE_ERROR"):
        super().__init__(message)
        self.message = message
        self.code = code


class InvalidURLError(YTEngineError):
    def __init__(self, message: str = "Invalid YouTube URL"):
        super().__init__(message, "INVALID_URL")


class VideoUnavailableError(YTEngineError):
    def __init__(self, message: str = "Video is unavailable"):
        super().__init__(message, "VIDEO_UNAVAILABLE")


class StreamNotFoundError(YTEngineError):
    def __init__(self, message: str = "Requested stream not found"):
        super().__init__(message, "STREAM_NOT_FOUND")


class DownloadError(YTEngineError):
    def __init__(self, message: str = "Download failed"):
        super().__init__(message, "DOWNLOAD_FAILED")

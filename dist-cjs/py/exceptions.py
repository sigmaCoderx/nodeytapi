"""Custom exceptions for nodeytapi's Python execution engine.

Every exception carries a stable `code` that bridge.py forwards to
TypeScript so NodeYtApiError instances have machine-checkable codes,
independent of message text.
"""


class NodeYtApiError(Exception):
    def __init__(self, message: str, code: str = "NODETUBE_ERROR"):
        super().__init__(message)
        self.message = message
        self.code = code


class InvalidURLError(NodeYtApiError):
    def __init__(self, message: str = "Invalid YouTube URL"):
        super().__init__(message, "INVALID_URL")


class VideoUnavailableError(NodeYtApiError):
    def __init__(self, message: str = "Video is unavailable"):
        super().__init__(message, "VIDEO_UNAVAILABLE")


class StreamNotFoundError(NodeYtApiError):
    def __init__(self, message: str = "Requested stream not found"):
        super().__init__(message, "STREAM_NOT_FOUND")


class DownloadError(NodeYtApiError):
    def __init__(self, message: str = "Download failed"):
        super().__init__(message, "DOWNLOAD_FAILED")

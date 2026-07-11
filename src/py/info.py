"""Responsible only for metadata retrieval."""
from helpers import build_client


def get_info(url: str) -> dict:
    yt = build_client(url)
    return {
        "title": yt.title,
        "author": yt.author,
        "channelId": yt.channel_id,
        "channelUrl": yt.channel_url,
        "description": yt.description,
        "thumbnail": yt.thumbnail_url,
        "views": yt.views,
        "duration": yt.length,
        "publishDate": yt.publish_date.isoformat() if yt.publish_date else None,
        "keywords": yt.keywords,
        "rating": getattr(yt, "rating", None),
        "videoId": yt.video_id,
        "url": yt.watch_url,
    }

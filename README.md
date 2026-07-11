# nodeytapi

A TypeScript wrapper for the Python library **pytubefix**.

It lets Node.js developers download YouTube videos, audio, fetch metadata and available streams without writing any Python. Everything is handled internally through a small Python bridge, so you only work with a clean TypeScript API.

## Features

- Download videos
- Download audio
- Get video metadata
- List available streams
- Automatic quality selection
- Async API
- Powered by pytubefix
- Cross-platform (Windows, Linux and macOS)

## Installation

```bash
npm install nodeytapi
```

Python 3 is required.

During installation, nodeytapi will automatically create an isolated Python virtual environment and install **pytubefix** inside it, so it won't mess with your global Python setup.

If it fails, you can install it manually:

```bash
python3 -m pip install pytubefix
```

More installation details are available in [docs/INSTALL.md](docs/INSTALL.md).

---

## Quick Start

```ts
import { YouTube } from "nodeytapi";

const yt = new YouTube(
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
);

await yt.getInfo();

console.log(yt.title);
// Patoranking - BABYLON [Feat. Victony] (Official Music Video)
console.log(yt.author);
// Patoranking
console.log(yt.views);
// 51172744
console.log(yt.thumbnail);
// https://i.ytimg.com/vi/7b0ETFcWrgY/sddefault.jpg?v=654299b8
await yt.downloadVideo();
// returns downloaded video
await yt.downloadAudio();
// returns downloaded audio
```

---

## API

### Create a YouTube object

```ts
const yt = new YouTube(url);
```

---

### Get metadata

```ts
const info = await yt.getInfo();
console.log(info);
```

Returns information such as:

```ts
{
    title,
    author,
    description,
    thumbnail,
    views,
    duration,
    publishDate,
    channelId,
    videoId
}
```

Metadata is cached after the first request.

That means these won't call Python again:

```ts
yt.title
yt.author
yt.thumbnail
yt.views
yt.duration
yt.publishDate
```

---

### Get available streams

```ts
const streams = await yt.getStreams();
```

Returns every available audio/video stream with its:

- itag
- resolution
- mime type
- codecs
- fps
- bitrate
- filesize

---

### Download a specific stream

```ts
await yt.download({
    itag: 22
});
```

---

### Download video

```ts
await yt.downloadVideo();
```

Automatically selects:

```
720p
↓

480p
↓

360p
↓

Highest available progressive stream
```

Downloads the file into the current working directory.

---

### Download audio

```ts
await yt.downloadAudio();
```

Downloads the highest quality audio stream available.

---

### Download result

```ts
{
    path,
    quality,
    itag,
    success
}
```

Downloaded files keep the original YouTube title.

Example:

```
Patoranking - BABYLON [Feat. Victony] (Official Music Video).mp4

Patoranking - BABYLON [Feat. Victony] (Official Music Video).m4a
```

Invalid filename characters are removed automatically.

---

## Error Handling

Every error is returned as a single JavaScript error.

```ts
try {
    await yt.downloadVideo();
} catch (err) {
    if (err instanceof YTEngineError) {
        console.log(err.code);
        console.log(err.message);
    }
}
```

Common error codes:

- INVALID_URL
- VIDEO_UNAVAILABLE
- STREAM_NOT_FOUND
- DOWNLOAD_FAILED
- PYTHON_NOT_FOUND
- PROCESS_ERROR
- PARSE_ERROR

---

## Architecture

```
src/

├── index.ts
├── YouTube.ts
├── bridge.py
└── py/
    ├── info.py
    ├── streams.py
    ├── download.py
    ├── helpers.py
    └── exceptions.py
```

`YouTube.ts` is the only public API.

`bridge.py` routes requests from TypeScript to Python.

Only the files inside `py/` use **pytubefix**.

This keeps the public API simple while making it easy to add new features later.

---

## Build

```bash
npm install
npm run build
```

---

## Roadmap

Planned features:

- Playlist support
- Subtitle download
- Thumbnail download
- Progress callbacks
- Proxy support
- Cookie support
- Custom output directory
- Retry mechanism
- Parallel downloads

---

---
Contact the dev: 
---
Telegram: https://t.me/flippedCoin


## License

MIT

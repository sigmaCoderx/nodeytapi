# Installation Guide

## Prerequisites

Before installing ytengine, make sure you have:

- Node.js 16 or newer
- Python 3 installed and available on your PATH

## Install ytengine

```bash
npm install ytengine
```

## Python dependency setup

ytengine uses pytubefix through its Python bridge. During installation, the package will try to ensure that pytubefix is installed for the active Python interpreter.

If Python is already installed, this usually works automatically. If not, install Python 3 first and then reinstall ytengine.

### Manual fallback

If the automatic setup does not work, run:

```bash
python3 -m pip install pytubefix
```

or, if you use a virtual environment:

```bash
python -m pip install pytubefix
```

## Verification

After installation, you can confirm the setup by running:

```bash
node -e "const { YouTube } = require('ytengine'); console.log(typeof YouTube)"
```

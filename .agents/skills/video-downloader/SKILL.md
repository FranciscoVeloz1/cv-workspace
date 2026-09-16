---
name: video-downloader
description: Use when the user asks to download a YouTube watch URL as mp4 or mp3, save a YouTube video or audio file, rip audio from a YouTube link, or run the video-downloader / downloader CLI.
---

# video-downloader

Download **one public YouTube watch URL** with `repos/utils/video-downloader` (`downloader`). Do not use pytube, youtube-dl, a raw `yt-dlp` command, `wget`/`curl`, Playwright, or the browser “Save video” path.

Personal use only. YouTube terms and copyright still apply. This CLI does not bypass DRM, logins, cookies, or age gates.

## Inputs

Resolve from the user message. `url` is required — ask if missing. Do not invent a URL.

| Input | Default | Maps to |
|-------|---------|---------|
| `url` | none | positional |
| `format` | `mp4` (`mp3` if they say audio / mp3 / podcast / soundtrack) | `-f` |
| `quality` | `best` | `-q` (`360` `480` `720` `1080` `best`) |
| `out` | `$HOME/Downloads` | `-o` |

Parse quality from talk: `720p` → `720`, `1080p` → `1080`, `low` → `360`. For **mp3**, the same flag is bitrate: `360`=64kbps, `480`=128, `720`=192, `1080`=256, `best`=best available.

Reject playlists (`list=` or `/playlist`). One URL per invoke. Several URLs → run the CLI once per watch link.

## Invoke

Workspace: `/home/francisco/repos/cv-workspace`. Package: `repos/utils/video-downloader`.

Prefer the venv binary (PATH may be empty in the sandbox):

```bash
BIN="repos/utils/video-downloader/.venv/bin/downloader"
"$BIN" "$URL" -f mp4 -q best -o "$HOME/Downloads"
```

If `BIN` is missing:

```bash
cd repos/utils/video-downloader
/home/francisco/.local/bin/python3.11 -m venv .venv
.venv/bin/pip install -e .
```

Then rerun `BIN`. Python **3.11+**. `ffmpeg` must be on `PATH` (`sudo apt install ffmpeg`).

Shell needs **network** (`full_network` or `all`). Downloads can take minutes — raise `block_until_ms` (start around 120000; increase if the process is still running).

Success: exit `0`; **stdout is the output file path**. Confirm that file exists. Reply with that path (and size if cheap). Do not dump the media.

| Exit | Meaning |
|------|---------|
| `0` | wrote the file; stdout path |
| `2` | bad URL/format/quality; stderr is the reason — fix args or ask, do not switch tools |
| `1` | download/ffmpeg failure |

If stderr is `ffmpeg not found on PATH. Install ffmpeg and re-run.`, tell the user to install ffmpeg. Do not retry with another downloader.

## Do not

- Playlists, subtitles, cookies, batch files, extra yt-dlp flags
- Commit `.venv`, downloaded media, or `.env`
- Change CLI format/quality mapping unless the user asked to change the tool

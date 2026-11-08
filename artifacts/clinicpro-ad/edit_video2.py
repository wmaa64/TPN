"""Add a spoken Egyptian Arabic promo and specialty label to video2.mp4."""

import asyncio
import re
import subprocess
from pathlib import Path

from gtts import gTTS
from imageio_ffmpeg import get_ffmpeg_exe


ROOT = Path(__file__).resolve().parent
SOURCE = Path(r"F:\vbprojects\Dermatology Posts\compain5\images\video2.mp4")
OUTPUT = ROOT / "ClinicPro-Video2-Arabic-Voiceover.mp4"
VOICE_FILE = ROOT / "video2-arabic-voiceover.mp3"
SCRIPT = (
    "عيادتك بتخسر فلوس؟ ClinicPro لعيادات الجلدية ومراكز الليزر والتجميل. "
    "تابع مرضاك وإيراداتك ومخزونك بسهولة. جرّب مجاناً تلات أيام."
)


async def create_voiceover():
    # Keep the visible copy untouched; this is a separate voice track.
    gTTS(text=SCRIPT, lang="ar", slow=False).save(str(VOICE_FILE))


def probe_duration(path):
    ffmpeg = get_ffmpeg_exe()
    result = subprocess.run(
        [ffmpeg, "-hide_banner", "-i", str(path), "-f", "null", "-"],
        capture_output=True,
        text=True,
        check=False,
    )
    match = re.search(r"Duration: (\d+):(\d+):(\d+(?:\.\d+)?)", result.stderr)
    if not match:
        raise RuntimeError(f"Could not read media duration for {path}")
    hours, minutes, seconds = match.groups()
    return int(hours) * 3600 + int(minutes) * 60 + float(seconds)


async def main():
    if not SOURCE.is_file():
        raise FileNotFoundError(SOURCE)

    await create_voiceover()
    voice_duration = probe_duration(VOICE_FILE)
    # Leave a short tail at the end of the original 15-second video.
    tempo = max(1.0, voice_duration / 14.6)
    if tempo > 1.32:
        raise RuntimeError(
            f"The narration is too long to fit naturally ({voice_duration:.1f}s)."
        )

    ffmpeg = get_ffmpeg_exe()
    specialty = "عيادات الجلدية ومراكز الليزر والتجميل"
    filter_graph = (
        "[0:v]"
        "drawbox=x=70:y=538:w=940:h=68:color=0x061b3f@0.82:t=fill,"
        f"drawtext=fontfile='C\\:/Windows/Fonts/tahoma.ttf':text='{specialty}':"
        "text_shaping=1:fontcolor=white:fontsize=28:"
        "x=(w-text_w)/2:y=556[v];"
        "[0:a]volume=0.20[bg];"
        f"[1:a]atempo={tempo:.4f},volume=1.15[voice];"
        "[bg][voice]amix=inputs=2:duration=first:dropout_transition=1,"
        "alimiter=limit=0.95[outa]"
    )
    subprocess.run(
        [
            ffmpeg,
            "-hide_banner",
            "-loglevel",
            "warning",
            "-y",
            "-i",
            str(SOURCE),
            "-i",
            str(VOICE_FILE),
            "-filter_complex",
            filter_graph,
            "-map",
            "[v]",
            "-map",
            "[outa]",
            "-t",
            "15",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "18",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-movflags",
            "+faststart",
            str(OUTPUT),
        ],
        check=True,
    )
    print(f"Created {OUTPUT}")
    print(f"Voiceover length: {voice_duration:.2f}s; tempo: {tempo:.2f}x")


if __name__ == "__main__":
    asyncio.run(main())

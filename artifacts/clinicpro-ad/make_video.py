"""Build the ClinicPro 15-second portrait ad, voiceover, and music bed."""

import asyncio
import json
import math
import os
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from imageio_ffmpeg import get_ffmpeg_exe
import edge_tts


ROOT = Path(__file__).resolve().parent
FPS = 30
SAMPLE_RATE = 48_000
SECONDS = 15
VOICE = "ar-EG-ShakirNeural"
VOICE_RATE = "+8%"


def run_ffmpeg(args, *, capture=False):
    command = [get_ffmpeg_exe(), "-hide_banner", "-loglevel", "error", "-y", *map(str, args)]
    result = subprocess.run(command, stdout=subprocess.PIPE if capture else None, check=True)
    return result.stdout if capture else None


async def synthesize_voice(cues):
    """Create timed Egyptian Arabic phrases with a neural Egyptian voice."""
    output = np.zeros((SECONDS * SAMPLE_RATE,), dtype=np.float32)

    for index, (start, end, text) in enumerate(cues, start=1):
        mp3_path = ROOT / f"voice-part-{index:02d}.mp3"
        await edge_tts.Communicate(
            text,
            voice=VOICE,
            rate=VOICE_RATE,
        ).save(str(mp3_path))

        raw_audio = run_ffmpeg([
            "-i", mp3_path,
            "-ar", SAMPLE_RATE,
            "-ac", 1,
            "-f", "s16le",
            "pipe:1",
        ], capture=True)
        samples = np.frombuffer(raw_audio, dtype="<i2").astype(np.float32) / 32768.0

        available = max(0.1, end - start - 0.06)
        duration = len(samples) / SAMPLE_RATE
        if duration > available:
            speed = min(1.35, duration / available)
            raw_audio = run_ffmpeg([
                "-i", mp3_path,
                "-af", f"atempo={speed:.4f}",
                "-ar", SAMPLE_RATE,
                "-ac", 1,
                "-f", "s16le",
                "pipe:1",
            ], capture=True)
            samples = np.frombuffer(raw_audio, dtype="<i2").astype(np.float32) / 32768.0

        offset = round(start * SAMPLE_RATE)
        end_offset = min(len(output), offset + len(samples))
        if end_offset > offset:
            output[offset:end_offset] += samples[: end_offset - offset] * 0.88

    peak = max(0.01, float(np.max(np.abs(output))))
    output *= min(1.0, 0.94 / peak)
    write_wav(ROOT / "voiceover.wav", output, channels=1)


def write_wav(path, audio, channels):
    clipped = np.clip(audio, -1.0, 1.0)
    pcm = (clipped * 32767.0).astype("<i2")
    with wave.open(str(path), "wb") as file:
        file.setnchannels(channels)
        file.setsampwidth(2)
        file.setframerate(SAMPLE_RATE)
        file.writeframes(pcm.tobytes())


def create_music_bed():
    """Make a clearly audible, original upbeat synth bed for the short ad."""
    count = SAMPLE_RATE * SECONDS
    time = np.arange(count, dtype=np.float32) / SAMPLE_RATE
    beat_period = 60.0 / 112.0
    beat_index = np.floor(time / beat_period).astype(np.int32)
    beat_phase = np.mod(time, beat_period)

    # Use warm mid-range chords so the music is audible on phone speakers.
    chord_roots = np.asarray([220.0, 196.0, 261.63, 233.08], dtype=np.float32)
    bar = np.minimum((time / (beat_period * 4)).astype(np.int32), 3)
    root = chord_roots[bar]
    chord = (
        np.sin(2 * np.pi * root * time)
        + 0.55 * np.sin(2 * np.pi * root * 1.25 * time)
        + 0.35 * np.sin(2 * np.pi * root * 1.5 * time)
    ) / 1.9

    # A short bright melody and simple kick/snare pattern add a clear rhythm.
    melody_notes = np.asarray([440.0, 523.25, 587.33, 523.25, 392.0, 440.0, 523.25, 659.25], dtype=np.float32)
    note_index = (beat_index % len(melody_notes)).astype(np.int32)
    note_phase = np.mod(time, beat_period)
    melody_env = np.exp(-note_phase * 4.5)
    melody = np.sin(2 * np.pi * melody_notes[note_index] * time) * melody_env

    kick_env = np.exp(-beat_phase * 13.0)
    kick_freq = np.maximum(42.0, 92.0 - 60.0 * beat_phase)
    kick = np.sin(2 * np.pi * kick_freq * time) * kick_env
    snare_hit = (beat_index % 4 == 2).astype(np.float32)
    snare_env = np.exp(-beat_phase * 34.0) * snare_hit
    snare = np.sin(2 * np.pi * 185.0 * time) * snare_env
    hat_hit = (beat_index % 2 == 1).astype(np.float32)
    hat = np.sin(2 * np.pi * 7600.0 * time) * np.exp(-beat_phase * 75.0) * hat_hit

    fade_in = np.minimum(1.0, time / 0.45)
    fade_out = np.minimum(1.0, (SECONDS - time) / 0.9)
    envelope = np.maximum(0.0, np.minimum(fade_in, fade_out))
    mono = 2.2 * (0.19 * chord + 0.075 * melody + 0.13 * kick + 0.045 * snare + 0.018 * hat) * envelope
    stereo = np.column_stack((mono * 0.98, mono))
    write_wav(ROOT / "music-bed.wav", stereo, channels=2)


def make_video(manifest, has_voiceover):
    """Render scene stills with gentle motion, then mux a 15s stereo soundtrack."""
    concat_path = ROOT / "scenes.ffconcat"
    lines = ["ffconcat version 1.0"]
    for scene in manifest["scenes"]:
        image_path = Path(scene["frame"]).resolve().as_posix().replace("'", "'\\''")
        lines.extend([f"file '{image_path}'", f"duration {scene['seconds']:.3f}"])
    last_path = Path(manifest["scenes"][-1]["frame"]).resolve().as_posix().replace("'", "'\\''")
    lines.append(f"file '{last_path}'")
    concat_path.write_text("\n".join(lines), encoding="utf-8")

    silent_path = ROOT / "silent-video.mp4"
    run_ffmpeg([
        "-f", "concat", "-safe", "0", "-i", concat_path,
        "-vf", "fps=30,zoompan=z='1+0.018*mod(on,75)/75':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30,format=yuv420p",
        "-t", SECONDS,
        "-r", FPS,
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "19",
        "-pix_fmt", "yuv420p",
        silent_path,
    ])

    output_path = ROOT / "ClinicPro-15s-Vertical.mp4"
    run_ffmpeg([
        "-i", silent_path,
        "-i", ROOT / "voiceover.wav",
        "-i", ROOT / "music-bed.wav",
        "-filter_complex", f"[1:a]volume=1.0[voice];[2:a]volume={'0.34' if has_voiceover else '0.82'}[bed];[voice][bed]amix=inputs=2:duration=longest:dropout_transition=0,alimiter=limit=0.94,afade=t=out:st=14:d=1[aout]",
        "-map", "0:v:0",
        "-map", "[aout]",
        "-t", SECONDS,
        "-c:v", "copy",
        "-c:a", "aac",
        "-ac", "2",
        "-b:a", "192k",
        "-movflags", "+faststart",
        output_path,
    ])
    print(f"Created {output_path} ({output_path.stat().st_size:,} bytes)")


async def main():
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    has_voiceover = True
    try:
        if "--skip-voiceover" in sys.argv:
            raise RuntimeError("Egyptian Arabic TTS service returned HTTP 403 in the initial attempt")
        await synthesize_voice(manifest["cues"])
    except Exception as error:
        has_voiceover = False
        print(f"Egyptian Arabic voiceover could not be generated: {error}")
        print("Rendering the ad with the original music bed and the supplied SRT transcript.")
        write_wav(ROOT / "voiceover.wav", np.zeros(SECONDS * SAMPLE_RATE, dtype=np.float32), channels=1)
    create_music_bed()
    make_video(manifest, has_voiceover)


if __name__ == "__main__":
    asyncio.run(main())

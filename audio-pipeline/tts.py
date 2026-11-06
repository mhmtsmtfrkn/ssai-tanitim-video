"""Offline Turkish robot narration: espeak-ng (ctypes) + ffmpeg robot FX.
Writes one wav per line plus durations.json."""
import ctypes, json, subprocess, sys, wave, os
import numpy as np
import espeakng_loader as el

OUT = os.path.join(os.path.dirname(__file__), "audio")
os.makedirs(OUT, exist_ok=True)

LINES = json.load(open(os.path.join(os.path.dirname(__file__), "script.json")))

lib = ctypes.CDLL(el.get_library_path())
CB = ctypes.CFUNCTYPE(ctypes.c_int, ctypes.POINTER(ctypes.c_short), ctypes.c_int, ctypes.c_void_p)
lib.espeak_Initialize.restype = ctypes.c_int
sr = lib.espeak_Initialize(2, 0, el.get_data_path().encode(), 0)  # AUDIO_OUTPUT_SYNCHRONOUS
buf = []

@CB
def cb(wav, n, ev):
    if n > 0:
        buf.append(np.ctypeslib.as_array(wav, shape=(n,)).copy())
    return 0

lib.espeak_SetSynthCallback(cb)
lib.espeak_SetVoiceByName(b"tr+m3")
lib.espeak_SetParameter(1, 148, 0)   # rate
lib.espeak_SetParameter(3, 42, 0)    # pitch
lib.espeak_SetParameter(4, 30, 0)    # range (flatter = more robotic)
lib.espeak_SetParameter(2, 100, 0)   # volume

durs = {}
for item in LINES:
    buf.clear()
    t = item["say"].encode("utf-8")
    lib.espeak_Synth(t, len(t) + 1, 0, 1, 0, 1, None, None)
    lib.espeak_Synchronize()
    pcm = np.concatenate(buf) if buf else np.zeros(1, np.int16)
    raw = os.path.join(OUT, f"{item['id']}_raw.wav")
    with wave.open(raw, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(pcm.tobytes())
    out = os.path.join(OUT, f"{item['id']}.wav")
    fx = ("highpass=f=90,"
          "asetrate=%d*0.94,aresample=48000,atempo=1.064,"
          "chorus=0.6:0.85:18|26:0.35|0.25:0.3|0.4:1.6|1.9,"
          "flanger=delay=1.5:depth=1.2:regen=-20:width=55:speed=0.25,"
          "aecho=0.8:0.5:14|28:0.25|0.15,"
          "equalizer=f=2800:t=q:w=1.2:g=4,"
          "acompressor=threshold=-18dB:ratio=4:attack=5:release=80,"
          "loudnorm=I=-16:TP=-1.5:LRA=7" % sr)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", fx, "-ac", "2", out], check=True)
    d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                      "-of", "csv=p=0", out]).decode())
    durs[item["id"]] = round(d, 3)
    os.remove(raw)
    print(item["id"], durs[item["id"]])

json.dump(durs, open(os.path.join(OUT, "durations.json"), "w"), indent=1)
print("total", round(sum(durs.values()), 2))

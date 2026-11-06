"""Timeline + voice stem + mouth envelope + procedural cinematic score + final mix."""
import json, os, subprocess, wave
import numpy as np

HERE = os.path.dirname(__file__)
AUD = os.path.join(HERE, "audio")
SR, FPS = 48000, 30
script = json.load(open(os.path.join(HERE, "script.json")))
durs = json.load(open(os.path.join(AUD, "durations.json")))

def read(p):
    out = subprocess.check_output(["ffmpeg", "-v", "error", "-i", p, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"])
    return np.frombuffer(out, np.float32).copy()

# ---- timeline
LEAD, GAP = 0.6, 0.9
scenes, t = [], 0.0
for i, s in enumerate(script):
    length = durs[s["id"]] + GAP + (LEAD if i == 0 else 0) + (1.8 if i == len(script) - 1 else 0)
    vstart = t + (LEAD if i == 0 else 0.25)
    scenes.append({**s, "start": round(t, 3), "length": round(length, 3), "vstart": round(vstart, 3),
                   "vdur": durs[s["id"]]})
    t += length
TOTAL = t
N = int(round(TOTAL * SR))

voice = np.zeros(N, np.float32)
for s in scenes:
    v = read(os.path.join(AUD, s["id"] + ".wav"))
    a = int(s["vstart"] * SR)
    voice[a:a + len(v)] += v[: N - a]

# mouth envelope per frame (0..1)
nf = int(np.ceil(TOTAL * FPS))
hop = SR // FPS
env = np.array([np.sqrt(np.mean(voice[i * hop:(i + 1) * hop] ** 2) + 1e-12) for i in range(nf)])
env = np.clip(env / (np.percentile(env[env > 1e-3], 95) + 1e-9), 0, 1)
env = np.convolve(env, [0.25, 0.5, 0.25], "same")

json.dump({"fps": FPS, "total": round(TOTAL, 3), "frames": nf, "scenes": scenes,
           "mouth": [round(float(x), 3) for x in env]},
          open(os.path.join(HERE, "timeline.json"), "w"), ensure_ascii=False)

# ---- score
tt = np.arange(N) / SR
rng = np.random.default_rng(7)

def lp(x, a):  # one-pole lowpass
    y = np.empty_like(x); acc = 0.0
    for i in range(0, len(x), 4096):
        seg = x[i:i + 4096]
        out = np.empty_like(seg)
        for j, v in enumerate(seg):
            acc += a * (v - acc); out[j] = acc
        y[i:i + 4096] = out
    return y

def saw(f, ph=0):
    return 2 * ((tt * f + ph) % 1.0) - 1

# chord per scene (A minor-ish cinematic progression)
prog = [[45, 52, 57, 60], [41, 48, 53, 57], [48, 55, 60, 64], [43, 50, 55, 59],
        [45, 52, 57, 60], [41, 48, 53, 57], [38, 45, 50, 53], [43, 50, 55, 59],
        [40, 47, 52, 56], [45, 52, 57, 64]]
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
pad = np.zeros(N, np.float32)
for k, s in enumerate(scenes):
    a, b = int(s["start"] * SR), int((s["start"] + s["length"]) * SR)
    seg = np.zeros(b - a, np.float32)
    ts = tt[a:b]
    for m in prog[k % len(prog)]:
        f = mtof(m)
        for d in (-0.12, 0.0, 0.11):
            seg += (2 * ((ts * f * (1 + d / 100) + rng.random()) % 1.0) - 1) * 0.05
    fade = np.minimum(1, np.minimum((ts - ts[0]) / 0.6, (ts[-1] - ts) / 0.6 + 0.0))
    pad[a:b] += seg * np.clip(fade, 0, 1)
pad = lp(lp(pad, 0.035), 0.05) * 3.0

sub = np.sin(2 * np.pi * 55 * tt) * 0.10 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * tt))

# soft pulse 96 bpm from scene 1 to before outro
beat = 60 / 96
kick = np.zeros(N, np.float32)
k_len = int(0.35 * SR); kt = np.arange(k_len) / SR
kick_snd = np.sin(2 * np.pi * (48 + 90 * np.exp(-kt * 30)) * kt) * np.exp(-kt * 9) * 0.45
p0, p1 = scenes[1]["start"], scenes[-1]["start"]
x = p0
while x < p1:
    i = int(x * SR); kick[i:i + k_len] += kick_snd[: N - i]; x += beat
hat = np.zeros(N, np.float32)
h_len = int(0.05 * SR)
x = p0 + beat / 2
while x < p1:
    i = int(x * SR); n = rng.standard_normal(h_len) * np.exp(-np.arange(h_len) / SR * 90) * 0.04
    hat[i:i + h_len] += n[: N - i]; x += beat
hat = hat - lp(hat, 0.3)

# transitions: riser + impact
fx = np.zeros(N, np.float32)
for s in scenes[1:]:
    b = int(s["start"] * SR); a = max(0, b - int(0.8 * SR))
    n = rng.standard_normal(b - a).astype(np.float32)
    ramp = np.linspace(0, 1, b - a) ** 2
    fx[a:b] += (n - lp(n, 0.2)) * ramp * 0.12
for s in (scenes[0], scenes[-1]):
    i = int((s["start"] + 0.05) * SR); L = int(2.5 * SR); it = np.arange(L) / SR
    boom = (np.sin(2 * np.pi * (38 + 60 * np.exp(-it * 6)) * it) * np.exp(-it * 1.6) * 0.6)
    fx[i:i + L] += boom[: N - i].astype(np.float32)

music = pad + sub + kick + hat + fx
fade_out = np.clip((TOTAL - tt) / 2.0, 0, 1); fade_in = np.clip(tt / 0.3, 0, 1)
music = (music * fade_in * fade_out).astype(np.float32)

def wr(p, x):
    x = np.clip(x, -1, 1)
    st = np.stack([x, x], 1)
    with wave.open(p, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())

wr(os.path.join(AUD, "voice_stem.wav"), voice * 0.9)
wr(os.path.join(AUD, "music_stem.wav"), music * 0.6)
mix = os.path.join(AUD, "mix.wav")
subprocess.run(["ffmpeg", "-y", "-v", "error",
                "-i", os.path.join(AUD, "music_stem.wav"), "-i", os.path.join(AUD, "voice_stem.wav"),
                "-filter_complex",
                "[1:a]asplit=2[v][sc];[0:a][sc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=300[m];"
                "[m]volume=0.55[m2];[m2][v]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1:LRA=9",
                "-ar", "48000", mix], check=True)
print("total", round(TOTAL, 2), "frames", nf)

# TOWER 13 — synthesized sound design (all original, no samples). 48 kHz stereo WAVs into rp/public/t13/sfx/.
# Layers: jungle bed (crickets, frogs, wind, owl, twigs), radio (squelch, static, PTT click, roger beep), tower foley
# (creaks, ladder steps), procession (drone, lantern clinks, shuffles, breath choir), stingers (reverse swell, sub drop,
# light-out "tink"), score (drone pad + heartbeat), water, torch click, montage tape-rewind whoosh.
import numpy as np, os
from scipy.signal import butter, sosfilt, fftconvolve
SR = 48000; OUT = "engine/public/t13/sfx/"; os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(13)
def t(d): return np.arange(int(d * SR)) / SR
def bp(x, lo, hi, o=4): return sosfilt(butter(o, [lo, hi], "band", fs=SR, output="sos"), x)
def lp(x, f, o=4): return sosfilt(butter(o, f, "low", fs=SR, output="sos"), x)
def hp(x, f, o=4): return sosfilt(butter(o, f, "high", fs=SR, output="sos"), x)
def env(n, a, r, curve=3.0):
    e = np.ones(n); A = min(n, max(1, int(a * SR))); Rr = min(n, max(1, int(r * SR))); e[:A] = np.linspace(0, 1, A) ** 2
    e[-Rr:] *= np.linspace(1, 0, Rr) ** curve; return e
def pink(n):
    w = rng.standard_normal(n); f = np.fft.rfft(w); k = np.arange(len(f)); k[0] = 1; return np.fft.irfft(f / np.sqrt(k), n)
def reverb(x, dur=2.5, decay=3.0, wet=0.35):
    wet = wet * 0.4; dur = min(dur, 1.0); decay = max(decay, 4.0)
    n = int(dur * SR); ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * decay); ir = lp(ir, 6000); ir /= np.abs(ir).sum() ** 0.5 * 6
    y = fftconvolve(x, ir)[: len(x) + n]; out = np.zeros(len(y)); out[: len(x)] += x * (1 - wet); return out + y * wet
def norm(x, peak=0.9): m = np.abs(x).max(); return x * (peak / m) if m > 0 else x
def st(x, pan=0.0, width=0.0):
    l = x * np.sqrt(0.5 * (1 - pan)); r = x * np.sqrt(0.5 * (1 + pan))
    if width: d = int(width * SR); r = np.concatenate([np.zeros(d), r])[: len(l)]
    return np.stack([l, r], 1)
def save(name, x):
    import wave
    if x.ndim == 1: x = st(x)
    x = np.clip(x, -1, 1); d = (x * 32767).astype("<i2")
    with wave.open(OUT + name + ".wav", "wb") as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(d.tobytes())

# ---------- jungle bed (60 s loop) ----------
def jungle(D=60.0, night=True):
    n = int(D * SR); L = np.zeros(n); R = np.zeros(n)
    wind = lp(pink(n), 900) * 0.25 + bp(pink(n), 1500, 4000) * 0.04
    wind *= 0.6 + 0.4 * np.sin(2 * np.pi * np.arange(n) / SR / 9.0 + 1) ** 2
    L += wind; R += np.roll(wind, 2400)
    if night:
        for c in range(14):  # crickets: each a pulse train at its own carrier/rate, panned
            fc = rng.uniform(3800, 6800); rate = rng.uniform(14, 32); duty = rng.uniform(0.25, 0.5); pan = rng.uniform(-0.9, 0.9); amp = rng.uniform(0.02, 0.06)
            tt = np.arange(n) / SR; gate = (np.mod(tt * rate, 1) < duty).astype(float); chirp_on = (np.mod(tt / rng.uniform(0.8, 2.4) + rng.random(), 1) < rng.uniform(0.3, 0.7)).astype(float)
            s = np.sin(2 * np.pi * fc * tt) * lp(gate * chirp_on, 400) * amp; L += s * np.sqrt(0.5 * (1 - pan)); R += s * np.sqrt(0.5 * (1 + pan))
        for k in range(int(D / 1.7)):  # frogs: low croaks
            t0 = rng.uniform(0, D - 1); d = rng.uniform(0.12, 0.3); i0 = int(t0 * SR); tt = t(d); f0 = rng.uniform(140, 320)
            s = np.sign(np.sin(2 * np.pi * f0 * tt)) * (np.sin(2 * np.pi * rng.uniform(18, 40) * tt) > 0) * env(len(tt), 0.01, 0.08); s = bp(s, 200, 1800) * rng.uniform(0.03, 0.08)
            pan = rng.uniform(-1, 1); L[i0:i0 + len(s)] += s * np.sqrt(0.5 * (1 - pan)); R[i0:i0 + len(s)] += s * np.sqrt(0.5 * (1 + pan))
        for k in range(3):  # owl hoots, far
            t0 = rng.uniform(3, D - 4); i0 = int(t0 * SR)
            for j, (dd, f) in enumerate([(0.35, 420), (0.18, 400), (0.55, 380)]):
                tt = t(dd); s = np.sin(2 * np.pi * f * tt + 3 * np.sin(2 * np.pi * 5 * tt)) * env(len(tt), 0.05, 0.2) * 0.05; s = reverb(s, 1.8, 2.5, 0.5)
                j0 = i0 + int(j * 0.5 * SR); L[j0:j0 + len(s)] += s * 0.8; R[j0:j0 + len(s)] += s
    else:  # day birds: chirps
        for k in range(int(D * 1.2)):
            t0 = rng.uniform(0, D - 1); i0 = int(t0 * SR); d = rng.uniform(0.05, 0.18); tt = t(d); f = rng.uniform(2200, 5200)
            s = np.sin(2 * np.pi * (f + 1800 * tt / d * rng.choice([-1, 1])) * tt) * env(len(tt), 0.005, 0.05) * rng.uniform(0.01, 0.04); pan = rng.uniform(-1, 1)
            L[i0:i0 + len(s)] += s * np.sqrt(0.5 * (1 - pan)); R[i0:i0 + len(s)] += s * np.sqrt(0.5 * (1 + pan))
    for k in range(int(D / 5)):  # twig snaps
        t0 = rng.uniform(0, D - 0.2); i0 = int(t0 * SR); s = hp(rng.standard_normal(int(0.02 * SR)), 1500) * env(int(0.02 * SR), 0.0005, 0.015) * 0.12; pan = rng.uniform(-1, 1)
        L[i0:i0 + len(s)] += s * np.sqrt(0.5 * (1 - pan)); R[i0:i0 + len(s)] += s * np.sqrt(0.5 * (1 + pan))
    x = np.stack([L, R], 1); x = norm(x, 0.5); f = int(1.5 * SR); x[:f] *= np.linspace(0, 1, f)[:, None]; x[-f:] *= np.linspace(1, 0, f)[:, None]; return x
save("bed_night", jungle(60, True)); save("bed_day", jungle(40, False))

# ---------- radio ----------
def squelch(d=0.35):
    n = int(d * SR); x = bp(rng.standard_normal(n), 300, 3000) * env(n, 0.002, 0.12) * 0.7; x[: int(0.004 * SR)] += 0.8; return x
save("radio_squelch", squelch()); save("radio_squelch_long", squelch(1.2))
def static(d):
    n = int(d * SR); x = bp(rng.standard_normal(n), 400, 3500) * 0.25
    crack = (rng.random(n) < 0.0015).astype(float); x += bp(crack * rng.standard_normal(n), 800, 6000) * 2.5
    x *= 0.6 + 0.4 * np.abs(np.sin(2 * np.pi * np.arange(n) / SR * 3.3)); return x * env(n, 0.05, 0.2)
save("radio_static_3s", static(3)); save("radio_static_8s", static(8))
def click(): n = int(0.03 * SR); x = hp(rng.standard_normal(n), 2000) * env(n, 0.0005, 0.02) * 0.8; return x
save("ptt_click", click())
tt = t(0.12); save("roger_beep", np.sin(2 * np.pi * 1000 * tt) * env(len(tt), 0.003, 0.02) * 0.3)

# ---------- tower foley ----------
def creak(d=1.4, f0=90):
    tt = t(d); f = f0 + 30 * np.sin(2 * np.pi * 0.7 * tt) + 20 * rng.standard_normal(len(tt)).cumsum() / SR
    ph = 2 * np.pi * np.cumsum(f) / SR; s = (np.mod(ph, 2 * np.pi) < 0.6).astype(float) * (rng.random(len(tt)) < 0.9)
    s = bp(s, 300, 2500) * env(len(tt), 0.1, 0.4); return reverb(s * 0.6, 1.2, 4, 0.25)
save("wood_creak", creak()); save("wood_creak_long", creak(3.2, 70))
def step(heavy=1.0):
    n = int(0.25 * SR); x = lp(rng.standard_normal(n), 400) * env(n, 0.002, 0.2) * heavy + bp(rng.standard_normal(n), 800, 3000) * env(n, 0.001, 0.05) * 0.2; return reverb(x, 0.8, 6, 0.2)
lad = np.zeros(int(4 * SR))
for k in range(8): i0 = max(0, int(k * 0.48 * SR + rng.uniform(-0.03, 0.03) * SR)); s = step(0.6 + rng.random() * 0.4); lad[i0:i0 + len(s)] += s[: len(lad) - i0]
save("ladder_climb", norm(lad, 0.6))
# ---------- procession ----------
tt = t(12); drone = (np.sin(2 * np.pi * 41 * tt) * 0.5 + np.sin(2 * np.pi * 61.5 * tt) * 0.25 + lp(pink(len(tt)), 120) * 0.6) * env(len(tt), 2.5, 3)
drone *= 0.7 + 0.3 * np.sin(2 * np.pi * 0.13 * tt); save("proc_drone", norm(drone, 0.6))
clinks = np.zeros(int(10 * SR))
for k in range(26):
    i0 = int(rng.uniform(0, 9.5) * SR); d = 0.6; tt2 = t(d); f = rng.uniform(2400, 3600)
    s = (np.sin(2 * np.pi * f * tt2) + 0.5 * np.sin(2 * np.pi * f * 2.76 * tt2)) * np.exp(-tt2 * 9) * 0.12; clinks[i0:i0 + len(s)] += s[: len(clinks) - i0]
save("lantern_clinks", reverb(clinks, 2, 3, 0.4))
sh = np.zeros(int(10 * SR))
for k in range(40):
    i0 = int(rng.uniform(0, 9.6) * SR); n = int(0.35 * SR); s = bp(rng.standard_normal(n), 200, 1600) * env(n, 0.08, 0.2) * 0.18; sh[i0:i0 + n] += s[: len(sh) - i0]
save("proc_shuffle", sh)
tt = t(10); breath = np.zeros(len(tt))
for f in [220, 233, 330, 349]: breath += np.sin(2 * np.pi * f * tt + 0.5 * np.sin(2 * np.pi * 0.2 * tt)) * 0.15
breath = bp(breath + pink(len(tt)) * 0.2, 250, 2200) * env(len(tt), 3, 3) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.25 * tt) ** 2)
save("ghost_choir", norm(reverb(breath, 3.5, 1.5, 0.6), 0.45))
# ---------- stingers ----------
def rev_swell(d=2.2):
    n = int(d * SR); x = bp(rng.standard_normal(n), 300, 6000) * (np.linspace(0, 1, n) ** 3); x = reverb(x, 1.5, 3, 0.5)[:n]; x[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR)); return x * 0.7
def subdrop(d=2.5):
    tt = t(d); f = 70 * np.exp(-tt * 1.2) + 28; s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 1.4); return s * 0.9
def tink():
    tt = t(2.5); s = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * dk) * a for f, dk, a in [(1760, 3, 0.3), (2640, 4, 0.2), (4870, 6, 0.12), (3320, 5, 0.1)]); return reverb(s, 3, 2, 0.5)
sw = rev_swell(); sd = subdrop(); tk = tink()
sting = np.zeros(len(sw) + len(sd)); sting[: len(sw)] += sw; sting[len(sw): len(sw) + len(sd)] += sd; sting[len(sw): len(sw) + len(tk)] += tk[: len(sting) - len(sw)] * 0.8
save("sting_main", norm(sting, 0.95))
lo = np.zeros(int(4 * SR)); s1 = rev_swell(1.2); lo[: len(s1)] += s1 * 0.7; j = len(s1); lo[j: j + len(tk)] += tk[: len(lo) - j] * 0.9; lo[j: j + int(1.5 * SR)] += subdrop(1.5)[: len(lo) - j] * 0.6
save("sting_lightout", norm(lo, 0.85))
tt = t(4); boom = np.sin(2 * np.pi * np.cumsum(55 * np.exp(-tt * 0.8) + 25) / SR) * np.exp(-tt * 0.9) + lp(rng.standard_normal(len(tt)), 200) * np.exp(-tt * 2) * 0.5
scrape = bp(rng.standard_normal(len(tt)), 1800, 5000) * env(len(tt), 0.4, 2.5) * 0.15 * (1 + np.sin(2 * np.pi * 7 * tt))
save("title_hit", norm(reverb(boom + scrape, 3, 1.5, 0.4), 0.95))
save("jumpscare", norm(np.concatenate([np.zeros(int(0.02 * SR)), hp(rng.standard_normal(int(0.6 * SR)), 1000) * env(int(0.6 * SR), 0.002, 0.5) * 0.8]) + 0, 0.95))
# ---------- score: drone pad + 60 BPM heartbeat (2 min) ----------
D = 120; tt = t(D); pad = np.zeros(len(tt))
for f, a in [(55, 0.35), (82.4, 0.2), (110, 0.14), (116.5, 0.08), (164.8, 0.05)]: pad += np.sin(2 * np.pi * f * tt + 0.3 * np.sin(2 * np.pi * 0.07 * tt * f / 55)) * a
pad = lp(pad + lp(pink(len(tt)), 300) * 0.3, 900) * (0.7 + 0.3 * np.sin(2 * np.pi * tt / 17) ** 2); pad *= env(len(tt), 6, 6)
save("score_pad", norm(reverb(pad, 3, 1.2, 0.35), 0.5))
hb = np.zeros(int(60 * SR))
for k in range(60):
    for off, a in [(0, 1.0), (0.22, 0.7)]:
        i0 = int((k + off) * SR); tt2 = t(0.18); s = np.sin(2 * np.pi * (60 * np.exp(-tt2 * 10) + 38) * tt2) * np.exp(-tt2 * 22) * a; hb[i0:i0 + len(s)] += s[: len(hb) - i0]
save("heartbeat_60", norm(hb, 0.7))
hb2 = np.zeros(int(20 * SR)); k = 0.0; per = 0.9
while k < 19.5:
    for off, a in [(0, 1.0), (0.18, 0.7)]:
        i0 = int((k + off) * SR); tt2 = t(0.16); s = np.sin(2 * np.pi * (60 * np.exp(-tt2 * 10) + 38) * tt2) * np.exp(-tt2 * 24) * a; hb2[i0:i0 + len(s)] += s[: len(hb2) - i0]
    k += per; per = max(0.38, per * 0.96)
save("heartbeat_rising", norm(hb2, 0.75))
# ---------- water, torch, whoosh ----------
n = int(3 * SR); sp = bp(rng.standard_normal(n), 300, 5000) * env(n, 0.005, 1.6) * 0.6; sp += lp(rng.standard_normal(n), 300) * env(n, 0.01, 0.6) * 0.6; save("splash", norm(reverb(sp, 1, 4, 0.3), 0.8))
n = int(6 * SR); gl = np.zeros(n)
for k in range(60): i0 = int(rng.uniform(0, 5.8) * SR); tt2 = t(0.06); f = rng.uniform(300, 900); s = np.sin(2 * np.pi * (f + 1500 * tt2) * tt2) * env(len(tt2), 0.005, 0.04) * 0.08; gl[i0:i0 + len(s)] += s
save("water_gurgle", gl + lp(pink(n), 500) * 0.05)
save("torch_click", np.concatenate([click() * 0.9, np.zeros(int(0.06 * SR)), click() * 0.5]))
n = int(0.6 * SR); tt2 = t(0.6); wh = bp(rng.standard_normal(n), 400, 8000) * np.sin(np.pi * tt2 / 0.6) ** 2; wh = wh * (0.5 + 0.5 * np.sin(2 * np.pi * (20 + 80 * tt2) * tt2)); save("tape_whoosh", norm(wh, 0.6))
save("sub_hit", norm(subdrop(1.6), 0.9))
# montage impact: sub thump + bright metallic hit + short noise crack, no tail
tt = t(1.2); hit = np.sin(2 * np.pi * np.cumsum(90 * np.exp(-tt * 9) + 38) / SR) * np.exp(-tt * 5) * 0.9
hit += sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) * a for f, d, a in [(523, 9, 0.18), (1244, 12, 0.12), (2093, 16, 0.08)])
hit[: int(0.03 * SR)] += hp(rng.standard_normal(int(0.03 * SR)), 2500) * 0.5; save("montage_hit", norm(hit, 0.95))
tt = t(13); riser = bp(rng.standard_normal(len(tt)), 300, 6000) * (tt / 13) ** 2.5 * 0.35 + np.sin(2 * np.pi * (40 + 40 * (tt / 13) ** 2) * tt) * (tt / 13) * 0.4
riser[-int(0.02 * SR):] *= np.linspace(1, 0, int(0.02 * SR)); save("riser_13s", norm(riser, 0.8))
tk = np.zeros(int(13 * SR)); x = 0.0; per = 0.6
while x < 12.8:
    i0 = int(x * SR); c = hp(rng.standard_normal(int(0.012 * SR)), 3000) * env(int(0.012 * SR), 0.0005, 0.01) * 0.6; tk[i0:i0 + len(c)] += c[: len(tk) - i0]; x += per; per = max(0.12, per * 0.93)
save("clock_accel", tk)
n = int(5 * SR); air = bp(pink(n), 150, 2500) * env(n, 1.5, 1.0) * (0.6 + 0.4 * np.linspace(0, 1, n)); save("flyover_air", norm(air, 0.6))
n = int(1.6 * SR); ig = lp(rng.standard_normal(n), 900) * env(n, 0.005, 1.2) * 0.7; tt = t(1.6); ig += np.sin(2 * np.pi * 1760 * tt) * np.exp(-tt * 5) * 0.15; save("lantern_ignite", norm(ig, 0.7))
n = int(0.35 * SR); wf = bp(rng.standard_normal(n), 500, 7000) * np.sin(np.pi * np.arange(n) / n) ** 2; save("flash_whoosh", norm(wf, 0.6))

# ---------- horror activities ----------
# wet bare footsteps: slap + squelch, slow uneven pace
ws = np.zeros(int(4 * SR))
for k in range(7):
    i0 = int((0.15 + k * 0.52 + rng.uniform(-0.05, 0.05)) * SR); n = int(0.3 * SR)
    sl = bp(rng.standard_normal(n), 300, 2500) * env(n, 0.001, 0.06) * 0.6 + lp(rng.standard_normal(n), 250) * env(n, 0.002, 0.12) * 0.5
    sq = bp(rng.standard_normal(n), 1200, 5000) * env(n, 0.04, 0.12) * 0.2 * np.sin(2 * np.pi * 9 * t(0.3)) ** 2
    ws[i0:i0 + n] += (sl + sq)[: len(ws) - i0]
save("wet_steps", norm(reverb(ws, 0.6, 7, 0.15), 0.6))
# bats: a burst of many wing flutters, dispersing
n = int(4 * SR); bt = np.zeros(n)
for k in range(70):
    i0 = int(rng.uniform(0, 1.6) * SR); d = rng.uniform(0.6, 2.2); m = int(d * SR); f = rng.uniform(14, 24); tt2 = t(d)
    fl = bp(rng.standard_normal(m), 900, 6000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * f * tt2))) * env(m, 0.05, d * 0.7) * 0.07; bt[i0:i0 + m] += fl[: n - i0]
save("bat_burst", norm(bt, 0.7))
# generator winding down to silence
tt = t(3.5); fr = 50 * np.exp(-tt * 0.9) + 4; gen = (np.sign(np.sin(2 * np.pi * np.cumsum(fr) / SR)) * 0.5 + lp(rng.standard_normal(len(tt)), 300) * 0.3) * np.exp(-tt * 0.6)
save("gen_die", norm(lp(gen, 900), 0.6))
# chain rattle on the gate
n = int(1.8 * SR); ch = np.zeros(n)
for k in range(30):
    i0 = int(rng.uniform(0, 1.3) * SR); tt2 = t(0.25); f = rng.uniform(2500, 5200); c2 = (np.sin(2 * np.pi * f * tt2) + 0.6 * np.sin(2 * np.pi * f * 1.7 * tt2)) * np.exp(-tt2 * 30) * 0.1; ch[i0:i0 + len(c2)] += c2[: n - i0]
save("chain_rattle", norm(ch, 0.6))
# radio switching itself on: click, static swell, squelch tail
n = int(1.6 * SR); ro = np.zeros(n); c3 = click(); ro[: len(c3)] += c3; stc = static(1.4) * env(int(1.4 * SR), 0.15, 0.4) * 0.5; ro[int(0.1 * SR):int(0.1 * SR) + len(stc)] += stc[: n - int(0.1 * SR)]
save("radio_on", norm(ro, 0.7))
print("sfx", len(os.listdir(OUT)))

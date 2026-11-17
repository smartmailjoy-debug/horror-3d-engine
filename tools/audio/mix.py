# TOWER 13 — FX/music stem laid against the shot timeline (seconds from shots.ts). VO is added on top later; this stem
# sits ~10 LU under the voice. Output: rp/public/t13/fx_mix.wav (48 kHz stereo, 620 s).
import numpy as np, wave, os
SR = 48000; D = 620; IN = "engine/public/t13/sfx/"
def load(n):
    with wave.open(IN + n + ".wav") as w: x = np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(np.float32) / 32767
    return x.reshape(-1, 2)
S = {f[:-4]: load(f[:-4]) for f in os.listdir(IN) if f.endswith(".wav")}
import json as _j
_m = _j.load(open("audio/timemap.json")); _o = sorted(_m["old"].items(), key=lambda kv: kv[1])
_O = np.array([v for k, v in _o]); _N = np.array([_m["new"][k] for k, v in _o])
def T(t):  # old script time -> re-timed film time (piecewise linear per shot)
    i = int(np.clip(np.searchsorted(_O, t, side="right") - 1, 0, len(_O) - 2)); a, b = _O[i], _O[i + 1]; A, B = _N[i], _N[i + 1]
    return A + (t - a) * (B - A) / max(1e-6, b - a)
D = int(np.ceil(_N[-1])) + 1
mix = np.zeros((D * SR, 2), np.float32)
def put(name, at, gain=1.0, dur=None, fade=0.05, rate=1.0):
    if dur is not None: dur = T(at + dur) - T(at)
    at = T(at); x = S[name]
    if rate != 1.0: idx = np.arange(0, len(x) - 1, rate); x = x[idx.astype(int)]
    if dur is not None: n = int(dur * SR); x = np.tile(x, (n // len(x) + 1, 1))[:n]
    x = x * gain; f = int(fade * SR)
    if f and len(x) > 2 * f: x[:f] *= np.linspace(0, 1, f)[:, None]; x[-f:] *= np.linspace(1, 0, f)[:, None]
    i0 = int(at * SR); i1 = min(len(mix), i0 + len(x)); mix[i0:i1] += x[: i1 - i0]
# ---------- beds: (start, end, kind, gain)
beds = [(0, 30, "bed_night", 0.55), (36, 41, "bed_day", 0.18), (49, 54, "bed_day", 0.35), (54, 98, "bed_day", 0.5), (98, 110, "bed_night", 0.45), (110, 130.4, "bed_night", 0.6),
        (164, 187, "bed_day", 0.35), (187, 258, "bed_night", 0.55), (258, 291, "bed_night", 0.35), (291, 299, "bed_day", 0.3), (299, 330, "bed_night", 0.5), (330, 355, "bed_day", 0.35),
        (355, 430, "bed_night", 0.5), (430, 482.3, "bed_night", 0.45), (520, 524, "bed_day", 0.3), (524, 559, "bed_day", 0.45), (575, 601, "bed_night", 0.45)]
for a, b, k, g in beds: put(k, a, g, dur=b - a, fade=0.8 if b not in (130.4, 482.3) else 0.02)
# ---------- radio squelch at each radio beat
for at in [46.0, 120.0, 201, 205, 209, 220, 224, 231, 235, 248, 254, 268, 273, 308, 313, 368, 372, 391, 401, 406, 430.5, 435, 444, 451.2, 456, 464, 476, 591, 596, 601]:
    put("radio_squelch", at, 0.5); put("ptt_click", at + 0.02, 0.35)
for at, d, g in [(215, 5, 0.2), (239, 1.0, 0.5), (248, 6, 0.4), (391, 5, 0.18), (601, 6, 0.35), (607, 4, 0.3), (611, 4, 0.18)]: put("radio_static_8s", at, g, dur=d, fade=0.2)
for at in [211, 238]: put("roger_beep", at, 0.4)
# ---------- title, scares, light-outs
put("sting_main", 160.1, 0.9); put("jumpscare", 162.0, 0.95)
for at in [246.2, 289.0, 323.75, 378.5, 417.5, 479.6]: put("sting_lightout", at - 1.2, 0.75)
put("sub_hit", 191.2, 0.55); put("sub_hit", 445.5, 0.7); put("sub_hit", 549, 0.6); put("sub_hit", 554.2, 0.8)
# ---------- procession (night 1 2:40, gate, night 7)
for a, b, g in [(135, 162, 1.0), (364, 368, 0.6), (486, 524, 1.0)]:
    put("proc_drone", a, 0.55 * g, dur=b - a, fade=1.5); put("lantern_clinks", a + 0.5, 0.5 * g, dur=b - a - 0.5, fade=1); put("proc_shuffle", a + 0.3, 0.45 * g, dur=b - a - 0.3, fade=1)
put("ghost_choir", 148, 0.5, dur=14, fade=2); put("ghost_choir", 491, 0.55, dur=25, fade=3)
# ---------- tower foley
for at in [26.5, 115.5, 191.5, 205.5, 299.2, 301.5, 304.2, 516.2]: put("wood_creak", at, 0.35)
put("wood_creak_long", 299.5, 0.55); put("wood_creak_long", 304, 0.5); put("ladder_climb", 110.6, 0.5); put("ladder_climb", 277.5, 0.55, rate=1.25)
put("ladder_climb", 299.3, 0.45, rate=0.8)
# ---------- river, torch, home, bus
put("water_gurgle", 258, 0.35, dur=33, fade=1.5); put("splash", 283.5, 0.7); put("splash", 264.5, 0.3)
put("torch_click", 160.9, 0.8); put("torch_click", 451.1, 0.8); put("torch_click", 360.2, 0.5)
for k in range(3): put("ptt_click", 37.4 + k * 0.28, 0.9, rate=0.3)  # door knocks (slowed clicks)
for k in range(3): put("ptt_click", 39.0 + k * 0.25, 0.9, rate=0.3)
eng = np.zeros((5 * SR, 2), np.float32); tt = np.arange(5 * SR) / SR; e = (np.sign(np.sin(2 * np.pi * 32 * tt)) * 0.3 + np.sin(2 * np.pi * 64 * tt) * 0.2) * (0.8 + 0.2 * np.sin(2 * np.pi * 3 * tt))
from scipy.signal import butter, sosfilt
e = sosfilt(butter(4, 300, "low", fs=SR, output="sos"), e) * 0.45; eng[:, 0] = e; eng[:, 1] = e; S["bus_engine"] = eng; put("bus_engine", 49, 0.9, fade=0.8)
# ---------- score + heartbeat
for a, b, g in [(68, 110, 0.18), (115, 130.4, 0.28), (164, 258, 0.3), (258, 299, 0.32), (299, 430, 0.34), (430, 486, 0.42), (486, 559, 0.45), (571, 601, 0.35)]: put("score_pad", a, g, dur=b - a, fade=2)
put("heartbeat_rising", 145, 0.55, dur=17, fade=0.5); put("heartbeat_60", 441, 0.45, dur=40, fade=2); put("heartbeat_60", 505, 0.4, dur=15, fade=1)
# ---------- hook (new timeline, placed directly)
NT = _m["new"]
def putN(name, at, gain=1.0, dur=None, fade=0.05):
    x = S[name]
    if dur is not None: n = int(dur * SR); x = np.tile(x, (n // len(x) + 1, 1))[:n]
    x = x * gain; f = int(fade * SR)
    if f and len(x) > 2 * f: x[:f] *= np.linspace(0, 1, f)[:, None]; x[-f:] *= np.linspace(1, 0, f)[:, None]
    i0 = int(at * SR); i1 = min(len(mix), i0 + len(x)); mix[i0:i1] += x[: i1 - i0]
putN("radio_squelch", NT["h1"] + 0.2, 0.45); putN("radio_static_3s", NT["h1"], 0.12, dur=NT["h2"] - NT["h1"], fade=0.3)
putN("flyover_air", NT["h2"] - 0.3, 0.7); putN("proc_drone", NT["h2"], 0.35, dur=NT["h5"] - NT["h2"], fade=1.0)
putN("lantern_ignite", NT["h3"] + 0.55 * (NT["h4a"] - NT["h3"]), 0.8); putN("sting_lightout", NT["h3"] + 0.55 * (NT["h4a"] - NT["h3"]) - 1.2, 0.5)
# hook traces on Tower 13 (no walkers): radio switches itself on, cot creaks, wet bare feet, one shadow between the trees
hA = NT["h4a"] + 0.28 * (NT["h4b"] - NT["h4a"]); putN("radio_on", hA, 0.75); putN("radio_static_3s", hA + 0.8, 0.13, dur=NT["h5"] - hA - 0.8, fade=0.3)
putN("wood_creak_long", NT["h4b"], 0.65); putN("wood_creak", NT["h4b"] + 0.9, 0.4)
putN("wet_steps", NT["h4c"], 0.75)
putN("sub_hit", NT["h4d"], 0.5); putN("sting_lightout", NT["h4d"] + 0.62 * (NT["h5"] - NT["h4d"]) - 0.15, 0.5)
# horror activities through the film
putN("bat_burst", NT["31"] + 0.1, 0.65)
putN("radio_static_3s", NT["49"], 0.12, dur=NT["50"] - NT["49"], fade=0.4)
putN("sting_lightout", NT["74"] + 0.45 * (NT["75"] - NT["74"]), 0.45)
putN("chain_rattle", NT["81"] + 0.3, 0.5)
putN("gen_die", NT["86"], 0.7)
putN("radio_on", NT["105"] + 0.2, 0.45); putN("wood_creak_long", NT["105"] + 0.6, 0.35)
putN("radio_squelch", NT["h5"] + 0.1, 0.45); putN("heartbeat_rising", NT["h5"], 0.45, dur=NT["h6"] - NT["h5"], fade=0.3)
putN("sting_main", NT["h6"] - 2.2, 0.8); putN("jumpscare", NT["h6"], 0.95)
putN("bed_night", NT["h7"], 0.35, dur=NT["9"] - NT["h7"], fade=0.8); putN("score_pad", NT["h7"], 0.3, dur=NT["10"] - NT["h7"], fade=1.0)
putN("title_hit", NT["9"], 0.9)
# ---------- montage: one clean impact per clue on the cut, riser + accelerating clock underneath, hard silence after
M0 = NT["1200"]; M1 = NT["121"]
putN("riser_13s", M0, 0.5, dur=M1 - M0, fade=0.05); putN("clock_accel", M0, 0.5, dur=M1 - M0, fade=0.05)
for k in range(10): putN("montage_hit", NT["120" + str(k)], 0.75)
mix[int(M1 * SR): int((M1 + 0.02) * SR)] *= 0.0
# ---------- duck everything under the voice (sidechain from the VO stem)
with wave.open("engine/public/t13/vo_mix.wav") as w: vo = np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(np.float32).reshape(-1, 2) / 32767
ve = np.abs(vo).mean(1); hop = 480; ve = np.array([ve[i:i + hop].max() for i in range(0, len(ve), hop)]); act = (ve > 0.02).astype(np.float32)
k = np.ones(25) / 25; act = np.convolve(act, k, "same"); act = np.clip(act * 2, 0, 1); g = 1 - 0.6 * act
g = np.repeat(g, hop)[: len(mix)]; g = np.pad(g, (0, max(0, len(mix) - len(g))), constant_values=1.0); mix *= g[:, None]
# ---------- master: soft clip, write
mix = np.tanh(mix * 1.1) * 0.85
with wave.open("engine/public/t13/fx_mix.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype("<i2").tobytes())
print("mix ok", mix.shape[0] / SR, "s, peak", float(np.abs(mix).max()))

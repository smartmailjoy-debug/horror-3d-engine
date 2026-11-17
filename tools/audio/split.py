import json, subprocess, numpy as np, wave, os
SR = 48000; D = "audio/vo/"
ch = json.load(open("audio/chunks.json")); os.makedirs(D + "lines", exist_ok=True)
def dec(f):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True).stdout
    return np.frombuffer(raw, "<i2").astype(np.float32) / 32767
rep = []
for c in ch:
    x = dec(D + "c%02d.mp3" % c["ci"]); n = len(c["keys"])
    hop = int(0.01 * SR); e = np.sqrt(np.convolve(x ** 2, np.ones(hop * 3) / (hop * 3), "same")[::hop] + 1e-12)
    thr = max(0.006, np.percentile(e, 30) * 1.6); sil = e < thr
    gaps = []; i = 0
    while i < len(sil):
        if sil[i]:
            j = i
            while j < len(sil) and sil[j]: j += 1
            if i > 0 and j < len(sil): gaps.append((j - i, i, j))
            i = j
        else: i += 1
    cuts = sorted(sorted(gaps, reverse=True)[: n - 1], key=lambda g: g[1])
    bounds = [0] + [(g[1] + g[2]) // 2 for g in cuts] + [len(sil)]
    for k in range(n):
        a, b = bounds[k] * hop, bounds[k + 1] * hop; seg = x[a:b]
        on = np.where(np.abs(seg) > 0.01)[0]
        if len(on): seg = seg[max(0, on[0] - int(0.05 * SR)): on[-1] + int(0.12 * SR)]
        with wave.open(D + "lines/%03d.wav" % c["keys"][k], "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(seg, -1, 1) * 32767).astype("<i2").tobytes())
        rep.append((c["keys"][k], round(len(seg) / SR, 2)))
    rep.append(("gaps%d" % c["ci"], [round(g[0] * 0.01, 2) for g in cuts][:3], round(sorted(gaps, reverse=True)[n - 1][0] * 0.01 if len(gaps) >= n else 0, 2)))
json.dump(rep, open(D + "split_report.json", "w")); print(rep[-40:])

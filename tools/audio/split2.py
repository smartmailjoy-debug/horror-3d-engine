# align chunk audio to its lines: choose N-1 silent gaps that best match the character-proportional expected boundaries
import json, subprocess, numpy as np, wave, os, re
SR = 48000; D = "audio/vo/"
ch = json.load(open("audio/chunks.json")); rows = {r["k"]: r for r in json.load(open("audio/vo.json"))}
def dec(f):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True).stdout
    return np.frombuffer(raw, "<i2").astype(np.float32) / 32767
clean = lambda t: re.sub(r"\[[^\]]*\]\s*", "", t)
import sys
only = [int(a) for a in sys.argv[1:]]
rep = json.load(open(D + "durs.json")) if only else {}
rep = {int(k): v for k, v in rep.items()}
for c in ch:
    if only and c["ci"] not in only: continue
    x = dec(D + "c%02d.mp3" % c["ci"]); n = len(c["keys"]); hop = int(0.01 * SR)
    e = np.sqrt(np.convolve(x ** 2, np.ones(hop * 3) / (hop * 3), "same")[::hop] + 1e-12); thr = max(0.006, np.percentile(e, 30) * 1.6); sil = e < thr
    gaps = []; i = 0
    while i < len(sil):
        if sil[i]:
            j = i
            while j < len(sil) and sil[j]: j += 1
            if i > 0 and j < len(sil) and j - i >= 18: gaps.append(((i + j) / 2, (j - i) / 100))
            i = j
        else: i += 1
    on = np.where(e > thr)[0]; t0, t1 = on[0] / 100, on[-1] / 100
    L = [len(clean(rows[k]["text"])) + 6 for k in c["keys"]]; cum = np.cumsum(L)[:-1] / sum(L)
    T = t0 + (t1 - t0) * cum
    if n == 1: cuts = []
    else:
        G = [(g[0] / 100, g[1]) for g in gaps]; m = len(G); INF = 1e18
        cost = lambda k, gi: ((G[gi][0] - T[k]) / 1.8) ** 2 - 2.2 * np.log(G[gi][1] / 0.2)
        dp = np.full((n - 1, m), INF); bk = np.zeros((n - 1, m), int)
        for gi in range(m): dp[0, gi] = cost(0, gi)
        for k in range(1, n - 1):
            best = INF; bi = -1
            for gi in range(m):
                if gi > 0 and dp[k - 1, gi - 1] < best: best = dp[k - 1, gi - 1]; bi = gi - 1
                if bi >= 0: dp[k, gi] = best + cost(k, gi); bk[k, gi] = bi
        gi = int(np.argmin(dp[n - 2])); path = [gi]
        for k in range(n - 2, 0, -1): gi = bk[k, gi]; path.append(gi)
        cuts = [G[g][0] for g in reversed(path)]
    bounds = [0] + [int(cc * SR) for cc in cuts] + [len(x)]
    for k in range(n):
        seg = x[bounds[k]:bounds[k + 1]]; o = np.where(np.abs(seg) > 0.012)[0]
        if len(o): seg = seg[max(0, o[0] - int(0.04 * SR)): o[-1] + int(0.15 * SR)]
        with wave.open(D + "lines/%03d.wav" % c["keys"][k], "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(seg, -1, 1) * 32767).astype("<i2").tobytes())
        rep[c["keys"][k]] = round(len(seg) / SR, 2)
json.dump(rep, open(D + "durs.json", "w"))
# sanity: seconds per character per line
r = [(k, d, round(d / max(1, len(clean(rows[k]["text"]))), 3)) for k, d in sorted(rep.items()) if k in rows]
bad = [x for x in r if x[2] > 0.16 or x[2] < 0.045]; print("lines", len(r), "outliers", bad)

# Preview animatic: one still per shot (engine stills where rendered, insert plates as-is, otherwise the previous world
# still), re-timed shot durations, final master audio. 1280x720.
import json, re, subprocess, os, glob
RP = "engine/"; OUT = "out/"; TMP = "/tmp/anim/"; os.makedirs(TMP, exist_ok=True)
src = open(RP + "src/videos/t13/shots.ts").read()
tm = json.load(open("audio/timemap.json"))["new"]
info = {}
for m in re.finditer(r'\{ n: "([0-9a-z]+)", t: [0-9.]+, kind: "(\w+)"(?:, ins: "([a-z_0-9]+)")?', src): info[m.group(1)] = (m.group(2), m.group(3))
for k, c in enumerate("abcde"): info["19" + c] = ("world", None)
mont = [("2:44", "face_torch"), ("2:56", "reg_11"), ("3:01", "_42"), ("3:11", "_44"), ("3:29", "_48"), ("4:08", "led_on"), ("4:55", "_66"), ("5:35", "mirror"), ("6:12", "_83"), ("7:00", "led_dim")]
for k, (st, w) in enumerate(mont): info["120" + str(k)] = ("insert", w) if not w.startswith("_") else ("ref", w[1:])
order = sorted([n for n in tm if n != "_"], key=lambda n: tm[n]) + ["_"]
P1 = sorted(glob.glob("/tmp/p1/element-*.jpeg")) + sorted(glob.glob("/tmp/p1b/element-*.jpeg"))
stills = {}
for i, f in enumerate(P1): stills[order[i]] = f
want = ["38","41","42","44","45","48","52","54","55","59","63","64","66","67","68","71","74","77","81","83","86","88","91","95","98","103","105","106","107","108","109","111","113","116","117","1200","122","123","130"]
for i, f in enumerate(sorted(glob.glob("/tmp/p23/element-*.jpeg"))): stills[want[i]] = f
lines = []; last = P1[0]
for i, n in enumerate(order[:-1]):
    d = tm[order[i + 1]] - tm[n]; kind, ins = info.get(n, ("world", None))
    if n in stills: img = stills[n]
    elif kind == "insert" and ins: img = RP + "public/t13/ins/%s.png" % ins
    elif kind == "ref" and ins in stills: img = stills[ins]
    elif kind == "black": img = "BLACK"
    else: img = last
    if kind == "world" and img not in ("BLACK",): last = img
    lines.append((img, d))
segs = []
for k, (img, d) in enumerate(lines):
    o = TMP + "s%03d.mp4" % k; fr = max(1, round(d * 30))
    if img == "BLACK": cmd = ["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "color=c=black:s=1280x720:r=30", "-frames:v", str(fr), "-pix_fmt", "yuv420p", o]
    else: cmd = ["ffmpeg", "-v", "error", "-y", "-loop", "1", "-i", img, "-vf", f"scale=1408:792,zoompan=z='1+0.0009*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={fr}:s=1280x720:fps=30,format=yuv420p", "-frames:v", str(fr), o]
    subprocess.run(cmd, check=True); segs.append(o)
open(TMP + "list.txt", "w").write("".join(f"file '{s}'\n" for s in segs))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", TMP + "list.txt", "-i", RP + "public/t13/master.m4a", "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-c:a", "aac", "-b:a", "192k", "-shortest", OUT + "TOWER13_animatic_preview.mp4"], check=True)
print("ok", len(segs))

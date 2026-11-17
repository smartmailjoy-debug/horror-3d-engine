import json, os, sys, urllib.request, shutil, concurrent.futures as cf
UA={"User-Agent":"Mozilla/5.0 (jungle-night-duty asset fetch)"}
def op(u): return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60)
A = sys.argv[1:]
def files(a):
    d = json.load(op(f"https://api.polyhaven.com/files/{a}"))
    g = d["gltf"]["1k"]["gltf"]; out = [(g["url"], f"raw/{a}/{a}.gltf")]
    for rel, v in g.get("include", {}).items(): out.append((v["url"], f"raw/{a}/{rel}"))
    return out
jobs = []
for a in A: jobs += files(a)
def get(j):
    u, p = j; os.makedirs(os.path.dirname(p), exist_ok=True)
    if not os.path.exists(p):
        with op(u) as r, open(p, "wb") as f: shutil.copyfileobj(r, f)
    return p
with cf.ThreadPoolExecutor(8) as ex: n = sum(1 for _ in ex.map(get, jobs))
print("files", n)

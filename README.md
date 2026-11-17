# horror-3d-engine — TOWER 13

A 10.5 min, 16:9 Hinglish horror film rendered as 3D engine animation.

- **World:** Remotion + three.js, built entirely in code.
- **Characters:** 2D graphic-novel cards with a cut-out rig (blink, head, hands, hair).
- **Voices:** ElevenLabs narration and character voices.
- **Sound:** fully synthesized sound design.
- **Render:** final render on a local GPU.

This repo holds **everything** used to make *Jungle Ki Night Duty v2 — TOWER 13*: code, Joy's optimized 3D models, character art, inserts, voice recordings, sound tools, the script, stills and the full decision log. Use it as a template for the next horror story.

> Private repo. Several third-party models are licensed CC-BY-NC / NC-ND / Sketchfab Standard. Credit every creator in the YouTube description (see `docs/CREDITS_and_render_notes.txt`). Never make this repo public.

## Folder map

| Path | What |
|---|---|
| `engine/` | The Remotion project (render this) |
| `engine/src/videos/t13/Film.tsx` | Per-frame renderer: cameras, cards, rig shader, procession, fx, post, DOM text |
| `engine/src/videos/t13/shots.ts` | **The film**: every shot (camera, cast, lamps, fx, text) — edit this for changes |
| `engine/src/videos/t13/world.ts` | The whole set: tower ring, towers + furniture, camp + radio mast, fence ring, gate, river, jeeps, trees, lights, time-of-day, horror fx rig |
| `engine/src/videos/t13/assets.ts` | Model loading + fit specs (`DM`), Poly Haven list (`PH`), wind shader, sprite loading |
| `engine/src/videos/t13/tex.ts` | Canvas textures (ground, wood, tin, plaster, bilingual boards, plates, glows, water) |
| `engine/src/videos/t13/sets.ts` | Hero's home + bus |
| `engine/src/videos/t13/retime.ts`, `talk.ts` | Generated: shot start times from the VO, mouth-open windows |
| `engine/src/videos/t13/WorldTest.tsx` | 8 world-check cameras (`T13WORLD`) |
| `engine/src/videos/t13/Impostor.tsx` | Renders tree impostor sprites (`IMPOSTORS`) |
| `engine/src/videos/bridge/ink.ts`, `grade.ts` | Ink-outline pass + colour grade effect |
| `engine/public/jnd/dmodels/` | Joy's Drive models, optimized (webp, 1024 tex, simplified) |
| `engine/public/jnd/models/` | Poly Haven models (trees, plants, rocks, fire pit) |
| `engine/public/jnd/chars/` | Character sprites (+ `_talk`, `_blink`) and `meta.json` (anchors) |
| `engine/public/t13/ins/` | Full-frame inserts (radio, letter, contract, map, newspaper, register, photos…) |
| `engine/public/t13/imp/` | Tree impostor sprites |
| `engine/public/t13/master.m4a` | Final soundtrack (-15 LUFS) |
| `engine/*.bat` | Windows render scripts (TEST_RENDER, RENDER, RENDER_PART) |
| `engine/scripts/sr-pick.mjs` | Render picked frames to JPG (stills for approval) |
| `tools/chars/` | `chars.js` (characters, poses, blink overlays, some inserts), `inserts.js` (plates) |
| `tools/audio/` | `vo.py`, `split2.py`, `retime.py`, `sfx.py`, `mix.py`, `master.sh`, `animatic.py` |
| `tools/models/` | `fetch.py` + `list.txt` (Drive IDs of every original model), `insp.mjs` |
| `audio/` | ElevenLabs chunks (`vo/cNN.mp3`), split lines (`vo/lines/NNN.wav`), `vo.json` (script lines), `chunks.json`, `timemap.json` |
| `docs/` | Script (.docx), stills, credits, `PROJECT_LOG.md` (every decision + feedback) |
| `skill/SKILL.md` | The full method as a Claude skill |

## Render the film (Windows, GPU)

1. Install **Node.js 22 LTS**. Node 26 breaks Remotion's browser download.
2. Open `engine/` and run **TEST_RENDER.bat**. It renders the first 30 s to `out/TOWER13_test.mp4`. Minutes taken × 21 ≈ full-film time.
3. Run **RENDER.bat** for the full film, or **RENDER_PART.bat 0 5999** to render in frame ranges.

The .bat files pick a browser automatically (Remotion's headless shell → installed Chrome → Edge), and print FAIL on error.

## Preview without rendering video

Render stills only. Video on a CPU takes hours.
```
cd engine && npm install
node scripts/sr-pick.mjs TOWER13 out/stills stills.json 0.5    # frames listed in stills.json
FAST=1 TREES=8 DPR=0.5 node scripts/sr-pick.mjs TOWER13 out/stills stills.json 0.5   # fast quality
npx remotion studio src/index.ts                                # interactive preview
```
Frame = seconds × 30. Shot start times are in `retime.ts`.

## Make changes

- **Camera, cast, lights or fx of a shot:** edit `shots.ts`.
  - Find the shot by `n`.
  - Use helpers `onTower(i, lx, lz, y)`, `nearTower(i, out, side)`, `CAMP`, `GATE`, `JEEPS`. Never raw coordinates.
- **Set:** edit `world.ts`.
  - `R` = ring radius (88 m), `FENCE_R`, `CAMP`, `GATE`, `MAST`.
  - Time-of-day presets are in `setTime`.
- **Character look or pose:** edit `tools/chars/chars.js` (`cast`, `cast2`, `POSES`), then run from the repo root:
  ```
  cd tools/chars && npm install && cd ../..
  node tools/chars/inserts.js && node tools/chars/chars.js     # order matters
  ```
- **Voice:**
  1. Edit `audio/vo.json`.
  2. Generate the changed chunk in ElevenLabs. Make one take, and quote the credits first.
  3. Put it in `audio/vo/cNN.mp3`.
  4. Run:
  ```
  python tools/audio/split2.py NN      # split that chunk into lines
  python tools/audio/retime.py         # new shot timing + vo_mix + talk windows
  python tools/audio/sfx.py            # (once) synthesize all SFX into engine/public/t13/sfx
  python tools/audio/mix.py            # fx_mix with ducking
  bash tools/audio/master.sh           # master.m4a
  ```
  Python needs `numpy scipy`. Run all tools from the repo root.
- **Models:** originals are on Joy's Google Drive (`tools/models/list.txt`).
  1. Download with `https://drive.usercontent.google.com/download?id=ID&export=download&confirm=t`.
  2. Optimize with `npx gltf-transform optimize in.glb out.glb --texture-compress webp --texture-size 1024 --simplify-ratio 0.5`.
  3. Add a fit spec to `DM` in `assets.ts`.

## Credits

See `docs/CREDITS_and_render_notes.txt`. Characters, inserts and sound design are original (Mad Angles AI).

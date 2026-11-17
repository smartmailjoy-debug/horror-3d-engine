---
name: "horror-3d-story-engine"
description: "Make a long 16:9 Hinglish horror story video as 3D engine animation (Remotion + three.js world, 2D character cards, ElevenLabs voice) in the TOWER 13 style."
---

# Horror 3D Story Engine (TOWER 13 method)

Owner: Joy (Mad Angles AI). This is the pipeline that made "Jungle Ki Night Duty v2: TOWER 13". It covers a 10 min YouTube horror story with:
- a real 3D world built in code
- 2D graphic-novel characters as rigged cards
- ElevenLabs narration and voices
- synthesized sound design
- a local GPU render

No AI video clips are used. Reuse the method for any new story (jungle, village, hostel, highway, hospital...).

## 0. Rules
- Reply in short Hinglish. Docs use a light premium theme.
- **Quote ElevenLabs credits before generating.** Make one take per chunk (`generations_count: 1`) and regenerate only the wrong line.
- Previews: show STILLS for approval. Never spend hours rendering video on the CPU workspace. The final render runs on Joy's PC (RTX 3050 Ti).
- Use every 3D model Joy gives you. Never drop one for licence reasons; he credits all creators in the description. Keep project files private: some models are NC / ND.
- Every notice board or warning is bilingual: English + the local language of the setting (Assamese for Assam: Noto Sans Bengali font, Assamese spelling).
- Do only what is asked. Don't switch tools on your own.

## 1. Story and script
Recipe that worked: a rules-horror loop.
- **Rules.** Give 3 rules on a board plus a 4th rule whispered later.
- **Escalating nights.** Raat 1…7, one person lost per night.
- **Twist.** The narrator has been the ghost since night 1. Clues are planted from the first minute, then shown again in a fast montage.
- **End line.** It talks to the viewer: "aapne abhi tak jawab toh nahi diya na?"

**Hook (first 30 s).** Never show the monster in the hook; show only its TRACES. Beats with cuts:
1. 0:00 whisper on radio, black/insert
2. 0:03 drone dive over the location
3. 0:07 the forbidden place lights itself
4. 0:11–0:16 traces, 1.5 s cuts:
   - dead radio switches on
   - empty cot rocks, lantern swings
   - wet footprints appear one by one
   - two eye glints in the tree line, then gone
5. 0:17 old guide CU: "jawab mat dena"
6. 0:25 0.5 s flash scare (wet body print on the cot)
7. 0:28 narrator from behind, alone, "aur main… unme se ek tha"
8. 0:31 title

**Horror activities to sprinkle in.** Visual + SFX only, no extra dialogue:
- bats burst from the canopy when the jungle goes silent
- clothes on the line move with no wind
- wet handprints climb the ladder
- handprint inside a jeep windscreen
- generator dies and the camp lights go out
- radio glows red, cot rocks at the forbidden tower

**Narration style.** Calm, low, close-mic, first person, past tense. Short Hinglish sentences with "…" pauses. About 2.1 words/sec.

**Deliverable.** Script as a simple .docx (light theme) for approval before production.

## 2. Voice (ElevenLabs)
- Model `eleven_v4`. Audio tags inline: [whispers], [calmly], [scared].
- Group lines per speaker into chunks of ~10–15 lines, joined with the separator " …… " so silent gaps can be split later.
- Download: `creative_get_generations` → full_res_url → curl.
- Voices used in TOWER 13. Re-check they exist with `creative_list_voices`.

| Role | Voice | voice_id |
|---|---|---|
| Narrator (hero) | Viraj – Suspenseful | P1bg08DkjqiVEzOn76yG |
| Old guide | Danish K – Dramatic Old | r3CPEby3BZ6hrPxHG8h2 |
| Officer | Kuber J | unEFMOkn1ERDgzALVe2Z |
| Friend (brave) | Ranbir | yRis6UiS4dtT4Aqv72DC |
| Friend (joker) | Suraj | vn4e1QbAEOawHqqSIJvz |
| Guard | Sudhir | XNJDyPyJ8r4J7de0WJwB |
| Scared guard | Amit Gupta | Sxk6njaoa7XLsAFT7WcN |
| Father | Manu | P5Y7cJhVoUoFVrXgyLyN |
| Child girl | Mishi | Pbk8E6dlpCANrnpOLIns |
| Extra 1 | Sourabh | trxRCYtDC6qFREKq6Ek2 |
| Extra 2 | Raqib | 0UZ29F1kNDvmelKG8QCM |

If Joy's own clone is ready, use it for the narrator.

**Split.** Use DP alignment, not "longest gaps":
1. Find silent gaps (< -40 dB, > 180 ms).
2. Pick the gap set whose cut points best match the character-proportional line boundaries.
3. Write `vo/lines/NNN.wav`.

**Re-time.** Each shot starts at its first line minus LEAD (0.25 s) and ends after its last line plus TAIL (0.4–1.2 s for drama beats). Write:
- `retime.ts` (shot start times)
- `timemap.json` (old → new times for SFX)
- `vo_mix.wav`
- `talk.ts` (mouth-open windows from VO energy, ≤ 4 frames each, per speaker)

**Voice processing.**
- Narrator: dry, no reverb.
- Radio voices: `0.75*bandpass(200–5200) + 0.25*dry`, light tanh, compression.
- Ghost voice: 18 ms doubling only.
- Overdone reverb/echo was Joy's biggest complaint. Keep everything dry and clear.

## 3. Project stack
- Remotion 4.0.290, three 0.175, @react-three/fiber 9.1.2, @react-three/postprocessing 3.0.4, postprocessing 6.37.2, React 19.1. 1920x1080, 30 fps.
- **Data-driven film.** A big `Film.tsx` per-frame renderer reads `SHOTS` from `shots.ts`.
  - Shot fields: `{ n, t, kind: world|insert|black, tod, fog, cam{p,l,p1,l1,fov,fov1,shake,roll,roll1,path[[pos,look]],orbit{c,r,r1,h,h1,a0,a1,ly}}, cast[], proc{}, torch{}, props[], lamps(i,u), fx(u), text{t,sub,kind}, flash, staticAmt(u) }`.
  - `SHOTS = list.map(s => ({...s, t: RT[s.n] ?? s.t}))`, so the VO drives the timing.
- **Files:** `world.ts` (whole set), `assets.ts` (loaders, fit specs, wind), `tex.ts` (canvas textures), `sets.ts` (home, bus), `shots.ts`, `Film.tsx`, `retime.ts`, `talk.ts`.
- If Joy uploads an old render package (e.g. tower13_render_v3.zip), unzip it and use it as the template instead of rewriting.

## 4. World building (three.js in Remotion)
**Layout.** Spread the key places far apart; tension needs isolation.
- 12 watchtowers on a ring R = 88 m (~47 m apart) around the forbidden centre tower.
- Camp at R+34, gate at R+62, highway at R+84, river at -(R+16).
- The reserve is closed by a perimeter fence ring at R+62:
  - concrete posts every 3.2 m (InstancedMesh)
  - chain-link alpha panels
  - 4 barbed strands on angled Y-arms
  - the real barbed-fence model near the gate
- **Gate:**
  - concrete pillars with floodlight spots
  - heavy double iron gate (bars, spikes, rusted lower plate, diagonal brace)
  - chain + padlock + bilingual NO ENTRY plate mounted on one leaf
  - closed at night; leaves animate open only in arrival and exit shots (`setGate(u)`)

**Towers.** Procedural, 8 m platform:
- tapered posts, X-braces, planks with gaps, railing, tin hip roof, leaning ladder, number plate (emissive 0.18)
- hurricane lantern hung from the roof
- **Furnished with Joy's models:** single army cot, wooden table, base radio set, walkie, register, stool, earthen matka, roof antenna
- The forbidden tower adds vines, rust, broken plank, forest skull and a dead oak.

**Trees.** Impostor sprites keep it fast:
1. Pre-render 3 tree models to side and top PNGs with a green key.
2. Instance 3 crossed quads per tree.
3. Replace with real meshes only near the camera (`setNear`: 26 trees, 8 in fast mode).
4. Hashed 2.6 m cells of undergrowth around the camera and the focus, with clearings on paths, camp and gate.
5. Lower the canopy near towers so the platforms stay visible: `scale *= clamp((dist-5)/32, 0.42, 1)`.

**Lights (constant shader light count, never add or remove per shot).**
- Hemisphere light plus moon directional light with shadows following the focus.
- 5 pooled lantern point lights assigned to the nearest lit lamps.
- 3 mobile lights for hand lanterns.
- Key spot `#ffc890` and rim spot `#9fc0ff` on the lead character.
- Radio point light, gate floodlights, practicals.
- Turn lights off with intensity 0.

**Time-of-day presets** (hemi sky/ground, intensity, moon colour/intensity, fog colour/density):
- night: `#83a6d2/#1b1711 1.5`, moon `#c8daf8 4.4`, fog `#25405a 0.026`
- dawn: `#aab6c6/#2a2620 1.7`, `#e9dccb 1.4`, fog `#8b97a3 0.045`
- day: `#c7d3c6/#3a3021 2.1`, `#fff1dc 2.6`, fog `#a3afa2 0.018`
- dusk: `#8f7f96/#2a2018 1.35`, `#ffa262 2.4`, fog `#5c4b5a 0.024`
- Per shot, lower the fog for drone/aerial shots: 0.003. Otherwise towers vanish in blue haze. Keep 0.012–0.02 for close night shots.

**Lighting lessons.**
- Start the hook bright enough to stop the scroll; the insert colour multiplier can go above 1.
- Never let a whole frame turn one blue mush. The moon disc, halo, stars, lit lantern and the subject must read.
- Ground mist cards are tinted `#4a5d78` at night, opacity ~0.2. They are hidden when the camera is above 3.2 m or looking steeply down, otherwise they show as white bands.
- Extend the ground plane to 2400 m so aerials never show its edge.

**Motion everywhere.** Joy hates static frames.
- Wind sway on all vegetation via an `onBeforeCompile` vertex patch:
  - offset x/z by `sin(uTime*f + worldPos) * max(0, y) * amp`, instancing-aware
  - amp ~0.012–0.02 trees, 0.05–0.12 ferns and grass
- Fireflies (shader points), falling leaves, clouds drifting over the moon, god-ray planes near the focus.
- Lantern flicker, water normal drift, blinking red aviation light on the radio mast.

## 5. Characters (2D cards with a cut-out rig)
Characters are drawn in code (Node + @napi-rs/canvas, `chars.js`) as graphic-novel figures:
- smooth Catmull-Rom shapes, dark outline
- cool shadow on the moon side, warm lantern side
- uniform details (name tag, epaulettes, belt), props (lantern, walkie, torch, register)
- poses per character, plus an automatic `_talk` variant with the mouth open

Export per pose: PNG + meta `{w, h, feetY, feetX, px, anc{head, hand, hand2, hair, eyes}, blink[x,y,w,h]}` and a small `_blink.png` eye-band crop redrawn with eyes closed.

In the film, each card is a MeshStandardMaterial plane:
- emissive 0.32, alphaTest 0.04, DoubleSide, subdivided 18x30
- billboards toward the camera (partial slerp 0.55 for high or low angles)
- per-frame life:
  - breathing scale and sway, tremble for scared poses
  - `_talk` texture swap in the speaker's VO windows
  - **vertex rig shader:** gaussian bumps around the anchors move the head (nod), hands (idle, x2.8 while talking) and long hair (downward wave); amps 5–14 mm scaled by height
  - blink overlay plane (same rig shader) visible 0.14 s every 3–5 s
  - walker: two additive eye glints that pulse and snap shut together

Rig vertex code (inject after `#include <begin_vertex>`: `transformed.xy += rigD(transformed.xy);`):
```glsl
uniform vec4 uA[5]; uniform vec4 uD[5]; uniform float uT; uniform float uTalk; // uA: x,y,radius,mode(0 bump,1 hair,2 hand)  uD: ampX,ampY,freq,phase
vec2 rigD(vec2 p){ vec2 d=vec2(0.); for(int i=0;i<5;i++){ vec4 a=uA[i]; if(a.z<=0.) continue; vec4 q=uD[i]; float ph=uT*q.z+q.w;
 if(a.w>.5&&a.w<1.5){ float dn=clamp((a.y-p.y)/a.z,0.,3.); float g=exp(-pow((p.x-a.x)/(a.z*1.1),2.))*smoothstep(0.,1.,dn)*step(p.y,a.y+a.z*.2); d.x+=g*q.x*sin(ph-p.y*5.)*(.5+.5*dn);}
 else { float g=exp(-dot(p-a.xy,p-a.xy)/(a.z*a.z)); float k=a.w>1.5?1.+uTalk*1.8:1.; float f=a.w>1.5?1.+uTalk*1.4:1.; d+=g*k*vec2(q.x*sin(ph*f),q.y*sin(ph*f*1.31+1.7)); } } return d; }
```

**Creatures.**
- The walker is a tall card (3.5 m) with a hand lantern glow.
- Processions walk along the ring trail. Keep the end angle fixed, and keep spacing and speed in metres when the ring size changes.
- Rigged GLB strangers come from Joy's models (SkeletonUtils clone + AnimationMixer walk).
- Hook "eyes only" mode: card material hidden, eye sprites shown with depthTest off.

**Inserts** are full-frame canvas plates:
- radio LED, map, letter, contract, newspaper (bilingual), register pages, watch 2:39/2:40, old photos
- each gets a slow push, grain, vignette, optional static flash
- run `inserts.js` before `chars.js` (chars overwrites some plates)

## 6. Horror fx system (world.setFx per shot)
`fx: (u) => ({ tower, prints, hands, imprint, radio, radioRed, bed, swing, clothes, bats, batsAt, blackout, jeepHand })`
- **prints / hands:** wet decals that appear one by one (0..1 progress), from the ladder landing to the cot, or up the ladder rails.
  - Material: color `#5f6f78`, emissive `#1c2a34`, roughness 0.06, metalness 0.55, so it reads as a wet sheen on dark wood.
  - Texture: blurred edges plus blotchy holes, so it never looks like a sticker.
- **imprint:** soft body-shaped wet print on the cot.
- **radio:** green flicker glow + point light on the base radio, walkie jitter; radioRed for the climax.
- **bed / swing / clothes:** cot rock, lantern swing, clothes flapping with no wind.
- **bats:** 46 flapping sprites burst up and out from batsAt. They are dark, so show them against a bright sky or the lantern glow.
- **blackout:** camp practicals flicker, then die.

## 7. Camera grammar (engaging = always moving)
Vary every shot:
- drone path (CatmullRom of [pos, look]) for openers
- orbit around the forbidden tower (r 16→12, height 4.5→7.5)
- crane up the ladder
- dolly along the lineup
- low dutch angles (roll 0.12–0.26) for fear
- push-ins on CUs (fov 32→26)
- POV from a platform with railing in the foreground
- tiny shake for panic

Check every camera against geometry:
- not inside a roof or table
- not in undergrowth hiding the subject
- not looking steeply down at billboard cards; they read tilted, so go lower or use bill: true

## 8. Sound design (synth, no licensing)
Synthesize every SFX in numpy/scipy (`sfx.py`):
- night/day jungle beds
- radio squelch, static, PTT, roger beep, radio_on
- wood creak, ladder climb, wet bare steps
- procession drone, lantern clinks, shuffle, ghost choir
- heartbeat (steady and rising), stingers, jumpscare, title hit, montage hit, riser, accelerating clock
- splash, water gurgle, torch click, whooshes, bat burst, generator die, chain rattle

Reverb: wet ≤ 0.4, tail ≤ 1 s.

Mix (`mix.py`):
- Place events at re-timed shot times.
- Sidechain-duck the FX under the VO: `g = 1 - 0.6*vo_envelope`.
- End montage:
  - one riser + accelerating clock under the whole montage
  - a clean montage_hit on every clue cut
  - hard silence before the reveal

Master:
```
ffmpeg -i vo_mix.wav -i fx_mix.wav -filter_complex "[0][1]amix=inputs=2:normalize=0,alimiter=limit=0.89:level=false,loudnorm=I=-14:TP=-2:LRA=11,alimiter=limit=0.9:level=false" -ar 48000 -c:a aac -b:a 256k master.m4a
```
Target ≈ -15 LUFS, peak ≤ -0.5 dBFS.

## 9. Post / look
Composer chain:
- InkPass outlines on the world only. Cards, sky and FX sit on the NOINK layer 3. Settings: color `#07090e`, strength 0.45, width 1.4/1.0.
- Bloom: intensity 1.1, threshold 0.82, mipmapBlur.
- NEUTRAL tone mapping.
- GradeEffect with `.set()` per time of day. Night: `ky [0.01,0.1,0.27,0.56,0.81,0.94,0.995]`, `sat [0.72,0.9,0.95]`, `tintS [0.055,-0.03]`, `vig [0.62,0.16]`.
- Grain overlay.

One composer only. Never remount it per shot (that crashed renders); dispose cards per shot instead.

## 10. Joy's 3D models (Google Drive file IDs)
Download: `https://drive.usercontent.google.com/download?id=ID&export=download&confirm=t`.

Optimize: `gltf-transform optimize in.glb out.glb --texture-compress webp --texture-size 1024 --simplify-ratio 0.5`.

Fit by bbox height/width/length in metres:

| Model | Drive ID | Use / fit |
|---|---|---|
| portable_radio__walkie_talkie_dual_band | 1CZi1B8c2xkCIuhPnrkP3ObDOmjsYgzyR | walkie on tables, h 0.2 |
| camping_buscraft_ambience | 1FWqdISmmxG5ig7uxEteZHQ2nBX-nnxAj | base radio / props |
| att_longlines_tower_prefab_2 | 1hkNp-wzftjDPqfQ9Mn3mpayGse-A7WIQ | radio mast at camp, h 26, red light |
| army_beds | 1f6vCRuul-KTySlX6739emHFEnuz5kXgD | keep only meshes with "one_bed", l 1.95 |
| wooden_table | 1avxw7c2-Cz4XMNmwC4CUC-WS55F4_Beo | tower + mess table, h 0.78 |
| office_furniture | 1V-Or-OotbL8RRagCZPW5F_o61zhHwj_s | desk h 1.37 |
| forest_wooden_house | 1h7ffoDsC6sYvf1mm4Jv-pb6cCR-zjyNc | gate office w 7.5 |
| old_house | 1LhUFB-znq8Ht2Jmy3mImQboz1x0_c2yi | barrack w 11 |
| barbed-wire_fence | 1aREoQjuGzUqBgTXSNqjIC84hF1FL53Pd | fence near gate, h 2.7 |
| wire_fence | 1esipNkYzHL3G_DcqXR5NjkoTrdVE0SLb | camp fence h 1.6 |
| barrier___wooden__barbed__wire_protection | 1SjXOAcgxotcu9-hKvJhJ0dgEGevpt14A | wooden barbed barriers l 2.6 |
| road_barrier / barrier | 1Ozhc8KuWO1Lcb09kjAVGmRDUIwJDZ6Ns / 1QiX9Rhw-rVU5r4iW7I5tvZSX1RIzNYu5 | boom (animated clip) h 1.2, striped h 1.1 |
| australian_railway_level_crossing | 16rzfV2yaC2ynUfISWIktJmEawkeVV4MX | boom barrier |
| jeep_willys_pickup | 1vDPMZmStICeVKkbxp8nlw_WFrcKIBhAa | 1998 jeeps, l 4.1, desnow shader |
| jeep_cherokee / jeep_metro_exodus | 13R8N_dkrOqnHqcAyYEISmBgUndV8Edfq / 1tIGYVIAdhf9Z1Uhq-ee0Pptig4JhkMR0 | olive forest jeep, l 4.3 |
| forest_skull | 1MCMksXAIEQ3OK-Qy1QVuR8KPI0kDLy8l | at the forbidden tower base, h 3.4 |
| oak_tree_-_savernake_forest | 156Wgh9VLy0DDIBNz3ZJaTY4mwQe6VClN | dead oak h 10 |
| death_forest_-_stranger | 16tkvCcDhWPsI7J7TZbV8mGnm8CyQwevn | rigged walking stranger h 2.35 |
| vine_branch / vine_with_branch | 1eFbSgaENbZhhU_BlEi8W5JBPrVNcj2w4 / 1So19j_QlGHs_QsntBYh48s6XUGN5oYvS | vines on tower and jeeps |
| free_bamboo_set / bamboo | 1vocMwqiCqdk2NwcYq-6IGL01Xz-DTHDi / 1TYghI4kCAPxh30fBMoIjR0mvSHIBr1g2 | bamboo clumps h 9–11 |
| old_forest_well | 1UQ3uLoirlxb1vXqywy4mlE-9OMp3EfFl | camp well h 2.4 |
| diesel_generator | 1Bw-6jf-vpXKWua4ewt4xHJ4ld6Oinn23 | camp generator l 1.4 |
| simple_industrial_storage_tank | 1AkHHHCvnUHXxcMQEMA_9Ro1UsxeX4k-t | water tank h 9.2 |
| steampunk_handwritten_typewriter | 1_PwrSLQixiStydguJWNs3WHtIGKRtOG8 | office prop |
| forest_mud_puddle | 1yRiVN3P0_JA-kUqgEHU1W8o06Tlc5d1d | puddles |
| survival_game_propasset_pack | 1CTrlN3IQ1HsF5SzLUt5LKMfxBflLVLP6 | camp props |
| viking_watch_tower / leworahang house / atap_straw_house | 1MwCgkh-VMUi7IAJcAm-eQSHK2-qjcNFF / 1gR9sviiIS804uW117zITUoyVxvH7gbNd / 1HXlWL0ZnTv-7Xgu5XX-C0vdiAVQFHpDB | extra structures |
| oak_forest_tree_pack, tree_gn, pine_forest_at_sunset, 21-treepack1.zip | 1AuZu3ijEMOW04Z1UG5b8CqdNzq3_ct-e, 183VBLk4FRGVs7YW_qCHJ00dwv1mjc3jc, 1zhdqFGN4bsK5EimZzP4tUpMWBvt1GySy, 13ut9CKxK8rmrBQ2UVKOGlYtvZzRqC7Qt | trees |
| 99-texture-hdr.zip | 1rPdpBuMQMAchlh1-eb7a1XDRlnqGHk3t | textures / HDRs |

The near trees, undergrowth, rocks and fire pit come from Poly Haven (CC0): island_tree_01/02/03, fern_02, shrub_02/03/04, pachira_aquatica_01, calathea_orbifolia_01, grass_medium_01, rock_moss_set_01/02, tree_stump_01, dry_branches_medium_01, root_cluster_01, boulder_01, stone_fire_pit.

**Credits block for the YouTube description.** Poly Haven (CC0) + every Sketchfab creator of the models above. Characters, inserts and sound design are original (Mad Angles AI).

## 11. Preview and render
- **Workspace preview** = stills only. Render picked frames (`fmap` list) with fast mode:
  - trees 8, under 70, shadow 1024, DPR 0.34–0.5
  - CPU SwiftShader takes ~20–60 s per frame
- Make a labelled contact sheet on a light background and send it for approval.
- **Final render** on Joy's PC: send a zip with:
  - src, public assets (models subset, chars, inserts, master.m4a, fonts, grain), package.json with pinned versions
  - `RENDER.bat`, `TEST_RENDER.bat` (first 30 s), `RENDER_PART.bat` (frame ranges), README with credits
- Render flags: `--gl=angle --concurrency=2 --timeout=900000 --codec=h264 --crf=18 --x264-preset=veryfast`.
- The .bat must pick a browser:
  1. `npx remotion browser ensure`
  2. else installed Chrome via `--browser-executable`
  3. else Edge
- Check `errorlevel`, so it never prints "Done" on failure. Recommend Node 22 LTS; Node 26 can break the browser download.

## 12. Gotchas learned
- A missing sprite name inside a shot silently crashes the render after a few frames. Validate every card and insert name before rendering, and wrap shot setup in try/catch with logging.
- Do not call `set({camera})` during render (React #520). Key the components that load per shot.
- Water must sit above the ground (y 0.03) with an env map, or the river is invisible.
- Far lamp glows are sized by distance, or they become orange discs near the camera.
- Card emissive 0.32 is needed so night characters don't go black. Do not key-light a silhouette card.
- A prop or chain on a gate must be parented to the moving leaf.
- After changing the world size, re-aim every hard-coded camera. Express positions relative to CAMP / GATE / tower helpers (`onTower(i, lx, lz, y)`, `nearTower(i, out, side)`), never raw numbers.
- Joy's feedback order of importance: sound clarity > hook > motion in every frame > lighting > detail.
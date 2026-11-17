# TOWER 13 — improvement plan (approved list; do NOT start until Joy says go)

Status: recorded 2026-11-17 after the 30 s GPU test render. Nothing below is implemented yet.

## Joy's decisions so far
- **Render:** final render at **2560x1440 (1440p)**, 30 fps. No 1080p deliverable. The test render must also be 1440p and cover 0–40 s, so the title is included.
- **On-screen text:** Hinglish only. Words that are common in English stay in English (Tower, radio, rules, wireless, duty, camp…).
- **Branding:**
  - No production company name anywhere for now; the name is changing. No logo sting, no watermark.
  - End card / description only: "Enquiry ke liye pinned comment check karo".
  - The making-of breakdown also gets no company name.
- **Characters:** 2D vs 3D is still OPEN. Joy asked questions first (see the answer in chat). The world stays 3D.
- **Process:** improvements happen only after Joy's approval. Show stills first; Joy renders the video locally.

## Camera rules (always)
- 180° rule, 30° rule, eyeline match, rule of thirds / grid, headroom and lead room.
- Motivated movement; leading lines.
- Coverage: establishing → medium → close-up; cut on action.
- Wanted moves:
  - drone flying through the jungle while characters run or arrive
  - 360° orbit shots at key moments
  - camera emerging from behind trees
  - more close-ups for reactions: anime style, exaggerated (fear face CU, eyes, sweat, shake)
  - many non-static insert / cut-in shots

## A. Fixes from the test render (0–30 s)
1. **0–3.3 s radio insert:** too dark (mean luma 0.03). Brighten the LED and screen, add a push or shake, or open on the Tower 13 orbit.
2. **Drone:**
   - far lantern glows read as flat orange discs → smaller
   - mast aviation light and floodlight make a red/white blob in frame → off in this shot
3. **Tower 13 roof:** white glare looks like a bulb. Reduce the tin metalness/specular.
4. **Radio on:**
   - green glow ball too big and neon → smaller, softer
   - walkie is mis-scaled (looks like a toolbox) → fit by length
   - register is a plain black slab → real cover texture
5. **Cot rocking:** invisible. Rock 2–3x stronger, keep the lantern blur out of frame, raise the light.
6. **Footprints:** read as white shoe prints. Make them darker and wet, with a brighter frame.
7. **Eyes shot:** eyes a bit bigger and brighter. Remove the white "plastic/snow" ground props (dry branches), which appear in many shots.
8. **Bhola CU (17–25.5 s):**
   - 8.5 s static, and Arjun's line plays over Bhola → split into 3 shots (Bhola only on his line → aerial of lanterns dying one by one → Bhola push-in)
   - redraw the stick-like arm holding the radio
9. **25.5 s flash:** washed out; the print reads as a sheet. Replace with 3–4 frames of a wet body print inside the flash, or remove.
10. **Black hold:** 1.4 s → 0.6 s.
11. **End crane:** table top blown white by the lantern pool light; Arjun too small → reduce the near light, shorter crane.

## B. Lighting (mobile + outdoor viewing is the priority)
- **Targets:**
  - night shots: mean luma 0.20–0.30 (now 0.03–0.15)
  - pure-black area < 15%
  - lifted blacks ~0.03
  - no highlight clipping
- **Day-for-night:** moonlight ~2x and bluer; more hemisphere fill; shadows blue, not black.
- **Depth layers:** dark foreground, lit subject, brighter fog/haze behind, so silhouettes read. Use a lighter fog colour at lower density.
- **Hero light** per shot on the story object (radio, cot, prints, eyes), plus a rim light.
- **Lanterns** light their surroundings with a bigger radius. Warm lantern vs cool moon contrast.
- **Per-shot auto exposure** toward the target luma.
- **Highlight roll-off;** no white roofs or tables.
- Brighter canopy and ground so the jungle isn't a black blanket.

## C. Colour grading
- **Mobile curve:** lifted blacks (not crushed), brighter mids, soft highlight shoulder.
- **Teal-orange split:** teal shadows; warm skin and lanterns.
- **Vignette:** lighter (now 0.62 → ~0.35).
- Light sharpening / clarity for phones.
- **Looks per time of day:** night teal, dawn pale gold, day muted green, 1998 flashback sepia.
- **Anti-banding:** grain kept, high bitrate. 1440p upload gets YouTube's better codec.

## D. Realism / 3D world
- Ambient occlusion (SSAO/N8AO) and contact shadows.
- **Real PBR textures** (Poly Haven, colour + roughness + normal):
  - weathered wet wood planks
  - bark
  - forest floor with leaves and mud
  - rusty corrugated tin
  - concrete and plaster
  - fabric for the cot
  - metal for the tank
- Wetness (lower roughness at night); decals: moss, rust streaks, mud stains, worn plates.
- **Terrain relief:** mounds, dips, roots, termite mounds, mud near the river. The ground is flat now.
- Real night-sky HDRI for stars and reflections in water and tin.
- Assam vegetation: sal, bamboo, banana, betel-nut palms, ferns, leaf litter, puddles. More real trees near the camera.
- Volumetric light (lantern halos, moon shafts).
- Depth of field on close-ups; motion blur on fast moves.
- Atmosphere: moths at lanterns, drizzle with wet sheen, breath vapour.
- Handheld micro-shake; subtle lens glow and dirt.
- Weather per night: Raat 4 rain, Raat 6 heavy fog, Raat 7 clear moon.
- Lantern death animation: flicker, smoke, dark.
- Walkers: 4-frame walk cycle and bob; close-up insert of the backward feet.
- **Animated inserts:** paper moves, torch sweep, dust. No static plates.
- **Remove:**
  - rigged 3D "strangers" (style clash), or restyle them
  - white dry-branch props
  - plain "RAAT X" cards (replaced by motion graphics)

## E. Characters (decision pending)
- **Recommended direction:** 3D toon-shaded bodies (rigged), ink outlines matching the world, 2D anime face textures for expressions and lip sync, plus 2D anime close-up cut-ins for exaggerated reactions.
- **Options for the 3D bodies:**
  - Joy supplies plain humanoid models (T/A-pose); rig with Mixamo / AccuRig
  - image-to-3D from our character sheets (quote credits first)
- Contact shadows under characters; colour-match characters to the scene light.

## F. Text, subtitles, motion graphics
- **Subtitles:**
  - burned-in Hinglish, 2–4 words per chunk, big bold, bottom-centre above the YouTube UI (~12% safe)
  - danger words in red ("TOWER 13", "JAWAB MAT DENA", "2:40")
  - also upload an SRT, plus an English subtitle track
- **Location card:** Assam map, pin drops, "NEELKANTH RESERVE FOREST, ASSAM".
- **Rules tracker:** 3 rules in a corner; a red strike when a rule is broken.
- **Lantern counter:** ring minimap; a tower's dot goes dark when it dies (12 → 11 → 7 → 5).
- **"RAAT 3 / 7" + "02:40 AM"** typewriter with glitch.
- **Radio transcript:** walkie-screen style text when voices come on the radio.
- **2–3 question prompts mid-story:** "Aap hote toh jawab dete?", "Ginti galat thi… ya kuch aur?"
- **Clue tags** only in the end montage ("CLUE 1: Torch", "CLUE 3: Plate pe 13").
- **Avoid:** text over dialogue, emoji, cheap fonts, long flashing, "true story" claims.
- YouTube chapters: Raat 1 … Raat 7.

## G. Showcase (no company name)
- Premium end-credits roll: voices, 3D asset credits.
- **Post-credits 40–60 s "How it was made" breakdown:**
  - wireframe → lighting → final split-screen
  - world flythrough
  - character turnarounds
  - stats (13 towers · 130+ shots · 12 voices · custom engine · 0 stock footage)
  - end: "Enquiry ke liye pinned comment check karo"
- Breakdown re-cut as a Reel and a case study.

## H. Sound
- Joy to review clarity on phone and headphones.
- Stereo panning; an original score with a radio motif; silence beats.
- Near sounds dry, far sounds muffled.

## I. Delivery
- **Trim** ~10.5 min → ~9–9.5 min: no static shot over 5 s, black holds ≤ 0.6 s.
- 4–5 vertical Shorts (9:16 cameras from the same engine).
- Thumbnail: Tower 13 + red radio + a question text.
- Render 1440p; test 0–40 s first.

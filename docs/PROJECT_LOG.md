# TOWER 13 — project log (everything decided in the production chat)

## Brief
- **Film:** "Jungle Ki Night Duty v2 — TOWER 13", a 16:9 YouTube horror film, ~10:37, Hinglish narration. Set in the Neelkanth Reserve Forest, Assam.
- **Format:** engine animation, a 3D world in code plus 2D graphic-novel characters. ElevenLabs is used for voice only. No AI video clips.
- **Owner:** Joy Goala (Mad Angles AI). Final render on his RTX 3050 Ti PC.

## Joy's standing rules
- Use all of his Drive 3D models. Never drop one for licence reasons; every creator is credited in the description.
- All notice boards and warnings are in **English + Assamese**.
- Narration voice must not sound robotic. Calm, close, suspenseful; pick by what viewers prefer.
- Detail matters on every character and object; nothing may look cheap.
- Quote credits before any paid generation. ElevenLabs: one take, regenerate only the wrong line.
- Previews are **stills only**. He renders the video locally.

## Story (see docs/Tower13_Script_v2.docx)
- **Setup.** 12 guards and the guide Bhola kaka are hired for 7 nights (₹5000/day cash).
- **Rules.** 3 rules on a tree board ("Only watch / Do not interfere / Tell no one"), plus a 4th rule: "Tower 13 se aawaz aaye toh jawab mat dena".
- **Nights.** A procession of lantern-carrying walkers with backward feet appears every night at 2:40. Each night one guard is lost by answering or calling.
- **Twist.** The narrator Arjun switched on his torch on night 1 and has been on Tower 13 ever since. He was the voice luring the others. Clues are planted throughout, then replayed in the end montage.
- **End.** "aapne abhi tak jawab toh nahi diya na?"

## Revision history (feedback → fix)

### Round 1: script approved; build started
- Narrator voice: Viraj – Suspenseful (Joy's clone was not ready).
- Bilingual boards.

### Round 2: "preview static images pe chal rahi hai"
- Explained: the engine animates the camera and objects; the earlier preview was an animatic from stills.

### Round 3: "sound designing bekaar, reverb overdone, voice clear nahi, montage ka sound ghatiya; full animation chahiye; creative camera angles; hook weak; lighting acchi nahi"
- **Sound:**
  - Reverb cut to wet ≤ 0.4, tail ≤ 1 s. Narrator dry.
  - Radio voice = bandpass blend. Ghost voice = doubling only.
  - FX sidechain-ducked under the VO.
  - New montage: riser + accelerating clock + a clean hit per clue + hard silence.
  - Master -15 LUFS.
- **New hook:** radio whisper → drone dive → Tower 13 lights itself → … → Bhola "jawab mat dena" → flash scare → Arjun alone → title.
- **Animation:**
  - wind on all vegetation; fireflies, falling leaves, mist, clouds over the moon, god rays
  - lantern flicker, water drift, animated gate boom
  - camera paths, orbits, cranes and dutch roll
  - key/rim lights on characters; breathing, tremble and lip flaps on cards
- **Lighting:** less fog on aerials, brighter radio insert, tinted ground mist hidden on high or downward shots.

### Round 4 (latest)
Joy's notes:
- "starting mein walkers mat dikhao"
- "more camera angles"
- "walker ke eyes/hair/hand mein movement, sab characters"
- "radio/wireless/radio tower ka 3D diya tha, use kyon nahi kiya"
- "tower mein table aur bed"
- "jungle chaaron taraf se band, fencing nahi, gate khula dikh raha; gate bandh aur heavy"
- "towers bahut kareeb, door door karo"
- "ajeeb horror activities add karo"

Fixes:
- **Hook without walkers, only traces:**
  - the dead base radio switches on
  - the cot rocks and the lantern swings
  - wet footprints walk from the ladder to the cot
  - two eye glints in the tree line
  - 0.5 s flash of a wet body print on the cot
- **Joy's models used:**
  - radio mast (`att_longlines_tower_prefab_2`) at camp, 26 m, with a blinking red light
  - base radio and walkie on every tower table and in the mess shed
  - single army cot (from `army_beds`, `keep: "one_bed"`) and wooden table on every platform
  - also on every platform: stool, matka, register, roof antenna
- **Perimeter fence** ring around the whole reserve (R+62): concrete posts, chain-link, barbed wire on Y-arms.
- **Heavy gate:**
  - concrete pillars with floodlights
  - double iron gate with chain, padlock and NO ENTRY · প্ৰৱেশ নিষেধ plate
  - closed at night; opens only on arrival and exit
- **Towers spread:** ring 48 → 88 m (~47 m apart). Camp, gate, river and jeeps moved out; all cameras re-aimed.
- **Character rig:**
  - vertex shader moves head, hands (more while talking) and long hair
  - blink overlays exported per pose
  - walker eye glints
- **Horror activities:**
  - bats burst on the first procession
  - wet footprints on Arjun's tower at dawn
  - clothes move with no wind
  - wet handprints climb the ladder on night 4
  - handprint on the jeep windscreen
  - generator dies on night 6
  - radio red and cot rocking at the climax
  - new SFX for all of these

## Key numbers
- **Ring and layout:** R = 88. Platform 8 m. Camp z = R+34, gate z = R+62, highway R+84, river ≈ -(R+16).
- **Night preset:**
  - hemi `#83a6d2`/`#1b1711` 1.5
  - moon `#c8daf8` 4.4
  - fog `#25405a` 0.026
  - aerial fog 0.003; close night shots 0.012–0.02
- **Cards:** emissive 0.32; ghosts tinted `#a8b4c4` 0.3.
- **Post:**
  - ink `#07090e` strength 0.45
  - bloom 1.1 / threshold 0.82
  - NEUTRAL tone mapping
  - grade per time of day (Film.tsx `GR`)
- **Fast preview:** trees 8, undergrowth 70, shadow 1024 (`FAST=1 TREES=8 DPR=0.34`). CPU takes ~20–60 s per frame.
- **Audio:** VO model `eleven_v4`, chunk separator " …… ", LEAD 0.25 s, ducking 0.6, master `loudnorm I=-14 TP=-2` → measured -15.0 LUFS, peak -0.5 dBFS.

## Voices (ElevenLabs)

| Role | Voice | voice_id |
|---|---|---|
| Arjun (narrator) | Viraj – Suspenseful | P1bg08DkjqiVEzOn76yG |
| Bhola kaka | Danish K – Dramatic Old | r3CPEby3BZ6hrPxHG8h2 |
| Barua sir | Kuber J | unEFMOkn1ERDgzALVe2Z |
| Sameer | Ranbir | yRis6UiS4dtT4Aqv72DC |
| Rinku | Suraj | vn4e1QbAEOawHqqSIJvz |
| Mohan | Sudhir | XNJDyPyJ8r4J7de0WJwB |
| Dev | Amit Gupta | Sxk6njaoa7XLsAFT7WcN |
| Kishan | Manu | P5Y7cJhVoUoFVrXgyLyN |
| Guddi | Mishi | Pbk8E6dlpCANrnpOLIns |
| Lakhan | Sourabh | trxRCYtDC6qFREKq6Ek2 |
| Tenzing | Raqib | 0UZ29F1kNDvmelKG8QCM |

- ElevenLabs flow: "TOWER 13 — VO" (`FOGi8W5TnBe6efGDCYpv`).
- Credits used: about 7,255 for the main VO, plus 277 for the hook.

## Known weak spots to check in the GPU render
- Bats are dark against the night sky.
- The jeep handprint and ladder handprints were not clearly visible in the stills.
- The body print was softened after the stills were made.
- Character blink overlays: closed-eye brows differ slightly from the open-eye brows.

## Gotchas
- A missing sprite name crashes the render a few frames in. Validate every card and insert name before rendering.
- Use one EffectComposer only, and change the grade with `.set()`. Dispose cards per shot.
- Billboard cards look tilted from steep angles. Use `bill: true` or lower the camera.
- Attach props to moving parts (gate chain → left leaf).
- After changing the world size, re-aim every camera. Write positions relative to the helpers, never as raw numbers.
- Node 26 + Remotion 4.0.290: Chrome headless download fails. Use Node 22 (the .bat files fall back to Chrome or Edge).

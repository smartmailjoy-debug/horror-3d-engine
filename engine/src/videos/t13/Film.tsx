// TOWER 13 — the film. One persistent 3D world; a data-driven shot list (shots.ts) drives camera, cast cards, lamps,
// procession, torch, inserts and DOM cards. Post: hairline ink, bloom, neutral tone-map, per-time-of-day grade, grain.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, staticFile, useCurrentFrame, delayRender, continueRender, getInputProps, useVideoConfig, Audio } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, NOINK } from "../bridge/ink";
import { GradeEffect, GradeParams } from "../bridge/grade";
import { A, loadAll, assetsReady } from "./assets";
import { NOINK as _NI } from "../bridge/ink";
import { buildWorld, World, TimeOfDay, R, QUALITY } from "./world";
import { buildHome, buildBus } from "./sets";
import { SHOTS, Shot, FPS, TOTAL, shotAt, CastI } from "./shots";
import { glowTex } from "./tex";
import { dm, ANIM } from "./assets";
import { TALK } from "./talk";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";

const PI2 = Math.PI / 2;
const GR: Record<TimeOfDay, GradeParams> = {
  night: { ky: [0.01, 0.1, 0.27, 0.56, 0.81, 0.94, 0.995], sat: [0.72, 0.9, 0.95], tintS: [0.055, -0.03], tintM: [0.006, -0.006], tintH: [-0.03, 0.03], vig: [0.62, 0.16] },
  dawn: { ky: [0.02, 0.12, 0.28, 0.54, 0.78, 0.92, 0.99], sat: [0.7, 0.78, 0.85], tintS: [0.03, -0.02], tintM: [0.0, 0.0], tintH: [-0.01, 0.01], vig: [0.5, 0.2] },
  day: { ky: [0.02, 0.11, 0.27, 0.53, 0.78, 0.92, 0.99], sat: [0.8, 0.85, 0.9], tintS: [0.02, -0.01], tintM: [-0.005, 0.005], tintH: [-0.01, 0.02], vig: [0.45, 0.22] },
  dusk: { ky: [0.01, 0.1, 0.27, 0.55, 0.8, 0.93, 0.99], sat: [0.8, 0.9, 0.95], tintS: [0.04, -0.03], tintM: [-0.01, 0.01], tintH: [-0.03, 0.04], vig: [0.55, 0.18] },
};
const ease = (u: number) => u * u * (3 - 2 * u);
const INS: Record<string, THREE.Texture> = {};
const insList = ["led_on", "led_dim", "led_off", "map", "map_cut", "phone", "envelope", "letter", "contract", "key4", "watch_239", "watch_240", "reg_11", "reg_lapata", "reg_2027", "paper1998", "face_torch", "photo1998", "photo_brothers", "mirror", "reflection", "bangles", "ladderhand"];
let insReady = false; let insLoading: Promise<void> | null = null;
const loadIns = () => insLoading ?? (insLoading = Promise.all(insList.map((n) => new THREE.TextureLoader().loadAsync(staticFile(`t13/ins/${n}.png`)).then((t) => { t.colorSpace = THREE.SRGBColorSpace; INS[n] = t; }))).then(() => { insReady = true; }));

// 2D cards get a light "cut-out rig" without layers: the plane is subdivided and a vertex shader moves soft regions around
// anchors exported by chars.js (head nod, both hands idling / gesturing harder while talking, long hair waving), plus a
// blink overlay (the eye band redrawn closed) and, for the walker, two eye glints behind the hair that pulse and blink.
const RIG_VS = `
uniform vec4 uA[5]; uniform vec4 uD[5]; uniform float uT; uniform float uTalk;
vec2 rigD(vec2 p) { vec2 d = vec2(0.0);
  for (int i = 0; i < 5; i++) { vec4 a = uA[i]; if (a.z <= 0.0) continue; vec4 q = uD[i]; float ph = uT * q.z + q.w;
    if (a.w > 0.5 && a.w < 1.5) { float dn = clamp((a.y - p.y) / a.z, 0.0, 3.0); float g = exp(-pow((p.x - a.x) / (a.z * 1.1), 2.0)) * smoothstep(0.0, 1.0, dn) * step(p.y, a.y + a.z * 0.2);
      d.x += g * q.x * sin(ph - p.y * 5.0) * (0.5 + 0.5 * dn); }
    else { float g = exp(-dot(p - a.xy, p - a.xy) / (a.z * a.z)); float k = a.w > 1.5 ? 1.0 + uTalk * 1.8 : 1.0; float f = a.w > 1.5 ? 1.0 + uTalk * 1.4 : 1.0;
      d += g * k * vec2(q.x * sin(ph * f), q.y * sin(ph * f * 1.31 + 1.7)); } }
  return d; }
`;
function rigMaterial(mat: THREE.MeshStandardMaterial, uni: Record<string, THREE.IUniform>) {
  mat.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, uni); sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\n" + RIG_VS).replace("#include <begin_vertex>", "#include <begin_vertex>\n transformed.xy += rigD(transformed.xy);"); };
  mat.customProgramCacheKey = () => "t13rig";
}
function makeCard(name: string, heightM: number, tint?: string) {
  const m = A.chMeta[name], t = A.ch[name];
  if (!m || !t) throw new Error("missing card " + name);
  const pxPerM = m.px / heightM, w = m.w / pxPerM, h = m.h / pxPerM;
  const fx0 = m.feetX ?? m.w / 2, L = (p: number[]) => new THREE.Vector2((p[0] - fx0) / pxPerM, (m.feetY - p[1]) / pxPerM);
  const geo = new THREE.PlaneGeometry(w, h, 18, 30); const fx = fx0 / m.w, fy = m.feetY / m.h;
  geo.translate(w * (0.5 - fx), h * (fy - 0.5), 0);
  const ghost = !!tint;
  const mat = new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.04, roughness: 1, metalness: 0, emissive: ghost && tint !== "eyes" ? tint : "#ffffff", emissiveMap: t, emissiveIntensity: ghost ? 0.3 : 0.32, color: ghost && tint !== "eyes" ? tint : "#ffffff", side: THREE.DoubleSide, opacity: ghost ? 0.92 : 1 });
  const mesh = new THREE.Mesh(geo, mat); mesh.renderOrder = 2; mesh.castShadow = true;
  const an = m.anc; const seed = (name.length * 7.31 + heightM * 13.7) % 1;
  if (an) { const sc = heightM / 1.72, wk = name === "walker";
    const A4: THREE.Vector4[] = [], D4: THREE.Vector4[] = []; const add = (p: number[] | undefined, r: number, mode: number, ax: number, ay: number, f: number, ph: number) => { if (!p) return; const q = L(p); A4.push(new THREE.Vector4(q.x, q.y, r * sc, mode)); D4.push(new THREE.Vector4(ax * sc, ay * sc, f, ph)); };
    add(an.head, 0.1, 0, wk ? 0.01 : 0.005, wk ? 0.006 : 0.003, wk ? 1.7 : 0.8, seed * 6);
    add(an.hand, 0.12, 2, wk ? 0.012 : 0.014, wk ? 0.02 : 0.01, wk ? 1.4 : 1.1, seed * 6 + 1);
    add(an.hand2, wk ? 0.16 : 0.12, 2, wk ? 0.035 : 0.01, wk ? 0.02 : 0.008, wk ? 0.55 : 0.95, seed * 6 + 2.3);
    add(an.hair, wk ? 0.2 : 0.16, 1, wk ? 0.03 : 0.02, 0, wk ? 1.3 : 1.7, seed * 6 + 0.7);
    while (A4.length < 5) { A4.push(new THREE.Vector4(0, 0, 0, 0)); D4.push(new THREE.Vector4()); }
    const uni = { uA: { value: A4 }, uD: { value: D4 }, uT: ANIM.time, uTalk: { value: 0 } }; rigMaterial(mat, uni); mesh.userData.uni = uni;
    const bt = A.ch[name + "_blink"];
    if (m.blink && bt) { const [x0, y0, bw, bh] = m.blink; const a0 = L([x0, y0 + bh]), a1 = L([x0 + bw, y0]); const g2 = new THREE.PlaneGeometry(a1.x - a0.x, a1.y - a0.y, 4, 2); g2.translate((a0.x + a1.x) / 2, (a0.y + a1.y) / 2, 0.002);
      const bm = mat.clone(); bm.map = bt; bm.emissiveMap = bt; bm.alphaTest = 0.02; rigMaterial(bm, uni); const bl = new THREE.Mesh(g2, bm); bl.renderOrder = 3; bl.visible = false; mesh.add(bl); mesh.userData.blink = bl; }
    if (an.eyes) { const eg = glowTex("weye", "rgba(255,236,200,1)", "rgba(255,200,140,0)", 0.06); mesh.userData.eyes = an.eyes.map((p) => { const q = L(p); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: eg, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); sp.position.set(q.x, q.y, 0.03); sp.scale.setScalar(0.05 * sc); sp.layers.set(NOINK); mesh.add(sp); return sp; }); } }
  mesh.userData.seed = seed;
  if (tint === "eyes") { mat.visible = false; mesh.castShadow = false; (mesh.userData.eyes as THREE.Sprite[] | undefined)?.forEach((e, k, arr) => { const mid = arr[0].position.clone().add(arr[arr.length - 1].position).multiplyScalar(0.5); e.position.sub(mid).multiplyScalar(2.2).add(mid); e.scale.setScalar(0.11 * heightM / 1.72); e.material.color.set("#dff4ff"); e.material.depthTest = false; e.renderOrder = 9; }); } // only the eye glints in the dark
  return mesh;
}
// per-frame rig state: blink every few seconds, talk boost, walker eye pulse (eyes snap shut together, then reopen brighter)
function animateRig(mesh: THREE.Mesh, T: number, talking: number) {
  const ud = mesh.userData; const sd = ud.seed ?? 0; const per = 3.1 + sd * 2.4, ph = (T + sd * 7.7) % per;
  if (ud.uni) ud.uni.uTalk.value = talking;
  if (ud.blink) (ud.blink as THREE.Mesh).visible = ph < 0.14;
  if (ud.eyes) { const shut = ((T + sd * 5) % 4.2) < 0.18; (ud.eyes as THREE.Sprite[]).forEach((e, k) => { e.visible = !shut; e.material.opacity = 0.75 + 0.25 * Math.sin(T * 7 + k * 2); }); }
}

function makeStranger() {
  const raw = dm("stranger"); const skin = new THREE.MeshStandardMaterial({ color: "#5a5f5a", roughness: 0.5, metalness: 0.05, emissive: "#0c1010" });
  raw.traverse((o) => { const m = o as THREE.SkinnedMesh; if (m.isMesh) { m.material = skin; m.castShadow = true; m.frustumCulled = false; } });
  const clips = A.dmAnim.stranger ?? []; const mixer = new THREE.AnimationMixer(raw); const clip = clips.find((c) => /walk/i.test(c.name)) ?? clips[0]; if (clip) mixer.clipAction(clip).play(); mixer.update(0.01);
  raw.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(raw, true), sz = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
  const inner = new THREE.Group(); inner.add(raw); raw.position.set(-c.x, -b.min.y, -c.z); inner.scale.setScalar(2.35 / Math.max(0.01, sz.y));
  const outer = new THREE.Group(); outer.add(inner); return { o: outer, mixer };
}
type Stage = { world: World; home: THREE.Group; bus: THREE.Group; insert: THREE.Mesh; cards: THREE.Group; proc: THREE.Group; mobile: THREE.PointLight[]; torch: THREE.SpotLight; glowT: THREE.Texture;
  key: THREE.SpotLight; rim: THREE.SpotLight; mist: THREE.Mesh[]; flies: THREE.Points; leaves: THREE.Mesh[]; boomMix: THREE.AnimationMixer | null; boomDur: number };

const Scene: React.FC<{ f: number }> = ({ f }) => {
  const { scene, camera, gl } = useThree();
  const S = useMemo<Stage>(() => {
    gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap;
    if ((getInputProps() as { post?: { fast?: boolean } }).post?.fast) Object.assign(QUALITY, { trees: Number((getInputProps() as { post?: { trees?: number } }).post?.trees ?? 8), under: 70, shadow: 1024 });
    const world = buildWorld(); scene.add(world.root);
    const home = buildHome(); scene.add(home);
    const bus = buildBus(); scene.add(bus);
    const insert = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: true, fog: false })); insert.position.set(-5000, 0, 0); insert.layers.set(NOINK); scene.add(insert);
    const cards = new THREE.Group(); scene.add(cards); const proc = new THREE.Group(); scene.add(proc);
    const mobile = Array.from({ length: 3 }, () => { const l = new THREE.PointLight("#ffaa5a", 0, 10, 1.5); scene.add(l); return l; });
    const torch = new THREE.SpotLight("#fff1d0", 0, 40, 0.26, 0.55, 1.1); scene.add(torch, torch.target);
    const key = new THREE.SpotLight("#ffc890", 0, 12, 0.55, 0.9, 1.3), rim = new THREE.SpotLight("#9fc0ff", 0, 12, 0.6, 0.9, 1.3); scene.add(key, key.target, rim, rim.target);
    // drifting ground mist: soft noise cards that scroll
    const mistT = (() => { const c = document.createElement("canvas"); c.width = 512; c.height = 256; const g = c.getContext("2d")!; let q = 9; const r = () => ((q = (q * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 90; i++) { const x = r() * 512, y = 60 + r() * 140, r0 = 30 + r() * 90; const gr = g.createRadialGradient(x, y, 0, x, y, r0); gr.addColorStop(0, "rgba(190,205,225,0.32)"); gr.addColorStop(1, "rgba(190,205,225,0)"); g.fillStyle = gr; g.fillRect(x - r0, y - r0, r0 * 2, r0 * 2); }
      const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const mist = Array.from({ length: 7 }, (_, k) => { const t = mistT.clone(); t.needsUpdate = true; t.wrapS = THREE.RepeatWrapping; t.repeat.set(1.5, 1); const m = new THREE.Mesh(new THREE.PlaneGeometry(26, 4.5), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.55, depthWrite: false, fog: true }));
      m.layers.set(NOINK); m.userData.k = k; scene.add(m); return m; });
    // fireflies
    const N = 70, fp = new Float32Array(N * 3), seed = new Float32Array(N); for (let k = 0; k < N; k++) { seed[k] = k * 7.31; }
    const fg = new THREE.BufferGeometry(); fg.setAttribute("position", new THREE.BufferAttribute(fp, 3)); fg.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
    const flies = new THREE.Points(fg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: ANIM.time },
      vertexShader: "attribute float seed; uniform float uTime; varying float vA; void main(){ vA = 0.25 + 0.75 * pow(max(0.0, sin(uTime * (1.3 + fract(seed) * 2.0) + seed)), 3.0); vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = 9.0 * (8.0 / -mv.z); gl_Position = projectionMatrix * mv; }",
      fragmentShader: "varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d) * vA; gl_FragColor = vec4(0.85, 1.0, 0.55, a); }" }));
    flies.layers.set(NOINK); flies.frustumCulled = false; scene.add(flies);
    // falling leaves
    const leafT = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d")!; g.fillStyle = "#6a5a2a"; g.beginPath(); g.ellipse(32, 32, 26, 11, 0.5, 0, 7); g.fill(); g.strokeStyle = "#3a3016"; g.lineWidth = 2; g.beginPath(); g.moveTo(10, 44); g.lineTo(54, 20); g.stroke(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const leaves = Array.from({ length: 26 }, (_, k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.11), new THREE.MeshLambertMaterial({ map: leafT, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide })); m.userData.k = k; scene.add(m); return m; });
    let boomMix: THREE.AnimationMixer | null = null, boomDur = 1; const clip = A.dmAnim.boom?.[0]; if (clip && world.boom) { boomMix = new THREE.AnimationMixer(world.boom); boomMix.clipAction(clip).play(); boomDur = clip.duration; boomMix.setTime(0); }
    return { world, home, bus, insert, cards, proc, mobile, torch, glowT: glowTex("mob", "rgba(255,196,120,1)", "rgba(255,170,90,0)", 0.04), key, rim, mist, flies, leaves, boomMix, boomDur };
  }, [scene, gl]);
  const { i, s, u, local } = shotAt(f);
  const prev = useMemo(() => ({ idx: -1, cards: [] as { m: THREE.Mesh; c: CastI }[], proc: [] as { m: THREE.Mesh; g: THREE.Sprite; k: number }[], props: [] as { o: THREE.Object3D; p: import("./shots").PropI }[], refl: null as Reflector | null, str: [] as { o: THREE.Object3D; mixer: THREE.AnimationMixer; k: number }[] }), []);
  if (prev.idx !== i) { try { // ---- shot setup
    const kill = (g: THREE.Object3D) => g.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh || (o as THREE.Sprite).isSprite) { if (m.geometry && !(o as THREE.Sprite).isSprite) m.geometry.dispose(); const mt = m.material as THREE.Material; if (mt && !o.userData.keep) mt.dispose(); } });
    for (const { m } of prev.cards) kill(m); for (const { m, g } of prev.proc) { kill(m); g.material.dispose(); }
    prev.idx = i; S.cards.clear(); S.proc.clear(); prev.cards = []; prev.proc = [];
    const tod = s.tod ?? "night"; S.world.setTime(tod, scene); if (s.fog !== undefined) (scene.fog as THREE.FogExp2).density = s.fog;
    (S.home.userData.lights.dusk as THREE.SpotLight).intensity = tod === "dusk" ? 30 : 6;
    S.home.visible = !!s.cam && s.cam.p.x > 1000; S.torch.visible = !!s.torch; S.key.visible = S.rim.visible = !!(s.cast && s.cast.length);
    for (const c of s.cast ?? []) { const m = makeCard(c.c, c.h, c.tint); m.position.copy(c.p); if (c.noReflect) { m.layers.set(5); } S.cards.add(m); prev.cards.push({ m, c }); }
    prev.props = []; for (const p of s.props ?? []) { const o = dm(p.k); o.position.copy(p.p); o.rotation.y = p.ry ?? 0; if (p.s) o.scale.multiplyScalar(p.s); S.cards.add(o); prev.props.push({ o, p }); }
    if (s.bangles) { const red = new THREE.MeshStandardMaterial({ color: "#b8141a", roughness: 0.35, metalness: 0.3, emissive: "#3a0404" }), gold = new THREE.MeshStandardMaterial({ color: "#d8b04a", roughness: 0.3, metalness: 0.8 });
      [[0, 0, 0], [0.35, 0, 0.2], [-0.3, 0, 0.25], [0.15, 0, -0.3], [-0.45, 0, -0.15], [0.55, 0, -0.2]].forEach(([x, y, z], k) => { const b = new THREE.Mesh(new THREE.TorusGeometry(0.075, k % 3 === 2 ? 0.006 : 0.012, 8, 24), k % 3 === 2 ? gold : red); b.rotation.x = Math.PI / 2 + (k - 2) * 0.08; b.position.copy(s.bangles!).add(new THREE.Vector3(x, y, z)); S.cards.add(b); }); }
    if (prev.refl) { scene.remove(prev.refl); prev.refl.dispose(); prev.refl = null; }
    if (s.reflect && s.cam) { const r = new Reflector(new THREE.PlaneGeometry(14, 9), { clipBias: 0.003, textureWidth: 1024, textureHeight: 1024, color: new THREE.Color("#6f7c80") }); r.rotation.x = -Math.PI / 2; r.position.set(s.cam.l.x, 0.05, s.cam.p.z + 6.5); scene.add(r); prev.refl = r; }
    camera.layers.enable(5);
    if (s.proc) for (let k = 0; k < s.proc.n; k++) { const nm = s.proc.who?.[k] ?? "walker"; const ghost = nm !== "walker";
      const m = makeCard(nm, nm === "walker" ? 3.5 + ((k * 37) % 5) * 0.12 : 1.72, ghost ? "#a8b4c4" : undefined);
      const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: S.glowT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); g.scale.setScalar(1.1); g.layers.set(NOINK);
      S.proc.add(m, g); prev.proc.push({ m, g, k }); }
    prev.str = []; if (s.proc?.strangers) for (let k = 0; k < s.proc.strangers; k++) { const st = makeStranger(); S.proc.add(st.o); prev.str.push({ ...st, k: s.proc.n + k }); }
    if (s.cam) { const c = s.cam; S.world.setNear(c.p, c.l); }
  } catch (e) { console.error("T13 SETUP ERROR shot " + s.n + ": " + (e as Error).message + " " + (e as Error).stack); throw e; } }
  // ---- per frame
  const W = S.world; W.setLamps((n) => (s.lamps ? s.lamps(n, u) : true));
  const cam = camera as THREE.PerspectiveCamera; cam.near = 0.05; cam.far = 900;
  if (s.kind === "insert") {
    const tex = INS[s.ins!]; (S.insert.material as THREE.MeshBasicMaterial).map = tex; (S.insert.material as THREE.MeshBasicMaterial).needsUpdate = true;
    const [z0, z1] = s.push ?? [9.6, 8.6]; const pz = z0 + (z1 - z0) * ease(u); const dx = s.pan ? s.pan[0] + (s.pan[1] - s.pan[0]) * ease(u) : 0;
    cam.fov = 50; cam.position.set(-5000 + dx, 0, pz); cam.lookAt(-5000 + dx, 0, 0);
    (S.insert.material as THREE.MeshBasicMaterial).color.setScalar(s.dim ? s.dim(u) : 1);
  } else if (s.cam) {
    const c = s.cam, e = c.linear ? u : ease(u); let p = c.p.clone().lerp(c.p1 ?? c.p, e), l = c.l.clone().lerp(c.l1 ?? c.l, e);
    if (c.path && c.path.length > 1) { const cp = new THREE.CatmullRomCurve3(c.path.map((k) => k[0])), cl = new THREE.CatmullRomCurve3(c.path.map((k) => k[1])); p = cp.getPoint(e); l = cl.getPoint(e); }
    if (c.orbit) { const o = c.orbit, a = o.a0 + (o.a1 - o.a0) * e, rr = o.r + (o.r1 ?? o.r - o.r) * 0 + ((o.r1 ?? o.r) - o.r) * e, hh = o.h + ((o.h1 ?? o.h) - o.h) * e; p = new THREE.Vector3(o.c.x + Math.cos(a) * rr, hh, o.c.z + Math.sin(a) * rr); l = o.c.clone().setY(o.ly ?? o.c.y); }
    if (c.shake) { const t = local / FPS; p.x += Math.sin(t * 7.1) * c.shake * 0.6 + Math.sin(t * 13.3) * c.shake * 0.3; p.y += Math.sin(t * 9.7 + 1) * c.shake * 0.5; }
    cam.position.copy(p); cam.fov = c.fov + ((c.fov1 ?? c.fov) - c.fov) * e; cam.lookAt(l); if (c.roll) cam.rotateZ(c.roll + (c.roll1 !== undefined ? (c.roll1 - c.roll) * e : 0));
  }
  cam.updateProjectionMatrix();
  const T = f / FPS, focus = s.cam ? s.cam.l : new THREE.Vector3(); W.setFx(s.kind === "world" && s.fx ? s.fx(u) : {}); W.tick(T, cam.position, focus);
  const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd); const flat = fwd.clone().setY(0).normalize();
  const world = s.kind === "world";
  const mistOn = cam.position.y < 3.2 && fwd.y > -0.3; const mistCol = (s.tod ?? "night") === "night" ? "#4a5d78" : "#9a8c80";
  S.mist.forEach((m, k) => { m.visible = world && (s.tod ?? "night") !== "day" && mistOn; (m.material as THREE.MeshBasicMaterial).color.set(mistCol); const d = 4 + k * 3.2; m.position.copy(cam.position).addScaledVector(flat, d).add(new THREE.Vector3(0, -cam.position.y + 0.6 + (k % 3) * 0.55, 0)); m.lookAt(cam.position.x, m.position.y, cam.position.z);
    const mp = (m.material as THREE.MeshBasicMaterial).map!; mp.offset.x = T * (0.012 + k * 0.004) + k * 0.37; (m.material as THREE.MeshBasicMaterial).opacity = 0.2 + 0.06 * Math.sin(T * 0.3 + k); });
  { const pos = S.flies.geometry.attributes.position as THREE.BufferAttribute; S.flies.visible = world && (s.tod ?? "night") === "night" && cam.position.y < 30;
    for (let k = 0; k < pos.count; k++) { const sd = k * 7.31, ox = Math.sin(sd) * 11, oz = Math.cos(sd * 1.3) * 11; pos.setXYZ(k, focus.x + ox + Math.sin(T * 0.4 + sd) * 1.2, 0.4 + (k % 7) * 0.32 + Math.sin(T * 0.7 + sd * 2) * 0.35, focus.z + oz + Math.cos(T * 0.35 + sd) * 1.2); } pos.needsUpdate = true; }
  S.leaves.forEach((m) => { const k = m.userData.k as number, sd = k * 3.7, per = 7 + (k % 5); const ph = ((T + sd) % per) / per; m.visible = world && cam.position.y < 25;
    m.position.set(focus.x + Math.sin(sd) * 7 + Math.sin(T * 1.1 + sd) * 0.6, 6.5 - ph * 6.4, focus.z + Math.cos(sd * 1.7) * 7 + Math.cos(T * 0.9 + sd) * 0.6); m.rotation.set(T * 2.1 + sd, T * 1.3 + sd, T * 1.7); });
  if (S.boomMix) S.boomMix.setTime(s.boomOpen ? Math.min(1, u * 2.5) * S.boomDur * 0.999 : 0);
  S.world.setGate(s.boomOpen ? THREE.MathUtils.smoothstep(u, 0.15, 0.7) : 0);
  // key + rim light on the lead character (warm lantern key from camera-left, cool moon rim from behind)
  const lead = prev.cards[0] && !prev.cards[0].c.tint ? prev.cards[0].m : undefined; const nightish = (s.tod ?? "night") !== "day";
  if (lead && world) { const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize(); const hc = lead.position.clone().add(new THREE.Vector3(0, prev.cards[0].c.h * 0.8, 0));
    S.key.position.copy(hc).addScaledVector(right, -1.6).addScaledVector(fwd, -1.8).add(new THREE.Vector3(0, 0.9, 0)); S.key.target.position.copy(hc); S.key.intensity = nightish ? 9 : 4; S.key.color.set(nightish ? "#ffc58a" : "#fff0dc");
    S.rim.position.copy(hc).addScaledVector(fwd, 2.2).addScaledVector(right, 1.2).add(new THREE.Vector3(0, 1.4, 0)); S.rim.target.position.copy(hc); S.rim.intensity = nightish ? 14 : 3; S.key.target.updateMatrixWorld(); S.rim.target.updateMatrixWorld(); }
  else { S.key.intensity = 0; S.rim.intensity = 0; }
  // cast: billboard yaw, optional walk, lantern light
  let mob = 0;
  for (const { m, c } of prev.cards) {
    if (c.walk) { m.position.copy(c.p).lerp(c.walk, ease(u)); m.position.y += Math.abs(Math.sin(local / FPS * 6)) * 0.03; }
    m.visible = !(c.hideAt !== undefined && u > c.hideAt);
    // idle life: breathing, sway; scared poses tremble; mouth flaps while this character's line plays
    const id = c.c.split("_")[0], scared = /Scared|scared|Tears|tears/.test(c.c);
    m.scale.set(1, 1 + 0.009 * Math.sin(T * 2.2 + id.length), 1); m.rotateZ((Math.sin(T * 0.9 + id.length) * 0.006) + (scared ? Math.sin(T * 37) * 0.006 : 0));
    const talk = A.ch[c.c + "_talk"]; const mat = m.material as THREE.MeshStandardMaterial;
    if (talk) { const w = TALK[id]; let open = false; if (w) for (const [a, b] of w) { if (T >= a && T < b) { open = true; break; } if (a > T) break; }
      const want = open ? talk : A.ch[c.c]; if (mat.map !== want) { mat.map = want; mat.emissiveMap = want; } m.userData.talkV = THREE.MathUtils.lerp(m.userData.talkV ?? 0, open ? 1 : 0, 0.25); }
    animateRig(m, T, m.userData.talkV ?? 0);
    m.lookAt(cam.position.x, m.position.y, cam.position.z); if (c.bill) { const q0 = m.quaternion.clone(); m.lookAt(cam.position); m.quaternion.copy(q0.slerp(m.quaternion, 0.55)); }
    if (c.lamp && m.visible && mob < 3) { const L = S.mobile[mob++]; L.position.copy(m.position).add(new THREE.Vector3(0, c.h * 0.42, 0)); L.intensity = 6; }
  }
  // procession along the trail ring (angle a0 -> a1, spaced), lantern glows at the hand
  if (s.proc) { const P = s.proc, rr = P.r ?? R + 6, KS = P.r ? 1 : 54 / rr, TA = P.a1; const pr = P.stopAt !== undefined ? Math.min(u / P.stopAt, 1) : u; // ring angles were authored for R=48: the walk ends at a1, length and spacing kept in metres
    for (const { m, g, k } of prev.proc) { const a = TA + (P.a0 + (P.a1 - P.a0) * pr - k * (P.gap ?? 0.065) - TA) * KS; animateRig(m, T + k * 1.37, 0);
      const x = Math.cos(a) * rr, z = Math.sin(a) * rr; m.position.set(x, Math.abs(Math.sin(local / FPS * 2.4 + k)) * 0.05, z); m.lookAt(cam.position.x, m.position.y, cam.position.z); if (P.bill) { const q0 = m.quaternion.clone(); m.lookAt(cam.position); m.quaternion.copy(q0.slerp(m.quaternion, 0.55)); }
      const right = new THREE.Vector3().subVectors(cam.position, m.position).setY(0).normalize().cross(new THREE.Vector3(0, 1, 0));
      g.position.copy(m.position).addScaledVector(right, m.userData.w ?? 0.35).add(new THREE.Vector3(0, 0.45, 0));
      if (mob < 3 && k < 3) { const L = S.mobile[mob++]; L.position.copy(g.position); L.intensity = 5; } } }
  if (s.proc) { const P = s.proc, rr = P.r ?? R + 6, KS = P.r ? 1 : 54 / rr, TA = P.a1; const pr = P.stopAt !== undefined ? Math.min(u / P.stopAt, 1) : u; const moving = P.a0 !== P.a1 && !(P.stopAt !== undefined && u > P.stopAt);
    for (const { o, mixer, k } of prev.str) { const a = TA + (P.a0 + (P.a1 - P.a0) * pr - k * (P.gap ?? 0.065) - 0.02 - TA) * KS;
      o.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr); const dir = Math.sign(P.a1 - P.a0) || 1; o.rotation.y = Math.atan2(-Math.sin(a) * dir, Math.cos(a) * dir);
      mixer.setTime(moving ? local / FPS : 0.4); } }
  for (; mob < 3; mob++) S.mobile[mob].intensity = 0;
  for (const { o, p } of prev.props) if (p.p1) o.position.copy(p.p).lerp(p.p1, ease(u));
  // torch
  if (s.torch && u >= (s.torch.on ?? 0)) { S.torch.intensity = 60; S.torch.position.copy(s.torch.from); S.torch.target.position.copy(s.torch.to); S.torch.target.updateMatrixWorld(); } else S.torch.intensity = 0;
  // bus drive
  if (s.bus) { const b = s.bus; S.bus.visible = true; S.bus.position.copy(b.p0).lerp(b.p1, u); S.bus.rotation.y = b.ry ?? 0; } else S.bus.visible = false;
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { color: "#07090e", strength: 0.45, widthNear: 1.4, widthFar: 1.0, creaseScale: 0.4, concaveGain: 0.2, angleLo: 50, angleHi: 70 }),
    bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 1.1, luminanceThreshold: 0.82, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 7, radius: 0.75 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }), grade: new GradeEffect(GR.night, 1),
  }), [scene, camera]);
  fx.grade.set(GR[s.kind === "insert" ? "night" : s.tod ?? "night"]);
  return (<EffectComposer multisampling={(getInputProps() as { post?: { fast?: boolean } }).post?.fast ? 0 : 4}>
    {[...((getInputProps() as { post?: { noink?: boolean } }).post?.noink ? [] : [<primitive key="ink" object={fx.ink} dispose={null} />]), <primitive key="bloom" object={fx.bloom} dispose={null} />, <primitive key="tone" object={fx.tone} dispose={null} />, <primitive key="grade" object={fx.grade} dispose={null} />]}
  </EffectComposer>);
};

const dpr = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;
const Card: React.FC<{ s: Shot; u: number }> = ({ s, u }) => {
  if (!s.text) return null; const T = s.text; const a = Math.min(1, u * 6, (1 - u) * 6);
  if (T.kind === "title") return (<AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <div style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 210, letterSpacing: 38, color: "#e9e2d0", opacity: a, textShadow: "0 0 40px rgba(0,0,0,0.9), 0 0 2px #000", transform: `scale(${1 + u * 0.05})`, filter: `blur(${(1 - Math.min(1, u * 4)) * 6}px)` }}>{T.t}</div>
    <div style={{ position: "absolute", top: 640, width: 520, height: 3, background: "#8a1a12", opacity: a }} /></AbsoluteFill>);
  if (T.kind === "card") return (<AbsoluteFill style={{ alignItems: "flex-start", justifyContent: "flex-end", padding: 110 }}>
    <div style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 92, letterSpacing: 18, color: "#efe7d4", opacity: a, textShadow: "0 0 30px rgba(0,0,0,0.95)" }}>{T.t}</div>
    {T.sub ? <div style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 34, letterSpacing: 6, color: "#c9b48a", opacity: a, marginTop: 8 }}>{T.sub}</div> : null}</AbsoluteFill>);
  return (<AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: "#050507" }}>
    <div style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 70, color: "#efe7d4", textAlign: "center", opacity: a, lineHeight: 1.25 }}>{T.t}</div>
    {T.sub ? <div style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 40, color: "#c9372d", marginTop: 26, opacity: a }}>{T.sub}</div> : null}</AbsoluteFill>);
};
export const Tower13: React.FC = () => {
  const f0 = useCurrentFrame(); const fm = (getInputProps() as { fmap?: number[] }).fmap; const f = fm ? (fm[f0] ?? f0) : f0;
  const [ok, setOk] = useState(assetsReady && insReady);
  const [h] = useState(() => (assetsReady && insReady ? null : delayRender("t13 assets", { timeoutInMilliseconds: 900000 })));
  useEffect(() => { if (h === null) return; Promise.all([loadAll(), loadIns()]).then(() => { setOk(true); continueRender(h); }); }, [h]);
  const { s, u } = shotAt(f); void useVideoConfig;
  const black = s.kind === "black";
  return (<AbsoluteFill style={{ background: "#020203" }}>
    {fm ? null : <Audio src={staticFile("t13/master.m4a")} />}
    {!black ? <ThreeCanvas width={1920} height={1080} {...(dpr() ? { dpr: dpr() } : {})} shadows gl={{ antialias: false, stencil: false }} camera={{ fov: 40, near: 0.05, far: 900 }}>
      {ok ? <Scene f={f} /> : null}
    </ThreeCanvas> : null}
    {s.flash ? <AbsoluteFill style={{ background: "#fff8e8", opacity: Math.max(0, 1 - u * 3) }} /> : null}
    {s.staticAmt ? <AbsoluteFill style={{ backgroundImage: `url(${staticFile(`ek/grain${(f * 3) % 4}.png`)})`, backgroundSize: "270px 270px", opacity: s.staticAmt(u) * 0.7, mixBlendMode: "overlay" }} /> : null}
    <Card s={s} u={u} />
    {s.stamp ? <div style={{ position: "absolute", left: 70, top: 56, fontFamily: "IBM Plex Mono", fontWeight: 500, fontSize: 64, color: "#ff4a3a", textShadow: "0 0 18px rgba(0,0,0,0.9)" }}>{s.stamp}</div> : null}
    <AbsoluteFill style={{ backgroundImage: `url(${staticFile(`ek/grain${f % 4}.png`)})`, backgroundSize: "540px 540px", backgroundPosition: `${(f * 137) % 540}px ${(f * 251) % 540}px`, mixBlendMode: "overlay", opacity: 0.13 }} />
  </AbsoluteFill>);
};
export const T13_FRAMES = TOTAL;

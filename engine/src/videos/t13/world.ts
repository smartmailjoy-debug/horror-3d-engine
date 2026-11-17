// TOWER 13 — the whole Neelkanth Reserve as one deterministic world.
// Ring of 12 watchtowers (R = 88 m) around the rusted Tower 13 (centre clearing: forest skull, dead oak), a dirt trail
// outside the ring, the guard camp to the south, the fenced government gate beyond it, the river to the north (Tower 7)
// and the three 1998 jeeps between Tower 9 and 10. Far trees are impostor cards (instanced), near trees and the
// undergrowth around the current camera are real Poly Haven meshes (setNear). Lantern lights come from a fixed pool so the
// shader light count never changes between shots.
import * as THREE from "three";
import { A, dm, ph, addWind, ANIM } from "./assets";
import { NOINK } from "../bridge/ink";
import { rng, groundTex, dirtTex, woodTex, tinTex, plasterTex, boardTex, plateTex, glowTex, waterTex } from "./tex";

export const R = 88;
export const QUALITY = { trees: 26, under: 170, shadow: 2048 };
export const towerXZ = (i: number): [number, number] => {
  if (i === 13) return [0, 0];
  const a = Math.PI / 2 + (i - 1) * (Math.PI / 6); return [R * Math.cos(a), R * Math.sin(a)];
};
export const towerRotY = (i: number) => { if (i === 13) return 0; const [x, z] = towerXZ(i); return Math.atan2(x, z); }; // ladder (+z local) faces outward
export const PLATFORM_Y = 8.0;
export const HWZ = R + 84;
export const CAMP = new THREE.Vector3(0, 0, R + 34), GATE = new THREE.Vector3(0, 0, R + 62), JEEPS = new THREE.Vector3(53, 0, -16);
export const FENCE_R = R + 62;
export const MAST = new THREE.Vector3(22, 0, R + 30); // the whole reserve is fenced in a ring; the only way in is the gate
export const riverZ = (x: number) => -(R + 16) + Math.sin(x * 0.035) * 6 + Math.sin(x * 0.011 + 1) * 5;
/** world position of a point on tower i's platform, local (lx, lz) in tower space (ladder side = +z) */
export const onTower = (i: number, lx = 0, lz = 0, ly = PLATFORM_Y) => {
  const [x, z] = towerXZ(i), r = towerRotY(i), c = Math.cos(r), s = Math.sin(r);
  return new THREE.Vector3(x + lx * c + lz * s, ly, z - lx * s + lz * c);
};
export const nearTower = (i: number, out: number, side = 0) => { // ground point out metres outward from tower i, side metres sideways
  const [x, z] = towerXZ(i); if (i === 13) return new THREE.Vector3(side, 0, out);
  const d = new THREE.Vector2(x, z).normalize(); return new THREE.Vector3(x + d.x * out - d.y * side, 0, z + d.y * out + d.x * side);
};

type Mat = THREE.Material;
const box = (g: THREE.Group, w: number, h: number, d: number, x: number, y: number, z: number, m: Mat, rx = 0, ry = 0, rz = 0) => {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.rotation.set(rx, ry, rz); b.castShadow = b.receiveShadow = true; g.add(b); return b;
};
const cyl = (g: THREE.Group, r1: number, r2: number, h: number, x: number, y: number, z: number, m: Mat, seg = 10) => {
  const b = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; g.add(b); return b;
};
const std = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, ...o });
const sprite = (t: THREE.Texture, size: number, op: number) => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, opacity: op, fog: false, depthWrite: false, blending: THREE.AdditiveBlending }));
  sp.scale.set(size, size, 1); sp.layers.set(NOINK); return sp;
};

// ---------------------------------------------------------------- hurricane lantern
export function lanternMesh(): THREE.Group {
  const g = new THREE.Group();
  const metal = std({ color: "#3d3a33", roughness: 0.55, metalness: 0.7 }), red = std({ color: "#6b2318", roughness: 0.6, metalness: 0.4 });
  const glass = new THREE.MeshStandardMaterial({ color: "#ffd9a0", emissive: "#ffb35c", emissiveIntensity: 2.2, roughness: 0.2, transparent: true, opacity: 0.85 });
  cyl(g, 0.085, 0.095, 0.07, 0, 0.035, 0, red, 16);          // fuel tank
  cyl(g, 0.055, 0.07, 0.15, 0, 0.145, 0, glass, 16).name = "glass";
  cyl(g, 0.06, 0.085, 0.03, 0, 0.235, 0, red, 16);           // top cap
  cyl(g, 0.02, 0.03, 0.04, 0, 0.27, 0, metal, 8);
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; box(g, 0.008, 0.2, 0.008, Math.cos(a) * 0.08, 0.15, Math.sin(a) * 0.08, metal); } // guard wires
  const hd = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.006, 6, 20, Math.PI), metal); hd.position.y = 0.27; g.add(hd); // handle
  return g;
}

// ---------------------------------------------------------------- watchtower
export function buildTower(n: number, old: boolean): THREE.Group {
  const g = new THREE.Group(); g.name = "tower" + n;
  const wt = woodTex(old); const wood = std({ map: wt, color: old ? "#9a8a78" : "#ffffff" }), wood2 = std({ map: wt, color: old ? "#7a6c5c" : "#d8cdbd" });
  const tin = std({ map: tinTex(old ? 1.2 : 0.45), roughness: 0.6, metalness: 0.45, side: THREE.DoubleSide });
  const P = 1.7, H = PLATFORM_Y;
  const lean = 0.05;  // posts lean inward (tapered tower)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const p = box(g, 0.24, H + 0.2, 0.24, sx * (P + 0.2), (H + 0.2) / 2, sz * (P + 0.2), wood); p.rotation.set(-sz * lean, 0, sx * lean); }
  for (const y of [2.6, 5.3]) { const s = P + 0.2 - (H - y) * lean * -0 ; for (const sz of [-1, 1]) box(g, s * 2 + 0.3, 0.14, 0.12, 0, y, sz * (P + 0.2 + (H / 2 - y) * lean * 0.9), wood2); for (const sx of [-1, 1]) box(g, 0.12, 0.14, s * 2 + 0.3, sx * (P + 0.2 + (H / 2 - y) * lean * 0.9), y, 0, wood2); }
  for (const [y0, y1] of [[0.3, 2.6], [2.6, 5.3], [5.3, 7.9]]) { // X braces on all four sides
    const h = y1 - y0, L = Math.hypot(h, (P + 0.2) * 2), a = Math.atan2(h, (P + 0.2) * 2), yc = (y0 + y1) / 2;
    for (const sz of [-1, 1]) { if (old && sz === 1 && y0 > 2) continue; box(g, L, 0.1, 0.08, 0, yc, sz * (P + 0.3), wood2, 0, 0, a); box(g, L, 0.1, 0.08, 0, yc, sz * (P + 0.3), wood2, 0, 0, -a); }
    for (const sx of [-1, 1]) { box(g, 0.08, 0.1, L, sx * (P + 0.3), yc, 0, wood2, a, 0, 0); box(g, 0.08, 0.1, L, sx * (P + 0.3), yc, 0, wood2, -a, 0, 0); }
  }
  // platform: joists + individual planks with gaps
  for (const sx of [-1, 0, 1]) box(g, 0.14, 0.16, P * 2 + 0.9, sx * P, H - 0.1, 0, wood2);
  const pr = rng(n * 31 + 7);
  for (let k = 0; k < 18; k++) { const z = -P - 0.4 + k * 0.215; if (old && (k === 5 || k === 12)) continue; const pl = box(g, P * 2 + 0.9 - pr() * 0.12, 0.05, 0.19, (pr() - 0.5) * 0.06, H + 0.01, z, wood); pl.rotation.y = (pr() - 0.5) * 0.02; }
  // railing: posts, two rails, lower plank skirt (open gap at the ladder)
  const E = P + 0.42;
  for (const [x, z] of [[-E, -E], [E, -E], [-E, E], [E, E], [0, -E], [-E, 0], [E, 0]]) box(g, 0.1, 1.15, 0.1, x, H + 0.58, z, wood2);
  for (const y of [H + 1.08, H + 0.62]) { box(g, E * 2, 0.08, 0.07, 0, y, -E, wood); box(g, 0.07, 0.08, E * 2, -E, y, 0, wood); box(g, 0.07, 0.08, E * 2, E, y, 0, wood);
    box(g, E - 0.45, 0.08, 0.07, -E / 2 - 0.22, y, E, wood); box(g, E - 0.45, 0.08, 0.07, E / 2 + 0.22, y, E, wood); }
  for (const [w, x, z, ry] of [[E * 2, 0, -E, 0], [E * 2, -E, 0, Math.PI / 2], [E * 2, E, 0, Math.PI / 2]] as const) { const sk = box(g, w, 0.42, 0.035, x, H + 0.27, z, wood2); sk.rotation.y = ry; }
  if (old) { const br = g.children[g.children.length - 2] as THREE.Mesh; br.rotation.z = 0.5; br.position.y -= 0.25; } // a broken skirt plank
  // roof: corner poles + hipped corrugated tin with an overhang
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.1, 2.25, 0.1, sx * E, H + 1.12, sz * E, wood2);
  for (const sz of [-1, 1]) box(g, E * 2 + 0.2, 0.1, 0.1, 0, H + 2.25, sz * E, wood2);
  for (const sx of [-1, 1]) box(g, 0.1, 0.1, E * 2 + 0.2, sx * E, H + 2.25, 0, wood2);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(E * 1.75, 1.25, 4, 1, true), tin); roof.position.set(0, H + 2.9, 0); roof.rotation.y = Math.PI / 4; roof.castShadow = true; roof.receiveShadow = true; g.add(roof);
  if (old) { roof.rotation.z = 0.06; roof.position.x = 0.15; }
  cyl(g, 0.05, 0.05, 0.25, 0, H + 3.6, 0, std({ color: "#3a3530", metalness: 0.6, roughness: 0.5 }), 6);
  // ladder at the front (+z), leaning, with a landing gap in the railing
  const lz0 = E + 1.35, lz1 = E + 0.08;
  for (const sx of [-0.3, 0.3]) { const L = Math.hypot(H + 0.9, lz0 - lz1), a = Math.atan2(lz0 - lz1, H + 0.9); box(g, 0.08, L, 0.08, sx, (H + 0.9) / 2, (lz0 + lz1) / 2, wood, a); }
  for (let y = 0.35; y < H + 0.6; y += 0.38) { const z = lz0 - (lz0 - lz1) * (y / (H + 0.9)); if (old && Math.abs(y - 4.15) < 0.2) continue; box(g, 0.68, 0.05, 0.07, 0, y, z, wood2); }
  // tower number plate nailed at the top of the ladder
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.32), std({ map: plateTex(n, old), roughness: 0.5, metalness: 0.2, emissive: "#ffffff", emissiveMap: plateTex(n, old), emissiveIntensity: 0.18 })); plate.position.set(0, H + 0.82, E + 0.045); plate.rotation.z = old ? 0.07 : -0.02; g.add(plate); plate.name = "plate";
  // platform furniture (Joy's models): army cot along the left wall, table at the back with the base radio set, walkie, register,
  // a stool, an earthen water pot (matka) and an antenna on the roof
  const bed = dm("bed"); bed.position.set(-P + 0.42, H + 0.01, -0.3); bed.name = "bed"; if (old) { bed.rotation.set(0.03, 0.12, -0.05); } g.add(bed);
  const tb = dm("table"); tb.rotation.y = Math.PI / 2; tb.position.set(0.7, H + 0.01, -P + 0.45); g.add(tb);
  const rad = dm("baseradio"); rad.position.set(0.95, H + 0.79, -P + 0.4); rad.rotation.y = old ? 0.4 : 0.08; rad.name = "radio"; g.add(rad);
  const wk = dm("walkie"); wk.position.set(0.25, H + 0.8, -P + 0.55); wk.rotation.set(0, 0.6, 0); wk.name = "walkie"; g.add(wk);
  box(g, 0.3, 0.035, 0.22, 1.35, H + 0.8, -P + 0.62, std({ color: old ? "#3e2a20" : "#5b2a1e" }), 0, -0.2);
  cyl(g, 0.17, 0.17, 0.45, 0.55, H + 0.24, -P + 1.3, wood2, 8);
  { const pts: THREE.Vector2[] = []; for (let k = 0; k <= 12; k++) { const t = k / 12; pts.push(new THREE.Vector2(0.06 + Math.sin(Math.min(1, t * 1.15) * Math.PI) * 0.17 + (t > 0.85 ? (t - 0.85) * 0.5 : 0), t * 0.42)); }
    const pot = new THREE.Mesh(new THREE.LatheGeometry(pts, 16), std({ color: old ? "#5a4034" : "#9a5a3a", roughness: 0.95 })); pot.position.set(P - 0.25, H + 0.02, P - 0.15); pot.castShadow = true; g.add(pot); }
  cyl(g, 0.015, 0.015, 1.6, 0.4, H + 4.0, -0.4, std({ color: "#2a2a2a", metalness: 0.6, roughness: 0.4 }), 6);
  // lantern hung from the roof beam on the inner corner
  const lan = lanternMesh(); lan.position.set(-E + 0.25, H + 1.72, -E + 0.25); g.add(lan); lan.name = "lantern";
  const wire = box(g, 0.006, 0.42, 0.006, -E + 0.25, H + 2.05, -E + 0.25, std({ color: "#222" }));
  wire.castShadow = false;
  g.userData = { lantern: lan, n, old };
  return g;
}

// ---------------------------------------------------------------- the world
export type World = {
  root: THREE.Group; towers: THREE.Group[]; lamps: { pos: THREE.Vector3; glow: THREE.Sprite; far: THREE.Sprite; bulb: THREE.Mesh; on: boolean }[];
  setNear: (cam: THREE.Vector3, focus: THREE.Vector3) => void; setTime: (t: TimeOfDay, scene: THREE.Scene) => void;
  setLamps: (on: (i: number) => boolean) => void; moon: THREE.DirectionalLight; hemi: THREE.HemisphereLight; extra: THREE.Group; sky: THREE.Mesh;
  tick: (t: number, cam: THREE.Vector3, focus: THREE.Vector3) => void; boom: THREE.Object3D; setGate: (open: number) => void; setFx: (f: Record<string, unknown>) => void;
};
export type TimeOfDay = "night" | "dawn" | "day" | "dusk";

type TreeRec = { x: number; z: number; t: number; s: number; ry: number; real?: THREE.Object3D };
export function buildWorld(): World {
  const root = new THREE.Group(), extra = new THREE.Group(); root.add(extra);
  const r = rng(20251116);
  // ground + road + trail ribbons
  const gTex = groundTex();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400, 1, 1), std({ map: gTex, color: "#ffffff" })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; root.add(ground);
  const dirt = std({ map: dirtTex(), polygonOffset: true, polygonOffsetFactor: -2 });
  const ribbon = (pts: THREE.Vector3[], w: number, m: Mat) => {
    const curve = new THREE.CatmullRomCurve3(pts), N = Math.max(8, Math.floor(curve.getLength() / 1.5)), pos: number[] = [], uv: number[] = [], idx: number[] = [];
    let acc = 0; let prev = curve.getPoint(0);
    for (let i = 0; i <= N; i++) { const p = curve.getPoint(i / N), t = curve.getTangent(i / N), nx = -t.z, nz = t.x; acc += p.distanceTo(prev); prev = p;
      pos.push(p.x + nx * w / 2, 0.02, p.z + nz * w / 2, p.x - nx * w / 2, 0.02, p.z - nz * w / 2); uv.push(0, acc / w / 2, 1, acc / w / 2);
      if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const tx = (m as THREE.MeshStandardMaterial).map; if (tx) { tx.repeat.set(1, 1); }
    const mesh = new THREE.Mesh(geo, m); mesh.receiveShadow = true; root.add(mesh); return mesh;
  };
  ribbon([new THREE.Vector3(0, 0, HWZ - 4), new THREE.Vector3(-1, 0, GATE.z + 2), new THREE.Vector3(0, 0, CAMP.z + 10), new THREE.Vector3(3, 0, CAMP.z)], 6, dirt); // gate road
  { const asph = std({ map: dirtTex(), color: "#55524c", polygonOffset: true, polygonOffsetFactor: -3 }); const hw: THREE.Vector3[] = []; for (let x = -480; x <= 480; x += 20) hw.push(new THREE.Vector3(x, 0, HWZ + Math.sin(x * 0.01) * 2)); ribbon(hw, 8, asph); } // highway
  const trailM = std({ map: dirtTex(), color: "#bfb6a6", polygonOffset: true, polygonOffsetFactor: -2 });
  const ring: THREE.Vector3[] = []; for (let k = 0; k < 96; k++) { const a = k / 96 * Math.PI * 2; const rr = R + 6 + Math.sin(a * 5) * 0.8; ring.push(new THREE.Vector3(Math.cos(a) * rr, 0, Math.sin(a) * rr)); }
  { const c = new THREE.CatmullRomCurve3(ring, true); const pts = c.getPoints(300); ribbon(pts, 2.2, trailM); }
  ribbon([new THREE.Vector3(2, 0, CAMP.z - 2), new THREE.Vector3(0, 0, R + 18), new THREE.Vector3(0.5, 0, R + 7)], 2.4, trailM); // camp -> Tower 1

  // river (north) with dark water, banks of rocks + reeds
  const rv: THREE.Vector3[] = []; for (let x = -300; x <= 300; x += 10) rv.push(new THREE.Vector3(x, 0, riverZ(x)));
  const envs: Partial<Record<TimeOfDay, THREE.Texture>> = {};
  const envFor = (t: TimeOfDay) => envs[t] ?? (envs[t] = (() => { const c = document.createElement("canvas"); c.width = 1024; c.height = 512; const g = c.getContext("2d")!;
    const col = { night: ["#0a1322", "#24395a", "#0a0c10"], dawn: ["#6a7a90", "#a4adb8", "#3a3a36"], day: ["#8ea6ba", "#c4ccce", "#4a4636"], dusk: ["#2e2a48", "#d08a60", "#2a2018"] }[t];
    const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, col[0]); gr.addColorStop(0.5, col[1]); gr.addColorStop(0.52, col[2]); gr.addColorStop(1, col[2]); g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
    if (t === "night") { const d = new THREE.Vector3(-0.35, 0.32, -1).normalize(); const u = (Math.atan2(d.z, d.x) / (2 * Math.PI) + 0.5) * 1024, vv = (0.5 - Math.asin(d.y) / Math.PI) * 512;
      const m = g.createRadialGradient(u, vv, 2, u, vv, 60); m.addColorStop(0, "rgba(255,255,245,1)"); m.addColorStop(0.15, "rgba(220,230,245,0.9)"); m.addColorStop(1, "rgba(120,150,200,0)"); g.fillStyle = m; g.fillRect(u - 60, vv - 60, 120, 120); }
    for (let k = 0; k < 40; k++) { g.fillStyle = "rgba(10,12,10,0.9)"; const x = k * 26 + Math.sin(k) * 8, h = 40 + Math.abs(Math.sin(k * 1.7)) * 70; g.fillRect(x, 256 - h, 24, h); } // tree line silhouette
    const tx = new THREE.CanvasTexture(c); tx.mapping = THREE.EquirectangularReflectionMapping; tx.colorSpace = THREE.SRGBColorSpace; return tx; })());
  let waterMat: THREE.MeshStandardMaterial | null = null;
  { const wm = new THREE.MeshStandardMaterial({ color: "#7d8c90", roughness: 0.04, metalness: 1, normalMap: waterTex(), normalScale: new THREE.Vector2(0.18, 0.18), envMap: envFor("night"), envMapIntensity: 1 }); waterMat = wm;
    const wmesh = ribbon(rv, 9, wm); wmesh.position.y = 0.03; wmesh.name = "water"; wmesh.receiveShadow = false;
    const bank = std({ map: dirtTex(), color: "#6a6250" }); const b2 = ribbon(rv, 13, bank); b2.position.y = 0.01;
    for (let x = -150; x <= 150; x += 3.5) for (const sd of [-1, 1]) { if (x > -6 && x < 12) continue; const z = riverZ(x) + sd * (5 + Math.sin(x * 1.7) * 0.8); const o = ph(Math.sin(x * 3.1) > 0.3 ? "rock_moss_set_01" : "grass_medium_01"); o.position.set(x, 0, z); o.rotation.y = x; o.scale.multiplyScalar(0.8 + Math.abs(Math.sin(x * 0.7)) * 0.6); root.add(o); } }

  // ---- towers
  const towers: THREE.Group[] = [];
  for (let i = 1; i <= 13; i++) { const t = buildTower(i, i === 13); const [x, z] = towerXZ(i); t.position.set(x, 0, z); t.rotation.y = towerRotY(i); root.add(t); towers.push(t); }
  // Tower 13: vines, moss, rust; skull + dead oak in the clearing
  { const t13 = towers[12];
    for (const [x, y, z, s] of [[-2.1, 7.6, 2.1, 1.3], [2.0, 7.5, -2.1, 1.0], [-2.1, 10.1, -2.1, 1.4], [2.0, 10.1, 2.1, 0.9], [0, 7.7, 2.15, 0.8]]) { const v = dm("vine2"); v.position.set(x, y - 2.4 * s, z); v.scale.setScalar(s); t13.add(v); }
    const sk = dm("skull"); sk.position.set(-5.2, -0.15, 7.5); sk.rotation.y = 0.55; root.add(sk); sk.name = "skull";
    const skl = new THREE.SpotLight("#9fb8e8", 40, 30, 0.42, 0.8, 1.2); skl.position.set(-1, 11, 14); skl.target.position.set(-5.2, 1.4, 7.5); root.add(skl, skl.target); skl.name = "skullLight";
    const skw = new THREE.PointLight("#5a8a6a", 3, 6, 1.5); skw.position.set(-4.2, 0.6, 10.2); root.add(skw); // faint swamp-green under-glow in the eye sockets
    const oak = dm("deadoak"); oak.position.set(7.0, 0, -5.5); oak.rotation.y = 2.2; root.add(oak);
    for (const [n, x, z, s, ry] of [["root_cluster_01", -3, 10, 1.2, 0.4], ["rock_moss_set_02", 5.5, 6, 1, 2], ["tree_stump_01", -8, -4, 1.2, 0.3], ["dry_branches_medium_01", 3, 9, 1.2, 1.5]] as const) {
      const o = ph(n); o.position.set(x, 0, z); o.scale.multiplyScalar(s); o.rotation.y = ry; root.add(o); } }

  // ---- camp (south): barrack, tin mess-shed with the register table, water tank, generator, well, fire pit, rules tree, vehicle
  { const cz = CAMP.z;
    const bar = dm("barrack"); bar.position.set(-13, 0, cz + 2); bar.rotation.y = Math.PI / 2; root.add(bar);
    const tank = dm("tank"); tank.position.set(13, 0, cz + 9); root.add(tank);
    const gen = dm("generator"); gen.position.set(-6, 0, cz + 9); gen.rotation.y = 0.4; root.add(gen);
    const well = dm("well"); well.position.set(10, 0, cz - 4); root.add(well);
    const fp = ph("stone_fire_pit"); fp.position.set(1, 0, cz - 2); root.add(fp);
    const car = dm("cherokee"); car.position.set(7, 0, cz + 13); car.rotation.y = -0.3; root.add(car);
    car.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { const mt = (m.material as THREE.MeshStandardMaterial).clone(); mt.color = new THREE.Color("#5d6b4a"); m.material = mt; } }); // forest-department olive
    // mess shed: 4 posts + tin roof, table with the register, bench
    const shed = new THREE.Group(); shed.position.set(5, 0, cz + 1); shed.rotation.y = -0.15; root.add(shed);
    const sw = std({ map: woodTex(false) }), st = std({ map: tinTex(0.6), roughness: 0.6, metalness: 0.4, side: THREE.DoubleSide });
    for (const [x, z] of [[-2.6, -1.8], [2.6, -1.8], [-2.6, 1.8], [2.6, 1.8]]) box(shed, 0.16, 2.7, 0.16, x, 1.35, z, sw);
    box(shed, 6, 0.05, 4.4, 0, 2.75, 0, st, 0.08);
    const tb = dm("table"); tb.position.set(0, 0, -0.4); shed.add(tb);
    box(shed, 2.2, 0.06, 0.32, 0, 0.45, 0.6, sw); box(shed, 0.08, 0.45, 0.3, -1, 0.22, 0.6, sw); box(shed, 0.08, 0.45, 0.3, 1, 0.22, 0.6, sw);
    const lan = lanternMesh(); lan.position.set(0.6, 0.8, -0.5); shed.add(lan);
    // rules tree with a nailed board (text drawn in inserts; here a plain weathered board)
    const tree = ph("island_tree_01"); tree.position.set(-3, 0, cz - 9); tree.scale.multiplyScalar(3.2); root.add(tree);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.8), std({ map: boardTex("rules", 512, 384, "#d8ceb4", [["RULES · নিয়ম", 60, "#2a1a10", 800], ["1. Only watch · কেৱল চাব", 38, "#2a1a10", 700], ["2. Do not interfere · মাজত নোসোমাব", 34, "#2a1a10", 700], ["3. Tell no one · কাকো একো নক'ব", 36, "#2a1a10", 700]], 0.5) }));
    board.position.set(-3 + 0.05, 1.7, cz - 9 + 0.75); board.rotation.y = 0.1; root.add(board); board.name = "rulesBoard";
    // wire fence around the camp + bamboo poles, clothes line
    for (let k = 0; k < 9; k++) { const f = dm("wirefence"); f.position.set(-22 + k * 4.4, 0, cz + 16); f.rotation.y = Math.PI / 2; root.add(f); }
    const pr = rng(9);
    for (let k = 0; k < 4; k++) { const b = dm("bambooset"); b.position.set(-24 + pr() * 6, 0, cz - 10 + k * 7); b.rotation.y = pr() * 6; b.scale.multiplyScalar(0.7 + pr() * 0.3); root.add(b); }
    for (const x of [-8, -2]) box(root as unknown as THREE.Group, 0.06, 2.1, 0.06, x, 1.05, cz + 7, sw);
    const line = box(root as unknown as THREE.Group, 6, 0.01, 0.01, -5, 1.95, cz + 7, std({ color: "#222" }));
    for (let k = 0; k < 4; k++) { const cl = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.7).translate(0, -0.35, 0), std({ color: ["#6f6a4a", "#7a7458", "#3d4a3a", "#6b5e48"][k], side: THREE.DoubleSide })); cl.position.set(-7.4 + k * 1.3, 1.95, cz + 7); cl.castShadow = true; cl.name = "cloth" + k; root.add(cl); }
    void line;
    const mast = dm("mast"); mast.position.copy(MAST); mast.rotation.y = 0.3; root.add(mast);
    const av = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshBasicMaterial({ color: "#ff2a1a" })); av.position.set(MAST.x, 26.3, MAST.z); av.name = "aviation"; av.layers.set(NOINK); root.add(av);
    const avg = sprite(glowTex("avg", "rgba(255,60,40,1)", "rgba(255,40,30,0)", 0.04), 5, 0.9); avg.position.copy(av.position); avg.name = "aviationGlow"; root.add(avg);
    const rb = dm("baseradio"); rb.position.set(0.5, 0.79, -0.55); rb.rotation.y = -0.3; shed.add(rb); }

  // ---- gate (fence line z = 110): barbed fence, boom barrier, check-post booth, sign boards, office, sodium lamp
  { const gz = GATE.z;
    // perimeter: the whole reserve is fenced. Near the gate the real barbed-wire fence model, everywhere else an instanced
    // concrete-post + chain-link + barbed-wire fence on the FENCE_R ring (Y-arms with three strands on top)
    const fs = A.dm.barbfence.userData.size as THREE.Vector3, seg = fs.x * 0.98;
    for (let x = 4.6; x < 46; x += seg) for (const sgn of [1, -1]) { const f = dm("barbfence"); const xm = sgn * (x + seg / 2), zc = Math.sqrt(FENCE_R * FENCE_R - xm * xm);
      f.position.set(xm, 0, zc); f.rotation.y = Math.atan2(xm, zc); root.add(f); }
    { const a0 = Math.asin(46 / FENCE_R), span = 3.2, N = Math.floor((Math.PI * 2 - a0 * 2) * FENCE_R / span), da = (Math.PI * 2 - a0 * 2) / N;
      const conc = std({ color: "#8d8a82", roughness: 0.95 }), steel = std({ color: "#4a4844", metalness: 0.6, roughness: 0.55 });
      const linkT = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const g2 = c.getContext("2d")!; g2.strokeStyle = "rgba(150,150,145,1)"; g2.lineWidth = 3;
        for (let k = -128; k < 256; k += 16) { g2.beginPath(); g2.moveTo(k, 0); g2.lineTo(k + 128, 128); g2.stroke(); g2.beginPath(); g2.moveTo(k + 128, 0); g2.lineTo(k, 128); g2.stroke(); }
        const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(span / 0.9, 2.4 / 0.9); return t; })();
      const linkM = new THREE.MeshStandardMaterial({ map: linkT, alphaMap: linkT, alphaTest: 0.35, side: THREE.DoubleSide, color: "#9a9890", metalness: 0.5, roughness: 0.6 });
      const post = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 3.0, 0.16).translate(0, 1.5, 0), conc, N + 1);
      const arm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.7, 0.06).translate(0, 0.35, 0), steel, N + 1);
      const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(span, 2.4).translate(0, 1.25, 0), linkM, N);
      const wire = new THREE.InstancedMesh(new THREE.BoxGeometry(span, 0.012, 0.012), steel, N * 4);
      const M = new THREE.Matrix4(), Qa = new THREE.Quaternion(), Vp = new THREE.Vector3(), One = new THREE.Vector3(1, 1, 1), Yv = new THREE.Vector3(0, 1, 0), Xv = new THREE.Vector3(1, 0, 0);
      for (let k = 0; k <= N; k++) { const a = Math.PI / 2 + a0 + k * da, x = Math.cos(a) * FENCE_R, z = Math.sin(a) * FENCE_R, ry = Math.atan2(x, z);
        Qa.setFromAxisAngle(Yv, ry); Vp.set(x, 0, z); M.compose(Vp, Qa, One); post.setMatrixAt(k, M);
        const q2 = Qa.clone().multiply(new THREE.Quaternion().setFromAxisAngle(Xv, 0.7)); Vp.set(x, 2.95, z); M.compose(Vp, q2, One); arm.setMatrixAt(k, M);
        if (k < N) { const am = a + da / 2, xm = Math.cos(am) * FENCE_R, zm = Math.sin(am) * FENCE_R; const qm = new THREE.Quaternion().setFromAxisAngle(Yv, Math.atan2(xm, zm) + Math.PI / 2);
          Vp.set(xm, 0, zm); M.compose(Vp, qm, One); mesh.setMatrixAt(k, M);
          const out = new THREE.Vector3(xm, 0, zm).normalize();
          [[0, 2.85], [0.18, 3.1], [0.33, 3.3], [0.47, 3.5]].forEach(([o, y], w) => { Vp.set(xm + out.x * o, y, zm + out.z * o); M.compose(Vp, qm, One); wire.setMatrixAt(k * 4 + w, M); }); } }
      [post, arm, mesh, wire].forEach((im) => { im.castShadow = im !== wire; im.receiveShadow = true; im.frustumCulled = false; root.add(im); }); }
    // the gate: two concrete pillars with floodlights, heavy double iron gate (closed, chained, padlocked), NO ENTRY plate
    { const gg = new THREE.Group(); gg.position.set(0, 0, gz); root.add(gg); gg.name = "gate";
      const cm = std({ map: plasterTex(), color: "#b8b2a6" }), iron = std({ color: "#3a3430", metalness: 0.75, roughness: 0.55 }), rust = std({ map: tinTex(1.4), color: "#8a6a58", metalness: 0.5, roughness: 0.7 });
      for (const sx of [-1, 1]) { box(gg, 1.0, 4.4, 1.0, sx * 4.0, 2.2, 0, cm); box(gg, 1.2, 0.22, 1.2, sx * 4.0, 4.5, 0, cm);
        const fl = new THREE.Group(); fl.position.set(sx * 4.0, 4.75, 0.3); gg.add(fl); box(fl, 0.5, 0.32, 0.28, 0, 0, 0, iron, -0.5);
        const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.24), new THREE.MeshBasicMaterial({ color: "#fff4dc" })); lens.position.set(0, -0.05, 0.15); lens.rotation.x = -0.5 - Math.PI * 0; fl.add(lens);
        const sp = new THREE.SpotLight("#ffe9c4", 60, 34, 0.6, 0.55, 1.3); sp.position.set(sx * 4.0, 4.7, 0.4); sp.target.position.set(sx * 1.5, 0, 10); gg.add(sp, sp.target); sp.userData.flood = true; }
      for (const sx of [-1, 1]) { const leaf = new THREE.Group(); leaf.position.set(sx * 3.5, 0, 0); leaf.name = sx < 0 ? "gateL" : "gateR"; gg.add(leaf);
        const W = 3.5, d = -sx; // leaf extends from the pillar towards the centre
        box(leaf, W, 0.14, 0.12, d * W / 2, 0.25, 0, iron); box(leaf, W, 0.14, 0.12, d * W / 2, 3.55, 0, iron); box(leaf, W, 0.1, 0.1, d * W / 2, 1.7, 0, iron);
        box(leaf, 0.14, 3.45, 0.12, d * 0.07, 1.9, 0, iron); box(leaf, 0.14, 3.45, 0.12, d * (W - 0.07), 1.9, 0, iron);
        for (let k = 1; k < 19; k++) { const x = d * k * W / 19; box(leaf, 0.045, 3.3, 0.045, x, 1.9, 0, iron); const sp = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.28, 6), iron); sp.position.set(x, 3.75, 0); leaf.add(sp); }
        box(leaf, W - 0.2, 1.25, 0.03, d * W / 2, 0.95, 0.03, rust);
        const L = Math.hypot(W - 0.2, 1.3), a = Math.atan2(1.3, W - 0.2); box(leaf, L, 0.09, 0.09, d * W / 2, 2.4, 0.05, iron, 0, 0, d * a); }
      // chain + padlock across the meeting stiles
      const LL = gg.getObjectByName("gateL") as THREE.Group; // chain, padlock and plate hang on the left leaf (they swing open with it)
      for (let k = 0; k < 9; k++) { const l = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.013, 6, 12), iron); const t = k / 8; l.position.set(3.25 + t * 0.5, 1.85 - Math.sin(t * Math.PI) * 0.16, 0.12); l.rotation.y = k % 2 ? Math.PI / 2 : 0; LL.add(l); }
      box(LL, 0.14, 0.17, 0.06, 3.5, 1.6, 0.14, std({ color: "#7a6a40", metalness: 0.8, roughness: 0.4 }));
      const ne = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.6), std({ map: boardTex("noentry", 600, 240, "#a3170f", [["NO ENTRY", 96, "#ffffff", 800], ["প্ৰৱেশ নিষেধ", 70, "#ffffff", 800]], 0.4), roughness: 0.5, metalness: 0.3 }));
      ne.position.set(2.55, 2.75, 0.1); LL.add(ne); }
    const boom = dm("boom"); boom.position.set(-3.2, 0, gz + 7); boom.rotation.y = Math.PI / 2; root.add(boom); boom.name = "boom";
    const strp = dm("striped"); strp.position.set(-1, 0, gz + 11); root.add(strp);
    // booth
    const bo = new THREE.Group(); bo.position.set(6.5, 0, gz - 1.5); root.add(bo);
    const pl = std({ map: plasterTex() }), tn = std({ map: tinTex(0.8), roughness: 0.6, metalness: 0.4, side: THREE.DoubleSide }), wd = std({ map: woodTex(true) });
    box(bo, 2.6, 2.6, 0.18, 0, 1.3, -1.2, pl); box(bo, 0.18, 2.6, 2.6, -1.2, 1.3, 0, pl); box(bo, 0.18, 2.6, 2.6, 1.2, 1.3, 0, pl);
    box(bo, 0.9, 1.5, 0.18, -0.7, 1.85, 1.2, pl); box(bo, 0.9, 1.5, 0.18, 0.7, 1.85, 1.2, pl); box(bo, 2.6, 0.75, 0.18, 0, 0.38, 1.2, pl); box(bo, 2.6, 0.35, 0.18, 0, 2.45, 1.2, pl); // front with a window
    box(bo, 0.5, 0.06, 0.18, 0, 0.78, 1.25, wd); // window sill / counter
    box(bo, 3.4, 0.06, 3.4, 0, 2.75, 0.2, tn, 0.1);
    const reg = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.26), std({ color: "#5b2a1e" })); reg.position.set(0, 0.83, 1.28); bo.add(reg); reg.name = "register";
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: "#ffe2b0" })); bulb.position.set(0, 2.55, 1.45); bo.add(bulb);
    const sig = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), std({ map: boardTex("chk", 512, 128, "#f0e8d0", [["CHECK POST · চেক পোষ্ট", 46, "#7a1a12", 800]], 0.6) })); sig.position.set(0, 2.5, 1.3); bo.add(sig);
    // sign boards facing outward (+z)
    const brd = (k: string, w: number, h: number, x: number, y: number, z: number, bg: string, lines: [string, number, string, number?][], ry = 0) => {
      const g2 = new THREE.Group(); g2.position.set(x, 0, z); g2.rotation.y = ry; root.add(g2);
      const mb = new THREE.Mesh(new THREE.PlaneGeometry(w, h), std({ map: boardTex(k, Math.round(w * 400), Math.round(h * 400), bg, lines, 0.8), roughness: 0.6, metalness: 0.2 })); mb.position.y = y; g2.add(mb);
      const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), std({ color: "#5a4a3a" })); back.rotation.y = Math.PI; back.position.set(0, y, -0.02); g2.add(back);
      for (const sx of [-1, 1]) { const p = box(g2, 0.08, y + h / 2, 0.08, sx * (w / 2 - 0.15), (y + h / 2) / 2, -0.06, std({ color: "#4a4a48", metalness: 0.5, roughness: 0.6 })); void p; } return g2; };
    brd("pk", 2.6, 1.5, -8.5, 2.2, gz + 3, "#7a1d14", [["নিষিদ্ধ এলেকা", 120, "#f5ecd8", 800], ["PROHIBITED AREA", 92, "#f5ecd8", 800], ["ৰাইজৰ প্ৰৱেশ নিষেধ · No public entry", 50, "#f5ecd8", 700]], -0.15);
    brd("nf", 1.6, 1.1, 12, 1.9, gz + 3, "#f1ead6", [["NO-FLY ZONE", 120, "#8a1a12", 800], ["ড্ৰোন উৰুওৱা নিষেধ", 76, "#2a2018", 800], ["Drones strictly prohibited", 50, "#2a2018", 700]], 0.1);
    brd("ord", 1.5, 0.75, -14, 1.5, gz + 2.6, "#1f3a2a", [["নীলকণ্ঠ সংৰক্ষিত বনাঞ্চল", 54, "#efe7d0", 800], ["NEELKANTH RESERVE FOREST", 50, "#efe7d0", 800], ["Order No. NRF/98/13", 54, "#efe7d0", 700]], -0.05);
    const off = dm("office"); off.position.set(15, 0, gz - 9); off.rotation.y = -Math.PI / 2; root.add(off);
    // sodium lamp post
    const lp = new THREE.Group(); lp.position.set(-5.5, 0, gz - 1); root.add(lp);
    const steel = std({ color: "#3a3c3e", metalness: 0.6, roughness: 0.5 });
    cyl(lp, 0.07, 0.1, 6, 0, 3, 0, steel, 8); box(lp, 1.4, 0.08, 0.08, 0.6, 5.95, 0, steel);
    const head = cyl(lp, 0.18, 0.12, 0.16, 1.25, 5.88, 0, steel, 10); void head;
    const sod = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ color: "#ffb860" })); sod.position.set(1.25, 5.78, 0); lp.add(sod);
  }

  // ---- 1998 jeeps: two Willys + a Cherokee, rusted, half sunk, vines
  { const jz = JEEPS;
    const pts: [string, number, number, number, number][] = [["willys", 0, 0, 0.6, 0.06], ["willys", 5.2, 2.5, 2.1, -0.05], ["cherokee", -4.5, 3.5, -0.9, 0.08]];
    for (const [k, x, z, ry, tilt] of pts) { const j = dm(k); j.position.set(jz.x + x, -0.18, jz.z + z); j.rotation.set(tilt, ry, tilt * 0.6); root.add(j);
      if (k === "cherokee") j.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { const mt = (m.material as THREE.MeshStandardMaterial).clone(); mt.color = new THREE.Color("#7a4a30"); mt.roughness = 1; m.material = mt; } });
      for (let v = 0; v < 3; v++) { const vn = dm(v % 2 ? "vine1" : "vine2"); vn.position.set(jz.x + x + (v - 1) * 1.1, 0.4, jz.z + z + (v - 1) * 0.6); vn.rotation.y = v; vn.scale.setScalar(0.8); root.add(vn); } }
    for (const [n, x, z, s] of [["fern_02", 2, -2, 1.5], ["shrub_03", -2, -3, 1.1], ["calathea_orbifolia_01", 3, 5, 1.4], ["fern_02", -6, 1, 1.3], ["shrub_02", 7, 0, 1], ["grass_medium_01", 0, 4, 1.3]] as const) { const o = ph(n); o.position.set(jz.x + x, 0, jz.z + z); o.scale.multiplyScalar(s); root.add(o); } }

  // ---- trees: deterministic jittered grid, exclusions, impostors (instanced) for far ones
  const trees: TreeRec[] = [];
  const excluded = (x: number, z: number) => {
    for (let i = 1; i <= 12; i++) { const [tx, tz] = towerXZ(i); if ((x - tx) ** 2 + (z - tz) ** 2 < 36) return true; }
    if (x * x + z * z < 17 * 17) return true;
    if (Math.abs(Math.hypot(x, z) - (R + 6)) < 2.4) return true;
    if (x > -26 && x < 26 && z > CAMP.z - 16 && z < CAMP.z + 22) return true;
    if (Math.abs(z - GATE.z) < 7) return true;
    if (Math.abs(x) < 5.5 && z > R + 2 && z < HWZ) return true;
    if (Math.abs(Math.hypot(x, z) - FENCE_R) < 6) return true; // cleared patrol strip along the perimeter fence
    if ((x - MAST.x) ** 2 + (z - MAST.z) ** 2 < 49) return true;
    if (z > GATE.z - 7 && z < HWZ + 14 && Math.abs(x) < 260) return true; // cleared buffer strip between the fence and the highway
    if (Math.abs(z - riverZ(x)) < 8.5) return true;
    if ((x - JEEPS.x) ** 2 + (z - JEEPS.z) ** 2 < 64) return true;
    return false; };
  for (let x = -260; x <= 260; x += 5.2) for (let z = -260; z <= 330; z += 5.2) {
    const jx = x + (r() - 0.5) * 4, jz = z + (r() - 0.5) * 4; const u = r();
    if (excluded(jx, jz)) continue;
    let dmin = 1e9; for (let i = 1; i <= 13; i++) { const [tx, tz] = towerXZ(i); dmin = Math.min(dmin, Math.hypot(jx - tx, jz - tz)); }
    const low = THREE.MathUtils.clamp((dmin - 5) / 32, 0.42, 1); // canopy kept below the platforms near every tower
    trees.push({ x: jx, z: jz, t: u < 0.4 ? 0 : u < 0.8 ? 1 : 2, s: (2.3 + r() * 1.4) * low, ry: r() * 6.28 });
  }
  const impMats: THREE.MeshLambertMaterial[] = [];
  const IMPDEF = [{ side: "tree1_side", top: "tree1_top", S: 5.12, T: 4.92, th: 3.8, model: "island_tree_01" }, { side: "tree2_side", top: "tree2_top", S: 4.29, T: 4.29, th: 2.6, model: "island_tree_02" }, { side: "tree3_side", top: "tree2_top", S: 3.03, T: 3.0, th: 2.0, model: "island_tree_03" }];
  const ims: { side: THREE.InstancedMesh; top: THREE.InstancedMesh; idx: number[] }[] = IMPDEF.map((d, ti) => {
    const list = trees.map((t, i) => (t.t === ti ? i : -1)).filter((i) => i >= 0);
    const g1 = new THREE.PlaneGeometry(d.S, d.S); g1.translate(0, d.S / 2, 0); const g2 = g1.clone(); g2.rotateY(Math.PI / 2);
    const gm = new THREE.BufferGeometry(); // merge the two crossed planes
    { const p: number[] = [], uv: number[] = [], n: number[] = [], ix: number[] = []; let o = 0;
      for (const g of [g1, g2]) { const P = g.attributes.position.array, U = g.attributes.uv.array, N = g.attributes.normal.array, I = g.index!.array; for (const v of P) p.push(v); for (const v of U) uv.push(v); for (const v of N) n.push(v); for (const v of I) ix.push(v + o); o += P.length / 3; }
      gm.setAttribute("position", new THREE.Float32BufferAttribute(p, 3)); gm.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); gm.setAttribute("normal", new THREE.Float32BufferAttribute(n, 3)); gm.setIndex(ix); }
    const ms = new THREE.MeshLambertMaterial({ map: A.imp[d.side], alphaTest: 0.5, side: THREE.DoubleSide, color: "#a8b0a0", emissive: "#ffffff", emissiveMap: A.imp[d.side], emissiveIntensity: 0.3 }); impMats.push(ms);
    addWind(ms, 0.012, "imps" + ti); const side = new THREE.InstancedMesh(gm, ms, list.length); side.layers.set(NOINK); side.castShadow = false; side.receiveShadow = false;
    const gt = new THREE.PlaneGeometry(d.T, d.T); gt.rotateX(-Math.PI / 2); gt.translate(0, d.th, 0);
    const mt = new THREE.MeshLambertMaterial({ map: A.imp[d.top], alphaTest: 0.5, side: THREE.DoubleSide, color: "#9aa294", emissive: "#ffffff", emissiveMap: A.imp[d.top], emissiveIntensity: 0.3 }); impMats.push(mt);
    addWind(mt, 0.006, "impt" + ti); const top = new THREE.InstancedMesh(gt, mt, list.length); top.layers.set(NOINK);
    side.frustumCulled = top.frustumCulled = false;
    root.add(side, top); return { side, top, idx: list };
  });
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  const realTrees = new THREE.Group(); root.add(realTrees);
  const under = new THREE.Group(); root.add(under); const underCache = new Map<string, THREE.Object3D | null>();
  const UND: [string, number, number][] = [["fern_02", 1.1, 5], ["shrub_02", 1, 2], ["shrub_03", 1, 2], ["shrub_04", 1, 1.5], ["pachira_aquatica_01", 1, 1.5], ["calathea_orbifolia_01", 1.2, 3], ["grass_medium_01", 1.1, 2.5], ["fern_02", 1.5, 3], ["rock_moss_set_01", 0.6, 0.8], ["tree_stump_01", 1, 0.4], ["dry_branches_medium_01", 1, 0.8], ["root_cluster_01", 0.7, 0.4], ["boulder_01", 0.5, 0.3]];
  const UW = UND.reduce((s, u) => s + u[2], 0);
  const hash = (a: number, b: number) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  const clearing = (x: number, z: number) => { // tighter rules for open ground (paths, clearings, camp, gate)
    if (Math.abs(Math.hypot(x, z) - (R + 6)) < 1.3) return 0; if (Math.abs(x) < 3.5 && z > R + 2 && z < HWZ) return 0; if (Math.abs(z - HWZ) < 5) return 0; if (z > GATE.z + 2 && z < HWZ - 5) return 0.25; if (Math.abs(Math.hypot(x, z) - FENCE_R) < 2.5) return 0; if (Math.abs(z - riverZ(x)) < 4.6) return 0;
    if (x > -22 && x < 22 && z > CAMP.z - 12 && z < CAMP.z + 18) return 0.04; if (Math.abs(z - GATE.z) < 5) return 0.05;
    for (let i = 1; i <= 13; i++) { const [tx, tz] = towerXZ(i); if ((x - tx) ** 2 + (z - tz) ** 2 < (i === 13 ? 9 : 3.2) ** 2) return 0; }
    if (x * x + z * z < 15 * 15) return 0.18;
    return 0.62; };
  const setNear = (cam: THREE.Vector3, focus: THREE.Vector3) => {
    const inJungle = Math.abs(cam.x) < 400 && Math.abs(focus.x) < 400;
    // trees
    const d2 = (t: TreeRec) => Math.min((t.x - cam.x) ** 2 + (t.z - cam.z) ** 2, ((t.x - focus.x) ** 2 + (t.z - focus.z) ** 2) * 1.8);
    const near = new Set((inJungle ? trees : []).map((t, i) => [i, d2(t)] as const).filter(([, d]) => d < 20 * 20).sort((a, b) => a[1] - b[1]).slice(0, QUALITY.trees).map(([i]) => i));
    realTrees.clear();
    trees.forEach((t, i) => { if (!near.has(i)) return; if (!t.real) { const o = ph(IMPDEF[t.t].model); o.scale.multiplyScalar(t.s); o.position.set(t.x, 0, t.z); o.rotation.y = t.ry; t.real = o; } realTrees.add(t.real); });
    ims.forEach((im) => { im.idx.forEach((ti, k) => { const t = trees[ti]; if (near.has(ti)) { im.side.setMatrixAt(k, ZERO); im.top.setMatrixAt(k, ZERO); return; }
      Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), t.ry); S.setScalar(t.s); V.set(t.x, 0, t.z); M4.compose(V, Q, S); im.side.setMatrixAt(k, M4); im.top.setMatrixAt(k, M4); });
      im.side.instanceMatrix.needsUpdate = true; im.top.instanceMatrix.needsUpdate = true; });
    // undergrowth cells (2.6 m) within 17 m of the camera or 11 m of the focus
    under.clear(); const C = 2.6; let n = 0;
    const want = new Set<string>();
    for (const [cx, cz, rad] of [[cam.x, cam.z, 17], [focus.x, focus.z, 11]] as const) {
      for (let gx = Math.floor((cx - rad) / C); gx <= Math.floor((cx + rad) / C); gx++) for (let gz = Math.floor((cz - rad) / C); gz <= Math.floor((cz + rad) / C); gz++) {
        const x = (gx + 0.5) * C, z = (gz + 0.5) * C; if ((x - cx) ** 2 + (z - cz) ** 2 > rad * rad) continue; want.add(gx + "," + gz); } }
    for (const key of want) { if (n > QUALITY.under || !inJungle) break;
      if (!underCache.has(key)) { const [gx, gz] = key.split(",").map(Number); const h0 = hash(gx, gz), h1 = hash(gz + 77, gx - 31), h2 = hash(gx * 3 + 5, gz * 7 - 2);
        const x = (gx + h1) * C, z = (gz + h2) * C; const p = clearing(x, z);
        if (h0 > p) { underCache.set(key, null); }
        else { let w = hash(gx - 9, gz + 13) * UW, k = 0; while (w > UND[k][2]) { w -= UND[k][2]; k++; }
          if (p < 0.3 && k >= 8 && k !== 10) k = 6; // open ground: grass only (no logs / roots / boulders)
          const [nm, sc] = UND[k]; const o = ph(nm); o.scale.multiplyScalar(sc * (0.75 + hash(gx + 1, gz + 2) * 0.7)); o.position.set(x, 0, z); o.rotation.y = hash(gx + 3, gz + 4) * 6.28; underCache.set(key, o); } }
      const o = underCache.get(key); if (o) { under.add(o); n++; } }
  };

  // ---- fixed practicals (gate sodium lamp, booth bulb, mess-shed lantern)
  const prac = [[new THREE.Vector3(-4.25, 5.7, GATE.z - 1), "#ffa552", 16, 26], [new THREE.Vector3(6.5, 2.5, GATE.z - 0.1), "#ffd9a0", 5, 9], [new THREE.Vector3(5.6, 1.0, CAMP.z + 0.6), "#ffb062", 5, 10]] as const;
  const pracL = prac.map(([p, c, i, d]) => { const l = new THREE.PointLight(c, i, d, 1.4); l.position.copy(p); l.userData.base = i; root.add(l);
    const gl2 = sprite(glowTex("prac" + c, "rgba(255,200,130,1)", "rgba(255,170,90,0)", 0.04), 1.2, 0.7); gl2.position.copy(p); root.add(gl2); l.userData.glow = gl2; return l; });
  // ---- lantern glows + light pool
  const lamps: World["lamps"] = towers.map((t) => {
    const lan = t.userData.lantern as THREE.Group; t.updateMatrixWorld(true); const pos = lan.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.15, 0));
    const glow = sprite(glowTex("lamp", "rgba(255,196,120,1)", "rgba(255,170,90,0)", 0.04), 1.6, 0.85); glow.position.copy(pos); root.add(glow);
    const far = sprite(glowTex("lampfar", "rgba(255,180,100,0.9)", "rgba(255,150,80,0)", 0.02), 7, 0.45); far.position.copy(pos); root.add(far);
    const bulb = lan.getObjectByName("glass") as THREE.Mesh; return { pos, glow, far, bulb, on: true }; });
  const pool = Array.from({ length: 5 }, () => { const l = new THREE.PointLight("#ffb062", 0, 14, 1.6); root.add(l); return l; });
  let lampOn: (i: number) => boolean = () => true;
  const assignPool = (cam: THREE.Vector3) => {
    const order = lamps.map((l, i) => [i, l.pos.distanceToSquared(cam)] as const).filter(([i]) => lampOn(i + 1)).sort((a, b) => a[1] - b[1]);
    pool.forEach((pl, k) => { const o = order[k]; if (!o || o[1] > 60 * 60) { pl.intensity = 0; return; } pl.position.copy(lamps[o[0]].pos); pl.intensity = 7; }); };
  const setLamps = (on: (i: number) => boolean) => { lampOn = on; lamps.forEach((l, i) => { const v = on(i + 1); l.on = v; l.glow.visible = l.far.visible = v;
    const m = l.bulb.material as THREE.MeshStandardMaterial; m.emissiveIntensity = v ? 2.2 : 0; m.color.set(v ? "#ffd9a0" : "#3a3a36"); }); };

  // ---- horror fx: wet footprints / handprints (decals that appear one by one), a wet body imprint on the cot, radio glow +
  // light, bats bursting from the canopy, generator blackout, jeep windscreen handprint. Driven per shot via setFx.
  const decalT = (kind: "foot" | "hand" | "body") => { const c = document.createElement("canvas"); c.width = 128; c.height = 256; const g = c.getContext("2d")!; g.fillStyle = "#fff"; g.filter = kind === "body" ? "blur(7px)" : "blur(1.5px)"; // soft, seeping edges
    if (kind === "foot") { g.beginPath(); g.ellipse(64, 150, 34, 70, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(64, 60, 30, 34, 0, 0, 7); g.fill(); for (const [x, y, r2] of [[30, 20, 11], [50, 12, 9], [68, 10, 8], [84, 14, 7], [98, 22, 6]]) { g.beginPath(); g.arc(x, y, r2, 0, 7); g.fill(); } }
    if (kind === "hand") { g.beginPath(); g.ellipse(64, 180, 40, 50, 0, 0, 7); g.fill(); g.lineCap = "round"; g.strokeStyle = "#fff"; for (const [x, l, w2] of [[34, 120, 14], [52, 140, 14], [70, 145, 14], [88, 130, 13], [110, 70, 13]]) { g.lineWidth = w2; g.beginPath(); g.moveTo(x, 170); g.lineTo(x + (x - 64) * 0.25, 170 - l); g.stroke(); } }
    if (kind === "body") { g.beginPath(); g.ellipse(64, 34, 22, 26, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(64, 110, 40, 58, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(48, 200, 16, 52, 0.05, 0, 7); g.ellipse(80, 200, 16, 52, -0.05, 0, 7); g.fill(); }
    g.filter = "none"; g.globalCompositeOperation = "destination-out"; const rr = rng(kind.length * 11); for (let k = 0; k < 140; k++) { g.globalAlpha = 0.25 + rr() * 0.5; g.beginPath(); g.arc(rr() * 128, rr() * 256, 2 + rr() * (kind === "body" ? 9 : 4), 0, 7); g.fill(); } g.globalAlpha = 1; // blotchy, not a clean sticker
    const t = new THREE.CanvasTexture(c); return t; };
  const wetM = (t: THREE.Texture) => new THREE.MeshStandardMaterial({ color: "#5f6f78", emissive: "#1c2a34", alphaMap: t, transparent: true, opacity: 0, roughness: 0.06, metalness: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }); // wet sheen: reads against dark wood and the dark blanket
  const fxG = new THREE.Group(); root.add(fxG);
  const footT = decalT("foot"), handT = decalT("hand"), bodyT = decalT("body");
  const FP: [number, number, number][] = [[0.18, 2.0, 3.1], [-0.12, 1.62, 3.0], [0.12, 1.22, 3.3], [-0.22, 0.85, 3.6], [0.02, 0.48, 3.9], [-0.42, 0.2, 4.3], [-0.68, -0.05, 4.6]]; // tower-local x, z, heading
  const prints = FP.map(([x, z, hd]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.24), wetM(footT)); m.rotation.set(-Math.PI / 2, 0, hd); m.userData.l = new THREE.Vector3(x, PLATFORM_Y + 0.045, z); fxG.add(m); return m; });
  const HP: [number, number][] = [[-0.26, 1.6], [0.27, 2.4], [-0.25, 3.2], [0.28, 4.0], [-0.24, 4.8], [0.26, 5.6], [-0.25, 6.4], [0.24, 7.2]]; // ladder rails, height
  const hands = HP.map(() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.19), wetM(handT)); fxG.add(m); return m; });
  const imprint = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 1.7), wetM(bodyT)); fxG.add(imprint);
  const jeepHand = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.26), new THREE.MeshStandardMaterial({ color: "#d8dde0", alphaMap: handT, transparent: true, opacity: 0, roughness: 0.3, depthWrite: false })); fxG.add(jeepHand); jeepHand.name = "jeepHand";
  const radioL = new THREE.PointLight("#5cff8a", 0, 4, 1.6); root.add(radioL);
  const radioG = sprite(glowTex("radioG", "rgba(120,255,150,1)", "rgba(80,255,120,0)", 0.05), 0.5, 0); root.add(radioG);
  const batT = (() => { const c = document.createElement("canvas"); c.width = 128; c.height = 64; const g = c.getContext("2d")!; g.fillStyle = "#060506"; g.beginPath(); g.moveTo(64, 26); g.quadraticCurveTo(40, 0, 4, 10); g.quadraticCurveTo(20, 22, 14, 36); g.quadraticCurveTo(34, 30, 44, 44); g.quadraticCurveTo(54, 36, 64, 48); g.quadraticCurveTo(74, 36, 84, 44); g.quadraticCurveTo(94, 30, 114, 36); g.quadraticCurveTo(108, 22, 124, 10); g.quadraticCurveTo(88, 0, 64, 26); g.fill(); return new THREE.CanvasTexture(c); })();
  const bats = Array.from({ length: 46 }, (_, k) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: batT, transparent: true, depthWrite: false, fog: true })); sp.visible = false; sp.userData.r = [rng(k + 300)(), rng(k + 900)(), rng(k + 1500)()]; root.add(sp); return sp; });
  const T13 = () => towers[12];
  type Fx = { tower?: number; prints?: number; hands?: number; imprint?: number; radio?: number; radioRed?: boolean; bed?: number; swing?: number; clothes?: number; bats?: number; batsAt?: THREE.Vector3; blackout?: number; jeepHand?: number };
  let fxNow: Fx = {};
  const setFx = (f: Fx) => { fxNow = f; const ti = f.tower ?? 13, tw = towers[ti - 1]; tw.updateMatrixWorld(true);
    prints.forEach((m, k) => { const p = m.userData.l as THREE.Vector3; m.position.copy(tw.localToWorld(p.clone())); m.rotation.set(-Math.PI / 2, 0, FP[k][2] + tw.rotation.y); (m.material as THREE.MeshStandardMaterial).opacity = THREE.MathUtils.clamp((f.prints ?? 0) * FP.length - k, 0, 1) * 0.85; });
    const E = 1.7 + 0.42, lz0 = E + 1.35, lz1 = E + 0.08, Hh = PLATFORM_Y + 0.9, ang = Math.atan2(lz0 - lz1, Hh);
    hands.forEach((m, k) => { const [x, y] = HP[k]; const z = lz0 - (lz0 - lz1) * (y / Hh) + 0.05; m.position.copy(tw.localToWorld(new THREE.Vector3(x, y, z))); m.rotation.set(0, tw.rotation.y, 0); m.rotateX(-ang); (m.material as THREE.MeshStandardMaterial).opacity = THREE.MathUtils.clamp((f.hands ?? 0) * HP.length - k, 0, 1) * 0.9; });
    const bed = tw.getObjectByName("bed")!; imprint.position.copy(tw.localToWorld(bed.position.clone().add(new THREE.Vector3(0, 0.66, 0)))); imprint.rotation.set(-Math.PI / 2, 0, tw.rotation.y + Math.PI); (imprint.material as THREE.MeshStandardMaterial).opacity = (f.imprint ?? 0) * 0.8;
    const rad = tw.getObjectByName("radio")!; const rp = tw.localToWorld(rad.position.clone().add(new THREE.Vector3(0, 0.12, 0.1))); radioL.position.copy(rp); radioG.position.copy(rp);
    radioL.color.set(f.radioRed ? "#ff3a2a" : "#5cff8a"); radioG.material.color.set(f.radioRed ? "#ff5040" : "#ffffff");
    { const jp = JEEPS.clone().add(new THREE.Vector3(0.35, 1.45, 1.05)); jeepHand.position.copy(jp); jeepHand.rotation.set(-0.35, 0.6, 0.05); (jeepHand.material as THREE.MeshStandardMaterial).opacity = (f.jeepHand ?? 0) * 0.75; } };
  const tickFx = (t: number) => { const f = fxNow; const ti = f.tower ?? 13, tw = towers[ti - 1];
    const rv = f.radio ?? 0, flick = rv > 0 ? (0.6 + 0.4 * Math.sin(t * 31) * Math.sin(t * 7.3)) : 0; radioL.intensity = rv * 3.5 * flick; radioG.material.opacity = rv * 0.9 * flick; radioG.visible = rv > 0;
    const wk = tw.getObjectByName("walkie"); if (wk) { wk.userData.ry ??= wk.rotation.y; wk.rotation.y = wk.userData.ry + (rv > 0 ? Math.sin(t * 61) * 0.06 * rv : 0); wk.position.y = PLATFORM_Y + 0.8 + (rv > 0 ? Math.abs(Math.sin(t * 47)) * 0.004 : 0); }
    towers.forEach((tg) => { const b = tg.getObjectByName("bed")!; b.userData.rz ??= b.rotation.z; b.rotation.z = b.userData.rz + (tg === tw ? (f.bed ?? 0) * 0.05 * Math.sin(t * 4.2) : 0);
      const ln = tg.userData.lantern as THREE.Group; ln.rotation.z = tg === tw ? (f.swing ?? 0) * 0.35 * Math.sin(t * 2.3) : 0; ln.rotation.x = tg === tw ? (f.swing ?? 0) * 0.2 * Math.sin(t * 1.7 + 1) : 0; });
    for (let k = 0; k < 4; k++) { const cl = root.getObjectByName("cloth" + k); if (cl) { const a = f.clothes ?? 0; cl.rotation.x = a * (0.5 * Math.sin(t * 3.1 + k * 0.9) + 0.25); cl.rotation.y = a * 0.4 * Math.sin(t * 2.3 + k); } }
    const bp = f.bats ?? 0, bc = f.batsAt ?? new THREE.Vector3();
    bats.forEach((b, k) => { const [r1, r2, r3] = b.userData.r as number[]; const p = THREE.MathUtils.clamp((bp - r1 * 0.35) / 0.65, 0, 1); b.visible = bp > 0 && p > 0 && p < 1;
      const a = r2 * Math.PI * 2; b.position.set(bc.x + Math.cos(a) * (2 + p * 30 * (0.5 + r3)), bc.y + p * (14 + r3 * 18) + Math.sin(t * 9 + k) * 0.4, bc.z + Math.sin(a) * (2 + p * 30 * (0.5 + r3)));
      const fl = Math.abs(Math.sin(t * (18 + r3 * 8) + k)); b.scale.set((1.1 + r3 * 0.6) * (0.3 + 0.7 * fl), 0.6 + r3 * 0.25, 1); });
    const bo = f.blackout ?? 0; pracL.forEach((l, k) => { const dead = bo >= 1 || (bo > 0 && Math.sin(t * 40 + k * 3) > 1 - bo * 1.6); const dk = todNow === "night" || todNow === "dusk"; l.intensity = dead || !dk ? 0 : l.userData.base; (l.userData.glow as THREE.Sprite).visible = !dead && dk; }); };

  // ---- light rig + sky dome
  const hemi = new THREE.HemisphereLight("#7d9cc6", "#16130e", 1.25); root.add(hemi);
  const moon = new THREE.DirectionalLight("#bcd2f6", 3.4); moon.castShadow = true; moon.shadow.mapSize.set(QUALITY.shadow, QUALITY.shadow);
  Object.assign(moon.shadow.camera, { left: -28, right: 28, top: 28, bottom: -28, near: 1, far: 140 }); moon.shadow.bias = -0.0006; moon.shadow.normalBias = 0.02; root.add(moon, moon.target);
  const skyC = document.createElement("canvas"); skyC.width = 8; skyC.height = 256; const skyT = new THREE.CanvasTexture(skyC); skyT.colorSpace = THREE.SRGBColorSpace;
  const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), new THREE.MeshBasicMaterial({ map: skyT, side: THREE.BackSide, fog: false, depthWrite: false })); sky.layers.set(NOINK); sky.renderOrder = -10; root.add(sky);
  const paintSky = (top: string, mid: string, hor: string) => { const g = skyC.getContext("2d")!; const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, top); gr.addColorStop(0.42, mid); gr.addColorStop(0.5, hor); gr.addColorStop(1, hor); g.fillStyle = gr; g.fillRect(0, 0, 8, 256); skyT.needsUpdate = true; };
  // moon disc + halos + stars (night only)
  const night = new THREE.Group(); root.add(night);
  { const mdir = new THREE.Vector3(-0.35, 0.32, -1).normalize();
    const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d")!; const gr = g.createRadialGradient(120, 118, 10, 128, 128, 100);
    gr.addColorStop(0, "#fbf7ea"); gr.addColorStop(0.85, "#dfe4ea"); gr.addColorStop(1, "rgba(220,228,236,0)"); g.fillStyle = gr; g.beginPath(); g.arc(128, 128, 100, 0, 7); g.fill();
    g.fillStyle = "rgba(150,160,175,0.35)"; for (const [x, y, r2] of [[100, 100, 18], [150, 140, 14], [120, 165, 10], [160, 95, 9]]) { g.beginPath(); g.arc(x, y, r2, 0, 7); g.fill(); }
    const dt = new THREE.CanvasTexture(c); dt.colorSpace = THREE.SRGBColorSpace;
    const disc = new THREE.Sprite(new THREE.SpriteMaterial({ map: dt, fog: false, depthWrite: false })); disc.scale.set(16, 16, 1); disc.position.copy(mdir).multiplyScalar(330); disc.layers.set(NOINK); night.add(disc);
    const h1 = sprite(glowTex("halo1", "rgba(190,210,240,0.9)", "rgba(190,210,240,0)"), 110, 0.5); h1.position.copy(disc.position); night.add(h1);
    const h2 = sprite(glowTex("halo2", "rgba(150,180,225,0.6)", "rgba(150,180,225,0)"), 320, 0.3); h2.position.copy(disc.position).multiplyScalar(0.99); night.add(h2);
    const sr = rng(4); const sp: number[] = [];
    for (let i = 0; i < 700; i++) { const a = sr() * 6.28, e = 0.12 + sr() * 1.3; sp.push(Math.cos(a) * Math.cos(e) * 380, Math.sin(e) * 380, Math.sin(a) * Math.cos(e) * 380); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
    const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: "#cfd8ea", size: 1.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.7, depthWrite: false })); stars.layers.set(NOINK); night.add(stars);
    night.userData.mdir = mdir; }
  const setTime = (t: TimeOfDay, scene: THREE.Scene) => {
    todNow = t;
    const P = {
      night: { hs: "#83a6d2", hg: "#1b1711", hi: 1.5, sc: "#c8daf8", si: 4.4, sd: [-0.35, 0.62, -1], fog: "#25405a", fd: 0.026, sky: ["#0a1322", "#1d3350", "#25405a"] },
      dawn: { hs: "#aab6c6", hg: "#2a2620", hi: 1.7, sc: "#e9dccb", si: 1.4, sd: [1, 0.25, 0.3], fog: "#8b97a3", fd: 0.045, sky: ["#5f7088", "#8d98a6", "#8b97a3"] },
      day: { hs: "#c7d3c6", hg: "#3a3021", hi: 2.1, sc: "#fff1dc", si: 2.6, sd: [0.5, 1, 0.35], fog: "#a3afa2", fd: 0.018, sky: ["#8fa6b8", "#aebdc2", "#a3afa2"] },
      dusk: { hs: "#8f7f96", hg: "#2a2018", hi: 1.35, sc: "#ffa262", si: 2.4, sd: [-1, 0.22, 0.25], fog: "#5c4b5a", fd: 0.024, sky: ["#2e2a48", "#8a5a62", "#c4805e"] },
    }[t];
    hemi.color.set(P.hs); hemi.groundColor.set(P.hg); hemi.intensity = P.hi; moon.color.set(P.sc); moon.intensity = P.si;
    moon.userData.dir = new THREE.Vector3(...(P.sd as [number, number, number])).normalize();
    scene.fog = new THREE.FogExp2(P.fog, P.fd); scene.background = new THREE.Color(P.fog); paintSky(P.sky[0], P.sky[1], P.sky[2]); night.visible = t === "night";
    lamps.forEach((l) => { l.far.material.opacity = t === "night" ? 0.45 : 0.12; l.glow.material.opacity = t === "night" ? 0.85 : 0.3; });
    const dark = t === "night" || t === "dusk"; pracL.forEach((l) => { l.intensity = dark ? l.userData.base : 0; (l.userData.glow as THREE.Sprite).visible = dark; });
    impMats.forEach((m) => { m.emissiveIntensity = { night: 0.68, dawn: 0.45, day: 0.55, dusk: 0.35 }[t]; });
    if (waterMat) waterMat.envMap = envFor(t);
    floods.forEach((f) => { f.intensity = dark ? 60 : 0; });
  };
  // ---- drifting clouds across the moon (night), god-ray shafts near the focus, water normal drift
  const cloudT = (() => { const c = document.createElement("canvas"); c.width = 512; c.height = 256; const g = c.getContext("2d")!; const rr = rng(77);
    for (let i = 0; i < 60; i++) { const x = 60 + rr() * 390, y = 80 + rr() * 100, r0 = 30 + rr() * 70; const gr = g.createRadialGradient(x, y, 0, x, y, r0); gr.addColorStop(0, "rgba(150,165,190,0.5)"); gr.addColorStop(1, "rgba(150,165,190,0)"); g.fillStyle = gr; g.fillRect(x - r0, y - r0, r0 * 2, r0 * 2); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const clouds = [0, 1, 2].map((k) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudT, transparent: true, opacity: 0.3, fog: false, depthWrite: false, color: "#8090a8" })); sp.scale.set(150 + k * 40, 60 + k * 15, 1); sp.layers.set(NOINK); night.add(sp); return sp; });
  const rayT = (() => { const c = document.createElement("canvas"); c.width = 64; c.height = 512; const g = c.getContext("2d")!; const gy = g.createLinearGradient(0, 0, 0, 512); gy.addColorStop(0, "rgba(200,220,255,0.0)"); gy.addColorStop(0.25, "rgba(200,220,255,0.9)"); gy.addColorStop(1, "rgba(200,220,255,0)"); g.fillStyle = gy; g.fillRect(0, 0, 64, 512);
    const gx = g.createLinearGradient(0, 0, 64, 0); gx.addColorStop(0, "rgba(0,0,0,1)"); gx.addColorStop(0.5, "rgba(0,0,0,0)"); gx.addColorStop(1, "rgba(0,0,0,1)"); g.globalCompositeOperation = "destination-out"; g.fillStyle = gx; g.fillRect(0, 0, 64, 512); return new THREE.CanvasTexture(c); })();
  const rays = new THREE.Group(); root.add(rays); const rr2 = rng(5);
  for (let i = 0; i < 10; i++) { const wdt = 1.2 + rr2() * 3, hh = 30; const m = new THREE.MeshBasicMaterial({ map: rayT, transparent: true, opacity: 0.06 + rr2() * 0.06, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide });
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(wdt, hh), m); pl.userData.o = new THREE.Vector3(-12 + rr2() * 24, hh / 2 - 1, -12 + rr2() * 24); pl.userData.ry = rr2() * 1.2 - 0.6; pl.userData.ph = rr2() * 6; pl.layers.set(NOINK); rays.add(pl); }
  const wN = (waterMat as THREE.MeshStandardMaterial | null)?.normalMap ?? null;
  let todNow: TimeOfDay = "night";
  const aviation = root.getObjectByName("aviation"), aviationG = root.getObjectByName("aviationGlow"); const gL = root.getObjectByName("gateL"), gR = root.getObjectByName("gateR");
  const floods: THREE.SpotLight[] = []; root.traverse((o) => { if ((o as THREE.SpotLight).isSpotLight && o.userData.flood) floods.push(o as THREE.SpotLight); });
  const tick = (t: number, cam: THREE.Vector3, focus: THREE.Vector3) => {
    ANIM.time.value = t; tickFx(t);
    lamps.forEach((l, i) => { const fl = 0.82 + 0.1 * Math.sin(t * 9.1 + i * 1.7) + 0.08 * Math.sin(t * 23.7 + i * 3.1); l.glow.material.opacity = (todNow === "night" ? 0.85 : 0.3) * fl; });
    pool.forEach((pl, k) => { if (pl.intensity > 0) pl.intensity = 7 * (0.85 + 0.12 * Math.sin(t * 8.3 + k * 2.1) + 0.06 * Math.sin(t * 19 + k)); });
    if (wN) { wN.offset.set(t * 0.01, t * 0.035); }
    { const on = Math.floor(t * 0.75) % 2 === 0 && (t * 0.75) % 1 < 0.45; if (aviation) (aviation as THREE.Mesh).visible = on; if (aviationG) aviationG.visible = on && todNow !== "day"; }
    clouds.forEach((c, k) => { const md = night.userData.mdir as THREE.Vector3; const side = new THREE.Vector3(1, 0, 0).cross(md).normalize(); const p = md.clone().multiplyScalar(320).add(new THREE.Vector3(((t * (3 + k)) % 240) - 120 + k * 60, -6 + k * 9, 0)); c.position.copy(p); void side; });
    rays.position.copy(focus); rays.visible = todNow === "night" || todNow === "dawn";
    rays.children.forEach((pl) => { const o = pl.userData.o as THREE.Vector3; pl.position.copy(o); pl.rotation.set(0, pl.userData.ry + Math.atan2(cam.x - focus.x, cam.z - focus.z), 0.32); ((pl as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.05 + 0.05 * (0.5 + 0.5 * Math.sin(t * 0.4 + pl.userData.ph)); });
  };
  const w: World = { root, towers, lamps, tick, setFx: (f) => setFx(f as Fx), boom: root.getObjectByName("boom")!, setGate: (o) => { if (gL) gL.rotation.y = o * 1.75; if (gR) gR.rotation.y = -o * 1.75; }, setNear: (cam, focus) => { setNear(cam, focus); assignPool(cam);
      lamps.forEach((l) => { const d = l.pos.distanceTo(cam); l.far.visible = l.on && d > 24; l.far.scale.setScalar(THREE.MathUtils.clamp(d * 0.05, 2, 8)); l.glow.scale.setScalar(THREE.MathUtils.clamp(0.6 + d * 0.012, 0.9, 2.4)); });
      const d = (moon.userData.dir as THREE.Vector3) ?? new THREE.Vector3(0, 1, 0); moon.target.position.copy(focus); moon.position.copy(focus).addScaledVector(d, 60); moon.target.updateMatrixWorld(); sky.position.copy(cam); night.position.copy(cam); },
    setTime, setLamps, moon, hemi, extra, sky };
  return w;
}

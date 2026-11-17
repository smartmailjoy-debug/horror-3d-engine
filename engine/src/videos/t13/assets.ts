// TOWER 13 — asset loading + normalisation. Poly Haven (real scale) from jnd/models, Drive models from jnd/dmodels
// (normalised by a fit spec), impostor sprites from t13/imp, character cards from jnd/chars.
import * as THREE from "three";
import { staticFile } from "remotion";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";

export const PH = ["island_tree_01", "island_tree_02", "island_tree_03", "dead_tree_trunk_02", "fern_02", "shrub_02", "shrub_03", "shrub_04",
  "root_cluster_01", "boulder_01", "rock_07", "rock_moss_set_01", "rock_moss_set_02", "tree_stump_01", "grass_medium_01", "pachira_aquatica_01",
  "calathea_orbifolia_01", "dry_branches_medium_01", "moss_01", "stone_fire_pit"] as const;

type Fit = { f: string; h?: number; w?: number; l?: number; drop?: string[]; keep?: string; flatDrop?: boolean; desnow?: boolean; skin?: boolean };
// fit: h = height, w = max(x,z) footprint, l = length along the longest horizontal axis (m)
export const DM: Record<string, Fit> = {
  willys: { f: "willys", l: 4.1, flatDrop: true, desnow: true },
  cherokee: { f: "cherokee", l: 4.3 },
  metrojeep: { f: "metrojeep", l: 4.4 },
  barrack: { f: "barrack", w: 11 },
  office: { f: "office", w: 7.5 },
  bed: { f: "beds", keep: "one_bed", l: 1.95 },
  mast: { f: "mast", h: 26 },
  desk: { f: "desk", h: 1.37 },
  generator: { f: "generator", l: 1.4 },
  walkie: { f: "walkie", h: 0.2 },
  baseradio: { f: "baseradio", w: 0.5 },
  skull: { f: "skull", h: 3.4 },
  deadoak: { f: "deadoak", h: 10, flatDrop: true },
  bambooset: { f: "bambooset", h: 9 },
  bamboo1: { f: "bamboo1", h: 11 },
  vine1: { f: "vine1", h: 1.6 },
  vine2: { f: "vine2", h: 2.4 },
  puddle: { f: "puddle", l: 3.2 },
  well: { f: "well", h: 2.4 },
  barbfence: { f: "barbfence", h: 2.7 },
  wirefence: { f: "wirefence", h: 1.6 },
  woodbarb: { f: "woodbarb", l: 2.6 },
  boom: { f: "boom", h: 1.2 },
  striped: { f: "striped", h: 1.1 },
  tank: { f: "tank", h: 9.2 },
  typewriter: { f: "typewriter", h: 0.3 },
  table: { f: "table", h: 0.78 },
  props: { f: "props", l: 1.9 },
  stranger: { f: "stranger", h: 2.35, skin: true },
};
export const CHARS = ["arjun", "bhola", "sameer", "rinku", "mohan", "dev", "kishan", "walker"] as const;
export const IMPS = ["tree1", "tree2", "tree3", "dead"] as const;

/** shared animated uniforms (seconds), set once per frame by the film */
export const ANIM = { time: { value: 0 }, wind: { value: 1 } };
/** sway foliage in the vertex shader: amp = metres of tip sway per local unit of height */
export function addWind(m: THREE.Material, amp: number, key: string) {
  const mm = m as THREE.MeshStandardMaterial; if (mm.userData.wind) return; mm.userData.wind = true;
  const prev = mm.onBeforeCompile;
  mm.onBeforeCompile = (sh, r) => { prev?.call(mm, sh, r); sh.uniforms.uTime = ANIM.time; sh.uniforms.uWind = ANIM.wind;
    sh.vertexShader = "uniform float uTime; uniform float uWind;\n" + sh.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
      { vec4 wp0 = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
        wp0 = instanceMatrix * wp0;
        #endif
        wp0 = modelMatrix * wp0; float h = max(0.0, transformed.y);
        float s1 = sin(uTime * 1.25 + wp0.x * 0.19 + wp0.z * 0.13) + 0.45 * sin(uTime * 2.9 + wp0.x * 0.7 + wp0.z * 0.4);
        float s2 = cos(uTime * 1.05 + wp0.z * 0.21 + wp0.x * 0.09);
        transformed.x += s1 * h * ${amp.toFixed(4)} * uWind; transformed.z += s2 * h * ${(amp * 0.6).toFixed(4)} * uWind; }`); };
  const ck = mm.customProgramCacheKey?.bind(mm); mm.customProgramCacheKey = () => (ck ? ck() : "") + "|wind" + key;
  mm.needsUpdate = true;
}
const WINDY: Record<string, number> = { island_tree_01: 0.018, island_tree_02: 0.02, island_tree_03: 0.02, fern_02: 0.09, shrub_02: 0.045, shrub_03: 0.045, shrub_04: 0.045, grass_medium_01: 0.12, pachira_aquatica_01: 0.05, calathea_orbifolia_01: 0.08, dry_branches_medium_01: 0.0 };
const WINDY_DM: Record<string, number> = { bambooset: 0.012, bamboo1: 0.0004, vine1: 0.05, vine2: 0.04, deadoak: 0.0 };
export const A = {
  ph: {} as Record<string, THREE.Object3D>,
  dm: {} as Record<string, THREE.Object3D>,
  dmAnim: {} as Record<string, THREE.AnimationClip[]>,
  imp: {} as Record<string, THREE.Texture>,
  ch: {} as Record<string, THREE.Texture>,
  chMeta: {} as Record<string, { w: number; h: number; feetY: number; feetX?: number; px: number; anc?: { head?: number[]; hand?: number[]; hand2?: number[]; hair?: number[]; eyes?: number[][] }; blink?: number[] }>,
};
let loading: Promise<void> | null = null;
export let assetsReady = false;

const desnow = (m: THREE.MeshStandardMaterial) => {
  m.onBeforeCompile = (s) => {
    s.fragmentShader = s.fragmentShader.replace("#include <map_fragment>", `#include <map_fragment>
      { float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
        float sat = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b)) - min(diffuseColor.r, min(diffuseColor.g, diffuseColor.b));
        float snow = smoothstep(0.32, 0.6, lum) * (1.0 - smoothstep(0.06, 0.18, sat));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.13, 0.11, 0.06) * (0.6 + 0.8 * lum), snow); }`);
  };
  m.customProgramCacheKey = () => "desnow";
};

function normalise(scene: THREE.Object3D, s: Fit): THREE.Object3D {
  scene.updateMatrixWorld(true);
  const full = new THREE.Box3().setFromObject(scene), fs = full.getSize(new THREE.Vector3());
  const kill: THREE.Object3D[] = [];
  scene.traverse((o) => {
    const m = o as THREE.Mesh; if (!m.isMesh) return;
    if (s.drop?.includes(m.name)) kill.push(m);
    if (s.keep && !m.name.includes(s.keep)) kill.push(m);
    if (s.flatDrop) { const b = new THREE.Box3().setFromObject(m), bs = b.getSize(new THREE.Vector3());
      if (bs.y < fs.y * 0.06 && Math.max(bs.x, bs.z) > Math.max(fs.x, fs.z) * 0.6) kill.push(m); }
    m.castShadow = true; m.receiveShadow = true;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mt of mats as THREE.MeshStandardMaterial[]) {
      if ("roughness" in mt) { mt.roughness = Math.max(mt.roughness ?? 1, 0.7); mt.metalness = Math.min(mt.metalness ?? 0, 0.3); mt.envMapIntensity = 0; }
      if (mt.map && mt.transparent) { mt.alphaTest = 0.4; mt.transparent = false; }
      if (s.desnow) desnow(mt);
    }
  });
  kill.forEach((k) => k.parent?.remove(k));
  scene.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(scene), sz = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
  let k = 1;
  if (s.h) k = s.h / sz.y; else if (s.w) k = s.w / Math.max(sz.x, sz.z); else if (s.l) k = s.l / Math.max(sz.x, sz.z);
  const inner = new THREE.Group(); inner.add(scene);
  scene.position.set(-c.x, -b.min.y, -c.z);
  const outer = new THREE.Group(); outer.add(inner); inner.scale.setScalar(k);
  outer.userData.size = sz.clone().multiplyScalar(k);
  return outer;
}

export const loadFonts = async () => {
  const F: [string, string, string][] = [["Noto Sans Bengali", "noto-sans-bengali-bengali-800-normal.woff2", "800"], ["Noto Sans Bengali", "noto-sans-bengali-bengali-700-normal.woff2", "700"],
    ["Inter", "inter-latin-700-normal.woff2", "700"], ["Inter", "inter-latin-600-normal.woff2", "600"], ["Poppins", "poppins-latin-800-normal.woff2", "800"], ["IBM Plex Mono", "ibm-plex-mono-latin-500-normal.woff2", "500"]];
  await Promise.all(F.map(([fam, file, w]) => new FontFace(fam, `url(${staticFile("fonts/" + file)})`, { weight: w }).load().then((f) => { (document.fonts as unknown as { add: (x: FontFace) => void }).add(f); }).catch(() => undefined)));
};
export const loadAll = () => loading ?? (loading = (async () => {
  await loadFonts();
  const L = new GLTFLoader(); const TL = new THREE.TextureLoader();
  await Promise.all([
    ...PH.map((m) => L.loadAsync(staticFile(`jnd/models/${m}.glb`)).then((g) => {
      g.scene.traverse((o) => { const mm = o as THREE.Mesh; if (mm.isMesh) { mm.castShadow = true; mm.receiveShadow = true;
        const mt = mm.material as THREE.MeshStandardMaterial; if (mt && "roughness" in mt) { mt.roughness = Math.max(mt.roughness ?? 1, 0.85); mt.metalness = 0; } } });
      const amp = WINDY[m]; if (amp) g.scene.traverse((o) => { const mm = o as THREE.Mesh; if (mm.isMesh) (Array.isArray(mm.material) ? mm.material : [mm.material]).forEach((mt) => addWind(mt, amp, m)); });
      A.ph[m] = g.scene; })),
    ...Object.entries(DM).map(([k, s]) => L.loadAsync(staticFile(`jnd/dmodels/${s.f}.glb`)).then((g) => {
      A.dm[k] = s.skin ? g.scene : normalise(g.scene, s); A.dmAnim[k] = g.animations; if (s.skin) A.dm[k].userData.fit = s;
      const amp = WINDY_DM[k]; if (amp) A.dm[k].traverse((o) => { const mm = o as THREE.Mesh; if (mm.isMesh) (Array.isArray(mm.material) ? mm.material : [mm.material]).forEach((mt) => addWind(mt, amp, k)); }); })),
    ...IMPS.map((n) => Promise.all(["side", "top"].map((v) => TL.loadAsync(staticFile(`t13/imp/${n}_${v}.png`)).then((t) => {
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; A.imp[`${n}_${v}`] = t; })))),
    fetch(staticFile("jnd/chars/meta.json")).then((r) => r.json()).then((j) => { A.chMeta = j;
      const names = Object.keys(j).flatMap((c) => (j[c].blink ? [c, c + "_blink"] : [c]));
      return Promise.all(names.map((c) => TL.loadAsync(staticFile(`jnd/chars/${c}.png`)).then((t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; A.ch[c] = t; }))); }),
  ]);
  assetsReady = true;
})());

/** clone a Drive model (skinned ones via SkeletonUtils so the rig is separate) */
export const dm = (k: string) => (DM[k]?.skin ? SkeletonUtils.clone(A.dm[k]) : A.dm[k].clone(true));
export const ph = (k: string) => A.ph[k].clone(true);

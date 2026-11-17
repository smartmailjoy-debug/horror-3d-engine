// TOWER 13 — shot list (script v2 rows 1–130). Times in seconds from the script; re-timed to the final VO later.
import * as THREE from "three";
import { TimeOfDay, onTower, nearTower, towerXZ, CAMP, GATE, HWZ, R, JEEPS, riverZ } from "./world";
import { HOME } from "./sets";
import { RT } from "./retime";

export const FPS = 30;
export type CastI = { c: string; h: number; p: THREE.Vector3; walk?: THREE.Vector3; tint?: string; lamp?: boolean; hideAt?: number; noReflect?: boolean; bill?: boolean };
export type PropI = { k: string; p: THREE.Vector3; p1?: THREE.Vector3; ry?: number; s?: number };
export type Fx = { tower?: number; prints?: number; hands?: number; imprint?: number; radio?: number; radioRed?: boolean; bed?: number; swing?: number; clothes?: number; bats?: number; batsAt?: THREE.Vector3; blackout?: number; jeepHand?: number };
export type Shot = {
  fx?: (u: number) => Fx;
  n: string; t: number; kind: "world" | "insert" | "black"; tod?: TimeOfDay; fog?: number;
  cam?: { p: THREE.Vector3; l: THREE.Vector3; p1?: THREE.Vector3; l1?: THREE.Vector3; fov: number; fov1?: number; shake?: number; roll?: number; roll1?: number; linear?: boolean;
    path?: [THREE.Vector3, THREE.Vector3][]; orbit?: { c: THREE.Vector3; r: number; r1?: number; h: number; h1?: number; a0: number; a1: number; ly?: number } };
  cast?: CastI[]; lamps?: (i: number, u: number) => boolean;
  ins?: string; push?: [number, number]; pan?: [number, number]; dim?: (u: number) => number;
  proc?: { n: number; a0: number; a1: number; r?: number; gap?: number; stopAt?: number; who?: string[]; bill?: boolean; strangers?: number };
  torch?: { from: THREE.Vector3; to: THREE.Vector3; on?: number };
  bus?: { p0: THREE.Vector3; p1: THREE.Vector3; ry?: number };
  text?: { t: string; sub?: string; kind: "title" | "card" | "end" };
  flash?: boolean; staticAmt?: (u: number) => number; props?: PropI[]; stamp?: string; reflect?: boolean; bangles?: THREE.Vector3; boomOpen?: boolean;
};
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const H: Record<string, number> = { arjun: 1, bhola: 0.93, sameer: 1.06, rinku: 0.97, mohan: 0.98, dev: 0.99, kishan: 1, barua: 1.02, lakhan: 0.98, imran: 1.01, biren: 0.97, joseph: 1, tenzing: 0.95, guddi: 0.6, papa: 0.92, agent: 1.03, brother: 1, survey: 1 };
const ht = (c: string) => 1.72 * (H[c.split("_")[0]] ?? 1);
const C = (c: string, p: THREE.Vector3, o: Partial<CastI> = {}): CastI => ({ c, h: ht(c), p, ...o });
const off = () => false;
const n12 = (i: number) => i <= 12;
// camp lineup: tower order, x from -7.7 step 1.4 at z = 86
const LINE = ["bhola", "lakhan", "rinku", "arjun", "imran", "kishan", "mohan", "biren", "dev", "joseph", "sameer", "tenzing"];
const lx = (id: string) => -7.7 + LINE.indexOf(id) * 1.4, LZ = CAMP.z + 4;
const face = (id: string) => ht(id) * 0.9;
const PI = Math.PI;
// map a point authored on the old R=48 ring to the R=88 ring: radial offset kept, arc distance from the nearest tower kept
const RM = (x: number, y: number, z: number) => { const r = Math.hypot(x, z), a = Math.atan2(z, x), r2 = r + (R - 48); return v(Math.cos(a) * r2, y, Math.sin(a) * r2); }; // same ring angle, radius pushed out
const K = R / 48;

const tcu0 = (tw: number, card: string, o: { fov?: number; d?: number } = {}) => { const fy0 = 8 + ht(card) * 0.9;
  return { cam: { p: onTower(tw, 0.45, 0.6 + (o.d ?? 2.9), fy0 + 0.08), l: onTower(tw, 0.25, 0.6, fy0), p1: onTower(tw, 0.36, 0.6 + (o.d ?? 2.9) - 0.6, fy0 + 0.05), fov: o.fov ?? 32, roll: -0.1, roll1: -0.16 }, cast: [C(card, onTower(tw, 0.25, 0.6))] }; };
const P1: Shot[] = [
  // ---- HOOK (0:00–0:24): whisper on black -> drone dive over the ring -> Tower 13 lights itself -> flash cuts of the
  // traces on Tower 13 -> Bhola's warning -> wet body print on the cot (flash) -> Arjun alone on Tower 13 -> title
  { n: "h1", t: 0, kind: "insert", ins: "led_dim", push: [8.6, 7.9], dim: (u) => (0.9 + Math.min(1, u * 2.2) * 1.5) * (0.82 + 0.18 * Math.sin(u * 30)), staticAmt: (u) => (u < 0.2 ? 0.25 : 0.06) },
  { n: "h2", t: 2.2, kind: "world", tod: "night", fog: 0.0032, cam: { p: v(-270, 110, 420), l: v(-70, 15, 128), fov: 48, path: [[v(-270, 110, 420), v(-70, 15, 128)], [v(-128, 72, 256), v(-18, 6, 55)], [v(-26, 42, 128), v(0, 9, 0)]], roll: 0.08, roll1: -0.04 }, lamps: n12 },
  { n: "h3", t: 7.5, kind: "world", tod: "night", fog: 0.012, cam: { p: v(0, 6, 15), l: v(0, 9, 0), fov: 46, orbit: { c: v(0, 0, 0), r: 16, r1: 12.5, h: 4.5, h1: 7.5, a0: PI / 2 + 0.55, a1: PI / 2 - 0.45, ly: 8.6 } }, lamps: (i, u) => i <= 12 || (i === 13 && u > 0.55) },
  // no walkers in the hook: only their traces. The dead radio on Tower 13 switches itself on, the cot rocks, wet footprints
  // walk from the ladder to the cot, and from the platform: two eye glints in the dark tree line, high up, then gone.
  { n: "h4a", t: 12.5, kind: "world", tod: "night", fog: 0.02, cam: { p: onTower(13, 1.75, -0.15, 9.05), l: onTower(13, 0.85, -1.3, 8.88), p1: onTower(13, 1.38, -0.6, 8.98), fov: 40, roll: 0.06, roll1: 0.1 }, fx: (u) => ({ radio: u > 0.28 ? 1 : 0, swing: 0.3 }), lamps: (i) => i <= 12 },
  { n: "h4b", t: 13.2, kind: "world", tod: "night", fog: 0.02, cam: { p: onTower(13, 1.35, 1.7, 9.35), l: onTower(13, -1.25, -0.4, 8.45), p1: onTower(13, 1.15, 1.5, 9.25), fov: 46, roll: -0.18, roll1: -0.26 }, fx: () => ({ radio: 1, bed: 1, swing: 1 }), lamps: (i) => i <= 13 },
  { n: "h4c", t: 13.9, kind: "world", tod: "night", fog: 0.02, cam: { p: onTower(13, 1.7, 2.05, 10.5), l: onTower(13, -0.35, 0.7, 8.0), p1: onTower(13, 1.6, 1.95, 10.3), fov: 52, shake: 0.006 }, fx: (u) => ({ radio: 1, bed: 0.35, swing: 0.6, prints: Math.min(1, u * 1.15) }), lamps: (i) => i <= 13 },
  { n: "h4d", t: 14.6, kind: "world", tod: "night", fog: 0.016, cam: { p: onTower(13, 0.1, 1.7, 9.7), l: v(3, 3.4, 23), p1: onTower(13, 0.1, 1.9, 9.68), fov: 30, fov1: 23 }, cast: [C("walker", v(3, 0, 23), { h: 3.4, tint: "eyes", hideAt: 0.62 })], fx: () => ({ radio: 1, swing: 0.6, prints: 1 }), lamps: (i) => i <= 13 },
  { n: "h5", t: 15.3, kind: "world", tod: "night", ...tcu0(1, "bhola_radio", { fov: 26, d: 2.4 }), lamps: n12 },
  { n: "h6", t: 19.5, kind: "world", tod: "night", fog: 0.02, cam: { p: onTower(13, -0.15, 1.25, 9.65), l: onTower(13, -1.28, -0.35, 8.6), p1: onTower(13, -0.4, 0.9, 9.45), fov: 46, shake: 0.03 }, fx: () => ({ radio: 1, radioRed: true, imprint: 1, prints: 1 }), flash: true, lamps: (i) => i <= 12 },
  { n: "h6b", t: 20.0, kind: "black" },
  { n: "h7", t: 21.4, kind: "world", tod: "night", fog: 0.014, cam: { p: onTower(13, 0.35, -1.4, 9.75), l: onTower(13, 0, 6, 9.1), path: [[onTower(13, 0.35, -1.3, 9.7), onTower(13, 0.1, 6, 9.2)], [onTower(13, 0.5, -4.8, 9.9), onTower(13, 0.1, 6, 9.0)], [onTower(13, 0.4, -10.5, 10.8), onTower(13, 0, 10, 8.4)]], fov: 44 }, cast: [C("arjun_back", onTower(13, 0.1, -0.2))], lamps: (i) => i !== 4 },
  { n: "9", t: 28.5, kind: "world", tod: "night", fog: 0.012, cam: { p: v(0, 62, 128), l: v(0, 6, 0), p1: v(0, 52, 106), fov: 40 }, lamps: (i) => i !== 4, text: { t: "TOWER 13", kind: "title" } },
  { n: "10", t: 32, kind: "insert", ins: "phone", push: [9.6, 8.6] },
  { n: "11", t: 36, kind: "world", tod: "dusk", cam: { p: HOME.clone().add(v(2.25, 1.55, -1.75)), l: HOME.clone().add(v(-0.4, 1.3, 1.8)), p1: HOME.clone().add(v(2.15, 1.55, -1.55)), fov: 50 },
    cast: [C("papa_cough", HOME.clone().add(v(0.35, 0, 0.35))), C("agent_stand", HOME.clone().add(v(-0.3, 0, 2.75)))] },
  { n: "12", t: 41, kind: "insert", ins: "envelope", push: [9.0, 8.2] },
  { n: "13", t: 44, kind: "insert", ins: "letter", push: [9.2, 8.0], pan: [0, 0.3] },
  { n: "14", t: 49, kind: "world", tod: "dusk", cam: { p: v(-64, 2.2, HWZ + 8), l: v(-54, 1.8, HWZ), p1: v(-20, 2.4, HWZ + 8), l1: v(-4, 2.2, GATE.z), fov: 46 }, bus: { p0: v(-58, 0, HWZ + 1.5), p1: v(-22, 0, HWZ + 1.5) }, lamps: off },
  { n: "15", t: 54, kind: "world", tod: "day", cam: { p: v(-7.4, 2.0, GATE.z + 9), l: v(-8.5, 2.2, GATE.z + 3), p1: v(-8.0, 2.15, GATE.z + 6.4), fov: 40 }, lamps: off },
  { n: "16", t: 59, kind: "world", tod: "day", boomOpen: true, cam: { p: v(-3, 1.75, GATE.z + 15), l: v(4, 1.6, GATE.z + 0.5), p1: v(-1.5, 1.72, GATE.z + 11), fov: 42 },
    cast: [C("barua_stand", v(3.4, 0, GATE.z + 2.4)), C("arjun_back", v(-1.2, 0, GATE.z + 9.0), { walk: v(0.8, 0, GATE.z + 4.2) }), C("rinku_back", v(-2.4, 0, GATE.z + 10.5), { walk: v(-0.6, 0, GATE.z + 5.8) }), C("dev_back", v(0.4, 0, GATE.z + 11.2), { walk: v(1.9, 0, GATE.z + 6.6) })], lamps: off },
  { n: "17", t: 63, kind: "insert", ins: "contract", push: [9.4, 8.3] },
  { n: "18", t: 68, kind: "world", tod: "day", cam: { p: v(-9, 1.4, LZ + 3.2), l: v(-6, 1.45, LZ), path: [[v(-9.5, 1.35, LZ + 3.4), v(-6.5, 1.45, LZ)], [v(-1, 1.5, LZ + 3.8), v(1, 1.45, LZ)], [v(7, 1.6, LZ + 4.6), v(8, 1.45, LZ)]], fov: 44, linear: true }, cast: LINE.map((id) => C(id === "bhola" ? "bhola_stand" : `${id}_stand`, v(lx(id), 0, LZ))), lamps: off },
  ...["rinku", "sameer", "mohan", "dev", "kishan"].map((id, k): Shot => ({ n: "19" + "abcde"[k], t: 73 + k, kind: "world", tod: "day", cam: { p: v(lx(id) + 0.25, face(id), LZ + 1.25), l: v(lx(id), face(id) - 0.02, LZ), p1: v(lx(id) + 0.2, face(id), LZ + 1.1), fov: 30 },
    cast: LINE.map((o) => C(`${o}_stand`, v(lx(o), 0, LZ))), lamps: off })),
  { n: "20", t: 78, kind: "world", tod: "dusk", cam: { p: v(lx("bhola") + 0.5, 1.45, LZ + 1.8), l: v(lx("bhola"), 1.3, LZ), p1: v(lx("bhola") + 0.4, 1.45, LZ + 1.45), fov: 34 }, cast: [C("bhola_stand", v(lx("bhola"), 0, LZ), { lamp: true })], lamps: off },
  { n: "21", t: 83, kind: "insert", ins: "map_cut", push: [9.0, 8.0] },
  { n: "22", t: 88, kind: "insert", ins: "key4", push: [8.8, 8.0] },
  { n: "23", t: 91, kind: "world", tod: "dusk", cam: { p: v(-1.2, 1.65, CAMP.z - 3.8), l: v(-2.9, 1.6, CAMP.z - 8.2), p1: v(-1.9, 1.68, CAMP.z - 5.2), fov: 42 }, cast: [C("bhola_back", v(-2.5, 0, CAMP.z - 7.5), { lamp: true })], lamps: off },
  { n: "24", t: 98, kind: "world", tod: "night", cam: { p: v(-1.95, 1.47, CAMP.z - 4.0), l: v(-2.0, 1.42, CAMP.z - 5.0), p1: v(-1.98, 1.46, CAMP.z - 4.25), fov: 26 }, cast: [C("bhola_scared", v(-2.0, 0, CAMP.z - 5.0), { lamp: true })], lamps: off },
  { n: "25", t: 105, kind: "world", tod: "dusk", cam: { p: v(0.9, 1.6, CAMP.z - 0.6), l: v(1.4, 1.45, CAMP.z - 5.2), p1: v(1.1, 1.6, CAMP.z - 1.6), fov: 40 },
    cast: [C("sameer_laugh", v(1.2, 0, CAMP.z - 4.5)), C("arjun_calm", v(-0.5, 0, CAMP.z - 5.6)), C("dev_stand", v(2.7, 0, CAMP.z - 5.8)), C("mohan_stand", v(3.9, 0, CAMP.z - 5.3)), C("kishan_stand", v(-1.8, 0, CAMP.z - 5.2))], lamps: off },
  { n: "26", t: 110, kind: "world", tod: "dusk", cam: { p: nearTower(4, 9.5, 2.5).setY(1.2), l: onTower(4, 0, 3.3, 1.8), path: [[nearTower(4, 9.5, 2.5).setY(1.2), onTower(4, 0, 3.3, 1.8)], [nearTower(4, 9.8, 2.2).setY(4.5), onTower(4, 0, 3.0, 5.0)], [nearTower(4, 10.5, 1.6).setY(9.5), onTower(4, 0, 0, 8.8)]], fov: 46 }, cast: [C("arjun_back", nearTower(4, 3.6, 0))], lamps: n12, text: { t: "RAAT 1", sub: "Shaam 6:00 baje", kind: "card" } },
  { n: "27", t: 115, kind: "world", tod: "night", cam: { p: onTower(4, 0.7, 1.5, 9.75), l: onTower(4, -0.3, -40, 7.5), p1: onTower(4, 0.6, 1.2, 9.78), fov: 46 }, cast: [C("arjun_back", onTower(4, 0.15, 0.2))], lamps: n12 },
  { n: "28", t: 120, kind: "world", tod: "night", cam: { p: onTower(4, 0.4, 3.6, 9.6), l: onTower(4, 0.25, 0.6, 9.45), p1: onTower(4, 0.35, 3.1, 9.58), fov: 36 }, cast: [C("arjun_radio", onTower(4, 0.25, 0.6))], lamps: n12 },
  { n: "29", t: 125, kind: "world", tod: "night", cam: { p: onTower(10, -0.6, 3.6, 9.5), l: onTower(10, 0.2, 0.7, 9.45), p1: onTower(10, -0.45, 3.1, 9.5), fov: 34 }, cast: [C("joseph_radio", onTower(10, 0.2, 0.7))], lamps: n12 },
  { n: "30", t: 130, kind: "insert", ins: "watch_239", push: [8.6, 8.2] },
  { n: "31", t: 135, kind: "world", fx: (u) => ({ tower: 4, bats: Math.min(1, u * 1.4), batsAt: RM(-49, 8, 15) }), tod: "night", cam: { p: onTower(4, 0.6, 1.6, 9.95), l: RM(-50.2, 0.5, 19.5), p1: onTower(4, 0.6, 1.8, 9.95), l1: RM(-51.0, 0.6, 17.0), fov: 40 }, proc: { n: 9, a0: PI - 0.48, a1: PI - 0.36, bill: true, strangers: 4 }, lamps: n12 },
  { n: "32", t: 140, kind: "world", tod: "night", cam: { p: RM(-52.6, 0.9, 8.6), l: RM(-51.8, 1.9, 16.5), p1: RM(-52.8, 0.85, 8.0), fov: 42, shake: 0.01 }, proc: { n: 6, a0: PI - 0.36, a1: PI - 0.27, strangers: 4 }, lamps: n12 },
  { n: "33", t: 145, kind: "world", tod: "night", cam: { p: onTower(4, 0.3, 2.6, 9.5), l: onTower(4, 0.2, 0.6, 9.4), p1: onTower(4, 0.28, 2.2, 9.48), fov: 30, shake: 0.008 }, cast: [C("arjun_scared", onTower(4, 0.2, 0.6))], lamps: n12 },
  { n: "34", t: 149, kind: "world", tod: "night", cam: { p: nearTower(4, 17, 6).setY(2.2), l: nearTower(4, 4, 0).setY(4.8), p1: nearTower(4, 16, 5).setY(2.4), fov: 46 }, proc: { n: 9, a0: PI - 0.3, a1: PI, stopAt: 0.7, gap: 0.058, bill: true, strangers: 4 }, lamps: n12 },
  { n: "35", t: 153, kind: "world", tod: "night", cam: { p: nearTower(4, 10.2, -2.8).setY(0.6), l: nearTower(4, 6.1, 0.2).setY(3.2), p1: nearTower(4, 9.6, -2.4).setY(0.55), fov: 40 }, proc: { n: 9, a0: PI, a1: PI, gap: 0.058 }, lamps: n12 },
  { n: "36", t: 157, kind: "world", tod: "night", cam: { p: onTower(4, 0.1, 2.3, 10.05), l: nearTower(4, 6.0, -0.1).setY(2.6), p1: onTower(4, 0.1, 2.4, 10.0), fov: 30, fov1: 24, shake: 0.006 }, proc: { n: 9, a0: PI, a1: PI, gap: 0.058, bill: true },
    torch: { from: onTower(4, 0.3, 2.0, 9.9), to: nearTower(4, 6.0, 0).setY(2.6), on: 0.78 }, lamps: n12 },
  { n: "37", t: 162, kind: "black" },
];

// ---- lamp state per night: Tower 4 empty from night 2, Tower 13 lit (Arjun); each death puts a tower out
const DEAD: [number, number][] = [[3, 2], [7, 3], [11, 4], [9, 5], [6, 6], [1, 7]];
const nightLit = (night: number, dying?: number, offAt = 0.5) => (i: number, u: number) => {
  if (i === 13) return true; if (i === 4) return false;
  for (const [t, n] of DEAD) if (t === i && night > n) return false;
  if (dying === i && u > offAt) return false; return true; };
const fy = (c: string) => 8 + face(c);
/** medium close-up of a guard on his platform, camera floating just outside the railing */
const tcu = (tw: number, card: string, o: { fov?: number; shake?: number; d?: number } = {}) => ({
  cam: { p: onTower(tw, 0.45, 0.6 + (o.d ?? 2.9), fy(card) + 0.08), l: onTower(tw, 0.25, 0.6, fy(card)), p1: onTower(tw, 0.38, 0.6 + (o.d ?? 2.9) - 0.45, fy(card) + 0.06), fov: o.fov ?? 32, shake: o.shake },
  cast: [C(card, onTower(tw, 0.25, 0.6))] });
const towerLamp = (k: number) => { const [x, z] = towerXZ(k); return v(x, 9.6, z); };
const fromT13 = (k: number, fov = 30) => ({ p: onTower(13, 0, 1.4, 9.75), l: towerLamp(k), p1: onTower(13, 0, 1.5, 9.75), fov, fov1: fov * 0.85 });
const RZ = (x: number) => riverZ(x);
const ARJ = (c: string) => C(c, onTower(13, 0.25, 0.6));

const P2: Shot[] = [
  { n: "38", t: 164, kind: "world", fx: () => ({ prints: 1 }), tod: "dawn", cam: { p: onTower(13, 1.6, -1.5, 9.1), l: onTower(13, -0.2, 0.6, 9.3), p1: onTower(13, 1.45, -1.3, 9.2), fov: 50 }, cast: [ARJ("arjun_scared")], lamps: off },
  { n: "39", t: 169, kind: "world", tod: "dawn", cam: { p: v(1.6, 1.6, 26 * K), l: v(0.6, 1.3, 26 * K + 10), p1: v(1.6, 1.6, 26 * K + 5), l1: v(0.6, 1.3, 26 * K + 15), fov: 46 }, cast: [C("arjun_back", v(0.6, 0, 26 * K + 3), { walk: v(0.6, 0, 26 * K + 9.5) })], lamps: off },
  { n: "40", t: 173, kind: "world", fx: () => ({ clothes: 1 }), tod: "dawn", cam: { p: v(-2.5, 1.7, LZ + 10), l: v(-1, 1.3, LZ), p1: v(-1.5, 1.7, LZ + 8.5), fov: 46 },
    cast: [...LINE.filter((x) => x !== "arjun" && x !== "bhola").map((id) => C(`${id}_stand`, v(lx(id), 0, LZ))), C("bhola_register", v(lx("arjun"), 0, LZ + 2.4))], lamps: off },
  { n: "41", t: 176, kind: "insert", ins: "reg_11", push: [9.4, 8.4] },
  { n: "42", t: 181, kind: "world", tod: "dawn", cam: { p: v(0.4, 1.68, LZ + 1.6), l: v(2.0, 1.55, LZ - 2), p1: v(0.55, 1.68, LZ + 1.2), fov: 38 }, cast: [C("arjun_back", v(0.9, 0, LZ + 0.4)), C("dev_scared", v(2.0, 0, LZ - 2))], lamps: off },
  { n: "43", t: 187, kind: "world", tod: "dusk", cam: { p: v(0.8, 1.6, R + 13), l: v(0.3, 1.4, R + 4), p1: v(0.7, 1.6, R + 9), l1: v(0.2, 1.6, R - 2), fov: 44 }, cast: [C("arjun_back", v(0.4, 0, R + 10), { walk: v(0.3, 0, R + 4.5) })], lamps: off },
  { n: "44", t: 191, kind: "world", tod: "night", cam: { p: onTower(13, 0.12, 3.6, 8.98), l: onTower(13, 0, 2.165, 8.82), p1: onTower(13, 0.08, 2.9, 8.9), fov: 30, shake: 0.003 }, torch: { from: onTower(13, 0.3, 3.8, 9.3), to: onTower(13, 0, 2.165, 8.82) }, lamps: nightLit(2) },
  { n: "45", t: 196, kind: "world", tod: "night", fog: 0.012, cam: { p: onTower(13, 0.4, -6.5, 11.2), l: onTower(13, 0, 0.2, 9.0), p1: onTower(13, 0.4, -8.5, 12.4), l1: onTower(13, 0, 12, 7.5), fov: 52 }, cast: [C("arjun_back", onTower(13, 0.1, -0.2))], lamps: nightLit(2) },
  { n: "46", t: 201, kind: "insert", ins: "led_on", push: [8.8, 8.4], staticAmt: (u) => (u < 0.25 ? 0.35 : 0.08) },
  { n: "47", t: 205, kind: "world", tod: "night", ...tcu(13, "arjun_radio"), lamps: nightLit(2) },
  { n: "48", t: 209, kind: "world", tod: "night", ...tcu(1, "bhola_scared", { fov: 26, shake: 0.006, d: 2.4 }), lamps: nightLit(2) },
  { n: "49", t: 215, kind: "world", fx: () => ({ radio: 1, swing: 0.5, bed: 0.3 }), tod: "night", cam: { p: v(9, 5.5, 17), l: v(0, 9.2, 0), fov: 42, orbit: { c: v(0, 0, 0), r: 15, h: 9, h1: 11, a0: 1.1, a1: 1.9, ly: 9.4 } }, cast: [ARJ("arjun_radio")], lamps: nightLit(2), staticAmt: () => 0.12 },
  { n: "50", t: 220, kind: "world", tod: "night", ...tcu(3, "rinku_radio", { fov: 30 }), lamps: nightLit(2) },
  { n: "51", t: 224, kind: "world", tod: "night", ...tcu(13, "arjun_radio", { fov: 28, d: 2.4 }), lamps: nightLit(2) },
  { n: "52", t: 231, kind: "world", tod: "night", cam: { p: onTower(3, -1.4, -1.6, 9.9), l: onTower(3, 0.2, 0.4, 9.3), p1: onTower(3, -1.2, -1.3, 9.85), fov: 40 }, cast: [C("rinku_radioScared", onTower(3, 0.25, 0.6))], lamps: nightLit(2) },
  { n: "53", t: 235, kind: "world", tod: "night", ...tcu(1, "bhola_radio", { fov: 26, shake: 0.012, d: 2.3 }), lamps: nightLit(2), staticAmt: (u) => (u > 0.7 ? 0.5 : 0.1) },
  { n: "54", t: 240, kind: "world", tod: "night", cam: fromT13(3, 26), cast: [C("rinku_back", nearTower(3, -6), { walk: nearTower(3, -16), lamp: true })], lamps: nightLit(2) },
  { n: "55", t: 244, kind: "world", tod: "night", cam: { ...fromT13(3, 22), fov1: 22 }, cast: [C("rinku_back", nearTower(3, -16), { lamp: true, hideAt: 0.45 })], lamps: nightLit(2, 3, 0.55) },
  { n: "56", t: 248, kind: "insert", ins: "led_on", push: [8.6, 8.0], staticAmt: (u) => 0.25 + 0.2 * Math.sin(u * 30) },
  { n: "57", t: 254, kind: "world", tod: "night", ...tcu(13, "arjun_radioScared", { fov: 30, shake: 0.01 }), lamps: nightLit(3) },
  { n: "58", t: 258, kind: "world", tod: "night", fog: 0.04, cam: { p: v(16, 1.5, RZ(16) - 6), l: v(4, 3, -50), p1: v(2, 1.6, RZ(2) - 6.5), l1: v(-2, 4, -49), fov: 44, linear: true }, lamps: nightLit(3), text: { t: "RAAT 3", sub: "Tower 7 · Nadi", kind: "card" } },
  { n: "59", t: 263, kind: "world", tod: "night", fog: 0.035, cam: { p: v(4.5, 2.6, RZ(4.5) - 4.8), l: v(1.5, 0.9, RZ(1.5)), p1: v(4.0, 2.5, RZ(4.0) - 4.2), fov: 40 }, cast: [{ c: "woman_hair", h: 2.1, p: v(1.5, 0.03, RZ(1.5)) }], lamps: nightLit(3) },
  { n: "60", t: 268, kind: "world", tod: "night", ...tcu(13, "arjun_radioScared", { fov: 30, shake: 0.008 }), lamps: nightLit(3) },
  { n: "61", t: 273, kind: "world", tod: "night", ...tcu(7, "mohan_confused", { fov: 30 }), lamps: nightLit(3) },
  { n: "62", t: 277, kind: "world", tod: "night", cam: { p: nearTower(7, 9, 4).setY(1.5), l: nearTower(7, 3.6, 0).setY(3.5), p1: nearTower(7, 9.5, 3).setY(1.5), l1: nearTower(7, 5, 0).setY(1.6), fov: 44 }, cast: [C("mohan_back", nearTower(7, 3.6), { walk: nearTower(7, 8.5, 1.5) })], lamps: nightLit(3) },
  { n: "63", t: 281, kind: "world", tod: "night", fog: 0.035, cam: { p: v(4.2, 2.4, RZ(4.2) - 4.6), l: v(1.6, 1.0, RZ(1.6)), p1: v(3.9, 2.3, RZ(3.9) - 4.1), fov: 38 }, cast: [{ c: "woman_faceless", h: 2.1, p: v(1.5, 0.03, RZ(1.5)) }, C("mohan_back", v(2.6, -0.5, RZ(2.6) - 2.4))], lamps: nightLit(3) },
  { n: "64", t: 286, kind: "world", tod: "night", fog: 0.03, cam: { p: v(6, 2.2, RZ(6) - 9), l: v(1.5, 0.2, RZ(1.5)), p1: v(5.5, 2.4, RZ(5.5) - 9.5), l1: v(0, 6, -48), fov: 42 }, bangles: v(1.5, 0.05, RZ(1.5)), lamps: nightLit(3, 7, 0.6) },
  { n: "65", t: 291, kind: "world", tod: "dawn", cam: { p: v(-1, 1.7, RZ(-1) - 9), l: v(1, 1.0, RZ(1)), p1: v(-0.5, 1.7, RZ(-0.5) - 8), fov: 44 }, cast: [C("arjun_back", v(0.6, 0, RZ(0.6) - 5.2))], lamps: off },
  { n: "66", t: 295, kind: "world", tod: "dawn", reflect: true, cam: { p: v(0.6, 1.55, RZ(0.6) - 5.0), l: v(0.6, -3.5, RZ(0.6) + 2), p1: v(0.6, 1.5, RZ(0.6) - 4.8), fov: 50 }, cast: [C("arjun_calm", v(0.6, 0, RZ(0.6) - 4.6), { noReflect: true })], lamps: off },
  { n: "67", t: 299, kind: "world", fx: (u) => ({ hands: Math.min(1, u * 1.2), swing: 1 }), tod: "night", cam: { p: onTower(13, 0.4, 4.8, 0.5), l: onTower(13, 0, 2.6, 8.5), p1: onTower(13, 0.2, 4.4, 0.6), fov: 50, shake: 0.03, roll: 0.18, roll1: 0.26 }, lamps: nightLit(4), text: { t: "RAAT 4", kind: "card" } },
  { n: "68", t: 304, kind: "world", tod: "night", cam: { p: onTower(13, 0, 2.25, 9.7), l: onTower(13, 0, 3.4, 3.0), p1: onTower(13, 0, 2.3, 9.6), fov: 44, shake: 0.008 }, cast: [{ c: "walker", h: 3.6, p: onTower(13, -0.2, 3.25, 2.4), walk: onTower(13, -0.2, 2.95, 4.0), bill: true }], lamps: nightLit(4) },
  { n: "69", t: 308, kind: "world", tod: "night", ...tcu(13, "arjun_radioScared", { fov: 28, shake: 0.012 }), lamps: nightLit(4) },
  { n: "70", t: 313, kind: "world", tod: "night", ...tcu(11, "sameer_radio", { fov: 30 }), lamps: nightLit(4) },
  { n: "71", t: 317, kind: "world", tod: "night", cam: { p: nearTower(11, -3, 3).setY(1.4), l: nearTower(11, -9, 0).setY(1.2), p1: nearTower(11, -9, 3).setY(1.4), l1: nearTower(11, -17, 0).setY(1.2), fov: 46, shake: 0.02 }, cast: [C("sameer_back", nearTower(11, -5), { walk: nearTower(11, -14), lamp: true })], lamps: nightLit(4) },
  { n: "72", t: 321, kind: "world", tod: "night", cam: fromT13(11, 26), lamps: nightLit(4, 11, 0.55) },
  { n: "73", t: 326, kind: "world", tod: "night", ...tcu(13, "arjun_tears", { fov: 26, d: 2.3 }), lamps: nightLit(5) },
  { n: "74", t: 330, kind: "world", fx: (u) => ({ jeepHand: THREE.MathUtils.clamp((u - 0.45) * 3, 0, 1) }), tod: "dawn", fog: 0.03, cam: { p: v(JEEPS.x - 8, 1.6, JEEPS.z + 10), l: v(JEEPS.x + 1, 0.8, JEEPS.z), p1: v(JEEPS.x - 6.5, 1.6, JEEPS.z + 8.5), fov: 46 }, cast: [C("arjun_back", v(JEEPS.x - 4.5, 0, JEEPS.z + 6.5), { walk: v(JEEPS.x - 2.5, 0, JEEPS.z + 4) })], lamps: off },
  { n: "75", t: 335, kind: "insert", ins: "mirror", push: [9.2, 8.6] },
  { n: "76", t: 339, kind: "insert", ins: "paper1998", push: [9.6, 8.4] },
  { n: "77", t: 345, kind: "insert", ins: "photo1998", push: [9.4, 7.4], pan: [0, 2.2] },
  { n: "78", t: 350, kind: "world", tod: "dawn", cam: { p: v(JEEPS.x - 1.4, 1.62, JEEPS.z + 5.2), l: v(JEEPS.x - 2.2, 1.6, JEEPS.z + 3.6), p1: v(JEEPS.x - 1.6, 1.62, JEEPS.z + 4.8), fov: 30 }, cast: [C("arjun_scared", v(JEEPS.x - 2.2, 0, JEEPS.z + 3.6))], lamps: off },
  { n: "79", t: 355, kind: "world", tod: "night", ...tcu(9, "dev_scared", { fov: 32 }), lamps: nightLit(5), text: { t: "RAAT 5", kind: "card" } },
  { n: "80", t: 360, kind: "world", tod: "night", cam: { p: nearTower(9, 4, 4).setY(1.3), l: nearTower(9, 8, -1).setY(1.3), p1: nearTower(9, 9, 5).setY(1.3), l1: nearTower(9, 15, -2).setY(1.3), fov: 46, shake: 0.025 }, cast: [C("dev_torch", nearTower(9, 5.5, 0), { walk: nearTower(9, 13, 0), lamp: true })], lamps: nightLit(5) },
  { n: "81", t: 364, kind: "world", tod: "night", cam: { p: v(-4, 1.1, GATE.z - 16), l: v(0, 2, GATE.z - 2), p1: v(-2.2, 1.2, GATE.z - 11.5), fov: 44, roll: 0.06, roll1: 0.14 },
    cast: [-9, -6.2, -3.5, 3.6, 6.4, 9.3].map((x, k) => ({ c: "walker", h: 3.4 + (k % 3) * 0.2, p: v(x, 0, GATE.z - 2.4 - (k % 2) * 0.8) })), lamps: nightLit(5) },
  { n: "82", t: 368, kind: "world", tod: "night", ...tcu(13, "arjun_radioScared", { fov: 26, shake: 0.016, d: 2.3 }), lamps: nightLit(5) },
  { n: "83", t: 372, kind: "world", tod: "night", cam: { p: v(1.6, 1.62, GATE.z - 20), l: v(0.6, 1.5, GATE.z - 22.5), p1: v(1.4, 1.62, GATE.z - 20.6), fov: 32, shake: 0.012 }, cast: [C("dev_radioScared", v(0.6, 0, GATE.z - 22.5), { lamp: true })], lamps: nightLit(5) },
  { n: "84", t: 376, kind: "world", tod: "night", cam: { p: v(2.4, 0.5, GATE.z - 19), l: v(0.6, 0.1, GATE.z - 22.5), p1: v(2.2, 0.45, GATE.z - 19.6), fov: 40 }, torch: { from: v(0.6, 0.12, GATE.z - 22.5), to: v(4.6, 0.1, GATE.z - 25) }, props: [{ k: "walkie", p: v(1.1, 0.02, GATE.z - 22.1), ry: 1.2, s: 1.4 }], lamps: nightLit(5, 9, 0.5) },
  { n: "85", t: 381, kind: "world", tod: "night", ...tcu(13, "arjun_calm", { fov: 26, d: 2.2 }), lamps: nightLit(6) },
  { n: "86", t: 386, kind: "world", fx: (u) => ({ blackout: Math.min(1, u * 1.5) }), tod: "night", fog: 0.0035, cam: { p: v(70, 150, 200), l: v(0, 0, 0), fov: 42, orbit: { c: v(0, 0, 0), r: 210, h: 150, a0: 1.2, a1: 1.6, ly: 0 } }, lamps: nightLit(6), text: { t: "RAAT 6", sub: "Ghere mein saat laalteinein", kind: "card" } },
  { n: "87", t: 391, kind: "insert", ins: "led_on", push: [8.8, 8.2], staticAmt: () => 0.15 },
  { n: "88", t: 396, kind: "world", tod: "night", fog: 0.04, cam: { p: nearTower(6, 13, 3.5).setY(2.2), l: nearTower(6, 5.5, 0).setY(1.0), p1: nearTower(6, 12, 3).setY(2.0), fov: 36 }, cast: [C("guddi_stand", nearTower(6, 5.5))], lamps: nightLit(6) },
  { n: "89", t: 401, kind: "world", tod: "night", ...tcu(13, "arjun_radioScared", { fov: 28, shake: 0.01 }), lamps: nightLit(6) },
  { n: "90", t: 406, kind: "world", tod: "night", ...tcu(6, "kishan_radioTears", { fov: 28 }), lamps: nightLit(6) },
  { n: "91", t: 410, kind: "world", tod: "night", fog: 0.045, cam: { p: nearTower(6, 4.5, -1).setY(1.5), l: nearTower(6, 12, 0).setY(1.2), p1: nearTower(6, 6, -1).setY(1.5), fov: 44 },
    cast: [C("guddi_back", nearTower(6, 9.5), { walk: nearTower(6, 15) }), C("kishan_back", nearTower(6, 6.8, 0.4), { walk: nearTower(6, 12, 0.3) })], lamps: nightLit(6) },
  { n: "92", t: 415, kind: "world", tod: "night", cam: fromT13(6, 26), lamps: nightLit(6, 6, 0.5) },
  { n: "93", t: 420, kind: "insert", ins: "led_dim", push: [8.6, 7.8] },
  { n: "94", t: 426, kind: "world", tod: "night", ...tcu(13, "arjun_tears", { fov: 24, d: 2.0 }), lamps: nightLit(7) },
];
const CL = (n: number, k: number) => v(Math.cos(k) * n, 0, Math.sin(k) * n);
const P3: Shot[] = [
  { n: "95", t: 430, kind: "world", tod: "night", fog: 0.0035, cam: { p: v(-70, 145, 200), l: v(0, 0, 0), fov: 42, orbit: { c: v(0, 0, 0), r: 200, r1: 175, h: 145, h1: 135, a0: 2.0, a1: 1.5, ly: 0 } }, lamps: nightLit(7), text: { t: "RAAT 7", sub: "Aakhri raat", kind: "card" } },
  { n: "96", t: 435, kind: "world", tod: "night", ...tcu(1, "bhola_photo", { fov: 30 }), lamps: nightLit(7) },
  { n: "97", t: 441, kind: "world", tod: "night", ...tcu(13, "arjun_scared", { fov: 24, d: 2.0 }), lamps: nightLit(7) },
  { n: "98", t: 444, kind: "world", tod: "night", ...tcu(1, "bhola_eyesClosed", { fov: 26, d: 2.3 }), lamps: nightLit(7) },
  { n: "99", t: 451, kind: "world", tod: "night", flash: true, cam: { p: onTower(4, 0.1, 2.3, 10.05), l: nearTower(4, 6.0, -0.1).setY(2.6), fov: 24 }, proc: { n: 9, a0: PI, a1: PI, gap: 0.058, bill: true },
    torch: { from: onTower(4, 0.3, 2.0, 9.9), to: nearTower(4, 6.0, 0).setY(2.6) }, lamps: n12 },
  { n: "100", t: 456, kind: "world", tod: "night", ...tcu(1, "bhola_radioTears", { fov: 26, d: 2.2 }), lamps: nightLit(7) },
  { n: "101", t: 464, kind: "world", tod: "night", cam: { p: onTower(1, -1.2, -0.9, 9.7), l: onTower(1, 0.4, 0.4, 9.3), p1: onTower(1, -1.0, -0.7, 9.65), fov: 38 }, cast: [C("bhola_stand", onTower(1, 0.25, 0.6))], lamps: nightLit(7) },
  { n: "102", t: 470, kind: "insert", ins: "photo_brothers", push: [9.4, 8.2] },
  { n: "103", t: 476, kind: "world", tod: "night", cam: { p: v(5, 4, R + 18), l: v(0, 8.5, R), p1: v(4.5, 4.2, R + 15), fov: 40 }, cast: [C("bhola_radio", onTower(1, 0.25, 0.6))], lamps: nightLit(7, 1, 0.6) },
  { n: "104", t: 482, kind: "insert", ins: "watch_240", push: [8.4, 8.0] },
  { n: "105", t: 486, kind: "world", fx: () => ({ radio: 1, radioRed: true, swing: 1, bed: 1 }), tod: "night", cam: { p: v(0, 1, 18), l: v(0, 3, 0), fov: 48, orbit: { c: v(0, 0, 0), r: 17, r1: 14, h: 1.0, h1: 2.2, a0: PI / 2 + 0.7, a1: PI / 2 - 0.2, ly: 4 } }, proc: { n: 10, r: 7.5, a0: PI / 2 - 1.6, a1: PI / 2 + 0.2, stopAt: 0.75, gap: 0.36, bill: true, strangers: 4 }, lamps: nightLit(8) },
  { n: "106", t: 491, kind: "world", tod: "night", cam: { p: v(0.5, 1.5, 15), l: v(0, 1.6, 7.5), p1: v(0.5, 1.5, 13.5), fov: 40 }, proc: { n: 6, r: 7.5, a0: PI / 2 + 0.55, a1: PI / 2 + 0.55, gap: 0.36, who: ["rinku_stand", "mohan_stand", "sameer_stand", "walker", "walker", "walker"] }, lamps: nightLit(8) },
  { n: "107", t: 496, kind: "world", tod: "night", cam: { p: v(-2.5, 1.5, 14), l: v(-2.5, 1.6, 7), p1: v(-2.3, 1.5, 12.8), fov: 40 }, proc: { n: 5, r: 7.5, a0: PI / 2 + 0.75, a1: PI / 2 + 0.75, gap: 0.2, who: ["dev_stand", "kishan_stand", "bhola_stand", "brother_stand", "walker"] }, lamps: nightLit(8) },
  { n: "108", t: 501, kind: "world", tod: "night", fog: 0.04, cam: { p: v(4, 1.6, 17), l: v(0, 1.6, 6), p1: v(3.4, 1.6, 15), fov: 44 }, proc: { n: 14, r: 9.5, a0: PI / 2 + 1.0, a1: PI / 2 + 1.0, gap: 0.16, who: Array(13).fill("survey_stand").concat(["walker"]) }, lamps: nightLit(8) },
  { n: "109", t: 506, kind: "world", tod: "night", cam: { p: v(0, 22, 6), l: v(0, 0, 0), fov: 58, orbit: { c: v(0, 0, 0), r: 6, h: 24, h1: 21, a0: 0, a1: 0.9, ly: 0 } }, proc: { n: 22, r: 8, a0: 2 * PI, a1: 2 * PI, gap: 2 * PI / 22, bill: true }, lamps: nightLit(8) },
  { n: "110", t: 511, kind: "world", tod: "night", ...tcu(13, "arjun_radioScared", { fov: 20, d: 1.8, shake: 0.006 }), lamps: nightLit(8) },
  { n: "111", t: 516, kind: "world", tod: "night", cam: { p: onTower(13, 0.7, 1.3, 8.55), l: onTower(13, 0.25, 0.4, 8.05), p1: onTower(13, 0.6, 1.1, 8.45), fov: 38 }, props: [{ k: "walkie", p: onTower(13, 0.25, 0.4, 8.04), ry: 0.8, s: 1.2 }], lamps: nightLit(8) },
  { n: "112", t: 520, kind: "world", tod: "dawn", cam: { p: onTower(13, 0, 3.0, 10.2), l: v(6, 0.6, 16), p1: onTower(13, 0, 6, 22), l1: v(18, 2, 73), fov: 48 }, proc: { n: 10, r: 7.5, a0: PI / 2 + 0.2, a1: PI / 2 + 1.4, gap: 0.36, bill: true, strangers: 4 }, lamps: off },
  { n: "113", t: 524, kind: "world", tod: "day", cam: { p: v(-3, 1.6, CAMP.z + 20), l: v(7, 1.3, CAMP.z + 13), p1: v(-2.5, 1.6, CAMP.z + 18.5), fov: 44 },
    cast: ["lakhan", "imran", "biren", "joseph", "tenzing"].map((id, k) => C(`${id}_stand`, v(4 + k * 0.9, 0, CAMP.z + 15.2 - (k % 2) * 0.4))), lamps: off },
  { n: "114", t: 530, kind: "world", tod: "day", cam: { p: v(-1.4, 1.6, CAMP.z + 14), l: v(0, 1.4, GATE.z), p1: v(-1.2, 1.6, CAMP.z + 20), l1: v(0, 1.4, GATE.z + 4), fov: 44 }, cast: [C("arjun_back", v(0.2, 0, CAMP.z + 17), { walk: v(0.2, 0, CAMP.z + 23) })], props: [{ k: "cherokee", p: v(0.5, 0, CAMP.z + 22), p1: v(0.5, 0, GATE.z - 3), ry: 0 }], lamps: off },
  { n: "115", t: 534, kind: "world", tod: "day", cam: { p: v(1.2, 1.65, GATE.z - 4.5), l: v(4.9, 1.55, GATE.z + 1.6), p1: v(1.8, 1.65, GATE.z - 3.6), fov: 38 }, cast: [C("barua_stand", v(4.9, 0, GATE.z + 1.6))], lamps: off },
  { n: "116", t: 539, kind: "world", tod: "day", boomOpen: true, cam: { p: v(-1.5, 1.6, GATE.z - 7), l: v(0.3, 1.4, GATE.z + 2), p1: v(-1.2, 1.6, GATE.z - 5.5), fov: 42 },
    cast: [C("arjun_back", v(0.3, 0, GATE.z - 3.5), { walk: v(0.3, 0, GATE.z - 0.6) }), ...["lakhan", "imran", "biren", "joseph", "tenzing"].map((id, k) => C(`${id}_back`, v(-1.6 + k * 0.85, 0, GATE.z + 3.5 + (k % 2) * 0.8), { walk: v(-1.6 + k * 0.85, 0, GATE.z + 9 + (k % 2) * 0.8) }))], lamps: off },
  { n: "117", t: 545, kind: "world", tod: "day", cam: { p: v(4.4, 1.7, GATE.z + 0.3), l: v(4.9, 1.65, GATE.z + 1.6), p1: v(4.5, 1.7, GATE.z + 0.55), fov: 30 }, cast: [C("barua_stare", v(4.9, 0, GATE.z + 1.6))], lamps: off },
  { n: "118", t: 549, kind: "insert", ins: "reg_lapata", push: [9.2, 8.0] },
  { n: "119", t: 554, kind: "insert", ins: "reg_2027", push: [9.0, 7.6], pan: [0, -0.6] },
  // 120: flash montage of the 10 clues, 1.2 s each, with the timestamp burned in
  ...([["2:44", "face_torch"], ["2:56", "reg_11"], ["3:01", "_42"], ["3:11", "_44"], ["3:29", "_48"], ["4:08", "led_on"], ["4:55", "_66"], ["5:35", "mirror"], ["6:12", "_83"], ["7:00", "led_dim"]] as const).map(([st, w], k): Shot =>
    (w.startsWith("_") ? { ...(P2.find((x) => x.n === w.slice(1)) as Shot), n: "120" + k, t: 559 + k * 1.2, stamp: st, flash: true, text: undefined } : { n: "120" + k, t: 559 + k * 1.2, kind: "insert", ins: w, push: [8.6, 8.2], stamp: st, flash: true })),
  { n: "121", t: 571, kind: "black", text: { t: "Sab kuch pehle din se saamne tha.", kind: "end" } },
  { n: "122", t: 575, kind: "world", tod: "night", cam: { p: v(7, 7, 13), l: v(0, 9.2, 0), fov: 44, orbit: { c: v(0, 0, 0), r: 14, r1: 11, h: 6.5, h1: 8.5, a0: 1.0, a1: 1.5, ly: 9.3 } }, cast: [ARJ("arjun_radio")], lamps: (i) => i === 13 },
  { n: "123", t: 579, kind: "world", tod: "night", fog: 0.0035, cam: { p: v(0, 160, 215), l: v(0, 0, 0), fov: 42, orbit: { c: v(0, 0, 0), r: 215, r1: 180, h: 160, h1: 145, a0: PI / 2 - 0.3, a1: PI / 2 + 0.3, ly: 0 } }, lamps: (i, u) => i === 13 || u > 0.15 + i * 0.05 },
  { n: "124", t: 585, kind: "world", tod: "night", cam: { p: v(-2.2, 1.7, CAMP.z - 6.8), l: v(-2.95, 1.7, CAMP.z - 8.25), p1: v(-2.6, 1.7, CAMP.z - 7.4), fov: 38 }, lamps: off },
  { n: "125", t: 591, kind: "world", tod: "night", ...tcu(13, "arjun_radio", { fov: 16, d: 1.9 }), lamps: (i) => i === 13 },
  { n: "126", t: 596, kind: "insert", ins: "led_on", push: [8.2, 7.4] },
  { n: "127", t: 601, kind: "insert", ins: "led_on", push: [7.4, 7.0], staticAmt: (u) => 0.2 + u * 0.3 },
  { n: "128", t: 607, kind: "black", staticAmt: () => 0.25 },
  { n: "129", t: 611, kind: "black", staticAmt: (u) => 0.12 + 0.1 * Math.sin(u * 20) },
  { n: "130", t: 615, kind: "black", text: { t: "Pehla clue kis minute pe pakda?", sub: "Comment mein time likho.", kind: "end" } },
];
void CL;
const END: Shot = { n: "_", t: 620, kind: "black" };
export const SHOTS: Shot[] = [...P1, ...P2, ...P3, END].map((s): Shot => ({ ...s, t: RT[s.n] ?? s.t }));

export const TOTAL = Math.round(SHOTS[SHOTS.length - 1].t * FPS);
const starts = SHOTS.map((s) => Math.round(s.t * FPS));
export const shotAt = (f: number) => {
  let i = 0; while (i < SHOTS.length - 2 && starts[i + 1] <= f) i++;
  const len = Math.max(1, starts[i + 1] - starts[i]), local = f - starts[i];
  return { i, s: SHOTS[i], u: Math.min(1, local / len), local };
};
/** middle frame of each shot (for check stills) */
export const midFrames = (from = 0, to = SHOTS.length - 2) => SHOTS.slice(from, to).map((_, k) => Math.round((starts[from + k] + starts[from + k + 1]) / 2));
void R;

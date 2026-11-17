// Side sets outside the jungle: Arjun's home room (papa on the charpai, recovery agent at the open door) and the
// state bus on the highway along the reserve fence.
import * as THREE from "three";
import { woodTex, plasterTex, tinTex, boardTex, dirtTex } from "./tex";

const std = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, ...o });
const box = (g: THREE.Group, w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material, rx = 0, ry = 0, rz = 0) => {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.rotation.set(rx, ry, rz); b.castShadow = b.receiveShadow = true; g.add(b); return b; };

export const HOME = new THREE.Vector3(2000, 0, 0);
/** room 5 x 4 m, door in the front wall (+z) open to a lane; window on the left wall with dusk light */
export function buildHome(): THREE.Group {
  const g = new THREE.Group(); g.position.copy(HOME);
  const pl = std({ map: plasterTex(), color: "#c9c0a8" }), pl2 = std({ map: plasterTex(), color: "#9aa69a" }), wd = std({ map: woodTex(false) }), wdk = std({ map: woodTex(true) });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), std({ map: dirtTex(), color: "#8a857a" })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
  box(g, 5, 0.04, 4, 0, 0.02, 0, std({ color: "#6e6a60", roughness: 0.7 })); // cement floor
  box(g, 5, 3, 0.15, 0, 1.5, -2, pl2); box(g, 0.15, 3, 4, 2.5, 1.5, 0, pl2);
  box(g, 0.15, 3, 1.3, -2.5, 1.5, -1.35, pl2); box(g, 0.15, 3, 1.3, -2.5, 1.5, 1.35, pl2); box(g, 0.15, 0.9, 1.4, -2.5, 0.45, 0, pl2); box(g, 0.15, 0.7, 1.4, -2.5, 2.65, 0, pl2); // window gap
  for (let k = 0; k < 4; k++) box(g, 0.04, 1.4, 0.04, -2.5, 1.6, -0.5 + k * 0.33, std({ color: "#2a2a2a", metalness: 0.6, roughness: 0.5 })); // window bars
  box(g, 1.7, 3, 0.15, -1.65, 1.5, 2, pl2); box(g, 2.3, 3, 0.15, 1.35, 1.5, 2, pl2); box(g, 1.0, 0.8, 0.15, -0.3, 2.6, 2, pl2); // front wall with the door gap (x -0.8..0.2)
  const door = box(g, 0.95, 2.15, 0.05, -0.75, 1.08, 2.45, wdk); door.rotation.y = -1.2; // open door, swung out
  box(g, 5.4, 0.12, 4.4, 0, 3.05, 0, std({ map: tinTex(0.9), metalness: 0.4, roughness: 0.6 }));
  // charpai (woven cot) + papa's things
  const cot = new THREE.Group(); cot.position.set(1.2, 0, -0.9); g.add(cot);
  for (const [x, z] of [[-0.95, -0.42], [0.95, -0.42], [-0.95, 0.42], [0.95, 0.42]]) box(cot, 0.08, 0.45, 0.08, x, 0.22, z, wd);
  box(cot, 2, 0.06, 0.06, 0, 0.42, -0.42, wd); box(cot, 2, 0.06, 0.06, 0, 0.42, 0.42, wd); box(cot, 0.06, 0.06, 0.9, -0.95, 0.42, 0, wd); box(cot, 0.06, 0.06, 0.9, 0.95, 0.42, 0, wd);
  const weave = new THREE.Mesh(new THREE.PlaneGeometry(1.84, 0.8), std({ map: boardTex("weave", 256, 128, "#b09a70", [["", 10, "#000"]], 0.2), color: "#c9b48a" })); weave.rotation.x = -Math.PI / 2; weave.position.y = 0.44; cot.add(weave);
  box(cot, 1.6, 0.1, 0.6, 0.1, 0.5, 0, std({ color: "#6a3a34" })); // rumpled blanket
  box(g, 0.7, 0.45, 0.45, -1.6, 0.23, -1.6, std({ color: "#3a4a5a", metalness: 0.5, roughness: 0.45 })); // steel trunk
  for (const [x, y] of [[0.2, 0.06], [0.35, 0.05]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.12, 8), std({ color: "#8a6a3a" })); b.position.set(2.2, y + 0.45, -1.7 + x); g.add(b); } // medicine bottles on a shelf
  box(g, 0.6, 0.03, 0.25, 2.3, 0.48, -1.6, wd);
  const cal = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.6), std({ map: boardTex("cal", 256, 340, "#efe6d0", [["2026", 40, "#8a1a12", 900], ["NOV", 54, "#1a1410", 900]], 0.3) })); cal.position.set(0.6, 1.8, -1.92); g.add(cal);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: "#ffe6b0" })); bulb.position.set(0, 2.75, 0); g.add(bulb);
  const wire = box(g, 0.01, 0.25, 0.01, 0, 2.9, 0, std({ color: "#111" })); void wire;
  // lane outside: opposite house wall + drain
  box(g, 12, 3.5, 0.3, 0, 1.75, 5.2, std({ map: plasterTex(), color: "#a89a86" })); box(g, 12, 0.15, 0.5, 0, 0.05, 3.2, std({ color: "#3a3630" }));
  const lamps = { bulb: new THREE.PointLight("#ffd9a8", 6, 7, 1.5), dusk: new THREE.SpotLight("#ff9a60", 30, 14, 0.5, 0.7, 1.2), lane: new THREE.PointLight("#9fb4e0", 4, 10, 1.4) };
  lamps.bulb.position.set(0, 2.6, 0); lamps.dusk.position.set(-5, 2.6, 0); lamps.dusk.target.position.set(1.5, 0.5, -0.5); lamps.lane.position.set(0, 2.5, 3.8);
  g.add(lamps.bulb, lamps.dusk, lamps.dusk.target, lamps.lane);
  g.userData.lights = lamps; return g;
}

/** state-transport bus, front at +x; length 10.5 m */
export function buildBus(): THREE.Group {
  const g = new THREE.Group();
  const body = std({ color: "#c9b27a", roughness: 0.6, metalness: 0.2 }), stripe = std({ color: "#7a2a1c" }), dk = std({ color: "#151515", roughness: 0.4, metalness: 0.4 });
  const win = new THREE.MeshStandardMaterial({ color: "#2a2014", emissive: "#ffb46a", emissiveIntensity: 0.9, roughness: 0.2 });
  box(g, 10.5, 2.5, 2.5, 0, 1.75, 0, body); box(g, 10.52, 0.35, 2.52, 0, 1.15, 0, stripe); box(g, 10.4, 0.18, 2.4, 0, 3.1, 0, std({ color: "#a89a6a" }));
  for (let k = 0; k < 9; k++) for (const sz of [-1, 1]) box(g, 0.85, 0.75, 0.04, -4.3 + k * 1.05, 2.35, sz * 1.27, win);
  box(g, 0.05, 1.0, 2.2, 5.27, 2.3, 0, win); // windscreen
  for (const x of [-3.4, 3.3]) for (const sz of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16), dk); w.rotation.x = Math.PI / 2; w.position.set(x, 0.5, sz * 1.15); w.castShadow = true; g.add(w); }
  for (const sz of [-0.8, 0.8]) { const hl = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshBasicMaterial({ color: "#fff1c8" })); hl.position.set(5.28, 1.05, sz); g.add(hl); }
  const head = new THREE.SpotLight("#fff1d0", 60, 60, 0.45, 0.6, 1.1); head.position.set(5.4, 1.1, 0); head.target.position.set(30, 0, 0); g.add(head, head.target);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.3), new THREE.MeshBasicMaterial({ map: boardTex("bus", 512, 86, "#1a1a1a", [["NEELKANTH · RANGE", 54, "#ffb040", 900]], 0) })); sign.rotation.y = Math.PI / 2; sign.position.set(5.29, 2.95, 0); g.add(sign);
  return g;
}

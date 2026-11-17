// Procedural canvas textures (deterministic): forest floor, dirt road, weathered wood, rusted corrugated tin,
// whitewashed plaster, sign boards, tower number plates, glow sprites.
import * as THREE from "three";

export const rng = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const cache: Record<string, THREE.Texture> = {};
const mk = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, r: () => number) => void, rep?: [number, number], srgb = true) => {
  if (cache[key]) return cache[key];
  const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d")!; draw(g, rng(key.length * 977 + w));
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return (cache[key] = t);
};
const blot = (g: CanvasRenderingContext2D, x: number, y: number, r: number, col: string) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };

export const groundTex = () => mk("ground", 1024, 1024, (g, r) => {
  g.fillStyle = "#3a3123"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 260; i++) blot(g, r() * 1024, r() * 1024, 40 + r() * 140, r() < 0.5 ? "rgba(22,18,12,0.35)" : "rgba(70,62,40,0.25)");
  for (let i = 0; i < 90; i++) blot(g, r() * 1024, r() * 1024, 30 + r() * 90, "rgba(48,62,30,0.35)"); // moss
  for (let i = 0; i < 5200; i++) { // leaf litter
    const x = r() * 1024, y = r() * 1024, a = r() * 6.28, l = 3 + r() * 9; const v = r();
    g.fillStyle = v < 0.4 ? `rgba(${90 + r() * 40},${60 + r() * 30},${30 + r() * 15},0.8)` : v < 0.7 ? `rgba(${50 + r() * 20},${40 + r() * 15},${22},0.85)` : `rgba(${70},${78 + r() * 20},${38},0.6)`;
    g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.ellipse(0, 0, l, l * 0.42, 0, 0, 7); g.fill(); g.restore();
  }
  for (let i = 0; i < 160; i++) { g.strokeStyle = `rgba(30,22,14,${0.4 + r() * 0.4})`; g.lineWidth = 1 + r() * 2; g.beginPath(); const x = r() * 1024, y = r() * 1024; g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 60, y + (r() - 0.5) * 60); g.stroke(); } // twigs
}, [240, 240]);

export const dirtTex = () => mk("dirt", 512, 512, (g, r) => {
  g.fillStyle = "#5a4a34"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 140; i++) blot(g, r() * 512, r() * 512, 20 + r() * 70, r() < 0.5 ? "rgba(40,30,20,0.35)" : "rgba(110,92,64,0.3)");
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${40 + r() * 70},${32 + r() * 50},${20 + r() * 30},0.7)`; g.fillRect(r() * 512, r() * 512, 1 + r() * 3, 1 + r() * 3); }
  for (let k = 0; k < 2; k++) { g.strokeStyle = "rgba(35,26,16,0.45)"; g.lineWidth = 26; g.beginPath(); for (let y = 0; y <= 512; y += 16) g.lineTo(150 + k * 210 + Math.sin(y * 0.03 + k) * 6, y); g.stroke(); } // tyre ruts
}, [1, 12]);

export const woodTex = (dark = false) => mk("wood" + dark, 256, 1024, (g, r) => {
  g.fillStyle = dark ? "#2a1e15" : "#4a3524"; g.fillRect(0, 0, 256, 1024);
  for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(${dark ? 14 : 28},${dark ? 10 : 18},${dark ? 6 : 10},${0.25 + r() * 0.4})`; g.lineWidth = 1 + r() * 3; const x = r() * 256;
    g.beginPath(); for (let y = 0; y <= 1024; y += 32) g.lineTo(x + Math.sin(y * 0.01 + i) * 5, y); g.stroke(); }
  for (let i = 0; i < 9; i++) { const x = r() * 256, y = r() * 1024; g.fillStyle = "rgba(18,12,8,0.6)"; g.beginPath(); g.ellipse(x, y, 4 + r() * 6, 9 + r() * 10, 0, 0, 7); g.fill(); } // knots
  for (let i = 0; i < 40; i++) blot(g, r() * 256, r() * 1024, 20 + r() * 50, dark ? "rgba(40,52,30,0.3)" : "rgba(120,110,90,0.18)"); // moss / weathering
});

export const tinTex = (rust = 0.4) => mk("tin" + rust, 512, 512, (g, r) => {
  for (let x = 0; x < 512; x++) { const v = 0.5 + 0.5 * Math.sin(x * 0.35); const c = 70 + v * 50; g.fillStyle = `rgb(${c},${c + 3},${c + 6})`; g.fillRect(x, 0, 1, 512); }
  for (let i = 0; i < 60 * rust + 10; i++) { const x = r() * 512, y = r() * 512, w = 6 + r() * 30; // rust streaks running down
    const gr = g.createLinearGradient(0, y, 0, y + 120 + r() * 200); gr.addColorStop(0, `rgba(${120 + r() * 40},${55 + r() * 20},20,0.75)`); gr.addColorStop(1, "rgba(90,40,15,0)");
    g.fillStyle = gr; g.fillRect(x, y, w, 320); }
  for (let i = 0; i < 30 * rust; i++) blot(g, r() * 512, r() * 512, 10 + r() * 40, "rgba(110,48,14,0.6)");
  for (let y = 0; y < 512; y += 128) { g.fillStyle = "rgba(20,20,20,0.5)"; g.fillRect(0, y, 512, 3); for (let x = 8; x < 512; x += 40) { g.fillStyle = "#2a2a2a"; g.fillRect(x, y + 6, 4, 4); } } // sheet seams + nails
}, [2, 2]);

export const plasterTex = () => mk("plaster", 512, 512, (g, r) => {
  g.fillStyle = "#b7b09c"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 120; i++) blot(g, r() * 512, r() * 512, 20 + r() * 80, r() < 0.6 ? "rgba(90,84,70,0.3)" : "rgba(60,70,50,0.25)");
  for (let i = 0; i < 25; i++) { const x = r() * 512; const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "rgba(60,54,44,0.0)"); gr.addColorStop(1, "rgba(60,54,44,0.5)"); g.fillStyle = gr; g.fillRect(x, 300 + r() * 100, 6 + r() * 16, 212); }
  g.fillStyle = "rgba(70,60,48,0.55)"; g.fillRect(0, 440, 512, 72); // splash band at the bottom
  for (let i = 0; i < 14; i++) { g.strokeStyle = "rgba(40,36,30,0.6)"; g.lineWidth = 1; g.beginPath(); let x = r() * 512, y = r() * 512; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 30; y += r() * 25; g.lineTo(x, y); } g.stroke(); } // cracks
});

/** rusty enamel sign board: lines = [text, size px, color, weight] */
export const boardTex = (key: string, w: number, h: number, bg: string, lines: [string, number, string, number?][], rust = 0.5) => mk("board" + key, w, h, (g, r) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = "rgba(255,255,255,0.85)"; g.lineWidth = Math.max(4, w * 0.01); g.strokeRect(w * 0.025, h * 0.04, w * 0.95, h * 0.92);
  let y = h * 0.12; const tot = lines.reduce((s, l) => s + l[1] * 1.25, 0); y = (h - tot) / 2 + lines[0][1] * 0.9;
  for (const [t, s, c, wt] of lines) { g.fillStyle = c; g.font = `${wt ?? 800} ${s}px "Inter", "Noto Sans Bengali", Arial, sans-serif`; g.textAlign = "center"; g.fillText(t, w / 2, y); y += s * 1.25; }
  for (let i = 0; i < 80 * rust; i++) blot(g, r() * w, r() * h, 6 + r() * w * 0.06, `rgba(${100 + r() * 50},${45 + r() * 20},15,${0.4 + r() * 0.4})`);
  for (let i = 0; i < 30 * rust; i++) { const x = r() * w; const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(110,50,15,0.5)"); gr.addColorStop(1, "rgba(110,50,15,0)"); g.fillStyle = gr; g.fillRect(x, r() * h * 0.4, 3 + r() * 8, h); }
  for (let i = 0; i < 400 * rust; i++) { g.fillStyle = `rgba(40,30,20,${r() * 0.5})`; g.fillRect(r() * w, r() * h, 2, 2); }
  for (const [x, y] of [[0.04, 0.08], [0.96, 0.08], [0.04, 0.92], [0.96, 0.92]]) { g.fillStyle = "#3a3a3a"; g.beginPath(); g.arc(x * w, y * h, w * 0.012, 0, 7); g.fill(); } // bolts
});

export const plateTex = (n: number, old: boolean) => boardTex("plate" + n + old, 256, 192, old ? "#2c3a2e" : "#244a32", [[String(n), 130, old ? "#cfc8b0" : "#f1ede0", 900]], old ? 1.4 : 0.35);

export const glowTex = (key: string, inner: string, outer: string, r0 = 0.05) => mk("glow" + key, 256, 256, (g) => {
  const gr = g.createRadialGradient(128, 128, 128 * r0, 128, 128, 128); gr.addColorStop(0, inner); gr.addColorStop(1, outer); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
});

export const waterTex = () => mk("water", 512, 512, (g, r) => {
  g.fillStyle = "#808080"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 400; i++) { g.strokeStyle = `rgba(${r() < 0.5 ? 255 : 0},${r() < 0.5 ? 255 : 0},255,0.08)`; g.lineWidth = 2 + r() * 4; const y = r() * 512, x = r() * 512; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 30, y - 6, x + 60, y + 6, x + 100, y); g.stroke(); }
}, [6, 30], false);

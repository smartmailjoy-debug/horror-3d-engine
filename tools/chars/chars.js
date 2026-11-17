// Jungle Ki Night Duty — 2D character design v1 (graphic-novel noir, adult proportions ~7.5 heads)
const _fs0 = require("fs"); _fs0.mkdirSync("tools/chars/out", { recursive: true });
// Canvas2D only, so the same drawing code can move into the engine's card textures.
const { createCanvas, GlobalFonts, Path2D } = require("@napi-rs/canvas");
const fs = require("fs");
const F = "engine/public/fonts/";
GlobalFonts.registerFromPath(F + "inter-latin-600-normal.woff2", "Inter");
GlobalFonts.registerFromPath(F + "inter-latin-700-normal.woff2", "InterB");
GlobalFonts.registerFromPath(F + "ibm-plex-mono-latin-500-normal.woff2", "Mono");

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const dark = (h, k = 0.45) => mix(hex(h), [14, 20, 34], k);      // cool shadow (moonlight side)
const warm = (h, k = 0.18) => mix(hex(h), [255, 196, 120], k);   // lantern side

// one shape, cel-shaded: warm lit side (left), cool shadow (right of split), thin rim of moonlight on the far edge
let part = function (g, path, base, o = {}) {
  const d = o.d ?? 12, sh = o.sh ?? 0.5;   // d = shadow-crescent width (local units), follows the silhouette
  const b = hex(base), shadow = dark(base, sh), mid = mix(b, shadow, 0.45), lit = warm(base, o.wk ?? 0.12);
  g.fillStyle = rgb(shadow); g.fill(path);
  g.save(); g.clip(path);
  if (o.rim !== false) { g.fillStyle = "rgba(150,190,232,0.75)"; g.fill(path); g.save(); g.translate(-3.2, 0); g.fillStyle = rgb(shadow); g.fill(path); g.restore(); }
  if (o.flat) { g.fillStyle = rgb(lit); g.save(); g.translate(-d * 0.3, 0); g.fill(path); g.restore(); }
  else {
    g.save(); g.translate(-d * 0.62, -d * 0.12); g.fillStyle = rgb(mid); g.fill(path); g.restore();
    g.save(); g.translate(-d, -d * 0.2); g.fillStyle = rgb(lit); g.fill(path); g.restore();
  }
  if (o.ao) { g.fillStyle = "rgba(10,10,16,0.28)"; g.save(); g.translate(0, d * 1.4); g.globalCompositeOperation = "source-atop"; g.restore(); }
  g.restore();
  if (o.line !== false) { g.strokeStyle = "rgba(8,10,16,0.8)"; g.lineWidth = o.lw ?? 2; g.stroke(path); }
}
const P = (pts, close = true) => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); if (close) p.closePath(); return p; };
const smooth = (pts) => {   // closed Catmull-Rom through points (organic silhouettes)
  const p = new Path2D(), n = pts.length;
  p.moveTo(...pts[0]);
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    p.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  p.closePath(); return p;
};

// ---------- head ----------
function head(g, s, cx, cy, hs = 1) {
  g.save(); g.translate(cx, cy); g.scale(hs * (s.fw ?? 1), hs * (s.fl ?? 1));
  const sk = s.skin, jw = s.jaw ?? 30, age = s.age ?? 0;
  // neck
  part(g, P([[-15, 40], [15, 40], [17, 78], [-17, 78]]), sk, { sh: 0.62, split: -6, rim: false, lw: 1.4 });
  // ears
  part(g, smooth([[-37, -6], [-44, 0], [-42, 14], [-35, 16]]), sk, { sh: 0.4 });
  part(g, smooth([[37, -6], [44, 0], [42, 14], [35, 16]]), sk, { sh: 0.6 });
  // skull + jaw (angular, adult)
  const face = smooth([[0, -58], [26, -52], [37, -28], [37, 0], [jw, 26], [16, 44], [0, 48], [-16, 44], [-jw, 26], [-37, 0], [-37, -28], [-26, -52]]);
  part(g, face, sk, { d: 15, sh: 0.46 });
  // hair shadow on forehead (AO)
  g.save(); g.clip(face); g.fillStyle = rgb(dark(sk, 0.55), 0.55); g.beginPath(); g.ellipse(4, -40, 40, 14, 0, 0, 7); g.fill(); g.restore();
  // cheek / under-brow form shadows (adult planes)
  g.fillStyle = rgb(dark(sk, 0.3), 0.55);
  g.fill(smooth([[-30, 4], [-24, 22], [-14, 30], [-22, 8]])); g.fill(smooth([[30, 4], [24, 24], [14, 32], [20, 8]]));
  // beard / stubble
  if (s.back) { g.restore(); g.save(); g.translate(cx, cy); g.scale(hs * (s.fw ?? 1), hs * (s.fl ?? 1)); headBack(g, s); g.restore(); return; }
  if (s.beard) { g.fillStyle = rgb(hex(s.hair), s.beard === "full" ? 0.95 : 0.35); g.fill(smooth([[-34, 2], [-30, 28], [-14, 50], [0, 54], [14, 50], [30, 28], [34, 2], [22, 20], [10, 30], [0, 31], [-10, 30], [-22, 20]])); }
  if (s.moustache) { g.fillStyle = rgb(hex(s.mcol ?? s.hair)); g.fill(smooth([[-15, 23], [-4, 18], [0, 20], [4, 18], [15, 23], [8, 27], [0, 25], [-8, 27]])); }
  // eyes: small, adult
  const T = s.turn ?? -5, ex = 14, ey = -6;
  g.translate(T, 0);
  for (const sx of [-1, 1]) {
    const ew = sx > 0 ? 7 : 8.2;
    if (s.eyes === "closed") { g.strokeStyle = "rgba(10,8,8,0.9)"; g.lineWidth = 2.4; g.beginPath(); g.moveTo(sx * ex - 9, ey); g.quadraticCurveTo(sx * ex - 1, ey + 4, sx * ex + 7, ey); g.stroke();
      g.strokeStyle = rgb(hex(s.brow ?? s.hair)); g.lineWidth = 4; g.lineCap = "round"; g.beginPath(); g.moveTo(sx * 6 - 1, -14 + 2 * sx); g.lineTo(sx * 22 - 1, -14 - 1 * sx); g.stroke();
      if (s.tears) { g.fillStyle = "rgba(200,225,255,0.85)"; g.beginPath(); g.ellipse(sx * ex - 4, ey + 9, 1.6, 3, 0, 0, 7); g.fill(); g.strokeStyle = "rgba(200,225,255,0.5)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(sx * ex - 4, ey + 4); g.lineTo(sx * ex - 6, ey + 28); g.stroke(); }
      continue; }
    g.fillStyle = "#d9d0c2"; g.beginPath(); g.ellipse(sx * ex - 1, ey, ew, 3.6, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgba(40,24,18,0.35)"; g.beginPath(); g.ellipse(sx * ex - 1, ey - 2.2, ew, 2, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = s.eyes === "wide" ? "#1a1310" : "#21170f"; g.beginPath(); g.arc(sx * ex - 2, ey, s.eyes === "wide" ? 2.6 : 3.2, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "rgba(10,8,8,0.9)"; g.lineWidth = 2.4; g.beginPath(); g.ellipse(sx * ex - 1, ey - 0.5, 8.5, 4, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    // brow
    if (s.tears) { g.fillStyle = "rgba(210,230,255,0.9)"; g.beginPath(); g.ellipse(sx * ex - 1, ey + 3.2, ew * 0.8, 1.4, 0, 0, 7); g.fill(); g.fillStyle = "rgba(255,255,255,0.95)"; g.beginPath(); g.arc(sx * ex + 1, ey - 1, 1.1, 0, 7); g.fill(); }
    g.strokeStyle = rgb(hex(s.brow ?? s.hair)); g.lineWidth = 4; g.lineCap = "round"; g.beginPath();
    const tilt = (s.browTilt ?? 0) * sx;
    g.moveTo(sx * 6 - 1, -15 + tilt); g.lineTo(sx * 22 - 1, -17 - tilt); g.stroke();
  }
  if (s.eyes === "bags" || age) { g.strokeStyle = rgb(dark(sk, 0.4), 0.7); g.lineWidth = 1.4; for (const sx of [-1, 1]) { g.beginPath(); g.arc(sx * 14 - 1, -1, 8, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke(); } }
  if (age) { g.strokeStyle = rgb(dark(sk, 0.45), 0.7); g.lineWidth = 1.3; g.beginPath(); g.moveTo(-20, -32); g.lineTo(20, -33); g.moveTo(-17, -27); g.lineTo(17, -28); g.moveTo(-12, 12); g.quadraticCurveTo(-17, 22, -13, 30); g.moveTo(12, 12); g.quadraticCurveTo(17, 22, 13, 30); g.stroke(); }
  // nose (shadow plane + tip)
  g.fillStyle = rgb(dark(sk, 0.42), 0.8); g.fill(P([[2, -6], [6, 10], [3, 15], [-3, 15], [1, 9]]));
  g.strokeStyle = rgb(dark(sk, 0.6), 0.9); g.lineWidth = 1.6; g.beginPath(); g.moveTo(-5, 14); g.quadraticCurveTo(0, 18, 5, 14); g.stroke();
  // mouth
  const m = s.mouth ?? 0;
  if (s.open) { g.fillStyle = "#1a0c0a"; g.beginPath(); g.ellipse(0, 31, 8 + s.open * 2, 4 + s.open * 4, 0, 0, 7); g.fill(); g.fillStyle = "rgba(230,225,215,0.8)"; g.fillRect(-6, 27 - s.open * 3, 12, 2.4); }
  g.fillStyle = rgb(mix(hex(sk), [90, 40, 36], 0.35)); g.beginPath(); g.moveTo(-10, 30); g.quadraticCurveTo(0, 37 - m * 2, 10, 30); g.quadraticCurveTo(0, 33, -10, 30); g.fill();
  g.strokeStyle = "rgba(40,18,16,0.9)"; g.lineWidth = 2.2; g.beginPath(); g.moveTo(-10, 30); g.quadraticCurveTo(0, 30 - m * 3, 10 + (s.smirk ? 2 : 0), 30 - (s.smirk ? 4 : 0)); g.stroke();
  g.strokeStyle = rgb(dark(sk, 0.4), 0.7); g.lineWidth = 1.3; g.beginPath(); g.moveTo(-4, 39); g.quadraticCurveTo(0, 41, 4, 39); g.stroke();
  // glasses
  if (s.glasses) { g.strokeStyle = "rgba(20,20,24,0.95)"; g.lineWidth = 2.2; for (const sx of [-1, 1]) g.strokeRect(sx * 14 - 10, -13, 20, 13); g.beginPath(); g.moveTo(-4, -8); g.lineTo(4, -8); g.stroke();
    g.fillStyle = "rgba(170,200,230,0.18)"; for (const sx of [-1, 1]) g.fillRect(sx * 14 - 10, -13, 20, 13); }
  g.translate(-T, 0);
  // hair
  hair(g, s);
  // hair strands (lit side)
  if (s.hairStyle && s.hairStyle !== 'receding') { g.strokeStyle = rgb(warm(s.hair, 0.35), 0.55); g.lineWidth = 1.6; g.lineCap = 'round'; for (const [a, b2, c2, d2] of [[-30, -40, -12, -60], [-22, -36, -2, -58], [-12, -40, 10, -60], [-34, -26, -26, -50]]) { g.beginPath(); g.moveTo(a, b2); g.quadraticCurveTo((a + c2) / 2 - 4, (b2 + d2) / 2 - 6, c2, d2); g.stroke(); } }
  // headwear
  if (s.beret !== false && !s.cap) {
    const bc = s.beretCol ?? "#6b6446";
    part(g, smooth([[-40, -30], [-42, -52], [-26, -70], [6, -78], [40, -72], [58, -56], [54, -40], [38, -34], [0, -36]]), bc, { d: 12, sh: 0.5, lw: 1.8 });
    part(g, P([[-41, -30], [40, -33], [40, -26], [-41, -23]]), "#3e3a2a", { d: 4, rim: false, lw: 1.2 });
    g.fillStyle = "#c4a85a"; g.beginPath(); g.moveTo(-22, -54); g.lineTo(-14, -46); g.lineTo(-22, -36); g.lineTo(-30, -46); g.closePath(); g.fill(); g.strokeStyle = "#5e4c20"; g.lineWidth = 1.2; g.stroke();
  }
  if (s.cap === "peaked") { const cc = s.capCol ?? "#4e4b36";
    part(g, smooth([[-44, -34], [-48, -58], [-30, -80], [0, -86], [34, -80], [50, -60], [46, -34], [0, -40]]), cc, { d: 12, sh: 0.5, lw: 1.8 });
    part(g, P([[-44, -36], [44, -36], [44, -24], [-44, -24]]), "#2e2c22", { rim: false, d: 4, lw: 1.2 });
    part(g, smooth([[-46, -26], [0, -30], [46, -26], [40, -14], [0, -12], [-40, -14]]), "#141412", { rim: false, d: 4, lw: 1.2 }); // visor
    g.strokeStyle = "#c8a85a"; g.lineWidth = 2; g.beginPath(); g.moveTo(-40, -27); g.lineTo(40, -27); g.stroke();
    g.fillStyle = "#c4a85a"; g.beginPath(); g.arc(0, -54, 9, 0, 7); g.fill(); g.strokeStyle = "#5e4c20"; g.lineWidth = 1.4; g.stroke(); g.fillStyle = "#5e4c20"; g.fillRect(-1.2, -60, 2.4, 12); }
  if (s.cap === "wool") { part(g, smooth([[-39, -24], [-36, -56], [-18, -70], [0, -73], [18, -70], [36, -56], [39, -24], [0, -30]]), s.capCol, { split: 8, sh: 0.5 }); g.strokeStyle = rgb(dark(s.capCol, 0.2)); g.lineWidth = 1.5; for (let i = -30; i <= 30; i += 8) { g.beginPath(); g.moveTo(i, -64 + Math.abs(i) * 0.3); g.lineTo(i * 1.05, -30); g.stroke(); } }
  if (s.earbuds) { g.fillStyle = "#e8e8ea"; g.beginPath(); g.arc(-41, 8, 3.2, 0, 7); g.arc(41, 8, 3.2, 0, 7); g.fill(); }
  g.restore();
}
function hair(g, s) {
  const c = s.hair; const _part = part; part = (g2, p2, b2, o2 = {}) => _part(g2, p2, b2, { ...o2, rim: false, d: 10, wk: 0.03, sh: 0.25 });
  if (s.hairStyle === "short") part(g, smooth([[-38, 2], [-41, -40], [-26, -64], [0, -70], [26, -65], [41, -40], [38, 2], [34, -24], [20, -38], [2, -42], [-18, -38], [-34, -24]]), c, { split: 18, sh: 0.4, lw: 1.6 });
  if (s.hairStyle === "messy") part(g, smooth([[-39, 4], [-45, -40], [-34, -66], [-8, -78], [16, -76], [36, -64], [46, -40], [39, 4], [35, -22], [26, -34], [18, -28], [8, -40], [-6, -32], [-18, -40], [-30, -28]]), c, { split: 18, sh: 0.4, lw: 1.6 });
  if (s.hairStyle === "fade") { part(g, smooth([[-38, -6], [-39, -46], [-22, -68], [4, -76], [28, -68], [40, -46], [38, -6], [33, -34], [14, -42], [-8, -40], [-30, -34]]), c, { split: 18, sh: 0.35, lw: 1.6 }); }
  if (s.hairStyle === "spiky") part(g, P([[-38, -18], [-40, -46], [-30, -60], [-26, -80], [-14, -66], [-6, -86], [4, -68], [16, -84], [20, -64], [34, -72], [38, -46], [38, -18], [28, -40], [0, -46], [-26, -40]]), c, { split: 10, sh: 0.35, lw: 1.6 });
  if (s.hairStyle === "receding") { part(g, smooth([[-38, -10], [-40, -36], [-32, -50], [-26, -38], [-30, -14]]), c, { rim: false, lw: 1.2 }); part(g, smooth([[38, -10], [40, -36], [32, -50], [26, -38], [30, -14]]), c, { rim: false, lw: 1.2 }); }
  if (s.hairStyle === "braids") { part(g, smooth([[-39, 6], [-44, -40], [-26, -66], [0, -72], [26, -66], [44, -40], [39, 6], [34, -26], [14, -40], [0, -44], [-14, -40], [-34, -26]]), c, { split: 18, sh: 0.4, lw: 1.6 });
    for (const sx of [-1, 1]) { part(g, smooth([[sx * 36, 0], [sx * 46, 10], [sx * 44, 70], [sx * 38, 96], [sx * 30, 70], [sx * 32, 10]]), c, { sh: 0.45, lw: 1.4 }); g.fillStyle = "#b3262c"; g.beginPath(); g.ellipse(sx * 38, 98, 9, 6, 0, 0, 7); g.fill(); } }
  if (s.hairStyle === "side") part(g, smooth([[-38, 0], [-42, -44], [-22, -68], [8, -74], [32, -64], [42, -40], [38, 0], [33, -28], [10, -42], [-14, -46], [-32, -26]]), c, { split: 18, sh: 0.4, lw: 1.6 });
  part = _part;
}

function headBack(g, s) {
  const sk = s.skin; part(g, P([[-16, 36], [16, 36], [18, 78], [-18, 78]]), sk, { sh: 0.62, rim: false, lw: 1.4 });
  part(g, smooth([[-37, -6], [-44, 0], [-42, 14], [-35, 16]]), sk, { sh: 0.4 }); part(g, smooth([[37, -6], [44, 0], [42, 14], [35, 16]]), sk, { sh: 0.6 });
  const skull = smooth([[0, -60], [28, -52], [39, -26], [37, 6], [28, 30], [0, 40], [-28, 30], [-37, 6], [-39, -26], [-28, -52]]);
  if (s.hairStyle === "receding") { part(g, skull, sk, { d: 14, sh: 0.5 }); g.fillStyle = rgb(hex(s.hair), 0.9); g.fill(smooth([[-38, -10], [-30, 26], [0, 38], [30, 26], [38, -10], [20, 8], [0, 14], [-20, 8]])); }
  else { part(g, skull, s.hair, { d: 12, sh: 0.4, wk: 0.03, rim: false });
    g.strokeStyle = rgb(warm(s.hair, 0.3), 0.45); g.lineWidth = 1.5; for (let k = -24; k <= 24; k += 8) { g.beginPath(); g.moveTo(k * 0.4, -50); g.quadraticCurveTo(k, -10, k * 0.9, 28); g.stroke(); } }
  if (s.hairStyle === "braids") for (const sx of [-1, 1]) { part(g, smooth([[sx * 14, 20], [sx * 26, 24], [sx * 24, 96], [sx * 18, 116], [sx * 10, 96], [sx * 10, 24]]), s.hair, { sh: 0.45, lw: 1.4 }); g.fillStyle = "#b3262c"; g.beginPath(); g.ellipse(sx * 18, 118, 9, 6, 0, 0, 7); g.fill(); }
  if (s.beret !== false && !s.cap) { const bc = s.beretCol ?? "#6b6446"; part(g, smooth([[-40, -30], [-42, -52], [-26, -70], [6, -78], [40, -72], [56, -56], [52, -40], [38, -34], [0, -36]]), bc, { d: 12, sh: 0.5, lw: 1.8 }); part(g, P([[-41, -30], [40, -33], [40, -26], [-41, -23]]), "#3e3a2a", { d: 4, rim: false, lw: 1.2 }); }
  if (s.cap === "peaked") { const cc = s.capCol ?? "#4e4b36"; part(g, smooth([[-44, -34], [-48, -58], [-30, -80], [0, -86], [34, -80], [50, -60], [46, -34], [0, -40]]), cc, { d: 12, sh: 0.5, lw: 1.8 }); part(g, P([[-44, -36], [44, -36], [44, -24], [-44, -24]]), "#2e2c22", { rim: false, d: 4, lw: 1.2 }); }
  if (s.cap === "wool") part(g, smooth([[-39, -24], [-36, -56], [-18, -70], [0, -73], [18, -70], [36, -56], [39, -24], [0, -30]]), s.capCol, { split: 8, sh: 0.5 });
}
// tapered sleeve: shoulder (deltoid) -> elbow -> wrist, side = -1 front/left, 1 back/right
function arm(a, side) {
  const [sx, sy] = a[0], [ex, ey] = a[1], [wx, wy] = a[2];
  return smooth([[sx - 22 * side, sy - 6], [sx + 20 * side, sy + 14], [ex + 17 * side, ey], [wx + 13 * side, wy], [wx - 13 * side, wy], [ex - 19 * side, ey - 4], [sx - 30 * side, sy + 34]]);
}
function hand([x, y], side) { return smooth([[x - 15, y - 4], [x + 15, y - 4], [x + 17, y + 18], [x + 8 * side, y + 36], [x - 10, y + 34], [x - 17, y + 16]]); }
// ---------- body ----------
// local units: head height = 100 (crown -750 .. chin -650), feet at 0; spec.h scales the whole figure
function figure(g, s, x, groundY, H) {
  g.save(); g.translate(x, groundY); const k = (H / 750) * (s.h ?? 1); g.scale(k, k);
  const sw = s.sw ?? 95, ww = s.ww ?? sw * 0.7, hunch = s.hunch ?? 0;
  // ground shadow
  g.fillStyle = "rgba(0,0,0,0.55)"; g.beginPath(); g.ellipse(10, 0, 120, 16, 0, 0, Math.PI * 2); g.fill();
  const tr = s.trouser, sh = s.shirt;
  // legs
  part(g, smooth([[-ww + 2, -334], [-4, -334], [-10, -250], [-14, -180], [-18, -30], [-56, -30], [-58, -180], [-ww - 2, -260]]), tr, { d: 12, sh: 0.45 });
  part(g, smooth([[4, -334], [ww - 2, -334], [ww + 2, -260], [56, -180], [56, -30], [14, -30], [10, -180], [8, -250]]), tr, { d: 26, sh: 0.62 });
  g.strokeStyle = rgb(dark(tr, 0.6), 0.6); g.lineWidth = 2; g.beginPath(); g.moveTo(-40, -200); g.quadraticCurveTo(-34, -186, -26, -182); g.moveTo(34, -200); g.quadraticCurveTo(38, -186, 30, -180); g.stroke();
  // boots
  const bt = s.boot ?? "#1f1a16";
  part(g, smooth([[-60, -118], [-16, -118], [-14, -40], [-8, -6], [-72, 0], [-70, -20], [-62, -40]]), bt, { d: 8, sh: 0.4 });
  part(g, smooth([[16, -118], [58, -118], [60, -40], [70, -14], [68, 0], [8, -6], [14, -40]]), bt, { d: 14, sh: 0.6 });
  g.strokeStyle = "rgba(160,150,130,0.35)"; g.lineWidth = 1.4; for (const bx of [-38, 37]) for (let yy = -110; yy < -50; yy += 12) { g.beginPath(); g.moveTo(bx - 7, yy); g.lineTo(bx + 7, yy + 5); g.stroke(); }
  // back arm (right side = shadow)
  const bArm = s.backArm ?? [[sw - 12, -600], [sw + 10, -470], [sw + 6, -330]];
  part(g, arm(bArm, 1), s.sleeve ?? sh, { d: 30, sh: 0.62 });
  part(g, hand(bArm[2], 1), s.skin, { d: 10, sh: 0.6 });
  // torso
  const torso = smooth([[-24, -634], [-sw + 18, -622 + hunch], [-sw, -596 + hunch], [-sw + 4, -540], [-ww - 8, -450], [-ww - 2, -372], [-ww, -318], [0, -314], [ww, -318], [ww + 2, -372], [ww + 8, -450], [sw - 4, -540], [sw, -596 + hunch], [sw - 18, -622 + hunch], [24, -634]]);
  part(g, torso, sh, { d: 40, sh: 0.55 });
  // fabric folds
  g.strokeStyle = rgb(dark(sh, 0.55), 0.55); g.lineWidth = 2; g.beginPath(); g.moveTo(-ww + 6, -420); g.quadraticCurveTo(-ww * 0.4, -400, -ww * 0.2, -368); g.moveTo(ww - 6, -430); g.quadraticCurveTo(ww * 0.4, -405, ww * 0.25, -372); g.stroke();
  // shirt details: placket, pockets, belt
  if (!s.back) { g.strokeStyle = rgb(dark(sh, 0.5), 0.9); g.lineWidth = 2; g.beginPath(); g.moveTo(0, -622); g.lineTo(0, -330); g.stroke(); }
  if (s.pockets !== false && !s.back && !s.civil) {
    for (const px of [-sw * 0.62, sw * 0.2]) { const pw = sw * 0.42;
      g.strokeStyle = rgb(dark(sh, 0.55), 0.95); g.lineWidth = 2; g.strokeRect(px, -556, pw, 58);
      part(g, P([[px - 2, -560], [px + pw + 2, -560], [px + pw + 2, -540], [px + pw / 2, -534], [px - 2, -540]]), sh, { d: 4, sh: 0.5, lw: 1.6, rim: false });
      g.fillStyle = "#5b5236"; g.beginPath(); g.arc(px + pw / 2, -540, 3, 0, 7); g.fill(); }
    g.fillStyle = "#5b5236"; for (let by = -600; by > -360; by -= 46) { g.beginPath(); g.arc(4, by, 3, 0, 7); g.fill(); }
    // black nameplate, white letters, above the wearer's right pocket (viewer's left)
    const tg = s.tag ?? s.id.toUpperCase(); g.font = "bold 9px InterB"; const tw = g.measureText(tg).width + 10; g.fillStyle = "#121214"; g.fillRect(-sw * 0.42 - tw / 2 + 10, -578, tw, 13); g.fillStyle = "#e9e6dc"; g.textAlign = "center"; g.fillText(tg, -sw * 0.42 + 10, -568.5);
  }
  // khaki web belt, brass plate with monogram
  if (s.kurta) part(g, smooth([[-ww - 6, -380], [ww + 6, -380], [ww + 22, -210], [0, -200], [-ww - 22, -210]]), sh, { d: 30, sh: 0.5 });
  if (s.skirt) part(g, smooth([[-ww - 4, -390], [ww + 4, -390], [ww + 34, -236], [0, -228], [-ww - 34, -236]]), s.skirt, { d: 24, sh: 0.5 });
  if (!s.civil) { part(g, P([[-ww - 2, -354], [ww + 2, -354], [ww + 2, -332], [-ww - 2, -332]]), "#5d5640", { rim: false, d: 10 });
  if (!s.back) { g.fillStyle = "#b39a52"; g.fillRect(-13, -356, 26, 26); g.strokeStyle = "#5e4c20"; g.lineWidth = 1.5; g.strokeRect(-13, -356, 26, 26); g.fillStyle = "#5e4c20"; g.font = "bold 9px InterB"; g.textAlign = "center"; g.fillText("NF", 0, -339); } }
  // whistle lanyard: wearer's left shoulder (viewer's right) to the left breast pocket
  if (!s.civil && !s.back) { g.strokeStyle = "#8c8160"; g.lineWidth = 3; g.beginPath(); g.moveTo(sw - 18, -616 + hunch); g.bezierCurveTo(sw - 4, -560, sw * 0.62, -520, sw * 0.42, -548); g.stroke();
  g.strokeStyle = "rgba(40,36,24,0.6)"; g.lineWidth = 1; g.stroke(); }
  // uniform: epaulettes with khaki slip-ons, white embroidered "N F" (fictional Neelkanth Forest)
  if (!s.civil) for (const sx of [-1, 1]) {
    part(g, P([[sx * (sw - 8), -618 + hunch], [sx * 36, -632], [sx * 34, -618], [sx * (sw - 12), -602 + hunch]]), sh, { d: sx < 0 ? 4 : 8, sh: sx < 0 ? 0.4 : 0.6, lw: 1.3, rim: false });
    if (!s.back) { g.save(); g.translate(sx * (sw * 0.5 + 18), -616 + hunch * 0.5); g.rotate(sx * 0.12); g.fillStyle = "rgba(240,236,224,0.85)"; g.font = "bold 10px InterB"; g.textAlign = "center"; g.fillText("N F", 0, 4); g.restore(); }
  }
  // collar
  if (!s.back) part(g, P([[-26, -632], [0, -598], [-8, -586], [-40, -618]]), sh, { sh: 0.3 }); part(g, P([[26, -632], [0, -598], [8, -586], [40, -618]]), sh, { sh: 0.6 });
  // jacket / shawl / hoodie overlays
  if (s.jacket) { const j = s.jacket;
    part(g, smooth([[-30, -634], [-sw + 10, -624 + hunch], [-sw - 4, -590 + hunch], [-sw + 2, -520], [-ww - 12, -420], [-ww - 10, -300], [-24, -296], [-18, -440], [-12, -560]]), j, { d: 16, sh: 0.45 });
    part(g, smooth([[30, -634], [sw - 10, -624 + hunch], [sw + 4, -590 + hunch], [sw - 2, -520], [ww + 12, -420], [ww + 10, -300], [24, -296], [18, -440], [12, -560]]), j, { d: 30, sh: 0.62 }); }
  if (s.hood) { part(g, smooth([[-44, -640], [-70, -604], [-40, -590], [0, -600], [40, -590], [70, -604], [44, -640], [0, -620]]), s.hood, { sh: 0.5 }); }
  if (s.shawl) part(g, smooth([[-sw - 8, -618 + hunch], [-30, -646], [30, -646], [sw + 8, -618 + hunch], [sw - 10, -520], [0, -470], [-sw + 10, -520]]), s.shawl, { split: 8, sh: 0.5 });
  if (s.gamosa) { const gw = "#ece5d5";
    part(g, smooth([[-34, -642], [34, -642], [40, -606], [0, -596], [-40, -606]]), gw, { sh: 0.45 });
    part(g, P([[-40, -610], [-22, -604], [-26, -470], [-46, -474]]), gw, { sh: 0.35 }); part(g, P([[22, -604], [40, -610], [46, -474], [26, -470]]), gw, { sh: 0.55 });
    g.fillStyle = "#b3262c"; g.fillRect(-46, -492, 21, 7); g.fillRect(25, -492, 21, 7); g.fillRect(-46, -503, 21, 3); g.fillRect(25, -503, 21, 3); }
  if (s.muffler) part(g, smooth([[-34, -642], [34, -642], [38, -606], [0, -596], [-38, -606]]), s.muffler, { sh: 0.5 });
  // armband VAN RAKSHAK (left arm, front)
  // front arm
  const fArm = s.frontArm ?? [[-sw + 12, -600], [-sw - 14, -470], [-sw - 6, -330]];
  if (s.handOver) { head(g, s, s.hx ?? 0, -700 + hunch * 0.9, s.child ? 1.3 : 1); }
  part(g, arm(fArm, -1), s.sleeve ?? s.jacket ?? sh, { d: 14, sh: 0.45 });
  if (s.armband === true) { const a = fArm[0], b = fArm[1], t = 0.38, ax = a[0] + (b[0] - a[0]) * t, ay = a[1] + (b[1] - a[1]) * t;
    g.save(); g.translate(ax, ay); g.rotate(Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.PI / 2); g.fillStyle = "#7d1d1f"; g.fillRect(-19, -11, 38, 22); g.strokeStyle = "rgba(0,0,0,.6)"; g.strokeRect(-19, -11, 38, 22); g.restore(); }
  const hx = fArm[2][0], hy = fArm[2][1];
  part(g, hand(fArm[2], -1), s.skin, { d: 6, sh: 0.45 });
  // head
  if (!s.handOver) head(g, s, s.hx ?? 0, -700 + hunch * 0.9, s.child ? 1.3 : 1);
  // props
  if (s.prop) s.prop(g, hx, hy, s);
  g.restore();
}

// ---------- props ----------
const torch = (g, hx, hy) => { g.save(); g.translate(hx + 2, hy + 14); g.rotate(-0.5); part(g, P([[-7, -6], [7, -6], [9, 70], [-9, 70]]), "#2a2a2e", { rim: false }); g.fillStyle = "#d7d2c4"; g.fillRect(-10, 64, 20, 10);
  const gr = g.createRadialGradient(0, 80, 2, 0, 200, 220); gr.addColorStop(0, "rgba(255,236,190,0.55)"); gr.addColorStop(1, "rgba(255,236,190,0)"); g.fillStyle = gr; g.beginPath(); g.moveTo(-10, 74); g.lineTo(-90, 330); g.lineTo(90, 330); g.lineTo(10, 74); g.fill(); g.restore(); };
let NOGLOW = false;
const lantern = (g, hx, hy) => { g.save(); g.translate(hx, hy + 24);
  g.strokeStyle = "#2a2622"; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 20); g.stroke();
  if (!NOGLOW) { const gl = g.createRadialGradient(0, 52, 4, 0, 52, 160); gl.addColorStop(0, "rgba(255,190,90,0.75)"); gl.addColorStop(0.35, "rgba(255,150,60,0.22)"); gl.addColorStop(1, "rgba(255,140,50,0)"); g.fillStyle = gl; g.beginPath(); g.arc(0, 52, 160, 0, 7); g.fill(); }
  part(g, P([[-18, 20], [18, 20], [22, 30], [-22, 30]]), "#3a3128", { rim: false }); g.fillStyle = "#ffd28a"; g.fillRect(-15, 30, 30, 40); g.fillStyle = "#fff3d6"; g.beginPath(); g.ellipse(0, 52, 5, 10, 0, 0, 7); g.fill();
  g.strokeStyle = "#2a2622"; g.lineWidth = 2.5; g.strokeRect(-15, 30, 30, 40); g.fillStyle = "#3a3128"; g.fillRect(-20, 70, 40, 7); g.restore(); };
const phone = (g, hx, hy) => { g.save(); g.translate(hx + 8, hy - 6); g.rotate(-0.25); g.fillStyle = "#121216"; g.fillRect(-12, -24, 24, 44); const gl = g.createRadialGradient(0, -2, 2, 0, -2, 120); gl.addColorStop(0, "rgba(140,190,255,0.5)"); gl.addColorStop(1, "rgba(140,190,255,0)"); g.fillStyle = gl; g.beginPath(); g.arc(0, -2, 120, 0, 7); g.fill(); g.fillStyle = "#9cc4ff"; g.fillRect(-10, -21, 20, 38); g.restore(); };
const photo = (g, hx, hy) => { g.save(); g.translate(hx + 6, hy + 2); g.rotate(-0.2); g.fillStyle = "#e8e2d6"; g.fillRect(-16, -20, 32, 40); g.fillStyle = "#6b5b49"; g.fillRect(-12, -16, 24, 26); g.fillStyle = "#c8a585"; g.beginPath(); g.arc(0, -6, 6, 0, 7); g.fill(); g.restore(); };
const bottle = (g, hx, hy) => { g.save(); g.translate(hx, hy + 20); part(g, P([[-11, 0], [11, 0], [13, 70], [-13, 70]]), "#4f5d4a", { rim: false }); g.fillStyle = "#2a2a2a"; g.fillRect(-7, -10, 14, 12); g.restore(); };
const strap = (g, hx, hy) => {};
const lathi = (g, hx, hy) => { g.save(); g.translate(hx, hy + 14); g.rotate(0.12); part(g, P([[-5, -60], [5, -60], [6, 330], [-6, 330]]), "#4a3524", { d: 4, rim: false, lw: 1.4 }); g.fillStyle = "#1b1612"; g.fillRect(-6, -6, 12, 26); g.restore(); };

// ---------- cast ----------
const KH = "#77704f", KHT = "#6a6347", KHOLD = "#857f63", KHOLD2 = "#77715a";
const cast = [
  { id: "arjun", fw: 1.0, fl: 1.02, name: "ARJUN, 24", line: "Narrator, SSC fail", skin: "#a8765a", hair: "#16110e", hairStyle: "messy", beard: "stubble", sw: 92, shirt: KH, trouser: KHT, prop: torch, h: 1 },
  { id: "bhola", tag: "B. RAM", fw: 0.94, fl: 1.06, name: "BHOLA KAKA, 60", line: "Guide, 1998 ka survivor", skin: "#8e6248", hair: "#c9c3b8", hairStyle: "receding", moustache: true, mcol: "#d8d2c6", brow: "#bdb6aa", age: 1, sw: 86, hunch: 22, shirt: KHOLD, trouser: KHOLD2, beretCol: "#5f5a44", prop: lantern, h: 0.93,
    frontArm: [[-74, -598], [-112, -470], [-70, -380]] },
  { id: "sameer", fw: 1.06, fl: 1.0, jaw: 34, name: "SAMEER", line: "Skeptic, sab pe hasta hai", skin: "#b58466", hair: "#120d0a", hairStyle: "fade", beard: "full", sw: 106, ww: 74, shirt: KH, trouser: KHT, smirk: 1, browTilt: 2, h: 1.06,
    frontArm: [[-94, -600], [-112, -470], [-80, -360]], prop: lathi },
  { id: "rinku", fw: 0.92, fl: 1.04, jaw: 26, name: "RINKU", line: "Phone addict", skin: "#b07a5c", hair: "#1c1410", hairStyle: "spiky", earbuds: 1, sw: 80, shirt: KH, trouser: KHT, prop: phone, h: 0.97, beret: false,
    frontArm: [[-68, -600], [-96, -480], [-30, -470]] },
  { id: "mohan", fw: 1.1, fl: 0.96, name: "MOHAN", line: "Sabki madad karta hai", skin: "#94664a", hair: "#15100d", hairStyle: "side", moustache: true, sw: 104, ww: 90, shirt: KH, trouser: KHT, mouth: 1, prop: bottle, h: 0.98 },
  { id: "dev", fw: 0.95, fl: 1.05, name: "DEV", line: "Pehle din se dara hua", skin: "#b88a6b", hair: "#1a1310", hairStyle: "short", glasses: 1, eyes: "wide", browTilt: -3, sw: 80, hunch: 14, shirt: KH, trouser: KHT, mouth: -1, h: 0.99,
    frontArm: [[-68, -596], [-60, -480], [-10, -520]] },
  { id: "kishan", fw: 1.08, fl: 0.98, name: "KISHAN, 40", line: "Chup-chaap, ek beti", skin: "#6e4a36", hair: "#100c0a", hairStyle: "short", beard: "full", eyes: "bags", sw: 100, shirt: KH, trouser: KHT, prop: photo, h: 1.0,
    frontArm: [[-88, -600], [-110, -480], [-40, -440]] },
];

// ---------- entity: the Lantern Walker ----------
function walker(g, x, groundY, H) {
  g.save(); g.translate(x, groundY); const k = H / 1000; g.scale(k, k);
  const glow = g.createRadialGradient(0, -560, 20, 0, -560, 520); glow.addColorStop(0, "rgba(200,220,235,0.16)"); glow.addColorStop(1, "rgba(200,220,235,0)"); g.fillStyle = glow; g.fillRect(-600, -1100, 1200, 1100);
  const robe = P([[0, -930], [46, -900], [64, -780], [84, -520], [104, -200], [120, -20], [96, 6], [76, -26], [52, 10], [26, -22], [0, 8], [-26, -20], [-54, 10], [-80, -24], [-104, 4], [-122, -20], [-104, -200], [-84, -520], [-64, -780], [-46, -900]]);
  const gr = g.createLinearGradient(-120, 0, 120, 0); gr.addColorStop(0, "#d7dde0"); gr.addColorStop(0.55, "#aeb7bf"); gr.addColorStop(1, "#5e6a76");
  g.fillStyle = gr; g.fill(robe);
  g.save(); g.clip(robe); g.strokeStyle = "rgba(60,70,80,0.35)"; g.lineWidth = 3; for (let i = -100; i <= 100; i += 26) { g.beginPath(); g.moveTo(i * 0.3, -760); g.quadraticCurveTo(i * 0.9, -380, i * 1.4, 0); g.stroke(); } g.restore();
  // head: a wet white shroud pulled tight over a face; you see the shape of a face, never the face
  g.fillStyle = "rgba(14,18,26,0.9)"; g.beginPath(); g.ellipse(0, -845, 58, 84, 0, 0, 7); g.fill();
  const sg = g.createLinearGradient(-36, -900, 40, -780); sg.addColorStop(0, "#f1f3f3"); sg.addColorStop(0.6, "#c4ccd2"); sg.addColorStop(1, "#7d8892");
  g.fillStyle = sg; g.beginPath(); g.moveTo(0, -905); g.bezierCurveTo(40, -905, 42, -820, 30, -780); g.lineTo(18, -760); g.lineTo(-18, -760); g.lineTo(-30, -780); g.bezierCurveTo(-42, -820, -40, -905, 0, -905); g.fill();
  g.strokeStyle = "rgba(70,80,92,0.45)"; g.lineWidth = 2;
  for (const [a, b2] of [[-22, -850], [22, -850], [-8, -830], [10, -828], [0, -808]]) { g.beginPath(); g.moveTo(a * 0.4, -900); g.quadraticCurveTo(a, b2, a * 1.3, -762); g.stroke(); }
  g.fillStyle = "rgba(60,70,82,0.28)"; g.beginPath(); g.ellipse(-12, -848, 9, 6, 0, 0, 7); g.ellipse(12, -848, 9, 6, 0, 0, 7); g.ellipse(0, -812, 7, 4, 0, 0, 7); g.fill();
  g.save(); g.translate(0, -840); g.rotate(0.12); g.restore();
  // long arm to lantern
  g.strokeStyle = "#c9d0d4"; g.lineWidth = 16; g.lineCap = "round"; g.beginPath(); g.moveTo(-70, -740); g.quadraticCurveTo(-150, -560, -140, -420); g.stroke();
  g.lineWidth = 4; g.beginPath(); for (const d of [-9, -4, 1, 6, 10]) { g.moveTo(-140, -420); g.quadraticCurveTo(-140 + d * 1.6, -392, -140 + d * 2.4, -350); } g.stroke();
  g.scale(1.5, 1.5); lantern(g, -94, -270); g.restore();
  // fog on its hem
  g.save(); g.translate(x, groundY - 30); g.scale(1, 0.28); const fog = g.createRadialGradient(0, 0, 10, 0, 0, 300); fog.addColorStop(0, "rgba(150,165,180,0.5)"); fog.addColorStop(1, "rgba(150,165,180,0)"); g.fillStyle = fog; g.beginPath(); g.arc(0, 0, 300, 0, 7); g.fill(); g.restore();
}

// ---------- scene ----------
function jungle(g, W, Hh) {
  const sky = g.createLinearGradient(0, 0, 0, Hh); sky.addColorStop(0, "#0b1120"); sky.addColorStop(0.6, "#121b28"); sky.addColorStop(1, "#070a10");
  g.fillStyle = sky; g.fillRect(0, 0, W, Hh);
  const moon = g.createRadialGradient(W * 0.82, Hh * 0.14, 10, W * 0.82, Hh * 0.14, 260); moon.addColorStop(0, "rgba(210,225,240,0.35)"); moon.addColorStop(1, "rgba(210,225,240,0)"); g.fillStyle = moon; g.fillRect(0, 0, W, Hh);
  let seed = 7; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (const [col, y0, n, w0] of [["#0e1622", 0.38, 26, 40], ["#0a111b", 0.3, 18, 70], ["#06090f", 0.22, 12, 110]]) {
    g.fillStyle = col;
    for (let i = 0; i < n; i++) { const x = r() * W, w = w0 * (0.6 + r()); g.fillRect(x - w / 2, Hh * y0 * r(), w, Hh); g.beginPath(); g.ellipse(x, Hh * (y0 * r()), w * 2.4, w * 1.4, 0, 0, 7); g.fill(); }
  }
  const gnd = g.createLinearGradient(0, Hh * 0.78, 0, Hh); gnd.addColorStop(0, "#0d1218"); gnd.addColorStop(1, "#050608"); g.fillStyle = gnd; g.fillRect(0, Hh * 0.8, W, Hh * 0.2);
  const fog = g.createLinearGradient(0, Hh * 0.62, 0, Hh * 0.86); fog.addColorStop(0, "rgba(120,140,160,0)"); fog.addColorStop(1, "rgba(120,140,160,0.18)"); g.fillStyle = fog; g.fillRect(0, Hh * 0.62, W, Hh * 0.24);
}
function grade(g, W, Hh) {
  const v = g.createRadialGradient(W / 2, Hh * 0.5, Hh * 0.35, W / 2, Hh * 0.5, W * 0.75); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.65)"); g.fillStyle = v; g.fillRect(0, 0, W, Hh);
  const img = g.getImageData(0, 0, W, Hh), d = img.data; let s = 99;
  for (let i = 0; i < d.length; i += 4) { s = (s * 1103515245 + 12345) & 0x7fffffff; const n = ((s >> 16) / 32768 - 0.5) * 16; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(img, 0, 0);
}
function label(g, x, y, a, b) {
  g.textAlign = "center"; g.fillStyle = "#c8372d"; g.fillRect(x - 18, y - 30, 36, 2);
  g.fillStyle = "#f4f1ea"; g.font = "22px InterB"; g.fillText(a, x, y); g.fillStyle = "rgba(244,241,234,0.62)"; g.font = "16px Inter"; g.fillText(b, x, y + 24);
}

// Sheet 1: lineup (16:9)
{
  const W = 1920, Hh = 1080, c = createCanvas(W, Hh), g = c.getContext("2d");
  jungle(g, W, Hh);
  const gy = 900, step = 205, x0 = 150;
  cast.forEach((s, i) => figure(g, s, x0 + i * step, gy, 690));
  walker(g, 1720, gy + 10, 880);
  grade(g, W, Hh);
  cast.forEach((s, i) => label(g, x0 + i * step, 975, s.name, s.line));
  label(g, 1720, 975, "LANTERN WALKER", "Har raat 2:40 par julus");
  g.textAlign = "left"; g.fillStyle = "#c8372d"; g.font = "18px Mono"; g.fillText("CHARACTER SHEET · v3 · UNIFORM", 60, 64);
  g.fillStyle = "#f4f1ea"; g.font = "34px InterB"; g.fillText("JUNGLE KI NIGHT DUTY", 60, 104);
  fs.writeFileSync("tools/chars/out/lineup_v3.jpg", c.toBuffer("image/jpeg", 90));
}
// Sheet 2: faces
{
  const W = 1920, Hh = 1080, c = createCanvas(W, Hh), g = c.getContext("2d");
  g.fillStyle = "#0b0f16"; g.fillRect(0, 0, W, Hh);
  cast.forEach((s, i) => {
    const col = i % 4, row = Math.floor(i / 4), x = 260 + col * 460, y = 330 + row * 470;
    const bg = g.createRadialGradient(x - 60, y - 40, 20, x, y, 260); bg.addColorStop(0, "#1d2533"); bg.addColorStop(1, "#0b0f16"); g.fillStyle = bg; g.fillRect(x - 220, y - 250, 440, 420);
    g.save(); g.beginPath(); g.rect(x - 220, y - 250, 440, 420); g.clip();
    figure(g, s, x, y - 30 + 700 * 2.6, (2.6 * 750) / (s.h ?? 1)); g.restore();
    label(g, x, y + 215, s.name, s.line);
  });
  { const x = 260 + 3 * 460, y = 330 + 470; g.save(); g.beginPath(); g.rect(x - 220, y - 250, 440, 420); g.clip(); g.fillStyle = "#0e131b"; g.fillRect(x - 220, y - 250, 440, 420); walker(g, x + 60, y - 40 + 850 * 1.9, 1900); g.restore(); label(g, x, y + 215, "LANTERN WALKER", "Chehra nahi, sirf laaltein"); }
  grade(g, W, Hh);
  fs.writeFileSync("tools/chars/out/faces_v3.jpg", c.toBuffer("image/jpeg", 90));
}
console.log("done");


// ================= LANTERN WALKER v3 =================
// Read: a tall starved figure, hunched so its head hangs FORWARD at shoulder height, peering down at you; side-on,
// facing left. Knees bend backwards, feet point backwards (churel folklore). One arm hangs to the shin holding the
// lantern on hooked fingers, the other reaches toward the viewer with fingers too long. Ash skin mostly in shadow;
// the only light is its lantern, from below. Long wet black hair hangs straight down past the face.
const WSK = "#7b7d77";
function wFace(g, cx, cy, sc, lit = 1) {
  g.save(); g.translate(cx, cy); g.scale(sc, sc); g.rotate(-0.18);
  // hair behind (curtain)
  g.fillStyle = "#050506"; g.beginPath(); g.moveTo(-40, -70); g.bezierCurveTo(-64, -30, -60, 90, -50, 170);
  for (let i = 0; i <= 10; i++) { const xx = -50 + i * 10, yy = 170 + ((i * 53) % 7) * 12 + (i % 2) * 30; g.lineTo(xx - 4, yy); g.lineTo(xx + 2, 160 + (i % 3) * 8); }
  g.lineTo(52, 170); g.bezierCurveTo(60, 90, 58, -30, 36, -72); g.closePath(); g.fill();
  // face: long, gaunt
  const face = smooth([[0, -78], [30, -68], [40, -30], [36, 20], [24, 70], [8, 104], [-8, 104], [-24, 70], [-36, 20], [-40, -30], [-30, -68]]);
  g.fillStyle = rgb(hex("#3a3c3a")); g.fill(face);
  g.save(); g.clip(face);
  const up = g.createLinearGradient(0, 110, 0, -60); up.addColorStop(0, `rgba(255,190,120,${0.75 * lit})`); up.addColorStop(0.55, `rgba(190,170,140,${0.35 * lit})`); up.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = rgb(hex(WSK)); g.translate(-8, 0); g.fill(face); g.translate(8, 0); g.fillStyle = up; g.fillRect(-60, -90, 120, 210);
  // sunken cheeks + temple hollows
  g.fillStyle = "rgba(10,10,12,0.65)"; g.fill(smooth([[-36, 6], [-20, 18], [-16, 56], [-30, 60]])); g.fill(smooth([[36, 6], [20, 18], [16, 56], [30, 60]]));
  g.restore();
  // eye sockets: deep, black, two pinpoints that catch the lantern
  g.fillStyle = "#020203"; g.beginPath(); g.ellipse(-15, -12, 12, 9, 0.25, 0, 7); g.ellipse(15, -12, 12, 9, -0.25, 0, 7); g.fill();
  g.fillStyle = "#fff6dc"; g.beginPath(); g.arc(-14, -10, 1.9, 0, 7); g.arc(16, -10, 1.9, 0, 7); g.fill();
  // no nose, two slits
  g.fillStyle = "#050506"; g.beginPath(); g.ellipse(-3, 22, 1.6, 5, 0, 0, 7); g.ellipse(4, 22, 1.6, 5, 0, 0, 7); g.fill();
  // mouth: too long, vertical, slightly open
  g.strokeStyle = "#020203"; g.lineWidth = 3.2; g.lineCap = "round"; g.beginPath(); g.moveTo(-34, 50); g.bezierCurveTo(-18, 62, 18, 62, 34, 50); g.stroke();
  g.lineWidth = 1.4; g.strokeStyle = "rgba(0,0,0,0.65)"; g.beginPath(); g.moveTo(-34, 50); g.lineTo(-38, 62); g.moveTo(34, 50); g.lineTo(38, 62);
  for (let t = -26; t <= 26; t += 7) { g.moveTo(t, 56 + Math.abs(t) * -0.12); g.lineTo(t, 61 + Math.abs(t) * -0.15); } g.stroke();
  // hair in front: two wet ropes falling over the face edges
  g.strokeStyle = "#050506"; g.lineCap = "round";
  for (const [x0, w, l] of [[-34, 9, 230], [-26, 6, 200], [-20, 4, 250], [24, 7, 210], [32, 9, 240]]) { g.lineWidth = w; g.beginPath(); g.moveTo(x0 * 0.6, -74); g.bezierCurveTo(x0, -20, x0 * 1.1, 100, x0 * 1.15, l); g.stroke(); }
  g.fillStyle = "#050506"; g.beginPath(); g.moveTo(-34, -66); g.quadraticCurveTo(0, -96, 34, -66); g.quadraticCurveTo(0, -78, -34, -66); g.fill();
  g.restore();
}
function walker3(g, x, groundY, H, noHalo = false) {
  g.save(); g.translate(x, groundY); const k = H / 1000; g.scale(k, k);
  if (!noHalo) {
  const halo = g.createRadialGradient(-110, -260, 10, -110, -260, 520); halo.addColorStop(0, "rgba(255,160,70,0.24)"); halo.addColorStop(1, "rgba(255,160,70,0)"); g.fillStyle = halo; g.fillRect(-900, -1200, 1800, 1200); }
  g.fillStyle = "rgba(0,0,0,0.65)"; g.beginPath(); g.ellipse(10, 0, 170, 18, 0, 0, 7); g.fill();
  const B = (path, d = 10, sh = 0.62) => part(g, path, WSK, { d, sh, lw: 1.6 });
  // far leg (darker)
  g.save(); g.globalAlpha = 0.9;
  B(smooth([[14, -540], [44, -536], [86, -300], [74, -282], [20, -46], [2, -46], [54, -300]]), 8, 0.75);
  B(smooth([[0, -56], [26, -56], [86, -18], [104, -2], [10, 2], [-6, -20]]), 6, 0.75); g.restore();
  // near leg: thigh down to a BACKWARD knee (behind = right), shin forward, foot pointing backward (toes right)
  B(smooth([[-34, -540], [6, -544], [58, -296], [48, -276], [-14, -44], [-36, -46], [24, -296]]), 10);
  B(smooth([[-44, -58], [-12, -58], [56, -20], [80, -4], [-16, 2], [-48, -18]]), 6);
  g.strokeStyle = "rgba(10,10,10,0.7)"; g.lineWidth = 2; for (const t of [40, 54, 66]) { g.beginPath(); g.moveTo(t, -12); g.lineTo(t + 8, 1); g.stroke(); }
  // knee joints sticking out behind, ankle knobs; wasted shin with one lit edge
  part(g, smooth([[38, -316], [66, -306], [72, -280], [56, -262], [38, -276]]), WSK, { d: 8, sh: 0.6, lw: 1.4 });
  part(g, smooth([[-40, -62], [-16, -66], [-12, -44], [-36, -38]]), WSK, { d: 6, sh: 0.6, lw: 1.2 });
  g.strokeStyle = "rgba(240,180,120,0.55)"; g.lineWidth = 3; g.beginPath(); g.moveTo(-10, -60); g.lineTo(40, -270); g.stroke();
  g.strokeStyle = "rgba(240,180,120,0.4)"; g.beginPath(); g.moveTo(-30, -530); g.lineTo(26, -300); g.stroke();
  // spine/torso: hunched and starved. Built in layers: dark body, sunken belly, a ribcage of separate lit ribs with
  // shadow gaps, a shoulder blade jutting out of the back, spine knuckles along the curve, collarbone, hip bone.
  const torso = smooth([[-30, -540], [12, -548], [44, -640], [56, -760], [40, -870], [0, -906], [-62, -896], [-96, -858], [-70, -800], [-48, -700], [-40, -600]]);
  part(g, torso, WSK, { d: 18, sh: 0.78, lw: 1.6 });
  g.save(); g.clip(torso);
  // sunken belly: deep shadow cavity under the ribs
  g.fillStyle = "rgba(6,6,8,0.5)"; g.fill(smooth([[-44, -690], [10, -700], [30, -640], [10, -575], [-36, -590]]));
  // ribs: each a tapered lit band following the hunched curve, gap shadows between
  for (let i = 0; i < 8; i++) {
    const t = i / 7, y = -872 + i * 24, x0 = -84 + t * 30, x1 = 48 - t * 10, sag = 18 + t * 10;
    g.strokeStyle = "rgba(4,4,6,0.7)"; g.lineWidth = 9; g.beginPath(); g.moveTo(x0, y + 4); g.quadraticCurveTo((x0 + x1) / 2, y - sag + 6, x1, y + 22); g.stroke();
    const rg = g.createLinearGradient(x0, 0, x1, 0); rg.addColorStop(0, "rgba(232,190,140,0.95)"); rg.addColorStop(0.5, "rgba(150,150,142,0.9)"); rg.addColorStop(1, "rgba(70,72,70,0.6)");
    g.strokeStyle = rg; g.lineWidth = 5.5 - t * 1.5; g.lineCap = "round"; g.beginPath(); g.moveTo(x0 + 4, y); g.quadraticCurveTo((x0 + x1) / 2, y - sag, x1 - 4, y + 16); g.stroke();
  }
  // sternum
  g.strokeStyle = "rgba(200,190,170,0.7)"; g.lineWidth = 4; g.beginPath(); g.moveTo(-74, -880); g.quadraticCurveTo(-64, -800, -50, -716); g.stroke();
  // hip bone
  g.fillStyle = "rgba(190,180,160,0.55)"; g.beginPath(); g.ellipse(-14, -566, 22, 9, -0.2, 0, 7); g.fill();
  g.restore();
  // shoulder blade jutting from the back
  part(g, smooth([[14, -900], [52, -880], [62, -830], [40, -800], [18, -846]]), WSK, { d: 10, sh: 0.66, lw: 1.4 });
  // spine knuckles along the back curve (on the silhouette edge)
  const edge = [[36, -880], [52, -820], [56, -760], [50, -700], [40, -640], [24, -580]];
  for (let i = 0; i < 11; i++) { const t = i / 10 * (edge.length - 1), j = Math.min(Math.floor(t), edge.length - 2), f = t - j;
    const sx = edge[j][0] + (edge[j + 1][0] - edge[j][0]) * f - 3, sy = edge[j][1] + (edge[j + 1][1] - edge[j][1]) * f;
    g.fillStyle = "#0b0b0d"; g.beginPath(); g.ellipse(sx + 3, sy + 2, 7, 6, 0, 0, 7); g.fill();
    g.fillStyle = "rgba(150,180,215,0.9)"; g.beginPath(); g.ellipse(sx + 1, sy, 5.5, 4.6, 0, 0, 7); g.fill(); }
  // collarbone
  g.strokeStyle = "rgba(225,200,165,0.8)"; g.lineWidth = 4; g.lineCap = "round"; g.beginPath(); g.moveTo(-90, -872); g.quadraticCurveTo(-60, -894, -20, -890); g.stroke();
  // reaching arm (back): toward the viewer-left, fingers too long
  B(smooth([[-70, -880], [-46, -870], [-150, -770], [-280, -742], [-284, -724], [-160, -748], [-84, -830]]), 8, 0.6);
  g.strokeStyle = "#6f716b"; g.lineWidth = 5.5; g.lineCap = "round";
  for (const [dx, dy] of [[-120, -30], [-132, 0], [-126, 26], [-104, 46]]) { g.beginPath(); g.moveTo(-282, -734); g.bezierCurveTo(-282 + dx * 0.4, -734 + dy * 0.2, -282 + dx * 0.8, -734 + dy * 0.7, -282 + dx, -734 + dy); g.stroke(); }
  // neck: long, forward and down; head hangs at shoulder height
  B(smooth([[-86, -904], [-60, -896], [-110, -846], [-150, -800], [-170, -812], [-118, -880]]), 6, 0.6);
  // hanging arm (front) with the lantern on hooked fingers
  B(smooth([[-96, -880], [-70, -872], [-84, -660], [-70, -420], [-90, -416], [-110, -660]]), 6, 0.5);
  g.strokeStyle = "#7f817a"; g.lineWidth = 5;
  for (const dx of [-12, 0, 12]) { g.beginPath(); g.moveTo(-80, -420); g.quadraticCurveTo(-80 + dx, -360, -80 + dx * 0.4, -320); g.quadraticCurveTo(-70, -306, -80 + dx * 0.2, -300); g.stroke(); }
  part(g, smooth([[-100, -676], [-76, -680], [-72, -654], [-96, -648]]), WSK, { d: 6, sh: 0.55, lw: 1.2 });   // elbow knob
  g.save(); g.scale(1.4, 1.4); lantern(g, -57, -230); g.restore();
  wFace(g, -176, -790, 1.05);
  g.save(); g.translate(0, -20); g.scale(1, 0.25); const fog = g.createRadialGradient(0, 0, 10, 0, 0, 380); fog.addColorStop(0, "rgba(150,165,180,0.5)"); fog.addColorStop(1, "rgba(150,165,180,0)"); g.fillStyle = fog; g.beginPath(); g.arc(0, 0, 380, 0, 7); g.fill(); g.restore();
  g.restore();
}
{
  const W = 1920, Hh = 1080, c = createCanvas(W, Hh), g = c.getContext("2d");
  jungle(g, W, Hh); g.fillStyle = "rgba(0,0,0,0.45)"; g.fillRect(0, 0, W, Hh);
  figure(g, cast[0], 250, 960, 400);
  walker3(g, 700, 960, 900);
  g.save(); g.beginPath(); g.rect(1180, 120, 640, 820); g.clip(); g.fillStyle = "#040507"; g.fillRect(1180, 120, 640, 820);
  const gl = g.createRadialGradient(1500, 760, 20, 1500, 760, 520); gl.addColorStop(0, "rgba(255,150,60,0.25)"); gl.addColorStop(1, "rgba(255,150,60,0)"); g.fillStyle = gl; g.fillRect(1180, 120, 640, 820);
  wFace(g, 1500, 470, 2.9); g.restore();
  g.strokeStyle = "rgba(244,241,234,0.2)"; g.lineWidth = 2; g.strokeRect(1180, 120, 640, 820);
  grade(g, W, Hh);
  g.textAlign = "left"; g.fillStyle = "#c8372d"; g.font = "18px Mono"; g.fillText("CREATURE SHEET \u00b7 v5", 60, 64);
  g.fillStyle = "#f4f1ea"; g.font = "34px InterB"; g.fillText("LANTERN WALKER", 60, 104);
  g.fillStyle = "rgba(244,241,234,0.72)"; g.font = "18px Inter";
  ["Insaan se 2x lamba, jhuka hua", "Sir kandhe ki oonchai pe latakta, neeche jhaankta", "Ulte ghutne, ulte pair", "Ek haath tumhari taraf, ungliyaan do guna lambi", "Roshni sirf apni laaltein ki, neeche se"].forEach((t, i) => g.fillText("\u2014 " + t, 60, 150 + i * 28));
  fs.writeFileSync("tools/chars/out/walker_v5.jpg", c.toBuffer("image/jpeg", 90));
}

// ---- sprite export (transparent PNG) for the 3D world: cards
{
  const out = "engine/public/jnd/chars/"; fs.mkdirSync(out, { recursive: true });
  const meta = {};
  for (const s of cast) {
    const H = 1500, W = 900, c = createCanvas(W, H + 60), g = c.getContext("2d");
    figure(g, s, W / 2, H + 20, 1400);
    fs.writeFileSync(out + s.id + ".png", c.toBuffer("image/png")); meta[s.id] = { w: W, h: H + 60, feetY: H + 20, px: 1400 * (s.h ?? 1) };
  }
  { const W = 1400, H = 1900, c = createCanvas(W, H), g = c.getContext("2d"); NOGLOW = true; walker3(g, 820, 1860, 1700, true); NOGLOW = false; fs.writeFileSync(out + "walker.png", c.toBuffer("image/png")); meta.walker = { w: W, h: H, feetY: 1860, feetX: 820, px: 1700, anc: { head: [521, 517], hand: [684, 1146], hand2: [341, 612], hair: [520, 640], eyes: [[491, 501], [543, 491]] } }; }
  fs.writeFileSync(out + "meta.json", JSON.stringify(meta));
}

// ======================= v4: full cast, poses, river woman, sprite export =======================
const walkieP = (g, hx, hy) => { g.save(); g.translate(hx + 4, hy - 10); g.rotate(-0.12);
  part(g, P([[-13, -34], [13, -34], [14, 40], [-14, 40]]), "#1c1d20", { rim: false, d: 4, lw: 1.6 });
  g.fillStyle = "#2c2e32"; g.fillRect(-9, -24, 18, 26); for (let y = -20; y < 0; y += 5) { g.fillStyle = "#121315"; g.fillRect(-7, y, 14, 2); }
  g.fillStyle = "#111"; g.fillRect(4, -76, 5, 44); g.fillRect(-8, -40, 6, 8);
  const gl = g.createRadialGradient(-5, -38, 1, -5, -38, 26); gl.addColorStop(0, "rgba(120,255,140,0.9)"); gl.addColorStop(1, "rgba(120,255,140,0)"); g.fillStyle = gl; g.beginPath(); g.arc(-5, -38, 26, 0, 7); g.fill();
  g.fillStyle = "#b8ffc4"; g.beginPath(); g.arc(-5, -38, 2.6, 0, 7); g.fill(); g.restore(); };
const registerP = (g, hx, hy) => { g.save(); g.translate(hx + 30, hy - 30); g.rotate(-0.08); part(g, P([[-46, -32], [46, -32], [46, 34], [-46, 34]]), "#5a2a1c", { rim: false, d: 6, lw: 1.6 });
  g.fillStyle = "#e8e0cc"; g.fillRect(-42, 30, 84, 4); g.strokeStyle = "#c8a85a"; g.lineWidth = 1.2; g.strokeRect(-36, -24, 72, 18); g.fillStyle = "#c8a85a"; g.font = "bold 10px InterB"; g.textAlign = "center"; g.fillText("REGISTER", 0, -12); g.restore(); };
const photoOldP = (g, hx, hy) => { g.save(); g.translate(hx + 14, hy - 18); g.rotate(-0.15); g.fillStyle = "#d8cfb8"; g.fillRect(-30, -24, 60, 46); g.fillStyle = "#6a5c48"; g.fillRect(-26, -20, 52, 34);
  g.fillStyle = "#3a3024"; for (const x of [-12, 10]) { g.beginPath(); g.arc(x, -6, 6, 0, 7); g.fill(); g.fillRect(x - 8, 2, 16, 12); } g.restore(); };
const RADIO = (s) => ({ frontArm: [[-(s.sw ?? 95) + 12, -600], [-(s.sw ?? 95) - 34, -520], [-54, -652]], handOver: true, prop: walkieP });
const SCARED = { eyes: "wide", open: 1, browTilt: -4 };
const BACKARM = (s) => ({ frontArm: [[-(s.sw ?? 95) + 12, -600], [-(s.sw ?? 95) - 14, -470], [-(s.sw ?? 95) - 6, -330]] });
const cast2 = [
  { id: "barua", tag: "R. BARUA", fw: 1.04, fl: 1.03, jaw: 33, skin: "#9a6c50", hair: "#3a3430", hairStyle: "short", moustache: true, mcol: "#2a2420", brow: "#3a3430", age: 1, sw: 100, ww: 78, shirt: "#6b6a4c", trouser: "#5a5940", cap: "peaked", capCol: "#4a4834", browTilt: 2, prop: registerP, h: 1.02,
    frontArm: [[-88, -600], [-112, -490], [-40, -450]] },
  { id: "lakhan", tag: "LAKHAN", fw: 1.02, fl: 1.0, skin: "#7a5038", hair: "#120e0a", hairStyle: "short", moustache: true, sw: 96, shirt: KH, trouser: KHT, prop: lantern, h: 0.98 },
  { id: "imran", tag: "IMRAN", fw: 1.0, fl: 1.04, skin: "#a8785a", hair: "#0f0c0a", hairStyle: "short", beard: "full", sw: 98, shirt: KH, trouser: KHT, prop: lantern, h: 1.01 },
  { id: "biren", tag: "BIREN", fw: 0.96, fl: 1.0, jaw: 27, skin: "#c09070", hair: "#0d0b0a", hairStyle: "fade", sw: 86, shirt: KH, trouser: KHT, prop: lantern, h: 0.97 },
  { id: "joseph", tag: "JOSEPH", fw: 1.0, fl: 1.02, skin: "#5e3e2c", hair: "#0c0a08", hairStyle: "short", mouth: 1.2, sw: 92, shirt: KH, trouser: KHT, prop: lantern, h: 1.0 },
  { id: "tenzing", tag: "TENZING", fw: 0.93, fl: 0.98, jaw: 26, skin: "#c8a080", hair: "#0c0a0a", hairStyle: "spiky", sw: 82, shirt: KH, trouser: KHT, prop: lantern, h: 0.95 },
  { id: "guddi", civil: true, child: true, beret: false, skin: "#b98a6a", hair: "#120e0c", hairStyle: "braids", shirt: "#e8e6e0", skirt: "#1f2a4a", trouser: "#e2ded6", boot: "#141414", sw: 72, ww: 56, fw: 0.9, fl: 0.94, jaw: 24, eyes: "wide", h: 0.6,
    frontArm: [[-62, -600], [-80, -480], [-66, -370]] },
  { id: "papa", civil: true, beret: false, kurta: true, skin: "#8a6048", hair: "#d0cac0", hairStyle: "receding", moustache: true, mcol: "#ddd8d0", brow: "#cfc8bc", age: 1, shirt: "#e6e0d0", trouser: "#ddd6c6", boot: "#3a3028", shawl: "#6a5a4a", hunch: 26, sw: 86, h: 0.92,
    eyes: "closed", frontArm: [[-74, -598], [-104, -520], [-18, -660]], handOver: true },
  { id: "agent", civil: true, beret: false, skin: "#9a6a4e", hair: "#0e0b09", hairStyle: "side", moustache: true, jaw: 35, fw: 1.08, shirt: "#2a2b30", trouser: "#2f3a52", jacket: "#1c1c20", sw: 106, ww: 86, browTilt: 4, h: 1.03, boot: "#2a1a12" },
  { id: "brother", civil: true, beret: false, cap: "wool", capCol: "#3a3634", skin: "#8e6248", hair: "#120e0a", hairStyle: "side", shirt: "#7a6a52", trouser: "#4a4436", jacket: "#9a5a24", sw: 92, fw: 0.98, fl: 1.04, h: 1.0 },
  { id: "survey", civil: true, beret: false, skin: "#9a7058", hair: "#141010", hairStyle: "short", shirt: "#6a6450", trouser: "#4a4436", jacket: "#8a5420", sw: 94, h: 1.0 },
];
const byId = Object.fromEntries([...cast, ...cast2].map((c) => [c.id, c]));
// pose sets per character id: [poseName, overrides(spec) => object]
const POSES = {
  arjun: [["stand", () => ({})], ["radio", RADIO], ["radioScared", (s) => ({ ...RADIO(s), ...SCARED })], ["scared", () => ({ ...SCARED, prop: null })], ["back", () => ({ back: true, prop: null })], ["tears", () => ({ tears: true, prop: null, mouth: -1 })], ["calm", () => ({ prop: null })]],
  bhola: [["stand", () => ({})], ["radio", RADIO], ["radioTears", (s) => ({ ...RADIO(s), tears: true, mouth: -1 })], ["register", () => ({ prop: registerP, frontArm: [[-74, -598], [-104, -490], [-36, -450]] })], ["photo", () => ({ prop: photoOldP, frontArm: [[-74, -598], [-100, -500], [-30, -500]] })], ["eyesClosed", (s) => ({ ...RADIO(s), eyes: "closed", tears: true })], ["back", () => ({ back: true, prop: null })], ["scared", () => ({ eyes: "wide", browTilt: -3, open: 0.6 })]],
  sameer: [["stand", () => ({})], ["radio", RADIO], ["laugh", () => ({ open: 1.2, mouth: 1.5, eyes: "closed" })], ["back", () => ({ back: true })]],
  rinku: [["stand", () => ({})], ["radio", RADIO], ["radioScared", (s) => ({ ...RADIO(s), ...SCARED })], ["back", () => ({ back: true, prop: null })]],
  mohan: [["stand", () => ({})], ["radio", RADIO], ["back", () => ({ back: true, prop: null })], ["confused", (s) => ({ ...RADIO(s), browTilt: 3, mouth: -1 })]],
  dev: [["stand", () => ({})], ["radio", RADIO], ["radioScared", (s) => ({ ...RADIO(s), ...SCARED })], ["scared", () => ({ ...SCARED })], ["back", () => ({ back: true, prop: null })], ["torch", () => ({ prop: torch, frontArm: undefined })]],
  kishan: [["stand", () => ({})], ["radio", RADIO], ["radioTears", (s) => ({ ...RADIO(s), tears: true, open: 0.5 })], ["back", () => ({ back: true, prop: null })]],
  barua: [["stand", () => ({})], ["stare", () => ({ prop: null, eyes: "wide", browTilt: 0 })], ["back", () => ({ back: true, prop: null })]],
  lakhan: [["stand", () => ({})], ["back", () => ({ back: true, prop: null })]],
  imran: [["stand", () => ({})], ["back", () => ({ back: true, prop: null })]],
  biren: [["stand", () => ({})], ["back", () => ({ back: true, prop: null })]],
  joseph: [["stand", () => ({})], ["radio", (s) => ({ ...RADIO(s), eyes: "closed", open: 0.6, mouth: 1 })], ["back", () => ({ back: true, prop: null })]],
  tenzing: [["stand", () => ({})], ["back", () => ({ back: true, prop: null })]],
  guddi: [["stand", () => ({})], ["back", () => ({ back: true })]],
  papa: [["cough", () => ({})]],
  agent: [["stand", () => ({})]],
  brother: [["stand", () => ({})]],
  survey: [["stand", () => ({})]],
};
// river woman: chest-deep, both arms up, red bangles, wet hair; v = "hair" (face hidden) | "faceless"
function riverWoman(g, x, waterY, H, v) {
  g.save(); g.translate(x, waterY); const k = H / 750; g.scale(k, k);
  const sk = "#8f8478", sari = "#5a1c1e";
  for (const sx of [-1, 1]) { // raised arms
    part(g, smooth([[sx * 70, -330], [sx * 96, -340], [sx * 120, -520], [sx * 132, -700], [sx * 110, -704], [sx * 92, -540], [sx * 60, -380]]), sk, { d: 10, sh: sx < 0 ? 0.45 : 0.6 });
    part(g, smooth([[sx * 104, -700], [sx * 136, -704], [sx * 146, -760], [sx * 128, -800], [sx * 110, -790], [sx * 100, -740]]), sk, { d: 6, sh: 0.5 });
    for (let b = 0; b < 7; b++) { g.strokeStyle = b % 3 === 2 ? "#d8b04a" : "#c0181e"; g.lineWidth = 6; g.beginPath(); g.ellipse(sx * (116 + b * 0.8), -640 - b * 9, 24, 7, sx * 0.2, 0, 7); g.stroke(); }
  }
  part(g, smooth([[-80, 0], [-86, -200], [-70, -330], [0, -350], [70, -330], [86, -200], [80, 0]]), sari, { d: 22, sh: 0.55 }); // wet sari torso
  g.strokeStyle = "rgba(20,6,6,0.6)"; g.lineWidth = 3; for (const yy of [-120, -200, -270]) { g.beginPath(); g.moveTo(-74, yy); g.quadraticCurveTo(0, yy + 30, 74, yy - 10); g.stroke(); }
  part(g, P([[-15, -350], [15, -350], [17, -390], [-17, -390]]), sk, { sh: 0.6, rim: false });
  const face = smooth([[0, -500], [30, -490], [38, -460], [36, -420], [20, -392], [0, -386], [-20, -392], [-36, -420], [-38, -460], [-30, -490]]);
  part(g, face, sk, { d: 10, sh: 0.5 });
  if (v === "faceless") { g.fillStyle = "rgba(60,54,48,0.35)"; g.beginPath(); g.ellipse(0, -440, 22, 30, 0, 0, 7); g.fill(); g.strokeStyle = "rgba(40,34,30,0.4)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-14, -430); g.quadraticCurveTo(0, -424, 14, -430); g.stroke(); }
  // wet hair: crown + long strands, over the face for "hair"
  part(g, smooth([[-42, -440], [-44, -480], [-30, -506], [0, -514], [30, -506], [44, -480], [42, -440], [26, -484], [0, -490], [-26, -484]]), "#0b0a0a", { rim: false, d: 6, sh: 0.3 });
  g.strokeStyle = "#0b0a0a"; g.lineCap = "round";
  const strands = v === "hair" ? 26 : 14;
  for (let i = 0; i < strands; i++) { const t = i / (strands - 1), x0 = -42 + t * 84; const cover = v === "hair" || Math.abs(x0) > 26;
    if (!cover) continue; g.lineWidth = 5 + (i % 3) * 2; g.beginPath(); g.moveTo(x0, -480); g.bezierCurveTo(x0 * 1.05, -400, x0 * 1.2 + Math.sin(i) * 8, -300, x0 * 1.4 + Math.sin(i * 2) * 14, -120 - (i % 4) * 30); g.stroke(); }
  g.fillStyle = "rgba(200,215,225,0.45)"; for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(-60 + i * 9, -380 + (i % 5) * 50, 2, 0, 7); g.fill(); } // drips
  // water line: ripples
  g.strokeStyle = "rgba(190,205,215,0.6)"; g.lineWidth = 3; for (let r = 0; r < 3; r++) { g.beginPath(); g.ellipse(0, 0, 120 + r * 60, 14 + r * 6, 0, Math.PI, 2 * Math.PI); g.stroke(); }
  g.restore();
}
{
  const out = "engine/public/jnd/chars/"; const meta = JSON.parse(fs.readFileSync(out + "meta.json"));
  const sheet = []; 
  const TALK = new Set(["radio", "radioScared", "radioTears", "confused", "stand", "laugh", "eyesClosed", "scared", "tears", "calm"]);
  for (const [id, ps] of Object.entries(POSES)) { const add = []; for (const [pn, fn] of ps) if (TALK.has(pn) && !["guddi", "papa", "agent", "brother", "survey"].includes(id)) add.push([pn + "_talk", (b) => { const o = fn(b); return { ...o, open: Math.max(0.7, (o.open ?? 0) + 0.6), mouth: 0 }; }]); ps.push(...add); }
  for (const [id, poses] of Object.entries(POSES)) for (const [pn, fn] of poses) {
    const base = byId[id]; const o = fn(base); const s = { ...base, ...(o.back && id !== "guddi" ? BACKARM(base) : {}), ...o };
    const H = 1500, W = 900, c = createCanvas(W, H + 60), g = c.getContext("2d");
    figure(g, s, W / 2, H + 20, 1400);
    const name = `${id}_${pn}`; fs.writeFileSync(out + name + ".png", c.toBuffer("image/png"));
    // animation anchors (px): head, front hand, back hand, eye band; long hair for braids. Used by the card deform shader.
    const k = (1400 / 750) * (s.h ?? 1), X = (x) => Math.round(W / 2 + k * x), Y = (y) => Math.round(H + 20 + k * y), sw = s.sw ?? 95, hu = s.hunch ?? 0, hs = s.child ? 1.3 : 1;
    const fA = (s.frontArm ?? [[-sw + 12, -600], [-sw - 14, -470], [-sw - 6, -330]])[2], bA = (s.backArm ?? [[sw - 12, -600], [sw + 10, -470], [sw + 6, -330]])[2];
    const hc = [(s.hx ?? 0), -700 + hu * 0.9], ec = [hc[0] + (s.turn ?? -5) * hs * (s.fw ?? 1), hc[1] - 6 * hs * (s.fl ?? 1)];
    const anc = { head: [X(hc[0]), Y(hc[1])], hand: [X(fA[0]), Y(fA[1])], hand2: [X(bA[0]), Y(bA[1])], ...(s.hairStyle === "braids" && !s.back ? { hair: [X(hc[0]), Y(hc[1] + 60)] } : {}) };
    meta[name] = { w: W, h: H + 60, feetY: H + 20, px: 1400 * (s.h ?? 1), anc }; sheet.push([name, c]);
    if (!s.back && s.eyes !== "closed" && !pn.endsWith("_talk")) { // blink overlay: the eye band re-drawn with closed eyes
      const c2 = createCanvas(W, H + 60), g2 = c2.getContext("2d"); figure(g2, { ...s, eyes: "closed" }, W / 2, H + 20, 1400);
      const bw = Math.ceil(k * 36 * hs * (s.fw ?? 1)), bh = Math.ceil(k * 15 * hs * (s.fl ?? 1)), x0 = X(ec[0]) - bw, y0 = Y(ec[1]) - bh;
      const c3 = createCanvas(bw * 2, bh * 2); c3.getContext("2d").drawImage(c2, x0, y0, bw * 2, bh * 2, 0, 0, bw * 2, bh * 2);
      fs.writeFileSync(out + name + "_blink.png", c3.toBuffer("image/png")); meta[name].blink = [x0, y0, bw * 2, bh * 2]; }
  }
  for (const v of ["hair", "faceless"]) { const W = 900, H = 1200, c = createCanvas(W, H), g = c.getContext("2d"); riverWoman(g, 450, 1150, 1100, v);
    const name = "woman_" + v; fs.writeFileSync(out + name + ".png", c.toBuffer("image/png")); meta[name] = { w: W, h: H, feetY: 1150, px: 1100 }; sheet.push([name, c]); }
  fs.writeFileSync(out + "meta.json", JSON.stringify(meta));
  // review sheet
  const cols = 10, cw = 192, chh = 340, rows = Math.ceil(sheet.length / cols), S = createCanvas(cols * cw, rows * chh), sg = S.getContext("2d");
  sg.fillStyle = "#2a3040"; sg.fillRect(0, 0, S.width, S.height);
  sheet.forEach(([n, c], i) => { const x = (i % cols) * cw, y = Math.floor(i / cols) * chh; sg.drawImage(c, x, y, cw, cw * c.height / c.width); sg.fillStyle = "#fff"; sg.font = "12px Inter"; sg.fillText(n, x + 4, y + chh - 6); });
  fs.writeFileSync("tools/chars/out/poses_v4.jpg", S.toBuffer("image/jpeg", 85));
  console.log("poses", sheet.length);
}

// ======================= inserts that need the cast / creature art =======================
{
  const OUT = "engine/public/t13/ins/"; const W = 1920, H = 1080;
  const fin = (g) => { const v = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.78)"); g.fillStyle = v; g.fillRect(0, 0, W, H);
    const img = g.getImageData(0, 0, W, H), d = img.data; let q = 17; for (let i = 0; i < d.length; i += 4) { q = (q * 1103515245 + 12345) & 0x7fffffff; const n = ((q >> 16) / 32768 - 0.5) * 14; d[i] += n; d[i + 1] += n; d[i + 2] += n; } g.putImageData(img, 0, 0); };
  const mk = (name, draw) => { const c = createCanvas(W, H), g = c.getContext("2d"); draw(g); fin(g); fs.writeFileSync(OUT + name + ".png", c.toBuffer("image/png")); };
  const blot = (g, x, y, rr, col) => { const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, col); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); };
  // torch beam full on the walker's face
  mk("face_torch", (g) => { g.fillStyle = "#020203"; g.fillRect(0, 0, W, H); blot(g, 960, 560, 760, "rgba(255,244,214,0.55)"); g.save(); wFace(g, 960, 520, 6.2, 1.6); g.restore();
    g.fillStyle = "rgba(255,250,235,0.18)"; g.fillRect(0, 0, W, H); });
  // 1998 team photo: 13 surveyors + Barua at the edge, same age as now
  mk("photo1998", (g) => { g.fillStyle = "#120e0a"; g.fillRect(0, 0, W, H); g.save(); g.translate(960, 540); g.rotate(-0.03);
    g.fillStyle = "#e4dcc8"; g.fillRect(-820, -440, 1640, 880); const sep = g.createLinearGradient(0, -400, 0, 400); sep.addColorStop(0, "#8a7a5e"); sep.addColorStop(1, "#5a4a36"); g.fillStyle = sep; g.fillRect(-780, -400, 1560, 760);
    g.save(); g.beginPath(); g.rect(-780, -400, 1560, 760); g.clip();
    for (let k = 0; k < 13; k++) { const row = k < 7 ? 0 : 1, i = row ? k - 7 : k, x = -620 + i * 190 + row * 95, y = row ? 330 : 250; const s2 = { ...byId.survey, skin: ["#8a6a50", "#9a7058", "#7a5a44"][k % 3], hairStyle: ["short", "side", "fade"][k % 3], moustache: k % 2 === 0, jacket: k % 4 === 0 ? "#6a4a2a" : "#8a5420" }; figure(g, s2, x, y + (row ? 170 : 80), row ? 520 : 470); }
    figure(g, { ...byId.barua, prop: null }, 690, 330, 560); // Barua, right edge
    g.restore();
    g.globalCompositeOperation = "color"; g.fillStyle = "#8a7050"; g.fillRect(-780, -400, 1560, 760); g.globalCompositeOperation = "source-over";
    g.fillStyle = "rgba(240,230,200,0.12)"; g.fillRect(-780, -400, 1560, 760);
    g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = 3; g.beginPath(); g.moveTo(-500, -400); g.lineTo(-380, 360); g.stroke(); // crease
    g.font = "italic 34px InterB"; g.fillStyle = "#3a2a1a"; g.textAlign = "right"; g.fillText("Survey Team · Neelkanth · Aug 1998", 770, 418);
    g.strokeStyle = "rgba(200,40,30,0.85)"; g.lineWidth = 6; g.beginPath(); g.ellipse(690, -40, 150, 330, 0, 0, 7); g.stroke(); // someone circled Barua
    g.restore(); blot(g, 1700, 900, 700, "rgba(255,170,90,0.2)"); });
  // Bhola (young) and his brother, old photo
  mk("photo_brothers", (g) => { g.fillStyle = "#0e0b08"; g.fillRect(0, 0, W, H); blot(g, 960, 600, 800, "rgba(255,170,90,0.3)"); g.save(); g.translate(960, 520); g.rotate(0.04);
    g.fillStyle = "#e0d6bc"; g.fillRect(-520, -400, 1040, 800); g.fillStyle = "#6a5a44"; g.fillRect(-480, -360, 960, 640); g.save(); g.beginPath(); g.rect(-480, -360, 960, 640); g.clip();
    figure(g, { ...byId.bhola, hair: "#14100c", hairStyle: "side", age: 0, hunch: 0, moustache: true, mcol: "#14100c", brow: "#14100c", prop: null, shirt: "#7a6a52", civil: true, beret: false }, -170, 600, 900);
    figure(g, { ...byId.brother, prop: null }, 190, 610, 920); g.restore();
    g.globalCompositeOperation = "color"; g.fillStyle = "#8a7050"; g.fillRect(-480, -360, 960, 640); g.globalCompositeOperation = "source-over";
    g.font = "italic 32px InterB"; g.fillStyle = "#3a2a1a"; g.textAlign = "center"; g.fillText("Bhola & Shankar · 1997", 0, 360);
    g.restore(); g.fillStyle = "#8e6248"; g.beginPath(); g.ellipse(560, 980, 220, 140, -0.3, 0, 7); g.fill(); }); // thumb holding
  // jeep side mirror: empty seat, no Arjun
  mk("mirror", (g) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#5a6a6a"); gr.addColorStop(1, "#2a3028"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 30; i++) blot(g, Math.random() * W, Math.random() * H * 0.6, 120, "rgba(40,60,40,0.35)");
    g.save(); g.translate(960, 540); g.rotate(-0.1); g.fillStyle = "#3a2216"; g.beginPath(); g.ellipse(0, 0, 560, 400, 0, 0, 7); g.fill(); // rusty housing
    g.save(); g.beginPath(); g.ellipse(0, 0, 510, 352, 0, 0, 7); g.clip(); g.fillStyle = "#4a5450"; g.fillRect(-520, -360, 1040, 720);
    g.fillStyle = "#2a2a26"; g.fillRect(-520, 60, 1040, 300); // dashboard
    g.fillStyle = "#4a3022"; g.beginPath(); g.roundRect(-160, -200, 330, 300, 30); g.fill(); g.fillStyle = "#3a2418"; g.fillRect(-170, 80, 360, 120); // empty seat
    g.strokeStyle = "rgba(20,14,10,0.6)"; g.lineWidth = 4; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(-150 + k * 60, -190); g.lineTo(-150 + k * 60, 90); g.stroke(); }
    g.fillStyle = "rgba(60,90,50,0.8)"; for (let k = 0; k < 16; k++) { g.beginPath(); g.ellipse(-480 + k * 60, -300 + Math.sin(k) * 40, 40, 18, k, 0, 7); g.fill(); } // vine leaves
    g.fillStyle = "rgba(230,240,240,0.18)"; g.beginPath(); g.moveTo(-400, -340); g.lineTo(-200, -340); g.lineTo(-460, 300); g.lineTo(-520, 300); g.fill(); // glass glint
    for (let k = 0; k < 40; k++) blot(g, -500 + Math.random() * 1000, -340 + Math.random() * 680, 30 + Math.random() * 60, "rgba(120,70,30,0.3)");
    g.restore(); g.strokeStyle = "#1a100a"; g.lineWidth = 10; g.beginPath(); g.ellipse(0, 0, 512, 354, 0, 0, 7); g.stroke(); g.restore(); });
  // river reflection: trees + lantern, boots at the top edge, no Arjun in the water
  mk("reflection", (g) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#3a4650"); gr.addColorStop(1, "#141a1e"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.save(); g.scale(1, -1); g.translate(0, -H); for (let k = 0; k < 9; k++) { g.fillStyle = "rgba(10,14,12,0.85)"; const x = k * 230 + 40; g.fillRect(x, 0, 60, 700); g.beginPath(); g.ellipse(x + 30, 760, 200, 150, 0, 0, 7); g.fill(); } g.restore();
    blot(g, 1300, 520, 120, "rgba(255,180,100,0.8)"); // lantern reflection
    for (let y = 0; y < H; y += 9) { g.fillStyle = `rgba(180,200,210,${0.04 + Math.random() * 0.05})`; g.fillRect(0, y, W, 2); } // ripples
    g.fillStyle = "#1f1a16"; g.beginPath(); g.ellipse(820, -40, 130, 120, 0, 0, 7); g.ellipse(1080, -50, 130, 120, 0, 0, 7); g.fill(); // his boots at the top edge
    g.fillStyle = "rgba(20,16,12,0.9)"; g.fillRect(0, 0, W, 60); g.fillStyle = "#2a2018"; for (let x = 0; x < W; x += 40) g.fillRect(x, 50, 30, 22 + Math.random() * 20); // bank edge
    g.strokeStyle = "rgba(230,235,240,0.35)"; g.lineWidth = 3; g.beginPath(); g.ellipse(950, 300, 300, 40, 0, 0, 7); g.stroke(); });
  // floating bangles on still water
  mk("bangles", (g) => { g.fillStyle = "#0e1418"; g.fillRect(0, 0, W, H); blot(g, 900, 500, 700, "rgba(150,180,220,0.18)");
    for (let y = 0; y < H; y += 12) { g.fillStyle = `rgba(160,190,210,${0.03 + Math.random() * 0.04})`; g.fillRect(0, y, W, 2); }
    for (const [x, y, s] of [[820, 560, 1], [1010, 610, 0.9], [930, 470, 0.8], [1120, 520, 0.85], [760, 660, 0.75]]) { g.save(); g.translate(x, y); g.scale(s, s * 0.35); g.strokeStyle = "#c0181e"; g.lineWidth = 14; g.beginPath(); g.arc(0, 0, 70, 0, 7); g.stroke(); g.strokeStyle = "#e8c060"; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 78, 0, 7); g.stroke(); g.restore(); }
    g.strokeStyle = "rgba(210,225,235,0.3)"; g.lineWidth = 2; for (let k = 1; k < 5; k++) { g.beginPath(); g.ellipse(940, 560, k * 140, k * 40, 0, 0, 7); g.stroke(); } });
  // POV down the ladder: a long grey hand on a rung
  mk("ladderhand", (g) => { g.fillStyle = "#040507"; g.fillRect(0, 0, W, H); const wood2 = "#3a2a1c";
    for (const x of [640, 1280]) { g.fillStyle = wood2; g.beginPath(); g.moveTo(x - 40, 0); g.lineTo(x + 40, 0); g.lineTo(x + 14 * (x < 900 ? 1 : -1) + 10, H); g.lineTo(x - 10 + 14 * (x < 900 ? 1 : -1), H); g.fill(); }
    for (let k = 0; k < 8; k++) { const y = 80 + k * k * 18; const w = 680 - k * 14; g.fillStyle = "#4a3624"; g.fillRect(960 - w / 2, y, w, 40 - k * 3); }
    blot(g, 960, 120, 500, "rgba(255,170,90,0.25)");
    g.save(); g.translate(930, 520); g.rotate(-0.1); g.strokeStyle = "#7b7d77"; g.lineCap = "round";
    g.lineWidth = 60; g.beginPath(); g.moveTo(-60, 600); g.quadraticCurveTo(-40, 300, 0, 120); g.stroke(); // forearm from the dark
    for (const [dx, len] of [[-70, 260], [-25, 320], [20, 330], [65, 280]]) { g.lineWidth = 16; g.beginPath(); g.moveTo(dx * 0.4, 120); g.quadraticCurveTo(dx, 0, dx * 1.1, -len * 0.55); g.quadraticCurveTo(dx * 1.15, -len * 0.75, dx * 1.05 + 10, -len * 0.62); g.stroke(); } // too-long fingers hooked over the rung
    g.lineWidth = 3; g.strokeStyle = "rgba(10,10,10,0.7)"; for (const [dx] of [[-70], [-25], [20], [65]]) { g.beginPath(); g.moveTo(dx * 0.9, -80); g.lineTo(dx * 0.95, -60); g.stroke(); } // knuckle creases
    g.restore(); g.fillStyle = "rgba(160,190,230,0.12)"; g.fillRect(0, 0, W, H); });
  console.log("inserts2 ok");
}

// ======================= v5: the jump-scare face (torch full on it) + better ladder hand =======================
function horrorFace(g, cx, cy, S, torch = 1) {
  g.save(); g.translate(cx, cy); g.scale(S, S);
  const sk = [138, 140, 130];
  const head = smooth([[0, -210], [70, -196], [112, -150], [124, -70], [118, 10], [100, 90], [70, 160], [34, 206], [0, 218], [-34, 206], [-70, 160], [-100, 90], [-118, 10], [-124, -70], [-112, -150], [-70, -196]]);
  // base skin with torch falloff (centre hot, edges cold)
  const base = g.createRadialGradient(-6, -10, 10, 0, 10, 240); base.addColorStop(0, `rgb(${232 * torch},${230 * torch},${214 * torch})`); base.addColorStop(0.45, `rgb(${sk[0]},${sk[1]},${sk[2]})`); base.addColorStop(1, "rgb(46,50,52)");
  g.fillStyle = base; g.fill(head);
  g.save(); g.clip(head);
  // mottled skin + veins
  for (let i = 0; i < 900; i++) { const x = (Math.random() - 0.5) * 260, y = (Math.random() - 0.5) * 440; g.fillStyle = `rgba(${60 + Math.random() * 40},${70 + Math.random() * 30},${60},${Math.random() * 0.18})`; g.beginPath(); g.arc(x, y, 2 + Math.random() * 8, 0, 7); g.fill(); }
  g.strokeStyle = "rgba(40,50,70,0.45)"; g.lineWidth = 1.3; for (const sx of [-1, 1]) for (let k = 0; k < 5; k++) { g.beginPath(); let x = sx * (80 + k * 6), y = -170 + k * 20; g.moveTo(x, y); for (let j = 0; j < 6; j++) { x += sx * (Math.random() * 6 - 1); y += 14 + Math.random() * 6; g.lineTo(x, y); } g.stroke(); }
  // sunken cheeks + temples (form shadows)
  for (const sx of [-1, 1]) { const c = g.createRadialGradient(sx * 78, 70, 4, sx * 78, 70, 80); c.addColorStop(0, "rgba(20,22,24,0.75)"); c.addColorStop(1, "rgba(20,22,24,0)"); g.fillStyle = c; g.fillRect(sx * 78 - 80, -10, 160, 160);
    const t = g.createRadialGradient(sx * 104, -120, 4, sx * 104, -120, 60); t.addColorStop(0, "rgba(20,22,24,0.6)"); t.addColorStop(1, "rgba(20,22,24,0)"); g.fillStyle = t; g.fillRect(sx * 104 - 60, -180, 120, 120); }
  // cheekbone highlights
  g.fillStyle = "rgba(255,252,240,0.35)"; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * 64, 18, 34, 12, sx * 0.4, 0, 7); g.fill(); }
  // brow ridge shadow then the hollow sockets
  g.fillStyle = "rgba(14,14,16,0.55)"; g.beginPath(); g.ellipse(0, -66, 118, 34, 0, 0, 7); g.fill();
  for (const sx of [-1, 1]) {
    const so = g.createRadialGradient(sx * 46, -46, 2, sx * 46, -44, 58); so.addColorStop(0, "rgba(0,0,0,1)"); so.addColorStop(0.65, "rgba(4,4,6,0.98)"); so.addColorStop(1, "rgba(10,10,12,0)");
    g.fillStyle = so; g.beginPath(); g.ellipse(sx * 46, -44, 44, 52, sx * -0.35, 0, 7); g.fill();
    g.fillStyle = "rgba(255,255,255,0.95)"; g.beginPath(); g.arc(sx * 44 + 4, -40, 3.2, 0, 7); g.fill();  // pinpoint glint deep inside
    g.fillStyle = "rgba(255,240,220,0.35)"; g.beginPath(); g.arc(sx * 44 + 4, -40, 9, 0, 7); g.fill();
    g.strokeStyle = "rgba(30,30,34,0.6)"; g.lineWidth = 2; g.beginPath(); g.arc(sx * 46, -30, 50, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); // bag folds
  }
  // collapsed nose: two slits
  g.fillStyle = "rgba(6,6,8,0.95)"; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * 11, 46, 5, 15, sx * -0.3, 0, 7); g.fill(); }
  g.fillStyle = "rgba(20,20,22,0.35)"; g.beginPath(); g.ellipse(0, 30, 24, 30, 0, 0, 7); g.fill();
  // the grin: too wide, lips sewn, a gap of teeth
  const gy = 120;
  g.fillStyle = "rgba(14,8,8,0.96)"; g.beginPath(); g.moveTo(-108, gy - 46); g.bezierCurveTo(-64, gy + 18, 64, gy + 18, 108, gy - 46); g.bezierCurveTo(60, gy + 2, -60, gy + 2, -108, gy - 46); g.fill();
  for (let k = -10; k <= 10; k++) { const x = k * 7.2, y = gy + 3 - Math.abs(k) * 1.6 + (k * k) * 0.02; g.fillStyle = `rgba(${196 - Math.abs(k) * 6},${184 - Math.abs(k) * 6},${150},0.95)`; g.fillRect(x - 2.6, y - 8, 5.2, 9); } // teeth
  g.strokeStyle = "rgba(22,12,10,0.95)"; g.lineWidth = 2.2; for (let k = -12; k <= 12; k++) { const x = k * 8.4, y = gy - 4 - Math.abs(k) * 1.4; g.beginPath(); g.moveTo(x - 4, y - 10); g.lineTo(x + 4, y + 8); g.moveTo(x + 4, y - 10); g.lineTo(x - 4, y + 8); g.stroke(); } // stitches
  g.strokeStyle = "rgba(20,20,22,0.5)"; g.lineWidth = 2; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 104, gy - 26); g.quadraticCurveTo(sx * 116, gy - 60, sx * 110, gy - 96); g.stroke(); } // grin creases
  g.restore();
  // wet hair: a crown and strands hanging past the jaw, a few across the face
  g.fillStyle = "#070707"; g.beginPath(); g.moveTo(-126, -60); g.bezierCurveTo(-130, -200, 130, -200, 126, -60); g.bezierCurveTo(90, -170, -90, -170, -126, -60); g.fill();
  g.strokeStyle = "#070707"; g.lineCap = "round";
  let hs = 11; const hr = () => ((hs = (hs * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 160; i++) { const sx = i % 2 ? 1 : -1, x0 = sx * (52 + hr() * 78), len = 220 + hr() * 330, jit = () => (hr() - 0.5) * 34;
    h0(g, x0, len, sx, jit, hr); }
  for (let i = 0; i < 9; i++) { const x0 = -46 + hr() * 92; g.lineWidth = 1 + hr() * 2.4; g.strokeStyle = `rgba(6,6,6,${0.7 + hr() * 0.3})`; g.beginPath(); g.moveTo(x0, -170); g.bezierCurveTo(x0 + (hr() - 0.5) * 40, -60, x0 + (hr() - 0.5) * 50, 60, x0 + (hr() - 0.5) * 30, 120 + hr() * 120); g.stroke(); } // strands across the face
  for (const sx of [-1, 1]) { g.strokeStyle = "rgba(0,0,0,0.85)"; g.lineWidth = 3; g.beginPath(); g.moveTo(sx * 46, -6); g.bezierCurveTo(sx * 48, 30, sx * 42, 60, sx * 46, 96); g.stroke(); } // black tear-tracks from the sockets
  g.fillStyle = "rgba(220,230,240,0.5)"; for (let i = 0; i < 16; i++) { g.beginPath(); g.arc((Math.random() - 0.5) * 240, (Math.random() - 0.3) * 300, 1.6, 0, 7); g.fill(); } // water drops
  g.restore();
}
{
  const OUT = "engine/public/t13/ins/"; const W = 1920, H = 1080; const c = createCanvas(W, H), g = c.getContext("2d");
  g.fillStyle = "#010102"; g.fillRect(0, 0, W, H);
  const beam = g.createRadialGradient(960, 520, 40, 960, 560, 900); beam.addColorStop(0, "rgba(255,246,222,0.42)"); beam.addColorStop(0.5, "rgba(120,120,110,0.12)"); beam.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = beam; g.fillRect(0, 0, W, H);
  horrorFace(g, 960, 560, 2.15, 1);
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.85)"); g.fillStyle = v; g.fillRect(0, 0, W, H);
  const img = g.getImageData(0, 0, W, H), d = img.data; let q = 5; for (let i = 0; i < d.length; i += 4) { q = (q * 1103515245 + 12345) & 0x7fffffff; const n = ((q >> 16) / 32768 - 0.5) * 18; d[i] += n; d[i + 1] += n; d[i + 2] += n; } g.putImageData(img, 0, 0);
  fs.writeFileSync(OUT + "face_torch.png", c.toBuffer("image/png"));
  // ladder hand v2: painted grey hand, too-long knuckled fingers hooked over a rung, from the dark below
  const c2 = createCanvas(W, H), h = c2.getContext("2d"); h.fillStyle = "#030406"; h.fillRect(0, 0, W, H);
  for (const [x0, x1] of [[560, 700], [1360, 1220]]) { const gr = h.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#4a3624"); gr.addColorStop(1, "#0a0806"); h.fillStyle = gr; h.beginPath(); h.moveTo(x0 - 50, 0); h.lineTo(x0 + 50, 0); h.lineTo(x1 + 22, H); h.lineTo(x1 - 22, H); h.fill(); }
  for (let k = 0; k < 7; k++) { const y = 140 + k * 150 - k * k * 6, x0 = 560 + (700 - 560) * (y / H), x1 = 1360 + (1220 - 1360) * (y / H); const gr = h.createLinearGradient(0, y, 0, y + 46); gr.addColorStop(0, `rgba(${110 - k * 12},${80 - k * 9},${52 - k * 6},1)`); gr.addColorStop(1, "#140e08"); h.fillStyle = gr; h.fillRect(x0, y, x1 - x0, 46 - k * 3); }
  blot2(h, 960, 80, 620, "rgba(255,170,90,0.28)");
  // forearm
  h.save(); h.translate(980, 470); h.rotate(0.06);
  const arm = new Path2D(); arm.moveTo(-58, 640); arm.bezierCurveTo(-70, 400, -40, 200, -34, 60); arm.lineTo(48, 60); arm.bezierCurveTo(52, 220, 80, 420, 70, 640); arm.closePath();
  const ag = h.createLinearGradient(-60, 0, 70, 0); ag.addColorStop(0, "#2a2c2a"); ag.addColorStop(0.55, "#7d807a"); ag.addColorStop(1, "#3a3c3a"); h.fillStyle = ag; h.fill(arm);
  h.strokeStyle = "rgba(20,24,30,0.5)"; h.lineWidth = 2; for (let k = 0; k < 4; k++) { h.beginPath(); h.moveTo(-10 + k * 12, 600); h.bezierCurveTo(-20 + k * 10, 400, 10 + k * 6, 200, 0 + k * 8, 80); h.stroke(); } // tendons/veins
  // back of hand
  const hand = new Path2D(); hand.moveTo(-40, 70); hand.bezierCurveTo(-70, 20, -80, -40, -70, -70); hand.lineTo(80, -70); hand.bezierCurveTo(86, -30, 70, 30, 52, 70); hand.closePath();
  const hg = h.createLinearGradient(-80, 0, 90, 0); hg.addColorStop(0, "#3a3c38"); hg.addColorStop(0.5, "#9a9c94"); hg.addColorStop(1, "#4a4c48"); h.fillStyle = hg; h.fill(hand);
  // four long fingers, three segments each, curling over the rung towards the viewer
  const fingers = [[-62, 210], [-22, 260], [20, 270], [60, 225]];
  for (const [fx, len] of fingers) { const segs = [len * 0.42, len * 0.34, len * 0.24]; let x = fx, y = -70, a = -Math.PI / 2 + fx * 0.002;
    for (let si = 0; si < 3; si++) { const L = segs[si], w = 15 - si * 3; const nx = x + Math.cos(a) * L, ny = y + Math.sin(a) * L;
      const fg = h.createLinearGradient(x - w, y, x + w, y); fg.addColorStop(0, "#3a3c38"); fg.addColorStop(0.5, "#a4a69e"); fg.addColorStop(1, "#4a4c48"); h.strokeStyle = fg; h.lineWidth = w * 2; h.lineCap = "round"; h.beginPath(); h.moveTo(x, y); h.lineTo(nx, ny); h.stroke();
      h.fillStyle = "rgba(40,42,40,0.9)"; h.beginPath(); h.ellipse(nx, ny, w * 1.15, w * 0.8, a, 0, 7); h.fill(); h.fillStyle = "rgba(190,192,184,0.6)"; h.beginPath(); h.ellipse(nx - 2, ny - 2, w * 0.6, w * 0.35, a, 0, 7); h.fill(); // knuckle
      x = nx; y = ny; a += si === 0 ? 0.55 : 0.9; }
    h.fillStyle = "#1a1a18"; h.beginPath(); h.ellipse(x, y, 6, 9, a, 0, 7); h.fill(); } // long cracked nails
  h.restore(); h.fillStyle = "rgba(140,170,210,0.08)"; h.fillRect(0, 0, W, H);
  const v2 = h.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9); v2.addColorStop(0, "rgba(0,0,0,0)"); v2.addColorStop(1, "rgba(0,0,0,0.85)"); h.fillStyle = v2; h.fillRect(0, 0, W, H);
  fs.writeFileSync(OUT + "ladderhand.png", c2.toBuffer("image/png"));
  // review sheet for both
  const sh = createCanvas(1920, 540), sg = sh.getContext("2d"); sg.drawImage(c, 0, 0, 960, 540); sg.drawImage(c2, 960, 0, 960, 540); fs.writeFileSync("tools/chars/out/scare_v1.jpg", sh.toBuffer("image/jpeg", 85));
  console.log("scare ok");
}
function h0(g, x0, len, sx, jit, hr) { g.lineWidth = 1.2 + hr() * 4.5; g.strokeStyle = `rgba(5,5,5,${0.75 + hr() * 0.25})`; g.beginPath(); g.moveTo(x0 * 0.78, -158); g.bezierCurveTo(x0 * 1.05 + jit(), -40, x0 * 1.12 + sx * 8 + jit(), 90, x0 * 1.18 + sx * hr() * 26, -150 + len); g.stroke(); }
function blot2(g, x, y, rr, col) { const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, col); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }

// ======================= v6: key "4" in Bhola's palm (cel-shaded, like the cast) =======================
{
  const W = 1920, H = 1080, c = createCanvas(W, H), g = c.getContext("2d");
  const bg = g.createRadialGradient(900, 520, 60, 960, 540, 1000); bg.addColorStop(0, "#2a1e14"); bg.addColorStop(1, "#06070a"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.save(); g.translate(960, 600); g.scale(2.3, 2.3); g.rotate(-0.12);
  const sk = "#8e6248";
  part(g, smooth([[-150, 40], [-160, -30], [-120, -90], [-40, -110], [60, -104], [130, -70], [150, 0], [130, 90], [60, 140], [-40, 150], [-120, 120]]), sk, { d: 18, sh: 0.5 }); // palm
  const fing = [[-118, -84, -0.55, 120], [-56, -108, -0.18, 150], [14, -112, 0.05, 156], [80, -96, 0.3, 136]];
  for (const [x, y, a, L] of fing) { g.save(); g.translate(x, y); g.rotate(a);
    part(g, smooth([[-22, 10], [-24, -L * 0.5], [-18, -L * 0.92], [0, -L], [18, -L * 0.92], [24, -L * 0.5], [22, 10]]), sk, { d: 8, sh: 0.5 });
    g.strokeStyle = rgb(dark(sk, 0.55), 0.8); g.lineWidth = 2; for (const t of [0.38, 0.7]) { g.beginPath(); g.moveTo(-16, -L * t); g.quadraticCurveTo(0, -L * t + 5, 16, -L * t); g.stroke(); }
    g.fillStyle = rgb(mix(hex(sk), [230, 200, 180], 0.4)); g.beginPath(); g.ellipse(0, -L * 0.9, 11, 14, 0, 0, 7); g.fill(); g.restore(); }
  g.save(); g.translate(150, 40); g.rotate(0.9); part(g, smooth([[-26, 0], [-28, -60], [-14, -112], [10, -116], [26, -60], [24, 0]]), sk, { d: 8, sh: 0.55 }); g.restore(); // thumb
  g.strokeStyle = rgb(dark(sk, 0.6), 0.75); g.lineWidth = 2.4; for (const [a, b, c2, d] of [[-130, 0, 110, -30], [-110, 50, 100, 30], [-20, 130, 30, -60]]) { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo((a + c2) / 2, (b + d) / 2 - 24, c2, d); g.stroke(); } // palm lines
  g.save(); g.translate(-10, 10); g.rotate(-0.45);
  part(g, smooth([[-110, -26], [-60, -30], [-58, 30], [-110, 26], [-130, 0]]), "#b39a52", { d: 6, sh: 0.45, lw: 1.6 }); g.fillStyle = "#3a2a1a"; g.beginPath(); g.arc(-100, 0, 9, 0, 7); g.fill(); // bow of the key
  part(g, P([[-60, -9], [90, -9], [90, 9], [-60, 9]]), "#b39a52", { d: 4, sh: 0.45, lw: 1.4, rim: false }); part(g, P([[60, 9], [74, 9], [74, 30], [60, 30]]), "#b39a52", { rim: false, lw: 1.2 }); part(g, P([[80, 9], [90, 9], [90, 24], [80, 24]]), "#b39a52", { rim: false, lw: 1.2 });
  g.restore();
  g.save(); g.translate(-90, 70); g.rotate(0.22); g.strokeStyle = "#5a4020"; g.lineWidth = 2; g.beginPath(); g.moveTo(40, -50); g.lineTo(20, -10); g.stroke();
  part(g, P([[-42, -28], [42, -28], [42, 30], [-42, 30]]), "#e8dcc0", { rim: false, d: 4, sh: 0.3, lw: 1.6 }); g.fillStyle = "#2a1410"; g.font = "bold 50px InterB"; g.textAlign = "center"; g.fillText("4", 0, 19); g.restore();
  g.restore();
  const gl = g.createRadialGradient(600, 300, 20, 600, 300, 800); gl.addColorStop(0, "rgba(255,170,90,0.25)"); gl.addColorStop(1, "rgba(255,170,90,0)"); g.fillStyle = gl; g.fillRect(0, 0, W, H);
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.95); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.8)"); g.fillStyle = v; g.fillRect(0, 0, W, H);
  fs.writeFileSync("engine/public/t13/ins/key4.png", c.toBuffer("image/png"));
  const sm = createCanvas(960, 540); sm.getContext("2d").drawImage(c, 0, 0, 960, 540); fs.writeFileSync("tools/chars/out/key_v2.jpg", sm.toBuffer("image/jpeg", 85));
  console.log("key ok");
}

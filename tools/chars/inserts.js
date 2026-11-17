// TOWER 13 — 2D graphic-novel insert plates (1920x1080 PNG): handset LED, camp map, phone, envelope, letter, contract,
// key, watch, registers, 1998 newspaper + team photo, brothers photo, jeep mirror, river reflection, floating bangles,
// ladder hand, torch-on-face. Same shading language as the cast (cool shadow / warm lantern), paper grain, vignette.
const { createCanvas, GlobalFonts, Path2D } = require("@napi-rs/canvas");
const fs = require("fs");
const F = "engine/public/fonts/";
for (const f of fs.readdirSync(F)) { try { GlobalFonts.registerFromPath(F + f, f.replace(/\..*$/, "")); } catch (e) {} }
const fams = GlobalFonts.families.map((f) => f.family); 
const OUT = "engine/public/t13/ins/"; fs.mkdirSync(OUT, { recursive: true });
const W = 1920, H = 1080;
let seed = 7; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
try { GlobalFonts.registerFromPath(F + "noto-sans-bengali-bengali-800-normal.woff2", "AsmB"); GlobalFonts.registerFromPath(F + "noto-sans-bengali-bengali-700-normal.woff2", "AsmB7"); } catch (e) { console.log("font", e.message); }
const ASM = "AsmB";
const SANS = fams.find((f) => /Inter/i.test(f)) || "sans-serif", HIN = fams.find((f) => /Devanagari/i.test(f)) || SANS, MONO = fams.find((f) => /Plex|Mono/i.test(f)) || "monospace";
const font = (g, w, s, fam = SANS) => { g.font = `${w} ${s}px "${fam}"`; };
const blot = (g, x, y, rr, col) => { const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, col); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); };
const paper = (g, x, y, w, h, base = "#e6dcc4", age = 1) => { g.fillStyle = base; g.fillRect(x, y, w, h);
  for (let i = 0; i < 60 * age; i++) blot(g, x + r() * w, y + r() * h, 20 + r() * 120, `rgba(${120 + r() * 40},${90 + r() * 30},${50},${0.08 + r() * 0.1})`);
  for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(60,40,20,${r() * 0.12})`; g.fillRect(x + r() * w, y + r() * h, 1.5, 1.5); }
  g.strokeStyle = "rgba(90,70,40,0.25)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x + w * 0.5, y); g.lineTo(x + w * 0.5 + 6, y + h); g.stroke(); };
const finish = (g, warm = 0) => { // vignette + grain + slight cool grade
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.75)"); g.fillStyle = v; g.fillRect(0, 0, W, H);
  g.fillStyle = warm ? "rgba(255,170,90,0.05)" : "rgba(30,50,90,0.10)"; g.fillRect(0, 0, W, H);
  const img = g.getImageData(0, 0, W, H), d = img.data; let s = 99; for (let i = 0; i < d.length; i += 4) { s = (s * 1103515245 + 12345) & 0x7fffffff; const n = ((s >> 16) / 32768 - 0.5) * 14; d[i] += n; d[i + 1] += n; d[i + 2] += n; } g.putImageData(img, 0, 0); };
const save = (name, c) => fs.writeFileSync(OUT + name + ".png", c.toBuffer("image/png"));
const plate = (draw, warm = 0) => { const c = createCanvas(W, H), g = c.getContext("2d"); draw(g); finish(g, warm); return c; };
const lamp = (g, x, y, rr, a = 0.5) => blot(g, x, y, rr, `rgba(255,170,90,${a})`);
const night = (g) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#0c1424"); gr.addColorStop(1, "#05070c"); g.fillStyle = gr; g.fillRect(0, 0, W, H); };
const wood = (g, x, y, w, h, col = "#3a2a1c") => { g.fillStyle = col; g.fillRect(x, y, w, h); for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(15,10,6,${0.2 + r() * 0.3})`; g.lineWidth = 1 + r() * 3; const yy = y + r() * h; g.beginPath(); g.moveTo(x, yy); g.bezierCurveTo(x + w * 0.3, yy + (r() - 0.5) * 10, x + w * 0.7, yy + (r() - 0.5) * 10, x + w, yy); g.stroke(); } };

// 1. handset LED: on / dim / off
for (const [nm, a] of [["led_on", 1], ["led_dim", 0.35], ["led_off", 0]]) save(nm, plate((g) => {
  night(g); wood(g, 0, 700, W, 380, "#22180f"); g.fillStyle = "rgba(0,0,0,0.55)"; g.fillRect(0, 700, W, 380);
  g.save(); g.translate(980, 560); g.rotate(-0.28);
  g.fillStyle = "#111215"; g.beginPath(); g.roundRect(-210, -330, 420, 760, 40); g.fill(); // body
  g.strokeStyle = "rgba(160,190,230,0.35)"; g.lineWidth = 6; g.beginPath(); g.roundRect(-206, -326, 412, 752, 38); g.stroke(); // moon rim
  g.fillStyle = "#1c1e22"; g.beginPath(); g.roundRect(-160, -250, 320, 300, 20); g.fill();
  for (let y = -230; y < 30; y += 22) { g.fillStyle = "#08090a"; g.beginPath(); g.roundRect(-140, y, 280, 9, 4); g.fill(); } // speaker grille
  g.fillStyle = "#0a0b0c"; g.fillRect(40, -560, 46, 240); g.fillRect(-150, -380, 80, 60); // antenna + knob
  for (const [x, y] of [[-100, 130], [0, 130], [100, 130], [-100, 230], [0, 230], [100, 230]]) { g.fillStyle = "#26282d"; g.beginPath(); g.roundRect(x - 38, y - 30, 76, 60, 10); g.fill(); }
  g.fillStyle = "#2a2c30"; g.fillRect(-150, 300, 300, 50); font(g, "bold", 26, MONO); g.fillStyle = "#8a9098"; g.textAlign = "center"; g.fillText("CH 04  ·  VHF", 0, 336);
  if (a > 0) { blot(g, -110, -300, 260, `rgba(110,255,140,${0.55 * a})`); g.fillStyle = `rgba(190,255,200,${a})`; g.beginPath(); g.arc(-110, -300, 14, 0, 7); g.fill(); }
  else { g.fillStyle = "#1a2a1c"; g.beginPath(); g.arc(-110, -300, 14, 0, 7); g.fill(); }
  g.restore(); }));

// 2. camp map (base, no dots) + crossed-out centre variant; dot coords exported
const MAPC = [960, 560], MAPR = 330, dotXY = []; for (let i = 1; i <= 12; i++) { const a = Math.PI / 2 + (i - 1) * Math.PI / 6; dotXY.push([MAPC[0] + MAPR * Math.cos(a), MAPC[1] + MAPR * Math.sin(a)]); } dotXY.push(MAPC);
for (const nm of ["map", "map_cut"]) save(nm, plate((g) => {
  g.fillStyle = "#14100c"; g.fillRect(0, 0, W, H); g.save(); g.translate(W / 2, H / 2); g.rotate(-0.025); g.translate(-W / 2, -H / 2);
  paper(g, 240, 60, 1440, 980, "#d9cfb4", 1.4);
  g.strokeStyle = "rgba(70,90,60,0.35)"; g.lineWidth = 2; for (let k = 0; k < 14; k++) { g.beginPath(); for (let a = 0; a <= 6.3; a += 0.1) { const rr = 80 + k * 36 + Math.sin(a * 3 + k) * 18 + Math.sin(a * 7) * 6; g.lineTo(MAPC[0] + Math.cos(a) * rr * 1.2, MAPC[1] + Math.sin(a) * rr); } g.closePath(); g.stroke(); } // contours
  g.strokeStyle = "rgba(40,80,130,0.6)"; g.lineWidth = 9; g.beginPath(); for (let x = 260; x < 1680; x += 20) g.lineTo(x, 130 + Math.sin(x * 0.006) * 30); g.stroke(); // river
  font(g, "italic 600", 26); g.fillStyle = "rgba(40,70,110,0.8)"; g.fillText("nadi", 300, 120);
  g.strokeStyle = "rgba(60,40,20,0.7)"; g.setLineDash([10, 8]); g.lineWidth = 3; g.beginPath(); g.arc(MAPC[0], MAPC[1], MAPR + 40, 0, 7); g.stroke(); g.setLineDash([]);
  g.strokeStyle = "rgba(60,40,20,0.8)"; g.lineWidth = 5; g.beginPath(); g.moveTo(MAPC[0], MAPC[1] + MAPR + 40); g.lineTo(MAPC[0], 1010); g.stroke();
  font(g, "800", 30); g.fillStyle = "#3a2410"; g.textAlign = "center"; g.fillText("CAMP", MAPC[0] + 70, 990); g.fillText("GATE ▼", MAPC[0] + 80, 1030);
  for (let i = 0; i < 12; i++) { const [x, y] = dotXY[i]; g.strokeStyle = "#3a2410"; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 30, 0, 7); g.stroke(); font(g, "800", 26); g.fillStyle = "#3a2410"; g.fillText(String(i + 1), x + (x - MAPC[0]) * 0.22, y + (y - MAPC[1]) * 0.22 + 9); }
  g.strokeStyle = "#3a2410"; g.lineWidth = 3; g.beginPath(); g.arc(MAPC[0], MAPC[1], 34, 0, 7); g.stroke(); font(g, "800", 26); g.fillStyle = "#3a2410"; g.fillText("13", MAPC[0], MAPC[1] - 48);
  if (nm === "map_cut") { g.strokeStyle = "#8a1a12"; g.lineWidth = 9; g.lineCap = "round"; g.beginPath(); g.moveTo(MAPC[0] - 60, MAPC[1] - 50); g.lineTo(MAPC[0] + 60, MAPC[1] + 50); g.moveTo(MAPC[0] + 60, MAPC[1] - 50); g.lineTo(MAPC[0] - 60, MAPC[1] + 50); g.stroke(); font(g, "italic 700", 30); g.fillStyle = "#8a1a12"; g.fillText("BAND — 1998", MAPC[0], MAPC[1] + 100); }
  font(g, "900", 40); g.fillStyle = "#2a1a0c"; g.textAlign = "right"; g.fillText("NEELKANTH RESERVE · SPECIAL DUTY", 1650, 230);
  g.restore(); lamp(g, 1700, 900, 600, 0.25); }, 1));
fs.writeFileSync(OUT + "map_dots.json", JSON.stringify(dotXY));

// 3. phone: result NOT QUALIFIED, held in a hand at dusk on the roof
save("phone", plate((g) => {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#2a2442"); gr.addColorStop(0.6, "#7a4a52"); gr.addColorStop(1, "#2a1c1c"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 14; i++) { g.fillStyle = "rgba(20,14,18,0.9)"; const x = i * 150 - 40, h = 120 + r() * 160; g.fillRect(x, H - 260 - h, 120 + r() * 60, h + 260); } // town roofline
  g.save(); g.translate(1000, 620); g.rotate(0.06);
  g.fillStyle = "#9a6a50"; g.beginPath(); g.ellipse(-20, 330, 260, 150, -0.2, 0, 7); g.fill(); // palm
  g.fillStyle = "#0d0d10"; g.beginPath(); g.roundRect(-210, -420, 420, 820, 46); g.fill();
  g.fillStyle = "#eef1f6"; g.beginPath(); g.roundRect(-190, -380, 380, 740, 26); g.fill();
  g.fillStyle = "#1d3a6a"; g.fillRect(-190, -380, 380, 110); font(g, "800", 30); g.fillStyle = "#fff"; g.textAlign = "center"; g.fillText("STAFF SELECTION · RESULT", 0, -318);
  font(g, "600", 24); g.fillStyle = "#333"; g.fillText("Roll No. 2207 4419 31", 0, -220); g.fillText("Name: ARJUN KUMAR", 0, -180);
  g.fillStyle = "#c8221a"; g.fillRect(-160, -110, 320, 110); font(g, "900", 50); g.fillStyle = "#fff"; g.fillText("NOT", 0, -64); g.fillText("QUALIFIED", 0, -16);
  font(g, "600", 22); g.fillStyle = "#555"; g.fillText("Attempt: 3", 0, 70); g.fillText("Cut-off: 142.5   ·   Score: 139.0", 0, 108);
  for (const [x, y, w] of [[-120, 200, 240], [-90, 240, 180]]) { g.fillStyle = "#d8dde6"; g.fillRect(x, y, w, 16); }
  g.fillStyle = "#9a6a50"; for (const [x, y] of [[-215, -120], [-222, 0], [-215, 120]]) { g.beginPath(); g.ellipse(x, y, 30, 50, 0.1, 0, 7); g.fill(); } // fingers on the left edge
  g.fillStyle = "#8a5c44"; g.beginPath(); g.ellipse(200, 120, 34, 110, -0.3, 0, 7); g.fill(); // thumb
  g.restore(); blot(g, 1000, 600, 700, "rgba(170,190,255,0.12)"); }, 0));

// 4. envelope under the door
save("envelope", plate((g) => {
  g.fillStyle = "#1a120c"; g.fillRect(0, 0, W, H); wood(g, 0, 0, W, 620, "#3a2616"); g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(0, 0, W, 620);
  g.fillStyle = "#0a0806"; g.fillRect(0, 600, W, 30); // door gap
  const fl = g.createLinearGradient(0, 630, 0, H); fl.addColorStop(0, "#5a4a3c"); fl.addColorStop(1, "#2a2018"); g.fillStyle = fl; g.fillRect(0, 630, W, H - 630); // floor
  blot(g, 960, 640, 900, "rgba(255,200,140,0.18)"); // light from under the door
  g.save(); g.translate(1000, 760); g.rotate(-0.12); paper(g, -380, -150, 760, 330, "#cdb98c", 0.8);
  g.strokeStyle = "rgba(90,60,30,0.6)"; g.lineWidth = 3; g.beginPath(); g.moveTo(-380, -150); g.lineTo(0, 40); g.lineTo(380, -150); g.stroke();
  font(g, "900", 36); g.fillStyle = "#6a1a12"; g.textAlign = "center"; g.fillText("ON GOVERNMENT SERVICE", 0, 110); font(g, "700", 26); g.fillStyle = "#3a2a1a"; g.fillText("VAN VIBHAG · NRF/98/13", 0, 150);
  g.strokeStyle = "#7a1a12"; g.lineWidth = 4; g.beginPath(); g.arc(-280, -60, 56, 0, 7); g.stroke(); font(g, "800", 22); g.fillStyle = "#7a1a12"; g.fillText("NRF", -280, -52);
  g.restore(); }, 1));

// 5. letter
save("letter", plate((g) => {
  g.fillStyle = "#120e0a"; g.fillRect(0, 0, W, H); g.save(); g.translate(W / 2, H / 2); g.rotate(0.02); g.translate(-W / 2, -H / 2);
  paper(g, 360, -40, 1200, 1160, "#e8dfc8", 0.7);
  g.strokeStyle = "#7a1a12"; g.lineWidth = 5; g.beginPath(); g.arc(960, 90, 54, 0, 7); g.stroke(); font(g, "900", 26); g.fillStyle = "#7a1a12"; g.textAlign = "center"; g.fillText("NRF", 960, 99);
  font(g, "800", 36, ASM); g.fillStyle = "#1a1410"; g.fillText("বন বিভাগ · নীলকণ্ঠ সংৰক্ষিত বনাঞ্চল", 960, 196); font(g, "700", 26); g.fillText("FOREST DEPARTMENT · Office of the Range Officer · Order No. NRF/98/13", 960, 244);
  g.fillStyle = "#1a1410"; g.fillRect(460, 270, 1000, 3);
  font(g, "600", 28); g.textAlign = "left"; g.fillText("Subject: Special Night Duty (Temporary)", 470, 330);
  const lines = ["You have been selected for special night duty", "at Neelkanth Reserve Forest.", "", "Duration:  7 nights", "Remuneration:  ₹5,000 per night (cash)", "Report at:  Main Gate, 4:00 PM"];
  lines.forEach((t, i) => g.fillText(t, 470, 400 + i * 52));
  g.fillStyle = "rgba(255,226,90,0.45)"; g.fillRect(462, 548, 640, 50); g.fillRect(462, 600, 700, 50); // highlighter
  font(g, "italic 600", 26); g.fillStyle = "#3a2a1a"; g.fillText("Range Officer", 1180, 820); g.strokeStyle = "#1a2a5a"; g.lineWidth = 3; g.beginPath(); g.moveTo(1160, 790); g.bezierCurveTo(1220, 740, 1260, 820, 1330, 770); g.stroke();
  g.strokeStyle = "rgba(122,26,18,0.7)"; g.lineWidth = 6; g.save(); g.translate(700, 860); g.rotate(-0.18); g.strokeRect(-190, -46, 380, 92); font(g, "900", 40); g.fillStyle = "rgba(122,26,18,0.75)"; g.textAlign = "center"; g.fillText("CONFIDENTIAL", 0, 14); g.restore();
  g.restore(); lamp(g, 300, 1000, 700, 0.18); }, 1));

// 6. contract with the NDA line + Arjun's signature
save("contract", plate((g) => {
  g.fillStyle = "#14100c"; g.fillRect(0, 0, W, H); g.save(); g.translate(W / 2, H / 2); g.rotate(-0.04); g.translate(-W / 2, -H / 2);
  paper(g, 300, 40, 1320, 1080, "#ece4ce", 0.6);
  font(g, "900", 38); g.fillStyle = "#1a1410"; g.textAlign = "center"; g.fillText("CONTRACT · চুক্তি পত্ৰ", 960, 130);
  font(g, "600", 24); g.textAlign = "left"; g.fillStyle = "#2a2018";
  for (let i = 0; i < 6; i++) { const y = 200 + i * 46; g.fillText(`${i + 1}.`, 380, y); g.fillStyle = "rgba(40,30,20,0.35)"; g.fillRect(420, y - 16, 900 + r() * 200, 14); g.fillStyle = "#2a2018"; }
  g.fillStyle = "rgba(255,226,90,0.55)"; g.fillRect(372, 486, 1180, 62);
  font(g, "800", 34); g.fillStyle = "#1a1410"; g.fillText("7.  You shall not tell anyone about this duty.", 380, 528);
  font(g, "600", 22); g.fillStyle = "#4a3a2a"; font(g, "700", 24, ASM); g.fillText("এই কৰ্তব্যৰ বিষয়ে কাকো একো নক'ব।  (Violation: full payment forfeited.)", 420, 582);
  for (let i = 0; i < 3; i++) { g.fillStyle = "rgba(40,30,20,0.3)"; g.fillRect(420, 640 + i * 44, 1000, 14); }
  g.fillStyle = "#1a1410"; g.fillRect(400, 900, 420, 3); g.fillRect(1100, 900, 420, 3); font(g, "600", 22); g.fillText("Signature (Guard)", 400, 935); g.fillText("Gate Officer: R. Barua", 1100, 935);
  g.strokeStyle = "#1a2a6a"; g.lineWidth = 4; g.beginPath(); g.moveTo(420, 890); g.bezierCurveTo(480, 820, 520, 900, 580, 850); g.bezierCurveTo(620, 820, 660, 880, 760, 860); g.stroke(); // Arjun's signature
  g.restore();
  g.save(); g.translate(1500, 980); g.rotate(-0.6); g.fillStyle = "#14141a"; g.fillRect(-14, -220, 28, 260); g.fillStyle = "#c8a85a"; g.fillRect(-14, -230, 28, 30); g.restore(); // pen
  lamp(g, 1700, 200, 700, 0.2); }, 1));

// 7. key with tag "4" in an old palm
save("key4", plate((g) => {
  night(g); blot(g, 960, 560, 700, "rgba(255,170,90,0.25)");
  g.fillStyle = "#8e6248"; g.beginPath(); g.ellipse(960, 640, 420, 300, 0.1, 0, 7); g.fill(); // palm
  g.strokeStyle = "rgba(60,36,24,0.6)"; g.lineWidth = 3; for (const [a, b, c, d] of [[700, 600, 1200, 560], [760, 700, 1180, 690], [820, 520, 900, 820]]) { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo((a + c) / 2, (b + d) / 2 - 40, c, d); g.stroke(); } // palm lines
  for (const [x, y, a] of [[620, 420, -0.5], [760, 330, -0.2], [930, 300, 0], [1100, 330, 0.2]]) { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = "#86593f"; g.beginPath(); g.ellipse(0, 0, 70, 160, 0, 0, 7); g.fill(); g.restore(); }
  g.save(); g.translate(980, 640); g.rotate(-0.4); g.fillStyle = "#b39a52"; g.beginPath(); g.arc(-160, 0, 60, 0, 7); g.fill(); g.fillStyle = "#8e6248"; g.beginPath(); g.arc(-160, 0, 24, 0, 7); g.fill();
  g.fillStyle = "#b39a52"; g.fillRect(-110, -16, 260, 32); for (const x of [90, 120]) g.fillRect(x, 16, 18, 34); g.restore();
  g.save(); g.translate(760, 760); g.rotate(0.2); g.fillStyle = "#e8dcc0"; g.beginPath(); g.roundRect(-90, -60, 180, 120, 12); g.fill(); g.strokeStyle = "#5a4020"; g.lineWidth = 3; g.stroke(); font(g, "900", 92); g.fillStyle = "#3a1a10"; g.textAlign = "center"; g.fillText("4", 0, 34); g.restore(); }, 1));

// 8. wristwatch 2:39 / 2:40
for (const t of ["2:39", "2:40"]) save("watch_" + t.replace(":", ""), plate((g) => {
  night(g); g.fillStyle = "#a8765a"; g.fillRect(0, 380, W, 380); g.fillStyle = "rgba(0,0,0,0.4)"; g.fillRect(0, 380, W, 380); // wrist
  g.fillStyle = "#1c1c1e"; g.fillRect(760, 200, 400, 720); g.fillStyle = "#2c2c30"; g.beginPath(); g.roundRect(700, 330, 520, 420, 40); g.fill();
  g.fillStyle = "#8a9a7a"; g.beginPath(); g.roundRect(760, 400, 400, 230, 10); g.fill(); blot(g, 960, 515, 260, "rgba(140,220,120,0.35)");
  font(g, "700", 150, MONO); g.fillStyle = "#16200e"; g.textAlign = "center"; g.fillText(t, 960, 570); font(g, "700", 30, MONO); g.fillText("AM", 1110, 440);
  font(g, "700", 26); g.fillStyle = "#9a9a9a"; g.fillText("LIGHT", 960, 700); }, 0));

// 9. registers
const regPage = (g, rows, big) => { g.fillStyle = "#0e0b08"; g.fillRect(0, 0, W, H); g.save(); g.translate(W / 2, H / 2); g.rotate(-0.03); g.translate(-W / 2, -H / 2);
  paper(g, 200, 60, 1520, 980, "#e2d8bc", 1.2); g.strokeStyle = "rgba(160,40,30,0.6)"; g.lineWidth = 3; g.beginPath(); g.moveTo(330, 60); g.lineTo(330, 1040); g.stroke();
  for (let y = 228; y < 1040; y += 74) { g.strokeStyle = "rgba(60,90,140,0.35)"; g.lineWidth = 2; g.beginPath(); g.moveTo(200, y); g.lineTo(1720, y); g.stroke(); }
  font(g, "italic 600", 50); g.fillStyle = "#1a2450"; g.textAlign = "left"; rows.forEach(([t, c], i) => { g.fillStyle = c ?? "#1a2450"; g.fillText(t, 380, 214 + i * 74); });
  if (big) { font(g, "italic 800", 70); g.fillStyle = big[1]; g.textAlign = "right"; g.fillText(big[0], 1660, 1000); }
  g.restore(); lamp(g, 1800, 900, 800, 0.22); };
save("reg_11", plate((g) => regPage(g, [["Raat 1 — Subah haazri", "#1a2450"], ["T1  Bhola Ram  ✓"], ["T2  Lakhan  ✓"], ["T3  Rinku  ✓"], ["T4  ____________", "#1a2450"], ["T5  Imran  ✓"], ["T6  Kishan  ✓"], ["T7  Mohan  ✓"], ["T8  Biren  ✓"], ["T9  Dev  ✓"], ["T10 Joseph ✓  T11 Sameer ✓  T12 Tenzing ✓"]], ["Haazir: 11", "#8a1a12"]), 1));
save("reg_lapata", plate((g) => regPage(g, [["Batch 2026 — Gate Register", "#1a2450"], ["Raat 1 · Tower 4 · Arjun · LAPATA", "#8a1a12"], ["Raat 2 · Tower 3 · Rinku · LAPATA", "#8a1a12"], ["Raat 3 · Tower 7 · Mohan · LAPATA", "#8a1a12"], ["Raat 4 · Tower 11 · Sameer · LAPATA", "#8a1a12"], ["Raat 5 · Tower 9 · Dev · LAPATA", "#8a1a12"], ["Raat 6 · Tower 6 · Kishan · LAPATA", "#8a1a12"], ["Raat 7 · Tower 1 · Bhola Ram · LAPATA", "#8a1a12"]], ["Barah bheje · Paanch wapas", "#1a2450"]), 1));
save("reg_2027", plate((g) => regPage(g, [["Batch 2027 — Tower Allotment", "#1a2450"], ["Tower 1  ____________"], ["Tower 2  ____________"], ["Tower 3  ____________"], ["Tower 4  ____________"], ["   . . .", "#1a2450"], ["Tower 12 ____________"], ["Tower 13 · Arjun", "#8a1a12"]], null), 1));

// 10. 1998 newspaper
save("paper1998", plate((g) => {
  g.fillStyle = "#0e0b08"; g.fillRect(0, 0, W, H); g.save(); g.translate(W / 2, H / 2); g.rotate(0.03); g.translate(-W / 2, -H / 2);
  paper(g, 260, 40, 1400, 1020, "#cdbf98", 2.2);
  font(g, "800", 76, ASM); g.fillStyle = "#1a140e"; g.textAlign = "center"; g.fillText("পূৱৰ বাতৰি", 960, 140); font(g, "700", 24); g.fillText("Guwahati · 14 August 1998 · ₹2", 960, 180); g.fillRect(300, 196, 1320, 4);
  font(g, "800", 62, ASM); g.fillText("নীলকণ্ঠ অৰণ্যত ১৩ জনীয়া", 960, 290); g.fillText("জৰীপ দল নিৰুদ্দেশ", 960, 370);
  font(g, "800", 34); g.fillText("13-member survey team missing in Neelkanth forest", 960, 430);
  { const ph = g.createLinearGradient(0, 470, 0, 890); ph.addColorStop(0, "#7a6e58"); ph.addColorStop(1, "#3e382c"); g.fillStyle = ph; g.fillRect(320, 470, 600, 420);
    for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(30,26,20,${0.5 + r() * 0.4})`; const x = 320 + i * 44 + r() * 20, w = 10 + r() * 14; g.fillRect(x, 470, w, 300); g.beginPath(); g.ellipse(x + w / 2, 500 + r() * 40, 50 + r() * 30, 40, 0, 0, 7); g.fill(); } // tree trunks + canopy
    g.fillStyle = "#2a241c"; g.fillRect(320, 800, 600, 90); // ground
    g.fillStyle = "#1e1a14"; g.beginPath(); g.moveTo(480, 820); g.lineTo(500, 760); g.lineTo(620, 750); g.lineTo(660, 785); g.lineTo(760, 790); g.lineTo(770, 830); g.closePath(); g.fill(); // jeep silhouette
    for (const x of [520, 730]) { g.beginPath(); g.arc(x, 832, 22, 0, 7); g.fill(); }
    for (let i = 0; i < 4; i++) { g.fillStyle = "rgba(20,18,14,0.9)"; g.fillRect(560 + i * 55, 700, 14, 110); g.beginPath(); g.arc(567 + i * 55, 690, 12, 0, 7); g.fill(); } // search party figures
    for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.25})`; g.fillRect(320 + r() * 600, 470 + r() * 420, 2, 2); } // halftone grit
    font(g, "italic 600", 20); g.fillStyle = "#2a2018"; g.fillText("Photo: search party near the abandoned survey jeep", 620, 920); }
  for (let col = 0; col < 2; col++) for (let i = 0; i < 16; i++) { g.fillStyle = "rgba(30,24,16,0.55)"; g.fillRect(960 + col * 330, 480 + i * 30, 290 - (i % 4) * 30, 12); }
  for (let i = 0; i < 40; i++) blot(g, 260 + r() * 1400, 40 + r() * 1020, 30 + r() * 80, "rgba(110,80,40,0.15)");
  g.restore(); lamp(g, 200, 300, 700, 0.18); }, 1));

module.exports = { MAPC, dotXY };
console.log("inserts ok");

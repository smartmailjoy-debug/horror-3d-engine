// renders a hand-picked list of frames (via fmap input prop) in one page
import fs from "node:fs";
if (process.env.REMOTION_TMP) { fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true }); process.env.TEMP = process.env.TMP = process.env.REMOTION_TMP; }
import { bundle } from "@remotion/bundler";
import { renderFrames, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [comp, outDir, mapFile, scale = "0.25"] = process.argv.slice(2);
const { fmap } = JSON.parse(fs.readFileSync(mapFile, "utf8"));
fs.mkdirSync(outDir, { recursive: true });
const chromiumOptions = { gl: "swangle" };
const inputProps = { preview: true, fmap, post: { dpr: Number(process.env.DPR || 1), ...(process.env.FAST ? { fast: true } : {}), ...(process.env.TREES ? { trees: Number(process.env.TREES) } : {}), ...(process.env.NOINK ? { noink: true } : {}), ...(process.env.LOOK ? { look: process.env.LOOK } : {}) } };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: comp, chromiumOptions, inputProps });
const t0 = Date.now();
await renderFrames({ composition, serveUrl, outputDir: outDir, imageFormat: "jpeg", jpegQuality: 85, scale: Number(scale), frameRange: [0, fmap.length - 1],
  concurrency: 1, chromiumOptions, timeoutInMilliseconds: 600000, inputProps,
  onFrameUpdate: (n) => { console.log("frames", n, ((Date.now() - t0) / 1000).toFixed(0) + "s"); } });
console.log("DONE", comp, ((Date.now() - t0) / 1000).toFixed(0) + "s");

// World check stills: 8 fixed cameras across the Neelkanth set.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, staticFile, useCurrentFrame, delayRender, continueRender, getInputProps } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass } from "../bridge/ink";
import { GradeEffect, GradeParams } from "../bridge/grade";
import { A, loadAll, assetsReady } from "./assets";
import { buildWorld, World, TimeOfDay, onTower, towerXZ, CAMP, GATE, FENCE_R, QUALITY } from "./world";

export function card(name: string, heightM: number) {
  const m = A.chMeta[name], t = A.ch[name];
  const pxPerM = m.px / heightM, w = m.w / pxPerM, h = m.h / pxPerM;
  const geo = new THREE.PlaneGeometry(w, h); const fx = (m.feetX ?? m.w / 2) / m.w, fy = m.feetY / m.h;
  geo.translate(w * (0.5 - fx), h * (fy - 0.5), 0);
  const mat = new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.04, roughness: 1, metalness: 0, emissive: "#ffffff", emissiveMap: t, emissiveIntensity: 0.55, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat); mesh.renderOrder = 2; mesh.castShadow = true; return mesh;
}
const GR: Record<TimeOfDay, GradeParams> = {
  night: { ky: [0.01, 0.1, 0.27, 0.56, 0.81, 0.94, 0.995], sat: [0.72, 0.9, 0.95], tintS: [0.055, -0.03], tintM: [0.006, -0.006], tintH: [-0.03, 0.03], vig: [0.62, 0.16] },
  dawn: { ky: [0.02, 0.12, 0.28, 0.54, 0.78, 0.92, 0.99], sat: [0.7, 0.78, 0.85], tintS: [0.03, -0.02], tintM: [0.0, 0.0], tintH: [-0.01, 0.01], vig: [0.5, 0.2] },
  day: { ky: [0.02, 0.11, 0.27, 0.53, 0.78, 0.92, 0.99], sat: [0.8, 0.85, 0.9], tintS: [0.02, -0.01], tintM: [-0.005, 0.005], tintH: [-0.01, 0.02], vig: [0.45, 0.22] },
  dusk: { ky: [0.01, 0.1, 0.27, 0.55, 0.8, 0.93, 0.99], sat: [0.8, 0.9, 0.95], tintS: [0.04, -0.03], tintM: [-0.01, 0.01], tintH: [-0.03, 0.04], vig: [0.55, 0.18] },
};
type Shot = { cam: THREE.Vector3; look: THREE.Vector3; fov: number; t: TimeOfDay; fog?: number; cast?: [string, number, THREE.Vector3][] };
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const FA = Math.PI * 0.72, fp = (a: number, r: number, y: number) => v(Math.cos(a) * r, y, Math.sin(a) * r);
const SH: Shot[] = [
  { cam: v(-170, 240, 360), look: v(0, 0, 30), fov: 46, t: "day", fog: 0.0012 },
  { cam: v(-6, 1.7, GATE.z + 16), look: v(0, 2.3, GATE.z), fov: 44, t: "night" },
  { cam: v(4.5, 1.6, GATE.z + 8.5), look: v(-0.5, 2.0, GATE.z), fov: 46, t: "day" },
  { cam: onTower(4, 1.95, 1.95, 9.9), look: onTower(4, -0.6, -0.7, 8.3), fov: 58, t: "day" },
  { cam: v(-26, 3, CAMP.z + 26), look: v(12, 9, CAMP.z), fov: 52, t: "dusk" },
  { cam: fp(FA, FENCE_R - 7, 1.7), look: fp(FA + 0.07, FENCE_R, 1.4), fov: 46, t: "day" },
  { cam: onTower(4, 0.2, 0.4, 9.7), look: v(towerXZ(3)[0], 7, towerXZ(3)[1]), fov: 50, t: "night" },
  { cam: v(10, 3, 16), look: v(0, 6, 0), fov: 50, t: "day" },
];

const Scene: React.FC<{ s: Shot }> = ({ s }) => {
  const { scene, camera, gl } = useThree();
  const W = useMemo<World>(() => { gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap; return buildWorld(); }, [gl]);
  const cards = useMemo(() => (s.cast ?? []).map(([n, h, p]) => { const c = card(n, h); c.position.copy(p); return c; }), [s]);
  W.setTime(s.t, scene); if (s.fog !== undefined) (scene.fog as THREE.FogExp2).density = s.fog;
  W.setLamps(() => true); W.setNear(s.cam, s.look);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { color: "#07090e", strength: 0.45, widthNear: 1.4, widthFar: 1.0, creaseScale: 0.4, concaveGain: 0.2, angleLo: 50, angleHi: 70 }),
    bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 1.1, luminanceThreshold: 0.82, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 7, radius: 0.75 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }), grade: new GradeEffect(GR[s.t], 1),
  }), [scene, camera, s.t]);
  const cam = camera as THREE.PerspectiveCamera; cam.position.copy(s.cam); cam.fov = s.fov; cam.near = 0.05; cam.far = 900; cam.updateProjectionMatrix(); cam.lookAt(s.look);
  for (const c of cards) c.lookAt(cam.position.x, c.position.y, cam.position.z);
  return (<>
    <primitive object={W.root} dispose={null} />
    {cards.map((c, i) => <primitive key={i} object={c} dispose={null} />)}
    <EffectComposer multisampling={4}>
      {[<primitive key="ink" object={fx.ink} dispose={null} />, <primitive key="bloom" object={fx.bloom} dispose={null} />, <primitive key="tone" object={fx.tone} dispose={null} />, <primitive key="grade" object={fx.grade} dispose={null} />]}
    </EffectComposer>
  </>);
};
{ const pp = (getInputProps() as { post?: { fast?: boolean } }).post; if (pp?.fast) Object.assign(QUALITY, { trees: 8, under: 70, shadow: 1024 }); }
const dpr = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;
export const T13World: React.FC = () => {
  const f0 = useCurrentFrame(); const fm = (getInputProps() as { fmap?: number[] }).fmap; const f = fm ? (fm[f0] ?? f0) : f0;
  const [ok, setOk] = useState(assetsReady);
  const [h] = useState(() => (assetsReady ? null : delayRender("t13 assets", { timeoutInMilliseconds: 600000 })));
  useEffect(() => { if (h === null) return; loadAll().then(() => { setOk(true); continueRender(h); }); }, [h]);
  const s = SH[f % SH.length]; void towerXZ; void CAMP; void GATE;
  return (<AbsoluteFill style={{ background: "#05070c" }}>
    <ThreeCanvas width={1920} height={1080} {...(dpr() ? { dpr: dpr() } : {})} shadows gl={{ antialias: false, stencil: false }} camera={{ fov: 40, near: 0.05, far: 900 }}>
      {ok ? <Scene key={f} s={s} /> : null}
    </ThreeCanvas>
    <AbsoluteFill style={{ backgroundImage: `url(${staticFile(`ek/grain${f % 4}.png`)})`, backgroundSize: "540px 540px", mixBlendMode: "overlay", opacity: 0.12 }} />
  </AbsoluteFill>);
};

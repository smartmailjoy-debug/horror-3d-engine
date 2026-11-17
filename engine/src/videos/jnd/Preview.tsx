// Asset contact sheet: one Drive model per frame, auto-framed, neutral light, name burned in.
import React, { useEffect, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, staticFile, useCurrentFrame, delayRender, continueRender, getInputProps } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { PREVIEW } from "./previewList";

const Fit: React.FC<{ obj: THREE.Object3D }> = ({ obj }) => {
  const { camera, scene } = useThree();
  scene.background = new THREE.Color("#8a929c");
  const b = new THREE.Box3().setFromObject(obj), c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3());
  const r = Math.max(s.x, s.y, s.z) * 0.62 + 1e-3, cam = camera as THREE.PerspectiveCamera;
  cam.fov = 35; cam.near = r / 100; cam.far = r * 50; cam.position.set(c.x + r * 1.5, c.y + r * 0.9, c.z + r * 1.9); cam.lookAt(c); cam.updateProjectionMatrix();
  return (<>
    <hemisphereLight args={["#ffffff", "#444444", 1.6]} />
    <directionalLight position={[c.x + r * 3, c.y + r * 5, c.z + r * 4]} intensity={2.2} />
    <primitive object={obj} dispose={null} />
  </>);
};
const One: React.FC<{ name: string; f: number }> = ({ name, f }) => {
  const [obj, setObj] = useState<THREE.Object3D | null>(null);
  const [h] = useState(() => delayRender("model " + name, { timeoutInMilliseconds: 600000 }));
  useEffect(() => { new GLTFLoader().load(staticFile((name.startsWith("d:") ? "jnd/dmodels/" + name.slice(2) : "jnd/drive/" + name)), (g) => { setObj(g.scene); continueRender(h); }, undefined, () => continueRender(h)); }, [h, name]);
  return (
    <AbsoluteFill style={{ background: "#8a929c" }}>
      <ThreeCanvas width={640} height={480} gl={{ antialias: true }} camera={{ fov: 35 }}>{obj ? <Fit obj={obj} /> : null}</ThreeCanvas>
      <div style={{ position: "absolute", left: 12, bottom: 10, font: "600 18px sans-serif", color: "#fff", textShadow: "0 1px 3px #000" }}>{f + 1}. {name.replace(".glb", "")}</div>
    </AbsoluteFill>
  );
};
export const AssetPreview: React.FC = () => {
  const f0 = useCurrentFrame(); const fm = (getInputProps() as { fmap?: number[] }).fmap; const f = fm ? (fm[f0] ?? f0) : f0;
  const name = PREVIEW[f % PREVIEW.length];
  return <One key={name} name={name} f={f} />;
};

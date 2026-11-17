// Renders impostor sprites (side + top) of tree models on a key-green background, orthographic, flat soft light.
import React, { useEffect, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, staticFile, useCurrentFrame, delayRender, continueRender, getInputProps } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
export const IMP = [
  ["models/island_tree_01.glb", "side"], ["models/island_tree_01.glb", "top"],
  ["models/island_tree_02.glb", "side"], ["models/island_tree_02.glb", "top"],
  ["models/island_tree_03.glb", "side"], ["models/island_tree_03.glb", "top"],
  ["dmodels/bambooset.glb", "side"], ["dmodels/bambooset.glb", "top"],
  ["models/dead_tree_trunk_02.glb", "side"], ["models/dead_tree_trunk_02.glb", "top"],
] as const;
const Fit: React.FC<{ obj: THREE.Object3D; view: string }> = ({ obj, view }) => {
  const { scene, camera } = useThree();
  scene.background = new THREE.Color("#00ff00");
  const b = new THREE.Box3().setFromObject(obj), c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3());
  const half = (view === "top" ? Math.max(s.x, s.z) : Math.max(s.x, s.y, s.z)) / 2 * 1.02;
  const cam = camera as THREE.OrthographicCamera; Object.assign(cam, { left: -half, right: half, top: half, bottom: -half, near: 0.01, far: 1000, zoom: 1 });
  if (view === "top") { cam.position.set(c.x, b.max.y + 50, c.z); cam.up.set(0, 0, -1); cam.lookAt(c.x, 0, c.z); }
  else { cam.position.set(c.x, b.min.y + half, c.z + 200); cam.lookAt(c.x, b.min.y + half, c.z); }
  cam.updateProjectionMatrix();
  obj.traverse((m) => { const mm = m as THREE.Mesh; if (mm.isMesh) { const mt = mm.material as THREE.MeshStandardMaterial; mt.roughness = 1; mt.metalness = 0; if (mt.map) mt.alphaTest = 0.5; mt.transparent = false; } });
  return (<>
    <hemisphereLight args={["#ffffff", "#606060", 1.5]} />
    <directionalLight position={[c.x + 30, c.y + 60, c.z + 50]} intensity={2.0} />
    <directionalLight position={[c.x - 40, c.y + 20, c.z + 30]} intensity={0.6} />
    <primitive object={obj} dispose={null} />
  </>);
};
const One: React.FC<{ f: number }> = ({ f }) => {
  const [file, view] = IMP[f % IMP.length];
  const [obj, setObj] = useState<THREE.Object3D | null>(null);
  const [h] = useState(() => delayRender("imp " + file, { timeoutInMilliseconds: 600000 }));
  useEffect(() => { new GLTFLoader().load(staticFile("jnd/" + file), (g) => { setObj(g.scene); continueRender(h); }); }, [h, file]);
  return (<AbsoluteFill style={{ background: "#00ff00" }}>
    <ThreeCanvas width={1024} height={1024} orthographic gl={{ antialias: true }}>{obj ? <Fit obj={obj} view={view} /> : null}</ThreeCanvas>
  </AbsoluteFill>);
};
export const Impostors: React.FC = () => {
  const f0 = useCurrentFrame(); const fm = (getInputProps() as { fmap?: number[] }).fmap; const f = fm ? (fm[f0] ?? f0) : f0;
  return <One key={f} f={f} />;
};

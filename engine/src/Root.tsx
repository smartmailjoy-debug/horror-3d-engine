import React from "react";
import { Composition, staticFile } from "remotion";
import { Tower13, T13_FRAMES } from "./videos/t13/Film";
import { T13World } from "./videos/t13/WorldTest";
import { Impostors } from "./videos/t13/Impostor";
import { AssetPreview } from "./videos/jnd/Preview";
const fonts = `@font-face{font-family:Poppins;font-weight:800;src:url(${staticFile("fonts/poppins-latin-800-normal.woff2")})}@font-face{font-family:Inter;font-weight:600;src:url(${staticFile("fonts/inter-latin-600-normal.woff2")})}@font-face{font-family:"IBM Plex Mono";font-weight:500;src:url(${staticFile("fonts/ibm-plex-mono-latin-500-normal.woff2")})}`;
export const Root: React.FC = () => (<><style>{fonts}</style>
  {/* the film */}
  <Composition id="TOWER13" component={Tower13} durationInFrames={T13_FRAMES} fps={30} width={1920} height={1080} defaultProps={{}} />
  {/* 8 fixed world-check cameras (layout, gate, fence, tower interior, camp) */}
  <Composition id="T13WORLD" component={T13World} durationInFrames={8} fps={30} width={1920} height={1080} />
  {/* renders the tree impostor sprites into public/t13/imp */}
  <Composition id="IMPOSTORS" component={Impostors} durationInFrames={10} fps={30} width={1024} height={1024} />
  {/* contact sheet of models listed in src/videos/jnd/previewList.ts ("d:name.glb" = public/jnd/dmodels) */}
  <Composition id="ASSETS" component={AssetPreview} durationInFrames={41} fps={30} width={640} height={480} />
</>);

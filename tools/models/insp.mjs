import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/core';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(process.argv[2]);
const sc = doc.getRoot().listScenes()[0];
const b = getBounds(sc); console.log('scene', b.min.map(v=>v.toFixed(1)), b.max.map(v=>v.toFixed(1)));
const groups = {};
for (const n of doc.getRoot().listNodes()) { if (!n.getMesh()) continue; const nm = n.getName(); const key = nm.replace(/_[a-z]+(_[a-z]+)*_0$/,'').slice(0,40);
  const bb = getBounds(n); (groups[key] ||= []).push([nm, bb]); }
for (const [k, arr] of Object.entries(groups)) { const mn=[1e9,1e9,1e9], mx=[-1e9,-1e9,-1e9]; for (const [,bb] of arr) for (let i=0;i<3;i++){mn[i]=Math.min(mn[i],bb.min[i]);mx[i]=Math.max(mx[i],bb.max[i]);} console.log(k, arr.length, mn.map(v=>v.toFixed(1)).join(','), '|', mx.map(v=>v.toFixed(1)).join(',')); }

/*
  Phaeron · Layer 01 · Data — "Six fragments, one form"
  Standalone three.js module (abstract edition). Previous literal-icon edition: data-layer-literal.js.

  Concept: each source of knowledge is a fragment of one disc, inscribed with its own line-language
  (Data: concentric records · Clients: individual marks · Internal: a system grid · Rules: parallel
  hatching · Markets: waveforms · People: clusters). At first the fragments float apart at different
  heights, each caged in a fine wire silo. The cages dissolve, the fragments descend and lock together,
  crimson seams trace the joins (kintsugi), and Phaeron rises in the centre. Knowledge then circulates.

  Contract (same shape arch-app-v2.js expects from every layer):
    { key, group, meshes, materials, lineMats, labels, parts, flows, roots, plateH, hub,
      animate(dt), replay(), seek(seconds), setPlaying(bool), duration, time }
  - Plate footprint 4 × 4 world units, centred, top face at y = 0.
  - Clickable meshes: userData = { layer, part, eTop }, material array [side, top].
  - labels[i].visible is updated every frame.

  Wiring into arch-app-v2.js:
    import { buildDataLayer } from './layers/data-layer.js';
    // builder:            l.key === 'data' ? buildDataLayer() : ...
    // animation block:    anims.push((dt) => built[0].animate(dt));
    // placeOverlay():     if (lb.visible === false) { el.style.opacity = '0'; continue; }
    // optional select():  if (layer === 0) built[0].replay();
*/
import * as THREE from 'three';

export const SILOS = [
  { id: 'data',     name: 'Data',               sub: 'Warehouses · lakes',  color: '#305878' },
  { id: 'clients',  name: 'Clients',            sub: 'Accounts · history',  color: '#8C2F3D' },
  { id: 'internal', name: 'Internal systems',   sub: 'CRM · ERP · core',    color: '#183255' },
  { id: 'rules',    name: 'Rules & regulation', sub: 'Policy · compliance', color: '#6E1F2B' },
  { id: 'markets',  name: 'Markets',            sub: 'Prices · signals',    color: '#5C7F9E' },
  { id: 'people',   name: 'People',             sub: 'Expertise · teams',   color: '#8A93A6' },
];
const INK = '#0F2445', CRIMSON = '#8f1636', SEAM = '#b3263f';
const RI = 0.52, RO = 1.8, RC = (RI + RO) / 2, TH = 0.045, GAP = 0.02, WALL_H = 0.42, PLATE_H = 0.16;
const T = { walls: [1.3, 2.3], move: [1.7, 3.3], seams: [3.0, 3.9], core: [3.1, 3.9], flow: [3.8, 4.6] };
const TAU = Math.PI * 2;
const clamp = (x) => Math.max(0, Math.min(1, x));
const seg = (t, [a, b]) => clamp((t - a) / (b - a));
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

// ---------- line-languages (world x,z polylines, clipped to the fragment) ----------
const arc = (r, t0, t1, n = 72) => Array.from({ length: n + 1 }, (_, k) => { const t = t0 + ((t1 - t0) * k) / n; return [r * Math.cos(t), r * Math.sin(t)]; });
const circ = (x, z, r, n = 24) => Array.from({ length: n + 1 }, (_, k) => { const t = (k / n) * TAU; return [x + r * Math.cos(t), z + r * Math.sin(t)]; });
const PATTERNS = {
  data: (S) => { const o = []; for (let r = RI + 0.12; r < RO - 0.06; r += 0.12) o.push(arc(r, S.t0, S.t1)); return o; },
  clients: (S) => {
    const o = [];
    for (let r = RI + 0.16; r < RO - 0.08; r += 0.18) {
      const n = Math.max(1, Math.floor((r * (S.t1 - S.t0)) / 0.18));
      for (let k = 0; k < n; k++) { const t = S.t0 + ((S.t1 - S.t0) * (k + 0.5)) / n; o.push(circ(r * Math.cos(t), r * Math.sin(t), 0.026)); }
    }
    return o;
  },
  internal: (S) => {
    const o = [];
    for (let r = RI + 0.25; r < RO - 0.06; r += 0.25) o.push(arc(r, S.t0, S.t1));
    for (let k = 1; k < 4; k++) { const t = S.t0 + ((S.t1 - S.t0) * k) / 4; o.push([[RI * Math.cos(t), RI * Math.sin(t)], [RO * Math.cos(t), RO * Math.sin(t)]].flatMap((p, j, a) => j ? Array.from({ length: 40 }, (_, q) => [a[0][0] + (p[0] - a[0][0]) * (q + 1) / 40, a[0][1] + (p[1] - a[0][1]) * (q + 1) / 40]) : [p])); }
    return o;
  },
  rules: (S) => {
    const o = [], u = [Math.cos(S.a), Math.sin(S.a)], v = [-u[1], u[0]];
    for (let d = RI + 0.08; d < RO; d += 0.09) { const l = []; for (let s = -1.2; s <= 1.2; s += 0.01) l.push([u[0] * d + v[0] * s, u[1] * d + v[1] * s]); o.push(l); }
    return o;
  },
  markets: (S) => {
    const o = [];
    for (let r0 = RI + 0.16; r0 < RO - 0.08; r0 += 0.17) { const l = []; for (let k = 0; k <= 180; k++) { const t = S.t0 + ((S.t1 - S.t0) * k) / 180, r = r0 + 0.022 * Math.sin(t * 24 + r0 * 22); l.push([r * Math.cos(t), r * Math.sin(t)]); } o.push(l); }
    return o;
  },
  people: (S, i) => {
    let s = 17 + i * 131; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const pts = [];
    for (let tries = 0; tries < 400 && pts.length < 16; tries++) {
      const r = RI + 0.1 + rnd() * (RO - RI - 0.18), t = S.t0 + rnd() * (S.t1 - S.t0), rr = 0.014 + rnd() * 0.034;
      const x = r * Math.cos(t), z = r * Math.sin(t);
      if (pts.every((p) => Math.hypot(p[0] - x, p[1] - z) > p[2] + rr + 0.07)) pts.push([x, z, rr]);
    }
    return pts.map(([x, z, r]) => circ(x, z, r));
  },
};
const dashArc = (r, t0, t1, on = 0.03, offd = 0.03) => { const o = [], step = (on + offd) / r; for (let t = t0; t < t1; t += step) o.push(arc(r, t, Math.min(t1, t + on / r), 4)); return o; };
const line = (p, q, n = 30) => Array.from({ length: n + 1 }, (_, k) => [p[0] + ((q[0] - p[0]) * k) / n, p[1] + ((q[1] - p[1]) * k) / n]);
// Secondary, finer line-language drawn in a lighter tint beneath the primary one.
const FINE = {
  data: (S) => {
    const o = [];
    for (let r = RI + 0.18; r < RO - 0.06; r += 0.12) o.push(...dashArc(r, S.t0, S.t1, 0.025, 0.02));
    for (let r = RI + 0.12; r < RO - 0.06; r += 0.12) for (let k = 1; k < 10; k++) { const t = S.t0 + ((S.t1 - S.t0) * k) / 10; o.push(line([r * Math.cos(t), r * Math.sin(t)], [(r + 0.03) * Math.cos(t), (r + 0.03) * Math.sin(t)], 2)); }
    return o;
  },
  clients: (S) => {
    const o = [];
    for (let r = RI + 0.16; r < RO - 0.08; r += 0.18) {
      o.push(arc(r, S.t0, S.t1));
      const n = Math.max(1, Math.floor((r * (S.t1 - S.t0)) / 0.18));
      for (let k = 0; k < n; k++) { const t = S.t0 + ((S.t1 - S.t0) * (k + 0.5)) / n; o.push(circ(r * Math.cos(t), r * Math.sin(t), 0.045, 28)); o.push(circ(r * Math.cos(t), r * Math.sin(t), 0.009, 10)); }
    }
    return o;
  },
  internal: (S) => {
    const o = [];
    for (let r = RI + 0.125; r < RO - 0.04; r += 0.0625) o.push(arc(r, S.t0, S.t1));
    for (let k = 1; k < 16; k++) { const t = S.t0 + ((S.t1 - S.t0) * k) / 16; o.push(line([RI * Math.cos(t), RI * Math.sin(t)], [RO * Math.cos(t), RO * Math.sin(t)], 60)); }
    return o;
  },
  rules: (S) => {
    const o = [], u = [Math.cos(S.a), Math.sin(S.a)], v = [-u[1], u[0]];
    for (let d = RI + 0.125; d < RO; d += 0.09) { const l = []; for (let s = -1.2; s <= 1.2; s += 0.01) l.push([u[0] * d + v[0] * s, u[1] * d + v[1] * s]); o.push(l); }
    const w = [Math.cos(S.a + 0.9), Math.sin(S.a + 0.9)], wn = [-w[1], w[0]];
    for (let d = -2; d < 2; d += 0.16) { const l = []; for (let s = -2; s <= 2; s += 0.01) l.push([w[0] * s + wn[0] * d, w[1] * s + wn[1] * d]); o.push(l); }
    return o;
  },
  markets: (S) => {
    const o = [];
    for (let r0 = RI + 0.16; r0 < RO - 0.08; r0 += 0.17) {
      o.push(...dashArc(r0, S.t0, S.t1, 0.012, 0.02));
      for (const ph of [0.9, 1.8]) { const l = []; for (let k = 0; k <= 180; k++) { const t = S.t0 + ((S.t1 - S.t0) * k) / 180, r = r0 + 0.045 + 0.012 * Math.sin(t * 48 + r0 * 22 + ph); l.push([r * Math.cos(t), r * Math.sin(t)]); } o.push(l); }
    }
    return o;
  },
  people: (S, i, main) => {
    const o = [], cs = main.map((c) => { const xs = c.map((p) => p[0]), zs = c.map((p) => p[1]); return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...zs) + Math.max(...zs)) / 2, (Math.max(...xs) - Math.min(...xs)) / 2]; });
    cs.forEach(([x, z, r]) => { o.push(circ(x, z, r * 0.55, 20)); o.push(circ(x, z, r + 0.018, 28)); });
    cs.forEach((p, j) => cs.slice(j + 1).forEach((q) => { const d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (d < 0.3) { const ux = (q[0] - p[0]) / d, uz = (q[1] - p[1]) / d; o.push(line([p[0] + ux * (p[2] + 0.02), p[1] + uz * (p[2] + 0.02)], [q[0] - ux * (q[2] + 0.02), q[1] - uz * (q[2] + 0.02)], 6)); } }));
    return o;
  },
};
function clip(S, lines) {
  const inside = ([x, z]) => {
    const r = Math.hypot(x, z), dt = Math.atan2(Math.sin(Math.atan2(z, x) - S.a), Math.cos(Math.atan2(z, x) - S.a));
    return r > RI + 0.04 && r < RO - 0.04 && Math.abs(dt) < S.half - 0.04 / r;
  };
  const out = [];
  for (const l of lines) { let run = []; for (const p of l) { if (inside(p)) run.push(p); else { if (run.length > 1) out.push(run); run = []; } } if (run.length > 1) out.push(run); }
  return out;
}

export function buildDataLayer(opts = {}) {
  const KEY = opts.key || 'data';
  const group = new THREE.Group(); group.name = KEY;
  const meshes = [], materials = [], lineMats = [], roots = [];
  const white = new THREE.Color('#ffffff');

  const std = (hex, name, k = 0.25) => {
    const m = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.9, metalness: 0 });
    m.emissive = new THREE.Color(hex).multiplyScalar(k); m.name = `${KEY}.${name}`; m.userData.base = hex; materials.push(m); return m;
  };
  const lineMat = (hex, name, op = 1) => { const m = new THREE.LineBasicMaterial({ color: hex, transparent: op < 1, opacity: op }); m.name = `${KEY}.${name}`; m.userData.baseOpacity = op; lineMats.push(m); return m; };
  const segs = (lines, y, mat, name, parent, dx = 0, dz = 0) => {
    const pos = []; for (const l of lines) for (let k = 0; k + 1 < l.length; k++) pos.push(l[k][0] - dx, y, l[k][1] - dz, l[k + 1][0] - dx, y, l[k + 1][1] - dz);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const ls = new THREE.LineSegments(g, mat); ls.name = `${KEY}.${name}`; ls.raycast = () => {}; parent.add(ls); return ls;
  };
  const mesh = (geo, side, top, part, eTop, name, parent, edge) => {
    const m = new THREE.Mesh(geo, [side, top]); m.name = `${KEY}.${name}`;
    m.userData = { layer: KEY, part, eTop }; parent.add(m); meshes.push(m);
    if (edge) { const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), edge); e.name = m.name + '.edges'; e.raycast = () => {}; m.add(e); }
    return m;
  };
  const box2 = (w, h, d) => { const g = new THREE.BoxGeometry(w, h, d); g.clearGroups(); for (let f = 0; f < 6; f++) g.addGroup(f * 6, 6, f === 2 ? 1 : 0); return g; };
  const cyl2 = (r, h, n) => { const g = new THREE.CylinderGeometry(r, r, h, n); g.groups.forEach((gr) => (gr.materialIndex = gr.materialIndex === 1 ? 1 : 0)); return g; };

  // plate
  const plateSide = std('#8f1636', 'plate.side'), plateTop = std('#fbfbfc', 'plate.top', 0.55);
  const plate = mesh(box2(4, PLATE_H, 4).translate(0, -PLATE_H / 2, 0), plateSide, plateTop, null, 0, 'plate', group, lineMat('#6E1F2B', 'plate.edge'));
  roots.push(plate);
  segs([[[-1.94, -1.94], [1.94, -1.94], [1.94, 1.94], [-1.94, 1.94], [-1.94, -1.94]]], 0.002, lineMat('#e3b5bf', 'plate.inset'), 'plate.inset', group);
  segs([[-1, -1], [1, -1], [1, 1], [-1, 1]].flatMap(([sx, sz]) => [[[sx * 1.72, sz * 1.8], [sx * 1.88, sz * 1.8]], [[sx * 1.8, sz * 1.72], [sx * 1.8, sz * 1.88]]]), 0.002, lineMat('#c98a98', 'plate.marks'), 'plate.marks', group);

  // foundation disc
  const fTop = std('#fae6ea', 'field.top', 0.6);
  const field = mesh(cyl2(RO + 0.12, 0.002, 160).translate(0, 0.001, 0), fTop, fTop, 'core', 0.002, 'field', group);
  field.scale.set(0.001, 1, 0.001);

  // fragments
  const frags = SILOS.map((d, i) => {
    const a = Math.PI / 2 + (i * TAU) / 6, half = Math.PI / 6 - GAP;
    const S = { a, half, t0: a - half, t1: a + half };
    const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), cx = dir.x * RC, cz = dir.z * RC;
    const g = new THREE.Group(); g.name = `${KEY}.fragment.${d.id}`; group.add(g);
    const col = new THREE.Color(d.color);
    const side = std(d.color, `${d.id}.side`), top = std('#' + col.clone().lerp(white, 0.92).getHexString(), `${d.id}.top`, 0.6);
    const edge = lineMat('#' + col.clone().multiplyScalar(0.85).getHexString(), `${d.id}.edge`);
    const outline = [...arc(RO, S.t0, S.t1, 64), ...arc(RI, S.t1, S.t0, 32)];
    const shape = new THREE.Shape(); outline.forEach(([x, z], k) => (k ? shape.lineTo(x - cx, -(z - cz)) : shape.moveTo(x - cx, -(z - cz))));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: TH, bevelEnabled: false, curveSegments: 1 }); geo.rotateX(-Math.PI / 2);
    geo.groups.forEach((gr) => (gr.materialIndex = 1 - gr.materialIndex));
    mesh(geo, side, top, d.id, TH, `${d.id}.fragment`, g, edge);
    const main = PATTERNS[d.id](S, i);
    segs(clip(S, FINE[d.id](S, i, main)), TH + 0.001, lineMat('#' + col.clone().lerp(white, 0.62).getHexString(), `${d.id}.pattern.fine`), `${d.id}.pattern.fine`, g, cx, cz);
    segs(clip(S, main), TH + 0.0015, lineMat(d.color, `${d.id}.pattern`), `${d.id}.pattern`, g, cx, cz);
    // wire silo cage (unit height, scaled)
    const cage = new THREE.Group(); cage.name = `${KEY}.${d.id}.cage`; g.add(cage);
    const cm = new THREE.LineBasicMaterial({ color: d.color, transparent: true, opacity: 0.35 }); cm.name = `${KEY}.${d.id}.cage`;
    const ring = [...outline, outline[0]], pos = [];
    for (const y of [0, 1]) for (let k = 0; k + 1 < ring.length; k++) pos.push(ring[k][0] - cx, y, ring[k][1] - cz, ring[k + 1][0] - cx, y, ring[k + 1][1] - cz);
    for (const p of [outline[0], outline[32], outline[64], outline[65], outline[outline.length - 1]]) pos.push(p[0] - cx, 0, p[1] - cz, p[0] - cx, 1, p[1] - cz);
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const cl = new THREE.LineSegments(cg, cm); cl.raycast = () => {}; cl.name = cm.name; cage.add(cl);
    const hy = 0.08 + ((i * 3) % 6) * 0.035, tw = (i % 2 ? 1 : -1) * (0.06 + (i % 3) * 0.04);
    const anchor = new THREE.Object3D(); anchor.position.set(dir.x * (RO - RC - 0.12), 0.08, dir.z * (RO - RC - 0.12)); g.add(anchor);
    const c = new THREE.Vector3(cx, 0, cz);
    return { d, S, g, cage, cm, dir, c, hy, tw, col, anchor };
  });

  // kintsugi seams
  const seamMat = lineMat(SEAM, 'seams', 0); seamMat.transparent = true;
  const radials = frags.map((f) => { const b = f.S.a + Math.PI / 6; return [[(RI - 0.02) * Math.cos(b), (RI - 0.02) * Math.sin(b)], [(RO + 0.04) * Math.cos(b), (RO + 0.04) * Math.sin(b)]]; });
  segs(radials, 0.004, seamMat, 'seams.radial', group);
  const outerPts = arc(RO + 0.07, Math.PI / 2, Math.PI / 2 + TAU, 256).map(([x, z]) => new THREE.Vector3(x, 0.004, z));
  const outerMat = new THREE.LineBasicMaterial({ color: SEAM }); outerMat.name = KEY + '.seams.outer'; outerMat.userData.baseOpacity = 1; lineMats.push(outerMat);
  const outer = new THREE.Line(new THREE.BufferGeometry().setFromPoints(outerPts), outerMat); outer.name = KEY + '.seams.outer'; outer.raycast = () => {}; group.add(outer);

  // Phaeron core
  const core = new THREE.Group(); core.name = `${KEY}.core`; group.add(core);
  const coreSide = std(CRIMSON, 'core.side'), coreTop = std('#ffffff', 'core.top', 0.6), coreEdge = lineMat('#6E1F2B', 'core.edge');
  mesh(cyl2(0.43, 0.06, 96).translate(0, 0.03, 0), coreSide, coreTop, 'core', 0.06, 'core.base', core, coreEdge);
  const wheel = new THREE.Group(); wheel.name = KEY + '.core.phaeron-mark'; wheel.position.y = 0.0615; wheel.scale.set(1.15, 1, 1.15); core.add(wheel);
  {
    const L = [];
    const ringL = (r, n = 96) => L.push(circ(0, 0, r, n));
    ringL(0.29); ringL(0.235, 80); ringL(0.06, 40);
    for (let k = 0; k < 8; k++) { const t = (k / 8) * TAU; L.push([[Math.cos(t) * 0.07, Math.sin(t) * 0.07], [Math.cos(t) * 0.225, Math.sin(t) * 0.225]]); }
    for (let k = 0; k < 4; k++) { const t = (k / 4) * TAU; L.push([[Math.cos(t) * 0.3, Math.sin(t) * 0.3], [Math.cos(t) * 0.345, Math.sin(t) * 0.345]]); }
    segs(L, 0, lineMat(INK, 'core.mark'), 'core.mark', wheel);
    const ink = std(INK, 'core.mark.fill', 0.3);
    for (let k = 0; k < 8; k++) { const t = ((k + 0.5) / 8) * TAU; const dm = mesh(cyl2(0.009, 0.003, 12), ink, ink, 'core', 0.064, 'core.mark.dot', wheel); dm.position.set(Math.cos(t) * 0.185, 0.0015, Math.sin(t) * 0.185); }
    const star = mesh(cyl2(0.032, 0.005, 4).translate(0, 0.0025, 0), ink, ink, 'core', 0.066, 'core.mark.star', wheel); star.rotation.y = Math.PI / 4;
  }
  core.scale.y = 0.001; core.visible = false;
  const coreAnchor = new THREE.Object3D(); coreAnchor.position.set(0, 0.1, 0); group.add(coreAnchor);

  const pulseMat = new THREE.LineBasicMaterial({ color: SEAM, transparent: true, opacity: 0 }); pulseMat.name = KEY + '.pulse';
  const pulse = new THREE.Line(new THREE.BufferGeometry().setFromPoints(circ(0, 0, 1, 128).map(([x, z]) => new THREE.Vector3(x, 0.005, z))), pulseMat);
  pulse.name = KEY + '.pulse'; pulse.raycast = () => {}; group.add(pulse);

  // packets: 12 trapped · 6 in · 6 out · 3 orbit
  const N = 27;
  const pk = new THREE.InstancedMesh(new THREE.SphereGeometry(0.014, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' }), N);
  pk.name = `${KEY}.packets`; pk.raycast = () => {}; pk.frustumCulled = false; pk.castShadow = false; group.add(pk);
  const crim = new THREE.Color(SEAM);
  for (let i = 0; i < N; i++) pk.setColorAt(i, crim);
  frags.forEach((f, i) => { pk.setColorAt(i * 2, f.col); pk.setColorAt(i * 2 + 1, f.col); pk.setColorAt(12 + i, f.col); });
  pk.instanceColor.needsUpdate = true;

  const labels = frags.map((f) => ({ text: f.d.name, sub: f.d.sub, part: f.d.id, pos: f.anchor.position.clone(), obj: f.g, visible: true }));
  labels.push({ text: 'Phaeron', sub: 'Unified data foundation', part: 'core', brand: true, pos: new THREE.Vector3(), obj: coreAnchor, visible: false });
  const parts = [...SILOS.map((d) => ({ id: d.id, name: d.name })), { id: 'core', name: 'Phaeron · unified foundation' }];

  let time = opts.start ?? 0, playing = opts.autoplay ?? true, clock = 0;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), v = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
  const put = (i, p, s) => { sc.setScalar(Math.max(0.0001, s)); m4.compose(p, q, sc); pk.setMatrixAt(i, m4); };
  const env = (u) => Math.pow(Math.sin(Math.PI * u), 0.4);
  const polar = (r, t, y, out) => out.set(r * Math.cos(t), y, r * Math.sin(t));

  function animate(dt) {
    if (playing) time += dt; clock += dt;
    const op = plateSide.opacity ?? 1;
    const w = ease(seg(time, T.walls)), m = ease(seg(time, T.move)), s = ease(seg(time, T.seams)), c = ease(seg(time, T.core)), fl = seg(time, T.flow);

    field.visible = s > 0.001; field.scale.set(Math.max(0.001, s), 1, Math.max(0.001, s));
    seamMat.opacity = s * op; outer.geometry.setDrawRange(0, Math.floor(outerPts.length * s)); outer.visible = s > 0.001;
    core.visible = c > 0.001; core.scale.y = Math.max(0.001, c); wheel.rotation.y = clock * 0.12;
    const pu = (clock / 3.2) % 1, pr = 0.4 + pu * (RO + 0.3); pulse.scale.set(pr, 1, pr); pulseMat.opacity = (1 - pu) * 0.4 * fl * op;

    frags.forEach((f) => {
      const off = 0.16 * (1 - m), y = f.hy * (1 - m);
      f.g.position.set(f.c.x + f.dir.x * off, y, f.c.z + f.dir.z * off);
      f.g.rotation.y = f.tw * (1 - m);
      f.cage.visible = w < 0.999; f.cage.position.y = -y; f.cage.scale.y = Math.max(0.0001, (WALL_H + y) * (1 - w)); f.cm.opacity = 0.35 * (1 - w) * op;
    });

    const sil = 1 - w;
    frags.forEach((f, i) => {
      for (let k = 0; k < 2; k++) {   // trapped: sweeping inside the fragment, never leaving
        const t = f.S.a + f.S.half * 0.75 * Math.sin(clock * (1.1 + i * 0.07) + k * Math.PI + i);
        polar(RC + (k ? 0.26 : -0.2), t, TH + 0.014, v).sub(f.c).applyAxisAngle(THREE.Object3D.DEFAULT_UP, f.g.rotation.y).add(f.g.position);
        put(i * 2 + k, v, sil);
      }
      const ui = (clock * 0.32 + i / 6) % 1;  // fragment -> Phaeron
      polar(RO - 0.08, f.S.a, TH + 0.014, a); polar(0.44, f.S.a, 0.07, b); v.lerpVectors(a, b, ui); put(12 + i, v, fl * env(ui));
      const uo = (clock * 0.32 + i / 6 + 0.5) % 1;  // Phaeron -> fragment (shared context)
      polar(0.44, f.S.a + 0.08, 0.07, a); polar(RO - 0.08, f.S.a + 0.08, TH + 0.014, b); v.lerpVectors(a, b, uo); put(18 + i, v, fl * env(uo));
    });
    for (let k = 0; k < 3; k++) put(24 + k, polar(RO + 0.07, Math.PI / 2 + clock * 0.28 + (k * TAU) / 3, 0.012, v), fl);
    pk.instanceMatrix.needsUpdate = true;

    labels[labels.length - 1].visible = c > 0.6;
  }

  const api = {
    key: KEY, group, meshes, materials, lineMats, labels, parts, flows: [], roots,
    plateH: PLATE_H, hub: new THREE.Vector3(0, 0, 0), duration: T.flow[1],
    animate,
    replay() { time = 0; playing = true; },
    seek(x) { time = Math.max(0, x); },
    setPlaying(p) { playing = !!p; },
    get time() { return time; },
  };
  animate(0);
  return api;
}

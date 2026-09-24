/*
  Phaeron · Layer 01 · Data — "from silos to one foundation"
  Standalone three.js module. Drop-in replacement for the SVG-built bottom plate.

  Story (auto-plays, ~5s): six walled silos (Data, Clients, Internal systems, Rules & regulation,
  Markets, People) sit apart; their data circles inside and bounces off the walls. The walls sink,
  the silos pull into a clean hexagon, a unified foundation spreads under them, a core rises in the
  centre, and bridges connect everything. It then loops: each silo sends its knowledge into the core
  and receives shared context back.

  Contract (same shape arch-app-v2.js expects from every layer):
    { key, group, meshes, materials, lineMats, labels, parts, flows, roots, plateH, hub,
      animate(dt), replay(), seek(seconds), setPlaying(bool), duration }
  - Plate footprint: 4 × 4 world units, centred, top face at y = 0, thickness plateH.
  - Clickable meshes carry userData = { layer: 'data', part: <part id>, eTop } and [side, top] materials.
  - labels[i].visible is updated every frame (core label hides until the core has formed).

  Wiring into arch-app-v2.js:
    import { buildDataLayer } from './layers/data-layer.js';
    // in the LAYERS.map(...) builder:  l.key === 'data' ? buildDataLayer() : ...
    // replace the `// 01 Data` animation block with:  anims.push((dt) => built[0].animate(dt));
    // in placeOverlay():  if (lb.visible === false) { el.style.opacity = '0'; continue; }
    // optional, in select():  if (layer === 0) built[0].replay();
*/
import * as THREE from 'three';

export const SILOS = [
  { id: 'data',     name: 'Data',               sub: 'Warehouses · lakes',    color: '#305878' },
  { id: 'clients',  name: 'Clients',            sub: 'Accounts · history',    color: '#8C2F3D' },
  { id: 'internal', name: 'Internal systems',   sub: 'CRM · ERP · core',      color: '#183255' },
  { id: 'rules',    name: 'Rules & regulation', sub: 'Policy · compliance',   color: '#6E1F2B' },
  { id: 'markets',  name: 'Markets',            sub: 'Prices · signals',      color: '#5C7F9E' },
  { id: 'people',   name: 'People',             sub: 'Expertise · teams',     color: '#8A93A6' },
];
const U = { plateSide: '#8f1636', plateEdge: '#6E1F2B', plateTop0: '#fbfbfc', plateTop1: '#fdf1f3',
  field: '#fae6ea', coreSide: '#8f1636', coreTop: '#ffffff', coreInset: '#ffffff', bridgeTop: '#b3263f', packet: '#d11a45' };
const T = { walls: [1.6, 2.4], move: [1.9, 3.3], field: [2.8, 4.0], core: [3.0, 4.0], spokes: [3.3, 4.2], ring: [3.7, 4.6], flow: [4.2, 5.0] };
const R0 = 1.52, R1 = 1.22, PAD = 0.56, PLATE_H = 0.16;

const clamp = (x) => Math.max(0, Math.min(1, x));
const seg = (t, [a, b]) => clamp((t - a) / (b - a));
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

// Each silo gets its own symbol. Builders return an optional per-frame animator (clock) => void.
const SYMBOLS = {
  data({ sym, side, top, edge, id, mesh }) {          // database: stacked discs
    for (let k = 0; k < 3; k++) mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 48).translate(0, 0.02 + k * 0.058, 0), side, top, id, 0.06 + k * 0.058, id + '.disc', sym, edge);
  },
  clients({ sym, side, top, edge, id, mesh, box2, lineMat, col, KEY }) {   // client office: tower + podium + floor lines
    mesh(box2(0.26, 0.04, 0.2).translate(0, 0.02, 0), side, top, id, 0.04, id + '.podium', sym, edge);
    const w = 0.13, h = 0.26;
    mesh(box2(w, h, w).translate(0, 0.04 + h / 2, 0), side, top, id, 0.04 + h, id + '.tower', sym, edge);
    const pos = [], e = w / 2 + 0.0015;
    for (let y = 0.08; y < 0.04 + h - 0.02; y += 0.034) pos.push(-e, y, e, e, y, e, e, y, e, e, y, -e);
    for (const x of [-0.02, 0.02]) pos.push(x, 0.06, e, x, 0.04 + h - 0.02, e);
    for (const z of [-0.02, 0.02]) pos.push(e, 0.06, z, e, 0.04 + h - 0.02, z);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const ls = new THREE.LineSegments(g, lineMat('#' + col.clone().lerp(new THREE.Color('#fff'), 0.55).getHexString(), id + '.windows')); ls.raycast = () => {}; ls.name = KEY + '.' + id + '.windows'; sym.add(ls);
  },
  internal({ sym, side, top, edge, id, mesh, box2, std }) {   // systems: server rack with status lights
    const led = std('#ffffff', id + '.led', 0.9), leds = [];
    for (let k = 0; k < 3; k++) {
      const y = 0.012 + k * 0.066;
      mesh(box2(0.26, 0.05, 0.16).translate(0, y + 0.025, 0), side, top, id, y + 0.05, id + '.unit', sym, edge);
      for (let j = 0; j < 3; j++) { const l = mesh(box2(0.018, 0.012, 0.004), led, led, id, y + 0.03, id + '.led', sym); l.position.set(0.07 + j * 0.026, y + 0.025, 0.082); leds.push(l); }
    }
    return (t) => leds.forEach((l, j) => { l.visible = Math.sin(t * (1.3 + j * 0.37) + j * 2.1) > -0.4; });
  },
  rules({ sym, side, top, edge, id, mesh, box2 }) {          // regulation: balance scales
    mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.025, 40).translate(0, 0.0125, 0), side, top, id, 0.025, id + '.base', sym, edge);
    mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.24, 12).translate(0, 0.145, 0), side, side, id, 0.265, id + '.pole', sym);
    const beam = new THREE.Group(); beam.position.y = 0.26; sym.add(beam);
    mesh(box2(0.3, 0.008, 0.008), side, side, id, 0.27, id + '.beam', beam);
    const pans = [-0.14, 0.14].map((x) => {
      const p = new THREE.Group(); p.position.x = x; beam.add(p);
      mesh(box2(0.002, 0.1, 0.002).translate(0, -0.05, 0), side, side, id, 0.26, id + '.string', p);
      mesh(new THREE.CylinderGeometry(0.055, 0.04, 0.012, 40).translate(0, -0.106, 0), side, top, id, 0.16, id + '.pan', p, edge);
      return p;
    });
    return (t) => { const r = Math.sin(t * 0.8) * 0.08; beam.rotation.z = r; pans.forEach((p) => (p.rotation.z = -r)); };
  },
  markets({ sym, side, top, edge, id, mesh, box2 }) {       // markets: moving bar chart
    const base = [0.08, 0.14, 0.11, 0.2], bars = base.map((h, k) => { const b = mesh(box2(0.045, 1, 0.045).translate(0, 0.5, 0), side, top, id, h, id + '.bar', sym, edge); b.position.x = -0.09 + k * 0.06; b.scale.y = h; return b; });
    return (t) => bars.forEach((b, k) => { b.scale.y = base[k] * (0.8 + 0.25 * Math.sin(t * 1.1 + k * 1.3)); });
  },
  people({ sym, side, top, edge, id, mesh }) {                 // people: three figures
    [[0, -0.05, 1], [-0.085, 0.05, 0.86], [0.085, 0.05, 0.86]].forEach(([x, z, s]) => {
      const body = mesh(new THREE.CylinderGeometry(0.028 * s, 0.05 * s, 0.1 * s, 32).translate(0, 0.05 * s, 0), side, top, id, 0.1 * s, id + '.body', sym, edge); body.position.set(x, 0, z);
      const hg = new THREE.SphereGeometry(0.032 * s, 24, 16).translate(0, 0.14 * s, 0); hg.addGroup(0, hg.index.count, 0);
      const head = mesh(hg, side, top, id, 0.172 * s, id + '.head', sym); head.position.set(x, 0, z);
    });
  },
};

export function buildDataLayer(opts = {}) {
  const KEY = opts.key || 'data';
  const group = new THREE.Group(); group.name = KEY;
  const meshes = [], materials = [], lineMats = [], roots = [];

  const std = (hex, name, k = 0.1) => {
    const m = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.9, metalness: 0 });
    m.emissive = new THREE.Color(hex).multiplyScalar(k); m.name = `${KEY}.${name}`; m.userData.base = hex;
    materials.push(m); return m;
  };
  const lineMat = (hex, name) => { const m = new THREE.LineBasicMaterial({ color: hex }); m.name = `${KEY}.${name}`; m.userData.baseOpacity = 1; lineMats.push(m); return m; };
  const box2 = (w, h, d) => { const g = new THREE.BoxGeometry(w, h, d); g.clearGroups(); for (let f = 0; f < 6; f++) g.addGroup(f * 6, 6, f === 2 ? 1 : 0); return g; };
  const mesh = (geo, side, top, part, eTop, name, parent, edge) => {
    const m = new THREE.Mesh(geo, [side, top]); m.name = `${KEY}.${name}`;
    m.userData = { layer: KEY, part, eTop }; parent.add(m); meshes.push(m);
    if (edge) { const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), edge); e.name = m.name + '.edges'; e.raycast = () => {}; m.add(e); }
    return m;
  };

  // plate
  const plateSide = std(U.plateSide, 'plate.side', 0.25), plateTop = std(U.plateTop0, 'plate.top', 0.55);
  const plate = mesh(box2(4, PLATE_H, 4).translate(0, -PLATE_H / 2, 0), plateSide, plateTop, null, 0, 'plate', group, lineMat(U.plateEdge, 'plate.edge'));
  roots.push(plate);
  const c0 = new THREE.Color(U.plateTop0), c1 = new THREE.Color(U.plateTop1);
  { // dot grid + border inset (the fine "board" texture)
    const pts = []; for (let x = -1.85; x <= 1.851; x += 0.15) for (let z = -1.85; z <= 1.851; z += 0.15) pts.push(x, 0.002, z);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const pm = new THREE.PointsMaterial({ color: '#c98a98', size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.55 }); pm.name = KEY + '.grid'; pm.userData.baseOpacity = 0.55; lineMats.push(pm);
    const p = new THREE.Points(g, pm); p.name = KEY + '.grid'; p.raycast = () => {}; group.add(p);
    const b = 1.94, inset = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[-b, -b], [b, -b], [b, b], [-b, b]].map(([x, z]) => new THREE.Vector3(x, 0.002, z))), lineMat('#e3b5bf', 'plate.inset'));
    inset.name = KEY + '.plate.inset'; inset.raycast = () => {}; group.add(inset);
  }

  // unified foundation (spreads out from the centre)
  const fieldTop = std(U.field, 'field.top', 0.6), fieldSide = std(U.field, 'field.side', 0.6);
  const fieldGeo = new THREE.CylinderGeometry(1.8, 1.8, 0.003, 6).translate(0, 0.0015, 0);
  const field = mesh(fieldGeo, fieldSide, fieldTop, 'core', 0.003, 'field', group, lineMat('#b3263f', 'field.edge'));
  field.scale.set(0.001, 1, 0.001);

  // core
  const core = new THREE.Group(); core.name = `${KEY}.core`; group.add(core);
  const coreSide = std(U.coreSide, 'core.side', 0.25), coreTop = std(U.coreTop, 'core.top', 0.6), coreInset = std(U.coreInset, 'core.inset', 0.6);
  const coreEdge = lineMat('#6E1F2B', 'core.edge');
  mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.07, 6).translate(0, 0.035, 0), coreSide, coreTop, 'core', 0.07, 'core.base', core, coreEdge);
  mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.035, 48).translate(0, 0.0875, 0), coreSide, coreInset, 'core', 0.105, 'core.inset', core, coreEdge);
  const wheel = new THREE.Group(); wheel.name = KEY + '.core.phaeron-mark'; wheel.position.y = 0.1065; core.add(wheel);
  {
    const ink = lineMat('#0F2445', 'core.mark'), pos = [];
    const ringP = (r, n = 64) => { for (let k = 0; k < n; k++) { const t0 = (k / n) * Math.PI * 2, t1 = ((k + 1) / n) * Math.PI * 2; pos.push(Math.cos(t0) * r, 0, Math.sin(t0) * r, Math.cos(t1) * r, 0, Math.sin(t1) * r); } };
    ringP(0.24); ringP(0.055); ringP(0.2, 48);
    for (let k = 0; k < 8; k++) { const t = (k / 8) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t); pos.push(c * 0.065, 0, s * 0.065, c * 0.19, 0, s * 0.19); }
    for (const [x, z] of [[0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3]]) pos.push(x * 0.8, 0, z * 0.8, x * 1.08, 0, z * 1.08);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const ls = new THREE.LineSegments(g, ink); ls.name = KEY + '.core.mark'; ls.raycast = () => {}; wheel.add(ls);
    const dotM = std('#0F2445', 'core.mark.dot', 0.3);
    for (let k = 0; k < 8; k++) { const t = ((k + 0.5) / 8) * Math.PI * 2; const dm = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.003, 12), dotM, dotM, 'core', 0.108, 'core.mark.dot', wheel); dm.position.set(Math.cos(t) * 0.16, 0.0015, Math.sin(t) * 0.16); }
    const star = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.006, 4).translate(0, 0.003, 0), dotM, dotM, 'core', 0.11, 'core.mark.star', wheel); star.rotation.y = Math.PI / 4;
  }
  core.scale.y = 0.001; core.visible = false;
  const coreAnchor = new THREE.Object3D(); coreAnchor.position.set(0, 0.26, 0); group.add(coreAnchor);

  // core pulse ring
  const pulseMat = new THREE.LineBasicMaterial({ color: '#b3263f', transparent: true, opacity: 0 }); pulseMat.name = `${KEY}.pulse`;
  const circ = []; for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI * 2; circ.push(new THREE.Vector3(Math.sin(a), 0, Math.cos(a))); }
  const pulses = [0, 0.5].map((off) => { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(circ), pulseMat.clone()); l.name = `${KEY}.pulse`; l.raycast = () => {}; l.position.y = 0.004; group.add(l); return { l, off }; });

  // silos
  const white = new THREE.Color('#ffffff');
  const silos = SILOS.map((d, i) => {
    const a = Math.PI / 2 + (i * Math.PI) / 3, dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const jit = new THREE.Vector3(Math.sin(i * 2.3) * 0.1, 0, Math.cos(i * 1.7) * 0.1);
    const g = new THREE.Group(); g.name = `${KEY}.silo.${d.id}`; group.add(g);
    const col = new THREE.Color(d.color), tint = col.clone().lerp(white, 0.94);
    const side = std(d.color, `${d.id}.side`, 0.25), top = std('#' + tint.getHexString(), `${d.id}.top`, 0.6);
    const padTop = std('#ffffff', `${d.id}.pad`, 0.6);
    const edge = lineMat('#' + col.clone().multiplyScalar(0.85).getHexString(), `${d.id}.edge`);
    mesh(box2(PAD, 0.008, PAD).translate(0, 0.004, 0), padTop, padTop, d.id, 0.008, `${d.id}.pad`, g, edge);
    const walls = new THREE.Group(); walls.name = `${KEY}.${d.id}.walls`; g.add(walls);
    const wallTop = std('#ffffff', `${d.id}.wall`, 0.6);
    const h = 0.14, t = 0.008, o = PAD / 2 - t / 2;
    [[0, o, PAD, t], [0, -o, PAD, t], [o, 0, t, PAD], [-o, 0, t, PAD]].forEach(([x, z, w, dd]) => {
      const m = mesh(box2(w, h, dd).translate(0, h / 2, 0), wallTop, wallTop, d.id, h, `${d.id}.wall`, walls, edge); m.position.set(x, 0, z);
    });
    const sym = new THREE.Group(); sym.name = `${KEY}.${d.id}.symbol`; g.add(sym);
    const anim = SYMBOLS[d.id]({ sym, side, top, edge, id: d.id, mesh, box2, std, lineMat, col, KEY });
    const dy = 0.02 + ((i * 37) % 5) * 0.012;
    const p0 = dir.clone().multiplyScalar(R0).add(jit), p1 = dir.clone().multiplyScalar(R1);
    g.position.copy(p0); const r0 = Math.sin(i * 1.9) * 0.4; g.rotation.y = r0;
    const anchor = new THREE.Object3D(); anchor.position.copy(dir).multiplyScalar(0.22).setY(0.46); g.add(anchor);
    return { d, g, walls, sym, anim, dy, dir, p0, p1, r0, top, tint, anchor, col };
  });

  // bridges: spokes to core + ring between neighbours
  const bridgeSide = std(U.bridgeTop, 'bridge.side', 0.3), bridgeTop = std(U.bridgeTop, 'bridge.top', 0.3);
  const strip = (from, to, name) => {
    const len = from.distanceTo(to);
    const m = mesh(box2(0.014, 0.004, 1).translate(0, 0.002, 0.5), bridgeSide, bridgeTop, 'core', 0.004, name, group);
    m.position.copy(from); m.rotation.y = Math.atan2(to.x - from.x, to.z - from.z); m.userData.len = len; m.scale.z = 0.001; m.visible = false; return m;
  };
  const spokes = silos.map((s) => strip(s.dir.clone().multiplyScalar(0.36), s.dir.clone().multiplyScalar(R1 - PAD / 2), `spoke.${s.d.id}`));
  const ring = silos.map((s, i) => {
    const n = silos[(i + 1) % 6], ab = n.p1.clone().sub(s.p1).normalize();
    return strip(s.p1.clone().addScaledVector(ab, PAD / 2), n.p1.clone().addScaledVector(ab, -PAD / 2), `ring.${s.d.id}`);
  });

  // packets
  const N = 6 * 3 + 6 + 6 * 3;
  const pk = new THREE.InstancedMesh(new THREE.SphereGeometry(0.016, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' }), N);
  pk.name = `${KEY}.packets`; pk.raycast = () => {}; pk.frustumCulled = false; pk.castShadow = false; group.add(pk);
  const hot = new THREE.Color(U.packet);
  for (let i = 0; i < N; i++) pk.setColorAt(i, hot);
  silos.forEach((s, i) => { for (let k = 0; k < 4; k++) pk.setColorAt(i * 4 + k, s.col); pk.setColorAt(24 + i * 3, s.col); });
  pk.instanceColor.needsUpdate = true;

  const labels = silos.map((s) => ({ text: s.d.name, sub: s.d.sub, part: s.d.id, pos: s.anchor.position.clone(), obj: s.g, visible: true }));
  labels.push({ text: 'Phaeron', sub: 'Unified data foundation', part: 'core', brand: true, pos: new THREE.Vector3(), obj: coreAnchor, visible: false });
  const parts = [...SILOS.map((d) => ({ id: d.id, name: d.name })), { id: 'core', name: 'Phaeron · unified foundation' }];

  // timeline
  let time = opts.start ?? 0, playing = opts.autoplay ?? true, clock = 0;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), v = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
  const put = (i, pos, s) => { sc.setScalar(Math.max(0.0001, s)); m4.compose(pos, q, sc); pk.setMatrixAt(i, m4); };
  const env = (u) => Math.pow(Math.sin(Math.PI * u), 0.4);

  function animate(dt) {
    if (playing) time += dt; clock += dt;
    const layerOp = plateSide.opacity ?? 1;
    const w = ease(seg(time, T.walls)), m = ease(seg(time, T.move)), f = ease(seg(time, T.field)), c = ease(seg(time, T.core));
    const sp = ease(seg(time, T.spokes)), rg = ease(seg(time, T.ring)), fl = seg(time, T.flow);

    plateTop.color.lerpColors(c0, c1, f); plateTop.emissive.copy(plateTop.color).multiplyScalar(0.55);
    field.scale.set(Math.max(0.001, f), 1, Math.max(0.001, f)); field.visible = f > 0.001;
    core.visible = c > 0.001; core.scale.y = Math.max(0.001, c); wheel.rotation.y = clock * 0.18;
    
    spokes.forEach((s) => { s.visible = sp > 0.001; s.scale.z = Math.max(0.001, sp) * s.userData.len; });
    ring.forEach((s) => { s.visible = rg > 0.001; s.scale.z = Math.max(0.001, rg) * s.userData.len; });

    silos.forEach((s) => {
      s.g.position.lerpVectors(s.p0, s.p1, m); s.g.rotation.y = s.r0 * (1 - m);
      s.walls.position.y = -0.15 * w; s.walls.visible = w < 0.999;
      s.sym.position.y = s.dy * (1 - m); s.anim && s.anim(clock);
      s.top.color.copy(s.tint).lerp(white, m); s.top.emissive.copy(s.top.color).multiplyScalar(0.6);
    });
    pulses.forEach((p) => { const u = ((clock / 2.4) + p.off) % 1, r = 0.55 + u * 1.2; p.l.scale.set(r, 1, r); p.l.material.opacity = (1 - u) * 0.45 * fl * layerOp; });

    const sil = 1 - w;
    silos.forEach((s, i) => {
      const P = s.g.position;
      for (let k = 0; k < 3; k++) {       // circling inside the silo
        const ang = clock * (1.2 + i * 0.07) + (k * Math.PI * 2) / 3;
        v.set(P.x + Math.cos(ang) * 0.2, 0.02, P.z + Math.sin(ang) * 0.2); put(i * 4 + k, v, sil);
      }
      const u = Math.abs(Math.sin(clock * 1.7 + i));   // tries to leave, hits the wall
      v.copy(P).addScaledVector(s.dir, -0.25 * u); v.y = 0.02; put(i * 4 + 3, v, sil * (0.6 + 0.4 * u));

      const ui = (clock * 0.42 + i / 6) % 1;            // silo -> core (its own colour)
      a.copy(P).setY(0.02); b.set(0, 0.11, 0); v.lerpVectors(a, b, ui); v.y += Math.sin(Math.PI * ui) * 0.05; put(24 + i * 3, v, fl * env(ui));
      const uo = (clock * 0.42 + i / 6 + 0.5) % 1;      // core -> silo (shared context)
      v.lerpVectors(b, a, uo); v.y += Math.sin(Math.PI * uo) * 0.05; put(24 + i * 3 + 1, v, fl * env(uo));
      const ur = (clock * 0.3 + i / 6) % 1, n = silos[(i + 1) % 6].g.position;  // around the ring
      v.lerpVectors(P, n, ur); v.y = 0.012; put(24 + i * 3 + 2, v, fl * env(ur) * 0.9);
    });
    pk.instanceMatrix.needsUpdate = true;

    labels[labels.length - 1].visible = c > 0.6;
  }

  const api = {
    key: KEY, group, meshes, materials, lineMats, labels, parts, flows: [], roots,
    plateH: PLATE_H, hub: new THREE.Vector3(0, 0, 0), duration: T.flow[1],
    animate,
    replay() { time = 0; playing = true; },
    seek(s) { time = Math.max(0, s); },
    setPlaying(p) { playing = !!p; },
    get time() { return time; },
  };
  animate(0);
  return api;
}

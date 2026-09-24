import * as THREE from 'three';
import { buildPlateLayer, buildTileLayer } from './arch-build-v2.js';
import { buildDataLayer } from './layers/data-layer.js';

const LAYERS = [
  { key: 'data', file: 'layers/01-data.svg', kind: 'plate', num: '01', short: 'Data', accent: '#9f1239', pkt: '#e11d48', side: 'right',
    callout: ['Data, Logic', '& Action Services'], what: 'Connects every system',
    eyebrow: '01 / DATA', title: 'Every system,<br>one <em>foundation.</em>', body: 'Connects the messy reality of enterprise systems into one usable foundation.', caption: 'Every source, connected.',
    cfg: { stroke: '#9f1239', plateThick: 1.6, faintOpacity: 0.4, pal: { plateTop: '#f5dde2', plateSide: '#9f1239', stroke: '#7d0f2e', blockTop: '#fff7f8', blockSide: '#c9435f', inlay: '#f0bcc7', faint: '#b0405a' } } },
  { key: 'security', file: 'layers/02-security.svg', kind: 'plate', num: '02', short: 'Governance', accent: '#1b3a6b', pkt: '#2f7be0', side: 'left',
    callout: ['Security', '& Governance'], what: 'Permissions · audit · control',
    eyebrow: '02 / GOVERNANCE', title: 'Controlled<br>by <em>design.</em>', body: 'Makes the intelligence trustworthy, controlled, and enterprise-safe.', caption: 'Governed at every step.',
    cfg: { stroke: '#1b3a6b', plateThick: 1.6, faintOpacity: 0.35, pal: { plateTop: '#dce4f0', plateSide: '#1b3a6b', stroke: '#112a52', blockTop: '#f6f8fc', blockSide: '#46669a', inlay: '#c2d0e6', faint: '#1b3a6b' } } },
  { key: 'ontology', file: 'layers/03-ontology.svg', kind: 'plate', num: '03', short: 'Context', accent: '#2f5285', pkt: '#3f7fd8', side: 'right',
    callout: ['Ontology', 'Context Engine'], what: 'Facts become meaning',
    eyebrow: '03 / CONTEXT', title: 'Phaeron connects<br>the <em>picture.</em>', body: 'Phaeron connects information to the clients, people and relationships it belongs to, with permissions built in.', caption: 'The context that brings it together.',
    cfg: { stroke: '#2f5285', plateThick: 1.6, faintOpacity: 0.35, nodeE: 22, pal: { plateTop: '#e0e8f4', plateSide: '#2f5285', stroke: '#22426f', blockTop: '#ffffff', blockSide: '#6d8bb8', nodeTop: '#ffffff', nodeSide: '#2f5285', faint: '#2f5285' } } },
  { key: 'departments', file: 'layers/04-departments.svg', kind: 'plate', num: '04', short: 'Departments', accent: '#0a6fd6', pkt: '#008cff', side: 'left',
    callout: ['Ontology Language', '& Toolchain'], what: 'One context, every team',
    eyebrow: '04 / DEPARTMENTS', title: 'Every team,<br>one <em>context.</em>', body: 'Teams usually work from separate views. Here they share one context, so the connections that reveal an opportunity or a risk are not missed.', caption: 'Separate views. Shared context.',
    cfg: { stroke: '#008cff', plateThick: 1.6, faintOpacity: 0.35, anchorE: 24, pal: { plateTop: '#d8e9fb', plateSide: '#0a6fd6', stroke: '#0a5bb0', blockTop: '#ffffff', blockSide: '#4c9ae6', inlay: '#b9d8f7', faint: '#0a6fd6' } } },
  { key: 'frontend', file: 'layers/05a-frontend.svg', kind: 'tiles', num: '05', short: 'Applications', accent: '#386888', pkt: '#008cff', side: 'right',
    callout: ['Front-end', 'Systems'], what: 'Signals, ranked',
    eyebrow: '05 / APPLICATIONS', title: 'See what needs<br><em>attention.</em>', body: 'Understand what a new signal means for your business, so the right opportunities and risks reach the right people.', caption: 'From information to relevance.',
    cfg: { scale: 0.72, cy: 386, anchorScale: 0.72, anchorDepth: -40, pal: { top: '#ffffff', side: '#386888', stroke: '#244d6b', line: '#1769b3', soft: '#8fb0cf', accent: '#008cff' } } },
  { key: 'executive', file: 'layers/05b-executive.svg', kind: 'tiles', num: '06', short: 'Executive', accent: '#0F2445', pkt: '#008cff', side: 'left',
    callout: ['Executive', 'Surfaces'], what: 'Ready for decision',
    eyebrow: '06 / EXECUTIVE', title: 'Business knowledge,<br>put to <em>work.</em>', body: 'Surfaces what matters now, ranked and ready for action.', caption: 'Business knowledge, put to work.',
    cfg: { scale: 0.72, cy: 200, anchorScale: 0.72, anchorDepth: 40, pal: { top: '#ffffff', side: '#0F2445', stroke: '#0F2445', line: '#1b3a6b', soft: '#8a9bb8', accent: '#008cff' } } },
];
const OVERVIEW = { eyebrow: '00 / SYSTEM VIEW', title: 'Your firm knows more<br>than it can <em>see.</em>', body: 'Information sits across your systems, your people and the market. Its value is harder to see when it stays apart.', caption: 'Information, everywhere.', accent: '#008cff' };

const G = 1.2, GE = 1.55, LIFT = 1.2;
function targetsFor(sel) { const gap = sel == null ? G : GE; return [0, 1, 2, 3, 4.35, 5.6].map((k, i) => k * gap + (sel != null && i > sel ? LIFT : 0)); }

const stage = document.querySelector('three-d-stage');
const overlay = document.getElementById('labels');
await stage.ready;
const texts = await Promise.all(LAYERS.map((l) => fetch(l.file).then((r) => r.text())));
const root = new THREE.Group(); root.name = 'phaeron-architecture';
const built = LAYERS.map((l, i) => {
  const b = l.key === 'data'
    ? buildDataLayer({ key: l.key })
    : l.kind === 'plate'
      ? buildPlateLayer(texts[i], l.key, l.cfg)
      : buildTileLayer(texts[i], l.key, l.cfg);
  b.index = i; b.def = l; root.add(b.group); return b;
});

// ---------- packets ----------
function prep(pts) { const c = [0]; for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + pts[i].distanceTo(pts[i - 1])); return { pts, c, len: c[c.length - 1] || 1e-6 }; }
function sample(p, u, out) {
  const d = Math.max(0, Math.min(1, u)) * p.len; let i = 1; while (i < p.c.length - 1 && p.c[i] < d) i++;
  const s = p.c[i] - p.c[i - 1] || 1; return out.lerpVectors(p.pts[i - 1], p.pts[i], (d - p.c[i - 1]) / s);
}
const TRAIL = [1, 0.62, 0.36];
class Packets {
  constructor(parent, color, n, size = 0.026) {
    const m = new THREE.MeshBasicMaterial({ color }); m.name = 'packet';
    this.mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(size, 12, 8), m, n * TRAIL.length);
    this.mesh.name = parent.name + '.packets'; this.mesh.raycast = () => {}; this.mesh.frustumCulled = false; this.mesh.castShadow = false;
    parent.add(this.mesh); this.list = []; this.n = n; this.m4 = new THREE.Matrix4(); this.v = new THREE.Vector3(); this.q = new THREE.Quaternion(); this.sc = new THREE.Vector3();
  }
  add(path, o = {}) { if (this.list.length < this.n) this.list.push({ p: prep(path), t: o.t ?? Math.random(), speed: o.speed ?? 0.3, pong: o.pong, dir: 1, off: o.off || null, onEnd: o.onEnd }); }
  update(dt) {
    let k = 0;
    for (const a of this.list) {
      a.t += (a.dir * a.speed * dt) / Math.max(0.4, a.p.len);
      if (a.t > 1 || a.t < 0) { if (a.pong) { a.dir *= -1; a.t = Math.max(0, Math.min(1, a.t)); } else { a.t = a.t > 1 ? 0 : 1; a.onEnd && a.onEnd(a); } }
      TRAIL.forEach((s, j) => {
        sample(a.p, a.t - a.dir * j * (0.035 / Math.max(0.3, a.p.len)) * 1.4, this.v);
        if (a.off) this.v.add(a.off.position);
        const e = Math.sin(Math.PI * Math.max(0, Math.min(1, a.t))) ** 0.35;
        this.sc.setScalar(s * e); this.m4.compose(this.v, this.q, this.sc); this.mesh.setMatrixAt(k++, this.m4);
      });
    }
    for (; k < this.mesh.count; k++) { this.sc.setScalar(0); this.m4.compose(this.v, this.q, this.sc); this.mesh.setMatrixAt(k, this.m4); }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
function ringLoop(parent, color, name) {
  const pts = [[-1, 0], [0, -1], [1, 0], [0, 1], [-1, 0]].map(([a, b]) => new THREE.Vector3(a, 0, b));
  const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0 }); m.name = name;
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), m); l.name = name; l.raycast = () => {}; parent.add(l); return l;
}
function circleLoop(parent, color, name) {
  const pts = []; for (let i = 0; i <= 64; i++) { const t = (i / 64) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(t), 0, Math.sin(t))); }
  const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0 }); m.name = name;
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), m); l.name = name; l.raycast = () => {}; parent.add(l); return l;
}
const V = (a, y, b) => new THREE.Vector3(a * 2, y, b * 2);
const rnd = (a, b) => a + Math.random() * (b - a);

const anims = [];
// 01 Data — silo → unified foundation (procedural layer)
anims.push((dt) => built[0].animate(dt));
// 02 Security — every request crosses the perimeter; scans sweep outward
{
  const b = built[1], P = new Packets(b.group, b.def.pkt, 14), y = 0.02;
  [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([a, c], i) => { P.add([V(a * 0.97, y, c * 0.97), V(0, y + 0.03, 0)], { t: i / 4, speed: 0.45 }); P.add([V(a * 0.97, y, c * 0.97), V(0, y + 0.03, 0)], { t: i / 4 + 0.5, speed: 0.45 }); });
  b.flows.filter((f) => f.cls === 'blue').forEach((f) => P.add(f.pts, { pong: true, speed: 0.18 }));
  const rings = [0, 1, 2].map((i) => ({ l: ringLoop(b.group, '#2f7be0', 'security.scan'), off: i / 3 }));
  let t = 0;
  anims.push((dt) => {
    P.update(dt); t += dt;
    for (const r of rings) { const u = ((t / 4.0) + r.off) % 1; r.l.scale.set(0.12 + u * 1.86, 1, 0.12 + u * 1.86); r.l.position.y = 0.006; r.l.material.opacity = Math.sin(Math.PI * u) * 0.55 * b.opacity; }
  });
}
// 03 Ontology — meaning propagates along the graph; the core pulses as context resolves
{
  const b = built[2], links = b.flows.filter((f) => f.cls === 'ink' || f.cls === 'blue'), P = new Packets(b.group, b.def.pkt, 30, 0.022);
  for (let i = 0; i < 30; i++) { const f = links[i % links.length]; P.add(Math.random() < 0.5 ? f.pts : [...f.pts].reverse(), { speed: rnd(0.25, 0.45) }); }
  P.list.forEach((a, i) => (a.onEnd = () => { const f = links[(Math.random() * links.length) | 0]; a.p = prep(Math.random() < 0.5 ? f.pts : [...f.pts].reverse()); }));
  const hubY = 22 * (2 / Math.hypot(202.5, 117)) + 0.02;
  const pulses = [0, 1].map((i) => ({ l: circleLoop(b.group, '#2f5285', 'ontology.pulse'), off: i / 2 }));
  let t = 0;
  anims.push((dt) => {
    P.update(dt); t += dt;
    for (const p of pulses) { const u = ((t / 3.2) + p.off) % 1; p.l.scale.set(0.12 + u * 1.3, 1, 0.12 + u * 1.3); p.l.position.set(0, hubY * 0.35, 0); p.l.material.opacity = (1 - u) * 0.45 * b.opacity; }
  });
}
// 04 Departments — shared context flows out from the hub and back from each team
{
  const b = built[3], P = new Packets(b.group, b.def.pkt, 24);
  b.flows.filter((f) => f.cls === 'flow').forEach((f, i) => {
    P.add(f.pts, { t: 0.1, speed: 0.4 }); P.add([...f.pts].reverse(), { t: 0.6, speed: 0.4 });
  });
  b.flows.filter((f) => f.cls === 'stem').forEach((f) => P.add(f.pts, { speed: 0.12 }));
  const depts = b.roots.filter((m) => /^a\d/.test(m.userData.part || ''));
  const pulses = [0, 1].map((i) => ({ l: circleLoop(b.group, '#008cff', 'departments.pulse'), off: i / 2 }));
  let t = 0;
  anims.push((dt) => {
    P.update(dt); t += dt;
    depts.forEach((m) => { const k = Number(m.userData.part.slice(1)); m.position.y = Math.sin(t * 1.3 + k * 1.25) * 0.028; });
    for (const p of pulses) { const u = ((t / 2.8) + p.off) % 1; p.l.scale.set(0.2 + u * 0.9, 1, 0.2 + u * 0.9); p.l.position.set(b.hub.x, 0.012, b.hub.z); p.l.material.opacity = (1 - u) * 0.5 * b.opacity; }
  });
}
// 05/06 Tiles — surfaces breathe; charts update; the globe turns
for (const b of built.slice(4)) {
  const P = new Packets(b.group, b.def.pkt, 10, 0.02);
  b.tiles.forEach((r) => r.paths.slice(0, 2).forEach((p) => { if (p.length > 2) P.add(p.map((v) => v.clone().setY(v.y + 0.012)), { pong: true, speed: 0.22, off: r.mesh }); }));
  let t = rnd(0, 10);
  anims.push((dt) => {
    t += dt; P.update(dt);
    b.tiles.forEach((r, i) => {
      r.mesh.position.y = Math.sin(t * 0.9 + i * 1.4 + b.index) * 0.03;
      r.bars.forEach((bar, j) => { bar.scale.y = 0.06 + 0.2 * (0.5 + 0.5 * Math.sin(t * 1.5 + j * 1.2)); });
      if (r.globe) r.globe.rotation.y = t * 0.6;
    });
  });
}

// ---------- connectors: departments -> surfaces, with data travelling up ----------
const connPairs = [];
for (const b of built) if (b.ports) for (const a of b.anchors) { const port = b.ports.find((p) => p.part === a.part); if (port) connPairs.push({ from: port.obj, to: built[3], tl: a.plate }); }
const connGeo = new THREE.BufferGeometry();
connGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(connPairs.length * 6), 3));
const connMat = new THREE.LineBasicMaterial({ color: '#7f95b3', transparent: true, opacity: 0.9 }); connMat.name = 'connector';
const conn = new THREE.LineSegments(connGeo, connMat); conn.name = 'connectors'; conn.raycast = () => {}; conn.frustumCulled = false; root.add(conn);
const dotGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.012, 16);
const dotMat = new THREE.MeshStandardMaterial({ color: '#0a6fd6', roughness: 0.8 }); dotMat.name = 'connector-anchor';
for (const c of connPairs) { const d = new THREE.Mesh(dotGeo, dotMat); d.name = 'connector-anchor'; d.position.copy(c.tl); d.raycast = () => {}; c.to.group.add(d); }
const connPk = new Packets(root, '#008cff', connPairs.length * 2, 0.02);
const connPaths = connPairs.map(() => [new THREE.Vector3(), new THREE.Vector3()]);
connPaths.forEach((p, i) => { connPk.add(p, { t: 0, speed: 0.55 }); connPk.add(p, { t: 0.5, speed: 0.55 }); });

// ---------- place + frame ----------
let tgt = targetsFor(null);
built.forEach((b, i) => { b.y = tgt[i]; b.group.position.y = b.y; });
stage.setObject(root);
root.traverse((o) => { if (o.isMesh) { o.receiveShadow = false; o.castShadow = o.userData.layer === 'data' && o.parent === built[0].group; } });
const cam = stage._camera, controls = stage._controls;
const frameY = (t) => t[5] * 0.44 + 0.05;
function frameD(t) {
  const asp = stage.clientWidth / Math.max(1, stage.clientHeight), fv = (cam.fov * Math.PI) / 180, fh = 2 * Math.atan(Math.tan(fv / 2) * asp);
  const vs = t[5] * 0.95 + 4.1, hs = 5.8 + 3.4;
  return Math.max(vs / (2 * Math.tan(fv / 2)), hs / (2 * Math.tan(fh / 2))) * 1.02;
}
{
  const target = new THREE.Vector3(0, frameY(tgt), 0);
  cam.position.copy(target).add(new THREE.Vector3(1, 0.78, 1).normalize().multiplyScalar(frameD(tgt)));
  cam.near = 0.1; cam.far = 400; cam.updateProjectionMatrix();
  controls.target.copy(target); controls.minDistance = 4; controls.maxDistance = 40; controls.update();
}

// assemble on load
const t0 = performance.now(), ease = (t) => 1 - Math.pow(1 - t, 3);
built.forEach((b, i) => {
  b.load = { delay: 150 + i * 190, dur: 700, from: 2.4 };
  b.opacity = -1; b.group.position.y = b.y + b.load.from;
});
function setLayerOpacity(b, k) {
  for (const m of b.materials) { m.opacity = k; m.transparent = k < 1; m.depthWrite = k > 0.6; }
  for (const m of b.lineMats) { const base = m.userData.baseOpacity ?? 1; m.opacity = base * k; m.transparent = base * k < 1; }
}

// ---------- overlay: component labels + layer callouts ----------
const labelEls = [];
built.forEach((b) => b.labels.forEach((lb) => {
  const el = document.createElement('div');
  const asTile = lb.tile || b.key === 'data';
  el.className = asTile ? 'lbl lbl-tile' : lb.micro ? 'lbl lbl-micro' : 'lbl';
  el.innerHTML = asTile
    ? `<span class="n">${lb.text}</span><span class="m">${lb.micro || lb.sub || ''}</span>`
    : `<span class="n">${lb.text}</span>`;
  overlay.appendChild(el); labelEls.push({ el, lb, b });
}));
const callouts = built.map((b) => {
  const l = b.def, el = document.createElement('button');
  el.type = 'button'; el.className = 'callout ' + l.side; el.style.setProperty('--acc', l.accent);
  el.innerHTML = `<span class="dot"></span><span class="rule"></span><span class="ct"><span class="t">${l.callout.join('<br>')}</span><span class="w">${l.what}</span></span>`;
  el.addEventListener('click', () => select(state.layer === b.index && !state.part ? null : b.index));
  overlay.appendChild(el);
  let corners;
  if (b.plateH) { const y = -b.plateH / 2; corners = [V(-1, y, -1), V(1, y, -1), V(1, y, 1), V(-1, y, 1)]; }
  else { const bx = new THREE.Box3(); b.tiles.forEach((r) => bx.expandByObject(r.mesh)); const y = bx.min.y + 0.02; corners = [[bx.min.x, bx.min.z], [bx.max.x, bx.min.z], [bx.max.x, bx.max.z], [bx.min.x, bx.max.z]].map(([x, z]) => new THREE.Vector3(x, y, z)); }
  return { el, b, corners };
});
const v = new THREE.Vector3();
function project(p, obj) { v.copy(p); obj.localToWorld(v); v.project(cam); return [((v.x + 1) / 2) * stage.clientWidth, ((1 - v.y) / 2) * stage.clientHeight, v.z]; }
function placeOverlay() {
  for (const { el, lb, b } of labelEls) {
    if (lb.visible === false) { el.style.opacity = '0'; continue; }
    const [x, y, z] = project(lb.pos, lb.obj || b.group);
    const vis = z < 1 && b.opacity > 0.4;
    el.style.opacity = vis ? String(Math.min(1, (b.opacity - 0.4) / 0.6)) : '0';
    el.style.transform = `translate(${x}px, ${y}px) ${lb.micro === true ? 'translate(-50%, 30%)' : 'translate(-50%, -100%)'}`;
    el.classList.toggle('on', state.part === lb.part && state.layer === b.index);
    el.classList.toggle('open', state.layer === b.index);
    el.classList.toggle('hov', state.hover === b.index);
  }
  for (const c of callouts) {
    const pr = c.corners.map((p) => project(p, c.b.group));
    const pick = pr.reduce((a, p) => (c.b.def.side === 'left' ? (p[0] < a[0] ? p : a) : (p[0] > a[0] ? p : a)));
    c.el.style.transform = `translate(${pick[0]}px, ${pick[1]}px)`;
    const dim = state.layer != null && state.layer !== c.b.index;
    c.el.style.opacity = c.b.opacity > 0.5 ? (dim ? '0.32' : '1') : '0';
    c.el.classList.toggle('on', state.layer === c.b.index);
  }
}

// ---------- selection ----------
const state = { layer: null, part: null, hover: null };
const hiMats = new Map();
function hiFor(m, b) {
  if (!hiMats.has(m)) { const c = m.clone(); c.name = m.name + '.selected'; c.color.set(b.def.accent); c.emissive = new THREE.Color(b.def.accent).multiplyScalar(0.35); hiMats.set(m, c); }
  return hiMats.get(m);
}
function applyHighlight() {
  for (const b of built) for (const mesh of b.meshes) {
    if (!mesh.userData.orig) mesh.userData.orig = mesh.material;
    const on = state.layer === b.index && state.part && mesh.userData.part === state.part && mesh.userData.eTop != null;
    const o = mesh.userData.orig;
    mesh.material = on ? (Array.isArray(o) ? [o[0], hiFor(o[1], b)] : o) : o;
  }
}
function select(layer, part = null) {
  state.layer = layer; state.part = layer == null ? null : part;
  if (layer === 0) built[0].replay();
  tgt = targetsFor(layer); applyHighlight(); renderCopy();
}

const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const pickables = built.flatMap((b) => b.meshes);
function pick(e) {
  const r = stage.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, cam);
  const hit = ray.intersectObjects(pickables, false)[0];
  if (!hit) return null;
  const b = built.find((x) => x.key === hit.object.userData.layer);
  return { layer: b.index, part: hit.object.userData.part };
}
let down = null;
stage.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
stage.addEventListener('pointerup', (e) => {
  if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
  const p = pick(e); if (!p) return;
  if (p.part) select(p.layer, p.part); else if (!(state.layer === p.layer && !state.part)) select(p.layer, null);
});
let hoverQ = null;
stage.addEventListener('pointermove', (e) => { hoverQ = e; });
stage.addEventListener('pointerleave', () => { hoverQ = null; state.hover = null; stage.style.cursor = ''; });
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') select(null);
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { const d = e.key === 'ArrowUp' ? 1 : -1; select(state.layer == null ? (d > 0 ? 0 : 5) : Math.max(0, Math.min(5, state.layer + d))); e.preventDefault(); }
});

// ---------- copy column + caption + nav ----------
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
$('#nav').innerHTML = LAYERS.map((l, i) => `<button type="button" data-i="${i}" style="--layer-color:${l.accent}"><span class="nav-index">${l.num}</span><span class="nav-name">${l.short}</span></button>`).join('');
$('#nav').addEventListener('click', (e) => { const r = e.target.closest('button'); if (r) { const i = Number(r.dataset.i); select(state.layer === i && !state.part ? null : i); } });
$('#reset').addEventListener('click', () => select(null));
$('#copy').addEventListener('click', (e) => {
  const p = e.target.closest('[data-part]'); if (p) return select(state.layer, state.part === p.dataset.part ? null : p.dataset.part);
  if (e.target.closest('#cta')) select(state.layer == null ? 0 : state.layer === 5 ? null : state.layer + 1);
});
let lastKey = '';
function renderCopy() {
  const l = state.layer == null ? OVERVIEW : LAYERS[state.layer], b = built[state.layer];
  const part = b && b.parts.find((p) => p.id === state.part);
  const cta = state.layer == null ? ['↓', 'Explore the layers'] : state.layer === 5 ? ['↺', 'Explore again'] : ['↑', 'Next layer · ' + LAYERS[state.layer + 1].short];
  const html = `
    <p class="eyebrow">${l.eyebrow}</p>
    <h1 style="--acc:${l.accent}">${l.title}</h1>
    <p class="description">${esc(l.body)}</p>
    ${b && b.parts.length ? `<div class="parts-label">Components</div><div class="parts">${b.parts.map((p) => `<button type="button" data-part="${p.id}" class="${p.id === state.part ? 'on' : ''}" style="--acc:${l.accent}">${esc(p.name)}</button>`).join('')}</div>` : ''}
    ${part ? `<div class="detail" style="--acc:${l.accent}"><span>Selected · ${esc(l.short)}</span><p>${esc(part.name)}${part.micro ? ` <em class="mc">${esc(part.micro)}</em>` : ''}</p></div>` : ''}
    <button type="button" class="explore" id="cta"><span aria-hidden="true">${cta[0]}</span>${cta[1]}</button>`;
  const key = String(state.layer);
  const copy = $('#copy');
  if (key !== lastKey) { lastKey = key; copy.classList.add('swap'); setTimeout(() => { copy.innerHTML = html; copy.classList.remove('swap'); }, 160); }
  else copy.innerHTML = html;
  $('#caption-index').textContent = state.layer == null ? '00 / 06' : `${LAYERS[state.layer].num} / 06`;
  $('#caption-index').style.color = state.layer == null ? '#9f1239' : l.accent;
  $('#caption-title').textContent = l.caption;
  $('#caption-state').textContent = state.layer == null ? 'ASSEMBLED' : 'ISOLATED LAYER';
  document.querySelectorAll('#nav button').forEach((r) => r.toggleAttribute('aria-current', Number(r.dataset.i) === state.layer));
  $('#reset').disabled = state.layer == null;
}
renderCopy();

// ---------- loop ----------
let last = performance.now(), pd = frameD(tgt);
const pa = connGeo.attributes.position.array, tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const k = 1 - Math.exp(-dt * 7);
  built.forEach((b, i) => {
    const le = ease(Math.max(0, Math.min(1, (now - t0 - b.load.delay) / b.load.dur)));
    b.y += (tgt[i] - b.y) * k; b.group.position.y = b.y + (1 - le) * b.load.from;
    if (b.opacity !== le) { b.opacity = le; setLayerOpacity(b, le); (b.pk ||= b.group.children.filter((o) => o.isInstancedMesh)).forEach((o) => (o.visible = le > 0.95)); }
  });
  anims.forEach((f) => f(dt));
  root.updateMatrixWorld(true);
  connPairs.forEach((c, j) => {
    c.from.getWorldPosition(tmp); tmp2.copy(c.tl); c.to.group.localToWorld(tmp2);
    pa.set([tmp.x, tmp.y, tmp.z, tmp2.x, tmp2.y, tmp2.z], j * 6);
    connPaths[j][0].copy(tmp2); connPaths[j][1].copy(tmp);
  });
  connGeo.attributes.position.needsUpdate = true;
  const minOp = Math.min(...built.slice(3).map((b) => b.opacity));
  connMat.opacity = 0.9 * minOp; connPk.list.forEach((a) => (a.p = prep(connPaths[connPk.list.indexOf(a) >> 1])));
  connPk.update(dt); connPk.mesh.visible = minOp > 0.95;
  const wantY = frameY(tgt), wantD = frameD(tgt);
  const dy = (wantY - controls.target.y) * k; controls.target.y += dy; cam.position.y += dy;
  const off = cam.position.clone().sub(controls.target); const npd = pd + (wantD - pd) * k;
  off.multiplyScalar(npd / pd); cam.position.copy(controls.target).add(off); pd = npd;
  if (hoverQ) { const p = pick(hoverQ); stage.style.cursor = p ? 'pointer' : ''; state.hover = p ? p.layer : null; hoverQ = null; }
  placeOverlay();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__arch = { select, state, built };

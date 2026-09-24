// Builds 3D layers from the isometric SVG slices.
// SVG plates are true isometric: plate centre (600,524), corners ±405 px across, ±234 px down.
import * as THREE from 'three';

export const H = 2;                       // half plate side, metres (plate = 4 m square)
const AXIS_PX = Math.hypot(202.5, 117);   // screen px per plate half-side along an iso axis
export const PXV = H / AXIS_PX;           // metres per vertical px
const CX = 600, CY = 524;

// screen (x,y) seen at elevation e (px) -> plane (a,b) in [-1,1]
function inv(x, y, e) {
  const dx = (x - CX) / 202.5, dy = (y + e - CY) / 117;
  return [(dx + dy) / 2, (dy - dx) / 2];
}
function toW(x, y, e) { const [a, b] = inv(x, y, e); return new THREE.Vector3(a * H, e * PXV, b * H); }

const num = (s) => parseFloat(s);
function styleOf(el) {
  const s = el.getAttribute('style') || '';
  const f = s.match(/fill:\s*(#[0-9a-f]{3,6})/i), k = s.match(/stroke:\s*(#[0-9a-f]{3,6})/i);
  return { fill: f ? f[1] : (el.getAttribute('fill') || null), stroke: k ? k[1] : (el.getAttribute('stroke') || null) };
}
function polyPts(el) {
  const n = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(num);
  const o = []; for (let i = 0; i + 1 < n.length; i += 2) o.push([n[i], n[i + 1]]); return o;
}
// minimal path parser: M L H V Z C Q (abs + rel) -> array of polylines
export function parsePath(d) {
  const tk = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
  const lines = []; let cur = null, x = 0, y = 0, sx = 0, sy = 0, cmd = '', i = 0;
  const nx = () => num(tk[i++]);
  while (i < tk.length) {
    if (/[a-zA-Z]/.test(tk[i])) cmd = tk[i++];
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
    if (C === 'Z') { if (cur) cur.push([sx, sy]); x = sx; y = sy; continue; }
    if (C === 'M') { let px = nx(), py = nx(); if (rel && cur) { px += x; py += y; } x = sx = px; y = sy = py; cur = [[x, y]]; lines.push(cur); cmd = rel ? 'l' : 'L'; continue; }
    if (C === 'L') { let px = nx(), py = nx(); if (rel) { px += x; py += y; } x = px; y = py; cur.push([x, y]); continue; }
    if (C === 'H') { let px = nx(); x = rel ? x + px : px; cur.push([x, y]); continue; }
    if (C === 'V') { let py = nx(); y = rel ? y + py : py; cur.push([x, y]); continue; }
    if (C === 'C' || C === 'Q') {
      const n = C === 'C' ? 3 : 2, p = [[x, y]];
      for (let k = 0; k < n; k++) { let px = nx(), py = nx(); if (rel) { px += x; py += y; } p.push([px, py]); }
      for (let s = 1; s <= 16; s++) {
        const t = s / 16, u = 1 - t;
        const w = n === 3 ? [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t] : [u * u, 2 * u * t, t * t];
        cur.push([w.reduce((a, wi, j) => a + wi * p[j][0], 0), w.reduce((a, wi, j) => a + wi * p[j][1], 0)]);
      }
      cur.bez = p; x = p[n][0]; y = p[n][1]; continue;
    }
    i++; // unsupported token — skip
  }
  return lines;
}
function ellipsePts(cx, cy, rx, ry, n = 40) {
  const o = []; for (let i = 0; i <= n; i++) { const t = (i / n) * Math.PI * 2; o.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry]); } return o;
}
function inside(p, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function shrinkToward(pts, k) {
  const c = pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]);
  return pts.map((p) => [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k]);
}
const centroid = (pts) => pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]);

// ---------- shared layer context ----------
class LayerCtx {
  constructor(key, cfg) {
    this.key = key; this.cfg = cfg;
    this.group = new THREE.Group(); this.group.name = key;
    this.mats = {}; this.lineBuckets = {}; this.meshes = []; this.labels = []; this.parts = {};
    this.lineObjs = []; this.edgeMats = {}; this.segMats = {}; this.flows = []; this.roots = [];
  }
  edgeMat(hex) {
    if (!this.edgeMats[hex]) { const m = new THREE.LineBasicMaterial({ color: hex }); m.name = `${this.key}.edge.${hex.replace('#', '')}`; m.userData.baseOpacity = 1; this.edgeMats[hex] = m; }
    return this.edgeMats[hex];
  }
  segMat(hex, op) {
    const id = hex + '@' + op;
    if (!this.segMats[id]) { const m = new THREE.LineBasicMaterial({ color: hex, transparent: op < 1, opacity: op }); m.name = `${this.key}.line.${hex.replace('#', '')}`; m.userData.baseOpacity = op; this.segMats[id] = m; }
    return this.segMats[id];
  }
  segObj(parent, hex, op, pos, name) {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const ls = new THREE.LineSegments(g, this.segMat(hex, op)); ls.name = name || `${this.key}.lines`; ls.raycast = () => {}; parent.add(ls); return ls;
  }
  lineMats() { return [...Object.values(this.edgeMats), ...Object.values(this.segMats), ...this.lineObjs.map((l) => l.material)]; }
  mat(hex, kind) {
    const id = kind + hex;
    if (!this.mats[id]) {
      const m = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.82, metalness: 0, emissive: new THREE.Color(hex).multiplyScalar(kind === 'top' ? 0.34 : 0.1) });
      m.name = `${this.key}.${kind}.${hex.replace('#', '')}`; m.userData.base = hex; this.mats[id] = m;
    }
    return this.mats[id];
  }
  line(hex, opacity, a, b) {
    const id = hex + '@' + opacity;
    (this.lineBuckets[id] ||= { hex, opacity, pos: [] }).pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
  }
  polyline(hex, opacity, pts3) { for (let i = 0; i + 1 < pts3.length; i++) this.line(hex, opacity, pts3[i], pts3[i + 1]); }
  // prism from screen polygon (top face at eTop px, height h px)
  prism(pts, eTop, h, topHex, sideHex, strokeHex, part, name, parent) {
    const plane = pts.map(([x, y]) => inv(x, y, eTop));
    const shape = new THREE.Shape(plane.map(([a, b]) => new THREE.Vector2(a * H, -b * H)));
    const depth = Math.max(h, 0.6) * PXV;
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 });
    g.rotateX(-Math.PI / 2); g.translate(0, eTop * PXV - depth, 0);
    const mesh = new THREE.Mesh(g, [this.mat(topHex, 'top'), this.mat(sideHex, 'side')]);
    mesh.name = `${this.key}.${name || 'block'}.${this.meshes.length}`;
    mesh.userData = { layer: this.key, part: part || null, eTop, depth };
    (parent || this.group).add(mesh); this.meshes.push(mesh);
    if (!parent) this.roots.push(mesh);
    if (strokeHex) {
      const ls = new THREE.LineSegments(new THREE.EdgesGeometry(g, 25), this.edgeMat(strokeHex));
      ls.name = mesh.name + '.edges'; ls.raycast = () => {}; mesh.add(ls);
    }
    return { plane, eTop, h, mesh };
  }
  finish() {
    for (const id in this.lineBuckets) {
      const b = this.lineBuckets[id];
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
      const m = new THREE.LineBasicMaterial({ color: b.hex, transparent: b.opacity < 1, opacity: b.opacity });
      m.name = `${this.key}.line.${b.hex.replace('#', '')}`; m.userData.baseOpacity = b.opacity;
      const ls = new THREE.LineSegments(g, m); ls.name = `${this.key}.lines.${Object.keys(this.lineObjs).length}`;
      ls.raycast = () => {}; this.group.add(ls); this.lineObjs.push(ls);
    }
  }
}

// ---------- plate layers (01–04) ----------
const WHITE = /^#f{3}(f{3})?$/i;
export function buildPlateLayer(svgText, key, cfg) {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  const root = doc.querySelector('.art-layer');
  const L = new LayerCtx(key, cfg);
  const P = cfg.pal;
  const els = []; const texts = [];
  (function walk(n) { for (const c of n.children) { if (c.tagName === 'g') walk(c); else if (c.tagName === 'text') texts.push(c); else els.push(c); } })(root);
  const cls = (el) => el.getAttribute('class') || '';
  const strokeC = (hex) => (!hex || hex.toLowerCase() === cfg.stroke) ? P.stroke : hex;
  const topC = (hex) => (!hex || WHITE.test(hex)) ? P.blockTop : hex;
  const blocks = [];
  let plateH = 16;

  const anchors = [];
  if (cfg.anchorE) for (const el of els) if (el.tagName === 'path' && cls(el) === 'ink') {
    const pl = parsePath(el.getAttribute('d'))[0];
    if (pl.length === 2 && Math.abs(pl[0][0] - pl[1][0]) < 0.01) anchors.push({ x: pl[1][0], y: pl[1][1], yb: pl[0][1] });
  }
  const partNames = cfg.partNames ? { ...cfg.partNames } : {};
  const partFor = (c) => {
    if (!anchors.length) return null;
    let best = null, bd = 1e9;
    anchors.forEach((a, i) => { const d = Math.hypot(c[0] - a.x, c[1] - a.y); if (d < bd) { bd = d; best = i; } });
    if (bd < 80) return 'a' + best;
    if (Math.hypot(c[0] - 600, c[1] - 500) < 80) return 'hub';
    return null;
  };
  const fits = (pts, e, B) => pts.every((p) => inside(inv(p[0], p[1], e), B.plane));
  const resolveTop = (pts, h, kind) => {
    const test = shrinkToward(pts, 0.9);
    for (let i = blocks.length - 1; i >= 1; i--) { const B = blocks[i]; if (fits(test, B.eTop + h, B)) return { e: B.eTop + h, parent: B.mesh }; }
    if (kind === 'node' && cfg.nodeE) return { e: cfg.nodeE, parent: null };
    if (anchors.length) { const c = centroid(pts); if (anchors.some((a) => Math.hypot(c[0] - a.x, c[1] - a.y) < 75)) return { e: cfg.anchorE, parent: null }; }
    return { e: h, parent: null };
  };
  const eFor = (p) => { let best = 0; for (let i = 1; i < blocks.length; i++) { const B = blocks[i]; if (B.eTop > best && inside(inv(p[0], p[1], B.eTop), B.plane)) best = B.eTop; } return best; };
  const add = (pts, eTop, h, top, side, stroke, name, parent) => {
    const part = blocks.length ? partFor(centroid(pts)) : null;
    const b = L.prism(pts, eTop, h, top, side, stroke, part, name, parent);
    blocks.push(b); return b;
  };

  const lineEls = [];
  for (let i = 0; i < els.length; i++) {
    const el = els[i], c = cls(el), tag = el.tagName;
    if (tag === 'polygon' && c === 'edge-left') {
      const p = polyPts(el); let h = p[2][1] - p[1][1];
      const top = els[i + 2]; i += 2;
      const tp = polyPts(top);
      if (!blocks.length) {
        h *= cfg.plateThick || 1; plateH = h;
        add(tp, 0, h, P.plateTop, P.plateSide, P.stroke, 'plate', null);
      } else {
        const r = resolveTop(tp, h);
        add(tp, r.e, h, topC(styleOf(top).fill), P.blockSide, strokeC(styleOf(top).stroke), 'block', r.parent);
      }
      continue;
    }
    if (tag === 'polygon' && (c === 'surface' || c === 'pale-blue')) {
      const p = polyPts(el), nx = els[i + 1];
      if (nx && nx.tagName === 'polygon' && /surface|pale-blue/.test(cls(nx))) {
        const q = polyPts(nx);
        if (q.length === p.length) {
          const dy = q[0][1] - p[0][1];
          if (dy < -1 && q.every((v, k) => Math.abs(v[0] - p[k][0]) < 0.05 && Math.abs(v[1] - p[k][1] - dy) < 0.05)) {
            const r = resolveTop(q, -dy);
            add(q, r.e, -dy, topC(styleOf(nx).fill), P.blockSide, strokeC(styleOf(nx).stroke), 'prism', r.parent); i++; continue;
          }
        }
      }
      const r = resolveTop(p, 0);
      add(p, r.e + 0.6, 0.6, P.inlay || topC(styleOf(el).fill), P.blockSide, strokeC(styleOf(el).stroke), 'inlay', r.parent);
      continue;
    }
    if (tag === 'ellipse' && c) {
      const cx = num(el.getAttribute('cx')), cy = num(el.getAttribute('cy')), rx = num(el.getAttribute('rx')), ry = num(el.getAttribute('ry'));
      const nx = els[i + 1];
      let h = 0.8, top = el, isNode = false;
      if (nx && nx.tagName === 'ellipse' && Math.abs(num(nx.getAttribute('cx')) - cx) < 0.01 && Math.abs(num(nx.getAttribute('rx')) - rx) < 0.01 && num(nx.getAttribute('cy')) < cy) {
        h = cy - num(nx.getAttribute('cy')); top = nx; i++; isNode = true;
      }
      const pts = ellipsePts(cx, num(top.getAttribute('cy')), rx, ry, 40);
      const r = isNode ? resolveTop(pts, h, 'node') : resolveTop(pts, 0);
      const e = isNode ? r.e : r.e + 0.8;
      add(pts, e, h, isNode ? (P.nodeTop || P.blockTop) : topC(styleOf(top).fill), isNode ? (P.nodeSide || P.blockSide) : P.blockSide, strokeC(styleOf(top).stroke), isNode ? 'node' : 'port', r.parent);
      continue;
    }
    if (tag === 'circle') {
      const cx = num(el.getAttribute('cx')), cy = num(el.getAttribute('cy')), rr = num(el.getAttribute('r'));
      const pts = ellipsePts(cx, cy, rr * 1.3, rr * 0.75, 20);
      const r = resolveTop(pts, 0); const f = strokeC(styleOf(el).fill);
      add(pts, r.e + 1.6, 1.6, f, f, null, 'dot', r.parent);
      continue;
    }
    if (tag === 'path' || tag === 'polygon') lineEls.push(el);
  }

  const fOp = cfg.faintOpacity ?? 0.3;
  const FLOW = { blue: 1, flow: 1, ink: 1 };
  for (const el of lineEls) {
    const c = cls(el), st = styleOf(el);
    const hex = c === 'faint' ? (P.faint || strokeC(st.stroke)) : strokeC(st.stroke);
    const op = c === 'faint' ? fOp : 1;
    const lines = el.tagName === 'polygon' ? [polyPts(el).concat([polyPts(el)[0]])] : parsePath(el.getAttribute('d'));
    for (const pl of lines) {
      if (c === 'ink' && cfg.anchorE && pl.length === 2 && Math.abs(pl[0][0] - pl[1][0]) < 0.01) {
        const base = toW(pl[0][0], pl[0][1], 0), topP = base.clone(); topP.y += (pl[0][1] - pl[1][1]) * PXV;
        L.line(hex, 1, base, topP); L.flows.push({ cls: 'stem', pts: [base, topP] }); continue;
      }
      if (pl.bez) {
        const p0 = pl.bez[0], p1 = pl.bez[pl.bez.length - 1], k = pl.bez[1][1] - p0[1];
        const e0 = eFor(p0) + 0.4, e1 = eFor(p1) + 0.4, pts = [];
        for (let s = 0; s <= 20; s++) {
          const t = s / 20, e = e0 + (e1 - e0) * t - 3 * t * (1 - t) * k;
          const A = inv(p0[0], p0[1], e0), B = inv(p1[0], p1[1], e1);
          pts.push(new THREE.Vector3((A[0] + (B[0] - A[0]) * t) * H, e * PXV, (A[1] + (B[1] - A[1]) * t) * H));
        }
        L.polyline(hex, op, pts); if (FLOW[c]) L.flows.push({ cls: c, pts }); continue;
      }
      if (c === 'dash') {
        for (let s = 0; s + 1 < pl.length; s++) {
          const [x0, y0] = pl[s], [x1, y1] = pl[s + 1], len = Math.hypot(x1 - x0, y1 - y0);
          for (let d = 0; d < len; d += 10) {
            const t0 = d / len, t1 = Math.min(1, (d + 5) / len);
            L.line(hex, 0.8, toW(x0 + (x1 - x0) * t0, y0 + (y1 - y0) * t0, 0.3), toW(x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1, 0.3));
          }
        }
        L.flows.push({ cls: 'ring', pts: pl.map((p) => toW(p[0], p[1], 0.3)) });
        continue;
      }
      const eLift = c === 'faint' ? 0.3 : c === 'boundary' ? 1.2 : null;
      const pts = pl.map((p) => toW(p[0], p[1], eLift ?? eFor(p) + 0.4));
      L.polyline(hex, op, pts); if (FLOW[c]) L.flows.push({ cls: c, pts });
    }
  }

  const labels = [];
  if (anchors.length) {
    for (const t of texts) {
      const x = num(t.getAttribute('x')), y = num(t.getAttribute('y'));
      const tc = t.getAttribute('class') || '';
      if (tc === 'department-label') {
        let best = 0, bd = 1e9; anchors.forEach((a, i) => { const d = Math.abs(a.x - x) + Math.abs(a.y - 46 - y) * 0.3; if (d < bd) { bd = d; best = i; } });
        const a = anchors[best]; partNames['a' + best] = t.textContent.trim();
        labels.push({ text: t.textContent.trim(), part: 'a' + best, pos: toW(a.x, a.yb, 0).add(new THREE.Vector3(0, (a.yb - a.y + 22) * PXV, 0)) });
      } else if (tc === 'hub-label') {
        partNames.hub = 'Shared Context';
        labels.push({ text: t.textContent.trim(), part: 'hub', micro: true, pos: toW(600, 500, 10).add(new THREE.Vector3(0, 0.1, 0)) });
      }
    }
  }
  L.finish();
  const parts = Object.keys(partNames).map((id) => ({ id, name: partNames[id] }));
  L.meshes.forEach((m) => { if (m.userData.part && partNames[m.userData.part]) m.name = key + '.' + partNames[m.userData.part].toLowerCase().replace(/\W+/g, '-') + '.' + m.id; });
  return { key, group: L.group, meshes: L.meshes, lineMats: L.lineMats(), materials: Object.values(L.mats), labels, parts,
    flows: L.flows, roots: L.roots, plateH: plateH * PXV, hub: toW(600, 500, 0), toW, inv };
}

// ---------- tile bands (05A / 05B) ----------
export function buildTileLayer(svgText, key, cfg) {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  const svg = doc.documentElement;
  const L = new LayerCtx(key, cfg);
  const P = cfg.pal, s = cfg.scale;
  const tiles = [...svg.children].filter((g) => g.tagName === 'g' && /translate/.test(g.getAttribute('transform') || ''));
  const mapXY = (x, y) => [CX + (x - 800) * s, CY + (y - cfg.cy) * s];
  const parts = [], labels = [], ports = [], recs = [];
  const thick = 9 * s;
  for (const g of tiles) {
    const [tx, ty] = (g.getAttribute('transform').match(/-?\d*\.?\d+/g) || []).map(num);
    const id = g.id;
    const T = (p) => mapXY(tx + p[0], ty + p[1]);
    const lbl = g.querySelector('text.label'), micro = g.querySelector('text.micro');
    const name = lbl ? lbl.textContent.trim() : id;
    parts.push({ id, name, micro: micro ? micro.textContent.trim() : '' });
    const edge = g.querySelector('path.edge');
    const top = parsePath(edge.getAttribute('d'))[0].slice(0, 4).map(T);
    const tile = L.prism(top, 0, thick, P.top, P.side, P.stroke, id, 'tile').mesh;
    const rec = { id, mesh: tile, paths: [], center: null, bars: [], globe: null };
    const buckets = {};
    const seg = (hex, op, pts) => { const b = (buckets[hex + '@' + op] ||= { hex, op, pos: [] }); for (let i = 0; i + 1 < pts.length; i++) b.pos.push(pts[i].x, pts[i].y, pts[i].z, pts[i + 1].x, pts[i + 1].y, pts[i + 1].z); };
    for (const el of g.querySelectorAll('path, circle, ellipse')) {
      if (el === edge || el.classList.contains('side')) continue;
      const c = el.getAttribute('class') || '', st = styleOf(el);
      if (el.classList.contains('port')) {
        const p = T([num(el.getAttribute('cx')), num(el.getAttribute('cy'))]);
        const o = new THREE.Object3D(); o.position.copy(toW(p[0], p[1], -thick)); o.name = id + '.port'; tile.add(o); ports.push({ part: id, obj: o }); continue;
      }
      if (el.tagName === 'circle' && c === 'blue') {
        const p = T([num(el.getAttribute('cx')), num(el.getAttribute('cy'))]), r = num(el.getAttribute('r')) * s;
        L.prism(ellipsePts(p[0], p[1], r * 1.4, r * 0.8, 16), 1.4, 1.2, P.accent, P.accent, null, id, 'dot', tile); continue;
      }
      let lines;
      if (el.tagName === 'path') lines = parsePath(el.getAttribute('d'));
      else { const r = el.getAttribute('r'); lines = [ellipsePts(num(el.getAttribute('cx')), num(el.getAttribute('cy')), num(r || el.getAttribute('rx')), num(r || el.getAttribute('ry')), 40)]; }
      const hex = (c === 'soft' || c === 'faint') ? P.soft : P.line, op = 1;
      for (const pl of lines) {
        const pts = pl.map((p) => { const q = T(p); return toW(q[0], q[1], 0.5); });
        seg(hex, op, pts);
        if (c === 'line') rec.paths.push(pts);
        if (id === 'executive-dashboard' && c === 'line' && el.tagName === 'path') {
          const xs = pl.map((p) => p[0]), ys = pl.map((p) => p[1]);
          const b = T([(Math.min(...xs) + Math.max(...xs)) / 2, Math.max(...ys) - 6]);
          const box = new THREE.Mesh(new THREE.BoxGeometry(0.075, 1, 0.075).translate(0, 0.5, 0), L.mat(P.accent, 'top'));
          box.name = id + '.bar'; box.userData = { layer: key, part: id }; box.position.copy(toW(b[0], b[1], 0.5)); box.scale.y = 0.1;
          tile.add(box); L.meshes.push(box); rec.bars.push(box);
        }
      }
    }
    for (const k in buckets) L.segObj(tile, buckets[k].hex, buckets[k].op, buckets[k].pos, id + '.lines');
    const c = T([0, 66]);
    rec.center = toW(c[0], c[1], 0.5);
    if (id === 'market-globe') {
      const gl = new THREE.Group(); gl.name = id + '.globe';
      const r = 0.17, ring = (rot) => { const pts = []; for (let i = 0; i <= 48; i++) { const t = (i / 48) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(t) * r, Math.sin(t) * r, 0)); } const gg = new THREE.BufferGeometry().setFromPoints(pts); const ln = new THREE.Line(gg, L.segMat(P.accent, 1)); ln.rotation.copy(rot); ln.raycast = () => {}; gl.add(ln); };
      ring(new THREE.Euler(0, 0, 0)); ring(new THREE.Euler(0, Math.PI / 3, 0)); ring(new THREE.Euler(0, -Math.PI / 3, 0)); ring(new THREE.Euler(Math.PI / 2, 0, 0));
      gl.position.copy(rec.center).add(new THREE.Vector3(0, r + 0.04, 0)); tile.add(gl); rec.globe = gl;
    }
    recs.push(rec);
    labels.push({ text: name, micro: micro ? micro.textContent.trim() : '', part: id, tile: true, pos: rec.center.clone().add(new THREE.Vector3(0, id === 'market-globe' ? 0.42 : 0.14, 0)), obj: tile });
  }
  const anchors = [];
  const conn = svg.querySelector('#downward-connectors');
  if (conn) for (const p of conn.querySelectorAll('path')) {
    const pl = parsePath(p.getAttribute('d'))[0], [x1] = pl[0], [x2, y2] = pl[pl.length - 1];
    let best = null, bd = 1e9; for (const g of tiles) { const tx = num(g.getAttribute('transform').match(/-?\d*\.?\d+/)[0]); const d = Math.abs(tx - x1); if (d < bd) { bd = d; best = g.id; } }
    const a = [CX + (x2 - 800) * cfg.anchorScale, CY + (y2 - 677) * cfg.anchorScale + cfg.anchorDepth];
    anchors.push({ part: best, plate: toW(a[0], a[1], 0.5) });
  }
  L.finish();
  return { key, group: L.group, meshes: L.meshes, lineMats: L.lineMats(), materials: Object.values(L.mats), labels, parts, ports, anchors, tiles: recs, roots: L.roots };
}

(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const holders = [...document.querySelectorAll('.layer:not(.tile-layer)')];
  const LAYER_NAMES = [
    'Foundation',
    'Access & governance',
    'Context engine',
    'Context assembly',
    'Relevance',
    'Verified answers',
    'Across the business',
    'Action'
  ];
  const E = (name, attrs = {}, parent, content) => {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    if (content !== undefined) node.textContent = content;
    if (parent) parent.append(node);
    return node;
  };
  const G = (parent, cls = '') => E('g', cls ? { class: cls } : {}, parent);
  const line = (p, x1, y1, x2, y2, cls = 'blue-line') => E('line', { x1, y1, x2, y2, class: cls }, p);
  const rect = (p, x, y, width, height, cls = 'tile', rx = 0) => E('rect', { x, y, width, height, rx, class: cls }, p);
  const text = (p, x, y, value, cls = 'svg-small', anchor = 'start') =>
    E('text', { x, y, class: cls, 'text-anchor': anchor }, p, value);
  const circle = (p, cx, cy, r, cls = 'node') => E('circle', { cx, cy, r, class: cls }, p);
  const poly = (p, points, cls) =>
    E('polygon', { points: points.map((v) => v.join(',')).join(' '), class: cls }, p);
  const plane = (u, v, z = 0) => [500 + (u - v) * 335, 105 + (u + v) * 190 - z];
  const diamond = [
    [500, 105],
    [835, 295],
    [500, 485],
    [165, 295]
  ];
  const cellPoints = (u, v, du, dv) => [
    plane(u, v),
    plane(u + du, v),
    plane(u + du, v + dv),
    plane(u, v + dv)
  ];

  function edgeLabel(root, index, name) {
    const left = index % 2 === 0;
    const g = G(root, left ? 'edge-label edge-left' : 'edge-label edge-right');
    const label = name.toUpperCase();
    if (left) {
      E(
        'text',
        {
          class: 'slab-edge-name',
          transform: 'translate(228 372) rotate(-29)',
          'text-anchor': 'middle'
        },
        g,
        label
      );
    } else {
      E(
        'text',
        {
          class: 'slab-edge-name',
          transform: 'translate(772 372) rotate(29)',
          'text-anchor': 'middle'
        },
        g,
        label
      );
    }
  }

  function svg(label, index = 0) {
    const root = E('svg', {
      viewBox: '0 0 1000 600',
      class: `layer-svg slab-tone-${index}`,
      role: 'img',
      'aria-label': label
    });
    E('ellipse', { cx: 500, cy: 508, rx: 240, ry: 12, class: 'slab-shadow' }, root);
    // Tighter vertical extrusion for a denser assembled stack silhouette
    poly(
      root,
      [
        [165, 295],
        [500, 485],
        [835, 295],
        [835, 306],
        [500, 496],
        [165, 306]
      ],
      'slab-edge'
    );
    poly(root, diamond, 'slab-top');
    edgeLabel(root, index, LAYER_NAMES[index] || label);
    return root;
  }

  function pill(p, x, y, w, label, cls = 'tile') {
    rect(p, x, y, w, 22, cls, 11);
    text(p, x + w / 2, y + 15, label, 'svg-micro', 'middle');
  }
  function node(p, x, y, label, central = false) {
    line(p, x, y + 8, x, y + 28, 'pale-line');
    E('ellipse', { cx: x, cy: y + 30, rx: 10, ry: 3, class: 'pale-fill' }, p);
    circle(p, x, y, central ? 11 : 8, 'node');
    if (central) circle(p, x, y, 3, 'red-fill');
    text(p, x, y - 14, label, label.length > 19 ? 'svg-micro' : 'svg-small', 'middle');
  }
  function card(p, x, y, w, h, header) {
    rect(p, x, y, w, h, 'tile', 2);
    line(p, x, y + 26, x + w, y + 26, 'pale-line');
    text(p, x + 12, y + 17, header, 'svg-micro-blue');
  }

  function foundation() {
    const s = svg(
      'Foundation: UNITY internal sources and PULSE external sources join without moving the sources.',
      0
    );
    const sig = G(s, 'lod-signature system-pulse-target');
    line(sig, 500, 108, 500, 482, 'blue-line');
    text(sig, 395, 302, 'UNITY', 'svg-title', 'middle');
    text(sig, 605, 302, 'PULSE', 'svg-title', 'middle');

    const detail = G(s, 'lod-detail');
    const left = G(detail, 'foundation-left');
    const right = G(detail, 'foundation-right');
    poly(left, [[500, 105], [500, 485], [165, 295]], 'pale-fill');
    poly(left, [[500, 105], [500, 485], [165, 295]], 'blue-line');
    poly(right, [[500, 105], [835, 295], [500, 485]], 'tile');
    for (let i = 1; i < 12; i++)
      for (let j = 1; j < 9; j++) {
        const [x, y] = plane(i / 12, j / 10);
        if (x < 488 || (i + j) % 3 === 0)
          E('path', {
            d: `M${x - 4} ${y - 2}h8m-8 4h5`,
            class: x < 500 ? 'blue-line' : 'pale-line'
          }, detail);
      }
    return s;
  }

  function governance() {
    const s = svg(
      'Access and governance: role permissions change the visible record region and every request is audited.',
      1
    );
    const sig = G(s, 'lod-signature');
    rect(sig, 473, 259, 54, 47, 'blue-fill', 3);
    E('path', { d: 'M484 259v-17a16 16 0 0 1 32 0v17', class: 'blue-line', 'stroke-width': 4 }, sig);
    circle(sig, 500, 279, 4, 'tile');

    const detail = G(s, 'lod-detail');
    const cells = [];
    for (let i = 1; i < 11; i++)
      for (let j = 1; j < 9; j++) {
        const pts = cellPoints(i / 12, j / 10, 0.055, 0.055);
        cells.push({ i, j, pts });
        poly(detail, pts, 'record');
      }
    const patterns = [G(detail, 'role-pattern a'), G(detail, 'role-pattern b'), G(detail, 'role-pattern c')];
    cells.forEach(({ i, j, pts }) => {
      if ((i < 6 && j > 2 && i + j < 12) || (i === 7 && j === 4)) poly(patterns[0], pts, 'record-fill');
      if (i > 3 && j < 6 && (i * j) % 3 !== 0) poly(patterns[1], pts, 'record-fill');
      if (j > 4 && i > 2 && i < 9 && (i + j) % 2 === 0) poly(patterns[2], pts, 'record-fill');
    });
    const a = plane(0.53, 0.05);
    const b = plane(0.53, 0.95);
    poly(detail, [[a[0], a[1] - 42], [b[0], b[1] - 42], [b[0], b[1]], [a[0], a[1]]], 'pale-fill');
    poly(detail, [[a[0], a[1] - 42], [b[0], b[1] - 42], [b[0], b[1]], [a[0], a[1]]], 'pale-line');
    text(detail, 500, 194, 'CLIENT SEPARATION', 'svg-micro', 'middle');
    line(detail, 500, 306, 500, 326, 'blue-line');
    const roles = [
      ['Commercial', 314],
      ['Finance', 458],
      ['Compliance', 586]
    ];
    roles.forEach(([name, x], i) => {
      pill(detail, x, 350, 108, name);
      circle(detail, x + 15, 361, 4, i === 0 ? 'blue-fill' : 'node');
    });
    roles.forEach(([, x], i) => {
      const g = G(detail, `role-active ${['a', 'b', 'c'][i]}`);
      circle(g, x + 15, 361, 5, 'blue-fill');
    });
    for (let i = 0; i < 18; i++)
      line(detail, 350 + i * 18, 452, 350 + i * 18, 458, i % 4 === 0 ? 'blue-line' : 'pale-line');
    return s;
  }

  function contextEngine() {
    const s = svg(
      'Context engine: three source records resolve into Riverside Capital and connect to related entities and rules.',
      2
    );
    const sig = G(s, 'lod-signature');
    node(sig, 500, 220, 'Global Equity Fund', true);
    circle(sig, 405, 250, 8, 'node');
    circle(sig, 605, 250, 8, 'node');
    line(sig, 405, 250, 500, 220, 'blue-line');
    line(sig, 605, 250, 500, 220, 'blue-line');

    const detail = G(s, 'lod-detail');
    const links = [
      [[405, 250], [500, 220], 'distributes'],
      [[500, 220], [605, 250], 'sold in'],
      [[405, 250], [430, 350], 'works at'],
      [[500, 220], [570, 350], 'signed'],
      [[605, 250], [680, 340], 'applies to']
    ];
    links.forEach((v, i) => {
      line(detail, ...v[0], ...v[1], 'blue-line');
      const x = (v[0][0] + v[1][0]) / 2;
      const y = (v[0][1] + v[1][1]) / 2;
      const g = G(detail, `relation-pill r${i + 1}`);
      rect(g, x - 34, y - 9, 68, 17, 'tile', 8);
      text(g, x, y + 3, v[2], 'svg-micro', 'middle');
    });
    node(detail, 405, 250, 'Riverside Capital');
    node(detail, 500, 220, 'Global Equity Fund', true);
    node(detail, 605, 250, 'European Equities');
    node(detail, 430, 350, 'Jane Smith');
    node(detail, 570, 350, 'Distribution agreement');
    node(detail, 680, 340, 'SFDR update');
    return s;
  }

  function assembly() {
    const s = svg(
      'Context assembly: a bounded graph selection rebuilds a role-specific context set.',
      3
    );
    const coords = [
      [350, 245],
      [435, 215],
      [515, 260],
      [610, 225],
      [660, 320],
      [545, 355],
      [410, 345],
      [320, 315]
    ];
    const sig = G(s, 'lod-signature');
    E('ellipse', { cx: 447, cy: 270, rx: 100, ry: 62, class: 'red-line-svg' }, sig);
    [0, 1, 2, 5, 6].forEach((i) => circle(sig, ...coords[i], 7, 'node'));
    [
      [0, 1],
      [1, 2],
      [2, 5],
      [5, 6]
    ].forEach(([i, j]) => line(sig, ...coords[i], ...coords[j], 'blue-line'));

    const detail = G(s, 'lod-detail');
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [2, 5],
      [5, 6],
      [6, 7],
      [0, 7],
      [2, 6],
      [1, 6]
    ].forEach(([a, b]) => line(detail, ...coords[a], ...coords[b], 'faint-line'));
    coords.forEach(([x, y]) => circle(detail, x, y, 7, 'node faint-node'));
    const a = G(detail, 'selection-a');
    E('ellipse', { cx: 447, cy: 270, rx: 135, ry: 85, class: 'red-line-svg dash' }, a);
    E('ellipse', { cx: 447, cy: 270, rx: 127, ry: 77, fill: '#E7F0F5', opacity: 0.34 }, a);
    [
      [0, 1],
      [1, 2],
      [2, 5],
      [5, 6],
      [1, 6]
    ].forEach(([i, j]) => line(a, ...coords[i], ...coords[j], 'blue-line'));
    [0, 1, 2, 5, 6].forEach((i) => circle(a, ...coords[i], 8, 'node'));
    const b = G(detail, 'selection-b');
    E('ellipse', { cx: 570, cy: 285, rx: 125, ry: 80, class: 'red-line-svg dash' }, b);
    E('ellipse', { cx: 570, cy: 285, rx: 117, ry: 72, fill: '#E7F0F5', opacity: 0.34 }, b);
    [
      [2, 3],
      [3, 4],
      [2, 5]
    ].forEach(([i, j]) => line(b, ...coords[i], ...coords[j], 'blue-line'));
    [2, 3, 4, 5].forEach((i) => circle(b, ...coords[i], 8, 'node'));
    return s;
  }

  function relevance() {
    const s = svg(
      'Relevance: four signals are surfaced from 1,284 assessed items; most information fades away.',
      4
    );
    const sig = G(s, 'lod-signature');
    circle(sig, 450, 295, 10, 'node');
    circle(sig, 450, 295, 3.5, 'red-fill');
    text(sig, 500, 300, 'CONTRADICTION', 'svg-micro-red');

    const detail = G(s, 'lod-detail');
    const coords = [
      [340, 260],
      [430, 215],
      [520, 275],
      [625, 230],
      [665, 325],
      [545, 365],
      [400, 345],
      [300, 330]
    ];
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [2, 5],
      [5, 6],
      [6, 7],
      [0, 7],
      [2, 6]
    ].forEach(([a, b]) => line(detail, ...coords[a], ...coords[b], 'faint-line'));
    coords.forEach(([x, y]) => circle(detail, x, y, 6, 'node faint-node'));
    const arrivals = [
      [380, 240, -40, -20],
      [430, 200, -30, -40],
      [620, 250, 40, -20],
      [600, 360, 35, 30],
      [500, 190, 0, -45],
      [540, 390, 15, 35],
      [390, 380, -20, 40],
      [580, 210, 30, -40]
    ];
    arrivals.forEach(([x, y, dx, dy], i) => {
      const m = circle(detail, x, y, 3, 'blue-fill incoming-mark');
      m.style.setProperty('--dx', dx + 'px');
      m.style.setProperty('--dy', dy + 'px');
      m.style.setProperty('--delay', -i * 0.63 + 's');
    });
    [
      [365, 255, 'OPPORTUNITY'],
      [520, 240, 'RISK'],
      [590, 330, 'CHANGE']
    ].forEach(([x, y, label]) => {
      circle(detail, x, y, 9, 'node');
      text(detail, x + 14, y + 4, label, 'svg-micro-blue');
    });
    circle(detail, 450, 348, 9, 'node');
    text(detail, 465, 352, 'CONTRADICTION', 'svg-micro-red');
    rect(detail, 348, 375, 72, 22, 'tile', 2);
    rect(detail, 480, 375, 72, 22, 'tile', 2);
    text(detail, 384, 390, '4.2%', 'svg-micro', 'middle');
    text(detail, 516, 390, '5.1%', 'svg-micro', 'middle');
    line(detail, 420, 386, 450, 351, 'red-line-svg');
    line(detail, 480, 386, 450, 351, 'red-line-svg');
    return s;
  }

  function answers() {
    const s = svg(
      'Verified answers: context enters an open-weight model and unsupported claims are removed by a source check.',
      5
    );
    const sig = G(s, 'lod-signature');
    rect(sig, 405, 275, 190, 68, 'tile', 3);
    text(sig, 500, 305, 'Open-weight', 'svg-label', 'middle');
    text(sig, 500, 325, 'model', 'svg-label', 'middle');
    E('ellipse', { cx: 500, cy: 309, rx: 120, ry: 55, class: 'blue-line' }, sig);

    const detail = G(s, 'lod-detail');
    const tiles = [
      ['CLIENT', 320],
      ['PRODUCT', 455],
      ['MARKET', 590]
    ];
    tiles.forEach(([, x]) => {
      rect(detail, x, 395, 105, 30, 'tile', 2);
      text(detail, x + 52, 414, 'CONTEXT SET', 'svg-micro', 'middle');
      line(detail, x + 52, 395, 500, 340, 'pale-line model-pulse');
    });
    rect(detail, 405, 275, 190, 68, 'tile', 3);
    for (let i = 0; i < 7; i++) {
      line(detail, 395, 285 + i * 8, 405, 285 + i * 8, 'blue-line');
      line(detail, 595, 285 + i * 8, 605, 285 + i * 8, 'blue-line');
    }
    text(detail, 500, 305, 'Open-weight', 'svg-label', 'middle');
    text(detail, 500, 325, 'model', 'svg-label', 'middle');
    E('ellipse', { cx: 500, cy: 309, rx: 135, ry: 62, class: 'blue-line dash' }, detail);
    text(detail, 500, 380, 'RUNS IN YOUR ENVIRONMENT', 'svg-micro', 'middle');
    text(detail, 500, 112, 'SOURCE CHECK', 'svg-micro-blue', 'middle');
    const c1 = G(detail, 'claim one');
    rect(c1, 330, 132, 340, 35, 'tile', 2);
    text(c1, 344, 154, 'Client exposure increased 12%', 'svg-small');
    pill(c1, 548, 139, 110, 'contract record');
    const c2 = G(detail, 'claim two');
    rect(c2, 330, 176, 340, 35, 'tile', 2);
    text(c2, 344, 198, 'Usage moved above threshold', 'svg-small');
    pill(c2, 565, 183, 93, 'usage log');
    const c3 = G(detail, 'claim reject');
    rect(c3, 330, 220, 340, 35, 'red-line-svg dash', 2);
    text(c3, 344, 242, 'Unverified market assertion', 'svg-small');
    pill(c3, 536, 227, 105, 'no matching record');
    text(c3, 655, 244, '×', 'svg-micro-red', 'middle');
    return s;
  }

  function drawDeptMotif(g, kind, x, y, w, h) {
    const detail = G(g, 'lod-detail');
    const left = x - w / 2;
    const top = y - h / 2;
    if (kind === 'commercial') {
      [
        ['Aster Bank', '92'],
        ['Riverside', '88'],
        ['Northbank', '74']
      ].forEach(([n, v], j) => {
        text(detail, left + 14, top + 58 + j * 16, n, 'svg-micro');
        text(detail, left + w - 14, top + 58 + j * 16, v, 'svg-micro-blue', 'end');
        if (j === 0) circle(detail, left + w - 36, top + 54, 2.5, 'red-fill');
      });
    } else if (kind === 'product') {
      [0, 1, 2, 3].forEach((i) => {
        rect(detail, left + 18 + i * 42, top + 56, 34, 10, i === 2 ? 'blue-fill' : 'tile', 2);
      });
      text(detail, x, top + h - 14, 'Roadmap stages', 'svg-micro', 'middle');
    } else if (kind === 'operations') {
      [0, 1, 2].forEach((i) => {
        line(detail, left + 20, top + 58 + i * 16, left + w - 20, top + 58 + i * 16, 'pale-line');
        circle(detail, left + 36 + i * 48, top + 58 + i * 16, 3.5, i === 1 ? 'red-fill' : 'node');
      });
    } else if (kind === 'finance') {
      [28, 44, 36, 52].forEach((bh, i) => {
        rect(detail, left + 28 + i * 36, top + 98 - bh, 22, bh, i === 3 ? 'blue-fill' : 'tile', 1);
      });
      text(detail, left + w - 16, top + 58, '2.4%', 'svg-micro-blue', 'end');
    } else if (kind === 'engineering') {
      const nodes = [
        [left + 40, top + 70],
        [x, top + 58],
        [left + w - 40, top + 70],
        [x, top + 92]
      ];
      nodes.forEach(([nx, ny], i) => {
        if (i < 3) line(detail, nx, ny, nodes[3][0], nodes[3][1], 'pale-line');
        circle(detail, nx, ny, 5, i === 3 ? 'blue-fill' : 'node');
      });
    } else if (kind === 'legal') {
      rect(detail, x - 28, top + 52, 56, 48, 'tile', 2);
      line(detail, x - 18, top + 64, x + 18, top + 64, 'pale-line');
      line(detail, x - 18, top + 74, x + 12, top + 74, 'pale-line');
      line(detail, x - 18, top + 84, x + 16, top + 84, 'pale-line');
      circle(detail, x + 22, top + 58, 3, 'red-fill');
    }
  }

  function business() {
    const s = svg(
      'Across the business: six departments query one shared Context Core.',
      6
    );
    const cx = 500;
    const cy = 295;
    const modules = [
      { name: 'Product', desc: 'Roadmap and market themes', kind: 'product', x: 500, y: 148 },
      { name: 'Operations', desc: 'Process lanes and exceptions', kind: 'operations', x: 700, y: 220 },
      { name: 'Finance', desc: 'Performance and exposure', kind: 'finance', x: 700, y: 380 },
      { name: 'Engineering', desc: 'Integration and system health', kind: 'engineering', x: 500, y: 448 },
      { name: 'Legal', desc: 'Policy and obligations', kind: 'legal', x: 300, y: 380 },
      { name: 'Commercial', desc: 'Opportunities and revenue', kind: 'commercial', x: 300, y: 220 }
    ];
    const w = 168;
    const h = 112;

    modules.forEach(({ x, y }) => {
      const dx = x - cx;
      const dy = y - cy;
      const len = Math.hypot(dx, dy) || 1;
      const portR = 52;
      const moduleR = Math.min(w, h) * 0.42;
      const sx = cx + (dx / len) * portR;
      const sy = cy + (dy / len) * portR;
      const ex = x - (dx / len) * moduleR;
      const ey = y - (dy / len) * moduleR;
      line(s, sx, sy, ex, ey, 'dept-spoke');
      circle(s, ex, ey, 4, 'dept-port');
    });

    const core = G(s, 'lod-signature system-pulse-target');
    E('ellipse', { cx, cy: cy + 8, rx: 210, ry: 118, class: 'pale-fill operating-platform' }, core);
    E('ellipse', { cx, cy: cy + 8, rx: 210, ry: 118, class: 'pale-line' }, core);
    circle(core, cx, cy, 52, 'context-core');
    circle(core, cx, cy, 40, 'context-core-ring');
    text(core, cx, cy - 4, 'Context Core', 'svg-title', 'middle');
    text(core, cx, cy + 14, 'ACTIVE CONTEXT', 'svg-micro', 'middle');

    modules.forEach(({ name, desc, kind, x, y }) => {
      const g = G(s, 'dept-card system-pulse-target');
      rect(g, x - w / 2, y - h / 2, w, h, 'dept-module', 3);
      text(g, x, y - h / 2 + 22, name, 'dept-label', 'middle');
      text(g, x, y - h / 2 + 40, desc, 'dept-desc', 'middle');
      drawDeptMotif(g, kind, x, y, w, h);
      const dx = x - cx;
      const dy = y - cy;
      const len = Math.hypot(dx, dy) || 1;
      const px = x - (dx / len) * (Math.min(w, h) * 0.42);
      const py = y - (dy / len) * (Math.min(w, h) * 0.42);
      circle(g, px, py, 4, 'dept-port');
    });
    return s;
  }

  function complete() {
    const s = svg(
      'Action: verified context rises into shared experience surfaces.',
      7
    );
    const sig = G(s, 'lod-signature');
    // Thin action gateway — upward ports toward the experience bus
    line(sig, 320, 340, 680, 340, 'blue-line');
    text(sig, 500, 325, 'Action', 'svg-title', 'middle');
    text(sig, 500, 360, 'TO EXPERIENCE SURFACES', 'svg-micro', 'middle');
    [360, 440, 500, 560, 640].forEach((x, i) => {
      line(sig, x, 340, x, 250 - (i % 2) * 18, 'pale-line');
      circle(sig, x, 250 - (i % 2) * 18, 5, 'action-port');
      if (i === 2) circle(sig, x, 250, 2.5, 'red-fill');
    });
    return s;
  }

  [foundation, governance, contextEngine, assembly, relevance, answers, business, complete].forEach(
    (build, index) => holders[index].append(build())
  );
})();

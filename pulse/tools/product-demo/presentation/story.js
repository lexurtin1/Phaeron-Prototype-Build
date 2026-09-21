(() => {
  'use strict';
  const LAYERS = [
    { id: 'data',     num: '01',  title: 'A common data foundation',       role: 'slab', y: 155, ySmall: 58 },
    { id: 'security', num: '02',  title: 'Access & governance',            role: 'slab', y: 100, ySmall: 36 },
    { id: 'engine',   num: '03',  title: 'The context engine',             role: 'slab', y: 45,  ySmall: 14 },
    { id: 'ontology', num: '04',  title: 'A connected business model',     role: 'slab', y: -10, ySmall: -8 },
    { id: 'business', num: '05',  title: 'The context hub & departments',  role: 'slab', y: -65, ySmall: -30,
      hub: true, orb: true },
    { id: 'agents-a', num: '05A', title: 'Layer 5A — the connected stack', role: 'overlay', variant: 'a' },
    { id: 'agents-b', num: '05B', title: 'Layer 5B — the complete stack',  role: 'overlay', variant: 'b' }
  ];
  const chapters = [...document.querySelectorAll('.chapter')];
  const layers = [...document.querySelectorAll('.layer')];
  const links = [...document.querySelectorAll('.layer-nav a')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 760px)');
  const captionNumber = document.querySelector('#caption-number');
  const captionTitle = document.querySelector('#caption-title');
  const captionAside = document.querySelector('#caption-aside');
  const viewMode = document.querySelector('#view-mode');
  const diagram = document.querySelector('#diagram');
  const connectorOverlay = document.querySelector('#stack-connections');
  const geometry = window.PhaeronHub;
  const titles = ['The connected architecture', ...LAYERS.map(l => l.title)];
  const identifiers = ['ALL', ...LAYERS.map(l => l.num)];
  const lastSceneIndex = chapters.length - 1;
  const hubLayerIndex = LAYERS.findIndex(l => l.hub);
  const hubLayer = layers[hubLayerIndex];
  const hubMedia = hubLayer.querySelector('img, svg');
  const connectors = [];
  LAYERS.forEach((layerDef, index) => {
    if (layerDef.role !== 'overlay') return;
    const layerEl = layers[index];
    const media = layerEl.querySelector('img, svg');
    geometry.connections[layerDef.variant].forEach(([source, department]) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('data-department', department);
      line.setAttribute('data-variant', layerDef.variant);
      connectorOverlay.append(line);
      connectors.push({ line, source, department, layer: layerEl, image: media });
    });
  });
  const progress = document.querySelector('#reading-progress');
  const dataConnectors = [...document.querySelectorAll('[data-layer="0"] .data-connector')];
  dataConnectors.forEach(path => {
    const length = path.getTotalLength();
    path.dataset.length = String(length);
    path.style.strokeDasharray = `${Math.min(32, length * .18)} ${length}`;
    path.style.strokeDashoffset = String(length);
  });
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const smooth = value => value * value * (3 - 2 * value);
  const mix = (a, b, t) => a + (b - a) * t;
  let anchors = [], frame = 0, lastScene = -1, stackFit = 1, hubVisible = null;
  // Convert native SVG coordinates through the current CSS zoom and object-fit.
  // Both ends are measured in the same diagram coordinate system on every frame.
  function paintedPoint(rect, viewBox, point, origin) {
    const [vx, vy, vw, vh] = viewBox;
    const scale = Math.min(rect.width / vw, rect.height / vh);
    return [
      rect.left - origin.left + (rect.width - vw * scale) / 2 + (point[0] - vx) * scale,
      rect.top - origin.top + (rect.height - vh * scale) / 2 + (point[1] - vy) * scale
    ];
  }
  function connectStack() {
    const origin = diagram.getBoundingClientRect();
    const hubRect = hubMedia.getBoundingClientRect();
    const agentRects = new Map();
    connectorOverlay.setAttribute('viewBox', `0 0 ${origin.width} ${origin.height}`);
    connectors.forEach(({ line, source, department, layer, image }) => {
      if (!agentRects.has(image)) agentRects.set(image, image.getBoundingClientRect());
      const from = paintedPoint(agentRects.get(image), geometry.agentViewBox, source, origin);
      const to = paintedPoint(hubRect, geometry.hubViewBox, geometry.ports[department], origin);
      line.setAttribute('x1', from[0]); line.setAttribute('y1', from[1]);
      line.setAttribute('x2', to[0]); line.setAttribute('y2', to[1]);
      line.style.opacity = Math.min(Number(layer.style.getPropertyValue('--alpha')), Number(hubLayer.style.getPropertyValue('--alpha')));
    });
    const visible = Number(hubLayer.style.getPropertyValue('--alpha')) > .01;
    if (visible !== hubVisible) {
      hubVisible = visible;
      document.dispatchEvent(new CustomEvent('phaeron:hub-visibility', { detail: { visible } }));
    }
  }
  function measure() {
    anchors = chapters.map(el => window.scrollY + el.getBoundingClientRect().top);
    const height = diagram.getBoundingClientRect().height || window.innerHeight * .65;
    stackFit = Math.min(1, height / (mobile.matches ? 245 : 640));
  }
  // Scroll-driven pulses along Layer 01 connectors. Tiles stay still.
  function pulseDataConnectors(scene, next, local, blend) {
    const onConnect = scene === 1 || next === 1;
    dataConnectors.forEach((path, index) => {
      const length = Number(path.dataset.length) || path.getTotalLength();
      if (reducedMotion.matches) {
        path.style.strokeDasharray = 'none';
        path.style.strokeDashoffset = '0';
        path.style.opacity = onConnect ? '0.9' : '0';
        return;
      }
      if (!onConnect) {
        path.style.opacity = '0';
        return;
      }
      const pulse = Math.min(32, length * .18);
      path.style.strokeDasharray = `${pulse} ${length}`;
      path.style.opacity = '1';
      let travel = 0;
      if (scene === 1 && next === 1) travel = local;
      else if (scene === 0 && next === 1) travel = blend;
      else if (scene === 1 && next === 2) travel = 1 - blend;
      else if (scene === 1) travel = local;
      const stagger = index * .11;
      const packet = clamp((travel - stagger) / .55);
      path.style.strokeDashoffset = String(length - packet * (length + pulse));
    });
  }
  function pose(scene, layer, small) {
    const layerDef = LAYERS[layer];
    // 5A restores the entire foundation. 5B keeps it fixed and adds its network to 5A.
    if (scene === 0 || scene >= lastSceneIndex - 1) {
      if (layerDef.role === 'slab') {
        const y = small ? layerDef.ySmall : layerDef.y;
        return { y: y * stackFit, scale: (small ? .50 : .62) * stackFit, opacity: 1 };
      }
      const visible = layerDef.variant === 'a' || scene === 0 || scene === lastSceneIndex;
      return {
        y: (small ? (visible ? -75 : -100) : (visible ? -165 : -215)) * stackFit,
        scale: (small ? .90 : 1.02) * stackFit,
        opacity: visible ? 1 : 0
      };
    }
    const selected = scene - 1;
    if (layer === selected) return { y: 0, scale: small ? .96 : 1.08, opacity: 1 };
    const distance = layer - selected;
    return { y: -Math.sign(distance) * (small ? 170 : 390) - distance * (small ? 20 : 35), scale: small ? .52 : .62, opacity: 0 };
  }
  function render() {
    frame = 0;
    // Early chapters isolate layers; the last two build and complete a cumulative stack.
    const y = window.scrollY;
    // Align scene switches with Pulse ModuleChrome (72) + Studio topbar (52).
    const offset = mobile.matches ? 130 : 134;
    let scene = 0;
    while (scene < anchors.length - 1 && y >= anchors[scene + 1] - offset) scene++;
    const next = Math.min(scene + 1, chapters.length - 1);
    const start = Math.max(0, anchors[scene] - offset);
    const end = anchors[next] - offset;
    const local = next === scene ? clamp((y - start) / Math.max(1, chapters[scene].getBoundingClientRect().height || window.innerHeight)) : clamp((y - start) / Math.max(1, end - start));
    let t = next === scene ? 0 : smooth(clamp((local - .64) / .36));
    if (reducedMotion.matches) t = 0;
    const small = mobile.matches;
    layers.forEach((el, i) => {
      const a = pose(scene, i, small), b = pose(next, i, small);
      el.style.setProperty('--y', mix(a.y, b.y, t) + 'px');
      el.style.setProperty('--scale', mix(a.scale, b.scale, t));
      el.style.setProperty('--alpha', mix(a.opacity, b.opacity, t));
      // Preserve the original depth order while the architecture separates.
      el.style.zIndex = i + 1;
    });
    connectStack();
    pulseDataConnectors(scene, next, local, t);
    if (scene !== lastScene) {
      lastScene = scene;
      captionNumber.textContent = scene === 0 ? '01 — 05B' : 'LAYER ' + identifiers[scene];
      captionTitle.textContent = titles[scene];
      captionAside.textContent = scene === 0 ? 'SCROLL TO SEPARATE' : scene === lastSceneIndex ? 'STACK COMPLETE' : scene === lastSceneIndex - 1 ? 'FULL STACK + 5A' : 'ISOLATED LAYER';
      viewMode.textContent = scene === 0 ? 'CONNECTED' : 'LAYER ' + identifiers[scene];
      diagram.setAttribute('aria-label', titles[scene]);
      links.forEach((link, i) => {
        if (i === scene - 1) link.setAttribute('aria-current', 'step');
        else link.removeAttribute('aria-current');
      });
    }
    const readable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    progress.style.width = clamp(y / readable) * 100 + '%';
    const footer = document.querySelector('.footer').getBoundingClientRect();
    document.querySelector('.stage').style.visibility = small && footer.top < window.innerHeight * .5 ? 'hidden' : 'visible';
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(render); }
  measure(); render();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', () => { measure(); schedule(); });
  window.addEventListener('pageshow', () => { measure(); schedule(); });
  reducedMotion.addEventListener('change', schedule);
  if ('ResizeObserver' in window) new ResizeObserver(() => { measure(); schedule(); }).observe(document.querySelector('.chapters'));
})();

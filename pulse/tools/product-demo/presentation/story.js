(() => {
  'use strict';
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
  const hubImage = layers[4].querySelector('img');
  const connectors = [];
  ['a', 'b'].forEach((variant, index) => {
    geometry.connections[variant].forEach(([source, department]) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('data-department', department);
      line.setAttribute('data-variant', variant);
      connectorOverlay.append(line);
      connectors.push({ line, source, department, layer: layers[index + 5], image: layers[index + 5].querySelector('img') });
    });
  });
  const progress = document.querySelector('#reading-progress');
  const titles = ['The connected architecture', 'A common data foundation', 'Access & governance', 'The context engine', 'A connected business model', 'The context hub & departments', 'Layer 5A — the connected stack', 'Layer 5B — the complete stack'];
  const identifiers = ['ALL', '01', '02', '03', '04', '05', '05A', '05B'];
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
    const hubRect = hubImage.getBoundingClientRect();
    const agentRects = new Map();
    connectorOverlay.setAttribute('viewBox', `0 0 ${origin.width} ${origin.height}`);
    connectors.forEach(({ line, source, department, layer, image }) => {
      if (!agentRects.has(image)) agentRects.set(image, image.getBoundingClientRect());
      const from = paintedPoint(agentRects.get(image), geometry.agentViewBox, source, origin);
      const to = paintedPoint(hubRect, geometry.hubViewBox, geometry.ports[department], origin);
      line.setAttribute('x1', from[0]); line.setAttribute('y1', from[1]);
      line.setAttribute('x2', to[0]); line.setAttribute('y2', to[1]);
      line.style.opacity = Math.min(Number(layer.style.getPropertyValue('--alpha')), Number(layers[4].style.getPropertyValue('--alpha')));
    });
    const visible = Number(layers[4].style.getPropertyValue('--alpha')) > .01;
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
  function pose(scene, layer, small) {
    // 5A restores the entire foundation. 5B keeps it fixed and adds its network to 5A.
    if (scene === 0 || scene >= 6) {
      const positions = small ? [58, 36, 14, -8, -30] : [155, 100, 45, -10, -65];
      if (layer < 5) return { y: positions[layer] * stackFit, scale: (small ? .50 : .62) * stackFit, opacity: 1 };
      const visible = layer === 5 || scene === 0 || scene === 7;
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
    if (scene !== lastScene) {
      lastScene = scene;
      captionNumber.textContent = scene === 0 ? '01 — 05B' : 'LAYER ' + identifiers[scene];
      captionTitle.textContent = titles[scene];
      captionAside.textContent = scene === 0 ? 'SCROLL TO SEPARATE' : scene === 7 ? 'STACK COMPLETE' : scene === 6 ? 'FULL STACK + 5A' : 'ISOLATED LAYER';
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

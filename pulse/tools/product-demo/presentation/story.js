(() => {
  'use strict';
  const chapters = [...document.querySelectorAll('.chapter')];
  const slabs = [...document.querySelectorAll('.layer:not(.tile-layer)')];
  const tileA = document.querySelector('.tile-layer[data-layer="8a"]');
  const tileB = document.querySelector('.tile-layer[data-layer="8b"]');
  const tileImgA = tileA?.querySelector('img');
  const tileImgB = tileB?.querySelector('img');
  const systemLinks = document.querySelector('#tile-links');
  const links = [...document.querySelectorAll('.layer-nav a')];
  const page = document.body;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 760px)');
  const diagram = document.querySelector('#diagram');
  const captionNumber = document.querySelector('#caption-number');
  const captionTitle = document.querySelector('#caption-title');
  const captionAside = document.querySelector('#caption-aside');
  const viewMode = document.querySelector('#view-mode');
  const progress = document.querySelector('#reading-progress');
  const titles = [
    'The complete context architecture',
    'Foundation',
    'Access and governance',
    'Context engine',
    'Context assembly',
    'Relevance',
    'Verified answers',
    'Across the business',
    'The complete system',
    'Front-end systems',
    'Executive surfaces'
  ];
  const ids = ['ALL', '01', '02', '03', '04', '05', '06', '07', '08', '08A', '08B'];
  // Tile port centers in 1600×700 assets (group translate + port at cy=139)
  const PORTS_A = [
    [419 / 1600, (502 + 139) / 700],
    [604 / 1600, (350 + 139) / 700],
    [868 / 1600, (317 + 139) / 700],
    [1104 / 1600, (414 + 139) / 700]
  ];
  const PORTS_B = [
    [496 / 1600, (414 + 139) / 700],
    [732 / 1600, (317 + 139) / 700],
    [996 / 1600, (350 + 139) / 700],
    [1181 / 1600, (502 + 139) / 700]
  ];
  const BUS_Y = 640 / 700;

  let hubShown = null;
  let busNodes = null;
  const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
  const smooth = (v) => v * v * (3 - 2 * v);
  const mix = (a, b, t) => a + (b - a) * t;
  let anchors = [], frame = 0, last = -1, fit = 1;

  function measure() {
    anchors = chapters.map((el) => window.scrollY + el.getBoundingClientRect().top);
    const h = diagram.getBoundingClientRect().height || window.innerHeight * 0.64;
    fit = Math.min(1, h / (mobile.matches ? 330 : 650));
  }

  function slabPose(scene, index, small) {
    const assembled = scene === 0 || scene >= 8;
    if (assembled) {
      const gap = small ? 12 : 26;
      const base = small ? 44 : 95;
      const tileLift = scene === 0 || scene >= 9 ? (small ? 56 : 92) : 0;
      // Fade inactive lower slabs by opacity — not by dashed drafting
      const opacity = index >= 6 ? 1 : clamp(0.32 + index * 0.08, 0.32, 0.72);
      return {
        y: (base - index * gap + tileLift) * fit,
        scale: (small ? 0.55 : 0.68) * fit,
        opacity
      };
    }
    const selected = scene - 1;
    if (index === selected) return { y: 0, scale: (small ? 0.94 : 1.02) * fit, opacity: 1 };
    const direction = index < selected ? 1 : -1;
    return { y: direction * (small ? 190 : 430) * fit, scale: (small ? 0.55 : 0.62) * fit, opacity: 0 };
  }

  function tilePose(scene, bank, small) {
    const showA = scene === 0 || scene >= 9;
    const showB = scene === 0 || scene >= 10;
    const visible = bank === 'a' ? showA : showB;
    const baseY = small ? -6 : -12;
    const scale = small ? 0.86 : 0.9;
    if (!visible) return { y: baseY + 16, scale, opacity: 0 };
    return { y: baseY, scale, opacity: 1 };
  }

  function pointOnImg(img, nx, ny) {
    if (!img) return null;
    const r = img.getBoundingClientRect();
    const d = diagram.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return null;
    return {
      x: r.left - d.left + r.width * nx,
      y: r.top - d.top + r.height * ny
    };
  }

  function ensureBus() {
    if (!systemLinks || busNodes) return busNodes;
    const NS = 'http://www.w3.org/2000/svg';
    systemLinks.innerHTML = '';
    const marker = document.createElementNS(NS, 'marker');
    marker.setAttribute('id', 'bus-arrow');
    marker.setAttribute('viewBox', '0 0 8 8');
    marker.setAttribute('refX', '7');
    marker.setAttribute('refY', '4');
    marker.setAttribute('markerWidth', '6');
    marker.setAttribute('markerHeight', '6');
    marker.setAttribute('orient', 'auto');
    const tip = document.createElementNS(NS, 'path');
    tip.setAttribute('d', 'M0 0 8 4 0 8Z');
    tip.setAttribute('fill', '#397DA8');
    marker.append(tip);
    const defs = document.createElementNS(NS, 'defs');
    defs.append(marker);
    systemLinks.append(defs);

    const bus = document.createElementNS(NS, 'path');
    bus.setAttribute('class', 'bus-line');
    systemLinks.append(bus);
    const drops = [];
    const risers = [];
    const ports = [];
    for (let i = 0; i < 8; i++) {
      const drop = document.createElementNS(NS, 'path');
      drop.setAttribute('class', 'bus-drop');
      drop.setAttribute('marker-end', 'url(#bus-arrow)');
      systemLinks.append(drop);
      drops.push(drop);
      const riser = document.createElementNS(NS, 'path');
      riser.setAttribute('class', 'bus-riser');
      systemLinks.append(riser);
      risers.push(riser);
      const port = document.createElementNS(NS, 'circle');
      port.setAttribute('class', 'conn-port');
      port.setAttribute('r', '3.5');
      systemLinks.append(port);
      ports.push(port);
    }
    busNodes = { bus, drops, risers, ports };
    return busNodes;
  }

  function connectSystem(scene, alphaA, alphaB) {
    if (!systemLinks) return;
    const nodes = ensureBus();
    const show = (scene === 0 || scene >= 8) && (alphaA > 0.15 || alphaB > 0.15);
    const active = scene === 0 || scene >= 8;
    const strength =
      scene === 0 || scene >= 9 ? 1 : scene === 8 ? 0.75 : scene === 7 ? 0.55 : 0.4;
    systemLinks.style.opacity = show ? String(strength) : '0';
    systemLinks.classList.toggle('is-active', active && (scene >= 8 || scene === 0));
    if (!show) return;

    const dbox = diagram.getBoundingClientRect();
    systemLinks.setAttribute('viewBox', `0 0 ${Math.max(1, dbox.width)} ${Math.max(1, dbox.height)}`);

    const points = [];
    if (alphaA > 0.15 && tileImgA) {
      PORTS_A.forEach(([nx, ny]) => {
        const p = pointOnImg(tileImgA, nx, ny);
        if (p) points.push(p);
      });
    }
    if (alphaB > 0.15 && tileImgB) {
      PORTS_B.forEach(([nx, ny]) => {
        const p = pointOnImg(tileImgB, nx, ny);
        if (p) points.push(p);
      });
    }
    if (points.length < 2) return;

    const busY = pointOnImg(tileImgA || tileImgB, 0.5, BUS_Y)?.y ?? points[0].y + 24;
    const xs = points.map((p) => p.x).sort((a, b) => a - b);
    nodes.bus.setAttribute('d', `M${xs[0].toFixed(1)} ${busY.toFixed(1)}H${xs[xs.length - 1].toFixed(1)}`);

    points.forEach((p, i) => {
      if (!nodes.drops[i]) return;
      nodes.drops[i].setAttribute('d', `M${p.x.toFixed(1)} ${p.y.toFixed(1)}V${busY.toFixed(1)}`);
      nodes.drops[i].style.opacity = '1';
      const below = busY + (mobile.matches ? 14 : 22);
      nodes.risers[i].setAttribute('d', `M${p.x.toFixed(1)} ${busY.toFixed(1)}V${below.toFixed(1)}`);
      nodes.risers[i].style.opacity = '1';
      nodes.ports[i].setAttribute('cx', p.x.toFixed(1));
      nodes.ports[i].setAttribute('cy', busY.toFixed(1));
      nodes.ports[i].style.opacity = '1';
    });
    for (let i = points.length; i < 8; i++) {
      nodes.drops[i].style.opacity = '0';
      nodes.risers[i].style.opacity = '0';
      nodes.ports[i].style.opacity = '0';
    }
  }

  function render() {
    frame = 0;
    const y = window.scrollY;
    const offset = mobile.matches ? 130 : 134;
    let scene = 0;
    while (scene < anchors.length - 1 && y >= anchors[scene + 1] - offset) scene++;
    const next = Math.min(scene + 1, chapters.length - 1);
    const start = Math.max(0, anchors[scene] - offset);
    const end = anchors[next] - offset;
    const local = next === scene ? 0 : clamp((y - start) / Math.max(1, end - start));
    let t = next === scene ? 0 : smooth(clamp((local - 0.66) / 0.34));
    if (reduced.matches) t = 0;
    const small = mobile.matches;

    page.dataset.scene = String(scene === next || t < 0.5 ? scene : next);

    slabs.forEach((el, i) => {
      const a = slabPose(scene, i, small);
      const b = slabPose(next, i, small);
      el.style.setProperty('--y', mix(a.y, b.y, t) + 'px');
      el.style.setProperty('--scale', mix(a.scale, b.scale, t));
      el.style.setProperty('--alpha', mix(a.opacity, b.opacity, t));
      el.style.zIndex = String(i + 1);
      const focus = scene === 0 || scene >= 8 || i === scene - 1;
      el.classList.toggle('is-focus', focus);
    });

    const hubAlpha = mix(slabPose(scene, 7, small).opacity, slabPose(next, 7, small).opacity, t);
    const showHub = hubAlpha > 0.35;
    if (showHub !== hubShown) {
      hubShown = showHub;
      document.dispatchEvent(new CustomEvent('phaeron:hub-visibility', { detail: { visible: showHub } }));
    }

    let alphaA = 0;
    let alphaB = 0;
    if (tileA) {
      const a = tilePose(scene, 'a', small);
      const b = tilePose(next, 'a', small);
      alphaA = mix(a.opacity, b.opacity, t);
      tileA.style.setProperty('--y', mix(a.y, b.y, t) + 'px');
      tileA.style.setProperty('--scale', mix(a.scale, b.scale, t));
      tileA.style.setProperty('--alpha', alphaA);
      tileA.style.zIndex = '20';
      tileA.setAttribute('aria-hidden', alphaA < 0.05 ? 'true' : 'false');
    }
    if (tileB) {
      const a = tilePose(scene, 'b', small);
      const b = tilePose(next, 'b', small);
      alphaB = mix(a.opacity, b.opacity, t);
      tileB.style.setProperty('--y', mix(a.y, b.y, t) + 'px');
      tileB.style.setProperty('--scale', mix(a.scale, b.scale, t));
      tileB.style.setProperty('--alpha', alphaB);
      tileB.style.zIndex = '21';
      tileB.setAttribute('aria-hidden', alphaB < 0.05 ? 'true' : 'false');
    }

    connectSystem(scene === next ? scene : t > 0.5 ? next : scene, alphaA, alphaB);

    if (scene !== last) {
      last = scene;
      if (scene === 0) {
        captionNumber.textContent = '01 — 08B';
        captionAside.textContent = 'SCROLL TO DECONSTRUCT';
        viewMode.textContent = 'ASSEMBLED';
      } else if (scene === 8) {
        captionNumber.textContent = 'LAYER 08 / 08';
        captionAside.textContent = 'SYSTEM COMPLETE';
        viewMode.textContent = 'LAYER 08';
      } else if (scene === 9) {
        captionNumber.textContent = 'LAYER 08A';
        captionAside.textContent = 'FRONT-END SYSTEMS';
        viewMode.textContent = 'LAYER 08A';
      } else if (scene === 10) {
        captionNumber.textContent = 'LAYER 08B';
        captionAside.textContent = 'EXECUTIVE SURFACES';
        viewMode.textContent = 'LAYER 08B';
      } else {
        captionNumber.textContent = 'LAYER ' + ids[scene] + ' / 08';
        captionAside.textContent = 'ISOLATED LAYER';
        viewMode.textContent = 'LAYER ' + ids[scene];
      }
      captionTitle.textContent = titles[scene];
      diagram.setAttribute('aria-label', titles[scene]);
      links.forEach((link, i) =>
        i === scene - 1 ? link.setAttribute('aria-current', 'step') : link.removeAttribute('aria-current')
      );
    }

    const readable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    progress.style.width = clamp(y / readable) * 100 + '%';
    const footer = document.querySelector('.footer').getBoundingClientRect();
    document.querySelector('.stage').style.visibility =
      small && footer.top < window.innerHeight * 0.5 ? 'hidden' : 'visible';
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  measure();
  render();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', () => {
    measure();
    schedule();
  });
  window.addEventListener('pageshow', () => {
    measure();
    schedule();
  });
  reduced.addEventListener('change', schedule);
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => {
      measure();
      schedule();
    }).observe(document.querySelector('.chapters'));
  }
})();

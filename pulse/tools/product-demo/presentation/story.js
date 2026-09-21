(() => {
  'use strict';
  const chapters = [...document.querySelectorAll('.chapter')];
  const slabs = [...document.querySelectorAll('.layer:not(.tile-layer)')];
  const tileA = document.querySelector('.tile-layer[data-layer="8a"]');
  const tileB = document.querySelector('.tile-layer[data-layer="8b"]');
  const tileImgA = tileA?.querySelector('img');
  const tileImgB = tileB?.querySelector('img');
  const systemLinks = document.querySelector('#system-links');
  const labelRail = document.querySelector('#stack-label-rail');
  const links = [...document.querySelectorAll('.layer-nav a')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 760px)');
  const diagram = document.querySelector('#diagram');
  const captionNumber = document.querySelector('#caption-number');
  const captionTitle = document.querySelector('#caption-title');
  const captionAside = document.querySelector('#caption-aside');
  const viewMode = document.querySelector('#view-mode');
  const progress = document.querySelector('#reading-progress');
  const page = document.body;
  const titles = [
    'The complete context architecture',
    'Foundation',
    'Access and governance',
    'Context engine',
    'Context assembly',
    'Relevance',
    'Verified answers',
    'Across the business',
    'Action',
    'Front-end systems',
    'Executive surfaces'
  ];
  const ids = ['ALL', '01', '02', '03', '04', '05', '06', '07', '08', '08A', '08B'];
  const RAIL_LABELS = [
    ['01', 'Foundation'],
    ['02', 'Access & governance'],
    ['03', 'Context engine'],
    ['04', 'Context assembly'],
    ['05', 'Relevance'],
    ['06', 'Verified answers'],
    ['07', 'Across the business'],
    ['08', 'Action']
  ];
  // Tile column centers and bus band in 1600×700 assets
  const COLS = [220 / 1600, 560 / 1600, 900 / 1600, 1240 / 1600];
  const ROW_A = 150 / 700;
  const ROW_B = 400 / 700;
  const BUS_Y = 300 / 700;

  const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
  const smooth = (v) => v * v * (3 - 2 * v);
  const mix = (a, b, t) => a + (b - a) * t;
  let anchors = [], frame = 0, last = -1, fit = 1;
  let railNodes = null;
  let busNodes = null;

  function measure() {
    anchors = chapters.map((el) => window.scrollY + el.getBoundingClientRect().top);
    const h = diagram.getBoundingClientRect().height || window.innerHeight * 0.64;
    fit = Math.min(1, h / (mobile.matches ? 330 : 650));
  }

  function isAssembled(scene) {
    return scene === 0 || scene >= 8;
  }

  function slabPose(scene, index, small) {
    if (isAssembled(scene)) {
      const tileLift = scene === 0 || scene >= 9 ? (small ? 48 : 80) : scene === 8 ? (small ? 20 : 36) : 0;
      // Layers 0–5: compacted silhouette in the lower half
      if (index <= 5) {
        const gap = small ? 8 : 12;
        const base = small ? 78 : 155;
        const opacity = 0.26 + index * 0.06;
        return {
          y: (base - index * gap + tileLift) * fit,
          scale: (small ? 0.46 : 0.55) * fit,
          opacity: clamp(opacity, 0.25, 0.55)
        };
      }
      // Layer 07 business: operating platform above the stack
      if (index === 6) {
        const withTiles = scene === 0 || scene >= 9;
        return {
          y: ((small ? 4 : withTiles ? 8 : -24) + tileLift * 0.08) * fit,
          scale: (small ? 0.55 : withTiles ? 0.64 : 0.78) * fit,
          opacity: 1
        };
      }
      // Layer 08 action: thin gateway between platform and experience bus
      return {
        y: ((small ? 42 : 62) + tileLift * 0.25) * fit,
        scale: (small ? 0.38 : 0.44) * fit,
        opacity: scene === 0 || scene >= 8 ? 0.55 : 0.4
      };
    }

    const selected = scene - 1;
    if (index === selected) {
      const expand = selected === 6 ? 1.08 : 1.02;
      return { y: 0, scale: (small ? 0.94 : expand) * fit, opacity: 1 };
    }
    const direction = index < selected ? 1 : -1;
    const compress = Math.abs(index - selected) > 1 ? 0.48 : 0.55;
    return {
      y: direction * (small ? 170 : 380) * fit,
      scale: (small ? compress : compress + 0.04) * fit,
      opacity: 0
    };
  }

  function tilePose(scene, bank, small) {
    const showA = scene === 0 || scene >= 9;
    const showB = scene === 0 || scene >= 10;
    const visible = bank === 'a' ? showA : showB;
    // Both banks share one overlay frame; row separation lives in the SVG art
    const baseY = small ? 0 : 2;
    const scale = small ? 0.86 : 0.92;
    if (!visible) return { y: baseY + 10, scale, opacity: 0 };
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

  function ensureRail() {
    if (!labelRail || railNodes) return railNodes;
    labelRail.innerHTML = '';
    railNodes = RAIL_LABELS.map(([idx, name], i) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'stack-label');
      g.dataset.layer = String(i);

      const leader = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      leader.setAttribute('class', 'stack-label-leader');
      g.append(leader);

      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bg.setAttribute('class', 'stack-label-bg');
      bg.setAttribute('rx', '2');
      g.append(bg);

      const rule = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rule.setAttribute('class', 'stack-label-rule');
      rule.setAttribute('width', '2');
      rule.setAttribute('height', '14');
      g.append(rule);

      const indexText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      indexText.setAttribute('class', 'stack-label-index');
      indexText.textContent = idx;
      g.append(indexText);

      const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      nameText.setAttribute('class', 'stack-label-name');
      nameText.textContent = name;
      g.append(nameText);

      labelRail.append(g);
      return { g, leader, bg, rule, indexText, nameText };
    });
    return railNodes;
  }

  function syncLabelRail(scene, next, t, small) {
    if (!labelRail) return;
    const nodes = ensureRail();
    const dbox = diagram.getBoundingClientRect();
    labelRail.setAttribute('viewBox', `0 0 ${Math.max(1, dbox.width)} ${Math.max(1, dbox.height)}`);
    const show = isAssembled(scene) || (scene >= 1 && scene <= 8) || isAssembled(next);
    labelRail.style.opacity = show ? '1' : '0';

    const activeIndex = scene === 0 ? -1 : scene >= 8 ? 7 : scene - 1;
    const overview = scene === 0 || scene >= 9;

    // Spread all eight rail labels evenly so type never collides
    const stackBandTop = dbox.height * (small ? 0.4 : 0.46);
    const stackBandBot = dbox.height * (small ? 0.86 : 0.9);
    const labelSpan = stackBandBot - stackBandTop;

    nodes.forEach((node, i) => {
      const poseA = slabPose(scene, i, small);
      const poseB = slabPose(next, i, small);
      const pose = {
        y: mix(poseA.y, poseB.y, t),
        opacity: mix(poseA.opacity, poseB.opacity, t)
      };
      let y;
      if (isAssembled(scene) || isAssembled(next)) {
        y = stackBandTop + (labelSpan * i) / 7;
      } else {
        y = dbox.height / 2 + pose.y;
      }
      const labelX = small ? 6 : Math.max(6, dbox.width * 0.01);
      const textX = labelX + 14;

      node.indexText.setAttribute('x', textX);
      node.indexText.setAttribute('y', y - 4);
      node.nameText.setAttribute('x', textX);
      node.nameText.setAttribute('y', y + 12);
      node.rule.setAttribute('x', labelX);
      node.rule.setAttribute('y', y - 6);
      const bgW = small ? 108 : 152;
      node.bg.setAttribute('x', textX - 4);
      node.bg.setAttribute('y', y - 16);
      node.bg.setAttribute('width', bgW);
      node.bg.setAttribute('height', 32);

      const leaderEnd = small ? dbox.width * 0.14 : dbox.width * 0.18;
      node.leader.setAttribute('x1', textX + bgW - 6);
      node.leader.setAttribute('y1', y);
      node.leader.setAttribute('x2', leaderEnd);
      node.leader.setAttribute('y2', dbox.height / 2 + pose.y);

      const isActive = activeIndex === i;
      node.g.classList.toggle('is-active', isActive);

      if (!isAssembled(scene) && scene >= 1 && scene <= 8) {
        node.g.style.opacity = isActive ? '1' : '0';
      } else if (overview) {
        node.g.style.opacity = i <= 7 && pose.opacity > 0.15 ? '0.35' : '0';
      } else {
        node.g.style.opacity = isActive ? '1' : '0.35';
      }
    });
  }

  function ensureBus() {
    if (!systemLinks || busNodes) return busNodes;
    systemLinks.innerHTML = '';
    const NS = 'http://www.w3.org/2000/svg';
    const bus = document.createElementNS(NS, 'path');
    bus.setAttribute('class', 'bus-line');
    systemLinks.append(bus);
    const drops = COLS.map(() => {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('class', 'bus-drop');
      systemLinks.append(p);
      return p;
    });
    const risers = COLS.map(() => {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('class', 'bus-riser');
      systemLinks.append(p);
      return p;
    });
    busNodes = { bus, drops, risers };
    return busNodes;
  }

  function connectSystem(scene, alphaA, alphaB) {
    if (!systemLinks) return;
    const nodes = ensureBus();
    const show = (scene === 0 || scene >= 8) && (alphaA > 0.15 || alphaB > 0.15);
    const strength = scene === 0 || scene >= 9 ? 1 : scene === 8 ? 0.7 : 0.4;
    systemLinks.style.opacity = show ? String(strength * Math.max(alphaA, alphaB, 0.35)) : '0';
    systemLinks.classList.toggle('is-active', scene >= 8 || scene === 0);
    if (!show) return;

    const dbox = diagram.getBoundingClientRect();
    systemLinks.setAttribute('viewBox', `0 0 ${Math.max(1, dbox.width)} ${Math.max(1, dbox.height)}`);

    // Prefer the visible bank that owns the shared coordinate frame
    const img = alphaA > 0.15 ? tileImgA : tileImgB;
    if (!img) return;

    const busPts = COLS.map((nx) => pointOnImg(img, nx, BUS_Y));
    if (busPts.some((p) => !p)) return;

    const y = busPts[0].y;
    nodes.bus.setAttribute(
      'd',
      `M${busPts[0].x.toFixed(1)} ${y.toFixed(1)}H${busPts[busPts.length - 1].x.toFixed(1)}`
    );

    COLS.forEach((nx, i) => {
      const busPt = busPts[i];
      const topPt = pointOnImg(img, nx, ROW_A + 0.16);
      const botPt = alphaB > 0.15 ? pointOnImg(tileImgB || img, nx, ROW_B - 0.02) : null;
      if (!busPt || !nodes.drops[i]) return;
      // Drop from upper row down to bus; from bus down to lower row when visible
      if (alphaA > 0.15 && topPt) {
        nodes.drops[i].setAttribute(
          'd',
          `M${topPt.x.toFixed(1)} ${topPt.y.toFixed(1)}V${busPt.y.toFixed(1)}`
        );
      }
      if (botPt && nodes.risers[i]) {
        nodes.risers[i].setAttribute(
          'd',
          `M${busPt.x.toFixed(1)} ${busPt.y.toFixed(1)}V${botPt.y.toFixed(1)}`
        );
      } else if (nodes.risers[i]) {
        const below = busPt.y + (mobile.matches ? 16 : 24);
        nodes.risers[i].setAttribute(
          'd',
          `M${busPt.x.toFixed(1)} ${busPt.y.toFixed(1)}V${below.toFixed(1)}`
        );
      }
    });
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

    const assembledNow = isAssembled(scene) || (isAssembled(next) && t > 0.5);
    page.classList.toggle('is-assembled', assembledNow);
    page.classList.toggle('system-pulse', assembledNow && scene === 0 && !reduced.matches);

    slabs.forEach((el, i) => {
      const a = slabPose(scene, i, small);
      const b = slabPose(next, i, small);
      el.style.setProperty('--y', mix(a.y, b.y, t) + 'px');
      el.style.setProperty('--scale', mix(a.scale, b.scale, t));
      el.style.setProperty('--alpha', mix(a.opacity, b.opacity, t));
      el.style.zIndex = String(i + 1);
      const focus =
        scene === 0 || scene >= 8
          ? i >= 6
          : i === scene - 1;
      el.classList.toggle('is-focus', focus);
      el.setAttribute('aria-hidden', mix(a.opacity, b.opacity, t) < 0.05 ? 'true' : 'false');
    });

    let alphaA = 0;
    let alphaB = 0;
    if (tileA) {
      const a = tilePose(scene, 'a', small);
      const b = tilePose(next, 'a', small);
      alphaA = mix(a.opacity, b.opacity, t);
      // Staggered wave: delay 8b relative to blend on scene 9→10
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

    const linkScene = scene === next ? scene : t > 0.5 ? next : scene;
    connectSystem(linkScene, alphaA, alphaB);
    syncLabelRail(scene, next, t, small);

    if (scene !== last) {
      last = scene;
      if (scene === 0) {
        captionNumber.textContent = '01 — 08B';
        captionAside.textContent = 'SCROLL TO DECONSTRUCT';
        viewMode.textContent = 'ASSEMBLED';
      } else if (scene === 8) {
        captionNumber.textContent = 'LAYER 08 / 08';
        captionAside.textContent = 'ACTION';
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

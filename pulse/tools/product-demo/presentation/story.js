(() => {
  'use strict';
  const chapters = [...document.querySelectorAll('.chapter')];
  const slabs = [...document.querySelectorAll('.layer:not(.tile-layer)')];
  const tileA = document.querySelector('.tile-layer[data-layer="8a"]');
  const tileB = document.querySelector('.tile-layer[data-layer="8b"]');
  const tileImgA = tileA?.querySelector('img');
  const tileImgB = tileB?.querySelector('img');
  const tileLinks = document.querySelector('#tile-links');
  const links = [...document.querySelectorAll('.layer-nav a')];
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
  // Normalized tile centers in each 1600×700 asset (x/1600, y/700)
  const NORM = {
    opportunityRadar: [985 / 1600, 242 / 700],
    marketGlobe: [225 / 1600, 120 / 700],
    researchInsights: [985 / 1600, 120 / 700],
    clientIntelligence: [605 / 1600, 325 / 700]
  };
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
      return { y: (base - index * gap) * fit, scale: (small ? 0.6 : 0.74) * fit, opacity: 1 };
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
    const baseY = bank === 'a' ? (small ? -18 : -40) : (small ? -48 : -95);
    const scale = (small ? 0.68 : 0.82) * fit;
    if (!visible) return { y: baseY + (small ? 24 : 36), scale, opacity: 0 };
    return { y: baseY * fit, scale, opacity: 1 };
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

  function connectTiles(scene, alphaA, alphaB) {
    if (!tileLinks) return;
    const show = (scene === 0 || scene >= 10) && alphaA > 0.15 && alphaB > 0.15;
    tileLinks.innerHTML = '';
    tileLinks.style.opacity = show ? String(Math.min(alphaA, alphaB)) : '0';
    if (!show) return;
    const a = pointOnImg(tileImgA, ...NORM.opportunityRadar);
    const b = pointOnImg(tileImgB, ...NORM.marketGlobe);
    const c = pointOnImg(tileImgB, ...NORM.researchInsights);
    const d = pointOnImg(tileImgA, ...NORM.clientIntelligence);
    const dbox = diagram.getBoundingClientRect();
    tileLinks.setAttribute('viewBox', `0 0 ${dbox.width} ${dbox.height}`);
    tileLinks.setAttribute('width', String(dbox.width));
    tileLinks.setAttribute('height', String(dbox.height));
    const pairs = [[a, b], [c, d]];
    pairs.forEach(([p, q]) => {
      if (!p || !q) return;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', p.x);
      line.setAttribute('y1', p.y);
      line.setAttribute('x2', q.x);
      line.setAttribute('y2', q.y);
      line.setAttribute('class', 'tile-cross-link');
      tileLinks.append(line);
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

    connectTiles(scene === next ? scene : (t > 0.5 ? next : scene), alphaA, alphaB);

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

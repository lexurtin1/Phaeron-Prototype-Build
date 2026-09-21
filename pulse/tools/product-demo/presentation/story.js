(() => {
  'use strict';
  const chapters = [...document.querySelectorAll('.chapter')];
  const slabs = [...document.querySelectorAll('.layer:not(.tile-layer)')];
  const tileA = document.querySelector('.tile-layer[data-layer="8a"]');
  const tileB = document.querySelector('.tile-layer[data-layer="8b"]');
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
  const systemLinks = document.querySelector('#tile-links');
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

  let hubShown = null;
  const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
  const smooth = (v) => v * v * (3 - 2 * v);
  const mix = (a, b, t) => a + (b - a) * t;
  let anchors = [], frame = 0, last = -1, fit = 1;

  if (systemLinks) {
    systemLinks.innerHTML = '';
    systemLinks.style.opacity = '0';
  }

  function measure() {
    anchors = chapters.map((el) => window.scrollY + el.getBoundingClientRect().top);
    const h = diagram.getBoundingClientRect().height || window.innerHeight * 0.64;
    fit = Math.min(1, h / (mobile.matches ? 300 : 560));
  }

  function slabPose(scene, index, small) {
    const assembled = scene === 0 || scene >= 8;
    if (assembled) {
      const gap = small ? 14 : 28;
      const base = small ? 48 : 100;
      // Drop the stack further under the raised 8a/8b banks
      const tileLift = scene === 0 || scene >= 9 ? (small ? 88 : 150) : 0;
      const opacity = index >= 6 ? 1 : clamp(0.32 + index * 0.08, 0.32, 0.72);
      return {
        y: (base - index * gap + tileLift) * fit,
        scale: (small ? 0.68 : 0.84) * fit,
        opacity
      };
    }
    const selected = scene - 1;
    if (index === selected) return { y: 0, scale: (small ? 0.98 : 1.08) * fit, opacity: 1 };
    const direction = index < selected ? 1 : -1;
    return { y: direction * (small ? 190 : 430) * fit, scale: (small ? 0.58 : 0.66) * fit, opacity: 0 };
  }

  function tilePose(scene, bank, small) {
    const showA = scene === 0 || scene >= 9;
    const showB = scene === 0 || scene >= 10;
    const visible = bank === 'a' ? showA : showB;
    // Raise overlay so banks clear Layer 08
    const baseY = bank === 'b' ? (small ? -32 : -44) : small ? -28 : -36;
    const scale = small ? 0.95 : 1;
    if (!visible) return { y: baseY + 16, scale, opacity: 0 };
    return { y: baseY, scale, opacity: 1 };
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

    if (tileA) {
      const a = tilePose(scene, 'a', small);
      const b = tilePose(next, 'a', small);
      const alphaA = mix(a.opacity, b.opacity, t);
      tileA.style.setProperty('--y', mix(a.y, b.y, t) + 'px');
      tileA.style.setProperty('--scale', mix(a.scale, b.scale, t));
      tileA.style.setProperty('--alpha', alphaA);
      tileA.style.zIndex = '20';
      tileA.setAttribute('aria-hidden', alphaA < 0.05 ? 'true' : 'false');
    }
    if (tileB) {
      const a = tilePose(scene, 'b', small);
      const b = tilePose(next, 'b', small);
      const alphaB = mix(a.opacity, b.opacity, t);
      tileB.style.setProperty('--y', mix(a.y, b.y, t) + 'px');
      tileB.style.setProperty('--scale', mix(a.scale, b.scale, t));
      tileB.style.setProperty('--alpha', alphaB);
      tileB.style.zIndex = '21';
      tileB.setAttribute('aria-hidden', alphaB < 0.05 ? 'true' : 'false');
    }

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

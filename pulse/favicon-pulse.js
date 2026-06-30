/**
 * Calastone Pulse — Animated Favicon
 * ECG heartbeat waveform in Calastone teal-to-green, driven by anime.js.
 * Self-contained: loads anime.js from CDN if not already present.
 */
(function () {
  'use strict';

  const SIZE = 64;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');

  // Upsert favicon <link> in <head>
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.type = 'image/png';

  // ECG control points [x, y] in 64×64 canvas space.
  // Baseline y=36; R-peak y=8; S-dip y=48; 6px side padding.
  const pts = [
    [ 6, 36],   // flat in
    [13, 36],
    [17, 31],   // P wave peak
    [21, 36],
    [24, 39],   // Q dip
    [29,  8],   // R peak (QRS)
    [35, 48],   // S dip
    [40, 36],   // return to baseline
    [45, 29],   // T wave peak
    [51, 36],
    [58, 36],   // flat out
  ];

  // Cumulative arc-lengths
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i-1][0];
    const dy = pts[i][1] - pts[i-1][1];
    cum.push(cum[i-1] + Math.sqrt(dx*dx + dy*dy));
  }
  const L = cum[cum.length - 1];

  // Interpolate (x, y) at arc-length d (wraps)
  function ptAt(d) {
    const nd = ((d % L) + L) % L;
    for (let i = 1; i < pts.length; i++) {
      if (cum[i] >= nd) {
        const s = cum[i] - cum[i-1];
        const t = s > 0 ? (nd - cum[i-1]) / s : 0;
        return [
          pts[i-1][0] + t * (pts[i][0] - pts[i-1][0]),
          pts[i-1][1] + t * (pts[i][1] - pts[i-1][1]),
        ];
      }
    }
    return [...pts[pts.length - 1]];
  }

  // Pre-baked Path2D for the dim static ECG underlay
  const ecgPath = new Path2D();
  ecgPath.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ecgPath.lineTo(pts[i][0], pts[i][1]);

  const TRAIL = L * 0.33;  // visible trail length
  const FPS   = 24;
  const TICK  = 1000 / FPS;

  // Anime.js drives this — phase advances from 0 → L each beat
  const state = { phase: 0 };

  function scheduleBeat() {
    state.phase = 0;
    // Keyframe timeline:
    //   flat + P  → slow  (38% of time, 26% of path)
    //   QRS       → fast  (14% of time, 36% of path)
    //   T wave    → medium(15% of time, 17% of path)
    //   trailing  → slow  (33% of time, 21% of path)
    anime({
      targets: state,
      phase: [
        { value: L * 0.26, duration: 420, easing: 'easeInOutSine'  },
        { value: L * 0.62, duration: 150, easing: 'easeInOutQuart' },
        { value: L * 0.79, duration: 170, easing: 'easeOutSine'    },
        { value: L,        duration: 360, easing: 'easeInOutSine'  },
      ],
      complete: () => setTimeout(scheduleBeat, 380), // ~380 ms diastole pause
    });
  }

  let lastTick = 0;

  function draw(ts) {
    requestAnimationFrame(draw);
    if (ts - lastTick < TICK) return;
    lastTick = ts;

    const phase = state.phase;

    ctx.clearRect(0, 0, SIZE, SIZE);

    // ── Background circle ─────────────────────────────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.arc(SIZE/2, SIZE/2, SIZE/2, 0, Math.PI * 2);
    ctx.fillStyle = '#0d1418';
    ctx.fill();
    ctx.clip(); // constrain everything to the circle

    // ── Dim static underlay ───────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(45,154,142,0.16)';
    ctx.lineWidth   = 1.5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.stroke(ecgPath);

    // ── Animated bright trail (50 micro-segments, teal→green, fade-in) ───
    for (let i = 1; i <= 50; i++) {
      const ta = (i-1) / 50;
      const tb =  i    / 50;
      const [ax, ay] = ptAt(phase - TRAIL + ta * TRAIL);
      const [bx, by] = ptAt(phase - TRAIL + tb * TRAIL);

      // Linear interpolate teal(45,154,142) → green(53,181,126)
      const r = Math.round(45  + 8   * tb);
      const g = Math.round(154 + 27  * tb);
      const b = Math.round(142 - 16  * tb);

      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.strokeStyle = `rgba(${r},${g},${b},${tb * 0.95})`;
      ctx.lineWidth   = 2;
      ctx.lineCap     = 'round';
      ctx.stroke();
    }

    // ── Leading glow ──────────────────────────────────────────────────────
    const [lx, ly] = ptAt(phase);

    const glow = ctx.createRadialGradient(lx, ly, 0, lx, ly, 7);
    glow.addColorStop(0, 'rgba(15,184,156,0.80)');
    glow.addColorStop(1, 'rgba(15,184,156,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lx, ly, 7, 0, Math.PI * 2);
    ctx.fill();

    // White tip dot
    ctx.fillStyle   = '#ffffff';
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.arc(lx, ly, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    link.href = canvas.toDataURL('image/png');
  }

  // ── Bootstrap: load anime.js if needed, then start ────────────────────
  function start() {
    scheduleBeat();
    requestAnimationFrame(draw);
  }

  if (typeof anime !== 'undefined') {
    start();
  } else {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/animejs@3.2.1/lib/anime.min.js';
    s.onload  = start;
    s.onerror = function () {
      // Minimal fallback: linear rAF loop
      const CYCLE = 1500;
      function tick(ts) {
        state.phase = ((ts % CYCLE) / CYCLE) * L;
        // draw will pick up state.phase on next frame
      }
      (function loop(ts) { tick(ts); requestAnimationFrame(loop); })(0);
      requestAnimationFrame(draw);
    };
    document.head.appendChild(s);
  }
})();

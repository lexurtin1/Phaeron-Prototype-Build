/**
 * Phaeron Pulse — Animated ECG favicon + optional header logo
 *
 * Design principles:
 *  • Phase is MONOTONICALLY INCREASING — never resets, so the loop is
 *    perfectly seamless with no visible jump or pause.
 *  • Gaussian speed profile: slow on flat sections, fast through the
 *    QRS spike — natural heartbeat rhythm, no on/off switching.
 *  • Each canvas renderer is fully self-contained (own time tracking).
 *  • Favicon toDataURL is throttled to ~30 fps; in-page canvas runs at
 *    full rAF speed (typically 60 fps) for maximum smoothness.
 */
(function () {
  'use strict';

  // ── Normalised ECG waypoints ──────────────────────────────────────────
  // x: 0 (left) → 1 (right)   y: 0 (top) → 1 (bottom), baseline = 0.50
  const NORM = [
    [0.00, 0.50],
    [0.09, 0.50],
    [0.14, 0.44],  // P wave
    [0.19, 0.50],
    [0.22, 0.54],  // Q dip
    [0.27, 0.08],  // R peak
    [0.34, 0.75],  // S dip
    [0.40, 0.50],
    [0.46, 0.39],  // T wave
    [0.52, 0.50],
    [1.00, 0.50],  // flat right
  ];

  // Scale normalised path into pixel coords for a given canvas size + padding
  function scalePts(W, H, px, py) {
    return NORM.map(([nx, ny]) => [
      px + nx * (W - 2 * px),
      py + ny * (H - 2 * py),
    ]);
  }

  // Build cumulative arc-length table for an array of [x,y] points
  function buildCum(pts) {
    const c = [0];
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i][0] - pts[i-1][0];
      const dy = pts[i][1] - pts[i-1][1];
      c.push(c[i-1] + Math.sqrt(dx*dx + dy*dy));
    }
    return c;
  }

  // Interpolate (x,y) at arc-length d (wraps around the path)
  function ptAt(pts, cum, L, d) {
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

  // Gaussian speed multiplier — arc-length normalised position 0→1.
  // R-peak centre lands at ~0.31 of arc; S-dip at ~0.59.
  // Peak centred at 0.44 with σ=0.22 covers the whole QRS complex.
  function speedMult(norm) {
    const bell = Math.exp(-Math.pow((norm - 0.44) / 0.22, 2));
    return 0.55 + 4.5 * bell;  // 0.55× on flats, ~5× at QRS centre
  }

  // ── Renderer factory ──────────────────────────────────────────────────
  //
  // opts: {
  //   padX, padY         — pixel padding inside canvas
  //   bg                 — fill colour for circle bg (null = transparent)
  //   ghostAlpha         — opacity of the dim full-path underlay
  //   ghostWidth         — stroke width of the underlay
  //   lineWidth          — stroke width of the animated trail
  //   lineAlpha          — max alpha of trail head (tail fades from 0)
  //   msPerLoop          — milliseconds for one full sweep at base speed
  //   onFrame(canvas)    — optional callback after each draw (e.g. favicon update)
  // }
  function makeRenderer(canvas, opts) {
    const W   = canvas.width;
    const H   = canvas.height;
    const ctx = canvas.getContext('2d');
    const pts = scalePts(W, H, opts.padX, opts.padY);
    const cum = buildCum(pts);
    const L   = cum[cum.length - 1];

    // BASE_SPEED: fraction of L covered per ms at speedMult=1
    const BASE_SPEED = L / (opts.msPerLoop || 980);
    const TRAIL      = L * 0.40;  // visible tail length (40 % of path)
    const SEG        = 60;        // micro-segment count for smooth gradient

    // Ghost (full-path underlay) baked into a Path2D
    const ghost = new Path2D();
    ghost.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ghost.lineTo(pts[i][0], pts[i][1]);

    let localPhase = 0;  // arc-length, always increasing
    let _lastTs    = null;
    let _lastFav   = 0;

    return function draw(ts) {
      // ── Advance local phase ─────────────────────────────────────────
      if (_lastTs === null) { _lastTs = ts; }
      const dt = Math.min(ts - _lastTs, 50); // cap to avoid jump on tab-wake
      _lastTs = ts;

      const norm = (localPhase % L) / L;
      localPhase += dt * BASE_SPEED * speedMult(norm);

      const pos = localPhase % L;

      // ── Draw ────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, W, H);
      ctx.save();

      if (opts.bg) {
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, Math.min(W, H) / 2, 0, Math.PI * 2);
        ctx.fillStyle = opts.bg;
        ctx.fill();
        ctx.clip();
      }

      // Dim ghost underlay — shows the full ECG shape at low opacity
      if (opts.ghostAlpha > 0) {
        ctx.strokeStyle = `rgba(45,154,142,${opts.ghostAlpha})`;
        ctx.lineWidth   = opts.ghostWidth;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
        ctx.stroke(ghost);
      }

      // Animated trail — teal(45,154,142)→green(53,181,126), fading in from tail
      for (let i = 1; i <= SEG; i++) {
        const ta = (i - 1) / SEG;
        const tb = i       / SEG;
        const d0 = pos - TRAIL + ta * TRAIL;
        const d1 = pos - TRAIL + tb * TRAIL;

        // Detect wrap crossing: skip the one segment that jumps 0→L boundary
        const nd0 = ((d0 % L) + L) % L;
        const nd1 = ((d1 % L) + L) % L;
        if (nd1 < nd0 - 1) continue;

        const [ax, ay] = ptAt(pts, cum, L, d0);
        const [bx, by] = ptAt(pts, cum, L, d1);

        const r = Math.round(45  + 8   * tb);
        const g = Math.round(154 + 27  * tb);
        const b = Math.round(142 - 16  * tb);

        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.strokeStyle = `rgba(${r},${g},${b},${ta * opts.lineAlpha})`;
        ctx.lineWidth   = opts.lineWidth;
        ctx.lineCap     = 'round';
        ctx.stroke();
      }

      ctx.restore();

      // Optional per-frame callback (used for favicon update throttle)
      if (opts.onFrame) opts.onFrame(canvas, ts, _lastFav, function (t) { _lastFav = t; });
    };
  }

  // ── Favicon ───────────────────────────────────────────────────────────
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.type = 'image/png';

  const favCanvas = document.createElement('canvas');
  favCanvas.width = favCanvas.height = 64;

  const drawFav = makeRenderer(favCanvas, {
    padX:       5,
    padY:       5,
    bg:         '#ffffff',
    ghostAlpha: 0.18,
    ghostWidth: 1.5,
    lineWidth:  3,
    lineAlpha:  0.97,
    msPerLoop:  2200,
    onFrame: function (c, ts, lastFav, setLastFav) {
      if (ts - lastFav < 33) return; // ~30 fps for toDataURL
      setLastFav(ts);
      link.href = c.toDataURL('image/png');
    },
  });

  // ── Header ECG (#ph-ecg) ─────────────────────────────────────────────
  const hdrCanvas = document.getElementById('ph-ecg');
  let drawHdr = null;
  if (hdrCanvas) {
    drawHdr = makeRenderer(hdrCanvas, {
      padX:       2,
      padY:       2,
      bg:         null,
      ghostAlpha: 0.12,
      ghostWidth: 1,
      lineWidth:  1.8,
      lineAlpha:  0.95,
      msPerLoop:  2200,
    });
  }

  // ── Main rAF loop ─────────────────────────────────────────────────────
  function loop(ts) {
    requestAnimationFrame(loop);
    drawFav(ts);
    if (drawHdr) drawHdr(ts);
  }

  requestAnimationFrame(loop);
})();

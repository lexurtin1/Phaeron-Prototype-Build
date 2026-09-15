/**
 * hand-controls.js — MediaPipe hand gesture navigation for Phaeron Globe
 *
 * Loaded as <script type="module"> — falls back gracefully if camera is denied.
 * Mouse/touch controls remain active at all times.
 *
 * Gestures (all non-destructive — mouse still works in parallel):
 *   🤏 Pinch (single hand) + drag  → rotate globe
 *   🤌 Pinch (two hands) spread    → zoom out / zoom in
 *   ✋ Open palm + lateral swipe   → spin globe
 *   ✊ Closed fist (hold 0.5 s)    → pause hand input
 *   ✋ Any open gesture             → resume from pause
 */

/* ── Configuration ──────────────────────────────────────────────────────── */
const CFG = {
  // MediaPipe CDN — pin to a specific version for stability
  cdn:   'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14',
  model: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',

  // Gesture thresholds (normalized image coordinates, 0–1)
  pinchThresh:    0.065,  // thumb-tip ↔ index-tip distance
  fistThresh:     0.130,  // fingertip-to-palm distance (all fingers)

  // Swipe: velocity (norm-units / second) over `swipeFrames` frames
  swipeVelThresh: 0.50,
  swipeFrames:    8,

  // Smoothing & debounce
  emaAlpha:       0.30,   // exponential moving average for position (0=frozen,1=raw)
  gestureStable:  5,      // frames of agreement before committing a gesture change

  // Dwell-click: hold pinch still to select the country at screen centre
  dwellMs:        900,    // ms of stillness required
  dwellMovThresh: 0.045,  // norm-units of drift that resets the timer

  // Globe sensitivity
  dragSens:       200,    // degrees per norm-unit (scales with altitude)
  zoomSens:       5.5,    // altitude delta per norm-unit distance change

  // Limits
  minAlt:         0.50,
  maxAlt:         6.00,
  fistPauseMs:    500,    // fist hold duration before pausing
  numHands:       2,
};

/* ── Module state ────────────────────────────────────────────────────────── */
let landmarker   = null;
let videoEl      = null;
let stream       = null;
let rafId        = null;
let lastTime     = -1;

// Gesture tracking
let pinchPos     = null;  // smoothed {x,y} of pinch midpoint
let pinchOn      = false;
let twoHandDist  = null;  // previous two-hand wrist distance
let gestBuf      = [];    // rolling buffer for gesture stability
let swipeHist    = [];    // [{x,t}] for velocity computation
let fistStart    = null;  // timestamp when fist gesture began
let paused       = false; // fist-pause active
let dwellStart   = null;  // timestamp when pinch became still
let dwellBasePos = null;  // position at dwell start

/* ── Math helpers ────────────────────────────────────────────────────────── */
const dist2D = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function ema(prev, next, a = CFG.emaAlpha) {
  return prev
    ? { x: prev.x + a * (next.x - prev.x), y: prev.y + a * (next.y - prev.y) }
    : { ...next };
}

/* ── Gesture classifier ──────────────────────────────────────────────────── */
// MediaPipe landmark indices:
//   0=wrist  4=thumb-tip  8=index-tip  12=mid-tip  16=ring-tip  20=pinky-tip
//   5=idx-MCP  9=mid-MCP  13=ring-MCP  17=pinky-MCP
function classify(lm) {
  // Pinch: thumb tip and index tip close together
  if (dist2D(lm[4], lm[8]) < CFG.pinchThresh) return 'pinch';

  // Detect upright vs. inverted hand (y increases downward in image coords)
  const upright = lm[0].y > lm[9].y; // wrist lower than middle-MCP

  const extendedCount = [
    [lm[8],  lm[5]],
    [lm[12], lm[9]],
    [lm[16], lm[13]],
    [lm[20], lm[17]],
  ].filter(([tip, mcp]) => (upright ? tip.y < mcp.y : tip.y > mcp.y)).length;

  // Open palm: 3+ fingers extended
  if (extendedCount >= 3) return 'palm';

  // Fist: all fingertips close to palm centre (mid-MCP)
  const pc = lm[9];
  if ([lm[8], lm[12], lm[16], lm[20]].every(t => dist2D(t, pc) < CFG.fistThresh))
    return 'fist';

  return 'neutral';
}

// Majority vote over rolling buffer for jitter-free transitions
function stableGesture(g) {
  gestBuf.push(g);
  if (gestBuf.length > CFG.gestureStable * 2) gestBuf.shift();
  const cnt = {};
  gestBuf.forEach(x => (cnt[x] = (cnt[x] || 0) + 1));
  return Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'none';
}

/* ── Globe actions ───────────────────────────────────────────────────────── */
// Always guard — globe might not be ready in edge cases
const getGlobe = () => window.globe;
const getCtrl  = () => window.ctrl;

function rotate(dx, dy) {
  const gl = getGlobe(); if (!gl) return;
  const pov = gl.pointOfView();
  const s = pov.altitude / 2.5; // sensitivity scales with zoom level
  const lng = ((pov.lng + dx * CFG.dragSens * s) + 540) % 360 - 180;
  const lat = Math.max(-85, Math.min(85, pov.lat + dy * CFG.dragSens * s));
  gl.pointOfView({ lat, lng, altitude: pov.altitude }, 0);
}

function applyZoom(delta) {
  const gl = getGlobe(); if (!gl) return;
  const pov = gl.pointOfView();
  const alt = Math.max(CFG.minAlt, Math.min(CFG.maxAlt, pov.altitude - delta * CFG.zoomSens));
  gl.pointOfView({ lat: pov.lat, lng: pov.lng, altitude: alt }, 0);
}

let swipeCooldownUntil = 0;

function triggerSwipe(dir) {
  if (performance.now() < swipeCooldownUntil) return;
  swipeCooldownUntil = performance.now() + 1800; // 1.8 s cooldown

  const ctrl = getCtrl(); if (!ctrl) return;
  const speed = dir === 'right' ? -3.0 : 3.0;
  ctrl.autoRotate = true;
  ctrl.autoRotateSpeed = speed;
  // Decay back to gentle spin after 1.4 s
  setTimeout(() => { if (getCtrl()) getCtrl().autoRotateSpeed = 0.32; }, 1400);

  setStatus(dir === 'right' ? 'Spin right ▶' : '◀ Spin left', '🌀');
}

function triggerDwellClick() {
  const canvas = document.querySelector('#globeViz canvas');
  if (!canvas) return;
  // Click at the screen centre — user should have navigated the target there first
  const cx = window.innerWidth  / 2;
  const cy = window.innerHeight / 2;
  ['mousedown', 'mouseup', 'click'].forEach(type => {
    canvas.dispatchEvent(new MouseEvent(type, {
      bubbles: true, cancelable: true,
      clientX: cx, clientY: cy,
      view: window,
    }));
  });
  // Reset so the user must re-pinch to trigger again
  dwellStart = null; dwellBasePos = null; pinchOn = false; pinchPos = null;
  setStatus('✓ Selected!', '📍');
  setTimeout(() => setStatus('Ready', '👋'), 1500);
}

/* ── Frame processor ─────────────────────────────────────────────────────── */
function processFrame(results) {
  const hands = results.landmarks ?? [];

  if (!hands.length) {
    resetTracking();
    setStatus('Show a hand…', '👁');
    return;
  }

  const h1  = hands[0];
  const g1  = stableGesture(classify(h1));

  // ── Fist: pause all globe interaction ──────────────────────────────────
  if (g1 === 'fist') {
    if (!fistStart) fistStart = performance.now();
    if (!paused && performance.now() - fistStart >= CFG.fistPauseMs) {
      paused = true;
      const ctrl = getCtrl();
      if (ctrl) ctrl.autoRotate = false;
      setStatus('Paused — open hand to resume', '✊');
    }
    pinchOn = false; pinchPos = null;
    return;
  }

  // Any non-fist gesture resumes from pause
  fistStart = null;
  if (paused) {
    paused = false;
    setStatus('Ready', '✋');
  }

  // ── Two-hand pinch zoom ────────────────────────────────────────────────
  if (hands.length >= 2) {
    const g2 = classify(hands[1]);
    if (g1 === 'pinch' || g2 === 'pinch') {
      // Measure wrist-to-wrist distance as the spread proxy
      const d = dist2D(
        { x: h1[0].x,       y: h1[0].y },
        { x: hands[1][0].x, y: hands[1][0].y }
      );
      if (twoHandDist !== null) {
        const delta = d - twoHandDist;
        if (Math.abs(delta) > 0.004) applyZoom(delta);
      }
      twoHandDist = d;
      pinchOn = false; pinchPos = null; swipeHist = [];
      setStatus('Zoom', '🔍');
      return;
    }
  }
  twoHandDist = null;

  // ── Single-hand pinch drag → rotate ───────────────────────────────────────
  if (g1 === 'pinch') {
    const raw    = { x: (h1[4].x + h1[8].x) / 2, y: (h1[4].y + h1[8].y) / 2 };
    const smooth = ema(pinchPos, raw);
    if (pinchOn && pinchPos) {
      const dx = smooth.x - pinchPos.x;
      const dy = smooth.y - pinchPos.y;
      if (Math.abs(dx) > 0.0008 || Math.abs(dy) > 0.0008) rotate(dx, dy);
    }
    pinchPos  = smooth;
    pinchOn   = true;
    swipeHist = [];
    dwellStart = null; dwellBasePos = null;
    setStatus('Rotate 🌍', '🤏');
    return;
  }
  pinchOn = false;

  // ── Open palm held flat → dwell-click ─────────────────────────────────────
  if (g1 === 'palm') {
    const palmPos = { x: h1[0].x, y: h1[0].y };
    const now     = performance.now();

    if (!dwellBasePos || dist2D(palmPos, dwellBasePos) > CFG.dwellMovThresh) {
      dwellBasePos = { ...palmPos };
      dwellStart   = now;
    }

    const elapsed = now - dwellStart;
    if (elapsed >= CFG.dwellMs) {
      triggerDwellClick();
      return;
    } else if (elapsed > 250) {
      const filled = Math.round((elapsed / CFG.dwellMs) * 5);
      setStatus('Hold to select ' + '▮'.repeat(filled) + '▯'.repeat(5 - filled), '📍');
    } else {
      setStatus('Hold palm flat to select', '✋');
    }
    swipeHist = [];
    return;
  }

  dwellStart = null; dwellBasePos = null;
  swipeHist  = [];
  setStatus('Ready', '👋');
}

function resetTracking() {
  gestBuf      = [];
  swipeHist    = [];
  pinchPos     = null;
  pinchOn      = false;
  twoHandDist  = null;
  fistStart    = null;
  dwellStart   = null;
  dwellBasePos = null;
}

/* ── Canvas overlay (landmark skeleton) ─────────────────────────────────── */
const BONE_PAIRS = [
  [0,1],[1,2],[2,3],[3,4],      // thumb
  [0,5],[5,6],[6,7],[7,8],      // index
  [0,9],[9,10],[10,11],[11,12], // middle
  [0,13],[13,14],[14,15],[15,16],// ring
  [0,17],[17,18],[18,19],[19,20],// pinky
  [5,9],[9,13],[13,17],[0,17],  // palm
];

function drawSkeleton(results) {
  const canvas = document.getElementById('hcCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const { width: W, height: H } = canvas;

  (results.landmarks ?? []).forEach(hand => {
    ctx.strokeStyle = 'rgba(0,229,194,0.72)';
    ctx.lineWidth   = 1.5;
    BONE_PAIRS.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(hand[a].x * W, hand[a].y * H);
      ctx.lineTo(hand[b].x * W, hand[b].y * H);
      ctx.stroke();
    });
    // Highlight fingertips
    [4, 8, 12, 16, 20].forEach(i => {
      ctx.beginPath();
      ctx.arc(hand[i].x * W, hand[i].y * H, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#00e5c2';
      ctx.fill();
    });
    // Highlight pinch pair
    ctx.beginPath();
    ctx.arc(hand[4].x * W, hand[4].y * H, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = dist2D(hand[4], hand[8]) < CFG.pinchThresh ? '#ffdd55' : '#00e5c2';
    ctx.fill();
  });
}

/* ── Gesture hover panel ─────────────────────────────────────────────────── */
let _gestPanel      = null;
let _lastHoverMs    = 0;
const HOVER_INTERVAL = 450;   // ms between center checks
const HOVER_MAX_ALT  = 1.5;   // only show when zoomed in below this altitude

function _getOrCreatePanel() {
  if (_gestPanel) return _gestPanel;
  _gestPanel = document.createElement('div');
  _gestPanel.id = 'gestureHoverPanel';
  _gestPanel.style.cssText = [
    'position:fixed','bottom:80px','left:50%','transform:translateX(-50%)',
    'background:rgba(255,255,255,0.95)','border:1px solid rgba(226,232,238,0.85)',
    'border-radius:14px','padding:14px 20px','min-width:200px','max-width:300px',
    'box-shadow:0 8px 32px -10px rgba(15,34,48,0.28)',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
    'backdrop-filter:blur(14px)','-webkit-backdrop-filter:blur(14px)',
    'opacity:0','pointer-events:none','transition:opacity .22s ease',
    'z-index:55','text-align:center',
  ].join(';');
  document.body.appendChild(_gestPanel);
  return _gestPanel;
}
function _showGestPanel(html) { const p = _getOrCreatePanel(); p.innerHTML = html; p.style.opacity = '1'; }
function _hideGestPanel()     { if (_gestPanel) _gestPanel.style.opacity = '0'; }

// Ray-cast point-in-polygon — GeoJSON rings are [[lng, lat], ...]
function _ptInRing(lat, lng, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}
function _featureAt(lat, lng) {
  const features = window.CALASTONE_GEO?.features;
  if (!features) return null;
  for (const f of features) {
    const g = f.geometry; if (!g) continue;
    const polys = g.type === 'Polygon'      ? [g.coordinates]  :
                  g.type === 'MultiPolygon' ? g.coordinates : [];
    for (const poly of polys)
      if (_ptInRing(lat, lng, poly[0])) return f;
  }
  return null;
}
function _hav(la1, lo1, la2, lo2) {
  const R = 6371, dLa = (la2-la1)*Math.PI/180, dLo = (lo2-lo1)*Math.PI/180;
  const a = Math.sin(dLa/2)**2 + Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dLo/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function updateGestureHover() {
  const now = performance.now();
  if (now - _lastHoverMs < HOVER_INTERVAL) return;
  _lastHoverMs = now;

  const gl = window.globe; if (!gl) return;
  const pov = gl.pointOfView();
  if (pov.altitude > HOVER_MAX_ALT) { _hideGestPanel(); return; }

  const { lat, lng, altitude } = pov;
  const radiusKm = altitude < 0.8 ? 250 : 600;

  // ── Office mode ───────────────────────────────────────────────────────────
  const inOfficeMode = officeLayerCalastone || officeLayerSSC;
  if (inOfficeMode) {
    const cals = officeLayerCalastone
      ? (typeof CALASTONE_OFFICES !== 'undefined' ? CALASTONE_OFFICES : []).filter(o => _hav(lat, lng, o.lat, o.lng) < radiusKm) : [];
    const sscs = officeLayerSSC
      ? (typeof SSC_OFFICES !== 'undefined' ? SSC_OFFICES : []).filter(o => _hav(lat, lng, o.lat, o.lng) < radiusKm) : [];
    if (!cals.length && !sscs.length) { _hideGestPanel(); return; }
    let h = '<div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#7b8a97;font-weight:700;margin-bottom:8px">Offices nearby</div>';
    cals.forEach(o => {
      h += `<div style="font-size:13px;font-weight:600;color:#2D9A8E;margin:3px 0">${o.city} <span style="color:#a7b3bd;font-size:11px;font-weight:400">· Phaeron</span></div>`;
    });
    sscs.forEach(o => {
      h += `<div style="font-size:13px;font-weight:600;color:#1b7fc4;margin:3px 0">${o.city} <span style="color:#a7b3bd;font-size:11px;font-weight:400">· SS&C</span></div>`;
    });
    h += '<div style="font-size:10px;color:#a7b3bd;margin-top:8px">Hold pinch to open details</div>';
    _showGestPanel(h); return;
  }

  // ── Network / Research mode ───────────────────────────────────────────────
  const f    = _featureAt(lat, lng);
  const iso3 = f?.iso_a3;
  const rec  = (iso3 && typeof COUNTRY_DATA !== 'undefined') ? COUNTRY_DATA[iso3] : null;
  const name = rec?.country || f?.properties?.name || f?.properties?.NAME;
  if (!name) { _hideGestPanel(); return; }

  let h = `<div style="font-size:15px;font-weight:700;color:#0f2230;margin-bottom:6px">${name}</div>`;

  if (currentMode === 'research') {
    if (rec) {
      const sc  = rec.opportunity_score;
      const col = sc >= 66 ? '#4a9d5b' : sc >= 40 ? '#d79a31' : '#cf5a4e';
      h += `<div style="font-size:12px;color:#516170;margin:2px 0">Opportunity <b style="color:${col}">${sc}</b></div>`;
      h += `<div style="font-size:12px;color:#516170;margin:2px 0">Hub: <b style="color:#22323d">${rec.central_hub_status}</b></div>`;
      h += `<div style="font-size:12px;color:#516170;margin:2px 0">Tier: <b style="color:#22323d">${rec.priority_tier}</b></div>`;
    } else {
      h += '<div style="font-size:11px;color:#a7b3bd">No research profile yet</div>';
    }
  } else {
    // Network mode — look up order volume by iso2
    const iso2 = f?.properties?.iso2;
    const node = (iso2 && typeof netNodeById !== 'undefined') ? netNodeById[iso2] : null;
    if (node && node.total) {
      h += `<div style="font-size:22px;font-weight:700;color:#007DB7;font-family:monospace;margin:4px 0">${node.total.toLocaleString()}</div>`;
      h += '<div style="font-size:11px;color:#7b8a97">orders placed + received</div>';
    } else {
      h += '<div style="font-size:11px;color:#a7b3bd">No network data</div>';
    }
  }
  h += '<div style="font-size:10px;color:#a7b3bd;margin-top:8px">Hold pinch to open details</div>';
  _showGestPanel(h);
}

/* ── Detection loop ──────────────────────────────────────────────────────── */
function startLoop() {
  if (rafId) return;
  (function tick() {
    rafId = requestAnimationFrame(tick);
    if (!videoEl || videoEl.readyState < 2 || !landmarker) return;
    const t = performance.now();
    if (t === lastTime) return;
    lastTime = t;
    try {
      const r = landmarker.detectForVideo(videoEl, t);
      processFrame(r);
      drawSkeleton(r);
    } catch (_) { /* silently ignore frame errors */ }
    updateGestureHover();
  })();
}

/* ── MediaPipe bootstrap ─────────────────────────────────────────────────── */
async function loadMediaPipe() {
  // Wait for the inline <script type="module"> bridge in index.html to expose
  // HandLandmarker and FilesetResolver on window (dispatches 'mp-ready' when done).
  if (!window._mpHandLandmarker) {
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('MediaPipe CDN timed out after 20 s')), 20000);
      window.addEventListener('mp-ready', () => { clearTimeout(t); resolve(); }, { once: true });
    });
  }

  const HandLandmarker   = window._mpHandLandmarker;
  const FilesetResolver  = window._mpFilesetResolver;

  if (!HandLandmarker || !FilesetResolver) {
    throw new Error('MediaPipe failed to load — check internet connection');
  }

  const fs = await FilesetResolver.forVisionTasks(`${CFG.cdn}/wasm`);
  landmarker = await HandLandmarker.createFromOptions(fs, {
    baseOptions: {
      modelAssetPath: CFG.model,
      delegate:       'GPU',
    },
    runningMode:                  'VIDEO',
    numHands:                     CFG.numHands,
    minHandDetectionConfidence:   0.55,
    minHandPresenceConfidence:    0.50,
    minTrackingConfidence:        0.50,
  });
}

async function startCamera() {
  stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 360, facingMode: 'user' },
    audio: false,
  });

  videoEl           = document.getElementById('hcVideo');
  videoEl.srcObject = stream;
  await new Promise(resolve => { videoEl.onloadeddata = resolve; });

  if (!landmarker) await loadMediaPipe();

  // Stop globe auto-spin so hand gestures have full control
  if (window.ctrl) window.ctrl.autoRotate = false;

  setStatus('Ready — show a hand', '✋');
  startLoop();
}

function shutdown() {
  if (rafId)  { cancelAnimationFrame(rafId); rafId = null; }
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
  landmarker = null;
  videoEl    = null;
  paused     = false;
  resetTracking();

  const panel = document.getElementById('hcPanel');
  if (panel) panel.style.display = 'none';
  _hideGestPanel();

  const btn = document.getElementById('hcToggleBtn');
  if (btn) btn.classList.remove('active');
}

/* ── UI helpers ──────────────────────────────────────────────────────────── */
function setStatus(text, icon) {
  const t = document.getElementById('hcStatusText');
  const i = document.getElementById('hcStatusIcon');
  if (t) t.textContent = text;
  if (i) i.textContent = icon ?? '👁';
}

/* ── UI construction ─────────────────────────────────────────────────────── */
function buildUI() {
  /* ---- Topbar / chrome Gestures button ---- */
  const chromeSlot = document.getElementById('pulse-chrome-gestures');
  const topbar = document.querySelector('.topbar');
  const spacer = topbar?.querySelector('.spacer');

  const btn = document.createElement('button');
  btn.id        = 'hcToggleBtn';
  btn.className = 'gm-btn';
  btn.title     = 'Hand gesture globe control (requires webcam)';
  btn.textContent = '✋ Gestures';

  if (chromeSlot) {
    chromeSlot.appendChild(btn);
  } else if (spacer) {
    topbar.insertBefore(btn, spacer);
  } else if (topbar) {
    topbar.appendChild(btn);
  }

  /* ---- Floating status panel ---- */
  const panel = document.createElement('div');
  panel.id = 'hcPanel';
  Object.assign(panel.style, {
    position:      'fixed',
    bottom:        '24px',
    left:          '24px',
    zIndex:        '300',
    display:       'none',
    flexDirection: 'column',
    gap:           '10px',
    background:    'rgba(10,24,36,0.90)',
    backdropFilter:'blur(14px)',
    WebkitBackdropFilter:'blur(14px)',
    border:        '1px solid rgba(255,255,255,0.11)',
    borderRadius:  '14px',
    padding:       '14px 16px',
    minWidth:      '192px',
    fontFamily:    'var(--sans)',
    color:         '#fff',
    fontSize:      '12px',
    boxShadow:     '0 8px 36px rgba(0,0,0,0.45)',
  });

  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between">
      <span style="font-size:10px;font-weight:700;letter-spacing:.10em;
                   color:rgba(255,255,255,.42);text-transform:uppercase">Hand Control</span>
      <div style="display:flex;gap:2px">
        <button id="hcMinBtn" title="Minimise"
          style="background:none;border:none;color:rgba(255,255,255,.45);
                 cursor:pointer;font-size:16px;line-height:1;padding:2px 6px">−</button>
        <button id="hcCloseBtn" title="Stop & close"
          style="background:none;border:none;color:rgba(255,255,255,.38);
                 cursor:pointer;font-size:15px;line-height:1;padding:2px 4px">✕</button>
      </div>
    </div>

    <div id="hcBody" style="display:flex;flex-direction:column;gap:10px">
      <div style="position:relative;line-height:0">
        <video id="hcVideo" autoplay playsinline muted
          style="width:192px;height:108px;object-fit:cover;border-radius:8px;
                 background:#000;display:block;transform:scaleX(-1)"></video>
        <canvas id="hcCanvas" width="192" height="108"
          style="position:absolute;inset:0;width:192px;height:108px;
                 transform:scaleX(-1);pointer-events:none"></canvas>
      </div>

      <div style="display:flex;align-items:center;gap:10px">
        <span id="hcStatusIcon" style="font-size:22px;flex:none">👁</span>
        <span id="hcStatusText"
          style="color:rgba(255,255,255,.78);line-height:1.35">Loading…</span>
      </div>

      <div style="font-size:10px;line-height:1.80;color:rgba(255,255,255,.36);
                  border-top:1px solid rgba(255,255,255,.08);padding-top:9px">
        🤏 Pinch + drag &nbsp;→ rotate<br>
        🤌 Two hands &emsp;&thinsp;&thinsp;→ zoom<br>
        ✋ Swipe palm &nbsp;&nbsp;→ spin<br>
        ✊ Fist (hold) &nbsp;→ pause
      </div>
    </div>`;

  document.body.appendChild(panel);

  /* ---- Wire up toggle button ---- */
  btn.addEventListener('click', async () => {
    if (!stream) {
      // First click — start camera + MediaPipe
      panel.style.display = 'flex';
      btn.classList.add('active');
      setStatus('Requesting camera…', '⏳');
      try {
        await startCamera();
      } catch (err) {
        const denied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
        setStatus(denied ? 'Camera denied — mouse still works' : `Error: ${err.message}`, '⛔');
        // Leave panel open so the user sees the error; mouse controls are unaffected
      }
    } else {
      // Subsequent clicks — toggle panel visibility
      const visible = panel.style.display !== 'none';
      panel.style.display = visible ? 'none' : 'flex';
      btn.classList.toggle('active', !visible);
    }
  });

  document.getElementById('hcCloseBtn').addEventListener('click', () => shutdown());

  let minimised = false;
  document.getElementById('hcMinBtn').addEventListener('click', () => {
    minimised = !minimised;
    document.getElementById('hcBody').style.display = minimised ? 'none' : 'flex';
    document.getElementById('hcMinBtn').textContent = minimised ? '+' : '−';
    document.getElementById('hcMinBtn').title = minimised ? 'Expand' : 'Minimise';
  });
}

/* ── Boot — wait for ModuleChrome gestures slot when present ─────────────── */
function bootHandControls() {
  const mount = () => {
    if (document.getElementById('hcToggleBtn')) return;
    buildUI();
  };

  const tryMount = (attempt = 0) => {
    const wantsChrome = document.getElementById('pulse-react-chrome')?.getAttribute('data-gestures') === 'true';
    const slot = document.getElementById('pulse-chrome-gestures');
    if (!wantsChrome || slot || attempt > 40) {
      mount();
      return;
    }
    setTimeout(() => tryMount(attempt + 1), 50);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => tryMount());
  } else {
    tryMount();
  }
}

bootHandControls();

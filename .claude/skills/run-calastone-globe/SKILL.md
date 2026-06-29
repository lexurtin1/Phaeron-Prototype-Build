---
name: run-calastone-globe
description: Run, screenshot, and interact with the Calastone Globe app — a static browser app (index.html). Use to start the app, take screenshots, verify UI changes, test globe modes, or validate hand-gesture controls.
---

# Calastone Globe — Run Skill

A fully static web app (single `index.html` + `config.js` + `hand-controls.js`).
No build step, no server required. Driven with `chromium-cli` (headless Chromium).

---

## Prerequisites

```powershell
# Chromium must be on PATH (already present in this environment)
chromium --version   # or chromium-browser, google-chrome
```

---

## Run (agent path) — chromium-cli

The app is a `file://` URL. Use `chromium-cli` in headless mode to load it,
take screenshots, and inspect DOM state.

```javascript
// INLINE DRIVER — paste into a chromium-cli session or run as a .mjs script

// Launch
await page.goto('file:///C:/Users/alexc2/OneDrive - Calastone Ltd/Desktop/calastone-network-vis/index.html');

// Wait for the globe to mount (loader fades after ~1 s)
await page.waitForSelector('#loader', { hidden: true, timeout: 8000 });

// Screenshot — network mode (default)
await page.screenshot({ path: 'screenshot-network.png', fullPage: false });

// Switch to Market Research mode
await page.click('#globeSwitchResearch');
await page.waitForTimeout(1200);  // transition
await page.screenshot({ path: 'screenshot-research.png', fullPage: false });

// Switch back
await page.click('#globeSwitchNetwork');
await page.waitForTimeout(800);
await page.screenshot({ path: 'screenshot-network-2.png', fullPage: false });

// Verify hand-control button is present
const hcBtn = await page.$('#hcToggleBtn');
console.log('Hand control button present:', !!hcBtn);
```

### Full smoke script (PowerShell + Node)

```powershell
# Run from the project root
node ".claude/skills/run-calastone-globe/smoke.mjs"
```

See [smoke.mjs](.claude/skills/run-calastone-globe/smoke.mjs) for the full script.

---

## Run (human path)

Double-click `index.html` or:

```powershell
Start-Process "c:\Users\alexc2\OneDrive - Calastone Ltd\Desktop\calastone-network-vis\index.html"
```

The globe loads in Network mode. Toggle with the **Network / Market Research**
buttons in the topbar. Click **✋ Gestures** to activate hand controls (requires
webcam + internet for MediaPipe CDN on first use).

---

## Key IDs for automation

| Element | ID |
|---|---|
| Globe canvas container | `#globeViz` |
| Loading overlay | `#loader` (removed from DOM after load) |
| Mode toggle — Network | `#globeSwitchNetwork` |
| Mode toggle — Research | `#globeSwitchResearch` |
| Hand gesture button | `#hcToggleBtn` |
| Hand control panel | `#hcPanel` |
| Hand status text | `#hcStatusText` |
| Topbar subtitle | `#topbarSub` |

---

## Config

- `config.js` — Anthropic API key for the Claude chat assistant in research mode.
  Edit this file; never commit it.
- `hand-controls.js` — MediaPipe hand tracking module. Loads MediaPipe via CDN
  on first use (~7 MB model download). Camera permission required.

---

## Gotchas

- **`file://` protocol + `type="module"`**: Chrome loads ES modules from `file://`
  without CORS issues when launched with `--allow-file-access-from-files`. Add this
  flag if the hand-controls module silently fails.
- **MediaPipe CDN**: `hand-controls.js` dynamically imports
  `@mediapipe/tasks-vision@0.10.14` from jsDelivr on first gesture button click.
  Offline environments will see "Camera error" — globe navigation still works via mouse.
- **globe.gl `pointOfView()` with 0ms animation**: Used by hand controls to rotate
  frame-by-frame. If the globe feels laggy on first gesture, it's the `ctrl.enableDamping`
  fighting the direct POV calls — the `ctrl` damping is intentionally left on so
  mouse still feels smooth.
- **Two-hand zoom threshold**: The wrist-to-wrist distance delta must exceed 0.004
  normalized units per frame to register. Hold both hands steady before spreading.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Globe canvas blank | Check browser console — likely a JS parse error in `index.html` |
| Hand control button missing | `hand-controls.js` failed to load — check `type="module"` tag at end of `<body>` |
| MediaPipe import fails | Requires internet on first use; check jsDelivr CDN reachability |
| Gestures jittery | Increase `CFG.gestureStable` (default 5) in `hand-controls.js` |
| Pinch not detected | Thumb tip and index tip must be within 0.065 normalised units — try closer together |
| Fist doesn't pause | Hold closed fist for 500 ms — short fists are ignored to avoid accidental triggers |

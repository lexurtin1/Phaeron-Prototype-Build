# Globe Visualisation — Template Guide

A complete reference for recreating this interactive 3D globe visualisation for a new company. The app is a fully static, single-HTML-file application — no build step, no backend, no framework. Everything runs in the browser.

---

## What You're Building

An interactive 3D globe with two modes:

| Mode | Purpose |
|------|---------|
| **Network** | Animated arcs showing order/transaction flows between countries |
| **Market Research** | Country polygons coloured by opportunity score, with a detail drawer and AI chat assistant |

Supporting features: hand gesture navigation, office location pins for two organisations, full-text country profiles with AI-assisted editing, backup/restore of country data.

---

## File Structure

```
your-project/
├── index.html          ← Entire application (HTML + CSS + JS + bundled globe.gl)
├── config.js           ← API key and model config (never commit this)
├── hand-controls.js    ← MediaPipe hand gesture module (copy verbatim)
├── .env                ← Documents env vars (not loaded by app, for reference only)
└── .claude/
    └── skills/
        └── run-<company>-globe/
            ├── SKILL.md
            └── smoke.mjs
```

The only files you edit for a new company are **`index.html`** and **`config.js`**. `hand-controls.js` is company-agnostic and can be copied as-is.

---

## Step-by-Step Customisation Checklist

### 1. Branding & Colour Palette

In `index.html`, find the CSS `:root` block near the top and replace the colour variables:

```css
:root {
  --blue:       #007DB7;   /* Primary brand colour — buttons, active states, links */
  --blue-d:     #005f8c;   /* Darker shade — hover states */
  --teal:       #2D9A8E;   /* Secondary accent — network arcs, hub indicators */
  --green:      #6AAD6A;   /* Positive / growth — high-opportunity countries */
  --ink-strong: #0f2230;   /* Darkest text */
  --ink:        #22323d;   /* Body text */
  --ink-1:      #516170;   /* Subtle / secondary text */
  --ink-2:      #7b8a97;   /* Disabled text */
  --ink-3:      #a7b3bd;   /* Placeholder text */
  --line:       #e2e8ee;   /* Borders */
  --bg:         #f5f8fb;   /* App background */
  --good:       #4a9d5b;   /* Score ≥ 66 */
  --mid:        #d79a31;   /* Score 40–65 */
  --bad:        #cf5a4e;   /* Score < 40 */
}
```

**What to change**: Replace `--blue`, `--blue-d`, `--teal`, and `--green` with the new company's brand colours. The ink/line/bg variables can usually stay the same.

---

### 2. Company Name & Logo in the Topbar

Search for the topbar HTML block (around line 570 of `index.html`). Replace the brand mark:

```html
<!-- Find this: -->
<span class="brand-mark">CALASTONE</span>
<span class="gradline"></span>

<!-- Replace with: -->
<span class="brand-mark">YOUR COMPANY</span>
<span class="gradline"></span>
```

The `.gradline` element is a decorative underline that uses the brand gradient (blue → teal → green). Update its CSS if the new palette has different anchor colours:

```css
.gradline {
  background: linear-gradient(90deg, var(--blue) 0%, var(--teal) 50%, var(--green) 100%);
}
```

---

### 3. Hero Stats (Network Mode)

The hero panel displays top-line KPIs in network mode. Find the `#hero` element and update the labels and values:

```html
<div id="hero">
  <div class="hero-stat">
    <span class="hero-num" id="heroOrders">0</span>
    <span class="hero-lbl">Orders routed in 2025</span>   <!-- ← change label -->
  </div>
  <div class="hero-stat">
    <span class="hero-num" id="heroCountries">0</span>
    <span class="hero-lbl">Countries</span>
  </div>
  <div class="hero-stat">
    <span class="hero-num" id="heroCorridors">0</span>
    <span class="hero-lbl">Live corridors</span>          <!-- ← change label -->
  </div>
</div>
```

The numbers (`heroOrders`, `heroCountries`, `heroCorridors`) are filled at runtime from `window.CALASTONE_FLOWS.meta`. Update the meta object in the flows data (see §6 below).

---

### 4. Office Locations

Two office arrays sit near the top of the JS section in `index.html`. Replace both entirely:

```javascript
// Primary company offices (shown as blue pins with company label)
const COMPANY_OFFICES = [
  {
    company: 'Acme Corp',
    name: 'London HQ',
    city: 'London',
    country: 'United Kingdom',
    address: '1 Example Street, London EC2Y 9AW',
    lat: 51.5190,
    lng: -0.0937
  },
  // ... more offices
];

// Partner / related company offices (shown as a second layer)
const PARTNER_OFFICES = [
  {
    company: 'Partner Co',
    name: 'New York',
    city: 'New York',
    country: 'United States',
    address: '123 Park Ave, New York NY 10017',
    lat: 40.7549,
    lng: -73.9740
  },
  // ... more offices
];
```

> In the Calastone build these are called `CALASTONE_OFFICES` and `SSC_OFFICES`. Do a global find-and-replace on those names when adapting.

Also update the office layer toggle labels in the HTML:

```html
<!-- Find the office-layer-panel and update button text -->
<button id="toggleCalastone">Calastone Offices</button>   <!-- ← company name -->
<button id="toggleSSC">SS&C Offices</button>              <!-- ← partner name -->
```

---

### 5. Country Data (`COUNTRY_DATA`)

This is the largest customisation. `COUNTRY_DATA` is a JS object keyed by ISO3 code containing one record per country. Start from the existing Calastone records and update the domain-specific fields to match the new company's context.

#### Record shape

```javascript
"GBR": {
  // ── Identity (keep accurate, these drive geography lookups)
  country:                  "United Kingdom",
  iso3:                     "GBR",
  region:                   "Europe",
  subregion:                "Northern Europe",

  // ── Market classification (customise labels to your domain)
  market_classification:    "Developed",       // Developed / Emerging / Frontier

  // ── Hub status (rename these fields to match your domain)
  central_hub_status:       "Full hub",        // Full hub / Partial hub / No hub
  hub_name:                 "Calastone Hub",
  operator:                 "Calastone",

  // ── Opportunity metrics (0–100 scale)
  opportunity_score:        92,
  automation_rate_estimate: 95,

  // ── Classification tiers (customise tier labels)
  priority_tier:            "Tier 1",          // Tier 1 / Tier 2 / Tier 3
  existing_network_presence:"Established",     // Established / Emerging / None

  // ── Narrative fields (free text, shown in drawer)
  market_aum_band:          "£2.5T+ AUM",
  mutual_fund_relevance:    "Core market. Largest fund domicile in EMEA.",
  growth_signal:            "Sustained high volumes; digitalisation mandate.",
  dominant_order_model:     "Hub-based, fully automated.",
  current_order_channels:   "Calastone hub; SWIFT connectivity.",
  manuality_snapshot:       "Estimated 95%+ automated.",
  regulatory_openness:      "High — FCA-regulated, open to infrastructure innovation.",
  risks_or_barriers:        "Market saturation; margin pressure.",

  // ── Flow diagram stages (rendered as a horizontal pipeline in the drawer)
  flow_diagram: [
    { label: "Investor",           mode: "auto" },    // auto / manual / mixed
    { label: "Platform / Adviser", mode: "auto" },
    { label: "Transfer Agent",     mode: "auto" },
    { label: "Fund Manager",       mode: "auto" }
  ],

  last_updated: "2025-06-21"
}
```

#### Adding / removing fields

The `flow_diagram` stages and narrative text fields are rendered generically — you can rename them by updating the drawer rendering function (`renderDrawer()` in the JS section). Search for the field names in the template code to find all rendering locations.

---

### 6. Network Flow Data (`CALASTONE_FLOWS`)

This object drives the animated arcs in Network mode. Replace it with your own data or generate it programmatically from a database export.

```javascript
window.CALASTONE_FLOWS = {
  meta: {
    maxArc:      45000,           // Highest single-corridor volume (used to scale arc thickness)
    maxNode:     250000,          // Highest single-country volume (used to scale node size)
    liveTotal:   "1.2bn",         // Display string shown in hero stats
    crossBorder: "320M",          // Cross-border volume display string
  },
  arcs: [
    { fromIso: "GBR", toIso: "IRL", orders: 45000, intra: false },
    { fromIso: "GBR", toIso: "GBR", orders: 180000, intra: true },
    // ...
  ],
  nodes: {
    "GBR": { total: 250000 },
    "IRL": { total: 62000 },
    // ...
  }
};
```

**Tips**:
- `intra: true` means domestic (same-country) flows — these are filtered out when "Cross-border only" is active.
- Arc colour is mapped from volume relative to `meta.maxArc` (blue = low, teal = mid, green = high).
- Country polygon intensity in network mode is mapped from `nodes[iso].total` relative to `meta.maxNode`.
- You can generate this object from a CSV/JSON export from your data warehouse and drop it into the file.

---

### 7. Country Markdown Notes (`COUNTRY_MARKDOWN`)

Each country can have a rich, formatted research note displayed in the drawer's "Notes" tab. This is a plain JS object from ISO3 → markdown string:

```javascript
const COUNTRY_MARKDOWN = {
  "GBR": `
## United Kingdom

> Core Calastone market. Fully automated order routing across 95%+ of flows.

### Market Overview
| Metric | Value |
|--------|-------|
| AUM | £2.5T+ |
| Funds | ~4,000 authorised funds |

### Key Opportunities
- Further penetration of wealth platforms
- Cross-border passporting post-Brexit settlement

### Risks
- Saturation in core transfer agency automation
  `,
  // ... more countries
};
```

These notes are rendered via `marked.js` (CDN) with a custom CSS stylesheet inside the drawer. Any standard markdown is supported: headings, tables, blockquotes, code blocks, bold/italic.

---

### 8. Globe Colours & Arc Styling

The three colour-ramp functions determine globe appearance:

```javascript
// Country polygon fill in Network mode (volume → opacity on brand colour)
function netLandColor(iso) {
  const vol = (window.CALASTONE_FLOWS.nodes[iso]?.total ?? 0);
  const t = Math.min(vol / window.CALASTONE_FLOWS.meta.maxNode, 1);
  // Returns rgba of --blue at intensity t (0.08 min, 1.0 max)
}

// Arc colour by volume (blue → teal → green ramp)
function netArcColor(orders) {
  const t = Math.min(orders / window.CALASTONE_FLOWS.meta.maxArc, 1);
  // Interpolates between #007DB7 → #2D9A8E → #6AAD6A
}

// Country polygon fill in Research mode (by opportunity score)
function researchLandColor(score) {
  if (score >= 66) return '#4a9d5b';   // green: high opportunity
  if (score >= 40) return '#d79a31';   // amber: medium
  return '#cf5a4e';                    // red: low
}
```

Update the hex values in these functions when you change the colour palette.

---

### 9. AI Chat Assistant

The chat panel calls the Claude API directly from the browser using the key in `config.js`.

**`config.js`**:
```javascript
window.CONFIG = {
  ANTHROPIC_API_KEY: "sk-ant-api03-...",   // ← replace with new project key
  CLAUDE_MODEL:      "claude-sonnet-4-6"   // ← or claude-opus-4-8 for higher quality
};
```

**System prompt** (in `index.html`, inside the `sendChat()` function):
```javascript
const systemPrompt = `You are a market research analyst for [COMPANY NAME].
You help users analyse country-level opportunity data for [YOUR DOMAIN].
...`;
```

Update the system prompt to reflect the new company's domain and data vocabulary.

> **Security**: `config.js` contains a live API key. Never commit it to a public repo. Add it to `.gitignore`. For production deployments, proxy the Claude API through a backend instead of calling it from the browser.

---

### 10. Filter Panel Labels

The left filter panel dropdowns have hard-coded option values that map to fields in `COUNTRY_DATA`. Update these to match your new field values:

```html
<!-- Market Classification filter -->
<select id="filterClass">
  <option value="">All classifications</option>
  <option value="Developed">Developed</option>
  <option value="Emerging">Emerging</option>
  <option value="Frontier">Frontier</option>
</select>

<!-- Hub Status filter -->
<select id="filterHub">
  <option value="">All hub statuses</option>
  <option value="Full hub">Full hub</option>
  <option value="Partial hub">Partial hub</option>
  <option value="No hub">No hub</option>
</select>

<!-- Priority Tier filter -->
<select id="filterTier">
  <option value="">All tiers</option>
  <option value="Tier 1">Tier 1</option>
  <option value="Tier 2">Tier 2</option>
  <option value="Tier 3">Tier 3</option>
</select>
```

If you rename these categories in `COUNTRY_DATA`, update the option values to match.

---

## Globe.gl Core Configuration

The globe is initialised with a standard configuration block. These are the key parameters to be aware of:

```javascript
const globe = Globe()
  .backgroundColor('#0b1526')           // Dark background — matches app bg
  .globeImageUrl(null)                   // No image tile — uses polygon fills
  .showAtmosphere(true)
  .atmosphereColor('#1a3a5c')            // Brand-tinted atmosphere glow
  .atmosphereAltitude(0.12)
  .polygonsData(countryFeatures)         // GeoJSON features from CALASTONE_GEO
  .polygonCapColor(d => landColor(d))    // Country fill function
  .polygonSideColor(() => 'rgba(0,0,0,0)')
  .arcsData(arcs)
  .arcColor(d => arcColor(d.orders))
  .arcStroke(d => arcStroke(d.orders))   // Thicker = more volume
  .arcAltitudeAutoScale(0.25)            // Arc height relative to chord length
  .arcDashLength(0.4)
  .arcDashGap(0.6)
  .arcDashAnimateTime(1500)              // Arc animation speed (ms per cycle)
  .pointsData(nodes)
  .pointColor(() => '#ffffff')
  .pointAltitude(0)
  .pointRadius(d => nodeRadius(d.total));
```

**Common tweaks**:
- `backgroundColor`: Match to the app's dark theme colour
- `atmosphereColor`: Set to a dark tint of the primary brand colour
- `arcDashAnimateTime`: Lower = faster flowing arcs (try 800–2000)
- `arcAltitudeAutoScale`: Controls arc height (0.1 = flat, 0.4 = dramatic)

---

## GeoJSON Data

The globe polygons come from `CALASTONE_GEO`, a world-atlas GeoJSON dataset embedded in `index.html`. This is a standard `world-atlas@1` dataset — you do not need to replace it. It maps ISO numeric codes to country polygons.

The `NAME_TO_ISO` lookup table maps country name strings (from `COUNTRY_DATA`) to ISO3 codes so the globe can match your data to polygon geometry. If you add countries that aren't in this lookup, add entries to `NAME_TO_ISO`.

---

## Hand Controls

`hand-controls.js` requires no company-specific changes. It reads the `globe` variable from the parent scope and calls `globe.pointOfView()` directly.

The only config you might want to tweak:

```javascript
const CFG = {
  pinchThresh:   0.065,   // Sensitivity for pinch detection (lower = easier to trigger)
  dragSens:      200,     // Globe rotation speed while dragging (higher = faster)
  zoomSens:      5.5,     // Zoom speed (higher = faster)
  minAlt:        0.50,    // Closest zoom level (0 = surface)
  maxAlt:        6.00,    // Furthest zoom level
  dwellMs:       900,     // Hold duration (ms) for palm-select gesture
};
```

---

## Deploying the App

The app is fully static. Deployment options:

| Method | Command |
|--------|---------|
| Local file | Open `index.html` directly in Chrome/Edge |
| Local server | `npx serve .` then open `http://localhost:3000` |
| Static host | Upload all files to S3, Netlify, GitHub Pages, etc. |
| Chromium (file:// + ES modules) | `chromium --allow-file-access-from-files index.html` |

> **Note**: `hand-controls.js` uses ES module `import` syntax. If opening via `file://` in Chrome, you must launch with `--allow-file-access-from-files` or use a local HTTP server. The globe itself works fine on `file://` without this flag.

---

## Quick-Start Checklist for a New Company

- [ ] Copy `index.html`, `config.js`, `hand-controls.js` to a new folder
- [ ] Update `config.js` with the new Anthropic API key
- [ ] Replace CSS colour variables (`--blue`, `--teal`, `--green`) with new brand colours
- [ ] Update the `.gradline` gradient to use new brand colours
- [ ] Replace `COMPANY_OFFICES` and `PARTNER_OFFICES` arrays with real office coordinates
- [ ] Replace `COUNTRY_DATA` records with new company's market data
- [ ] Replace `window.CALASTONE_FLOWS` arcs and nodes with new flow data
- [ ] Update `COUNTRY_MARKDOWN` with new research notes (or clear it and use AI chat to fill)
- [ ] Update hero stat labels in the HTML to match the new domain
- [ ] Update filter dropdown options to match new classification values
- [ ] Update the AI system prompt in `sendChat()` to reflect the new company and domain
- [ ] Update office layer toggle button labels in HTML
- [ ] Update topbar brand name
- [ ] Test: open in browser, verify both modes load, click a country, open chat
- [ ] Add `config.js` to `.gitignore` before pushing to any repo

---

## Technologies Reference

| Dependency | Version | How loaded |
|-----------|---------|-----------|
| [Globe.gl](https://globe.gl) | 2.46.1 | Bundled inline in `index.html` |
| Three.js | bundled with Globe.gl | — |
| [MediaPipe Vision Tasks](https://developers.google.com/mediapipe) | 0.10.14 | CDN, loaded on demand |
| [Marked.js](https://marked.js.org) | latest | CDN, used for markdown rendering |
| Anthropic Claude API | — | Direct browser fetch with key from `config.js` |

No npm, no bundler, no build step. All dependencies are either bundled inline or loaded from CDN at runtime.

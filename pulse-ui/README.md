# Pulse UI — React Bits shell for Phaeron Pulse

Vite + React + TypeScript app that powers:

- `/ui/` — Pulse home (SoftAurora, BlurText, SpotlightCard tool grid, PillNav, GlassSurface)
- `/ui/marketplace.html` — Agent Marketplace (ChromaGrid, RotatingText, BorderGlow)
- `/ui/islands/*` — islands mounted into vanilla tool pages (nav, account, intelligence, globe)

## Develop

```bash
# terminal 1 — static + API
npm run dev

# terminal 2 — Vite HMR (optional)
npm run dev:ui
```

## Build (required before deploy)

```bash
npm run build:ui
```

Outputs to `pulse/ui/` and regenerates stable `load-*.js` island loaders.

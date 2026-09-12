# Vendored dependencies

Two ESM libraries are committed here rather than loaded from a CDN.

| File | Package | Version | Source |
|---|---|---|---|
| `zod.js` | zod | 3.23.8 | `https://cdn.jsdelivr.net/npm/zod@3.23.8/+esm` |
| `motion.js` | motion | 11.11.17 | `https://cdn.jsdelivr.net/npm/motion@11.11.17/+esm` |

Both builds are self-contained — neither contains a single `import` statement,
so they can be dropped in as plain files with no resolution step.

## Why vendored rather than CDN

1. **Node's ESM loader cannot resolve `https://` specifiers.** The pure-logic
   modules (`schemas.js` and everything importing it) are unit-tested with
   `node --test`. A CDN specifier would make them unimportable outside a browser.
2. The rest of Pulse has no build step, so there is no bundler to resolve a bare
   `'zod'` specifier either. A relative path is the only option that works
   identically in the browser and in Node.
3. It removes a network dependency from the feature's critical path.

ECharts is *not* vendored — it is loaded as a UMD `<script>` in
`../../index.html`, consistent with the Chart.js, lucide and anime.js tags
already on that page. The chart modules only touch `window.echarts` inside
`mount()`; their `buildOption()` functions are pure and need no library, which is
what keeps them testable in Node.

## Updating

Re-download from the URL above and overwrite. Check the new file still has no
`import` statements before committing:

```sh
grep -c 'from"' vendor/zod.js   # expect 0
```

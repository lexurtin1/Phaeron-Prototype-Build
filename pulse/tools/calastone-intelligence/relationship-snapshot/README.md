# Relationship Snapshot

A self-contained, factual account dashboard inside the Intelligence Module. A user asks for a
relationship snapshot in the chat; Claude classifies the request and picks display preferences;
deterministic code gates on a valid CTN; a one-page dashboard assembles from four **simulated**
sources.

> **Everything on screen is simulated.** No Salesforce, billing, transaction or Jira system is
> contacted. All names, organisations and figures are invented.

---

## Running it

```sh
npm run dev                  # http://localhost:4173
# then open /pulse/tools/calastone-intelligence/index.html
```

Try: *"Give me a relationship snapshot for CTN 303"*, or *"Prepare a relationship overview"* to see
the CTN clarification gate.

```sh
npm test                     # 65 unit tests, no browser needed
npm run test:smoke -- http://localhost:4173   # 37 browser checks + screenshots
```

The smoke suite needs no Playwright install — `tests/cdp.mjs` drives whatever Chromium or Edge is
already on the machine over the DevTools Protocol using the `ws` package the repo already depends on.

---

## How the workflow runs

```
submit()  (host page, one line)
   │
   ├─ 1. CLASSIFY   intent.js → POST /api/snapshot-intent
   │       Claude picks: workflow, focus, period, blockOrder, title.
   │       Server allow-lists the reply; client re-validates with Zod.
   │       Any failure falls back to classifyLocally() — the feature never dies
   │       because the model is unavailable.
   │
   ├─ 2. GATE       extractCtn()  /\bCTN\s*([0-9]{3})\b/i
   │       Deterministic. NOT delegated to the model.
   │       ├─ no CTN → clarification card, pendingWorkflow stored, NOTHING fetched
   │       └─ CTN    → continue
   │
   ├─ 3. RETRIEVE   data/mock-repo.js → loadSnapshot(ctn, onStage)
   │       Four staged callbacks drive the assembly wheel. Validated against
   │       RelationshipSnapshotSchema before it reaches the DOM.
   │
   └─ 4. RENDER     blocks/registry.js → renderBlocks(order, snapshot, host)
           Allow-list only. Unknown ids are dropped and logged.
```

### What Claude can and cannot do

| Claude decides | Claude cannot touch |
|---|---|
| Is this a `relationship_snapshot`? | Any figure — revenue, transactions, ticket ages, project status |
| Display focus (5 fixed values) | HTML, CSS, chart options, tables, arbitrary widgets |
| Reporting period (4 fixed values) | The CTN — it is never asked to guess or map one |
| Ordering of allow-listed blocks | Which blocks exist |
| A ≤90-char plain-text title | Recommendations, next steps, assessments, rankings |

Enforced in three places, each of which alone would be sufficient:
`api/snapshot-intent.js → normalizeDecision()` (server allow-list),
`schemas.js → WorkflowDecisionSchema` (client re-validation),
`blocks/registry.js → resolveOrder()` (render-time allow-list).

---

## Layout

```
config.js          constants + allow-lists (block ids, focus, period, sources)
schemas.js         Zod contracts for both boundaries
intent.js          CTN regex, local classifier, server classifier, the gate
index.js           controller: conversation state, assembly sequence, host hook
format.js          currency/count/date/age formatters
snapshot.css       all feature CSS, scoped to #view-snapshot / .rs-*

data/
  seed.js          xmur3 + mulberry32 deterministic PRNG
  scenarios.js     fictional fixtures for CTN 101/202/303/404/505
  mock-repo.js     ← THE CONNECTOR SWAP POINT

blocks/
  registry.js      allow-listed block id → renderer
  chart-sections.js  billing + transactions sections

charts/
  theme.js         the Calastone ECharts theme, registered once
  mount.js         ECharts instance handling (kept apart so buildOption stays pure)
  billing-revenue.js  transactions.js  operations.js  project-timeline.js

components/
  account-header.js  kpi-rail.js  relationship-card.js
  operations-panel.js  project-tiles.js  source-rail.js
  states.js        empty / delayed / unavailable / error / clarification
  dom.js           small DOM helpers

motion/
  motion.js        Motion wrapper: reduced-motion enforcement + FLIP helper
  wheel.js         SnapshotAssemblyWheel

vendor/            zod + motion, committed (see vendor/README.md)
```

### Scenarios

| CTN | Account | Demonstrates |
|---|---|---|
| 101 | Kestrel Fund Services | Stable account, all sources live |
| 202 | Halden Capital Partners | Billing/transaction trend variation |
| 303 | Meridian Asset Partners | Heavy operational ticket activity |
| 404 | Aldergate Investment Group | Four concurrent delivery projects (+ timeline) |
| 505 | Thornbury Mutual | Billing **delayed**, transactions **unavailable** |

Any other three-digit CTN produces a deterministic generated profile.

---

## Design decisions worth knowing

**The simulation is pinned to a fixed instant.** `config.js → AS_OF = 2026-08-17`. A real connector
would use `new Date()`; pinning it means the same CTN renders identical figures forever and the test
suite does not rot when the calendar turns. Relative times ("2 hours ago") are computed against
`AS_OF`, not the wall clock.

**Motion has no `layout` prop outside React.** Shared layout transitions (KPI expansion, focus
reorder) use an explicit FLIP helper in `motion/motion.js`: measure, mutate, animate the inverse
delta to zero.

**`buildOption()` never imports ECharts.** Chart modules export a pure option builder plus a
`mount()` that reaches for `window.echarts`. That is what lets the option builders be unit-tested in
Node with no browser and no library.

**Zod and Motion are vendored, ECharts is not.** Node's ESM loader cannot resolve `https://`
specifiers and the repo has no bundler, so the two ES modules are committed as files. ECharts is a
UMD `<script>` in the host page, matching the existing Chart.js/lucide/anime tags.

**Delayed ≠ unavailable.** A delayed source has stale data that still renders, under an amber
notice. An unavailable source renders no figures at all — `ytd` is `null`, not `0`. The UI never
prints a fabricated zero for missing data.

**A blocker line appears only when the source records one.** The component never infers "blocked"
from dates, ticket counts or status age.

---

## Host integration

Six additive edits to `../index.html`, listed here so they are easy to find or revert:

1. `<link>` to `relationship-snapshot/snapshot.css`
2. `prefers-reduced-motion` block for the page's own entrance keyframes
3. `<button class="nav-item" data-view="snapshot">` in the sidebar
4. `<section class="view" id="view-snapshot">` mount shell
5. ECharts UMD `<script>` tag, and `<script type="module">` for this feature
6. Inside `submit()`:
   ```js
   if(window.RelationshipSnapshot && window.RelationshipSnapshot.tryHandle(text, node)) return;
   ```

Plus one behavioural fix: the view switcher previously hardcoded two views
(`vKey==='chat'?'chat':'data'`) and now resolves `#view-<key>`.

If `tryHandle` returns false the host's canned-answer path runs exactly as before. Nothing in the
Market Research module or its Claude integration is touched.

---

## Replacing the simulation with real connectors

Replace `data/mock-repo.js`. Keep `getSnapshot(ctn)` / `loadSnapshot(ctn, onStage)` returning data
that satisfies `RelationshipSnapshotSchema`, and no UI code needs to change. Specifically:

- Call the four systems server-side; the browser must not hold source credentials.
- Set each source's `state` honestly (`live` / `delayed` / `unavailable`) and populate `note` with
  the real reason — the UI already renders all three states.
- Set `available: false` and null figures when a source returns nothing. Do not substitute zeros.
- To drop the "simulated" labelling, three things must change together — the schema currently
  hard-asserts it, deliberately, so the prototype cannot quietly start claiming to be live:
  1. `schemas.js` — `simulated: z.literal(true)` on `RelationshipSnapshotSchema` and `SourceSchema`
  2. `components/account-header.js` — the `.rs-simulated-note` paragraph
  3. `components/source-rail.js` — the `.rs-rail-note` paragraph, and the `(simulated)` subtitles in
     `blocks/chart-sections.js`, `components/operations-panel.js`, `components/project-tiles.js`
     and `components/relationship-card.js`

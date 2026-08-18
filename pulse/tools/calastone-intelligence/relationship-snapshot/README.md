# Relationship Snapshot

A self-contained, factual account dashboard inside the Intelligence Module. A user asks for a
relationship snapshot in the chat; Claude classifies the request and picks display preferences;
deterministic code identifies the account; a one-screen dashboard assembles from four **simulated**
sources.

**There is no snapshot tab.** The request is recognised from the ordinary chat and answered in the
thread: the dashboard assembles inside the assistant message that would otherwise hold a paragraph,
and the thread column widens from 760px to 1560px to hold it. Ordinary messages keep their 760px
measure, centred inside the wider column, so nothing already on screen moves.

**It is one screen, not a page.** Above 880px of column width the seven blocks tile a fixed-height
grid sized to the chat viewport, and the dashboard is read whole rather than scrolled. Below that
they stack into the ordinary list.

> **Everything on screen is simulated.** No Salesforce, billing, transaction or Jira system is
> contacted. All names, organisations and figures are invented.

---

## Running it

```sh
npm run dev                  # http://localhost:4173
# then open /pulse/tools/calastone-intelligence/index.html
```

**It must be served over HTTP.** Opening `index.html` from the filesystem gets you a page that
looks fine and silently has no snapshot feature: Chrome refuses module scripts from a `file://`
origin (`blocked by CORS policy`), so `window.RelationshipSnapshot` never registers and every
prompt falls through to the host's canned answers.

Try: *"Give me a relationship snapshot for CTN 303"*, *"how are things at Meridian?"*, or
*"relationship snapshot for BlackRock"* to see what happens when the account does not exist.

```sh
npm test                     # 78 unit tests, no browser needed
npm run test:smoke -- http://localhost:4173   # 58 browser checks + screenshots
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
   │       NOTE the model does not decide WHETHER we handle the prompt. See
   │       "What actually claims a prompt" below.
   │
   ├─ 2. IDENTIFY   extractCtn() → /\bCTN\s*([0-9]{3})\b/i
   │                lookupAccount() → exact match in data/directory.js
   │       Both deterministic. NEITHER delegated to the model.
   │       ├─ CTN     → continue (a CTN outranks a name in the same message)
   │       ├─ name    → continue on that account's CTN, and say so on screen
   │       └─ neither → clarification card, pendingWorkflow stored, NOTHING fetched
   │
   ├─ 3. RETRIEVE   data/mock-repo.js → loadSnapshot(ctn, onStage)
   │       Four staged callbacks drive the assembly wheel. Validated against
   │       RelationshipSnapshotSchema before it reaches the DOM.
   │
   └─ 4. RENDER     blocks/registry.js → renderBlocks(order, snapshot, host)
           Allow-list only. Unknown ids are dropped and logged.
```

### How an account is identified

A dashboard headed with a company the user did not ask about is worse than no dashboard. Two things
prevent it, and both are code:

| The message says | Resolved by | What appears |
|---|---|---|
| `CTN 303` | the regex | the CTN 303 dashboard |
| "Meridian", "Thornbury Mutual" | exact lookup in `data/directory.js` | that account's dashboard, above the line *Matched "meridian" to Meridian Asset Partners · CTN 303* |
| "BlackRock", "HSBC" | nothing — the directory has no entry | *There is no account named BlackRock in this simulation*, and the five accounts listed **by name** |
| nothing | — | the same card, without the first sentence |

The directory is built from the scenario fixtures, so it cannot drift from what the repository can
actually return. A name matches on the full name or on a distinctive word from it; shared furniture
("Capital", "Partners", "Fund Services") matches nothing, and a name outside the directory resolves
to nothing at all rather than to the nearest entry.

Claude is still never asked to guess a CTN or to map an organisation onto one.

### What actually claims a prompt

`tryHandle` must answer the host synchronously — `submit()` needs a boolean before it can decide
whether to run its own path — so the decision to claim a turn is made by **`classifyLocally` alone**.
The server is consulted afterwards and can only refine focus, period, block order and title. It
cannot claim a prompt the local classifier passed on, and it cannot veto one it took.

That makes the local hint list the **ceiling** on recognition, not the floor:

| Prompt | `classifyLocally` | Model (if asked) | What happens |
|---|---|---|---|
| `how are things going with CTN 303` | snapshot (CTN present) | snapshot | dashboard |
| `what's the picture at Meridian?` | snapshot (directory name) | snapshot | dashboard |
| `Prepare a relationship overview` | snapshot (hint) | snapshot | clarification card |
| `How are we charging BlackRock?` | other | snapshot | falls through — and correctly so, the host answers this one |

The last row is why the ceiling exists: with no synchronous signal, claiming ambiguous prompts
speculatively would steal answers the host already gives well. The three signals are all things
nothing else in the module recognises — its own identifier, its own account names, and phrasings
narrow enough not to overlap the canned answers.

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
snapshot.css       all feature CSS, scoped to .rs-root / .rs-*

data/
  seed.js          xmur3 + mulberry32 deterministic PRNG
  scenarios.js     fictional fixtures for CTN 101/202/303/404/505
  directory.js     name → CTN, derived from scenarios.js
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

Colour comes from the Calastone mark: a black wordmark over a blue → teal → green sweep
(`--rs-blue` #1D7FB8 → `--rs-teal` #2D9A8E → `--rs-lime` #6BBF59). It appears as a rule along the top
of every card and as the chart series palette. Status colours — amber for attention, red for
severity — are deliberately **not** on that ramp, so a brand colour can never be read as a state.
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

Five additive edits to `../index.html`, listed here so they are easy to find or revert:

1. `<link>` to `relationship-snapshot/snapshot.css`
2. `prefers-reduced-motion` block for the page's own entrance keyframes
3. `.thread-inner.has-wide` / `.msg-wide` — the widened chat column (3 rules)
4. ECharts UMD `<script>` tag, and `<script type="module">` for this feature
5. Inside `submit()`:
   ```js
   if(window.RelationshipSnapshot && window.RelationshipSnapshot.tryHandle(text, node)) return;
   ```

Plus one suggestion chip (`data-q="Give me a relationship snapshot for CTN 303"`) so the feature is
discoverable without a nav item, and one behavioural fix: the view switcher previously hardcoded two
views (`vKey==='chat'?'chat':'data'`) and now resolves `#view-<key>`.

If `tryHandle` returns false the host's canned-answer path runs exactly as before. Nothing in the
Market Research module or its Claude integration is touched.

### The one-screen layout

Above 880px of column width — `FIT_MIN_WIDTH` in `config.js`, matching the `@container rs` threshold
in `snapshot.css` — `.rs-blocks` stops being a vertical list and becomes a fixed-height grid:

```
┌───────────────────────────────────────────────┐
│ account-header                            12  │   one bar, not four rows
│ kpi-rail                                  12  │
├───────────┬───────────┬───────────────────────┤
│ billing 4 │ trans   4 │ relationship        4 │   0.85fr
├───────────┴─────┬─────┴───────────────────────┤
│ operations    7 │ projects                  5 │   1.15fr
└─────────────────┴─────────────────────────────┘
  sources: one folded strip
```

Blocks are placed by `grid-column: span N`, never by named area, so the five focus orderings in
`config.js` still reorder them — each of the five happens to tile the twelve columns exactly.

Four things make the content fit rather than merely clip:

- **The tile is the boundary.** Every card is a flex column with `min-height: 0`; long lists (contacts,
  project tiles) scroll inside their own tile. The dashboard does not scroll — a list does.
- **Long tables fold.** The ticket table and the evidence cards render inside a disclosure, closed in
  this layout and open in the list layout. `renderBlocks` passes `ctx.fit` so a block knows which one
  it is in.
- **Charts follow their box.** `charts/mount.js` observes each chart element and, under ~152px, drops
  the in-chart title, tightens the legend and halves the gridlines — see `applyDensity`. This lives
  in the mount layer so `buildOption()` stays pure and testable, and so the density survives a window
  resize.
- **Nothing is said twice.** The billing and transaction summary strips repeat their own KPI cards
  word for word, and each KPI card's "refreshed" line repeats the header's; both are hidden here.

Below 880px none of this applies and the original stacked list renders unchanged.

### Why the widened column rather than a breakout

`.thread-inner` is a centred flex column. Widening its `max-width` and re-centring ordinary messages
at 760px inside it leaves every existing message at exactly the same screen position, and can never
overflow the thread's scroll container. A negative-margin breakout on the snapshot message would
have done neither.

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

---

## If snapshot prompts fall through to the canned answers

The page now says so itself: an amber banner appears under the topbar when
`window.RelationshipSnapshot` failed to register, naming the cause and the URL to use.

Almost always the cause is opening `index.html` from disk. Browsers refuse module scripts on a
`file://` origin, so the module never runs — while the CSS, the sidebar and every canned answer keep
working, which makes the page look entirely healthy. The check lives at the foot of `../index.html`
and fires on `window.load`.

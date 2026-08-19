# Relationship Snapshot

A self-contained, factual account dashboard inside the Intelligence Module. A user asks for a
relationship snapshot in the chat; Claude classifies the request and picks display preferences;
deterministic code identifies the account; a one-screen dashboard assembles from four **simulated**
sources.

**There is no snapshot tab.** The request is recognised from the ordinary chat and answered in the
thread: the dashboard assembles inside the assistant message that would otherwise hold a paragraph,
and the thread column widens from 760px to 1560px to hold it. Ordinary messages keep their 760px
measure, centred inside the wider column, so nothing already on screen moves.

**It is a fixed template, about one screen deep.** Five cards, the same five every time, in the same
places: the company, its key figures, transaction volume and billing revenue side by side, and the
delivery projects. Nothing collapses, nothing reorders, nothing is behind a toggle. What differs
between one snapshot and the next is the data.

> **The account names are real firms; nothing behind them is.** A sales audience recognises the
> accounts it works with, and "Kestrel Fund Services" told them nothing. Every figure is generated
> by `data/mock-repo.js`, and the relationship managers, account teams and client contacts remain
> entirely fictional.

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

Try: *"Give me a relationship snapshot for CTN 303"*, *"how is billing looking for HSBC this
year?"*, or *"relationship snapshot for Barclays"* to see what happens when the account is not one
of the five.

```sh
npm test                     # 80 unit tests, no browser needed
npm run test:smoke -- http://localhost:4173   # 70 browser checks + screenshots
```

The smoke suite needs no Playwright install — `tests/cdp.mjs` drives whatever Chromium or Edge is
already on the machine over the DevTools Protocol using the `ws` package the repo already depends on.

---

## How the workflow runs

```
submit()  (host page, one line)
   │
   ├─ 1. CLASSIFY   intent.js → POST /api/snapshot-intent
   │       Claude picks: workflow, period, title. Not the layout.
   │       Server allow-lists the reply; client re-validates with Zod.
   │       Any failure falls back to classifyLocally() — the feature never dies
   │       because the model is unavailable. The browser gives up after 9s.
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
   └─ 4. RENDER     blocks/registry.js → renderBlocks(snapshot, host)
           The fixed template. There is no ordering to supply and none to check.
```

### How an account is identified

A dashboard headed with a company the user did not ask about is worse than no dashboard. Two things
prevent it, and both are code:

| The message says | Resolved by | What appears |
|---|---|---|
| `CTN 303` | the regex | the CTN 303 dashboard |
| "HSBC", "lgim", "abrdn" | exact lookup in `data/directory.js` | that account's dashboard, above the line *Matched "hsbc" to HSBC Asset Management · CTN 101* |
| "Barclays", "Vanguard" | nothing — the directory has no entry | *There is no account named Barclays in this simulation*, and the five accounts listed **by name** |
| nothing | — | the same card, without the first sentence |

The directory is built from the scenario fixtures, so it cannot drift from what the repository can
actually return. A name matches on the full name or on a distinctive word from it; shared furniture
("Capital", "Partners", "Fund Services") matches nothing, and a name outside the directory resolves
to nothing at all rather than to the nearest entry.

Claude is still never asked to guess a CTN or to map an organisation onto one.

### What actually claims a prompt

`tryHandle` must answer the host synchronously — `submit()` needs a boolean before it can decide
whether to run its own path — so the decision to claim a turn is made by **`classifyLocally` alone**.
The server is consulted afterwards and can only refine the period and the title. It
cannot claim a prompt the local classifier passed on, and it cannot veto one it took.

That makes the local hint list the **ceiling** on recognition, not the floor:

Three things claim a turn, all of them synchronous:

1. **A CTN.** `CTN nnn` is this feature's own identifier and nothing else recognises it.
2. **Snapshot phrasing** — snapshot, overview, summary, review, picture. On its own this leads to
   the clarification card, not to data.
3. **An account name the host has no prepared answer about.** The accounts are real firms and the
   host answers its own questions about the same firms, so the host publishes
   `window.cannedKey(prompt)` and this feature stays off anything it returns a key for.

| Prompt | Claimed? | Why |
|---|---|---|
| `how are things going with CTN 303` | yes | CTN present |
| `relationship snapshot for Barclays` | yes | snapshot phrasing → clarification card |
| `how is billing looking for HSBC this year?` | yes | names an account, host has no answer for it |
| `How are we charging BlackRock?` | no | `cannedKey` returns `blackrock` — the host answers this one |
| `Relationship status with Legal & General` | no | `cannedKey` returns `lng` |

Where a host does not publish `cannedKey`, a name alone is not taken: there is no way to know what
would be trampled.

### What Claude can and cannot do

Claude is told which account the request resolved to — name, CTN, tier, segment and region, all
worked out by application code — so that its decisions are about *this account's* request rather
than about a sentence in the abstract. It is never asked to work the account out.

| Claude decides | Claude cannot touch |
|---|---|
| Is this a `relationship_snapshot`? | Any figure — revenue, transactions, ticket ages, project status |
| Reporting period (4 fixed values) | HTML, CSS, chart options, tables, arbitrary widgets |
| A ≤90-char plain-text title, naming the account | The layout: which cards, in what order, how large |
| | The CTN — it is never asked to guess or map one |
| | Recommendations, next steps, assessments, rankings |

The decision object is three fields — `workflow`, `period`, `title` — and that is the entire surface.
It used to carry a display focus and a block ordering; the template is fixed now, so there is
nothing for either to do, and a field the renderer ignores is worse than no field at all.

The period is not decoration: `last_3_months` genuinely narrows the months the trend line charts.
So *"transaction volume for HSBC over the last 3 months"* returns `period: last_3_months` and the
title *"Transaction volume for HSBC Asset Management, last 3 months"* — the same five cards, a
different window of data, and a title that says which.

Enforced in two places, either of which alone would be sufficient:
`api/snapshot-intent.js → normalizeDecision()` (server allow-list) and
`schemas.js → WorkflowDecisionSchema` (client re-validation).

---

## Layout

```
config.js          the template, plus period and source constants
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
  registry.js      the fixed template: block id → renderer
  chart-sections.js  the paired row — transaction volume + billing revenue

charts/
  theme.js         the Calastone ECharts theme + the brand ramp, registered once
  mount.js         ECharts instance handling (kept apart so buildOption stays pure)
  transactions.js       the trend line
  billing-progress.js   the ring against last year
  billing-revenue.js    monthly series (option builder; no mounted chart today)
  operations.js         raised/resolved + severity

components/
  account-header.js  kpi-rail.js  project-tiles.js
  operations-panel.js  relationship-card.js
  states.js        empty / delayed / unavailable / error / clarification
  dom.js           small DOM helpers, incl. section() — the card

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

| CTN | Account | Also answers to | Demonstrates |
|---|---|---|---|
| 101 | HSBC Asset Management | hsbc | Stable account, all sources live |
| 202 | Schroders | — | Billing/transaction trend variation |
| 303 | BlackRock | black rock | Heavy operational ticket activity (see the KPI rail) |
| 404 | Legal & General Investment Management | legal & general, lgim, l&g | Four concurrent delivery projects |
| 505 | abrdn | aberdeen | Billing **delayed**, transactions **unavailable** |

Aliases are declared on the scenario, not derived: several of these firms are known by an
abbreviation no algorithm would produce from the registered name, and "Legal & General Investment
Management" must not be reachable as "general".

Any other three-digit CTN produces a deterministic generated profile.

---

## Design decisions worth knowing

**The simulation is pinned to a fixed instant.** `config.js → AS_OF = 2026-08-17`. A real connector
would use `new Date()`; pinning it means the same CTN renders identical figures forever and the test
suite does not rot when the calendar turns. Relative times ("2 hours ago") are computed against
`AS_OF`, not the wall clock.

**The KPI rail states, it does not offer.** The five headline figures are static tiles — no
chevron, no panel, nothing to click. A figure behind a disclosure is a figure the reader has to
already suspect is worth opening, and these five are the ones nobody should have to go looking for.
The detail that used to sit behind them lives in the always-open card that owns it, and the header
names each source with its refresh time.

Tone rides on the card edge rather than the number: an amber figure reads as a judgement about the
figure, an amber edge reads as a card to look at.

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
6. `resolve()` split into `cannedKey()` + `resolve()`, with `window.cannedKey` exposed. Same
   answers, same order; it just makes the host's "do I already answer this?" test askable.

Plus one suggestion chip (`data-q="Give me a relationship snapshot for CTN 303"`) so the feature is
discoverable without a nav item, and one behavioural fix: the view switcher previously hardcoded two
views (`vKey==='chat'?'chat':'data'`) and now resolves `#view-<key>`.

If `tryHandle` returns false the host's canned-answer path runs exactly as before. Nothing in the
Market Research module or its Claude integration is touched.

### The template

```
┌───────────────────────────────────────────────┐
│ BlackRock   CTN 303 · Strategic · EMEA        │  the company
│ £2,613,316  785,694  7/8  14  2               │  key figures
├───────────────────────────┬───────────────────┤
│ Operational activity      │ Relationship and  │  7 cols / 5 cols
│  ▁▃▅▂ raised vs resolved  │ ownership         │
├──────────────────────┬────┴───────────────────┤
│ Transaction volume   │ Billing revenue YTD    │  equal width, side by side
│  ╱╲    ╱╲            │        ╭───╮           │
│ ╱  ╲__╱  ╲___        │        │73%│  £2.6m    │
│                      │        ╰───╯  of £3.6m │
├──────────────────────┴────────────────────────┤
│ Digital TA onboarding │ API v3 migration      │  a card per project
└───────────────────────────────────────────────┘
```

Two measures, two shapes, because they answer different questions. **Transaction volume** is a
trend — the shape of the year, a line along the Calastone ramp with last year dashed behind it.
**Billing revenue** is a position — a ring showing how far through last year's full-year total this
year has come, which is a question a line chart cannot answer at a glance.

Two honesty rules are wired into the ring rather than left to a reviewer:

- Past 100% the arc stops at full and the centre keeps counting. A ring that wrapped round would
  read as 12% when it meant 112%.
- With no prior year there is no ring at all — the card prints the figure and says why. A circle at
  a percentage of nothing is an invented figure, and inventing figures is the one thing this
  feature must never do.

**The thread height is a floor, not a ceiling.** `fitToThread` in `index.js` measures the thread
rather than estimating it and writes `--rs-fit-h`, because a stylesheet `calc(100vh - 214px)` that
is eight pixels optimistic is the difference between a card that fits and one that does not. It
re-measures when the window changes shape, and stands aside when the thread is not a scroll
viewport at all.

The dashboard takes that height as a `min-height` and grows past it when the alternative is a
crushed chart. Both chart rows carry a floor sized so every plot clears `COMPACT_HEIGHT` in
`charts/mount.js` (152px) — below that a chart drops its in-chart title, its axis name and half its
gridlines to survive the box, and a chart that has thinned itself to fit is worse than a hundred
pixels of scroll. On a 1600×1000 window the dashboard runs about 990px against a 810px thread; the
one account with a delayed billing source runs to about 1070px, because the notice it has to print
sits above the ring.

The row weights are deliberately proportional to the row floors. An `fr` row cannot reach its own
floor without dragging its siblings up by their weights too, so a mismatched pair overshoots —
the original weights against these floors inflated the dashboard by an extra 130px of nothing.
Change a floor and rescale its weight with it.

Below 720px of column width the pair stops being a pair and the project cards stop being a row:
the template becomes a single column and the thread scrolls it, because neither would be readable
side by side at that width.

**Evidence is on the cards, not behind them.** Each of the paired cards ends with its source, state,
refresh time, record count and evidence reference in plain text. That used to be a disclosure; a
figure whose provenance is one click away is a figure most people never check.

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
  3. The `(simulated)` subtitles in `blocks/chart-sections.js` and `components/project-tiles.js`,
     and the per-card evidence line in `blocks/chart-sections.js`

---

## If snapshot prompts fall through to the canned answers

The page now says so itself: an amber banner appears under the topbar when
`window.RelationshipSnapshot` failed to register, naming the cause and the URL to use.

Almost always the cause is opening `index.html` from disk. Browsers refuse module scripts on a
`file://` origin, so the module never runs — while the CSS, the sidebar and every canned answer keep
working, which makes the page look entirely healthy. The check lives at the foot of `../index.html`
and fires on `window.load`.

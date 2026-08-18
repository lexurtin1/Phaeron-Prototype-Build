# Relationship Snapshot

A self-contained, factual account dashboard inside the Intelligence Module. A user asks for a
relationship snapshot in the chat; Claude classifies the request and picks display preferences;
deterministic code identifies the account; a one-screen dashboard assembles from four **simulated**
sources.

**There is no snapshot tab.** The request is recognised from the ordinary chat and answered in the
thread: the dashboard assembles inside the assistant message that would otherwise hold a paragraph,
and the thread column widens from 760px to 1560px to hold it. Ordinary messages keep their 760px
measure, centred inside the wider column, so nothing already on screen moves.

**It is one screen, not a page, at any window size.** The account header and the KPI rail are always
visible; the five detail blocks below them are expandable cards, one open at a time. A closed card
is a strip carrying its own headline figures, so nothing is hidden — and the open card gets every
pixel the strips leave, which is what makes its charts worth looking at.

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
npm test                     # 82 unit tests, no browser needed
npm run test:smoke -- http://localhost:4173   # 66 browser checks + screenshots
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
The server is consulted afterwards and can only refine focus, period, block order and title. It
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
| Display focus (5 fixed values) — **which card the dashboard opens on** | HTML, CSS, chart options, tables, arbitrary widgets |
| Reporting period (4 fixed values) | The CTN — it is never asked to guess or map one |
| Ordering of allow-listed blocks | Which blocks exist |
| A ≤90-char plain-text title, naming the account | Recommendations, next steps, assessments, rankings |

So *"how is billing looking for HSBC this year?"* returns `focus: billing`, `period: ytd` and the
title *"Billing overview for HSBC Asset Management, year to date"* — the deck opens on the billing
card, orders the strips behind it, and prints that title under the account name. Same account, a
different question, a different view.

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
  operations-panel.js  project-tiles.js
  states.js        empty / delayed / unavailable / error / clarification
  dom.js           small DOM helpers, incl. section() — the expandable card

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
| 303 | BlackRock | black rock | Heavy operational ticket activity |
| 404 | Legal & General Investment Management | legal & general, lgim, l&g | Four concurrent delivery projects (+ timeline) |
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
6. `resolve()` split into `cannedKey()` + `resolve()`, with `window.cannedKey` exposed. Same
   answers, same order; it just makes the host's "do I already answer this?" test askable.

Plus one suggestion chip (`data-q="Give me a relationship snapshot for CTN 303"`) so the feature is
discoverable without a nav item, and one behavioural fix: the view switcher previously hardcoded two
views (`vKey==='chat'?'chat':'data'`) and now resolves `#view-<key>`.

If `tryHandle` returns false the host's canned-answer path runs exactly as before. Nothing in the
Market Research module or its Claude integration is touched.

### The one-screen layout

```
┌───────────────────────────────────────────────┐
│ account header                                │  always
│ KPI rail                                      │  always
├───────────────────────────────────────────────┤
│ ▸ Relationship        Rowan Whitfield · 3     │  strip
│ ▾ Billing revenue     £1,223,731  +6.7%       │  ┐
│                                               │  │ open, fills
│                                               │  ┘
│ ▸ Transactions        336,799  +6.3%          │  strip
│ ▸ Operations          3 open · 0 high         │  strip
│ ▸ Projects            1 in progress           │  strip
└───────────────────────────────────────────────┘
```

The dashboard's height is the chat thread's height, measured rather than estimated — `fitToThread`
in `index.js` reads the thread and writes `--rs-fit-h`, because a stylesheet `calc(100vh - 214px)`
that is eight pixels optimistic is the difference between one screen and a scrollbar. It re-measures
when the window changes shape, and stands aside when the thread is not a scroll viewport at all.

Four things make the content fit rather than merely clip:

- **One card open at a time.** Not a style choice: two open cards would not fit, and the deck's
  promise is that it always does. Which one starts open is Claude's `focus`.
- **A closed card is not an empty label.** Each carries the headline figures it would lead with
  open, so the deck reads as a dashboard whether or not anything is expanded.
- **Charts mount on first open.** ECharts cannot measure a `display:none` box, so a closed card's
  charts do not exist yet; `mountBlock` creates them the first time it opens, and a ResizeObserver
  keeps them the size of the box they are in.
- **Nothing is said twice.** The billing and transaction summary strips repeat the card's own
  headline figures, and each KPI card's "refreshed" line repeats the header's; both are hidden.

**The source rail was removed.** The account header already carries a chip per source with its
state, and each section's evidence drawer already carries the refresh time, record count and
evidence reference. A third copy cost a fifth of the height and told nobody anything new.

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

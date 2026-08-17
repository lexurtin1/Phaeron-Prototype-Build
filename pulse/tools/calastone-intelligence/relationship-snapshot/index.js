/**
 * Relationship Snapshot — feature entry point.
 *
 * Registers `window.RelationshipSnapshot` so the Intelligence Module's existing
 * `submit()` can offer it each prompt. If this feature does not claim the
 * prompt, `tryHandle` returns false and the host's canned-answer path runs
 * exactly as before — the integration is one line and one boolean.
 *
 * Load order note: this is a module (deferred), so it registers after the host
 * page's classic inline script has already defined `submit()`. The host guards
 * with `window.RelationshipSnapshot?.` for the brief window before that.
 */

import { classifyWorkflow, classifyLocally, gate, extractCtn } from './intent.js';
import { loadSnapshot } from './data/mock-repo.js';
import { RelationshipSnapshotSchema, safeValidate } from './schemas.js';
import { resolveOrder, renderBlocks } from './blocks/registry.js';
import { createAssemblyWheel } from './motion/wheel.js';
import * as sourceRail from './components/source-rail.js';
import * as kpiRail from './components/kpi-rail.js';
import * as projectTiles from './components/project-tiles.js';
import { statusChip } from './components/account-header.js';
import { clarificationCard, errorState } from './components/states.js';
import { fromHTML } from './components/dom.js';
import { animate, enter, stagger, pause, prefersReducedMotion, DUR } from './motion/motion.js';
import { disposeAll, resizeAll } from './charts/mount.js';
import { esc } from './format.js';

/* ───────────────────────── conversation state ───────────────────────── */

/**
 * A relationship snapshot that was requested without a CTN and is waiting for
 * one. Held for the life of the conversation, exactly as the brief requires.
 * @type {import('./intent.js').PendingWorkflow|null}
 */
let pendingWorkflow = null;

/** Guards against two snapshots assembling at once. */
let running = false;

/* ───────────────────────── DOM plumbing ───────────────────────── */

function view() {
  return document.getElementById('view-snapshot');
}

function mainHost() {
  return document.getElementById('rs-main');
}

function railHost() {
  return document.getElementById('rs-rail-host');
}

/** Switch the Intelligence Module to the snapshot view via its own nav. */
function showView() {
  const btn = document.querySelector('.nav-item[data-view="snapshot"]');
  if (btn) {
    btn.click();
    return;
  }
  // Fallback if the nav item is missing for any reason.
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  view()?.classList.add('active');
}

/** A compact card dropped into the chat thread linking to the dashboard. */
function threadCard(snapshot, { resumed, originalPrompt }) {
  const node = fromHTML(`
    <div class="rs-thread-card">
      <div class="rs-thread-card-head">
        <span class="rs-status-dot" aria-hidden="true"></span>
        <span class="rs-thread-card-title">Relationship snapshot ready</span>
      </div>
      <p class="rs-thread-card-body">
        ${esc(snapshot.account.name)} · ${esc(snapshot.ctnLabel)} —
        ${esc(snapshot.sources.filter((s) => s.state === 'live').length)} of
        ${esc(snapshot.sources.length)} sources returned data.
      </p>
      ${resumed ? `<p class="rs-thread-card-note">Resumed from: “${esc(originalPrompt)}”</p>` : ''}
      <button type="button" class="rs-thread-card-btn">Open the dashboard →</button>
    </div>
  `);
  node.querySelector('.rs-thread-card-btn').addEventListener('click', showView);
  return node;
}

/* ───────────────────────── assembly sequence ───────────────────────── */

/**
 * The dashboard reveal, in the order the brief specifies:
 * header → KPI cards → charts left to right → operations/projects → sources.
 */
async function runAssemblySequence(elements, rail) {
  const byBlock = (name) => elements.find((e) => e.dataset?.block === name);

  const header = byBlock('account-header');
  if (header) await enter(header, { duration: DUR.base, y: 8 }).finished;

  const kpis = byBlock('kpi-rail');
  if (kpis) {
    await pause(0.04);
    kpiRail.animateIn(kpis);
  }

  // Charts reveal left to right.
  const charts = [byBlock('billing-revenue'), byBlock('transactions')].filter(Boolean);
  if (charts.length) {
    await pause(0.08);
    animate(
      charts,
      { opacity: [0, 1], transform: ['translateX(-10px)', 'translateX(0px)'] },
      { duration: DUR.slow, delay: stagger(0.08) },
    );
  }

  const tail = [byBlock('relationship'), byBlock('operations'), byBlock('projects')].filter(Boolean);
  if (tail.length) {
    await pause(0.08);
    animate(tail, { opacity: [0, 1], transform: ['translateY(10px)', 'translateY(0px)'] },
      { duration: DUR.slow, delay: stagger(0.06) });
  }

  const projects = byBlock('projects');
  if (projects) projectTiles.animateIn(projects);

  // Source/evidence chips appear last.
  if (rail) {
    await pause(0.1);
    sourceRail.animateIn(rail);
  }

  resizeAll();
}

/* ───────────────────────── the run ───────────────────────── */

/**
 * Retrieve and render a snapshot. Only ever called once a CTN has been
 * validated — the repository is not touched before that point.
 *
 * @param {string} ctn
 * @param {import('./schemas.js').WorkflowDecision} decision
 * @param {{resumed?: boolean, originalPrompt?: string}} meta
 * @returns {Promise<import('./schemas.js').RelationshipSnapshot|null>}
 */
async function run(ctn, decision, meta = {}) {
  if (running) return null;
  running = true;

  const host = mainHost();
  const rail = railHost();
  if (!host) {
    running = false;
    return null;
  }

  disposeAll();
  host.replaceChildren();
  rail?.replaceChildren();

  // 1. Assembly wheel — shown only while retrieval is genuinely in flight.
  const wheel = createAssemblyWheel();
  host.appendChild(wheel.el);
  enter(wheel.el, { duration: DUR.base });
  showView();

  let snapshot;
  try {
    snapshot = await loadSnapshot(ctn, (stage, sources) => wheel.setStage(stage, sources), {
      fast: prefersReducedMotion(),
    });
  } catch (err) {
    wheel.fail('Retrieval failed.');
    host.replaceChildren(errorState(String(err?.message || err)));
    running = false;
    return null;
  }

  // 2. Validate at the boundary. A malformed snapshot must not reach the DOM.
  const parsed = safeValidate(RelationshipSnapshotSchema, snapshot);
  if (!parsed.ok) {
    host.replaceChildren(errorState(`The snapshot data failed validation (${parsed.error}).`));
    running = false;
    return null;
  }
  snapshot = parsed.data;

  await pause(0.15);

  // 3. Render the allow-listed blocks in the resolved order.
  const order = resolveOrder(decision.blockOrder, { focus: decision.focus });
  const stage = document.createElement('div');
  stage.className = 'rs-blocks';
  const { elements } = renderBlocks(order, snapshot, stage, {
    title: decision.title,
    period: decision.period,
  });

  // Hide until the sequence animates them in, so nothing flashes at full opacity.
  if (!prefersReducedMotion()) {
    for (const node of elements) node.style.opacity = '0';
  }

  host.appendChild(stage);

  // 4. The wheel becomes the header status chip rather than simply vanishing.
  const chip = statusChip(stage);
  await wheel.collapseInto(chip);

  // 5. Source rail last.
  const railEl = sourceRail.render(snapshot);
  if (rail) {
    rail.appendChild(railEl);
    if (!prefersReducedMotion()) railEl.style.opacity = '1';
  }

  await runAssemblySequence(elements, railEl);

  view()?.setAttribute('data-focus', decision.focus || 'default');
  running = false;
  return snapshot;
}

/* ───────────────────────── host integration ───────────────────────── */

/**
 * Offered every prompt by the Intelligence Module's `submit()`.
 *
 * @param {string} text the user's message
 * @param {HTMLElement} [assistantNode] the pending assistant bubble in the thread
 * @returns {boolean} true if this feature has taken ownership of the prompt
 */
function tryHandle(text, assistantNode) {
  if (typeof text !== 'string' || !text.trim()) return false;

  // Synchronous decision first: does this look like ours at all? A pending
  // workflow plus a CTN always claims the turn.
  const local = classifyLocally(text);
  const claimsTurn = local.workflow === 'relationship_snapshot'
    || (pendingWorkflow && extractCtn(text));

  if (!claimsTurn) return false;

  // Own the turn, then refine the decision with the server classifier.
  handleAsync(text, assistantNode);
  return true;
}

async function handleAsync(text, assistantNode) {
  const body = assistantNode?.querySelector?.('.assistant-body');

  const local = classifyLocally(text);
  const { decision: remote, source, error } = await classifyWorkflow(text);
  if (error && source === 'local') {
    console.info('[relationship-snapshot] using local classifier:', error);
  }

  // The server REFINES, it does not veto. We already claimed this turn on the
  // local classification, so letting a remote "other" through here would drop
  // the user's message on the floor. Claude's contribution is the display
  // preferences; whether this is a snapshot request at all is settled, and the
  // CTN gate below is never influenced by either classifier.
  const decision = {
    ...remote,
    workflow: (local.workflow === 'relationship_snapshot' || pendingWorkflow)
      ? 'relationship_snapshot'
      : remote.workflow,
    focus: remote.focus ?? local.focus,
    period: source === 'server' ? remote.period : local.period,
  };

  const outcome = gate(text, decision, pendingWorkflow);

  if (outcome.action === 'ignore') {
    // Extremely unlikely (we already claimed the turn), but never leave the
    // thread showing a typing indicator forever.
    if (body) body.innerHTML = '<p>I could not interpret that as a relationship snapshot request.</p>';
    return;
  }

  if (outcome.action === 'clarify') {
    // No data retrieval has happened, and none will until a CTN arrives.
    pendingWorkflow = outcome.pending;
    if (body) {
      body.replaceChildren();
      body.appendChild(clarificationCard((ctn) => submitCtn(ctn)));
    }
    return;
  }

  // action === 'run'
  pendingWorkflow = null;
  if (body) {
    body.replaceChildren();
    body.appendChild(fromHTML('<p class="rs-thread-status">Assembling the relationship snapshot…</p>'));
  }

  const snapshot = await run(outcome.ctn, outcome.decision, {
    resumed: outcome.resumed,
    originalPrompt: outcome.originalPrompt,
  });

  if (body) {
    body.replaceChildren();
    if (snapshot) {
      body.appendChild(threadCard(snapshot, {
        resumed: outcome.resumed,
        originalPrompt: outcome.originalPrompt,
      }));
    } else {
      body.appendChild(errorState('The snapshot could not be assembled.'));
    }
  }
}

/** Used by the clarification card's example chips. */
function submitCtn(ctn) {
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  if (!input || !sendBtn) return;
  input.value = `CTN ${ctn}`;
  input.dispatchEvent(new Event('input'));
  sendBtn.click();
}

/* ───────────────────────── registration ───────────────────────── */

const api = {
  tryHandle,
  run,
  showView,
  extractCtn,
  get pending() { return pendingWorkflow; },
  /** Test/debug hook: clear conversation state. */
  reset() {
    pendingWorkflow = null;
    running = false;
    disposeAll();
    mainHost()?.replaceChildren();
    railHost()?.replaceChildren();
  },
};

if (typeof window !== 'undefined') {
  window.RelationshipSnapshot = api;
}

export default api;
export { tryHandle, run, showView };

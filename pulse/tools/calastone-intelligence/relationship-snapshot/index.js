/**
 * Relationship Snapshot — feature entry point.
 *
 * Registers `window.RelationshipSnapshot` so the Intelligence Module's existing
 * `submit()` can offer it each prompt. If this feature does not claim the
 * prompt, `tryHandle` returns false and the host's canned-answer path runs
 * exactly as before — the integration is one line and one boolean.
 *
 * There is no snapshot view or tab. A recognised request is answered in the
 * chat like any other: the dashboard assembles inside the assistant message
 * that replaces the typing indicator, and the thread column widens to fit it.
 *
 * Load order note: this is a module (deferred), so it registers after the host
 * page's classic inline script has already defined `submit()`. The host guards
 * with `window.RelationshipSnapshot?.` for the brief window before that.
 */

import { classifyWorkflow, classifyLocally, gate, extractCtn } from './intent.js';
import { loadSnapshot } from './data/mock-repo.js';
import { RelationshipSnapshotSchema, safeValidate } from './schemas.js';
import { renderBlocks } from './blocks/registry.js';
import { createAssemblyWheel } from './motion/wheel.js';
import * as kpiRail from './components/kpi-rail.js';
import * as projectTiles from './components/project-tiles.js';
import { statusChip } from './components/account-header.js';
import { clarificationCard, errorState } from './components/states.js';
import { accountForCtn, lookupAccount } from './data/directory.js';
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

/* ───────────────────────── DOM plumbing ─────────────────────────
 *
 * The dashboard has no view of its own. It renders inside the assistant message
 * that answered the prompt, which is why every DOM reference below is relative
 * to a mount element rather than a page-level id.
 */

/**
 * Prepare an assistant message to hold a dashboard: clear the typing indicator
 * and return the containers to render into, plus the widen step.
 *
 * @param {HTMLElement} body the message's `.assistant-body`
 * @returns {{root: HTMLElement, main: HTMLElement, widen: () => void}}
 */
function mountInMessage(body) {
  body.replaceChildren();

  // .rs-shell exists only to be the container the size queries resolve
   // against: an element cannot query its own container, and .rs-root is the
   // element the one-screen layout has to give a height to.
  const shell = fromHTML(`
    <div class="rs-shell">
      <div class="rs-root">
        <div class="rs-main"></div>
      </div>
    </div>
  `);
  body.appendChild(shell);
  const root = shell.querySelector('.rs-root');

  return {
    root,
    main: root.querySelector('.rs-main'),

    /**
     * Widen the thread column for the dashboard.
     *
     * Deferred until there is something wide to hold: while retrieval is still
     * running the message is just a status update and belongs at the normal
     * measure. Ordinary messages are re-centred at 760px inside the wider
     * column, so nothing already on screen moves — see `.thread-inner.has-wide`
     * in the host page.
     */
    widen() {
      body.closest('.msg')?.classList.add('msg-wide');
      document.getElementById('threadInner')?.classList.add('has-wide');
    },
  };
}

/**
 * Keep the dashboard in view.
 *
 * While it is assembling, following the bottom of the thread is right — the
 * message is growing. Once it is finished the dashboard is a fixed-height
 * panel meant to be read whole, so the thread scrolls its TOP edge to the top
 * of the viewport instead; anchoring the bottom would push the account header
 * off the screen, which is the one thing a one-screen layout must not do.
 *
 * @param {HTMLElement} el
 * @param {{align?: 'bottom'|'top'}} [opts]
 */
function keepInView(el, opts = {}) {
  const thread = document.getElementById('chatThread') || el.closest('.chat-thread');
  if (!thread) return;
  const behavior = prefersReducedMotion() ? 'auto' : 'smooth';

  if (opts.align !== 'top') {
    thread.scrollTo({ top: thread.scrollHeight, behavior });
    return;
  }

  const msg = el.closest('.msg') || el;
  const delta = msg.getBoundingClientRect().top - thread.getBoundingClientRect().top;
  thread.scrollTo({ top: Math.max(0, thread.scrollTop + delta - 14), behavior });
}

/**
 * The line above a dashboard saying which account it is for, and why.
 *
 * It exists because the heading alone is not an answer. A user who asked about
 * one organisation and then supplied a CTN needs to see, in one sentence, that
 * those are two different things — and a user whose name we resolved needs to
 * see what we resolved it to before reading a single figure.
 *
 * @param {string} ctn
 * @param {{resumed?: boolean, originalPrompt?: string, matchedName?: string|null, matchedAlias?: string|null}} meta
 */
function provenanceLine(ctn, meta) {
  const account = accountForCtn(ctn);
  const label = account ? `${esc(account.name)} · CTN ${esc(ctn)}` : `CTN ${esc(ctn)}`;

  if (meta.resumed && meta.originalPrompt) {
    return fromHTML(
      `<p class="rs-resumed">Resumed from “${esc(meta.originalPrompt)}” — showing ${label}.</p>`,
    );
  }

  // Only worth saying when the user typed something other than the full name.
  const alias = meta.matchedAlias;
  if (meta.matchedName && alias && alias.length < meta.matchedName.length) {
    return fromHTML(
      `<p class="rs-resumed">Matched “${esc(alias)}” to ${label}.</p>`,
    );
  }

  return null;
}

/**
 * Size the dashboard to the thread it is in.
 *
 * The stylesheet can only estimate — `calc(100vh - 214px)` guesses the topbar,
 * the composer and the thread's padding — and an estimate that is eight pixels
 * optimistic is the difference between one screen and a scrollbar. Here we can
 * simply measure the element the dashboard has to fit inside.
 *
 * @param {HTMLElement} root the .rs-root
 */
function fitToThread(root) {
  const thread = document.getElementById('chatThread') || root.closest('.chat-thread');
  if (!thread || !thread.clientHeight) return;

  // Only measure a thread that is actually a scroll viewport. When it is not —
  // a host that lets the page scroll instead, or a full-page screenshot pass
  // that unclips it — its height is the height of its content, which would
  // hand the dashboard a nonsense figure. The stylesheet's estimate stands.
  const overflow = getComputedStyle(thread).overflowY;
  if (overflow !== 'auto' && overflow !== 'scroll') return;

  // 28px covers the gap above the message and the thread's own bottom padding.
  const available = Math.max(420, Math.min(1000, thread.clientHeight - 28));
  root.style.setProperty('--rs-fit-h', `${Math.round(available)}px`);
}

let fitBound = false;

/** Re-measure every live dashboard when the window changes shape. */
function bindFitToThread() {
  if (fitBound || typeof window === 'undefined') return;
  fitBound = true;
  let frame = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      for (const root of document.querySelectorAll('.rs-root[data-fit="on"]')) {
        fitToThread(/** @type {HTMLElement} */ (root));
      }
      resizeAll();
    });
  });
}

/* ───────────────────────── assembly sequence ───────────────────────── */

/**
 * The dashboard reveal, top to bottom: header → KPI cards → the paired rows →
 * the project cards.
 */
async function runAssemblySequence(elements) {
  const byBlock = (name) => elements.find((e) => e.dataset?.block === name);

  const header = byBlock('account-header');
  if (header) await enter(header, { duration: DUR.base, y: 8 }).finished;

  const kpis = byBlock('kpi-rail');
  if (kpis) {
    await pause(0.04);
    kpiRail.animateIn(kpis);
  }

  // The paired rows reveal left to right.
  const charts = [
    byBlock('operations'), byBlock('relationship'),
    byBlock('transactions'), byBlock('billing-revenue'),
  ].filter(Boolean);
  if (charts.length) {
    await pause(0.08);
    animate(
      charts,
      { opacity: [0, 1], transform: ['translateX(-10px)', 'translateX(0px)'] },
      { duration: DUR.slow, delay: stagger(0.08) },
    );
  }

  const tail = [byBlock('projects')].filter(Boolean);
  if (tail.length) {
    await pause(0.08);
    animate(tail, { opacity: [0, 1], transform: ['translateY(10px)', 'translateY(0px)'] },
      { duration: DUR.slow, delay: stagger(0.06) });
  }

  const projects = byBlock('projects');
  if (projects) projectTiles.animateIn(projects);

  resizeAll();
}

/* ───────────────────────── the run ───────────────────────── */

/**
 * Retrieve and render a snapshot. Only ever called once a CTN has been
 * validated — the repository is not touched before that point.
 *
 * @param {string} ctn
 * @param {import('./schemas.js').WorkflowDecision} decision
 * @param {{resumed?: boolean, originalPrompt?: string, matchedName?: string|null,
 *   matchedAlias?: string|null, body?: HTMLElement}} meta
 *   `body` is the `.assistant-body` to render into. Omit it and the snapshot is
 *   appended to the thread as a new message — the path used by `run()` from the
 *   console and by the smoke tests.
 * @returns {Promise<import('./schemas.js').RelationshipSnapshot|null>}
 */
async function run(ctn, decision, meta = {}) {
  if (running) return null;
  running = true;

  const body = meta.body || standaloneMessageBody();
  if (!body) {
    running = false;
    return null;
  }

  disposeAll();
  const { root, main: host, widen } = mountInMessage(body);

  const provenance = provenanceLine(ctn, meta);
  if (provenance) host.appendChild(provenance);

  // 1. Assembly wheel — shown only while retrieval is genuinely in flight.
  const wheel = createAssemblyWheel();
  host.appendChild(wheel.el);
  enter(wheel.el, { duration: DUR.base });
  keepInView(root);

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

  // Retrieval succeeded, so there is now a dashboard to make room for.
  widen();
  await pause(0.15);

  // The template is sized to the thread, so the whole dashboard is on screen.
  root.dataset.fit = 'on';
  fitToThread(root);
  bindFitToThread();

  // 3. Render the fixed template. Same five blocks, same order, every time.
  const stage = document.createElement('div');
  stage.className = 'rs-blocks';
  const { elements } = renderBlocks(snapshot, stage, {
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

  await runAssemblySequence(elements);

  keepInView(root, { align: 'top' });
  running = false;
  return snapshot;
}

/**
 * Append a bare assistant message to the thread and return its body. Used when
 * `run()` is called outside the chat flow — from the console, or from a test.
 */
function standaloneMessageBody() {
  const thread = document.getElementById('threadInner');
  if (!thread) return null;
  thread.style.display = '';
  const msg = fromHTML(
    '<div class="msg assistant"><div class="assistant-row">'
    + '<div class="av">C</div><div class="assistant-body"></div></div></div>',
  );
  thread.appendChild(msg);
  return msg.querySelector('.assistant-body');
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

  // A workflow waiting for an account is answered by a CTN or by a name — "CTN
  // 101" and "HSBC" are both complete answers to the question it asked.
  const answersPending = pendingWorkflow
    && (extractCtn(text) || lookupAccount(text));

  // An account name on its own is enough EXCEPT where the host already has a
  // prepared answer about that firm. "How are we charging BlackRock?" is the
  // module's own question and it answers it well; "how is billing looking for
  // HSBC this year?" is nobody's, and it is exactly what this feature is for.
  //
  // The host publishes the test (window.cannedKey). Where it does not — some
  // other page embedding this feature — a name alone is not taken, because
  // there is no way to know what would be trampled.
  const hostAnswersThis = typeof window.cannedKey !== 'function'
    || Boolean(window.cannedKey(text));
  const namesAnAccount = Boolean(lookupAccount(text));

  const claimsTurn = local.workflow === 'relationship_snapshot'
    || (namesAnAccount && !hostAnswersThis)
    || answersPending;

  if (!claimsTurn) return false;

  // Own the turn, then refine the decision with the server classifier.
  handleAsync(text, assistantNode, { byName: Boolean(namesAnAccount && !hostAnswersThis) });
  return true;
}

/**
 * @param {string} text
 * @param {HTMLElement} [assistantNode]
 * @param {{byName?: boolean}} [claim] why the turn was claimed. A prompt taken
 *   because it names an account is a snapshot request even though the phrasing
 *   alone would not have said so — without this the fallback classifier would
 *   answer "other" and the message would be dropped on the floor.
 */
async function handleAsync(text, assistantNode, claim = {}) {
  const body = assistantNode?.querySelector?.('.assistant-body');

  const local = classifyLocally(text);

  // Identify the account before classifying, so the model can shape the view
  // for it. Identification is a regex and a table lookup — it retrieves
  // nothing, and the gate below still decides whether anything may be fetched.
  const identified = extractCtn(text) || lookupAccount(text)?.ctn || null;
  const account = accountForCtn(identified);

  const { decision: remote, source, error } = await classifyWorkflow(text, { account });
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
    workflow: (local.workflow === 'relationship_snapshot' || pendingWorkflow || claim.byName)
      ? 'relationship_snapshot'
      : remote.workflow,
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
    // No data retrieval has happened, and none will until an account is named.
    pendingWorkflow = outcome.pending;
    if (body) {
      body.replaceChildren();
      body.appendChild(clarificationCard(
        (ctn) => submitCtn(ctn),
        { entity: outcome.pending.entity },
      ));
    }
    return;
  }

  // action === 'run' — the dashboard replaces this message's typing indicator
  // and assembles in place.
  pendingWorkflow = null;

  const snapshot = await run(outcome.ctn, outcome.decision, {
    body,
    resumed: outcome.resumed,
    originalPrompt: outcome.originalPrompt,
    matchedName: outcome.matchedName,
    matchedAlias: outcome.matchedAlias,
  });

  if (!snapshot && body) {
    body.replaceChildren();
    body.appendChild(errorState('The snapshot could not be assembled.'));
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
  extractCtn,
  get pending() { return pendingWorkflow; },
  /** Test/debug hook: clear conversation state and remove rendered dashboards. */
  reset() {
    pendingWorkflow = null;
    running = false;
    disposeAll();
    for (const root of document.querySelectorAll('.rs-root')) {
      root.closest('.msg')?.remove();
    }
    document.getElementById('threadInner')?.classList.remove('has-wide');
    document.querySelectorAll('.rs-root[data-fit]').forEach((r) => { delete r.dataset.fit; });
  },
};

if (typeof window !== 'undefined') {
  window.RelationshipSnapshot = api;
}

export default api;
export { tryHandle, run };

/**
 * Projects in progress — one fixed card per initiative, side by side.
 *
 * Grouped by initiative rather than listed as raw Jira issues, and every card
 * shows the same five facts in the same places so two accounts can be compared
 * at a glance. Nothing expands: what a card has to say, it says.
 *
 * A blocker line appears ONLY when the source data explicitly records one; the
 * component never infers "blocked" from dates, ticket counts or status age.
 */

import { esc, formatDate, formatRelative, formatCount, humanise } from '../format.js';
import { fromHTML, section, body } from './dom.js';
import { unavailableBlock, emptyState } from './states.js';
import { animate, stagger, DUR } from '../motion/motion.js';

function statusTone(status) {
  if (status === 'blocked') return 'severe';
  if (status === 'complete') return 'live';
  if (status === 'not_started') return 'neutral';
  return 'progress';
}

/**
 * @param {import('../schemas.js').RelationshipSnapshot} snapshot
 */
export function render(snapshot) {
  const projects = snapshot.projects;
  const jira = snapshot.sources.find((s) => s.id === 'jira');
  const blocked = projects.filter((p) => p.status === 'blocked').length;

  const summary = jira?.state === 'unavailable'
    ? '<span class="rs-sum-none">Jira unavailable</span>'
    : `<span class="rs-sum-fig">${esc(formatCount(projects.length))} in progress</span>`
      + (blocked
        ? ` <span class="rs-sum-delta rs-tone-down">${esc(formatCount(blocked))} blocked</span>`
        : '');

  const sec = section('projects', 'Projects in progress', {
    subtitle: 'Jira (simulated)',
    summary,
  });
  const host = body(sec);

  if (jira?.state === 'unavailable') {
    host.appendChild(unavailableBlock('Jira', jira.note));
    return sec;
  }

  if (!projects.length) {
    host.appendChild(emptyState('No account-linked delivery projects are recorded for this period.'));
    return sec;
  }

  const row = fromHTML('<div class="rs-projects"></div>');
  for (const project of projects) row.appendChild(card(project, snapshot));
  host.appendChild(row);

  return sec;
}

/** One project. Same shape every time, whatever the account. */
function card(p, snapshot) {
  return fromHTML(`
    <article class="rs-project" data-project="${esc(p.id)}" data-status="${esc(p.status)}">
      <header class="rs-project-head">
        <div class="rs-project-title-row">
          <span class="rs-project-name">${esc(p.name)}</span>
          <span class="rs-pill rs-pill-${statusTone(p.status)}">${esc(humanise(p.status))}</span>
        </div>
        <div class="rs-project-meta">
          <span>${esc(p.owner)}</span>
          <span class="rs-dot-sep" aria-hidden="true"></span>
          <span>${esc(formatCount(p.openItems))} open items</span>
          <span class="rs-dot-sep" aria-hidden="true"></span>
          <span>updated ${esc(formatRelative(p.lastUpdate))}</span>
        </div>
      </header>

      <dl class="rs-project-facts">
        <div>
          <dt>Current milestone</dt>
          <dd>${esc(p.currentMilestone)}</dd>
        </div>
        <div>
          <dt>Next milestone</dt>
          <dd>${
            p.nextMilestone
              ? `${esc(p.nextMilestone.name)} · ${esc(formatDate(p.nextMilestone.date))}`
              : 'None scheduled'
          }</dd>
        </div>
      </dl>

      ${p.blocker ? `
        <p class="rs-project-blocker">
          <span class="rs-state-dot" aria-hidden="true"></span>
          ${esc(p.blocker)}
        </p>` : ''}
    </article>
  `);
}

/** Staggered entrance for the cards. */
export function animateIn(sec) {
  const cards = sec.querySelectorAll('.rs-project');
  if (!cards.length) return { finished: Promise.resolve() };
  return animate(
    cards,
    { opacity: [0, 1], transform: ['translateY(10px)', 'translateY(0px)'] },
    { duration: DUR.base, delay: stagger(0.04) },
  );
}

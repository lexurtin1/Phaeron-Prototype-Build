/**
 * ProjectTiles — expandable tiles grouped by initiative, not raw issue lists.
 *
 * A blocker line appears ONLY when the source data explicitly records one; the
 * component never infers "blocked" from dates, ticket counts or status age.
 */

import { esc, formatDate, formatRelative, formatCount, humanise } from '../format.js';
import { fromHTML, section, body } from './dom.js';
import { unavailableBlock, emptyState } from './states.js';
import { flip, enter, animate, stagger, DUR } from '../motion/motion.js';
import { shouldRender as shouldRenderTimeline, mount as mountTimeline } from '../charts/project-timeline.js';
import { resizeAll } from '../charts/mount.js';

function statusTone(status) {
  if (status === 'blocked') return 'severe';
  if (status === 'complete') return 'live';
  if (status === 'not_started') return 'neutral';
  return 'progress';
}

/**
 * @param {import('../schemas.js').RelationshipSnapshot} snapshot
 */
export function render(snapshot, opts = {}) {
  const projects = snapshot.projects;
  const jiraState = snapshot.sources.find((s) => s.id === 'jira')?.state;
  const blocked = projects.filter((p) => p.status === 'blocked').length;
  const summary = jiraState === 'unavailable'
    ? '<span class="rs-sum-none">Jira unavailable</span>'
    : `<span class="rs-sum-fig">${esc(formatCount(projects.length))} in progress</span>`
      + (blocked
        ? ` <span class="rs-sum-delta rs-tone-down">${esc(formatCount(blocked))} blocked</span>`
        : '');

  const sec = section('projects', 'Projects in progress', {
    subtitle: 'Jira (simulated)',
    summary,
    open: opts.open === true,
  });
  const host = body(sec);

  const jira = snapshot.sources.find((s) => s.id === 'jira');
  if (jira?.state === 'unavailable') {
    host.appendChild(unavailableBlock('Jira', jira.note));
    return sec;
  }

  if (!projects.length) {
    host.appendChild(emptyState('No account-linked delivery projects are recorded for this period.'));
    return sec;
  }

  // Optional timeline — only when more than one active project has usable dates.
  let timelineEl = null;
  if (shouldRenderTimeline(projects)) {
    timelineEl = fromHTML(`
      <div class="rs-chart-card rs-timeline-card">
        <h3 class="rs-chart-title">Project timeline</h3>
        <div class="rs-chart" data-chart="timeline" style="--rs-chart-h:${Math.max(140, projects.length * 46)}px"></div>
      </div>`);
    host.appendChild(timelineEl);
  }

  const grid = fromHTML('<div class="rs-projects"></div>');
  for (const p of projects) grid.appendChild(tile(p, snapshot));
  host.appendChild(grid);

  sec.__mount = () => {
    if (timelineEl) mountTimeline(timelineEl.querySelector('[data-chart="timeline"]'), projects);
  };

  return sec;
}

function tile(p, snapshot) {
  const node = fromHTML(`
    <article class="rs-project" data-project="${esc(p.id)}" data-expanded="false" data-status="${esc(p.status)}">
      <button type="button" class="rs-project-head" aria-expanded="false" aria-controls="rs-proj-${esc(p.id)}">
        <div class="rs-project-title-row">
          <span class="rs-project-name">${esc(p.name)}</span>
          <span class="rs-pill rs-pill-${statusTone(p.status)}">${esc(humanise(p.status))}</span>
        </div>
        <div class="rs-project-meta">
          <span>${esc(snapshot.ctnLabel)}</span>
          <span class="rs-dot-sep" aria-hidden="true"></span>
          <span>${esc(p.owner)}</span>
          <span class="rs-dot-sep" aria-hidden="true"></span>
          <span>${esc(p.team)}</span>
        </div>
        <dl class="rs-project-facts">
          <div><dt>Current milestone</dt><dd>${esc(p.currentMilestone)}</dd></div>
          <div><dt>Next milestone</dt><dd>${
            p.nextMilestone
              ? `${esc(p.nextMilestone.name)} · ${esc(formatDate(p.nextMilestone.date))}`
              : 'None scheduled'
          }</dd></div>
          <div><dt>Open linked items</dt><dd>${esc(formatCount(p.openItems))}</dd></div>
          <div><dt>Last update</dt><dd>${esc(formatRelative(p.lastUpdate))}</dd></div>
        </dl>
        ${p.blocker ? `
          <p class="rs-project-blocker">
            <span class="rs-state-dot" aria-hidden="true"></span>
            ${esc(p.blocker)}
          </p>` : ''}
        <span class="rs-kpi-chevron" aria-hidden="true"></span>
      </button>
      <div class="rs-project-panel" id="rs-proj-${esc(p.id)}" hidden></div>
    </article>
  `);

  const head = node.querySelector('.rs-project-head');
  head.addEventListener('click', () => toggle(node, p));
  return node;
}

function toggle(node, p) {
  const panel = node.querySelector('.rs-project-panel');
  const head = node.querySelector('.rs-project-head');
  const isOpen = node.dataset.expanded === 'true';

  // FLIP siblings so expanding a tile does not jump the page.
  const siblings = [...(node.parentElement?.children || [])];

  flip(siblings, () => {
    if (isOpen) {
      panel.hidden = true;
      node.dataset.expanded = 'false';
      head.setAttribute('aria-expanded', 'false');
      return;
    }
    if (!panel.firstChild) panel.appendChild(itemsTable(p));
    panel.hidden = false;
    node.dataset.expanded = 'true';
    head.setAttribute('aria-expanded', 'true');
  }).finished.then(() => {
    if (!isOpen) enter(panel, { duration: DUR.base, y: 6 });
    resizeAll();
  });
}

function itemsTable(p) {
  if (!p.items.length) {
    return emptyState('No linked Jira items are recorded for this project.');
  }
  return fromHTML(`
    <div class="rs-project-panel-inner">
      <h4 class="rs-panel-sub">Linked Jira items</h4>
      <div class="rs-table-scroll">
        <table class="rs-table rs-table-compact">
          <thead>
            <tr>
              <th scope="col">Key</th><th scope="col">Title</th>
              <th scope="col">Status</th><th scope="col">Assignee</th>
              <th scope="col">Latest update</th>
            </tr>
          </thead>
          <tbody>
            ${p.items.map((i) => `
              <tr>
                <th scope="row" class="rs-mono">${esc(i.key)}</th>
                <td>${esc(i.title)}</td>
                <td>${esc(i.status)}</td>
                <td>${esc(i.assignee)}</td>
                <td>${esc(formatRelative(i.lastUpdate))}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `);
}

/** Staggered entrance for the tiles. */
export function animateIn(sec) {
  const tiles = sec.querySelectorAll('.rs-project');
  if (!tiles.length) return { finished: Promise.resolve() };
  return animate(
    tiles,
    { opacity: [0, 1], transform: ['translateY(10px)', 'translateY(0px)'] },
    { duration: DUR.base, delay: stagger(0.04) },
  );
}

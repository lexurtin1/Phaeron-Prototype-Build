/**
 * Relationship and ownership card.
 *
 * A calm two-column layout, not a dense CRM record: who owns the relationship,
 * who supports it, who the client contacts are, and when contact last happened.
 * Avatars are generated initials placeholders — no photographs, no real people.
 */

import { esc, initials, formatDate, formatRelative } from '../format.js';
import { fromHTML, section, body, avatar } from './dom.js';
import { unavailableBlock } from './states.js';

/**
 * @param {import('../schemas.js').RelationshipSnapshot} snapshot
 */
export function render(snapshot, opts = {}) {
  const r = snapshot.relationship;
  const summary = r.available
    ? `<span class="rs-sum-fig">${esc(r.manager?.name || '—')}</span>`
      + ` <span class="rs-sum-delta rs-tone-flat">${esc(String(r.contacts?.length ?? 0))} client contacts</span>`
    : '<span class="rs-sum-none">Salesforce unavailable</span>';

  const sec = section('relationship', 'Relationship and ownership', {
    subtitle: 'Salesforce (simulated)',
    summary,
    open: opts.open === true,
  });
  const host = body(sec);

  if (!r.available) {
    const src = snapshot.sources.find((s) => s.id === 'salesforce');
    host.appendChild(unavailableBlock('Salesforce', src?.note));
    return sec;
  }

  host.appendChild(fromHTML(`
    <div class="rs-rel-grid">

      <div class="rs-rel-col">
        <h3 class="rs-rel-heading">Primary relationship manager</h3>
        <div class="rs-rel-person rs-rel-person-lead">
          ${avatar(r.manager.name, initials(r.manager.name), { size: 44 })}
          <div>
            <div class="rs-rel-name">${esc(r.manager.name)}</div>
            <div class="rs-rel-role">${esc(r.manager.title || '—')}</div>
            <div class="rs-rel-sub">${esc(r.manager.region || '—')}</div>
          </div>
        </div>

        <h3 class="rs-rel-heading">Supporting account team</h3>
        <ul class="rs-rel-team">
          ${r.team.map((m) => `
            <li class="rs-rel-person">
              ${avatar(m.name, initials(m.name), { size: 30 })}
              <div>
                <div class="rs-rel-name rs-rel-name-sm">${esc(m.name)}</div>
                <div class="rs-rel-sub">${esc(m.role || m.title || '—')}</div>
              </div>
            </li>`).join('')}
        </ul>
      </div>

      <div class="rs-rel-col">
        <h3 class="rs-rel-heading">Key client contacts</h3>
        <table class="rs-rel-table">
          <thead>
            <tr><th scope="col">Name</th><th scope="col">Role</th><th scope="col">Last engagement</th></tr>
          </thead>
          <tbody>
            ${r.contacts.map((c) => `
              <tr>
                <th scope="row">
                  <div class="rs-rel-name rs-rel-name-sm">${esc(c.name)}</div>
                  <div class="rs-rel-sub">${esc(c.organisation)}</div>
                </th>
                <td>${esc(c.role)}</td>
                <td>
                  <div>${esc(formatDate(c.lastEngagement))}</div>
                  <div class="rs-rel-sub">${esc(formatRelative(c.lastEngagement))}</div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>

        <div class="rs-rel-facts">
          ${r.lastMeeting ? `
            <div class="rs-rel-fact">
              <div class="rs-cell-label">Most recent contact</div>
              <div class="rs-cell-value">${esc(formatDate(r.lastMeeting.date))} · ${esc(r.lastMeeting.type)}</div>
              <div class="rs-rel-sub rs-mono">${esc(r.lastMeeting.reference)}</div>
            </div>` : ''}

          ${r.openActions ? `
            <div class="rs-rel-fact">
              <div class="rs-cell-label">Open actions</div>
              <div class="rs-cell-value">${esc(r.openActions.total)}</div>
              <div class="rs-rel-sub">${
                r.openActions.total === 0
                  ? 'None recorded'
                  : esc(r.openActions.byOwner.map((o) => `${o.count} ${o.owner}`).join(' · '))
              }</div>
            </div>` : ''}
        </div>
      </div>

    </div>
  `));

  return sec;
}

/**
 * Relationship and ownership — who owns this account and who was last spoken to.
 *
 * A compact card, not a CRM record: the relationship manager, the supporting
 * team as initials, and the client contacts with the date each was last
 * engaged. Avatars are generated initials — no photographs, and every person
 * here is invented.
 */

import { esc, initials, formatDate, formatRelative } from '../format.js';
import { fromHTML, section, body, avatar } from './dom.js';
import { unavailableBlock } from './states.js';

/**
 * @param {import('../schemas.js').RelationshipSnapshot} snapshot
 */
export function render(snapshot) {
  const r = snapshot.relationship;
  const src = snapshot.sources.find((s) => s.id === 'salesforce');

  const summary = r.available
    ? `<span class="rs-sum-fig">${esc(r.manager?.name || '—')}</span>`
      + ` <span class="rs-sum-delta rs-tone-flat">${esc(String(r.contacts?.length ?? 0))} contacts</span>`
    : '<span class="rs-sum-none">Salesforce unavailable</span>';

  const sec = section('relationship', 'Relationship and ownership', {
    subtitle: 'Salesforce (simulated)',
    summary,
  });
  const host = body(sec);

  if (!r.available) {
    host.appendChild(unavailableBlock('Salesforce', src?.note));
    return sec;
  }

  host.appendChild(fromHTML(`
    <div class="rs-rel">
      <div class="rs-rel-lead">
        ${avatar(r.manager?.name || '—', initials(r.manager?.name || '—'), { size: 34 })}
        <div class="rs-rel-lead-text">
          <div class="rs-rel-name">${esc(r.manager?.name || '—')}</div>
          <div class="rs-rel-sub">${esc(r.manager?.title || '—')} · ${esc(r.manager?.region || '—')}</div>
        </div>
        ${r.team.length ? `
          <div class="rs-rel-team" title="${esc(r.team.map((m) => `${m.name} — ${m.role || m.title || ''}`).join(', '))}">
            ${r.team.slice(0, 4).map((m) => avatar(m.name, initials(m.name), { size: 26 })).join('')}
            <span class="rs-rel-team-label">+${esc(String(r.team.length))} supporting</span>
          </div>` : ''}
      </div>

      <ul class="rs-rel-contacts">
        ${r.contacts.map((c) => `
          <li>
            <span class="rs-rel-contact-name">${esc(c.name)}</span>
            <span class="rs-rel-contact-role">${esc(c.role)}</span>
            <span class="rs-rel-contact-when" title="${esc(formatDate(c.lastEngagement))}">${esc(formatRelative(c.lastEngagement))}</span>
          </li>`).join('')}
      </ul>

    </div>
  `));

  return sec;
}

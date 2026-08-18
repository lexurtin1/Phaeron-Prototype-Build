/**
 * Small DOM helpers shared by the snapshot components.
 *
 * Deliberately tiny — the rest of Pulse builds DOM with template strings and
 * innerHTML, and this feature follows that convention rather than importing a
 * view layer. Everything user- or data-derived goes through `esc()` first.
 */

import { esc } from '../format.js';

/**
 * Create an element from an HTML string.
 * @param {string} html
 * @returns {HTMLElement}
 */
export function fromHTML(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return /** @type {HTMLElement} */ (tpl.content.firstElementChild);
}

/**
 * Create an element.
 * @param {string} tag
 * @param {string} [className]
 * @param {string} [html]
 */
export function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html != null) node.innerHTML = html;
  return node;
}

/** A section wrapper with a consistent heading treatment. */
export function section(id, title, { subtitle = '', actions = '' } = {}) {
  return fromHTML(`
    <section class="rs-section" data-block="${esc(id)}">
      <header class="rs-section-head">
        <div>
          <h2 class="rs-section-title">${esc(title)}</h2>
          ${subtitle ? `<p class="rs-section-sub">${esc(subtitle)}</p>` : ''}
        </div>
        ${actions ? `<div class="rs-section-actions">${actions}</div>` : ''}
      </header>
      <div class="rs-section-body"></div>
    </section>
  `);
}

/** Append children into a `section()`'s body. */
export function body(sectionEl) {
  return sectionEl.querySelector('.rs-section-body');
}

/** A labelled key/value cell. */
export function cell(label, value, { mono = false } = {}) {
  return `
    <div class="rs-cell">
      <div class="rs-cell-label">${esc(label)}</div>
      <div class="rs-cell-value${mono ? ' rs-mono' : ''}">${esc(value)}</div>
    </div>`;
}

/** Circular initials avatar placeholder. No real photographs are used. */
export function avatar(name, initialsText, { size = 32 } = {}) {
  return `<span class="rs-avatar" style="width:${size}px;height:${size}px"
    role="img" aria-label="${esc(name)}">${esc(initialsText)}</span>`;
}

/**
 * A disclosure: a labelled toggle over content that starts open or folded.
 *
 * Used wherever a tile holds something long — a ticket table, evidence cards —
 * that must stay reachable but must not be allowed to set the tile's height.
 *
 * @param {string} label
 * @param {Element} content
 * @param {{open?: boolean, id?: string}} [opts]
 */
export function drawer(label, content, opts = {}) {
  const open = opts.open !== false;
  const id = opts.id || `rs-drawer-${Math.random().toString(36).slice(2, 9)}`;

  const node = fromHTML(`
    <div class="rs-drawer">
      <button type="button" class="rs-drawer-toggle" aria-expanded="${open}" aria-controls="${esc(id)}">
        <span class="rs-drawer-label">${esc(label)}</span>
        <span class="rs-kpi-chevron" aria-hidden="true"></span>
      </button>
      <div class="rs-drawer-body" id="${esc(id)}"${open ? '' : ' hidden'}></div>
    </div>`);

  const drawerBody = node.querySelector('.rs-drawer-body');
  drawerBody.appendChild(content);

  node.querySelector('.rs-drawer-toggle').addEventListener('click', (event) => {
    const toggle = event.currentTarget;
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    drawerBody.hidden = isOpen;
  });

  return node;
}

/** A status pill. `tone` is one of: neutral, live, attention, severe. */
export function pill(text, tone = 'neutral') {
  return `<span class="rs-pill rs-pill-${esc(tone)}">${esc(text)}</span>`;
}

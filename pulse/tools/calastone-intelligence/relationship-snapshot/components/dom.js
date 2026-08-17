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

/** A status pill. `tone` is one of: neutral, live, attention, severe. */
export function pill(text, tone = 'neutral') {
  return `<span class="rs-pill rs-pill-${esc(tone)}">${esc(text)}</span>`;
}

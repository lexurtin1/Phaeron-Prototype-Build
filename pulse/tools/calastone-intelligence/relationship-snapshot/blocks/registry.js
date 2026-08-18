/**
 * Block registry.
 *
 * The security boundary between the model and the DOM. Claude may propose an
 * ORDER of blocks; it can never define one. A block id that is not a key of
 * `BLOCKS` is dropped silently and logged — it is never rendered, and never
 * interpreted as markup.
 *
 * React/vanilla components own all layout, card design, charts, CSS and motion.
 */

import { BLOCK_IDS, DEFAULT_BLOCK_ORDER, FOCUS_ORDERS } from '../config.js';
import * as accountHeader from '../components/account-header.js';
import * as kpiRail from '../components/kpi-rail.js';
import * as relationshipCard from '../components/relationship-card.js';
import * as operationsPanel from '../components/operations-panel.js';
import * as projectTiles from '../components/project-tiles.js';
import { renderBillingSection, renderTransactionsSection } from './chart-sections.js';

/**
 * The allow-list. Each entry renders one block and returns an Element.
 * @type {Record<string, (snapshot: any, ctx: any) => Element>}
 */
export const BLOCKS = Object.freeze({
  'account-header': (snapshot, ctx) => accountHeader.render(snapshot, { title: ctx?.title }),
  'kpi-rail': (snapshot) => kpiRail.render(snapshot),
  relationship: (snapshot) => relationshipCard.render(snapshot),
  'billing-revenue': (snapshot, ctx) => renderBillingSection(snapshot, ctx),
  transactions: (snapshot, ctx) => renderTransactionsSection(snapshot, ctx),
  operations: (snapshot, ctx) => operationsPanel.render(snapshot, { fit: ctx?.fit }),
  projects: (snapshot) => projectTiles.render(snapshot),
});

/** Ids that are actually renderable — the registry is the source of truth. */
export const ALLOWED_BLOCK_IDS = Object.freeze(Object.keys(BLOCKS));

/**
 * Reduce an arbitrary, possibly model-supplied ordering to a safe one.
 *
 * Rules:
 *   · unknown ids are dropped
 *   · duplicates are collapsed to their first occurrence
 *   · any allow-listed block the caller omitted is appended in default order,
 *     so a partial ordering can never silently hide a section of the dashboard
 *
 * @param {string[]|null|undefined} requested
 * @param {{focus?: string|null}} [opts]
 * @returns {string[]}
 */
export function resolveOrder(requested, opts = {}) {
  const base = opts.focus && FOCUS_ORDERS[opts.focus]
    ? FOCUS_ORDERS[opts.focus]
    : DEFAULT_BLOCK_ORDER;

  const seen = new Set();
  const order = [];

  for (const id of Array.isArray(requested) ? requested : []) {
    if (!ALLOWED_BLOCK_IDS.includes(id)) continue; // dropped: not allow-listed
    if (seen.has(id)) continue;                    // dropped: duplicate
    seen.add(id);
    order.push(id);
  }

  for (const id of base) {
    if (!seen.has(id) && ALLOWED_BLOCK_IDS.includes(id)) {
      seen.add(id);
      order.push(id);
    }
  }

  return order;
}

/**
 * Render blocks into a host element, in order.
 *
 * @param {string[]} order
 * @param {import('../schemas.js').RelationshipSnapshot} snapshot
 * @param {HTMLElement} host
 * @param {{title?: string|null, period?: string, fit?: boolean}} [ctx]
 * @returns {{elements: Element[], dropped: string[]}}
 */
export function renderBlocks(order, snapshot, host, ctx = {}) {
  const elements = [];
  const dropped = [];

  for (const id of order) {
    const build = BLOCKS[id];
    if (!build) {
      dropped.push(id);
      continue;
    }
    const node = build(snapshot, ctx);
    if (!node) continue;
    host.appendChild(node);
    elements.push(node);
  }

  if (dropped.length) {
    console.warn('[relationship-snapshot] dropped non-allow-listed block ids:', dropped);
  }

  // Blocks that need their charts mounted after being placed in the document.
  for (const node of elements) {
    if (typeof node.__mount === 'function') {
      requestAnimationFrame(() => node.__mount());
    }
  }

  return { elements, dropped };
}

export { BLOCK_IDS, DEFAULT_BLOCK_ORDER, FOCUS_ORDERS };

/**
 * Block registry.
 *
 * The security boundary between the model and the DOM. Claude cannot define a
 * block, cannot order them, and cannot add one: the dashboard is a fixed
 * template of seven blocks, rendered in the same order for every account. What
 * changes between one snapshot and the next is the data inside them.
 *
 * Components own all layout, card design, charts, CSS and motion.
 */

import { BLOCK_IDS, DEFAULT_BLOCK_ORDER } from '../config.js';
import * as accountHeader from '../components/account-header.js';
import * as kpiRail from '../components/kpi-rail.js';
import * as projectTiles from '../components/project-tiles.js';
import * as operationsPanel from '../components/operations-panel.js';
import * as relationshipCard from '../components/relationship-card.js';
import { renderBillingSection, renderTransactionsSection } from './chart-sections.js';

/**
 * The allow-list. Each entry renders one block and returns an Element.
 * @type {Record<string, (snapshot: any, ctx: any) => Element>}
 */
export const BLOCKS = Object.freeze({
  'account-header': (snapshot, ctx) => accountHeader.render(snapshot, { title: ctx?.title }),
  'kpi-rail': (snapshot) => kpiRail.render(snapshot),
  operations: (snapshot) => operationsPanel.render(snapshot),
  relationship: (snapshot) => relationshipCard.render(snapshot),
  transactions: (snapshot, ctx) => renderTransactionsSection(snapshot, ctx),
  'billing-revenue': (snapshot, ctx) => renderBillingSection(snapshot, ctx),
  projects: (snapshot) => projectTiles.render(snapshot),
});

/** Ids that are actually renderable — the registry is the source of truth. */
export const ALLOWED_BLOCK_IDS = Object.freeze(Object.keys(BLOCKS));

/**
 * Mount a block's charts, once. Charts are created after the block is in the
 * document, because ECharts sizes itself from the element it is given.
 *
 * @param {Element & {__mount?: () => void, __mounted?: boolean}} node
 */
export function mountBlock(node) {
  if (!node || node.__mounted || typeof node.__mount !== 'function') return;
  node.__mounted = true;
  node.__mount();
}

/**
 * Render the dashboard into a host element.
 *
 * The order is `DEFAULT_BLOCK_ORDER` and nothing else — there is no caller-
 * supplied ordering to validate, because there is no ordering to supply. An id
 * in the template with no renderer behind it is dropped and logged rather than
 * throwing, so a half-finished block can never take the dashboard down.
 *
 * @param {import('../schemas.js').RelationshipSnapshot} snapshot
 * @param {HTMLElement} host
 * @param {{title?: string|null, period?: string}} [ctx]
 * @returns {{elements: Element[], dropped: string[]}}
 */
export function renderBlocks(snapshot, host, ctx = {}) {
  const elements = [];
  const dropped = [];

  for (const id of DEFAULT_BLOCK_ORDER) {
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
    console.warn('[relationship-snapshot] template ids with no renderer:', dropped);
  }

  for (const node of elements) {
    requestAnimationFrame(() => mountBlock(node));
  }

  return { elements, dropped };
}

export { BLOCK_IDS, DEFAULT_BLOCK_ORDER };

/**
 * Relationship Snapshot — shared constants.
 *
 * SIMULATION ONLY. Every figure this feature renders originates in
 * data/mock-repo.js. No live Salesforce, billing, transaction or Jira system is
 * contacted at any point.
 */

/**
 * Fixed "as of" date for the whole simulation.
 *
 * A real connector would use `new Date()`. We pin it so that the dashboard is
 * genuinely deterministic — the same CTN renders identical figures today,
 * tomorrow and in six months, and the test suite does not rot when the calendar
 * turns over.
 */
export const AS_OF = '2026-08-17T09:00:00.000Z';

/** Month index (0-based) of the latest complete-or-current month in the sim. */
export const AS_OF_MONTH = 7; // August
export const AS_OF_YEAR = 2026;

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** The four simulated systems, in retrieval order. Drives the assembly wheel. */
export const SOURCE_DEFS = [
  { id: 'salesforce', name: 'Salesforce', stage: 1, label: 'Relationship profile' },
  { id: 'billing', name: 'Billing', stage: 2, label: 'Revenue and invoices' },
  { id: 'transactions', name: 'Transactions', stage: 2, label: 'Processed volumes' },
  { id: 'jira', name: 'Jira', stage: 3, label: 'Projects and tickets' },
];

/** Progress stages shown by the assembly wheel. Each maps to real retrieval work. */
export const ASSEMBLY_STAGES = [
  { at: 0.25, label: 'CTN confirmed' },
  { at: 0.50, label: 'Salesforce relationship profile loaded' },
  { at: 0.75, label: 'Billing and transaction data loaded' },
  { at: 1.00, label: 'Jira projects and operational ticket data loaded' },
];

/**
 * The dashboard, in order. This is a fixed template, not a menu.
 *
 * Every account renders these seven blocks in this order, every time. The rows
 * are: the company; its headline figures; operational activity beside who owns
 * the relationship; the two measures side by side; and the delivery projects.
 * Nothing collapses, nothing reorders, nothing hides — the only thing that
 * changes between one snapshot and the next is the data.
 *
 * Operational activity sits directly under the headline figures on purpose. A
 * spike in tickets is the thing on this dashboard most likely to need acting
 * on, and the bottom of a page is where that goes unnoticed.
 */
export const BLOCK_IDS = Object.freeze([
  'account-header',
  'kpi-rail',
  'operations',
  'relationship',
  'transactions',
  'billing-revenue',
  'projects',
]);

/** The template. Identical to BLOCK_IDS, and deliberately not configurable. */
export const DEFAULT_BLOCK_ORDER = BLOCK_IDS;

/**
 * The rows that hold two blocks. The first of each pair sits on the left.
 * Operations is given the wider share; the two measures split their row evenly.
 */
export const BLOCK_ROWS = Object.freeze([
  Object.freeze(['operations', 'relationship']),
  Object.freeze(['transactions', 'billing-revenue']),
]);

/** The two blocks that share a row at equal width. */
export const PAIRED_BLOCKS = BLOCK_ROWS[1];

/* Display focus and block ordering used to be Claude's to choose. They are not
   any more: the template above is fixed, so there is nothing for a focus to
   reorder and no ordering for the model to propose. What the model still
   decides is the reporting period and the title — see schemas.js. */

/** Allow-listed reporting periods. Each genuinely slices the month window. */
export const PERIOD_VALUES = Object.freeze(['ytd', 'last_6_months', 'last_3_months', 'current_month']);

export const PERIOD_LABELS = Object.freeze({
  ytd: 'Year to date',
  last_6_months: 'Last 6 months',
  last_3_months: 'Last 3 months',
  current_month: 'Current month',
});

/** How many months each period covers, counting back from AS_OF_MONTH. */
export const PERIOD_MONTHS = Object.freeze({
  ytd: AS_OF_MONTH + 1,
  last_6_months: 6,
  last_3_months: 3,
  current_month: 1,
});

/** Source states, in escalating order of attention. */
export const SOURCE_STATES = Object.freeze(['checking', 'live', 'delayed', 'unavailable']);

/** Project states. */
export const PROJECT_STATUSES = Object.freeze(['not_started', 'in_progress', 'blocked', 'complete']);

export const TICKET_SEVERITIES = Object.freeze(['critical', 'high', 'medium', 'low']);
export const TICKET_STATUSES = Object.freeze(['open', 'in_progress', 'awaiting_client', 'resolved']);

/** Mock currency for billing. Stated explicitly wherever a figure is shown. */
export const CURRENCY = 'GBP';

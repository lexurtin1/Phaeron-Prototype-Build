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

/** Allow-listed block ids. The registry renders nothing outside this list. */
export const BLOCK_IDS = Object.freeze([
  'account-header',
  'kpi-rail',
  'relationship',
  'billing-revenue',
  'transactions',
  'operations',
  'projects',
]);

/** Default top-to-bottom block order. */
export const DEFAULT_BLOCK_ORDER = Object.freeze([
  'account-header',
  'kpi-rail',
  'relationship',
  'billing-revenue',
  'transactions',
  'operations',
  'projects',
]);

/** Allow-listed display-focus values Claude may request. */
export const FOCUS_VALUES = Object.freeze([
  'relationship', 'billing', 'transactions', 'operations', 'delivery',
]);

/**
 * Block order per focus. Focus only ever *reorders* the approved blocks —
 * it never adds, removes or invents one.
 */
export const FOCUS_ORDERS = Object.freeze({
  relationship: ['account-header', 'kpi-rail', 'relationship', 'billing-revenue', 'transactions', 'operations', 'projects'],
  billing: ['account-header', 'kpi-rail', 'billing-revenue', 'transactions', 'relationship', 'operations', 'projects'],
  transactions: ['account-header', 'kpi-rail', 'transactions', 'billing-revenue', 'relationship', 'operations', 'projects'],
  operations: ['account-header', 'kpi-rail', 'operations', 'projects', 'relationship', 'billing-revenue', 'transactions'],
  delivery: ['account-header', 'kpi-rail', 'projects', 'operations', 'relationship', 'billing-revenue', 'transactions'],
});

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

/**
 * The blocks that live in the expandable card deck. The account header and the
 * KPI rail are not among them: they are always on screen, because between them
 * they answer which account this is and how it is doing.
 */
export const DECK_BLOCKS = Object.freeze([
  'relationship', 'billing-revenue', 'transactions', 'operations', 'projects',
]);

/**
 * Which card a display focus opens.
 *
 * This is where Claude's one display decision becomes visible: the focus it
 * returns for a prompt decides which card the dashboard opens on. It can only
 * ever name a block that already exists — see FOCUS_VALUES and the registry.
 */
export const FOCUS_BLOCKS = Object.freeze({
  relationship: 'relationship',
  billing: 'billing-revenue',
  transactions: 'transactions',
  operations: 'operations',
  delivery: 'projects',
});

/** Mock currency for billing. Stated explicitly wherever a figure is shown. */
export const CURRENCY = 'GBP';

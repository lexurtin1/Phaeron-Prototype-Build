/**
 * Relationship Snapshot — typed data contracts.
 *
 * Two boundaries are validated here:
 *   1. What Claude returns  (WorkflowDecisionSchema)  — untrusted.
 *   2. What the repository returns (RelationshipSnapshotSchema) — guards the UI
 *      against a future real connector emitting a shape the blocks can't render.
 *
 * Pure module: no DOM, no network. Importable by `node --test`.
 */

import { z } from './vendor/zod.js';
import {
  PERIOD_VALUES, SOURCE_STATES,
  PROJECT_STATUSES, TICKET_SEVERITIES, TICKET_STATUSES,
} from './config.js';

/* ─────────────────── 1. Claude's workflow decision ─────────────────── */

/**
 * The ONLY thing the model is permitted to influence.
 *
 * Note what is absent: no HTML, no CSS, no chart options, no figures, no
 * account data, no block definitions and no block ORDER — the dashboard is a
 * fixed template. Claude picks a reporting period from a fixed enum and writes
 * one short plain-text title. Everything else is computed.
 */
export const WorkflowDecisionSchema = z.object({
  workflow: z.enum(['relationship_snapshot', 'other']),

  /** Requested reporting period; defaults to YTD when not supplied. */
  period: z.enum(PERIOD_VALUES).default('ytd'),

  /**
   * A concise factual title. Plain text only — the `<` guard blocks any attempt
   * to smuggle markup through a field that reaches the DOM.
   */
  title: z.string().trim().max(90)
    .refine((s) => !/[<>]/.test(s), 'title must not contain markup')
    .nullable()
    .default(null),
});

/** @typedef {z.infer<typeof WorkflowDecisionSchema>} WorkflowDecision */

/* ─────────────────── 2. The snapshot itself ─────────────────── */

const IsoDate = z.string().datetime();

export const SourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  label: z.string(),
  state: z.enum(SOURCE_STATES),
  lastRefresh: IsoDate.nullable(),
  recordsUsed: z.number().int().min(0),
  evidenceId: z.string(),
  note: z.string().nullable(),
  simulated: z.literal(true),
});

const SeriesBase = {
  available: z.boolean(),
  months: z.array(z.string()),
  monthly: z.array(z.number()),
  priorMonthly: z.array(z.number()),
  ytd: z.number().nullable(),
  priorYtd: z.number().nullable(),
};

export const BillingSchema = z.object({
  ...SeriesBase,
  currency: z.string(),
  measure: z.string(),
  /** Last year's full-year total — what the progress ring tracks towards. */
  priorFullYear: z.number().nullable(),
});

export const TransactionsSchema = z.object({
  ...SeriesBase,
  measure: z.string(),
  unit: z.string(),
  categories: z.array(z.object({ name: z.string(), value: z.number() })),
});

export const ProductionSchema = z.object({
  available: z.boolean(),
  measure: z.string(),
  unit: z.string(),
  servicesLive: z.number().int().min(0),
  servicesTotal: z.number().int().min(0),
  period: z.string(),
  currentMonth: z.number().nullable(),
  months: z.array(z.string()),
  monthly: z.array(z.number()),
}).refine((p) => p.servicesLive <= p.servicesTotal, 'servicesLive cannot exceed servicesTotal');

export const TicketSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: z.enum(TICKET_SEVERITIES),
  status: z.enum(TICKET_STATUSES),
  owner: z.string(),
  openedAt: IsoDate,
  ageDays: z.number().int().min(0),
  lastUpdate: IsoDate,
});

export const TicketsSchema = z.object({
  available: z.boolean(),
  open: z.number().int().min(0).nullable(),
  highSeverity: z.number().int().min(0).nullable(),
  oldestOpenDays: z.number().int().min(0).nullable(),
  bySeverity: z.array(z.object({
    name: z.string(),
    value: z.number().int().min(0),
    severity: z.enum(TICKET_SEVERITIES),
  })),
  monthly: z.array(z.object({
    month: z.string(),
    raised: z.number().int().min(0),
    resolved: z.number().int().min(0),
  })),
  items: z.array(TicketSchema),
});

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(PROJECT_STATUSES),
  owner: z.string(),
  team: z.string(),
  currentMilestone: z.string(),
  nextMilestone: z.object({ name: z.string(), date: IsoDate }).nullable(),
  openItems: z.number().int().min(0),
  lastUpdate: IsoDate,
  /** Only ever populated when the source data explicitly records a blocker. */
  blocker: z.string().nullable(),
  start: IsoDate,
  end: IsoDate,
  items: z.array(z.object({
    key: z.string(),
    title: z.string(),
    status: z.string(),
    assignee: z.string(),
    lastUpdate: IsoDate,
  })),
});

export const PersonSchema = z.object({
  name: z.string(),
  title: z.string().optional(),
  role: z.string().optional(),
  region: z.string().optional(),
});

export const RelationshipSchema = z.object({
  available: z.boolean(),
  manager: PersonSchema.nullable(),
  team: z.array(PersonSchema),
  contacts: z.array(z.object({
    name: z.string(),
    role: z.string(),
    organisation: z.string(),
    lastEngagement: IsoDate,
  })),
  lastMeeting: z.object({
    date: IsoDate,
    type: z.string(),
    reference: z.string(),
  }).nullable(),
  openActions: z.object({
    total: z.number().int().min(0),
    byOwner: z.array(z.object({ owner: z.string(), count: z.number().int().min(0) })),
  }).nullable(),
});

export const RelationshipSnapshotSchema = z.object({
  ctn: z.string().regex(/^[0-9]{3}$/),
  ctnLabel: z.string(),
  asOf: IsoDate,
  /** Hard-asserts that nothing in this pipeline claims to be live data. */
  simulated: z.literal(true),
  scenario: z.string(),
  account: z.object({
    name: z.string(),
    tier: z.string(),
    segment: z.string(),
    region: z.string(),
  }),
  period: z.object({
    id: z.string(),
    label: z.string(),
    months: z.array(z.string()),
    year: z.number().int(),
  }),
  sources: z.array(SourceSchema).min(1),
  billing: BillingSchema,
  transactions: TransactionsSchema,
  production: ProductionSchema,
  tickets: TicketsSchema,
  projects: z.array(ProjectSchema),
  relationship: RelationshipSchema,
});

/** @typedef {z.infer<typeof RelationshipSnapshotSchema>} RelationshipSnapshot */

/* ─────────────────── helpers ─────────────────── */

/**
 * Parse without throwing, returning a discriminated result.
 * @template T
 * @param {import('./vendor/zod.js').ZodType<T>} schema
 * @param {unknown} value
 * @returns {{ok: true, data: T} | {ok: false, error: string}}
 */
export function safeValidate(schema, value) {
  const result = schema.safeParse(value);
  if (result.success) return { ok: true, data: result.data };
  const first = result.error.issues[0];
  const path = first?.path?.length ? first.path.join('.') : '(root)';
  return { ok: false, error: `${path}: ${first?.message || 'invalid'}` };
}

export { z };

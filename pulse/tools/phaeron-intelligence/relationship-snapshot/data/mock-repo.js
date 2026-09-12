/**
 * Relationship Snapshot — simulated account repository.
 *
 * ══════════════════════════════════════════════════════════════════════════
 *  THIS IS THE CONNECTOR SWAP POINT.
 *
 *  Everything above this layer (blocks, components, charts, motion) consumes
 *  only the RelationshipSnapshot contract in ../schemas.js. To move from
 *  simulation to real systems, replace `getSnapshot` with calls to Salesforce,
 *  the billing warehouse, the transaction store and Jira — the UI does not
 *  change.
 *
 *  No live system is contacted here. No real client or personal data is used.
 * ══════════════════════════════════════════════════════════════════════════
 */

import {
  AS_OF, AS_OF_MONTH, AS_OF_YEAR, MONTH_NAMES, SOURCE_DEFS, CURRENCY,
} from '../config.js';
import { createRng, monthlySeries, isoMinus, isoMinusDays } from './seed.js';
import {
  SCENARIOS, STAFF, rmFor, SUPPORT_ROLES, CLIENT_CONTACTS, MEETING_TYPES,
  TICKET_TITLES, PROJECT_NAMES, MILESTONES, JIRA_ITEM_TITLES,
  FALLBACK_NAME_PARTS, TIERS, SEGMENTS, REGIONS,
} from './scenarios.js';

const MONTHS = AS_OF_MONTH + 1; // Jan .. current month inclusive

/** Build a deterministic profile for any CTN with no hand-written fixture. */
function fallbackProfile(ctn, rng) {
  const name = `${rng.pick(FALLBACK_NAME_PARTS.first)} ${rng.pick(FALLBACK_NAME_PARTS.second)}`;
  const scale = rng.float(0.6, 1.8);
  return {
    accountName: name,
    tier: rng.pick(TIERS),
    segment: rng.pick(SEGMENTS),
    region: rng.pick(REGIONS),
    summary: 'Generated account profile.',
    billing: {
      base: Math.round(140000 * scale), growth: rng.float(1.002, 1.022),
      noise: rng.float(0.03, 0.09), priorFactor: rng.float(0.88, 1.14),
    },
    transactions: {
      base: Math.round(42000 * scale), growth: rng.float(1.002, 1.02),
      noise: rng.float(0.03, 0.1), priorFactor: rng.float(0.88, 1.16),
    },
    production: {
      servicesLive: rng.int(3, 7), servicesTotal: rng.int(4, 9),
      base: Math.round(900000 * scale), growth: rng.float(1.002, 1.018), noise: rng.float(0.03, 0.08),
    },
    tickets: {
      open: rng.int(2, 11), high: rng.int(0, 3), oldestDays: rng.int(6, 55),
      monthlyRaised: Array.from({ length: MONTHS }, () => rng.int(3, 16)),
    },
    activeProjects: rng.int(1, 3),
    sources: {
      salesforce: { state: 'live' }, billing: { state: 'live' },
      transactions: { state: 'live' }, jira: { state: 'live' },
    },
  };
}

/** Normalise servicesLive <= servicesTotal without disturbing the seed. */
function clampProduction(p) {
  return { ...p, servicesLive: Math.min(p.servicesLive, p.servicesTotal) };
}

function buildSources(profile, rng) {
  return SOURCE_DEFS.map((def) => {
    const cfg = profile.sources[def.id] || { state: 'live' };
    const state = cfg.state;
    // Unavailable sources have no successful refresh in this snapshot.
    const minutesAgo = state === 'unavailable' ? null
      : state === 'delayed' ? rng.int(3 * 24 * 60, 4 * 24 * 60)
        : rng.int(4, 180);
    return {
      id: def.id,
      name: def.name,
      label: def.label,
      state,
      lastRefresh: minutesAgo == null ? null : isoMinus(AS_OF, minutesAgo),
      recordsUsed: state === 'unavailable' ? 0 : rng.int(18, 480),
      evidenceId: `${def.id.slice(0, 3).toUpperCase()}-${AS_OF_YEAR}-${String(rng.int(1000, 9999))}`,
      note: cfg.note || null,
      simulated: true,
    };
  });
}

function buildBilling(profile, rng, available) {
  const monthly = monthlySeries(rng, { months: MONTHS, ...profile.billing });
  const priorFull = monthlySeries(rng, {
    months: 12,
    base: profile.billing.base * profile.billing.priorFactor,
    growth: profile.billing.growth,
    noise: profile.billing.noise,
  });
  const prior = priorFull.slice(0, MONTHS);
  return {
    available,
    currency: CURRENCY,
    measure: 'Billed revenue',
    months: MONTH_NAMES.slice(0, MONTHS),
    monthly: available ? monthly : [],
    priorMonthly: available ? prior : [],
    ytd: available ? monthly.reduce((a, b) => a + b, 0) : null,
    priorYtd: available ? prior.reduce((a, b) => a + b, 0) : null,
    // The whole of last year, which is what the progress ring tracks towards.
    // priorYtd is the same months as this year; priorFullYear is the finish line.
    priorFullYear: available ? priorFull.reduce((a, b) => a + b, 0) : null,
  };
}

function buildTransactions(profile, rng, available) {
  const monthly = monthlySeries(rng, { months: MONTHS, ...profile.transactions });
  const priorFull = monthlySeries(rng, {
    months: 12,
    base: profile.transactions.base * profile.transactions.priorFactor,
    growth: profile.transactions.growth,
    noise: profile.transactions.noise,
  });
  const prior = priorFull.slice(0, MONTHS);
  const total = monthly.reduce((a, b) => a + b, 0);
  const splits = [
    { name: 'Subscriptions', share: 0.42 },
    { name: 'Redemptions', share: 0.31 },
    { name: 'Switches', share: 0.16 },
    { name: 'Transfers', share: 0.11 },
  ];
  return {
    available,
    measure: 'Transactions processed',
    unit: 'count',
    months: MONTH_NAMES.slice(0, MONTHS),
    monthly: available ? monthly : [],
    priorMonthly: available ? prior : [],
    ytd: available ? total : null,
    priorYtd: available ? prior.reduce((a, b) => a + b, 0) : null,
    categories: available
      ? splits.map((s) => ({ name: s.name, value: Math.round(total * s.share) }))
      : [],
  };
}

function buildProduction(profile, rng, available) {
  const p = clampProduction(profile.production);
  const monthly = monthlySeries(rng, {
    months: MONTHS, base: p.base, growth: p.growth, noise: p.noise,
  });
  return {
    available,
    measure: 'Messages processed in production',
    unit: 'messages',
    servicesLive: p.servicesLive,
    servicesTotal: p.servicesTotal,
    period: `${MONTH_NAMES[AS_OF_MONTH]} ${AS_OF_YEAR}`,
    currentMonth: available ? monthly[monthly.length - 1] : null,
    months: MONTH_NAMES.slice(0, MONTHS),
    monthly: available ? monthly : [],
  };
}

function buildTickets(profile, rng, available) {
  if (!available) {
    return {
      available: false, open: null, highSeverity: null, oldestOpenDays: null,
      bySeverity: [], monthly: [], items: [],
    };
  }
  const cfg = profile.tickets;
  const openCount = cfg.open;
  const items = [];

  // High-severity tickets first so the seeded oldest-age lands on a real row.
  const severities = [];
  for (let i = 0; i < cfg.high; i++) severities.push(rng.chance(0.35) ? 'critical' : 'high');
  while (severities.length < openCount) severities.push(rng.chance(0.55) ? 'medium' : 'low');

  const titles = rng.sample(TICKET_TITLES, Math.min(openCount, TICKET_TITLES.length));
  for (let i = 0; i < openCount; i++) {
    const age = i === 0 ? cfg.oldestDays : rng.int(1, Math.max(2, cfg.oldestDays - 1));
    const openedAt = isoMinusDays(AS_OF, age);
    items.push({
      id: `OPS-${rng.int(10000, 99999)}`,
      title: titles[i % titles.length],
      severity: severities[i],
      status: rng.chance(0.45) ? 'open' : rng.chance(0.6) ? 'in_progress' : 'awaiting_client',
      owner: rng.pick(SUPPORT_ROLES).name,
      openedAt,
      ageDays: age,
      lastUpdate: isoMinusDays(AS_OF, rng.int(0, Math.max(1, Math.floor(age / 2)))),
    });
  }

  // A few resolved tickets so the table's "open first" sort is demonstrable.
  const resolvedCount = rng.int(2, 5);
  for (let i = 0; i < resolvedCount; i++) {
    const age = rng.int(20, 120);
    items.push({
      id: `OPS-${rng.int(10000, 99999)}`,
      title: rng.pick(TICKET_TITLES),
      severity: rng.chance(0.25) ? 'high' : rng.chance(0.5) ? 'medium' : 'low',
      status: 'resolved',
      owner: rng.pick(SUPPORT_ROLES).name,
      openedAt: isoMinusDays(AS_OF, age),
      ageDays: age,
      lastUpdate: isoMinusDays(AS_OF, rng.int(1, 15)),
    });
  }

  const openItems = items.filter((t) => t.status !== 'resolved');
  const countBy = (sev) => openItems.filter((t) => t.severity === sev).length;

  const raised = cfg.monthlyRaised.slice(0, MONTHS);
  const monthly = raised.map((r, i) => ({
    month: MONTH_NAMES[i],
    raised: r,
    // Resolution trails intake slightly; never negative, never above intake+backlog.
    resolved: Math.max(0, Math.round(r * rng.float(0.72, 1.05))),
  }));

  return {
    available: true,
    open: openItems.length,
    highSeverity: openItems.filter((t) => t.severity === 'critical' || t.severity === 'high').length,
    oldestOpenDays: openItems.reduce((m, t) => Math.max(m, t.ageDays), 0),
    bySeverity: [
      { name: 'Critical', value: countBy('critical'), severity: 'critical' },
      { name: 'High', value: countBy('high'), severity: 'high' },
      { name: 'Medium', value: countBy('medium'), severity: 'medium' },
      { name: 'Low', value: countBy('low'), severity: 'low' },
    ].filter((s) => s.value > 0),
    monthly,
    items: sortTickets(items),
  };
}

/** Default ticket ordering: open first, then severity, then age descending. */
export function sortTickets(items) {
  const sevRank = { critical: 0, high: 1, medium: 2, low: 3 };
  return [...items].sort((a, b) => {
    const aOpen = a.status === 'resolved' ? 1 : 0;
    const bOpen = b.status === 'resolved' ? 1 : 0;
    if (aOpen !== bOpen) return aOpen - bOpen;
    const sev = (sevRank[a.severity] ?? 9) - (sevRank[b.severity] ?? 9);
    if (sev !== 0) return sev;
    return b.ageDays - a.ageDays;
  });
}

function buildProjects(profile, rng, available) {
  if (!available) return [];
  const names = rng.sample(PROJECT_NAMES, profile.activeProjects);
  return names.map((name, idx) => {
    const status = idx === 0 && rng.chance(0.3) ? 'blocked'
      : rng.chance(0.15) ? 'not_started' : 'in_progress';
    const startDays = rng.int(60, 260);
    const endDays = -rng.int(20, 180); // negative = in the future
    const milestoneIdx = rng.int(1, MILESTONES.length - 2);
    const itemCount = rng.int(3, 6);
    return {
      id: `PRJ-${rng.int(100, 999)}`,
      name,
      status,
      owner: rng.pick(STAFF).name,
      team: rng.pick(['Delivery · EMEA', 'Delivery · APAC', 'Product Engineering', 'Client Onboarding']),
      currentMilestone: MILESTONES[milestoneIdx],
      nextMilestone: milestoneIdx + 1 < MILESTONES.length
        ? { name: MILESTONES[milestoneIdx + 1], date: isoMinusDays(AS_OF, -rng.int(14, 120)) }
        : null,
      openItems: itemCount,
      lastUpdate: isoMinusDays(AS_OF, rng.int(0, 21)),
      // Only present when the mock source explicitly records one.
      blocker: status === 'blocked'
        ? 'Awaiting client sandbox credentials before integration testing can resume.'
        : null,
      start: isoMinusDays(AS_OF, startDays),
      end: isoMinusDays(AS_OF, endDays),
      items: Array.from({ length: itemCount }, () => ({
        key: `${name.split(' ')[0].toUpperCase().slice(0, 4)}-${rng.int(100, 999)}`,
        title: rng.pick(JIRA_ITEM_TITLES),
        status: rng.pick(['To Do', 'In Progress', 'In Review', 'Done']),
        assignee: rng.pick(SUPPORT_ROLES).name,
        lastUpdate: isoMinusDays(AS_OF, rng.int(0, 30)),
      })),
    };
  });
}

function buildRelationship(profile, rng, available) {
  if (!available) {
    return {
      available: false, manager: null, team: [], contacts: [],
      lastMeeting: null, openActions: null,
    };
  }
  // The one field here that is not seeded-random: an account's owner is a fact
  // about the account, not a roll of the dice. See rmFor() in scenarios.js.
  const manager = rmFor(profile);
  // One entry per person, and never the manager twice — SUPPORT_ROLES lists the
  // same bench under several delivery roles.
  const bench = [];
  for (const role of SUPPORT_ROLES) {
    if (role.name === manager.name) continue;
    if (bench.some((b) => b.name === role.name)) continue;
    bench.push(role);
  }
  const team = rng.sample(bench, rng.int(2, 4));
  const contacts = rng.sample(CLIENT_CONTACTS, rng.int(2, 3)).map((c) => ({
    ...c,
    organisation: profile.accountName,
    lastEngagement: isoMinusDays(AS_OF, rng.int(3, 90)),
  }));
  const actionsTotal = rng.int(0, 6);
  return {
    available: true,
    manager: { ...manager },
    team: team.map((t) => ({ ...t })),
    contacts,
    lastMeeting: {
      date: isoMinusDays(AS_OF, rng.int(2, 40)),
      type: rng.pick(MEETING_TYPES),
      reference: `SFDC-EVT-${rng.int(10000, 99999)}`,
    },
    openActions: actionsTotal === 0 ? { total: 0, byOwner: [] } : {
      total: actionsTotal,
      byOwner: [
        { owner: 'Phaeron', count: Math.ceil(actionsTotal / 2) },
        { owner: 'Client', count: Math.floor(actionsTotal / 2) },
      ].filter((o) => o.count > 0),
    },
  };
}

/**
 * Retrieve the full simulated snapshot for a CTN.
 *
 * Deterministic: the same CTN always returns a deep-equal object.
 *
 * @param {string} ctn three digits, e.g. "303"
 * @returns {import('../schemas.js').RelationshipSnapshot}
 */
export function getSnapshot(ctn) {
  const key = String(ctn);
  const rng = createRng(key);
  const profile = SCENARIOS[key] || fallbackProfile(key, rng);

  const sources = buildSources(profile, rng);
  const stateOf = (id) => (sources.find((s) => s.id === id) || {}).state;
  const usable = (id) => stateOf(id) !== 'unavailable';

  return {
    ctn: key,
    ctnLabel: `CTN ${key}`,
    asOf: AS_OF,
    simulated: true,
    scenario: profile.summary,
    account: {
      name: profile.accountName,
      tier: profile.tier,
      segment: profile.segment,
      region: profile.region,
    },
    period: {
      id: 'ytd',
      label: `Year to date ${AS_OF_YEAR}`,
      months: MONTH_NAMES.slice(0, MONTHS),
      year: AS_OF_YEAR,
    },
    sources,
    billing: buildBilling(profile, rng, usable('billing')),
    transactions: buildTransactions(profile, rng, usable('transactions')),
    production: buildProduction(profile, rng, usable('transactions')),
    tickets: buildTickets(profile, rng, usable('jira')),
    projects: buildProjects(profile, rng, usable('jira')),
    relationship: buildRelationship(profile, rng, usable('salesforce')),
  };
}

/**
 * Staged retrieval, so the assembly wheel reflects work that genuinely happened
 * rather than a decorative timer. Each stage resolves as its sources "return".
 *
 * @param {string} ctn
 * @param {(stage:number, sources:Array) => void} onStage
 * @param {{fast?: boolean}} [opts] fast skips the simulated latency (tests)
 * @returns {Promise<import('../schemas.js').RelationshipSnapshot>}
 */
export async function loadSnapshot(ctn, onStage, opts = {}) {
  const snapshot = getSnapshot(ctn);
  const wait = (ms) => new Promise((r) => setTimeout(r, opts.fast ? 0 : ms));

  // Stage 1 — CTN confirmed. No source has been read yet.
  onStage?.(1, []);
  await wait(320);

  // Stage 2 — Salesforce relationship profile.
  await wait(520);
  onStage?.(2, snapshot.sources.filter((s) => s.id === 'salesforce'));

  // Stage 3 — Billing and transactions.
  await wait(640);
  onStage?.(3, snapshot.sources.filter((s) => s.id === 'billing' || s.id === 'transactions'));

  // Stage 4 — Jira projects and operational tickets.
  await wait(560);
  onStage?.(4, snapshot.sources.filter((s) => s.id === 'jira'));

  return snapshot;
}

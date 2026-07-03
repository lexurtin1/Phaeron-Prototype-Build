// Typed port of ALERT_EVENTS / COUNTRY_DETAILS from
// pulse/tools/market-movement/index.html — data only, unchanged content.

import type { CountryDetail, GlobalAlertEvent, GlobalEventCategory } from './types'

export const CATEGORY_META: Record<
  GlobalEventCategory,
  { color: string; label: string; badge: string }
> = {
  regulatory: { color: '#C0504D', label: 'REGULATORY', badge: 'regulatory' },
  competitor: { color: '#E08A2B', label: 'COMPETITOR', badge: 'competitor' },
  market: { color: '#2D9A8E', label: 'MARKET', badge: 'market' },
  call: { color: '#7D9097', label: 'CALL NOTE', badge: 'call' },
}

const RAW_EVENTS: Omit<GlobalAlertEvent, 'eid'>[] = [
  {
    iso: 'NLD', flag: '🇳🇱', cty: 'Netherlands', city: 'The Hague', lat: 52.0799, lng: 4.3113,
    cat: 'regulatory', type: 'Pension Reform', sev: 'high', days: 2, region: 'emea',
    source: { name: 'Wet toekomst pensioenen – Dutch Senate (June 2026)', url: 'https://www.rijksoverheid.nl/onderwerpen/pensioen/wet-toekomst-pensioenen' },
    summary: 'New law forces Dutch pension money to move into new fund structures.',
    details: {
      what: 'The Wet Toekomst Pensioenen (Future Pensions Act) came into force in July 2023, requiring all Dutch occupational pension schemes to convert from defined-benefit to defined-contribution structures by 2027. An estimated €1.5 trillion in assets held across more than 180 pension funds must be individually migrated into new Premium Pension Institution (PPI) vehicles.',
      why: 'When pension assets are mandated to migrate between fund structures, transfer agents and order routing networks absorb a concentrated surge in instruction volumes.',
      facts: ['~€180bn of assets expected to move', 'Transfer window opens Q3 2026', 'Deadline: September 2026'],
    },
  },
  {
    iso: 'MEX', flag: '🇲🇽', cty: 'Mexico', city: 'Mexico City', lat: 19.4326, lng: -99.1332,
    cat: 'regulatory', type: 'Transfer Portability Rule', sev: 'high', days: 5, region: 'americas',
    source: { name: 'CONSAR Circular 27-2 – Portabilidad Digital (May 2026)', url: 'https://www.consar.gob.mx/gobmx/circular-27-2-portabilidad-2026' },
    summary: 'Mexican pension funds must accept digital transfer instructions fast.',
    details: {
      what: "Mexico's pension regulator CONSAR issued Circular 27-2 in May 2026, requiring all Siefore pension fund operators to accept and process digital transfer instructions within 48 hours, covering approximately 12 million pension accounts.",
      why: 'Regulatory mandates requiring digital instruction processing within tight timeframes accelerate the shift from paper-based or bilateral messaging to standardised electronic networks.',
      facts: ['Affects ~12m pension accounts', '48-hour digital instruction rule', 'Effective July 2026'],
    },
  },
  {
    iso: 'GBR', flag: '🇬🇧', cty: 'United Kingdom', city: 'London', lat: 51.5074, lng: -0.1278,
    cat: 'regulatory', type: 'T+1 Settlement Consultation', sev: 'high', days: 3, region: 'emea',
    source: { name: 'FCA Consultation Paper CP26/4 – T+1 Settlement', url: 'https://www.fca.org.uk/publications/consultation-papers/cp26-4-t-plus-one-settlement' },
    summary: 'UK regulator is consulting on faster (T+1) fund settlement.',
    details: {
      what: 'The FCA published consultation paper CP26/4 in March 2026, proposing that all UK-authorised collective investment schemes move from T+2 to T+1 settlement, aligning the UK with the US equity market.',
      why: 'Moving from T+2 to T+1 settlement compresses the operational window for fund order matching, reconciliation and confirmation.',
      facts: ['Proposes T+1 settlement', 'Comment period closes Aug 2026', 'Affects UK collective investment schemes'],
    },
  },
  {
    iso: 'AUS', flag: '🇦🇺', cty: 'Australia', city: 'Sydney', lat: -33.8688, lng: 151.2093,
    cat: 'regulatory', type: 'Super Fund Liquidity Rules', sev: 'high', days: 9, region: 'australia',
    source: { name: 'APRA SPS 530 Amendment – Liquidity Requirements (Apr 2026)', url: 'https://www.apra.gov.au/superannuation/superannuation-prudential-standards/sps-530' },
    summary: 'Tighter rules push big super funds to rebalance assets.',
    details: {
      what: "APRA's updated Prudential Standard SPS 530, effective from April 2026, requires superannuation funds to stress-test liquidity and hold demonstrably liquid assets, targeting unlisted infrastructure and property allocations.",
      why: 'Tighter liquidity requirements force superannuation funds to rebalance portfolios, generating elevated volumes of buy, sell and switch instructions.',
      facts: ['14 major super funds affected', 'Unlisted asset rebalancing expected', 'Driven by APRA SPS 530'],
    },
  },
  {
    iso: 'IND', flag: '🇮🇳', cty: 'India', city: 'Mumbai', lat: 19.076, lng: 72.8777,
    cat: 'regulatory', type: 'Direct Plan Migration', sev: 'high', days: 12, region: 'asia',
    source: { name: 'SEBI/AMFI Circular – Direct Plan Migration (May 2026)', url: 'https://www.sebi.gov.in/legal/circulars/2026/direct-plan-migration-institutional' },
    summary: 'Large Indian investors must move to direct fund plans.',
    details: {
      what: 'A joint SEBI and AMFI circular issued in May 2026 mandates institutional investors holding mutual fund investments above ₹10 crore to migrate from regular plans to direct plans by October 2026.',
      why: 'Mandatory migration of institutional flows from regular to direct plans creates a concentrated spike in transfer-agent processing.',
      facts: ['Threshold: ₹10 crore+', 'Institutional investors', 'Effective October 2026'],
    },
  },
  {
    iso: 'LUX', flag: '🇱🇺', cty: 'Luxembourg', city: 'Luxembourg City', lat: 49.6116, lng: 6.1319,
    cat: 'competitor', type: 'Clearstream FundsDLT', sev: 'med', days: 6, region: 'emea',
    source: { name: 'Clearstream Press Release – FundsDLT CSD Integration (Jun 2026)', url: 'https://www.clearstream.com/clearstream-en/products-and-services/fundsdlt-csd-integration-2026' },
    summary: 'Competitor Clearstream is pushing same-day fund settlement.',
    details: {
      what: "Clearstream announced in June 2026 that its FundsDLT distributed ledger platform has completed technical integration with three major European CSDs, with a live pilot covering 47 UCITS funds.",
      why: 'Distributed ledger-based settlement in UCITS markets shortens the trade lifecycle and reduces counterparty risk.',
      facts: ['3 European CSDs integrated', 'Targets same-day UCITS settlement', 'Goal: Q4 2026'],
    },
  },
  {
    iso: 'BEL', flag: '🇧🇪', cty: 'Belgium', city: 'Brussels', lat: 50.8503, lng: 4.3517,
    cat: 'competitor', type: 'Euroclear EMX Upgrade', sev: 'med', days: 8, region: 'emea',
    source: { name: 'Euroclear – ISO 20022 Migration Notice for EMX (Mar 2026)', url: 'https://www.euroclear.com/services/en/products/emx/iso-20022-migration-notice' },
    summary: 'Euroclear is changing its messaging standard — firms must migrate.',
    details: {
      what: 'Euroclear published its ISO 20022 migration mandate for the EMX fund order routing network in March 2026, requiring all 847 connected counterparties to complete their transition by 1 January 2027.',
      why: 'Mandatory messaging standard upgrades require all connected counterparties to migrate simultaneously, prompting firms to reassess provider capability.',
      facts: ['ISO 20022 mandated Jan 2027', '847 counterparties affected', 'Migration timeline published'],
    },
  },
  {
    iso: 'ESP', flag: '🇪🇸', cty: 'Spain', city: 'Madrid', lat: 40.4168, lng: -3.7038,
    cat: 'competitor', type: 'Allfunds–Santander Deal', sev: 'med', days: 4, region: 'emea',
    source: { name: 'Allfunds Press Release – Santander AM Distribution Agreement (Jun 2026)', url: 'https://www.allfunds.com/press-releases/santander-am-distribution-agreement-2026' },
    summary: 'Competitor Allfunds won a big Spanish distribution deal.',
    details: {
      what: 'Allfunds signed an exclusive distribution agreement with Santander Asset Management in June 2026, covering approximately 400 funds across the Iberian corridor.',
      why: 'When a major distribution platform deepens its reach through exclusive agreements, it concentrates order flow through fewer intermediaries.',
      facts: ['~400 funds onboarded', 'Covers Iberian market', 'Partner: Santander AM'],
    },
  },
  {
    iso: 'SGP', flag: '🇸🇬', cty: 'Singapore', city: 'Singapore', lat: 1.3521, lng: 103.8198,
    cat: 'competitor', type: 'Clearstream–SGX Partnership', sev: 'med', days: 11, region: 'asia',
    source: { name: 'MAS Regulatory Sandbox – SGX-Clearstream Passporting (May 2026)', url: 'https://www.mas.gov.sg/development/fintech/regulatory-sandbox/sgx-clearstream-approval-2026' },
    summary: 'Clearstream partnered with SGX for Asian fund passporting.',
    details: {
      what: 'Clearstream and Singapore Exchange announced a joint fund passporting partnership in May 2026, enabling a pilot of 25 fund managers to begin cross-border distribution in Q3 2026.',
      why: 'Cross-border passporting partnerships expand the reach of settlement and order routing across Asia-Pacific.',
      facts: ['Partner: SGX', 'MAS sandbox approval granted', 'Focus: Asian fund passporting'],
    },
  },
  {
    iso: 'IRL', flag: '🇮🇪', cty: 'Ireland', city: 'Dublin', lat: 53.3498, lng: -6.2603,
    cat: 'competitor', type: 'Allfunds Acquires FundRock', sev: 'med', days: 7, region: 'emea',
    source: { name: 'Financial Times – Allfunds acquires FundRock for €85m (Jun 2026)', url: 'https://www.ft.com/content/allfunds-fundrock-acquisition-ireland-2026' },
    summary: 'Allfunds bought an Irish fund admin platform.',
    details: {
      what: 'Allfunds completed the acquisition of FundRock, an Irish-domiciled fund administration and AIFM platform, for €85 million in June 2026.',
      why: "Acquiring a transfer agent platform in a major fund domicile extends a platform provider's control over the full order-to-settlement chain.",
      facts: ['Deal value: €85m', 'Target: FundRock', 'Strengthens Irish TA connectivity'],
    },
  },
  {
    iso: 'USA', flag: '🇺🇸', cty: 'United States', city: 'Malvern, PA', lat: 40.0362, lng: -75.5135,
    cat: 'market', type: 'Vanguard APAC Expansion', sev: 'med', days: 1, region: 'americas',
    source: { name: 'Vanguard Press Release – Asia Pacific Expansion Strategy (Jun 2026)', url: 'https://investor.vanguard.com/news-and-insights/press-release/apac-expansion-hk-2026' },
    summary: 'Vanguard is expanding into Asia with new Hong Kong funds.',
    details: {
      what: 'Vanguard announced its Asia-Pacific re-entry strategy in June 2026, centred on a locally-domiciled fund range of six equity and fixed-income funds filed with the Hong Kong SFC.',
      why: 'Establishing locally-domiciled funds in a new regional market requires new transfer agent relationships and cross-border order routing.',
      facts: ['New HK-domiciled fund range', 'SFC filing made', 'First HK retail distribution push'],
    },
  },
  {
    iso: 'JPN', flag: '🇯🇵', cty: 'Japan', city: 'Tokyo', lat: 35.6762, lng: 139.6503,
    cat: 'market', type: 'BlackRock ETF Milestone', sev: 'med', days: 3, region: 'asia',
    source: { name: 'BlackRock Japan – iShares AUM Milestone & TA RFP (Jun 2026)', url: 'https://www.blackrock.com/jp/en/insights/ishares-nisa-milestone-rfp-2026' },
    summary: "BlackRock's Japan ETF assets passed ¥10 trillion; new RFP issued.",
    details: {
      what: "BlackRock's iShares ETF range in Japan crossed ¥10 trillion in AUM in June 2026, driven by the reformed NISA programme, prompting a transfer-agent RFP covering its Japan UCITS and locally-domiciled ETF range.",
      why: "Rapid AUM growth increases the volume and complexity of transfer agent processing, often signalling a structured review of alternatives.",
      facts: ['ETF AUM > ¥10 trillion', 'NISA reform driving flows', 'New transfer-agent RFP issued'],
    },
  },
  {
    iso: 'HKG', flag: '🇭🇰', cty: 'Hong Kong', city: 'Hong Kong', lat: 22.3193, lng: 114.1694,
    cat: 'market', type: 'Fidelity MPF Expansion', sev: 'med', days: 5, region: 'asia',
    source: { name: 'Fidelity HK – MPF Platform Partnership Announcement (Jun 2026)', url: 'https://www.fidelity.com.hk/en/about-us/media-centre/mpf-platform-partnerships-2026' },
    summary: 'Fidelity is expanding HK distribution via MPF partnerships.',
    details: {
      what: 'Fidelity International announced a Hong Kong distribution expansion in June 2026, targeting the MPF market through partnerships with three new MPF platform providers.',
      why: 'MPF platform partnerships expand the distributor network, routing new instruction flows through additional intermediaries.',
      facts: ['New MPF platform partnerships', '3 connected distributors identified', 'Hong Kong retail focus'],
    },
  },
  {
    iso: 'DEU', flag: '🇩🇪', cty: 'Germany', city: 'Frankfurt', lat: 50.1109, lng: 8.6821,
    cat: 'market', type: 'DWS Fund Range Restructure', sev: 'med', days: 6, region: 'emea',
    source: { name: 'DWS Investor Notice – German Retail Sub-fund Mergers (May 2026)', url: 'https://www.dws.com/en-gb/insights/investor-notices/german-retail-sub-fund-mergers-2026' },
    summary: 'DWS is merging 14 retail sub-funds.',
    details: {
      what: 'DWS Group published investor notices in May 2026 announcing the merger of 14 underperforming sub-funds, affecting an estimated 280,000 unit-holder accounts.',
      why: 'Sub-fund mergers generate concentrated, time-sensitive operational load on transfer agents and registrars.',
      facts: ['14 sub-funds merging', 'TA instructions expected Q3', 'German retail range'],
    },
  },
  {
    iso: 'BRA', flag: '🇧🇷', cty: 'Brazil', city: 'São Paulo', lat: -23.5505, lng: -46.6333,
    cat: 'market', type: 'Itaú UCITS Launch', sev: 'med', days: 10, region: 'americas',
    source: { name: 'CVM Approval Notice – Itaú Asset Management UCITS Structure (May 2026)', url: 'https://www.cvm.gov.br/noticias/arquivos/2026/20260515-itau-ucits-approval.html' },
    summary: 'Itaú is launching its first cross-listed UCITS fund.',
    details: {
      what: 'Itaú Asset Management received CVM regulatory approval in May 2026 to launch its first UCITS-compliant fund range, cross-listed in Luxembourg, requiring a Brazil–Luxembourg settlement bridge.',
      why: 'Launching a UCITS-structured fund from an emerging-market domicile requires cross-border connectivity between local transfer agent infrastructure and the European UCITS settlement system.',
      facts: ['First UCITS cross-listed fund', 'CVM approval received', 'Needs Brazil–Luxembourg bridge'],
    },
  },
  {
    iso: 'FRA', flag: '🇫🇷', cty: 'France', city: 'Paris', lat: 48.8566, lng: 2.3522,
    cat: 'market', type: 'Amundi Fund Mergers', sev: 'med', days: 8, region: 'emea',
    source: { name: 'Amundi Press Release – Pioneer & Lyxor Range Consolidation (Jun 2026)', url: 'https://www.amundi.com/usinvestors/News-and-Press-Releases/pioneer-lyxor-consolidation-2026' },
    summary: 'Amundi is completing 230 fund mergers.',
    details: {
      what: 'Amundi announced completion of a fund rationalisation programme merging 230 sub-funds inherited from the Pioneer and Lyxor acquisitions, affecting an estimated 1.4 million unit-holder positions.',
      why: 'Merging sub-funds at scale is a significant operational event for transfer agents, putting straight-through processing capacity under direct pressure.',
      facts: ['230 fund mergers', 'Pioneer + Lyxor ranges', 'Large transfer-instruction volume'],
    },
  },
  {
    iso: 'ZAF', flag: '🇿🇦', cty: 'South Africa', city: 'Cape Town', lat: -33.9249, lng: 18.4241,
    cat: 'market', type: 'Allan Gray Feeder Fund', sev: 'med', days: 14, region: 'emea',
    source: { name: 'FSCA Approval – Allan Gray Foreign Fund Feeder Structure (Apr 2026)', url: 'https://www.fsca.co.za/Regulatory%20Frameworks/Pages/allan-gray-feeder-fund-approval-2026.aspx' },
    summary: 'Allan Gray got approval for a new foreign feeder fund.',
    details: {
      what: 'Allan Gray received FSCA approval in April 2026 to launch a foreign feeder fund structure channelling South African retail subscriptions into an Irish-domiciled master fund.',
      why: 'Feeder fund structures require correspondent connectivity between the local registrar and the master fund transfer agent.',
      facts: ['FSCA approval received', 'First SA retail cross-border push', 'Correspondent bank model'],
    },
  },
  {
    iso: 'TWN', flag: '🇹🇼', cty: 'Taiwan', city: 'Taipei', lat: 25.033, lng: 121.5654,
    cat: 'market', type: 'Cathay Platform RFP', sev: 'med', days: 13, region: 'asia',
    source: { name: 'FSC Taiwan – Cathay SITE Platform Offshore RFP (May 2026)', url: 'https://www.fsc.gov.tw/ch/home.jsp?id=cathay-site-offshore-rfp-2026' },
    summary: 'Cathay is expanding its fund platform and issued an RFP.',
    details: {
      what: 'Cathay Securities Investment Trust announced an expansion of its SITE platform to include offshore fund onboarding, and circulated a formal RFP for cross-border order routing.',
      why: 'Expanding a fund platform to include offshore fund onboarding requires connectivity to international order routing infrastructure.',
      facts: ['Offshore fund onboarding', 'RFP circulated', 'Calastone named'],
    },
  },
  {
    iso: 'ARE', flag: '🇦🇪', cty: 'United Arab Emirates', city: 'Dubai', lat: 25.2048, lng: 55.2708,
    cat: 'market', type: 'Emirates NBD Fund Expansion', sev: 'med', days: 9, region: 'emea',
    source: { name: 'ADGM Passporting Approval – Emirates NBD GCC Distribution (May 2026)', url: 'https://www.adgm.com/media/news/adgm-passporting-emirates-nbd-gcc-2026' },
    summary: 'Emirates NBD is expanding its DIFC fund range across the GCC.',
    details: {
      what: 'Emirates NBD Asset Management expanded its DIFC-domiciled fund range with ADGM passporting approval to distribute across the GCC without separate registration in each country.',
      why: 'Cross-border fund distribution at scale requires interoperable transfer agent connectivity across all participating markets.',
      facts: ['DIFC-domiciled range', 'ADGM passporting approved', 'GCC cross-border distribution'],
    },
  },
  {
    iso: 'CAN', flag: '🇨🇦', cty: 'Canada', city: 'Toronto', lat: 43.6532, lng: -79.3832,
    cat: 'market', type: 'CI Financial RIA Deals', sev: 'med', days: 7, region: 'americas',
    source: { name: 'CI Financial – US RIA Acquisition Press Release (Jun 2026)', url: 'https://www.cifinancial.com/en/news/ci-financial-ria-acquisitions-june-2026' },
    summary: 'CI Financial bought three US advisory firms.',
    details: {
      what: 'CI Financial announced three further US RIA acquisitions in June 2026 and has initiated a formal review of its cross-border fund distribution and order routing infrastructure.',
      why: 'Post-acquisition reviews typically assess whether existing connectivity supports the combined entity’s cross-border distribution requirements at the new scale.',
      facts: ['3 US RIA firms acquired', 'Infrastructure review underway', 'Calastone meeting scheduled'],
    },
  },
  {
    iso: 'SWE', flag: '🇸🇪', cty: 'Sweden', city: 'Stockholm', lat: 59.3293, lng: 18.0686,
    cat: 'call', type: 'Nordea Call Note', sev: 'low', days: 14, region: 'emea',
    source: { name: 'Calastone CRM – Internal Call Note Ref. NCN-2026-087', url: 'https://crm.calastone.internal/notes/NCN-2026-087' },
    author: { name: 'Pierre Eric Patricola', role: 'Europe Sales Director', initials: 'PEP' },
    summary: 'Nordea is evaluating T+1 readiness and messaging vendors.',
    details: {
      what: "Meeting with Nordea's Head of Fund Operations in Stockholm. Nordea is evaluating ISO 20022-capable order routing vendors ahead of an anticipated Nordic T+1 mandate, with a decision expected Q4 2026.",
      why: 'Evaluating ISO 20022 vendors ahead of a regulatory-driven migration typically results in multi-year contractual commitments.',
      facts: ['Met 14 June', 'Evaluating ISO 20022 vendors', 'Decision expected Q4'],
    },
  },
  {
    iso: 'CHE', flag: '🇨🇭', cty: 'Switzerland', city: 'Zurich', lat: 47.3769, lng: 8.5417,
    cat: 'call', type: 'UBS Wealth Call Note', sev: 'low', days: 11, region: 'emea',
    source: { name: 'Calastone CRM – Internal Call Note Ref. UCN-2026-142', url: 'https://crm.calastone.internal/notes/UCN-2026-142' },
    author: { name: 'Pierre Eric Patricola', role: 'Europe Sales Director', initials: 'PEP' },
    summary: 'UBS Wealth is worried about competitor migration costs.',
    details: {
      what: "UBS Wealth's Zurich-based Fund Operations Director flagged that EMX ISO 20022 migration costs are running above budget, and is open to briefing on alternative routing networks ahead of the January 2027 deadline.",
      why: 'Firms evaluating the cost of staying on their current network may weigh that against the effort of switching to an alternative provider.',
      facts: ['Potential switcher', 'Concerned re: EMX migration cost', 'CCO to follow up'],
    },
  },
  {
    iso: 'NLD', flag: '🇳🇱', cty: 'Netherlands', city: 'Rotterdam', lat: 51.9244, lng: 4.4777,
    cat: 'call', type: 'NN IP Call Note', sev: 'low', days: 6, region: 'emea',
    source: { name: 'Calastone CRM – Internal Call Note Ref. NIP-2026-203', url: 'https://crm.calastone.internal/notes/NIP-2026-203' },
    author: { name: 'Pierre Eric Patricola', role: 'Europe Sales Director', initials: 'PEP' },
    summary: 'NN Investment Partners flagged the pension reform as urgent.',
    details: {
      what: "Meeting with NN Investment Partners' COO in Rotterdam. NN IP's current transfer agent infrastructure is not scaled for the pension migration volumes ahead of a Q1 2027 window; lead logged at proposal stage.",
      why: 'Mandatory pension asset restructuring creates an acute need for scalable transfer instruction processing within a compressed legislative timeline.',
      facts: ['Hot lead — Stage 3', 'Needs transfer-agent partner', 'Tied to pension reform'],
    },
  },
]

export const ALERT_EVENTS: GlobalAlertEvent[] = RAW_EVENTS.map((e, i) => ({ ...e, eid: `ev${i}` }))

export const EVENT_BY_ID: Record<string, GlobalAlertEvent> = Object.fromEntries(
  ALERT_EVENTS.map((e) => [e.eid, e]),
)

export const COUNTRY_DETAILS: Record<string, CountryDetail> = {
  NLD: { name: 'Netherlands', flag: '🇳🇱', region: 'Western Europe', corridors: 14, monthlyOrders: '2.1m', topConnections: ['Luxembourg', 'UK', 'Germany'], competitors: ['Clearstream', 'Euroclear EMX'], opportunity: 'High', oppNote: 'Pension reform creates urgent transfer mandate', status: 'Active — 14 corridors live' },
  MEX: { name: 'Mexico', flag: '🇲🇽', region: 'Latin America', corridors: 3, monthlyOrders: '0.4m', topConnections: ['USA', 'Luxembourg', 'Spain'], competitors: ['Allfunds'], opportunity: 'High', oppNote: 'CONSAR portability mandate opens 12m pension accounts', status: 'Emerging — 3 corridors live' },
  GBR: { name: 'United Kingdom', flag: '🇬🇧', region: 'Northern Europe', corridors: 62, monthlyOrders: '11.4m', topConnections: ['Luxembourg', 'Ireland', 'USA'], competitors: ['Euroclear EMX', 'Calastone (home hub)'], opportunity: 'Medium', oppNote: 'T+1 consultation drives back-office re-engineering demand', status: 'Core hub — 62 corridors live' },
  AUS: { name: 'Australia', flag: '🇦🇺', region: 'Asia Pacific', corridors: 21, monthlyOrders: '3.2m', topConnections: ['UK', 'Singapore', 'USA'], competitors: ['Clearstream'], opportunity: 'Medium', oppNote: 'APRA liquidity rules trigger super fund rebalancing', status: 'Active — 21 corridors live' },
  IND: { name: 'India', flag: '🇮🇳', region: 'Asia Pacific', corridors: 6, monthlyOrders: '1.1m', topConnections: ['Singapore', 'UK', 'UAE'], competitors: ['Local TAs'], opportunity: 'High', oppNote: 'Direct plan migration spikes transfer agent load', status: 'Growing — 6 corridors live' },
  LUX: { name: 'Luxembourg', flag: '🇱🇺', region: 'Western Europe', corridors: 48, monthlyOrders: '9.7m', topConnections: ['UK', 'Germany', 'France'], competitors: ['Clearstream', 'Allfunds'], opportunity: 'Medium', oppNote: 'Clearstream FundsDLT push threatens UCITS settlement corridor', status: 'Core hub — 48 corridors live' },
  BEL: { name: 'Belgium', flag: '🇧🇪', region: 'Western Europe', corridors: 9, monthlyOrders: '0.8m', topConnections: ['Luxembourg', 'France', 'Netherlands'], competitors: ['Euroclear EMX'], opportunity: 'Medium', oppNote: 'EMX ISO 20022 migration creates switching window', status: 'Active — 9 corridors live' },
  ESP: { name: 'Spain', flag: '🇪🇸', region: 'Southern Europe', corridors: 7, monthlyOrders: '0.6m', topConnections: ['Luxembourg', 'Mexico', 'Portugal'], competitors: ['Allfunds'], opportunity: 'Medium', oppNote: 'Allfunds–Santander deal pressures Iberian corridor', status: 'Active — 7 corridors live' },
  SGP: { name: 'Singapore', flag: '🇸🇬', region: 'Asia Pacific', corridors: 18, monthlyOrders: '2.4m', topConnections: ['Hong Kong', 'Australia', 'UK'], competitors: ['Clearstream'], opportunity: 'High', oppNote: 'Clearstream–SGX passporting threatens APAC corridors', status: 'APAC hub — 18 corridors live' },
  IRL: { name: 'Ireland', flag: '🇮🇪', region: 'Northern Europe', corridors: 33, monthlyOrders: '6.1m', topConnections: ['UK', 'Luxembourg', 'USA'], competitors: ['Allfunds', 'Clearstream'], opportunity: 'Medium', oppNote: 'Allfunds FundRock buy strengthens rival TA connectivity', status: 'Core hub — 33 corridors live' },
  USA: { name: 'United States', flag: '🇺🇸', region: 'North America', corridors: 24, monthlyOrders: '4.9m', topConnections: ['UK', 'Canada', 'Hong Kong'], competitors: ['Local TAs', 'NSCC'], opportunity: 'Medium', oppNote: 'Vanguard APAC push opens HK corridor conversation', status: 'Active — 24 corridors live' },
  JPN: { name: 'Japan', flag: '🇯🇵', region: 'Asia Pacific', corridors: 12, monthlyOrders: '1.9m', topConnections: ['Hong Kong', 'Singapore', 'USA'], competitors: ['Local TAs'], opportunity: 'High', oppNote: 'BlackRock ETF growth + NISA reform drives RFP', status: 'Active — 12 corridors live' },
  HKG: { name: 'Hong Kong', flag: '🇭🇰', region: 'Asia Pacific', corridors: 16, monthlyOrders: '2.7m', topConnections: ['Singapore', 'Japan', 'UK'], competitors: ['Clearstream'], opportunity: 'High', oppNote: 'Fidelity MPF expansion adds 3 target distributors', status: 'APAC hub — 16 corridors live' },
  DEU: { name: 'Germany', flag: '🇩🇪', region: 'Western Europe', corridors: 19, monthlyOrders: '3.0m', topConnections: ['Luxembourg', 'France', 'UK'], competitors: ['Clearstream'], opportunity: 'Medium', oppNote: 'DWS sub-fund mergers open connectivity window', status: 'Active — 19 corridors live' },
  BRA: { name: 'Brazil', flag: '🇧🇷', region: 'Latin America', corridors: 2, monthlyOrders: '0.2m', topConnections: ['Luxembourg', 'USA', 'Mexico'], competitors: ['Local custodians'], opportunity: 'High', oppNote: 'Itaú UCITS launch needs Brazil–Luxembourg bridge', status: 'Emerging — 2 corridors live' },
  FRA: { name: 'France', flag: '🇫🇷', region: 'Western Europe', corridors: 22, monthlyOrders: '3.6m', topConnections: ['Luxembourg', 'Germany', 'UK'], competitors: ['Euroclear EMX'], opportunity: 'Medium', oppNote: 'Amundi 230-fund merger is a large operational event', status: 'Active — 22 corridors live' },
  ZAF: { name: 'South Africa', flag: '🇿🇦', region: 'Africa', corridors: 4, monthlyOrders: '0.3m', topConnections: ['UK', 'Luxembourg', 'UAE'], competitors: ['Local TAs'], opportunity: 'High', oppNote: 'Allan Gray feeder structure opens SA retail corridor', status: 'Emerging — 4 corridors live' },
  TWN: { name: 'Taiwan', flag: '🇹🇼', region: 'Asia Pacific', corridors: 5, monthlyOrders: '0.5m', topConnections: ['Hong Kong', 'Singapore', 'Japan'], competitors: ['Local platforms'], opportunity: 'High', oppNote: 'Cathay SITE platform RFP includes Calastone', status: 'Growing — 5 corridors live' },
  ARE: { name: 'United Arab Emirates', flag: '🇦🇪', region: 'Middle East', corridors: 8, monthlyOrders: '0.9m', topConnections: ['UK', 'India', 'Singapore'], competitors: ['Local custodians'], opportunity: 'High', oppNote: 'Emirates NBD DIFC/ADGM passporting opens GCC corridor', status: 'Growing — 8 corridors live' },
  CAN: { name: 'Canada', flag: '🇨🇦', region: 'North America', corridors: 11, monthlyOrders: '1.5m', topConnections: ['USA', 'UK', 'Luxembourg'], competitors: ['Local TAs'], opportunity: 'Medium', oppNote: 'CI Financial RIA acquisitions trigger infra review', status: 'Active — 11 corridors live' },
  SWE: { name: 'Sweden', flag: '🇸🇪', region: 'Nordics', corridors: 13, monthlyOrders: '1.7m', topConnections: ['UK', 'Luxembourg', 'Germany'], competitors: ['Euroclear EMX'], opportunity: 'Medium', oppNote: 'Nordea T+1 readiness — ISO 20022 vendor decision Q4', status: 'Active — 13 corridors live' },
  CHE: { name: 'Switzerland', flag: '🇨🇭', region: 'Western Europe', corridors: 15, monthlyOrders: '2.2m', topConnections: ['Luxembourg', 'UK', 'Germany'], competitors: ['Clearstream', 'Euroclear EMX'], opportunity: 'High', oppNote: 'UBS Wealth flagged as potential EMX switcher — CCO lead', status: 'Active — 15 corridors live' },
}

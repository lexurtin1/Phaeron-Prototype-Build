/* Phaeron Reporting & MI — shared dataset
   Aligned with account-tracker, network-overview, and Intelligence ETF pipeline.
   Charts/tables must read from window.PHAERON_MI only. */
(function (global) {
  'use strict';

  const opportunities = [
    {
      id: 'hl',
      name: 'Hargreaves Lansdowne',
      sector: 'Investment Platform',
      location: 'Bristol',
      stage: 'Proposal Sent',
      valueM: 5.2,
      valueLabel: '£5.2m',
      owner: 'Alex Curtin',
      lastActivity: '3 days ago',
    },
    {
      id: 'fnz',
      name: 'FNZ Group',
      sector: 'Platform Operator',
      location: 'Edinburgh',
      stage: 'Negotiation',
      valueM: 4.8,
      valueLabel: '£4.8m',
      owner: 'Alex Curtin',
      lastActivity: 'Today',
    },
    {
      id: 'pershing',
      name: 'Pershing',
      sector: 'Clearing & Custody',
      location: 'London',
      stage: 'Proposal Sent',
      valueM: 2.9,
      valueLabel: '£2.9m',
      owner: 'Alex Curtin',
      lastActivity: '2 days ago',
    },
    {
      id: 'transact',
      name: 'Transact',
      sector: 'Platform Operator',
      location: 'London',
      stage: 'Discovery',
      valueM: 1.6,
      valueLabel: '£1.6m',
      owner: 'Alex Curtin',
      lastActivity: 'Today',
    },
  ];

  const openPipelineM = opportunities.reduce((s, d) => s + d.valueM, 0); // 14.5

  const etfPipeline = [
    { name: 'Vanguard — ETF Servicing EU', fund: 'Equity', stage: 'Closing/Won', prob: 90, valueK: 840, close: '2026-07-18' },
    { name: 'iShares — APAC Settlement', fund: 'Equity', stage: 'Negotiation', prob: 65, valueK: 710, close: '2026-08-30' },
    { name: 'Amundi — Fixed Income ETF', fund: 'Fixed Income', stage: 'Proposal', prob: 45, valueK: 520, close: '2026-09-22' },
    { name: 'State Street — Network EU', fund: 'Multi-Asset', stage: 'Negotiation', prob: 60, valueK: 480, close: '2026-08-12' },
    { name: 'Invesco — ETF Data Services', fund: 'Equity', stage: 'Proposal', prob: 40, valueK: 360, close: '2026-10-05' },
    { name: 'DWS Xtrackers — Routing', fund: 'Fixed Income', stage: 'Discovery', prob: 25, valueK: 410, close: '2026-11-14' },
    { name: 'WisdomTree — Commodities', fund: 'Commodity', stage: 'Discovery', prob: 20, valueK: 300, close: '2026-12-01' },
    { name: 'L&G — Index ETF Servicing', fund: 'Equity', stage: 'Closing/Won', prob: 85, valueK: 560, close: '2026-07-29' },
    { name: 'Fidelity — Active ETF', fund: 'Multi-Asset', stage: 'Proposal', prob: 50, valueK: 440, close: '2026-09-30' },
  ];

  const etfTotalK = etfPipeline.reduce((s, d) => s + d.valueK, 0); // 4620 → £4.62m
  /* Intelligence briefing publishes £2.18m weighted — keep that published MI figure */
  const etfWeightedK = 2180;

  const network = {
    year: 2025,
    liveTotal: 273276093,
    countries: 51,
    corridors: 321,
    mappedPct: 97.9,
    interCountryVol: 109780526,
  };

  const presenceMarkets = [
    { iso: 'GBR', name: 'United Kingdom', valueLabel: '£48.2m ARR', arrMGbp: 48.2, sales: 'Amelia Hart · London' },
    { iso: 'LUX', name: 'Luxembourg', valueLabel: '€31.4m ARR', arrMGbp: 26.8, sales: 'Marc Weber · Luxembourg' },
    { iso: 'IRL', name: 'Ireland', valueLabel: '€27.9m ARR', arrMGbp: 23.8, sales: 'Niamh Byrne · Dublin' },
    { iso: 'DEU', name: 'Germany', valueLabel: '€22.1m ARR', arrMGbp: 18.9, sales: 'Jonas Keller · Frankfurt' },
    { iso: 'FRA', name: 'France', valueLabel: '€18.6m ARR', arrMGbp: 15.9, sales: 'Camille Renard · Paris' },
    { iso: 'USA', name: 'United States', valueLabel: '$12.4m ARR', arrMGbp: 9.7, sales: 'Jordan Hale · New York' },
    { iso: 'NLD', name: 'Netherlands', valueLabel: '€9.4m ARR', arrMGbp: 8.0, sales: 'Sven de Vries · Amsterdam' },
    { iso: 'SGP', name: 'Singapore', valueLabel: 'S$8.2m ARR', arrMGbp: 4.8, sales: 'Mei Lin · Singapore' },
    { iso: 'ITA', name: 'Italy', valueLabel: '€7.5m ARR', arrMGbp: 6.4, sales: 'Camille Renard · Paris' },
    { iso: 'CHE', name: 'Switzerland', valueLabel: 'CHF 6.8m ARR', arrMGbp: 6.0, sales: 'Amelia Hart · London' },
    { iso: 'ESP', name: 'Spain', valueLabel: '€5.9m ARR', arrMGbp: 5.0, sales: 'Camille Renard · Paris' },
    { iso: 'AUS', name: 'Australia', valueLabel: 'A$4.8m ARR', arrMGbp: 2.5, sales: 'Tom Riley · Sydney' },
  ];

  const clientHotspots = [
    { city: 'London', clients: 142, color: '#9F1239', iso: 'GBR', band: 'Highest' },
    { city: 'Berlin', clients: 118, color: '#DC143C', iso: 'DEU', band: 'Highest' },
    { city: 'Paris', clients: 96, color: '#E11D48', iso: 'FRA', band: 'High' },
    { city: 'Dublin', clients: 84, color: '#BE123C', iso: 'IRL', band: 'High' },
    { city: 'Luxembourg', clients: 78, color: '#F43F5E', iso: 'LUX', band: 'High' },
    { city: 'Frankfurt', clients: 64, color: '#FB7185', iso: 'DEU', band: 'Moderate' },
    { city: 'New York', clients: 58, color: '#FB7185', iso: 'USA', band: 'Moderate' },
    { city: 'Amsterdam', clients: 52, color: '#FDA4AF', iso: 'NLD', band: 'Moderate' },
    { city: 'Singapore', clients: 47, color: '#FDA4AF', iso: 'SGP', band: 'Moderate' },
    { city: 'Zurich', clients: 41, color: '#FCA5A5', iso: 'CHE', band: 'Emerging' },
    { city: 'Hong Kong', clients: 39, color: '#FCA5A5', iso: 'HKG', band: 'Emerging' },
    { city: 'Milan', clients: 36, color: '#FECACA', iso: 'ITA', band: 'Emerging' },
    { city: 'Madrid', clients: 33, color: '#FECACA', iso: 'ESP', band: 'Emerging' },
    { city: 'Sydney', clients: 31, color: '#FECACA', iso: 'AUS', band: 'Emerging' },
    { city: 'Stockholm', clients: 29, color: '#FEE2E2', iso: 'SWE', band: 'Emerging' },
    { city: 'Warsaw', clients: 27, color: '#FEE2E2', iso: 'POL', band: 'Emerging' },
  ];

  const stageOrder = ['Discovery', 'Proposal Sent', 'Negotiation'];
  const stageValuesM = stageOrder.map((stage) =>
    opportunities.filter((d) => d.stage === stage).reduce((s, d) => s + d.valueM, 0)
  );

  /* Simulated ARR trend (£m) — directionally consistent with presence rollup */
  const arrTrend = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    series: [168, 172, 175, 179, 184, 188, 192, 196, 201],
  };

  global.PHAERON_MI = {
    asOf: '2025-09-15',
    opportunities,
    openPipelineM,
    openPipelineLabel: '£' + openPipelineM.toFixed(1) + 'm',
    openDealCount: opportunities.length,
    etfPipeline,
    etfTotalK,
    etfTotalLabel: '£' + (etfTotalK / 1000).toFixed(2) + 'm',
    etfWeightedK,
    etfWeightedLabel: '£' + (etfWeightedK / 1000).toFixed(2) + 'm',
    etfDealCount: etfPipeline.length,
    network,
    presenceMarkets,
    presenceMarketCount: network.countries,
    clientHotspots,
    stageOrder,
    stageValuesM,
    arrTrend,
    colors: {
      navy: '#1B3A6B',
      navyMid: '#2F5285',
      crimson: '#9F1239',
      ink: '#0C1A2E',
      muted: '#566571',
      stages: ['#FCA5A5', '#2F5285', '#1B3A6B'],
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);

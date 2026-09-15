/* Phaeron Reporting & MI — charts + table wiring (ApexCharts + PHAERON_MI) */
(function () {
  'use strict';

  const MI = window.PHAERON_MI;
  if (!MI || typeof ApexCharts === 'undefined') return;

  const navy = MI.colors.navy;
  const navyMid = MI.colors.navyMid;
  const crimson = MI.colors.crimson;

  function fmtShort(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'bn';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'm';
    if (n >= 1e3) return (n / 1e3).toFixed(0) + 'k';
    return String(n);
  }

  function fillText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function fillKpis() {
    fillText('kpi-pipeline', MI.openPipelineLabel);
    fillText('kpi-pipeline-sub', MI.openDealCount + ' open Opportunities');
    fillText('kpi-markets', String(MI.presenceMarketCount));
    fillText('kpi-markets-sub', MI.network.corridors + ' corridors · ' + MI.network.mappedPct + '% mapped');
    fillText('kpi-volume', fmtShort(MI.network.liveTotal));
    fillText('kpi-volume-sub', 'orders · ' + MI.network.year);
    fillText('kpi-etf', MI.etfWeightedLabel);
    fillText('kpi-etf-sub', 'ETF weighted · ' + MI.etfTotalLabel + ' total');
  }

  function renderArrChart() {
    const el = document.getElementById('mi-arr-chart');
    if (!el) return;
    new ApexCharts(el, {
      chart: { type: 'area', height: 320, fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
      series: [{ name: 'Presence ARR (£m equiv.)', data: MI.arrTrend.series }],
      xaxis: { categories: MI.arrTrend.labels, labels: { style: { colors: '#566571' } } },
      yaxis: {
        labels: {
          style: { colors: '#566571' },
          formatter: (v) => '£' + v + 'm',
        },
      },
      colors: [navy],
      fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 90, 100] },
      },
      stroke: { curve: 'smooth', width: 3 },
      dataLabels: { enabled: false },
      grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
      tooltip: { y: { formatter: (v) => '£' + v + 'm' } },
    }).render();
  }

  function renderStageDonut() {
    const el = document.getElementById('mi-stage-donut');
    if (!el) return;
    new ApexCharts(el, {
      chart: { type: 'donut', height: 320, fontFamily: 'Inter, sans-serif' },
      series: MI.stageValuesM,
      labels: MI.stageOrder,
      colors: MI.colors.stages,
      legend: { position: 'bottom' },
      plotOptions: {
        pie: {
          donut: {
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Open pipeline',
                formatter: () => MI.openPipelineLabel,
              },
            },
          },
        },
      },
      dataLabels: { enabled: false },
      tooltip: { y: { formatter: (v) => '£' + v.toFixed(1) + 'm' } },
    }).render();
  }

  function renderStageBar() {
    const el = document.getElementById('mi-stage-bar');
    if (!el) return;
    new ApexCharts(el, {
      chart: { type: 'bar', height: 280, fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
      series: [{ name: 'Pipeline £m', data: MI.stageValuesM }],
      xaxis: { categories: MI.stageOrder },
      colors: [navyMid],
      plotOptions: { bar: { borderRadius: 6, columnWidth: '42%' } },
      dataLabels: { enabled: true, formatter: (v) => '£' + v.toFixed(1) + 'm' },
      grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
      tooltip: { y: { formatter: (v) => '£' + v.toFixed(1) + 'm' } },
    }).render();
  }

  function renderHotspotChart() {
    const el = document.getElementById('mi-hotspot-chart');
    if (!el) return;
    const top = MI.clientHotspots.slice(0, 8);
    new ApexCharts(el, {
      chart: { type: 'bar', height: 360, fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
      series: [{ name: 'Clients', data: top.map((h) => h.clients) }],
      xaxis: { categories: top.map((h) => h.city) },
      colors: top.map((h) => h.color),
      plotOptions: {
        bar: {
          distributed: true,
          horizontal: true,
          borderRadius: 4,
          barHeight: '70%',
        },
      },
      legend: { show: false },
      dataLabels: { enabled: true },
      grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
      tooltip: { y: { formatter: (v) => v + ' clients' } },
    }).render();
  }

  function renderPresenceArrChart() {
    const el = document.getElementById('mi-presence-arr');
    if (!el) return;
    const top = MI.presenceMarkets.slice(0, 8);
    new ApexCharts(el, {
      chart: { type: 'bar', height: 320, fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
      series: [{ name: 'ARR £m equiv.', data: top.map((m) => m.arrMGbp) }],
      xaxis: { categories: top.map((m) => m.name) },
      colors: [crimson],
      plotOptions: { bar: { borderRadius: 6, columnWidth: '48%' } },
      dataLabels: { enabled: false },
      grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
      tooltip: {
        y: {
          formatter: (v, opts) => top[opts.dataPointIndex].valueLabel,
        },
      },
    }).render();
  }

  function fillOpportunitiesTable() {
    const tbody = document.getElementById('mi-opps-body');
    if (!tbody) return;
    tbody.innerHTML = MI.opportunities
      .map(
        (d) =>
          '<tr class="border-b border-gray-200 hover:bg-gray-50">' +
          '<th scope="row" class="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">' +
          d.name +
          '</th>' +
          '<td class="px-4 py-3">' +
          d.sector +
          '</td>' +
          '<td class="px-4 py-3">' +
          d.location +
          '</td>' +
          '<td class="px-4 py-3"><span class="mi-stage mi-stage-' +
          d.stage.toLowerCase().replace(/\s+/g, '-') +
          '">' +
          d.stage +
          '</span></td>' +
          '<td class="px-4 py-3 font-semibold text-gray-900">' +
          d.valueLabel +
          '</td>' +
          '<td class="px-4 py-3">' +
          d.owner +
          '</td>' +
          '<td class="px-4 py-3 text-gray-500">' +
          d.lastActivity +
          '</td>' +
          '</tr>'
      )
      .join('');
  }

  function fillEtfTable() {
    const tbody = document.getElementById('mi-etf-body');
    if (!tbody) return;
    tbody.innerHTML = MI.etfPipeline
      .map((d) => {
        const val = d.valueK >= 1000 ? '£' + (d.valueK / 1000).toFixed(2) + 'm' : '£' + d.valueK + 'k';
        const w = Math.round((d.valueK * d.prob) / 100);
        const wLabel = w >= 1000 ? '£' + (w / 1000).toFixed(2) + 'm' : '£' + w + 'k';
        return (
          '<tr class="border-b border-gray-200 hover:bg-gray-50">' +
          '<th scope="row" class="px-4 py-3 font-medium text-gray-900">' +
          d.name +
          '</th>' +
          '<td class="px-4 py-3">' +
          d.fund +
          '</td>' +
          '<td class="px-4 py-3">' +
          d.stage +
          '</td>' +
          '<td class="px-4 py-3">' +
          d.prob +
          '%</td>' +
          '<td class="px-4 py-3 font-semibold">' +
          val +
          '</td>' +
          '<td class="px-4 py-3">' +
          wLabel +
          '</td>' +
          '<td class="px-4 py-3 text-gray-500">' +
          d.close +
          '</td>' +
          '</tr>'
        );
      })
      .join('');
    fillText('etf-total', MI.etfTotalLabel);
    fillText('etf-weighted', MI.etfWeightedLabel);
    fillText('etf-count', String(MI.etfDealCount));
  }

  function fillPresenceTable() {
    const tbody = document.getElementById('mi-presence-body');
    if (!tbody) return;
    tbody.innerHTML = MI.presenceMarkets
      .map(
        (m) =>
          '<tr class="border-b border-gray-200 hover:bg-gray-50">' +
          '<th scope="row" class="px-4 py-3 font-medium text-gray-900">' +
          m.name +
          '</th>' +
          '<td class="px-4 py-3 font-semibold">' +
          m.valueLabel +
          '</td>' +
          '<td class="px-4 py-3">' +
          m.sales +
          '</td>' +
          '<td class="px-4 py-3 text-gray-500">' +
          m.iso +
          '</td>' +
          '</tr>'
      )
      .join('');
  }

  function fillHotspotTable() {
    const tbody = document.getElementById('mi-hotspot-body');
    if (!tbody) return;
    tbody.innerHTML = MI.clientHotspots
      .map(
        (h) =>
          '<tr class="border-b border-gray-200 hover:bg-gray-50">' +
          '<th scope="row" class="px-4 py-3 font-medium text-gray-900">' +
          '<span class="mi-dot" style="background:' +
          h.color +
          '"></span>' +
          h.city +
          '</th>' +
          '<td class="px-4 py-3 font-semibold">' +
          h.clients +
          '</td>' +
          '<td class="px-4 py-3">' +
          h.band +
          '</td>' +
          '<td class="px-4 py-3 text-gray-500">' +
          h.iso +
          '</td>' +
          '</tr>'
      )
      .join('');
  }

  fillKpis();
  fillOpportunitiesTable();
  fillEtfTable();
  fillPresenceTable();
  fillHotspotTable();
  renderArrChart();
  renderStageDonut();
  renderStageBar();
  renderHotspotChart();
  renderPresenceArrChart();
})();

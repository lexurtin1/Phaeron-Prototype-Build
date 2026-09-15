/* ============================================================
   PHAERON PULSE — module sub-navigation
   Renders pill links for Market Intelligence / Studio views.
   Mount: <div id="pulse-module-subnav" data-module="market-intelligence"
              data-view="presence" data-layout="inline|floating"></div>
   ============================================================ */

(function () {
  'use strict';

  var MODULES = {
    'market-intelligence': [
      {
        id: 'presence',
        label: 'Market Presence',
        href: '/tools/network-overview/index.html',
      },
      {
        id: 'research',
        label: 'Market Research',
        href: '/tools/market-research/index.html',
      },
      {
        id: 'signals',
        label: 'Market Signals',
        href: '/tools/market-movement/index.html',
      },
    ],
    studio: [
      {
        id: 'product-demo',
        label: 'Product Demo',
        href: '/tools/product-demo/index.html',
      },
      {
        id: 'artifacts',
        label: 'Artifacts',
        href: '/tools/studio-artifacts/index.html',
      },
    ],
    'reporting-mi': [
      {
        id: 'overview',
        label: 'Overview',
        href: '/tools/reporting-mi/index.html',
      },
      {
        id: 'pipeline',
        label: 'Pipeline',
        href: '/tools/reporting-mi/pipeline.html',
      },
      {
        id: 'markets',
        label: 'Markets',
        href: '/tools/reporting-mi/markets.html',
      },
    ],
  };

  function pathMatches(href, path) {
    var base = href.replace(/\/index\.html$/, '');
    return path === href || path.indexOf(base) !== -1;
  }

  function detectActive(items, path, forced) {
    if (forced) {
      for (var i = 0; i < items.length; i++) {
        if (items[i].id === forced) return items[i].id;
      }
    }
    for (var j = 0; j < items.length; j++) {
      if (pathMatches(items[j].href, path)) return items[j].id;
    }
    return items[0] ? items[0].id : null;
  }

  function mount(el) {
    var moduleId = el.getAttribute('data-module');
    var items = MODULES[moduleId];
    if (!items || !items.length) return;

    var path = window.location.pathname || '';
    var activeId = detectActive(items, path, el.getAttribute('data-view'));
    var layout = el.getAttribute('data-layout') || 'inline';

    el.className = 'pulse-module-subnav';
    el.setAttribute('data-layout', layout);
    el.setAttribute('role', 'navigation');
    el.setAttribute('aria-label', moduleId === 'studio' ? 'Studio views' : moduleId === 'reporting-mi' ? 'Reporting and MI views' : 'Market Intelligence views');

    var html = '';
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var active = item.id === activeId ? ' is-active' : '';
      var aria = item.id === activeId ? ' aria-current="page"' : '';
      html +=
        '<a class="pulse-module-subnav__link' +
        active +
        '" href="' +
        item.href +
        '"' +
        aria +
        '>' +
        item.label +
        '</a>';
    }
    el.innerHTML = html;
  }

  function init() {
    var nodes = document.querySelectorAll('#pulse-module-subnav, [data-pulse-module-subnav]');
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* ============================================================
   PHAERON PULSE — shared navigation behaviour
   Manages the home-btn back link and any cross-tool nav state.
   Tool-specific mode switching stays in each tool's app.js.
   ============================================================ */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    /* Highlight the current tool's card on the home page if navigated back */
    const homeBtn = document.querySelector('.home-btn');
    if (homeBtn && !homeBtn.getAttribute('href')) {
      homeBtn.setAttribute('href', '../../index.html');
    }
  });
})();

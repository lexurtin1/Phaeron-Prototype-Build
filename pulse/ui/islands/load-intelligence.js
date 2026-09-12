/* auto-generated — do not edit */
(function () {
  var tags = [{"type":"link","href":"/ui/assets/pulse-ui-bT1KhpkM.js","rel":"modulepreload"},{"type":"link","href":"/ui/assets/index-CzGW6FVa.js","rel":"modulepreload"},{"type":"link","href":"/ui/assets/Triangle-DsNpnrqg.js","rel":"modulepreload"},{"type":"link","href":"/ui/assets/pulse-ui-BBTIeqSz.css","rel":"stylesheet"},{"type":"link","href":"/ui/assets/island-intelligence-DYQkMNJm.css","rel":"stylesheet"},{"type":"script","src":"/ui/islands/island-intelligence.js"}];
  tags.forEach(function (t) {
    if (t.type === 'link') {
      if (document.querySelector('link[href="' + t.href + '"]')) return;
      var l = document.createElement('link');
      l.rel = t.rel || 'stylesheet';
      l.href = t.href;
      l.crossOrigin = '';
      document.head.appendChild(l);
    } else if (t.type === 'script') {
      if (document.querySelector('script[src="' + t.src + '"]')) return;
      var s = document.createElement('script');
      s.type = 'module';
      s.src = t.src;
      s.crossOrigin = '';
      document.head.appendChild(s);
    }
  });
})();

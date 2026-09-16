/* auto-generated — do not edit */
(function () {
  var tags = [{"type":"link","href":"/ui/assets/client-DN6ZzvXO.js","rel":"modulepreload"},{"type":"link","href":"/ui/assets/index-CzGW6FVa.js","rel":"modulepreload"},{"type":"link","href":"/ui/assets/ScrollTrigger-DNECHiyU.js","rel":"modulepreload"},{"type":"link","href":"/ui/assets/FadeContent-Ct7yTj0d.js","rel":"modulepreload"},{"type":"link","href":"/ui/assets/island-globe-CsnzgsfI.css","rel":"stylesheet"},{"type":"link","href":"/ui/assets/pulse-ui-D2dUSQQZ.css","rel":"stylesheet"},{"type":"script","src":"/ui/islands/island-globe.js"}];
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

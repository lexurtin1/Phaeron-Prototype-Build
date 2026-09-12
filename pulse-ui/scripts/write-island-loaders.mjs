/**
 * After Vite build, emit stable loader scripts that inject the hashed
 * CSS/JS tags from each island HTML entry into the host page.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uiRoot = path.resolve(__dirname, '../../pulse/ui');
const islandsDir = path.join(uiRoot, 'islands');

const islands = ['nav', 'account', 'intelligence', 'globe'];

for (const name of islands) {
  const htmlPath = path.join(islandsDir, `${name}.html`);
  if (!fs.existsSync(htmlPath)) {
    console.warn('missing island html', htmlPath);
    continue;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const tags = [];
  for (const m of html.matchAll(/<link\b([^>]+)>/g)) {
    const attrs = m[1];
    const href = attrs.match(/href="([^"]+)"/)?.[1];
    const rel = attrs.match(/rel="([^"]+)"/)?.[1] || 'stylesheet';
    if (!href) continue;
    tags.push({ type: 'link', href, rel });
  }
  for (const m of html.matchAll(/<script\b([^>]*)><\/script>/g)) {
    const attrs = m[1];
    const src = attrs.match(/src="([^"]+)"/)?.[1];
    if (!src) continue;
    tags.push({ type: 'script', src });
  }

  const loader = `/* auto-generated — do not edit */
(function () {
  var tags = ${JSON.stringify(tags)};
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
`;
  fs.writeFileSync(path.join(islandsDir, `load-${name}.js`), loader);
  console.log('wrote load-' + name + '.js');
}

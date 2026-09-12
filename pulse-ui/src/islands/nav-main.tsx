import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PULSE_NAV } from '@/lib/tools';
import '@/styles/pulse-ui.css';

function detectActiveHref() {
  const path = window.location.pathname;
  const match = PULSE_NAV.find(
    (item) => path.includes(item.href.replace('/index.html', '')) || path === item.href
  );
  return match?.href ?? path;
}

function ToolNavIsland() {
  const activeHref = detectActiveHref();
  return (
    <div className="island-nav-root">
      <div className="island-nav-bar">
        <a className="island-nav-home" href="/ui/">
          ← Pulse Home
        </a>
        <nav className="island-nav-pills" aria-label="Pulse tools">
          {PULSE_NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`island-nav-pill${activeHref === item.href ? ' is-active' : ''}`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}

const el = document.getElementById('pulse-react-nav');
if (el) {
  createRoot(el).render(
    <StrictMode>
      <ToolNavIsland />
    </StrictMode>
  );
}

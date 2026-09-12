import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import PillNav from '@/bits/PillNav/PillNav';
import { PULSE_NAV } from '@/lib/tools';
import '@/styles/pulse-ui.css';

function detectActiveHref() {
  const path = window.location.pathname;
  const match = PULSE_NAV.find((item) => path.includes(item.href.replace('/index.html', '')) || path === item.href);
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
        <PillNav
          logo="/assets/phaeron-wordmark.png"
          logoAlt="Phaeron"
          items={PULSE_NAV}
          activeHref={activeHref}
          baseColor="#2d9a8e"
          pillColor="#ffffff"
          pillTextColor="#22323d"
          hoveredPillTextColor="#ffffff"
          initialLoadAnimation={false}
        />
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

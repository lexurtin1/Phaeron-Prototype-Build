import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import PillNav from '@/bits/PillNav/PillNav';
import FadeContent from '@/bits/FadeContent/FadeContent';
import GradualBlur from '@/bits/GradualBlur/GradualBlur';
import '@/styles/pulse-ui.css';

type Mode = 'orders' | 'settlements' | 'research';

const MODE_ITEMS = [
  { label: 'Orders', href: '#mode-orders', ariaLabel: 'Orders mode' },
  { label: 'Settlements', href: '#mode-settlements', ariaLabel: 'Settlements mode' },
  { label: 'Research', href: '#mode-research', ariaLabel: 'Research mode' },
];

function GlobeChrome() {
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>('orders');

  useEffect(() => {
    const loader = document.getElementById('loader');
    const markReady = () => setReady(true);

    if (!loader) {
      const t = window.setTimeout(markReady, 1200);
      return () => window.clearTimeout(t);
    }

    const obs = new MutationObserver(() => {
      const style = window.getComputedStyle(loader);
      if (style.display === 'none' || style.opacity === '0' || loader.classList.contains('done')) {
        markReady();
      }
    });
    obs.observe(loader, { attributes: true, attributeFilter: ['style', 'class'] });
    const fallback = window.setTimeout(markReady, 2800);
    return () => {
      obs.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('pulse:globe-mode', { detail: { mode } }));
  }, [mode]);

  return (
    <>
      {!ready && (
        <div className="globe-loader-veil" id="pulse-globe-veil">
          <div className="globe-loader-card">
            <GradualBlur preset="page-header" height="48px" strength={1.4} />
            <div className="label">Staging network chrome…</div>
          </div>
        </div>
      )}
      <FadeContent duration={700} delay={ready ? 0 : 400} className="globe-chrome">
        <div className="globe-mode-pills">
          <PillNav
            logo="/assets/phaeron-wordmark.png"
            logoAlt="Mode"
            items={MODE_ITEMS}
            activeHref={`#mode-${mode}`}
            baseColor="#1B3A6B"
            pillColor="#ffffff"
            pillTextColor="#22323d"
            hoveredPillTextColor="#ffffff"
            initialLoadAnimation={false}
            onMobileMenuClick={() => undefined}
          />
        </div>
      </FadeContent>
      {/* Capture mode clicks via hash changes */}
      <ModeHashBridge onMode={setMode} />
    </>
  );
}

function ModeHashBridge({ onMode }: { onMode: (m: Mode) => void }) {
  useEffect(() => {
    const apply = () => {
      const h = window.location.hash.replace('#mode-', '') as Mode;
      if (h === 'orders' || h === 'settlements' || h === 'research') onMode(h);
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, [onMode]);
  return null;
}

const el = document.getElementById('pulse-react-globe');
if (el) {
  createRoot(el).render(
    <StrictMode>
      <GlobeChrome />
    </StrictMode>
  );
}

// When ready, fade native loader if still visible
window.addEventListener('load', () => {
  window.setTimeout(() => {
    const veil = document.getElementById('pulse-globe-veil');
    if (veil) veil.classList.add('is-done');
  }, 3000);
});

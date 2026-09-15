import { ThinkingOrb } from 'thinking-orbs';
import { INTELLIGENCE_HREF } from '@/lib/tools';

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Phaeron Intelligence entry — uses thinking-orbs from Libraries.dev
 * (https://github.com/Jakubantalik/Libraries.dev) at the tuned size=64
 * avatar preset, matching the public orbs demo pill pattern. Do not CSS-scale
 * the canvas: 64/32/20 are separate designs, not a resize factor.
 */
export function IntelligenceOrbPanel() {
  const reduced = prefersReducedMotion();
  const label = 'Thinking….';

  return (
    <a
      href={INTELLIGENCE_HREF}
      className="intel-orb-panel"
      aria-label="Open Phaeron Intelligence"
    >
      <div className="intel-orb-stage" aria-hidden>
        <div className="intel-orb-pill">
          <ThinkingOrb
            state="breathing"
            size={64}
            theme="light"
            speed={reduced ? 0 : 1}
            paused={reduced}
            style={{ width: 56, height: 56 }}
          />
          <span className="intel-orb-shimmer" data-text={label}>
            {label}
          </span>
        </div>
      </div>
      <div className="intel-orb-copy">
        <h2>Phaeron Intelligence</h2>
        <p>Ask anything about Phaeron products, markets, and relationships.</p>
      </div>
    </a>
  );
}

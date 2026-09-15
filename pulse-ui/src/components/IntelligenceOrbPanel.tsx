import { ThinkingOrb } from 'thinking-orbs';
import { INTELLIGENCE_HREF } from '@/lib/tools';

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Phaeron Intelligence entry — Libraries.dev thinking-orbs at the tuned
 * size=64 avatar preset (see https://github.com/Jakubantalik/Libraries.dev).
 * Do not CSS-scale: 64/32/20 are separate designs.
 */
export function IntelligenceOrbPanel() {
  const reduced = prefersReducedMotion();

  return (
    <a
      href={INTELLIGENCE_HREF}
      className="intel-orb-panel"
      aria-label="Open Phaeron Intelligence"
    >
      <div className="intel-orb-stage" aria-hidden>
        <ThinkingOrb
          state="composing"
          size={64}
          theme="light"
          speed={reduced ? 0 : 1}
          paused={reduced}
          style={{ width: 56, height: 56 }}
        />
      </div>
      <div className="intel-orb-copy">
        <h2>Phaeron Intelligence</h2>
        <p>Ask anything about Phaeron products, markets, and relationships.</p>
      </div>
    </a>
  );
}

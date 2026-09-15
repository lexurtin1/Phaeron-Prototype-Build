import { ThinkingOrb } from 'thinking-orbs';
import { INTELLIGENCE_HREF } from '@/lib/tools';

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function IntelligenceOrbPanel() {
  const reduced = prefersReducedMotion();

  return (
    <a
      href={INTELLIGENCE_HREF}
      className="intel-orb-panel"
      aria-label="Open Phaeron Intelligence"
    >
      <div className="intel-orb-stage" aria-hidden>
        <div className="intel-orb-wash" />
        <div className="intel-orb-scale">
          <ThinkingOrb
            state="breathing"
            size={64}
            theme="light"
            speed={reduced ? 0 : 0.9}
            paused={reduced}
          />
        </div>
      </div>
      <div className="intel-orb-copy">
        <h2>Phaeron Intelligence</h2>
        <p>Ask anything about Phaeron products, markets, and relationships.</p>
      </div>
    </a>
  );
}

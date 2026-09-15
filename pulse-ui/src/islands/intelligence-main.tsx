import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThinkingOrb } from 'thinking-orbs';

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Empty-state orb for Phaeron Intelligence — same ThinkingOrb as the home panel. */
function IntelligenceEmptyOrb() {
  const reduced = prefersReducedMotion();
  return (
    <div className="intel-chat-orb" aria-hidden>
      <ThinkingOrb
        state="composing"
        size={64}
        theme="light"
        speed={reduced ? 0 : 1}
        paused={reduced}
      />
    </div>
  );
}

const el = document.getElementById('intel-empty-orb');
if (el) {
  createRoot(el).render(
    <StrictMode>
      <IntelligenceEmptyOrb />
    </StrictMode>
  );
}

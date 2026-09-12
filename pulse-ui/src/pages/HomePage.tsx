import SoftAurora from '@/bits/SoftAurora/SoftAurora';
import BlurText from '@/bits/BlurText/BlurText';
import { PulseHeader } from '@/components/PulseHeader';
import { ToolGrid } from '@/components/ToolGrid';

function greetingLabel() {
  const now = new Date();
  const h = now.getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${greeting} · ${dateStr}`;
}

export function HomePage() {
  return (
    <div className="pulse-shell">
      <div className="pulse-aurora" aria-hidden>
        <SoftAurora
          lightMode
          color1="#07111F"
          color2="#1B3A6B"
          brightness={0.95}
          speed={0.55}
          scale={1.05}
          enableMouseInteraction={false}
        />
      </div>

      <div className="pulse-shell-content">
        <PulseHeader />
        <main className="pulse-main">
          <div className="pulse-page-head">
            <div>
              <div className="pulse-eyebrow">{greetingLabel()}</div>
              <BlurText
                text="Welcome back, Alex"
                className="pulse-welcome"
                animateBy="words"
                direction="top"
                delay={80}
                stepDuration={0.32}
              />
            </div>
            <div className="live-badge">
              <span className="live-dot" />
              Network live
            </div>
          </div>
          <ToolGrid />
        </main>
      </div>
    </div>
  );
}

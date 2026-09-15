import { RadialNav } from '@/components/RadialNav';

export function PulseHeader() {
  return (
    <header className="pulse-header module-chrome">
      <div className="module-chrome-left">
        <div className="module-chrome-brand">
          <img src="/assets/phaeron-wordmark.png" alt="Phaeron" className="module-chrome-logo" />
          <span className="module-chrome-divider" aria-hidden />
          <span className="module-chrome-title">Pulse</span>
        </div>
      </div>

      <div className="module-chrome-right">
        <div className="ph-user">
          <div className="ph-user-name">
            <strong>Alex Curtin</strong>
            <span>Sales · EMEA</span>
          </div>
          <div className="ph-avatar">
            <img src="/assets/Headshot.png" alt="Alex Curtin" />
          </div>
        </div>
        <RadialNav />
      </div>
    </header>
  );
}

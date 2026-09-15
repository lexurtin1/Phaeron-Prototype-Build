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
        <a href="/tools/system-architecture/index.html" className="module-chrome-arch">
          System Architecture
        </a>
      </div>

      <div className="ph-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="7" stroke="#9aa6b0" strokeWidth="2" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="#9aa6b0" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input type="search" placeholder="Search workspaces, accounts, markets…" aria-label="Search" />
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

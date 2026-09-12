export function PulseHeader() {
  return (
    <header className="pulse-header">
      <div className="ph-brand">
        <a href="/ui/" className="ph-brand-link">
          <img src="/assets/phaeron-wordmark.png" alt="Phaeron" />
        </a>
        <span className="divider" aria-hidden />
        <span className="pulse-label">Pulse</span>
      </div>

      <a href="/tools/system-architecture/index.html" className="ph-arch-link">
        System Architecture
      </a>

      <div className="ph-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="7" stroke="#9aa6b0" strokeWidth="2" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="#9aa6b0" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input type="search" placeholder="Search workspaces, accounts, markets…" aria-label="Search" />
      </div>

      <div className="ph-user">
        <div className="ph-user-name">
          <strong>Alex Curtin</strong>
          <span>Sales · EMEA</span>
        </div>
        <div className="ph-avatar">
          <img src="/assets/Headshot.png" alt="Alex Curtin" />
        </div>
      </div>
    </header>
  );
}

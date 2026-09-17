import { RadialNav } from '@/components/RadialNav';

const MI_VIEWS = [
  { id: 'research', label: 'Market Research', href: '/tools/market-research/index.html' },
  { id: 'presence', label: 'Market Presence', href: '/tools/network-overview/index.html' },
  { id: 'signals', label: 'Market Signals', href: '/tools/market-movement/index.html' },
] as const;

type ModuleChromeProps = {
  title: string;
  /** When true, wordmark is not a link (already on home). */
  home?: boolean;
  showArchLink?: boolean;
  moduleId?: string | null;
  viewId?: string | null;
  showGestures?: boolean;
};

export function ModuleChrome({
  title,
  home = false,
  showArchLink = false,
  moduleId = null,
  viewId = null,
  showGestures = false,
}: ModuleChromeProps) {
  const brand = (
    <>
      <img src="/assets/phaeron-wordmark.png" alt="Phaeron" className="module-chrome-logo" />
      <span className="module-chrome-divider" aria-hidden />
      <span className="module-chrome-title">{title}</span>
    </>
  );

  const showMiNav = moduleId === 'market-intelligence';

  return (
    <header className="module-chrome">
      <div className="module-chrome-left">
        {home ? (
          <div className="module-chrome-brand">{brand}</div>
        ) : (
          <a className="module-chrome-brand" href="/ui/">
            {brand}
          </a>
        )}
        {showArchLink ? (
          <a href="/tools/product-demo/presentation.html" className="module-chrome-arch">
            Presentation
          </a>
        ) : null}
      </div>

      {showMiNav ? (
        <nav className="module-chrome-center" aria-label="Market Intelligence views">
          <div className="pulse-module-subnav pulse-module-subnav--chrome" data-layout="inline">
            {MI_VIEWS.map((v) => (
              <a
                key={v.id}
                href={v.href}
                className={`pulse-module-subnav__link${viewId === v.id ? ' is-active' : ''}`}
                aria-current={viewId === v.id ? 'page' : undefined}
              >
                {v.label}
              </a>
            ))}
          </div>
          {showGestures ? <div id="pulse-chrome-gestures" className="chrome-gestures-slot" /> : null}
        </nav>
      ) : showGestures ? (
        <div className="module-chrome-center">
          <div id="pulse-chrome-gestures" className="chrome-gestures-slot" />
        </div>
      ) : (
        <div className="module-chrome-center" aria-hidden />
      )}

      <div className="module-chrome-right">
        <RadialNav />
      </div>
    </header>
  );
}

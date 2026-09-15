import { RadialNav } from '@/components/RadialNav';

type ModuleChromeProps = {
  title: string;
  /** When true, wordmark is not a link (already on home). */
  home?: boolean;
  showArchLink?: boolean;
};

export function ModuleChrome({ title, home = false, showArchLink = false }: ModuleChromeProps) {
  const brand = (
    <>
      <img src="/assets/phaeron-wordmark.png" alt="Phaeron" className="module-chrome-logo" />
      <span className="module-chrome-divider" aria-hidden />
      <span className="module-chrome-title">{title}</span>
    </>
  );

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
          <a href="/tools/system-architecture/index.html" className="module-chrome-arch">
            System Architecture
          </a>
        ) : null}
      </div>
      <div className="module-chrome-right">
        <RadialNav />
      </div>
    </header>
  );
}

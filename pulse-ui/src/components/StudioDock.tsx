import Dock, { type DockItemData } from '@/bits/Dock/Dock';

function IconValueProp() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3 4.5 7.5v9L12 21l7.5-4.5v-9L12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M12 12 4.8 7.8M12 12l7.2-4.2M12 12v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconHighLevel() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 18V6M10 18V10M16 18V8M22 18H2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M4 10h6M10 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

function IconPresentation() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="18" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 16v4M8 20h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M7 10h4M7 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconArtifacts() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconProductDemo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="4.5" r="1.6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="5.5" cy="16" r="1.6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18.5" cy="16" r="1.6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 9V6.2M9.5 13.5 6.8 15.2M14.5 13.5l2.7 1.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export const STUDIO_VIEWS = [
  {
    id: 'value-prop',
    label: 'Value Prop',
    href: '/tools/value-prop/index.html',
    icon: <IconValueProp />,
  },
  {
    id: 'high-level',
    label: 'High Level',
    href: '/tools/high-level/index.html',
    icon: <IconHighLevel />,
  },
  {
    id: 'presentation',
    label: 'Presentation',
    href: '/tools/product-demo/presentation.html',
    icon: <IconPresentation />,
  },
  {
    id: 'artifacts',
    label: 'Artifacts',
    href: '/tools/studio-artifacts/index.html',
    icon: <IconArtifacts />,
  },
  {
    id: 'product-demo',
    label: 'Product Demo',
    href: '/tools/product-demo/index.html',
    icon: <IconProductDemo />,
  },
] as const;

type StudioDockProps = {
  viewId?: string | null;
};

export function StudioDock({ viewId = null }: StudioDockProps) {
  const items: DockItemData[] = STUDIO_VIEWS.map((view) => ({
    icon: view.icon,
    label: view.label,
    href: view.href,
    active: viewId === view.id,
  }));

  return (
    <Dock
      items={items}
      ariaLabel="Studio views"
      className="studio-dock"
      placement="top-left"
      panelHeight={52}
      baseItemSize={40}
      magnification={52}
      distance={120}
      dockHeight={72}
    />
  );
}

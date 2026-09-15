import { useEffect, useId, useRef, useState } from 'react';
import { animate } from 'motion';
import { RADIAL_MODULE_DESTINATIONS } from '@/lib/tools';

function HomeFabIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type RadialNavProps = {
  className?: string;
};

export function RadialNav({ className = '' }: RadialNavProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const labelId = useId();
  const closeTimer = useRef<number | null>(null);

  const clearCloseTimer = () => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openMenu = () => {
    clearCloseTimer();
    setOpen(true);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => setOpen(false), 160);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      clearCloseTimer();
    };
  }, []);

  useEffect(() => {
    const nodes = itemsRef.current.filter((n): n is HTMLAnchorElement => Boolean(n));
    if (!nodes.length) return;

    const count = nodes.length;
    // Southwest fan from top-right FAB (0° = east, 90° = south)
    const startDeg = 100;
    const endDeg = 190;
    const radius = 118;

    const targets = nodes.map((node, i) => {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const deg = startDeg + (endDeg - startDeg) * t;
      const rad = (deg * Math.PI) / 180;
      const x = Math.cos(rad) * radius;
      const y = Math.sin(rad) * radius;
      return { node, x, y };
    });

    if (open) {
      targets.forEach(({ node, x, y }, i) => {
        animate(
          node,
          { opacity: 1, transform: `translate(${x}px, ${y}px) scale(1)` } as Record<string, string | number>,
          {
            type: 'spring',
            stiffness: 380,
            damping: 22,
            delay: i * 0.04,
          }
        );
      });
    } else {
      targets.forEach(({ node }, i) => {
        animate(
          node,
          { opacity: 0, transform: 'translate(0px, 0px) scale(0.35)' } as Record<string, string | number>,
          {
            type: 'spring',
            stiffness: 420,
            damping: 28,
            delay: (targets.length - 1 - i) * 0.02,
          }
        );
      });
    }
  }, [open]);

  return (
    <div
      className={`radial-nav ${open ? 'is-open' : ''} ${className}`.trim()}
      ref={rootRef}
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
      onFocusCapture={openMenu}
      onBlurCapture={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node)) scheduleClose();
      }}
    >
      <div className="radial-nav-items" role="menu" aria-labelledby={labelId}>
        {RADIAL_MODULE_DESTINATIONS.map((dest, i) => (
          <a
            key={dest.id}
            href={dest.href}
            className="radial-nav-item"
            role="menuitem"
            title={dest.label}
            aria-label={dest.label}
            tabIndex={open ? 0 : -1}
            ref={(el) => {
              itemsRef.current[i] = el;
            }}
            style={{ opacity: 0, transform: 'translate(0px, 0px) scale(0.35)' }}
          >
            <span className="radial-nav-item-icon">{dest.icon}</span>
          </a>
        ))}
      </div>
      <a
        id={labelId}
        href="/ui/"
        className="radial-nav-fab"
        aria-label="Home"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          // Allow navigation home; keep hover fan for modules
          if (open) e.stopPropagation();
        }}
      >
        <HomeFabIcon />
      </a>
    </div>
  );
}

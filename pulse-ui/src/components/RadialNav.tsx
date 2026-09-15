import { useEffect, useId, useRef, useState } from 'react';
import { animate } from 'motion';
import { RADIAL_DESTINATIONS } from '@/lib/tools';

function LocationFabIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.8" />
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  }, []);

  useEffect(() => {
    const nodes = itemsRef.current.filter((n): n is HTMLAnchorElement => Boolean(n));
    if (!nodes.length) return;

    const count = nodes.length;
    const startDeg = -200;
    const endDeg = -20;
    const radius = 108;

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
    <div className={`radial-nav ${open ? 'is-open' : ''} ${className}`.trim()} ref={rootRef}>
      <div className="radial-nav-items" role="menu" aria-labelledby={labelId}>
        {RADIAL_DESTINATIONS.map((dest, i) => (
          <a
            key={dest.id}
            href={dest.href}
            className="radial-nav-item"
            role="menuitem"
            title={dest.label}
            aria-label={dest.label}
            ref={(el) => {
              itemsRef.current[i] = el;
            }}
            style={{ opacity: 0, transform: 'translate(0px, 0px) scale(0.35)' }}
          >
            <span className="radial-nav-item-icon">{dest.icon}</span>
          </a>
        ))}
      </div>
      <button
        type="button"
        id={labelId}
        className="radial-nav-fab"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        onClick={() => setOpen((v) => !v)}
      >
        <LocationFabIcon />
      </button>
    </div>
  );
}

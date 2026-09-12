import GlassSurface from '@/bits/GlassSurface/GlassSurface';
import PillNav from '@/bits/PillNav/PillNav';
import { PULSE_NAV } from '@/lib/tools';

type PulseHeaderProps = {
  activeHref?: string;
  compact?: boolean;
};

export function PulseHeader({ activeHref = '/ui/', compact = false }: PulseHeaderProps) {
  return (
    <div className="pulse-header-wrap">
      <GlassSurface
        width="100%"
        height="auto"
        borderRadius={18}
        backgroundOpacity={0.12}
        blur={12}
        brightness={78}
        opacity={0.92}
        className="pulse-glass-header"
        style={{ width: '100%', maxWidth: 1264, margin: '0 auto' }}
      >
        <div className="pulse-header-inner">
          <a className="pulse-header-brand" href="/ui/">
            <img src="/assets/phaeron-wordmark.png" alt="Phaeron" />
            <span className="pulse-label">Pulse</span>
          </a>

          {!compact && (
            <div className="pulse-header-nav">
              <PillNav
                logo="/assets/phaeron-wordmark.png"
                logoAlt="Phaeron"
                items={PULSE_NAV}
                activeHref={activeHref}
                baseColor="#2d9a8e"
                pillColor="#ffffff"
                pillTextColor="#22323d"
                hoveredPillTextColor="#ffffff"
                initialLoadAnimation={false}
                className="pulse-pill-nav"
              />
            </div>
          )}

          <div className="pulse-header-user">
            <div className="meta">
              <strong>Alex Curtin</strong>
              <span>Sales · EMEA</span>
            </div>
            <img src="/assets/Headshot.png" alt="Alex Curtin" />
          </div>
        </div>
      </GlassSurface>
    </div>
  );
}

import type { ReactNode } from 'react';

export type PulseTool = {
  id: string;
  num: string;
  title: string;
  description: ReactNode;
  href: string;
  icon: ReactNode;
};

export type NavDestination = {
  id: string;
  label: string;
  href: string;
  icon: ReactNode;
};

type IconProps = { size?: number };

export function NetworkIcon({ size = 54 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="24" cy="24" r="14" stroke="#c3cdd5" strokeWidth="1.4" />
      <ellipse cx="24" cy="24" rx="6" ry="14" stroke="#dde4ea" strokeWidth="1.2" />
      <line x1="10" y1="24" x2="38" y2="24" stroke="#dde4ea" strokeWidth="1.2" />
      <path
        d="M11 29 Q24 7 37 25"
        stroke="#1B3A6B"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray="1.5 5"
        className="icon-dash"
      />
      <path
        d="M13 32 Q26 18 38 31"
        stroke="#2F5285"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray="1.5 5"
        className="icon-dash-slow"
      />
      <circle cx="11" cy="29" r="2" fill="#1B3A6B" />
      <circle cx="37" cy="25" r="2" fill="#2F5285" />
      <circle cx="38" cy="31" r="2" fill="#9F1239" />
    </svg>
  );
}

export function DemoIcon({ size = 54 }: IconProps) {
  const gid = `csHub-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1B3A6B" />
          <stop offset="1" stopColor="#2F5285" />
        </linearGradient>
      </defs>
      <line x1="24" y1="24" x2="24" y2="11" stroke="#dde4ea" strokeWidth="1.3" />
      <line x1="24" y1="24" x2="13.5" y2="30" stroke="#dde4ea" strokeWidth="1.3" />
      <line x1="24" y1="24" x2="34.5" y2="30" stroke="#dde4ea" strokeWidth="1.3" />
      <polygon points="24,7 20.54,9 20.54,13 24,15 27.46,13 27.46,9" fill="none" stroke="#5B7AAB" strokeWidth="1.4" />
      <polygon
        points="13.5,26 10.04,28 10.04,32 13.5,34 16.96,32 16.96,28"
        fill="none"
        stroke="#5B7AAB"
        strokeWidth="1.4"
      />
      <polygon
        points="34.5,26 31.04,28 31.04,32 34.5,34 37.96,32 37.96,28"
        fill="none"
        stroke="#5B7AAB"
        strokeWidth="1.4"
      />
      <polygon
        points="24,17.5 18.37,20.75 18.37,27.25 24,30.5 29.63,27.25 29.63,20.75"
        fill={`url(#${gid})`}
        stroke="#132743"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function IntelligenceIcon({ size = 54 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M13 8 H27 L33 14 V36 a2 2 0 0 1 -2 2 H13 a2 2 0 0 1 -2 -2 V10 a2 2 0 0 1 2 -2 Z"
        fill="#ffffff"
        stroke="#9aa6b0"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M27 8 V14 H33" stroke="#9aa6b0" strokeWidth="1.4" strokeLinejoin="round" fill="none" />
      <line x1="15.5" y1="18.5" x2="25.5" y2="18.5" stroke="#dde4ea" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="15.5" y1="22.5" x2="28.5" y2="22.5" stroke="#dde4ea" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="15.5" y1="26.5" x2="22" y2="26.5" stroke="#dde4ea" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="29.5" cy="30.5" r="6.5" fill="#ffffff" stroke="#1B3A6B" strokeWidth="1.9" />
      <line x1="34.4" y1="35.4" x2="39" y2="40" stroke="#1B3A6B" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

export function AccountsIcon({ size = 54 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="17" cy="15" r="5.5" stroke="#9aa6b0" strokeWidth="1.5" />
      <path d="M8 35 C8 27 26 27 26 35" stroke="#9aa6b0" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <polyline
        points="20,32 25,27 29,29 33,21.5 37,24 41,16"
        stroke="#1B3A6B"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="41" cy="16" r="2.2" fill="#2F5285" />
    </svg>
  );
}

export function ReportingIcon({ size = 54 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect x="9" y="9" width="30" height="30" rx="4" stroke="#c3cdd5" strokeWidth="1.4" />
      <line x1="14" y1="34" x2="34" y2="34" stroke="#dde4ea" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="14" y="22" width="4.5" height="12" rx="1.2" fill="#B8C7DE" />
      <rect x="21.5" y="16" width="4.5" height="18" rx="1.2" fill="#2F5285" />
      <rect x="29" y="12" width="4.5" height="22" rx="1.2" fill="#1B3A6B" />
      <circle cx="31.25" cy="12" r="2" fill="#9F1239" />
    </svg>
  );
}

export function HomeNavIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z"
        stroke="#1B3A6B"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Cards shown in the home 2×2 grid (Intelligence is the orb panel). */
export const PULSE_CARD_TOOLS: PulseTool[] = [
  {
    id: 'opportunities',
    num: '01',
    title: 'Opportunities',
    description: 'Account intelligence and SAMI packs for each client.',
    href: '/tools/account-tracker/index.html',
    icon: <AccountsIcon />,
  },
  {
    id: 'market-intelligence',
    num: '02',
    title: 'Market Intelligence',
    description: 'Market presence, research, and live signals across the globe.',
    href: '/tools/network-overview/index.html',
    icon: <NetworkIcon />,
  },
  {
    id: 'reporting-mi',
    num: '03',
    title: 'Reporting and MI',
    description: 'Leadership KPIs for pipeline, presence, and network performance.',
    href: '/tools/reporting-mi/index.html',
    icon: <ReportingIcon />,
  },
  {
    id: 'studio',
    num: '04',
    title: 'Studio',
    description: 'Branded reports, presentations, diagrams, and team updates.',
    href: '/tools/product-demo/index.html',
    icon: <DemoIcon />,
  },
];

export const INTELLIGENCE_HREF = '/tools/phaeron-intelligence/index.html';

/** @deprecated Use PULSE_CARD_TOOLS for the home grid. Kept for any legacy imports. */
export const PULSE_TOOLS: PulseTool[] = [
  ...PULSE_CARD_TOOLS,
  {
    id: 'intelligence',
    num: '05',
    title: 'Phaeron Intelligence',
    description: 'Ask anything about your company — markets, clients, and relationships.',
    href: INTELLIGENCE_HREF,
    icon: <IntelligenceIcon />,
  },
];

export const RADIAL_DESTINATIONS: NavDestination[] = [
  { id: 'home', label: 'Home', href: '/ui/', icon: <HomeNavIcon size={20} /> },
  { id: 'opportunities', label: 'Opportunities', href: '/tools/account-tracker/index.html', icon: <AccountsIcon size={22} /> },
  {
    id: 'market-intelligence',
    label: 'Market Intelligence',
    href: '/tools/network-overview/index.html',
    icon: <NetworkIcon size={22} />,
  },
  { id: 'reporting-mi', label: 'Reporting and MI', href: '/tools/reporting-mi/index.html', icon: <ReportingIcon size={22} /> },
  { id: 'studio', label: 'Studio', href: '/tools/product-demo/index.html', icon: <DemoIcon size={22} /> },
  { id: 'intelligence', label: 'Phaeron Intelligence', href: INTELLIGENCE_HREF, icon: <IntelligenceIcon size={22} /> },
];

/** Fan destinations (FAB itself is Home). */
export const RADIAL_MODULE_DESTINATIONS: NavDestination[] = RADIAL_DESTINATIONS.filter((d) => d.id !== 'home');

export const PULSE_NAV = [
  { label: 'Home', href: '/ui/' },
  { label: 'Opportunities', href: '/tools/account-tracker/index.html' },
  { label: 'Market Intelligence', href: '/tools/network-overview/index.html' },
  { label: 'Reporting', href: '/tools/reporting-mi/index.html' },
  { label: 'Studio', href: '/tools/product-demo/index.html' },
  { label: 'Intelligence', href: INTELLIGENCE_HREF },
];

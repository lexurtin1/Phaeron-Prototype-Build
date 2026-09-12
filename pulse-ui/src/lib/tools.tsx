import type { ReactNode } from 'react';

export type PulseTool = {
  id: string;
  num: string;
  title: string;
  description: ReactNode;
  href: string;
  icon: ReactNode;
};

function NetworkIcon() {
  return (
    <svg width="54" height="54" viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="24" cy="24" r="14" stroke="#c3cdd5" strokeWidth="1.4" />
      <ellipse cx="24" cy="24" rx="6" ry="14" stroke="#dde4ea" strokeWidth="1.2" />
      <line x1="10" y1="24" x2="38" y2="24" stroke="#dde4ea" strokeWidth="1.2" />
      <path
        d="M11 29 Q24 7 37 25"
        stroke="#9F1239"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray="1.5 5"
        className="icon-dash"
      />
      <path
        d="M13 32 Q26 18 38 31"
        stroke="#7A1233"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray="1.5 5"
        className="icon-dash-slow"
      />
      <circle cx="11" cy="29" r="2" fill="#1B3A6B" />
      <circle cx="37" cy="25" r="2" fill="#9F1239" />
      <circle cx="38" cy="31" r="2" fill="#7A1233" />
    </svg>
  );
}

function ResearchIcon() {
  return (
    <svg width="54" height="54" viewBox="0 0 48 48" fill="none" aria-hidden>
      <defs>
        <clipPath id="csHeat">
          <circle cx="24" cy="24" r="14" />
        </clipPath>
      </defs>
      <g clipPath="url(#csHeat)">
        <rect x="8" y="8" width="14" height="12" rx="3" fill="#E4EAF3" />
        <rect x="22" y="8" width="18" height="10" rx="3" fill="#5B7AAB" />
        <rect x="8" y="20" width="12" height="20" rx="3" fill="#1B3A6B" />
        <rect x="20" y="18" width="11" height="12" rx="3" fill="#9F1239" />
        <rect x="30" y="18" width="12" height="22" rx="3" fill="#B8C7DE" />
        <rect x="20" y="30" width="11" height="12" rx="3" fill="#7A1233" />
      </g>
      <circle cx="24" cy="24" r="14" stroke="#c3cdd5" strokeWidth="1.4" />
      <ellipse cx="24" cy="24" rx="6" ry="14" stroke="#ffffff" strokeOpacity=".55" strokeWidth="1" />
      <line x1="10" y1="24" x2="38" y2="24" stroke="#ffffff" strokeOpacity=".55" strokeWidth="1" />
    </svg>
  );
}

function DemoIcon() {
  return (
    <svg width="54" height="54" viewBox="0 0 48 48" fill="none" aria-hidden>
      <defs>
        <linearGradient id="csHub" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1B3A6B" />
          <stop offset="1" stopColor="#7A1233" />
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
        fill="url(#csHub)"
        stroke="#132743"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function MarketplaceIcon() {
  return (
    <svg width="54" height="54" viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect x="9" y="9" width="30" height="30" rx="4" stroke="#c3cdd5" strokeWidth="1.4" />
      <path d="M24 20 V13" stroke="#9F1239" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M28 24 H35" stroke="#9F1239" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M24 28 V35" stroke="#1B3A6B" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20 24 H13" stroke="#1B3A6B" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20 20 H15.5 V15.5" stroke="#7A1233" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M28 28 H32.5 V32.5" stroke="#7A1233" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="19.5" y="19.5" width="9" height="9" rx="1.6" fill="#E4EAF3" stroke="#1B3A6B" strokeWidth="1.3" />
      <circle cx="24" cy="13" r="2" fill="#9F1239" />
      <circle cx="35" cy="24" r="2" fill="#9F1239" />
      <circle cx="24" cy="35" r="2" fill="#1B3A6B" />
      <circle cx="13" cy="24" r="2" fill="#1B3A6B" />
      <circle cx="15.5" cy="15.5" r="1.8" fill="#7A1233" />
      <circle cx="32.5" cy="32.5" r="1.8" fill="#7A1233" />
    </svg>
  );
}

function IntelligenceIcon() {
  return (
    <svg width="54" height="54" viewBox="0 0 48 48" fill="none" aria-hidden>
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
      <circle cx="29.5" cy="30.5" r="6.5" fill="#ffffff" stroke="#9F1239" strokeWidth="1.9" />
      <line x1="34.4" y1="35.4" x2="39" y2="40" stroke="#9F1239" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

function MovementIcon() {
  return (
    <svg width="54" height="54" viewBox="0 0 48 48" fill="none" aria-hidden>
      <defs>
        <linearGradient id="csHubMove" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1B3A6B" />
          <stop offset="1" stopColor="#7A1233" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="11" stroke="#9F1239" strokeWidth="1.6" className="icon-pulse" />
      <circle cx="24" cy="24" r="11" stroke="#7A1233" strokeWidth="1.6" className="icon-pulse icon-pulse-2" />
      <circle cx="24" cy="24" r="11" stroke="#1B3A6B" strokeWidth="1.6" className="icon-pulse icon-pulse-3" />
      <circle cx="24" cy="24" r="5.5" fill="url(#csHubMove)" />
      <ellipse cx="24" cy="24" rx="2.4" ry="5.5" stroke="#ffffff" strokeOpacity=".55" strokeWidth="1" />
      <line x1="18.5" y1="24" x2="29.5" y2="24" stroke="#ffffff" strokeOpacity=".55" strokeWidth="1" />
    </svg>
  );
}

function AccountsIcon() {
  return (
    <svg width="54" height="54" viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="17" cy="15" r="5.5" stroke="#9aa6b0" strokeWidth="1.5" />
      <path d="M8 35 C8 27 26 27 26 35" stroke="#9aa6b0" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <polyline
        points="20,32 25,27 29,29 33,21.5 37,24 41,16"
        stroke="#9F1239"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="41" cy="16" r="2.2" fill="#7A1233" />
    </svg>
  );
}

export const PULSE_TOOLS: PulseTool[] = [
  {
    id: 'network',
    num: '01',
    title: 'Network Overview',
    description: (
      <>
        <strong className="tool-em">273.3m</strong> orders across <strong className="tool-em">51</strong> countries in
        2025.
      </>
    ),
    href: '/tools/network-overview/index.html',
    icon: <NetworkIcon />,
  },
  {
    id: 'research',
    num: '02',
    title: 'Market Research',
    description: 'Opportunity scores by country and market maturity.',
    href: '/tools/market-research/index.html',
    icon: <ResearchIcon />,
  },
  {
    id: 'demo',
    num: '03',
    title: 'Product Demo',
    description: 'Interactive Hub & Spoke network architecture.',
    href: '/tools/product-demo/index.html',
    icon: <DemoIcon />,
  },
  {
    id: 'marketplace',
    num: '04',
    title: 'Agent Marketplace',
    description: 'Set up AI agents for email, CRM, and meeting prep.',
    href: '/ui/marketplace.html',
    icon: <MarketplaceIcon />,
  },
  {
    id: 'intelligence',
    num: '05',
    title: 'Phaeron Intelligence',
    description: 'Ask anything about Phaeron products and markets.',
    href: '/tools/phaeron-intelligence/index.html',
    icon: <IntelligenceIcon />,
  },
  {
    id: 'movement',
    num: '06',
    title: 'Market Movement',
    description: 'Live regulatory signals and competitor movements by country.',
    href: '/tools/market-movement/index.html',
    icon: <MovementIcon />,
  },
  {
    id: 'accounts',
    num: '07',
    title: 'Account Tracker',
    description: 'Daily intelligence dossiers on your Salesforce accounts.',
    href: '/tools/account-tracker/index.html',
    icon: <AccountsIcon />,
  },
];

export const PULSE_NAV = [
  { label: 'Home', href: '/ui/' },
  { label: 'Network', href: '/tools/network-overview/index.html' },
  { label: 'Research', href: '/tools/market-research/index.html' },
  { label: 'Intelligence', href: '/tools/phaeron-intelligence/index.html' },
  { label: 'Accounts', href: '/tools/account-tracker/index.html' },
  { label: 'Agents', href: '/ui/marketplace.html' },
];

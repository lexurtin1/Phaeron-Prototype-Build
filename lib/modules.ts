export type PulseModuleStatus = 'live' | 'coming-soon'

export interface PulseModule {
  id: string
  name: string
  description: string
  status: PulseModuleStatus
  prototypePath: string
}

export const PULSE_MODULES: PulseModule[] = [
  {
    id: 'network-overview',
    name: 'Network Overview',
    description: 'Global order-routing network visualisation.',
    status: 'live',
    prototypePath: '/pulse/tools/network-overview/',
  },
  {
    id: 'market-research',
    name: 'Market Research',
    description: 'Market research workspace.',
    status: 'live',
    prototypePath: '/pulse/tools/market-research/',
  },
  {
    id: 'product-demo',
    name: 'Product Demo',
    description: 'Product walkthrough demo.',
    status: 'live',
    prototypePath: '/pulse/tools/product-demo/',
  },
  {
    id: 'account-tracker',
    name: 'Account Tracker',
    description: 'Account and opportunity tracking.',
    status: 'live',
    prototypePath: '/pulse/tools/account-tracker/',
  },
  {
    id: 'agent-marketplace',
    name: 'Agent Marketplace',
    description: 'Marketplace of internal AI agents.',
    status: 'coming-soon',
    prototypePath: '/pulse/tools/agent-marketplace/',
  },
  {
    id: 'calastone-intelligence',
    name: 'Calastone Intelligence',
    description: 'Cross-market intelligence briefings.',
    status: 'coming-soon',
    prototypePath: '/pulse/tools/calastone-intelligence/',
  },
  {
    id: 'market-movement',
    name: 'Market Movement',
    description: 'Global regulatory, competitor and market signal tracking.',
    status: 'live',
    prototypePath: '/pulse/tools/market-movement/',
  },
]

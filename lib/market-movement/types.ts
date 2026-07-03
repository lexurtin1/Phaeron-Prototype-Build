// Brazil drilldown data model

export type ClientType = 'Distributor' | 'ThirdPartyAdministrator' | 'FundManager'
export type AccountStatus = 'Live' | 'InDiscussions' | 'Prospect' | 'Disabled'
export type MarkerShape = 'circle' | 'triangle' | 'hexagon'

export interface BrazilAccount {
  id: string
  name: string
  clientTypes: ClientType[]
  primaryShape: MarkerShape
  status: AccountStatus
  temperatureScore: number // 0-100
  lat: number
  lon: number
  city: string
  openOpportunityCount: number
  openOpportunityValue: number
  latestSignal?: {
    headline: string
    date: string
    source: 'Salesforce' | 'Notion' | 'Document' | 'News' | 'Regulator'
  }
  owner: string
}

export type BrazilSignalSourceType = 'regulatory' | 'competitor' | 'news' | 'account' | 'document'

export interface BrazilSignal {
  id: string
  timestamp: string
  sourceType: BrazilSignalSourceType
  headline: string
  summary: string
  relatedAccountId?: string
  priority: 1 | 2 | 3
}

// Global (existing) alert feed — typed port of ALERT_EVENTS / COUNTRY_DETAILS
// from pulse/tools/market-movement/index.html.

export type GlobalEventCategory = 'regulatory' | 'competitor' | 'market' | 'call'
export type GlobalEventSeverity = 'high' | 'med' | 'low'
export type GlobalRegion = 'emea' | 'americas' | 'asia' | 'australia'

export interface GlobalAlertEvent {
  eid: string
  iso: string
  flag: string
  cty: string
  city: string
  lat: number
  lng: number
  cat: GlobalEventCategory
  type: string
  sev: GlobalEventSeverity
  days: number
  region: GlobalRegion
  source: { name: string; url: string }
  summary: string
  details: {
    what: string
    why: string
    facts: string[]
  }
  author?: {
    initials: string
    name: string
    role: string
  }
}

export interface CountryDetail {
  name: string
  flag: string
  region: string
  corridors: number
  monthlyOrders: string
  topConnections: string[]
  competitors: string[]
  opportunity: 'High' | 'Medium'
  oppNote: string
  status: string
}

export type MapMode = 'global' | 'brazil'
export type FeedScope = 'global' | 'brazil'

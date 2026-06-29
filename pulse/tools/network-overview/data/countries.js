const COUNTRY_DATA = {

  "GBR": {
    country:"United Kingdom", iso3:"GBR", region:"Europe", subregion:"Northern Europe",
    market_classification:"Developed",
    central_hub_status:"Full hub", hub_name:"Calastone Network", operator:"Calastone",
    opportunity_score:38, automation_rate_estimate:95,
    priority_tier:"Tier 1", existing_network_presence:"Established",
    market_aum_band:"£1.5T+ funds under routing",
    mutual_fund_relevance:"Largest retail and platform fund-flow pool in Europe.",
    growth_signal:"Mature and stable; incremental growth in ETF and tokenised-fund rails.",
    dominant_order_model:"Centralised automated order routing.",
    current_order_channels:"Calastone network and EMX/Euroclear; residual legacy fax tail.",
    manuality_snapshot:"~95% of order routing automated; manual processing minimal.",
    regulatory_openness:"High — FCA supportive of infrastructure modernisation.",
    risks_or_barriers:"Market saturation; volume growth limited; EMX/Euroclear contest the margin tail.",
    flow_image:"",
    flow_diagram:[
      {label:"Investor / Adviser", mode:"auto"},
      {label:"Platform", mode:"auto"},
      {label:"Calastone Network", mode:"auto"},
      {label:"Transfer Agent", mode:"auto"},
      {label:"Fund Manager", mode:"auto"}
    ],
    last_updated:"2025-05-28"
  },

  "AUS": {
    country:"Australia", iso3:"AUS", region:"Oceania", subregion:"Australia & NZ",
    market_classification:"Developed",
    central_hub_status:"Partial hub", hub_name:"Fragmented (registry/platform led)", operator:"Multiple registries & platforms",
    opportunity_score:78, automation_rate_estimate:55,
    priority_tier:"Tier 1", existing_network_presence:"Emerging",
    market_aum_band:"A$3.9T+ superannuation & managed funds",
    mutual_fund_relevance:"Large managed-funds and superannuation market with structural automation gaps.",
    growth_signal:"Superannuation system compounding; rising appetite for efficiency.",
    dominant_order_model:"Mixed registry-led and bilateral processing; no single dominant hub.",
    current_order_channels:"Registry portals, bilateral file transfer, partial automation.",
    manuality_snapshot:"Estimated ~55% automated; large flows remain semi-manual across registries.",
    regulatory_openness:"Moderate-high — efficiency agenda politically supported.",
    risks_or_barriers:"Entrenched registry incumbents; slow super-fund procurement; localisation effort required.",
    flow_image:"",
    flow_diagram:[
      {label:"Investor", mode:"auto"},
      {label:"Platform / Adviser", mode:"mixed"},
      {label:"Registry", mode:"manual"},
      {label:"Fund Administrator", mode:"manual"},
      {label:"Fund Manager", mode:"mixed"}
    ],
    last_updated:"2025-05-28"
  },

  "BRA": {
    country:"Brazil", iso3:"BRA", region:"Americas", subregion:"South America",
    market_classification:"Emerging",
    central_hub_status:"No central hub", hub_name:"—", operator:"Bilateral; bank-vertical infrastructure (B3 settlement)",
    opportunity_score:83, automation_rate_estimate:35,
    priority_tier:"Tier 1", existing_network_presence:"Emerging",
    market_aum_band:"~R$10.8T (~USD 1.7T) — 4th largest fund industry globally",
    mutual_fund_relevance:"Fourth-largest fund market globally; ~34,000 funds, bank-dominated distribution.",
    growth_signal:"Strong; CVM 175 reform forcing role separation and opening cross-border distribution.",
    dominant_order_model:"Bilateral and manual; fax, email, CSV and portal re-keying dominate.",
    current_order_channels:"Bank platforms (Itau, Bradesco, BB, Santander), XP/BTG platforms, IFAs; no neutral routing utility.",
    manuality_snapshot:"Low-moderate automation; high within bank groups, very low for cross-border and IFA flows.",
    regulatory_openness:"High — CVM 175 mandate (June 2025 deadline) actively opening the market.",
    risks_or_barriers:"Bank vertical integration suppresses demand for neutral routing; no ISO 20022 fund messaging in domestic use.",
    flow_image:"",
    flow_diagram:[
      {label:"Distributor / Bank / IFA", mode:"manual"},
      {label:"Fund Administrator / TA", mode:"manual"},
      {label:"Asset Manager", mode:"mixed"},
      {label:"Custodian Bank", mode:"mixed"},
      {label:"B3 Settlement", mode:"auto"}
    ],
    last_updated:"2026-06"
  },

  "SGP": {
    country:"Singapore", iso3:"SGP", region:"Asia", subregion:"South-East Asia",
    market_classification:"Developed",
    central_hub_status:"Partial hub", hub_name:"Regional gateway", operator:"Multiple; MAS-supportive infrastructure",
    opportunity_score:74, automation_rate_estimate:70,
    priority_tier:"Tier 1", existing_network_presence:"Emerging",
    market_aum_band:"Major regional AUM gateway",
    mutual_fund_relevance:"Regional distribution and fund-domicile hub for Asian flows.",
    growth_signal:"Strong; positioning as the Asian wealth and fund hub.",
    dominant_order_model:"Gateway model routing into multiple Asian markets.",
    current_order_channels:"Mix of network, custodian and platform rails feeding the region.",
    manuality_snapshot:"Estimated ~70% automated; cross-border Asian flows carry friction.",
    regulatory_openness:"Very high — MAS actively courts fintech infrastructure.",
    risks_or_barriers:"Competitive infrastructure landscape; must add value beyond MAS-backed initiatives.",
    flow_image:"",
    flow_diagram:[
      {label:"Investor", mode:"auto"},
      {label:"Private Bank / Platform", mode:"auto"},
      {label:"Regional Gateway", mode:"mixed"},
      {label:"Custodian / TA", mode:"mixed"},
      {label:"Fund", mode:"auto"}
    ],
    last_updated:"2025-05-28"
  },

  "HKG": {
    country:"Hong Kong", iso3:"HKG", region:"Asia", subregion:"East Asia",
    market_classification:"Developed",
    central_hub_status:"Partial hub", hub_name:"China-connect gateway", operator:"Local infrastructure + connect schemes",
    opportunity_score:66, automation_rate_estimate:68,
    priority_tier:"Tier 2", existing_network_presence:"Emerging",
    market_aum_band:"Large distribution / Greater China gateway",
    mutual_fund_relevance:"Gateway to Greater China fund flows with a large distribution base.",
    growth_signal:"Tied to China-access dynamics and connect schemes.",
    dominant_order_model:"Distribution-led, connect-scheme dependent.",
    current_order_channels:"Bank distribution, connect schemes, bilateral.",
    manuality_snapshot:"Estimated ~68% automated across cross-border distribution.",
    regulatory_openness:"Moderate — capable but policy-sensitive.",
    risks_or_barriers:"Geopolitical sensitivity; China-policy dependence; Singapore competes for the hub role.",
    flow_image:"",
    flow_diagram:[
      {label:"Investor", mode:"auto"},
      {label:"Bank Distribution", mode:"mixed"},
      {label:"Connect Scheme", mode:"mixed"},
      {label:"Custodian", mode:"mixed"},
      {label:"Fund (Mainland)", mode:"manual"}
    ],
    last_updated:"2025-05-28"
  },

  "JPN": {
    country:"Japan", iso3:"JPN", region:"Asia", subregion:"East Asia",
    market_classification:"Developed",
    central_hub_status:"No central hub", hub_name:"—", operator:"Fragmented domestic intermediaries",
    opportunity_score:70, automation_rate_estimate:45,
    priority_tier:"Tier 2", existing_network_presence:"None",
    market_aum_band:"Among the largest savings pools globally",
    mutual_fund_relevance:"Very large savings pool, historically domestic and paper-heavy.",
    growth_signal:"Reform-driven; NISA expansion increasing retail fund adoption.",
    dominant_order_model:"Fragmented, intermediary-heavy, significant manual processing.",
    current_order_channels:"Bank and broker channels; heavy bilateral and manual operations.",
    manuality_snapshot:"Estimated ~45% automated; high manual processing across intermediaries.",
    regulatory_openness:"Moderate — reform-minded but slow-moving.",
    risks_or_barriers:"Language, entrenched intermediaries, conservative procurement, long sales cycles.",
    flow_image:"",
    flow_diagram:[
      {label:"Investor", mode:"auto"},
      {label:"Bank / Broker", mode:"manual"},
      {label:"Intermediary", mode:"manual"},
      {label:"Custodian", mode:"manual"},
      {label:"Fund", mode:"mixed"}
    ],
    last_updated:"2025-05-28"
  },

  "USA": {
    country:"United States", iso3:"USA", region:"Americas", subregion:"North America",
    market_classification:"Developed",
    central_hub_status:"Full hub", hub_name:"Domestic clearing utility", operator:"Incumbent US clearing infrastructure",
    opportunity_score:30, automation_rate_estimate:92,
    priority_tier:"Tier 3", existing_network_presence:"None",
    market_aum_band:"Largest fund market globally",
    mutual_fund_relevance:"World's largest fund market, operating on its own domestic clearing rails.",
    growth_signal:"Mature; highly automated on domestic infrastructure.",
    dominant_order_model:"Centralised domestic clearing utility.",
    current_order_channels:"Entrenched domestic clearing; minimal open routing gap.",
    manuality_snapshot:"Estimated ~92% automated; little manual processing remains.",
    regulatory_openness:"Moderate — open but incumbent-protected by network effects.",
    risks_or_barriers:"Dominant domestic utility; little friction to monetise; high cost to contest.",
    flow_image:"",
    flow_diagram:[
      {label:"Investor", mode:"auto"},
      {label:"Broker / Platform", mode:"auto"},
      {label:"Clearing Utility", mode:"auto"},
      {label:"Transfer Agent", mode:"auto"},
      {label:"Fund", mode:"auto"}
    ],
    last_updated:"2025-05-28"
  },

  "LUX": {
    country:"Luxembourg", iso3:"LUX", region:"Europe", subregion:"Western Europe",
    market_classification:"Developed",
    central_hub_status:"Partial hub", hub_name:"Cross-border distribution centre", operator:"Transfer agents & global custodians",
    opportunity_score:64, automation_rate_estimate:80,
    priority_tier:"Tier 1", existing_network_presence:"Established",
    market_aum_band:"Largest cross-border fund domicile",
    mutual_fund_relevance:"Cross-border fund-domicile centre for global UCITS distribution.",
    growth_signal:"Steady; the conduit for global UCITS distribution.",
    dominant_order_model:"Transfer-agent-centric cross-border distribution.",
    current_order_channels:"Transfer agents, global custodians, network rails.",
    manuality_snapshot:"Estimated ~80% automated; cross-border TA flows carry some friction.",
    regulatory_openness:"High — infrastructure-friendly and distribution-oriented.",
    risks_or_barriers:"Entrenched transfer agents; relationship-led; value must be incremental over existing TA automation.",
    flow_image:"",
    flow_diagram:[
      {label:"Distributor (global)", mode:"auto"},
      {label:"Transfer Agent", mode:"auto"},
      {label:"Cross-border Hub", mode:"mixed"},
      {label:"Custodian", mode:"auto"},
      {label:"UCITS Fund", mode:"auto"}
    ],
    last_updated:"2025-05-28"
  },

  "IND": {
    country:"India", iso3:"IND", region:"Asia", subregion:"South Asia",
    market_classification:"Emerging",
    central_hub_status:"Partial hub", hub_name:"RTA-centric domestic model", operator:"Domestic RTAs / exchanges",
    opportunity_score:80, automation_rate_estimate:65,
    priority_tier:"Tier 2", existing_network_presence:"None",
    market_aum_band:"₹60T+ AUM, compounding fast",
    mutual_fund_relevance:"Fastest-growing retail fund market, driven by SIP mass adoption.",
    growth_signal:"Very strong; structural retail growth via systematic investment plans.",
    dominant_order_model:"Registrar & transfer agent and exchange-led domestic routing.",
    current_order_channels:"RTAs, exchange platforms; domestic-first.",
    manuality_snapshot:"Estimated ~65% automated domestically; cross-border largely undeveloped.",
    regulatory_openness:"Moderate — domestic-protective; GIFT City opening cross-border.",
    risks_or_barriers:"Strong domestic infrastructure, regulatory localisation, price sensitivity, foreign-entrant scrutiny.",
    flow_image:"",
    flow_diagram:[
      {label:"Investor (SIP)", mode:"auto"},
      {label:"Distributor / App", mode:"auto"},
      {label:"RTA", mode:"mixed"},
      {label:"Exchange Platform", mode:"auto"},
      {label:"Fund (AMC)", mode:"mixed"}
    ],
    last_updated:"2025-05-28"
  },

  "DEU": {
    country:"Germany", iso3:"DEU", region:"Europe", subregion:"Western Europe",
    market_classification:"Developed",
    central_hub_status:"Partial hub", hub_name:"Custodian / platform led", operator:"Banks, custodians, platforms",
    opportunity_score:58, automation_rate_estimate:75,
    priority_tier:"Tier 2", existing_network_presence:"Emerging",
    market_aum_band:"Major continental European AUM",
    mutual_fund_relevance:"Large continental fund market with growing retail distribution.",
    growth_signal:"Moderate; steady retail platform growth.",
    dominant_order_model:"Bank- and custodian-led distribution.",
    current_order_channels:"Bank networks, custodians, growing direct platforms.",
    manuality_snapshot:"Estimated ~75% automated; friction concentrated in platform onboarding.",
    regulatory_openness:"High — EU-harmonised and infrastructure-open.",
    risks_or_barriers:"Conservative banks; fragmented relationships; incremental rather than green-field opportunity.",
    flow_image:"",
    flow_diagram:[
      {label:"Investor", mode:"auto"},
      {label:"Bank / Platform", mode:"mixed"},
      {label:"Custodian", mode:"auto"},
      {label:"Transfer Agent", mode:"auto"},
      {label:"Fund", mode:"auto"}
    ],
    last_updated:"2025-05-28"
  },

  "ZAF": {
    country:"South Africa", iso3:"ZAF", region:"Africa", subregion:"Southern Africa",
    market_classification:"Emerging",
    central_hub_status:"No central hub", hub_name:"—", operator:"Fragmented administrators",
    opportunity_score:68, automation_rate_estimate:50,
    priority_tier:"Tier 3", existing_network_presence:"None",
    market_aum_band:"Largest African collective-investment market",
    mutual_fund_relevance:"Most developed African fund market with regional gateway potential.",
    growth_signal:"Moderate; regional leader with slow continental spillover.",
    dominant_order_model:"Administrator-led, fragmented, with a manual tail.",
    current_order_channels:"Fund administrators, bilateral, limited automation.",
    manuality_snapshot:"Estimated ~50% automated; clear manual processing tail.",
    regulatory_openness:"Moderate — open but resource-constrained.",
    risks_or_barriers:"Smaller absolute volumes; currency and regulatory complexity; limited near-term ROI.",
    flow_image:"",
    flow_diagram:[
      {label:"Investor", mode:"auto"},
      {label:"Adviser / LISP", mode:"mixed"},
      {label:"Administrator", mode:"manual"},
      {label:"Custodian", mode:"manual"},
      {label:"Fund", mode:"mixed"}
    ],
    last_updated:"2025-05-28"
  },

  "ARE": {
    country:"United Arab Emirates", iso3:"ARE", region:"Asia", subregion:"Middle East",
    market_classification:"Developed",
    central_hub_status:"Full hub", hub_name:"DIFC & ADGM (offshore)", operator:"DIFC / ADGM; Clearstream Vestima (UAE funds from Dec 2025)",
    opportunity_score:83, automation_rate_estimate:75,
    priority_tier:"Tier 1", existing_network_presence:"Emerging",
    market_aum_band:"GCC total ~USD 2.2T; UAE the key offshore hub",
    mutual_fund_relevance:"Primary fund domicile and distribution hub for the Middle East, Africa and South Asia region.",
    growth_signal:"Very strong; capital and managers relocating into DIFC and ADGM.",
    dominant_order_model:"Offshore hub mature; cross-border via Vestima; domestic GCC-to-hub flows still bilateral.",
    current_order_channels:"Vestima (international), DIFC private banks, GCC bank platforms (bilateral), IFAs, insurers.",
    manuality_snapshot:"Hub-to-international automated via Vestima; domestic-to-hub layer largely manual.",
    regulatory_openness:"Very high — DFSA and FSRA actively court infrastructure; 0% corporate/income/CGT.",
    risks_or_barriers:"GCC-wide domestic routing layer missing; no confirmed Calastone DIFC anchor client.",
    flow_image:"",
    flow_diagram:[
      {label:"International Distributor", mode:"auto"},
      {label:"Vestima Routing", mode:"auto"},
      {label:"UAE Fund TA (DIFC/ADGM)", mode:"auto"},
      {label:"Custodian", mode:"mixed"},
      {label:"GCC Domestic Distributor", mode:"manual"}
    ],
    last_updated:"2026-06"
  },

  "CHE": {
    country:"Switzerland", iso3:"CHE", region:"Europe", subregion:"Western Europe",
    market_classification:"Developed",
    central_hub_status:"Partial hub", hub_name:"Private-bank distribution", operator:"Private banks & custodians",
    opportunity_score:52, automation_rate_estimate:78,
    priority_tier:"Tier 3", existing_network_presence:"Emerging",
    market_aum_band:"Leading private-wealth centre",
    mutual_fund_relevance:"Major private-wealth and cross-border distribution centre.",
    growth_signal:"Stable; wealth-led and conservative.",
    dominant_order_model:"Private-bank and custodian distribution.",
    current_order_channels:"Private banks, custodians, established rails.",
    manuality_snapshot:"Estimated ~78% automated; relatively well automated.",
    regulatory_openness:"High but discreet — open yet privacy-oriented.",
    risks_or_barriers:"Highly relationship-driven; conservative; limited open friction to capture.",
    flow_image:"",
    flow_diagram:[
      {label:"Investor", mode:"auto"},
      {label:"Private Bank", mode:"auto"},
      {label:"Custodian", mode:"auto"},
      {label:"Transfer Agent", mode:"mixed"},
      {label:"Fund", mode:"auto"}
    ],
    last_updated:"2025-05-28"
  },

  "IDN": {
    country:"Indonesia", iso3:"IDN", region:"Asia", subregion:"South-East Asia",
    market_classification:"Emerging",
    central_hub_status:"Full hub", hub_name:"S-INVEST (domestic, mandatory)", operator:"KSEI (Indonesian Central Securities Depository)",
    opportunity_score:63, automation_rate_estimate:80,
    priority_tier:"Tier 2", existing_network_presence:"Emerging",
    market_aum_band:"IDR 1,039T (~USD 65B), 2024; fast-growing",
    mutual_fund_relevance:"Most mature central fund order-routing infrastructure in South-East Asia.",
    growth_signal:"Strong; AUM grew 21.55% in the first year after the S-INVEST mandate.",
    dominant_order_model:"Mandatory central routing via S-INVEST; bilateral fintech channels alongside.",
    current_order_channels:"S-INVEST (banks, securities firms), plus fintech apps (Bibit, Bareksa, GoPay Investasi).",
    manuality_snapshot:"Domestic routing highly standardised via S-INVEST; offshore access remains bilateral.",
    regulatory_openness:"High — OJK active; KSEI upgrading; SPRINT/SPEK launched Dec 2025.",
    risks_or_barriers:"S-INVEST is domestic only — no cross-border routing layer; offshore access bilateral.",
    flow_image:"",
    flow_diagram:[
      {label:"Investor", mode:"auto"},
      {label:"Selling Agent (APERD)", mode:"auto"},
      {label:"S-INVEST (KSEI)", mode:"auto"},
      {label:"Investment Manager", mode:"auto"},
      {label:"Custodian Bank", mode:"auto"}
    ],
    last_updated:"2026-06"
  },

  "SAU": {
    country:"Saudi Arabia", iso3:"SAU", region:"Asia", subregion:"Middle East",
    market_classification:"Emerging",
    central_hub_status:"Partial hub", hub_name:"Edaa Connect (domestic, from Feb 2025)", operator:"Edaa (Securities Depository Center), Saudi Tadawul Group",
    opportunity_score:87, automation_rate_estimate:45,
    priority_tier:"Tier 1", existing_network_presence:"None",
    market_aum_band:"~USD 295B (Q1 2025); ~12% CAGR; target USD 500B by 2030",
    mutual_fund_relevance:"Largest Gulf fund market; 1,549 funds; subscribers up 47% year-on-year.",
    growth_signal:"Very strong; Vision 2030 reforms and rising domestic participation.",
    dominant_order_model:"Mostly bilateral; Edaa Connect emerging for domestic retail; no international bridge.",
    current_order_channels:"Bank platforms; Edaa Connect for some domestic funds; bilateral for institutional and QFI flows.",
    manuality_snapshot:"Early-stage hub adoption; QFI and institutional flows still bilateral and manual.",
    regulatory_openness:"Very high — CMA July 2025 digital reforms; QFI restriction removal.",
    risks_or_barriers:"Edaa Connect only launched Feb 2025; no cross-border bridge; cross-border often routed via DIFC/ADGM.",
    flow_image:"",
    flow_diagram:[
      {label:"Retail Investor", mode:"auto"},
      {label:"Edaa Connect", mode:"mixed"},
      {label:"Fund Manager / TA", mode:"mixed"},
      {label:"Custodian / Muqassa", mode:"mixed"},
      {label:"QFI / Cross-border", mode:"manual"}
    ],
    last_updated:"2026-06"
  },

  "TUR": {
    country:"Turkey", iso3:"TUR", region:"Europe", subregion:"Eastern Europe / Middle East",
    market_classification:"Emerging",
    central_hub_status:"Partial hub", hub_name:"TEFAS (domestic) + IFC Istanbul zone", operator:"Takasbank (TEFAS); MKK (CSD)",
    opportunity_score:63, automation_rate_estimate:55,
    priority_tier:"Tier 2", existing_network_presence:"None",
    market_aum_band:"Small domestic fund market; IFC Istanbul early-stage",
    mutual_fund_relevance:"Small domestic fund market; strategic bet on IFC Istanbul as a new financial zone.",
    growth_signal:"Domestic market constrained by inflation; IFC Istanbul building out with tax incentives.",
    dominant_order_model:"TEFAS for domestic retail trading; bilateral for institutional and cross-border.",
    current_order_channels:"TEFAS (domestic retail via banks/brokers); bilateral institutional and cross-border.",
    manuality_snapshot:"TEFAS centralises retail trading but is not a full order-routing utility; cross-border fully bilateral.",
    regulatory_openness:"Moderate-high — SPK active; government-backed wealth-fund routing project discussed.",
    risks_or_barriers:"No fund routing in IFC zone yet; no confirmed Calastone presence; small domestic AUM.",
    flow_image:"",
    flow_diagram:[
      {label:"Retail Investor", mode:"auto"},
      {label:"TEFAS (Takasbank)", mode:"mixed"},
      {label:"MKK (CSD)", mode:"mixed"},
      {label:"Portfolio Manager", mode:"mixed"},
      {label:"Cross-border / IFC", mode:"manual"}
    ],
    last_updated:"2026-06"
  },

  "VNM": {
    country:"Vietnam", iso3:"VNM", region:"Asia", subregion:"South-East Asia",
    market_classification:"Frontier",
    central_hub_status:"No central hub", hub_name:"—", operator:"Bilateral distributor-to-AMC; VSDC registers fund units only",
    opportunity_score:63, automation_rate_estimate:35,
    priority_tier:"Tier 2", existing_network_presence:"None",
    market_aum_band:"Small but fast-growing; FTSE upgrade effective Sep 2026",
    mutual_fund_relevance:"Frontier market upgrading to Secondary Emerging (FTSE, Sep 2026); fund plumbing lags equity reform.",
    growth_signal:"Strong; FTSE upgrade expected to unlock ~USD 1.5B passive, up to USD 6B total inflows.",
    dominant_order_model:"No standard; fragmented bilateral flows between distributors and asset managers.",
    current_order_channels:"Bank portals, securities companies, fintech apps (Finhay, Momo, VNDirect); proprietary/bilateral.",
    manuality_snapshot:"Highly manual; no standardised messaging; no ISO 20022 fund order use domestically.",
    regulatory_openness:"Moderate — SSC active on equity reform but slower on fund-specific infrastructure.",
    risks_or_barriers:"No fund routing utility; reform focused on equities; no confirmed Vietnam domestic presence.",
    flow_image:"",
    flow_diagram:[
      {label:"Investor", mode:"auto"},
      {label:"Distributor (bank/fintech)", mode:"manual"},
      {label:"Asset Manager (AMC)", mode:"manual"},
      {label:"Custodian Bank", mode:"manual"},
      {label:"VSDC (unit registration)", mode:"mixed"}
    ],
    last_updated:"2026-06"
  },

  "CHN": {
    country:"China", iso3:"CHN", region:"Asia", subregion:"East Asia",
    market_classification:"Emerging",
    central_hub_status:"Partial hub", hub_name:"CSDC / ChinaClear", operator:"State-owned / CSRC-approved",
    opportunity_score:45, automation_rate_estimate:40,
    priority_tier:"Tier 2", existing_network_presence:"Emerging",
    market_aum_band:"Very large (RMB trillions); exact AUM not stated in document",
    mutual_fund_relevance:"Large domestic mutual fund market with growing cross-border MRF and QDII flows; MRF 2.0 (Jan 2025) expands routing volumes",
    growth_signal:"MRF 2.0 sales cap raised from 50% to 80%; economy projected to grow ~4.8% in 2026; northbound MRF cumulative net subscriptions ~RMB 41.5bn",
    dominant_order_model:"CSDC/ChinaClear-centric domestic model with FDEP and CMU OmniClear for cross-border MRF; QDII via offshore custodians",
    current_order_channels:"CSDC fund collection/payment system (domestic); FDEP + CMU OmniClear (MRF); QDII via global custodians; QFII/RQFII for inbound",
    manuality_snapshot:"Extent of manual processing across the fund lifecycle is an open question; cross-border FX and settlement steps likely to contain manual elements",
    regulatory_openness:"Partially open but tightly managed; SAFE quotas, CSRC approvals and capital-flow controls limit foreign infrastructure access",
    risks_or_barriers:"Capital controls, regulatory posture toward foreign providers, proprietary domestic messaging standards, FX/settlement complexity, nominee vs. beneficial-owner mismatch",
    flow_image:"", flow_diagram:[
      {label:"Investor places order with distributor", mode:"mixed"},
      {label:"Distributor submits via FDEP (Northbound MRF) or CMU OmniClear (Southbound MRF)", mode:"auto"},
      {label:"ChinaClear consolidates / routes aggregated order", mode:"auto"},
      {label:"CMU OmniClear cross-border routing", mode:"auto"},
      {label:"Transfer Agent processes order and updates register", mode:"mixed"},
      {label:"FX conversion and settlement (QDII / MRF)", mode:"manual"},
      {label:"Confirmation returned through chain", mode:"mixed"}
    ],
    last_updated:"2026-06"
  }

  /* ----------------------------------------------------------------
     TEMPLATE — copy, replace "TEMPLATE" with the ISO3 code, fill in,
     and add a comma after the previous record's closing }.
  -----------------------------------------------------------------
  ,"TEMPLATE": {
    country:"Country Name", iso3:"XXX", region:"Europe|Asia|Americas|Africa|Oceania",
    subregion:"Free text",
    market_classification:"Developed|Emerging|Frontier|Unknown",
    central_hub_status:"Full hub|Partial hub|No central hub",
    hub_name:"Dominant hub or —", operator:"Who runs the infrastructure",
    opportunity_score:60, automation_rate_estimate:50,
    priority_tier:"Tier 1|Tier 2|Tier 3|Watch",
    existing_network_presence:"Established|Emerging|None",
    market_aum_band:"Rough AUM size band",
    mutual_fund_relevance:"Why mutual funds matter here (fact).",
    growth_signal:"Direction & strength of growth (fact).",
    dominant_order_model:"How orders flow today (fact).",
    current_order_channels:"Channels in use today (fact).",
    manuality_snapshot:"How manual/automated flows are (fact).",
    regulatory_openness:"Openness to new infrastructure (fact).",
    risks_or_barriers:"What makes entry hard (fact).",
    flow_image:"",                       // optional URL to your own diagram
    flow_diagram:[                       // OR let the app draw it:
      {label:"Investor", mode:"auto"},
      {label:"Distributor", mode:"mixed"},
      {label:"Hub", mode:"manual"},
      {label:"Fund", mode:"auto"}
    ],
    last_updated:"2025-01-01"
  }
  ---------------------------------------------------------------- */

};

const COUNTRY_MARKDOWN = {
  "BRA": `# Brazil

> **ISO3:** BRA | **Region:** Latin America | **Market Classification:** Emerging
> **Hub Status:** No Central Hub — bilateral/manual dominant; CVM 175 opens cross-border
> **Opportunity Score:** 5/5 | **Calastone Presence:** Active campaign underway

---

## Snapshot

| Field | Detail |
|---|---|
| Fund AUM | ~R$10.8 trillion (~USD 1.7 trillion) as of Q1 2026 — 4th largest fund industry globally |
| AUM Growth | Strong Q1 2026: R$130.3bn net inflows in fixed income; record capital markets issuance R$838.8bn in 2025 |
| Hub Status | No central fund order-routing hub; bilateral connections dominate |
| Key Regulation | CVM 175 (Comissão de Valores Mobiliários — Brazilian Securities Commission Resolution No. 175) — effective Feb 2023, June 2025 compliance deadline |
| Cross-Border Opening | CVM 175 enables foreign fund access to Brazilian investors and vice versa |
| Dominant Order Channels | Fax/email (legacy), bilateral file exchange, proprietary portals, PDF processing |
| Automation Estimate | Low-moderate: high within large bank platforms, very low for cross-border and IFA flows |
| Regulatory Body | CVM (Comissão de Valores Mobiliários — Brazilian Securities and Exchange Commission) |
| Self-Regulatory Body | ANBIMA (Associação Brasileira das Entidades dos Mercados Financeiro e de Capitais — Brazilian Association of Financial and Capital Market Entities) |
| Global Network Presence | Calastone (active campaign); no confirmed Vestima/Clearstream domestic presence |

---

## Market Overview

Brazil is the fourth-largest investment fund market globally, with total net assets of approximately R$10.8 trillion (c. USD 1.7 trillion) as of Q1 2026. The industry encompasses nearly 34,000 funds across fixed income, multi-asset, equity, and alternative strategies, administered by more than 100 fiduciary administrators.

The market is structurally dominated by large universal banks — Itaú, Bradesco, Banco do Brasil, and Santander Brazil — which act as distributors, asset managers, and custodians simultaneously. This vertical integration has historically suppressed demand for neutral third-party routing infrastructure. However, CVM 175 is actively disrupting this status quo by separating fund structures, enabling cross-border fund distribution, and imposing standardised reporting requirements.

---

## Regulatory Catalyst: CVM 175

CVM Resolution No. 175, in effect since February 2023, is the most significant structural reform in Brazil's fund industry in decades. Key provisions include:

- **New fund typology:** FIP (Fundo de Investimento em Participações — Private Equity Investment Fund), FII (Fundo de Investimento Imobiliário — Real Estate Investment Fund), FIDC (Fundo de Investimento em Direitos Creditórios — Receivables Investment Fund), FI-Infra (Fundo de Investimento em Infraestrutura — Infrastructure Investment Fund), and the new open-ended FI (Fundo de Investimento — Investment Fund) — all unified under a single legal framework
- **Cross-border distribution:** Foreign funds can be distributed directly to Brazilian investors and Brazilian funds marketed internationally, creating new bilateral connection requirements between domestic TAs (Transfer Agents) and foreign managers
- **Fiduciary administration reform:** Clearer separation between administrator, manager, custodian, and distributor roles
- **June 2025 compliance deadline:** Full transition to the new framework required, causing significant industry restructuring and demand for better connectivity infrastructure

Despite the reform, no central order-routing utility has emerged. The industry continues to process most subscription and redemption orders through fax, email, CSV uploads, and portal re-keying — particularly for smaller distributors and IFAs (Assessores de Investimento — Independent Investment Advisors).

---

## How Fund Orders Work Today

\`\`\`
Distributor / Bank platform / IFA (Assessor de Investimento)
        ↓  email / fax / portal upload
Fund Administrator / TA (Transfer Agent)
        ↓  manual reconciliation / CSV
AMC (Gestora de Recursos — Asset Management Company)
        ↓
Custodian Bank (Banco Custodiante)
        ↓
B3 (Brasil, Bolsa, Balcão) / STR (Sistema de Transferência de Reservas — Reserve Transfer System) for settlement
\`\`\`

**Key manual friction points:**
- Subscription forms sent via PDF or email to fund administrators, who manually re-key into internal systems
- Cut-off time mismatches cause D+1 or D+2 delays
- Reconciliation between distributor's system and fund NAV (Net Asset Value) register done via spreadsheets
- Each bilateral connection between distributor and TA negotiated separately — no standardised messaging
- Cross-border flows post-CVM 175 processed via additional manual layers; no ISO 20022 fund order messaging in use

---

## Infrastructure Gaps and Reform Initiatives

### B3 and RTM (Roteamento de Transferência de Mensagens — Message Transfer Routing)
B3 (Brasil, Bolsa, Balcão — formed from the 2017 merger of BM&FBovespa and CETIP) operates Brazil's securities settlement and clearing infrastructure. Industry discussions about extending B3's RTM infrastructure to cover fund order routing have not progressed to a formal market-wide mandate as of mid-2026. B3's fund processing footprint is limited to exchange-traded products.

### ISO 20022 Adoption
ISO 20022 is used in Brazil for RTGS (Real-Time Gross Settlement) payments via the STR (Sistema de Transferência de Reservas) and for instant payments via PIX (Pagamentos Instantâneos — Instant Payments). ISO 20022 fund order messaging (MX setr — Securities Transaction messages) is not in domestic use. All fund order messaging remains proprietary or semi-structured (email/CSV).

### SWIFT for Funds
SWIFT connectivity exists among major custodian banks for cross-border securities processing, but SWIFT for Funds (fund order routing via FIN MT535/536 or ISO 20022 SETR messages) is not systematically adopted for domestic mutual fund orders.

---

## Distribution Channels

| Channel | Role | Order Method |
|---|---|---|
| Large bank platforms (Itaú, Bradesco, BB, Santander) | Dominant retail distribution | Proprietary bilateral; some STP (Straight-Through Processing) within bank group |
| XP Investimentos / BTG Pactual platforms | Large independent platforms | Proprietary bilateral connections to fund administrators |
| IFAs (Assessores de Investimento) | Growing channel via XP ecosystem | Manual via platform portals; little direct STP |
| Insurers | VGBL (Vida Gerador de Benefício Livre — Free Benefit Generating Life) / PGBL (Plano Gerador de Benefício Livre — Free Benefit Generating Plan) pension products | Highly manual; separate bilateral connections to AMC TAs |
| Digital platforms (NuInvest, Rico, Clear) | Emerging retail fintech | Platform-specific connectivity; no industry standard |

---

## Calastone Presence and Opportunity

Calastone has been actively campaigning in Brazil, positioning its DMI (Distributed Market Infrastructure) network as the neutral connectivity layer for cross-border and domestic fund order flows. The firm's focus is the cross-border connectivity challenge created by CVM 175: Brazilian distributors offering foreign funds and foreign managers seeking Brazilian investor access now face a bilateral connection problem that a global network can solve.

---

## Key Participants

| Entity Type | Key Players |
|---|---|
| Regulator | CVM (Comissão de Valores Mobiliários), BCB (Banco Central do Brasil — Central Bank of Brazil) |
| Custodian Banks (Bancos Custodiantes) | Itaú, Bradesco, Banco do Brasil, BNY Mellon Brazil, Santander |
| Fund Administrators | Itaú Asset, BTG Pactual, BRL Trust, Vórtx |
| Large Distributors | XP Investimentos, BTG Pactual, Itaú, Bradesco, Banco do Brasil |
| Settlement / Clearing | B3 (Brasil, Bolsa, Balcão); STR (Sistema de Transferência de Reservas) |
| Industry Association | ANBIMA (Associação Brasileira das Entidades dos Mercados Financeiro e de Capitais) |

---

## Opportunity Matrix Score

| Dimension | Score (1–5) | Notes |
|---|---|---|
| Separate IFC Hub | 2 | No hub; CVM 175 opens cross-border but no routing utility |
| Fund AUM Scale | 5 | USD 1.7T, 4th largest fund industry globally |
| Order Routing Gap | 5 | Fax/email still prevalent; bilateral only |
| Regulatory Push | 5 | CVM 175 mandate with June 2025 deadline |
| Cross-Border Flow Need | 4 | CVM 175 opens foreign fund access |
| Calastone Adjacency | 4 | Active campaign underway |

---

## Questions to Investigate Further

- [ ] Has B3 published any formal consultation on RTM expansion to mutual funds?
- [ ] What percentage of Brazilian fund orders still processed via fax/email vs portal?
- [ ] What is the current bilateral connection count between XP and fund administrators?
- [ ] Has CVM issued any guidance on standardised messaging for cross-border fund orders post-CVM 175?
- [ ] What is Calastone's current client list in Brazil? Which Brazilian AMCs have connected?
- [ ] Are any Brazilian custodian banks processing cross-border fund orders via SWIFT MT or ISO 20022 SETR?

---

## Sources

- ANBIMA: https://international.anbima.com.br
- CVM Resolution 175 (English): https://www.gov.br/cvm/en/
- FSB (Financial Stability Board) Peer Review of Brazil, November 2024
- Calastone Brazil insights: https://www.calastone.com/insights/unlocking-growth-in-the-brazilian-funds-market/
- Mayer Brown — Funds in Transformation: The Legacy of RCVM 175, October 2025

---

*Last updated: June 2026 | Next review: Q3 2026*
`,

  "IDN": `# Indonesia

> **ISO3:** IDN | **Region:** Asia — Southeast Asia | **Market Classification:** Emerging
> **Hub Status:** Full Domestic Hub — S-INVEST mandatory since 2016/2017; no cross-border routing layer
> **Opportunity Score:** 3/5 domestic (hub exists); higher for cross-border layer | **Calastone Presence:** Adjacent (Singapore regional HQ)

---

## Snapshot

| Field | Detail |
|---|---|
| Fund AUM | IDR 1,039 trillion (~USD 65B) as of 2024; fast-growing |
| AUM Growth | AUM grew 21.55% in first 12 months post S-INVEST mandate (2016–2017); continued strong trajectory |
| Hub Status | Full domestic hub via S-INVEST (mandatory); bilateral fintech channels exist alongside |
| Routing Platform | S-INVEST (Sistem Investasi Terintegrasi — Integrated Investment Management System) |
| Hub Operator | KSEI (PT Kustodian Sentral Efek Indonesia — Indonesian Central Securities Depository) |
| Regulator | OJK (Otoritas Jasa Keuangan — Financial Services Authority of Indonesia) |
| Cross-Border Gap | S-INVEST is domestic only; no cross-border routing layer exists |
| Global Network Presence | Calastone present in Singapore, Malaysia, Philippines — not confirmed in Indonesian domestic market |

---

## Market Overview

Indonesia has the most mature central fund order-routing infrastructure in Southeast Asia, having mandated the use of S-INVEST since 2016 for order routing and 2017 for post-trade processing. The mutual fund market has grown significantly since the mandate: fund products increased 44% and AUM grew 21.55% in the first year following mandatory adoption.

As of 2024, total mutual fund AUM stands at approximately IDR 1,039 trillion (roughly USD 65 billion). The market is regulated by OJK (Otoritas Jasa Keuangan), which works closely with KSEI (PT Kustodian Sentral Efek Indonesia) to maintain and upgrade the S-INVEST infrastructure. A new integrated licensing and registration system — SPRINT/SPEK — was launched in December 2025, further deepening the regulatory-infrastructure integration.

---

## S-INVEST: The Central Hub

S-INVEST (Sistem Investasi Terintegrasi — Integrated Investment Management System) is Indonesia's mandatory central fund order-routing platform, operated by KSEI (PT Kustodian Sentral Efek Indonesia — Indonesian Central Securities Depository).

**Four core modules:**

1. **Static Data** — fund and participant master data registry
2. **Order Routing** — standardised submission and routing of mutual fund subscription, redemption, and switching orders (mandatory since 31 August 2016)
3. **Post Trade Processing (PTP)** — settlement and post-trade functions including basic asset transactions (mandatory since 31 August 2017)
4. **Reporting** — standardised regulatory and operational reporting

**Who connects to S-INVEST:**
- APERD (Agen Penjual Efek Reksa Dana — Mutual Fund Selling Agents) as distributors
- IM (Manajer Investasi — Investment Managers / Fund Managers)
- Bank Kustodian (Custodian Banks) as administrators and depositories
- Securities companies and Treasury Banks involved in mutual fund asset transactions

**Why S-INVEST qualifies as a full hub:**
- Mandatory for all market participants under OJK mandate
- Covers all major fund transaction types (subscribe, redeem, switch)
- Government-backed operator (KSEI is regulated by OJK)
- Standardised messaging throughout
- Market-wide adoption — not a voluntary commercial platform

---

## How Fund Orders Work Today

### Via S-INVEST (domestic standard flow)
\`\`\`
Retail / Institutional Investor
        ↓
APERD (Agen Penjual Efek Reksa Dana — Mutual Fund Selling Agent / Distributor)
        ↓  S-INVEST Order Routing module
S-INVEST platform (KSEI infrastructure)
        ↓  standardised routing
IM (Manajer Investasi — Investment Manager)
        ↓
Bank Kustodian (Custodian Bank) — administrator and depository
        ↓
S-INVEST PTP (Post Trade Processing) module for settlement
        ↓
KSEI CSD (Central Securities Depository) for fund unit registration
\`\`\`

### Fintech bilateral channels (growing alongside S-INVEST)
\`\`\`
Digital platform / fintech (GoPay Investasi, Bibit, Bareksa, IPOT)
        ↓  API bilateral connection
IM (Manajer Investasi)
        ↓
Bank Kustodian
        ↓
KSEI for registration
\`\`\`

Note: Fintech platforms use S-INVEST Order Routing for the core flow but may have additional API layers for customer-facing integration. Offshore access remains bilateral.

---

## The Role of the Custodian Bank (Bank Kustodian)

In Indonesia's fund infrastructure, the Bank Kustodian plays a pivotal role that is broader than in many other markets:

1. **Administrative function:** The custodian bank acts as fund administrator — maintaining fund books, calculating NAV (Net Asset Value / Nilai Aktiva Bersih), and processing fund accounting
2. **Depository function:** Holds fund assets in safe custody on behalf of investors
3. **Settlement counterparty:** Receives and delivers securities and cash for portfolio transactions within the S-INVEST PTP module
4. **Reporting:** Provides regulatory reporting to OJK in conjunction with KSEI
5. **Oversight role:** The custodian acts as a check on the IM (Investment Manager), with obligations to monitor fund compliance and report breaches

This dual administrative-and-depository role (common in civil-law jurisdictions) means the custodian bank has significant operational influence over fund operations.

---

## Cross-Border Gap: Where the Opportunity Lies

S-INVEST is entirely domestic. There is no cross-border routing layer connecting Indonesian fund managers or distributors to international fund networks. Specific gaps:

- **Offshore Indonesian investors** wanting to access foreign funds must use bilateral connections to international managers
- **International fund managers** wanting to distribute into Indonesia must establish bilateral connections with Indonesian distributors or fintech partnerships
- **Indonesian fund managers** wanting cross-border ASEAN distribution have no standardised routing channel
- The ASEAN RPC (Regional Payment Connectivity) framework is forming but covers payments, not fund orders
- The ASEAN+3 (ASEAN plus China, Japan, South Korea) CIS (Collective Investment Scheme) cross-border framework and APEC ARFP (Asia-Pacific Economic Cooperation Asia Region Funds Passport) create potential demand for cross-border fund order infrastructure

---

## Lessons from S-INVEST (Before vs After Mandate)

S-INVEST is one of the strongest case studies in what a mandatory central hub achieves. In the 12 months following the Order Routing mandate (August 2016 to August 2017):

- Fund AUM grew **21.55%** (IDR 328.68T to IDR 399.52T)
- Registered mutual fund investors grew **33%**
- Number of fund products listed on S-INVEST grew **44%** (from 1,472 to 2,119)

Attribution of all growth to S-INVEST alone would be an overstatement, but the directional correlation between mandatory hub adoption and market depth is consistent with patterns seen in Hong Kong (IFP — Integrated Fund Platform) and Korea (FundNet).

---

## Distribution Channels

| Channel | Role | Order Method |
|---|---|---|
| Bank platforms (BCA, Mandiri, BNI, BRI) | Dominant retail distribution | Via S-INVEST Order Routing; some bilateral for offshore |
| Online investment platforms (Bibit, Bareksa, GoPay Investasi, IPOT) | Growing fintech channel | API bilateral + S-INVEST backend |
| Securities companies (Perusahaan Efek) | Retail brokerage distribution | Via S-INVEST |
| Insurers (Perusahaan Asuransi) | PAYDI (Produk Asuransi yang Dikaitkan dengan Investasi — Unit-linked Insurance Products) | Bilateral; partial S-INVEST integration |
| Independent financial planners | Small but growing segment | Manual; portal-based |

---

## Key Participants

| Entity Type | Key Players |
|---|---|
| Regulator | OJK (Otoritas Jasa Keuangan — Financial Services Authority) |
| CSD / Hub Operator | KSEI (PT Kustodian Sentral Efek Indonesia — Indonesian Central Securities Depository) |
| Clearing | KPEI (PT Kliring Penjaminan Efek Indonesia — Indonesian Clearing and Guarantee Corporation) |
| Exchange | IDX / BEI (Bursa Efek Indonesia — Indonesia Stock Exchange) |
| Hub Platform | S-INVEST (Sistem Investasi Terintegrasi) |
| Custodian Banks | Citibank, Deutsche Bank, HSBC, Bank Mandiri, BCA, Bank BNI |
| Major Investment Managers | Manulife AM Indonesia, Schroder Indonesia, Batavia Prosperindo, Trimegah AM |
| Fintech distributors | Bibit, Bareksa, GoPay Investasi, IPOT (Indo Premier Online Technology) |
| Selling Agents association | APERD (Agen Penjual Efek Reksa Dana) |

---

## Opportunity Matrix Score

| Dimension | Score (1–5) | Notes |
|---|---|---|
| Separate IFC Hub | 2 | No offshore hub; S-INVEST is domestic only |
| Fund AUM Scale | 3 | IDR 1,039T (~USD 65B); fast growth post-MSCI |
| Order Routing Gap | 4 | S-INVEST exists domestically but no cross-border layer; bilateral fintech channels growing |
| Regulatory Push | 4 | OJK active; KSEI upgrading; new SPRINT/SPEK Dec 2025 |
| Cross-Border Flow Need | 3 | Offshore access limited; fintech distribution growing |
| Calastone Adjacency | 3 | Calastone in SG/MY/PH — not confirmed in IDN domestic market |

---

## Questions to Investigate Further

- [ ] What is the current daily transaction volume through S-INVEST Order Routing?
- [ ] Are all APERDs (Mutual Fund Selling Agents) now fully compliant with S-INVEST PTP (Post Trade Processing) module?
- [ ] Is OJK or KSEI considering a cross-border extension of S-INVEST for ASEAN fund passport connectivity?
- [ ] How do fintech platforms (Bibit, Bareksa) integrate with S-INVEST — fully or partially?
- [ ] What is the current bilateral connection count between fintech platforms and investment managers outside S-INVEST?
- [ ] Does Indonesia participate in any ASEAN+3 CIS (Collective Investment Scheme) infrastructure working group?

---

## Sources

- KSEI: https://web.ksei.co.id/services/types/investment-infrastructure-provider-service
- OJK/KSEI SPRINT-SPEK launch press release, December 2025
- IDNFinancials: OJK inaugurates S-INVEST service — AUM and growth data
- AECSD: S-INVEST overview paper, 2019
- KSEI S-INVEST Circular SE-0001-DIR-EKS-KSEI-0426, April 2026

---

*Last updated: June 2026 | Next review: Q3 2026*
`,

  "SAU": `# Saudi Arabia

> **ISO3:** SAU | **Region:** Middle East | **Market Classification:** Emerging
> **Hub Status:** Partial Hub — Edaa Connect launched Feb 2025, domestic only, no international bridge
> **Opportunity Score:** 4/5 | **Calastone Presence:** Not confirmed in Saudi domestic market

---

## Snapshot

| Field | Detail |
|---|---|
| Fund AUM | ~USD 295B (SR 1 trillion+) as of Q1 2025; 12% CAGR (Compound Annual Growth Rate) 2015–2024 |
| AUM Growth | 20.9% growth in 2024 vs 2023; 1,549 investment funds; 1.72M subscribers (+47% YoY) |
| Hub Status | Partial — Edaa Connect launched Feb 2025 for domestic retail; no cross-border routing |
| Routing Platform | Edaa Connect (operated by Edaa — Securities Depository Center, part of Saudi Tadawul Group) |
| Key Regulation | CMA (Capital Market Authority — هيئة السوق المالية) digital reforms July 2025; QFI (Qualified Foreign Investor) restriction removal |
| Dominant Order Channels | Bank platforms; Edaa Connect for some domestic funds; bilateral for institutional and cross-border |
| Regulatory Body | CMA (Capital Market Authority — هيئة السوق المالية) |
| Market Infrastructure | Saudi Tadawul Group: Tadawul (exchange), Muqassa (clearing), Edaa (CSD — Central Securities Depository) |
| Global Network Presence | No confirmed Calastone presence; Clearstream Vestima does not yet cover Saudi domestic funds |

---

## Market Overview

Saudi Arabia's asset management industry exceeded SR 1 trillion (USD 266+ billion) in AUM for the first time at end-2024, with 20.9% year-on-year growth driven by Vision 2030 capital market reforms, rising domestic investor participation, and growing foreign institutional interest. The number of investment funds rose to 1,549 in 2024, with public fund subscribers surging 47% year-on-year.

The market is regulated by the CMA and supported by three market infrastructure providers under the Saudi Tadawul Group: Tadawul (the Saudi Exchange — السوق المالية السعودية), Muqassa (the Saudi clearing centre — مقاصة), and Edaa (the Securities Depository Center — إيداع). The sector is on a modernisation trajectory but domestic fund order routing remains predominantly bilateral except for the newly launched Edaa Connect platform.

---

## Edaa Connect: The New Partial Hub

Edaa Connect was launched on 18 February 2025 at the CMF (Capital Market Forum — منتدى مبادرات الاستثمار في السوق المالية) in Riyadh. Operated by Edaa (Securities Depository Center — إيداع), part of the Saudi Tadawul Group (مجموعة تداول السعودية), it serves as a one-stop-shop for mutual fund investments in the Saudi capital market.

**Key features of Edaa Connect:**
- Centralised subscription and redemption for investors across multiple funds
- Integrates with existing financial services infrastructure
- Covers funds not listed on Tadawul Saudi (i.e., unlisted public mutual funds)
- Provides fund managers with advanced operational tools and broader investor reach
- Increases fund visibility and distributor connectivity from a single platform

**Why it is a "Partial Hub" rather than a full hub:**
- Launched only in February 2025 — adoption is early-stage; not yet market-wide
- No confirmed cross-border or international routing bridge (unlike Hong Kong's IFP — Integrated Fund Platform — or Korea's FundNet connecting to Clearstream Vestima)
- Focused on domestic Saudi retail investors; international institutional flows (QFIs — Qualified Foreign Investors) remain on bilateral connectivity
- Coverage is not yet comprehensive across all Saudi-domiciled fund types
- No confirmed ISO 20022 SETR (Securities Transaction) messaging standardisation

---

## How Fund Orders Work Today

### Domestic retail (via Edaa Connect — partial)
\`\`\`
Retail Investor
        ↓  Edaa Connect portal
Edaa CSD (Central Securities Depository — مركز إيداع الأوراق المالية)
        ↓  standardised routing
Fund Manager / TA (Transfer Agent)
        ↓
Custodian / Muqassa (clearing — مقاصة)
\`\`\`

### Bilateral flows (still dominant for QFIs and institutional)
\`\`\`
QFI (Qualified Foreign Investor) or institutional distributor
        ↓  bilateral / proprietary channel
Saudi AMC (Asset Management Company)
        ↓  manual reconciliation
Custodian / local bank
        ↓
Edaa for custody registration
\`\`\`

---

## QFI Framework and Cross-Border Flows

The CMA's QFI (Qualified Foreign Investor — المستثمر الأجنبي المؤهل) framework has been progressively liberalised since 2015. CMA reforms in 2025 include further easing of QFI restrictions, expected to increase cross-border investment flows into Saudi funds. The removal of QFI restrictions, combined with the absence of an international routing bridge, is the key structural gap: foreign institutions wanting to invest in Saudi funds and Saudi institutions wanting to access international funds both currently rely on bilateral plumbing.

---

## DIFC and ADGM as Offshore Bypass

Saudi fund managers and institutions frequently use DIFC (Dubai International Financial Centre) and ADGM (Abu Dhabi Global Market) registered vehicles to access international distribution, connecting Saudi capital to global fund networks through the UAE's more internationalised infrastructure. This creates a hub-bypass dynamic: cross-border Saudi fund orders often route via DIFC or ADGM rather than directly from Riyadh, adding operational layers.

---

## Vision 2030 and FSDP

Saudi Arabia's Vision 2030 (رؤية 2030) includes a FSDP (Financial Sector Development Programme — برنامج تطوير القطاع المالي) that targets growing the asset management industry to USD 500 billion in AUM by 2030 (from USD 295B in Q1 2025). This creates a strong institutional push for infrastructure modernisation.

---

## Key Participants

| Entity Type | Key Players |
|---|---|
| Regulator | CMA (Capital Market Authority — هيئة السوق المالية) |
| Exchange | Tadawul (Saudi Exchange — السوق المالية السعودية) |
| CSD | Edaa (Securities Depository Center — إيداع) |
| Clearing | Muqassa (Saudi Clearing Center — مقاصة) |
| Fund Hub | Edaa Connect (edaaconnect.sa) |
| Custodians | Al Rajhi Bank, Riyad Bank, Saudi National Bank (SNB), HSBC Saudi Arabia |
| AMCs | Riyad Capital, Al Rajhi Capital, Aljazira Capital, Alinma Investment, NCB Capital |
| Sovereign Wealth | PIF (Public Investment Fund — صندوق الاستثمارات العامة) |

---

## Opportunity Matrix Score

| Dimension | Score (1–5) | Notes |
|---|---|---|
| Separate IFC Hub | 4 | DIFC/ADGM function as de facto offshore hubs |
| Fund AUM Scale | 4 | USD 295B; 12% CAGR; on track for USD 500B by 2030 |
| Order Routing Gap | 4 | Edaa Connect just launched; no international bridge |
| Regulatory Push | 5 | CMA July 2025 fintech/digital reforms |
| Cross-Border Flow Need | 5 | QFI restriction removal creates cross-border order flow |
| Calastone Adjacency | 3 | No confirmed presence in Saudi domestic market |

---

## Questions to Investigate Further

- [ ] How many fund managers and distributors have connected to Edaa Connect since February 2025?
- [ ] Is Edaa / Saudi Tadawul Group planning a cross-border routing bridge connecting Edaa Connect to international fund networks?
- [ ] Are any Saudi AMCs connected to Clearstream Vestima or Calastone for international distribution?
- [ ] What is the ISO 20022 adoption status within the Edaa infrastructure?
- [ ] How does the Muqassa clearing layer interact with Edaa Connect for fund settlement?
- [ ] What percentage of QFI orders are currently processed bilaterally vs any standardised channel?

---

## Sources

- Edaa Connect launch press release: https://www.edaa.sa (February 2025)
- CMA 2024 Annual Report: Saudi asset management industry data
- S&P Global: Saudi AUM hits USD 295B, September 2025
- Arab News: Saudi AUM on track for USD 500bn by 2030
- Argaam / Saudi Gazette: Edaa Connect coverage, February 2025

---

*Last updated: June 2026 | Next review: Q3 2026*
`,

  "ARE": `# UAE — DIFC & ADGM

> **ISO3:** ARE | **Region:** Middle East | **Market Classification:** Developed (offshore IFC zones)
> **Hub Status:** Full Offshore Hub — DIFC and ADGM are fully realised fund domicile and routing hubs; gap is the domestic GCC bridge
> **Opportunity Score:** 4/5 | **Calastone Presence:** Adjacent — active in Middle East activity from DIFC base

---

## Snapshot

| Field | Detail |
|---|---|
| Fund AUM | GCC (Gulf Cooperation Council) total ~USD 2.2T; UAE/DIFC/ADGM as key offshore hub |
| Hub Status | Full offshore hub: DIFC (Dubai International Financial Centre) and ADGM (Abu Dhabi Global Market) |
| Vestima Coverage | UAE-domiciled funds added to Clearstream Vestima execution processing — December 2025 |
| Key Regulation | DFSA (Dubai Financial Services Authority) for DIFC; FSRA (Financial Services Regulatory Authority) for ADGM |
| Order Gap | Bilateral between DIFC/ADGM and domestic GCC/MENA markets; no GCC-wide fund routing layer |
| Global Network Presence | Clearstream Vestima (UAE funds added Dec 2025); Calastone active in ME from DIFC base |
| Tax Environment | 0% corporate tax, 0% personal income tax, 0% capital gains tax in both DIFC and ADGM |

---

## Market Overview

The UAE operates two fully developed, internationally recognised offshore financial centres — DIFC (Dubai International Financial Centre) in Dubai, and ADGM (Abu Dhabi Global Market) in Abu Dhabi — that together function as the primary fund domicile and distribution hub for the MEASA (Middle East, Africa, and South Asia) region.

Unlike most emerging markets where a central hub is absent, the UAE's challenge is different: the offshore hubs are mature and internationally connected, but the bridge between these hubs and the surrounding domestic GCC markets (Saudi Arabia, Kuwait, Bahrain, Qatar, Oman) remains fragmented and bilateral.

---

## DIFC vs ADGM: Key Differences

| Dimension | DIFC (Dubai International Financial Centre) | ADGM (Abu Dhabi Global Market) |
|---|---|---|
| Established | 2004 | 2015 |
| Regulator | DFSA (Dubai Financial Services Authority) | FSRA (Financial Services Regulatory Authority) |
| Legal system | Independent common law (English law as fallback) | Direct application of English law |
| Fund focus | Broad: traditional investment, private equity, hedge funds | Innovation, digital assets, private credit, sovereign wealth adjacency |
| Ecosystem size | Large, mature; concentration of international banks and law firms | Smaller, boutique; growing; backed by Abu Dhabi sovereign wealth |
| Fintech environment | DIFC FinTech Hive accelerator | FSRA digital lab; first global crypto asset regulatory framework |
| Vestima coverage | Yes (from Dec 2025) | Yes (from Dec 2025) |

---

## Clearstream Vestima — UAE Integration (December 2025)

In December 2025, Clearstream announced that UAE-domiciled funds — including funds from DIFC and ADGM — are now available for execution processing via Vestima, the world's largest cross-border fund processing platform. This is a significant milestone:

- UAE open-ended mutual funds, closed-ended funds, and closed-ended PE (Private Equity) funds including VC (Venture Capital) funds can be processed through Vestima for order routing, settlement, and custody
- International fund managers using Vestima can now access UAE fund products
- UAE-based distributors can route orders to international funds through the same platform
- This positions DIFC/ADGM as a genuine cross-border routing node, not merely a domicile jurisdiction

---

## How Fund Orders Work

### Cross-border institutional flows (via Vestima from Dec 2025)
\`\`\`
International distributor (via Vestima network)
        ↓  standardised ISO 20022 / SWIFT messaging
Clearstream Vestima routing engine
        ↓
UAE fund TA (Transfer Agent) / administrator in DIFC or ADGM
        ↓
Custodian (major international bank with DIFC/ADGM presence)
        ↓
Settlement via DIFC or ADGM clearing infrastructure
\`\`\`

### Bilateral flows — domestic GCC to UAE-domiciled funds (main gap)
\`\`\`
GCC institutional investor or distributor (Saudi, Kuwaiti, etc.)
        ↓  bilateral / proprietary channel
UAE fund manager in DIFC or ADGM
        ↓  manual or semi-automated processing
Local custodian in UAE
        ↓
Settlement
\`\`\`

While DIFC/ADGM are now connected to Vestima for international flows, the domestic-facing side — GCC retail and institutional distributors routing orders into UAE-domiciled funds — remains largely bilateral and manual.

---

## The GCC Regional Routing Gap

The UAE's hub status masks wider structural fragmentation across the GCC. Consider typical scenarios:

- A Saudi retail investor wants to access a DIFC-domiciled multi-asset fund → the Saudi bank platform sends an order bilaterally to the DIFC fund administrator
- A Kuwaiti sovereign wealth institution subscribes to an ADGM-registered fund → bilateral proprietary connection; no standardised messaging
- A Bahraini distributor offers a DIFC QIF (Qualifying Investor Fund) to HNW (High Net Worth) clients → bilateral, manual, spreadsheet-based

There is no GCC-wide fund order routing utility equivalent to Europe's FundHub or Vestima for domestic-to-hub flows. Vestima now handles hub-to-international; the domestic-to-hub layer is the missing piece.

---

## Fund Structures

| Structure Type | Jurisdiction | Notes |
|---|---|---|
| QIF (Qualifying Investor Fund) | DIFC | Professional/institutional investors; fast setup (5–10 working days) |
| RIF (Retail Investment Fund) | DIFC | Retail investors; higher regulatory requirements |
| ADGM Fund | ADGM | Open and closed-ended; flexible structures |
| Cayman / DIFC parallel fund | Both | Common hybrid; Cayman vehicle + DIFC manager |
| Crypto / digital asset fund | ADGM (preferred) | ADGM pioneered global crypto asset regulatory framework |
| Private Credit fund | Both | Growing strategy; alignment with Abu Dhabi sovereign wealth |

---

## Distribution Channels

| Channel | Role | Order Method |
|---|---|---|
| Vestima (Clearstream) | International institutional distribution | Standardised; ISO 20022; live from Dec 2025 for UAE funds |
| DIFC-based private banks / wealth managers | HNW (High Net Worth) and UHNW (Ultra High Net Worth) distribution | Semi-automated bilateral; moving toward Vestima |
| GCC bank platforms | Domestic GCC retail and institutional | Bilateral; manual; the key remaining gap |
| IFAs (Independent Financial Advisors) in DIFC | Retail and HNW advisory | Bilateral; portal-based |
| Insurance companies | ULIP (Unit-Linked Insurance Plan) and savings products | Bilateral; proprietary |

---

## Key Participants

| Entity Type | Key Players |
|---|---|
| DIFC Regulator | DFSA (Dubai Financial Services Authority) |
| ADGM Regulator | FSRA (Financial Services Regulatory Authority) |
| Routing platform | Vestima (Clearstream) — UAE funds covered from Dec 2025 |
| Fund administrators | Apex Group, Trident Trust, IQ-EQ, Vistra, Intertrust |
| Major custodians | HSBC, Citi, Standard Chartered, Deutsche Bank, FAB (First Abu Dhabi Bank) |
| Key AMCs | Emirates NBD Asset Management, Franklin Templeton DIFC |
| Sovereign wealth (adjacent) | ADIA (Abu Dhabi Investment Authority — هيئة أبوظبي للاستثمار), ADQ (Abu Dhabi Developmental Holding Company), Mubadala Investment Company |

---

## Opportunity Matrix Score

| Dimension | Score (1–5) | Notes |
|---|---|---|
| Separate IFC Hub | 5 | Fully realised offshore hubs (DIFC / ADGM) |
| Fund AUM Scale | 4 | GCC USD 2.2T; UAE key driver |
| Order Routing Gap | 4 | Bilateral between hubs and domestic GCC markets; Vestima covers hub-to-international |
| Regulatory Push | 4 | DFSA/FSRA active innovation push |
| Cross-Border Flow Need | 5 | Regional routing hub role — connects GCC to international |
| Calastone Adjacency | 3 | Adjacent to Calastone's ME activity; no confirmed DIFC anchor client |

---

## Questions to Investigate Further

- [ ] How many UAE-domiciled funds are now live on Vestima following the December 2025 integration?
- [ ] Is there any initiative within DIFC or ADGM to build a GCC-wide fund routing utility?
- [ ] Does Calastone have any DIFC-based fund manager or distributor clients?
- [ ] What is the current volume of GCC-to-DIFC bilateral fund orders and what percentage is manual?
- [ ] Are hybrid Cayman/DIFC or Cayman/ADGM structures using Vestima for global distribution?
- [ ] Is there any CMA (Saudi) or CBB (Central Bank of Bahrain) initiative to connect domestic distributors to DIFC/ADGM infrastructure in a standardised way?

---

## Sources

- Clearstream: UAE-domiciled funds for execution processing via Vestima, December 2025
- Ocorian: Key considerations for Fund Managers in the UAE: DIFC vs ADGM, July 2025
- Ogier: Navigating regulatory shifts across Cayman Islands, DIFC and ADGM, February 2026
- DFSA: https://www.dfsa.ae
- FSRA (ADGM): https://www.adgm.com/financial-services/regulators/fsra

---

*Last updated: June 2026 | Next review: Q3 2026*
`,

  "TUR": `# Turkey (IFC Istanbul)

> **ISO3:** TUR | **Region:** Eastern Europe / Middle East crossover | **Market Classification:** Emerging
> **Hub Status:** Partial Hub — TEFAS electronic trading platform exists; IFC Istanbul legally distinct zone; no dedicated fund order-routing utility yet
> **Opportunity Score:** 4/5 | **Calastone Presence:** No confirmed presence

---

## Snapshot

| Field | Detail |
|---|---|
| Fund AUM | Small domestic mutual fund market; IFC still early-stage; TVF (Türkiye Varlık Fonu — Türkiye Wealth Fund) ~USD 290–360B in sovereign strategic assets |
| Market Status | Domestic mutual fund market small relative to GDP; IFC Istanbul is a strategic new financial zone |
| Hub Status | Partial — TEFAS (Türkiye Elektronik Fon Alım Satım Platformu — Electronic Fund Trading Platform) is operational; no dedicated fund order-routing utility |
| TEFAS Operator | Takasbank (clearing) with fund unit transfers via MKK (CSD) |
| IFC Status | IFC Istanbul (Istanbul Finans Merkezi — Istanbul Finance Centre) legally distinct zone; operational from 2022/2024; no fund routing infrastructure yet |
| Key Regulator | SPK (Sermaye Piyasası Kurulu — Capital Markets Board of Turkey) |
| Cross-Border Potential | MENA (Middle East and North Africa) / Central Asia corridor; strategic positioning via IFC |
| Dominant Order Channels | TEFAS for domestic retail; bilateral for institutional and cross-border |
| Global Network Presence | No confirmed Calastone; no Vestima/Clearstream domestic Turkey presence |

---

## Market Overview

Turkey presents a distinctive dual narrative in fund market analysis. Its domestic mutual fund market is relatively small — constrained by high inflation, high interest rates, and investor preference for deposits and FX (foreign exchange) assets. However, the country is making a major strategic bet on financial services through IFC Istanbul (Istanbul Finans Merkezi — Istanbul Finance Centre), a purpose-built, legally distinct financial district on the Asian side of Istanbul, modelled broadly on DIFC and ADGM in concept.

The IFC Istanbul is designed to attract international financial institutions, asset management companies, and brokerage firms through a combination of corporate tax incentives (100% deduction on profits from foreign client services until 2031, then 75%), expat income tax exemptions (60–80% reduction for experienced professionals), and one-stop-shop administration via the IFM (Istanbul Finans Merkezi Yönetimi — Istanbul Finance Centre Management) portal.

---

## TEFAS: The Domestic Partial Hub

TEFAS (Türkiye Elektronik Fon Alım Satım Platformu — Türkiye Electronic Fund Trading Platform) is Turkey's domestic electronic fund trading platform, operated by Takasbank (Takas ve Saklama Bankası — Clearing and Custody Bank). Fund unit transfers are handled through integration between Takasbank and MKK (Merkezi Kayıt Kuruluşu — Central Registry Agency / CSD).

**Why TEFAS is a "partial" hub:**
- It is an electronic platform for fund trading — investors access mutual funds from multiple managers through a single system
- Fund unit transfers are processed between investor and issuer pool accounts in the MKK system
- It provides a degree of centralisation for domestic retail mutual fund access
- However, it is primarily a fund distribution/trading platform, not a standardised order-routing utility equivalent to S-INVEST (Indonesia) or IFP (Hong Kong)
- No dedicated end-to-end order routing, post-trade processing, and reporting module for fund transactions
- No fund routing infrastructure within the IFC Istanbul zone

---

## IFC Istanbul: Architecture and Opportunity

IFC Istanbul (Istanbul Finans Merkezi) is a 1.3-million sq m financial district, fully operational from 2022. Its legal and fiscal architecture:

**Tax incentives:**
- 100% corporate tax deduction on profits from foreign financial service clients (guaranteed until 2031, then 75%)
- 60% income tax exemption for professionals with 5+ years overseas experience
- 80% income tax exemption for professionals with 10+ years overseas experience
- Exemption from rental fees and stamp duties on office space within IFC boundaries

**Administrative simplification:**
- IFM portal consolidates registration across 6 national ministries and local municipalities into a single "participant certificate"
- Replaces separate registrations with Ministry of Treasury, Commerce, and Labour

**Key ecosystem participants at IFC:**
- Public and private sector banks
- AMCs (Portföy Yönetim Şirketleri — Asset Management Companies)
- Brokerage firms (Aracı Kurumlar)
- Capital market institutions

**The fundamental gap:** IFC Istanbul is legally distinct and fiscally attractive, but no mutual fund order-routing infrastructure has been built within or connected to the IFC zone. Fund managers operating from IFC must still rely on TEFAS for domestic Turkish distribution and bilateral connections for cross-border fund business.

---

## TVF: The Sovereign Wealth Context

The TVF (Türkiye Varlık Fonu — Türkiye Wealth Fund) is Turkey's sovereign wealth fund, established by law in 2016. With approximately USD 290–360 billion in AUM (largely comprising strategic equity stakes in Turkey's largest public companies — Türk Telekom, Turkcell, Ziraat Bankası, Halkbank, Borsa İstanbul), TVF is one of the world's larger sovereign wealth funds by book value. It is primarily a strategic asset holding vehicle rather than a traditional investable or distributed fund.

TVF's relevance to fund routing infrastructure: the government's involvement in TVF signals institutional willingness to back strategic financial infrastructure initiatives. Industry assessments reference a government-backed TVF fund routing project — but this has not yet been formalised or launched as of mid-2026.

---

## How Fund Orders Work Today

### Domestic retail orders (via TEFAS)
\`\`\`
Retail Investor
        ↓  TEFAS platform interface (via bank or brokerage)
Takasbank (electronic fund trading execution — Takas ve Saklama Bankası)
        ↓  MKK integration for fund unit transfers
MKK (Merkezi Kayıt Kuruluşu — Central Registry Agency / CSD)
        ↓
Fund Manager (Portföy Yönetim Şirketi — Portfolio Management Company)
        ↓
Custodian bank or fund depository
\`\`\`

### Institutional and cross-border orders (bilateral)
\`\`\`
Institutional investor or foreign distributor
        ↓  bilateral / proprietary channel
Turkish AMC (Portföy Yönetim Şirketi)
        ↓  manual reconciliation
Custodian / local bank
        ↓
MKK for fund unit registration
\`\`\`

**Key manual friction points:**
- No standardised ISO 20022 fund order messaging in domestic use
- Cross-border distribution to/from Turkey remains fully bilateral
- No SWIFT for Funds adoption for Turkish domestic funds
- IFC Istanbul has no fund-specific routing infrastructure

---

## MENA and Central Asia Corridor Potential

Turkey's geographic and geopolitical position makes it a natural potential routing hub for MENA and Central Asia fund flows:

- Strong economic ties with Turkic-speaking Central Asian republics: Kazakhstan, Uzbekistan, Azerbaijan, Turkmenistan, Kyrgyzstan
- IFC Istanbul explicitly targets financial service exportation — providing financial services to foreign clients is the primary business model incentivised by the IFC tax structure
- A fund order-routing infrastructure at IFC Istanbul could position Turkey as the gateway for Central Asian institutional investors accessing global fund markets
- Turkey is an active participant in OIC (Organisation of Islamic Cooperation) capital market initiatives, which include Islamic fund distribution

This is a medium-term opportunity, not a near-term reality. No specific cross-border fund routing initiative for Central Asia has been formally announced.

---

## Key Participants

| Entity Type | Key Players |
|---|---|
| Capital markets regulator | SPK (Sermaye Piyasası Kurulu — Capital Markets Board of Turkey) |
| Exchange | Borsa İstanbul (BIST — Borsa İstanbul Anonim Şirketi) |
| CSD | MKK (Merkezi Kayıt Kuruluşu — Central Registry Agency) |
| Clearing / Settlement | Takasbank (Takas ve Saklama Bankası — Clearing and Custody Bank) |
| Fund trading platform | TEFAS (Türkiye Elektronik Fon Alım Satım Platformu — operated by Takasbank) |
| Sovereign wealth | TVF (Türkiye Varlık Fonu — Türkiye Wealth Fund) |
| IFC administration | IFM (Istanbul Finans Merkezi Yönetimi — Istanbul Finance Centre Management) |
| Major banks | Ziraat Bankası, Halkbank, Garanti BBVA, İş Bankası, Akbank |
| Major fund managers | Ata Portföy, İş Portföy, Garanti Portföy, Yapı Kredi Portföy |

---

## Opportunity Matrix Score

| Dimension | Score (1–5) | Notes |
|---|---|---|
| Separate IFC Hub | 4 | IFC Istanbul is legally distinct; no fund routing built yet |
| Fund AUM Scale | 2 | Small domestically; IFC still early-stage |
| Order Routing Gap | 5 | No fund routing infrastructure exists yet |
| Regulatory Push | 4 | Government-backed TVF project; SPK active |
| Cross-Border Flow Need | 3 | MENA / Central Asia corridor potential |
| Calastone Adjacency | 1 | No current presence |

---

## Questions to Investigate Further

- [ ] Has the SPK or TVF published any formal roadmap for a central fund order-routing utility within or connected to IFC Istanbul?
- [ ] What is the current number of AMCs licensed to operate within IFC Istanbul?
- [ ] Is there any IFC Istanbul working group on financial market infrastructure for funds?
- [ ] How does TEFAS compare to a full hub in terms of order standardisation and STP (Straight-Through Processing) rates?
- [ ] Are any international fund networks (Calastone, Vestima, Allfunds) in dialogue with Turkish authorities or IFC Istanbul?
- [ ] What is the current AUM of domestically distributed Turkish mutual funds?

---

## Sources

- MKK: https://www.mkk.com.tr/en/depository-services/markets-and-platforms/turkey-electronic-fund-trading-platform-tefas
- IFC Istanbul: https://www.ifm.istanbul
- TVF (Türkiye Varlık Fonu): https://www.tvf.com.tr
- Global SWF: TVF fund profile
- Borsa İstanbul IFC report: https://www.borsaistanbul.com/files/Istanbul_International_Financial_Center.pdf
- Property Turkey: Istanbul Financial Center 2026 Guide for Investors, April 2026

---

*Last updated: June 2026 | Next review: Q3 2026*
`,

  "VNM": `# Vietnam / ASEAN

> **ISO3:** VNM | **Region:** Asia — Southeast Asia | **Market Classification:** Frontier → Secondary Emerging (FTSE upgrade effective September 2026)
> **Hub Status:** No Central Hub — no standard domestic fund order-routing utility; VSD (Vietnam Securities Depository and Clearing Corporation) handles equities not fund orders
> **Opportunity Score:** 4/5 | **Calastone Presence:** Active in SG/MY/PH — adjacent; Vietnam not confirmed

---

## Snapshot

| Field | Detail |
|---|---|
| Fund AUM | Small but fast-growing post-MSCI watch and FTSE upgrade; exact AUM figure to verify (see questions below) |
| Market Reclassification | FTSE Russell upgrade from Frontier to Secondary Emerging Market — effective 21 September 2026 (phased to September 2027) |
| Projected Capital Inflows | ~USD 1.5B passive; up to USD 6B total (active + passive) on FTSE inclusion |
| Hub Status | No central fund order-routing hub |
| Key Regulator | SSC (State Securities Commission of Vietnam — Ủy ban Chứng khoán Nhà nước) |
| CSD | VSDC (Vietnam Securities Depository and Clearing Corporation — Tổng công ty Lưu ký và Bù trừ chứng khoán Việt Nam); covers equities settlement, not fund orders |
| Dominant Order Channels | No standard; bilateral between distributors and AMCs; limited electronic channel |
| Cross-Border Status | ASEAN RPC (Regional Payment Connectivity) building; Nexus connectivity initiative; ASEAN+3 CIS cross-border framework in development |
| Global Network Presence | Calastone in Singapore, Malaysia, Philippines — Vietnam not confirmed domestic |

---

## Market Overview

Vietnam is at an inflection point in its capital market development. On 7 April 2026, FTSE Russell confirmed Vietnam's reclassification from Frontier to Secondary Emerging Market status, with an effective date of 21 September 2026 and phased full inclusion through to September 2027. This is the culmination of years of regulatory reforms including the implementation of the global broker model, improvements to settlement processes, pre-funding requirement changes, and enhanced market transparency frameworks.

The FTSE upgrade is expected to unlock approximately USD 1.5 billion in passive inflows and up to USD 6 billion total when active funds are included. Vietnam is also targeting a subsequent upgrade to MSCI Emerging Market status, which would require further structural reforms. This trajectory makes Vietnam one of the most important frontier-to-emerging market transitions of the 2020s.

However, the mutual fund market infrastructure lags significantly behind the equity market reforms. There is no central fund order-routing utility. Fund subscription and redemption orders flow through fragmented, bilateral channels between distributors and AMCs (Asset Management Companies).

---

## FTSE Upgrade: Phased Inclusion Schedule

| Date | Action | Inclusion Level |
|---|---|---|
| 21 September 2026 | Initial inclusion | 10% |
| March 2027 | Step increase | 30% (additional 20%) |
| June 2027 | Step increase | 65% (additional 35%) |
| September 2027 | Full inclusion | 100% (final 35%) |

Large-cap Vietnamese firms in banking, technology, and industrial sectors are expected to be primary beneficiaries of index inclusion.

---

## How Fund Orders Work Today

Vietnam's mutual fund order processing remains highly fragmented. There is no S-INVEST-equivalent (as in Indonesia) or FundConnext-equivalent (as in Thailand):

\`\`\`
Retail / Institutional Investor
        ↓  bank branch / online banking portal / fund company app
Fund Distributor (bank, securities company, or fintech platform)
        ↓  bilateral: email / CSV upload / proprietary API
AMC (Asset Management Company / Công ty Quản lý Quỹ)
        ↓  manual reconciliation and NAV processing
Custodian Bank (Ngân hàng Lưu ký)
        ↓
VSDC (Vietnam Securities Depository and Clearing Corporation) for fund unit registration
\`\`\`

**Key manual friction points:**
- No standardised messaging protocol between distributors and AMCs
- Most fund orders submitted via proprietary bank portals or direct AMC websites
- Reconciliation between distributor records and AMC registers done manually
- Cut-off time fragmentation across different AMCs and custodians
- No ISO 20022 SETR (Securities Transaction) fund order messaging in domestic use
- SWIFT for Funds adoption is absent for domestic Vietnamese funds

---

## VSD/VSDC Role

The VSDC (Vietnam Securities Depository and Clearing Corporation — formerly VSD: Vietnam Securities Depository) handles securities custody, settlement, and clearing for equities and bonds in Vietnam. Its role in the fund market:

- Registers fund units (fund unit certificates) on its system
- Does not operate an order-routing function for fund subscription/redemption
- Handles settlement of fund units between parties after orders are processed
- Is being upgraded in conjunction with the FTSE emerging market reforms (improved settlement processes, global broker model implementation)

The VSDC's equity market reforms are materially ahead of any fund-specific infrastructure development. The FTSE upgrade was achieved primarily through equity market reform, not fund market infrastructure improvement.

---

## SSC and Regulatory Environment

The SSC (State Securities Commission of Vietnam — Ủy ban Chứng khoán Nhà nước) is the primary securities market regulator in Vietnam. It operates under the Ministry of Finance. Key aspects:

- The SSC has been the driving force behind the FTSE upgrade reforms
- Has been active in introducing new legal frameworks to facilitate foreign participation in the equity market
- Mutual fund regulation has been evolving but market infrastructure reform (beyond basic regulation) is less advanced
- No formal SSC consultation on a central fund order-routing utility has been identified as of mid-2026
- Working with VSDC on improving overall capital market settlement infrastructure

---

## ASEAN Connectivity Context

Vietnam is increasingly integrated into ASEAN financial connectivity initiatives that may create demand for better fund order infrastructure:

- **ASEAN RPC (Regional Payment Connectivity)** — a multi-country initiative linking real-time payment systems across ASEAN (Singapore, Thailand, Malaysia, Indonesia, Philippines, Vietnam). This covers payments, not fund orders, but builds the underlying financial messaging infrastructure
- **Nexus (BIS Innovation Hub)** — a multilateral payment connectivity network being developed through the BIS (Bank for International Settlements) Innovation Hub Singapore Centre; Vietnam is building toward Nexus participation
- **ASEAN+3 CIS (Collective Investment Scheme) cross-border framework** — a longer-term initiative to enable mutual fund passporting across ASEAN+3 countries; would require standardised fund order messaging to function
- **APEC ARFP (Asia-Pacific Economic Cooperation Asia Region Funds Passport)** — a broader fund passporting framework; Vietnam's participation aspirations would require better fund plumbing

These frameworks create medium-term demand for fund order routing standardisation, but no specific Vietnamese fund-routing infrastructure project is confirmed.

---

## Distribution Channels

| Channel | Role | Order Method |
|---|---|---|
| Bank branches and online banking (Vietcombank, VPBank, Techcombank, BIDV) | Dominant retail distribution | Proprietary portal; bilateral to AMC |
| Securities companies (Công ty Chứng khoán) | Brokerage-linked distribution | Bilateral; partial electronic |
| Fintech investment apps (Finhay, Momo, VNDirect) | Emerging retail | API bilateral; proprietary |
| Direct AMC channels | Online fund purchase via AMC website | Direct; no standard messaging |
| Insurance-linked products | Endowment and savings products | Highly manual; bilateral |

---

## Key Participants

| Entity Type | Key Players |
|---|---|
| Regulator | SSC (State Securities Commission — Ủy ban Chứng khoán Nhà nước) |
| CSD / Clearing | VSDC (Vietnam Securities Depository and Clearing Corporation — Tổng công ty Lưu ký và Bù trừ chứng khoán Việt Nam) |
| Exchange | HOSE (Ho Chi Minh Stock Exchange — Sở Giao dịch Chứng khoán TP.HCM); HNX (Hanoi Stock Exchange — Sở Giao dịch Chứng khoán Hà Nội) |
| Custodian Banks | Standard Chartered Vietnam, HSBC Vietnam, Citi Vietnam, Vietcombank |
| Major AMCs | VinaCapital, Dragon Capital, SSI Asset Management (SSIAM), VFM (Vietnam Fund Management) |
| State-owned banks (distributors) | Vietcombank, BIDV, VietinBank, Agribank |
| Fintech platforms | Finhay, Momo, VNDirect, TCBS (Techcom Securities) |

---

## Opportunity Matrix Score

| Dimension | Score (1–5) | Notes |
|---|---|---|
| Separate IFC Hub | 2 | No hub; ASEAN RPC framework forming |
| Fund AUM Scale | 2 | Small but fast-growing post-MSCI upgrade |
| Order Routing Gap | 4 | No standard; domestic payments efficient but cross-border fund routing absent |
| Regulatory Push | 3 | SSC (State Securities Commission) active but slower than peers on fund-specific infrastructure |
| Cross-Border Flow Need | 3 | Nexus connectivity building; ASEAN+3 CIS framework developing |
| Calastone Adjacency | 5 | Calastone in SG/MY/PH — very adjacent; Vietnam natural next step |

---

## Questions to Investigate Further

- [ ] What is the total AUM of Vietnam's mutual fund industry as of 2025/2026?
- [ ] How many fund management companies (AMCs) are licensed by SSC?
- [ ] Is SSC or VSDC consulting on any central fund order-routing utility?
- [ ] How does VSDC's fund unit registration process interact with bilateral distributor-AMC order flows?
- [ ] Which Vietnamese banks have the largest fund distribution volumes?
- [ ] Is Calastone in active dialogue with Vietnamese fund managers or distributors?
- [ ] What is the timeline for Vietnam's potential MSCI Emerging Market upgrade?
- [ ] Is Vietnam participating in the ASEAN+3 CIS (Collective Investment Scheme) working group on cross-border fund distribution infrastructure?

---

## Sources

- FTSE Russell: Country Classification September 2025 — Vietnam reclassified to Secondary Emerging Market, effective 21 September 2026
- Vietnam Briefing: "Vietnam Secures FTSE Emerging Market Status Upgrade", April 2026
- VanEck: "Why Vietnam Stands Out in EM Right Now", April 2026
- World Bank: "Unlocking the Potential of Vietnam's Capital Markets" report
- SSIAM Annual Report 2024
- Calastone SEA expansion: Singapore HQ announcement, August 2022

---

*Last updated: June 2026 | Next review: Q3 2026*
`,

  "CHN": `# China

> **ISO3:** CHN | **Region:** Asia | **Sub-region:** East Asia | **Classification:** Emerging | **Hub Status:** Partial hub — domestic infrastructure exists but is not equivalent to an open, neutral cross-border hub

---

## Market Overview

China is the world's second-largest economy and an increasingly important — if tightly controlled — emerging market for mutual fund distribution and financial infrastructure. The capital account has moved from fully closed to **partially open**, but access remains channelled through regulated programs with quotas and safeguards, making it materially more restricted than advanced economies. China's Renminbi (RMB) internationalisation agenda and the pivotal role of Hong Kong as an offshore gateway shape all cross-border fund flows.

Capital account liberalisation has proceeded incrementally across successive Five Year Plans:
- **2001–2005 (10th Plan):** Emphasis on Chinese Yuan (CNY) stability.
- **2006–2010 (11th Plan):** Steps toward capital account convertibility signalled.
- **2011–2015 (12th Plan):** Increased international use of CNY; exchange-rate regime reform.
- **2016–2020 (13th Plan):** Systematic steps toward convertibility; easing on CNY-denominated bond issuance; more flexible exchange rate.

Despite this trajectory, the Asian Financial Crisis (1997) remains a historical anchor for policymakers: China's insulation at the time (via a US Dollar peg and strict controls) reinforced a cautious, state-managed approach to liberalisation that persists today.

A timeline of tightening capital-flow controls documented between mid-2016 and mid-2017 — including restrictions on cross-border internet sales, stricter reporting thresholds for suspicious transactions (reduced from CNY 200,000 to CNY 50,000 for daily cross-border transactions), and clampdowns on outbound foreign direct investment (FDI) — illustrates that liberalisation is not linear.

---

## How Fund Orders Work Today

### Domestic Settlement and Registration Spine

The **China Securities Depository and Clearing Corporation (CSDC)**, also known as **ChinaClear**, acts as the domestic Central Securities Depository (CSD) and Central Counterparty (CCP) for securities listed on the Shanghai and Shenzhen exchanges. It is broadly analogous in role to the **Depository Trust and Clearing Corporation (DTCC)** in the United States.

Key CSDC/ChinaClear functions relevant to mutual funds:
- Provides centralised registration and depository services via a book-entry system.
- Many securities are directly registered at beneficial-owner level, reducing reliance on nominee structures in the core domestic model.
- Operates a dedicated **fund collection and payment system** via its Shanghai and Shenzhen branches, supporting the fund subscription, redemption and settlement lifecycle at infrastructure level.

### Role of Custodian Banks in Cross-Border Programs

Under the **Qualified Domestic Institutional Investor (QDII)** program (active since 2006), custody is a key functional role: offshore custodians provide market access and safekeeping for overseas assets. An example captured in the dossier is China Southern Fund Management Company selecting **BNY (Bank of New York Mellon)** as offshore custodian. Large global custodians such as BNY are seen as potential sources of operational intelligence on quota management, foreign exchange (FX) conversion, settlement and reporting end-to-end in the QDII chain.

### Mutual Recognition of Funds (MRF) Operational Flow

The **Mutual Recognition of Funds (MRF)** scheme links Mainland China and Hong Kong fund distribution. Two directional flows operate:

**Northbound MRF** (Hong Kong fund sold to Mainland investor):
1. Mainland retail investor places order with Mainland distributor (bank or platform).
2. Distributor submits order via the **Financial Data Exchange Platform (FDEP)** on the Mainland.
3. CSDC/ChinaClear consolidates all Mainland orders for that Hong Kong fund.
4. Aggregated order is sent via **CMU OmniClear** (the Central Moneymarkets Unit OmniClear operated by the Hong Kong Monetary Authority) to the correct Hong Kong-side recipient.
5. The Hong Kong fund's Transfer Agent (TA) processes the order and updates the register; confirmation flows back through the same chain.

**Southbound MRF** (Mainland fund sold to Hong Kong investor):
1. Hong Kong retail investor places order with a Hong Kong distributor (CMU member).
2. Distributor submits order via CMU OmniClear, which routes to the Mainland side.
3. Mainland TA / Fund House (including ChinaClear where applicable) processes and confirms.

**Calastone's position** in this flow is upstream of CMU OmniClear on the Hong Kong side:
- Global/HK distributor → Calastone (normalises formats, routes to correct TA or CMU) → CMU OmniClear (for MRF orders needing cross-border routing) → Mainland TA / ChinaClear.

### MRF 2.0 Update (January 2025) — Infrastructure Implications

Key changes with direct order-routing relevance:
1. **Sales cap relaxed from 50% to 80%**: materially increases potential order volumes through the cross-border chain.
2. **Investment management delegation**: managers can delegate to overseas members within the MRF group, adding new intermediary nodes.
3. **Additional fund categories**: scope expansion may bring new product types into the flow.

As of 30 November 2024: **43 Mainland funds** were authorised and **41 Hong Kong funds** approved under MRF; cumulative net subscriptions were approximately **RMB 41.5 billion northbound** and **RMB 882.8 million southbound**. The cap change is expected to expand flows further.

### Stock Connect (Contextual Adjacent Infrastructure)

**Stock Connect** enables foreign investors to access A-shares via Hong Kong brokers (northbound) and Mainland investors to access Hong Kong-listed stocks (southbound). Securities exchange occurs on trade date; cash settles **T+1** through CSDC, with **HKEX (Hong Kong Exchanges and Clearing)** post-trade infrastructure facilitating the link. While not a mutual fund channel, it provides a precedent for cross-border connectivity patterns.

---

## Distribution Channels

The dossier identifies the following distribution and access channels for cross-border fund flows:

| Channel | Direction | Notes |
|---|---|---|
| **QFII** (Qualified Foreign Institutional Investor, est. 2002) | Inbound | Approved foreign institutions convert FX into RMB to invest in mainland exchanges |
| **RQFII** (Renminbi Qualified Foreign Institutional Investor, est. 2011) | Inbound | Approved foreign institutions invest using existing offshore RMB, avoiding FX→RMB conversion |
| **QDII** (Qualified Domestic Institutional Investor, est. 2006) | Outbound | Approved Chinese institutional investors invest in overseas securities; subject to SAFE quotas |
| **MRF / MRF 2.0** (Mutual Recognition of Funds) | Bi-directional (HK ↔ Mainland) | Northbound: HK funds sold to Mainland investors; Southbound: Mainland funds sold to HK investors |
| **Stock Connect** | Bi-directional (equities) | Northbound A-share access and southbound HK-share access; adjacent infrastructure precedent |
| **CIBM Direct** (China Interbank Bond Market Direct, est. 2017) | Inbound (bonds) | Foreign participation in onshore bond markets |
| **Bond Connect** | Inbound (bonds) | Foreigners buying bonds in Shanghai or Shenzhen via Hong Kong |

Domestic subscription and redemption channels — via CSDC, via banks, and via digital platforms — are noted as requiring further investigation on messaging standards (Society for Worldwide Interbank Financial Telecommunication (SWIFT), ISO 20022, or proprietary).

---

## Key Participants

### Regulators and Authorities
- **SAFE** (State Administration of Foreign Exchange): gatekeeper for QDII quotas and capital movement constraints.
- **CSRC** (China Securities Regulatory Commission): approves domestic market infrastructure; implicitly governs CSDC/ChinaClear.
- **PBOC** (People's Bank of China): referenced alongside SAFE, CIRC and MOF as issuing capital-flow control measures.
- **MOF** (Ministry of Finance): referenced in capital-flow control context.
- **CIRC** (China Insurance Regulatory Commission): referenced in capital-flow control measures.

### Market Infrastructure
- **CSDC / ChinaClear**: central domestic CSD/CCP; also operates the fund collection and payment system.
- **FDEP** (Financial Data Exchange Platform): Mainland-side order submission platform within the northbound MRF flow.
- **CMU OmniClear** (Central Moneymarkets Unit OmniClear, HKMA): routes cross-border MRF orders between Hong Kong and the Mainland.
- **HKEX** (Hong Kong Exchanges and Clearing): post-trade infrastructure for Stock Connect.

### Fund Managers and Custodians (Examples)
- **China Southern Fund Management Company**: example QDII participant.
- **BNY (Bank of New York Mellon)**: offshore custodian example in the QDII chain.
- **China AMC** and **Harvest Fund Management (Harvest FM)**: mentioned as potential vehicles for offshore investing on behalf of large pools (to be validated).

---

## Risks and Barriers

1. **Capital account controls**: China's partially open capital account means access is always mediated by quotas, approvals and safeguard mechanisms; these can tighten at short notice (as demonstrated by the 2016–2017 measures).
2. **Regulatory posture toward foreign infrastructure providers**: the political and regulatory stance toward foreign financial infrastructure providers is an open question requiring active monitoring; state-owned and CSRC-approved entities dominate domestic market infrastructure.
3. **Fragmented and proprietary domestic infrastructure**: the messaging standards used for domestic fund orders (SWIFT, ISO 20022, or proprietary) are not yet documented; interoperability with global platforms remains uncertain.
4. **Nominee vs. beneficial owner complexity**: the domestic model tends toward direct beneficial-owner registration, which differs from nominee-based structures common in cross-border fund operations; this creates operational friction.
5. **FX and settlement complexity**: QDII and MRF flows involve multi-step FX conversion, quota management and bifurcated settlement models that require specialist operational capability.
6. **Manual processing residue**: the extent of manual processing across the fund lifecycle is noted as an open question; this represents both a risk (operational error, latency) and a potential opportunity for automation.
7. **MRF flow imbalance**: northbound cumulative net subscriptions (approx. RMB 41.5bn) far exceed southbound (approx. RMB 882.8m), indicating structural asymmetry in cross-border demand.
8. **Geopolitical and policy risk**: Beijing's stimulus posture and broader macro trajectory (economy projected to grow approximately 4.8% in 2026) create a complex backdrop where policy pivots can materially alter channel dynamics.

---

## Sources

- China Market Research Framework – Calastone internal dossier (PDF)
- Goldman Sachs raises China stocks forecast after Beijing's stimulus pledge
- China's Economy is Expected to Grow 4.8% in 2026 Amid Surging Exports
- MERICS (Mercator Institute for China Studies) capital account liberalisation data
- PBOC, SAFE, CIRC, MOF regulatory measures (as cited in MERICS)`
};

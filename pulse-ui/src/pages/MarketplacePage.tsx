import SoftAurora from '@/bits/SoftAurora/SoftAurora';
import Noise from '@/bits/Noise/Noise';
import ChromaGrid, { type ChromaItem } from '@/bits/ChromaGrid/ChromaGrid';
import RotatingText from '@/bits/RotatingText/RotatingText';
import BorderGlow from '@/bits/BorderGlow/BorderGlow';
import { PulseHeader } from '@/components/PulseHeader';

const AGENT_TILES: ChromaItem[] = [
  {
    image:
      'data:image/svg+xml,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0C1A2E"/><stop offset="0.85" stop-color="#1B3A6B"/><stop offset="1" stop-color="#9F1239"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="54%" text-anchor="middle" fill="white" font-family="system-ui" font-size="42" font-weight="700">Research</text></svg>`
      ),
    title: 'Atlas Research Agent',
    subtitle: 'Country opportunity briefs and competitor scans',
    handle: 'Research',
    location: 'Install',
    borderColor: '#1B3A6B',
    gradient: 'linear-gradient(145deg, #1B3A6B, #0d1418)',
    url: '/tools/market-research/index.html',
  },
  {
    image:
      'data:image/svg+xml,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#132743"/><stop offset="0.88" stop-color="#2F5285"/><stop offset="1" stop-color="#9F1239"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="54%" text-anchor="middle" fill="white" font-family="system-ui" font-size="42" font-weight="700">Routing</text></svg>`
      ),
    title: 'Order Routing Copilot',
    subtitle: 'Hub-and-spoke path suggestions for pitches',
    handle: 'Routing',
    location: 'Try',
    borderColor: '#1B3A6B',
    gradient: 'linear-gradient(165deg, #1B3A6B, #0d1418)',
    url: '/tools/product-demo/index.html',
  },
  {
    image:
      'data:image/svg+xml,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#2F5285"/><stop offset="1" stop-color="#22323d"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="54%" text-anchor="middle" fill="white" font-family="system-ui" font-size="42" font-weight="700">CRM</text></svg>`
      ),
    title: 'Account Briefing Agent',
    subtitle: 'Daily Salesforce dossier prep and signal triage',
    handle: 'Accounts',
    location: 'Install',
    borderColor: '#2F5285',
    gradient: 'linear-gradient(195deg, #2F5285, #0d1418)',
    url: '/tools/account-tracker/index.html',
  },
  {
    image:
      'data:image/svg+xml,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0C1A2E"/><stop offset="1" stop-color="#2F5285"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="54%" text-anchor="middle" fill="white" font-family="system-ui" font-size="42" font-weight="700">Intel</text></svg>`
      ),
    title: 'Relationship Snapshot',
    subtitle: 'Ask Atlas for CTN-ready relationship packs',
    handle: 'Intelligence',
    location: 'Try',
    borderColor: '#1B3A6B',
    gradient: 'linear-gradient(210deg, #1B3A6B, #0d1418)',
    url: '/tools/phaeron-intelligence/index.html',
  },
  {
    image:
      'data:image/svg+xml,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0C1A2E"/><stop offset="0.9" stop-color="#1B3A6B"/><stop offset="1" stop-color="#9F1239"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="54%" text-anchor="middle" fill="white" font-family="system-ui" font-size="42" font-weight="700">Signals</text></svg>`
      ),
    title: 'Market Movement Watch',
    subtitle: 'Regulatory and competitor alerts by country',
    handle: 'Movement',
    location: 'Install',
    borderColor: '#1B3A6B',
    gradient: 'linear-gradient(225deg, #1B3A6B, #0d1418)',
    url: '/tools/market-movement/index.html',
  },
  {
    image:
      'data:image/svg+xml,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#5B7AAB"/><stop offset="1" stop-color="#0d1418"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="54%" text-anchor="middle" fill="white" font-family="system-ui" font-size="42" font-weight="700">Email</text></svg>`
      ),
    title: 'Outreach Drafter',
    subtitle: 'Meeting prep and follow-up email drafts',
    handle: 'Outreach',
    location: 'Soon',
    borderColor: '#5B7AAB',
    gradient: 'linear-gradient(135deg, #5B7AAB, #0d1418)',
    url: '/ui/marketplace.html',
  },
];

export function MarketplacePage() {
  return (
    <div className="pulse-shell">
      <div className="pulse-aurora" aria-hidden>
        <SoftAurora lightMode color1="#07111F" color2="#1B3A6B" brightness={0.95} speed={0.5} />
      </div>
      <div className="pulse-noise" aria-hidden>
        <Noise patternAlpha={8} />
      </div>
      <div className="pulse-shell-content">
        <PulseHeader />
        <main className="pulse-main market-hero">
          <div className="badge">
            <span className="live-dot" />
            Agent catalog
          </div>
          <h1>Agent Marketplace</h1>
          <div className="rotating-wrap">
            <span>Agents for</span>
            <RotatingText
              texts={['research', 'routing', 'outreach', 'account intel']}
              mainClassName="px-2 overflow-hidden justify-center rounded-lg"
              staggerFrom="last"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-120%' }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden"
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              rotationInterval={2200}
              style={{ color: '#1B3A6B', fontWeight: 700 }}
            />
          </div>

          <div style={{ marginTop: 28 }}>
            <BorderGlow
              className="market-border"
              glowColor="27 58 107"
              backgroundColor="#F2F5FA"
              borderRadius={24}
              colors={['#0C1A2E', '#1B3A6B', '#2F5285', '#9F1239']}
              fillOpacity={0.22}
              glowIntensity={0.85}
            >
              <ChromaGrid items={AGENT_TILES} columns={3} rows={2} radius={260} openInNewTab={false} />
            </BorderGlow>
          </div>
        </main>
      </div>
    </div>
  );
}

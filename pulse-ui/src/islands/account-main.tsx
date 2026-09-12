import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import CountUp from '@/bits/CountUp/CountUp';
import AnimatedList from '@/bits/AnimatedList/AnimatedList';
import FadeContent from '@/bits/FadeContent/FadeContent';
import SpotlightCard from '@/bits/SpotlightCard/SpotlightCard';
import '@/styles/pulse-ui.css';

const SIGNALS = [
  'BlackRock · T+1 readiness workshop booked',
  'Schroders · Pricing committee moved to Jul 2',
  'LGIM · No contact in 21 days — nudge recommended',
  'Goldman · ISIN mapping delta on CTN corridor',
  'Fidelity · Competitor RFP signal in UK distributor channel',
];

function AccountPolish() {
  return (
    <FadeContent duration={600} blur>
      <div className="account-kpi-rail">
        <SpotlightCard className="account-kpi" spotlightColor="rgba(27, 58, 107, 0.16)">
          <div className="label">Pipeline value</div>
          <div className="value">
            £<CountUp to={48.2} from={0} duration={1.6} separator="," />
            m
          </div>
        </SpotlightCard>
        <SpotlightCard className="account-kpi" spotlightColor="rgba(225, 29, 72, 0.14)">
          <div className="label">Open accounts</div>
          <div className="value">
            <CountUp to={4} duration={1.2} />
          </div>
        </SpotlightCard>
        <SpotlightCard className="account-kpi" spotlightColor="rgba(47, 82, 133, 0.16)">
          <div className="label">Signals (30d)</div>
          <div className="value">
            <CountUp to={17} duration={1.4} />
          </div>
        </SpotlightCard>
      </div>
      <div className="account-signal-list">
        <AnimatedList
          items={SIGNALS}
          showGradients
          enableArrowNavigation={false}
          displayScrollbar={false}
          className="scroll-list-container"
          itemClassName="item"
        />
      </div>
    </FadeContent>
  );
}

const el = document.getElementById('pulse-react-account');
if (el) {
  createRoot(el).render(
    <StrictMode>
      <AccountPolish />
    </StrictMode>
  );
}

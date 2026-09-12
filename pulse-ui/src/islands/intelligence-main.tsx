import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import TextType from '@/bits/TextType/TextType';
import Orb from '@/bits/Orb/Orb';
import GlareHover from '@/bits/GlareHover/GlareHover';
import '@/styles/pulse-ui.css';

function IntelligenceEmpty() {
  return (
    <div className="intel-empty-enhance">
      <div className="intel-orb-wrap">
        <Orb hue={160} hoverIntensity={0.35} rotateOnHover backgroundColor="#F2F5FA" />
      </div>
      <TextType
        text={[
          'Ask Atlas about products, markets, or accounts…',
          'Generate a relationship snapshot for any CTN…',
          'Surface billing, stage, and RM context in seconds…',
        ]}
        typingSpeed={38}
        pauseDuration={2200}
        deletingSpeed={22}
        className="intel-type"
        cursorCharacter="▍"
        cursorClassName="intel-cursor"
        textColors={['#22323d']}
        loop
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 6 }}>
        {['Digital TA stage', 'BlackRock charging', 'CTN 303 snapshot'].map((label) => (
          <GlareHover
            key={label}
            width="auto"
            height="auto"
            background="#ffffff"
            borderColor="#E4EAF3"
            borderRadius="999px"
            glareColor="#1B3A6B"
            glareOpacity={0.22}
            style={{ padding: '8px 14px', fontSize: 12, fontWeight: 600, color: '#1A3558' }}
          >
            {label}
          </GlareHover>
        ))}
      </div>
    </div>
  );
}

const el = document.getElementById('pulse-react-intelligence');
if (el) {
  createRoot(el).render(
    <StrictMode>
      <IntelligenceEmpty />
    </StrictMode>
  );
}

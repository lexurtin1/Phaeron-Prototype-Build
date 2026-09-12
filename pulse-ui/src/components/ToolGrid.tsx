import SpotlightCard from '@/bits/SpotlightCard/SpotlightCard';
import Magnet from '@/bits/Magnet/Magnet';
import GlareHover from '@/bits/GlareHover/GlareHover';
import FadeContent from '@/bits/FadeContent/FadeContent';
import { PULSE_TOOLS, type PulseTool } from '@/lib/tools';

function ToolCard({ tool, index }: { tool: PulseTool; index: number }) {
  const spotlight = 'rgba(45, 154, 142, 0.18)' as const;
  const inner = (
    <SpotlightCard className="" spotlightColor={spotlight}>
      <GlareHover
        width="100%"
        height="100%"
        background="transparent"
        borderRadius="16px"
        glareColor="#2d9a8e"
        glareOpacity={0.18}
        glareSize={220}
        transitionDuration={650}
        style={{ width: '100%', height: '100%' }}
      >
        <span className="tool-card-num">{tool.num}</span>
        <h2 className="tool-card-title">{tool.title}</h2>
        <p className="tool-card-desc">{tool.description}</p>
        {tool.comingSoon ? <span className="tool-card-soon">Coming soon</span> : null}
      </GlareHover>
    </SpotlightCard>
  );

  return (
    <FadeContent delay={index * 60} duration={700} blur>
      {tool.comingSoon ? (
        <div className="tool-card-link" aria-disabled="true" style={{ opacity: 0.72 }}>
          {inner}
        </div>
      ) : (
        <Magnet padding={48} magnetStrength={9} wrapperClassName="tool-card-magnet">
          <a href={tool.href} className="tool-card-link" style={{ display: 'block', textDecoration: 'none' }}>
            {inner}
          </a>
        </Magnet>
      )}
    </FadeContent>
  );
}

export function ToolGrid() {
  return (
    <div className="tool-grid">
      {PULSE_TOOLS.map((tool, i) => (
        <ToolCard key={tool.id} tool={tool} index={i} />
      ))}
    </div>
  );
}

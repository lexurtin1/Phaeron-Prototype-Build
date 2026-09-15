import { PULSE_CARD_TOOLS } from '@/lib/tools';

export function ToolGrid() {
  return (
    <div className="tool-grid">
      {PULSE_CARD_TOOLS.map((tool) => (
        <a key={tool.id} href={tool.href} className="tool-card">
          <span className="card-num">{tool.num}</span>
          <div className="card-icon">{tool.icon}</div>
          <h2>{tool.title}</h2>
          <p>{tool.description}</p>
        </a>
      ))}
    </div>
  );
}

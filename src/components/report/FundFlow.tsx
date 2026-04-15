import type { FundFlowNode, FundFlowEdge } from '@/lib/types';

interface FundFlowProps {
  nodes: FundFlowNode[];
  edges: FundFlowEdge[];
}

const nodeColors: Record<string, { stroke: string; fill: string }> = {
  source: { stroke: '#5B8DEF', fill: 'rgba(91, 141, 239, 0.06)' },
  attacker: { stroke: '#FF3B5C', fill: 'rgba(255, 59, 92, 0.06)' },
  contract: { stroke: 'rgba(255,255,255,0.10)', fill: 'var(--color-bg-surface)' },
  dex: { stroke: 'rgba(255,255,255,0.10)', fill: 'var(--color-bg-surface)' },
  exit: { stroke: '#FF8C42', fill: 'rgba(255, 140, 66, 0.06)' },
};

const phaseColors: Record<string, string> = {
  funding: '#5B8DEF',
  exploit: '#FF3B5C',
  exit: '#FF8C42',
};

const nodeWidth = 160;
const nodeHeight = 40;

export function FundFlow({ nodes, edges }: FundFlowProps) {
  // Build position map — use explicit x,y if available, otherwise auto-layout
  const positions: Record<string, { x: number; y: number }> = {};
  const hasExplicit = nodes.some((n) => n.x !== undefined && n.y !== undefined);

  if (hasExplicit) {
    nodes.forEach((n) => {
      positions[n.id] = { x: n.x ?? 350, y: n.y ?? 0 };
    });
  } else {
    const cx = 350;
    nodes.forEach((n, i) => {
      positions[n.id] = { x: cx, y: 30 + i * 70 };
    });
  }

  // Calculate SVG bounds
  let maxY = 0;
  let maxX = 0;
  Object.values(positions).forEach((p) => {
    if (p.y + nodeHeight > maxY) maxY = p.y + nodeHeight;
    if (p.x + nodeWidth / 2 > maxX) maxX = p.x + nodeWidth / 2;
  });
  const svgHeight = maxY + 40;
  const svgWidth = Math.max(700, maxX + 40);

  return (
    <div className="fund-flow-section mb-8 overflow-x-auto">
      <div className="flex items-center gap-4 mb-4">
        {[
          { label: 'Funding', color: phaseColors.funding },
          { label: 'Exploit', color: phaseColors.exploit },
          { label: 'Exit', color: phaseColors.exit },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-0.5"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full max-w-2xl mx-auto"
        style={{ minWidth: '450px' }}
      >
        <defs>
          {['funding', 'exploit', 'exit'].map((phase) => (
            <marker
              key={phase}
              id={`flow-arrow-${phase}`}
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={phaseColors[phase]} />
            </marker>
          ))}
        </defs>

        {/* Edges */}
        {edges.map((edge, i) => {
          const from = positions[edge.from];
          const to = positions[edge.to];
          if (!from || !to) return null;

          const color = phaseColors[edge.phase] || 'var(--color-text-tertiary)';
          const sameX = Math.abs(from.x - to.x) < 10;

          let pathD: string;
          let labelX: number;
          let labelY: number;

          if (sameX) {
            // Vertical connection — straight line
            const startY = from.y + nodeHeight;
            const endY = to.y - 6;
            pathD = `M ${from.x} ${startY} L ${to.x} ${endY}`;
            labelX = from.x + nodeWidth / 2 + 8;
            labelY = (startY + endY) / 2 + 3;
          } else {
            // Non-aligned — L-shaped elbow connector
            const startX = from.x;
            const startY = from.y + nodeHeight;
            const endX = to.x;
            const endY = to.y - 6;
            const midY = startY + (endY - startY) * 0.4;

            pathD = `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
            labelX = (startX + endX) / 2;
            labelY = midY - 5;
          }

          return (
            <g key={i}>
              <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                opacity="0.7"
                markerEnd={`url(#flow-arrow-${edge.phase})`}
              />
              {edge.label && (
                <text
                  x={labelX}
                  y={labelY}
                  fill={color}
                  fontSize="9"
                  fontFamily="var(--font-jetbrains), monospace"
                  opacity="0.8"
                  textAnchor={sameX ? 'start' : 'middle'}
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const pos = positions[node.id];
          const colors = nodeColors[node.type] || nodeColors.contract;
          const isPrivacy = node.type === 'source' || node.type === 'exit';

          return (
            <g key={node.id}>
              <rect
                x={pos.x - nodeWidth / 2}
                y={pos.y}
                width={nodeWidth}
                height={nodeHeight}
                rx="6"
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth="1"
                strokeDasharray={isPrivacy ? '4 3' : undefined}
              />
              <text
                x={pos.x}
                y={pos.y + nodeHeight / 2 + 4}
                textAnchor="middle"
                fill="var(--color-text-primary)"
                fontSize="11"
                fontFamily="var(--font-jetbrains), monospace"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

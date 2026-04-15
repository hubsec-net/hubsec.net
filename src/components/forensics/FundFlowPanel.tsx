interface FlowNode {
  id: string;
  label: string;
  sublabel: string;
  x: number;
  y: number;
  type: 'privacy' | 'attacker' | 'contract' | 'dex' | 'exit';
}

interface FlowEdge {
  from: string;
  to: string;
  label: string;
  phase: 'funding' | 'exploit' | 'exit';
}

const nodes: FlowNode[] = [
  { id: 'railgun-in', label: 'Railgun', sublabel: '0.5 ETH', x: 80, y: 40, type: 'privacy' },
  { id: 'attacker', label: '0xC513...F8E7', sublabel: 'Attacker EOA', x: 80, y: 120, type: 'attacker' },
  { id: 'master', label: '0x518A...8f26', sublabel: 'Master Contract', x: 80, y: 200, type: 'contract' },
  { id: 'handler', label: '0x6C84...6D64', sublabel: 'HandlerV1', x: 260, y: 200, type: 'contract' },
  { id: 'gateway', label: '0xFd41...B6dE', sublabel: 'TokenGateway', x: 440, y: 200, type: 'contract' },
  { id: 'dot', label: 'Bridged DOT', sublabel: '1B DOT minted', x: 440, y: 290, type: 'contract' },
  { id: 'odos', label: 'Odos Router', sublabel: '', x: 260, y: 380, type: 'dex' },
  { id: 'uniswap', label: 'Uniswap V3', sublabel: '108.2 ETH', x: 440, y: 380, type: 'dex' },
  { id: 'railgun-out', label: 'Railgun', sublabel: '15 ETH increments', x: 350, y: 460, type: 'privacy' },
];

const edges: FlowEdge[] = [
  { from: 'railgun-in', to: 'attacker', label: '0.5 ETH', phase: 'funding' },
  { from: 'attacker', to: 'master', label: 'deploy + call', phase: 'exploit' },
  { from: 'master', to: 'handler', label: 'forged proof', phase: 'exploit' },
  { from: 'handler', to: 'gateway', label: 'setAdmin()', phase: 'exploit' },
  { from: 'gateway', to: 'dot', label: 'mint(1B)', phase: 'exploit' },
  { from: 'dot', to: 'odos', label: 'DOT swap', phase: 'exit' },
  { from: 'dot', to: 'uniswap', label: 'DOT swap', phase: 'exit' },
  { from: 'odos', to: 'railgun-out', label: 'ETH', phase: 'exit' },
  { from: 'uniswap', to: 'railgun-out', label: 'ETH', phase: 'exit' },
];

const phaseColors: Record<string, string> = {
  funding: '#5B8DEF',
  exploit: '#FF3B5C',
  exit: '#FF8C42',
};

const nodeColors: Record<string, { stroke: string; fill: string }> = {
  privacy: { stroke: '#5B8DEF', fill: 'rgba(91, 141, 239, 0.06)' },
  attacker: { stroke: '#FF3B5C', fill: 'rgba(255, 59, 92, 0.06)' },
  contract: { stroke: 'rgba(255,255,255,0.10)', fill: 'var(--color-bg-surface)' },
  dex: { stroke: 'rgba(255,255,255,0.10)', fill: 'var(--color-bg-surface)' },
  exit: { stroke: '#FF8C42', fill: 'rgba(255, 140, 66, 0.06)' },
};

const nodeWidth = 150;
const nodeHeight = 48;

export function FundFlowPanel() {
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <span
          className="text-xs uppercase"
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            color: 'var(--color-text-tertiary)',
            letterSpacing: 'var(--tracking-wide)',
          }}
        >
          Fund Flow
        </span>
        <div className="flex items-center gap-4">
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
      </div>

      <div className="overflow-x-auto">
        <svg viewBox="0 0 600 530" className="w-full" style={{ minWidth: '500px' }}>
          <defs>
            {['funding', 'exploit', 'exit'].map((phase) => (
              <marker
                key={phase}
                id={`demo-flow-arrow-${phase}`}
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
            const from = nodeMap[edge.from];
            const to = nodeMap[edge.to];
            if (!from || !to) return null;

            const color = phaseColors[edge.phase];
            const fromCx = from.x + nodeWidth / 2;
            const fromCy = from.y + nodeHeight / 2;
            const toCx = to.x + nodeWidth / 2;
            const toCy = to.y + nodeHeight / 2;

            const sameX = Math.abs(fromCx - toCx) < 10;
            const sameY = Math.abs(fromCy - toCy) < 10;

            let pathD: string;
            let labelX: number;
            let labelY: number;

            if (sameX) {
              // Vertical — straight line
              const sy = from.y + nodeHeight;
              const ey = to.y - 6;
              pathD = `M ${fromCx} ${sy} L ${toCx} ${ey}`;
              labelX = fromCx + nodeWidth / 2 + 4;
              labelY = (sy + ey) / 2 + 3;
            } else if (sameY) {
              // Horizontal — straight line
              const sx = fromCx < toCx ? from.x + nodeWidth : from.x;
              const ex = fromCx < toCx ? to.x - 6 : to.x + nodeWidth + 6;
              pathD = `M ${sx} ${fromCy} L ${ex} ${toCy}`;
              labelX = (sx + ex) / 2;
              labelY = fromCy - 6;
            } else {
              // L-shaped elbow connector
              const startX = fromCx;
              const startY = from.y + nodeHeight;
              const endX = toCx;
              const endY = to.y - 6;

              // Determine elbow direction based on whether horizontal or vertical first makes more sense
              const dx = Math.abs(endX - startX);
              const dy = Math.abs(endY - startY);

              if (dy > dx) {
                // Go vertical first, then horizontal
                const midY = startY + (endY - startY) * 0.5;
                pathD = `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
                labelX = (startX + endX) / 2;
                labelY = midY - 5;
              } else {
                // Go horizontal first, then vertical
                const midX = startX + (endX - startX) * 0.5;
                pathD = `M ${startX} ${startY} L ${startX} ${startY + 10} L ${endX} ${startY + 10} L ${endX} ${endY}`;
                labelX = midX;
                labelY = startY + 10 - 5;
              }
            }

            return (
              <g key={i}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth="1.5"
                  opacity="0.7"
                  markerEnd={`url(#demo-flow-arrow-${edge.phase})`}
                />
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
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const colors = nodeColors[node.type];
            const isPrivacy = node.type === 'privacy';

            return (
              <g key={node.id}>
                <rect
                  x={node.x}
                  y={node.y}
                  width={nodeWidth}
                  height={nodeHeight}
                  rx="6"
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth="1"
                  strokeDasharray={isPrivacy ? '4 3' : undefined}
                />
                <text
                  x={node.x + nodeWidth / 2}
                  y={node.y + 20}
                  textAnchor="middle"
                  fill="var(--color-text-primary)"
                  fontSize="11"
                  fontFamily="var(--font-jetbrains), monospace"
                >
                  {node.label}
                </text>
                {node.sublabel && (
                  <text
                    x={node.x + nodeWidth / 2}
                    y={node.y + 35}
                    textAnchor="middle"
                    fill="var(--color-text-tertiary)"
                    fontSize="9"
                    fontFamily="var(--font-inter), sans-serif"
                  >
                    {node.sublabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function ArchitectureDiagram() {
  const boxW = 180;
  const boxH = 42;

  // Layout positions
  const knowledge = { x: 260, y: 20, label: 'Knowledge Layer' };
  const staticA = { x: 100, y: 110, label: 'Static Analyzer' };
  const wasmA = { x: 420, y: 110, label: 'WASM/PolkaVM' };
  const watchtower = { x: 100, y: 200, label: 'Watchtower' };
  const hunter = { x: 420, y: 200, label: 'Hunter' };
  const postmortem = { x: 260, y: 300, label: 'Post-Mortem Engine' };

  const allNodes = [knowledge, staticA, wasmA, watchtower, hunter, postmortem];

  // Edges: from -> to with labels
  const edges = [
    { from: knowledge, to: staticA, label: 'patterns' },
    { from: knowledge, to: wasmA, label: 'patterns' },
    { from: knowledge, to: watchtower, label: 'signatures' },
    { from: knowledge, to: hunter, label: 'probes' },
    { from: staticA, to: watchtower, label: '' },
    { from: wasmA, to: hunter, label: '' },
    { from: watchtower, to: postmortem, label: 'alerts' },
    { from: hunter, to: postmortem, label: 'findings' },
  ];

  // Feedback edge (postmortem -> knowledge)
  const feedbackPath = `M ${postmortem.x - 10} ${postmortem.y} C ${postmortem.x - 120} ${postmortem.y - 60}, ${knowledge.x - 120} ${knowledge.y + 60}, ${knowledge.x - 10} ${knowledge.y + boxH}`;

  function cx(node: typeof knowledge) {
    return node.x + boxW / 2;
  }
  function cy(node: typeof knowledge) {
    return node.y + boxH / 2;
  }

  return (
    <div className="overflow-x-auto">
      <svg viewBox="0 0 700 380" className="w-full max-w-2xl mx-auto" style={{ minWidth: '450px' }}>
        <defs>
          <marker
            id="arch-arrow"
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-text-tertiary)" />
          </marker>
          <marker
            id="arch-arrow-accent"
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-accent-primary)" />
          </marker>
        </defs>

        {/* Stage labels */}
        <text
          x="30"
          y="130"
          fill="var(--color-text-tertiary)"
          fontSize="9"
          fontFamily="var(--font-jetbrains), monospace"
          opacity="0.6"
        >
          Pre-deploy
        </text>
        <text
          x="30"
          y="220"
          fill="var(--color-text-tertiary)"
          fontSize="9"
          fontFamily="var(--font-jetbrains), monospace"
          opacity="0.6"
        >
          Runtime
        </text>
        <text
          x="30"
          y="320"
          fill="var(--color-text-tertiary)"
          fontSize="9"
          fontFamily="var(--font-jetbrains), monospace"
          opacity="0.6"
        >
          Post-incident
        </text>

        {/* Edges */}
        {edges.map((edge, i) => {
          const x1 = cx(edge.from);
          const y1 = cy(edge.from);
          const x2 = cx(edge.to);
          const y2 = cy(edge.to);
          const dx = x2 - x1;
          const dy = y2 - y1;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const sx = x1 + (dx / dist) * (boxW / 2 + 2);
          const sy = y1 + (dy / dist) * (boxH / 2 + 2);
          const ex = x2 - (dx / dist) * (boxW / 2 + 8);
          const ey = y2 - (dy / dist) * (boxH / 2 + 2);

          return (
            <g key={i}>
              <line
                x1={sx} y1={sy} x2={ex} y2={ey}
                stroke="var(--color-border-default)"
                strokeWidth="1"
                strokeDasharray="4 3"
                markerEnd="url(#arch-arrow)"
              />
              {edge.label && (
                <text
                  x={(sx + ex) / 2 + 6}
                  y={(sy + ey) / 2 - 4}
                  fill="var(--color-text-tertiary)"
                  fontSize="8"
                  fontFamily="var(--font-jetbrains), monospace"
                  opacity="0.7"
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Feedback loop: Post-Mortem -> Knowledge */}
        <path
          d={feedbackPath}
          fill="none"
          stroke="var(--color-accent-primary)"
          strokeWidth="1.5"
          strokeDasharray="6 4"
          markerEnd="url(#arch-arrow-accent)"
          opacity="0.6"
        />
        <text
          x={postmortem.x - 100}
          y={postmortem.y - 80}
          fill="var(--color-accent-primary)"
          fontSize="9"
          fontFamily="var(--font-jetbrains), monospace"
          opacity="0.7"
        >
          feedback
        </text>

        {/* Nodes */}
        {allNodes.map((node) => {
          const isKnowledge = node === knowledge;
          const isPostmortem = node === postmortem;
          return (
            <g key={node.label}>
              <rect
                x={node.x}
                y={node.y}
                width={boxW}
                height={boxH}
                rx="6"
                fill="var(--color-bg-surface)"
                stroke={
                  isKnowledge
                    ? 'var(--color-accent-primary)'
                    : isPostmortem
                    ? 'var(--color-accent-warm)'
                    : 'var(--color-border-default)'
                }
                strokeWidth="1"
              />
              <text
                x={cx(node)}
                y={cy(node) + 4}
                textAnchor="middle"
                fill={
                  isKnowledge
                    ? 'var(--color-accent-primary)'
                    : isPostmortem
                    ? 'var(--color-accent-warm)'
                    : 'var(--color-text-primary)'
                }
                fontSize="12"
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

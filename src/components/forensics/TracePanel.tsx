import { AlertTriangle } from 'lucide-react';

interface CallNode {
  type: string;
  from?: string;
  to: string;
  label: string;
  function?: string;
  flagged?: boolean;
  flagReason?: string;
  children?: CallNode[];
}

function CallTreeNode({ node, depth = 0 }: { node: CallNode; depth?: number }) {
  const borderColor = node.flagged
    ? 'var(--color-severity-critical)'
    : 'var(--color-border-default)';

  return (
    <div style={{ paddingLeft: depth > 0 ? '24px' : undefined }}>
      <div
        className="rounded px-4 py-3 mb-2"
        style={{
          backgroundColor: node.flagged
            ? 'rgba(255, 59, 92, 0.04)'
            : 'rgba(255, 255, 255, 0.02)',
          borderLeft: `3px solid ${borderColor}`,
          border: `1px solid ${node.flagged ? 'rgba(255, 59, 92, 0.15)' : 'var(--color-border-subtle)'}`,
          borderLeftWidth: '3px',
          borderLeftColor: borderColor,
        }}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {/* Type + addresses */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className="text-xs font-semibold px-1.5 py-0.5 rounded"
                style={{
                  color: 'var(--color-severity-info)',
                  backgroundColor: 'rgba(91, 141, 239, 0.12)',
                  fontFamily: 'var(--font-jetbrains), monospace',
                  letterSpacing: 'var(--tracking-wide)',
                }}
              >
                {node.type}
              </span>
              {node.from && (
                <span
                  className="text-xs"
                  style={{
                    color: 'var(--color-text-tertiary)',
                    fontFamily: 'var(--font-jetbrains), monospace',
                  }}
                >
                  {node.from}
                </span>
              )}
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                &rarr;
              </span>
              <span
                className="text-xs"
                style={{
                  color: 'var(--color-text-secondary)',
                  fontFamily: 'var(--font-jetbrains), monospace',
                }}
              >
                {node.to}
              </span>
              <span
                className="text-xs"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                ({node.label})
              </span>
            </div>

            {/* Function call */}
            {node.function && (
              <div className="mb-1">
                <code
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    color: 'var(--color-accent-primary)',
                    fontFamily: 'var(--font-jetbrains), monospace',
                  }}
                >
                  {node.function}
                </code>
              </div>
            )}

            {/* Flag reason */}
            {node.flagged && node.flagReason && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <AlertTriangle
                  size={12}
                  style={{ color: 'var(--color-severity-critical)', flexShrink: 0 }}
                />
                <span
                  className="text-xs"
                  style={{
                    color: 'var(--color-severity-critical)',
                  }}
                >
                  {node.flagReason}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {node.children?.map((child, i) => (
        <CallTreeNode key={i} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

const traceData: CallNode = {
  type: 'CALL',
  from: '0xC513...F8E7',
  to: '0x518A...8f26',
  label: 'Master Contract',
  children: [
    {
      type: 'CALL',
      to: '0x6C84...6D64',
      label: 'HandlerV1',
      function: 'handleConsensusMessage(proof, commitments)',
      flagged: true,
      flagReason: 'MMR proof bypass — leaf_index == leafCount',
    },
    {
      type: 'CALL',
      to: '0xFd41...B6dE',
      label: 'TokenGateway',
      function: 'handleChangeAssetAdmin(request)',
      flagged: true,
      flagReason: 'Shallow authorization — missing authenticate()',
    },
    {
      type: 'CALL',
      to: '0x8d01...90b8',
      label: 'Bridged DOT',
      function: 'mint(1,000,000,000)',
      flagged: true,
      flagReason: 'Unauthorized mint — 2,800x existing supply',
    },
  ],
};

export function TracePanel() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span
          className="text-xs uppercase"
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            color: 'var(--color-text-tertiary)',
            letterSpacing: 'var(--tracking-wide)',
          }}
        >
          Transaction
        </span>
        <span
          className="text-xs"
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            color: 'var(--color-text-secondary)',
          }}
        >
          0x240aeb9a...1109
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: 'rgba(255, 59, 92, 0.12)',
            color: 'var(--color-severity-critical)',
            fontFamily: 'var(--font-jetbrains), monospace',
          }}
        >
          3 FLAGS
        </span>
      </div>
      <CallTreeNode node={traceData} />
    </div>
  );
}

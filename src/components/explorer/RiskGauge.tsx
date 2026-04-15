'use client';

import { useState } from 'react';
import { getRiskColor, getRiskLabel, type RiskScore } from '@/lib/risk-scoring';

interface RiskGaugeProps {
  riskScore: RiskScore;
}

export function RiskGauge({ riskScore }: RiskGaugeProps) {
  const [expanded, setExpanded] = useState(false);
  const color = getRiskColor(riskScore.overall);
  const label = getRiskLabel(riskScore.overall);

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <span
          className="text-xs"
          style={{
            color: 'var(--color-text-tertiary)',
            fontFamily: 'var(--font-jetbrains), monospace',
          }}
        >
          Risk
        </span>
        <span
          className="text-sm font-semibold"
          style={{ color, fontFamily: 'var(--font-jetbrains), monospace' }}
        >
          {riskScore.overall}/100
        </span>
        <span className="text-xs" style={{ color }}>
          {label}
        </span>
      </div>

      {/* Bar gauge */}
      <div
        className="w-full h-2 rounded-full overflow-hidden mb-2"
        style={{ backgroundColor: 'var(--color-bg-surface)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${riskScore.overall}%`,
            backgroundColor: color,
          }}
        />
      </div>

      {/* Expandable factors */}
      {riskScore.factors.length > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs"
          style={{
            color: 'var(--color-text-tertiary)',
            fontFamily: 'var(--font-jetbrains), monospace',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {expanded ? '▾ Hide factors' : `▸ ${riskScore.factors.length} factors`}
        </button>
      )}

      {expanded && (
        <div className="mt-2 space-y-1.5">
          {riskScore.factors.map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span
                className="shrink-0 font-medium"
                style={{
                  color: getRiskColor(f.score * 4),
                  fontFamily: 'var(--font-jetbrains), monospace',
                  fontFeatureSettings: '"tnum"',
                }}
              >
                +{f.score}
              </span>
              <div>
                <span style={{ color: 'var(--color-text-secondary)' }}>{f.name}</span>
                <span style={{ color: 'var(--color-text-tertiary)' }}> — {f.description}</span>
              </div>
            </div>
          ))}
          <p
            className="text-xs mt-2 pt-2"
            style={{
              color: 'var(--color-text-tertiary)',
              borderTop: '1px solid var(--color-border-subtle)',
              fontStyle: 'italic',
            }}
          >
            Automated heuristic assessment based on on-chain behavioral patterns.
            Not a definitive determination of malicious activity.
          </p>
        </div>
      )}
    </div>
  );
}

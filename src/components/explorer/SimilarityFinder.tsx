'use client';

import { useMemo, useState } from 'react';
import type { Transfer } from '@/lib/subscan';
import { findSimilarAddresses, type SimilarityHeuristic } from '@/lib/address-similarity';
import { truncateAddress } from '@/lib/explorer-utils';
import { useAddressTag } from '@/hooks/useAddressTag';
import { TagPill } from '@/components/explorer/AddressTag';

interface Props {
  address: string;
  chain: string;
  transfers: Transfer[];
  onAddressClick: (address: string) => void;
}

const TYPE_COLORS: Record<string, string> = {
  same_funder: '#8b5cf6',
  same_destination: '#3b82f6',
  temporal_cluster: '#f59e0b',
  round_trip: '#ef4444',
  dust_link: '#6b7280',
};

const TYPE_ICONS: Record<string, string> = {
  same_funder: '\u21C4',   // ⇄
  same_destination: '\u21A0', // ↠
  temporal_cluster: '\u23F1', // ⏱
  round_trip: '\u21BA',    // ↺
  dust_link: '\u2022',     // •
};

export function SimilarityFinder({ address, chain, transfers, onAddressClick }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);

  const heuristics = useMemo(
    () => findSimilarAddresses(address, transfers),
    [address, transfers],
  );

  if (heuristics.length === 0) {
    return (
      <div
        className="rounded-lg p-6 text-center"
        style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)' }}
      >
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          No similarity patterns detected in available transfer history.
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
          More transfers may reveal additional patterns.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-sm font-semibold"
          style={{ fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--color-text-primary)' }}
        >
          Address Similarity Analysis
        </h3>
        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          {heuristics.length} pattern{heuristics.length !== 1 ? 's' : ''} found
        </span>
      </div>

      <div className="space-y-2">
        {heuristics.map((h, i) => (
          <HeuristicCard
            key={i}
            heuristic={h}
            chain={chain}
            expanded={expanded === i}
            onToggle={() => setExpanded(expanded === i ? null : i)}
            onAddressClick={onAddressClick}
          />
        ))}
      </div>

      <p className="text-xs mt-4" style={{ color: 'var(--color-text-tertiary)' }}>
        Heuristic analysis based on available transfer history. Patterns suggest possible associations,
        not definitive ownership links. Confidence scores reflect pattern strength, not certainty.
      </p>
    </div>
  );
}

function HeuristicCard({
  heuristic,
  chain,
  expanded,
  onToggle,
  onAddressClick,
}: {
  heuristic: SimilarityHeuristic;
  chain: string;
  expanded: boolean;
  onToggle: () => void;
  onAddressClick: (addr: string) => void;
}) {
  const color = TYPE_COLORS[heuristic.type] || 'var(--color-text-tertiary)';
  const icon = TYPE_ICONS[heuristic.type] || '?';

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: `1px solid ${expanded ? color + '40' : 'var(--color-border-default)'}`,
      }}
    >
      {/* Header - clickable */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 text-left"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <span
          className="text-sm shrink-0"
          style={{ color, width: 20, textAlign: 'center' }}
        >
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <span
            className="text-xs font-semibold block"
            style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-jetbrains), monospace' }}
          >
            {heuristic.label}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            {heuristic.evidence}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ConfidenceBadge score={heuristic.score} />
          <span
            className="text-xs"
            style={{ color: 'var(--color-text-tertiary)', transition: 'transform 0.15s' }}
          >
            {expanded ? '\u25B4' : '\u25BE'}
          </span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="px-4 pb-3 pt-0"
          style={{ borderTop: '1px solid var(--color-border-subtle)' }}
        >
          <p className="text-xs my-2" style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
            {heuristic.description}
          </p>

          {heuristic.addresses.length > 0 && (
            <div className="mt-2">
              <p className="text-xs mb-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
                Associated addresses:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {heuristic.addresses.map((a, j) => (
                  <AssociatedAddressChip key={j} address={a} chain={chain} color={color} onAddressClick={onAddressClick} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Individual associated address chip — uses hook for tag resolution */
function AssociatedAddressChip({ address, chain, color, onAddressClick }: {
  address: string;
  chain: string;
  color: string;
  onAddressClick: (addr: string) => void;
}) {
  const { tag: known } = useAddressTag(address, chain);

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <button
        onClick={(e) => { e.stopPropagation(); onAddressClick(address); }}
        className="text-xs px-2 py-1 rounded font-mono"
        style={{
          backgroundColor: color + '10',
          border: `1px solid ${color}30`,
          color: 'var(--color-accent-primary)',
          cursor: 'pointer',
          fontFamily: 'var(--font-jetbrains), monospace',
        }}
        title={address}
      >
        {truncateAddress(address, 8, 6)}
      </button>
      {known && <TagPill tag={known.tag} category={known.category} />}
    </span>
  );
}

function ConfidenceBadge({ score }: { score: number }) {
  let bgColor: string;
  let textColor: string;

  if (score >= 75) {
    bgColor = 'rgba(239,68,68,0.1)';
    textColor = '#ef4444';
  } else if (score >= 50) {
    bgColor = 'rgba(245,158,11,0.1)';
    textColor = '#f59e0b';
  } else {
    bgColor = 'rgba(107,114,128,0.1)';
    textColor = '#6b7280';
  }

  return (
    <span
      className="text-xs px-1.5 py-0.5 rounded font-mono"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        fontFeatureSettings: '"tnum"',
        fontSize: 10,
      }}
    >
      {score}%
    </span>
  );
}

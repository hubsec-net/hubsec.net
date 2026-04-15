'use client';

import { truncateAddress, formatNumber } from '@/lib/explorer-utils';
import { lookupAddress } from '@/lib/known-addresses';
import type { Transfer } from '@/lib/subscan';

interface TopCounterpartiesProps {
  transfers: Transfer[];
  targetAddress: string;
  onAddressClick: (address: string) => void;
}

interface CounterpartyData {
  address: string;
  volume: number;
  txCount: number;
  tag?: string;
}

export function TopCounterparties({ transfers, targetAddress, onAddressClick }: TopCounterpartiesProps) {
  // Aggregate by counterparty
  const map = new Map<string, { volume: number; txCount: number }>();
  for (const t of transfers) {
    const counterparty = t.from === targetAddress ? t.to : t.from;
    if (counterparty === targetAddress) continue;
    const existing = map.get(counterparty) || { volume: 0, txCount: 0 };
    existing.volume += parseFloat(t.amount || '0');
    existing.txCount++;
    map.set(counterparty, existing);
  }

  const sorted: CounterpartyData[] = Array.from(map.entries())
    .map(([address, data]) => ({
      address,
      volume: data.volume,
      txCount: data.txCount,
      tag: lookupAddress(address)?.tag,
    }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5);

  if (sorted.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
        No counterparties found.
      </p>
    );
  }

  const maxVolume = sorted[0].volume;

  return (
    <div className="space-y-3">
      {sorted.map((cp) => (
        <div key={cp.address} className="flex items-center gap-3">
          <button
            onClick={() => onAddressClick(cp.address)}
            className="shrink-0 w-36 text-left text-xs truncate"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              color: cp.tag ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            title={cp.address}
          >
            {cp.tag || truncateAddress(cp.address, 6, 6)}
          </button>
          <div className="flex-1 h-5 rounded overflow-hidden" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
            <div
              className="h-full rounded"
              style={{
                width: `${Math.max(4, (cp.volume / maxVolume) * 100)}%`,
                backgroundColor: 'var(--color-accent-primary)',
                opacity: 0.6,
              }}
            />
          </div>
          <span
            className="shrink-0 text-xs text-right w-24"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              fontFeatureSettings: '"tnum"',
              color: 'var(--color-text-secondary)',
            }}
          >
            {formatNumber(cp.volume.toFixed(2))}
          </span>
          <span
            className="shrink-0 text-xs text-right w-12"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              color: 'var(--color-text-tertiary)',
            }}
          >
            {cp.txCount} tx
          </span>
        </div>
      ))}
    </div>
  );
}

'use client';

import { truncateAddress, formatNumber } from '@/lib/explorer-utils';
import { lookupAddress, isDangerousAddress } from '@/lib/known-addresses';
import { useAddressTag } from '@/hooks/useAddressTag';
import { TagPill } from './AddressTag';
import type { Transfer } from '@/lib/subscan';

interface TopCounterpartiesProps {
  transfers: Transfer[];
  targetAddress: string;
  chain: string;
  onAddressClick: (address: string) => void;
}

interface CounterpartyData {
  address: string;
  volume: number;
  txCount: number;
}

export function TopCounterparties({ transfers, targetAddress, chain, onAddressClick }: TopCounterpartiesProps) {
  // Aggregate by counterparty (case-insensitive for Ethereum addresses)
  const target = targetAddress.toLowerCase();
  const map = new Map<string, { address: string; volume: number; txCount: number }>();
  for (const t of transfers) {
    const from = t.from.toLowerCase();
    const to = t.to.toLowerCase();
    const cpAddr = from === target ? t.to : t.from;
    const cpKey = cpAddr.toLowerCase();
    if (cpKey === target) continue;
    const existing = map.get(cpKey) || { address: cpAddr, volume: 0, txCount: 0 };
    existing.volume += parseFloat(t.amount || '0');
    existing.txCount++;
    map.set(cpKey, existing);
  }

  const sorted: CounterpartyData[] = Array.from(map.values())
    .sort((a, b) => {
      // Scam/attacker/flagged addresses always sort to top (sync lookup is fine for sorting)
      const aDanger = isDangerousAddress(lookupAddress(a.address));
      const bDanger = isDangerousAddress(lookupAddress(b.address));
      if (aDanger && !bDanger) return -1;
      if (!aDanger && bDanger) return 1;
      return b.volume - a.volume;
    })
    .slice(0, 5);

  if (sorted.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
        No counterparties found.
      </p>
    );
  }

  const maxVolume = Math.max(...sorted.map(s => s.volume), 1);

  return (
    <div className="space-y-3">
      {sorted.map((cp) => (
        <CounterpartyRow
          key={cp.address}
          address={cp.address}
          chain={chain}
          volume={cp.volume}
          txCount={cp.txCount}
          maxVolume={maxVolume}
          onAddressClick={onAddressClick}
        />
      ))}
    </div>
  );
}

/** Individual counterparty row — uses the hook for 3-layer tag resolution */
function CounterpartyRow({
  address, chain, volume, txCount, maxVolume, onAddressClick,
}: {
  address: string;
  chain: string;
  volume: number;
  txCount: number;
  maxVolume: number;
  onAddressClick: (address: string) => void;
}) {
  const { tag: known } = useAddressTag(address, chain);
  const danger = isDangerousAddress(known);

  return (
    <div
      className="flex items-center gap-3"
      style={danger ? { backgroundColor: 'rgba(220,38,38,0.06)', borderRadius: 6, padding: '4px 0' } : undefined}
    >
      <span className="shrink-0 text-xs flex items-center gap-1.5" style={{ minWidth: 140, maxWidth: 200 }}>
        {danger && <span style={{ color: '#dc2626', fontSize: 12, flexShrink: 0 }}>{'\u26A0'}</span>}
        <button
          onClick={() => onAddressClick(address)}
          className="truncate"
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            color: danger ? '#dc2626' : 'var(--color-text-secondary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            fontSize: 'inherit',
          }}
          title={address}
        >
          {truncateAddress(address, 6, 4)}
        </button>
        {known && <TagPill tag={known.tag} category={known.category} />}
      </span>
      <div className="flex-1 h-5 rounded overflow-hidden" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
        <div
          className="h-full rounded"
          style={{
            width: `${Math.max(4, (volume / maxVolume) * 100)}%`,
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
        {formatNumber(volume.toFixed(2))}
      </span>
      <span
        className="shrink-0 text-xs text-right w-12"
        style={{
          fontFamily: 'var(--font-jetbrains), monospace',
          color: 'var(--color-text-tertiary)',
        }}
      >
        {txCount} tx
      </span>
    </div>
  );
}

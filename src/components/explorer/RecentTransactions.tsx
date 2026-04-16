'use client';

import type { Transfer } from '@/lib/subscan';
import { getExplorerTxUrl } from '@/lib/explorer-urls';
import { truncateAddress, timeAgo, formatTimestamp } from '@/lib/explorer-utils';
import { lookupAddress, isDangerousAddress } from '@/lib/known-addresses';
import { AddressWithTag } from './AddressTag';
import { DirectionBadge } from './DirectionBadge';
import { CopyButton } from '@/components/ui/CopyButton';

interface RecentTransactionsProps {
  transfers: Transfer[];
  targetAddress: string;
  chain: string;
  onAddressClick: (address: string) => void;
  onExtrinsicClick?: (hashOrIndex: string) => void;
}

function getDirection(transfer: Transfer, targetAddress: string): 'in' | 'out' | 'self' {
  if (transfer.from === transfer.to) return 'self';
  if (transfer.from === targetAddress) return 'out';
  return 'in';
}

export function RecentTransactions({ transfers, targetAddress, chain, onAddressClick, onExtrinsicClick }: RecentTransactionsProps) {
  const recent = transfers.slice(0, 10);

  if (recent.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
        No transfers found for this address.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs" style={{ fontFamily: 'var(--font-jetbrains), monospace' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border-strong)' }}>
            <th className="text-left py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }}>Time</th>
            <th className="text-left py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }}>Dir</th>
            <th className="text-left py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }}>From</th>
            <th className="text-left py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }}>To</th>
            <th className="text-right py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }}>Amount</th>
            <th className="text-left py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }}>Hash</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((t, i) => {
            const dir = getDirection(t, targetAddress);
            const rowDanger = isDangerousAddress(lookupAddress(t.from)) || isDangerousAddress(lookupAddress(t.to));
            return (
              <tr
                key={`${t.hash}-${i}`}
                style={{
                  borderBottom: '1px solid var(--color-border-subtle)',
                  backgroundColor: rowDanger ? 'rgba(220,38,38,0.06)' : undefined,
                }}
              >
                <td className="py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }} title={formatTimestamp(t.block_timestamp)}>
                  {timeAgo(t.block_timestamp)}
                </td>
                <td className="py-2 px-2">
                  <DirectionBadge direction={dir} />
                </td>
                <td className="py-2 px-2">
                  <AddressWithTag address={t.from} chain={chain} onClick={onAddressClick} />
                </td>
                <td className="py-2 px-2">
                  <AddressWithTag address={t.to} chain={chain} onClick={onAddressClick} />
                </td>
                <td
                  className="py-2 px-2 text-right"
                  style={{
                    color: 'var(--color-text-primary)',
                    fontFeatureSettings: '"tnum"',
                  }}
                >
                  {parseFloat(t.amount || '0').toFixed(4).replace(/\.?0+$/, '')} {t.asset_symbol || ''}
                </td>
                <td className="py-2 px-2">
                  <span className="inline-flex items-center gap-1">
                    {onExtrinsicClick && t.hash ? (
                      <button
                        onClick={() => onExtrinsicClick(t.extrinsic_index || t.hash)}
                        style={{ color: 'var(--color-accent-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit' }}
                        title={`Decode ${t.hash}`}
                      >
                        {truncateAddress(t.hash, 6, 4)}
                      </button>
                    ) : (
                      <a
                        href={getExplorerTxUrl(t.hash, chain)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--color-accent-primary)' }}
                        title={t.hash}
                      >
                        {t.hash ? truncateAddress(t.hash, 6, 4) : '—'}
                      </a>
                    )}
                    {t.hash && <CopyButton text={t.hash} />}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

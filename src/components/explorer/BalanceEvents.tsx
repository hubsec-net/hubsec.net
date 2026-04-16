'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Transfer, RewardSlash } from '@/lib/subscan';
import { fetchRewardSlash } from '@/lib/subscan';
import { getChain, isEthereumChain } from '@/lib/chains';
import { formatTimestamp, timeAgo, formatNumber } from '@/lib/explorer-utils';
import { AddressWithTag } from '@/components/explorer/AddressTag';

export interface BalanceEvent {
  timestamp: number;
  type: 'transfer_in' | 'transfer_out' | 'fee' | 'reward' | 'slash' | 'reserve' | 'unreserve' | 'deposit' | 'tip';
  change: number; // positive = increase, negative = decrease
  symbol: string;
  source: string; // e.g. "balances.transfer", "staking.Rewarded"
  hash?: string;
  counterparty?: string;
  block_num?: number;
}

interface Props {
  transfers: Transfer[];
  targetAddress: string;
  chain: string;
  onAddressClick: (address: string) => void;
  onExtrinsicClick?: (hashOrIndex: string) => void;
}

export function BalanceEvents({ transfers, targetAddress, chain, onAddressClick, onExtrinsicClick }: Props) {
  const [rewardSlashes, setRewardSlashes] = useState<RewardSlash[]>([]);
  const [rsLoading, setRsLoading] = useState(false);
  const isEth = isEthereumChain(chain);
  const chainConfig = getChain(chain);
  const decimals = chainConfig.tokenDecimals;
  const symbol = chainConfig.tokenSymbol;

  // Fetch reward/slash data for substrate chains
  useEffect(() => {
    if (isEth) return;
    let cancelled = false;
    setRsLoading(true);

    async function loadAll() {
      const allRS: RewardSlash[] = [];
      let page = 0;
      const maxPages = 10; // Cap at 10 pages = 250 events
      while (page < maxPages) {
        try {
          const res = await fetchRewardSlash(targetAddress, chain, page);
          const items = res.list || [];
          allRS.push(...items);
          if (items.length < 25) break; // Last page
          page++;
        } catch {
          break;
        }
      }
      if (!cancelled) {
        setRewardSlashes(allRS);
        setRsLoading(false);
      }
    }
    loadAll();
    return () => { cancelled = true; };
  }, [targetAddress, chain, isEth]);

  // Build unified event list
  const events = useMemo(() => {
    const all: BalanceEvent[] = [];
    const addr = targetAddress.toLowerCase();

    // Transfer events
    for (const t of transfers) {
      const from = t.from.toLowerCase();
      const to = t.to.toLowerCase();
      const amount = parseFloat(t.amount || '0');
      const fee = parseFloat(t.fee || '0');
      const isSender = from === addr;
      const isReceiver = to === addr;
      const assetSymbol = t.asset_symbol || symbol;

      if (isReceiver && amount > 0) {
        all.push({
          timestamp: t.block_timestamp,
          type: 'transfer_in',
          change: amount,
          symbol: assetSymbol,
          source: 'balances.transfer',
          hash: t.hash,
          counterparty: t.from,
          block_num: t.block_num,
        });
      }
      if (isSender && amount > 0) {
        all.push({
          timestamp: t.block_timestamp,
          type: 'transfer_out',
          change: -amount,
          symbol: assetSymbol,
          source: 'balances.transfer',
          hash: t.hash,
          counterparty: t.to,
          block_num: t.block_num,
        });
      }
      // Transaction fee (only deducted from sender)
      if (isSender && fee > 0) {
        all.push({
          timestamp: t.block_timestamp,
          type: 'fee',
          change: -fee,
          symbol,
          source: 'transaction fee',
          hash: t.hash,
          block_num: t.block_num,
        });
      }
    }

    // Reward/slash events (substrate only)
    for (const rs of rewardSlashes) {
      const amount = parseFloat(rs.amount || '0') / Math.pow(10, decimals);
      const isReward = rs.event_id === 'Rewarded' || rs.event_id === 'Reward';
      all.push({
        timestamp: rs.block_timestamp,
        type: isReward ? 'reward' : 'slash',
        change: isReward ? amount : -amount,
        symbol,
        source: `${rs.module_id}.${rs.event_id}`,
        block_num: rs.block_num,
      });
    }

    // Sort by timestamp descending
    all.sort((a, b) => b.timestamp - a.timestamp);
    return all;
  }, [transfers, rewardSlashes, targetAddress, symbol, decimals]);

  // Filter state
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const typeOptions = ['all', 'transfer_in', 'transfer_out', 'fee', 'reward', 'slash'];

  const filtered = useMemo(() => {
    if (typeFilter === 'all') return events;
    return events.filter(e => e.type === typeFilter);
  }, [events, typeFilter]);

  // Compute running balance (from most recent backwards)
  const withBalance = useMemo(() => {
    // We don't know the initial balance, so show relative changes
    return filtered;
  }, [filtered]);

  const typeLabel: Record<string, string> = {
    transfer_in: 'Transfer IN',
    transfer_out: 'Transfer OUT',
    fee: 'Fee',
    reward: 'Staking Reward',
    slash: 'Slash',
    reserve: 'Reserve (Lock)',
    unreserve: 'Unreserve',
    deposit: 'Deposit',
    tip: 'Tip',
  };

  const typeColor: Record<string, string> = {
    transfer_in: 'var(--color-flow-in)',
    transfer_out: 'var(--color-flow-out)',
    fee: 'var(--color-text-tertiary)',
    reward: '#34d399',
    slash: '#f87171',
    reserve: '#f59e0b',
    unreserve: '#22d3ee',
    deposit: 'var(--color-flow-in)',
    tip: '#a78bfa',
  };

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {typeOptions.map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className="px-3 py-1 rounded text-xs"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              backgroundColor: typeFilter === t ? 'var(--color-accent-muted)' : 'transparent',
              color: typeFilter === t ? 'var(--color-accent-primary)' : 'var(--color-text-tertiary)',
              border: `1px solid ${typeFilter === t ? 'var(--color-accent-border)' : 'var(--color-border-default)'}`,
              cursor: 'pointer',
            }}
          >
            {t === 'all' ? 'All' : typeLabel[t] || t}
          </button>
        ))}
        {rsLoading && (
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            Loading staking events...
          </span>
        )}
      </div>

      {/* Summary */}
      <div className="flex gap-4 mb-4">
        {(() => {
          const rewards = events.filter(e => e.type === 'reward').reduce((s, e) => s + e.change, 0);
          const slashes = events.filter(e => e.type === 'slash').reduce((s, e) => s + Math.abs(e.change), 0);
          const fees = events.filter(e => e.type === 'fee').reduce((s, e) => s + Math.abs(e.change), 0);
          return (
            <>
              {rewards > 0 && (
                <span className="text-xs" style={{ color: '#34d399', fontFamily: 'var(--font-jetbrains), monospace' }}>
                  Rewards: +{rewards.toFixed(4)} {symbol}
                </span>
              )}
              {slashes > 0 && (
                <span className="text-xs" style={{ color: '#f87171', fontFamily: 'var(--font-jetbrains), monospace' }}>
                  Slashed: -{slashes.toFixed(4)} {symbol}
                </span>
              )}
              {fees > 0 && (
                <span className="text-xs" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-jetbrains), monospace' }}>
                  Fees: -{fees.toFixed(4)} {symbol}
                </span>
              )}
            </>
          );
        })()}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ fontFamily: 'var(--font-jetbrains), monospace' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border-strong)' }}>
              <th className="text-left py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }}>Time</th>
              <th className="text-left py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }}>Type</th>
              <th className="text-right py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }}>Change</th>
              <th className="text-left py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }}>Source</th>
              <th className="text-left py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }}>Counterparty</th>
            </tr>
          </thead>
          <tbody>
            {withBalance.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                  No balance events found.
                </td>
              </tr>
            ) : (
              withBalance.slice(0, 200).map((evt, i) => {
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <td className="py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }} title={formatTimestamp(evt.timestamp)}>
                      {timeAgo(evt.timestamp)}
                    </td>
                    <td className="py-2 px-2">
                      <span
                        className="px-1.5 py-0.5 rounded text-xs"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${typeColor[evt.type] || 'var(--color-text-tertiary)'} 15%, transparent)`,
                          color: typeColor[evt.type] || 'var(--color-text-tertiary)',
                        }}
                      >
                        {typeLabel[evt.type] || evt.type}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right" style={{ fontFeatureSettings: '"tnum"' }}>
                      <span style={{ color: evt.change >= 0 ? 'var(--color-flow-in)' : 'var(--color-flow-out)' }}>
                        {evt.change >= 0 ? '+' : ''}{evt.change.toFixed(4).replace(/\.?0+$/, '')} {evt.symbol}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      {onExtrinsicClick && evt.hash ? (
                        <button
                          onClick={() => onExtrinsicClick(evt.hash!)}
                          className="text-xs"
                          style={{ color: 'var(--color-accent-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                        >
                          {evt.source}
                        </button>
                      ) : (
                        <span style={{ color: 'var(--color-text-tertiary)' }}>{evt.source}</span>
                      )}
                    </td>
                    <td className="py-2 px-2">
                      {evt.counterparty ? (
                        <AddressWithTag address={evt.counterparty} chain={chain} onClick={onAddressClick} />
                      ) : (
                        <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {withBalance.length > 200 && (
        <p className="text-xs mt-3" style={{ color: 'var(--color-text-tertiary)' }}>
          Showing first 200 of {formatNumber(withBalance.length)} events
        </p>
      )}
    </div>
  );
}

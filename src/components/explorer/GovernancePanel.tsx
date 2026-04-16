'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  fetchAccountVotes,
  type ReferendumVote,
} from '@/lib/subscan';
import { getChain, isEthereumChain } from '@/lib/chains';
import { truncateAddress, timeAgo, formatTimestamp, formatNumber } from '@/lib/explorer-utils';
import { lookupAddress } from '@/lib/known-addresses';
import { useAddressTag } from '@/hooks/useAddressTag';
import { TagPill } from '@/components/explorer/AddressTag';

interface Props {
  address: string;
  chain: string;
  onAddressClick: (address: string) => void;
}

function convictionMultiplier(conviction: string): number {
  // API returns conviction as "0.1" (None), "1", "2", "3", "4", "5", "6"
  const n = parseFloat(conviction);
  if (isNaN(n) || n === 0) return 0.1;
  return n;
}

export function GovernancePanel({ address, chain, onAddressClick }: Props) {
  const [votes, setVotes] = useState<ReferendumVote[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [votePage, setVotePage] = useState(0);
  const isEth = isEthereumChain(chain);
  const chainConfig = getChain(chain);
  const decimals = chainConfig.tokenDecimals;
  const symbol = chainConfig.tokenSymbol;

  useEffect(() => {
    if (isEth) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setVotePage(0);

    async function load() {
      try {
        // Fetch first two pages to get a decent view of voting history
        const [page0, page1] = await Promise.all([
          fetchAccountVotes(address, chain, 0, 50),
          fetchAccountVotes(address, chain, 1, 50),
        ]);
        if (cancelled) return;
        const list0 = page0.list || [];
        const list1 = page1.list || [];
        setVotes([...list0, ...list1]);
        setTotalVotes(page0.count || 0);
      } catch {
        // Non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [address, chain, isEth]);

  // Derive delegation info from votes
  const delegationInfo = useMemo(() => {
    // This address delegates to (votes where delegate_account is set)
    const delegatedVotes = votes.filter(v => v.delegate_account !== null);
    const delegateMap = new Map<string, { address: string; voteCount: number; totalAmount: number; conviction: string }>();
    for (const v of delegatedVotes) {
      const delAddr = v.delegate_account!.address;
      const existing = delegateMap.get(delAddr) || { address: delAddr, voteCount: 0, totalAmount: 0, conviction: v.conviction };
      existing.voteCount++;
      existing.totalAmount += parseFloat(v.amount) / Math.pow(10, decimals);
      delegateMap.set(delAddr, existing);
    }

    // Direct votes (no delegate)
    const directVotes = votes.filter(v => v.delegate_account === null);

    return {
      delegates: Array.from(delegateMap.values()),
      delegatedVoteCount: delegatedVotes.length,
      directVotes,
      directVoteCount: directVotes.length,
    };
  }, [votes, decimals]);

  // Deduplicate votes by referendum_index — keep only the most recent (valid) per referendum
  const uniqueVotes = useMemo(() => {
    const map = new Map<number, ReferendumVote>();
    for (const v of votes) {
      const existing = map.get(v.referendum_index);
      // Prefer valid votes, then most recent
      if (!existing || (v.valid && !existing.valid) || (v.valid === existing.valid && v.voting_time > existing.voting_time)) {
        map.set(v.referendum_index, v);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.referendum_index - a.referendum_index);
  }, [votes]);

  // Pagination for display
  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(uniqueVotes.length / PAGE_SIZE);
  const displayVotes = uniqueVotes.slice(votePage * PAGE_SIZE, (votePage + 1) * PAGE_SIZE);

  // Forensic flags
  const flags = useMemo(() => {
    const f: string[] = [];

    // Max conviction on any single vote (6x)
    const maxConvVotes = uniqueVotes.filter(v => {
      const c = convictionMultiplier(v.conviction);
      return c >= 6;
    });
    if (maxConvVotes.length > 0) {
      f.push(`Voted with maximum conviction (6x) on ${maxConvVotes.length} referendum(s) — concentrated governance power`);
    }

    // High delegation ratio: most votes are delegated
    if (delegationInfo.delegates.length > 0 && delegationInfo.delegatedVoteCount > delegationInfo.directVoteCount * 3) {
      const delegate = delegationInfo.delegates[0];
      const tag = lookupAddress(delegate.address)?.tag;
      f.push(`Majority of votes (${delegationInfo.delegatedVoteCount}/${votes.length}) are delegated to ${tag || truncateAddress(delegate.address, 8, 6)} — delegated governance power`);
    }

    return f;
  }, [uniqueVotes, delegationInfo, votes.length]);

  if (isEth) {
    return (
      <div className="text-center py-12">
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          Governance activity is not applicable to Ethereum addresses.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-5 rounded animate-pulse" style={{ backgroundColor: 'var(--color-bg-tertiary)', width: `${90 - i * 10}%` }} />
        ))}
      </div>
    );
  }

  const fmtPlanck = (raw: string) => {
    const num = parseFloat(raw) / Math.pow(10, decimals);
    return `${formatNumber(num.toFixed(2).replace(/\.?0+$/, ''))} ${symbol}`;
  };

  const hasData = votes.length > 0;

  return (
    <div className="space-y-6">
      {!hasData && (
        <div className="text-center py-12">
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            No governance activity found for this account.
          </p>
        </div>
      )}

      {/* Forensic flags */}
      {flags.length > 0 && (
        <div className="space-y-2">
          {flags.map((f, i) => (
            <div
              key={i}
              className="px-3 py-2 rounded text-xs"
              style={{ backgroundColor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}
            >
              &#9888; {f}
            </div>
          ))}
        </div>
      )}

      {/* Summary stats */}
      {hasData && (
        <div
          className="rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4"
          style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)' }}
        >
          <div>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Total Votes</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-jetbrains), monospace', fontFeatureSettings: '"tnum"' }}>
              {totalVotes}
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Unique Referenda</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-jetbrains), monospace', fontFeatureSettings: '"tnum"' }}>
              {uniqueVotes.length}
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Direct Votes</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-jetbrains), monospace', fontFeatureSettings: '"tnum"' }}>
              {delegationInfo.directVoteCount}
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Delegated Votes</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-jetbrains), monospace', fontFeatureSettings: '"tnum"' }}>
              {delegationInfo.delegatedVoteCount}
            </p>
          </div>
        </div>
      )}

      {/* Delegation info */}
      {delegationInfo.delegates.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold mb-2" style={{ fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--color-text-primary)' }}>
            Delegates To
          </h4>
          <div className="space-y-1.5">
            {delegationInfo.delegates.map((d, i) => (
              <DelegateRow key={i} address={d.address} chain={chain} totalAmount={d.totalAmount} conviction={d.conviction} voteCount={d.voteCount} symbol={symbol} onAddressClick={onAddressClick} />
            ))}
          </div>
        </div>
      )}

      {/* Voting history */}
      {uniqueVotes.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold mb-2" style={{ fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--color-text-primary)' }}>
            Voting History ({totalVotes} total)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ fontFamily: 'var(--font-jetbrains), monospace' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-strong)' }}>
                  <th className="text-left py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }}>Ref #</th>
                  <th className="text-left py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }}>Vote</th>
                  <th className="text-left py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }}>Conviction</th>
                  <th className="text-right py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }}>Amount</th>
                  <th className="text-right py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }}>Weight</th>
                  <th className="text-left py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }}>Via</th>
                  <th className="text-left py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {displayVotes.map((v, i) => (
                  <VoteRow key={`${v.referendum_index}-${i}`} vote={v} chain={chain} decimals={decimals} symbol={symbol} onAddressClick={onAddressClick} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <button
                onClick={() => setVotePage(p => Math.max(0, p - 1))}
                disabled={votePage === 0}
                className="px-2 py-1 rounded text-xs"
                style={{
                  fontFamily: 'var(--font-jetbrains), monospace',
                  color: votePage === 0 ? 'var(--color-text-tertiary)' : 'var(--color-accent-primary)',
                  background: 'none',
                  border: `1px solid ${votePage === 0 ? 'var(--color-border-subtle)' : 'var(--color-accent-border)'}`,
                  cursor: votePage === 0 ? 'default' : 'pointer',
                  opacity: votePage === 0 ? 0.5 : 1,
                }}
              >
                &larr; Prev
              </button>
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)', fontFeatureSettings: '"tnum"' }}>
                {votePage + 1} / {totalPages}
              </span>
              <button
                onClick={() => setVotePage(p => Math.min(totalPages - 1, p + 1))}
                disabled={votePage >= totalPages - 1}
                className="px-2 py-1 rounded text-xs"
                style={{
                  fontFamily: 'var(--font-jetbrains), monospace',
                  color: votePage >= totalPages - 1 ? 'var(--color-text-tertiary)' : 'var(--color-accent-primary)',
                  background: 'none',
                  border: `1px solid ${votePage >= totalPages - 1 ? 'var(--color-border-subtle)' : 'var(--color-accent-border)'}`,
                  cursor: votePage >= totalPages - 1 ? 'default' : 'pointer',
                  opacity: votePage >= totalPages - 1 ? 0.5 : 1,
                }}
              >
                Next &rarr;
              </button>
            </div>
          )}

          {totalVotes > votes.length && (
            <p className="text-xs mt-2 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
              Showing {votes.length} of {totalVotes} total vote records. Older votes not loaded.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Delegate row — uses useAddressTag for 3-layer tag resolution */
function DelegateRow({ address, chain, totalAmount, conviction, voteCount, symbol, onAddressClick }: {
  address: string; chain: string; totalAmount: number; conviction: string; voteCount: number; symbol: string;
  onAddressClick: (address: string) => void;
}) {
  const { tag: known } = useAddressTag(address, chain);
  return (
    <div className="flex items-center gap-2 py-1.5 px-3 rounded text-xs" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)' }}>
      <span style={{ color: 'var(--color-text-tertiary)' }}>&rarr;</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <button
          onClick={() => onAddressClick(address)}
          className="font-mono"
          style={{ color: 'var(--color-accent-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit' }}
        >
          {truncateAddress(address, 10, 8)}
        </button>
        {known && <TagPill tag={known.tag} category={known.category} />}
      </span>
      <span style={{ color: 'var(--color-text-secondary)' }}>
        {formatNumber(totalAmount.toFixed(2))} {symbol} at {conviction}x conviction
      </span>
      <span className="ml-auto" style={{ color: 'var(--color-text-tertiary)', fontFeatureSettings: '"tnum"' }}>
        {voteCount} votes
      </span>
    </div>
  );
}

/** Vote table row — uses useAddressTag for delegate tag display */
function VoteRow({ vote: v, chain, decimals, symbol, onAddressClick }: {
  vote: ReferendumVote; chain: string; decimals: number; symbol: string;
  onAddressClick: (address: string) => void;
}) {
  const isDelegated = v.delegate_account !== null;
  const delegateAddr = isDelegated ? v.delegate_account!.address : '';
  const { tag: delegateKnown } = useAddressTag(delegateAddr, chain);

  const amount = parseFloat(v.amount) / Math.pow(10, decimals);
  const mult = convictionMultiplier(v.conviction);
  const weight = parseFloat(v.votes) / Math.pow(10, decimals);
  const isAye = v.status === 'Ayes';

  return (
    <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
      <td className="py-2 px-2" style={{ color: 'var(--color-accent-primary)' }}>
        #{v.referendum_index}
      </td>
      <td className="py-2 px-2">
        <span
          className="px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: isAye ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
            color: isAye ? '#34d399' : '#f87171',
          }}
        >
          {isAye ? 'Aye' : 'Nay'}
        </span>
        {!v.valid && (
          <span
            className="ml-1 px-1 py-0.5 rounded"
            style={{ backgroundColor: 'rgba(107,114,128,0.1)', color: '#6b7280', fontSize: 9 }}
          >
            superseded
          </span>
        )}
      </td>
      <td className="py-2 px-2" style={{ color: 'var(--color-text-secondary)' }}>
        {mult}x
      </td>
      <td className="py-2 px-2 text-right" style={{ color: 'var(--color-text-primary)', fontFeatureSettings: '"tnum"' }}>
        {formatNumber(amount.toFixed(2))} {symbol}
      </td>
      <td className="py-2 px-2 text-right" style={{ color: 'var(--color-text-primary)', fontFeatureSettings: '"tnum"' }}>
        {formatNumber(weight.toFixed(2))} {symbol}
      </td>
      <td className="py-2 px-2">
        {isDelegated ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={() => onAddressClick(delegateAddr)}
              className="font-mono"
              style={{ color: 'var(--color-accent-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit' }}
              title={`Delegated via ${delegateAddr}`}
            >
              {truncateAddress(delegateAddr, 6, 4)}
            </button>
            {delegateKnown && <TagPill tag={delegateKnown.tag} category={delegateKnown.category} />}
          </span>
        ) : (
          <span style={{ color: 'var(--color-text-tertiary)' }}>Direct</span>
        )}
      </td>
      <td className="py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }} title={v.voting_time ? formatTimestamp(v.voting_time) : ''}>
        {v.voting_time ? timeAgo(v.voting_time) : '\u2014'}
      </td>
    </tr>
  );
}

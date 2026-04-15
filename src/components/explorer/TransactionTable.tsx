'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Transfer } from '@/lib/subscan';
import { getSubscanTxUrl, getSubscanBlockUrl } from '@/lib/subscan';
import { truncateAddress, timeAgo, formatTimestamp } from '@/lib/explorer-utils';
import { lookupAddress } from '@/lib/known-addresses';
import { DirectionBadge } from './DirectionBadge';
import { CopyButton } from '@/components/ui/CopyButton';

interface TransactionTableProps {
  transfers: Transfer[];
  targetAddress: string;
  chain: string;
  totalCount: number;
  page: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onAddressClick: (address: string) => void;
}

type SortKey = 'time' | 'amount' | 'block';
type SortDir = 'asc' | 'desc';
type DirectionFilter = 'all' | 'in' | 'out';

function getDirection(t: Transfer, target: string): 'in' | 'out' | 'self' {
  if (t.from === t.to) return 'self';
  if (t.from === target) return 'out';
  return 'in';
}

export function TransactionTable({
  transfers,
  targetAddress,
  chain,
  totalCount,
  page,
  pageSize,
  loading,
  onPageChange,
  onAddressClick,
}: TransactionTableProps) {
  const [dirFilter, setDirFilter] = useState<DirectionFilter>('all');
  const [minAmount, setMinAmount] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('time');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [counterpartyFilter, setCounterpartyFilter] = useState('');

  const filtered = useMemo(() => {
    let result = [...transfers];

    if (dirFilter !== 'all') {
      result = result.filter(t => {
        const d = getDirection(t, targetAddress);
        return d === dirFilter;
      });
    }

    if (minAmount) {
      const min = parseFloat(minAmount);
      if (!isNaN(min)) {
        result = result.filter(t => parseFloat(t.amount || '0') >= min);
      }
    }

    if (counterpartyFilter) {
      const q = counterpartyFilter.toLowerCase();
      result = result.filter(t => {
        const cp = t.from === targetAddress ? t.to : t.from;
        const tag = lookupAddress(cp)?.tag?.toLowerCase();
        return cp.toLowerCase().includes(q) || (tag && tag.includes(q));
      });
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'time': cmp = a.block_timestamp - b.block_timestamp; break;
        case 'amount': cmp = parseFloat(a.amount || '0') - parseFloat(b.amount || '0'); break;
        case 'block': cmp = a.block_num - b.block_num; break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [transfers, dirFilter, minAmount, sortKey, sortDir, counterpartyFilter, targetAddress]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const exportCSV = useCallback(() => {
    const header = 'Time,Block,Direction,From,To,Amount,Token,Hash,Status\n';
    const rows = filtered.map(t => {
      const dir = getDirection(t, targetAddress);
      return [
        formatTimestamp(t.block_timestamp),
        t.block_num,
        dir.toUpperCase(),
        t.from,
        t.to,
        t.amount,
        t.asset_symbol || '',
        t.hash,
        t.success ? 'success' : 'failed',
      ].join(',');
    }).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${targetAddress.slice(0, 10)}_transfers.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered, targetAddress]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const sortIcon = (key: SortKey) =>
    sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1">
          {(['all', 'in', 'out'] as DirectionFilter[]).map(d => (
            <button
              key={d}
              onClick={() => setDirFilter(d)}
              className="px-3 py-1 rounded text-xs"
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                backgroundColor: dirFilter === d ? 'var(--color-accent-muted)' : 'transparent',
                color: dirFilter === d ? 'var(--color-accent-primary)' : 'var(--color-text-tertiary)',
                border: `1px solid ${dirFilter === d ? 'var(--color-accent-border)' : 'var(--color-border-default)'}`,
                cursor: 'pointer',
              }}
            >
              {d.toUpperCase()}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Min amount"
          value={minAmount}
          onChange={e => setMinAmount(e.target.value)}
          className="px-2 py-1 rounded text-xs w-24"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-default)',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-jetbrains), monospace',
            outline: 'none',
          }}
        />
        <input
          type="text"
          placeholder="Filter counterparty..."
          value={counterpartyFilter}
          onChange={e => setCounterpartyFilter(e.target.value)}
          className="px-2 py-1 rounded text-xs w-40"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-default)',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-jetbrains), monospace',
            outline: 'none',
          }}
        />
        <button
          onClick={exportCSV}
          className="ml-auto px-3 py-1 rounded text-xs"
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            color: 'var(--color-accent-primary)',
            border: '1px solid var(--color-accent-border)',
            backgroundColor: 'transparent',
            cursor: 'pointer',
          }}
        >
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ fontFamily: 'var(--font-jetbrains), monospace' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border-strong)' }}>
              <th
                className="text-left py-2 px-2 cursor-pointer select-none"
                style={{ color: 'var(--color-text-tertiary)' }}
                onClick={() => handleSort('time')}
              >
                Time{sortIcon('time')}
              </th>
              <th
                className="text-left py-2 px-2 cursor-pointer select-none"
                style={{ color: 'var(--color-text-tertiary)' }}
                onClick={() => handleSort('block')}
              >
                Block{sortIcon('block')}
              </th>
              <th className="text-left py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }}>Dir</th>
              <th className="text-left py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }}>From</th>
              <th className="text-left py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }}>To</th>
              <th
                className="text-right py-2 px-2 cursor-pointer select-none"
                style={{ color: 'var(--color-text-tertiary)' }}
                onClick={() => handleSort('amount')}
              >
                Amount{sortIcon('amount')}
              </th>
              <th className="text-left py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }}>Token</th>
              <th className="text-left py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }}>Hash</th>
              <th className="text-center py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="py-2 px-2">
                      <div className="h-4 w-16 rounded animate-pulse" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                  No transfers match filters.
                </td>
              </tr>
            ) : (
              filtered.map((t, i) => {
                const dir = getDirection(t, targetAddress);
                const fromTag = lookupAddress(t.from)?.tag;
                const toTag = lookupAddress(t.to)?.tag;
                return (
                  <tr
                    key={`${t.hash}-${i}`}
                    style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                  >
                    <td className="py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }} title={formatTimestamp(t.block_timestamp)}>
                      {timeAgo(t.block_timestamp)}
                    </td>
                    <td className="py-2 px-2">
                      <a
                        href={getSubscanBlockUrl(t.block_num, chain)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--color-accent-primary)', fontFeatureSettings: '"tnum"' }}
                      >
                        {t.block_num}
                      </a>
                    </td>
                    <td className="py-2 px-2"><DirectionBadge direction={dir} /></td>
                    <td className="py-2 px-2">
                      <button
                        onClick={() => onAddressClick(t.from)}
                        style={{
                          color: fromTag ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                          fontFamily: 'inherit', fontSize: 'inherit',
                        }}
                        title={t.from}
                      >
                        {fromTag || truncateAddress(t.from, 6, 4)}
                      </button>
                    </td>
                    <td className="py-2 px-2">
                      <button
                        onClick={() => onAddressClick(t.to)}
                        style={{
                          color: toTag ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                          fontFamily: 'inherit', fontSize: 'inherit',
                        }}
                        title={t.to}
                      >
                        {toTag || truncateAddress(t.to, 6, 4)}
                      </button>
                    </td>
                    <td className="py-2 px-2 text-right" style={{ color: 'var(--color-text-primary)', fontFeatureSettings: '"tnum"' }}>
                      {parseFloat(t.amount || '0').toFixed(4).replace(/\.?0+$/, '')}
                    </td>
                    <td className="py-2 px-2" style={{ color: 'var(--color-text-tertiary)' }}>{t.asset_symbol || ''}</td>
                    <td className="py-2 px-2">
                      <span className="inline-flex items-center gap-1">
                        <a
                          href={getSubscanTxUrl(t.hash, chain)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--color-accent-primary)' }}
                          title={t.hash}
                        >
                          {t.hash ? truncateAddress(t.hash, 6, 4) : '—'}
                        </a>
                        {t.hash && <CopyButton text={t.hash} />}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span style={{ color: t.success ? 'var(--color-flow-in)' : 'var(--color-flow-out)' }}>
                        {t.success ? '✓' : '✗'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-jetbrains), monospace' }}>
          {totalCount} total transfers
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            className="px-3 py-1 rounded text-xs"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              color: page === 0 ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)',
              border: '1px solid var(--color-border-default)',
              backgroundColor: 'transparent',
              cursor: page === 0 ? 'not-allowed' : 'pointer',
              opacity: page === 0 ? 0.5 : 1,
            }}
          >
            ← Prev
          </button>
          <span
            className="text-xs"
            style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-jetbrains), monospace', fontFeatureSettings: '"tnum"' }}
          >
            {page + 1} / {Math.max(1, totalPages)}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page + 1 >= totalPages}
            className="px-3 py-1 rounded text-xs"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              color: page + 1 >= totalPages ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)',
              border: '1px solid var(--color-border-default)',
              backgroundColor: 'transparent',
              cursor: page + 1 >= totalPages ? 'not-allowed' : 'pointer',
              opacity: page + 1 >= totalPages ? 0.5 : 1,
            }}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

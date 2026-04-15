'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { isValidAddress, toSS58, truncateAddress, formatNumber } from '@/lib/explorer-utils';
import { DEFAULT_CHAIN, getChain } from '@/lib/chains';
import {
  fetchAccountInfo,
  fetchTransfers,
  getSubscanAccountUrl,
  type Transfer,
  type AccountInfo,
} from '@/lib/subscan';
import { computeRiskScore, type RiskScore } from '@/lib/risk-scoring';
import { lookupAddress } from '@/lib/known-addresses';
import { CopyButton } from '@/components/ui/CopyButton';
import { ChainSelector } from '@/components/explorer/ChainSelector';
import { StatsGrid } from '@/components/explorer/StatsGrid';
import { RiskGauge } from '@/components/explorer/RiskGauge';
import { TopCounterparties } from '@/components/explorer/TopCounterparties';
import { RecentTransactions } from '@/components/explorer/RecentTransactions';
import { TransactionTable } from '@/components/explorer/TransactionTable';
import { NetworkGraph } from '@/components/explorer/NetworkGraph';

// ─── Search Page ───────────────────────────────────────────────

const EXAMPLE_ADDRESSES = [
  { address: '13UVJyLnbVp9RBZYFwFGyDvVd1y27AD8iv1CEstDo4bAZTMo', label: 'Polkadot Treasury' },
  { address: '15oF4uVJwmo4TdGW7VfQxNLavjCXviqWrztPu6CAkAJB4pXY', label: 'Web3 Foundation' },
  { address: '14Ns6kKbCoka3MS4Hn6b7oRw9fFejG8RH5rq5j63cWUfpPDJ', label: 'P2P.ORG Validator' },
];

function SearchView({ onSearch, chain, onChainChange }: {
  onSearch: (address: string) => void;
  chain: string;
  onChainChange: (c: string) => void;
}) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    if (!isValidAddress(trimmed)) {
      setError('Invalid address format. Enter a valid SS58 address or hex public key.');
      return;
    }

    const ss58 = toSS58(trimmed, getChain(chain).ss58Prefix);
    if (!ss58) {
      setError('Could not encode address.');
      return;
    }

    setError('');
    onSearch(ss58);
  };

  return (
    <section className="pt-20 md:pt-28 pb-16">
      <div className="mx-auto max-w-3xl px-4 md:px-6 text-center">
        <h1
          className="text-3xl md:text-4xl font-bold mb-4"
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            color: 'var(--color-text-primary)',
          }}
        >
          Forensic Explorer
        </h1>
        <p
          className="text-sm mb-8"
          style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}
        >
          On-chain intelligence for Polkadot and its parachains
        </p>

        <div className="flex justify-center mb-6">
          <ChainSelector selected={chain} onChange={onChainChange} />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            value={input}
            onChange={e => { setInput(e.target.value); setError(''); }}
            placeholder="Enter a Polkadot or parachain address..."
            className="flex-1 rounded-lg px-4 py-3 text-sm"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: `1px solid ${error ? 'var(--color-flow-out)' : 'var(--color-border-default)'}`,
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-jetbrains), monospace',
              outline: 'none',
            }}
            autoFocus
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-accent-primary)',
              color: 'var(--color-text-inverse)',
              fontFamily: 'var(--font-jetbrains), monospace',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            Investigate
          </button>
        </form>

        {error && (
          <p className="text-xs mb-4" style={{ color: 'var(--color-flow-out)' }}>{error}</p>
        )}

        <div className="mt-8">
          <p className="text-xs mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
            Example addresses:
          </p>
          <div className="flex flex-col gap-2">
            {EXAMPLE_ADDRESSES.map(ex => (
              <button
                key={ex.address}
                onClick={() => onSearch(ex.address)}
                className="text-xs text-left"
                style={{
                  fontFamily: 'var(--font-jetbrains), monospace',
                  color: 'var(--color-accent-primary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {ex.label} — {truncateAddress(ex.address)}
              </button>
            ))}
          </div>
        </div>

        <p
          className="mt-12 text-xs"
          style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-jetbrains), monospace' }}
        >
          Part of{' '}
          <Link href="/forensics" style={{ color: 'var(--color-accent-primary)' }}>
            HubSec Forensics
          </Link>
          . Advanced features coming soon.
        </p>
      </div>
    </section>
  );
}

// ─── Account Dashboard ─────────────────────────────────────────

type Tab = 'dashboard' | 'transactions' | 'graph';

function AccountView({
  address,
  chain,
  onChainChange,
  onAddressClick,
  onBack,
}: {
  address: string;
  chain: string;
  onChainChange: (c: string) => void;
  onAddressClick: (address: string) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [allTransfers, setAllTransfers] = useState<Transfer[]>([]);
  const [totalTransferCount, setTotalTransferCount] = useState(0);
  const [txPage, setTxPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setTransfers([]);
    setAllTransfers([]);
    setAccountInfo(null);
    setTab('dashboard');
    setTxPage(0);

    async function load() {
      try {
        const [acct, txRes] = await Promise.all([
          fetchAccountInfo(address, chain).catch(() => null),
          fetchTransfers(address, chain, 0, 100),
        ]);
        if (cancelled) return;
        setAccountInfo(acct);
        setTransfers(txRes.transfers || []);
        setAllTransfers(txRes.transfers || []);
        setTotalTransferCount(txRes.count || 0);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load account data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [address, chain]);

  // Load paginated transactions
  const loadTxPage = useCallback(async (page: number) => {
    setTxLoading(true);
    try {
      const res = await fetchTransfers(address, chain, page, 100);
      setTransfers(res.transfers || []);
      setTxPage(page);
    } catch {
      // Keep existing transfers on error
    } finally {
      setTxLoading(false);
    }
  }, [address, chain]);

  // Computed stats
  const stats = useMemo(() => {
    const trs = allTransfers;
    let totalSent = 0, totalReceived = 0, sentCount = 0, recvCount = 0;
    const counterparties = new Set<string>();
    let firstSeen: number | null = null;
    let lastSeen: number | null = null;

    for (const t of trs) {
      const amount = parseFloat(t.amount || '0');
      if (t.from === address) {
        totalSent += amount;
        sentCount++;
      }
      if (t.to === address) {
        totalReceived += amount;
        recvCount++;
      }
      const cp = t.from === address ? t.to : t.from;
      if (cp !== address) counterparties.add(cp);
      if (!firstSeen || t.block_timestamp < firstSeen) firstSeen = t.block_timestamp;
      if (!lastSeen || t.block_timestamp > lastSeen) lastSeen = t.block_timestamp;
    }

    return { totalSent, totalReceived, sentCount, recvCount, counterparties: counterparties.size, firstSeen, lastSeen };
  }, [allTransfers, address]);

  const riskScore: RiskScore = useMemo(() => {
    if (allTransfers.length === 0) return { overall: 0, factors: [] };
    return computeRiskScore(
      allTransfers,
      accountInfo?.balance || '0',
      stats.firstSeen,
    );
  }, [allTransfers, accountInfo, stats.firstSeen]);

  const chainConfig = getChain(chain);
  const known = lookupAddress(address);
  const displayName = accountInfo?.account_display?.display || known?.tag;
  const hasIdentity = !!accountInfo?.account_display?.identity || !!accountInfo?.account_display?.display;

  return (
    <section className="py-6">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* Back + Chain */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="text-xs"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              color: 'var(--color-accent-primary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            &larr; Back to Search
          </button>
          <ChainSelector selected={chain} onChange={onChainChange} />
        </div>

        {/* Error state */}
        {error && (
          <div
            className="rounded-lg p-6 mb-6 text-center"
            style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-flow-out)' }}
          >
            <p className="text-sm mb-3" style={{ color: 'var(--color-flow-out)' }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded text-xs"
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                color: 'var(--color-accent-primary)',
                border: '1px solid var(--color-accent-border)',
                backgroundColor: 'transparent',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Account Header */}
        <div
          className="rounded-lg p-6 mb-6"
          style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)' }}
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1 min-w-0">
              {displayName && (
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-accent-primary)' }}>
                  {displayName}
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-sm break-all"
                  style={{
                    fontFamily: 'var(--font-jetbrains), monospace',
                    color: 'var(--color-text-primary)',
                    fontFeatureSettings: '"tnum"',
                  }}
                >
                  {address}
                </span>
                <CopyButton text={address} />
                <a
                  href={getSubscanAccountUrl(address, chain)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    color: 'var(--color-accent-primary)',
                    border: '1px solid var(--color-accent-border)',
                    fontFamily: 'var(--font-jetbrains), monospace',
                  }}
                >
                  Subscan ↗
                </a>
              </div>
              {hasIdentity && accountInfo?.account_display?.judgements && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs" style={{ color: 'var(--color-flow-in)' }}>
                    ✓ Identity verified
                  </span>
                  {accountInfo.account_display.judgements.map((j, i) => (
                    <span key={i} className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {j.judgement}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="shrink-0 w-full md:w-64">
              <RiskGauge riskScore={riskScore} />
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 mb-6" style={{ borderBottom: '1px solid var(--color-border-default)' }}>
          {([
            { id: 'dashboard' as Tab, label: 'Overview' },
            { id: 'transactions' as Tab, label: 'Transactions' },
            { id: 'graph' as Tab, label: 'Graph' },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2.5 text-xs -mb-px"
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                color: tab === t.id ? 'var(--color-accent-primary)' : 'var(--color-text-tertiary)',
                borderBottom: tab === t.id ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
                background: 'none',
                border: 'none',
                borderBottomWidth: 2,
                borderBottomStyle: 'solid',
                borderBottomColor: tab === t.id ? 'var(--color-accent-primary)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Dashboard tab */}
        {tab === 'dashboard' && (
          <div className="space-y-8">
            <StatsGrid
              balance={accountInfo?.balance || '0'}
              tokenSymbol={chainConfig.tokenSymbol}
              totalSent={stats.totalSent}
              totalReceived={stats.totalReceived}
              txCount={totalTransferCount}
              sentCount={stats.sentCount}
              recvCount={stats.recvCount}
              firstSeen={stats.firstSeen}
              lastSeen={stats.lastSeen}
              counterpartyCount={stats.counterparties}
              stakingBonded={accountInfo?.staking_info?.bonded || null}
              stakingStatus={accountInfo?.staking_info ? 'Nominating' : null}
              loading={loading}
            />

            <div>
              <h3
                className="text-sm font-semibold mb-4"
                style={{ fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--color-text-primary)' }}
              >
                Top Counterparties
              </h3>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-5 rounded animate-pulse" style={{ backgroundColor: 'var(--color-bg-tertiary)', width: `${80 - i * 12}%` }} />
                  ))}
                </div>
              ) : (
                <TopCounterparties
                  transfers={allTransfers}
                  targetAddress={address}
                  onAddressClick={onAddressClick}
                />
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="text-sm font-semibold"
                  style={{ fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--color-text-primary)' }}
                >
                  Recent Transactions
                </h3>
                <button
                  onClick={() => setTab('transactions')}
                  className="text-xs"
                  style={{
                    fontFamily: 'var(--font-jetbrains), monospace',
                    color: 'var(--color-accent-primary)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  View all &rarr;
                </button>
              </div>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-8 rounded animate-pulse" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
                  ))}
                </div>
              ) : (
                <RecentTransactions
                  transfers={allTransfers}
                  targetAddress={address}
                  chain={chain}
                  onAddressClick={onAddressClick}
                />
              )}
            </div>
          </div>
        )}

        {/* Transactions tab */}
        {tab === 'transactions' && (
          <TransactionTable
            transfers={transfers}
            targetAddress={address}
            chain={chain}
            totalCount={totalTransferCount}
            page={txPage}
            pageSize={100}
            loading={txLoading}
            onPageChange={loadTxPage}
            onAddressClick={onAddressClick}
          />
        )}

        {/* Graph tab */}
        {tab === 'graph' && (
          <div>
            {loading ? (
              <div
                className="rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border-default)',
                  minHeight: 500,
                }}
              >
                <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Loading graph data...</p>
              </div>
            ) : allTransfers.length === 0 ? (
              <div
                className="rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border-default)',
                  minHeight: 500,
                }}
              >
                <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No transfer data available for graph visualization.</p>
              </div>
            ) : (
              <NetworkGraph
                transfers={allTransfers}
                targetAddress={address}
                chain={chain}
                onAddressClick={onAddressClick}
              />
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-jetbrains), monospace' }}>
            Part of{' '}
            <Link href="/forensics" style={{ color: 'var(--color-accent-primary)' }}>
              HubSec Forensics
            </Link>
            . Advanced features coming soon.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Main Router ───────────────────────────────────────────────

function ExplorerRouter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const address = searchParams.get('address') || '';
  const chain = searchParams.get('chain') || DEFAULT_CHAIN;

  const updateParams = useCallback((params: Record<string, string | null>) => {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(params)) {
      if (v === null) sp.delete(k);
      else sp.set(k, v);
    }
    router.push(`/explorer?${sp.toString()}`);
  }, [searchParams, router]);

  const handleSearch = useCallback((addr: string) => {
    updateParams({ address: addr, chain });
  }, [updateParams, chain]);

  const handleChainChange = useCallback((newChain: string) => {
    updateParams({ chain: newChain });
  }, [updateParams]);

  const handleBack = useCallback(() => {
    updateParams({ address: null });
  }, [updateParams]);

  const handleAddressClick = useCallback((addr: string) => {
    updateParams({ address: addr });
  }, [updateParams]);

  if (!address) {
    return (
      <SearchView
        onSearch={handleSearch}
        chain={chain}
        onChainChange={handleChainChange}
      />
    );
  }

  if (!isValidAddress(address)) {
    return (
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 md:px-6 text-center">
          <h1
            className="text-2xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--color-text-primary)' }}
          >
            Invalid Address
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            The address in the URL is not a valid SS58 address. Please enter a valid Polkadot address.
          </p>
          <button
            onClick={handleBack}
            className="px-6 py-3 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-accent-primary)',
              color: 'var(--color-text-inverse)',
              fontFamily: 'var(--font-jetbrains), monospace',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            Back to Search
          </button>
        </div>
      </section>
    );
  }

  return (
    <AccountView
      address={address}
      chain={chain}
      onChainChange={handleChainChange}
      onAddressClick={handleAddressClick}
      onBack={handleBack}
    />
  );
}

// Wrap in Suspense for useSearchParams
export function ExplorerClient() {
  return (
    <Suspense
      fallback={
        <section className="pt-20 md:pt-28 pb-16">
          <div className="mx-auto max-w-3xl px-4 md:px-6 text-center">
            <div className="h-10 w-64 mx-auto rounded animate-pulse mb-4" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
            <div className="h-4 w-48 mx-auto rounded animate-pulse" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
          </div>
        </section>
      }
    >
      <ExplorerRouter />
    </Suspense>
  );
}

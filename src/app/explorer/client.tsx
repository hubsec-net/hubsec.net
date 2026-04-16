'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  isValidAddress,
  isEthereumAddress,
  detectAddressType,
  toSS58,
  truncateAddress,
  formatNumber,
} from '@/lib/explorer-utils';
import { DEFAULT_CHAIN, getChain, isEthereumChain } from '@/lib/chains';
import {
  fetchAccountInfo,
  fetchTransfers,
  type Transfer,
  type AccountInfo,
} from '@/lib/subscan';
import { fetchEthAccountInfo, fetchEthTransfers, fetchContractInfo } from '@/lib/etherscan';
import { getExplorerAccountUrl, getExplorerName } from '@/lib/explorer-urls';
import { computeRiskScore, type RiskScore } from '@/lib/risk-scoring';
import { findBridgeInteractions, lookupAddress } from '@/lib/known-addresses';
import { useAddressTag, isDangerousAddress } from '@/hooks/useAddressTag';
import { CopyButton } from '@/components/ui/CopyButton';
import { TagPill } from '@/components/explorer/AddressTag';
import { ChainSelector } from '@/components/explorer/ChainSelector';
import { StatsGrid } from '@/components/explorer/StatsGrid';
import { RiskGauge } from '@/components/explorer/RiskGauge';
import { TopCounterparties } from '@/components/explorer/TopCounterparties';
import { RecentTransactions } from '@/components/explorer/RecentTransactions';
import { TransactionTable } from '@/components/explorer/TransactionTable';
import { NetworkGraph } from '@/components/explorer/NetworkGraph';
import { ExtrinsicDetailPanel } from '@/components/explorer/ExtrinsicDetail';
import { BalanceEvents } from '@/components/explorer/BalanceEvents';
import { ControlRelationships } from '@/components/explorer/ControlRelationships';
import { StakingDetail } from '@/components/explorer/StakingDetail';
import { GovernancePanel } from '@/components/explorer/GovernancePanel';
import { AccountNotes, NotesExportPanel } from '@/components/explorer/ForensicNotes';
import { generateInvestigationSummary, downloadSummary } from '@/lib/export-summary';
import { isWatched, addToWatchlist, removeFromWatchlist, getWatchlist } from '@/lib/watchlist';
import { cacheTransferIdentities } from '@/lib/known-addresses';
import { WatchlistPanel } from '@/components/explorer/WatchlistPanel';
import { ComparisonView } from '@/components/explorer/ComparisonView';
import { SimilarityFinder } from '@/components/explorer/SimilarityFinder';
import { ScamWarningBanner } from '@/components/explorer/ScamWarningBanner';

// ─── Search Page ───────────────────────────────────────────────

const EXAMPLE_ADDRESSES = [
  { address: '1REAJ1k691g5Eqqg9gL7vvZCBG7FCCZ8zgQkZWd4va5ESih', label: 'Polkadot.pro - Realgar', chain: 'assethub' },
  { address: '16SpacegeUTft9v3ts27CEC3tJaxgvE4uZeCctThFH3Vb24p', label: 'Staker Space (Validator)', chain: 'assethub' },
  { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', label: 'vitalik.eth', chain: 'ethereum' },
  { address: '0x28C6c06298d514Db089934071355E5743bf21d60', label: 'Binance Hot Wallet', chain: 'ethereum' },
];

function SearchView({
  onSearch,
  chain,
  onChainChange,
}: {
  onSearch: (address: string, chainOverride?: string) => void;
  chain: string;
  onChainChange: (c: string) => void;
}) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const isEth = isEthereumChain(chain);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    if (!isValidAddress(trimmed)) {
      setError(
        'Invalid address format. Enter a valid SS58 address, Ethereum address (0x...), or hex public key.',
      );
      return;
    }

    // Auto-detect chain from address format
    // Only switch chains when the current chain can't handle the address format.
    // EVM-compatible chains (Asset Hub, Moonbeam, Astar) accept both SS58 and 0x.
    const addrType = detectAddressType(trimmed);
    const currentConfig = getChain(chain);
    let resolvedChain = chain;
    if (addrType === 'ethereum' && !currentConfig.evmCompatible) {
      // 0x address on a chain that doesn't support EVM → switch to Ethereum
      resolvedChain = 'ethereum';
      onChainChange('ethereum');
    } else if (addrType === 'substrate' && isEthereumChain(chain)) {
      // SS58 address on Ethereum → switch to Asset Hub
      resolvedChain = 'assethub';
      onChainChange('assethub');
    }

    // Normalize address
    const normalized = isEthereumAddress(trimmed)
      ? trimmed.toLowerCase()
      : toSS58(trimmed, getChain(resolvedChain).ss58Prefix);

    if (!normalized) {
      setError('Could not encode address.');
      return;
    }

    setError('');
    onSearch(normalized, resolvedChain);
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
          On-chain intelligence for Polkadot, parachains, and Ethereum
        </p>

        <div className="flex justify-center mb-6">
          <ChainSelector selected={chain} onChange={onChainChange} />
        </div>

        {chain === 'polkadot' && (
          <div
            className="rounded-lg px-4 py-3 mb-6 mx-auto max-w-xl text-left flex gap-3 items-start text-xs"
            style={{
              backgroundColor: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.25)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-relaxed)',
            }}
          >
            <span style={{ color: '#f59e0b', fontSize: '14px', flexShrink: 0 }}>&#9888;</span>
            <span>
              Polkadot accounts have migrated to{' '}
              <button
                onClick={() => onChainChange('assethub')}
                style={{
                  color: 'var(--color-accent-primary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  textDecoration: 'underline',
                }}
              >
                Asset Hub
              </button>
              . For current balances and activity, select Asset Hub instead.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            value={input}
            onChange={e => {
              setInput(e.target.value);
              setError('');
            }}
            placeholder={
              isEth
                ? 'Enter an Ethereum address (0x...)...'
                : 'Enter a Polkadot, parachain, or Ethereum address...'
            }
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
          <p className="text-xs mb-4" style={{ color: 'var(--color-flow-out)' }}>
            {error}
          </p>
        )}

        <div className="mt-8">
          <p className="text-xs mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
            Example addresses:
          </p>
          <div className="flex flex-col gap-2">
            {EXAMPLE_ADDRESSES.map(ex => (
              <button
                key={ex.address}
                onClick={() => {
                  onChainChange(ex.chain);
                  onSearch(ex.address, ex.chain);
                }}
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
                <span
                  className="inline-block w-16 text-left"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  [{ex.chain === 'ethereum' ? 'ETH' : 'DOT'}]
                </span>
                {ex.label} — {truncateAddress(ex.address)}
              </button>
            ))}
          </div>
        </div>

        {/* Watchlist */}
        <WatchlistSection onSearch={onSearch} />

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

function WatchlistSection({ onSearch }: { onSearch: (address: string, chainOverride?: string) => void }) {
  const [show, setShow] = useState(false);
  const [watchlist, setWatchlist] = useState<import('@/lib/watchlist').WatchedAddress[]>([]);

  useEffect(() => {
    const list = getWatchlist();
    setWatchlist(list);
  }, []);

  if (watchlist.length === 0) return null;

  return (
    <div className="mt-8 text-left mx-auto max-w-xl">
      <button
        onClick={() => setShow(!show)}
        className="text-xs mb-3"
        style={{ color: 'var(--color-accent-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-jetbrains), monospace' }}
      >
        {show ? 'Hide Watchlist' : `Watchlist (${watchlist.length})`} {show ? '▴' : '▾'}
      </button>
      {show && (
        <div className="space-y-1.5">
          {watchlist.map(w => {
            const chainConfig = getChain(w.chain);
            return (
              <div
                key={w.address}
                className="flex items-center gap-2 py-1.5 px-3 rounded text-xs"
                style={{
                  backgroundColor: w.newActivity ? 'rgba(52,211,153,0.05)' : 'var(--color-bg-secondary)',
                  border: `1px solid ${w.newActivity ? 'rgba(52,211,153,0.25)' : 'var(--color-border-default)'}`,
                }}
              >
                {w.newActivity && <span style={{ color: '#34d399' }}>New!</span>}
                <button
                  onClick={() => onSearch(w.address, w.chain)}
                  className="font-mono"
                  style={{ color: 'var(--color-accent-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit' }}
                >
                  {w.label || truncateAddress(w.address, 10, 8)}
                </button>
                <span style={{ color: 'var(--color-text-tertiary)' }}>{chainConfig.name}</span>
                {w.lastBalance && (
                  <span className="ml-auto" style={{ color: 'var(--color-text-tertiary)', fontFeatureSettings: '"tnum"' }}>
                    {formatNumber(parseFloat(w.lastBalance).toFixed(2))} {chainConfig.tokenSymbol}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Cross-Chain Banner ───────────────────────────────────────

function CrossChainBanner({
  transfers,
  targetAddress,
  chain,
  onChainChange,
}: {
  transfers: Transfer[];
  targetAddress: string;
  chain: string;
  onChainChange: (c: string) => void;
}) {
  const counterparties = useMemo(() => {
    const set = new Set<string>();
    for (const t of transfers) {
      if (t.from !== targetAddress) set.add(t.from);
      if (t.to !== targetAddress) set.add(t.to);
    }
    return Array.from(set);
  }, [transfers, targetAddress]);

  const bridges = useMemo(() => findBridgeInteractions(counterparties), [counterparties]);

  if (bridges.length === 0) return null;

  const isEth = isEthereumChain(chain);
  const otherSide = isEth ? 'Polkadot' : 'Ethereum';
  const switchChain = isEth ? 'assethub' : 'ethereum';

  return (
    <div
      className="rounded-lg px-4 py-3 mb-6 flex gap-3 items-start text-xs"
      style={{
        backgroundColor: 'rgba(139,92,246,0.08)',
        border: '1px solid rgba(139,92,246,0.25)',
        color: 'var(--color-text-secondary)',
        lineHeight: 'var(--leading-relaxed)',
      }}
    >
      <span style={{ color: '#8b5cf6', fontSize: '14px', flexShrink: 0 }}>&#8644;</span>
      <span>
        <strong style={{ color: 'var(--color-text-primary)' }}>Cross-Chain Activity Detected:</strong>{' '}
        This address interacted with{' '}
        {bridges.map((b, i) => (
          <span key={b.address}>
            {i > 0 && ', '}
            <strong>{b.tag}</strong>
          </span>
        ))}
        {isEth
          ? ' (Polkadot bridge). '
          : ' (Ethereum bridge). '}
        <button
          onClick={() => onChainChange(switchChain)}
          style={{
            color: 'var(--color-accent-primary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            fontFamily: 'inherit',
            fontSize: 'inherit',
            textDecoration: 'underline',
          }}
        >
          Explore {otherSide} side &rarr;
        </button>
      </span>
    </div>
  );
}

// ─── Account Dashboard ─────────────────────────────────────────

type Tab = 'dashboard' | 'transactions' | 'governance' | 'graph';

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
  const [contractStatus, setContractStatus] = useState<string | null>(null);
  const [statsComplete, setStatsComplete] = useState(false);
  const [selectedExtrinsic, setSelectedExtrinsic] = useState<string | null>(null);
  const [txSubTab, setTxSubTab] = useState<'transfers' | 'balance_events'>('transfers');
  const [watched, setWatched] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const isEth = isEthereumChain(chain);

  // Load initial data, then fetch full transfer history in background for accurate stats
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setTransfers([]);
    setAllTransfers([]);
    setAccountInfo(null);
    setContractStatus(null);
    setStatsComplete(false);
    setTab('dashboard');
    setTxPage(0);

    async function load() {
      let initialTransfers: Transfer[] = [];
      let apiTotalCount = 0;

      try {
        if (isEth) {
          // Ethereum: fetch from Etherscan
          const [acct, txRes] = await Promise.all([
            fetchEthAccountInfo(address).catch(() => null),
            fetchEthTransfers(address, 0, 100),
          ]);
          if (cancelled) return;
          setAccountInfo(acct);
          initialTransfers = txRes.transfers || [];
          apiTotalCount = txRes.count || 0;
          setTransfers(initialTransfers);
          setAllTransfers(initialTransfers);
          setTotalTransferCount(apiTotalCount);
          cacheTransferIdentities(initialTransfers);

          // Check contract status in background
          fetchContractInfo(address).then(info => {
            if (cancelled) return;
            if (info?.isVerified) setContractStatus(`Verified: ${info.contractName}`);
            else if (info?.isContract) setContractStatus('Unverified Contract');
            else setContractStatus('EOA');
          });
        } else {
          // Substrate: fetch from Subscan
          const [acct, txRes] = await Promise.all([
            fetchAccountInfo(address, chain).catch(() => null),
            fetchTransfers(address, chain, 0, 100),
          ]);
          if (cancelled) return;
          setAccountInfo(acct);
          initialTransfers = txRes.transfers || [];
          apiTotalCount = txRes.count || 0;
          setTransfers(initialTransfers);
          setAllTransfers(initialTransfers);
          setTotalTransferCount(apiTotalCount);
          cacheTransferIdentities(initialTransfers);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load account data.');
        setStatsComplete(true);
        return;
      } finally {
        if (!cancelled) setLoading(false);
      }

      // Determine if we need more transfers for accurate stats
      // Etherscan: count is current page length, so check if we hit the limit
      // Subscan: count is total from API
      const needsMore = isEth
        ? initialTransfers.length >= 100
        : apiTotalCount > 100;

      if (!needsMore) {
        if (!cancelled) setStatsComplete(true);
        return;
      }

      // Background: fetch full transfer history for accurate totals
      try {
        if (isEth) {
          // Etherscan supports up to 10000 results per page
          const fullRes = await fetchEthTransfers(address, 0, 10000);
          if (!cancelled) {
            const full = fullRes.transfers || [];
            setAllTransfers(full);
            setTotalTransferCount(full.length);
            cacheTransferIdentities(full);
          }
        } else {
          // Subscan: paginate remaining pages (page 0 already loaded)
          const totalPages = Math.min(Math.ceil(apiTotalCount / 100), 50);
          const allResults = [...initialTransfers];
          for (let p = 1; p < totalPages; p++) {
            if (cancelled) return;
            const pageRes = await fetchTransfers(address, chain, p, 100);
            const newTransfers = pageRes.transfers || [];
            allResults.push(...newTransfers);
            cacheTransferIdentities(newTransfers);
          }
          if (!cancelled) setAllTransfers(allResults);
        }
      } catch {
        // Keep whatever transfers we already have
      } finally {
        if (!cancelled) setStatsComplete(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [address, chain, isEth]);

  // Load paginated transactions
  const loadTxPage = useCallback(
    async (page: number) => {
      setTxLoading(true);
      try {
        const res = isEth
          ? await fetchEthTransfers(address, page, 100)
          : await fetchTransfers(address, chain, page, 100);
        setTransfers(res.transfers || []);
        setTxPage(page);
      } catch {
        // Keep existing transfers on error
      } finally {
        setTxLoading(false);
      }
    },
    [address, chain, isEth],
  );

  const chainConfig = getChain(chain);

  // Computed stats — only sum native token amounts; count all transfers for tx totals
  const nativeSymbol = chainConfig.tokenSymbol;
  const stats = useMemo(() => {
    const trs = allTransfers;
    let totalSent = 0,
      totalReceived = 0,
      sentCount = 0,
      recvCount = 0;
    const counterparties = new Set<string>();
    let firstSeen: number | null = null;
    let lastSeen: number | null = null;

    const addr = address.toLowerCase();

    for (const t of trs) {
      const from = t.from.toLowerCase();
      const to = t.to.toLowerCase();
      const isSender = from === addr;
      const isReceiver = to === addr;
      if (isSender) sentCount++;
      if (isReceiver) recvCount++;

      // Only sum amounts for the chain's native token
      const isNative = !t.asset_symbol || t.asset_symbol === nativeSymbol;
      if (isNative) {
        const amount = parseFloat(t.amount || '0');
        if (isSender) totalSent += amount;
        if (isReceiver) totalReceived += amount;
      }

      const cp = isSender ? to : from;
      if (cp !== addr) counterparties.add(cp);
      if (!firstSeen || t.block_timestamp < firstSeen) firstSeen = t.block_timestamp;
      if (!lastSeen || t.block_timestamp > lastSeen) lastSeen = t.block_timestamp;
    }

    return {
      totalSent,
      totalReceived,
      sentCount,
      recvCount,
      counterparties: counterparties.size,
      firstSeen,
      lastSeen,
    };
  }, [allTransfers, address, nativeSymbol]);

  const riskScore: RiskScore = useMemo(() => {
    if (allTransfers.length === 0) return { overall: 0, factors: [] };
    // Only score based on native token transfers to avoid mixing token types
    const nativeTransfers = allTransfers.filter(
      t => !t.asset_symbol || t.asset_symbol === nativeSymbol,
    );
    if (nativeTransfers.length === 0) return { overall: 0, factors: [] };
    return computeRiskScore(nativeTransfers, accountInfo?.balance || '0', stats.firstSeen);
  }, [allTransfers, accountInfo, stats.firstSeen, nativeSymbol]);

  // Watch status
  useEffect(() => { setWatched(isWatched(address)); }, [address]);

  const toggleWatch = useCallback(() => {
    if (watched) {
      removeFromWatchlist(address);
      setWatched(false);
    } else {
      const known = lookupAddress(address);
      addToWatchlist(address, chain, known?.tag);
      setWatched(true);
    }
  }, [address, chain, watched]);

  const handleExtrinsicClick = useCallback((hashOrIndex: string) => {
    if (!isEth) setSelectedExtrinsic(hashOrIndex);
  }, [isEth]);

  const { tag: known } = useAddressTag(address, chain);
  const people = accountInfo?.account_display?.people;
  const displayName = accountInfo?.display || people?.display || known?.tag;
  const hasIdentity = !!people?.identity;
  const explorerName = getExplorerName(chain);

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

        {/* Polkadot relay chain migration disclaimer */}
        {chain === 'polkadot' && (
          <div
            className="rounded-lg px-4 py-3 mb-6 flex gap-3 items-start text-xs"
            style={{
              backgroundColor: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.25)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-relaxed)',
            }}
          >
            <span style={{ color: '#f59e0b', fontSize: '14px', flexShrink: 0 }}>&#9888;</span>
            <span>
              <strong style={{ color: 'var(--color-text-primary)' }}>
                Polkadot Relay Chain Migration:
              </strong>{' '}
              Balances and accounts have migrated to{' '}
              <button
                onClick={() => onChainChange('assethub')}
                style={{
                  color: 'var(--color-accent-primary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  textDecoration: 'underline',
                }}
              >
                Asset Hub
              </button>
              . Data shown here reflects historical relay chain activity and may not represent
              current balances or account state. Risk scores may be inaccurate.
            </span>
          </div>
        )}

        {/* Cross-chain bridge indicator */}
        {!loading && allTransfers.length > 0 && (
          <CrossChainBanner
            transfers={allTransfers}
            targetAddress={address}
            chain={chain}
            onChainChange={onChainChange}
          />
        )}

        {/* Error state */}
        {error && (
          <div
            className="rounded-lg p-6 mb-6 text-center"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-flow-out)',
            }}
          >
            <p className="text-sm mb-3" style={{ color: 'var(--color-flow-out)' }}>
              {error}
            </p>
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
          style={{
            backgroundColor: isDangerousAddress(known) ? 'rgba(220,38,38,0.03)' : 'var(--color-bg-secondary)',
            border: isDangerousAddress(known) ? '2px solid rgba(220,38,38,0.4)' : '1px solid var(--color-border-default)',
          }}
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1 min-w-0">
              {displayName && (
                <p
                  className="text-sm font-medium mb-1"
                  style={{ color: 'var(--color-accent-primary)' }}
                >
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
                {known && <TagPill tag={known.tag} category={known.category} />}
                <CopyButton text={address} />
                <a
                  href={getExplorerAccountUrl(address, chain)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    color: 'var(--color-accent-primary)',
                    border: '1px solid var(--color-accent-border)',
                    fontFamily: 'var(--font-jetbrains), monospace',
                  }}
                >
                  {explorerName} &#8599;
                </a>
                <button
                  onClick={() => {
                    const md = generateInvestigationSummary({
                      address, chain, accountInfo, transfers: allTransfers,
                      riskScore, stats, contractStatus: isEth ? contractStatus : null,
                    });
                    downloadSummary(md, address);
                  }}
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    color: 'var(--color-accent-primary)',
                    border: '1px solid var(--color-accent-border)',
                    fontFamily: 'var(--font-jetbrains), monospace',
                    background: 'none',
                    cursor: 'pointer',
                  }}
                  title="Download investigation summary as Markdown"
                >
                  Export Report
                </button>
                <button
                  onClick={toggleWatch}
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    color: watched ? '#f59e0b' : 'var(--color-text-tertiary)',
                    border: `1px solid ${watched ? 'rgba(245,158,11,0.3)' : 'var(--color-border-default)'}`,
                    backgroundColor: watched ? 'rgba(245,158,11,0.08)' : 'transparent',
                    fontFamily: 'var(--font-jetbrains), monospace',
                    cursor: 'pointer',
                  }}
                  title={watched ? 'Remove from watchlist' : 'Add to watchlist'}
                >
                  {watched ? 'Watching' : 'Watch'}
                </button>
                <button
                  onClick={() => setShowComparison(!showComparison)}
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    color: showComparison ? '#8b5cf6' : 'var(--color-text-tertiary)',
                    border: `1px solid ${showComparison ? 'rgba(139,92,246,0.3)' : 'var(--color-border-default)'}`,
                    backgroundColor: showComparison ? 'rgba(139,92,246,0.08)' : 'transparent',
                    fontFamily: 'var(--font-jetbrains), monospace',
                    cursor: 'pointer',
                  }}
                  title="Compare with another address"
                >
                  {showComparison ? 'Comparing' : 'Compare'}
                </button>
              </div>
              {/* Substrate identity */}
              {!isEth && hasIdentity && people?.judgements && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs" style={{ color: 'var(--color-flow-in)' }}>
                    &#10003; Identity verified
                  </span>
                  {people.judgements.map((j, i) => (
                    <span
                      key={i}
                      className="text-xs"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      {j.judgement}
                    </span>
                  ))}
                </div>
              )}
              {/* Ethereum contract status */}
              {isEth && contractStatus && (
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="text-xs"
                    style={{
                      color:
                        contractStatus === 'EOA'
                          ? 'var(--color-text-tertiary)'
                          : contractStatus.startsWith('Verified')
                            ? 'var(--color-flow-in)'
                            : 'var(--color-text-secondary)',
                    }}
                  >
                    {contractStatus === 'EOA'
                      ? 'Externally Owned Account'
                      : contractStatus.startsWith('Verified')
                        ? `&#10003; ${contractStatus}`
                        : contractStatus}
                  </span>
                </div>
              )}
              {/* Investigator notes */}
              <AccountNotes address={address} />
            </div>
            <div className="shrink-0 w-full md:w-64">
              <RiskGauge riskScore={riskScore} />
            </div>
          </div>
        </div>

        {/* Scam/attacker warning banner */}
        {known && isDangerousAddress(known) && (
          <ScamWarningBanner knownAddress={known} />
        )}

        {/* Tab navigation */}
        <div
          className="flex gap-1 mb-6"
          style={{ borderBottom: '1px solid var(--color-border-default)' }}
        >
          {([
            { id: 'dashboard' as Tab, label: 'Overview' },
            { id: 'transactions' as Tab, label: 'Transactions' },
            ...(!isEth ? [{ id: 'governance' as Tab, label: 'Governance' }] : []),
            { id: 'graph' as Tab, label: 'Graph' },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2.5 text-xs -mb-px"
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                color:
                  tab === t.id ? 'var(--color-accent-primary)' : 'var(--color-text-tertiary)',
                background: 'none',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                borderBottomWidth: 2,
                borderBottomStyle: 'solid',
                borderBottomColor:
                  tab === t.id ? 'var(--color-accent-primary)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Comparison Mode */}
        {showComparison && (
          <div
            className="rounded-lg p-6 mb-6"
            style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid rgba(139,92,246,0.25)' }}
          >
            <ComparisonView
              addressA={address}
              chainA={chain}
              onAddressClick={(addr) => { setShowComparison(false); onAddressClick(addr); }}
              onClose={() => setShowComparison(false)}
            />
          </div>
        )}

        {/* Dashboard tab */}
        {tab === 'dashboard' && (
          <div className="space-y-8">
            <StatsGrid
              balance={accountInfo?.balance || '0'}
              tokenSymbol={chainConfig.tokenSymbol}
              chainName={chainConfig.name}
              totalSent={stats.totalSent}
              totalReceived={stats.totalReceived}
              txCount={totalTransferCount}
              sentCount={stats.sentCount}
              recvCount={stats.recvCount}
              firstSeen={stats.firstSeen}
              lastSeen={stats.lastSeen}
              counterpartyCount={stats.counterparties}
              stakingBonded={!isEth ? accountInfo?.bonded || null : null}
              stakingStatus={!isEth ? accountInfo?.role || null : null}
              contractStatus={isEth ? contractStatus : null}
              loading={loading}
              loadedCount={allTransfers.length}
              statsComplete={statsComplete}
            />

            {/* Staking Detail (Substrate only) */}
            {!isEth && !loading && (
              <StakingDetail
                address={address}
                chain={chain}
                accountInfo={accountInfo}
                onAddressClick={onAddressClick}
              />
            )}

            {/* Control Relationships (Substrate only) */}
            {!isEth && !loading && (
              <ControlRelationships
                address={address}
                chain={chain}
                onAddressClick={onAddressClick}
              />
            )}

            {/* Address Similarity Analysis */}
            {!loading && allTransfers.length > 0 && (
              <SimilarityFinder
                address={address}
                chain={chain}
                transfers={allTransfers}
                onAddressClick={onAddressClick}
              />
            )}

            <div>
              <h3
                className="text-sm font-semibold mb-4"
                style={{
                  fontFamily: 'var(--font-jetbrains), monospace',
                  color: 'var(--color-text-primary)',
                }}
              >
                Top Counterparties
              </h3>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-5 rounded animate-pulse"
                      style={{
                        backgroundColor: 'var(--color-bg-tertiary)',
                        width: `${80 - i * 12}%`,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <TopCounterparties
                  transfers={allTransfers}
                  targetAddress={address}
                  chain={chain}
                  onAddressClick={onAddressClick}
                />
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="text-sm font-semibold"
                  style={{
                    fontFamily: 'var(--font-jetbrains), monospace',
                    color: 'var(--color-text-primary)',
                  }}
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
                    <div
                      key={i}
                      className="h-8 rounded animate-pulse"
                      style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                    />
                  ))}
                </div>
              ) : (
                <RecentTransactions
                  transfers={allTransfers}
                  targetAddress={address}
                  chain={chain}
                  onAddressClick={onAddressClick}
                  onExtrinsicClick={!isEth ? handleExtrinsicClick : undefined}
                />
              )}
            </div>
          </div>
        )}

        {/* Transactions tab */}
        {tab === 'transactions' && (
          <div>
            {/* Sub-tab toggle: Transfers vs Balance Events */}
            <div className="flex gap-1 mb-4">
              {(['transfers', 'balance_events'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setTxSubTab(st)}
                  className="px-3 py-1.5 rounded text-xs"
                  style={{
                    fontFamily: 'var(--font-jetbrains), monospace',
                    backgroundColor: txSubTab === st ? 'var(--color-accent-muted)' : 'transparent',
                    color: txSubTab === st ? 'var(--color-accent-primary)' : 'var(--color-text-tertiary)',
                    border: `1px solid ${txSubTab === st ? 'var(--color-accent-border)' : 'var(--color-border-default)'}`,
                    cursor: 'pointer',
                  }}
                >
                  {st === 'transfers' ? 'Transfers' : 'Balance Events'}
                </button>
              ))}
            </div>
            {txSubTab === 'transfers' ? (
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
                onExtrinsicClick={!isEth ? handleExtrinsicClick : undefined}
              />
            ) : (
              <BalanceEvents
                transfers={allTransfers}
                targetAddress={address}
                chain={chain}
                onAddressClick={onAddressClick}
                onExtrinsicClick={!isEth ? handleExtrinsicClick : undefined}
              />
            )}
          </div>
        )}

        {/* Governance tab */}
        {tab === 'governance' && (
          <GovernancePanel
            address={address}
            chain={chain}
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
                <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  Loading graph data...
                </p>
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
                <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  No transfer data available for graph visualization.
                </p>
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
        <div
          className="mt-12 pt-6"
          style={{ borderTop: '1px solid var(--color-border-subtle)' }}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p
              className="text-xs"
              style={{
                color: 'var(--color-text-tertiary)',
                fontFamily: 'var(--font-jetbrains), monospace',
              }}
            >
              Part of{' '}
              <Link href="/forensics" style={{ color: 'var(--color-accent-primary)' }}>
                HubSec Forensics
              </Link>
              . Advanced features coming soon.
            </p>
            <NotesExportPanel />
          </div>
        </div>
      </div>

      {/* Extrinsic Detail Panel */}
      {selectedExtrinsic && !isEth && (
        <ExtrinsicDetailPanel
          hashOrIndex={selectedExtrinsic}
          chain={chain}
          onClose={() => setSelectedExtrinsic(null)}
          onAddressClick={(addr) => { setSelectedExtrinsic(null); onAddressClick(addr); }}
        />
      )}
    </section>
  );
}

// ─── Main Router ───────────────────────────────────────────────

function ExplorerRouter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const address = searchParams.get('address') || '';
  const chain = searchParams.get('chain') || DEFAULT_CHAIN;

  const updateParams = useCallback(
    (params: Record<string, string | null>) => {
      const sp = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(params)) {
        if (v === null) sp.delete(k);
        else sp.set(k, v);
      }
      router.push(`/explorer?${sp.toString()}`);
    },
    [searchParams, router],
  );

  const handleSearch = useCallback(
    (addr: string, chainOverride?: string) => {
      updateParams({ address: addr, chain: chainOverride || chain });
    },
    [updateParams, chain],
  );

  const handleChainChange = useCallback(
    (newChain: string) => {
      updateParams({ chain: newChain });
    },
    [updateParams],
  );

  const handleBack = useCallback(() => {
    updateParams({ address: null });
  }, [updateParams]);

  const handleAddressClick = useCallback(
    (addr: string) => {
      // Only switch chains when the current chain can't handle the address format
      const addrType = detectAddressType(addr);
      const currentConfig = getChain(chain);
      if (addrType === 'ethereum' && !currentConfig.evmCompatible) {
        updateParams({ address: addr, chain: 'ethereum' });
      } else if (addrType === 'substrate' && isEthereumChain(chain)) {
        updateParams({ address: addr, chain: 'assethub' });
      } else {
        updateParams({ address: addr });
      }
    },
    [updateParams, chain],
  );

  if (!address) {
    return (
      <SearchView onSearch={handleSearch} chain={chain} onChainChange={handleChainChange} />
    );
  }

  if (!isValidAddress(address)) {
    return (
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 md:px-6 text-center">
          <h1
            className="text-2xl font-bold mb-4"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              color: 'var(--color-text-primary)',
            }}
          >
            Invalid Address
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            The address in the URL is not valid. Enter a valid Polkadot (SS58) or Ethereum (0x)
            address.
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
            <div
              className="h-10 w-64 mx-auto rounded animate-pulse mb-4"
              style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
            />
            <div
              className="h-4 w-48 mx-auto rounded animate-pulse"
              style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
            />
          </div>
        </section>
      }
    >
      <ExplorerRouter />
    </Suspense>
  );
}

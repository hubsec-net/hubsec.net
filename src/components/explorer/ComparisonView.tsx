'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchAccountInfo, fetchTransfers, type Transfer, type AccountInfo } from '@/lib/subscan';
import { fetchEthAccountInfo, fetchEthTransfers } from '@/lib/etherscan';
import { isEthereumChain, getChain } from '@/lib/chains';
import { isValidAddress, detectAddressType, truncateAddress, formatNumber, timeAgo, formatTimestamp } from '@/lib/explorer-utils';
import { computeRiskScore, getRiskLabel, getRiskColor, type RiskScore } from '@/lib/risk-scoring';
import { useAddressTag } from '@/hooks/useAddressTag';
import { TagPill, AddressWithTag } from '@/components/explorer/AddressTag';
import { CopyButton } from '@/components/ui/CopyButton';

interface Props {
  addressA: string;
  chainA: string;
  onAddressClick: (address: string) => void;
  onClose: () => void;
}

interface AccountData {
  address: string;
  chain: string;
  accountInfo: AccountInfo | null;
  transfers: Transfer[];
  loading: boolean;
  error: string | null;
}

function useAccountData(address: string, chain: string): AccountData {
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const isEth = isEthereumChain(chain);
        if (isEth) {
          const [acct, txRes] = await Promise.all([
            fetchEthAccountInfo(address).catch(() => null),
            fetchEthTransfers(address, 0, 500),
          ]);
          if (cancelled) return;
          setAccountInfo(acct);
          setTransfers(txRes.transfers || []);
        } else {
          const [acct, txRes] = await Promise.all([
            fetchAccountInfo(address, chain).catch(() => null),
            fetchTransfers(address, chain, 0, 100),
          ]);
          if (cancelled) return;
          setAccountInfo(acct);
          setTransfers(txRes.transfers || []);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [address, chain]);

  return { address, chain, accountInfo, transfers, loading, error };
}

function computeStats(transfers: Transfer[], address: string, nativeSymbol: string) {
  let totalSent = 0, totalReceived = 0, sentCount = 0, recvCount = 0;
  const counterparties = new Set<string>();
  let firstSeen: number | null = null, lastSeen: number | null = null;
  const addr = address.toLowerCase();

  for (const t of transfers) {
    const from = t.from.toLowerCase();
    const to = t.to.toLowerCase();
    const isSender = from === addr;
    const isReceiver = to === addr;
    if (isSender) sentCount++;
    if (isReceiver) recvCount++;
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

  return { totalSent, totalReceived, sentCount, recvCount, counterparties, firstSeen, lastSeen };
}

export function ComparisonView({ addressA, chainA, onAddressClick, onClose }: Props) {
  const [inputB, setInputB] = useState('');
  const [addressB, setAddressB] = useState('');
  const [chainB, setChainB] = useState(chainA);
  const [searchError, setSearchError] = useState('');

  const dataA = useAccountData(addressA, chainA);
  const dataB = useAccountData(addressB, chainB);

  const handleSearchB = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputB.trim();
    if (!isValidAddress(trimmed)) {
      setSearchError('Enter a valid address');
      return;
    }
    setSearchError('');
    const addrType = detectAddressType(trimmed);
    const resolvedChain = addrType === 'ethereum' ? 'ethereum' : chainA;
    setChainB(resolvedChain);
    setAddressB(trimmed.toLowerCase());
  };

  // Shared counterparties
  const comparison = useMemo(() => {
    if (!dataA.transfers.length || !dataB.transfers.length) return null;

    const addrA = addressA.toLowerCase();
    const addrB = addressB.toLowerCase();

    // Get counterparties for each
    const cpA = new Map<string, number>();
    for (const t of dataA.transfers) {
      const cp = t.from.toLowerCase() === addrA ? t.to.toLowerCase() : t.from.toLowerCase();
      if (cp === addrA) continue;
      cpA.set(cp, (cpA.get(cp) || 0) + parseFloat(t.amount || '0'));
    }

    const cpB = new Map<string, number>();
    for (const t of dataB.transfers) {
      const cp = t.from.toLowerCase() === addrB ? t.to.toLowerCase() : t.from.toLowerCase();
      if (cp === addrB) continue;
      cpB.set(cp, (cpB.get(cp) || 0) + parseFloat(t.amount || '0'));
    }

    // Find shared
    const shared: Array<{ address: string; volumeA: number; volumeB: number }> = [];
    for (const [cp, volA] of cpA) {
      if (cpB.has(cp)) {
        shared.push({ address: cp, volumeA: volA, volumeB: cpB.get(cp)! });
      }
    }
    shared.sort((a, b) => (b.volumeA + b.volumeB) - (a.volumeA + a.volumeB));

    // Direct transfers between A and B
    const directAtoB = dataA.transfers.filter(t =>
      t.from.toLowerCase() === addrA && t.to.toLowerCase() === addrB
    );
    const directBtoA = dataB.transfers.filter(t =>
      t.from.toLowerCase() === addrB && t.to.toLowerCase() === addrA
    );

    return { shared: shared.slice(0, 15), directAtoB, directBtoA };
  }, [dataA.transfers, dataB.transfers, addressA, addressB]);

  const chainConfigA = getChain(chainA);
  const chainConfigB = getChain(chainB);
  const statsA = useMemo(() => computeStats(dataA.transfers, addressA, chainConfigA.tokenSymbol), [dataA.transfers, addressA, chainConfigA.tokenSymbol]);
  const statsB = useMemo(() => computeStats(dataB.transfers, addressB, chainConfigB.tokenSymbol), [dataB.transfers, addressB, chainConfigB.tokenSymbol]);
  const riskA = useMemo(() => dataA.transfers.length ? computeRiskScore(dataA.transfers, dataA.accountInfo?.balance || '0', statsA.firstSeen) : { overall: 0, factors: [] }, [dataA.transfers, dataA.accountInfo, statsA.firstSeen]);
  const riskB = useMemo(() => dataB.transfers.length ? computeRiskScore(dataB.transfers, dataB.accountInfo?.balance || '0', statsB.firstSeen) : { overall: 0, factors: [] }, [dataB.transfers, dataB.accountInfo, statsB.firstSeen]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--color-text-primary)' }}>
          Address Comparison
        </h3>
        <button
          onClick={onClose}
          className="text-xs"
          style={{ color: 'var(--color-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Close comparison
        </button>
      </div>

      {/* Search for address B */}
      {!addressB && (
        <form onSubmit={handleSearchB} className="flex gap-2 mb-6">
          <input
            type="text"
            value={inputB}
            onChange={e => { setInputB(e.target.value); setSearchError(''); }}
            placeholder="Enter address to compare..."
            className="flex-1 rounded px-3 py-2 text-xs"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: `1px solid ${searchError ? 'var(--color-flow-out)' : 'var(--color-border-default)'}`,
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-jetbrains), monospace',
              outline: 'none',
            }}
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 rounded text-xs"
            style={{ backgroundColor: 'var(--color-accent-primary)', color: 'var(--color-text-inverse)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jetbrains), monospace' }}
          >
            Compare
          </button>
        </form>
      )}
      {searchError && <p className="text-xs mb-3" style={{ color: 'var(--color-flow-out)' }}>{searchError}</p>}

      {/* Side-by-side comparison */}
      {addressB && (
        <div className="space-y-6">
          {/* Stat comparison grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CompareCard
              label="Address A"
              address={addressA}
              chain={chainA}
              accountInfo={dataA.accountInfo}
              stats={statsA}
              risk={riskA}
              loading={dataA.loading}
              onAddressClick={onAddressClick}
            />
            <CompareCard
              label="Address B"
              address={addressB}
              chain={chainB}
              accountInfo={dataB.accountInfo}
              stats={statsB}
              risk={riskB}
              loading={dataB.loading}
              onAddressClick={onAddressClick}
            />
          </div>

          {/* Shared analysis */}
          {comparison && (
            <>
              {/* Direct transfers */}
              {(comparison.directAtoB.length > 0 || comparison.directBtoA.length > 0) && (
                <div
                  className="rounded-lg p-4"
                  style={{ backgroundColor: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.2)' }}
                >
                  <h4 className="text-xs font-semibold mb-2" style={{ color: '#34d399', fontFamily: 'var(--font-jetbrains), monospace' }}>
                    Direct Transfers Between Addresses
                  </h4>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    A &rarr; B: {comparison.directAtoB.length} transfers
                    {comparison.directAtoB.length > 0 && ` (${comparison.directAtoB.reduce((s, t) => s + parseFloat(t.amount || '0'), 0).toFixed(4)} total)`}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    B &rarr; A: {comparison.directBtoA.length} transfers
                    {comparison.directBtoA.length > 0 && ` (${comparison.directBtoA.reduce((s, t) => s + parseFloat(t.amount || '0'), 0).toFixed(4)} total)`}
                  </p>
                </div>
              )}

              {/* Shared counterparties */}
              {comparison.shared.length > 0 && (
                <div
                  className="rounded-lg p-4"
                  style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)' }}
                >
                  <h4 className="text-xs font-semibold mb-3" style={{ fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--color-text-primary)' }}>
                    Shared Counterparties ({comparison.shared.length})
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs" style={{ fontFamily: 'var(--font-jetbrains), monospace' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border-strong)' }}>
                          <th className="text-left py-1.5 px-2" style={{ color: 'var(--color-text-tertiary)' }}>Address</th>
                          <th className="text-right py-1.5 px-2" style={{ color: 'var(--color-text-tertiary)' }}>Volume (A)</th>
                          <th className="text-right py-1.5 px-2" style={{ color: 'var(--color-text-tertiary)' }}>Volume (B)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparison.shared.map((cp, i) => {
                          return (
                            <tr key={i} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                              <td className="py-1.5 px-2">
                                <AddressWithTag address={cp.address} chain={chainA} onClick={onAddressClick} prefixLen={8} suffixLen={6} />
                              </td>
                              <td className="py-1.5 px-2 text-right" style={{ color: 'var(--color-text-primary)', fontFeatureSettings: '"tnum"' }}>
                                {cp.volumeA.toFixed(4)}
                              </td>
                              <td className="py-1.5 px-2 text-right" style={{ color: 'var(--color-text-primary)', fontFeatureSettings: '"tnum"' }}>
                                {cp.volumeB.toFixed(4)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {comparison.shared.length === 0 && comparison.directAtoB.length === 0 && comparison.directBtoA.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    No shared counterparties or direct transfers found between these addresses.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CompareCard({
  label, address, chain, accountInfo, stats, risk, loading, onAddressClick,
}: {
  label: string;
  address: string;
  chain: string;
  accountInfo: AccountInfo | null;
  stats: ReturnType<typeof computeStats>;
  risk: RiskScore;
  loading: boolean;
  onAddressClick: (addr: string) => void;
}) {
  const chainConfig = getChain(chain);
  const { tag: known } = useAddressTag(address, chain);

  if (loading) {
    return (
      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)' }}>
        <p className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)' }}>{label}</p>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 rounded animate-pulse" style={{ backgroundColor: 'var(--color-bg-tertiary)', width: `${85 - i * 10}%` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)' }}>
      <p className="text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>{label}</p>
      <div className="flex items-center gap-1.5 mb-3">
        <button
          onClick={() => onAddressClick(address)}
          className="text-xs font-mono"
          style={{ color: 'var(--color-accent-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          {truncateAddress(address, 10, 8)}
        </button>
        {known && <TagPill tag={known.tag} category={known.category} />}
        <CopyButton text={address} />
      </div>
      <div className="space-y-1.5 text-xs font-mono">
        <Row label="Balance" value={`${formatNumber(accountInfo?.balance || '0')} ${chainConfig.tokenSymbol}`} />
        <Row label="Sent" value={`${stats.totalSent.toFixed(2)} ${chainConfig.tokenSymbol}`} />
        <Row label="Received" value={`${stats.totalReceived.toFixed(2)} ${chainConfig.tokenSymbol}`} />
        <Row label="Tx Count" value={`${stats.sentCount + stats.recvCount}`} />
        <Row label="Counterparties" value={`${stats.counterparties.size}`} />
        <Row label="First Transfer" value={stats.firstSeen ? timeAgo(stats.firstSeen) : '—'} />
        <Row label="Risk" value={`${risk.overall}/100 (${getRiskLabel(risk.overall)})`} color={getRiskColor(risk.overall)} />
      </div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: 'var(--color-text-tertiary)' }}>{label}</span>
      <span style={{ color: color || 'var(--color-text-primary)', fontFeatureSettings: '"tnum"' }}>{value}</span>
    </div>
  );
}

'use client';

import { formatNumber, formatTimestamp, timeAgo } from '@/lib/explorer-utils';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  loading?: boolean;
}

function StatCard({ label, value, sub, loading }: StatCardProps) {
  return (
    <div
      className="rounded-lg p-4"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border-default)',
      }}
    >
      <p
        className="text-xs mb-1"
        style={{
          color: 'var(--color-text-tertiary)',
          fontFamily: 'var(--font-jetbrains), monospace',
        }}
      >
        {label}
      </p>
      {loading ? (
        <div
          className="h-6 w-24 rounded animate-pulse"
          style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
        />
      ) : (
        <>
          <p
            className="text-lg font-semibold"
            style={{
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-jetbrains), monospace',
              fontFeatureSettings: '"tnum"',
            }}
          >
            {value}
          </p>
          {sub && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
              {sub}
            </p>
          )}
        </>
      )}
    </div>
  );
}

interface StatsGridProps {
  balance: string;
  tokenSymbol: string;
  chainName: string;
  totalSent: number;
  totalReceived: number;
  txCount: number;
  sentCount: number;
  recvCount: number;
  firstSeen: number | null;
  lastSeen: number | null;
  counterpartyCount: number;
  stakingBonded: string | null;
  stakingStatus: string | null;
  /** For Ethereum accounts: EOA / Verified / Unverified */
  contractStatus?: string | null;
  loading?: boolean;
  /** Number of transfers loaded so far for stats */
  loadedCount?: number;
  /** Whether all transfers have been fetched */
  statsComplete?: boolean;
}

export function StatsGrid({
  balance,
  tokenSymbol,
  chainName,
  totalSent,
  totalReceived,
  txCount,
  sentCount,
  recvCount,
  firstSeen,
  lastSeen,
  counterpartyCount,
  stakingBonded,
  stakingStatus,
  contractStatus,
  loading = false,
  loadedCount,
  statsComplete = true,
}: StatsGridProps) {
  const statsPartial = !statsComplete && (loadedCount ?? 0) > 0;
  // Determine the 8th card: Staking for Substrate, Account Type for Ethereum
  const isEthMode = contractStatus !== undefined && contractStatus !== null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        label="Total Balance"
        value={loading ? '' : `${formatNumber(balance)}`}
        sub={tokenSymbol}
        loading={loading}
      />
      <StatCard
        label={`Total Sent (${tokenSymbol})`}
        value={loading ? '' : formatNumber(totalSent.toFixed(2))}
        sub={statsPartial ? `loading full history…` : `on ${chainName}`}
        loading={loading}
      />
      <StatCard
        label={`Total Received (${tokenSymbol})`}
        value={loading ? '' : formatNumber(totalReceived.toFixed(2))}
        sub={statsPartial ? `loading full history…` : `on ${chainName}`}
        loading={loading}
      />
      <StatCard
        label="Tx Count"
        value={loading ? '' : formatNumber(txCount)}
        sub={loading ? undefined : `sent: ${sentCount} / recv: ${recvCount}`}
        loading={loading}
      />
      <StatCard
        label="First Transfer"
        value={loading || !firstSeen ? '—' : timeAgo(firstSeen)}
        sub={firstSeen ? `${formatTimestamp(firstSeen)} · on ${chainName}` : undefined}
        loading={loading}
      />
      <StatCard
        label="Last Transfer"
        value={loading || !lastSeen ? '—' : timeAgo(lastSeen)}
        sub={lastSeen ? formatTimestamp(lastSeen) : undefined}
        loading={loading}
      />
      <StatCard
        label="Counterparties"
        value={loading ? '' : formatNumber(counterpartyCount)}
        sub="unique addresses"
        loading={loading}
      />
      {isEthMode ? (
        <StatCard
          label="Account Type"
          value={loading ? '' : contractStatus || 'Unknown'}
          loading={loading}
        />
      ) : (
        <StatCard
          label="Staking"
          value={loading ? '' : stakingStatus || 'None'}
          sub={
            stakingBonded
              ? `Bonded: ${formatNumber(stakingBonded)} ${tokenSymbol}`
              : undefined
          }
          loading={loading}
        />
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import {
  fetchNominatorDetail,
  fetchValidatorDetail,
  fetchRewardSlash,
  type StakingNominatorResponse,
  type StakingValidatorResponse,
  type RewardSlash,
  type AccountInfo,
} from '@/lib/subscan';
import { getChain, isEthereumChain } from '@/lib/chains';
import { truncateAddress, formatNumber } from '@/lib/explorer-utils';
import { useAddressTag } from '@/hooks/useAddressTag';
import { TagPill } from '@/components/explorer/AddressTag';

interface Props {
  address: string;
  chain: string;
  accountInfo: AccountInfo | null;
  onAddressClick: (address: string) => void;
}

export function StakingDetail({ address, chain, accountInfo, onAddressClick }: Props) {
  const [nominator, setNominator] = useState<StakingNominatorResponse | null>(null);
  const [validator, setValidator] = useState<StakingValidatorResponse | null>(null);
  const [rewards, setRewards] = useState<RewardSlash[]>([]);
  const [loading, setLoading] = useState(true);
  const isEth = isEthereumChain(chain);
  const chainConfig = getChain(chain);
  const decimals = chainConfig.tokenDecimals;
  const symbol = chainConfig.tokenSymbol;

  const role = accountInfo?.role;

  useEffect(() => {
    if (isEth) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        const [nom, val, rs] = await Promise.all([
          role === 'nominator' || !role ? fetchNominatorDetail(address, chain) : null,
          role === 'validator' || !role ? fetchValidatorDetail(address, chain) : null,
          fetchRewardSlash(address, chain, 0).catch(() => ({ count: 0, list: null })),
        ]);
        if (cancelled) return;
        if (nom) setNominator(nom);
        if (val) setValidator(val);
        setRewards(rs?.list || []);
      } catch {
        // Non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [address, chain, isEth, role]);

  if (isEth) return null;

  const bonded = accountInfo?.bonded;
  const hasBond = bonded && parseFloat(bonded) > 0;
  const hasNomData = nominator?.nominating && nominator.nominating.length > 0;
  const hasValData = validator && parseFloat(validator.bonded_total || '0') > 0;

  if (loading) {
    return (
      <div
        className="rounded-lg p-4"
        style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)' }}
      >
        <h4 className="text-xs font-semibold mb-3" style={{ fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--color-text-primary)' }}>
          Staking
        </h4>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 rounded animate-pulse" style={{ backgroundColor: 'var(--color-bg-tertiary)', width: `${85 - i * 12}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!hasBond && !hasNomData && !hasValData) {
    return (
      <div
        className="rounded-lg p-4"
        style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)' }}
      >
        <h4 className="text-xs font-semibold mb-2" style={{ fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--color-text-primary)' }}>
          Staking
        </h4>
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          No staking activity detected for this account.
        </p>
      </div>
    );
  }

  const fmtBalance = (raw: string) => {
    const num = parseFloat(raw) / Math.pow(10, decimals);
    return `${formatNumber(num.toFixed(4).replace(/\.?0+$/, ''))} ${symbol}`;
  };

  // Commission as percentage
  const fmtCommission = (v: number | string) => {
    const num = typeof v === 'string' ? parseFloat(v) : v;
    // Subscan returns commission as perbill (1e9) or percentage
    if (num > 100) return `${(num / 1e7).toFixed(1)}%`;
    return `${num}%`;
  };

  return (
    <div
      className="rounded-lg p-4"
      style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)' }}
    >
      <h4 className="text-xs font-semibold mb-3" style={{ fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--color-text-primary)' }}>
        Staking {role && <span style={{ color: 'var(--color-text-tertiary)' }}>({role})</span>}
      </h4>

      {/* Bond info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {hasBond && (
          <MiniStat label="Bonded" value={fmtBalance(bonded!)} />
        )}
        {nominator?.reward_dest && (
          <MiniStat label="Reward Dest" value={nominator.reward_dest} />
        )}
        {hasValData && (
          <>
            <MiniStat label="Self-Stake" value={fmtBalance(validator.bonded_owner || '0')} />
            <MiniStat label="Total Stake" value={fmtBalance(validator.bonded_total || '0')} />
            <MiniStat label="Nominators" value={formatNumber(validator.count_nominators || validator.bonded_nominators || 0)} />
            <MiniStat label="Commission" value={fmtCommission(validator.validator_prefs_value || 0)} />
            {validator.reward_point !== undefined && (
              <MiniStat label="Era Points" value={formatNumber(validator.reward_point)} />
            )}
            {validator.slash_count !== undefined && (
              <MiniStat
                label="Slashes"
                value={validator.slash_count === 0 ? 'None' : String(validator.slash_count)}
                warn={validator.slash_count > 0}
              />
            )}
          </>
        )}
      </div>

      {/* Nominated validators (nominator role) */}
      {hasNomData && (
        <div className="mb-4">
          <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-jetbrains), monospace' }}>
            Nominated Validators ({nominator!.nominating!.length})
          </p>
          <div className="space-y-1.5">
            {nominator!.nominating!.map((v, i) => (
              <ValidatorRow
                key={i}
                index={i}
                validator={v}
                chain={chain}
                fmtBalance={fmtBalance}
                fmtCommission={fmtCommission}
                onAddressClick={onAddressClick}
              />
            ))}
          </div>
          {/* Forensic flags */}
          {nominator!.nominating!.some(v => {
            const c = v.validator_prefs?.commission;
            if (!c) return false;
            const pct = typeof c === 'string' ? parseFloat(c) : c;
            return pct > 50 || (pct > 500000000); // > 50% commission
          }) && (
            <div
              className="mt-2 px-3 py-2 rounded text-xs"
              style={{ backgroundColor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}
            >
              &#9888; This account nominates validators with unusually high commission (&gt;50%).
              This may indicate collusion or lack of due diligence.
            </div>
          )}
        </div>
      )}

      {/* Recent rewards */}
      {rewards.length > 0 && (
        <div>
          <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-jetbrains), monospace' }}>
            Recent Rewards/Slashes
          </p>
          <div className="space-y-1">
            {rewards.slice(0, 10).map((rs, i) => {
              const isReward = rs.event_id === 'Rewarded' || rs.event_id === 'Reward';
              const amount = parseFloat(rs.amount || '0') / Math.pow(10, decimals);
              return (
                <div key={i} className="flex items-center gap-3 text-xs font-mono py-1">
                  <span style={{ color: isReward ? '#34d399' : '#f87171' }}>
                    {isReward ? '+' : '-'}{amount.toFixed(4)} {symbol}
                  </span>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>
                    {rs.module_id}.{rs.event_id}
                  </span>
                  <span className="ml-auto" style={{ color: 'var(--color-text-tertiary)' }}>
                    Block {formatNumber(rs.block_num)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Individual validator row — uses hook for tag resolution */
function ValidatorRow({ index, validator: v, chain, fmtBalance, fmtCommission, onAddressClick }: {
  index: number;
  validator: { stash_account_display?: { address?: string; display?: string }; validator_prefs?: { commission?: number | string }; bonded_total?: string };
  chain: string;
  fmtBalance: (raw: string) => string;
  fmtCommission: (v: number | string) => string;
  onAddressClick: (addr: string) => void;
}) {
  const addr = v.stash_account_display?.address || '';
  const { tag: known } = useAddressTag(addr, chain);
  const displayName = v.stash_account_display?.display || known?.tag;
  const commission = v.validator_prefs?.commission;
  const commPct = commission ? fmtCommission(commission) : null;
  const highComm = commPct && parseFloat(commPct) > 50;

  return (
    <div
      className="flex items-center gap-2 py-1.5 px-2 rounded text-xs"
      style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
    >
      <span style={{ color: 'var(--color-text-tertiary)', minWidth: 16 }}>{index + 1}.</span>
      <button
        onClick={() => addr && onAddressClick(addr)}
        className="font-mono"
        style={{ color: 'var(--color-accent-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit' }}
      >
        {displayName || truncateAddress(addr, 8, 6)}
      </button>
      {known && <TagPill tag={known.tag} category={known.category} />}
      {commPct && (
        <span style={{ color: highComm ? '#f87171' : 'var(--color-text-tertiary)' }}>
          {commPct} comm
          {highComm && <span style={{ color: '#f87171', marginLeft: 4 }}>&#9888;</span>}
        </span>
      )}
      {v.bonded_total && (
        <span className="ml-auto" style={{ color: 'var(--color-text-tertiary)' }}>
          {fmtBalance(v.bonded_total)} total
        </span>
      )}
    </div>
  );
}

function MiniStat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <p className="text-xs mb-0.5" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-jetbrains), monospace', fontSize: 10 }}>
        {label}
      </p>
      <p className="text-xs font-semibold" style={{ color: warn ? '#f87171' : 'var(--color-text-primary)', fontFamily: 'var(--font-jetbrains), monospace' }}>
        {value}
      </p>
    </div>
  );
}

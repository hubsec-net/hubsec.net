'use client';

import { useState, useEffect } from 'react';
import { fetchMultisigRecords, type MultisigRecord } from '@/lib/subscan';
import { isEthereumChain } from '@/lib/chains';
import { truncateAddress } from '@/lib/explorer-utils';
import { useAddressTag } from '@/hooks/useAddressTag';
import { TagPill } from '@/components/explorer/AddressTag';

interface Props {
  address: string;
  chain: string;
  onAddressClick: (address: string) => void;
}

export function ControlRelationships({ address, chain, onAddressClick }: Props) {
  const [multisigs, setMultisigs] = useState<MultisigRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const isEth = isEthereumChain(chain);

  useEffect(() => {
    if (isEth) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        const [msRes] = await Promise.all([
          fetchMultisigRecords(address, chain),
        ]);
        if (cancelled) return;
        setMultisigs(msRes.multisig || []);
      } catch {
        // Non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [address, chain, isEth]);

  if (isEth) return null; // Proxy/multisig not applicable to Ethereum
  if (loading) {
    return (
      <div
        className="rounded-lg p-4"
        style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)' }}
      >
        <h4
          className="text-xs font-semibold mb-3"
          style={{ fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--color-text-primary)' }}
        >
          Control Relationships
        </h4>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-4 rounded animate-pulse" style={{ backgroundColor: 'var(--color-bg-tertiary)', width: `${80 - i * 15}%` }} />
          ))}
        </div>
      </div>
    );
  }

  const hasData = multisigs.length > 0;

  if (!hasData) {
    return (
      <div
        className="rounded-lg p-4"
        style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)' }}
      >
        <h4
          className="text-xs font-semibold mb-2"
          style={{ fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--color-text-primary)' }}
        >
          Control Relationships
        </h4>
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          No proxy or multisig relationships found on-chain for this account.
        </p>
      </div>
    );
  }

  // Deduplicate multisig accounts
  const uniqueMultisigs = new Map<string, MultisigRecord>();
  for (const ms of multisigs) {
    const key = ms.multi_id || ms.multi_account_display?.address || '';
    if (key && !uniqueMultisigs.has(key)) {
      uniqueMultisigs.set(key, ms);
    }
  }

  return (
    <div
      className="rounded-lg p-4"
      style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)' }}
    >
      <h4
        className="text-xs font-semibold mb-3"
        style={{ fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--color-text-primary)' }}
      >
        Control Relationships
      </h4>

      {/* Multisig activity */}
      {uniqueMultisigs.size > 0 && (
        <div className="mb-3">
          <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Multisig Activity ({uniqueMultisigs.size} records)
          </p>
          <div className="space-y-2">
            {Array.from(uniqueMultisigs.values()).slice(0, 10).map((ms, i) => (
              <MultisigRow key={i} ms={ms} chain={chain} onAddressClick={onAddressClick} />
            ))}
          </div>
          {/* Approvers for most recent multisig */}
          {multisigs[0]?.approve_record && multisigs[0].approve_record.length > 0 && (
            <div className="mt-2 ml-6">
              <p className="text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
                Signers (most recent):
              </p>
              {multisigs[0].approve_record.map((ar, i) => (
                <SignerRow key={i} ar={ar} chain={chain} onAddressClick={onAddressClick} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Individual multisig row — uses hook for tag resolution */
function MultisigRow({ ms, chain, onAddressClick }: { ms: MultisigRecord; chain: string; onAddressClick: (addr: string) => void }) {
  const multiAddr = ms.multi_account_display?.address || ms.multi_id;
  const { tag: known } = useAddressTag(multiAddr || '', chain);

  return (
    <div
      className="flex items-center gap-2 py-1.5 px-2 rounded"
      style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
    >
      <span className="text-xs" style={{ color: '#3b82f6' }}>MS</span>
      {multiAddr ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => onAddressClick(multiAddr)}
            className="text-xs font-mono"
            style={{ color: 'var(--color-accent-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {truncateAddress(multiAddr, 8, 6)}
          </button>
          {known && <TagPill tag={known.tag} category={known.category} />}
        </span>
      ) : (
        <span className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>Unknown</span>
      )}
      <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
        Threshold: {ms.threshold}
      </span>
      <span
        className="text-xs px-1.5 py-0.5 rounded ml-auto"
        style={{
          backgroundColor: ms.status === 'completed' ? 'rgba(52,211,153,0.1)' : 'rgba(245,158,11,0.1)',
          color: ms.status === 'completed' ? '#34d399' : '#f59e0b',
        }}
      >
        {ms.status}
      </span>
      <span className="text-xs font-mono" style={{ color: 'var(--color-text-tertiary)' }}>
        {ms.call_module}.{ms.call_module_function}
      </span>
    </div>
  );
}

/** Individual signer row — uses hook for tag resolution */
function SignerRow({ ar, chain, onAddressClick }: {
  ar: MultisigRecord['approve_record'] extends (infer T)[] | undefined ? T : never;
  chain: string;
  onAddressClick: (addr: string) => void;
}) {
  const sigAddr = ar.account_display?.address || '';
  const { tag: known } = useAddressTag(sigAddr, chain);

  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>&rarr;</span>
      {sigAddr ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => onAddressClick(sigAddr)}
            className="text-xs font-mono"
            style={{ color: 'var(--color-accent-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {truncateAddress(sigAddr, 8, 6)}
          </button>
          {known && <TagPill tag={known.tag} category={known.category} />}
        </span>
      ) : (
        <span className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>Unknown signer</span>
      )}
      <span className="text-xs" style={{ color: ar.approve_type === 'approve' ? '#34d399' : 'var(--color-text-tertiary)' }}>
        {ar.approve_type}
      </span>
    </div>
  );
}

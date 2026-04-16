'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchExtrinsicDetail,
  type ExtrinsicDetail as ExtrinsicDetailType,
  type ExtrinsicParam,
  type ExtrinsicEvent,
} from '@/lib/subscan';
import { getChain } from '@/lib/chains';
import { getExplorerTxUrl, getExplorerBlockUrl } from '@/lib/explorer-urls';
import { truncateAddress, formatTimestamp, timeAgo, formatNumber } from '@/lib/explorer-utils';
import { useAddressTag } from '@/hooks/useAddressTag';
import { TagPill } from '@/components/explorer/AddressTag';
import { CopyButton } from '@/components/ui/CopyButton';

interface Props {
  hashOrIndex: string;
  chain: string;
  onClose: () => void;
  onAddressClick: (address: string) => void;
}

// Format planck/wei value to human-readable with symbol
function formatPlanck(value: string | number, decimals: number, symbol: string): string {
  const raw = typeof value === 'string' ? value : String(value);
  const num = parseFloat(raw) / Math.pow(10, decimals);
  if (num === 0) return `0 ${symbol}`;
  if (num < 0.0001) return `${num.toExponential(4)} ${symbol}`;
  return `${num.toLocaleString('en-US', { maximumFractionDigits: 10 })} ${symbol}`;
}

/** Address param display — uses hook for tag resolution */
function AddressParamDisplay({ address, chain, onAddressClick }: { address: string; chain: string; onAddressClick: (addr: string) => void }) {
  const { tag: known } = useAddressTag(address, chain);
  return (
    <span className="flex items-center gap-1.5 flex-wrap">
      <button
        onClick={() => onAddressClick(address)}
        className="font-mono text-xs break-all"
        style={{ color: 'var(--color-accent-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        {truncateAddress(address, 10, 8)}
      </button>
      <CopyButton text={address} />
      {known && <TagPill tag={known.tag} category={known.category} />}
    </span>
  );
}

/** Target address in a list — uses hook for tag resolution */
function TargetAddressItem({ address, chain, index, onAddressClick }: { address: string; chain: string; index: number; onAddressClick: (addr: string) => void }) {
  const { tag: known } = useAddressTag(address, chain);
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{index + 1}.</span>
      <button
        onClick={() => onAddressClick(address)}
        className="font-mono text-xs"
        style={{ color: 'var(--color-accent-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        {truncateAddress(address, 10, 6)}
      </button>
      {known && <TagPill tag={known.tag} category={known.category} />}
    </div>
  );
}

// Decode a param value for display
function formatParamValue(
  param: ExtrinsicParam,
  decimals: number,
  symbol: string,
  chain: string,
  onAddressClick: (addr: string) => void,
): React.ReactNode {
  const v = param.value;
  const name = param.name.toLowerCase();

  // Address-like params
  if (
    (name === 'dest' || name === 'target' || name === 'source' || name === 'who' ||
     name === 'beneficiary' || name === 'account' || name === 'real' ||
     name === 'delegate' || name === 'proxy' || name === 'payee' ||
     name === 'controller' || name === 'stash') &&
    typeof v === 'string' && v.length >= 40
  ) {
    const addr = typeof v === 'string' ? v : '';
    return <AddressParamDisplay address={addr} chain={chain} onAddressClick={onAddressClick} />;
  }

  // Multi-address ID object { id: "address" }
  if (typeof v === 'object' && v !== null && 'id' in (v as Record<string, unknown>)) {
    const addr = String((v as Record<string, unknown>).id);
    return <AddressParamDisplay address={addr} chain={chain} onAddressClick={onAddressClick} />;
  }

  // Value/amount params — show human-readable
  if (
    (name === 'value' || name === 'amount' || name === 'balance' ||
     name === 'max_additional' || name === 'bond' || name === 'tip' ||
     name === 'keep_alive') &&
    (typeof v === 'string' || typeof v === 'number')
  ) {
    const raw = String(v);
    return (
      <span className="font-mono text-xs">
        <span style={{ color: 'var(--color-text-tertiary)' }}>{raw} planck</span>
        {' = '}
        <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
          {formatPlanck(raw, decimals, symbol)}
        </span>
      </span>
    );
  }

  // Targets array (e.g. staking.nominate)
  if (name === 'targets' && Array.isArray(v)) {
    return (
      <div className="space-y-1">
        {(v as unknown[]).map((target, i) => {
          const addr = typeof target === 'string' ? target : typeof target === 'object' && target && 'id' in (target as Record<string, unknown>) ? String((target as Record<string, unknown>).id) : String(target);
          return <TargetAddressItem key={i} address={addr} chain={chain} index={i} onAddressClick={onAddressClick} />;
        })}
      </div>
    );
  }

  // Remark (hex or string)
  if (name === 'remark' || name === 'remark_with_event') {
    const str = String(v);
    if (str.startsWith('0x')) {
      try {
        const decoded = Buffer.from(str.slice(2), 'hex').toString('utf8');
        if (/^[\x20-\x7E]+$/.test(decoded)) {
          return <span className="font-mono text-xs break-all">&quot;{decoded}&quot;</span>;
        }
      } catch { /* fallthrough */ }
    }
    return <span className="font-mono text-xs break-all">{str}</span>;
  }

  // Default: JSON or string
  if (typeof v === 'object') {
    return <pre className="font-mono text-xs whitespace-pre-wrap break-all" style={{ color: 'var(--color-text-secondary)' }}>{JSON.stringify(v, null, 2)}</pre>;
  }
  return <span className="font-mono text-xs break-all">{String(v)}</span>;
}

// Parse event params (can be JSON string or already parsed)
function parseEventParams(raw: string): Array<{ type: string; value: unknown; name?: string }> {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function EventRow({ evt, decimals, symbol }: { evt: ExtrinsicEvent; decimals: number; symbol: string }) {
  const params = parseEventParams(evt.params);
  // Format event params as a short summary
  const summary = params.map(p => {
    if (typeof p.value === 'string' && p.value.length >= 40) {
      return truncateAddress(p.value, 8, 6);
    }
    if ((p.name === 'amount' || p.name === 'value' || p.name === 'actual_fee' || p.name === 'tip') && (typeof p.value === 'string' || typeof p.value === 'number')) {
      return formatPlanck(String(p.value), decimals, symbol);
    }
    if (typeof p.value === 'boolean') return String(p.value);
    if (typeof p.value === 'object') return JSON.stringify(p.value).slice(0, 50);
    return String(p.value).slice(0, 40);
  }).join(', ');

  return (
    <div className="flex items-start gap-2 py-1.5" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
      <span className="text-xs font-mono shrink-0" style={{ color: 'var(--color-text-tertiary)', minWidth: 20 }}>
        {evt.event_index?.split('-').pop() || ''}
      </span>
      <span className="text-xs font-mono" style={{ color: '#a78bfa', minWidth: 160 }}>
        {evt.module_id}.{evt.event_id}
      </span>
      <span className="text-xs font-mono break-all" style={{ color: 'var(--color-text-secondary)' }}>
        {summary || '—'}
      </span>
    </div>
  );
}

export function ExtrinsicDetailPanel({ hashOrIndex, chain, onClose, onAddressClick }: Props) {
  const [detail, setDetail] = useState<ExtrinsicDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chainConfig = getChain(chain);
  const decimals = chainConfig.tokenDecimals;
  const symbol = chainConfig.tokenSymbol;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchExtrinsicDetail(hashOrIndex, chain)
      .then(data => {
        if (cancelled) return;
        if (!data) setError('Extrinsic not found');
        else setDetail(data);
      })
      .catch(() => { if (!cancelled) setError('Failed to load extrinsic'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [hashOrIndex, chain]);

  // Close on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const { tag: signerTag } = useAddressTag(detail?.account_id || '', chain);
  const signerDisplay = detail?.account_display?.people?.display
    || detail?.account_display?.display
    || signerTag?.tag
    || null;

  // Detect batch/proxy/multisig calls
  const isBatch = detail?.call_module === 'utility' && (detail.call_module_function === 'batch' || detail.call_module_function === 'batch_all' || detail.call_module_function === 'force_batch');
  const isProxy = detail?.call_module === 'proxy' && detail.call_module_function === 'proxy';
  const isMultisig = detail?.call_module === 'multisig' && (detail.call_module_function === 'as_multi' || detail.call_module_function === 'approve_as_multi');

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 90,
        }}
      />
      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: 560,
          backgroundColor: 'var(--color-bg-primary)',
          borderLeft: '1px solid var(--color-border-default)',
          zIndex: 100,
          overflowY: 'auto',
          boxShadow: '-8px 0 24px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--color-border-default)' }}
        >
          <h2
            className="text-sm font-bold"
            style={{ fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--color-text-primary)' }}
          >
            Extrinsic Detail
          </h2>
          <button
            onClick={onClose}
            className="text-lg"
            style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', padding: '0 4px' }}
          >
            &times;
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-4 rounded animate-pulse" style={{ backgroundColor: 'var(--color-bg-tertiary)', width: `${90 - i * 8}%` }} />
              ))}
            </div>
          )}

          {error && (
            <p className="text-sm" style={{ color: 'var(--color-flow-out)' }}>{error}</p>
          )}

          {detail && (
            <>
              {/* Hash */}
              <div>
                <Label>Hash</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs break-all" style={{ color: 'var(--color-text-primary)' }}>
                    {detail.extrinsic_hash}
                  </span>
                  <CopyButton text={detail.extrinsic_hash} />
                  <a
                    href={getExplorerTxUrl(detail.extrinsic_hash, chain)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs"
                    style={{ color: 'var(--color-accent-primary)' }}
                  >
                    {chainConfig.name} &#8599;
                  </a>
                </div>
              </div>

              {/* Block + Time */}
              <div className="flex gap-6">
                <div>
                  <Label>Block</Label>
                  <a
                    href={getExplorerBlockUrl(detail.block_num, chain)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs"
                    style={{ color: 'var(--color-accent-primary)' }}
                  >
                    {formatNumber(detail.block_num)}
                  </a>
                  <span className="text-xs ml-2" style={{ color: 'var(--color-text-tertiary)' }}>
                    Index: {detail.extrinsic_index}
                  </span>
                </div>
                <div>
                  <Label>Time</Label>
                  <span className="font-mono text-xs" style={{ color: 'var(--color-text-primary)' }}>
                    {formatTimestamp(detail.block_timestamp)}
                  </span>
                  <span className="text-xs ml-2" style={{ color: 'var(--color-text-tertiary)' }}>
                    ({timeAgo(detail.block_timestamp)})
                  </span>
                </div>
              </div>

              {/* Status */}
              <div>
                <Label>Status</Label>
                <span className="text-xs font-semibold" style={{ color: detail.success ? 'var(--color-flow-in)' : 'var(--color-flow-out)' }}>
                  {detail.success ? '\u2713 Success' : '\u2717 Failed'}
                </span>
              </div>

              {/* Call */}
              <div
                className="rounded-lg p-4"
                style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)' }}
              >
                <Label>Call</Label>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>
                    {detail.call_module}
                  </span>
                  <span className="font-mono text-xs" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                    {detail.call_module_function}
                  </span>
                  {isProxy && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>Proxy Call</span>}
                  {isMultisig && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>Multisig</span>}
                  {isBatch && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>Batch</span>}
                </div>

                {/* Parameters */}
                {detail.params.length > 0 && (
                  <div className="space-y-3">
                    <Label>Parameters</Label>
                    {detail.params.map((p, i) => (
                      <div key={i} className="flex flex-col gap-1">
                        <span className="text-xs font-mono" style={{ color: '#22d3ee' }}>
                          {p.name}
                          {p.type_name && <span style={{ color: 'var(--color-text-tertiary)' }}> : {p.type_name}</span>}
                        </span>
                        <div className="ml-3">
                          {formatParamValue(p, decimals, symbol, chain, onAddressClick)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Batch inner calls */}
              {isBatch && detail.params.length > 0 && (() => {
                // Extract calls from batch params
                const callsParam = detail.params.find(p => p.name === 'calls');
                const calls = callsParam && Array.isArray(callsParam.value) ? callsParam.value as Array<{ call_module: string; call_module_function: string; params: ExtrinsicParam[] }> : [];
                if (calls.length === 0) return null;
                return (
                  <div
                    className="rounded-lg p-4"
                    style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid rgba(34,211,238,0.25)' }}
                  >
                    <Label>Batch Contents ({calls.length} calls)</Label>
                    <div className="space-y-3 mt-2">
                      {calls.map((call, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-xs font-mono shrink-0" style={{ color: 'var(--color-text-tertiary)', minWidth: 24 }}>
                            {i + 1}.
                          </span>
                          <div>
                            <span className="font-mono text-xs" style={{ color: '#a78bfa' }}>
                              {call.call_module}.{call.call_module_function}
                            </span>
                            {call.params && call.params.length > 0 && (
                              <div className="ml-3 mt-1 space-y-1">
                                {call.params.map((p, j) => (
                                  <div key={j} className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                                    <span style={{ color: '#22d3ee' }}>{p.name}</span>:{' '}
                                    {formatParamValue(p, decimals, symbol, chain, onAddressClick)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Signer */}
              <div>
                <Label>Signer</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  {detail.account_id && (
                    <>
                      <button
                        onClick={() => onAddressClick(detail.account_id)}
                        className="font-mono text-xs"
                        style={{ color: 'var(--color-accent-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        {truncateAddress(detail.account_id, 10, 8)}
                      </button>
                      <CopyButton text={detail.account_id} />
                      {signerDisplay && (
                        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {signerDisplay}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Fee */}
              <div>
                <Label>Fee</Label>
                <span className="font-mono text-xs" style={{ color: 'var(--color-text-primary)' }}>
                  {formatPlanck(detail.fee_used || detail.fee || '0', decimals, symbol)}
                </span>
                {detail.tip && parseFloat(detail.tip) > 0 && (
                  <span className="text-xs ml-2" style={{ color: 'var(--color-text-tertiary)' }}>
                    + tip: {formatPlanck(detail.tip, decimals, symbol)}
                  </span>
                )}
              </div>

              {/* Events */}
              {detail.event.length > 0 && (
                <div>
                  <Label>Events ({detail.event.length})</Label>
                  <div
                    className="rounded-lg p-3 mt-1"
                    style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)' }}
                  >
                    {detail.event.map((evt, i) => (
                      <EventRow key={i} evt={evt} decimals={decimals} symbol={symbol} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs mb-1 uppercase tracking-wider"
      style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-jetbrains), monospace', fontSize: 10 }}
    >
      {children}
    </p>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getWatchlist,
  removeFromWatchlist,
  updateWatchedAddress,
  clearNewActivity,
  requestNotificationPermission,
  sendNotification,
  type WatchedAddress,
} from '@/lib/watchlist';
import { fetchAccountInfo, fetchTransfers } from '@/lib/subscan';
import { fetchEthAccountInfo, fetchEthTransfers } from '@/lib/etherscan';
import { isEthereumChain, getChain } from '@/lib/chains';
import { truncateAddress, timeAgo, formatNumber } from '@/lib/explorer-utils';
import { lookupAddress } from '@/lib/known-addresses';
import { useAddressTag } from '@/hooks/useAddressTag';
import { TagPill } from '@/components/explorer/AddressTag';

interface Props {
  onAddressClick: (address: string, chain: string) => void;
}

const POLL_INTERVAL_MS = 60_000; // 60 seconds
const MAX_POLL_ADDRESSES = 10;

export function WatchlistPanel({ onAddressClick }: Props) {
  const [watchlist, setWatchlist] = useState<WatchedAddress[]>([]);
  const [polling, setPolling] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(() => {
    setWatchlist(getWatchlist());
  }, []);

  useEffect(() => {
    refresh();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, [refresh]);

  const handleRemove = (address: string) => {
    removeFromWatchlist(address);
    refresh();
  };

  const handleEnableNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
  };

  // Poll for new activity
  const pollOnce = useCallback(async () => {
    const list = getWatchlist().slice(0, MAX_POLL_ADDRESSES);
    for (const w of list) {
      try {
        const isEth = isEthereumChain(w.chain);
        const chainConfig = getChain(w.chain);

        if (isEth) {
          const [acct, txRes] = await Promise.all([
            fetchEthAccountInfo(w.address).catch(() => null),
            fetchEthTransfers(w.address, 0, 5).catch(() => ({ transfers: [], count: 0 })),
          ]);
          const latestTx = (txRes.transfers || [])[0];
          const newTxTime = latestTx?.block_timestamp || 0;
          const hasNew = w.lastTxTimestamp && newTxTime > w.lastTxTimestamp;

          updateWatchedAddress(w.address, {
            lastBalance: acct?.balance || w.lastBalance,
            lastTxTimestamp: newTxTime || w.lastTxTimestamp,
            lastCheckedAt: Date.now(),
            newActivity: hasNew || false,
          });

          if (hasNew) {
            const dir = latestTx.from.toLowerCase() === w.address.toLowerCase() ? 'OUT' : 'IN';
            sendNotification(
              'HubSec Explorer',
              `Watched address ${truncateAddress(w.address)} has new activity: Transfer ${dir} ${latestTx.amount} ${chainConfig.tokenSymbol}`,
            );
          }
        } else {
          const [acct, txRes] = await Promise.all([
            fetchAccountInfo(w.address, w.chain).catch(() => null),
            fetchTransfers(w.address, w.chain, 0, 5).catch(() => ({ transfers: [], count: 0 })),
          ]);
          const latestTx = (txRes.transfers || [])[0];
          const newTxTime = latestTx?.block_timestamp || 0;
          const hasNew = w.lastTxTimestamp && newTxTime > w.lastTxTimestamp;

          updateWatchedAddress(w.address, {
            lastBalance: acct?.balance || w.lastBalance,
            lastTxTimestamp: newTxTime || w.lastTxTimestamp,
            lastCheckedAt: Date.now(),
            newActivity: hasNew || false,
          });

          if (hasNew) {
            const dir = latestTx.from.toLowerCase() === w.address.toLowerCase() ? 'OUT' : 'IN';
            const cp = dir === 'OUT' ? latestTx.to : latestTx.from;
            const cpTag = lookupAddress(cp)?.tag;
            sendNotification(
              'HubSec Explorer',
              `Watched address ${truncateAddress(w.address)} has new activity: Transfer ${dir} ${latestTx.amount} ${chainConfig.tokenSymbol}${cpTag ? ` (${cpTag})` : ''}`,
            );
          }
        }
      } catch {
        // Continue with next address
      }
    }
    refresh();
  }, [refresh]);

  const togglePolling = () => {
    if (polling) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      setPolling(false);
    } else {
      pollOnce(); // Initial poll
      pollRef.current = setInterval(pollOnce, POLL_INTERVAL_MS);
      setPolling(true);
    }
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2
          className="text-lg font-bold"
          style={{ fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--color-text-primary)' }}
        >
          Watchlist
        </h2>
        <div className="flex gap-2">
          {notifPermission !== 'granted' && (
            <button
              onClick={handleEnableNotifications}
              className="text-xs px-3 py-1.5 rounded"
              style={{
                color: 'var(--color-accent-primary)',
                border: '1px solid var(--color-accent-border)',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontFamily: 'var(--font-jetbrains), monospace',
              }}
            >
              Enable Notifications
            </button>
          )}
          <button
            onClick={togglePolling}
            className="text-xs px-3 py-1.5 rounded"
            style={{
              color: polling ? '#34d399' : 'var(--color-accent-primary)',
              border: `1px solid ${polling ? 'rgba(52,211,153,0.3)' : 'var(--color-accent-border)'}`,
              backgroundColor: polling ? 'rgba(52,211,153,0.08)' : 'transparent',
              cursor: 'pointer',
              fontFamily: 'var(--font-jetbrains), monospace',
            }}
          >
            {polling ? 'Monitoring (60s)' : 'Start Monitoring'}
          </button>
        </div>
      </div>

      {watchlist.length === 0 ? (
        <div
          className="rounded-lg p-8 text-center"
          style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)' }}
        >
          <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            No addresses in watchlist.
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            Click the Watch button on any account page to add it here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {watchlist.map(w => (
            <WatchlistRow
              key={w.address}
              watched={w}
              onAddressClick={onAddressClick}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      <p className="text-xs mt-4" style={{ color: 'var(--color-text-tertiary)' }}>
        Watchlist is stored in your browser localStorage. Polling checks up to {MAX_POLL_ADDRESSES} addresses every 60 seconds.
        Real-time monitoring with webhook alerts coming in a future update.
      </p>
    </div>
  );
}

/** Individual watchlist row — uses hook for tag resolution */
function WatchlistRow({ watched: w, onAddressClick, onRemove }: {
  watched: WatchedAddress;
  onAddressClick: (address: string, chain: string) => void;
  onRemove: (address: string) => void;
}) {
  const { tag: known } = useAddressTag(w.address, w.chain);
  const chainConfig = getChain(w.chain);

  return (
    <div
      className="rounded-lg px-4 py-3 flex items-center gap-3 flex-wrap"
      style={{
        backgroundColor: w.newActivity ? 'rgba(52,211,153,0.05)' : 'var(--color-bg-secondary)',
        border: `1px solid ${w.newActivity ? 'rgba(52,211,153,0.25)' : 'var(--color-border-default)'}`,
      }}
    >
      {w.newActivity && (
        <span
          className="text-xs px-1.5 py-0.5 rounded shrink-0"
          style={{ backgroundColor: 'rgba(52,211,153,0.15)', color: '#34d399' }}
        >
          New!
        </span>
      )}
      <div className="flex-1 min-w-0">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => { clearNewActivity(w.address); onAddressClick(w.address, w.chain); }}
            className="text-xs font-mono"
            style={{ color: 'var(--color-accent-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {w.label || truncateAddress(w.address, 10, 8)}
          </button>
          {known && <TagPill tag={known.tag} category={known.category} />}
        </span>
        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          {chainConfig.name}
          {w.lastBalance && ` · ${formatNumber(parseFloat(w.lastBalance).toFixed(2))} ${chainConfig.tokenSymbol}`}
          {w.lastTxTimestamp && ` · Last tx: ${timeAgo(w.lastTxTimestamp)}`}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {w.lastCheckedAt && (
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)', fontSize: 10 }}>
            Checked {timeAgo(Math.floor(w.lastCheckedAt / 1000))}
          </span>
        )}
        <button
          onClick={() => onRemove(w.address)}
          className="text-xs px-2 py-1 rounded"
          style={{ color: 'var(--color-flow-out)', border: '1px solid rgba(248,113,113,0.2)', backgroundColor: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-jetbrains), monospace' }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

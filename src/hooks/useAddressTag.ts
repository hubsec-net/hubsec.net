'use client';

import { useQuery } from '@tanstack/react-query';
import {
  lookupStaticDatabase,
  lookupAddress,
  cacheIdentity,
  isDangerousAddress as _isDangerousAddress,
  type KnownAddress,
} from '@/lib/known-addresses';
import { fetchOnChainIdentity } from '@/lib/subscan';
import { isEthereumChain } from '@/lib/chains';

// ── Single Address Hook ─────────────────────────────────────────

/**
 * React hook for 3-layer address tag resolution.
 *
 * Layer 1: Static JSON database (instant, synchronous)
 * Layer 2: On-chain identity via Subscan (async, cached by React Query)
 * Layer 3: Identity cache populated from transfer data (synchronous fallback)
 *
 * Every component that renders an address should use this hook.
 * One source of truth, universal display.
 */
export function useAddressTag(address: string, chain: string, options?: { fetchIdentity?: boolean }): {
  tag: KnownAddress | null;
  isLoading: boolean;
} {
  const fetchIdentity = options?.fetchIdentity ?? false;

  // Layer 1: Static database — instant
  const staticTag = lookupStaticDatabase(address);

  // Layer 2: On-chain identity — async, cached
  // Only enabled when caller explicitly opts in (e.g. main account header).
  // Table rows and list items should NOT fetch — they rely on Layer 1 + 3.
  const isSubstrate = !!chain && !isEthereumChain(chain);
  const needsFetch = fetchIdentity && !staticTag && !!address && isSubstrate;

  const { data: identity, isLoading } = useQuery({
    queryKey: ['identity', address.toLowerCase(), chain],
    queryFn: () => fetchOnChainIdentity(address, chain),
    staleTime: 5 * 60 * 1000,    // 5 minutes
    gcTime: 30 * 60 * 1000,      // Keep in cache 30 minutes
    retry: 1,
    enabled: needsFetch,
  });

  // If static tag exists, return immediately (skip async)
  if (staticTag) {
    return { tag: staticTag, isLoading: false };
  }

  // If async identity resolved, cache it for sync lookups and return
  if (identity?.display) {
    // Side-effect: populate the sync cache so other code benefits
    cacheIdentity(address, identity.display, identity.identity);

    return {
      tag: {
        address: address.toLowerCase(),
        tag: identity.display,
        category: 'identity',
        chain,
        confidence: identity.identity ? 'verified' : 'unconfirmed',
      },
      isLoading: false,
    };
  }

  // Layer 3: Fall back to identity cache (populated from transfer data)
  const cached = lookupAddress(address);
  if (cached) {
    return { tag: cached, isLoading: false };
  }

  return { tag: null, isLoading: needsFetch && isLoading };
}

// ── Bulk Address Hook ───────────────────────────────────────────

/**
 * Resolve tags for multiple addresses at once.
 * Used by components that render lists (graph, tables) where per-item
 * hooks aren't practical at the parent level.
 *
 * Returns a Map<lowercase_address, KnownAddress> for O(1) lookups.
 */
export function useAddressTags(addresses: string[], chain: string): {
  tags: Map<string, KnownAddress>;
  isLoading: boolean;
} {
  // Bulk hook uses Layer 1 (static DB) + Layer 3 (identity cache) only.
  // No async fetching — too many addresses to fetch individually.
  // The identity cache is populated by cacheTransferIdentities() when transfers load.
  const tags = new Map<string, KnownAddress>();

  for (const addr of addresses) {
    const key = addr.toLowerCase();
    if (tags.has(key)) continue;

    // Layer 1: static
    const staticTag = lookupStaticDatabase(addr);
    if (staticTag) {
      tags.set(key, staticTag);
      continue;
    }

    // Layer 3: identity cache
    const cached = lookupAddress(addr);
    if (cached) {
      tags.set(key, cached);
    }
  }

  return { tags, isLoading: false };
}

// ── Re-export helpers for convenience ──

export { isDangerousAddress } from '@/lib/known-addresses';
export type { KnownAddress } from '@/lib/known-addresses';

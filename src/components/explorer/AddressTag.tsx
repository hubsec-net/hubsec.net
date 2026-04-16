'use client';

import { useAddressTag } from '@/hooks/useAddressTag';
import { getCategoryStyle, isDangerousAddress, type AddressCategory } from '@/lib/known-addresses';
import { truncateAddress } from '@/lib/explorer-utils';

interface AddressTagProps {
  address: string;
  chain?: string;
  onClick?: (address: string) => void;
  /** Show truncated address alongside tag */
  showAddress?: boolean;
  /** Truncation params */
  prefixLen?: number;
  suffixLen?: number;
}

const DANGER_CATEGORIES = new Set<AddressCategory>(['scam', 'attacker', 'flagged']);

/**
 * Tag pill that shows a colored category badge if the address is known.
 * Scam/attacker/flagged categories get a warning icon prefix.
 * Design: rounded pill, JetBrains Mono 11px, color-coded by category.
 */
export function TagPill({ tag, category }: { tag: string; category: AddressCategory }) {
  const style = getCategoryStyle(category);
  const isDanger = DANGER_CATEGORIES.has(category);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isDanger ? 3 : 0,
        padding: '2px 8px',
        borderRadius: 999,
        fontFamily: 'var(--font-jetbrains), monospace',
        fontSize: 11,
        lineHeight: '16px',
        backgroundColor: style.bg,
        color: style.text,
        whiteSpace: 'nowrap',
        verticalAlign: 'middle',
        border: isDanger ? `1px solid ${style.text}40` : 'none',
      }}
    >
      {isDanger && <span style={{ fontSize: 10 }}>{'\u26A0'}</span>}
      {tag}
    </span>
  );
}

/**
 * Renders an address as a clickable button with a tag pill if known.
 * Uses useAddressTag hook for 3-layer resolution (static DB → on-chain identity → cache).
 * Used in transaction tables, counterparty lists, etc.
 *
 * Display: "truncated_address  [Tag Pill]" or just "truncated_address"
 */
export function AddressWithTag({
  address,
  chain = '',
  onClick,
  showAddress = true,
  prefixLen = 6,
  suffixLen = 4,
}: AddressTagProps) {
  const { tag: known } = useAddressTag(address, chain);

  const handleClick = onClick ? () => onClick(address) : undefined;
  const isDanger = isDangerousAddress(known ?? undefined);

  if (!known) {
    // No tag — just show truncated address
    return (
      <button
        onClick={handleClick}
        style={{
          color: 'var(--color-text-secondary)',
          background: 'none',
          border: 'none',
          cursor: onClick ? 'pointer' : 'default',
          padding: 0,
          fontFamily: 'var(--font-jetbrains), monospace',
          fontSize: 'inherit',
        }}
        title={address}
      >
        {truncateAddress(address, prefixLen, suffixLen)}
      </button>
    );
  }

  // Known address — show tag pill and optionally the address
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {showAddress && (
        <button
          onClick={handleClick}
          style={{
            color: isDanger ? getCategoryStyle(known.category).text : 'var(--color-text-secondary)',
            background: 'none',
            border: 'none',
            cursor: onClick ? 'pointer' : 'default',
            padding: 0,
            fontFamily: 'var(--font-jetbrains), monospace',
            fontSize: 'inherit',
          }}
          title={address}
        >
          {truncateAddress(address, prefixLen, suffixLen)}
        </button>
      )}
      <button
        onClick={handleClick}
        style={{
          background: 'none',
          border: 'none',
          cursor: onClick ? 'pointer' : 'default',
          padding: 0,
        }}
        title={address}
      >
        <TagPill tag={known.tag} category={known.category} />
      </button>
    </span>
  );
}

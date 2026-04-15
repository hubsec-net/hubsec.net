'use client';

import { truncateAddress } from '@/lib/explorer-utils';
import { lookupAddress, getCategoryColor } from '@/lib/known-addresses';
import { CopyButton } from '@/components/ui/CopyButton';

interface AddressDisplayProps {
  address: string;
  chain?: string;
  truncate?: boolean;
  showCopy?: boolean;
  showTag?: boolean;
  linkToExplorer?: boolean;
  className?: string;
  onClick?: () => void;
}

export function AddressDisplay({
  address,
  truncate = true,
  showCopy = true,
  showTag = true,
  linkToExplorer = false,
  className = '',
  onClick,
}: AddressDisplayProps) {
  const known = showTag ? lookupAddress(address) : undefined;
  const displayText = truncate ? truncateAddress(address) : address;

  const addressEl = (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 'var(--font-size-xs)' }}
    >
      {known && (
        <span
          className="px-1.5 py-0.5 rounded text-xs"
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
            color: getCategoryColor(known.category),
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          {known.tag}
        </span>
      )}
      <span
        title={address}
        style={{ color: 'var(--color-text-secondary)', fontFeatureSettings: '"tnum"' }}
        className={onClick || linkToExplorer ? 'cursor-pointer hover:underline' : ''}
        onClick={onClick}
      >
        {displayText}
      </span>
      {showCopy && <CopyButton text={address} />}
    </span>
  );

  return addressEl;
}

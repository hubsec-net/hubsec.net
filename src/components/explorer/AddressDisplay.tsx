'use client';

import { useAddressTag } from '@/hooks/useAddressTag';
import { truncateAddress } from '@/lib/explorer-utils';
import { TagPill } from './AddressTag';
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
  chain = '',
  truncate = true,
  showCopy = true,
  showTag = true,
  className = '',
  onClick,
}: AddressDisplayProps) {
  const { tag: known } = useAddressTag(address, chain);
  const displayText = truncate ? truncateAddress(address) : address;

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 'var(--font-size-xs)' }}
    >
      <span
        title={address}
        style={{ color: 'var(--color-text-secondary)', fontFeatureSettings: '"tnum"' }}
        className={onClick ? 'cursor-pointer hover:underline' : ''}
        onClick={onClick}
      >
        {displayText}
      </span>
      {showTag && known && <TagPill tag={known.tag} category={known.category} />}
      {showCopy && <CopyButton text={address} />}
    </span>
  );
}

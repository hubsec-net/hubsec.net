'use client';

import { CHAINS, type ChainConfig } from '@/lib/chains';

interface ChainSelectorProps {
  selected: string;
  onChange: (chainId: string) => void;
  className?: string;
}

export function ChainSelector({ selected, onChange, className = '' }: ChainSelectorProps) {
  return (
    <select
      value={selected}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-lg px-3 py-2 text-sm ${className}`}
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border-default)',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-jetbrains), monospace',
        fontSize: 'var(--font-size-xs)',
        cursor: 'pointer',
        outline: 'none',
      }}
    >
      {Object.values(CHAINS).map((chain: ChainConfig) => (
        <option key={chain.id} value={chain.id}>
          {chain.name}
        </option>
      ))}
    </select>
  );
}

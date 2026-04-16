'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { isValidAddress, detectAddressType } from '@/lib/explorer-utils';

export function HomeSearch() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    if (!isValidAddress(trimmed)) {
      setError('Enter a valid Polkadot or Ethereum address to investigate.');
      return;
    }

    setError('');
    const addrType = detectAddressType(trimmed);
    const chain = addrType === 'ethereum' ? 'ethereum' : 'assethub';
    router.push(`/explorer?address=${encodeURIComponent(trimmed)}&chain=${chain}`);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-xl">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={input}
          onChange={e => { setInput(e.target.value); setError(''); }}
          placeholder="Investigate a Polkadot or Ethereum address..."
          className="flex-1 rounded-lg px-4 py-3 text-sm"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: `1px solid ${error ? 'var(--color-flow-out)' : 'var(--color-border-default)'}`,
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-jetbrains), monospace',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          className="px-5 py-3 rounded-lg text-sm font-medium shrink-0"
          style={{
            backgroundColor: 'var(--color-accent-primary)',
            color: 'var(--color-text-inverse)',
            fontFamily: 'var(--font-jetbrains), monospace',
            cursor: 'pointer',
            border: 'none',
          }}
        >
          Explore &rarr;
        </button>
      </div>
      {error && (
        <p className="text-xs mt-2" style={{ color: 'var(--color-flow-out)' }}>{error}</p>
      )}
    </form>
  );
}

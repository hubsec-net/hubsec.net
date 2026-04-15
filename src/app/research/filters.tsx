'use client';

import { useState } from 'react';

const categories = ['All', 'Post-Mortems', 'Vulnerability Research', 'Advisories'];

export function ResearchFilters() {
  const [active, setActive] = useState('All');

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setActive(cat)}
          className="px-3 py-1.5 rounded text-xs transition-colors duration-150"
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            letterSpacing: 'var(--tracking-wide)',
            color: active === cat ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
            backgroundColor: active === cat ? 'var(--color-accent-primary)' : 'transparent',
            border: active === cat ? '1px solid var(--color-accent-primary)' : '1px solid var(--color-border-default)',
            cursor: 'pointer',
          }}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

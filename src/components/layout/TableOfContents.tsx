'use client';

import { useEffect, useState } from 'react';

interface TocItem {
  id: string;
  title: string;
  level: number;
}

interface TableOfContentsProps {
  items: TocItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -80% 0px', threshold: 0 }
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className="toc-sidebar" aria-label="Table of contents">
      <p
        className="text-xs font-semibold uppercase mb-4"
        style={{
          fontFamily: 'var(--font-jetbrains), monospace',
          color: 'var(--color-text-tertiary)',
          letterSpacing: 'var(--tracking-wide)',
        }}
      >
        Contents
      </p>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="block text-sm transition-colors duration-150 leading-snug"
              style={{
                color: activeId === item.id ? 'var(--color-accent-primary)' : 'var(--color-text-tertiary)',
                paddingLeft: item.level > 2 ? `${(item.level - 2) * 12}px` : undefined,
                borderLeft: activeId === item.id ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
                paddingTop: '2px',
                paddingBottom: '2px',
                paddingRight: '4px',
                marginLeft: '-2px',
              }}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

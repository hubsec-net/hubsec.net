'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { NAV_LINKS } from '@/lib/constants';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
      <nav className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="font-mono text-lg font-bold tracking-tight"
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            color: 'var(--color-text-primary)',
          }}
        >
          HubSec
        </Link>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm transition-colors duration-150"
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                color: pathname.startsWith(link.href)
                  ? 'var(--color-accent-primary)'
                  : 'var(--color-text-secondary)',
                letterSpacing: 'var(--tracking-wide)',
                textTransform: 'uppercase' as const,
                fontSize: 'var(--font-size-xs)',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile navigation */}
      {mobileOpen && (
        <div
          className="md:hidden border-t px-6 py-4"
          style={{ borderColor: 'var(--color-border-subtle)', backgroundColor: 'var(--color-bg-secondary)' }}
        >
          <div className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm"
                style={{
                  fontFamily: 'var(--font-jetbrains), monospace',
                  color: pathname.startsWith(link.href)
                    ? 'var(--color-accent-primary)'
                    : 'var(--color-text-secondary)',
                  letterSpacing: 'var(--tracking-wide)',
                  textTransform: 'uppercase' as const,
                  fontSize: 'var(--font-size-xs)',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { NAV_LINKS } from '@/lib/constants';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <header className="border-b relative z-50" style={{ borderColor: 'var(--color-border-subtle)' }}>
      <nav className="mx-auto max-w-6xl px-4 md:px-6 py-4 flex items-center justify-between">
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

        {/* Mobile menu button — 44px minimum touch target */}
        <button
          className="md:hidden flex items-center justify-center"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          style={{
            color: 'var(--color-text-secondary)',
            width: '44px',
            height: '44px',
            marginRight: '-10px',
          }}
          type="button"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile navigation overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-x-0 top-[57px] bottom-0 z-40 border-t"
          style={{
            borderColor: 'var(--color-border-subtle)',
            backgroundColor: 'var(--color-bg-primary)',
          }}
        >
          <div className="flex flex-col px-4 py-6 gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="py-3 px-2 rounded-lg transition-colors duration-150"
                style={{
                  fontFamily: 'var(--font-jetbrains), monospace',
                  color: pathname.startsWith(link.href)
                    ? 'var(--color-accent-primary)'
                    : 'var(--color-text-secondary)',
                  letterSpacing: 'var(--tracking-wide)',
                  textTransform: 'uppercase' as const,
                  fontSize: 'var(--font-size-sm)',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
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

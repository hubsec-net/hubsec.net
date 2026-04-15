'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_LINKS } from '@/lib/constants';

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ pointerEvents: 'none' }}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ pointerEvents: 'none' }}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onNavigate}
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            color: pathname.startsWith(link.href)
              ? 'var(--color-accent-primary)'
              : 'var(--color-text-secondary)',
            letterSpacing: 'var(--tracking-wide)',
            textTransform: 'uppercase' as const,
          }}
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}

function HeaderInner() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const toggle = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const close = useCallback(() => {
    setMobileOpen(false);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <>
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
        <div
          className="hidden md:flex items-center gap-8"
          style={{ fontSize: 'var(--font-size-xs)' }}
        >
          <NavLinks pathname={pathname} />
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden"
          onClick={toggle}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          style={{
            color: 'var(--color-text-secondary)',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '-10px',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: 0,
            position: 'relative',
            zIndex: 60,
          }}
        >
          {mobileOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </nav>

      {/* Mobile navigation overlay */}
      {mobileOpen && (
        <div
          className="md:hidden"
          style={{
            position: 'fixed',
            top: '57px',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40,
            borderTop: '1px solid var(--color-border-subtle)',
            backgroundColor: 'var(--color-bg-primary)',
          }}
        >
          <div
            className="flex flex-col px-4 py-6 gap-1"
            style={{ fontSize: 'var(--font-size-sm)' }}
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                style={{
                  fontFamily: 'var(--font-jetbrains), monospace',
                  color: pathname.startsWith(link.href)
                    ? 'var(--color-accent-primary)'
                    : 'var(--color-text-secondary)',
                  letterSpacing: 'var(--tracking-wide)',
                  textTransform: 'uppercase' as const,
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 8px',
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export function Header() {
  return (
    <header
      style={{
        borderBottom: '1px solid var(--color-border-subtle)',
        position: 'relative',
        zIndex: 50,
      }}
    >
      <Suspense>
        <HeaderInner />
      </Suspense>
    </header>
  );
}

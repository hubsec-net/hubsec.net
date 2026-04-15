import Link from 'next/link';
import { NAV_LINKS } from '@/lib/constants';
import { MobileMenuButton } from './MobileMenu';

export function Header() {
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
                color: 'var(--color-text-secondary)',
                letterSpacing: 'var(--tracking-wide)',
                textTransform: 'uppercase' as const,
                fontSize: 'var(--font-size-xs)',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile menu button — client component, no usePathname */}
        <MobileMenuButton menuId="mobile-nav" />
      </nav>

      {/* Mobile navigation panel — server-rendered, hidden by default, toggled via DOM by MobileMenuButton */}
      <div
        id="mobile-nav"
        className="md:hidden"
        style={{
          display: 'none',
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
        <div className="flex flex-col px-4 py-6 gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-3 px-2 rounded-lg transition-colors duration-150"
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                color: 'var(--color-text-secondary)',
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
    </header>
  );
}

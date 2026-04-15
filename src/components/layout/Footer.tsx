import Link from 'next/link';
import { NAV_LINKS, PGP_FINGERPRINT, DISCLAIMER } from '@/lib/constants';

export function Footer() {
  return (
    <footer
      className="border-t mt-auto"
      style={{ borderColor: 'var(--color-border-subtle)', backgroundColor: 'var(--color-bg-secondary)' }}
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-10 md:py-12">
        <div className="flex flex-col md:flex-row justify-between gap-10 md:gap-8">
          {/* Left column */}
          <div className="flex flex-col gap-4">
            <span
              className="font-bold text-base"
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                color: 'var(--color-text-primary)',
              }}
            >
              HubSec
            </span>
            <p className="text-sm max-w-md" style={{ color: 'var(--color-text-tertiary)' }}>
              Independent security research for the Polkadot ecosystem.
            </p>
            <p
              className="text-xs font-mono break-all"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              PGP: {PGP_FINGERPRINT}
              {' '}
              <Link
                href="/verify"
                className="verify-link underline"
              >
                Verify
              </Link>
            </p>
          </div>

          {/* Right column — links */}
          <div className="flex flex-wrap gap-x-8 gap-y-1 md:gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors duration-150 flex items-center"
                style={{
                  color: 'var(--color-text-secondary)',
                  fontFamily: 'var(--font-jetbrains), monospace',
                  fontSize: 'var(--font-size-xs)',
                  letterSpacing: 'var(--tracking-wide)',
                  textTransform: 'uppercase' as const,
                  minHeight: '44px',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div
          className="mt-8 pt-6 border-t"
          style={{ borderColor: 'var(--color-border-subtle)' }}
        >
          <p className="text-xs leading-relaxed max-w-3xl" style={{ color: 'var(--color-text-tertiary)' }}>
            {DISCLAIMER}
          </p>
        </div>

        {/* Copyright */}
        <div className="mt-6">
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            &copy; {new Date().getFullYear()} HubSec. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

import type { Metadata } from 'next';
import { DISCLAIMER, PGP_FINGERPRINT } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'About',
  description: 'HubSec builds security tools for blockchain teams and security professionals.',
};

export default function AboutPage() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <h1
          className="text-3xl font-bold mb-10"
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            color: 'var(--color-text-primary)',
          }}
        >
          About
        </h1>

        {/* Narrative */}
        <div className="space-y-5 mb-16">
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
            HubSec builds security tools for blockchain teams and security professionals.
            Our tools are used by developers to find vulnerabilities before deployment,
            by security analysts to investigate incidents, and by auditors to generate
            professional reports.
          </p>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
            We started from investigating bridge incidents in the Polkadot ecosystem and
            kept finding the same patterns — insufficient proof validation, shallow
            authorization checks, missing boundary conditions. Different protocols, same
            classes of bugs. So we built tooling to catch them systematically.
          </p>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
            Every incident we analyze feeds back into our detection rules. The Hyperbridge
            case study produced three new Sentinel rules. The vulnerability taxonomy now
            covers 70+ classes across 10 attack surfaces. The goal is systematic: turn
            incident patterns into prevention infrastructure that anyone can run.
          </p>
        </div>

        {/* What we focus on */}
        <div className="mb-16">
          <h2
            className="text-base font-semibold mb-5"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              color: 'var(--color-text-primary)',
            }}
          >
            Focus
          </h2>
          <p className="text-sm mb-5" style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
            Our tools go deep on the Polkadot stack — Substrate runtimes, FRAME
            pallets, ink! contracts, XCM messaging, and the bridge infrastructure
            that connects it all.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              'Substrate',
              'FRAME',
              'ink!',
              'Solidity / PolkaVM',
              'XCM',
              'Bridges',
              'WASM',
            ].map((area) => (
              <span
                key={area}
                className="text-sm px-3 py-1 rounded"
                style={{
                  color: 'var(--color-text-secondary)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border-default)',
                  fontFamily: 'var(--font-jetbrains), monospace',
                }}
              >
                {area}
              </span>
            ))}
          </div>
        </div>

        {/* Independence notice — no card wrapping */}
        <div
          className="mb-16 pl-4"
          style={{ borderLeft: '2px solid var(--color-border-default)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
            Not affiliated with Parity Technologies, Web3 Foundation, or any
            protocol team. Our tools and analysis are independent.
          </p>
          <p
            className="text-xs mt-3"
            style={{
              color: 'var(--color-text-tertiary)',
              fontFamily: 'var(--font-jetbrains), monospace',
            }}
          >
            PGP: {PGP_FINGERPRINT}
          </p>
        </div>

        {/* Disclaimer */}
        <div className="pt-8" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
            {DISCLAIMER}
          </p>
        </div>
      </div>
    </section>
  );
}

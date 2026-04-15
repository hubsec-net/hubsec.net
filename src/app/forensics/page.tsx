import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { ForensicsDemo } from '@/components/forensics/ForensicsDemo';

export const metadata: Metadata = {
  title: 'Forensics',
  description:
    'On-chain investigation and fund tracing for blockchain security incidents. Transaction tracing, wallet intelligence, risk scoring, and cross-chain fund flow analysis.',
  openGraph: {
    title: 'HubSec Forensics',
    description:
      'On-chain investigation and fund tracing for the Polkadot ecosystem.',
    url: 'https://hubsec.net/forensics',
  },
};

export default function ForensicsPage() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* ── HERO ── */}
        <div className="mb-12 max-w-2xl">
          <div className="flex items-center gap-3 mb-5">
            <h1
              className="text-3xl md:text-4xl font-bold"
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                color: 'var(--color-text-primary)',
              }}
            >
              Forensics
            </h1>
            <span
              className="text-xs px-2 py-0.5 rounded self-center"
              style={{
                color: 'var(--color-accent-warm)',
                backgroundColor: 'var(--color-accent-warm-muted)',
                fontFamily: 'var(--font-jetbrains), monospace',
              }}
            >
              In Dev
            </span>
          </div>
          <p
            className="text-base"
            style={{
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-relaxed)',
            }}
          >
            Block explorers show you individual transactions. After an incident,
            that&apos;s not enough. You need to trace funds across dozens of hops,
            profile the attacker&apos;s wallet, figure out if they&apos;re still
            moving money. That&apos;s what this does.
          </p>
        </div>

        {/* ── DEMO — lead with the strongest content ── */}
        <div className="mb-20">
          <ForensicsDemo />
        </div>

        {/* ── CAPABILITIES — two-column with varied content ── */}
        <div className="mb-16">
          <h2
            className="text-base font-semibold mb-6"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              color: 'var(--color-text-primary)',
            }}
          >
            Capabilities
          </h2>

          {/* Primary capabilities — larger */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <h3
                className="text-sm font-semibold mb-2"
                style={{
                  fontFamily: 'var(--font-jetbrains), monospace',
                  color: 'var(--color-accent-primary)',
                }}
              >
                Transaction Tracing
              </h3>
              <p
                className="text-sm"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Decompose any transaction into its full internal call tree.
                Every function call, token transfer, and state change — decoded.
              </p>
            </Card>
            <Card>
              <h3
                className="text-sm font-semibold mb-2"
                style={{
                  fontFamily: 'var(--font-jetbrains), monospace',
                  color: 'var(--color-accent-primary)',
                }}
              >
                Fund Flow Analysis
              </h3>
              <p
                className="text-sm"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Trace funds forward and backward across any number of hops.
                Find consolidation points, distribution patterns, exit strategies.
              </p>
            </Card>
          </div>

          {/* Secondary capabilities — compact list */}
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
            {[
              {
                title: 'Wallet Intelligence',
                description: 'Complete address profiles. Funding sources, interaction history, behavioral fingerprints.',
              },
              {
                title: 'Risk Scoring',
                description: 'Automated assessment based on wallet age, funding origin, behavior patterns, and interaction graph.',
              },
              {
                title: 'Cross-Chain Tracing',
                description: 'Follow funds across Ethereum, Polkadot, AssetHub, parachains, and L2s. Detect bridge hops and mixer usage.',
              },
              {
                title: 'Real-Time Monitoring',
                description: 'Watch addresses and get alerts on fund movements, bridge interactions, or exchange deposits.',
              },
            ].map((cap) => (
              <div key={cap.title} className="py-3" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <h3
                  className="text-sm font-medium mb-1"
                  style={{
                    fontFamily: 'var(--font-jetbrains), monospace',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {cap.title}
                </h3>
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {cap.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── EXPLORER CTA ── */}
        <div
          className="rounded-lg p-8 mb-8"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-accent-border)',
          }}
        >
          <h3
            className="text-sm font-semibold mb-2"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              color: 'var(--color-accent-primary)',
            }}
          >
            Try the free Forensic Explorer
          </h3>
          <p
            className="text-sm mb-4"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}
          >
            Our open investigation tool for Polkadot. Advanced forensics features
            including pattern detection, fund tracing, real-time monitoring, and
            evidence packaging are coming soon.
          </p>
          <Link
            href="/explorer"
            className="inline-block px-5 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
            style={{
              backgroundColor: 'var(--color-accent-primary)',
              color: 'var(--color-text-inverse)',
              fontFamily: 'var(--font-jetbrains), monospace',
            }}
          >
            Open Explorer &rarr;
          </Link>
        </div>

        {/* ── CTA ── */}
        <div
          className="rounded-lg p-8"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border-default)',
          }}
        >
          <p
            className="text-sm mb-4"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Currently in development. Reach out if you need incident response
            support or want early access.
          </p>
          <Link
            href="/contact"
            className="inline-block px-5 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
            style={{
              backgroundColor: 'var(--color-accent-primary)',
              color: 'var(--color-text-inverse)',
              fontFamily: 'var(--font-jetbrains), monospace',
            }}
          >
            Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}

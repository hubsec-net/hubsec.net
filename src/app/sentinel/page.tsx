import type { Metadata } from 'next';
import Link from 'next/link';
import { ArchitectureDiagram } from '@/components/sentinel/ArchitectureDiagram';

export const metadata: Metadata = {
  title: 'Sentinel',
  description: 'Automated security scanning for Polkadot runtimes, smart contracts, and bridge infrastructure. Static analysis, bytecode inspection, and real-time chain monitoring.',
};

const modules = [
  {
    name: 'Knowledge Layer',
    description: '70+ vulnerability classes across 10 attack surfaces, derived from real incidents.',
    detail: 'Structured taxonomy — not a generic CWE list.',
  },
  {
    name: 'Static Analyzer',
    description: 'Source-level scanning for Rust (ink!, FRAME) and Solidity (PolkaVM).',
    detail: 'Pattern matching against known vulnerability classes.',
  },
  {
    name: 'WASM/PolkaVM Analyzer',
    description: 'Bytecode analysis for deployed contracts.',
    detail: 'Catches issues invisible at the source level — compiler artifacts, optimization bugs.',
  },
  {
    name: 'Watchtower',
    description: 'Real-time chain monitoring.',
    detail: 'Watches for anomalous transactions and known attack signatures across parachains.',
  },
  {
    name: 'Hunter',
    description: 'Automated bug bounty probing.',
    detail: 'Systematically tests deployed contracts against the vulnerability taxonomy.',
  },
  {
    name: 'Post-Mortem Engine',
    description: 'Forensic investigation automation.',
    detail: 'Reconstructs attack timelines, traces funds, generates incident reports.',
  },
];

export default function SentinelPage() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-6xl px-6">
        {/* Hero — opinionated, not generic */}
        <div className="mb-16 max-w-2xl">
          <h1
            className="text-3xl md:text-4xl font-bold mb-5"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              color: 'var(--color-text-primary)',
            }}
          >
            Sentinel
          </h1>
          <p
            className="text-base mb-4"
            style={{
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-relaxed)',
            }}
          >
            Manual audits don&apos;t scale. Polkadot has 50+ parachains deploying
            contract and runtime upgrades continuously. You can&apos;t review all
            of them by hand.
          </p>
          <p
            className="text-base"
            style={{
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-relaxed)',
            }}
          >
            Sentinel scans source code, inspects compiled bytecode, and monitors
            live chains — covering pre-deployment through production. Every
            vulnerability pattern we find in a post-mortem becomes a detection rule.
          </p>
        </div>

        {/* Architecture */}
        <div className="mb-20">
          <h2
            className="text-base font-semibold mb-8"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              color: 'var(--color-text-primary)',
            }}
          >
            Architecture
          </h2>
          <ArchitectureDiagram />
        </div>

        {/* Modules — varying treatment */}
        <div className="mb-16">
          <h2
            className="text-base font-semibold mb-6"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              color: 'var(--color-text-primary)',
            }}
          >
            Modules
          </h2>
          <div className="space-y-3">
            {modules.map((mod) => (
              <div
                key={mod.name}
                className="rounded-lg px-5 py-4"
                style={{
                  border: '1px solid var(--color-border-default)',
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                  <h3
                    className="text-sm font-semibold shrink-0"
                    style={{
                      fontFamily: 'var(--font-jetbrains), monospace',
                      color: 'var(--color-accent-primary)',
                    }}
                  >
                    {mod.name}
                  </h3>
                  <span
                    className="text-sm"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {mod.description}
                  </span>
                </div>
                <p
                  className="text-xs mt-1"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {mod.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Forensics link — tighter, not a big card */}
        <div
          className="mb-16 pl-4"
          style={{ borderLeft: '2px solid var(--color-accent-primary)' }}
        >
          <p
            className="text-sm mb-2"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}
          >
            The post-mortem engine and real-time monitors share infrastructure
            with our standalone forensics platform. Investigations feed the
            detection engine; detections inform investigations.
          </p>
          <Link
            href="/forensics"
            className="text-sm"
            style={{
              color: 'var(--color-accent-primary)',
              fontFamily: 'var(--font-jetbrains), monospace',
            }}
          >
            About Forensics &rarr;
          </Link>
        </div>

        {/* Status */}
        <div
          className="rounded-lg p-6"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border-default)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: 'var(--color-accent-warm)' }}
            />
            <span
              className="text-xs font-medium"
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                color: 'var(--color-accent-warm)',
              }}
            >
              In Development
            </span>
          </div>
          <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            First public release targeted for Q1 2027.
          </p>
          <Link
            href="/contact"
            className="text-sm"
            style={{
              color: 'var(--color-accent-primary)',
              fontFamily: 'var(--font-jetbrains), monospace',
            }}
          >
            Interested in early access? Get in touch &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}

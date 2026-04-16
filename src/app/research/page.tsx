import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Research',
  description: 'On-chain forensic case studies and vulnerability analysis produced with HubSec tooling.',
};

export default function ResearchPage() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <h1
          className="text-3xl font-bold mb-2"
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            color: 'var(--color-text-primary)',
          }}
        >
          Research
        </h1>
        <p
          className="text-sm mb-12"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          On-chain forensic case studies and vulnerability analysis.
        </p>

        {/* Standard */}
        <div className="mb-12">
          <h2
            className="text-lg font-semibold mb-4"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              color: 'var(--color-text-primary)',
            }}
          >
            Our Standard
          </h2>
          <div className="space-y-4">
            <p
              style={{
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--leading-relaxed)',
              }}
            >
              Every investigation published here is the product of
              HubSec&apos;s own forensic tools &mdash; not a synthesis of
              external sources, not a recap of public reporting. If we
              didn&apos;t trace it on-chain ourselves, we don&apos;t publish
              it.
            </p>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--leading-relaxed)',
              }}
            >
              This means fewer publications, but every one carries direct
              evidentiary weight: transaction-level tracing, fund flow
              reconstruction, and detection signatures derived from our own
              analysis. Quality over volume.
            </p>
          </div>
        </div>

        {/* What to expect */}
        <div className="mb-12">
          <h2
            className="text-lg font-semibold mb-4"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              color: 'var(--color-text-primary)',
            }}
          >
            What to Expect
          </h2>
          <div className="space-y-4">
            <p
              style={{
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--leading-relaxed)',
              }}
            >
              Each published case study will include:
            </p>
            <ul
              className="ml-6 list-disc space-y-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <li style={{ lineHeight: 'var(--leading-relaxed)' }}>
                Full attack timeline reconstructed from on-chain data
              </li>
              <li style={{ lineHeight: 'var(--leading-relaxed)' }}>
                Fund flow graphs traced through HubSec Forensics
              </li>
              <li style={{ lineHeight: 'var(--leading-relaxed)' }}>
                Detection signatures and Sentinel rule mappings
              </li>
              <li style={{ lineHeight: 'var(--leading-relaxed)' }}>
                Cryptographic verification &mdash; content hashes and PGP
                signatures for every report
              </li>
            </ul>
          </div>
        </div>

        {/* Coming soon */}
        <div
          className="rounded-lg p-8"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border-default)',
          }}
        >
          <p
            className="text-base mb-4"
            style={{
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-relaxed)',
            }}
          >
            Case studies produced using HubSec tooling will be published as our
            platform comes online. Every HubSec investigation is backed by
            direct on-chain forensic analysis, not curated public reporting.
          </p>
          <p
            className="text-sm"
            style={{
              color: 'var(--color-text-tertiary)',
              lineHeight: 'var(--leading-relaxed)',
            }}
          >
            Sign up to be notified when our first tool-backed investigation is
            published &mdash;{' '}
            <Link
              href="/contact"
              style={{ color: 'var(--color-accent-primary)' }}
            >
              contact us
            </Link>
            .
          </p>
        </div>

        {/* Verification link */}
        <div className="mt-12 pt-8" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)', lineHeight: 'var(--leading-relaxed)' }}>
            When reports are published, each will include SHA-256 content hashes
            and detached PGP signatures for independent verification.{' '}
            <Link
              href="/verify"
              style={{ color: 'var(--color-accent-primary)', fontFamily: 'var(--font-jetbrains), monospace' }}
            >
              Learn how verification works &rarr;
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
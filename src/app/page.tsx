import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { getReports } from '@/lib/mdx';
import { formatDate } from '@/lib/utils';

export default async function HomePage() {
  const reports = await getReports();
  const latestReport = reports[0];

  return (
    <>
      {/* ── HERO ── */}
      <section className="pt-20 md:pt-28 pb-16">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h1
            className="font-bold mb-6"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              letterSpacing: 'var(--tracking-tight)',
              color: 'var(--color-text-primary)',
              lineHeight: 1.1,
            }}
          >
            HubSec
          </h1>
          <p
            className="max-w-lg"
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-lg)',
              lineHeight: 'var(--leading-relaxed)',
            }}
          >
            Security tooling for blockchain teams and security professionals.
            Scan, investigate, report.
          </p>
        </div>
      </section>

      {/* ── WHAT WE BUILD ── */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/sentinel"
              className="block rounded-lg p-6"
              style={{
                border: '1px solid var(--color-border-default)',
                transition: 'border-color 0.15s ease',
              }}
            >
              <h3
                className="text-sm font-semibold mb-3"
                style={{
                  fontFamily: 'var(--font-jetbrains), monospace',
                  color: 'var(--color-text-primary)',
                }}
              >
                Sentinel
              </h3>
              <p
                className="text-sm mb-4"
                style={{
                  color: 'var(--color-text-secondary)',
                  lineHeight: 'var(--leading-relaxed)',
                }}
              >
                Automated vulnerability scanner for Substrate runtimes, ink!
                contracts, and Solidity on PolkaVM. CI/CD ready.
              </p>
              <span
                className="text-xs"
                style={{
                  color: 'var(--color-text-tertiary)',
                  fontFamily: 'var(--font-jetbrains), monospace',
                }}
              >
                Learn more &rarr;
              </span>
            </Link>

            <Link
              href="/forensics"
              className="block rounded-lg p-6"
              style={{
                border: '1px solid var(--color-border-default)',
                transition: 'border-color 0.15s ease',
              }}
            >
              <h3
                className="text-sm font-semibold mb-3"
                style={{
                  fontFamily: 'var(--font-jetbrains), monospace',
                  color: 'var(--color-text-primary)',
                }}
              >
                Forensics
              </h3>
              <p
                className="text-sm mb-4"
                style={{
                  color: 'var(--color-text-secondary)',
                  lineHeight: 'var(--leading-relaxed)',
                }}
              >
                On-chain investigation and fund tracing toolkit for incident
                response and threat intelligence.
              </p>
              <span
                className="text-xs"
                style={{
                  color: 'var(--color-text-tertiary)',
                  fontFamily: 'var(--font-jetbrains), monospace',
                }}
              >
                Learn more &rarr;
              </span>
            </Link>

            <Link
              href="/research"
              className="block rounded-lg p-6"
              style={{
                border: '1px solid var(--color-border-default)',
                transition: 'border-color 0.15s ease',
              }}
            >
              <h3
                className="text-sm font-semibold mb-3"
                style={{
                  fontFamily: 'var(--font-jetbrains), monospace',
                  color: 'var(--color-text-primary)',
                }}
              >
                Reports
              </h3>
              <p
                className="text-sm mb-4"
                style={{
                  color: 'var(--color-text-secondary)',
                  lineHeight: 'var(--leading-relaxed)',
                }}
              >
                Professional security report generation from scan results and
                forensic investigations. PDF, Markdown, SARIF.
              </p>
              <span
                className="text-xs"
                style={{
                  color: 'var(--color-text-tertiary)',
                  fontFamily: 'var(--font-jetbrains), monospace',
                }}
              >
                Learn more &rarr;
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CASE STUDIES ── */}
      {latestReport && (
        <section className="pb-20">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <h2
              className="text-lg font-semibold mb-2"
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                color: 'var(--color-text-primary)',
              }}
            >
              Case Studies
            </h2>
            <p
              className="text-sm mb-8"
              style={{
                color: 'var(--color-text-tertiary)',
                lineHeight: 'var(--leading-relaxed)',
              }}
            >
              Real-world analysis produced using HubSec Forensics methodology,
              demonstrating how our tools reconstruct and analyze security incidents.
            </p>
            <Link
              href={`/research/${latestReport.slug}`}
              className="block rounded-lg p-8 md:p-10 group"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border-default)',
                transition: 'border-color 0.15s ease',
              }}
              onMouseEnter={undefined}
            >
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span
                  className="text-xs"
                  style={{
                    color: 'var(--color-text-tertiary)',
                    fontFamily: 'var(--font-jetbrains), monospace',
                  }}
                >
                  {formatDate(latestReport.date)}
                </span>
                <Badge level={latestReport.classification} />
              </div>
              <h3
                className="text-xl md:text-2xl font-bold mb-3"
                style={{
                  fontFamily: 'var(--font-jetbrains), monospace',
                  color: 'var(--color-text-primary)',
                }}
              >
                {latestReport.title}
              </h3>
              <p
                className="text-sm mb-3"
                style={{
                  color: 'var(--color-text-tertiary)',
                  lineHeight: 'var(--leading-relaxed)',
                  fontStyle: 'italic',
                }}
              >
                This analysis was produced using HubSec Forensics methodology,
                demonstrating how our tools reconstruct and analyze security
                incidents.
              </p>
              <p
                className="text-base max-w-2xl mb-6"
                style={{
                  color: 'var(--color-text-secondary)',
                  lineHeight: 'var(--leading-relaxed)',
                }}
              >
                {latestReport.summary}
              </p>
              <span
                className="text-sm"
                style={{
                  color: 'var(--color-accent-primary)',
                  fontFamily: 'var(--font-jetbrains), monospace',
                }}
              >
                Read the full analysis &rarr;
              </span>
            </Link>
          </div>
        </section>
      )}
    </>
  );
}

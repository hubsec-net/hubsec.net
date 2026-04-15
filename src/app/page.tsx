import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { getReports } from '@/lib/mdx';
import { formatDate } from '@/lib/utils';

export default async function HomePage() {
  const reports = await getReports();
  const latestReport = reports[0];
  const olderReports = reports.slice(1, 4);

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
            Independent security research for the Polkadot ecosystem.
            Post-mortems, vulnerability analysis, and on-chain forensics.
          </p>
        </div>
      </section>

      {/* ── FEATURED REPORT ── */}
      {latestReport && (
        <section className="pb-20">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
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
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    color: 'var(--color-accent-warm)',
                    backgroundColor: 'var(--color-accent-warm-muted)',
                    fontFamily: 'var(--font-jetbrains), monospace',
                  }}
                >
                  Latest
                </span>
              </div>
              <h2
                className="text-xl md:text-2xl font-bold mb-3"
                style={{
                  fontFamily: 'var(--font-jetbrains), monospace',
                  color: 'var(--color-text-primary)',
                }}
              >
                {latestReport.title}
              </h2>
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

      {/* ── WHAT WE DO — asymmetric layout ── */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          {/* Research — full width, prominent */}
          <div className="mb-8">
            <Link
              href="/research"
              className="block rounded-lg p-6 md:p-8"
              style={{
                border: '1px solid var(--color-border-default)',
                backgroundColor: 'var(--color-bg-secondary)',
                transition: 'border-color 0.15s ease',
              }}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="flex-1">
                  <h3
                    className="text-lg font-semibold mb-3"
                    style={{
                      fontFamily: 'var(--font-jetbrains), monospace',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    Research
                  </h3>
                  <p
                    className="text-sm max-w-md"
                    style={{
                      color: 'var(--color-text-secondary)',
                      lineHeight: 'var(--leading-relaxed)',
                    }}
                  >
                    We publish post-mortem analysis and vulnerability research.
                    Every report includes technical root cause, fund flow tracing,
                    and actionable detection rules.
                  </p>
                </div>
                {olderReports.length > 0 && (
                  <div className="flex flex-col gap-2 md:text-right shrink-0">
                    {olderReports.map((r) => (
                      <span
                        key={r.slug}
                        className="text-xs"
                        style={{
                          color: 'var(--color-text-tertiary)',
                          fontFamily: 'var(--font-jetbrains), monospace',
                        }}
                      >
                        {r.title}
                      </span>
                    ))}
                    <span
                      className="text-xs mt-1"
                      style={{
                        color: 'var(--color-accent-primary)',
                        fontFamily: 'var(--font-jetbrains), monospace',
                      }}
                    >
                      View all &rarr;
                    </span>
                  </div>
                )}
              </div>
            </Link>
          </div>

          {/* Sentinel + Forensics — side by side, compact */}
          <div className="grid md:grid-cols-2 gap-6">
            <Link
              href="/sentinel"
              className="block rounded-lg p-6"
              style={{
                border: '1px solid var(--color-border-default)',
                transition: 'border-color 0.15s ease',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <h3
                  className="text-sm font-semibold"
                  style={{
                    fontFamily: 'var(--font-jetbrains), monospace',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Sentinel
                </h3>
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
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
                className="text-sm mb-4"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Automated vulnerability scanning for ink!, Solidity, FRAME pallets,
                and deployed WASM bytecode.
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
              <div className="flex items-center gap-2 mb-3">
                <h3
                  className="text-sm font-semibold"
                  style={{
                    fontFamily: 'var(--font-jetbrains), monospace',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Forensics
                </h3>
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
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
                className="text-sm mb-4"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                On-chain investigation tools. Transaction tracing, wallet profiling,
                and cross-chain fund flow analysis.
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
    </>
  );
}

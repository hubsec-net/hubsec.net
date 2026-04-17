import type { Metadata } from 'next';
import { PGP_FINGERPRINT } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Security',
  description: 'Responsible disclosure policy for hubsec.net.',
};

export default function SecurityPage() {
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
          Security
        </h1>
        <p
          className="text-xs mb-10"
          style={{
            color: 'var(--color-text-tertiary)',
            fontFamily: 'var(--font-jetbrains), monospace',
          }}
        >
          Responsible disclosure
        </p>

        <div className="space-y-5 mb-10">
          <p style={pBody}>
            If you discover a vulnerability in HubSec&apos;s website or tools,
            please report it to{' '}
            <a href="mailto:security@hubsec.net" style={linkStyle}>
              security@hubsec.net
            </a>
            . PGP-encrypted reports are preferred.
          </p>
        </div>

        <Section title="What we ask">
          <ul style={ulBody}>
            <li style={liBody}>
              Allow reasonable time for us to investigate and address the issue
              before public disclosure.
            </li>
            <li style={liBody}>
              Do not access, modify, or exfiltrate data belonging to other
              users.
            </li>
            <li style={liBody}>
              Do not perform testing that degrades service availability for
              other users (no DoS, no aggressive scanning).
            </li>
            <li style={liBody}>
              Provide enough detail to reproduce the issue &mdash; affected
              endpoint or page, steps, and expected vs. observed behavior.
            </li>
          </ul>
        </Section>

        <Section title="What we will do">
          <ul style={ulBody}>
            <li style={liBody}>Acknowledge receipt within a reasonable timeframe.</li>
            <li style={liBody}>
              Investigate and, if confirmed, work toward a fix.
            </li>
            <li style={liBody}>
              Credit reporters who wish to be credited, after the fix has
              shipped.
            </li>
          </ul>
        </Section>

        <Section title="Bounty program">
          <p style={pBody}>
            HubSec does not currently operate a paid bug bounty program. We
            appreciate good-faith reports and will credit reporters who request
            credit.
          </p>
        </Section>

        <Section title="PGP">
          <p style={pBody}>
            For sensitive reports, please encrypt with our PGP key.
          </p>
          <p
            className="text-xs"
            style={{
              color: 'var(--color-text-tertiary)',
              fontFamily: 'var(--font-jetbrains), monospace',
              marginBottom: '0.75rem',
            }}
          >
            Fingerprint: {PGP_FINGERPRINT}
          </p>
          <a
            href="/pgp-key.asc"
            className="text-sm"
            style={linkStyle}
          >
            Download PGP key &rarr;
          </a>
        </Section>
      </div>
    </section>
  );
}

const pBody: React.CSSProperties = {
  color: 'var(--color-text-secondary)',
  lineHeight: 'var(--leading-relaxed)',
  marginBottom: '1rem',
};

const ulBody: React.CSSProperties = {
  marginLeft: '1.5rem',
  listStyle: 'disc',
  color: 'var(--color-text-secondary)',
  marginBottom: '1rem',
};

const liBody: React.CSSProperties = {
  lineHeight: 'var(--leading-relaxed)',
  marginBottom: '0.25rem',
};

const linkStyle: React.CSSProperties = {
  color: 'var(--color-accent-primary)',
  fontFamily: 'var(--font-jetbrains), monospace',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2
        className="text-base font-semibold mb-4"
        style={{
          fontFamily: 'var(--font-jetbrains), monospace',
          color: 'var(--color-text-primary)',
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

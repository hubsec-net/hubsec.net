import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms governing use of hubsec.net.',
};

export default function TermsPage() {
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
          Terms of Use
        </h1>
        <p
          className="text-xs mb-10"
          style={{
            color: 'var(--color-text-tertiary)',
            fontFamily: 'var(--font-jetbrains), monospace',
          }}
        >
          Last updated: 2026-04-17
        </p>

        <div className="space-y-5 mb-12">
          <p style={pBody}>
            These terms govern use of hubsec.net. They are written plainly
            because HubSec is a small research operation and the relationship
            between us is correspondingly simple.
          </p>
        </div>

        <Section title="What HubSec provides">
          <ul style={ulBody}>
            <li style={liBody}>
              Security research publications &mdash; investigation reports and
              technical analyses, published under{' '}
              <a href="/research" style={linkStyle}>/research</a>.
            </li>
            <li style={liBody}>
              A blockchain explorer at{' '}
              <a href="/explorer" style={linkStyle}>/explorer</a>. The Explorer
              runs in your browser and queries public on-chain data through
              third-party APIs.
            </li>
            <li style={liBody}>
              A verification system &mdash; SHA-256 content hashes and detached
              PGP signatures &mdash; so readers can independently verify the
              integrity and origin of any published report.
            </li>
          </ul>
          <p style={pBody}>
            All content is provided for informational and educational purposes.
          </p>
        </Section>

        <Section title="Disclaimers">
          <p style={pBody}>
            <strong style={strongStyle}>
              Investigation reports are independent analysis, not official
              determinations.
            </strong>{' '}
            Reports represent HubSec&apos;s analysis based on publicly available
            on-chain data at the time of publication. They are not legal advice,
            financial advice, regulatory determinations, or official incident
            reports from any protocol team.
          </p>
          <p style={pBody}>
            <strong style={strongStyle}>
              The Explorer relies on third-party data.
            </strong>{' '}
            The Explorer queries Etherscan, Subscan, and similar APIs to retrieve
            blockchain data. HubSec does not guarantee the accuracy, completeness,
            or availability of data returned by these third parties.
          </p>
          <p style={pBody}>
            <strong style={strongStyle}>
              Risk scores and address labels are informational signals.
            </strong>{' '}
            HubSec maintains a known-address database of exchanges, bridges,
            attackers, and other categorized addresses. Risk scores are computed
            from this database combined with on-chain heuristics. These are
            informational signals to support your own analysis, not definitive
            classifications. False positives and false negatives are both
            possible.
          </p>
          <p style={pBody}>
            <strong style={strongStyle}>
              HubSec does not provide audits, certifications, or legal opinions.
            </strong>{' '}
            Nothing on this site constitutes a smart contract audit, a
            compliance certification, or a legal opinion. If you need any of
            those, engage an appropriate professional.
          </p>
        </Section>

        <Section title="Intellectual property">
          <p style={pBody}>
            Investigation reports and other written content on hubsec.net are
            copyright HubSec. You may quote, cite, and reference reports with
            attribution. Republication of full reports requires written
            permission.
          </p>
          <p style={pBody}>
            The cryptographic verification artifacts &mdash; content hashes and
            detached PGP signatures &mdash; are published so anyone can verify
            report integrity independently.
          </p>
        </Section>

        <Section title="Acceptable use">
          <p style={pBody}>
            Use the site reasonably. Do not attempt to disrupt the service, do
            not abuse the proxy endpoints to bypass third-party API rate limits,
            and do not use the Explorer to harass or target individuals.
          </p>
        </Section>

        <Section title="Limitation of liability">
          <p style={pBody}>
            HubSec is an early-stage research operation. The site and its tools
            are provided <strong style={strongStyle}>as-is</strong>, without
            warranty of availability, accuracy, or fitness for any particular
            purpose. To the fullest extent permitted by law, HubSec is not liable
            for any losses arising from use of the site, the tools, or reliance
            on the published research.
          </p>
        </Section>

        <Section title="Changes to these terms">
          <p style={pBody}>
            If these terms change, the &ldquo;Last updated&rdquo; date above
            will reflect the change. Continued use of the site after a change
            constitutes acceptance of the revised terms.
          </p>
        </Section>

        <Section title="Contact">
          <p style={pBody}>
            For questions about these terms, email{' '}
            <a href="mailto:security@hubsec.net" style={linkStyle}>
              security@hubsec.net
            </a>
            .
          </p>
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

const strongStyle: React.CSSProperties = {
  color: 'var(--color-text-primary)',
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

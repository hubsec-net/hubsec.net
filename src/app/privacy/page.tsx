import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How HubSec handles data on hubsec.net.',
};

export default function PrivacyPage() {
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
          Privacy Policy
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
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
            This is a description of what hubsec.net does with data, written
            plainly. HubSec is a small research operation, not a SaaS platform.
            The data footprint matches that.
          </p>
        </div>

        <Section title="What we collect">
          <p style={pBody}>
            The site is served by Cloudflare. Standard web server logs (your IP
            address, browser user agent, the pages you request, referring URL,
            timestamps) are recorded by Cloudflare for security and performance
            purposes. HubSec does not maintain its own server logs beyond what
            Cloudflare provides.
          </p>
          <p style={pBody}>
            There are no user accounts. There is no login. We do not collect
            names, emails, or other personal information through the site itself.
          </p>
          <p style={pBody}>
            The contact form on{' '}
            <a href="/contact" style={linkStyle}>/contact</a> collects the name,
            email address, and message you choose to enter. That information is
            used solely to respond to your inquiry. It is not added to any mailing
            list, is not sold, and is not shared with third parties.
          </p>
        </Section>

        <Section title="Cookies and tracking">
          <p style={pBody}>
            HubSec does not set cookies of its own. Cloudflare may set functional
            cookies for security and bot mitigation. We do not run Google
            Analytics, Meta Pixel, Hotjar, Segment, or any third-party analytics
            or marketing tracker. We do not run advertising. We do not track you
            across other sites.
          </p>
        </Section>

        <Section title="The Explorer tool">
          <p style={pBody}>
            The blockchain explorer at{' '}
            <a href="/explorer" style={linkStyle}>/explorer</a> queries public
            blockchain data through third-party APIs (Etherscan for EVM chains,
            Subscan for Polkadot and parachains). These queries are initiated
            from your browser and proxied through hubsec.net to add the API key
            and avoid CORS issues.
          </p>
          <p style={pBody}>
            HubSec does not store the addresses you look up, does not log your
            search history to a database, and does not associate searches with
            any identifier. The third-party APIs receive the address you queried
            and your request metadata as part of normal operation; their privacy
            policies govern their handling of that data.
          </p>
        </Section>

        <Section title="What we do not do">
          <ul style={ulBody}>
            <li style={liBody}>We do not sell data.</li>
            <li style={liBody}>We do not run advertising.</li>
            <li style={liBody}>
              We do not share data with third parties except where required by
              law or where you have explicitly initiated the interaction (e.g.
              the third-party APIs the Explorer queries on your behalf).
            </li>
            <li style={liBody}>We do not track you across other sites.</li>
          </ul>
        </Section>

        <Section title="Data retention">
          <p style={pBody}>
            Cloudflare retains web server logs according to its standard
            retention policy. Contact-form messages are retained for as long as
            needed to handle the inquiry and any reasonable follow-up. No other
            personal data is stored.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p style={pBody}>
            If this policy changes materially, the &ldquo;Last updated&rdquo;
            date at the top will reflect the change. We will not retroactively
            broaden the use of previously collected data without notice.
          </p>
        </Section>

        <Section title="Contact">
          <p style={pBody}>
            For privacy questions, email{' '}
            <a href="mailto:security@hubsec.net" style={linkStyle}>
              security@hubsec.net
            </a>
            . PGP is available; see{' '}
            <a href="/contact" style={linkStyle}>/contact</a> for the key.
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

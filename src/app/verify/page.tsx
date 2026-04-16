import type { Metadata } from 'next';
import Link from 'next/link';
import { PGP_FINGERPRINT } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Verifying Reports',
  description: 'How to independently verify the integrity and authenticity of HubSec research reports using SHA-256 content hashes and PGP signatures.',
};

export default function VerifyPage() {
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
          Verifying Reports
        </h1>

        <div className="space-y-5 mb-14">
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
            Every report published by HubSec includes two cryptographic verification
            mechanisms: a content hash for integrity and a detached PGP signature for
            authenticity. This page explains what they are, why they matter, and how
            to use them.
          </p>
        </div>

        {/* Why This Matters */}
        <div className="mb-14">
          <h2
            className="text-xl font-bold mb-5"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              color: 'var(--color-text-primary)',
            }}
          >
            Why This Matters
          </h2>
          <div className="space-y-4">
            <p style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
              Security research is only valuable if you can trust it hasn&apos;t been
              altered. A post-mortem that gets subtly modified after publication (a
              severity rating changed, a recommendation removed, a finding added
              retroactively) is worse than no report at all, because it creates false
              confidence.
            </p>
            <p style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
              Content hashing and PGP signing solve this. They let you independently
              verify two things: that the report you&apos;re reading is identical to
              what HubSec originally published, and that it was actually published by
              HubSec and not someone else.
            </p>
          </div>
        </div>

        {/* Integrity: Content Hash */}
        <div className="mb-14">
          <h2
            className="text-xl font-bold mb-5"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              color: 'var(--color-text-primary)',
            }}
          >
            Integrity: Content Hash
          </h2>
          <div className="space-y-4 mb-6">
            <p style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
              Every HubSec report displays a SHA-256 content hash in its footer. This
              hash is a cryptographic fingerprint of the report&apos;s source file at
              the time of publication. If even a single character changes, the hash
              will be completely different.
            </p>
          </div>

          <h3
            className="text-base font-semibold mb-4"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              color: 'var(--color-text-primary)',
            }}
          >
            How to Verify
          </h3>
          <p className="mb-4" style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
            Download the report source file and compute the hash yourself. If your
            result matches the hash in the report footer, the content is identical to
            what was originally published.
          </p>

          <div
            className="rounded-lg p-4 mb-4 overflow-x-auto"
            style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)' }}
          >
            <pre style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              <code>{`# Download the report source
curl -O https://hubsec.net/reports/<report-slug>.mdx

# Compute the SHA-256 hash
shasum -a 256 <report-slug>.mdx | awk '{print $1}'

# Compare the output to the hash in the report footer`}</code>
            </pre>
          </div>

          <p className="mb-2" style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
            If the hashes match, the report has not been modified since publication.
            If they don&apos;t, either the report was altered or you&apos;re looking
            at a cached version. Either way,
            contact us at{' '}
            <a href="mailto:security@hubsec.net" style={{ color: 'var(--color-accent-primary)' }}>
              security@hubsec.net
            </a>.
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            On Linux, use <code
              className="px-1.5 py-0.5 rounded text-xs"
              style={{ backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-accent-primary)', fontFamily: 'var(--font-jetbrains), monospace' }}
            >sha256sum</code> instead
            of <code
              className="px-1.5 py-0.5 rounded text-xs"
              style={{ backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-accent-primary)', fontFamily: 'var(--font-jetbrains), monospace' }}
            >shasum -a 256</code>. Same output.
          </p>
        </div>

        {/* Authenticity: PGP Signature */}
        <div className="mb-14">
          <h2
            className="text-xl font-bold mb-5"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              color: 'var(--color-text-primary)',
            }}
          >
            Authenticity: PGP Signature
          </h2>
          <div className="space-y-4 mb-6">
            <p style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
              The content hash proves the report hasn&apos;t changed, but not who
              published it. Someone could create a fake report, hash it, and claim
              it&apos;s from HubSec. PGP signatures solve this.
            </p>
            <p style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
              Every report is accompanied by a detached PGP signature file, created
              using HubSec&apos;s private key. Anyone can verify the signature using
              our public key.
            </p>
          </div>

          {/* Step 1 */}
          <h3
            className="text-base font-semibold mb-4"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              color: 'var(--color-text-primary)',
            }}
          >
            Step 1: Import HubSec&apos;s Public Key
          </h3>
          <p className="text-sm mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
            One-time setup.
          </p>

          <div
            className="rounded-lg p-4 mb-4 overflow-x-auto"
            style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)' }}
          >
            <pre style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              <code>{`curl https://hubsec.net/pgp-key.asc | gpg --import`}</code>
            </pre>
          </div>

          <p className="mb-2" style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
            You should see:
          </p>
          <div
            className="rounded-lg p-4 mb-4 overflow-x-auto"
            style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)' }}
          >
            <pre style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              <code>{`gpg: key [KEY_ID]: public key "HubSec <security@hubsec.net>" imported`}</code>
            </pre>
          </div>

          <p className="mb-8" style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
            Verify the fingerprint matches what&apos;s displayed in our site footer
            and on this page. If it doesn&apos;t, do not trust the key. Contact us
            through an independent channel.
          </p>

          {/* Step 2 */}
          <h3
            className="text-base font-semibold mb-4"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              color: 'var(--color-text-primary)',
            }}
          >
            Step 2: Download the Report and Signature
          </h3>

          <div
            className="rounded-lg p-4 mb-8 overflow-x-auto"
            style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)' }}
          >
            <pre style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              <code>{`# Download the report source
curl -O https://hubsec.net/reports/<report-slug>.mdx

# Download the detached signature
curl -O https://hubsec.net/signatures/<report-slug>.sig`}</code>
            </pre>
          </div>

          {/* Step 3 */}
          <h3
            className="text-base font-semibold mb-4"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              color: 'var(--color-text-primary)',
            }}
          >
            Step 3: Verify
          </h3>

          <div
            className="rounded-lg p-4 mb-4 overflow-x-auto"
            style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)' }}
          >
            <pre style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              <code>{`gpg --verify <report-slug>.sig <report-slug>.mdx`}</code>
            </pre>
          </div>

          <p className="mb-2" style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
            If authentic and unmodified:
          </p>
          <div
            className="rounded-lg p-4 mb-4 overflow-x-auto"
            style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)' }}
          >
            <pre style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              <code>{`gpg: Signature made [date]
gpg: using RSA key [KEY_ID]
gpg: Good signature from "HubSec <security@hubsec.net>"`}</code>
            </pre>
          </div>

          <p className="mb-4" style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
            &ldquo;Good signature&rdquo; means two things: the report was signed by
            HubSec&apos;s private key (authenticity), and the report has not been
            modified since signing (integrity).
          </p>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
            If you see{' '}
            <code
              className="px-1.5 py-0.5 rounded text-sm"
              style={{ backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-severity-critical)', fontFamily: 'var(--font-jetbrains), monospace' }}
            >BAD signature</code>,
            the file has been tampered with. Do not trust it.
          </p>
        </div>

        {/* Without GPG */}
        <div className="mb-14">
          <h3
            className="text-base font-semibold mb-4"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              color: 'var(--color-text-primary)',
            }}
          >
            Without GPG Installed
          </h3>
          <p className="mb-4" style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
            If you don&apos;t have GPG and don&apos;t want to install it, the content
            hash alone still gives you integrity verification. SHA-256 hashes can be
            computed with built-in OS utilities:
          </p>
          <div className="space-y-2 mb-2">
            {[
              { platform: 'macOS / Linux', cmd: 'shasum -a 256 filename' },
              { platform: 'Windows PowerShell', cmd: 'Get-FileHash filename -Algorithm SHA256' },
            ].map((item) => (
              <div key={item.platform} className="flex items-baseline gap-3">
                <span className="text-sm shrink-0" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-jetbrains), monospace' }}>
                  {item.platform}:
                </span>
                <code
                  className="px-1.5 py-0.5 rounded text-sm"
                  style={{ backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-accent-primary)', fontFamily: 'var(--font-jetbrains), monospace' }}
                >
                  {item.cmd}
                </code>
              </div>
            ))}
          </div>
          <p className="text-sm mt-3" style={{ color: 'var(--color-text-tertiary)' }}>
            For maximum security, use a local tool rather than uploading report files
            to third-party websites.
          </p>
        </div>

        {/* PGP Key Info */}
        <div
          className="mb-14 p-5 rounded-lg"
          style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)' }}
        >
          <h2
            className="text-base font-semibold mb-4"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              color: 'var(--color-text-primary)',
            }}
          >
            HubSec&apos;s PGP Key
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-xs uppercase block mb-1" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-jetbrains), monospace', letterSpacing: 'var(--tracking-wide)' }}>
                Fingerprint
              </span>
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-jetbrains), monospace' }}>
                {PGP_FINGERPRINT}
              </span>
            </div>
            <div>
              <span className="text-xs uppercase block mb-1" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-jetbrains), monospace', letterSpacing: 'var(--tracking-wide)' }}>
                Download
              </span>
              <a
                href="/pgp-key.asc"
                className="text-sm"
                style={{ color: 'var(--color-accent-primary)', fontFamily: 'var(--font-jetbrains), monospace' }}
              >
                hubsec.net/pgp-key.asc
              </a>
            </div>
            <div>
              <span className="text-xs uppercase block mb-1" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-jetbrains), monospace', letterSpacing: 'var(--tracking-wide)' }}>
                Email
              </span>
              <a
                href="mailto:security@hubsec.net"
                className="text-sm"
                style={{ color: 'var(--color-accent-primary)', fontFamily: 'var(--font-jetbrains), monospace' }}
              >
                security@hubsec.net
              </a>
            </div>
          </div>
          <p className="text-sm mt-4" style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
            If you need to send us sensitive information (vulnerability disclosures,
            incident details, confidential correspondence), encrypt your message with
            this public key. Only HubSec can decrypt it.
          </p>
          <div
            className="rounded-lg p-4 mt-4 overflow-x-auto"
            style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border-subtle)' }}
          >
            <pre style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              <code>{`# Encrypt a message to HubSec
gpg --armor --encrypt --recipient security@hubsec.net your-message.txt
# Send the resulting your-message.txt.asc file`}</code>
            </pre>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-14">
          <h2
            className="text-xl font-bold mb-6"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              color: 'var(--color-text-primary)',
            }}
          >
            Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'Why not just use HTTPS?',
                a: 'HTTPS protects data in transit. It ensures nobody intercepts the report between our server and your browser. But it doesn\'t protect against modification at the source. If our hosting provider is compromised, or if someone gains access to our deployment pipeline, HTTPS would faithfully serve the tampered content. Content hashing and PGP signing protect against that scenario.',
              },
              {
                q: 'What if I get a "key not found" error?',
                a: 'You need to import our public key first (Step 1 above). If you\'ve already imported it and still get errors, the key may have expired. Check our website for an updated key.',
              },
              {
                q: 'What if the key has been revoked?',
                a: 'If our key is ever compromised, we will revoke it and publish a new one. GPG will warn you if you try to verify with a revoked key. Check our website for the current key and re-import.',
              },
              {
                q: 'Do you sign every report?',
                a: 'Yes. Every post-mortem, vulnerability advisory, and research publication is hashed and signed before deployment. If a report on our site does not have a content hash and signature, treat it as unverified and contact us.',
              },
            ].map((item) => (
              <div key={item.q}>
                <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  {item.q}
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Back link */}
        <div className="pt-8" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
          <Link
            href="/research"
            className="text-sm"
            style={{ color: 'var(--color-accent-primary)', fontFamily: 'var(--font-jetbrains), monospace' }}
          >
            &larr; Back to research
          </Link>
        </div>
      </div>
    </section>
  );
}

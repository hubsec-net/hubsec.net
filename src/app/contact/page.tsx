import type { Metadata } from 'next';
import { PGP_FINGERPRINT } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact HubSec for security research inquiries, responsible disclosure, or early access to Sentinel.',
};

export default function ContactPage() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-3xl px-6">
        <h1
          className="text-3xl font-bold mb-6"
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            color: 'var(--color-text-primary)',
          }}
        >
          Contact
        </h1>

        <div className="space-y-8">
          {/* Secure contact info */}
          <div
            className="p-6 rounded-lg"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border-default)',
            }}
          >
            <h2
              className="text-sm font-semibold mb-4"
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                color: 'var(--color-text-primary)',
              }}
            >
              Secure Contact
            </h2>
            <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              For responsible disclosure, use PGP.
            </p>
            <div className="mb-3">
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Email:{' '}
              </span>
              <a
                href="mailto:security@hubsec.net"
                className="text-sm"
                style={{
                  color: 'var(--color-accent-primary)',
                  fontFamily: 'var(--font-jetbrains), monospace',
                }}
              >
                security@hubsec.net
              </a>
            </div>
            <div>
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                PGP Fingerprint:{' '}
              </span>
              <span
                className="text-sm"
                style={{
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-jetbrains), monospace',
                }}
              >
                {PGP_FINGERPRINT}
              </span>
            </div>
            <div className="mt-3">
              <a
                href="/pgp-key.asc"
                className="text-sm"
                style={{
                  color: 'var(--color-accent-primary)',
                  fontFamily: 'var(--font-jetbrains), monospace',
                }}
              >
                Download PGP key &rarr;
              </a>
            </div>
          </div>

          {/* Contact form */}
          <div>
            <h2
              className="text-sm font-semibold mb-6"
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                color: 'var(--color-text-primary)',
              }}
            >
              Send a Message
            </h2>
            <form className="space-y-4" action="#" method="POST">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm mb-1"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-4 py-2 rounded-lg text-sm outline-none transition-colors duration-150"
                  style={{
                    backgroundColor: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border-default)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm mb-1"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-2 rounded-lg text-sm outline-none transition-colors duration-150"
                  style={{
                    backgroundColor: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border-default)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm mb-1"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  className="w-full px-4 py-2 rounded-lg text-sm outline-none resize-y transition-colors duration-150"
                  style={{
                    backgroundColor: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border-default)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
                style={{
                  backgroundColor: 'var(--color-accent-primary)',
                  color: 'var(--color-text-inverse)',
                  fontFamily: 'var(--font-jetbrains), monospace',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Send
              </button>
            </form>
          </div>

          {/* Warrant Canary */}
          <div
            className="mt-8 p-6 rounded-lg"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border-default)',
            }}
          >
            <h2
              className="text-sm font-semibold mb-3"
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                color: 'var(--color-text-primary)',
              }}
            >
              Warrant Canary
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              HubSec has not received any National Security Letters, FISA orders,
              or classified requests for user information or source code.
            </p>
            <p
              className="text-xs mt-3"
              style={{
                color: 'var(--color-text-tertiary)',
                fontFamily: 'var(--font-jetbrains), monospace',
              }}
            >
              Last updated: 2026-04-14
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

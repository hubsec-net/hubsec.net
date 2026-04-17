'use client';

import Link from 'next/link';
import { type KnownAddress, type AddressCategory } from '@/lib/known-addresses';

interface ScamWarningBannerProps {
  knownAddress: KnownAddress;
}

const CATEGORY_LABEL: Partial<Record<AddressCategory, string>> = {
  scam: 'SCAM',
  attacker: 'EXPLOIT ATTACKER',
  flagged: 'FLAGGED',
};

const SCAM_TYPE_LABEL: Record<string, string> = {
  phishing: 'Phishing',
  impersonation: 'Impersonation',
  rug_pull: 'Rug Pull',
  fake_airdrop: 'Fake Airdrop',
  ponzi: 'Ponzi Scheme',
  other: 'Other',
};

/**
 * Prominent red warning banner for scam, attacker, and flagged addresses.
 * Shows report source, date, description, and loss estimates when available.
 */
export function ScamWarningBanner({ knownAddress: ka }: ScamWarningBannerProps) {
  const isScam = ka.category === 'scam';
  const isAttacker = ka.category === 'attacker';
  const isFlagged = ka.category === 'flagged';

  if (!isScam && !isAttacker && !isFlagged) return null;

  const label = CATEGORY_LABEL[ka.category] || 'WARNING';
  const borderColor = isScam ? '#dc2626' : isAttacker ? '#ef4444' : '#f87171';
  const bgColor = isScam ? 'rgba(220,38,38,0.08)' : isAttacker ? 'rgba(239,68,68,0.06)' : 'rgba(248,113,113,0.05)';

  return (
    <div
      className="rounded-lg overflow-hidden mb-4"
      style={{
        border: `2px solid ${borderColor}`,
        backgroundColor: bgColor,
      }}
    >
      {/* Header stripe */}
      <div
        className="px-4 py-2 flex items-center gap-2"
        style={{
          backgroundColor: `${borderColor}18`,
          borderBottom: `1px solid ${borderColor}40`,
        }}
      >
        <span style={{ fontSize: 16 }}>{'\u26A0'}</span>
        <span
          className="text-xs font-bold tracking-wide"
          style={{
            color: borderColor,
            fontFamily: 'var(--font-jetbrains), monospace',
            letterSpacing: '0.05em',
          }}
        >
          WARNING: This address has been reported as {isScam ? 'a scam' : isAttacker ? 'an exploit attacker' : 'suspicious'}
        </span>
        {ka.scamType && (
          <span
            className="text-xs px-2 py-0.5 rounded-full ml-auto"
            style={{
              backgroundColor: `${borderColor}20`,
              color: borderColor,
              border: `1px solid ${borderColor}40`,
              fontFamily: 'var(--font-jetbrains), monospace',
            }}
          >
            {SCAM_TYPE_LABEL[ka.scamType] || ka.scamType}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="px-4 py-3 space-y-2">
        {/* Source + date line */}
        {(ka.reportSource || ka.reportedDate) && (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-jetbrains), monospace' }}>
            {ka.reportSource && (
              <>
                <span style={{ color: 'var(--color-text-secondary)' }}>Source:</span>
                {ka.reportUrl ? (
                  <a
                    href={ka.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: borderColor }}
                  >
                    {ka.reportSource}
                  </a>
                ) : (
                  <span>{ka.reportSource}</span>
                )}
              </>
            )}
            {ka.reportSource && ka.reportedDate && (
              <span style={{ color: 'var(--color-border-default)' }}>|</span>
            )}
            {ka.reportedDate && (
              <>
                <span style={{ color: 'var(--color-text-secondary)' }}>Date:</span>
                <span>{ka.reportedDate}</span>
              </>
            )}
          </div>
        )}

        {/* Report description */}
        {ka.reportDescription && (
          <div className="text-xs" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-jetbrains), monospace', lineHeight: 1.5 }}>
            <span style={{ color: 'var(--color-text-tertiary)' }}>Report: </span>
            &ldquo;{ka.reportDescription}&rdquo;
          </div>
        )}

        {/* Description (general) — show if no reportDescription */}
        {!ka.reportDescription && ka.description && (
          <div className="text-xs" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-jetbrains), monospace' }}>
            {ka.description}
          </div>
        )}

        {/* Loss + victim estimates */}
        {(ka.totalLossEstimate || ka.totalVictimsEstimate) && (
          <div className="flex items-center gap-4 text-xs" style={{ fontFamily: 'var(--font-jetbrains), monospace' }}>
            {ka.totalLossEstimate && (
              <span>
                <span style={{ color: 'var(--color-text-tertiary)' }}>Est. losses: </span>
                <span style={{ color: borderColor, fontWeight: 600 }}>{ka.totalLossEstimate}</span>
              </span>
            )}
            {ka.totalVictimsEstimate && (
              <span>
                <span style={{ color: 'var(--color-text-tertiary)' }}>Est. victims: </span>
                <span style={{ color: borderColor, fontWeight: 600 }}>{ka.totalVictimsEstimate.toLocaleString()}</span>
              </span>
            )}
          </div>
        )}

        {/* Prominent report CTA — internal HubSec investigation */}
        {ka.reportUrl && ka.reportUrl.startsWith('/') && (
          <div
            className="mt-2 pt-2 text-xs"
            style={{
              borderTop: `1px solid ${borderColor}30`,
              fontFamily: 'var(--font-jetbrains), monospace',
            }}
          >
            <Link
              href={ka.reportUrl}
              style={{
                color: borderColor,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Read full investigation &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

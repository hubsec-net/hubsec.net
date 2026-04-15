export const SITE_NAME = 'HubSec';
export const SITE_DOMAIN = 'hubsec.net';
export const SITE_TAGLINE = 'Polkadot Security Intelligence';
export const SITE_DESCRIPTION = 'Independent security research for the Polkadot ecosystem. Post-mortems, vulnerability analysis, and on-chain forensics.';

export const DISCLAIMER = 'HubSec Forensics provides on-chain intelligence and evidence packaging. Attribution analysis produces probabilistic assessments, not definitive identification. Timezone estimates, behavioral profiles, and entity resolution are investigative leads, not proof of identity. HubSec does not access off-chain personal data, IP addresses, or exchange KYC records. For identity confirmation and legal action, engage qualified legal counsel and law enforcement with the evidence package HubSec provides.';

export const PGP_FINGERPRINT = '1027 0DFF 53E0 B61F 809F  C079 E0E6 BF50 4785 0199';

export const NAV_LINKS = [
  { label: 'Research', href: '/research' },
  { label: 'Sentinel', href: '/sentinel' },
  { label: 'Forensics', href: '/forensics' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const;

export const SEVERITY_COLORS: Record<string, string> = {
  critical: 'var(--color-severity-critical)',
  high: 'var(--color-severity-high)',
  medium: 'var(--color-severity-medium)',
  low: 'var(--color-severity-low)',
  info: 'var(--color-severity-info)',
};

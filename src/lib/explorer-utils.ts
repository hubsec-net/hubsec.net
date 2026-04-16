// Base58 alphabet used by SS58
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE58_SET = new Set(BASE58_ALPHABET);

/** Check if input is a valid Ethereum address (0x + 40 hex chars) */
export function isEthereumAddress(input: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/i.test(input);
}

/** Check if input is a valid SS58 substrate address */
export function isSubstrateAddress(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  // Hex public key: 0x-prefixed, 64 hex chars (32 bytes)
  if (/^0x[0-9a-fA-F]{64}$/.test(input)) return true;
  // SS58: must be valid base58 characters, 46-48 chars long
  if (input.length < 46 || input.length > 48) return false;
  for (const ch of input) {
    if (!BASE58_SET.has(ch)) return false;
  }
  return true;
}

/** Validate any address format (Ethereum or Substrate) */
export function isValidAddress(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  return isEthereumAddress(input) || isSubstrateAddress(input);
}

/** Detect address type from format */
export function detectAddressType(input: string): 'ethereum' | 'substrate' | 'unknown' {
  if (isEthereumAddress(input)) return 'ethereum';
  if (isSubstrateAddress(input)) return 'substrate';
  return 'unknown';
}

/**
 * Normalize address input. For hex keys, returns as-is since we can't
 * do SS58 encoding without the crypto library. For SS58, passes through.
 * For Ethereum, passes through as-is (lowercase).
 */
export function toSS58(input: string, _prefix: number = 0): string | null {
  if (!isValidAddress(input)) return null;
  if (isEthereumAddress(input)) return input.toLowerCase();
  return input;
}

/** Truncate an address for inline display: 15kUt2i1...7VGDeMwz */
export function truncateAddress(address: string, startLen = 8, endLen = 8): string {
  if (address.length <= startLen + endLen + 3) return address;
  return `${address.slice(0, startLen)}...${address.slice(-endLen)}`;
}

/** Format a token amount with full precision, trimming trailing zeros */
export function formatTokenAmount(
  rawAmount: string | number,
  decimals: number,
  symbol?: string,
): string {
  const num = typeof rawAmount === 'string' ? parseFloat(rawAmount) : rawAmount;
  if (isNaN(num)) return '0';

  const formatted = num.toFixed(decimals).replace(/\.?0+$/, '');
  return symbol ? `${formatted} ${symbol}` : formatted;
}

/** Format a large number with commas */
export function formatNumber(n: number | string): string {
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US');
}

/** Format a Unix timestamp to relative time */
export function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/** Format a Unix timestamp to absolute date string */
export function formatTimestamp(timestamp: number): string {
  const d = new Date(timestamp * 1000);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/** Calculate days since a timestamp */
export function daysSince(timestamp: number): number {
  return Math.floor((Date.now() / 1000 - timestamp) / 86400);
}

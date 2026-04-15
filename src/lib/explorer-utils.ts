import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';
import { hexToU8a, isHex } from '@polkadot/util';

/** Validate an SS58 address or hex public key */
export function isValidAddress(input: string): boolean {
  try {
    if (isHex(input) && input.length === 66) {
      // 0x-prefixed 32-byte public key
      decodeAddress(encodeAddress(hexToU8a(input)));
      return true;
    }
    decodeAddress(input);
    return true;
  } catch {
    return false;
  }
}

/** Convert any valid input to SS58 with a given prefix */
export function toSS58(input: string, prefix: number = 0): string | null {
  try {
    if (isHex(input) && input.length === 66) {
      return encodeAddress(hexToU8a(input), prefix);
    }
    const decoded = decodeAddress(input);
    return encodeAddress(decoded, prefix);
  } catch {
    return null;
  }
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

  // Already in human-readable form from Subscan
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

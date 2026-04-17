import type { Transfer } from './subscan';
import {
  lookupAddress,
  lookupStaticDatabase,
  isDangerousAddress,
  type AddressCategory,
} from './known-addresses';
import { daysSince } from './explorer-utils';

export interface RiskFactor {
  name: string;
  score: number;
  description: string;
}

export interface RiskScore {
  overall: number;
  factors: RiskFactor[];
}

const CRITICAL_OVERRIDE_LABELS: Partial<Record<AddressCategory, string>> = {
  attacker: 'Confirmed exploit attacker',
  scam: 'Confirmed scam address',
  flagged: 'Flagged as suspicious',
};

/**
 * Critical override: if the address is tagged in the static known-addresses DB
 * as attacker / scam / flagged, risk is 100/100 regardless of transfer-derived
 * signals. Any other risk factors are suppressed — the categorical tag is the
 * final word.
 */
function criticalOverride(address: string | undefined): RiskScore | null {
  if (!address) return null;
  const known = lookupStaticDatabase(address);
  if (!known || !isDangerousAddress(known)) return null;

  const label = CRITICAL_OVERRIDE_LABELS[known.category] ?? 'Dangerous address';
  const description = known.reportDescription
    || known.description
    || `${label} — see known-addresses database.`;

  return {
    overall: 100,
    factors: [{
      name: label,
      score: 100,
      description,
    }],
  };
}

export function computeRiskScore(
  transfers: Transfer[],
  balance: string,
  firstSeen: number | null,
  address?: string,
): RiskScore {
  // Categorical override wins over every transfer-derived signal.
  const override = criticalOverride(address);
  if (override) return override;

  const factors: RiskFactor[] = [];

  if (transfers.length === 0) {
    return { overall: 0, factors: [] };
  }

  // Factor 1: Account age vs activity volume
  if (firstSeen) {
    const ageDays = daysSince(firstSeen);
    const totalVolume = transfers.reduce(
      (sum, t) => sum + parseFloat(t.amount || '0'),
      0,
    );
    const avgDailyVolume = totalVolume / Math.max(ageDays, 1);

    if (ageDays < 30 && avgDailyVolume > 1000) {
      factors.push({
        name: 'New account, high volume',
        score: 20,
        description: `Account is ${ageDays} days old with avg daily volume of ${avgDailyVolume.toFixed(0)}`,
      });
    } else if (ageDays < 7 && transfers.length > 20) {
      factors.push({
        name: 'Very new account, high activity',
        score: 15,
        description: `Account is ${ageDays} days old with ${transfers.length} transactions`,
      });
    }
  }

  // Factor 2: High counterparty dispersion (sending to many unique addresses)
  const outgoing = transfers.filter(t => t.from !== t.to);
  const uniqueRecipients = new Set(outgoing.map(t => t.to)).size;
  if (uniqueRecipients > 50) {
    factors.push({
      name: 'High recipient dispersion',
      score: 15,
      description: `Sent to ${uniqueRecipients} unique addresses`,
    });
  } else if (uniqueRecipients > 20) {
    factors.push({
      name: 'Moderate recipient dispersion',
      score: 8,
      description: `Sent to ${uniqueRecipients} unique addresses`,
    });
  }

  // Factor 3: Round number transfers
  const significantTransfers = transfers.filter(
    t => parseFloat(t.amount || '0') > 0,
  );
  if (significantTransfers.length > 10) {
    const roundCount = significantTransfers.filter(t => {
      const amt = parseFloat(t.amount);
      return amt >= 100 && amt % 100 === 0;
    }).length;
    const ratio = roundCount / significantTransfers.length;
    if (ratio > 0.5) {
      factors.push({
        name: 'High ratio of round-number transfers',
        score: 10,
        description: `${(ratio * 100).toFixed(0)}% of transfers are exact round numbers`,
      });
    }
  }

  // Factor 4: Rapid outflows after large inflow
  const sortedByTime = [...transfers].sort(
    (a, b) => a.block_timestamp - b.block_timestamp,
  );
  for (let i = 0; i < sortedByTime.length - 3; i++) {
    const t = sortedByTime[i];
    const inAmount = parseFloat(t.amount || '0');
    if (inAmount < 100) continue;

    // Check for 3+ outflows within 10 minutes of this inflow
    const windowEnd = t.block_timestamp + 600;
    const nearbyOuts = sortedByTime
      .slice(i + 1)
      .filter(
        tx =>
          tx.block_timestamp <= windowEnd &&
          tx.from === t.to &&
          parseFloat(tx.amount || '0') > 0,
      );
    if (nearbyOuts.length >= 3) {
      factors.push({
        name: 'Rapid outflows after large inflow',
        score: 15,
        description: `${nearbyOuts.length} outflows within 10 minutes of a ${inAmount.toFixed(0)} inflow`,
      });
      break; // Only count once
    }
  }

  // Factor 5: No interaction with known addresses
  const hasKnownInteraction = transfers.some(
    t => lookupAddress(t.from) || lookupAddress(t.to),
  );
  if (!hasKnownInteraction && transfers.length > 20) {
    factors.push({
      name: 'No known address interactions',
      score: 5,
      description: 'No transactions with any known/tagged addresses',
    });
  }

  // Factor 6: Empty balance with high historical volume
  const bal = parseFloat(balance || '0');
  const totalHistorical = transfers.reduce(
    (s, t) => s + parseFloat(t.amount || '0'),
    0,
  );
  if (bal < 1 && totalHistorical > 10000) {
    factors.push({
      name: 'Drained account',
      score: 10,
      description: `Balance near zero but ${totalHistorical.toFixed(0)} in historical volume`,
    });
  }

  const overall = Math.min(100, factors.reduce((sum, f) => sum + f.score, 0));
  return { overall, factors };
}

export function getRiskColor(score: number): string {
  if (score <= 25) return 'var(--color-risk-low)';
  if (score <= 50) return 'var(--color-risk-medium)';
  if (score <= 75) return 'var(--color-risk-high)';
  return 'var(--color-risk-critical)';
}

export function getRiskLabel(score: number): string {
  if (score <= 25) return 'Low';
  if (score <= 50) return 'Medium';
  if (score <= 75) return 'High';
  return 'Critical';
}

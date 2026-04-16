import type { Transfer } from './subscan';

export interface SimilarityHeuristic {
  type: 'same_funder' | 'same_destination' | 'temporal_cluster' | 'round_trip' | 'dust_link';
  label: string;
  description: string;
  score: number; // 0-100 confidence
  addresses: string[];
  evidence: string;
}

/**
 * Analyze transfers for an address and find potentially associated addresses
 * using forensic heuristics:
 * 1. Same funding source — addresses funded by the same parent
 * 2. Same destination — addresses that send to the same target
 * 3. Temporal correlation — addresses active in tight time windows with the target
 * 4. Round-trip detection — funds that flow out and back through intermediaries
 * 5. Dust linking — tiny amounts sent to link addresses for tracking
 */
export function findSimilarAddresses(
  targetAddress: string,
  transfers: Transfer[],
): SimilarityHeuristic[] {
  const results: SimilarityHeuristic[] = [];
  const addr = targetAddress.toLowerCase();

  if (transfers.length === 0) return results;

  // Build directional maps
  const inbound = transfers.filter(t => t.to.toLowerCase() === addr);
  const outbound = transfers.filter(t => t.from.toLowerCase() === addr);

  // ── 1. Same Funding Source ──
  // If this address received funds from addresses that also funded other addresses,
  // those other addresses may be related (same owner using a hub wallet).
  const funders = new Map<string, { amount: number; timestamps: number[] }>();
  for (const t of inbound) {
    const from = t.from.toLowerCase();
    if (from === addr) continue;
    const existing = funders.get(from) || { amount: 0, timestamps: [] };
    existing.amount += parseFloat(t.amount || '0');
    existing.timestamps.push(t.block_timestamp);
    funders.set(from, existing);
  }

  // Find addresses that also received from our funders (by looking at outbound from target)
  // This is limited to what we can see from the target's transactions
  const fundedByTarget = new Map<string, { amount: number; count: number; timestamps: number[] }>();
  for (const t of outbound) {
    const to = t.to.toLowerCase();
    if (to === addr) continue;
    const existing = fundedByTarget.get(to) || { amount: 0, count: 0, timestamps: [] };
    existing.amount += parseFloat(t.amount || '0');
    existing.count++;
    existing.timestamps.push(t.block_timestamp);
    fundedByTarget.set(to, existing);
  }

  // Addresses that both funded the target AND received from the target (bidirectional)
  for (const [funder, funderData] of funders) {
    if (fundedByTarget.has(funder)) {
      const recipData = fundedByTarget.get(funder)!;
      const totalVolume = funderData.amount + recipData.amount;
      if (totalVolume > 0) {
        results.push({
          type: 'same_funder',
          label: 'Bidirectional Funding',
          description: 'This address both sends to and receives from the same counterparty — may indicate shared control or circular fund movement.',
          score: Math.min(85, 50 + Math.floor(Math.log10(totalVolume + 1) * 10)),
          addresses: [funder],
          evidence: `${funderData.amount.toFixed(4)} received, ${recipData.amount.toFixed(4)} sent (${funderData.timestamps.length + recipData.count} txs)`,
        });
      }
    }
  }

  // ── 2. Same Destination Detection ──
  // Addresses that received funds from the target that also interact with the same set of counterparties
  // Group outbound by destination, find destinations receiving many separate transfers
  const destGroups = new Map<string, { totalAmount: number; count: number; timestamps: number[] }>();
  for (const t of outbound) {
    const to = t.to.toLowerCase();
    if (to === addr) continue;
    const existing = destGroups.get(to) || { totalAmount: 0, count: 0, timestamps: [] };
    existing.totalAmount += parseFloat(t.amount || '0');
    existing.count++;
    existing.timestamps.push(t.block_timestamp);
    destGroups.set(to, existing);
  }

  // Find "fan-out" patterns: target sends to many addresses in bursts
  const fanOutTargets = Array.from(destGroups.entries())
    .filter(([, d]) => d.count >= 3)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  if (fanOutTargets.length >= 2) {
    results.push({
      type: 'same_destination',
      label: 'Distribution Pattern',
      description: 'This address distributes funds to multiple addresses repeatedly — may indicate a distribution wallet or payroll-like pattern.',
      score: Math.min(75, 40 + fanOutTargets.length * 8),
      addresses: fanOutTargets.map(([a]) => a),
      evidence: `${fanOutTargets.length} addresses each received 3+ transfers from this account`,
    });
  }

  // ── 3. Temporal Clustering ──
  // Find addresses that transact with the target in tight time windows (within 5 min)
  const TEMPORAL_WINDOW = 300; // 5 minutes
  const temporalPairs = new Map<string, { count: number; windows: number[] }>();

  // Sort transfers by time
  const sortedTransfers = [...transfers].sort((a, b) => a.block_timestamp - b.block_timestamp);

  for (let i = 0; i < sortedTransfers.length; i++) {
    const t1 = sortedTransfers[i];
    const cp1 = t1.from.toLowerCase() === addr ? t1.to.toLowerCase() : t1.from.toLowerCase();

    for (let j = i + 1; j < sortedTransfers.length; j++) {
      const t2 = sortedTransfers[j];
      if (t2.block_timestamp - t1.block_timestamp > TEMPORAL_WINDOW) break;

      const cp2 = t2.from.toLowerCase() === addr ? t2.to.toLowerCase() : t2.from.toLowerCase();
      if (cp1 === cp2 || cp1 === addr || cp2 === addr) continue;

      // These two counterparties transacted with target within 5 min of each other
      const key = [cp1, cp2].sort().join(':');
      const existing = temporalPairs.get(key) || { count: 0, windows: [] };
      existing.count++;
      existing.windows.push(t1.block_timestamp);
      temporalPairs.set(key, existing);
    }
  }

  // Temporal pairs that appear multiple times are suspicious
  const significantPairs = Array.from(temporalPairs.entries())
    .filter(([, d]) => d.count >= 3)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  for (const [pairKey, data] of significantPairs) {
    const [a1, a2] = pairKey.split(':');
    results.push({
      type: 'temporal_cluster',
      label: 'Temporal Correlation',
      description: 'Two counterparties repeatedly transact with this address within 5-minute windows — may indicate coordinated activity or bot behavior.',
      score: Math.min(80, 45 + data.count * 5),
      addresses: [a1, a2],
      evidence: `${data.count} co-occurrences within 5-min windows`,
    });
  }

  // ── 4. Round-Trip Detection ──
  // Find patterns: target → X → ... → target (funds leaving and returning)
  // We can only detect direct round trips: target → X → target
  const roundTrips: Array<{ intermediary: string; outAmount: number; inAmount: number; timeDelta: number }> = [];

  for (const out of outbound) {
    const intermediary = out.to.toLowerCase();
    if (intermediary === addr) continue;

    // Find return transfers from this intermediary
    for (const inp of inbound) {
      if (inp.from.toLowerCase() !== intermediary) continue;
      // Return must be after the outgoing transfer and within 24 hours
      const timeDelta = inp.block_timestamp - out.block_timestamp;
      if (timeDelta > 0 && timeDelta < 86400) {
        const outAmt = parseFloat(out.amount || '0');
        const inAmt = parseFloat(inp.amount || '0');
        // Return amount should be similar (within 20% minus fees)
        if (outAmt > 0 && inAmt > 0 && inAmt >= outAmt * 0.7 && inAmt <= outAmt * 1.1) {
          roundTrips.push({
            intermediary,
            outAmount: outAmt,
            inAmount: inAmt,
            timeDelta,
          });
          break; // One match per outbound is enough
        }
      }
    }
  }

  // Group round trips by intermediary
  const rtByIntermediary = new Map<string, typeof roundTrips>();
  for (const rt of roundTrips) {
    const existing = rtByIntermediary.get(rt.intermediary) || [];
    existing.push(rt);
    rtByIntermediary.set(rt.intermediary, existing);
  }

  for (const [intermediary, trips] of rtByIntermediary) {
    if (trips.length >= 1) {
      const totalOut = trips.reduce((s, t) => s + t.outAmount, 0);
      const totalIn = trips.reduce((s, t) => s + t.inAmount, 0);
      const avgTimeDelta = trips.reduce((s, t) => s + t.timeDelta, 0) / trips.length;
      const hours = Math.round(avgTimeDelta / 3600 * 10) / 10;
      results.push({
        type: 'round_trip',
        label: 'Round-Trip Funds',
        description: 'Funds sent to an address returned within 24 hours at similar amounts — may indicate wash trading, mixing, or temporary parking.',
        score: Math.min(90, 55 + trips.length * 10),
        addresses: [intermediary],
        evidence: `${trips.length} round-trip(s): ${totalOut.toFixed(4)} out → ${totalIn.toFixed(4)} back, avg ${hours}h`,
      });
    }
  }

  // ── 5. Dust Linking ──
  // Tiny amounts (< 0.001 native) sent to many addresses — may be used to link/track addresses
  const DUST_THRESHOLD = 0.001;
  const dustRecipients: string[] = [];
  const dustSenders: string[] = [];

  for (const t of outbound) {
    const amount = parseFloat(t.amount || '0');
    if (amount > 0 && amount < DUST_THRESHOLD) {
      dustRecipients.push(t.to.toLowerCase());
    }
  }

  for (const t of inbound) {
    const amount = parseFloat(t.amount || '0');
    if (amount > 0 && amount < DUST_THRESHOLD) {
      dustSenders.push(t.from.toLowerCase());
    }
  }

  if (dustRecipients.length >= 3) {
    const unique = [...new Set(dustRecipients)];
    results.push({
      type: 'dust_link',
      label: 'Dust Output Pattern',
      description: 'This address sent dust amounts (<0.001) to multiple addresses — may indicate address linking/tracking or spam distribution.',
      score: Math.min(70, 35 + unique.length * 5),
      addresses: unique.slice(0, 10),
      evidence: `${dustRecipients.length} dust sends to ${unique.length} unique addresses`,
    });
  }

  if (dustSenders.length >= 3) {
    const unique = [...new Set(dustSenders)];
    results.push({
      type: 'dust_link',
      label: 'Dust Input Pattern',
      description: 'This address received dust amounts (<0.001) from multiple senders — may indicate dusting attack or address discovery attempt.',
      score: Math.min(65, 30 + unique.length * 5),
      addresses: unique.slice(0, 10),
      evidence: `${dustSenders.length} dust receives from ${unique.length} unique addresses`,
    });
  }

  // Sort by confidence score descending
  results.sort((a, b) => b.score - a.score);

  return results;
}

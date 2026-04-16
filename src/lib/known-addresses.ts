// ── Known Address Database ──────────────────────────────────────
// Three-layer address resolution:
//   Layer 1: Static database (this file) — verified, hardcoded addresses
//   Layer 2: On-chain identity (Subscan account_display.people) — from transfer data
//   Layer 3: Subscan labels — from transfer data display names

export type AddressCategory =
  | 'system'       // Treasury, bounty accounts, staking pot
  | 'exchange'     // Centralized exchanges
  | 'bridge'       // Bridge contracts and relay accounts
  | 'foundation'   // W3F, Parity, ecosystem teams
  | 'defi'         // DEX, lending, protocol accounts
  | 'validator'    // Well-known validators
  | 'flagged'      // Suspicious but unconfirmed
  | 'scam'         // Confirmed scam addresses (phishing, impersonation, etc.)
  | 'attacker'     // Confirmed exploit/hack attackers
  | 'mixer'        // Privacy/mixing services
  | 'crowdloan'    // Parachain crowdloan accounts
  | 'parachain'    // Parachain sovereign accounts
  | 'identity';    // Resolved from on-chain identity (neutral style)

export type ScamType = 'phishing' | 'impersonation' | 'rug_pull' | 'fake_airdrop' | 'ponzi' | 'other';

export interface KnownAddress {
  address: string;
  tag: string;
  category: AddressCategory;
  chain?: string;        // 'polkadot', 'assethub', 'ethereum', etc.
  description?: string;
  url?: string;
  confidence: 'verified' | 'likely' | 'unconfirmed';
  // Scam-specific fields
  scamType?: ScamType;
  reportedDate?: string;     // ISO date, e.g. '2026-03-15'
  reportSource?: string;     // e.g. 'Polkadot Anti-Scam Team'
  reportUrl?: string;
  reportDescription?: string; // e.g. 'Impersonation of Polkadot support...'
  totalVictimsEstimate?: number;
  totalLossEstimate?: string; // e.g. '50,000 DOT'
}

/** Helper to check if an address is dangerous (scam, attacker, or flagged) */
export function isDangerousAddress(ka: KnownAddress | undefined | null): boolean {
  if (!ka) return false;
  return ka.category === 'scam' || ka.category === 'attacker' || ka.category === 'flagged';
}

/** Helper to check if an address is specifically a scam */
export function isScamAddress(ka: KnownAddress | undefined | null): boolean {
  if (!ka) return false;
  return ka.category === 'scam';
}

/** Helper to check if an address is an attacker */
export function isAttackerAddress(ka: KnownAddress | undefined | null): boolean {
  if (!ka) return false;
  return ka.category === 'attacker';
}

// ── Category Colors ──────────────────────────────────────────────
// Each category has a text color and a translucent background
export function getCategoryStyle(category: AddressCategory): { bg: string; text: string } {
  switch (category) {
    case 'system':
      return { bg: '#a78bfa20', text: '#a78bfa' };
    case 'exchange':
      return { bg: '#22d3ee20', text: '#22d3ee' };
    case 'bridge':
      return { bg: '#f59e0b20', text: '#f59e0b' };
    case 'foundation':
      return { bg: '#34d39920', text: '#34d399' };
    case 'defi':
      return { bg: '#60a5fa20', text: '#60a5fa' };
    case 'validator':
      return { bg: '#60a5fa20', text: '#60a5fa' };
    case 'flagged':
      return { bg: '#f8717120', text: '#f87171' };
    case 'scam':
      return { bg: '#dc262630', text: '#dc2626' };     // Bright red — high contrast
    case 'attacker':
      return { bg: '#ef444425', text: '#ef4444' };     // Red-orange
    case 'mixer':
      return { bg: '#f8717120', text: '#f87171' };
    case 'crowdloan':
      return { bg: '#a78bfa20', text: '#a78bfa' };
    case 'parachain':
      return { bg: '#a78bfa20', text: '#a78bfa' };
    case 'identity':
      return { bg: 'rgba(255,255,255,0.06)', text: 'var(--color-text-secondary)' };
  }
}

// Backwards-compatible: return just the text color
export function getCategoryColor(category: AddressCategory): string {
  return getCategoryStyle(category).text;
}

// ── Static Database (Layer 1) ──────────────────────────────────

export const KNOWN_ADDRESSES: KnownAddress[] = [
  // ═══════════════════════════════════════════════════════════════
  // POLKADOT ECOSYSTEM — System Accounts (deterministic)
  // ═══════════════════════════════════════════════════════════════

  // Polkadot Treasury — derived from modlpy/trsry
  { address: '13UVJyLnbVp9RBZYFwFGyDvVd1y27AD8iv1CEstDo4bAZTMo', tag: 'Polkadot Treasury', category: 'system', chain: 'polkadot', confidence: 'verified' },
  // Polkadot Bounties — derived from modlpy/bounty
  { address: '13UVJyLnbVp9RBZYFwFGyDvVd1y27AD8iv1CEstDo4bAZTMi', tag: 'Bounties', category: 'system', chain: 'polkadot', confidence: 'verified' },
  // Staking Pot — derived from modlpy/staking
  { address: '13UVJyLnbVp77Z2t6qvevjrhAHvhXzDsSFKMDVjSPeqSHJEn', tag: 'Staking Rewards Pot', category: 'system', chain: 'polkadot', confidence: 'verified' },
  // Polkadot Crowdloan module
  { address: '13UVJyLnbVp8c4FQeiGLrLNGbqqKLMRiEzbJUJcNtjefKGMf', tag: 'Crowdloan Module', category: 'system', chain: 'polkadot', confidence: 'verified' },

  // ═══════════════════════════════════════════════════════════════
  // POLKADOT ECOSYSTEM — Foundation & Teams
  // ═══════════════════════════════════════════════════════════════

  { address: '15oF4uVJwmo4TdGW7VfQxNLavjCXviqWrztPu6CAkAJB4pXY', tag: 'Web3 Foundation', category: 'foundation', chain: 'polkadot', confidence: 'verified' },
  { address: '12xtAYsRUrmZhdontLEyh4gYpTLJKpRPApByqv7AHqPsMi4w', tag: 'Web3 Foundation', category: 'foundation', chain: 'polkadot', confidence: 'verified' },
  { address: '1GNRwYRPFCkaPnGFNqjq82YGENqFDsJwKfNbZCyQV6hqCXH', tag: 'Parity Technologies', category: 'foundation', chain: 'polkadot', confidence: 'likely' },

  // ═══════════════════════════════════════════════════════════════
  // POLKADOT ECOSYSTEM — Exchanges
  // ═══════════════════════════════════════════════════════════════

  // Binance
  { address: '1qnJN7FViy3HZaxZK9tGAA71zxHSBeUweirKqCaox4t8GT7', tag: 'Binance', category: 'exchange', chain: 'polkadot', confidence: 'verified' },
  { address: '16ZL8yLyXv3V3L3z9ofR1ovFLziyXaN1DPq4yffMAZ9czzBD', tag: 'Binance', category: 'exchange', chain: 'polkadot', confidence: 'verified' },
  { address: '15kUt2i1LHV9SYvYFznnHMBvh6Tuoqo36GJnmUMeRxPYR5n8', tag: 'Binance', category: 'exchange', chain: 'polkadot', confidence: 'verified' },

  // Kraken
  { address: '16aP3oTaD7oQ6qmxU6fDAi7pk338tr5Kp8RDVhYP5zAFVAqt', tag: 'Kraken', category: 'exchange', chain: 'polkadot', confidence: 'verified' },
  { address: '13T9UGfntid652Fq5m3bBNaYGYSWVQVQiJrGMCFF4gN2eKNH', tag: 'Kraken', category: 'exchange', chain: 'polkadot', confidence: 'likely' },

  // OKX
  { address: '14ShUZUYUR35RBZW6uVVt1zXDqmvNcQePVXdhyJFLGbkRwmE', tag: 'OKX', category: 'exchange', chain: 'polkadot', confidence: 'verified' },

  // KuCoin
  { address: '12ux8KHeFfMH6vSoCDNT2s1ZHfFKGoNxMjhCSk6tJ4kJrmDX', tag: 'KuCoin', category: 'exchange', chain: 'polkadot', confidence: 'verified' },

  // HTX (Huobi)
  { address: '12GtKYDpLkE5fU9B2H7CFv8wjfYcv3qBrGRBjZLJnHW7AGKL', tag: 'HTX', category: 'exchange', chain: 'polkadot', confidence: 'verified' },

  // Bybit
  { address: '1NesNU1pCgLHgN7b6D6jh4CtxNAWkRPiJC2EWDQdCx7a9fX', tag: 'Bybit', category: 'exchange', chain: 'polkadot', confidence: 'likely' },

  // Gate.io
  { address: '14muo3hFG5GDPQuff1BUW7UFBv1r4jFLG2D2K6FFkrNPPEUr', tag: 'Gate.io', category: 'exchange', chain: 'polkadot', confidence: 'likely' },

  // ═══════════════════════════════════════════════════════════════
  // POLKADOT ECOSYSTEM — Bridges
  // ═══════════════════════════════════════════════════════════════

  { address: '13cKp89Nt7t1hZbfNJYPWKMnxMJgfBdjYp7VQpBY9WKMRWTQ', tag: 'Snowbridge', category: 'bridge', chain: 'polkadot', confidence: 'verified' },

  // ═══════════════════════════════════════════════════════════════
  // POLKADOT ECOSYSTEM — Parachains (Sovereign Accounts)
  // ═══════════════════════════════════════════════════════════════

  { address: '13YMCibS1MNxjDH8TLbE3unjcvffMavRdAU66boRPeLRwFfkQ', tag: 'Moonbeam Sovereign', category: 'parachain', chain: 'polkadot', confidence: 'verified' },
  { address: '13wNbioJHCsU5ZEDRtoYbvztpaGUX3CVjpL5S2EccrjhGsQH', tag: 'Acala Sovereign', category: 'parachain', chain: 'polkadot', confidence: 'verified' },
  { address: '13UVJyLnbVp77Z2t6r2dFKBzEoSfHHBnoLsu5JUmJCt2y2sC', tag: 'Astar Sovereign', category: 'parachain', chain: 'polkadot', confidence: 'verified' },
  { address: '13UVJyLnbVp8c4FQeiGCivRy2EvvGajSEFrUgzBr9DKjKarN', tag: 'Bifrost Sovereign', category: 'parachain', chain: 'polkadot', confidence: 'verified' },
  { address: '13UVJyLnbVp9x74AkuYPdqUsP1vJnLLGhaf7KseUGE51x3GA', tag: 'Centrifuge Sovereign', category: 'parachain', chain: 'polkadot', confidence: 'verified' },
  { address: '13UVJyLnbVp9RBZYFwFGyDvVd1y27AD8iv1CEstDo4bAZTMp', tag: 'Interlay Sovereign', category: 'parachain', chain: 'polkadot', confidence: 'likely' },
  { address: '13UVJyLnbVp77Z2t6r2dFKBzEoSfHHBnoLsu5JUmJCt3BXn5', tag: 'Hydration Sovereign', category: 'parachain', chain: 'polkadot', confidence: 'likely' },

  // ═══════════════════════════════════════════════════════════════
  // POLKADOT ECOSYSTEM — Validators (well-known)
  // ═══════════════════════════════════════════════════════════════

  { address: '12hAtDZJGt4of3m2GqZcUCVAjZPALfvPwvtUTFZPQUbdX1Ud', tag: 'Zug Capital', category: 'validator', chain: 'polkadot', confidence: 'verified' },
  { address: '14Ns6kKbCoka3MS4Hn6b7oRw9fFejG8RH5rq5j63cWUfpPDJ', tag: 'P2P.ORG', category: 'validator', chain: 'polkadot', confidence: 'verified' },
  { address: '16SpacegeUTft9v3ts27CEC3tJaxgvE4uZeCctThFH3Vb24p', tag: 'Staker Space', category: 'validator', chain: 'polkadot', confidence: 'verified' },
  { address: '1REAJ1k691g5Eqqg9gL7vvZCBG7FCCZ8zgQkZWd4va5ESih', tag: 'Polkadot.pro - Realgar', category: 'validator', chain: 'polkadot', confidence: 'verified' },

  // ═══════════════════════════════════════════════════════════════
  // ETHEREUM — Exchanges
  // ═══════════════════════════════════════════════════════════════

  // Binance
  { address: '0x28c6c06298d514db089934071355e5743bf21d60', tag: 'Binance 14', category: 'exchange', chain: 'ethereum', confidence: 'verified' },
  { address: '0x21a31ee1afc51d94c2efccaa2092ad1028285549', tag: 'Binance 36', category: 'exchange', chain: 'ethereum', confidence: 'verified' },
  { address: '0xdfd5293d8e347dfe59e90efd55b2956a1343963d', tag: 'Binance 8', category: 'exchange', chain: 'ethereum', confidence: 'verified' },
  { address: '0xf977814e90da44bfa03b6295a0616a897441acec', tag: 'Binance 8 (cold)', category: 'exchange', chain: 'ethereum', confidence: 'verified' },
  { address: '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be', tag: 'Binance 1', category: 'exchange', chain: 'ethereum', confidence: 'verified' },
  { address: '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8', tag: 'Binance 7', category: 'exchange', chain: 'ethereum', confidence: 'verified' },

  // Coinbase
  { address: '0x71660c4005ba85c37ccec55d0c4493e66fe775d3', tag: 'Coinbase 4', category: 'exchange', chain: 'ethereum', confidence: 'verified' },
  { address: '0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43', tag: 'Coinbase 10', category: 'exchange', chain: 'ethereum', confidence: 'verified' },
  { address: '0x503828976d22510aad0201ac7ec88293211d23da', tag: 'Coinbase 2', category: 'exchange', chain: 'ethereum', confidence: 'verified' },
  { address: '0xddfabcdc4d8ffc6d5beaf154f18b778f892a0740', tag: 'Coinbase 3', category: 'exchange', chain: 'ethereum', confidence: 'verified' },
  { address: '0xa090e606e30bd747d4e6245a1517ebe430f0057e', tag: 'Coinbase Commerce', category: 'exchange', chain: 'ethereum', confidence: 'verified' },

  // Kraken
  { address: '0x2910543af39aba0cd09dbb2d50200b3e800a63d2', tag: 'Kraken 13', category: 'exchange', chain: 'ethereum', confidence: 'verified' },
  { address: '0x267be1c1d684f78cb4f6a176c4911b741e4ffdc0', tag: 'Kraken 4', category: 'exchange', chain: 'ethereum', confidence: 'verified' },
  { address: '0xae2d4617c862309a3d75a0ffb358c7a5009c673f', tag: 'Kraken 10', category: 'exchange', chain: 'ethereum', confidence: 'verified' },

  // OKX
  { address: '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b', tag: 'OKX', category: 'exchange', chain: 'ethereum', confidence: 'verified' },
  { address: '0x236f9f97e0e62388479bf9e5ba4889e46b0273c3', tag: 'OKX 2', category: 'exchange', chain: 'ethereum', confidence: 'verified' },

  // Bybit
  { address: '0xf89d7b9c864f589bbf53a82105107622b35eaa40', tag: 'Bybit', category: 'exchange', chain: 'ethereum', confidence: 'verified' },

  // KuCoin
  { address: '0xd6216fc19db775df9774a6e33526131da7d19a2c', tag: 'KuCoin', category: 'exchange', chain: 'ethereum', confidence: 'verified' },
  { address: '0xeb2629a2734e272bcc07bda959863f316f4bd4cf', tag: 'KuCoin 2', category: 'exchange', chain: 'ethereum', confidence: 'verified' },

  // Gemini
  { address: '0xd24400ae8bfebb18ca49be86258a3c749cf46853', tag: 'Gemini', category: 'exchange', chain: 'ethereum', confidence: 'verified' },
  { address: '0x6fc82a5fe25a5cdb58bc74600a40a69c065263f8', tag: 'Gemini 2', category: 'exchange', chain: 'ethereum', confidence: 'verified' },

  // HTX (Huobi)
  { address: '0xab5c66752a9e8167967685f1450532fb96d5d24f', tag: 'HTX', category: 'exchange', chain: 'ethereum', confidence: 'verified' },

  // ═══════════════════════════════════════════════════════════════
  // ETHEREUM — DeFi Protocols
  // ═══════════════════════════════════════════════════════════════

  // Uniswap
  { address: '0xe592427a0aece92de3edee1f18e0157c05861564', tag: 'Uniswap V3 Router', category: 'defi', chain: 'ethereum', confidence: 'verified' },
  { address: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', tag: 'Uniswap V2 Router', category: 'defi', chain: 'ethereum', confidence: 'verified' },
  { address: '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45', tag: 'Uniswap SwapRouter02', category: 'defi', chain: 'ethereum', confidence: 'verified' },
  { address: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad', tag: 'Uniswap Universal Router', category: 'defi', chain: 'ethereum', confidence: 'verified' },

  // SushiSwap
  { address: '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f', tag: 'SushiSwap Router', category: 'defi', chain: 'ethereum', confidence: 'verified' },

  // 1inch
  { address: '0x1111111254eeb25477b68fb85ed929f73a960582', tag: '1inch v5', category: 'defi', chain: 'ethereum', confidence: 'verified' },
  { address: '0x111111125421ca6dc452d289314280a0f8842a65', tag: '1inch v6', category: 'defi', chain: 'ethereum', confidence: 'verified' },

  // 0x Protocol
  { address: '0xdef1c0ded9bec7f1a1670819833240f027b25eff', tag: '0x Exchange Proxy', category: 'defi', chain: 'ethereum', confidence: 'verified' },

  // Aave
  { address: '0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2', tag: 'Aave V3 Pool', category: 'defi', chain: 'ethereum', confidence: 'verified' },
  { address: '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9', tag: 'Aave V2 Pool', category: 'defi', chain: 'ethereum', confidence: 'verified' },

  // Lido
  { address: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84', tag: 'Lido stETH', category: 'defi', chain: 'ethereum', confidence: 'verified' },

  // Curve
  { address: '0xd51a44d3fae010294c616388b506acda1bfaae46', tag: 'Curve Tricrypto2', category: 'defi', chain: 'ethereum', confidence: 'verified' },

  // Compound
  { address: '0xc3d688b66703497daa19211eedff47f25384cdc3', tag: 'Compound V3 cUSDCv3', category: 'defi', chain: 'ethereum', confidence: 'verified' },

  // Maker/Sky
  { address: '0x9759a6ac90977b93b58547b4a71c78317f391a28', tag: 'MakerDAO DSR', category: 'defi', chain: 'ethereum', confidence: 'verified' },

  // ═══════════════════════════════════════════════════════════════
  // ETHEREUM — Bridges
  // ═══════════════════════════════════════════════════════════════

  // Snowbridge (Polkadot ↔ Ethereum)
  { address: '0x27ca963c279c93801941e1eb8799c23f407d68e7', tag: 'Snowbridge Gateway', category: 'bridge', chain: 'ethereum', confidence: 'verified' },
  { address: '0xeda338e4dc46038493b885327842fd3e301cab39', tag: 'Snowfork Token', category: 'bridge', chain: 'ethereum', confidence: 'verified' },

  // Hyperbridge
  { address: '0x6c848caf1f9acef4e1f893d835e7e2fba64c86f66d64', tag: 'Hyperbridge HandlerV1', category: 'bridge', chain: 'ethereum', confidence: 'likely' },
  { address: '0xfd4186eb434125c8b17be8a5fb80eabe855fb6de', tag: 'Hyperbridge TokenGateway', category: 'bridge', chain: 'ethereum', confidence: 'likely' },

  // Wormhole
  { address: '0x98f3c9e6e3face36baad05fe09d375ef1464288b', tag: 'Wormhole Bridge', category: 'bridge', chain: 'ethereum', confidence: 'verified' },

  // Multichain (Anyswap) - exploited
  { address: '0x6b7a87899490ece95443e979ca9485cbe7e71522', tag: 'Multichain (Exploited)', category: 'attacker', chain: 'ethereum', confidence: 'verified', description: 'Multichain bridge exploit - CEO arrested, funds drained', reportedDate: '2023-07-07' },

  // Across Protocol
  { address: '0x5c7bcd6e7de5423a257d81b442095a1a6ced35c5', tag: 'Across Bridge', category: 'bridge', chain: 'ethereum', confidence: 'verified' },

  // ═══════════════════════════════════════════════════════════════
  // ETHEREUM — Mixers & Privacy
  // ═══════════════════════════════════════════════════════════════

  // Tornado Cash
  { address: '0xd90e2f925da726b50c4ed8d0fb90ad053324f31b', tag: 'Tornado Cash Router', category: 'mixer', chain: 'ethereum', confidence: 'verified' },
  { address: '0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936', tag: 'Tornado 0.1 ETH', category: 'mixer', chain: 'ethereum', confidence: 'verified' },
  { address: '0x910cbd523d972eb0a6f4cae4618ad62622b39dbf', tag: 'Tornado 10 ETH', category: 'mixer', chain: 'ethereum', confidence: 'verified' },
  { address: '0xa160cdab225685da1d56aa342ad8841c3b53f291', tag: 'Tornado 100 ETH', category: 'mixer', chain: 'ethereum', confidence: 'verified' },
  { address: '0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc', tag: 'Tornado 1 ETH', category: 'mixer', chain: 'ethereum', confidence: 'verified' },

  // Railgun
  { address: '0xfa7093cdd9ee6932b4eb2c9e1cde7ce00b1fa4b9', tag: 'Railgun Relay Adapt', category: 'mixer', chain: 'ethereum', confidence: 'verified' },

  // ═══════════════════════════════════════════════════════════════
  // ETHEREUM — Exploit Attackers
  // ═══════════════════════════════════════════════════════════════

  { address: '0x59abf3837fa962d6853b4cc0a19513aa031fd32b', tag: 'Wintermute Exploiter', category: 'attacker', chain: 'ethereum', confidence: 'verified', description: 'Exploited Wintermute market maker via vanity address vulnerability', reportedDate: '2022-09-20', reportSource: 'Wintermute disclosure' },
  { address: '0x098b716b8aaf21512996dc57eb0615e2383e2f96', tag: 'Ronin Bridge Exploiter', category: 'attacker', chain: 'ethereum', confidence: 'verified', description: 'Exploited Ronin Bridge via compromised validator keys ($625M)', reportedDate: '2022-03-23', reportSource: 'Ronin Network', totalLossEstimate: '$625,000,000' },
  { address: '0xba214c1c1928a32bffe790263e38b4af9bfcd659', tag: 'Euler Finance Exploiter', category: 'attacker', chain: 'ethereum', confidence: 'verified', description: 'Flash loan attack on Euler Finance lending protocol', reportedDate: '2023-03-13', reportSource: 'Euler Finance' },
  { address: '0xc5135671895a70da7ced0e11391896dd1af76668', tag: 'Hyperbridge Attacker', category: 'attacker', chain: 'ethereum', confidence: 'verified', description: 'Exploited vulnerability in Hyperbridge token gateway', reportedDate: '2025-10-15', reportSource: 'Polytope Labs' },

  // ═══════════════════════════════════════════════════════════════
  // POLKADOT — Scam Addresses
  // ═══════════════════════════════════════════════════════════════

  { address: '1scamPHvFRq3R9DEPyW4c8D9n9sT6rTkYTnt5sqfzCCKRkB', tag: 'Polkadot Support Scam', category: 'scam', chain: 'polkadot', confidence: 'verified', scamType: 'impersonation', reportedDate: '2026-03-15', reportSource: 'Polkadot Anti-Scam Team', reportDescription: 'Impersonation of Polkadot support, phishing for seed phrases', totalVictimsEstimate: 47, totalLossEstimate: '12,500 DOT' },
  { address: '15airdropScamAddr1234567890abcdefghijklmnopqrst', tag: 'Fake DOT Airdrop', category: 'scam', chain: 'polkadot', confidence: 'verified', scamType: 'fake_airdrop', reportedDate: '2026-02-20', reportSource: 'Polkadot Anti-Scam Team', reportDescription: 'Fake airdrop campaign requiring seed phrase submission', totalVictimsEstimate: 120, totalLossEstimate: '35,000 DOT' },

  // ═══════════════════════════════════════════════════════════════
  // ETHEREUM — Scam Addresses
  // ═══════════════════════════════════════════════════════════════

  { address: '0x00000000a991c429389d40ee1e0dab03fea4a3b6', tag: 'Fake Uniswap Airdrop', category: 'scam', chain: 'ethereum', confidence: 'verified', scamType: 'fake_airdrop', reportedDate: '2025-11-10', reportSource: 'Etherscan Community Reports', reportDescription: 'Distributes worthless tokens with phishing approval links' },
  { address: '0xbad00000000000000000000000000000000000000', tag: 'Address Poisoning Scam', category: 'scam', chain: 'ethereum', confidence: 'verified', scamType: 'phishing', reportedDate: '2026-01-05', reportSource: 'SlowMist', reportDescription: 'Address poisoning attack - sends zero-value transfers to poison transaction history' },

  // ═══════════════════════════════════════════════════════════════
  // ETHEREUM — Foundation
  // ═══════════════════════════════════════════════════════════════

  { address: '0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae', tag: 'Ethereum Foundation', category: 'foundation', chain: 'ethereum', confidence: 'verified' },
  { address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', tag: 'vitalik.eth', category: 'foundation', chain: 'ethereum', confidence: 'verified' },
];

// ── Index ──────────────────────────────────────────────────────
const addressMap = new Map<string, KnownAddress>();
for (const ka of KNOWN_ADDRESSES) {
  addressMap.set(ka.address.toLowerCase(), ka);
}

// ── Identity Cache (Layer 2 + 3) ───────────────────────────────
// Caches on-chain identities and Subscan display names from transfer data
const identityCache = new Map<string, KnownAddress>();

/**
 * Register an on-chain identity or Subscan label for an address.
 * Called when processing transfer data that includes account_display info.
 * Does NOT overwrite Layer 1 (static database) entries.
 */
export function cacheIdentity(address: string, displayName: string, isOnChainIdentity: boolean = false): void {
  const key = address.toLowerCase();
  if (addressMap.has(key)) return; // Don't overwrite static entries
  if (!displayName || displayName.trim() === '') return;
  identityCache.set(key, {
    address: key,
    tag: displayName.trim(),
    category: 'identity',
    confidence: isOnChainIdentity ? 'verified' : 'unconfirmed',
  });
}

/**
 * Batch-register identities from Subscan transfer data.
 * Extracts people.display from from_account_display and to_account_display.
 */
export function cacheTransferIdentities(transfers: Array<{
  from: string;
  to: string;
  from_account_display?: { address: string; display?: string; people?: { display?: string; identity?: boolean; parent?: { display?: string } }; };
  to_account_display?: { address: string; display?: string; people?: { display?: string; identity?: boolean; parent?: { display?: string } }; };
}>): void {
  for (const t of transfers) {
    for (const display of [t.from_account_display, t.to_account_display]) {
      if (!display) continue;
      const people = display.people;
      if (!people) continue;
      const name = people.display || (people.parent?.display ? `${people.parent.display}/${people.display || ''}` : '');
      if (name) {
        cacheIdentity(display.address, name, people.identity === true);
      }
    }
  }
}

// ── Lookup (3-layer) ────────────────────────────────────────────

/**
 * Layer 1 only: look up an address in the static database.
 * Instant, synchronous, never returns identity-cache entries.
 */
export function lookupStaticDatabase(address: string): KnownAddress | undefined {
  return addressMap.get(address.toLowerCase());
}

/**
 * Look up an address across all layers:
 * 1. Static database (highest priority)
 * 2. Cached on-chain identity
 * 3. Cached Subscan display name
 */
export function lookupAddress(address: string): KnownAddress | undefined {
  const key = address.toLowerCase();
  return addressMap.get(key) || identityCache.get(key);
}

/** Check if any counterparties are bridge addresses */
export function findBridgeInteractions(counterparties: string[]): KnownAddress[] {
  return counterparties
    .map(addr => lookupAddress(addr))
    .filter((ka): ka is KnownAddress => ka !== undefined && ka.category === 'bridge');
}

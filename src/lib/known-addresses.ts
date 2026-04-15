export interface KnownAddress {
  address: string;
  tag: string;
  category: 'exchange' | 'treasury' | 'bridge' | 'foundation' | 'validator' | 'parachain' | 'other';
}

export const KNOWN_ADDRESSES: KnownAddress[] = [
  // Polkadot Treasury
  { address: '13UVJyLnbVp9RBZYFwFGyDvVd1y27AD8iv1CEstDo4bAZTMo', tag: 'Polkadot Treasury', category: 'treasury' },

  // Web3 Foundation
  { address: '15oF4uVJwmo4TdGW7VfQxNLavjCXviqWrztPu6CAkAJB4pXY', tag: 'Web3 Foundation', category: 'foundation' },
  { address: '12xtAYsRUrmZhdontLEyh4gYpTLJKpRPApByqv7AHqPsMi4w', tag: 'Web3 Foundation', category: 'foundation' },

  // Exchanges — Binance
  { address: '1qnJN7FViy3HZaxZK9tGAA71zxHSBeUweirKqCaox4t8GT7', tag: 'Binance', category: 'exchange' },
  { address: '16ZL8yLyXv3V3L3z9ofR1ovFLziyXaN1DPq4yffMAZ9czzBD', tag: 'Binance', category: 'exchange' },

  // Exchanges — Kraken
  { address: '16aP3oTaD7oQ6qmxU6fDAi7pk338tr5Kp8RDVhYP5zAFVAqt', tag: 'Kraken', category: 'exchange' },

  // Exchanges — OKX
  { address: '14ShUZUYUR35RBZW6uVVt1zXDqmvNcQePVXdhyJFLGbkRwmE', tag: 'OKX', category: 'exchange' },

  // Exchanges — Kucoin
  { address: '12ux8KHeFfMH6vSoCDNT2s1ZHfFKGoNxMjhCSk6tJ4kJrmDX', tag: 'KuCoin', category: 'exchange' },

  // Exchanges — Huobi/HTX
  { address: '12GtKYDpLkE5fU9B2H7CFv8wjfYcv3qBrGRBjZLJnHW7AGKL', tag: 'HTX', category: 'exchange' },

  // Validators
  { address: '12hAtDZJGt4of3m2GqZcUCVAjZPALfvPwvtUTFZPQUbdX1Ud', tag: 'Zug Capital', category: 'validator' },
  { address: '14Ns6kKbCoka3MS4Hn6b7oRw9fFejG8RH5rq5j63cWUfpPDJ', tag: 'P2P.ORG', category: 'validator' },

  // Bridge contracts
  { address: '13cKp89Nt7t1hZbfNJYPWKMnxMJgfBdjYp7VQpBY9WKMRWTQ', tag: 'Snowbridge', category: 'bridge' },

  // Parachains
  { address: '13YMCibS1MNxjDH8TLbE3unjcvffMavRdAU66boRPeLRwFfkQ', tag: 'Moonbeam Sovereign', category: 'parachain' },
  { address: '13wNbioJHCsU5ZEDRtoYbvztpaGUX3CVjpL5S2EccrjhGsQH', tag: 'Acala Sovereign', category: 'parachain' },
];

export function lookupAddress(address: string): KnownAddress | undefined {
  return KNOWN_ADDRESSES.find(k => k.address === address);
}

export function getCategoryColor(category: KnownAddress['category']): string {
  switch (category) {
    case 'exchange': return 'var(--color-node-exchange)';
    case 'treasury': return 'var(--color-node-treasury)';
    case 'bridge': return 'var(--color-flow-xcm)';
    case 'foundation': return 'var(--color-node-treasury)';
    case 'validator': return 'var(--color-accent-primary)';
    default: return 'var(--color-node-default)';
  }
}

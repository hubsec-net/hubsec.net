export interface ChainConfig {
  id: string;
  name: string;
  subscanBase: string;
  ss58Prefix: number;
  tokenSymbol: string;
  tokenDecimals: number;
  explorerUrl: string;
}

export const CHAINS: Record<string, ChainConfig> = {
  polkadot: {
    id: 'polkadot',
    name: 'Polkadot',
    subscanBase: 'https://polkadot.api.subscan.io',
    ss58Prefix: 0,
    tokenSymbol: 'DOT',
    tokenDecimals: 10,
    explorerUrl: 'https://polkadot.subscan.io',
  },
  assethub: {
    id: 'assethub',
    name: 'AssetHub',
    subscanBase: 'https://assethub-polkadot.api.subscan.io',
    ss58Prefix: 0,
    tokenSymbol: 'DOT',
    tokenDecimals: 10,
    explorerUrl: 'https://assethub-polkadot.subscan.io',
  },
  moonbeam: {
    id: 'moonbeam',
    name: 'Moonbeam',
    subscanBase: 'https://moonbeam.api.subscan.io',
    ss58Prefix: 1284,
    tokenSymbol: 'GLMR',
    tokenDecimals: 18,
    explorerUrl: 'https://moonbeam.subscan.io',
  },
  hydration: {
    id: 'hydration',
    name: 'Hydration',
    subscanBase: 'https://hydration.api.subscan.io',
    ss58Prefix: 63,
    tokenSymbol: 'HDX',
    tokenDecimals: 12,
    explorerUrl: 'https://hydration.subscan.io',
  },
  acala: {
    id: 'acala',
    name: 'Acala',
    subscanBase: 'https://acala.api.subscan.io',
    ss58Prefix: 10,
    tokenSymbol: 'ACA',
    tokenDecimals: 12,
    explorerUrl: 'https://acala.subscan.io',
  },
  astar: {
    id: 'astar',
    name: 'Astar',
    subscanBase: 'https://astar.api.subscan.io',
    ss58Prefix: 5,
    tokenSymbol: 'ASTR',
    tokenDecimals: 18,
    explorerUrl: 'https://astar.subscan.io',
  },
};

export const DEFAULT_CHAIN = 'polkadot';

export function getChain(id: string): ChainConfig {
  return CHAINS[id] ?? CHAINS[DEFAULT_CHAIN];
}

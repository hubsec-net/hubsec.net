export interface ChainConfig {
  id: string;
  name: string;
  apiType: 'subscan' | 'etherscan';
  /** For subscan chains: full Subscan API URL. For etherscan: Etherscan API URL. */
  subscanBase: string;
  ss58Prefix: number;
  tokenSymbol: string;
  tokenDecimals: number;
  explorerUrl: string;
  /** Whether this chain accepts 0x (EVM) addresses natively */
  evmCompatible: boolean;
}

export const CHAINS: Record<string, ChainConfig> = {
  polkadot: {
    id: 'polkadot',
    name: 'Polkadot',
    apiType: 'subscan',
    subscanBase: 'https://polkadot.api.subscan.io',
    ss58Prefix: 0,
    tokenSymbol: 'DOT',
    tokenDecimals: 10,
    explorerUrl: 'https://polkadot.subscan.io',
    evmCompatible: false,
  },
  assethub: {
    id: 'assethub',
    name: 'AssetHub',
    apiType: 'subscan',
    subscanBase: 'https://assethub-polkadot.api.subscan.io',
    ss58Prefix: 0,
    tokenSymbol: 'DOT',
    tokenDecimals: 10,
    explorerUrl: 'https://assethub-polkadot.subscan.io',
    evmCompatible: true,
  },
  moonbeam: {
    id: 'moonbeam',
    name: 'Moonbeam',
    apiType: 'subscan',
    subscanBase: 'https://moonbeam.api.subscan.io',
    ss58Prefix: 1284,
    tokenSymbol: 'GLMR',
    tokenDecimals: 18,
    explorerUrl: 'https://moonbeam.subscan.io',
    evmCompatible: true,
  },
  hydration: {
    id: 'hydration',
    name: 'Hydration',
    apiType: 'subscan',
    subscanBase: 'https://hydration.api.subscan.io',
    ss58Prefix: 63,
    tokenSymbol: 'HDX',
    tokenDecimals: 12,
    explorerUrl: 'https://hydration.subscan.io',
    evmCompatible: false,
  },
  acala: {
    id: 'acala',
    name: 'Acala',
    apiType: 'subscan',
    subscanBase: 'https://acala.api.subscan.io',
    ss58Prefix: 10,
    tokenSymbol: 'ACA',
    tokenDecimals: 12,
    explorerUrl: 'https://acala.subscan.io',
    evmCompatible: true,
  },
  astar: {
    id: 'astar',
    name: 'Astar',
    apiType: 'subscan',
    subscanBase: 'https://astar.api.subscan.io',
    ss58Prefix: 5,
    tokenSymbol: 'ASTR',
    tokenDecimals: 18,
    explorerUrl: 'https://astar.subscan.io',
    evmCompatible: true,
  },
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    apiType: 'etherscan',
    subscanBase: 'https://api.etherscan.io',
    ss58Prefix: 0,
    tokenSymbol: 'ETH',
    tokenDecimals: 18,
    explorerUrl: 'https://etherscan.io',
    evmCompatible: true,
  },
};

export const DEFAULT_CHAIN = 'assethub';

export function getChain(id: string): ChainConfig {
  return CHAINS[id] ?? CHAINS[DEFAULT_CHAIN];
}

export function isEthereumChain(chainId: string): boolean {
  return getChain(chainId).apiType === 'etherscan';
}

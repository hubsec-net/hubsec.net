import { getChain } from './chains';
import { getEtherscanAccountUrl, getEtherscanTxUrl, getEtherscanBlockUrl } from './etherscan';
import { getSubscanAccountUrl, getSubscanTxUrl, getSubscanBlockUrl } from './subscan';

/** Get the external explorer URL for an account, chain-aware */
export function getExplorerAccountUrl(address: string, chain: string): string {
  const c = getChain(chain);
  if (c.apiType === 'etherscan') return getEtherscanAccountUrl(address);
  return getSubscanAccountUrl(address, chain);
}

/** Get the external explorer URL for a transaction, chain-aware */
export function getExplorerTxUrl(hash: string, chain: string): string {
  const c = getChain(chain);
  if (c.apiType === 'etherscan') return getEtherscanTxUrl(hash);
  return getSubscanTxUrl(hash, chain);
}

/** Get the external explorer URL for a block, chain-aware */
export function getExplorerBlockUrl(block: number, chain: string): string {
  const c = getChain(chain);
  if (c.apiType === 'etherscan') return getEtherscanBlockUrl(block);
  return getSubscanBlockUrl(block, chain);
}

/** Human-readable name for the external explorer */
export function getExplorerName(chain: string): string {
  const c = getChain(chain);
  return c.apiType === 'etherscan' ? 'Etherscan' : 'Subscan';
}

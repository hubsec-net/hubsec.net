import type { Transfer, AccountInfo, TransfersResponse } from './subscan';

const API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || '';

// ── Rate limiter: Etherscan free tier = 5 calls/sec ──

let lastRequestTime = 0;
let activeRequests = 0;
const MAX_CONCURRENT = 4;
const MIN_INTERVAL_MS = 220;

async function waitForSlot(): Promise<void> {
  while (activeRequests >= MAX_CONCURRENT) {
    await new Promise(r => setTimeout(r, 50));
  }
  const now = Date.now();
  const wait = Math.max(0, MIN_INTERVAL_MS - (now - lastRequestTime));
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastRequestTime = Date.now();
  activeRequests++;
}

function releaseSlot(): void {
  activeRequests = Math.max(0, activeRequests - 1);
}

// ── Base fetch ──

interface EtherscanResponse<T> {
  status: string;
  message: string;
  result: T;
}

async function etherscanFetch<T>(params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params);
  // Etherscan V2 requires chainid
  if (!qs.has('chainid')) qs.set('chainid', '1');
  if (API_KEY) qs.set('apikey', API_KEY);

  // Call Etherscan V2 API directly. CSP connect-src allows https://api.etherscan.io.
  const url = `https://api.etherscan.io/v2/api?${qs.toString()}`;

  await waitForSlot();
  try {
    const res = await fetch(url);

    if (res.status === 429) {
      throw new Error('Etherscan rate limit reached. Please wait a moment and try again.');
    }
    if (!res.ok) {
      throw new Error(`Etherscan API error: ${res.status}`);
    }

    const json: EtherscanResponse<T> = await res.json();

    // Etherscan returns status "0" for errors or empty results
    if (json.status === '0' && json.message !== 'No transactions found') {
      // "NOTOK" is a real error; "No transactions found" is just empty
      if (typeof json.result === 'string') {
        throw new Error(json.result as string);
      }
    }

    return json.result;
  } finally {
    releaseSlot();
  }
}

// ── Helpers ──

function fromWei(wei: string, decimals: number = 18): string {
  if (!wei || wei === '0') return '0';
  const num = parseFloat(wei) / Math.pow(10, decimals);
  return num.toString();
}

// ── Etherscan raw types ──

interface EthTx {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  isError: string;
  txreceipt_status: string;
  functionName: string;
  contractAddress: string;
  transactionIndex: string;
}

interface EthTokenTx {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  gasUsed: string;
  gasPrice: string;
  contractAddress: string;
  transactionIndex: string;
}

// ── Normalize to shared Transfer type ──

function normalizeEthTx(tx: EthTx): Transfer {
  const fee = parseFloat(tx.gasUsed || '0') * parseFloat(tx.gasPrice || '0');
  return {
    block_num: parseInt(tx.blockNumber) || 0,
    block_timestamp: parseInt(tx.timeStamp) || 0,
    extrinsic_index: `${tx.blockNumber}-${tx.transactionIndex || '0'}`,
    hash: tx.hash,
    from: tx.from.toLowerCase(),
    to: (tx.to || tx.contractAddress || '').toLowerCase(),
    amount: fromWei(tx.value),
    amount_v2: tx.value,
    fee: fromWei(fee.toString()),
    success: tx.isError === '0',
    asset_symbol: 'ETH',
    asset_type: '',
  };
}

function normalizeTokenTx(tx: EthTokenTx): Transfer {
  const decimals = parseInt(tx.tokenDecimal) || 18;
  return {
    block_num: parseInt(tx.blockNumber) || 0,
    block_timestamp: parseInt(tx.timeStamp) || 0,
    extrinsic_index: `${tx.blockNumber}-${tx.transactionIndex || '0'}`,
    hash: tx.hash,
    from: tx.from.toLowerCase(),
    to: tx.to.toLowerCase(),
    amount: fromWei(tx.value, decimals),
    amount_v2: tx.value,
    fee: '0',
    success: true,
    asset_symbol: tx.tokenSymbol || 'ERC20',
    asset_type: 'ERC20',
  };
}

// ── Public API (matches subscan.ts shapes) ──

export async function fetchEthAccountInfo(address: string): Promise<AccountInfo> {
  const balanceWei = await etherscanFetch<string>({
    module: 'account',
    action: 'balance',
    address,
    tag: 'latest',
  });

  return {
    address: address.toLowerCase(),
    balance: fromWei(balanceWei),
    balance_lock: '0',
    count_extrinsic: 0,
    nonce: 0,
  };
}

export async function fetchEthTransfers(
  address: string,
  page: number = 0,
  pageSize: number = 100,
): Promise<TransfersResponse> {
  const addr = address.toLowerCase();

  // Fetch normal txs and token txs in parallel
  const [normalTxs, tokenTxs] = await Promise.all([
    etherscanFetch<EthTx[] | string>({
      module: 'account',
      action: 'txlist',
      address: addr,
      startblock: '0',
      endblock: '99999999',
      page: String(page + 1), // Etherscan is 1-indexed
      offset: String(pageSize),
      sort: 'desc',
    }).catch(() => [] as EthTx[]),
    etherscanFetch<EthTokenTx[] | string>({
      module: 'account',
      action: 'tokentx',
      address: addr,
      startblock: '0',
      endblock: '99999999',
      page: String(page + 1),
      offset: String(pageSize),
      sort: 'desc',
    }).catch(() => [] as EthTokenTx[]),
  ]);

  // Etherscan returns a string error message when there are no results
  const normal = Array.isArray(normalTxs) ? normalTxs : [];
  const tokens = Array.isArray(tokenTxs) ? tokenTxs : [];

  const normalTransfers = normal.map(normalizeEthTx);
  const tokenTransfers = tokens.map(normalizeTokenTx);

  // Merge and sort by timestamp descending
  const all = [...normalTransfers, ...tokenTransfers].sort(
    (a, b) => b.block_timestamp - a.block_timestamp,
  );

  // Deduplicate by hash + from + to + asset (same tx can appear in both endpoints for contract calls)
  const seen = new Set<string>();
  const deduped = all.filter(t => {
    const key = `${t.hash}-${t.from}-${t.to}-${t.asset_symbol}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    count: deduped.length,
    transfers: deduped,
  };
}

// ── Contract verification ──

interface ContractSource {
  SourceCode: string;
  ContractName: string;
  ABI: string;
}

export async function fetchContractInfo(address: string): Promise<{
  isContract: boolean;
  isVerified: boolean;
  contractName: string;
} | null> {
  try {
    const result = await etherscanFetch<ContractSource[]>({
      module: 'contract',
      action: 'getsourcecode',
      address,
    });
    if (!result || !Array.isArray(result) || result.length === 0) return null;
    const src = result[0];
    const isVerified = !!src.SourceCode && src.SourceCode !== '';
    const isContract = isVerified || (src.ABI !== 'Contract source code not verified');
    return {
      isContract,
      isVerified,
      contractName: src.ContractName || '',
    };
  } catch {
    return null;
  }
}

// ── Explorer URLs ──

export function getEtherscanAccountUrl(address: string): string {
  return `https://etherscan.io/address/${address}`;
}

export function getEtherscanTxUrl(hash: string): string {
  return `https://etherscan.io/tx/${hash}`;
}

export function getEtherscanBlockUrl(block: number): string {
  return `https://etherscan.io/block/${block}`;
}

import { getChain, type ChainConfig } from './chains';

const API_KEY = process.env.NEXT_PUBLIC_SUBSCAN_API_KEY || '';

interface SubscanRequestOptions {
  chain: string;
  endpoint: string;
  body?: Record<string, unknown>;
}

interface SubscanResponse<T> {
  code: number;
  message: string;
  data: T;
}

class SubscanError extends Error {
  code: number;
  constructor(message: string, code: number) {
    super(message);
    this.name = 'SubscanError';
    this.code = code;
  }
}

// Simple rate limiter: max 5 concurrent requests, 100ms minimum between requests
let lastRequestTime = 0;
let activeRequests = 0;
const MAX_CONCURRENT = 5;
const MIN_INTERVAL_MS = 100;

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

async function subscanFetch<T>(opts: SubscanRequestOptions): Promise<T> {
  const chain = getChain(opts.chain);
  const url = `${chain.subscanBase}${opts.endpoint}`;

  await waitForSlot();
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (API_KEY) headers['X-API-Key'] = API_KEY;

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(opts.body ?? {}),
    });

    if (res.status === 429) {
      throw new SubscanError('Rate limit reached. Please wait a moment and try again.', 429);
    }

    if (!res.ok) {
      throw new SubscanError(`Subscan API error: ${res.status}`, res.status);
    }

    const json: SubscanResponse<T> = await res.json();
    if (json.code !== 0) {
      throw new SubscanError(json.message || 'Subscan API error', json.code);
    }

    return json.data;
  } finally {
    releaseSlot();
  }
}

// ── Account Info ──

export interface AccountInfo {
  address: string;
  balance: string;
  balance_lock: string;
  count_extrinsic: number;
  nonce: number;
  account_display?: {
    address: string;
    display?: string;
    judgements?: Array<{ index: number; judgement: string }>;
    parent?: { address: string; display: string };
    identity?: boolean;
  };
  staking_info?: {
    bonded: string;
    controller: string;
    reward_account: string;
  } | null;
  registrar_info?: unknown;
}

export async function fetchAccountInfo(address: string, chain: string): Promise<AccountInfo> {
  return subscanFetch<AccountInfo>({
    chain,
    endpoint: '/api/v2/scan/search',
    body: { key: address },
  });
}

// ── Transfers ──

export interface Transfer {
  block_num: number;
  block_timestamp: number;
  extrinsic_index: string;
  hash: string;
  from: string;
  to: string;
  amount: string;
  amount_v2: string;
  fee: string;
  success: boolean;
  asset_symbol: string;
  asset_type: string;
  from_account_display?: { address: string; display?: string; identity?: boolean };
  to_account_display?: { address: string; display?: string; identity?: boolean };
}

export interface TransfersResponse {
  count: number;
  transfers: Transfer[] | null;
}

export async function fetchTransfers(
  address: string,
  chain: string,
  page: number = 0,
  pageSize: number = 100,
  direction?: 'sent' | 'received' | 'all',
): Promise<TransfersResponse> {
  const body: Record<string, unknown> = {
    address,
    row: pageSize,
    page,
  };
  if (direction && direction !== 'all') {
    body.direction = direction;
  }
  return subscanFetch<TransfersResponse>({
    chain,
    endpoint: '/api/v2/scan/transfers',
    body,
  });
}

// ── Account Tokens ──

export interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
  locked: string;
  reserved: string;
  bonded: string;
  unbonding: string;
  democracy_lock: string;
  election_lock: string;
  unique_id: string;
}

export interface AccountTokensResponse {
  native: TokenBalance[];
  ERC20: TokenBalance[];
}

export async function fetchAccountTokens(address: string, chain: string): Promise<AccountTokensResponse> {
  return subscanFetch<AccountTokensResponse>({
    chain,
    endpoint: '/api/v2/scan/account/tokens',
    body: { address },
  });
}

// ── Extrinsics ──

export interface Extrinsic {
  block_num: number;
  block_timestamp: number;
  extrinsic_index: string;
  extrinsic_hash: string;
  call_module: string;
  call_module_function: string;
  success: boolean;
  fee: string;
}

export interface ExtrinsicsResponse {
  count: number;
  extrinsics: Extrinsic[] | null;
}

export async function fetchExtrinsics(
  address: string,
  chain: string,
  page: number = 0,
  pageSize: number = 25,
): Promise<ExtrinsicsResponse> {
  return subscanFetch<ExtrinsicsResponse>({
    chain,
    endpoint: '/api/scan/account/extrinsics',
    body: { address, row: pageSize, page },
  });
}

// ── Reward / Slash ──

export interface RewardSlash {
  block_num: number;
  block_timestamp: number;
  event_index: string;
  extrinsic_index: string;
  amount: string;
  stash: string;
  module_id: string;
  event_id: string;
}

export interface RewardSlashResponse {
  count: number;
  list: RewardSlash[] | null;
}

export async function fetchRewardSlash(
  address: string,
  chain: string,
  page: number = 0,
): Promise<RewardSlashResponse> {
  return subscanFetch<RewardSlashResponse>({
    chain,
    endpoint: '/api/scan/account/reward_slash',
    body: { address, row: 25, page },
  });
}

// ── XCM Transfers ──

export interface XcmTransfer {
  from_account: string;
  to_account: string;
  amount: string;
  asset: string;
  origin_chain: string;
  dest_chain: string;
  block_timestamp: number;
  status: string;
}

export interface XcmListResponse {
  count: number;
  list: XcmTransfer[] | null;
}

export async function fetchXcmTransfers(
  address: string,
  chain: string,
  page: number = 0,
): Promise<XcmListResponse> {
  return subscanFetch<XcmListResponse>({
    chain,
    endpoint: '/api/scan/xcm/list',
    body: { address, row: 25, page },
  });
}

// ── Utility: get chain for subscan links ──

export function getSubscanAccountUrl(address: string, chain: string): string {
  const c = getChain(chain);
  return `${c.explorerUrl}/account/${address}`;
}

export function getSubscanTxUrl(hash: string, chain: string): string {
  const c = getChain(chain);
  return `${c.explorerUrl}/extrinsic/${hash}`;
}

export function getSubscanBlockUrl(block: number, chain: string): string {
  const c = getChain(chain);
  return `${c.explorerUrl}/block/${block}`;
}

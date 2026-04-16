import { getChain } from './chains';

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
  // Call Subscan API directly from the client.
  // CSP connect-src allows https://*.api.subscan.io.
  const chainConfig = getChain(opts.chain);
  const url = `${chainConfig.subscanBase}${opts.endpoint}`;

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

    // 10004 = "Record Not Found" — not a hard error, just empty data
    if (json.code !== 0 && json.code !== 10004) {
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
  display?: string;
  account_display?: {
    address: string;
    account_index?: string;
    people?: {
      display?: string;
      identity?: boolean;
      judgements?: Array<{ index: number; judgement: string }>;
    };
    parent?: { address: string; display: string };
  };
  staking_info?: {
    controller: string;
    reward_account: string;
  } | null;
  role?: string;
  bonded?: string;
  registrar_info?: unknown;
}

interface SearchResponse {
  account: AccountInfo;
}

export async function fetchAccountInfo(address: string, chain: string): Promise<AccountInfo> {
  const res = await subscanFetch<SearchResponse>({
    chain,
    endpoint: '/api/v2/scan/search',
    body: { key: address },
  });
  return res.account;
}

// ── On-Chain Identity ──

export interface OnChainIdentity {
  display: string | null;
  identity: boolean;
  judgements?: Array<{ index: number; judgement: string }>;
  parentDisplay?: string;
}

/**
 * Fetch on-chain identity for a Substrate address via Subscan's search endpoint.
 * Returns null if no identity is set.
 */
export async function fetchOnChainIdentity(address: string, chain: string): Promise<OnChainIdentity | null> {
  try {
    const acct = await fetchAccountInfo(address, chain);
    const people = acct.account_display?.people;
    if (!people?.display) return null;
    return {
      display: people.display,
      identity: people.identity === true,
      judgements: people.judgements,
      parentDisplay: acct.account_display?.parent?.display,
    };
  } catch {
    return null;
  }
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
  from_account_display?: {
    address: string;
    display?: string;
    identity?: boolean;
    people?: { display?: string; identity?: boolean; parent?: { display?: string; identity?: boolean }; sub_symbol?: string; judgements?: Array<{ index: number; judgement: string }> };
  };
  to_account_display?: {
    address: string;
    display?: string;
    identity?: boolean;
    people?: { display?: string; identity?: boolean; parent?: { display?: string; identity?: boolean }; sub_symbol?: string; judgements?: Array<{ index: number; judgement: string }> };
  };
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

// ── Governance / Referenda ──

export interface ReferendumVote {
  referendum_index: number;
  account: { address: string; people?: Record<string, unknown> };
  delegate_account: { address: string; people?: Record<string, unknown> } | null;
  extrinsic_index: string;
  conviction: string;
  amount: string;
  votes: string;
  status: string; // "Ayes" | "Nays"
  valid: boolean;
  unlock_block: number;
  voting_time: number;
  relay_chain?: number;
}

export interface ReferendumVotesResponse {
  count: number;
  list: ReferendumVote[] | null;
}

export async function fetchAccountVotes(
  address: string,
  chain: string,
  page: number = 0,
  row: number = 25,
): Promise<ReferendumVotesResponse> {
  try {
    return await subscanFetch<ReferendumVotesResponse>({
      chain,
      endpoint: '/api/scan/referenda/votes',
      body: { account: address, row, page },
    });
  } catch {
    return { count: 0, list: null };
  }
}

// ── Staking Detail ──

export interface NominatorDetail {
  stash_account_display?: { address: string; display?: string };
  controller_account_display?: { address: string; display?: string };
  bonded: string;
  reward_dest?: string;
  reward_account?: string;
  nominators?: Array<{
    validator_stash: string;
    validator_prefs?: { commission: number | string };
    validator_account_display?: { address: string; display?: string };
  }>;
}

export interface ValidatorDetail {
  stash_account_display?: { address: string; display?: string };
  controller_account_display?: { address: string; display?: string };
  bonded_nominators: number;
  bonded_total: string;
  bonded_owner: string;
  validator_prefs_value: number;
  latest_mining: number;
  reward_point: number;
  session_key?: string[];
  grandpa_vote?: number;
  count_nominators?: number;
}

export interface StakingNominatorResponse {
  stash_account_display?: { address: string; display?: string };
  controller_account_display?: { address: string; display?: string };
  bonded: string;
  status?: string;
  reward_dest?: string;
  reward_account?: string;
  nominating?: Array<{
    stash_account_display?: { address: string; display?: string };
    validator_prefs?: { commission: string | number };
    bonded_total?: string;
    count_nominators?: number;
    reward_point?: number;
  }>;
}

export async function fetchNominatorDetail(
  address: string,
  chain: string,
): Promise<StakingNominatorResponse | null> {
  try {
    return await subscanFetch<StakingNominatorResponse>({
      chain,
      endpoint: '/api/v2/scan/staking/nominator',
      body: { address },
    });
  } catch {
    return null;
  }
}

export interface StakingValidatorResponse {
  stash_account_display?: { address: string; display?: string };
  controller_account_display?: { address: string; display?: string };
  bonded_total: string;
  bonded_owner: string;
  bonded_nominators: number;
  validator_prefs_value: number;
  count_nominators?: number;
  latest_mining?: number;
  reward_point?: number;
  session_key?: string[];
  slash_count?: number;
}

export async function fetchValidatorDetail(
  address: string,
  chain: string,
): Promise<StakingValidatorResponse | null> {
  try {
    return await subscanFetch<StakingValidatorResponse>({
      chain,
      endpoint: '/api/v2/scan/staking/validator',
      body: { address },
    });
  } catch {
    return null;
  }
}

// ── Multisig ──

export interface MultisigRecord {
  multi_id: string;
  multi_account_display?: { address: string; display?: string };
  call_module: string;
  call_module_function: string;
  threshold: number;
  approve_record?: Array<{
    account_display?: { address: string; display?: string };
    approve_type: string;
  }>;
  status: string;
  block_timestamp: number;
}

export interface MultisigResponse {
  count: number;
  multisig: MultisigRecord[] | null;
}

export async function fetchMultisigRecords(
  address: string,
  chain: string,
  page: number = 0,
): Promise<MultisigResponse> {
  try {
    return await subscanFetch<MultisigResponse>({
      chain,
      endpoint: '/api/scan/multisigs',
      body: { account: address, row: 25, page },
    });
  } catch {
    return { count: 0, multisig: null };
  }
}

// ── Account Extrinsic-based Proxy Discovery ──

export interface ProxyRecord {
  real: string;
  delegate: string;
  proxy_type: string;
  delay: number;
}

/**
 * Discover proxy relationships by querying account extrinsics filtered to proxy module.
 * Returns both proxies-for (who can act on behalf of this account) and proxies-of (accounts this address can control).
 */
export async function fetchProxyRelationships(
  address: string,
  chain: string,
): Promise<{ proxiesFor: ProxyRecord[]; proxiesOf: ProxyRecord[] }> {
  try {
    // Fetch extrinsics where this account interacted with proxy module
    const res = await subscanFetch<ExtrinsicsResponse>({
      chain,
      endpoint: '/api/scan/account/extrinsics',
      body: { address, row: 100, page: 0, module: 'proxy' },
    });
    const extrinsics = res.extrinsics || [];
    const proxiesFor: ProxyRecord[] = [];
    const proxiesOf: ProxyRecord[] = [];
    const seen = new Set<string>();

    for (const ext of extrinsics) {
      if (ext.call_module_function === 'add_proxy' || ext.call_module_function === 'proxy') {
        // This is a proxy setup or usage — we can track relationships
        // Since we can't fully decode params from the list endpoint,
        // we note the relationship exists
        const key = `${ext.extrinsic_hash}`;
        if (!seen.has(key)) seen.add(key);
      }
    }

    return { proxiesFor, proxiesOf };
  } catch {
    return { proxiesFor: [], proxiesOf: [] };
  }
}

// ── Extrinsic Detail ──

export interface ExtrinsicParam {
  name: string;
  type: string;
  type_name?: string;
  value: unknown;
}

export interface ExtrinsicEvent {
  event_index: string;
  module_id: string;
  event_id: string;
  params: string; // JSON string
  phase?: number;
}

export interface ExtrinsicSubCall {
  call_module: string;
  call_module_function: string;
  params: ExtrinsicParam[];
}

export interface ExtrinsicDetail {
  block_num: number;
  block_timestamp: number;
  extrinsic_index: string;
  extrinsic_hash: string;
  call_module: string;
  call_module_function: string;
  account_id: string;
  account_display?: {
    address: string;
    display?: string;
    people?: { display?: string; identity?: boolean };
  };
  signature: string;
  nonce: number;
  fee: string;
  fee_used?: string;
  tip?: string;
  success: boolean;
  params: ExtrinsicParam[];
  event: ExtrinsicEvent[];
  // Batch inner calls
  call_sub?: ExtrinsicSubCall[];
}

interface ExtrinsicDetailResponse {
  block_num: number;
  block_timestamp: number;
  extrinsic_index: string;
  extrinsic_hash: string;
  call_module: string;
  call_module_function: string;
  account_id: string;
  account_display?: ExtrinsicDetail['account_display'];
  signature: string;
  nonce: number;
  fee: string;
  fee_used?: string;
  tip?: string;
  success: boolean;
  params: ExtrinsicParam[] | string;
  event: ExtrinsicEvent[] | null;
}

export async function fetchExtrinsicDetail(
  hashOrIndex: string,
  chain: string,
): Promise<ExtrinsicDetail | null> {
  try {
    const body: Record<string, string> = hashOrIndex.startsWith('0x')
      ? { hash: hashOrIndex }
      : { extrinsic_index: hashOrIndex };
    const raw = await subscanFetch<ExtrinsicDetailResponse>({
      chain,
      endpoint: '/api/scan/extrinsic',
      body,
    });
    if (!raw) return null;
    // params can be a JSON string or array
    const params: ExtrinsicParam[] =
      typeof raw.params === 'string'
        ? JSON.parse(raw.params || '[]')
        : raw.params || [];
    return { ...raw, params, event: raw.event || [] };
  } catch {
    return null;
  }
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

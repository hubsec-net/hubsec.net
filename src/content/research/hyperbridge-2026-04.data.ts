import type { KeyIdentifier, TimelineEvent, FundFlowNode, FundFlowEdge, Detection, ImpactItem, SimilarIncident } from '@/lib/types';

export const keyIdentifiers: KeyIdentifier[] = [
  { label: 'Exploit Tx (Primary)', value: '0x240aeb9a8b2a...1109', link: 'https://etherscan.io/tx/0x240aeb9a8b2aabf64ed8e1e480d3e7be140cf530dc1e5606cb16671029401109', copyable: true },
  { label: 'Block Number', value: '24,868,295' },
  { label: 'Timestamp', value: 'April 13, 2026 — 03:55:23 UTC' },
  { label: 'Attacker EOA', value: '0xC513...F8E7', copyable: true },
  { label: 'Master Contract', value: '0x518A...8f26', copyable: true },
  { label: 'HandlerV1', value: '0x6C84...6D64', copyable: true },
  { label: 'TokenGateway', value: '0xFd41...B6dE', copyable: true },
  { label: 'Target Token (DOT)', value: '0x8d01...90b8 (ERC-6160)', copyable: true },
  { label: 'Primary Profit', value: '108.2 ETH (~$237,000)' },
  { label: 'Earlier Exploit Profit', value: 'Disputed: ~245 ETH (~$537,000) or ~$12,000 (see Phase 0)' },
  { label: 'Combined Realized Loss', value: '~$250,000–$787,000 (range reflects conflicting reports on earlier exploit)' },
  { label: 'Gas Cost (Primary)', value: '0.000339 ETH' },
  { label: 'Wallet Age at Exploit', value: '33 days' },
  { label: 'Network', value: 'Ethereum Mainnet' },
];

export const timelineEvents: TimelineEvent[] = [
  { date: '~Mar 11, 2026', phase: 'preparation', title: 'Wallet created via Railgun', description: 'Attacker EOA funded through Railgun zk-shielded pool and Synapse Bridge. No prior on-chain history.' },
  { date: 'Mar 11 – Apr 12', phase: 'preparation', title: '15+ test contracts deployed', description: 'Systematic probing of Hyperbridge gateway. Identified MMR boundary bypass, proof-request unbinding, and shallow auth on governance path.' },
  { date: 'Apr 13, ~02:55 UTC', phase: 'execution', title: 'Earlier exploit — amount disputed', description: 'Related TokenGateway contract exploited. Specter reported ~245 ETH; BanklessTimes reported ~$12,000 in MANTA/CERE. Proceeds fragmented across multiple wallets.' },
  { date: 'Apr 13, 03:55 UTC', phase: 'execution', title: 'Primary exploit — single atomic tx', description: 'Forged MMR proof → admin takeover → minted 1B bridged DOT → swapped for 108.2 ETH via Odos/Uniswap.' },
  { date: 'Apr 13, 04:12 UTC', phase: 'extraction', title: 'Railgun deposits begin', description: 'Primary proceeds cycled through Railgun in 15 ETH increments toward fresh exit wallets.' },
  { date: 'Apr 13, ~04:30 UTC', phase: 'aftermath', title: 'Hyperbridge detects exploit', description: 'Team posted on X. All bridging paused, partners advised to halt transactions.' },
  { date: 'Apr 13, ~06:00 UTC', phase: 'aftermath', title: 'EthereumHost frozen', description: 'Gateway contract fully frozen. No further minting or bridging possible.' },
  { date: 'Apr 13, morning', phase: 'aftermath', title: 'Exchange response', description: 'Upbit and Bithumb paused DOT deposits/withdrawals. DOT price fell to $1.14, approaching ATL.' },
  { date: 'As of Apr 14', phase: 'aftermath', title: 'Funds under monitoring', description: 'No exchange deposits or cross-chain bridge-outs detected. Fund flow tracking ongoing.' },
];

export const fundFlowNodes: FundFlowNode[] = [
  { id: 'railgun-in', label: 'Railgun', type: 'source', x: 350, y: 30 },
  { id: 'attacker', label: '0xC513...F8E7', type: 'attacker', x: 350, y: 100 },
  { id: 'master', label: 'Master Contract', type: 'contract', x: 350, y: 170 },
  { id: 'handler', label: 'HandlerV1', type: 'contract', x: 350, y: 240 },
  { id: 'gateway', label: 'TokenGateway', type: 'contract', x: 350, y: 310 },
  { id: 'dot', label: 'DOT Token', type: 'contract', x: 350, y: 380 },
  { id: 'odos', label: 'Odos Router', type: 'dex', x: 210, y: 460 },
  { id: 'uniswap', label: 'Uniswap V4', type: 'dex', x: 490, y: 460 },
  { id: 'railgun-out', label: 'Railgun Exit', type: 'exit', x: 350, y: 540 },
];

export const fundFlowEdges: FundFlowEdge[] = [
  { from: 'railgun-in', to: 'attacker', label: '0.5 ETH', phase: 'funding' },
  { from: 'attacker', to: 'master', label: 'deploy', phase: 'exploit' },
  { from: 'master', to: 'handler', label: 'forged proof', phase: 'exploit' },
  { from: 'handler', to: 'gateway', label: 'setAdmin()', phase: 'exploit' },
  { from: 'gateway', to: 'dot', label: 'mint(1B)', phase: 'exploit' },
  { from: 'dot', to: 'odos', label: 'DOT swap', phase: 'exit' },
  { from: 'dot', to: 'uniswap', label: 'DOT swap', phase: 'exit' },
  { from: 'odos', to: 'railgun-out', label: 'ETH', phase: 'exit' },
  { from: 'uniswap', to: 'railgun-out', label: 'ETH', phase: 'exit' },
];

export const detections: Detection[] = [
  { module: 'sentinel-static', rule: 'SENT-BRIDGE-006', description: 'VerifyProof() missing leaf_index < leafCount bounds check', leadTime: 'At deployment' },
  { module: 'sentinel-static', rule: 'SENT-BRIDGE-001', description: 'Proof and request not cryptographically linked', leadTime: 'At deployment' },
  { module: 'sentinel-static', rule: 'SENT-SUB-001', description: 'handleChangeAssetAdmin() missing authenticate() modifier', leadTime: 'At deployment' },
  { module: 'sentinel-watchtower', rule: 'SENT-BRIDGE-002', description: 'challengePeriod == 0 in bridge configuration', leadTime: 'At deployment' },
  { module: 'sentinel-watchtower', rule: 'SENT-BRIDGE-003', description: 'Consensus client contract not source-verified', leadTime: 'At deployment' },
  { module: 'sentinel-forensics', rule: 'Behavioral pattern', description: 'New wallet deploying 15+ test contracts against bridge', leadTime: '33 days before' },
];

export const impactData: ImpactItem[] = [
  { category: 'Earlier exploit', value: 'Disputed: ~245 ETH or ~$12,000 (conflicting sources)' },
  { category: 'Primary exploit', value: '108.2 ETH (~$237,000)' },
  { category: 'MEV extractions', value: '~$13,000 (MANTA, CERE)' },
  { category: 'Total realized loss', value: '~$250,000–$787,000 (range reflects earlier exploit dispute)' },
  { category: 'Liquidations', value: '$728,000 in leveraged long positions across downstream markets' },
  { category: 'Notional disrupted', value: '~$20M (Hyperbridge-wrapped pools)' },
  { category: 'DOT price impact', value: '-5% to -10% within 24h' },
  { category: 'Bridge status', value: 'EthereumHost frozen' },
];

export const similarIncidents: SimilarIncident[] = [
  { name: 'Nomad Bridge', date: 'Aug 2022', loss: '$190M', similarity: 'Proof verification bypass — same vulnerability class' },
  { name: 'Wormhole', date: 'Feb 2022', loss: '$320M', similarity: 'Signature bypass — different mechanism, same outcome' },
  { name: 'Ronin Bridge', date: 'Mar 2022', loss: '$625M', similarity: 'Validator compromise — different vector, same impact' },
  { name: 'Poly Network', date: 'Aug 2021', loss: '$611M', similarity: 'Cross-chain admin takeover — directly parallel' },
];

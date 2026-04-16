'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import type { Transfer } from '@/lib/subscan';
import { fetchTransfers } from '@/lib/subscan';
import { fetchEthTransfers } from '@/lib/etherscan';
import { isEthereumChain } from '@/lib/chains';
import { truncateAddress, formatNumber } from '@/lib/explorer-utils';
import { type AddressCategory, type KnownAddress } from '@/lib/known-addresses';
import { useAddressTags } from '@/hooks/useAddressTag';

type NodeType = 'target' | 'system' | 'exchange' | 'bridge' | 'foundation' | 'defi' | 'flagged' | 'scam' | 'attacker' | 'default';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: NodeType;
  volume: number;
  volumeIn: number;
  volumeOut: number;
  txCount: number;
}

interface GraphEdge extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  volume: number;
  txCount: number;
  direction: 'in' | 'out' | 'both';
}

interface NetworkGraphProps {
  transfers: Transfer[];
  targetAddress: string;
  chain: string;
  onAddressClick: (address: string) => void;
}

type LayoutMode = 'force' | 'radial';

const NODE_COLORS: Record<NodeType, string> = {
  target: '#f59e0b',
  system: '#a78bfa',
  exchange: '#22d3ee',
  bridge: '#f59e0b',
  foundation: '#34d399',
  defi: '#60a5fa',
  flagged: '#f87171',
  scam: '#dc2626',
  attacker: '#ef4444',
  default: '#64748b',
};

const CATEGORY_TO_NODE_TYPE: Record<AddressCategory, NodeType> = {
  system: 'system',
  exchange: 'exchange',
  bridge: 'bridge',
  foundation: 'foundation',
  defi: 'defi',
  validator: 'defi',
  flagged: 'flagged',
  scam: 'scam',
  attacker: 'attacker',
  mixer: 'flagged',
  crowdloan: 'system',
  parachain: 'system',
  identity: 'default',
};

function getNodeType(address: string, isTarget: boolean, tags: Map<string, KnownAddress>): NodeType {
  if (isTarget) return 'target';
  const known = tags.get(address.toLowerCase());
  if (!known) return 'default';
  return CATEGORY_TO_NODE_TYPE[known.category] || 'default';
}

function lookupTag(address: string, tags: Map<string, KnownAddress>): KnownAddress | undefined {
  return tags.get(address.toLowerCase());
}

function buildGraphData(
  transfers: Transfer[],
  targetAddress: string,
  minVolume: number,
  tags: Map<string, KnownAddress>,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const target = targetAddress.toLowerCase();
  const counterparties = new Map<string, { volumeIn: number; volumeOut: number; txCount: number }>();

  for (const t of transfers) {
    const from = t.from.toLowerCase();
    const to = t.to.toLowerCase();
    const amount = parseFloat(t.amount || '0');
    if (from === target && to !== target) {
      const e = counterparties.get(to) || { volumeIn: 0, volumeOut: 0, txCount: 0 };
      e.volumeOut += amount;
      e.txCount++;
      counterparties.set(to, e);
    } else if (to === target && from !== target) {
      const e = counterparties.get(from) || { volumeIn: 0, volumeOut: 0, txCount: 0 };
      e.volumeIn += amount;
      e.txCount++;
      counterparties.set(from, e);
    }
  }

  const sorted = Array.from(counterparties.entries())
    .map(([addr, data]) => ({
      addr,
      totalVolume: data.volumeIn + data.volumeOut,
      ...data,
    }))
    .filter(d => d.totalVolume >= minVolume)
    .sort((a, b) => b.totalVolume - a.totalVolume)
    .slice(0, 50);

  const nodes: GraphNode[] = [
    {
      id: targetAddress,
      label: lookupTag(targetAddress, tags)?.tag || truncateAddress(targetAddress, 6, 4),
      type: 'target',
      volume: 0,
      volumeIn: 0,
      volumeOut: 0,
      txCount: transfers.length,
    },
    ...sorted.map(d => {
      const known = lookupTag(d.addr, tags);
      return {
        id: d.addr,
        label: known?.tag || truncateAddress(d.addr, 6, 4),
        type: getNodeType(d.addr, false, tags),
        volume: d.totalVolume,
        volumeIn: d.volumeIn,
        volumeOut: d.volumeOut,
        txCount: d.txCount,
      };
    }),
  ];

  const edges: GraphEdge[] = sorted.map(d => {
    let direction: 'in' | 'out' | 'both' = 'both';
    if (d.volumeIn > 0 && d.volumeOut === 0) direction = 'in';
    else if (d.volumeOut > 0 && d.volumeIn === 0) direction = 'out';

    return {
      source: direction === 'in' ? d.addr : targetAddress,
      target: direction === 'in' ? targetAddress : d.addr,
      volume: d.totalVolume,
      txCount: d.txCount,
      direction,
    };
  });

  return { nodes, edges };
}

export function NetworkGraph({ transfers, targetAddress, chain, onAddressClick }: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<LayoutMode>('force');
  const [minVolume, setMinVolume] = useState(0);
  const [showEdgeLabels, setShowEdgeLabels] = useState(false);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    node?: GraphNode;
    edge?: GraphEdge;
  } | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [allTransfers, setAllTransfers] = useState(transfers);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphEdge> | null>(null);

  const totalCounterparties = new Set(
    transfers
      .map(t => (t.from === targetAddress ? t.to : t.from))
      .filter(a => a !== targetAddress),
  ).size;

  // Collect all unique addresses for bulk tag resolution
  const allAddresses = useMemo(() => {
    const set = new Set<string>([targetAddress]);
    for (const t of allTransfers) {
      set.add(t.from);
      set.add(t.to);
    }
    return Array.from(set);
  }, [allTransfers, targetAddress]);

  const { tags } = useAddressTags(allAddresses, chain);

  const graphData = buildGraphData(allTransfers, targetAddress, minVolume, tags);

  const expandNode = useCallback(
    async (nodeId: string) => {
      if (expandedNodes.has(nodeId) || nodeId === targetAddress) return;
      try {
        const res = isEthereumChain(chain)
          ? await fetchEthTransfers(nodeId, 0, 100)
          : await fetchTransfers(nodeId, chain, 0, 100);
        if (res.transfers) {
          setAllTransfers(prev => [...prev, ...res.transfers!]);
          setExpandedNodes(prev => new Set([...prev, nodeId]));
        }
      } catch {
        // Silently fail — graph just doesn't expand
      }
    },
    [expandedNodes, targetAddress, chain],
  );

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 500;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

    const defs = svg.append('defs');

    // Arrowhead markers — one per edge color
    const markerColors = [
      { id: 'arrow-in', color: '#34d399' },
      { id: 'arrow-out', color: '#f87171' },
      { id: 'arrow-both', color: '#94a3b8' },
      { id: 'arrow-dim', color: '#2a3040' },
    ];
    for (const mc of markerColors) {
      defs
        .append('marker')
        .attr('id', mc.id)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 20)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', mc.color);
    }

    // Target node glow filter
    const glow = defs.append('filter').attr('id', 'target-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glow.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', '4').attr('result', 'blur');
    glow.append('feColorMatrix').attr('in', 'blur').attr('type', 'matrix').attr('values', '1 0 0 0 0  0.8 0.6 0 0 0  0 0 0 0 0  0 0 0 0.6 0');
    const merge = glow.append('feMerge');
    merge.append('feMergeNode').attr('in', 'blur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Scam/attacker pulsing red glow filter
    const scamGlow = defs.append('filter').attr('id', 'scam-glow').attr('x', '-80%').attr('y', '-80%').attr('width', '260%').attr('height', '260%');
    scamGlow.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', '6').attr('result', 'blur');
    scamGlow.append('feColorMatrix').attr('in', 'blur').attr('type', 'matrix').attr('values', '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.8 0');
    const scamMerge = scamGlow.append('feMerge');
    scamMerge.append('feMergeNode').attr('in', 'blur');
    scamMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // CSS animation for pulsing scam glow
    defs.append('style').text(`
      @keyframes scam-pulse {
        0%, 100% { opacity: 0.4; r: attr(r); }
        50% { opacity: 0.8; }
      }
      .scam-pulse-ring {
        animation: scam-pulse 1.5s ease-in-out infinite;
      }
    `);

    const g = svg.append('g');

    // Zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', event => g.attr('transform', event.transform));
    svg.call(zoom);

    const { nodes, edges } = graphData;
    if (nodes.length < 2) return;

    const maxVolume = Math.max(...edges.map(e => e.volume), 1);
    const volumeScale = d3.scaleLog().domain([1, maxVolume]).range([1, 6]).clamp(true);
    const nodeScale = d3.scaleLog().domain([1, maxVolume]).range([6, 24]).clamp(true);

    // Simulation
    const sim = d3
      .forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphEdge>(edges).id(d => d.id).distance(140))
      .force('charge', d3.forceManyBody().strength(-350))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => {
        const n = d as GraphNode;
        return (n.type === 'target' ? 24 : nodeScale(Math.max(1, n.volume))) + 8;
      }));

    if (layout === 'radial') {
      sim.force(
        'radial',
        d3
          .forceRadial(180, width / 2, height / 2)
          .strength(n => ((n as GraphNode).type === 'target' ? 0 : 0.3)),
      );
    }

    simulationRef.current = sim;

    function edgeColor(d: GraphEdge) {
      if (d.direction === 'in') return '#34d399';
      if (d.direction === 'out') return '#f87171';
      return '#94a3b8';
    }

    function edgeMarkerId(d: GraphEdge) {
      if (d.direction === 'in') return 'url(#arrow-in)';
      if (d.direction === 'out') return 'url(#arrow-out)';
      return 'url(#arrow-both)';
    }

    // Build neighbor map for hover highlight
    const neighbors = new Map<string, Set<string>>();
    for (const e of edges) {
      const sid = typeof e.source === 'string' ? e.source : e.source.id;
      const tid = typeof e.target === 'string' ? e.target : e.target.id;
      if (!neighbors.has(sid)) neighbors.set(sid, new Set());
      if (!neighbors.has(tid)) neighbors.set(tid, new Set());
      neighbors.get(sid)!.add(tid);
      neighbors.get(tid)!.add(sid);
    }

    function isConnected(a: string, b: string) {
      return a === b || neighbors.get(a)?.has(b) || false;
    }

    // ── Edges ──
    const linkGroup = g.append('g');

    const link = linkGroup
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('stroke', edgeColor)
      .attr('stroke-width', d => volumeScale(Math.max(1, d.volume)))
      .attr('stroke-opacity', 0)
      .attr('marker-end', edgeMarkerId)
      .on('mouseenter', (event, d) => {
        const rect = container.getBoundingClientRect();
        setTooltip({ x: event.clientX - rect.left, y: event.clientY - rect.top - 10, edge: d });
      })
      .on('mouseleave', () => setTooltip(null));

    // Fade edges in
    link.transition().duration(600).attr('stroke-opacity', 0.5);

    // ── Edge labels ──
    const edgeLabelGroup = g.append('g').attr('class', 'edge-labels');

    const edgeLabel = edgeLabelGroup
      .selectAll('text')
      .data(edges)
      .join('text')
      .text(d => formatNumber(d.volume))
      .attr('text-anchor', 'middle')
      .attr('fill', '#5a6478')
      .attr('font-size', '8px')
      .attr('font-family', 'var(--font-jetbrains), monospace')
      .attr('opacity', showEdgeLabels ? 0.7 : 0)
      .attr('pointer-events', 'none');

    // ── Nodes ──
    const nodeGroup = g.append('g');

    const node = nodeGroup
      .selectAll<SVGGElement, GraphNode>('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .attr('opacity', 0)
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) sim.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }),
      );

    // Fade nodes in
    node.transition().duration(600).delay((_d, i) => i * 20).attr('opacity', 1);

    // Outer glow ring for target node
    node
      .filter(d => d.type === 'target')
      .append('circle')
      .attr('r', 28)
      .attr('fill', 'none')
      .attr('stroke', NODE_COLORS.target)
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.3)
      .attr('filter', 'url(#target-glow)');

    // Pulsing red glow ring for scam/attacker nodes
    node
      .filter(d => d.type === 'scam' || d.type === 'attacker')
      .append('circle')
      .attr('class', 'scam-pulse-ring')
      .attr('r', d => nodeScale(Math.max(1, d.volume)) + 8)
      .attr('fill', 'none')
      .attr('stroke', d => NODE_COLORS[d.type])
      .attr('stroke-width', 2.5)
      .attr('stroke-opacity', 0.5)
      .attr('filter', 'url(#scam-glow)');

    // Second outer ring for scam nodes (stronger emphasis)
    node
      .filter(d => d.type === 'scam')
      .append('circle')
      .attr('class', 'scam-pulse-ring')
      .attr('r', d => nodeScale(Math.max(1, d.volume)) + 14)
      .attr('fill', 'none')
      .attr('stroke', NODE_COLORS.scam)
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.25)
      .style('animation-delay', '0.75s');

    // Main circle
    node
      .append('circle')
      .attr('class', 'node-circle')
      .attr('r', d => (d.type === 'target' ? 20 : nodeScale(Math.max(1, d.volume))))
      .attr('fill', d => NODE_COLORS[d.type])
      .attr('stroke', d => (d.type === 'target' ? '#fff' : 'rgba(255,255,255,0.1)'))
      .attr('stroke-width', d => (d.type === 'target' ? 2.5 : 1))
      .attr('opacity', 0.9);

    // Labels — positioned with collision-aware offset
    node
      .append('text')
      .attr('class', 'node-label')
      .text(d => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', d => {
        const r = d.type === 'target' ? 20 : nodeScale(Math.max(1, d.volume));
        return r + 14;
      })
      .attr('fill', '#8B95A8')
      .attr('font-size', d => (d.type === 'target' ? '11px' : '9px'))
      .attr('font-weight', d => (d.type === 'target' ? '600' : '400'))
      .attr('font-family', 'var(--font-jetbrains), monospace')
      .attr('paint-order', 'stroke')
      .attr('stroke', 'var(--color-bg-surface, #0d1117)')
      .attr('stroke-width', '3px')
      .attr('stroke-linejoin', 'round');

    // Tag labels — show known address tag below the address label
    node
      .filter(d => {
        const known = lookupTag(d.id, tags);
        return !!known && d.type !== 'target';
      })
      .append('text')
      .attr('class', 'node-tag')
      .text(d => lookupTag(d.id, tags)?.tag || '')
      .attr('text-anchor', 'middle')
      .attr('dy', d => {
        const r = nodeScale(Math.max(1, d.volume));
        return r + 25;
      })
      .attr('fill', d => NODE_COLORS[d.type])
      .attr('font-size', '8px')
      .attr('font-weight', '600')
      .attr('font-family', 'var(--font-jetbrains), monospace')
      .attr('paint-order', 'stroke')
      .attr('stroke', 'var(--color-bg-surface, #0d1117)')
      .attr('stroke-width', '2px')
      .attr('stroke-linejoin', 'round');

    // ── Hover highlight ──
    node
      .on('mouseenter', (event, d) => {
        // Dim non-connected nodes and edges
        node.select('.node-circle').transition().duration(150)
          .attr('opacity', (n: unknown) => isConnected(d.id, (n as GraphNode).id) ? 0.95 : 0.15);
        node.select('.node-label').transition().duration(150)
          .attr('opacity', (n: unknown) => isConnected(d.id, (n as GraphNode).id) ? 1 : 0.15);
        link.transition().duration(150)
          .attr('stroke-opacity', (e: unknown) => {
            const edge = e as GraphEdge;
            const sid = typeof edge.source === 'string' ? edge.source : (edge.source as GraphNode).id;
            const tid = typeof edge.target === 'string' ? edge.target : (edge.target as GraphNode).id;
            return sid === d.id || tid === d.id ? 0.85 : 0.05;
          })
          .attr('marker-end', (e: unknown) => {
            const edge = e as GraphEdge;
            const sid = typeof edge.source === 'string' ? edge.source : (edge.source as GraphNode).id;
            const tid = typeof edge.target === 'string' ? edge.target : (edge.target as GraphNode).id;
            return sid === d.id || tid === d.id ? edgeMarkerId(edge) : 'url(#arrow-dim)';
          });

        // Show edge labels for connected edges only
        edgeLabel.transition().duration(150)
          .attr('opacity', (e: unknown) => {
            const edge = e as GraphEdge;
            const sid = typeof edge.source === 'string' ? edge.source : (edge.source as GraphNode).id;
            const tid = typeof edge.target === 'string' ? edge.target : (edge.target as GraphNode).id;
            return sid === d.id || tid === d.id ? 0.9 : 0;
          });

        const rect = container.getBoundingClientRect();
        setTooltip({ x: event.clientX - rect.left, y: event.clientY - rect.top - 10, node: d });
      })
      .on('mousemove', (event, d) => {
        const rect = container.getBoundingClientRect();
        setTooltip({ x: event.clientX - rect.left, y: event.clientY - rect.top - 10, node: d });
      })
      .on('mouseleave', () => {
        // Restore all
        node.select('.node-circle').transition().duration(300).attr('opacity', 0.9);
        node.select('.node-label').transition().duration(300).attr('opacity', 1);
        link.transition().duration(300)
          .attr('stroke-opacity', 0.5)
          .attr('marker-end', (e: unknown) => edgeMarkerId(e as GraphEdge));
        edgeLabel.transition().duration(300).attr('opacity', showEdgeLabels ? 0.7 : 0);
        setTooltip(null);
      });

    // Click to navigate, double-click to expand
    node.on('click', (_event, d) => {
      onAddressClick(d.id);
    });
    node.on('dblclick', (_event, d) => {
      expandNode(d.id);
    });

    sim.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x!)
        .attr('y1', d => (d.source as GraphNode).y!)
        .attr('x2', d => (d.target as GraphNode).x!)
        .attr('y2', d => (d.target as GraphNode).y!);

      edgeLabel
        .attr('x', d => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2)
        .attr('y', d => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2 - 4);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => {
      sim.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphData.nodes.length, graphData.edges.length, layout, minVolume, showEdgeLabels, targetAddress, tags]);

  const resetLayout = () => {
    if (simulationRef.current) {
      simulationRef.current.alpha(1).restart();
    }
  };

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1">
          {(['force', 'radial'] as LayoutMode[]).map(l => (
            <button
              key={l}
              onClick={() => setLayout(l)}
              className="px-3 py-1 rounded text-xs"
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                backgroundColor: layout === l ? 'var(--color-accent-muted)' : 'transparent',
                color: layout === l ? 'var(--color-accent-primary)' : 'var(--color-text-tertiary)',
                border: `1px solid ${layout === l ? 'var(--color-accent-border)' : 'var(--color-border-default)'}`,
                cursor: 'pointer',
              }}
            >
              {l === 'force' ? 'Force' : 'Radial'}
            </button>
          ))}
        </div>

        <label
          className="flex items-center gap-2 text-xs"
          style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-jetbrains), monospace' }}
        >
          Min volume:
          <input
            type="range"
            min={0}
            max={100}
            value={minVolume}
            onChange={e => setMinVolume(Number(e.target.value))}
            className="w-24"
          />
          <span style={{ fontFeatureSettings: '"tnum"' }}>{minVolume}</span>
        </label>

        <button
          onClick={() => setShowEdgeLabels(v => !v)}
          className="px-3 py-1 rounded text-xs"
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            backgroundColor: showEdgeLabels ? 'var(--color-accent-muted)' : 'transparent',
            color: showEdgeLabels ? 'var(--color-accent-primary)' : 'var(--color-text-tertiary)',
            border: `1px solid ${showEdgeLabels ? 'var(--color-accent-border)' : 'var(--color-border-default)'}`,
            cursor: 'pointer',
          }}
        >
          Volumes
        </button>

        <button
          onClick={resetLayout}
          className="px-3 py-1 rounded text-xs"
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            color: 'var(--color-text-tertiary)',
            border: '1px solid var(--color-border-default)',
            backgroundColor: 'transparent',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>

        {totalCounterparties > 50 && (
          <span
            className="text-xs ml-auto"
            style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-jetbrains), monospace' }}
          >
            Showing top 50 of {totalCounterparties}
          </span>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-3">
        {[
          { label: 'Target', color: NODE_COLORS.target },
          { label: 'Exchange', color: NODE_COLORS.exchange },
          { label: 'System', color: NODE_COLORS.system },
          { label: 'Bridge', color: NODE_COLORS.bridge },
          { label: 'Foundation', color: NODE_COLORS.foundation },
          { label: 'DeFi', color: NODE_COLORS.defi },
          { label: 'Scam', color: NODE_COLORS.scam },
          { label: 'Attacker', color: NODE_COLORS.attacker },
          { label: 'Flagged', color: NODE_COLORS.flagged },
          { label: 'Unknown', color: NODE_COLORS.default },
          { label: 'Inflow', color: '#34d399', line: true },
          { label: 'Outflow', color: '#f87171', line: true },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            {item.line ? (
              <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: item.color }} />
            ) : (
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            )}
            {item.label}
          </div>
        ))}
      </div>

      <p className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
        Hover to highlight connections. Click to navigate. Double-click to expand. Drag to reposition. Scroll to zoom.
      </p>

      {/* Graph container */}
      <div
        ref={containerRef}
        className="relative rounded-lg overflow-hidden"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-default)',
          minHeight: 500,
        }}
      >
        <svg ref={svgRef} style={{ width: '100%', height: 500 }} />

        {/* Card-style tooltip */}
        {tooltip && (
          <div
            className="absolute pointer-events-none rounded-lg"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border-default)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              fontFamily: 'var(--font-jetbrains), monospace',
              zIndex: 10,
              transform: 'translate(-50%, -100%)',
              minWidth: 180,
            }}
          >
            {tooltip.node && (
              <div className="p-3">
                {/* Node tooltip */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: NODE_COLORS[tooltip.node.type] }}
                  />
                  <span
                    className="text-xs font-semibold truncate"
                    style={{ color: 'var(--color-text-primary)', maxWidth: 200 }}
                  >
                    {lookupTag(tooltip.node.id, tags)?.tag || tooltip.node.label}
                  </span>
                </div>
                <div className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)', wordBreak: 'break-all', fontSize: '9px' }}>
                  {tooltip.node.id}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span style={{ color: 'var(--color-text-tertiary)' }}>Transactions</span>
                  <span style={{ color: 'var(--color-text-secondary)', textAlign: 'right' }}>{tooltip.node.txCount}</span>
                  {tooltip.node.type !== 'target' && (
                    <>
                      <span style={{ color: '#34d399' }}>Inflow</span>
                      <span style={{ color: 'var(--color-text-secondary)', textAlign: 'right' }}>{formatNumber(tooltip.node.volumeIn)}</span>
                      <span style={{ color: '#f87171' }}>Outflow</span>
                      <span style={{ color: 'var(--color-text-secondary)', textAlign: 'right' }}>{formatNumber(tooltip.node.volumeOut)}</span>
                    </>
                  )}
                </div>
              </div>
            )}
            {tooltip.edge && (
              <div className="p-3">
                {/* Edge tooltip */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-4 h-0.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        tooltip.edge.direction === 'in' ? '#34d399' : tooltip.edge.direction === 'out' ? '#f87171' : '#94a3b8',
                    }}
                  />
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {tooltip.edge.direction === 'in' ? 'Inflow' : tooltip.edge.direction === 'out' ? 'Outflow' : 'Bidirectional'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span style={{ color: 'var(--color-text-tertiary)' }}>Volume</span>
                  <span style={{ color: 'var(--color-text-secondary)', textAlign: 'right' }}>{formatNumber(tooltip.edge.volume)}</span>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>Transactions</span>
                  <span style={{ color: 'var(--color-text-secondary)', textAlign: 'right' }}>{tooltip.edge.txCount}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

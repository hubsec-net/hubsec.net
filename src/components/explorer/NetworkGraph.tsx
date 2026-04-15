'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { Transfer } from '@/lib/subscan';
import { fetchTransfers } from '@/lib/subscan';
import { truncateAddress } from '@/lib/explorer-utils';
import { lookupAddress } from '@/lib/known-addresses';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'target' | 'exchange' | 'treasury' | 'flagged' | 'default';
  volume: number;
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

const NODE_COLORS: Record<GraphNode['type'], string> = {
  target: '#f59e0b',
  exchange: '#22d3ee',
  treasury: '#a78bfa',
  flagged: '#f87171',
  default: '#64748b',
};

function getNodeType(address: string, isTarget: boolean): GraphNode['type'] {
  if (isTarget) return 'target';
  const known = lookupAddress(address);
  if (!known) return 'default';
  if (known.category === 'exchange') return 'exchange';
  if (known.category === 'treasury' || known.category === 'foundation') return 'treasury';
  return 'default';
}

function buildGraphData(
  transfers: Transfer[],
  targetAddress: string,
  minVolume: number,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const counterparties = new Map<string, { volumeIn: number; volumeOut: number; txCount: number }>();

  for (const t of transfers) {
    const amount = parseFloat(t.amount || '0');
    if (t.from === targetAddress && t.to !== targetAddress) {
      const e = counterparties.get(t.to) || { volumeIn: 0, volumeOut: 0, txCount: 0 };
      e.volumeOut += amount;
      e.txCount++;
      counterparties.set(t.to, e);
    } else if (t.to === targetAddress && t.from !== targetAddress) {
      const e = counterparties.get(t.from) || { volumeIn: 0, volumeOut: 0, txCount: 0 };
      e.volumeIn += amount;
      e.txCount++;
      counterparties.set(t.from, e);
    }
  }

  // Sort by total volume and take top 50
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
      label: lookupAddress(targetAddress)?.tag || truncateAddress(targetAddress, 6, 4),
      type: 'target',
      volume: 0,
      txCount: transfers.length,
    },
    ...sorted.map(d => {
      const known = lookupAddress(d.addr);
      return {
        id: d.addr,
        label: known?.tag || truncateAddress(d.addr, 6, 4),
        type: getNodeType(d.addr, false),
        volume: d.totalVolume,
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
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [allTransfers, setAllTransfers] = useState(transfers);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphEdge> | null>(null);

  const totalCounterparties = new Set(
    transfers
      .map(t => t.from === targetAddress ? t.to : t.from)
      .filter(a => a !== targetAddress)
  ).size;

  const graphData = buildGraphData(allTransfers, targetAddress, minVolume);

  const expandNode = useCallback(async (nodeId: string) => {
    if (expandedNodes.has(nodeId) || nodeId === targetAddress) return;
    try {
      const res = await fetchTransfers(nodeId, chain, 0, 100);
      if (res.transfers) {
        setAllTransfers(prev => [...prev, ...res.transfers!]);
        setExpandedNodes(prev => new Set([...prev, nodeId]));
      }
    } catch {
      // Silently fail — graph just doesn't expand
    }
  }, [expandedNodes, targetAddress, chain]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 500;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

    // Arrowhead marker
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#5A6478');

    const g = svg.append('g');

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom);

    const { nodes, edges } = graphData;
    if (nodes.length < 2) return;

    const maxVolume = Math.max(...edges.map(e => e.volume), 1);
    const volumeScale = d3.scaleLog().domain([1, maxVolume]).range([1, 6]).clamp(true);
    const nodeScale = d3.scaleLog().domain([1, maxVolume]).range([6, 24]).clamp(true);

    // Simulation
    const sim = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphEdge>(edges).id(d => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    if (layout === 'radial') {
      sim.force('radial', d3.forceRadial(180, width / 2, height / 2).strength(n => (n as GraphNode).type === 'target' ? 0 : 0.3));
    }

    simulationRef.current = sim;

    // Edges
    const link = g.append('g')
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('stroke', d => {
        if (d.direction === 'in') return '#34d399';
        if (d.direction === 'out') return '#f87171';
        return '#94a3b8';
      })
      .attr('stroke-width', d => volumeScale(Math.max(1, d.volume)))
      .attr('stroke-opacity', 0.5)
      .attr('marker-end', 'url(#arrowhead)')
      .on('mouseenter', (event, d) => {
        const rect = container.getBoundingClientRect();
        setTooltip({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top - 40,
          content: `${d.volume.toFixed(2)} total | ${d.txCount} txs`,
        });
      })
      .on('mouseleave', () => setTooltip(null));

    // Nodes
    const node = g.append('g')
      .selectAll<SVGGElement, GraphNode>('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, GraphNode>()
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
          })
      );

    node.append('circle')
      .attr('r', d => d.type === 'target' ? 20 : nodeScale(Math.max(1, d.volume)))
      .attr('fill', d => NODE_COLORS[d.type])
      .attr('stroke', d => d.type === 'target' ? '#fff' : 'none')
      .attr('stroke-width', d => d.type === 'target' ? 2 : 0)
      .attr('opacity', 0.85);

    node.append('text')
      .text(d => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', d => (d.type === 'target' ? 32 : nodeScale(Math.max(1, d.volume)) + 14))
      .attr('fill', '#8B95A8')
      .attr('font-size', '10px')
      .attr('font-family', 'var(--font-jetbrains), monospace');

    // Click to show details, double-click to expand
    node.on('click', (_event, d) => {
      onAddressClick(d.id);
    });

    node.on('dblclick', (_event, d) => {
      expandNode(d.id);
    });

    node.on('mouseenter', (event, d) => {
      const rect = container.getBoundingClientRect();
      setTooltip({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top - 40,
        content: `${d.id.slice(0, 12)}... | ${d.txCount} txs | vol: ${d.volume.toFixed(2)}`,
      });
    })
    .on('mouseleave', () => setTooltip(null));

    sim.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x!)
        .attr('y1', d => (d.source as GraphNode).y!)
        .attr('x2', d => (d.target as GraphNode).x!)
        .attr('y2', d => (d.target as GraphNode).y!);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => { sim.stop(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphData.nodes.length, graphData.edges.length, layout, minVolume, targetAddress]);

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

        <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-jetbrains), monospace' }}>
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
          Reset layout
        </button>

        {totalCounterparties > 50 && (
          <span className="text-xs ml-auto" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-jetbrains), monospace' }}>
            Showing top 50 of {totalCounterparties} counterparties
          </span>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-3">
        {[
          { label: 'Target', color: NODE_COLORS.target },
          { label: 'Exchange', color: NODE_COLORS.exchange },
          { label: 'Treasury', color: NODE_COLORS.treasury },
          { label: 'Unknown', color: NODE_COLORS.default },
          { label: 'Inflow', color: '#34d399' },
          { label: 'Outflow', color: '#f87171' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </div>
        ))}
      </div>

      <p className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
        Click a node to navigate. Double-click to expand connections. Drag to reposition. Scroll to zoom.
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
        {tooltip && (
          <div
            className="absolute pointer-events-none px-2 py-1 rounded text-xs"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border-default)',
              color: 'var(--color-text-secondary)',
              fontFamily: 'var(--font-jetbrains), monospace',
              zIndex: 10,
              transform: 'translateX(-50%)',
            }}
          >
            {tooltip.content}
          </div>
        )}
      </div>
    </div>
  );
}

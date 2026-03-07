import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const QUALITY_COLOR = {
  major:      '#f0a500',
  minor:      '#4a90d9',
  diminished: '#c0392b',
  augmented:  '#8e44ad',
};

const LINK_STYLE = {
  adjacent:    { stroke: '#555', strokeWidth: 1.5, dash: '6,4' },
  dominant:    { stroke: '#f0a500', strokeWidth: 2.5, dash: null },
  subdominant: { stroke: '#4a90d9', strokeWidth: 2, dash: '3,3' },
};

const NODE_R = 38;
const SELECTED_R = 44;

function getFontSize(name) {
  if (name.length >= 6) return '10px';
  if (name.length >= 4) return '12px';
  return '16px';
}

export default function HarmonicGraph({ field, selectedId, onSelect, useTetrads }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!field || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 600;
    const height = svgRef.current.clientHeight || 560;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.36;

    const { nodes, links } = field;
    const n = nodes.length;

    // Position nodes on a circle
    const positioned = nodes.map((node, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      return {
        ...node,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });

    const byId = Object.fromEntries(positioned.map(n => [n.id, n]));

    const g = svg.append('g');

    // Draw links
    links.forEach(link => {
      const src = byId[link.source];
      const tgt = byId[link.target];
      if (!src || !tgt) return;
      const style = LINK_STYLE[link.type] || LINK_STYLE.adjacent;

      // Offset line endpoints to circle edge
      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ux = dx / dist;
      const uy = dy / dist;

      g.append('line')
        .attr('x1', src.x + ux * NODE_R)
        .attr('y1', src.y + uy * NODE_R)
        .attr('x2', tgt.x - ux * NODE_R)
        .attr('y2', tgt.y - uy * NODE_R)
        .attr('stroke', style.stroke)
        .attr('stroke-width', style.strokeWidth)
        .attr('stroke-dasharray', style.dash || null)
        .attr('opacity', 0.7);
    });

    // Draw nodes
    positioned.forEach(node => {
      const isSelected = node.id === selectedId;
      const r = isSelected ? SELECTED_R : NODE_R;
      const color = QUALITY_COLOR[node.quality] || '#aaa';
      const displayName = useTetrads ? node.name7 : node.id;
      const displayRoman = useTetrads ? node.roman7 : node.roman;

      const nodeG = g.append('g')
        .attr('transform', `translate(${node.x},${node.y})`)
        .style('cursor', 'pointer')
        .on('click', () => onSelect(node));

      // Glow ring for selected
      if (isSelected) {
        nodeG.append('circle')
          .attr('r', r + 6)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', 2.5)
          .attr('opacity', 0.5);
      }

      nodeG.append('circle')
        .attr('r', r)
        .attr('fill', color)
        .attr('opacity', isSelected ? 1 : 0.85)
        .attr('stroke', isSelected ? '#fff' : 'transparent')
        .attr('stroke-width', 2);

      // Roman numeral (top)
      nodeG.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-8px')
        .attr('font-size', '10px')
        .attr('fill', 'rgba(255,255,255,0.75)')
        .attr('font-family', 'sans-serif')
        .text(displayRoman);

      // Chord name (center)
      nodeG.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '8px')
        .attr('font-size', getFontSize(displayName))
        .attr('fill', '#fff')
        .attr('font-weight', 'bold')
        .attr('font-family', 'sans-serif')
        .text(displayName);
    });

    // Legend
    const legendData = [
      { label: 'Maior', color: QUALITY_COLOR.major },
      { label: 'Menor', color: QUALITY_COLOR.minor },
      { label: 'Diminuto', color: QUALITY_COLOR.diminished },
    ];
    const legend = svg.append('g').attr('transform', 'translate(16, 16)');
    legendData.forEach((item, i) => {
      const row = legend.append('g').attr('transform', `translate(0, ${i * 20})`);
      row.append('circle').attr('r', 6).attr('cx', 6).attr('cy', 0).attr('fill', item.color).attr('opacity', 0.9);
      row.append('text').attr('x', 16).attr('y', 4).attr('fill', '#ccc').attr('font-size', '11px')
        .attr('font-family', 'sans-serif').text(item.label);
    });

  }, [field, selectedId, useTetrads]);

  return (
    <svg
      ref={svgRef}
      className="harmonic-graph"
      width="100%"
      height="100%"
    />
  );
}

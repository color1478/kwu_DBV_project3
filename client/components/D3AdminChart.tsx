'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface D3AdminChartProps {
  data: { label: string; value: number }[];
  title: string;
  width?: number;
  height?: number;
}

export default function D3AdminChart({ data, title, width = 400, height = 300 }: D3AdminChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // 파이 차트
    const radius = Math.min(chartWidth, chartHeight) / 2 - 10;
    const pie = d3.pie<{ label: string; value: number }>()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<{ label: string; value: number }>>()
      .innerRadius(0)
      .outerRadius(radius);

    const colorScale = d3.scaleOrdinal<string>()
      .domain(data.map(d => d.label))
      .range(['#cbd5e0', '#a0aec0', '#718096', '#4a5568', '#2d3748']);

    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc')
      .attr('transform', `translate(${chartWidth / 2}, ${chartHeight / 2})`);

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => colorScale(d.data.label))
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('opacity', 0.7)
          .attr('transform', 'scale(1.05)');
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('opacity', 1)
          .attr('transform', 'scale(1)');
      });

    // 레이블
    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .text(d => d.data.value > 0 ? d.data.value : '');

    // 범례
    const legend = g.append('g')
      .attr('transform', `translate(${chartWidth - 100}, 20)`);

    const legendItems = legend.selectAll('.legend-item')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 25})`);

    legendItems.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', d => colorScale(d.label));

    legendItems.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .attr('fill', '#2d3748')
      .attr('font-size', '12px')
      .text(d => `${d.label}: ${d.value}`);

    // 제목
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .attr('fill', '#2d3748')
      .attr('font-size', '14px')
      .attr('font-weight', '700')
      .text(title);

  }, [data, width, height, title]);

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '12px', 
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    }}>
      <svg ref={svgRef} style={{ display: 'block', margin: '0 auto' }}></svg>
    </div>
  );
}


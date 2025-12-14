'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Station {
  station_id: number;
  station_name: string;
  bikes_available: number;
  docks_available: number;
  load_factor?: number;
  color?: string;
}

interface D3VisualizationProps {
  stations: Station[];
}

export default function D3Visualization({ stations }: D3VisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || stations.length === 0) return;

    // 기존 차트 제거
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 60, left: 60 };

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // 부하율별 그룹화 (모든 범례가 항상 표시되도록)
    const grouped = {
      부족: stations.filter(s => (s.load_factor || 0) < 0.5).length,
      보통: stations.filter(s => (s.load_factor || 0) >= 0.5 && (s.load_factor || 0) < 0.8).length,
      양호: stations.filter(s => (s.load_factor || 0) >= 0.8 && (s.load_factor || 0) <= 1.2).length,
      여유: stations.filter(s => (s.load_factor || 0) > 1.2).length,
    };

    // 모든 범례가 항상 표시되도록 (값이 0이어도 포함)
    const data = [
      { label: '부족', value: grouped.부족 },
      { label: '보통', value: grouped.보통 },
      { label: '양호', value: grouped.양호 },
      { label: '여유', value: grouped.여유 },
    ];

    // X 스케일
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.label))
      .range([0, chartWidth])
      .padding(0.2);

    // Y 스케일 (최소값이 0이 되도록, 최대값은 데이터에 따라 조정)
    const maxValue = Math.max(d3.max(data, d => d.value) || 0, 1); // 최소 1로 설정하여 0인 경우도 표시
    const yScale = d3.scaleLinear()
      .domain([0, maxValue])
      .nice()
      .range([chartHeight, 0]);

    // 색상 스케일 (범례 색상: 빨강, 노랑, 초록, 파랑)
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['부족', '보통', '양호', '여유'])
      .range(['#dc3545', '#ffc107', '#28a745', '#007bff']);

    // 바 차트 (값이 0이어도 최소 높이로 표시)
    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.label) || 0)
      .attr('y', d => yScale(d.value))
      .attr('width', xScale.bandwidth())
      .attr('height', d => {
        const height = chartHeight - yScale(d.value);
        // 값이 0이어도 최소 2px 높이로 표시
        return d.value === 0 ? 2 : height;
      })
      .attr('fill', d => colorScale(d.label))
      .attr('rx', 4)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('opacity', 0.7)
          .attr('transform', 'scale(1.05)');
        
        // 툴팁
        const tooltip = g.append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${(xScale(d.label) || 0) + xScale.bandwidth() / 2}, ${yScale(d.value) - 10})`);
        
        tooltip.append('rect')
          .attr('x', -30)
          .attr('y', -20)
          .attr('width', 60)
          .attr('height', 20)
          .attr('fill', '#2d3748')
          .attr('rx', 4);
        
        tooltip.append('text')
          .attr('text-anchor', 'middle')
          .attr('fill', 'white')
          .attr('font-size', '12px')
          .attr('dy', -5)
          .text(`${d.value}개`);
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('opacity', 1)
          .attr('transform', 'scale(1)');
        g.selectAll('.tooltip').remove();
      });

    // X 축
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('fill', '#4a5568')
      .attr('font-size', '14px')
      .attr('font-weight', '600');

    // Y 축
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5))
      .selectAll('text')
      .attr('fill', '#4a5568')
      .attr('font-size', '12px');

    // Y 축 레이블
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -chartHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#4a5568')
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .text('대여소 수');

    // 제목
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .attr('fill', '#2d3748')
      .attr('font-size', '16px')
      .attr('font-weight', '700')
      .text('부하율별 대여소 분포');

  }, [stations]);

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '12px', 
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      marginBottom: '24px'
    }}>
      <svg ref={svgRef} style={{ display: 'block', margin: '0 auto' }}></svg>
    </div>
  );
}


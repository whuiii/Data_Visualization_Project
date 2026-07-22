// js/charts/executiveTreemap.js
import { themeColors, showTip, hideTip } from '../utils/helpers.js';

export function renderExecutiveTreemap(data) {
  const C = themeColors();
  const el = d3.select('#chartExecutiveTreemap');
  el.selectAll('*').remove();
  const W = el.node().clientWidth || 800,
    H = 400,
    M = { t: 10, r: 10, b: 30, l: 10 };
  const svg = el
    .append('svg')
    .attr('width', '100%')
    .attr('height', H)
    .attr('viewBox', `0 0 ${W} ${H}`);

  // Aggregate by major: count and average AI hours
  const majors = Array.from(new Set(data.map(d => d.Major_Category))).sort();
  const agg = majors.map(maj => {
    const sub = data.filter(d => d.Major_Category === maj);
    return {
      major: maj,
      count: sub.length,
      avgAI: sub.length ? d3.mean(sub, d => d.Weekly_GenAI_Hours) : 0,
    };
  }).filter(d => d.count > 0);

  if (agg.length === 0) {
    svg.append('text')
      .attr('x', W / 2)
      .attr('y', H / 2)
      .attr('text-anchor', 'middle')
      .style('fill', 'var(--text-muted)')
      .text('Not enough data to show treemap');
    return;
  }

  // Build hierarchy: root -> children (majors)
  const root = d3.hierarchy({ children: agg })
    .sum(d => d.count) // size = number of students
    .sort((a, b) => d3.descending(a.value, b.value));

  // Treemap layout
  const treemap = d3.treemap()
    .size([W - M.l - M.r, H - M.t - M.b])
    .padding(2)
    .round(true);

  treemap(root);

  // Color scale: average AI hours (light blue to dark blue)
  const maxAI = d3.max(agg, d => d.avgAI);
  const colorScale = d3.scaleSequential()
    .domain([0, maxAI || 1])
    .interpolator(d3.interpolateBlues);

  // Draw each leaf
  const leaves = root.leaves();
  const g = svg.append('g')
    .attr('transform', `translate(${M.l},${M.t})`);

  g.selectAll('rect')
    .data(leaves)
    .enter()
    .append('rect')
    .attr('x', d => d.x0)
    .attr('y', d => d.y0)
    .attr('width', d => d.x1 - d.x0)
    .attr('height', d => d.y1 - d.y0)
    .attr('fill', d => colorScale(d.data.avgAI))
    .attr('stroke', C.surface)
    .attr('stroke-width', 1.5)
    .style('cursor', 'pointer')
    .on('mousemove', (evt, d) => {
      const pct = data.length ? d3.format('.1%')(d.data.count / data.length) : '0%';
      showTip(
        `<b>${d.data.major}</b><div class="t-row"><span>Students</span><span>${d.data.count.toLocaleString()} (${pct})</span></div><div class="t-row"><span>Avg AI hrs/wk</span><span>${d3.format('.1f')(d.data.avgAI)}</span></div>`,
        evt
      );
    })
    .on('mouseleave', hideTip);

  // Add labels (only if rectangle is large enough)
  g.selectAll('text')
    .data(leaves)
    .enter()
    .append('text')
    .attr('x', d => (d.x0 + d.x1) / 2)
    .attr('y', d => (d.y0 + d.y1) / 2)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .style('font-size', '10px')
    .style('font-family', 'Roboto Mono, monospace')
    .style('fill', '#fff')
    .style('pointer-events', 'none')
    .style('text-shadow', '0 0 4px rgba(0,0,0,0.5)')
    .text(d => {
      const w = d.x1 - d.x0;
      const h = d.y1 - d.y0;
      if (w < 40 || h < 30) return '';
      return d.data.major;
    });

  // Legend
  const legend = d3.select('#treemapLegend');
  legend.selectAll('*').remove();
  legend.append('span').html(`<i style="background:${colorScale(0)}"></i> Low AI hrs`);
  legend.append('span').html(`<i style="background:${colorScale(maxAI * 0.5)}"></i> Medium`);
  legend.append('span').html(`<i style="background:${colorScale(maxAI)}"></i> High AI hrs`);
  legend.append('span').text('Area = number of students');
}
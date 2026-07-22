// js/charts/histogram.js
import { themeColors, showTip, hideTip } from '../utils/helpers.js';

export function renderHistogram(data) {
  const C = themeColors();
  const el = d3.select('#chartHistogram');
  el.selectAll('*').remove();

  if (!data || data.length === 0) {
    el.append('p')
      .style('padding', '20px')
      .style('text-align', 'center')
      .style('color', 'var(--text-muted)')
      .text('No data available');
    return;
  }

  const containerWidth = el.node().clientWidth || 400;
  const aspectRatio = 0.7;
  const W = Math.min(containerWidth, 800);
  const H = W * aspectRatio;

  // Increased left margin to accommodate y-axis labels
  const M = { t: 20, r: 20, b: 44, l: 70 };

  const svg = el.append('svg')
    .attr('width', '100%')
    .attr('height', 'auto')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .style('display', 'block');

  const gpa = data.map(d => d.Post_Semester_GPA);
  const bins = d3.bin().domain([0, 4]).thresholds(12)(gpa);
  const x = d3.scaleLinear().domain([0, 4]).range([M.l, W - M.r]);
  const y = d3.scaleLinear()
    .domain([0, d3.max(bins, d => d.length) || 1])
    .nice()
    .range([H - M.b, M.t]);

  // Axes with increased left margin and better formatting
  svg.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0,${H - M.b})`)
    .call(d3.axisBottom(x).ticks(8))
    .style('font-family', 'Roboto Mono, monospace')
    .style('font-size', '10px');

  svg.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(${M.l},0)`)
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('.0f')))
    .style('font-family', 'Roboto Mono, monospace')
    .style('font-size', '10px');

  // Bars
  svg.selectAll('rect')
    .data(bins)
    .enter()
    .append('rect')
    .attr('x', d => x(d.x0))
    .attr('y', d => y(d.length))
    .attr('width', d => Math.max(1, x(d.x1) - x(d.x0) - 1))
    .attr('height', d => y(0) - y(d.length))
    .attr('fill', C.blue)
    .attr('opacity', 0.7)
    .attr('rx', 2)
    .on('mousemove', (evt, d) => {
      showTip(`<b>${d.x0.toFixed(2)} – ${d.x1.toFixed(2)}</b><br>Count: ${d.length}`, evt);
    })
    .on('mouseleave', hideTip);
}
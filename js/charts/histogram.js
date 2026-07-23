// js/charts/histogram.js
import { themeColors, showTip, hideTip, getFontScale } from '../utils/helpers.js';

export function renderHistogram(data) {
  const C = themeColors();
  const fontScale = getFontScale();
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
  // 🔧 Increased left margin to give room for y‑axis label
  const M = { t: 20 * fontScale, r: 20 * fontScale, b: 50 * fontScale, l: 90 * fontScale };

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

  // Axes
  svg.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0,${H - M.b})`)
    .call(d3.axisBottom(x).ticks(8))
    .style('font-family', 'Roboto Mono, monospace')
    .style('font-size', (10 * fontScale) + 'px');

  svg.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(${M.l},0)`)
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('.0f')))
    .style('font-family', 'Roboto Mono, monospace')
    .style('font-size', (10 * fontScale) + 'px');

  // Bars
  svg.selectAll('rect')
    .data(bins)
    .enter().append('rect')
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

  // ─── X‑axis label ────────────────────────────────────────────────
  svg.append('text')
    .attr('x', (M.l + W - M.r) / 2)
    .attr('y', H - 4 * fontScale)
    .style('text-anchor', 'middle')
    .style('font-family', 'Roboto Mono, monospace')
    .style('font-size', (11 * fontScale) + 'px')
    .style('fill', 'var(--text-muted)')
    .style('font-weight', 500)
    .text('Post-Semester GPA');

  // ─── Y‑axis label ────────────────────────────────────────────────
  // Place it further left by using a fixed offset from the axis
  const yLabelOffset = 60 * fontScale; // adjust as needed
  const yLabelX = M.l - yLabelOffset;

  svg.append('text')
    .attr('x', yLabelX)
    .attr('y', (M.t + H - M.b) / 2)
    .style('text-anchor', 'middle')
    .style('font-family', 'Roboto Mono, monospace')
    .style('font-size', (11 * fontScale) + 'px')
    .style('fill', 'var(--text-muted)')
    .style('font-weight', 500)
    .attr('transform', `rotate(-90, ${yLabelX}, ${(M.t + H - M.b) / 2})`)
    .text('Frequency');
}
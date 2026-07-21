// js/charts/histogram.js
import { themeColors, showTip, hideTip } from '../utils/helpers.js';

export function renderHistogram(data) {
  const C = themeColors();
  const el = d3.select('#chartHistogram');
  el.selectAll('*').remove();
  const W = el.node().clientWidth || 400, H = 280, M = { t: 20, r: 20, b: 44, l: 48 };
  const svg = el.append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`);

  const gpa = data.map(d => d.Post_Semester_GPA);
  const bins = d3.bin().domain([0, 4]).thresholds(12)(gpa);
  const x = d3.scaleLinear().domain([0, 4]).range([M.l, W - M.r]);
  const y = d3.scaleLinear().domain([0, d3.max(bins, d => d.length)]).nice().range([H - M.b, M.t]);

  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - M.b})`).call(d3.axisBottom(x).ticks(8));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${M.l},0)`).call(d3.axisLeft(y).ticks(5));

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
// js/charts/boxplot.js
import { themeColors, showTip, hideTip } from '../utils/helpers.js';

export function renderBoxPlot(data) {
  const C = themeColors();
  const el = d3.select('#chartBoxPlot');
  el.selectAll('*').remove();
  const W = el.node().clientWidth || 700, H = 300, M = { t: 20, r: 20, b: 56, l: 48 };
  const svg = el.append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`);

  const groups = ['Low', 'Moderate', 'High', 'Very High'];
  const dataByGroup = groups.map(lvl => {
    const vals = data.filter(d => d.AI_Usage_Level === lvl).map(d => d.GPA_Improvement);
    return { lvl, vals };
  }).filter(d => d.vals.length > 0);

  const x = d3.scaleBand().domain(dataByGroup.map(d => d.lvl)).range([M.l, W - M.r]).padding(0.3);
  const y = d3.scaleLinear()
    .domain([d3.min(dataByGroup.flatMap(d => d.vals)), d3.max(dataByGroup.flatMap(d => d.vals))])
    .nice()
    .range([H - M.b, M.t]);

  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - M.b})`).call(d3.axisBottom(x));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${M.l},0)`).call(d3.axisLeft(y).ticks(6));

  dataByGroup.forEach(d => {
    const sorted = d.vals.sort((a,b) => a - b);
    const q1 = d3.quantile(sorted, 0.25);
    const median = d3.quantile(sorted, 0.5);
    const q3 = d3.quantile(sorted, 0.75);
    const iqr = q3 - q1;
    const lower = Math.max(d3.min(sorted), q1 - 1.5 * iqr);
    const upper = Math.min(d3.max(sorted), q3 + 1.5 * iqr);
    const xPos = x(d.lvl) + x.bandwidth() / 2;

    svg.append('rect')
      .attr('x', x(d.lvl))
      .attr('y', y(q3))
      .attr('width', x.bandwidth())
      .attr('height', y(q1) - y(q3))
      .attr('fill', 'var(--surface-2)')
      .attr('stroke', 'var(--text)')
      .attr('stroke-width', 1.5);

    svg.append('line')
      .attr('x1', x(d.lvl))
      .attr('x2', x(d.lvl) + x.bandwidth())
      .attr('y1', y(median))
      .attr('y2', y(median))
      .attr('stroke', 'var(--accent)')
      .attr('stroke-width', 2);

    svg.append('line')
      .attr('x1', xPos)
      .attr('x2', xPos)
      .attr('y1', y(lower))
      .attr('y2', y(q1))
      .attr('stroke', 'var(--text)')
      .attr('stroke-width', 1);
    svg.append('line')
      .attr('x1', xPos)
      .attr('x2', xPos)
      .attr('y1', y(q3))
      .attr('y2', y(upper))
      .attr('stroke', 'var(--text)')
      .attr('stroke-width', 1);

    const outliers = sorted.filter(v => v < lower || v > upper);
    svg.selectAll(`.outlier-${d.lvl}`)
      .data(outliers)
      .enter()
      .append('circle')
      .attr('cx', xPos)
      .attr('cy', v => y(v))
      .attr('r', 3)
      .attr('fill', C.red)
      .attr('opacity', 0.6);
  });
}
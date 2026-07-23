// js/charts/executiveTrend.js
import { MONTH_ORDER } from '../utils/constants.js';
import { themeColors, showTip, hideTip, getFontScale } from '../utils/helpers.js';

export function renderExecutiveTrend(data) {
  const C = themeColors();
  const fontScale = getFontScale();
  const el = d3.select('#chartExecutiveTrend');
  el.selectAll('*').remove();

  const W = el.node().clientWidth || 600;
  const H = 280;
  const M = { t: 40 * fontScale, r: 20 * fontScale, b: 40 * fontScale, l: 50 * fontScale };
  const svg = el.append('svg')
    .attr('width', '100%')
    .attr('height', H)
    .attr('viewBox', `0 0 ${W} ${H}`)
    .style('display', 'block');

  const months = MONTH_ORDER.filter(m => data.some(d => d.Month === m));
  if (months.length < 2) {
    svg.append('text')
      .attr('x', W/2).attr('y', H/2)
      .attr('text-anchor', 'middle')
      .style('fill', 'var(--text-muted)')
      .style('font-size', (14 * fontScale) + 'px')
      .text('Not enough months to show trend');
    return;
  }

  const agg = months.map(m => {
    const sub = data.filter(d => d.Month === m);
    return { m, avgAI: sub.length ? d3.mean(sub, d => d.Weekly_GenAI_Hours) : 0 };
  });

  const x = d3.scalePoint()
    .domain(months)
    .range([M.l, W - M.r])
    .padding(0.5);
  const y = d3.scaleLinear()
    .domain([0, d3.max(agg, d => d.avgAI) * 1.1 || 10])
    .nice()
    .range([H - M.b, M.t]);

  svg.append('g').attr('class', 'axis')
    .attr('transform', `translate(0,${H - M.b})`)
    .call(d3.axisBottom(x))
    .style('font-size', (10 * fontScale) + 'px');

  svg.append('g').attr('class', 'axis')
    .attr('transform', `translate(${M.l},0)`)
    .call(d3.axisLeft(y).ticks(6).tickFormat(d => d + 'h'))
    .style('font-size', (10 * fontScale) + 'px');

  svg.append('g').attr('class', 'gridline')
    .attr('transform', `translate(${M.l},0)`)
    .call(d3.axisLeft(y).ticks(6).tickSize(-(W - M.l - M.r)).tickFormat(''))
    .style('font-size', (10 * fontScale) + 'px');

  const line = d3.line()
    .x(d => x(d.m))
    .y(d => y(d.avgAI))
    .curve(d3.curveMonotoneX);

  svg.append('path')
    .datum(agg)
    .attr('fill', 'none')
    .attr('stroke', C.blue)
    .attr('stroke-width', 2.5)
    .attr('d', line);

  svg.selectAll('circle')
    .data(agg)
    .enter().append('circle')
    .attr('cx', d => x(d.m))
    .attr('cy', d => y(d.avgAI))
    .attr('r', 5 * fontScale)
    .attr('fill', C.blue)
    .attr('stroke', C.surface)
    .attr('stroke-width', 1.5)
    .style('cursor', 'pointer')
    .on('mousemove', (evt, d) => showTip(
      `<b>${d.m}</b><div class="t-row"><span>Avg AI hrs/wk</span><span>${d3.format('.1f')(d.avgAI)}</span></div>`,
      evt
    ))
    .on('mouseleave', hideTip);
}
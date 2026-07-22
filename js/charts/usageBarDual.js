// js/charts/usageBarDual.js
import { MONTH_ORDER } from '../utils/constants.js';
import { themeColors, showTip, hideTip, getFontScale } from '../utils/helpers.js';

export function renderUsageBarDual(data) {
  const C = themeColors();
  const fontScale = getFontScale();
  const el = d3.select('#chartUsageBarDual');
  el.selectAll('*').remove();

  const W = el.node().clientWidth || 560;
  const H = 280;
  const M = { t: 20 * fontScale, r: 52 * fontScale, b: 44 * fontScale, l: 48 * fontScale };
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
    return {
      m,
      gpa: sub.length ? d3.mean(sub, d => d.GPA_Improvement) : 0,
      aiHrs: sub.length ? d3.mean(sub, d => d.Weekly_GenAI_Hours) : 0
    };
  });

  const x = d3.scaleBand().domain(months).range([M.l, W - M.r]).padding(0.2);
  const xSub = d3.scaleBand().domain(['gpa', 'ai']).range([0, x.bandwidth()]).padding(0.1);
  const gpaExtent = d3.extent(agg, d => d.gpa);
  const yGpa = d3.scaleLinear()
    .domain([Math.min(0, gpaExtent[0]), Math.max(0, gpaExtent[1])])
    .nice()
    .range([H - M.b, M.t]);
  const aiMax = d3.max(agg, d => d.aiHrs) || 1;
  const yAi = d3.scaleLinear()
    .domain([0, aiMax])
    .nice()
    .range([H - M.b, M.t]);

  // Grid
  svg.append('g').attr('class', 'gridline')
    .attr('transform', `translate(${M.l},0)`)
    .call(d3.axisLeft(yGpa).ticks(4).tickSize(-(W - M.l - M.r)).tickFormat(''))
    .style('font-size', (10 * fontScale) + 'px');

  // Bars GPA
  svg.selectAll('.bar-gpa')
    .data(agg)
    .enter().append('rect')
    .attr('class', 'bar-gpa')
    .attr('x', d => x(d.m) + xSub('gpa'))
    .attr('y', d => d.gpa >= 0 ? yGpa(d.gpa) : yGpa(0))
    .attr('width', xSub.bandwidth())
    .attr('height', d => Math.abs(yGpa(d.gpa) - yGpa(0)))
    .attr('fill', C.mint)
    .attr('opacity', 0.8)
    .attr('rx', 2)
    .on('mousemove', (evt, d) => showTip(
      `<b>${d.m}</b><div class="t-row"><span>GPA change</span><span>${d3.format('+.2f')(d.gpa)}</span></div>`,
      evt
    ))
    .on('mouseleave', hideTip);

  // Bars AI
  svg.selectAll('.bar-ai')
    .data(agg)
    .enter().append('rect')
    .attr('class', 'bar-ai')
    .attr('x', d => x(d.m) + xSub('ai'))
    .attr('y', d => yAi(d.aiHrs))
    .attr('width', xSub.bandwidth())
    .attr('height', d => yAi(0) - yAi(d.aiHrs))
    .attr('fill', C.blue)
    .attr('opacity', 0.8)
    .attr('rx', 2)
    .on('mousemove', (evt, d) => showTip(
      `<b>${d.m}</b><div class="t-row"><span>Avg AI hrs/wk</span><span>${d3.format('.1f')(d.aiHrs)}</span></div>`,
      evt
    ))
    .on('mouseleave', hideTip);

  // Axes
  svg.append('g').attr('class', 'axis')
    .attr('transform', `translate(0,${H - M.b})`)
    .call(d3.axisBottom(x))
    .style('font-size', (10 * fontScale) + 'px');

  svg.append('g').attr('class', 'axis')
    .attr('transform', `translate(${M.l},0)`)
    .call(d3.axisLeft(yGpa).ticks(4).tickFormat(d3.format('+.2f')))
    .style('font-size', (10 * fontScale) + 'px');

  svg.append('g').attr('class', 'axis')
    .attr('transform', `translate(${W - M.r},0)`)
    .call(d3.axisRight(yAi).ticks(4).tickFormat(d => d + 'h'))
    .style('font-size', (10 * fontScale) + 'px');

  // Legend
  const legend = d3.select('#usageBarDualLegend');
  legend.selectAll('*').remove();
  legend.append('span')
    .html(`<i style="background:${C.mint}"></i> GPA improvement (left axis)`)
    .style('font-size', (11 * fontScale) + 'px');
  legend.append('span')
    .html(`<i style="background:${C.blue}"></i> Avg AI hours / week (right axis)`)
    .style('font-size', (11 * fontScale) + 'px');
}
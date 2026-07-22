// js/charts/usageLine.js
import { MONTH_ORDER } from '../utils/constants.js';
import { themeColors, showTip, hideTip, getFontScale } from '../utils/helpers.js';

export function renderUsageLine(data) {
  const C = themeColors();
  const fontScale = getFontScale();
  const el = d3.select('#chartUsageLine');
  el.selectAll('*').remove();

  const W = el.node().clientWidth || 560;
  const H = 280;
  const M = { t: 18 * fontScale, r: 52 * fontScale, b: 36 * fontScale, l: 48 * fontScale };
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
      n: sub.length,
      gpa: sub.length ? d3.mean(sub, d => d.GPA_Improvement) : null,
      aiHrs: sub.length ? d3.mean(sub, d => d.Weekly_GenAI_Hours) : null
    };
  });

  const x = d3.scalePoint()
    .domain(months)
    .range([M.l, W - M.r])
    .padding(0.5);

  const gpaVals = agg.filter(d => d.gpa !== null).map(d => d.gpa);
  const yGpa = d3.scaleLinear()
    .domain(gpaVals.length ? d3.extent(gpaVals) : [-0.1, 0.1])
    .nice()
    .range([H - M.b, M.t]);

  const aiVals = agg.filter(d => d.aiHrs !== null).map(d => d.aiHrs);
  const yAi = d3.scaleLinear()
    .domain(aiVals.length ? d3.extent(aiVals) : [0, 10])
    .nice()
    .range([H - M.b, M.t]);

  svg.append('g').attr('class', 'gridline')
    .attr('transform', `translate(${M.l},0)`)
    .call(d3.axisLeft(yGpa).ticks(4).tickSize(-(W - M.l - M.r)).tickFormat(''))
    .style('font-size', (10 * fontScale) + 'px');

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

  const lineGpa = d3.line()
    .x(d => x(d.m))
    .y(d => yGpa(d.gpa))
    .curve(d3.curveMonotoneX);
  const lineAi = d3.line()
    .x(d => x(d.m))
    .y(d => yAi(d.aiHrs))
    .curve(d3.curveMonotoneX);

  const validGpa = agg.filter(d => d.gpa !== null);
  const validAi = agg.filter(d => d.aiHrs !== null);

  if (validGpa.length > 1) {
    svg.append('path')
      .datum(validGpa)
      .attr('fill', 'none')
      .attr('stroke', C.mint)
      .attr('stroke-width', 2.4)
      .attr('d', lineGpa);
  }
  if (validAi.length > 1) {
    svg.append('path')
      .datum(validAi)
      .attr('fill', 'none')
      .attr('stroke', C.blue)
      .attr('stroke-width', 2.4)
      .attr('stroke-dasharray', '5 3')
      .attr('d', lineAi);
  }

  svg.selectAll('circle.gpa')
    .data(validGpa)
    .enter().append('circle')
    .attr('class', 'gpa')
    .attr('cx', d => x(d.m))
    .attr('cy', d => yGpa(d.gpa))
    .attr('r', 4.5 * fontScale)
    .attr('fill', C.mint)
    .attr('stroke', C.surface)
    .attr('stroke-width', 1.5)
    .style('cursor', 'pointer')
    .on('mousemove', (evt, d) => showTip(
      `<b>${d.m}</b><div class="t-row"><span>GPA change</span><span>${d3.format('+.2f')(d.gpa)}</span></div><div class="t-row"><span>n</span><span>${d.n}</span></div>`,
      evt
    ))
    .on('mouseleave', hideTip);

  svg.selectAll('circle.ai')
    .data(validAi)
    .enter().append('circle')
    .attr('class', 'ai')
    .attr('cx', d => x(d.m))
    .attr('cy', d => yAi(d.aiHrs))
    .attr('r', 4.5 * fontScale)
    .attr('fill', C.blue)
    .attr('stroke', C.surface)
    .attr('stroke-width', 1.5)
    .style('cursor', 'pointer')
    .on('mousemove', (evt, d) => showTip(
      `<b>${d.m}</b><div class="t-row"><span>Avg AI hrs/wk</span><span>${d3.format('.1f')(d.aiHrs)}</span></div><div class="t-row"><span>n</span><span>${d.n}</span></div>`,
      evt
    ))
    .on('mouseleave', hideTip);

  const legend = d3.select('#usageLineLegend');
  legend.selectAll('*').remove();
  legend.append('span')
    .html(`<i style="background:${C.mint}"></i> GPA improvement (left axis)`)
    .style('font-size', (11 * fontScale) + 'px');
  legend.append('span')
    .html(`<i style="background:${C.blue}"></i> Avg AI hours / week (right axis, dashed)`)
    .style('font-size', (11 * fontScale) + 'px');
}
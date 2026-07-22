// js/charts/trend.js
import { MONTH_ORDER } from '../utils/constants.js';
import { themeColors, showTip, hideTip, getFontScale } from '../utils/helpers.js';

export function renderTrend(data) {
  const C = themeColors();
  const fontScale = getFontScale();
  const el = d3.select('#chartTrend');
  el.selectAll('*').remove();

  const W = el.node().clientWidth || 1000;
  const H = 230;
  const M = { t: 18 * fontScale, r: 52 * fontScale, b: 36 * fontScale, l: 48 * fontScale };
  const svg = el.append('svg')
    .attr('width', '100%')
    .attr('height', H)
    .attr('viewBox', `0 0 ${W} ${H}`)
    .style('display', 'block');

  const months = MONTH_ORDER.filter(m => data.some(d => d.Month === m));
  const agg = months.map(m => {
    const sub = data.filter(d => d.Month === m);
    return { m, n: sub.length, gpa: sub.length ? d3.mean(sub, d => d.GPA_Improvement) : null, anx: sub.length ? d3.mean(sub, d => d.Anxiety_Level_During_Exams) : null };
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

  const yAnx = d3.scaleLinear()
    .domain([1, 10])
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
    .call(d3.axisRight(yAnx).ticks(4))
    .style('font-size', (10 * fontScale) + 'px');

  const validGpa = agg.filter(d => d.gpa !== null);
  const validAnx = agg.filter(d => d.anx !== null);
  const lineGpa = d3.line()
    .x(d => x(d.m))
    .y(d => yGpa(d.gpa))
    .curve(d3.curveMonotoneX);
  const lineAnx = d3.line()
    .x(d => x(d.m))
    .y(d => yAnx(d.anx))
    .curve(d3.curveMonotoneX);

  if (validGpa.length > 1) {
    svg.append('path')
      .datum(validGpa)
      .attr('fill', 'none')
      .attr('stroke', C.mint)
      .attr('stroke-width', 2.4)
      .attr('d', lineGpa);
  }
  if (validAnx.length > 1) {
    svg.append('path')
      .datum(validAnx)
      .attr('fill', 'none')
      .attr('stroke', C.blue)
      .attr('stroke-width', 2.4)
      .attr('stroke-dasharray', '5 3')
      .attr('d', lineAnx);
  }

  [['gpa', yGpa, C.mint, d3.format('+.2f'), 'GPA change'],
   ['anx', yAnx, C.blue, d3.format('.1f'), 'Anxiety']].forEach(([key, scale, color, f, label]) => {
    svg.selectAll('circle.' + key)
      .data(agg.filter(d => d[key] !== null))
      .enter().append('circle')
      .attr('class', key)
      .attr('cx', d => x(d.m))
      .attr('cy', d => scale(d[key]))
      .attr('r', 4.5 * fontScale)
      .attr('fill', color)
      .attr('stroke', C.surface)
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('mousemove', (evt, d) => showTip(`<b>${d.m}</b><div class="t-row"><span>${label}</span><span>${f(d[key])}</span></div><div class="t-row"><span>n</span><span>${d.n}</span></div>`, evt))
      .on('mouseleave', hideTip);
  });

  const legend = d3.select('#trendLegend');
  legend.selectAll('*').remove();
  legend.append('span')
    .html(`<i style="background:${C.mint}"></i> Avg GPA improvement (left axis)`)
    .style('font-size', (11 * fontScale) + 'px');
  legend.append('span')
    .html(`<i style="background:${C.blue}"></i> Avg exam anxiety, 1–10 (right axis, dashed)`)
    .style('font-size', (11 * fontScale) + 'px');
}
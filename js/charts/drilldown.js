// js/charts/drilldown.js
import { YEAR_ORDER } from '../utils/constants.js';
import { themeColors, majorColorScale, showTip, hideTip, getFontScale } from '../utils/helpers.js';
import { state, getFiltered } from '../state.js';

export function renderDrilldown(data) {
  const C = themeColors();
  const fontScale = getFontScale();
  const el = d3.select('#chartDrilldown');
  el.selectAll('*').remove();
  const back = d3.select('#drillBack');

  const W = el.node().clientWidth || 900;
  const H = 280;
  const M = { t: 14 * fontScale, r: 16 * fontScale, b: 44 * fontScale, l: 70 * fontScale };
  const svg = el.append('svg')
    .attr('width', '100%')
    .attr('height', H)
    .attr('viewBox', `0 0 ${W} ${H}`)
    .style('display', 'block');

  let agg, keyFn;
  if (!state.drillYear) {
    back.classed('show', false);
    const years = YEAR_ORDER.filter(y => data.some(d => d.Year_of_Study === y));
    agg = years.map(y => [y, data.filter(d => d.Year_of_Study === y).length]);
    keyFn = d => d[0];
  } else {
    back.classed('show', true).text('← Back to all years (currently: ' + state.drillYear + ')');
    const sub = data.filter(d => d.Year_of_Study === state.drillYear);
    agg = d3.rollups(sub, v => v.length, d => d.Major_Category).sort((a, b) => d3.descending(a[1], b[1]));
    keyFn = d => d[0];
  }

  const x = d3.scaleBand()
    .domain(agg.map(keyFn))
    .range([M.l, W - M.r])
    .padding(0.3);
  const y = d3.scaleLinear()
    .domain([0, d3.max(agg, d => d[1]) || 1])
    .nice()
    .range([H - M.b, M.t]);

  svg.append('g').attr('class', 'gridline')
    .attr('transform', `translate(${M.l},0)`)
    .call(d3.axisLeft(y).ticks(5).tickSize(-(W - M.l - M.r)).tickFormat(''))
    .style('font-size', (10 * fontScale) + 'px');

  svg.append('g').attr('class', 'axis')
    .attr('transform', `translate(0,${H - M.b})`)
    .call(d3.axisBottom(x).tickSizeOuter(0))
    .style('font-size', (10 * fontScale) + 'px');

  svg.append('g').attr('class', 'axis')
    .attr('transform', `translate(${M.l},0)`)
    .call(d3.axisLeft(y).ticks(5))
    .style('font-size', (10 * fontScale) + 'px');

  const majors = Array.from(new Set(data.map(d => d.Major_Category))).sort();
  const mc = majorColorScale(majors);

  svg.selectAll('rect')
    .data(agg)
    .enter().append('rect')
    .attr('x', d => x(keyFn(d)))
    .attr('width', x.bandwidth())
    .attr('y', d => y(d[1]))
    .attr('height', d => y(0) - y(d[1]))
    .attr('rx', 3)
    .attr('fill', state.drillYear ? d => mc(d[0]) : C.blue)
    .style('cursor', state.drillYear ? 'default' : 'pointer')
    .on('mousemove', (evt, d) => showTip(`<b>${keyFn(d)}</b><div class="t-row"><span>Students</span><span>${d[1]}</span></div>`, evt))
    .on('mouseleave', hideTip)
    .on('click', (evt, d) => {
      if (!state.drillYear) {
        state.drillYear = d[0];
        if (window.__refreshAll) window.__refreshAll();
      }
    });

  back.on('click', () => { state.drillYear = null; if (window.__refreshAll) window.__refreshAll(); });
}
import { themeColors, showTip, hideTip } from '../utils/helpers.js';
import { getFiltered, state } from '../state.js';

export function renderMajorBar(data) {
  const C = themeColors();
  const el = d3.select('#chartMajorBar');
  el.selectAll('*').remove();
  const W = el.node().clientWidth || 560, H = 280, M = { t: 14, r: 16, b: 56, l: 44 };
  const svg = el.append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`);

  const agg = d3.rollups(data, v => d3.mean(v, d => d.GPA_Improvement), d => d.Major_Category).sort((a, b) => d3.descending(a[1], b[1]));
  const x = d3.scaleBand().domain(agg.map(d => d[0])).range([M.l, W - M.r]).padding(0.32);
  const yMax = d3.max(agg, d => Math.abs(d[1])) || 0.1;
  const y = d3.scaleLinear().domain([-yMax * 1.2, yMax * 1.2]).range([H - M.b, M.t]);

  svg.append('g').attr('class', 'gridline').attr('transform', `translate(${M.l},0)`).call(d3.axisLeft(y).ticks(5).tickSize(-(W - M.l - M.r)).tickFormat(''));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${y(0)})`).call(d3.axisBottom(x).tickSizeOuter(0));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${M.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('+.2f')));

  svg.selectAll('rect.bar').data(agg).enter().append('rect')
    .attr('class', 'bar interactive')
    .attr('x', d => x(d[0])).attr('width', x.bandwidth())
    .attr('y', d => d[1] >= 0 ? y(d[1]) : y(0)).attr('height', d => Math.abs(y(d[1]) - y(0))).attr('rx', 3)
    .attr('fill', d => state.brushMajor && state.brushMajor !== d[0] ? C.surface3 : (d[1] >= 0 ? C.mint : C.red))
    .attr('opacity', d => state.brushMajor && state.brushMajor !== d[0] ? 0.6 : 1)
    .style('cursor', 'pointer')
    .on('mousemove', (evt, d) => showTip(`<b>${d[0]}</b><div class="t-row"><span>Avg GPA change</span><span>${d3.format('+.2f')(d[1])}</span></div>`, evt))
    .on('mouseleave', hideTip)
    .on('click', (evt, d) => {
      state.brushMajor = state.brushMajor === d[0] ? null : d[0];
      const { refreshAll } = require('../state.js'); // dynamic import to avoid circular
      // Actually we'll handle this via script.js re-export
      // We'll use a global refresh callback
      if (window.__refreshAll) window.__refreshAll();
    });
}
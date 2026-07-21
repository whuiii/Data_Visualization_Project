import { themeColors, showTip, hideTip } from '../utils/helpers.js';
import { state } from '../state.js';

export function renderUsageBar(data) {
  const C = themeColors();
  const el = d3.select('#chartUsageBar');
  el.selectAll('*').remove();
  const W = el.node().clientWidth || 560, H = 280, M = { t: 14, r: 16, b: 56, l: 44 };
  const svg = el.append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`);

  const order = ['Low', 'Moderate', 'High', 'Very High'];
  const agg = order.map(lvl => {
    const sub = data.filter(d => d.AI_Usage_Level === lvl);
    return { lvl, n: sub.length, gpa: sub.length ? d3.mean(sub, d => d.GPA_Improvement) : null };
  }).filter(d => d.n > 0);

  const x = d3.scaleBand().domain(agg.map(d => d.lvl)).range([M.l, W - M.r]).padding(0.32);
  const yMax = d3.max(agg, d => d.gpa || 0) || 0.1;
  const y = d3.scaleLinear()
    .domain([0, yMax * 1.1])
    .nice()
    .range([H - M.b, M.t]);

  svg.append('g').attr('class', 'gridline').attr('transform', `translate(${M.l},0)`).call(d3.axisLeft(y).ticks(5).tickSize(-(W - M.l - M.r)).tickFormat(''));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - M.b})`).call(d3.axisBottom(x).tickSizeOuter(0));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${M.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('+.2f')));

  const colors = d3.scaleOrdinal().domain(order).range(['#BDBDBD', '#9E9E9E', '#757575', '#4A4A4A']);

  svg.selectAll('rect.bar').data(agg).enter().append('rect')
    .attr('class', 'bar interactive')
    .attr('x', d => x(d.lvl)).attr('width', x.bandwidth())
    .attr('y', d => y(d.gpa)).attr('height', d => H - M.b - y(d.gpa))
    .attr('fill', d => d.gpa >= 0 ? C.mint : C.red)
    .attr('opacity', d => state.brushUseCase && state.brushUseCase !== d.lvl ? 0.6 : 1)
    .style('cursor', 'pointer')
    .on('mousemove', (evt, d) => showTip(`<b>${d.lvl} usage</b><div class="t-row"><span>Avg GPA change</span><span>${d.gpa !== null ? d3.format('+.2f')(d.gpa) : '—'}</span></div><div class="t-row"><span>n</span><span>${d.n}</span></div>`, evt))
    .on('mouseleave', hideTip)
    .on('click', (evt, d) => {
      state.brushUseCase = state.brushUseCase === d.lvl ? null : d.lvl;
      if (window.__refreshAll) window.__refreshAll();
    });
}
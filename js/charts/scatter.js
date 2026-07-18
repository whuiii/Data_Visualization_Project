import { themeColors, burnoutScale, showTip, hideTip } from '../utils/helpers.js';
import { state, getRawData, getFiltered } from '../state.js';

export function renderScatter(data) {
  const C = themeColors();
  const bColor = burnoutScale(C);
  const RAW_DATA = getRawData();
  const el = d3.select('#chartScatter');
  el.selectAll('*').remove();
  const W = el.node().clientWidth || 900, H = 340, M = { t: 16, r: 24, b: 40, l: 48 };
  const svg = el.append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`);

  const x = d3.scaleLinear().domain([0, d3.max(RAW_DATA, d => d.Weekly_GenAI_Hours) + 1]).range([M.l, W - M.r]);
  const y = d3.scaleLinear().domain([d3.min(RAW_DATA, d => d.Post_Semester_GPA) - 0.1, d3.max(RAW_DATA, d => d.Post_Semester_GPA) + 0.1]).range([H - M.b, M.t]);
  const r = d3.scaleLinear().domain(d3.extent(RAW_DATA, d => d.Tool_Diversity)).range([2.6, 7.5]);

  svg.append('g').attr('class', 'gridline').attr('transform', `translate(${M.l},0)`).call(d3.axisLeft(y).ticks(6).tickSize(-(W - M.l - M.r)).tickFormat(''));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - M.b})`).call(d3.axisBottom(x).ticks(8).tickFormat(d => d + 'h'));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${M.l},0)`).call(d3.axisLeft(y).ticks(6));
  svg.append('text').attr('x', M.l).attr('y', H - 6).attr('fill', 'var(--text-faint)').style('font-size', '10px').text('Weekly GenAI hours →');
  svg.append('text').attr('x', M.l).attr('y', M.t - 2).attr('fill', 'var(--text-faint)').style('font-size', '10px').text('↑ Post-semester GPA');

  svg.append('g').selectAll('circle').data(data, d => d.Student_ID).enter().append('circle')
    .attr('cx', d => x(d.Weekly_GenAI_Hours)).attr('cy', d => y(d.Post_Semester_GPA)).attr('r', d => r(d.Tool_Diversity))
    .attr('fill', d => bColor(d.Burnout_Risk_Level)).attr('opacity', 0.72)
    .attr('stroke', d => String(d.Student_ID) === state.search ? 'var(--text)' : 'none').attr('stroke-width', 2)
    .on('mousemove', (evt, d) => showTip(`<b>${d.Student_ID}</b> · ${d.Major_Category}<div class="t-row"><span>AI hrs/wk</span><span>${d.Weekly_GenAI_Hours}</span></div><div class="t-row"><span>Post GPA</span><span>${d.Post_Semester_GPA}</span></div><div class="t-row"><span>Burnout</span><span>${d.Burnout_Risk_Level}</span></div>`, evt))
    .on('mouseleave', hideTip);

  const brush = d3.brush().extent([[M.l, M.t], [W - M.r, H - M.b]]).on('end', (evt) => {
    if (!evt.selection) { state.scatterBrush = null; if (window.__refreshAll) window.__refreshAll(); return; }
    const [[px0, py0], [px1, py1]] = evt.selection;
    state.scatterBrush = [[x.invert(px0), y.invert(py1)], [x.invert(px1), y.invert(py0)]];
    if (window.__refreshAll) window.__refreshAll();
  });
  svg.append('g').attr('class', 'brush').call(brush);

  const legend = d3.select('#scatterLegend');
  legend.selectAll('*').remove();
  ['Low', 'Medium', 'High'].forEach(l => { const s = legend.append('span'); s.append('i').style('background', bColor(l)); s.append('text').text('Burnout: ' + l); });
  legend.append('span').html('<i style="background:transparent;border:1px solid var(--text-faint)"></i> dot size = tool diversity');
}
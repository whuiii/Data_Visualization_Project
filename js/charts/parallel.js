import { themeColors, burnoutScale, showTip, hideTip } from '../utils/helpers.js';
import { state, getRawData } from '../state.js';

const PC_DIMS = ['Weekly_GenAI_Hours', 'Traditional_Study_Hours', 'Perceived_AI_Dependency', 'Anxiety_Level_During_Exams', 'Skill_Retention_Score', 'Post_Semester_GPA'];
const PC_LABELS = {
  Weekly_GenAI_Hours: 'AI hrs/wk',
  Traditional_Study_Hours: 'Study hrs/wk',
  Perceived_AI_Dependency: 'AI dependency',
  Anxiety_Level_During_Exams: 'Anxiety',
  Skill_Retention_Score: 'Skill retention',
  Post_Semester_GPA: 'Post GPA'
};

export function renderParallel(data) {
  const C = themeColors();
  const bColor = burnoutScale(C);
  const RAW_DATA = getRawData();
  const el = d3.select('#chartParallel');
  el.selectAll('*').remove();
  const W = el.node().clientWidth || 1000, H = 340, M = { t: 26, r: 36, b: 16, l: 36 };
  const svg = el.append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`);

  const yScales = {};
  PC_DIMS.forEach(dim => { yScales[dim] = d3.scaleLinear().domain(d3.extent(RAW_DATA, d => d[dim])).nice().range([H - M.b, M.t]); });
  const x = d3.scalePoint().domain(PC_DIMS).range([M.l, W - M.r]);
  const line = d3.line();
  function pathFor(d) { return line(PC_DIMS.map(dim => [x(dim), yScales[dim](d[dim])])); }

  const gLines = svg.append('g').attr('fill', 'none');
  gLines.selectAll('path').data(data, d => d.Student_ID).enter().append('path')
    .attr('d', pathFor).attr('stroke', d => bColor(d.Burnout_Risk_Level)).attr('stroke-width', 1).attr('opacity', 0.22)
    .on('mousemove', function (evt, d) {
      d3.select(this).attr('opacity', 1).attr('stroke-width', 2.4).raise();
      showTip(`<b>${d.Student_ID}</b> · ${d.Major_Category}<br>` + PC_DIMS.map(dim => `<div class="t-row"><span>${PC_LABELS[dim]}</span><span>${d[dim]}</span></div>`).join(''), evt);
    })
    .on('mouseleave', function () { d3.select(this).attr('opacity', 0.22).attr('stroke-width', 1); hideTip(); });

  const axisG = svg.append('g').selectAll('g').data(PC_DIMS).enter().append('g').attr('transform', d => `translate(${x(d)},0)`);
  axisG.each(function (dim) { d3.select(this).call(d3.axisLeft(yScales[dim]).ticks(5)); });
  axisG.append('text').attr('y', M.t - 10).attr('text-anchor', 'middle').attr('fill', 'var(--text)').style('font-size', '10px').style('font-weight', 600).style('font-family', 'Roboto Mono').text(d => PC_LABELS[d]);

  axisG.append('g').attr('class', 'pc-brush').each(function (dim) {
    const brush = d3.brushY().extent([[-10, M.t], [10, H - M.b]]).on('end', (evt) => {
      if (!state.parallelBrush) state.parallelBrush = {};
      if (!evt.selection) { delete state.parallelBrush[dim]; if (Object.keys(state.parallelBrush).length === 0) state.parallelBrush = null; if (window.__refreshAll) window.__refreshAll(); return; }
      const [p0, p1] = evt.selection;
      state.parallelBrush[dim] = [yScales[dim].invert(p1), yScales[dim].invert(p0)];
      if (window.__refreshAll) window.__refreshAll();
    });
    d3.select(this).call(brush);
  });

  const legend = d3.select('#parallelLegend');
  legend.selectAll('*').remove();
  ['Low', 'Medium', 'High'].forEach(l => { const s = legend.append('span'); s.append('i').style('background', bColor(l)); s.append('text').text('Burnout: ' + l); });
  legend.append('span').text('Drag any axis to brush · hover a line to trace one student');
}
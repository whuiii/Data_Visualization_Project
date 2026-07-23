// js/charts/scatter.js
import { themeColors, burnoutScale, showTip, hideTip, getFontScale } from '../utils/helpers.js';
import { state, getRawData } from '../state.js';

export function renderScatter(fullData, sampledData) {
  const C = themeColors();
  const bColor = burnoutScale(C);
  const el = d3.select('#chartScatter');
  el.selectAll('*').remove();

  const fontScale = getFontScale();

  // ---- Base font sizes (scaled) ----
  const tickFontSize = 9 * fontScale;
  const labelFontSize = 11 * fontScale;
  const legendFontSize = 10 * fontScale;

  // ---- Margins that grow with font size ----
  // We add extra space for axis labels and long tick labels
  const margin = {
    top: 40 * fontScale,
    right: 30 * fontScale,
    bottom: 80 * fontScale,   // extra room for x-axis label
    left: 60 * fontScale      // extra room for y-axis labels
  };

  const W = el.node().clientWidth || 900;
  const H = 440;
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const svg = el.append('svg')
    .attr('width', '100%')
    .attr('height', H)
    .attr('viewBox', `0 0 ${W} ${H}`)
    .style('display', 'block');

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // ---- Scales ----
  const allData = fullData.length ? fullData : getRawData();
  const x = d3.scaleLinear()
    .domain([0, d3.max(allData, d => d.Weekly_GenAI_Hours) + 1])
    .range([0, innerW]);
  const y = d3.scaleLinear()
    .domain([d3.min(allData, d => d.Post_Semester_GPA) - 0.1,
             d3.max(allData, d => d.Post_Semester_GPA) + 0.1])
    .range([innerH, 0]);
  const r = d3.scaleLinear()
    .domain(d3.extent(allData, d => d.Tool_Diversity))
    .range([2.6 * fontScale, 7.5 * fontScale]);

  // ---- Grid ----
  g.append('g').attr('class', 'gridline')
    .call(d3.axisLeft(y).ticks(6).tickSize(-innerW).tickFormat(''))
    .style('font-size', tickFontSize + 'px')
    .style('font-family', 'Roboto Mono, monospace');

  // ---- Axes ----
  const xAxis = g.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(8).tickFormat(d => d + 'h'))
    .style('font-size', tickFontSize + 'px')
    .style('font-family', 'Roboto Mono, monospace');

  const yAxis = g.append('g')
    .attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(6))
    .style('font-size', tickFontSize + 'px')
    .style('font-family', 'Roboto Mono, monospace');

  // ---- Axis labels ----
  // X-axis label (below the axis, with enough spacing)
  g.append('text')
    .attr('x', innerW / 2)
    .attr('y', innerH + margin.bottom - 8 * fontScale)
    .attr('text-anchor', 'middle')
    .style('fill', 'var(--text-faint)')
    .style('font-size', labelFontSize + 'px')
    .style('font-weight', '500')
    .text('Weekly GenAI hoursr');

  // Y-axis label (rotated, to the left of the axis)
  g.append('text')
    .attr('transform', `rotate(-90)`)
    .attr('x', -innerH / 2)
    .attr('y', -margin.left + 16 * fontScale)
    .attr('text-anchor', 'middle')
    .style('fill', 'var(--text-faint)')
    .style('font-size', labelFontSize + 'px')
    .style('font-weight', '500')
    .text('Post-semester GPA');

  // ---- Plot points ----
  g.append('g').selectAll('circle')
    .data(sampledData, d => d.Student_ID)
    .enter().append('circle')
    .attr('cx', d => x(d.Weekly_GenAI_Hours))
    .attr('cy', d => y(d.Post_Semester_GPA))
    .attr('r', d => r(d.Tool_Diversity))
    .attr('fill', d => bColor(d.Burnout_Risk_Level))
    .attr('opacity', 0.72)
    .attr('stroke', d => String(d.Student_ID) === state.search ? 'var(--text)' : 'none')
    .attr('stroke-width', 2)
    .on('mousemove', (evt, d) => showTip(
      `<b>${d.Student_ID}</b> · ${d.Major_Category}<div class="t-row"><span>AI hrs/wk</span><span>${d.Weekly_GenAI_Hours}</span></div><div class="t-row"><span>Post GPA</span><span>${d.Post_Semester_GPA}</span></div><div class="t-row"><span>Burnout</span><span>${d.Burnout_Risk_Level}</span></div>`,
      evt
    ))
    .on('mouseleave', hideTip);

  // ---- Brush ----
  const brush = d3.brush()
    .extent([[0, 0], [innerW, innerH]])
    .on('end', (evt) => {
      if (!evt.selection) {
        state.scatterBrush = null;
        if (window.__refreshAll) window.__refreshAll();
        return;
      }
      const [[px0, py0], [px1, py1]] = evt.selection;
      state.scatterBrush = [[x.invert(px0), y.invert(py1)], [x.invert(px1), y.invert(py0)]];
      if (window.__refreshAll) window.__refreshAll();
    });
  g.append('g').attr('class', 'brush').call(brush);

  // ---- Legend (scaled) ----
  const legend = d3.select('#scatterLegend');
  legend.selectAll('*').remove();
  ['Low', 'Medium', 'High'].forEach(l => {
    const s = legend.append('span');
    s.append('i').style('background', bColor(l));
    s.append('text').text('Burnout: ' + l)
      .style('font-size', legendFontSize + 'px')
      .style('font-family', 'Roboto Mono, monospace');
  });
  legend.append('span')
    .html(`<i style="background:transparent;border:1px solid var(--text-faint)"></i> dot size = tool diversity`)
    .style('font-size', legendFontSize + 'px')
    .style('font-family', 'Roboto Mono, monospace');
}
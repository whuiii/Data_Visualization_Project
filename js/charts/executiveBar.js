// js/charts/executiveBar.js
import { themeColors, showTip, hideTip, getFontScale } from '../utils/helpers.js';
import { state } from '../state.js';

export function renderExecutiveBar(data) {
  const C = themeColors();
  const fontScale = getFontScale();
  const el = d3.select('#chartExecutiveBar');
  el.selectAll('*').remove();

  const W = el.node().clientWidth || 600;
  const H = 350;

  // ---- Margins with plenty of extra space ----
  // Left margin is large enough for long major names + ticks + rotated label
  const M = {
    t: 50 * fontScale,
    r: 30 * fontScale,
    b: 55 * fontScale,   // extra bottom space for x-axis label
    l: 110 * fontScale   // extra left space for y-axis labels + rotated label
  };

  const svg = el.append('svg')
    .attr('width', '100%')
    .attr('height', H)
    .attr('viewBox', `0 0 ${W} ${H}`)
    .style('display', 'block');

  // ---- Data preparation ----
  const majors = Array.from(new Set(data.map(d => d.Major_Category))).sort();
  const agg = majors.map(maj => {
    const sub = data.filter(d => d.Major_Category === maj);
    return {
      major: maj,
      avgAI: sub.length ? d3.mean(sub, d => d.Weekly_GenAI_Hours) : 0,
      avgGPA: sub.length ? d3.mean(sub, d => d.GPA_Improvement) : 0,
    };
  }).sort((a, b) => d3.descending(a.avgAI, b.avgAI));

  // ---- Scales ----
  const x = d3.scaleLinear()
    .domain([0, d3.max(agg, d => d.avgAI) * 1.1 || 10])
    .nice()
    .range([M.l, W - M.r]);

  const y = d3.scaleBand()
    .domain(agg.map(d => d.major))
    .range([M.t + 10, H - M.b])
    .padding(0.15);

  // ---- Axes ----
  // Y-axis (major names)
  svg.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(${M.l},0)`)
    .call(d3.axisLeft(y).tickSize(0))
    .style('font-size', (10 * fontScale) + 'px')
    .style('font-family', 'Roboto Mono, monospace');

  // X-axis (AI hours)
  svg.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0,${H - M.b})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat(d => d + 'h'))
    .style('font-size', (10 * fontScale) + 'px')
    .style('font-family', 'Roboto Mono, monospace');

  // ---- X-axis label (placed with safe bottom padding) ----
  svg.append('text')
    .attr('x', M.l + (W - M.l - M.r) / 2)
    .attr('y', H - 6 * fontScale)   // stays inside the SVG with breathing room
    .attr('text-anchor', 'middle')
    .style('fill', 'var(--text-muted)')
    .style('font-size', (11 * fontScale) + 'px')
    .style('font-weight', '600')
    .style('font-family', 'Roboto Mono, monospace')
    .text('Average AI Hours / Week');

  // ---- Y-axis label (rotated, safely positioned) ----
  // We position it in the middle of the left margin, with extra offset from the edge.
  svg.append('text')
    .attr('transform', `rotate(-90)`)
    .attr('x', -(H - M.t - M.b) / 2)          // centers vertically
    .attr('y', 18 * fontScale)                // pushes right (down when rotated) to clear the tick labels
    .attr('text-anchor', 'middle')
    .style('fill', 'var(--text-muted)')
    .style('font-size', (11 * fontScale) + 'px')
    .style('font-weight', '600')
    .style('font-family', 'Roboto Mono, monospace')
    .text('Major / Faculty');

  // ---- Bars ----
  svg.selectAll('rect')
    .data(agg)
    .enter().append('rect')
    .attr('y', d => y(d.major))
    .attr('x', M.l)
    .attr('height', y.bandwidth())
    .attr('width', d => x(d.avgAI) - M.l)
    .attr('fill', C.blue)
    .attr('opacity', 0.8)
    .attr('rx', 4)
    .style('cursor', 'pointer')
    .on('mousemove', (evt, d) => showTip(
      `<b>${d.major}</b><div class="t-row"><span>Avg AI hrs/wk</span><span>${d3.format('.1f')(d.avgAI)}</span></div><div class="t-row"><span>Avg GPA change</span><span>${d3.format('+.2f')(d.avgGPA)}</span></div>`,
      evt
    ))
    .on('mouseleave', hideTip)
    .on('click', (evt, d) => {
      state.brushMajor = state.brushMajor === d.major ? null : d.major;
      if (window.__refreshAll) window.__refreshAll();
    });

  // ---- Value labels at the end of bars ----
  svg.selectAll('text.bar-label')
    .data(agg)
    .enter().append('text')
    .attr('class', 'bar-label')
    .attr('x', d => x(d.avgAI) + 6 * fontScale)
    .attr('y', d => y(d.major) + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .style('font-size', (11 * fontScale) + 'px')
    .style('font-family', 'Roboto Mono, monospace')
    .style('fill', 'var(--text-muted)')
    .text(d => d3.format('.1f')(d.avgAI) + 'h');
}
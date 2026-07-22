// js/charts/executiveBar.js
import { themeColors, showTip, hideTip } from '../utils/helpers.js';
import { state } from '../state.js';

export function renderExecutiveBar(data) {
  const C = themeColors();
  const el = d3.select('#chartExecutiveBar');
  el.selectAll('*').remove();
  const W = el.node().clientWidth || 600,
    H = 350,
    M = { t: 40, r: 30, b: 20, l: 140 }; // increased top margin for x-axis label
  const svg = el
    .append('svg')
    .attr('width', '100%')
    .attr('height', H)
    .attr('viewBox', `0 0 ${W} ${H}`);

  // Group by major, compute average AI hours and GPA improvement
  const majors = Array.from(new Set(data.map((d) => d.Major_Category))).sort();
  const agg = majors
    .map((maj) => {
      const sub = data.filter((d) => d.Major_Category === maj);
      return {
        major: maj,
        avgAI: sub.length ? d3.mean(sub, (d) => d.Weekly_GenAI_Hours) : 0,
        avgGPA: sub.length ? d3.mean(sub, (d) => d.GPA_Improvement) : 0,
      };
    })
    .sort((a, b) => d3.descending(a.avgAI, b.avgAI));

  const x = d3
    .scaleLinear()
    .domain([0, d3.max(agg, (d) => d.avgAI) * 1.1 || 10])
    .nice()
    .range([M.l, W - M.r]);
  const y = d3
    .scaleBand()
    .domain(agg.map((d) => d.major))
    .range([M.t + 10, H - M.b])
    .padding(0.15);

  // Axes
  // Y-axis (left)
  svg
    .append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(${M.l},0)`)
    .call(d3.axisLeft(y).tickSize(0));

  
    // X-axis (bottom)
    svg
    .append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0,${H - M.b})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat((d) => d + 'h'));

    // X-axis label (below the axis)
    svg
    .append('text')
    .attr('x', M.l + (W - M.l - M.r) / 2)
    .attr('y', H - 8)
    .attr('text-anchor', 'middle')
    .style('fill', 'var(--text-muted)')
    .style('font-size', '11px')
    .style('font-weight', '600')
    .style('font-family', 'Roboto Mono, monospace')
    .text('Average AI Hours / Week');

  // Y-axis label (to the left)
  svg
    .append('text')
    .attr('x', 14)
    .attr('y', M.t + (H - M.t - M.b) / 2)
    .attr('text-anchor', 'middle')
    .attr('transform', `rotate(-90, 14, ${M.t + (H - M.t - M.b) / 2})`)
    .style('fill', 'var(--text-muted)')
    .style('font-size', '11px')
    .style('font-weight', '600')
    .style('font-family', 'Roboto Mono, monospace')
    .text('Major / Faculty');

  // Bars
  svg
    .selectAll('rect')
    .data(agg)
    .enter()
    .append('rect')
    .attr('y', (d) => y(d.major))
    .attr('x', M.l)
    .attr('height', y.bandwidth())
    .attr('width', (d) => x(d.avgAI) - M.l)
    .attr('fill', C.blue)
    .attr('opacity', 0.8)
    .attr('rx', 4)
    .style('cursor', 'pointer')
    .on('mousemove', (evt, d) =>
      showTip(
        `<b>${d.major}</b><div class="t-row"><span>Avg AI hrs/wk</span><span>${d3.format('.1f')(d.avgAI)}</span></div><div class="t-row"><span>Avg GPA change</span><span>${d3.format('+.2f')(d.avgGPA)}</span></div>`,
        evt
      )
    )
    .on('mouseleave', hideTip)
    .on('click', (evt, d) => {
      state.brushMajor = state.brushMajor === d.major ? null : d.major;
      if (window.__refreshAll) window.__refreshAll();
    });

  // Value labels at the end of bars
  svg
    .selectAll('text.bar-label')
    .data(agg)
    .enter()
    .append('text')
    .attr('class', 'bar-label')
    .attr('x', (d) => x(d.avgAI) + 6)
    .attr('y', (d) => y(d.major) + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .style('font-size', '11px')
    .style('font-family', 'Roboto Mono, monospace')
    .style('fill', 'var(--text-muted)')
    .text((d) => d3.format('.1f')(d.avgAI) + 'h');
}
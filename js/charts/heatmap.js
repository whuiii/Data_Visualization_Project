// js/charts/heatmap.js
import { themeColors, showTip, hideTip } from '../utils/helpers.js';
import { state, getRawData } from '../state.js';

export function renderHeatmap(selector, data) {
  const C = themeColors();
  const RAW_DATA = getRawData();
  const el = d3.select(selector);
  el.selectAll('*').remove();
  const useCases = Array.from(new Set(RAW_DATA.map(d => d.Primary_Use_Case)));
  const W = el.node().clientWidth || 900, H = 300, M = { t: 16, r: 16, b: 80, l: 100 };
  const svg = el.append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`);

  const x = d3.scaleBand().domain(useCases).range([M.l, W - M.r]).padding(0.06);
  const majors = Array.from(new Set(RAW_DATA.map(d => d.Major_Category))).sort();
  const y = d3.scaleBand().domain(majors).range([M.t, H - M.b]).padding(0.06);

  const grid = [];
  majors.forEach(maj => {
    useCases.forEach(uc => {
      const cell = data.filter(d => d.Major_Category === maj && d.Primary_Use_Case === uc);
      grid.push({ maj, uc, n: cell.length, avg: cell.length ? d3.mean(cell, d => d.GPA_Improvement) : null });
    });
  });
  const validAvgs = grid.filter(d => d.avg !== null).map(d => d.avg);
  const maxAbs = Math.max(Math.abs(d3.min(validAvgs) || 0.05), Math.abs(d3.max(validAvgs) || 0.05));
  const color = d3.scaleLinear().domain([-maxAbs, 0, maxAbs]).range([C.red, C.surface3, C.mint]);

  // X axis with wrapped labels
  const xAxisG = svg.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0,${H - M.b})`)
    .call(d3.axisBottom(x).tickSizeOuter(0));

  // Wrap tick labels into multiple lines
  xAxisG.selectAll('.tick text')
    .each(function(d) {
      const text = d3.select(this);
      const words = d.replace(/_/g, ' ').split(' ');
      text.text(null); // clear existing text
      // Set text-anchor to middle (default for band scale)
      text.style('text-anchor', 'middle');
      // Append each word as a separate tspan
      words.forEach((word, i) => {
        text.append('tspan')
          .attr('x', 0)
          .attr('dy', i === 0 ? '1.1em' : '1.2em') // first line offset
          .text(word);
      });
    })
    .style('font-size', '10px')
    .style('font-family', 'Roboto Mono, monospace');

  // Y axis
  svg.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(${M.l},0)`)
    .call(d3.axisLeft(y).tickSizeOuter(0));

  // Heatmap cells
  svg.selectAll('rect')
    .data(grid)
    .enter().append('rect')
    .attr('x', d => x(d.uc))
    .attr('y', d => y(d.maj))
    .attr('width', x.bandwidth())
    .attr('height', y.bandwidth())
    .attr('rx', 3)
    .attr('fill', d => d.avg === null ? C.surface3 : color(d.avg))
    .attr('stroke', C.surface)
    .attr('stroke-width', 1.5)
    .style('cursor', 'pointer')
    .on('mousemove', (evt, d) => showTip(
      `<b>${d.maj}</b> × ${d.uc.replace(/_/g, ' ')}<div class="t-row"><span>n</span><span>${d.n}</span></div><div class="t-row"><span>Avg GPA change</span><span>${d.avg !== null ? d3.format('+.2f')(d.avg) : '—'}</span></div>`,
      evt
    ))
    .on('mouseleave', hideTip)
    .on('click', (evt, d) => {
      if (d.n === 0) return;
      state.brushMajor = state.brushMajor === d.maj ? null : d.maj;
      if (window.__refreshAll) window.__refreshAll();
    });

  // Legend
  const legendId = selector === '#chartHeatmap' ? '#heatLegend' : '#heatLegendLecturer';
  const legend = d3.select(legendId);
  legend.selectAll('*').remove();
  legend.append('span').html(`<i style="background:${C.red}"></i> GPA decline`);
  legend.append('span').html(`<i style="background:${C.surface3};border:1px solid var(--border)"></i> ~no change`);
  legend.append('span').html(`<i style="background:${C.mint}"></i> GPA improvement`);
  legend.append('span').text('Click a cell to filter that major');
}
// js/charts/stackedBar.js
import { YEAR_ORDER } from '../utils/constants.js';
import { themeColors, showTip, hideTip, getFontScale } from '../utils/helpers.js';

export function renderStackedBar(data) {
  const C = themeColors();
  const fontScale = getFontScale();
  const el = d3.select('#chartStackedBar');
  el.selectAll('*').remove();

  const containerWidth = el.node().clientWidth || 600;
  const aspectRatio = 0.6;
  const W = Math.min(containerWidth, 800);
  const H = W * aspectRatio;
  const M = { t: 16 * fontScale, r: 20 * fontScale, b: 28 * fontScale, l: 55 * fontScale };

  const svg = el.append('svg')
    .attr('width', '100%')
    .attr('height', 'auto')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .style('display', 'block');

  const usageLevels = ['Low', 'Moderate', 'High', 'Very High'];
  const availableYears = YEAR_ORDER.filter(y => data.some(d => d.Year_of_Study === y));
  const years = availableYears.length > 0 ? availableYears : Array.from(new Set(data.map(d => d.Year_of_Study)));

  const grouped = d3.rollup(
    data,
    v => v.length,
    d => d.Year_of_Study,
    d => d.AI_Usage_Level
  );
  const seriesData = years.map(year => {
    const obj = { year: year };
    usageLevels.forEach(level => {
      obj[level] = grouped.get(year)?.get(level) || 0;
    });
    return obj;
  });

  const stack = d3.stack().keys(usageLevels);
  const series = stack(seriesData);

  const xScale = d3.scaleBand()
    .domain(years)
    .range([M.l, W - M.r])
    .padding(0.2);
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(series, d => d3.max(d, d => d[1])) || 1])
    .nice()
    .range([H - M.b, M.t]);
  const colorScale = d3.scaleOrdinal()
    .domain(usageLevels)
    .range(['#e3f2fd', '#90caf9', '#42a5f5', '#0d47a1']);

  svg.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0, ${H - M.b})`)
    .call(d3.axisBottom(xScale))
    .style('font-family', 'Roboto Mono, monospace')
    .style('font-size', (10 * fontScale) + 'px');

  svg.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(${M.l}, 0)`)
    .call(d3.axisLeft(yScale).ticks(5))
    .style('font-family', 'Roboto Mono, monospace')
    .style('font-size', (10 * fontScale) + 'px');

  svg.append('g')
    .attr('class', 'gridline')
    .attr('transform', `translate(${M.l}, 0)`)
    .call(d3.axisLeft(yScale).ticks(5).tickSize(-(W - M.l - M.r)).tickFormat(''))
    .style('font-size', (10 * fontScale) + 'px');

  const barGroups = svg.append('g')
    .selectAll('g')
    .data(series)
    .enter().append('g')
    .attr('fill', d => colorScale(d.key));

  barGroups.selectAll('rect')
    .data(d => d)
    .enter().append('rect')
    .attr('x', d => xScale(d.data.year))
    .attr('y', d => yScale(d[1]))
    .attr('height', d => yScale(d[0]) - yScale(d[1]))
    .attr('width', xScale.bandwidth())
    .attr('stroke', C.surface)
    .attr('stroke-width', 1)
    .style('cursor', 'pointer')
    .on('mousemove', function (evt, d) {
      const level = this.parentNode.__data__.key;
      const count = d[1] - d[0];
      showTip(`<b>${d.data.year}</b><div class="t-row"><span>Usage: ${level}</span><span>${count} students</span></div>`, evt);
    })
    .on('mouseleave', hideTip);

  const legend = d3.select('#stackedBarLegend');
  legend.selectAll('*').remove();
  usageLevels.forEach(level => {
    const span = legend.append('span');
    span.append('i').style('background', colorScale(level));
    span.append('text').text(level)
      .style('font-size', (11 * fontScale) + 'px');
  });
}
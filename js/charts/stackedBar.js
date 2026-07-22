// js/charts/stackedBar.js
import { YEAR_ORDER } from '../utils/constants.js';
import { themeColors, showTip, hideTip } from '../utils/helpers.js';

export function renderStackedBar(data) {
  const C = themeColors();
  const el = d3.select('#chartStackedBar');
  el.selectAll('*').remove();

  // Use the container's width for responsiveness
  const containerWidth = el.node().clientWidth || 600;
  // Set a fixed height that scales with width (keep it proportional)
  const aspectRatio = 0.6; // height/width
  const W = Math.min(containerWidth, 800);
  const H = W * aspectRatio;

  // Reduced margins: smaller bottom to avoid extra white space
  const M = { t: 16, r: 20, b: 28, l: 55 };

  const svg = el
    .append('svg')
    .attr('width', '100%')
    .attr('height', 'auto')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .style('display', 'block');

  const usageLevels = ['Low', 'Moderate', 'High', 'Very High'];
  const availableYears = YEAR_ORDER.filter((y) =>
    data.some((d) => d.Year_of_Study === y)
  );
  const years =
    availableYears.length > 0
      ? availableYears
      : Array.from(new Set(data.map((d) => d.Year_of_Study)));

  // Aggregate data: count students per Year_of_Study × AI_Usage_Level
  const grouped = d3.rollup(
    data,
    (v) => v.length,
    (d) => d.Year_of_Study,
    (d) => d.AI_Usage_Level
  );
  const seriesData = years.map((year) => {
    const obj = { year: year };
    usageLevels.forEach((level) => {
      obj[level] = grouped.get(year)?.get(level) || 0;
    });
    return obj;
  });

  // Stack generator
  const stack = d3.stack().keys(usageLevels);
  const series = stack(seriesData);

  // Scales
  const xScale = d3
    .scaleBand()
    .domain(years)
    .range([M.l, W - M.r])
    .padding(0.2);
  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(series, (d) => d3.max(d, (d) => d[1])) || 1])
    .nice()
    .range([H - M.b, M.t]);
  const colorScale = d3
    .scaleOrdinal()
    .domain(usageLevels)
    .range(['#e3f2fd', '#90caf9', '#42a5f5', '#0d47a1']);

  // Axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale).ticks(5);

  svg
    .append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0, ${H - M.b})`)
    .call(xAxis)
    .style('font-family', 'Roboto Mono, monospace')
    .style('font-size', '10px');

  svg
    .append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(${M.l}, 0)`)
    .call(yAxis)
    .style('font-family', 'Roboto Mono, monospace')
    .style('font-size', '10px');

  // Grid lines
  svg
    .append('g')
    .attr('class', 'gridline')
    .attr('transform', `translate(${M.l}, 0)`)
    .call(
      d3
        .axisLeft(yScale)
        .ticks(5)
        .tickSize(-(W - M.l - M.r))
        .tickFormat('')
    );

  // Draw stacked bars
  const barGroups = svg
    .append('g')
    .selectAll('g')
    .data(series)
    .enter()
    .append('g')
    .attr('fill', (d) => colorScale(d.key));

  barGroups
    .selectAll('rect')
    .data((d) => d)
    .enter()
    .append('rect')
    .attr('x', (d) => xScale(d.data.year))
    .attr('y', (d) => yScale(d[1]))
    .attr('height', (d) => yScale(d[0]) - yScale(d[1]))
    .attr('width', xScale.bandwidth())
    .attr('stroke', C.surface)
    .attr('stroke-width', 1)
    .style('cursor', 'pointer')
    .on('mousemove', function (evt, d) {
      const level = this.parentNode.__data__.key;
      const count = d[1] - d[0];
      showTip(
        `<b>${d.data.year}</b><div class="t-row"><span>Usage: ${level}</span><span>${count} students</span></div>`,
        evt
      );
    })
    .on('mouseleave', hideTip);

  // Legend
  const legend = d3.select('#stackedBarLegend');
  legend.selectAll('*').remove();
  usageLevels.forEach((level) => {
    const span = legend.append('span');
    span.append('i').style('background', colorScale(level));
    span.append('text').text(level);
  });
}
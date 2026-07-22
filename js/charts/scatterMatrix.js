// js/charts/scatterMatrix.js
import { themeColors, showTip, hideTip, getFontScale } from '../utils/helpers.js';

export function renderScatterMatrix(fullData, sampledData) {
  const C = themeColors();
  const fontScale = getFontScale();
  const el = d3.select('#chartScatterMatrix');
  el.selectAll('*').remove();

  const W = el.node().clientWidth || 800;
  const size = Math.min(W, 700);
  const margin = { top: 30 * fontScale, right: 30 * fontScale, bottom: 40 * fontScale, left: 40 * fontScale };
  const cellSize = (size - margin.left - margin.right) / 5;

  const variables = [
    { key: 'GPA_Improvement', label: 'GPA Δ' },
    { key: 'Weekly_GenAI_Hours', label: 'AI hrs' },
    { key: 'Traditional_Study_Hours', label: 'Study hrs' },
    { key: 'Skill_Retention_Score', label: 'Retention' },
    { key: 'Anxiety_Level_During_Exams', label: 'Anxiety' }
  ];

  const n = variables.length;
  const svg = el.append('svg')
    .attr('width', '100%')
    .attr('height', size)
    .attr('viewBox', `0 0 ${size} ${size}`)
    .style('display', 'block');

  const dataForScales = fullData.length ? fullData : [];
  const dataForPoints = sampledData;

  const extents = {};
  variables.forEach(v => {
    extents[v.key] = d3.extent(dataForScales, d => d[v.key]);
    const pad = (extents[v.key][1] - extents[v.key][0]) * 0.05 || 0.5;
    extents[v.key] = [extents[v.key][0] - pad, extents[v.key][1] + pad];
  });

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const g = svg.append('g')
        .attr('transform', `translate(${j * cellSize + margin.left}, ${i * cellSize + margin.top})`);

      g.append('rect')
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('fill', 'var(--surface-2)')
        .attr('opacity', 0.3)
        .attr('rx', 2)
        .attr('stroke', 'var(--border)')
        .attr('stroke-width', 0.5);

      if (i === j) {
        g.append('text')
          .attr('x', cellSize / 2)
          .attr('y', cellSize / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .style('font-size', (11 * fontScale) + 'px')
          .style('font-weight', '600')
          .style('fill', 'var(--text)')
          .text(variables[i].label);
        continue;
      }

      const xVar = variables[j].key;
      const yVar = variables[i].key;
      const xScaleLocal = d3.scaleLinear()
        .domain(extents[xVar])
        .range([4, cellSize - 4]);
      const yScaleLocal = d3.scaleLinear()
        .domain(extents[yVar])
        .range([cellSize - 4, 4]);

      if (i === n - 1) {
        const axisG = g.append('g')
          .attr('transform', `translate(0, ${cellSize})`)
          .call(d3.axisBottom(xScaleLocal).ticks(3).tickSize(4));
        axisG.selectAll('text')
          .style('font-size', (7 * fontScale) + 'px')
          .style('fill', 'var(--text-faint)');
      }
      if (j === 0) {
        const axisG = g.append('g')
          .call(d3.axisLeft(yScaleLocal).ticks(3).tickSize(4));
        axisG.selectAll('text')
          .style('font-size', (7 * fontScale) + 'px')
          .style('fill', 'var(--text-faint)');
      }

      const points = dataForPoints.map(d => ({ x: d[xVar], y: d[yVar], student: d }));
      g.selectAll('circle')
        .data(points)
        .enter().append('circle')
        .attr('cx', d => xScaleLocal(d.x))
        .attr('cy', d => yScaleLocal(d.y))
        .attr('r', 1.8 * fontScale)
        .attr('fill', '#64B5F6')
        .attr('opacity', 0.25)
        .on('mousemove', (evt, d) => {
          d3.select(evt.currentTarget)
            .transition().duration(100)
            .attr('r', 4 * fontScale)
            .attr('opacity', 0.8)
            .attr('fill', '#1E88E5');
          showTip(
            `<b>Student ${d.student.Student_ID}</b><br>${xVar}: ${d.x.toFixed(2)}<br>${yVar}: ${d.y.toFixed(2)}`,
            evt
          );
        })
        .on('mouseleave', function () {
          d3.select(this)
            .transition().duration(200)
            .attr('r', 1.8 * fontScale)
            .attr('opacity', 0.25)
            .attr('fill', '#64B5F6');
          hideTip();
        });

      // Regression line
      const xValues = points.map(d => d.x);
      const yValues = points.map(d => d.y);
      const meanX = d3.mean(xValues);
      const meanY = d3.mean(yValues);
      const num = d3.sum(xValues.map((x, idx) => (x - meanX) * (yValues[idx] - meanY)));
      const den = d3.sum(xValues.map(x => (x - meanX) ** 2));
      const slope = den ? num / den : 0;
      const intercept = meanY - slope * meanX;
      const xMin = xScaleLocal.domain()[0];
      const xMax = xScaleLocal.domain()[1];
      const yMin = slope * xMin + intercept;
      const yMax = slope * xMax + intercept;

      g.append('line')
        .attr('x1', xScaleLocal(xMin))
        .attr('y1', yScaleLocal(yMin))
        .attr('x2', xScaleLocal(xMax))
        .attr('y2', yScaleLocal(yMax))
        .attr('stroke', '#E53935')
        .attr('stroke-width', 1.2)
        .attr('opacity', 0.7)
        .attr('stroke-dasharray', '4,3');
    }
  }
}
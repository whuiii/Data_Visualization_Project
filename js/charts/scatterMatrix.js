// js/charts/scatterMatrix.js
import { themeColors, showTip, hideTip } from '../utils/helpers.js';

export function renderScatterMatrix(data) {
  const C = themeColors();
  const el = d3.select('#chartScatterMatrix');
  el.selectAll('*').remove();
  const W = el.node().clientWidth || 800;
  const size = Math.min(W, 600);
  const margin = { top: 20, right: 20, bottom: 30, left: 30 };
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
    .attr('viewBox', `0 0 ${size} ${size}`);

  // Build matrix cells
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const g = svg.append('g')
        .attr('transform', `translate(${j * cellSize + margin.left}, ${i * cellSize + margin.top})`);

      if (i === j) {
        g.append('text')
          .attr('x', cellSize / 2)
          .attr('y', cellSize / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .style('fill', 'var(--text)')
          .text(variables[i].label);
        continue;
      }

      const xVar = variables[j].key;
      const yVar = variables[i].key;
      const xScaleLocal = d3.scaleLinear()
        .domain(d3.extent(data, d => d[xVar]))
        .nice()
        .range([0, cellSize]);
      const yScaleLocal = d3.scaleLinear()
        .domain(d3.extent(data, d => d[yVar]))
        .nice()
        .range([cellSize, 0]);

      if (i === n - 1) {
        const axisG = g.append('g')
          .attr('transform', `translate(0, ${cellSize})`)
          .call(d3.axisBottom(xScaleLocal).ticks(3).tickSize(4));
        axisG.selectAll('text').style('font-size', '8px').style('fill', 'var(--text-faint)');
      }
      if (j === 0) {
        const axisG = g.append('g')
          .call(d3.axisLeft(yScaleLocal).ticks(3).tickSize(4));
        axisG.selectAll('text').style('font-size', '8px').style('fill', 'var(--text-faint)');
      }

      const points = data.map(d => ({ x: d[xVar], y: d[yVar], student: d }));
      g.selectAll('circle')
        .data(points)
        .enter()
        .append('circle')
        .attr('cx', d => xScaleLocal(d.x))
        .attr('cy', d => yScaleLocal(d.y))
        .attr('r', 2.5)
        .attr('fill', C.blue)
        .attr('opacity', 0.5)
        .on('mousemove', (evt, d) => {
          showTip(`<b>Student ${d.student.Student_ID}</b><br>${xVar}: ${d.x.toFixed(2)}<br>${yVar}: ${d.y.toFixed(2)}`, evt);
        })
        .on('mouseleave', hideTip);
    }
  }
}
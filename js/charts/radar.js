import { themeColors, showTip, hideTip } from '../utils/helpers.js';

export function renderRadar(data) {
  const C = themeColors();
  const el = d3.select('#chartRadar');
  el.selectAll('*').remove();
  const W = el.node().clientWidth || 560, H = 300, M = { t: 30, r: 30, b: 30, l: 30 };
  const svg = el.append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`);
  const centerX = W / 2, centerY = H / 2;
  const radius = Math.min(W, H) / 2 - 40;

  const dims = [
    { key: 'Weekly_GenAI_Hours', label: 'AI hrs/wk', max: 30 },
    { key: 'Traditional_Study_Hours', label: 'Study hrs', max: 60 },
    { key: 'Perceived_AI_Dependency', label: 'AI Dependency', max: 10 },
    { key: 'Skill_Retention_Score', label: 'Skill Retention', max: 100 },
    { key: 'Post_Semester_GPA', label: 'Post GPA', max: 4.0 },
    { key: 'Anxiety_Level_During_Exams', label: 'Anxiety', max: 10 },
  ];

  const n = dims.length;
  const angleStep = (2 * Math.PI) / n;
  const angles = dims.map((_, i) => -Math.PI / 2 + i * angleStep);

  const avgVals = dims.map(d => {
    const vals = data.map(r => r[d.key]);
    return d3.mean(vals) || 0;
  });
  const norm = dims.map((d, i) => Math.min(1, Math.max(0, avgVals[i] / d.max)));
  const points = angles.map((a, i) => {
    const r = radius * norm[i];
    return [centerX + r * Math.cos(a), centerY + r * Math.sin(a)];
  });

  const gridG = svg.append('g').attr('class', 'radar-grid');
  [0.25, 0.5, 0.75, 1.0].forEach(lvl => {
    const pts = angles.map(a => {
      const r = radius * lvl;
      return [centerX + r * Math.cos(a), centerY + r * Math.sin(a)];
    });
    gridG.append('polygon').attr('points', pts.map(p => p.join(',')).join(' '))
      .attr('fill', 'none').attr('stroke', 'var(--border)').attr('stroke-width', 0.8);
  });
  angles.forEach((a, i) => {
    gridG.append('line').attr('x1', centerX).attr('y1', centerY)
      .attr('x2', centerX + radius * Math.cos(a)).attr('y2', centerY + radius * Math.sin(a))
      .attr('stroke', 'var(--border)').attr('stroke-width', 0.8);
    const lx = centerX + (radius + 22) * Math.cos(a);
    const ly = centerY + (radius + 22) * Math.sin(a);
    gridG.append('text').attr('x', lx).attr('y', ly).attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('fill', 'var(--text)')
      .style('font-size', '12px')
      .style('font-weight', '600')
      .style('font-family', 'Inter, sans-serif') 
      .text(dims[i].label);
  });

  svg.append('polygon').attr('points', points.map(p => p.join(',')).join(' '))
    .attr('fill', 'var(--accent)').attr('fill-opacity', 0.3)
    .attr('stroke', 'var(--accent)').attr('stroke-width', 2);
  svg.selectAll('.radar-dot').data(points).enter().append('circle')
    .attr('cx', d => d[0]).attr('cy', d => d[1]).attr('r', 4)
    .attr('fill', 'var(--accent)').attr('stroke', 'var(--surface)').attr('stroke-width', 1.5);

  const leg = d3.select('#radarLegend');
  leg.selectAll('*').remove();
  leg.append('span').html(`<span class="dot" style="background:var(--accent);opacity:0.6;"></span> Average student profile`);
  leg.append('span').style('color', 'var(--text-faint)').style('font-size', '14px').style('font-weight', '500')
    .text(' (higher = better, except AI hrs & anxiety)');

  svg.append('polygon').attr('points', points.map(p => p.join(',')).join(' '))
    .attr('fill', 'transparent').attr('stroke', 'none')
    .style('cursor', 'pointer')
    .on('mousemove', (evt) => {
      let html = '<b>Average profile</b>';
      dims.forEach((d, i) => {
        html += `<div class="t-row"><span>${d.label}</span><span>${avgVals[i] !== null ? avgVals[i].toFixed(1) : '—'}</span></div>`;
      });
      showTip(html, evt);
    })
    .on('mouseleave', hideTip);
}
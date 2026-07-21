// js/charts/paidPie.js
import { themeColors, showTip, hideTip } from '../utils/helpers.js';

export function renderPaidPie(data) {
  const C = themeColors();
  const el = d3.select('#chartPaidPie');
  el.selectAll('*').remove();
  const W = el.node().clientWidth || 400, H = 280, R = Math.min(W, H) / 2 - 10;
  const svg = el.append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`);
  const g = svg.append('g').attr('transform', `translate(${W/2},${H/2})`);

  const paid = data.filter(d => d.Paid_Subscription === true).length;
  const free = data.filter(d => d.Paid_Subscription === false).length;
  const agg = [
    ['Paid Plan', paid],
    ['Free Plan', free]
  ];

  const color = d3.scaleOrdinal().domain(['Paid Plan', 'Free Plan'])
    .range(['#1565C0', '#9E9E9E']);

  const pie = d3.pie().value(d => d[1]).sort(null);
  const arc = d3.arc().innerRadius(0).outerRadius(R);
  const arcHover = d3.arc().innerRadius(0).outerRadius(R + 6);

  g.selectAll('path').data(pie(agg)).enter().append('path')
    .attr('d', arc)
    .attr('fill', d => color(d.data[0]))
    .attr('stroke', C.surface).attr('stroke-width', 2).style('cursor', 'pointer')
    .on('mousemove', (evt, d) => {
      d3.select(evt.currentTarget).attr('d', arcHover);
      const pct = data.length ? d3.format('.0%')(d.data[1] / data.length) : '0%';
      showTip(`<b>${d.data[0]}</b><div class="t-row"><span>Students</span><span>${d.data[1]} (${pct})</span></div>`, evt);
    })
    .on('mouseleave', (evt) => { d3.select(evt.currentTarget).attr('d', arc); hideTip(); })
    .on('click', (evt, d) => {
      // Cross-filter using the global function
      if (window.__setPaidFilter) {
        window.__setPaidFilter(d.data[0] === 'Paid Plan');
      }
    });

  // Percentage labels on the pie
  g.selectAll('text.label')
    .data(pie(agg))
    .enter()
    .append('text')
    .attr('transform', d => `translate(${arc.centroid(d)})`)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .style('font-size', '12px')
    .style('font-weight', 'bold')
    .style('fill', '#fff')
    .text(d => `${d3.format('.0%')(d.data[1] / data.length)}`);

  g.append('text').attr('text-anchor', 'middle').attr('dy', '1.6em').attr('fill', 'var(--text)')
    .style('font-family', 'Inter').style('font-size', '12px').style('font-weight', 600)
    .text(`n = ${data.length}`);
}
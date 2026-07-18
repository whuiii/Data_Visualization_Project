import { CHART_QUALITATIVE, MILESTONES } from '../utils/constants.js';
import { showTip, hideTip } from '../utils/helpers.js';

export function renderTimeline() {
  const el = d3.select('#chartTimeline');
  el.selectAll('*').remove();
  const W = el.node().clientWidth || 1000, H = 260, M = { t: 20, r: 24, b: 36, l: 24 };
  const svg = el.append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`);
  const clipId = 'tlclip';
  svg.append('defs').append('clipPath').attr('id', clipId).append('rect').attr('x', M.l).attr('y', 0).attr('width', W - M.l - M.r).attr('height', H);

  const parse = d3.timeParse('%Y-%m-%d');
  MILESTONES.forEach(m => { m.s = parse(m.start); m.e = parse(m.end); });
  const fullExtent = [d3.min(MILESTONES, d => d.s), d3.max(MILESTONES, d => d.e)];
  let x = d3.scaleTime().domain(fullExtent).range([M.l, W - M.r]);
  const xOrig = x.copy();
  const rowY = d3.scalePoint().domain(MILESTONES.map(d => d.label)).range([M.t + 20, H - M.b]).padding(0.6);

  const gAxis = svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - M.b})`);
  const gContent = svg.append('g').attr('clip-path', `url(#${clipId})`);
  const gTrack = gContent.append('g');

  function draw() {
    gAxis.call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat('%b %d')));
    gTrack.selectAll('*').remove();
    gTrack.append('line').attr('x1', x(fullExtent[0])).attr('x2', x(fullExtent[1])).attr('y1', H / 2 + 6).attr('y2', H / 2 + 6).attr('stroke', 'var(--border)').attr('stroke-width', 2);

    const g = gTrack.selectAll('g.ms').data(MILESTONES).enter().append('g').attr('class', 'ms interactive').style('cursor', 'pointer');
    g.append('rect')
      .attr('x', d => x(d.s)).attr('width', d => Math.max(4, x(d.e) - x(d.s))).attr('y', d => rowY(d.label) - 10).attr('height', 20).attr('rx', 6)
      .attr('fill', (d, i) => CHART_QUALITATIVE[i % CHART_QUALITATIVE.length]).attr('opacity', 0.92)
      .on('mousemove', (evt, d) => showTip(`<b>${d.label}</b><div class="t-row"><span>Start</span><span>${d.start}</span></div><div class="t-row"><span>End</span><span>${d.end}</span></div>`, evt))
      .on('mouseleave', hideTip)
      .on('click', (evt, d) => showMilestone(d));
    g.append('text').attr('x', d => x(d.s)).attr('y', d => rowY(d.label) - 16).attr('fill', 'var(--text-muted)').style('font-size', '10px').text(d => d.label);
  }
  draw();

  function showMilestone(d) {
    d3.select('#milestoneDetail').html(`
      <div class="insight-card" style="margin-top:12px;">
        <h4>${d.label} <span style="color:var(--text-faint); font-weight:400; font-size:11px; font-family:'Roboto Mono';">(${d.start} → ${d.end})</span></h4>
        <p>${d.desc}</p>
      </div>`);
  }
  showMilestone(MILESTONES[0]);

  const zoom = d3.zoom().scaleExtent([1, 8]).translateExtent([[M.l, 0], [W - M.r, H]]).extent([[M.l, 0], [W - M.r, H]])
    .on('zoom', (evt) => { x = evt.transform.rescaleX(xOrig); draw(); });
  svg.call(zoom);
  d3.select('#tlZoomIn').on('click', () => svg.transition().call(zoom.scaleBy, 1.6));
  d3.select('#tlZoomOut').on('click', () => svg.transition().call(zoom.scaleBy, 0.6));
  d3.select('#tlReset').on('click', () => svg.transition().call(zoom.transform, d3.zoomIdentity));
}
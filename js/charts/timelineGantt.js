// js/charts/timelineGantt.js
// Converts the original standalone timeline into a module that fits the dashboard.

import { themeColors } from '../utils/helpers.js';

const PHASES = [
  { key:'init',  title:'Project Initiation',        color:'var(--blue)',
    start:'2026-02-01', end:'2026-02-12',
    desc:'Formed the team, selected the Education/AI-impact domain, and scoped stakeholder requirements and dashboard objectives.' },
  { key:'collect', title:'Data Collection',          color:'var(--green)',
    start:'2026-02-09', end:'2026-03-06',
    desc:'Assembled the Feb–Jun 2026 student dataset (50,000 records) covering GPA, AI usage, burnout, and policy variables.' },
  { key:'clean', title:'Data Cleaning',              color:'var(--teal)',
    start:'2026-03-02', end:'2026-03-23',
    desc:'Validated types, checked for missing/outlier values, and derived GPA change and burnout scores used throughout the dashboard.' },
  { key:'dev',   title:'Dashboard Development',      color:'var(--amber)',
    start:'2026-03-18', end:'2026-05-08',
    desc:'Built the D3.js dashboard: KPI cards, this timeline, linked trend charts, heat map, and parallel-coordinates view.' },
  { key:'test',  title:'Testing and Validation',     color:'var(--purple)',
    start:'2026-05-04', end:'2026-06-05',
    desc:'Cross-checked chart aggregates against the raw dataset, tested every interaction, and verified responsive/mobile layout.' },
  { key:'deploy',title:'Deployment / Presentation',  color:'var(--blue)',
    start:'2026-06-03', end:'2026-06-19',
    desc:'Packaged the dashboard, source files, and dataset for submission and prepared the in-class demonstration.' },
];

const METRICS = {
  gpaChange:  { label:'Average GPA Δ by week',      fmt: d3.format('+.3f'), color:'var(--ink)'  },
  aiHours:    { label:'Average AI use (hrs/wk) by week', fmt: d=>d.toFixed(2)+'h', color:'var(--amber)' },
  highBurnout:{ label:'High-burnout share (%) by week',  fmt: d=>d.toFixed(1)+'%', color:'var(--red)'  },
};

// Internal state
let state = { metric:'gpaChange', selected:'init' };
let currentData = [];
let weeklyData = [];
let xScale = null;
let zoomBehavior = null;
let svg, g, barsG, axisG, trendG, trendAxisG, gridG;

const parseDate = d3.timeParse('%Y-%m-%d');
const fmtAxis = d3.timeFormat('%b %d');

// Tooltip helpers – reuse the dashboard's #tooltip
function showTip(html, evt){
  const tip = d3.select('#tooltip');
  tip.style('display','block').html(html)
    .style('left', (evt.pageX+14)+'px').style('top',(evt.pageY-10)+'px');
}
function moveTip(evt){
  d3.select('#tooltip')
    .style('left',(evt.pageX+14)+'px').style('top',(evt.pageY-10)+'px');
}
function hideTip(){
  d3.select('#tooltip').style('display','none');
}

// Build weekly aggregates from the dataset (simulate weekly data from months)
function prepareWeeklyData(data) {
  const monthNames = ['February','March','April','May','June'];
  const monthly = monthNames.map(m => {
    const sub = data.filter(d => d.Month === m);
    return {
      month: m,
      gpaChange: sub.length ? d3.mean(sub, d => d.GPA_Improvement) : 0,
      aiHours: sub.length ? d3.mean(sub, d => d.Weekly_GenAI_Hours) : 0,
      highBurnout: sub.length ? 100 * sub.filter(d => d.Burnout_Risk_Level === 'High').length / sub.length : 0,
    };
  });
  // Spread each month's average over 4 weeks
  const weekly = [];
  monthly.forEach((m, idx) => {
    const monthStart = new Date(2026, idx + 1, 1); // Feb = month 1
    const numWeeks = 4;
    for (let w = 0; w < numWeeks; w++) {
      const d = new Date(monthStart);
      d.setDate(d.getDate() + w * 7);
      weekly.push({
        date: d,
        n: Math.round(data.length / 20),
        gpaChange: m.gpaChange,
        aiHours: m.aiHours,
        highBurnout: m.highBurnout,
      });
    }
  });
  return weekly;
}

// Main render function
export function renderGanttTimeline(data) {
  // Store data
  currentData = data;
  weeklyData = prepareWeeklyData(data);

  const container = document.getElementById('chartGanttTimeline');
  if (!container) {
    console.error('❌ Container #chartGanttTimeline not found');
    return;
  }
  const el = d3.select('#chartGanttTimeline');
  el.selectAll('*').remove();

  // Dimensions (same as original)
  const W = container.clientWidth || 900;
  const H = 480;
  const margin = { top: 16, right: 30, bottom: 36, left: 20 };
  const FULL_W = W - margin.left - margin.right;
  const LANE_TOP = 26, LANE_STEP = 58, BAR_H = 36;
  const AXIS_Y = LANE_TOP + PHASES.length * LANE_STEP + 6;
  const TREND_TOP = AXIS_Y + 34, TREND_H = 120;

  // Create SVG
  svg = el.append('svg')
    .attr('width', '100%')
    .attr('height', H)
    .attr('viewBox', `0 0 ${W} ${H}`)
    .style('display', 'block');

  g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Date domain
  const allStarts = PHASES.map(p => parseDate(p.start));
  const allEnds = PHASES.map(p => parseDate(p.end));
  const domainStart = d3.timeDay.offset(d3.min(allStarts), -4);
  const domainEnd = d3.timeDay.offset(d3.max(allEnds), 6);
  xScale = d3.scaleTime().domain([domainStart, domainEnd]).range([0, FULL_W]);

  // Clip path
  svg.append('clipPath')
    .attr('id', 'ganttClip')
    .append('rect')
    .attr('width', FULL_W)
    .attr('height', TREND_TOP + TREND_H - margin.top);
  const clipped = g.append('g')
    .attr('clip-path', 'url(#ganttClip)');

  // Layers
  gridG = clipped.append('g').attr('class', 'gridline');
  barsG = clipped.append('g').attr('class', 'bars-g');
  axisG = g.append('g').attr('class', 'axis')
    .attr('transform', `translate(0,${AXIS_Y})`);
  trendG = clipped.append('g').attr('class', 'trend-g');
  trendAxisG = g.append('g').attr('class', 'axis trend-axis');

  // Trend label
  g.append('text')
    .attr('class', 'trend-label')
    .attr('x', 0)
    .attr('y', TREND_TOP - 10)
    .attr('id', 'trendLabel')
    .style('font-family', 'Roboto Mono, monospace')
    .style('font-size', '10px')
    .style('fill', 'var(--text-faint)')
    .style('text-transform', 'uppercase')
    .style('letter-spacing', '0.05em')
    .text(METRICS[state.metric].label);

  // Initial draw
  draw(xScale);

  // Zoom behavior
  zoomBehavior = d3.zoom()
    .scaleExtent([1, 10])
    .translateExtent([[0, 0], [FULL_W, TREND_TOP + TREND_H - margin.top]])
    .extent([[0, 0], [FULL_W, TREND_TOP + TREND_H - margin.top]])
    .on('zoom', (evt) => draw(evt.transform.rescaleX(xScale)));
  svg.call(zoomBehavior);

  // Attach controls (already exist in the DOM)
  document.getElementById('tlZoomIn').onclick = () => {
    svg.transition().duration(300).call(zoomBehavior.scaleBy, 1.5);
  };
  document.getElementById('tlZoomOut').onclick = () => {
    svg.transition().duration(300).call(zoomBehavior.scaleBy, 1/1.5);
  };
  document.getElementById('tlReset').onclick = () => {
    svg.transition().duration(400).call(zoomBehavior.transform, d3.zoomIdentity);
  };

  // Metric buttons
  document.querySelectorAll('.metric-btn').forEach(btn => {
    btn.onclick = function() {
      document.querySelectorAll('.metric-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      state.metric = this.dataset.metric;
      document.getElementById('trendLabel').textContent = METRICS[state.metric].label;
      draw(xScale);
    };
  });

  // Select initial phase
  selectPhase('init');
}

// Draw function (identical logic to original)
function draw(xs) {
  if (!xs) return;
  const metricKey = state.metric;
  const metric = METRICS[metricKey];

  // Grid lines (monthly)
  const months = d3.timeMonth.range(d3.timeMonth.floor(xs.domain()[0]), xs.domain()[1]);
  gridG.selectAll('line')
    .data(months)
    .join('line')
    .attr('x1', d => xs(d))
    .attr('x2', d => xs(d))
    .attr('y1', 0)
    .attr('y2', 220) // enough height
    .attr('stroke', 'var(--border)')
    .attr('stroke-width', 0.5)
    .attr('opacity', 0.5);

  // Bottom axis
  axisG.call(d3.axisBottom(xs).ticks(6).tickFormat(fmtAxis))
    .style('font-family', 'Roboto Mono, monospace')
    .style('font-size', '10px');

  // Bars
  const bars = barsG.selectAll('.bar-g')
    .data(PHASES, d => d.key)
    .join(enter => {
      const g = enter.append('g').attr('class', 'bar-g');
      g.append('text').attr('class', 'bar-label')
        .style('font-family', 'Inter, sans-serif')
        .style('font-size', '12.5px')
        .style('font-weight', '600')
        .style('fill', 'var(--text)');
      g.append('rect').attr('class', 'bar')
        .attr('rx', 7).attr('ry', 7)
        .style('cursor', 'pointer');
      return g;
    });

  bars.attr('transform', (d, i) => `translate(0, ${LANE_TOP + i * LANE_STEP})`);
  bars.select('.bar-label')
    .attr('x', d => xs(parseDate(d.start)))
    .attr('y', -8)
    .text(d => d.title);
  bars.select('.bar')
    .attr('x', d => xs(parseDate(d.start)))
    .attr('width', d => Math.max(xs(parseDate(d.end)) - xs(parseDate(d.start)), 4))
    .attr('height', BAR_H)
    .attr('fill', d => d.color)
    .attr('opacity', d => state.selected === d.key ? 1 : 0.82)
    .attr('stroke', d => state.selected === d.key ? 'var(--text)' : 'none')
    .attr('stroke-width', 2)
    .on('click', (evt, d) => selectPhase(d.key))
    .on('mouseenter', (evt, d) => {
      showTip(`<b>${d.title}</b><br>${d.start} → ${d.end}`, evt);
    })
    .on('mousemove', moveTip)
    .on('mouseleave', hideTip);

  // Trend line
  const vals = weeklyData.map(w => w[metricKey]);
  const yExt = d3.extent(vals);
  const pad = (yExt[1] - yExt[0]) * 0.2 || Math.abs(yExt[0] * 0.1) || 1;
  const y = d3.scaleLinear()
    .domain([yExt[0] - pad, yExt[1] + pad])
    .nice()
    .range([TREND_H, 0]);

  trendAxisG.attr('transform', `translate(0,${TREND_TOP})`)
    .call(d3.axisLeft(y).ticks(4).tickFormat(metric.fmt).tickSize(-1))
    .style('font-family', 'Roboto Mono, monospace')
    .style('font-size', '9px');

  const line = d3.line()
    .x(d => xs(d.date))
    .y(d => y(d[metricKey]))
    .curve(d3.curveMonotoneX);

  const area = d3.area()
    .x(d => xs(d.date))
    .y0(TREND_H)
    .y1(d => y(d[metricKey]))
    .curve(d3.curveMonotoneX);

  trendG.attr('transform', `translate(0,${TREND_TOP})`);
  trendG.selectAll('.trend-area')
    .data([weeklyData])
    .join('path')
    .attr('class', 'trend-area')
    .attr('d', area)
    .attr('fill', metric.color)
    .attr('opacity', 0.14)
    .attr('stroke', 'none');

  trendG.selectAll('.trend-line')
    .data([weeklyData])
    .join('path')
    .attr('class', 'trend-line')
    .attr('d', line)
    .attr('fill', 'none')
    .attr('stroke', metric.color)
    .attr('stroke-width', 2.2);

  trendG.selectAll('.trend-pt')
    .data(weeklyData)
    .join('circle')
    .attr('class', 'trend-pt')
    .attr('cx', d => xs(d.date))
    .attr('cy', d => y(d[metricKey]))
    .attr('r', 3.5)
    .attr('fill', metric.color)
    .attr('stroke', 'var(--surface)')
    .attr('stroke-width', 1.2)
    .style('cursor', 'pointer')
    .on('mouseenter', (evt, d) => {
      showTip(`<b>Week of ${d3.timeFormat('%b %d')(d.date)}</b><br>n=${d.n}<br>GPA Δ: ${d3.format('+.3f')(d.gpaChange)}<br>AI use: ${d.aiHours.toFixed(2)}h/wk<br>High burnout: ${d.highBurnout.toFixed(1)}%`, evt);
    })
    .on('mousemove', moveTip)
    .on('mouseleave', hideTip);
}

// Select a phase and update detail panel
function selectPhase(key) {
  state.selected = key;
  const p = PHASES.find(d => d.key === key);
  const s = parseDate(p.start);
  const e = parseDate(p.end);
  // Approximate: filter rows by month within the range
  const rows = currentData.filter(d => {
    const monthIndex = ['February','March','April','May','June'].indexOf(d.Month);
    if (monthIndex === -1) return false;
    const dDate = new Date(2026, monthIndex + 1, 15);
    return dDate >= s && dDate <= e;
  });
  const n = rows.length;
  const gpaChange = n ? d3.mean(rows, d => d.GPA_Improvement) : 0;
  const aiHours = n ? d3.mean(rows, d => d.Weekly_GenAI_Hours) : 0;
  const highBurnout = n ? 100 * rows.filter(d => d.Burnout_Risk_Level === 'High').length / n : 0;

  const panel = document.getElementById('timelineDetailPanel');
  panel.style.borderLeftColor = p.color;
  panel.innerHTML = `
    <span style="font-weight:600; font-size:16px;">${p.title}</span>
    <span style="font-family:'Roboto Mono',monospace; font-size:12px; color:var(--text-muted); margin-left:8px;">(${p.start} → ${p.end})</span>
    <div style="margin-top:6px; color:var(--text);">${p.desc}</div>
    <div style="margin-top:8px; font-family:'Roboto Mono',monospace; font-size:11.5px; color:var(--teal);">
      Dataset check-in · n=${n.toLocaleString()} records in this window · avg GPA Δ ${d3.format('+.3f')(gpaChange)} · AI use ${aiHours.toFixed(2)}h/wk · high burnout ${highBurnout.toFixed(1)}%
    </div>
  `;

  if (xScale) draw(xScale);
}
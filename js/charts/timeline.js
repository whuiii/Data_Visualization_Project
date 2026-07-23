import { MILESTONES, CHART_QUALITATIVE } from '../utils/constants.js';
import { showTip, hideTip } from '../utils/helpers.js';

// Adjust if your data file lives somewhere else relative to this module.
const CSV_FILE = '/data/ai_student_impact.csv';

const METRICS = {
  gpaChange:   { label: 'Average GPA Δ by week',      fmt: d3.format('+.3f'),         color: '#1565C0' },
  aiHours:     { label: 'Average AI use (hrs/wk)',    fmt: d => d.toFixed(2) + 'h',   color: '#F9A825' },
  highBurnout: { label: 'High-burnout share (%)',     fmt: d => d.toFixed(1) + '%',   color: '#C62828' },
};

const parseDate = d3.timeParse('%Y-%m-%d');
// The dataset's Date column includes a "00:00:00" time component
const parseCsvDate = d3.timeParse('%Y-%m-%d %H:%M:%S');
const parseCsvDateFallback = d3.timeParse('%Y-%m-%d');
function parseRowDate(raw) {
  if (!raw) return null;
  return parseCsvDate(raw) || parseCsvDateFallback(raw);
}
const fmtAxis = d3.timeFormat('%b %d');

let RAW = null, WEEKLY = null, loading = null;
const state = { metric: 'gpaChange', selected: MILESTONES[0].key };

export function renderTimeline() {
  const el = d3.select('#chartTimeline');
  if (el.empty()) return;

  if (RAW) {
    buildChart(el);
    return;
  }

  el.html('<div class="mono" style="color:var(--text-muted); font-size:12.5px; text-align:center; padding:40px 0;">Loading dataset…</div>');

  if (!loading) {
    loading = d3.text(CSV_FILE).then(text => {
      const clean = text.replace(/^\uFEFF/, '');
      const rows = d3.csvParse(clean, row => ({
        date: parseRowDate(row.Date),
        gpaChange: (+row.Post_Semester_GPA) - (+row.Pre_Semester_GPA),
        aiHours: +row.Weekly_GenAI_Hours,
        burnout: row.Burnout_Risk_Level,
      })).filter(d => d.date);
      RAW = rows;
      WEEKLY = d3.rollups(
        RAW,
        v => ({
          n: v.length,
          gpaChange: d3.mean(v, d => d.gpaChange),
          aiHours: d3.mean(v, d => d.aiHours),
          highBurnout: 100 * v.filter(d => d.burnout === 'High').length / v.length,
        }),
        d => +d3.timeMonday.floor(d.date)
      ).map(([t, stats]) => ({ date: new Date(t), ...stats }))
       .sort((a, b) => a.date - b.date);
    });
  }

  loading
    .then(() => buildChart(el))
    .catch(err => {
      console.error(err);
      el.html(
        `<div class="mono" style="color:var(--red); font-size:12.5px; text-align:center; padding:40px 0;">` +
        `Could not load ${CSV_FILE}. Check the data path and that this page is served over http(s), not file://.</div>`
      );
    });
}

/* ---- chart build ---- */
let x0 = null, currentXs = null, zoomBehavior = null;
let svg, g, barsG, axisG, trendG, trendAxisG, gridG;


const margin = { top: 16, right: 30, bottom: 48, left: 60 };
const LANE_TOP = 26, LANE_STEP = 56,  BAR_H = 26;

function buildChart(el) {
  el.html('');

  const W = el.node().clientWidth || 1000;
  const FULL_W = W - margin.left - margin.right;
  const AXIS_Y = LANE_TOP + MILESTONES.length * LANE_STEP + 6;
  // 🔧 CHANGED: increased offset from 34 to 60
  const TREND_TOP = AXIS_Y + 60;
  const TREND_H = 120;
  const H = TREND_TOP + TREND_H + margin.top + margin.bottom;

  svg = el.append('svg').attr('viewBox', `0 0 ${W} ${H}`);
  g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const allStarts = MILESTONES.map(p => parseDate(p.start));
  const allEnds = MILESTONES.map(p => parseDate(p.end));
  const domainStart = d3.timeDay.offset(d3.min(allStarts), -4);
  const domainEnd = d3.timeDay.offset(d3.max(allEnds), 6);
  x0 = d3.scaleTime().domain([domainStart, domainEnd]).range([0, FULL_W]);

  svg.append('clipPath').attr('id', 'tlClip').append('rect')
    .attr('width', FULL_W).attr('height', TREND_TOP + TREND_H - margin.top);
  const clipped = g.append('g').attr('clip-path', 'url(#tlClip)');

  gridG = clipped.append('g').attr('class', 'gridline');
  barsG = clipped.append('g').attr('class', 'bars-g');
  axisG = g.append('g').attr('class', 'axis').attr('transform', `translate(0,${AXIS_Y})`);
  trendG = clipped.append('g').attr('class', 'trend-g');
  trendAxisG = g.append('g').attr('class', 'axis trend-axis');

  g.append('text').attr('class', 'trend-label').attr('id', 'tlTrendLabel')
    .attr('x', 0).attr('y', TREND_TOP - 10)
    .style('font-family', 'var(--font-mono, monospace)').style('font-size', '10px')
    .style('fill', 'var(--text-faint)').style('text-transform', 'uppercase');

  draw(x0, { FULL_W, AXIS_Y, TREND_TOP, TREND_H });

  zoomBehavior = d3.zoom().scaleExtent([1, 10])
    .translateExtent([[0, 0], [FULL_W, TREND_TOP + TREND_H - margin.top]])
    .extent([[0, 0], [FULL_W, TREND_TOP + TREND_H - margin.top]])
    .on('zoom', evt => draw(evt.transform.rescaleX(x0), { FULL_W, AXIS_Y, TREND_TOP, TREND_H }));
  svg.call(zoomBehavior);

  bindControlsOnce();
  selectMilestone(state.selected);
}

function bindControlsOnce() {
  const zin = document.getElementById('tlZoomIn');
  const zout = document.getElementById('tlZoomOut');
  const reset = document.getElementById('tlReset');
  if (zin) zin.onclick = () => svg.transition().duration(300).call(zoomBehavior.scaleBy, 1.5);
  if (zout) zout.onclick = () => svg.transition().duration(300).call(zoomBehavior.scaleBy, 1 / 1.5);
  if (reset) reset.onclick = () => svg.transition().duration(400).call(zoomBehavior.transform, d3.zoomIdentity);

  document.querySelectorAll('.tl-metric-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tl-metric-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.metric = btn.dataset.metric;
      if (currentXs) redrawTrend(currentXs);
    };
  });
}

function draw(xs, dims) {
  currentXs = xs;
  const { FULL_W, AXIS_Y, TREND_TOP, TREND_H } = dims;

  const months = d3.timeMonth.range(d3.timeMonth.floor(xs.domain()[0]), xs.domain()[1]);
  gridG.selectAll('line').data(months).join('line')
    .attr('x1', d => xs(d)).attr('x2', d => xs(d))
    .attr('y1', 0).attr('y2', TREND_TOP + TREND_H - margin.top)
    .attr('stroke', 'var(--border)');

  axisG.call(d3.axisBottom(xs).ticks(6).tickFormat(fmtAxis));

  const bars = barsG.selectAll('.bar-g').data(MILESTONES, d => d.key).join(enter => {
    const bgn = enter.append('g').attr('class', 'bar-g interactive').style('cursor', 'pointer');
    bgn.append('text').attr('class', 'bar-label')
      .style('font-size', '11.5px').style('font-weight', 600).style('fill', 'var(--text)');
    bgn.append('rect').attr('class', 'bar').attr('rx', 6).attr('ry', 6);
    return bgn;
  });
  bars.attr('transform', (d, i) => `translate(0,${LANE_TOP + i * LANE_STEP})`);
  bars.select('.bar-label')
    .attr('x', d => xs(parseDate(d.start))).attr('y', -8)
    .text(d => d.label);
  bars.select('.bar')
    .attr('x', d => xs(parseDate(d.start)))
    .attr('width', d => Math.max(xs(parseDate(d.end)) - xs(parseDate(d.start)), 4))
    .attr('height', BAR_H)
    .attr('fill', (d, i) => CHART_QUALITATIVE[i % CHART_QUALITATIVE.length])
    .attr('opacity', d => state.selected === d.key ? 1 : 0.82)
    .attr('stroke', d => state.selected === d.key ? 'var(--text)' : 'none')
    .attr('stroke-width', 2)
    .on('click', (evt, d) => selectMilestone(d.key))
    .on('mousemove', (evt, d) => showTip(
      `<b>${d.label}</b><div class="t-row"><span>Start</span><span>${d.start}</span></div><div class="t-row"><span>End</span><span>${d.end}</span></div>`,
      evt
    ))
    .on('mouseleave', hideTip);

  redrawTrend(xs, dims);
}

function redrawTrend(xs, dims) {
  if (!WEEKLY) return;
  dims = dims || currentDims(xs);
  const { TREND_TOP, TREND_H } = dims;

  const metric = METRICS[state.metric];
  const labelNode = document.getElementById('tlTrendLabel');
  if (labelNode) labelNode.textContent = metric.label;

  const vals = WEEKLY.map(w => w[state.metric]);
  const yExt = d3.extent(vals);
  const pad = (yExt[1] - yExt[0]) * 0.2 || Math.abs(yExt[0] * 0.1) || 1;
  const y = d3.scaleLinear().domain([yExt[0] - pad, yExt[1] + pad]).nice().range([TREND_H, 0]);

  trendAxisG.attr('transform', `translate(0,${TREND_TOP})`)
    .call(d3.axisLeft(y).ticks(4).tickFormat(metric.fmt).tickSize(-1));

  const line = d3.line().x(d => xs(d.date)).y(d => y(d[state.metric])).curve(d3.curveMonotoneX);
  const area = d3.area().x(d => xs(d.date)).y0(TREND_H).y1(d => y(d[state.metric])).curve(d3.curveMonotoneX);

  trendG.attr('transform', `translate(0,${TREND_TOP})`);
  trendG.selectAll('.trend-area').data([WEEKLY]).join('path')
    .attr('class', 'trend-area').attr('d', area).attr('fill', metric.color).attr('opacity', 0.14).attr('stroke', 'none');
  trendG.selectAll('.trend-line').data([WEEKLY]).join('path')
    .attr('class', 'trend-line').attr('d', line).attr('fill', 'none').attr('stroke', metric.color).attr('stroke-width', 2.2);
  trendG.selectAll('.trend-pt').data(WEEKLY).join('circle')
    .attr('class', 'trend-pt').style('cursor', 'pointer')
    .attr('cx', d => xs(d.date)).attr('cy', d => y(d[state.metric])).attr('r', 3.5)
    .attr('fill', metric.color).attr('stroke', 'var(--surface)').attr('stroke-width', 1.2)
    .on('mousemove', (evt, d) => showTip(
      `<b>Week of ${d3.timeFormat('%b %d')(d.date)}</b>` +
      `<div class="t-row"><span>n</span><span>${d.n}</span></div>` +
      `<div class="t-row"><span>GPA Δ</span><span>${d3.format('+.3f')(d.gpaChange)}</span></div>` +
      `<div class="t-row"><span>AI use</span><span>${d.aiHours.toFixed(2)}h/wk</span></div>` +
      `<div class="t-row"><span>High burnout</span><span>${d.highBurnout.toFixed(1)}%</span></div>`,
      evt
    ))
    .on('mouseleave', hideTip);
}

function currentDims(xs) {
  const AXIS_Y = LANE_TOP + MILESTONES.length * LANE_STEP + 6;
  return { FULL_W: xs.range()[1], AXIS_Y, TREND_TOP: AXIS_Y + 60, TREND_H: 120 };
}

/* ---- detail panel ---- */
function selectMilestone(key) {
  state.selected = key;
  const m = MILESTONES.find(d => d.key === key);
  const idx = MILESTONES.indexOf(m);
  const color = CHART_QUALITATIVE[idx % CHART_QUALITATIVE.length];

  const s = parseDate(m.start), e = parseDate(m.end);
  const rows = RAW ? RAW.filter(d => d.date >= s && d.date <= e) : [];
  const n = rows.length;
  const gpaChange = n ? d3.mean(rows, d => d.gpaChange) : 0;
  const aiHours = n ? d3.mean(rows, d => d.aiHours) : 0;
  const highBurnout = n ? 100 * rows.filter(d => d.burnout === 'High').length / n : 0;

  const panel = d3.select('#milestoneDetail');
  panel.html(`
    <div class="insight-card" style="margin-top:12px; border-left:4px solid ${color};">
      <h4>${m.label} <span style="color:var(--text-faint); font-weight:400; font-size:11px; font-family:var(--font-mono, monospace);">(${m.start} → ${m.end})</span></h4>
      <p>${m.desc}</p>
      <p class="mono" style="color:var(--text-muted); font-size:11.5px; margin-top:8px;">
        Dataset check-in &middot; n=${n.toLocaleString()} records in this window &middot;
        avg GPA Δ ${d3.format('+.3f')(gpaChange)} &middot;
        AI use ${aiHours.toFixed(2)}h/wk &middot;
        high burnout ${highBurnout.toFixed(1)}%
      </p>
    </div>`);

  if (currentXs) draw(currentXs, currentDims(currentXs));
}
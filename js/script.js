import { state, setData, getFiltered, getMajors, getYears, getPolicies, getMonths } from './state.js';
import { renderKPIs } from './charts/kpi.js';
import { renderDonut } from './charts/donut.js';
import { renderScatter } from './charts/scatter.js';
import { renderRadar } from './charts/radar.js';
import { renderDrilldown } from './charts/drilldown.js';
import { renderHeatmap } from './charts/heatmap.js';
import { renderParallel } from './charts/parallel.js';
import { renderTrend } from './charts/trend.js';
import { renderTimeline } from './charts/timeline.js';
import { renderInsights, renderSearchHit } from './charts/insights.js';
import { renderUsageBarDual } from './charts/usageBarDual.js';
import { renderPaidPie } from './charts/paidPie.js';

// Lecturer charts
import { renderScatterMatrix } from './charts/scatterMatrix.js';
import { renderHistogram } from './charts/histogram.js';
import { renderBoxPlot } from './charts/boxPlot.js';

// Track current persona
let currentPersona = 'student';

function debounce(fn, delay = 150) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => { fn.apply(this, args); }, delay);
  };
}

const refreshAll = function () {
  const data = getFiltered();
  const countEl = document.getElementById('recordCount');
  if (countEl) countEl.textContent = data.length.toLocaleString();

  requestAnimationFrame(() => {
    // Always render KPIs, insights, timeline, and search
    renderKPIs(data);
    renderInsights(data);
    renderSearchHit(data);
    renderTimeline();

    // Conditional rendering based on persona
    if (currentPersona === 'student') {
      // Show student view, hide lecturer view
      document.getElementById('studentView').style.display = 'block';
      document.getElementById('lecturerView').style.display = 'none';

      // Student charts
      renderDonut(data);
      renderUsageBarDual(data);        // GPA vs AI hours (grouped bar)
      renderScatter(data);
      renderRadar(data);
      renderHeatmap('#chartHeatmap', data);   // student heatmap container
      renderDrilldown(data);
      renderParallel(data);
      renderTrend(data);
      renderPaidPie(data);             // paid plan pie chart
    } else if (currentPersona === 'lecturer') {
      // Show lecturer view, hide student view
      document.getElementById('studentView').style.display = 'none';
      document.getElementById('lecturerView').style.display = 'block';

      // Lecturer charts
      renderHeatmap('#chartHeatmapLecturer', data);   // lecturer heatmap container
      renderScatterMatrix(data);
      renderHistogram(data);
      renderBoxPlot(data);
    }
    // (Executive persona could be added similarly)
  });
};

window.__refreshAll = debounce(refreshAll, 150);

// Set paid filter (called from pie chart)
window.__setPaidFilter = (isPaid) => {
  state.paidFilter = isPaid;
  window.__refreshAll();
};

function applyPersona(persona) {
  currentPersona = persona;  // update global

  d3.selectAll('.persona-card').classed('active', false);
  d3.select(`.persona-card[data-persona="${persona}"]`).classed('active', true);

  const body = d3.select('body');
  body.classed('mode-standard', false);
  body.classed('mode-accessible', false);
  body.classed('mode-simple', false);

  let modeClass = 'mode-standard';
  if (persona === 'student') modeClass = 'mode-standard';
  else if (persona === 'lecturer') modeClass = 'mode-accessible';
  else if (persona === 'executive') modeClass = 'mode-simple';

  let currentTheme = 'theme-light';
  const themeMatch = body.attr('class').match(/theme-\S+/);
  if (themeMatch) currentTheme = themeMatch[0];

  body.attr('class', currentTheme + ' ' + modeClass);

  const searchWrap = document.getElementById('searchWrap');
  if (persona === 'executive') {
    searchWrap.style.display = 'none';
  } else {
    searchWrap.style.display = 'flex';
  }

  const details = document.querySelector('details');
  if (persona === 'student' || persona === 'lecturer') {
    details.style.display = 'block';
  } else {
    details.style.display = 'none';
  }

  window.__refreshAll();
}

function navigateTo(page) {
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.navitem').forEach(el => el.classList.remove('active'));
  document.querySelector(`.navitem[data-page="${page}"]`).classList.add('active');
  window.__refreshAll();
}

function attachUIListeners() {
  d3.selectAll('.persona-card').on('click', function () {
    const persona = this.dataset.persona;
    applyPersona(persona);
  });

  d3.selectAll('.hero-theme-toggles button').on('click', function () {
    const theme = this.dataset.theme;
    d3.selectAll('.hero-theme-toggles button').classed('active', false);
    d3.select(this).classed('active', true);
    const body = d3.select('body');
    let mode = 'mode-standard';
    const modeMatch = body.attr('class').match(/mode-\S+/);
    if (modeMatch) mode = modeMatch[0];
    body.attr('class', 'theme-' + theme + ' ' + mode);
    window.__refreshAll();
  });

  const slider = document.getElementById('fontSlider');
  const label = document.getElementById('fontSizeLabel');
  slider.addEventListener('input', function () {
    const val = parseFloat(this.value);
    label.textContent = Math.round(val * 100) + '%';
    document.documentElement.style.setProperty('--font-scale', val);
  });

  d3.selectAll('.navitem').on('click', function () {
    const page = this.dataset.page;
    navigateTo(page);
  });

  d3.select('#resetBtn').on('click', () => {
    state.major = 'all';
    state.year = 'all';
    state.policy = 'all';
    state.month = 'all';
    state.search = '';
    state.minHours = 0;
    state.brushMajor = null;
    state.brushUseCase = null;
    state.scatterBrush = null;
    state.parallelBrush = null;
    state.drillYear = null;
    state.paidFilter = null;

    d3.select('#f-major').property('value', 'all');
    d3.select('#f-year').property('value', 'all');
    d3.select('#f-policy').property('value', 'all');
    d3.select('#f-month').property('value', 'all');
    d3.select('#f-search').property('value', '');
    d3.select('#f-hours').property('value', 0);
    d3.select('#rangeLbl').text('0h+');
    window.__refreshAll();
  });

  d3.select('#f-major').on('change', function () { state.major = this.value; window.__refreshAll(); });
  d3.select('#f-year').on('change', function () { state.year = this.value; window.__refreshAll(); });
  d3.select('#f-policy').on('change', function () { state.policy = this.value; window.__refreshAll(); });
  d3.select('#f-month').on('change', function () { state.month = this.value; window.__refreshAll(); });

  const hoursSlider = document.getElementById('f-hours');
  const rangeLabel = document.getElementById('rangeLbl');
  hoursSlider.addEventListener('input', function () {
    rangeLabel.textContent = this.value + 'h+';
    state.minHours = +this.value;
  });
  hoursSlider.addEventListener('change', function () { window.__refreshAll(); });

  const searchInput = document.getElementById('f-search');
  searchInput.addEventListener('input', function () {
    state.search = this.value.trim();
    window.__refreshAll();
  });

  d3.select('#drillBack').on('click', () => {
    state.drillYear = null;
    window.__refreshAll();
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { window.__refreshAll(); }, 200);
  });
}

function populateFilters() {
  const majors = getMajors();
  const years = getYears();
  const policies = getPolicies();
  const months = getMonths();

  const majorSelect = d3.select('#f-major');
  majorSelect.selectAll('option.dyn').remove();
  majorSelect.selectAll('option.dyn').data(majors).enter().append('option')
    .attr('class', 'dyn').attr('value', d => d).text(d => d);

  const yearSelect = d3.select('#f-year');
  yearSelect.selectAll('option.dyn').remove();
  yearSelect.selectAll('option.dyn').data(years).enter().append('option')
    .attr('class', 'dyn').attr('value', d => d).text(d => d);

  const policySelect = d3.select('#f-policy');
  policySelect.selectAll('option.dyn').remove();
  policySelect.selectAll('option.dyn').data(policies).enter().append('option')
    .attr('class', 'dyn').attr('value', d => d).text(d => d.replace(/_/g, ' '));

  const monthSelect = d3.select('#f-month');
  monthSelect.selectAll('option.dyn').remove();
  monthSelect.selectAll('option.dyn').data(months).enter().append('option')
    .attr('class', 'dyn').attr('value', d => d).text(d => d);
}

function loadData() {
  const url = 'public/data/ai_student_impact.csv';
  d3.csv(url)
    .then(raw => {
      if (!raw || raw.length === 0) throw new Error('Empty file');
      raw.forEach(d => {
        d.Student_ID = +d.Student_ID;
        d.Pre_Semester_GPA = +d.Pre_Semester_GPA;
        d.Weekly_GenAI_Hours = +d.Weekly_GenAI_Hours;
        d.Tool_Diversity = +d.Tool_Diversity;
        d.Paid_Subscription = d.Paid_Subscription === 'TRUE' || d.Paid_Subscription === true;
        d.Traditional_Study_Hours = +d.Traditional_Study_Hours;
        d.Perceived_AI_Dependency = +d.Perceived_AI_Dependency;
        d.Anxiety_Level_During_Exams = +d.Anxiety_Level_During_Exams;
        d.Post_Semester_GPA = +d.Post_Semester_GPA;
        d.Skill_Retention_Score = +d.Skill_Retention_Score;
        d.GPA_Improvement = +d.GPA_Improvement;
      });
      setData(raw);
      populateFilters();
      window.__refreshAll();
      navigateTo('charts');
      console.log(`✅ Data loaded (${raw.length} rows)`);
    })
    .catch(err => {
      console.error(err);
      document.getElementById('recordCount').textContent = '❌ Dataset not found.';
      // fallback
      d3.csv('ai_student_impact.csv')
        .then(raw => {
          if (!raw || raw.length === 0) throw new Error('Empty file');
          raw.forEach(d => {
            d.Student_ID = +d.Student_ID;
            d.Pre_Semester_GPA = +d.Pre_Semester_GPA;
            d.Weekly_GenAI_Hours = +d.Weekly_GenAI_Hours;
            d.Tool_Diversity = +d.Tool_Diversity;
            d.Paid_Subscription = d.Paid_Subscription === 'TRUE' || d.Paid_Subscription === true;
            d.Traditional_Study_Hours = +d.Traditional_Study_Hours;
            d.Perceived_AI_Dependency = +d.Perceived_AI_Dependency;
            d.Anxiety_Level_During_Exams = +d.Anxiety_Level_During_Exams;
            d.Post_Semester_GPA = +d.Post_Semester_GPA;
            d.Skill_Retention_Score = +d.Skill_Retention_Score;
            d.GPA_Improvement = +d.GPA_Improvement;
          });
          setData(raw);
          populateFilters();
          window.__refreshAll();
          navigateTo('charts');
          console.log(`✅ Data loaded (fallback) (${raw.length} rows)`);
        })
        .catch(err2 => {
          console.error('Fallback load also failed:', err2);
          document.getElementById('recordCount').textContent = '❌ Dataset not found. Please check the CSV file path.';
        });
    });
}

attachUIListeners();
loadData();
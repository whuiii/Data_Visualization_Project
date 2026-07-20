import { state, setData, getFiltered, getMajors, getYears, getPolicies, getMonths } from './state.js';
import { renderKPIs } from './charts/kpi.js';
import { renderTrend } from './charts/trend.js';
import { renderMajorBar } from './charts/majorBar.js';
import { renderDonut } from './charts/donut.js';
import { renderScatter } from './charts/scatter.js';
import { renderDrilldown } from './charts/drilldown.js';
import { renderHeatmap } from './charts/heatmap.js';
import { renderParallel } from './charts/parallel.js';
import { renderInsights, renderSearchHit } from './charts/insights.js';
import { renderTimeline } from './charts/timeline.js';

// ---- Debounce helper ----
function debounce(fn, delay = 150) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// ---- Refresh callback (debounced) ----
const refreshAll = function () {
  const data = getFiltered();
  const countEl = document.getElementById('recordCount');
  if (countEl) countEl.textContent = data.length.toLocaleString();

  // Use requestAnimationFrame to batch DOM updates
  requestAnimationFrame(() => {
    renderKPIs(data);
    renderTrend(data);
    renderMajorBar(data);
    renderDonut(data);
    renderScatter(data);
    renderDrilldown(data);
    renderHeatmap(data);
    renderParallel(data);
    renderInsights(data);
    renderSearchHit(data);
    renderTimeline();
  });
};

// Expose debounced version globally
window.__refreshAll = debounce(refreshAll, 150);

// ---- Apply Persona ----
function applyPersona(persona) {
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

  // Debounced refresh after persona change
  window.__refreshAll();
}

// ---- Page navigation ----
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.navitem').forEach(el => el.classList.remove('active'));
  document.querySelector(`.navitem[data-page="${page}"]`).classList.add('active');
  // Re-render visible page content (debounced)
  window.__refreshAll();
}

// ---- Attach UI listeners ----
function attachUIListeners() {
  // Persona cards
  d3.selectAll('.persona-card').on('click', function () {
    const persona = this.dataset.persona;
    applyPersona(persona);
  });

  // Theme toggles
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

  // Font slider – only update CSS variable, no full re-render needed
  const slider = document.getElementById('fontSlider');
  const label = document.getElementById('fontSizeLabel');
  slider.addEventListener('input', function () {
    const val = parseFloat(this.value);
    label.textContent = Math.round(val * 100) + '%';
    document.documentElement.style.setProperty('--font-scale', val);
  });

  // Sidebar navigation
  d3.selectAll('.navitem').on('click', function () {
    const page = this.dataset.page;
    navigateTo(page);
  });

  // Reset button
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

    d3.select('#f-major').property('value', 'all');
    d3.select('#f-year').property('value', 'all');
    d3.select('#f-policy').property('value', 'all');
    d3.select('#f-month').property('value', 'all');
    d3.select('#f-search').property('value', '');
    d3.select('#f-hours').property('value', 0);
    d3.select('#rangeLbl').text('0h+');
    window.__refreshAll();
  });

  // Filters – all use debounced refresh
  d3.select('#f-major').on('change', function () { state.major = this.value; window.__refreshAll(); });
  d3.select('#f-year').on('change', function () { state.year = this.value; window.__refreshAll(); });
  d3.select('#f-policy').on('change', function () { state.policy = this.value; window.__refreshAll(); });
  d3.select('#f-month').on('change', function () { state.month = this.value; window.__refreshAll(); });

  // Slider – use 'change' event (only fires when user releases) + update label on input but not refresh
  const hoursSlider = document.getElementById('f-hours');
  const rangeLabel = document.getElementById('rangeLbl');
  hoursSlider.addEventListener('input', function () {
    rangeLabel.textContent = this.value + 'h+';
    // update state immediately but defer refresh
    state.minHours = +this.value;
    // refresh will be triggered on 'change' below
  });
  hoursSlider.addEventListener('change', function () {
    // only refresh when user stops sliding
    window.__refreshAll();
  });

  // Search – debounced on input
  const searchInput = document.getElementById('f-search');
  searchInput.addEventListener('input', function () {
    state.search = this.value.trim();
    window.__refreshAll();
  });

  // Drill back
  d3.select('#drillBack').on('click', () => {
    state.drillYear = null;
    window.__refreshAll();
  });

  // Window resize – debounced
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      window.__refreshAll();
    }, 200);
  });
}

// ---- Load data ----
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
    });
}

// ---- Populate filters ----
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

// ---- Init ----
attachUIListeners();
loadData();
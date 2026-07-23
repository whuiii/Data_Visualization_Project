// js/script.js
import { state, setData, getFiltered, getFilteredSampled, getMajors, getYears, getPolicies, getMonths } from './state.js';
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
import { renderUsageLine } from './charts/usageLine.js';
import { renderStackedBar } from './charts/stackedBar.js';

// Executive charts
import { renderExecutiveTrend } from './charts/executiveTrend.js';
import { renderExecutiveBar } from './charts/executiveBar.js';
import { renderExecutiveTreemap } from './charts/executiveTreemap.js';

function debounce(fn, delay = 150) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => { fn.apply(this, args); }, delay);
  };
}

let renderPending = false;

function clearCharts() {
  const selectors = [
    '#chartDonut', '#chartScatter', '#chartRadar', '#chartPaidPie',
    '#chartUsageBarDual', '#chartHeatmapLecturer', '#chartScatterMatrix',
    '#chartHistogram', '#chartUsageLine', '#chartStackedBar',
    '#chartExecutiveTrend', '#chartExecutiveBar', '#chartExecutiveTreemap',
    '#chartDrilldown', '#chartHeatmap', '#chartParallel', '#chartTrend',
    '#chartTimeline'
  ];
  selectors.forEach(sel => d3.select(sel).selectAll('*').remove());
}

const refreshAll = function () {
  const fullData = getFiltered();
  const sampledData = getFilteredSampled();

  const countEl = document.getElementById('recordCount');
  if (countEl) countEl.textContent = fullData.length.toLocaleString();

  if (renderPending) return;
  renderPending = true;

  clearCharts();

  renderKPIs(fullData);
  renderInsights(fullData);
  renderSearchHit(fullData);
  renderTimeline(fullData);

  
  renderHeatmap('#chartHeatmap', fullData);
  renderParallel(fullData, sampledData);
  renderScatterMatrix(fullData, sampledData);

  

  const persona = state.persona;
  const studentView = document.getElementById('studentView');
  const lecturerView = document.getElementById('lecturerView');
  const executiveView = document.getElementById('executiveView');

  if (studentView) studentView.style.display = 'none';
  if (lecturerView) lecturerView.style.display = 'none';
  if (executiveView) executiveView.style.display = 'none';

  if (persona === 'student') {
    if (studentView) studentView.style.display = 'block';
  } else if (persona === 'lecturer') {
    if (lecturerView) lecturerView.style.display = 'block';
  } else if (persona === 'executive') {
    if (executiveView) executiveView.style.display = 'block';
  }

  requestAnimationFrame(() => {
    if (persona === 'student') {
      renderDonut(fullData);
      renderUsageBarDual(fullData);
      renderRadar(fullData);
      renderScatter(fullData, sampledData);
      renderPaidPie(fullData);
    } else if (persona === 'lecturer') {
      renderDrilldown(fullData);
      renderTrend(fullData);
      renderStackedBar(fullData);
      renderHistogram(fullData);
      renderUsageLine(fullData);
    } else if (persona === 'executive') {
      renderExecutiveTrend(fullData);
      renderExecutiveBar(fullData);
      renderExecutiveTreemap(fullData);
    }
    renderPending = false;
  });
};

window.__refreshAll = debounce(refreshAll, 150);

window.__setPaidFilter = (isPaid) => {
  state.paidFilter = isPaid;
  window.__refreshAll();
};

function applyPersona(persona) {
  state.persona = persona;
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
  if (searchWrap) searchWrap.style.display = (persona === 'executive') ? 'none' : 'flex';

  setTimeout(() => window.__refreshAll(), 50);
}

function navigateTo(page) {
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');
  document.querySelectorAll('.navitem').forEach(el => el.classList.remove('active'));
  const navItem = document.querySelector(`.navitem[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');
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

  // ---- Font slider - triggers refresh ----
  const slider = document.getElementById('fontSlider');
  const label = document.getElementById('fontSizeLabel');
  if (slider && label) {
    slider.addEventListener('input', function () {
      const val = parseFloat(this.value);
      label.textContent = Math.round(val * 100) + '%';
      document.documentElement.style.setProperty('--font-scale', val);
      window.__refreshAll();
    });
  }

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
  if (hoursSlider && rangeLabel) {
    hoursSlider.addEventListener('input', function () {
      rangeLabel.textContent = this.value + 'h+';
      state.minHours = +this.value;
    });
    hoursSlider.addEventListener('change', function () { window.__refreshAll(); });
  }

  const searchInput = document.getElementById('f-search');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      state.search = this.value.trim();
      window.__refreshAll();
    });
  }

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
  const url = '/data/ai_student_impact.csv';
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

// ============================================================
// Font scale persistence across persona/tab changes
// ============================================================
(function initFontSize() {
  const slider = document.getElementById('fontSlider');
  const label = document.getElementById('fontSizeLabel');
  if (!slider) return;

  function applyFontSize(value) {
    const val = parseFloat(value);
    document.documentElement.style.setProperty('--font-scale', val);
    if (label) label.textContent = Math.round(val * 100) + '%';
    window.__refreshAll();
  }

  // Set initial
  applyFontSize(slider.value);

  // Slider changes
  slider.addEventListener('input', function() {
    applyFontSize(this.value);
  });

  // Reset button
  const resetBtn = document.getElementById('fontResetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      slider.value = '1.0';
      applyFontSize('1.0');
    });
  }

  // Re-apply after persona change
  document.querySelectorAll('.persona-card').forEach(card => {
    card.addEventListener('click', function() {
      setTimeout(() => applyFontSize(slider.value), 100);
    });
  });

  // Re-apply after tab navigation
  document.querySelectorAll('.navitem').forEach(item => {
    item.addEventListener('click', function() {
      setTimeout(() => applyFontSize(slider.value), 100);
    });
  });
})();
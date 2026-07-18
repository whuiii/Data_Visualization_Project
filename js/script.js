// ============================================================
// script.js – all sections on one page, persona adaptation
// Dataset loaded exclusively from public/data/ai_student_impact.csv
// Timeline now renders correctly
// ============================================================

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

// ---- Refresh callback ----
window.__refreshAll = function () {
  const data = getFiltered();
  const countEl = document.getElementById('recordCount');
  if (countEl) countEl.textContent = data.length.toLocaleString();
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
  // Always render timeline (it will draw if container is visible)
  renderTimeline();
};

// ---- Apply Persona (light theme for all, different modes) ----
function applyPersona(persona) {
  d3.selectAll('.persona-card').classed('active', false);
  d3.select(`.persona-card[data-persona="${persona}"]`).classed('active', true);

  const body = d3.select('body');
  body.classed('mode-standard', false);
  body.classed('mode-accessible', false);
  body.classed('mode-simple', false);

  let modeClass = 'mode-standard';
  if (persona === 'student') {
    modeClass = 'mode-standard';
  } else if (persona === 'lecturer') {
    modeClass = 'mode-accessible';
  } else if (persona === 'executive') {
    modeClass = 'mode-simple';
  }

  let currentTheme = 'theme-light';
  const themeMatch = body.attr('class').match(/theme-\S+/);
  if (themeMatch) currentTheme = themeMatch[0];

  body.attr('class', currentTheme + ' ' + modeClass);

  // Sync the mode toggle is now removed, so we don't need to update it.
  setTimeout(window.__refreshAll, 50);
}

// ---- Attach UI listeners ----
function attachUIListeners() {
  // 1. Persona cards
  d3.selectAll('.persona-card').on('click', function () {
    const persona = this.dataset.persona;
    applyPersona(persona);
  });

  // 2. Theme toggles (hero)
  d3.selectAll('.hero-theme-toggles button').on('click', function () {
    const theme = this.dataset.theme;
    d3.selectAll('.hero-theme-toggles button').classed('active', false);
    d3.select(this).classed('active', true);

    const body = d3.select('body');
    let mode = 'mode-standard';
    const modeMatch = body.attr('class').match(/mode-\S+/);
    if (modeMatch) mode = modeMatch[0];

    body.attr('class', 'theme-' + theme + ' ' + mode);
    setTimeout(window.__refreshAll, 30);
  });

  // 3. Font size slider
  const slider = document.getElementById('fontSlider');
  const label = document.getElementById('fontSizeLabel');
  slider.addEventListener('input', function () {
    const val = parseFloat(this.value);
    label.textContent = Math.round(val * 100) + '%';
    document.documentElement.style.setProperty('--font-scale', val);
    // Also update the body's font-size via a class? The body uses calc(14px * var(--font-scale))
    // which will automatically update.
  });

  // 4. Sidebar navigation – scroll to section
  d3.selectAll('.navitem').on('click', function () {
    const sectionId = this.dataset.section;
    d3.selectAll('.navitem').classed('active', false);
    d3.select(this).classed('active', true);
    const target = document.getElementById('section-' + sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // If target is timeline, render timeline (already rendered on refresh, but can force)
      if (sectionId === 'timeline') {
        renderTimeline();
      }
    }
  });

  // 5. Reset button - NOW CLEARS ALL CHART INTERACTIONS
  d3.select('#resetBtn').on('click', () => {
    // Reset all filter states
    state.major = 'all';
    state.year = 'all';
    state.policy = 'all';
    state.month = 'all';
    state.search = '';
    state.minHours = 0;
    
    // Reset all chart interaction states
    state.brushMajor = null;
    state.brushUseCase = null;
    state.scatterBrush = null;
    state.parallelBrush = null;
    state.drillYear = null;

    // Reset UI dropdowns, search, range
    d3.select('#f-major').property('value', 'all');
    d3.select('#f-year').property('value', 'all');
    d3.select('#f-policy').property('value', 'all');
    d3.select('#f-month').property('value', 'all');
    d3.select('#f-search').property('value', '');
    d3.select('#f-hours').property('value', 0);
    d3.select('#rangeLbl').text('0h+');
    
    // Re-render everything
    window.__refreshAll();
  });

  // 6. Filter inputs
  d3.select('#f-major').on('change', function () { state.major = this.value; window.__refreshAll(); });
  d3.select('#f-year').on('change', function () { state.year = this.value; window.__refreshAll(); });
  d3.select('#f-policy').on('change', function () { state.policy = this.value; window.__refreshAll(); });
  d3.select('#f-month').on('change', function () { state.month = this.value; window.__refreshAll(); });
  d3.select('#f-hours').on('input', function () {
    state.minHours = +this.value;
    d3.select('#rangeLbl').text(this.value + 'h+');
    window.__refreshAll();
  });
  d3.select('#f-search').on('input', function () {
    state.search = this.value.trim();
    window.__refreshAll();
  });

  // 7. Drill-down back button
  d3.select('#drillBack').on('click', () => {
    state.drillYear = null;
    window.__refreshAll();
  });

  // 8. Window resize
  window.addEventListener('resize', () => {
    window.__refreshAll();
    // Timeline re-render on resize is already inside refreshAll
  });
}

// ---- Load dataset from public/data/ai_student_impact.csv only ----
function loadData() {
  const url = 'public/data/ai_student_impact.csv';

  d3.csv(url)
    .then(raw => {
      if (!raw || raw.length === 0) {
        throw new Error('File is empty or could not be parsed.');
      }
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
      console.log(`✅ Data loaded from: ${url} (${raw.length} rows)`);
    })
    .catch(err => {
      console.error('Error loading dataset:', err);
      document.getElementById('recordCount').textContent = '❌ Dataset not found.';
      const errorDiv = document.createElement('div');
      errorDiv.style.padding = '20px';
      errorDiv.style.color = 'var(--red)';
      errorDiv.style.textAlign = 'center';
      errorDiv.innerHTML = `
        <h3>⚠️ Dataset "public/data/ai_student_impact.csv" not found</h3>
        <p>Please ensure the file exists at <strong>public/data/ai_student_impact.csv</strong>.</p>
        <p style="font-size:0.9rem; opacity:0.7;">Error: ${err.message}</p>
      `;
      document.querySelector('.content').prepend(errorDiv);
    });
}

// ---- Populate filter dropdowns ----
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

// ---- Initialize ----
attachUIListeners();
loadData();
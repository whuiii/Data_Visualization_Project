// js/state.js
import { MONTH_ORDER, YEAR_ORDER } from './utils/constants.js';

export const state = {
  major: 'all',
  year: 'all',
  policy: 'all',
  month: 'all',
  search: '',
  minHours: 0,
  brushMajor: null,
  brushUseCase: null,
  scatterBrush: null,
  parallelBrush: null,
  drillYear: null,
  paidFilter: null,
  persona: 'student',
};

// Sampling size for point-heavy charts
export const RENDER_SAMPLE_SIZE = 5000;

let RAW_DATA = [];
export function setData(data) { RAW_DATA = data; }
export function getRawData() { return RAW_DATA; }

// Deterministic sampling: every nth element
export function sampleData(data, maxSize) {
  if (data.length <= maxSize) return data;
  const step = Math.ceil(data.length / maxSize);
  return data.filter((_, i) => i % step === 0);
}

export function getFiltered() {
  return RAW_DATA.filter(d => {
    if (state.major !== 'all' && d.Major_Category !== state.major) return false;
    if (state.year !== 'all' && d.Year_of_Study !== state.year) return false;
    if (state.policy !== 'all' && d.Institutional_Policy !== state.policy) return false;
    if (state.month !== 'all' && d.Month !== state.month) return false;
    if (d.Weekly_GenAI_Hours < state.minHours) return false;
    if (state.brushMajor && d.Major_Category !== state.brushMajor) return false;
    if (state.brushUseCase && d.AI_Usage_Level !== state.brushUseCase) return false;
    if (state.scatterBrush) {
      const [[x0, y0], [x1, y1]] = state.scatterBrush;
      if (d.Weekly_GenAI_Hours < x0 || d.Weekly_GenAI_Hours > x1 || d.Post_Semester_GPA < y0 || d.Post_Semester_GPA > y1) return false;
    }
    if (state.parallelBrush) {
      for (const dim in state.parallelBrush) {
        const [lo, hi] = state.parallelBrush[dim];
        if (d[dim] < lo || d[dim] > hi) return false;
      }
    }
    if (state.paidFilter !== null && d.Paid_Subscription !== state.paidFilter) return false;
    return true;
  });
}

export function getFilteredSampled() {
  const filtered = getFiltered();
  return sampleData(filtered, RENDER_SAMPLE_SIZE);
}

export function getMajors() {
  return Array.from(new Set(RAW_DATA.map(d => d.Major_Category))).sort();
}
export function getYears() {
  return YEAR_ORDER.filter(y => RAW_DATA.some(d => d.Year_of_Study === y));
}
export function getPolicies() {
  return Array.from(new Set(RAW_DATA.map(d => d.Institutional_Policy))).sort();
}
export function getMonths() {
  return MONTH_ORDER.filter(m => RAW_DATA.some(d => d.Month === m));
}
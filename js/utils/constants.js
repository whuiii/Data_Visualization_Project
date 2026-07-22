export const MONTH_ORDER = ['February', 'March', 'April', 'May', 'June'];
export const YEAR_ORDER = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];
export const CHART_QUALITATIVE = ['#1565C0', '#2E7D32', '#00796B', '#F9A825', '#7B1FA2'];

// Dates/descriptions below come from the updated timeline build (matches the
// Feb-Jun 2026 dataset window). Same shape as before (label/start/end/desc)
// so anything else importing MILESTONES keeps working unchanged.
export const MILESTONES = [
  { key: 'init',   label: 'Project Initiation',        start: '2026-02-01', end: '2026-02-12', desc: 'Formed the team, selected the Education/AI-impact domain, and scoped stakeholder requirements and dashboard objectives.' },
  { key: 'collect',label: 'Data Collection',            start: '2026-02-09', end: '2026-03-06', desc: 'Assembled the Feb–Jun 2026 student dataset (50,000 records) covering GPA, AI usage, burnout, and policy variables.' },
  { key: 'clean',  label: 'Data Cleaning',              start: '2026-03-02', end: '2026-03-23', desc: 'Validated types, checked for missing/outlier values, and derived GPA change and burnout scores used throughout the dashboard.' },
  { key: 'dev',    label: 'Dashboard Development',      start: '2026-03-18', end: '2026-05-08', desc: 'Built the D3.js dashboard: KPI cards, this timeline, linked trend charts, heat map, and parallel-coordinates view.' },
  { key: 'test',   label: 'Testing and Validation',     start: '2026-05-04', end: '2026-06-05', desc: 'Cross-checked chart aggregates against the raw dataset, tested every interaction, and verified responsive/mobile layout.' },
  { key: 'deploy', label: 'Deployment / Presentation',  start: '2026-06-03', end: '2026-06-19', desc: 'Packaged the dashboard, source files, and dataset for submission and prepared the in-class demonstration.' },
];
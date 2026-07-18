import { themeColors, paleFor, iconSvg, tweenKpiValue, fmt2 } from '../utils/helpers.js';

export function renderKPIs(data) {
  const C = themeColors();
  const has = data.length > 0;
  const avg = k => has ? d3.mean(data, d => d[k]) : 0;
  const gpaCh = avg('GPA_Improvement');
  const gpaPositive = gpaCh >= 0;

  const kpis = [
    { lbl: 'Avg Post-Sem GPA', icon: 'target', accent: C.blue, raw: has ? avg('Post_Semester_GPA') : null, fmt: v => fmt2(v), sub: 'scale 0–4.0' },
    { lbl: 'Avg GPA Change', icon: gpaPositive ? 'trendUp' : 'trendDown', accent: gpaPositive ? C.mint : C.red, raw: has ? gpaCh : null, fmt: v => (v >= 0 ? '+' : '') + fmt2(v), sub: 'pre → post' },
    { lbl: 'Avg AI Hrs / Week', icon: 'clock', accent: C.violet, raw: has ? avg('Weekly_GenAI_Hours') : null, fmt: v => fmt2(v), sub: 'hours' },
    { lbl: 'Paid Subscription', icon: 'card', accent: C.teal, raw: has ? d3.mean(data, d => d.Paid_Subscription ? 1 : 0) : null, fmt: v => d3.format('.0%')(v), sub: 'of cohort' },
    { lbl: 'Avg Skill Retention', icon: 'check', accent: C.blue, raw: has ? avg('Skill_Retention_Score') : null, fmt: v => Math.round(v).toString(), sub: 'index / 100' },
    { lbl: 'High Burnout Risk', icon: 'alert', accent: C.red, raw: has ? d3.mean(data, d => d.Burnout_Risk_Level === 'High' ? 1 : 0) : null, fmt: v => d3.format('.0%')(v), sub: 'of cohort' },
  ];

  const sel = d3.select('#kpiRow').selectAll('.kpi').data(kpis, d => d.lbl);
  const ent = sel.enter().append('div').attr('class', 'kpi');
  ent.append('div').attr('class', 'chip');
  ent.append('div').attr('class', 'lbl');
  ent.append('div').attr('class', 'val');
  ent.append('div').attr('class', 'sub');
  const all = ent.merge(sel);
  all.style('--kpi-accent', d => d.accent).style('--kpi-pale', d => paleFor(d.accent));
  all.select('.chip').html(d => iconSvg(d.icon));
  all.select('.lbl').text(d => d.lbl);
  all.select('.sub').text(d => d.sub);
  all.select('.val').each(function (d) { tweenKpiValue(d3.select(this), d.lbl, d.raw, d.fmt); });
}
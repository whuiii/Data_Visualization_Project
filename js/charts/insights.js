import { themeColors, iconSvg, fmt2, pearson } from '../utils/helpers.js';
import { state, getRawData } from '../state.js';

export function renderSearchHit(data) {
  const RAW_DATA = getRawData();
  const box = d3.select('#searchHit');
  if (!state.search) { box.classed('show', false); return; }
  const hit = RAW_DATA.find(d => String(d.Student_ID) === state.search);
  if (!hit) { box.classed('show', true).html(`No student found matching "<b>${state.search}</b>". Try an ID between 100001 and 150000 (only ${RAW_DATA.length.toLocaleString()} sampled here).`); return; }
  box.classed('show', true).html(`
    <div><b style="color:var(--accent)">${hit.Student_ID}</b> spotlighted on the scatter chart (outlined) — jump to Overview to see it</div>
    <div class="grid">
      <div>Major: <b>${hit.Major_Category}</b></div><div>Year: <b>${hit.Year_of_Study}</b></div>
      <div>Pre → Post GPA: <b>${hit.Pre_Semester_GPA} → ${hit.Post_Semester_GPA}</b></div><div>AI hrs/wk: <b>${hit.Weekly_GenAI_Hours}</b></div>
      <div>Use case: <b>${hit.Primary_Use_Case.replace(/_/g, ' ')}</b></div><div>Burnout risk: <b>${hit.Burnout_Risk_Level}</b></div>
    </div>`);
}

export function renderInsights(data) {
  const wrap = d3.select('#insightsWrap');
  wrap.selectAll('*').remove();
  if (data.length < 5) {
    const card = wrap.append('div').attr('class', 'insight-card neutral');
    card.append('div').attr('class', 'ic').html(iconSvg('info'));
    card.append('div').attr('class', 'body').html('<h4>Not enough data</h4><p>Loosen your filters to generate insights.</p>');
    return;
  }

  const bins = [[0, 5], [5, 10], [10, 15], [15, 20], [20, 40]];
  const binStats = bins.map(([lo, hi]) => {
    const sub = data.filter(d => d.Weekly_GenAI_Hours >= lo && d.Weekly_GenAI_Hours < hi);
    return { lo, hi, n: sub.length, avg: sub.length ? d3.mean(sub, d => d.GPA_Improvement) : null };
  }).filter(b => b.n >= 8);
  const best = binStats.slice().sort((a, b) => d3.descending(a.avg, b.avg))[0];
  const worst = binStats.slice().sort((a, b) => d3.ascending(a.avg, b.avg))[0];

  const median = d3.median(data, d => d.Weekly_GenAI_Hours);
  const hi = data.filter(d => d.Weekly_GenAI_Hours >= median), lo = data.filter(d => d.Weekly_GenAI_Hours < median);
  const hiGpa = d3.mean(hi, d => d.GPA_Improvement), loGpa = d3.mean(lo, d => d.GPA_Improvement);
  const hiSkill = d3.mean(hi, d => d.Skill_Retention_Score), loSkill = d3.mean(lo, d => d.Skill_Retention_Score);
  const hiBurnout = d3.mean(hi, d => d.Burnout_Risk_Level === 'High' ? 1 : 0), loBurnout = d3.mean(lo, d => d.Burnout_Risk_Level === 'High' ? 1 : 0);
  const corrDepRetention = pearson(data, 'Perceived_AI_Dependency', 'Skill_Retention_Score');
  const corrHoursAnxiety = pearson(data, 'Weekly_GenAI_Hours', 'Anxiety_Level_During_Exams');
  const topMajor = d3.rollups(data, v => d3.mean(v, d => d.GPA_Improvement), d => d.Major_Category).sort((a, b) => d3.descending(a[1], b[1]))[0];
  const policyAgg = d3.rollups(data, v => d3.mean(v, d => d.GPA_Improvement), d => d.Institutional_Policy).sort((a, b) => d3.descending(a[1], b[1]));

  const findings = [
    { cls: 'good', icon: 'check', title: 'Sweet spot for AI usage', body: best ? `Students using GenAI tools <b class="num">${best.lo}–${best.hi} hrs/week</b> show the strongest average GPA gain (<b class="num">${d3.format('+.2f')(best.avg)}</b>)${worst ? `, while <b class="num">${worst.lo}–${worst.hi} hrs/week</b> users average <b class="num">${d3.format('+.2f')(worst.avg)}</b>` : ''}. This supports a moderate, purposeful-use policy over an outright ban or unlimited access.` : 'Not enough spread in the current filter to isolate a sweet spot.' },
    { cls: 'neutral', icon: 'info', title: 'High vs. low AI users', body: `Splitting at the median (${fmt2(median)} hrs/week): high-usage students average <b class="num">${d3.format('+.2f')(hiGpa)}</b> GPA change vs. <b class="num">${d3.format('+.2f')(loGpa)}</b> for low-usage students — but skill-retention runs <b class="num">${Math.round(hiSkill)}</b> vs. <b class="num">${Math.round(loSkill)}</b>. Heavier AI users trend toward weaker independent skill retention even when grades hold up.` },
    { cls: corrDepRetention < -0.1 ? 'risk' : 'neutral', icon: corrDepRetention < -0.1 ? 'alert' : 'info', title: 'AI dependency and skill retention', body: `Perceived AI dependency correlates with skill-retention score at <b class="num">r = ${corrDepRetention.toFixed(2)}</b> in the current filter. ${corrDepRetention < -0.05 ? 'The negative relationship suggests dependency-heavy usage patterns deserve advising attention, even where grades look fine.' : 'The relationship is weak here — worth re-checking on the full, unfiltered dataset.'}` },
    { cls: hiBurnout > loBurnout ? 'risk' : 'neutral', icon: hiBurnout > loBurnout ? 'alert' : 'info', title: 'Burnout risk and usage', body: `High-usage students show <b class="num">${d3.format('.0%')(hiBurnout)}</b> high-burnout-risk rate vs. <b class="num">${d3.format('.0%')(loBurnout)}</b> for low-usage students. Weekly hours vs. exam anxiety correlation: <b class="num">r = ${corrHoursAnxiety.toFixed(2)}</b>.` },
    { cls: 'good', icon: 'check', title: 'Best-performing segment', body: topMajor ? `<b>${topMajor[0]}</b> shows the strongest average GPA change in the current view (<b class="num">${d3.format('+.2f')(topMajor[1])}</b>) — see Fig. 6 for which use cases drive it.` : '' },
    { cls: 'neutral', icon: 'info', title: 'Institutional policy and outcomes', body: policyAgg.length ? `Ranked by average GPA change: ${policyAgg.map(p => `<b>${p[0].replace(/_/g, ' ')}</b> (<span class="num">${d3.format('+.2f')(p[1])}</span>)`).join(' · ')}. Read this as descriptive, not causal — cohorts under different policies may differ in other ways too.` : '' },
  ];

  const recommendations = [
    { title: 'Set guided-use guidance, not a ban', body: best ? `Nudge students toward the empirically strongest band (<b class="num">${best.lo}–${best.hi} hrs/week</b>) through onboarding and advisor conversations, rather than an outright ban or unlimited access — both extremes underperform it in this cohort.` : 'Once usage data is available for this filter, anchor guidance to the strongest-performing hours band.' },
    { title: 'Flag the high-dependency, low-retention cluster', body: 'Cross-reference Fig. 7 (parallel coordinates): students combining high AI-dependency with low skill-retention are the group most likely to need proactive academic advising, even before it shows up in their GPA.' },
    { title: 'Review policy against outcomes each term', body: policyAgg.length ? `Track GPA change by institutional policy (currently led by <b>${policyAgg[0][0].replace(/_/g, ' ')}</b>) alongside the monthly anxiety trend in Fig. 1 — a rising anxiety line without matching GPA gains is the signal to revisit the policy.` : 'Track GPA change by institutional policy alongside the monthly anxiety trend to know when a policy review is due.' },
  ];

  wrap.append('div').attr('class', 'insight-section-label').html(`${iconSvg('info')} Findings`);
  findings.forEach(c => {
    const card = wrap.append('div').attr('class', 'insight-card ' + c.cls);
    card.append('div').attr('class', 'ic').html(iconSvg(c.icon));
    const body = card.append('div').attr('class', 'body');
    body.append('h4').text(c.title);
    body.append('p').html(c.body);
  });

  wrap.append('div').attr('class', 'insight-section-label').html(`${iconSvg('lightbulb')} Recommendations`);
  recommendations.forEach(c => {
    const card = wrap.append('div').attr('class', 'insight-card reco');
    card.append('div').attr('class', 'ic').html(iconSvg('lightbulb'));
    const body = card.append('div').attr('class', 'body');
    body.append('h4').text(c.title);
    body.append('p').html(c.body);
  });
}
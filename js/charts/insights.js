import { themeColors, iconSvg } from '../utils/helpers.js';
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

  // Show message if no data
  if (!data || data.length < 5) {
    const card = wrap.append('div').attr('class', 'insight-card neutral');
    card.append('div').attr('class', 'ic').html(iconSvg('info'));
    card.append('div').attr('class', 'body').html('<h4>Not enough data</h4><p>Loosen your filters to generate insights.</p>');
    return;
  }

  // ─── Your 6 Updated Insights ──────────────────────────────────────
  const insights = [
    {
      cls: 'good',
      icon: 'check',
      title: 'Insight 1: The Optimal AI Usage Threshold',
      body: `
        <strong>Question:</strong> What level of weekly GenAI usage produces the greatest academic improvement?<br><br>
        <strong>Analysis:</strong> Students using GenAI for 5–10 hours per week achieve the highest average GPA improvement (<b class="num">+0.23</b>). Performance declines when usage exceeds 20 hours per week, with gains falling to <b class="num">+0.16</b>.<br><br>
        <strong>Insight:</strong> Moderate AI usage enhances learning, while excessive reliance reduces academic benefits, suggesting diminishing returns.<br><br>
        <strong>Recommendation:</strong> Encourage students to use GenAI as a learning aid within the 5–10 hour/week range rather than as a replacement for independent study.
      `
    },
    {
      cls: 'good',
      icon: 'check',
      title: 'Insight 2: Purpose of AI Matters More Than Usage',
      body: `
        <strong>Question:</strong> Does the way students use AI influence academic outcomes?<br><br>
        <strong>Analysis:</strong> STEM students record the highest GPA improvement (<b class="num">+0.20</b>). Students using AI for debugging and problem-solving gain up to <b class="num">+0.25 GPA</b>, whereas direct answer generation results in only <b class="num">+0.13</b>.<br><br>
        <strong>Insight:</strong> Academic benefits depend more on how AI is used than how often it is used. Active learning tasks produce stronger outcomes than passive answer generation.<br><br>
        <strong>Recommendation:</strong> Develop faculty-specific AI guidance that promotes problem-solving, critical thinking, and ethical AI practices.
      `
    },
    {
      cls: 'good',
      icon: 'check',
      title: 'Insight 3: Guided AI Policies Outperform Strict Bans',
      body: `
        <strong>Question:</strong> Which institutional AI policy leads to better academic performance?<br><br>
        <strong>Analysis:</strong> Faculties adopting "Allowed with Citation" and "Actively Encouraged" policies achieve the highest GPA gains (<b class="num">+0.21</b>), while Strict Ban policies show the lowest improvement (<b class="num">+0.19</b>).<br><br>
        <strong>Insight:</strong> Structured AI governance delivers better learning outcomes than restrictive policies.<br><br>
        <strong>Recommendation:</strong> Replace blanket bans with clear institutional guidelines that define appropriate AI use and citation requirements.
      `
    },
    {
      cls: 'risk',
      icon: 'alert',
      title: 'Insight 4: Heavy AI Usage Increases Burnout Risk',
      body: `
        <strong>Question:</strong> How does extensive AI usage affect student well-being?<br><br>
        <strong>Analysis:</strong> Burnout risk increases significantly beyond 15–20 AI hours per week. High AI usage is associated with greater anxiety, reduced study time, and limited additional GPA improvement. Around <b class="num">25%</b> of students are classified as high burnout risk.<br><br>
        <strong>Insight:</strong> Excessive AI reliance negatively affects student well-being without providing meaningful academic gains.<br><br>
        <strong>Recommendation:</strong> Monitor high AI usage and provide early academic support, while promoting healthy AI usage within recommended limits.
      `
    },
    {
      cls: 'neutral',
      icon: 'info',
      title: 'Insight 5: AI Adoption Differs Across Disciplines',
      body: `
        <strong>Question:</strong> Why do AI adoption rates vary across faculties?<br><br>
        <strong>Analysis:</strong> STEM students report the highest average AI usage (<b class="num">10.4 hours/week</b>), followed by Business (<b class="num">8.3 hours/week</b>). Humanities, Arts, and Medical students consistently record lower usage levels.<br><br>
        <strong>Insight:</strong> AI adoption reflects the suitability of AI for discipline-specific tasks rather than differences in student interest.<br><br>
        <strong>Recommendation:</strong> Develop discipline-specific AI training that aligns with each faculty's learning activities and assessment methods.
      `
    },
    {
      cls: 'neutral',
      icon: 'info',
      title: 'Insight 6: Early-Year Students Depend More on AI',
      body: `
        <strong>Question:</strong> How does AI usage differ across academic levels?<br><br>
        <strong>Analysis:</strong> Freshmen and sophomore students demonstrate the highest AI usage, while graduate students use AI more selectively. The average skill retention score across the cohort is <b class="num">76/100</b>.<br><br>
        <strong>Insight:</strong> Early-stage students rely on AI to support foundational learning, but excessive dependence may weaken long-term skill development.<br><br>
        <strong>Recommendation:</strong> Introduce AI literacy programmes in the first year that emphasise using AI as a learning assistant rather than a substitute for independent thinking.
      `
    }
  ];

  // ─── Render the 6 insight cards ──────────────────────────────────
  insights.forEach(insight => {
    const card = wrap.append('div')
      .attr('class', `insight-card ${insight.cls}`);

    card.append('div')
      .attr('class', 'ic')
      .html(iconSvg(insight.icon));

    const body = card.append('div')
      .attr('class', 'body');

    body.append('h4')
      .text(insight.title);

    body.append('p')
      .html(insight.body);
  });
}
// js/utils/helpers.js
import { CHART_QUALITATIVE } from './constants.js';

export function themeColors() {
  const cs = getComputedStyle(document.body);
  return {
    mint: '#2E7D32',
    gray: '#757575',
    amber: '#F9A825',
    red: '#C62828',
    blue: '#1565C0',
    violet: '#7B1FA2',
    teal: '#00796B',
    surface: cs.getPropertyValue('--surface').trim(),
    surface3: cs.getPropertyValue('--surface-3').trim(),
  };
}

export function burnoutScale(C) {
  return d3.scaleOrdinal().domain(['Low', 'Medium', 'High']).range([C.mint, C.gray, C.red]);
}

export function majorColorScale(majors) {
  return d3.scaleOrdinal(CHART_QUALITATIVE).domain(majors);
}

const tooltip = d3.select('#tooltip');
export function showTip(html, evt) {
  tooltip.html(html).style('opacity', 1).style('left', (evt.clientX + 16) + 'px').style('top', (evt.clientY - 10) + 'px');
}
export function hideTip() {
  tooltip.style('opacity', 0);
}

const ICONS = {
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.7" fill="currentColor" stroke="none"/>',
  trendUp: '<polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/>',
  trendDown: '<polyline points="3 7 9 13 13 9 21 17"/><polyline points="21 10 21 17 14 17"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2.5"/><line x1="2" y1="10" x2="22" y2="10"/>',
  alert: '<path d="M12 3 L22 20 L2 20 Z" stroke-linejoin="round"/><line x1="12" y1="9.5" x2="12" y2="14"/><circle cx="12" cy="17" r="0.7" fill="currentColor" stroke="none"/>',
  lightbulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.6 10.8c.6.5 1.1 1.3 1.1 2.2h5a2.7 2.7 0 011.1-2.2A6 6 0 0012 3z"/>',
  check: '<circle cx="12" cy="12" r="9"/><polyline points="7.5 12 10.5 15 16.5 8.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><circle cx="12" cy="7.6" r="0.7" fill="currentColor" stroke="none"/>',
};
export function iconSvg(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
}

export function paleFor(hex) {
  const map = {
    '#2E7D32': 'var(--green-pale)',
    '#C62828': 'var(--red-pale)',
    '#1565C0': 'var(--blue-pale)',
    '#7B1FA2': 'var(--purple-pale)',
    '#00796B': 'var(--teal-pale)',
    '#757575': 'var(--gray-pale)',
  };
  return map[hex] || 'var(--blue-pale)';
}

const kpiPrev = {};
export function tweenKpiValue(node, key, raw, formatter) {
  if (raw === null || raw === undefined) { node.text('—'); delete kpiPrev[key]; return; }
  const prev = kpiPrev[key] !== undefined ? kpiPrev[key] : raw;
  kpiPrev[key] = raw;
  const interp = d3.interpolateNumber(prev, raw);
  node.transition().duration(550).ease(d3.easeCubicOut).tween('text', function() {
    return function(t) { this.textContent = formatter(interp(t)); };
  });
}

export function fmt2(v) { return d3.format('.2f')(v); }

export function pearson(data, a, b) {
  const xs = data.map(d => d[a]), ys = data.map(d => d[b]);
  const mx = d3.mean(xs), my = d3.mean(ys);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  return num / Math.sqrt(dx * dy || 1);
}

// ---- NEW: get current font scale ----
export function getFontScale() {
  const root = document.documentElement;
  const scale = getComputedStyle(root).getPropertyValue('--font-scale').trim();
  return parseFloat(scale) || 1;
}
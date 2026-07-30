(() => {
  'use strict';

  const D = window.SURS_TOURISM_BENCHMARK;
  if (!D) return;

  const municipalities = D.metadata?.municipalities || ['Tržič', 'Radovljica', 'Bled', 'Preddvor', 'Jesenice', 'Idrija'];
  const comparators = municipalities.filter(m => m !== 'Tržič');
  const colors = {
    'Tržič': '#20a6a0',
    'Radovljica': '#5eb3e5',
    'Bled': '#e7a43c',
    'Preddvor': '#9b78d0',
    'Jesenice': '#e06c75',
    'Idrija': '#7fa55b'
  };
  const breakdownColors = {
    'Nastanitev': '#e7a43c',
    'Hrana in pijača': '#20a6a0',
    'Prevoz po Sloveniji': '#5eb3e5',
    'Drugi nakupi': '#9b78d0',
    'Kultura, šport in izleti': '#e06c75',
    'Drugo': '#8e7c86'
  };
  const fmt = new Intl.NumberFormat('sl-SI');
  const pct = (v, d = 1) => `${Number(v).toLocaleString('sl-SI', { minimumFractionDigits: d, maximumFractionDigits: d })} %`;
  const dec = (v, d = 1) => Number(v).toLocaleString('sl-SI', { minimumFractionDigits: d, maximumFractionDigits: d });
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const annual = (m, y, c = 'Država - SKUPAJ') => D.annual.find(x => x.municipality === m && x.year === y && x.category === c);
  const capacity = (m, y) => D.capacity.find(x => x.municipality === m && x.year === y);
  const monthly = (m, y = null) => D.monthly
    .filter(x => x.municipality === m && (y === null || x.period.startsWith(String(y))))
    .sort((a, b) => a.period.localeCompare(b.period));
  const spendEstimate = m => D.spendingModel.estimates.find(x => x.municipality === m);

  function compactEuro(value) {
    const v = Number(value || 0);
    if (Math.abs(v) >= 1_000_000) return `${dec(v / 1_000_000, 1)} mio €`;
    if (Math.abs(v) >= 1_000) return `${dec(v / 1_000, 0)} tisoč €`;
    return `${fmt.format(Math.round(v))} €`;
  }

  function median(values) {
    const a = values.filter(Number.isFinite).slice().sort((x, y) => x - y);
    if (!a.length) return null;
    const mid = Math.floor(a.length / 2);
    return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
  }

  function seasonStats(m) {
    const rows = monthly(m, 2025);
    const total = annual(m, 2025).nights;
    const knownRows = rows.filter(x => Number.isFinite(x.nights));
    const jja = knownRows.filter(x => ['06', '07', '08'].includes(x.period.slice(-2))).reduce((s, x) => s + x.nights, 0);
    const peak = knownRows.reduce((a, b) => a.nights > b.nights ? a : b);
    return { rows, total, jjaShare: total ? jja / total * 100 : 0, peak, protectedMonths: rows.length - knownRows.length };
  }

  function snapshot() {
    const el = document.getElementById('snapshotGrid');
    el.innerHTML = municipalities.map(m => {
      const a = annual(m, 2025);
      const f = annual(m, 2025, 'Tuji');
      const c = capacity(m, 2025);
      const stay = a.arrivals ? a.nights / a.arrivals : 0;
      const foreign = a.nights ? f.nights / a.nights * 100 : 0;
      const perBed = c.bedsPermanent ? a.nights / c.bedsPermanent : 0;
      return `<article class="municipality-card" style="--municipality-color:${colors[m]}">
        <h3>${esc(m)}</h3>
        <div class="metric-grid">
          <div class="metric"><span>Gostje</span><strong>${fmt.format(a.arrivals)}</strong></div>
          <div class="metric"><span>Nočitve</span><strong>${fmt.format(a.nights)}</strong></div>
          <div class="metric"><span>Povp. bivanje</span><strong>${dec(stay, 2)} dneva</strong></div>
          <div class="metric"><span>Tuji delež nočitev</span><strong>${pct(foreign)}</strong></div>
          <div class="metric"><span>Stalna ležišča</span><strong>${fmt.format(c.bedsPermanent)}</strong></div>
          <div class="metric"><span>Nočitve / ležišče</span><strong>${dec(perBed, 1)}</strong></div>
        </div>
      </article>`;
    }).join('');

    const trzicGrowth = (annual('Tržič', 2025).nights / annual('Tržič', 2019).nights - 1) * 100;
    const comparisonGrowth = comparators.map(m => (annual(m, 2025).nights / annual(m, 2019).nights - 1) * 100);
    const trzicSeason = seasonStats('Tržič').jjaShare;
    const comparisonSeason = median(comparators.map(m => seasonStats(m).jjaShare));
    const spend = spendEstimate('Tržič');
    document.getElementById('aiSummary').innerHTML = `<div><h3>Ključni povzetek</h3><p>Nočitve v Tržiču so bile leta 2025 za <strong>${pct(trzicGrowth)}</strong> nad letom 2019, mediana spremembe petih primerjalnih občin pa je znašala <strong>${pct(median(comparisonGrowth))}</strong>. V juniju–avgustu je Tržič ustvaril <strong>${pct(trzicSeason)}</strong> letnih nočitev, primerjalna mediana pa je <strong>${pct(comparisonSeason)}</strong>. Modelna potrošnja, povezana s tujimi nočitvami v Tržiču, znaša približno <strong>${compactEuro(spend.estimatedSpend)}</strong>, vendar to ni dejanski lokalni prihodek.</p></div>`;
  }

  function lineChart(container, series, years, indexed = false) {
    const w = 1000, h = 360, p = { l: 58, r: 24, t: 24, b: 55 };
    const vals = series.flatMap(s => s.values.filter(Number.isFinite));
    let min = Math.min(...vals), max = Math.max(...vals);
    if (indexed) {
      min = Math.min(50, min);
      max = Math.max(170, max);
    }
    const pad = (max - min) * 0.12 || 1;
    min -= pad;
    max += pad;
    const x = i => p.l + i * (w - p.l - p.r) / Math.max(1, years.length - 1);
    const y = v => p.t + (max - v) * (h - p.t - p.b) / Math.max(1, max - min);
    let svg = `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true">`;
    for (let i = 0; i <= 5; i++) {
      const v = min + (max - min) * i / 5, yy = y(v);
      svg += `<line class="chart-grid-line" x1="${p.l}" y1="${yy}" x2="${w - p.r}" y2="${yy}"/><text class="axis-label" x="${p.l - 9}" y="${yy + 4}" text-anchor="end">${Math.round(v)}</text>`;
    }
    years.forEach((yr, i) => {
      if (yr === 2020 || yr === 2021) svg += `<rect x="${x(i) - 20}" y="${p.t}" width="40" height="${h - p.t - p.b}" fill="#fff" opacity=".035"/>`;
      svg += `<text class="axis-label" x="${x(i)}" y="${h - 17}" text-anchor="middle">${yr}</text>`;
    });
    series.forEach(s => {
      const points = s.values.map((v, i) => Number.isFinite(v) ? `${x(i)},${y(v)}` : null).filter(Boolean).join(' ');
      svg += `<polyline points="${points}" fill="none" stroke="${s.color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
      s.values.forEach((v, i) => {
        if (!Number.isFinite(v)) return;
        svg += `<circle cx="${x(i)}" cy="${y(v)}" r="3.8" fill="${s.color}"><title>${esc(s.name)}: ${dec(v, 1)}</title></circle>`;
      });
    });
    svg += `</svg><div class="legend">${series.map(s => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>`;
    container.innerHTML = svg;
  }

  function trend(metric = 'nights') {
    const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
    const series = municipalities.map(m => {
      const base = annual(m, 2019)[metric];
      return { name: m, color: colors[m], values: years.map(y => base ? annual(m, y)[metric] / base * 100 : null) };
    });
    lineChart(document.getElementById('trendChart'), series, years, true);
    document.getElementById('trendHeadline').textContent = `Indeks ${metric === 'nights' ? 'nočitev' : 'gostov'} (2019 = 100)`;
  }

  function seasonality() {
    const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'];
    const w = 1000, h = 360, p = { l: 52, r: 20, t: 20, b: 55 };
    const series = municipalities.map(m => {
      const stats = seasonStats(m);
      return { name: m, color: colors[m], values: stats.rows.map(x => Number.isFinite(x.nights) && stats.total ? x.nights / stats.total * 100 : null) };
    });
    const max = Math.max(...series.flatMap(s => s.values)) * 1.15;
    const x = i => p.l + i * (w - p.l - p.r) / 11;
    const y = v => p.t + (max - v) * (h - p.t - p.b) / max;
    let svg = `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true">`;
    for (let i = 0; i <= 4; i++) {
      const v = max * i / 4, yy = y(v);
      svg += `<line class="chart-grid-line" x1="${p.l}" y1="${yy}" x2="${w - p.r}" y2="${yy}"/><text class="axis-label" x="${p.l - 8}" y="${yy + 4}" text-anchor="end">${Math.round(v)} %</text>`;
    }
    months.forEach((m, i) => svg += `<text class="axis-label" x="${x(i)}" y="${h - 17}" text-anchor="middle">${m}</text>`);
    series.forEach(s => {
      const segments = [];
      let current = [];
      s.values.forEach((v, i) => {
        if (Number.isFinite(v)) current.push(`${x(i)},${y(v)}`);
        else if (current.length) { segments.push(current); current = []; }
      });
      if (current.length) segments.push(current);
      segments.forEach(points => svg += `<polyline points="${points.join(' ')}" fill="none" stroke="${s.color}" stroke-width="3.5"/>`);
      s.values.forEach((v, i) => {
        if (Number.isFinite(v)) svg += `<circle cx="${x(i)}" cy="${y(v)}" r="3.2" fill="${s.color}"><title>${esc(s.name)}, ${months[i]}: ${dec(v, 1)} %</title></circle>`;
      });
    });
    svg += `</svg><div class="legend">${series.map(s => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>`;
    document.getElementById('seasonChart').innerHTML = svg;
    document.getElementById('seasonCards').innerHTML = municipalities.map(m => {
      const stats = seasonStats(m);
      const protection = stats.protectedMonths ? ` · ${stats.protectedMonths} zaščiteni meseci niso prikazani` : '';
      return `<article class="side-card" style="--municipality-color:${colors[m]}"><h3>${esc(m)}</h3><strong>${pct(stats.jjaShare)}</strong><span>nočitev junij–avgust; vrh: ${months[Number(stats.peak.period.slice(-2)) - 1]} (${fmt.format(stats.peak.nights)})${protection}</span></article>`;
    }).join('');
  }

  function markets() {
    const sums = {};
    municipalities.forEach(m => {
      sums[m] = {};
      monthly(m, 2025).forEach(row => Object.entries(row.markets).forEach(([k, v]) => {
        if (!['Država - SKUPAJ', 'DOMAČI', 'TUJI'].includes(k) && Number.isFinite(v.nights)) sums[m][k] = (sums[m][k] || 0) + v.nights;
      }));
    });
    const totalForeign = {};
    municipalities.forEach(m => totalForeign[m] = annual(m, 2025, 'Tuji').nights);
    const top = Object.entries(sums['Tržič']).sort((a, b) => b[1] - a[1]).slice(0, 10);
    document.getElementById('topMarkets').innerHTML = top.map(([k, v], i) => `<div class="rank-row"><b>${i + 1}</b><div><strong>${esc(k)}</strong><small>${pct(v / totalForeign['Tržič'] * 100)} tujih nočitev</small></div><span>${fmt.format(v)}</span></div>`).join('');

    const marketComparators = comparators.filter(m => monthly(m, 2025).every(row => Number.isFinite(row.foreignNights)));
    const benchmarkForeign = marketComparators.reduce((s, m) => s + totalForeign[m], 0);
    const opp = Object.keys(sums['Tržič']).map(name => {
      const trzicShare = totalForeign['Tržič'] ? (sums['Tržič'][name] || 0) / totalForeign['Tržič'] : 0;
      const external = marketComparators.reduce((s, m) => s + (sums[m][name] || 0), 0);
      const benchmarkShare = benchmarkForeign ? external / benchmarkForeign : 0;
      return { name, trzicShare, benchmarkShare, external, gap: benchmarkShare - trzicShare };
    }).filter(x => x.external > 5000 && x.gap > 0.002).sort((a, b) => b.gap - a.gap).slice(0, 10);

    document.getElementById('opportunityMarkets').innerHTML = opp.length ? opp.map(x => `<div class="opportunity-row"><div><strong>${esc(x.name)}</strong><span>Tržič ${pct(x.trzicShare * 100)} · primerjalne občine ${pct(x.benchmarkShare * 100)}</span></div><span class="pill">vrzel ${pct(x.gap * 100)}</span></div>`).join('') : '<p class="empty-state">Po postavljenih pragovih ni izrazitega trga.</p>';
  }

  function spending() {
    const estimates = municipalities.map(spendEstimate);
    document.getElementById('spendingGrid').innerHTML = estimates.map(x => `<article class="spending-card" style="--municipality-color:${colors[x.municipality]}">
      <h3>${esc(x.municipality)}</h3>
      <span class="spending-type">${esc(x.municipalityType)}</span>
      <div class="spending-big">${compactEuro(x.estimatedSpend)}</div>
      <p>osrednja modelna ocena za leto 2025${x.suppressedMonths ? ` · ${x.suppressedMonths} zaščiteni meseci` : ''}</p>
      <dl><div><dt>Orientacijski razpon</dt><dd>${compactEuro(x.orientationLower)}–${compactEuro(x.orientationUpper)}</dd></div><div><dt>Na tujo nočitev</dt><dd>${dec(x.estimatedDailySpend, 0)} €</dd></div><div><dt>Tuje nočitve</dt><dd>${fmt.format(x.foreignNights)}</dd></div></dl>
    </article>`).join('');

    const max = Math.max(...estimates.map(x => x.estimatedDailySpend));
    document.getElementById('spendingChart').innerHTML = estimates.map(x => `<div class="spending-bar-row"><span>${esc(x.municipality)}</span><div class="spending-bar"><i style="width:${x.estimatedDailySpend / max * 100}%;background:${colors[x.municipality]}"></i></div><strong>${dec(x.estimatedDailySpend, 0)} €</strong></div>`).join('');

    const trzic = spendEstimate('Tržič');
    const entries = Object.entries(trzic.breakdown);
    const total = entries.reduce((s, [, v]) => s + v, 0);
    document.getElementById('spendingStack').innerHTML = entries.map(([name, value]) => `<i style="width:${value / total * 100}%;background:${breakdownColors[name]}" title="${esc(name)}: ${pct(value / total * 100)}"></i>`).join('');
    document.getElementById('spendingBreakdown').innerHTML = entries.sort((a, b) => b[1] - a[1]).map(([name, value]) => `<div><span><i style="background:${breakdownColors[name]}"></i>${esc(name)}</span><strong>${compactEuro(value)} <small>${pct(value / total * 100)}</small></strong></div>`).join('');
  }

  function capacities() {
    document.getElementById('capacityGrid').innerHTML = municipalities.map(m => {
      const a = annual(m, 2025), c = capacity(m, 2025), c19 = capacity(m, 2019);
      const ratio = c.bedsPermanent ? a.nights / c.bedsPermanent : 0;
      const growth = c19.bedsPermanent ? (c.bedsPermanent / c19.bedsPermanent - 1) * 100 : 0;
      return `<article class="capacity-card" style="--municipality-color:${colors[m]}"><h3>${esc(m)}</h3><div class="big">${dec(ratio, 1)}</div><p>nočitve na stalno ležišče v 2025</p><p><strong>${fmt.format(c.bedsPermanent)}</strong> stalnih ležišč; sprememba od 2019: ${growth >= 0 ? '+' : ''}${pct(growth)}</p></article>`;
    }).join('');
    const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
    const series = municipalities.map(m => ({ name: m, color: colors[m], values: years.map(y => {
      const a = annual(m, y), c = capacity(m, y);
      return c?.bedsPermanent ? a.nights / c.bedsPermanent : null;
    }) }));
    lineChart(document.getElementById('capacityChart'), series, years, false);
  }

  function pearson(a, b) {
    if (a.length < 3 || a.length !== b.length) return null;
    const ma = a.reduce((s, x) => s + x, 0) / a.length;
    const mb = b.reduce((s, x) => s + x, 0) / b.length;
    let numerator = 0, da = 0, db = 0;
    for (let i = 0; i < a.length; i++) {
      const x = a[i] - ma, y = b[i] - mb;
      numerator += x * y; da += x * x; db += y * y;
    }
    return da && db ? numerator / Math.sqrt(da * db) : null;
  }

  function ranks(values) {
    const out = new Array(values.length);
    const sorted = values.map((x, i) => ({ x, i })).sort((a, b) => a.x - b.x);
    for (let i = 0; i < sorted.length;) {
      let j = i;
      while (j + 1 < sorted.length && sorted[j + 1].x === sorted[i].x) j++;
      const rank = (i + j) / 2 + 1;
      for (let k = i; k <= j; k++) out[sorted[k].i] = rank;
      i = j + 1;
    }
    return out;
  }

  function shiftPeriod(period, delta) {
    const year = Number(period.slice(0, 4));
    const month = Number(period.slice(5, 7));
    const date = new Date(Date.UTC(year, month - 1 + delta, 1));
    return `${date.getUTCFullYear()}M${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  function yoyChanges(municipality) {
    const rows = monthly(municipality);
    const map = new Map(rows.map(x => [x.period, x.nights]));
    const changes = new Map();
    rows.forEach(row => {
      if (row.period < '2023M01') return;
      const previous = map.get(shiftPeriod(row.period, -12));
      if (Number.isFinite(row.nights) && Number.isFinite(previous) && previous > 0) changes.set(row.period, row.nights / previous - 1);
    });
    return changes;
  }

  function signals() {
    const changes = Object.fromEntries(municipalities.map(m => [m, yoyChanges(m)]));
    const target = changes['Tržič'];
    const cards = comparators.map(comp => {
      const results = [];
      for (let lag = 0; lag <= 3; lag++) {
        const a = [], b = [];
        target.forEach((targetValue, period) => {
          const comparisonValue = changes[comp].get(shiftPeriod(period, -lag));
          if (Number.isFinite(comparisonValue)) {
            a.push(targetValue);
            b.push(comparisonValue);
          }
        });
        results.push({ lag, n: a.length, p: pearson(a, b), s: pearson(ranks(a), ranks(b)) });
      }
      const valid = results.filter(r => Number.isFinite(r.p));
      const best = valid.reduce((a, b) => Math.abs(b.p) > Math.abs(a.p) ? b : a, valid[0]);
      const strength = Math.abs(best.p) >= 0.7 ? 'močna opisna povezava' : Math.abs(best.p) >= 0.4 ? 'zmerna opisna povezava' : 'šibka opisna povezava';
      return `<article class="signal-card" style="--municipality-color:${colors[comp]}"><h3>${esc(comp)} → Tržič</h3><p>Medletna sprememba nočitev v občini ${esc(comp)} proti poznejši medletni spremembi v Tržiču.</p><div class="lag-table">${results.map(r => `<div class="lag-row"><span>${r.lag === 0 ? 'isti mesec' : `zamik ${r.lag} mes.`}</span><div class="bar"><i class="${r.p < 0 ? 'negative' : ''}" style="width:${Number.isFinite(r.p) ? Math.min(100, Math.abs(r.p) * 100) : 0}%"></i></div><strong>${Number.isFinite(r.p) ? dec(r.p, 2) : '—'}</strong></div>`).join('')}</div><div class="best-signal"><strong>Najizraziteje:</strong> ${best.lag === 0 ? 'isti mesec' : `${best.lag} ${best.lag === 1 ? 'mesec' : 'mesece'} pozneje`} (Pearson r = ${dec(best.p, 2)}, Spearman ρ = ${dec(best.s, 2)}, n = ${best.n}). Gre za ${strength}.</div></article>`;
    });
    document.getElementById('signalGrid').innerHTML = cards.join('');
  }

  snapshot();
  trend();
  seasonality();
  markets();
  spending();
  capacities();
  signals();

  document.querySelectorAll('[data-trend]').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('[data-trend]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    trend(btn.dataset.trend);
  }));
})();

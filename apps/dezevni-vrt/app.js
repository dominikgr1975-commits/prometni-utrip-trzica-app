(() => {
  'use strict';

  const data = window.UTRIP_DEZEVNI_VRT_DATA;
  if (!data) return;

  const tankColors = {
    'Trzic-Tank1':'#176b5b','Trzic-Tank2':'#2689b8','Trzic-Tank3':'#8c63b8','Trzic-Tank4':'#d06b65','Trzic-Tank5':'#d29a2e'
  };
  const tankNames = Object.fromEntries(data.tanks.map(t => [t.id, t.name]));
  let selectedDays = 7;
  let selectedDepth = 15;

  const $ = id => document.getElementById(id);
  const pct = value => `${(value * 100).toLocaleString('sl-SI',{minimumFractionDigits:1,maximumFractionDigits:1})} %`;
  const pp = value => `${Math.abs(value * 100).toLocaleString('sl-SI',{minimumFractionDigits:1,maximumFractionDigits:1})} odst. to\u010dke`;
  const dateFmt = value => new Intl.DateTimeFormat('sl-SI',{day:'numeric',month:'numeric',year:'numeric'}).format(new Date(`${value}T12:00:00`));
  const shortDate = value => new Intl.DateTimeFormat('sl-SI',{day:'numeric',month:'numeric'}).format(new Date(`${value}T12:00:00`));

  function rowsForPeriod() {
    if (selectedDays === 'all') return data.daily;
    const last = new Date(`${data.meta.to.slice(0,10)}T12:00:00`);
    const start = new Date(last);
    start.setDate(last.getDate() - Number(selectedDays) + 1);
    const startKey = start.toISOString().slice(0,10);
    return data.daily.filter(row => row.date >= startKey);
  }

  function groupRows(rows) {
    const byTank = new Map();
    rows.forEach(row => {
      if (!byTank.has(row.tank)) byTank.set(row.tank, []);
      byTank.get(row.tank).push(row);
    });
    return byTank;
  }

  function mean(values) {
    const valid = values.filter(Number.isFinite);
    return valid.length ? valid.reduce((a,b)=>a+b,0) / valid.length : null;
  }

  function std(values) {
    const valid = values.filter(Number.isFinite);
    if (valid.length < 2) return 0;
    const avg = mean(valid);
    return Math.sqrt(mean(valid.map(v => (v-avg) ** 2)));
  }

  function selectedPeriodLabel() {
    const rows = rowsForPeriod();
    const dates = [...new Set(rows.map(r=>r.date))].sort();
    return `${dateFmt(dates[0])}\u2013${dateFmt(dates[dates.length-1])}`;
  }

  function renderPeriodText() {
    $('periodDescription').textContent = `Prikazano obdobje: ${selectedPeriodLabel()}.`;
    $('trendContext').textContent = selectedPeriodLabel();
    const from = new Date(data.meta.from);
    const to = new Date(data.meta.to);
    $('footerPeriod').textContent = `Podatki ZENTRA: ${from.toLocaleDateString('sl-SI')}\u2013${to.toLocaleDateString('sl-SI')}`;
  }

  function renderSummary() {
    const rows = rowsForPeriod();
    const grouped = groupRows(rows);
    const latestDate = data.meta.to.slice(0,10);
    const latest = data.daily.filter(row => row.date === latestDate);
    const plantedLatest = latest.filter(row => row.tank !== 'Trzic-Tank1');
    const latest15 = plantedLatest.map(r=>r.moisture15).filter(Number.isFinite);
    const latest35 = plantedLatest.map(r=>r.moisture35).filter(Number.isFinite);
    const allDeeper = latest.every(r => Number.isFinite(r.moisture15) && Number.isFinite(r.moisture35) && r.moisture35 > r.moisture15);

    const dailyPlanted = new Map();
    rows.filter(r=>r.tank !== 'Trzic-Tank1').forEach(row => {
      if (!dailyPlanted.has(row.date)) dailyPlanted.set(row.date, []);
      dailyPlanted.get(row.date).push(row.moisture15);
    });
    const series = [...dailyPlanted.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([date,vals])=>({date,value:mean(vals)}));
    let biggestRise = null;
    for (let i=1;i<series.length;i++) {
      const diff = series[i].value - series[i-1].value;
      if (!biggestRise || diff > biggestRise.diff) biggestRise = {date:series[i].date,diff};
    }

    const currentTitle = allDeeper
      ? `Globlji sloj je trenutno bolj vla\u017een v vseh petih Tankih.`
      : `Vla\u017enost se med globinama in Tanki razlikuje.`;
    const riseText = biggestRise && biggestRise.diff > .015
      ? ` Najve\u010dji skupni dvig vla\u017enosti zasajenih Tankov v izbranem obdobju je bil ${dateFmt(biggestRise.date)}.`
      : '';
    $('summaryLeadTitle').textContent = currentTitle;
    $('summaryLeadText').textContent = `Na zadnji dan meritev so zasajeni Tanki na 15 cm dosegali ${pct(Math.min(...latest15))}\u2013${pct(Math.max(...latest15))}, na 35 cm pa ${pct(Math.min(...latest35))}\u2013${pct(Math.max(...latest35))}.${riseText}`;

    const avgFor = (tank,key) => mean((grouped.get(tank)||[]).map(r=>r[key]));
    const t2_15 = avgFor('Trzic-Tank2','moisture15');
    const t5_15 = avgFor('Trzic-Tank5','moisture15');
    const t2_35 = avgFor('Trzic-Tank2','moisture35');
    const t5_35 = avgFor('Trzic-Tank5','moisture35');
    const t1_15 = avgFor('Trzic-Tank1','moisture15');
    const t1_35 = avgFor('Trzic-Tank1','moisture35');
    const t1var = std((grouped.get('Trzic-Tank1')||[]).map(r=>r.moisture15));
    const t2var = std((grouped.get('Trzic-Tank2')||[]).map(r=>r.moisture15));
    const avgDeepDiff = mean(latest.map(r=>r.moisture35-r.moisture15));

    const findings = [
      {
        tag:'Trenutno stanje',
        title:'Voda je bolj prisotna v globljem sloju',
        text:`Na zadnji dan meritev je bila vla\u017enost na 35 cm v povpre\u010dju za ${pp(avgDeepDiff)} vi\u0161ja kot na 15 cm. To ka\u017ee, da se je voda premaknila tudi globlje v profil tal.`,
        metric:pct(mean(latest35)), small:'povpre\u010dje zasajenih Tankov, 35 cm'
      },
      {
        tag:'Vpliv substrata',
        title:'Tank brez dodanega peska zadr\u017euje ve\u010d vlage',
        text:`V izbranem obdobju ima Tank 2 v primerjavi s Tankom 5 za ${pp(t2_15-t5_15)} ve\u010d vlage na 15 cm in za ${pp(t2_35-t5_35)} ve\u010d na 35 cm. Opazovanje je skladno s hitrej\u0161im odtekanjem pri ve\u010djem dele\u017eu peska.`,
        metric:`${Math.round(data.tanks[4].sandPct)} %`, small:'peska v Tanku 5'
      },
      {
        tag:'Vpliv rastlin',
        title:'Nezasajeni Tank je bolj vla\u017een in stabilen',
        text:`Tank 1 in Tank 2 imata enak substrat, vendar je Tank 1 brez rastlin. V izbranem obdobju je imel na 15 cm za ${pp(t1_15-t2_15)} ve\u010d vlage${t1var < t2var ? ' in manj\u0161a dnevna nihanja' : ''}. Razlika je skladna s porabo vode pri rastlinah, vendar sama po sebi \u0161e ni dokaz vzroka.`,
        metric:pct(t1_15), small:'povpre\u010dje Tanka 1, 15 cm'
      }
    ];

    $('findingGrid').innerHTML = findings.map((f,i)=>`<article class="finding-card">
      <div class="finding-top"><span class="finding-number">${i+1}</span><span class="finding-tag">${f.tag}</span></div>
      <h3>${f.title}</h3><p>${f.text}</p><div class="finding-metric">${f.metric}<small>${f.small}</small></div>
    </article>`).join('');
  }

  function renderTrend() {
    const rows = rowsForPeriod();
    const key = selectedDepth === 15 ? 'moisture15' : 'moisture35';
    const dates = [...new Set(rows.map(r=>r.date))].sort();
    const byTank = groupRows(rows);
    const values = rows.map(r=>r[key]).filter(Number.isFinite);
    const low = Math.max(0, Math.floor((Math.min(...values)*100 - 3)/5)*5);
    const high = Math.ceil((Math.max(...values)*100 + 3)/5)*5;
    const width = 920, height = 350, ml = 52, mr = 15, mt = 18, mb = 45;
    const plotW = width-ml-mr, plotH = height-mt-mb;
    const x = i => ml + (dates.length === 1 ? plotW/2 : i/(dates.length-1)*plotW);
    const y = value => mt + (high-value*100)/(high-low)*plotH;
    const tickCount = 5;
    let svg = `<svg class="trend-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Vla\u017enost tal po dnevih">`;
    for (let i=0;i<=tickCount;i++) {
      const val = low + (high-low)*i/tickCount;
      const yy = y(val/100);
      svg += `<line class="grid-line" x1="${ml}" y1="${yy}" x2="${width-mr}" y2="${yy}"/><text class="axis-label" x="${ml-9}" y="${yy+4}" text-anchor="end">${val.toFixed(0)} %</text>`;
    }
    svg += `<line class="axis-line" x1="${ml}" y1="${height-mb}" x2="${width-mr}" y2="${height-mb}"/>`;
    const xTickStep = Math.max(1, Math.ceil(dates.length/6));
    dates.forEach((date,i)=>{ if (i%xTickStep===0 || i===dates.length-1) svg += `<text class="axis-label" x="${x(i)}" y="${height-18}" text-anchor="middle">${shortDate(date)}</text>`; });

    data.tanks.forEach(tank => {
      const map = new Map((byTank.get(tank.id)||[]).map(r=>[r.date,r[key]]));
      const points = dates.map((date,i)=>({date,value:map.get(date),x:x(i)})).filter(p=>Number.isFinite(p.value));
      const path = points.map((p,i)=>`${i?'L':'M'} ${p.x.toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ');
      svg += `<path class="trend-line" stroke="${tankColors[tank.id]}" d="${path}"/>`;
      const last = points[points.length-1];
      if (last) svg += `<circle class="trend-dot" fill="${tankColors[tank.id]}" cx="${last.x}" cy="${y(last.value)}" r="5"><title>${tank.name}: ${pct(last.value)}</title></circle>`;
    });
    svg += '</svg>';
    $('trendChart').innerHTML = svg;
    $('trendTitle').textContent = `Vla\u017enost na globini ${selectedDepth} cm`;
    $('trendLegend').innerHTML = data.tanks.map(t=>`<span><i style="background:${tankColors[t.id]}"></i>${t.name}${t.planted?'':' (brez rastlin)'}</span>`).join('');
  }

  function renderComparison() {
    const latestDate = data.meta.to.slice(0,10);
    const latest = data.daily.filter(row=>row.date===latestDate);
    const max = Math.max(...latest.flatMap(r=>[r.moisture15,r.moisture35]).filter(Number.isFinite));
    $('comparisonDate').textContent = dateFmt(latestDate);
    $('comparisonChart').innerHTML = latest.map(row => {
      const h15 = row.moisture15/max*230;
      const h35 = row.moisture35/max*230;
      return `<div class="bar-group"><div class="bars">
        <div class="bar depth-a" style="height:${h15}px"><span>${pct(row.moisture15)}</span></div>
        <div class="bar depth-b" style="height:${h35}px"><span>${pct(row.moisture35)}</span></div>
      </div><strong>${tankNames[row.tank].replace('Tank ','T')}</strong></div>`;
    }).join('');
  }

  function renderTanks() {
    $('tankGrid').innerHTML = data.tanks.map((tank,index)=>`<article class="tank-card" style="--tank-color:${tankColors[tank.id]}">
      <h3>${tank.name}</h3><div class="role">${tank.role}</div>
      <div class="tank-badges"><span>${tank.planted?'avtohtone trajnice':'brez rastlin'}</span><span>${tank.sandPct} % dodanega peska</span></div>
      <strong>${tank.substrate}</strong>
      <div class="mini-layers"><div class="mini-top">40 cm substrata</div><div class="mini-sand">10 cm peska</div><div class="mini-gravel">25 cm proda</div></div>
    </article>`).join('');
    const plantNames = [
      'lepi luk','kosmuljek','ranjak','navadni \u010distec','navadna \u0161parnica','vrbovolistni primo\u017eek','panonski osat','malocvetna \u0161panska detelja','gadovec','navadni oslad','barvilna ko\u0161eni\u010dica','ilirski me\u010dek','navadna mra\u010dica','ivanj\u0161\u010dica','lepki lan','travni\u0161ka kadulja','Barelierov jeti\u010dnik'
    ];
    $('plantList').innerHTML = plantNames.map(name=>`<span>${name}</span>`).join('');
  }

  function bindControls() {
    $('periodButtons').addEventListener('click', event => {
      const button = event.target.closest('button[data-days]');
      if (!button) return;
      selectedDays = button.dataset.days === 'all' ? 'all' : Number(button.dataset.days);
      $('periodButtons').querySelectorAll('button').forEach(el=>el.classList.toggle('active',el===button));
      renderAll();
    });
    $('depthButtons').addEventListener('click', event => {
      const button = event.target.closest('button[data-depth]');
      if (!button) return;
      selectedDepth = Number(button.dataset.depth);
      $('depthButtons').querySelectorAll('button').forEach(el=>el.classList.toggle('active',el===button));
      renderTrend();
    });
  }

  function renderAll() {
    renderPeriodText();
    renderSummary();
    renderTrend();
    renderComparison();
  }

  bindControls();
  renderTanks();
  renderAll();
})();

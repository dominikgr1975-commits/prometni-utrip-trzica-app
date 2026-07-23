(() => {
  'use strict';

  const data = window.PROMETNI_UTRIP_DATA || {};
  const summary = data.TOURISM_SUMMARY;
  const markets = data.TOURISM_MARKETS;
  const accommodation = data.TOURISM_ACCOMMODATION;

  const monthNames = ['januar','februar','marec','april','maj','junij','julij','avgust','september','oktober','november','december'];
  const monthShort = ['jan','feb','mar','apr','maj','jun','jul','avg','sep','okt','nov','dec'];
  const mainSummer = new Set([6,7,8]);
  const integer = new Intl.NumberFormat('sl-SI', {maximumFractionDigits: 0});
  const decimal = new Intl.NumberFormat('sl-SI', {minimumFractionDigits: 1, maximumFractionDigits: 1});
  const money = new Intl.NumberFormat('sl-SI', {style: 'currency', currency: 'EUR', maximumFractionDigits: 0});

  if (!summary || !markets || !accommodation) {
    document.querySelector('main').innerHTML = '<section class="source-notice"><strong>Napaka:</strong> podatkovne datoteke turistične aplikacije niso bile pravilno naložene.</section>';
    return;
  }

  const $ = (id) => document.getElementById(id);
  const yearOf = (month) => Number(String(month).slice(0, 4));
  const monthOf = (month) => Number(String(month).slice(5, 7));
  const sum = (rows, key) => rows.reduce((acc, row) => acc + (Number(row[key]) || 0), 0);
  const pct = (value) => `${decimal.format(value * 100)} %`;
  const signed = (value, formatter = integer) => `${value > 0 ? '+' : ''}${formatter.format(value)}`;
  const latestFullYear = Math.max(...summary.annual.filter(row => summary.monthly.filter(x => yearOf(x.month) === row.year).length === 12).map(row => row.year));
  const years = [...new Set(summary.monthly.map(row => yearOf(row.month)))].sort((a,b) => b-a);
  let selectedPeriod = String(latestFullYear);
  let scenarioDelta = 0;

  function populatePeriodSelect() {
    const select = $('periodSelect');
    select.innerHTML = `<option value="all">Celotno obdobje (${summary.period.from}–${summary.period.to})</option>` + years.map(year => {
      const count = summary.monthly.filter(row => yearOf(row.month) === year).length;
      return `<option value="${year}"${year === latestFullYear ? ' selected' : ''}>${year}${count < 12 ? ` (${monthNames[count - 1] ? `januar–${monthNames[count - 1]}` : 'delno'})` : ''}</option>`;
    }).join('');
    select.value = selectedPeriod;
    select.addEventListener('change', () => {
      selectedPeriod = select.value;
      renderOverview();
      renderMarketAnalysis();
      renderSlovenianAnalysis();
    });
  }

  function populateScenarioControls() {
    const byYear = new Map();
    accommodation.records.forEach(row => {
      const year = yearOf(row.month);
      if (!byYear.has(year)) byYear.set(year, []);
      byYear.get(year).push(row);
    });
    const scenarioYears = [...byYear.keys()].sort((a,b) => b-a);
    const select = $('scenarioYearSelect');
    select.innerHTML = scenarioYears.map(year => {
      const count = byYear.get(year).length;
      return `<option value="${year}"${year === latestFullYear ? ' selected' : ''}>${year}${count < 12 ? ` (${monthNames[count - 1] ? `januar–${monthNames[count - 1]}` : 'delno'})` : ''}</option>`;
    }).join('');
    select.value = String(latestFullYear);
    select.addEventListener('change', renderScenario);

    const deltas = [-100,-50,-20,0,20,50,100];
    $('scenarioButtons').innerHTML = deltas.map(delta => `<button type="button" class="scenario-btn${delta === 0 ? ' active' : ''}" data-delta="${delta}">${delta > 0 ? '+' : ''}${delta}</button>`).join('');
    $('scenarioButtons').addEventListener('click', (event) => {
      const button = event.target.closest('button[data-delta]');
      if (!button) return;
      scenarioDelta = Number(button.dataset.delta);
      document.querySelectorAll('.scenario-btn').forEach(el => el.classList.toggle('active', el === button));
      renderScenario();
    });
  }

  function rowsForPeriod(rows) {
    if (selectedPeriod === 'all') return rows;
    const year = Number(selectedPeriod);
    return rows.filter(row => yearOf(row.month) === year);
  }

  function readableMonth(month) {
    const year = yearOf(month);
    const monthIndex = monthOf(month) - 1;
    return `${monthNames[monthIndex]} ${year}`;
  }

  function selectedPeriodText() {
    if (selectedPeriod === 'all') {
      return `${readableMonth(summary.period.from)}–${readableMonth(summary.period.to)}`;
    }
    const year = Number(selectedPeriod);
    const rows = summary.monthly.filter(row => yearOf(row.month) === year);
    if (rows.length === 12) return `leto ${year}`;
    const lastMonth = rows.length ? monthNames[monthOf(rows[rows.length - 1].month) - 1] : 'delno obdobje';
    return `leto ${year} (januar–${lastMonth})`;
  }

  function monthlyProfile(rows, key, averageForAll = true) {
    const grouped = Array.from({length: 12}, () => []);
    rows.forEach(row => grouped[monthOf(row.month) - 1].push(Number(row[key]) || 0));
    return grouped.map((values, index) => ({
      monthIndex: index,
      value: values.length ? (selectedPeriod === 'all' && averageForAll ? values.reduce((a,b)=>a+b,0) / values.length : values.reduce((a,b)=>a+b,0)) : null,
      samples: values.length
    }));
  }

  function renderVerticalChart(containerId, profile, formatter = integer) {
    const container = $(containerId);
    const max = Math.max(1, ...profile.map(row => row.value || 0));
    container.innerHTML = profile.map(row => {
      const value = row.value;
      const height = value == null ? 0 : Math.max(1.5, value / max * 100);
      return `<div class="vbar-item" title="${monthNames[row.monthIndex]}: ${value == null ? 'ni podatka' : formatter.format(value)}">
        <div class="vbar-track"><div class="vbar${value == null ? ' empty' : ''}" style="height:${height}%"><span class="vbar-value">${value == null ? '–' : formatter.format(value)}</span></div></div>
        <span class="vbar-label">${monthShort[row.monthIndex]}</span>
      </div>`;
    }).join('');
  }

  function renderOverview() {
    const rows = rowsForPeriod(summary.monthly);
    const accommodationRows = rowsForPeriod(accommodation.records);
    const totalGuests = sum(rows, 'guests');
    const totalNights = sum(rows, 'overnights');
    const totalCapacity = sum(accommodationRows, 'availableBedNights');
    const totalDays = sum(accommodationRows, 'daysInMonth');
    const avgStay = totalGuests ? totalNights / totalGuests : 0;
    const occupancy = totalCapacity ? totalNights / totalCapacity : 0;
    const avgBeds = totalDays ? totalCapacity / totalDays : 0;
    const tax = selectedPeriod === 'all'
      ? summary.touristTaxAnnual.reduce((acc,row)=>acc + row.touristTax,0)
      : (summary.touristTaxAnnual.find(row => row.year === Number(selectedPeriod)) || {}).touristTax || 0;
    const isPartial = selectedPeriod !== 'all' && rows.length < 12;

    const cards = [
      ['Gostje', integer.format(totalGuests), isPartial ? 'delno leto' : 'evidentirani prihodi'],
      ['Nočitve', integer.format(totalNights), isPartial ? 'delno leto' : 'evidentirane nočitve'],
      ['Povp. bivanje', `${decimal.format(avgStay)} dni`, 'nočitve na gosta'],
      ['Letna zasedenost', pct(occupancy), 'tehtano po kapaciteti'],
      ['Povp. ležišč', integer.format(avgBeds), 'razpoložljiva ležišča'],
      ['Turistična taksa', money.format(tax), isPartial ? 'januar–junij' : 'evidentiran znesek']
    ];
    $('kpiGrid').innerHTML = cards.map(card => `<article class="kpi-card"><span>${card[0]}</span><strong>${card[1]}</strong><small>${card[2]}</small></article>`).join('');

    const context = selectedPeriod === 'all' ? 'povprečje posameznega meseca po letih' : `leto ${selectedPeriod}`;
    $('overviewGuestsContext').textContent = context;
    $('overviewNightsContext').textContent = context;
    renderVerticalChart('overviewGuestsChart', monthlyProfile(rows, 'guests'), integer);
    renderVerticalChart('overviewNightsChart', monthlyProfile(rows, 'overnights'), integer);

    $('periodNote').textContent = selectedPeriod === 'all'
      ? `Prikaz vključuje obdobje ${summary.period.from}–${summary.period.to}. Mesečna grafa prikazujeta povprečje istega koledarskega meseca po razpoložljivih letih.`
      : `${selectedPeriod}${isPartial ? ' je delno leto in trenutno vključuje januar–junij.' : ' vključuje vseh 12 mesecev.'}`;
  }

  function marketStats() {
    const filtered = markets.records.filter(row => selectedPeriod === 'all' || yearOf(row.month) === Number(selectedPeriod));
    const byCountry = new Map();
    filtered.forEach(row => {
      const country = row.country;
      if (!byCountry.has(country)) byCountry.set(country, {country, outsideGuests:0, outsideNights:0, totalNights:0, invalid:0});
      const item = byCountry.get(country);
      const nights = Number(row.overnights) || 0;
      const validNights = nights < 0 ? 0 : nights;
      if (nights < 0) item.invalid += 1;
      item.totalNights += validNights;
      if (!mainSummer.has(monthOf(row.month))) {
        item.outsideGuests += Math.max(0, Number(row.guests) || 0);
        item.outsideNights += validNights;
      }
    });
    return [...byCountry.values()].map(item => ({
      ...item,
      outsideShare: item.totalNights ? item.outsideNights / item.totalNights : 0,
      avgStay: item.outsideGuests ? item.outsideNights / item.outsideGuests : 0
    })).filter(item => item.outsideNights > 0).sort((a,b) => b.outsideNights - a.outsideNights);
  }

  function renderMarketAnalysis() {
    const stats = marketStats();
    const top = stats.slice(0, 10);
    const periodText = selectedPeriodText();
    $('marketPeriodBadge').textContent = `Prikazano obdobje: ${periodText}`;
    $('marketContext').textContent = periodText;
    if (!top.length) {
      $('marketBars').innerHTML = '<div class="empty-state">Za izbrano obdobje ni podatkov.</div>';
      $('marketInsight').innerHTML = '<p>Za izbrano obdobje ni dovolj podatkov za analizo trgov.</p>';
      $('marketTableBody').innerHTML = '';
      return;
    }
    const max = top[0].outsideNights || 1;
    $('marketBars').innerHTML = top.map(item => `<div class="hbar-row">
      <span class="hbar-name" title="${item.country}">${item.country}</span>
      <div class="hbar-track"><div class="hbar-fill" style="width:${Math.max(1,item.outsideNights/max*100)}%"></div></div>
      <span class="hbar-value">${integer.format(item.outsideNights)}</span>
    </div>`).join('');
    $('marketTableBody').innerHTML = top.map((item,index) => `<tr>
      <td><span class="rank-badge">${index+1}</span></td><td>${item.country}${item.invalid ? ' <span class="quality-warning">opozorilo</span>' : ''}</td>
      <td>${integer.format(item.outsideNights)}</td><td>${integer.format(item.outsideGuests)}</td><td>${pct(item.outsideShare)}</td><td>${decimal.format(item.avgStay)} dni</td>
    </tr>`).join('');
    const first = top[0], second = top[1], third = top[2];
    const leaderText = [first,second,third].filter(Boolean).map(x=>`<strong>${x.country}</strong>`).join(', ');
    $('marketInsight').innerHTML = `<p>Zunaj glavne poletne sezone največ evidentiranih nočitev ustvarjajo ${leaderText}.</p>
      <p>Vodilni trg <strong>${first.country}</strong> je v obdobju september–maj ustvaril <strong>${integer.format(first.outsideNights)} nočitev</strong>. To predstavlja <strong>${pct(first.outsideShare)}</strong> vseh razpoložljivih nočitev tega trga v izbranem obdobju.</p>`;
  }

  function slovenianProfile() {
    const source = markets.records.filter(row => row.country === 'Slovenija' && (selectedPeriod === 'all' || yearOf(row.month) === Number(selectedPeriod)));
    const grouped = Array.from({length:12}, () => []);
    source.forEach(row => grouped[monthOf(row.month)-1].push(row));
    return grouped.map((rows,index) => {
      if (!rows.length) return {monthIndex:index, guests:null, overnights:null, avgStay:null, samples:0};
      const totalGuests = sum(rows,'guests');
      const totalNights = sum(rows,'overnights');
      const divisor = selectedPeriod === 'all' ? rows.length : 1;
      return {
        monthIndex:index,
        guests: totalGuests / divisor,
        overnights: totalNights / divisor,
        avgStay: totalGuests ? totalNights / totalGuests : 0,
        samples:rows.length
      };
    });
  }

  function renderSlovenianAnalysis() {
    const profile = slovenianProfile();
    const valid = profile.filter(row => row.overnights != null);
    const periodText = selectedPeriodText();
    $('sloveniaPeriodBadge').textContent = selectedPeriod === 'all'
      ? `Prikazano obdobje: ${periodText} · povprečni mesečni profil`
      : `Prikazano obdobje: ${periodText}`;
    $('sloveniaContext').textContent = selectedPeriod === 'all' ? `${periodText} · povprečje po letih` : periodText;
    if (!valid.length) {
      $('sloveniaKpis').innerHTML = '';
      $('sloveniaChart').innerHTML = '<div class="empty-state">Za izbrano obdobje ni podatkov.</div>';
      $('sloveniaInsight').innerHTML = '<p>Za izbrano obdobje ni dovolj podatkov.</p>';
      $('sloveniaTableBody').innerHTML = '';
      return;
    }
    const peakNights = valid.reduce((a,b)=>a.overnights>b.overnights?a:b);
    const peakGuests = valid.reduce((a,b)=>a.guests>b.guests?a:b);
    const rawRows = markets.records.filter(row => row.country === 'Slovenija' && (selectedPeriod === 'all' || yearOf(row.month) === Number(selectedPeriod)));
    const totalGuests = sum(rawRows,'guests');
    const totalNights = sum(rawRows,'overnights');
    const outsideNights = rawRows.filter(row => !mainSummer.has(monthOf(row.month))).reduce((acc,row)=>acc+Math.max(0,Number(row.overnights)||0),0);
    const outsideShare = totalNights ? outsideNights / totalNights : 0;
    const cards = [
      ['Največ nočitev', monthNames[peakNights.monthIndex], integer.format(peakNights.overnights)],
      ['Največ gostov', monthNames[peakGuests.monthIndex], integer.format(peakGuests.guests)],
      ['Povp. bivanje', `${decimal.format(totalGuests ? totalNights/totalGuests : 0)} dni`, 'v izbranem obdobju'],
      ['Izven poletja', pct(outsideShare), 'delež slovenskih nočitev']
    ];
    $('sloveniaKpis').innerHTML = cards.map(card => `<article class="mini-kpi"><span>${card[0]}</span><strong>${card[1]}</strong><small>${card[2]}</small></article>`).join('');
    renderVerticalChart('sloveniaChart', profile.map(row => ({monthIndex:row.monthIndex,value:row.overnights})), integer);
    $('sloveniaTableBody').innerHTML = profile.map(row => `<tr><td>${monthNames[row.monthIndex]}</td><td>${row.guests == null ? '–' : integer.format(row.guests)}</td><td>${row.overnights == null ? '–' : integer.format(row.overnights)}</td><td>${row.avgStay == null ? '–' : `${decimal.format(row.avgStay)} dni`}</td></tr>`).join('');
    $('sloveniaInsight').innerHTML = `<p>Slovenski gostje ustvarijo največ nočitev v mesecu <strong>${monthNames[peakNights.monthIndex]}</strong> (${integer.format(peakNights.overnights)} ${selectedPeriod === 'all' ? 'povprečnih ' : ''}nočitev).</p>
      <p>Največ prihodov je v mesecu <strong>${monthNames[peakGuests.monthIndex]}</strong>. Izven junija, julija in avgusta nastane <strong>${pct(outsideShare)}</strong> vseh evidentiranih slovenskih nočitev v izbranem obdobju.</p>`;
  }

  function renderScenario() {
    const year = Number($('scenarioYearSelect').value);
    const rows = accommodation.records.filter(row => yearOf(row.month) === year);
    if (!rows.length) return;
    const baselineGuests = sum(rows,'guests');
    const baselineNights = sum(rows,'overnights');
    const baselineCapacity = sum(rows,'availableBedNights');
    const totalDays = sum(rows,'daysInMonth');
    const baselineBeds = totalDays ? baselineCapacity / totalDays : 0;
    const baselineOccupancy = baselineCapacity ? baselineNights / baselineCapacity : 0;

    let projectedGuests = 0;
    let projectedNights = 0;
    let projectedCapacity = 0;
    const constrained = [];
    rows.forEach(row => {
      const newBeds = Math.max(1, Number(row.availableBeds) + scenarioDelta);
      const newCapacity = newBeds * Number(row.daysInMonth);
      const nights = Math.min(Number(row.overnights), newCapacity);
      const ratio = Number(row.overnights) > 0 ? nights / Number(row.overnights) : 1;
      projectedNights += nights;
      projectedGuests += Number(row.guests) * ratio;
      projectedCapacity += newCapacity;
      if (nights < Number(row.overnights)) constrained.push({month:row.month,lost:Number(row.overnights)-nights});
    });
    const projectedBeds = totalDays ? projectedCapacity / totalDays : 0;
    const projectedOccupancy = projectedCapacity ? projectedNights / projectedCapacity : 0;
    const guestDiff = projectedGuests - baselineGuests;
    const nightDiff = projectedNights - baselineNights;
    const occupancyDiff = projectedOccupancy - baselineOccupancy;
    const partial = rows.length < 12;

    const card = (title, values, projected=false) => `<article class="scenario-card${projected ? ' projected' : ''}"><h3>${title}</h3><div class="scenario-metrics">
      ${values.map(item => `<div class="scenario-metric"><span>${item[0]}</span><strong>${item[1]}</strong>${item[2] ? `<small class="${item[3] || ''}">${item[2]}</small>` : ''}</div>`).join('')}
    </div></article>`;
    $('scenarioComparison').innerHTML = card(`Izhodišče ${year}${partial ? ' · delno leto' : ''}`, [
      ['Povp. ležišč', integer.format(baselineBeds), 'mesečno tehtano'],
      ['Gostje', integer.format(baselineGuests), 'evidentirano'],
      ['Nočitve', integer.format(baselineNights), 'evidentirano'],
      ['Zasedenost', pct(baselineOccupancy), 'letna tehtana']
    ]) + card(`Scenarij ${scenarioDelta > 0 ? '+' : ''}${scenarioDelta} ležišč`, [
      ['Povp. ležišč', integer.format(projectedBeds), signed(projectedBeds-baselineBeds), projectedBeds-baselineBeds > 0 ? 'delta-positive' : projectedBeds-baselineBeds < 0 ? 'delta-negative' : 'delta-neutral'],
      ['Gostje', integer.format(projectedGuests), signed(guestDiff), guestDiff > 0 ? 'delta-positive' : guestDiff < 0 ? 'delta-negative' : 'delta-neutral'],
      ['Nočitve', integer.format(projectedNights), signed(nightDiff), nightDiff > 0 ? 'delta-positive' : nightDiff < 0 ? 'delta-negative' : 'delta-neutral'],
      ['Zasedenost', pct(projectedOccupancy), `${occupancyDiff > 0 ? '+' : ''}${decimal.format(occupancyDiff*100)} odst. točke`, occupancyDiff > 0 ? 'delta-positive' : occupancyDiff < 0 ? 'delta-negative' : 'delta-neutral']
    ], true);

    let explanation;
    if (scenarioDelta > 0) {
      explanation = `<p>Ob povečanju za <strong>${scenarioDelta} ležišč</strong> model ne predpostavlja, da bi dodatna ponudba sama ustvarila novo povpraševanje. Zato gostje in nočitve ostanejo enaki, povprečna letna zasedenost pa se zniža z <strong>${pct(baselineOccupancy)}</strong> na <strong>${pct(projectedOccupancy)}</strong>.</p>`;
    } else if (scenarioDelta < 0 && constrained.length === 0) {
      explanation = `<p>Ob zmanjšanju za <strong>${Math.abs(scenarioDelta)} ležišč</strong> se vse evidentirane nočitve v letu ${year} še vedno prilegajo razpoložljivi kapaciteti. Model zato ne ocenjuje izgube gostov ali nočitev, zasedenost pa naraste z <strong>${pct(baselineOccupancy)}</strong> na <strong>${pct(projectedOccupancy)}</strong>.</p>`;
    } else if (scenarioDelta < 0) {
      explanation = `<p>Ob zmanjšanju za <strong>${Math.abs(scenarioDelta)} ležišč</strong> bi bila kapaciteta presežena v <strong>${constrained.length} mesecih</strong>. Model ocenjuje zmanjšanje za približno <strong>${integer.format(Math.abs(nightDiff))} nočitev</strong> in <strong>${integer.format(Math.abs(guestDiff))} gostov</strong>.</p>`;
    } else {
      explanation = `<p>To je izhodiščno stanje brez spremembe števila ležišč. V letu ${year} je tehtana zasedenost znašala <strong>${pct(baselineOccupancy)}</strong>.</p>`;
    }
    $('scenarioInsight').innerHTML = explanation + '<p>Rezultat je kapacitetna ocena. Ne vključuje vpliva cen, kakovosti ponudbe, promocije, novih nastanitev, vremena ali sprememb povpraševanja.</p>';
    $('constrainedMonths').innerHTML = constrained.length
      ? constrained.map(row => `<span class="constraint-chip">${monthNames[monthOf(row.month)-1]}: −${integer.format(row.lost)} nočitev</span>`).join('')
      : '<span class="constraint-chip">Noben mesec ne doseže kapacitetne omejitve</span>';
  }

  populatePeriodSelect();
  populateScenarioControls();
  renderOverview();
  renderMarketAnalysis();
  renderSlovenianAnalysis();
  renderScenario();
})();

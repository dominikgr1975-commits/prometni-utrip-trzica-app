(() => {
  'use strict';

  const data = window.PROMETNI_UTRIP_DATA || {};
  const summary = data.TOURISM_SUMMARY;
  const markets = data.TOURISM_MARKETS;
  const accommodation = data.TOURISM_ACCOMMODATION;
  const ga4 = data.VISIT_TRZIC_GA4;

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



  const webCountryNames = {
    'Slovenia':'Slovenija','Austria':'Avstrija','Germany':'Nemčija','United States':'Združene države Amerike',
    'Italy':'Italija','Netherlands':'Nizozemska','Croatia':'Hrvaška','Czechia':'Češka','Poland':'Poljska',
    'Belgium':'Belgija','France':'Francija','Hungary':'Madžarska','United Kingdom':'Velika Britanija',
    'Switzerland':'Švica','Spain':'Španija','Sweden':'Švedska','Ireland':'Irska','Slovakia':'Slovaška',
    'Canada':'Kanada','Denmark':'Danska','Portugal':'Portugalska','Romania':'Romunija','Russia':'Ruska federacija',
    'Finland':'Finska','Norway':'Norveška','Serbia':'Srbija','Bosnia & Herzegovina':'Bosna in Hercegovina',
    'North Macedonia':'Makedonija','Australia':'Avstralija','Brazil':'Brazilija','Japan':'Japonska','Israel':'Izrael',
    'Türkiye':'Turčija','Ukraine':'Ukrajina','Singapore':'Singapur','Lithuania':'Litva','India':'Indija',
    'Indonesia':'Indonezija','New Zealand':'Nova Zelandija','Mexico':'Mehika','Albania':'Albanija','Costa Rica':'Kostarika'
  };

  function escapeWebHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  }

  function webCoverage(month) {
    return ga4?.meta?.monthCoverage?.find(row => row.month === month) || null;
  }

  function webMonthLabel(month) {
    return `${monthNames[monthOf(month) - 1]} ${yearOf(month)}`;
  }

  function addMonths(month, delta) {
    const [year, monthNumber] = month.split('-').map(Number);
    const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  function pearson(valuesA, valuesB) {
    if (valuesA.length !== valuesB.length || valuesA.length < 2) return null;
    const meanA = valuesA.reduce((a,b) => a + b, 0) / valuesA.length;
    const meanB = valuesB.reduce((a,b) => a + b, 0) / valuesB.length;
    let numerator = 0, sumA = 0, sumB = 0;
    valuesA.forEach((value, index) => {
      const da = value - meanA;
      const db = valuesB[index] - meanB;
      numerator += da * db;
      sumA += da * da;
      sumB += db * db;
    });
    const denominator = Math.sqrt(sumA * sumB);
    return denominator ? numerator / denominator : null;
  }

  function comparableWebMonths() {
    if (!ga4) return [];
    const tourismByMonth = new Map(summary.monthly.map(row => [row.month, row]));
    return ga4.monthly.records
      .map(web => ({web, tourism: tourismByMonth.get(web.month) || null, coverage: webCoverage(web.month)}))
      .filter(row => row.tourism)
      .sort((a,b) => a.web.month.localeCompare(b.web.month));
  }

  function latestFullComparableMonth() {
    return comparableWebMonths().filter(row => row.coverage?.complete).at(-1) || null;
  }

  function renderWebMonthlyComparison() {
    const rows = comparableWebMonths();
    const body = $('webMonthlyComparisonBody');
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="5">Ni skupnega mesečnega obdobja.</td></tr>';
      $('webMonthlyComparisonInsight').innerHTML = '<p>Primerjava trenutno ni mogoča.</p>';
      return;
    }
    body.innerHTML = rows.map(row => {
      const complete = Boolean(row.coverage?.complete);
      const status = complete ? ['full','cel mesec'] : ['partial',`${Number(row.coverage.from.slice(8,10))}.–${Number(row.coverage.to.slice(8,10))}.`];
      return `<tr><td>${escapeWebHtml(webMonthLabel(row.web.month))}</td><td>${integer.format(row.web.sessions)}</td><td>${integer.format(row.tourism.guests)}</td><td>${integer.format(row.tourism.overnights)}</td><td><span class="comparison-status-pill ${status[0]}">${status[1]}</span></td></tr>`;
    }).join('');

    const fullRows = rows.filter(row => row.coverage?.complete);
    if (fullRows.length === 1) {
      const row = fullRows[0];
      $('webMonthlyComparisonInsight').innerHTML = `<p><strong>${escapeWebHtml(webMonthLabel(row.web.month))}</strong> je trenutno edini polni skupni mesec: <strong>${integer.format(row.web.sessions)} spletnih sej</strong>, <strong>${integer.format(row.tourism.guests)} evidentiranih gostov</strong> in <strong>${integer.format(row.tourism.overnights)} nočitev</strong>.</p><p>To je opisni posnetek, ne konverzija ali dokaz vpliva spletne strani na prihod.</p>`;
    } else if (fullRows.length > 1) {
      const first = fullRows[0], last = fullRows.at(-1);
      const sessionChange = first.web.sessions ? (last.web.sessions / first.web.sessions - 1) : 0;
      const guestChange = first.tourism.guests ? (last.tourism.guests / first.tourism.guests - 1) : 0;
      const nightChange = first.tourism.overnights ? (last.tourism.overnights / first.tourism.overnights - 1) : 0;
      $('webMonthlyComparisonInsight').innerHTML = `<p>Med prvim in zadnjim polnim skupnim mesecem so se spletne seje spremenile za <strong>${signed(sessionChange * 100, decimal)} %</strong>, gostje za <strong>${signed(guestChange * 100, decimal)} %</strong>, nočitve pa za <strong>${signed(nightChange * 100, decimal)} %</strong>.</p><p>Sočasna smer spremembe še ne pomeni vzročnosti.</p>`;
    } else {
      $('webMonthlyComparisonInsight').innerHTML = '<p>V izvozu še ni polnega skupnega meseca; delnih mesecev ni primerno uporabljati za trend.</p>';
    }
  }

  function countryComparisonRows(month) {
    const webMap = new Map();
    ga4.countries.records.filter(row => row.month === month).forEach(row => {
      const country = webCountryNames[row.country] || row.country;
      const current = webMap.get(country) || {country, sessions:0};
      current.sessions += Number(row.sessions) || 0;
      webMap.set(country, current);
    });
    const tourismMap = new Map();
    markets.records.filter(row => row.month === month && Number(row.overnights) >= 0).forEach(row => {
      const current = tourismMap.get(row.country) || {country:row.country, guests:0, overnights:0};
      current.guests += Number(row.guests) || 0;
      current.overnights += Number(row.overnights) || 0;
      tourismMap.set(row.country, current);
    });
    const webTop = [...webMap.values()].sort((a,b) => b.sessions - a.sessions).slice(0,7);
    const tourismTop = [...tourismMap.values()].sort((a,b) => b.overnights - a.overnights).slice(0,7);
    const countries = new Set([...webTop.map(row => row.country), ...tourismTop.map(row => row.country)]);
    return [...countries].map(country => ({
      country,
      sessions: webMap.get(country)?.sessions ?? null,
      guests: tourismMap.get(country)?.guests ?? null,
      overnights: tourismMap.get(country)?.overnights ?? null
    })).sort((a,b) => Math.max(b.sessions || 0, b.overnights || 0) - Math.max(a.sessions || 0, a.overnights || 0)).slice(0,10);
  }

  function renderWebCountryComparison() {
    const row = latestFullComparableMonth();
    const body = $('webCountryComparisonBody');
    if (!row) {
      $('webCountryComparisonContext').textContent = 'ni polnega skupnega meseca';
      body.innerHTML = '<tr><td colspan="4">Primerjava trgov še ni mogoča.</td></tr>';
      $('webCountryComparisonInsight').innerHTML = '<p>Potrebujemo najmanj en polni skupni mesec.</p>';
      return;
    }
    const records = countryComparisonRows(row.web.month);
    $('webCountryComparisonContext').textContent = webMonthLabel(row.web.month);
    body.innerHTML = records.map(item => `<tr><td>${escapeWebHtml(item.country)}</td><td>${item.sessions == null ? '–' : integer.format(item.sessions)}</td><td>${item.guests == null ? '–' : integer.format(item.guests)}</td><td>${item.overnights == null ? '–' : integer.format(item.overnights)}</td></tr>`).join('');

    const topWebForeign = records.filter(item => item.country !== 'Slovenija' && item.sessions != null).sort((a,b) => b.sessions - a.sessions)[0];
    const topTourismForeign = records.filter(item => item.country !== 'Slovenija' && item.overnights != null).sort((a,b) => b.overnights - a.overnights)[0];
    const overlap = records.filter(item => item.sessions != null && item.overnights != null && item.country !== 'Slovenija').sort((a,b) => (b.sessions + b.overnights) - (a.sessions + a.overnights)).slice(0,3);
    $('webCountryComparisonInsight').innerHTML = `<p>Najmočnejši tuji spletni trg je <strong>${escapeWebHtml(topWebForeign?.country || '–')}</strong>${topWebForeign ? ` (${integer.format(topWebForeign.sessions)} sej)` : ''}, največ tujih nočitev med prikazanimi trgi pa ustvari <strong>${escapeWebHtml(topTourismForeign?.country || '–')}</strong>${topTourismForeign ? ` (${integer.format(topTourismForeign.overnights)} nočitev)` : ''}.</p>${overlap.length ? `<p>V obeh virih so vidni predvsem <strong>${overlap.map(item => escapeWebHtml(item.country)).join(', ')}</strong>; to je signal za nadaljnje spremljanje, ne dokaz konverzije.</p>` : ''}`;
  }

  function marketLagResult(country, lag) {
    const webByMonth = new Map();
    ga4.countries.records.forEach(row => {
      if (!webCoverage(row.month)?.complete) return;
      const normalized = webCountryNames[row.country] || row.country;
      if (normalized !== country) return;
      webByMonth.set(row.month, (webByMonth.get(row.month) || 0) + (Number(row.sessions) || 0));
    });
    const nightsByMonth = new Map();
    markets.records.forEach(row => {
      if (row.country !== country || Number(row.overnights) < 0) return;
      nightsByMonth.set(row.month, (nightsByMonth.get(row.month) || 0) + (Number(row.overnights) || 0));
    });
    const pairs = [...webByMonth.entries()].map(([month, sessions]) => ({sessions, nights:nightsByMonth.get(addMonths(month, lag))})).filter(row => row.nights != null);
    return {country, lag, n:pairs.length, r:pearson(pairs.map(row => row.sessions), pairs.map(row => row.nights))};
  }

  function renderWebLagAnalysis() {
    const latest = latestFullComparableMonth();
    const status = $('webLagStatus');
    const target = $('webLagInsight');
    if (!latest) {
      status.textContent = 'ni podatkov';
      target.innerHTML = '<p>Ni polnega skupnega meseca.</p>';
      return;
    }
    const countries = countryComparisonRows(latest.web.month).filter(item => item.sessions != null && item.overnights != null && item.country !== 'Slovenija').slice(0,5).map(item => item.country);
    const results = countries.flatMap(country => [0,1,2,3].map(lag => marketLagResult(country, lag)));
    const maxPairs = Math.max(0, ...results.map(result => result.n));
    const ready = results.filter(result => result.n >= 12 && result.r != null);
    if (!ready.length) {
      status.textContent = `${maxPairs}/12 mesecev`;
      status.className = 'readiness-status';
      target.innerHTML = `<p>Analiza je pripravljena za zamike 0–3 mesece, vendar ima posamezni trg trenutno največ <strong>${maxPairs} poln skupni mesec</strong>.</p><p>Za prvi opisni izračun potrebujemo najmanj 12, za stabilnejšo oceno pa 24 mesecev.</p>`;
      return;
    }
    status.textContent = 'izračunano';
    status.className = 'readiness-status ready';
    const best = [...ready].sort((a,b) => Math.abs(b.r) - Math.abs(a.r)).slice(0,3);
    target.innerHTML = best.map(item => `<p><strong>${escapeWebHtml(item.country)}</strong>: najmočnejša povezava pri zamiku ${item.lag} ${item.lag === 1 ? 'mesec' : item.lag === 2 ? 'meseca' : 'mesecev'}, r = ${decimal.format(item.r)} (n=${item.n}).</p>`).join('') + '<p>Korelacija je opisna in ne dokazuje, da je spletni obisk povzročil nočitev.</p>';
  }

  function renderWebContentByCountry() {
    const status = $('webContentCountryStatus');
    const target = $('webContentCountryInsight');
    const supportsCountryPages = Boolean(ga4?.pages?.records?.length && ga4.pages.records.some(row => row.country));
    if (!supportsCountryPages) {
      status.textContent = 'potreben dodaten izvoz';
      status.className = 'readiness-status needs-data';
      target.innerHTML = '<p>Trenutni izvoz strani in izvoz držav sta ločena, zato ju ni dovoljeno združiti po občutku.</p><p>Potrebujemo GA4 izvoz z dimenzijami <strong>Year, Month, Country, Page path in Page title</strong> ter metriko Views oziroma Sessions.</p>';
      return;
    }
    status.textContent = 'izračunano';
    status.className = 'readiness-status ready';
    target.innerHTML = '<p>Podatki za vsebine po državah so na voljo in se prikažejo ob naslednji razširitvi podatkovnega prikaza.</p>';
  }

  function renderWebSeasonality() {
    const status = $('webSeasonalityStatus');
    const target = $('webSeasonalityInsight');
    const rows = comparableWebMonths().filter(row => row.coverage?.complete);
    if (rows.length < 12) {
      status.textContent = `${rows.length}/12 mesecev`;
      status.className = 'readiness-status';
      target.innerHTML = `<p>Trenutno je na voljo <strong>${rows.length} poln skupni mesec</strong>, zato spletne sezonskosti še ni mogoče primerjati s sezonskostjo gostov in nočitev.</p><p>Izračun bo smiseln pri najmanj 12 polnih mesecih, bolje pri 24.</p>`;
      return;
    }
    const grouped = Array.from({length:12}, () => ({sessions:[], guests:[], nights:[]}));
    rows.forEach(row => {
      const group = grouped[monthOf(row.web.month) - 1];
      group.sessions.push(row.web.sessions);
      group.guests.push(row.tourism.guests);
      group.nights.push(row.tourism.overnights);
    });
    const profile = grouped.map((group, index) => ({
      month:index,
      sessions:group.sessions.length ? group.sessions.reduce((a,b)=>a+b,0)/group.sessions.length : 0,
      guests:group.guests.length ? group.guests.reduce((a,b)=>a+b,0)/group.guests.length : 0,
      nights:group.nights.length ? group.nights.reduce((a,b)=>a+b,0)/group.nights.length : 0
    }));
    const webGuestR = pearson(profile.map(row => row.sessions), profile.map(row => row.guests));
    const webNightR = pearson(profile.map(row => row.sessions), profile.map(row => row.nights));
    const webPeak = profile.reduce((a,b) => b.sessions > a.sessions ? b : a);
    const nightPeak = profile.reduce((a,b) => b.nights > a.nights ? b : a);
    status.textContent = 'izračunano';
    status.className = 'readiness-status ready';
    target.innerHTML = `<p>Vrh spletnega zanimanja je v mesecu <strong>${monthNames[webPeak.month]}</strong>, vrh nočitev pa v mesecu <strong>${monthNames[nightPeak.month]}</strong>.</p><p>Povezava mesečnega profila: seje–gostje r = <strong>${decimal.format(webGuestR)}</strong>, seje–nočitve r = <strong>${decimal.format(webNightR)}</strong>.</p><p>Gre za opis sezonskega vzorca, ne za vzročnost.</p>`;
  }

  function renderWebTourismComparison() {
    const section = $('webComparisonSection');
    if (!section) return;
    if (!ga4) {
      section.innerHTML = '<div class="source-notice"><strong>Napaka:</strong> podatkovna datoteka Google Analytics 4 ni bila pravilno naložena.</div>';
      return;
    }
    const fullCount = comparableWebMonths().filter(row => row.coverage?.complete).length;
    $('webComparisonSummary').textContent = `GA4 izvoz zajema 25. maj–24. julij 2026; maj in julij sta delna meseca. Turistični podatki segajo do junija 2026, zato je trenutno na voljo ${fullCount} poln skupni mesec. Spletne seje niso fizični obisk, turistične evidence pa ne zajemajo dnevnih obiskovalcev.`;
    renderWebMonthlyComparison();
    renderWebCountryComparison();
    renderWebLagAnalysis();
    renderWebContentByCountry();
    renderWebSeasonality();
  }


  populatePeriodSelect();
  populateScenarioControls();
  renderOverview();
  renderMarketAnalysis();
  renderSlovenianAnalysis();
  renderScenario();
  renderWebTourismComparison();
})();

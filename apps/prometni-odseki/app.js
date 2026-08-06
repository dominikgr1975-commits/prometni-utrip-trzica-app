(function () {
  "use strict";

  const registry = window.PROMETNI_ODSEKI_REGISTRY;
  const store = window.PROMETNI_ODSEKI_DATA;
  if (!registry || !store) return;

  const fmt0 = new Intl.NumberFormat("sl-SI", { maximumFractionDigits: 0 });
  const fmt1 = new Intl.NumberFormat("sl-SI", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const fmt2 = new Intl.NumberFormat("sl-SI", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const colors = {
    1: "#087b78",
    0: "#e48a2b",
    grid: "#dce6e8",
    text: "#18363b",
    muted: "#60757a",
    types: ["#087b78", "#2576b8", "#e48a2b", "#7e5aa6", "#8a9ca0"]
  };

  const state = {
    section: registry.sections.find(s => s.status === "active")?.id || "",
    period: "all",
    direction: "both",
    speedMode: "count",
    profileMode: "directions"
  };

  let data = null;
  let directionMeta = null;
  let validDateSet = null;
  let completeRecords = null;

  const sectionSelect = document.getElementById("sectionSelect");
  const periodSelect = document.getElementById("periodSelect");
  const directionSelect = document.getElementById("directionSelect");

  initSectionOptions();
  activateSection(state.section);
  bindControls();
  renderAll();

  function initSectionOptions() {
    sectionSelect.innerHTML = registry.sections.map(section => {
      const disabled = section.status !== "active" ? " disabled" : "";
      const suffix = section.status === "planned" ? " — v pripravi" : "";
      return `<option value="${escapeHtml(section.id)}"${disabled}>${escapeHtml(section.title)}${suffix}</option>`;
    }).join("");
    sectionSelect.value = state.section;
  }

  function activateSection(sectionId) {
    const section = registry.sections.find(item => item.id === sectionId && item.status === "active");
    if (!section || !store[section.dataKey]) return;
    state.section = sectionId;
    data = store[section.dataKey];
    directionMeta = data.section.directions;
    validDateSet = new Set(data.validDates);
    completeRecords = data.records.filter(record => record.status === "complete" && validDateSet.has(record.date));
    state.period = "all";
    state.direction = "both";
    rebuildPeriodOptions();
    rebuildDirectionOptions();
    renderSectionStatic();
  }

  function rebuildPeriodOptions() {
    const years = [...new Set(data.validDates.map(date => date.slice(0, 4)))].sort();
    const firstYear = data.validDates[0]?.slice(0, 4);
    const lastYear = data.validDates[data.validDates.length - 1]?.slice(0, 4);
    periodSelect.innerHTML = [
      `<option value="all">Celotno primerljivo obdobje</option>`,
      `<option value="12m">Zadnjih 12 mesecev</option>`,
      ...years.map(year => `<option value="${year}">${year}${year === firstYear || year === lastYear ? " — delno leto" : ""}</option>`)
    ].join("");
    periodSelect.value = "all";
  }

  function rebuildDirectionOptions() {
    directionSelect.innerHTML = [
      `<option value="both">Obe smeri</option>`,
      `<option value="1">${escapeHtml(directionMeta["1"].label)} — direction 1</option>`,
      `<option value="0">${escapeHtml(directionMeta["0"].label)} — direction 0</option>`
    ].join("");
    directionSelect.value = "both";
  }

  function bindControls() {
    sectionSelect.addEventListener("change", () => {
      activateSection(sectionSelect.value);
      renderAll();
    });
    periodSelect.addEventListener("change", () => {
      state.period = periodSelect.value;
      renderAll();
    });
    directionSelect.addEventListener("change", () => {
      state.direction = directionSelect.value;
      renderAll();
    });
    document.querySelectorAll("[data-speed-mode]").forEach(button => {
      button.addEventListener("click", () => {
        state.speedMode = button.dataset.speedMode;
        document.querySelectorAll("[data-speed-mode]").forEach(b => b.classList.toggle("active", b === button));
        renderSpeedDistribution();
      });
    });
    document.querySelectorAll("[data-profile-mode]").forEach(button => {
      button.addEventListener("click", () => {
        state.profileMode = button.dataset.profileMode;
        document.querySelectorAll("[data-profile-mode]").forEach(b => b.classList.toggle("active", b === button));
        renderTrafficProfile();
      });
    });
  }

  function renderSectionStatic() {
    const section = data.section;
    const display = section.display || {};
    setText("heroLead", display.lead || `Analiza odseka ${section.title}.`);
    setText("heroSnapshot", `● Podatki niso v realnem času · primerljivo obdobje ${formatDate(section.comparisonPeriod.from)}–${formatDate(section.comparisonPeriod.to)}`);
    setText("panelKicker", display.panelKicker || "PROMETNI ODSEK");
    setText("locationTitle", section.title);
    setText("locationDescription", `${section.road} · naprava ${section.measurementDevice} · omejitev ${section.speedLimitKmh} km/h`);
    setText("schemeLeft", display.schemeLeft || directionMeta["1"].route.split("→")[1]?.trim() || "Smer 1");
    setText("schemeRight", display.schemeRight || directionMeta["0"].route.split("→")[1]?.trim() || "Smer 0");
    setText("directionCaptionLeft", display.directionCaptionLeft || `direction 1 · ${directionMeta["1"].label.toLowerCase()}`);
    setText("directionCaptionRight", display.directionCaptionRight || `direction 0 · ${directionMeta["0"].label.toLowerCase()}`);
    const mapLink = document.getElementById("mapLink");
    mapLink.href = section.mapUrl;

    document.getElementById("thresholdDirection1").innerHTML = `${escapeHtml(directionMeta["1"].label)}<br><small>direction 1</small>`;
    document.getElementById("thresholdDirection0").innerHTML = `${escapeHtml(directionMeta["0"].label)}<br><small>direction 0</small>`;

    const cards = display.contextCards || [];
    document.getElementById("contextGrid").innerHTML = cards.map(card => `<article class="${escapeHtml(card.className || "")}"><span class="context-icon">${escapeHtml(card.icon)}</span><strong>${escapeHtml(card.title)}</strong><p>${escapeHtml(card.text)}</p></article>`).join("");
    const report = document.getElementById("residentReport");
    if (display.residentReport) {
      report.innerHTML = display.residentReport;
      report.hidden = false;
    } else {
      report.innerHTML = "";
      report.hidden = true;
    }

    renderMethodology();
    renderSources();
  }

  function renderMethodology() {
    const n = data.normalization;
    const excluded = data.section.comparisonPeriod.excludedDates.map(item => `${formatDate(item.date)} (${item.reason})`).join("; ");
    const highSpeedText = data.section.atLeast100IsLowerBound
      ? n.atLeast100
      : n.atLeast100;
    const cards = [
      ["Potrjeni smeri", `${escapeHtml(n.directionValidation.result)} Preslikava je potrjena s kontrolnim izvozom naprave in 100-odstotnim ujemanjem ${fmt0.format(n.directionValidation.validation.filename_direction_0.intervalCount)} intervalov.`],
      ["Popravljena pripadnost izvozov", escapeHtml(n.directionValidation.speedExportCorrection)],
      ["Povprečna hitrost", escapeHtml(n.averageSpeed)],
      ["P85 za daljše obdobje", escapeHtml(n.p85)],
      [data.section.atLeast100IsLowerBound ? "Najmanj 100 km/h ali več" : "100 km/h ali več", escapeHtml(highSpeedText)],
      ["Nepopolni in manjkajoči podatki", `${escapeHtml(n.partialAndMissing)} Izključeno: ${escapeHtml(excluded)}.`],
      ["Radar ni avtomatičen sklep", "Podatki pokažejo pogostost in intenzivnost prekoračitev. Odločitev o nadzoru ali drugih ukrepih mora upoštevati še nesreče, terensko presojo, signalizacijo in pristojnosti upravljavca ceste."]
    ];
    document.getElementById("methodGrid").innerHTML = cards.map(item => `<article><strong>${item[0]}</strong><p>${item[1]}</p></article>`).join("");
  }

  function renderSources() {
    const display = data.section.display || {};
    document.getElementById("sourceGrid").innerHTML = [
      ["Elastic/Kibana", "12-urni promet, povprečna in najvišja hitrost, intervalni P85, pragovi prekoračitev in kategorije vozil."],
      ["TC25 – neposredni izvoz", `Kontrolni podatki za ${directionMeta["1"].label.toLowerCase()} in ${directionMeta["0"].label.toLowerCase()} ter potrditev smeri in strukture vozil.`],
      ["Zemljevid in prostorski viri", display.sourceContext || "Lokacijski in prostorski kontekst odseka."]
    ].map(item => `<div><strong>${escapeHtml(item[0])}</strong><span>${escapeHtml(item[1])}</span></div>`).join("");
  }

  function renderAll() {
    renderStatus();
    renderKpis();
    renderInsights();
    renderSpeedDistribution();
    renderTrafficProfile();
    renderThresholdTable();
  }

  function periodDates() {
    const allDates = data.validDates;
    if (state.period === "all") return allDates;
    if (state.period === "12m") {
      const last = parseDate(allDates[allDates.length - 1]);
      const from = new Date(last);
      from.setFullYear(from.getFullYear() - 1);
      from.setDate(from.getDate() + 1);
      return allDates.filter(date => parseDate(date) >= from);
    }
    return allDates.filter(date => date.startsWith(state.period + "-"));
  }

  function selectedDirections() {
    return state.direction === "both" ? [1, 0] : [Number(state.direction)];
  }

  function recordsFor(directions, dates) {
    const dateSet = new Set(dates);
    return completeRecords.filter(record => directions.includes(record.direction) && dateSet.has(record.date));
  }

  function calculateStats(directions, dates) {
    const records = recordsFor(directions, dates);
    const vehicles = sum(records, record => record.vehicles);
    const days = dates.length;
    const types = {};
    data.vehicleTypeOrder.forEach(type => { types[type] = sum(records, record => record.vehicleTypes[type] || 0); });
    return {
      records,
      days,
      vehicles,
      vehiclesPerDay: days ? vehicles / days : 0,
      averageSpeed: vehicles ? sum(records, record => record.vehicles * record.averageSpeed) / vehicles : 0,
      p85: vehicles ? sum(records, record => record.vehicles * record.p85Interval) / vehicles : 0,
      maxSpeed: records.length ? Math.max(...records.map(record => record.maxSpeed || 0)) : 0,
      over50: sum(records, record => record.over50),
      over60: sum(records, record => record.over60),
      over70: sum(records, record => record.over70),
      over80: sum(records, record => record.over80),
      over90: sum(records, record => record.over90),
      atLeast100: sum(records, record => record.atLeast100 || 0),
      vehicleTypes: types
    };
  }

  function renderStatus() {
    const dates = periodDates();
    const first = dates[0];
    const last = dates[dates.length - 1];
    const directionLabel = state.direction === "both" ? "obe smeri" : directionMeta[state.direction].label.toLowerCase();
    document.getElementById("periodStatus").textContent = dates.length
      ? `${formatDate(first)}–${formatDate(last)} · ${fmt0.format(dates.length)} popolnih dni · ${directionLabel}`
      : "Za izbrano obdobje ni popolnih dni.";
    const validation = data.normalization.directionValidation.validation.filename_direction_0;
    const excludedCount = data.section.comparisonPeriod.excludedDates.length;
    const highSpeedNote = data.section.atLeast100IsLowerBound ? " Stolpec ≥100 km/h je prikazan kot najmanjše dokazano število." : "";
    document.getElementById("dataWarning").innerHTML = `<strong>Kontrola kakovosti:</strong> ${fmt0.format(excludedCount)} nepopolnih oziroma manjkajočih dni je izločenih iz primerljivih izračunov. Smeri hitrostnih izvozov so preslikane po 100-odstotnem ujemanju vseh ${fmt0.format(validation.intervalCount)} skupnih intervalov.${highSpeedNote}`;
  }

  function renderKpis() {
    const stats = calculateStats(selectedDirections(), periodDates());
    setText("kpiTotal", fmt0.format(stats.vehicles));
    setText("kpiTotalNote", `${fmt0.format(stats.days)} popolnih dni`);
    setText("kpiDaily", fmt0.format(stats.vehiclesPerDay));
    setText("kpiAvgSpeed", `${fmt1.format(stats.averageSpeed)} km/h`);
    setText("kpiP85", `${fmt1.format(stats.p85)} km/h`);
    setText("kpiMax", `${fmt0.format(stats.maxSpeed)} km/h`);
    setText("kpiOver50", `${fmt0.format(stats.over50)} · ${fmt2.format(percent(stats.over50, stats.vehicles))} %`);
    setText("kpiOver50Note", `${fmt1.format(stats.over50 / Math.max(1, stats.days))} vozila na dan`);
  }

  function renderInsights() {
    const dates = periodDates();
    const both = calculateStats([1, 0], dates);
    const stats1 = calculateStats([1], dates);
    const stats0 = calculateStats([0], dates);
    const active = calculateStats(selectedDirections(), dates);
    const personal = active.vehicleTypes["Osebni avtomobil"] || 0;
    const combined = active.vehicleTypes["Kombinirano vozilo"] || 0;
    const heavy = (active.vehicleTypes["Težje tovorno vozilo"] || 0) + (active.vehicleTypes["Tovorno vozilo s prikolico"] || 0);

    const selectedDescription = state.direction === "both"
      ? `Na odseku je bilo v povprečju zaznanih <strong>${fmt0.format(both.vehiclesPerDay)} vozil na dan</strong>. ${directionMeta["1"].label}: ${fmt0.format(stats1.vehiclesPerDay)}, ${directionMeta["0"].label}: ${fmt0.format(stats0.vehiclesPerDay)} vozil na dan.`
      : `V izbrani smeri je bilo v povprečju zaznanih <strong>${fmt0.format(active.vehiclesPerDay)} vozil na dan</strong>. Osebni avtomobili predstavljajo ${fmt1.format(percent(personal, active.vehicles))} %, kombinirana in težja tovorna vozila pa ${fmt1.format(percent(combined + heavy, active.vehicles))} % prometa.`;

    const fasterDirection = stats1.averageSpeed >= stats0.averageSpeed ? 1 : 0;
    const slowerDirection = fasterDirection === 1 ? 0 : 1;
    const fastStats = fasterDirection === 1 ? stats1 : stats0;
    const slowStats = slowerDirection === 1 ? stats1 : stats0;
    const comparisonText = `${directionMeta[String(fasterDirection)].label} ima višjo prometno uteženo povprečno hitrost: <strong>${fmt1.format(fastStats.averageSpeed)} km/h</strong> in intervalni P85 ${fmt1.format(fastStats.p85)} km/h. V nasprotni smeri znašata ${fmt1.format(slowStats.averageSpeed)} in ${fmt1.format(slowStats.p85)} km/h. Razlika povprečnih hitrosti je ${fmt1.format(Math.abs(stats1.averageSpeed - stats0.averageSpeed))} km/h.`;

    const morning1 = profileAverage(1, dates, [0, 1, 2, 3, 4], 0);
    const morning0 = profileAverage(0, dates, [0, 1, 2, 3, 4], 0);
    const afternoon1 = profileAverage(1, dates, [0, 1, 2, 3, 4], 12);
    const afternoon0 = profileAverage(0, dates, [0, 1, 2, 3, 4], 12);
    const morningDirection = morning1 >= morning0 ? 1 : 0;
    const afternoonDirection = afternoon1 >= afternoon0 ? 1 : 0;
    const timingText = `Ob delavnikih je v prvi polovici dneva močnejši tok ${directionMeta[String(morningDirection)].label.toLowerCase()} (${fmt0.format(Math.max(morning1, morning0))} vozil na 12 ur), v drugi polovici pa ${directionMeta[String(afternoonDirection)].label.toLowerCase()} (${fmt0.format(Math.max(afternoon1, afternoon0))}). Podatki kažejo časovni vzorec, ne namena posamezne poti.`;

    const share1 = percent(stats1.over50, stats1.vehicles);
    const share0 = percent(stats0.over50, stats0.vehicles);
    const display = data.section.display || {};
    const safetyText = `${directionMeta["1"].label}: <strong>${fmt0.format(stats1.over50)} vozil (${fmt2.format(share1)} %)</strong> nad 50 km/h; ${directionMeta["0"].label}: ${fmt0.format(stats0.over50)} vozil (${fmt2.format(share0)} %). Ker gre za ${escapeHtml(display.safetyContextShort || "naseljeno cestno okolje")}, podatki podpirajo nadaljnjo strokovno presojo nadzora ali drugih ukrepov. Sami po sebi ne pomenijo avtomatične odločitve za radar.`;

    document.getElementById("insightGrid").innerHTML = [
      insightCard("1", "Obseg in sestava", selectedDescription),
      insightCard("2", "Razlika med smerema in časom", `${comparisonText} ${timingText}`),
      insightCard("3", "Prometnovarnostna razlaga", safetyText)
    ].join("");
  }

  function renderSpeedDistribution() {
    const dates = periodDates();
    const series = selectedDirections().map(direction => ({
      direction,
      label: directionMeta[String(direction)].label,
      color: colors[direction],
      stats: calculateStats([direction], dates)
    }));

    document.getElementById("complianceBars").innerHTML = series.map(item => {
      const over = percent(item.stats.over50, item.stats.vehicles);
      const ok = Math.max(0, 100 - over);
      return `<div class="compliance-item"><div class="compliance-head"><strong>${escapeHtml(item.label)}</strong><span>${fmt0.format(item.stats.vehicles)} vozil</span></div><div class="compliance-track"><span class="compliance-ok" style="width:${ok}%"></span><span class="compliance-over" style="width:${over}%"></span></div><div class="compliance-foot"><span>≤ 50 km/h: ${fmt1.format(ok)} %</span><span>&gt; 50 km/h: ${fmt2.format(over)} %</span></div></div>`;
    }).join("");

    const lowerBound = Boolean(data.section.atLeast100IsLowerBound);
    const bands = lowerBound
      ? [
          { label: "51–60", key: "band51to60" },
          { label: "61–70", key: "band61to70" },
          { label: "71–80", key: "band71to80" },
          { label: "81–90", key: "band81to90" },
          { label: "nad 90", key: "band90plus" }
        ]
      : [
          { label: "51–60", key: "band51to60" },
          { label: "61–70", key: "band61to70" },
          { label: "71–80", key: "band71to80" },
          { label: "81–90", key: "band81to90" },
          { label: "91–99", key: "band91to99" },
          { label: "≥ 100", key: "band100plus" }
        ];

    series.forEach(item => {
      const s = item.stats;
      item.values = {
        band51to60: Math.max(0, s.over50 - s.over60),
        band61to70: Math.max(0, s.over60 - s.over70),
        band71to80: Math.max(0, s.over70 - s.over80),
        band81to90: Math.max(0, s.over80 - s.over90),
        band90plus: s.over90,
        band91to99: Math.max(0, s.over90 - s.atLeast100),
        band100plus: s.atLeast100
      };
    });

    const width = 980;
    const left = 112;
    const right = 120;
    const top = 60;
    const rowHeight = 49;
    const bottom = 48;
    const height = top + bands.length * rowHeight + bottom;
    const plotWidth = width - left - right;
    const values = state.speedMode === "share"
      ? series.flatMap(item => bands.map(band => percent(item.values[band.key], item.stats.vehicles)))
      : series.flatMap(item => bands.map(band => item.values[band.key]));
    const maxRaw = Math.max(1, ...values);
    const maxLinear = state.speedMode === "share" ? niceMax(maxRaw * 1.12) : maxRaw;
    const scale = value => state.speedMode === "count"
      ? Math.log10(value + 1) / Math.log10(maxRaw + 1) * plotWidth
      : value / maxLinear * plotWidth;

    let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><title>Porazdelitev prekoračitev hitrosti</title>`;
    const ticks = state.speedMode === "count" ? logTicks(maxRaw) : linearTicks(maxLinear, 5);
    ticks.forEach(tick => {
      const x = left + scale(tick);
      svg += `<line class="chart-grid" x1="${x}" y1="${top - 10}" x2="${x}" y2="${height - bottom + 5}"/><text class="chart-axis" x="${x}" y="${height - 15}" text-anchor="middle">${state.speedMode === "count" ? compact(tick) : fmt1.format(tick) + " %"}</text>`;
    });
    series.forEach((item, index) => {
      const x = left + index * 190;
      svg += `<rect x="${x}" y="18" width="13" height="13" rx="3" fill="${item.color}"/><text class="chart-legend" x="${x + 19}" y="29">${escapeHtml(item.label)}</text>`;
    });
    bands.forEach((band, bandIndex) => {
      const yCenter = top + bandIndex * rowHeight + 19;
      svg += `<text class="chart-label" x="${left - 15}" y="${yCenter + 4}" text-anchor="end">${escapeHtml(band.label)} km/h</text>`;
      const barHeight = series.length === 1 ? 21 : 15;
      series.forEach((item, seriesIndex) => {
        const raw = item.values[band.key];
        const value = state.speedMode === "share" ? percent(raw, item.stats.vehicles) : raw;
        const barY = series.length === 1 ? yCenter - barHeight / 2 : yCenter - 17 + seriesIndex * 18;
        const visibleWidth = raw > 0 ? Math.max(2, scale(value)) : 0;
        svg += `<rect class="chart-bar" x="${left}" y="${barY}" width="${visibleWidth}" height="${barHeight}" fill="${item.color}"><title>${escapeHtml(item.label)} · ${escapeHtml(band.label)} km/h: ${fmt0.format(raw)} vozil (${fmt2.format(percent(raw, item.stats.vehicles))} %)</title></rect>`;
        svg += `<text class="chart-value" x="${Math.min(width - 8, left + visibleWidth + 8)}" y="${barY + barHeight - 3}">${state.speedMode === "share" ? fmt2.format(value) + " %" : fmt0.format(raw)}</text>`;
      });
    });
    svg += `<text class="chart-title-small" x="${left}" y="${height - 2}">${state.speedMode === "count" ? "Logaritemska lestvica; oznake kažejo natančno število vozil." : "Delež vseh vozil v posamezni smeri."}</text></svg>`;
    document.getElementById("speedDistributionChart").innerHTML = svg;

    const baseNote = state.speedMode === "count"
      ? "Pri številu vozil je dolžina stolpcev logaritemska, da so hkrati vidne pogoste manjše prekoračitve in redki ekstremi. Napis ob stolpcu vedno prikazuje dejansko število."
      : "Deleži so izračunani glede na vsa vozila v posamezni smeri. Razredi se ne prekrivajo, zato je vsako vozilo vključeno samo enkrat.";
    document.getElementById("speedChartNote").textContent = lowerBound
      ? `${baseNote} Zaradi neustreznega izvornega stolpca ≥100 km/h graf združuje vse meritve nad 90 km/h; najmanjše dokazano število vozil ≥100 km/h je prikazano v spodnji tabeli.`
      : baseNote;
  }

  function renderTrafficProfile() {
    const dates = periodDates();
    if (state.profileMode === "directions") {
      renderDirectionProfile(dates);
      setText("profileExplainer", "Primerjava smeri po dnevih v tednu in polovicah dneva.");
    } else {
      renderVehicleTypeProfile(dates);
      setText("profileExplainer", state.direction === "both" ? "Struktura vseh vozil po kategorijah." : `Struktura vozil: ${directionMeta[state.direction].label.toLowerCase()}.`);
    }
  }

  function renderDirectionProfile(dates) {
    const buckets = profileBuckets();
    const series = selectedDirections().map(direction => ({
      direction,
      label: directionMeta[String(direction)].label,
      color: colors[direction],
      values: buckets.map(bucket => profileAverage(direction, dates, [bucket.day], bucket.hour))
    }));
    const width = 1040;
    const height = 420;
    const left = 64;
    const right = 26;
    const top = 62;
    const bottom = 78;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const maxValue = niceMax(Math.max(1, ...series.flatMap(item => item.values)) * 1.12);
    const groupWidth = plotWidth / buckets.length;
    const barWidth = Math.min(25, groupWidth * .31);

    let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><title>Dvanajsturni tedenski profil po smereh</title>`;
    linearTicks(maxValue, 5).forEach(tick => {
      const y = top + plotHeight - tick / maxValue * plotHeight;
      svg += `<line class="chart-grid" x1="${left}" y1="${y}" x2="${width - right}" y2="${y}"/><text class="chart-axis" x="${left - 10}" y="${y + 4}" text-anchor="end">${fmt0.format(tick)}</text>`;
    });
    series.forEach((item, index) => {
      const x = left + index * 210;
      svg += `<rect x="${x}" y="17" width="13" height="13" rx="3" fill="${item.color}"/><text class="chart-legend" x="${x + 19}" y="28">${escapeHtml(item.label)}</text>`;
    });
    buckets.forEach((bucket, bucketIndex) => {
      const center = left + groupWidth * bucketIndex + groupWidth / 2;
      series.forEach((item, seriesIndex) => {
        const value = item.values[bucketIndex];
        const h = value / maxValue * plotHeight;
        const offset = series.length === 1 ? 0 : (seriesIndex - (series.length - 1) / 2) * (barWidth + 4);
        const x = center + offset - barWidth / 2;
        const y = top + plotHeight - h;
        svg += `<rect class="chart-bar" x="${x}" y="${y}" width="${barWidth}" height="${h}" fill="${item.color}"><title>${escapeHtml(item.label)} · ${bucket.label}: ${fmt1.format(value)} vozil na 12 ur</title></rect>`;
      });
      svg += `<text class="chart-axis" x="${center}" y="${height - 48}" text-anchor="middle"><tspan x="${center}">${bucket.shortDay}</tspan><tspan x="${center}" dy="15">${bucket.hour === 0 ? "0–12" : "12–24"}</tspan></text>`;
    });
    svg += `<text class="chart-title-small" x="${left}" y="${height - 8}">Povprečno število vozil v popolnem 12-urnem intervalu.</text></svg>`;
    document.getElementById("trafficProfileChart").innerHTML = svg;
  }

  function renderVehicleTypeProfile(dates) {
    const buckets = profileBuckets();
    const directions = selectedDirections();
    const categories = [
      { label: "Osebni avtomobili", color: colors.types[0], keys: ["Osebni avtomobil"] },
      { label: "Enosledna vozila", color: colors.types[1], keys: ["Enosledno vozilo"] },
      { label: "Kombinirana vozila", color: colors.types[2], keys: ["Kombinirano vozilo"] },
      { label: "Tovorna vozila", color: colors.types[3], keys: ["Težje tovorno vozilo", "Tovorno vozilo s prikolico"] },
      { label: "Ostalo", color: colors.types[4], keys: ["Nerazpoznana vozila"] }
    ];
    const values = buckets.map(bucket => profileTypeAverage(directions, dates, bucket.day, bucket.hour, categories));
    const totals = values.map(row => row.reduce((a, b) => a + b, 0));
    const width = 1040;
    const height = 440;
    const left = 64;
    const right = 26;
    const top = 76;
    const bottom = 78;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const maxValue = niceMax(Math.max(1, ...totals) * 1.12);
    const groupWidth = plotWidth / buckets.length;
    const barWidth = Math.min(39, groupWidth * .64);

    let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><title>Dvanajsturni tedenski profil po vrstah vozil</title>`;
    linearTicks(maxValue, 5).forEach(tick => {
      const y = top + plotHeight - tick / maxValue * plotHeight;
      svg += `<line class="chart-grid" x1="${left}" y1="${y}" x2="${width - right}" y2="${y}"/><text class="chart-axis" x="${left - 10}" y="${y + 4}" text-anchor="end">${fmt0.format(tick)}</text>`;
    });
    categories.forEach((category, index) => {
      const x = left + (index % 3) * 205;
      const y = 17 + Math.floor(index / 3) * 21;
      svg += `<rect x="${x}" y="${y}" width="13" height="13" rx="3" fill="${category.color}"/><text class="chart-legend" x="${x + 19}" y="${y + 11}">${escapeHtml(category.label)}</text>`;
    });
    buckets.forEach((bucket, bucketIndex) => {
      const center = left + groupWidth * bucketIndex + groupWidth / 2;
      let accumulated = 0;
      values[bucketIndex].forEach((value, categoryIndex) => {
        const h = value / maxValue * plotHeight;
        const y = top + plotHeight - accumulated - h;
        svg += `<rect x="${center - barWidth / 2}" y="${y}" width="${barWidth}" height="${Math.max(0, h)}" fill="${categories[categoryIndex].color}"><title>${escapeHtml(categories[categoryIndex].label)} · ${bucket.label}: ${fmt1.format(value)} vozil na 12 ur</title></rect>`;
        accumulated += h;
      });
      svg += `<text class="chart-axis" x="${center}" y="${height - 48}" text-anchor="middle"><tspan x="${center}">${bucket.shortDay}</tspan><tspan x="${center}" dy="15">${bucket.hour === 0 ? "0–12" : "12–24"}</tspan></text>`;
    });
    svg += `<text class="chart-title-small" x="${left}" y="${height - 8}">Povprečno število vozil po kategorijah v popolnem 12-urnem intervalu.</text></svg>`;
    document.getElementById("trafficProfileChart").innerHTML = svg;
  }

  function renderThresholdTable() {
    const dates = periodDates();
    const stats1 = calculateStats([1], dates);
    const stats0 = calculateStats([0], dates);
    const total = calculateStats([1, 0], dates);
    const lowerBound = Boolean(data.section.atLeast100IsLowerBound);
    const rows = [
      { label: "Nad 50 km/h", key: "over50" },
      { label: "Nad 60 km/h", key: "over60" },
      { label: "Nad 70 km/h", key: "over70" },
      { label: "Nad 80 km/h", key: "over80" },
      { label: "Nad 90 km/h", key: "over90" },
      { label: lowerBound ? "Najmanj 100 km/h ali več" : "100 km/h ali več", key: "atLeast100", lowerBound }
    ];
    document.getElementById("thresholdTableBody").innerHTML = rows.map((row, index) => {
      const highlight = index >= 3 ? " highlight" : "";
      return `<tr><td><strong>${escapeHtml(row.label)}</strong>${row.lowerBound ? "<span>spodnja meja</span>" : ""}</td>${metricCell(stats1, row.key, highlight, state.direction === "1", row.lowerBound)}${metricCell(stats0, row.key, highlight, state.direction === "0", row.lowerBound)}${metricCell(total, row.key, highlight, state.direction === "both", row.lowerBound)}</tr>`;
    }).join("");
  }

  function metricCell(stats, key, extraClass, selected, lowerBound) {
    const value = stats[key] || 0;
    const share = percent(value, stats.vehicles);
    const daily = value / Math.max(1, stats.days);
    const prefix = lowerBound && value > 0 ? "≥" : "";
    return `<td class="metric-cell${extraClass}${selected ? " selected-cell" : ""}"><strong>${prefix}${fmt0.format(value)}</strong><span>${prefix}${fmt2.format(share)} % · ${prefix}${fmt2.format(daily)}/dan</span></td>`;
  }

  function profileBuckets() {
    const days = ["Ponedeljek", "Torek", "Sreda", "Četrtek", "Petek", "Sobota", "Nedelja"];
    const short = ["Pon", "Tor", "Sre", "Čet", "Pet", "Sob", "Ned"];
    const buckets = [];
    days.forEach((day, index) => [0, 12].forEach(hour => buckets.push({ day: index, hour, label: `${day} ${hour === 0 ? "0–12" : "12–24"}`, shortDay: short[index] })));
    return buckets;
  }

  function profileAverage(direction, dates, weekdays, hour) {
    const dateSet = new Set(dates);
    const rows = completeRecords.filter(record => record.direction === direction && record.hour === hour && dateSet.has(record.date) && weekdays.includes(weekdayIndex(record.date)));
    return rows.length ? sum(rows, record => record.vehicles) / rows.length : 0;
  }

  function profileTypeAverage(directions, dates, weekday, hour, categories) {
    const dateSet = new Set(dates);
    const daily = new Map();
    completeRecords.forEach(record => {
      if (!directions.includes(record.direction) || record.hour !== hour || !dateSet.has(record.date) || weekdayIndex(record.date) !== weekday) return;
      if (!daily.has(record.date)) daily.set(record.date, categories.map(() => 0));
      const row = daily.get(record.date);
      categories.forEach((category, index) => {
        row[index] += category.keys.reduce((acc, key) => acc + (record.vehicleTypes[key] || 0), 0);
      });
    });
    const values = categories.map(() => 0);
    daily.forEach(row => row.forEach((value, index) => { values[index] += value; }));
    return values.map(value => daily.size ? value / daily.size : 0);
  }

  function weekdayIndex(date) {
    const day = parseDate(date).getDay();
    return day === 0 ? 6 : day - 1;
  }

  function insightCard(number, title, body) {
    return `<article class="insight-card"><div class="insight-number">${number}</div><h3>${escapeHtml(title)}</h3><p>${body}</p></article>`;
  }

  function sum(items, getter) {
    return items.reduce((acc, item) => acc + (Number(getter(item)) || 0), 0);
  }

  function percent(part, total) {
    return total ? part / total * 100 : 0;
  }

  function parseDate(value) {
    return new Date(value + "T12:00:00");
  }

  function formatDate(value) {
    const [year, month, day] = value.split("-");
    return `${Number(day)}. ${Number(month)}. ${year}`;
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function compact(value) {
    if (value >= 1000000) return `${fmt1.format(value / 1000000)} mio`;
    if (value >= 1000) return `${fmt0.format(value / 1000)}k`;
    return fmt0.format(value);
  }

  function niceMax(value) {
    if (!Number.isFinite(value) || value <= 0) return 1;
    const power = Math.pow(10, Math.floor(Math.log10(value)));
    const normalized = value / power;
    const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return nice * power;
  }

  function linearTicks(max, count) {
    const ticks = [];
    for (let i = 0; i <= count; i += 1) ticks.push(max * i / count);
    return ticks;
  }

  function logTicks(max) {
    const ticks = [0];
    let value = 1;
    while (value <= max) {
      ticks.push(value);
      value *= 10;
    }
    if (ticks[ticks.length - 1] < max) ticks.push(max);
    return [...new Set(ticks)];
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>\"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;" }[char]));
  }
})();

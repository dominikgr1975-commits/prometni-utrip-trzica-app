const nf0 = new Intl.NumberFormat('sl-SI', { maximumFractionDigits: 0, useGrouping: true });
const nf1 = new Intl.NumberFormat('sl-SI', { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: true });
const nf2 = new Intl.NumberFormat('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true });
const money = new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true });
const signed = (v, unit='') => `${v >= 0 ? '+' : ''}${nf1.format(v)}${unit}`;
const clamp = (v,min,max)=>Math.min(max,Math.max(min,v));
let A;

async function init(){
  A = await fetch('./data/analysis.json?v=0.52').then(r=>{if(!r.ok) throw new Error('analysis.json'); return r.json();});
  renderKpis(); renderInputs(); bind(); renderInsights(); renderCharts(); updateAll();
}
function formatMonth(ym){const [y,m]=ym.split('-');return `${m}. ${y}`;}
function renderKpis(){
  const k=A.kpis, e=A.employment;
  const items=[
    ['Povprečno vozil na dan',nf0.format(k.avgDailyTraffic),`CABLEX · ${k.trafficYears}-letni tedenski podatki · glavna cesta proti mestu`],
    ['Povprečna zasedenost',`${nf1.format(k.parkingAvg)} %`,'7 parkirišč okoli mestnega jedra · kapacitetno uteženo'],
    ['Skupna kapaciteta',nf0.format(k.totalParkingCapacity),'7 spremljanih parkirišč'],
    [`Delovno aktivni ${formatMonth(k.employmentLatestMonth)}`,nf0.format(k.employmentLatest),'delovno mesto v Občini Tržič · SURS'],
    ['Povprečna temperatura',`${nf1.format(k.averageTemperature)} °C`,`${nf0.format(k.rainDays)} dni z zaznanim dežjem`],
    [`Prebivalci mesta Tržič ${k.populationLatestYear}`,nf0.format(k.populationLatest),'samo naselje Tržič · ne celotna občina'],
    ['EasyPark parkirnine 2026',nf0.format(k.easyParkTransactions2026),`${money.format(k.easyParkRevenue2026)} do julija 2026`],
    ['Povprečna hitrost CABLEX',`${nf1.format(k.averageSpeed)} km/h`,'tehtano glede na strukturo vozil']
  ];
  document.querySelector('#kpiGrid').innerHTML=items.map(x=>`<div class="kpi"><span>${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></div>`).join('');
}
function parkingNames(){ return ['VSA PARKIRIŠČA', ...Object.keys(A.models.parkingByName).filter(n=>n!=='VSA PARKIRIŠČA')]; }
function renderInputs(){
  const names=parkingNames();
  ['parkingSelect','weatherParkingSelect','employeeParkingSelect','populationParkingSelect'].forEach(id=>{
    const el=document.querySelector('#'+id); el.innerHTML=''; names.forEach(n=>el.add(new Option(n,n))); el.value='VSA PARKIRIŠČA';
  });
  const hp=document.querySelector('#hourlyParkingSelect'); hp.innerHTML='';
  Object.keys(A.parkingHourly.profiles).forEach(n=>hp.add(new Option(n.replace(', Tržič',''),n)));
  hp.value='Zdravstveni dom, Tržič';
}
function bind(){
  ['trafficSlider','parkingSelect','weatherSlider','weatherParkingSelect','employeeSlider','employeeParkingSlider','employeeParkingSelect','populationSlider','populationParkingSelect','paymentSlider','hourlyParkingSelect'].forEach(id=>document.querySelector('#'+id).addEventListener('input',updateAll));
  document.querySelector('#questionForm').addEventListener('submit',e=>{e.preventDefault(); answerQuestion(document.querySelector('#questionInput').value);});
  document.querySelectorAll('[data-question]').forEach(b=>b.addEventListener('click',()=>{document.querySelector('#questionInput').value=b.dataset.question;answerQuestion(b.dataset.question);}));
}
function updateAll(){ updateTraffic(); updateWeather(); updateEmployees(); updateEmployeeParking(); updatePopulation(); updatePayments(); updateHourly(); }
function confidenceScore(r2,n,type='model'){
  if(type==='employee') return 52;
  if(type==='population') return 38;
  if(type==='payments') return 72;
  let score=30+Math.min(25,n*.7)+Math.min(35,Math.max(0,r2)*55);
  return Math.round(clamp(score,25,88));
}
function confidenceLabel(score){return score>=75?'višja':score>=55?'srednja':'nižja';}
function confidenceBox(score,note){return `<div class="confidence-box"><div class="confidence-row"><span>Zanesljivost ocene: ${confidenceLabel(score)}</span><strong>${score} %</strong></div><div class="confidence-track"><div class="confidence-fill" style="width:${score}%"></div></div><small class="confidence-note">${note}</small></div>`;}
function whyBlock(lines){ return `<details class="why"><summary>Zakaj je rezultat tak?</summary><ul>${lines.map(x=>`<li>${x}</li>`).join('')}</ul></details>`; }
function allTable(calc){
  const rows=Object.keys(A.models.parkingByName).filter(n=>n!=='VSA PARKIRIŠČA').map(n=>calc(n)).sort((a,b)=>b.after-a.after);
  return `<div class="mini-table"><div class="mini-head"><span>Parkirišče</span><span>Osnova</span><span>Po scenariju</span><span>Δ</span></div>${rows.map(r=>`<div><span>${r.name.replace(', Tržič','')}</span><span>${nf1.format(r.base)} %</span><span>${nf1.format(r.after)} %</span><span>${signed(r.after-r.base,' t')}</span></div>`).join('')}</div>`;
}
function trafficCalc(name,change){ const m=A.models.parkingByName[name]; const nt=m.baselineTraffic*(1+change/100); return {name,base:m.baselineOccupancy,after:clamp(m.intercept+m.slope*nt,0,100),m}; }
function updateTraffic(){
  const change=+trafficSlider.value; trafficSliderValue.textContent=signed(change,' %'); const name=parkingSelect.value; const r=trafficCalc(name,change),score=confidenceScore(r.m.r2,r.m.n);
  const table=name==='VSA PARKIRIŠČA'?allTable(n=>trafficCalc(n,change)):'';
  trafficOutput.innerHTML=`<p class="answer">Pri ${signed(change,' %')} prometa bi bila ocenjena zasedenost <strong>${name.toLowerCase()}</strong> ${nf1.format(r.after)} %.</p><div class="metric">${nf1.format(r.after)} %</div><p class="detail">Sprememba glede na osnovo ${nf1.format(r.base)} %: <strong>${signed(r.after-r.base,' odstotne točke')}</strong>.</p>${table}${confidenceBox(score,`${r.m.n} skupnih mesecev; R² ${r.m.r2.toFixed(2)}. Promet meri eno vstopno glavno cesto, zato ne predstavlja vsega prometa v občini.`)}${whyBlock(['Uporabljena je zgodovinska povezava med mesečnim prometom CABLEX in zasedenostjo.',name==='VSA PARKIRIŠČA'?'Skupna vrednost je utežena glede na kapaciteto posameznega parkirišča.':'Izračun velja za izbrano parkirišče.','Promet pojasni le del sprememb; na parkiranje vplivajo tudi sezona, namen poti, dogodki in razporeditev delovnih dni.'])}`;
}
function weatherLabel(v){return v<=-75?'zelo dobro':v<=-25?'dobro':v<25?'običajno':v<75?'slabo':'zelo slabo';}
function predictMulti(name,val){
  const m=name==='VSA PARKIRIŠČA'?A.models.multifactorAll:A.models.multifactorByParking[name]; if(!m)return null;
  const z={...m.featureMean}; const strength=val/100;
  z.precipitation=Math.max(0,z.precipitation*(1+strength*.75)); z.badWeatherHours=Math.max(0,z.badWeatherHours*(1+strength)); z.avgTemp=z.avgTemp-strength*2.0;
  let pred=m.intercept; Object.keys(m.coefficients).forEach(f=>pred+=m.coefficients[f]*((z[f]-m.featureMean[f])/m.featureStd[f])); return clamp(pred,0,100);
}
function updateWeather(){
  const val=+weatherSlider.value,label=weatherLabel(val),name=weatherParkingSelect.value; weatherSliderValue.textContent=label;
  const m=name==='VSA PARKIRIŠČA'?A.models.multifactorAll:A.models.multifactorByParking[name]; const after=predictMulti(name,val),base=m.baselineOccupancy,score=confidenceScore(m.r2,m.n);
  const table=name==='VSA PARKIRIŠČA'?allTable(n=>({name:n,base:A.models.multifactorByParking[n].baselineOccupancy,after:predictMulti(n,val)})):'';
  weatherOutput.innerHTML=`<p class="answer">Za scenarij <strong>${label} vreme</strong> model ocenjuje ${name.toLowerCase()} na približno <strong>${nf1.format(after)} %</strong> zasedenosti.</p><div class="metric">${nf1.format(after)} %</div><p class="detail">Ocenjena sprememba glede na večmesečno osnovo: ${signed(after-base,' odstotne točke')}.</p>${table}${confidenceBox(score,`Večfaktorski mesečni model; R² ${m.r2.toFixed(2)}. Urni referenčni profil se pri tej napovedi ne uporablja kot večletno povprečje.`)}${whyBlock(['Model hkrati upošteva temperaturo, padavine in ure slabega vremena.','Dodani so sezonski vzorec, promet, število delovnih dni, vikendov in praznikov v mesecu.','Ker je dolgoročna zasedenost na voljo mesečno, ne moremo neposredno izmeriti učinka posameznega petka, ure ali praznika.'])}`;
}
function employeeRange(delta){ const a=A.models.employeeScenario; const factor=delta/100; const low=Math.round(a.vehiclesPer100EmployeesRange[0]*factor),high=Math.round(a.vehiclesPer100EmployeesRange[1]*factor); return [Math.min(low,high),Math.max(low,high)]; }
function updateEmployees(){
  const delta=+employeeSlider.value; employeeSliderValue.textContent=`${delta>=0?'+':''}${nf0.format(delta)}`; const [lo,hi]=employeeRange(delta); const passages=[lo*2,hi*2],m=A.models.employeeScenario;
  employeeOutput.innerHTML=`<p class="answer"><strong>${delta>=0?'+':''}${nf0.format(delta)} delovno aktivnih oseb na delovnih mestih v Občini Tržič</strong> bi po scenariju pomenilo približno ${nf0.format(lo)}–${nf0.format(hi)} dodatnih vozil v prometni konici.</p><div class="metric">${nf0.format(passages[0])}–${nf0.format(passages[1])}</div><p class="detail">dodatnih prehodov vozil na običajen delovni dan, če upoštevamo prihod in odhod. To niso nujno prebivalci Tržiča.</p>${confidenceBox(confidenceScore(0,0,'employee'),`SURS mesečni podatki ${A.employment.period.from}–${A.employment.period.to}; opisna mesečna korelacija s prometom r=${nf2.format(m.monthlyCorrelationTraffic)} (n=${m.monthlyCorrelationTrafficN}) je šibka in ni dokaz vzročnosti.`)}${whyBlock(['SURS šteje osebe, katerih delovno mesto je v Občini Tržič, ne glede na kraj njihovega prebivališča.','Model ne enači delovno aktivne osebe z avtomobilom: upošteva hojo, javni prevoz, skupne vožnje in delo od doma.','Ker je izmerjena korelacija s prometom šibka, je rezultat še vedno prikazan kot strokovno razumen scenarijski razpon, ne kot statistično dokazana napoved.'])}`;
}
function empParkingCalc(name,delta){ const a=A.models.employeeScenario,[lo,hi]=employeeRange(delta); const spacesLo=lo*a.parkingUseShareRange[0],spacesHi=hi*a.parkingUseShareRange[1]; const m=A.models.parkingByName[name]; const cap=m.capacity||A.kpis.totalParkingCapacity; return {name,base:m.baselineOccupancy,low:clamp(m.baselineOccupancy+spacesLo/cap*100,0,100),high:clamp(m.baselineOccupancy+spacesHi/cap*100,0,100)}; }
function updateEmployeeParking(){
 const delta=+employeeParkingSlider.value; employeeParkingSliderValue.textContent=`${delta>=0?'+':''}${nf0.format(delta)}`; const name=employeeParkingSelect.value,r=empParkingCalc(name,delta),m=A.models.employeeScenario;
 const table=name==='VSA PARKIRIŠČA'?allTable(n=>{const x=empParkingCalc(n,delta);return {name:n,base:x.base,after:(x.low+x.high)/2};}):'';
 employeeParkingOutput.innerHTML=`<p class="answer">Pri ${delta>=0?'+':''}${nf0.format(delta)} delovno aktivnih bi bila ocenjena zasedenost <strong>${name.toLowerCase()}</strong> v razponu ${nf1.format(r.low)}–${nf1.format(r.high)} %.</p><div class="metric">${nf1.format(r.low)}–${nf1.format(r.high)} %</div><p class="detail">Razpon prikazuje negotovost pri načinu prihoda na delo in deležu vozil, ki uporabijo spremljana javna parkirišča.</p>${table}${confidenceBox(46,`Verižna scenarijska ocena. Opisna korelacija delovno aktivnih z mesečno zasedenostjo je r=${nf2.format(m.monthlyCorrelationParking)} (n=${m.monthlyCorrelationParkingN}).`)}${whyBlock(['100 dodatnih delovno aktivnih je ocenjeno na približno 45–70 dodatnih vozil v konici.','Predpostavljeno je, da spremljana parkirišča uporabi približno 30–45 % teh vozil.','Podatek SURS velja za delovna mesta na območju celotne Občine Tržič, medtem ko spremljana parkirišča pokrivajo predvsem okolico mestnega jedra.'])}`;
}
function popCalc(name,delta){ const m=A.models.populationScenario,p=A.models.parkingByName[name],loPass=delta*m.dailyVehiclePassagesPerResidentRange[0],hiPass=delta*m.dailyVehiclePassagesPerResidentRange[1],loSpaces=delta*m.simultaneousPublicParkingShareRange[0],hiSpaces=delta*m.simultaneousPublicParkingShareRange[1],cap=p.capacity||A.kpis.totalParkingCapacity; return {name,base:p.baselineOccupancy,loPass,hiPass,low:clamp(p.baselineOccupancy+loSpaces/cap*100,0,100),high:clamp(p.baselineOccupancy+hiSpaces/cap*100,0,100)}; }
function updatePopulation(){
 const delta=+populationSlider.value; populationSliderValue.textContent=`${delta>=0?'+':''}${nf0.format(delta)}`; const name=populationParkingSelect.value,r=popCalc(name,delta);
 const table=name==='VSA PARKIRIŠČA'?allTable(n=>{const x=popCalc(n,delta);return {name:n,base:x.base,after:(x.low+x.high)/2};}):'';
 populationOutput.innerHTML=`<p class="answer">Sprememba za <strong>${delta>=0?'+':''}${nf0.format(delta)} prebivalcev mesta Tržič</strong> bi po demografsko prilagojenem scenariju pomenila približno ${nf0.format(r.loPass)}–${nf0.format(r.hiPass)} dodatnih dnevnih prehodov vozil.</p><div class="metric">${nf1.format(r.low)}–${nf1.format(r.high)} %</div><p class="detail">ocenjena zasedenost ${name.toLowerCase()}. Podatek in scenarij veljata samo za naselje oziroma mesto Tržič, ne za celotno občino.</p>${table}${confidenceBox(confidenceScore(0,0,'population'),'Dolgoročni prostorski scenarij na podlagi 10 letnih vrednosti prebivalstva; manjkajo starostna sestava, vozila in podrobni nameni poti.')}${whyBlock(['Model uporablja zgodovino prebivalstva naselja Tržič 2017–2026 in razpon, ne razmerja 1 prebivalec = 1 avtomobil.','Posredno upošteva otroke, starejše, delovno aktivne, skupne vožnje, hojo, javni prevoz in različne potrebe gospodinjstev.','Prebivalstvo velja samo za mesto Tržič, promet CABLEX za glavno vstopno cesto, parkirišča pa za okolico mestnega jedra.'])}`;
}
function updatePayments(){
 const change=+paymentSlider.value; paymentSliderValue.textContent=signed(change,' %'); const p=A.parkingPayments.easyPark;
 const transactions=Math.round(p.totalTransactions2026*(1+change/100)); const revenue=p.totalRevenue2026*(1+change/100); const deltaRevenue=revenue-p.totalRevenue2026; const top=p.topCategory;
 paymentOutput.innerHTML=`<p class="answer">Ob ${signed(change,' %')} spremembi števila EasyPark parkirnin bi ob nespremenjeni strukturi parkiranja ocenjeni prihodek znašal približno <strong>${money.format(revenue)}</strong>.</p><div class="metric">${money.format(deltaRevenue)}</div><p class="detail">ocenjena sprememba prihodka glede na ${money.format(p.totalRevenue2026)} in ${nf0.format(p.totalTransactions2026)} evidentiranih parkirnin v letu 2026 do datuma izvoza. Ocenjeno število parkirnin: ${nf0.format(transactions)}.</p>${confidenceBox(confidenceScore(0,0,'payments'),`Opazovani prihodek na evidentirano parkirnino je ${nf2.format(p.observedRevenuePerTransaction)} €. Cena ni enaka temu povprečju, ker so vključene različne kategorije, dovolilnice in brezplačna prva ura.`)}${whyBlock([`Največ parkirnin ima kategorija ${top.category}: ${nf0.format(top.transactions)}, kar je ${nf1.format(top.transactions/p.totalTransactions2026*100)} % vseh evidentiranih EasyPark parkirnin.`,`Simulacija ne uporablja izmišljene tarife, ampak dejanski povprečni prihodek na parkirnino v istem obdobju.`,`Zneskov HECTRONIC še ne seštevamo z EasyParkom, ker izvoz parkomatov ne vsebuje jasnega časovnega obdobja. Za natančno tarifno simulacijo potrebujemo pravilnik oziroma cenik po kategorijah.`])}`;
}
function updateHourly(){
 const name=hourlyParkingSelect.value,p=A.parkingHourly.profiles[name],slots=p.slots;
 const friday=slots.filter(x=>x.weekday===4 && x.hour>=7 && x.hour<=12); const fridayAvg=friday.length?friday.reduce((a,x)=>a+x.average,0)/friday.length:null;
 const weekdayDay=slots.filter(x=>x.weekday<5 && x.hour>=7 && x.hour<=16); const workAvg=weekdayDay.reduce((a,x)=>a+x.average,0)/weekdayDay.length;
 hourlyOutput.innerHTML=`<div class="hourly-stat"><span>Povprečje referenčnega tedna</span><strong>${nf1.format(p.average)} %</strong><small>${name.replace(', Tržič','')}</small></div><div class="hourly-stat"><span>Najvišji povprečni termin</span><strong>${p.peak.weekdayName}, ${String(p.peak.hour).padStart(2,'0')}:00</strong><small>${nf1.format(p.peak.average)} % zasedenosti</small></div><div class="hourly-stat"><span>Petek 7.00–12.00</span><strong>${fridayAvg==null?'ni podatka':nf1.format(fridayAvg)+' %'}</strong><small>delovni dnevi 7.00–16.00: ${nf1.format(workAvg)} %</small></div><div class="method-note"><strong>Pomembno:</strong> to je le en referenčni julijski teden. Lahko pokaže, zakaj je bil določen petek dopoldne zelo zaseden, ne sme pa se samodejno razglasiti za tipičen vzorec vseh let.</div>`;
}
function answerQuestion(q){
 const out=questionOutput; if(!q.trim()){out.textContent='Vpiši vprašanje.';return;} const text=q.toLowerCase(); const numMatch=text.match(/([+-]?\d[\d.]*)/); const num=numMatch?parseInt(numMatch[1].replaceAll('.','')):null;
 if(text.includes('prebival')){ populationSlider.value=clamp(num??500,-1500,2000); populationParkingSelect.value='VSA PARKIRIŠČA'; updatePopulation(); out.classList.remove('empty'); out.innerHTML=`<span class="parsed">Prepoznano vprašanje: prebivalstvo mesta → promet → vsa parkirišča</span>${populationOutput.innerHTML}`; }
 else if(text.includes('zaposlen')||text.includes('delovno aktiv')){ employeeParkingSlider.value=clamp(num??100,-500,1000); employeeParkingSelect.value='VSA PARKIRIŠČA'; updateEmployeeParking(); out.classList.remove('empty'); out.innerHTML=`<span class="parsed">Prepoznano vprašanje: delovno aktivni v Občini Tržič → vsa parkirišča</span>${employeeParkingOutput.innerHTML}`; }
 else if(text.includes('parkirnin')||text.includes('prihodek')){ paymentSlider.value=clamp(num??10,-30,50); updatePayments(); out.classList.remove('empty'); out.innerHTML=`<span class="parsed">Prepoznano vprašanje: parkirnine → prihodek</span>${paymentOutput.innerHTML}`; }
 else if(text.includes('vreme')||text.includes('dež')||text.includes('slabo')){ weatherSlider.value=text.includes('zelo')?100:75; weatherParkingSelect.value='VSA PARKIRIŠČA'; updateWeather(); out.classList.remove('empty'); out.innerHTML=`<span class="parsed">Prepoznano vprašanje: vreme → vsa parkirišča</span>${weatherOutput.innerHTML}`; }
 else if(text.includes('promet')){ trafficSlider.value=clamp(num??20,-30,50); parkingSelect.value='VSA PARKIRIŠČA'; updateTraffic(); out.classList.remove('empty'); out.innerHTML=`<span class="parsed">Prepoznano vprašanje: promet → vsa parkirišča</span>${trafficOutput.innerHTML}`; }
 else { out.classList.remove('empty'); out.innerHTML='<strong>Tega vprašanja v0.52 še ne razume.</strong><p>Poskusi omeniti promet, vreme, delovno aktivne, prebivalce ali parkirnine ter dodaj številko.</p>'; }
}
function renderInsights(){
 const m=A.models.multifactorAll,e=A.models.employeeScenario,p=A.parkingPayments.easyPark,top=p.topCategory;
 const items=[
  `<strong>Prostorski obseg:</strong> CABLEX meri glavno cesto proti mestu Tržič; sedem parkirišč predstavlja okolico mestnega jedra. Rezultatov ne razlagamo kot stanje celotne Občine Tržič.`,
  `<strong>Delovno aktivni:</strong> SURS mesečno kaže ${nf0.format(A.employment.latest.value)} oseb z delovnim mestom v Občini Tržič (${formatMonth(A.employment.latest.month)}). To niso nujno prebivalci Tržiča.`,
  `<strong>Korelacija zaposlenosti:</strong> mesečna povezava s prometom je šibka (r=${nf2.format(e.monthlyCorrelationTraffic)}, n=${e.monthlyCorrelationTrafficN}), zato model ohranja razpon 45–70 vozil na 100 delovno aktivnih in ga ne predstavlja kot dokazano vzročnost.`,
  `<strong>Urni profil:</strong> novi podatki po urah zajemajo samo 10.–17. 7. 2026. Uporabljajo se za razlago dneva in ure, ne kot ponarejeno petletno povprečje.`,
  `<strong>Parkirnine:</strong> ${top.category} predstavlja ${nf1.format(top.transactions/p.totalTransactions2026*100)} % vseh evidentiranih EasyPark parkirnin v letu 2026 do izvoza. To nakazuje močan pritisk oziroma uporabo območja ZD, vendar število transakcij samo po sebi še ne pove trajanja parkiranja.`,
  `<strong>Večfaktorski model:</strong> promet, vreme, sezona, delovni dnevi, vikendi in prazniki so vključeni v mesečni model parkirišč (R² ${m.r2.toFixed(2)}, n=${m.n}).`
 ]; insightList.innerHTML=items.map(x=>`<div class="insight">${x}</div>`).join('');
}
function renderCharts(){
 const months=A.monthly.filter(x=>x.avgDaily!=null||x.weightedOccupancy!=null); Chart.defaults.font.family='Inter,system-ui,sans-serif'; Chart.defaults.color='#52636d';
 new Chart(trendChart,{type:'line',data:{labels:months.map(x=>x.month),datasets:[{label:'Povp. vozil/dan',data:months.map(x=>x.avgDaily),yAxisID:'y',borderColor:'#1769d2',backgroundColor:'rgba(23,105,210,.10)',tension:.25,borderWidth:3,spanGaps:true},{label:'Zasedenost (%)',data:months.map(x=>x.weightedOccupancy),yAxisID:'y1',borderColor:'#f09a22',backgroundColor:'rgba(240,154,34,.10)',tension:.25,borderWidth:3,spanGaps:true}]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},scales:{y:{grid:{color:'#edf1f5'}},y1:{position:'right',min:0,max:100,grid:{drawOnChartArea:false}}},plugins:{legend:{position:'bottom'}}}});
 const pm=A.models.parkingByName,names=Object.keys(pm).filter(n=>n!=='VSA PARKIRIŠČA'); new Chart(parkingChart,{type:'bar',data:{labels:names.map(n=>n.replace(', Tržič','')),datasets:[{data:names.map(n=>pm[n].baselineOccupancy),backgroundColor:'#1769d2'}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',scales:{x:{min:0,max:100,grid:{color:'#edf1f5'}}},plugins:{legend:{display:false}}}});
 const speeds=A.trafficSpeed.vehicleTypes; new Chart(speedChart,{type:'bar',data:{labels:speeds.map(x=>x.name),datasets:[{data:speeds.map(x=>x.averageSpeed),backgroundColor:'#69aaf5'}]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{min:0,max:55,grid:{color:'#edf1f5'}}},plugins:{legend:{display:false}}}});
 const emp=A.employment.monthly; new Chart(employmentChart,{type:'line',data:{labels:emp.map(x=>x.month),datasets:[{label:'Delovno aktivni',data:emp.map(x=>x.value),borderColor:'#1769d2',backgroundColor:'rgba(23,105,210,.10)',fill:true,tension:.25,borderWidth:3}]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{grid:{color:'#edf1f5'}}},plugins:{legend:{display:false}}}});
 const counts=A.parkingPayments.easyPark.counts.filter(x=>x.transactions>=500).sort((a,b)=>b.transactions-a.transactions); new Chart(paymentChart,{type:'bar',data:{labels:counts.map(x=>x.category),datasets:[{data:counts.map(x=>x.transactions),backgroundColor:'#69aaf5'}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',scales:{x:{grid:{color:'#edf1f5'}}},plugins:{legend:{display:false}}}});
}
init().catch(e=>{document.body.innerHTML=`<main style="padding:40px"><h1>Napaka pri nalaganju podatkov</h1><p>${e.message}</p><p>Preveri mapo <code>data</code> in uporabi Ctrl + F5.</p></main>`});

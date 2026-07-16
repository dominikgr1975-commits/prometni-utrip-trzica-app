const nf0 = new Intl.NumberFormat('sl-SI', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('sl-SI', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const signed = (v, unit='') => `${v >= 0 ? '+' : ''}${nf1.format(v)}${unit}`;
const clamp = (v,min,max)=>Math.min(max,Math.max(min,v));
let A;

async function init(){
  A = await fetch('./data/analysis.json?v=0.5').then(r=>{if(!r.ok) throw new Error('analysis.json'); return r.json();});
  renderKpis(); renderInputs(); bind(); renderInsights(); renderCharts(); updateAll();
}

function renderKpis(){
  const k=A.kpis;
  const items=[
    ['Povprečno vozil na dan',nf0.format(k.avgDailyTraffic),`CABLEX · ${k.trafficYears}-letni tedenski podatki`],
    ['Povprečna zasedenost',`${nf1.format(k.parkingAvg)} %`,'vsa parkirišča · kapacitetno uteženo'],
    ['Skupna kapaciteta',nf0.format(k.totalParkingCapacity),'7 spremljanih parkirišč'],
    ['Delovno aktivni 2025',nf0.format(k.employee2025),`${signed(k.employeeChange2023to2025,' %')} glede na 2023`],
    ['Povprečna temperatura',`${nf1.format(k.averageTemperature)} °C`,`${nf0.format(k.rainDays)} dni z zaznanim dežjem`],
    ['Prebivalci 2025',nf0.format(k.population2025),'Občina Tržič'],
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
}
function bind(){
  ['trafficSlider','parkingSelect','weatherSlider','weatherParkingSelect','employeeSlider','employeeParkingSlider','employeeParkingSelect','populationSlider','populationParkingSelect'].forEach(id=>document.querySelector('#'+id).addEventListener('input',updateAll));
  document.querySelector('#questionForm').addEventListener('submit',e=>{e.preventDefault(); answerQuestion(document.querySelector('#questionInput').value);});
  document.querySelectorAll('[data-question]').forEach(b=>b.addEventListener('click',()=>{document.querySelector('#questionInput').value=b.dataset.question;answerQuestion(b.dataset.question);}));
}
function updateAll(){ updateTraffic(); updateWeather(); updateEmployees(); updateEmployeeParking(); updatePopulation(); }
function conf(r2,n){ if(n<12||r2<.10)return 'Nizka'; if(r2<.35)return 'Srednja'; return 'Višja'; }
function whyBlock(lines){ return `<details class="why"><summary>Zakaj je rezultat tak?</summary><ul>${lines.map(x=>`<li>${x}</li>`).join('')}</ul></details>`; }
function allTable(calc){
  const rows=Object.keys(A.models.parkingByName).filter(n=>n!=='VSA PARKIRIŠČA').map(n=>calc(n)).sort((a,b)=>b.after-a.after);
  return `<div class="mini-table"><div class="mini-head"><span>Parkirišče</span><span>Osnova</span><span>Po scenariju</span><span>Δ</span></div>${rows.map(r=>`<div><span>${r.name.replace(', Tržič','')}</span><span>${nf1.format(r.base)} %</span><span>${nf1.format(r.after)} %</span><span>${signed(r.after-r.base,' t')}</span></div>`).join('')}</div>`;
}
function trafficCalc(name,change){ const m=A.models.parkingByName[name]; const nt=m.baselineTraffic*(1+change/100); return {name,base:m.baselineOccupancy,after:clamp(m.intercept+m.slope*nt,0,100),m}; }
function updateTraffic(){
  const change=+trafficSlider.value; trafficSliderValue.textContent=signed(change,' %'); const name=parkingSelect.value; const r=trafficCalc(name,change);
  const table=name==='VSA PARKIRIŠČA'?allTable(n=>trafficCalc(n,change)):'';
  trafficOutput.innerHTML=`<p class="answer">Pri ${signed(change,' %')} prometa bi bila ocenjena zasedenost <strong>${name.toLowerCase()}</strong> ${nf1.format(r.after)} %.</p><div class="metric">${nf1.format(r.after)} %</div><p class="detail">Sprememba glede na osnovo ${nf1.format(r.base)} %: <strong>${signed(r.after-r.base,' odstotne točke')}</strong>.</p>${table}<span class="confidence">${conf(r.m.r2,r.m.n)} zanesljivost · ${r.m.n} skupnih mesecev · R² ${r.m.r2.toFixed(2)}</span>${whyBlock(['Uporabljena je zgodovinska povezava med mesečnim prometom CABLEX in zasedenostjo.',name==='VSA PARKIRIŠČA'?'Skupna vrednost je utežena glede na kapaciteto posameznega parkirišča.':'Izračun velja za izbrano parkirišče.','Promet pojasni le del sprememb; na parkiranje vplivajo tudi sezona, namen poti, dogodki in razporeditev delovnih dni.'])}`;
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
  const m=name==='VSA PARKIRIŠČA'?A.models.multifactorAll:A.models.multifactorByParking[name]; const after=predictMulti(name,val),base=m.baselineOccupancy;
  const table=name==='VSA PARKIRIŠČA'?allTable(n=>({name:n,base:A.models.multifactorByParking[n].baselineOccupancy,after:predictMulti(n,val)})):'';
  weatherOutput.innerHTML=`<p class="answer">Za scenarij <strong>${label} vreme</strong> model ocenjuje ${name.toLowerCase()} na približno <strong>${nf1.format(after)} %</strong> zasedenosti.</p><div class="metric">${nf1.format(after)} %</div><p class="detail">Ocenjena sprememba glede na večmesečno osnovo: ${signed(after-base,' odstotne točke')}.</p>${table}<span class="confidence">${conf(m.r2,m.n)} zanesljivost · večfaktorski model · R² ${m.r2.toFixed(2)}</span>${whyBlock(['Model hkrati upošteva temperaturo, padavine in ure slabega vremena.','Dodani so sezonski vzorec, promet, število delovnih dni, vikendov in praznikov v mesecu.','Ker je zasedenost na voljo le mesečno, ne moremo neposredno izmeriti učinka posameznega deževnega dne ali praznika.'])}`;
}
function employeeRange(delta){ const a=A.models.employeeScenario; const factor=delta/100; const low=Math.round(a.vehiclesPer100EmployeesRange[0]*factor),high=Math.round(a.vehiclesPer100EmployeesRange[1]*factor); return [Math.min(low,high),Math.max(low,high)]; }
function updateEmployees(){
  const delta=+employeeSlider.value; employeeSliderValue.textContent=`${delta>=0?'+':''}${nf0.format(delta)}`; const [lo,hi]=employeeRange(delta); const passages=[lo*2,hi*2];
  employeeOutput.innerHTML=`<p class="answer"><strong>${delta>=0?'+':''}${nf0.format(delta)} zaposlenih</strong> bi po scenariju pomenilo približno ${nf0.format(lo)}–${nf0.format(hi)} dodatnih vozil v prometni konici.</p><div class="metric">${nf0.format(passages[0])}–${nf0.format(passages[1])}</div><p class="detail">dodatnih prehodov vozil na običajen delovni dan, če upoštevamo prihod in odhod.</p><span class="confidence">Scenarijski razpon · ni statistično dokazana korelacija</span>${whyBlock(['Model ne enači zaposlenega z avtomobilom.','Upošteva, da nekateri hodijo peš, uporabljajo javni prevoz, se vozijo skupaj ali delajo od doma.','Za pravo korelacijo potrebujemo večletne podatke o zaposlenih in prometu za isto obdobje ter po možnosti podatke o dnevnih migracijah.'])}`;
}
function empParkingCalc(name,delta){ const a=A.models.employeeScenario,[lo,hi]=employeeRange(delta); const shareLo=a.parkingUseShareRange[0],shareHi=a.parkingUseShareRange[1]; const spacesLo=lo*shareLo,spacesHi=hi*shareHi; const m=A.models.parkingByName[name]; const cap=m.capacity||A.kpis.totalParkingCapacity; return {name,base:m.baselineOccupancy,low:clamp(m.baselineOccupancy+spacesLo/cap*100,0,100),high:clamp(m.baselineOccupancy+spacesHi/cap*100,0,100)}; }
function updateEmployeeParking(){
 const delta=+employeeParkingSlider.value; employeeParkingSliderValue.textContent=`${delta>=0?'+':''}${nf0.format(delta)}`; const name=employeeParkingSelect.value,r=empParkingCalc(name,delta);
 const table=name==='VSA PARKIRIŠČA'?allTable(n=>{const x=empParkingCalc(n,delta);return {name:n,base:x.base,after:(x.low+x.high)/2};}):'';
 employeeParkingOutput.innerHTML=`<p class="answer">Pri ${delta>=0?'+':''}${nf0.format(delta)} zaposlenih bi bila ocenjena zasedenost <strong>${name.toLowerCase()}</strong> v razponu ${nf1.format(r.low)}–${nf1.format(r.high)} %.</p><div class="metric">${nf1.format(r.low)}–${nf1.format(r.high)} %</div><p class="detail">Razpon prikazuje negotovost pri načinu prihoda na delo in deležu vozil, ki bi uporabila spremljana javna parkirišča.</p>${table}<span class="confidence">Nizka zanesljivost · verižna scenarijska ocena</span>${whyBlock(['100 novih zaposlenih je ocenjeno na približno 45–70 dodatnih vozil v konici.','Predpostavljeno je, da spremljana parkirišča uporabi približno 30–45 % teh vozil.','Rezultat je prikazan kot razpon, ker nimamo podatkov o načinu prihoda zaposlenih in njihovem dejanskem parkiranju.'])}`;
}
function popCalc(name,delta){ const m=A.models.populationScenario,p=A.models.parkingByName[name],loPass=delta*m.dailyVehiclePassagesPerResidentRange[0],hiPass=delta*m.dailyVehiclePassagesPerResidentRange[1],loSpaces=delta*m.simultaneousPublicParkingShareRange[0],hiSpaces=delta*m.simultaneousPublicParkingShareRange[1],cap=p.capacity||A.kpis.totalParkingCapacity; return {name,base:p.baselineOccupancy,loPass,hiPass,low:clamp(p.baselineOccupancy+loSpaces/cap*100,0,100),high:clamp(p.baselineOccupancy+hiSpaces/cap*100,0,100)}; }
function updatePopulation(){
 const delta=+populationSlider.value; populationSliderValue.textContent=`${delta>=0?'+':''}${nf0.format(delta)}`; const name=populationParkingSelect.value,r=popCalc(name,delta);
 const table=name==='VSA PARKIRIŠČA'?allTable(n=>{const x=popCalc(n,delta);return {name:n,base:x.base,after:(x.low+x.high)/2};}):'';
 populationOutput.innerHTML=`<p class="answer">Sprememba za <strong>${delta>=0?'+':''}${nf0.format(delta)} prebivalcev</strong> bi po demografsko prilagojenem scenariju pomenila približno ${nf0.format(r.loPass)}–${nf0.format(r.hiPass)} dodatnih dnevnih prehodov vozil.</p><div class="metric">${nf1.format(r.low)}–${nf1.format(r.high)} %</div><p class="detail">ocenjena zasedenost ${name.toLowerCase()}. Več prebivalcev ne pomeni enakega števila avtomobilov ali vsakodnevnih voženj.</p>${table}<span class="confidence">Nizka zanesljivost · dolgoročni prostorski scenarij</span>${whyBlock(['Model uporablja razpon in ne razmerja 1 prebivalec = 1 avtomobil.','Posredno upošteva otroke, starejše, delovno aktivne, skupne vožnje, hojo, javni prevoz in različne potrebe gospodinjstev.','Za umerjanje potrebujemo večletno demografijo, registrirana vozila, dnevne migracije in podrobnejše podatke o namenu poti.'])}`;
}
function answerQuestion(q){
 const out=questionOutput; if(!q.trim()){out.textContent='Vpiši vprašanje.';return;} const text=q.toLowerCase(); const numMatch=text.match(/([+-]?\d[\d.]*)/); const num=numMatch?parseInt(numMatch[1].replaceAll('.','')):null;
 if(text.includes('prebival')){ populationSlider.value=clamp(num??500,-1500,2000); populationParkingSelect.value='VSA PARKIRIŠČA'; updatePopulation(); out.classList.remove('empty'); out.innerHTML=`<span class="parsed">Prepoznano vprašanje: prebivalstvo → promet → vsa parkirišča</span>${populationOutput.innerHTML}`; }
 else if(text.includes('zaposlen')){ employeeParkingSlider.value=clamp(num??100,-500,1000); employeeParkingSelect.value='VSA PARKIRIŠČA'; updateEmployeeParking(); out.classList.remove('empty'); out.innerHTML=`<span class="parsed">Prepoznano vprašanje: zaposleni → promet → vsa parkirišča</span>${employeeParkingOutput.innerHTML}`; }
 else if(text.includes('vreme')||text.includes('dež')||text.includes('slabo')){ weatherSlider.value=text.includes('zelo')?100:75; weatherParkingSelect.value='VSA PARKIRIŠČA'; updateWeather(); out.classList.remove('empty'); out.innerHTML=`<span class="parsed">Prepoznano vprašanje: vreme → vsa parkirišča</span>${weatherOutput.innerHTML}`; }
 else if(text.includes('promet')){ trafficSlider.value=clamp(num??20,-30,50); parkingSelect.value='VSA PARKIRIŠČA'; updateTraffic(); out.classList.remove('empty'); out.innerHTML=`<span class="parsed">Prepoznano vprašanje: promet → vsa parkirišča</span>${trafficOutput.innerHTML}`; }
 else { out.classList.remove('empty'); out.innerHTML='<strong>Tega vprašanja v0.5 še ne razume.</strong><p>Poskusi omeniti promet, vreme, zaposlene ali prebivalce ter dodaj številko.</p>'; }
}
function renderInsights(){
 const m=A.models.multifactorAll,k=A.kpis;
 const items=[
  `<strong>Več podatkov:</strong> promet CABLEX zdaj zajema približno tri leta tedenskih podatkov. To izboljša sezonski pregled, ne odpravi pa različnih časovnih ločljivosti virov.`,
  `<strong>Parkirišča:</strong> model uporablja kapacitetno uteženo skupno zasedenost in ločene modele za sedem parkirišč.`,
  `<strong>Večfaktorski model:</strong> pri oceni parkirišč so vključeni promet, temperatura, padavine, slabo vreme, sezona, delovni dnevi, vikendi in prazniki (R² ${m.r2.toFixed(2)}, n=${m.n}).`,
  `<strong>Zaposleni:</strong> korelacije še ne moremo zanesljivo izračunati, ker imamo samo tri letne vrednosti. Zato v0.5 prikazuje pregleden razpon 45–70 dodatnih vozil na 100 zaposlenih.`,
  `<strong>Prebivalci:</strong> vpliv ni linearen; aplikacija ga prikazuje kot demografsko prilagojen razpon in jasno navede predpostavke.`,
  `<strong>Naslednji korak:</strong> največjo izboljšavo bodo prinesli dnevni ali urni podatki parkirišč, daljša zgodovina vremena ter večletni demografski in migracijski podatki.`
 ]; insightList.innerHTML=items.map(x=>`<div class="insight">${x}</div>`).join('');
}
function renderCharts(){
 const months=A.monthly.filter(x=>x.avgDaily!=null||x.weightedOccupancy!=null); Chart.defaults.font.family='Inter,system-ui,sans-serif'; Chart.defaults.color='#52636d';
 new Chart(trendChart,{type:'line',data:{labels:months.map(x=>x.month),datasets:[{label:'Povp. vozil/dan',data:months.map(x=>x.avgDaily),yAxisID:'y',borderColor:'#1769d2',backgroundColor:'rgba(23,105,210,.10)',tension:.25,borderWidth:3,spanGaps:true},{label:'Zasedenost (%)',data:months.map(x=>x.weightedOccupancy),yAxisID:'y1',borderColor:'#f09a22',backgroundColor:'rgba(240,154,34,.10)',tension:.25,borderWidth:3,spanGaps:true}]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},scales:{y:{grid:{color:'#edf1f5'}},y1:{position:'right',min:0,max:100,grid:{drawOnChartArea:false}}},plugins:{legend:{position:'bottom'}}}});
 const pm=A.models.parkingByName,names=Object.keys(pm).filter(n=>n!=='VSA PARKIRIŠČA'); new Chart(parkingChart,{type:'bar',data:{labels:names.map(n=>n.replace(', Tržič','')),datasets:[{data:names.map(n=>pm[n].baselineOccupancy),backgroundColor:'#1769d2'}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',scales:{x:{min:0,max:100,grid:{color:'#edf1f5'}}},plugins:{legend:{display:false}}}});
 const speeds=A.trafficSpeed.vehicleTypes; new Chart(speedChart,{type:'bar',data:{labels:speeds.map(x=>x.name),datasets:[{data:speeds.map(x=>x.averageSpeed),backgroundColor:'#69aaf5'}]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{min:0,max:55,grid:{color:'#edf1f5'}}},plugins:{legend:{display:false}}}});
}
init().catch(e=>{document.body.innerHTML=`<main style="padding:40px"><h1>Napaka pri nalaganju podatkov</h1><p>${e.message}</p><p>Preveri mapo <code>data</code> in uporabi Ctrl + F5.</p></main>`});

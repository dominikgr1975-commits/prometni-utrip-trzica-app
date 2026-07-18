const nf0 = new Intl.NumberFormat('sl-SI', { maximumFractionDigits: 0, useGrouping: true });
const nf1 = new Intl.NumberFormat('sl-SI', { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: true });
const nf2 = new Intl.NumberFormat('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true });
const money = new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true });
const signed = (v, unit='') => `${v >= 0 ? '+' : ''}${nf1.format(v)}${unit}`;
const clamp = (v,min,max)=>Math.min(max,Math.max(min,v));
let A, H, E, W, T, TOUR, EV, O, UM;
let selectedPulsePeriod = null;

function init(){
  const d = window.PROMETNI_UTRIP_DATA || {};
  [A,H,E,W,T,TOUR,EV,O] = [d.ANALYSIS,d.HOLIDAYS,d.EVENTS,d.WEATHER,d.TRAFFIC_DAILY,d.TOURISM,d.EV_CHARGER,d.OFFENSES];
  if ([A,H,E,W,T,TOUR,EV,O].some(v => !v)) {
    const missing = ['ANALYSIS','HOLIDAYS','EVENTS','WEATHER','TRAFFIC_DAILY','TOURISM','EV_CHARGER','OFFENSES'].filter(k => !d[k]);
    throw new Error('Manjkajo lokalni podatki: ' + missing.join(', '));
  }
  UM = buildUnifiedModel();
  renderKpis(); renderInputs(); initPulsePeriodControls(); renderUnifiedModel(); bind(); renderInsights(); renderFacts();
  if (typeof Chart !== 'undefined') renderCharts();
  else document.querySelector('.charts-grid').insertAdjacentHTML('afterbegin','<div class="notice"><strong>Grafi niso naloženi:</strong> knjižnica Chart.js zahteva internetno povezavo. Vse analize, scenariji in lokalni podatki kljub temu delujejo.</div>');
  updateAll();
}
function formatMonth(ym){const [y,m]=ym.split('-');return `${m}. ${y}`;}

function correlation(xs,ys){
  const pairs=xs.map((x,i)=>[x,ys[i]]).filter(([x,y])=>Number.isFinite(x)&&Number.isFinite(y));
  if(pairs.length<3)return {r:0,n:pairs.length};
  const ax=pairs.reduce((s,p)=>s+p[0],0)/pairs.length, ay=pairs.reduce((s,p)=>s+p[1],0)/pairs.length;
  const num=pairs.reduce((s,p)=>s+(p[0]-ax)*(p[1]-ay),0);
  const dx=Math.sqrt(pairs.reduce((s,p)=>s+(p[0]-ax)**2,0)),dy=Math.sqrt(pairs.reduce((s,p)=>s+(p[1]-ay)**2,0));
  return {r:dx&&dy?num/(dx*dy):0,n:pairs.length};
}
function monthlyAverage(rows,key){
  const values=rows.filter(x=>x[key]!=null).map(x=>+x[key]).filter(Number.isFinite);
  return values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
}
function eventCountsByMonth(){
  const counts={};
  E.events.forEach(ev=>{const m=(ev.date||'').slice(0,7);if(m)counts[m]=(counts[m]||0)+1;});
  return counts;
}
function tourismByMonth(){return Object.fromEntries(TOUR.monthly.map(x=>[x.month,+x.guests||0]));}
function weatherComfort(temp){return temp!=null&&Number.isFinite(+temp)?clamp(100-Math.abs(+temp-16)*3,35,100):null;}
function ratioIndex(value,baseline){
  if(!Number.isFinite(value)||!Number.isFinite(baseline)||baseline<=0)return null;
  return clamp(value/baseline*100,40,180);
}
function comparableBaseline(rows,selected,key){
  const monthNums=new Set(selected.map(x=>+x.month.slice(5,7)));
  let pool=rows.filter(x=>monthNums.has(+x.month.slice(5,7))&&!selected.includes(x)&&x[key]!=null&&Number.isFinite(+x[key]));
  if(!pool.length)pool=rows.filter(x=>monthNums.has(+x.month.slice(5,7))&&x[key]!=null&&Number.isFinite(+x[key]));
  return monthlyAverage(pool,key);
}
function calculatePulse(rows,startMonth,endMonth){
  const selected=rows.filter(x=>x.month>=startMonth&&x.month<=endMonth);
  const defs=[
    ['traffic','avgDaily',28],['parking','weightedOccupancy',22],['payments','paymentActivity',20],
    ['events','eventCount',10],['tourism','tourismGuests',10],['weather','weatherComfort',10]
  ];
  const components={}; let weighted=0,used=0;
  defs.forEach(([name,key,weight])=>{
    const value=monthlyAverage(selected,key),base=comparableBaseline(rows,selected,key),score=ratioIndex(value,base);
    components[name]={score:score==null?null:Math.round(score),value,baseline:base,weight};
    if(score!=null){weighted+=score*weight;used+=weight;}
  });
  const pulse=used?Math.round(weighted/used):100;
  return {pulse,components,selected,startMonth,endMonth};
}
function pulseLabel(v){
  if(v<75)return 'precej mirnejše od običajnega';
  if(v<90)return 'mirnejše od običajnega';
  if(v<=110)return 'običajen utrip';
  if(v<=125)return 'živahnejše od običajnega';
  return 'izjemno živahno obdobje';
}
function periodLabel(start,end){return start===end?formatMonth(start):`${formatMonth(start)}–${formatMonth(end)}`;}
function buildUnifiedModel(){
  const ep=A.parkingPayments.easyPark,hc=A.parkingPayments.hectronic;
  const easyMonthly={}; ep.monthlyRevenue.forEach(x=>easyMonthly[x.month]=(easyMonthly[x.month]||0)+(+x.revenueGross||0));
  const hectMonthly=Object.fromEntries(hc.monthlyTransactions.map(x=>[x.month,+x.transactions||0]));
  const offenseMonthly=Object.fromEntries(O.monthly.map(x=>[x.month,+x.offenses||0]));
  const eventsMonthly=eventCountsByMonth(),tourismMonthly=tourismByMonth();
  const rows=A.monthly.map(x=>{
    const easy=easyMonthly[x.month]??null,hect=hectMonthly[x.month]??null;
    const paymentParts=[easy,hect].filter(Number.isFinite);
    return {...x,easyRevenue:easy,hectronicTransactions:hect,paymentActivity:paymentParts.length?paymentParts.reduce((a,b)=>a+b,0):null,eventCount:eventsMonthly[x.month]??null,tourismGuests:tourismMonthly[x.month]??null,weatherComfort:weatherComfort(x.avgTemp),offenses:offenseMonthly[x.month]??null,trafficQuality:x.trafficEstimated?'estimated':(x.avgDaily==null?'missing':'measured'),offensesQuality:offenseMonthly[x.month]==null?'missing':'measured'};
  });
  const paymentRows=rows.filter(x=>x.avgDaily!=null&&x.hectronicTransactions!=null);
  const trafficPayment=correlation(paymentRows.map(x=>x.avgDaily),paymentRows.map(x=>x.hectronicTransactions));
  const occPaymentRows=rows.filter(x=>x.weightedOccupancy!=null&&x.hectronicTransactions!=null);
  const occupancyPayment=correlation(occPaymentRows.map(x=>x.weightedOccupancy),occPaymentRows.map(x=>x.hectronicTransactions));
  const totalTraffic=A.trafficWeekly.records.length, estimatedTraffic=A.trafficWeekly.records.filter(x=>x.estimated).length;
  const offenseTrafficRows=rows.filter(x=>x.avgDaily!=null&&x.offenses!=null);
  const trafficOffenses=correlation(offenseTrafficRows.map(x=>x.avgDaily),offenseTrafficRows.map(x=>x.offenses));
  const cablexOffenseRows=O.cablexStreet.records.map(o=>{const r=rows.find(x=>x.month===o.month);return {offenses:o.offenses,traffic:r?.avgDaily};}).filter(x=>x.traffic!=null);
  const cablexTrafficOffenses=correlation(cablexOffenseRows.map(x=>x.traffic),cablexOffenseRows.map(x=>x.offenses));
  const requiredCells=rows.length*6;
  const presentCells=rows.reduce((sum,x)=>sum+['avgDaily','weightedOccupancy','avgTemp','employmentWorkplace','hectronicTransactions','offenses'].filter(k=>x[k]!=null).length,0);
  const completeness=presentCells/requiredCells*100;
  const measuredShare=(totalTraffic-estimatedTraffic)/Math.max(1,totalTraffic)*100;
  const freshness=96;
  const quality=Math.round(clamp(completeness*.55+measuredShare*.3+freshness*.15,0,100));
  const reliability=Math.round(clamp(quality*.45+confidenceScore(A.models.multifactorAll.r2,A.models.multifactorAll.n,'multifactor')*.35+68*.2,0,100));
  const available=rows.filter(x=>x.avgDaily!=null||x.weightedOccupancy!=null);
  const endMonth=available.at(-1).month,startMonth=available.at(-12)?.month||available[0].month;
  const pulseResult=calculatePulse(rows,startMonth,endMonth);
  return {rows,quality,reliability,pulse:pulseResult.pulse,pulseResult,estimatedTraffic,totalTraffic,completeness,measuredShare,trafficPayment,occupancyPayment,trafficOffenses,cablexTrafficOffenses,components:pulseResult.components,baselineTransactions:ep.totalTransactions2026+hc.totalTransactions,baselineRevenue:ep.totalRevenue2026+hc.totalRevenue,avgRevenue:(ep.totalRevenue2026+hc.totalRevenue)/Math.max(1,ep.totalTransactions2026+hc.totalTransactions)};
}
function initPulsePeriodControls(){
  const months=UM.rows.filter(x=>x.avgDaily!=null||x.weightedOccupancy!=null).map(x=>x.month);
  pulseFrom.innerHTML='';pulseTo.innerHTML='';
  months.forEach(m=>{pulseFrom.add(new Option(formatMonth(m),m));pulseTo.add(new Option(formatMonth(m),m));});
  pulseFrom.value=UM.pulseResult.startMonth;pulseTo.value=UM.pulseResult.endMonth;
  selectedPulsePeriod={from:pulseFrom.value,to:pulseTo.value};
}
function updatePulsePeriod(){
  let from=pulseFrom.value,to=pulseTo.value;
  if(from>to){[from,to]=[to,from];pulseFrom.value=from;pulseTo.value=to;}
  selectedPulsePeriod={from,to};
  UM.pulseResult=calculatePulse(UM.rows,from,to);UM.pulse=UM.pulseResult.pulse;UM.components=UM.pulseResult.components;
  renderUnifiedModel();renderInsights();
}
function applyPulsePreset(value){
  const months=UM.rows.filter(x=>x.avgDaily!=null||x.weightedOccupancy!=null).map(x=>x.month),last=months.length-1;
  if(value==='all'){pulseFrom.value=months[0];pulseTo.value=months[last];}
  else if(value==='year'){const y=months[last].slice(0,4);pulseFrom.value=months.find(m=>m.startsWith(y))||months[Math.max(0,last-11)];pulseTo.value=months[last];}
  else {const n=+value;pulseFrom.value=months[Math.max(0,last-n+1)];pulseTo.value=months[last];}
  updatePulsePeriod();
}
function renderUnifiedModel(){
  const r=UM.pulseResult,c=r.components;
  pulseScore.textContent=UM.pulse;
  pulseScale.textContent='indeks (običajno = 100)';
  pulsePeriodLabel.textContent=periodLabel(r.startMonth,r.endMonth);
  pulseStatus.textContent=pulseLabel(UM.pulse);
  const delta=UM.pulse-100;
  pulseExplanation.innerHTML=`<strong>${periodLabel(r.startMonth,r.endMonth)}:</strong> ${pulseLabel(UM.pulse)}. Indeks ${UM.pulse} pomeni približno <strong>${Math.abs(delta)} % ${delta>=0?'več':'manj'} skupne aktivnosti</strong> od običajnega primerljivega obdobja. Utrip Tržiča je sestavljen kazalnik splošne aktivnosti v občini. Upošteva promet, parkiranje, vreme, dogodke, turizem in druge razpoložljive podatke ter pokaže, kako živahno je bilo izbrano obdobje v primerjavi z običajnim stanjem. Višja vrednost pomeni več aktivnosti, nižja pa mirnejše obdobje.`;
  pulseComponents.innerHTML=Object.entries({traffic:'Promet',parking:'Parkiranje',payments:'Parkirnine',events:'Dogodki',tourism:'Turizem',weather:'Vreme'}).map(([k,label])=>`<div><span>${label}</span><strong>${c[k].score??'–'}</strong><small>običajno = 100</small></div>`).join('');
  dataQualityScore.textContent=`${UM.quality} %`; dataQualityExplanation.textContent=`Pokritost ključnih mesečnih podatkov ${nf1.format(UM.completeness)} %. ${UM.estimatedTraffic} od ${UM.totalTraffic} tednov prometa je ocenjenih z interpolacijo.`;
  modelReliabilityScore.textContent=`${UM.reliability} %`; modelReliabilityExplanation.textContent='Ocena združuje popolnost, delež dejanskih meritev in kakovost večfaktorskega modela. Ne pomeni gotovosti napovedi.';
  modelFactorCount.textContent='10 sklopov';
}
function paymentProjection(changePct){
  const tx=UM.baselineTransactions*changePct/100,rev=tx*UM.avgRevenue;
  return {transactions:tx,revenue:rev};
}
function paymentContext(changePct,reason){
  const p=paymentProjection(changePct);
  const sign=p.transactions>=0?'+':'';
  return `<div class="payment-context"><strong>Vpliv parkirnin v enotnem modelu:</strong> ${reason} pomeni orientacijsko ${sign}${nf0.format(p.transactions)} transakcij in ${p.revenue>=0?'+':''}${money.format(p.revenue)} prihodka v primerljivem skupnem obdobju. Ocena združuje EasyPark in HECTRONIC, brez dvojnega štetja, ter ohranja brezplačno prvo uro in dovolilnice kot ločene kategorije.</div>`;
}
function appendContext(id,html){const el=document.getElementById(id);if(el&&!el.querySelector('.payment-context'))el.insertAdjacentHTML('beforeend',html);}
function appendUnifiedContexts(){
  appendContext('trafficOutput',paymentContext(+trafficSlider.value*.55,'sprememba prometa, zmanjšana z elastičnostjo parkiranja'));
  const w=predictMulti(weatherParkingSelect.value,+weatherSlider.value),wm=weatherParkingSelect.value==='VSA PARKIRIŠČA'?A.models.multifactorAll:A.models.multifactorByParking[weatherParkingSelect.value]; appendContext('weatherOutput',paymentContext(((w-wm.baselineOccupancy)/Math.max(1,wm.baselineOccupancy))*35,'ocenjena sprememba zasedenosti zaradi vremena'));
  const er=employeeRange(+employeeSlider.value); appendContext('employeeOutput',paymentContext(((er[0]+er[1])/2)/Math.max(1,A.kpis.avgDailyTraffic)*100*18,'dodatna vozila v konici'));
  appendContext('employeeParkingOutput',paymentContext(+employeeParkingSlider.value/100*1.8,'sprememba delovno aktivnih in posledični pritisk na parkirišča'));
  appendContext('populationOutput',paymentContext(+populationSlider.value/100*1.1,'sprememba prebivalcev, prilagojena motorizaciji in načinu poti'));
  appendContext('paymentOutput',paymentContext(+paymentSlider.value,'neposredno izbrana sprememba števila parkirnin'));
  appendContext('jobsRevenueOutput',paymentContext(+jobsRevenueSlider.value/100*1.8,'sprememba delovnih mest'));
  appendContext('tourismOutput',paymentContext(+tourismSlider.value*.12,'turistični vpliv, močno zmanjšan zaradi majhnega deleža nastanitev v mestu Tržič'));
  appendContext('evOutput',paymentContext((+evEmployeeSlider.value/100*1.1)+(+evTouristSlider.value*.04)+(+evPopulationSlider.value/100*.6),'skupni vpliv zaposlenih, turistov in prebivalcev; EV ostaja ločen podporni dejavnik'));
}
function renderKpis(){
  const k=A.kpis, e=A.employment;
  const items=[
    ['Povprečno vozil na dan',nf0.format(k.avgDailyTraffic),`CABLEX · ${k.trafficYears}-letni tedenski podatki · glavna cesta v mesto Tržič in iz mesta Tržič`],
    ['Povprečna zasedenost',`${nf1.format(k.parkingAvg)} %`,'7 parkirišč okoli mestnega jedra · kapacitetno uteženo'],
    ['Skupna kapaciteta',`${nf0.format(k.totalParkingCapacity)} parkirnih mest`,'7 spremljanih parkirišč'],
    ['Delovna mesta v Občini Tržič',nf0.format(k.employmentLatest),'SURS · junij 2026'],
    ['Povprečna temperatura',`${nf1.format(k.averageTemperature)} °C`,`${nf0.format(k.rainDays)} dni z zaznanim dežjem`],
    [`Prebivalci mesta Tržič ${k.populationLatestYear}`,nf0.format(k.populationLatest),'samo naselje Tržič · ne celotna občina'],
    ['Turisti · zadnjih 12 mesecev',nf0.format(k.tourismGuestsLatest12),`${nf0.format(k.tourismOvernightsLatest12)} nočitev · celotna občina`],
    ['EV polnilnica Tržnica',nf0.format(k.evSessionsTotal),`${nf0.format(k.evEnergyTotal)} kWh · celotno obdobje`],
    ['Povprečna hitrost CABLEX',`${nf1.format(k.averageSpeed)} km/h`,'tehtano glede na strukturo vozil'],
    ['Prekrški · zadnjih 12 mesecev',nf0.format(O.latest12Total),`mesečno po ulicah · ${O.period.to}`]
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
  ['trafficSlider','parkingSelect','weatherSlider','weatherParkingSelect','employeeSlider','employeeParkingSlider','employeeParkingSelect','populationSlider','populationParkingSelect','paymentSlider','jobsRevenueSlider','tourismSlider','evEmployeeSlider','evTouristSlider','evPopulationSlider','hourlyParkingSelect'].forEach(id=>document.querySelector('#'+id).addEventListener('input',updateAll));
  document.querySelector('#questionForm').addEventListener('submit',e=>{e.preventDefault(); answerQuestion(document.querySelector('#questionInput').value);});
  document.querySelectorAll('.tab-button').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
  pulseApply.addEventListener('click',updatePulsePeriod);
  pulsePreset.addEventListener('change',()=>applyPulsePreset(pulsePreset.value));
}
function updateAll(){ updateTraffic(); updateWeather(); updateEmployees(); updateEmployeeParking(); updatePopulation(); updatePayments(); updateJobsRevenue(); updateTourism(); updateEV(); updateHourly(); appendUnifiedContexts(); }
function confidenceScore(r2,n,type='model'){
  if(type==='employee') return 52;
  if(type==='population') return 38;
  if(type==='payments') return 74;
  if(type==='date') return 62;
  if(type==='multifactor') return 58;
  if(type==='jobsRevenue') return 36;
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
  trafficOutput.innerHTML=`<p class="answer">Pri ${signed(change,' %')} prometa bi bila ocenjena zasedenost <strong>${name.toLowerCase()}</strong> ${nf1.format(r.after)} %.</p><div class="metric">${nf1.format(r.after)} %</div><p class="detail">Sprememba glede na osnovo ${nf1.format(r.base)} %: <strong>${signed(r.after-r.base,' odstotne točke')}</strong>.</p>${table}${confidenceBox(score,`${r.m.n} skupnih mesecev; R² ${r.m.r2.toFixed(2)}. Promet meri Cesto Ste Marie Aux Mines v obe smeri, v mesto Tržič in iz mesta Tržič, zato ne predstavlja vsega prometa v občini.`)}${whyBlock(['Uporabljena je zgodovinska povezava med mesečnim prometom CABLEX in zasedenostjo.',name==='VSA PARKIRIŠČA'?'Skupna vrednost je utežena glede na kapaciteto posameznega parkirišča.':'Izračun velja za izbrano parkirišče.','Promet pojasni le del sprememb; na parkiranje vplivajo tudi sezona, namen poti, dogodki in razporeditev delovnih dni.'])}`;
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
 const change=+paymentSlider.value; paymentSliderValue.textContent=signed(change,' %'); const p=A.parkingPayments.easyPark,h=A.parkingPayments.hectronic;
 const transactions=Math.round(p.totalTransactions2026*(1+change/100)); const revenue=p.totalRevenue2026*(1+change/100); const deltaRevenue=revenue-p.totalRevenue2026; const top=p.topCategory;
 paymentOutput.innerHTML=`<p class="answer">Ob ${signed(change,' %')} spremembi števila EasyPark parkirnin bi ob nespremenjeni strukturi parkiranja ocenjeni prihodek znašal približno <strong>${money.format(revenue)}</strong>.</p><div class="metric">${money.format(deltaRevenue)}</div><p class="detail">Ocenjena sprememba glede na ${money.format(p.totalRevenue2026)} in ${nf0.format(p.totalTransactions2026)} EasyPark parkirnin v letu 2026 do izvoza. Parkomati HECTRONIC so prikazani ločeno: od januarja 2023 do ${formatMonth(h.period.to)} je evidentiranih ${nf0.format(h.totalTransactions)} parkirnin in ${money.format(h.totalRevenue)} prihodkov.</p>${confidenceBox(confidenceScore(0,0,'payments'),`EasyPark povprečje ${nf2.format(p.observedRevenuePerTransaction)} € in HECTRONIC ${nf2.format(h.observedRevenuePerTransaction)} € na evidentirano parkirnino sta opazovani povprečji, ne cenik.`)}${whyBlock([`Največ EasyPark parkirnin ima kategorija ${top.category}: ${nf0.format(top.transactions)}, kar je ${nf1.format(top.transactions/p.totalTransactions2026*100)} % vseh evidentiranih EasyPark parkirnin.`,`HECTRONIC in EasyPark se ne seštevata kot število edinstvenih parkiranj, ker lahko predstavljata različna plačilna kanala, obdobja in kategorije.`,`Odlok določa okvir plačljivih površin, dokazil, dovolilnic, abonmajev in modrih con. Za natančen izračun po urah potrebujemo še veljavni sklep oziroma cenik po conah; povzetek trenutno navaja 0,40 € na uro in prvo uro brezplačno.`])}`;
}
function updateJobsRevenue(){
 const jobs=+jobsRevenueSlider.value; jobsRevenueSliderValue.textContent=`${jobs>=0?'+':''}${nf0.format(jobs)}`;
 const [vehLo,vehHi]=employeeRange(jobs); const lowVeh=Math.min(Math.abs(vehLo),Math.abs(vehHi)), highVeh=Math.max(Math.abs(vehLo),Math.abs(vehHi));
 const sign=jobs>=0?1:-1, workdays=220, paidShare=[0.10,0.25];
 const p=A.parkingPayments.easyPark,h=A.parkingPayments.hectronic;
 const eurLo=Math.min(p.observedRevenuePerTransaction,h.observedRevenuePerTransaction), eurHi=Math.max(p.observedRevenuePerTransaction,h.observedRevenuePerTransaction);
 const sessionsLo=Math.round(lowVeh*paidShare[0]*workdays), sessionsHi=Math.round(highVeh*paidShare[1]*workdays);
 const revenueLo=sign*sessionsLo*eurLo, revenueHi=sign*sessionsHi*eurHi;
 jobsRevenueOutput.innerHTML=`<p class="answer"><strong>${jobs>=0?'+':''}${nf0.format(jobs)} delovnih mest</strong> bi po zelo grobi verižni oceni pomenilo približno ${nf0.format(sign*lowVeh)}–${nf0.format(sign*highVeh)} dodatnih vozil v konici in okoli <strong>${nf0.format(sign*sessionsLo)}–${nf0.format(sign*sessionsHi)}</strong> dodatnih plačanih parkiranj na leto.</p><div class="metric">${money.format(Math.min(revenueLo,revenueHi))}–${money.format(Math.max(revenueLo,revenueHi))}</div><p class="detail">Ocenjena letna sprememba skupnih prihodkov plačilnih kanalov EasyPark in HECTRONIC za vsa spremljana plačljiva parkirišča. Kanala se v osnovnih statistikah ne seštevata kot edinstvena parkiranja; tukaj sta uporabljena samo kot razpon opazovanega prihodka na transakcijo.</p>${confidenceBox(confidenceScore(0,0,'jobsRevenue'),'Zanesljivost je nižja, ker nimamo povezave registrske oznake oziroma posameznega prihoda med CABLEX, zasedenostjo in plačilom. Uporabljeni so široki razponi: 45–70 vozil na 100 delovnih mest, 10–25 % uporabe plačljivih parkirišč in 220 delovnih dni.')}${whyBlock(['Vsako novo delovno mesto ne pomeni novega avtomobila; model upošteva hojo, skupne vožnje, javni prevoz in delo od doma.','Samo del dodatnih vozil parkira na spremljanih plačljivih parkiriščih; drugi parkirajo zasebno, brezplačno ali zunaj opazovanega območja.','Prihodek na parkiranje ni enak ceniku: prva ura je lahko brezplačna, trajanje je različno, obstajajo dovolilnice in abonmaji. Zato je rezultat razpon, ne ena natančna številka.'])}`;
}
function updateHourly(){
 const name=hourlyParkingSelect.value,p=A.parkingHourly.profiles[name],slots=p.slots;
 const friday=slots.filter(x=>x.weekday===4 && x.hour>=6 && x.hour<=12); const fridayAvg=friday.length?friday.reduce((a,x)=>a+x.average,0)/friday.length:null;
 const weekdayMorning=slots.filter(x=>x.weekday<5 && x.hour>=6 && x.hour<=12); const workAvg=weekdayMorning.reduce((a,x)=>a+x.average,0)/weekdayMorning.length;
 const diff=fridayAvg-workAvg; const statement=Math.abs(diff)<3?'je zelo podoben drugim delovnim dopoldnevom':diff>0?'je bolj zaseden od povprečnega delovnega dopoldneva':'ni bolj zaseden od povprečnega delovnega dopoldneva';
 hourlyOutput.innerHTML=`<div class="hourly-stat"><span>Povprečje 7-tedenskega profila</span><strong>${nf1.format(p.average)} %</strong><small>${name.replace(', Tržič','')} · ${nf0.format(p.sampleCount)} meritev</small></div><div class="hourly-stat"><span>Najvišji povprečni termin</span><strong>${p.peak.weekdayName}, ${String(p.peak.hour).padStart(2,'0')}:00</strong><small>${nf1.format(p.peak.average)} % zasedenosti</small></div><div class="hourly-stat"><span>Petek 6.00–12.00</span><strong>${nf1.format(fridayAvg)} %</strong><small>${statement}; razlika ${signed(diff,' t')}</small></div><div class="method-note"><strong>Pomembno:</strong> obdobje ${A.parkingHourly.period.from}–${A.parkingHourly.period.to} je precej boljše od enega tedna. Pri Tržnici podatki ne potrjujejo, da je petek dopoldne bolj poln kot druga delovna dopoldneva; preveriti je treba posamezen datum, dogodke, vreme in sezonske razmere.</div>`;
}
function normalizeText(s){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
function parseDateFromQuestion(text){
 let m=text.match(/\b(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})\b/); if(m)return `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
 m=text.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/); if(m)return `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`;
 const months={januar:1,februar:2,marec:3,april:4,maj:5,junij:6,julij:7,avgust:8,september:9,oktober:10,november:11,december:12};
 m=normalizeText(text).match(/\b(\d{1,2})\.?\s+(januar|februar|marec|april|maj|junij|julij|avgust|september|oktober|november|december)(?:ja|a|u)?\s+(\d{4})\b/);
 if(m)return `${m[3]}-${String(months[m[2]]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`; return null;
}
function dayName(date){return ['nedelja','ponedeljek','torek','sreda','četrtek','petek','sobota'][new Date(date+'T12:00:00').getDay()];}
function weatherForDate(date){
 const rows=[...(W.archive||[]),...(W.forecast||[])].filter(x=>x.timestamp.startsWith(date)); if(!rows.length)return null;
 return {temp:rows.reduce((a,x)=>a+(x.temperature_c??0),0)/rows.length, rain:rows.reduce((a,x)=>a+(x.precipitation_mm??0),0), bad:rows.filter(x=>x.is_bad_weather).length, category:[...new Set(rows.map(x=>x.weather_category).filter(Boolean))].slice(0,3).join(', ')};
}
function trafficForDate(date){return (T.records||[]).find(x=>x.date===date)||null;}
function monthlyParkingEstimate(date){
 const ym=date.slice(0,7), row=A.monthly.find(x=>x.month===ym&&x.weightedOccupancy!=null);
 if(row)return {value:row.weightedOccupancy,method:'mesečno kapacitetno uteženo povprečje vseh spremljanih parkirišč'};
 const m=+date.slice(5,7), rows=A.monthly.filter(x=>+x.month.slice(5,7)===m&&x.weightedOccupancy!=null);
 if(rows.length)return {value:rows.reduce((a,x)=>a+x.weightedOccupancy,0)/rows.length,method:'ocena iz povprečja istega meseca v razpoložljivih letih'};
 return null;
}
function dailyParkingPayments(date){
 const rows=(A.parkingPayments.daily||[]).filter(x=>x.date===date);
 if(!rows.length)return null;
 return {transactions:rows.reduce((a,x)=>a+(x.transactions||0),0),revenue:rows.reduce((a,x)=>a+(x.revenue||0),0)};
}
function dateAnalysis(date){
 const holiday=(H.holidays||[]).find(x=>x.date===date), events=(E.events||[]).filter(x=>x.date===date), weather=weatherForDate(date),traffic=trafficForDate(date),dn=dayName(date),parking=monthlyParkingEstimate(date),payments=dailyParkingPayments(date);
 const hasDaily=!!traffic+!!weather+!!payments; let score=35+hasDaily*11+(holiday?3:0)+(events.length?4:0)+(parking?8:0); score=clamp(score,30,82);
 let factual=`<span class="parsed">AI svetovalec · kaj se je zgodilo dne ${date.split('-').reverse().join('. ')}</span><p class="answer"><strong>${date.split('-').reverse().join('. ')} je bil ${dn}</strong>${holiday?` in praznik <strong>${holiday.name}</strong>`:''}.</p>`;
 factual+=traffic?`<div class="date-metrics"><div><span>Promet CABLEX</span><strong>${nf0.format(traffic.totalVehicles)}</strong><small>vozil v in iz Tržiča na merilnem odseku${traffic.isPartialDay?' · delni dan':''}</small></div>`:`<div class="date-metrics"><div><span>Promet CABLEX</span><strong>ni podatka</strong><small>dnevni niz se začne 15. 7. 2025</small></div>`;
 factual+=weather?`<div><span>Vreme</span><strong>${nf1.format(weather.temp)} °C</strong><small>${nf1.format(weather.rain)} mm padavin · ${weather.category||'brez opisa'}</small></div>`:`<div><span>Vreme</span><strong>ni podatka</strong><small>datum ni v naloženem vremenskem obdobju</small></div>`;
 factual+=parking?`<div><span>Vsa parkirišča</span><strong>${nf1.format(parking.value)} %</strong><small>${parking.method}; ni dnevna meritev</small></div>`:`<div><span>Vsa parkirišča</span><strong>ni ocene</strong><small>za mesec ni razpoložljive zasedenosti</small></div>`;
 factual+=payments?`<div><span>Pobrane parkirnine</span><strong>${nf0.format(payments.transactions)}</strong><small>${money.format(payments.revenue)} · EasyPark in parkomati</small></div></div>`:`<div><span>Pobrane parkirnine</span><strong>ni dnevnega podatka</strong><small>ko bo dodan dnevni izvoz, se podatek izpiše samodejno</small></div></div>`;
 factual+=events.length?`<p><strong>Dogodki:</strong> ${events.map(x=>x.title).join(', ')}.</p>`:`<p>V trenutno naloženem koledarju za ta datum ni evidentiranega dogodka. Koledar ni popoln zgodovinski arhiv.</p>`;
 const interpretation=[]; if(holiday)interpretation.push('praznik navadno zmanjša delovne migracije, vendar lahko poveča izletniški promet'); if(dn==='sobota'||dn==='nedelja')interpretation.push('vikend spremeni namen in čas poti'); if(weather&&weather.rain>1)interpretation.push('dež lahko poveča delež prihodov z avtomobilom, hkrati pa zmanjša obisk zunanjih dejavnosti'); if(events.length)interpretation.push('dogodek lahko lokalno poveča promet in parkiranje'); if(!interpretation.length)interpretation.push('datum nima prepoznanega posebnega prazničnega, vremenskega ali prireditvenega dejavnika');
 factual+=`<p class="detail"><strong>Razlaga dneva:</strong> ${interpretation.join('; ')}. Brez popolnih dnevnih podatkov ne trdimo, da je posamezen dejavnik povzročil izmerjeno stanje.</p>`;
 return factual+confidenceBox(score,'Ocena zanesljivosti temelji na tem, koliko dnevnih virov je za isti datum dejansko na voljo. Mesečna zasedenost parkirišč je samo približek, ne dnevna meritev.')+whyBlock(['CABLEX predstavlja vozila v obeh smereh na enem Cesti Ste Marie Aux Mines: v mesto Tržič in iz mesta Tržič.','Zasedenost vseh parkirišč je za izbrani datum mesečno oziroma sezonsko povprečje, dokler ne dobimo dolgoročnega dnevnega ali urnega izvoza.','Dnevnih parkirnin aplikacija ne ocenjuje iz mesečnega prihodka; manjkajoči podatek raje jasno označi.']);
}
function answerQuestion(value){
 const out=questionOutput; const date=/^\d{4}-\d{2}-\d{2}$/.test(value)?value:parseDateFromQuestion(value||'');
 out.classList.remove('empty');
 if(!date){out.innerHTML='<strong>Izberi datum.</strong><p>Ta različica svetovalca podpira samo vprašanje »Kaj se je zgodilo dne …?«.</p>';return;}
 out.innerHTML=dateAnalysis(date);
}
function switchTab(id){document.querySelectorAll('.tab-button').forEach(x=>x.classList.toggle('active',x.dataset.tab===id));document.querySelectorAll('.tab-content').forEach(x=>x.classList.toggle('active',x.id===id));}
function updateTourism(){
 const change=+tourismSlider.value; tourismSliderValue.textContent=signed(change,' %'); const baseGuests=TOUR.monthly.slice(-12).reduce((a,x)=>a+x.guests,0); const deltaGuests=baseGuests*change/100; const local=deltaGuests*TOUR.model.localExposureAssumption;
 const trafficPct=change*TOUR.model.localExposureAssumption*.18; const parkingPts=change*TOUR.model.localExposureAssumption*.06; const tx=(A.parkingPayments.easyPark.totalTransactions2026+A.parkingPayments.hectronic.totalTransactions)*(change/100)*TOUR.model.localExposureAssumption*.12; const avgRev=(A.parkingPayments.easyPark.observedRevenuePerTransaction+A.parkingPayments.hectronic.observedRevenuePerTransaction)/2; const rev=tx*avgRev;
 tourismOutput.innerHTML=`<p class="answer">Sprememba turistov za <strong>${signed(change,' %')}</strong> bi po konservativni oceni pomenila približno <strong>${signed(trafficPct,' %')}</strong> prometa na odseku CABLEX, ${signed(parkingPts,' odstotne točke')} zasedenosti spremljanih parkirišč in ${money.format(rev)} spremembe prihodka od parkiranja v primerljivem obdobju.</p><div class="metric">${nf0.format(Math.abs(local))} lokalno izpostavljenih obiskov</div><p class="detail">Model od spremembe ${nf0.format(Math.abs(deltaGuests))} gostov upošteva samo približno 10 % možnega vpliva na mesto Tržič. Dejansko je v kraju Tržič evidentiranih le ${nf1.format(TOUR.trzicPlaceShare*100)} % gostov po krajih nastanitve.</p>${confidenceBox(TOUR.model.confidence,`Korelacija gostov s prometom r=${nf2.format(TOUR.model.trafficCorrelation||0)} (n=${TOUR.model.trafficN}), z zasedenostjo r=${nf2.format(TOUR.model.parkingCorrelation||0)} (n=${TOUR.model.parkingN}). Korelacija ne dokazuje vzročnosti.`)}${whyBlock(['Več kot 90 % turistov je nastanjenih v drugih krajih občine, zato ni pravilno celotnega turističnega gibanja pripisati mestu Tržič.','Del gostov lahko vseeno obišče mestno jedro ali pelje skozi merilni odsek CABLEX, vendar tega iz turistične takse ne moremo neposredno izmeriti.','Prihodkovni učinek je ocena iz opaženega povprečnega prihodka EasyPark in HECTRONIC, ne napoved posamezne tarife ali trajanja parkiranja.'])}`;
}
function updateEV(){
 const de=+evEmployeeSlider.value, dt=+evTouristSlider.value, dp=+evPopulationSlider.value; evEmployeeSliderValue.textContent=`${de>=0?'+':''}${nf0.format(de)}`;evTouristSliderValue.textContent=signed(dt,' %');evPopulationSliderValue.textContent=`${dp>=0?'+':''}${nf0.format(dp)}`;
 const [elo,ehi]=employeeRange(de); const popCarsLo=dp*.28,popCarsHi=dp*.48; const touristBase=TOUR.monthly.slice(-12).reduce((a,x)=>a+x.guests,0); const touristCars=touristBase*dt/100*.10*.35; const carLo=elo+Math.min(popCarsLo,popCarsHi)+touristCars*.5, carHi=ehi+Math.max(popCarsLo,popCarsHi)+touristCars;
 const s=EV.scenario; const sessionsLo=carLo*s.newVehicleEVShareRange[0]*s.publicChargerUseRange[0],sessionsHi=carHi*s.newVehicleEVShareRange[1]*s.publicChargerUseRange[1]; const energyLo=sessionsLo*EV.avgKWhPerSession,energyHi=sessionsHi*EV.avgKWhPerSession;
 evOutput.innerHTML=`<p class="answer">Skupni scenarij bi na eni polnilnici na parkirišču <strong>Tržnica</strong> lahko pomenil približno <strong>${nf0.format(Math.min(sessionsLo,sessionsHi))}–${nf0.format(Math.max(sessionsLo,sessionsHi))} dodatnih polnjenj</strong> in ${nf0.format(Math.min(energyLo,energyHi))}–${nf0.format(Math.max(energyLo,energyHi))} kWh dodatne porabe v primerljivem obdobju.</p><div class="metric">1 polnilnica · Tržnica</div><p class="detail">Zgodovinsko je evidentiranih ${nf0.format(EV.totalSessions)} polnjenj in ${nf0.format(EV.totalEnergyKWh)} kWh, povprečno ${nf1.format(EV.avgKWhPerSession)} kWh na polnjenje.</p>${confidenceBox(EV.scenario.confidence,'Ocena uporablja razpon deleža električnih vozil in deleža uporabnikov, ki bi izbrali prav to javno polnilnico. Nimamo podatka o izvoru uporabnika, čakalnih vrstah ali zasebnem polnjenju.')}${whyBlock(['Rast prebivalcev, zaposlenih ali turistov ne pomeni sorazmerne rasti polnjenj; najprej mora nastati dodatna vožnja z električnim vozilom.','Uporabnik lahko polni doma, pri delodajalcu ali na drugi lokaciji, zato le majhen delež dodatnih EV doseže polnilnico Tržnica.','Ker je na voljo samo ena polnilnica, lahko njena zasedenost oziroma tehnična razpoložljivost omeji dejansko rast uporabe.'])}`;
}
function renderInsights(){
 const m=A.models.multifactorAll,e=A.models.employeeScenario,p=A.parkingPayments.easyPark,top=p.topCategory;
 const items=[
  `<strong>Prostorski obseg:</strong> CABLEX meri promet v smeri v mesto Tržič in iz mesta Tržič na Cesti Ste Marie Aux Mines; sedem parkirišč predstavlja okolico mestnega jedra. Rezultati predstavljajo samo mesto Tržič oziroma okolico mestnega jedra in ne celotne Občine Tržič.`,
  `<strong>Delovno aktivni:</strong> SURS mesečno kaže ${nf0.format(A.employment.latest.value)} oseb z delovnim mestom v Občini Tržič (${formatMonth(A.employment.latest.month)}). To niso nujno prebivalci Tržiča.`,
  `<strong>Korelacija zaposlenosti:</strong> mesečna povezava s prometom je šibka (r=${nf2.format(e.monthlyCorrelationTraffic)}, n=${e.monthlyCorrelationTrafficN}), zato model ohranja razpon 45–70 vozil na 100 delovno aktivnih in ga ne predstavlja kot dokazano vzročnost.`,
  `<strong>Urni profil:</strong> novi podatki po 3 urah zajemajo 29. 5.–17. 7. 2026. Sedem tednov je uporabnejših za primerjavo dni, še vedno pa niso večletni urni profil.`,
  `<strong>Parkirnine:</strong> EasyPark: ${top.category} predstavlja ${nf1.format(top.transactions/p.totalTransactions2026*100)} % vseh evidentiranih EasyPark parkirnin v letu 2026 do izvoza. To nakazuje močan pritisk oziroma uporabo območja ZD, vendar število transakcij samo po sebi še ne pove trajanja parkiranja.`,
  `<strong>HECTRONIC:</strong> od januarja 2023 je evidentiranih ${nf0.format(A.parkingPayments.hectronic.totalTransactions)} parkirnin in ${money.format(A.parkingPayments.hectronic.totalRevenue)} prihodkov; podatke vodimo ločeno od EasyParka, da ne ustvarimo dvojnega štetja.`,
  `<strong>Večfaktorski model:</strong> promet, vreme, sezona, delovni dnevi, vikendi in prazniki so vključeni v mesečni model parkirišč (R² ${m.r2.toFixed(2)}, n=${m.n}).`,
  `<strong>Interpolacija prometa:</strong> očitno nepopolne meritve med 20. 5. in 19. 8. 2024 so nadomeščene s sezonskimi ocenami iz primerljivih tednov drugih let. S tem je časovna vrsta neprekinjena, ocene pa so še vedno ločene od izmerjenih podatkov.`,
  `<strong>Parkirnine:</strong> novi podatki ločeno vključujejo EasyPark, HECTRONIC, brezplačno prvo uro, dovolilnice, povprečni čas parkiranja in posebne podatke za Dovžanovo sotesko. To izboljša razumevanje uporabe parkirišč, ne pomeni pa, da je vsaka transakcija enaka enemu vozilu ali eni plačljivi uri.`,
  `<strong>Ekstrapolacija:</strong> sliderji prikazujejo prihodnje ali hipotetične scenarije iz zgodovinskih razmerij. Ekstrapolacija je uporabna za preverjanje smeri in razpona učinkov, ne pa kot gotova napoved.`,
  `<strong>Enotni model parkirnin:</strong> EasyPark in HECTRONIC sta vključena v vse scenarijske analize kot dodatna posledica spremembe aktivnosti. Zgodovinska povezava HECTRONIC transakcij s prometom je r=${nf2.format(UM.trafficPayment.r)} (n=${UM.trafficPayment.n}), z zasedenostjo pa r=${nf2.format(UM.occupancyPayment.r)} (n=${UM.occupancyPayment.n}).`,
  `<strong>Utrip Tržiča:</strong> za obdobje ${periodLabel(UM.pulseResult.startMonth,UM.pulseResult.endMonth)} znaša indeks ${UM.pulse}, pri čemer 100 pomeni običajno aktivnost primerljivih koledarskih mesecev. Komponente: promet ${UM.components.traffic.score??'–'}, parkiranje ${UM.components.parking.score??'–'}, parkirnine ${UM.components.payments.score??'–'}, dogodki ${UM.components.events.score??'–'}, turizem ${UM.components.tourism.score??'–'} in vreme ${UM.components.weather.score??'–'}.`,
  `<strong>Kakovost in sledljivost:</strong> model razlikuje izmerjene, ocenjene in manjkajoče vrednosti. Ocenjeni prometni tedni niso prikazani kot dejanske meritve in zmanjšujejo skupno oceno zanesljivosti.`,
  `<strong>Prekrški:</strong> v zadnjih 12 mesecih je evidentiranih ${nf0.format(O.latest12Total)} prekrškov. Največ v celotnem obdobju beleži ${O.byStreet[0].street} (${nf0.format(O.byStreet[0].offenses)}). Povezava skupnega mesečnega števila prekrškov s prometom CABLEX je r=${nf2.format(UM.trafficOffenses.r)} (n=${UM.trafficOffenses.n}); gre za opisno povezavo, saj na število prekrškov vplivata tudi obseg in usmerjenost nadzora.`,
  `<strong>CABLEX in prekrški:</strong> merilno mesto CABLEX je na Cesti Ste Marie Aux Mines. Na tej ulici je v podatkovnem obdobju evidentiranih ${nf0.format(O.cablexStreet.total)} prekrškov; povezava tamkajšnjih mesečnih prekrškov s prometom na CABLEX je r=${nf2.format(UM.cablexTrafficOffenses.r)} (n=${UM.cablexTrafficOffenses.n}) in ne dokazuje vzročnosti.`
 ]; insightList.innerHTML=items.map(x=>`<div class="insight">${x}</div>`).join('');
}
function renderFacts(){
 const p=A.parkingPayments.easyPark,top=p.topCategory; const peak=TOUR.monthly.reduce((a,x)=>x.guests>a.guests?x:a,TOUR.monthly[0]); const evPeak=EV.annual.filter(x=>x.sessions).reduce((a,x)=>x.sessions>a.sessions?x:a);
 const items=[
  `<strong>ZD Tržič:</strong> kategorija ${top.category} predstavlja ${nf1.format(top.transactions/p.totalTransactions2026*100)} % vseh evidentiranih EasyPark parkirnin v letu 2026 do izvoza. To kaže veliko uporabo območja, ne pa nujno najdaljšega parkiranja.`,
  `<strong>Turizem:</strong> največ gostov v mesečnem nizu je bilo ${formatMonth(peak.month)}: ${nf0.format(peak.guests)} gostov in ${nf0.format(peak.overnights)} nočitev.`,
  `<strong>Kraj Tržič:</strong> po podatkih o krajih nastanitve je v Tržiču evidentiranih ${nf0.format(TOUR.trzicPlaceGuests)} od ${nf0.format(TOUR.allPlaceGuests)} gostov oziroma ${nf1.format(TOUR.trzicPlaceShare*100)} %. Zato večine turističnega učinka ne smemo avtomatsko pripisati mestnemu jedru.`,
  `<strong>EV Tržnica:</strong> največ polnjenj je bilo leta ${evPeak.year}: ${nf0.format(evPeak.sessions)}. Podatki zajemajo samo eno polnilnico, zato trend lahko odraža tudi razpoložljivost ali spremembo sistema.`,
  `<strong>Povprečno polnjenje:</strong> skozi celotno obdobje znaša približno ${nf1.format(EV.avgKWhPerSession)} kWh na evidentirano polnjenje.`,
  `<strong>Petek na Tržnici:</strong> sedemtedenski 3-urni profil ne potrjuje, da je petek dopoldne praviloma bolj zaseden od drugih delovnih dopoldnevov.`,
  `<strong>Prekrški po ulicah:</strong> največ jih je v celotnem obdobju na lokaciji ${O.byStreet[0].street} (${nf0.format(O.byStreet[0].offenses)}), sledita ${O.byStreet[1].street} (${nf0.format(O.byStreet[1].offenses)}) in ${O.byStreet[2].street} (${nf0.format(O.byStreet[2].offenses)}).`,
  `<strong>Cesta Ste Marie Aux Mines:</strong> tu je nameščen CABLEX in evidentiranih ${nf0.format(O.cablexStreet.total)} prekrškov. To omogoča prostorsko primerjavo, vendar ne pomeni, da je promet sam povzročil prekrške.`
 ]; document.querySelector('#factList').innerHTML=items.map(x=>`<div class="insight">${x}</div>`).join('');
}
function renderCharts(){
 const months=A.monthly.filter(x=>x.avgDaily!=null||x.weightedOccupancy!=null); Chart.defaults.font.family='Inter,system-ui,sans-serif'; Chart.defaults.color='#52636d';
 new Chart(trendChart,{type:'line',data:{labels:months.map(x=>x.month),datasets:[{label:'Povp. vozil/dan',data:months.map(x=>x.avgDaily),yAxisID:'y',borderColor:'#1769d2',backgroundColor:'rgba(23,105,210,.10)',tension:.25,borderWidth:3,spanGaps:true,pointStyle:months.map(x=>x.trafficEstimated?'triangle':'circle'),pointRadius:months.map(x=>x.trafficEstimated?6:3)},{label:'Zasedenost (%)',data:months.map(x=>x.weightedOccupancy),yAxisID:'y1',borderColor:'#f09a22',backgroundColor:'rgba(240,154,34,.10)',tension:.25,borderWidth:3,spanGaps:true}]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},scales:{y:{grid:{color:'#edf1f5'}},y1:{position:'right',min:0,max:100,grid:{drawOnChartArea:false}}},plugins:{legend:{position:'bottom'}}}});
 const pm=A.models.parkingByName,names=Object.keys(pm).filter(n=>n!=='VSA PARKIRIŠČA'); new Chart(parkingChart,{type:'bar',data:{labels:names.map(n=>n.replace(', Tržič','')),datasets:[{data:names.map(n=>pm[n].baselineOccupancy),backgroundColor:'#1769d2'}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',scales:{x:{min:0,max:100,grid:{color:'#edf1f5'}}},plugins:{legend:{display:false}}}});
 const speeds=A.trafficSpeed.vehicleTypes; new Chart(speedChart,{type:'bar',data:{labels:speeds.map(x=>x.name),datasets:[{data:speeds.map(x=>x.averageSpeed),backgroundColor:'#69aaf5'}]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{min:0,max:55,grid:{color:'#edf1f5'}}},plugins:{legend:{display:false}}}});
 const emp=A.employment.monthly; new Chart(employmentChart,{type:'line',data:{labels:emp.map(x=>x.month),datasets:[{label:'Delovno aktivni',data:emp.map(x=>x.value),borderColor:'#1769d2',backgroundColor:'rgba(23,105,210,.10)',fill:true,tension:.25,borderWidth:3}]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{grid:{color:'#edf1f5'}}},plugins:{legend:{display:false}}}});
 const counts=A.parkingPayments.easyPark.counts.filter(x=>x.transactions>=500).sort((a,b)=>b.transactions-a.transactions); new Chart(paymentChart,{type:'bar',data:{labels:counts.map(x=>x.category),datasets:[{data:counts.map(x=>x.transactions),backgroundColor:'#69aaf5'}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',scales:{x:{grid:{color:'#edf1f5'}}},plugins:{legend:{display:false}}}});
 const offenseMonths=O.monthly; new Chart(offensesTrendChart,{type:'line',data:{labels:offenseMonths.map(x=>x.month),datasets:[{label:'Prekrški',data:offenseMonths.map(x=>x.offenses),borderColor:'#b14b3c',backgroundColor:'rgba(177,75,60,.10)',fill:true,tension:.22,borderWidth:3,pointRadius:2}]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{beginAtZero:true,grid:{color:'#edf1f5'}}},plugins:{legend:{display:false}}}});
 const streetRows=O.byStreet; new Chart(offensesStreetChart,{type:'bar',data:{labels:streetRows.map(x=>x.street),datasets:[{data:streetRows.map(x=>x.offenses),backgroundColor:'#b14b3c'}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',scales:{x:{beginAtZero:true,grid:{color:'#edf1f5'}}},plugins:{legend:{display:false}}}});
}
init().catch(e=>{document.body.innerHTML=`<main style="padding:40px"><h1>Napaka pri nalaganju podatkov</h1><p>${e.message}</p><p>Preveri mapo <code>data-js</code> in uporabi Ctrl + F5.</p></main>`});

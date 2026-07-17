const nf0 = new Intl.NumberFormat('sl-SI', { maximumFractionDigits: 0, useGrouping: true });
const nf1 = new Intl.NumberFormat('sl-SI', { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: true });
const nf2 = new Intl.NumberFormat('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true });
const money = new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true });
const signed = (v, unit='') => `${v >= 0 ? '+' : ''}${nf1.format(v)}${unit}`;
const clamp = (v,min,max)=>Math.min(max,Math.max(min,v));
let A, H, E, W, T;

async function init(){
  const load=(p)=>fetch(p).then(r=>{if(!r.ok) throw new Error(p); return r.json();});
  [A,H,E,W,T] = await Promise.all([
    load('./data/analysis.json?v=0.53'), load('./data/holidays.json?v=0.53'),
    load('./data/events.json?v=0.53'), load('./data/weather.json?v=0.53'),
    load('./data/traffic-daily.json?v=0.53')
  ]);
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
    ['Parkomati od 2023',nf0.format(k.hectronicTransactions2023plus),`${money.format(k.hectronicRevenue2023plus)} evidentiranih prihodkov`],
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
  if(type==='payments') return 74;
  if(type==='date') return 62;
  if(type==='multifactor') return 58;
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
 const change=+paymentSlider.value; paymentSliderValue.textContent=signed(change,' %'); const p=A.parkingPayments.easyPark,h=A.parkingPayments.hectronic;
 const transactions=Math.round(p.totalTransactions2026*(1+change/100)); const revenue=p.totalRevenue2026*(1+change/100); const deltaRevenue=revenue-p.totalRevenue2026; const top=p.topCategory;
 paymentOutput.innerHTML=`<p class="answer">Ob ${signed(change,' %')} spremembi števila EasyPark parkirnin bi ob nespremenjeni strukturi parkiranja ocenjeni prihodek znašal približno <strong>${money.format(revenue)}</strong>.</p><div class="metric">${money.format(deltaRevenue)}</div><p class="detail">Ocenjena sprememba glede na ${money.format(p.totalRevenue2026)} in ${nf0.format(p.totalTransactions2026)} EasyPark parkirnin v letu 2026 do izvoza. Parkomati HECTRONIC so prikazani ločeno: od januarja 2023 do ${formatMonth(h.period.to)} je evidentiranih ${nf0.format(h.totalTransactions)} parkirnin in ${money.format(h.totalRevenue)} prihodkov.</p>${confidenceBox(confidenceScore(0,0,'payments'),`EasyPark povprečje ${nf2.format(p.observedRevenuePerTransaction)} € in HECTRONIC ${nf2.format(h.observedRevenuePerTransaction)} € na evidentirano parkirnino sta opazovani povprečji, ne cenik.`)}${whyBlock([`Največ EasyPark parkirnin ima kategorija ${top.category}: ${nf0.format(top.transactions)}, kar je ${nf1.format(top.transactions/p.totalTransactions2026*100)} % vseh evidentiranih EasyPark parkirnin.`,`HECTRONIC in EasyPark se ne seštevata kot število edinstvenih parkiranj, ker lahko predstavljata različna plačilna kanala, obdobja in kategorije.`,`Odlok določa okvir plačljivih površin, dokazil, dovolilnic, abonmajev in modrih con. Za natančen izračun po urah potrebujemo še veljavni sklep oziroma cenik po conah; povzetek trenutno navaja 0,40 € na uro in prvo uro brezplačno.`])}`;
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
function dateAnalysis(date,forcedRain=false,forcedEvent=false){
 const holiday=(H.holidays||[]).find(x=>x.date===date), events=(E.events||[]).filter(x=>x.date===date), weather=weatherForDate(date),traffic=trafficForDate(date),dn=dayName(date);
 const factors=[]; let effect=0;
 if(holiday){factors.push(`praznik: ${holiday.name}`); effect-=12;}
 if(dn==='sobota'||dn==='nedelja'){factors.push('vikend');effect-=8;} else factors.push('delovni dan');
 if(events.length||forcedEvent){factors.push(`${events.length||1} dogodek oziroma velika prireditev`);effect+=10;}
 if((weather&&weather.rain>1)||forcedRain){factors.push('dež oziroma slabo vreme');effect+=(events.length||forcedEvent)?3:-3;}
 const conf=confidenceScore(0,0,'date')-(forcedEvent?7:0)-(traffic?0:8);
 let factual=`<p><strong>${date.split('-').reverse().join('. ')} je ${dn}</strong>${holiday?` in praznik <strong>${holiday.name}</strong>`:''}.</p>`;
 factual+=events.length?`<p>Koledar vsebuje: ${events.map(x=>`<strong>${x.title}</strong>`).join(', ')}.</p>`:`<p>V trenutno naloženem koledarju za ta datum ni dogodka. To ne dokazuje, da dogodka ni bilo, ker koledar ni popoln zgodovinski arhiv.</p>`;
 factual+=weather?`<p>Vremenski podatki: povprečno ${nf1.format(weather.temp)} °C, ${nf1.format(weather.rain)} mm padavin; prevladujoče: ${weather.category||'ni opisa'}.</p>`:`<p>Za ta datum nimamo urnega vremenskega zapisa v trenutnem podatkovnem obdobju.</p>`;
 factual+=traffic?`<p>CABLEX je evidentiral ${nf0.format(traffic.totalVehicles)} vozil${traffic.isPartialDay?' (delni dan)':''}.</p>`:`<p>Za ta datum nimamo dnevnega CABLEX zapisa; dnevni niz se začne 15. 7. 2025.</p>`;
 return `<span class="parsed">AI svetovalec · analiza datuma in več dejavnikov</span>${factual}<p class="answer">Ocena modela: kombinacija dejavnikov (${factors.join(', ')}) bi glede na običajen delovni dan lahko pomenila približno <strong>${signed(effect,' %')}</strong> spremembe prometnega oziroma parkirnega pritiska. To je usmeritvena ocena, ne izmerjen učinek.</p>${confidenceBox(clamp(conf,30,78),`Zanesljivost je omejena z razpoložljivostjo dnevnega prometa, urnega vremena, dogodkov in urne zasedenosti za isti datum.`)}${whyBlock(['Praznik ali vikend praviloma zmanjšata delovne migracije, vendar lahko povečata izletniški ali prireditveni promet.','Dež lahko zmanjša hojo in kolesarjenje, vendar učinek ni vedno enosmeren: ob veliki prireditvi se lahko poveča prihod z avtomobilom.','Model ne izmišljuje odstotka iz zgodovine, če nimamo primerljivih dnevnih podatkov; zato jasno loči dejstva in scenarijsko oceno.'])}`;
}
function fridayParkingAnswer(){
 const name='Tržnica, Tržič',p=A.parkingHourly.profiles[name],slots=p.slots;
 const fri=slots.filter(x=>x.weekday===4&&x.hour>=6&&x.hour<=12),wd=slots.filter(x=>x.weekday<5&&x.hour>=6&&x.hour<=12);
 const fa=fri.reduce((a,x)=>a+x.average,0)/fri.length,wa=wd.reduce((a,x)=>a+x.average,0)/wd.length,d=fa-wa;
 return `<span class="parsed">AI svetovalec · preverjanje trditve v 7-tedenskih urnih podatkih</span><p class="answer">Podatki trenutno <strong>ne potrjujejo</strong>, da je Tržnica ob petkih dopoldne praviloma bolj polna.</p><div class="metric">${nf1.format(fa)} %</div><p class="detail">Petek 6.00–12.00; povprečje vseh delovnih dopoldnevov je ${nf1.format(wa)} %, razlika ${signed(d,' odstotne točke')}.</p>${confidenceBox(68,'Primerjava temelji na približno sedmih tednih in 3-urnih intervalih, zato je uporabna za preverjanje kratkoročnega vzorca, ne pa za večletni sklep.')}${whyBlock(['Možno je, da je bil zelo poln posamezen petek, vendar povprečje petkov ni višje od drugih delovnih dopoldnevov.','Za razlago posameznega petka potrebujemo točen datum; nato lahko preverimo vreme, praznik, koledar dogodkov in dnevni promet.','Tržnica je že sicer visoko zasedena, zato subjektivni občutek polnosti lahko nastane tudi brez posebnega petkovega učinka.'])}`;
}
function multifactorFutureAnswer(q){
 const date=parseDateFromQuestion(q)||'2026-07-20'; const t=normalizeText(q); return dateAnalysis(date,t.includes('dez')||t.includes('dezev'),t.includes('prired')||t.includes('dogodek'));
}
function answerQuestion(q){
 const out=questionOutput;if(!q.trim()){out.textContent='Vpiši vprašanje.';return;} const text=normalizeText(q),date=parseDateFromQuestion(q); const numMatch=text.match(/([+-]?\d[\d.]*)/); const num=numMatch?parseInt(numMatch[1].replaceAll('.','')):null; out.classList.remove('empty');
 if((text.includes('petk')||text.includes('petek'))&&text.includes('trznic')) out.innerHTML=fridayParkingAnswer();
 else if(date&&(text.includes('kaj je bilo')||text.includes('na dan')||text.includes('zgodilo'))) out.innerHTML=dateAnalysis(date);
 else if((text.includes('dez')||text.includes('vreme'))&&(text.includes('prired')||text.includes('dogodek'))) out.innerHTML=multifactorFutureAnswer(q);
 else if(text.includes('prebival')){populationSlider.value=clamp(num??500,-1500,2000);populationParkingSelect.value='VSA PARKIRIŠČA';updatePopulation();out.innerHTML=`<span class="parsed">AI svetovalec · prebivalstvo mesta → promet → parkirišča</span>${populationOutput.innerHTML}`;}
 else if(text.includes('zaposlen')||text.includes('delovno aktiv')){employeeParkingSlider.value=clamp(num??100,-500,1000);employeeParkingSelect.value='VSA PARKIRIŠČA';updateEmployeeParking();out.innerHTML=`<span class="parsed">AI svetovalec · delovno aktivni v Občini Tržič → parkirišča</span>${employeeParkingOutput.innerHTML}`;}
 else if(text.includes('parkirnin')||text.includes('prihodek')){paymentSlider.value=clamp(num??10,-30,50);updatePayments();out.innerHTML=`<span class="parsed">AI svetovalec · parkirnine → prihodek in pravni kontekst</span>${paymentOutput.innerHTML}`;}
 else if(text.includes('vreme')||text.includes('dez')||text.includes('slabo')){weatherSlider.value=text.includes('zelo')?100:75;weatherParkingSelect.value='VSA PARKIRIŠČA';updateWeather();out.innerHTML=`<span class="parsed">AI svetovalec · vreme + sezona + koledar → parkirišča</span>${weatherOutput.innerHTML}`;}
 else if(text.includes('promet')){trafficSlider.value=clamp(num??20,-30,50);parkingSelect.value='VSA PARKIRIŠČA';updateTraffic();out.innerHTML=`<span class="parsed">AI svetovalec · promet → vsa parkirišča</span>${trafficOutput.innerHTML}`;}
 else out.innerHTML='<strong>Vprašanja še ne morem dovolj zanesljivo pretvoriti v model.</strong><p>Dodaj datum ali omeni prebivalce, delovno aktivne, promet, vreme, dogodek, praznik, parkirišče ali parkirnine.</p>';
}
function renderInsights(){
 const m=A.models.multifactorAll,e=A.models.employeeScenario,p=A.parkingPayments.easyPark,top=p.topCategory;
 const items=[
  `<strong>Prostorski obseg:</strong> CABLEX meri glavno cesto proti mestu Tržič; sedem parkirišč predstavlja okolico mestnega jedra. Rezultatov ne razlagamo kot stanje celotne Občine Tržič.`,
  `<strong>Delovno aktivni:</strong> SURS mesečno kaže ${nf0.format(A.employment.latest.value)} oseb z delovnim mestom v Občini Tržič (${formatMonth(A.employment.latest.month)}). To niso nujno prebivalci Tržiča.`,
  `<strong>Korelacija zaposlenosti:</strong> mesečna povezava s prometom je šibka (r=${nf2.format(e.monthlyCorrelationTraffic)}, n=${e.monthlyCorrelationTrafficN}), zato model ohranja razpon 45–70 vozil na 100 delovno aktivnih in ga ne predstavlja kot dokazano vzročnost.`,
  `<strong>Urni profil:</strong> novi podatki po 3 urah zajemajo 29. 5.–17. 7. 2026. Sedem tednov je uporabnejših za primerjavo dni, še vedno pa niso večletni urni profil.`,
  `<strong>Parkirnine:</strong> EasyPark: ${top.category} predstavlja ${nf1.format(top.transactions/p.totalTransactions2026*100)} % vseh evidentiranih EasyPark parkirnin v letu 2026 do izvoza. To nakazuje močan pritisk oziroma uporabo območja ZD, vendar število transakcij samo po sebi še ne pove trajanja parkiranja.`,
  `<strong>HECTRONIC:</strong> od januarja 2023 je evidentiranih ${nf0.format(A.parkingPayments.hectronic.totalTransactions)} parkirnin in ${money.format(A.parkingPayments.hectronic.totalRevenue)} prihodkov; podatke vodimo ločeno od EasyParka, da ne ustvarimo dvojnega štetja.`,
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

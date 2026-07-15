const fmt = new Intl.NumberFormat('sl-SI');
const pct = v => `${v >= 0 ? '+' : ''}${v.toFixed(1).replace('.', ',')} %`;
const clamp = (v,min,max)=>Math.min(max,Math.max(min,v));
let A;

async function init(){
  A = await fetch('./data/analysis.json').then(r=>{if(!r.ok)throw new Error('analysis.json'); return r.json();});
  renderKpis(); renderInputs(); renderInsights(); renderCharts(); bind();
}
function renderKpis(){
 const k=A.kpis;
 const items=[
  ['Povprečno vozil na dan',fmt.format(k.avgDailyTraffic),'CABLEX, brez robnih nepopolnih dni'],
  ['Delovniški promet',fmt.format(k.weekdayAvg),`${fmt.format(k.weekdayAvg-k.weekendAvg)} več kot ob vikendu`],
  ['Povprečna zasedenost',`${k.parkingAvg.toFixed(1).replace('.',',')} %`,'vsa parkirišča, 2023–2026'],
  ['Delovno aktivni 2025',fmt.format(k.employee2025),`${pct(k.employeeChange2023to2025)} glede na 2023`],
  ['Povprečna temperatura',`${k.averageTemperature.toFixed(1).replace('.',',')} °C`,`${fmt.format(k.rainDays)} dni z zaznanim dežjem v arhivu`],
  ['Prebivalci 2025',k.population2025 ? fmt.format(k.population2025) : '—',k.population2025 ? 'Občina Tržič' : k.populationNote],
  ['Povprečna hitrost CABLEX',`${k.averageSpeed.toFixed(1).replace('.',',')} km/h`,'tehtano glede na strukturo vozil']
 ];
 document.querySelector('#kpiGrid').innerHTML=items.map(x=>`<div class="kpi ${x[1]==='—'?'missing':''}"><span>${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></div>`).join('');
}
function renderInputs(){
 const names=Object.keys(A.models.parkingByName);
 const sel=document.querySelector('#parkingSelect');
 const empSel=document.querySelector('#employeeParkingSelect');
 const popSel=document.querySelector('#populationParkingSelect');
 names.forEach(n=>{ sel.add(new Option(n,n)); empSel.add(new Option(n,n)); popSel.add(new Option(n,n)); });
 const preferred=names.find(n=>n.includes('Zdravstveni'))||names[0];
 sel.value=preferred; empSel.value=preferred; popSel.value=preferred;
 updateAll();
}
function bind(){
 ['trafficSlider','parkingSelect','weatherSlider','employeeSlider','employeeParkingSlider','employeeParkingSelect','populationSlider','populationParkingSelect'].forEach(id=>document.querySelector('#'+id).addEventListener('input',updateAll));
}
function updateAll(){ updateTraffic(); updateWeather(); updateEmployees(); updateEmployeeParking(); updatePopulation(); }
function confidence(r2,n){ if(n<8||r2<.08)return 'Nizka zanesljivost'; if(r2<.3)return 'Srednja zanesljivost'; return 'Višja zanesljivost'; }
function updateTraffic(){
 const change=+document.querySelector('#trafficSlider').value; document.querySelector('#trafficSliderValue').textContent=pct(change);
 const name=document.querySelector('#parkingSelect').value,m=A.models.parkingByName[name];
 const newTraffic=m.baselineTraffic*(1+change/100); const estimated=clamp(m.intercept+m.slope*newTraffic,0,100); const diff=estimated-m.baselineOccupancy;
 const direction=diff>0.4?'povečala':diff<-.4?'zmanjšala':'ostala približno enaka';
 document.querySelector('#trafficOutput').innerHTML=`<p class="answer">Pri ${pct(change)} prometa bi se mesečna zasedenost parkirišča <strong>${name}</strong> po trenutnem modelu ${direction}.</p><div class="metric">${estimated.toFixed(1).replace('.',',')} %</div><p class="detail">Ocena spremembe glede na osnovo ${m.baselineOccupancy.toFixed(1).replace('.',',')} %: <strong>${pct(diff)}</strong>. Model temelji na ${m.n} skupnih mesecih prometa in parkiranja.</p><span class="confidence">${confidence(m.r2,m.n)} · R² ${m.r2.toFixed(2)}</span>`;
}
function weatherLabel(v){return v<=-75?'zelo dobro':v<=-25?'dobro':v<25?'običajno':v<75?'slabo':'zelo slabo'}
function updateWeather(){
 const val=+document.querySelector('#weatherSlider').value; const label=weatherLabel(val); document.querySelector('#weatherSliderValue').textContent=label;
 const w=A.models.weatherComparison; const base=(w.goodWeatherOccupancy+w.badWeatherOccupancy)/2; const fullDiff=w.badWeatherOccupancy-w.goodWeatherOccupancy; const estimated=clamp(base+(val/100)*fullDiff/2,0,100);
 const empirical=fullDiff>0?`V bolj slabih mesecih je bila zasedenost v povprečju za ${Math.abs(fullDiff).toFixed(1).replace('.',',')} odstotne točke višja.`:`V bolj slabih mesecih je bila zasedenost v povprečju za ${Math.abs(fullDiff).toFixed(1).replace('.',',')} odstotne točke nižja.`;
 document.querySelector('#weatherOutput').innerHTML=`<p class="answer">Scenarij <strong>${label} vreme</strong> trenutno ne kaže velikega samostojnega vpliva na mesečno zasedenost.</p><div class="metric">${estimated.toFixed(1).replace('.',',')} %</div><p class="detail">${empirical} Razlika je majhna in jo lahko pojasnjujejo sezona, prazniki ter drugi dejavniki.</p><span class="confidence">Nizka do srednja zanesljivost · 13 skupnih mesecev</span>`;
}
function updateEmployees(){
 const change=+document.querySelector('#employeeSlider').value; document.querySelector('#employeeSliderValue').textContent=pct(change);
 const m=A.models.employeeScenario; const trafficChange=change*m.assumedTrafficElasticity; const base=A.kpis.weekdayAvg; const estimated=Math.round(base*(1+trafficChange/100));
 document.querySelector('#employeeOutput').innerHTML=`<p class="answer">Pri ${pct(change)} zaposlenih model ocenjuje približno <strong>${pct(trafficChange)}</strong> spremembo delovniškega prometa.</p><div class="metric">${fmt.format(estimated)}</div><p class="detail">ocenjenih vozil na običajen delovni dan, glede na osnovo ${fmt.format(base)}. ${m.note}</p><span class="confidence">Scenarijska predpostavka · ne statistično dokazana povezava</span>`;
}
function updateEmployeeParking(){
 const change=+document.querySelector('#employeeParkingSlider').value;
 document.querySelector('#employeeParkingSliderValue').textContent=pct(change);
 const name=document.querySelector('#employeeParkingSelect').value;
 const parking=A.models.parkingByName[name];
 const employee=A.models.employeeScenario;
 const trafficChange=change*employee.assumedTrafficElasticity;
 const newTraffic=parking.baselineTraffic*(1+trafficChange/100);
 const estimated=clamp(parking.intercept+parking.slope*newTraffic,0,100);
 const diff=estimated-parking.baselineOccupancy;
 const direction=diff>0.4?'povečala':diff<-.4?'zmanjšala':'ostala približno enaka';
 document.querySelector('#employeeParkingOutput').innerHTML=`<p class="answer">Pri ${pct(change)} zaposlenih bi se delovniški promet po predpostavki spremenil za ${pct(trafficChange)}, zasedenost parkirišča <strong>${name}</strong> pa bi se ${direction}.</p><div class="metric">${estimated.toFixed(1).replace('.',',')} %</div><p class="detail">Ocenjena sprememba glede na osnovo ${parking.baselineOccupancy.toFixed(1).replace('.',',')} % je <strong>${pct(diff)}</strong>. Rezultat združuje dve negotovi povezavi in je zato predvsem scenarijski.</p><span class="confidence">Nizka zanesljivost · verižna scenarijska ocena</span>`;
}
function updatePopulation(){
 const change=+document.querySelector('#populationSlider').value;
 document.querySelector('#populationSliderValue').textContent=`${change>=0?'+':''}${fmt.format(change)}`;
 const name=document.querySelector('#populationParkingSelect').value;
 const parking=A.models.parkingByName[name];
 const model=A.models.populationScenario;
 const populationPercent=change/model.baselinePopulation*100;
 const trafficChange=populationPercent*model.assumedTrafficElasticity;
 const newDailyTraffic=A.kpis.avgDailyTraffic*(1+trafficChange/100);
 const newMonthlyTraffic=parking.baselineTraffic*(1+trafficChange/100);
 const estimatedOccupancy=clamp(parking.intercept+parking.slope*newMonthlyTraffic,0,100);
 const occupancyDiff=estimatedOccupancy-parking.baselineOccupancy;
 document.querySelector('#populationOutput').innerHTML=`<p class="answer">Sprememba za <strong>${change>=0?'+':''}${fmt.format(change)} prebivalcev</strong> pomeni ${pct(populationPercent)} prebivalstva. Po scenarijski predpostavki bi se promet spremenil za približno <strong>${pct(trafficChange)}</strong>.</p><div class="metric">${fmt.format(Math.round(newDailyTraffic))}</div><p class="detail">ocenjenih vozil na povprečen dan. Zasedenost parkirišča <strong>${name}</strong> bi bila približno ${estimatedOccupancy.toFixed(1).replace('.',',')} %, kar je ${pct(occupancyDiff)} glede na osnovo. ${model.note}</p><span class="confidence">Nizka zanesljivost · dolgoročni scenarij prostorskega načrtovanja</span>`;
}

function renderInsights(){
 const t=A.models.trafficToParking,w=A.models.weatherComparison,k=A.kpis;
 const holiday=k.holidayTrafficAvg?`Na dela proste praznike je bilo povprečno ${fmt.format(k.holidayTrafficAvg)} vozil, običajen delovnik pa ${fmt.format(k.regularWeekdayTrafficAvg)}.`:'Praznična primerjava še ni na voljo.';
 const items=[
  `<strong>Promet ↔ parkiranje:</strong> povezava je pozitivna, vendar zmerna (R² ${t.r2.toFixed(2)}). Več prometa je praviloma povezano z večjo zasedenostjo, vendar promet pojasni le del razlik.`,
  `<strong>Vreme ↔ parkiranje:</strong> razlika med boljšimi in slabšimi meseci je ${Math.abs(w.difference).toFixed(1).replace('.',',')} odstotne točke. To je premajhno za trden sklep brez dnevnih podatkov parkirišč.`,
  `<strong>Delovni dan ↔ vikend:</strong> delovniški promet je v povprečju ${pct((k.weekdayAvg/k.weekendAvg-1)*100)} višji od vikenda.`,
  `<strong>Prazniki:</strong> ${holiday}`,
  `<strong>Prebivalci:</strong> občina ima informativno 15.021 prebivalcev. Ker nimamo večletne časovne vrste, je vpliv prebivalstva prikazan le kot scenarijska predpostavka.`,
  `<strong>Polnilnice:</strong> podatki o zasedenosti še niso vključeni; ta scenarij bo dodan, ko dobimo zgodovino polnjenj.`
 ];
 document.querySelector('#insightList').innerHTML=items.map(x=>`<div class="insight">${x}</div>`).join('');
}
function renderCharts(){
 const months=A.monthly.filter(x=>x.avgDaily&&x.weightedOccupancy).slice(-13);
 Chart.defaults.font.family='Inter, system-ui, sans-serif'; Chart.defaults.color='#637178';
 new Chart(document.querySelector('#trendChart'),{type:'line',data:{labels:months.map(x=>x.month),datasets:[{label:'Povp. vozil/dan',data:months.map(x=>x.avgDaily),yAxisID:'y',tension:.3,borderWidth:3,borderColor:'#1565c0',backgroundColor:'rgba(21,101,192,.12)'},{label:'Zasedenost parkirišč (%)',data:months.map(x=>x.weightedOccupancy),yAxisID:'y1',tension:.3,borderWidth:3,borderColor:'#ef8f00',backgroundColor:'rgba(239,143,0,.12)'}]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},scales:{y:{position:'left',grid:{color:'#edf1f2'}},y1:{position:'right',min:0,max:100,grid:{drawOnChartArea:false}}},plugins:{legend:{position:'bottom'}}}});
 const pm=A.models.parkingByName; const names=Object.keys(pm);
 new Chart(document.querySelector('#parkingChart'),{type:'bar',data:{labels:names.map(n=>n.replace(', Tržič','')),datasets:[{label:'Povprečna zasedenost (%)',data:names.map(n=>pm[n].baselineOccupancy),borderWidth:0,backgroundColor:'#1565c0'}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',scales:{x:{min:0,max:100,grid:{color:'#edf1f2'}}},plugins:{legend:{display:false}}}});
 const speeds=A.trafficSpeed.vehicleTypes;
 new Chart(document.querySelector('#speedChart'),{type:'bar',data:{labels:speeds.map(x=>x.name),datasets:[{label:'km/h',data:speeds.map(x=>x.averageSpeed),borderWidth:0,backgroundColor:'#5aa3ef'}]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{min:0,max:55,grid:{color:'#edf1f2'}}},plugins:{legend:{display:false},annotation:false}}});
}
init().catch(e=>{document.body.innerHTML=`<main style="padding:40px"><h1>Napaka pri nalaganju podatkov</h1><p>${e.message}</p><p>Preveri, ali je mapa <code>data</code> naložena skupaj z aplikacijo.</p></main>`});

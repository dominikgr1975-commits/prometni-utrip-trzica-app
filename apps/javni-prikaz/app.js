(() => {
  'use strict';
  const store = window.PROMETNI_UTRIP_DATA || {};
  const analysis = store.ANALYSIS || {};
  const daily = (store.TRAFFIC_DAILY && (store.TRAFFIC_DAILY.records || store.TRAFFIC_DAILY.daily)) || store.TRAFFIC_DAILY || [];
  const holidays = new Set(((store.HOLIDAYS && store.HOLIDAYS.holidays) || []).filter(h => h.publicHoliday !== false).map(h => h.date));
  const fmt = new Intl.NumberFormat('sl-SI', {maximumFractionDigits:0});
  const pct = n => `${Number(n).toLocaleString('sl-SI',{minimumFractionDigits:1,maximumFractionDigits:1})} %`;
  const colors = ['#245b96','#6fa8dc','#8fbf80','#e2a45f','#8c78b8','#6a879c','#c77777'];
  Chart.defaults.font.family = 'system-ui,-apple-system,"Segoe UI",sans-serif';
  Chart.defaults.color = '#526276';
  Chart.defaults.plugins.legend.labels.usePointStyle = true;

  let charts = {};
  const destroy = key => { if (charts[key]) charts[key].destroy(); };
  const makeChart = (key, el, config) => { destroy(key); charts[key] = new Chart(document.getElementById(el), config); };


  const seasonOrder = ['pomlad','poletje','jesen','zima'];
  const seasonNames = {pomlad:'Pomlad',poletje:'Poletje',jesen:'Jesen',zima:'Zima'};
  const seasonRows = (analysis.monthly || []).filter(r => Number.isFinite(r.weightedOccupancy));
  const seasonStats = seasonOrder.map(s => {
    const rows = seasonRows.filter(r => r.season === s);
    return {name:seasonNames[s], value:rows.reduce((a,r)=>a+r.weightedOccupancy,0)/(rows.length||1), count:rows.length};
  });
  makeChart('season','seasonChart',{type:'bar',data:{labels:seasonStats.map(x=>x.name),datasets:[{label:'Povprečna zasedenost',data:seasonStats.map(x=>x.value),backgroundColor:colors.slice(0,4),borderRadius:10}]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{beginAtZero:true,max:100,ticks:{callback:v=>v+' %'}}},plugins:{tooltip:{callbacks:{label:c=>pct(c.raw)}}}}});
  const maxSeason = [...seasonStats].sort((a,b)=>b.value-a.value)[0], minSeason=[...seasonStats].sort((a,b)=>a.value-b.value)[0];
  document.getElementById('seasonInsight').innerHTML = `<strong>Največja povprečna zasedenost je v obdobju ${maxSeason.name.toLowerCase()} (${pct(maxSeason.value)}), najmanjša pa v obdobju ${minSeason.name.toLowerCase()} (${pct(minSeason.value)}).</strong> Gre za povprečja vseh spremljanih parkirišč in vseh razpoložljivih mesecev.`;

  const profiles = analysis.parkingHourly?.profiles || {};
  const parkingNames = Object.keys(profiles);
  const selector = document.getElementById('parkingSelector');
  parkingNames.forEach((name,i)=>{
    const b=document.createElement('button'); b.textContent=name.replace(', Tržič',''); b.dataset.name=name; if(i===0)b.classList.add('active');
    b.addEventListener('click',()=>{selector.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderParking(name);}); selector.appendChild(b);
  });
  function renderParking(name){
    const p=profiles[name]; if(!p)return;
    const slots=(p.slots||[]).filter(x=>Number.isFinite(x.average));
    const max=[...slots].sort((a,b)=>b.average-a.average)[0]; const min=[...slots].sort((a,b)=>a.average-b.average)[0];
    document.getElementById('parkingMax').textContent=pct(max.average); document.getElementById('parkingMaxWhen').textContent=`${max.weekdayName}, ob ${String(max.hour).padStart(2,'0')}.00`;
    document.getElementById('parkingMin').textContent=pct(min.average); document.getElementById('parkingMinWhen').textContent=`${min.weekdayName}, ob ${String(min.hour).padStart(2,'0')}.00`;
    document.getElementById('parkingAverage').textContent=pct(p.average);
    const days=['ponedeljek','torek','sreda','četrtek','petek','sobota','nedelja'];
    const hours=[...new Set(slots.map(x=>x.hour))].sort((a,b)=>a-b);
    const datasets=days.map((day,idx)=>({label:day[0].toUpperCase()+day.slice(1),data:hours.map(h=>slots.find(x=>x.weekdayName===day&&x.hour===h)?.average??null),borderColor:colors[idx%colors.length],backgroundColor:colors[idx%colors.length],tension:.3,spanGaps:true}));
    makeChart('parking','parkingChart',{type:'line',data:{labels:hours.map(h=>`${String(h).padStart(2,'0')}.00`),datasets},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},scales:{y:{beginAtZero:true,max:100,ticks:{callback:v=>v+' %'}}},plugins:{tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${pct(c.raw)}`}}}}});
  }
  if(parkingNames.length)renderParking(parkingNames[0]);

  const speed = analysis.trafficSpeed?.vehicleTypes || [];
  const speedLimit = 40;
  makeChart('speed','speedChart',{type:'bar',data:{labels:speed.map(x=>x.name),datasets:[{label:'Povprečna hitrost',data:speed.map(x=>x.averageSpeed),backgroundColor:colors,borderRadius:8},{label:'Omejitev',data:speed.map(()=>speedLimit),type:'line',borderColor:'#c44747',backgroundColor:'#c44747',borderDash:[7,5],pointRadius:0}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,scales:{x:{beginAtZero:true,suggestedMax:50,ticks:{callback:v=>v+' km/h'}}},plugins:{tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${Number(c.raw).toLocaleString('sl-SI',{maximumFractionDigits:1})} km/h`}}}}});
  const fastest=[...speed].sort((a,b)=>b.averageSpeed-a.averageSpeed)[0];
  const overLimit = speed.filter(x => x.averageSpeed > speedLimit);
  const limitText = overLimit.length
    ? `${overLimit.length} ${overLimit.length === 1 ? 'kategorija ima' : 'kategoriji imata'} povprečno hitrost nad omejitvijo ${speedLimit} km/h.`
    : `Povprečja vseh prikazanih kategorij so pod omejitvijo ${speedLimit} km/h.`;
  document.getElementById('speedInsight').innerHTML=`<strong>Najvišjo povprečno hitrost imajo ${fastest.name.toLowerCase()} (${fastest.averageSpeed.toLocaleString('sl-SI',{maximumFractionDigits:1})} km/h).</strong> ${limitText} Povprečje ne pokaže posameznih prekoračitev hitrosti.`;

  const periodSelect = document.getElementById('periodSelect');
  const allDailyRows = (Array.isArray(daily) ? daily : [])
    .filter(r => !r.isPartialDay && Number.isFinite(r.totalVehicles) && /^\d{4}-\d{2}-\d{2}$/.test(r.date || ''))
    .sort((a,b) => a.date.localeCompare(b.date));
  const availableYears = [...new Set(allDailyRows.map(r => r.date.slice(0,4)))].sort();
  const latestYear = availableYears[availableYears.length - 1] || 'all';
  const periodOptions = [
    {value:'all', label:'Celotno obdobje'},
    ...availableYears.map(year => ({value:year, label:`Leto ${year}`})),
    {value:'12m', label:'Zadnjih 12 mesecev'}
  ];
  periodSelect.innerHTML = periodOptions.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
  periodSelect.value = latestYear;
  periodSelect.addEventListener('change', renderTraffic);
  renderTraffic();

  function filteredDaily(){
    const val = periodSelect.value;
    if(val === 'all') return allDailyRows;
    if(val === '12m'){
      if(!allDailyRows.length) return [];
      const last = new Date(allDailyRows[allDailyRows.length-1].date + 'T00:00:00');
      const from = new Date(last);
      from.setFullYear(from.getFullYear()-1);
      from.setDate(from.getDate()+1);
      return allDailyRows.filter(r => new Date(r.date+'T00:00:00') >= from);
    }
    return allDailyRows.filter(r => r.date.startsWith(val + '-'));
  }
  function classify(date){if(holidays.has(date))return 'Prazniki';const d=new Date(date+'T12:00:00').getDay();return(d===0||d===6)?'Vikendi':'Delavniki';}
  function renderTraffic(){
    const rows=filteredDaily();
    const selectedLabel = periodSelect.options[periodSelect.selectedIndex]?.textContent || 'Izbrano obdobje';
    const avgTraffic = rows.length ? rows.reduce((sum,r)=>sum+r.totalVehicles,0)/rows.length : 0;
    document.getElementById('heroTraffic').textContent = rows.length ? fmt.format(avgTraffic) : '–';
    document.getElementById('heroTrafficLabel').textContent = rows.length ? `vozil na dan · ${selectedLabel.toLowerCase()}` : 'za izbrano obdobje ni podatkov';
    const from = rows[0]?.date;
    const to = rows[rows.length-1]?.date;
    document.getElementById('periodStatus').textContent = rows.length
      ? `${selectedLabel}: ${rows.length} dni (${from.split('-').reverse().join('. ')}–${to.split('-').reverse().join('. ')})`
      : `${selectedLabel}: ni razpoložljivih meritev`;
 const groups={Delavniki:[],Vikendi:[],Prazniki:[]}; rows.forEach(r=>groups[classify(r.date)].push(r.totalVehicles));
    const stats=Object.entries(groups).map(([name,vals])=>({name,value:vals.reduce((a,b)=>a+b,0)/(vals.length||1),days:vals.length}));
    makeChart('dayType','dayTypeChart',{type:'bar',data:{labels:stats.map(x=>x.name),datasets:[{label:'Povprečno vozil na dan',data:stats.map(x=>x.value),backgroundColor:[colors[0],colors[2],colors[3]],borderRadius:10}]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{beginAtZero:true,ticks:{callback:v=>fmt.format(v)}}},plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${fmt.format(c.raw)} vozil/dan`}}}}});
    const base=stats.find(x=>x.name==='Delavniki')?.value||1; document.getElementById('dayCards').innerHTML=stats.map(s=>`<div class="day-card"><span>${s.name}</span><strong>${fmt.format(s.value)}</strong><small>povprečno vozil na dan · ${s.days} dni</small><em>${s.name==='Delavniki'?'osnovna primerjava':`${Math.round((s.value/base-1)*100)} % glede na delavnike`}</em></div>`).join('');
    const totals={}; rows.forEach(r=>Object.entries(r.vehicleTypes||{}).forEach(([k,v])=>totals[k]=(totals[k]||0)+v)); const vehicleRows=Object.entries(totals).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
    makeChart('vehicle','vehicleChart',{type:'doughnut',data:{labels:vehicleRows.map(x=>x[0]),datasets:[{data:vehicleRows.map(x=>x[1]),backgroundColor:colors,borderWidth:3,borderColor:'#fff'}]},options:{responsive:true,maintainAspectRatio:false,cutout:'62%',plugins:{tooltip:{callbacks:{label:c=>{const total=c.dataset.data.reduce((a,b)=>a+b,0);return `${c.label}: ${fmt.format(c.raw)} (${(c.raw/total*100).toLocaleString('sl-SI',{maximumFractionDigits:1})} %)`;}}}}}});
    const sum=vehicleRows.reduce((a,x)=>a+x[1],0); const top=vehicleRows[0]; document.getElementById('vehicleInsight').innerHTML=`<h3>Prevladujejo ${top?.[0]?.toLowerCase()||'osebna vozila'}</h3><p>V izbranem obdobju predstavljajo približno <strong>${((top?.[1]||0)/sum*100).toLocaleString('sl-SI',{maximumFractionDigits:1})} %</strong> vseh zaznanih vozil. Prikaz omogoča hitro primerjavo osebnega, kombiniranega in tovornega prometa.</p><p><strong>Skupaj zaznano:</strong> ${fmt.format(sum)} vozil.</p>`;
  }
})();

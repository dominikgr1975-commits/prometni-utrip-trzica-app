(function(){
  'use strict';
  const all=window.PROMETNI_UTRIP_DATA||{};
  const summary=all.TOURISM_SUMMARY;
  const accommodation=all.TOURISM_ACCOMMODATION;
  const $=id=>document.getElementById(id);
  const intFmt=new Intl.NumberFormat('sl-SI',{maximumFractionDigits:0});
  const decFmt=new Intl.NumberFormat('sl-SI',{minimumFractionDigits:1,maximumFractionDigits:2});
  const pctFmt=new Intl.NumberFormat('sl-SI',{minimumFractionDigits:1,maximumFractionDigits:1});
  const yearOf=value=>Number(String(value).slice(0,4));
  const monthOf=value=>Number(String(value).slice(5,7));
  const sum=(rows,key)=>rows.reduce((acc,row)=>acc+(Number(row[key])||0),0);
  const signedPct=value=>`${value>=0?'+':''}${pctFmt.format(value)} %`;
  const signedPoints=value=>`${value>=0?'+':''}${pctFmt.format(value)} odst. to\u010dke`;

  if(!summary||!Array.isArray(summary.monthly)||!accommodation||!Array.isArray(accommodation.records)){
    $('goalGrid').innerHTML='<div class="error">Podatkov turisti\u010dnega poro\u010danja ni bilo mogo\u010de nalo\u017eiti.</div>';
    return;
  }

  function annualSummary(){
    const years=[...new Set(summary.monthly.map(row=>yearOf(row.month)))].sort((a,b)=>a-b);
    return years.map(year=>{
      const rows=summary.monthly.filter(row=>yearOf(row.month)===year);
      const guests=sum(rows,'guests');
      const nights=sum(rows,'overnights');
      return {year,months:rows.length,guests,nights,stay:guests?nights/guests:0};
    });
  }

  function annualAccommodation(){
    const years=[...new Set(accommodation.records.map(row=>yearOf(row.month)))].sort((a,b)=>a-b);
    return years.map(year=>{
      const rows=accommodation.records.filter(row=>yearOf(row.month)===year);
      const days=sum(rows,'daysInMonth');
      const bedNights=sum(rows,'availableBedNights');
      const nights=sum(rows,'overnights');
      return {year,months:rows.length,beds:days?bedNights/days:0,occupancy:bedNights?nights/bedNights:0};
    });
  }

  function outsideSummerShare(year){
    const rows=summary.monthly.filter(row=>yearOf(row.month)===year);
    const allNights=sum(rows,'overnights');
    const outside=rows.filter(row=>![6,7,8].includes(monthOf(row.month))).reduce((acc,row)=>acc+(Number(row.overnights)||0),0);
    return allNights?outside/allNights:0;
  }

  const annual=annualSummary();
  const annualBeds=annualAccommodation();
  const complete=annual.filter(row=>row.months===12);
  const latest=complete[complete.length-1];
  const bedLatest=annualBeds.find(row=>row.year===latest.year);
  const baseYear=2022;
  const bedBase=annualBeds.find(row=>row.year===baseYear);
  const seasonLatest=outsideSummerShare(latest.year);
  const seasonBase=outsideSummerShare(baseYear);

  const targetNights=90000;
  const targetStay=4;
  const nightsProgress=Math.min(100,latest.nights/targetNights*100);
  const stayProgress=Math.min(100,latest.stay/targetStay*100);
  const bedGrowth=bedBase&&bedBase.beds?(bedLatest.beds/bedBase.beds-1)*100:0;
  const seasonChange=(seasonLatest-seasonBase)*100;

  function goalCard(opts){
    const progress=opts.progress==null?'':`<div class="progress-wrap"><div class="progress-label"><span>${opts.progressLabel}</span><strong>${pctFmt.format(opts.progress)} %</strong></div><div class="progress"><span style="width:${Math.max(0,Math.min(100,opts.progress))}%"></span></div></div>`;
    return `<article class="goal-card ${opts.className||''}">
      <div class="goal-top"><span class="goal-number">${opts.number}</span><span class="status ${opts.statusClass}">${opts.status}</span></div>
      <h3>${opts.title}</h3>
      <div class="value-compare">
        <div class="value-block"><span>Dejansko stanje ${latest.year}</span><strong>${opts.actual}</strong></div>
        <div class="compare-arrow">&#8594;</div>
        <div class="value-block target"><span>Cilj Strategije</span><strong>${opts.target}</strong></div>
      </div>
      ${progress}
      <p class="goal-detail">${opts.detail}</p>
    </article>`;
  }

  $('goalGrid').innerHTML=[
    goalCard({number:'01',title:'Letno \u0161tevilo no\u010ditev',actual:intFmt.format(latest.nights),target:intFmt.format(targetNights),progress:nightsProgress,progressLabel:'Doseganje cilja',status:'Velik razkorak',statusClass:'status-low',detail:`Do cilja manjka <strong>${intFmt.format(targetNights-latest.nights)} no\u010ditev</strong>. Strategija kot izhodi\u0161\u010de uporablja pribli\u017eno 30.000 no\u010ditev; poro\u010danje za ${latest.year} izkazuje ${intFmt.format(latest.nights)}.`}),
    goalCard({number:'02',title:'Povpre\u010dna dol\u017eina bivanja',actual:`${decFmt.format(latest.stay)} dni`,target:'4,0 dni',progress:stayProgress,progressLabel:'Doseganje cilja',status:'Pod ciljem',statusClass:'status-mid',detail:`Razlika do cilja je <strong>${decFmt.format(targetStay-latest.stay)} dneva</strong>. Kazalnik je izra\u010dunan kot no\u010ditve / gostje.`}),
    goalCard({number:'03',title:'Nastanitvene zmogljivosti',actual:`${intFmt.format(bedLatest.beds)} le\u017ei\u0161\u010d`,target:'Znatno pove\u010danje',progress:null,status:'Rast evidentirana',statusClass:'status-positive',className:'beds',detail:`Povpre\u010dno \u0161tevilo razpolo\u017eljivih le\u017ei\u0161\u010d je bilo leta ${latest.year} za <strong>${signedPct(bedGrowth)}</strong> vi\u0161je kot leta ${baseYear}. Strategija ne dolo\u010da \u0161tevil\u010dne ciljne vrednosti, zato odstotka doseganja ni mogo\u010de izra\u010dunati.`}),
    goalCard({number:'04',title:'No\u010ditve izven junija, julija in avgusta',actual:`${pctFmt.format(seasonLatest*100)} %`,target:'Zmanj\u0161anje sezonskosti',progress:null,status:seasonChange>0?'Delno izbolj\u0161anje':'Brez izbolj\u0161anja',statusClass:seasonChange>0?'status-positive':'status-mid',className:'season',detail:`Dele\u017e no\u010ditev izven glavnih poletnih mesecev se je glede na ${baseYear} spremenil za <strong>${signedPoints(seasonChange)}</strong>. Strategija ne dolo\u010da ciljne odstotne vrednosti.`})
  ].join('');

  function renderAnnualChart(){
    const data=complete;
    const width=820,height=310,pad={l:54,r:24,t:24,b:46};
    const max=Math.max(...data.map(row=>row.nights))*1.16;
    const chartW=width-pad.l-pad.r,chartH=height-pad.t-pad.b;
    const x=i=>pad.l+(data.length===1?chartW/2:i*chartW/(data.length-1));
    const y=value=>pad.t+chartH-(value/max)*chartH;
    const points=data.map((row,i)=>`${x(i)},${y(row.nights)}`).join(' ');
    const area=`${pad.l},${pad.t+chartH} ${points} ${x(data.length-1)},${pad.t+chartH}`;
    const grid=[0,.25,.5,.75,1].map(r=>{
      const gy=pad.t+chartH-r*chartH;
      return `<line x1="${pad.l}" y1="${gy}" x2="${width-pad.r}" y2="${gy}" stroke="rgba(255,255,255,.10)" /><text x="${pad.l-10}" y="${gy+4}" text-anchor="end" fill="#88a4a5" font-size="11">${intFmt.format(max*r)}</text>`;
    }).join('');
    const labels=data.map((row,i)=>`<text x="${x(i)}" y="${height-15}" text-anchor="middle" fill="#9bb5b6" font-size="12">${row.year}</text>`).join('');
    const dots=data.map((row,i)=>`<circle cx="${x(i)}" cy="${y(row.nights)}" r="5" fill="#e6b550" stroke="#0b3538" stroke-width="4"><title>${row.year}: ${intFmt.format(row.nights)} no\u010ditev</title></circle>`).join('');
    $('annualChart').innerHTML=`<svg viewBox="0 0 ${width} ${height}" aria-hidden="true"><defs><linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#69d3c3" stop-opacity=".35"/><stop offset="1" stop-color="#69d3c3" stop-opacity=".02"/></linearGradient></defs>${grid}<polygon points="${area}" fill="url(#areaGradient)"/><polyline points="${points}" fill="none" stroke="#92d7c9" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${dots}${labels}</svg>`;
    const first=data[0];
    const growth=first&&first.nights?(latest.nights/first.nights-1)*100:0;
    $('chartHeadline').textContent=`${intFmt.format(latest.nights)} v ${latest.year} (${signedPct(growth)} glede na ${first.year})`;
  }

  function halfYear(year){
    const rows=summary.monthly.filter(row=>yearOf(row.month)===year&&monthOf(row.month)<=6);
    const guests=sum(rows,'guests');
    const nights=sum(rows,'overnights');
    return {guests,nights,stay:guests?nights/guests:0,months:rows.length};
  }
  const latestPartial=annual[annual.length-1];
  const partialYear=latestPartial.months<12?latestPartial.year:null;
  if(partialYear){
    const current=halfYear(partialYear);
    const previous=halfYear(partialYear-1);
    const metrics=[
      ['Gostje',intFmt.format(current.guests),(current.guests/previous.guests-1)*100],
      ['No\u010ditve',intFmt.format(current.nights),(current.nights/previous.nights-1)*100],
      ['Povp. bivanje',`${decFmt.format(current.stay)} dni`,(current.stay/previous.stay-1)*100]
    ];
    $('partialMetrics').innerHTML=metrics.map(item=>`<div class="partial-metric"><span>${item[0]}</span><strong>${item[1]} <small class="${item[2]>=0?'delta-up':'delta-down'}">${signedPct(item[2])}</small></strong></div>`).join('');
  }else{
    $('partialMetrics').innerHTML='<div class="partial-metric"><span>Delno leto</span><strong>Ni podatka</strong></div>';
  }

  renderAnnualChart();
})();

(() => {
  'use strict';
  const D = window.SURS_TOURISM_BENCHMARK;
  if (!D) return;
  const municipalities = ['Tržič','Radovljica','Bled'];
  const colors = {'Tržič':'#20a6a0','Radovljica':'#5eb3e5','Bled':'#e7a43c'};
  const fmt = new Intl.NumberFormat('sl-SI');
  const pct = (v,d=1) => `${v.toLocaleString('sl-SI',{minimumFractionDigits:d,maximumFractionDigits:d})} %`;
  const annual = (m,y,c='Država - SKUPAJ') => D.annual.find(x=>x.municipality===m&&x.year===y&&x.category===c);
  const capacity = (m,y) => D.capacity.find(x=>x.municipality===m&&x.year===y);
  const monthly = (m,y) => D.monthly.filter(x=>x.municipality===m&&x.period.startsWith(String(y))).sort((a,b)=>a.period.localeCompare(b.period));
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function snapshot(){
    const el=document.getElementById('snapshotGrid');
    el.innerHTML=municipalities.map(m=>{
      const a=annual(m,2025), f=annual(m,2025,'Tuji'), c=capacity(m,2025);
      const stay=a.nights/a.arrivals, foreign=f.nights/a.nights*100, perBed=a.nights/c.bedsPermanent;
      return `<article class="municipality-card ${m==='Tržič'?'trzic':m==='Radovljica'?'radovljica':'bled'}"><h3>${m}</h3><div class="metric-grid"><div class="metric"><span>Gostje</span><strong>${fmt.format(a.arrivals)}</strong></div><div class="metric"><span>Nočitve</span><strong>${fmt.format(a.nights)}</strong></div><div class="metric"><span>Povp. bivanje</span><strong>${stay.toLocaleString('sl-SI',{maximumFractionDigits:2})} dneva</strong></div><div class="metric"><span>Tuji delež nočitev</span><strong>${pct(foreign)}</strong></div><div class="metric"><span>Stalna ležišča</span><strong>${fmt.format(c.bedsPermanent)}</strong></div><div class="metric"><span>Nočitve / ležišče</span><strong>${perBed.toLocaleString('sl-SI',{maximumFractionDigits:1})}</strong></div></div></article>`;
    }).join('');
    const growth={}; municipalities.forEach(m=>growth[m]=(annual(m,2025).nights/annual(m,2019).nights-1)*100);
    const season={}; municipalities.forEach(m=>{const rows=monthly(m,2025), total=rows.reduce((s,x)=>s+x.nights,0), jja=rows.filter(x=>['06','07','08'].includes(x.period.slice(-2))).reduce((s,x)=>s+x.nights,0); season[m]=jja/total*100;});
    document.getElementById('aiSummary').innerHTML=`<div><h3>Ključni povzetek</h3><p>Med letoma 2019 in 2025 so nočitve v Tržiču zrasle za <strong>${pct(growth['Tržič'])}</strong>, v Radovljici za <strong>${pct(growth['Radovljica'])}</strong>, na Bledu pa za <strong>${pct(growth['Bled'])}</strong>. Tržič je leta 2025 ustvaril <strong>${pct(season['Tržič'])}</strong> vseh nočitev v juniju–avgustu, zato je bolj poletno skoncentriran od Bleda, vendar manj od Radovljice. Absolutne razlike so velike, zato je za odločanje pomembnejša dinamika rasti in struktura trgov kot sama lestvica.</p></div>`;
  }

  function lineChart(container, series, years, indexed=false){
    const w=1000,h=340,p={l:58,r:24,t:24,b:48};
    const vals=series.flatMap(s=>s.values.filter(v=>Number.isFinite(v)));
    let min=Math.min(...vals), max=Math.max(...vals); if(indexed){min=Math.min(50,min);max=Math.max(170,max);} const pad=(max-min)*.12||1; min-=pad;max+=pad;
    const x=i=>p.l+i*(w-p.l-p.r)/(years.length-1); const y=v=>p.t+(max-v)*(h-p.t-p.b)/(max-min);
    const ticks=5; let svg=`<svg viewBox="0 0 ${w} ${h}" aria-hidden="true">`;
    for(let i=0;i<=ticks;i++){const v=min+(max-min)*i/ticks, yy=y(v);svg+=`<line class="chart-grid-line" x1="${p.l}" y1="${yy}" x2="${w-p.r}" y2="${yy}"/><text class="axis-label" x="${p.l-9}" y="${yy+4}" text-anchor="end">${Math.round(v)}</text>`;}
    years.forEach((yr,i)=>{svg+=`<text class="axis-label" x="${x(i)}" y="${h-17}" text-anchor="middle">${yr}</text>`; if(yr===2020||yr===2021)svg+=`<rect x="${x(i)-18}" y="${p.t}" width="36" height="${h-p.t-p.b}" fill="#fff" opacity=".035"/>`;});
    series.forEach(s=>{const pts=s.values.map((v,i)=>`${x(i)},${y(v)}`).join(' ');svg+=`<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;s.values.forEach((v,i)=>svg+=`<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="${s.color}"><title>${s.name}: ${v.toLocaleString('sl-SI',{maximumFractionDigits:1})}</title></circle>`);});
    svg+='</svg><div class="legend">'+series.map(s=>`<span><i style="background:${s.color}"></i>${s.name}</span>`).join('')+'</div>';
    container.innerHTML=svg;
  }

  function trend(metric='nights'){
    const years=[2018,2019,2020,2021,2022,2023,2024,2025];
    const series=municipalities.map(m=>{const base=annual(m,2019)[metric];return{name:m,color:colors[m],values:years.map(y=>annual(m,y)[metric]/base*100)};});
    lineChart(document.getElementById('trendChart'),series,years,true);
    document.getElementById('trendHeadline').textContent=`Indeks ${metric==='nights'?'nočitev':'gostov'} (2019 = 100)`;
  }

  function seasonality(){
    const months=['jan','feb','mar','apr','maj','jun','jul','avg','sep','okt','nov','dec'];
    const w=1000,h=340,p={l:52,r:20,t:20,b:48};
    const series=municipalities.map(m=>{const rows=monthly(m,2025),total=rows.reduce((s,x)=>s+x.nights,0);return{name:m,color:colors[m],values:rows.map(x=>x.nights/total*100)};});
    const max=Math.max(...series.flatMap(s=>s.values))*1.15; const x=i=>p.l+i*(w-p.l-p.r)/11; const y=v=>p.t+(max-v)*(h-p.t-p.b)/max;
    let svg=`<svg viewBox="0 0 ${w} ${h}" aria-hidden="true">`;
    for(let i=0;i<=4;i++){const v=max*i/4,yy=y(v);svg+=`<line class="chart-grid-line" x1="${p.l}" y1="${yy}" x2="${w-p.r}" y2="${yy}"/><text class="axis-label" x="${p.l-8}" y="${yy+4}" text-anchor="end">${Math.round(v)} %</text>`;}
    months.forEach((m,i)=>svg+=`<text class="axis-label" x="${x(i)}" y="${h-17}" text-anchor="middle">${m}</text>`);
    series.forEach(s=>{svg+=`<polyline points="${s.values.map((v,i)=>`${x(i)},${y(v)}`).join(' ')}" fill="none" stroke="${s.color}" stroke-width="4"/>`;s.values.forEach((v,i)=>svg+=`<circle cx="${x(i)}" cy="${y(v)}" r="3.5" fill="${s.color}"><title>${s.name}, ${months[i]}: ${v.toFixed(1)} %</title></circle>`);});
    svg+='</svg><div class="legend">'+series.map(s=>`<span><i style="background:${s.color}"></i>${s.name}</span>`).join('')+'</div>';document.getElementById('seasonChart').innerHTML=svg;
    document.getElementById('seasonCards').innerHTML=municipalities.map(m=>{const rows=monthly(m,2025),total=rows.reduce((s,x)=>s+x.nights,0),jja=rows.filter(x=>['06','07','08'].includes(x.period.slice(-2))).reduce((s,x)=>s+x.nights,0),peak=rows.reduce((a,b)=>a.nights>b.nights?a:b);return`<article class="side-card"><h3>${m}</h3><strong>${pct(jja/total*100)}</strong><span>nočitev junij–avgust; vrh: ${months[Number(peak.period.slice(-2))-1]} (${fmt.format(peak.nights)})</span></article>`;}).join('');
  }

  function markets(){
    const sums={};municipalities.forEach(m=>{sums[m]={};monthly(m,2025).forEach(row=>Object.entries(row.markets).forEach(([k,v])=>{if(!['Država - SKUPAJ','DOMAČI','TUJI'].includes(k))sums[m][k]=(sums[m][k]||0)+v.nights;}));});
    const totalForeign={};municipalities.forEach(m=>totalForeign[m]=annual(m,2025,'Tuji').nights);
    const top=Object.entries(sums['Tržič']).sort((a,b)=>b[1]-a[1]).slice(0,10);
    document.getElementById('topMarkets').innerHTML=top.map(([k,v],i)=>`<div class="rank-row"><b>${i+1}</b><div><strong>${esc(k)}</strong><small>${pct(v/totalForeign['Tržič']*100)} tujih nočitev</small></div><span>${fmt.format(v)}</span></div>`).join('');
    const opp=Object.keys(sums['Tržič']).map(k=>{const t=sums['Tržič'][k]/totalForeign['Tržič'], r=sums['Radovljica'][k]/totalForeign['Radovljica'], b=sums['Bled'][k]/totalForeign['Bled'];const env=(r+b)/2;return{name:k,trzic:t,env,external:sums['Radovljica'][k]+sums['Bled'][k],gap:env-t};}).filter(x=>x.external>10000&&x.gap>0.002).sort((a,b)=>b.gap-a.gap).slice(0,10);
    document.getElementById('opportunityMarkets').innerHTML=opp.map(x=>`<div class="opportunity-row"><div><strong>${esc(x.name)}</strong><span>Tržič ${pct(x.trzic*100)} · okolica ${pct(x.env*100)}</span></div><span class="pill">vrzel ${pct(x.gap*100)}</span></div>`).join('');
  }

  function capacities(){
    document.getElementById('capacityGrid').innerHTML=municipalities.map(m=>{const a=annual(m,2025),c=capacity(m,2025),c19=capacity(m,2019),ratio=a.nights/c.bedsPermanent,g=(c.bedsPermanent/c19.bedsPermanent-1)*100;return`<article class="capacity-card"><h3>${m}</h3><div class="big">${ratio.toLocaleString('sl-SI',{maximumFractionDigits:1})}</div><p>nočitve na stalno ležišče v 2025</p><p><strong>${fmt.format(c.bedsPermanent)}</strong> stalnih ležišč; sprememba od 2019: ${g>=0?'+':''}${pct(g)}</p></article>`;}).join('');
    const years=[2019,2020,2021,2022,2023,2024,2025];const series=municipalities.map(m=>({name:m,color:colors[m],values:years.map(y=>annual(m,y).nights/capacity(m,y).bedsPermanent)}));lineChart(document.getElementById('capacityChart'),series,years,false);
  }

  function pearson(a,b){if(a.length<3)return null;const ma=a.reduce((s,x)=>s+x,0)/a.length,mb=b.reduce((s,x)=>s+x,0)/b.length;let n=0,da=0,db=0;for(let i=0;i<a.length;i++){const x=a[i]-ma,y=b[i]-mb;n+=x*y;da+=x*x;db+=y*y;}return da&&db?n/Math.sqrt(da*db):null;}
  function ranks(v){const out=new Array(v.length),arr=v.map((x,i)=>({x,i})).sort((a,b)=>a.x-b.x);for(let i=0;i<arr.length;){let j=i;while(j+1<arr.length&&arr[j+1].x===arr[i].x)j++;const r=(i+j)/2+1;for(let k=i;k<=j;k++)out[arr[k].i]=r;i=j+1;}return out;}
  function signals(){
    const changes={};municipalities.forEach(m=>{const rows=D.monthly.filter(x=>x.municipality===m).sort((a,b)=>a.period.localeCompare(b.period));changes[m]=rows.slice(1).map((x,i)=>({period:x.period,value:(x.nights-rows[i].nights)/rows[i].nights}));});
    const t=changes['Tržič'];
    const cards=['Radovljica','Bled'].map(comp=>{const c=changes[comp];const results=[];for(let lag=0;lag<=3;lag++){const a=[],b=[];for(let i=lag;i<t.length;i++){a.push(t[i].value);b.push(c[i-lag].value);}results.push({lag,n:a.length,p:pearson(a,b),s:pearson(ranks(a),ranks(b))});}const best=results.reduce((a,b)=>Math.abs(b.p)>Math.abs(a.p)?b:a);const interpretation=Math.abs(best.p)>=.7?'močna opisna povezava':Math.abs(best.p)>=.4?'zmerna opisna povezava':'šibka opisna povezava';return`<article class="signal-card"><h3>${comp} → Tržič</h3><p>Mesečna sprememba nočitev v ${comp==='Bled'?'Bledu':'Radovljici'} proti poznejši spremembi v Tržiču.</p><div class="lag-table">${results.map(r=>`<div class="lag-row"><span>${r.lag===0?'isti mesec':`zamik ${r.lag} mes.`}</span><div class="bar"><i class="${r.p<0?'negative':''}" style="width:${Math.min(100,Math.abs(r.p)*100)}%"></i></div><strong>${r.p.toLocaleString('sl-SI',{maximumFractionDigits:2})}</strong></div>`).join('')}</div><div class="best-signal"><strong>Najizraziteje:</strong> ${best.lag===0?'isti mesec':`${best.lag} mesec${best.lag===1?'':'a'} pozneje`} (Pearson r = ${best.p.toLocaleString('sl-SI',{maximumFractionDigits:2})}, Spearman ρ = ${best.s.toLocaleString('sl-SI',{maximumFractionDigits:2})}, n = ${best.n}). Gre za ${interpretation}.</div></article>`;});document.getElementById('signalGrid').innerHTML=cards.join('');
  }

  snapshot();trend();seasonality();markets();capacities();signals();
  document.querySelectorAll('[data-trend]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-trend]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');trend(btn.dataset.trend);}));
})();

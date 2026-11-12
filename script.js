window.DISCOVER_CONFIG=window.DISCOVER_CONFIG||{tmdbProxy:'',tmdbKey:'',tmdbImg:'https://image.tmdb.org/t/p/w342',offlineGuide:false};
let U=null,DB=null,AU=null,unsub=null,AM=0,LOCK=true,ptm;
const K='journeyjar.v1',$=s=>document.querySelector(s),E=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),rid=()=>Math.random().toString(36).slice(2,9);
const SY={INR:'₹',USD:'$',EUR:'€',GBP:'£',AED:'AED ',JPY:'¥'},iso=d=>d.toISOString().slice(0,10),off=n=>iso(new Date(Date.now()+n*864e5)),today=off(0);
const CAT={Transportation:['plane','#F5B942'],Accommodation:['bed-double','#FFD166'],Food:['utensils','#B8860B'],Activities:['ticket','#A1A1AA'],Shopping:['shopping-bag','#71717A'],'Emergency Fund':['shield-alert','#F59E0B'],Other:['package','#52525B']},CK=Object.keys(CAT);
const NAV=[['home','Home','house'],['disc','Discover','compass'],['dash','Dashboard','layout-dashboard'],['trips','My Trips','map'],['sync','Trip Sync','users-round'],['plan','Budget Planner','wallet'],['smart','Smart Budget','sparkles'],['exp','Expense Tracker','receipt'],['split','Trip Splitter','users'],['iti','Itinerary','calendar-days'],['count','Trip Countdown','timer'],['pack','Smart Packing','briefcase'],['vault','Travel Vault','shield-check'],['ana','Analytics','chart-pie'],['cmp','Trip Comparison','git-compare'],['set','Settings','settings']];
const DEST=[['Goa','🏖️','#14b8a6,#0f2a43',3500],['Manali','🏔️','#60a5fa,#1e3a8a',3000],['Jaipur','🏰','#fb923c,#9f1239',2800],['Kerala','🌴','#34d399,#065f46',3200],['Bali','🌺','#f472b6,#6d28d9',5000],['Paris','🗼','#fbbf24,#0f2a43',9000]];
let D=null;try{D=JSON.parse(localStorage.getItem(K))}catch(e){}
const UK=()=>U?K+':'+U.uid:K,sv=()=>{try{localStorage.setItem(UK(),JSON.stringify(D))}catch(e){}cpush()};
function seed(){const tr=(id,n,f,t,a,b,tv,m,bd)=>({id,name:n,from:f,to:t,dep:off(a),ret:off(b),trav:tv,mode:m,budget:bd,acc:'Hotel',style:'Standard',cur:'INR',people:Array.from({length:tv},(_,i)=>i?'Friend '+i:'You')}),x=(t,n,c,a,d,p=0)=>({id:rid(),trip:t,name:n,cat:c,amt:a,date:off(d),notes:'',paid:p});
return{user:'Traveler',cur:'INR',trips:[tr(1,'Goa Beach Escape','Bhopal','Goa',12,17,4,'Flight',60000),tr(2,'Manali Road Trip','Delhi','Manali',40,45,3,'Car',35000),tr(3,'Jaipur Heritage Weekend','Indore','Jaipur',-20,-17,2,'Train',20000)],exp:[x(1,'Flight tickets','Transportation',20800,12),x(1,'Beach resort','Accommodation',24000,12,1),x(1,'Dinners','Food',9000,13,2),x(1,'Water sports','Activities',7200,14),x(2,'Fuel & tolls','Transportation',7400,40),x(2,'Hotel','Accommodation',11000,40,1),x(2,'Souvenirs','Shopping',2500,43,2),x(3,'Train tickets','Transportation',2800,-20),x(3,'Hotel','Accommodation',7500,-20,1),x(3,'Fort entry','Activities',1200,-19),x(3,'Street food','Food',2400,-19,1)],iti:[{id:rid(),trip:1,day:1,time:'10:00',title:'Check in at resort'},{id:rid(),trip:1,day:2,time:'09:00',title:'Water sports at Baga'}]}}
if(!D){D=seed();sv()}
let V={p:'home',trip:D.trips[0]?.id,q:'',cat:'',from:'',to:'',sort:'dd',a:null,b:null};
const sum=a=>a.reduce((s,e)=>s+e.amt,0),ex=id=>D.exp.filter(e=>e.trip==id),cur=()=>D.trips.find(t=>t.id==V.trip),tt=t=>sum(ex(t.id)),M=(n,c)=>(SY[c||D.cur]||'')+Math.round(n).toLocaleString(),fd=d=>d?new Date(d+'T00:00').toLocaleDateString(undefined,{day:'numeric',month:'short'}):'–';
const nts=t=>Math.max(0,Math.round((new Date(t.ret)-new Date(t.dep))/864e5)),dys=t=>nts(t)+1,ic=n=>`<i data-lucide="${n}"></i>`;
function toast(m){const t=$('#t');t.textContent=m;t.className='on';setTimeout(()=>t.className='',2200)}
function modal(h){$('#m').innerHTML=h;$('#ov').className='on';ico()}function cl(){$('#ov').className=''}$('#ov').onclick=e=>{if(e.target.id=='ov')cl()};
function ico(){try{lucide.createIcons()}catch(e){}}
function cf(msg,fn,lb){window._f=fn;modal(`<h3>${msg}</h3><div class="row"><button class="btn g" onclick="cl()">Cancel</button><button class="btn r" onclick="_f();cl()">${lb||'Yes, delete'}</button></div>`)}
function go(p,t){V.p=p;if(t)V.trip=t;R();scrollTo(0,0)}
function donut(it){const s=it.reduce((a,x)=>a+x[1],0)||1;let o=0;return`<div class="row" style="justify-content:center"><svg viewBox="0 0 120 120" width="150">${it.map(([k,v,c])=>{const l=v/s*251.3,r=`<circle r="40" cx="60" cy="60" fill="none" stroke="${c}" stroke-width="18" stroke-dasharray="${l} ${251.3-l}" stroke-dashoffset="${-o}" transform="rotate(-90 60 60)"/>`;o+=l;return r}).join('')}</svg><div>${it.map(([k,v,c])=>`<div class="mut"><span style="color:${c}">●</span> ${k} · ${Math.round(v/s*100)}%</div>`).join('')}</div></div>`}
function R(){if(LOCK)return;if(!D.trips.find(t=>t.id==V.trip))V.trip=D.trips[0]?.id;$('#nav').innerHTML=NAV.map(n=>`<button class="nv ${V.p==n[0]?'on':''}" onclick="go('${n[0]}')">${ic(n[2])}<span class="nl">${n[1]}</span></button>`).join('');
$('#ttl').textContent=(NAV.find(n=>n[0]==V.p)||['','Trip Sync'])[1];$('.top').style.display=V.p=='home'?'none':'';nbA();{const g=$('#pg');g.classList.remove('pt');void g.offsetWidth;g.classList.add('pt')}$('#ts').style.display=['plan','smart','exp','split','iti','pack','vault'].includes(V.p)?'':'none';$('#ts').innerHTML=D.trips.map(t=>`<option value="${t.id}" ${t.id==V.trip?'selected':''}>${E(t.name)}</option>`).join('');
if(V.p==='sync'){if(window.TSUI)TSUI.onEnter();else $('#pg').innerHTML='<div class="card">Loading Trip Sync…</div>';}
else{$('#pg').innerHTML=D.trips.length||V.p=='set'?P[V.p]():`<div class="card" style="margin-top:14px">No trips yet. Click “Plan a New Journey”.</div>`;if(V.p=='exp')el();if(V.p=='vault')vl();cdT()}
ico()}
const tcard=t=>{const x=tt(t);return`<div class="card h" onclick="go('plan',${t.id})"><div class="row"><b>${E(t.name)}</b><span class="pill" style="background:var(--teal)">${E(t.mode)}</span></div><div class="mut">${E(t.from)} → ${E(t.to)} · ${fd(t.dep)}–${fd(t.ret)}</div><div class="bar"><i class="${x>t.budget?'o':''}" style="width:${Math.min(100,x/t.budget*100)}%"></i></div><div class="row mut"><span>${M(x,t.cur)} spent</span><span>of ${M(t.budget,t.cur)}</span></div></div>`};
const stat=(i,v,l)=>`<div class="card st"><div class="ib">${ic(i)}</div><div><b>${v}</b><span>${l}</span></div></div>`;
const P={
dash(){const T=D.trips,tb=T.reduce((a,t)=>a+t.budget,0),te=sum(D.exp),up=T.filter(t=>t.ret>=today).sort((a,b)=>a.dep>b.dep?1:-1),re=[...D.exp].sort((a,b)=>a.date<b.date?1:-1).slice(0,5),mx=Math.max(1,...T.map(t=>Math.max(t.budget,tt(t)))),next=up[0],saved=(D.wish||D.fav||[]).length;
const imgs={Manali:'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80',Goa:'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80',Jaipur:'https://images.unsplash.com/photo-1477586517458-8e0828d4f6d0?w=800&q=80',Kashmir:'https://images.unsplash.com/photo-1566837497312-7be4c9dae936?w=800&q=80',Bali:'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',Dubai:'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',default:'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80'};
const pickImg=n=>{const k=Object.keys(imgs).find(x=>(n||'').toLowerCase().includes(x.toLowerCase()));return imgs[k]||imgs.default};
const daysLeft=t=>{const d=Math.ceil((new Date(t.dep)-new Date(today))/864e5);return d>0?d+' days left':d===0?'Starts today':'In progress'};
return`<div class="dash-hero">
  <div class="dash-welcome">
    <div>
      <div class="bd">DASHBOARD</div>
      <h2>Welcome back${D.user?', '+E(D.user.split(' ')[0]):''}</h2>
      <p>Let's plan your next adventure — track trips, budgets and memories in one place.</p>
      <div class="row" style="justify-content:flex-start;gap:10px;margin-top:14px">
        <button class="btn" onclick="wiz()">${ic('plus')}Create New Trip</button>
        <button class="btn g" onclick="V.p='disc';R()">${ic('compass')}Discover</button>
      </div>
    </div>
  </div>
</div>

<div class="grid a4 dash-stats">
  ${stat('map-pinned',T.length,'Planned trips')}
  ${stat('wallet',M(tb),'Total budget')}
  ${stat('receipt',M(te),'Total spent')}
  ${stat('heart',saved,'Saved places')}
</div>

${next?`<div class="dash-upcoming">
  <div class="dash-up-img"><img src="${pickImg(next.to||next.name)}" alt="" loading="lazy"><div class="dash-up-overlay"></div>
    <div class="dash-up-badge">${ic('calendar')} ${daysLeft(next)}</div>
  </div>
  <div class="dash-up-body">
    <span class="mut">Upcoming journey</span>
    <h3>${E(next.name)}</h3>
    <div class="mut" style="margin:6px 0 12px">${E(next.from||'—')} → ${E(next.to||next.name)} · ${fd(next.dep)} – ${fd(next.ret)} · ${next.trav||1} traveller(s)</div>
    <div class="row" style="gap:16px;margin-bottom:14px">
      <div><span class="mut">Budget</span><div class="big" style="font-size:20px;color:var(--gold)">${M(next.budget,next.cur)}</div></div>
      <div><span class="mut">Spent</span><div class="big" style="font-size:20px">${M(tt(next),next.cur)}</div></div>
      <div><span class="mut">Left</span><div class="big" style="font-size:20px;color:var(--emerald)">${M(Math.max(0,next.budget-tt(next)),next.cur)}</div></div>
    </div>
    <div class="bar" style="height:8px;margin-bottom:14px"><i class="${tt(next)>next.budget?'o':''}" style="width:${Math.min(100,pct(next))}%"></i></div>
    <div class="row" style="justify-content:flex-start;gap:8px">
      <button class="btn" onclick="go('smart',${next.id})">${ic('eye')}View Trip</button>
      <button class="btn g" onclick="go('plan',${next.id})">${ic('pencil')}Edit Plan</button>
      <button class="btn g" onclick="go('iti',${next.id})">${ic('calendar-days')}Itinerary</button>
    </div>
  </div>
</div>`:`<div class="card" style="text-align:center;padding:32px"><div style="font-size:40px;margin-bottom:8px">🧳</div><h3 style="margin:0 0 8px">No upcoming trips</h3><p class="mut" style="margin:0 0 16px">Create your first journey and track every rupee.</p><button class="btn" onclick="wiz()">${ic('plus')}Plan a New Journey</button></div>`}

<div class="grid a2" style="margin-top:18px">
  <div class="card">
    <div class="row" style="margin-bottom:12px"><h3 style="margin:0">Your trips</h3><button class="btn s g" onclick="V.p='trips';R()">See all</button></div>
    ${up.slice(0,3).map(t=>`<div class="dash-trip-row" onclick="go('smart',${t.id})">
      <div class="dash-trip-thumb"><img src="${pickImg(t.to||t.name)}" alt=""></div>
      <div style="flex:1;min-width:0"><b>${E(t.name)}</b><div class="mut">${fd(t.dep)} · ${dys(t)} days · ${M(t.budget,t.cur)}</div></div>
      <span class="pill" style="background:rgba(245,185,66,.15);color:var(--gold)">${Math.round(pct(t))}%</span>
    </div>`).join('')||'<span class="mut">No trips yet.</span>'}
  </div>
  <div class="card">
    <div class="row" style="margin-bottom:12px"><h3 style="margin:0">Recent expenses</h3><button class="btn s g" onclick="V.p='exp';R()">Tracker</button></div>
    ${re.length?re.map(e=>`<div class="row" style="padding:10px 0;border-bottom:1px solid var(--line)"><span><b>${E(e.name)}</b><br><span class="mut">${E(e.cat)} · ${fd(e.date)}</span></span><b style="color:var(--gold)">${M(e.amt)}</b></div>`).join(''):'<span class="mut">No expenses logged yet.</span>'}
  </div>
</div>

<div class="card" style="margin-top:18px">
  <h3 style="margin-top:0">Budget overview</h3>
  ${T.length?T.map(t=>`<div style="margin-bottom:12px"><div class="row mut"><span>${E(t.name)}</span><span>${M(tt(t),t.cur)} / ${M(t.budget,t.cur)}</span></div><div class="bar"><i class="${tt(t)>t.budget?'o':''}" style="width:${Math.min(100,tt(t)/Math.max(1,t.budget)*100)}%"></i></div></div>`).join(''):'<span class="mut">Add a trip to see budget progress.</span>'}
</div>

<div class="sec-title" style="margin-top:28px">Quick destinations</div>
<p class="sec-sub">Tap to start planning</p>
<div class="dest-grid" style="margin-top:0">
${[['Manali','India','₹8,500','https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80'],['Goa','India','₹9,500','https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80'],['Jaipur','India','₹6,500','https://images.unsplash.com/photo-1477586517458-8e0828d4f6d0?w=600&q=80'],['Bali','Indonesia','₹28,000','https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80']].map(([n,c,pr,img])=>`<div class="dest-card" onclick="wiz('${n}')"><div class="img"><img src="${img}" alt="${n}" loading="lazy"></div><div class="body"><h4>${n}</h4><div class="meta">${c}</div><div class="price">from ${pr}</div></div></div>`).join('')}
</div>`},
home(){return homePg()},
count(){return countPg()},disc(){return discPg()},pack(){return packPg()},vault(){return vaultPg()},
smart(){return smartPg()},
trips(){return`<div class="grid a3" style="margin-top:0">${D.trips.map(t=>tcard(t)).join('')}</div><p class="mut">Open a trip to plan it; delete from the planner.</p>`},
plan(){const t=cur(),x=tt(t),l=t.budget-x,e=ex(t.id);return`<div class="card" style="margin-top:0"><div class="row"><b>${E(t.name)}</b><span class="mut">${E(t.from)} → ${E(t.to)} · ${dys(t)} days · ${t.trav} traveler(s) · ${E(t.style)}</span><button class="btn r s" onclick="cf('Delete this trip and its expenses?',()=>{D.trips=D.trips.filter(z=>z.id!=${t.id});D.exp=D.exp.filter(z=>z.trip!=${t.id});sv();R()})">${ic('trash-2')}Delete trip</button></div></div>
${stopsCard(t)}<div class="grid a4">${stat('wallet',M(t.budget,t.cur),'Total budget')}${stat('calculator',M(x,t.cur),'Total estimated cost')}${stat(l<0?'triangle-alert':'circle-check',(l<0?'−':'')+M(Math.abs(l),t.cur),l<0?'Over budget':'Remaining budget')}${stat('user',M(x/t.trav,t.cur),'Cost per person')}</div>
<div class="card" style="margin-top:14px"><div class="row mut"><span>${Math.round(x/t.budget*100)}% of budget used</span>${x>t.budget?'<b class="bad">Over budget</b>':''}</div><div class="bar"><i class="${x>t.budget?'o':''}" style="width:${Math.min(100,x/t.budget*100)}%"></i></div></div>
<div class="grid a3">${CK.map(k=>{const v=sum(e.filter(z=>z.cat==k));return`<div class="card h" onclick="V.cat='${k}';go('exp')"><div class="st"><div class="ib" style="color:${CAT[k][1]}">${ic(CAT[k][0])}</div><div><span>${k}</span><b>${M(v,t.cur)}</b></div></div><div class="bar"><i style="width:${Math.min(100,v/t.budget*100)}%;background:${CAT[k][1]}"></i></div><span class="mut">${(v/t.budget*100).toFixed(1)}% of total budget</span></div>`}).join('')}</div>
<div class="card" style="margin-top:14px"><h3>Expense distribution</h3>${x?donut(CK.map(k=>[k,sum(e.filter(z=>z.cat==k)),CAT[k][1]]).filter(a=>a[1])):'<span class="mut">No expenses yet.</span>'}</div>`},
exp(){return`<div class="card" style="margin-top:0"><div class="fg"><div><label>Search</label><input placeholder="Search expenses…" value="${E(V.q)}" oninput="V.q=this.value;el()"></div><div><label>Category</label><select onchange="V.cat=this.value;el()"><option value="">All</option>${CK.map(k=>`<option ${V.cat==k?'selected':''}>${k}</option>`).join('')}</select></div><div><label>From</label><input type="date" value="${V.from}" onchange="V.from=this.value;el()"></div><div><label>To</label><input type="date" value="${V.to}" onchange="V.to=this.value;el()"></div><div><label>Sort by</label><select onchange="V.sort=this.value;el()">${[['dd','Newest first'],['da','Oldest first'],['ah','Amount: high to low'],['al','Amount: low to high'],['n','Name A–Z']].map(o=>`<option value="${o[0]}" ${V.sort==o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></div></div><div class="row" style="margin-top:12px"><b id="ec"></b><button class="btn" onclick="expF()">${ic('plus')}Add Expense</button></div></div><div class="card tw" style="margin-top:14px"><table id="et"></table></div>`},
split(){const t=cur(),e=ex(t.id),T=sum(e),n=t.people.length,sh=T/n,pd=t.people.map((_,i)=>sum(e.filter(z=>z.paid==i))),bal=pd.map(p=>p-sh),deb=bal.map((b,i)=>[i,-b]).filter(a=>a[1]>.5),cr=bal.map((b,i)=>[i,b]).filter(a=>a[1]>.5),out=[];
deb.forEach(d=>{let r=d[1];cr.forEach(c=>{const a=Math.min(r,c[1]);if(a>.5){out.push(`<div class="tl"><b>${E(t.people[d[0]])}</b> pays <b>${E(t.people[c[0]])}</b> ${M(a,t.cur)}</div>`);r-=a;c[1]-=a}})});
return`<div class="grid a2" style="margin-top:0"><div class="card"><h3>Travelers</h3>${t.people.map((p,i)=>`<div class="row" style="margin-bottom:6px"><input value="${E(p)}" style="flex:1" onchange="cur().people[${i}]=this.value;sv();R()"><button class="btn r s" onclick="rmP(${i})">${ic('x')}</button></div>`).join('')}<button class="btn g s" onclick="cur().people.push('Friend '+cur().people.length);sv();R()">${ic('user-plus')}Add person</button></div>
<div class="card"><h3>Equal split</h3><div class="big">${M(sh,t.cur)} <span class="mut">each · total ${M(T,t.cur)}</span></div><div class="tw"><table style="min-width:340px"><tr><th>Person</th><th>Paid</th><th>Balance</th></tr>${t.people.map((p,i)=>`<tr><td>${E(p)}</td><td>${M(pd[i],t.cur)}</td><td class="${bal[i]<-.5?'bad':'ok'}">${bal[i]<0?'−':'+'}${M(Math.abs(bal[i]),t.cur)}</td></tr>`).join('')}</table></div></div></div>
<div class="card" style="margin-top:14px"><h3>Who pays whom</h3>${out.join('')||'<span class="mut">All settled up 🎉 (set “Paid by” on each expense).</span>'}</div>`},
iti(){const t=cur(),it=D.iti.filter(i=>i.trip==t.id).sort((a,b)=>a.day-b.day||(a.time>b.time?1:-1));
return`<div class="card" style="margin-top:0"><h3>Add activity</h3><div class="fg"><div><label>Day</label><select id="i_d">${Array.from({length:dys(t)},(_,i)=>`<option value="${i+1}">Day ${i+1}</option>`).join('')}</select></div><div><label>Time</label><input id="i_t" type="time" value="09:00"></div><div><label>Activity</label><input id="i_n" placeholder="e.g. Sunset at the beach"></div></div><button class="btn" style="margin-top:12px" onclick="addI()">${ic('plus')}Add to itinerary</button></div>
<div class="grid a2">${Array.from({length:dys(t)},(_,i)=>`<div class="card"><h3>Day ${i+1} <span class="mut">· ${fd(iso(new Date(new Date(t.dep).getTime()+i*864e5)))}</span></h3>${it.filter(z=>z.day==i+1).map(z=>`<div class="tl row"><span><b>${z.time}</b> ${E(z.title)}</span><button class="btn r s" onclick="D.iti=D.iti.filter(q=>q.id!='${z.id}');sv();R()">${ic('x')}</button></div>`).join('')||'<span class="mut">Nothing planned.</span>'}</div>`).join('')}</div>`},
ana(){const T=D.trips,te=sum(D.exp),ct=CK.map(k=>[k,sum(D.exp.filter(e=>e.cat==k)),CAT[k][1]]),top=[...D.exp].sort((a,b)=>b.amt-a.amt)[0],days=T.reduce((a,t)=>a+dys(t),0)||1;
return`<div class="grid a4" style="margin-top:0">${stat('receipt',M(te),'Total spent')}${stat('sun',M(te/days),'Avg cost per travel day')}${stat('trending-up',top?M(top.amt):'–','Biggest expense')}${stat('users',M(te/Math.max(1,T.reduce((a,t)=>a+t.trav,0))),'Avg per traveler')}</div><div class="grid a2"><div class="card"><h3>Spending by category</h3>${donut(ct.filter(a=>a[1]))}</div><div class="card"><h3>Category breakdown</h3>${ct.map(([k,v,c])=>`<div class="row mut"><span>${k}</span><b>${M(v)}</b></div><div class="bar"><i style="width:${v/(te||1)*100}%;background:${c}"></i></div>`).join('')}</div></div>`},
cmp(){const T=D.trips;if(T.length<2)return'<div class="card" style="margin-top:0">Create at least two trips to compare.</div>';const a=T.find(t=>t.id==V.a)||T[0],b=T.find(t=>t.id==V.b)||T[1],sel=(k,s)=>`<select onchange="V.${k}=this.value;R()">${T.map(t=>`<option value="${t.id}" ${t.id==s.id?'selected':''}>${E(t.name)}</option>`).join('')}</select>`;
const rows=[['Budget',t=>t.budget],['Total spent',t=>tt(t)],['Cost per person',t=>tt(t)/t.trav],['Cost per day',t=>tt(t)/dys(t)],...CK.map(k=>[k,t=>sum(ex(t.id).filter(e=>e.cat==k))])];
return`<div class="card" style="margin-top:0"><div class="tw"><table style="min-width:420px"><tr><th></th><th>${sel('a',a)}</th><th>${sel('b',b)}</th></tr><tr><td>Duration</td><td>${dys(a)} days</td><td>${dys(b)} days</td></tr>${rows.map(([n,f])=>{const x=f(a),y=f(b);return`<tr><td>${n}</td><td class="${x<y?'ok':''}">${M(x,a.cur)}</td><td class="${y<x?'ok':''}">${M(y,b.cur)}</td></tr>`}).join('')}</table></div><p class="mut">Green marks the lower value.</p></div>`},
set(){return`${prof()}<div class="card" style="margin-top:14px;max-width:520px"><h3>Settings</h3><label>Your name</label><input value="${E(D.user)}" onchange="setName(this.value)"><label>Default currency</label><select onchange="D.cur=this.value;sv();toast('Saved')">${Object.keys(SY).map(c=>`<option ${c==D.cur?'selected':''}>${c}</option>`).join('')}</select><button class="btn r" style="margin-top:16px" onclick="cf('Reset all data to the demo?',()=>{D=seed();sv();V.trip=1;R()})">Reset demo data</button></div>`}};
/* ===== Smart Budget Breakdown ===== */
const DEF={Transportation:25,Accommodation:30,Food:20,Activities:10,Shopping:5,'Emergency Fund':10,Other:0};
const AL=t=>t.alloc||(t.alloc={...DEF}),pct=t=>tt(t)/t.budget*100,spent=(t,k)=>sum(ex(t.id).filter(e=>e.cat==k)),plan$=(t,k)=>t.budget*AL(t)[k]/100;
function rebal(a,k,v){v=Math.max(0,Math.min(100,Math.round(+v||0)));const o=Object.keys(a).filter(x=>x!=k),r=100-v,s=o.reduce((n,x)=>n+a[x],0),n={[k]:v};let t=v;o.forEach(x=>{n[x]=s?Math.floor(a[x]/s*r):Math.floor(r/o.length);t+=n[x]});const big=[...o].sort((x,y)=>n[y]-n[x])[0];n[big]+=100-t;return n}
function setA(k,v){const t=cur();t.alloc=rebal(AL(t),k,v);sv();R()}
function setT(k,v){const t=cur();if(k=='to'){v=String(v).trim();if(!v)return toast('Destination is required');t.to=v}else{v=+v;if(!(v>0))return toast('Enter a value above 0');if(k=='bud')t.budget=v;if(k=='trav'){t.trav=Math.round(v);while(t.people.length<t.trav)t.people.push('Friend '+t.people.length);t.people=t.people.slice(0,t.trav);D.exp.forEach(e=>{if(e.trip==t.id&&e.paid>=t.trav)e.paid=0})}if(k=='days')t.ret=iso(new Date(new Date(t.dep).getTime()+(Math.round(v)-1)*864e5))}sv();R();toast('Updated')}
function thr(b){const a=pct(cur());for(const x of[100,80,50])if(b<x&&a>=x)return x==100?'🚨 Overspending: budget exceeded!':x==80?'⚠️ 80% of your budget is used':'ℹ️ You have used 50% of your budget'}
function alerts(t){const p=pct(t),o=[];if(p>=100)o.push(['bad','🚨 Overspending: you are '+M(tt(t)-t.budget,t.cur)+' over budget.']);else if(p>=80)o.push(['warn','⚠️ 80% warning: '+p.toFixed(0)+'% used, '+M(t.budget-tt(t),t.cur)+' left.']);else if(p>=50)o.push(['info','ℹ️ Halfway there: '+p.toFixed(0)+'% of the budget is used.']);
CK.forEach(k=>{const b=plan$(t,k),s=spent(t,k);if(s>b+.5)o.push(['bad',k+' budget exceeded by '+M(s-b,t.cur)+'.'])});if(!o.length)o.push(['good','✅ All good: you are within budget in every category.']);return o}
function sugg(t){const o=[],left=t.budget-tt(t),n=dys(t),p=pct(t),ds=['Shopping','Activities','Other'].map(k=>[k,spent(t,k)]).sort((a,b)=>b[1]-a[1])[0];
CK.forEach(k=>{const b=plan$(t,k),s=spent(t,k);if(b<=0)return;if(s>b)o.push(`You are spending more than your planned ${k.toLowerCase()} budget by ${M(s-b,t.cur)}.`);else if(s/b>=.85)o.push(`Your ${k.toLowerCase()} budget is almost exhausted (${Math.round(s/b*100)}% used).`)});
o.push(left>=0?`You have ${M(left,t.cur)} remaining.`:`You are ${M(-left,t.cur)} over budget, so consider trimming optional spending.`);
if(p>=70&&ds[1]>0)o.push(`You can save money by reducing ${ds[0].toLowerCase()} expenses (currently ${M(ds[1],t.cur)}).`);
if(tt(t)/n>t.budget/n*1.1)o.push(`Your average spend per trip day (${M(tt(t)/n,t.cur)}) is above your daily budget (${M(t.budget/n,t.cur)}).`);
if(left>0&&AL(t)['Emergency Fund']>0&&spent(t,'Emergency Fund')==0)o.push(`Keep ${M(plan$(t,'Emergency Fund'),t.cur)} untouched as your emergency fund.`);return o}
function bars(t){const ks=CK.filter(k=>plan$(t,k)||spent(t,k)),mx=Math.max(1,...ks.map(k=>Math.max(plan$(t,k),spent(t,k)))),w=420/Math.max(1,ks.length);return`<svg viewBox="0 0 420 190" width="100%">${ks.map((k,i)=>{const p=plan$(t,k),s=spent(t,k),h1=p/mx*140,h2=s/mx*140,x=i*w+w/2;return`<rect x="${x-14}" y="${160-h1}" width="12" height="${h1}" rx="3" fill="#52525B"><title>Planned ${M(p,t.cur)}</title></rect><rect x="${x+2}" y="${160-h2}" width="12" height="${h2}" rx="3" fill="${s>p+.5?'#EF4444':'#F5B942'}"><title>Spent ${M(s,t.cur)}</title></rect><text x="${x}" y="176" font-size="8" text-anchor="middle" fill="currentColor">${k.slice(0,8)}</text>`}).join('')}</svg><div class="mut">Grey = allocated · Orange = actual · Red = over</div>`}
function daily(t){const n=dys(t),v=Array.from({length:n},(_,i)=>{const d=iso(new Date(new Date(t.dep).getTime()+i*864e5));return sum(ex(t.id).filter(e=>e.date==d))}),db=t.budget/n,mx=Math.max(1,db,...v),x=i=>20+i*(380/Math.max(1,n-1)),y=a=>160-a/mx*140;return`<svg viewBox="0 0 420 180" width="100%"><line x1="20" x2="400" y1="${y(db)}" y2="${y(db)}" stroke="#A1A1AA" stroke-dasharray="4"/><polyline fill="none" stroke="#F5B942" stroke-width="3" points="${v.map((a,i)=>x(i)+','+y(a)).join(' ')}"/>${v.map((a,i)=>`<circle cx="${x(i)}" cy="${y(a)}" r="4" fill="#F5B942"><title>Day ${i+1}: ${M(a,t.cur)}</title></circle>`).join('')}</svg><div class="mut">Orange = daily spending · Dashed = daily budget ${M(db,t.cur)}</div>`}
function delE(id){D.exp=D.exp.filter(z=>z.id!=id);sv();R();toast('Expense deleted')}
function smartPg(){const t=cur(),a=AL(t),x=tt(t),l=t.budget-x,p=pct(t),d=dys(t),fi=(k,lb,v,at)=>`<div><label>${lb}</label><input type="number" ${at} value="${v}" onchange="setT('${k}',this.value)"></div>`;
return`<div class="card" style="margin-top:0"><h3>Trip basics</h3><div class="fg">${fi('bud','Total trip budget ('+t.cur+')',t.budget,'min="1"')}${fi('trav','Travelers',t.trav,'min="1" step="1"')}<div><label>Destination</label><input value="${E(t.to)}" onchange="setT('to',this.value)"></div>${fi('days','Duration (days)',d,'min="1" step="1"')}</div></div>
<div class="grid a3">${stat('wallet',M(t.budget,t.cur),'Total trip budget')}${stat('receipt',M(x,t.cur),'Total expenses')}${stat(l<0?'triangle-alert':'circle-check',(l<0?'−':'')+M(Math.abs(l),t.cur),l<0?'Over budget':'Remaining budget')}${stat('user',M(x/t.trav,t.cur),'Cost per person')}${stat('sun',M(t.budget/d,t.cur),'Daily budget')}${stat('gauge',p.toFixed(1)+'%','Budget utilization')}</div>
<div class="card" style="margin-top:14px"><div class="bar"><i class="${p>=100?'o':''}" style="width:${Math.min(100,p)}%"></i></div><h3>Smart alerts</h3>${alerts(t).map(z=>`<div class="al ${z[0]}">${z[1]}</div>`).join('')}</div>
<div class="grid a2"><div class="card"><div class="row"><h3>Budget allocation</h3><b class="ok">Total ${Object.values(a).reduce((n,v)=>n+v,0)}%</b></div>${CK.map(k=>{const b=plan$(t,k),s=spent(t,k),u=b?s/b*100:(s?100:0);return`<div style="margin-bottom:10px"><div class="row"><b>${k}</b><span><input type="number" min="0" max="100" step="1" value="${a[k]}" style="width:72px" onchange="setA('${k}',this.value)"> %</span></div><div class="bar"><i class="${u>100?'o':''}" style="width:${Math.min(100,u)}%;${u>100?'':'background:'+CAT[k][1]}"></i></div><div class="row mut"><span>Planned ${M(b,t.cur)} · spent ${M(s,t.cur)}</span><span>${Math.round(u)}% used</span></div></div>`}).join('')}<button class="btn g s" onclick="cur().alloc={...DEF};sv();R()">Restore default split</button></div>
<div class="card"><h3>Allocation pie</h3>${donut(CK.map(k=>[k,a[k],CAT[k][1]]).filter(z=>z[1]))}<h3 style="margin-top:16px">Allocated vs actual</h3>${bars(t)}</div></div>
<div class="card" style="margin-top:14px"><h3>Daily spending</h3>${daily(t)}</div>
<div class="card" style="margin-top:14px"><h3>Smart suggestions</h3>${sugg(t).map(z=>`<div class="tl">${E(z)}</div>`).join('')}</div>
<div class="card" style="margin-top:14px"><div class="row"><h3>Expense history by category</h3><button class="btn" onclick="expF()">${ic('plus')}Add expense</button></div>${CK.map(k=>{const l=ex(t.id).filter(e=>e.cat==k).sort((a,b)=>a.date<b.date?1:-1);return`<details ${l.length?'':'style="opacity:.6"'}><summary>${k} · ${l.length} · ${M(sum(l),t.cur)}</summary>${l.map(e=>`<div class="row" style="padding:5px 0"><span><b>${E(e.name)}</b> <span class="mut">${fd(e.date)}</span></span><span><b>${M(e.amt,t.cur)}</b> <button class="btn g s" onclick="expF('${e.id}')">Edit</button> <button class="btn r s" onclick="cf('Delete this expense?',()=>delE('${e.id}'))">Delete</button></span></div>`).join('')||'<span class="mut">No expenses yet.</span>'}</details>`}).join('')}</div>
<div class="card row" style="margin-top:14px"><button class="btn o" onclick="out('txt')">${ic('file-down')}Download Budget Report</button><button class="btn" onclick="out('csv')">${ic('table')}Export CSV</button><button class="btn r" onclick="cf('Reset this budget? Its expenses are deleted and the split returns to default.',()=>{D.exp=D.exp.filter(e=>e.trip!=cur().id);cur().alloc={...DEF};sv();R();toast('Budget reset')})">${ic('rotate-ccw')}Reset budget</button></div>`}
function report(){const t=cur(),a=AL(t),x=tt(t);return[`JourneyJar Budget Report: ${t.name}`,`${t.from} to ${t.to} | ${t.dep} to ${t.ret} (${dys(t)} days) | ${t.trav} traveler(s)`,'',`Budget: ${t.budget} ${t.cur}`,`Spent: ${x} (${pct(t).toFixed(1)}%)`,`Remaining: ${t.budget-x}`,`Per person: ${(x/t.trav).toFixed(2)} | Daily budget: ${(t.budget/dys(t)).toFixed(2)}`,'','Category | Allocation | Planned | Spent',...CK.map(k=>`${k} | ${a[k]}% | ${Math.round(plan$(t,k))} | ${spent(t,k)}`),'','Alerts:',...alerts(t).map(z=>'- '+z[1]),'','Suggestions:',...sugg(t).map(z=>'- '+z),'','Expenses:',...ex(t.id).sort((p,q)=>p.date>q.date?1:-1).map(e=>`${e.date} | ${e.cat} | ${e.name} | ${e.amt}`)].join('\n')}
function csv(){const t=cur(),q=s=>'"'+String(s).replace(/"/g,'""')+'"';return['Date,Category,Name,Amount,Paid by,Notes',...ex(t.id).map(e=>[e.date,e.cat,q(e.name),e.amt,q(t.people[e.paid]||''),q(e.notes)].join(','))].join('\n')}
function dl(){try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([_o[1]],{type:'text/plain'}));a.download=_o[0];document.body.appendChild(a);a.click();a.remove()}catch(e){toast('Download blocked here, use Copy')}}
function out(k){const t=cur(),c=k=='csv';window._o=[t.name.replace(/\W+/g,'_')+(c?'_expenses.csv':'_report.txt'),c?csv():report()];dl();modal(`<h3>${c?'Expenses CSV':'Budget report'}</h3><p class="mut">Your file should download automatically. If not, use the buttons below.</p><textarea rows="10" readonly style="font:12px monospace">${E(_o[1])}</textarea><div class="row" style="margin-top:12px"><button class="btn g" onclick="cl()">Close</button><button class="btn g" onclick="navigator.clipboard&&navigator.clipboard.writeText(_o[1]);toast('Copied')">Copy</button><button class="btn" onclick="dl()">Download again</button></div>`)}
/* ===== Redesign: landing / home ===== */
const STY={Budget:{Transportation:30,Accommodation:25,Food:20,Activities:10,Shopping:5,'Emergency Fund':10,Other:0},Standard:{...DEF},Luxury:{Transportation:25,Accommodation:38,Food:18,Activities:9,Shopping:5,'Emergency Fund':5,Other:0}};
const HD=[['Manali','🏔️','#3f3a2a,#071426',8500,4.7],['Goa','🏖️','#4a3d1c,#071426',9500,4.6],['Darjeeling','🍵','#2f3a36,#071426',7500,4.5],['Jaipur','🏰','#52401a,#071426',6500,4.6]];
const FT=[['Smart Budget Breakdown','chart-pie','Split your budget by category','smart'],['Itinerary Planner','map-pinned','Plan every day of the trip','iti'],['Live Expense Tracker','receipt','Track spending instantly','exp'],['Weather Forecast & Suggestions','cloud-sun','7-day forecast and packing tips','W'],['Group Trip Splitter','users','Settle up fairly','split'],['Download Trip Report','file-down','Save a PDF report','P'],['Trip Countdown','timer','Live countdown to departure','count'],['Smart Packing','briefcase','Checklist built for your trip','pack'],['Travel Vault','shield-check','Organise trip documents','vault'],['Discover Destinations','compass','Images, movies and stories','disc']];
const HERO="<svg viewBox='0 0 420 320' width='100%' role='img' aria-label='Mountains, lake and sunset with suitcase, camera, map and hat'><defs><linearGradient id='gs' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#4a3d1c'/><stop offset='.6' stop-color='#1f1c14'/><stop offset='1' stop-color='#071426'/></linearGradient><linearGradient id='gl' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#3a3118'/><stop offset='1' stop-color='#071426'/></linearGradient></defs><rect width='420' height='320' rx='24' fill='url(#gs)'/><circle cx='290' cy='130' r='34' fill='#F5B942'/><path d='M0 200l70-90 50 60 60-80 80 110 70-70 90 90v100H0z' fill='#2a2a2f'/><path d='M0 230l90-70 70 60 80-60 90 70 90-50v150H0z' fill='#18181B'/><rect y='232' width='420' height='88' fill='url(#gl)' opacity='.9'/><ellipse cx='290' cy='250' rx='40' ry='5' fill='#fff3c4' opacity='.6'/><rect x='40' y='190' width='96' height='80' rx='14' fill='#F5B942'/><rect x='70' y='176' width='36' height='18' rx='6' fill='none' stroke='#FFD166' stroke-width='5'/><rect x='58' y='190' width='8' height='80' fill='#071426'/><rect x='110' y='190' width='8' height='80' fill='#071426'/><rect x='160' y='225' width='70' height='46' rx='9' fill='#F8F5EC'/><circle cx='195' cy='248' r='15' fill='#071426'/><circle cx='195' cy='248' r='8' fill='#F5B942'/><rect x='170' y='217' width='22' height='9' rx='3' fill='#F8F5EC'/><path d='M250 238l30-8 30 8 30-8v46l-30 8-30-8-30 8z' fill='#fff8dc'/><path d='M280 230v46M310 238v46' stroke='#F5B942' stroke-width='2'/><path d='M268 258l14 6 18-12' stroke='#FFD166' stroke-width='3' fill='none'/><ellipse cx='370' cy='262' rx='42' ry='9' fill='#FFD166'/><path d='M345 262c0-26 50-26 50 0z' fill='#FFD166'/><rect x='347' y='254' width='46' height='6' fill='#071426'/></svg>";
function homePg(){const T=D.trips,t=[...T].filter(z=>z.ret>=today).sort((a,b)=>a.dep>b.dep?1:-1)[0]||T[0],f=D.fav||[];
let dash=`<div class='card dk'><div style='text-align:center;padding:16px'>🧳<br>No trips yet. Use Plan Your Trip above to create one.</div></div>`;
if(t){const x=tt(t),dd=Math.ceil((new Date(t.dep)-new Date(today))/864e5),tb=T.reduce((a,z)=>a+z.budget,0);dash=`<div class='grid a3' style='margin-top:0'><div class='card dk'><span class='mut'>Upcoming trip</span><h3 style='margin:4px 0'>${E(t.name)}</h3><div class='mut'>${dd>0?'Starts in '+dd+' day(s)':dd==0?'Starts today':'In progress or completed'}</div></div><div class='card dk'><span class='mut'>Total planned budget (all trips)</span><div class='big' style='color:#FFD166'>${M(tb)}</div><div class='mut'>${T.length} trip(s)</div></div><div class='card dk'><span class='mut'>Spent on this trip</span><div class='big' style='color:#FFD166'>${M(x,t.cur)}</div><div class='bar'><i class='${x>t.budget?'o':''}' style='width:${Math.min(100,pct(t))}%'></i></div><div class='mut'>${pct(t).toFixed(0)}% of ${M(t.budget,t.cur)}</div></div></div><div class='grid a2'><div class='card dk'><h3>Budget breakdown</h3>${CK.filter(k=>plan$(t,k)||spent(t,k)).map(k=>{const b=plan$(t,k),s=spent(t,k),u=b?s/b*100:100;return`<div class='row mut'><span>${k}</span><span>${M(s,t.cur)} / ${M(b,t.cur)}</span></div><div class='bar'><i class='${u>100?'o':''}' style='width:${Math.min(100,u)}%'></i></div>`}).join('')}</div><div class='card dk'><h3>Upcoming trip details</h3><div class='mut'>${E(t.from)} → ${E(t.to)}</div><div class='mut'>${fd(t.dep)} – ${fd(t.ret)} · ${dys(t)} days · ${t.trav} traveller(s)</div><div class='mut'>${E(t.mode)} · ${E(t.acc)} · ${E(t.style)}</div><div class='mut'>Per person: ${M(x/t.trav,t.cur)} · Daily budget: ${M(t.budget/dys(t),t.cur)}</div><button class='btn o' style='margin-top:14px' onclick='go("smart",${t.id})'>View Plan</button></div></div>`}
return`<div class='hp'><div><div class='bd'>JOURNEYJAR</div><h1>Your Journey.<br>Your Budget. Your Story.</h1><div class='gs'>Discover destinations. Plan smarter trips.</div><p>Discover breathtaking destinations, plan unforgettable trips, and make every journey memorable — all within your budget.</p><div class='row' style='justify-content:flex-start'><button class='btn' onclick="nv(1);document.querySelector('[onclick*=disc]')?.click?.()||(V.p='disc',R())">${ic('compass')}Explore Destinations</button><button class='btn o' onclick='wiz()'>${ic('map')}Start Planning</button></div></div>
<div class='hp-hero-img'><img src='https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200&q=80' alt='Tropical destination' loading='eager'><div class='hp-float-card'><div><b>Maldives Escape</b><br><span>5 nights · from ₹45,000</span></div><button class='btn s' onclick='wiz()'>View Details</button></div></div></div>
<div class='search-panel'><div><label>Where to?</label><input id='sp_to' placeholder='Manali, Goa, Bali…'></div><div><label>From city</label><input id='sp_from' placeholder='Your city'></div><div><label>Check-in</label><input id='sp_in' type='date'></div><div><label>Check-out</label><input id='sp_out' type='date'></div><div><label>Travelers</label><input id='sp_tr' type='number' min='1' value='2'></div><div><label>Budget (₹)</label><input id='sp_bu' type='number' min='1000' value='25000'></div><button class='btn' onclick='wiz()'>${ic('search')}Search</button></div>
<div class='sec-title'>Popular Destinations</div><p class='sec-sub'>Handpicked places travelers love — start planning in one click</p>
<div class='dest-grid'>
${[['Manali','India','₹8,500','https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80'],['Goa','India','₹9,500','https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80'],['Jaipur','India','₹6,500','https://images.unsplash.com/photo-1477586517458-8e0828d4f6d0?w=600&q=80'],['Kashmir','India','₹12,000','https://images.unsplash.com/photo-1566837497312-7be4c9dae936?w=600&q=80'],['Bali','Indonesia','₹28,000','https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80'],['Dubai','UAE','₹35,000','https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80']].map(([n,c,pr,img])=>`<div class='dest-card' onclick="document.getElementById('h_to')&&(document.getElementById('h_to').value='${n}');wiz()"><div class='img'><img src='${img}' alt='${n}' loading='lazy'></div><div class='body'><h4>${n}</h4><div class='meta'>${c}</div><div class='price'>from ${pr}</div></div></div>`).join('')}
</div>
<div class='sec-title'>Why JourneyJar</div><p class='sec-sub'>Everything you need to plan, budget and enjoy your trip</p>
<div class='feat-grid'>
${[['Smart Trip Planner','map','Plan day-by-day itineraries'],['Smart Budget','wallet','Allocate every rupee wisely'],['Discover Places','compass','Photos, movies & local tips'],['Expense Tracker','receipt','Track spending in real time'],['Trip Splitter','users','Split costs with friends'],['Travel Vault','shield','Keep documents safe']].map(([t,i,d])=>`<div class='feat-card'><div class='ic'>${ic(i)}</div><h4>${t}</h4><p>${d}</p></div>`).join('')}
</div>

<div class='card fl' id='planner'><h3 style='font-size:19px'>Plan Your Trip</h3><div class='fg'><div><label>Destination</label><input id='h_to' placeholder='e.g. Manali'></div><div><label>Duration (days)</label><input id='h_du' type='number' min='1' max='60' value='4'></div><div><label>Budget in ₹</label><input id='h_bu' type='number' min='1' value='25000'></div><div><label>Number of travellers</label><input id='h_tr' type='number' min='1' value='2'></div><div><label>Travel style</label><select id='h_st'><option>Budget</option><option selected>Standard</option><option>Luxury</option></select></div></div><div id='he'></div><button class='btn' style='margin-top:14px;font-size:15px' onclick='genPlan()'>${ic('sparkles')}Generate Plan</button></div>
<div class='grid a3'>${FT.map((z,i)=>`<div class='card h' onclick='ft(${i})'><div class='st'><div class='ib'>${ic(z[1])}</div><div><b style='font-size:15px'>${z[0]}</b><span>${z[2]}</span></div></div></div>`).join('')}</div>
<h3 id='dst' style='margin-top:26px'>Popular destinations</h3><div class='grid a4' style='margin-top:0'>${HD.map((d,i)=>`<div class='dest' style='background:linear-gradient(135deg,${d[2]});min-height:170px' onclick='pick(${i})'><button class='hrt ${f.includes(d[0])?'on':''}' onclick='fav(event,${i},this)' title='Favourite'>♥</button><em>${d[1]}</em><b style='font-size:18px'>${d[0]}</b><small>From ${M(d[3],'INR')} · ★ ${d[4]}</small></div>`).join('')}</div><p class='mut'>Demo data: starting budgets and ratings on destination cards are illustrative. Everything else comes from your trips.</p>
<h3 style='margin-top:22px'>Travel dashboard</h3>${dash}
<div class='aib'><div><h2 style='margin:0 0 4px'>Travel Smarter with JourneyJar</h2><p style='margin:0 0 14px;opacity:.9'>Your personal AI travel assistant is here!</p><button class='btn o' onclick='ai()'>${ic('message-circle')}Ask Anything</button></div><svg width='200' height='110' viewBox='0 0 200 110'><path d='M0 100l45-60 30 38 35-50 45 72 25-30 20 30z' fill='#ffffff33'/><path d='M0 100l60-40 40 30 50-35 50 45z' fill='#063B2E88'/><path d='M120 22l40-8-14 12 22 4-26 6-6 12z' fill='#FFD166'/><path d='M20 20c30 10 50 0 70 14' stroke='#FFD166' stroke-dasharray='4 5' fill='none'/><circle cx='20' cy='20' r='4' fill='#FFD166'/></svg></div>`}
function nm(){$('#nb').classList.toggle('mo')}
function nbA(){document.querySelectorAll('#nl a').forEach((a,i)=>a.classList.toggle('on',(V.p=='home'&&i==0)||(V.p=='trips'&&i==1)))}
function nv(i){$('#nb').classList.remove('mo');if(i==0)go('home');else if(i==1)go('trips');else if(i==5)go('set');else if(i==2)go('disc');else modal(i==3?`<h3>About JourneyJar</h3><p>JourneyJar helps you plan trips, split a budget by category, track expenses, share costs with friends and export a report. Everything is stored in your browser.</p><button class='btn g' onclick='cl()'>Close</button>`:`<h3>Help</h3><p>1) Fill in Plan Your Trip and press Generate Plan. 2) Add expenses in Expense Tracker. 3) Watch alerts in Smart Budget. 4) Use Trip Splitter to settle up. 5) Download the PDF report.</p><button class='btn g' onclick='cl()'>Close</button>`)}
function tg(){const r=document.documentElement,d=r.getAttribute('data-theme')=='dark'||(!r.getAttribute('data-theme')&&matchMedia('(prefers-color-scheme:dark)').matches);D.theme=d?'light':'dark';th(D.theme);sv()}
function ft(i){const k=FT[i][3];if(k=='W')weather();else if(k=='P')pdf();else go(k)}
function pick(i){$('#h_to').value=HD[i][0];$('#planner').scrollIntoView({behavior:'smooth'});$('#h_to').focus()}
function fav(e,i,b){e.stopPropagation();D.fav=D.fav||[];const n=HD[i][0],j=D.fav.indexOf(n);j<0?D.fav.push(n):D.fav.splice(j,1);b.classList.toggle('on',j<0);sv()}
function demo(){modal(`<h3>Quick tour</h3>${[['Generate a plan','home'],['See alerts and charts','smart'],['Track expenses','exp'],['Split costs','split'],['Plan the itinerary','iti']].map((z,i)=>`<div class='row' style='margin:8px 0'><span>${i+1}. ${z[0]}</span><button class='btn g s' onclick='cl();go("${z[1]}")'>Open</button></div>`).join('')}<button class='btn g' onclick='cl()'>Close</button>`)}
function genPlan(){const g=k=>$('#h_'+k).value.trim(),to=g('to'),du=+g('du'),bu=+g('bu'),tr=+g('tr'),st=g('st'),e=[];if(!to)e.push('Enter a destination');if(!(du>=1&&du<=60&&Number.isInteger(du)))e.push('Duration must be a whole number from 1 to 60');if(!(bu>0))e.push('Enter a budget above 0');if(!(tr>=1&&Number.isInteger(tr)))e.push('Travellers must be a whole number, at least 1');
if(e.length){$('#he').innerHTML=`<div class='err'>${e.join('<br>')}</div>`;return}
const id=Date.now(),day=i=>iso(new Date(Date.now()+(14+i)*864e5)),mid=['Sightseeing in '+to,'Local food walk','Adventure and activities','Shopping and markets','Relax and explore nearby'];
D.trips.push({id,name:to+' Trip',from:'Home',to,dep:day(0),ret:day(du-1),trav:tr,mode:'Train',budget:bu,acc:'Hotel',style:st,cur:'INR',people:Array.from({length:tr},(_,i)=>i?'Friend '+i:'You'),alloc:{...STY[st]}});
for(let d=1;d<=du;d++)D.iti.push({id:rid(),trip:id,day:d,time:d==1?'12:00':'09:00',title:d==1?'Arrive in '+to+' and check in':d==du&&du>1?'Breakfast and departure':mid[(d-2)%mid.length]});
sv();V.trip=id;go('smart');toast('Plan generated. Review your budget breakdown.')}
function pdf(){const t=cur();if(!t)return toast('Create a trip first');const a=AL(t),x=tt(t),it=D.iti.filter(i=>i.trip==t.id).sort((p,q)=>p.day-q.day);
$('#pr').innerHTML=`<h1>JourneyJar Trip Report</h1><h2>${E(t.name)}</h2><p>${E(t.from)} to ${E(t.to)} · ${t.dep} to ${t.ret} · ${t.trav} traveller(s) · ${E(t.style)}</p><p>Budget ${M(t.budget,t.cur)} · Spent ${M(x,t.cur)} (${pct(t).toFixed(1)}%) · Remaining ${M(t.budget-x,t.cur)} · Per person ${M(x/t.trav,t.cur)}</p><table border='1' cellpadding='5' style='border-collapse:collapse;width:100%'><tr><th>Category</th><th>Allocation</th><th>Planned</th><th>Spent</th></tr>${CK.map(k=>`<tr><td>${k}</td><td>${a[k]}%</td><td>${M(plan$(t,k),t.cur)}</td><td>${M(spent(t,k),t.cur)}</td></tr>`).join('')}</table><h3>Expenses</h3><table border='1' cellpadding='5' style='border-collapse:collapse;width:100%'>${ex(t.id).sort((p,q)=>p.date>q.date?1:-1).map(e=>`<tr><td>${e.date}</td><td>${e.cat}</td><td>${E(e.name)}</td><td>${M(e.amt,t.cur)}</td></tr>`).join('')}</table><h3>Itinerary</h3>${it.map(i=>`<div>Day ${i.day} ${i.time}: ${E(i.title)}</div>`).join('')||'<div>No itinerary items.</div>'}<h3>Alerts</h3>${alerts(t).map(z=>`<div>${E(z[1])}</div>`).join('')}`;
toast('Choose "Save as PDF" in the print dialog');try{window.print()}catch(e){toast('Printing is blocked here')}}
async function weather(){const t=cur();if(!t)return toast('Create a trip first');modal(`<h3>Weather for ${E(t.to)}</h3><div id='wx' class='mut'><span class='sp'></span> Loading…</div><button class='btn g' style='margin-top:12px' onclick='cl()'>Close</button>`);
try{const city=(t.to||'').split(',')[0].trim();const g=await(await fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&name='+encodeURIComponent(city))).json();if(!g.results||!g.results.length)throw 0;const r=g.results[0],w=(await(await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${r.latitude}&longitude=${r.longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7`)).json()).daily,tips=[];
if(Math.max(...w.precipitation_probability_max)>=50)tips.push('Rain is likely: pack an umbrella or raincoat.');if(Math.max(...w.temperature_2m_max)>=32)tips.push('Hot days: carry water and sunscreen.');if(Math.min(...w.temperature_2m_min)<=12)tips.push('Cool nights: pack warm layers.');if(!tips.length)tips.push('Mild weather: light, comfortable clothing is fine.');
$('#wx').innerHTML=`<div class='tw'><table style='min-width:340px'><tr><th>Day</th><th>High</th><th>Low</th><th>Rain</th></tr>${w.time.map((d,i)=>`<tr><td>${fd(d)}</td><td>${Math.round(w.temperature_2m_max[i])}°C</td><td>${Math.round(w.temperature_2m_min[i])}°C</td><td>${w.precipitation_probability_max[i]??'-'}%</td></tr>`).join('')}</table></div>${tips.map(z=>`<div class='tl'>${z}</div>`).join('')}`}catch(e){$('#wx').innerHTML='Could not load the forecast. This feature needs internet access to the free Open-Meteo service and the destination name to be recognised.'}}
function generateTravelAdvice(q, t){
  const k = String(q||'').toLowerCase();
  const dest = t ? t.to : 'your destination';
  const bud = t ? M(t.budget, t.cur) : 'budget';
  const spentAmt = t ? M(tt(t), t.cur) : '0';
  const left = t ? M(Math.max(0, t.budget - tt(t)), t.cur) : '0';
  const days = t ? dys(t) : 4;
  const tr = t ? t.trav : 2;

  if(/save|money|budget|cost|cheap|reduce|cut|expense/.test(k)){
    return `<h3>💰 Smart Budget Tips for ${E(dest)}</h3>
    <p>For your planned budget of <b>${bud}</b> (Remaining: <b>${left}</b> for ${tr} traveler(s)):</p>
    <ul>
      <li><b>Transportation:</b> Book trains or overnight buses instead of last-minute flights; rent a scooter/bike locally instead of individual cabs.</li>
      <li><b>Food & Drinks:</b> Savor local dhabas, street food hubs, and popular thali joints rather than hotel dining or beach shacks.</li>
      <li><b>Stay:</b> Consider verified homestays or hostels where breakfast is included; look for stays slightly away from the main tourist strip.</li>
      <li><b>Activities:</b> Combine free walking tours, nature treks, and public beaches; negotiate group activity packages.</li>
      <li><b>Emergency Buffer:</b> Keep at least 10% (${t ? M(t.budget*0.1, t.cur) : '10%'}) untouched as your safety reserve.</li>
    </ul>`;
  }
  if(/pack|luggage|bag|clothes|wear|carry|bring/.test(k)){
    return `<h3>🎒 Packing Essentials for ${E(dest)} (${days} Days)</h3>
    <ul>
      <li><b>Apparel:</b> 3–4 versatile quick-dry outfits, comfortable walking shoes, light warm layer for cool evenings, and sunglasses/cap.</li>
      <li><b>Gadgets:</b> 10,000+ mAh power bank, universal adapter, earphones, and offline map downloads (Google Maps / Maps.me).</li>
      <li><b>Health Kit:</b> Personal prescription meds, antacids/ORS, paracetamol, band-aids, and mosquito repellent.</li>
      <li><b>Documents:</b> Original government ID card, digital copies saved in your JourneyJar <b>Travel Vault</b>, and some emergency cash.</li>
    </ul>`;
  }
  if(/food|eat|dish|cuisine|restaurant|drink|cafe/.test(k)){
    let del = 'local street food, fresh seasonal fruits, traditional thalis, and regional tea';
    const d = dest.toLowerCase();
    if(/goa/.test(d)) del = 'Goan Fish Curry Rice, Bebinca, Poi bread, Chicken Xacuti, Kingfish Rawa Fry, and Kokum juice';
    else if(/manali|himachal/.test(d)) del = 'Steaming Siddu with ghee, hot Thukpa, Trout fish fry, Chana Madra, and roadside ginger-lemon tea';
    else if(/jaipur|rajasthan/.test(d)) del = 'Authentic Dal Baati Churma, Pyaaz Kachori, Ghevar, Laal Maas, and thick mawa lassi at MI Road';
    else if(/paris|france/.test(d)) del = 'Fresh butter croissants, baguettes with artisan cheese, Boeuf Bourguignon, and macarons';
    return `<h3>🍽️ Culinary Recommendations for ${E(dest)}</h3>
    <p>Don't leave ${E(dest)} without tasting: <b>${del}</b>.</p>
    <ul>
      <li><b>Where to eat:</b> Look for eateries crowded with locals — high customer turnover guarantees fresh, authentic food.</li>
      <li><b>Hygiene tip:</b> Drink bottled or filtered water, and prefer cooked-to-order hot meals over pre-cut items.</li>
    </ul>`;
  }
  if(/itinerary|plan|day|schedule|visit|see|attraction|things to do/.test(k)){
    return `<h3>🗺️ Suggested ${days}-Day Itinerary Outline for ${E(dest)}</h3>
    <ul>
      <li><b>Day 1 (Arrival & Orientation):</b> Arrive, check in, take a relaxed stroll through the local market or scenic viewpoint, and enjoy dinner.</li>
      <li><b>Day 2 (Top Landmarks & Culture):</b> Explore the city's signature cultural sites, museums, or historic forts in the morning; visit scenic sunset spots.</li>
      <li><b>Day 3 (Adventure & Exploration):</b> Day trip to nearby scenic nature spots, waterfalls, or adventure sports; try authentic regional dinner.</li>
      <li><b>Day 4 (Leisure & Shopping):</b> Souvenir shopping at local bazaars, cafe hopping, photography, and smooth departure.</li>
    </ul>
    <p class='mut'>Tip: You can add these activities directly to your <b>Itinerary</b> tab above!</p>`;
  }
  return `<h3>🧭 Travel Assistant Insights for ${E(dest)}</h3>
  <p>Here are recommendations tailored for your <b>${E(t?t.style:'Standard')}</b> trip to <b>${E(dest)}</b> (${tr} traveler(s), ${days} days):</p>
  <ul>
    <li><b>Budget Monitoring:</b> You have planned <b>${bud}</b>. Check your <b>Smart Budget</b> tab to track spending velocity.</li>
    <li><b>Safety & Connectivity:</b> Save local emergency contacts and download offline maps before traveling to remote or mountain zones.</li>
    <li><b>Local Etiquette:</b> Respect regional traditions, dress modestly around heritage shrines and temples, and carry cash for small vendors.</li>
  </ul>`;
}
function ai(){
  const t=cur();modal(`<h3>${ic('message-circle')} Ask JourneyJar Travel AI</h3>
    <div style='background:#18181B;border:1px solid #F5B94233;border-radius:14px;padding:12px;margin:10px 0'>
      <div style='display:flex;align-items:center;gap:8px;font-size:13px;color:#FFD166;font-weight:600'>${ic('sparkles')} Smart Assistant for ${E(t?t.name:'your journey')}</div>
      <div class='mut' style='font-size:12px;margin-top:4px'>Destination: <b>${E(t?t.to:'Travel')}</b> · Budget: <b>${t?M(t.budget,t.cur):'–'}</b> · Days: <b>${t?dys(t):'–'}</b></div>
    </div>
    <div style='margin-bottom:8px'>
      <span class='mut' style='font-size:11px'>Suggested quick questions:</span>
      <div class='row' style='justify-content:flex-start;gap:6px;margin-top:4px;flex-wrap:wrap'>
        <button class='btn g s' onclick='$("#ai_q").value="How can I save money on this trip?";askAI()'>💰 Money saving tips</button>
        <button class='btn g s' onclick='$("#ai_q").value="What are the essential packing items?";askAI()'>🎒 Must-pack list</button>
        <button class='btn g s' onclick='$("#ai_q").value="Suggest a day-wise itinerary";askAI()'>🗺️ Itinerary plan</button>
        <button class='btn g s' onclick='$("#ai_q").value="Famous local food to try";askAI()'>🍽️ Local food</button>
      </div>
    </div>
    <label>Your question</label>
    <textarea id='ai_q' rows='3' placeholder='e.g. How can I optimize my food and travel budget in ${E(t?t.to:'Goa')}?'></textarea>
    <div id='ai_a' style='margin:12px 0;max-height:260px;overflow-y:auto'></div>
    <details style='margin-bottom:12px;font-size:12px'><summary class='mut' style='cursor:pointer'>⚙️ Custom AI Endpoint (Optional)</summary><div style='margin-top:8px'><input id='ai_u' value='${E(D.aiUrl||'')}' placeholder='https://your-server.example/ask' style='font-size:12px'><button class='btn g s' style='margin-top:6px' onclick='D.aiUrl=$("#ai_u").value.trim();sv();toast("Endpoint saved")'>Save Endpoint</button></div></details>
    <div class='row'><button class='btn g' onclick='cl()'>Close</button><button class='btn' onclick='askAI()'>${ic('sparkles')}Ask Assistant</button></div>`);
}
async function askAI(){
  const q=$('#ai_q').value.trim(), o=$('#ai_a');
  if(!q){o.innerHTML='<div class="err">Type a question first or tap a suggestion above.</div>';return}
  o.innerHTML='<div class="card gl" style="text-align:center;padding:20px"><span class="sp"></span> Analyzing your trip and crafting recommendations…</div>';
  const t=cur();
  if(D.aiUrl){
    try{
      const r=await fetch(D.aiUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:q,trip:t?{name:t.name,to:t.to,budget:t.budget,spent:tt(t),days:dys(t),travellers:t.trav}:null})});
      if(!r.ok)throw 0;
      const j=await r.json();
      o.innerHTML=`<div class='card gl' style='border:1px solid #F5B94244;padding:16px;line-height:1.6'>${E(j.answer||'No answer received from endpoint.').replace(/\n/g,'<br>')}</div>`;
      return;
    }catch(e){
      o.innerHTML=`<div class='err'>Could not reach custom endpoint. Falling back to built-in JourneyJar AI…</div>`;
      await new Promise(res=>setTimeout(res,600));
    }
  }
  await new Promise(res=>setTimeout(res,350));
  const ans=generateTravelAdvice(q, t);
  o.innerHTML=`<div class='card gl' style='border:1px solid #F5B94244;padding:16px;line-height:1.6;animation:in .3s'>${ans}</div>`;
  ico();
}
if(D.theme)th(D.theme);
/* ===== Firebase Auth + Firestore sync ===== */
let FBMISS=[],FBSDK=false,FBFILE=location.protocol=='file:',FBOK=false,JJ=null;
function fbHelp(){if(!FBSDK)return`<div class='err'>The Firebase module did not load. Check your internet connection and that firebase-config.js is uploaded, then refresh.</div>`;
if(FBFILE)return`<div class='err'><b>Open the site through a web server.</b> Firebase login does not work from a file:// address. In VS Code use the Live Server extension (Go Live), or run python -m http.server and open http://localhost:8000.</div>`;
return`<div class='err'><b>Firebase is not connected yet.</b> Still missing in firebase-config.js: ${FBMISS.join(', ')}.<ol style='margin:8px 0 0 18px;padding:0'><li>Firebase console › Project settings › Your apps › Web app.</li><li>Copy the config values.</li><li>Open firebase-config.js and replace each YOUR_ value.</li><li>Enable Email/Password under Authentication › Sign-in method.</li><li>Save and refresh.</li></ol></div>`}
const LOGO="<svg width='30' height='30' viewBox='0 0 40 40'><path d='M3 32L15 12l7 11 5-7 10 16z' fill='#F5B942'/><path d='M27 4a7 7 0 017 7c0 6-7 13-7 13s-7-7-7-13a7 7 0 017-7z' fill='#FFD166'/><circle cx='27' cy='11' r='2.4' fill='#071426'/></svg>";
const FE={'auth/invalid-credential':'Incorrect email or password.','auth/wrong-password':'Incorrect email or password.','auth/user-not-found':'No account found for this email.','auth/email-already-in-use':'An account with this email already exists.','auth/weak-password':'Password is too weak (use at least 6 characters).','auth/invalid-email':'Enter a valid email address.','auth/too-many-requests':'Too many attempts. Please try again later.','auth/network-request-failed':'Network error. Check your connection.','auth/operation-not-allowed':'This sign-in method is not enabled. In the Firebase console open Authentication, Sign-in method, and enable it (Email/Password or Google).','auth/popup-closed-by-user':'The sign-in window was closed before finishing.','auth/cancelled-popup-request':'Another sign-in window is already open.','auth/popup-blocked':'Your browser blocked the sign-in pop-up. Allow pop-ups and try again.','auth/account-exists-with-different-credential':'An account already exists with this email using a different sign-in method.','permission-denied':'Firestore denied access. Publish the rules from firestore.rules.','auth/unauthorized-domain':'This website address is not authorised in Firebase. Add it under Authentication, Settings, Authorized domains (for example localhost or yourname.github.io).','auth/invalid-api-key':'The Firebase API key is invalid. Re-copy it from your Firebase project settings.','auth/api-key-not-valid.-please-pass-a-valid-api-key.':'The Firebase API key is invalid. Re-copy it from your Firebase project settings.','auth/configuration-not-found':'Authentication is not set up yet. In the Firebase console open Authentication and click Get started.','auth/operation-not-supported-in-this-environment':'Firebase login needs http or https. Use Live Server, localhost or GitHub Pages.'},fe=c=>FE[c]||'Something went wrong ('+(c||'unknown')+').';
const cloud=x=>JSON.stringify([x.trips,x.exp,x.iti,x.cur,x.fav||[],x.user,x.cd||null,x.cdt||'',x.cds||0,x.pack||{}]);
function am(m,msg){AM=m;const up=m==1,rs=m==2;
const form=`<div class='auth-form'><div class='lgo' style='justify-content:center;font-size:24px'>${LOGO}<span>JourneyJar</span></div>
<p class='mut' style='text-align:center;margin:4px 0 12px'>Every Journey, Within Your Budget.</p>
${FBOK?'':fbHelp()}
${rs?`<h3 style='margin-top:8px'>Reset your password</h3><p class='mut'>We will email you a reset link.</p>`:`<div class='at'><button class='${up?'':'on'}' onclick='am(0)'>Log in</button><button class='${up?'on':''}' onclick='am(1)'>Sign up</button></div>`}
${up?`<label>Your name</label><input id='a_n' autocomplete='name'>`:''}
<label>Email</label><input id='a_e' type='email' autocomplete='email'>
${rs?'':`<label>Password</label><input id='a_p' type='password' autocomplete='${up?'new-password':'current-password'}' placeholder='At least 6 characters'>`}
<div id='ae'></div>
<button class='btn' style='width:100%;justify-content:center;margin-top:14px' onclick='sub()'>${['Log in','Create account','Send reset link'][m]}</button>
${FBOK&&m<2?`<div class='mut' style='text-align:center;margin:10px 0 6px'>or</div><button class='btn g' style='width:100%;justify-content:center' onclick='gsign()'><b style='color:#F5B942'>G</b> Continue with Google</button>`:''}
${m==0?`<p style='text-align:center'><a onclick='am(2)'>Forgot password?</a></p>`:''}
${rs?`<p style='text-align:center'><a onclick='am(0)'>Back to log in</a></p>`:''}
${m<2?`<div class='mut' style='text-align:center;margin:10px 0 6px'>or</div><button class='btn g' style='width:100%;justify-content:center' onclick='offline()'>${ic('compass')}Continue as Guest (No login needed)</button>`:''}
</div>`;
$('#ab').innerHTML=`<div class='auth-split'><div class='auth-visual'><div class='auth-brand'><h2>Explore the World.<br>Plan Your Journey.</h2><p>Every great adventure begins with a plan.</p></div></div><div class='auth-form-wrap'>${form}</div></div>`;
if(msg)ae(msg,'ok')}
function ae(m,c){const o=$('#ae');if(o)o.innerHTML=m?`<div class='${c=='ok'?'al good':c=='mut'?'mut':'err'}' style='margin:10px 0'>${m}</div>`:''}
async function sub(){const g=k=>($('#a_'+k)?.value||'').trim(),e=g('e'),p=$('#a_p')?.value||'',n=g('n');let m='';
if(AM==1&&!n)m='Enter your name.';else if(!(e.includes('@')&&(e.split('@')[1]||'').includes('.')))m='Enter a valid email address.';else if(AM<2&&p.length<6)m='Password must be at least 6 characters.';
if(m)return ae(m);if(!FBOK)return ae('Firebase is not connected yet. Follow the setup steps shown above, or continue offline.');ae('<span class="sp"></span> Please wait…','mut');
try{if(AM==0)await JJ.signIn(e,p);else if(AM==1){await JJ.signUp(e,p,n);D.user=n;sv();R()}else{await JJ.reset(e);ae('Reset link sent. Check your inbox and spam folder.','ok')}}catch(x){ae(fe(x.code))}}
async function gsign(){if(!FBOK)return ae('Firebase is not connected yet.');ae('<span class="sp"></span> Opening Google…','mut');try{await JJ.google()}catch(x){ae(fe(x.code))}}
function legacy(){try{D=JSON.parse(localStorage.getItem(K))}catch(e){D=null}if(!D)D=seed()}
function offline(){legacy();LOCK=false;$('#au').className='off';V.p='home';V.trip=D.trips[0]?.id;R()}
function logout(){cl();if(U&&FBOK){if(unsub)unsub();unsub=null;JJ.signOut()}else{LOCK=true;D={user:'',cur:'INR',trips:[],exp:[],iti:[]};$('#pg').innerHTML='';$('#au').className='';am(0)}}
function prof(){return`<div class='card' style='margin-top:0;max-width:520px'><h3>Profile</h3><div class='st'><div class='ib'>${ic('user')}</div><div><b>${E(D.user)}</b><span>${U?E(U.email):'Offline mode (this device only)'}</span></div></div><p class='mut'>${U?'Your trips, expenses and budgets sync to your account on every device.':'Cloud sync is off. Log in to sync your trips across all devices.'}</p><div class='row' style='justify-content:flex-start;gap:8px'>${U?'':`<button class='btn' onclick='$("#au").className="";LOCK=true;am(0)'>${ic('log-in')}Log In / Create Account</button>`}<button class='btn r' onclick='logout()'>${ic('log-out')}${U?'Log out':'Exit offline mode'}</button></div></div>`}
function setName(v){v=v.trim()||'Traveler';D.user=v;sv();if(U&&FBOK)JJ.setName(v).catch(()=>{});toast('Saved')}
function cpush(){if(!U||!FBOK)return;clearTimeout(ptm);ptm=setTimeout(pushNow,500)}
function pushNow(){if(!U||!FBOK)return;JJ.saveUser(U.uid,JSON.parse(JSON.stringify({trips:D.trips,exp:D.exp,iti:D.iti,cur:D.cur,fav:D.fav||[],user:D.user,cd:D.cd||null,cdt:D.cdt||'',cds:D.cds||0,pack:D.pack||{},email:U.email,updated:Date.now()}))).catch(e=>toast('Cloud save failed: '+(e.code||e.message)))}
function loadUser(){let c=null;try{c=JSON.parse(localStorage.getItem(K+':'+U.uid))}catch(e){}
D=c||{user:U.displayName||(U.email||'').split('@')[0],cur:'INR',trips:[],exp:[],iti:[]};D.user=D.user||U.displayName||'Traveler';V.p='home';V.trip=D.trips[0]?.id;R();
if(unsub)unsub();unsub=JJ.watchUser(U.uid,s=>{if(s.metadata.hasPendingWrites)return;if(!s.exists()){pushNow();return}const r=s.data(),n={...D,trips:r.trips||[],exp:r.exp||[],iti:r.iti||[],cur:r.cur||D.cur,fav:r.fav||[],user:r.user||D.user,cd:r.cd||null,cdt:r.cdt||'',cds:r.cds||0,pack:r.pack||{}};if(cloud(n)!=cloud(D)){D=n;try{localStorage.setItem(UK(),JSON.stringify(D))}catch(e){}R();toast('Synced from your account')}},e=>toast('Sync error: '+(e.code||e.message)));
/* Discovery data lives in its own Firestore collections */
JJ.getDiscoveries(U.uid).then(l=>{if(!l.length&&(D.wish||[]).length)D.wish.forEach(w=>JJ.saveDiscovery(U.uid,{name:w.name,desc:w.desc||''}).catch(()=>{}));else D.wish=l.map(x=>({name:x.name,desc:x.desc||''}));if(V.p=='disc')R()}).catch(e=>toast('Could not load saved destinations: '+(e.code||e.message)));
JJ.getSearches(U.uid).then(l=>{DS.recent=l;if(V.p=='disc')R()}).catch(()=>{})}
function init(){const first=j=>{if(!JJ)jjReady(j)};if(window.JJ)first(window.JJ);else{addEventListener('jj-ready',()=>first(window.JJ),{once:true});setTimeout(()=>first({ok:false,sdk:false,missing:[],error:'The Firebase module did not load in time.'}),9000)}}
function jjReady(j){JJ=j;FBSDK=j.sdk!==false||FBFILE;FBMISS=j.missing||[];FBOK=!!j.ok&&!FBFILE;if(!FBOK){am(0);return}
JJ.onAuth(u=>{if(u){U=u;$('#au').className='off';LOCK=false;loadUser()}else{if(unsub)unsub();unsub=null;U=null;LOCK=true;D={user:'',cur:'INR',trips:[],exp:[],iti:[]};$('#pg').innerHTML='';cl();$('#au').className='';am(0)}})}
addEventListener('DOMContentLoaded',init);
/* ===== Trip Countdown, Smart Packing, Travel Vault ===== */
const PT=['Adventure','Family','Business','Beach','Road Trip'],PC=['Clothing','Toiletries','Electronics','Travel Essentials','Documents','Medicines','Other'],VC=['Train Tickets','Flight Tickets','Hotel Bookings','Identity Documents','Visa','Travel Insurance','Other Documents'],VI=['train-front','plane','bed-double','contact','stamp','shield-check','file-text'],VV={q:'',c:''};
const fz=n=>n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(1)+' MB';
/* --- Countdown --- */
function cdTrip(){return D.trips.find(t=>t.id==D.cd)}
function cdT(){clearInterval(window._ci);if(V.p=='count'&&D.cd)window._ci=setInterval(()=>{const e=$('#cdv');e?e.innerHTML=cdH():clearInterval(window._ci)},1000)}
function cdH(){const t=cdTrip();if(!t)return'';const now=Date.now(),a=new Date(t.dep+'T'+(D.cdt||'00:00')+':00').getTime(),b=new Date(t.ret+'T23:59:59').getTime(),s0=Math.min(D.cds||now,a-1);let x=[0,0,0,0],p=100,msg='';
if(now<a){const r=Math.floor((a-now)/1000);x=[Math.floor(r/86400),Math.floor(r%86400/3600),Math.floor(r%3600/60),r%60];p=Math.max(2,Math.min(100,(now-s0)/(a-s0)*100))}else msg=now<=b?'\ud83c\udf89 Your journey has begun!':'\u2705 Trip completed';
return`<div class='cdn'>${['Days','Hours','Minutes','Seconds'].map((l,i)=>`<div><b>${String(x[i]).padStart(2,'0')}</b><span>${l}</span></div>`).join('')}</div>${msg?`<h2 style='text-align:center;color:#FFD166'>${msg}</h2>`:''}<div class='trk'><i style='left:${p}%'>\u2708\ufe0f</i></div><div class='bar'><i style='width:${p}%'></i></div><div class='row mut'><span>${now<a?Math.round(p)+'% of the wait is over':now<=b?'Trip in progress':'Trip finished'}</span><span>${fd(t.dep)} \u2192 ${fd(t.ret)}</span></div>`}
function countPg(){const t=cdTrip();if(!t)return`<div class='card' style='margin-top:0;text-align:center;padding:34px'><div style='font-size:46px'>\u23f3</div><h3>Start a trip countdown</h3><p class='mut'>Pick one of your saved trips to count down to its departure.</p><button class='btn' onclick='cdEdit()'>${ic('timer')}Choose a trip</button></div>`;
return`<div class='card' style='margin-top:0'><div class='row'><div><span class='mut'>Countdown to</span><h2 style='margin:2px 0'>${E(t.to)}</h2><b>${E(t.name)}</b> <span class='mut'>\u00b7 departs ${fd(t.dep)} at ${D.cdt||'00:00'}</span></div><div><button class='btn' onclick='cdGo()'>View Trip</button> <button class='btn g' onclick='cdEdit()'>${ic('pencil')}Edit</button> <button class='btn r' onclick='cdRm()'>${ic('trash-2')}Remove</button></div></div><div id='cdv'>${cdH()}</div></div>`}
function cdGo(){go('plan',D.cd)}
function cdRm(){cf('Remove this countdown?',()=>{D.cd=null;sv();R()},'Yes, remove')}
function cdEdit(){modal(`<h3>Trip countdown</h3><label>Trip</label><select id='c_t'>${D.trips.map(t=>`<option value='${t.id}' ${t.id==D.cd?'selected':''}>${E(t.name)} (${fd(t.dep)})</option>`).join('')}</select><label>Departure time</label><input id='c_h' type='time' value='${D.cdt||'00:00'}'><div class='row' style='margin-top:14px'><button class='btn g' onclick='cl()'>Cancel</button><button class='btn' onclick='cdSave()'>Save</button></div>`)}
function cdSave(){const t=D.trips.find(z=>z.id==$('#c_t').value);if(!t)return toast('Choose a trip');if(t.id!=D.cd)D.cds=Date.now();D.cd=t.id;D.cdt=$('#c_h').value||'00:00';sv();cl();R();toast('Countdown saved')}
/* --- Smart packing --- */
function wxOf(t){const d=(t.to||'').toLowerCase(),m=new Date(t.dep+'T00:00').getMonth()+1;if(m>=6&&m<=9)return'Rainy';if(/manali|shimla|darjeeling|leh|ladakh|kashmir|ooty|munnar|himachal|sikkim|nainital|mussoorie|spiti|alps|swiss/.test(d))return'Cold';if(/goa|bali|andaman|phuket|maldives|kerala|gokarna/.test(d))return'Hot';return m>=3&&m<=5?'Hot':m==12||m<=2?'Cold':'Mild'}
function genItems(t,st,wx){const d=dys(t),n=t.trav,x=[['Clothing',Math.min(d+1,8)+' T-shirts or tops per person'],['Clothing',Math.ceil(d/2)+1+' trousers or shorts per person'],['Clothing',Math.min(d+1,8)+' sets of innerwear and socks per person'],['Clothing','Comfortable walking shoes'],['Clothing','Sleepwear'],['Clothing','Warm jacket',wx=='Cold'],['Clothing','Thermals and woollen cap',wx=='Cold'],['Clothing','Gloves and scarf',wx=='Cold'],['Clothing','Sunglasses and cap',wx=='Hot'],['Clothing','Light cotton clothes',wx=='Hot'],['Clothing','Raincoat or poncho',wx=='Rainy'],['Clothing','Quick-dry clothes',wx=='Rainy'||st=='Adventure'],['Clothing','Swimwear and beach towel',st=='Beach'],['Clothing','Flip-flops',st=='Beach'],['Clothing','Formal outfits for '+Math.min(d,5)+' days',st=='Business'],['Clothing','Formal shoes',st=='Business'],['Clothing','Trekking shoes',st=='Adventure'],['Clothing','Spare clothes for children',st=='Family'],
['Toiletries','Toothbrush and toothpaste'],['Toiletries','Soap, shampoo and deodorant'],['Toiletries','Hand sanitiser'],['Toiletries','Sunscreen',wx=='Hot'||st=='Beach'],['Toiletries','Moisturiser and lip balm',wx=='Cold'],['Toiletries','Wet wipes and diapers',st=='Family'],['Toiletries','Extra towels for '+n+' people',n>2],
['Electronics','Phone and charger'],['Electronics','Power bank'],['Electronics','Earphones'],['Electronics','Camera and memory card',st=='Adventure'||st=='Beach'],['Electronics','Laptop and charger',st=='Business'],['Electronics','Power strip and extra chargers',n>=3],['Electronics','Phone mount and car charger',st=='Road Trip'],
['Travel Essentials','Wallet and some cash'],['Travel Essentials','Reusable water bottle'],['Travel Essentials','Day backpack'],['Travel Essentials','Luggage locks'],['Travel Essentials','Snacks for the journey'],['Travel Essentials','Offline maps downloaded',st=='Road Trip'||st=='Adventure'],['Travel Essentials','Torch or headlamp',st=='Adventure'],['Travel Essentials','Travel pillow',t.mode=='Train'||t.mode=='Bus'||t.mode=='Flight'],['Travel Essentials','Car papers and spare tyre check',st=='Road Trip'],['Travel Essentials','Umbrella',wx=='Rainy'],
['Documents','Government ID for each traveller ('+n+')'],['Documents','Tickets and booking confirmations'],['Documents','Hotel booking vouchers'],['Documents','Travel insurance papers'],['Documents','Emergency contact list'],['Documents','Business cards and meeting papers',st=='Business'],
['Medicines','Personal prescription medicines'],['Medicines','Pain relief and fever tablets'],['Medicines','ORS and antacids'],['Medicines','Bandages and antiseptic'],['Medicines','Motion-sickness tablets',st=='Road Trip'||st=='Adventure'||t.mode=='Bus'],['Medicines','Insect repellent',wx=='Rainy'||st=='Beach'||st=='Adventure'],['Medicines','Children medicines',st=='Family'],
['Other','Plastic bags for dirty clothes'],['Other','Notebook and pen'],['Other','Games or books for the journey',st=='Family']];
return x.filter(z=>z[2]!==false).map(z=>({id:rid(),cat:z[0],name:z[1],done:false}))}
function pk(t){D.pack=D.pack||{};if(!D.pack[t.id]){const d=(t.to||'').toLowerCase(),st=t.mode=='Car'||t.mode=='Bike'?'Road Trip':/goa|bali|andaman|maldives|phuket/.test(d)?'Beach':'Adventure';D.pack[t.id]={st,wx:'Auto',items:genItems(t,st,wxOf(t))};sv()}return D.pack[t.id]}
const pI=()=>D.pack[cur().id].items;
function regen(){const t=cur(),p=D.pack[t.id],old={};p.items.filter(i=>!i.custom).forEach(i=>old[i.name]=i.done);const g=genItems(t,p.st,p.wx=='Auto'?wxOf(t):p.wx);g.forEach(i=>{i.done=!!old[i.name]});p.items=[...g,...p.items.filter(i=>i.custom)];sv();R()}
function pst(v){D.pack[cur().id].st=v;regen()}function pwx(v){D.pack[cur().id].wx=v;regen()}function pf(x){V.pf=x;R()}
function ptg(k){const i=pI()[k];i.done=!i.done;sv();R()}function pdel(k){pI().splice(k,1);sv();R()}
function pedit(k){modal(`<h3>Edit item</h3><input id='p_e'><div class='row' style='margin-top:14px'><button class='btn g' onclick='cl()'>Cancel</button><button class='btn' onclick='psv(${k})'>Save</button></div>`);$('#p_e').value=pI()[k].name}
function psv(k){const v=$('#p_e').value.trim();if(!v)return toast('Enter a name');const i=pI()[k];i.name=v;i.custom=true;sv();cl();R()}
function padd(){const v=$('#p_n').value.trim();if(!v)return toast('Enter an item name');pI().push({id:rid(),cat:$('#p_c').value,name:v,done:false,custom:true});sv();R()}
function prc(){cf('Uncheck every item in this checklist?',()=>{pI().forEach(i=>i.done=false);sv();R()},'Yes, reset')}
function packPg(){const t=cur(),p=pk(t),L=p.items,dn=L.filter(i=>i.done).length,f=V.pf||'All';
return`<div class='card' style='margin-top:0'><div class='row'><h3 style='margin:0'>${E(t.name)} \u00b7 ${dys(t)} days \u00b7 ${t.trav} traveller(s)</h3><span class='pill' style='background:#F5B942'>${p.wx=='Auto'?wxOf(t)+' (auto)':p.wx}</span></div><div class='fg'><div><label>Travel type</label><select onchange='pst(this.value)'>${PT.map(x=>`<option ${x==p.st?'selected':''}>${x}</option>`).join('')}</select></div><div><label>Weather / season</label><select onchange='pwx(this.value)'>${['Auto','Hot','Cold','Rainy','Mild'].map(x=>`<option ${x==p.wx?'selected':''}>${x}</option>`).join('')}</select></div></div></div>
<div class='card' style='margin-top:14px'><div class='row'><b>${dn}/${L.length} items packed</b><span><button class='btn g s' onclick='prc()'>${ic('rotate-ccw')}Reset Checklist</button> <button class='btn s' onclick='pkPdf()'>${ic('file-down')}Download Checklist</button></span></div><div class='bar'><i style='width:${L.length?dn/L.length*100:0}%'></i></div><div class='row' style='justify-content:flex-start'>${['All','Packed','Unpacked'].map(x=>`<button class='btn s ${f==x?'':'g'}' onclick='pf(this.textContent)'>${x}</button>`).join('')}</div></div>
<div class='card' style='margin-top:14px'><div class='fg'><div><label>Add a custom item</label><input id='p_n' placeholder='e.g. Binoculars'></div><div><label>Category</label><select id='p_c'>${PC.map(c=>`<option>${c}</option>`).join('')}</select></div></div><button class='btn' style='margin-top:10px' onclick='padd()'>${ic('plus')}Add item</button></div>
<div class='card' style='margin-top:14px'>${PC.map(c=>{const l=L.filter(i=>i.cat==c&&(f=='All'||(f=='Packed')==i.done));return l.length?`<details open><summary>${c} \u00b7 ${L.filter(i=>i.cat==c&&i.done).length}/${L.filter(i=>i.cat==c).length}</summary>${l.map(i=>{const k=L.indexOf(i);return`<div class='pk ${i.done?'d':''}'><input type='checkbox' ${i.done?'checked':''} onchange='ptg(${k})'><span>${E(i.name)}${i.custom?' <small class="mut">(custom)</small>':''}</span><button class='btn g s' onclick='pedit(${k})'>Edit</button><button class='btn r s' onclick='pdel(${k})'>Delete</button></div>`}).join('')}</details>`:''}).join('')||'<div class="mut" style="text-align:center;padding:22px">\ud83e\uddf3 No items match this filter.</div>'}</div>`}
function pkPdf(){const t=cur(),p=pk(t);$('#pr').innerHTML=`<h1>Packing checklist: ${E(t.name)}</h1><p>${E(t.to)} \u00b7 ${dys(t)} days \u00b7 ${t.trav} traveller(s) \u00b7 ${p.st}</p>${PC.map(c=>{const l=p.items.filter(i=>i.cat==c);return l.length?`<h3>${c}</h3>${l.map(i=>`<div>${i.done?'\u2611':'\u2610'} ${E(i.name)}</div>`).join('')}`:''}).join('')}`;toast('Choose Save as PDF in the print dialog');try{window.print()}catch(e){toast('Printing is blocked here')}}
/* --- Travel vault (IndexedDB, local only) --- */
const vu=()=>U?U.uid:'local';
const idb=()=>new Promise((ok,no)=>{if(window._db)return ok(window._db);const r=indexedDB.open('journeyjar-vault',1);r.onupgradeneeded=()=>r.result.createObjectStore('files',{keyPath:'id'});r.onsuccess=()=>{window._db=r.result;ok(r.result)};r.onerror=()=>no(r.error)});
const tx=async(m,f)=>{const d=await idb();return new Promise((ok,no)=>{const t=d.transaction('files',m),q=f(t.objectStore('files'));t.oncomplete=()=>ok(q&&q.result);t.onerror=()=>no(t.error)})};
function vaultPg(){const t=cur();return`<div class='al warn' style='margin-top:0'><b>Local prototype.</b> Files are kept only in this browser (IndexedDB) on this device. They are <b>not encrypted</b>, are not synced to your account, and can be lost if you clear browser data. Keep original copies of passports and IDs elsewhere.</div><div class='card'><h3>${ic('shield-check')} Vault for ${E(t.name)}</h3><div class='fg'><div><label>Category</label><select id='v_c'>${VC.map(c=>`<option>${c}</option>`).join('')}</select></div><div><label>Upload PDF, JPG or PNG (max 25 MB each)</label><input type='file' accept='.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png' multiple onchange='upl(this)'></div></div><div class='bar'><i id='vpb' style='width:0%'></i></div><div id='vpt' class='mut'></div><div id='vm'></div></div><div class='card' style='margin-top:14px'><div class='fg'><div><label>Search</label><input id='v_q' placeholder='Search documents\u2026' oninput='VV.q=this.value;vl()'></div><div><label>Category</label><select onchange='VV.c=this.value;vl()'><option value=''>All categories</option>${VC.map(c=>`<option ${VV.c==c?'selected':''}>${c}</option>`).join('')}</select></div></div></div><div id='vl' class='grid a3'></div>`}
function vp(p,n){const b=$('#vpb');if(b)b.style.width=p+'%';const x=$('#vpt');if(x)x.textContent=p?(p<100?'Reading ':'Saved ')+n+' ('+Math.round(p)+'%)':''}
function vm(m,c){const o=$('#vm');if(o)o.innerHTML+=`<div class='al ${c}'>${E(m)}</div>`}
async function upl(inp){const fl=[...inp.files],cat=$('#v_c').value,t=cur();inp.value='';$('#vm').innerHTML='';if(!t)return;
for(const f of fl){const ext=f.name.split('.').pop().toLowerCase();if(!['pdf','jpg','jpeg','png'].includes(ext)||!['application/pdf','image/jpeg','image/png'].includes(f.type)){vm(f.name+': unsupported format. Only PDF, JPG and PNG files are allowed.','bad');continue}
if(f.size>25*1048576){vm(f.name+' is larger than 25 MB and was not added.','bad');continue}if(f.size>5*1048576)vm(f.name+' is large ('+fz(f.size)+'). Large files use more browser storage.','warn');
try{const buf=await new Promise((res,rej)=>{const r=new FileReader();r.onprogress=e=>{if(e.lengthComputable)vp(e.loaded/e.total*99,f.name)};r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsArrayBuffer(f)});
await tx('readwrite',s=>s.put({id:rid(),uid:vu(),trip:t.id,cat,name:f.name,type:f.type,size:f.size,date:Date.now(),blob:new Blob([buf],{type:f.type})}));vp(100,f.name);toast('Uploaded '+f.name)}catch(e){vm('Could not save '+f.name+'. Browser storage may be full or blocked.','bad')}}
vl()}
async function vl(){const o=$('#vl');if(!o)return;let r;try{r=(await tx('readonly',s=>s.getAll())).filter(x=>x.uid==vu()&&x.trip==V.trip)}catch(e){o.innerHTML=`<div class='err' style='grid-column:1/-1'>Browser storage is unavailable (private mode or blocked), so the vault cannot be used.</div>`;return}
const q=VV.q.toLowerCase(),all=r.length;r=r.filter(x=>(!VV.c||x.cat==VV.c)&&(!q||x.name.toLowerCase().includes(q))).sort((a,b)=>b.date-a.date);window._vr=r;
o.innerHTML=r.map((x,i)=>`<div class='card'><div class='st'><div class='ib'>${ic(VI[VC.indexOf(x.cat)]||'file-text')}</div><div style='min-width:0'><b style='word-break:break-all'>${E(x.name)}</b><span>${x.cat}</span></div></div><div class='mut' style='margin:8px 0'>${new Date(x.date).toLocaleDateString()} \u00b7 ${fz(x.size)}</div><div class='row' style='justify-content:flex-start;gap:6px'><button class='btn s' onclick='vpv(${i})'>Preview</button><button class='btn g s' onclick='vdl(${i})'>Download</button><button class='btn g s' onclick='vrn(${i})'>Rename</button><button class='btn r s' onclick='vdel(${i})'>Delete</button></div></div>`).join('')||`<div class='card' style='grid-column:1/-1;text-align:center;padding:34px'><div style='font-size:44px'>\ud83d\udcc2</div><h3>${all?'No documents match your search':'No documents yet'}</h3><p class='mut'>${all?'Try another search or category.':'Upload tickets, bookings, IDs and insurance for this trip.'}</p></div>`;ico()}
function vdl(i){const r=window._vr[i],a=document.createElement('a');a.href=URL.createObjectURL(r.blob);a.download=r.name;document.body.appendChild(a);a.click();a.remove()}
function vpv(i){const r=window._vr[i],u=URL.createObjectURL(r.blob);modal(`<h3 style='word-break:break-all'>${E(r.name)}</h3>${r.type=='application/pdf'?`<iframe src='${u}' style='width:100%;height:60vh;border:0;border-radius:10px;background:#fff'></iframe>`:`<img src='${u}' alt='Preview' style='max-width:100%;border-radius:10px'>`}<div class='row' style='margin-top:12px'><button class='btn g' onclick='cl()'>Close</button><button class='btn' onclick='vdl(${i})'>Download</button></div>`)}
function vrn(i){modal(`<h3>Rename document</h3><input id='v_n'><div class='row' style='margin-top:14px'><button class='btn g' onclick='cl()'>Cancel</button><button class='btn' onclick='vrs(${i})'>Save</button></div>`);$('#v_n').value=window._vr[i].name}
async function vrs(i){const n=$('#v_n').value.trim();if(!n||n.includes('/')||n.includes('\\'))return toast('Enter a valid file name');const r={...window._vr[i],name:n};try{await tx('readwrite',s=>s.put(r));cl();vl();toast('Renamed')}catch(e){toast('Could not rename')}}
function vdel(i){const r=window._vr[i];cf('Delete this document from the vault?',async()=>{try{await tx('readwrite',s=>s.delete(r.id));vl();toast('Document deleted')}catch(e){toast('Could not delete')}})}
/* ===== JourneyJar Discover: live data only (Wikipedia, Wikimedia Commons, TMDB through your backend proxy) ===== */
const WK='https://en.wikipedia.org',CM='https://commons.wikimedia.org',DS={q:'',tab:'Overview',load:false,err:'',data:null,mv:null,st:null,cu:null,sg:[],recent:[]},DT=['Overview','Images','Movies','Stories','Places','Culture'],FEAT=[['Manali','🏔️'],['Goa','🏖️'],['Paris','🗼'],['Varanasi','🪔'],['Tokyo','🏯'],['Jaipur','🏰'],['Kyoto','⛩️'],['Bali','🌺']];
const FBI='data:image/svg+xml,'+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='400' height='300' fill='#202024'/><text x='200' y='165' font-size='46' text-anchor='middle'>🧭</text></svg>");
const dj=async u=>{const a=new AbortController(),tm=setTimeout(()=>a.abort(),10000);try{const r=await fetch(u,{signal:a.signal});if(!r.ok)throw new Error('HTTP '+r.status);return await r.json()}finally{clearTimeout(tm)}},enc=encodeURIComponent,ea=s=>E(s).split(String.fromCharCode(39)).join('&#39;'),clip=(s,n)=>!s||s.length<=n?(s||''):s.slice(0,s.lastIndexOf(' ',n))+'…';
const strip=s=>s?(new DOMParser().parseFromString(String(s),'text/html').body.textContent||'').trim():'';
const hav=(a,b,c,d)=>{const r=Math.PI/180,x=Math.sin((c-a)*r/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin((d-b)*r/2)**2;return 12742*Math.asin(Math.sqrt(x))};
const wapi=p=>dj(`${WK}/w/api.php?format=json&origin=*&${p}`),wurl=t=>WK+'/wiki/'+enc(t.split(' ').join('_'));
function imgE(i){i.onerror=null;i.src=FBI;i.classList.add('ok')}function imgL(i){i.classList.add('ok')}
const im=(s,c)=>`<img class='gi ${c||''}' loading='lazy' src='${ea(s||FBI)}' alt='' onload='imgL(this)' onerror='imgE(this)'>`;
const skel=n=>`<div class='grid a3'>${Array.from({length:n},()=>`<div class='card skl' style='height:200px'></div>`).join('')}</div>`,emp=(i,h,p)=>`<div class='card gl' style='text-align:center;padding:30px'><div style='font-size:40px'>${i}</div><h3>${h}</h3><p class='mut'>${p}</p></div>`;
/* ---- search and suggestions ---- */
let dst;function dSug(v){clearTimeout(dst);const o=$('#ds');if(!o)return;if(v.trim().length<2){o.innerHTML='';return}dst=setTimeout(async()=>{try{const j=await dj(`${WK}/w/api.php?action=opensearch&format=json&origin=*&limit=6&search=${enc(v.trim())}`);DS.sg=j[1];o.innerHTML=j[1].length?`<div class='sg'>${j[1].map((t,i)=>`<div onclick='dSg(${i})'>${E(t)} <span class='mut'>${E(clip(j[2][i]||'',60))}</span></div>`).join('')}</div>`:''}catch(e){o.innerHTML=''}},250)}
function dSg(i){$('#ds').innerHTML='';$('#d_q').value=DS.sg[i];dLoad(DS.sg[i])}
function dGo(q){q=(q||$('#d_q').value).trim();$('#ds').innerHTML='';if(!q)return toast('Type a destination to explore');dLoad(q)}
function dF(i){$('#d_q').value=FEAT[i][0];dLoad(FEAT[i][0])}function dWl(i){$('#d_q').value=D.wish[i].name;dLoad(D.wish[i].name)}
function dDraw(){const o=$('#dres');if(o){o.innerHTML=(DS.offline&&DS.data?`<div class='al warn' style='margin-bottom:12px'><b>Offline guide.</b> Live data could not be loaded, so you are seeing built-in notes. <button class='btn s' onclick='dLoad(DS.q)'>Retry live data</button></div>`:'')+dBody()+(DS.err&&!DS.load?dFeat():'');ico()}}
/* ---- destination data: Wikipedia (text), Commons (photos), Wikipedia geosearch (places) ---- */
async function dImgs(c){const q=async s=>{const j=await dj(`${CM}/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=30&gsrsearch=${enc(s+' filetype:bitmap')}&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=640&iiextmetadatafilter=Artist|LicenseShortName|ImageDescription|ObjectName`);
return Object.values(j.query?.pages||{}).sort((a,b)=>a.index-b.index).map(p=>{const i=p.imageinfo?.[0],m=i?.extmetadata||{};if(!i||i.mime!='image/jpeg'||/flag|map|locator|logo|diagram|coat|seal|poster|plan|chart|stamp/i.test(p.title))return null;
return{src:i.thumburl||i.url,full:i.url,cap:clip(strip(m.ImageDescription?.value)||strip(m.ObjectName?.value)||p.title.replace('File:','').split('.').slice(0,-1).join('.').split('_').join(' '),150),by:clip(strip(m.Artist?.value),60),lic:m.LicenseShortName?.value||'',link:i.descriptionurl}}).filter(Boolean)};
let l=await q(c.t.split(',').join(' '));if(l.length<6)l=[...l,...(await q(c.nm)).filter(x=>!l.some(y=>y.full==x.full))];return l.slice(0,24)}
async function dPlaces(c){if(!c.co)return[];const j=await wapi(`action=query&generator=geosearch&ggscoord=${c.co.lat}|${c.co.lon}&ggsradius=10000&ggslimit=20&prop=extracts|pageimages|coordinates|pageviews&exintro=1&explaintext=1&exsentences=2&exlimit=max&piprop=thumbnail&pithumbsize=600&colimit=max&pvipdays=30`);
const l=Object.values(j.query?.pages||{}).filter(p=>p.title!=c.ti&&p.extract&&p.coordinates).map(p=>({n:p.title,x:p.extract,img:p.thumbnail?.source||'',lat:p.coordinates[0].lat,lon:p.coordinates[0].lon,d:hav(c.co.lat,c.co.lon,p.coordinates[0].lat,p.coordinates[0].lon),v:Object.values(p.pageviews||{}).reduce((a,b)=>a+(b||0),0),u:wurl(p.title),h:/fort|palace|temple|mosque|church|cathedral|tomb|ruin|monument|museum|heritage|ghat|shrine|castle/i.test(p.extract)}));
l.sort((a,b)=>b.v-a.v);const t=l.slice(0,16);t.forEach((p,i)=>{p.tag=i<8?'Popular on Wikipedia':'Lesser-known'});return t}
async function wrel(q,n,c){const j=await wapi(`action=query&generator=search&gsrnamespace=0&gsrlimit=${n}&gsrsearch=${enc(q)}&prop=extracts|pageimages&exintro=1&explaintext=1&exsentences=3&exlimit=max&piprop=thumbnail&pithumbsize=500`);
return Object.values(j.query?.pages||{}).sort((a,b)=>a.index-b.index).filter(p=>p.title!=c.ti&&p.extract&&(p.title+' '+p.extract).toLowerCase().includes(c.nm.toLowerCase())).map(p=>({n:p.title,x:p.extract,img:p.thumbnail?.source||'',u:wurl(p.title)}))}
async function dLoad(q){DS.q=q;DS.load=true;DS.err='';DS.data=null;DS.mv=null;DS.st=null;DS.cu=null;DS.tab='Overview';DS.offline=false;dDraw();const ck='jj:d2:'+q.toLowerCase();
try{let c=null;try{c=JSON.parse(sessionStorage.getItem(ck))}catch(e){}
if(!c){const s=await dj(`${WK}/w/api.php?action=opensearch&format=json&origin=*&limit=1&search=${enc(q)}`);if(!s[1].length)throw new Error('nf');const ti=s[1][0],sum=await dj(`${WK}/api/rest_v1/page/summary/${enc(ti.split(' ').join('_'))}`);if(sum.type=='disambiguation')throw new Error('amb');
c={ti,t:sum.title,nm:sum.title.split(',')[0],ds:sum.description||'',ex:sum.extract||'',url:sum.content_urls?.desktop?.page||'',cv:sum.originalimage?.source||sum.thumbnail?.source||'',co:sum.coordinates||null,gal:[],sec:{},pl:[]};
const[tx,pl,gl]=await Promise.allSettled([wapi(`action=query&prop=extracts&explaintext=1&redirects=1&titles=${enc(ti)}`),dPlaces(c),dImgs(c)]);
if(tx.status=='fulfilled'){const pg=Object.values(tx.value.query.pages)[0],L=(pg.extract||'').split(String.fromCharCode(10));let k='';L.forEach(l=>{if(l.startsWith('==')){k=l.split('=').join('').trim()}else if(k&&l.trim())c.sec[k]=(c.sec[k]||'')+l.trim()+' '})}
if(pl.status=='fulfilled')c.pl=pl.value;else c.pe=1;if(gl.status=='fulfilled')c.gal=gl.value;else c.ie=1;
try{sessionStorage.setItem(ck,JSON.stringify(c))}catch(e){}}
DS.data=c}catch(e){const L=DISCOVER_CONFIG.offlineGuide===true?dLocal(q):null;if(L){DS.data=L;DS.offline=true}else DS.err=e.message=='nf'?'nf':e.message=='amb'?'amb':'net'}
DS.load=false;if(DS.data&&U&&FBOK){JJ.recordSearch(U.uid,DS.data.nm).catch(()=>{});DS.recent=[DS.data.nm,...(DS.recent||[]).filter(x=>x!=DS.data.nm)].slice(0,8)}dDraw()}
function dTab(x){DS.tab=x;if(x=='Movies'&&!DS.mv)dMv();if(x=='Stories'&&!DS.st)dSt();if(x=='Culture'&&!DS.cu)dCu();dDraw()}
/* ---- stories and culture: real Wikipedia articles about the destination ---- */
async function dSt(){DS.st={load:true};dDraw();const c=DS.data;try{const[a,b]=await Promise.all([wrel(c.nm+' history',6,c),wrel(c.nm+' legend OR folklore OR mythology',4,c)]),seen=new Set();DS.st={list:[...a,...b].filter(p=>!seen.has(p.n)&&seen.add(p.n)).slice(0,9)}}catch(e){DS.st={err:e.message}}dDraw()}
async function dCu(){DS.cu={load:true};dDraw();const c=DS.data,G=[['Festivals','festival'],['Food and cuisine','cuisine food'],['Art and crafts','art craft'],['Architecture','architecture'],['Traditions','tradition culture']];
try{const r=await Promise.allSettled(G.map(g=>wrel(c.nm+' '+g[1],3,c))),seen=new Set(),g=G.map((x,i)=>[x[0],r[i].status=='fulfilled'?r[i].value.filter(p=>!seen.has(p.n)&&seen.add(p.n)):[]]).filter(x=>x[1].length);DS.cu={g,failed:r.every(x=>x.status=='rejected')}}catch(e){DS.cu={failed:true}}dDraw()}
const rc=l=>`<div class='grid a3'>${l.map(p=>`<div class='card gl h'>${p.img?`<div class='dcv skl' style='aspect-ratio:16/10;min-height:0;border-radius:14px'>${im(p.img)}</div>`:''}<h3 style='margin:10px 0 2px'>${E(p.n)}</h3><p class='mut'>${E(clip(p.x,230))}</p><a href='${ea(p.u)}' target='_blank' rel='noopener' style='color:var(--teal)'>Read on Wikipedia ↗</a></div>`).join('')}</div>`;
/* ---- movies and documentaries: pre-stored destination cinema database + TMDB live proxy fallback ---- */
const LOCAL_MOVIES = {
  manali: {
    movies: [
      { id: 'm1', t: 'Yeh Jawaani Hai Deewani', y: '2013', r: '7.6', g: 'Romance, Drama', rel: 'Filmed in Manali & Gulmarg', o: 'Bunny and Naina embark on a life-changing trekking trip to the snow-covered peaks of Manali, discovering friendship and love.', p: 'https://image.tmdb.org/t/p/w500/em39H81XLCDgXsI7V4IcBZseEO6.jpg', yt: 'RBPmCML2QAw', runtime: 160 },
      { id: 'm2', t: 'Highway', y: '2014', r: '7.6', g: 'Drama, Adventure', rel: 'Himachal & Spiti Journey', o: 'A captivating road journey through the breathtaking landscapes of Himachal Pradesh, Spiti Valley, and the Northern mountains.', yt: '21Q92kHj9Bw', runtime: 133 },
      { id: 'm3', t: 'Jab We Met', y: '2007', r: '7.9', g: 'Romance, Comedy', rel: 'Rohtang Pass & Manali', o: 'A spirited girl and a depressed businessman cross paths on a spontaneous train trip that leads them into the high valleys of Rohtang and Manali.', p: 'https://image.tmdb.org/t/p/w500/kp9xnwDALUt6nuPBGuJHlvnxGnM.jpg', yt: 'jNlM0Yx_Ebg', runtime: 138 },
      { id: 'm4', t: 'Bang Bang!', y: '2014', r: '5.6', g: 'Action, Romance', rel: 'Scenic Snow Slopes', o: 'High-octane action thriller featuring romantic sequences and chase scenes shot against scenic snow slopes of Manali and Shimla.', yt: 'bmtz4pPekd8', runtime: 153 }
    ],
    docs: [
      { id: 'd1', t: 'Living in the Himalayas', y: '2020', r: '8.0', g: 'Documentary', rel: 'Himalayan Culture', o: 'An intimate look into mountain communities, trans-Himalayan traditions, and life amid the snow lines of Himachal Pradesh.', yt: 'E0T6e-bB7lE', runtime: 48 },
      { id: 'd2', t: 'Gaddi: Nomads of the High Passes', y: '2021', r: '7.8', g: 'Documentary', rel: 'Tribal Traditions', o: 'Follow the shepherd tribes of Himachal as they navigate ancestral high-altitude passes between Kullu, Manali, and Lahaul.', yt: 'E0T6e-bB7lE', runtime: 52 }
    ]
  },
  goa: {
    movies: [
      { id: 'm5', t: 'Dil Chahta Hai', y: '2001', r: '8.1', g: 'Comedy, Drama', rel: 'Iconic Goa Road Trip', o: 'The definitive coming-of-age journey of three college friends whose trip to Goa and Chapora Fort transforms their bonds forever.', p: 'https://image.tmdb.org/t/p/w500/d5yjk7hbv8AK0DR0oJUrSGHMn9A.jpg', yt: 'm13b25V0B10', runtime: 183 },
      { id: 'm6', t: 'Dear Zindagi', y: '2016', r: '7.5', g: 'Drama, Romance', rel: 'North Goa Serenity', o: 'A young cinematographer discovers healing, cycling along coconut-lined roads and serene Portuguese quarters in North Goa.', yt: '5DkO7ksXY8E', runtime: 151 },
      { id: 'm7', t: 'Go Goa Gone', y: '2013', r: '6.6', g: 'Comedy, Horror', rel: 'Beach Adventure', o: 'Friends head to a secluded beach rave on an isolated island off Goa that spirals into wild, comic chaos.', yt: '4kU3mJkY6w0', runtime: 108 },
      { id: 'm8', t: 'Finding Fanny', y: '2014', r: '6.1', g: 'Comedy, Adventure', rel: 'Rural Goan Villages', o: 'Five quirky Goans set out on an eccentric road trip in an old convertible across lush countryside villages of Goa.', yt: 'iC-uX1r5_5A', runtime: 102 }
    ],
    docs: [
      { id: 'd3', t: 'Wild Goa: The Secret Coast', y: '2019', r: '7.7', g: 'Documentary', rel: 'Coastal Biodiversity', o: 'Beyond parties and beaches, explore the lush Western Ghats jungles, mangroves, and vibrant wildlife of coastal Goa.', yt: 'm13b25V0B10', runtime: 45 },
      { id: 'd4', t: 'Susegad: The Goan Art of Living', y: '2022', r: '7.9', g: 'Documentary', rel: 'Heritage & Lifestyle', o: 'Exploring the relaxed Goan philosophy of contentment, Portuguese heritage architecture, and coastal community cuisine.', yt: '5DkO7ksXY8E', runtime: 50 }
    ]
  },
  paris: {
    movies: [
      { id: 'm9', t: 'Midnight in Paris', y: '2011', r: '7.7', g: 'Fantasy, Romance', rel: 'Streets of Paris', o: 'A nostalgic Hollywood screenwriter finds himself mysteriously transported back to the 1920s Parisian golden age every midnight.', yt: 'BYRWfS2s2v4', runtime: 94 },
      { id: 'm10', t: 'Amélie', y: '2001', r: '8.3', g: 'Comedy, Romance', rel: 'Montmartre, Paris', o: 'An imaginative Parisian waitress decides to quietly change the lives of the people around her in picturesque Montmartre.', yt: 'HUECWi5pX7o', runtime: 122 },
      { id: 'm11', t: 'Before Sunset', y: '2004', r: '8.1', g: 'Romance, Drama', rel: 'Seine River & Latin Quarter', o: 'Two former lovers reunite nine years later for an afternoon walking the charming bookstores, cafes, and canals of Paris.', yt: 'oI3UuneLcyU', runtime: 80 },
      { id: 'm12', t: 'Ratatouille', y: '2007', r: '8.0', g: 'Animation, Family', rel: 'Parisian Culinary World', o: 'A passionate rodent chef with extraordinary culinary taste pursues his dream in the most renowned kitchens of Paris.', yt: 'NgsQ8mCUGC8', runtime: 111 }
    ],
    docs: [
      { id: 'd5', t: 'Paris: The Mystery of the Lost Palace', y: '2019', r: '7.8', g: 'Documentary', rel: 'Historic Monuments', o: 'Uncovering 2,000 years of architectural and cultural marvels beneath modern Paris and the Île de la Cité.', yt: 'BYRWfS2s2v4', runtime: 53 },
      { id: 'd6', t: 'The Seine: River of Romance', y: '2021', r: '8.0', g: 'Documentary', rel: 'City of Lights', o: 'A stunning scenic journey along the Seine exploring historic bridges, Parisian river culture, and riverside life.', yt: 'oI3UuneLcyU', runtime: 49 }
    ]
  },
  jaipur: {
    movies: [
      { id: 'm13', t: 'The Best Exotic Marigold Hotel', y: '2011', r: '7.2', g: 'Comedy, Drama', rel: 'Pink City & Heritage', o: 'British retirees travel to Jaipur to stay in what they believe is a restored luxury palace hotel in the historic heart of Rajasthan.', yt: 'dDY89LYxK0w', runtime: 124 },
      { id: 'm14', t: 'Shuddh Desi Romance', y: '2013', r: '6.0', g: 'Romance, Comedy', rel: 'Jaipur Bazaars & Streets', o: 'A fresh, lighthearted modern romance filmed throughout the buzzing bazaars, pink city walls, and rooftop terraces of Jaipur.', yt: 'KxL99H7vU7U', runtime: 141 },
      { id: 'm15', t: 'Jodhaa Akbar', y: '2008', r: '7.6', g: 'History, Romance', rel: 'Amer Fort & Rajasthan', o: 'Sixteenth-century grand romance and statecraft featuring majestic sequences shot inside the historic Amer Fort and Rajasthan palaces.', yt: 'mQZ3_4pE3c8', runtime: 213 },
      { id: 'm16', t: 'The Fall', y: '2006', r: '7.9', g: 'Fantasy, Adventure', rel: 'Chand Baori & Amber Palace', o: 'A visually breathtaking cinematic fantasy filmed across the ancient Chand Baori stepwells and Amber Palace in Rajasthan.', yt: 'iO0LYcCoeJY', runtime: 117 }
    ],
    docs: [
      { id: 'd7', t: 'Royal Fortresses of Rajasthan', y: '2020', r: '8.2', g: 'Documentary', rel: 'UNESCO Hill Forts', o: 'Aerial and ground exploration of the monumental hill forts of Amer, Mehrangarh, and Chittorgarh.', yt: 'dDY89LYxK0w', runtime: 55 }
    ]
  },
  tokyo: {
    movies: [
      { id: 'm17', t: 'Lost in Translation', y: '2003', r: '7.7', g: 'Drama', rel: 'Shinjuku & Shibuya', o: 'Two lonely Americans find deep, quiet friendship navigating the neon avenues, karaoke rooms, and serene shrines of Tokyo.', p: 'https://image.tmdb.org/t/p/w500/kJraK1nGYuP9jlAZstN9VWhxjjz.jpg', yt: 'W6iVPCRflQM', runtime: 102 },
      { id: 'm18', t: 'Your Name (Kimi no Na wa)', y: '2016', r: '8.4', g: 'Animation, Fantasy', rel: 'Tokyo Crossroads', o: 'Two teenagers share a magical connection that takes them across rural mountains and bustling Tokyo crossroads.', p: 'https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg', yt: 'xU47nhruN-Q', runtime: 107 },
      { id: 'm19', t: 'The Fast and the Furious: Tokyo Drift', y: '2006', r: '6.0', g: 'Action', rel: 'Shibuya Nightlife', o: 'An American high schooler enters the underground drift racing world in neon-lit nighttime Tokyo parking garages and streets.', yt: 'p8HQ2JeQg48', runtime: 104 }
    ],
    docs: [
      { id: 'd8', t: 'Jiro Dreams of Sushi', y: '2011', r: '7.9', g: 'Documentary', rel: 'Tokyo Culinary Mastery', o: 'A tribute to 85-year-old sushi master Jiro Ono and the tireless culinary mastery of Tokyo.', yt: 'I1UDS2kgqY8', runtime: 81 }
    ]
  },
  bali: {
    movies: [
      { id: 'm20', t: 'Eat Pray Love', y: '2010', r: '5.8', g: 'Romance, Drama', rel: 'Ubud Rice Terraces', o: 'A woman embarks on a worldwide journey of self-discovery, finding peace and romance amid the emerald terraces of Ubud, Bali.', yt: 'mjay5vgIwt4', runtime: 140 },
      { id: 'm21', t: 'Ticket to Paradise', y: '2022', r: '6.2', g: 'Comedy, Romance', rel: 'Tropical Bali Coast', o: 'Divorced parents team up and travel to tropical Bali to stop their daughter from making a hasty marriage.', yt: 'hkP4tVTdsz8', runtime: 104 }
    ],
    docs: [
      { id: 'd9', t: 'Bali: Island of the Gods', y: '2021', r: '8.0', g: 'Documentary', rel: 'Balinese Culture', o: 'Discover the sacred water temples, volcanic slopes, traditional gamelan music, and dance ceremonies of Bali.', yt: 'mjay5vgIwt4', runtime: 51 }
    ]
  },
  varanasi: {
    movies: [
      { id: 'm22', t: 'Raanjhanaa', y: '2013', r: '7.6', g: 'Romance, Drama', rel: 'Ghats of Varanasi', o: 'A passionate love story set in the winding lanes, colorful bazaars, and sacred riverside ghats of Varanasi.', yt: 'a2h6f4zQ8X4', runtime: 140 },
      { id: 'm23', t: 'Masaan', y: '2015', r: '8.2', g: 'Drama', rel: 'Ganga Ghats Life', o: 'Interconnected lives seeking escape from small-town restrictions along the eternal banks of the sacred Ganges in Varanasi.', yt: 'SK3BJaCgW-8', runtime: 109 },
      { id: 'm24', t: 'Mukti Bhawan (Hotel Salvation)', y: '2016', r: '7.4', g: 'Comedy, Drama', rel: 'Spiritual Varanasi', o: 'An overworked son accompanies his elderly father to the holy city of Varanasi, finding quiet wisdom and reconciliation.', yt: 'SK3BJaCgW-8', runtime: 99 }
    ],
    docs: [
      { id: 'd10', t: 'Ganga: River of Life', y: '2020', r: '8.3', g: 'Documentary', rel: 'Spiritual Heritage', o: 'Capturing centuries of morning prayers, floating oil lamps, boatmen songs, and sacred rituals along Varanasi ghats.', yt: 'SK3BJaCgW-8', runtime: 48 }
    ]
  },
  darjeeling: {
    movies: [
      { id: 'm25', t: 'Barfi!', y: '2012', r: '8.1', g: 'Comedy, Drama', rel: 'Darjeeling Clock Tower & Hills', o: 'A heartwarming story of three young people who learn that love can neither be defined nor contained by society, set in misty Darjeeling.', yt: 'aO1bYukDVQ0', runtime: 151 },
      { id: 'm26', t: 'Main Hoon Na', y: '2004', r: '7.0', g: 'Action, Comedy', rel: 'St. Pauls School, Darjeeling', o: 'An army major goes undercover as a college student in a prestigious boarding school nestled in the scenic Darjeeling hills.', yt: 'aO1bYukDVQ0', runtime: 179 },
      { id: 'm27', t: 'The Darjeeling Limited', y: '2007', r: '7.2', g: 'Adventure, Comedy', rel: 'Himalayan Train Journey', o: 'Three estranged brothers meet for a spiritual train journey across vibrant railway stations, temples, and hillside tea gardens.', yt: 'aO1bYukDVQ0', runtime: 91 }
    ],
    docs: [
      { id: 'd11', t: 'The Toy Train: Darjeeling Himalayan Railway', y: '2019', r: '8.1', g: 'Documentary', rel: 'UNESCO World Heritage', o: 'The engineering wonder of the two-foot narrow-gauge railway spiraling from New Jalpaiguri to the heights of Darjeeling.', yt: 'aO1bYukDVQ0', runtime: 46 }
    ]
  },
  default: {
    movies: [
      { id: 'm28', t: 'The Secret Life of Walter Mitty', y: '2013', r: '7.3', g: 'Adventure, Comedy', rel: 'Epic World Journey', o: 'A quiet daydreamer breaks free of his routine on an extraordinary global adventure across Iceland, Greenland, and the Himalayas.', p: 'https://image.tmdb.org/t/p/w500/v3e1LdwTXupH9L78eIWCKBjclhJ.jpg', yt: 'HddkUCJYJUY', runtime: 114 },
      { id: 'm29', t: 'Into the Wild', y: '2007', r: '8.1', g: 'Adventure, Biography', rel: 'True Travel Quest', o: 'A top student gives up all his possessions to hitchhike across North America, seeking freedom in wild open landscapes.', yt: '2LAuzT_x8Ek', runtime: 148 },
      { id: 'm30', t: 'Under the Tuscan Sun', y: '2003', r: '6.8', g: 'Comedy, Romance', rel: 'Italian Countryside', o: 'A newly divorced writer on a tour of Italy impulsively buys a charming rural villa to start a vibrant new Mediterranean life.', yt: 'T8r53h9_F7U', runtime: 113 },
      { id: 'm31', t: 'Zindagi Na Milegi Dobara', y: '2011', r: '8.2', g: 'Comedy, Drama', rel: 'Spain Road Trip & Adventure', o: 'Three friends turn a road trip through Spain into an opportunity to face their deepest fears and celebrate living in the moment.', p: 'https://image.tmdb.org/t/p/w500/hKO9O715wYxjkQSEv47giCYcyO8.jpg', yt: 'HddkUCJYJUY', runtime: 155 }
    ],
    docs: [
      { id: 'd12', t: 'Baraka', y: '1992', r: '8.6', g: 'Documentary', rel: 'World Cultural Tapestry', o: 'A transcendent, non-verbal cinematic journey spanning 24 countries, ancient holy sites, tribal dances, and natural wonders.', yt: 'd1m6w9Yp6v8', runtime: 96 },
      { id: 'd13', t: 'Samsara', y: '2011', r: '8.4', g: 'Documentary', rel: 'Global Sacred Wonders', o: 'Stunning 70mm cinematic masterpiece capturing the cycle of human wonders, nature, and sacred places across the globe.', yt: 'HCkEILshAew', runtime: 102 }
    ]
  }
};

function getLocalMovies(city){
  const q = String(city || '').toLowerCase();
  for (const k of Object.keys(LOCAL_MOVIES)) {
    if (k !== 'default' && q.includes(k)) return LOCAL_MOVIES[k];
  }
  return LOCAL_MOVIES['default'];
}

const TM=()=>(DISCOVER_CONFIG.tmdbProxy||'').replace(/\/+$/,'');
const TK=()=>(DISCOVER_CONFIG.tmdbKey||'').trim();
async function tmdbGet(path){
  const b=TM();
  if(b) return dj(b+path);
  const k=TK();
  if(!k) throw new Error('Movie service not connected');
  const q=path.includes('?')?'&':'?';
  const url='https://api.themoviedb.org/3'+path+q+'api_key='+encodeURIComponent(k);
  const r=await fetch(url);
  if(!r.ok) throw new Error('TMDB '+r.status);
  return r.json();
}
async function dMv(){
  const b=TM(), k=TK(), n=DS.data?.nm||'';
  if(!b&&!k){
    DS.mv={load:true};dDraw();
    const l=getLocalMovies(n);
    DS.mv={movies:l.movies, docs:l.docs, curated:true};
    dDraw();
    return;
  }
  DS.mv={load:true};dDraw();
  const j=p=>tmdbGet(p);
  try{
    const gm=await j('/genre/movie/list').then(r=>Object.fromEntries(r.genres.map(g=>[g.id,g.name]))).catch(()=>({})),ks=(await j('/search/keyword?query='+enc(n))).results.slice(0,3).map(x=>x.id),kw=ks.length?'&with_keywords='+ks.join('|'):'',none={results:[]};
    const[mk,dk,ms,ds]=await Promise.all([ks.length?j('/discover/movie?sort_by=popularity.desc&without_genres=99'+kw):none,ks.length?j('/discover/movie?sort_by=popularity.desc&with_genres=99'+kw):none,j('/search/movie?query='+enc(n)),j('/search/movie?query='+enc(n+' documentary'))]);
    const has=m=>(m.title+' '+(m.overview||'')).toLowerCase().includes(n.toLowerCase()),doc=m=>(m.genre_ids||[]).includes(99),seen=new Set(),cv=(l,rel)=>l.filter(m=>!seen.has(m.id)&&seen.add(m.id)).map(m=>({id:m.id,t:m.title,y:(m.release_date||'').slice(0,4),r:m.vote_average?m.vote_average.toFixed(1):'–',o:m.overview||'',g:(m.genre_ids||[]).slice(0,3).map(x=>gm[x]).filter(Boolean).join(', '),p:m.poster_path?DISCOVER_CONFIG.tmdbImg+m.poster_path:'',rel,tmdb:m.id}));
    DS.mv={movies:[...cv(mk.results,'TMDB keyword match'),...cv(ms.results.filter(m=>!doc(m)&&has(m)),'Title or description mentions '+n)].slice(0,12),docs:[...cv(dk.results,'TMDB keyword match'),...cv([...ds.results,...ms.results].filter(m=>doc(m)&&has(m)),'Title or description mentions '+n)].slice(0,8)}}catch(e){DS.mv={err:e.message}}dDraw()}
const mcard=(x,k,i)=>{
  const p = x.p || (x.yt ? `https://img.youtube.com/vi/${x.yt}/hqdefault.jpg` : '');
  return `<div class='card gl h'>${p ? `<div style='aspect-ratio:16/10;overflow:hidden;border-radius:12px;margin-bottom:10px;background:#18181B'><img class='gi pos ok' loading='lazy' src='${ea(p)}' alt='' style='width:100%;height:100%;object-fit:cover' onerror='imgE(this)'></div>` : `<div class='nop'>🎬</div>`}<h3 style='margin:8px 0 2px;font-size:15px'>${E(x.t)}</h3><div class='mut'>${x.y||'Year n/a'} · ★ ${x.r}${x.g?' · '+E(x.g):''}</div><div class='pill' style='background:#F5B942;margin:6px 0'>${E(x.rel)}</div><p class='mut'>${E(clip(x.o,110)||'No description available.')}</p><button class='btn s' onclick='dMd(${k},${i})'>Details</button></div>`;
};
function dMvH(){
  const m=DS.mv,h=`<h3 style='margin-top:0'>Movies that take you there</h3>`;if(!m||m.load)return h+skel(6);
  if(m.err)return h+emp('⚠️','Could not load movies','The movie service returned an error ('+E(m.err)+'). Check the proxy address in firebase-config.js, that the function is deployed, and that your site address is allowed.');
  window._mv=[m.movies,m.docs];
  const note=m.curated
    ? `<div class='al info' style='margin-bottom:14px;background:#F5B94222;color:#FFD166;border:1px solid #F5B94255;border-radius:10px;padding:9px 13px'><b>🎬 Curated Destination Cinema:</b> Famous movies and documentaries set in or exploring <b>${E(DS.data?.nm||'this destination')}</b>. Pre-stored with official posters & trailers!</div>`
    : `<p class='mut'>Data from TMDB. A listing means TMDB links the film to this place by keyword or text; it does not confirm that it was filmed here.</p>`;
  return h+note+(m.movies.length?`<div class='grid a4'>${m.movies.map((x,i)=>mcard(x,0,i)).join('')}</div>`:emp('🎬','No movies found','No films found matching this destination.'))+`<h3 style='margin-top:22px'>Documentaries</h3>`+(m.docs.length?`<div class='grid a4'>${m.docs.map((x,i)=>mcard(x,1,i)).join('')}</div>`:emp('🎞️','No documentaries found','No documentaries found matching this destination.'));
}
async function dMd(k,i){
  const m=window._mv[k][i],b=TM(),k2=TK();modal(`<h3>${E(m.t)} ${m.y?'('+m.y+')':''}</h3><div id='mdb'><div class='sp'></div> Loading details…</div>`);let d=null,tr=null;
  if(b||k2){try{[d,tr]=await Promise.all([tmdbGet('/movie/'+m.id),tmdbGet('/movie/'+m.id+'/videos').catch(()=>({results:[]}))])}catch(e){}}
  const v=(tr&&tr.results.find(x=>x.site=='YouTube'&&x.type=='Trailer'))||(m.yt?{key:m.yt}:null),o=$('#mdb');if(!o)return;
  const p = m.p || (m.yt ? `https://img.youtube.com/vi/${m.yt}/hqdefault.jpg` : '');
  o.innerHTML=`<div class='fg' style='display:flex;gap:16px;flex-wrap:wrap'>${p?`<div style='width:min(200px,100%);aspect-ratio:16/10;border-radius:12px;overflow:hidden;background:#18181B;flex:none'><img src='${ea(p)}' alt='' style='width:100%;height:100%;object-fit:cover' onerror='imgE(this)'></div>`:''}<div><div class='mut'>★ ${m.r}${d&&d.vote_count?' ('+d.vote_count+' votes)':''}${d&&d.runtime?' · '+d.runtime+' min':m.runtime?' · '+m.runtime+' min':''}${d&&d.release_date?' · '+E(d.release_date):m.y?' · '+m.y:''}</div>${d&&d.genres&&d.genres.length?`<div class='mut'>${d.genres.map(g=>E(g.name)).join(', ')}</div>`:m.g?`<div class='mut'>${E(m.g)}</div>`:''}<div class='pill' style='background:#F5B942;margin:8px 0'>${E(m.rel)}</div>${d&&d.tagline?`<p><i>${E(d.tagline)}</i></p>`:''}<p>${E((d&&d.overview)||m.o||'No description available.')}</p></div></div><div class='row' style='margin-top:12px;justify-content:flex-start;gap:8px'><button class='btn g' onclick='cl()'>Close</button>${v?`<a class='btn' target='_blank' rel='noopener' href='https://www.youtube.com/watch?v=${ea(v.key)}'>Watch trailer</a>`:''}${m.tmdb?`<a class='btn g' target='_blank' rel='noopener' href='https://www.themoviedb.org/movie/${m.tmdb}'>View on TMDB ↗</a>`:''}</div>`;
}
/* ---- lightbox with photo credits ---- */
let LB=0;function lb(i){LB=i;let e=$('#lb');if(!e){e=document.createElement('div');e.id='lb';e.innerHTML=`<button onclick='lbx()'>✕</button><button class='pv' onclick='lbn(-1)'>‹</button><img id='lbi' alt='' onerror='imgE(this)'><button class='nx' onclick='lbn(1)'>›</button><div id='lbc'></div>`;document.body.appendChild(e);document.addEventListener('keydown',k=>{if(!$('#lb').classList.contains('on'))return;if(k.key=='Escape')lbx();if(k.key=='ArrowRight')lbn(1);if(k.key=='ArrowLeft')lbn(-1)})}e.classList.add('on');lbs()}
function lbs(){const g=DS.data.gal,x=g[LB];$('#lbi').src=x.full||x.src;$('#lbc').innerHTML=`${LB+1} / ${g.length} · ${E(x.cap)}<br><span class='mut'>${x.by?'Photo: '+E(x.by)+' · ':''}${x.lic?E(x.lic)+' · ':''}${x.link?`<a href='${ea(x.link)}' target='_blank' rel='noopener' style='color:#F5B942'>Source: Wikimedia Commons ↗</a>`:''}</span>`}
function lbn(d){const n=DS.data.gal.length;LB=(LB+d+n)%n;lbs()}function lbx(){$('#lb').classList.remove('on')}
/* ---- page body for the selected destination ---- */
function dBody(){if(DS.load)return`<div class='card'><div class='skl' style='height:220px;border-radius:14px'></div><div class='skl' style='height:16px;margin:14px 0;border-radius:8px'></div><div class='skl' style='height:16px;width:70%;border-radius:8px'></div></div>`;
if(DS.err)return emp('🧭',DS.err=='nf'?'We could not find that destination':DS.err=='amb'?'That name is too broad':'Could not load destination data',DS.err=='net'?'Wikipedia or Wikimedia could not be reached. Check your internet connection and try again.':'Try a more specific name, for example Manali or Paris France.');
const c=DS.data;if(!c)return`<h3>Featured destinations</h3><div class='grid a4' style='margin-top:0'>${FEAT.map((f,i)=>`<div class='dest' style='background:linear-gradient(135deg,#3f3a2a,#071426);min-height:110px' onclick='dF(${i})'><em>${f[1]}</em><b>${f[0]}</b><small>Explore</small></div>`).join('')}</div>`;
const sec=re=>{const k=Object.keys(c.sec).find(x=>re.test(x));return k?[k,c.sec[k]]:null},saved=(D.wish||[]).some(w=>w.name==c.nm);let b='';
const gal=(l,off)=>`<div class='gal'>${l.map((g,i)=>`<figure class='skl' onclick='lb(${i+off})'>${im(g.src)}<figcaption>${E(clip(g.cap,70))}${g.by?'<br>© '+E(g.by):''}</figcaption></figure>`).join('')}</div>`;
if(DS.tab=='Overview'){const cl=sec(/climate|weather/i),fx=c.ex.split('. ').slice(1,4);b=`<div class='dcv skl'>${im(c.cv)}<div class='dtt'><h2>${E(c.t)}</h2><div class='mut'>${E(c.ds)}</div></div></div><div class='grid a2'><div class='card gl'><h3>About ${E(c.nm)}</h3><p>${E(c.ex)}</p><div class='row' style='justify-content:flex-start;gap:12px'>${c.url?`<a href='${ea(c.url)}' target='_blank' rel='noopener' style='color:var(--teal)'>Read more on Wikipedia ↗</a>`:''}${c.co?`<a href='https://www.google.com/maps/search/?api=1&query=${c.co.lat},${c.co.lon}' target='_blank' rel='noopener' style='color:var(--teal)'>Open in Google Maps ↗</a>`:''}</div></div><div class='card gl'><h3>Climate and seasons</h3>${cl?`<p>${E(clip(cl[1],520))}</p>`:`<p class='mut'>No climate section was found for this page.</p>`}${fx.length?`<h3>Facts</h3>${fx.map(x=>`<div class='tl'>${E(x.endsWith('.')?x:x+'.')}</div>`).join('')}`:''}</div></div>${c.gal.length?`<h3 style='margin-top:20px'>Explore through images</h3>${gal(c.gal.slice(0,6),0)}<button class='btn g s' style='margin-top:10px' onclick='dTab(this.dataset.t)' data-t='Images'>See all ${c.gal.length} photos</button>`:''}`}
else if(DS.tab=='Images')b=c.gal.length?`<h3 style='margin-top:0'>Explore through images</h3>${gal(c.gal,0)}<p class='mut'>Photographs from Wikimedia Commons. Click a photo for the creator, licence and source link.</p>`:emp('🖼️',c.ie?'Could not load photos':'No photos found',c.ie?'Wikimedia Commons could not be reached. Try again in a moment.':'Wikimedia Commons has no matching photographs for this destination.');
else if(DS.tab=='Movies')b=dMvH();
else if(DS.tab=='Stories'){const s=DS.st,h=sec(/history/i);b=`<h3 style='margin-top:0'>Discover its history and stories</h3>`+(!s||s.load?skel(3):`${h?`<div class='card gl' style='margin-bottom:14px'><h3>${E(h[0])}</h3><p>${E(clip(h[1],900))}</p>${c.url?`<a href='${ea(c.url)}' target='_blank' rel='noopener' style='color:var(--teal)'>Full article on Wikipedia ↗</a>`:''}</div>`:''}`+(s.err?emp('⚠️','Could not load stories','Wikipedia could not be reached ('+E(s.err)+').'):s.list.length?rc(s.list):emp('📜','No related stories found','Wikipedia has no further articles about this destination’s history.')))}
else if(DS.tab=='Places'){window._pl=c.pl;b=c.pl.length?`<h3 style='margin-top:0'>Must-visit places</h3><p class='mut'>Notable places within 10 km of the centre, from Wikipedia. “Popular” and “Lesser-known” compare Wikipedia page views over the last 30 days.</p><div class='grid a3'>${c.pl.map((p,i)=>`<div class='card gl h'><div class='dcv skl' style='aspect-ratio:16/10;min-height:0;border-radius:14px'>${im(p.img)}</div><h3 style='margin:10px 0 2px'>${E(p.n)}</h3><div class='mut'>${p.d.toFixed(1)} km from centre</div><div class='row' style='justify-content:flex-start;gap:6px;margin:6px 0'><span class='pill' style='background:#F5B942'>${p.tag}</span>${p.h?`<span class='pill' style='background:#FFD166'>Historic</span>`:''}</div><p>${E(clip(p.x,190))}</p><div class='row' style='gap:6px'><button class='btn s' onclick='dIti(${i})'>Add to Itinerary</button><a class='btn g s' target='_blank' rel='noopener' href='https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}'>Google Maps ↗</a><a class='mut' href='${ea(p.u)}' target='_blank' rel='noopener'>Wikipedia ↗</a></div></div>`).join('')}</div>`:emp('📍',c.pe?'Could not load places':'No nearby places found',c.pe?'Wikipedia could not be reached. Try again in a moment.':'Wikipedia lists no places with coordinates around this destination.')}
else{const u=DS.cu,ms=[['Culture and traditions',/culture|festival|tradition|religion|people|demograph/i],['Food and cuisine',/cuisine|food|dish/i]].map(z=>{const s=sec(z[1]);return s?`<div class='card gl'><h3>${z[0]}</h3><p>${E(clip(s[1],600))}</p></div>`:''}).join('');
b=`<h3 style='margin-top:0'>Local culture, food and traditions</h3>`+(!u||u.load?skel(3):`${ms?`<div class='grid a2' style='margin-top:0;margin-bottom:14px'>${ms}</div>`:''}${u.g.map(x=>`<h3 style='margin-top:18px'>${x[0]}</h3>${rc(x[1])}`).join('')||(ms?'':emp('🎭',u.failed?'Could not load culture information':'No culture articles found',u.failed?'Wikipedia could not be reached. Try again in a moment.':'Wikipedia has no matching articles for this destination.'))}`)}
return`<div class='row' style='justify-content:flex-start;gap:6px;margin-bottom:12px'>${DT.map(x=>`<button class='btn s ${DS.tab==x?'':'g'}' data-t='${x}' onclick='dTab(this.dataset.t)'>${x}</button>`).join('')}</div>${b}<div class='card gl' style='margin-top:16px'><div class='row'><div><h3 style='margin:0'>Plan your journey to ${E(c.nm)}</h3><span class='mut'>Add it to a trip, start a new one, save it, or check the budget.</span></div><div class='row' style='gap:6px'><button class='btn' onclick='dAdd()'>${ic('map-pin-plus')}Add to My Trip</button><button class='btn g' onclick='dNew()'>${ic('plus')}Create Trip</button><button class='btn g' onclick='dSave()'>${ic('heart')}${saved?'Saved (remove)':'Save Destination'}</button><button class='btn o' onclick='dBud()'>${ic('wallet')}Explore Budget</button></div></div></div>`}
/* JourneyJar integration */
function dNew(){wiz(DS.data.nm)}
function dBud(){go('home');setTimeout(()=>{const e=$('#h_to');if(e){e.value=DS.data.nm;$('#planner').scrollIntoView({behavior:'smooth'});toast('Set your budget and press Generate Plan')}},80)}
function dSave(){const c=DS.data;D.wish=D.wish||[];const i=D.wish.findIndex(w=>w.name==c.nm),on=U&&FBOK;
if(i<0){D.wish.push({name:c.nm,desc:c.ds});toast(on?'Saving to your account...':'Saved on this device');if(on)JJ.saveDiscovery(U.uid,{name:c.nm,title:c.t,desc:c.ds,summary:clip(c.ex,600),cover:(c.cv||'').startsWith('http')?c.cv:'',source:c.local?'offline-guide':'wikipedia',lat:c.co?c.co.lat:null,lon:c.co?c.co.lon:null}).then(()=>toast('Saved to your account')).catch(e=>toast('Could not save: '+(e.code||e.message)))}
else{D.wish.splice(i,1);toast('Removed from saved destinations');if(on)JJ.removeDiscovery(U.uid,c.nm).catch(e=>toast('Could not remove: '+(e.code||e.message)))}sv();R()}
function dAdd(){const c=DS.data;if(!D.trips.length){toast('Create a trip first');return wiz(c.nm)}modal(`<h3>Add ${E(c.nm)} to a trip</h3><p class='mut'>Set it as the main destination of the trip, or add it as an extra stop.</p><label>Trip</label><select id='d_t'>${D.trips.map(t=>`<option value='${t.id}'>${E(t.name)} (now: ${E(t.to)})</option>`).join('')}</select><div class='row' style='margin-top:14px'><button class='btn g' onclick='cl()'>Cancel</button><button class='btn' onclick='dSet()'>Set as main destination</button><button class='btn g' onclick='dStop()'>Add as extra stop</button></div>`)}
function dSet(){const t=D.trips.find(z=>z.id==$('#d_t').value);if(!t)return;t.to=DS.data.nm;sv();cl();R();toast('Destination set for '+t.name)}
function dIti(i){const p=window._pl[i];if(!D.trips.length){toast('Create a trip first');return wiz(DS.data.nm)}modal(`<h3>Add to itinerary</h3><b>${E(p.n)}</b><label>Trip</label><select id='d_t' onchange='dDays()'>${D.trips.map(t=>`<option value='${t.id}'>${E(t.name)}</option>`).join('')}</select><label>Day</label><select id='d_d'></select><div class='row' style='margin-top:14px'><button class='btn g' onclick='cl()'>Cancel</button><button class='btn' onclick='dIs(${i})'>Add to itinerary</button></div>`);dDays()}
function dDays(){const t=D.trips.find(z=>z.id==$('#d_t').value);$('#d_d').innerHTML=Array.from({length:dys(t)},(_,i)=>`<option value='${i+1}'>Day ${i+1}</option>`).join('')}
function dIs(i){const p=window._pl[i],t=D.trips.find(z=>z.id==$('#d_t').value);if(!t)return;D.iti.push({id:rid(),trip:t.id,day:+$('#d_d').value,time:'10:00',title:'Visit '+p.n});sv();cl();toast('Added to the itinerary of '+t.name)}
/* offline guide: used when Wikipedia cannot be reached */
const LOC=[
{n:'Manali',c:'Himachal Pradesh, India',e:'🏔️',g:'#4a5d6b,#071426',d:'Manali is a Himalayan resort town in the Kullu Valley of Himachal Pradesh, beside the Beas River at about 2,050 metres. It is a base for trekking, skiing, river rafting and the road to Lahaul and Spiti. Orchards, pine forests and snow-capped peaks make it popular in both summer and winter.',b:'March to June for pleasant weather and sightseeing; December to February for snow.',a:[['Solang Valley','A meadow known for paragliding in summer and skiing in winter.'],['Hadimba Temple','A wooden temple set in a cedar forest, dedicated to Hidimba Devi.'],['Rohtang Pass','A high mountain pass with snow views, open mainly from late spring to autumn. Check access rules before travelling.'],['Old Manali','A relaxed area with cafes, small shops and views over the river.']],cu:'Local life blends Himachali, Tibetan and Hindu traditions, with festivals such as Dussehra in nearby Kullu.',f:'Try siddu (steamed bread), trout from the Beas, and Tibetan momos and thukpa.'},
{n:'Goa',c:'India',e:'🏖️',g:'#0f766e,#071426',d:'Goa is a state on the west coast of India, known for its beaches, Portuguese colonial heritage and relaxed pace. The churches and convents of Old Goa are a UNESCO World Heritage Site.',b:'November to February for dry, cooler weather; June to September is the monsoon.',a:[['Basilica of Bom Jesus','A baroque church in Old Goa that holds the remains of St Francis Xavier.'],['Fort Aguada','A 17th-century Portuguese fort overlooking the Arabian Sea.'],['Baga and Calangute','Popular beaches with water sports, shacks and nightlife.'],['Fontainhas','The Latin Quarter of Panaji, with colourful Portuguese-era houses.']],cu:'Goan culture mixes Konkani and Portuguese influences, seen in festivals such as Carnival and Sao Joao.',f:'Fish curry rice, pork vindaloo, bebinca dessert and fresh seafood.'},
{n:'Paris',c:'France',e:'🗼',g:'#6b5a2a,#071426',d:'Paris is the capital of France, on the River Seine. It is known for art, fashion, cafe culture and landmarks such as the Eiffel Tower, the Louvre and Notre-Dame cathedral.',b:'April to June and September to October for mild weather; summers are warm and busy.',a:[['Eiffel Tower','The iron tower completed in 1889, with views over the city.'],['Louvre Museum','One of the largest art museums in the world, home to the Mona Lisa.'],['Notre-Dame','A Gothic cathedral on the Ile de la Cite.'],['Montmartre','A hilltop district of artists and cafes, crowned by the Sacre-Coeur basilica.']],cu:'Paris has a long tradition of art, literature and cafe life, with museums, fashion weeks and street markets.',f:'Croissants, baguettes, cheese, macarons and bistro classics such as steak frites.'},
{n:'Tokyo',c:'Japan',e:'🏯',g:'#7a2e3a,#071426',d:'Tokyo is the capital of Japan and one of the largest cities in the world. It mixes ultra-modern districts with temples, gardens and traditional neighbourhoods, linked by an extensive rail network.',b:'March to May for cherry blossom and October to November for autumn colour.',a:[['Senso-ji','Tokyo oldest Buddhist temple, in the Asakusa district.'],['Shibuya Crossing','One of the busiest pedestrian crossings in the world.'],['Meiji Shrine','A forested Shinto shrine in the middle of the city.'],['Tokyo Skytree','A very tall broadcasting tower with observation decks.']],cu:'Tokyo balances tradition and pop culture, from tea ceremonies and festivals to anime and gaming districts.',f:'Sushi, ramen, tempura, and street snacks in markets and izakayas.'},
{n:'Bali',c:'Indonesia',e:'🌺',g:'#1f6b4f,#071426',d:'Bali is an Indonesian island known for its beaches, rice terraces, volcanic scenery and Hindu temples. It is a centre of dance, crafts and spiritual life.',b:'April to October, during the drier season.',a:[['Tanah Lot','A temple on a rock formation just off the coast.'],['Ubud','The cultural heart of Bali, with art markets, dance and the Monkey Forest.'],['Tegallalang Rice Terraces','Layered rice fields north of Ubud.'],['Uluwatu Temple','A clifftop sea temple famous for sunset views.']],cu:'Balinese Hinduism shapes daily life through offerings, ceremonies and temple festivals.',f:'Nasi goreng, satay, babi guling and fresh tropical fruit.'},
{n:'Varanasi',c:'Uttar Pradesh, India',e:'🪔',g:'#8a5a1f,#071426',d:'Varanasi is one of the oldest continuously inhabited cities in the world, on the banks of the Ganges. It is a major pilgrimage centre for Hindus, known for its ghats, temples and evening aarti.',b:'October to March for cooler weather.',a:[['Dashashwamedh Ghat','The main ghat, famous for the evening Ganga aarti.'],['Kashi Vishwanath Temple','One of the most important Shiva temples in India.'],['Sarnath','A nearby Buddhist site where the Buddha gave his first sermon.'],['Assi Ghat','A lively southern ghat with morning yoga and music.']],cu:'Music, silk weaving and religious learning are central to the culture of the city.',f:'Kachori sabzi, lassi, banarasi paan and winter sweets such as malaiyo.'},
{n:'Jaipur',c:'Rajasthan, India',e:'🏰',g:'#a0455a,#071426',d:'Jaipur, the Pink City, is the capital of Rajasthan. It is known for its forts, palaces and bazaars, and its historic centre is a UNESCO World Heritage Site.',b:'October to March for cooler weather.',a:[['Amber Fort','A hilltop fort-palace of sandstone and marble.'],['City Palace','A palace complex that still houses the royal family.'],['Hawa Mahal','The Palace of Winds, with its honeycomb facade.'],['Jantar Mantar','An 18th-century astronomical observatory with giant instruments.']],cu:'Rajasthani folk music, block-print textiles and gemstone crafts are well known.',f:'Dal baati churma, laal maas and ghewar sweets.'},
{n:'Kyoto',c:'Japan',e:'⛩️',g:'#7a3a2a,#071426',d:'Kyoto was the imperial capital of Japan for over a thousand years. It is known for its temples, gardens, geisha districts and traditional wooden houses.',b:'Late March to April for cherry blossom and November for autumn leaves.',a:[['Fushimi Inari Shrine','A mountainside shrine with thousands of red torii gates.'],['Kinkaku-ji','The Golden Pavilion, a Zen temple covered in gold leaf.'],['Arashiyama Bamboo Grove','A towering bamboo path on the western edge of the city.'],['Kiyomizu-dera','A wooden temple with a large terrace over the hillside.']],cu:'Tea ceremony, kaiseki dining and seasonal festivals such as Gion Matsuri keep traditions alive.',f:'Kaiseki, yudofu, matcha sweets and snacks at Nishiki Market.'}];
const art=(e,l,g)=>{const p=g.split(',');return 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='640' height='400'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${p[0]}'/><stop offset='1' stop-color='${p[1]}'/></linearGradient></defs><rect width='640' height='400' fill='url(#g)'/><text x='320' y='190' font-size='90' text-anchor='middle'>${e}</text><text x='320' y='290' font-size='30' fill='#FFD166' text-anchor='middle' font-family='sans-serif'>${l}</text></svg>`)};
function dLocal(q){const k=q.trim().toLowerCase(),L=LOC.find(x=>{const n=x.n.toLowerCase();return k&&(k==n||k.startsWith(n+' ')||k.startsWith(n+',')||(k.length>2&&n.startsWith(k)))});if(!L)return null;return{t:L.n+', '+L.c,nm:L.n,ds:L.c,ex:L.d,url:'',cv:art(L.e,L.n,L.g),co:null,local:true,gal:L.a.map(a=>({src:art(L.e,a[0],L.g),full:'',cap:a[0]+': '+a[1]})),sec:{'Climate and seasons':'Best time to visit: '+L.b,'Culture and traditions':L.cu,'Food and cuisine':L.f},pl:L.a.map(a=>({n:a[0],x:a[1],img:art(L.e,a[0],L.g),d:null,u:''}))}}
function dFeat(){return`<h3 style='margin-top:20px'>Try one of these destinations</h3><div class='grid a4' style='margin-top:0'>${FEAT.map((f,i)=>`<div class='dest' style='background:linear-gradient(135deg,#3f3a2a,#071426);min-height:110px' onclick='dF(${i})'><em>${f[1]}</em><b>${f[0]}</b><small>Explore</small></div>`).join('')}</div>`}
function dL(i){dF(i)}
function discPg(){return`<div class='dh'><span class='bd'>JourneyJar Discover</span><h1 style='margin:0 0 8px;font-size:clamp(26px,5vw,44px)'>Explore the destination.<br>Discover its stories.<br><span style='color:#F5B942'>Plan your journey.</span></h1><div style='position:relative;max-width:560px;margin-top:16px'><div class='row' style='flex-wrap:nowrap'><input id='d_q' placeholder='Search a destination, e.g. Manali, Paris, Tokyo' value='${ea(DS.q)}' oninput='dSug(this.value)' onkeydown='if(event.keyCode==13)dGo()' autocomplete='off'><button class='btn' onclick='dGo()'>${ic('search')}Search</button></div><div id='ds'></div></div>${(D.wish||[]).length?`<div class='row' style='justify-content:flex-start;margin-top:12px;gap:6px'><span class='mut'>Saved:</span>${D.wish.map((w,i)=>`<button class='btn g s' onclick='dWl(${i})'>♥ ${E(w.name)}</button>`).join('')}</div>`:''}${(DS.recent||[]).length?`<div class='row' style='justify-content:flex-start;margin-top:10px;gap:6px'><span class='mut'>Recent:</span>${DS.recent.map((q,i)=>`<button class='btn g s' onclick='dRc(${i})'>${E(q)}</button>`).join('')}</div>`:''}</div><div id='dres' style='margin-top:16px'>${dBody()}</div>`}
function dRc(i){$('#d_q').value=DS.recent[i];dLoad(DS.recent[i])}
function stopsCard(t){const s=t.stops||[];return`<div class="card" style="margin-top:14px"><div class="row"><h3 style="margin:0">${ic('map-pinned')} Destinations</h3><span class="mut">${s.length+1} stop(s)</span></div><div class="row" style="justify-content:flex-start;gap:8px;margin:10px 0"><span class="pill" style="background:#F5B942">1 · ${E(t.to)} (main)</span>${s.map((x,i)=>`<span class="pill" style="background:#FFD166">${i+2} · ${E(x)} <a style="cursor:pointer;margin-left:6px" onclick="stopRm(${i})" title="Remove">✕</a></span>`).join('')}</div><div class="row" style="flex-wrap:nowrap"><input id="s_n" placeholder="Add another destination, e.g. Kasol" onkeydown="if(event.keyCode==13)stopAdd()"><button class="btn" onclick="stopAdd()">${ic('plus')}Add stop</button></div></div>`}
function stopAdd(){const t=cur(),v=$('#s_n').value.trim();if(!v)return toast('Enter a destination name');if(v.length>60)return toast('That name is too long');t.stops=t.stops||[];if([t.to,...t.stops].some(x=>x.toLowerCase()==v.toLowerCase()))return toast('That destination is already in this trip');if(t.stops.length>=12)return toast('A trip can have up to 12 extra stops');t.stops.push(v);sv();R();toast('Stop added')}
function stopRm(i){const t=cur(),n=t.stops[i];t.stops.splice(i,1);sv();R();toast('Removed '+n)}
function dStop(){const t=D.trips.find(z=>z.id==$('#d_t').value);if(!t)return;t.stops=t.stops||[];const n=DS.data.nm;if([t.to,...t.stops].some(x=>x.toLowerCase()==n.toLowerCase()))return toast('Already in this trip');t.stops.push(n);sv();cl();R();toast(n+' added as a stop on '+t.name)}
function th(x){x=='auto'?document.documentElement.removeAttribute('data-theme'):document.documentElement.setAttribute('data-theme',x)}
function rmP(i){const t=cur();if(t.people.length<2)return toast('Keep at least one person');t.people.splice(i,1);D.exp.forEach(e=>{if(e.trip==t.id){if(e.paid==i)e.paid=0;else if(e.paid>i)e.paid--}});sv();R()}
function addI(){const n=$('#i_n').value.trim();if(!n)return toast('Enter an activity');D.iti.push({id:rid(),trip:cur().id,day:+$('#i_d').value,time:$('#i_t').value||'09:00',title:n});sv();R()}
function el(){const t=cur();if(!t)return;let l=ex(t.id).filter(e=>(!V.cat||e.cat==V.cat)&&(!V.q||(e.name+e.notes).toLowerCase().includes(V.q.toLowerCase()))&&(!V.from||e.date>=V.from)&&(!V.to||e.date<=V.to));
l.sort({dd:(a,b)=>a.date<b.date?1:-1,da:(a,b)=>a.date>b.date?1:-1,ah:(a,b)=>b.amt-a.amt,al:(a,b)=>a.amt-b.amt,n:(a,b)=>a.name.localeCompare(b.name)}[V.sort]);
$('#ec').textContent=l.length+' expense(s) · '+M(sum(l),t.cur);$('#et').innerHTML=`<tr><th>Expense</th><th>Category</th><th>Amount</th><th>Date</th><th>Paid by</th><th>Notes</th><th></th></tr>`+(l.map(e=>`<tr><td><b>${E(e.name)}</b></td><td><span class="pill" style="background:${CAT[e.cat][1]}">${e.cat}</span></td><td><b>${M(e.amt,t.cur)}</b></td><td>${fd(e.date)}</td><td>${E(t.people[e.paid]||'–')}</td><td class="mut">${E(e.notes)}</td><td style="white-space:nowrap"><button class="btn g s" onclick="expF('${e.id}')">Edit</button> <button class="btn r s" onclick="cf('Delete this expense?',()=>{D.exp=D.exp.filter(z=>z.id!='${e.id}');sv();el()})">Delete</button></td></tr>`).join('')||'<tr><td colspan="7" class="mut" style="text-align:center;padding:30px">🧭 No matching expenses yet. Adjust the filters or add a new expense.</td></tr>');ico()}
function expF(id){const t=cur(),e=id?D.exp.find(z=>z.id==id):{name:'',cat:V.cat||'Transportation',amt:'',date:today<t.dep?t.dep:today,notes:'',paid:0};
modal(`<h3>${id?'Edit':'Add'} expense</h3><div class="fg"><div><label>Name *</label><input id="e_n" value="${E(e.name)}"></div><div><label>Category</label><select id="e_c">${CK.map(k=>`<option ${k==e.cat?'selected':''}>${k}</option>`).join('')}</select></div><div><label>Amount (${t.cur}) *</label><input id="e_a" type="number" min="0" value="${e.amt}"></div><div><label>Date</label><input id="e_d" type="date" value="${e.date}"></div><div><label>Paid by</label><select id="e_p">${t.people.map((p,i)=>`<option value="${i}" ${i==e.paid?'selected':''}>${E(p)}</option>`).join('')}</select></div></div><label>Notes</label><textarea id="e_o" rows="2">${E(e.notes)}</textarea><div id="er"></div><div class="row"><button class="btn g" onclick="cl()">Cancel</button><button class="btn" onclick="svE('${id||''}')">Save</button></div>`)}
function svE(id){const g=k=>$('#e_'+k).value.trim(),o={name:g('n'),cat:g('c'),amt:+g('a'),date:g('d'),notes:g('o'),paid:+g('p')};if(!o.name||g('a')===''||o.amt<0){$('#er').innerHTML='<div class="err">Enter a name and a valid amount.</div>';return}
const b4=pct(cur());if(id)Object.assign(D.exp.find(z=>z.id==id),o);else D.exp.push({id:rid(),trip:cur().id,...o});sv();cl();R();toast(thr(b4)||'Expense saved')}
let W={};
function wiz(dest){W={s:1,d:{to:dest||'',trav:2,mode:'Flight',acc:'Hotel',style:'Standard',cur:D.cur,food:0,act:0}};wv()}
const fv=(k,l,t='text',x='')=>`<div><label>${l}</label><input id="w_${k}" type="${t}" ${x} value="${E(W.d[k]??'')}"></div>`,fs=(k,l,o)=>`<div><label>${l}</label><select id="w_${k}">${o.map(z=>`<option ${z==W.d[k]?'selected':''}>${z}</option>`).join('')}</select></div>`;
function wv(){const d=W.d,s=W.s;let b=s==1?`<div class="fg">${fv('name','Trip name *')}${fv('from','Starting location *')}${fv('to','Destination *')}${fv('trav','Travelers *','number','min="1"')}${fv('dep','Departure date *','date',`min="${today}"`)}${fv('ret','Return date *','date')}${fs('mode','Travel mode',['Train','Bus','Flight','Car','Bike'])}${fv('bud','Budget limit *','number','min="1"')}</div>`:s==2?`<div class="fg">${fs('acc','Accommodation type',['Hotel','Hostel','Resort','Airbnb','Other'])}${fs('cur','Currency',Object.keys(SY))}${fv('food','Estimated food budget','number','min="0"')}${fv('act','Activities budget','number','min="0"')}</div><label>Travel style</label><div class="chips">${['Budget','Standard','Luxury'].map(x=>`<button class="${d.style==x?'on':''}" onclick="cap();W.d.style='${x}';wv()">${x}</button>`).join('')}</div>`:
`<div class="card" style="box-shadow:none"><b style="font-size:17px">${E(d.name)}</b><div class="mut">${E(d.from)} → ${E(d.to)} · ${fd(d.dep)} – ${fd(d.ret)} (${dys({dep:d.dep,ret:d.ret})} days)</div><div class="fg" style="margin-top:8px"><div class="mut">Travelers<br><b>${d.trav}</b></div><div class="mut">Mode<br><b>${d.mode}</b></div><div class="mut">Stay<br><b>${d.acc}</b></div><div class="mut">Style<br><b>${d.style}</b></div><div class="mut">Budget<br><b>${M(d.bud,d.cur)}</b></div><div class="mut">Food / Activities<br><b>${M(d.food,d.cur)} / ${M(d.act,d.cur)}</b></div></div></div>`;
modal(`<div class="steps">${[1,2,3].map(i=>`<i class="${i<=s?'on':''}"></i>`).join('')}</div><h3>Step ${s} of 3 · ${['Trip details','Travel preferences','Review & create'][s-1]}</h3><div class="stp">${b}</div><div id="er"></div><div class="row" style="margin-top:14px"><button class="btn g" onclick="${s>1?'cap();W.s--;wv()':'cl()'}">${s>1?'Back':'Cancel'}</button><button class="btn o" onclick="wn()">${s<3?'Next':'Create trip'}</button></div>`)}
function cap(){const g=k=>$('#w_'+k)?.value.trim();(W.s==1?['name','from','to','dep','ret','trav','mode','bud']:W.s==2?['acc','cur','food','act']:[]).forEach(k=>W.d[k]=g(k))}
function wn(){cap();const d=W.d,e=[];if(W.s==1){if(!d.name)e.push('Trip name is required');if(!d.from)e.push('Starting location is required');if(!d.to)e.push('Destination is required');if(!d.dep)e.push('Pick a departure date');if(!d.ret)e.push('Pick a return date');if(d.dep&&d.ret&&d.ret<d.dep)e.push('Return date cannot be before departure');if(!(+d.trav>=1))e.push('At least 1 traveler');if(!(+d.bud>0))e.push('Budget must be above 0')}
if(W.s==2){if(+d.food<0||+d.act<0)e.push('Amounts cannot be negative');if(+d.food+ +d.act>+d.bud)e.push('Food + activities exceed your total budget')}
if(e.length){$('#er').innerHTML='<div class="err">'+e.join('<br>')+'</div>';return}
if(W.s<3){W.s++;return wv()}
const id=Date.now(),n=+d.trav;D.trips.push({id,name:d.name,from:d.from,to:d.to,dep:d.dep,ret:d.ret,trav:n,mode:d.mode,budget:+d.bud,acc:d.acc,style:d.style,cur:d.cur,people:Array.from({length:n},(_,i)=>i?'Friend '+i:'You')});
if(+d.food>0)D.exp.push({id:rid(),trip:id,name:'Estimated food',cat:'Food',amt:+d.food,date:d.dep,notes:'From trip setup',paid:0});if(+d.act>0)D.exp.push({id:rid(),trip:id,name:'Estimated activities',cat:'Activities',amt:+d.act,date:d.dep,notes:'From trip setup',paid:0});
sv();cl();V.cat='';go('plan',id);toast('Journey created!')}
R();

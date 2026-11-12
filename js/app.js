/* QUEST · js/app.js
   Interface behaviour: the map, the guidebook, the journal, the lookbook.
   No editorial content lives here. Stories, destinations, quests, gear, discoveries and
   updates are in /content; see README.md for how to add to them. */
(function(){
const Q=window.QUEST;
const {ISSUE,CLASSES,STATN,SKINS,SKIN_NAMES,LV,ZONES,TRAVEL,CITIES,LANDS,ITEMS,LOOKS,RAR,CHARMGLYPH,QUESTS,SECRET,SKILLS,QSK,CHAPTERS,DETAILS,THREADS,OUTTAKES,UPDATES,RELIC,relicSVG,avatarSVG,SND,Store,Pilot,Topo}=Q;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const spark=n=>`<span class="rating" aria-label="${n} of 3">${Array.from({length:n},()=>'<svg viewBox="0 0 100 100"><use href="#spark"/></svg>').join('')}</span>`;
const fmtDate=d=>new Date(typeof d==="string"&&d.length===10?d+"T12:00":d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
const P=(lat,lon)=>{const L=lon<0?lon+360:lon;return[(L-128)*10,(53-lat)*12.5]};

/* ============ STATE ============ */
let S=Store.load();
const save=()=>Store.save(S);
const lvOf=xp=>{let l=1;LV.forEach((t,i)=>{if(xp>=t)l=i+1});return Math.min(l,LV.length)};
const lvl=()=>S?lvOf(S.xp):1;
const published=k=>!!ZONES[k]&&ZONES[k].status!=='territory';
const allQ=()=>{const q=QUESTS.filter(x=>published(x.z));return S&&S.secret?[...q,SECRET]:q};
const qById=id=>allQ().find(q=>q.id===id);
const dropsFrom=it=>[...QUESTS,SECRET].find(q=>q.loot.includes(it));
const chById=id=>CHAPTERS.find(c=>c.id===id);
const chIdx=id=>CHAPTERS.findIndex(c=>c.id===id);
function stats(){const b={...CLASSES[S.cls].st};Object.values(S.equip).forEach(id=>{const it=ITEMS[id];if(it)Object.entries(it.st).forEach(([k,v])=>b[k]+=v)});return b}
const skStr=q=>Object.entries(QSK[q.id]||{}).map(([k,v])=>SKILLS[k]+' +'+v).join(' · ');

/* reading record */
const isOpened=id=>!!(S&&S.j.read[id]);
const isRead=id=>!!(S&&S.j.read[id]&&S.j.read[id].end);
const zState=k=>!published(k)?'territory':isRead(k)?'read':isOpened(k)?'opened':'unread';
const STLBL={territory:'Territory ahead',read:'Read',opened:'In progress',unread:'Unread'};
const freshUpdates=()=>S?UPDATES.filter(u=>u.date>S.seenUpdates):[];
const isNew=id=>freshUpdates().some(u=>u.go&&u.go[0]===id);
const isSaved=k=>S.j.saved.some(x=>x.k===k);
function gainXP(n){const b=lvl();S.xp+=n;if(lvl()>b){setTimeout(()=>{toast('Level '+lvl()+' · '+CLASSES[S.cls].n);SND.level()},3200);publishPresence()}}

/* local time at a destination, from the real clock */
function localTime(z){try{const d=new Date(),f=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:z.tz}).format(d),h=+f.slice(0,2);
  return f+' · '+(h<5?'night':h<7?'first light':h<17?'day':h<20?'last light':'night')}catch(e){return''}}

/* ============ TOAST · HINT · FEED ============ */
let tt;function toast(m,ms=3000){const t=$('#toast');t.innerHTML=`<span class="dot"></span><span>${esc(m)}</span>`;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),ms)}
function hint(m){$('#hint').textContent=m;$('#hint').style.opacity=m?1:0}
/* the feed only ever shows other real explorers on the published page. Offline it stays hidden. */
const feed=[];
function pushFeed(txt){if(!room)return;const d=new Date();feed.unshift({txt,t:pad(d.getHours())+':'+pad(d.getMinutes())});feed.length=Math.min(feed.length,4);
  $('#feedRows').innerHTML=feed.map(f=>`<div class="row"><span class="t">${f.t}</span><span>${esc(f.txt)}</span></div>`).join('');$('#feed').hidden=false}

/* ============ MAP ============ */
const svg=$('#map'),NS='http://www.w3.org/2000/svg';
(function drawBase(){
  $('#lands').innerHTML=LANDS.map(pts=>{const d='M'+pts.map(([lo,la])=>P(la,lo).map(v=>v.toFixed(1)).join(' ')).join('L')+'Z';return `<path class="land" d="${d}"/><path class="coast" d="${d}"/>`}).join('');
  let g='';for(let lo=130;lo<=250;lo+=10){const x=(lo-128)*10;g+=`<line class="grat" x1="${x}" y1="0" x2="${x}" y2="350"/>`}for(let la=25;la<=50;la+=5){const y=(53-la)*12.5;g+=`<line class="grat" x1="-20" y1="${y}" x2="1340" y2="${y}"/>`}
  $('#grat').innerHTML=g;
})();
let vb={x:1040,y:60,w:140,h:210},W=innerWidth||1280,H=innerHeight||800,s=1;
function fitTo(x0,y0,x1,y1,pad=.18){const a=W/H;let w=(x1-x0),h=(y1-y0);w*=1+pad*2;h*=1+pad*2;if(w/h>a)h=w/a;else w=h*a;return{x:(x0+x1)/2-w/2,y:(y0+y1)/2-h/2,w,h}}
function apply(){svg.setAttribute('viewBox',`${vb.x} ${vb.y} ${vb.w} ${vb.h}`);s=vb.w/W;{const g=Math.max(1.4,7*s),pt=$('#dots'),c=$('#dotc');pt.setAttribute('width',g);pt.setAttribute('height',g);c.setAttribute('cx',g/2);c.setAttribute('cy',g/2);c.setAttribute('r',Math.min(g*.16,1.1*s+.08))}renderZones(false);renderMe();renderPeersOnMap();scaleBar();placeCard();renderEdges();Topo.dirty()}
function scaleBar(){const miPerUnit=69/12.5;let target=80*s*miPerUnit;const nice=[5,10,20,50,100,200,500,1000,2000];const n=nice.find(v=>v>=target*.7)||2000;$('#scaleBar').style.width=(n/miPerUnit/s)+'px';$('#scaleTxt').textContent=n+' mi'}
let fly=null;
function flyTo(t,ms=1400){if(RM){vb=t;apply();return Promise.resolve()}const f={...vb},t0=performance.now();return new Promise(res=>{cancelAnimationFrame(fly);const st=n=>{const k=Math.min(1,(n-t0)/ms),e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;vb={x:f.x+(t.x-f.x)*e,y:f.y+(t.y-f.y)*e,w:f.w+(t.w-f.w)*e,h:f.h+(t.h-f.h)*e};apply();if(k<1)fly=requestAnimationFrame(st);else res()};fly=requestAnimationFrame(st)})}
const home=()=>fitTo(1078,83,1107,113,W<760?.18:.42);
function zoomAt(f,cx=W/2,cy=H/2){const wx=vb.x+cx/W*vb.w,wy=vb.y+cy/H*vb.h;const nw=Math.max(18,Math.min(1500,vb.w*f));const k=nw/vb.w;vb={x:wx-(cx/W)*nw,y:wy-(cy/H)*vb.h*k,w:nw,h:vb.h*k};apply()}
svg.addEventListener('wheel',e=>{e.preventDefault();cancelAnimationFrame(fly);zoomAt(Math.exp(e.deltaY*.0015),e.clientX,e.clientY)},{passive:false});
const ptrs=new Map();let dragged=0,pinch0=0;
let downZ=null;svg.addEventListener('pointerdown',e=>{const zz=e.target.closest&&e.target.closest('.zone');downZ=zz?zz.dataset.z:null;ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});dragged=0;cancelAnimationFrame(fly);if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch0=Math.hypot(a.x-b.x,a.y-b.y)}svg.setPointerCapture(e.pointerId);svg.classList.add('drag')});
svg.addEventListener('pointermove',e=>{
  const p=ptrs.get(e.pointerId);updCoord(e.clientX,e.clientY);if(!p)return;
  if(ptrs.size===2){p.x=e.clientX;p.y=e.clientY;const [a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch0){zoomAt(pinch0/d,(a.x+b.x)/2,(a.y+b.y)/2);pinch0=d}dragged=99;return}
  const dx=e.clientX-p.x,dy=e.clientY-p.y;dragged+=Math.abs(dx)+Math.abs(dy);vb.x-=dx*s;vb.y-=dy*s;p.x=e.clientX;p.y=e.clientY;apply()});
const endPtr=e=>{ptrs.delete(e.pointerId);if(ptrs.size<2)pinch0=0;if(!ptrs.size)svg.classList.remove('drag')};
svg.addEventListener('pointerup',e=>{const z=downZ;endPtr(e);downZ=null;if(dragged<8){if(z)pickZone(z,e.pointerType);else hideCard(true)}});
svg.addEventListener('pointercancel',endPtr);
$('#zIn').onclick=()=>zoomAt(.7);$('#zOut').onclick=()=>zoomAt(1.45);$('#zHome').onclick=()=>flyTo(home(),1000);
addEventListener('resize',()=>{const cx=vb.x+vb.w/2,cy=vb.y+vb.h/2;W=innerWidth;H=innerHeight;const nh=vb.w*H/W;vb={x:cx-vb.w/2,y:cy-nh/2,w:vb.w,h:nh};Topo.size();apply()});
function updCoord(cx,cy){const wx=vb.x+cx/W*vb.w,wy=vb.y+cy/H*vb.h;let lon=wx/10+128;if(lon>180)lon-=360;const lat=53-wy/12.5;$('#cLat').textContent=Math.abs(lat).toFixed(4)+'° '+(lat>=0?'N':'S');$('#cLon').textContent=Math.abs(lon).toFixed(4)+'° '+(lon>=0?'E':'W')}

/* ============ DESTINATIONS ON THE MAP ============
   Three states, readable without a legend: a glyph (published; dims and gains a tick once read),
   a dashed point (territory ahead), and a lime "NEW" when something was added since your last visit. */
let selZ=null,hovZ=null,cardZ=null,cardPin=false,entering=false,lastDown=0;
svg.addEventListener('pointerdown',()=>{lastDown=Date.now()},true);
function renderAuras(){$('#auras').innerHTML=Object.entries(ZONES).filter(([k])=>published(k)).map(([k,z])=>{const [x,y]=P(...z.ll);return `<circle class="aura" cx="${x}" cy="${y}" r="9"/>`}).join('')}
function renderZones(full=true){
  const host=$('#zones');
  if(full||!host.children.length){host.innerHTML=Object.entries(ZONES).map(([k,z])=>{
      const [x,y]=P(...z.ll),st=zState(k),terr=st==='territory',nw=!terr&&!!S&&isNew(k),a=z.lab[2],sub=terr?'TERRITORY AHEAD':nw?'NEW':'';
      return `<g class="zone ${st} ${selZ===k?'sel':''}" data-z="${k}" data-x="${x}" data-y="${y}" tabindex="0" role="button" aria-label="${esc(z.n)}, ${esc(z.sub)}. ${STLBL[st]}${nw?', new material':''}.">
      <circle r="22" fill="transparent"/><circle class="halo" r="7"/><circle class="ring" r="12.5"/>
      ${terr?'<circle class="core" r="4"/>':`<circle class="plate" r="9.5"/><g class="glyph" transform="translate(-6.5 -6.5) scale(.13)">${RELIC[z.mark]()}</g>`}
      ${st==='read'?'<circle class="tick" cx="8" cy="-8" r="2.4"/>':''}
      <text x="${z.lab[0]}" y="${z.lab[1]}" text-anchor="${a}">${esc(z.n)}</text>
      ${sub?`<text class="zsub ${nw?'nw':''}" x="${z.lab[0]}" y="${z.lab[1]+13}" text-anchor="${a}">${sub}</text>`:''}</g>`}).join('');
    $('#cities').innerHTML=CITIES.map(([n,la,lo,dx,dy,an])=>{const [x,y]=P(la,lo);return `<g data-x="${x}" data-y="${y}"><circle r="1.6" fill="#5d5b57"/><text class="city" x="${dx}" y="${dy}" text-anchor="${an}">${n.toUpperCase()}</text></g>`}).join('')}
  $$('#zones .zone,#cities g').forEach(g=>g.setAttribute('transform',`translate(${g.dataset.x} ${g.dataset.y}) scale(${s})`));
}
const zoneXY=k=>{const [x,y]=P(...ZONES[k].ll);return[(x-vb.x)/s,(y-vb.y)/s]};

/* off-screen regions get a quiet pointer at the edge of the map, so the far side of the Pacific is discoverable */
function renderEdges(){const el=$('#edges');if(!S){el.innerHTML='';return}const groups={};
  Object.entries(ZONES).forEach(([k,z])=>{const [sx,sy]=zoneXY(k);if(sx>20&&sx<W-20&&sy>20&&sy<H-20)return;(groups[z.region]=groups[z.region]||[]).push([k,sx,sy])});
  el.innerHTML=Object.entries(groups).map(([r,zs])=>{const cx=zs.reduce((a,z)=>a+z[1],0)/zs.length,cy=zs.reduce((a,z)=>a+z[2],0)/zs.length;
    const visibleSame=Object.entries(ZONES).some(([k,z])=>z.region===r&&!zs.some(q=>q[0]===k));if(visibleSame)return'';
    const dx=cx-W/2,dy=cy-H/2,t=Math.min(Math.abs((W/2-70)/(dx||1)),Math.abs((H/2-120)/(dy||1))),x=W/2+dx*t,y=H/2+dy*t,ang=Math.atan2(dy,dx)*180/Math.PI;
    const unread=zs.filter(z=>published(z[0])&&!isRead(z[0])).length;
    return `<button class="edge lbl" data-region="${esc(r)}" style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px"><i style="transform:rotate(${ang.toFixed(0)}deg)">→</i>${esc(zs.length===1?ZONES[zs[0][0]].n:r)}${unread?` <b>${unread} unread</b>`:''}</button>`}).join('')}
function flyRegion(r){const ps=Object.values(ZONES).filter(z=>z.region===r).map(z=>P(...z.ll));if(!ps.length)return;const xs=ps.map(p=>p[0]),ys=ps.map(p=>p[1]);
  flyTo(fitTo(Math.min(...xs)-14,Math.min(...ys)-14,Math.max(...xs)+14,Math.max(...ys)+14,.2),1500)}

/* destination card: identity before you open the story */
function showCard(k,pin){const z=ZONES[k],c=chById(k),st=zState(k),el=$('#zcard');if(!c)return;cardZ=k;cardPin=!!pin;
  const dock=!!pin&&(W<760||matchMedia('(hover: none)').matches);
  el.className='hud'+(pin?' pin':'')+(dock?' dock':'');
  el.innerHTML=st==='territory'
   ?`<div class="zc-im terr"><span class="zc-g">${relicSVG(c.glyph)}</span></div><div class="zc-b"><span class="lbl muted">Territory ahead · ${esc(c.place)}</span><div class="zc-t">${esc(c.t)}</div><p class="zc-l">${esc(c.teaser)}</p><div class="zc-m lbl"><span>${localTime(z)}</span><span>Not yet published</span></div>${pin?`<button class="btn sm" data-enter="${k}">Look ahead</button>`:''}</div>`
   :`<div class="zc-im"><img src="${c.hero}" alt="" ${c.heroPos?`style="object-position:${c.heroPos}"`:''}><span class="zc-g">${relicSVG(z.mark)}</span>${isNew(k)?'<span class="zc-n lbl">New</span>':''}</div><div class="zc-b"><span class="lbl muted">${esc(z.tag)}</span><div class="zc-t">${esc(c.t)}</div><p class="zc-l">${esc(z.line)}</p><div class="zc-m lbl"><span>${localTime(z)}</span>${spark(c.r)}<span class="st-${st}">${STLBL[st]}</span></div>${pin?`<button class="btn sm lime" data-enter="${k}">${st==='opened'?'Continue':'Enter'}</button>`:''}</div>`;
  el.hidden=false;placeCard();requestAnimationFrame(()=>el.classList.add('on'));$('#cZone').textContent=z.n}
function placeCard(){const el=$('#zcard');if(!cardZ||el.hidden||el.classList.contains('dock')){return}const [sx,sy]=zoneXY(cardZ),cw=el.offsetWidth||300,ch=el.offsetHeight||280;
  const right=sx+36+cw<W-16;el.style.left=Math.max(12,right?sx+36:sx-36-cw)+'px';el.style.top=Math.max(84,Math.min(H-ch-70,sy-ch/2))+'px'}
function hideCard(force){if(!cardZ||(cardPin&&!force))return;const el=$('#zcard');el.classList.remove('on');el.hidden=true;cardZ=null;cardPin=false}
svg.addEventListener('pointerover',e=>{if(e.pointerType!=='mouse'||ptrs.size)return;const z=e.target.closest('.zone');if(z&&z.dataset.z!==hovZ){hovZ=z.dataset.z;SND.tick(1760);showCard(hovZ,false)}});
svg.addEventListener('pointerout',e=>{if(e.pointerType!=='mouse')return;const z=e.target.closest('.zone');if(z&&!z.contains(e.relatedTarget)){hovZ=null;hideCard()}});
svg.addEventListener('focusin',e=>{const z=e.target.closest('.zone');if(z&&Date.now()-lastDown>500)showCard(z.dataset.z,true)});
svg.addEventListener('keydown',e=>{const z=e.target.closest('.zone');if(z&&(e.key==='Enter'||e.key===' ')){e.preventDefault();enterZone(z.dataset.z)}});
/* mouse: one click enters. touch: first tap shows the card, the card (or a second tap) enters. */
function pickZone(k,ptype){if(ptype==='mouse'||(cardZ===k&&cardPin))enterZone(k);else{SND.tick(1760);showCard(k,true)}}
const zoneOrder=()=>Object.keys(ZONES).sort((a,b)=>P(...ZONES[a].ll)[0]-P(...ZONES[b].ll)[0]||P(...ZONES[a].ll)[1]-P(...ZONES[b].ll)[1]);
function focusZone(d){const o=zoneOrder(),k=o[(o.indexOf(cardZ||S.zone)+d+o.length)%o.length],p=P(...ZONES[k].ll);
  const inView=p[0]>vb.x+vb.w*.15&&p[0]<vb.x+vb.w*.85&&p[1]>vb.y+vb.h*.15&&p[1]<vb.y+vb.h*.85;
  const go=()=>{const g=$(`.zone[data-z="${k}"]`);lastDown=Date.now();if(g)g.focus({preventScroll:true});showCard(k,true)};
  if(inView)go();else{hideCard(true);flyTo({x:p[0]-vb.w/2,y:p[1]-vb.h/2,w:vb.w,h:vb.h},700).then(go)}}

/* you, and the path you have taken */
function renderMe(){if(!S)return;const p=P(...ZONES[S.zone].ll);$('#meG').innerHTML=`<g id="me" transform="translate(${p[0]} ${p[1]}) scale(${s})"><circle r="17" fill="none" stroke="#BEFF00" stroke-width="1.1"/><circle class="me-p" r="17" fill="none" stroke="#BEFF00"/></g>`}
function renderTrail(){if(!S)return;const t=S.j.trail.filter(k=>ZONES[k]),seen=new Set();let d='';
  for(let i=1;i<t.length;i++){const key=[t[i-1],t[i]].sort().join('>');if(t[i-1]===t[i]||seen.has(key))continue;seen.add(key);const a=P(...ZONES[t[i-1]].ll),b=P(...ZONES[t[i]].ll),dist=Math.hypot(b[0]-a[0],b[1]-a[1]),lift=Math.min(90,dist*.22);d+=`M${a[0]} ${a[1]}Q${(a[0]+b[0])/2} ${(a[1]+b[1])/2-lift} ${b[0]} ${b[1]}`}
  $('#routes').innerHTML=d?`<path class="route" d="${d}"/>`:''}
function moveTo(k){const t=S.j.trail;if(S.zone!==k||!t.length){S.zone=k;if(t[t.length-1]!==k)t.push(k);if(t.length>60)t.shift();save();renderTrail();publishPresence()}renderMe()}

/* map → story. The camera closes in, then the chapter opens out of the point you chose. */
function setIris(px,py){const b=$('#book');b.style.setProperty('--ix',px+'px');b.style.setProperty('--iy',py+'px')}
function enterZone(k){if(entering||!S||!ZONES[k])return;entering=true;hideCard(true);hint('');const p=P(...ZONES[k].ll);SND.tick(1480);Pilot.first('zone_first',k);moveTo(k);
  const done=()=>{if(!entering)return;entering=false;setIris(...zoneXY(k));openBook(k,null)};
  flyTo(fitTo(p[0]-10,p[1]-10,p[0]+10,p[1]+10,.2),750).then(done);setTimeout(done,1200)}

/* ============ CATALOG ============ */
const price=id=>ITEMS[id].r*60;
function prodImg(id){const it=ITEMS[id];if(it.ph)return `<div class="pimg"><img src="${it.ph[0]}" alt="" style="object-position:${it.ph[1]};transform:scale(1.9);transform-origin:${it.ph[1]}"></div>`;
  if(it.look){const L=LOOKS[it.look];return `<div class="pimg"><img src="${L.img}" alt="" style="object-position:${it.x}% ${it.y}%;transform:scale(2.6);transform-origin:${it.x}% ${it.y}%"></div>`}
  return `<div class="pimg"><div class="gl">${relicSVG(CHARMGLYPH[id]??3)}</div></div>`}
function pxAvatar(look,eq,vb='0 0 240 520',w,h,cls=''){return `<div class="fig2 ${cls}" style="height:100%">${avatarSVG(look,eq,vb)}</div>`}
function pxItem(id){return prodImg(id)}
function pxPhoto(src){return `<div class="cyc"></div>`}

/* ============ GUIDEBOOK ============
   A chapter is a sequence of spreads. Features choose their own sequence and opener in
   content/stories.js (`art`), so no two read the same way. */
CHAPTERS.forEach((c,i)=>c.n=pad(i));
const kindOf=k=>k.replace(/\d+$/,'');
function spreadsOf(c){
  if(c.kind==='feature'){
    if(c.art&&c.art.order)return c.art.order.filter(k=>k!=='kit'||LOOKS[c.id]);
    const a=['opener'];if(c.edit)a.push('film');a.push('story');if(c.gallery)a.push('gallery');if(c.quote)a.push('athlete');if(LOOKS[c.id])a.push('kit');a.push('standard','quests','end');return a}
  if(c.kind==='hq')return['opener','manifesto','how','quests'];
  if(c.kind==='fog')return['fog'];
  if(c.kind==='kit')return['linq','kitidx'];
  if(c.kind==='skills')return['skills'];
  if(c.kind==='relics')return['relics'];
  if(c.kind==='cover')return['cover','legend'];
  return['index']}
const SPN={linq:'Made by LINQ',skills:'Skills & tokens',film:'The film',opener:'Opener',story:'The story',essay:'The essay',compare:'The edit',plate:'Plate',sequence:'Photo essay',gallery:'Gallery',fieldguide:'Field guide',athlete:'In their words',kit:'The look',standard:'The standard',quests:'In the field',end:'End of chapter',manifesto:'Manifesto',how:'How quests work',fog:'Territory ahead',kitidx:'All gear',relics:'Collection',cover:'Cover',legend:'How to read',index:'Contents'};
const spName=(c,k)=>{const b=kindOf(k);return (b==='gallery'||b==='sequence')&&c.galleryT?c.galleryT:b==='plate'&&c.plates?(c.plates[+k.slice(5)]||{}).lab||'Plate':SPN[b]};
let B={ch:0,sp:0,item:null,kitF:'all',fg:0};
function coordStr(id){const z=ZONES[id];if(!z)return'';return `${z.ll[0].toFixed(4)}° N · ${Math.abs(z.ll[1]).toFixed(4)}° ${z.ll[1]<0?'W':'E'}`}
function reel(r){return `<div class="reel"><video src="${r[0]}" autoplay muted loop playsinline preload="metadata"></video><div class="vfc"></div><div class="vfl lbl"><span class="rec"><i></i>${esc(r[1])}</span><span>LINQ</span></div></div>`}
function folio(){let p=8;for(let i=0;i<B.ch;i++)p+=spreadsOf(CHAPTERS[i]).length*2;return p+B.sp*2}
function vf(src,lab,pos){return `<div class="vf fill">${src?`<img src="${src}" alt="" ${pos?`style="object-position:${pos}"`:''}>`:''}<div class="vfc"></div>${lab?`<div class="vfl lbl"><span>${lab[0]||''}</span><span>${lab[1]||''}</span></div>`:''}</div>`}
const nextUnread=id=>{const f=CHAPTERS.filter(c=>c.kind==='feature'),i=f.findIndex(c=>c.id===id);for(let n=1;n<=f.length;n++){const c=f[(i+n)%f.length];if(c.id!==id&&!isRead(c.id))return c}return null};

/* quests are optional and self-reported. Nothing here claims the field work was verified. */
function questCard(q){const acc=S.acc[q.id],done=S.done.includes(q.id),bonus=CLASSES[S.cls].bonus.includes(q.cat),xp=Math.round(q.xp*(bonus?1.25:1));
  const steps=acc&&!done?`<ul class="obj">${q.steps.map((st,i)=>`<li><label><input type="checkbox" data-obj="${q.id}" data-i="${i}" ${acc.steps[i]?'checked':''}><span>${esc(st)}</span></label></li>`).join('')}</ul><p class="note">Tick each one once you’ve done it out there. <button class="lnk" data-drop="${q.id}">Put it back</button></p>`:'';
  const act=done?`<span class="lbl lime">Logged · relic kept</span>`:acc?'':`<button class="btn sm" data-accept="${q.id}">Take it on</button>`;
  return `<div class="qc ${done?'dn':''}"><div class="rg">${relicSVG(q.relic)}</div><div><div class="top lbl muted"><span>${q.cat}${bonus?' · your affinity':''}</span>${spark(q.r)}</div><div class="disp">${esc(q.t)}</div><p>${esc(q.d)}</p>
   <div class="rw"><span><b>+${xp}</b> XP</span>${q.loot.length?`<span>Kit · <b>${q.loot.map(l=>esc(ITEMS[l].t)).join(', ')}</b></span>`:'<span>Relic only</span>'}${skStr(q)?`<span>${skStr(q)}</span>`:''}</div>${steps}${act}</div></div>`}
function gearList(items,sel){return `<div class="glist">${items.map((id,i)=>{const it=ITEMS[id],own=S.inv.includes(id),q=dropsFrom(id);return `<button class="gi ${sel===id?'on':''}" data-gear="${id}"><span class="n">${String(i+1).padStart(2,'0')}</span><span class="t">${esc(it.t)}</span><span class="k">${it.slot}</span><div class="d"><p>${esc(it.d)}</p><div class="gm"><span>${esc(it.f)}</span><span>${RAR[it.r]}</span><span>${Object.entries(it.st).map(([k,v])=>'+'+v+' '+k).join(' ')}</span><span>${own?'<b class="lime">Collected</b>':q?'Drops from <b>'+esc(q.t)+'</b>':''}</span></div>${own?`<div style="margin-top:12px"><button class="btn sm" data-equip="${id}">${S.equip[it.slot]===id?'Unequip':'Equip'}</button></div>`:''}</div></button>`}).join('')}</div>`}
function lookFig(lookId,sel){const L=LOOKS[lookId];const items=Object.keys(ITEMS).filter(k=>ITEMS[k].look===lookId);
  return `<div class="look fill" style="${lookId==='silverfalls'?'':'max-height:100%'}"><img src="${L.img}" alt="">${items.map((id,i)=>{const it=ITEMS[id];return `<button class="hs ${sel===id?'on':''}" data-gear="${id}" style="left:${it.x}%;top:${it.y}%" aria-label="${esc(it.t)}"><i></i><span class="bx"><b>${String(i+1).padStart(2,'0')} · ${it.slot}</b></span></button>`}).join('')}<div class="vfc" style="position:absolute;inset:10px;pointer-events:none"></div></div>`}

function outtakesBlock(id,unlocked){const o=OUTTAKES[id];if(!o)return'';
  if(!unlocked)return `<div class="end-b"><span class="lbl muted">Outtakes</span><p class="note">Kept back for explorers who read the whole chapter.</p></div>`;
  return `<div class="end-b"><span class="lbl lime">Outtakes · ${esc(o.t)}</span>${o.video?`<div class="filmbox h ot-v"><video src="${o.video[0]}" muted loop playsinline controls preload="metadata"></video></div><p class="note">${esc(o.video[1])}</p>`:''}${o.items?`<div class="ot">${o.items.map(([src,cap])=>`<figure><img src="${src}" alt="${esc(cap)}" loading="lazy" data-zoom><figcaption>${esc(cap)}</figcaption></figure>`).join('')}</div>`:''}</div>`}
function renderSpread(c,kind){
  const z=ZONES[c.id],bk=kindOf(kind);
  switch(bk){
  case 'cover':return `<div class="col mid"><span class="lbl muted">${ISSUE.label} · ${esc(ISSUE.region)}</span><div class="h1" style="font-size:clamp(70px,9vw,150px);letter-spacing:.06em">QUEST<br>GUIDE</div><p class="verdict">A selection of world-class things to do, tested in the field. Not places to see: things to live. Each entry is rated, mapped, and ends with a quest.</p><div class="acts"><button class="btn lime" data-go="index">Open the contents</button><button class="btn" data-next>How to read the guide</button></div></div>${vf('img/cover-film.jpg',[ISSUE.label,ISSUE.season])}`;
  case 'legend':return `<div class="col mid"><span class="lbl muted">How to read the guide</span><div class="h2">The rating</div><div class="legend"><div>${spark(1)}<p>Remarkable. <i>Worth the day.</i></p></div><div>${spark(2)}<p>Excellent. <i>Worth the weekend.</i></p></div><div>${spark(3)}<p>Exceptional. <i>Worth the journey.</i></p></div></div><p class="note" style="margin-top:16px">Ratings are awarded by the Quest editors on the experience itself: difficulty, beauty, craft, and how it changes you.</p></div>
    <div class="col mid"><span class="lbl muted">Using it in the world</span><div class="h2">Read, look, go</div><ul class="check"><li>Every mark on the map is a chapter. All of them are open.</li><li>Read to the end. Some chapters keep something back for those who do.</li><li>Look closely at the photographs. Not everything is captioned.</li><li>Quests happen in the real world and are optional. Log them on your word.</li></ul><div class="acts"><button class="btn lime" data-go="index">Open the contents</button></div></div>`;
  case 'index':{const feats=CHAPTERS.filter(ch=>ch.kind==='feature'||ch.kind==='hq'),fog=CHAPTERS.filter(ch=>ch.kind==='fog'),ref=CHAPTERS.filter(ch=>['kit','skills','relics'].includes(ch.kind));
    const prog=ch=>{const r=S.j.read[ch.id],n=spreadsOf(ch).length,st=zState(ch.id);return `<span class="pg"><i style="width:${r?(r.end?100:Math.min(95,r.sp.length/n*100)):0}%"></i></span><span class="lbl ${st==='read'?'lime':'muted'}">${isNew(ch.id)?'New · ':''}${STLBL[st]}</span>`};
    return `<div class="col" style="grid-column:1/-1"><div class="ix-h"><div><span class="lbl muted">${ISSUE.label} · Contents</span><div class="h1" style="font-size:clamp(48px,6vw,96px);margin:8px 0 0">The Guide</div></div><p class="note" style="max-width:360px">${feats.length} destinations, rated and mapped. Every one is open. The issue grows when there is something worth adding.</p></div>
    <span class="lbl ix-s">Destinations</span><div class="ix-grid">${feats.map(ch=>`<button class="ix-card" data-go="${ch.id}"><div class="im"><img src="${ch.hero}" alt="" loading="lazy" ${ch.heroPos?`style="object-position:${ch.heroPos}"`:''}><span class="no">${ch.n}</span></div><div class="tx"><span class="lbl muted">${esc(ZONES[ch.id].tag||ch.place)}</span><div class="t">${esc(ch.t)}</div><div class="rw">${spark(ch.r)}${prog(ch)}</div></div></button>`).join('')}</div>
    <div class="ix-two"><div><span class="lbl ix-s">Territory ahead</span>${fog.map(ch=>`<button class="ix-row lk" data-go="${ch.id}"><span class="lbl muted">${ch.n}</span><span class="t">${esc(ch.t)}</span><span class="lbl muted">${esc(ch.place)} · not yet published</span></button>`).join('')}
      <span class="lbl ix-s" style="margin-top:34px">Latest additions</span>${[...UPDATES].sort((a,b)=>a.date<b.date?1:-1).slice(0,6).map(u=>`<button class="ix-row" ${u.go?`data-go="${u.go[0]}" data-sp="${u.go[1]||''}"`:'disabled'}><span class="lbl ${u.date>S.seenUpdates?'lime':'muted'}">${esc(u.kind)}</span><span class="t">${esc(u.t)}</span><span class="lbl muted">${fmtDate(u.date)}</span></button>`).join('')}</div>
    <div><span class="lbl ix-s">Reference</span>${ref.map(ch=>`<button class="ix-row" data-go="${ch.id}"><span class="lbl muted">${ch.n}</span><span class="t">${esc(ch.t)}</span><span class="lbl muted">${ch.kind==='kit'?'Garments, gear, LINQ':ch.kind==='skills'?'XP, skills, tokens':'Your collection'}</span></button>`).join('')}</div></div></div>`}
  case 'opener':{const a=(c.art&&c.art.opener)||'bleed',pos=c.heroPos?`style="object-position:${c.heroPos}"`:'';
    const media=a==='film'&&c.art.bg&&!RM?`<video src="${c.art.bg}" poster="${c.hero}" autoplay muted loop playsinline preload="metadata"></video>`:`<img src="${c.hero}" alt="" ${pos}>`;
    const tl=`<div class="tl lbl"><span>${coordStr(c.id)} · ${esc(z.el)}</span><span>${localTime(z)}</span></div>`;
    const num=`<span class="ch-num">${c.n} — ${esc(c.place)}</span>`,rate=c.r?`<div class="rate">${spark(c.r)} <span class="lbl">${['','Worth the day','Worth the weekend','Worth the journey'][c.r]}</span></div>`:'';
    const meta=`<dl class="meta">${c.who?`<dt>Featuring</dt><dd>${esc(c.who)}</dd>`:''}<dt>Getting there</dt><dd>${esc(TRAVEL[c.id])}</dd>${c.film?`<dt>Film</dt><dd><a href="${c.film[0]}" target="_blank" rel="noopener">${esc(c.film[1])} ↗</a></dd>`:''}</dl>`;
    const go=`<div class="acts"><button class="btn lime" data-next>${c.kind==='hq'?'Read on':'Begin'}</button></div>`;
    if(a==='center')return `<div class="bl center">${media}${tl}<div class="ov1">${num}<div class="h1">${esc(c.t)}</div>${rate}<p class="verdict">${esc(c.verdict)}</p>${go}</div></div>`;
    if(a==='split')return `<div class="bl split"><div class="sp-t">${tl}<div>${num}<div class="h1">${esc(c.t)}</div>${rate}<p class="verdict">${esc(c.verdict)}</p>${meta}${go}</div></div><div class="sp-i">${media}</div></div>`;
    if(a==='quiet')return `<div class="bl quiet">${tl}<div class="q-t">${num}<p class="q-v">${esc(c.verdict)}</p><div class="h1">${esc(c.t)}</div>${rate}${meta}${go}</div><figure class="q-i">${media}<figcaption class="capt2"><span>${esc(c.place)}</span><span>${esc(z.el)}</span></figcaption></figure></div>`;
    return `<div class="bl ${a}">${media}${tl}<div class="ov"><div>${num}<div class="h1">${esc(c.t)}</div>${rate}${a==='film'&&c.art.bgCap?`<span class="lbl bgcap"><i></i>${esc(c.art.bgCap)}</span>`:''}</div>
      <div><span class="lbl" style="color:#bdbab3">Our verdict</span><p class="verdict" style="margin-top:8px">${esc(c.verdict)}</p>${meta}${go}</div></div></div>`}
  case 'film':{const e=c.edit;const v=e[4]==='v';return `<div class="col mid" style="align-items:${v?'center':'stretch'}"><div class="filmbox ${v?'v':'h'}"><video id="filmV" src="${e[0]}" autoplay muted loop playsinline preload="metadata"></video><div class="vfc"></div><div class="vfl lbl"><span class="rec"><i></i>REC · ${esc(e[1])}</span><span>${e[3]}</span></div><button class="sndbtn lbl" id="filmSnd" aria-pressed="false">Sound off · tap for sound</button></div></div>
    <div class="col mid"><span class="ch-num">${c.n} — The film</span><div class="h1" style="font-size:clamp(40px,4.4vw,68px)">${esc(e[1])}</div><p class="verdict">${esc(e[2])}</p><dl class="meta"><dt>Runtime</dt><dd>${e[3]}</dd><dt>Footage</dt><dd>From the field, unscripted</dd>${c.film?`<dt>Long form</dt><dd><a href="${c.film[0]}" target="_blank" rel="noopener">${esc(c.film[1])} ↗</a></dd>`:''}</dl><p class="note" style="margin-top:14px">Turning on the film’s sound pauses the soundscape. It comes back when you turn the page.</p></div>`}
  case 'story':{const right=c.interactive==='kp'?`<div class="col"><div class="vf" style="flex:1;min-height:220px"><img src="${c.imgs[0]}" alt="" style="object-position:50% 70%" data-zoom><div class="vfc"></div></div><div class="kp" style="margin-top:20px"><span class="lbl muted">Will you see it from Oregon?</span><div style="display:flex;align-items:end;gap:20px;margin-top:10px"><div class="kval" id="kval">Kp 5</div></div><input type="range" min="1" max="9" value="5" id="kpr" aria-label="Kp index"><div class="verdict" id="kverdict" aria-live="polite"></div></div></div>`
      :c.reel?`<div class="col">${reel(c.reel)}<div class="capt"><b>Fig. ${c.n}.1</b>${esc(c.reel[1])}</div></div>`
      :`<div class="stack2"><img src="${c.imgs[0]}" alt="" loading="lazy" data-zoom><span class="capt2"><span>Fig. ${c.n}.1</span><span>${esc(c.place)}</span></span><img src="${c.imgs[1]}" alt="" loading="lazy" data-zoom><span class="capt2"><span>Fig. ${c.n}.2</span></span></div>`;
    return `<div class="col mid"><span class="ch-num">${c.n} — The story</span><div class="h2">${esc(c.t)}</div><p class="kicker">${esc(c.place)}. Words by Quest Editors.</p><div class="prose two">${c.story.map((p,i)=>`<p class="${i?'':'drop'}">${esc(p)}</p>`).join('')}</div>${c.reel2?`<div class="story-row">${reel(c.reel2)}<div class="vf fill"><img src="${c.imgs[0]}" alt="" loading="lazy" data-zoom><div class="vfc"></div><div class="vfl lbl"><span>Fig. ${c.n}.2</span><span></span></div></div></div>`:''}</div>${right}`}
  case 'essay':return `<article class="essay"><span class="ch-num">${c.n} — ${esc(c.place)}</span><div class="h2">${esc(c.t)}</div><p class="kicker">Words by Quest Editors.</p>${c.essayImg?`<figure class="es-fig"><img src="${c.essayImg}" alt="" loading="lazy" data-zoom><figcaption class="capt2"><span>${esc(c.place)}</span></figcaption></figure>`:''}<div class="prose es">${c.story.map((p,i)=>`<p class="${i?'':'drop'}">${esc(p)}</p>`).join('')}</div></article>`;
  case 'compare':return `<div class="flip fill" id="flip" tabindex="0" role="slider" aria-label="Compare the raw still with the Quest treatment" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"><img src="img/sf-cafe.jpg" alt="Raw still"><img class="top" src="img/sf-ghost.jpg" alt="Edited still"><span class="bar"></span><span class="lbl fl-a">Quest</span><span class="lbl fl-b">Raw</span></div><div class="col mid"><span class="ch-num">${c.n} — The edit</span><div class="h2">One frame, twice</div><p class="verdict">The same still, before and after the Quest treatment.</p><p class="note">Drag across the frame, or use the arrow keys while it has focus.</p></div>`;
  case 'plate':{const p=c.plates[+kind.slice(5)||0];return `<figure class="plate"><img src="${p.img}" alt="${esc(p.lab)}" data-zoom><figcaption><span class="ch-num">${c.n} — ${esc(p.lab)}</span><p>${esc(p.cap)}</p><span class="lbl muted">${esc(c.place)}</span></figcaption></figure>`}
  case 'sequence':return `<div class="seq-h"><div><span class="ch-num">${c.n} — Photo essay</span><div class="h2">${esc(c.galleryT||'')}</div></div><p class="note">${esc(c.galleryN||'')}<br><span class="lbl muted">${c.gallery.length} frames · scroll sideways</span></p></div><div class="seq" tabindex="0" aria-label="${esc(c.galleryT||'Photo essay')}">${c.gallery.map((g,i)=>`<figure><img src="${g}" alt="" loading="lazy" data-zoom><figcaption>${pad(i+1)} / ${pad(c.gallery.length)}</figcaption></figure>`).join('')}</div>`;
  case 'gallery':return `<div class="col" style="grid-column:1/-1"><span class="ch-num">${c.n} — ${esc(c.galleryT||'Gallery')}</span><div style="display:flex;justify-content:space-between;align-items:end;gap:20px;flex-wrap:wrap"><div class="h2">${esc(c.galleryH||'')}</div><p class="note" style="max-width:340px">${esc(c.galleryN||'')}</p></div><div class="mason">${c.gallery.map((g,i)=>`<figure><img src="${g}" alt="" loading="lazy" data-zoom><figcaption>${pad(i+1)}</figcaption></figure>`).join('')}</div></div>`;
  case 'fieldguide':return `<div class="col mid"><span class="ch-num">${c.n} — Field guide</span><div class="h2">${esc((c.art&&c.art.fgTitle)||'Doing it properly')}</div><div class="glist fg">${c.facts.map((f,i)=>`<button class="gi ${B.fg===i?'on':''}" data-fg="${i}" aria-expanded="${B.fg===i}"><span class="n">${pad(i+1)}</span><span class="t">${esc(f[0])}</span><span class="k">${B.fg===i?'Open':''}</span><div class="d"><p>${esc(f[1])}</p></div></button>`).join('')}</div>${c.srcs&&c.srcs.length?`<div class="srcs">Sources: ${c.srcs.map(s=>`<a href="${s[1]}" target="_blank" rel="noopener">${esc(s[0])}</a>`).join(' · ')}. Checked November 2026. Confirm before you go.</div>`:''}</div><div class="col mid"><span class="lbl muted">The Quest standard</span><div class="h2">World-class means</div><ul class="check">${c.standard.map(s=>`<li>${esc(s)}</li>`).join('')}</ul></div>`;
  case 'athlete':return `<figure class="nat"><img src="${c.portrait}" alt="" data-zoom><figcaption><span>${esc(c.portraitCap||'')}</span><span>${esc(c.place||'')}</span></figcaption></figure><div class="col mid"><span class="ch-num">${c.n} — In their words</span><p class="quote">“${esc(c.quote)}”</p><div class="cite"><span class="lbl">— ${esc(c.by)}</span></div><div class="traits">${c.traits.map(t=>`<div class="trait"><span class="lbl muted">${t[1]}</span><div class="disp">${t[0]}</div><p>${t[2]}</p></div>`).join('')}</div></div>`;
  case 'quests':{const qs=allQ().filter(q=>q.z===c.id);return `<div class="col" style="grid-column:1/-1"><div class="qhd"><div><span class="ch-num">${c.n} — In the field</span><div class="h2">${esc(ZONES[c.id].n)}, for real</div></div><p class="note">Optional. These happen out in the world, not on this page. QUEST takes your word for it and has no way to verify it, so what you log here is a personal record, nothing more.</p></div><div class="qgrid">${qs.map(questCard).join('')}</div></div>`}
  case 'fog':return `<div class="vf fill" style="background:#141414"><div class="gl">${relicSVG(c.glyph)}</div><div class="vfc"></div><div class="vfl lbl"><span>${coordStr(c.id)}</span><span>Territory ahead</span></div></div><div class="col mid"><span class="ch-num">${c.n} — ${esc(c.place)}</span><div class="h1">${esc(c.t)}</div><p class="verdict">${esc(c.teaser)}</p><dl class="meta"><dt>Status</dt><dd>Not yet published. No date is promised. It will appear on the map, marked new, when it is ready.</dd><dt>Where</dt><dd>${esc(TRAVEL[c.id])}</dd></dl><div class="acts"><button class="btn sm" data-close>Back to the world</button></div></div>`;
  case 'end':{const ds=DETAILS.filter(d=>d.ch===c.id),found=ds.filter(d=>S.j.found.includes(d.id)).length,th=THREADS.filter(t=>t.a===c.id||t.b===c.id),r=S.j.read[c.id]||{},nxt=nextUnread(c.id);
    return `<div class="col mid"><span class="ch-num">${c.n} — End of chapter</span><div class="h1">${esc(c.t)}</div>
     <dl class="meta">${c.who?`<dt>Featuring</dt><dd>${esc(c.who)}</dd>`:''}<dt>Words</dt><dd>Quest Editors</dd>${c.edit?`<dt>Film</dt><dd>${esc(c.edit[1])}. ${esc(c.edit[2])}</dd>`:''}${c.film?`<dt>Long form</dt><dd><a href="${c.film[0]}" target="_blank" rel="noopener">${esc(c.film[1])} ↗</a></dd>`:''}<dt>Produced by</dt><dd>LINQ</dd><dt>Where</dt><dd>${esc(c.place)} · ${coordStr(c.id)}</dd></dl>
     ${ds.length?`<div class="fn"><span class="lbl muted">Field notes in this chapter</span><span class="fn-d">${ds.map(d=>`<i class="${S.j.found.includes(d.id)?'on':''}"></i>`).join('')}</span><span class="lbl">${found} of ${ds.length}</span></div><p class="note">${found<ds.length?'Something in these photographs has gone unnoticed. Look closer.':'Nothing left unnoticed here. It’s all in your journal.'}</p>`:''}
     <div class="acts"><button class="btn sm" data-share>Share this chapter</button><button class="btn sm" data-close>Back to the world</button></div></div>
     <div class="col end-r">${outtakesBlock(c.id,!!r.end)}
      ${th.length?`<div class="end-b"><span class="lbl muted">Threads</span>${th.map(t=>{const o=chById(t.a===c.id?t.b:t.a);return `<button class="thr" data-thread="${t.id}" data-to="${o.id}"><img src="${o.hero}" alt="" loading="lazy"><span><span class="lbl ${S.j.threads.includes(t.id)?'lime':'muted'}">${esc(o.t)}${S.j.threads.includes(t.id)?' · followed':''}</span><b>${esc(t.t)}</b><i>${esc(t.d)}</i></span></button>`}).join('')}</div>`:''}
      ${nxt?`<div class="end-b"><span class="lbl muted">Unread</span><button class="thr" data-go="${nxt.id}"><img src="${nxt.hero}" alt="" loading="lazy"><span><span class="lbl muted">${esc(nxt.place)}</span><b>${esc(nxt.t)}</b></span></button></div>`:''}</div>`}
  case 'linq':return `<div class="col mid" style="align-items:center"><div class="filmbox v"><video src="vid/footwear-reel.mp4" autoplay muted loop playsinline></video><div class="vfc"></div><div class="vfl lbl"><span class="rec"><i></i>LINQ workshop</span><span>0:14</span></div></div></div>
    <div class="col mid"><span class="ch-num">${c.n} — Made by LINQ</span><div class="h1" style="font-size:clamp(40px,4.4vw,68px)">The gear goes where the quest goes</div><p class="verdict">Quest is about going out into the world. LINQ makes what you wear when you get there: footwear molded and finished by hand, tested on the Bund, in the creek at Trout Lake and on the coast.</p><div class="stack2" style="flex-direction:row"><img src="img/fw-hands.jpg" alt="" style="max-height:26vh;width:auto"><img src="img/fw-rows.jpg" alt="" style="max-height:26vh;width:auto"></div><div class="acts"><button class="btn lime" data-next>Open the catalog</button></div></div>`;
  case 'skills':{const sk=S.skills||{};return `<div class="col mid"><span class="ch-num">${c.n} — Skills & Tokens</span><div class="h1" style="font-size:clamp(40px,4.4vw,68px)">Life quests become real skills</div><p class="verdict">Every quest teaches something you keep: how to read a tide, cook on coals, shoot the night sky, find your way through a city without a map. Skills earn XP. XP earns Quest Tokens. Tokens unlock gear in game now, and in life at launch.</p>
    <div class="flow">${['Go','Learn','Level','Earn','Wear'].map((s,i)=>`<div><b>${String(i+1).padStart(2,'0')}</b><span>${s}</span></div>`).join('<i></i>')}</div>
    <dl class="meta" style="margin-top:22px"><dt>Wallet</dt><dd><span class="lime">${S.qt||0} QT</span> · 1 QT per 5 XP</dd><dt>Spend in game</dt><dd>Unlock any piece in the catalog for your casting board</dd><dt>Spend in life</dt><dd>Partner and LINQ redemption opens at launch</dd></dl></div>
    <div class="col mid"><span class="lbl muted">Your skills</span><div class="skl">${Object.entries(SKILLS).map(([k,n])=>`<div><span>${n}</span><span class="bar"><i style="width:${Math.min(100,(sk[k]||0)*10)}%"></i></span><b>${sk[k]||0}</b></div>`).join('')}</div><p class="note" style="margin-top:14px">Each quest lists the skills it trains. Ten points in a skill fills its bar.</p></div>`}
  case 'kit':{const items=Object.keys(ITEMS).filter(k=>ITEMS[k].look===c.id);const sel=B.item&&items.includes(B.item)?B.item:items[0];
    return `<div class="col">${lookFig(c.id,sel)}</div><div class="col mid"><span class="ch-num">${c.n} — The look</span><div class="h2">What was worn, piece by piece</div><p class="note" style="margin-bottom:16px">Tap a point on the image or an item below. Each piece drops from a quest in this chapter and goes onto your casting board.</p>${gearList(items,sel)}<div class="acts"><button class="btn sm" data-go="kit">All gear in the guide</button></div></div>`}
  case 'standard':return `<div class="col mid"><span class="ch-num">${c.n} — The standard</span><div class="h2">Doing it properly</div><div class="std">${c.facts.map(f=>`<div><span class="lbl muted">${f[0]}</span><p style="margin-top:8px">${esc(f[1])}</p></div>`).join('')}</div>${c.srcs&&c.srcs.length?`<div class="srcs">Sources: ${c.srcs.map(s=>`<a href="${s[1]}" target="_blank" rel="noopener">${esc(s[0])}</a>`).join(' · ')}. Checked November 2026. Confirm before you go.</div>`:''}</div><div class="col mid"><span class="lbl muted">The Quest standard</span><div class="h2">World-class means</div><ul class="check">${c.standard.map(s=>`<li>${esc(s)}</li>`).join('')}</ul></div>`;
  case 'manifesto':return `<div class="col mid"><span class="ch-num">${c.n} — Manifesto</span><div class="h2">Six things we believe</div><div class="mani">${[['Vision & adventure','Luxury redefined as purpose, adventure and innovation.'],['The uncharted','Into the processes and people behind the designs, meals and journeys.'],['Storytellers & architects','Fashion, design, athletics, adventure and food, curated to make you act.'],['Physical & digital','A timeless object on your shelf, brought to life by AR and RFID quests.'],['The compass','From the Pacific Northwest to Catalina and Tokyo: your map and your toolkit.'],['Here to be lived','Not just a magazine. A call to action.']].map((m,i)=>`<div><span class="lbl muted">0${i+1}</span><h4>${m[0]}</h4><p>${m[1]}</p></div>`).join('')}</div></div>${vf('img/bow-dusk.jpg',['Create · Explore · Evolve',''])}`;
  case 'how':return `<div class="col mid"><span class="ch-num">${c.n} — How quests work</span><div class="h2">The guidebook, switched on</div><div class="steps4">${[['Select','Choose a quest in the app or the printed guide.'],['Complete','Do it in the real world. Tap the RFID points and log your objectives.'],['Share','Post the journey with #LINQQuest.'],['Earn','Relics, early access, gear upgrades and status.']].map((s,i)=>`<div><span class="n">0${i+1}</span><h4>${s[0]}</h4><p>${s[1]}</p></div>`).join('')}</div></div><div class="col mid"><span class="lbl muted">What you earn</span><ul class="check"><li>Early access to new gear and limited editions</li><li>Discounts on your next drop</li><li>Badges and status in the community</li><li>Custom 3D-printed gear upgrades</li><li>Event invitations</li><li>Old gear recycled into upgrades</li></ul></div>`;
  case 'kitidx':{const groups={all:'All',linq:'LINQ',shanghai:'Shanghai',troutlake:'Trout Lake',coast:'Oregon Coast',catalina:'Catalina',trillium:'Trillium',silverfalls:'Silver Falls',eugene:'Autzen',charm:'Charms'};
    const ids=Object.keys(ITEMS).filter(k=>B.kitF==='all'||(B.kitF==='charm'?ITEMS[k].slot==='Charm':B.kitF==='linq'?ITEMS[k].brand==='LINQ':ITEMS[k].look===B.kitF));const sel=B.item&&ITEMS[B.item]?B.item:ids[0];const it=ITEMS[sel];const q=dropsFrom(sel);const own=S.inv.includes(sel);
    return `<div class="col"><span class="ch-num">${c.n} — The Catalog</span><div class="h2">Every piece, sourced from the field</div><p class="note" style="margin:-4px 0 12px">Wallet <b style="color:var(--lime)">${S.qt||0} QT</b> · earn tokens on quests, spend them here in game, and in life at launch.</p><div class="kfil">${Object.entries(groups).map(([k,v])=>`<button data-kitf="${k}" class="${B.kitF===k?'on':''}">${v}</button>`).join('')}</div><div class="kgrid">${ids.map(id=>`<button class="kc ${id===sel?'on':''}" data-kit="${id}"><div class="ii">${prodImg(id)}</div><div class="ib"><span class="lbl muted">${ITEMS[id].brand?ITEMS[id].brand+' · ':''}${ITEMS[id].slot}</span><div class="disp">${esc(ITEMS[id].t)}</div><span class="lbl ${S.inv.includes(id)?'lime':'muted'}">${S.inv.includes(id)?'Owned':price(id)+' QT'}</span></div></button>`).join('')}</div></div>
     <div class="col">${it.look?lookFig(it.look,sel):it.ph?`<figure class="nat"><img src="${it.ph[0]}" alt=""></figure>`:`<div class="vf fill" style="background:#141414"><div class="gl">${relicSVG(CHARMGLYPH[sel])}</div><div class="vfc"></div></div>`}<div style="padding-top:18px"><span class="lbl muted">${it.slot} · ${RAR[it.r]}${it.look?' · '+esc(ZONES[it.look].n):''}</span><div class="h2" style="font-size:30px">${esc(it.t)}</div><p class="prose" style="font-size:17px;line-height:1.55;color:#dcd9d2">${esc(it.d)}</p><dl class="meta" style="margin-top:14px"><dt>Spec</dt><dd>${esc(it.f)}</dd><dt>Stats</dt><dd>${Object.entries(it.st).map(([k,v])=>'+'+v+' '+STATN[k]).join(', ')}</dd><dt>Drops from</dt><dd>${q?esc(q.t)+' · '+(q.z?esc(ZONES[q.z].n):'Hidden'):'—'}</dd><dt>Maker</dt><dd>${it.brand||it.maker||'Credit to be confirmed'}</dd><dt>In game</dt><dd>${own?'<span class="lime">Owned</span>':price(sel)+' QT · or earn it on the quest'}</dd><dt>In life</dt><dd>${it.shop?`<a href="${it.shop}" target="_blank" rel="noopener">Shop ↗</a>`:it.life==='shop'?'LINQ shop · redemption opens at launch':'Sourcing · shop or archive link to come'}</dd></dl><div class="acts">${own?`<button class="btn lime sm" data-equip="${sel}">${S.equip[it.slot]===sel?'Unequip':'Wear it'}</button>`:`<button class="btn lime sm" data-buy="${sel}" ${(S.qt||0)<price(sel)?'disabled':''}>Unlock · ${price(sel)} QT</button>`}<button class="btn sm" data-life="${sel}">Redeem in life</button>${it.look?`<button class="btn sm" data-go="${it.look}" data-sp="kit">See it in its chapter</button>`:''}</div></div></div>`}
  case 'relics':return `<div class="col" style="grid-column:1/-1"><span class="ch-num">${c.n} — Relics</span><div style="display:flex;justify-content:space-between;align-items:end;flex-wrap:wrap;gap:20px"><div class="h2">The collection</div><span class="lbl muted">${allQ().filter(q=>S.done.includes(q.id)).length}/${allQ().length} earned</span></div><p class="note">One relic for every quest, each drawn from the Quest graphics sheet. Locked relics show their shape until you earn them.</p><div class="relgrid">${allQ().map(q=>`<div class="relic ${S.done.includes(q.id)?'got':''}">${relicSVG(q.relic)}${esc(q.t)}<br><span style="color:var(--dim)">${q.z?esc(ZONES[q.z].n):'Hidden'}</span></div>`).join('')}</div></div>`;
  }return''}

/* reading record: which spreads you have seen, where you stopped, and whether you reached the end */
function trackSpread(c,kind){
  if(!(c.kind==='feature'||c.kind==='hq'||c.kind==='kit'))return;
  const sps=spreadsOf(c);let r=S.j.read[c.id];
  if(!r){r=S.j.read[c.id]={sp:[],at:Date.now(),end:0};Pilot.once('feature_open',c.id);if(published(c.id))moveTo(c.id)}
  if(!r.sp.includes(kind))r.sp.push(kind);r.last=kind;S.last={ch:c.id,sp:kind,at:Date.now()};
  if(!r.end&&B.sp===sps.length-1&&r.sp.length>=Math.ceil(sps.length*.6)){r.end=Date.now();gainXP(40);Pilot.once('chapter_end',c.id);const o=OUTTAKES[c.id];
    setTimeout(()=>{toast(o?'Outtakes unlocked · '+o.t:'Chapter kept in your journal');SND.chord()},700);renderZones()}
  save()}

function renderRail(){$('#rail').innerHTML=`<div class="brand">QUEST</div><div class="lbl bsub">The guide · ${ISSUE.label}</div>${CHAPTERS.map((c,i)=>{const terr=c.kind==='fog',st=ZONES[c.id]?zState(c.id):'';
  return `<button class="ch ${i===B.ch?'on':''} ${terr?'lk':''}" data-chi="${i}" ${i===B.ch?'aria-current="true"':''}><span class="n">${c.n}</span><span>${esc(c.kind==='feature'?ZONES[c.id].n:c.t)}</span><span class="r">${terr?'ahead':isNew(c.id)?'new':st==='read'?'<b class="rd" title="Read"></b>':''}</span></button>`}).join('')}<div class="rfoot"><button class="lbl jr-l" data-open="jr">${esc(S.name)} · field journal</button></div>`}
let curEl=null,filmMuted=false,bookReturn=null;
const folioHTML=c=>`<span class="folio l">p. ${folio()} · Quest</span><span class="folio r">${esc(c.t)} · p. ${folio()+1}</span>`;
const SPCLS=k=>k==='opener'||k==='plate'?'bleed':['fog','athlete'].includes(k)?'r12':['story','kit','kitidx','compare'].includes(k)?'r21':['index','quests','relics','gallery','essay','sequence'].includes(k)?'full':'';
function chrome(c,sp,kind){renderRail();
  $('#crumb').innerHTML=`<span class="lbl" style="color:var(--lime)">${c.n}</span><span class="lbl">${esc(c.t)}</span><span class="lbl muted">${esc(spName(c,kind))}</span>`;
  $('#pgInfo').textContent=`${pad(B.sp+1)} / ${pad(sp.length)}`;
  $('#ticks').innerHTML=sp.map((k,i)=>`<button class="${i===B.sp?'on':''}" data-spi="${i}" title="${esc(spName(c,k))}" aria-label="${esc(spName(c,k))}"></button>`).join('');
  const key=c.id+'/'+kind,sb=$('#saveBtn');sb.dataset.save=key;sb.setAttribute('aria-pressed',isSaved(key));sb.textContent=isSaved(key)?'Saved':'Save';
  $('#pgPrev').disabled=B.ch===0&&B.sp===0;$('#pgNext').disabled=B.ch===CHAPTERS.length-1&&B.sp===sp.length-1}
function renderBook(dir=1,wipe=false){const c=CHAPTERS[B.ch],sp=spreadsOf(c);B.sp=Math.max(0,Math.min(B.sp,sp.length-1));const kind=sp[B.sp],bk=kindOf(kind);
  trackSpread(c,kind);chrome(c,sp,kind);
  const el=document.createElement('div');el.className='spread '+SPCLS(bk)+' k-'+bk+' ch-'+c.id;el.innerHTML=renderSpread(c,kind)+(SPCLS(bk)==='bleed'?'':folioHTML(c));el.style.transform=`translateX(${dir*30}px)`;
  const old=curEl;$('#bbody').appendChild(el);curEl=el;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{el.style.transform='';el.classList.add('in');if(old){old.style.transform=`translateX(${-dir*30}px)`;old.classList.remove('in');old.querySelectorAll('video').forEach(v=>v.pause());setTimeout(()=>old.remove(),700)}}));
  if(wipe&&!RM){const sc=$('#scan');sc.classList.remove('go');void sc.offsetWidth;sc.classList.add('go')}
  if(filmMuted){SND.toggle(true);filmMuted=false}
  wire(el,c,kind);
  SND.set(ZONES[c.id]?ZONES[c.id].scene:'book');
  if(ZONES[c.id]&&selZ!==c.id){selZ=c.id;renderZones()}
  try{history.replaceState(null,'','#/'+c.id)}catch(e){}}
/* redraw the current spread in place (after a selection, a tick, a save) without the page-turn */
function rerender(){if(!curEl)return;const c=CHAPTERS[B.ch],sp=spreadsOf(c),kind=sp[B.sp],keep=curEl.scrollTop;curEl.innerHTML=renderSpread(c,kind)+(curEl.classList.contains('bleed')?'':folioHTML(c));chrome(c,sp,kind);wire(curEl,c,kind);curEl.scrollTop=keep}

/* "meaningful interaction", counted once per chapter and kind */
const interacted=new Set();
function interact(kind){const k=CHAPTERS[B.ch].id+':'+kind;if(interacted.has(k))return;interacted.add(k);Pilot.track('interaction',k)}

function armVideos(el){el.querySelectorAll('video').forEach(v=>{
  v.addEventListener('error',()=>{const h=v.closest('.filmbox,.reel,.bl');if(h)h.classList.add('vfail')},{once:true});
  if(v.controls)return;
  if(RM){v.removeAttribute('autoplay');v.pause();v.controls=true;v.classList.add('on');return}
  const p=v.play();if(p&&p.catch)p.catch(()=>{v.controls=true;v.classList.add('on')})})}
function wire(el,c,kind){const bk=kindOf(kind);
  if(bk==='story'&&c.interactive==='kp'){const kv=el.querySelector('#kval'),kd=el.querySelector('#kverdict'),kr=el.querySelector('#kpr');
    const kp=v=>{kv.textContent='Kp '+v;kd.textContent=v<=4?'Unlikely from Oregon. Watch the forecast.':v===5?'Possibly a faint glow low in the north, mostly to the camera.':v<=6?'Good odds. Get dark, face north, shoot long.':'Go now. It may be overhead and visible to the eye in colour.'};
    kr.addEventListener('input',e=>{kp(+e.target.value);SND.tick(600+(+e.target.value)*120);interact('kp')});kp(5)}
  if(bk==='compare'){const f=el.querySelector('#flip');let d=false,x=50;
    const put=v=>{x=Math.max(0,Math.min(100,v));f.style.setProperty('--x',x+'%');f.setAttribute('aria-valuenow',Math.round(x))};
    const set=e=>{const r=f.getBoundingClientRect();put((e.clientX-r.left)/r.width*100)};
    f.addEventListener('pointerdown',e=>{d=true;try{f.setPointerCapture(e.pointerId)}catch(_){}set(e);interact('compare')});
    f.addEventListener('pointerup',()=>d=false);f.addEventListener('pointercancel',()=>d=false);
    f.addEventListener('pointermove',e=>{if(d||e.pointerType==='mouse')set(e)});
    f.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();e.stopPropagation();put(x+(e.key==='ArrowRight'?5:-5));interact('compare')}})}
  if(bk==='film'){const fv=el.querySelector('#filmV'),fb=el.querySelector('#filmSnd');
    fb.onclick=()=>{const on=fv.muted;fv.muted=!on;fb.setAttribute('aria-pressed',on);fb.textContent=on?'Sound on · tap to mute':'Sound off · tap for sound';
      if(on){fv.currentTime=0;fv.play().catch(()=>{});interact('film-sound');if(SND.on){SND.toggle(false);filmMuted=true}}else if(filmMuted){SND.toggle(true);filmMuted=false}}}
  if(bk==='sequence'){const sq=el.querySelector('.seq');
    sq.addEventListener('wheel',e=>{if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){sq.scrollLeft+=e.deltaY;e.preventDefault()}e.stopPropagation()},{passive:false});
    sq.addEventListener('scroll',()=>interact('sequence'),{passive:true,once:true})}
  armVideos(el);placeDetails(el,c)}

/* ---------- hidden details in photographs ---------- */
function imgPoint(img,x,y){const bw=img.clientWidth,bh=img.clientHeight,nw=img.naturalWidth,nh=img.naturalHeight;if(!nw||!bw)return null;const cs=getComputedStyle(img),fit=cs.objectFit;
  if(fit!=='cover'&&fit!=='contain')return[x*bw,y*bh];
  const sc=fit==='cover'?Math.max(bw/nw,bh/nh):Math.min(bw/nw,bh/nh),dw=nw*sc,dh=nh*sc,op=cs.objectPosition.split(' ').map(v=>parseFloat(v)/100);
  return[(bw-dw)*(isNaN(op[0])?.5:op[0])+x*dw,(bh-dh)*(isNaN(op[1])?.5:op[1])+y*dh]}
function placeDetails(el,c){if(!el||!S)return;el.querySelectorAll('.dt-note').forEach(n=>n.remove());
  DETAILS.filter(d=>d.ch===c.id).forEach(d=>{el.querySelectorAll('img').forEach(img=>{if(img.getAttribute('src')!==d.img||img.closest('.thr,.ot,.zc-im,.look'))return;
    const put=()=>{const host=img.parentElement;if(getComputedStyle(host).position==='static')host.style.position='relative';
      let b=host.querySelector(`.dt[data-detail="${d.id}"]`);const p=imgPoint(img,d.x,d.y);
      if(!p||p[0]<10||p[1]<10||p[0]>img.clientWidth-10||p[1]>img.clientHeight-10){if(b)b.remove();return}
      if(!b){b=document.createElement('button');b.className='dt';b.dataset.detail=d.id;b.innerHTML='<i></i>';host.appendChild(b)}
      const got=S.j.found.includes(d.id);b.classList.toggle('got',got);b.setAttribute('aria-label',got?'Field note: '+d.t:'Something in this photograph');
      b.style.left=(img.offsetLeft+p[0])+'px';b.style.top=(img.offsetTop+p[1])+'px'};
    if(img.complete&&img.naturalWidth)put();else img.addEventListener('load',put,{once:true})})})}
function openDetail(b){const d=DETAILS.find(x=>x.id===b.dataset.detail);if(!d)return;const host=b.parentElement,ex=host.querySelector('.dt-note');
  if(ex){const same=ex.dataset.for===d.id;ex.remove();if(same)return}
  const fresh=!S.j.found.includes(d.id);
  if(fresh){S.j.found.push(d.id);gainXP(15);save();SND.chord();Pilot.track('find',d.id);b.classList.add('got');b.setAttribute('aria-label','Field note: '+d.t);renderJournal()}else SND.tick(1760);
  const n=document.createElement('div');n.className='dt-note';n.dataset.for=d.id;n.setAttribute('role','status');
  n.innerHTML=`<span class="lbl lime">${fresh?'Field note found':'Field note'}</span><b>${esc(d.t)}</b><p>${esc(d.note)}</p>${fresh?'<span class="lbl muted">Kept in your journal</span>':''}`;
  const x=parseFloat(b.style.left),y=parseFloat(b.style.top);n.style.left=Math.max(10,Math.min(host.clientWidth-270,x+20))+'px';
  if(y>host.clientHeight*.55)n.style.bottom=(host.clientHeight-y+20)+'px';else n.style.top=(y+20)+'px';host.appendChild(n)}

/* ---------- lightbox: photographs at full size ---------- */
let lbList=[],lbI=0,lbReturn=null;
function openLb(img){const scope=img.closest('.spread,.dpad')||document;
  lbList=[...scope.querySelectorAll('img[data-zoom]')].map(i=>{const f=i.closest('figure'),fc=f&&f.querySelector('figcaption');return{src:i.getAttribute('src'),cap:(fc?fc.textContent:i.alt)||'',ch:i.dataset.ch||''}});
  lbI=Math.max(0,lbList.findIndex(x=>x.src===img.getAttribute('src')));lbReturn=img;showLb();$('#lb').classList.add('open');$('#lbX').focus({preventScroll:true});if($('#book').classList.contains('open'))interact('zoom')}
function showLb(){const it=lbList[lbI];if(!it)return;$('#lbImg').src=it.src;$('#lbCap').textContent=it.cap.trim();$('#lbN').textContent=lbList.length>1?`${pad(lbI+1)} / ${pad(lbList.length)}`:'';
  const sb=$('#lbSave');sb.dataset.save=it.src;sb.dataset.type='img';sb.setAttribute('aria-pressed',isSaved(it.src));sb.textContent=isSaved(it.src)?'Saved':'Save photograph';
  $('#lbPrev').hidden=$('#lbNext').hidden=lbList.length<2}
function stepLb(d){if(lbList.length<2)return;lbI=(lbI+d+lbList.length)%lbList.length;showLb();SND.tick(d>0?1320:990)}
function closeLb(){$('#lb').classList.remove('open');if(lbReturn&&document.contains(lbReturn)&&lbReturn.closest('button'))lbReturn.closest('button').focus({preventScroll:true})}

/* ---------- save · share ---------- */
function toggleSave(k,type){const i=S.j.saved.findIndex(x=>x.k===k);
  if(i>=0){S.j.saved.splice(i,1);toast('Removed from your journal')}
  else{const open=$('#book').classList.contains('open');S.j.saved.unshift({k,type:type||'spread',at:Date.now(),ch:open?CHAPTERS[B.ch].id:''});Pilot.track('save',type||'spread');SND.tick(1480);toast('Saved to your journal')}
  save();renderJournal();if($('#lb').classList.contains('open'))showLb();if($('#book').classList.contains('open')){const c=CHAPTERS[B.ch],sp=spreadsOf(c);chrome(c,sp,sp[B.sp])}}
function share(){const c=CHAPTERS[B.ch],url=location.href.split('#')[0]+'#/'+c.id,title='QUEST — '+c.t;Pilot.track('share',c.id);
  if(navigator.share){navigator.share({title,text:c.verdict||ISSUE.label,url}).catch(()=>{});return}
  (navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(url):Promise.reject()).then(()=>toast('Link copied · '+c.t)).catch(()=>toast(url,7000))}

/* ---------- open · close · turn ---------- */
function openBook(id,sp){const i=typeof id==='number'?id:chIdx(id),prevCh=B.ch;B.ch=i<0?0:i;const c=CHAPTERS[B.ch],sps=spreadsOf(c);
  if(sp===null||sp===undefined||sp===''){const r=S.j.read[c.id];sp=r&&!r.end&&r.last&&sps.includes(r.last)?r.last:0}
  B.sp=typeof sp==='string'?Math.max(0,sps.indexOf(sp)):(sp||0);B.item=null;B.fg=0;
  const bk=$('#book'),wasOpen=bk.classList.contains('open');
  if(!wasOpen){bookReturn=document.activeElement;bk.classList.add('open');document.body.classList.add('reading');SND.whoosh(700);closePanels();hideCard(true);Topo.pause(true);setTimeout(()=>$('#bkClose').focus({preventScroll:true}),60)}
  renderBook(1,!wasOpen||prevCh!==B.ch)}
function closeBook(){const bk=$('#book');if(!bk.classList.contains('open'))return;if(filmMuted){SND.toggle(true);filmMuted=false}
  const c=CHAPTERS[B.ch];Topo.pause($('#cast').classList.contains('open'));
  if(ZONES[c.id]){const p=P(...ZONES[c.id].ll);cancelAnimationFrame(fly);vb=fitTo(p[0]-10,p[1]-10,p[0]+10,p[1]+10,.2);apply();setIris(...zoneXY(c.id));if(published(c.id))moveTo(c.id);
    setTimeout(()=>flyTo(fitTo(p[0]-26,p[1]-26,p[0]+26,p[1]+26,.2),1500),RM?0:300)}
  else setIris(W-90,44);
  bk.classList.remove('open');document.body.classList.remove('reading');if(curEl)curEl.querySelectorAll('video').forEach(v=>v.pause());
  selZ=null;renderZones();renderDispatch();if(S)SND.set(ZONES[S.zone].scene);try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}
  lastDown=Date.now();const g=ZONES[c.id]&&$(`.zone[data-z="${c.id}"]`);(g||$('[data-open="book"]')).focus({preventScroll:true})}
function step(d){const sps=spreadsOf(CHAPTERS[B.ch]);let ch=B.ch,sp=B.sp+d,wipe=false;if(sp>=sps.length){ch=Math.min(CHAPTERS.length-1,ch+1);sp=0;wipe=true}else if(sp<0){ch=Math.max(0,ch-1);sp=spreadsOf(CHAPTERS[ch]).length-1;wipe=true}if(ch===B.ch&&(wipe||sp===B.sp))return;B.ch=ch;B.sp=sp;B.item=null;B.fg=0;SND.tick(d>0?1320:990);renderBook(d,wipe)}
$('#pgPrev').onclick=()=>step(-1);$('#pgNext').onclick=()=>step(1);
let wheelLock=0;$('#bbody').addEventListener('wheel',e=>{if(Math.abs(e.deltaX)>40&&Math.abs(e.deltaX)>Math.abs(e.deltaY)){e.preventDefault();if(!wheelLock){wheelLock=1;step(e.deltaX>0?1:-1);setTimeout(()=>wheelLock=0,600)}}},{passive:false});
let tx0=null,ty0=0;$('#bbody').addEventListener('touchstart',e=>{tx0=e.target.closest('.flip,.seq,input,.ot')?null:e.touches[0].clientX;ty0=e.touches[0].clientY},{passive:true});
$('#bbody').addEventListener('touchend',e=>{if(tx0===null)return;const dx=e.changedTouches[0].clientX-tx0,dy=e.changedTouches[0].clientY-ty0;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.5)step(dx<0?1:-1);tx0=null},{passive:true});

/* ============ QUESTS ============
   Optional, real-world, self-reported. The interface records what the explorer says they did;
   it never states or implies that anything was verified. */
function accept(id){const q=qById(id);if(!q||S.acc[id]||S.done.includes(id))return;S.acc[id]={steps:q.steps.map(()=>false),at:Date.now()};save();SND.chord();toast('In your journal · '+q.t);refresh()}
function dropQ(id){if(!S.acc[id])return;delete S.acc[id];save();refresh()}
function tickObj(id,i,v){const a=S.acc[id];if(!a)return;a.steps[i]=v;save();SND.tick(v?1480:990);if(a.steps.every(Boolean))complete(id);else renderJournal()}
function openModal(){const m=$('#rewM');m.classList.add('open');setTimeout(()=>{const b=m.querySelector('.btn.lime,[data-closerew]');if(b)b.focus({preventScroll:true})},60)}
function closeModal(){$('#rewM').classList.remove('open')}
function complete(id){const q=qById(id),bonus=CLASSES[S.cls].bonus.includes(q.cat),gain=Math.round(q.xp*(bonus?1.25:1));
  S.done.push(id);delete S.acc[id];gainXP(gain);S.qt=(S.qt||0)+Math.round(gain/5);Object.entries(QSK[id]||{}).forEach(([k,v])=>S.skills[k]=(S.skills[k]||0)+v);q.loot.forEach(l=>{if(!S.inv.includes(l))S.inv.push(l)});save();
  SND.loot();publishPresence({q:q.t});pushBoard();Pilot.track('quest_log',id);refresh();
  $('#rewBody').innerHTML=`<div class="rw-head"><div class="relic-big">${relicSVG(q.relic)}</div><span class="lbl muted">Logged · relic kept</span><div class="disp">${esc(q.t)}</div></div><div class="rw-xp">+${gain} XP</div><p class="note" style="text-align:center;margin:-10px 0 18px">+${Math.round(gain/5)} QT${skStr(q)?' · '+skStr(q):''}<br>Logged on your word. QUEST can’t verify what happens in the field.</p>
    ${q.loot.map(l=>{const it=ITEMS[l];return `<div class="loot"><div class="li">${pxItem(l)}</div><div><span class="lbl ${it.r===4?'r4':'muted'}">Kit · ${RAR[it.r]} · ${it.slot}</span><div class="disp">${esc(it.t)}</div><div class="st">${Object.entries(it.st).map(([k,v])=>`+${v} ${STATN[k]}`).join(' · ')}</div></div><button class="btn sm lime" data-equip="${l}">Wear it</button></div>`}).join('')}
    <div style="display:flex;gap:12px;justify-content:center;margin-top:26px;flex-wrap:wrap"><button class="btn" data-castopen>See it in your lookbook</button><button class="btn lime" data-closerew>Continue</button></div>`;
  openModal()}
function equip(id){const it=ITEMS[id];if(!it||!S.inv.includes(id))return;if(S.equip[it.slot]===id)delete S.equip[it.slot];else S.equip[it.slot]=id;save();SND.tick(1100);pushBoard();refresh()}
function originOf(id){const it=ITEMS[id],q=dropsFrom(id);return it.look?'Seen at '+ZONES[it.look].n:q&&q.z&&published(q.z)?'From '+ZONES[q.z].n:it.brand?'By '+it.brand:'In the catalog'}

/* ============ FIELD JOURNAL ============
   The explorer's own record: what they have read, saved, noticed and logged. Not a profile. */
function renderJournal(){if(!S)return;const nA=Object.keys(S.acc).length;$('#logBadge').hidden=!nA;$('#logBadge').textContent=nA;
  if(!$('#jrD').classList.contains('open'))return;
  const feats=CHAPTERS.filter(c=>c.kind==='feature'||c.kind==='hq'),nRead=feats.filter(c=>isRead(c.id)).length,found=DETAILS.filter(d=>S.j.found.includes(d.id));
  const th=(src,st)=>`<span class="jt"><img src="${src}" alt="" loading="lazy" ${st?`style="${st}"`:''}></span>`;
  const last=S.last&&chById(S.last.ch),cont=last&&!isRead(last.id)?last:null;
  const act=Object.keys(S.acc).map(qById).filter(Boolean),done=S.done.map(qById).filter(Boolean),left=allQ().length-act.length-done.length;
  const trail=S.j.trail.filter(k=>ZONES[k]).slice(-6).map(k=>esc(ZONES[k].n)).join(' → ');
  const outs=Object.entries(OUTTAKES).filter(([id])=>isRead(id));
  const sec=(t,n)=>`<div class="qh jr-h"><span class="lbl">${t}</span><span class="lbl muted">${n}</span></div>`;
  $('#jrBody').innerHTML=`<span class="lbl muted">Field journal · ${ISSUE.label}</span><div class="ztitle">${esc(S.name)}</div>
  <p class="note">${CLASSES[S.cls].n} · exploring since ${fmtDate(S.created)}${trail?`<br>${trail}`:''}</p>
  <div class="jr-s"><div><b>${nRead}<i>/${feats.length}</i></b><span class="lbl muted">Read</span></div><div><b>${found.length}<i>/${DETAILS.length}</i></b><span class="lbl muted">Field notes</span></div><div><b>${S.j.saved.length}</b><span class="lbl muted">Saved</span></div><div><b>${S.done.length}</b><span class="lbl muted">Relics</span></div></div>
  ${cont?`<button class="jr-r jr-c" data-go="${cont.id}" data-sp="${esc(S.last.sp)}">${th(cont.hero,cont.heroPos?'object-position:'+cont.heroPos:'')}<span><span class="lbl lime">Continue reading</span><b>${esc(cont.t)}</b><i>${esc(spName(cont,S.last.sp))}</i></span></button>`:''}
  ${sec('Destinations',nRead+' of '+feats.length+' read')}
  ${feats.map(c=>{const st=zState(c.id),r=S.j.read[c.id];return `<button class="jr-r ${st}" data-go="${c.id}"><span class="jg">${relicSVG(ZONES[c.id].mark)}</span><span><b>${esc(c.t)}</b><i>${esc(c.place)}</i></span><span class="lbl ${st==='read'?'lime':'muted'}">${st==='read'?fmtDate(r.end):STLBL[st]}</span></button>`}).join('')}
  ${sec('Saved',S.j.saved.length)}
  ${S.j.saved.length?S.j.saved.map(sv=>{if(sv.type==='img'){const c=chById(sv.ch);return `<div class="jr-r"><button class="jt-b" aria-label="Open photograph">${`<span class="jt"><img src="${esc(sv.k)}" alt="" loading="lazy" data-zoom></span>`}</button><span><b>Photograph</b><i>${c?esc(c.t):''}</i></span><button class="lnk lbl" data-save="${esc(sv.k)}" data-type="img">Remove</button></div>`}
      const [cid,kind]=sv.k.split('/'),c=chById(cid);if(!c)return'';return `<div class="jr-r"><button class="jr-go" data-go="${cid}" data-sp="${esc(kind)}">${th(c.hero||'img/cover-film.jpg')}<span><b>${esc(c.t)}</b><i>${esc(spName(c,kind))}</i></span></button><button class="lnk lbl" data-save="${esc(sv.k)}">Remove</button></div>`}).join(''):'<p class="empty-note">Nothing saved yet. Any page or photograph can be kept here.</p>'}
  ${sec('Field notes',found.length+' of '+DETAILS.length)}
  ${found.map(d=>`<div class="jr-n">${th(d.img,`object-position:${d.x*100}% ${d.y*100}%;transform:scale(2.4);transform-origin:${d.x*100}% ${d.y*100}%`)}<span><b>${esc(d.t)}</b><p>${esc(d.note)}</p><span class="lbl muted">${esc(chById(d.ch).t)}</span></span></div>`).join('')}
  ${found.length<DETAILS.length?`<p class="empty-note">${found.length?DETAILS.length-found.length+' still unnoticed, somewhere in the photographs.':'Some photographs hold more than their captions say. Look closely.'}</p>`:''}
  ${S.j.threads.length?sec('Threads followed',S.j.threads.length)+THREADS.filter(t=>S.j.threads.includes(t.id)).map(t=>`<button class="jr-r" data-go="${t.b}"><span class="jg">${relicSVG(8)}</span><span><b>${esc(t.t)}</b><i>${esc(ZONES[t.a].n)} ↔ ${esc(ZONES[t.b].n)}</i></span></button>`).join(''):''}
  ${outs.length?sec('Outtakes',outs.length)+outs.map(([id,o])=>`<div class="jr-o"><span class="lbl muted">${esc(o.t)} · ${esc(chById(id).t)}</span>${o.items?`<div class="ot sm">${o.items.map(([src,cap])=>`<figure><img src="${src}" alt="${esc(cap)}" loading="lazy" data-zoom><figcaption>${esc(cap)}</figcaption></figure>`).join('')}</div>`:`<button class="lnk lbl" data-go="${id}" data-sp="end">Watch at the end of the chapter</button>`}</div>`).join(''):''}
  ${sec('In the field',act.length+' active · '+done.length+' logged')}
  ${act.map(q=>`<button class="jr-r" data-go="${q.z||'relics'}" data-sp="quests"><span class="jg">${relicSVG(q.relic)}</span><span><b>${esc(q.t)}</b><i>${q.z?esc(ZONES[q.z].n):'Anywhere'} · ${S.acc[q.id].steps.filter(Boolean).length}/${q.steps.length} objectives</i></span></button>`).join('')}
  ${done.map(q=>`<button class="jr-r read" data-go="${q.z||'relics'}" data-sp="quests"><span class="jg on">${relicSVG(q.relic)}</span><span><b>${esc(q.t)}</b><i>${q.z?esc(ZONES[q.z].n):'Anywhere'} · logged</i></span></button>`).join('')}
  <p class="empty-note">${left>0?left+' optional quests wait at the end of the chapters. They happen in the real world; log them here on your word.':'Every quest in this issue is logged.'}</p>
  <div class="acts" style="margin-top:30px"><button class="btn sm" data-open="cast">Lookbook</button><button class="lnk lbl" data-privacy>Pilot &amp; privacy</button></div>`}

/* ============ LOOKBOOK ============ */
const ANCH={Head:[120,58],Body:[120,190],Legs:[120,370],Feet:[120,482],Tool:[180,300],Charm:[184,32]};
const CARDP={Head:[60,60,'L'],Body:[60,290,'L'],Legs:[60,520,'L'],Charm:[910,60,'R'],Tool:[910,290,'R'],Feet:[910,520,'R']};
const BOX={Head:[92,26,56,82],Body:[66,112,108,170],Legs:[74,242,92,224],Feet:[82,458,76,42],Tool:[150,200,94,180],Charm:[160,6,50,50]};
const SLOTLBL={Head:['Headwear','#6F93C6'],Body:['Tops','#BEFF00'],Legs:['Pants','#8C8F43'],Feet:['Footwear','#F3F1EC'],Tool:['Accessories','#E08A1E'],Charm:['Charm','#BEFF00']};
let lbView='look';
function renderCast(){const st=stats(),base=CLASSES[S.cls].st;const lookNo=String(S.done.length+1).padStart(2,'0');const z=ZONES[S.zone];
  const bgSrc={catalina:'img/cove.jpg',trillium:'img/aurora-ridge.jpg',silverfalls:'img/sf-overhang.jpg',eugene:'img/oregon-field.jpg',coast:'img/coast-cliff.jpg',portland:'img/bow-dusk.jpg'}[S.zone]||'img/bow-dusk.jpg';
  const rows=['Body','Legs','Head','Feet','Tool','Charm'].filter(sl=>S.equip[sl]||['Body','Legs','Tool'].includes(sl)).slice(0,4);
  $('#stage').outerHTML=`<div id="stage" class="lb-wrap"><div class="lb-sheet">
   <div class="lb-h"><div class="logo2">QUEST<sup>®</sup></div><div style="flex:1"></div><button class="lbl" data-close style="color:#cfccc5">Close · Esc</button></div>
   <div class="lb-sub"><span>Issue 01 › ${esc(z.n)} › ${esc(S.name)}</span><span style="display:flex;gap:0"><span style="padding:0 18px;border-left:1px solid rgba(243,241,236,.5)">${CLASSES[S.cls].n} · LV ${lvl()}</span><span style="background:var(--lime);color:var(--ink);padding:0 18px">Look ${lookNo}</span></span></div>
   <div class="lb-body"><div class="lb-win"><div class="os"><div class="bar"><span>Look ${lookNo} · ${esc(S.name)} · Studio, ${esc(z.n)}</span></div>
     <div class="scene">${pxPhoto(bgSrc,110)}${pxAvatar(S.look,S.equip,'0 0 240 520',96,208,'fig')}
       <div class="hud2"><span>${z.ll[0].toFixed(4)}° N · ${Math.abs(z.ll[1]).toFixed(4)}° W</span><span>${esc(z.el)}</span></div>
       <div class="tagr">${Object.values(S.equip).map(id=>`<span>${esc(ITEMS[id].t)}</span>`).join('')||'<span>Base layer · earn the rest in the field</span>'}</div></div>
     <div class="sw2"><span class="lbl muted" style="padding:6px 4px">Mannequin finish</span>${SKINS.map((c,i)=>`<button data-lskin="${i}" class="${S.look.skin===i?'on':''}" style="background:${c};width:22px;padding:0;height:22px;border-radius:50%"></button>`).join('')}<span class="lbl muted" style="padding:6px 4px 6px 14px">${["Bone","Stone","Graphite","Onyx"][S.look.skin]||"Stone"} · faceless, ungendered</span></div></div></div>
    <div class="lb-col">${rows.map(sl=>{const id=S.equip[sl],it=ITEMS[id];const [nm,col]=SLOTLBL[sl];
      return `<div class="lb-row"><div class="flat">${it?pxItem(id,150):`<span class="em">—</span>`}</div><div class="info"><span class="d" style="background:${it?col:'transparent'};border:1px solid ${col}"></span><div><b>${nm}</b><small>${it?esc(it.t)+'<br>'+esc(it.f)+' · '+RAR[it.r]:'Earn a piece in the field, then tap it in the wardrobe below.'}</small></div>${it?`<button data-equip="${id}">Remove</button>`:''}</div></div>`}).join('')}</div></div>
   <div class="lb-strip"><div>Tokens<b class="up">${S.qt||0} QT</b></div>${Object.keys(STATN).map(k=>`<div>${STATN[k]}<b class="${st[k]>base[k]?'up':''}">${st[k]}</b></div>`).join('')}<div>Quests<b>${S.done.length}</b></div><div>XP<b>${S.xp}</b></div></div></div>
   <div class="qh" style="margin-top:34px"><span class="lbl">Wardrobe · tap to wear</span><span class="lbl muted">${S.inv.length}/${Object.keys(ITEMS).length} collected</span></div>
   <div class="wgrid2">${Object.keys(ITEMS).map(id=>{const it=ITEMS[id],own=S.inv.includes(id),eq=S.equip[it.slot]===id;return `<button class="wf ${eq?'eqd':''} ${own?'':'lockd'}" ${own?`data-equip="${id}"`:`data-kitgo="${id}"`}><div class="ii">${pxItem(id,112)}</div><div class="ib">${it.slot} · ${RAR[it.r]}<b>${esc(it.t)}</b>${eq?'<span class="lime">Wearing</span>':own?'Wear':esc(originOf(id))}</div></button>`}).join('')}</div>
   <div class="qh" style="margin-top:34px"><span class="lbl">Relics</span><span class="lbl muted">${S.done.length}/${allQ().length}</span></div>
   <div class="relgrid">${allQ().map(q=>`<div class="relic ${S.done.includes(q.id)?'got':''}">${relicSVG(q.relic)}${esc(q.t)}</div>`).join('')}</div></div>`;
  $('#wardrobe').innerHTML='';
  const nNew=S.inv.length-(S.seenInv||0);$('#invBadge').hidden=nNew<=0;$('#invBadge').textContent=nNew}
function openCast(){S.seenInv=S.inv.length;save();renderCast();closePanels();$('#cast').classList.add('open');Topo.pause(true);SND.tick();setTimeout(()=>{const x=$('#cast [data-close]');if(x)x.focus({preventScroll:true})},60)}
function closeCast(){$('#cast').classList.remove('open');Topo.pause($('#book').classList.contains('open'))}

/* player card */
function renderCard(){const l=lvl(),a=LV[l-1],b=LV[l]||LV[l-1]+1000;$('#pName').textContent=S.name;$('#pCls').textContent=CLASSES[S.cls].n;$('#pLv').textContent=l;$('#pXp').style.width=Math.min(100,(S.xp-a)/(b-a)*100)+'%';$('#pAv').innerHTML=pxAvatar(S.look,S.equip,'78 14 84 84',30,30)}
function refresh(){renderCard();renderZones();renderMe();renderJournal();if($('#cast').classList.contains('open'))renderCast();else{const n=S.inv.length-(S.seenInv||0);$('#invBadge').hidden=n<=0;$('#invBadge').textContent=n}if($('#book').classList.contains('open'))rerender()}

/* ============ DISPATCH: what is new since you were last here, and where you stopped ============ */
function renderDispatch(){const el=$('#dispatch');if(!S||$('#book').classList.contains('open')){el.hidden=true;return}
  const news=freshUpdates().sort((a,b)=>a.date<b.date?1:-1),last=S.last&&chById(S.last.ch),cont=last&&!isRead(last.id)&&S.visits>1&&!dispatchSeen?last:null;
  if(!news.length&&!cont){el.hidden=true;return}
  el.innerHTML=`<div class="dp-h lbl"><span>${news.length?'New since your last visit':'Where you stopped'}</span><button data-dpx aria-label="Dismiss">Dismiss</button></div>
   ${cont?`<button class="dp-r" data-go="${cont.id}" data-sp="${esc(S.last.sp)}"><span class="lbl muted">Continue reading</span><b>${esc(cont.t)}</b><i>${esc(spName(cont,S.last.sp))}</i></button>`:''}
   ${news.map(u=>`<button class="dp-r" ${u.go?`data-go="${u.go[0]}" data-sp="${u.go[1]||''}"`:'data-open="jr"'}><span class="lbl lime">${esc(u.kind)} · ${fmtDate(u.date)}</span><b>${esc(u.t)}</b><i>${esc(u.d)}</i></button>`).join('')}`;
  el.hidden=false}
let dispatchSeen=false;
function dismissDispatch(){dispatchSeen=true;const d=UPDATES.map(u=>u.date).sort().pop();if(d&&d>S.seenUpdates){S.seenUpdates=d;save()}$('#dispatch').hidden=true;renderZones()}

/* ============ PILOT & PRIVACY ============ */
function openPrivacy(){const s=Pilot.summary(),sink=Pilot.hasSink();
  $('#rewBody').innerHTML=`<span class="lbl muted">Pilot &amp; privacy</span><div class="h2" style="margin-top:10px">What QUEST keeps</div>
   <div class="prose pv"><p>QUEST is in a small pilot. To learn what people actually do here, this page keeps a short log of actions: that an explorer was created, which chapters were opened and finished, how many details were noticed, and counts of saves, shares, logged quests and return visits.</p>
   <p>It never records your callsign, anything you type, your location or your device. Your explorer and your journal are stored only in this browser.</p>
   <p>${sink?'On this page a summary of those counts is shared with the QUEST team under a random id made in your browser. You can turn that off below.':'This copy of QUEST has nowhere to send anything. The log stays in this browser.'}</p></div>
   <dl class="meta"><dt>This browser</dt><dd>${s.opened.length} chapters opened · ${s.finished.length} finished · ${s.finds} details · ${s.interactions} interactions · ${s.saves} saves · ${s.shares} shares · ${s.visits} visit${s.visits===1?'':'s'} over ${s.days} day${s.days===1?'':'s'}</dd><dt>Random id</dt><dd>${esc(Pilot.id)}</dd>${sink?`<dt>Sharing</dt><dd><label class="tog"><input type="checkbox" id="pvShare" ${Pilot.sharing?'checked':''}> Share my anonymous summary</label></dd>`:''}</dl>
   <div id="pvAll"></div>
   <div class="acts"><button class="btn sm" data-pvdl>Download my log</button><button class="btn sm" data-pvclr>Erase my log</button><button class="btn sm lime" data-closerew>Done</button></div>`;
  openModal();
  if(location.hash==='#pilot'){const ok=Pilot.watchAll(rows=>{const n=rows.filter(r=>!r.erased),c=f=>n.filter(f).length,top={};n.forEach(r=>(r.opened||[]).forEach(id=>top[id]=(top[id]||0)+1));const host=$('#pvAll');if(!host)return;
      host.innerHTML=`<span class="lbl lime" style="display:block;margin-top:22px">Pilot · all explorers who share (${n.length})</span><dl class="meta" style="margin-top:8px"><dt>Created an explorer</dt><dd>${c(r=>r.created)}</dd><dt>Visited a destination</dt><dd>${c(r=>r.firstZone)}</dd><dt>Opened a feature</dt><dd>${c(r=>(r.opened||[]).length)}</dd><dt>Finished a feature</dt><dd>${c(r=>(r.finished||[]).length)}</dd><dt>Interacted</dt><dd>${c(r=>r.interactions>0||r.finds>0)}</dd><dt>Saved or shared</dt><dd>${c(r=>r.saves>0||r.shares>0)}</dd><dt>Returned another day</dt><dd>${c(r=>r.returned)}</dd><dt>Most opened</dt><dd>${Object.entries(top).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([id,v])=>esc((chById(id)||{}).t||id)+' '+v).join(' · ')||'—'}</dd></dl>`});
    if(!ok)$('#pvAll').innerHTML='<p class="note" style="margin-top:18px">The all-explorers view needs the published page’s database. Here, only this browser’s log exists.</p>'}}

/* ============ EVENTS ============ */
function closePanels(){$$('.drawer.open').forEach(d=>d.classList.remove('open'));$$('.tool.on').forEach(t=>t.classList.remove('on'))}
function openD(id){closePanels();hideCard(true);$('#'+id).classList.add('open');$$('.tool').forEach(t=>t.classList.toggle('on',(t.dataset.open==='jr'&&id==='jrD')||(t.dataset.open==='ex'&&id==='exD')));if(id==='jrD')renderJournal();setTimeout(()=>{const x=$('#'+id+' .x');if(x)x.focus({preventScroll:true})},60)}
const bookOpen=()=>$('#book').classList.contains('open');
document.addEventListener('click',e=>{const t=e.target;if(!S&&!t.closest('[data-privacy],[data-closerew],[data-pvdl],[data-pvclr]'))return;
  if(t.closest('[data-pvdl]')){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([Pilot.export()],{type:'application/json'}));a.download='quest-pilot-log.json';a.click();return}
  if(t.closest('[data-pvclr]')){Pilot.erase();toast('Pilot log erased');openPrivacy();return}
  if(t.closest('[data-privacy]')){openPrivacy();return}
  if(t.closest('[data-closerew]')){closeModal();return}
  if(t.closest('[data-castopen]')){closeModal();openCast();return}
  const dtl=t.closest('.dt');if(dtl){e.stopPropagation();openDetail(dtl);return}
  if(t.closest('#lb')){if(t.closest('#lbPrev'))stepLb(-1);else if(t.closest('#lbNext'))stepLb(1);else if(t.closest('[data-save]'))toggleSave($('#lbSave').dataset.save,'img');else if(!t.closest('#lbImg'))closeLb();return}
  if(t.closest('[data-dpx]')){dismissDispatch();return}
  const sv=t.closest('[data-save]');if(sv){toggleSave(sv.dataset.save,sv.dataset.type);return}
  if(t.closest('[data-share]')){share();return}
  const zm=t.closest('img[data-zoom]')||(t.closest('.jt-b')&&t.closest('.jt-b').querySelector('img'));if(zm){openLb(zm);return}
  if(t.closest('[data-close]')){const d=t.closest('.drawer,#book,#cast');if(!d)return;if(d.id==='book')closeBook();else if(d.id==='cast')closeCast();else closePanels();return}
  const en=t.closest('[data-enter]');if(en){enterZone(en.dataset.enter);return}
  const rg=t.closest('[data-region]');if(rg){SND.tick();flyRegion(rg.dataset.region);return}
  const thr=t.closest('[data-thread]');if(thr){const id=thr.dataset.thread;if(!S.j.threads.includes(id)){S.j.threads.push(id);gainXP(10);save();Pilot.track('interaction','thread:'+id)}SND.tick(1480);openBook(thr.dataset.to,0);return}
  const o=t.closest('[data-open]');if(o){SND.tick();const w=o.dataset.open;
    if(w==='book'){if(bookOpen())closeBook();else{setIris(e.clientX||W-200,e.clientY||40);openBook(S.last&&chById(S.last.ch)?S.last.ch:'index',S.last?S.last.sp:0)}}
    else if(w==='jr'){$('#jrD').classList.contains('open')?closePanels():openD('jrD')}
    else if(w==='cast'){$('#cast').classList.contains('open')?closeCast():openCast()}
    else if(w==='ex'){$('#exD').classList.contains('open')?closePanels():(renderEx(),openD('exD'))}return}
  const ac=t.closest('[data-accept]');if(ac){accept(ac.dataset.accept);return}
  const dr=t.closest('[data-drop]');if(dr){dropQ(dr.dataset.drop);return}
  const by=t.closest('[data-buy]');if(by){const id=by.dataset.buy;if((S.qt||0)>=price(id)&&!S.inv.includes(id)){S.qt-=price(id);S.inv.push(id);save();SND.loot();toast('Unlocked · '+ITEMS[id].t);refresh()}return}
  const lf=t.closest('[data-life]');if(lf){toast('In-life redemption opens at launch. Your tokens are saved.');return}
  const eq=t.closest('[data-equip]');if(eq){e.stopPropagation();equip(eq.dataset.equip);return}
  const kg=t.closest('[data-kitgo]');if(kg){closeCast();if(!bookOpen())setIris(e.clientX,e.clientY);openBook('kit','kitidx');B.item=kg.dataset.kitgo;rerender();return}
  const go=t.closest('[data-go]');if(go){if(go.closest('#dispatch'))dismissDispatch();closePanels();closeCast();if(!bookOpen())setIris(e.clientX||W/2,e.clientY||H/2);openBook(go.dataset.go,go.dataset.sp||0);return}
  const nx=t.closest('[data-next]');if(nx){step(1);return}
  const ci=t.closest('[data-chi]');if(ci){B.ch=+ci.dataset.chi;B.sp=0;B.item=null;B.fg=0;SND.tick();renderBook(1,true);return}
  const si=t.closest('[data-spi]');if(si){const n=+si.dataset.spi;if(n===B.sp)return;const d=n>B.sp?1:-1;B.sp=n;B.item=null;renderBook(d);return}
  const fg=t.closest('[data-fg]');if(fg){B.fg=B.fg===+fg.dataset.fg?-1:+fg.dataset.fg;SND.tick(1760);interact('fieldguide');rerender();return}
  const gr=t.closest('[data-gear]');if(gr){B.item=B.item===gr.dataset.gear&&t.closest('.gi')?null:gr.dataset.gear;SND.tick(1760);interact('kit');rerender();return}
  const lk=t.closest('[data-lskin]');if(lk){S.look.skin=+lk.dataset.lskin;save();SND.tick();renderCast();renderCard();return}
  const kf=t.closest('[data-kitf]');if(kf){B.kitF=kf.dataset.kitf;B.item=null;SND.tick();rerender();return}
  const kc=t.closest('[data-kit]');if(kc){B.item=kc.dataset.kit;SND.tick(1760);rerender();return}
  if(t.closest('#pcard')){openCast();return}
});
document.addEventListener('change',e=>{const c=e.target.closest('[data-obj]');if(c)tickObj(c.dataset.obj,+c.dataset.i,c.checked);if(e.target.id==='pvShare'){Pilot.sharing=e.target.checked;if(e.target.checked)Pilot.push()}});
addEventListener('keydown',e=>{const k=e.key.toLowerCase(),tag=e.target.tagName;
  if(k==='escape'){if($('#lb').classList.contains('open'))closeLb();else if($('#rewM').classList.contains('open'))closeModal();else if(!S)return;else if($('#cast').classList.contains('open'))closeCast();else if($$('.drawer.open').length)closePanels();else if(bookOpen())closeBook();else hideCard(true);return}
  if(!S||!$('#title').classList.contains('off')||!$('#create').classList.contains('off')||tag==='INPUT'||tag==='TEXTAREA'||e.metaKey||e.ctrlKey||e.altKey)return;
  if($('#rewM').classList.contains('open'))return;
  if($('#lb').classList.contains('open')){if(k==='arrowright')stepLb(1);else if(k==='arrowleft')stepLb(-1);return}
  const bo=bookOpen(),co=$('#cast').classList.contains('open');
  if(k==='arrowright'||k==='arrowleft'){if(e.target.closest&&e.target.closest('.seq,.flip'))return;if(co||$$('.drawer.open').length)return;e.preventDefault();if(bo)step(k==='arrowright'?1:-1);else focusZone(k==='arrowright'?1:-1);return}
  if(k==='b')$('[data-open="book"]').click();else if(k==='j'||k==='q')$('.tool[data-open="jr"]').click();else if(k==='i')co?closeCast():openCast();else if(k==='e')$('.tool[data-open="ex"]').click();
  else if(bo&&k==='s')$('#saveBtn').click();
  else if(e.shiftKey&&k==='p'){location.hash='#pilot';openPrivacy()}
  else if(!bo&&!co&&(k==='m'||k==='h'))$('#zHome').click();else if(!bo&&!co&&(k==='+'||k==='='))zoomAt(.7);else if(!bo&&!co&&k==='-')zoomAt(1.45)});
addEventListener('resize',()=>{if(bookOpen()&&curEl)placeDetails(curEl,CHAPTERS[B.ch])});
$('#sndBtn').addEventListener('click',()=>{SND.toggle();if(S){S.prefs.sound=SND.on;save()}});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('[role=button]:not(.zone)')){e.preventDefault();e.target.click()}});

/* ============ EXPLORERS · PRESENCE · LEADERBOARD (published page only; silent offline) ============ */
let room=null,db=null,user=null,myId=null,peers=[],board=[],seenFeat={};
function peersAt(z){const n=peers.filter(p=>!p.isMe&&p.presence&&p.presence.zone===z).length;return n?`${n} other explorer${n>1?'s':''}`:'No one else right now'}
function renderPeersOnMap(){const byZ={};peers.forEach(p=>{if(p.isMe||!p.presence||!ZONES[p.presence.zone])return;(byZ[p.presence.zone]=byZ[p.presence.zone]||[]).push(p)});
  $('#peers').innerHTML=Object.entries(byZ).map(([z,ps])=>{const [x,y]=P(...ZONES[z].ll);return `<g transform="translate(${x} ${y}) scale(${s})">${ps.slice(0,8).map((p,i)=>{const a=i/Math.min(8,ps.length)*Math.PI*2-Math.PI/2;return `<circle class="peerdot" cx="${(Math.cos(a)*15).toFixed(1)}" cy="${(Math.sin(a)*15).toFixed(1)}" r="2.2"><title>${esc(p.presence.cs||'Explorer')}</title></circle>`}).join('')}</g>`}).join('')}
function renderEx(){const on=peers.filter(p=>p.kind==='viewer');
  const list=on.length?on:[{isMe:true,presence:{cs:S.name,cls:S.cls,lvl:lvl(),zone:S.zone}}];
  $('#exBody').innerHTML=`<span class="lbl muted">${room?'Live · in the world now':'Offline · single-player'}</span><div class="ztitle" style="font-size:38px">Explorers</div>
   <div class="qh" style="margin-top:26px"><span class="lbl">Online now</span><span class="lbl muted">${list.length}</span></div>
   ${list.map(p=>{const pr=p.presence||{};return `<div class="ex-row"><div><div class="disp ${p.isMe?'ex-me':''}">${esc(pr.cs||'Explorer')}${p.isMe?' · you':''}</div><span class="lbl muted">${esc(CLASSES[pr.cls]?.n||'—')} · ${esc(ZONES[pr.zone]?.n||'Travelling')}${p.guest?' · guest':''}</span></div><div class="lv">${Number(pr.lvl)||1}</div></div>`}).join('')}
   <div class="qh" style="margin-top:36px"><span class="lbl">Hall of explorers</span><span class="lbl muted">By XP · self-reported</span></div>
   ${board.length?board.map((b,i)=>`<div class="ex-row"><div><div class="disp ${b.id===myId?'ex-me':''}">${String(i+1).padStart(2,'0')} · ${esc(b.cs||'Explorer')}</div><span class="lbl muted">${esc(CLASSES[b.cls]?.n||'—')} · ${Number(b.done)||0} quests</span></div><div class="lv">${Number(b.xp)||0}</div></div>`).join(''):`<p class="empty-note" style="padding-top:10px">${db?'No explorers on the board yet. Complete a quest to be first.':'The hall appears when you’re signed in to the published page.'}</p>`}<div class="acts" style="margin-top:34px"><button class="lnk lbl" data-privacy>Pilot &amp; privacy</button></div>`}
function updOnline(){const n=peers.filter(p=>p.kind==='viewer').length||1;$('#onCount').textContent=n;$('#onDot').style.background=room?'var(--lime)':'var(--grey)';$('#tOnline').textContent=room?(n>1?`${n} explorers in the world`:'You’re the first explorer here right now'):'Single-player · the world goes live on the published page';$('#tDot').style.background=room?'var(--lime)':'var(--grey)';$('#feed').hidden=!room||!feed.length}
let presT;function publishPresence(feat){if(!room||!S)return;const patch={cs:S.name,cls:S.cls,lvl:lvl(),zone:S.zone};if(feat)patch.feat={q:feat.q,at:Date.now()};clearTimeout(presT);presT=setTimeout(()=>room.presence(patch).catch(()=>{}),80)}
let pushT;function schedulePush(){}
function pushBoard(){Pilot.push();if(!db||!myId||!S)return;db.collection('explorers').doc(myId).set({cs:S.name,cls:S.cls,xp:S.xp,lvl:lvl(),done:S.done.length,at:Date.now()}).catch(()=>{});
  db.doc('data/users/'+myId+'/save').set({state:JSON.stringify(S),at:Date.now()}).catch(()=>{})}
(async()=>{if(!window.claude||!window.claude.use)return updOnline();
  try{user=await window.claude.use('user');if(user)myId=await user.id()}catch(e){}
  try{room=await window.claude.use('room')}catch(e){room=null}
  if(room){room.onPeers(ch=>{peers=[...ch.peers];
      ch.joined.forEach(p=>{if(!p.isMe&&p.kind==='viewer'&&p.presence&&p.presence.cs)pushFeed(`${p.presence.cs} entered the world`)});
      ch.updated.forEach(p=>{if(p.isMe||!p.presence)return;const pr=p.presence;const prev=seenFeat[p.peer]||{};if(pr.feat&&pr.feat.at!==prev.at&&pr.feat.q)pushFeed(`${pr.cs||'An explorer'} completed ${pr.feat.q}`);else if(pr.zone&&prev.zone&&pr.zone!==prev.zone&&ZONES[pr.zone])pushFeed(`${pr.cs||'An explorer'} arrived at ${ZONES[pr.zone].n}`);else if(pr.lvl&&prev.lvl&&pr.lvl>prev.lvl)pushFeed(`${pr.cs||'An explorer'} reached level ${pr.lvl}`);seenFeat[p.peer]={at:pr.feat&&pr.feat.at,zone:pr.zone,lvl:pr.lvl}});
      ch.left.forEach(p=>{if(!p.isMe&&p.presence&&p.presence.cs)pushFeed(`${p.presence.cs} left the world`)});
      updOnline();renderPeersOnMap();if($('#exD').classList.contains('open'))renderEx();if(selZ&&$('#zPeers'))$('#zPeers').textContent=peersAt(selZ)},()=>{room=null;updOnline()});publishPresence()}
  try{db=await window.claude.use('db')}catch(e){db=null}
  if(db){db.collection('explorers').orderBy('xp','desc').limit(10).onSnapshot(sn=>{board=sn.docs.map(d=>({id:d.id,...d.data()}));if($('#exD').classList.contains('open'))renderEx()},()=>{});
    if(myId){try{const sv=await db.doc('data/users/'+myId+'/save').get();if(sv.exists){const remote=Store.migrate(JSON.parse(sv.data().state||'null'));if(remote&&(!S||remote.xp>S.xp)){S=remote;save();if(!$('#world').hidden&&$('#title').classList.contains('off'))refresh();renderTitle()}}}catch(e){}}}
  updOnline()})();

/* secret: spin the recentre control four times */
let spins=0,spT;$('#zHome').addEventListener('click',()=>{spins++;$('#zHome').style.transform=`rotate(${spins*90}deg)`;$('#zHome').style.transition='transform .8s';clearTimeout(spT);spT=setTimeout(()=>spins=0,1600);if(spins>=4&&S&&!S.secret){S.secret=true;save();refresh();toast('Secret quest unlocked · True north');pushFeed('You found the compass’s secret');spins=0}});

/* ============ ARRIVAL · EXPLORER CREATION · WORLD ENTRY ============ */
let ti=0;setInterval(()=>{if($('#title').classList.contains('off')||document.hidden)return;const sl=$$('#title .slide');sl[ti].classList.remove('on');ti=(ti+1)%sl.length;sl[ti].classList.add('on')},6500);
/* a shared link (#/catalina) opens straight onto that chapter once you are in */
let deep=(location.hash.match(/^#\/([a-z]+)/)||[])[1]||null;if(deep&&!chById(deep))deep=null;
function renderTitle(){$('#titleActs').innerHTML=S?`<button class="btn lime" id="contBtn">Continue as ${esc(S.name)}</button><button class="btn" id="newBtn">New explorer</button>`:`<button class="btn lime" id="newBtn">${deep?'Begin · '+esc(chById(deep).t):'Begin'}</button>`;
  const c=$('#contBtn');if(c)c.onclick=()=>{if(S.prefs.sound!==false)SND.toggle(true);enterWorld()};
  $('#newBtn').onclick=()=>{if(S&&!confirmNew())return;SND.toggle(true);SND.set('hq');$('#title').classList.add('off');$('#create').classList.remove('off');setTimeout(()=>{const f=$('.cls');if(f)f.focus({preventScroll:true})},500)}}
let confirmArm=0;function confirmNew(){if(Date.now()-confirmArm<4000)return true;confirmArm=Date.now();$('#newBtn').textContent='Tap again to replace '+S.name;return false}
let pick=null,look={skin:1,hair:0,hc:0};
$('#classes').innerHTML=Object.entries(CLASSES).map(([k,c])=>`<button class="cls" data-cls="${k}" aria-pressed="false"><div class="ph"><img src="${c.img}" alt=""></div><div class="cb"><span class="lbl muted">Class</span><div class="disp">${c.n}</div><p>${c.copy}</p><div class="stats">${Object.keys(STATN).map(s=>`<div class="stat"><span>${s}</span><span class="bar"><i style="width:${c.st[s]*10}%"></i></span><span>${c.st[s]}</span></div>`).join('')}</div><div class="perk"><b>Affinity</b> · ${c.perk}</div></div></button>`).join('');
function renderLook(){$('#lookAv').innerHTML=pxAvatar(look,{},'0 0 240 520',84,182);$('#swSkin').innerHTML=SKINS.map((c,i)=>`<button data-skin="${i}" class="${look.skin===i?'on':''}" style="background:${c}" aria-label="${SKIN_NAMES[i]} finish" aria-pressed="${look.skin===i}"></button>`).join('')}
$('.lookbox').addEventListener('click',e=>{const b=e.target.closest('button[data-skin]');if(!b)return;look.skin=+b.dataset.skin;SND.tick();renderLook()});renderLook();
const canEnter=()=>{$('#enterBtn').disabled=!(pick&&$('#csIn').value.trim().length>=2)};
$('#classes').addEventListener('click',e=>{const b=e.target.closest('[data-cls]');if(!b)return;pick=b.dataset.cls;$$('.cls').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',x===b)});SND.tick();canEnter();if(!$('#csIn').value)$('#csIn').focus({preventScroll:matchMedia('(max-width:1000px)').matches})});
$('#csIn').addEventListener('input',canEnter);$('#csIn').addEventListener('keydown',e=>{if(e.key==='Enter'&&!$('#enterBtn').disabled)$('#enterBtn').click()});
$('#enterBtn').onclick=()=>{try{if(S)localStorage.setItem(Store.KEY+'.previous',JSON.stringify(S))}catch(e){}S=Store.fresh($('#csIn').value.trim().slice(0,18),pick,{...look});save();Pilot.track('create',pick);SND.chord();enterWorld(true)};
let visitLogged=false;
const inView=k=>{const [x,y]=zoneXY(k);return x>60&&x<W-60&&y>100&&y<H-100};
const firstCue=()=>inView(ISSUE.lead)?ISSUE.lead:(zoneOrder().reverse().find(k=>published(k)&&k!=="portland"&&inView(k))||"portland");
function enterWorld(first){W=innerWidth||W;H=innerHeight||H;Topo.size();$('#title').classList.add('off');$('#create').classList.add('off');document.body.classList.add('in-world');
  if(!visitLogged){visitLogged=true;S.visits=(S.visits||0)+1;save();Pilot.track('visit')}
  vb=fitTo(900,-40,1300,320,0);apply();renderAuras();renderTrail();refresh();SND.set(ZONES[S.zone].scene);publishPresence();pushBoard();
  if(deep){const d=deep;deep=null;setTimeout(()=>{if(ZONES[d])enterZone(d);else{setIris(W/2,H/2);openBook(d,0)}},700);return}
  setTimeout(()=>flyTo(home(),2600).then(()=>{
    if(first){hint('Every mark is a story. All of them are open.');showCard(firstCue(),matchMedia('(hover: none)').matches||W<760);setTimeout(()=>hint(''),9000)}
    else renderDispatch()}),300)}

Pilot.setSink(()=>db?{db}:null);
Topo.init($('#topo'),()=>({vb,s}));
renderTitle();vb=fitTo(900,-40,1300,320,0);apply();renderAuras();updOnline();
if(location.hash==='#pilot')openPrivacy();
window.__Q={get S(){return S},openBook,enterZone,CHAPTERS,save,refresh,Pilot};
})();
document.addEventListener('playing',e=>{if(e.target.tagName==='VIDEO')e.target.classList.add('on')},true);

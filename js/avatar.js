/* QUEST · js/avatar.js — the faceless mannequin and how each piece of gear is drawn on it. */
window.QUEST = window.QUEST || {};
(function (Q) {
const {SKINS,HCOL,CHARMGLYPH,RELIC}=Q;
function avatarInner(look,eq,opt={}){
  look=look||{skin:1,hair:0,hc:0};eq=eq||{};const G=!!opt.ghost;const sk=G?'transparent':(SKINS[look.skin]||SKINS[1]),hc=HCOL[look.hc]||HCOL[0],hair='none';
  const top=eq.Body,legs=eq.Legs,feet=eq.Feet,head=eq.Head,tool=eq.Tool,charm=eq.Charm;
  const wet=top==='wetsuit'||top==='blazer';const COLS={whiteshirt:'#F2F0EA',campuffer:'url(#camo)'};
  const puf=top==='puffer'||top==='campuffer';const topFill=top==='knit'?'url(#rib)':top==='camo'?'url(#camo)':COLS[top]?COLS[top]:wet?(top==='blazer'?'#121212':'#141414'):puf?'#E6DECD':(G?'transparent':'#ECEAE4');
  const longSleeve=!!top;
  const pantCol=(wet&&top==='wetsuit')||legs==='trousers'?'#111':legs==='liner'?'url(#quilt)':(G?'transparent':'#3A3A3A');
  const pantEnd=legs==='liner'&&!wet?444:462, pantW=legs==='liner'&&!wet?36:30;
  let s='';
  if(!G)s+=`<ellipse cx="120" cy="500" rx="74" ry="9" fill="rgba(255,255,255,.05)"/>`;
  if(!G&&hair==='long'&&head!=='buckethat'&&head!=='beanie')s+=`<path d="M93 72Q90 38 120 36Q150 38 147 72L154 156Q120 166 86 156Z" fill="${hc}"/>`;
  if(!G&&hair==='long'&&(head==='buckethat'||head==='beanie'))s+=`<path d="M95 70L90 150Q120 160 150 150L145 70Z" fill="${hc}"/>`;
  // legs
  s+=`<path d="M107 284L103 470M133 284L137 470" stroke="${sk}" stroke-width="22" stroke-linecap="round" fill="none"/>`;
  s+=`<path d="M78 244L162 244L166 292L74 292Z" fill="${pantCol}"/>`;
  s+=`<path d="M106 270L102 ${pantEnd}M134 270L138 ${pantEnd}" stroke="${pantCol}" stroke-width="${pantW}" fill="none"/>`;
  if(legs==='liner'&&!wet)s+=`<path d="M84 ${pantEnd}H120M120 ${pantEnd}H156" stroke="#6F7233" stroke-width="3"/>`;
  // shoes
  const sh=feet==='yellowsneak'?['#E8C21E','#F2F0EA']:feet==='linqslide'||feet==='linqrunner'?['#F2F1EC','#1a1a1a']:feet==='runners'?['#9AA0A8','#4F6E8A']:feet==='lowtops'?['#F2F1EC','#BDBBB4']:(G?['transparent','transparent']:['#202020','#3a3a3a']);
  s+=`<path d="M88 466Q84 492 104 494L120 494Q124 480 117 464Z" fill="${sh[0]}"/><path d="M152 466Q156 492 136 494L120 494Q116 480 123 464Z" fill="${sh[0]}"/><path d="M86 488Q100 497 120 494M154 488Q140 497 120 494" stroke="${sh[1]}" stroke-width="4" fill="none"/>`;
  if(feet==='runners')s+=`<path d="M96 478L112 474M144 478L128 474" stroke="#4F6E8A" stroke-width="2"/>`;
  // arms skin
  s+=`<path d="M80 138Q64 214 62 292M160 138Q176 214 178 292" stroke="${sk}" stroke-width="17" stroke-linecap="round" fill="none"/><circle cx="62" cy="298" r="9.5" fill="${sk}"/><circle cx="178" cy="298" r="9.5" fill="${sk}"/>`;
  // neck
  s+=`<rect x="111" y="96" width="18" height="34" rx="7" fill="${sk}"/>`;
  // torso
  const tp=puf?'M62 130Q120 108 178 130L172 266Q120 280 68 266Z':top==='knit'?'M70 132Q120 112 170 132L166 274Q120 284 74 274Z':'M74 132Q120 116 166 132L158 256Q120 266 82 256Z';
  s+=`<path d="${tp}" fill="${topFill}"/>`;
  if(longSleeve)s+=`<path d="M80 136Q64 214 62 ${top==='knit'||puf?288:284}M160 136Q176 214 178 ${top==='knit'||puf?288:284}" stroke="${topFill}" stroke-width="${puf?34:top==='knit'?27:24}" stroke-linecap="round" fill="none"/>`;
  else s+=`<path d="M80 134Q73 158 71 176M160 134Q167 158 169 176" stroke="${topFill}" stroke-width="27" stroke-linecap="round" fill="none"/>`;
  if(top==='knit')s+=`<path d="M74 266Q120 278 166 266" stroke="#93A386" stroke-width="10" fill="none"/><path d="M104 124Q120 134 136 124" stroke="#93A386" stroke-width="6" fill="none"/>`;
  if(top==='camo')s+=`<path d="M120 126V258" stroke="#1d241a" stroke-width="2"/><path d="M98 120L120 140L142 120" stroke="#26301F" stroke-width="7" fill="none"/>`;
  if(puf)s+=`<path d="M68 168Q120 178 172 168M68 206Q120 216 172 206M70 242Q120 252 170 242" stroke="#CFC6B3" stroke-width="2" fill="none"/><rect x="82" y="182" width="24" height="18" rx="2" fill="none" stroke="#CFC6B3"/><rect x="134" y="182" width="24" height="18" rx="2" fill="none" stroke="#CFC6B3"/><path d="M120 124V268" stroke="#CFC6B3" stroke-width="2"/><path d="M98 118Q120 112 142 118L138 132Q120 128 102 132Z" fill="#E08A1E"/>`;
  if(top==='blazer')s+=`<path d="M104 120L120 176L136 120Z" fill="#F2F0EA"/><path d="M100 122L118 196M140 122L122 196" stroke="#2a2a2a" stroke-width="2" fill="none"/>`;
  else if(wet)s+=`<path d="M104 118Q120 128 136 118" stroke="#2a2a2a" stroke-width="7" fill="none"/><path d="M78 190L162 188" stroke="#262626" stroke-width="2"/>`;
  if(!top&&!G)s+=`<path d="M106 122Q120 132 134 122" stroke="#d6d3cc" stroke-width="3" fill="none"/>`;
  // tool (behind/near hands)
  if(tool==='weightbelt')s+=`<path d="M78 250Q120 262 162 250" stroke="#1d1d1d" stroke-width="11" fill="none"/><rect x="90" y="248" width="10" height="12" fill="#6a6a6a"/><rect x="140" y="248" width="10" height="12" fill="#6a6a6a"/><rect x="114" y="250" width="12" height="11" fill="#9a9a9a"/>`;
  if(tool==='fieldbag')s+=`<path d="M84 132L156 258" stroke="#2E2E2E" stroke-width="5"/><rect x="142" y="246" width="34" height="28" rx="4" fill="#3C3B38"/>`;
  // head
  s+=`<ellipse cx="120" cy="74" rx="21" ry="29" fill="${sk}"/>${G?"":`<ellipse cx="112" cy="66" rx="7" ry="13" fill="rgba(255,255,255,.18)"/><path d="M120 50V100" stroke="rgba(0,0,0,.12)" stroke-width="1"/>`}`;
  if(false)s+=`<path d="M107 79Q111 82 115 79M125 79Q129 82 133 79" stroke="#2a201b" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M106 71Q111 68 116 70M124 70Q129 68 134 71" stroke="${hc}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M120 82L118 90Q120 92 122 91" stroke="rgba(0,0,0,.2)" stroke-width="1.2" fill="none"/><path d="M113 96Q120 99 127 96" stroke="#8c4a44" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  if(head==='beanie'){s+=`<path d="M96 70Q96 40 120 39Q144 40 144 70Z" fill="#A4532A"/><rect x="94" y="62" width="52" height="12" rx="4" fill="#8E4523"/><path d="M102 46V62M110 42V62M120 40V62M130 42V62M138 46V62" stroke="#8E4523" stroke-width="1.4"/>`}
  else if(head!=='buckethat'){if(!G){
    if(hair==='crop')s+=`<path d="M96 74Q95 44 120 43Q146 44 145 74Q142 58 128 55Q112 56 100 62Z" fill="${hc}"/>`;
    if(hair==='long')s+=`<path d="M96 76Q94 42 120 42Q147 42 145 76Q138 56 120 54Q104 56 96 76Z" fill="${hc}"/>`;
    if(hair==='bun')s+=`<circle cx="120" cy="38" r="12" fill="${hc}"/><path d="M97 72Q96 46 120 46Q145 46 144 72Q138 56 120 55Q103 56 97 72Z" fill="${hc}"/>`;
  }} else {
    s+=`<path d="M97 60Q99 32 120 31Q141 32 143 60Z" fill="url(#denim)"/><ellipse cx="120" cy="61" rx="40" ry="10" fill="url(#denim)"/><path d="M80 61Q120 72 160 61" stroke="#4f6c96" stroke-width="2" fill="none"/><rect x="111" y="42" width="18" height="8" rx="2" fill="#E8E6E0"/><rect x="141" y="50" width="4" height="7" fill="#1d2a40"/>`;
  }
  // hand tools in front
  if(tool==='speargun')s+=`<path d="M150 336L232 150" stroke="#7A5230" stroke-width="5" stroke-linecap="round"/><path d="M232 150L238 128" stroke="#c9c9c9" stroke-width="1.6"/><circle cx="222" cy="174" r="7" fill="#E8C547"/><circle cx="178" cy="298" r="9.5" fill="${sk}"/>`;
  if(tool==='catchbag')s+=`<path d="M62 304Q44 330 50 372Q62 386 78 372Q82 330 62 304Z" fill="url(#net)" stroke="#cfcfcf" stroke-width="1.2"/><circle cx="62" cy="298" r="9.5" fill="${sk}"/>`;
  if(tool==='cooler')s+=`<rect x="160" y="300" width="62" height="46" rx="5" fill="#ECE7DC"/><rect x="160" y="300" width="62" height="10" rx="4" fill="#D8D1C2"/><path d="M178 300V290H204V300" stroke="#222" stroke-width="3" fill="none"/><circle cx="178" cy="298" r="9.5" fill="${sk}"/>`;
  if(tool==='skillet')s+=`<path d="M196 300L224 318L238 346L228 372L196 380L168 368L162 340L172 312Z" fill="#1d1d1d"/><path d="M178 298L196 310" stroke="#333" stroke-width="6"/><circle cx="200" cy="344" r="4" fill="#E2533A"/><circle cx="214" cy="336" r="4" fill="#1a1a2a"/><circle cx="190" cy="356" r="4" fill="#E2533A"/><circle cx="178" cy="298" r="9.5" fill="${sk}"/>`;
  if(tool==='rig')s+=`<rect x="160" y="214" width="16" height="96" rx="3" fill="#5c5f66" transform="rotate(-8 168 262)"/><circle cx="178" cy="298" r="9.5" fill="${sk}"/>`;
  if(charm){const gi=CHARMGLYPH[charm]??3;s+=`<g transform="translate(166 18) scale(.42)" style="color:#BEFF00">${RELIC[gi]()}</g>`}
  return s}
const avatarSVG=(look,eq,vb='0 0 240 520')=>`<svg viewBox="${vb}" aria-hidden="true" style="filter:drop-shadow(0 0 1px rgba(243,241,236,.55)) drop-shadow(0 0 10px rgba(243,241,236,.06))">${avatarInner(look,eq)}</svg>`;
Q.avatarInner=avatarInner;Q.avatarSVG=avatarSVG;
})(window.QUEST);

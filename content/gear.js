/* QUEST · content/gear.js
   Everything an explorer can wear or carry.
   ITEMS  slot, r (rarity 1-4), st (stats), look (chapter whose look photo shows it) + x,y (% position in that photo),
          d (description), f (spec). Optional: brand, ph [image, object-position], life.
   LOOKS  the look photograph for each chapter. CHARMGLYPH maps charm items to a glyph in js/relics.js. */
window.QUEST = window.QUEST || {};
(function (Q) {
Q.RAR=['','Common','Rare','Epic','Legendary'];
Q.SLOTS=['Head','Body','Legs','Feet','Tool','Charm'];
Q.ITEMS={
  wetsuit:{t:'Open-cell freediving wetsuit',slot:'Body',r:3,st:{END:3},look:'catalina',x:44,y:47,d:'A two-piece black suit for long breath-holds in Catalina kelp. Warmth without bulk is the standard.',f:'Freediving, spearfishing · Black'},
  speargun:{t:'Speargun with reel',slot:'Tool',r:2,st:{FOC:2},look:'catalina',x:76,y:54,d:'A wooden-stock gun with a line reel at the muzzle. Check the regulations before every dive.',f:'Wood stock · Front reel'},
  weightbelt:{t:'Weight belt',slot:'Tool',r:1,st:{END:1},look:'catalina',x:57,y:61,d:'Rubber belt and lead, trimmed so you settle at neutral without fighting the water.',f:'Buoyancy'},
  catchbag:{t:'Mesh catch bag',slot:'Tool',r:1,st:{CRF:1},look:'catalina',x:24,y:88,d:'Open mesh that drains fast. Same day, same boat, straight to ceviche.',f:'Catch, gear'},
  camo:{t:'Digital camo jacket',slot:'Body',r:3,st:{STY:2,FOC:1},look:'trillium',x:30,y:80,d:'A pixel-camo shell that disappears into the treeline after dark and catches colour under the aurora.',f:'Digital camo · Wind shell'},
  buckethat:{t:'Washed denim bucket hat',slot:'Head',r:2,st:{STY:2},look:'silverfalls',x:48.5,y:35,d:'Soft, faded denim with a stitched front badge and a side tab. Keeps the spray off without a hood.',f:'Washed cotton denim · Front patch'},
  knit:{t:'Sage fisherman knit',slot:'Body',r:1,st:{END:1,STY:1},look:'silverfalls',x:46,y:52,d:'An oversized rib-knit crew in muted sage. Warm under the falls and roomy enough to move in.',f:'Chunky rib · Oversized'},
  liner:{t:'Olive quilted liner pants',slot:'Legs',r:2,st:{CRF:1,END:1},look:'silverfalls',x:48,y:70,d:'Onion-quilted liners in olive, borrowed from military kit. They turn up again at Autzen.',f:'Quilted nylon · Relaxed, cropped'},
  runners:{t:'Grey trail runners',slot:'Feet',r:2,st:{END:2},look:'silverfalls',x:51,y:84,d:'Grey and slate runners with real grip, needed on the wet basalt behind South Falls.',f:'Trail, wet rock · Grey / slate'},
  rig:{t:'Laptop rig',slot:'Tool',r:2,st:{CRF:2},look:'eugene',x:33,y:41,d:'The whole set runs from one laptop on the sideline wall, facing the field.',f:'DJ rig, cues'},
  lowtops:{t:'White low-top sneakers',slot:'Feet',r:1,st:{STY:1},look:'eugene',x:42,y:90,d:'Clean white low-tops for the sideline. Easy to move in, easy to spot.',f:'White / grey'},
  fieldbag:{t:'Field bag',slot:'Tool',r:1,st:{CRF:1},look:'eugene',x:4,y:86,d:'A soft carryall for cables, chargers and a spare battery.',f:'Cables, power'},
  puffer:{t:'Cream expedition puffer',slot:'Body',r:3,st:{END:2,STY:2},look:'coast',x:40,y:42,d:'Boxy, cream, four front pockets. Warm enough for an hour on wet rock at low tide. From the Columbia shoot on the Oregon coast.',f:'Down fill · Columbia'},
  beanie:{t:'Rust rib beanie',slot:'Head',r:1,st:{STY:1},look:'coast',x:60,y:29,d:'A short rib-knit watch cap in rust. The coast in one colour.',f:'Rib knit · Rust'},
  cooler:{t:'Hard-side cooler',slot:'Tool',r:2,st:{CRF:1,END:1},look:'coast',x:61,y:73,d:'Ice for the catch on the walk back to the fire. Shellfish go on ice straight from the rock.',f:'Hard-side · Bone'},
  skillet:{t:'Octagonal cast-iron skillet',slot:'Tool',r:3,st:{CRF:3},look:null,d:'Handled cast iron that goes straight onto beach coals. Mussels, seaweed, lemon, done.',f:'Cast iron · Coil handles'},
  blazer:{t:'Black tailored jacket',slot:'Body',r:3,st:{STY:3},look:'shanghai',x:44,y:47,life:'tbc',d:'Single-breasted, soft shoulder, worn open over a white shirt. Built for a city at dawn.',f:'Wool blend · Black'},
  whiteshirt:{t:'White camp-collar shirt',slot:'Body',r:1,st:{STY:1},look:'shanghai',x:52,y:38,life:'tbc',d:'Crisp white, open collar, no tie. The base of every Shanghai look.',f:'Cotton poplin · White'},
  trousers:{t:'Black wide trousers',slot:'Legs',r:2,st:{STY:2},look:'shanghai',x:38,y:70,life:'tbc',d:'High rise, wide leg, a clean break over the shoe.',f:'Wool blend · Black'},
  yellowsneak:{t:'Yellow court sneakers',slot:'Feet',r:2,st:{STY:1,END:1},look:'shanghai',x:6,y:97,life:'tbc',d:'The single hit of colour against black and white.',f:'Leather · Yellow'},
  campuffer:{t:'Camo down hoodie',slot:'Body',r:3,st:{END:3},look:'troutlake',x:50,y:82,life:'tbc',d:'Packable down in a woodland camo, hood up for the forest and the cave.',f:'Down fill · Woodland camo'},
  linqslide:{t:'LINQ recovery slide',slot:'Feet',r:3,st:{END:2,STY:1},look:null,brand:'LINQ',ph:['img/sh-lace.jpg','50% 72%'],life:'shop',d:'The LINQ slide: cushioned, closed-heel, made for the walk after the work. Worn on the Bund and in the creek at Trout Lake.',f:'Molded foam · White / black'},
  linqrunner:{t:'LINQ slip-on, white',slot:'Feet',r:2,st:{END:1,STY:2},look:null,brand:'LINQ',ph:['img/sh-stride.jpg','55% 78%'],life:'shop',d:'Sock-fit slip-on with a sculpted sole. City miles, no laces.',f:'Knit upper · White'},
  atom:{t:'The atom',slot:'Charm',r:2,st:{FOC:1,STY:1},look:null,d:'A relic charm from the Quest graphics sheet. It orbits whoever earns it.',f:'Charm'},
  globe:{t:'The wireframe globe',slot:'Charm',r:4,st:{END:2,STY:2,CRF:2,FOC:2},look:null,d:'The legendary charm, earned across the Pacific.',f:'Charm · Legendary'},
  truenorth:{t:'True north',slot:'Charm',r:3,st:{FOC:3},look:null,d:'For the explorer who found the compass’s secret.',f:'Charm'}
};
Q.LOOKS={shanghai:{img:'img/sh-bench.jpg',ar:'4/5'},troutlake:{img:'img/cab-portrait.jpg',ar:'2/3'},coast:{img:'img/coast-cooler.jpg',ar:'4/5'},catalina:{img:'img/spear-ready.jpg',ar:'2/3'},trillium:{img:'img/night-portrait.jpg',ar:'2/3'},silverfalls:{img:'img/sf-cafe-2.jpg',ar:'16/9'},eugene:{img:'img/oregon-booth.jpg',ar:'3/4'}};
Q.CHARMGLYPH={atom:3,globe:15,truenorth:16,skillet:2};
})(window.QUEST);

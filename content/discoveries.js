/* QUEST · content/discoveries.js
   Things a curious reader can find. None of it is required, none of it is announced.
   Every note below is drawn from copy that already exists in the issue. Do not invent facts here.
   See README.md § Adding a discovery. */
window.QUEST = window.QUEST || {};
(function (Q) {

/* DETAILS — an unmarked point inside a photograph.
   ch : chapter id      img : the image file (the point appears wherever that file is shown in the chapter)
   x,y: position inside the photograph, 0–1 from its top-left corner
   t  : title           note: what the reader learns */
Q.DETAILS = [
  { id: 'd-callisto', ch: 'catalina',    img: 'img/callisto.jpg',    x: .86, y: .835, t: 'The Callisto',        note: 'Her name is on the stern. A classic sloop. It only moves when everyone does their job unasked.' },
  { id: 'd-catch',    ch: 'catalina',    img: 'img/catch.jpg',       x: .52, y: .62, t: 'Same day',             note: 'Take only what you’ll eat the same day. This one became Kolten’s ceviche, eaten on deck under the anchor light.' },
  { id: 'd-green',    ch: 'trillium',    img: 'img/aurora-hood.jpg', x: .50, y: .63, t: 'Green at the horizon', note: 'To the eye it started as a grey smear. The camera saw this first; thirty seconds later our eyes caught up.' },
  { id: 'd-curtain',  ch: 'silverfalls', img: 'img/sf-duo.jpg',      x: .30, y: .74, t: 'Behind the curtain',   note: 'Stop here for one full minute. No phones under the spray.' },
  { id: 'd-field',    ch: 'eugene',      img: 'img/oregon-booth.jpg',x: .47, y: .40, t: 'One laptop',           note: 'The whole set runs from one laptop on the sideline wall, facing the field. Watch the players, not the screen.' },
  { id: 'd-arch',     ch: 'coast',       img: 'img/coast-cave.jpg',  x: .50, y: .30, t: 'The arch',             note: 'The sea only lets you in for a couple of hours a day. Forage on a falling tide and watch your exit.' },
  { id: 'd-bridge',   ch: 'shanghai',    img: 'img/sh-bridge.jpg',   x: .50, y: .22, t: 'Waibaidu Bridge',      note: 'The old steel truss over Suzhou Creek, at the north end of the Bund. Stop halfway. Look back.' },
  { id: 'd-pot',      ch: 'troutlake',   img: 'img/cab-pot.jpg',     x: .50, y: .50, t: 'One pot',              note: 'Jambalaya for the whole cabin, scallions cut on the counter. Cook slow, feed everyone.' },
  { id: 'd-mark',     ch: 'portland',    img: 'img/cover-film.jpg',  x: .77, y: .36, t: 'The mark in the sky',  note: 'Create. Explore. Evolve.' }
];

/* THREADS — a connection between two chapters. Shown at the end of each. */
Q.THREADS = [
  { id: 't-liner', a: 'silverfalls', b: 'eugene',    t: 'The olive liner pants', d: 'Onion-quilted, borrowed from military kit. Worn at Silver Falls; they turn up again at Autzen.' },
  { id: 't-slide', a: 'shanghai',    b: 'troutlake', t: 'The LINQ slide',        d: 'Made for the walk after the work. Worn on the Bund and in the creek at Trout Lake.' },
  { id: 't-catch', a: 'catalina',    b: 'coast',     t: 'Eaten the same day',    d: 'Ceviche on deck at anchor; mussels in cast iron on the sand. Take only what you’ll eat that day.' },
  { id: 't-dark',  a: 'trillium',    b: 'troutlake', t: 'Two kinds of dark',     d: 'Under the aurora, a red headlamp only. In the lava tube, two lights each, always.' },
  { id: 't-first', a: 'shanghai',    b: 'silverfalls', t: 'Before anyone else',  d: 'The Bund before sunrise. South Falls at first light, before the trail fills.' }
];

/* OUTTAKES — frames and film kept back for readers who reach the end of a chapter.
   items: [file, caption]   video: [file, caption] */
Q.OUTTAKES = {
  catalina: { t: 'Off the stern', items: [['img/anchorage-1.jpg', 'At anchor'], ['img/deck.jpg', 'On deck'], ['img/dinghy.jpg', 'The dinghy'], ['img/wetsuit.jpg', 'Suited up'], ['img/swim-spear.jpg', 'In the water'], ['img/swim-wave.jpg', 'Open water'], ['img/cabins.jpg', 'From the water']] },
  coast: { t: 'Pink hour', video: ['vid/coast-pink.mp4', 'An unused take from the coast shoot'] },
  silverfalls: { t: 'At the cafe', items: [['img/sf-portrait.jpg', 'After the loop']] },
  kit: { t: 'The workshop floor', items: [['img/fw-table.jpg', 'LINQ workshop'], ['img/fw-rows-selfie.jpg', 'LINQ workshop']] }
};

})(window.QUEST);

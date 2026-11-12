/* QUEST · js/pilot.js
   Pilot observations for the first 25–50 explorers. Deliberately small.

   What is recorded: a short list of event names with a time and, at most, a chapter or item id.
     create · visit · zone_first · feature_open · chapter_end · interaction · find · save · share · quest_log
   What is never recorded: callsign, free text, location, device details, anything typed.

   Where it goes
     1. Always: this browser's localStorage (key quest.pilot.v1). Nothing else, by default.
     2. Only if a sink exists AND the explorer has left sharing on: a single summary row
        (counts and chapter ids, keyed by a random id made in this browser).
        Sinks: the published page's database, or QUEST.PILOT_ENDPOINT below.
   With no sink, nothing leaves the device, and the privacy panel says so. */
window.QUEST = window.QUEST || {};
(function (Q) {

Q.PILOT_ENDPOINT = '';   // optional: an https URL that accepts a JSON POST. Empty = off.

const KEY = 'quest.pilot.v1';
let P = null;
try { P = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
if (!P || !P.id) P = { id: 'x' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4), share: true, ev: [], first: Date.now() };
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} };

let sink = null, pushT = 0;
const day = ts => new Date(ts).toISOString().slice(0, 10);
const of = n => P.ev.filter(e => e[0] === n);
const uniq = a => [...new Set(a)];

function track(name, prop) {
  P.ev.push([name, Date.now(), prop || '']);
  if (P.ev.length > 500) P.ev.splice(0, P.ev.length - 500);
  persist();
  clearTimeout(pushT); pushT = setTimeout(push, 4000);
}
/* record once per (name, prop) */
function once(name, prop) { if (P.ev.some(e => e[0] === name && e[2] === (prop || ''))) return false; track(name, prop); return true; }
/* record only the very first occurrence of name */
function first(name, prop) { if (of(name).length) return false; track(name, prop); return true; }

function summary() {
  const days = uniq(of('visit').map(e => day(e[1])));
  return {
    created: of('create').length > 0,
    firstZone: (of('zone_first')[0] || [])[2] || '',
    opened: uniq(of('feature_open').map(e => e[2])),
    finished: uniq(of('chapter_end').map(e => e[2])),
    interactions: of('interaction').length,
    finds: of('find').length,
    saves: of('save').length,
    shares: of('share').length,
    quests: of('quest_log').length,
    visits: of('visit').length,
    days: days.length,
    returned: days.length > 1,
    first: P.first,
    at: Date.now()
  };
}
function target() { const s = sink ? sink() : null; return s && s.db ? s : null; }
function hasSink() { return !!(target() || Q.PILOT_ENDPOINT); }
function push() {
  if (!P.share) return;
  try {
    const s = target();
    if (s) s.db.collection('pilot').doc(P.id).set(summary()).catch(() => {});
    else if (Q.PILOT_ENDPOINT && navigator.sendBeacon) navigator.sendBeacon(Q.PILOT_ENDPOINT, JSON.stringify({ id: P.id, ...summary() }));
  } catch (e) {}
}

Q.Pilot = {
  track, once, first, summary, hasSink, push,
  setSink(fn) { sink = fn; },
  get sharing() { return P.share; },
  set sharing(v) { P.share = !!v; persist(); },
  get id() { return P.id; },
  export() { return JSON.stringify({ id: P.id, first: P.first, sharing: P.share, events: P.ev.map(e => ({ name: e[0], at: new Date(e[1]).toISOString(), ref: e[2] })) }, null, 2); },
  erase() { P.ev = []; persist(); const s = target(); if (s) { try { s.db.collection('pilot').doc(P.id).set({ erased: true, at: Date.now() }).catch(() => {}); } catch (e) {} } },
  /* all summaries, for whoever is running the pilot on the published page */
  watchAll(cb) { const s = target(); if (!s) return false; try { s.db.collection('pilot').orderBy('at', 'desc').limit(100).onSnapshot(sn => cb(sn.docs.map(d => d.data())), () => {}); return true; } catch (e) { return false; } }
};
})(window.QUEST);

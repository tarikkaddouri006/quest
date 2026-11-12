/* QUEST · js/store.js
   Explorer save: load, migrate, write. Browser-local (localStorage).
   The key has never changed, so saves from the first prototype keep working.
   Schema history
     v1/v2  name, cls, look, xp, zone, acc, done, inv, equip, seenInv, secret, created, (zonesSeen, skills, qt)
     v3     + j (journal: read, saved, found, threads, trail), last, visits, seenUpdates, prefs
   Add a step to migrate() whenever the shape changes. Never rename KEY. */
window.QUEST = window.QUEST || {};
(function (Q) {
const KEY = 'quest.game.v1', BAK = 'quest.game.v1.backup', V = 3;
const today = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };

function migrate(s) {
  if (!s || typeof s !== 'object' || !s.name || !Q.CLASSES[s.cls]) return null;
  const from = s.v || 1;
  if (from < V) { try { if (!localStorage.getItem(BAK)) localStorage.setItem(BAK, JSON.stringify(s)); } catch (e) {} }
  s.look = s.look || { skin: 1, hair: 0, hc: 0 };
  s.xp = +s.xp || 0; s.qt = +s.qt || 0;
  s.acc = s.acc || {}; s.done = s.done || []; s.inv = s.inv || []; s.equip = s.equip || {}; s.skills = s.skills || {};
  if (!Q.ZONES[s.zone]) s.zone = 'portland';
  s.created = s.created || Date.now();
  const j = s.j = s.j || {};
  j.read = j.read || {}; j.saved = j.saved || []; j.found = j.found || []; j.threads = j.threads || []; j.trail = j.trail || [];
  if (from < 3) {
    (s.zonesSeen || []).forEach(z => { if (Q.ZONES[z] && !j.trail.includes(z)) j.trail.push(z); });
    delete s.zonesSeen;
    s.seenUpdates = '';            // a returning explorer has not seen anything added since the prototype
  }
  if (typeof s.seenUpdates !== 'string') s.seenUpdates = today();
  s.visits = s.visits || 0;
  s.prefs = s.prefs || { sound: true };
  s.v = V;
  return s;
}

Q.Store = {
  KEY, V, migrate, today,
  load() { try { return migrate(JSON.parse(localStorage.getItem(KEY))); } catch (e) { return null; } },
  save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} },
  fresh(name, cls, look) {
    return migrate({ v: V, name, cls, look, xp: 0, zone: 'portland', acc: {}, done: [], inv: [], equip: {}, seenInv: 0, secret: false, created: Date.now(), seenUpdates: today() });
  }
};
})(window.QUEST);

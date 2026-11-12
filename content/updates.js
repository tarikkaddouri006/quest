/* QUEST · content/updates.js
   The editorial log. Add an entry here whenever something real is published:
   a destination, a film, a field note, an outtake, a collectible.
   Returning explorers see anything dated after their last visit. Nothing here is generated.

   { id, date: 'YYYY-MM-DD', kind, t: title, d: one line, go: ['chapterId', 'spread'] | null }

   There is no schedule. An issue grows when there is something worth adding. */
window.QUEST = window.QUEST || {};
window.QUEST.UPDATES = [
  { id: 'u-outtakes-catalina', date: '2026-11-11', kind: 'Outtakes', t: 'Off the stern', d: 'Seven unused frames from the Catalina crossing, kept for anyone who reads to the end.', go: ['catalina', 'end'] },
  { id: 'u-film-pink', date: '2026-11-11', kind: 'Film', t: 'Pink hour', d: 'An unused take from the coast shoot, at the end of Ready to Roam.', go: ['coast', 'end'] },
  { id: 'u-field-notes', date: '2026-11-11', kind: 'Field notes', t: 'Nine details, hidden in the photographs', d: 'Look closer. What you find is kept in your journal.', go: null }
];

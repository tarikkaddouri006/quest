# QUEST — Issue 01

Read it. Then go and live it.

A static site: no build step, no dependencies, no server code. Open it through any web server.

```bash
ruby -run -e httpd . -p 8766
```

Then visit `http://localhost:8766`. (Opening `index.html` directly from disk also works.)

## Where things live

| Path | What it is |
| --- | --- |
| `index.html` | Markup only. Loads the files below in order. |
| `content/world.js` | The issue, explorer classes, every point on the map. |
| `content/stories.js` | Every chapter of the guide and how each is art-directed. |
| `content/quests.js` | Optional real-world quests and the skills they train. |
| `content/gear.js` | Wearable items and the look photographs. |
| `content/discoveries.js` | Hidden details, threads between chapters, outtakes. |
| `content/updates.js` | The editorial log: what was added, and when. |
| `content/map.js` | Coastlines of the base map. |
| `js/app.js` | Interface: map, guidebook, journal, lookbook. No content. |
| `js/store.js` | Explorer save, with migrations. |
| `js/pilot.js` | Pilot observations and privacy controls. |
| `js/atmosphere.js` `js/sound.js` `js/avatar.js` `js/relics.js` | Contours and daylight, soundscape, mannequin, glyphs. |
| `css/quest.css` `css/experience.css` | Original design system; everything added since. |
| `_archive/index.prototype.html` | The original single-file prototype, untouched. |

Content files are plain data. Edit, save, reload.

## Adding to the world

**A destination and its story**

1. In `content/world.js`, add an entry to `ZONES` with `status: 'published'`, coordinates, timezone, a `mark` (glyph index), a `tag` and a one-line `line`.
2. In `content/stories.js`, add a chapter with the same `id` and `kind: 'feature'`. Give it `hero`, `verdict`, `story`, and an `art` block choosing an `opener` and the `order` of spreads. The header comment lists every spread type.
3. Add a dated line to `content/updates.js`. Returning explorers will see it marked new on the map.

To announce a place before its story exists, use `status: 'territory'` and a chapter of `kind: 'fog'` with a `teaser`. Switch both when it is ready.

**A film** — set `edit: [file, title, description, runtime, 'v' or 'h']` on a chapter and include `'film'` in its `art.order`. For a full-bleed moving opener use `art: { opener: 'film', bg: 'vid/…' }`.

**A photograph as its own page** — add to the chapter's `plates: [{ img, lab, cap }]` and put `'plate0'`, `'plate1'`… in `art.order`.

**A hidden detail** — in `content/discoveries.js`, add to `DETAILS`: the chapter, the image file, and `x`, `y` as fractions of the photograph (0–1 from top-left). It appears wherever that image is shown in the chapter.

**A thread** between two chapters — add to `THREADS`.

**Outtakes** unlocked by reading to the end — add to `OUTTAKES` under the chapter id.

**A quest** — add to `QUESTS` in `content/quests.js` (`z` is the destination id; `loot` lists item ids). **A collectible** — add to `ITEMS` in `content/gear.js`.

**An update** — add `{ id, date, kind, t, d, go }` to `content/updates.js`. There is no schedule; add one only when something real ships.

Rule for all of it: do not invent quotes, facts or activity. Field notes and captions in this issue are drawn from the existing copy.

## Saves

Explorers are stored in the browser (`localStorage`, key `quest.game.v1`). The key has never changed, so prototype saves load and are upgraded in place; the pre-upgrade copy is kept under `quest.game.v1.backup`. When the shape of a save changes, add a step to `migrate()` in `js/store.js` and bump `V`.

## Pilot observations

`js/pilot.js` keeps a short local log of event names (explorer created, first destination, chapters opened and finished, interactions, details found, saves, shares, logged quests, visits). No callsign, typed text, location or device data.

- By default nothing leaves the browser.
- On the published page with a database, one summary row per explorer is written under a random id, unless the explorer turns sharing off.
- To send summaries elsewhere, set `QUEST.PILOT_ENDPOINT` in `js/pilot.js` to an HTTPS URL that accepts a JSON POST.
- Explorers reach the disclosure, the toggle, a download and an erase button from **Pilot & privacy** (title screen, journal, explorers panel).
- Add `#pilot` to the URL, or press Shift+P in the world, for this browser's totals and, where a database exists, the totals across explorers.

## Keys

`←` `→` move between destinations on the map, or turn pages in the guide · `Enter` open · `Esc` close · `B` guide · `J` journal · `I` lookbook · `E` explorers · `S` save the page · `+` `−` zoom · `H` home.

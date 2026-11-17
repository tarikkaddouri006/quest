# QUEST — Issue 01

A digital magazine, catalog and open-world guidebook: the best things to do in life, tested in the field.

## What's here

| Path | What it is |
| --- | --- |
| `index.html` | The whole site in one file: title, world map, guidebook, About, catalog, quest log, casting board, skills & tokens. No build step. |
| `guide.html` | Standalone guidebook. |
| `img/` `vid/` `fonts/` | Photos, field footage, the Beon display font. |
| `scripts/serve.rb`, `Start QUEST.command` | Local preview server (double-click on a Mac, or `ruby scripts/serve.rb`). |
| `_archive/` | Earlier prototype. |

## Deploy

Static site. Netlify (or any static host) serves the repo root; pushing to `main` redeploys.

Explorer saves live in the browser (`localStorage`, key `quest.game.v1`).

The modular rebuild (`js/`, `css/`, `content/`) is in the history at commit `bb6d645` if it's needed again.

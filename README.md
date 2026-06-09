# Floodlight — WC2026 Elo Engine + API-Football auto-sync

Self-contained prediction/value tool with a Netlify function that pulls finished
World Cup results and re-rates teams automatically.

## Folder layout
```
floodlight/
├─ index.html                     ← the app (open this / serve at root)
├─ netlify.toml
└─ netlify/functions/
   └─ wc-results.js               ← serverless fetch of finished fixtures
```

## Deploy (GitHub + Netlify auto-deploy)
1. Push this folder to a repo (or drag the folder onto Netlify, but the function
   needs a real deploy — Netlify Drop works too as it bundles functions).
2. In Netlify → Site settings → **Environment variables**, add:
   - `APIFOOTBALL_KEY` = your api-sports.io key  **(required)**
   - `WC_LEAGUE_ID` = `1`     (FIFA World Cup — verify, see below)  *(optional)*
   - `WC_SEASON` = `2026`     *(optional)*
   - `APIFOOTBALL_HOST` = `api-football-v1.p.rapidapi.com` *(only if you use RapidAPI; omit for direct api-sports.io)*
3. Trigger a deploy. Open the site → **Results** tab → **Sync results from API-Football**.

The key never reaches the browser — the client only calls `/.netlify/functions/wc-results`.

## Confirm the league ID
World Cup is usually league `1` on API-Football, but confirm once:
`GET https://v3.football.api-sports.io/leagues?search=world cup` (header `x-apisports-key`).
Find "FIFA World Cup", read its `league.id`, and the 2026 entry under `seasons`.

## How sync behaves
- Fetches every fixture for the league/season, keeps only `FT` / `AET` / `PEN`.
- Applies them **in date order**, skipping any fixture ID already logged (no double-counting).
- `PEN` (shootout) uses the 120-minute score, so it correctly counts as a draw for Elo.
- Hosts (USA/Canada/Mexico) get home advantage when they're the home side, if the
  checkbox is ticked. Everything else is treated as neutral.
- K = 60 (World Cup finals weight).

## Team name aliases
API-Football names that differ from the app are mapped already (Korea Republic,
Türkiye, Czech Republic, Côte d'Ivoire, Congo DR, Curaçao, Bosnia and Herzegovina,
Cape Verde Islands, United States). If sync reports an "Unmatched" team, either add
the alias to the `ALIAS` map in `index.html` or rename the team in the Ratings tab.

## Notes
- Free API-Football tier is ~100 requests/day; the function caches 120s. One tap per
  matchday is plenty.
- Ratings, history and synced-fixture IDs persist in the browser (localStorage) once
  live on Netlify.
- `WC_LEAGUE_ID`/`WC_SEASON` are overridable so you can reuse this for other comps.

// netlify/functions/wc-results.js
// Returns finished 2026 World Cup fixtures from API-Football, key kept server-side.
//
// Required env var:  APIFOOTBALL_KEY   = your api-sports.io (or RapidAPI) key
// Optional env vars:
//   WC_LEAGUE_ID  = 1        (FIFA World Cup; verify via /leagues?search=world cup)
//   WC_SEASON     = 2026
//   APIFOOTBALL_HOST = v3.football.api-sports.io   (default; for RapidAPI use api-football-v1.p.rapidapi.com)

exports.handler = async function () {
  const KEY = process.env.APIFOOTBALL_KEY;
  const LEAGUE = process.env.WC_LEAGUE_ID || "1";
  const SEASON = process.env.WC_SEASON || "2026";
  const HOST = process.env.APIFOOTBALL_HOST || "v3.football.api-sports.io";

  if (!KEY) return json(500, { error: "Missing APIFOOTBALL_KEY env var" });

  const useRapid = HOST.indexOf("rapidapi") > -1;
  const base = useRapid ? `https://${HOST}/v3` : `https://${HOST}`;
  const headers = useRapid
    ? { "x-rapidapi-key": KEY, "x-rapidapi-host": HOST }
    : { "x-apisports-key": KEY };

  const FINISHED = { FT: 1, AET: 1, PEN: 1 };
  let page = 1, totalPages = 1;
  const raw = [];

  try {
    do {
      const url = `${base}/fixtures?league=${LEAGUE}&season=${SEASON}&page=${page}`;
      const r = await fetch(url, { headers });
      const j = await r.json();
      if (j.errors && Object.keys(j.errors).length) {
        return json(502, { error: "API-Football error", detail: j.errors });
      }
      (j.response || []).forEach((x) => raw.push(x));
      totalPages = (j.paging && j.paging.total) || 1;
      page++;
    } while (page <= totalPages && page <= 6);

    const fixtures = raw
      .filter((f) => FINISHED[f.fixture.status.short] &&
                     f.goals.home != null && f.goals.away != null)
      .map((f) => ({
        id: f.fixture.id,
        ts: f.fixture.timestamp,
        status: f.fixture.status.short, // FT / AET / PEN (PEN counts as a draw via 120' score)
        round: f.league.round,
        home: f.teams.home.name,
        away: f.teams.away.name,
        hg: f.goals.home,
        ag: f.goals.away,
      }))
      .sort((a, b) => a.ts - b.ts);

    return json(200, { count: fixtures.length, season: SEASON, fixtures });
  } catch (e) {
    return json(500, { error: String(e && e.message ? e.message : e) });
  }
};

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { "content-type": "application/json", "cache-control": "public, max-age=120" },
    body: JSON.stringify(obj),
  };
}

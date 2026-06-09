// netlify/functions/wc-results.js
// Returns finished 2026 World Cup fixtures from football-data.org (free tier covers the World Cup).
// Same output shape as before, so index.html needs NO changes.
//
// Required env var:  FOOTBALLDATA_TOKEN = your free token from football-data.org
// Optional env vars:
//   FD_COMPETITION = WC      (FIFA World Cup)
//   FD_SEASON      = 2026    (omit to use the current season)

exports.handler = async function () {
  const TOKEN = process.env.FOOTBALLDATA_TOKEN;
  const COMP = process.env.FD_COMPETITION || "WC";
  const SEASON = process.env.FD_SEASON || ""; // blank = current season

  if (!TOKEN) return json(500, { error: "Missing FOOTBALLDATA_TOKEN env var" });

  let url = `https://api.football-data.org/v4/competitions/${COMP}/matches?status=FINISHED`;
  if (SEASON) url += `&season=${SEASON}`;

  try {
    const r = await fetch(url, { headers: { "X-Auth-Token": TOKEN } });
    const j = await r.json();

    if (!r.ok) {
      return json(502, { error: "football-data error", detail: j.message || j });
    }
    const matches = j.matches || [];

    const fixtures = matches
      .filter((m) => m.status === "FINISHED" &&
                     m.score && m.score.fullTime &&
                     m.score.fullTime.home != null && m.score.fullTime.away != null)
      .map((m) => ({
        id: m.id,
        ts: Math.floor(Date.parse(m.utcDate) / 1000),
        status: m.status,
        round: [m.stage, m.group].filter(Boolean).join(" "),
        home: m.homeTeam.name,
        away: m.awayTeam.name,
        hg: m.score.fullTime.home, // shootouts: full-time score is level -> counts as a draw for Elo
        ag: m.score.fullTime.away,
      }))
      .sort((a, b) => a.ts - b.ts);

    return json(200, { count: fixtures.length, fixtures });
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

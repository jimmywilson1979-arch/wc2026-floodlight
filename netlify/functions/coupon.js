// netlify/functions/coupon.js
// Server-side fetch of the oddschecker bumper coupon.
// Bypasses the browser CORS block and adds cache-busting + a real browser UA.
// Returns JSON: { ok, status, length, html } so the front-end can parse + diagnose.

exports.handler = async () => {
  const target =
    'https://www.oddschecker.com/football/bumper-coupon?_=' + Date.now();

  const cors = {
    'access-control-allow-origin': '*',
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
  };

  try {
    const r = await fetch(target, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    const html = await r.text();

    // quick signal of whether the coupon body actually came through
    const hits = (html.match(/View all .+? v .+? odds/g) || []).length;

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({
        ok: r.ok,
        status: r.status,
        length: html.length,
        matches_seen: hits,
        html,
      }),
    };
  } catch (e) {
    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ ok: false, error: String(e && e.message || e) }),
    };
  }
};

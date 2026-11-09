// Cloudflare Worker: secure proxy for TMDB and YouTube.
// API keys live only in Worker secrets (TMDB_API_KEY, YOUTUBE_API_KEY), never in the website.
// Only GET requests from the origins below, and only the listed API paths, are forwarded.
const ALLOWED_ORIGINS = [
  "https://aryanydv9926-crypto.github.io",
  "http://localhost:8000", "http://127.0.0.1:8000",
  "http://localhost:5500", "http://127.0.0.1:5500",
];
const ROUTES = {
  "/tmdb/": { base: "https://api.themoviedb.org/3", keyParam: "api_key", secret: "TMDB_API_KEY",
    paths: [/^\/genre\/movie\/list$/, /^\/search\/keyword$/, /^\/discover\/movie$/, /^\/search\/movie$/, /^\/movie\/\d{1,9}$/, /^\/movie\/\d{1,9}\/videos$/] },
  "/youtube/": { base: "https://www.googleapis.com/youtube/v3", keyParam: "key", secret: "YOUTUBE_API_KEY",
    paths: [/^\/search$/, /^\/videos$/] },
};
const json = (o, status, h) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", ...h } });

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      "Vary": "Origin", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type",
    };
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (req.method !== "GET") return json({ error: "Method not allowed" }, 405, cors);
    if (!ALLOWED_ORIGINS.includes(origin)) return json({ error: "Origin not allowed" }, 403, cors);

    const url = new URL(req.url);
    const prefix = Object.keys(ROUTES).find((p) => url.pathname.startsWith(p));
    if (!prefix) return json({ error: "Not found" }, 404, cors);
    const r = ROUTES[prefix], path = url.pathname.slice(prefix.length - 1);
    if (!r.paths.some((re) => re.test(path))) return json({ error: "Path not allowed" }, 404, cors);
    const secret = env[r.secret];
    if (!secret) return json({ error: "Proxy is not configured: missing " + r.secret }, 500, cors);

    const target = new URL(r.base + path);
    for (const [k, v] of url.searchParams) {
      if (k === "api_key" || k === "key" || v.length > 200) continue;     // never accept a key from the client
      target.searchParams.set(k, k === "maxResults" ? String(Math.min(Number(v) || 10, 12)) : v);
    }
    target.searchParams.set(r.keyParam, secret);

    const cache = typeof caches !== "undefined" ? caches.default : null;
    const cacheKey = new Request(url.toString(), { method: "GET" });
    if (cache) { const hit = await cache.match(cacheKey); if (hit) return new Response(hit.body, { status: hit.status, headers: { ...Object.fromEntries(hit.headers), ...cors } }); }
    let up;
    try { up = await fetch(target.toString()); } catch (e) { return json({ error: "Upstream unreachable" }, 502, cors); }
    const body = await up.text();
    const res = new Response(body, { status: up.status, headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600", ...cors } });
    if (cache && up.ok) await cache.put(cacheKey, res.clone());
    return res;
  },
};

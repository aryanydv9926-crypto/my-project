// Pure request handler for the TMDB proxy (no Firebase imports, so it can be tested anywhere).
const ALLOWED_ORIGINS = [
  "https://aryanydv9926-crypto.github.io",
  "http://localhost:8000", "http://127.0.0.1:8000",
  "http://localhost:5500", "http://127.0.0.1:5500",
];
const PATHS = [/^\/genre\/movie\/list$/, /^\/search\/keyword$/, /^\/discover\/movie$/, /^\/search\/movie$/, /^\/movie\/\d{1,9}$/, /^\/movie\/\d{1,9}\/videos$/];
// allowed query parameters and how each value is validated
const PARAMS = {
  query: (v) => v.length > 0 && v.length <= 100,
  with_keywords: (v) => /^[0-9|,]{1,60}$/.test(v),
  with_genres: (v) => /^[0-9|,]{1,20}$/.test(v),
  without_genres: (v) => /^[0-9|,]{1,20}$/.test(v),
  sort_by: (v) => ["popularity.desc", "vote_average.desc", "primary_release_date.desc"].includes(v),
  page: (v) => /^[1-5]$/.test(v),
};
const cache = new Map(); // in-memory, per instance
const TTL = 60 * 60 * 1000, MAX = 300;

async function handle(req, env, fetchFn = fetch) {
  const cors = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(req.origin) ? req.origin : ALLOWED_ORIGINS[0],
    "Vary": "Origin", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type",
  };
  const out = (status, obj, extra = {}) => ({ status, headers: { "Content-Type": "application/json", ...cors, ...extra }, body: typeof obj === "string" ? obj : JSON.stringify(obj) });
  if (req.method === "OPTIONS") return { status: 204, headers: cors, body: "" };
  if (req.method !== "GET") return out(405, { error: "Method not allowed" });
  if (!ALLOWED_ORIGINS.includes(req.origin)) return out(403, { error: "Origin not allowed" });
  if (!req.path.startsWith("/tmdb/")) return out(404, { error: "Not found" });
  const path = req.path.slice(5);
  if (!PATHS.some((re) => re.test(path))) return out(404, { error: "Path not allowed" });
  if (!env.TMDB_API_KEY) return out(500, { error: "Proxy is not configured: missing TMDB_API_KEY" });

  const target = new URL("https://api.themoviedb.org/3" + path);
  for (const [k, raw] of Object.entries(req.query || {})) {
    const v = Array.isArray(raw) ? raw[0] : raw;
    if (k === "api_key") continue;                                     // never accept a key from the browser
    if (!PARAMS[k] || typeof v !== "string" || !PARAMS[k](v)) return out(400, { error: "Invalid parameter: " + k });
    target.searchParams.set(k, v);
  }
  target.searchParams.set("include_adult", "false");
  target.searchParams.set("language", "en-US");
  const ck = target.toString();                                        // cache key (before the secret is added)
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.t < TTL) return out(hit.status, hit.body, { "Cache-Control": "public, max-age=3600", "X-Cache": "HIT" });
  target.searchParams.set("api_key", env.TMDB_API_KEY);
  let up;
  try { up = await fetchFn(target.toString()); } catch (e) { return out(502, { error: "TMDB is unreachable" }); }
  const body = await up.text();
  if (up.ok) { if (cache.size >= MAX) cache.delete(cache.keys().next().value); cache.set(ck, { t: Date.now(), status: up.status, body }); }
  return out(up.status, body, { "Cache-Control": up.ok ? "public, max-age=3600" : "no-store", "X-Cache": "MISS" });
}
module.exports = { handle, ALLOWED_ORIGINS };

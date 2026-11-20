// Pure request handler for TMDB + OpenTripMap proxies (no Firebase imports).
// Used by Firebase Cloud Functions and the Cloudflare Worker alternative.

const ALLOWED_ORIGINS = [
  "https://aryanydv9926-crypto.github.io",
  "http://localhost:8000", "http://127.0.0.1:8000",
  "http://localhost:5500", "http://127.0.0.1:5500",
  "http://localhost:3000", "http://127.0.0.1:3000",
];

// ---------- TMDB ----------
const TMDB_PATHS = [
  /^\/genre\/movie\/list$/,
  /^\/search\/keyword$/,
  /^\/discover\/movie$/,
  /^\/search\/movie$/,
  /^\/movie\/\d{1,9}$/,
  /^\/movie\/\d{1,9}\/videos$/,
  /^\/trending\/movie\/(day|week)$/,
  /^\/movie\/popular$/,
  /^\/movie\/top_rated$/,
  /^\/movie\/upcoming$/,
];
const TMDB_PARAMS = {
  query: (v) => v.length > 0 && v.length <= 100,
  with_keywords: (v) => /^[0-9|,]{1,60}$/.test(v),
  with_genres: (v) => /^[0-9|,]{1,20}$/.test(v),
  without_genres: (v) => /^[0-9|,]{1,20}$/.test(v),
  sort_by: (v) => ["popularity.desc", "vote_average.desc", "primary_release_date.desc"].includes(v),
  page: (v) => /^[1-9]$|^10$/.test(v),
  append_to_response: (v) => /^[a-z,_]{1,40}$/.test(v),
};

// ---------- OpenTripMap ----------
const OTM_METHODS = ["geoname", "radius", "autosuggest", "bbox"];
const OTM_XID = /^xid\/[A-Za-z0-9_.-]{3,40}$/;

const cache = new Map();
const TTL = 60 * 60 * 1000;
const MAX = 400;

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function out(status, obj, cors, extra = {}) {
  return {
    status,
    headers: { "Content-Type": "application/json", ...cors, ...extra },
    body: typeof obj === "string" ? obj : JSON.stringify(obj),
  };
}

async function handle(req, env, fetchFn = fetch) {
  const origin = req.origin || "";
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") return { status: 204, headers: cors, body: "" };
  if (req.method !== "GET") return out(405, { error: "Method not allowed" }, cors);
  if (!ALLOWED_ORIGINS.includes(origin)) return out(403, { error: "Origin not allowed" }, cors);

  const path = req.path || "";

  // ---- TMDB branch ----
  if (path.startsWith("/tmdb/")) {
    const tmdbPath = path.slice(5);
    if (!TMDB_PATHS.some((re) => re.test(tmdbPath))) return out(404, { error: "Path not allowed" }, cors);
    if (!env.TMDB_API_KEY) return out(500, { error: "Proxy is not configured: missing TMDB_API_KEY" }, cors);

    const target = new URL("https://api.themoviedb.org/3" + tmdbPath);
    for (const [k, raw] of Object.entries(req.query || {})) {
      const v = Array.isArray(raw) ? raw[0] : raw;
      if (k === "api_key") continue;
      if (!TMDB_PARAMS[k] || typeof v !== "string" || !TMDB_PARAMS[k](v)) {
        return out(400, { error: "Invalid parameter: " + k }, cors);
      }
      target.searchParams.set(k, v);
    }
    target.searchParams.set("include_adult", "false");
    target.searchParams.set("language", "en-US");

    const ck = "tmdb:" + target.toString();
    const hit = cache.get(ck);
    if (hit && Date.now() - hit.t < TTL) {
      return out(hit.status, hit.body, cors, { "Cache-Control": "public, max-age=3600", "X-Cache": "HIT" });
    }

    target.searchParams.set("api_key", env.TMDB_API_KEY);
    let up;
    try {
      up = await fetchFn(target.toString());
    } catch (e) {
      return out(502, { error: "TMDB is unreachable" }, cors);
    }
    const body = await up.text();
    if (up.ok) {
      if (cache.size >= MAX) cache.delete(cache.keys().next().value);
      cache.set(ck, { t: Date.now(), status: up.status, body });
    }
    return out(up.status, body, cors, {
      "Cache-Control": up.ok ? "public, max-age=3600" : "no-store",
      "X-Cache": "MISS",
    });
  }

  // ---- OpenTripMap branch ----
  if (path.startsWith("/otm/")) {
    const method = path.slice(5);
    const isXid = OTM_XID.test(method);
    const isMethod = OTM_METHODS.includes(method.split("?")[0]);
    if (!isXid && !isMethod) return out(404, { error: "OTM path not allowed" }, cors);
    if (!env.OTM_API_KEY) return out(500, { error: "Proxy is not configured: missing OTM_API_KEY" }, cors);

    const target = new URL(`https://api.opentripmap.com/0.1/en/places/${method}`);
    const allowed = ["name", "lat", "lon", "radius", "limit", "offset", "kinds", "rate", "format"];
    for (const [k, raw] of Object.entries(req.query || {})) {
      const v = Array.isArray(raw) ? raw[0] : String(raw || "");
      if (!allowed.includes(k)) continue;
      if (k === "limit" && !/^[1-9][0-9]?$|^100$/.test(v)) continue;
      if (k === "offset" && !/^\d{1,5}$/.test(v)) continue;
      if (k === "radius" && !/^\d{3,6}$/.test(v)) continue;
      if (k === "rate" && !/^[1-3]$/.test(v)) continue;
      if ((k === "lat" || k === "lon") && !/^-?\d{1,3}(\.\d+)?$/.test(v)) continue;
      if (k === "name" && (v.length < 1 || v.length > 80)) continue;
      target.searchParams.set(k, v);
    }
    target.searchParams.set("apikey", env.OTM_API_KEY);

    const ck = "otm:" + target.toString().replace(/apikey=[^&]+/, "apikey=***");
    const hit = cache.get(ck);
    if (hit && Date.now() - hit.t < TTL) {
      return out(hit.status, hit.body, cors, { "Cache-Control": "public, max-age=3600", "X-Cache": "HIT" });
    }

    let up;
    try {
      up = await fetchFn(target.toString());
    } catch (e) {
      return out(502, { error: "OpenTripMap is unreachable" }, cors);
    }
    const body = await up.text();
    if (up.ok) {
      if (cache.size >= MAX) cache.delete(cache.keys().next().value);
      cache.set(ck, { t: Date.now(), status: up.status, body });
    }
    return out(up.status, body, cors, {
      "Cache-Control": up.ok ? "public, max-age=3600" : "no-store",
      "X-Cache": "MISS",
    });
  }

  return out(404, { error: "Not found. Use /tmdb/... or /otm/..." }, cors);
}

module.exports = { handle, ALLOWED_ORIGINS };

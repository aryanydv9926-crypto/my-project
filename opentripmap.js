/**
 * JourneyJar – OpenTripMap Travel Discovery Service
 * All requests go through the backend proxy so the API key never leaves the server.
 * Placeholders are used until the proxy is configured.
 */
(function (global) {
  const CFG = () => (global.DISCOVER_CONFIG || window.DISCOVER_CONFIG || {});

  async function api(method, query = {}) {
    const cfg = CFG();
    const qs = new URLSearchParams(query).toString();

    if (cfg.otmProxy) {
      const url = `${cfg.otmProxy.replace(/\/$/, "")}/${method}${qs ? "?" + qs : ""}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `OpenTripMap proxy error ${res.status}`);
      }
      return res.json();
    }

    // Direct fallback (key visible – only for local testing)
    if (cfg.otmKey) {
      const url = `https://api.opentripmap.com/0.1/en/places/${method}?apikey=${cfg.otmKey}${qs ? "&" + qs : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`OpenTripMap error ${res.status}`);
      return res.json();
    }

    throw new Error("Travel service not connected. Configure otmProxy or otmKey in firebase-config.js");
  }

  // Common kinds for filters
  const KINDS = {
    all: "interesting_places",
    attractions: "interesting_places,tourist_facilities",
    museums: "museums",
    historic: "historic,architecture",
    natural: "natural,beaches,mountains,geological_formations",
    beaches: "beaches",
    mountains: "mountains",
    cultural: "cultural,religion,architecture",
  };

  const TravelService = {
    KINDS,

    /** Resolve city / country name → { name, lat, lon, country } */
    async geoname(name) {
      const data = await api("geoname", { name });
      if (!data || !data.name) throw new Error("Location not found");
      return {
        name: data.name,
        country: data.country || "",
        lat: data.lat,
        lon: data.lon,
        population: data.population || 0,
      };
    },

    /** List places around a point */
    async radius(lat, lon, opts = {}) {
      const {
        radius = 10000,
        limit = 24,
        offset = 0,
        kinds = KINDS.all,
        rate = 2, // 1–3 quality filter
        format = "json",
      } = opts;
      return api("radius", {
        lat,
        lon,
        radius,
        limit,
        offset,
        kinds,
        rate,
        format,
      });
    },

    /** Full details for a place by xid */
    async details(xid) {
      return api(`xid/${xid}`);
    },

    /** Autosuggest */
    async suggest(name, lat, lon) {
      const q = { name, limit: 8 };
      if (lat != null && lon != null) {
        q.lat = lat;
        q.lon = lon;
        q.radius = 50000;
      }
      return api("autosuggest", q);
    },

    /** Normalize a place list item or detail into a card shape */
    card(p, extra = {}) {
      const img =
        p.preview?.source ||
        p.image ||
        (p.wikipedia_extracts?.text ? null : null);
      return {
        xid: p.xid || p.id,
        name: p.name || "Unnamed place",
        kinds: (p.kinds || "").split(",").filter(Boolean),
        rate: p.rate || 0,
        lat: p.point?.lat ?? p.lat ?? null,
        lon: p.point?.lon ?? p.lon ?? null,
        dist: p.dist || null,
        image: img || extra.image || "",
        description: p.wikipedia_extracts?.text || p.info?.descr || extra.description || "",
        address: p.address || {},
        wiki: p.wikipedia || p.otm || "",
        mapUrl:
          p.point?.lat && p.point?.lon
            ? `https://www.google.com/maps?q=${p.point.lat},${p.point.lon}`
            : p.lat && p.lon
            ? `https://www.google.com/maps?q=${p.lat},${p.lon}`
            : "",
        ...extra,
      };
    },
  };

  global.JJTravelService = TravelService;
})(typeof window !== "undefined" ? window : globalThis);

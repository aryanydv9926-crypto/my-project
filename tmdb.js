/**
 * JourneyJar – TMDB Movie Discovery Service
 * Uses backend proxy when available; falls back to direct key only if configured.
 * Never hard-code private keys here.
 */
(function (global) {
  const CFG = () => (global.DISCOVER_CONFIG || window.DISCOVER_CONFIG || {});
  const IMG = (path, size = "w342") =>
    path ? `https://image.tmdb.org/t/p/${size}${path}` : "";

  async function api(path, params = {}) {
    const cfg = CFG();
    const qs = new URLSearchParams(params).toString();
    const relative = path.startsWith("/") ? path : `/${path}`;

    // Prefer secure proxy
    if (cfg.tmdbProxy) {
      const url = `${cfg.tmdbProxy.replace(/\/$/, "")}${relative}${qs ? "?" + qs : ""}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `TMDB proxy error ${res.status}`);
      }
      return res.json();
    }

    // Fallback: direct key (only for local testing – key is visible)
    if (cfg.tmdbKey) {
      const url = `https://api.themoviedb.org/3${relative}?api_key=${cfg.tmdbKey}&language=en-US&include_adult=false${qs ? "&" + qs : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`TMDB error ${res.status}`);
      return res.json();
    }

    throw new Error("Movie service not connected. Configure tmdbProxy or tmdbKey in firebase-config.js");
  }

  const MovieService = {
    img: IMG,

    async trending(page = 1) {
      return api("/trending/movie/week", { page });
    },
    async popular(page = 1) {
      return api("/movie/popular", { page });
    },
    async topRated(page = 1) {
      return api("/movie/top_rated", { page });
    },
    async upcoming(page = 1) {
      return api("/movie/upcoming", { page });
    },
    async search(query, page = 1) {
      return api("/search/movie", { query, page });
    },
    async details(id) {
      return api(`/movie/${id}`, { append_to_response: "credits,videos" });
    },
    async genres() {
      return api("/genre/movie/list");
    },

    /** Normalize a movie object for cards */
    card(m) {
      return {
        id: m.id,
        title: m.title || m.name || "Untitled",
        overview: m.overview || "",
        poster: IMG(m.poster_path, "w342"),
        backdrop: IMG(m.backdrop_path, "w780"),
        rating: m.vote_average ? m.vote_average.toFixed(1) : "—",
        year: (m.release_date || "").slice(0, 4) || "—",
        release: m.release_date || "",
        genres: (m.genre_ids || []).join(","),
        popularity: m.popularity || 0,
      };
    },
  };

  global.JJMovieService = MovieService;
})(typeof window !== "undefined" ? window : globalThis);

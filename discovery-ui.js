/**
 * JourneyJar – Organised Dual Discovery
 * Clean top-level tabs: Travel | Movies | Destination
 * Does NOT break any existing feature (trips, budget, sync, vault, etc.)
 */
(function () {
  "use strict";

  // ---------- State ----------
  const DD = {
    tab: "travel",                 // travel | movies | destination
    travel: {
      q: "", kind: "all", loading: false, error: "",
      location: null, places: [], favorites: [],
    },
    movies: {
      q: "", mode: "trending", loading: false, error: "",
      list: [], favorites: [], selected: null, page: 1,
    },
  };
  window.JJDiscovery = DD;

  // ---------- Utils ----------
  const E = (s) => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const toast = (m) => (typeof window.toast === "function" ? window.toast(m) : console.log(m));
  const uid = () => window.JJ?.currentUser?.()?.uid || null;

  // ---------- Favourites ----------
  async function loadTravelFavs() {
    const u = uid();
    if (!u || !window.JJ?.getFavoritePlaces) return;
    try { DD.travel.favorites = await window.JJ.getFavoritePlaces(u); } catch (_) {}
  }
  async function loadMovieFavs() {
    const u = uid();
    if (!u || !window.JJ?.getFavoriteMovies) return;
    try { DD.movies.favorites = await window.JJ.getFavoriteMovies(u); } catch (_) {}
  }

  // ---------- Travel ----------
  async function travelSearch(q) {
    q = (q || DD.travel.q || "").trim();
    if (!q) return toast("Enter a city or country");
    DD.travel.q = q;
    DD.travel.loading = true;
    DD.travel.error = "";
    DD.travel.places = [];
    DD.travel.location = null;
    paint();

    try {
      if (!window.JJTravelService) throw new Error("Travel service not loaded");
      const loc = await window.JJTravelService.geoname(q);
      DD.travel.location = loc;
      const kinds = window.JJTravelService.KINDS[DD.travel.kind] || window.JJTravelService.KINDS.all;
      const list = await window.JJTravelService.radius(loc.lat, loc.lon, {
        radius: 12000, limit: 28, kinds, rate: 2,
      });
      const cards = [];
      for (const item of (list || []).slice(0, 24)) {
        let detail = null;
        try { detail = await window.JJTravelService.details(item.xid); } catch (_) {}
        cards.push(window.JJTravelService.card(detail || item, {
          image: detail?.preview?.source || detail?.image || "",
        }));
      }
      DD.travel.places = cards;
      if (window.JJ?.recordSearch && uid()) window.JJ.recordSearch(uid(), q).catch(() => {});
    } catch (e) {
      DD.travel.error = e.message || "Could not load places";
    } finally {
      DD.travel.loading = false;
      paint();
    }
  }

  async function toggleTravelFav(place) {
    const u = uid();
    if (!u) return toast("Sign in to save favourites");
    const existing = DD.travel.favorites.find((f) => f.xid === place.xid || f.id === place.xid);
    try {
      if (existing) {
        await window.JJ.removeFavoritePlace(u, existing.id || existing.xid);
        DD.travel.favorites = DD.travel.favorites.filter((f) => f.id !== existing.id);
        toast("Removed from favourites");
      } else {
        await window.JJ.saveFavoritePlace(u, place);
        await loadTravelFavs();
        toast("Saved to favourites");
      }
      paint();
    } catch (e) { toast(e.message || "Could not update favourite"); }
  }

  // ---------- Movies ----------
  async function loadMovies(mode) {
    mode = mode || DD.movies.mode;
    DD.movies.mode = mode;
    DD.movies.loading = true;
    DD.movies.error = "";
    DD.movies.list = [];
    paint();

    try {
      if (!window.JJMovieService) throw new Error("Movie service not loaded");
      let data;
      if (mode === "search" && DD.movies.q) {
        data = await window.JJMovieService.search(DD.movies.q, DD.movies.page);
      } else if (mode === "popular") data = await window.JJMovieService.popular();
      else if (mode === "top_rated") data = await window.JJMovieService.topRated();
      else if (mode === "upcoming") data = await window.JJMovieService.upcoming();
      else data = await window.JJMovieService.trending();

      DD.movies.list = (data.results || []).map((m) => window.JJMovieService.card(m));
    } catch (e) {
      DD.movies.error = e.message || "Could not load movies";
    } finally {
      DD.movies.loading = false;
      paint();
    }
  }

  async function movieSearch() {
    const q = (document.getElementById("mv_q")?.value || "").trim();
    if (!q) return toast("Type a movie title");
    DD.movies.q = q;
    DD.movies.mode = "search";
    DD.movies.page = 1;
    await loadMovies("search");
  }

  async function openMovieDetail(id) {
    try {
      const m = await window.JJMovieService.details(id);
      DD.movies.selected = {
        ...window.JJMovieService.card(m),
        runtime: m.runtime,
        genres: (m.genres || []).map((g) => g.name).join(", "),
        cast: (m.credits?.cast || []).slice(0, 8).map((c) => c.name).join(", "),
        director: (m.credits?.crew || []).find((c) => c.job === "Director")?.name || "",
        trailer: (m.videos?.results || []).find((v) => v.site === "YouTube" && v.type === "Trailer")?.key || "",
      };
      paint();
    } catch (e) { toast(e.message || "Could not load details"); }
  }

  async function toggleMovieFav(movie) {
    const u = uid();
    if (!u) return toast("Sign in to save favourites");
    const existing = DD.movies.favorites.find((f) => String(f.tmdbId || f.id) === String(movie.id));
    try {
      if (existing) {
        await window.JJ.removeFavoriteMovie(u, existing.id);
        DD.movies.favorites = DD.movies.favorites.filter((f) => f.id !== existing.id);
        toast("Removed from favourites");
      } else {
        await window.JJ.saveFavoriteMovie(u, movie);
        await loadMovieFavs();
        toast("Saved to favourites");
      }
      paint();
    } catch (e) { toast(e.message || "Could not update favourite"); }
  }

  // ---------- Rendering helpers ----------
  function skeleton(n = 8) {
    return Array.from({ length: n })
      .map(() => `<div class="disc-card sk"><div class="skl" style="height:180px;border-radius:12px 12px 0 0"></div><div style="padding:12px"><div class="skl" style="height:14px;margin-bottom:8px"></div><div class="skl" style="height:12px;width:60%"></div></div></div>`)
      .join("");
  }

  function travelSection() {
    const kindBtns = Object.keys(window.JJTravelService?.KINDS || { all: 1 })
      .map((k) => `<button class="chip ${DD.travel.kind === k ? "on" : ""}" onclick="JJDisc.setKind('${k}')">${k.replace(/_/g, " ")}</button>`)
      .join("");

    let body = "";
    if (DD.travel.loading) body = `<div class="disc-grid">${skeleton(8)}</div>`;
    else if (DD.travel.error) body = `<div class="card" style="text-align:center;padding:32px"><p style="color:var(--rose)">${E(DD.travel.error)}</p><button class="btn g" onclick="JJDisc.travelSearch()">Retry</button></div>`;
    else if (!DD.travel.places.length && !DD.travel.location)
      body = `<div class="card" style="text-align:center;padding:40px"><div style="font-size:48px;margin-bottom:12px">🧭</div><h3>Discover places</h3><p class="mut">Search a city or country to explore attractions, museums, beaches and more.</p></div>`;
    else if (!DD.travel.places.length)
      body = `<div class="card" style="text-align:center;padding:32px"><p class="mut">No places found for this filter. Try another category.</p></div>`;
    else {
      body = `
        ${DD.travel.location ? `<div class="mut" style="margin-bottom:12px">Near <b>${E(DD.travel.location.name)}</b>${DD.travel.location.country ? ", " + E(DD.travel.location.country) : ""}</div>` : ""}
        <div class="disc-grid">
          ${DD.travel.places.map((p) => {
            const fav = DD.travel.favorites.some((f) => f.xid === p.xid);
            return `<div class="disc-card">
              <div class="disc-img">${p.image ? `<img src="${E(p.image)}" alt="" loading="lazy" onerror="this.parentNode.innerHTML='<div class=\\'ph\\'>📍</div>'">` : `<div class="ph">📍</div>`}</div>
              <div class="disc-body">
                <h4>${E(p.name)}</h4>
                <div class="mut" style="font-size:12px;margin:4px 0 8px">${(p.kinds || []).slice(0, 3).map(E).join(" · ") || "Attraction"}</div>
                ${p.description ? `<p class="mut" style="font-size:13px;line-height:1.4;max-height:3.2em;overflow:hidden">${E(p.description.slice(0, 110))}…</p>` : ""}
                <div class="row" style="margin-top:10px;gap:6px">
                  ${p.mapUrl ? `<a class="btn s g" href="${E(p.mapUrl)}" target="_blank" rel="noopener">Map</a>` : ""}
                  <button class="btn s ${fav ? "" : "g"}" onclick='JJDisc.toggleTravelFav(${JSON.stringify({xid:p.xid,name:p.name,kinds:p.kinds,lat:p.lat,lon:p.lon,image:p.image,description:p.description,mapUrl:p.mapUrl,rate:p.rate}).replace(/'/g,"&#39;")})'>${fav ? "♥ Saved" : "♡ Save"}</button>
                </div>
              </div>
            </div>`;
          }).join("")}
        </div>`;
    }

    const favs = DD.travel.favorites.length
      ? `<div class="sec-title" style="margin-top:28px">Your favourite places</div>
         <div class="disc-grid">${DD.travel.favorites.map((p) =>
           `<div class="disc-card"><div class="disc-img">${p.image ? `<img src="${E(p.image)}" loading="lazy">` : `<div class="ph">📍</div>`}</div>
            <div class="disc-body"><h4>${E(p.name)}</h4>
            <button class="btn s" onclick='JJDisc.toggleTravelFav(${JSON.stringify(p).replace(/'/g,"&#39;")})'>Remove</button></div></div>`
         ).join("")}</div>`
      : "";

    return `
      <div class="disc-toolbar">
        <div class="row" style="flex-wrap:nowrap;gap:8px;max-width:560px">
          <input id="tr_q" placeholder="City or country, e.g. Paris, Manali, Bali" value="${E(DD.travel.q)}"
            onkeydown="if(event.keyCode===13)JJDisc.travelSearch(this.value)">
          <button class="btn" onclick="JJDisc.travelSearch(document.getElementById('tr_q').value)">Search</button>
        </div>
        <div class="chip-row" style="margin-top:12px">${kindBtns}</div>
      </div>
      ${body}${favs}`;
  }

  function moviesSection() {
    const modeBtns = [
      ["trending", "Trending"], ["popular", "Popular"],
      ["top_rated", "Top Rated"], ["upcoming", "Upcoming"],
    ].map(([m, label]) =>
      `<button class="chip ${DD.movies.mode === m ? "on" : ""}" onclick="JJDisc.loadMovies('${m}')">${label}</button>`
    ).join("");

    let body = "";
    if (DD.movies.loading) body = `<div class="disc-grid">${skeleton(10)}</div>`;
    else if (DD.movies.error)
      body = `<div class="card" style="text-align:center;padding:32px"><p style="color:var(--rose)">${E(DD.movies.error)}</p><button class="btn g" onclick="JJDisc.loadMovies()">Retry</button></div>`;
    else if (!DD.movies.list.length)
      body = `<div class="card" style="text-align:center;padding:40px"><div style="font-size:48px;margin-bottom:12px">🎬</div><h3>Discover movies</h3><p class="mut">Browse trending, popular, top-rated or search for a title.</p></div>`;
    else {
      body = `<div class="disc-grid">${DD.movies.list.map((m) => {
        const fav = DD.movies.favorites.some((f) => String(f.tmdbId || f.id) === String(m.id));
        return `<div class="disc-card" onclick="JJDisc.openMovieDetail(${m.id})">
          <div class="disc-img">${m.poster ? `<img src="${E(m.poster)}" alt="" loading="lazy">` : `<div class="ph">🎬</div>`}
            <span class="rating-badge">★ ${E(m.rating)}</span></div>
          <div class="disc-body">
            <h4>${E(m.title)}</h4>
            <div class="mut" style="font-size:12px">${E(m.year)}</div>
            <button class="btn s ${fav ? "" : "g"}" style="margin-top:8px"
              onclick="event.stopPropagation();JJDisc.toggleMovieFav({id:${m.id},title:'${E(m.title).replace(/'/g,"\\'")}',poster:'${E(m.poster)}',rating:'${E(m.rating)}',year:'${E(m.year)}',overview:'${E((m.overview||'').slice(0,200)).replace(/'/g,"\\'")}'})">${fav ? "♥" : "♡"}</button>
          </div>
        </div>`;
      }).join("")}</div>`;
    }

    const favs = DD.movies.favorites.length
      ? `<div class="sec-title" style="margin-top:28px">Your favourite movies</div>
         <div class="disc-grid">${DD.movies.favorites.map((m) =>
           `<div class="disc-card"><div class="disc-img">${m.poster ? `<img src="${E(m.poster)}" loading="lazy">` : `<div class="ph">🎬</div>`}</div>
            <div class="disc-body"><h4>${E(m.title)}</h4>
            <button class="btn s" onclick="JJDisc.toggleMovieFav({id:${m.tmdbId || m.id},title:'${E(m.title).replace(/'/g,"\\'")}'})">Remove</button></div></div>`
         ).join("")}</div>`
      : "";

    const modal = DD.movies.selected ? (() => {
      const m = DD.movies.selected;
      return `<div class="modal-backdrop" onclick="JJDisc.closeMovieDetail()">
        <div class="modal-card" onclick="event.stopPropagation()" style="max-width:640px">
          ${m.backdrop ? `<img src="${E(m.backdrop)}" style="width:100%;height:200px;object-fit:cover;border-radius:14px 14px 0 0" alt="">` : ""}
          <div style="padding:20px">
            <h2 style="margin:0 0 6px">${E(m.title)}</h2>
            <div class="mut" style="margin-bottom:12px">★ ${E(m.rating)} · ${E(m.year)} ${m.runtime ? "· " + m.runtime + " min" : ""} · ${E(m.genres || "")}</div>
            <p style="line-height:1.5;margin-bottom:12px">${E(m.overview)}</p>
            ${m.director ? `<p class="mut"><b>Director:</b> ${E(m.director)}</p>` : ""}
            ${m.cast ? `<p class="mut"><b>Cast:</b> ${E(m.cast)}</p>` : ""}
            <div class="row" style="margin-top:16px;gap:8px">
              ${m.trailer ? `<a class="btn" href="https://www.youtube.com/watch?v=${E(m.trailer)}" target="_blank" rel="noopener">Watch Trailer</a>` : ""}
              <button class="btn g" onclick="JJDisc.closeMovieDetail()">Close</button>
            </div>
          </div>
        </div>
      </div>`;
    })() : "";

    return `
      <div class="disc-toolbar">
        <div class="row" style="flex-wrap:nowrap;gap:8px;max-width:560px">
          <input id="mv_q" placeholder="Search movies…" value="${E(DD.movies.q)}"
            onkeydown="if(event.keyCode===13)JJDisc.movieSearch()">
          <button class="btn" onclick="JJDisc.movieSearch()">Search</button>
        </div>
        <div class="chip-row" style="margin-top:12px">${modeBtns}</div>
      </div>
      ${body}${favs}${modal}`;
  }

  // ---------- Main Discover page (replaces discPg cleanly) ----------
  function organisedDiscPg() {
    // Classic destination section is still available under the "Destination" tab
    // We keep the original discPg logic for that tab only.
    const classic = (typeof originalDiscPg === "function") ? originalDiscPg() : "";

    return `
      <div class="dh">
        <span class="bd">JourneyJar Discover</span>
        <h1 style="margin:0 0 8px;font-size:clamp(26px,5vw,44px)">Travel &amp; Movie Discovery</h1>
        <p class="mut" style="max-width:540px;margin:0">Explore places with OpenTripMap, discover films with TMDB, or dive deep into any destination.</p>
      </div>

      <div class="dual-tabs" style="margin-top:20px">
        <button class="dual-tab ${DD.tab === "travel" ? "on" : ""}" onclick="JJDisc.setTab('travel')">🧭 Travel</button>
        <button class="dual-tab ${DD.tab === "movies" ? "on" : ""}" onclick="JJDisc.setTab('movies')">🎬 Movies</button>
        <button class="dual-tab ${DD.tab === "destination" ? "on" : ""}" onclick="JJDisc.setTab('destination')">📖 Destination</button>
      </div>

      <div id="jj-disc-body" style="margin-top:18px">
        ${DD.tab === "travel" ? travelSection() :
          DD.tab === "movies" ? moviesSection() :
          classic}
      </div>
    `;
  }

  function paint() {
    const body = document.getElementById("jj-disc-body");
    if (!body) return;
    if (DD.tab === "travel") body.innerHTML = travelSection();
    else if (DD.tab === "movies") body.innerHTML = moviesSection();
    // Destination tab is rendered by the original discPg content
  }

  // ---------- Public API ----------
  window.JJDisc = {
    setTab(tab) {
      DD.tab = tab;
      if (tab === "movies" && !DD.movies.list.length && !DD.movies.loading) loadMovies("trending");
      if (tab === "travel") loadTravelFavs();
      if (tab === "movies") loadMovieFavs();
      // Force full re-render of Discover page
      if (window.V?.p === "disc" && typeof window.R === "function") window.R();
    },
    setKind(k) {
      DD.travel.kind = k;
      if (DD.travel.location) travelSearch(DD.travel.q);
      else paint();
    },
    travelSearch,
    loadMovies,
    movieSearch,
    openMovieDetail,
    closeMovieDetail() { DD.movies.selected = null; paint(); },
    toggleTravelFav,
    toggleMovieFav,
  };

  // ---------- Clean integration (no override of R) ----------
  let originalDiscPg = null;

  function integrate() {
    if (typeof window.discPg !== "function") return;
    if (originalDiscPg) return; // already done

    originalDiscPg = window.discPg;
    window.discPg = organisedDiscPg;

    // When user lands on Discover, load favourites once
    const origGo = window.go;
    if (typeof origGo === "function") {
      window.go = function (p, t) {
        origGo(p, t);
        if (p === "disc") {
          setTimeout(() => {
            loadTravelFavs();
            loadMovieFavs();
            if (DD.tab === "movies" && !DD.movies.list.length) loadMovies("trending");
          }, 60);
        }
      };
    }
  }

  // Run after main script has defined discPg
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(integrate, 0));
  } else {
    setTimeout(integrate, 0);
  }
  window.addEventListener("jj-ready", () => {
    loadTravelFavs();
    loadMovieFavs();
  });
})();

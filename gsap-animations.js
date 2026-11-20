/**
 * JourneyJar — Premium GSAP 3 Animation Layer
 * Uses GSAP CDN: ScrollTrigger, ScrollToPlugin, Flip, Observer, Draggable
 * Vanilla JS, no React — attaches after each page render.
 *
 * Rules:
 * - Respects prefers-reduced-motion
 * - Cleans up ScrollTriggers on each page navigation
 * - Never modifies data, APIs, or auth
 */
(function () {
  "use strict";

  /* =========================================================
     1. GSAP REGISTRATION
  ========================================================= */
  if (typeof gsap === "undefined") {
    console.warn("JourneyJar GSAP: GSAP not loaded yet.");
    return;
  }

  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, Flip, Observer, Draggable);

  // Custom eases for premium feel
  gsap.registerEase("premiumIn", "M0,0 C0.05,0 0.133,0.159 0.2,0.4 0.333,0.73 0.633,1 1,1");
  gsap.registerEase("cinematic", "M0,0 C0.08,0.82 0.165,1 1,1");

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =========================================================
     2. SCROLL TRIGGER CLEANUP
  ========================================================= */
  let _activeTriggers = [];

  function killAll() {
    _activeTriggers.forEach((t) => { try { t.kill(); } catch (_) {} });
    _activeTriggers = [];
    ScrollTrigger.getAll().forEach((t) => t.kill());
  }

  /* =========================================================
     3. HELPERS
  ========================================================= */
  function qs(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }
  function qsa(sel, ctx) {
    return [...(ctx || document).querySelectorAll(sel)];
  }

  function stagger(targets, vars, staggerVal = 0.08) {
    if (prefersReduced || !targets.length) return;
    return gsap.from(targets, {
      ...vars,
      stagger: staggerVal,
      ease: vars.ease || "cinematic",
    });
  }

  function reveal(el, vars = {}) {
    if (!el || prefersReduced) return;
    return gsap.from(el, {
      y: 40,
      opacity: 0,
      duration: 0.75,
      ease: "cinematic",
      ...vars,
    });
  }

  /* =========================================================
     4. NAV BAR — scroll behaviour
  ========================================================= */
  function initNavbar() {
    const nb = qs("#nb");
    if (!nb || prefersReduced) return;

    let lastY = 0;
    ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      onUpdate: (self) => {
        const scrollY = self.scroll();
        if (scrollY > 80) {
          nb.style.boxShadow = "0 2px 24px rgba(0,0,0,0.6)";
        } else {
          nb.style.boxShadow = "none";
        }
        lastY = scrollY;
      },
    });
  }

  /* =========================================================
     5. HOME PAGE — cinematic animations
  ========================================================= */
  function animateHomePage() {
    const pg = qs("#pg");
    if (!pg) return;

    // Animate hero eyebrow + heading + subtitle + CTAs
    const eyebrow = pg.querySelector(".jj-hero-eyebrow");
    const h1 = pg.querySelector(".jj-hero-h1");
    const sub = pg.querySelector(".jj-hero-sub");
    const ctas = pg.querySelector(".jj-hero-ctas");
    const heroBgImg = pg.querySelector(".jj-hero-bg img");

    if (prefersReduced) {
      [eyebrow, h1, sub, ctas].forEach((el) => {
        if (el) el.style.opacity = "1";
      });
      return;
    }

    const tl = gsap.timeline({ delay: 0.1 });

    if (heroBgImg) {
      // Ken Burns effect on hero image
      gsap.fromTo(heroBgImg,
        { scale: 1.08 },
        { scale: 1, duration: 2.5, ease: "power2.out" }
      );
    }

    if (eyebrow) {
      tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.6, ease: "cinematic" }, 0.1);
    }

    if (h1) {
      // Split the heading into words for stagger
      const words = h1.querySelectorAll(".word");
      if (words.length) {
        tl.to(words, { opacity: 1, y: 0, stagger: 0.05, duration: 0.65, ease: "cinematic" }, 0.25);
      } else {
        tl.to(h1, { opacity: 1, y: 0, duration: 0.75, ease: "cinematic" }, 0.25);
      }
    }

    if (sub) {
      tl.to(sub, { opacity: 1, y: 0, duration: 0.65, ease: "cinematic" }, "-=0.4");
    }

    if (ctas) {
      tl.to(ctas, { opacity: 1, y: 0, duration: 0.55, ease: "cinematic" }, "-=0.3");
    }

    // ScrollTrigger sections
    setTimeout(() => {
      animateScrollSections(pg);
    }, 400);
  }

  /* =========================================================
     6. SCROLL-TRIGGERED SECTION REVEALS
  ========================================================= */
  function animateScrollSections(pg) {
    if (prefersReduced) return;

    // Section headers
    qsa(".jj-section-header, .sec-title, .jj-section-label", pg).forEach((el) => {
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        onEnter: () => {
          gsap.from(el, { y: 28, opacity: 0, duration: 0.65, ease: "cinematic" });
        },
        once: true,
      });
      _activeTriggers.push(st);
    });

    // Destination cards — staggered reveal
    const destCards = qsa(".jj-dest-card, .dest-card", pg);
    if (destCards.length) {
      const st = ScrollTrigger.create({
        trigger: destCards[0],
        start: "top 85%",
        onEnter: () => {
          gsap.from(destCards, {
            y: 50,
            opacity: 0,
            duration: 0.7,
            stagger: 0.08,
            ease: "cinematic",
          });
        },
        once: true,
      });
      _activeTriggers.push(st);
    }

    // Feature cards
    const featCards = qsa(".jj-feature-card, .feat-card", pg);
    if (featCards.length) {
      const st = ScrollTrigger.create({
        trigger: featCards[0],
        start: "top 88%",
        onEnter: () => {
          gsap.from(featCards, {
            y: 36,
            opacity: 0,
            scale: 0.96,
            duration: 0.65,
            stagger: 0.07,
            ease: "back.out(1.2)",
          });
        },
        once: true,
      });
      _activeTriggers.push(st);
    }

    // Movie cards (horizontal scroll strip)
    const movieCards = qsa(".jj-movie-card", pg);
    if (movieCards.length) {
      const st = ScrollTrigger.create({
        trigger: movieCards[0],
        start: "top 90%",
        onEnter: () => {
          gsap.from(movieCards, {
            x: 40,
            opacity: 0,
            duration: 0.6,
            stagger: 0.06,
            ease: "cinematic",
          });
        },
        once: true,
      });
      _activeTriggers.push(st);
    }

    // CTA section
    const cta = qs(".jj-cta-section", pg);
    if (cta) {
      const st = ScrollTrigger.create({
        trigger: cta,
        start: "top 80%",
        onEnter: () => {
          gsap.from(cta.querySelector(".jj-cta-content"), {
            y: 50,
            opacity: 0,
            duration: 0.9,
            ease: "cinematic",
          });
        },
        once: true,
      });
      _activeTriggers.push(st);
    }

    // Editorial cards
    qsa(".jj-editorial-main, .jj-editorial-sm", pg).forEach((el, i) => {
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        onEnter: () => {
          gsap.from(el, {
            y: 40,
            opacity: 0,
            duration: 0.7,
            delay: i * 0.08,
            ease: "cinematic",
          });
        },
        once: true,
      });
      _activeTriggers.push(st);
    });

    // Generic reveal elements
    qsa(".jj-reveal", pg).forEach((el) => {
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top 87%",
        onEnter: () => {
          gsap.to(el, { y: 0, opacity: 1, duration: 0.7, ease: "cinematic" });
        },
        once: true,
      });
      _activeTriggers.push(st);
    });

    // Stat cards
    const statCards = qsa(".card.st", pg);
    if (statCards.length) {
      const st = ScrollTrigger.create({
        trigger: statCards[0],
        start: "top 88%",
        onEnter: () => {
          gsap.from(statCards, {
            y: 24,
            opacity: 0,
            duration: 0.55,
            stagger: 0.07,
            ease: "back.out(1.3)",
          });
        },
        once: true,
      });
      _activeTriggers.push(st);
    }

    // Hero parallax (desktop only)
    const heroBg = qs(".jj-hero-bg img", pg);
    if (heroBg && window.innerWidth > 768) {
      const st = ScrollTrigger.create({
        trigger: qs(".jj-home-hero", pg),
        start: "top top",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          gsap.set(heroBg, { y: self.progress * 80 });
        },
      });
      _activeTriggers.push(st);
    }
  }

  /* =========================================================
     7. DISCOVER PAGE ANIMATIONS
  ========================================================= */
  function animateDiscoverPage() {
    const pg = qs("#pg");
    if (!pg) return;

    if (prefersReduced) return;

    // Discover header
    const dh = qs(".dh", pg);
    if (dh) {
      gsap.from(dh, { y: 32, opacity: 0, duration: 0.65, ease: "cinematic" });
    }

    // Tabs
    const tabs = qsa(".dual-tab", pg);
    if (tabs.length) {
      gsap.from(tabs, {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.06,
        delay: 0.2,
        ease: "back.out(1.3)",
      });
    }

    // Discovery cards
    setTimeout(() => {
      const cards = qsa(".disc-card", pg);
      if (cards.length) {
        gsap.from(cards, {
          y: 36,
          opacity: 0,
          duration: 0.55,
          stagger: { amount: 0.6, from: "start" },
          ease: "cinematic",
        });
      }
    }, 150);
  }

  /* =========================================================
     8. DISCOVERY CARDS — Flip for filter transitions
  ========================================================= */
  function flipFilterTransition(container) {
    if (!container || prefersReduced) return;
    const cards = qsa(".disc-card:not(.sk)", container);
    if (!cards.length) return;

    const state = Flip.getState(cards);
    // Cards are already in their new positions at this point
    Flip.from(state, {
      duration: 0.5,
      ease: "power2.out",
      stagger: 0.03,
      onEnter: (els) => gsap.from(els, { opacity: 0, scale: 0.85, duration: 0.4 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.3 }),
    });
  }

  window.JJFlipTransition = flipFilterTransition;

  /* =========================================================
     9. DASHBOARD ANIMATIONS
  ========================================================= */
  function animateDashboard() {
    const pg = qs("#pg");
    if (!pg || prefersReduced) return;

    const tl = gsap.timeline();

    const welcome = qs(".dash-welcome", pg);
    if (welcome) {
      tl.from(welcome, { y: 28, opacity: 0, duration: 0.65, ease: "cinematic" }, 0);
    }

    const stats = qsa(".dash-stats .card", pg);
    if (stats.length) {
      tl.from(stats, {
        y: 28,
        opacity: 0,
        stagger: 0.08,
        duration: 0.55,
        ease: "back.out(1.2)",
      }, 0.15);
    }

    const upcoming = qs(".dash-upcoming", pg);
    if (upcoming) {
      tl.from(upcoming, {
        y: 36,
        opacity: 0,
        duration: 0.7,
        ease: "cinematic",
      }, 0.35);
    }
  }

  /* =========================================================
     10. NAV ACTIVE STATE INDICATOR (smooth underline)
  ========================================================= */
  function animateNavActive() {
    const activeLink = qs("#nl a.on");
    if (!activeLink || prefersReduced) return;
    gsap.from(activeLink, { scale: 0.9, opacity: 0.5, duration: 0.3, ease: "back.out(1.5)" });
  }

  /* =========================================================
     11. SMOOTH SCROLL TO (ScrollToPlugin)
  ========================================================= */
  window.JJScrollTo = function (target, offset = 0) {
    if (prefersReduced) {
      if (typeof target === "string") {
        const el = document.querySelector(target);
        if (el) el.scrollIntoView();
      }
      return;
    }
    gsap.to(window, {
      duration: 0.9,
      scrollTo: { y: target, offsetY: offset + 72 },
      ease: "power3.inOut",
    });
  };

  /* =========================================================
     12. HOVER EFFECTS ON CARDS (micro-interactions)
  ========================================================= */
  function bindCardHovers(pg) {
    if (prefersReduced || !pg) return;

    // Destination card image zoom on hover — handled by CSS transitions
    // But add subtle rotation micro-interaction to feature icons
    qsa(".jj-feature-icon, .feat-card .ic, .st .ib", pg).forEach((icon) => {
      icon.addEventListener("mouseenter", () => {
        gsap.to(icon, { scale: 1.12, rotation: 5, duration: 0.3, ease: "back.out(2)" });
      });
      icon.addEventListener("mouseleave", () => {
        gsap.to(icon, { scale: 1, rotation: 0, duration: 0.25, ease: "power2.out" });
      });
    });
  }

  /* =========================================================
     13. PAGE TRANSITION — smooth fade between pages
  ========================================================= */
  function pageTransition(pg) {
    if (!pg || prefersReduced) return;
    gsap.fromTo(pg,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
    );
  }

  /* =========================================================
     14. PROGRESS BAR ANIMATIONS
  ========================================================= */
  function animateProgressBars(pg) {
    if (!pg || prefersReduced) return;

    qsa(".bar i", pg).forEach((bar) => {
      const targetWidth = bar.style.width || "0%";
      bar.style.width = "0%";
      const st = ScrollTrigger.create({
        trigger: bar,
        start: "top 90%",
        onEnter: () => {
          gsap.to(bar, {
            width: targetWidth,
            duration: 1.2,
            ease: "power3.out",
          });
        },
        once: true,
      });
      _activeTriggers.push(st);
    });
  }

  /* =========================================================
     15. OBSERVER — touch/gesture for mobile nav
  ========================================================= */
  function initObserver() {
    if (prefersReduced) return;

    // Swipe to close mobile nav
    const nb = qs("#nb");
    if (!nb) return;

    Observer.create({
      target: document.body,
      type: "touch",
      tolerance: 40,
      onRight: () => {
        // swipe right — ignore (could open sidebar)
      },
      onLeft: () => {
        // swipe left — close mobile nav if open
        if (nb.classList.contains("mo")) {
          nb.classList.remove("mo");
        }
      },
    });
  }

  /* =========================================================
     16. DRAGGABLE — movie strip on mobile
  ========================================================= */
  function initMovieDraggable() {
    const strip = qs(".jj-movie-scroll");
    if (!strip || window.innerWidth > 768 || prefersReduced) return;

    // Native scroll is used; Draggable is optional enhancement
    // Only add if native scroll isn't sufficient
  }

  /* =========================================================
     17. VAULT PAGE ANIMATIONS
  ========================================================= */
  function animateVaultPage() {
    const pg = qs("#pg");
    if (!pg || prefersReduced) return;

    const vaultRoot = pg.querySelector("#travelVaultRoot") || pg;

    gsap.from(vaultRoot, {
      y: 24,
      opacity: 0,
      duration: 0.6,
      ease: "cinematic",
    });
  }

  /* =========================================================
     18. PLANE PATH ANIMATION (decorative)
  ========================================================= */
  function animatePlanePath(container) {
    const path = container && container.querySelector(".jj-plane-path-line");
    const plane = container && container.querySelector(".jj-plane-icon");
    if (!path || !plane || prefersReduced) return;

    // Animate plane along the path
    gsap.to(plane, {
      motionPath: {
        path: path,
        align: path,
        autoRotate: true,
        alignOrigin: [0.5, 0.5],
      },
      duration: 4,
      ease: "none",
      repeat: -1,
    });
  }

  /* =========================================================
     19. MAIN ORCHESTRATOR — called after each page render
  ========================================================= */
  function runPageAnimations() {
    // Always kill old triggers first
    killAll();

    // Short delay to let DOM settle after innerHTML assignment
    requestAnimationFrame(() => {
      setTimeout(() => {
        const pg = qs("#pg");
        if (!pg) return;

        const page = window.V?.p || "";

        // Page transition
        pageTransition(pg);

        // Navbar
        initNavbar();
        animateNavActive();

        // Page-specific
        switch (page) {
          case "home":
            animateHomePage();
            break;
          case "disc":
            animateDiscoverPage();
            break;
          case "dash":
            animateDashboard();
            break;
          case "vault":
            animateVaultPage();
            break;
          default:
            // Generic: animate cards that just appeared
            if (!prefersReduced) {
              const cards = qsa(".card", pg);
              if (cards.length && cards.length < 30) {
                gsap.from(cards, {
                  y: 20,
                  opacity: 0,
                  duration: 0.45,
                  stagger: 0.04,
                  ease: "cinematic",
                  clearProps: "all",
                });
              }
            }
            break;
        }

        // Cross-page
        animateProgressBars(pg);
        bindCardHovers(pg);
        ScrollTrigger.refresh();

      }, 60);
    });
  }

  /* =========================================================
     20. HOOK INTO THE APP'S RENDER CYCLE
  ========================================================= */
  // Patch the existing global R() function to run animations after render
  const _originalR = window.R;

  function patchR() {
    if (typeof window.R !== "function") {
      setTimeout(patchR, 100);
      return;
    }
    window.R = function () {
      _originalR && _originalR.call(this, ...arguments);
      runPageAnimations();
    };
    console.log("JourneyJar GSAP: Render hook installed ✓");
  }

  // Wait for the main app to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(patchR, 200));
  } else {
    setTimeout(patchR, 200);
  }

  // Also hook into jj-ready event
  window.addEventListener("jj-ready", () => {
    setTimeout(runPageAnimations, 100);
  });

  /* =========================================================
     21. HOME PAGE — Upgrade homePg() HTML to be cinematic
  ========================================================= */
  function upgradedHomePg() {
    // We inject a richer home page while keeping all existing logic intact
    const ic = (n) => `<i data-lucide="${n}"></i>`;
    const E = window.E || ((s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])));
    const D = window.D || {};
    const V = window.V || {};
    const M = window.M || ((n) => n);
    const today = window.today || new Date().toISOString().slice(0, 10);
    const tt = window.tt || ((t) => 0);
    const pct = window.pct || ((t) => 0);
    const fd = window.fd || ((d) => d);
    const nts = window.nts || ((t) => 0);
    const dys = window.dys || ((t) => 1);
    const CK = window.CK || [];
    const CAT = window.CAT || {};
    const plan$ = window["plan$"] || ((t, k) => 0);
    const spent = window.spent || ((t, k) => 0);
    const FT = window.FT || [];

    const T = D.trips || [];
    const t = [...T].filter((z) => z.ret >= today).sort((a, b) => (a.dep > b.dep ? 1 : -1))[0] || T[0];
    const f = D.fav || [];

    // Destinations data for home section
    const TOP_DESTS = [
      ["Santorini", "Greece", "₹58,000", "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=80"],
      ["Bali", "Indonesia", "₹28,000", "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80"],
      ["Manali", "India", "₹8,500", "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80"],
      ["Paris", "France", "₹90,000", "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80"],
      ["Jaipur", "India", "₹6,500", "https://images.unsplash.com/photo-1477586517458-8e0828d4f6d0?w=600&q=80"],
      ["Maldives", "Maldives", "₹1,20,000", "https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=600&q=80"],
    ];

    // Trending movies (placeholder until TMDB loads)
    const MOVIES_PREVIEW = [
      { title: "Oppenheimer", year: "2023", rating: "8.3", poster: "https://image.tmdb.org/t/p/w342/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg" },
      { title: "Dune: Part Two", year: "2024", rating: "8.5", poster: "https://image.tmdb.org/t/p/w342/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg" },
      { title: "The Dark Knight", year: "2008", rating: "9.0", poster: "https://image.tmdb.org/t/p/w342/qJ2tW6WMUDux911r6m7haRef0WH.jpg" },
      { title: "Interstellar", year: "2014", rating: "8.7", poster: "https://image.tmdb.org/t/p/w342/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg" },
      { title: "Inception", year: "2010", rating: "8.8", poster: "https://image.tmdb.org/t/p/w342/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg" },
      { title: "1917", year: "2019", rating: "8.3", poster: "https://image.tmdb.org/t/p/w342/iZf0KyrE25z1sage4SYQLnzLgrh.jpg" },
    ];

    // Dashboard snippet
    let dashSnippet = "";
    if (t) {
      const x = tt(t);
      const dd = Math.ceil((new Date(t.dep) - new Date(today)) / 864e5);
      dashSnippet = `
        <div class="card dk" style="margin-top:0;padding:20px 24px">
          <div class="row" style="margin-bottom:12px">
            <div>
              <span class="mut" style="font-size:11px;text-transform:uppercase;letter-spacing:.1em">Upcoming journey</span>
              <h3 style="margin:4px 0;font-size:20px">${E(t.name)}</h3>
              <div class="mut" style="font-size:13px">${E(t.from || "—")} → ${E(t.to || t.name)} · ${fd(t.dep)} · ${t.trav || 1} traveller(s)</div>
            </div>
            <div class="pill" style="background:rgba(233,185,91,.15);color:var(--gold);font-size:12px;padding:6px 14px">
              ${dd > 0 ? dd + " days left" : dd === 0 ? "Starts today" : "In progress"}
            </div>
          </div>
          <div class="bar"><i class="${x > t.budget ? "o" : ""}" style="width:${Math.min(100, pct(t))}%"></i></div>
          <div class="row mut" style="margin-top:6px">
            <span>${M(x, t.cur)} spent</span>
            <span>of ${M(t.budget, t.cur)}</span>
          </div>
          <button class="btn o" style="margin-top:14px" onclick="go('smart',${t.id})">${ic("eye")} View Full Plan</button>
        </div>`;
    } else {
      dashSnippet = `
        <div class="card dk" style="text-align:center;padding:36px;margin-top:0">
          <div style="font-size:48px;margin-bottom:12px">🧳</div>
          <h3 style="margin:0 0 8px">No trips planned yet</h3>
          <p class="mut" style="margin:0 0 18px">Create your first journey and start tracking.</p>
          <button class="btn" onclick="wiz()">${ic("plus")} Plan a New Journey</button>
        </div>`;
    }

    return `
      <!-- ===== CINEMATIC HERO ===== -->
      <div class="jj-home-wrap">
        <div class="jj-home-hero">
          <div class="jj-hero-bg">
            <img src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1800&q=80"
                 alt="Cinematic travel destination"
                 loading="eager"
                 decoding="async">
          </div>
          <div class="jj-hero-overlay"></div>
          <div class="jj-hero-content">
            <div class="jj-hero-eyebrow">${ic("globe")} Travel &amp; Movie Discovery</div>
            <h1 class="jj-hero-h1">Your Next Story<br><span>Begins Here.</span></h1>
            <p class="jj-hero-sub">
              Discover destinations, explore movies, and collect experiences worth remembering.
            </p>
            <div class="jj-hero-ctas">
              <button class="btn lrg" onclick="go('disc')">
                ${ic("compass")} Explore Destinations
              </button>
              <button class="btn o lrg" onclick="JJDisc && JJDisc.setTab('movies') || go('disc')">
                ${ic("film")} Discover Movies
              </button>
            </div>
          </div>
          <div class="jj-scroll-hint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
            scroll
          </div>
        </div>
      </div>

      <!-- ===== TRENDING DESTINATIONS ===== -->
      <div style="padding: 72px clamp(0px, 3.5vw, 0px) 0">
        <div class="jj-section-header">
          <div class="jj-section-label">${ic("map-pin")} Trending Now</div>
          <h2 class="jj-section-title">Popular Destinations</h2>
          <p class="jj-section-sub">Handpicked places travellers love — start planning in one click</p>
        </div>
        <div class="jj-dest-grid">
          ${TOP_DESTS.map(([name, country, price, img]) => `
            <div class="jj-dest-card" onclick="document.getElementById('h_to')&&(document.getElementById('h_to').value='${name}');wiz()">
              <img src="${img}" alt="${name}" loading="lazy">
              <div class="jj-dest-overlay"></div>
              <div class="jj-dest-body">
                <div class="jj-dest-country">${country}</div>
                <div class="jj-dest-name">${name}</div>
                <div class="jj-dest-price">${ic("tag")} from ${price}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- ===== EXPLORE NEXT JOURNEY (Editorial) ===== -->
      <div style="padding: 72px 0 0">
        <div class="jj-section-header">
          <div class="jj-section-label">${ic("book-open")} Editorial</div>
          <h2 class="jj-section-title">Explore Your Next Journey</h2>
          <p class="jj-section-sub">Curated travel experiences and destination guides</p>
        </div>
        <div class="jj-editorial">
          <div class="jj-editorial-main" onclick="go('disc')">
            <img src="https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=900&q=80" alt="Goa" loading="lazy">
            <div class="jj-editorial-overlay"></div>
            <div class="jj-editorial-label">
              <div class="jj-editorial-tag">Beach Escape</div>
              <div class="jj-editorial-title">The Complete Guide to Goa — Beaches, Food & Hidden Gems</div>
            </div>
          </div>
          <div class="jj-editorial-sm" onclick="go('disc')">
            <img src="https://images.unsplash.com/photo-1566837497312-7be4c9dae936?w=700&q=80" alt="Kashmir" loading="lazy">
            <div class="jj-editorial-overlay"></div>
            <div class="jj-editorial-label">
              <div class="jj-editorial-tag">Mountain</div>
              <div class="jj-editorial-title">Kashmir: Paradise on Earth</div>
            </div>
          </div>
          <div class="jj-editorial-sm" onclick="go('disc')">
            <img src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=700&q=80" alt="Dubai" loading="lazy">
            <div class="jj-editorial-overlay"></div>
            <div class="jj-editorial-label">
              <div class="jj-editorial-tag">City Break</div>
              <div class="jj-editorial-title">Dubai — Modern Wonders &amp; Desert Adventures</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== MOVIE DISCOVERY PREVIEW ===== -->
      <div style="padding: 72px 0 0">
        <div class="jj-section-header">
          <div class="jj-section-label">${ic("film")} Cinema</div>
          <h2 class="jj-section-title">Movie Discovery</h2>
          <p class="jj-section-sub">Explore cinematic journeys — trending films and travel-inspired stories</p>
        </div>
        <div class="jj-movie-scroll" id="jj-home-movies">
          ${MOVIES_PREVIEW.map((m) => `
            <div class="jj-movie-card" onclick="go('disc')">
              <img src="${m.poster}" alt="${m.title}" loading="lazy" onerror="this.style.background='#1C1E24'">
              <div class="jj-movie-card-info">
                <div class="jj-movie-card-title">${m.title}</div>
                <div class="jj-movie-rating">★ ${m.rating}</div>
              </div>
            </div>
          `).join("")}
        </div>
        <div style="text-align:center;margin-top:28px">
          <button class="btn o" onclick="go('disc')">${ic("arrow-right")} Browse All Movies</button>
        </div>
      </div>

      <!-- ===== QUICK SEARCH PANEL ===== -->
      <div style="padding: 72px 0 0">
        <div class="jj-section-header">
          <div class="jj-section-label">${ic("search")} Plan Instantly</div>
          <h2 class="jj-section-title">Start Your Journey</h2>
        </div>
        <div class="search-panel" style="max-width:1000px;margin:0 auto 28px">
          <div><label>Where to?</label><input id="sp_to" placeholder="Manali, Goa, Bali…"></div>
          <div><label>From city</label><input id="sp_from" placeholder="Your city"></div>
          <div><label>Check-in</label><input id="sp_in" type="date"></div>
          <div><label>Check-out</label><input id="sp_out" type="date"></div>
          <div><label>Travellers</label><input id="sp_tr" type="number" min="1" value="2"></div>
          <div><label>Budget (₹)</label><input id="sp_bu" type="number" min="1000" value="25000"></div>
          <button class="btn" onclick="wiz()">${ic("search")} Search</button>
        </div>
      </div>

      <!-- ===== WHY JOURNEY JAR ===== -->
      <div style="padding: 72px 0 0">
        <div class="jj-section-header">
          <div class="jj-section-label">${ic("star")} Platform</div>
          <h2 class="jj-section-title">Why JourneyJar?</h2>
          <p class="jj-section-sub">Everything you need to plan, budget and enjoy your journey — in one place</p>
        </div>
        <div class="jj-features">
          ${[
            ["compass", "Destination Discovery", "Explore thousands of places with real photos, ratings, and local tips powered by OpenTripMap."],
            ["film", "Movie Discovery", "Find films linked to your travel destinations via TMDB integration with trailers and details."],
            ["shield-check", "Travel Vault", "Securely store your travel documents with AES-256 end-to-end encryption on Firebase."],
            ["wallet", "Smart Budget", "AI-powered budget allocation that splits your spend across categories intelligently."],
            ["receipt", "Expense Tracker", "Track every expense in real time and get smart alerts before you overspend."],
            ["users", "Trip Splitter", "Split costs fairly among friends with automatic settlement calculations."],
          ].map(([icon, title, desc]) => `
            <div class="jj-feature-card">
              <div class="jj-feature-icon">${ic(icon)}</div>
              <div class="jj-feature-title">${title}</div>
              <p class="jj-feature-desc">${desc}</p>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- ===== TRIP PLAN QUICK FORM ===== -->
      <div style="padding: 72px 0 0">
        <div class="card fl" id="planner" style="max-width:860px;margin:0 auto">
          <h3 style="font-size:20px;margin-top:0">Plan Your Trip — Quick Start</h3>
          <div class="fg">
            <div><label>Destination</label><input id="h_to" placeholder="e.g. Manali"></div>
            <div><label>Duration (days)</label><input id="h_du" type="number" min="1" max="60" value="4"></div>
            <div><label>Budget in ₹</label><input id="h_bu" type="number" min="1" value="25000"></div>
            <div><label>Travellers</label><input id="h_tr" type="number" min="1" value="2"></div>
            <div><label>Travel style</label>
              <select id="h_st">
                <option>Budget</option>
                <option selected>Standard</option>
                <option>Luxury</option>
              </select>
            </div>
          </div>
          <div id="he"></div>
          <button class="btn" style="margin-top:16px;font-size:15px" onclick="genPlan()">
            ${ic("sparkles")} Generate Plan
          </button>
        </div>
      </div>

      <!-- ===== QUICK FEATURES GRID (classic) ===== -->
      <div style="padding: 56px 0 0">
        <div class="grid a3" style="margin-top:0">
          ${FT.map((z, i) => `
            <div class='card h' onclick='ft(${i})'>
              <div class='st'>
                <div class='ib'>${ic(z[1])}</div>
                <div>
                  <b style='font-size:15px'>${z[0]}</b>
                  <span>${z[2]}</span>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- ===== TRAVEL DASHBOARD ===== -->
      <div style="padding: 56px 0 0">
        <div class="sec-title">Your Travel Dashboard</div>
        <p class="sec-sub">Your trips, budgets and spending at a glance</p>
        ${dashSnippet}
      </div>

      <!-- ===== FINAL CTA ===== -->
      <div style="padding: 72px 0 60px">
        <div class="jj-cta-section">
          <div class="jj-cta-bg"></div>
          <div class="jj-cta-content">
            <div class="jj-section-label" style="margin-bottom:16px">${ic("star")} Get Started</div>
            <h2 class="jj-cta-title">Start Collecting<br>Your Stories.</h2>
            <p class="jj-cta-sub">Join thousands of travellers who plan smarter, discover more, and experience the world beautifully.</p>
            <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
              <button class="btn lrg" onclick="wiz()">${ic("plus")} Plan a New Journey</button>
              <button class="btn o lrg" onclick="go('disc')">${ic("compass")} Discover Places</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== AI BANNER (preserved) ===== -->
      <div class='aib'>
        <div>
          <h2 style='margin:0 0 4px'>Travel Smarter with JourneyJar</h2>
          <p style='margin:0 0 14px;opacity:.9;color:var(--mut)'>Your personal AI travel assistant is here!</p>
          <button class='btn o' onclick='ai()'>${ic("message-circle")} Ask Anything</button>
        </div>
        <svg width='200' height='110' viewBox='0 0 200 110'>
          <path d='M0 100l45-60 30 38 35-50 45 72 25-30 20 30z' fill='#ffffff22'/>
          <path d='M0 100l60-40 40 30 50-35 50 45z' fill='#06331888'/>
          <path d='M120 22l40-8-14 12 22 4-26 6-6 12z' fill='#E9B95B'/>
          <path d='M20 20c30 10 50 0 70 14' stroke='#E9B95B' stroke-dasharray='4 5' fill='none'/>
          <circle cx='20' cy='20' r='4' fill='#E9B95B'/>
        </svg>
      </div>
    `;
  }

  /* =========================================================
     22. PATCH HOMEPG to use the upgraded version
  ========================================================= */
  function patchHomePg() {
    // Try direct function (defined in global scope)
    if (typeof window.homePg === "function") {
      window.homePg = upgradedHomePg;
      return;
    }
    // Try the P object (defined as const P = { home(){ return homePg() }, ... })
    const P = window._JJ_P || window.P;
    if (P && typeof P.home === "function") {
      P.home = upgradedHomePg;
      // Also update the lookup the router uses
      window._JJ_P = P;
      return;
    }
    // Keep trying
    setTimeout(patchHomePg, 150);
  }

  // Run after scripts have loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(patchHomePg, 50);
    });
  } else {
    setTimeout(patchHomePg, 50);
  }

  window.addEventListener("jj-ready", () => {
    setTimeout(patchHomePg, 50);
  });

  /* =========================================================
     23. INIT OBSERVER & DRAGGABLE
  ========================================================= */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => {
        initObserver();
        initMovieDraggable();
      }, 500);
    });
  } else {
    setTimeout(() => {
      initObserver();
      initMovieDraggable();
    }, 500);
  }

  console.log("JourneyJar GSAP Premium Layer: loaded ✓");

})();

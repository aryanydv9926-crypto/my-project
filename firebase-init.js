// ============================================================
//  firebase-init.js  (ES module, Firebase modular SDK v10)
//  - Initialises the Firebase App exactly ONCE (getApps() guard)
//  - Initialises Authentication and Cloud Firestore
//  - Exposes window.JJ (auth + Firestore helpers) and fires "jj-ready"
//  Discovery data is stored in:
//    users/{uid}/discoveries/{slug}     legacy saved destinations
//    users/{uid}/searches/{slug}        recent searches
//    users/{uid}/favoritePlaces/{id}    Travel Discovery favourites
//    users/{uid}/favoriteMovies/{id}    Movie Discovery favourites
//  Trips, budgets and expenses keep syncing in users/{uid}.
//  Trip Sync (collaborative rooms) uses top-level collections:
//    trips/{tripId}/...  and  tripInvites/{code}
// ============================================================
const SDK = "https://www.gstatic.com/firebasejs/10.12.2/";
const slug = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "x";
const ready = (jj) => { window.JJ = jj; window.dispatchEvent(new Event("jj-ready")); };

try {
  const { firebaseConfig, DISCOVER_CONFIG } = await import("./firebase-config.js");
  window.DISCOVER_CONFIG = DISCOVER_CONFIG;
  const missing = ["apiKey", "authDomain", "projectId", "appId"]
    .filter((k) => !firebaseConfig[k] || String(firebaseConfig[k]).includes("YOUR_"));
  if (missing.length) {
    ready({ ok: false, sdk: true, missing });
  } else {
    const [A, Au, Fs] = await Promise.all([
      import(SDK + "firebase-app.js"),
      import(SDK + "firebase-auth.js"),
      import(SDK + "firebase-firestore.js"),
    ]);
    const app = A.getApps().length ? A.getApp() : A.initializeApp(firebaseConfig);
    const auth = Au.getAuth(app);
    let db;
    try {
      db = Fs.initializeFirestore(app, { localCache: Fs.persistentLocalCache({ tabManager: Fs.persistentMultipleTabManager() }) });
    } catch (e) {
      db = Fs.getFirestore(app);
    }
    const col = (uid, name) => Fs.collection(db, "users", uid, name);

    const FS = {
      db,
      doc: Fs.doc,
      collection: Fs.collection,
      setDoc: Fs.setDoc,
      getDoc: Fs.getDoc,
      getDocs: Fs.getDocs,
      addDoc: Fs.addDoc,
      updateDoc: Fs.updateDoc,
      deleteDoc: Fs.deleteDoc,
      onSnapshot: Fs.onSnapshot,
      query: Fs.query,
      where: Fs.where,
      orderBy: Fs.orderBy,
      limit: Fs.limit,
      serverTimestamp: Fs.serverTimestamp,
      writeBatch: Fs.writeBatch,
      Timestamp: Fs.Timestamp,
      arrayUnion: Fs.arrayUnion,
      arrayRemove: Fs.arrayRemove,
      increment: Fs.increment,
    };

    ready({
      ok: true, sdk: true, missing: [],
      onAuth: (cb) => Au.onAuthStateChanged(auth, cb, () => cb(null)),
      signIn: (email, pw) => Au.signInWithEmailAndPassword(auth, email, pw),
      signUp: async (email, pw, name) => {
        const c = await Au.createUserWithEmailAndPassword(auth, email, pw);
        if (name) await Au.updateProfile(c.user, { displayName: name });
        return c;
      },
      reset: (email) => Au.sendPasswordResetEmail(auth, email),
      google: () => Au.signInWithPopup(auth, new Au.GoogleAuthProvider()),
      signOut: () => Au.signOut(auth),
      setName: (name) => auth.currentUser ? Au.updateProfile(auth.currentUser, { displayName: name }) : Promise.resolve(),
      currentUser: () => auth.currentUser,
      saveUser: (uid, data) => Fs.setDoc(Fs.doc(db, "users", uid), data),
      watchUser: (uid, cb, err) => Fs.onSnapshot(Fs.doc(db, "users", uid), cb, err),

      // Legacy destination discoveries (kept for backward compatibility)
      saveDiscovery: (uid, d) => Fs.setDoc(Fs.doc(col(uid, "discoveries"), slug(d.name)), {
        name: String(d.name).slice(0, 100), title: String(d.title || d.name).slice(0, 160),
        desc: String(d.desc || "").slice(0, 300), summary: String(d.summary || "").slice(0, 700),
        cover: d.cover || "", source: d.source || "wikipedia", lat: d.lat ?? null, lon: d.lon ?? null,
        savedAt: Fs.serverTimestamp(),
      }),
      getDiscoveries: async (uid) => {
        const s = await Fs.getDocs(Fs.query(col(uid, "discoveries"), Fs.orderBy("savedAt", "desc")));
        return s.docs.map((x) => ({ id: x.id, ...x.data(), savedAt: x.data().savedAt?.toMillis?.() || 0 }));
      },
      removeDiscovery: (uid, name) => Fs.deleteDoc(Fs.doc(col(uid, "discoveries"), slug(name))),

      // Recent searches
      recordSearch: (uid, q) => Fs.setDoc(Fs.doc(col(uid, "searches"), slug(q)), { q: String(q).slice(0, 100), at: Fs.serverTimestamp() }),
      getSearches: async (uid) => {
        const s = await Fs.getDocs(Fs.query(col(uid, "searches"), Fs.orderBy("at", "desc"), Fs.limit(8)));
        return s.docs.map((x) => x.data().q);
      },

      // ---- New: Travel favourites (OpenTripMap places) ----
      saveFavoritePlace: (uid, place) => {
        const id = slug(place.xid || place.name || Date.now().toString());
        return Fs.setDoc(Fs.doc(col(uid, "favoritePlaces"), id), {
          xid: String(place.xid || "").slice(0, 40),
          name: String(place.name || "").slice(0, 120),
          kinds: Array.isArray(place.kinds) ? place.kinds.slice(0, 12) : [],
          lat: place.lat ?? null,
          lon: place.lon ?? null,
          image: String(place.image || "").slice(0, 400),
          description: String(place.description || "").slice(0, 600),
          mapUrl: String(place.mapUrl || "").slice(0, 300),
          rate: place.rate || 0,
          savedAt: Fs.serverTimestamp(),
        });
      },
      getFavoritePlaces: async (uid) => {
        const s = await Fs.getDocs(Fs.query(col(uid, "favoritePlaces"), Fs.orderBy("savedAt", "desc")));
        return s.docs.map((x) => ({ id: x.id, ...x.data(), savedAt: x.data().savedAt?.toMillis?.() || 0 }));
      },
      removeFavoritePlace: (uid, id) => Fs.deleteDoc(Fs.doc(col(uid, "favoritePlaces"), id)),

      // ---- New: Movie favourites (TMDB) ----
      saveFavoriteMovie: (uid, movie) => {
        const id = String(movie.id || slug(movie.title));
        return Fs.setDoc(Fs.doc(col(uid, "favoriteMovies"), id), {
          tmdbId: Number(movie.id) || 0,
          title: String(movie.title || "").slice(0, 160),
          overview: String(movie.overview || "").slice(0, 500),
          poster: String(movie.poster || "").slice(0, 300),
          backdrop: String(movie.backdrop || "").slice(0, 300),
          rating: String(movie.rating || "").slice(0, 8),
          year: String(movie.year || "").slice(0, 8),
          release: String(movie.release || "").slice(0, 12),
          savedAt: Fs.serverTimestamp(),
        });
      },
      getFavoriteMovies: async (uid) => {
        const s = await Fs.getDocs(Fs.query(col(uid, "favoriteMovies"), Fs.orderBy("savedAt", "desc")));
        return s.docs.map((x) => ({ id: x.id, ...x.data(), savedAt: x.data().savedAt?.toMillis?.() || 0 }));
      },
      removeFavoriteMovie: (uid, id) => Fs.deleteDoc(Fs.doc(col(uid, "favoriteMovies"), id)),

      FS,
    });
  }
} catch (e) {
  console.error("Firebase module failed to start:", e);
  ready({ ok: false, sdk: false, missing: [], error: e.message });
}

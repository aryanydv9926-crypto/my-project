// ============================================================
//  firebase-init.js  (ES module, Firebase modular SDK v10)
//  - Initialises the Firebase App exactly ONCE (getApps() guard)
//  - Initialises Authentication and Cloud Firestore
//  - Exposes window.JJ (auth + Firestore helpers) and fires "jj-ready"
//  Discovery data is stored in:
//    users/{uid}/discoveries/{slug}  saved destinations
//    users/{uid}/searches/{slug}     recent searches
//  Trips, budgets and expenses keep syncing in users/{uid}.
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
    const app = A.getApps().length ? A.getApp() : A.initializeApp(firebaseConfig); // initialise once
    const auth = Au.getAuth(app);
    let db;
    try {
      db = Fs.initializeFirestore(app, { localCache: Fs.persistentLocalCache({ tabManager: Fs.persistentMultipleTabManager() }) });
    } catch (e) {
      db = Fs.getFirestore(app); // already initialised, or persistence unavailable
    }
    const col = (uid, name) => Fs.collection(db, "users", uid, name);
    ready({
      ok: true, sdk: true, missing: [],
      // ---- Authentication
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
      // ---- User document (trips, budgets, expenses...)
      saveUser: (uid, data) => Fs.setDoc(Fs.doc(db, "users", uid), data),
      watchUser: (uid, cb, err) => Fs.onSnapshot(Fs.doc(db, "users", uid), cb, err),
      // ---- Discovery data
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
      recordSearch: (uid, q) => Fs.setDoc(Fs.doc(col(uid, "searches"), slug(q)), { q: String(q).slice(0, 100), at: Fs.serverTimestamp() }),
      getSearches: async (uid) => {
        const s = await Fs.getDocs(Fs.query(col(uid, "searches"), Fs.orderBy("at", "desc"), Fs.limit(8)));
        return s.docs.map((x) => x.data().q);
      },
    });
  }
} catch (e) {
  console.error("Firebase module failed to start:", e);
  ready({ ok: false, sdk: false, missing: [], error: e.message });
}

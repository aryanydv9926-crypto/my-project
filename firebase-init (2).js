// ============================================================
//  firebase-init.js  (ES module, Firebase modular SDK v10)
//  - Initialises the Firebase App exactly ONCE (getApps() guard)
//  - Initialises Authentication and Cloud Firestore
//  - Exposes window.JJ (auth + Firestore helpers) and fires "jj-ready"
//  Discovery data is stored in:
//    users/{uid}/discoveries/{slug}  saved destinations
//    users/{uid}/searches/{slug}     recent searches
//  Travel Vault (files in Storage, metadata and notes in Firestore) is makeVault(), exposed as window.JJ.vault
//  Trip Sync (collaborative trips) lives in makeTs() below, exposed as window.JJ.ts
//  Trips, budgets and expenses keep syncing in users/{uid}.
// ============================================================
const SDK = "https://www.gstatic.com/firebasejs/10.12.2/";
const slug = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "x";
const ready = (jj) => { window.JJ = jj; window.dispatchEvent(new Event("jj-ready")); };

// ---------- Trip Sync data layer (collaborative trips) ----------
// trips/{tripId}                      shared trip (memberIds[], ownerId, createdBy)
// trips/{tripId}/members/{uid}        member profile + role (owner | member)
// trips/{tripId}/{itinerary|destinations|expenses|hotels|activities}/{id}
// trips/{tripId}/activityLogs/{id}    live activity feed
// tripInvites/{code}                  random 26-character invitation code (capability secret)
function makeTs(Fs, db) {
  const now = () => Fs.serverTimestamp();
  const colRef = (tid, n) => Fs.collection(db, "trips", tid, n);
  const log = (u, type, desc) => ({ userId: u.uid, userName: u.name, type, desc: String(desc).slice(0, 200), createdAt: now() });
  const alphabet = "abcdefghijklmnopqrstuvwxyz234567";
  const code = () => { const a = new Uint8Array(26); crypto.getRandomValues(a); return Array.from(a, (b) => alphabet[b % 32]).join(""); }; // 130 bits
  const inviteDoc = (u, tid, t) => ({ tripId: tid, tripName: t.name, destination: t.destination, createdBy: u.uid, createdAt: now(), expiresAt: Fs.Timestamp.fromMillis(Date.now() + 7 * 864e5), active: true });
  const err = (c) => Object.assign(new Error(c), { code: "jj/" + c });
  return {
    watchMyTrips: (uid, cb, er) => Fs.onSnapshot(Fs.query(Fs.collection(db, "trips"), Fs.where("memberIds", "array-contains", uid)), cb, er),
    watchTrip: (tid, cb, er) => Fs.onSnapshot(Fs.doc(db, "trips", tid), { includeMetadataChanges: true }, cb, er),
    watchSub: (tid, n, cb, er, lim) => Fs.onSnapshot(lim ? Fs.query(colRef(tid, n), Fs.orderBy("createdAt", "desc"), Fs.limit(lim)) : colRef(tid, n), { includeMetadataChanges: false }, cb, er),
    getInvite: async (c) => { const s = await Fs.getDoc(Fs.doc(db, "tripInvites", c)); return { exists: s.exists(), data: s.exists() ? s.data() : null }; },
    createTrip: async (u, t) => {
      const ref = Fs.doc(Fs.collection(db, "trips")), id = ref.id, c = code(), b = Fs.writeBatch(db);
      b.set(ref, { name: t.name, destination: t.destination, startDate: t.startDate, endDate: t.endDate, description: t.description, budget: t.budget, createdBy: u.uid, ownerId: u.uid, memberIds: [u.uid], createdAt: now(), updatedAt: now() });
      b.set(Fs.doc(db, "trips", id, "members", u.uid), { uid: u.uid, name: u.name, email: u.email, photoURL: u.photoURL, role: "owner", joinedAt: now() });
      b.set(Fs.doc(db, "tripInvites", c), inviteDoc(u, id, t));
      b.set(Fs.doc(colRef(id, "activityLogs")), log(u, "trip_created", "created the trip " + t.name));
      await b.commit();
      return { id, code: c };
    },
    joinTrip: async (u, c, inv) => {
      const b = Fs.writeBatch(db), tid = inv.tripId;
      b.set(Fs.doc(db, "trips", tid, "members", u.uid), { uid: u.uid, name: u.name, email: u.email, photoURL: u.photoURL, role: "member", joinedAt: now(), inviteCode: c });
      b.update(Fs.doc(db, "trips", tid), { memberIds: Fs.arrayUnion(u.uid), updatedAt: now() });
      b.set(Fs.doc(colRef(tid, "activityLogs")), log(u, "member_joined", "joined the trip"));
      await b.commit();
      return tid;
    },
    // add (id = null) or edit a shared item; edits use a transaction and refuse to overwrite a newer change
    itemSave: async (u, tid, coll, id, data, baseMs, desc, type) => {
      const lg = Fs.doc(colRef(tid, "activityLogs"));
      if (!id) {
        const ref = Fs.doc(colRef(tid, coll)), b = Fs.writeBatch(db);
        b.set(ref, { ...data, createdBy: u.uid, createdByName: u.name, createdAt: now(), updatedAt: now() });
        b.set(lg, log(u, type, desc));
        await b.commit();
        return ref.id;
      }
      const ref = Fs.doc(db, "trips", tid, coll, id);
      await Fs.runTransaction(db, async (tx) => {
        const s = await tx.get(ref);
        if (!s.exists()) throw err("gone");
        const cur = s.data().updatedAt?.toMillis?.() || 0;
        if (baseMs && cur && cur !== baseMs) throw err("conflict");
        tx.update(ref, { ...data, updatedAt: now() });
        tx.set(lg, log(u, type, desc));
      });
      return id;
    },
    itemDelete: async (u, tid, coll, id, desc, type) => {
      const b = Fs.writeBatch(db);
      b.delete(Fs.doc(db, "trips", tid, coll, id));
      b.set(Fs.doc(colRef(tid, "activityLogs")), log(u, type, desc));
      await b.commit();
    },
    tripUpdate: async (u, tid, patch, desc, type) => {
      const b = Fs.writeBatch(db);
      b.update(Fs.doc(db, "trips", tid), { ...patch, updatedAt: now() });
      b.set(Fs.doc(colRef(tid, "activityLogs")), log(u, type, desc));
      await b.commit();
    },
    leaveTrip: async (u, tid) => {
      await Fs.setDoc(Fs.doc(colRef(tid, "activityLogs")), log(u, "member_left", "left the trip")); // while still a member
      const b = Fs.writeBatch(db);
      b.delete(Fs.doc(db, "trips", tid, "members", u.uid));
      b.update(Fs.doc(db, "trips", tid), { memberIds: Fs.arrayRemove(u.uid), updatedAt: now() });
      await b.commit();
    },
    removeMember: async (u, tid, mid, name) => {
      const b = Fs.writeBatch(db);
      b.delete(Fs.doc(db, "trips", tid, "members", mid));
      b.update(Fs.doc(db, "trips", tid), { memberIds: Fs.arrayRemove(mid), updatedAt: now() });
      b.set(Fs.doc(colRef(tid, "activityLogs")), log(u, "member_removed", "removed " + name + " from the trip"));
      await b.commit();
    },
    transferOwner: async (u, tid, mid, name) => {
      const b = Fs.writeBatch(db);
      b.update(Fs.doc(db, "trips", tid), { ownerId: mid, updatedAt: now() });
      b.update(Fs.doc(db, "trips", tid, "members", u.uid), { role: "member" });
      b.update(Fs.doc(db, "trips", tid, "members", mid), { role: "owner" });
      b.set(Fs.doc(colRef(tid, "activityLogs")), log(u, "owner_changed", "made " + name + " the trip owner"));
      await b.commit();
    },
    newInvite: async (u, tid, t) => { const c = code(); await Fs.setDoc(Fs.doc(db, "tripInvites", c), inviteDoc(u, tid, t)); return c; },
    revokeInvite: (c) => Fs.updateDoc(Fs.doc(db, "tripInvites", c), { active: false }),
    listInvites: async (tid) => (await Fs.getDocs(Fs.query(Fs.collection(db, "tripInvites"), Fs.where("tripId", "==", tid)))).docs.map((x) => ({ id: x.id, ...x.data() })),
    deleteTrip: async (u, tid) => {
      const refs = [];
      for (const n of ["itinerary", "destinations", "expenses", "hotels", "activities", "activityLogs", "members"]) {
        (await Fs.getDocs(colRef(tid, n))).docs.forEach((d) => { if (!(n === "members" && d.id === u.uid)) refs.push(d.ref); });
      }
      (await Fs.getDocs(Fs.query(Fs.collection(db, "tripInvites"), Fs.where("tripId", "==", tid)))).docs.forEach((d) => refs.push(d.ref));
      for (let i = 0; i < refs.length; i += 400) { const b = Fs.writeBatch(db); refs.slice(i, i + 400).forEach((r) => b.delete(r)); await b.commit(); }
      const last = Fs.writeBatch(db); // owner's own membership + the trip itself, together
      last.delete(Fs.doc(db, "trips", tid, "members", u.uid));
      last.delete(Fs.doc(db, "trips", tid));
      await last.commit();
    },
  };
}

// ---------- Travel Vault data layer ----------
// Files:     Firebase Storage  users/{uid}/vault/{docId}/{fileName}
// Metadata:  Firestore         users/{uid}/vault/{docId}
// Notes:     Firestore         users/{uid}/vaultNotes/{noteId}
function makeVault(Fs, Su, db, st) {
  const ref = (uid, id) => Fs.doc(db, "users", uid, "vault", id);
  return {
    watchDocs: (uid, trip, cb, er) => Fs.onSnapshot(Fs.query(Fs.collection(db, "users", uid, "vault"), Fs.where("tripId", "==", trip)), { includeMetadataChanges: true }, cb, er),
    watchNotes: (uid, trip, cb, er) => Fs.onSnapshot(Fs.query(Fs.collection(db, "users", uid, "vaultNotes"), Fs.where("tripId", "==", trip)), { includeMetadataChanges: true }, cb, er),
    has: async (uid, id) => (await Fs.getDoc(ref(uid, id))).exists(),
    // Uploads the file with progress, then writes the metadata. If the metadata write fails the file is removed again.
    upload: (uid, trip, file, cat, onProgress, fixedId) => new Promise((resolve, reject) => {
      const id = fixedId || Fs.doc(Fs.collection(db, "users", uid, "vault")).id;
      const safe = file.name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(-100) || "file";
      const path = `users/${uid}/vault/${id}/${safe}`;
      const task = Su.uploadBytesResumable(Su.ref(st, path), file, { contentType: file.type });
      task.on("state_changed", (s) => onProgress && onProgress((s.bytesTransferred / s.totalBytes) * 100), reject, async () => {
        try {
          await Fs.setDoc(ref(uid, id), { name: file.name.slice(0, 200), cat, tripId: trip, type: file.type, size: file.size, path, createdAt: Fs.serverTimestamp(), updatedAt: Fs.serverTimestamp() });
          resolve(id);
        } catch (e) {
          try { await Su.deleteObject(Su.ref(st, path)); } catch (_) { /* nothing to clean */ }
          reject(e);
        }
      });
    }),
    url: (path) => Su.getDownloadURL(Su.ref(st, path)),
    blob: (path) => Su.getBlob(Su.ref(st, path)),
    rename: (uid, id, name) => Fs.updateDoc(ref(uid, id), { name: name.slice(0, 200), updatedAt: Fs.serverTimestamp() }),
    // deletes the Storage file first, then its record (a missing file is fine)
    remove: async (uid, id, path) => {
      try { await Su.deleteObject(Su.ref(st, path)); } catch (e) { if (e.code !== "storage/object-not-found") throw e; }
      await Fs.deleteDoc(ref(uid, id));
    },
    saveNote: (uid, trip, id, d) => id
      ? Fs.updateDoc(Fs.doc(db, "users", uid, "vaultNotes", id), { title: d.title, body: d.body, updatedAt: Fs.serverTimestamp() })
      : Fs.addDoc(Fs.collection(db, "users", uid, "vaultNotes"), { title: d.title, body: d.body, tripId: trip, createdAt: Fs.serverTimestamp(), updatedAt: Fs.serverTimestamp() }),
    deleteNote: (uid, id) => Fs.deleteDoc(Fs.doc(db, "users", uid, "vaultNotes", id)),
  };
}

try {
  const { firebaseConfig, DISCOVER_CONFIG } = await import("./firebase-config.js");
  window.DISCOVER_CONFIG = DISCOVER_CONFIG;
  const missing = ["apiKey", "authDomain", "projectId", "appId"]
    .filter((k) => !firebaseConfig[k] || String(firebaseConfig[k]).includes("YOUR_"));
  if (missing.length) {
    ready({ ok: false, sdk: true, missing });
  } else {
    const [A, Au, Fs, Su] = await Promise.all([
      import(SDK + "firebase-app.js"),
      import(SDK + "firebase-auth.js"),
      import(SDK + "firebase-firestore.js"),
      import(SDK + "firebase-storage.js"),
    ]);
    const app = A.getApps().length ? A.getApp() : A.initializeApp(firebaseConfig); // initialise once
    const auth = Au.getAuth(app);
    let db;
    try {
      db = Fs.initializeFirestore(app, { localCache: Fs.persistentLocalCache({ tabManager: Fs.persistentMultipleTabManager() }) });
    } catch (e) {
      db = Fs.getFirestore(app); // already initialised, or persistence unavailable
    }
    const st = Su.getStorage(app); // bucket comes from storageBucket in firebase-config.js
    const col = (uid, name) => Fs.collection(db, "users", uid, name);
    ready({
      ok: true, sdk: true, missing: [],
      ts: makeTs(Fs, db),
      vault: makeVault(Fs, Su, db, st),
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

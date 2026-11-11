/* JourneyJar Travel Vault — Firebase edition
 * Auth (existing) + Storage + Firestore + client-side AES-GCM encryption.
 * No admin/service-account keys anywhere: only the public web config your app already has.
 *
 * Usage (in your existing module script, AFTER initializeApp + your login code):
 *   import { initTravelVault } from "./travel-vault.js";
 *   initTravelVault({ app });           // `app` = your existing initializeApp() result
 *
 * IMPORTANT: keep the Firebase SDK version in the imports below identical to the one
 * your index.html already uses (change 10.12.2 if yours differs).
 */
import { getAuth, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, deleteDoc, onSnapshot,
         query, orderBy, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getBytes, deleteObject }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const MAX_BYTES = 10 * 1024 * 1024;                       // 10 MB (mirrored in rules)
const ALLOWED = { "application/pdf": "PDF", "image/jpeg": "JPG", "image/png": "PNG" };
const DEFAULT_CATEGORIES = ["Passport", "ID Proof", "Visa", "Tickets", "Hotel", "Insurance", "Other"];
const SENSITIVE_DEFAULT = new Set(["Passport", "ID Proof", "Visa", "Insurance"]);
const KDF_ITERATIONS = 310000;
const VERIFIER_TEXT = "JOURNEYJAR-VAULT-OK";
const enc = new TextEncoder(), dec = new TextDecoder();

/* ---------- small helpers ---------- */
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const fmtSize = (n) => n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`;
const fmtDate = (ts) => ts?.toDate ? ts.toDate().toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—";
function h(tag, attrs = {}, ...kids) {                       // XSS-safe element builder (textContent only)
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) el.setAttribute(k, v === true ? "" : v);
  }
  kids.flat().forEach((c) => c != null && el.append(c.nodeType ? c : document.createTextNode(c)));
  return el;
}
function friendlyError(e) {
  const c = e?.code || "";
  if (c.includes("unauthorized") || c.includes("permission-denied")) return "Permission denied. Please log in again.";
  if (c.includes("quota")) return "Storage quota exceeded.";
  if (c.includes("canceled")) return "Upload cancelled.";
  if (c.includes("network") || c.includes("unavailable")) return "Network problem. Check your connection and retry.";
  if (c.includes("object-not-found")) return "File no longer exists in storage.";
  if (e?.name === "OperationError") return "Decryption failed — wrong passphrase or corrupted file.";
  return e?.message || "Something went wrong.";
}

/* ---------- encryption (AES-256-GCM, key from user passphrase via PBKDF2) ---------- */
async function deriveKey(pass, salt, iterations) {
  const base = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, base,
    { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);   // non-extractable
}
const aad = (uid, id) => enc.encode(`${uid}:${id}`);                    // binds ciphertext to owner + doc
async function encryptBytes(key, buf, uid, id) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: aad(uid, id) }, key, buf);
  return { iv: b64(iv), data: ct };
}
const decryptBytes = (key, buf, ivB64, uid, id) =>
  crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(ivB64), additionalData: aad(uid, id) }, key, buf);

/* ---------- main ---------- */
export function initTravelVault(opts = {}) {
  const app = opts.app;
  if (!app) throw new Error("initTravelVault({ app }) needs your existing Firebase app instance.");
  const auth = getAuth(app), db = getFirestore(app), storage = getStorage(app);   // reuse existing auth
  const mount = typeof opts.mount === "string" || !opts.mount ? document.querySelector(opts.mount || "#travelVaultRoot") : opts.mount;
  if (!mount) throw new Error("Travel Vault mount element not found (#travelVaultRoot).");
  const categories = opts.categories || DEFAULT_CATEGORIES;
  const warnSel = opts.localWarningSelector ||
    "#vaultLocalWarning, [data-local-prototype-warning], .vault-local-warning, .local-prototype-warning";

  const S = { user: null, docs: [], filter: "All", search: "", key: null, loading: true,
              error: "", uploads: new Map(), unsub: null, warningCleared: false };

  /* ---- DOM scaffold ---- */
  injectCss();
  const root = h("section", { class: "jv" }); mount.replaceChildren(root);
  const banner = h("div", { class: "jv-banner", role: "alert", hidden: true });
  const toolbar = h("div", { class: "jv-toolbar" });
  const uploadBox = h("div", { class: "jv-upload" });
  const chips = h("div", { class: "jv-chips" });
  const list = h("div", { class: "jv-list", "aria-live": "polite" });
  root.append(banner, uploadBox, toolbar, chips, list);

  const searchInput = h("input", { type: "search", class: "jv-input", placeholder: "Search documents…", "aria-label": "Search documents",
    oninput: (e) => { S.search = e.target.value.trim().toLowerCase(); renderList(); } });
  toolbar.append(searchInput);

  const fileInput = h("input", { type: "file", accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png", multiple: true, hidden: true,
    onchange: (e) => { handleFiles([...e.target.files]); e.target.value = ""; } });
  const catSelect = h("select", { class: "jv-input", "aria-label": "Category" }, categories.map((c) => h("option", { value: c }, c)));
  const encBox = h("input", { type: "checkbox", id: "jvEnc", checked: true });
  catSelect.addEventListener("change", () => { encBox.checked = SENSITIVE_DEFAULT.has(catSelect.value); });
  encBox.checked = SENSITIVE_DEFAULT.has(catSelect.value);
  const dropzone = h("div", { class: "jv-drop", tabindex: "0", role: "button", "aria-label": "Choose files to upload",
    onclick: () => fileInput.click(), onkeydown: (e) => (e.key === "Enter" || e.key === " ") && fileInput.click(),
    ondragover: (e) => { e.preventDefault(); dropzone.classList.add("over"); },
    ondragleave: () => dropzone.classList.remove("over"),
    ondrop: (e) => { e.preventDefault(); dropzone.classList.remove("over"); handleFiles([...e.dataTransfer.files]); } },
    h("strong", {}, "Drop files here or click to upload"), h("span", {}, "PDF, JPG, PNG · max 10 MB each"));
  const uploadsList = h("div", { class: "jv-uploads" });
  uploadBox.append(h("div", { class: "jv-row" }, catSelect,
    h("label", { class: "jv-check", for: "jvEnc" }, encBox, " Encrypt (end-to-end)")), dropzone, fileInput, uploadsList);

  /* ---- rendering ---- */
  function showError(msg) { S.error = msg; banner.hidden = !msg; banner.textContent = msg || ""; }
  function renderChips() {
    chips.replaceChildren(...["All", ...categories].map((c) => {
      const n = c === "All" ? S.docs.length : S.docs.filter((d) => d.category === c).length;
      return h("button", { type: "button", class: "jv-chip" + (S.filter === c ? " active" : ""),
        onclick: () => { S.filter = c; renderChips(); renderList(); } }, `${c} (${n})`);
    }));
  }
  function visibleDocs() {
    return S.docs.filter((d) => (S.filter === "All" || d.category === S.filter) &&
      (!S.search || `${d.fileName} ${d.category}`.toLowerCase().includes(S.search)));
  }
  function renderList() {
    if (!S.user) { list.replaceChildren(h("p", { class: "jv-empty" }, "🔒 Please log in to open your private Travel Vault.")); return; }
    if (S.loading) { list.replaceChildren(h("p", { class: "jv-empty" }, "Loading your vault…")); return; }
    const docs = visibleDocs();
    if (!docs.length) { list.replaceChildren(h("p", { class: "jv-empty" },
      S.docs.length ? "No documents match your filter or search." : "Your vault is empty. Upload your first document above.")); return; }
    list.replaceChildren(...docs.map((d) => {
      const busy = h("span", { class: "jv-busy", hidden: true }, "Working…");
      const act = (fn) => async (ev) => { const b = ev.currentTarget; b.disabled = true; busy.hidden = false;
        try { await fn(d); } catch (e) { showError(friendlyError(e)); } finally { b.disabled = false; busy.hidden = true; } };
      return h("article", { class: "jv-card" },
        h("div", { class: "jv-ico" }, ALLOWED[d.mimeType] || "FILE"),
        h("div", { class: "jv-meta" },
          h("div", { class: "jv-name" }, d.fileName, d.encrypted ? h("span", { class: "jv-lock", title: "End-to-end encrypted" }, " 🔒") : null),
          h("div", { class: "jv-sub" }, `${d.category} · ${fmtSize(d.size)} · ${fmtDate(d.uploadedAt)}`), busy),
        h("div", { class: "jv-actions" },
          h("button", { class: "jv-btn", type: "button", onclick: act(preview) }, "Preview"),
          h("button", { class: "jv-btn", type: "button", onclick: act(download) }, "Download"),
          h("button", { class: "jv-btn danger", type: "button", onclick: act(remove) }, "Delete")));
    }));
  }
  function renderUploads() {
    uploadsList.replaceChildren(...[...S.uploads.values()].map((u) =>
      h("div", { class: "jv-up" }, h("span", {}, `${u.name} — ${u.status}`),
        h("progress", { max: 100, value: u.pct }),
        u.cancel ? h("button", { class: "jv-btn", type: "button", onclick: u.cancel }, "Cancel") : null)));
  }

  /* ---- key management: passphrase -> PBKDF2 -> in-memory non-extractable AES key ---- */
  const cfgRef = () => doc(db, "users", S.user.uid, "vaultConfig", "main");
  async function ensureKey() {
    if (S.key) return S.key;
    const snap = await getDoc(cfgRef());
    if (!snap.exists()) {
      const pass = await askPassphrase({ create: true });
      if (!pass) throw new Error("Encryption passphrase required.");
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const key = await deriveKey(pass, salt, KDF_ITERATIONS);
      const v = await encryptBytes(key, enc.encode(VERIFIER_TEXT), S.user.uid, "verifier");
      await setDoc(cfgRef(), { salt: b64(salt), iterations: KDF_ITERATIONS, verifierIv: v.iv,
        verifier: b64(v.data), version: 1, createdAt: serverTimestamp() });
      return (S.key = key);
    }
    const c = snap.data();
    for (let tries = 0; tries < 3; tries++) {
      const pass = await askPassphrase({ create: false, retry: tries > 0 });
      if (!pass) throw new Error("Vault passphrase required to open encrypted files.");
      const key = await deriveKey(pass, unb64(c.salt), c.iterations);
      try { await decryptBytes(key, unb64(c.verifier), c.verifierIv, S.user.uid, "verifier"); return (S.key = key); }
      catch { /* wrong passphrase → retry */ }
    }
    throw new Error("Incorrect passphrase.");
  }
  function askPassphrase({ create, retry }) {
    return new Promise((resolve) => {
      const p1 = h("input", { type: "password", class: "jv-input", autocomplete: create ? "new-password" : "current-password", placeholder: "Vault passphrase" });
      const p2 = create ? h("input", { type: "password", class: "jv-input", autocomplete: "new-password", placeholder: "Confirm passphrase" }) : null;
      const err = h("div", { class: "jv-err" }, retry ? "Wrong passphrase, try again." : "");
      const close = (v) => { m.remove(); resolve(v); };
      const ok = () => {
        if (create && p1.value.length < 10) return (err.textContent = "Use at least 10 characters.");
        if (create && p1.value !== p2.value) return (err.textContent = "Passphrases do not match.");
        if (!p1.value) return (err.textContent = "Enter your passphrase."); close(p1.value);
      };
      const m = modal(create ? "Create your vault passphrase" : "Unlock encrypted documents",
        h("p", { class: "jv-note" }, create
          ? "This passphrase encrypts your files on this device before upload. It is never sent anywhere. If you forget it, encrypted files CANNOT be recovered — not even by us."
          : "Enter the passphrase you created for your vault."),
        p1, p2, err, h("div", { class: "jv-row" },
          h("button", { class: "jv-btn", type: "button", onclick: () => close(null) }, "Cancel"),
          h("button", { class: "jv-btn primary", type: "button", onclick: ok }, create ? "Create" : "Unlock")));
      [p1, p2].forEach((i) => i && i.addEventListener("keydown", (e) => e.key === "Enter" && ok()));
      p1.focus();
    });
  }

  /* ---- upload ---- */
  async function handleFiles(files) {
    if (!S.user) return showError("Please log in first.");
    showError("");
    for (const f of files) {
      if (!ALLOWED[f.type]) { showError(`"${f.name}" skipped: only PDF, JPG and PNG are allowed.`); continue; }
      if (f.size > MAX_BYTES) { showError(`"${f.name}" skipped: larger than 10 MB.`); continue; }
      if (f.size === 0) { showError(`"${f.name}" skipped: file is empty.`); continue; }
      await uploadOne(f, catSelect.value, encBox.checked);
    }
  }
  async function uploadOne(file, category, encrypt) {
    const uid = S.user.uid;
    const dref = doc(collection(db, "users", uid, "travelVault"));         // generates id
    const id = dref.id, storagePath = `users/${uid}/travelVault/${id}`;
    const u = { name: file.name, pct: 0, status: "Preparing…", cancel: null }; S.uploads.set(id, u); renderUploads();
    try {
      let body = file, contentType = file.type, iv = null;
      if (encrypt) {
        const key = await ensureKey(); u.status = "Encrypting…"; renderUploads();
        const r = await encryptBytes(key, await file.arrayBuffer(), uid, id);
        body = new Blob([r.data]); iv = r.iv; contentType = "application/octet-stream";
      }
      const task = uploadBytesResumable(ref(storage, storagePath), body, { contentType });
      u.cancel = () => task.cancel(); u.status = "Uploading…"; renderUploads();
      await new Promise((res, rej) => task.on("state_changed",
        (s) => { u.pct = Math.round((s.bytesTransferred / s.totalBytes) * 100); u.status = `Uploading ${u.pct}%`; renderUploads(); }, rej, res));
      u.cancel = null; u.status = "Saving…"; renderUploads();
      const meta = { fileName: file.name, category, mimeType: file.type, size: file.size, storagePath,
                     encrypted: !!encrypt, uploadedAt: serverTimestamp() };
      if (iv) meta.iv = iv;
      try { await setDoc(dref, meta); }
      catch (e) { await deleteObject(ref(storage, storagePath)).catch(() => {}); throw e; }   // no orphan files
      u.status = "Done ✓"; u.pct = 100;
    } catch (e) { u.status = "Failed: " + friendlyError(e); u.cancel = null; showError(`${file.name}: ${friendlyError(e)}`); }
    renderUploads(); setTimeout(() => { S.uploads.delete(id); renderUploads(); }, 4000);
  }

  /* ---- fetch (+decrypt) ---- */
  async function fetchPlainBlob(d) {
    let bytes = await getBytes(ref(storage, d.storagePath));               // needs CORS: see cors.json
    if (d.encrypted) bytes = await decryptBytes(await ensureKey(), bytes, d.iv, S.user.uid, d.id);
    return new Blob([bytes], { type: d.mimeType });
  }
  async function preview(d) {
    const url = URL.createObjectURL(await fetchPlainBlob(d));
    const body = d.mimeType === "application/pdf"
      ? h("iframe", { src: url, class: "jv-frame", title: d.fileName })
      : h("img", { src: url, class: "jv-img", alt: d.fileName });
    const m = modal(d.fileName, body, h("div", { class: "jv-row" }, h("button", { class: "jv-btn", type: "button", onclick: () => m.close() }, "Close")), { wide: true });
    m.onClose = () => URL.revokeObjectURL(url);
  }
  async function download(d) {
    const url = URL.createObjectURL(await fetchPlainBlob(d));
    const a = h("a", { href: url, download: d.fileName }); document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  async function remove(d) {
    if (!confirm(`Delete "${d.fileName}" permanently? This cannot be undone.`)) return;
    try { await deleteObject(ref(storage, d.storagePath)); }
    catch (e) { if (!String(e?.code).includes("object-not-found")) throw e; }
    await deleteDoc(doc(db, "users", S.user.uid, "travelVault", d.id));
  }

  /* ---- generic modal ---- */
  function modal(title, ...content) {
    let opts = {}; if (content.length && content[content.length - 1]?.wide !== undefined) opts = content.pop();
    const box = h("div", { class: "jv-modal" + (opts.wide ? " wide" : ""), role: "dialog", "aria-modal": "true", "aria-label": title },
      h("h3", {}, title), ...content);
    const back = h("div", { class: "jv-back" }, box);
    const api = { close() { back.remove(); api.onClose?.(); }, remove() { api.close(); } };
    back.addEventListener("click", (e) => e.target === back && api.close());
    document.body.append(back); api.el = back; api.remove = api.close; return api;
  }

  /* ---- auth + realtime data ---- */
  function clearLocalWarning() {
    if (S.warningCleared) return; S.warningCleared = true;
    document.querySelectorAll(warnSel).forEach((el) => el.remove());
  }
  onAuthStateChanged(auth, (user) => {
    S.unsub?.(); S.unsub = null; S.key = null; S.user = user; S.docs = []; showError("");
    uploadBox.hidden = !user; toolbar.hidden = !user; chips.hidden = !user;
    if (!user) { S.loading = false; renderChips(); renderList(); return; }
    S.loading = true; renderChips(); renderList();
    const q = query(collection(db, "users", user.uid, "travelVault"), orderBy("uploadedAt", "desc"));
    S.unsub = onSnapshot(q, { includeMetadataChanges: false }, (snap) => {
      S.docs = snap.docs.map((x) => ({ id: x.id, ...x.data() })); S.loading = false;
      renderChips(); renderList(); clearLocalWarning();                    // Firebase works → drop prototype warning
    }, (e) => { S.loading = false; showError("Could not load your vault: " + friendlyError(e)); renderList(); });
  });
  window.addEventListener("pagehide", () => { S.key = null; });
  renderChips(); renderList();
}

/* ---------- scoped styles (uses your theme variables if present, safe fallbacks otherwise) ---------- */
function injectCss() {
  if (document.getElementById("jv-css")) return;
  const s = document.createElement("style"); s.id = "jv-css";
  s.textContent = `
.jv{--c-bg:var(--card,#111C2C);--c-el:var(--elevated,#172438);--c-bd:var(--border,#263449);--c-tx:var(--text,#F8FAFC);--c-mu:var(--muted,#A7B2C3);--c-ac:var(--gold,#F5B942);--c-er:#EF4444;color:var(--c-tx);font-family:inherit}
.jv *{box-sizing:border-box}.jv [hidden]{display:none!important}
.jv-banner{background:rgba(239,68,68,.12);border:1px solid var(--c-er);color:#fecaca;padding:10px 14px;border-radius:12px;margin-bottom:12px}
.jv-upload,.jv-toolbar{margin-bottom:14px}.jv-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:8px 0}
.jv-input{background:var(--c-el);border:1px solid var(--c-bd);color:var(--c-tx);border-radius:12px;padding:10px 12px;font:inherit;width:100%}
.jv-row .jv-input{width:auto;min-width:160px}.jv-check{color:var(--c-mu);display:flex;gap:6px;align-items:center;cursor:pointer}
.jv-drop{border:2px dashed var(--c-bd);border-radius:16px;padding:22px;text-align:center;cursor:pointer;background:var(--c-bg);display:flex;flex-direction:column;gap:4px;transition:.2s}
.jv-drop span{color:var(--c-mu);font-size:.85rem}.jv-drop:hover,.jv-drop.over,.jv-drop:focus-visible{border-color:var(--c-ac);outline:none}
.jv-up{display:grid;grid-template-columns:1fr 160px auto;gap:10px;align-items:center;margin-top:8px;font-size:.88rem;color:var(--c-mu)}
.jv-up progress{width:100%;accent-color:var(--c-ac)}
.jv-chips{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.jv-chip{background:var(--c-bg);color:var(--c-mu);border:1px solid var(--c-bd);border-radius:999px;padding:7px 14px;cursor:pointer;font:inherit;font-size:.85rem}
.jv-chip.active,.jv-chip:hover{border-color:var(--c-ac);color:var(--c-ac)}
.jv-list{display:grid;gap:10px}.jv-empty{color:var(--c-mu);text-align:center;padding:28px}
.jv-card{display:flex;gap:14px;align-items:center;background:var(--c-bg);border:1px solid var(--c-bd);border-radius:16px;padding:14px;flex-wrap:wrap}
.jv-ico{width:46px;height:46px;border-radius:12px;background:var(--c-el);display:grid;place-items:center;font-weight:700;font-size:.72rem;color:var(--c-ac)}
.jv-meta{flex:1;min-width:180px}.jv-name{font-weight:600;word-break:break-word}.jv-sub{color:var(--c-mu);font-size:.82rem;margin-top:2px}.jv-busy{color:var(--c-ac);font-size:.8rem}
.jv-actions{display:flex;gap:8px;flex-wrap:wrap}
.jv-btn{background:var(--c-el);color:var(--c-tx);border:1px solid var(--c-bd);border-radius:10px;padding:8px 14px;cursor:pointer;font:inherit;font-size:.85rem}
.jv-btn:hover:not(:disabled){border-color:var(--c-ac)}.jv-btn:disabled{opacity:.5;cursor:wait}
.jv-btn.primary{background:var(--c-ac);color:#0b1220;border-color:var(--c-ac);font-weight:600}.jv-btn.danger:hover:not(:disabled){border-color:var(--c-er);color:#fca5a5}
.jv-back{position:fixed;inset:0;background:rgba(3,7,13,.7);display:grid;place-items:center;z-index:9999;padding:16px}
.jv-modal{background:var(--c-bg);color:var(--c-tx);border:1px solid var(--c-bd);border-radius:18px;padding:20px;width:min(440px,100%);max-height:92vh;overflow:auto;display:grid;gap:10px}
.jv-modal.wide{width:min(900px,100%)}.jv-modal h3{margin:0;word-break:break-word}.jv-note{color:var(--c-mu);font-size:.88rem;margin:0}.jv-err{color:#fca5a5;font-size:.85rem;min-height:1em}
.jv-frame{width:100%;height:70vh;border:0;border-radius:12px;background:#fff}.jv-img{max-width:100%;max-height:70vh;margin:auto;border-radius:12px}
@media(max-width:600px){.jv-up{grid-template-columns:1fr}}`;
  document.head.append(s);
}

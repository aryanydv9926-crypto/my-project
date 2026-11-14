# JourneyJar: Smart Travel Planner

Live site: https://aryanydv9926-crypto.github.io/my-project/

Plain HTML, CSS and JavaScript (no build step). Firebase Authentication and Cloud Firestore use the modular v10 SDK.

## Files
| File | Purpose |
|---|---|
| `index.html` | Page markup, loads the other files |
| `style.css` | All styling (Midnight Gold theme, responsive) |
| `script.js` | The app: trips, budgets, expenses, Discover, vault, packing, countdown |
| `firebase-config.js` | Your Firebase web config + **`tmdbProxy` address** (the one place to configure the backend) |
| `firebase-init.js` | Initialises Firebase once; Auth + Firestore + Discovery functions |
| `firestore.rules` | Firestore security rules (trips, Discovery, **Travel Vault records and notes**) |
| `storage.rules` | Firebase Storage rules: each user can only access `users/{their uid}/vault/...` |
| `cors.json` | Optional CORS settings so the Download button can save files directly |
| `functions/` | Firebase Cloud Function: secure TMDB proxy (`index.js`, `proxy-core.js`, `package.json`) |
| `firebase.json`, `.firebaserc` | Firebase CLI settings (project `journeyjar-b7f0b`) |
| `backend/` | Optional free alternative to Cloud Functions (Cloudflare Worker) |

## Firebase setup (once)
1. Authentication > Sign-in method: enable **Email/Password** and **Google**.
2. Authentication > Settings > Authorized domains: add `aryanydv9926-crypto.github.io` (and `localhost` for local testing).
3. Firestore Database: create it, open the **Rules** tab, paste `firestore.rules`, click **Publish**.

## Run locally
Use VS Code **Live Server** (Go Live) or `python -m http.server 8000`, then open http://localhost:8000.
Do not double-click `index.html`: ES modules and Firebase login do not work from `file://`.

## Travel Vault (Firebase Storage + Firestore)
- Files: Firebase Storage `users/{uid}/vault/{docId}/{fileName}`. Records: Firestore `users/{uid}/vault/{docId}`. Notes: `users/{uid}/vaultNotes/{noteId}`. Everything is per user; rules block every other account.
- The status chip says **Cloud Synced** only after Firestore returns a server-confirmed snapshot. It shows "Connecting", "Offline" or "Firebase error: ..." otherwise.
- Old local files (IndexedDB) are never deleted. If any are found, a banner offers **Upload them to the cloud**. Each file gets a fixed id (`local-<id>`), so running the migration twice never duplicates anything.
- Delete removes the Storage file first, then its record.

### One-time Firebase setup for the vault
1. Firebase console > **Storage** > Get started. Newer projects may require the **Blaze** (pay-as-you-go) plan for Storage; usage stays inside the free quota for personal use. Set a budget alert.
2. Storage > Rules: paste `storage.rules` and Publish. Firestore > Rules: paste `firestore.rules` and Publish. (Or `firebase deploy --only firestore:rules,storage`.)
3. Optional, for direct downloads: install the Google Cloud SDK and run `gsutil cors set cors.json gs://journeyjar-b7f0b.firebasestorage.app` (use the bucket name shown in Storage). Without it, Download opens the file in a new tab instead.

### Test the vault (needs your real Firebase)
1. Sign in, open **Travel Vault**: the chip changes from "Connecting" to **Cloud Synced**.
2. Upload a PDF and a JPG: a progress bar runs, the card appears. Check Firebase console > Storage > `users/<uid>/vault/...` and Firestore > `users/<uid>/vault`.
3. Reload the page, and open the site on a phone with the same login: the files are there. Rename a file on one device: it changes on the other without a reload.
4. Preview and Download a file. Delete it: it disappears from both devices, and the Storage file is gone.
5. Add a travel note: it appears on both devices.
6. Switch your device offline: the chip shows Offline; uploads show an error message.
7. Wrong rules or Storage not set up show up in the red chip or an upload error, for example "Storage denied access. Publish storage.rules".

## Discovery data in Firestore
- `users/{uid}/discoveries/{destination}`: saved destinations (name, description, summary, cover URL, source, coordinates, savedAt)
- `users/{uid}/searches/{search}`: recent searches
- `users/{uid}`: trips, budgets, expenses, itineraries (unchanged behaviour)
Functions in `firebase-init.js`: `saveDiscovery`, `getDiscoveries`, `removeDiscovery`, `recordSearch`, `getSearches`.

## Test the Firebase connection
1. Open the site, press F12 > Console. There must be no red errors from `firebase-init.js`.
2. Sign up with an email, or click **Continue with Google**. You should land on the Home page.
3. Discover > search "Manali" > **Save Destination**. In Firebase console > Firestore > `users` > your uid > `discoveries` > `manali` should appear.
4. Reload the page: the saved destination and the "Recent" chip are still there.
5. Log in from a second browser or phone: the same saved destinations load.
6. If something fails: `permission-denied` = rules not published; `unauthorized-domain` = add the domain in step 2; `operation-not-allowed` = enable the provider.

## Discovery: where the data comes from
| Tab | Source | Needs a key? |
|---|---|---|
| Overview, Stories, Culture | Wikipedia (summary, sections, related articles) | No |
| Images | Wikimedia Commons (photos with creator, licence, source link) | No |
| Places | Wikipedia places within 10 km (real photos, Google Maps links) | No |
| Movies + Documentaries | TMDB, **through your backend proxy** | Yes, kept only in the backend |

Nothing is hard-coded: if a source cannot be reached you see an error or an empty state, never sample data.
Why Movies used to show "Demo mode": `tmdbProxy` in `firebase-config.js` was empty, so the app fell back to a built-in sample list. That list is removed; with no proxy you now get a "Movie service not connected" notice.

## Deploy the TMDB proxy (Firebase Cloud Functions)
1. Get a free TMDB account: https://www.themoviedb.org > Settings > API > copy the **API Key (v3 auth)**.
2. Firebase console > upgrade the project to the **Blaze** (pay as you go) plan. Cloud Functions and secrets need it; this proxy stays inside the free monthly quota for normal use. Set a budget alert.
3. Install Node.js 20, then in a terminal: `npm install -g firebase-tools` and `firebase login`.
4. In the project folder: `cd functions && npm install && cd ..`
5. `firebase functions:secrets:set TMDB_API_KEY` and paste your key when asked (it is stored in Google Secret Manager, not in any file).
6. `firebase deploy --only functions`
7. The terminal prints `Function URL (api(us-central1)): https://...`. 
8. Open `firebase-config.js` and paste it, plus `/tmdb`, into `tmdbProxy`:
   `tmdbProxy: "https://us-central1-journeyjar-b7f0b.cloudfunctions.net/api/tmdb"` (use the exact URL printed in step 7).
9. Upload `firebase-config.js` to GitHub again.
10. Check the proxy: `curl -H "Origin: https://aryanydv9926-crypto.github.io" "<function-url>/tmdb/search/keyword?query=manali"` must return JSON. (Opening the URL in the address bar returns 403 on purpose: only your website's origin is allowed.)
Free alternative: the Cloudflare Worker in `backend/` (same address format `<worker-url>/tmdb`).
If your site address changes, edit `ALLOWED_ORIGINS` in `functions/proxy-core.js` and redeploy.

## Test every Discovery tab (live site, signed in or not)
1. Discover > search **Varanasi**. Overview shows the summary and an "Open in Google Maps" link.
2. **Images**: photos load; click one: the viewer shows caption, photographer, licence and a Wikimedia Commons link. Arrows and Esc work.
3. **Movies**: real posters, years, ratings, descriptions; a Documentaries section below; click **Details** for runtime, tagline and a trailer link. If you see "Movie service not connected", `tmdbProxy` is empty. "Could not load movies" means the URL or deployment is wrong (F12 > Network shows the failing request).
4. **Stories**: history text and related Wikipedia articles with "Read on Wikipedia" links.
5. **Places**: photos, distance, Popular / Lesser-known tag, Historic tag, **Google Maps** and **Add to Itinerary** buttons.
6. **Culture**: culture/cuisine text plus festival, food, art, architecture and tradition articles with source links.
7. Repeat with **Jaipur**, **Manali**, **Goa**: every tab must change with the destination.

## Upload to your existing GitHub repository (nothing is deleted)
1. Back up first: on the repo page click **Code > Download ZIP**.
2. Click **Add file > Upload files**. Drag in `index.html`, `style.css`, `script.js`, `firebase-config.js`, `firebase-init.js`, `firestore.rules`, `README.md`, and the `backend` folder.
   Files with the same name are replaced; other files in the repo stay. Old versions remain in the history.
3. Commit directly to `main`.
4. Settings > Pages: Deploy from branch `main`, folder `/ (root)`. Wait 1-2 minutes, then hard refresh (Ctrl+Shift+R).

## Known limitations
- "Lesser-known" places are inferred from Wikipedia page views (last 30 days), not from a tourism database; there is no free API for true hidden gems.
- TMDB links a film to a place by keyword or text, so a listing does not prove it was filmed there.
- Travel Vault files are encrypted at rest by Google but not end-to-end encrypted. Preview uses a Firebase download link (a long secret URL) that is created only when you click Preview.
- Offline: the vault list and notes are shown from the cache, but uploads, previews and downloads need a connection.
- Two devices editing at once: the last save wins.

# JourneyJar: Smart Travel Planner

Live site: https://aryanydv9926-crypto.github.io/my-project/

Plain HTML, CSS and JavaScript (no build step). Firebase Authentication and Cloud Firestore use the modular v10 SDK.

## Files
| File | Purpose |
|---|---|
| `index.html` | Page markup, loads the other files |
| `style.css` | All styling (Midnight Gold theme, responsive) |
| `script.js` | The app: trips, budgets, expenses, Discover, vault, packing, countdown |
| `firebase-config.js` | Your Firebase web config + optional proxy URLs |
| `firebase-init.js` | Initialises Firebase once; Auth + Firestore + Discovery functions (`window.JJ`) |
| `firestore.rules` | Security rules to publish in Firebase |
| `backend/api-proxy-worker.js`, `backend/wrangler.toml` | Optional secure proxy for TMDB and YouTube |

## Firebase setup (once)
1. Authentication > Sign-in method: enable **Email/Password** and **Google**.
2. Authentication > Settings > Authorized domains: add `aryanydv9926-crypto.github.io` (and `localhost` for local testing).
3. Firestore Database: create it, open the **Rules** tab, paste `firestore.rules`, click **Publish**.

## Run locally
Use VS Code **Live Server** (Go Live) or `python -m http.server 8000`, then open http://localhost:8000.
Do not double-click `index.html`: ES modules and Firebase login do not work from `file://`.

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

## Movies (TMDB) and documentaries (YouTube): secure proxy
API keys must never be in the website. Deploy the Worker once:
1. Free account at cloudflare.com; install Node.js.
2. In the `backend` folder: `npx wrangler login`
3. `npx wrangler secret put TMDB_API_KEY` (paste your TMDB v3 key), `npx wrangler secret put YOUTUBE_API_KEY`
4. `npx wrangler deploy` (prints a URL like `https://journeyjar-proxy.NAME.workers.dev`)
5. Put it in `firebase-config.js`: `tmdbProxy: "<url>/tmdb"`, `youtubeProxy: "<url>/youtube"`
6. If your site address differs from the one in `ALLOWED_ORIGINS` in the Worker, edit it and redeploy.
Until then, Movies shows a clearly labelled demo and Stories shows YouTube search links only.

## Upload to your existing GitHub repository (nothing is deleted)
1. Back up first: on the repo page click **Code > Download ZIP**.
2. Click **Add file > Upload files**. Drag in `index.html`, `style.css`, `script.js`, `firebase-config.js`, `firebase-init.js`, `firestore.rules`, `README.md`, and the `backend` folder.
   Files with the same name are replaced; other files in the repo stay. Old versions remain in the history.
3. Commit directly to `main`.
4. Settings > Pages: Deploy from branch `main`, folder `/ (root)`. Wait 1-2 minutes, then hard refresh (Ctrl+Shift+R).

## Known limitations
- Wikipedia is the live source for Discover. If it cannot be reached, the app shows a built-in offline guide for 8 destinations (labelled).
- Travel Vault files stay in the browser (IndexedDB), not in the cloud, and are not encrypted.
- Two devices editing at once: the last save wins.

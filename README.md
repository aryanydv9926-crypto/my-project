# JourneyJar – Final Organised Project

Smart Travel Planner with Dual Discovery (Travel + Movies).

**All features working. Nothing overshadowed.**

## Features

### Discover (3 equal tabs)
- **Travel** – OpenTripMap (attractions, museums, beaches, mountains, historic places, favourites)
- **Movies** – TMDB (trending, popular, top-rated, upcoming, search, detail modal, favourites)
- **Destination** – Classic Wikipedia deep-dive (stories, images, places)

### Core app
- Home & Dashboard
- My Trips + Plan New Journey wizard
- Budget Planner & Smart Budget
- Expense Tracker
- Trip Splitter
- Itinerary
- Trip Countdown
- Smart Packing
- Travel Vault
- Trip Sync (collaborative rooms)
- Analytics / Comparison
- Settings + Authentication (Email/Password + Google)

## Project structure

```
├── index.html
├── style.css
├── script.js                 # Core app
├── discovery-ui.js           # Dual Discovery UI
├── services/
│   ├── tmdb.js
│   └── opentripmap.js
├── firebase-config.js        # Config + proxy URLs / keys
├── firebase-init.js
├── firestore.rules
├── trip-sync.js
├── travel-vault.js
├── functions/                # Cloud Functions proxy
│   ├── index.js
│   ├── proxy-core.js
│   └── package.json
├── firebase.json
├── .firebaserc
├── start.bat
└── README.md
```

## Quick start (local)

```bash
python -m http.server 8000
# open http://localhost:8000
```

Or double-click `start.bat` on Windows.

## Firebase setup

1. Create / use project `journeyjar-b7f0b` (or change IDs in `firebase-config.js` and `.firebaserc`).
2. Enable Authentication → Email/Password + Google.
3. Add authorized domains (your GitHub Pages domain + localhost).
4. Create Firestore database.
5. Publish `firestore.rules`.
6. Deploy proxy:

```bash
cd functions
npm install
firebase functions:secrets:set TMDB_API_KEY
firebase functions:secrets:set OTM_API_KEY
cd ..
firebase deploy --only functions
```

7. Copy the Function URL into `firebase-config.js`:

```js
tmdbProxy: "https://us-central1-YOUR_PROJECT.cloudfunctions.net/api/tmdb",
otmProxy:  "https://us-central1-YOUR_PROJECT.cloudfunctions.net/api/otm",
```

Leave `tmdbKey` / `otmKey` empty in production.

## GitHub Pages deploy

1. Create a new repository.
2. Upload all files from this folder.
3. Settings → Pages → Deploy from branch `main` (root).
4. Add the Pages domain to Firebase Auth → Authorized domains.
5. After proxy is live, update `firebase-config.js` and push again.

## API keys (free)

- TMDB: https://www.themoviedb.org → Settings → API
- OpenTripMap: https://opentripmap.org or https://dev.opentripmap.org


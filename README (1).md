# JourneyJar: Every Journey, Within Your Budget

Single-page trip budget planner (HTML, CSS, JavaScript) with Firebase login and Firestore sync.

## Run locally
1. Open the folder in VS Code and install the **Live Server** extension.
2. Right-click `index.html` and choose **Open with Live Server** (or run `python -m http.server 8000` and open http://localhost:8000).
3. Do not open `index.html` by double-clicking it: Firebase login does not work from file://.

## Firebase setup (one time)
1. Authentication > Sign-in method: enable **Email/Password**.
2. Firestore Database: create a database, then paste `firestore.rules` into the Rules tab and Publish.
3. Authentication > Settings > Authorized domains: add `localhost` and `<your-username>.github.io`.

## Publish on GitHub Pages (when you are ready)
Push `index.html`, `firestore.rules` and `README.md` to a repository, then Settings > Pages > Deploy from branch `main`, folder `/ (root)`.

## Notes
- The Firebase web config in `index.html` is public by design. Security comes from the Firestore rules above.
- The Travel Vault stores files only in the browser (IndexedDB), not in the cloud, and is not encrypted.
- Movies and documentaries in Discover need your own proxy URLs in `DISCOVER_CONFIG`.

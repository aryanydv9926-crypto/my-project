// ============================================================
//  JourneyJar configuration (loaded as an ES module by firebase-init.js)
//  The Firebase web config is NOT a secret: your Firestore rules protect the data.
// ============================================================
export const firebaseConfig = {
  apiKey: "AIzaSyBHM3s4am4wPY8Bayja6YUEztpSFWghMiE",
  authDomain: "journeyjar-b7f0b.firebaseapp.com",
  projectId: "journeyjar-b7f0b",
  storageBucket: "journeyjar-b7f0b.firebasestorage.app",
  messagingSenderId: "300862859267",
  appId: "1:300862859267:web:f8ad2691ad00b5cecfc636",
  measurementId: "G-ZMZL8F03HC"
};

// ============================================================
//  TMDB (movies & documentaries in Discover)
//  Option A — Backend proxy (recommended): set tmdbProxy to your Cloud Function /
//             Cloudflare Worker URL ending in /tmdb (key stays on the server).
//  Option B — Direct key (works on GitHub Pages): set tmdbKey below.
//             WARNING: anyone can view this key in the browser / GitHub.
//             Prefer a proxy for production.
// ============================================================
export const DISCOVER_CONFIG = {
  tmdbProxy: "",
  tmdbKey: "74d8dd6381340fb36e054ddc8a3593d6",
  tmdbImg: "https://image.tmdb.org/t/p/w342",
  offlineGuide: false
};

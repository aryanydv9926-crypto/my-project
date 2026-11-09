// ============================================================
//  JourneyJar configuration (loaded as an ES module by firebase-init.js)
//  The Firebase web config is NOT a secret: your Firestore rules protect the data.
//  NEVER put a TMDB or YouTube API key in this file (see README: backend proxy).
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
//  >>> PASTE YOUR DEPLOYED BACKEND PROXY ADDRESS HERE <<<
//  After `firebase deploy --only functions` the terminal prints the function URL, for example
//    https://us-central1-journeyjar-b7f0b.cloudfunctions.net/api
//  Put that address plus "/tmdb" between the quotes below (no trailing slash):
//    tmdbProxy: "https://us-central1-journeyjar-b7f0b.cloudfunctions.net/api/tmdb"
//  The TMDB API key is NEVER put here. It lives only in the Cloud Functions secret TMDB_API_KEY.
// ============================================================
export const DISCOVER_CONFIG = {
  tmdbProxy: "",
  tmdbImg: "https://image.tmdb.org/t/p/w342",
  offlineGuide: false   // false = never show built-in sample content; only live data is used
};

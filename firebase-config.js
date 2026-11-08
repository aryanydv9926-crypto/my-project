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

// Optional: URLs of YOUR deployed proxy (see backend/api-proxy-worker.js), no trailing slash.
// Leave empty until you deploy it. Example:
//   tmdbProxy:    "https://journeyjar-proxy.YOUR-NAME.workers.dev/tmdb"
//   youtubeProxy: "https://journeyjar-proxy.YOUR-NAME.workers.dev/youtube"
export const DISCOVER_CONFIG = {
  tmdbProxy: "",
  youtubeProxy: "",
  tmdbImg: "https://image.tmdb.org/t/p/w342"
};

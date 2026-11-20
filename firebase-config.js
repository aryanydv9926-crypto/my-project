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
//  Discovery services (Travel + Movies)
//  Prefer the secure backend proxy. Keys should NEVER be committed
//  for production. Use Firebase Secrets or Cloudflare secrets.
// ============================================================
export const DISCOVER_CONFIG = {
  // After deploying the Cloud Function, set these to:
  //   "https://us-central1-journeyjar-b7f0b.cloudfunctions.net/api/tmdb"
  //   "https://us-central1-journeyjar-b7f0b.cloudfunctions.net/api/otm"
  tmdbProxy: "",
  otmProxy: "",

  // Direct keys – ONLY for local testing. Remove or leave empty in production.
  tmdbKey: "74d8dd6381340fb36e054ddc8a3593d6",
  otmKey: "",                         // Get free key at https://opentripmap.org / dev.opentripmap.org

  tmdbImg: "https://image.tmdb.org/t/p/w342",
  offlineGuide: false
};

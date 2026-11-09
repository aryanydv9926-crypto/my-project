// Firebase Cloud Function (2nd gen): secure TMDB proxy.
// The API key is stored as a secret (TMDB_API_KEY) and is never sent to the browser.
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { handle } = require("./proxy-core");

const TMDB_API_KEY = defineSecret("TMDB_API_KEY");

exports.api = onRequest(
  { region: "us-central1", secrets: [TMDB_API_KEY], maxInstances: 5, memory: "256MiB", timeoutSeconds: 20 },
  async (req, res) => {
    const out = await handle(
      { method: req.method, path: req.path, query: req.query, origin: req.get("origin") || "" },
      { TMDB_API_KEY: TMDB_API_KEY.value() }
    );
    for (const [k, v] of Object.entries(out.headers)) res.set(k, v);
    res.status(out.status).send(out.body);
  }
);

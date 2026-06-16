import app from "./app.js";
import connectDB from "./config/db.js";

// Standalone server entry (local dev, Render, Railway, Docker, any long-running host).
// On Vercel the app is served by api/index.js instead, so this file is not used there.
const PORT = process.env.PORT || 5000;

connectDB().catch((err) => {
  console.error(`MongoDB connection error: ${err.message}`);
});

app.listen(PORT, () =>
  console.log(`LUXE API running on http://localhost:${PORT}`)
);

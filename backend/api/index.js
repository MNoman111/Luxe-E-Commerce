// Vercel serverless entry point — exports the Express app as a single function.
// vercel.json routes every request here; Express then handles routing internally.
import app from "../app.js";

export default app;

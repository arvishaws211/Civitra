import "dotenv/config";
import { createApp } from "./src/create-app.js";

const PORT = Number(process.env.PORT) || 3000;

const app = createApp();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n  Civitra is running at http://0.0.0.0:${PORT}\n`);
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
    console.log("  Warning: No GEMINI_API_KEY set. Copy .env.example to .env and add your key.\n");
  }
});

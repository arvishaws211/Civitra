import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import log from "../lib/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  const serviceAccountPath = join(__dirname, "../../firebase-service-account.json");
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${serviceAccount.project_id}.firebasestorage.app`,
  });

  log.info("firebase_init", { method: "service_account" });
} catch {
  log.warn("firebase_fallback", { reason: "service account not found, trying ADC" });

  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || "civitra";
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: `${projectId}.firebasestorage.app`,
    });
    log.info("firebase_init", { method: "adc" });
  } catch (innerError) {
    log.error("firebase_init_fatal", { error: innerError.message });
    // Initialize a dummy app so it doesn't crash the server, but DB calls will fail
    admin.initializeApp({ projectId: "demo-project" });
  }
}

export const db = getFirestore(undefined, "civitra");
export const bucket = admin.storage().bucket();
export const auth = admin.auth(); // Optional: If you want to migrate auth later

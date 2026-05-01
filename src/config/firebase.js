import admin from "firebase-admin";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  const serviceAccountPath = join(__dirname, "../../firebase-service-account.json");
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${serviceAccount.project_id}.firebasestorage.app`
  });

  console.log("✅ Firebase Admin initialized with service account file");
} catch (error) {
  console.log("⚠️ Service account file not found, falling back to Application Default Credentials.");
  
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    ...(projectId && { storageBucket: `${projectId}.firebasestorage.app` })
  });
  
  console.log("✅ Firebase Admin initialized using Application Default Credentials");
}

export const db = admin.firestore();
export const bucket = admin.storage().bucket();
export const auth = admin.auth(); // Optional: If you want to migrate auth later

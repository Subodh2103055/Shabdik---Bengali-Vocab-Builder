import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// Read Firebase keys strictly from Vite environment variables (VITE_ prefixed)
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "shabdik",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB03ywJiQxUJV7HDmz7rFAgYBJE4t3wucw",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:78539740626:web:54e5e98e596d1b2e17640b",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "shabdik.firebaseapp.com",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "shabdik.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "78539740626",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "ai-studio-1e1183a4-adb8-42a1-9ee0-3106b9c25621",
};

let db: any = null;
let initialized = false;

try {
  // Enforce existence of key and projectId
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("YOUR_") || !firebaseConfig.projectId) {
    throw new Error("Missing valid VITE_FIREBASE_API_KEY or VITE_FIREBASE_PROJECT_ID environment variables.");
  }
  
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");
  initialized = true;
  console.log("[Firebase Client] Initialized successfully with project ID:", firebaseConfig.projectId);
} catch (error: any) {
  console.error("[Firebase Client] Initialization Failed! Under-configured environment configuration is preventing dynamic sync operations.", error);
}

export { db, initialized };

export interface SyncData {
  stats: any;
  savedWords: any[];
  masteredWords?: string[];
}

/**
 * Direct client-side write to Firestore cloud DB
 * Fallback when backend REST API is not available (e.g. static SPA on Vercel)
 */
export async function clientSaveSync(syncId: string, payload: SyncData): Promise<boolean> {
  if (!initialized || !db) {
    console.warn("[Firebase Client] Skipping client-side save: Firebase not initialized.");
    return false;
  }
  try {
    const docRef = doc(db, "syncSessions", syncId);
    await setDoc(docRef, {
      data: payload,
      updatedAt: new Date().toISOString()
    });
    console.log(`[Firebase Client] Direct cloud write succeeded for session: ${syncId}`);
    return true;
  } catch (err: any) {
    console.error(`[Firebase Client] Error during cloud write for session: ${syncId}`, err);
    return false;
  }
}

/**
 * Direct client-side read from Firestore cloud DB
 * Fallback when backend REST API is not available (e.g. static SPA on Vercel)
 */
export async function clientLoadSync(syncId: string): Promise<SyncData | null> {
  if (!initialized || !db) {
    console.warn("[Firebase Client] Skipping client-side load: Firebase not initialized.");
    return null;
  }
  try {
    const docRef = doc(db, "syncSessions", syncId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const docData = docSnap.data();
      if (docData && docData.data) {
        console.log(`[Firebase Client] Direct cloud read succeeded for session: ${syncId}`);
        return docData.data;
      }
    }
  } catch (err: any) {
    console.error(`[Firebase Client] Error during cloud read for session: ${syncId}`, err);
  }
  return null;
}

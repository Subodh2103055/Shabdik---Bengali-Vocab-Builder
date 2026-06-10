import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth";

// Read Firebase keys strictly from Vite environment variables (VITE_ prefixed)
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "shabdik",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB03ywJiQxUJV7HDmz7rFAgYBJE4t3wucw",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:78539740626:web:54e5e98e596d1b2e17640b",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "shabdik.firebaseapp.com",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "shabdik.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "78539740626",
};

let db: any = null;
let auth: any = null;
const googleProvider = new GoogleAuthProvider();
let initialized = false;

try {
  // Enforce existence of key and projectId
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("YOUR_") || !firebaseConfig.projectId) {
    throw new Error("Missing valid VITE_FIREBASE_API_KEY or VITE_FIREBASE_PROJECT_ID environment variables.");
  }
  
  const app = initializeApp(firebaseConfig);
  const dbId = import.meta.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-26f296bf-9934-4857-b249-bbfa849daa15";
  db = getFirestore(app, dbId);
  auth = getAuth(app);
  initialized = true;
  console.log("[Firebase Client] Initialized successfully with project ID:", firebaseConfig.projectId, "and custom database:", dbId);
} catch (error: any) {
  console.error("[Firebase Client] Initialization Failed! Under-configured environment configuration is preventing dynamic sync operations.", error);
}

export { db, auth, googleProvider, signInWithPopup, signOut, initialized };

export interface SyncData {
  stats: any;
  savedWords: any[];
  masteredWords?: string[];
}

/**
 * Direct client-side write user data to /users/{uid}
 */
export async function clientSaveUserDeck(uid: string, payload: SyncData): Promise<boolean> {
  if (!initialized || !db) {
    console.warn("[Firebase Client] Skipping client-side save: Firebase not initialized.");
    return false;
  }
  try {
    const docRef = doc(db, "users", uid);
    await setDoc(docRef, {
      data: payload,
      updatedAt: new Date().toISOString()
    });
    console.log(`[Firebase Client] User cloud write succeeded for uid: ${uid}`);
    return true;
  } catch (err: any) {
    console.error(`[Firebase Client] Error during cloud write for uid: ${uid}`, err);
    throw err; // ensure it is thrown back to caller to turn off active sync loading states
  }
}

/**
 * Direct client-side read user data from /users/{uid}
 */
export async function clientLoadUserDeck(uid: string): Promise<SyncData | null> {
  if (!initialized || !db) {
    console.warn("[Firebase Client] Skipping client-side load: Firebase not initialized.");
    return null;
  }
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const docData = docSnap.data();
      if (docData && docData.data) {
        console.log(`[Firebase Client] User cloud read succeeded for uid: ${uid}`);
        return docData.data;
      }
    }
  } catch (err: any) {
    console.error(`[Firebase Client] Error during cloud read for uid: ${uid}`, err);
    throw err; // ensure it is thrown back to caller to turn off active sync loading states
  }
  return null;
}

/**
 * Direct client-side write to Firestore cloud DB (Legacy fallback)
 */
export async function clientSaveSync(syncId: string, payload: SyncData): Promise<boolean> {
  if (!initialized || !db) return false;
  try {
    const docRef = doc(db, "syncSessions", syncId);
    await setDoc(docRef, {
      data: payload,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Direct client-side read from Firestore cloud DB (Legacy fallback)
 */
export async function clientLoadSync(syncId: string): Promise<SyncData | null> {
  if (!initialized || !db) return null;
  try {
    const docRef = doc(db, "syncSessions", syncId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const docData = docSnap.data();
      if (docData && docData.data) {
        return docData.data;
      }
    }
  } catch {}
  return null;
}

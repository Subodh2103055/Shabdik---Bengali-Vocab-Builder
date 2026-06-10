import React, { useState } from 'react';
import { Cloud, CloudUpload, RefreshCw, Info, LogOut, ShieldCheck, Mail, LogIn, Lock } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signOut, initialized as firebaseInitialized } from '../lib/firebase';

interface SyncViewProps {
  user: any;
  onCloudSave: () => Promise<void>;
  isSyncing: boolean;
}

export default function SyncView({
  user,
  onCloudSave,
  isSyncing
}: SyncViewProps) {
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSignIn = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    if (!firebaseInitialized || !auth) {
      setErrorMessage("Firebase is not initialized. Please verify your VITE_FIREBASE_ environment parameters in Settings.");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
      setSuccessMessage("Successfully authenticated with Google!");
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("is not enabled")) {
        setErrorMessage("Google Auth is under-configured in the Firebase console. Please ensure the Google provider is fully enabled.");
      } else {
        setErrorMessage(err.message || "Failed to authenticate with Google. Please retry.");
      }
    }
  };

  const handleSignOut = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    if (!auth) return;
    try {
      await signOut(auth);
      setSuccessMessage("Logged out successfully. All local deck states have been cleared.");
    } catch (err: any) {
      setErrorMessage(err.message || "Logout failed.");
    }
  };

  const handleSaveTrigger = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await onCloudSave();
      setSuccessMessage("Your current deck has been successfully backed up to your Google account!");
    } catch {
      setErrorMessage("Backup upload failed. Verify networking connection or Firestore rules.");
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-6 animate-fade-in" id="sync-view">
      
      {/* Visual Header */}
      <div className="flex flex-col gap-1.5 items-center justify-center p-4 bg-neutral-950/40 rounded-2xl border border-neutral-800 text-center">
        <Cloud className="w-10 h-10 text-amber-400 animate-pulse" />
        <div>
          <h3 className="text-sm font-extrabold text-neutral-100 uppercase tracking-widest">
            Google Cloud Sync
          </h3>
          <p className="text-[10px] text-neutral-400 mt-1 max-w-[280px]">
            Log in to automatically synchronize your vocabulary cards, streak counts, and memorized deck across all desktop and mobile devices.
          </p>
        </div>
      </div>

      {!user ? (
        /* Sign In Interface */
        <div className="bg-neutral-950/60 p-5 border border-neutral-850 rounded-2xl flex flex-col gap-4 items-center justify-center text-center">
          <div className="bg-neutral-900 p-3 rounded-full border border-neutral-800">
            <Lock className="w-6 h-6 text-neutral-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
              Secure Auth Required
            </h4>
            <p className="text-[10px] text-neutral-450 mt-1 max-w-[240px]">
              Sync requires a secure, password-less Google authentication session.
            </p>
          </div>

          <button
            onClick={handleSignIn}
            className="w-full bg-white hover:bg-neutral-100 text-neutral-900 text-xs font-extrabold py-3 px-4 rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-2 border border-neutral-200 shadow"
          >
            {/* Custom high-contrast Google G logo */}
            <svg className="w-4 h-4 mr-1 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>
        </div>
      ) : (
        /* Authenticated Session Dashboard */
        <div className="bg-neutral-950/60 p-4 border border-neutral-850 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center gap-3 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "User Avatar"}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full border border-neutral-700"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-amber-400 text-neutral-950 font-bold flex items-center justify-center text-xs border border-neutral-700">
                {user.email?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-emerald-400 uppercase font-black tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Secure Sync Active
                </span>
              </div>
              <p className="text-[11.5px] font-mono text-neutral-100 font-bold truncate">
                {user.email}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleSaveTrigger}
              disabled={isSyncing}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 text-xs font-extrabold py-2.5 rounded-xl transition-all uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-sm"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Syncing with Cloud...
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4" strokeWidth={2.5} />
                  Backup current state now
                </>
              )}
            </button>

            <button
              onClick={handleSignOut}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-rose-400 text-xs font-semibold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-neutral-800/45"
            >
              <LogOut className="w-4 h-4" /> Sign Out from Account
            </button>
          </div>
        </div>
      )}

      {/* Feedback Messages */}
      {successMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10.5px] leading-relaxed text-center font-medium">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-[10.5px] leading-relaxed text-center font-medium">
          {errorMessage}
        </div>
      )}

      {/* Helpful Info Panel */}
      <div className="p-3.5 bg-neutral-900/40 border border-neutral-850/60 rounded-xl flex gap-2.5 items-start">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-[10px] text-neutral-400 leading-relaxed">
          <strong className="text-neutral-300 font-semibold">⚡ Automatic Background Saving: </strong>
          Once authenticated with your Google account, any additions to your vocabulary bank, memorized flags, or streak increases will be saved automatically in the background under your secure profile database.
        </div>
      </div>

    </div>
  );
}

import React, { useState } from 'react';
import { Cloud, CloudUpload, CloudDownload, RefreshCw, Smartphone, Key, Info, Check } from 'lucide-react';
import { SyncData } from '../types';

interface SyncViewProps {
  syncId: string;
  setSyncId: (id: string) => void;
  onCloudSave: () => Promise<void>;
  onCloudLoad: (targetSyncId: string) => Promise<boolean>;
  isSyncing: boolean;
  onNewSyncIdGenerated?: (id: string) => void;
}

export default function SyncView({
  syncId,
  setSyncId,
  onCloudSave,
  onCloudLoad,
  isSyncing,
  onNewSyncIdGenerated
}: SyncViewProps) {
  const [inputSyncId, setInputSyncId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleManualLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    
    if (!inputSyncId.trim()) {
      setErrorMessage("Please enter a valid 6-character sync code first.");
      return;
    }

    const cleanCode = inputSyncId.trim().toUpperCase();
    const success = await onCloudLoad(cleanCode);
    if (success) {
      setSuccessMessage(`Success! Merged and downloaded cloud deck. Assigned Sync ID: ${cleanCode}`);
      setSyncId(cleanCode);
    } else {
      setErrorMessage("No cloud deck found for this code. Verify typing or generate a new session!");
    }
  };

  const handleSaveTrigger = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await onCloudSave();
      setSuccessMessage("Vocabulary bank and stats uploaded to cloud session successfully!");
    } catch {
      setErrorMessage("Cloud upload failed. Please verify connection and retry.");
    }
  };

  const handleGenerateNewCode = () => {
    setErrorMessage("");
    setSuccessMessage("");
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No confusing characters like 0, O, 1, I
    let code = "VOC-";
    for (let i = 0; i < 4; i++) {
      code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    
    if (onNewSyncIdGenerated) {
      onNewSyncIdGenerated(code);
    } else {
      setSyncId(code);
    }
    
    setInputSyncId(code);
    setSuccessMessage(`New code session generated: ${code}. Connect other tabs to this session!`);
  };

  return (
    <div className="flex flex-col gap-4 pb-6 animate-fade-in" id="sync-view">
      
      {/* Visual Header */}
      <div className="flex flex-col gap-1.5 items-center justify-center p-4 bg-neutral-950/40 rounded-2xl border border-neutral-800 text-center">
        <Cloud className="w-10 h-10 text-amber-400 animate-pulse" />
        <div>
          <h3 className="text-sm font-extrabold text-neutral-100 uppercase tracking-widest">
            Cross-Device Sync
          </h3>
          <p className="text-[10px] text-neutral-400 mt-1 max-w-[280px]">
            Keep your English vocabulary cards, memorization streaks, and mastered collections synchronized across your phones and computers seamlessly!
          </p>
        </div>
      </div>

      {/* Assigned Sync Code Showcase */}
      <div className="bg-neutral-950/60 p-4 border border-neutral-850 rounded-2xl flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
            Active Device Identity
          </span>
        </div>

        <div className="flex items-center justify-between bg-neutral-900/60 px-3.5 py-2.5 rounded-xl border border-neutral-800">
          <div className="flex flex-col">
            <span className="text-[9px] text-neutral-500 font-bold uppercase">Current Sync Token</span>
            <span className="text-sm font-mono font-bold text-neutral-100 tracking-wider">
              {syncId}
            </span>
          </div>
          <button
            onClick={handleGenerateNewCode}
            className="text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold px-2.5 py-1.5 rounded-lg border border-neutral-700 transition-all"
          >
            New Session
          </button>
        </div>

        <button
          onClick={handleSaveTrigger}
          disabled={isSyncing}
          className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 text-xs font-extrabold py-2.5 rounded-xl transition-all uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-sm"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <CloudUpload className="w-4 h-4" strokeWidth={2.5} />
              Backup state & Sync
            </>
          )}
        </button>
      </div>

      {/* Manual Code Input Load */}
      <form onSubmit={handleManualLoad} className="bg-neutral-950/60 p-4 border border-neutral-850 rounded-2xl flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
            Connect Another Device
          </span>
        </div>

        <p className="text-[10.5px] text-neutral-400 leading-relaxed mb-1">
          Have an existing vocabulary session code? Enter it below to download, merge, and continue your streak progress on this device:
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            required
            placeholder="e.g. VOC-A3K9"
            value={inputSyncId}
            onChange={(e) => setInputSyncId(e.target.value.toUpperCase())}
            className="flex-1 bg-neutral-900 border border-neutral-805 px-3 py-2 rounded-xl text-sm text-neutral-200 placeholder-neutral-500 font-mono tracking-wider focus:outline-none focus:border-amber-400/50"
          />
          <button
            type="submit"
            disabled={isSyncing}
            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-2 rounded-xl border border-neutral-700 text-xs font-extrabold uppercase transition-all flex items-center gap-1"
          >
            <CloudDownload className="w-4 h-4" /> Load
          </button>
        </div>
      </form>

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
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
        <div className="text-[10px] text-neutral-400 leading-relaxed">
          <strong className="text-neutral-300 font-semibold">⚡ Pure Real-time Sync (No manual work needed!): </strong>
          You <strong className="text-amber-400 font-bold">do NOT</strong> need to export, download, or manually back up files. 
          Once you load this Sync ID on your other PC or phone once, your learned terms, mastered words, and session streak will sync silently and automatically in the background every few seconds!
        </div>
      </div>

    </div>
  );
}

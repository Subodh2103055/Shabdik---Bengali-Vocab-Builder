import React, { useState, useEffect } from 'react';
import { Languages, Volume2, Copy, Trash2, ArrowUpDown, RefreshCw, Check, Sparkles, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { speakText } from '../lib/tts';

interface HistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  notes?: string;
  mode: 'en-to-bn' | 'bn-to-en';
  timestamp: string;
}

interface TranslateViewProps {
  showToast?: (msg: string) => void;
}

const PRESET_EXAMPLES = {
  'en-to-bn': [
    "Consistency is the key to mastering any language.",
    "A resilient mindset helps you conquer life's setbacks.",
    "The presentation of his work was meticulous and elegant."
  ],
  'bn-to-en': [
    "জ্ঞানই শক্তি এবং শিক্ষা হলো উন্নতির চাবিকাঠি।",
    "আমি প্রতিদিন নতুন ইংরেজি শব্দ শিখতে ভালোবাসি।",
    "ধৈর্য ও কঠোর পরিশ্রম অবশেষে সফলতা বয়ে আনে।"
  ]
};

export default function TranslateView({ 
  showToast
}: TranslateViewProps) {
  const [sourceText, setSourceText] = useState("");
  const [translation, setTranslation] = useState("");
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState<'en-to-bn' | 'bn-to-en'>('en-to-bn');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Load translation history from localStorage on mounting
  useEffect(() => {
    const savedHistory = localStorage.getItem('vocab_translation_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load translation history:", e);
      }
    }
  }, []);

  // Save history to localStorage
  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem('vocab_translation_history', JSON.stringify(newHistory));
  };

  // Switch/swap languages
  const handleSwap = () => {
    const newMode = mode === 'en-to-bn' ? 'bn-to-en' : 'en-to-bn';
    setMode(newMode);
    
    // Swap contents as well
    const previousSource = sourceText;
    const previousTranslation = translation;
    setSourceText(previousTranslation);
    setTranslation(previousSource);
    setNotes("");
  };

  // Perform translation
  const handleTranslate = async (textToTranslate = sourceText) => {
    const queryText = textToTranslate.trim();
    if (!queryText) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: queryText, mode })
      });
      
      const data = await res.json();
      if (data.success) {
        setTranslation(data.translation);
        setNotes(data.notes || "");
        setIsOfflineMode(!!data.isOffline);

        // Add to history if unique
        if (queryText.toLowerCase() !== data.translation.toLowerCase()) {
          const alreadyExists = history.some(
            item => item.sourceText.toLowerCase() === queryText.toLowerCase() && item.mode === mode
          );
          
          if (!alreadyExists) {
            const newItem: HistoryItem = {
              id: Date.now().toString(),
              sourceText: queryText,
              translatedText: data.translation,
              notes: data.notes || "",
              mode,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            saveHistory([newItem, ...history.slice(0, 19)]); // Keep last 20 items
          }
        }
      } else {
        throw new Error("Translation failed");
      }
    } catch (err) {
      console.error("Translation request error:", err);
      setIsOfflineMode(true);
      // Simulate fallback translation client-side
      const simulatedTrans = mode === 'en-to-bn' 
        ? `[অফলাইন মোড] "${queryText}" এর অনুবাদের জন্য এপিআই কী সংযুক্ত করুন।` 
        : `[Offline Mode] Connect Gemini API key to translate: "${queryText}".`;
      setTranslation(simulatedTrans);
      setNotes("");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle preset suggestions
  const handlePresetSelect = (example: string) => {
    setSourceText(example);
    handleTranslate(example);
  };

  // Speak translation using Synthesis
  const handleSpeak = (textToSpeak: string, speakMode: 'en-to-bn' | 'bn-to-en') => {
    // If mode is 'en-to-bn', we speak the translation (Bengali)
    // If mode is 'bn-to-en', we speak the translation (English)
    const targetLang = speakMode === 'en-to-bn' ? 'bn-BD' : 'en-US';
    const success = speakText(textToSpeak, {
      lang: targetLang,
      rate: 0.85,
      onStart: () => {
        if (showToast) showToast(`Pronouncing translation (${targetLang.split('-')[0].toUpperCase()})...`);
      },
      onError: (errMsg, isIframeIssue) => {
        if (showToast) {
          showToast(errMsg);
        } else {
          alert(errMsg);
        }
      }
    });

    if (!success && showToast) {
      showToast("Speech Synthesis is unsupported in this browser.");
    }
  };

  // Copy functionality
  const handleCopy = () => {
    if (!translation) return;
    navigator.clipboard.writeText(translation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Clear translation states
  const handleClear = () => {
    setSourceText("");
    setTranslation("");
    setNotes("");
  };

  // Delete individual history log item
  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = history.filter(item => item.id !== id);
    saveHistory(filtered);
  };

  // Load a translation from history back into active view
  const handleLoadHistory = (item: HistoryItem) => {
    setSourceText(item.sourceText);
    setTranslation(item.translatedText);
    setNotes(item.notes || "");
    setMode(item.mode);
  };

  return (
    <div className="flex flex-col gap-4 pb-6 animate-fade-in" id="translate-view-canvas">
      
      {/* Upper Mode Selector Info Bar */}
      <div className="bg-neutral-900/40 p-3 rounded-2xl border border-neutral-800/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-neutral-200">Smart Translator</span>
        </div>
        
        {isOfflineMode && (
          <span className="text-[10px] bg-amber-400/10 text-amber-300 font-extrabold uppercase px-2 py-0.5 rounded border border-amber-400/20">
            Offline Simulator
          </span>
        )}
      </div>

      {/* Language Header / Swap Control */}
      <div className="bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800/80 flex items-center justify-between shadow-inner">
        <div className="flex-1 text-center py-2 font-bold text-xs tracking-wide">
          {mode === 'en-to-bn' ? (
            <span className="text-neutral-100">🇬🇧 English</span>
          ) : (
            <span className="text-amber-400">🇧🇩 Bengali</span>
          )}
        </div>
        
        <button
          onClick={handleSwap}
          className="bg-neutral-900 border border-neutral-800 hover:border-amber-400/30 p-2 rounded-xl text-neutral-300 hover:text-amber-400 transition-all flex items-center justify-center cursor-pointer shadow"
          title="Swap Languages"
        >
          <ArrowUpDown className="w-4 h-4" />
        </button>

        <div className="flex-1 text-center py-2 font-bold text-xs tracking-wide">
          {mode === 'en-to-bn' ? (
            <span className="text-amber-400">🇧🇩 Bengali</span>
          ) : (
            <span className="text-neutral-100">🇬🇧 English</span>
          )}
        </div>
      </div>

      {/* Input Text Area Card */}
      <div className="bg-neutral-950 rounded-3xl border border-neutral-900 p-4 shadow-sm flex flex-col gap-3 relative">
        <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500">
          <span>{mode === 'en-to-bn' ? 'SOURCE (ENGLISH)' : 'উৎস (বাংলা)'}</span>
          <span>{sourceText.length} chars</span>
        </div>

        <textarea
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          placeholder={mode === 'en-to-bn' ? "Enter English sentence..." : "বাংলা বাক্য লিখুন..."}
          className="w-full h-24 bg-transparent outline-none resize-none text-sm text-neutral-100 placeholder-neutral-600 font-sans"
        />

        {/* Input Controls */}
        <div className="flex items-center justify-between border-t border-neutral-900/60 pt-3">
          {sourceText ? (
            <button
              onClick={handleClear}
              className="text-neutral-500 hover:text-neutral-300 text-[10px] uppercase font-bold tracking-wider transition-all"
            >
              Clear
            </button>
          ) : (
            <span />
          )}

          <button
            onClick={() => handleTranslate()}
            disabled={isLoading || !sourceText.trim()}
            className="bg-amber-400 disabled:bg-neutral-800 text-neutral-950 disabled:text-neutral-600 hover:bg-amber-300 font-black text-xs uppercase px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            {isLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            Translate
          </button>
        </div>
      </div>

      {/* Preset Suggestions / Quick Examples */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 ml-1">
          Try Quick Phrases:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_EXAMPLES[mode].map((example, idx) => (
            <button
              key={idx}
              onClick={() => handlePresetSelect(example)}
              className="bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800/40 hover:border-neutral-700 p-2.5 rounded-xl text-neutral-300 text-[11px] text-left leading-snug transition-all max-w-full truncate block"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Translation Result Card */}
      <AnimatePresence mode="wait">
        {translation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800/80 rounded-3xl p-4 flex flex-col gap-3 shadow-lg"
          >
            <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500">
              <span>{mode === 'en-to-bn' ? 'TRANSLATION (BENGALI)' : 'অনুবাদ (ইংরেজি)'}</span>
              <div className="flex items-center gap-1.5">
                {/* Speak button */}
                <button
                  onClick={() => handleSpeak(translation, mode)}
                  className="bg-neutral-800 hover:bg-neutral-700/80 p-1.5 rounded-lg text-neutral-300 hover:text-amber-400 transition-all cursor-pointer"
                  title="Pronounce translation"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
                {/* Copy button */}
                <button
                  onClick={handleCopy}
                  className="bg-neutral-800 hover:bg-neutral-700/80 p-1.5 rounded-lg text-neutral-300 hover:text-amber-400 transition-all cursor-pointer flex items-center justify-center"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <p className="text-sm font-bold text-neutral-50 leading-relaxed font-sans select-text">
              {translation}
            </p>

            {/* Smart Learning / AI Grammar Break-down Notes */}
            {notes && (
              <div className="border-t border-neutral-800/60 pt-3 mt-1">
                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-300 uppercase tracking-wider mb-2">
                  <Sparkles className="w-3 h-3" />
                  <span>Grammar & Learnings</span>
                </div>
                <div className="text-[11px] text-neutral-300 leading-normal bg-neutral-950/50 p-3 rounded-xl border border-neutral-900 font-sans select-text whitespace-pre-line prose-invert">
                  {notes}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Translation History Log */}
      {history.length > 0 && (
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center justify-between ml-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
              Recent Translation History
            </span>
            <button
              onClick={() => saveHistory([])}
              className="text-[9px] uppercase font-bold tracking-wider text-red-400 hover:text-red-300 transition-all flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear Log
            </button>
          </div>

          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto scrollbar-none pr-0.5">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => handleLoadHistory(item)}
                className="bg-neutral-950 hover:bg-neutral-900 border border-neutral-900/80 hover:border-neutral-800 p-3 rounded-2xl cursor-pointer transition-all flex items-start justify-between gap-3 group"
              >
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-neutral-500">
                    <span className="text-neutral-400">{item.timestamp}</span>
                    <span>•</span>
                    <span className="text-amber-400/80">{item.mode === 'en-to-bn' ? 'EN ⇄ BN' : 'BN ⇄ EN'}</span>
                  </div>
                  <p className="text-xs text-neutral-400 font-medium truncate">{item.sourceText}</p>
                  <p className="text-xs text-amber-400 font-bold truncate leading-none mt-0.5">{item.translatedText}</p>
                </div>

                <div className="flex items-center gap-1 self-center opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpeak(item.translatedText, item.mode);
                    }}
                    className="p-1 px-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 transition-all"
                    title="Speak"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                    className="p-1 px-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-red-400 transition-all"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

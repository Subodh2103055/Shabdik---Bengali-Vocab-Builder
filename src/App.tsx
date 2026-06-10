import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import HomeView from './components/HomeView';
import DeckView from './components/DeckView';
import SyncView from './components/SyncView';
import TranslateView from './components/TranslateView';
import DeveloperNote from './components/DeveloperNote';
import PhoneSimulator from './components/PhoneSimulator';
// @ts-ignore
import shabdikLogo from './assets/images/shabdik_logo_1780641345322.png';
import { Word, UserStats, Difficulty, SyncData } from './types';
import { OFFLINE_DICTIONARY as SEED_WORDS } from './data/offlineDictionary';
import { BookOpen, Sparkles, Award, Layers, RefreshCw, Flame, Key, Languages, Heart } from 'lucide-react';
import { searchWordDirect, generateWordDirect } from './lib/gemini';
import { auth, clientSaveUserDeck, clientLoadUserDeck, initialized as firebaseInitialized } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  // Flag to temporarily disable auto-saving when we are fetching/merging from the cloud
  const isImportingCloudDataRef = useRef(false);

  // Cache of the last successfully synced/loaded state to prevent race conditions or duplicate overwrites
  const lastSyncedPayloadRef = useRef<string>("");

  // Navigation internal inside simulated phone
  const [activeTab, setActiveTab] = useState<string>('home');

  // Application States
  const [currentWord, setCurrentWord] = useState<Word>(SEED_WORDS[0]);
  const [isLoadingNewWord, setIsLoadingNewWord] = useState<boolean>(false);
  const [savedWords, setSavedWords] = useState<Word[]>(() => {
    try {
      const localSaved = localStorage.getItem('vocab_saved_words');
      return localSaved ? JSON.parse(localSaved) : [];
    } catch {
      return [];
    }
  });
  const [masteredWords, setMasteredWords] = useState<string[]>(() => {
    try {
      const localMastered = localStorage.getItem('vocab_mastered_words');
      return localMastered ? JSON.parse(localMastered) : [];
    } catch {
      return [];
    }
  });
  
  // Stats & Streak tracking
  const [streak, setStreak] = useState<number>(() => {
    try {
      const localStreak = localStorage.getItem('vocab_streak');
      return localStreak ? parseInt(localStreak, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [completedDates, setCompletedDates] = useState<string[]>(() => {
    try {
      const localCompleted = localStorage.getItem('vocab_completed_dates');
      return localCompleted ? JSON.parse(localCompleted) : [];
    } catch {
      return [];
    }
  });
  const [isCheckedToday, setIsCheckedToday] = useState<boolean>(() => {
    try {
      const localCompleted = localStorage.getItem('vocab_completed_dates');
      if (localCompleted) {
        const loadedCompleted = JSON.parse(localCompleted);
        const d = new Date();
        const todayStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        return loadedCompleted.includes(todayStr);
      }
      return false;
    } catch {
      return false;
    }
  });

  // User Authentication State
  const [user, setUser] = useState<any | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Toast feedback overlay
  const [toastMessage, setToastMessage] = useState<string>("");

  // Search error / spelling suggestion feedback state
  const [searchFeedback, setSearchFeedback] = useState<{
    error?: string;
    suggestion?: string;
    searchedQuery?: string;
  } | null>(null);

  // Global pull-to-refresh drag and reload states
  const [pullY, setPullY] = useState<number>(0);
  const [isPullGlobal, setIsPullGlobal] = useState<boolean>(false);
  const [startYGlobal, setStartYGlobal] = useState<number | null>(null);
  const [isRefreshingGlobal, setIsRefreshingGlobal] = useState<boolean>(false);

  // Application theme preset definitions
  const [theme, setTheme] = useState<'cosmic' | 'sunlit' | 'emerald' | 'ocean' | 'rose'>('cosmic');

  // Load and save selected theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('shabdik_theme');
    if (savedTheme === 'cosmic' || savedTheme === 'sunlit' || savedTheme === 'emerald' || savedTheme === 'ocean' || savedTheme === 'rose') {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('shabdik_theme', theme);
  }, [theme]);

  // Perspective Viewports toggler
  const [viewMode, setViewMode] = useState<'simulator' | 'responsive'>('simulator');

  useEffect(() => {
    const savedView = localStorage.getItem('shabdik_view_mode');
    if (savedView === 'simulator' || savedView === 'responsive') {
      setViewMode(savedView);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('shabdik_view_mode', viewMode);
  }, [viewMode]);

  // Global pull to refresh window listeners that override browser swipe-down reloads
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (isRefreshingGlobal) return;
      const scrollPos = window.scrollY || document.documentElement.scrollTop;
      if (scrollPos <= 2) {
        setStartYGlobal(e.touches[0].clientY);
        setIsPullGlobal(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullGlobal || startYGlobal === null || isRefreshingGlobal) return;
      const currentY = e.touches[0].clientY;
      const diffY = currentY - startYGlobal;
      if (diffY > 0) {
        // Safe scaling pull distance
        const distance = Math.min(100, diffY * 0.42);
        setPullY(distance);
        
        // Block browser's native pull-to-refresh behavior
        if (distance > 15 && e.cancelable) {
          e.preventDefault();
        }
      } else {
        setPullY(0);
      }
    };

    const handleTouchEnd = () => {
      if (!isPullGlobal) return;
      setIsPullGlobal(false);
      setStartYGlobal(null);
      if (pullY >= 70) {
        setIsRefreshingGlobal(true);
        setPullY(70);
        showToast("🔄 Reloading application...");
        setTimeout(() => {
          window.location.reload();
        }, 900);
      } else {
        setPullY(0);
      }
    };

    // Support mouse drag pull-to-reload for easy preview testing
    const handleMouseDown = (e: MouseEvent) => {
      if (isRefreshingGlobal) return;
      const scrollPos = window.scrollY || document.documentElement.scrollTop;
      if (scrollPos <= 2) {
        setStartYGlobal(e.clientY);
        setIsPullGlobal(true);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPullGlobal || startYGlobal === null || isRefreshingGlobal) return;
      const diffY = e.clientY - startYGlobal;
      if (diffY > 0) {
        const distance = Math.min(100, diffY * 0.42);
        setPullY(distance);
      } else {
        setPullY(0);
      }
    };

    const handleMouseUp = () => {
      if (!isPullGlobal) return;
      setIsPullGlobal(false);
      setStartYGlobal(null);
      if (pullY >= 70) {
        setIsRefreshingGlobal(true);
        setPullY(70);
        showToast("🔄 Reloading application...");
        setTimeout(() => {
          window.location.reload();
        }, 900);
      } else {
        setPullY(0);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPullGlobal, startYGlobal, pullY, isRefreshingGlobal]);

  useEffect(() => {
    // Initialize synced payload cache with starting client state to prevent looping auto-saved items
    lastSyncedPayloadRef.current = JSON.stringify({
      savedWords: savedWords.map((w: any) => w.word.toLowerCase()).sort(),
      masteredWords: [...masteredWords].sort(),
      streak,
      completedDates: [...completedDates].sort()
    });

    // 2. Fetch Daily Word from Express Backend
    fetchDailyWord();
  }, []);

  // Sync state transitions to local storage
  useEffect(() => {
    localStorage.setItem('vocab_saved_words', JSON.stringify(savedWords));
  }, [savedWords]);

  useEffect(() => {
    localStorage.setItem('vocab_mastered_words', JSON.stringify(masteredWords));
  }, [masteredWords]);

  useEffect(() => {
    localStorage.setItem('vocab_streak', streak.toString());
  }, [streak]);

  useEffect(() => {
    localStorage.setItem('vocab_completed_dates', JSON.stringify(completedDates));
  }, [completedDates]);



  // Utility to generate YYYY-MM-DD
  const getTodayDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  };

  // Fetch deterministic daily Word of the Day from API
  const fetchDailyWord = async () => {
    try {
      const res = await fetch("/api/word/daily");
      const data = await res.json();
      if (data.success && data.word) {
        setCurrentWord(data.word);
      } else {
        // Fallback case inside successful request with no success flag
        const dayOffset = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
        setCurrentWord(SEED_WORDS[dayOffset % SEED_WORDS.length]);
      }
    } catch (err) {
      console.log("Daily word fetch failed, using local offline seed:", err);
      const dayOffset = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
      setCurrentWord(SEED_WORDS[dayOffset % SEED_WORDS.length]);
    }
  };

  // Refresh Word dynamically calling Gemini AI
  const handleRefreshWordByGemini = async (difficulty: Difficulty) => {
    setIsLoadingNewWord(true);
    // Package existing words to exclude them from the next selection
    const excludeWords = [currentWord?.word].filter(Boolean) as string[];
    savedWords.forEach(w => {
      if (w?.word && !excludeWords.includes(w.word)) {
        excludeWords.push(w.word);
      }
    });

    try {
      console.log(`[Frontend Generate] Requesting client-side direct word generation for difficulty: "${difficulty}"`);
      const wordData = await generateWordDirect(difficulty, excludeWords);
      if (wordData && wordData.word) {
        setCurrentWord(wordData);
        showToast(`Gemini successfully generated: ${wordData.word}!`);
      } else {
        throw new Error("Invalid structure returned from client-side direct generation");
      }
    } catch (err: any) {
      console.warn("[Frontend Generate] Direct SDK call failed, trying backup API route:", err.message || err);
      try {
        const res = await fetch("/api/word/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ difficulty, excludeWords })
        });
        const data = await res.json();
        if (data.success && data.word) {
          setCurrentWord(data.word);
          if (data.isFallback) {
            showToast(`Offline Cache Word: ${data.word.word}`);
          } else {
            showToast(`Generated: ${data.word.word}!`);
          }
        } else {
          throw new Error("Failed success flag from server");
        }
      } catch (backupErr) {
        console.log("Both direct and backend generator failed, selecting local seed word of difficulty:", difficulty);
        // Filter local seed words matching difficulty & excluding already shown words
        const excludeSet = [currentWord?.word?.toLowerCase()].filter(Boolean) as string[];
        savedWords.forEach(w => {
          if (w?.word) excludeSet.push(w.word.toLowerCase());
        });

        const matching = SEED_WORDS.filter(w => w.difficulty === difficulty && !excludeSet.includes(w.word.toLowerCase()));
        const pool = matching.length > 0 ? matching : SEED_WORDS.filter(w => w.difficulty === difficulty);
        const finalPool = pool.length > 0 ? pool : SEED_WORDS;
        const idx = Math.floor(Math.random() * finalPool.length);
        const chosen = finalPool[idx];
        setCurrentWord(chosen);
        showToast(`Offline Mode: Loaded "${chosen.word}" from offline memory.`);
      }
    } finally {
      setIsLoadingNewWord(false);
    }
  };

  // Search Word dynamically calling Gemini AI on client
  const handleSearchWord = async (wordQuery: string) => {
    setIsLoadingNewWord(true);
    setSearchFeedback(null);
    const lowercaseQuery = wordQuery.trim().toLowerCase();

    // 1. Check if word exists in local static list (SEED_WORDS)
    const found = SEED_WORDS.find(w => w.word.toLowerCase() === lowercaseQuery);
    if (found) {
      setCurrentWord(found);
      showToast(`Loaded offline word: ${found.word}`);
      setIsLoadingNewWord(false);
      return;
    }

    try {
      console.log(`[Frontend Search] Querying Gemini client directly for: "${wordQuery}"`);
      const data = await searchWordDirect(wordQuery);
      
      if (data.isInvalidWord) {
        setSearchFeedback({
          error: data.message || `No valid English word found for "${wordQuery}".`,
          searchedQuery: wordQuery
        });
        showToast("Unrecognized English word.");
      } else if (data && data.word) {
        setCurrentWord(data);
        showToast(`Gemini successfully defined: ${data.word}!`);
      } else {
        throw new Error("Invalid structure returned from Gemini client-side");
      }
    } catch (err: any) {
      console.warn("[Frontend Search] Direct Gemini SDK call failed, trying backup API route:", err.message || err);
      try {
        // Fallback to Express backend /api server path if available
        const res = await fetch("/api/word/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wordQuery })
        });
        const data = await res.json();
        if (data.success && data.word) {
          setCurrentWord(data.word);
          showToast(`Retrieved word details for: ${data.word.word}`);
        } else {
          throw new Error("Internal server/offline lookup failed");
        }
      } catch (backupErr) {
        console.error("[Frontend Search] Primary & secondary gateways both failed:", backupErr);
        setSearchFeedback({
          error: `We could not configure or reach Gemini to define "${wordQuery}". Please check your internet connection or declare your VITE_GEMINI_API_KEY.`,
          searchedQuery: wordQuery
        });
        showToast("Word not found.");
      }
    } finally {
      setIsLoadingNewWord(false);
    }
  };

  // Bookmark / Unbookmark a word
  const handleSaveToggle = () => {
    const isSaved = savedWords.some(w => w.word.toLowerCase() === currentWord.word.toLowerCase());
    if (isSaved) {
      setSavedWords(prev => prev.filter(w => w.word.toLowerCase() !== currentWord.word.toLowerCase()));
      showToast(`Removed "${currentWord.word}" from your deck.`);
    } else {
      setSavedWords(prev => [currentWord, ...prev]);
      showToast(`Added "${currentWord.word}" to your personal saved deck!`);
    }
  };

  // Toggle vocabulary item mastery status
  const handleToggleMastered = (wordString: string) => {
    setMasteredWords(prev => {
      if (prev.includes(wordString)) {
        showToast(`"${wordString}" returned back to active learning deck.`);
        return prev.filter(w => w !== wordString);
      } else {
        showToast(`Congratulations! Marked "${wordString}" as fully mastered! 🎓`);
        return [...prev, wordString];
      }
    });
  };

  // Remove a word completely from vocabulary library
  const handleRemoveWord = (wordString: string) => {
    setSavedWords(prev => prev.filter(w => w.word.toLowerCase() !== wordString.toLowerCase()));
    showToast(`Deleted "${wordString}" from your practice bank.`);
  };

  // Streak verification mark logic
  const handleMarkChecked = () => {
    const todayStr = getTodayDateString();
    if (completedDates.includes(todayStr)) {
      return; // Already checked today
    }

    const updatedCompleted = [...completedDates, todayStr];
    setCompletedDates(updatedCompleted);
    setIsCheckedToday(true);

    // Calculate streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${(yesterday.getMonth() + 0 + 1).toString().padStart(2, '0')}-${yesterday.getDate().toString().padStart(2, '0')}`;

    if (completedDates.includes(yesterdayStr) || streak === 0) {
      // Completed yesterday, or it is their first checked word
      setStreak(prev => prev + 1);
      showToast("🔥 Daily Streak Checked! Keep up the momentum!");
    } else {
      // Missing yesterday, start fresh streak of 1
      setStreak(1);
      showToast("✨ Streak restarted! Daily learning unlocked.");
    }
  };

  const getLocalDataPayloadString = () => {
    return JSON.stringify({
      savedWords: savedWords.map(w => w.word.toLowerCase()).sort(),
      masteredWords: [...masteredWords].sort(),
      streak,
      completedDates: [...completedDates].sort()
    });
  };

  // Listen to Google Authentication State Changes
  useEffect(() => {
    if (!firebaseInitialized || !auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Automatically fetch saved deck
        handleUserDeckLoad(currentUser.uid, false);
      } else {
        // Reset state on sign out
        handleSignOutClearState();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOutClearState = () => {
    setSavedWords([]);
    setMasteredWords([]);
    setStreak(0);
    setCompletedDates([]);
    setIsCheckedToday(false);
    localStorage.removeItem('vocab_saved_words');
    localStorage.removeItem('vocab_mastered_words');
    localStorage.removeItem('vocab_streak');
    localStorage.removeItem('vocab_completed_dates');
  };

  // Cloud action: save current local state to memory store under user uid
  const handleUserDeckSave = async (silent: boolean = false) => {
    if (!user || !user.uid) return;
    const currentPayload = getLocalDataPayloadString();
    
    // If the current local state matches what is already synced, skip uploading in background
    if (silent && currentPayload === lastSyncedPayloadRef.current) {
      return;
    }

    if (!silent) setIsSyncing(true);
    try {
      const statsPayload: UserStats = {
        streak,
        lastCompletedDate: completedDates[completedDates.length - 1] || null,
        completedDates,
        totalWordsLearned: savedWords.length
      };

      const syncPayload: SyncData = {
        stats: statsPayload,
        savedWords,
        masteredWords
      };

      // client-side Firebase user UID write
      let success = await clientSaveUserDeck(user.uid, syncPayload);

      if (success) {
        lastSyncedPayloadRef.current = currentPayload;
        if (!silent) {
          showToast("✓ Synced vocabulary bank to secure cloud profile!");
        }
      } else {
        throw new Error("Unable to save sync state to cloud. Please verify setup.");
      }
    } catch {
      if (!silent) showToast("Sync upload failed. Verify connection status.");
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  // Cloud action: load target cloud state and merge
  const handleUserDeckLoad = async (uid: string, silent: boolean = false): Promise<boolean> => {
    if (!silent) setIsSyncing(true);
    isImportingCloudDataRef.current = true; // Prevent automatic re-saves during state integration
    try {
      let cloudData = await clientLoadUserDeck(uid);
      
      if (cloudData) {
        let localMergedSaved: Word[] = [];
        let localMergedMastered: string[] = [];
        let localMergedStreak = streak;
        let localMergedDates: string[] = [];

        // 1. Merge saved words list without duplicates
        if (cloudData.savedWords) {
          const cloudWords = cloudData.savedWords;
          setSavedWords(prev => {
            const merged = [...cloudWords];
            prev.forEach(p => {
              if (!merged.some(m => m.word.toLowerCase() === p.word.toLowerCase())) {
                merged.push(p);
              }
            });
            localMergedSaved = merged;
            return merged;
          });
        } else {
          localMergedSaved = savedWords;
        }

        // 2. Merge mastered words list without duplicates
        if (cloudData.masteredWords) {
          const cloudMastered = cloudData.masteredWords;
          setMasteredWords(prev => {
            const merged = Array.from(new Set([...prev, ...cloudMastered]));
            localMergedMastered = merged;
            return merged;
          });
        } else {
          localMergedMastered = masteredWords;
        }

        // 3. Merge stats
        if (cloudData.stats) {
          if (cloudData.stats.streak > streak) {
            setStreak(cloudData.stats.streak);
            localMergedStreak = cloudData.stats.streak;
          }
          if (cloudData.stats.completedDates) {
            const cloudDates = cloudData.stats.completedDates;
            setCompletedDates(prev => {
              const merged = Array.from(new Set([...prev, ...cloudDates]));
              localMergedDates = merged;
              const today = getTodayDateString();
              if (merged.includes(today)) {
                setIsCheckedToday(true);
              }
              return merged;
            });
          } else {
            localMergedDates = completedDates;
          }
        }

        // Pre-compute the merged local representation string
        const mergedPayloadString = JSON.stringify({
          savedWords: localMergedSaved.map(w => w.word.toLowerCase()).sort(),
          masteredWords: [...localMergedMastered].sort(),
          streak: localMergedStreak,
          completedDates: [...localMergedDates].sort()
        });

        // Set the last synced cache to this exact merged payload
        lastSyncedPayloadRef.current = mergedPayloadString;

        if (!silent) {
          showToast(`✓ Cloud synchronized successfully!`);
        }
        return true;
      }
      isImportingCloudDataRef.current = false;
      return false;
    } catch (err) {
      console.error(err);
      isImportingCloudDataRef.current = false;
      return false;
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  // AUTOMATIC CLOUD SYNC HIERARCHY
  // 1. Debounced background push whenever any local progression state shifts
  useEffect(() => {
    if (!user || !user.uid) return;

    if (isImportingCloudDataRef.current) {
      isImportingCloudDataRef.current = false;
      return;
    }

    const currentPayload = getLocalDataPayloadString();
    if (currentPayload === lastSyncedPayloadRef.current) {
      return;
    }

    const timeoutId = setTimeout(() => {
      handleUserDeckSave(true); // run silent auto-upload
    }, 1800); // 1.8 seconds debounce

    return () => clearTimeout(timeoutId);
  }, [savedWords, masteredWords, streak, completedDates, user]);

  // 2. Silent background pull every 8 seconds to merge data updated on other devices
  useEffect(() => {
    if (!user || !user.uid) return;

    const intervalId = setInterval(() => {
      handleUserDeckLoad(user.uid, true); // run silent poll
    }, 8000);

    return () => clearInterval(intervalId);
  }, [user]);

  const isSaved = savedWords.some(w => w.word.toLowerCase() === currentWord.word.toLowerCase());

  return (
    <div className={`min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden bg-neutral-950 text-neutral-100 flex flex-col items-center justify-start p-4 md:p-8 font-sans selection:bg-amber-400 selection:text-neutral-950 theme-${theme}`}>
      
      {/* Global Pull-to-Refresh HUD Overlay */}
      {(pullY > 0 || isRefreshingGlobal) && (
        <div 
          className="fixed top-2 left-1/2 z-50 pointer-events-none flex flex-col items-center gap-2.5 transition-all duration-75"
          style={{ 
            transform: `translate(-50%, ${pullY}px)`,
            opacity: Math.min(pullY / 25, 1),
          }}
        >
          <div className={`w-11 h-11 rounded-full flex items-center justify-center shadow-2xl border transition-all ${
            pullY >= 70
              ? 'bg-amber-400 border-amber-300 text-neutral-950 scale-110 shadow-amber-400/30'
              : 'bg-neutral-900/95 border-neutral-800 text-amber-400 backdrop-blur-xl'
          }`}>
            <RefreshCw 
              className={`w-5 h-5 ${isRefreshingGlobal || pullY >= 70 ? 'animate-spin' : ''}`}
              style={{
                transform: isRefreshingGlobal || pullY >= 70 ? undefined : `rotate(${pullY * 5.1}deg)`
              }}
            />
          </div>
          {pullY > 15 && (
            <div className="bg-neutral-950/95 backdrop-blur-md border border-neutral-850 px-3 py-1 rounded-full shadow-2xl">
              <span className="text-[9.5px] font-black tracking-wider uppercase font-mono text-neutral-200">
                {isRefreshingGlobal 
                  ? "Reloading..." 
                  : pullY >= 70 
                    ? "Release to reload" 
                    : "Pull down to reload"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Toast Overlay */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 border border-amber-400/20 text-neutral-100 text-xs px-5 py-3 rounded-2xl shadow-xl backdrop-blur-xl animate-fade-in flex items-center gap-2 max-w-[90%] md:max-w-md">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Top Header Branding */}
      <header className="max-w-[1440px] w-full flex flex-col md:flex-row items-center justify-between gap-6 border-b border-neutral-900 pb-6 mb-6 lg:mb-8 shrink-0">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="relative group shrink-0" id="header-logo-container">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <img
              src={shabdikLogo}
              alt="Shabdik Logo"
              referrerPolicy="no-referrer"
              className="relative w-16 h-16 rounded-2xl object-cover border border-neutral-800 bg-neutral-900 shadow-lg"
            />
          </div>
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-sm">🇬🇧 ⇄ 🇧🇩</span>
              <span className="text-[10px] bg-amber-400/10 text-amber-300 font-extrabold uppercase px-2 py-0.5 rounded border border-amber-400/20">
                Fully Responsive
              </span>
            </div>
            <h1 className="text-2xl font-black text-neutral-50 tracking-tight mt-1.5 font-sans">
              Bengali Vocab Builder <span className="text-amber-400 font-light font-mono">শাব্দিক</span>
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Build fluent, effortless English vocabulary backed by rich translations and real-time encouragement.
            </p>
          </div>
        </div>

        {/* Unified, Premium Configuration settings panel with smooth flat styling */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3.5 bg-neutral-900/30 p-3 rounded-3xl border border-neutral-900/80 w-full md:w-auto mt-4 xl:mt-0 shadow-sm">
          
          {/* Section A: App Theme Selectors */}
          <div className="flex flex-col gap-1 items-start pl-1">
            <span className="text-[9px] uppercase tracking-widest text-neutral-500 font-extrabold font-sans">App Theme</span>
            <div className="flex bg-neutral-950/80 p-0.5 rounded-xl border border-neutral-850">
              <button
                onClick={() => {
                  setTheme('cosmic');
                  showToast("Theme: Cosmic Slate activated!");
                }}
                className={`py-1 px-3.5 rounded-lg text-[10.5px] font-bold transition-all relative cursor-pointer ${
                  theme === 'cosmic'
                    ? 'bg-neutral-850 border border-neutral-750 text-amber-400 font-black shadow'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
                title="Cosmic Slate"
              >
                🌌 Cosmic
              </button>
              <button
                id="theme-btn-sunlit"
                onClick={() => {
                  setTheme('sunlit');
                  showToast("Theme: Sunlit Warmth activated!");
                }}
                className={`py-1 px-3.5 rounded-lg text-[10.5px] font-bold transition-all relative cursor-pointer ${
                  theme === 'sunlit'
                    ? 'bg-neutral-850 border border-neutral-750 text-amber-400 font-black shadow'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
                title="Sunlit Warmth"
              >
                ☀️ Sunlit
              </button>
              <button
                onClick={() => {
                  setTheme('emerald');
                  showToast("Theme: Emerald Dusk activated!");
                }}
                className={`py-1 px-3.5 rounded-lg text-[10.5px] font-bold transition-all relative cursor-pointer ${
                  theme === 'emerald'
                    ? 'bg-neutral-850 border border-neutral-750 text-amber-400 font-black shadow'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
                title="Emerald Dusk Theme"
              >
                🌿 Mint
              </button>
              <button
                onClick={() => {
                  setTheme('ocean');
                  showToast("Theme: Ocean Breeze activated!");
                }}
                className={`py-1 px-3.5 rounded-lg text-[10.5px] font-bold transition-all relative cursor-pointer ${
                  theme === 'ocean'
                    ? 'bg-neutral-850 border border-neutral-750 text-amber-400 font-black shadow'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
                title="Ocean Breeze Theme"
              >
                🌊 Ocean
              </button>
              <button
                onClick={() => {
                  setTheme('rose');
                  showToast("Theme: Velvet Rose activated!");
                }}
                className={`py-1 px-3.5 rounded-lg text-[10.5px] font-bold transition-all relative cursor-pointer ${
                  theme === 'rose'
                    ? 'bg-neutral-850 border border-neutral-750 text-amber-400 font-black shadow'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
                title="Velvet Rose Theme"
              >
                🌹 Velvet
              </button>
            </div>
          </div>

          {/* Divider on desktop */}
          <div className="hidden md:block w-[1px] h-9 bg-neutral-850 self-end mb-0.5"></div>

          {/* Section B: Perspective Viewports */}
          <div className="flex flex-col gap-1 items-start pl-1">
            <span className="text-[9px] uppercase tracking-widest text-neutral-500 font-extrabold font-sans">View Layout</span>
            <div className="flex bg-neutral-950/80 p-0.5 rounded-xl border border-neutral-850">
              <button
                id="viewmode-btn-simulator"
                onClick={() => {
                  setViewMode('simulator');
                  showToast("Simulator view mode activated!");
                }}
                className={`py-1 px-3.5 rounded-lg text-[10.5px] font-bold transition-all relative cursor-pointer ${
                  viewMode === 'simulator'
                    ? 'bg-neutral-850 border border-neutral-750 text-amber-400 font-black shadow'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                📱 Phone
              </button>
              <button
                id="viewmode-btn-responsive"
                onClick={() => {
                  setViewMode('responsive');
                  showToast("Responsive Full-screen activated!");
                }}
                className={`py-1 px-3.5 rounded-lg text-[10.5px] font-bold transition-all relative cursor-pointer ${
                  viewMode === 'responsive'
                    ? 'bg-neutral-850 border border-neutral-750 text-amber-400 font-black shadow'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                💻 Monitor
              </button>
            </div>
          </div>

          {/* Divider on desktop */}
          <div className="hidden md:block w-[1px] h-9 bg-neutral-850 self-end mb-0.5"></div>

          {/* Section C: Sleek Cloud Sync */}
          <div className="hidden md:flex flex-col gap-1 items-start pl-1">
            <span className="text-[9px] uppercase tracking-widest text-neutral-500 font-extrabold font-sans">Cloud Sync</span>
            <div className="flex items-center gap-3 bg-neutral-950/80 px-3 py-1 rounded-xl border border-neutral-850 h-[32px]">
              <div className="flex items-baseline gap-1.5 min-w-0 max-w-[150px]">
                {user ? (
                  <>
                    <span className="text-[8px] uppercase tracking-wide text-neutral-500 font-bold block shrink-0">User</span>
                    <span className="font-sans text-neutral-100 font-bold text-[10.5px] tracking-wider truncate">{user.email}</span>
                  </>
                ) : (
                  <>
                    <span className="font-sans text-neutral-450 font-bold text-[10px] tracking-wider">Guest Mode</span>
                  </>
                )}
              </div>
              <div className="w-[1px] h-3 bg-neutral-850"></div>
              <div className="flex items-center gap-1.5 px-1">
                {user ? (
                  <>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[9px] text-emerald-400 uppercase font-black tracking-wider">Live Active</span>
                  </>
                ) : (
                  <span className="text-[9px] text-neutral-550 uppercase font-bold tracking-wider">Offline</span>
                )}
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Primary Dashboard layout conditionally styled by viewMode */}
      {viewMode === 'simulator' ? (
        <main className="max-w-md w-full mx-auto flex flex-col items-center justify-center gap-4 animate-fade-in text-left animate-once">
          <PhoneSimulator 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            streak={streak}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="w-full flex-1 flex flex-col"
              >
                {activeTab === 'home' && (
                  <HomeView
                    currentWord={currentWord}
                    isLoadingNewWord={isLoadingNewWord}
                    onRefreshWord={handleRefreshWordByGemini}
                    onSearchWord={handleSearchWord}
                    isSaved={isSaved}
                    onSaveToggle={handleSaveToggle}
                    streak={streak}
                    onMarkChecked={handleMarkChecked}
                    isCheckedToday={isCheckedToday}
                    showToast={showToast}
                    searchFeedback={searchFeedback}
                    onClearSearchFeedback={() => setSearchFeedback(null)}
                  />
                )}

                {activeTab === 'deck' && (
                  <DeckView
                    savedWords={savedWords}
                    onRemoveWord={handleRemoveWord}
                    masteredWords={masteredWords}
                    onToggleMastered={handleToggleMastered}
                    showToast={showToast}
                  />
                )}

                {activeTab === 'sync' && (
                  <SyncView
                    user={user}
                    onCloudSave={handleUserDeckSave}
                    isSyncing={isSyncing}
                  />
                )}

                {activeTab === 'translate' && (
                  <TranslateView showToast={showToast} />
                )}

                {activeTab === 'creator' && (
                  <div className="py-1 pb-6 w-full">
                    <DeveloperNote />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </PhoneSimulator>
        </main>
      ) : (
        /* PC APP MODE - Native fully responsive master-detail dashboard across the screen */
        <main className="max-w-[1440px] w-full grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start animate-fade-in text-left lg:flex-1 lg:h-0 lg:overflow-hidden lg:items-stretch font-sans">
          
          {/* Mobile responsive persistent bottom navigation bar - fixed at the bottom, visible only on smaller screens (< lg) */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-900/40 pb-5 pt-3.5 px-3 flex items-center justify-around shadow-[0_-8px_30px_rgba(0,0,0,0.85)]">
            {[
              { id: 'home', label: 'Daily Word', icon: Sparkles },
              { id: 'deck', label: 'My Deck', icon: BookOpen },
              { id: 'translate', label: 'Translate', icon: Languages },
              { id: 'sync', label: 'Sync Cloud', icon: Layers },
              { id: 'creator', label: 'Creator Note', icon: Heart },
            ].map(item => {
              const IconComp = item.icon;
              const isSel = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    showToast(`Switched view to ${item.label}`);
                  }}
                  className={`flex flex-col items-center gap-1 transition-all cursor-pointer select-none ${
                    isSel 
                      ? 'text-amber-400 scale-105 font-bold' 
                      : 'text-neutral-500 hover:text-neutral-350'
                  }`}
                  style={{ minWidth: '65px' }}
                >
                  <IconComp className={`w-5 h-5 shrink-0 transition-transform ${isSel ? 'text-amber-400 animate-pulse' : 'text-neutral-400'}`} />
                  <span className={`text-[9.5px] uppercase tracking-wide font-extrabold font-sans transition-colors ${isSel ? 'text-amber-400' : 'text-neutral-500'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Left Side desktop navigation sidebar - visible only on PC size screens */}
          <aside className="hidden lg:flex lg:col-span-4 xl:col-span-3 flex-col gap-5 animate-fade-in lg:h-full lg:max-h-full lg:overflow-y-auto pr-1">
            
            {/* Modern Sidebar Tabs list button segment */}
            <div className="bg-neutral-900/65 border border-neutral-800/80 p-3.5 rounded-[24px] flex flex-col gap-2">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-3 block mb-1">
                Dashboard Menu
              </span>
              
              <button
                id="pc-tab-home"
                onClick={() => setActiveTab('home')}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[11.5px] font-bold uppercase tracking-wider text-left transition-all ${
                  activeTab === 'home'
                    ? 'bg-amber-400 text-neutral-950 shadow-sm font-black'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                }`}
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Daily Vocab Word</span>
              </button>

              <button
                id="pc-tab-deck"
                onClick={() => setActiveTab('deck')}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[11.5px] font-bold uppercase tracking-wider text-left transition-all ${
                  activeTab === 'deck'
                    ? 'bg-amber-400 text-neutral-950 shadow-sm font-black'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>Saved Deck List</span>
              </button>

              <button
                id="pc-tab-translate"
                onClick={() => setActiveTab('translate')}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[11.5px] font-bold uppercase tracking-wider text-left transition-all ${
                  activeTab === 'translate'
                    ? 'bg-amber-400 text-neutral-950 shadow-sm font-black'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                }`}
              >
                <Languages className="w-4 h-4 shrink-0" />
                <span>Live Translator</span>
              </button>

              <button
                id="pc-tab-sync"
                onClick={() => setActiveTab('sync')}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[11.5px] font-bold uppercase tracking-wider text-left transition-all ${
                  activeTab === 'sync'
                    ? 'bg-amber-400 text-neutral-950 shadow-sm font-black'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                }`}
              >
                <Layers className="w-4 h-4 shrink-0" />
                <span>Multi-Device Sync</span>
              </button>

              <button
                id="pc-tab-creator"
                onClick={() => setActiveTab('creator')}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[11.5px] font-bold uppercase tracking-wider text-left transition-all ${
                  activeTab === 'creator'
                    ? 'bg-amber-400 text-neutral-950 shadow-sm font-black'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                }`}
              >
                <Heart className="w-4 h-4 shrink-0" />
                <span>Creator's Message</span>
              </button>
            </div>

            {/* Quick stats indicators */}
            <div className="bg-neutral-900/40 border border-neutral-800/60 p-4 rounded-3xl flex flex-col gap-3">
              <span className="text-[9.5px] font-extrabold text-neutral-400 uppercase tracking-wider">
                Practice Insights
              </span>
              <div className="flex items-center justify-between border-b border-neutral-900/40 pb-2">
                <span className="text-xs text-neutral-400 font-medium">Practice Deck size:</span>
                <span className="text-xs font-mono font-bold text-neutral-200">{savedWords.length} words</span>
              </div>
              <div className="flex items-center justify-between border-b border-neutral-900/40 pb-2">
                <span className="text-xs text-neutral-400 font-medium">Terms Mastered:</span>
                <span className="text-xs font-mono font-bold text-neutral-200">{masteredWords.length} terms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400 font-medium font-sans">Active Day streak:</span>
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                  🔥 {streak} days live
                </span>
              </div>
            </div>



          </aside>

          {/* Right Side native dashboard workspace panel (8 columns) */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-9 flex flex-col gap-6 w-full pb-24 lg:pb-0 lg:h-full lg:max-h-full lg:overflow-y-auto lg:pr-2">
            
            {/* Main Application active page view frame (Sized properly for PC views) */}
            <div className="bg-neutral-900/30 border border-neutral-900/90 rounded-[28px] p-6 lg:min-h-[520px] min-h-[300px] flex flex-col justify-stretch">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12, scale: 0.995 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.995 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="w-full h-full flex-1 flex flex-col"
                >
                  {activeTab === 'home' && (
                    <HomeView
                      currentWord={currentWord}
                      isLoadingNewWord={isLoadingNewWord}
                      onRefreshWord={handleRefreshWordByGemini}
                      onSearchWord={handleSearchWord}
                      isSaved={isSaved}
                      onSaveToggle={handleSaveToggle}
                      streak={streak}
                      onMarkChecked={handleMarkChecked}
                      isCheckedToday={isCheckedToday}
                      showToast={showToast}
                      searchFeedback={searchFeedback}
                      onClearSearchFeedback={() => setSearchFeedback(null)}
                    />
                  )}

                  {activeTab === 'deck' && (
                    <DeckView
                      savedWords={savedWords}
                      onRemoveWord={handleRemoveWord}
                      masteredWords={masteredWords}
                      onToggleMastered={handleToggleMastered}
                      showToast={showToast}
                    />
                  )}

                  {activeTab === 'sync' && (
                    <SyncView
                      user={user}
                      onCloudSave={handleUserDeckSave}
                      isSyncing={isSyncing}
                    />
                  )}

                  {activeTab === 'translate' && (
                    <TranslateView showToast={showToast} />
                  )}

                  {activeTab === 'creator' && (
                    <div className="max-w-xl mx-auto py-2 w-full">
                      <DeveloperNote />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

          </div>

        </main>
      )}

      {/* Humble Footer */}
      <footer className="mt-8 mb-24 lg:mb-0 border-t border-neutral-900 pt-4 text-center text-[11px] text-neutral-500 w-full max-w-[1440px] shrink-0">
        Bengali Vocab Builder "Shabdik" • Built with Gemini 3.5 & React 19 • Designed for effortless learning
      </footer>

    </div>
  );
}

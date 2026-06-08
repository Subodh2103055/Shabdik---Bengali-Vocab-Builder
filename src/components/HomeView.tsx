import React, { useState, useMemo } from 'react';
import { Volume2, Bookmark, Check, RefreshCw, BookOpen, Star, HelpCircle, Award, Flame, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Word, Difficulty } from '../types';
import LinguisticLoader from './LinguisticLoader';
import { speakText } from '../lib/tts';

interface HomeViewProps {
  currentWord: Word;
  isLoadingNewWord: boolean;
  onRefreshWord: (difficulty: Difficulty) => void;
  onSearchWord: (word: string) => void;
  isSaved: boolean;
  onSaveToggle: () => void;
  streak: number;
  onMarkChecked: () => void;
  isCheckedToday: boolean;
  showToast?: (msg: string) => void;
  searchFeedback?: {
    error?: string;
    suggestion?: string;
    searchedQuery?: string;
  } | null;
  onClearSearchFeedback?: () => void;
}

export default function HomeView({
  currentWord,
  isLoadingNewWord,
  onRefreshWord,
  onSearchWord,
  isSaved,
  onSaveToggle,
  streak,
  onMarkChecked,
  isCheckedToday,
  showToast,
  searchFeedback,
  onClearSearchFeedback
}: HomeViewProps) {
  const [activeTab, setActiveTab] = useState<'meaning' | 'context' | 'synonyms'>('meaning');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('intermediate');
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [quizStatus, setQuizStatus] = useState<'unanswered' | 'correct' | 'wrong'>('unanswered');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearchWord(searchQuery.trim());
      setQuizAnswer(null);
      setQuizStatus('unanswered');
    }
  };

  // Trigger client-side synthesis voice
  const speakWord = () => {
    const success = speakText(currentWord.word, {
      lang: 'en-US',
      rate: 0.8,
      onStart: () => {
        if (showToast) showToast(`Pronouncing: "${currentWord.word}"`);
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

  // Shuffled and memoized quiz generator based on the active word to prevent correct answers staying at index 0 or flashing on re-render
  const quizOptions = useMemo(() => {
    const rawOptions = [
      { text: currentWord.bengaliMeaning.split(',')[0].trim(), isCorrect: true },
      { text: "অসতর্ক বা অবহেলিত", isCorrect: false },
      { text: "সহজ ও সাধারণ বস্তু", isCorrect: false },
      { text: "ক্ষতিকর ও স্বার্থপর", isCorrect: false }
    ];
    // Shuffle the options using a simple random sort
    return [...rawOptions].sort(() => Math.random() - 0.5);
  }, [currentWord.word]);

  const handleQuizAnswer = (option: { text: string; isCorrect: boolean }) => {
    if (quizAnswer) return; // already answered
    setQuizAnswer(option.text);
    if (option.isCorrect) {
      setQuizStatus('correct');
      onMarkChecked(); // Completes streak for today
    } else {
      setQuizStatus('wrong');
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-6 animate-fade-in" id="home-view-canvas">
      
      {/* Dynamic Streak Ring & Today Check-In */}
      <div className="flex items-center justify-between bg-neutral-950/40 border border-neutral-800/50 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-inner">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] text-neutral-400 font-medium tracking-wide uppercase">Streak Metric</div>
            <div className="text-sm font-bold text-neutral-100 flex items-center gap-1.5 leading-none">
              {streak} Days Active
            </div>
          </div>
        </div>

        {isCheckedToday ? (
          <span className="text-[11px] bg-emerald-500/10 text-emerald-400 font-semibold px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Checked Today
          </span>
        ) : (
          <button
            onClick={onMarkChecked}
            className="text-[11px] bg-amber-400 text-neutral-950 hover:bg-amber-300 font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Check Today
          </button>
        )}
      </div>

      {/* Dynamic Word Search Option */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 bg-neutral-950/20 p-1.5 rounded-2xl border border-neutral-900/60 shadow-sm">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            placeholder="Search any word (e.g., quintessential)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoadingNewWord}
            className="w-full bg-neutral-900 border border-neutral-800/60 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 outline-none transition-all"
            id="input-vocab-search"
          />
        </div>
        <button
          type="submit"
          disabled={isLoadingNewWord || !searchQuery.trim()}
          className="bg-amber-400/10 hover:bg-amber-400 border border-amber-400/20 hover:border-amber-400 text-amber-400 hover:text-neutral-950 disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0"
          id="btn-vocab-search"
        >
          {isLoadingNewWord ? "..." : "Search"}
        </button>
      </form>

      {/* Main Vocabulary Card */}
      <div className="relative bg-neutral-950/60 border border-neutral-800/80 rounded-[28px] overflow-hidden p-5 flex flex-col shadow-xl">
        <AnimatePresence mode="wait">
          {isLoadingNewWord ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex items-center justify-center"
            >
              <LinguisticLoader />
            </motion.div>
          ) : searchFeedback ? (
            <motion.div
              key="search-feedback"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col py-6 text-center items-center justify-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
                <HelpCircle className="w-6 h-6 animate-bounce" />
              </div>
              <h3 className="text-sm font-black text-neutral-100 tracking-tight">Word Not Recognized</h3>
              <p className="text-xs text-neutral-400 mt-2 max-w-xs leading-relaxed">
                {searchFeedback.error}
              </p>

              {searchFeedback.suggestion && (
                <div className="mt-4 p-4 bg-amber-400/5 border border-amber-400/10 rounded-2xl w-full max-w-xs">
                  <span className="text-[9px] text-amber-400 uppercase font-bold tracking-widest block font-sans">Did you mean?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onSearchWord(searchFeedback.suggestion!);
                      setSearchQuery(searchFeedback.suggestion!);
                    }}
                    className="text-sm font-black text-amber-300 hover:text-amber-200 mt-1 hover:underline cursor-pointer transition-all"
                  >
                    "{searchFeedback.suggestion}"
                  </button>
                  <p className="text-[10px] text-neutral-500 mt-1.5 leading-snug">Click the suggested word to fetch its definition instantly.</p>
                </div>
              )}

              <button
                type="button"
                onClick={onClearSearchFeedback}
                className="mt-6 text-[11px] text-neutral-450 hover:text-neutral-200 font-bold border border-neutral-850 hover:border-neutral-800 bg-neutral-900/40 px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Go Back to "{currentWord.word}"
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="word-content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col"
            >
              {/* Card Meta Row */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] bg-amber-400/10 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-400/20 uppercase tracking-wide">
                  {currentWord.partOfSpeech}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                    currentWord.difficulty === 'basic' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : currentWord.difficulty === 'advanced' 
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                        : currentWord.difficulty === 'ielts'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : currentWord.difficulty === 'gre'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                  }`}>
                    {currentWord.difficulty}
                  </span>

                  <button
                    onClick={onSaveToggle}
                    className={`p-1.5 rounded-full border transition-all ${
                      isSaved 
                        ? 'bg-amber-400 border-amber-400 text-neutral-950' 
                        : 'border-neutral-800 hover:bg-neutral-800/50 text-neutral-400'
                    }`}
                    title={isSaved ? "Saved" : "Save Word"}
                  >
                    <Bookmark className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>

              {/* Word & Pronunciation */}
              <div className="mb-2">
                <h2 className="text-3xl font-extrabold text-neutral-50 tracking-tight font-sans">
                  {currentWord.word}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs text-neutral-400 tracking-wider">
                    {currentWord.ipa}
                  </span>
                  <button
                    onClick={speakWord}
                    className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-amber-400 transition-all shadow-sm"
                    title="Pronounce IPA Voice"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Bengali Primary Meaning */}
              <div className="my-3 py-2 border-y border-neutral-800/50">
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Bengali Meaning</div>
                <div className="text-lg font-bold text-neutral-200 mt-0.5">
                  {currentWord.bengaliMeaning}
                </div>
              </div>

              {/* Tabs selector */}
              <div className="flex border-b border-neutral-800/40 my-3">
                {(['meaning', 'context', 'synonyms'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 pb-2 text-[11px] font-bold uppercase tracking-wider text-center transition-all border-b-2 ${
                      activeTab === tab 
                        ? 'border-amber-400 text-amber-400 font-extrabold' 
                        : 'border-transparent text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {tab === 'meaning' ? 'Meaning' : tab === 'context' ? 'Usage context' : 'Synonyms'}
                  </button>
                ))}
              </div>

              {/* Dynamic Content display */}
              <div className="min-h-[110px] py-1">
                {activeTab === 'meaning' && (
                  <div className="flex flex-col gap-2">
                    <div>
                      <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wide block">In Simple Words</span>
                      <p className="text-xs text-neutral-300 leading-relaxed mt-0.5">
                        {currentWord.definition}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wide block">বাংলা ব্যাখ্যা</span>
                      <p className="text-xs text-neutral-400 leading-relaxed mt-0.5">
                        {currentWord.definitionBengali}
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'context' && (
                  <div className="flex flex-col gap-2">
                    <div>
                      <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wide block">English Context</span>
                      <p className="text-xs italic text-neutral-200 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800/40 mt-1 leading-relaxed">
                        "{currentWord.exampleSentence}"
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wide block">অনুবাদ</span>
                      <p className="text-xs text-neutral-400 leading-relaxed mt-0.5">
                        "{currentWord.exampleSentenceBengali}"
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'synonyms' && (
                  <div>
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wide block mb-2">Simulating Equivalents</span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentWord.synonyms.map((syn, index) => (
                        <span 
                          key={index} 
                          className="text-[11px] bg-neutral-900 border border-neutral-800/80 px-2.5 py-1 rounded-lg text-neutral-300 font-medium"
                        >
                          {syn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dynamic Word Refresh Setup (Uses Gemini) */}
      <div className="bg-neutral-950/20 border border-neutral-800/50 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" /> Need Another Word?
          </span>
          <span className="text-[9px] bg-neutral-800 text-neutral-400 font-mono px-1.5 py-0.5 rounded">
            Uses Gemini 3.5
          </span>
        </div>

        {/* Difficulty Pill Selection */}
        <div className="flex flex-wrap gap-1 bg-neutral-900/60 p-1 rounded-xl border border-neutral-800/45">
          {(['basic', 'intermediate', 'advanced', 'ielts', 'gre'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`flex-1 min-w-[72px] py-1.5 outline-none rounded-lg text-[9px] uppercase font-extrabold tracking-wider text-center transition-all ${
                selectedDifficulty === diff
                  ? 'bg-amber-400 text-neutral-950 shadow-sm font-black'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/30'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>

        <button
          id="btn-refresh-word"
          onClick={() => {
            onRefreshWord(selectedDifficulty);
            setQuizAnswer(null);
            setQuizStatus('unanswered');
          }}
          disabled={isLoadingNewWord}
          className="w-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-[11px] font-extrabold uppercase tracking-widest text-amber-400 hover:text-amber-300 border border-neutral-700/60 py-2.5 rounded-xl transition-all"
        >
          {isLoadingNewWord ? "Consulting Engine..." : "🔄 Generate Different Word"}
        </button>
      </div>

      {/* Daily Vocabulary Interactive Challenge */}
      <div className="bg-neutral-950/40 border border-neutral-800/50 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-extrabold uppercase text-neutral-200 tracking-wider">
            Daily Mastery Check
          </h3>
        </div>
        
        <p className="text-[11px] text-neutral-400 leading-relaxed">
          Select the correct Bengali translation for <strong className="text-neutral-200">"{currentWord.word}"</strong> to secure your streak increment for today:
        </p>

        <div className="flex flex-col gap-2 mt-1">
          {quizOptions.map((opt, index) => {
            const isSelected = quizAnswer === opt.text;
            let btnClass = "bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300";
            if (quizAnswer) {
              if (opt.isCorrect) {
                btnClass = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold";
              } else if (isSelected) {
                btnClass = "bg-rose-500/10 border-rose-500/30 text-rose-400 font-semibold";
              } else {
                btnClass = "bg-neutral-900/40 border-neutral-800/20 text-neutral-500 opacity-50";
              }
            }

            return (
              <button
                key={index}
                disabled={quizAnswer !== null}
                onClick={() => handleQuizAnswer(opt)}
                className={`w-full text-left p-2.5 rounded-xl border text-xs tracking-medium transition-all flex items-center justify-between ${btnClass}`}
              >
                <span>{opt.text}</span>
                {quizAnswer && opt.isCorrect && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            );
          })}
        </div>

        {quizStatus === 'correct' && (
          <p className="text-[10px] text-emerald-400 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10 text-center font-medium">
            🎯 Awesome work! Real translation selected. Your daily streak has updated!
          </p>
        )}
        {quizStatus === 'wrong' && (
          <p className="text-[10px] text-rose-400 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10 text-center font-medium">
            ❌ That was incorrect, please review the word card details above!
          </p>
        )}
      </div>



    </div>
  );
}

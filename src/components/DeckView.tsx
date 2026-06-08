import React, { useState } from 'react';
import { Search, Star, Trash2, ArrowLeftRight, Volume2, HelpCircle, Layers, CheckCircle2, ChevronLeft, ChevronRight, BookOpen, Award, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Word, Difficulty } from '../types';
import { speakText } from '../lib/tts';

interface DeckViewProps {
  savedWords: Word[];
  onRemoveWord: (word: string) => void;
  masteredWords: string[]; // List of word strings that are mastered
  onToggleMastered: (word: string) => void;
  showToast?: (msg: string) => void;
}

export default function DeckView({
  savedWords,
  onRemoveWord,
  masteredWords,
  onToggleMastered,
  showToast
}: DeckViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [activeMode, setActiveMode] = useState<'list' | 'flashcards'>('list');
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [deckType, setDeckType] = useState<'all' | 'learning' | 'mastered'>('all');

  // Play pronunciation synthesized on demand
  const playPronunciation = (txt: string) => {
    const success = speakText(txt, {
      lang: 'en-US',
      rate: 0.8,
      onStart: () => {
        if (showToast) showToast(`Pronouncing: "${txt}"`);
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

  // Categorize based on Deck Type (All, Active Learning, or Mastered)
  const categoryWords = savedWords.filter((w) => {
    const isMastered = masteredWords.includes(w.word) || masteredWords.some(m => m.toLowerCase() === w.word.toLowerCase());
    if (deckType === 'learning') return !isMastered;
    if (deckType === 'mastered') return isMastered;
    return true;
  });

  // Filter categorized words based on search + difficulty
  const filteredWords = categoryWords.filter((w) => {
    const matchesSearch = w.word.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          w.bengaliMeaning.includes(searchQuery);
    const matchesDiff = difficultyFilter === "all" || w.difficulty === difficultyFilter;
    return matchesSearch && matchesDiff;
  });

  const nextFlashcard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentFlashcardIndex((prev) => (prev + 1) % filteredWords.length);
    }, 150);
  };

  const prevFlashcard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentFlashcardIndex((prev) => (prev - 1 + filteredWords.length) % filteredWords.length);
    }, 150);
  };

  return (
    <div className="flex flex-col gap-4 pb-6 animate-fade-in" id="deck-view">
      
      {/* Search Header and Mode selectors */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-neutral-200">
            My Practice Deck
          </h2>
          <div className="flex bg-neutral-950/60 p-0.5 rounded-xl border border-neutral-800">
            <button
              onClick={() => setActiveMode('list')}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                activeMode === 'list' 
                  ? 'bg-amber-400 text-neutral-950' 
                  : 'text-neutral-400'
              }`}
            >
              List
            </button>
            <button
              onClick={() => {
                setActiveMode('flashcards');
                setIsFlipped(false);
                setCurrentFlashcardIndex(0);
              }}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                activeMode === 'flashcards' 
                  ? 'bg-amber-400 text-neutral-950' 
                  : 'text-neutral-400'
              }`}
              disabled={savedWords.length === 0}
            >
              Flashcards
            </button>
          </div>
        </div>

        {/* Deck Category Segmented Selection Cards */}
        <div className="grid grid-cols-3 gap-2 bg-neutral-950/40 p-1.5 rounded-2xl border border-neutral-900/60 shadow-sm mt-1" id="deck-segment-tabs">
          <button
            onClick={() => {
              setDeckType('all');
              setIsFlipped(false);
              setCurrentFlashcardIndex(0);
            }}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all text-center cursor-pointer ${
              deckType === 'all'
                ? 'bg-neutral-900/80 border-neutral-800 text-neutral-100 shadow-sm'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span className="text-[9px] uppercase font-bold tracking-wider">All Saved</span>
            <span className="text-sm font-black font-mono mt-0.5 text-neutral-200">{savedWords.length}</span>
          </button>

          <button
            onClick={() => {
              setDeckType('learning');
              setIsFlipped(false);
              setCurrentFlashcardIndex(0);
            }}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all text-center cursor-pointer ${
              deckType === 'learning'
                ? 'bg-neutral-900/80 border-neutral-800 text-amber-400 shadow-sm'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span className="text-[9px] uppercase font-bold tracking-wider">Active</span>
            <span className="text-sm font-black font-mono mt-0.5 text-amber-400">
              {savedWords.filter(w => !masteredWords.some(m => m.toLowerCase() === w.word.toLowerCase())).length}
            </span>
          </button>

          <button
            onClick={() => {
              setDeckType('mastered');
              setIsFlipped(false);
              setCurrentFlashcardIndex(0);
            }}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all text-center cursor-pointer ${
              deckType === 'mastered'
                ? 'bg-neutral-900/80 border-emerald-950/40 text-emerald-400 shadow-sm font-bold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 font-normal'
            }`}
          >
            <span className="text-[9px] uppercase font-bold tracking-wider">Mastered</span>
            <span className="text-sm font-black font-mono mt-0.5 text-emerald-400">
              {savedWords.filter(w => masteredWords.some(m => m.toLowerCase() === w.word.toLowerCase())).length}
            </span>
          </button>
        </div>

        {activeMode === 'list' && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search word or Bengali meaning..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-850 py-2 pl-9 pr-4 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-400/50"
              />
            </div>
            
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="bg-neutral-950 border border-neutral-850 px-2.5 py-2 rounded-xl text-xs text-neutral-300 focus:outline-none"
            >
              <option value="all">All Difficulty</option>
              <option value="basic">Basic</option>
              <option value="intermediate">Medium</option>
              <option value="advanced">Advanced</option>
              <option value="ielts">IELTS Enrichment</option>
              <option value="gre">GRE Advanced</option>
            </select>
          </div>
        )}
      </div>

      {savedWords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-neutral-800 rounded-2xl gap-3 animate-fade-in">
          <BookOpen className="w-8 h-8 text-neutral-500" />
          <div>
            <h4 className="text-xs font-bold text-neutral-300">Your custom learning deck is empty</h4>
            <p className="text-[10px] text-neutral-400 mt-1 max-w-[200px] leading-relaxed mx-auto">
              Save vocab words from the Daily Word suggestions tab to manage your periodic review cards!
            </p>
          </div>
        </div>
      ) : deckType === 'mastered' && categoryWords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-emerald-900/40 bg-emerald-950/10 rounded-2xl gap-3 animate-fade-in" id="empty-mastered-state">
          <Award className="w-8 h-8 text-emerald-400 animate-bounce" />
          <div className="max-w-[245px] mx-auto">
            <h4 className="text-xs font-extrabold text-neutral-200">No Mastered Terms Yet!</h4>
            <p className="text-[10px] text-neutral-400 mt-1.5 leading-relaxed">
              When you're comfortable with a saved word, tap the star (<Star className="inline w-3 h-3 fill-amber-400 text-amber-400" />) icon on its card to move it over to your Mastered Deck list!
            </p>
          </div>
        </div>
      ) : deckType === 'learning' && categoryWords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-amber-900/40 bg-neutral-950/20 rounded-2xl gap-3 animate-fade-in" id="empty-learning-state">
          <Sparkles className="w-8 h-8 text-amber-400" />
          <div className="max-w-[245px] mx-auto">
            <h4 className="text-xs font-extrabold text-neutral-200">All saved terms mastered! 🎉</h4>
            <p className="text-[10px] text-neutral-400 mt-1.5 leading-relaxed">
              Incredible work! You have successfully mastered every single word in your saved vocabulary deck.
            </p>
          </div>
        </div>
      ) : activeMode === 'flashcards' ? (
        /* INTERACTIVE 3D FLASHCARD STATIONS */
        filteredWords.length === 0 ? (
          <div className="text-center py-10 text-neutral-400 text-xs">
            No words match the selected difficulty search filter for flashcards.
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="text-[10px] text-neutral-400 font-medium">
              Card {currentFlashcardIndex + 1} of {filteredWords.length}
            </div>

            {/* Core Flashcard visual flip engine */}
            <div 
              onClick={() => setIsFlipped(!isFlipped)}
              className="relative w-full aspect-[4/5] max-h-[300px] bg-transparent cursor-pointer group perspe-1000"
            >
              <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}>
                {/* FRONT FACE (English Word) */}
                <div className="absolute inset-0 w-full h-full rounded-[24px] bg-neutral-950 border-2 border-neutral-800/80 p-5 flex flex-col justify-between backface-hidden shadow-lg">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                      {filteredWords[currentFlashcardIndex].partOfSpeech}
                    </span>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-amber-400">
                      Click to Reveal Meaning
                    </span>
                  </div>

                  <div className="text-center flex flex-col items-center py-4">
                    <h1 className="text-3xl font-extrabold text-neutral-50 tracking-tight">
                      {filteredWords[currentFlashcardIndex].word}
                    </h1>
                    <span className="font-mono text-xs text-neutral-500 mt-1 leading-none">
                      {filteredWords[currentFlashcardIndex].ipa}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-neutral-900">
                    <span className="text-[9px] uppercase font-bold text-neutral-500">
                      Difficulty: {filteredWords[currentFlashcardIndex].difficulty}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        playPronunciation(filteredWords[currentFlashcardIndex].word);
                      }}
                      className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-amber-400"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* BACK FACE (Bengali Meaning & Simple Descriptions) */}
                <div className="absolute inset-0 w-full h-full rounded-[24px] bg-neutral-900 border-2 border-amber-400/30 p-5 flex flex-col justify-between backface-hidden rotate-y-180 shadow-xl overflow-y-auto">
                  <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                    <span className="text-[10px] uppercase font-bold text-amber-400">
                      Translation & Context
                    </span>
                    <span className="text-[9px] text-neutral-500">Click to flip back</span>
                  </div>

                  <div className="flex-1 py-3 flex flex-col justify-center gap-3">
                    <div>
                      <span className="text-[9px] text-neutral-500 font-semibold uppercase block">Bengali Translation</span>
                      <p className="text-base font-bold text-neutral-200">
                        {filteredWords[currentFlashcardIndex].bengaliMeaning}
                      </p>
                    </div>

                    <div>
                      <span className="text-[9px] text-neutral-500 font-semibold uppercase block">English definition</span>
                      <p className="text-[11px] text-neutral-300 leading-relaxed">
                        {filteredWords[currentFlashcardIndex].definition}
                      </p>
                    </div>

                    <div>
                      <span className="text-[9px] text-neutral-500 font-semibold uppercase block">Usage sentence</span>
                      <p className="text-[11px] italic text-neutral-300 leading-relaxed">
                        "{filteredWords[currentFlashcardIndex].exampleSentence}"
                      </p>
                    </div>
                  </div>

                  <div className="text-[9px] text-neutral-500 border-t border-neutral-850 pt-1 text-center">
                    Tap anywhere on the card to flip
                  </div>
                </div>
              </div>
            </div>

            {/* Flashcard navigation arrows */}
            <div className="flex gap-4 w-full">
              <button
                onClick={prevFlashcard}
                className="flex-1 bg-neutral-900 hover:bg-neutral-800 py-2.5 rounded-xl border border-neutral-800 text-xs text-neutral-200 font-semibold flex items-center justify-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back Card
              </button>
              <button
                onClick={nextFlashcard}
                className="flex-1 bg-neutral-900 hover:bg-neutral-800 py-2.5 rounded-xl border border-neutral-800 text-xs text-neutral-200 font-semibold flex items-center justify-center gap-1"
              >
                Next Card <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )
      ) : (
        /* STANDARD DICTIONARY LIST DISPLAY */
        <div className="flex flex-col gap-2.5">
          {filteredWords.length === 0 ? (
            <div className="text-center py-10 text-neutral-500 text-xs">
              No vocabulary cards matched your query parameter.
            </div>
          ) : (
            filteredWords.map((word) => {
              const isMastered = masteredWords.includes(word.word) || masteredWords.some(m => m.toLowerCase() === word.word.toLowerCase());
              return (
                <div
                  key={word.word}
                  className="bg-neutral-950/55 border border-neutral-850/80 hover:border-neutral-800/80 p-3.5 rounded-xl flex flex-col gap-2 transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-extrabold text-neutral-50">{word.word}</span>
                        <button
                          onClick={() => playPronunciation(word.word)}
                          className="p-1 rounded bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 text-amber-400 hover:text-amber-300 transition-all shadow-sm flex items-center justify-center cursor-pointer"
                          title="Hear Pronunciation"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                        <span className="text-[9px] font-mono text-neutral-400">{word.ipa}</span>
                        <span className="text-[8px] uppercase font-bold text-neutral-500 bg-neutral-900/60 px-1.5 py-0.2 rounded">
                          {word.partOfSpeech}
                        </span>
                        <span className={`text-[8.5px] uppercase font-bold px-1.5 py-0.2 rounded ${
                          word.difficulty === 'basic' 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : word.difficulty === 'advanced' 
                              ? 'bg-purple-500/10 text-purple-400' 
                              : word.difficulty === 'ielts'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10'
                                : word.difficulty === 'gre'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10'
                                  : 'bg-orange-500/10 text-orange-400'
                        }`}>
                          {word.difficulty}
                        </span>
                      </div>
                      <span className="text-[12px] font-bold text-neutral-300 block mt-0.5">
                        {word.bengaliMeaning}
                      </span>
                    </div>

                    {/* Collection items controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onToggleMastered(word.word)}
                        className={`p-1.5 rounded-lg transition-all ${
                          isMastered 
                            ? 'text-yellow-500 bg-yellow-500/10' 
                            : 'text-neutral-500 hover:text-neutral-200 bg-neutral-900/40'
                        }`}
                        title={isMastered ? "Mastered" : "Mark as Learning"}
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </button>

                      <button
                        onClick={() => onRemoveWord(word.word)}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all bg-neutral-900/40"
                        title="Remove word"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Accordion detail snippet */}
                  <div className="bg-neutral-900/40 p-2.5 rounded-lg border border-neutral-850 text-[10px] leading-relaxed text-neutral-400">
                    <p className="mb-1 text-neutral-300">
                      <strong>Def: </strong>{word.definition}
                    </p>
                    <p className="italic text-[9.5px]">
                      <strong>Eg: </strong>"{word.exampleSentence}"
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

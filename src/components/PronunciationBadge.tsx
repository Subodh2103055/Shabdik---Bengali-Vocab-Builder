import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { getPronunciationGuide } from '../lib/pronunciation';
import { speakText } from '../lib/tts';

interface PronunciationBadgeProps {
  word: string;
  ipa: string;
  size?: 'normal' | 'compact' | 'flashcard';
  showAudioButton?: boolean;
  className?: string;
}

export default function PronunciationBadge({
  word,
  ipa,
  size = 'normal',
  showAudioButton = true,
  className = ''
}: PronunciationBadgeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const guide = getPronunciationGuide(word, ipa);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) return;
    setIsPlaying(true);
    speakText(word, {
      onEnd: () => {
        setIsPlaying(false);
      }
    });
    // Auto-reset state in case speech ends without callback
    setTimeout(() => setIsPlaying(false), 2500);
  };

  if (size === 'compact') {
    return (
      <div className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
        {showAudioButton && (
          <button
            type="button"
            onClick={handleSpeak}
            className="p-1 rounded-lg bg-neutral-850 hover:bg-neutral-800 border border-neutral-750 text-amber-400 hover:text-amber-300 transition-all shadow-sm flex items-center justify-center cursor-pointer active:scale-95"
            title="Hear native pronunciation"
          >
            <Volume2 className={`w-3 h-3 ${isPlaying ? 'animate-pulse text-amber-300' : ''}`} />
          </button>
        )}

        {/* Bengali phonetic pronunciation */}
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[11px] font-bold font-sans">
          <span>{guide.bengaliPhonetic}</span>
        </span>

        {guide.respelling && (
          <span className="text-[10px] font-sans font-medium text-neutral-300 bg-neutral-900/90 border border-neutral-750 px-1.5 py-0.5 rounded-md tracking-wider">
            SAY: {guide.respelling}
          </span>
        )}
      </div>
    );
  }

  if (size === 'flashcard') {
    return (
      <div className={`flex flex-col items-center gap-2 mt-2 ${className}`}>
        {/* Bengali pronunciation and English respelling */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400/15 border border-amber-400/30 text-neutral-100 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-sans">উচ্চারণ:</span>
            <span className="text-sm font-extrabold text-neutral-100 tracking-wide font-sans">
              {guide.bengaliPhonetic}
            </span>
          </div>

          {guide.respelling && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-neutral-900 border border-neutral-700/80 text-neutral-200 text-xs font-bold shadow-sm">
              <span className="text-[9.5px] uppercase font-bold text-neutral-400">SAY:</span>
              <span className="text-neutral-100 tracking-wider font-sans">{guide.respelling}</span>
            </div>
          )}

          {showAudioButton && (
            <button
              type="button"
              onClick={handleSpeak}
              className="p-1.5 rounded-xl bg-amber-400/15 hover:bg-amber-400 border border-amber-400/30 hover:border-amber-400 text-amber-300 hover:text-neutral-950 transition-all cursor-pointer shadow-sm active:scale-95 flex items-center gap-1 px-2 text-xs font-bold"
              title="Pronounce Word"
            >
              <Volume2 className={`w-3.5 h-3.5 ${isPlaying ? 'animate-pulse' : ''}`} />
              <span className="text-[11px]">শুনুন</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Full / Normal Size (Used on Homepage Main Word Card)
  return (
    <div className={`flex flex-wrap items-center gap-2 mt-2 ${className}`}>
      {/* 1. Primary Bengali Pronunciation Badge (উচ্চারণ) */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/15 border border-amber-400/30 text-neutral-100 shadow-sm backdrop-blur-sm">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 font-sans">
          উচ্চারণ:
        </span>
        <span className="text-sm font-extrabold text-neutral-50 tracking-wide font-sans">
          {guide.bengaliPhonetic}
        </span>
      </div>

      {/* 2. English Phonetic Syllables (SAY: ...) */}
      {guide.respelling && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700/80 text-neutral-200 text-xs font-bold shadow-sm">
          <span className="text-[9.5px] uppercase font-bold text-neutral-400 font-sans">
            SAY:
          </span>
          <span className="text-neutral-100 tracking-wider font-sans">
            {guide.respelling}
          </span>
        </div>
      )}

      {/* 3. Listen / Audio Button */}
      {showAudioButton && (
        <button
          type="button"
          onClick={handleSpeak}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-850 hover:bg-amber-400 border border-neutral-750 hover:border-amber-400 text-amber-300 hover:text-neutral-950 font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95 group ml-auto sm:ml-0"
          title="Listen to crystal clear voice pronunciation"
        >
          <Volume2 className={`w-3.5 h-3.5 text-amber-400 group-hover:text-neutral-950 transition-colors ${isPlaying ? 'animate-pulse' : ''}`} />
          <span className="text-[11px] font-bold font-sans">
            {isPlaying ? 'Playing...' : 'Listen / শুনুন'}
          </span>
        </button>
      )}
    </div>
  );
}

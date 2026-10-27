import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { speakText } from '../lib/tts';

interface PronunciationBadgeProps {
  word: string;
  ipa?: string;
  size?: 'normal' | 'compact' | 'flashcard';
  showAudioButton?: boolean;
  className?: string;
}

export default function PronunciationBadge({
  word,
  size = 'normal',
  showAudioButton = true,
  className = ''
}: PronunciationBadgeProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) return;
    setIsPlaying(true);
    speakText(word, {
      onEnd: () => {
        setIsPlaying(false);
      }
    });
    setTimeout(() => setIsPlaying(false), 2500);
  };

  if (!showAudioButton) {
    return null;
  }

  if (size === 'compact') {
    return (
      <button
        type="button"
        onClick={handleSpeak}
        className={`p-1 rounded-lg bg-neutral-850 hover:bg-neutral-800 border border-neutral-750 text-amber-400 hover:text-amber-300 transition-all shadow-sm flex items-center justify-center cursor-pointer active:scale-95 ${className}`}
        title="Hear pronunciation"
      >
        <Volume2 className={`w-3 h-3 ${isPlaying ? 'animate-pulse text-amber-300' : ''}`} />
      </button>
    );
  }

  if (size === 'flashcard') {
    return null;
  }

  // Full / Normal Size (Audio button only, zero pronunciation text)
  return (
    <div className={`inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={handleSpeak}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-850 hover:bg-amber-400 border border-neutral-750 hover:border-amber-400 text-amber-300 hover:text-neutral-950 font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95 group"
        title="Listen to native voice pronunciation"
      >
        <Volume2 className={`w-3.5 h-3.5 text-amber-400 group-hover:text-neutral-950 transition-colors ${isPlaying ? 'animate-pulse' : ''}`} />
        <span className="text-[11px] font-bold font-sans">
          {isPlaying ? 'Playing...' : 'Listen / শুনুন'}
        </span>
      </button>
    </div>
  );
}

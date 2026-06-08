/**
 * Highly robust Web Speech text-to-speech module.
 * Handles async voice-loading on all platforms, chromium pause/resume bugs,
 * and detects sandbox/iframe security blockages with clear user feedback.
 */

let voicesLoaded = false;
let voices: SpeechSynthesisVoice[] = [];

// Global unlocked audio element cached via initial gesture to bypass iframe policies
let unlockedAudio: HTMLAudioElement | null = null;

export const initTTSGestureUnlock = () => {
  if (typeof window === 'undefined' || unlockedAudio) return;
  try {
    unlockedAudio = new Audio();
    // Warm up the instance with a 1-second silent data-uri to register interaction authority
    unlockedAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";
    unlockedAudio.volume = 0.01;
    const playPromise = unlockedAudio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log("TTS audio system successfully pre-unlocked via user gesture.");
      }).catch(err => {
        console.log("TTS audio warming up pending active click/touch authorization:", err);
      });
    }
  } catch (err) {
    console.warn("Pre-unlock gesture warning:", err);
  }
};

// Listen to any touch, click or keydown down on the window viewport to prime the Audio segment
if (typeof window !== 'undefined') {
  const unlocker = () => {
    initTTSGestureUnlock();
    window.removeEventListener('click', unlocker);
    window.removeEventListener('touchstart', unlocker);
    window.removeEventListener('keydown', unlocker);
  };
  window.addEventListener('click', unlocker, { passive: true });
  window.addEventListener('touchstart', unlocker, { passive: true });
  window.addEventListener('keydown', unlocker, { passive: true });
}

const loadVoices = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      voicesLoaded = true;
    }
  }
};

// Initial voice loader
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  // Chrome loads voices asynchronously and fires onvoiceschanged
  window.speechSynthesis.onvoiceschanged = () => {
    loadVoices();
  };
}

interface SpeakOptions {
  lang?: string; // e.g. 'en-US' or 'bn-BD'
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (errorMessage: string, isIframeIssue: boolean) => void;
}

export const speakText = (text: string, options: SpeakOptions = {}): boolean => {
  const targetLang = options.lang || 'en-US';
  const isBengali = targetLang.toLowerCase().startsWith('bn');

  // Load voices just in case
  if (voices.length === 0) {
    loadVoices();
  }

  // Check if a local Bengali voice exists
  let hasLocalBengaliVoice = false;
  if (voices.length > 0) {
    hasLocalBengaliVoice = voices.some(v => 
      v.lang.toLowerCase().startsWith('bn') ||
      v.name.toLowerCase().includes('bengali') ||
      v.name.toLowerCase().includes('bangla')
    );
  }

  // 1. If it's Bengali and no native voice is found, seamlessly play via Google TTS stream
  if (isBengali && !hasLocalBengaliVoice) {
    try {
      if (options.onStart) options.onStart();

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      const fallbackUrl = `/api/tts?lang=bn&text=${encodeURIComponent(text)}`;
      
      // Crucial: Reuse the pre-unlocked user gesture Audio instance to bypass sandboxed iframe restrictions
      const audio = unlockedAudio || new Audio();
      if (!unlockedAudio) {
        unlockedAudio = audio;
      }
      
      audio.src = fallbackUrl;
      audio.volume = 1.0;

      audio.onended = () => {
        if (options.onEnd) options.onEnd();
      };

      audio.onerror = (e) => {
        console.error("Audio streaming error:", e);
        if (options.onError) {
          options.onError("Failed to play Bengali speech. Please try again in a few seconds.", false);
        }
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error("Audio playback blocked, trying fallback:", err);
          
          // Direct Sync Fallback: try direct native instantiation inside current stack frame 
          try {
            const syncAudio = new Audio(fallbackUrl);
            syncAudio.onended = () => {
              if (options.onEnd) options.onEnd();
            };
            syncAudio.onerror = () => {
              if (options.onError) options.onError("Vocal stream failing. Please try again.", false);
            };
            syncAudio.play().catch(() => {
              if (options.onError) {
                options.onError("Audio playback is restricted by your browser's sandbox. Please click 'Open in a new tab' at the top-right corner to play audio pronunciation natively!", true);
              }
            });
          } catch (syncErr) {
            if (options.onError) {
              options.onError("Vocal translation block. Please open the app in a new tab.", true);
            }
          }
        });
      }

      return true;
    } catch (audioErr: any) {
      console.error("Audio initialization error:", audioErr);
      if (options.onError) {
        options.onError("Audio initialization failed. If it persists, please use a browser running on a new tab.", false);
      }
      return false;
    }
  }

  // 2. Otherwise use standard Web Speech API (English remains completely native)
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (options.onError) {
      options.onError('Browser Speech Synthesis is not supported in this environment.', false);
    }
    return false;
  }

  const synth = window.speechSynthesis;

  try {
    // 1. Cancel potential old speaking cues
    synth.cancel();

    // 2. Playback state recovery for chromium stuck paused mode
    if (synth.paused) {
      synth.resume();
    }

    // 3. Create speech queue utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Moderate, precise speed configuration
    utterance.rate = options.rate ?? 0.82;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.lang = targetLang;

    // Retry fetching system voices if they are still unpopulated
    if (voices.length === 0) {
      loadVoices();
    }

    // 4. Search and select optimal voice
    if (voices.length > 0) {
      // Find matching language exactly
      let matchedVoice = voices.find(v => v.lang.toLowerCase() === targetLang.toLowerCase());
      
      const baseLang = targetLang.split('-')[0].toLowerCase();
      
      // Fallback 1: Find any voice matching the base language (e.g. "en" or "bn")
      if (!matchedVoice) {
        matchedVoice = voices.find(v => v.lang.toLowerCase().startsWith(baseLang));
      }

      // Fallback 2: Search vocal names containing language hints
      if (!matchedVoice && baseLang === 'bn') {
        matchedVoice = voices.find(v => 
          v.name.toLowerCase().includes('bengali') || 
          v.name.toLowerCase().includes('bangla')
        );
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
        utterance.lang = matchedVoice.lang;
      }
    }

    // 5. Connect event boundaries
    if (options.onStart) utterance.onstart = options.onStart;
    if (options.onEnd) utterance.onend = options.onEnd;
    
    utterance.onerror = (event: any) => {
      console.warn("Speech synthesis utterance warning:", event);
      
      const errorCode = event.error || '';
      
      // 'interrupted' usually means user cancelled by clicking again (no action needed)
      if (errorCode === 'interrupted') return;

      // 'not-allowed' or 'network' inside sandboxed preview iframes
      const isIframeIssue = (
        errorCode === 'not-allowed' || 
        errorCode === 'security' ||
        window.self !== window.top
      );

      if (options.onError) {
        let msg = `Playback error: ${errorCode || 'Unavailable'}.`;
        if (isIframeIssue) {
          msg = "Voice playback is blocked by your browser's security policy inside this iframe. Please click 'Open in a new tab' at the the top-right corner of the app screen to play live voice audio!";
        }
        options.onError(msg, isIframeIssue);
      }
    };

    // 6. Speak (a minor timeout lets previous cancels discharge fully)
    setTimeout(() => {
      synth.speak(utterance);
    }, 50);

    return true;
  } catch (error: any) {
    console.error("Speak process failed:", error);
    if (options.onError) {
      options.onError(error.message || "Failed to trigger Web Speech API.", window.self !== window.top);
    }
    return false;
  }
};

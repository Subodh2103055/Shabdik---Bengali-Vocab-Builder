import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const MESSAGES = [
  {
    title: "Consulting Gemini AI 🧠",
    subtitle: "Searching the neural dictionary for premium vocab alignment...",
    bengali: "অভিধানের গভীর থেকে নিখুঁত শব্দটি খুঁজে আনা হচ্ছে..."
  },
  {
    title: "Linguistic Alchemy ✨",
    subtitle: '"A different language is a different vision of life." — Federico Fellini',
    bengali: "একটি ভিন্ন ভাষা হলো জীবনের এক অনন্য নতুন দৃষ্টিভঙ্গি।"
  },
  {
    title: "Phonetic Harmonization 🔊",
    subtitle: "Aligning rigorous IPA codes with localized speech rates...",
    bengali: "আইপিএ ট্রান্সক্রিপশন ও অডিও ফ্রিকোয়েন্সি মেলানো হচ্ছে..."
  },
  {
    title: "Context Generation ✒️",
    subtitle: '"Words are, of course, the most powerful drug used by mankind." — Rudyard Kipling',
    bengali: "শব্দ হলো শব্দালঙ্কার ও মানুষের বুদ্ধিমত্তার সবচেয়ে শক্তিশালী প্রতীক।"
  },
  {
    title: "Semantic Mapping 🗺️",
    subtitle: "Translating sophisticated English descriptors into daily Bengali...",
    bengali: "ইংরেজি পদের সাধারণ ও নিগূঢ় বাংলা ভাবার্থ সমন্বয় করা হচ্ছে..."
  },
  {
    title: "Linguistic Expansion 🚀",
    subtitle: '"The limits of my language mean the limits of my world." — Ludwig Wittgenstein',
    bengali: "আমার ভাষার সীমাবদ্ধতাই যেন আমার সমগ্র পৃথিবীর সীমারেখা।"
  },
  {
    title: "Weaving Synonyms 🧠",
    subtitle: "Mapping equivalent word relationships to maximize your mental deck...",
    bengali: "সমার্থক শব্দসমূহের মধ্যকার সূক্ষ্মার্থের যোগসূত্র খোঁজা হচ্ছে..."
  }
];

export default function LinguisticLoader() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % MESSAGES.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const currentMessage = MESSAGES[index];

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-6 min-h-[320px] px-4 select-none" id="linguistic-interactive-loader">
      
      {/* Immersive Rotating Cosmic Light */}
      <div className="relative flex items-center justify-center w-16 h-16">
        {/* Glow halo */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-500/10 animate-spin blur-[8px] opacity-40"></div>
        {/* Rotating border rings */}
        <div className="absolute inset-0 rounded-full border-2 border-neutral-800 border-t-amber-400 animate-spin" style={{ animationDuration: '1.2s' }}></div>
        <div className="absolute inset-1.5 rounded-full border border-dashed border-neutral-700 border-b-amber-300/80 animate-spin" style={{ animationDuration: '2.5s', animationDirection: 'reverse' }}></div>
        {/* Central pulsing core */}
        <div className="absolute inset-4 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
        </div>
      </div>

      {/* Slide/Fade animation cycle */}
      <div className="min-h-[140px] flex flex-col items-center justify-center max-w-[280px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="flex flex-col gap-2.5 items-center"
          >
            {/* Loading Stage Title */}
            <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase bg-amber-400/5 border border-amber-400/20 px-2.5 py-1 rounded-full">
              {currentMessage.title}
            </span>

            {/* Subtitle Quotes */}
            <p className="text-xs text-neutral-100 font-medium tracking-tight mt-1 leading-relaxed">
              {currentMessage.subtitle}
            </p>

            {/* Localized Bengali text */}
            <p className="text-[11px] text-neutral-400 italic leading-relaxed">
              {currentMessage.bengali}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Decorative indicator dots */}
      <div className="flex gap-1.5 mt-2">
        {MESSAGES.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === i ? 'w-4 bg-amber-400' : 'w-1.5 bg-neutral-800'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

import React from 'react';
import { Heart, Quote, Sparkles } from 'lucide-react';

export default function DeveloperNote() {
  return (
    <div 
      className="relative bg-gradient-to-br from-neutral-900/90 to-neutral-950 border border-amber-400/10 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden group hover:border-amber-400/20 transition-all duration-500" 
      id="developer-note-card"
    >
      {/* Decorative Warm Ambient Glow of Cosmic Theme */}
      <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-amber-400/5 blur-[60px] pointer-events-none group-hover:bg-amber-400/10 transition-all duration-700"></div>
      <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-amber-400/5 blur-[60px] pointer-events-none"></div>

      {/* Big Watermarked Quote Icon in the background */}
      <div className="absolute bottom-6 right-6 text-neutral-900/40 select-none pointer-events-none transition-transform duration-500 group-hover:scale-110">
        <Quote className="w-24 h-24 stroke-[0.5]" />
      </div>

      {/* Card Header with a Developer Profile look */}
      <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
        <div className="flex items-center gap-3">
          {/* Avatar / Initials with a gold gradient rim */}
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 p-[1.5px] shadow-md shadow-amber-400/5">
            <div className="w-full h-full rounded-full bg-neutral-950 flex items-center justify-center font-serif text-sm font-black text-amber-400">
              NP
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-neutral-100 tracking-wide font-sans">
              Md. Nasir Parvez
            </h4>
            <span className="text-[10px] font-mono text-amber-400/80 font-medium">
              Creator & Developer
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 bg-amber-400/5 border border-amber-400/10 px-2.5 py-1 rounded-full">
          <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
          <span className="text-[9px] font-mono text-amber-300 font-bold uppercase tracking-wider">
            Creator's Message
          </span>
        </div>
      </div>

      {/* Main Back-story / Note Block */}
      <div className="relative z-10 flex flex-col gap-4 text-xs font-sans text-neutral-300 leading-relaxed md:text-[12.5px]">
        {/* Decorative opening quote mark */}
        <div className="text-amber-400/60 font-serif text-3xl leading-none h-2 -mb-2">“</div>
        
        <p className="indent-4">
          Hi there,
        </p>
        
        <p>
          I always wanted an application that would suggest new English words to me daily—especially one with a deck of words I've learned so far that could also double as an instant dictionary.
        </p>
        
        <p>
          While there are many vocabulary apps out there, most are locked behind premium subscriptions, filled with ads, or feel way too cumbersome for a simple daily habit. That is why I built this app using Google AI Studio. I wanted something clean, effortless, and powerful.
        </p>
        
        <p>
          I hope you enjoy using it as much as I enjoyed building it. If you have any suggestions to make it better, please let me know through your reviews.
        </p>

        {/* Closing decorative Quote */}
        <div className="text-right text-amber-400/40 font-serif text-3xl leading-none select-none h-1 -mt-2">”</div>
      </div>

      {/* Handwritten Ending & Sign-off Layout */}
      <div className="border-t border-neutral-900 pt-4 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-serif italic text-neutral-400">Happy learning!</span>
          {/* Faux elegant cursive signature print */}
          <span className="font-serif text-base font-extrabold tracking-wide text-neutral-100 mt-1 pl-1 bg-gradient-to-r from-neutral-100 to-amber-200 bg-clip-text text-transparent">
            Md. Nasir Parvez
          </span>
        </div>
        
        {/* Heart icon with subtle bounce on hover */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-500 pr-1 group-hover:text-amber-400/70 transition-colors duration-300">
          <span>Crafted with</span>
          <Heart className="w-3.5 h-3.5 fill-amber-400/10 stroke-amber-400 animate-pulse text-amber-400" />
        </div>
      </div>
    </div>
  );
}

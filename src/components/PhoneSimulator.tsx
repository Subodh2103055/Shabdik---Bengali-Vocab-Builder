import React, { useState, useEffect } from 'react';
import { Smartphone, Wifi, Battery, Signal, ArrowLeft, Home, BookOpen, RefreshCw, Layers, Languages, Heart } from 'lucide-react';

interface PhoneSimulatorProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  streak: number;
}

export default function PhoneSimulator({
  children,
  activeTab,
  setActiveTab,
  streak
}: PhoneSimulatorProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      setTime(`${hours}:${minutes}`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div id="phone-container" className="relative mx-auto w-full flex flex-col overflow-hidden aspect-auto border-none p-0 bg-transparent ring-0 shadow-none rounded-none sm:max-w-[390px] sm:aspect-[9/18.5] sm:bg-neutral-950 sm:p-[10px] sm:shadow-2xl sm:border-[6px] sm:border-neutral-800 sm:ring-1 sm:ring-neutral-700/50 sm:rounded-[52px]">
      {/* Speaker and Camera - Dynamic Island - visible only on PC/tablet mockup */}
      <div className="hidden sm:flex absolute top-4 left-1/2 -translate-x-1/2 h-6 w-28 bg-black rounded-2xl z-50 items-center justify-between px-3">
        <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 border border-neutral-800/40"></div>
        <div className="w-12 h-1 bg-neutral-800 rounded-full"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-blue-950/80 border border-blue-900/40"></div>
      </div>

      {/* Screen Area */}
      <div className="relative flex-1 w-full h-full bg-neutral-900/40 rounded-none flex flex-col overflow-hidden text-neutral-100 select-none sm:bg-neutral-900 sm:rounded-[42px]">
        
        {/* Mobile Status Bar - visible only on virtual PC/tablet Mockup */}
        <div className="hidden sm:flex pt-5 px-6 pb-2 w-full items-center justify-between text-[11px] font-semibold text-neutral-200 z-40 bg-neutral-900 bg-opacity-70 backdrop-blur-md">
          <span className="font-mono">{time}</span>
          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5 text-neutral-200" strokeWidth={2.5} />
            <span className="text-[9px] scale-90 text-neutral-400 font-mono">5G</span>
            <Wifi className="w-3.5 h-3.5 text-neutral-200" strokeWidth={2.5} />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] scale-90 font-mono text-neutral-300">89%</span>
              <Battery className="w-4 h-4 text-emerald-400 fill-emerald-500/20" strokeWidth={2} />
            </div>
          </div>
        </div>

        {/* Core Screen Content - Adjust padding bottom to account for navigation safely */}
        <div 
          className="flex-1 w-full overflow-y-auto overflow-x-hidden px-4 py-2 scrollbar-none flex flex-col pb-20"
        >
          {children}
        </div>

        {/* Dynamic App Bottom Navbar Tab Bar */}
        <div className="fixed sm:absolute bottom-0 left-0 right-0 h-16 bg-neutral-900/90 backdrop-blur-xl border-t border-neutral-800/40 px-3 pb-5 sm:pb-4 pt-2 flex items-center justify-around z-50 rounded-b-none sm:rounded-b-[42px] shadow-[0_-8px_30px_rgba(0,0,0,0.85)]">
          <button
            id="tab-home"
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeTab === 'home' 
                ? 'text-amber-400 scale-105 font-bold' 
                : 'text-neutral-400 hover:text-neutral-250'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[9px] font-medium font-sans">Daily Word</span>
          </button>

          <button
            id="tab-deck"
            onClick={() => setActiveTab('deck')}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeTab === 'deck' 
                ? 'text-amber-400 scale-105 font-bold' 
                : 'text-neutral-400 hover:text-neutral-250'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[9px] font-medium font-sans">My Deck</span>
          </button>

          <button
            id="tab-translate"
            onClick={() => setActiveTab('translate')}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeTab === 'translate' 
                ? 'text-amber-400 scale-105 font-bold' 
                : 'text-neutral-400 hover:text-neutral-250'
            }`}
          >
            <Languages className="w-5 h-5" />
            <span className="text-[9px] font-medium font-sans">Translate</span>
          </button>

          <button
            id="tab-sync"
            onClick={() => setActiveTab('sync')}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeTab === 'sync' 
                ? 'text-amber-400 scale-105 font-bold' 
                : 'text-neutral-400 hover:text-neutral-250'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[9px] font-medium font-sans">Sync Cloud</span>
          </button>

          <button
            id="tab-creator"
            onClick={() => setActiveTab('creator')}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeTab === 'creator' 
                ? 'text-amber-400 scale-105 font-bold' 
                : 'text-neutral-400 hover:text-neutral-250'
            }`}
          >
            <Heart className="w-5 h-5" />
            <span className="text-[9px] font-medium font-sans">Creator</span>
          </button>
        </div>

        {/* Bottom Home gesture bar indicator - visible only on desktop/tablet mockup */}
        <div className="hidden sm:block absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-neutral-700/80 rounded-full z-50 pointer-events-none"></div>
      </div>
    </div>
  );
}

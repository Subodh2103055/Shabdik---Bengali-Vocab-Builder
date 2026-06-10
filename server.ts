import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { OFFLINE_DICTIONARY } from "./src/data/offlineDictionary";

dotenv.config();

// Standard local fallback words so the app works offline/instantly and serves as high-speed cache
const LOCAL_WORDS = OFFLINE_DICTIONARY;

// Robust Offline English to Bengali dictionary of common words
const COMMON_EASY_WORDS: Record<string, {
  word: string,
  ipa: string,
  bengaliMeaning: string,
  definition: string,
  definitionBengali: string,
  exampleSentence: string,
  exampleSentenceBengali: string,
  synonyms: string[],
  difficulty: string,
  partOfSpeech: string
}> = {
  "hell": {
    word: "Hell",
    ipa: "/hel/",
    bengaliMeaning: "নরক, জাহান্নাম, চরম কষ্টের অবস্থা",
    definition: "A spiritual realm of evil and suffering, or a state of great misery or torment.",
    definitionBengali: "মৃত্যুর পরে পাপীদের শাস্তিভোগের স্থান, অথবা অত্যন্ত দুঃখ-কষ্ট ও যন্ত্রণার কোনো অবস্থা।",
    exampleSentence: "She went through absolute hell trying to solve the problem.",
    exampleSentenceBengali: "সমস্যাটি সমাধান করার চেষ্টা করতে গিয়ে তাকে চরম কঠিন যন্ত্রণার মধ্য দিয়ে যেতে হয়েছিল।",
    synonyms: ["underworld", "hades", "inferno", "torment"],
    difficulty: "basic",
    partOfSpeech: "noun"
  },
  "heaven": {
    word: "Heaven",
    ipa: "/ˈhev.ən/",
    bengaliMeaning: "স্বর্গ, বেহেশত, পরম সুখের স্থান",
    definition: "A place regarded as the fine abode of God, angels, and the spirits of the good.",
    definitionBengali: "সৃষ্টিকর্তা এবং সজ্জনদের উন্নত ও সুখময় স্বর্গীয় পরকাল বাসস্থান।",
    exampleSentence: "This peaceful mountaintop feels like a piece of pure heaven.",
    exampleSentenceBengali: "এই শান্ত পর্বতশৃঙ্গটি যেন খাঁটি স্বর্গের একটি টুকরো মনে হয়।",
    synonyms: ["paradise", "elysium", "bliss", "nirvana"],
    difficulty: "basic",
    partOfSpeech: "noun"
  },
  "love": {
    word: "Love",
    ipa: "/lʌv/",
    bengaliMeaning: "ভালোবাসা, স্নেহ, গভীর অনুরাগ ও মমতা",
    definition: "An intense feeling of deep affection, warmth, and care for someone or something.",
    definitionBengali: "কারো বা কোনো কিছুর প্রতি গভীর স্নেহ, আন্তরিকতা এবং যত্নের একটি তীব্র অনুভূতি।",
    exampleSentence: "A mother's love for her children is always unconditional.",
    exampleSentenceBengali: "সন্তানদের প্রতি মায়ের ভালোবাসা সর্বদা নিঃশর্ত হয়।",
    synonyms: ["affection", "devotion", "passion", "fondness"],
    difficulty: "basic",
    partOfSpeech: "noun"
  },
  "water": {
    word: "Water",
    ipa: "/ˈwɔː.tər/",
    bengaliMeaning: "পানি, জল, জীবন রক্ষাকারী তরল",
    definition: "A transparent, odorless, tasteless liquid that forms rain, rivers, and is vital for life.",
    definitionBengali: "একটি স্বচ্ছ, গন্ধহীন, স্বাদহীন তরল যা বৃষ্টি ও নদীর সৃষ্টি করে এবং জীবনের জন্য অপরিহার্য।",
    exampleSentence: "Drinking enough clean water is essential for staying healthy.",
    exampleSentenceBengali: "সুস্থ থাকার জন্য পর্যাপ্ত পরিমানে পরিষ্কার পানি পান করা অত্যন্ত জরুরি।",
    synonyms: ["aqua", "liquid", "moisture", "h2o"],
    difficulty: "basic",
    partOfSpeech: "noun"
  },
  "school": {
    word: "School",
    ipa: "/skuːl/",
    bengaliMeaning: "বিদ্যালয়, স্কুল, শিক্ষাপ্রতিষ্ঠান",
    definition: "An institution or place for educating children and students.",
    definitionBengali: "শিশু এবং শিক্ষার্থীদের শিক্ষা প্রদানের একটি প্রতিষ্ঠান বা স্থান।",
    exampleSentence: "The children eagerly walked to school with their backpacks on.",
    exampleSentenceBengali: "শিশুরা তাদের কাঁধে ব্যাগ ঝুলিয়ে আগ্রহের সাথে স্কুলে রওনা হয়েছিল।",
    synonyms: ["academy", "college", "institution", "seminary"],
    difficulty: "basic",
    partOfSpeech: "noun"
  },
  "home": {
    word: "Home",
    ipa: "/həʊm/",
    bengaliMeaning: "বাড়ি, গৃহ, শান্তির নীড়",
    definition: "The place where one lives permanently, especially as a member of a family.",
    definitionBengali: "যেখানে কোনো ব্যক্তি স্থায়ীভাবে বসবাস করে, বিশেষ করে পরিবারের কোনো সদস্য হিসেবে।",
    exampleSentence: "After a long exhausting flight, they were glad to finally be back home.",
    exampleSentenceBengali: "একটি দীর্ঘ ক্লান্তিকর ফ্লাইটের পর, তারা অবশেষে বাড়িতে ফিরে অত্যন্ত আনন্দ পেয়েছিল।",
    synonyms: ["house", "residence", "abode", "dwelling"],
    difficulty: "basic",
    partOfSpeech: "noun"
  },
  "friend": {
    word: "Friend",
    ipa: "/frend/",
    bengaliMeaning: "বন্ধু, সুহৃদ, সখা, শুভাকাঙ্ক্ষী",
    definition: "A person whom one knows and with whom one has a bond of mutual affection.",
    definitionBengali: "এমন এক ব্যক্তি যাকে কেউ চেনে এবং যার সাথে পারস্পরিক গভীর স্নেহের বন্ধন রয়েছে।",
    exampleSentence: "A true friend is someone who stands by you in times of adversity.",
    exampleSentenceBengali: "একজন প্রকৃত বন্ধু হলেন তিনিই যিনি আপনার বিপদের সময়ে পাশে থাকেন।",
    synonyms: ["companion", "buddy", "ally", "mate"],
    difficulty: "basic",
    partOfSpeech: "noun"
  },
  "happy": {
    word: "Happy",
    ipa: "/ˈhæp.i/",
    bengaliMeaning: "সুখী, আনন্দিত, প্রফুল্ল, সন্তুষ্ট",
    definition: "Feeling or showing pleasure, contentment, or satisfaction.",
    definitionBengali: "আনন্দ, সন্তোষ ও চমৎকার মনের ভালো অনুভূতি প্রকাশ করা বা পাওয়া।",
    exampleSentence: "The students were extremely happy after hearing about the extended summer holidays.",
    exampleSentenceBengali: "গ্রীষ্মের বর্ধিত ছুটির খবর শোনার পর ছাত্রছাত্রীরা অত্যন্ত আনন্দিত হয়েছিল।",
    synonyms: ["cheerful", "joyful", "content", "delighted"],
    difficulty: "basic",
    partOfSpeech: "adjective"
  },
  "sad": {
    word: "Sad",
    ipa: "/sæd/",
    bengaliMeaning: "দুঃখিত, বিষণ্ণ, মনমরা, কাতর",
    definition: "Feeling or showing sorrow, unhappiness, or regret.",
    definitionBengali: "বেদনা, অসন্তুষ্টি অথবা আক্ষেপ অনুভব করা বা প্রকাশ করা।",
    exampleSentence: "He felt sad when his best friend moved to another city.",
    exampleSentenceBengali: "যখন তার সেরা বন্ধুটি অন্য শহরে চলে গেল, তখন সে বিষণ্ণ বোধ করেছিল।",
    synonyms: ["unhappy", "sorrowful", "gloomy", "depressed"],
    difficulty: "basic",
    partOfSpeech: "adjective"
  },
  "life": {
    word: "Life",
    ipa: "/laɪf/",
    bengaliMeaning: "জীবন, প্রাণ, জীবদ্দশা, জীবনীশক্তি",
    definition: "The condition that distinguishes active organisms from inorganic matter, showing growth and functional reproduction.",
    definitionBengali: "এমন অবস্থা বা স্পন্দন যা জড় বস্তু থেকে সক্রিয় জীবকে আলাদা করে এবং বৃদ্ধি ও প্রজনন প্রদর্শন করে।",
    exampleSentence: "Every form of life on earth deserves respect and preservation.",
    exampleSentenceBengali: "পৃথিবীর প্রতিটি ধরণ ও প্রাণেরই সম্মান ও সুরক্ষার অধিকার রয়েছে।",
    synonyms: ["existence", "being", "vitality", "living"],
    difficulty: "basic",
    partOfSpeech: "noun"
  },
  "peace": {
    word: "Peace",
    ipa: "/piːs/",
    bengaliMeaning: "শান্তি, সম্প্রীতি, প্রশান্তি, নিস্তব্ধতা",
    definition: "Freedom from disturbance; tranquility, mental calmness, or freedom from war.",
    definitionBengali: "অশান্তি বা বিশৃঙ্খলা থেকে মুক্তি; মানসিক প্রশান্তি অথবা যুদ্ধবিগ্রহহীন শান্ত অবস্থা।",
    exampleSentence: "We hope both nations will soon sign a peace treaty to end the conflict.",
    exampleSentenceBengali: "আমরা আশা করি উভয় জাতি দ্বন্দ্বের অবসান ঘটাতে শীঘ্রই একটি শান্তি চুক্তি স্বাক্ষর করবে।",
    synonyms: ["tranquility", "harmony", "calmness", "quietude"],
    difficulty: "basic",
    partOfSpeech: "noun"
  },
  "work": {
    word: "Work",
    ipa: "/wɜːk/",
    bengaliMeaning: "কাজ, কর্ম, চাকরি, প্ররিশ্রম",
    definition: "Activity involving mental or physical effort done in order to achieve a purpose or result.",
    definitionBengali: "কোনো উদ্দেশ্য বা ফলাফল অর্জনের জন্য শারীরিক বা মানসিক প্রচেষ্টা সংশ্লিষ্ট কাজ বা কর্ম।",
    exampleSentence: "She is dedicated to her work and always completes her tasks ahead of schedule.",
    exampleSentenceBengali: "সে তার কাজের প্রতি একনিষ্ঠ এবং সর্বদা তার নির্ধারিত সময়ের আগেই সম্পূর্ণ করে ফেলে।",
    synonyms: ["labor", "employment", "task", "duty"],
    difficulty: "basic",
    partOfSpeech: "noun"
  },
  "learn": {
    word: "Learn",
    ipa: "/lɜːn/",
    bengaliMeaning: "শেখা, জ্ঞান অর্জন করা, মুখস্থ করা",
    definition: "Acquire knowledge of or skill in something through study, experience, or being taught.",
    definitionBengali: "অধ্যয়ন, অভিজ্ঞতা অথবা শিক্ষার মাধ্যমে কোনো বিষয়ে নতুন জ্ঞান বা দক্ষতা অর্জন করা।",
    exampleSentence: "Learning a new language opens up doors to understanding new rich cultures.",
    exampleSentenceBengali: "নতুন ভাষা শেখা নতুন সমৃদ্ধ সংস্কৃতি বোঝার চমৎকার পথ উন্মুক্ত করে দেয়।",
    synonyms: ["acquire", "master", "grasp", "memorize"],
    difficulty: "basic",
    partOfSpeech: "verb"
  }
};

// Keyless Google Translate API - fetches native translations instantly
async function fetchTranslation(text: string, sl: string = "en", tl: string = "bn"): Promise<string> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Google Translate lookup failed");
    const data = await res.json();
    if (Array.isArray(data) && data[0]) {
      let translated = "";
      for (const piece of data[0]) {
        if (piece && piece[0]) {
          translated += piece[0];
        }
      }
      return translated.trim();
    }
    return text;
  } catch (e) {
    console.error(`[Translation Fallback Error] Could not translate "${text}":`, e);
    return text;
  }
}

// Free Dictionary API - fetches phonetic guides, parts of speech, and English definitions
async function fetchEnglishDictionaryWord(word: string) {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (res.status === 404) {
      return { isNotFound: true };
    }
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    
    const entry = data[0];
    const wordText = entry.word || word;
    
    // Extract IPA phonetics properly
    let ipa = entry.phonetic || `/${word.toLowerCase()}/`;
    if (entry.phonetics && entry.phonetics.length > 0) {
      const pWithText = entry.phonetics.find((p: any) => p.text && p.text.trim());
      if (pWithText) {
        ipa = pWithText.text;
      }
    }
    
    // Get part of speech and definition
    let partOfSpeech = "noun";
    let definition = "No English definition found.";
    let exampleSentence = `The word "${word}" carries rich vocabulary significance in bilingual contexts.`;
    let synonyms: string[] = [];
    
    if (entry.meanings && entry.meanings.length > 0) {
      const primaryMeaning = entry.meanings[0];
      partOfSpeech = primaryMeaning.partOfSpeech || "noun";
      if (primaryMeaning.definitions && primaryMeaning.definitions.length > 0) {
        definition = primaryMeaning.definitions[0].definition || definition;
        if (primaryMeaning.definitions[0].example) {
          exampleSentence = primaryMeaning.definitions[0].example;
        }
      }
      if (primaryMeaning.synonyms && primaryMeaning.synonyms.length > 0) {
        synonyms = primaryMeaning.synonyms.slice(0, 4);
      }
    }
    
    return {
      word: wordText.charAt(0).toUpperCase() + wordText.slice(1).toLowerCase(),
      ipa,
      partOfSpeech,
      definition,
      exampleSentence,
      synonyms: synonyms.length > 0 ? synonyms : ["term", "expression", "vocabulary", "word"]
    };
  } catch (e) {
    console.error(`[Dictionary Fallback API Error] Could not query "${word}":`, e);
    return null;
  }
}

// Dynamically compile a vocabulary analysis on-the-fly using the backend Gemini client directly (so fallback routes directly to the AI model and never fails to synthesize highly authentic translations, definitions, and contextual examples)
async function getDynamicFallbackWord(cleanWord: string) {
  const client = getGeminiClient();
  if (client) {
    try {
      console.log(`[Dynamic AI Fallback] Generating authentic dictionary details directly via Gemini 3.5 for: "${cleanWord}"`);
      const prompt = `Perform a brilliant, complete dictionary analysis for the exact English word: "${cleanWord}".
Generate a beautifully structured response containing its phonetic spelling (IPA), Bengali meaning, definition, definition in simpler Bengali, a contextual example sentence, its native Bengali translation, synonyms, difficulty level ("basic", "intermediate", "advanced"), and part of speech ("noun", "verb", "adjective", "adverb", etc.).
Always return a valid structure without any markdown wrappers.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              ipa: { type: Type.STRING },
              bengaliMeaning: { type: Type.STRING },
              definition: { type: Type.STRING },
              definitionBengali: { type: Type.STRING },
              exampleSentence: { type: Type.STRING },
              exampleSentenceBengali: { type: Type.STRING },
              synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
              difficulty: { type: Type.STRING, enum: ["basic", "intermediate", "advanced"] },
              partOfSpeech: { type: Type.STRING }
            },
            required: ["word", "ipa", "bengaliMeaning", "definition", "definitionBengali", "exampleSentence", "exampleSentenceBengali", "synonyms", "difficulty", "partOfSpeech"]
          }
        }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed && parsed.word) {
          return parsed;
        }
      }
    } catch (geminiError: any) {
      console.error(`[Dynamic AI Fallback Error] Gemini synthesis failed for "${cleanWord}":`, geminiError.message || geminiError);
    }
  }

  // If Gemini client is unavailable (e.g. key has not been initialized or is failing),
  // resort to the classic translation lookup to ensure the app continues to operate flawlessly.
  console.log(`[Classic Fallback Gateway] Resorting to public lookup for: "${cleanWord}"`);
  try {
    const dictData = await fetchEnglishDictionaryWord(cleanWord);
    if (dictData && !('isNotFound' in dictData)) {
      const [bengaliMeaning, definitionBengali, exampleSentenceBengali] = await Promise.all([
        fetchTranslation(dictData.word, "en", "bn"),
        fetchTranslation(dictData.definition, "en", "bn"),
        fetchTranslation(dictData.exampleSentence, "en", "bn")
      ]);
      return {
        word: dictData.word,
        ipa: dictData.ipa,
        bengaliMeaning,
        definition: dictData.definition,
        definitionBengali,
        exampleSentence: dictData.exampleSentence,
        exampleSentenceBengali,
        synonyms: dictData.synonyms,
        difficulty: "intermediate",
        partOfSpeech: dictData.partOfSpeech
      };
    }
  } catch (err: any) {
    console.error(`[Classic Fallback Error] public lookup failed for "${cleanWord}":`, err.message);
  }

  // Ultimate static synthesis fallback
  const singleMeaning = await fetchTranslation(cleanWord, "en", "bn");
  return {
    word: cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase(),
    ipa: `/${cleanWord.toLowerCase()}/`,
    bengaliMeaning: singleMeaning || "সন্ধানকৃত শব্দ",
    definition: `A vocabulary word queried in the dictionary system.`,
    definitionBengali: `ডিকশনারি সিস্টেমে অনুসন্ধানকৃত একটি শব্দ।`,
    exampleSentence: `Understanding the spelling, definition, and grammar contexts of "${cleanWord}".`,
    exampleSentenceBengali: `"${cleanWord}" শব্দটির ব্যবহারিক প্রয়োগ এবং বাংলা বাক্য গঠন।`,
    synonyms: ["vocabulary", "term", "word", "expression"],
    difficulty: "intermediate",
    partOfSpeech: "noun"
  };
}

// Lazy initialised Gemini configuration
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  // Gracefully check both secure and public-scoped keys on the backend
  let key = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "").trim();
  
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.slice(1, -1).trim();
  }
  if (key.startsWith("'") && key.endsWith("'")) {
    key = key.slice(1, -1).trim();
  }
  
  if (!key) {
    console.log("[Gemini Setup] No active GEMINI_API_KEY or VITE_GEMINI_API_KEY found in process.env. Entering local offline fallback mode smoothly.");
    return null;
  }

  const normalized = key.toUpperCase();
  if (normalized === "MY_GEMINI_API_KEY" || normalized === "YOUR_ACTUAL_API_KEY_HERE" || normalized === "PLACEholder" || normalized === "") {
    console.log("[Gemini Setup] Active key matches standard default placeholder configurations. Resorting to fallback mechanisms.");
    return null;
  }

  if (!aiClient) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      console.log("[Gemini Setup] Successfully initialized GoogleGenAI with the secure server-side API Key!");
    } catch (err: any) {
      console.error("[Gemini Setup] Error initializing active Gemini client:", err.message);
      return null;
    }
  }
  return aiClient;
}

// Firebase Setup
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// Dynamically resolve and load Firebase project configurations.
// Supports both secure runtime environment variables (un-prefixed for backend safety)
// and seamless fallback to the local workspace config file (if present).
let firebaseConfig: any = null;

if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_API_KEY) {
  firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    apiKey: process.env.FIREBASE_API_KEY,
    appId: process.env.FIREBASE_APP_ID || "",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || ""
  };
  console.log("[Firebase Initialization] Using configuration loaded from environment variables.");
} else {
  try {
    // Attempt dynamic read of local config to ensure compilation succeeds even in clean repositories
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      console.log("[Firebase Initialization] Loaded local configuration file from:", configPath);
    }
  } catch (err: any) {
    console.warn("[Firebase Initialization] Notice: Could not load local firebase-applet-config.json:", err.message);
  }
}

let db: any = null;
if (firebaseConfig) {
  try {
    const firebaseApp = initializeApp(firebaseConfig);
    const dbId = process.env.FIREBASE_DATABASE_ID || "ai-studio-26f296bf-9934-4857-b249-bbfa849daa15";
    db = getFirestore(firebaseApp, dbId);
    console.log("[Firebase Initialization] Connected to cloud Firestore database:", dbId);
  } catch (error: any) {
    console.error("[Firebase Initialization] Failed:", error.message);
  }
} else {
  console.warn("[Firebase Initialization] No Firebase credentials or fallback config found. Sync-to-Cloud will operate in Local File/Memory mode.");
}

// File-system based fallback storage for cross-device cloud sync sessions, so that
// dev server restarts (due to code edits) or container restarts do not lose user tokens.
const SYNC_FILE_PATH = process.env.VERCEL
  ? path.join("/tmp", "sync-sessions.json")
  : path.join(process.cwd(), "sync-sessions.json");
let syncDB: Record<string, any> = {};

try {
  if (fs.existsSync(SYNC_FILE_PATH)) {
    const raw = fs.readFileSync(SYNC_FILE_PATH, "utf-8");
    syncDB = JSON.parse(raw);
    console.log(`[Sync Session Store] Successfully loaded ${Object.keys(syncDB).length} active token sessions from disk: ${Object.keys(syncDB).join(', ')}`);
  }
} catch (e) {
  console.error("[Sync Session Store] Initialization warning (falling back to temporary memory storage):", e);
}

function saveSyncDB() {
  try {
    fs.writeFileSync(SYNC_FILE_PATH, JSON.stringify(syncDB, null, 2), "utf-8");
  } catch (e) {
    console.error("[Sync Session Store] Failed to write sessions to disk:", e);
  }
}

// High-performance search result persistent cache to make subsequent searches of any word sub-millisecond
const SEARCH_CACHE_FILE_PATH = process.env.VERCEL
  ? path.join("/tmp", "search-cache.json")
  : path.join(process.cwd(), "search-cache.json");
let searchCache: Record<string, any> = {};

try {
  if (fs.existsSync(SEARCH_CACHE_FILE_PATH)) {
    const raw = fs.readFileSync(SEARCH_CACHE_FILE_PATH, "utf-8");
    searchCache = JSON.parse(raw);
    console.log(`[Search Persistent Cache] Successfully loaded ${Object.keys(searchCache).length} cached word definitions from disk.`);
  }
} catch (e) {
  console.error("[Search Persistent Cache] Initialization warning:", e);
}

function saveSearchCache() {
  try {
    fs.writeFileSync(SEARCH_CACHE_FILE_PATH, JSON.stringify(searchCache, null, 2), "utf-8");
  } catch (e) {
    console.error("[Search Persistent Cache] Failed to write cache to disk:", e);
  }
}

// Durable dynamic backend wrappers to handle Firestore operations asynchronously with standard file system fallbacks
async function getSyncSession(syncId: string): Promise<any> {
  if (db) {
    try {
      const docRef = doc(db, "syncSessions", syncId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const docData = docSnap.data();
        if (docData && docData.data) {
          // Sync local memory-cache/file-copy with latest from Firebase cloud
          syncDB[syncId] = docData;
          saveSyncDB();
          return docData;
        }
      }
    } catch (err: any) {
      console.warn(`[Firestore syncSessions read failure] Falling back to memory/disk store:`, err.message);
    }
  }
  return syncDB[syncId] || null;
}

async function saveSyncSession(syncId: string, data: any) {
  const payload = {
    data,
    updatedAt: new Date().toISOString()
  };
  syncDB[syncId] = payload;
  saveSyncDB();

  if (db) {
    try {
      const docRef = doc(db, "syncSessions", syncId);
      await setDoc(docRef, payload);
    } catch (err: any) {
      console.warn(`[Firestore syncSessions write failure]`, err.message);
    }
  }
}

async function fetchFromSearchCache(lcWord: string): Promise<any> {
  // Hit fast local memory cache first
  if (searchCache[lcWord]) {
    return searchCache[lcWord];
  }
  if (db) {
    try {
      const docRef = doc(db, "searchCache", lcWord);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const docData = docSnap.data();
        if (docData && docData.word) {
          // Reflect back to memory cache
          searchCache[lcWord] = docData.word;
          saveSearchCache();
          return docData.word;
        }
      }
    } catch (err: any) {
      console.warn(`[Firestore searchCache read failure]:`, err.message);
    }
  }
  return null;
}

async function writeToSearchCache(lcWord: string, wordData: any) {
  searchCache[lcWord] = wordData;
  saveSearchCache();

  if (db) {
    try {
      const docRef = doc(db, "searchCache", lcWord);
      await setDoc(docRef, {
        word: wordData,
        updatedAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.warn(`[Firestore searchCache write failure]:`, err.message);
    }
  }
}

// Background buffer storage to make Gemini word generation 100% instant (0ms!)
const GENERATED_WORD_BUFFER: Record<string, any[]> = {
  basic: [],
  intermediate: [],
  advanced: [],
  ielts: [],
  gre: []
};

const activeBufferWordsSet = new Set<string>();
const replenishingFlags: Record<string, boolean> = {
  basic: false,
  intermediate: false,
  advanced: false,
  ielts: false,
  gre: false
};

// Asynchronously pre-generates words in the background so that the next click is always instant (0ms!)
async function replenishBuffer(difficulty: string) {
  const client = getGeminiClient();
  if (!client) return;

  // We keep at most 3 words in the buffer per difficulty
  if (GENERATED_WORD_BUFFER[difficulty] && GENERATED_WORD_BUFFER[difficulty].length >= 3) {
    return;
  }

  if (replenishingFlags[difficulty]) {
    return;
  }
  replenishingFlags[difficulty] = true;

  try {
    console.log(`[Background Buffer] Generating pre-heated word for difficulty "${difficulty}" in the background...`);
    const difficultyPrompt = difficulty === "basic" 
      ? "extremely simple, everyday words suitable for vocabulary beginners" 
      : difficulty === "advanced" 
        ? "uncommon, intellectual, or academic vocabulary words" 
        : difficulty === "ielts"
          ? "academic and high-yield words frequently appearing on IELTS exams like analyze, coherent, fluctuate, versatile, consolidate"
          : difficulty === "gre"
            ? "highly prestigious, scholarly, or advanced GRE words like aberration, capricious, epistemic, anachronism, loquacious"
            : "common yet highly expressive intermediate level words";

    const excludeWords = Array.from(activeBufferWordsSet);
    const excludePrompt = excludeWords.length > 0
      ? `3. Crucially, the word MUST NOT be any of these excluded words: ${excludeWords.join(', ')}.`
      : "";

    const prompt = `Generate an interesting, unique English word based on these guidelines:
1. Difficulty level: ${difficulty} (${difficultyPrompt}).
2. It MUST be a single genuine English word. Avoid trivial terms like "cat" or "house", choose highly expressive words.
${excludePrompt ? excludePrompt + "\n" : ""}3. Provide its accurate phonetic transcription (IPA format).
4. Provide its Bengali translation (simple, precise, and native).
5. Provide a short definition in English.
6. Provide a short Bengali description of the definition.
7. Return a sample sentence showing the word beautifully used in real-life standard context.
8. Translate this sample sentence accurately into Bengali.
9. Suggest up to 4 accurate synonyms for this word.
10. Specify its part of speech.

Strictly adhere to the response schema and output valid JSON. Do not write any markdown wrappers.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 1.15,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            ipa: { type: Type.STRING, description: "IPA format phonetic guides, e.g. /əˈstʌn.ɪʃ/" },
            bengaliMeaning: { type: Type.STRING, description: "Bengali equivalent meaning/translation, e.g. বিস্মিত করা, চমকে দেওয়া" },
            definition: { type: Type.STRING, description: "Detailed english explanation" },
            definitionBengali: { type: Type.STRING, description: "Simple Bengali definition" },
            exampleSentence: { type: Type.STRING, description: "Sample English sentence using the word" },
            exampleSentenceBengali: { type: Type.STRING, description: "Bengali translation of sentence" },
            synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
            difficulty: { type: Type.STRING, enum: ["basic", "intermediate", "advanced", "ielts", "gre"] },
            partOfSpeech: { type: Type.STRING, description: "noun, verb, adjective, adverb, etc." }
          },
          required: ["word", "ipa", "bengaliMeaning", "definition", "definitionBengali", "exampleSentence", "exampleSentenceBengali", "synonyms", "difficulty", "partOfSpeech"]
        }
      }
    });

    const text = response.text;
    if (text) {
      const generatedWord = JSON.parse(text);
      if (generatedWord && generatedWord.word) {
        const wKey = generatedWord.word.toLowerCase();
        if (!activeBufferWordsSet.has(wKey)) {
          GENERATED_WORD_BUFFER[difficulty].push(generatedWord);
          activeBufferWordsSet.add(wKey);
          console.log(`[Background Buffer] Successfully buffered "${generatedWord.word}" for difficulty "${difficulty}". Buffer size: ${GENERATED_WORD_BUFFER[difficulty].length}`);
        }
      }
    }
  } catch (error: any) {
    console.error(`[Background Buffer Error] Could not replenish buffer for "${difficulty}":`, error.message);
  } finally {
    replenishingFlags[difficulty] = false;
    if (GENERATED_WORD_BUFFER[difficulty].length < 2) {
      setTimeout(() => replenishBuffer(difficulty), 1500);
    }
  }
}

export const app = express();
const PORT = 3000;

async function startServer() {
  // Middleware
  app.use(express.json());

  // API Endpoints
  
  // 1. Get Daily Deterministic Word
  app.get("/api/word/daily", (req, res) => {
    // Determine the word deterministically using the day offset since Epoche
    const utcDay = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const dailyWord = LOCAL_WORDS[utcDay % LOCAL_WORDS.length];
    res.json({
      success: true,
      word: dailyWord,
      isFallback: false,
      currentTime: new Date().toISOString()
    });
  });

  // 2. Generate/Refresh brand new word via Gemini (instant serving from background pre-heated buffers)
  app.post("/api/word/generate", async (req, res) => {
    const difficulty = req.body.difficulty || "intermediate";
    const excludeWords = req.body.excludeWords || [];

    // Try to serve from pre-generated queue first (Instant, 0ms!)
    if (GENERATED_WORD_BUFFER[difficulty] && GENERATED_WORD_BUFFER[difficulty].length > 0) {
      const normalizedExclude = excludeWords.map((w: string) => w.toLowerCase());
      let chosenIdx = -1;
      for (let i = 0; i < GENERATED_WORD_BUFFER[difficulty].length; i++) {
        const bufferedWord = GENERATED_WORD_BUFFER[difficulty][i].word.toLowerCase();
        if (!normalizedExclude.includes(bufferedWord)) {
          chosenIdx = i;
          break;
        }
      }

      if (chosenIdx !== -1) {
        const [chosenWord] = GENERATED_WORD_BUFFER[difficulty].splice(chosenIdx, 1);
        console.log(`[Instant Buffer Hit] Serving buffered word "${chosenWord.word}" for difficulty "${difficulty}". Remaining in buffer: ${GENERATED_WORD_BUFFER[difficulty].length}`);
        
        // Trigger background replenish
        setTimeout(() => replenishBuffer(difficulty), 50);

        return res.json({
          success: true,
          word: chosenWord,
          isFallback: false,
          isBuffered: true
        });
      }
    }

    // Buffer is empty (or contains only excluded words). Proceed with standard generation
    const client = getGeminiClient();

    if (!client) {
      console.log(`No Gemini API key detected. Selecting random seed word of difficulty ${difficulty} as fallback. Exclude count: ${excludeWords.length}`);
      const normalizedExclude = excludeWords.map((w: string) => w.toLowerCase());
      const matching = LOCAL_WORDS.filter(w => w.difficulty === difficulty && !normalizedExclude.includes(w.word.toLowerCase()));
      const pool = matching.length > 0 ? matching : LOCAL_WORDS.filter(w => w.difficulty === difficulty);
      const finalPool = pool.length > 0 ? pool : LOCAL_WORDS;
      const idx = Math.floor(Math.random() * finalPool.length);
      const chosen = finalPool[idx];
      return res.json({
        success: true,
        word: chosen,
        isFallback: true,
        message: "Offline Simulator Mode: Loaded random seed word. (Set your API Key in Settings to get unbounded live words dynamically!)"
      });
    }

    try {
      const difficultyPrompt = difficulty === "basic" 
        ? "extremely simple, everyday words suitable for vocabulary beginners" 
        : difficulty === "advanced" 
          ? "uncommon, intellectual, or academic vocabulary words" 
          : difficulty === "ielts"
            ? "academic and high-yield words frequently appearing on IELTS exams like analyze, coherent, fluctuate, versatile, consolidate"
            : difficulty === "gre"
              ? "highly prestigious, scholarly, or advanced GRE words like aberration, capricious, epistemic, anachronism, loquacious"
              : "common yet highly expressive intermediate level words";

      const excludePrompt = excludeWords.length > 0
        ? `3. Crucially, the word MUST NOT be any of these excluded words: ${excludeWords.join(', ')}.`
        : "";

      const prompt = `Generate an interesting, unique English word based on these guidelines:
1. Difficulty level: ${difficulty} (${difficultyPrompt}).
2. It MUST be a single genuine English word. Avoid trivial terms like "cat" or "house", choose highly expressive words.
${excludePrompt ? excludePrompt + "\n" : ""}3. Provide its accurate phonetic transcription (IPA format).
4. Provide its Bengali translation (simple, precise, and native).
5. Provide a short definition in English.
6. Provide a short Bengali description of the definition.
7. Return a sample sentence showing the word beautifully used in real-life standard context.
8. Translate this sample sentence accurately into Bengali.
9. Suggest up to 4 accurate synonyms for this word.
10. Specify its part of speech.

Strictly adhere to the response schema and output valid JSON. Do not write any markdown wrappers.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 1.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              ipa: { type: Type.STRING, description: "IPA format phonetic guides, e.g. /əˈstʌn.ɪʃ/" },
              bengaliMeaning: { type: Type.STRING, description: "Bengali equivalent meaning/translation, e.g. বিস্মিত করা, চমকে দেওয়া" },
              definition: { type: Type.STRING, description: "Detailed english explanation" },
              definitionBengali: { type: Type.STRING, description: "Simple Bengali definition" },
              exampleSentence: { type: Type.STRING, description: "Sample English sentence using the word" },
              exampleSentenceBengali: { type: Type.STRING, description: "Bengali translation of sentence" },
              synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
              difficulty: { type: Type.STRING, enum: ["basic", "intermediate", "advanced", "ielts", "gre"] },
              partOfSpeech: { type: Type.STRING, description: "noun, verb, adjective, adverb, etc." }
            },
            required: ["word", "ipa", "bengaliMeaning", "definition", "definitionBengali", "exampleSentence", "exampleSentenceBengali", "synonyms", "difficulty", "partOfSpeech"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response received from Gemini");
      }

      const generatedWord = JSON.parse(text);
      
      // Since buffer is empty, asynchronously schedule replenish to pre-fill it for NEXT clicks
      setTimeout(() => replenishBuffer(difficulty), 50);

      res.json({
        success: true,
        word: generatedWord,
        isFallback: false
      });
    } catch (error: any) {
      console.error("Gemini generation failed, falling back safely:", error.message);
      const normalizedExclude = excludeWords.map((w: string) => w.toLowerCase());
      const matching = LOCAL_WORDS.filter(w => w.difficulty === difficulty && !normalizedExclude.includes(w.word.toLowerCase()));
      const pool = matching.length > 0 ? matching : LOCAL_WORDS.filter(w => w.difficulty === difficulty);
      const finalPool = pool.length > 0 ? pool : LOCAL_WORDS;
      const idx = Math.floor(Math.random() * finalPool.length);
      const chosen = finalPool[idx];

      // Schedule buffer replenish anyway
      setTimeout(() => replenishBuffer(difficulty), 50);

      res.json({
        success: true,
        word: chosen,
        isFallback: true,
        error: error.message,
        message: "Dynamic generation fell back to manual set due to standard request limit or parsing delay."
      });
    }
  });

  // 2.5 Word exact Search via Gemini (highly optimized with fast paths and persistent cache of searched words)
  app.post("/api/word/search", async (req, res) => {
    const { wordQuery } = req.body;
    if (!wordQuery || typeof wordQuery !== "string" || !wordQuery.trim()) {
      return res.status(400).json({ success: false, message: "Please enter a valid word to search." });
    }

    const cleanWord = wordQuery.trim();
    const lcWord = cleanWord.toLowerCase();

    // 1. High-Speed Offline Lookups: Check our pre-compiled database FIRST to avoid 4-second API latency
    const foundInLocalDict = LOCAL_WORDS.find(w => w.word.toLowerCase() === lcWord);
    if (foundInLocalDict) {
      console.log(`[Instant Offline Hit] Found "${cleanWord}" in precompiled dictionary database.`);
      return res.json({
        success: true,
        word: foundInLocalDict,
        isOffline: true,
        message: "Located word instantly in offline dictionary!"
      });
    }

    // 2. High-Speed Easy Word Offline Lookups
    if (COMMON_EASY_WORDS[lcWord]) {
      console.log(`[Instant Common Offline Hit] Found "${cleanWord}" in COMMON_EASY_WORDS dictionary.`);
      return res.json({
        success: true,
        word: COMMON_EASY_WORDS[lcWord],
        isOffline: true,
        message: "Located word instantly in common offline dictionary!"
      });
    }

    // 3. High-Speed Persistent Cache Lookups (sub-millisecond repeat-definition retrieval)
    const cachedWordData = await fetchFromSearchCache(lcWord);
    if (cachedWordData) {
      console.log(`[Instant Persistent Cache Hit] Found "${cleanWord}" in persistent search cache.`);
      return res.json({
        success: true,
        word: cachedWordData,
        isOffline: false,
        message: "Found word instantly in recent search history!"
      });
    }

    // 4. In-depth Live Search via Gemini 3.5 Flash (Preferred dynamic route for any non-preset words)
    const client = getGeminiClient();

    if (client) {
      try {
        console.log(`[Search Live Path] Automatically triggering direct live API call to Gemini 3.5 Flash for: "${cleanWord}"`);
        const prompt = `Perform a brilliant, complete dictionary analysis for the exact English word: "${cleanWord}".
First, determine if "${cleanWord}" is a real, valid, recognizable, standard English dictionary word (even if obscure or rare).
If it is a valid word, set "isValidWord" to true, and "spellingCorrection" to "".
If it is a severe misspelling or typo of an actual word, but you can identify the exact correct word intended, set "isValidWord" to false, and set "spellingCorrection" to the corrected spelling of the word (e.g. if requested is "hilarous", "spellingCorrection" should be "hilarious", and you can fill out the rest of the dictionary response using "hilarious"). 
However, if it is completely non-existent, random letter mashed gibberish (like "hilantaioius"), set "isValidWord" to false, "spellingCorrection" to "", and fill other fields with placeholders.

Strictly adhere to the response schema and output valid JSON. Do not write any markdown wrappers.`;

        const response = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isValidWord: { type: Type.BOOLEAN, description: "Whether this is a real, valid, recognizable English word, or a slight typo that can be clearly corrected." },
                spellingCorrection: { type: Type.STRING, description: "Provide the correct English spelling of the intended real word if input has typos. Otherwise return empty string." },
                word: { type: Type.STRING },
                ipa: { type: Type.STRING, description: "Phonetic transcription in IPA format, e.g. /ˌkwɪn.tɪˈsen.ʃəl/" },
                bengaliMeaning: { type: Type.STRING, description: "Bengali equivalent meaning/translation, e.g. সর্বোৎকৃষ্ট উদাহরণ, খাঁটি" },
                definition: { type: Type.STRING, description: "Detailed english explanation of what the word means" },
                definitionBengali: { type: Type.STRING, description: "Simple native Bengali description of the word's definition" },
                exampleSentence: { type: Type.STRING, description: "A beautifully formed sample English sentence showing the word in context" },
                exampleSentenceBengali: { type: Type.STRING, description: "Accurate natural Bengali translation of the sample sentence" },
                synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
                difficulty: { type: Type.STRING, enum: ["basic", "intermediate", "advanced"] },
                partOfSpeech: { type: Type.STRING, description: "noun, verb, adjective, adverb, etc." }
              },
              required: ["isValidWord", "spellingCorrection", "word", "ipa", "bengaliMeaning", "definition", "definitionBengali", "exampleSentence", "exampleSentenceBengali", "synonyms", "difficulty", "partOfSpeech"]
            }
          }
        });

        const text = response.text;
        if (!text) {
          throw new Error("Received empty response string from Gemini model.");
        }

        const generatedWord = JSON.parse(text);
        if (generatedWord.isValidWord === false) {
          if (generatedWord.spellingCorrection && generatedWord.spellingCorrection.trim()) {
            return res.json({
              success: false,
              isInvalidWord: true,
              message: `"${cleanWord}" is not recognized as a valid English word. Please check your spelling!`,
              suggestion: generatedWord.spellingCorrection
            });
          }
          console.warn(`[Search Live Path] Gemini returned isValidWord: false for "${cleanWord}". Falling back to dynamic translator.`);
        } else {
          // Save to cache so subsequent searches are instant
          await writeToSearchCache(lcWord, generatedWord);

          return res.json({
            success: true,
            word: generatedWord,
            isOffline: false,
            message: "Successfully generated word details dynamically with Gemini 3.5!"
          });
        }
      } catch (err: any) {
        console.warn(`Gemini word lookup failed or rate-limited for "${cleanWord}":`, err.message || err);
      }
    }

    // 5. Robust Fallback Pathway (Dictionary API + Translate API)
    // Triggered automatically if no Gemini client is available, or if Gemini API query failed/threw quota boundaries.
    try {
      console.log(`[Search Fallback Path] Launching high-speed Dictionary & Translate parallel lookup for: "${cleanWord}"`);
      const dynamicFallback = await getDynamicFallbackWord(cleanWord);
      
      if (dynamicFallback && dynamicFallback.word) {
        // Save to persistent cache
        await writeToSearchCache(lcWord, dynamicFallback);

        return res.json({
          success: true,
          word: dynamicFallback,
          isOffline: !client,
          message: client ? "Gemini experienced an API delay. Loaded dictionary fallback successfully!" : "Located and translated instantly via translation engine!"
        });
      }
    } catch (fallbackError: any) {
      console.error("[Search Fallback Path Failure] Dynamic dictionary/translate lookup also encountered an error:", fallbackError);
    }

    // 6. Ultimate Friendlier Error Card (Under extreme network or translation blocks, construct an elegant offline greeting card rather than showing Word Not Found)
    const friendlyErrorEnglish = `We could not fetch live translations for "${cleanWord}" right now due to a temporary server connection delay. Retry searching in a few seconds!`;
    const friendlyErrorBengali = `সাময়িক সংযোগ বিলম্বের বাতিরেক "${cleanWord}" শব্দটির লাইভ ডিকশনারি ফলাফল পাওয়া যায়নি। অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন!`;

    const backupWord = {
      word: cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase(),
      ipa: `/${cleanWord.toLowerCase()}/`,
      bengaliMeaning: "সন্ধানকৃত শব্দ (Temporary offline search)",
      definition: friendlyErrorEnglish,
      definitionBengali: friendlyErrorBengali,
      exampleSentence: `You searched for "${cleanWord}". Simply click Search again to fetch fresh live results.`,
      exampleSentenceBengali: `আপনি "${cleanWord}" অনুসন্ধান করেছেন। লাইভ ডেটা লোড করার জন্য আবার সার্চ এ ক্লিক করুন।`,
      synonyms: ["dictionary", "term", "vocabulary"],
      difficulty: "intermediate",
      partOfSpeech: "noun"
    };

    res.json({
      success: true,
      word: backupWord,
      isOffline: true,
      message: "Resorted to local backup dictionary card."
    });
  });

  // 2.75 Sentence & text translation (English <> Bengali) with Grammar Notes
  app.post("/api/translate", async (req, res) => {
    const { text, mode } = req.body; // mode: "en-to-bn" | "bn-to-en"
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ success: false, message: "Please enter a valid text segment to translate." });
    }

    const cleanInput = text.trim();
    const client = getGeminiClient();
    const sourceLang = mode === "en-to-bn" ? "English" : "Bengali";
    const targetLang = mode === "en-to-bn" ? "Bengali" : "English";

    if (!client) {
      console.log(`[Offline Translator Setup] No Gemini API key detected. Attempting keyless translation engine fallback.`);
      
      const sl = mode === "en-to-bn" ? "en" : "bn";
      const tl = mode === "en-to-bn" ? "bn" : "en";
      
      let translationText = "";
      let notesText = "Set your Gemini API Key in Settings > Secrets to unlock full AI grammar breakdowns and detailed linguistic insights for every phrase!";

      try {
        // Try dynamic keyless translation first so it works for ANY manual input beautifully!
        const result = await fetchTranslation(cleanInput, sl, tl);
        if (result && result !== cleanInput) {
          translationText = result;
          notesText = `💡 **লাইভ ডেমো অনুবাদ সফল!**\n\nসার্ভারটি গুগল ট্রান্সলেশন গেটওয়ে ব্যবহার করে এই অনুবাদটি সম্পন্ন করেছে।\n\nআপনি যদি বাক্যটির গভীর ব্যাকরণগত বিশ্লেষণ ও উচ্চারণ নোটস (এআই লার্নিং মেট্রিক্স) চান, তাহলে স্ক্রিনের উপরের 'Settings > Secrets' প্যানেলে 'GEMINI_API_KEY' যুক্ত করুন।`;
        } else {
          throw new Error("Translation match same as source");
        }
      } catch (err: any) {
        console.log(`[Keyless Translator Fallback] Could not complete keyless translation: ${err.message}. Relying on presets.`);
        
        // Basic offline presets
        const lowercaseInput = cleanInput.toLowerCase().replace(/[.,?!]/g, "").trim();
        const offlineTranslations: Record<string, { translation: string, notes: string }> = {
          "how are you": {
            translation: "আপনি কেমন আছেন?",
            notes: "Vocabulary breakdown:\n• How - কেমন\n• Are - হন\n• You - আপনি/তুমি\n\nThis is a common polite greeting in Bengali! 'আপনি' (apni) is formal/respectful, while 'তুমি' (tumi) is informal for friends."
          },
          "consistency is the key to mastering any language": {
            translation: "যেকোনো ভাষায় পারদর্শী হওয়ার চাবিকাঠি হলো ধারাবাহিকতা।",
            notes: "Vocabulary breakdown:\n• Consistency - ধারাবাহিকতা\n• Key - চাবিকাঠি\n• Mastering - পারদর্শী হওয়া\n• Language - ভাষা"
          },
          "a resilient mindset helps you conquer lifes setbacks": {
            translation: "একটি স্থিতিস্থাপক মানসিকতা আপনাকে জীবনের বিপর্যয় বা বাধা জয় করতে সাহায্য করে।",
            notes: "Vocabulary breakdown:\n• Resilient - স্থিতিস্থাপক / স্থিতিশীল\n• Mindset - মানসিকতা\n• Conquer - জয় করা\n• Setbacks - বিপর্যয় বা বাধা"
          },
          "the presentation of his work was meticulous and elegant": {
            translation: "তার কাজের উপস্থাপনা অত্যন্ত নিখুঁত এবং মার্জিত ছিল।",
            notes: "Vocabulary breakdown:\n• Presentation - উপস্থাপনা\n• Meticulous - অতি যত্নশীল / নিখুঁত\n• Elegant - মার্জিত / নান্দনিক"
          },
          "জ্ঞানই শক্তি এবং শিক্ষা হলো উন্নতির চাবিকাঠি": {
            translation: "Knowledge is power and education is the key to progress.",
            notes: "শব্দার্থ বিশ্লেষণ (Bengali to English):\n• জ্ঞানই (Knowledge - with positive emphasis 'ই')\n• শক্তি (Power / Strength)\n• শিক্ষা (Education)\n• উন্নতি (Progress / Development / Improvement)\n• চাবিকাঠি (Key / Gateway)"
          },
          "আমি প্রতিদিন নতুন ইংরেজি শব্দ শিখতে ভালোবাসি": {
            translation: "I love learning new English words every day.",
            notes: "শব্দার্থ বিশ্লেষণ (Bengali to English):\n• আমি (I)\n• প্রতিদিন (Every day)\n• নতুন (New)\n• ইংরেজি (English)\n• শব্দ (Words / Vocabulary)\n• শিখতে (To learn)\n• ভালোবাসি (I love / I like)"
          },
          "ধৈর্য ও কঠোর পরিশ্রম অবশেষে সফলতা বয়ে আনে": {
            translation: "Patience and hard work finally bring success.",
            notes: "শব্দার্থ বিশ্লেষণ (Bengali to English):\n• ধৈর্য (Patience / Perseverance)\n• কঠোর পরিশ্রম (Hard work / Diligent efforts)\n• অবশেষে (Finally / Eventually / Ultimately)\n• সফলতা (Success)\n• বয়ে আনে (Brings / Yields)"
          }
        };

        if (offlineTranslations[lowercaseInput]) {
          translationText = offlineTranslations[lowercaseInput].translation;
          notesText = offlineTranslations[lowercaseInput].notes;
        } else {
          // Fallback for custom queries
          if (mode === "en-to-bn") {
            const matched = LOCAL_WORDS.find(w => cleanInput.toLowerCase().includes(w.word.toLowerCase()));
            if (matched) {
              translationText = `[অফলাইন ডেমো] এই ইংরেজি বাক্যের শব্দ বা উপাদানটি অফলাইন তালিকায় মিলেছে। বাক্যটি: "${matched.word}" যার বাংলা: "${matched.bengaliMeaning}"।`;
              notesText = `শব্দার্থ নোট (Offline matched keyword):\n${matched.word} (${matched.partOfSpeech}) - ${matched.bengaliMeaning}\nIPA: ${matched.ipa}\n\nইংরেজির জন্য সংজ্ঞা:\n"${matched.definition}"\n\nঅনুগ্রহ করে Settings > Secrets প্যানেলে Gemini API Key সেট করুন লাইভ অনুমাদের জন্য।`;
            } else {
              translationText = `[অফলাইন ডেমো] আপনার ইনপুট কৃত ইংরেজি বাক্য: "${cleanInput}"। এপিআই কী অনুপস্থিত থাকায় লাইভ অনুবাদ ডেমো দেখতে পাচ্ছেন।`;
              notesText = `লাইভ কানেক্টিভিটি গাইড:\n১. স্ক্রিনের উপরের 'Settings > Secrets' এ যান।\n২. 'GEMINI_API_KEY' ভেরিয়েবলে আপনার সঠিক API কী দিন।\n৩. পুরো ইন্টারনেট ভিত্তিক অনুবাদ ও ব্যাকরণ নোট সচল করুন!`;
            }
          } else {
            translationText = `[Offline Demo] Entered Bengali text: "${cleanInput}". Please connect a valid Gemini API Key to translate dynamically.`;
            notesText = `How to activate AI Translation:\n1. Click on Settings > Secrets (top-right developer menu).\n2. Add your 'GEMINI_API_KEY' variable.\n3. Instantly translate any phrase or text from Bengali to English and get real learning charts!`;
          }
        }
      }

      return res.json({
        success: true,
        translation: translationText,
        notes: notesText,
        isOffline: true,
        message: "Offline Translation Emulator Mode."
      });
    }

    try {
      const prompt = `Translate the following segment accurately from ${sourceLang} to ${targetLang}. 
Maintain the native flavor, contextual gravity, and pristine grammatical accuracy of both languages.

Text Segment:
"${cleanInput}"

Produce a structured JSON output with the exact properties "translation" and "notes". 
In the "notes" property, provide concise, engaging grammatical annotation, bulleted vocabulary breakdown of hard terms, or pronunciation feedback (in standard markdown format) designed to help a bilingual learner master the phraseology. Keep the formatting spacious and visually refined.

Strictly adhere to the response schema and output valid JSON. Do not wrap the JSON output in markdown blocks.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translation: { type: Type.STRING },
              notes: { type: Type.STRING, description: "Vocabulary notes or grammatical insights in precise Markdown format" }
            },
            required: ["translation", "notes"]
          }
        }
      });

      const textResult = response.text;
      if (!textResult) {
        throw new Error("Empty translation text result returned from model.");
      }

      const parsed = JSON.parse(textResult);
      res.json({
        success: true,
        translation: parsed.translation,
        notes: parsed.notes,
        isOffline: false
      });
    } catch (err: any) {
      console.error("Gemini translation transaction failed, falling back securely:", err.message);
      res.json({
        success: true,
        translation: mode === "en-to-bn" 
          ? `[অফলাইন মোড] সাময়িক নেটওয়ার্ক বা সংযোগ বিভ্রান্তি। অনুবাদ করা যায়নি। ইনপুট: "${cleanInput}"` 
          : `[Offline Fallback] Temporary network delay. Translation incomplete for: "${cleanInput}"`,
        notes: `Error logs: ${err.message}. Please check your internet connectivity or key balance.`,
        isOffline: true
      });
    }
  });

  // 2.8 Bengali and English TTS Audio Proxy to completely bypass client CORS & iframe restrictions
  app.get("/api/tts", async (req, res) => {
    const textParam = req.query.text;
    const langParam = req.query.lang || "bn";

    if (!textParam || typeof textParam !== "string" || !textParam.trim()) {
      return res.status(400).send("A text parameter is required for TTS.");
    }

    const text = textParam.trim();
    const lang = typeof langParam === "string" ? langParam.trim() : "bn";

    try {
      const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(text)}`;
      
      const fetchResponse = await fetch(googleTtsUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://translate.google.com/"
        }
      });

      if (!fetchResponse.ok) {
        throw new Error(`Google TTS endpoint responded with status code: ${fetchResponse.status}`);
      }

      const contentType = fetchResponse.headers.get("content-type") || "audio/mpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400"); // cache audio locally/locally in browser for 24h

      const buffer = await fetchResponse.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (err: any) {
      console.error("Express TTS proxy error:", err.message);
      res.status(500).send(`Failed to generate TTS stream: ${err.message}`);
    }
  });

  // 3. Multi-device sync save
  app.post("/api/sync/save", async (req, res) => {
    const { syncId, data } = req.body;
    if (!syncId || !data) {
      return res.status(400).json({ success: false, message: "Missing syncId or data payload" });
    }
    await saveSyncSession(syncId, data);
    res.json({ success: true, message: "Vocabulary, stats, and progression synced to cloud" });
  });

  // 4. Multi-device sync load
  app.get("/api/sync/load/:syncId", async (req, res) => {
    const { syncId } = req.params;
    const stored = await getSyncSession(syncId);
    if (!stored) {
      return res.status(404).json({ success: false, message: "Sync code not found. Make sure the spelling is exact!" });
    }
    res.json({ success: true, data: stored.data, updatedAt: stored.updatedAt });
  });

  // Active Vite Integration
  if (process.env.VERCEL) {
    console.log(`[Server] Serverless environment detected. Serving API endpoints from Vercel.`);
    return;
  }

  // Find dist directory robustly, ensuring index.html exists
  let distPath = path.join(process.cwd(), "dist");
  if (!fs.existsSync(path.join(distPath, "index.html"))) {
    if (fs.existsSync(path.join(__dirname, "index.html"))) {
      distPath = __dirname;
    } else if (fs.existsSync(path.join(__dirname, "dist", "index.html"))) {
      distPath = path.join(__dirname, "dist");
    }
  }
  const hasDist = fs.existsSync(path.join(distPath, "index.html"));

  if (process.env.NODE_ENV !== "production" || !hasDist) {
    console.log(`[Server] Starting in DEVELOPMENT/DEV mode (Initializing Vite Dev Middleware asynchronously)`);
    let viteDevServer: any = null;
    const viteInitializationPromise = import("vite")
      .then((viteModule) => {
        return viteModule.createServer({
          server: { middlewareMode: true },
          appType: "spa",
        });
      })
      .then(vite => {
        viteDevServer = vite;
        console.log(`[Vite] Dev server middleware initialized successfully!`);
        return vite;
      })
      .catch(err => {
        console.error(`[Vite] Failed to start Vite dev server middleware:`, err);
      });

    app.use(async (req, res, next) => {
      if (!viteDevServer) {
        console.log(`[Server] Holdup: request "${req.url}" is waiting for Vite dev server initialization...`);
        await viteInitializationPromise;
      }
      if (viteDevServer) {
        viteDevServer.middlewares(req, res, next);
      } else {
        res.status(503).send("Vite Development Server is starting up. Please reload in a few seconds.");
      }
    });
  } else {
    console.log(`[Server] Starting in PRODUCTION mode (Serving static assets from ${distPath})`);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server running on http://localhost:${PORT}`);
    
    // Warm up the background generation buffers for each difficulty level asynchronously
    setTimeout(() => {
      const difficulties = ["basic", "intermediate", "advanced", "ielts", "gre"];
      console.log(`[Background Buffer] Initiating asynchronous background replenishment on boot for: ${difficulties.join(', ')}...`);
      difficulties.forEach(diff => {
        replenishBuffer(diff).catch(err => {
          console.error(`[Background Buffer] Initial replenishment failed for "${diff}":`, err);
        });
      });
    }, 1500);
  });
}

startServer();

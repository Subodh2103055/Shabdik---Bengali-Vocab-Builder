// Utility for crystal-clear, readable English & Bengali pronunciation guides

export interface PronunciationGuide {
  word: string;
  ipa: string;
  bengaliPhonetic: string;
  respelling: string;
  syllables?: string;
}

// Comprehensive dictionary of standard vocabulary pronunciations
const KNOWN_PRONUNCIATIONS: Record<string, { bn: string; respelling: string }> = {
  // Common & Daily words
  "culpable": { bn: "কালপাব্‌ল", respelling: "KUL-puh-buhl" },
  "auspicious": { bn: "অস্পিশাস", respelling: "aw-SPISH-uhs" },
  "cognizant": { bn: "কগনিজ্যান্ট", respelling: "KOG-ni-zuhnt" },
  "capricious": { bn: "ক্যাপ্রিশাস", respelling: "kuh-PRISH-uhs" },
  "lethargic": { bn: "লেথারজিক", respelling: "luh-THAHR-jik" },
  "disruptive": { bn: "ডিসরাপ্‌টিভ", respelling: "dis-RUP-tiv" },
  "resilient": { bn: "রিজিলিয়েন্ট", respelling: "ri-ZIL-yuhnt" },
  "meticulous": { bn: "মেটিকিউলাস", respelling: "meh-TIK-yuh-luhs" },
  "benevolent": { bn: "বেনেভোলেন্ট", respelling: "buh-NEV-uh-luhnt" },
  "pragmatic": { bn: "প্র্যাগম্যাটিক", respelling: "prag-MAT-ik" },
  "superfluous": { bn: "সুপারফ্লুয়াস", respelling: "soo-PER-floo-uhs" },
  "eloquent": { bn: "এলোকয়েন্ট", respelling: "EL-uh-kwuhnt" },
  "ambiguous": { bn: "অ্যাম্বিগুয়াস", respelling: "am-BIG-yoo-uhs" },
  "amicable": { bn: "অ্যামিক্যাবল", respelling: "AM-ih-kuh-buhl" },
  "quintessential": { bn: "কুইনটেসেনশিয়াল", respelling: "kwin-tuh-SEN-shuhl" },
  "aesthetic": { bn: "এস্থেটিক", respelling: "es-THET-ik" },
  "alacrity": { bn: "অ্যালাক্রিটি", respelling: "uh-LAK-rih-tee" },
  "candid": { bn: "ক্যান্ডিড", respelling: "KAN-did" },
  "diligent": { bn: "ডিলিজেন্ট", respelling: "DIL-ih-juhnt" },
  "ephemeral": { bn: "ইফেমারাল", respelling: "ih-FEM-er-uhl" },
  "equanimity": { bn: "ইকোয়ানিম্যিটি", respelling: "ee-kwuh-NIM-ih-tee" },
  "fastidious": { bn: "ফ্যাসটিডিয়াস", respelling: "fa-STID-ee-uhs" },
  "gregarious": { bn: "গ্রেগেরিয়াস", respelling: "grih-GAIR-ee-uhs" },
  "impeccable": { bn: "ইমপেকাবল", respelling: "im-PEK-uh-buhl" },
  "insatiable": { bn: "ইনস্যাশিয়েবল", respelling: "in-SAY-shuh-buhl" },
  "judicious": { bn: "জুডিশিয়াস", respelling: "joo-DISH-uhs" },
  "mitigate": { bn: "মিটিগেট", respelling: "MIT-ih-gayt" },
  "nostalgia": { bn: "নস্টালজিয়া", respelling: "nah-STAL-juh" },
  "obsolete": { bn: "অবসোলেট", respelling: "ahb-suh-LEET" },
  "pensive": { bn: "পেনসিভ", respelling: "PEN-siv" },
  "scrupulous": { bn: "স্ক্রুপুলাস", respelling: "SKROO-pyuh-luhs" },
  "taciturn": { bn: "ট্যাসিটার্ন", respelling: "TAS-ih-tern" },
  "ubiquitous": { bn: "ইউবিকুইটাস", respelling: "yoo-BIK-wih-tuhs" },
  "venerable": { bn: "ভেনেরাবল", respelling: "VEN-er-uh-buhl" },
  "aberration": { bn: "অ্যাবারেশন", respelling: "ab-uh-RAY-shuhn" },
  "loquacious": { bn: "লোকোয়েশাস", respelling: "loh-KWAY-shuhs" },
  "epistemic": { bn: "এপিসটেমিক", respelling: "ep-ih-STEM-ik" },
  "anachronism": { bn: "অ্যানাক্রোনিজ্‌ম", respelling: "uh-NAK-ruh-niz-uhm" },
  "versatile": { bn: "ভারসাটাইল", respelling: "VER-suh-tyl" },
  "coherent": { bn: "কোহেরেন্ট", respelling: "koh-HEER-uhnt" },
  "fluctuate": { bn: "ফ্লাকচুয়েট", respelling: "FLUK-choo-ayt" },
  "consolidate": { bn: "কনসলিডেট", respelling: "kuhn-SAHL-ih-dayt" },
  "analyze": { bn: "অ্যানালাইজ", respelling: "AN-uh-lyz" },
  "serendipity": { bn: "সেরেন্ডিপিটি", respelling: "ser-uhn-DIP-ih-tee" },
  "epiphany": { bn: "এপিফ্যানি", respelling: "ih-PIF-uh-nee" },
  "tenacious": { bn: "টেনেসিয়াস", respelling: "tuh-NAY-shuhs" },
  "profound": { bn: "প্রোফাউন্ড", respelling: "pruh-FOWND" },
  "empathy": { bn: "এমপ্যাথি", respelling: "EM-puh-thee" },
  "lucid": { bn: "লুসিড", respelling: "LOO-sid" },
  "subtle": { bn: "সাট্‌ল", respelling: "SUT-uhl" },
  "paradox": { bn: "প্যারাডক্স", respelling: "PAIR-uh-doks" },
  "euphoria": { bn: "ইউফোরিয়া", respelling: "yoo-FOR-ee-uh" },
  "mellifluous": { bn: "মেলিফ্লুয়াস", respelling: "muh-LIF-loo-uhs" },
  "petrichor": { bn: "পেট্রিকোর", respelling: "PET-rih-kor" },
  "sonorous": { bn: "সোনোরস", respelling: "SAHN-er-uhs" },
  "solitude": { bn: "সলিটিউড", respelling: "SAHL-ih-tood" },
  "oblivion": { bn: "অবলিভিয়ন", respelling: "uh-BLIV-ee-uhn" },
  "halcyon": { bn: "হ্যালসিয়ন", respelling: "HAL-see-uhn" },
  "catharsis": { bn: "ক্যাথারসিস", respelling: "kuh-THAR-sis" },
  "enigma": { bn: "এনিগমা", respelling: "ih-NIG-muh" },
  "nostalgic": { bn: "নস্টালজিক", respelling: "nah-STAL-jik" },
  "luminescent": { bn: "লুমিনেসেন্ট", respelling: "loo-mih-NES-uhnt" },
  "luminous": { bn: "লুমিনাস", respelling: "LOO-mih-nuhs" },
  "resilience": { bn: "রিজিলিয়েন্স", respelling: "ri-ZIL-yuhns" },
  "serenity": { bn: "সেরেনিটি", respelling: "suh-REN-ih-tee" },
  "tranquil": { bn: "ট্র্যাঙ্কুইল", respelling: "TRAN-kwil" },
  "gossamer": { bn: "গসামার", respelling: "GAHS-uh-mer" },
  "panacea": { bn: "প্যানাসিয়া", respelling: "pan-uh-SEE-uh" },
  "labyrinth": { bn: "ল্যাবাইরিংথ", respelling: "LAB-uh-rinth" },
  "incandescent": { bn: "ইনক্যান্ডেসেন্ট", respelling: "in-kan-DES-uhnt" },
  "ethereal": { bn: "ইথেরিয়াল", respelling: "ih-THEER-ee-uhl" },
  "cascade": { bn: "ক্যাসকেড", respelling: "kas-KAYD" },
  "effervescent": { bn: "এফারভেসেন্ট", respelling: "ef-er-VES-uhnt" },
  "clandestine": { bn: "ক্ল্যান্ডেস্টিন", respelling: "klan-DES-tin" },
  "surreptitious": { bn: "সারেপটিশাস", respelling: "sur-uhp-TISH-uhs" },
  "quintessence": { bn: "কুইনটেসেন্স", respelling: "kwin-TES-uhns" },
  "sonnet": { bn: "সনেট", respelling: "SAHN-it" },
  "whimsical": { bn: "হুইমজিক্যাল", respelling: "WIM-zih-kuhl" },
  "nefarious": { bn: "নেফেরিয়াস", respelling: "nih-FAIR-ee-uhs" },
  "audacious": { bn: "অডেশাস", respelling: "aw-DAY-shuhs" },
  "pristine": { bn: "প্রিস্টিন", respelling: "PRIS-teen" },
  "ineffable": { bn: "ইনএফাবল", respelling: "in-EF-uh-buhl" },
  "somnambulist": { bn: "সোমনাম্বুলিস্ট", respelling: "sahm-NAM-byuh-list" },
  "serenade": { bn: "সেরেনেড", respelling: "ser-uh-NAYD" },
  "surreal": { bn: "সাররিয়েল", respelling: "suh-REEL" },
  "zeitgeist": { bn: "জাইটগাইস্ট", respelling: "ZYT-gyst" },
  "labyrinthine": { bn: "ল্যাবাইরিংথাইন", respelling: "lab-uh-RIN-thin" },
  "paradigm": { bn: "প্যারাডাইম", respelling: "PAIR-uh-dym" },
  "sycophant": { bn: "সিকোফ্যান্ট", respelling: "SIK-uh-fuhnt" },
  "perfunctory": { bn: "পারফাঙ্কটরি", respelling: "per-FUNGK-tuh-ree" },
  "quixotic": { bn: "কুইক্সটিক", respelling: "kwik-SAHT-ik" },
  "anomaly": { bn: "অ্যানোমালি", respelling: "uh-NAHM-uh-lee" },
  "cacophony": { bn: "ক্যাকোফনি", respelling: "kuh-KAHF-uh-nee" },
  "esoteric": { bn: "এসোটেরিক", respelling: "es-uh-TAIR-ik" },
  "juxtaposition": { bn: "জ্যাক্সটাপজিশন", respelling: "juhk-stuh-puh-ZISH-uhn" },
  "magnanimous": { bn: "ম্যাগনানিমাস", respelling: "mag-NAN-ih-muhs" },
  "nonchalant": { bn: "ননশালান্ট", respelling: "nahn-shuh-LAHNT" },
  "ostentatious": { bn: "অস্টেনটেশাস", respelling: "ahs-ten-TAY-shuhs" },
  "plethora": { bn: "প্লেথোরা", respelling: "PLETH-er-uh" },
  "raconteur": { bn: "রেকনটার", respelling: "ra-kahn-TER" },
  "sanguine": { bn: "স্যাঙ্গুইন", respelling: "SANG-gwin" },
  "ubiquity": { bn: "ইউবিকুইটি", respelling: "yoo-BIK-wih-tee" },
  "vicarious": { bn: "ভাইকেরিয়াস", respelling: "vy-KAIR-ee-uhs" },
  "zealous": { bn: "জেলোস", respelling: "ZEL-uhs" },
  "hell": { bn: "হেল", respelling: "HEL" },
  "heaven": { bn: "হেভেন", respelling: "HEV-uhn" },
  "love": { bn: "লাভ", respelling: "LUV" },
  "water": { bn: "ওয়াটার", respelling: "WAW-ter" },
  "school": { bn: "স্কুল", respelling: "SKOOL" },
  "home": { bn: "হোম", respelling: "HOHM" },
  "friend": { bn: "ফ্রেন্ড", respelling: "FREND" },
  "happy": { bn: "হ্যাপি", respelling: "HAP-ee" },
  "sad": { bn: "স্যাড", respelling: "SAD" },
  "life": { bn: "লাইফ", respelling: "LYF" },
  "peace": { bn: "পিস", respelling: "PEES" },
  "work": { bn: "ওয়ার্ক", respelling: "WERK" },
  "learn": { bn: "লার্ন", respelling: "LERN" }
};

// IPA to readable Bengali phonetic transliterator for any dynamic word
function transliterateIpaToBengali(ipa: string, word: string): string {
  if (!ipa) return word;
  
  // Clean ipa
  let clean = ipa
    .replace(/^\/+|\/+$/g, '')
    .replace(/[ˈˌ']/g, '')
    .trim();

  // Common phoneme substitutions to Bengali sounds
  const phonemeMap: [RegExp, string][] = [
    [/kʌl\.pə\.bəl/gi, "কালপাব্‌ল"],
    [/spɪʃ\.əs/gi, "স্পিশাস"],
    [/kɒɡ\.nɪ\.zənt/gi, "কগনিজ্যান্ট"],
    [/kəˈprɪʃ/gi, "ক্যাপ্রিশ"],
    [/tʃ/g, "চ"],
    [/dʒ/g, "জ"],
    [/ʃ/g, "শ"],
    [/ʒ/g, "ঝ"],
    [/θ/g, "থ"],
    [/ð/g, "দ"],
    [/ŋ/g, "ং"],
    [/j/g, "ই"],
    [/w/g, "ওয়"],
    [/v/g, "ভ"],
    [/b/g, "ব"],
    [/p/g, "প"],
    [/d/g, "ড"],
    [/t/g, "ট"],
    [/ɡ|g/g, "গ"],
    [/k/g, "ক"],
    [/f/g, "ফ"],
    [/s/g, "স"],
    [/z/g, "জ"],
    [/h/g, "হ"],
    [/m/g, "ম"],
    [/n/g, "ন"],
    [/l/g, "ল"],
    [/r/g, "র"],
    [/aɪ/g, "আই"],
    [/eɪ/g, "এই"],
    [/ɔɪ/g, "অয়"],
    [/aʊ/g, "আউ"],
    [/əʊ|oʊ/g, "ও"],
    [/ɪə/g, "ইয়ার"],
    [/eə/g, "এয়ার"],
    [/ʊə/g, "উয়ার"],
    [/iː/g, "ঈ"],
    [/ɪ/g, "ই"],
    [/e/g, "এ"],
    [/æ/g, "অ্যা"],
    [/ɑː/g, "আ"],
    [/ɒ|ɔː/g, "অ"],
    [/ʊ/g, "উ"],
    [/uː/g, "ঊ"],
    [/ʌ/g, "আ"],
    [/ɜː|ɜ/g, "আর্"],
    [/ə/g, "আ"]
  ];

  // If known mapping is not found, derive simple syllabic pronunciation
  const cleanWord = word.toLowerCase();
  if (KNOWN_PRONUNCIATIONS[cleanWord]) {
    return KNOWN_PRONUNCIATIONS[cleanWord].bn;
  }

  // Fallback to syllabified Bengali sound
  return deriveBengaliPronunciationFromWord(word);
}

// Heuristic fallback for any arbitrary English word to standard Bengali pronunciation
function deriveBengaliPronunciationFromWord(word: string): string {
  const lc = word.toLowerCase();
  if (KNOWN_PRONUNCIATIONS[lc]) {
    return KNOWN_PRONUNCIATIONS[lc].bn;
  }

  // Standard English phonetic approximations into Bengali
  let res = lc;
  res = res.replace(/tion\b/g, "শন");
  res = res.replace(/sion\b/g, "শন");
  res = res.replace(/cious\b/g, "শাস");
  res = res.replace(/tious\b/g, "শাস");
  res = res.replace(/ous\b/g, "আস");
  res = res.replace(/ble\b/g, "বল");
  res = res.replace(/cal\b/g, "কাল");
  res = res.replace(/ment\b/g, "মেন্ট");
  res = res.replace(/ance\b/g, "অ্যান্স");
  res = res.replace(/ence\b/g, "এন্স");
  res = res.replace(/ity\b/g, "ইটি");
  res = res.replace(/ful\b/g, "ফুল");
  res = res.replace(/less\b/g, "লেস");
  res = res.replace(/ing\b/g, "ইং");
  res = res.replace(/ph/g, "ফ");
  res = res.replace(/th/g, "থ");
  res = res.replace(/sh/g, "শ");
  res = res.replace(/ch/g, "চ");
  res = res.replace(/ck/g, "ক");
  res = res.replace(/qu/g, "কোয়া");
  res = res.replace(/ea/g, "ঈ");
  res = res.replace(/ee/g, "ঈ");
  res = res.replace(/oo/g, "উ");
  res = res.replace(/ou/g, "আউ");
  res = res.replace(/ow/g, "আও");
  res = res.replace(/ai/g, "এই");
  res = res.replace(/ay/g, "এই");
  res = res.replace(/a/g, "আ");
  res = res.replace(/e/g, "এ");
  res = res.replace(/i/g, "ই");
  res = res.replace(/o/g, "ও");
  res = res.replace(/u/g, "ইউ");
  res = res.replace(/b/g, "ব");
  res = res.replace(/c/g, "ক");
  res = res.replace(/d/g, "ড");
  res = res.replace(/f/g, "ফ");
  res = res.replace(/g/g, "গ");
  res = res.replace(/h/g, "হ");
  res = res.replace(/j/g, "জ");
  res = res.replace(/k/g, "ক");
  res = res.replace(/l/g, "ল");
  res = res.replace(/m/g, "ম");
  res = res.replace(/n/g, "ন");
  res = res.replace(/p/g, "প");
  res = res.replace(/r/g, "র");
  res = res.replace(/s/g, "স");
  res = res.replace(/t/g, "ট");
  res = res.replace(/v/g, "ভ");
  res = res.replace(/w/g, "ওয়");
  res = res.replace(/x/g, "ক্স");
  res = res.replace(/y/g, "ওয়াই");
  res = res.replace(/z/g, "জ");

  return res;
}

// Convert arbitrary English word / IPA to human-readable phonetic respelling (e.g. KUL-puh-buhl)
function deriveEnglishRespelling(word: string, ipa: string): string {
  const lc = word.toLowerCase();
  if (KNOWN_PRONUNCIATIONS[lc]) {
    return KNOWN_PRONUNCIATIONS[lc].respelling;
  }

  // Generate readable syllables
  const cleanIpa = (ipa || "").replace(/^\/+|\/+$/g, '').trim();
  if (!cleanIpa) {
    return word.toUpperCase();
  }

  // Format syllables if IPA has dots: e.g. /ˈkʌl.pə.bəl/ -> "KUL-puh-buhl"
  const syllables = cleanIpa.split('.');
  if (syllables.length > 1) {
    return syllables
      .map(s => {
        let text = s.replace(/[ˈˌ']/g, '').trim();
        // Replace IPA symbols with phonetic letters
        text = text
          .replace(/kʌl/g, "KUL")
          .replace(/pə/g, "puh")
          .replace(/bəl/g, "buhl")
          .replace(/spɪʃ/g, "SPISH")
          .replace(/əs/g, "uhs")
          .replace(/kɒɡ/g, "KOG")
          .replace(/nɪ/g, "ni")
          .replace(/zənt/g, "zuhnt")
          .replace(/iː/g, "ee")
          .replace(/ɪ/g, "ih")
          .replace(/eɪ/g, "ay")
          .replace(/aɪ/g, "y")
          .replace(/aʊ/g, "ow")
          .replace(/ɔɪ/g, "oy")
          .replace(/əʊ|oʊ/g, "oh")
          .replace(/ɔː|ɒ/g, "aw")
          .replace(/uː/g, "oo")
          .replace(/ʊ/g, "uu")
          .replace(/ʌ|ə/g, "uh")
          .replace(/ʃ/g, "sh")
          .replace(/tʃ/g, "ch")
          .replace(/dʒ/g, "j")
          .replace(/θ/g, "th")
          .replace(/ð/g, "th");
        return text;
      })
      .filter(Boolean)
      .join('-');
  }

  return word.toUpperCase();
}

/**
 * Returns a complete, crystal-clear pronunciation package for any word
 */
export function getPronunciationGuide(word: string, rawIpa?: string): PronunciationGuide {
  const cleanWord = (word || "").trim();
  const lc = cleanWord.toLowerCase();
  
  // Clean and normalize IPA
  let formattedIpa = (rawIpa || "").trim();
  if (!formattedIpa) {
    formattedIpa = `/${cleanWord.toLowerCase()}/`;
  } else {
    // Ensure properly enclosed in slashes without weird inner spaces
    formattedIpa = formattedIpa.replace(/^\/+|\/+$/g, '').trim();
    formattedIpa = `/${formattedIpa}/`;
  }

  // Check known dictionary
  if (KNOWN_PRONUNCIATIONS[lc]) {
    return {
      word: cleanWord,
      ipa: formattedIpa,
      bengaliPhonetic: KNOWN_PRONUNCIATIONS[lc].bn,
      respelling: KNOWN_PRONUNCIATIONS[lc].respelling
    };
  }

  // Derive dynamic
  const bengaliPhonetic = transliterateIpaToBengali(formattedIpa, cleanWord);
  const respelling = deriveEnglishRespelling(cleanWord, formattedIpa);

  return {
    word: cleanWord,
    ipa: formattedIpa,
    bengaliPhonetic,
    respelling
  };
}

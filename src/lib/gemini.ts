import { GoogleGenAI, Type } from "@google/genai";
import { Word, Difficulty } from "../types";

export const getGeminiClient = (): GoogleGenAI | null => {
  let key = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
  if (!key) {
    key = ((import.meta as any).env?.VITE_GEMINI_API_KEY || "").trim();
  }
  
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.slice(1, -1).trim();
  }
  if (key.startsWith("'") && key.endsWith("'")) {
    key = key.slice(1, -1).trim();
  }

  if (!key || key === "MY_GEMINI_API_KEY") {
    console.log("[Gemini Client] No valid VITE_GEMINI_API_KEY found in import.meta.env.");
    return null;
  }
  return new GoogleGenAI({ 
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
};

/**
 * Perform translation directly via Gemini 3.5 Flash on the client-side
 */
export async function translateTextDirect(text: string, mode: 'en-to-bn' | 'bn-to-en'): Promise<{ translation: string; notes: string }> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error("Gemini client is not configured on the frontend. Please declare VITE_GEMINI_API_KEY in the Settings > Secrets panel.");
  }
  
  const srcLang = mode === 'en-to-bn' ? "English" : "Bengali";
  const trgLang = mode === 'en-to-bn' ? "Bengali" : "English";
  
  const systemPrompt = `You are an expert bilingual AI Translator specializing in translating between English and Bengali.
Your goal is to provide a highly authentic, natural translation, along with structured syntactic, breakdown learning notes (under "notes").

You must strictly structure the "notes" field as standard Markdown using these exact headings:

### Grammatical Insights:
* [Detailed breakdown of structural particles, verbs, and pronouns with English phonetics / romanization]

### Vocabulary Breakdown:
* [Word-by-word literal translations mapping the English word to the Bengali word]

### Pronunciation Tips:
* [Clear phonetic breakdown matching words to everyday English sounds (e.g., 'Shob' as in 'robe')]`;

  const prompt = `Translate the following text from ${srcLang} to ${trgLang}:
"${text}"

Provide the translation and notes in JSON format. Ensure the notes strictly follow the requested Markdown structure with the three specified headings (### Grammatical Insights:, ### Vocabulary Breakdown:, and ### Pronunciation Tips:) and detailed custom contents for this specific text translation.`;

  const response = await client.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          translation: { type: Type.STRING },
          notes: { type: Type.STRING }
        },
        required: ["translation", "notes"]
      }
    }
  });

  const parsed = JSON.parse(response.text || "{}");
  return {
    translation: parsed.translation || "",
    notes: parsed.notes || ""
  };
}

/**
 * Perform a dictionary analysis for a general English word query
 */
export async function searchWordDirect(wordQuery: string): Promise<Word & { isInvalidWord?: boolean; message?: string }> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error("Gemini client is not configured on the frontend. Please declare VITE_GEMINI_API_KEY in the Settings > Secrets panel.");
  }

  const prompt = `Perform a high-fidelity dictionary analysis for the exact English word: "${wordQuery}".
If the input "${wordQuery}" is NOT a real or valid English word, set isInvalidWord to true and return a helpful message in 'message'.
Otherwise, set isInvalidWord to false and specify phonetic spelling (IPA), Bengali meaning, a simple English definition, a simple Bengali definition, a contextual example sentence, its Bengali example translation, synonyms array, difficulty level ("basic", "intermediate", "advanced", "ielts", "gre"), and part of speech.`;

  const response = await client.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isInvalidWord: { type: Type.BOOLEAN },
          message: { type: Type.STRING },
          word: { type: Type.STRING },
          ipa: { type: Type.STRING },
          bengaliMeaning: { type: Type.STRING },
          definition: { type: Type.STRING },
          definitionBengali: { type: Type.STRING },
          exampleSentence: { type: Type.STRING },
          exampleSentenceBengali: { type: Type.STRING },
          synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
          difficulty: { type: Type.STRING, enum: ["basic", "intermediate", "advanced", "ielts", "gre"] },
          partOfSpeech: { type: Type.STRING }
        },
        required: ["word", "ipa", "bengaliMeaning", "definition", "definitionBengali", "exampleSentence", "exampleSentenceBengali", "synonyms", "difficulty", "partOfSpeech"]
      }
    }
  });

  const parsed = JSON.parse(response.text || "{}");
  return parsed as Word & { isInvalidWord?: boolean; message?: string };
}

/**
 * Generate a new random word of a specified difficulty
 */
export async function generateWordDirect(difficulty: Difficulty, excludeWords: string[]): Promise<Word> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error("Gemini client is not configured on the frontend. Please declare VITE_GEMINI_API_KEY in the Settings > Secrets panel.");
  }

  const prompt = `Select a brilliant, high-value English vocabulary word with difficulty: "${difficulty}".
Exclude these words from your selection: ${excludeWords.join(", ")}.
Provide its phonetic spelling (IPA), Bengali meaning, a simple English definition, a simple Bengali definition, a contextual example sentence, its Bengali example translation, synonyms array, and part of speech.`;

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
          difficulty: { type: Type.STRING, enum: ["basic", "intermediate", "advanced", "ielts", "gre"] },
          partOfSpeech: { type: Type.STRING }
        },
        required: ["word", "ipa", "bengaliMeaning", "definition", "definitionBengali", "exampleSentence", "exampleSentenceBengali", "synonyms", "difficulty", "partOfSpeech"]
      }
    }
  });

  const parsed = JSON.parse(response.text || "{}");
  return parsed as Word;
}

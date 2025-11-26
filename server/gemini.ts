import { GoogleGenAI } from "@google/genai";

const gemini = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

// Cache responses untuk avoid redundant API calls
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour

// Simple Indonesian to English translation for search queries
function translateQueryToEnglish(query: string): string {
  const translations: Record<string, string> = {
    'presiden': 'president', 'presiden indonesia': 'president of indonesia',
    'siapa': 'who', 'apa': 'what', 'kapan': 'when', 'dimana': 'where', 'berapa': 'how much',
    'berita': 'news', 'terbaru': 'latest', 'hari ini': 'today',
    'cuaca': 'weather', 'harga': 'price', 'persib': 'persib bandung',
    'indonesia': 'indonesia', 'jakarta': 'jakarta', 'surabaya': 'surabaya',
  };
  
  let englishQuery = query.toLowerCase();
  for (const [id, en] of Object.entries(translations)) {
    englishQuery = englishQuery.replace(new RegExp(id, 'g'), en);
  }
  return englishQuery;
}

// Helper for fetch with timeout
async function fetchWithTimeout(url: string, timeoutMs: number = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Web search untuk queries yang memerlukan informasi real-time
async function performWebSearch(query: string): Promise<string | null> {
  try {
    // Translate Indonesian to English for better Wikipedia results
    const searchQuery = translateQueryToEnglish(query);
    console.log("🔍 Web search - Original:", query, "→ English:", searchQuery);
    
    // Try Wikipedia first (more reliable for factual queries)
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*`;
    console.log("📡 Fetching Wikipedia with English query");
    const wikiResponse = await fetchWithTimeout(wikiUrl, 5000);
    const wikiData = (await wikiResponse.json()) as any;
    const wikiResults = wikiData?.query?.search?.length || 0;
    console.log("📊 Wikipedia results:", wikiResults);
    
    if (wikiResults > 0) {
      const pageTitle = wikiData.query.search[0].title;
      console.log("📖 Found:", pageTitle);
      const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*`;
      const pageResponse = await fetchWithTimeout(pageUrl, 5000);
      const pageData = (await pageResponse.json()) as any;
      const pages = pageData?.query?.pages;
      
      if (pages) {
        const pageId = Object.keys(pages)[0];
        const extract = pages[pageId]?.extract;
        if (extract) {
          const summary = `📚 Dari Wikipedia: ${extract.substring(0, 400)}`;
          console.log("✅ SUCCESS - Wikipedia result included in Gemini prompt");
          return summary;
        }
      }
    }
    
    // Try DuckDuckGo as fallback
    const duckUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(searchQuery)}&format=json&no_html=1`;
    const duckResponse = await fetchWithTimeout(duckUrl, 5000);
    const duckData = (await duckResponse.json()) as any;
    
    if (duckData?.AbstractText) {
      const summary = `🔍 Dari web: ${duckData.AbstractText.substring(0, 400)}`;
      console.log("✅ DuckDuckGo result included");
      return summary;
    }
    
    console.log("⚠️ No search results - Gemini will answer from training data");
  } catch (error) {
    console.warn("⚠️ Web search error:", (error as any)?.message);
  }
  return null;
}

// Detect jika query butuh web search - DISABLED, using real APIs instead
function needsWebSearch(message: string): boolean {
  return false; // Web search disabled - using working real APIs (weather, crypto, etc)
}

export async function generateAIResponse(message: string, personality: string = "helpful"): Promise<string> {
  if (!gemini) {
    console.warn("⚠️ Gemini API not configured - using local fallback");
    return generateLocalFallback(message);
  }

  // Don't cache time-sensitive queries
  const isTimeSensitive = /jam|waktu|tanggal|hari|berapa|sekarang|now|today|time|date/i.test(message);

  // Check cache (skip for time-sensitive queries)
  if (!isTimeSensitive) {
    const cached = responseCache.get(message);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log("Cache hit for:", message.substring(0, 50));
      return cached.response;
    }
  }

  try {
    // Timeout 15 seconds - more forgiving for Gemini
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Gemini timeout")), 15000)
    );

    // Personality modes
    const personalityPrompts: Record<string, string> = {
      helpful: "ramah, responsif, dan suka membantu",
      formal: "profesional, formal, dan teknis",
      casual: "santai, funny, dan conversational",
      technical: "detail, technical, dan akurat tentang code/tech",
      motivational: "inspiratif, memotivasi, dan positif"
    };

    const tone = personalityPrompts[personality] || personalityPrompts.helpful;

    const systemPrompt = `Kamu adalah NOVA AI, sebuah AI assistant yang ${tone}. 
PENTING: SELALU respond dalam Bahasa Indonesia saja, tidak boleh bahasa lain apapun.
Berikan jawaban yang jelas, ringkas, informatif, dan gunakan emoji. HANYA Bahasa Indonesia!
Personality mode: ${personality}`;

    const response = await Promise.race([
      (gemini.models.generateContent as any)({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [{ text: `${systemPrompt}\n\nUser: ${message}` }]
        }]
      } as any),
      timeoutPromise
    ]);

    const text = (response as any).text || "No response generated";
    
    // Cache successful response (but not time-sensitive queries)
    if (!isTimeSensitive) {
      responseCache.set(message, { response: text, timestamp: Date.now() });
    }
    console.log("Gemini response OK [" + personality + "]:", message.substring(0, 30));
    return text;
  } catch (error: any) {
    console.warn("Gemini failed:", error?.message);
    return generateLocalFallback(message);
  }
}

// Simple local fallback when Gemini fails
function generateLocalFallback(message: string): string {
  const msg = message.toLowerCase();
  
  if (msg.includes("halo") || msg.includes("hi")) {
    return "Halo! 👋 Saya NOVA AI. Gemini sedang lambat, tapi saya bisa bantu! Apa yang ingin kamu tanya?";
  } else if (msg.includes("siapa")) {
    return "Saya NOVA AI - AI assistant gratis! Saat ini menggunakan mode offline karena Gemini API lambat. Tapi tetap bisa chat! 🤖";
  } else if (msg.includes("bagaimana")) {
    return "Tergantung konteksnya! Bisa kamu jelaskan lebih detail? Saya akan coba bantu semaksimal mungkin! 😊";
  } else if (msg.includes("apa")) {
    return "Pertanyaan bagus! Sayangnya saat ini offline mode, tapi coba tanya spesifik - mungkin saya tahu! 🧠";
  } else if (msg.includes("kapan")) {
    return "Waktu terus berjalan! 🕐 Kalau kamu maksud waktu spesifik, bisa tanya lebih detail?";
  } else if (msg.includes("berapa") || msg.includes("angka")) {
    return "Angka-angka menarik! Tapi perlu konteks lebih. Bisa kamu jelasin apa yang ingin kamu cari? 🔢";
  }
  
  return `Saya terima pesanmu: "${message.substring(0, 50)}..." 💬 Gemini API sedang offline, tapi saya di sini! Tanya lebih spesifik supaya bisa bantu lebih baik! 😊`;
}

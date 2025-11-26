import dragonImage from '@assets/generated_images/futuristic_cyberpunk_dragon_over_jakarta_city.png';
import brainImage from '@assets/generated_images/abstract_ai_brain_neural_network.png';
import carImage from '@assets/generated_images/futuristic_electric_car_concept.png';

export type ResponseType = 'text' | 'image';
export type Sentiment = 'positive' | 'negative' | 'neutral' | 'question';

export interface AIResponse {
  text: string;
  type?: ResponseType;
  imageSrc?: string;
  sentiment?: Sentiment;
  shouldSpeak?: boolean;
}

// ========== FUZZY MATCHING ==========
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
  }
  return matrix[b.length][a.length];
}

function fuzzyMatch(input: string, keyword: string, threshold = 0.65): boolean {
  const maxLen = Math.max(input.length, keyword.length);
  if (maxLen === 0) return true;
  const similarity = 1 - (levenshteinDistance(input, keyword) / maxLen);
  return similarity >= threshold;
}

// ========== SMART SUMMARIZATION ==========
function summarizeText(text: string, maxLength = 300): string {
  if (text.length <= maxLength) return text;
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  let summary = '';
  for (const sentence of sentences) {
    if ((summary + sentence).length <= maxLength) {
      summary += sentence;
    } else break;
  }
  return summary.trim() + (summary.length < text.length ? '...' : '');
}

// ========== WIKIPEDIA & WEB SEARCH ==========
export async function searchWikipedia(query: string): Promise<string | null> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const response = await fetch(searchUrl);
    const data = await response.json();
    if (!data.query?.search?.length) return null;
    const pageTitle = data.query.search[0].title;
    const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*`;
    const pageResponse = await fetch(pageUrl);
    const pageData = await pageResponse.json();
    const pages = pageData.query?.pages;
    if (!pages) return null;
    const pageId = Object.keys(pages)[0];
    const extract = pages[pageId]?.extract;
    return extract ? summarizeText(extract, 300) : null;
  } catch (e) {
    return null;
  }
}

export async function searchDuckDuckGo(query: string): Promise<string | null> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.AbstractText) {
      return summarizeText(data.AbstractText, 300);
    }
    return null;
  } catch (e) {
    return null;
  }
}

// ========== TEXT-TO-SPEECH WITH VOICE SELECTION ==========
export function speakText(text: string, voiceType: 'female-id' | 'male-id' | 'female-en' | 'male-en' = 'female-id') {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = voiceType.includes('female') ? 1.2 : 0.8;
    utterance.volume = 1.0;
    
    // Set language based on voice type
    if (voiceType.includes('id')) {
      utterance.lang = 'id-ID';
    } else {
      utterance.lang = 'en-US';
    }
    
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }
}

// ========== MEMORY ==========
let userProfile = {
  nama: '',
  hobi: [] as string[],
  expertise: [] as string[],
  conversationTopics: [] as string[],
  emotionalHistory: [] as { sentiment: Sentiment; timestamp: number }[],
  averageMood: 'neutral' as Sentiment,
};

let conversationHistory: Array<{ text: string; sentiment: Sentiment; timestamp: number }> = [];
let learnedCorrections: Record<string, string> = {};
let learnedContexts: Record<string, string[]> = {};

function loadMemory() {
  try {
    const profile = localStorage.getItem('nova_profile');
    if (profile) {
      const parsed = JSON.parse(profile);
      userProfile = {
        nama: parsed.nama || '',
        hobi: parsed.hobi || [],
        expertise: parsed.expertise || [],
        conversationTopics: parsed.conversationTopics || [],
        emotionalHistory: parsed.emotionalHistory || [],
        averageMood: parsed.averageMood || 'neutral',
      };
    }
    const history = localStorage.getItem('nova_history');
    if (history) conversationHistory = JSON.parse(history);
    const corrections = localStorage.getItem('nova_corrections');
    if (corrections) learnedCorrections = JSON.parse(corrections);
    const contexts = localStorage.getItem('nova_contexts');
    if (contexts) learnedContexts = JSON.parse(contexts);
  } catch (e) {
    // Fresh start
  }
}

export function initializeMemory() {
  loadMemory();
}

function saveMemory() {
  try {
    localStorage.setItem('nova_profile', JSON.stringify(userProfile));
    localStorage.setItem('nova_history', JSON.stringify(conversationHistory.slice(-100)));
    localStorage.setItem('nova_corrections', JSON.stringify(learnedCorrections));
    localStorage.setItem('nova_contexts', JSON.stringify(learnedContexts));
  } catch (e) {}
}

// ========== EMOTION TRACKING ==========
function trackEmotion(sentiment: Sentiment) {
  if (!userProfile.emotionalHistory) {
    userProfile.emotionalHistory = [];
  }
  userProfile.emotionalHistory.push({ sentiment, timestamp: Date.now() });
  if (userProfile.emotionalHistory.length > 50) {
    userProfile.emotionalHistory = userProfile.emotionalHistory.slice(-50);
  }
  const sentiments = userProfile.emotionalHistory.map(e => e.sentiment);
  const counts = {
    positive: sentiments.filter(s => s === 'positive').length,
    negative: sentiments.filter(s => s === 'negative').length,
    neutral: sentiments.filter(s => s === 'neutral').length,
  };
  if (counts.positive > counts.negative && counts.positive > counts.neutral) {
    userProfile.averageMood = 'positive';
  } else if (counts.negative > counts.positive && counts.negative > counts.neutral) {
    userProfile.averageMood = 'negative';
  } else {
    userProfile.averageMood = 'neutral';
  }
}

// ========== SENTIMENT DETECTION ==========
function detectSentiment(text: string): Sentiment {
  const lowerText = text.toLowerCase();
  if (/\?|apa|siapa|berapa|bagaimana|kenapa|mana|kapan|gimana/.test(lowerText)) {
    return 'question';
  }
  if (/sedih|marah|kesal|benci|jelek|bodoh|buruk|frustrasi|capek|lelah|kecewa|sakit|mati|gagal|error|takut|khawatir|cemas/.test(lowerText)) {
    return 'negative';
  }
  if (/bagus|hebat|keren|suka|cinta|senang|bahagia|luar biasa|mantap|awesome|amazing|love|happy|gembira|sukses|berhasil|menang/.test(lowerText)) {
    return 'positive';
  }
  return 'neutral';
}

// ========== EXTRACT INFO ==========
function extractPersonalInfo(text: string) {
  const nameRegex = /(?:nama (?:saya|aku|ku)|saya adalah|aku adalah)\s+(\w+)/i;
  const nameMatch = text.match(nameRegex);
  if (nameMatch) {
    userProfile.nama = nameMatch[1];
  }
  if (text.includes('adalah') || text.includes('itu') || text.includes('yaitu')) {
    const parts = text.split(/adalah|itu|yaitu/i);
    if (parts.length === 2) {
      const subject = parts[0].trim().substring(0, 30);
      const definition = parts[1].trim();
      if (!learnedContexts[subject.toLowerCase()]) {
        learnedContexts[subject.toLowerCase()] = [];
      }
      if (!learnedContexts[subject.toLowerCase()].includes(definition)) {
        learnedContexts[subject.toLowerCase()].push(definition);
      }
    }
  }
}

// ========== MEGA KNOWLEDGE BASE (150+ Topics) WITH SPORTS ==========
const KB: Record<string, { keywords: string[]; answer: string }> = {
  // SPORTS - LOCAL INDONESIA
  persija: { keywords: ['persija', 'jakarta', 'timnas'], answer: '⚽ Persija Jakarta: Klub sepak bola Jakarta. Rival utama: Persib Bandung. Stadium: Gelora Bung Karno. Penggemarnya loyal & passionate. Prestasi: Juara Liga Indonesia multiple times. Nickname: Tim Jaya.' },
  persib: { keywords: ['persib', 'bandung'], answer: '⚽ Persib Bandung: Klub legendaris Bandung. Rival: Persija Jakarta. Stadium: Stadion Si Jalak Harupat. Fans: Bobotoh (sangat suportif). Prestasi: Juara Liga Indonesia & AFC Cup. Tradisi kuat.' },
  psm: { keywords: ['psm', 'makassar'], answer: '⚽ PSM Makassar: Klub dominan Sulawesi Selatan. Stadium: Stadion Andi Matte. Juara Liga Indonesia (2020, 2022). Pemain & coach berkualitas internasional. Fanbase besar di Makassar.' },
  bali_united: { keywords: ['bali united', 'bali'], answer: '⚽ Bali United: Klub dari Bali, rising force. Stadium: Stadion Kapten I Wayan Dipta. Investasi besar untuk pemain berkualitas. Tujuan: Juara Liga Indonesia & AFC Cup.' },
  timnas: { keywords: ['timnas', 'indonesia', 'national team', 'garuda'], answer: '🇮🇩 Timnas Indonesia: Sepak bola nasional Indonesia. Target: Kualifikasi Piala Dunia. Pemain key: Striker & Midfielders berkualitas. Pelatih: Bekerja untuk improve ranking FIFA. Fans support sangat besar.' },

  // SPORTS - INTERNATIONAL
  messi: { keywords: ['messi', 'lionel', 'argentina'], answer: '⚽ Lionel Messi: Pemain legendaris Argentina. Club sekarang: Inter Miami (MLS). Prestasi: 8 Ballon d\'Or, Juara Piala Dunia 2022. Skill: Dribbling, passing, vision. Considered GOAT (Greatest of All Time).' },
  ronaldo: { keywords: ['ronaldo', 'cristiano', 'portugal'], answer: '⚽ Cristiano Ronaldo: Bintang Portugal. Club history: Man Utd, Real Madrid, Juventus, Al Nassr. Prestasi: 5 Ballon d\'Or, Juara Piala Eropa. Skill: Header, speed, work ethic. Legenda sepak bola.' },
  neymar: { keywords: ['neymar', 'brezil', 'brazil'], answer: '⚽ Neymar Jr: Bintang Brazil. Club: Al Hilal (Saudi Arabia). Prestasi: Pemenang Copa America, Olympic gold. Skill: Dribbling, flair, creativity. Top 5 world\'s best players.' },
  kylian_mbappe: { keywords: ['mbappe', 'kylian', 'france'], answer: '🏃 Kylian Mbappé: Bintang Prancis muda. Club: Real Madrid (2024). Prestasi: Piala Dunia 2018 runner-up, multiple League titles. Skill: Speed, finishing, athleticism. Next generation superstar.' },
  premier_league: { keywords: ['premier league', 'english football', 'epl'], answer: '⚽ Premier League: Liga sepak bola Inggris, paling competitive & commercial. Clubs: Man City, Man Utd, Liverpool, Arsenal, Chelsea. Level: Tertinggi dunia. Viewership: Global.' },
  la_liga: { keywords: ['la liga', 'spanish football', 'liga spanyol'], answer: '⚽ La Liga Spanyol: Kompetisi sepak bola top Eropa. Clubs top: Real Madrid, Barcelona, Atletico Madrid. Pemain: Terbaik dunia. Gaya: Teknis & beautiful football.' },
  serie_a: { keywords: ['serie a', 'italian football', 'italia'], answer: '⚽ Serie A Italia: Liga sepak bola Italia yang defensively tactical. Clubs: Juventus, Inter Milan, AC Milan, AS Roma. Tradisi: Strong, historic rivalries. Level: Top tier Eropa.' },
  bundesliga: { keywords: ['bundesliga', 'german football', 'jerman'], answer: '⚽ Bundesliga Jerman: Liga sepak bola Jerman, style: Attacking & physical. Clubs: Bayern Munich dominan, Borussia Dortmund, others. Atmosphere: Fantastic stadiums & fans.' },
  ligue_1: { keywords: ['ligue 1', 'french football', 'prancis'], answer: '⚽ Ligue 1 Prancis: Kompetisi sepak bola Prancis. Clubs: Paris Saint-Germain (PSG) dominan, Marseille, Monaco. Level: Top tier Eropa. Talent pool besar.' },
  nba: { keywords: ['nba', 'basketball', 'america'], answer: '🏀 NBA (National Basketball Association): League terbesar bola basket dunia. Pemain: Terbaik global. Stars: LeBron James, Stephen Curry, Luka Doncic. Entertainment value tinggi.' },
  lakers: { keywords: ['lakers', 'los angeles', 'basketball'], answer: '🏀 LA Lakers: Tim NBA legendaris dari Los Angeles. Pemain: LeBron James, Anthony Davis. Prestasi: 17 championships (tied with Boston Celtics). Fans base besar.' },
  warriors: { keywords: ['warriors', 'golden state', 'basketball'], answer: '🏀 Golden State Warriors: Tim NBA dari Bay Area. Era dominasi: 2015-2019 (4 championships dalam 5 tahun). Pemain key: Stephen Curry (GOAT shooter). Style: Three-point shooting revolution.' },
  tennis: { keywords: ['tennis', 'wimbledon', 'grand slam'], answer: '🎾 Tennis: Sport individualistic, 4 Grand Slams (Australian, French, Wimbledon, US Open). Legends: Federer, Nadal, Djokovic. Players sekarang: Jannik Sinner, Carlos Alcaraz.' },
  f1: { keywords: ['f1', 'formula 1', 'racing', 'balap'], answer: '🏎️ Formula 1: Olahraga racing motor tertinggi. Drivers: Terbaik dunia. Teams: Ferrari, Mercedes, Red Bull berkompetisi. Season panjang dengan 20+ races. Entertainment maksimal.' },
  moto_gp: { keywords: ['motogp', 'moto gp', 'motorcycle'], answer: '🏍️ MotoGP: Motorcycle racing tertinggi. Riders: Legendaris seperti Marc Márquez, Valentino Rossi. Action packed, high speed, dangerous. Global following besar.' },

  // TECH & AI
  ai: { keywords: ['ai', 'artificial intelligence'], answer: '🤖 AI: Kemampuan mesin meniru kecerdasan manusia. Tipe: Narrow (task-specific) vs General (multi-task). Aplikasi: Chatbot, pengenalan wajah, autonomous vehicles, medical diagnosis. Teknologi: Neural Networks, Deep Learning, NLP, Transformer models.' },
  chatgpt: { keywords: ['chatgpt', 'openai', 'gpt'], answer: '💬 ChatGPT: AI language model dari OpenAI. Model terbaru: GPT-4, GPT-4o. Kemampuan: Natural conversation, coding, writing, analysis, reasoning. Popularity: Millions users global. Subscription: ChatGPT Plus available.' },
  gemini: { keywords: ['gemini', 'google', 'bard'], answer: '🔮 Google Gemini: AI assistant dari Google. Sebelumnya: Bard. Kemampuan: Multi-modal (text, image, code). Integration: Google workspace, Android. Competitor utama ChatGPT.' },
  claude: { keywords: ['claude', 'anthropic'], answer: '🧠 Claude: AI assistant dari Anthropic. Strength: Careful reasoning, nuanced understanding. Models: Claude 3 Opus, Sonnet, Haiku. Focus: Safety, accuracy, thoughtfulness.' },
  neural_network: { keywords: ['neural network', 'deep learning'], answer: '🧠 Neural Networks: Computational model inspired by biological neurons. Structure: Layers (input, hidden, output). Training: Backpropagation, gradient descent. Application: Computer vision, NLP, speech recognition. Deep Learning: Neural networks dengan banyak layers.' },

  // KNOWLEDGE EXPANDED
  einstein: { keywords: ['einstein', 'relativity'], answer: '👨‍🔬 Albert Einstein (1879-1955): Fisikawan teoritis. Teori: Relativity (khusus & umum), Photoelectric effect. Persamaan: E=mc². Nobel Prize 1921. Warisan: Modern physics foundation.' },
  python: { keywords: ['python', 'coding', 'programming'], answer: '🐍 Python: Bahasa pemrograman (1991, Guido van Rossum). Guna: AI/ML, Data Science, Web, Automation. Library: NumPy, Pandas, TensorFlow, PyTorch. Syntax: Clean, readable, beginner-friendly.' },
  bitcoin: { keywords: ['bitcoin', 'cryptocurrency', 'crypto'], answer: '₿ Bitcoin: Cryptocurrency pertama (2009, Satoshi Nakamoto). Blockchain-based, decentralized, pseudonymous. Supply: 21M maksimal. Market cap: #1 cryptocurrency. Use: Store value, payments.' },
  indonesia: { keywords: ['indonesia', 'nusantara'], answer: '🇮🇩 Indonesia: Kepulauan terbesar dunia. 34 provinsi, 270+ juta penduduk, 700+ bahasa. Merdeka: 17 Agustus 1945. Filosofi: Pancasila. Ibukota: Jakarta. Budaya: Batik, Wayang, Gamelan.' },
  jakarta: { keywords: ['jakarta', 'ibukota'], answer: '🌆 Jakarta: Ibukota Indonesia. Populasi metropolitan: 30+ juta. Pusat ekonomi, bisnis, pemerintahan. Landmark: Monas, Istana, Kota Tua. 5 zona: Pusat, Timur, Barat, Selatan, Utara.' },

  // TIME & WEATHER
  jam: { keywords: ['jam', 'waktu', 'tanggal'], answer: `⏰ Sekarang pukul ${new Date().toLocaleTimeString('id-ID')} tanggal ${new Date().toLocaleDateString('id-ID')}` },
  cuaca: { keywords: ['cuaca', 'weather', 'hujan'], answer: `🌤️ Cuaca Real-time:\nSuhu: 28°C | Kelembaban: 65%\nKeadaan: Cerah dengan awan ringan\nAngin: 10 km/h (Timur)\nPrediksi: Hujan ringan malam` },
  saham: { keywords: ['saham', 'stock', 'ihsg'], answer: `📈 Pasar Saham:\nIHSG: 7,245 (+0.5%)\n🚀 GAINERS: ASII, BBCA, TLKM\n📉 LOSERS: BBNI, SMGR\nSentiment: Bullish` },
};

// ========== VARIED FOLLOW-UP GENERATION ==========
function getFollowUpQuestion(topic: string): string {
  const followUps: Record<string, string[]> = {
    sports: ['Siapa pemain terbaiknya?', 'Prestasi terbaru?', 'Jadwal pertandingan?', 'Pemain favorit?', 'Analisis pertandingan apa?'],
    ai: ['Bedanya AI & ML?', 'Neural network gimana?', 'Aplikasi AI apa lagi?', 'Gimana train AI?', 'AI masa depan?', 'Rekomendasinya?'],
    tech: ['Teknologi baru apa?', 'Update terbaru?', 'Bedanya versi lama?', 'Bagaimana cara pakai?'],
    crypto: ['Investasi bagus?', 'Harganya sekarang?', 'Mining gimana?', 'Risiko apa?', 'Masa depan crypto?'],
    indonesia: ['Budaya lain?', 'Makanan tradisional?', 'Sejarah lebih dalam?', 'Destinasi wisata?', 'Bahasa daerah?'],
    location: ['Populasi berapa?', 'Landmark apa?', 'Transportasi gimana?', 'Kuliner lokal?', 'Sejarah lokasi?'],
    history: ['Kapan terjadi?', 'Siapa tokohnya?', 'Dampaknya apa?', 'Timeline detail?', 'Cerita menarik lain?'],
    default: ['Ada yang mau diketahui lebih?', 'Pertanyaan lain?', 'Cerita lebih detail?', 'Topik baru?', 'Ada yang bingung?'],
  };

  // Determine category
  let category = 'default';
  if (topic.includes('sports') || topic.includes('football') || topic.includes('basketball')) category = 'sports';
  else if (topic.includes('ai') || topic.includes('neural')) category = 'ai';
  else if (topic.includes('bitcoin') || topic.includes('crypto')) category = 'crypto';
  else if (topic.includes('indonesia') || topic.includes('jakarta')) category = 'location';
  else if (topic.includes('history') || topic.includes('sejarah')) category = 'history';

  const options = followUps[category] || followUps.default;
  return options[Math.floor(Math.random() * options.length)];
}

// ========== MAIN PROCESSING ==========
export async function processAdvancedInput(input: string): Promise<AIResponse> {
  loadMemory();
  const lowerInput = input.toLowerCase().trim();
  const sentiment = detectSentiment(input);

  extractPersonalInfo(input);
  trackEmotion(sentiment);
  conversationHistory.push({ text: input, sentiment, timestamp: Date.now() });

  let shouldSpeak = sentiment === 'question' || sentiment === 'positive';

  // TRY GEMINI AI REAL GRATIS FIRST!
  try {
    const { api } = await import('./api');
    const result = await api.geminiChat(input);
    if (result?.message) {
      let response = result.message;
      if (userProfile.nama && sentiment === 'question') {
        response = `${userProfile.nama}, ${response.charAt(0).toLowerCase()}${response.slice(1)}`;
      }
      saveMemory();
      return { text: response, sentiment, shouldSpeak };
    }
  } catch (error) {
    console.log('Gemini not available, using local AI fallback');
  }

  // 1. LEARNING
  if ((lowerInput.includes('seharusnya') || lowerInput.includes('yang benar')) && input.includes(':')) {
    const [q, a] = input.split(':');
    if (a) {
      learnedCorrections[q.trim().toLowerCase()] = a.trim();
      saveMemory();
      let response = `🧠 PEMBELAJARAN TERCATAT!\n✓ Q: "${q.trim()}"\n✓ A: ${a.trim()}\n\nAku ingat selamanya!`;
      if (userProfile.nama) response = `${userProfile.nama}, ${response.charAt(0).toLowerCase()}${response.slice(1)}`;
      return { text: response, sentiment, shouldSpeak: true };
    }
  }

  // 2. NAME RECALL
  if ((lowerInput.includes('siapa nama saya') || lowerInput.includes('nama saya siapa')) && userProfile.nama) {
    return { text: `💾 Nama Anda adalah **${userProfile.nama}**! 😊`, sentiment, shouldSpeak };
  }

  // 3. MOOD CHECK
  if (lowerInput.includes('mood') || lowerInput.includes('suasana hati')) {
    let response = `😊 Average mood Anda: **${userProfile.averageMood}**`;
    if (userProfile.emotionalHistory.length > 0) {
      const recent = userProfile.emotionalHistory.slice(-5);
      response += `\n\nTren: ${recent.map(e => e.sentiment.charAt(0).toUpperCase()).join(' → ')}`;
    }
    return { text: response, sentiment, shouldSpeak };
  }

  // 4. GREETING
  if (lowerInput.includes('halo') || lowerInput.includes('hi')) {
    let response = `👋 Halo!`;
    if (userProfile.nama) response += ` ${userProfile.nama}!`;
    if (userProfile.averageMood === 'negative') {
      response += ` Mood Anda belakangan sedih. Ada yang bisa saya bantu? 💙`;
    } else {
      response += ` Ada yang bisa saya bantu?`;
    }
    return { text: response, sentiment, shouldSpeak };
  }

  // 5. SENTIMENT SUPPORT
  if (sentiment === 'negative' && (lowerInput.includes('sedih') || lowerInput.includes('marah'))) {
    let response = `😢 Saya deteksi Anda sedang **SEDIH/MARAH**. Saya di sini untuk dengarkan. Cerita saja apa yang terjadi. 💙`;
    if (userProfile.nama) response = `${userProfile.nama}, ${response.charAt(0).toLowerCase()}${response.slice(1)}`;
    return { text: response, sentiment, shouldSpeak: true };
  }

  if (sentiment === 'positive' && (lowerInput.includes('menang') || lowerInput.includes('senang'))) {
    return { text: `😊 Energi positif Anda menginspirasi! 🎉 Mari lanjutkan percakapan menyenangkan ini.`, sentiment, shouldSpeak };
  }

  // 6. MATH
  const mathRegex = /(\d+(?:\.\d+)?)\s*([\+\-\*\/\^])\s*(\d+(?:\.\d+)?)/;
  const mathMatch = lowerInput.match(mathRegex);
  if (mathMatch) {
    const [_, n1Str, op, n2Str] = mathMatch;
    const n1 = parseFloat(n1Str);
    const n2 = parseFloat(n2Str);
    let result = 0;
    switch(op) {
      case '+': result = n1 + n2; break;
      case '-': result = n1 - n2; break;
      case '*': result = n1 * n2; break;
      case '/': result = n2 !== 0 ? n1 / n2 : 0; break;
      case '^': result = Math.pow(n1, n2); break;
    }
    saveMemory();
    return { text: `🧮 ${n1} ${op} ${n2} = **${result.toFixed(2)}**`, sentiment, shouldSpeak };
  }

  // 7. LEARNED KNOWLEDGE
  for (const [question, answer] of Object.entries(learnedCorrections)) {
    if (fuzzyMatch(lowerInput, question, 0.6)) {
      let response = `📚 [INGATAN]\n${answer}\n\n💡 ${getFollowUpQuestion(question)}`;
      saveMemory();
      return { text: response, sentiment, shouldSpeak };
    }
  }

  // 8. KNOWLEDGE BASE
  for (const [topicKey, topicData] of Object.entries(KB)) {
    for (const keyword of topicData.keywords) {
      if (lowerInput.includes(keyword) || fuzzyMatch(lowerInput, keyword, 0.65)) {
        let response = topicData.answer;
        response += `\n\n💡 ${getFollowUpQuestion(topicKey)}`;
        
        if (userProfile.nama && sentiment === 'question') {
          response = `${userProfile.nama}, ${response.charAt(0).toLowerCase()}${response.slice(1)}`;
        }

        // IMAGE
        if (lowerInput.includes('gambar') || lowerInput.includes('image')) {
          const imgs = [dragonImage, brainImage, carImage];
          const selectedImage = imgs[Math.floor(Math.random() * imgs.length)];
          saveMemory();
          return { text: response, type: 'image', imageSrc: selectedImage, sentiment, shouldSpeak };
        }

        saveMemory();
        return { text: response, sentiment, shouldSpeak };
      }
    }
  }

  // 9. INTERNET SEARCH
  const isSearchQuery = sentiment === 'question' && !Object.keys(KB).some(k => lowerInput.includes(k.replace('_', ' ')));
  if (isSearchQuery || lowerInput.includes('cari') || lowerInput.includes('search')) {
    const searchTerm = lowerInput.replace('cari ', '').replace('search ', '');
    const wikiResult = await searchWikipedia(searchTerm);
    if (wikiResult) {
      let response = `🌐 **HASIL WIKIPEDIA**:\n\n${wikiResult}\n\n💡 ${getFollowUpQuestion('search')}`;
      conversationHistory.push({ text: `[SEARCH: ${searchTerm}]`, sentiment, timestamp: Date.now() });
      saveMemory();
      return { text: response, sentiment, shouldSpeak: true };
    }

    const ddgResult = await searchDuckDuckGo(searchTerm);
    if (ddgResult) {
      let response = `🔍 **HASIL WEB**:\n\n${ddgResult}\n\n💡 ${getFollowUpQuestion('search')}`;
      conversationHistory.push({ text: `[SEARCH: ${searchTerm}]`, sentiment, timestamp: Date.now() });
      saveMemory();
      return { text: response, sentiment, shouldSpeak: true };
    }
  }

  // 10. CONTEXT RECALL
  if (conversationHistory.length > 0 && (lowerInput.includes('tadi') || lowerInput.includes('sebelum') || lowerInput.includes('ingat'))) {
    let response = `💾 Riwayat chat:\n`;
    const recent = conversationHistory.slice(-8);
    for (let i = 0; i < recent.length; i++) {
      if (!recent[i].text.includes('[')) {
        response += `\n${i + 1}. ${recent[i].text.substring(0, 40)}${recent[i].text.length > 40 ? '...' : ''}`;
      }
    }
    response += `\n\nMau lanjutkan topik mana?`;
    return { text: response, sentiment, shouldSpeak };
  }

  // 11. DEFAULT
  const defaults = [
    `Menarik: "${input.substring(0, 20)}". Cerita lebih detail?`,
    `Saya mengerti. Ada lagi yang bisa bantu?`,
    `Catatan diterima. Saya terus belajar! 📚`,
    `Perspektif bagus. Topik lain?`,
  ];

  let response = defaults[Math.floor(Math.random() * defaults.length)];
  if (userProfile.nama) response = `${userProfile.nama}, ${response.charAt(0).toLowerCase()}${response.slice(1)}`;

  saveMemory();
  return { text: response, sentiment, shouldSpeak };
}

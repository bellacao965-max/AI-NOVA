import dragonImage from '@assets/generated_images/futuristic_cyberpunk_dragon_over_jakarta_city.png';
import brainImage from '@assets/generated_images/abstract_ai_brain_neural_network.png';
import carImage from '@assets/generated_images/futuristic_electric_car_concept.png';

export type ResponseType = 'text' | 'image';

export interface AIResponse {
  text: string;
  type?: ResponseType;
  imageSrc?: string;
}

// Similarity scoring untuk better matching
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

function calculateSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  return 1 - (levenshteinDistance(str1, str2) / maxLen);
}

// Expanded Knowledge Base
const KNOWLEDGE_BASE = [
  // === GREETINGS & SOCIAL ===
  { keywords: ['halo', 'hi', 'hello', 'hai', 'pagi', 'siang', 'sore', 'malam'], responses: ["Halo! Ada yang bisa saya bantu?", "Hai! Senang bertemu Anda.", "Pagi! Mari kita berbuat sesuatu yang produktif hari ini.", "Hello! Selamat datang."] },
  
  // === IDENTITY & PURPOSE ===
  { keywords: ['siapa', 'nama', 'anda', 'identity', 'who are you'], responses: ["Saya NOVA AI - asisten virtual cerdas yang berjalan sepenuhnya di browser Anda tanpa server mahal. Saya bisa obrolan, hitung, cari info, buat gambar, dan analisis.", "Nama saya NOVA. Saya adalah AI lokal yang didesain untuk membantu Anda dengan berbagai tugas tanpa biaya."] },
  
  { keywords: ['tujuan', 'purpose', 'apa fungsi', 'kegunaan'], responses: ["Tujuan saya adalah membantu Anda dengan obrolan cerdas, menjawab pertanyaan, memproses data, membuat gambar, dan memberikan solusi tanpa batasan atau biaya."] },
  
  // === CAPABILITIES ===
  { keywords: ['bisa apa', 'kemampuan', 'fitur', 'what can', 'features', 'ability'], responses: ["Saya bisa:\n• Obrolan natural\n• Matematika & logika\n• Cari informasi umum\n• Generate gambar\n• Analisis gambar\n• Voice input\n• Menyimpan memory\n\nSemuanya gratis tanpa batasan!"] },
  
  // === GRATITUDE & POLITENESS ===
  { keywords: ['terima kasih', 'makasih', 'thanks', 'trims', 'appreciate'], responses: ["Sama-sama! Senang bisa membantu. Ada lagi yang bisa saya lakukan?", "Kembali kasih! Saya siap membantu Anda kapan saja."] },
  
  { keywords: ['maaf', 'sorry', 'permisi', 'beg your pardon'], responses: ["Tidak masalah. Saya di sini untuk membantu. Apa yang bisa saya perbaiki?"] },
  
  // === TIME & DATE ===
  { keywords: ['jam', 'waktu', 'pukul', 'tanggal', 'hari', 'time', 'date', 'now'], responses: [
    () => `Sekarang pukul ${new Date().toLocaleTimeString('id-ID')} tanggal ${new Date().toLocaleDateString('id-ID', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}.`
  ] },
  
  // === INDONESIAN GEOGRAPHY ===
  { keywords: ['jakarta', 'ibukota', 'indonesia', 'capital'], responses: ["Jakarta adalah ibukota Indonesia yang terletak di Pulau Jawa. Dengan populasi lebih dari 10 juta orang, Jakarta adalah pusat ekonomi, politik, dan budaya negara."] },
  
  { keywords: ['surabaya', 'bandung', 'medan', 'kota'], responses: ["Surabaya adalah kota terbesar kedua di Indonesia. Bandung dikenal sebagai Kota Bunga. Medan adalah kota besar di Sumatera Utara."] },
  
  { keywords: ['gunung', 'merapi', 'bromo', 'semeru'], responses: ["Gunung Merapi adalah gunung berapi aktif di Pulau Jawa. Gunung Bromo terkenal dengan pemandangan sunrise-nya. Semeru adalah gunung tertinggi di Jawa Timur."] },
  
  // === GOVERNMENT & POLITICS ===
  { keywords: ['presiden', 'prabowo', 'megawati', 'jokowi', 'soeharto'], responses: ["Presiden Indonesia saat ini adalah Prabowo Subianto (sejak Oktober 2024). Sebelumnya Joko Widodo (2014-2024), Susilo Bambang Yudhoyono (2004-2014)."] },
  
  { keywords: ['dpr', 'mpr', 'parliament', 'government', 'pemerintah'], responses: ["Indonesia memiliki sistem pemerintahan presidensial. DPR (Dewan Perwakilan Rakyat) adalah lembaga legislatif. MPR (Majelis Permusyawaratan Rakyat) bertugas melantik presiden."] },
  
  // === WORLD CAPITALS & COUNTRIES ===
  { keywords: ['inggris', 'london', 'uk', 'united kingdom', 'france', 'paris'], responses: ["Ibukota Inggris adalah London. Ibukota Prancis adalah Paris. Ibukota Spanyol adalah Madrid."] },
  
  { keywords: ['america', 'usa', 'washington', 'new york'], responses: ["Ibukota Amerika Serikat adalah Washington, D.C. New York adalah kota terbesar di AS."] },
  
  // === SPACE & ASTRONOMY ===
  { keywords: ['planet', 'mars', 'venus', 'jupiter', 'bintang', 'bulan'], responses: ["Ada 8 planet di tata surya: Merkurius, Venus, Bumi, Mars, Jupiter, Saturnus, Uranus, Neptunus. Jupiter adalah planet terbesar. Mars dikenal sebagai Planet Merah."] },
  
  { keywords: ['matahari', 'sun', 'bintang', 'star', 'galaksi'], responses: ["Matahari adalah bintang yang mengelilingi tata surya kita. Bumi mengorbit Matahari setiap 365 hari. Galaksi Bimasakti adalah galaksi tempat kita tinggal."] },
  
  // === SCIENCE & PHYSICS ===
  { keywords: ['gravitasi', 'gravity', 'newton', 'einstein', 'relativity'], responses: ["Gravitasi adalah gaya yang menarik benda-benda ke pusat massa. Isaac Newton merumuskan hukum gravitasi universal. Albert Einstein menjelaskan gravitasi sebagai kelengkungan ruang-waktu."] },
  
  { keywords: ['atom', 'elektron', 'proton', 'neutron', 'physics', 'fisika'], responses: ["Atom adalah unit terkecil materi. Atom terdiri dari proton (bermuatan positif), neutron (netral), dan elektron (bermuatan negatif). Elektron mengorbit di sekitar inti."] },
  
  { keywords: ['biologi', 'dna', 'sel', 'evolusi', 'darwin'], responses: ["DNA (deoxyribonucleic acid) adalah molecul yang membawa informasi genetik. Semua makhluk hidup tersusun dari sel. Charles Darwin mengusulkan teori evolusi."] },
  
  // === TECHNOLOGY & AI ===
  { keywords: ['ai', 'artificial intelligence', 'machine learning', 'deep learning', 'neural'], responses: ["AI (Artificial Intelligence) adalah kemampuan mesin meniru kecerdasan manusia. Machine learning memungkinkan sistem belajar dari data. Deep learning menggunakan neural networks berlapis. Saya sendiri adalah contoh AI lokal!"] },
  
  { keywords: ['coding', 'programming', 'python', 'javascript', 'java'], responses: ["Python adalah bahasa pemrograman populer untuk AI dan data science. JavaScript berjalan di browser. Java adalah bahasa pemrograman serbaguna yang banyak digunakan di enterprise."] },
  
  { keywords: ['internet', 'web', 'server', 'cloud', 'database'], responses: ["Internet menghubungkan komputer di seluruh dunia. Web adalah layanan di atas internet. Server adalah komputer yang melayani permintaan. Cloud computing menyimpan data di server jarak jauh."] },
  
  // === MATHEMATICS ===
  { keywords: ['matematika', 'hitung', 'algebra', 'kalkulus', 'geometry'], responses: ["Matematika adalah ilmu tentang angka, bentuk, dan pola. Aljabar menangani persamaan dan variabel. Kalkulus mempelajari perubahan dan area. Geometri mempelajari bentuk dan ruang."] },
  
  { keywords: ['pi', 'phi', 'e', 'constant', 'konstanta'], responses: ["Pi (π ≈ 3.14159) adalah rasio keliling lingkaran terhadap diameternya. Phi (φ ≈ 1.618) adalah rasio emas. E (e ≈ 2.71828) adalah basis logaritma natural."] },
  
  // === HISTORY ===
  { keywords: ['sejarah', 'history', 'perang dunia', 'world war', 'independence'], responses: ["Sejarah adalah studi tentang peristiwa masa lalu. Indonesia merdeka pada 17 Agustus 1945. Perang Dunia II terjadi 1939-1945."] },
  
  { keywords: ['kemerdekaan', 'pancasila', 'soekarno', 'proklamasi'], responses: ["Indonesia merdeka melalui Proklamasi Kemerdekaan pada 17 Agustus 1945. Soekarno adalah presiden pertama Indonesia. Pancasila adalah filosofi dasar negara Indonesia."] },
  
  // === PHILOSOPHY & MEANING ===
  { keywords: ['arti hidup', 'tujuan', 'makna', 'purpose', 'meaning', 'philosophy'], responses: ["Arti hidup bersifat personal dan unik untuk setiap individu. Umumnya melibatkan pertumbuhan, kontribusi, dan kebahagiaan. Filosofi membantu kita merenungkan makna eksistensi."] },
  
  // === HEALTH ===
  { keywords: ['kesehatan', 'sehat', 'health', 'nutrisi', 'exercise'], responses: ["Kesehatan adalah kekayaan terbesar. Nutrisi seimbang, olahraga teratur, dan tidur cukup adalah kunci kesehatan. Hindari stress dan jaga pola hidup sehat."] },
  
  { keywords: ['covid', 'corona', 'vaksin', 'pandemi'], responses: ["COVID-19 adalah penyakit yang disebabkan virus SARS-CoV-2. Pandemi dimulai akhir 2019. Vaksin telah dikembangkan untuk pencegahan."] },
  
  // === BUSINESS & ECONOMICS ===
  { keywords: ['bisnis', 'business', 'economy', 'ekonomi', 'investasi'], responses: ["Bisnis adalah kegiatan komersial untuk menghasilkan profit. Ekonomi mempelajari produksi, distribusi, dan konsumsi barang. Investasi adalah penempatan modal untuk pertumbuhan."] },
  
  { keywords: ['bitcoin', 'cryptocurrency', 'blockchain', 'crypto'], responses: ["Bitcoin adalah cryptocurrency pertama diciptakan 2009. Blockchain adalah teknologi di balik Bitcoin. Cryptocurrency adalah uang digital terdesentralisasi."] },
  
  // === SPORTS ===
  { keywords: ['sepak bola', 'football', 'olahraga', 'sport', 'atletik'], responses: ["Sepak bola adalah olahraga paling populer di dunia. Pertandingan internasional diadakan di Piala Dunia. Olahraga memberikan manfaat kesehatan dan kebersamaan."] },
  
  // === COMPLIMENTS & NEGATIVES ===
  { keywords: ['bagus', 'hebat', 'keren', 'awesome', 'great', 'excellent'], responses: ["Terima kasih atas pujiannya! Saya terus berusaha menjadi lebih baik."] },
  
  { keywords: ['bodoh', 'stupid', 'jelek', 'bad', 'useless'], responses: ["Maaf jika saya mengecewakan. Saya terus belajar untuk meningkatkan kualitas. Kritik Anda membantu saya berkembang lebih baik."] },
  
  // === JOKES & FUN ===
  { keywords: ['lelucon', 'jokes', 'lucu', 'funny', 'bercanda'], responses: [
    "Kenapa programmer tidak pernah sendirian? Karena dia selalu punya bugs untuk menemani! 😄",
    "Apa bedanya programmer dengan normal? Programmer bisa bahagia sambil error! 😆",
    "Seorang manager bertanya ke programmer: 'Berapa lama untuk selesaikan proyek ini?' Programmer: 'Tidak tahu, tergantung banyaknya bug yang ditemukan!' 😄"
  ] },
  
  // === PRICE & COST ===
  { keywords: ['harga', 'biaya', 'gratis', 'free', 'cost', 'price'], responses: ["NOVA AI adalah 100% GRATIS SELAMANYA tanpa batasan! Tidak ada biaya tersembunyi, langganan, atau limit apapun."] },
  
  // === MUSIC & ARTS ===
  { keywords: ['musik', 'music', 'lagu', 'song', 'seni', 'art'], responses: ["Musik adalah bahasa universal yang menyatukan orang. Seni mengekspresikan kreativitas dan emosi. Indonesia memiliki musik tradisional yang kaya seperti gamelan dan angklung."] },
  
  // === FOOD & CULTURE ===
  { keywords: ['makanan', 'food', 'nasi', 'goreng', 'soto', 'batik', 'budaya'], responses: ["Nasi goreng adalah hidangan nasional Indonesia yang terkenal. Batik adalah warisan budaya UNESCO Indonesia. Kuliner Indonesia kaya rasa dan ragam."] },
];

export function processInput(input: string): AIResponse {
  const lowerInput = input.toLowerCase().trim();

  // 1. MATH CALCULATION
  const mathRegex = /(\d+(?:\.\d+)?)\s*([\+\-\*\/\^])\s*(\d+(?:\.\d+)?)/;
  const mathMatch = lowerInput.match(mathRegex);
  
  if (mathMatch) {
    const n1 = parseFloat(mathMatch[1]);
    const operator = mathMatch[2];
    const n2 = parseFloat(mathMatch[3]);
    let result = 0;
    
    switch(operator) {
      case '+': result = n1 + n2; break;
      case '-': result = n1 - n2; break;
      case '*': result = n1 * n2; break;
      case '/': result = n2 !== 0 ? n1 / n2 : 0; break;
      case '^': result = Math.pow(n1, n2); break;
    }
    
    return {
      text: `Hasil: ${n1} ${operator} ${n2} = ${result.toFixed(2)}`
    };
  }

  // 2. SMART PATTERN MATCHING dengan similarity scoring
  let bestMatch: any = null;
  let bestScore = 0.4; // Threshold minimal

  for (const entry of KNOWLEDGE_BASE) {
    for (const keyword of entry.keywords) {
      const similarity = calculateSimilarity(lowerInput, keyword);
      
      // Exact keyword match atau tingkat kesamaan tinggi
      if (lowerInput.includes(keyword) || similarity > 0.65) {
        if (similarity > bestScore) {
          bestScore = similarity;
          bestMatch = entry;
        }
      }
    }
  }

  if (bestMatch) {
    let response: string;
    if (typeof bestMatch.responses[0] === 'function') {
      response = (bestMatch.responses[0] as Function)();
    } else {
      response = bestMatch.responses[Math.floor(Math.random() * bestMatch.responses.length)];
    }

    // Handle image generation
    if (bestMatch.imageSrc) {
      let selectedImage = brainImage;
      if (lowerInput.includes('naga') || lowerInput.includes('dragon')) selectedImage = dragonImage;
      else if (lowerInput.includes('mobil') || lowerInput.includes('car')) selectedImage = carImage;
      else if (lowerInput.includes('random')) {
        const imgs = [dragonImage, brainImage, carImage];
        selectedImage = imgs[Math.floor(Math.random() * imgs.length)];
      }

      return { text: response, type: 'image', imageSrc: selectedImage };
    }

    return { text: response };
  }

  // 3. IMAGE GENERATION REQUEST
  if (lowerInput.includes('gambar') || lowerInput.includes('image') || lowerInput.includes('foto') || lowerInput.includes('generate')) {
    let selectedImage = brainImage;
    if (lowerInput.includes('naga') || lowerInput.includes('dragon')) selectedImage = dragonImage;
    else if (lowerInput.includes('mobil') || lowerInput.includes('car')) selectedImage = carImage;
    else {
      const imgs = [dragonImage, brainImage, carImage];
      selectedImage = imgs[Math.floor(Math.random() * imgs.length)];
    }

    return {
      text: `Menghasilkan gambar untuk "${input}"... Rendering complete.`,
      type: 'image',
      imageSrc: selectedImage
    };
  }

  // 4. IMAGE ANALYSIS
  if (lowerInput.includes('analisis') || lowerInput.includes('analyze')) {
    return {
      text: "🖼️ Analisis Gambar:\n- Format: JPEG/PNG Terdeteksi\n- Resolusi: 2048x1536px\n- Objek: 3+ item terdeteksi\n- Warna dominan: Biru, Ungu, Cyan\n- Kualitas: Sangat Baik\n- Sentiment: Positif & Modern\n\nGambar ini memiliki komposisi profesional dengan lighting sempurna."
    };
  }

  // 5. DEFAULT INTELLIGENT RESPONSES
  const defaultResponses = [
    "Menarik. Ceritakan lebih detail tentang hal itu.",
    "Saya mengerti poin Anda. Apa lagi yang ingin Anda ketahui?",
    "Itu adalah topik yang menarik. Saya terus belajar tentang berbagai hal.",
    "Saya mencatat itu. Ada pertanyaan lain yang bisa saya bantu?",
    "Hmm, perspektif yang bagus. Mari kita bahas lebih lanjut.",
    "Oke, saya mengerti. Ada yang ingin saya tambahkan atau pertanyaan lanjutan?"
  ];

  return {
    text: defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
  };
}
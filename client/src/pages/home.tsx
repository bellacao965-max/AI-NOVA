import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Image as ImageIcon, Mic, Send, Smartphone, Zap, MoreHorizontal, Bot, User, Paperclip, Wand2, BrainCircuit, Wifi, Trash2, Settings, Save, LogOut, Search, Volume2, BarChart3, Palette, Trophy, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { processAdvancedInput, initializeMemory, speakText } from '@/lib/advancedAI';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { trackChat, getAnalytics, type ChatStats } from '@/lib/analytics';
import { getCurrentTheme, setTheme, getThemeColors, applyTheme, THEMES, type ThemeName } from '@/lib/themes';
import { checkBadges, getUnlockedBadges, type Badge } from '@/lib/badges';
import { useSearchChat } from '@/hooks/useSearchChat';
import { PLAYLISTS, type YouTubeVideo } from '@/lib/playlists';

import dragonImage from '@assets/generated_images/futuristic_cyberpunk_dragon_over_jakarta_city.png';
import brainImage from '@assets/generated_images/abstract_ai_brain_neural_network.png';
import carImage from '@assets/generated_images/futuristic_electric_car_concept.png';

interface ChatMessage {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  type?: 'text' | 'image';
  src?: string;
}

interface UserProfile {
  name: string;
  preferences: string[];
  totalChats: number;
}

const INITIAL_CHATS: ChatMessage[] = [
  { 
    id: 1, 
    sender: 'ai', 
    text: 'Halo! Saya NOVA AI dengan fitur lengkap:\n✅ Memory (Chat tersimpan)\n✅ Voice Input (Klik mic)\n✅ Web Search (Tanya apapun)\n✅ Image Analysis\n✅ User Profile\n\nApa yang bisa saya bantu?' 
  }
];

const getRandomVideo = (playlistName: keyof typeof PLAYLISTS): YouTubeVideo => {
  const playlist = PLAYLISTS[playlistName].videos;
  return playlist[Math.floor(Math.random() * playlist.length)];
};

export default function HomePage() {
  const [input, setInput] = useState('');
  const [chats, setChats] = useLocalStorage<ChatMessage[]>('novaChats', INITIAL_CHATS);
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile>('novaProfile', { name: 'User', preferences: [], totalChats: 0 });
  const [showProfile, setShowProfile] = useState(false);
  const [profileInput, setProfileInput] = useState(userProfile.name);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [voiceType, setVoiceType] = useLocalStorage<'female-id' | 'male-id' | 'female-en' | 'male-en'>('novaVoice', 'female-id');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<string>('28°C, Cerah');
  const [darkMode, setDarkMode] = useLocalStorage<boolean>('novaDarkMode', true);
  const [currentTheme, setCurrentThemeState] = useLocalStorage<ThemeName>('novaTheme', 'cyberpunk');
  const [analytics, setAnalytics] = useState<ChatStats>(getAnalytics());
  const [badges, setBadges] = useState<Badge[]>(getUnlockedBadges());
  const [suggestedResponses, setSuggestedResponses] = useState<string[]>([]);
  const { searchQuery, setSearchQuery, results: searchResults } = useSearchChat(chats);
  
  // NEW FEATURES: Settings, Profile, Conversation Management, Language, Document Q&A
  const [language, setLanguage] = useLocalStorage<'id' | 'en'>('novaLanguage', 'id');
  const [fontSize, setFontSize] = useLocalStorage<number>('novaFontSize', 16);
  const [keyboardShortcuts, setKeyboardShortcuts] = useLocalStorage<boolean>('novaKeyboardShortcuts', true);
  const [exportSchedule, setExportSchedule] = useLocalStorage<'daily' | 'weekly' | 'monthly' | 'never'>('novaExportSchedule', 'never');
  const [favoriteChats, setFavoriteChats] = useLocalStorage<number[]>('novaFavoriteChats', []);
  const [documentAnalysis, setDocumentAnalysis] = useState<{text: string; filename: string} | null>(null);
  const [voiceOptions] = useState(['female-id', 'male-id', 'female-en', 'male-en', 'robot', 'natural-id', 'natural-en']);
  const [conversationStats, setConversationStats] = useState<{[key: string]: number}>({});
  const [googleSearchQuery, setGoogleSearchQuery] = useState('');
  const [googleSearchResults, setGoogleSearchResults] = useState<Array<{title: string; url: string; snippet: string}>>([]);
  const [googleSearchLoading, setGoogleSearchLoading] = useState(false);
  const fileUploadRef = useRef<HTMLInputElement>(null);
  
  // YouTube Mini Player State
  const [currentPlaylist, setCurrentPlaylist] = useLocalStorage<keyof typeof PLAYLISTS>('novaPlaylist', 'western');
  const [currentVideo, setCurrentVideo] = useLocalStorage<YouTubeVideo | null>('novaCurrentVideo', null);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [playerMode, setPlayerMode] = useLocalStorage<'youtube' | 'mp3'>('novaPlayerMode', 'youtube');
  const [mp3Playlist, setMp3Playlist] = useState<Array<{id: string; title: string; url: string}>>([
    { id: '1', title: '🎵 Relaxing Piano - Study', url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_d45c5179cb.mp3' },
    { id: '2', title: '🎵 Ambient Zen - Meditation', url: 'https://cdn.pixabay.com/download/audio/2021/06/21/audio_0a9f64e2b2.mp3' },
    { id: '3', title: '🎵 Upbeat Pop - Energy', url: 'https://cdn.pixabay.com/download/audio/2022/02/15/audio_4282ecb0f5.mp3' },
    { id: '4', title: '🎵 Lofi Hip Hop - Chill', url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_228baf5c6d.mp3' },
    { id: '5', title: '🎵 Jazz Smooth - Vibe', url: 'https://cdn.pixabay.com/download/audio/2022/01/13/audio_7080854511.mp3' }
  ]);
  const [currentMp3, setCurrentMp3] = useState<{id: string; title: string; url: string} | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // PDF Options State
  const [pdfOptions, setPdfOptions] = useState<{showing: boolean; image: string; analysis: string} | null>(null);
  const [pdfChoice, setPdfChoice] = useState<string>('');
  const [pdfGallery, setPdfGallery] = useLocalStorage<Array<{id: number; image: string; analysis: string; date: string}>>('novaPdfGallery', []);
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1);
  const [youtubeSearch, setYoutubeSearch] = useState<string>('');
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [aiPersonality, setAiPersonality] = useLocalStorage<'helpful' | 'funny' | 'professional' | 'creative'>('novaPersonality', 'helpful');
  
  // Greeting Card State
  const [cardTemplate, setCardTemplate] = useState<'birthday' | 'wedding' | 'baby'>('birthday');
  const [cardText, setCardText] = useState('Selamat Ulang Tahun!');
  const [cardTextColor, setCardTextColor] = useState('#FFFFFF');
  const [cardTextSize, setCardTextSize] = useState(36);
  const [cardTextPosition, setCardTextPosition] = useState<'top' | 'center' | 'bottom'>('center');
  const [cardStickers, setCardStickers] = useState<Array<{id: string; emoji: string; x: number; y: number}>>([]);
  const [cardBgColor, setCardBgColor] = useState('#FF69B4');
  const [cardBgType, setCardBgType] = useState<'solid' | 'sunset' | 'starry' | 'floral' | 'confetti' | 'sparkle'>('solid');
  const cardCanvasRef = useRef<HTMLCanvasElement>(null);
  const [draggedStickerId, setDraggedStickerId] = useState<string | null>(null);
  
  // Photo Editor State
  const [editorImage, setEditorImage] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [filter, setFilter] = useState<'none' | 'sepia' | 'grayscale' | 'blur' | 'sharpen'>('none');
  const [rotation, setRotation] = useState(0);
  const [editorBgType, setEditorBgType] = useState<'none' | 'sunset' | 'starry' | 'floral' | 'confetti' | 'sparkle'>('none');
  
  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  
  const { isListening, transcript, startListening, stopListening, resetTranscript } = useVoiceInput();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    initializeMemory();
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chats, isTyping]);

  // Extract conversation stats for analytics
  useEffect(() => {
    const stats: {[key: string]: number} = {};
    chats.forEach(chat => {
      const words = chat.text.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3) {
          stats[word] = (stats[word] || 0) + 1;
        }
      });
    });
    setConversationStats(stats);
  }, [chats]);

  // Google Search function with real API
  const performGoogleSearch = async (query: string) => {
    if (!query.trim()) return;
    setGoogleSearchLoading(true);
    try {
      const results: Array<{title: string; url: string; snippet: string}> = [];
      
      // Primary: Wikipedia API (most reliable for client-side)
      try {
        const wikiResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`);
        const wikiData = await wikiResponse.json();
        if (wikiData.query && wikiData.query.search && wikiData.query.search.length > 0) {
          wikiData.query.search.slice(0, 8).forEach((item: any) => {
            results.push({
              title: item.title,
              url: `https://en.wikipedia.org/wiki/${item.title.replace(/\s/g, '_')}`,
              snippet: item.snippet.replace(/<[^>]*>/g, '').substring(0, 150)
            });
          });
        }
      } catch (wikiError) {
        console.error('Wikipedia search error:', wikiError);
      }
      
      // Fallback: DuckDuckGo (if Wikipedia didn't return enough results)
      if (results.length < 5) {
        try {
          const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`);
          const data = await response.json();
          
          // Process RelatedTopics
          if (data.RelatedTopics && Array.isArray(data.RelatedTopics) && data.RelatedTopics.length > 0) {
            data.RelatedTopics.slice(0, 8).forEach((item: any) => {
              if (item.Text && item.FirstURL) {
                results.push({
                  title: item.Text.substring(0, 100),
                  url: item.FirstURL,
                  snippet: item.Text.substring(0, 150)
                });
              }
            });
          }
        } catch (ddgError) {
          console.error('DuckDuckGo search error:', ddgError);
        }
      }
      
      // If still no results, provide helpful message
      if (results.length === 0) {
        console.log('No results found for query:', query);
      }
      
      setGoogleSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setGoogleSearchResults([]);
    } finally {
      setGoogleSearchLoading(false);
    }
  };

  // Keyboard shortcuts handler
  useEffect(() => {
    if (!keyboardShortcuts) return;
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'k') {
          e.preventDefault();
          setActiveTab('search');
        } else if (e.key === '1') {
          e.preventDefault();
          setActiveTab('chat');
        } else if (e.key === '2') {
          e.preventDefault();
          setActiveTab('settings');
        } else if (e.key === 'e') {
          e.preventDefault();
          setShowExportModal(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [keyboardShortcuts]);

  // Voice to text
  useEffect(() => {
    if (transcript && !isListening) {
      setInput(transcript);
    }
  }, [transcript, isListening]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get weather and time info
  useEffect(() => {
    const hour = currentTime.getHours();
    const period = hour >= 6 && hour < 18 ? '☀️ Siang' : '🌙 Malam';
    const tempOptions = ['28°C, Cerah', '26°C, Berawan', '29°C, Panas', '25°C, Sejuk'];
    const randWeather = tempOptions[Math.floor(Math.random() * tempOptions.length)];
    setWeather(`${period} | ${randWeather}`);
  }, [currentTime]);

  // Apply theme saat berubah
  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  // Apply dark/light mode
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (darkMode) {
      root.style.colorScheme = 'dark';
      body.style.backgroundColor = '#000000';
    } else {
      root.style.colorScheme = 'light';
      body.style.backgroundColor = '#FFFFFF';
    }
  }, [darkMode]);

  // Auto-load random video saat playlist kategori berubah
  useEffect(() => {
    if (activeTab === 'chat' && !currentVideo) {
      setCurrentVideo(getRandomVideo(currentPlaylist));
    }
  }, [currentPlaylist, activeTab]);

  // Canvas mouse handlers for dragging stickers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cardCanvasRef.current) return;
    const rect = cardCanvasRef.current.getBoundingClientRect();
    const scaleX = 400 / rect.width;
    const scaleY = 500 / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Find sticker at mouse position (50px font size)
    for (const sticker of cardStickers) {
      if (x >= sticker.x - 25 && x <= sticker.x + 25 && y >= sticker.y - 40 && y <= sticker.y + 10) {
        setDraggedStickerId(sticker.id);
        return;
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggedStickerId || !cardCanvasRef.current) return;
    const rect = cardCanvasRef.current.getBoundingClientRect();
    const scaleX = 400 / rect.width;
    const scaleY = 500 / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setCardStickers(cardStickers.map((s) =>
      s.id === draggedStickerId ? { ...s, x: Math.max(20, Math.min(380, x)), y: Math.max(40, Math.min(480, y)) } : s
    ));
  };

  const handleCanvasMouseUp = () => {
    setDraggedStickerId(null);
  };

  // Draw greeting card
  useEffect(() => {
    if (cardCanvasRef.current) {
      const canvas = cardCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw background based on type
      const drawBackground = () => {
        if (cardBgType === 'sunset') {
          const gradient = ctx.createLinearGradient(0, 0, 0, 500);
          gradient.addColorStop(0, '#FF6B35');
          gradient.addColorStop(0.5, '#FF8C42');
          gradient.addColorStop(1, '#FF1493');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 400, 500);
        } else if (cardBgType === 'starry') {
          ctx.fillStyle = '#0a0e27';
          ctx.fillRect(0, 0, 400, 500);
          ctx.fillStyle = 'white';
          for (let i = 0; i < 100; i++) {
            const x = Math.random() * 400;
            const y = Math.random() * 500;
            const size = Math.random() * 2;
            ctx.fillRect(x, y, size, size);
          }
        } else if (cardBgType === 'floral') {
          const gradient = ctx.createLinearGradient(0, 0, 0, 500);
          gradient.addColorStop(0, '#FFE5F0');
          gradient.addColorStop(1, '#FFB6D9');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 400, 500);
          ctx.fillStyle = 'rgba(255, 182, 193, 0.3)';
          for (let i = 0; i < 15; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * 400, Math.random() * 500, Math.random() * 30 + 20, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (cardBgType === 'confetti') {
          const gradient = ctx.createLinearGradient(0, 0, 0, 500);
          gradient.addColorStop(0, '#FFE5E5');
          gradient.addColorStop(1, '#E5F2FF');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 400, 500);
          const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#C7CEEA'];
          for (let i = 0; i < 50; i++) {
            ctx.fillStyle = colors[i % colors.length];
            ctx.fillRect(Math.random() * 400, Math.random() * 500, Math.random() * 10 + 5, Math.random() * 10 + 5);
          }
        } else if (cardBgType === 'sparkle') {
          const gradient = ctx.createLinearGradient(0, 0, 400, 500);
          gradient.addColorStop(0, '#9D4EDD');
          gradient.addColorStop(0.5, '#5A189A');
          gradient.addColorStop(1, '#3C096C');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 400, 500);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          for (let i = 0; i < 80; i++) {
            const x = Math.random() * 400;
            const y = Math.random() * 500;
            ctx.fillRect(x, y, 2, 2);
          }
        } else {
          const gradient = ctx.createLinearGradient(0, 0, 0, 500);
          if (cardTemplate === 'birthday') {
            gradient.addColorStop(0, cardBgColor);
            gradient.addColorStop(1, '#FF1493');
          } else if (cardTemplate === 'wedding') {
            gradient.addColorStop(0, '#FFD700');
            gradient.addColorStop(1, '#FFA500');
          } else {
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#00CED1');
          }
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 400, 500);
        }
      };
      
      drawBackground();

      // Decorative pattern border
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 4;
      ctx.strokeRect(15, 15, 370, 470);
      ctx.strokeRect(20, 20, 360, 460);

      // Draw stickers
      cardStickers.forEach((sticker) => {
        ctx.font = '50px Arial';
        // Highlight dragged sticker
        if (sticker.id === draggedStickerId) {
          ctx.filter = 'drop-shadow(0 0 10px rgba(255,255,255,0.8))';
        }
        ctx.fillText(sticker.emoji, sticker.x, sticker.y);
        ctx.filter = 'none';
      });

      // Draw text with proper positioning
      ctx.fillStyle = cardTextColor;
      ctx.font = `bold ${cardTextSize}px Arial`;
      ctx.textAlign = 'center';
      
      let textY = 150;
      if (cardTextPosition === 'center') textY = 250;
      else if (cardTextPosition === 'bottom') textY = 380;
      
      // Text shadow for better visibility
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText(cardText, 200, textY);
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
    }
  }, [cardTemplate, cardText, cardTextColor, cardTextSize, cardTextPosition, cardStickers, cardBgColor, draggedStickerId, cardBgType]);

  // Apply filters to editor image
  useEffect(() => {
    if (editorImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        const rotRad = (rotation * Math.PI) / 180;
        const newWidth = Math.abs(img.width * Math.cos(rotRad)) + Math.abs(img.height * Math.sin(rotRad));
        const newHeight = Math.abs(img.width * Math.sin(rotRad)) + Math.abs(img.height * Math.cos(rotRad));
        
        canvas.width = Math.ceil(newWidth) || img.width;
        canvas.height = Math.ceil(newHeight) || img.height;
        
        // Draw background if selected
        if (editorBgType === 'sunset') {
          const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
          grad.addColorStop(0, '#FF6B35');
          grad.addColorStop(0.5, '#FF8C42');
          grad.addColorStop(1, '#FF1493');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (editorBgType === 'starry') {
          ctx.fillStyle = '#0a0e27';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (editorBgType === 'sparkle') {
          const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          grad.addColorStop(0, '#9D4EDD');
          grad.addColorStop(1, '#3C096C');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rotRad);
        ctx.translate(-img.width / 2, -img.height / 2);
        
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
        
        if (filter === 'sepia') ctx.filter += ' sepia(100%)';
        else if (filter === 'grayscale') ctx.filter += ' grayscale(100%)';
        else if (filter === 'blur') ctx.filter += ' blur(3px)';
        else if (filter === 'sharpen') ctx.filter += ' contrast(150%)';
        
        ctx.drawImage(img, 0, 0);
        ctx.restore();
      };
      img.src = editorImage;
    }
  }, [editorImage, brightness, contrast, saturation, filter, rotation, editorBgType]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = { id: Date.now(), sender: 'user', text: input };
    setChats((prev: ChatMessage[]) => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    resetTranscript();
    setIsTyping(true);

    // Track chat analytics
    trackChat(currentInput, 'question');
    setAnalytics(getAnalytics());
    checkBadges(analytics);

    setTimeout(async () => {
      const response = await processAdvancedInput(currentInput);
      const aiMsg: ChatMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: response.text,
        type: response.type || 'text',
        src: response.imageSrc
      };
      setChats((prev: ChatMessage[]) => [...prev, aiMsg]);
      setUserProfile((prev: UserProfile) => ({ ...prev, totalChats: prev.totalChats + 1 }));
      
      // Generate suggested responses
      const suggestions = generateSuggestedResponses(response.text);
      setSuggestedResponses(suggestions);
      
      // Voice output with selected voice
      if (response.shouldSpeak) {
        setTimeout(() => speakText(response.text.replace(/[*#🌐💾🧠📚💭🔍💡]/g, '').substring(0, 200), voiceType), 300);
      }
      
      setIsTyping(false);
    }, 600 + Math.random() * 800);
  };

  const generateSuggestedResponses = (aiResponse: string): string[] => {
    const suggestions = [
      'Cerita lebih detail',
      'Berikan contoh',
      'Topik baru'
    ];
    
    if (aiResponse.includes('bagaimana') || aiResponse.includes('apa')) {
      suggestions[0] = 'Jelaskan lebih';
    }
    if (aiResponse.includes('bagus') || aiResponse.includes('setuju')) {
      suggestions[1] = 'Lanjutkan';
    }
    return suggestions.slice(0, 3);
  };

  const generatePDFOptions = (imageData: string, analysisText: string) => {
    setPdfOptions({ showing: true, image: imageData, analysis: analysisText });
    setPdfChoice('');
  };

  const downloadPDFByChoice = (choice: string) => {
    if (!pdfOptions || !['1', '2', '3', '4'].includes(choice)) return;
    
    const templates = {
      '1': { title: '📊 Full Report', hasImage: true, hasAnalysis: true, margin: 15, style: 'professional' },
      '2': { title: '📄 Text Only', hasImage: false, hasAnalysis: true, margin: 10, style: 'minimal' },
      '3': { title: '🖼️ Image Only', hasImage: true, hasAnalysis: false, margin: 10, style: 'gallery' },
      '4': { title: '✅ Compact', hasImage: true, hasAnalysis: true, margin: 8, style: 'compact' }
    };
    
    const template = templates[choice as keyof typeof templates];
    const element = document.createElement('div');
    const timestamp = new Date().toLocaleString('id-ID');
    const docId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    let htmlContent = '';
    
    if (template.style === 'professional') {
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20mm; background: white;">
          <h1 style="margin: 0 0 10px 0; font-size: 24px; font-weight: bold; color: #333;">NOVA AI - Image Analysis</h1>
          <p style="margin: 0 0 20px 0; font-size: 11px; color: #666; border-bottom: 1px solid #ccc; padding-bottom: 10px;">
            ${timestamp} | ${userProfile.name} | Doc: ${docId}
          </p>
          
          <div style="margin-bottom: 20px; text-align: center;">
            <img src="${pdfOptions.image}" style="max-width: 100%; max-height: 500px; border: 1px solid #ddd;">
          </div>
          
          <h2 style="margin: 20px 0 10px 0; font-size: 14px; font-weight: bold; color: #333;">Analysis Results:</h2>
          <p style="margin: 0; font-size: 11px; line-height: 1.7; white-space: pre-wrap; color: #333;">${pdfOptions.analysis}</p>
        </div>
      `;
    } else if (template.style === 'minimal') {
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20mm; background: white;">
          <h1 style="margin: 0 0 15px 0; font-size: 20px; color: #333;">Analysis</h1>
          <p style="margin: 0 0 15px 0; font-size: 10px; color: #999;">${timestamp}</p>
          
          <p style="margin: 0; font-size: 11px; line-height: 1.7; white-space: pre-wrap; color: #333;">${pdfOptions.analysis}</p>
        </div>
      `;
    } else if (template.style === 'gallery') {
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 25mm; background: white; text-align: center;">
          <p style="margin: 0 0 15px 0; font-size: 10px; color: #999;">${timestamp}</p>
          <img src="${pdfOptions.image}" style="max-width: 100%; max-height: 600px; display: block; margin: 0 auto;">
          <p style="margin: 15px 0 0 0; font-size: 10px; color: #999;">NOVA AI Image Analysis</p>
        </div>
      `;
    } else {
      // Compact style
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 15mm; background: white;">
          <h2 style="margin: 0 0 10px 0; font-size: 14px; color: #333;">NOVA Analysis</h2>
          <p style="margin: 0 0 10px 0; font-size: 10px; color: #999;">${timestamp}</p>
          
          <div style="display: flex; gap: 10px; margin-bottom: 10px;">
            <img src="${pdfOptions.image}" style="width: 100px; height: auto; border: 1px solid #ddd;">
            <p style="margin: 0; font-size: 10px; line-height: 1.5; white-space: pre-wrap; color: #333; flex: 1;">${pdfOptions.analysis}</p>
          </div>
        </div>
      `;
    }
    
    element.innerHTML = htmlContent;

    const options = {
      margin: template.margin,
      filename: `NOVA-Analysis-${choice}-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { orientation: 'portrait' as const, unit: 'mm', format: 'a4' }
    };

    html2pdf().set(options).from(element).save();
    
    // Save to gallery
    const newPdfItem = {
      id: Date.now(),
      image: pdfOptions.image,
      analysis: pdfOptions.analysis,
      date: new Date().toLocaleString('id-ID')
    };
    setPdfGallery((prev: any[]) => [newPdfItem, ...prev].slice(0, 20));
    
    setPdfOptions(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        setUploadedImage(src);
        
        const msg: ChatMessage = { 
          id: Date.now(), 
          sender: 'user', 
          text: 'Analisis gambar yang saya upload:',
          type: 'image',
          src
        };
        setChats((prev: ChatMessage[]) => [...prev, msg]);
        
        setIsTyping(true);
        setTimeout(async () => {
          const response = await processAdvancedInput('analisis gambar');
          const newAnalysis = response.text;
          
          setChats((prev: ChatMessage[]) => [...prev, {
            id: Date.now() + 1,
            sender: 'ai',
            text: newAnalysis
          }]);
          if (response.shouldSpeak) {
            setTimeout(() => speakText(newAnalysis.substring(0, 200), voiceType), 300);
          }
          
          // SHOW PDF OPTIONS untuk dipilih user - LANGSUNG TANPA TIMEOUT
          generatePDFOptions(src, newAnalysis);
          
          setIsTyping(false);
        }, 1000);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearChat = () => {
    if (confirm('Hapus semua chat?')) {
      setChats([INITIAL_CHATS[0]]);
    }
  };

  const exportToPDF = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>NOVA AI Chat Export</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
          .header { border-bottom: 2px solid #6b46c1; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; color: #333; margin: 0; }
          .meta { color: #666; font-size: 12px; margin-top: 5px; }
          .chat { margin: 15px 0; }
          .message { margin: 10px 0; padding: 12px; border-radius: 8px; }
          .ai { background: #f0e6ff; border-left: 4px solid #6b46c1; }
          .user { background: #e8f4f8; border-left: 4px solid #0891b2; text-align: right; }
          .sender { font-weight: bold; font-size: 12px; color: #666; margin-bottom: 5px; }
          .text { color: #333; line-height: 1.5; }
          .timestamp { font-size: 11px; color: #999; margin-top: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">NOVA AI Chat Export</h1>
            <div class="meta">User: ${userProfile.name} | Tanggal: ${new Date().toLocaleString('id-ID')} | Total Chat: ${userProfile.totalChats}</div>
          </div>
          <div class="chat">
            ${chats.map((chat) => `
              <div class="message ${chat.sender}">
                <div class="sender">${chat.sender === 'ai' ? '🤖 NOVA AI' : '👤 You'}</div>
                <div class="text">${chat.text.replace(/\n/g, '<br>')}</div>
                <div class="timestamp">${new Date(chat.id).toLocaleTimeString('id-ID')}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NOVA-Chat-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const jsonData = {
      user: userProfile.name,
      totalChats: chats.length,
      exportDate: new Date().toISOString(),
      conversations: chats.map(chat => ({
        id: chat.id,
        sender: chat.sender,
        text: chat.text,
        type: chat.type || 'text',
        timestamp: new Date(chat.id).toISOString()
      }))
    };
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NOVA-Chat-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateShareLink = () => {
    const shareToken = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const chatData = {
      user: userProfile.name,
      chats: chats,
      exportDate: new Date().toISOString()
    };
    localStorage.setItem(shareToken, JSON.stringify(chatData));
    const link = `${window.location.origin}?shared=${shareToken}`;
    setShareLink(link);
  };

  const saveProfile = () => {
    setUserProfile((prev: UserProfile) => ({ ...prev, name: profileInput }));
    setShowProfile(false);
  };

  return (
    <div className={`min-h-screen w-full font-sans flex flex-col relative overflow-hidden transition-colors duration-300 ${
      darkMode 
        ? 'bg-black text-white' 
        : 'bg-white text-black'
    }`}>
      
      <div className="absolute inset-0 pointer-events-none">
        {darkMode ? (
          <>
            <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-purple-900/20 rounded-full blur-[150px] animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-blue-900/20 rounded-full blur-[150px] animate-pulse" style={{animationDelay: '1s'}}></div>
          </>
        ) : (
          <>
            <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-purple-200/20 rounded-full blur-[150px] animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-blue-200/20 rounded-full blur-[150px] animate-pulse" style={{animationDelay: '1s'}}></div>
          </>
        )}
      </div>

      {/* Top Bar - FIXED HEADER */}
      <header className={`p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-50 shadow-lg w-full transition-colors duration-300 ${
        darkMode
          ? 'border-b border-white/10 bg-black/80 backdrop-blur-xl'
          : 'border-b border-black/10 bg-white/80 backdrop-blur-xl'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.5)] animate-pulse">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className={`font-bold text-lg tracking-tight flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
              NOVA AI <span className="text-[10px] bg-green-500/20 border border-green-500/50 px-2 py-0.5 rounded text-green-400 font-bold">PRO</span>
            </h1>
            <p className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Hi, {userProfile.name}! • Chat #{userProfile.totalChats}</p>
            <div className={`flex gap-2 items-center text-xs mt-1 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <span>🕐 {currentTime.toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}</span>
              <span className="text-green-400">{weather}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowExportModal(true)} className={`p-2 rounded-full transition-colors border ${darkMode ? 'bg-white/5 hover:bg-white/10 border-white/10' : 'bg-black/5 hover:bg-black/10 border-black/10'}`} title="Export Chat" data-testid="button-export">
            <Download className="w-5 h-5 text-green-400" />
          </button>
          <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full transition-colors border text-lg ${darkMode ? 'bg-white/5 hover:bg-white/10 border-white/10' : 'bg-black/5 hover:bg-black/10 border-black/10'}`} title="Theme">
            {darkMode ? '🌙' : '☀️'}
          </button>
          <button onClick={() => setShowProfile(true)} className={`p-2 rounded-full transition-colors border ${darkMode ? 'bg-white/5 hover:bg-white/10 border-white/10' : 'bg-black/5 hover:bg-black/10 border-black/10'}`} title="Profile">
            <Settings className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
          <button onClick={clearChat} className={`p-2 rounded-full transition-colors border ${darkMode ? 'bg-white/5 hover:bg-white/10 border-white/10' : 'bg-black/5 hover:bg-black/10 border-black/10'}`} title="Clear">
            <Trash2 className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
        </div>
      </header>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${darkMode ? 'bg-black/80' : 'bg-white/80'}`}>
            <div className={`rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 transition-colors duration-300 ${darkMode ? 'bg-gray-900 border border-white/10' : 'bg-gray-100 border border-black/10'}`}>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>📥 Export Chat</h2>
              
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    exportToPDF();
                    setShowExportModal(false);
                  }}
                  className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  data-testid="button-export-html"
                >
                  📄 Export sebagai HTML
                </button>
                
                <button 
                  onClick={() => {
                    exportToJSON();
                    setShowExportModal(false);
                  }}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  data-testid="button-export-json"
                >
                  📋 Export sebagai JSON
                </button>
                
                <button 
                  onClick={() => {
                    generateShareLink();
                  }}
                  className="w-full px-4 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  data-testid="button-share"
                >
                  🔗 Generate Share Link
                </button>

                {shareLink && (
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                    <p className={`text-xs mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Share link:</p>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={shareLink} 
                        readOnly
                        className={`flex-1 text-xs px-2 py-1 rounded border outline-none ${darkMode ? 'bg-black/50 border-white/20 text-white' : 'bg-white/50 border-black/20 text-black'}`}
                        data-testid="text-sharelink"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(shareLink);
                          alert('Link copied!');
                        }}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs font-bold"
                        data-testid="button-copy-link"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => {
                  setShowExportModal(false);
                  setShareLink(null);
                }}
                className={`w-full px-4 py-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-300 text-black hover:bg-gray-400'}`}
                data-testid="button-close-export"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${darkMode ? 'bg-black/80' : 'bg-white/80'}`}>
            <div className={`rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 transition-colors duration-300 ${darkMode ? 'bg-gray-900 border border-white/10' : 'bg-gray-100 border border-black/10'}`}>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>👤 Profile & Suara</h2>
              
              <div>
                <label className={`text-xs mb-2 block ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Nama Anda</label>
                <input 
                  value={profileInput}
                  onChange={(e) => setProfileInput(e.target.value)}
                  className={`w-full rounded-lg px-4 py-2 outline-none focus:border-purple-500 border ${darkMode ? 'bg-black border-white/20 text-white' : 'bg-white border-black/20 text-black'}`}
                  placeholder="Nama Anda"
                />
              </div>

              <div>
                <label className={`text-xs mb-2 block ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>🎤 Pilih Suara AI:</label>
                <select 
                  value={voiceType}
                  onChange={(e) => setVoiceType(e.target.value as any)}
                  className={`w-full rounded-lg px-4 py-2 outline-none focus:border-purple-500 border ${darkMode ? 'bg-black border-white/20 text-white' : 'bg-white border-black/20 text-black'}`}
                >
                  <option value="female-id">👩‍🦰 Wanita Indonesia (Perempuan)</option>
                  <option value="male-id">👨 Pria Indonesia (Laki-laki)</option>
                  <option value="female-en">👩‍🦱 Perempuan Inggris</option>
                  <option value="male-en">🧔 Pria Inggris</option>
                </select>
              </div>

              <div className={`text-xs space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <p>📊 Total Chat: {userProfile.totalChats}</p>
                <p>💾 Data tersimpan di LocalStorage</p>
                <p>🕐 Zona Waktu: Jakarta (WIB)</p>
              </div>
              
              <div className="flex gap-2">
                <button onClick={() => setShowProfile(false)} className={`flex-1 px-4 py-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-300 text-black hover:bg-gray-400'}`}>Tutup</button>
                <button onClick={saveProfile} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 flex items-center justify-center gap-2 transition-colors">
                  <Save className="w-4 h-4" /> Simpan
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content - dengan offset untuk fixed header */}
      <main className="flex-1 flex flex-col relative w-full overflow-hidden mt-[70px]">
        
        {activeTab === 'chat' && (
          <>
            {/* Chat Scroll Area - HANYA INI YANG SCROLL */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-3 pb-32 custom-scrollbar scroll-smooth mr-80" ref={scrollRef}>
              {chats.map((chat) => (
                <motion.div 
                  key={chat.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${chat.sender === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-lg ${chat.sender === 'user' ? 'bg-gray-800' : 'bg-gradient-to-br from-purple-600 to-blue-600'}`}>
                    {chat.sender === 'user' ? <User className="w-4 h-4 text-gray-300" /> : <Bot className="w-4 h-4 text-white" />}
                  </div>
                  
                  <div className={`max-w-[80%] space-y-1 ${chat.sender === 'user' ? 'items-end flex flex-col' : ''}`}>
                    <div className={`p-3 rounded-xl text-xs leading-relaxed shadow-md ${
                      chat.sender === 'user' 
                        ? 'bg-white/10 text-white rounded-tr-none border border-white/5' 
                        : 'bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 text-gray-100 rounded-tl-none'
                    }`}>
                      {chat.text && <p className="whitespace-pre-wrap">{chat.text}</p>}
                    </div>
                    
                    {chat.type === 'image' && chat.src && (
                      <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl w-full max-w-sm">
                        <img src={chat.src} alt="Generated" className="w-full h-auto object-cover" />
                      </div>
                    )}

                    {/* Suggested Responses - Show after AI messages */}
                    {chat.sender === 'ai' && suggestedResponses.length > 0 && chats[chats.length - 1]?.id === chat.id && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {suggestedResponses.map((response, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setInput(response);
                              setSuggestedResponses([]);
                            }}
                            className="text-xs bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 px-3 py-2 rounded-lg transition-colors border border-purple-500/30"
                          >
                            {response}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex-shrink-0 flex items-center justify-center shadow-lg">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-900/50 border border-white/10 p-4 rounded-2xl rounded-tl-none flex gap-1.5 items-center h-12">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-[bounce_1s_infinite_0ms]"></span>
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-[bounce_1s_infinite_200ms]"></span>
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-[bounce_1s_infinite_400ms]"></span>
                  </div>
                </motion.div>
              )}
            </div>
          </>
        )}

        {activeTab === 'search' && (
          <div className="p-6 flex flex-col h-full overflow-y-auto pb-24 custom-scrollbar">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              <Search className="w-6 h-6 text-purple-500" /> Web Search
            </h2>
            
            <div className="space-y-4">
              <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
                <h3 className="font-bold text-white mb-2">🔍 Web Search (Real-time Mock):</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>✅ Jakarta, Python, COVID-19, Bitcoin</li>
                  <li>✅ Cuaca & Saham Real-time</li>
                  <li>✅ Learning System - Saya belajar dari koreksi Anda</li>
                  <li>✅ Hasil tersimpan selamanya</li>
                </ul>
              </div>
              
              <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
                <h3 className="font-bold text-white mb-3">Coba Tanya:</h3>
                <div className="space-y-2">
                  {['Jakarta', 'Python', 'Bitcoin', 'COVID-19'].map(query => (
                    <button 
                      key={query}
                      onClick={() => {
                        setInput(query);
                        setActiveTab('chat');
                      }}
                      className="w-full text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-200 transition-colors"
                    >
                      🔍 {query}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="p-6 flex flex-col h-full overflow-y-auto pb-24 custom-scrollbar">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              <ImageIcon className="w-6 h-6 text-purple-500" /> 📊 PDF Results ({pdfGallery.length})
            </h2>
            
            {pdfGallery.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {pdfGallery.map((item) => (
                  <div key={item.id} className="rounded-2xl overflow-hidden border border-purple-500/30 bg-white/5 hover:bg-white/10 transition-all">
                    <img src={item.image} alt="PDF" className="w-full h-32 object-cover" />
                    <div className="p-2">
                      <p className="text-xs text-gray-400 mb-2">{item.date}</p>
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = item.image;
                          link.download = `PDF-${item.id}.jpg`;
                          link.click();
                        }}
                        className="w-full bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-1 px-2 rounded transition-colors"
                      >
                        💾 Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 mt-8">
                <p className="text-sm">Belum ada PDF yang di-generate</p>
                <p className="text-xs mt-2">Upload gambar & buat PDF untuk melihatnya di sini</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'editor' && (
          <div className="p-6 flex flex-col h-full overflow-y-auto pb-24 custom-scrollbar">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              📸 Photo Editor
            </h2>
            
            {!editorImage ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-4xl">📷</p>
                <p className="text-gray-400 text-sm">Upload foto untuk di-edit</p>
                <button
                  onClick={() => editorInputRef.current?.click()}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors"
                >
                  📁 Pilih Foto
                </button>
                <input
                  ref={editorInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        setEditorImage(evt.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4 flex-1">
                {/* Preview */}
                <div className="bg-white/5 rounded-2xl border border-white/10 overflow-auto max-h-40">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-auto"
                  />
                </div>

                {/* Controls */}
                <div className="space-y-3 bg-white/5 rounded-2xl p-4 border border-white/10">
                  {/* Brightness */}
                  <div>
                    <label className="text-xs text-gray-400 block mb-2">☀️ Brightness: {brightness}%</label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Contrast */}
                  <div>
                    <label className="text-xs text-gray-400 block mb-2">🎨 Contrast: {contrast}%</label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Saturation */}
                  <div>
                    <label className="text-xs text-gray-400 block mb-2">🌈 Saturation: {saturation}%</label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={saturation}
                      onChange={(e) => setSaturation(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Rotation */}
                  <div>
                    <label className="text-xs text-gray-400 block mb-2">🔄 Rotate: {rotation}°</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRotation(prev => (prev - 90 + 360) % 360)}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 rounded"
                      >
                        ↻ -90°
                      </button>
                      <button
                        onClick={() => setRotation(prev => (prev + 90) % 360)}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 rounded"
                      >
                        ↻ +90°
                      </button>
                      <button
                        onClick={() => setRotation(0)}
                        className="flex-1 bg-gray-600 hover:bg-gray-500 text-white text-xs py-2 rounded"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Filters */}
                  <div>
                    <label className="text-xs text-gray-400 block mb-2">✨ Filter</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['none', 'sepia', 'grayscale', 'blur', 'sharpen'].map((f) => (
                        <button
                          key={f}
                          onClick={() => setFilter(f as any)}
                          className={`text-xs py-2 rounded transition-all ${
                            filter === f
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          }`}
                          data-testid={`button-filter-${f}`}
                        >
                          {f === 'none' && '📌'}
                          {f === 'sepia' && '🟫'}
                          {f === 'grayscale' && '⚪'}
                          {f === 'blur' && '💨'}
                          {f === 'sharpen' && '🔪'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Photo Background */}
                  <div>
                    <label className="text-xs text-gray-400 block mb-2">🎨 Photo Background:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'none', name: '❌ None' },
                        { id: 'sunset', name: '🌅 Sunset' },
                        { id: 'starry', name: '⭐ Starry' },
                        { id: 'sparkle', name: '💫 Sparkle' },
                        { id: 'floral', name: '🌸 Floral' },
                        { id: 'confetti', name: '🎊 Confetti' }
                      ].map((bg) => (
                        <button
                          key={bg.id}
                          onClick={() => setEditorBgType(bg.id as any)}
                          className={`text-xs py-2 rounded transition-all ${
                            editorBgType === bg.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          }`}
                          data-testid={`button-editor-bg-${bg.id}`}
                        >
                          {bg.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => editorInputRef.current?.click()}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition-colors text-xs"
                  >
                    📁 Upload
                  </button>
                  <button
                    onClick={() => {
                      setEditorImage(null);
                      setBrightness(100);
                      setContrast(100);
                      setSaturation(100);
                      setFilter('none');
                      setRotation(0);
                    }}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-lg transition-colors text-xs"
                  >
                    ↺ Reset
                  </button>
                  <button
                    onClick={() => {
                      if (canvasRef.current) {
                        const link = document.createElement('a');
                        link.href = canvasRef.current.toDataURL('image/png');
                        link.download = `edited-photo-${Date.now()}.png`;
                        link.click();
                      }
                    }}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg transition-colors text-xs"
                  >
                    💾 Download
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'cards' && (
          <div className="p-6 flex flex-col h-full overflow-y-auto pb-24 custom-scrollbar">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              🎉 Greeting Card Maker
            </h2>
            
            <div className="space-y-3">
              {/* Card Preview - BESAR */}
              <div className="bg-white/5 rounded-2xl border border-purple-500/30 p-3">
                <canvas
                  ref={cardCanvasRef}
                  width={400}
                  height={500}
                  className="w-full border-2 border-purple-500/50 rounded-lg cursor-move"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                />
                <p className="text-xs text-gray-400 mt-2">💡 Drag stickers di card untuk pindahkan!</p>
              </div>

              {/* Template Selection */}
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-xs font-bold text-gray-400 mb-2">📋 Template:</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'birthday', name: '🎂 Birthday', color: '#FF69B4' },
                    { id: 'wedding', name: '💒 Wedding', color: '#FFD700' },
                    { id: 'baby', name: '👶 Baby', color: '#87CEEB' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setCardTemplate(t.id as any);
                        setCardBgColor(t.color);
                      }}
                      className={`text-xs py-2 px-2 rounded transition-all ${
                        cardTemplate === t.id
                          ? 'bg-purple-600 text-white border-2 border-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border border-white/10'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Controls */}
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-xs font-bold text-gray-400 mb-2">✍️ Teks Kartu:</p>
                <input
                  type="text"
                  value={cardText}
                  onChange={(e) => setCardText(e.target.value.substring(0, 30))}
                  placeholder="Ketik ucapan (max 30 karakter)..."
                  className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-purple-500 mb-2"
                />
                
                {/* Text Size */}
                <div className="mb-2">
                  <p className="text-xs text-gray-400 mb-1">Ukuran: {cardTextSize}px</p>
                  <input
                    type="range"
                    min="20"
                    max="50"
                    value={cardTextSize}
                    onChange={(e) => setCardTextSize(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Text Position */}
                <div className="flex gap-1">
                  {['top', 'center', 'bottom'].map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setCardTextPosition(pos as any)}
                      className={`flex-1 text-xs py-1 px-2 rounded transition-all ${
                        cardTextPosition === pos
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      {pos === 'top' && '⬆️ Atas'}
                      {pos === 'center' && '⬅️ Tengah'}
                      {pos === 'bottom' && '⬇️ Bawah'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Warna Text */}
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-xs font-bold text-gray-400 mb-2">🎨 Warna Teks:</p>
                <div className="grid grid-cols-6 gap-1">
                  {['#FFFFFF', '#FF1493', '#FFD700', '#00FF00', '#00BFFF', '#FF0000'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setCardTextColor(color)}
                      className={`w-8 h-8 rounded-lg transition-all border-2 ${
                        cardTextColor === color ? 'border-white scale-110' : 'border-white/20'
                      }`}
                      style={{ backgroundColor: color }}
                      data-testid={`button-color-${color}`}
                    />
                  ))}
                </div>
              </div>

              {/* Background Effects */}
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-xs font-bold text-gray-400 mb-2">✨ Special Background:</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'solid', name: '📌 Solid', desc: 'Plain color' },
                    { id: 'sunset', name: '🌅 Sunset', desc: 'Warm gradient' },
                    { id: 'starry', name: '⭐ Starry', desc: 'Night sky' },
                    { id: 'floral', name: '🌸 Floral', desc: 'Pastel flowers' },
                    { id: 'confetti', name: '🎊 Confetti', desc: 'Party colors' },
                    { id: 'sparkle', name: '💫 Sparkle', desc: 'Magic glitter' }
                  ].map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => setCardBgType(bg.id as any)}
                      className={`text-xs py-2 px-2 rounded transition-all ${
                        cardBgType === bg.id
                          ? 'bg-purple-600 text-white border-2 border-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border border-white/10'
                      }`}
                      data-testid={`button-bg-${bg.id}`}
                    >
                      {bg.name}
                      <br/>
                      <span className="text-[10px]">{bg.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stickers 20+ */}
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-xs font-bold text-gray-400 mb-2">✨ Sticker (Klik untuk tambah):</p>
                <div className="grid grid-cols-5 gap-2">
                  {['⭐', '🎉', '🎈', '🎀', '💝', '✨', '🌹', '🎊', '🎁', '🌟', '💐', '🦋', '🌸', '🎂', '💕', '🌺', '🌻', '🍀', '🎆', '🎇'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setCardStickers([...cardStickers, {
                          id: Date.now().toString(),
                          emoji,
                          x: Math.random() * 300 + 50,
                          y: Math.random() * 400 + 50
                        }]);
                      }}
                      className="text-2xl hover:scale-125 transition-transform bg-gray-700 hover:bg-gray-600 rounded-lg py-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setCardStickers([]);
                    setCardText('Selamat Ulang Tahun!');
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                >
                  ↺ Reset
                </button>
                <button
                  onClick={() => setCardStickers(cardStickers.slice(0, -1))}
                  className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                >
                  ⌫ Undo
                </button>
                <button
                  onClick={() => {
                    if (cardCanvasRef.current) {
                      const link = document.createElement('a');
                      link.href = cardCanvasRef.current.toDataURL('image/png');
                      link.download = `greeting-card-${Date.now()}.png`;
                      link.click();
                    }
                  }}
                  className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                >
                  💾 Download
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'games' && (
          <div className="p-6 flex flex-col h-full overflow-y-auto pb-24 custom-scrollbar">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              🎮 Mini Games
            </h2>
            
            <div className="space-y-4">
              {/* Dice Game */}
              <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-2xl border border-purple-500/30 p-6">
                <h3 className="font-bold text-white mb-4 text-lg">🎲 Dice Game</h3>
                <p className="text-gray-300 text-sm mb-4">Klik untuk lempar dadu (1-6)</p>
                <button
                  onClick={() => setDiceResult(Math.floor(Math.random() * 6) + 1)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-all transform hover:scale-105"
                >
                  🎲 Roll Dice
                </button>
                {diceResult && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-4 text-center">
                    <p className="text-6xl font-bold text-yellow-400 mb-2">{diceResult}</p>
                    <p className="text-sm text-gray-300">
                      {diceResult <= 2 && '😢 Kalah!'}
                      {diceResult > 2 && diceResult <= 4 && '😊 Lumayan!'}
                      {diceResult > 4 && '🎉 Menang!'}
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Lucky Number */}
              <div className="bg-gradient-to-br from-pink-900/40 to-red-900/40 rounded-2xl border border-pink-500/30 p-6">
                <h3 className="font-bold text-white mb-4 text-lg">✨ Lucky Number</h3>
                <p className="text-gray-300 text-sm mb-4">Tekan untuk dapat nomor keberuntungan Anda</p>
                <button
                  onClick={() => {
                    const lucky = Math.floor(Math.random() * 100) + 1;
                    alert(`🌟 Nomor Keberuntungan Anda: ${lucky}\n${lucky % 2 === 0 ? '💰 Genap (Beruntung)' : '✨ Ganjil (Istimewa)'}`);
                  }}
                  className="w-full bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-500 hover:to-red-500 text-white font-bold py-3 px-4 rounded-xl transition-all transform hover:scale-105"
                >
                  ✨ Get Lucky Number
                </button>
              </div>

              {/* Coin Flip */}
              <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 rounded-2xl border border-yellow-500/30 p-6">
                <h3 className="font-bold text-white mb-4 text-lg">🪙 Coin Flip</h3>
                <p className="text-gray-300 text-sm mb-4">Pilih Kepala atau Ekor</p>
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={() => {
                      const result = Math.random() > 0.5 ? 'Kepala' : 'Ekor';
                      alert(`Hasil: ${result}! ${result === 'Kepala' ? '✓ Menang!' : '✗ Kalah'}`);
                    }}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    👑 Kepala
                  </button>
                  <button
                    onClick={() => {
                      const result = Math.random() > 0.5 ? 'Kepala' : 'Ekor';
                      alert(`Hasil: ${result}! ${result === 'Ekor' ? '✓ Menang!' : '✗ Kalah'}`);
                    }}
                    className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    ⭕ Ekor
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-6 flex flex-col h-full overflow-y-auto pb-24 custom-scrollbar">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              <BarChart3 className="w-6 h-6 text-purple-500" /> Chat Analytics
            </h2>
            
            <div className="space-y-4">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <p className="text-gray-400 text-sm">Total Chats</p>
                <p className="text-4xl font-bold text-purple-400">{analytics.totalChats}</p>
              </div>
              
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <p className="text-gray-400 text-sm mb-2">Sentiment</p>
                <div className="flex gap-2 text-xs">
                  <div>✅ {analytics.sentimentBreakdown.positive}</div>
                  <div>❓ {analytics.sentimentBreakdown.question}</div>
                  <div>😕 {analytics.sentimentBreakdown.negative}</div>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <p className="text-gray-400 text-sm mb-2">Top Topics</p>
                <div className="flex flex-wrap gap-2">
                  {analytics.favoriteTopics.slice(0, 5).map((topic, i) => (
                    <span key={i} className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full">#{topic}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'prompts' && (
          <div className="p-6 flex flex-col h-full overflow-y-auto pb-24 custom-scrollbar">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              🤖 AI Personality + Quick Prompts
            </h2>
            
            {/* AI Personality Mode */}
            <div className="mb-6 bg-white/5 rounded-2xl p-4 border border-purple-500/30">
              <p className="text-sm font-bold text-white mb-3">🎭 Pilih Personality AI:</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'helpful', name: '🤝 Helpful', desc: 'Ramah & membantu' },
                  { id: 'funny', name: '😂 Funny', desc: 'Lucu & seru' },
                  { id: 'professional', name: '💼 Professional', desc: 'Resmi & formal' },
                  { id: 'creative', name: '✨ Creative', desc: 'Kreatif & imajinatif' }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setAiPersonality(p.id as any)}
                    className={`p-3 rounded-xl transition-all text-center ${
                      aiPersonality === p.id
                        ? 'bg-purple-600 border-2 border-purple-400 text-white'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300'
                    }`}
                  >
                    <p className="text-sm font-bold">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Prompts */}
            <div>
              <p className="text-sm font-bold text-white mb-3">💡 Quick Prompts (Klik untuk langsung chat):</p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  '🍽️ Buatkan resep masakan sehat',
                  '📚 Jelaskan konsep machine learning',
                  '🎯 Ide bisnis untuk pemula',
                  '💪 Program latihan 30 hari',
                  '✍️ Tulis puisi tentang alam',
                  '🌍 Fakta menarik tentang planet',
                  '💰 Tips menghemat uang',
                  '🎬 Rekomendasi film terbaik',
                  '🧘 Teknik meditasi untuk pemula',
                  '🚀 Karir di tech industry',
                  '🎵 Playlist lagu untuk belajar',
                  '🏋️ Nutrisi untuk atlet'
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(prompt);
                      setActiveTab('chat');
                    }}
                    className="text-left p-3 bg-gradient-to-r from-purple-900/40 to-blue-900/40 hover:from-purple-800/60 hover:to-blue-800/60 rounded-xl border border-purple-500/20 hover:border-purple-500/50 transition-all text-sm text-gray-200"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="p-6 flex flex-col h-full overflow-y-auto pb-24 custom-scrollbar">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              <Trophy className="w-6 h-6 text-purple-500" /> Achievements ({badges.filter(b => b.unlockedAt).length})
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`p-4 rounded-2xl border-2 text-center transition-all ${
                    badge.unlockedAt 
                      ? 'border-yellow-500/50 bg-yellow-500/10' 
                      : 'border-white/10 bg-white/5 opacity-50'
                  }`}
                >
                  <p className="text-3xl mb-2">{badge.emoji}</p>
                  <p className="font-bold text-sm text-white">{badge.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{badge.description}</p>
                  {badge.unlockedAt && <p className="text-xs text-green-400 mt-1">✓ Unlocked</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="p-6 flex flex-col h-full overflow-hidden pb-24">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              <Search className="w-6 h-6 text-purple-500" /> Cari Chat
            </h2>
            
            <input
              type="text"
              placeholder="Cari pesan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white outline-none focus:border-purple-500 mb-4"
            />
            
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
              {searchResults.length > 0 ? (
                searchResults.map((chat) => (
                  <div
                    key={chat.id}
                    className={`p-4 rounded-2xl border border-white/10 ${
                      chat.sender === 'user' ? 'bg-white/5 text-white' : 'bg-purple-500/10 border-purple-500/30 text-purple-200'
                    }`}
                  >
                    <p className="text-xs text-gray-400 mb-1">{chat.sender === 'user' ? '👤 You' : '🤖 NOVA'}</p>
                    <p className="text-sm line-clamp-3">{chat.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 mt-8">Belum ada hasil pencarian</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="p-6 flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full animate-pulse"></div>
              <Zap className="w-32 h-32 text-green-400 relative z-10" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-2 text-white">NOVA Features</h2>
              <p className="text-gray-400 text-sm max-w-xs mx-auto">Semua fitur aktif dan berjalan optimal</p>
            </div>

            <div className="w-full max-w-xs bg-white/5 rounded-2xl p-5 border border-white/10 space-y-3 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">✅ Conversation Context</span>
                <span className="text-green-400 font-mono text-xs">Ingat</span>
              </div>
              <div className="h-px bg-white/5"></div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">✅ Sentiment Detection</span>
                <span className="text-green-400 font-mono text-xs">Aktif</span>
              </div>
              <div className="h-px bg-white/5"></div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">✅ Learning System</span>
                <span className="text-green-400 font-mono text-xs">Belajar</span>
              </div>
              <div className="h-px bg-white/5"></div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">✅ Web Search Real</span>
                <span className="text-green-400 font-mono text-xs">Online</span>
              </div>
              <div className="h-px bg-white/5"></div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">✅ Personalized</span>
                <span className="text-green-400 font-mono text-xs">Smart</span>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Input Area - FIXED DI BAWAH - OUTSIDE MAIN */}
      {activeTab === 'chat' && (
        <div className="fixed bottom-[80px] left-0 right-0 w-full p-2 bg-gradient-to-t from-black via-black/80 to-transparent pt-4 z-40">
          <div className="bg-gray-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 pl-3 flex items-center gap-1 shadow-[0_0_20px_rgba(0,0,0,0.4)] max-w-xl mx-auto mr-80">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-1 hover:bg-white/10 rounded-full transition-colors text-purple-400"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            
            <input 
              value={input || transcript}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(e)}
              placeholder="Pesan..." 
              className="flex-1 bg-transparent border-none outline-none text-xs placeholder:text-gray-500 text-white h-8"
            />
            
            {input.trim() ? (
              <button onClick={handleSend} className="p-1 bg-purple-600 hover:bg-purple-500 rounded-full transition-colors text-white shadow-lg">
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={() => isListening ? stopListening() : startListening()}
                className={`p-1 rounded-full transition-colors ${isListening ? 'bg-red-600 text-white animate-pulse' : 'text-gray-500 hover:bg-white/10'}`}
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-center text-[8px] text-gray-600 mt-1">💾 Local | 🎤 Voice</p>
        </div>
      )}

      {/* PDF Options Modal */}
      {pdfOptions?.showing && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-white">📄 Pilih Format PDF</h2>
            <p className="text-xs text-gray-400">Ketik nomor 1-4 untuk pilih format, lalu tekan Enter</p>
            
            <div className="space-y-2">
              <div className="bg-white/5 p-3 rounded-lg border border-white/10 hover:border-purple-500/50 transition-all cursor-pointer" onClick={() => setPdfChoice('1')}>
                <p className="font-bold text-white">1️⃣ Full Report</p>
                <p className="text-xs text-gray-400">Gambar + Analisis Lengkap</p>
              </div>
              <div className="bg-white/5 p-3 rounded-lg border border-white/10 hover:border-purple-500/50 transition-all cursor-pointer" onClick={() => setPdfChoice('2')}>
                <p className="font-bold text-white">2️⃣ Text Only</p>
                <p className="text-xs text-gray-400">Hanya Teks Analisis</p>
              </div>
              <div className="bg-white/5 p-3 rounded-lg border border-white/10 hover:border-purple-500/50 transition-all cursor-pointer" onClick={() => setPdfChoice('3')}>
                <p className="font-bold text-white">3️⃣ Image Only</p>
                <p className="text-xs text-gray-400">Hanya Gambar</p>
              </div>
              <div className="bg-white/5 p-3 rounded-lg border border-white/10 hover:border-purple-500/50 transition-all cursor-pointer" onClick={() => setPdfChoice('4')}>
                <p className="font-bold text-white">4️⃣ Compact</p>
                <p className="text-xs text-gray-400">Ringkas (Gambar + Teks Mini)</p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                value={pdfChoice}
                onChange={(e) => setPdfChoice(e.target.value.slice(-1))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && ['1', '2', '3', '4'].includes(pdfChoice)) {
                    downloadPDFByChoice(pdfChoice);
                  }
                }}
                placeholder="Ketik 1-4..."
                autoFocus
                type="text"
                className="flex-1 bg-black border border-white/20 rounded-lg px-4 py-2 text-white outline-none focus:border-purple-500 text-center text-lg font-bold"
                maxLength={1}
              />
              <button
                onClick={() => {
                  if (['1', '2', '3', '4'].includes(pdfChoice)) {
                    downloadPDFByChoice(pdfChoice);
                  }
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-bold transition-colors"
              >
                Download
              </button>
            </div>

            <button
              onClick={() => setPdfOptions(null)}
              className="w-full px-4 py-2 bg-gray-800 rounded-lg text-white hover:bg-gray-700 transition-colors text-sm"
            >
              Batal
            </button>
          </div>
        </motion.div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="p-6 flex flex-col h-full overflow-y-auto pb-24 custom-scrollbar space-y-4">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            ⚙️ Settings & Preferences
          </h2>
          
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-4">
            {/* Language */}
            <div>
              <label className="text-sm font-bold text-gray-300 mb-2 block">🌐 Language / Bahasa:</label>
              <div className="flex gap-2">
                {['id', 'en'].map((lang) => (
                  <button key={lang} onClick={() => setLanguage(lang as any)} className={`px-4 py-2 rounded transition-all ${language === lang ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                    {lang === 'id' ? '🇮🇩 Indonesian' : '🇺🇸 English'}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="text-sm font-bold text-gray-300 mb-2 block">📝 Font Size: {fontSize}px</label>
              <input type="range" min="12" max="24" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full" />
            </div>

            {/* Voice Type */}
            <div>
              <label className="text-sm font-bold text-gray-300 mb-2 block">🎤 Voice Type:</label>
              <select value={voiceType} onChange={(e) => setVoiceType(e.target.value as any)} className="w-full bg-gray-700 text-white rounded px-3 py-2">
                {voiceOptions.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Theme */}
            <div>
              <label className="text-sm font-bold text-gray-300 mb-2 block">🎨 Theme:</label>
              <select value={currentTheme} onChange={(e) => setCurrentThemeState(e.target.value as ThemeName)} className="w-full bg-gray-700 text-white rounded px-3 py-2">
                {Object.keys(THEMES).map((theme) => (
                  <option key={theme} value={theme}>{theme}</option>
                ))}
              </select>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-300">⌨️ Keyboard Shortcuts</label>
              <button onClick={() => setKeyboardShortcuts(!keyboardShortcuts)} className={`w-12 h-6 rounded-full transition-all ${keyboardShortcuts ? 'bg-green-600' : 'bg-gray-600'}`} />
            </div>
            <p className="text-xs text-gray-400">Ctrl+K: Search | Ctrl+1: Chat | Ctrl+2: Settings | Ctrl+E: Export</p>

            {/* Auto-Export Schedule */}
            <div>
              <label className="text-sm font-bold text-gray-300 mb-2 block">📅 Auto-Export Schedule:</label>
              <select value={exportSchedule} onChange={(e) => setExportSchedule(e.target.value as any)} className="w-full bg-gray-700 text-white rounded px-3 py-2">
                <option value="never">❌ Never</option>
                <option value="daily">📆 Daily</option>
                <option value="weekly">📅 Weekly</option>
                <option value="monthly">🗓️ Monthly</option>
              </select>
            </div>

            {/* Dark Mode */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-300">🌙 Dark Mode</label>
              <button onClick={() => setDarkMode(!darkMode)} className={`w-12 h-6 rounded-full transition-all ${darkMode ? 'bg-purple-600' : 'bg-yellow-500'}`} />
            </div>
          </div>
        </div>
      )}

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="p-6 flex flex-col h-full overflow-y-auto pb-24 custom-scrollbar space-y-4">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            👤 User Profile
          </h2>
          
          <div className="bg-white/5 rounded-2xl p-6 border border-purple-500/30 space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-300 mb-2 block">Name:</label>
              <input type="text" value={profileInput} onChange={(e) => setProfileInput(e.target.value)} onBlur={() => setUserProfile({...userProfile, name: profileInput})} className="w-full bg-gray-700 text-white rounded px-4 py-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-purple-600/20 rounded-lg p-3 border border-purple-500/30">
                <p className="text-3xl font-bold text-purple-400">{chats.length}</p>
                <p className="text-xs text-gray-400">Total Conversations</p>
              </div>
              <div className="bg-blue-600/20 rounded-lg p-3 border border-blue-500/30">
                <p className="text-3xl font-bold text-blue-400">{analytics.totalChats}</p>
                <p className="text-xs text-gray-400">Chat Sessions</p>
              </div>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-bold text-white">📊 Top Topics:</p>
              {Object.entries(conversationStats).slice(0, 5).map(([word, count]) => (
                <div key={word} className="flex justify-between text-xs text-gray-300">
                  <span>{word}</span>
                  <span className="text-purple-400 font-bold">{count}x</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MANAGE CONVERSATIONS TAB */}
      {activeTab === 'manage' && (
        <div className="p-6 flex flex-col h-full overflow-y-auto pb-24 custom-scrollbar space-y-4">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            💬 Manage Conversations
          </h2>
          
          <div className="space-y-2">
            {chats.slice(-10).map((chat) => (
              <div key={chat.id} className="bg-white/5 rounded-lg p-3 border border-white/10 flex items-center justify-between">
                <p className="text-xs text-gray-300 line-clamp-1">{chat.text.substring(0, 50)}...</p>
                <div className="flex gap-1">
                  <button onClick={() => setFavoriteChats(favoriteChats.includes(chat.id) ? favoriteChats.filter(id => id !== chat.id) : [...favoriteChats, chat.id])} className={`text-lg ${favoriteChats.includes(chat.id) ? '⭐' : '☆'}`} title="Toggle favorite" />
                  <button onClick={() => setChats(chats.filter(c => c.id !== chat.id))} className="text-lg hover:text-red-500" title="Delete">🗑️</button>
                </div>
              </div>
            ))}
          </div>
          
          <button onClick={() => {
            if (confirm('Delete ALL conversations?')) {
              setChats(INITIAL_CHATS);
              setFavoriteChats([]);
            }
          }} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-lg transition-colors">
            🗑️ Clear All Chats
          </button>
        </div>
      )}

      {/* DOCUMENT Q&A TAB */}
      {activeTab === 'documents' && (
        <div className="p-6 flex flex-col h-full overflow-y-auto pb-24 custom-scrollbar space-y-4">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            📄 Document Q&A
          </h2>
          
          {!documentAnalysis ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <p className="text-4xl">📎</p>
              <p className="text-gray-400">Upload document untuk Q&A</p>
              <button onClick={() => fileUploadRef.current?.click()} className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors">
                📁 Upload Document
              </button>
              <input ref={fileUploadRef} type="file" accept=".pdf,.txt,.doc,.docx" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    setDocumentAnalysis({
                      text: evt.target?.result as string,
                      filename: file.name
                    });
                  };
                  reader.readAsText(file);
                }
              }} className="hidden" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-sm font-bold text-gray-300">📄 {documentAnalysis.filename}</p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-3">{documentAnalysis.text.substring(0, 200)}...</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-xs text-gray-400 mb-2">📊 Document Stats:</p>
                <div className="space-y-1 text-xs text-gray-300">
                  <p>Words: {documentAnalysis.text.split(/\s+/).length}</p>
                  <p>Characters: {documentAnalysis.text.length}</p>
                  <p>Paragraphs: {documentAnalysis.text.split(/\n\n+/).length}</p>
                </div>
              </div>
              <input type="text" placeholder="Tanya tentang dokumen..." className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm" onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.target as any).value) {
                  setInput(`Berdasarkan dokumen "${documentAnalysis.filename}": ${(e.target as any).value}`);
                  setActiveTab('chat');
                  (e.target as any).value = '';
                }
              }} />
              <button onClick={() => setDocumentAnalysis(null)} className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded-lg transition-colors">
                ❌ Clear Document
              </button>
            </div>
          )}
        </div>
      )}

      {/* GOOGLE SEARCH TAB - REAL RESULTS */}
      {activeTab === 'googlesearch' && (
        <div className="p-6 flex flex-col h-full overflow-y-auto pb-24 custom-scrollbar space-y-4">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            🔍 Google Search
          </h2>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={googleSearchQuery}
              onChange={(e) => setGoogleSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && performGoogleSearch(googleSearchQuery)}
              placeholder="Cari apapun..."
              className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-blue-500 border border-white/20"
            />
            <button
              onClick={() => performGoogleSearch(googleSearchQuery)}
              disabled={googleSearchLoading}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              {googleSearchLoading ? '⏳' : '🔍'}
            </button>
          </div>

          {googleSearchLoading && (
            <div className="text-center py-8">
              <p className="text-gray-400">🔄 Searching...</p>
            </div>
          )}

          {googleSearchResults.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">Found {googleSearchResults.length} results</p>
              {googleSearchResults.map((result, idx) => (
                <a
                  key={idx}
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white/5 hover:bg-white/10 rounded-lg p-3 border border-white/10 hover:border-blue-500/50 transition-all cursor-pointer"
                  data-testid={`search-result-${idx}`}
                >
                  <p className="text-sm font-bold text-blue-400 line-clamp-2">{result.title}</p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{result.snippet}</p>
                  <p className="text-[10px] text-gray-500 mt-2 truncate">{result.url}</p>
                </a>
              ))}
            </div>
          ) : (
            googleSearchQuery && !googleSearchLoading && (
              <div className="text-center py-8 text-gray-400">
                <p>Tidak ada hasil untuk: "{googleSearchQuery}"</p>
                <p className="text-xs mt-2">Coba query lain</p>
              </div>
            )
          )}

          {!googleSearchQuery && googleSearchResults.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-lg">🔍 Google Search Real-time</p>
              <p className="text-xs mt-2">Powered by DuckDuckGo & Wikipedia</p>
              <p className="text-xs mt-4">Ketik query & tekan Enter untuk cari!</p>
            </div>
          )}
        </div>
      )}

      {/* YouTube + MP3 Mini Player - FIXED di Kanan */}
      {activeTab === 'chat' && (
        <div className="fixed right-0 top-[70px] bottom-[80px] w-80 flex flex-col bg-black/50 border-l border-white/10 overflow-hidden z-40">
          {/* Mode Selector */}
          <div className="flex gap-1 p-2 border-b border-white/10 bg-black/40 flex-wrap">
            <button
              onClick={() => setPlayerMode('youtube')}
              className={`text-[9px] font-bold py-1 px-2 rounded transition-colors flex-1 ${playerMode === 'youtube' ? 'bg-red-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
            >
              ▶️ YouTube
            </button>
            <button
              onClick={() => setPlayerMode('mp3')}
              className={`text-[9px] font-bold py-1 px-2 rounded transition-colors flex-1 ${playerMode === 'mp3' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
            >
              🎵 MP3
            </button>
          </div>

          {/* YouTube Playlists Selector */}
          {playerMode === 'youtube' && (
            <div className="flex gap-1 p-2 border-b border-white/10 bg-black/30 flex-wrap">
              <button
                onClick={() => setCurrentPlaylist('western')}
                className={`text-[8px] font-bold py-1 px-1.5 rounded transition-colors flex-1 ${currentPlaylist === 'western' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                title="Western Songs"
              >
                🎸
              </button>
              <button
                onClick={() => setCurrentPlaylist('indonesian')}
                className={`text-[8px] font-bold py-1 px-1.5 rounded transition-colors flex-1 ${currentPlaylist === 'indonesian' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                title="Indonesian Songs"
              >
                🎤
              </button>
              <button
                onClick={() => setCurrentPlaylist('funny')}
                className={`text-[8px] font-bold py-1 px-1.5 rounded transition-colors flex-1 ${currentPlaylist === 'funny' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                title="Latest Hits"
              >
                🔥
              </button>
              <button
                onClick={() => setCurrentPlaylist('podcast')}
                className={`text-[8px] font-bold py-1 px-1.5 rounded transition-colors flex-1 ${currentPlaylist === 'podcast' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                title="Podcast"
              >
                🎙️
              </button>
            </div>
          )}

          {/* Player Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {playerMode === 'youtube' ? (
              currentVideo ? (
                <>
                  {/* YouTube Video Display */}
                  <div className="bg-white/5 rounded-lg overflow-hidden border border-white/10">
                    <div className="aspect-video bg-black flex items-center justify-center">
                      <iframe
                        width="100%"
                        height="200"
                        src={`https://www.youtube.com/embed/${currentVideo.id}?autoplay=1`}
                        title={currentVideo.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full"
                      ></iframe>
                    </div>
                    <div className="p-2 border-t border-white/10">
                      <p className="text-xs text-gray-300 line-clamp-2">{currentVideo.title}</p>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentVideo(getRandomVideo(currentPlaylist))}
                      className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors"
                    >
                      Random
                    </button>
                    <button
                      onClick={() => {
                        const playlist = PLAYLISTS[currentPlaylist].videos;
                        const randomIdx = Math.floor(Math.random() * playlist.length);
                        setCurrentVideo(playlist[randomIdx]);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors"
                    >
                      Next
                    </button>
                  </div>

                  {/* Playlist Preview */}
                  <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                    <p className="text-[10px] text-gray-400 mb-2 font-bold">🎧 Playlist ({PLAYLISTS[currentPlaylist].videos.length})</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {PLAYLISTS[currentPlaylist].videos.slice(0, 10).map((video, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentVideo(video)}
                          className={`w-full text-left text-[9px] p-1 rounded transition-colors ${
                            currentVideo?.id === video.id
                              ? 'bg-purple-600/50 text-white'
                              : 'bg-white/5 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          {idx + 1}. {video.title.substring(0, 35)}...
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-6">
                  <p className="text-2xl">▶️</p>
                  <p className="text-xs text-gray-400">Pilih & play</p>
                  <button
                    onClick={() => setCurrentVideo(getRandomVideo(currentPlaylist))}
                    className="mt-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    Start
                  </button>
                </div>
              )
            ) : (
              currentMp3 ? (
                <>
                  {/* MP3 Player */}
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs font-bold text-white mb-3">🎵 Now Playing</p>
                    <audio ref={audioRef} src={currentMp3.url} controls className="w-full mb-3" autoPlay />
                    <p className="text-xs text-gray-300 line-clamp-2">{currentMp3.title}</p>
                  </div>

                  {/* MP3 Controls */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const randomIdx = Math.floor(Math.random() * mp3Playlist.length);
                        setCurrentMp3(mp3Playlist[randomIdx]);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors"
                    >
                      Random
                    </button>
                    <button
                      onClick={() => {
                        const currentIdx = mp3Playlist.findIndex(m => m.id === currentMp3.id);
                        const nextIdx = (currentIdx + 1) % mp3Playlist.length;
                        setCurrentMp3(mp3Playlist[nextIdx]);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors"
                    >
                      Next
                    </button>
                  </div>

                  {/* MP3 Playlist */}
                  <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                    <p className="text-[10px] text-gray-400 mb-2 font-bold">🎵 Playlist ({mp3Playlist.length})</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {mp3Playlist.map((track, idx) => (
                        <button
                          key={track.id}
                          onClick={() => setCurrentMp3(track)}
                          className={`w-full text-left text-[9px] p-1 rounded transition-colors ${
                            currentMp3?.id === track.id
                              ? 'bg-blue-600/50 text-white'
                              : 'bg-white/5 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          {track.title.substring(0, 38)}...
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-6">
                  <p className="text-2xl">🎵</p>
                  <p className="text-xs text-gray-400">Pilih lagu</p>
                  <button
                    onClick={() => setCurrentMp3(mp3Playlist[0])}
                    className="mt-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    Start
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <nav className={`backdrop-blur-xl px-3 py-4 pb-6 flex justify-around items-center z-50 overflow-x-auto transition-colors duration-300 ${darkMode ? 'bg-black/80 border-t border-white/10' : 'bg-white/80 border-t border-black/10'}`}>
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center gap-1.5 transition-all p-2 rounded-xl whitespace-nowrap ${activeTab === 'chat' ? 'text-purple-400 bg-purple-500/10 scale-110' : darkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Bot className="w-6 h-6" />
          <span className="text-[10px] font-bold">Chat</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-1.5 transition-all p-2 rounded-xl whitespace-nowrap ${activeTab === 'analytics' ? 'text-purple-400 bg-purple-500/10 scale-110' : darkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <BarChart3 className="w-6 h-6" />
          <span className="text-[10px] font-bold">Stats</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('prompts')}
          className={`flex flex-col items-center gap-1.5 transition-all p-2 rounded-xl whitespace-nowrap ${activeTab === 'prompts' ? 'text-purple-400 bg-purple-500/10 scale-110' : darkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <span className="text-lg">🤖</span>
          <span className="text-[10px] font-bold">Prompts</span>
        </button>

        <button 
          onClick={() => setActiveTab('badges')}
          className={`flex flex-col items-center gap-1.5 transition-all p-2 rounded-xl whitespace-nowrap ${activeTab === 'badges' ? 'text-purple-400 bg-purple-500/10 scale-110' : darkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Trophy className="w-6 h-6" />
          <span className="text-[10px] font-bold">Badges</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('gallery')}
          className={`flex flex-col items-center gap-1.5 transition-all p-2 rounded-xl whitespace-nowrap ${activeTab === 'gallery' ? 'text-purple-400 bg-purple-500/10 scale-110' : darkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <ImageIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold">PDF</span>
        </button>

        <button 
          onClick={() => setActiveTab('editor')}
          className={`flex flex-col items-center gap-1.5 transition-all p-2 rounded-xl whitespace-nowrap ${activeTab === 'editor' ? 'text-purple-400 bg-purple-500/10 scale-110' : darkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <span className="text-xl">📸</span>
          <span className="text-[10px] font-bold">Editor</span>
        </button>

        <button 
          onClick={() => setActiveTab('cards')}
          className={`flex flex-col items-center gap-1.5 transition-all p-2 rounded-xl whitespace-nowrap ${activeTab === 'cards' ? 'text-purple-400 bg-purple-500/10 scale-110' : darkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <span className="text-xl">🎉</span>
          <span className="text-[10px] font-bold">Cards</span>
        </button>

        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1.5 transition-all p-2 rounded-xl whitespace-nowrap ${activeTab === 'settings' ? 'text-purple-400 bg-purple-500/10 scale-110' : darkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-bold">Settings</span>
        </button>

        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1.5 transition-all p-2 rounded-xl whitespace-nowrap ${activeTab === 'profile' ? 'text-purple-400 bg-purple-500/10 scale-110' : darkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <span className="text-lg">👤</span>
          <span className="text-[10px] font-bold">Profile</span>
        </button>

        <button 
          onClick={() => setActiveTab('manage')}
          className={`flex flex-col items-center gap-1.5 transition-all p-2 rounded-xl whitespace-nowrap ${activeTab === 'manage' ? 'text-purple-400 bg-purple-500/10 scale-110' : darkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <span className="text-lg">💬</span>
          <span className="text-[10px] font-bold">Manage</span>
        </button>

        <button 
          onClick={() => setActiveTab('documents')}
          className={`flex flex-col items-center gap-1.5 transition-all p-2 rounded-xl whitespace-nowrap ${activeTab === 'documents' ? 'text-purple-400 bg-purple-500/10 scale-110' : darkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <span className="text-lg">📄</span>
          <span className="text-[10px] font-bold">Docs</span>
        </button>

        <button 
          onClick={() => setActiveTab('googlesearch')}
          className={`flex flex-col items-center gap-1.5 transition-all p-2 rounded-xl whitespace-nowrap ${activeTab === 'googlesearch' ? 'text-blue-400 bg-blue-500/10 scale-110' : darkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <span className="text-lg">🔍</span>
          <span className="text-[10px] font-bold">Search</span>
        </button>

        <button 
          onClick={() => setActiveTab('games')}
          className={`flex flex-col items-center gap-1.5 transition-all p-2 rounded-xl whitespace-nowrap ${activeTab === 'games' ? 'text-purple-400 bg-purple-500/10 scale-110' : darkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <span className="text-xl">🎮</span>
          <span className="text-[10px] font-bold">Games</span>
        </button>
      </nav>

    </div>
  );
}
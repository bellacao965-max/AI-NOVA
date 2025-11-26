// Chat Analytics Tracker
export interface ChatStats {
  totalChats: number;
  topicFrequency: Record<string, number>;
  sentimentBreakdown: { positive: number; negative: number; neutral: number; question: number };
  avgResponseTime: number;
  favoriteTopics: string[];
  lastActiveTime: number;
}

export function initializeAnalytics(): ChatStats {
  const saved = localStorage.getItem('novaAnalytics');
  return saved ? JSON.parse(saved) : {
    totalChats: 0,
    topicFrequency: {},
    sentimentBreakdown: { positive: 0, negative: 0, neutral: 0, question: 0 },
    avgResponseTime: 0,
    favoriteTopics: [],
    lastActiveTime: Date.now(),
  };
}

export function trackChat(message: string, sentiment: string): void {
  const stats = initializeAnalytics();
  stats.totalChats++;
  stats.lastActiveTime = Date.now();
  
  const words = message.toLowerCase().split(' ');
  words.forEach(word => {
    if (word.length > 3) {
      stats.topicFrequency[word] = (stats.topicFrequency[word] || 0) + 1;
    }
  });
  
  stats.sentimentBreakdown[sentiment as any] = (stats.sentimentBreakdown[sentiment as any] || 0) + 1;
  
  const sorted = Object.entries(stats.topicFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic);
  stats.favoriteTopics = sorted;
  
  localStorage.setItem('novaAnalytics', JSON.stringify(stats));
}

export function getAnalytics(): ChatStats {
  return initializeAnalytics();
}

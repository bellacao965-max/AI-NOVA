// Achievement Badges System
export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  condition: (stats: any) => boolean;
  unlockedAt?: number;
}

export const BADGES: Badge[] = [
  {
    id: 'first-chat',
    name: 'First Chat',
    emoji: '🚀',
    description: 'Kirim chat pertama',
    condition: (stats) => stats.totalChats >= 1
  },
  {
    id: 'ten-chats',
    name: '10 Conversations',
    emoji: '🎯',
    description: 'Chat 10 kali',
    condition: (stats) => stats.totalChats >= 10
  },
  {
    id: 'fifty-chats',
    name: 'Chat Master',
    emoji: '👑',
    description: 'Chat 50 kali',
    condition: (stats) => stats.totalChats >= 50
  },
  {
    id: 'all-voices',
    name: 'Voice Master',
    emoji: '🎤',
    description: 'Gunakan semua 4 suara',
    condition: (stats) => stats.voicesUsed?.length === 4
  },
  {
    id: 'positive-vibe',
    name: 'Positive Energy',
    emoji: '✨',
    description: 'Chat dengan sentiment positif',
    condition: (stats) => stats.sentimentBreakdown.positive >= 5
  },
  {
    id: 'curious-mind',
    name: 'Curious Mind',
    emoji: '🧠',
    description: 'Ajukan banyak pertanyaan',
    condition: (stats) => stats.sentimentBreakdown.question >= 10
  },
];

export function initializeBadges(): Badge[] {
  const saved = localStorage.getItem('novaBadges');
  let savedData: any[] = [];
  try {
    savedData = saved ? JSON.parse(saved) : [];
  } catch {
    savedData = [];
  }
  
  // Always merge with BADGES to restore condition functions
  return BADGES.map(badge => ({
    ...badge,
    unlockedAt: savedData.find(b => b.id === badge.id)?.unlockedAt
  }));
}

export function checkBadges(stats: any): Badge[] {
  const badges = initializeBadges();
  badges.forEach(badge => {
    if (!badge.unlockedAt && typeof badge.condition === 'function') {
      try {
        if (badge.condition(stats)) {
          badge.unlockedAt = Date.now();
        }
      } catch (e) {
        console.warn(`Badge condition error for ${badge.id}:`, e);
      }
    }
  });
  
  // Only save id and unlockedAt to localStorage (not condition functions)
  const toSave = badges.map(b => ({ id: b.id, unlockedAt: b.unlockedAt }));
  localStorage.setItem('novaBadges', JSON.stringify(toSave));
  return badges;
}

export function getUnlockedBadges(): Badge[] {
  return initializeBadges().filter(b => b.unlockedAt);
}

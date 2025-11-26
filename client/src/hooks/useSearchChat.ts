import { useState, useMemo } from 'react';

export interface ChatMessage {
  id: number;
  sender: 'user' | 'ai';
  text: string;
}

export function useSearchChat(chats: ChatMessage[]) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const results = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    
    const query = searchQuery.toLowerCase();
    return chats.filter(chat => 
      chat.text.toLowerCase().includes(query) ||
      chat.sender.includes(query)
    );
  }, [chats, searchQuery]);
  
  return {
    searchQuery,
    setSearchQuery,
    results,
    resultCount: results.length
  };
}

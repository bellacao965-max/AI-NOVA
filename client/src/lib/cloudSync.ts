// Cloud sync utilities for syncing local chats to backend database
import { api } from "./api";

export interface CloudSyncOptions {
  userId?: string;
  conversationId?: string;
}

export async function syncConversationToCloud(
  title: string,
  messages: any[],
  conversationId?: string
): Promise<any> {
  try {
    if (conversationId) {
      // Update existing conversation
      return await api.updateConversation(conversationId, { messages, updatedAt: new Date().toISOString() });
    } else {
      // Create new conversation
      return await api.createConversation({ title, messages });
    }
  } catch (error) {
    console.error("Failed to sync conversation:", error);
    throw error;
  }
}

export async function loadConversationsFromCloud(): Promise<any[]> {
  try {
    return await api.getConversations();
  } catch (error) {
    console.error("Failed to load conversations:", error);
    return [];
  }
}

export async function deleteConversationFromCloud(conversationId: string): Promise<void> {
  try {
    await api.deleteConversation(conversationId);
  } catch (error) {
    console.error("Failed to delete conversation:", error);
    throw error;
  }
}

export async function recordUserLearning(topic: string, sentimentScore?: number): Promise<any> {
  try {
    return await api.recordLearning({ topic, sentimentScore });
  } catch (error) {
    console.error("Failed to record learning:", error);
    // Silently fail for optional feature
    return null;
  }
}

import {
  users,
  conversations,
  generatedImages,
  weatherCache,
  financeCache,
  sportsCache,
  userLearning,
  conversationShares,
  documents,
  userPreferences,
  type User,
  type UpsertUser,
  type Conversation,
  type InsertConversation,
  type GeneratedImage,
  type InsertGeneratedImage,
  type UserLearning,
  type InsertUserLearning,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Conversation operations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | undefined>;
  getUserConversations(userId: string): Promise<Conversation[]>;
  updateConversation(id: string, data: Partial<Conversation>): Promise<Conversation | undefined>;
  deleteConversation(id: string): Promise<void>;
  
  // Generated images operations
  createGeneratedImage(image: InsertGeneratedImage): Promise<GeneratedImage>;
  getUserGeneratedImages(userId: string): Promise<GeneratedImage[]>;
  
  // Cache operations
  getWeatherCache(location: string): Promise<any | undefined>;
  setWeatherCache(location: string, data: any): Promise<void>;
  getFinanceCache(symbol: string): Promise<any | undefined>;
  setFinanceCache(symbol: string, data: any): Promise<void>;
  getSportsCache(topic: string): Promise<any | undefined>;
  setSportsCache(topic: string, data: any): Promise<void>;
  
  // Learning operations
  recordLearning(learning: InsertUserLearning): Promise<UserLearning>;
  getUserLearning(userId: string): Promise<UserLearning[]>;

  // Share operations
  createShare(conversationId: string, userId: string): Promise<string>;
  getConversationByShareToken(token: string): Promise<Conversation | undefined>;

  // Document operations
  uploadDocument(userId: string, fileName: string, content: string, fileType: string): Promise<any>;
  getUserDocuments(userId: string): Promise<any[]>;
  deleteDocument(id: string): Promise<void>;

  // Preferences operations
  getUserPreferences(userId: string): Promise<any | undefined>;
  updateUserPreferences(userId: string, prefs: any): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: userData,
      })
      .returning();
    return user;
  }

  // Conversation operations
  async createConversation(data: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(data)
      .returning();
    return conversation;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation;
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  }

  async updateConversation(id: string, data: Partial<Conversation>): Promise<Conversation | undefined> {
    const [updated] = await db
      .update(conversations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return updated;
  }

  async deleteConversation(id: string): Promise<void> {
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  // Generated images operations
  async createGeneratedImage(data: InsertGeneratedImage): Promise<GeneratedImage> {
    const [image] = await db
      .insert(generatedImages)
      .values(data)
      .returning();
    return image;
  }

  async getUserGeneratedImages(userId: string): Promise<GeneratedImage[]> {
    return await db
      .select()
      .from(generatedImages)
      .where(eq(generatedImages.userId, userId))
      .orderBy(desc(generatedImages.createdAt));
  }

  // Cache operations
  async getWeatherCache(location: string): Promise<any | undefined> {
    const [cached] = await db
      .select()
      .from(weatherCache)
      .where(eq(weatherCache.location, location));
    
    if (cached && cached.createdAt) {
      const age = Date.now() - cached.createdAt.getTime();
      if (age < 3600000) { // 1 hour cache
        return cached.data;
      }
      await db.delete(weatherCache).where(eq(weatherCache.id, cached.id));
    }
    return undefined;
  }

  async setWeatherCache(location: string, data: any): Promise<void> {
    await db.insert(weatherCache).values({ location, data });
  }

  async getFinanceCache(symbol: string): Promise<any | undefined> {
    const [cached] = await db
      .select()
      .from(financeCache)
      .where(eq(financeCache.symbol, symbol));
    
    if (cached && cached.createdAt) {
      const age = Date.now() - cached.createdAt.getTime();
      if (age < 3600000) { // 1 hour cache
        return cached.data;
      }
      await db.delete(financeCache).where(eq(financeCache.id, cached.id));
    }
    return undefined;
  }

  async setFinanceCache(symbol: string, data: any): Promise<void> {
    await db.insert(financeCache).values({ symbol, data });
  }

  async getSportsCache(topic: string): Promise<any | undefined> {
    const [cached] = await db
      .select()
      .from(sportsCache)
      .where(eq(sportsCache.topic, topic));
    
    if (cached && cached.createdAt) {
      const age = Date.now() - cached.createdAt.getTime();
      if (age < 3600000) { // 1 hour cache
        return cached.data;
      }
      await db.delete(sportsCache).where(eq(sportsCache.id, cached.id));
    }
    return undefined;
  }

  async setSportsCache(topic: string, data: any): Promise<void> {
    await db.insert(sportsCache).values({ topic, data });
  }

  // Learning operations
  async recordLearning(data: InsertUserLearning): Promise<UserLearning> {
    const existing = await db
      .select()
      .from(userLearning)
      .where(and(eq(userLearning.userId, data.userId), eq(userLearning.topic, data.topic)));
    
    if (existing.length > 0) {
      const [updated] = await db
        .update(userLearning)
        .set({
          interactionCount: (existing[0].interactionCount || 0) + 1,
          lastInteraction: new Date(),
        })
        .where(eq(userLearning.id, existing[0].id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(userLearning)
      .values(data)
      .returning();
    return created;
  }

  async getUserLearning(userId: string): Promise<UserLearning[]> {
    return await db
      .select()
      .from(userLearning)
      .where(eq(userLearning.userId, userId))
      .orderBy(desc(userLearning.interactionCount));
  }

  // Share operations
  async createShare(conversationId: string, userId: string): Promise<string> {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    await db
      .insert(conversationShares)
      .values({ conversationId, userId, shareToken: token });
    return token;
  }

  async getConversationByShareToken(token: string): Promise<Conversation | undefined> {
    const [share] = await db
      .select()
      .from(conversationShares)
      .where(eq(conversationShares.shareToken, token));
    
    if (!share) return undefined;
    return await this.getConversation(share.conversationId);
  }

  // Document operations
  async uploadDocument(userId: string, fileName: string, content: string, fileType: string): Promise<any> {
    const [doc] = await db
      .insert(documents)
      .values({ userId, fileName, content, fileType })
      .returning();
    return doc;
  }

  async getUserDocuments(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt));
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Preferences operations
  async getUserPreferences(userId: string): Promise<any | undefined> {
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return prefs;
  }

  async updateUserPreferences(userId: string, prefs: any): Promise<any> {
    const [updated] = await db
      .insert(userPreferences)
      .values({ userId, ...prefs })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { ...prefs, updatedAt: new Date() },
      })
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();

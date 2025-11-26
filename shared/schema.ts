import { sql } from 'drizzle-orm';
import { pgTable, text, varchar, timestamp, jsonb, integer, decimal, index } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Session storage table (IMPORTANT - required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (IMPORTANT - required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  preferences: jsonb("preferences").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Conversations table - stores chat history
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  messages: jsonb("messages").notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [index("IDX_conversations_user_id").on(table.userId)]);

// Generated images table - stores DALL-E/Stable Diffusion outputs
export const generatedImages = pgTable("generated_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  url: text("url").notNull(),
  model: varchar("model").notNull(), // 'dall-e-3', 'stable-diffusion'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("IDX_generated_images_user_id").on(table.userId)]);

// Weather cache - stores recent weather queries
export const weatherCache = pgTable("weather_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  location: varchar("location").notNull(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Finance data cache
export const financeCache = pgTable("finance_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: varchar("symbol").notNull(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sports data cache
export const sportsCache = pgTable("sports_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  topic: varchar("topic").notNull(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User learning data - tracks learning patterns
export const userLearning = pgTable("user_learning", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  topic: varchar("topic").notNull(),
  interactionCount: integer("interaction_count").default(0),
  sentimentScore: decimal("sentiment_score", { precision: 3, scale: 2 }).notNull().default("0"),
  lastInteraction: timestamp("last_interaction").defaultNow(),
}, (table) => [index("IDX_user_learning_user_id").on(table.userId)]);

// Conversation shares - for sharing conversations
export const conversationShares = pgTable("conversation_shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  shareToken: varchar("share_token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
}, (table) => [index("IDX_shares_user_id").on(table.userId)]);

// Documents for Q&A
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileName: varchar("file_name").notNull(),
  content: text("content").notNull(),
  fileType: varchar("file_type").notNull(), // pdf, txt, json
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("IDX_documents_user_id").on(table.userId)]);

// User extended preferences
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  language: varchar("language").default("id"), // id, en, es, fr, de, ja
  aiPersonality: varchar("ai_personality").default("helpful"), // helpful, formal, casual, technical, humorous
  rememberContext: integer("remember_context").default(5), // context depth
  autoTranslate: integer("auto_translate").default(0), // 0 or 1
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [index("IDX_prefs_user_id").on(table.userId)]);

// Type definitions
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

export type GeneratedImage = typeof generatedImages.$inferSelect;
export type InsertGeneratedImage = typeof generatedImages.$inferInsert;

export type UserLearning = typeof userLearning.$inferSelect;
export type InsertUserLearning = typeof userLearning.$inferInsert;

// Zod schemas for validation
export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGeneratedImageSchema = createInsertSchema(generatedImages).omit({
  id: true,
  createdAt: true,
});

export const insertUserLearningSchema = createInsertSchema(userLearning).omit({
  id: true,
  lastInteraction: true,
});

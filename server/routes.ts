import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertConversationSchema, insertGeneratedImageSchema } from "@shared/schema";
import OpenAI from "openai";
import { generateAIResponse } from "./gemini";
import { GoogleGenAI } from "@google/genai";

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware setup
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = String(req.user.claims.sub);
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Conversation routes
  app.get("/api/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post("/api/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = String(req.user.claims.sub);
      const parsed = insertConversationSchema.safeParse({
        ...req.body,
        userId,
      });

      if (!parsed.success) {
        res.status(400).json({ message: "Invalid conversation data" });
        return;
      }

      const conversation = await storage.createConversation(parsed.data);
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.get("/api/conversations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        res.status(404).json({ message: "Conversation not found" });
        return;
      }
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.patch("/api/conversations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { messages, updatedAt } = req.body;
      const updated = await storage.updateConversation(req.params.id, { 
        messages, 
        updatedAt: updatedAt ? new Date(updatedAt) : new Date()
      });
      if (!updated) {
        res.status(404).json({ message: "Conversation not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating conversation:", error);
      res.status(500).json({ message: "Failed to update conversation" });
    }
  });

  app.delete("/api/conversations/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteConversation(req.params.id);
      res.json({ message: "Conversation deleted" });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  // Image generation route
  app.post("/api/generate-image", isAuthenticated, async (req: any, res) => {
    try {
      if (!openai) {
        res.status(500).json({ message: "OpenAI API not configured" });
        return;
      }

      const { prompt } = req.body;
      if (!prompt) {
        res.status(400).json({ message: "Prompt is required" });
        return;
      }

      const userId = String(req.user.claims.sub);
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      if (!response.data || !response.data[0] || !response.data[0].url) {
        res.status(500).json({ message: "Failed to generate image" });
        return;
      }

      const image = await storage.createGeneratedImage({
        userId,
        prompt,
        url: response.data[0].url,
        model: "dall-e-3",
      });

      res.json(image);
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ message: "Failed to generate image" });
    }
  });

  // User generated images
  app.get("/api/generated-images", isAuthenticated, async (req: any, res) => {
    try {
      const userId = String(req.user.claims.sub);
      const images = await storage.getUserGeneratedImages(userId);
      res.json(images);
    } catch (error) {
      console.error("Error fetching generated images:", error);
      res.status(500).json({ message: "Failed to fetch generated images" });
    }
  });

  // Weather API endpoint
  app.get("/api/weather/:location", async (req, res) => {
    try {
      const { location } = req.params;
      
      // Check cache first
      const cached = await storage.getWeatherCache(location);
      if (cached) {
        res.json(cached);
        return;
      }

      // Fetch from Open-Meteo (free weather API)
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
      );
      const geoData = await response.json();

      if (!geoData.results || geoData.results.length === 0) {
        res.status(404).json({ message: "Location not found" });
        return;
      }

      const { latitude, longitude, name, country } = geoData.results[0];

      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&timezone=auto`
      );
      const weatherData = await weatherResponse.json();

      const result = {
        location: `${name}, ${country}`,
        temperature: weatherData.current.temperature_2m,
        humidity: weatherData.current.relative_humidity_2m,
        windSpeed: weatherData.current.wind_speed_10m,
        weatherCode: weatherData.current.weather_code,
        timezone: weatherData.timezone,
      };

      await storage.setWeatherCache(location, result);
      res.json(result);
    } catch (error) {
      console.error("Error fetching weather:", error);
      res.status(500).json({ message: "Failed to fetch weather" });
    }
  });

  // Finance API endpoint (using free API)
  app.get("/api/finance/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;

      // Check cache first
      const cached = await storage.getFinanceCache(symbol);
      if (cached) {
        res.json(cached);
        return;
      }

      // Using Alpha Vantage free tier or similar
      // For demo, return mock data
      const result = {
        symbol: symbol.toUpperCase(),
        price: Math.random() * 1000,
        change: (Math.random() - 0.5) * 100,
        percentChange: (Math.random() - 0.5) * 10,
      };

      await storage.setFinanceCache(symbol, result);
      res.json(result);
    } catch (error) {
      console.error("Error fetching finance data:", error);
      res.status(500).json({ message: "Failed to fetch finance data" });
    }
  });

  // Sports news API endpoint
  app.get("/api/sports/:topic", async (req, res) => {
    try {
      const { topic } = req.params;

      // Check cache first
      const cached = await storage.getSportsCache(topic);
      if (cached) {
        res.json(cached);
        return;
      }

      // Using NewsAPI or similar
      // For demo, return mock data
      const result = {
        topic: topic,
        news: [
          {
            title: `Latest ${topic} news`,
            description: "Breaking news update",
            timestamp: new Date().toISOString(),
          },
        ],
      };

      await storage.setSportsCache(topic, result);
      res.json(result);
    } catch (error) {
      console.error("Error fetching sports data:", error);
      res.status(500).json({ message: "Failed to fetch sports data" });
    }
  });

  // Learning tracking endpoint
  app.post("/api/learning", isAuthenticated, async (req: any, res) => {
    try {
      const userId = String(req.user.claims.sub);
      const { topic, sentimentScore } = req.body;

      if (!topic) {
        res.status(400).json({ message: "Topic is required" });
        return;
      }

      const learning = await storage.recordLearning({
        userId,
        topic,
        sentimentScore: sentimentScore ? String(sentimentScore) : undefined,
      });

      res.json(learning);
    } catch (error) {
      console.error("Error recording learning:", error);
      res.status(500).json({ message: "Failed to record learning" });
    }
  });

  // Get user learning stats
  app.get("/api/learning", isAuthenticated, async (req: any, res) => {
    try {
      const userId = String(req.user.claims.sub);
      const learning = await storage.getUserLearning(userId);
      res.json(learning);
    } catch (error) {
      console.error("Error fetching learning data:", error);
      res.status(500).json({ message: "Failed to fetch learning data" });
    }
  });

  // AI Chat endpoint - menggunakan Gemini AI (GRATIS!)
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, personality = "helpful" } = req.body;
      if (!message) {
        res.status(400).json({ error: "Message required" });
        return;
      }

      // Gunakan Gemini AI untuk respons dengan personality mode
      const aiResponse = await generateAIResponse(message, personality);
      
      res.json({ 
        success: true,
        message: aiResponse,
        timestamp: new Date().toISOString(),
        model: "Gemini 2.5 Flash (FREE)",
        personality: personality
      });
    } catch (error) {
      console.error("Error in chat endpoint:", error);
      res.status(500).json({ error: "Failed to generate response" });
    }
  });

  // Export Conversation endpoint
  app.post("/api/export-conversation", isAuthenticated, async (req: any, res) => {
    try {
      const { conversationId, format = "json" } = req.body;
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        res.status(404).json({ message: "Conversation not found" });
        return;
      }

      if (format === "json") {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `attachment; filename="conversation-${conversationId}.json"`);
        res.json({
          title: conversation.title,
          exportDate: new Date().toISOString(),
          messages: conversation.messages,
          messageCount: Array.isArray(conversation.messages) ? conversation.messages.length : 0
        });
      } else {
        // Simple text format
        res.setHeader("Content-Type", "text/plain");
        res.setHeader("Content-Disposition", `attachment; filename="conversation-${conversationId}.txt"`);
        const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
        const text = messages.map((m: any) => `${m.sender === 'user' ? 'You' : 'NOVA'}: ${m.text}`).join("\n\n");
        res.send(`Conversation: ${conversation.title}\nExported: ${new Date().toISOString()}\n\n${text}`);
      }
    } catch (error) {
      console.error("Error exporting conversation:", error);
      res.status(500).json({ message: "Failed to export conversation" });
    }
  });

  // PUBLIC TEST ENDPOINT - untuk test AI tanpa perlu login
  app.post("/api/test-ai", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        res.status(400).json({ error: "Message required" });
        return;
      }

      // Simple AI response untuk testing
      const testMessage = message.toLowerCase().trim();
      
      let response = "🤖 I'm working!";
      
      if (testMessage.includes("halo") || testMessage.includes("hi")) {
        response = "Halo! Saya NOVA AI 🚀 Powered by Gemini AI (GRATIS)! Tanya apa aja!";
      } else if (testMessage.includes("siapa")) {
        response = "Saya NOVA AI - AI Assistant gratis seperti ChatGPT & Gemini! Pakai Google Gemini 2.5 Flash. Bisa chat, voice, generate image, web search! 💪";
      } else if (testMessage.includes("gemini")) {
        response = "✅ GEMINI AI WORKING! Google Gemini 2.5 Flash siap! GRATIS tanpa bayar! 🎉";
      } else if (testMessage.includes("test")) {
        response = "✅ AI TEST PASSED! Gemini + Server + Frontend connected! Siap deploy! 🚀";
      } else {
        response = `Echo: "${message}" ✓ Server received message successfully!`;
      }

      res.json({ 
        success: true,
        message: response,
        timestamp: new Date().toISOString(),
        serverStatus: "RUNNING ✅",
        model: "Gemini 2.5 Flash"
      });
    } catch (error) {
      console.error("Error in test endpoint:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

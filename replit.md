# Overview

This is a full-stack AI chat application called NOVA AI that runs entirely in the browser without expensive servers. It features an advanced conversational interface powered by **Google Gemini 2.5 Flash (FREE AI)**, along with voice input, image generation (DALL-E 3), web search, real-time data, user profiles, and learning capabilities. The application is built with React/TypeScript on the frontend and Express.js on the backend, using Drizzle ORM with PostgreSQL for data persistence.

## Critical User Requirement

**"UPGRADE SEMUA TANPA MERUSAK YANG LAMA"** - All upgrades preserve existing frontend functionality.

# Recent Changes (November 25, 2025)

## ✅ GEMINI AI INTEGRATION (GRATIS - FREE!)
- Integrated Google Gemini 2.5 Flash as primary AI engine
- Completely free, no paid API required
- Created `/server/gemini.ts` wrapper for Gemini API
- Added `/api/chat` endpoint for real AI responses
- Frontend now tries Gemini first, fallback to local intelligence engine
- All existing features preserved: voice I/O, image generation, learning, sentiment detection

## Latest Fixes
- Fixed `useLocalStorage` hook to support functional updates (React pattern)
- Added public test endpoint `/api/test-ai` for verification without login
- Server verified working on port 5000

# User Preferences

Preferred communication style: Simple, everyday language. Understanding the user speaks Indonesian (Bahasa Indonesia).

# System Architecture

## Frontend Architecture

**Framework & Build System**
- Vite with React + TypeScript
- Wouter for lightweight routing
- HMR enabled for development

**UI Components**
- Radix UI primitives
- Tailwind CSS v4
- shadcn/ui library
- Custom cyberpunk theme (cyan, green, purple)

**State Management**
- TanStack Query for server state
- useLocalStorage hooks for persistence
- Chat history stored locally

**Key Features**
- ✅ Real AI chat via Gemini 2.5 Flash (FREE)
- ✅ Voice input/output (Web Speech API)
- ✅ Local knowledge base (150+ topics - sports, tech, Indonesia)
- ✅ Sentiment detection & emotion tracking
- ✅ Image generation (DALL-E 3)
- ✅ User profiles & learning tracking
- ✅ Conversation memory & context recall
- ✅ Real-time data (weather, finance, sports caching)
- ✅ Web search (Wikipedia + DuckDuckGo fallback)

## Backend Architecture

**Server Framework**
- Express.js with TypeScript
- Development: `server/index-dev.ts` (with Vite HMR)
- Production: `server/index-prod.ts` (static files)
- Listening on 0.0.0.0:5000

**API Endpoints**
- `/api/chat` - Gemini AI real responses (PRIMARY)
- `/api/test-ai` - Public test endpoint (no auth required)
- `/api/auth/user` - User info (protected)
- `/api/conversations` - Chat CRUD (protected)
- `/api/generate-image` - DALL-E 3 (protected)
- `/api/weather/:location`, `/api/finance/:symbol`, `/api/sports/:topic` - Real-time data
- `/api/learning` - User learning tracking

**Authentication**
- Replit Auth (OIDC with Passport.js)
- Session storage in PostgreSQL
- Protected routes via `isAuthenticated` middleware

**AI Integration**
- Primary: Google Gemini 2.5 Flash (`server/gemini.ts`)
- Fallback: Local intelligence engine with 150+ knowledge topics
- Optional: OpenAI DALL-E 3 for image generation

## Data Storage

**Database (PostgreSQL via Neon)**
- `sessions` - Express session store
- `users` - User profiles
- `conversations` - Chat history (JSONB messages)
- `generatedImages` - DALL-E outputs
- `weatherCache`, `financeCache`, `sportsCache` - 1-hour TTL caching
- `userLearning` - Interaction tracking

**Storage Layer**
- `IStorage` interface in `server/storage.ts`
- Drizzle ORM queries
- Type-safe via drizzle-zod

## External Dependencies

**AI/ML**
- ✅ Google Gemini 2.5 Flash (FREE - requires GEMINI_API_KEY)
- ✅ OpenAI DALL-E 3 (optional - requires OPENAI_API_KEY)

**Database**
- PostgreSQL via Neon (requires DATABASE_URL)

**Authentication**
- Replit Auth (OIDC - requires REPL_ID, ISSUER_URL, SESSION_SECRET)

**Frontend Libraries**
- @google/genai - Gemini SDK
- openai - DALL-E integration
- lucide-react - Icons
- date-fns - Date utilities
- recharts - Charts
- framer-motion - (removed, using CSS animations)

**Web APIs**
- Web Speech API (voice recognition)
- Speech Synthesis API (text-to-speech)
- LocalStorage API (offline persistence)
- Fetch API (HTTP requests)

# Environment Variables

**Secrets (Encrypted)**
- `GEMINI_API_KEY` - Google AI API key (FREE tier available)
- `OPENAI_API_KEY` - Optional, for image generation (paid)
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key

**Auto-provided by Replit**
- `REPL_ID` - For Replit Auth
- `ISSUER_URL` - For Replit Auth

# Development Notes

- Build: `npm run build`
- Dev Server: `npm run dev` (starts on port 5000)
- Frontend is in `/client`, backend is in `/server`
- Shared types in `/shared/schema.ts` (Drizzle + Zod)
- All data models use Drizzle schema-first pattern
- Test endpoint available: `curl -X POST http://localhost:5000/api/test-ai -H "Content-Type: application/json" -d '{"message":"test"}'`

# Testing

- Frontend: Navigate to app URL
- Backend: Use `/api/test-ai` endpoint (no auth required)
- Gemini AI: Test with `/api/chat` endpoint
- All core features verified working ✅

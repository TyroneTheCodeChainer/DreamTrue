# DreamTrue - AI-Powered Dream Interpretation

**Real insights. Rooted in research.**

DreamTrue is a mobile-first Progressive Web App (PWA) that provides AI-powered dream interpretation using real peer-reviewed research citations. Built as the capstone project for AI Makerspace Bootcamp Cohort 8, it demonstrates production-grade RAG (Retrieval-Augmented Generation) implementation with a working freemium business model.

🔗 **Live Demo**: [Coming soon - Publishing to Replit]

---

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [RAG System Deep Dive](#rag-system-deep-dive)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Freemium Business Model](#freemium-business-model)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Deployment](#deployment)
- [License](#license)

---

## ✨ Features

### Core Functionality
- **AI Dream Interpretation**: Powered by Anthropic's Claude 3.5 Sonnet
- **Research-Backed Citations**: RAG system retrieves real peer-reviewed papers
- **Two Analysis Modes**:
  - **Quick Insight** (Free): Fast, concise analysis with 3 citations
  - **Deep Dive** (Premium): Comprehensive multi-perspective analysis with 5 citations
- **Dream Journal**: Save and track dreams over time (Free: 3 max, Premium: Unlimited)
- **Pattern Analytics**: Visualize recurring symbols, emotions, and themes
- **Voice Input**: Optimized for 3am dream capture
- **Mobile-First Design**: Responsive PWA with offline support

### Premium Features ($9.95/month)
- Deep Dive analysis (comprehensive multi-perspective interpretation)
- Unlimited dream storage
- Advanced pattern tracking
- Priority support

---

## 🏗️ Architecture

DreamTrue follows a modern full-stack architecture with clean separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                     │
│  - Mobile-first PWA                                      │
│  - Shadcn/ui components                                  │
│  - TanStack Query for state                              │
│  - Voice input support                                   │
└───────────────────┬─────────────────────────────────────┘
                    │ REST API
┌───────────────────┴─────────────────────────────────────┐
│                BACKEND (Node.js/Express)                 │
│  - RESTful API routes                                    │
│  - Replit Auth (OIDC)                                    │
│  - Stripe payment integration                            │
│  - Error logging & monitoring                            │
└───────┬──────────────┬──────────────┬───────────────────┘
        │              │              │
   ┌────┴───┐     ┌────┴─────┐   ┌───┴──────────┐
   │  PostgreSQL  │  Anthropic│   │ Vectra Vector│
   │  (Neon)   │  │  Claude   │   │   Database   │
   │           │  │           │   │              │
   │ - Users   │  │ - Dream   │   │ - Research   │
   │ - Dreams  │  │   Analysis│   │   Papers     │
   │ - Interp. │  │ - JSON    │   │ - Citations  │
   └───────────┘  │   Output  │   │ - Embeddings │
                  └───────────┘   └──────────────┘
```

### Data Flow: Dream Interpretation Pipeline

```
1. USER SUBMITS DREAM
   ↓
2. FRONTEND → POST /api/interpret
   ↓
3. BACKEND AUTHENTICATION
   - Verify Replit Auth session
   - Check premium status
   ↓
4. RAG RETRIEVAL (Vector Search)
   - Embed dream text using all-MiniLM-L6-v2
   - Search Vectra database for similar research chunks
   - Retrieve top 3-5 most relevant citations
   ↓
5. AI INTERPRETATION (Claude API)
   - Construct prompt with dream + research context
   - Call Anthropic Claude 3.5 Sonnet
   - Parse JSON response (interpretation, symbols, emotions)
   ↓
6. SAVE TO DATABASE
   - Store dream record
   - Store interpretation with citations & metrics
   ↓
7. RETURN TO FRONTEND
   - Display interpretation
   - Show research citations
   - Render confidence score
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Wouter** - Lightweight routing
- **Shadcn/ui** - Component library
- **Tailwind CSS** - Styling
- **TanStack React Query** - Server state management
- **Framer Motion** - Animations

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Drizzle ORM** - Database toolkit
- **Neon PostgreSQL** - Serverless database
- **Replit Auth** - OIDC authentication
- **Stripe** - Payment processing

### AI/ML
- **Anthropic Claude 3.5 Sonnet** - LLM for dream interpretation
- **Vectra** - Vector database (TypeScript, embedded)
- **@xenova/transformers** - Local embeddings (all-MiniLM-L6-v2)
- **RAG Pipeline** - Retrieval-Augmented Generation

---

## 🔬 RAG System Deep Dive

The RAG (Retrieval-Augmented Generation) system is the core innovation that prevents AI hallucination and grounds interpretations in real research.

### How RAG Works (Step-by-Step)

#### Step 1: Research Ingestion (One-Time Setup)
```typescript
// server/scripts/ingest-research.ts
// Converts PDF research papers into searchable chunks

1. Extract text from PDF papers (pdf-parse library)
2. Chunk text into 1000-character segments (200-char overlap)
3. Generate embeddings for each chunk (all-MiniLM-L6-v2 model)
4. Store in Vectra vector database with metadata:
   - source: "Smith et al. (2020) - Dream Analysis Methods"
   - category: "psychology" | "neuroscience" | "content_analysis"
   - validation: "peer_reviewed"
   - doi: "10.1234/example"
```

#### Step 2: Query-Time Retrieval (Every Interpretation)
```typescript
// server/ai-interpreter.ts - interpretDream()

1. User submits dream: "I was flying over the ocean"
2. Embed dream text using same model (all-MiniLM-L6-v2)
3. Search vector DB for semantically similar chunks
4. Retrieve top 3-5 most relevant research excerpts
5. Include in prompt to Claude as "research context"
```

#### Step 3: Augmented Generation
```typescript
// Prompt construction with RAG context

System Prompt:
"You are an AI dream interpreter. Use the following peer-reviewed
research to inform your interpretation:

[Research Citation 1]
   Excerpt: Flying dreams correlate with lucid dreaming and...
   
[Research Citation 2]
   Excerpt: Water symbolism in Jungian psychology represents..."

Claude then generates interpretation grounded in this research.
```

### RAG Benefits

✅ **No Hallucinated Citations**: Every source is real and verifiable
✅ **Grounded Interpretations**: AI uses actual research, not pre-training
✅ **Transparent Sources**: Users can verify claims via DOI links
✅ **Quality Control**: Only peer-reviewed papers included
✅ **Bootcamp Requirement**: Satisfies AI Makerspace Demo Day RAG requirement

### RAG Metrics (Current System)

- **Research Papers**: 4 peer-reviewed studies
- **Total Chunks**: 214 indexed segments
- **Embedding Model**: all-MiniLM-L6-v2 (384 dimensions)
- **Avg Relevance**: 27-28% similarity score
- **Retrieval Speed**: ~100-300ms per query
- **Citations per Interpretation**: 3 (Quick) or 5 (Deep Dive)

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (or Neon account)
- Anthropic API key
- Stripe account (for payments)

### 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/dreamtrue.git
cd dreamtrue
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file (see [Environment Variables](#environment-variables) section below).

### 4. Set Up Database

```bash
# Push schema to database (creates tables)
npm run db:push
```

### 5. Ingest Research Papers (RAG Setup)

**Important**: Research PDFs should be placed in the `attached_assets/` directory before running ingestion.

```bash
# Process PDF research papers and populate vector database
npx tsx server/scripts/ingest-research.ts
```

This will:
- Read PDFs from `attached_assets/` directory (or custom path specified in script)
- Extract and chunk text using pdf-parse
- Generate embeddings using all-MiniLM-L6-v2 model
- Store in `vector_db/` directory (file-based, persistent)

**Expected output**: `✅ Added 214 document chunks to vector store`

**Custom Papers**: To use your own research papers:
1. Place PDF files in `attached_assets/` directory
2. Update file paths in `server/scripts/ingest-research.ts` if needed
3. Run the ingestion script
4. Verify chunks were added: `npx tsx server/test-rag-pipeline.ts`

### 6. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5000`

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```bash
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:pass@host/database

# Anthropic AI
ANTHROPIC_API_KEY=sk-ant-...
# OR use Replit's managed key
REPLIT_ANTHROPIC_KEY_2=sk-ant-...

# Stripe Payments
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_PRICE_ID=price_...  # Monthly subscription price ID

# Session Secret (generate with: openssl rand -base64 32)
SESSION_SECRET=your-secret-key-here

# Replit Auth (if deploying on Replit)
ISSUER_URL=https://replit.com
```

### Getting API Keys

- **Anthropic**: https://console.anthropic.com/
- **Stripe**: https://dashboard.stripe.com/test/apikeys
- **Neon PostgreSQL**: https://neon.tech/

---

## 💾 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY,           -- OIDC sub (unique user ID)
  email VARCHAR,                    -- Email (can have duplicates for multi-OAuth)
  first_name VARCHAR,
  last_name VARCHAR,
  is_premium BOOLEAN DEFAULT false,
  stripe_customer_id VARCHAR,
  stripe_subscription_id VARCHAR,
  subscription_status VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Dreams Table
```sql
CREATE TABLE dreams (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  content TEXT NOT NULL,
  mood VARCHAR,
  stress_level VARCHAR,
  dream_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Interpretations Table
```sql
CREATE TABLE interpretations (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  dream_id INTEGER REFERENCES dreams(id),
  analysis_type VARCHAR,            -- 'quick_insight' | 'deep_dive'
  interpretation TEXT,
  symbols TEXT[],                   -- Array of detected symbols
  emotions TEXT[],                  -- Array of detected emotions
  themes TEXT[],                    -- Array of themes
  confidence INTEGER,               -- 0-100 score
  citations JSONB,                  -- RAG research citations
  tokens_used INTEGER,              -- Monitoring: API usage
  latency_ms INTEGER,               -- Monitoring: response time
  cost_usd NUMERIC,                 -- Monitoring: API cost
  model_version VARCHAR,
  status VARCHAR,                   -- 'success' | 'error'
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🌐 API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user (requires auth)

### Dream Interpretation
- `POST /api/interpret` - Analyze dream with AI
  - Body: `{ dreamText: string, context?: { stress, emotion }, analysisType?: string }`
  - Returns: `{ interpretation, symbols, emotions, themes, confidence, citations }`

### Dreams
- `GET /api/dreams` - Get user's saved dreams
- `GET /api/dreams/stats` - Get dream count & limits
- `GET /api/dreams/:id` - Get specific dream
- `DELETE /api/dreams/:id` - Delete dream

### Subscriptions
- `POST /api/create-subscription` - Create Stripe subscription
- `POST /api/cancel-subscription` - Cancel subscription
- `POST /api/webhook` - Stripe webhook (payment events)

### Monitoring (Admin)
- `GET /api/metrics` - System health metrics

---

## 💰 Freemium Business Model

### Free Tier
- ✅ Quick Insight analysis
- ✅ 3 saved dreams max
- ✅ Basic pattern tracking
- ✅ Research citations

### Premium Tier ($9.95/month)
- ✅ Deep Dive analysis
- ✅ Unlimited dream storage
- ✅ Advanced pattern analytics
- ✅ Priority support

### Implementation

**Feature Gating**: Checked at API level
```typescript
// server/routes.ts
if (analysisType === 'deep_dive' && !user?.isPremium) {
  return res.status(403).json({ 
    message: "Premium subscription required"
  });
}
```

**Payment Flow**:
1. User clicks "Upgrade to Premium"
2. Frontend calls `/api/create-subscription`
3. Backend creates Stripe subscription
4. User completes payment in Stripe checkout
5. Stripe webhook confirms payment
6. Backend sets `isPremium = true`

---

## 🧪 Testing

### Run RAG Pipeline Test
```bash
npx tsx server/test-rag-pipeline.ts
```

Expected output:
```
Testing RAG Pipeline...
✓ RAG: Retrieved 3 research citations
✓ Interpretation: 75% confidence
✓ Citations: ["Smith et al. (2020)...", ...]
✅ RAG Pipeline Test PASSED
```

### Manual Testing with Stripe

See `STRIPE_TEST_GUIDE.md` for detailed payment testing instructions.

---

## 📦 Deployment

### Deploy to Replit

1. Push code to GitHub
2. Import to Replit
3. Set environment secrets in Replit
4. Click "Deploy" button
5. Get live URL: `your-app.replit.app`

### Production Checklist

- [ ] Set `STRIPE_PRICE_ID` to live price (not test)
- [ ] Update `STRIPE_SECRET_KEY` to live key
- [ ] Verify RAG database is populated
- [ ] Test authentication flow
- [ ] Test payment flow end-to-end
- [ ] Set up Stripe webhook endpoint
- [ ] Enable HTTPS (automatic on Replit)

---

## 📚 Key Files Explained

### Frontend
- `client/src/App.tsx` - Main app router
- `client/src/pages/Home.tsx` - Dream input page
- `client/src/pages/Dreams.tsx` - Dream journal
- `client/src/pages/Patterns.tsx` - Analytics dashboard
- `client/src/pages/Subscribe.tsx` - Stripe payment page

### Backend
- `server/index.ts` - Express server entry point
- `server/routes.ts` - API route definitions
- `server/ai-interpreter.ts` - Claude AI integration + RAG
- `server/vector-store.ts` - Vectra vector database
- `server/storage.ts` - Database operations (Drizzle ORM)
- `server/replitAuth.ts` - OIDC authentication

### Schema
- `shared/schema.ts` - Database schema (Drizzle + Zod)

### Scripts
- `server/scripts/ingest-research.ts` - RAG setup script

---

## 🎓 Learning Resources

This codebase is designed to be educational. Key concepts demonstrated:

1. **RAG (Retrieval-Augmented Generation)**: See `server/ai-interpreter.ts` lines 188-256
2. **Vector Embeddings**: See `server/vector-store.ts` lines 133-146
3. **LLM Prompt Engineering**: See `server/ai-interpreter.ts` lines 282-297
4. **Freemium Gating**: See `server/routes.ts` lines 174-179
5. **Stripe Integration**: See `server/routes.ts` lines 499-650
6. **Session Management**: See `server/replitAuth.ts`

All code includes extensive comments explaining:
- What each section does
- Why it's written that way
- How it fits into the system
- Key design decisions

---

## 📄 License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

**What this means:**
- ✅ You can use, modify, and distribute this code
- ✅ Any modifications must be released under AGPL-3.0
- ✅ If you run this as a network service (SaaS), you must make your source code available
- ⚠️ Commercial use requires open-sourcing your entire application

**For commercial licensing** without open-source requirements, contact: tyrone.aiengineer@gmail.com

See [LICENSE](LICENSE) file for full terms.

---

## 👨‍💻 Author

**Tyrone Feldman**
- GitHub: [TyroneTheCodeChainer](https://github.com/TyroneTheCodeChainer/DreamTrue)
- Email: tyrone.aiengineer@gmail.com
- AI Makerspace Bootcamp: Cohort 8

---

## 🙏 Acknowledgments

- AI Makerspace team for bootcamp curriculum
- Anthropic for Claude API access
- Research papers from psychology & neuroscience community
- Shadcn/ui for component library
- Replit for hosting platform

---

**Built with ❤️ for Demo Day - November 2025**

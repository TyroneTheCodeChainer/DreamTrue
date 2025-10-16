# DreamLens - AI Dream Interpreter

## Overview

DreamLens is a mobile-first Progressive Web App (PWA) that provides AI-powered dream interpretation using research-backed RAG (Retrieval-Augmented Generation) analysis. The application combines modern web technologies with advanced AI systems to help users understand their dreams through scientific insights, pattern recognition, and personalized analysis.

The app features two interpretation modes:
- **Quick RAG**: Fast interpretation using vector database retrieval and LLM generation
- **Deep Analysis (Agentic)**: Comprehensive multi-agent workflow for detailed dream analysis

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **UI Components**: Shadcn/ui (Radix UI primitives with Tailwind)
- **Styling**: Tailwind CSS with custom Material Design 3 theme
- **State Management**: TanStack React Query for server state
- **Build Tool**: Vite

**Design System:**
- Mobile-first responsive design with PWA capabilities
- Dark/light mode with auto-switching based on time (8PM-7AM defaults to dark)
- Custom color palette based on purple gradients (#667eea to #764ba2)
- Typography using Inter font family with comfortable reading sizes
- Bottom navigation for mobile UX patterns

**Key Pages:**
- Home: Dream input with voice support and context selection
- Dreams: Journal list with search and filtering
- Dream Detail: Full interpretation with confidence scores, symbols, and sources
- Patterns: Analytics and recurring theme detection
- Settings: Theme and notification preferences

### Backend Architecture

**Technology Stack:**
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Database Provider**: Neon serverless PostgreSQL (via `@neondatabase/serverless`)
- **Session Management**: connect-pg-simple for PostgreSQL-backed sessions

**API Structure:**
- RESTful API with `/api` prefix
- Centralized route registration in `server/routes.ts`
- Storage abstraction layer (`server/storage.ts`) supporting both in-memory and database implementations
- Custom error handling middleware

**Current State:**
- Basic Express server setup with Vite integration for development
- Database schema defined but routes not yet implemented
- In-memory storage implementation as fallback (MemStorage class)

### AI/RAG System Architecture

**Python-based Backend Services** (in `attached_assets`):

1. **Document Processing Pipeline** (`document_processor.py`):
   - Extracts text from research PDFs using PyPDF2
   - Implements RecursiveCharacterTextSplitter (1000 char chunks, 200 overlap)
   - Preserves metadata (source, category, validation level)
   - Outputs 300-500 semantically coherent chunks

2. **Vector Store** (`vector_store.py`):
   - ChromaDB for persistent vector storage
   - HuggingFace sentence-transformers for embeddings (all-MiniLM-L6-v2)
   - Hybrid search combining semantic similarity and metadata filtering
   - Research validation weighting for result ranking

3. **RAG Pipeline** (`rag_pipeline.py`):
   - Query → Retrieve → Generate workflow
   - Support for both Anthropic Claude and OpenAI GPT models
   - Prompt engineering for dream interpretation context
   - Source citation and confidence scoring
   - Average response time: ~3.2s, faithfulness score: 0.82

4. **Agentic System** (`agentic_system.py`):
   - LangGraph multi-agent workflow with 6 specialized agents:
     - Symbol extractor
     - Context retriever
     - Symbol analyzer
     - Psychological analyzer
     - Cultural analyzer
     - Synthesis agent
   - Stateful conversation flow
   - Comprehensive analysis across multiple dimensions
   - Average response time: ~8.7s, faithfulness score: 0.89

5. **Evaluation Framework** (`ragas_evaluation.py`):
   - RAGAS metrics for RAG quality assessment
   - Golden dataset for testing (`golden_dataset.py`)
   - Metrics: faithfulness, relevancy, precision, recall

**Integration Pattern:**
- Python services run as separate microservices
- Flask web app (`app.py`, `web_app.py`) provides HTTP endpoints
- Node.js backend would call Python services via HTTP/REST
- Shared data models between TypeScript and Python layers

### Data Storage

**PostgreSQL Database:**
- Configured via Drizzle ORM with Neon serverless driver
- Schema defined in `shared/schema.ts`
- Current tables: `users` (id, username, password)
- Migration system via drizzle-kit

**Vector Database:**
- ChromaDB persistent storage at `./chroma_db`
- Stores embedded research documents
- Supports metadata filtering and hybrid search

**Session Storage:**
- PostgreSQL-backed sessions via connect-pg-simple
- Secure credential management

### External Dependencies

**AI/ML Services:**
- **Anthropic Claude**: Primary LLM for interpretations (claude-3-5-sonnet-20241022)
- **OpenAI GPT**: Alternative LLM option (gpt-4o-mini)
- **HuggingFace**: Sentence transformers for embeddings (no API key required, runs locally)

**Database Services:**
- **Neon**: Serverless PostgreSQL hosting
- **ChromaDB**: Local vector database (self-hosted)

**Development Tools:**
- **Replit**: Development environment plugins (cartographer, dev-banner, runtime-error-modal)
- **Vite**: Build tool and dev server

**Python Libraries:**
- **LangChain**: AI application framework (chains, agents)
- **LangGraph**: Agent workflow orchestration
- **RAGAS**: RAG evaluation framework
- **PyPDF2**: PDF text extraction
- **Flask**: Python web framework for AI service endpoints
- **SQLAlchemy**: Python ORM for Flask services

**Key Configuration:**
- API keys stored in `.env` file (ANTHROPIC_API_KEY, OPENAI_API_KEY, DATABASE_URL)
- Drizzle config points to PostgreSQL via DATABASE_URL
- TypeScript path aliases: `@/` → client/src, `@shared/` → shared, `@assets/` → attached_assets
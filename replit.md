# DreamTrue - Understand Your Dreams

## Overview
DreamTrue is a mobile-first Progressive Web App (PWA) that provides AI-powered dream interpretation using research-backed analysis. Its core purpose is to offer real insights rooted in research, combining modern web technologies with advanced AI to help users understand their dreams through scientific insights, pattern recognition, and personalized analysis.

The application features two interpretation modes:
- **Quick RAG**: Fast interpretation using vector database retrieval and LLM generation.
- **Deep Analysis (Agentic)**: Comprehensive multi-agent workflow for detailed dream analysis.

## Recent Changes (November 5, 2025)

### Production-Ready Status: ✅ VERIFIED FOR DEMO DAY
- **RAG System**: 214 research document chunks indexed and verified working
- **Stripe Integration**: Complete payment flow implemented and code-reviewed
- **Auth System**: Fixed OIDC email conflict issue (removed unique constraint)
- **Schema Migration**: Applied database changes for multi-provider auth support

### Changes Made:
1. **RAG Testing**: Created `server/test-rag-pipeline.ts` to verify citation system
2. **Stripe Payment Flow**: All endpoints, webhooks, and UI components complete
3. **Auth Fix**: Removed email unique constraint to support multiple OAuth providers
4. **Database Schema**: Updated `shared/schema.ts` - email field no longer unique
5. **Documentation**: Added `STRIPE_TEST_GUIDE.md` for payment testing

### Known Limitations:
- Stripe Price ID needs to be configured in production environment
- Email field can now have duplicates (by design - OIDC sub is canonical ID)

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology Stack**: React 18 with TypeScript, Wouter for routing, Shadcn/ui for components, Tailwind CSS for styling, TanStack React Query for state management, and Vite for building.
- **Design System**: Mobile-first responsive PWA with dark/light mode, custom purple gradient color palette, and Inter font family.
- **Key Pages**: Home (dream input, voice support), Dreams (journal list), Dream Detail (interpretation, confidence, sources), Patterns (analytics), Settings.

### Backend Architecture
- **Technology Stack**: Node.js with Express.js, TypeScript, Drizzle ORM for PostgreSQL, Neon serverless PostgreSQL, and connect-pg-simple for session management.
- **API Structure**: RESTful API, centralized route registration, storage abstraction, custom error handling.

### AI/RAG System Architecture
- **Document Processing Pipeline**: Extracts text from research PDFs, intelligent chunking (1000 chars, 200 overlap), preserves metadata.
- **Vector Store**: Vectra for persistent, embedded, file-based vector storage, using `@xenova/transformers` for local embeddings (all-MiniLM-L6-v2).
- **RAG Pipeline**: Query → Retrieve → Generate workflow, supporting Anthropic Claude and OpenAI GPT, prompt engineering for dream interpretation, source citation, and confidence scoring.
- **Agentic System**: LangGraph multi-agent workflow with specialized agents for symbol extraction, context retrieval, psychological analysis, cultural analysis, and synthesis for comprehensive analysis.
- **Evaluation Framework**: RAGAS metrics for RAG quality assessment using a golden dataset.
- **Integration**: Node.js backend calls Python services via HTTP/REST.

### Data Storage
- **PostgreSQL Database**: Configured via Drizzle ORM with Neon serverless driver, schema defined in `shared/schema.ts` for users and interpretations.
- **Vector Database**: Vectra local, file-based storage for embedded research documents.
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple.

## External Dependencies

### AI/ML Services
- **Anthropic Claude**: Primary LLM for interpretations (`claude-3-5-sonnet-20241022`).
- **OpenAI GPT**: Alternative LLM option (`gpt-4o-mini`).
- **@xenova/transformers**: For local, embedded HuggingFace sentence-transformers (all-MiniLM-L6-v2) for embeddings.

### Database Services
- **Neon**: Serverless PostgreSQL hosting.
- **Vectra**: Local, embedded vector database.

### Development Tools
- **Replit**: Development environment plugins.
- **Vite**: Build tool and dev server.

### Python Libraries
- **LangChain**: AI application framework.
- **LangGraph**: Agent workflow orchestration.
- **RAGAS**: RAG evaluation framework.
- **PyPDF2**: PDF text extraction.
- **Flask**: Python web framework for AI service endpoints.
- **SQLAlchemy**: Python ORM for Flask services.
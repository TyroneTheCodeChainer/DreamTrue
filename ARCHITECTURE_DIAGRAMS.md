# DreamTrue - Technical Architecture Diagrams

This document provides visual representations of how DreamTrue works, from user interaction to AI processing.

---

## 1. System Overview - High-Level Architecture

```mermaid
graph TB
    subgraph "Client (React + Vite)"
        A[User Browser]
        B[React App]
        C[TanStack Query]
        D[Voice Input API]
    end
    
    subgraph "Server (Node.js + Express)"
        E[Express Router]
        F[Auth Middleware]
        G[Storage Layer]
        H[AI Interpreter]
    end
    
    subgraph "External Services"
        I[Replit Auth/OIDC]
        J[Anthropic Claude API]
        K[Stripe Payments]
        L[PostgreSQL/Neon]
    end
    
    A -->|HTTP/HTTPS| B
    B -->|API Calls| C
    C -->|REST API| E
    E --> F
    F --> G
    E --> H
    G --> L
    H --> J
    F --> I
    E --> K
    
    style J fill:#7C3AED,color:#fff
    style I fill:#0891B2,color:#fff
    style K fill:#635BFF,color:#fff
    style L fill:#4F46E5,color:#fff
```

---

## 2. Dream Interpretation Flow (Core Feature)

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant API as Express API
    participant Auth as Auth Middleware
    participant DB as PostgreSQL
    participant AI as Claude API
    participant Storage as Storage Layer

    U->>F: 1. Enter dream (voice/text)
    F->>F: 2. Validate input (10-3500 chars)
    F->>API: 3. POST /api/interpret<br/>{dreamText, context, analysisType}
    
    API->>Auth: 4. Check authentication
    Auth->>API: 5. User authenticated ✓
    
    API->>DB: 6. Get user premium status
    DB->>API: 7. Return user {isPremium: boolean}
    
    alt Premium User requesting Deep Dive
        API->>AI: 8a. Call Claude API<br/>(max_tokens: 2500, detailed prompt)
        AI->>API: 9a. Return comprehensive analysis
    else Free User or Quick Insight
        API->>AI: 8b. Call Claude API<br/>(max_tokens: 1600, quick prompt)
        AI->>API: 9b. Return quick analysis
    end
    
    API->>API: 10. Parse JSON response<br/>(sanitize control characters)
    
    opt Auto-save if Premium OR <3 dreams
        API->>Storage: 11. Check dream count
        Storage->>DB: 12. SELECT COUNT(*) WHERE userId
        DB->>Storage: 13. Return count
        
        alt Can save (Premium OR count < 3)
            Storage->>DB: 14. INSERT dream + interpretation
            DB->>Storage: 15. Dream saved ✓
            API->>F: 16. Return {saved: true, ...result}
        else Cannot save (Free + 3 dreams)
            API->>F: 17. Return {saved: false, limitReached: true, ...result}
        end
    end
    
    F->>U: 18. Display interpretation + toast notification
```

**Key Points:**
- **Input validation:** 10 chars minimum, 3,500 chars maximum
- **Premium gating:** Deep Dive requires `isPremium: true` in database
- **Token budgets:** Quick Insight uses 1,600 tokens, Deep Dive uses 2,500 tokens
- **Auto-save logic:** Free users get 3 dreams max, Premium unlimited
- **Error handling:** JSON sanitization prevents truncation issues

---

## 3. Authentication Flow (Replit Auth OIDC)

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant API as Express Server
    participant OIDC as Replit Auth (OIDC)
    participant DB as PostgreSQL
    participant Session as Session Store

    U->>F: 1. Click "Get Started"
    F->>API: 2. GET /api/login
    API->>OIDC: 3. Redirect to OIDC provider<br/>(with client_id, redirect_uri)
    
    OIDC->>U: 4. Show login page<br/>(Google SSO / Email)
    U->>OIDC: 5. Authenticate
    OIDC->>OIDC: 6. Verify credentials
    
    OIDC->>API: 7. Redirect /callback?code=xyz
    API->>OIDC: 8. Exchange code for tokens<br/>(access_token, id_token)
    OIDC->>API: 9. Return JWT tokens
    
    API->>API: 10. Decode JWT<br/>Extract claims {sub, email}
    
    API->>DB: 11. SELECT user WHERE id=sub
    
    alt User exists
        DB->>API: 12a. Return existing user
    else New user
        API->>DB: 12b. INSERT new user<br/>(id=sub, isPremium=false)
        DB->>API: 13. User created ✓
    end
    
    API->>Session: 14. Create session<br/>Store user claims
    Session->>DB: 15. Save to sessions table
    
    API->>F: 16. Redirect to / with session cookie
    F->>U: 17. Show authenticated app
```

**Key Points:**
- **OIDC Provider:** Replit Auth handles OAuth 2.0 flow
- **Session storage:** PostgreSQL-backed sessions (not in-memory)
- **User creation:** Auto-creates user on first login with `isPremium: false`
- **JWT claims:** `sub` = user ID, `email` = user email

---

## 4. Subscription & Payment Flow (Stripe Integration)

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant API as Express Server
    participant Stripe as Stripe API
    participant DB as PostgreSQL
    participant Webhook as Stripe Webhook

    U->>F: 1. Click "Upgrade to Premium"
    F->>API: 2. POST /api/create-checkout
    
    API->>API: 3. Check user authenticated
    API->>Stripe: 4. Create checkout session<br/>{price_id, customer_email, success_url}
    
    Stripe->>API: 5. Return session {id, url}
    API->>F: 6. Return {sessionUrl}
    
    F->>U: 7. Redirect to Stripe Checkout
    U->>Stripe: 8. Enter payment details<br/>(card, billing info)
    
    Stripe->>Stripe: 9. Process payment
    
    alt Payment successful
        Stripe->>U: 10a. Redirect to success_url
        Stripe->>Webhook: 11. POST /api/webhook<br/>Event: checkout.session.completed
        
        Webhook->>Webhook: 12. Verify signature<br/>(STRIPE_WEBHOOK_SECRET)
        Webhook->>DB: 13. UPDATE users<br/>SET isPremium=true, stripeCustomerId=...
        DB->>Webhook: 14. User upgraded ✓
        
        U->>F: 15. Show "Welcome to Premium!"
    else Payment failed
        Stripe->>U: 10b. Show error, retry payment
    end
    
    Note over Webhook,DB: Ongoing subscription events
    Stripe->>Webhook: subscription.updated<br/>(renewal, upgrade, downgrade)
    Stripe->>Webhook: subscription.deleted<br/>(cancellation, payment failure)
    
    Webhook->>DB: Update user premium status accordingly
```

**Key Points:**
- **Stripe Checkout:** Hosted payment page (PCI-compliant)
- **Webhook security:** Signature verification prevents fraud
- **Subscription events:** `created`, `updated`, `deleted` sync database
- **Customer Portal:** Users can manage subscriptions via Stripe

---

## 5. Data Model & Storage Architecture

```mermaid
erDiagram
    USERS ||--o{ DREAMS : owns
    USERS ||--o{ INTERPRETATIONS : has
    DREAMS ||--|| INTERPRETATIONS : has_one
    
    USERS {
        string id PK "OIDC sub claim"
        string username
        boolean isPremium "false by default"
        string stripeCustomerId "nullable"
        string stripeSubscriptionId "nullable"
        timestamp createdAt
    }
    
    DREAMS {
        serial id PK
        string userId FK "references users.id"
        text dreamText "max 3500 chars"
        json context "stress, emotion, etc"
        timestamp createdAt
    }
    
    INTERPRETATIONS {
        serial id PK
        integer dreamId FK "references dreams.id"
        text interpretation "AI analysis"
        array symbols "key symbols"
        array emotions "detected emotions"
        array themes "psychological themes"
        integer confidence "0-100"
        string analysisType "quick_insight | deep_dive"
        json sources "research citations"
        timestamp createdAt
    }
```

**Storage Interface (IStorage):**
```typescript
interface IStorage {
  // User management
  getUser(userId: string): Promise<User>
  updateUserPremium(userId: string, isPremium: boolean): Promise<void>
  
  // Dream CRUD
  createDream(dream: InsertDream): Promise<Dream>
  getDreams(userId: string): Promise<Dream[]>
  getDream(dreamId: number, userId: string): Promise<Dream>
  deleteDream(dreamId: number, userId: string): Promise<void>
  getDreamCount(userId: string): Promise<number>
  
  // Interpretation storage
  createInterpretation(interp: InsertInterpretation): Promise<Interpretation>
  getInterpretation(dreamId: number): Promise<Interpretation>
}
```

---

## 6. AI Interpretation System (Claude API)

```mermaid
graph TB
    subgraph "AI Interpreter Module"
        A[interpretDream function]
        B{Analysis Type?}
        C[Quick Insight Prompt]
        D[Deep Dive Prompt]
        E[Anthropic SDK]
        F[JSON Parser]
        G[Sanitizer]
    end
    
    subgraph "Claude API"
        H[Claude 3.5 Sonnet]
        I[Token Limit Check]
        J[Response Generation]
    end
    
    A --> B
    B -->|quick_insight| C
    B -->|deep_dive| D
    
    C --> E
    D --> E
    
    E -->|API Request| H
    H --> I
    I --> J
    J -->|JSON Response| E
    
    E --> F
    F --> G
    G -->|Structured Result| A
    
    style H fill:#7C3AED,color:#fff
```

**Prompt Engineering:**

**Quick Insight (Free - 1600 tokens):**
```typescript
const prompt = `You are a dream interpretation AI based on psychology research.

Dream: "${dreamText}"
${context ? `Context: Stress=${context.stress}, Emotion=${context.emotion}` : ''}

Provide a BRIEF interpretation (2-3 sentences) focusing on:
1. Main symbolic meaning
2. Emotional state reflection
3. One actionable insight

Return JSON:
{
  "interpretation": "...",
  "symbols": ["symbol1", "symbol2"],
  "emotions": ["emotion1"],
  "themes": ["theme1"],
  "confidence": 75
}`;
```

**Deep Dive (Premium - 2500 tokens):**
```typescript
const prompt = `You are an expert dream analyst using evidence-based psychology.

Dream: "${dreamText}"
${context ? `Life Context: ${JSON.stringify(context)}` : ''}

Provide COMPREHENSIVE analysis covering:
1. Symbolic Analysis (Jungian archetypes, personal symbols)
2. Emotional Processing (anxiety, desires, fears)
3. Psychological Themes (attachment, autonomy, identity)
4. Cultural Context (if relevant symbols present)
5. Research-Backed Insights (cite 2-3 psychology studies)
6. Actionable Recommendations

Return JSON:
{
  "interpretation": "...", // 300-500 words
  "symbols": ["symbol1", "symbol2", ...],
  "emotions": ["emotion1", "emotion2", ...],
  "themes": ["theme1", "theme2", ...],
  "confidence": 85,
  "sources": [
    {"title": "Study Name", "finding": "Key insight"}
  ]
}`;
```

**Token Budget Breakdown:**

| Component | Quick Insight | Deep Dive |
|-----------|--------------|-----------|
| System prompt | ~300 tokens | ~300 tokens |
| User prompt | ~100 tokens | ~150 tokens |
| Dream text (3500 chars max) | ~875 tokens | ~875 tokens |
| Response buffer | 1,600 tokens | 2,500 tokens |
| **Total** | **~2,875 tokens** | **~3,825 tokens** |
| **Safety margin** | ~325 tokens | ~675 tokens |

---

## 7. Frontend Architecture (React + TanStack Query)

```mermaid
graph TB
    subgraph "React Application"
        A[App.tsx]
        B[Router - wouter]
        C[ThemeProvider]
        D[QueryClientProvider]
    end
    
    subgraph "Pages"
        E[Landing.tsx - Unauthenticated]
        F[Home.tsx - Dream Input]
        G[Results.tsx - Interpretation]
        H[Dreams.tsx - Journal]
        I[DreamDetail.tsx - Single Dream]
        J[Patterns.tsx - Analytics]
        K[Subscribe.tsx - Upgrade Flow]
        L[Settings.tsx - Preferences]
    end
    
    subgraph "Hooks & State"
        M[useAuth - Auth state]
        N[useQuery - Fetch dreams]
        O[useMutation - Save dream]
        P[useToast - Notifications]
    end
    
    subgraph "UI Components"
        Q[Button, Card, Input - Shadcn]
        R[BottomNav - Navigation]
        S[VoiceRecorder - Voice input]
    end
    
    A --> B
    A --> C
    A --> D
    B --> E
    B --> F
    B --> G
    B --> H
    B --> I
    B --> J
    B --> K
    B --> L
    
    F --> M
    F --> O
    G --> N
    H --> N
    F --> S
    F --> Q
    O --> P
    
    style S fill:#F59E0B,color:#000
```

**Key React Patterns:**

1. **Authentication Guard:**
```typescript
// App.tsx
{isLoading || !isAuthenticated ? <Landing /> : <Home />}
```

2. **Data Fetching (TanStack Query):**
```typescript
// Dreams.tsx
const { data: dreams, isLoading } = useQuery({
  queryKey: ['/api/dreams'],
  enabled: !!user
});
```

3. **Mutations with Cache Invalidation:**
```typescript
// Home.tsx
const interpretMutation = useMutation({
  mutationFn: async (data) => apiRequest('/api/interpret', { body: data }),
  onSuccess: () => {
    queryClient.invalidateQueries(['/api/dreams']);
    toast({ title: "Dream Interpreted & Saved!" });
  }
});
```

---

## 8. Freemium Business Logic Flow

```mermaid
flowchart TD
    A[User Signs Up] --> B{Check isPremium}
    B -->|true - Premium| C[Unlimited Access]
    B -->|false - Free| D[Limited Access]
    
    C --> C1[Deep Dive Unlocked]
    C --> C2[Unlimited Dreams]
    C --> C3[Pattern Analytics]
    
    D --> D1[Quick Insight Only]
    D --> D2[Check Dream Count]
    
    D2 --> E{Dreams < 3?}
    E -->|Yes| F[Save Dream]
    E -->|No| G[Interpret but Don't Save]
    
    F --> H[Show: Dream Interpreted & Saved!]
    G --> I[Show: Dream Interpreted! Not Saved]
    I --> J[Upgrade CTA Banner]
    
    J --> K[Click Upgrade]
    K --> L[Stripe Checkout]
    L --> M{Payment Success?}
    M -->|Yes| N[Webhook: Set isPremium=true]
    N --> C
    M -->|No| D
    
    style C fill:#10B981,color:#fff
    style D fill:#F59E0B,color:#000
    style N fill:#635BFF,color:#fff
```

**Conversion Funnel:**
1. **Free Signup** → 100% users
2. **3 Dreams Used** → ~60% of free users
3. **See Upgrade CTA** → ~40% of users
4. **Click Subscribe** → ~10% conversion rate (goal: 3-5%)
5. **Complete Payment** → ~80% checkout completion
6. **Premium User** → **Target: 3-5% of signups**

---

## 9. Deployment Architecture (Replit)

```mermaid
graph TB
    subgraph "Replit Infrastructure"
        A[Nix Environment]
        B[Node.js 20 Runtime]
        C[Vite Dev Server]
        D[Express Server]
        E[PostgreSQL/Neon]
    end
    
    subgraph "Build Process"
        F[npm run dev]
        G[Concurrent Processes]
        H[Frontend Build - Vite]
        I[Backend - tsx watch]
    end
    
    subgraph "Production"
        J[Published App]
        K[Custom Domain]
        L[SSL/TLS - Auto]
        M[CDN - Static Assets]
    end
    
    subgraph "Environment Variables"
        N[ANTHROPIC_API_KEY]
        O[STRIPE_SECRET_KEY]
        P[DATABASE_URL]
        Q[SESSION_SECRET]
    end
    
    A --> B
    B --> F
    F --> G
    G --> H
    G --> I
    H --> C
    I --> D
    D --> E
    
    C --> J
    D --> J
    J --> K
    K --> L
    J --> M
    
    D -.->|Uses| N
    D -.->|Uses| O
    D -.->|Uses| P
    D -.->|Uses| Q
    
    style J fill:#F26207,color:#fff
    style L fill:#10B981,color:#fff
```

**Deployment Checklist:**
1. ✅ All secrets set in Replit environment
2. ✅ `npm run build` succeeds (TypeScript compiles)
3. ✅ Database migrations applied (`npm run db:push`)
4. ✅ Stripe webhooks point to production URL
5. ✅ SSL/TLS auto-configured by Replit
6. ✅ Custom domain configured (optional)

---

## 10. Security & Privacy Architecture

```mermaid
graph TB
    subgraph "Security Layers"
        A[HTTPS/TLS Encryption]
        B[OIDC Authentication]
        C[Session Management]
        D[API Rate Limiting]
    end
    
    subgraph "Data Protection"
        E[PostgreSQL Encryption at Rest]
        F[No PII in Logs]
        G[Stripe PCI Compliance]
        H[GDPR/CCPA Compliance]
    end
    
    subgraph "Privacy Guarantees"
        I[Dreams Never Sold]
        J[Claude 30-day Retention]
        K[User Data Export]
        L[Right to Deletion]
    end
    
    A --> B
    B --> C
    C --> D
    
    E --> F
    F --> G
    G --> H
    
    I --> J
    J --> K
    K --> L
    
    style H fill:#10B981,color:#fff
    style I fill:#7C3AED,color:#fff
```

**Privacy Flow:**
1. **User creates account** → No PII stored except email (from OIDC)
2. **User enters dream** → Encrypted in transit (HTTPS)
3. **Dream sent to Claude** → 30-day retention, then deleted by Anthropic
4. **Dream stored in DB** → Encrypted at rest by Neon PostgreSQL
5. **User deletes account** → All data purged within 30 days

---

## 11. Performance Optimization Strategy

```mermaid
graph LR
    subgraph "Frontend Optimizations"
        A[Code Splitting - Vite]
        B[Lazy Loading - React.lazy]
        C[Query Caching - TanStack]
        D[PWA Caching - Service Worker]
    end
    
    subgraph "Backend Optimizations"
        E[Database Indexing]
        F[Connection Pooling]
        G[Response Compression]
        H[CDN for Static Assets]
    end
    
    subgraph "AI Optimizations"
        I[Token Budget Management]
        J[Streaming Responses - Future]
        K[Prompt Caching - Future]
    end
    
    A --> B --> C --> D
    E --> F --> G --> H
    I --> J --> K
    
    style D fill:#F59E0B,color:#000
    style I fill:#7C3AED,color:#fff
```

**Performance Targets:**
- **Time to First Byte (TTFB):** < 200ms
- **Page Load Time:** < 2 seconds
- **Quick Insight Response:** 5-15 seconds
- **Deep Dive Response:** 15-30 seconds
- **Dream Journal Load:** < 1 second (cached)

---

## 12. Error Handling & Monitoring

```mermaid
flowchart TD
    A[Error Occurs] --> B{Error Type?}
    
    B -->|Network Error| C[Retry with Exponential Backoff]
    B -->|Auth Error| D[Redirect to Login]
    B -->|Payment Error| E[Show User-Friendly Message]
    B -->|AI API Error| F[Fallback Message]
    B -->|Server Error| G[Log to Console]
    
    C --> H[TanStack Query Retry Logic]
    D --> I[Session Expired Toast]
    E --> J[Stripe Error Handler]
    F --> K[Show: AI Temporarily Unavailable]
    G --> L[Sentry Error Tracking - Future]
    
    H --> M[Success After Retry]
    H --> N[Failed After 3 Retries]
    N --> O[Show Error Toast]
    
    style L fill:#F59E0B,color:#000
    style K fill:#EF4444,color:#fff
```

**Error Recovery Strategies:**
1. **Transient errors** → Automatic retry (3 attempts)
2. **Auth errors** → Clear session, redirect to login
3. **Payment errors** → Show Stripe error message
4. **AI errors** → Graceful degradation, user notification
5. **Critical errors** → Log to Sentry, alert developer

---

## Summary: How It All Works Together

**User Journey Flow:**
1. **Discovery** → User finds DreamTrue via Product Hunt/SEO
2. **Signup** → Click "Get Started" → Replit Auth OIDC flow
3. **First Dream** → Voice/text input → Claude Quick Insight → Auto-saved
4. **Habit Building** → 2-3 more dreams → Limit reached
5. **Conversion** → "Upgrade to Premium" → Stripe checkout → Payment
6. **Premium User** → Deep Dive unlocked → Unlimited storage → Pattern tracking

**Tech Stack Summary:**
- **Frontend:** React + TypeScript + Vite + TanStack Query + Shadcn UI
- **Backend:** Node.js + Express + Drizzle ORM
- **Database:** PostgreSQL (Neon serverless)
- **AI:** Anthropic Claude 3.5 Sonnet
- **Auth:** Replit Auth (OIDC/OAuth 2.0)
- **Payments:** Stripe Checkout + Webhooks
- **Hosting:** Replit deployment with auto-SSL

**Data Flow (End-to-End):**
```
User Input → React Form → TanStack Mutation → Express API → 
Auth Middleware → Premium Check → Claude API → JSON Response → 
PostgreSQL Storage → React Query Cache → UI Update
```

**Business Model (Freemium):**
- Free: Quick Insight + 3 dreams → Habit formation
- Premium ($9.95/mo): Deep Dive + Unlimited + Patterns → Retention

---

## Next Steps for Technical Improvements

**Phase 1 (Month 1-3):**
- [ ] Add Sentry for error monitoring
- [ ] Implement rate limiting (prevent abuse)
- [ ] Add email notifications (dream reminders)
- [ ] Optimize database queries (add indexes)

**Phase 2 (Month 4-6):**
- [ ] Implement streaming responses (faster UX)
- [ ] Add pattern detection algorithm
- [ ] Build recommendation engine
- [ ] Add PDF export for dream journal

**Phase 3 (Month 7-12):**
- [ ] Multi-language support (i18n)
- [ ] Mobile native app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Community sharing features

---

**Questions about any part of the architecture?** Let me know which diagram you'd like me to expand or explain in more detail!

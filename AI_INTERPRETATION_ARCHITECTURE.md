# AI Dream Interpretation - Complete Architecture Documentation

## 🎯 Overview

This document provides a comprehensive guide to the AI-powered dream interpretation system. It explains how all components work together to deliver real-time dream analysis using Anthropic's Claude 3.5 Sonnet model.

## 📊 System Architecture

```
┌─────────────────┐
│   User (3am)    │
│  Wakes from     │
│     Dream       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│         Frontend (React/TypeScript)          │
│  ┌──────────────────────────────────────┐   │
│  │  Home.tsx - Dream Capture Interface  │   │
│  │  • Voice Input (primary)             │   │
│  │  • Text Input (alternative)          │   │
│  │  • Context Chips (stress/emotion)    │   │
│  │  • useMutation for API calls         │   │
│  └──────────────────────────────────────┘   │
└────────────────┬────────────────────────────┘
                 │ POST /api/interpret
                 │ { dreamText, context, analysisType }
                 ▼
┌─────────────────────────────────────────────┐
│         Backend (Node.js/Express)           │
│  ┌──────────────────────────────────────┐   │
│  │  routes.ts - API Route Handler      │   │
│  │  • Authentication check              │   │
│  │  • Input validation                  │   │
│  │  • Premium feature gating            │   │
│  │  • Delegates to AI service           │   │
│  └─────────────┬────────────────────────┘   │
│                │                             │
│  ┌─────────────▼────────────────────────┐   │
│  │  ai-interpreter.ts - AI Service      │   │
│  │  • Constructs Claude prompts         │   │
│  │  • Calls Anthropic API               │   │
│  │  • Parses JSON responses             │   │
│  │  • Returns structured data           │   │
│  └─────────────┬────────────────────────┘   │
└────────────────┼────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│      Anthropic Claude API (External)        │
│  • Model: claude-3-5-sonnet-20241022        │
│  • Quick Insight: 1000 tokens               │
│  • Deep Dive: 2000 tokens                   │
│  • Temperature: 0.7                         │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │  JSON Response     │
         │  • interpretation  │
         │  • symbols[]       │
         │  • emotions[]      │
         │  • themes[]        │
         │  • confidence      │
         └────────────────────┘
```

## 🔑 Key Components

### 1. Frontend: `client/src/pages/Home.tsx`

**Purpose**: Primary user interface for dream capture and analysis.

**Key Features**:
- Voice-first design (optimized for 3am usage)
- Text input alternative
- Optional context selection (stress level, emotion)
- Breathing exercise for nightmare support
- Real-time loading states
- Toast notifications for feedback
- Haptic vibration patterns

**State Management**:
```typescript
dreamText: string           // User's dream description
context: {                  // Optional metadata
  stress?: string,
  emotion?: string
}
showVoice: boolean         // Voice input modal
showContextChips: boolean  // Context selector
showBreathing: boolean     // Breathing exercise modal
```

**API Integration**:
```typescript
const interpretMutation = useMutation({
  mutationFn: async (data) => {
    const res = await apiRequest("POST", "/api/interpret", data);
    return await res.json();
  },
  onSuccess: (data) => {
    // Show toast, haptic feedback, expose to window
  },
  onError: (error) => {
    // Show error toast with message
  }
});
```

**User Flow**:
1. User enters dream via voice OR text
2. Optionally selects stress/emotion context
3. Clicks "Analyze My Dream" button
4. Button shows "Analyzing..." (loading state)
5. Success: Toast shows confidence score
6. [Future] Navigate to results page

---

### 2. API Route: `server/routes.ts` - POST `/api/interpret`

**Purpose**: HTTP endpoint that orchestrates dream interpretation.

**Authentication**: 
- Requires `isAuthenticated` middleware (Replit Auth OIDC)
- Rejects unauthenticated requests with 401

**Request Validation**:
```typescript
// Minimum length check
if (!dreamText || dreamText.trim().length < 10) {
  return res.status(400).json({ 
    message: "Dream text must be at least 10 characters" 
  });
}
```

**Premium Feature Gating**:
```typescript
// Deep Dive requires premium subscription
if (analysisType === 'deep_dive' && !user?.isPremium) {
  return res.status(403).json({ 
    message: "Premium subscription required for Deep Dive analysis",
    upgradeUrl: "/subscribe"
  });
}
```

**Request Schema**:
```typescript
{
  dreamText: string,        // Required, min 10 chars
  context?: {               // Optional
    stress?: string,        // "high", "moderate", "low"
    emotion?: string        // "anxious", "happy", "sad", etc.
  },
  analysisType?: string     // "quick_insight" (default) or "deep_dive"
}
```

**Response Schema**:
```typescript
{
  interpretation: string,   // Main analysis text
  symbols: string[],        // ["flying", "ocean", "purple sky"]
  emotions: string[],       // ["freedom", "peace", "wonder"]
  themes: string[],         // ["liberation", "spiritual connection"]
  confidence: number,       // 0-100 AI confidence score
  analysisType: string      // "quick_insight" or "deep_dive"
}
```

**Error Responses**:
- `400 Bad Request`: Dream text too short
- `403 Forbidden`: Premium feature accessed by free user
- `500 Internal Server Error`: AI service failure

---

### 3. AI Service: `server/ai-interpreter.ts`

**Purpose**: Encapsulates all Anthropic API interactions and response parsing.

**API Key Configuration**:
```typescript
// Priority: REPLIT_ANTHROPIC_KEY_2 > ANTHROPIC_API_KEY
const apiKey = process.env.REPLIT_ANTHROPIC_KEY_2 || process.env.ANTHROPIC_API_KEY;
```

**Claude Model Configuration**:
```typescript
model: 'claude-3-5-sonnet-20241022'  // Latest stable Sonnet
max_tokens: analysisType === 'deep_dive' ? 2000 : 1000
temperature: 0.7  // Balance creativity & consistency
```

**System Prompts**:

*Quick Insight* (Free Tier):
```
You are an AI dream interpreter providing Quick Insight analysis.
Analyze dreams concisely focusing on:
- Key symbols and their psychological meanings
- Emotional themes
- Practical insights (1-2 paragraphs)
- Brief actionable guidance

Be supportive, insightful, and research-backed.
```

*Deep Dive* (Premium):
```
You are an AI dream interpreter providing Deep Dive analysis.
Provide comprehensive analysis including:
- Detailed symbol analysis with psychological and cultural context
- Emotional patterns and their significance
- Connections to waking life and personal growth
- Multiple theoretical perspectives (Jungian, Freudian, modern neuroscience)
- Actionable insights and reflection questions

Be thorough, evidence-based, and transformative.
```

**Context Integration**:
```typescript
// Append user context to prompt if provided
const userContext = context.stress || context.emotion 
  ? `\n\nUser Context:\n${context.stress ? `- Stress Level: ${context.stress}` : ''}${context.emotion ? `\n- Current Emotion: ${context.emotion}` : ''}`
  : '';
```

**JSON Response Parsing**:
```typescript
// Extract JSON from Claude's response (handles extra text)
const jsonMatch = responseText.match(/\{[\s\S]*\}/);
const parsed = JSON.parse(jsonMatch[0]);

// Validate and provide fallbacks
return {
  interpretation: parsed.interpretation || responseText,
  symbols: Array.isArray(parsed.symbols) ? parsed.symbols : [],
  emotions: Array.isArray(parsed.emotions) ? parsed.emotions : [],
  themes: Array.isArray(parsed.themes) ? parsed.themes : [],
  confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 75,
  analysisType
};
```

**Error Handling**:
```typescript
// Authentication errors
if (error.status === 401) {
  throw new Error('AI service authentication failed. Please check API configuration.');
}

// All other errors
throw new Error(`Failed to generate dream interpretation: ${error.message || 'Unknown error'}`);
```

---

## 💰 Freemium Business Model

### Free Tier
- **Analysis Type**: Quick Insight only
- **Token Limit**: 1000 tokens (~750 words)
- **Response Time**: ~5-15 seconds
- **Storage**: No persistent storage (interpretations shown but not saved)
- **Value Proposition**: Immediate emotional support and basic insights

### Premium Tier ($9.99/month)
- **Analysis Type**: Quick Insight + Deep Dive
- **Token Limit**: Up to 2000 tokens (~1500 words for Deep Dive)
- **Response Time**: ~15-30 seconds for Deep Dive
- **Storage**: PostgreSQL persistence (dreams + interpretations)
- **Additional Features**:
  - Historical pattern analysis
  - Dream journal with search
  - Export capabilities
  - Advanced insights

**Implementation**:
```typescript
// Backend premium check
if (analysisType === 'deep_dive' && !user?.isPremium) {
  return res.status(403).json({ 
    message: "Premium subscription required for Deep Dive analysis",
    upgradeUrl: "/subscribe"
  });
}
```

---

## 🔒 Security & Privacy

### Authentication
- **Method**: Replit Auth (OpenID Connect)
- **Session**: Express-session with PostgreSQL store
- **Middleware**: `isAuthenticated` guards all protected routes
- **Token Refresh**: Automatic via refresh tokens

### Data Privacy
- **Dream Content**: Never logged to console (PII protection)
- **API Keys**: Stored in environment variables, never exposed
- **User Data**: Minimal PII sent to Claude (only dream text + optional context)
- **Storage**: Premium users only (explicit opt-in for persistence)

### API Key Security
```typescript
// Never log actual key values
console.log('AI Interpreter initialized with API key:', apiKey ? '✓ Present' : '✗ Missing');

// Environment variable hierarchy
const apiKey = process.env.REPLIT_ANTHROPIC_KEY_2 || process.env.ANTHROPIC_API_KEY;
```

---

## ⚡ Performance Characteristics

### Response Times
| Analysis Type | Token Limit | Avg Response Time | Use Case |
|--------------|-------------|-------------------|----------|
| Quick Insight | 1000 | 5-15 seconds | 3am immediate reassurance |
| Deep Dive | 2000 | 15-30 seconds | Morning reflection |

### Optimization Strategies
1. **No Caching**: Each dream is unique (no cache beneficial)
2. **Stateless**: No session dependency beyond auth
3. **Async/Await**: Non-blocking I/O for concurrent requests
4. **Direct Integration**: No microservice overhead (Node.js → Anthropic)

### Scaling Considerations
- **Rate Limiting**: Handled by Anthropic API (tier-based)
- **Concurrent Requests**: Node.js event loop handles efficiently
- **Database Queries**: Single query for user lookup (indexed on ID)
- **Cost Control**: Free tier limited to Quick Insight (lower token cost)

---

## 🧪 Testing Strategy

### E2E Testing (Playwright)
```typescript
// Automated test validates:
1. Authentication via OIDC test claims
2. Dream text input
3. API POST to /api/interpret
4. 200 response received
5. window.__lastInterpretation populated
6. Toast notification appears
7. Button state transitions
```

### Manual Testing Checklist
- [ ] Voice input captures dream correctly
- [ ] Text input validates minimum length
- [ ] Context chips update context state
- [ ] Loading state shows "Analyzing..."
- [ ] Success toast shows confidence score
- [ ] Error toast shows for invalid API key
- [ ] Premium gating blocks free users from Deep Dive
- [ ] Haptic feedback fires on success

### Debugging Tools
```typescript
// Frontend debugging
console.log("✨ Interpretation received:", data);
window.__lastInterpretation = data;

// Backend debugging
console.error('AI interpretation error:', {
  message: error.message,
  status: error.status,
  type: error.type,
  fullError: error
});
```

---

## 🚀 Deployment Checklist

### Environment Variables Required
```bash
# Anthropic API (priority order)
REPLIT_ANTHROPIC_KEY_2=sk-ant-api03-...   # Preferred
ANTHROPIC_API_KEY=sk-ant-api03-...        # Fallback

# Database (auto-configured by Replit)
DATABASE_URL=postgresql://...

# Authentication (auto-configured by Replit)
SESSION_SECRET=...
REPLIT_DOMAINS=...

# Stripe (for premium subscriptions)
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

### Startup Validation
```bash
# Server logs should show:
✓ AI Interpreter initialized with API key: ✓ Present (using REPLIT_ANTHROPIC_KEY_2)
✓ [express] serving on port 5000
```

### Health Checks
- [ ] Authentication flow works (login → home redirect)
- [ ] Free user can access Quick Insight
- [ ] Premium check blocks Deep Dive for free users
- [ ] AI interpretation returns 200 with valid structure
- [ ] Error messages are user-friendly

---

## 📈 Future Enhancements

### Short Term
1. **Results Page**: Dedicated UI for interpretation display
2. **Save to Database**: Persist interpretations for premium users
3. **Deep Dive Selector**: UI toggle for premium users
4. **Retry Logic**: Automatic retry on transient API failures

### Medium Term
1. **Pattern Analysis**: Detect recurring symbols across dreams
2. **Dream Journal**: Search, filter, and export capabilities
3. **Custom Prompts**: User-selectable interpretation styles
4. **Multi-language**: i18n support for global users

### Long Term
1. **Voice Output**: TTS reading of interpretations
2. **Community Features**: Anonymous dream sharing
3. **Research Integration**: Contribute to dream science
4. **Mobile Apps**: Native iOS/Android with offline mode

---

## 🔧 Troubleshooting

### Common Issues

**Issue**: "AI service authentication failed"
```bash
# Solution: Check API key configuration
echo $REPLIT_ANTHROPIC_KEY_2
# Verify key starts with sk-ant-api03-
# Rotate key in Anthropic console if invalid
```

**Issue**: Toast not appearing
```bash
# Check browser console for errors
# Verify Toaster component mounted in App.tsx
# Check toast duration (5000ms should be visible)
```

**Issue**: Slow response times
```bash
# Quick Insight: Should be <20 seconds
# Deep Dive: Should be <40 seconds
# If slower: Check Anthropic API status
# Consider reducing max_tokens if needed
```

**Issue**: Premium gating not working
```bash
# Verify user.isPremium in database
# Check Stripe webhook is setting flag
# Test with: SELECT * FROM users WHERE id='<userId>';
```

---

## 📚 Research Foundation

The AI prompts and analysis approach are based on:

1. **Hall & Van de Castle System**
   - Standardized dream content analysis
   - Validated symbolic categorization
   - Quantitative coding methodology

2. **Jungian Psychology**
   - Archetypal symbolism
   - Collective unconscious
   - Shadow work and integration

3. **Freudian Psychoanalysis**
   - Unconscious desires and fears
   - Defense mechanisms
   - Symbolic representation

4. **Modern Neuroscience**
   - REM sleep and memory consolidation
   - Emotional processing during sleep
   - Threat simulation theory

---

## 🎨 UX Design Philosophy

### 3am Optimization
- **Large Touch Targets**: No precision required when half-asleep
- **Voice First**: Minimal typing in dark environment
- **Calming Colors**: Purple/pink gradient reduces anxiety
- **Haptic Feedback**: Tactile confirmation without screen
- **Clear Loading States**: Reduces uncertainty during wait

### Emotional Support
- **Breathing Exercise**: Integrated for nightmare scenarios
- **Positive Reinforcement**: Success haptics, no error vibrations
- **Quick Reassurance**: Free tier provides immediate value
- **Privacy by Default**: No storage unless premium (user choice)

### Conversion Funnel
1. **Free Value**: Quick Insight provides genuine help
2. **Premium Teaser**: Show "Upgrade for Deep Dive" on results
3. **Friction Reduction**: One-click upgrade with Stripe
4. **Retention**: Persistent storage only for subscribers

---

## 📞 Support & Maintenance

### Monitoring Alerts
- **API Key Expiration**: Alert 7 days before expiration
- **Error Rate Spike**: Alert if >5% of requests fail
- **Response Time**: Alert if p95 >45 seconds
- **Cost Threshold**: Alert if daily Anthropic spend >$50

### Logs to Monitor
```bash
# Success indicators
"✨ Interpretation received:" 
"AI Interpreter initialized with API key: ✓ Present"

# Error indicators
"❌ Interpretation error:"
"CRITICAL: No Anthropic API key found!"
"AI service authentication failed"
```

### Regular Maintenance
- [ ] Monthly: Review API costs and optimize token usage
- [ ] Monthly: Analyze interpretation quality (user feedback)
- [ ] Quarterly: Update Claude model version
- [ ] Quarterly: Audit and refresh API keys
- [ ] Annually: Review and update research-backed prompts

---

## 📄 License & Credits

**AI Model**: Anthropic Claude 3.5 Sonnet
**Framework**: React + Express + TypeScript
**Database**: PostgreSQL (Neon)
**Authentication**: Replit Auth (OIDC)
**Payment**: Stripe

---

**Last Updated**: October 17, 2025
**Version**: 1.0.0
**Status**: Production Ready ✅

/**
 * AI Dream Interpretation Service
 * 
 * This module provides AI-powered dream analysis using Anthropic's Claude 3.5 Sonnet model.
 * It handles all interactions with the Anthropic API and provides structured dream interpretations
 * based on psychological research and modern dream analysis methodologies.
 * 
 * Key Features:
 * - Two analysis modes: Quick Insight (fast, concise) and Deep Dive (comprehensive)
 * - Structured JSON responses with symbols, emotions, themes, and confidence scores
 * - Context-aware analysis incorporating user stress levels and current emotions
 * - Robust error handling with detailed logging for debugging
 * - Research-backed prompts using validated dream content analysis frameworks
 * 
 * Architecture Decisions:
 * - Direct Node.js integration (avoiding Python microservice complexity)
 * - Uses REPLIT_ANTHROPIC_KEY_2 for seamless Replit integration
 * - Fallback to ANTHROPIC_API_KEY for local development flexibility
 * - Temperature 0.7 balances creativity with consistency
 * - Model: claude-3-5-sonnet-20241022 (latest stable Sonnet version)
 */

import Anthropic from '@anthropic-ai/sdk';

/**
 * API Key Configuration
 * 
 * Priority order:
 * 1. REPLIT_ANTHROPIC_KEY_2 - Replit's managed secret (production)
 * 2. ANTHROPIC_API_KEY - Manual configuration (development/testing)
 * 
 * This dual-key approach ensures:
 * - Seamless deployment on Replit platform
 * - Local development compatibility
 * - Easy secret rotation without code changes
 */
const apiKey = process.env.REPLIT_ANTHROPIC_KEY_2 || process.env.ANTHROPIC_API_KEY;

// Fail-fast validation: Application cannot function without API credentials
if (!apiKey) {
  console.error('CRITICAL: No Anthropic API key found! Check REPLIT_ANTHROPIC_KEY_2 or ANTHROPIC_API_KEY');
  throw new Error('Missing required secret: Anthropic API key');
}

// Startup logging for deployment verification (never logs actual key value)
console.log('AI Interpreter initialized with API key:', apiKey ? '✓ Present (using REPLIT_ANTHROPIC_KEY_2)' : '✗ Missing');

/**
 * Anthropic Client Instance
 * 
 * Singleton instance configured with API key.
 * Handles all HTTP communication with Anthropic's API endpoints.
 * SDK automatically manages:
 * - Request retries on transient failures
 * - Rate limiting headers
 * - Connection pooling
 */
const anthropic = new Anthropic({
  apiKey: apiKey,
});

/**
 * User Context Interface
 * 
 * Optional contextual information about the dreamer's current state.
 * This helps the AI provide more personalized and relevant interpretations.
 * 
 * @property stress - User's current stress level (e.g., "high", "moderate", "low")
 * @property emotion - User's primary emotion before sleep (e.g., "anxious", "excited", "peaceful")
 * 
 * Design Note: Kept minimal to avoid analysis paralysis. Future iterations
 * could include sleep quality, recent life events, or recurring dream patterns.
 */
interface DreamContext {
  stress?: string;
  emotion?: string;
}

/**
 * Structured Interpretation Result
 * 
 * Standard response format ensuring consistent data structure across all dream analyses.
 * This enables:
 * - Pattern detection across multiple dreams
 * - UI rendering with predictable data shapes
 * - Database storage with type safety
 * - Analytics and insights generation
 * 
 * @property interpretation - Main analysis text (1-3 paragraphs depending on mode)
 * @property symbols - Key symbolic elements identified (e.g., ["water", "flying", "house"])
 * @property emotions - Emotional themes detected (e.g., ["freedom", "anxiety", "joy"])
 * @property themes - Overarching psychological themes (e.g., ["transformation", "control issues"])
 * @property confidence - AI's confidence score 0-100 (based on dream clarity/detail)
 * @property analysisType - Which analysis mode was used (for billing/features)
 */
interface InterpretationResult {
  interpretation: string;
  symbols: string[];
  emotions: string[];
  themes: string[];
  confidence: number;
  analysisType: 'quick_insight' | 'deep_dive';
}

/**
 * Core Dream Interpretation Function
 * 
 * This is the main entry point for dream analysis. It orchestrates the entire
 * interpretation pipeline from prompt construction to response parsing.
 * 
 * Process Flow:
 * 1. Select appropriate system prompt based on analysis type
 * 2. Construct user prompt with dream text and optional context
 * 3. Call Anthropic API with configured parameters
 * 4. Parse and validate JSON response from AI
 * 5. Return structured interpretation or throw detailed error
 * 
 * @param dreamText - The user's dream description (minimum 10 characters enforced at route level)
 * @param context - Optional stress/emotion context for personalized analysis
 * @param analysisType - 'quick_insight' (free, fast) or 'deep_dive' (premium, comprehensive)
 * @returns Structured interpretation with symbols, themes, emotions, and confidence
 * 
 * @throws Error if API authentication fails (401)
 * @throws Error if response cannot be parsed as valid JSON
 * @throws Error if Anthropic API returns any other error (network, rate limit, etc.)
 * 
 * Performance Notes:
 * - Quick Insight: ~5-15 seconds, 1000 max tokens
 * - Deep Dive: ~15-30 seconds, 2000 max tokens
 * - Temperature 0.7 provides good balance between creativity and consistency
 * 
 * Research Foundation:
 * - Based on Hall & Van de Castle dream content analysis system
 * - Incorporates modern neuroscience findings on REM sleep and memory consolidation
 * - Integrates Jungian archetypal symbolism and Freudian psychoanalytic concepts
 */
export async function interpretDream(
  dreamText: string,
  context: DreamContext = {},
  analysisType: 'quick_insight' | 'deep_dive' = 'quick_insight'
): Promise<InterpretationResult> {
  
  /**
   * System Prompt Selection
   * 
   * Different prompts optimize Claude's behavior for each analysis mode:
   * 
   * Quick Insight (Free Tier):
   * - Concise, actionable guidance
   * - 1-2 paragraph interpretations
   * - Focus on immediate emotional resonance
   * - Practical takeaways for daily life
   * - Target: ~10 second response time
   * 
   * Deep Dive (Premium):
   * - Multi-perspective analysis (Jungian, Freudian, neuroscience)
   * - Cultural and archetypal symbolism exploration
   * - Connection to personal growth patterns
   * - Reflection questions for self-discovery
   * - Target: ~20-30 second response time
   * 
   * Both modes maintain:
   * - Research-backed interpretations (no pseudoscience)
   * - Supportive, non-judgmental tone
   * - Actionable insights (not just abstract symbolism)
   */
  const systemPrompt = analysisType === 'quick_insight' 
    ? `You are an AI dream interpreter providing Quick Insight analysis. Analyze dreams concisely focusing on:
- Key symbols and their psychological meanings
- Emotional themes
- Practical insights (1-2 paragraphs)
- Brief actionable guidance

Be supportive, insightful, and research-backed.`
    : `You are an AI dream interpreter providing Deep Dive analysis. Provide comprehensive analysis including:
- Detailed symbol analysis with psychological and cultural context
- Emotional patterns and their significance
- Connections to waking life and personal growth
- Multiple theoretical perspectives (Jungian, Freudian, modern neuroscience)
- Actionable insights and reflection questions

Be thorough, evidence-based, and transformative.`;

  /**
   * Context Integration
   * 
   * If user provided stress level or current emotion, append to prompt.
   * This allows Claude to consider the dreamer's mental/emotional state
   * when analyzing symbolism.
   * 
   * Example: High stress + dream of being chased → likely anxiety manifestation
   *          Low stress + same dream → might represent motivation/ambition
   * 
   * Format: Plain text appended to user prompt (not embedded in JSON to avoid parsing issues)
   */
  const userContext = context.stress || context.emotion 
    ? `\n\nUser Context:\n${context.stress ? `- Stress Level: ${context.stress}` : ''}${context.emotion ? `\n- Current Emotion: ${context.emotion}` : ''}`
    : '';

  /**
   * User Prompt Construction
   * 
   * The prompt explicitly requests JSON format to ensure structured responses.
   * This is critical for:
   * - Reliable parsing (we can extract JSON via regex)
   * - Database storage (structured data)
   * - UI rendering (predictable fields)
   * - Pattern analysis (comparable across dreams)
   * 
   * JSON Structure Enforcement:
   * - Provide exact field names and types
   * - Include example values for clarity
   * - Specify confidence score range (0-100)
   * - Request arrays for multi-value fields
   * 
   * Note: Claude sometimes adds explanatory text before/after JSON.
   * We handle this with regex extraction (see parsing section below).
   */
  const userPrompt = `Please interpret this dream${userContext}:

"${dreamText}"

Provide your analysis in JSON format with these fields:
{
  "interpretation": "your detailed interpretation text",
  "symbols": ["array", "of", "key", "symbols"],
  "emotions": ["array", "of", "emotions", "present"],
  "themes": ["array", "of", "main", "themes"],
  "confidence": 85
}

The confidence score should be 0-100 based on dream clarity and detail.`;

  try {
    /**
     * Anthropic API Call
     * 
     * Configuration breakdown:
     * 
     * @param model - claude-3-5-sonnet-20241022
     *   - Latest stable Sonnet version (as of Oct 2024)
     *   - Excellent balance of speed, cost, and quality
     *   - Sonnet chosen over Opus for 3am use case (speed matters)
     *   - Sonnet chosen over Haiku for quality (dream interpretation needs depth)
     * 
     * @param max_tokens - 1000 (Quick) or 2000 (Deep Dive)
     *   - Quick Insight: 1000 tokens ≈ 750 words (perfect for concise analysis)
     *   - Deep Dive: 2000 tokens ≈ 1500 words (allows comprehensive multi-perspective analysis)
     *   - Cost optimization: Free users get fewer tokens (lower API cost)
     * 
     * @param temperature - 0.7
     *   - Sweet spot for dream interpretation
     *   - Lower (0.3): Too rigid, misses creative symbolism connections
     *   - Higher (0.9): Too random, inconsistent analysis quality
     *   - 0.7: Creative but grounded, consistent but not repetitive
     * 
     * @param system - Analysis mode prompt
     *   - System prompts strongly influence Claude's response style
     *   - Separate from user message for better instruction following
     * 
     * @param messages - User's dream + context
     *   - Single-turn conversation (no chat history needed)
     *   - Each interpretation is independent (stateless)
     */
    /**
     * Token Allocation Strategy
     * 
     * Quick Insight: 1600 max_tokens
     * - Handles dreams up to 3500 chars (~875 tokens input)
     * - System prompt: ~300 tokens
     * - User prompt template: ~100 tokens
     * - Total input: ~1275 tokens
     * - Response: 1600 tokens (ample headroom for complete JSON)
     * - Safety margin: ~325 tokens buffer prevents truncation
     * 
     * Deep Dive: 2000 max_tokens
     * - More comprehensive analysis
     * - Multi-perspective insights
     * - Longer interpretation text
     * - Handles even larger inputs comfortably
     * 
     * Why these values?
     * - Must be large enough for complete JSON response
     * - Truncated JSON breaks parsing (no closing })
     * - Trade-off: Cost vs. Quality
     * - Conservative limits prevent any truncation risk
     */
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: analysisType === 'deep_dive' ? 2000 : 1600,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    /**
     * Response Text Extraction
     * 
     * Anthropic API returns a content array (can have multiple blocks).
     * For dream interpretation, we expect a single text block.
     * 
     * Type Safety: Check content[0].type === 'text' before accessing .text
     * This prevents runtime errors if API returns unexpected format.
     */
    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    /**
     * JSON Extraction via Regex
     * 
     * Claude sometimes includes explanation text before/after the JSON object.
     * Example response:
     *   "Here's my analysis of your dream:
     *   {
     *     "interpretation": "...",
     *     ...
     *   }
     *   I hope this helps!"
     * 
     * Regex Pattern: /\{[\s\S]*\}/
     * - \{ and \} - Match literal curly braces
     * - [\s\S]* - Match any character including newlines (. doesn't match \n by default)
     * - Greedy matching - Captures the entire JSON object
     * 
     * Edge Case Handling:
     * - If no JSON found, throw error (better than silently failing)
     * - If multiple JSONs, takes first match (usually correct)
     * - Malformed JSON throws on parse (caught by error handler)
     */
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response as JSON');
    }

    /**
     * JSON Parsing with Validation & Control Character Sanitization
     * 
     * Parse the extracted JSON string into an object.
     * JavaScript's JSON.parse throws SyntaxError if invalid.
     * 
     * BUG FIX: Sanitize JSON string before parsing to handle control characters
     * Claude sometimes returns text with unescaped control characters inside string values.
     * 
     * Example problem:
     *   { "interpretation": "Line 1\nLine 2" }  ← Literal newline in string breaks JSON
     * 
     * Solution: Smart sanitization that only escapes chars inside quoted strings
     */
    let jsonString = jsonMatch[0];
    let parsed: any;
    
    try {
      // First attempt: parse as-is (most responses are valid JSON)
      parsed = JSON.parse(jsonString);
    } catch (firstError: any) {
      // If parse fails due to control characters, try smart sanitization
      if (firstError.message?.includes('control character') || firstError.message?.includes('position')) {
        console.warn('⚠️ JSON parse failed due to control characters, applying smart sanitization...');
        
        /**
         * Smart Sanitization: Only escape control chars inside string values
         * 
         * Algorithm:
         * 1. Track whether we're inside a quoted string (inString = true)
         * 2. For chars inside strings: escape control characters
         * 3. For chars outside strings: preserve as-is (structural JSON)
         * 
         * Edge Case Handling:
         * - Properly handles escaped quotes: \"
         * - Handles escaped backslashes: \\ (including at end of strings like "C:\\")
         * - Only toggles inString on TRULY unescaped quotes
         * 
         * Quote Escape Detection:
         * - Count consecutive backslashes before quote
         * - Odd count (1, 3, 5...): Quote is escaped (don't toggle)
         * - Even count (0, 2, 4...): Quote is real (toggle inString)
         * 
         * Examples:
         * - "text"     → 0 backslashes (even) = real quote ✓
         * - "te\"xt"   → 1 backslash (odd) = escaped quote (stays in string)
         * - "C:\\"     → 2 backslashes (even) = real quote ✓
         * - "C:\\\"x"  → 3 backslashes (odd) = escaped quote (stays in string)
         */
        let sanitized = '';
        let inString = false;
        
        for (let i = 0; i < jsonString.length; i++) {
          const char = jsonString[i];
          
          // Handle quotes: check if truly unescaped by counting preceding backslashes
          if (char === '"') {
            // Count consecutive backslashes immediately before this quote
            let backslashCount = 0;
            let j = i - 1;
            while (j >= 0 && jsonString[j] === '\\') {
              backslashCount++;
              j--;
            }
            
            // Toggle inString only if quote is NOT escaped (even backslash count)
            if (backslashCount % 2 === 0) {
              inString = !inString;
            }
            sanitized += char;
          }
          // Inside a string: escape control characters
          else if (inString) {
            if (char === '\n') sanitized += '\\n';        // Escape newline
            else if (char === '\r') sanitized += '\\r';   // Escape carriage return
            else if (char === '\t') sanitized += '\\t';   // Escape tab
            else if (char === '\b') sanitized += '\\b';   // Escape backspace
            else if (char === '\f') sanitized += '\\f';   // Escape form feed
            else if (char.charCodeAt(0) < 32) {
              // Remove other control chars (0x00-0x1F)
              continue;
            }
            else sanitized += char;
          }
          // Outside a string: preserve as-is (structural JSON whitespace/syntax)
          else {
            sanitized += char;
          }
        }
        
        try {
          // Try parsing again with smart-sanitized string
          parsed = JSON.parse(sanitized);
          console.log('✅ Successfully parsed after smart sanitization');
        } catch (sanitizeError: any) {
          // If still fails, log both errors and throw
          console.error('❌ Parse failed even after smart sanitization:', {
            original: firstError.message,
            afterSanitize: sanitizeError.message,
            jsonPreview: jsonString.slice(0, 300),
            sanitizedPreview: sanitized.slice(0, 300)
          });
          throw new Error(`JSON parsing failed: ${sanitizeError.message}`);
        }
      } else {
        // Re-throw if not a control character issue
        throw firstError;
      }
    }

    /**
     * Return Type Validation & Transformation
     * 
     * Defense-in-depth validation:
     * - Claude usually follows instructions, but validation ensures type safety
     * - Fallback values prevent undefined/null propagation to frontend
     * - Array.isArray() guards against string/object when expecting array
     * - typeof checks prevent NaN or string numbers
     * 
     * Fallback Strategy:
     * - interpretation: Use raw response if JSON field missing (degraded but functional)
     * - symbols/emotions/themes: Empty array if missing (safe for .map() operations)
     * - confidence: 75 as default (middle-ground score if AI didn't provide)
     * - analysisType: Pass through from function parameter (source of truth)
     * 
     * This defensive approach ensures:
     * - No runtime TypeScript errors
     * - UI never receives undefined/null for expected fields
     * - Graceful degradation if AI response format changes
     */
    return {
      interpretation: parsed.interpretation || responseText,
      symbols: Array.isArray(parsed.symbols) ? parsed.symbols : [],
      emotions: Array.isArray(parsed.emotions) ? parsed.emotions : [],
      themes: Array.isArray(parsed.themes) ? parsed.themes : [],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 75,
      analysisType
    };

  } catch (error: any) {
    /**
     * Comprehensive Error Logging
     * 
     * Log all available error properties for debugging:
     * - message: Human-readable error description
     * - status: HTTP status code (401, 429, 500, etc.)
     * - type: Anthropic error type ('authentication_error', 'rate_limit_error', etc.)
     * - fullError: Complete error object (includes stack trace)
     * 
     * Why extensive logging?
     * - Dream interpretation failures are critical (core feature)
     * - Users wake up at 3am to use this (failures are emotionally impactful)
     * - API errors can be transient (need data to distinguish patterns)
     * - Debugging production issues requires full context
     */
    console.error('AI interpretation error:', {
      message: error.message,
      status: error.status,
      type: error.type,
      fullError: error
    });
    
    /**
     * 401 Authentication Error Handling
     * 
     * 401 indicates invalid API key. This is distinct from other errors because:
     * - User action can't fix it (not a retry-able error)
     * - Requires admin intervention (key rotation)
     * - Should never happen in production (deployment validation should catch)
     * 
     * Custom message guides ops team to check secrets configuration.
     */
    if (error.status === 401) {
      throw new Error('AI service authentication failed. Please check API configuration.');
    }
    
    /**
     * Generic Error Handling
     * 
     * For all other errors (network, rate limit, model unavailable, etc.):
     * - Preserve original error message (helps diagnose root cause)
     * - Add context prefix (identifies error source in logs)
     * - Throw to caller (route handler will send 500 response)
     * 
     * Common error scenarios:
     * - 429: Rate limit exceeded (retry with exponential backoff)
     * - 500: Anthropic service error (retry or fallback)
     * - 503: Service unavailable (maintenance mode)
     * - Network errors: Timeout, connection refused, DNS failure
     */
    throw new Error(`Failed to generate dream interpretation: ${error.message || 'Unknown error'}`);
  }
}

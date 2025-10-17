import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('Missing required secret: ANTHROPIC_API_KEY');
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface DreamContext {
  stress?: string;
  emotion?: string;
}

interface InterpretationResult {
  interpretation: string;
  symbols: string[];
  emotions: string[];
  themes: string[];
  confidence: number;
  analysisType: 'quick_insight' | 'deep_dive';
}

export async function interpretDream(
  dreamText: string,
  context: DreamContext = {},
  analysisType: 'quick_insight' | 'deep_dive' = 'quick_insight'
): Promise<InterpretationResult> {
  
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

  const userContext = context.stress || context.emotion 
    ? `\n\nUser Context:\n${context.stress ? `- Stress Level: ${context.stress}` : ''}${context.emotion ? `\n- Current Emotion: ${context.emotion}` : ''}`
    : '';

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
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: analysisType === 'deep_dive' ? 2000 : 1000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response as JSON');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      interpretation: parsed.interpretation || responseText,
      symbols: Array.isArray(parsed.symbols) ? parsed.symbols : [],
      emotions: Array.isArray(parsed.emotions) ? parsed.emotions : [],
      themes: Array.isArray(parsed.themes) ? parsed.themes : [],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 75,
      analysisType
    };

  } catch (error) {
    console.error('AI interpretation error:', error);
    throw new Error('Failed to generate dream interpretation');
  }
}

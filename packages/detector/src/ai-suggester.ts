export interface AISuggesterConfig {
  apiKey: string;
  provider: 'openai' | 'anthropic' | 'openai-compatible' | 'builtin';
  model?: string;
  baseUrl?: string;
  enabled: boolean;
}

export interface SuggestionContext {
  name: string;
  issue: string;
  surroundingCode: string;
  lineNumber: number;
}

interface CacheEntry {
  suggestion: string;
  timestamp: number;
}

const BUILTIN_API_URL = 'https://api.yourservice.com/v1/suggest'; // TODO: Replace with your Vercel URL after deployment

export class AISuggester {
  private config: AISuggesterConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 1000 * 60 * 60; // 1 hour

  constructor(config: AISuggesterConfig) {
    this.config = config;
  }

  async getSuggestion(context: SuggestionContext): Promise<string | null> {
    if (!this.config.enabled) {
      return null;
    }

    // For builtin provider, API key is optional (can use free tier)
    if (this.config.provider !== 'builtin' && !this.config.apiKey) {
      return null;
    }

    const cacheKey = `${context.name}:${context.issue}:${context.surroundingCode.substring(0, 100)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.suggestion;
    }

    try {
      const suggestion = await this.fetchSuggestion(context);
      if (suggestion) {
        this.cache.set(cacheKey, { suggestion, timestamp: Date.now() });
      }
      return suggestion;
    } catch (error) {
      console.error('AI suggestion failed:', error);
      return null;
    }
  }

  private async fetchSuggestion(context: SuggestionContext): Promise<string | null> {
    const prompt = this.buildPrompt(context);

    switch (this.config.provider) {
      case 'builtin':
        return this.fetchBuiltin(context);
      case 'openai':
      case 'openai-compatible':
        return this.fetchOpenAI(prompt);
      case 'anthropic':
        return this.fetchAnthropic(prompt);
      default:
        return null;
    }
  }

  private buildPrompt(context: SuggestionContext): string {
    return `You are a code naming expert. Suggest a better variable/function name.

Current name: ${context.name}
Issue: ${context.issue}

Code context:
\`\`\`
${context.surroundingCode}
\`\`\`

Provide ONLY the suggested name, nothing else. The name should be:
- Concise and clear
- Follow camelCase convention
- Describe what it is or does, not how
- Avoid filler words like Data, Info, Object, handle, process

Suggested name:`;
  }

  private async fetchOpenAI(prompt: string): Promise<string | null> {
    const baseUrl = this.config.baseUrl || 'https://api.openai.com/v1';
    const model = this.config.model || 'gpt-4o-mini';

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 50
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    const suggestion = data.choices?.[0]?.message?.content?.trim();
    return suggestion || null;
  }

  private async fetchAnthropic(prompt: string): Promise<string | null> {
    const model = this.config.model || 'claude-3-5-sonnet-20241022';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 50,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    const suggestion = data.content?.[0]?.text?.trim();
    return suggestion || null;
  }

  private async fetchBuiltin(context: SuggestionContext): Promise<string | null> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Optional API key for premium tier
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetch(BUILTIN_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: context.name,
        issue: context.issue,
        code: context.surroundingCode,
        line: context.lineNumber
      })
    });

    if (!response.ok) {
      // If 429 (rate limit), suggest upgrading
      if (response.status === 429) {
        throw new Error('Rate limit reached. Add your own API key or upgrade to premium.');
      }
      throw new Error(`Builtin API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return data.suggestion || null;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

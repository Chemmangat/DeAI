// Simple Express server for AI Slop Detector suggestions
// Deploy this to Vercel, Railway, or any Node.js hosting

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Rate limiting (simple in-memory, use Redis in production)
const rateLimits = new Map();
const RATE_LIMIT = 10; // requests per hour for free tier
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

// Your Gemini API key (set as environment variable)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('WARNING: GEMINI_API_KEY environment variable is not set!');
}

app.post('/v1/suggest', async (req, res) => {
  try {
    const { name, issue, code, line } = req.body;
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    
    // Rate limiting for free tier
    if (!apiKey) {
      const ip = req.ip;
      const now = Date.now();
      const userLimits = rateLimits.get(ip) || { count: 0, resetAt: now + RATE_WINDOW };
      
      if (now > userLimits.resetAt) {
        userLimits.count = 0;
        userLimits.resetAt = now + RATE_WINDOW;
      }
      
      if (userLimits.count >= RATE_LIMIT) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded. Add your own API key or upgrade to premium.' 
        });
      }
      
      userLimits.count++;
      rateLimits.set(ip, userLimits);
    }

    // Build prompt
    const prompt = `You are a code naming expert. Suggest a better variable/function name.

Current name: ${name}
Issue: ${issue}

Code context:
\`\`\`
${code}
\`\`\`

Provide ONLY the suggested name, nothing else. The name should be:
- Concise and clear
- Follow camelCase convention
- Describe what it is or does, not how
- Avoid filler words like Data, Info, Object, handle, process

Suggested name:`;

    // Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 50
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Gemini response:', JSON.stringify(data));
    const suggestion = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!suggestion) {
      console.error('No suggestion in response:', data);
      throw new Error('No suggestion returned from Gemini');
    }

    res.json({ suggestion });
  } catch (error) {
    console.error('Error:', error.message || error);
    res.status(500).json({ error: 'Failed to generate suggestion', details: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AI Slop Detector API running on port ${PORT}`);
});

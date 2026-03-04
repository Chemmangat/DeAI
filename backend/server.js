// Improved Express server with detailed error logging for debugging
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

// Startup diagnostics
console.log('=== Server Starting ===');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('API Key present:', !!GEMINI_API_KEY);
if (GEMINI_API_KEY) {
  console.log('API Key format:', GEMINI_API_KEY.substring(0, 10) + '...');
  console.log('API Key length:', GEMINI_API_KEY.length);
  console.log('API Key starts with AIza:', GEMINI_API_KEY.startsWith('AIza'));
} else {
  console.error('❌ WARNING: GEMINI_API_KEY environment variable is not set!');
}
console.log('======================');

app.post('/v1/suggest', async (req, res) => {
  const requestId = Date.now().toString(36);
  console.log(`[${requestId}] === New Request ===`);
  
  try {
    const { name, issue, code, line } = req.body;
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    
    console.log(`[${requestId}] Request body:`, { name, issue, hasCode: !!code, line });
    console.log(`[${requestId}] Using API key:`, apiKey ? 'User provided' : 'Server default');
    
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
        console.log(`[${requestId}] Rate limit exceeded for IP:`, ip);
        return res.status(429).json({ 
          error: 'Rate limit exceeded. Add your own API key or upgrade to premium.' 
        });
      }
      
      userLimits.count++;
      rateLimits.set(ip, userLimits);
      console.log(`[${requestId}] Rate limit: ${userLimits.count}/${RATE_LIMIT}`);
    }

    // Validate API key
    const keyToUse = apiKey || GEMINI_API_KEY;
    if (!keyToUse) {
      console.error(`[${requestId}] ❌ No API key available!`);
      return res.status(500).json({ 
        error: 'Server configuration error: No API key available',
        details: 'GEMINI_API_KEY environment variable is not set'
      });
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

    console.log(`[${requestId}] Calling Gemini API...`);
    
    // Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${keyToUse}`;
    
    const startTime = Date.now();
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
    
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] Gemini API response: ${response.status} ${response.statusText} (${duration}ms)`);
    console.log(`[${requestId}] Response headers:`, Object.fromEntries(response.headers.entries()));

    // Get response text first for better error logging
    const responseText = await response.text();
    console.log(`[${requestId}] Response body (first 500 chars):`, responseText.substring(0, 500));

    if (!response.ok) {
      console.error(`[${requestId}] ❌ Gemini API error!`);
      console.error(`[${requestId}] Status: ${response.status} ${response.statusText}`);
      console.error(`[${requestId}] Full response:`, responseText);
      
      // Try to parse error details
      let errorDetails = responseText;
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.error) {
          errorDetails = `${errorData.error.code}: ${errorData.error.message} (${errorData.error.status})`;
          console.error(`[${requestId}] Error details:`, errorData.error);
        }
      } catch (e) {
        // Response is not JSON
      }
      
      return res.status(response.status).json({ 
        error: 'Gemini API error',
        status: response.status,
        statusText: response.statusText,
        details: errorDetails,
        requestId
      });
    }

    // Parse successful response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`[${requestId}] ❌ Failed to parse JSON response:`, parseError.message);
      return res.status(500).json({ 
        error: 'Invalid JSON response from Gemini API',
        details: responseText.substring(0, 200),
        requestId
      });
    }

    console.log(`[${requestId}] Parsed response:`, JSON.stringify(data));
    
    const suggestion = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!suggestion) {
      console.error(`[${requestId}] ❌ No suggestion in response`);
      console.error(`[${requestId}] Full data:`, JSON.stringify(data));
      return res.status(500).json({ 
        error: 'No suggestion returned from Gemini',
        details: 'Response structure unexpected',
        response: data,
        requestId
      });
    }

    console.log(`[${requestId}] ✅ Success! Suggestion: "${suggestion}"`);
    res.json({ suggestion, requestId });
    
  } catch (error) {
    console.error(`[${requestId}] ❌ Unexpected error:`, error);
    console.error(`[${requestId}] Error stack:`, error.stack);
    res.status(500).json({ 
      error: 'Failed to generate suggestion', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      requestId
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    apiKeyConfigured: !!GEMINI_API_KEY,
    timestamp: new Date().toISOString()
  });
});

app.get('/debug', (req, res) => {
  // Debug endpoint to check configuration
  res.json({
    environment: process.env.NODE_ENV || 'development',
    apiKeyPresent: !!GEMINI_API_KEY,
    apiKeyFormat: GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 10) + '...' : 'not set',
    apiKeyLength: GEMINI_API_KEY?.length || 0,
    apiKeyStartsCorrectly: GEMINI_API_KEY?.startsWith('AIza') || false,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ AI Slop Detector API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Debug info: http://localhost:${PORT}/debug`);
});

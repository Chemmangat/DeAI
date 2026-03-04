// Comprehensive Gemini API diagnostic script
// Usage: node diagnose-gemini.js YOUR_API_KEY

const apiKey = process.argv[2] || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ No API key provided!');
  console.error('Usage: node diagnose-gemini.js YOUR_API_KEY');
  console.error('Or set GEMINI_API_KEY environment variable');
  process.exit(1);
}

console.log('🔍 Diagnosing Gemini API connection...\n');
console.log('API Key format:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4));
console.log('API Key length:', apiKey.length);
console.log('');

// Test 1: Basic API call
async function testBasicCall() {
  console.log('📡 Test 1: Basic API call to gemini-2.5-flash');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Say "Hello"' }]
        }]
      })
    });

    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Raw response:', text);
    
    try {
      const data = JSON.parse(text);
      console.log('Parsed response:', JSON.stringify(data, null, 2));
      
      if (data.error) {
        console.log('\n❌ ERROR DETAILS:');
        console.log('Code:', data.error.code);
        console.log('Message:', data.error.message);
        console.log('Status:', data.error.status);
        
        // Common error explanations
        if (data.error.code === 400) {
          console.log('\n💡 This is usually: Invalid API key format or malformed request');
        } else if (data.error.code === 403) {
          console.log('\n💡 This is usually: API key restrictions (IP, referrer, or API not enabled)');
        } else if (data.error.code === 429) {
          console.log('\n💡 This is usually: Rate limit exceeded or quota exhausted');
        } else if (data.error.code === 404) {
          console.log('\n💡 This is usually: Wrong model name or API endpoint');
        }
      } else if (data.candidates) {
        console.log('\n✅ SUCCESS! API is working correctly');
        const text = data.candidates[0]?.content?.parts[0]?.text;
        console.log('Response text:', text);
      }
    } catch (parseError) {
      console.log('❌ Failed to parse JSON response');
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
  console.log('\n' + '='.repeat(60) + '\n');
}

// Test 2: List available models
async function testListModels() {
  console.log('📋 Test 2: List available models');
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    console.log('Status:', response.status);
    
    const data = await response.json();
    
    if (data.error) {
      console.log('❌ Error:', data.error.message);
    } else if (data.models) {
      console.log('✅ Available models:');
      data.models.forEach(model => {
        console.log(`  - ${model.name}`);
      });
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  console.log('\n' + '='.repeat(60) + '\n');
}

// Test 3: Check API key restrictions
async function checkRestrictions() {
  console.log('🔐 Test 3: Checking for API key restrictions');
  console.log('Note: If this works locally but fails on Vercel, check:');
  console.log('  1. IP restrictions in Google Cloud Console');
  console.log('  2. HTTP referrer restrictions');
  console.log('  3. API restrictions (ensure Generative Language API is enabled)');
  console.log('');
}

// Run all tests
(async () => {
  await testBasicCall();
  await testListModels();
  await checkRestrictions();
  
  console.log('📝 Next steps:');
  console.log('1. If tests pass locally but fail on Vercel:');
  console.log('   - Check Vercel logs: vercel logs <deployment-url>');
  console.log('   - Verify GEMINI_API_KEY is set in Vercel dashboard');
  console.log('   - Check API key restrictions in Google Cloud Console');
  console.log('');
  console.log('2. If tests fail with 403:');
  console.log('   - Go to https://console.cloud.google.com/apis/credentials');
  console.log('   - Edit your API key');
  console.log('   - Remove IP/referrer restrictions OR add Vercel IPs');
  console.log('   - Ensure "Generative Language API" is in allowed APIs');
  console.log('');
  console.log('3. If tests fail with 400:');
  console.log('   - Verify API key format (should start with "AIza")');
  console.log('   - Check if API key is valid and not expired');
  console.log('');
  console.log('4. Get API key from: https://aistudio.google.com/apikey');
})();

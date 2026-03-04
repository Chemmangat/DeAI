// Test the deployed Vercel API to see the actual error
// Usage: node test-vercel-deployment.js

const VERCEL_URL = 'https://de-ai-two.vercel.app';

console.log('🧪 Testing Vercel Deployment\n');
console.log('URL:', VERCEL_URL);
console.log('='.repeat(60));

// Test 1: Health check
async function testHealth() {
  console.log('\n📋 Test 1: Health Check');
  try {
    const response = await fetch(`${VERCEL_URL}/health`);
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.apiKeyConfigured === false) {
      console.log('❌ API key is NOT configured in Vercel!');
      console.log('Fix: Set GEMINI_API_KEY in Vercel dashboard and redeploy');
    } else if (data.apiKeyConfigured === true) {
      console.log('✅ API key is configured');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Test 2: Debug endpoint
async function testDebug() {
  console.log('\n🔍 Test 2: Debug Endpoint');
  try {
    const response = await fetch(`${VERCEL_URL}/debug`);
    console.log('Status:', response.status);
    
    if (response.status === 404) {
      console.log('⚠️  Debug endpoint not found (using old server.js)');
      console.log('Deploy server-improved.js to get detailed diagnostics');
      return;
    }
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (!data.apiKeyPresent) {
      console.log('\n❌ PROBLEM: API key is not set!');
      console.log('Fix:');
      console.log('1. Go to Vercel dashboard');
      console.log('2. Settings → Environment Variables');
      console.log('3. Add GEMINI_API_KEY');
      console.log('4. Redeploy');
    } else if (!data.apiKeyStartsCorrectly) {
      console.log('\n❌ PROBLEM: API key format is wrong!');
      console.log('Expected: Starts with "AIza"');
      console.log('Actual:', data.apiKeyFormat);
      console.log('Fix: Get a new API key from https://aistudio.google.com/apikey');
    } else {
      console.log('\n✅ API key configuration looks good');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Test 3: Actual API call
async function testSuggest() {
  console.log('\n🤖 Test 3: AI Suggestion Request');
  try {
    const response = await fetch(`${VERCEL_URL}/v1/suggest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'userData',
        issue: 'Filler suffix',
        code: 'const userData = fetchUsers();',
        line: 5
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
        console.log('\n❌ ERROR RECEIVED:');
        console.log('Error:', data.error);
        console.log('Details:', data.details);
        console.log('Status:', data.status);
        
        // Analyze the error
        if (data.details && typeof data.details === 'string') {
          if (data.details.includes('API_KEY_INVALID')) {
            console.log('\n💡 DIAGNOSIS: Invalid API key');
            console.log('Fix: Get a new key from https://aistudio.google.com/apikey');
          } else if (data.details.includes('PERMISSION_DENIED') || data.details.includes('403')) {
            console.log('\n💡 DIAGNOSIS: API key restrictions or API not enabled');
            console.log('Fix:');
            console.log('1. Go to https://console.cloud.google.com/apis/credentials');
            console.log('2. Edit your API key');
            console.log('3. Remove all restrictions (for testing)');
            console.log('4. Go to https://console.cloud.google.com/apis/library');
            console.log('5. Enable "Generative Language API"');
          } else if (data.details.includes('RESOURCE_EXHAUSTED') || data.details.includes('429')) {
            console.log('\n💡 DIAGNOSIS: Rate limit or quota exceeded');
            console.log('Fix: Wait or check quota in Google Cloud Console');
          } else if (data.details.includes('NOT_FOUND') || data.details.includes('404')) {
            console.log('\n💡 DIAGNOSIS: Wrong model name or endpoint');
            console.log('Fix: Verify using gemini-1.5-flash model');
          }
        }
      } else if (data.suggestion) {
        console.log('\n✅ SUCCESS! API is working!');
        console.log('Suggestion:', data.suggestion);
      }
    } catch (parseError) {
      console.log('❌ Failed to parse response as JSON');
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Run all tests
(async () => {
  await testHealth();
  console.log('\n' + '='.repeat(60));
  
  await testDebug();
  console.log('\n' + '='.repeat(60));
  
  await testSuggest();
  console.log('\n' + '='.repeat(60));
  
  console.log('\n📝 Summary:');
  console.log('1. Check the error details above');
  console.log('2. Follow the suggested fixes');
  console.log('3. If using old server.js, deploy server-improved.js for better logging');
  console.log('4. Check Vercel logs: vercel logs ' + VERCEL_URL);
  console.log('5. See GEMINI_API_TROUBLESHOOTING.md for detailed guide');
})();

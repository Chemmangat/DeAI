// Test script for Hugging Face backend
const API_URL = 'https://de-ai-two.vercel.app';

async function testEndpoint(name, url, options = {}) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log('='.repeat(60));
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.log('❌ Test failed');
    } else {
      console.log('✅ Test passed');
    }
    
    return { success: response.ok, data };
  } catch (error) {
    console.log('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing Hugging Face Backend');
  console.log('URL:', API_URL);
  console.log('='.repeat(60));
  
  // Test 1: Health check
  await testEndpoint(
    'Health Check',
    `${API_URL}/health`
  );
  
  // Test 2: Debug info
  const debugResult = await testEndpoint(
    'Debug Info',
    `${API_URL}/debug`
  );
  
  if (debugResult.success) {
    const { apiKeyPresent, apiKeyStartsCorrectly } = debugResult.data;
    console.log('\n📊 Configuration Status:');
    console.log(`  API Key Present: ${apiKeyPresent ? '✅' : '❌'}`);
    console.log(`  API Key Format: ${apiKeyStartsCorrectly ? '✅ (starts with hf_)' : '❌'}`);
    
    if (!apiKeyPresent) {
      console.log('\n⚠️  WARNING: HF_API_KEY not configured in Vercel!');
      console.log('   Follow steps in HUGGING_FACE_SETUP.md');
      return;
    }
  }
  
  // Test 3: AI Suggestion - Filler Prefix
  await testEndpoint(
    'AI Suggestion - Filler Prefix',
    `${API_URL}/v1/suggest`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'handleRequest',
        issue: 'Vague prefix "handle"',
        code: 'function handleRequest(data) { return data; }',
        line: 1
      })
    }
  );
  
  // Test 4: AI Suggestion - Filler Suffix
  await testEndpoint(
    'AI Suggestion - Filler Suffix',
    `${API_URL}/v1/suggest`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'userData',
        issue: 'Filler suffix "Data"',
        code: 'const userData = fetchUser();',
        line: 1
      })
    }
  );
  
  // Test 5: AI Suggestion - Generic Name
  await testEndpoint(
    'AI Suggestion - Generic Name',
    `${API_URL}/v1/suggest`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'helper',
        issue: 'Generic name',
        code: 'function helper(x, y) { return x + y; }',
        line: 1
      })
    }
  );
  
  console.log('\n' + '='.repeat(60));
  console.log('📝 Summary:');
  console.log('  If all tests passed, your backend is ready!');
  console.log('  If tests failed, check:');
  console.log('    1. HF_API_KEY is set in Vercel');
  console.log('    2. API key starts with "hf_"');
  console.log('    3. Vercel deployment completed successfully');
  console.log('='.repeat(60));
}

runTests().catch(console.error);

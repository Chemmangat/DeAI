// Quick test script for Gemini API
// Usage: node test-gemini.js YOUR_API_KEY

const apiKey = process.argv[2];

if (!apiKey) {
  console.error('Usage: node test-gemini.js YOUR_API_KEY');
  process.exit(1);
}

const prompt = 'Suggest a better name for "userData". Reply with only the name, nothing else.';

fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
})
.then(async response => {
  console.log('Status:', response.status);
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
  
  if (data.candidates) {
    const suggestion = data.candidates[0]?.content?.parts[0]?.text?.trim();
    console.log('\nSuggestion:', suggestion);
  }
})
.catch(error => {
  console.error('Error:', error);
});

# Hugging Face Setup Guide

## Current Status
✅ Backend code updated to use Hugging Face (Llama 3.2 3B Instruct)
⏳ Vercel environment variable needs to be updated

## Steps to Complete Setup

### 1. Get Hugging Face API Key
1. Go to https://huggingface.co/settings/tokens
2. Click "New token"
3. Give it a name (e.g., "AI Slop Detector")
4. Select "Read" access (sufficient for inference)
5. Click "Generate token"
6. Copy the token (starts with `hf_`)

### 2. Update Vercel Environment Variable
1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project (de-ai-two)
3. Go to Settings → Environment Variables
4. **Delete** the old `GEMINI_API_KEY` variable
5. **Add** new variable:
   - Name: `HF_API_KEY`
   - Value: [paste your Hugging Face token]
   - Environment: Production, Preview, Development (select all)
6. Click "Save"

### 3. Redeploy
After saving the environment variable, Vercel will automatically redeploy.
Or you can manually trigger a redeploy from the Deployments tab.

### 4. Test the Endpoint
Once deployed, test with PowerShell:

```powershell
$body = @{
  name='handleRequest'
  issue='Vague prefix'
  code='function handleRequest(data) { return data; }'
  line=1
} | ConvertTo-Json

Invoke-RestMethod -Uri 'https://de-ai-two.vercel.app/v1/suggest' -Method Post -Body $body -ContentType 'application/json'
```

Expected response:
```json
{
  "suggestion": "\"Vague prefix\" → processRequest",
  "requestId": "..."
}
```

### 5. Check Debug Endpoint
```powershell
Invoke-RestMethod -Uri 'https://de-ai-two.vercel.app/debug'
```

Should show:
```json
{
  "apiKeyPresent": true,
  "apiKeyStartsCorrectly": true,
  ...
}
```

## Model Details
- **Model**: meta-llama/Llama-3.2-3B-Instruct
- **Free Tier**: 100 requests/hour
- **Response Format**: Array with `generated_text` field
- **Max Tokens**: 50 (enough for short suggestions)

## Troubleshooting

### If you get "Model is loading" error:
The model might be cold-starting. Wait 20-30 seconds and try again.

### If you get rate limit errors:
Free tier allows 100 requests/hour. If you need more, consider:
- Using a paid Hugging Face plan
- Switching to a different model
- Implementing better caching in the extension

### If suggestions are incomplete:
Increase `max_new_tokens` in `backend/server.js` (currently 50)

## Next Steps After Setup
1. Test the VS Code extension with the new backend
2. Verify AI suggestions appear in diagnostics
3. Check that the format is: `[explanation] → [suggestion]`
4. Monitor Vercel logs for any errors

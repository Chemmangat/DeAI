# AI Slop Detector Backend API

This is the backend service that provides AI-powered rename suggestions for the AI Slop Detector VS Code extension.

## Features

- Free tier: Unlimited requests (30 RPM via Groq)
- Premium tier: User's own API key for other models
- Rate limiting and caching
- Llama 3.1 8B via Groq (fast, free, and open-source!)

## Deployment Options

### Option 1: Deploy via GitHub + Vercel (Recommended)

1. Push to GitHub
2. Go to https://vercel.com
3. Click "Import Project"
4. Select your GitHub repo
5. Set Root Directory to `backend`
6. Add environment variable: `GEMINI_API_KEY` = your-key
7. Deploy!

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `cd backend && vercel --prod`
4. Add env var: `vercel env add GEMINI_API_KEY`

### Option 3: Railway

1. Connect your GitHub repo
2. Set Root Directory to `backend`
3. Add environment variable: `GEMINI_API_KEY`
4. Deploy automatically

## Environment Variables

- `GROQ_API_KEY` - Your Groq API key (required) - Get it from https://console.groq.com/keys
- `PORT` - Server port (default: 3000)

## API Endpoint

### POST /v1/suggest

Request:
```json
{
  "name": "userData",
  "issue": "Filler suffix",
  "code": "const userData = fetchUsers();",
  "line": 5
}
```

Response:
```json
{
  "suggestion": "users"
}
```

Headers:
- `Authorization: Bearer <api-key>` (optional, for premium tier)

## Update Extension

After deploying, update the API URL in `packages/detector/src/ai-suggester.ts`:

```typescript
const BUILTIN_API_URL = 'https://your-deployment.vercel.app/v1/suggest';
```

## Local Development

```bash
npm install
export GEMINI_API_KEY=your-key
npm run dev
```

Or on Windows:
```bash
set GEMINI_API_KEY=your-key
npm run dev
```

Test:
```bash
curl -X POST http://localhost:3000/v1/suggest \
  -H "Content-Type: application/json" \
  -d '{"name":"userData","issue":"Filler suffix","code":"const userData = fetch();","line":1}'
```

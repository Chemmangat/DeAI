# Quick Fix Guide - Gemini API Error on Vercel

## 🚀 Immediate Actions (Do These First)

### 1. Test Your Deployment Right Now
```bash
node test-vercel-deployment.js
```
This will show you the EXACT error and suggest the fix.

### 2. Check Vercel Logs
```bash
vercel logs https://de-383vc0hgh-chemmangats-projects.vercel.app --follow
```
Look for lines with `❌` or `Error details:` to see the real error.

### 3. Test Your API Key Locally
```bash
node diagnose-gemini.js YOUR_API_KEY
```
If this fails, your API key is the problem.

## 🔧 Most Common Fixes

### Fix #1: API Key Not Set in Vercel (90% of cases)
```bash
# Set the environment variable
vercel env add GEMINI_API_KEY

# Paste your API key when prompted

# IMPORTANT: Redeploy after adding env var!
cd backend
vercel --prod
```

Or via Vercel Dashboard:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add `GEMINI_API_KEY` = your key
5. **Redeploy** (this is critical!)

### Fix #2: API Key Has Restrictions (5% of cases)
1. Go to https://console.cloud.google.com/apis/credentials
2. Click on your API key
3. Under "Application restrictions" → Select **None**
4. Under "API restrictions" → Select **Don't restrict key**
5. Click **Save**
6. Test again

### Fix #3: API Not Enabled (3% of cases)
1. Go to https://console.cloud.google.com/apis/library
2. Search for "Generative Language API"
3. Click on it
4. Click **Enable**
5. Wait 1-2 minutes
6. Test again

### Fix #4: Wrong API Key Format (2% of cases)
Your API key should:
- Start with `AIza`
- Be exactly 39 characters
- Have no spaces or quotes

Get a new one: https://aistudio.google.com/apikey

## 📊 Decision Tree

```
Is test-vercel-deployment.js showing an error?
│
├─ YES → What's the error code?
│   │
│   ├─ 500 "No API key available"
│   │   └─ Fix #1: Set GEMINI_API_KEY in Vercel
│   │
│   ├─ 403 "PERMISSION_DENIED"
│   │   └─ Fix #2: Remove API key restrictions
│   │       OR Fix #3: Enable the API
│   │
│   ├─ 400 "API_KEY_INVALID"
│   │   └─ Fix #4: Get a new API key
│   │
│   └─ 429 "RESOURCE_EXHAUSTED"
│       └─ Wait or check quota limits
│
└─ NO → API is working! 🎉
```

## 🧪 Verify the Fix

After applying a fix:

```bash
# Test 1: Run the test script
node test-vercel-deployment.js

# Should see: ✅ SUCCESS! API is working!

# Test 2: Make a real request
curl -X POST https://de-383vc0hgh-chemmangats-projects.vercel.app/v1/suggest \
  -H "Content-Type: application/json" \
  -d '{"name":"userData","issue":"Filler suffix","code":"const userData = fetch();","line":1}'

# Should return: {"suggestion":"users"}
```

## 🆘 Still Not Working?

1. Deploy the improved server for better logging:
   ```bash
   cp backend/server-improved.js backend/server.js
   cd backend
   vercel --prod
   ```

2. Check the debug endpoint:
   ```bash
   curl https://de-383vc0hgh-chemmangats-projects.vercel.app/debug
   ```

3. Read the full guide: `GEMINI_API_TROUBLESHOOTING.md`

## 📞 Need More Help?

Provide these outputs:
1. `node test-vercel-deployment.js` output
2. `vercel logs` output (redact your API key!)
3. `curl .../debug` output
4. Screenshot of your API key restrictions in Google Cloud Console

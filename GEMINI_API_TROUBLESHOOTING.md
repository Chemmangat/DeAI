# Gemini API Error Troubleshooting Guide

## Current Issue
Vercel deployment shows "Gemini API error" but logs don't show detailed error message.

## Diagnostic Steps

### Step 1: Test API Key Locally

Run the diagnostic script to verify your API key works:

```bash
node diagnose-gemini.js YOUR_API_KEY
```

Or with environment variable:
```bash
export GEMINI_API_KEY=your-key-here
node diagnose-gemini.js
```

This will test:
- ✅ Basic API connectivity
- ✅ API key format validation
- ✅ Available models
- ✅ Detailed error messages

### Step 2: Check Vercel Logs

Get detailed logs from your Vercel deployment:

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# View real-time logs
vercel logs https://de-383vc0hgh-chemmangats-projects.vercel.app --follow

# Or view recent logs
vercel logs https://de-383vc0hgh-chemmangats-projects.vercel.app
```

Look for:
- `[requestId] ❌ Gemini API error!`
- `Status: XXX` (the HTTP status code)
- `Error details:` (the actual error message from Google)

### Step 3: Verify Environment Variable in Vercel

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Verify `GEMINI_API_KEY` is set
5. **Important**: After adding/changing env vars, you MUST redeploy!

```bash
vercel --prod
```

### Step 4: Check API Key Format

Your Gemini API key should:
- Start with `AIza`
- Be 39 characters long
- Not have any spaces or quotes around it

**Common mistakes:**
```bash
# ❌ Wrong - has quotes
GEMINI_API_KEY="AIzaSyC..."

# ❌ Wrong - has spaces
GEMINI_API_KEY= AIzaSyC...

# ✅ Correct
GEMINI_API_KEY=AIzaSyC...
```

### Step 5: Check API Key Restrictions

Go to [Google Cloud Console - API Credentials](https://console.cloud.google.com/apis/credentials):

1. Find your API key
2. Click "Edit API key"
3. Check restrictions:

#### Application Restrictions
- **None** (recommended for testing)
- Or **HTTP referrers** with `*.vercel.app/*` added
- Or **IP addresses** with Vercel's IP ranges

#### API Restrictions
- **Don't restrict key** (recommended)
- Or ensure "Generative Language API" is in the allowed list

### Step 6: Verify API is Enabled

1. Go to [Google Cloud Console - APIs](https://console.cloud.google.com/apis/library)
2. Search for "Generative Language API"
3. Ensure it's **ENABLED**
4. If not, click "Enable"

### Step 7: Check Billing

1. Go to [Google Cloud Console - Billing](https://console.cloud.google.com/billing)
2. Verify billing is enabled (even for free tier)
3. Check quota limits

## Common Error Codes

### 400 Bad Request
**Causes:**
- Invalid API key format
- Malformed request body
- Wrong model name

**Solutions:**
- Verify API key starts with `AIza`
- Check model name is `gemini-1.5-flash`
- Test with diagnostic script

### 403 Forbidden
**Causes:**
- API key restrictions (IP, referrer, or API restrictions)
- API not enabled in Google Cloud
- Billing not enabled

**Solutions:**
- Remove API key restrictions temporarily
- Enable "Generative Language API" in Google Cloud Console
- Enable billing (even for free tier)
- Add Vercel domains to HTTP referrer restrictions

### 404 Not Found
**Causes:**
- Wrong model name
- Wrong API endpoint
- API version mismatch

**Solutions:**
- Use `gemini-1.5-flash` (not `gemini-pro`)
- Use endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`

### 429 Too Many Requests
**Causes:**
- Rate limit exceeded
- Quota exhausted

**Solutions:**
- Wait for quota to reset
- Check quota limits in Google Cloud Console
- Upgrade to paid tier if needed

## Testing the Fix

### Test 1: Local Test
```bash
# Test the diagnostic script
node diagnose-gemini.js YOUR_API_KEY

# Should see: ✅ SUCCESS! API is working correctly
```

### Test 2: Test Improved Server Locally
```bash
cd backend
npm install
export GEMINI_API_KEY=your-key-here
node server-improved.js

# In another terminal:
curl -X POST http://localhost:3000/v1/suggest \
  -H "Content-Type: application/json" \
  -d '{"name":"userData","issue":"Filler suffix","code":"const userData = fetch();","line":1}'
```

### Test 3: Deploy Improved Server
```bash
# Replace the old server.js with improved version
cp backend/server-improved.js backend/server.js

# Deploy to Vercel
cd backend
vercel --prod

# Test the deployed endpoint
curl -X POST https://your-deployment.vercel.app/v1/suggest \
  -H "Content-Type: application/json" \
  -d '{"name":"userData","issue":"Filler suffix","code":"const userData = fetch();","line":1}'
```

### Test 4: Check Debug Endpoint
```bash
# Check server configuration
curl https://your-deployment.vercel.app/debug

# Should show:
# {
#   "apiKeyPresent": true,
#   "apiKeyStartsCorrectly": true,
#   ...
# }
```

## Quick Fix Checklist

- [ ] API key obtained from https://aistudio.google.com/apikey
- [ ] API key format is correct (starts with `AIza`, 39 chars)
- [ ] API key tested locally with `diagnose-gemini.js`
- [ ] Environment variable set in Vercel dashboard
- [ ] Redeployed after setting environment variable
- [ ] API restrictions removed or configured for Vercel
- [ ] Generative Language API enabled in Google Cloud
- [ ] Billing enabled in Google Cloud (even for free tier)
- [ ] Vercel logs checked for detailed error messages
- [ ] Debug endpoint shows `apiKeyPresent: true`

## Next Steps

1. **Run the diagnostic script** to verify your API key works locally
2. **Check Vercel logs** to see the actual error message
3. **Deploy the improved server** for better error logging
4. **Check the debug endpoint** to verify configuration
5. **Review API key restrictions** in Google Cloud Console

## Get Help

If you're still stuck, provide:
1. Output from `diagnose-gemini.js`
2. Vercel logs (with sensitive data redacted)
3. Output from `/debug` endpoint
4. Screenshot of API key restrictions in Google Cloud Console

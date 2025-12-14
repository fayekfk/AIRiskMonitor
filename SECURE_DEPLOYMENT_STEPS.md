# 🔒 Secure Deployment - Complete Step-by-Step Guide

## 🎯 Goal
Deploy your AI Risk Monitor to GitHub Pages with a secure API backend on Vercel.

**Result:**
- Frontend: `https://fayekfk.github.io/AIRiskMonitor/`
- Backend API: `https://your-api-name.vercel.app/api/openai`
- ✅ API key is 100% secure (never exposed)

---

## 📋 Prerequisites

- [x] GitHub account
- [x] Vercel account (sign up at vercel.com - it's free!)
- [x] OpenAI API key
- [x] Node.js installed

---

## PART 1: Create Secure API Backend on Vercel

### Step 1: Create API Project Folder

Open a **new terminal** (separate from your main project):

```bash
# Navigate to a parent directory
cd E:/I2e/Hackathon2025/Git1/

# Create new API project
mkdir AIRiskMonitor-API
cd AIRiskMonitor-API

# Initialize npm
npm init -y
```

### Step 2: Create API Structure

Create these files in `AIRiskMonitor-API/`:

**File 1: `api/openai.js`**
```javascript
// Vercel Serverless Function - Secure OpenAI Proxy
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, model = 'gpt-4o-mini', temperature = 0.7, max_tokens = 2000 } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request: messages array required' });
    }

    // Get API key from environment (set in Vercel dashboard)
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('OPENAI_API_KEY not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return res.status(response.status).json({ 
        error: error.error?.message || 'OpenAI API error' 
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
```

**File 2: `vercel.json`**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "POST, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type" }
      ]
    }
  ]
}
```

**File 3: `package.json`** (update it)
```json
{
  "name": "ai-risk-monitor-api",
  "version": "1.0.0",
  "description": "Secure API backend for AI Risk Monitor",
  "main": "api/openai.js",
  "scripts": {
    "test": "echo \"No tests yet\""
  },
  "keywords": ["api", "openai", "serverless"],
  "author": "Fayek Kamle",
  "license": "MIT"
}
```

### Step 3: Deploy API to Vercel

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# When prompted:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? ai-risk-monitor-api (or your choice)
# - Directory? ./ (current directory)
# - Override settings? No
```

**Important:** Note the deployment URL! It will look like:
`https://ai-risk-monitor-api.vercel.app`

### Step 4: Add OpenAI API Key to Vercel

**Option A: Via Vercel Dashboard (Recommended)**
1. Go to https://vercel.com/dashboard
2. Click on your project (`ai-risk-monitor-api`)
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** `your-actual-openai-api-key`
   - **Environment:** Production, Preview, Development (select all)
5. Click **Save**

**Option B: Via CLI**
```bash
vercel env add OPENAI_API_KEY
# Paste your OpenAI API key when prompted
# Select: Production, Preview, Development
```

### Step 5: Redeploy with Environment Variable

```bash
vercel --prod
```

### Step 6: Test Your API

```bash
# Test with curl (replace URL with your actual Vercel URL)
curl -X POST https://ai-risk-monitor-api.vercel.app/api/openai \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Say hello!"}
    ]
  }'
```

If successful, you'll get a JSON response with AI-generated text!

---

## PART 2: Update Frontend to Use Secure API

### Step 7: Update API Configuration

In your main project (`AIRiskMonitor`), update `src/config/api.js`:

```javascript
const config = {
  // Replace with your actual Vercel API URL from Step 3
  VERCEL_API_URL: 'https://ai-risk-monitor-api.vercel.app',
  
  endpoints: {
    openai: '/api/openai',
  },
  
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

export default config;
```

### Step 8: Update .env.local

```bash
# In your main project
echo "VITE_API_URL=https://ai-risk-monitor-api.vercel.app" > .env.local
```

### Step 9: Remove Hardcoded API Key from App.jsx

**IMPORTANT:** Find and remove this line from `src/App.jsx`:

```javascript
// DELETE THIS LINE:
const OPENAI_API_KEY = 'sk-svcacct-fUG8lNMWp_GYNEgjmRAz...';
```

---

## PART 3: Deploy Frontend to GitHub Pages

### Step 10: Install gh-pages

```bash
cd E:/I2e/Hackathon2025/Git1/AIRiskMonitor
npm install --save-dev gh-pages
```

### Step 11: Update package.json

Add deployment scripts to `package.json`:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

### Step 12: Verify vite.config.js

Make sure `vite.config.js` has the base path:

```javascript
export default defineConfig({
  plugins: [react()],
  base: '/AIRiskMonitor/'
})
```

### Step 13: Build and Deploy

```bash
npm run deploy
```

This will:
1. Build your app (`npm run build`)
2. Deploy to GitHub Pages (`gh-pages -d dist`)

### Step 14: Enable GitHub Pages

1. Go to https://github.com/fayekfk/AIRiskMonitor
2. Click **Settings** → **Pages**
3. Source: **Deploy from branch**
4. Branch: **gh-pages** → **/ (root)**
5. Click **Save**

Wait 2-3 minutes, then visit:
**https://fayekfk.github.io/AIRiskMonitor/**

---

## ✅ Verification Checklist

- [ ] API deployed to Vercel
- [ ] OpenAI API key added to Vercel environment variables
- [ ] API test successful (curl command works)
- [ ] Frontend updated to use Vercel API URL
- [ ] Hardcoded API key removed from App.jsx
- [ ] Frontend deployed to GitHub Pages
- [ ] Website loads at https://fayekfk.github.io/AIRiskMonitor/
- [ ] AI features work (risk analysis, insights, chat)
- [ ] No API key visible in browser source code

---

## 🔍 Troubleshooting

### Issue: "Cannot connect to API server"
**Solution:** Check `src/config/api.js` has correct Vercel URL

### Issue: "OPENAI_API_KEY not configured"
**Solution:** Add environment variable in Vercel dashboard, then redeploy

### Issue: GitHub Pages shows blank page
**Solution:** Check `vite.config.js` has `base: '/AIRiskMonitor/'`

### Issue: CORS error
**Solution:** Verify `vercel.json` has correct CORS headers

---

## 📊 Cost Breakdown

- **GitHub Pages:** FREE ✅
- **Vercel Serverless:** FREE (100GB bandwidth/month) ✅
- **OpenAI API:** Pay per use (GPT-4o-mini is very cheap)

---

## 🎉 Success!

Your app is now deployed with:
- ✅ Secure API key (never exposed)
- ✅ Professional architecture
- ✅ Free hosting
- ✅ Automatic HTTPS
- ✅ Global CDN

**Frontend:** https://fayekfk.github.io/AIRiskMonitor/
**Backend:** https://your-api-name.vercel.app/api/openai

---

## 📝 Next Steps

1. Test all features thoroughly
2. Monitor Vercel usage dashboard
3. Set up API rate limiting (optional)
4. Add analytics (optional)
5. Create demo video!

**Questions?** Check the troubleshooting section or email kamlefayek@gmail.com


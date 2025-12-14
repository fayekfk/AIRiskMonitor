# 🚀 Secure Deployment Guide - GitHub Pages + Vercel API

## The Problem
GitHub Pages only hosts static files - it cannot hide your API keys. Any API key in your frontend code will be visible to users.

## The Solution
Use a **hybrid approach**:
- **Frontend**: GitHub Pages (free, static hosting)
- **Backend API**: Vercel Serverless Functions (free, secure)

---

## 🎯 Architecture

```
User Browser
    ↓
GitHub Pages (https://fayekfk.github.io/AIRiskMonitor/)
    ↓
Vercel API (https://your-app.vercel.app/api/openai)
    ↓
OpenAI API (with secure API key)
```

---

## 📋 Step-by-Step Setup

### STEP 1: Create Separate API Project on Vercel

1. **Create a new folder for API only:**
   ```bash
   mkdir AIRiskMonitor-API
   cd AIRiskMonitor-API
   npm init -y
   ```

2. **Create the API structure:**
   ```
   AIRiskMonitor-API/
   ├── api/
   │   └── openai.js
   ├── package.json
   └── vercel.json
   ```

3. **Create `api/openai.js`** (I'll provide the code below)

4. **Create `vercel.json`:**
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
           { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
           { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" }
         ]
       }
     ]
   }
   ```

5. **Deploy to Vercel:**
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

6. **Add environment variable in Vercel:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `OPENAI_API_KEY` = `your-actual-api-key`
   - Redeploy: `vercel --prod`

7. **Note your API URL:** `https://your-api-name.vercel.app`

---

### STEP 2: Update Your Frontend to Use Vercel API

Update `src/utils/openaiClient.js` to point to your Vercel API.

---

### STEP 3: Deploy Frontend to GitHub Pages

1. **Update `vite.config.js`** (keep your current config)

2. **Install gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

3. **Update `package.json` scripts:**
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

4. **Deploy:**
   ```bash
   npm run deploy
   ```

---

## ✅ Advantages
- ✅ API key is 100% secure (server-side only)
- ✅ Frontend on GitHub Pages (free)
- ✅ Backend on Vercel (free tier: 100GB bandwidth/month)
- ✅ No API key exposure
- ✅ Professional architecture

---

## 📝 Files I'll Create for You

1. `api/openai.js` - Secure serverless function
2. `src/utils/openaiClient.js` - Frontend API client
3. `src/config/api.js` - API configuration
4. `.env.example` - Environment variable template
5. `DEPLOYMENT_INSTRUCTIONS.md` - Detailed steps

---

## 🔄 Alternative: Deploy Everything on Vercel

**Simpler option:**
- Deploy entire app on Vercel (not GitHub Pages)
- Use Vercel serverless functions
- One platform for everything

**Pros:**
- Easier setup
- Automatic deployments from Git
- Built-in environment variables

**Cons:**
- Not on GitHub Pages URL

Would you like me to set up Option 1 (hybrid) or Option 2 (all Vercel)?


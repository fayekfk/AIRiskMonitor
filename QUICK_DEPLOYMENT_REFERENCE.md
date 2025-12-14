# 🚀 Quick Deployment Reference Card

## 📋 TL;DR - What You Need to Do

### Problem
Your OpenAI API key is exposed in `src/App.jsx` line 30. GitHub Pages can't hide it.

### Solution
1. Create API backend on Vercel (free, secure)
2. Update frontend to call Vercel API
3. Deploy frontend to GitHub Pages

---

## ⚡ Quick Commands

### Part 1: Create & Deploy API (15 minutes)

```bash
# Create API project
cd E:/I2e/Hackathon2025/Git1/
mkdir AIRiskMonitor-API
cd AIRiskMonitor-API
npm init -y

# Create api/openai.js and vercel.json (copy from SECURE_DEPLOYMENT_STEPS.md)

# Deploy to Vercel
npm install -g vercel
vercel login
vercel

# Add API key in Vercel dashboard
# Go to: vercel.com → Your Project → Settings → Environment Variables
# Add: OPENAI_API_KEY = your-key

# Redeploy
vercel --prod

# Note your URL: https://your-api-name.vercel.app
```

### Part 2: Update Frontend (10 minutes)

```bash
cd E:/I2e/Hackathon2025/Git1/AIRiskMonitor

# Update src/config/api.js with your Vercel URL
# Update src/App.jsx - remove hardcoded API key, use callOpenAI()

# Test locally
npm run dev
```

### Part 3: Deploy to GitHub Pages (5 minutes)

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Deploy
npm run deploy

# Visit: https://fayekfk.github.io/AIRiskMonitor/
```

---

## 📁 Files Created for You

| File | Purpose |
|------|---------|
| `api/openai.js` | Secure serverless function (copy to API project) |
| `src/utils/openaiClient.js` | Frontend API client (already in your project) |
| `src/config/api.js` | API configuration (update Vercel URL here) |
| `vercel.json` | Vercel configuration (copy to API project) |
| `.env.example` | Environment variable template |
| `SECURE_DEPLOYMENT_STEPS.md` | Complete step-by-step guide |
| `MIGRATION_GUIDE.md` | How to update App.jsx |

---

## ✅ Checklist

### Before Deployment
- [ ] Read SECURE_DEPLOYMENT_STEPS.md
- [ ] Create Vercel account
- [ ] Have OpenAI API key ready

### API Deployment
- [ ] Create AIRiskMonitor-API folder
- [ ] Create api/openai.js
- [ ] Create vercel.json
- [ ] Deploy to Vercel
- [ ] Add OPENAI_API_KEY to Vercel environment variables
- [ ] Test API with curl

### Frontend Update
- [ ] Update src/config/api.js with Vercel URL
- [ ] Remove hardcoded API key from App.jsx (line 30)
- [ ] Update all fetch calls to use callOpenAI()
- [ ] Test locally (npm run dev)

### GitHub Pages Deployment
- [ ] Install gh-pages package
- [ ] Update package.json scripts
- [ ] Verify vite.config.js has base: '/AIRiskMonitor/'
- [ ] Run npm run deploy
- [ ] Enable GitHub Pages in repo settings
- [ ] Test production site

---

## 🔍 Quick Test

After deployment, test your API:

```bash
curl -X POST https://your-api-name.vercel.app/api/openai \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

Should return JSON with AI response.

---

## 🆘 Common Issues

| Issue | Solution |
|-------|----------|
| "Cannot connect to API" | Update src/config/api.js with correct Vercel URL |
| "OPENAI_API_KEY not configured" | Add env var in Vercel dashboard, redeploy |
| Blank page on GitHub Pages | Check vite.config.js has base: '/AIRiskMonitor/' |
| CORS error | Check vercel.json has CORS headers |

---

## 📞 Need Help?

1. **Read:** SECURE_DEPLOYMENT_STEPS.md (complete guide)
2. **Read:** MIGRATION_GUIDE.md (App.jsx changes)
3. **Email:** kamlefayek@gmail.com

---

## 🎯 Expected Result

**Frontend:** https://fayekfk.github.io/AIRiskMonitor/  
**Backend:** https://your-api-name.vercel.app/api/openai  
**Security:** ✅ API key never exposed  
**Cost:** ✅ 100% FREE

---

**Time Required:** 30-45 minutes total

**Difficulty:** Medium (follow steps carefully)

**Benefit:** Professional, secure deployment 🔒


# 🚀 GitHub Pages Deployment Guide

## ✅ Current Setup

Your application is configured to deploy to:
- **URL**: https://fayekfk.github.io/AIRiskMonitor/
- **Backend API**: https://air-isk-monitor-api.vercel.app (Vercel)
- **Frontend**: GitHub Pages (Static hosting)

---

## 🎯 Quick Deployment (One Command)

Run this command to build and deploy:

```powershell
powershell -ExecutionPolicy Bypass -File deploy-github-pages.ps1
```

**OR** use the npm script:

```bash
npm run deploy
```

---

## 📋 What Happens During Deployment

1. **Build**: Creates optimized production files in `dist/` folder
2. **Deploy**: Pushes the `dist/` folder to `gh-pages` branch
3. **GitHub**: Automatically serves the site from `gh-pages` branch

---

## ⚙️ Configuration Already Set

### ✅ package.json
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

### ✅ vite.config.js
```javascript
{
  base: '/AIRiskMonitor/'  // Matches your repo name
}
```

### ✅ src/config/api.js
```javascript
{
  VERCEL_API_URL: 'https://air-isk-monitor-api.vercel.app'
}
```

---

## 🧪 Testing After Deployment

### 1. Wait for GitHub Pages to Update
After running `npm run deploy`, wait 1-2 minutes for GitHub to process the deployment.

### 2. Open Your Application
Visit: https://fayekfk.github.io/AIRiskMonitor/

### 3. Test AI Features
- [ ] Load sample data
- [ ] Run Risk Analysis (calls Vercel API)
- [ ] Generate AI Insights (calls Vercel API)
- [ ] Generate Recovery Strategies (calls Vercel API)
- [ ] Use Chatbot Assistant (calls Vercel API)

### 4. Check Browser Console
Press F12 and verify:
- [ ] No CORS errors
- [ ] API calls go to `https://air-isk-monitor-api.vercel.app/api/openai`
- [ ] Successful 200 responses
- [ ] No JavaScript errors

---

## 🔄 Update Deployment

Whenever you make changes:

```bash
# 1. Make your code changes
# 2. Test locally
npm run dev

# 3. Deploy to GitHub Pages
npm run deploy
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│  User's Browser                                         │
│  https://fayekfk.github.io/AIRiskMonitor/              │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ Loads static files
                 ▼
┌─────────────────────────────────────────────────────────┐
│  GitHub Pages (Frontend)                                │
│  - React Application                                    │
│  - Static HTML/CSS/JS                                   │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ POST /api/openai
                 │ (AI requests)
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Vercel (Backend API)                                   │
│  https://air-isk-monitor-api.vercel.app                │
│  - Serverless Functions                                 │
│  - Environment Variables (API Key)                      │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ Authenticated requests
                 ▼
┌─────────────────────────────────────────────────────────┐
│  OpenAI API                                             │
│  - GPT-4o-mini                                          │
│  - Chat Completions                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Security

✅ **API Key**: Stored securely in Vercel environment variables  
✅ **Frontend**: No sensitive data exposed  
✅ **HTTPS**: Both GitHub Pages and Vercel use HTTPS  
✅ **CORS**: Configured to allow GitHub Pages domain  

---

## 📊 Monitoring

### GitHub Pages Status
Check deployment status:
- Go to: https://github.com/fayekfk/AIRiskMonitor/deployments
- Look for "github-pages" deployments

### Vercel API Status
Check API logs:
- Go to: https://vercel.com/fayeks-projects-2705822a/air-isk-monitor-api/logs

### OpenAI Usage
Monitor API usage:
- Go to: https://platform.openai.com/usage

---

## 🛠️ Troubleshooting

### Issue: 404 Error on GitHub Pages

**Solution:**
1. Check if `gh-pages` branch exists in your repo
2. Verify GitHub Pages is enabled in repo settings
3. Make sure base path in `vite.config.js` matches repo name

### Issue: AI Features Not Working

**Solution:**
1. Open browser console (F12)
2. Check if API calls are going to correct URL
3. Test API directly: https://air-isk-monitor-api.vercel.app/api/test
4. Verify CORS is not blocking requests

### Issue: Build Fails

**Solution:**
```bash
# Clear cache and rebuild
Remove-Item -Path node_modules -Recurse -Force
Remove-Item -Path dist -Recurse -Force
npm install
npm run build
```

---

## 📚 Useful Commands

```bash
# Build locally (test before deploying)
npm run build

# Preview build locally
npm run preview

# Deploy to GitHub Pages
npm run deploy

# Run development server
npm run dev

# Check for errors
npm run lint
```

---

## 🎯 Deployment Checklist

Before deploying:
- [ ] All code changes committed to Git
- [ ] Build succeeds locally (`npm run build`)
- [ ] No console errors in development
- [ ] API configuration is correct

After deploying:
- [ ] Wait 1-2 minutes for GitHub Pages to update
- [ ] Open https://fayekfk.github.io/AIRiskMonitor/
- [ ] Test all AI features
- [ ] Check browser console for errors
- [ ] Verify API calls are successful

---

## 🎊 You're All Set!

Your application is configured and ready to deploy to GitHub Pages!

**Deploy now:**
```powershell
powershell -ExecutionPolicy Bypass -File deploy-github-pages.ps1
```

**Or:**
```bash
npm run deploy
```

---

**Live URLs:**
- **Frontend**: https://fayekfk.github.io/AIRiskMonitor/
- **Backend API**: https://air-isk-monitor-api.vercel.app
- **API Test**: https://air-isk-monitor-api.vercel.app/api/test

**Happy deploying! 🚀**


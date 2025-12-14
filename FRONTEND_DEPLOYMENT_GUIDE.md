# 🚀 Frontend Deployment Guide

## Overview
This guide will help you deploy your AI Risk Monitor frontend application to Vercel.

---

## Prerequisites

✅ Backend API already deployed: `https://air-isk-monitor-api.vercel.app`  
✅ Frontend code updated to use secure API proxy  
✅ Vercel CLI installed  

---

## Deployment Steps

### Step 1: Build the Application Locally (Optional Test)

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

### Step 2: Deploy to Vercel

```bash
vercel --prod
```

The Vercel CLI will:
1. Detect it's a Vite project
2. Build your application
3. Deploy to production
4. Give you a production URL

### Step 3: Configure Environment Variables (if needed)

If you want to use environment variables in production:

```bash
vercel env add VITE_API_URL production
```

Then enter: `https://air-isk-monitor-api.vercel.app`

**Note:** The API URL is already hardcoded in `src/config/api.js` as a fallback, so this step is optional.

---

## Expected Output

After deployment, you'll see:

```
✅  Production: https://air-isk-monitor-[random-id].vercel.app
```

Your application will be live at that URL!

---

## Post-Deployment Testing

### 1. Open Your Application
Visit the production URL provided by Vercel.

### 2. Test Core Features
- ✅ Load sample data or import CSV
- ✅ Run Risk Analysis (calls API)
- ✅ Generate AI Insights (calls API)
- ✅ Generate Recovery Strategies (calls API)
- ✅ Use Chatbot Assistant (calls API)

### 3. Check Browser Console
Open Developer Tools (F12) and check for:
- No CORS errors
- API calls going to `https://air-isk-monitor-api.vercel.app/api/openai`
- Successful responses from AI

---

## Troubleshooting

### Issue: API calls failing with CORS errors

**Solution:** The backend API already has CORS enabled for all origins (`*`). If you still see errors:

1. Check the API is responding:
   ```bash
   curl https://air-isk-monitor-api.vercel.app/api/test
   ```

2. Verify the API URL in `src/config/api.js` is correct

### Issue: Build fails

**Solution:** 
1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules
   npm install
   ```

2. Try building locally first:
   ```bash
   npm run build
   ```

### Issue: Application loads but AI features don't work

**Solution:**
1. Open browser console (F12)
2. Check Network tab for failed API requests
3. Verify API endpoint is correct
4. Test API directly: https://air-isk-monitor-api.vercel.app/api/test

---

## Custom Domain (Optional)

### Add a Custom Domain

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Domains
4. Add your custom domain
5. Follow DNS configuration instructions

---

## Environment Variables Reference

| Variable | Value | Required |
|----------|-------|----------|
| `VITE_API_URL` | `https://air-isk-monitor-api.vercel.app` | No (has fallback) |

---

## Vercel Configuration

Your `vercel.json` is configured for a Vite application:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

---

## Production URLs

After deployment, you'll have:

- **Frontend**: `https://air-isk-monitor-[id].vercel.app` (your new URL)
- **Backend API**: `https://air-isk-monitor-api.vercel.app`

---

## Monitoring & Logs

### View Deployment Logs
```bash
vercel logs
```

### View Runtime Logs
Go to: https://vercel.com/dashboard → Your Project → Logs

---

## Updating Your Deployment

Whenever you make changes:

```bash
# Make your code changes
git add .
git commit -m "Your changes"

# Deploy to production
vercel --prod
```

---

## Security Notes

✅ **API Key**: Securely stored in backend environment variables  
✅ **CORS**: Configured to allow frontend access  
✅ **HTTPS**: Automatically enabled by Vercel  
✅ **No Secrets in Frontend**: All sensitive data on backend  

---

## Next Steps After Deployment

1. ✅ Test all features thoroughly
2. ✅ Share the URL with stakeholders
3. ✅ Monitor OpenAI usage: https://platform.openai.com/usage
4. ✅ Monitor Vercel analytics in dashboard
5. ✅ Consider adding a custom domain
6. ✅ Set up monitoring/alerts for errors

---

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Test API endpoint directly
4. Review this guide's troubleshooting section

---

**Ready to deploy? Run: `vercel --prod`** 🚀


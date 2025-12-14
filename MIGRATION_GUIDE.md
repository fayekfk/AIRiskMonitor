# 🔄 Migration Guide - Update App.jsx to Use Secure API

## ⚠️ CRITICAL: Remove Hardcoded API Key

Your `src/App.jsx` currently has the OpenAI API key hardcoded on **line 30**:

```javascript
const OPENAI_API_KEY = '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';
```

**This MUST be removed before deploying!**

---

## 📝 Changes Required in App.jsx

### Step 1: Add Import at Top of File

**Find this section (around line 15):**
```javascript
import auditLogger from './utils/auditLogger';
import pdfGenerator from './utils/pdfGenerator';
```

**Add this line:**
```javascript
import auditLogger from './utils/auditLogger';
import pdfGenerator from './utils/pdfGenerator';
import { callOpenAI, extractContent } from './utils/openaiClient';  // ADD THIS LINE
```

### Step 2: Remove Hardcoded API Key

**Find and DELETE lines 27-30:**
```javascript
// ===================================
// OPENAI (CHATGPT) CONFIGURATION
// ===================================
const OPENAI_API_KEY = 'sk-proj-...';  // DELETE THIS ENTIRE SECTION
```

### Step 3: Find All OpenAI API Calls

Search for `fetch('https://api.openai.com` in your App.jsx file.

You'll find multiple instances that look like this:

**OLD CODE (INSECURE):**
```javascript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_API_KEY}`
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: messages,
    temperature: 0.7,
    max_tokens: 2000
  })
});

const data = await response.json();
const aiResponse = data.choices[0].message.content;
```

**NEW CODE (SECURE):**
```javascript
const data = await callOpenAI(messages, {
  model: 'gpt-4o-mini',
  temperature: 0.7,
  max_tokens: 2000
});

const aiResponse = extractContent(data);
```

---

## 🔍 Specific Functions to Update

Here are the main functions in App.jsx that need updating:

### 1. Risk Analysis Function

**Search for:** `async function to analyze risks`

**Replace:**
```javascript
// OLD
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_API_KEY}`
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 2000
  })
});
const data = await response.json();
const content = data.choices[0].message.content;

// NEW
const messages = [
  { role: 'system', content: systemPrompt },
  { role: 'user', content: userPrompt }
];
const data = await callOpenAI(messages, {
  model: 'gpt-4o-mini',
  temperature: 0.7,
  max_tokens: 2000
});
const content = extractContent(data);
```

### 2. AI Insight Generation

**Search for:** `generateAIInsight` function

**Apply the same pattern as above**

### 3. AI Chat Widget

**Search for:** `handleChatSubmit` or chat-related fetch calls

**Apply the same pattern as above**

### 4. Mitigation Strategy Generation

**Search for:** `mitigation` or `strategy` related fetch calls

**Apply the same pattern as above**

---

## 🚀 Quick Find & Replace

You can use VS Code's Find & Replace feature:

### Find & Replace #1: Remove Authorization Header

**Find:**
```
headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_API_KEY}`
  },
```

**Replace:**
```
// Using secure API proxy - no auth header needed
```

### Find & Replace #2: Update Fetch Calls

**Find:**
```
const response = await fetch('https://api.openai.com/v1/chat/completions',
```

**Replace:**
```
const data = await callOpenAI(
```

**Note:** You'll need to manually adjust the parameters after this replacement.

---

## ✅ Verification Steps

After making changes:

1. **Check imports:**
   ```javascript
   import { callOpenAI, extractContent } from './utils/openaiClient';
   ```

2. **Verify API key is removed:**
   - Search for `OPENAI_API_KEY` in App.jsx
   - Should only appear in comments or error messages
   - Should NOT appear as a variable assignment

3. **Test locally:**
   ```bash
   npm run dev
   ```
   - Upload CSV
   - Run risk analysis
   - Generate AI insight
   - Test chat widget

4. **Check browser console:**
   - Should see: "Calling API: https://your-api-name.vercel.app/api/openai"
   - Should NOT see any API key in Network tab

---

## 🔧 Alternative: Automated Migration Script

If you want, I can create a script to automatically update App.jsx for you.

Would you like me to:
1. **Manually show you each change** (safer, you learn the pattern)
2. **Create an automated script** (faster, but you should review)
3. **Update the file directly** (fastest, but risky)

---

## 📊 Expected Changes Summary

- **Lines to delete:** ~4 (API key definition)
- **Lines to add:** ~1 (import statement)
- **Functions to update:** ~5-10 (all OpenAI API calls)
- **Time required:** 15-30 minutes

---

## 🆘 Need Help?

If you get stuck:

1. **Search for:** `fetch('https://api.openai.com`
2. **Count occurrences:** Should be 0 after migration
3. **Test each feature:** Risk analysis, insights, chat
4. **Check console:** Look for API errors

---

## 🎯 Next Steps After Migration

1. ✅ Remove API key from App.jsx
2. ✅ Update all fetch calls to use callOpenAI
3. ✅ Test locally
4. ✅ Deploy API to Vercel (follow SECURE_DEPLOYMENT_STEPS.md)
5. ✅ Update src/config/api.js with Vercel URL
6. ✅ Deploy frontend to GitHub Pages
7. ✅ Test production deployment

---

**Ready to proceed?** Let me know if you want me to help update the file!


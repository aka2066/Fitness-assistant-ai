# Deployment Troubleshooting Guide

## 🚨 Chatbot Not Working After Deployment?

**Most Common Issue:** Missing environment variables in Amplify

### ✅ Quick Fix Steps:

1. **Go to AWS Amplify Console**
2. **Select your app → Environment variables**  
3. **Add these variables:**

```
OPENAI_API_KEY=sk-proj-[YOUR_OPENAI_API_KEY]
PINECONE_API_KEY=pcsk_[YOUR_PINECONE_API_KEY]  
```

4. **Redeploy your app**
5. **Test the chatbot at `/chat`**

### 🧪 Test Your Deployment

After setting environment variables, test with:

```bash
# Replace with your actual Amplify URL
curl https://your-app.amplifyapp.com/api/health
```

Should return:
```json
{
  "status": "healthy",
  "deployment_ready": true,
  "features": {
    "openai_integration": "enabled"
  }
}
```

### 🔍 Common Error Messages & Fixes

| Error Message | Fix |
|---------------|-----|
| "Server error - missing environment variables" | Set OPENAI_API_KEY in Amplify Console |
| "The OpenAI API key may not be configured" | Set OPENAI_API_KEY in Amplify Console |
| "Cannot read properties of undefined" | Already fixed - redeploy |
| "No data returned from GraphQL" | Already fixed - using DynamoDB fallback |

### 📋 Deployment Checklist

- [ ] Environment variables set in Amplify Console
- [ ] App redeployed after setting variables  
- [ ] Health check returns "deployment_ready": true
- [ ] Chatbot responds without errors
- [ ] UI shows "Personalized for [User Name]"
- [ ] "Back to Dashboard" button works

### 🎯 Expected Results

After fixing environment variables:
- ✅ Chatbot loads without errors
- ✅ AI responds with fitness advice  
- ✅ Personalized responses for users with data
- ✅ RAG enhancement working (with Pinecone key)
- ✅ Graceful fallbacks for new users 
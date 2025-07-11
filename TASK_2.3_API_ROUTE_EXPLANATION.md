# 📡 **Task 2.3: Build API Route - Detailed Explanation**

## **🎯 What is Task 2.3?**
Task 2.3 creates the server-side endpoint that connects your frontend chat interface to Google's Gemini AI. It's the "bridge" that processes user messages and returns AI responses.

---

## **🏗️ API Route Concept**

### **What is an API Route?**
An API route is a server-side endpoint that your frontend can call to process data. In Next.js, API routes live in the `app/api/` directory and handle HTTP requests (GET, POST, etc.).

### **File Structure:**
```
frontend/app/api/chat/route.ts
```
This creates an endpoint at: `http://localhost:3000/api/chat`

### **Data Flow:**
```
User types message → Frontend → API Route → Gemini AI → API Route → Frontend → User sees response
```

---

## **📂 File Creation Process**

### **Step 1: Directory Structure**
- Navigate to `frontend/app/`
- Create folder: `api`
- Inside `api`, create folder: `chat`
- Final path: `frontend/app/api/chat/route.ts`

### **Step 2: Why this structure?**
- `app/api/` - Next.js convention for API routes
- `chat/` - Creates `/api/chat` endpoint
- `route.ts` - Next.js App Router file naming convention

---

## **🔍 Code Breakdown - Section by Section**

### **1. Imports Section**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { geminiModel } from '@/app/lib/gemini';
import { createMedicalPrompt, containsEmergencyKeywords, MEDICAL_DISCLAIMER } from '@/app/lib/prompts';
```

**Explanation:**
- `NextRequest/NextResponse` - Next.js tools for handling HTTP requests and responses
- `geminiModel` - Our configured AI client from Task 2.1
- `createMedicalPrompt, etc.` - Our prompt functions from Task 2.2
- `@/` - Next.js alias for the app directory

---

### **2. POST Handler Function**
```typescript
export async function POST(request: NextRequest) {
```

**Explanation:**
- `export async function POST` - Next.js App Router convention
- Creates a POST endpoint (for sending data to server)
- `async` - Because we'll wait for AI responses
- `NextRequest` - Type for incoming request data

---

### **3. Request Parsing**
```typescript
const body = await request.json();
const { message, conversationHistory = [] } = body;
```

**Explanation:**
- `await request.json()` - Converts incoming request to JavaScript object
- `{ message, conversationHistory = [] }` - Destructuring with default empty array
- Expects frontend to send: `{ message: "user text", conversationHistory: [...] }`

---

### **4. Input Validation**
```typescript
if (!message || typeof message !== 'string' || message.trim().length === 0) {
  return NextResponse.json(
    { error: 'پیام نمی‌تواند خالی باشد' },
    { status: 400 }
  );
}
```

**Explanation:**
- **Security check** - Ensures message exists and is valid
- **Type checking** - Must be a string
- **Empty check** - Can't be just whitespace
- **Persian error** - User-friendly message in Farsi
- **HTTP 400** - "Bad Request" status code

---

### **5. Abuse Prevention**
```typescript
if (message.length > 1000) {
  return NextResponse.json(
    { error: 'پیام خیلی طولانی است. لطفاً پیام کوتاه‌تری ارسال کنید.' },
    { status: 400 }
  );
}
```

**Explanation:**
- **Length limit** - Prevents very long messages
- **Cost control** - Saves on API usage
- **Performance** - Faster processing
- **User guidance** - Clear Persian instruction

---

### **6. Emergency Detection**
```typescript
const isEmergency = containsEmergencyKeywords(message);
```

**Explanation:**
- Uses our function from Task 2.2
- Checks for Persian emergency keywords like "درد قفسه سینه"
- Returns `true/false` for frontend to handle specially
- Helps prioritize urgent medical situations

---

### **7. Prompt Creation**
```typescript
const prompt = createMedicalPrompt(message, conversationHistory);
```

**Explanation:**
- Uses our function from Task 2.2
- Combines system prompt + conversation history + current message
- Creates the full context for Gemini AI
- Includes emergency warnings if needed

---

### **8. AI Processing**
```typescript
const result = await geminiModel.generateContent(prompt);
const response = await result.response;
let aiResponse = response.text();
```

**Explanation:**
- `geminiModel` - Our configured client from Task 2.1
- `generateContent()` - Sends prompt to Gemini AI
- `await` - Waits for AI response (can take 1-5 seconds)
- `response.text()` - Extracts the actual text response

---

### **9. Safety Addition**
```typescript
aiResponse += '\n\n' + MEDICAL_DISCLAIMER;
```

**Explanation:**
- **Automatic safety** - Adds disclaimer to every response
- **Medical compliance** - Ensures users see warnings
- **Legal protection** - Reminds users to consult real doctors
- **Persian disclaimer** - From our prompts file

---

### **10. Success Response**
```typescript
return NextResponse.json({
  response: aiResponse,
  isEmergency: isEmergency,
  timestamp: new Date().toISOString()
});
```

**Explanation:**
- **JSON response** - Standard API format
- **response** - The AI's answer with disclaimer
- **isEmergency** - Boolean for frontend to show warnings
- **timestamp** - When the response was generated

---

### **11. Error Handling**
```typescript
catch (error) {
  console.error('Error in chat API:', error);
  
  if (error.message.includes('API_KEY')) {
    return NextResponse.json(
      { error: 'خطا در تنظیمات سرور. لطفاً بعداً تلاش کنید.' },
      { status: 500 }
    );
  }
}
```

**Explanation:**
- **Try-catch** - Handles any errors gracefully
- **Specific errors** - Different messages for different problems
- **API key errors** - When Gemini key is invalid
- **Rate limit errors** - When too many requests
- **Generic fallback** - For unexpected errors
- **Persian messages** - User-friendly error text

---

## **🔄 How Frontend Will Use This API**

### **Frontend Call:**
```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "سردرد دارم چه کار کنم؟",
    conversationHistory: [
      {role: "user", content: "سلام"},
      {role: "assistant", content: "سلام! چطور می‌تونم کمکتون کنم؟"}
    ]
  })
});

const data = await response.json();
console.log(data.response); // AI response
console.log(data.isEmergency); // true/false
```

### **API Response:**
```json
{
  "response": "سردرد می‌تواند علل مختلفی داشته باشد...\n\n📋 تذکر پزشکی مهم: این اطلاعات صرفاً جنبه آموزشی دارد...",
  "isEmergency": false,
  "timestamp": "2024-12-19T10:30:00.000Z"
}
```

---

## **🛡️ Security & Safety Features**

### **1. API Key Protection**
- API key stays on server (never sent to frontend)
- Environment variable protection
- Error messages don't expose sensitive info

### **2. Input Validation**
- Message type and length checking
- Prevents empty or malicious inputs
- Rate limiting through length restrictions

### **3. Medical Safety**
- Automatic disclaimers on all responses
- Emergency detection and warnings
- No definitive medical diagnoses allowed

### **4. Error Handling**
- Graceful failures without breaking UI
- User-friendly Persian error messages
- Fallback responses when AI is unavailable

---

## **🔗 Connection to Other Tasks**

### **Uses Task 2.1 (Gemini Client):**
- `geminiModel` for AI communication
- Pre-configured safety settings
- Optimized generation parameters

### **Uses Task 2.2 (Medical Prompts):**
- `createMedicalPrompt()` for context building
- `containsEmergencyKeywords()` for safety
- `MEDICAL_DISCLAIMER` for compliance

### **Prepares for Task 3.1 (Frontend Integration):**
- Provides `/api/chat` endpoint
- Returns structured JSON responses
- Handles conversation history

---

## **🧪 Testing the API**

### **Manual Test (using curl):**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "سردرد دارم",
    "conversationHistory": []
  }'
```

### **Expected Response:**
```json
{
  "response": "سردرد می‌تواند علل مختلفی داشته باشد...",
  "isEmergency": false,
  "timestamp": "2024-..."
}
```

---

## **💡 Why This Design?**

### **1. Separation of Concerns**
- Frontend handles UI
- API handles AI logic
- Clean separation of responsibilities

### **2. Security**
- API keys never exposed to browser
- Server-side validation and processing
- Controlled access to AI services

### **3. Scalability**
- Can add rate limiting
- Can add caching
- Can add multiple AI providers

### **4. User Experience**
- Fast responses with proper error handling
- Persian language throughout
- Medical safety built-in

---

**This API route is the heart of your medical chatbot - it connects everything together safely and efficiently!**
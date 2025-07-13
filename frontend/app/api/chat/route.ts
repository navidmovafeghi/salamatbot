import { NextRequest, NextResponse } from 'next/server';
import geminiModel from '@/app/lib/gemini';
import { createMedicalPrompt, containsEmergencyKeywords, MEDICAL_DISCLAIMER } from '@/app/lib/prompts';

// POST handler for chat messages
export async function POST(request: NextRequest) {
  try {
    // Parse the incoming request body
    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    // Validate the message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'پیام نمی‌تواند خالی باشد' },
        { status: 400 }
      );
    }

    // Check if message is too long (prevent abuse)
    if (message.length > 1000) {
      return NextResponse.json(
        { error: 'پیام خیلی طولانی است. لطفاً پیام کوتاه‌تری ارسال کنید.' },
        { status: 400 }
      );
    }

    // Check for emergency keywords
    const isEmergency = containsEmergencyKeywords(message);

    // Create the medical prompt with conversation context
    const prompt = createMedicalPrompt(message, conversationHistory);

    // Send to Gemini AI
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    let aiResponse = response.text();

    // Add medical disclaimer to all responses
    aiResponse += '\n\n' + MEDICAL_DISCLAIMER;

    // Return the response
    return NextResponse.json({
      response: aiResponse,
      isEmergency: isEmergency,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Log error for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in chat API:', error);
    }

    // Handle specific Gemini API errors
    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        return NextResponse.json(
          { error: 'خطا در تنظیمات سرور. لطفاً بعداً تلاش کنید.' },
          { status: 500 }
        );
      }
      
      if (error.message.includes('RATE_LIMIT') || error.message.includes('quota') || error.message.includes('429')) {
        return NextResponse.json(
          { 
            error: 'تعداد درخواست‌ها زیاد است. لطفاً ۳۰ ثانیه صبر کنید و دوباره تلاش کنید.',
            retryAfter: 30
          },
          { status: 429 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      { 
        error: 'متأسفانه خطایی رخ داده است. لطفاً دوباره تلاش کنید.',
        fallbackResponse: 'در حال حاضر امکان پاسخ‌گویی وجود ندارد. لطفاً با پزشک مشورت کنید.'
      },
      { status: 500 }
    );
  }
}
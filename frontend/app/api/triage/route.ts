/**
 * Medical Triage API Endpoint
 * 
 * Cost-optimized 2-stage triage system:
 * 1. Interactive medical interview with progressive questioning
 * 2. Final classification with template-driven response generation
 * 
 * Supports both OpenAI and Gemini providers
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateTriageResponse, generateFinalTriageResponse, isOpenAIConfigured } from '@/app/lib/openai';
import { TRIAGE_SYSTEM_PROMPT, END_RESPONSE_PROMPTS, getEndResponsePrompt } from '@/app/lib/triagePrompts';
import { CLASSIFICATION_TEMPLATES, getTriageTemplate } from '@/app/lib/triageTemplates';
import { MEDICAL_DISCLAIMER } from '@/app/lib/prompts';

// In-memory session storage (replace with proper storage in production)
const sessions = new Map<string, any[]>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, action = 'chat' } = body;

    // Handle new session creation first (doesn't need sessionId)
    if (action === 'new_session') {
      return handleNewSession();
    }

    // Validate required fields for regular chat
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'پیام نمی‌تواند خالی باشد' },
        { status: 400 }
      );
    }

    // Check if OpenAI is configured
    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { error: 'تنظیمات AI مشخص نشده است' },
        { status: 500 }
      );
    }

    return await handleTriageChat(message, sessionId);

  } catch (error) {
    console.error('Triage API Error:', error);
    return NextResponse.json(
      { 
        error: 'خطای سرور رخ داده است',
        fallbackResponse: 'لطفاً با پزشک مشورت کنید.'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle new session creation
 */
async function handleNewSession() {
  const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  return NextResponse.json({ 
    sessionId,
    status: 'ready',
    message: 'جلسه جدید تریاژ پزشکی آماده شد'
  });
}

/**
 * Handle triage chat conversation
 */
async function handleTriageChat(message: string, sessionId: string) {
  // Get or create conversation history
  let conversation = sessions.get(sessionId) || [];
  
  // Initialize conversation with system prompt if new
  if (conversation.length === 0) {
    conversation.push({
      role: 'system',
      content: TRIAGE_SYSTEM_PROMPT
    });
  }

  // Add user message
  conversation.push({
    role: 'user',
    content: message
  });

  try {
    // Generate AI response
    const aiResponse = await generateTriageResponse(conversation);
    const assistantResponse = aiResponse.content;

    // Try to parse JSON response
    let parsedResponse = null;
    let isClassification = false;
    let classification = null;
    let responseMessage = assistantResponse;
    let options = null;
    let template = null;
    let finalResponse = null;

    try {
      parsedResponse = JSON.parse(assistantResponse);
      
      if (parsedResponse.type === 'classification' && parsedResponse.category) {
        // This is a final classification
        isClassification = true;
        classification = parsedResponse.category;
        responseMessage = ''; // Don't show classification JSON to user
        
        // Generate final detailed response using category-specific prompt
        const endPrompt = getEndResponsePrompt(classification);
        if (endPrompt) {
          // Create conversation for final response generation
          const endConversation = [
            { role: 'system', content: endPrompt },
            ...conversation.slice(1) // Skip original system prompt
          ];
          
          const finalAiResponse = await generateFinalTriageResponse(endConversation, classification);
          const finalResponseContent = finalAiResponse.content;
          
          try {
            finalResponse = JSON.parse(finalResponseContent);
          } catch (parseError) {
            console.log('Final response is not JSON, using as text');
            finalResponse = {
              comprehensive_assessment: finalResponseContent
            };
          }
        }
        
        // Get template for this classification
        template = getTriageTemplate(classification);
        
        // Store the classification conversation
        conversation.push({
          role: 'assistant',
          content: assistantResponse
        });
        
      } else if (parsedResponse.type === 'question') {
        // This is a question during interview
        responseMessage = parsedResponse.message || assistantResponse;
        options = parsedResponse.options || null;
        
        // Store the question conversation
        conversation.push({
          role: 'assistant',
          content: assistantResponse
        });
      }
    } catch (jsonError) {
      // If not JSON, treat as regular question
      console.log('Response is not JSON, treating as question:', assistantResponse);
      
      // Store the question conversation
      conversation.push({
        role: 'assistant',
        content: assistantResponse
      });
    }

    // Save updated conversation
    sessions.set(sessionId, conversation);

    // Build response
    const response: any = {
      message: responseMessage,
      classification: classification,
      isComplete: isClassification,
      options: options,
      template: template,
      finalResponse: finalResponse,
      sessionId: sessionId,
      timestamp: new Date().toISOString()
    };

    // Add disclaimer for final responses
    if (isClassification && finalResponse) {
      response.disclaimer = MEDICAL_DISCLAIMER;
    }

    return NextResponse.json(response);

  } catch (aiError) {
    console.error('AI Generation Error:', aiError);
    
    // Fallback response
    return NextResponse.json({
      message: 'متأسفانه در حال حاضر امکان پاسخ‌گویی وجود ندارد. لطفاً بعداً تلاش کنید.',
      isComplete: false,
      error: 'AI service temporarily unavailable',
      fallbackResponse: 'در صورت وضعیت اورژانسی، فوراً با ۱۱۵ تماس بگیرید.',
      sessionId: sessionId,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handle session deletion
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (sessionId) {
      sessions.delete(sessionId);
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Session deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}

/**
 * Get session info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (sessionId) {
      const conversation = sessions.get(sessionId);
      return NextResponse.json({
        sessionId,
        exists: !!conversation,
        messageCount: conversation ? conversation.length - 1 : 0 // Exclude system prompt
      });
    }
    
    return NextResponse.json({
      totalSessions: sessions.size,
      availableCategories: Object.keys(CLASSIFICATION_TEMPLATES),
      systemStatus: {
        openaiConfigured: isOpenAIConfigured()
      }
    });
    
  } catch (error) {
    console.error('Session info error:', error);
    return NextResponse.json({ error: 'Failed to get session info' }, { status: 500 });
  }
}
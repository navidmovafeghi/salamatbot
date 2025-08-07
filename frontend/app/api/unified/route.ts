/**
 * Unified Medical Chat API Endpoint
 * 
 * Single entry point that:
 * 1. Classifies user intent into medical categories
 * 2. Routes messages to appropriate specialized modules
 * 3. Manages session state across categories
 * 4. Provides seamless conversation experience
 */

import { NextRequest, NextResponse } from 'next/server';
import { classifyIntent, MedicalIntent, getCategoryDisplayName } from '@/app/lib/classification/intentClassifier';
import { CategoryRegistry } from '@/app/lib/categories/base/CategoryModule';
import { SymptomReportingModule } from '@/app/lib/categories/SymptomReportingModule';
import { MedicationQueriesModule } from '@/app/lib/categories/MedicationQueriesModule';
import { InformationSeekingModule } from '@/app/lib/categories/InformationSeekingModule';
import { 
  ChronicDiseaseManagementModule, 
  DiagnosticResultInterpretationModule, 
  PreventiveCareWellnessModule 
} from '@/app/lib/categories/PlaceholderModules';
import { isOpenAIConfigured } from '@/app/lib/openai';

// Register all available category modules
CategoryRegistry.register(MedicalIntent.SYMPTOM_REPORTING, new SymptomReportingModule());
CategoryRegistry.register(MedicalIntent.MEDICATION_QUERIES, new MedicationQueriesModule());
CategoryRegistry.register(MedicalIntent.INFORMATION_SEEKING, new InformationSeekingModule());
CategoryRegistry.register(MedicalIntent.CHRONIC_DISEASE_MANAGEMENT, new ChronicDiseaseManagementModule());
CategoryRegistry.register(MedicalIntent.DIAGNOSTIC_RESULT_INTERPRETATION, new DiagnosticResultInterpretationModule());
CategoryRegistry.register(MedicalIntent.PREVENTIVE_CARE_WELLNESS, new PreventiveCareWellnessModule());

// In-memory session storage (replace with proper storage in production)
const sessions = new Map<string, any>();

interface UnifiedRequest {
  message?: string;
  sessionId?: string;
  action?: 'new_session' | 'chat' | 'get_info' | 'change_category';
  forceCategory?: MedicalIntent;
  specialAction?: {
    type: string;
    data?: any;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: UnifiedRequest = await request.json();
    const { message, sessionId, action = 'chat', forceCategory, specialAction } = body;

    // Handle new session creation
    if (action === 'new_session') {
      return handleNewSession();
    }

    // Handle session info requests
    if (action === 'get_info') {
      return handleGetInfo(sessionId);
    }

    // Validate required fields for chat
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'پیام نمی‌تواند خالی باشد' },
        { status: 400 }
      );
    }

    // Check API configuration
    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { error: 'تنظیمات API مشخص نشده است' },
        { status: 500 }
      );
    }

    // Handle special actions (like quick action buttons)
    if (specialAction) {
      return await handleSpecialAction(sessionId, specialAction, message);
    }

    // Handle category change requests
    if (action === 'change_category' && forceCategory) {
      return await handleCategoryChange(sessionId, forceCategory, message);
    }

    // Handle regular chat
    return await handleUnifiedChat(sessionId, message, forceCategory);

  } catch (error) {
    console.error('Unified API Error:', error);
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
 * Create new session
 */
async function handleNewSession() {
  const sessionId = 'unified_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  // Initialize empty session
  sessions.set(sessionId, {
    sessionId,
    currentCategory: null,
    categorySession: null,
    conversationHistory: [],
    classifications: [],
    startTime: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  });

  return NextResponse.json({ 
    sessionId,
    status: 'ready',
    message: 'جلسه جدید پزشکی آماده شد. مشکل یا سوال پزشکی خود را بیان کنید.'
  });
}

/**
 * Get session information
 */
async function handleGetInfo(sessionId?: string) {
  if (sessionId) {
    const session = sessions.get(sessionId);
    return NextResponse.json({
      sessionId,
      exists: !!session,
      currentCategory: session?.currentCategory,
      messageCount: session?.conversationHistory?.length || 0,
      classifications: session?.classifications || []
    });
  }
  
  return NextResponse.json({
    totalSessions: sessions.size,
    availableCategories: Array.from(CategoryRegistry.getAll().keys()),
    systemStatus: {
      openaiConfigured: isOpenAIConfigured(),
      registeredModules: Array.from(CategoryRegistry.getAll().keys()).length
    }
  });
}

/**
 * Handle main chat flow with intent classification
 */
async function handleUnifiedChat(
  sessionId: string, 
  message: string, 
  forceCategory?: MedicalIntent
) {
  let session = sessions.get(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  try {
    let targetCategory: MedicalIntent;
    let classificationResult = null;

    // Use forced category or classify intent
    if (forceCategory) {
      targetCategory = forceCategory;
    } else {
      const apiKey = process.env.OPENROUTER_API_KEY;
      classificationResult = await classifyIntent(message, apiKey);
      targetCategory = classificationResult.intent;
      
      // Store classification result
      session.classifications.push({
        message,
        classification: classificationResult,
        timestamp: new Date().toISOString()
      });
    }

    // Get the appropriate category module
    let categoryModule = CategoryRegistry.get(targetCategory);
    if (!categoryModule) {
      // Fallback to symptom reporting if module not implemented
      targetCategory = MedicalIntent.SYMPTOM_REPORTING;
      categoryModule = CategoryRegistry.get(targetCategory);
      if (!categoryModule) {
        throw new Error('No category modules available');
      }
    }

    // Check if we need to switch categories
    const needsCategorySwitch = session.currentCategory !== targetCategory;
    
    if (needsCategorySwitch || !session.categorySession) {
      // Initialize new category session
      session.categorySession = await categoryModule.initializeSession(sessionId, message);
      session.currentCategory = targetCategory;
    } else {
      // Continue with existing category session
      session.categorySession = session.categorySession;
    }

    // Process message through category module
    const apiKey = process.env.OPENROUTER_API_KEY!;
    const categoryResponse = await categoryModule.processMessage(
      session.categorySession,
      message,
      apiKey
    );

    // Update session
    session.conversationHistory.push({
      message,
      category: targetCategory,
      response: categoryResponse,
      timestamp: new Date().toISOString()
    });
    session.lastActivity = new Date().toISOString();
    sessions.set(sessionId, session);

    // Build unified response
    const unifiedResponse = {
      message: categoryResponse.message,
      category: targetCategory,
      categoryName: getCategoryDisplayName(targetCategory),
      isComplete: categoryResponse.isComplete,
      nextAction: categoryResponse.nextAction,
      options: categoryResponse.options,
      specialFeatures: categoryResponse.specialFeatures,
      sessionId,
      timestamp: new Date().toISOString(),
      metadata: {
        ...categoryResponse.metadata,
        classification: classificationResult,
        categorySwitch: needsCategorySwitch,
        totalMessages: session.conversationHistory.length
      }
    };

    // Add category switch notification if needed
    if (needsCategorySwitch && classificationResult) {
      (unifiedResponse.metadata as any).categoryNotification = {
        message: `سوال شما به دسته «${getCategoryDisplayName(targetCategory)}» طبقه‌بندی شد.`,
        confidence: classificationResult.confidence,
        reasoning: classificationResult.reasoning
      };
    }

    return NextResponse.json(unifiedResponse);

  } catch (error) {
    console.error('Unified chat error:', error);
    
    // Fallback response
    return NextResponse.json({
      message: 'متأسفانه در حال حاضر امکان پاسخ‌گویی وجود ندارد. لطفاً بعداً تلاش کنید.',
      category: MedicalIntent.SYMPTOM_REPORTING,
      categoryName: getCategoryDisplayName(MedicalIntent.SYMPTOM_REPORTING),
      isComplete: false,
      nextAction: 'continue',
      error: 'Processing failed',
      fallbackResponse: 'در صورت وضعیت اورژانسی، فوراً با ۱۱۵ تماس بگیرید.',
      sessionId,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handle category change requests
 */
async function handleCategoryChange(
  sessionId: string,
  newCategory: MedicalIntent,
  message: string
) {
  const session = sessions.get(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Force the new category
  return await handleUnifiedChat(sessionId, message, newCategory);
}

/**
 * Handle special actions (quick action buttons, etc.)
 */
async function handleSpecialAction(
  sessionId: string,
  specialAction: { type: string; data?: any },
  message: string
) {
  const session = sessions.get(sessionId);
  if (!session || !session.categorySession) {
    return NextResponse.json({ error: 'No active category session' }, { status: 400 });
  }

  try {
    const categoryModule = CategoryRegistry.get(session.currentCategory);
    if (!categoryModule || !categoryModule.handleSpecialAction) {
      return NextResponse.json({ 
        error: 'Special action not supported for this category' 
      }, { status: 400 });
    }

    const response = await categoryModule.handleSpecialAction(
      session.categorySession,
      specialAction.type,
      specialAction.data
    );

    // Update session
    session.conversationHistory.push({
      message: `Special action: ${specialAction.type}`,
      category: session.currentCategory,
      response,
      timestamp: new Date().toISOString()
    });
    session.lastActivity = new Date().toISOString();
    sessions.set(sessionId, session);

    return NextResponse.json({
      ...response,
      category: session.currentCategory,
      categoryName: getCategoryDisplayName(session.currentCategory),
      sessionId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Special action error:', error);
    return NextResponse.json({ 
      error: 'Failed to execute special action' 
    }, { status: 500 });
  }
}

/**
 * Delete session
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
    
    return await handleGetInfo(sessionId || undefined);
    
  } catch (error) {
    console.error('Session info error:', error);
    return NextResponse.json({ error: 'Failed to get session info' }, { status: 500 });
  }
}
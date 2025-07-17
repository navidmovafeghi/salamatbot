import { NextRequest, NextResponse } from 'next/server';
import geminiModel from '@/app/lib/gemini';
import { 
  createMedicalPrompt, 
  containsEmergencyKeywords, 
  MEDICAL_DISCLAIMER, 
  assessEmergencyLevel,
  generateEnhancedMedicalPrompt,
  CONFIDENCE_ASSESSMENT_PROMPT
} from '@/app/lib/prompts';
import { calculateQuickConfidence } from '@/app/lib/confidenceAssessment';
import { calculateOptimizedConfidence } from '@/app/lib/hybridConfidence';
import { ENHANCED_MEDICAL_CATEGORIES } from '@/app/lib/medicalCategories';
import { analyzeInput } from '@/app/lib/inputAnalysis';
import { selectOptimalQuestions, identifyUncertaintyAreas } from '@/app/lib/questionSelection';
import { 
  determineProgressiveQuestions, 
  shouldAskProgressiveQuestions,
  updateProgressiveState 
} from '@/app/lib/progressiveQuestions';

// POST handler for chat messages
export async function POST(request: NextRequest) {
  try {
    // Parse the incoming request body
    const body = await request.json();
    const { 
      message, 
      conversationHistory = [], 
      enhancedContext, 
      requestType,
      progressiveState,
      stage = 'initial'
    } = body;

    // Handle different types of requests for the 3-stage system
    switch (requestType) {
      case 'STAGE_1_ANALYSIS':
        return await handleStage1Analysis(body);
      
      case 'STAGE_2A_QUESTIONS':
        return await handleStage2AQuestions(body);
      
      case 'STAGE_2B_CONFIDENCE':
        return await handleStage2BConfidence(body);
      
      case 'STAGE_2C_PROGRESSIVE':
        return await handleStage2CProgressive(body);
      
      case 'STAGE_3_FINAL':
        return await handleStage3Final(body);
      
      case 'CONFIDENCE_ASSESSMENT':
        return await handleConfidenceAssessment(body);
      
      case 'EMERGENCY_FAST_TRACK':
        return await handleEmergencyFastTrack(body);
      
      default:
        // Legacy support and simple chat
        break;
    }

    // Handle legacy requests
    if (message === 'GENERATE_FINAL_RESPONSE' && enhancedContext) {
      return await handleFinalResponse(enhancedContext, conversationHistory);
    }

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

/**
 * Stage 1: Initial Analysis and Classification
 */
async function handleStage1Analysis(body: any) {
  try {
    const { message, conversationHistory = [] } = body;
    const startTime = Date.now();

    // Emergency assessment first
    const emergencyAssessment = assessEmergencyLevel(message);
    
    if (emergencyAssessment.immediateResponse) {
      return await handleEmergencyFastTrack({ message, emergencyAssessment });
    }

    // Analyze input
    const analysis = analyzeInput(message);
    
    // Classify into medical category
    const category = ENHANCED_MEDICAL_CATEGORIES.find(cat => 
      cat.keywords.some(keyword => 
        message.toLowerCase().includes(keyword.toLowerCase())
      )
    ) || ENHANCED_MEDICAL_CATEGORIES[0]; // Default to general

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      stage: 'STAGE_1_COMPLETE',
      analysis,
      category,
      emergencyAssessment,
      processingTime,
      nextStage: emergencyAssessment.bypassProgressive ? 'STAGE_3_FINAL' : 'STAGE_2A_QUESTIONS',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in Stage 1 Analysis:', error);
    return NextResponse.json(
      { error: 'خطا در تحلیل اولیه', stage: 'STAGE_1_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * Stage 2A: Smart Question Selection
 */
async function handleStage2AQuestions(body: any) {
  try {
    const { analysis, category, maxQuestions = 3 } = body;
    const startTime = Date.now();

    // Select optimal questions
    const questionResult = selectOptimalQuestions(category, analysis, maxQuestions);
    
    // Identify uncertainty areas
    const uncertaintyAreas = identifyUncertaintyAreas(analysis, category);

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      stage: 'STAGE_2A_COMPLETE',
      questions: questionResult.questions,
      uncertaintyAreas: questionResult.uncertaintyAreas,
      reasoning: questionResult.reasoning,
      expectedInformationGain: questionResult.expectedInformationGain,
      processingTime,
      nextStage: 'STAGE_2B_CONFIDENCE',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in Stage 2A Questions:', error);
    return NextResponse.json(
      { error: 'خطا در انتخاب سوالات', stage: 'STAGE_2A_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * Stage 2B: Confidence Assessment
 */
async function handleStage2BConfidence(body: any) {
  try {
    const { 
      analysis, 
      category, 
      questionAnswers = [], 
      conversationHistory = [] 
    } = body;
    const startTime = Date.now();

    // Calculate optimized confidence
    const confidence = await calculateOptimizedConfidence(
      analysis,
      category,
      questionAnswers,
      conversationHistory
    );

    const processingTime = Date.now() - startTime;

    // Determine next stage based on confidence
    let nextStage = 'STAGE_3_FINAL';
    if (confidence.overallScore < 75 && !analysis.isUrgent) {
      nextStage = 'STAGE_2C_PROGRESSIVE';
    }

    return NextResponse.json({
      stage: 'STAGE_2B_COMPLETE',
      confidence,
      processingTime,
      nextStage,
      shouldAskProgressive: nextStage === 'STAGE_2C_PROGRESSIVE',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in Stage 2B Confidence:', error);
    return NextResponse.json(
      { error: 'خطا در ارزیابی اطمینان', stage: 'STAGE_2B_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * Stage 2C: Progressive Questions (if needed)
 */
async function handleStage2CProgressive(body: any) {
  try {
    const { 
      analysis, 
      confidence, 
      progressiveContext,
      currentRound = 1 
    } = body;
    const startTime = Date.now();

    // Check if progressive questions should be asked
    if (!shouldAskProgressiveQuestions(confidence, currentRound)) {
      return NextResponse.json({
        stage: 'STAGE_2C_SKIP',
        reason: 'اطمینان کافی یا حداکثر دور رسیده',
        nextStage: 'STAGE_3_FINAL',
        timestamp: new Date().toISOString()
      });
    }

    // Determine progressive questions
    const progressiveResult = await determineProgressiveQuestions(
      analysis,
      confidence,
      progressiveContext
    );

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      stage: 'STAGE_2C_COMPLETE',
      progressiveQuestions: progressiveResult.questions,
      reasoning: progressiveResult.reasoning,
      expectedImprovement: progressiveResult.confidenceImprovement,
      shouldContinue: progressiveResult.shouldContinue,
      uncertaintyAreas: progressiveResult.uncertaintyAreas,
      processingTime,
      nextStage: 'STAGE_3_FINAL',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in Stage 2C Progressive:', error);
    return NextResponse.json(
      { error: 'خطا در سوالات تدریجی', stage: 'STAGE_2C_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * Stage 3: Final Enhanced Response
 */
async function handleStage3Final(body: any) {
  try {
    const { 
      analysis, 
      category, 
      confidence, 
      questionAnswers = [],
      progressiveAnswers = [],
      conversationHistory = [],
      informationCompleteness = 70
    } = body;
    const startTime = Date.now();

    // Combine all answers
    const allAnswers = [...questionAnswers, ...progressiveAnswers];
    const uncertaintyAreas = confidence.categoryScores
      ?.filter(cat => cat.score < 60)
      ?.map(cat => cat.category) || [];

    // Generate enhanced medical prompt
    const prompt = generateEnhancedMedicalPrompt(
      analysis.originalText || '',
      confidence.overallScore,
      informationCompleteness,
      uncertaintyAreas,
      conversationHistory
    );

    // Generate AI response
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    let aiResponse = response.text();

    // Add confidence and metadata
    const metadata = {
      confidenceScore: confidence.overallScore,
      informationCompleteness,
      responseTime: Date.now() - startTime,
      emergencyLevel: analysis.isUrgent ? 'high' : 'low',
      uncertaintyAreas,
      stage: 'STAGE_3_FINAL',
      method: '3_stage_enhanced'
    };

    // Add medical disclaimer
    aiResponse += '\n\n' + MEDICAL_DISCLAIMER;

    return NextResponse.json({
      stage: 'STAGE_3_COMPLETE',
      response: aiResponse,
      metadata,
      confidence: confidence.overallScore,
      processingTime: metadata.responseTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in Stage 3 Final:', error);
    return NextResponse.json(
      { error: 'خطا در تولید پاسخ نهایی', stage: 'STAGE_3_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * Emergency Fast-Track Handler
 */
async function handleEmergencyFastTrack(body: any) {
  try {
    const { message, emergencyAssessment } = body;
    const startTime = Date.now();

    // Generate immediate emergency response
    const emergencyPrompt = `
این یک وضعیت اورژانسی است. بر اساس علائم زیر، راهنمایی فوری ارائه دهید:

**علائم شناسایی شده:** ${emergencyAssessment.keywordsFound.join(', ')}
**سطح اورژانس:** ${emergencyAssessment.urgencyLevel}
**نوع اورژانس:** ${emergencyAssessment.emergencyType}

**دستورالعمل:**
1. فوراً اقدامات ضروری را بیان کنید
2. شماره‌های اورژانس را ذکر کنید
3. تا رسیدن کمک چه کاری انجام دهند
4. از چه کارهایی خودداری کنند

پاسخ کوتاه، واضح و فوری ارائه دهید:
`;

    const result = await geminiModel.generateContent(emergencyPrompt);
    const response = await result.response;
    let aiResponse = response.text();

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      stage: 'EMERGENCY_COMPLETE',
      response: aiResponse,
      isEmergency: true,
      emergencyAssessment,
      metadata: {
        responseTime: processingTime,
        emergencyLevel: emergencyAssessment.urgencyLevel,
        method: 'emergency_fast_track'
      },
      recommendedActions: emergencyAssessment.recommendedActions,
      processingTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in Emergency Fast-Track:', error);
    return NextResponse.json(
      { 
        error: 'خطا در پاسخ اورژانسی',
        fallbackResponse: 'فوراً با اورژانس ۱۱۵ تماس بگیرید',
        isEmergency: true
      },
      { status: 500 }
    );
  }
}

/**
 * Handle final comprehensive response generation
 */
async function handleFinalResponse(enhancedContext: any, conversationHistory: any[]) {
  try {
    const { initialInput, category, questionResponses, confidence, informationCompleteness } = enhancedContext;

    // Create enhanced prompt for final response
    const finalPrompt = createEnhancedFinalPrompt(
      initialInput,
      category,
      questionResponses,
      confidence,
      conversationHistory
    );

    // Generate comprehensive response
    const result = await geminiModel.generateContent(finalPrompt);
    const response = await result.response;
    let aiResponse = response.text();

    // Add confidence and completeness indicators
    aiResponse += `\n\n📊 **ارزیابی اطلاعات:**\n`;
    aiResponse += `- اطمینان تشخیصی: ${confidence.score}%\n`;
    aiResponse += `- تکمیل اطلاعات: ${informationCompleteness}%\n`;
    
    if (confidence.score < 70) {
      aiResponse += `\n⚠️ **توجه:** با توجه به اطمینان متوسط، توصیه می‌شود حتماً با پزشک مشورت کنید.\n`;
    }

    // Add medical disclaimer
    aiResponse += '\n\n' + MEDICAL_DISCLAIMER;

    return NextResponse.json({
      response: aiResponse,
      confidence: confidence.score,
      informationCompleteness,
      method: 'enhanced_3_stage',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in handleFinalResponse:', error);
    return NextResponse.json(
      { 
        error: 'خطا در تولید پاسخ نهایی',
        fallbackResponse: 'لطفاً با پزشک مشورت کنید.'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle AI-powered confidence assessment
 */
async function handleConfidenceAssessment(body: any) {
  try {
    const { answers, category, initialAnalysis, questionResponses } = body;

    // First try quick confidence assessment
    const quickAssessment = calculateQuickConfidence(
      answers,
      category,
      initialAnalysis,
      questionResponses
    );

    // Check if AI assessment is needed (uncertain range)
    const needsAIAssessment = quickAssessment.score >= 40 && quickAssessment.score <= 75;

    if (needsAIAssessment) {
      try {
        // Generate AI confidence assessment
        const aiConfidence = await calculateAIConfidence(answers, category, initialAnalysis);
        
        // Combine quick and AI assessments
        const hybridScore = combineConfidenceScores(quickAssessment.score, aiConfidence);
        
        return NextResponse.json({
          confidence: hybridScore,
          method: 'hybrid',
          quickScore: quickAssessment.score,
          aiScore: aiConfidence,
          needsMoreQuestions: hybridScore < 60,
          suggestedQuestionCount: hybridScore < 40 ? 2 : hybridScore < 60 ? 1 : 0,
          processingTime: quickAssessment.processingTimeMs,
          timestamp: new Date().toISOString()
        });

      } catch (aiError) {
        console.log('AI confidence assessment failed, using quick assessment:', aiError);
        
        return NextResponse.json({
          confidence: quickAssessment.score,
          method: 'quick_fallback',
          needsMoreQuestions: quickAssessment.needsMoreQuestions,
          suggestedQuestionCount: quickAssessment.suggestedQuestionCount,
          processingTime: quickAssessment.processingTimeMs,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Use quick assessment for clear cases
    return NextResponse.json({
      confidence: quickAssessment.score,
      method: 'quick',
      needsMoreQuestions: quickAssessment.needsMoreQuestions,
      suggestedQuestionCount: quickAssessment.suggestedQuestionCount,
      processingTime: quickAssessment.processingTimeMs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in handleConfidenceAssessment:', error);
    return NextResponse.json(
      { error: 'خطا در ارزیابی اطمینان' },
      { status: 500 }
    );
  }
}

/**
 * Calculate AI-powered confidence score
 */
async function calculateAIConfidence(
  answers: string[],
  category: any,
  initialAnalysis: any
): Promise<number> {
  const categoryName = category?.name || 'عمومی';
  const answersText = answers.join(' | ');

  const confidencePrompt = `
شما یک پزشک متخصص هستید. بر اساس پاسخ‌های بیمار، اطمینان تشخیصی شما چقدر است؟

**دسته پزشکی:** ${categoryName}
**پاسخ‌های بیمار:** ${answersText}

**راهنمای ارزیابی اطمینان:**
- ۹۰-۱۰۰: اطلاعات کامل و دقیق برای مشاوره پزشکی
- ۷۰-۸۹: اطلاعات خوب، یک سوال اضافی ممکن است مفید باشد
- ۵۰-۶۹: اطلاعات متوسط، ۲ سوال اضافی توصیه می‌شود
- ۳۰-۴۹: اطلاعات ناکافی، نیاز به سوالات بیشتر
- زیر ۳۰: اطلاعات بسیار ناکافی

**عوامل مهم در ارزیابی:**
- وضوح و دقت پاسخ‌ها
- اطلاعات شدت، زمان، و مکان علائم
- علائم همراه و الگوی بیماری
- سابقه پزشکی و داروهای مصرفی

لطفاً فقط عدد اطمینان (۰ تا ۱۰۰) را برگردانید:
`;

  const result = await geminiModel.generateContent(confidencePrompt);
  const response = await result.response;
  const responseText = response.text();

  // Extract confidence number from response
  const confidenceMatch = responseText.match(/(\d+)/);
  
  if (confidenceMatch) {
    const confidence = parseInt(confidenceMatch[1]);
    return Math.max(Math.min(confidence, 100), 0);
  }
  
  // Fallback if no number found
  return 50;
}

/**
 * Combine quick and AI confidence scores using weighted average
 */
function combineConfidenceScores(quickScore: number, aiScore: number): number {
  // Weight: 60% quick assessment, 40% AI assessment
  // Quick assessment is more reliable for clear cases
  const hybridScore = (quickScore * 0.6) + (aiScore * 0.4);
  
  // Apply medical safety adjustment (slightly conservative)
  const safetyAdjustedScore = hybridScore * 0.95;
  
  return Math.max(Math.min(Math.round(safetyAdjustedScore), 100), 20);
}

/**
 * Create enhanced prompt for final comprehensive response
 */
function createEnhancedFinalPrompt(
  initialInput: any,
  category: any,
  questionResponses: any[],
  confidence: any,
  conversationHistory: any[]
): string {
  const categoryName = category?.name || 'عمومی';
  const responses = questionResponses.map(qr => 
    `سوال: ${qr.questionText}\nپاسخ: ${qr.response}`
  ).join('\n\n');

  return `
شما یک پزشک متخصص هستید که باید بر اساس اطلاعات جمع‌آوری شده، مشاوره جامع و دقیق ارائه دهید.

**اطلاعات اولیه بیمار:**
${JSON.stringify(initialInput, null, 2)}

**دسته پزشکی:** ${categoryName}

**پاسخ‌های جمع‌آوری شده:**
${responses}

**سطح اطمینان:** ${confidence.score}%

**دستورالعمل پاسخ:**
1. تحلیل جامع علائم و وضعیت بیمار
2. احتمالات تشخیصی محتمل (بدون تشخیص قطعی)
3. توصیه‌های درمانی اولیه و مراقبتی
4. علائم هشداردهنده که نیاز به مراجعه فوری دارند
5. پیشگیری و مراقبت‌های بعدی

**نکات مهم:**
- هرگز تشخیص قطعی ندهید
- همیشه تأکید کنید که مراجعه به پزشک ضروری است
- در صورت شک، محتاط‌تر عمل کنید
- پاسخ را به زبان فارسی و قابل فهم ارائه دهید

لطفاً مشاوره جامع خود را ارائه دهید:
`;
}
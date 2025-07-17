/**
 * Confidence Assessment API Endpoint
 * 
 * This endpoint handles confidence assessment requests for the 3-stage
 * enhanced conversation flow system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateOptimizedConfidence } from '@/app/lib/hybridConfidence';
import { calculateQuickConfidence } from '@/app/lib/confidenceAssessment';
import geminiModel from '@/app/lib/gemini';
import { CONFIDENCE_ASSESSMENT_PROMPT } from '@/app/lib/prompts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      analysis, 
      category, 
      questionAnswers = [], 
      conversationHistory = [],
      method = 'optimized' // 'quick', 'ai', 'optimized'
    } = body;

    const startTime = Date.now();

    switch (method) {
      case 'quick':
        return await handleQuickConfidence(analysis, category, questionAnswers);
      
      case 'ai':
        return await handleAIConfidence(analysis, category, questionAnswers, conversationHistory);
      
      case 'optimized':
      default:
        return await handleOptimizedConfidence(analysis, category, questionAnswers, conversationHistory);
    }

  } catch (error) {
    console.error('Error in confidence assessment:', error);
    return NextResponse.json(
      { error: 'خطا در ارزیابی اطمینان' },
      { status: 500 }
    );
  }
}

/**
 * Handle quick confidence assessment
 */
async function handleQuickConfidence(
  analysis: any, 
  category: any, 
  questionAnswers: any[]
) {
  try {
    const startTime = Date.now();
    
    const result = calculateQuickConfidence(
      questionAnswers.map(qa => qa.answer || qa),
      category,
      analysis,
      questionAnswers
    );

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      method: 'quick',
      confidence: {
        overallScore: result.score,
        categoryScores: result.categoryBreakdown || [],
        reasoning: result.reasoning || 'ارزیابی سریع بر اساس الگوریتم‌های از پیش تعریف شده',
        recommendations: result.recommendations || []
      },
      processingTime,
      needsMoreQuestions: result.needsMoreQuestions,
      suggestedQuestionCount: result.suggestedQuestionCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in quick confidence:', error);
    throw error;
  }
}

/**
 * Handle AI-powered confidence assessment
 */
async function handleAIConfidence(
  analysis: any, 
  category: any, 
  questionAnswers: any[],
  conversationHistory: any[]
) {
  try {
    const startTime = Date.now();
    
    // Prepare data for AI assessment
    const answersText = questionAnswers
      .map(qa => typeof qa === 'string' ? qa : qa.answer || '')
      .join(' | ');
    
    const categoryName = category?.name || 'عمومی';
    const symptoms = analysis?.symptoms?.join(', ') || 'نامشخص';
    
    // Create AI confidence assessment prompt
    const prompt = `
${CONFIDENCE_ASSESSMENT_PROMPT}

**اطلاعات ورودی:**
- دسته پزشکی: ${categoryName}
- علائم اولیه: ${symptoms}
- پاسخ‌های بیمار: ${answersText}
- وضوح اولیه: ${analysis?.clarityScore || 50}%
- اختصاصی بودن: ${analysis?.specificityScore || 50}%

لطفاً ارزیابی اطمینان خود را به صورت JSON ارائه دهید:
`;

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Parse AI response
    let aiAssessment;
    try {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiAssessment = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      // Fallback: extract confidence number
      const confidenceMatch = responseText.match(/(\d+)/);
      const confidenceScore = confidenceMatch ? parseInt(confidenceMatch[1]) : 50;
      
      aiAssessment = {
        overallConfidence: Math.max(Math.min(confidenceScore, 100), 0),
        categoryScores: {
          informationQuality: confidenceScore,
          symptomClarity: confidenceScore,
          urgencyLevel: analysis?.isUrgent ? 80 : 40,
          complexity: 50,
          medicalSafety: Math.max(confidenceScore - 10, 30)
        },
        reasoning: 'ارزیابی AI با استخراج خودکار امتیاز',
        recommendations: ['مراجعه به پزشک توصیه می‌شود']
      };
    }

    const processingTime = Date.now() - startTime;

    // Convert to standard format
    const confidence = {
      overallScore: aiAssessment.overallConfidence || 50,
      categoryScores: Object.entries(aiAssessment.categoryScores || {}).map(([category, score]) => ({
        category,
        score: typeof score === 'number' ? score : 50
      })),
      reasoning: aiAssessment.reasoning || 'ارزیابی AI',
      recommendations: aiAssessment.recommendations || []
    };

    return NextResponse.json({
      method: 'ai',
      confidence,
      processingTime,
      needsMoreQuestions: confidence.overallScore < 70,
      suggestedQuestionCount: confidence.overallScore < 40 ? 2 : confidence.overallScore < 60 ? 1 : 0,
      rawAIResponse: responseText,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in AI confidence:', error);
    throw error;
  }
}

/**
 * Handle optimized (hybrid) confidence assessment
 */
async function handleOptimizedConfidence(
  analysis: any, 
  category: any, 
  questionAnswers: any[],
  conversationHistory: any[]
) {
  try {
    const startTime = Date.now();
    
    const confidence = await calculateOptimizedConfidence(
      analysis,
      category,
      questionAnswers,
      conversationHistory
    );

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      method: 'optimized',
      confidence,
      processingTime,
      needsMoreQuestions: confidence.overallScore < 75,
      suggestedQuestionCount: confidence.overallScore < 40 ? 3 : confidence.overallScore < 60 ? 2 : confidence.overallScore < 75 ? 1 : 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in optimized confidence:', error);
    throw error;
  }
}

/**
 * GET handler for confidence assessment info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const method = searchParams.get('method') || 'all';

    const info = {
      availableMethods: ['quick', 'ai', 'optimized'],
      defaultMethod: 'optimized',
      confidenceLevels: {
        'very_high': { range: [85, 100], label: 'اطمینان بسیار بالا' },
        'high': { range: [70, 84], label: 'اطمینان بالا' },
        'medium': { range: [50, 69], label: 'اطمینان متوسط' },
        'low': { range: [30, 49], label: 'اطمینان پایین' },
        'very_low': { range: [0, 29], label: 'اطمینان بسیار پایین' }
      },
      thresholds: {
        progressiveQuestions: 75,
        aiAssessment: { min: 40, max: 75 },
        finalResponse: 60
      }
    };

    if (method !== 'all') {
      return NextResponse.json({
        method,
        description: getMethodDescription(method),
        ...info
      });
    }

    return NextResponse.json(info);

  } catch (error) {
    console.error('Error in confidence info:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات ارزیابی اطمینان' },
      { status: 500 }
    );
  }
}

/**
 * Get method description
 */
function getMethodDescription(method: string): string {
  const descriptions = {
    'quick': 'ارزیابی سریع بر اساس الگوریتم‌های از پیش تعریف شده',
    'ai': 'ارزیابی هوشمند با استفاده از مدل AI',
    'optimized': 'ترکیب ارزیابی سریع و AI برای بهترین نتیجه'
  };
  
  return descriptions[method] || 'روش نامشخص';
}
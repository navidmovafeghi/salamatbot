/**
 * Classification API Endpoint
 * 
 * This endpoint handles input analysis and medical classification
 * for the 3-stage enhanced conversation flow system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeInput } from '@/app/lib/inputAnalysis';
import { ENHANCED_MEDICAL_CATEGORIES } from '@/app/lib/medicalCategories';
import { assessEmergencyLevel } from '@/app/lib/prompts';
import { selectOptimalQuestions, identifyUncertaintyAreas } from '@/app/lib/questionSelection';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      message, 
      requestType = 'full_analysis',
      includeQuestions = true,
      maxQuestions = 3
    } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'پیام نمی‌تواند خالی باشد' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    switch (requestType) {
      case 'analysis_only':
        return await handleAnalysisOnly(message);
      
      case 'classification_only':
        return await handleClassificationOnly(message);
      
      case 'emergency_check':
        return await handleEmergencyCheck(message);
      
      case 'full_analysis':
      default:
        return await handleFullAnalysis(message, includeQuestions, maxQuestions);
    }

  } catch (error) {
    console.error('Error in classification:', error);
    return NextResponse.json(
      { error: 'خطا در تحلیل و طبقه‌بندی' },
      { status: 500 }
    );
  }
}

/**
 * Handle input analysis only
 */
async function handleAnalysisOnly(message: string) {
  try {
    const startTime = Date.now();
    const analysis = analyzeInput(message);
    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      type: 'analysis_only',
      analysis,
      processingTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in analysis only:', error);
    throw error;
  }
}

/**
 * Handle medical classification only
 */
async function handleClassificationOnly(message: string) {
  try {
    const startTime = Date.now();
    
    // Find matching categories
    const matchingCategories = ENHANCED_MEDICAL_CATEGORIES.filter(category =>
      category.keywords.some(keyword =>
        message.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    // Score categories based on keyword matches
    const scoredCategories = matchingCategories.map(category => {
      const matchCount = category.keywords.filter(keyword =>
        message.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      
      const score = (matchCount / category.keywords.length) * 100;
      
      return {
        category,
        score,
        matchedKeywords: category.keywords.filter(keyword =>
          message.toLowerCase().includes(keyword.toLowerCase())
        )
      };
    });

    // Sort by score and get top category
    scoredCategories.sort((a, b) => b.score - a.score);
    const primaryCategory = scoredCategories[0]?.category || ENHANCED_MEDICAL_CATEGORIES[0];
    
    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      type: 'classification_only',
      primaryCategory,
      alternativeCategories: scoredCategories.slice(1, 3).map(sc => sc.category),
      categoryScores: scoredCategories,
      processingTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in classification only:', error);
    throw error;
  }
}

/**
 * Handle emergency assessment only
 */
async function handleEmergencyCheck(message: string) {
  try {
    const startTime = Date.now();
    const emergencyAssessment = assessEmergencyLevel(message);
    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      type: 'emergency_check',
      emergencyAssessment,
      isEmergency: emergencyAssessment.isEmergency,
      urgencyLevel: emergencyAssessment.urgencyLevel,
      recommendedActions: emergencyAssessment.recommendedActions,
      bypassProgressive: emergencyAssessment.bypassProgressive,
      immediateResponse: emergencyAssessment.immediateResponse,
      processingTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in emergency check:', error);
    throw error;
  }
}

/**
 * Handle full analysis with classification and questions
 */
async function handleFullAnalysis(
  message: string, 
  includeQuestions: boolean, 
  maxQuestions: number
) {
  try {
    const startTime = Date.now();

    // Step 1: Input analysis
    const analysis = analyzeInput(message);

    // Step 2: Emergency assessment
    const emergencyAssessment = assessEmergencyLevel(message);

    // Step 3: Medical classification
    const matchingCategories = ENHANCED_MEDICAL_CATEGORIES.filter(category =>
      category.keywords.some(keyword =>
        message.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    const scoredCategories = matchingCategories.map(category => {
      const matchCount = category.keywords.filter(keyword =>
        message.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      
      const score = (matchCount / category.keywords.length) * 100;
      
      return {
        category,
        score,
        matchedKeywords: category.keywords.filter(keyword =>
          message.toLowerCase().includes(keyword.toLowerCase())
        )
      };
    });

    scoredCategories.sort((a, b) => b.score - a.score);
    const primaryCategory = scoredCategories[0]?.category || ENHANCED_MEDICAL_CATEGORIES[0];

    let questionResult = null;
    let uncertaintyAreas = null;

    // Step 4: Question selection (if requested and not emergency)
    if (includeQuestions && !emergencyAssessment.bypassProgressive) {
      questionResult = selectOptimalQuestions(primaryCategory, analysis, maxQuestions);
      uncertaintyAreas = identifyUncertaintyAreas(analysis, primaryCategory);
    }

    const processingTime = Date.now() - startTime;

    // Determine next recommended stage
    let nextStage = 'STAGE_2A_QUESTIONS';
    if (emergencyAssessment.immediateResponse) {
      nextStage = 'EMERGENCY_FAST_TRACK';
    } else if (emergencyAssessment.bypassProgressive) {
      nextStage = 'STAGE_3_FINAL';
    }

    return NextResponse.json({
      type: 'full_analysis',
      analysis,
      emergencyAssessment,
      classification: {
        primaryCategory,
        alternativeCategories: scoredCategories.slice(1, 3).map(sc => sc.category),
        categoryScores: scoredCategories,
        confidence: scoredCategories[0]?.score || 0
      },
      questions: questionResult?.questions || [],
      questionReasoning: questionResult?.reasoning || [],
      expectedInformationGain: questionResult?.expectedInformationGain || 0,
      uncertaintyAreas,
      nextStage,
      processingTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in full analysis:', error);
    throw error;
  }
}

/**
 * GET handler for classification info and categories
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'categories';

    switch (type) {
      case 'categories':
        return NextResponse.json({
          categories: ENHANCED_MEDICAL_CATEGORIES.map(cat => ({
            id: cat.id,
            name: cat.name,
            description: cat.description,
            priority: cat.priority,
            keywordCount: cat.keywords.length,
            questionCount: cat.questions?.length || 0
          })),
          totalCategories: ENHANCED_MEDICAL_CATEGORIES.length
        });

      case 'keywords':
        const categoryId = searchParams.get('categoryId');
        if (categoryId) {
          const category = ENHANCED_MEDICAL_CATEGORIES.find(cat => cat.id === categoryId);
          if (category) {
            return NextResponse.json({
              categoryId,
              categoryName: category.name,
              keywords: category.keywords
            });
          } else {
            return NextResponse.json(
              { error: 'دسته‌بندی یافت نشد' },
              { status: 404 }
            );
          }
        } else {
          // Return all keywords
          const allKeywords = ENHANCED_MEDICAL_CATEGORIES.reduce((acc, cat) => {
            acc[cat.id] = {
              name: cat.name,
              keywords: cat.keywords
            };
            return acc;
          }, {} as Record<string, any>);

          return NextResponse.json({ keywords: allKeywords });
        }

      case 'analysis_info':
        return NextResponse.json({
          analysisComponents: [
            'symptomKeywords',
            'clarityScore',
            'specificityScore',
            'urgencyIndicators',
            'timeframe',
            'severityLevel',
            'locationInfo',
            'associatedSymptoms',
            'patternInfo'
          ],
          emergencyLevels: ['low', 'medium', 'high', 'critical'],
          confidenceThresholds: {
            high: 75,
            medium: 50,
            low: 30
          }
        });

      default:
        return NextResponse.json({
          availableTypes: ['categories', 'keywords', 'analysis_info'],
          defaultType: 'categories'
        });
    }

  } catch (error) {
    console.error('Error in classification info:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات طبقه‌بندی' },
      { status: 500 }
    );
  }
}
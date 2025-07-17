/**
 * Hybrid Confidence System for 3-Stage Enhanced Conversation Flow
 * 
 * This module combines quick rule-based and AI-powered confidence assessments
 * for optimal accuracy and efficiency in medical consultation readiness evaluation.
 */

import { 
  ConfidenceAssessment, 
  InputAnalysis, 
  MedicalCategory,
  QuestionResponse 
} from '../types/conversation'
import { calculateQuickConfidence } from './confidenceAssessment'
import { SYSTEM_CONFIG } from './systemConfig'

// Hybrid confidence configuration
const HYBRID_CONFIG = {
  // Thresholds for when to use AI assessment
  AI_ASSESSMENT_RANGE: {
    MIN: 40,  // Below this, trust quick assessment (clearly insufficient)
    MAX: 75   // Above this, trust quick assessment (clearly sufficient)
  },
  
  // Weighting for hybrid score calculation
  WEIGHTS: {
    QUICK_ASSESSMENT: 0.6,  // 60% weight for quick assessment
    AI_ASSESSMENT: 0.4      // 40% weight for AI assessment
  },
  
  // Safety adjustments
  MEDICAL_SAFETY_FACTOR: 0.95,  // Slightly conservative for medical safety
  EMERGENCY_SAFETY_FACTOR: 0.90, // More conservative for emergency cases
  
  // Confidence boost/penalty factors
  CONSISTENCY_BOOST: 5,     // Boost when quick and AI agree
  DISAGREEMENT_PENALTY: 10, // Penalty when they disagree significantly
  
  // Quality thresholds
  HIGH_QUALITY_THRESHOLD: 80,
  MEDIUM_QUALITY_THRESHOLD: 60,
  LOW_QUALITY_THRESHOLD: 40
}

/**
 * Main function to calculate optimized confidence using hybrid approach
 */
export async function calculateOptimizedConfidence(
  answers: string[],
  category: MedicalCategory,
  initialAnalysis: InputAnalysis,
  questionResponses?: QuestionResponse[]
): Promise<ConfidenceAssessment> {
  const startTime = Date.now()
  
  try {
    // Step 1: Calculate quick confidence assessment
    const quickAssessment = calculateQuickConfidence(
      answers,
      category,
      initialAnalysis,
      questionResponses
    )
    
    // Step 2: Determine if AI assessment is needed
    const needsAIAssessment = shouldUseAIAssessment(
      quickAssessment.score,
      category,
      initialAnalysis
    )
    
    if (needsAIAssessment) {
      try {
        // Step 3: Get AI assessment
        const aiScore = await callAIConfidenceAssessment(
          answers,
          category,
          initialAnalysis,
          questionResponses
        )
        
        // Step 4: Combine assessments using hybrid logic
        const hybridResult = combineAssessments(
          quickAssessment,
          aiScore,
          category,
          initialAnalysis
        )
        
        const processingTime = Date.now() - startTime
        
        return {
          ...hybridResult,
          method: 'hybrid',
          quickAssessmentScore: quickAssessment.score,
          aiAssessmentScore: aiScore,
          processingTimeMs: processingTime,
          apiCallsUsed: 1,
          calculatedAt: new Date()
        }
        
      } catch (aiError) {
        console.log('AI confidence assessment failed, using quick assessment:', aiError)
        
        // Fallback to quick assessment with penalty for uncertainty
        const fallbackScore = Math.max(quickAssessment.score - 10, 20)
        
        return {
          ...quickAssessment,
          score: fallbackScore,
          method: 'quick',
          processingTimeMs: Date.now() - startTime,
          apiCallsUsed: 0,
          calculatedAt: new Date()
        }
      }
    }
    
    // Step 5: Use quick assessment for clear cases
    return {
      ...quickAssessment,
      method: 'quick',
      processingTimeMs: Date.now() - startTime,
      apiCallsUsed: 0,
      calculatedAt: new Date()
    }
    
  } catch (error) {
    console.error('Error in calculateOptimizedConfidence:', error)
    
    // Emergency fallback
    return createFallbackAssessment(answers, category, Date.now() - startTime)
  }
}

/**
 * Determine if AI assessment should be used based on quick assessment score
 */
function shouldUseAIAssessment(
  quickScore: number,
  category: MedicalCategory,
  analysis: InputAnalysis
): boolean {
  // Check if score is in uncertain range
  const inUncertainRange = quickScore >= HYBRID_CONFIG.AI_ASSESSMENT_RANGE.MIN && 
                          quickScore <= HYBRID_CONFIG.AI_ASSESSMENT_RANGE.MAX
  
  if (!inUncertainRange) {
    return false
  }
  
  // Additional factors that might warrant AI assessment
  const hasComplexSymptoms = analysis.symptomKeywords.length > 2
  const hasEmotionalIndicators = analysis.emotionalIndicators.length > 0
  const isChronicCondition = category.id === 'CHRONIC_DISEASE_MANAGEMENT'
  const isMentalHealth = category.id === 'MENTAL_HEALTH'
  
  // Use AI for complex cases even if outside normal range
  if ((hasComplexSymptoms || hasEmotionalIndicators || isChronicCondition || isMentalHealth) &&
      quickScore >= 35 && quickScore <= 85) {
    return true
  }
  
  return inUncertainRange
}

/**
 * Call AI confidence assessment API
 */
async function callAIConfidenceAssessment(
  answers: string[],
  category: MedicalCategory,
  initialAnalysis: InputAnalysis,
  questionResponses?: QuestionResponse[]
): Promise<number> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requestType: 'CONFIDENCE_ASSESSMENT',
      answers,
      category,
      initialAnalysis,
      questionResponses
    })
  })
  
  if (!response.ok) {
    throw new Error(`AI confidence assessment failed: ${response.status}`)
  }
  
  const data = await response.json()
  
  if (data.error) {
    throw new Error(data.error)
  }
  
  return data.aiScore || data.confidence || 50
}

/**
 * Combine quick and AI assessments using sophisticated hybrid logic
 */
function combineAssessments(
  quickAssessment: ConfidenceAssessment,
  aiScore: number,
  category: MedicalCategory,
  analysis: InputAnalysis
): ConfidenceAssessment {
  const quickScore = quickAssessment.score
  
  // Step 1: Calculate weighted average
  let hybridScore = (quickScore * HYBRID_CONFIG.WEIGHTS.QUICK_ASSESSMENT) + 
                   (aiScore * HYBRID_CONFIG.WEIGHTS.AI_ASSESSMENT)
  
  // Step 2: Apply consistency adjustments
  const scoreDifference = Math.abs(quickScore - aiScore)
  
  if (scoreDifference <= 10) {
    // Scores agree - boost confidence
    hybridScore += HYBRID_CONFIG.CONSISTENCY_BOOST
  } else if (scoreDifference >= 25) {
    // Significant disagreement - apply penalty
    hybridScore -= HYBRID_CONFIG.DISAGREEMENT_PENALTY
  }
  
  // Step 3: Apply category-specific adjustments
  hybridScore = applyCategoryAdjustments(hybridScore, category, analysis)
  
  // Step 4: Apply medical safety factor
  let safetyFactor = HYBRID_CONFIG.MEDICAL_SAFETY_FACTOR
  
  if (category.id === 'EMERGENCY_URGENT') {
    safetyFactor = HYBRID_CONFIG.EMERGENCY_SAFETY_FACTOR
  }
  
  hybridScore *= safetyFactor
  
  // Step 5: Ensure valid range
  const finalScore = Math.max(Math.min(Math.round(hybridScore), 100), 20)
  
  // Step 6: Update assessment properties
  return {
    ...quickAssessment,
    score: finalScore,
    hybridAdjustment: finalScore - quickScore,
    needsMoreQuestions: finalScore < SYSTEM_CONFIG.confidenceThresholds.medium,
    suggestedQuestionCount: getSuggestedQuestionCount(finalScore),
    targetedAreas: getTargetedAreas(finalScore, analysis)
  }
}

/**
 * Apply category-specific adjustments to hybrid score
 */
function applyCategoryAdjustments(
  score: number,
  category: MedicalCategory,
  analysis: InputAnalysis
): number {
  let adjustedScore = score
  
  switch (category.id) {
    case 'EMERGENCY_URGENT':
      // Emergency cases need higher confidence
      if (analysis.urgencyScore >= 80) {
        adjustedScore -= 15 // More conservative for very urgent cases
      } else if (analysis.urgencyScore >= 60) {
        adjustedScore -= 10
      }
      break
      
    case 'CHRONIC_DISEASE_MANAGEMENT':
      // Chronic conditions often have more context available
      if (analysis.hasPatternInfo && analysis.hasTimeInfo) {
        adjustedScore += 8
      }
      break
      
    case 'MEDICATION_INQUIRY':
      // Medication questions need specific drug information
      const hasDrugInfo = analysis.medicalTermsFound.some(term => 
        ['دارو', 'قرص', 'کپسول', 'شربت'].some(drug => term.includes(drug))
      )
      if (hasDrugInfo) {
        adjustedScore += 10
      } else {
        adjustedScore -= 15
      }
      break
      
    case 'MENTAL_HEALTH':
      // Mental health assessments benefit from emotional context
      if (analysis.emotionalIndicators.length > 0) {
        adjustedScore += 12
      }
      // But need careful evaluation
      if (analysis.urgencyScore >= 70) {
        adjustedScore -= 10 // Conservative for mental health emergencies
      }
      break
      
    case 'WOMEN_HEALTH':
      // Women's health often needs specific reproductive health context
      const hasReproductiveContext = analysis.medicalTermsFound.some(term =>
        ['قاعدگی', 'بارداری', 'یائسگی', 'هورمون'].some(repro => term.includes(repro))
      )
      if (hasReproductiveContext) {
        adjustedScore += 8
      }
      break
      
    case 'PREVENTIVE_CARE':
      // Preventive care can have lower thresholds
      adjustedScore += 12
      break
      
    default:
      // Standard symptom reporting
      if (analysis.hasAssociatedSymptoms && analysis.hasSeverityInfo && analysis.hasTimeInfo) {
        adjustedScore += 5 // Bonus for complete basic information
      }
      break
  }
  
  return adjustedScore
}

/**
 * Get suggested question count based on hybrid confidence score
 */
function getSuggestedQuestionCount(score: number): number {
  if (score >= HYBRID_CONFIG.HIGH_QUALITY_THRESHOLD) {
    return 0 // No additional questions needed
  } else if (score >= HYBRID_CONFIG.MEDIUM_QUALITY_THRESHOLD) {
    return 1 // One clarifying question
  } else if (score >= HYBRID_CONFIG.LOW_QUALITY_THRESHOLD) {
    return 2 // Two additional questions
  } else {
    return Math.min(3, SYSTEM_CONFIG.maxQuestions.progressive) // Up to 3 questions for very low confidence
  }
}

/**
 * Get targeted areas based on confidence score and analysis
 */
function getTargetedAreas(score: number, analysis: InputAnalysis): string[] {
  const areas: string[] = []
  
  if (score < HYBRID_CONFIG.MEDIUM_QUALITY_THRESHOLD) {
    // Identify specific areas that need improvement
    if (!analysis.hasSeverityInfo || (analysis.hasSeverityInfo && !analysis.severityLevel)) {
      areas.push('severity_clarification')
    }
    
    if (!analysis.hasTimeInfo || (analysis.hasTimeInfo && !analysis.timeframe)) {
      areas.push('time_clarification')
    }
    
    if (!analysis.hasAssociatedSymptoms) {
      areas.push('associated_symptoms')
    }
    
    if (!analysis.hasPatternInfo) {
      areas.push('pattern_clarification')
    }
    
    if (analysis.clarityScore < 60) {
      areas.push('general_clarification')
    }
  }
  
  return areas
}

/**
 * Create fallback assessment when all else fails
 */
function createFallbackAssessment(
  answers: string[],
  category: MedicalCategory,
  processingTime: number
): ConfidenceAssessment {
  // Very conservative fallback
  const fallbackScore = Math.max(SYSTEM_CONFIG.medicalSafetyBaseline - 20, 20)
  
  return {
    score: fallbackScore,
    method: 'fallback',
    quickAssessmentScore: fallbackScore,
    informationCompleteness: 30,
    responseQuality: 40,
    medicalSafetyFactor: SYSTEM_CONFIG.medicalSafetyBaseline,
    uncertaintyPenalty: 30,
    calculatedAt: new Date(),
    processingTimeMs: processingTime,
    apiCallsUsed: 0,
    needsMoreQuestions: true,
    suggestedQuestionCount: SYSTEM_CONFIG.maxQuestions.progressive,
    targetedAreas: ['severity_clarification', 'time_clarification', 'associated_symptoms']
  }
}

/**
 * Validate confidence assessment result
 */
export function validateConfidenceAssessment(assessment: ConfidenceAssessment): boolean {
  // Check required fields
  if (!assessment.score || !assessment.method || !assessment.calculatedAt) {
    return false
  }
  
  // Check score range
  if (assessment.score < 0 || assessment.score > 100) {
    return false
  }
  
  // Check method validity
  const validMethods = ['quick', 'ai', 'hybrid', 'fallback', 'quick_fallback']
  if (!validMethods.includes(assessment.method)) {
    return false
  }
  
  // Check consistency
  if (assessment.method === 'hybrid' && !assessment.aiAssessmentScore) {
    return false
  }
  
  return true
}

/**
 * Get confidence level description in Persian
 */
export function getConfidenceLevelDescription(score: number): string {
  if (score >= 90) {
    return 'اطمینان بسیار بالا - اطلاعات کامل و دقیق'
  } else if (score >= 80) {
    return 'اطمینان بالا - اطلاعات کافی برای مشاوره'
  } else if (score >= 70) {
    return 'اطمینان خوب - ممکن است یک سوال اضافی مفید باشد'
  } else if (score >= 60) {
    return 'اطمینان متوسط - چند سوال تکمیلی توصیه می‌شود'
  } else if (score >= 40) {
    return 'اطمینان پایین - نیاز به اطلاعات بیشتر'
  } else {
    return 'اطمینان بسیار پایین - اطلاعات ناکافی'
  }
}

/**
 * Calculate confidence trend based on question responses
 */
export function calculateConfidenceTrend(
  assessments: ConfidenceAssessment[]
): {
  trend: 'improving' | 'stable' | 'declining'
  improvement: number
  recommendation: string
} {
  if (assessments.length < 2) {
    return {
      trend: 'stable',
      improvement: 0,
      recommendation: 'نیاز به اطلاعات بیشتر برای ارزیابی روند'
    }
  }
  
  const latest = assessments[assessments.length - 1]
  const previous = assessments[assessments.length - 2]
  const improvement = latest.score - previous.score
  
  let trend: 'improving' | 'stable' | 'declining'
  let recommendation: string
  
  if (improvement > 5) {
    trend = 'improving'
    recommendation = 'اطلاعات در حال بهبود است، ادامه دهید'
  } else if (improvement < -5) {
    trend = 'declining'
    recommendation = 'نیاز به روشن‌سازی اطلاعات قبلی'
  } else {
    trend = 'stable'
    recommendation = 'اطلاعات ثابت است، ممکن است نیاز به رویکرد متفاوت باشد'
  }
  
  return { trend, improvement, recommendation }
}

export default {
  calculateOptimizedConfidence,
  validateConfidenceAssessment,
  getConfidenceLevelDescription,
  calculateConfidenceTrend
}
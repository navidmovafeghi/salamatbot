/**
 * Confidence Assessment Engine for 3-Stage Enhanced Conversation Flow
 * 
 * This module implements both quick rule-based and AI-powered confidence assessment
 * to determine information completeness and medical consultation readiness.
 */

import { 
  ConfidenceAssessment, 
  InputAnalysis, 
  MedicalCategory,
  QuestionResponse,
  UncertaintyArea 
} from '../types/conversation'
import { SYSTEM_CONFIG } from './systemConfig'

// Confidence scoring weights for different factors
const CONFIDENCE_WEIGHTS = {
  // Information completeness factors
  SEVERITY_INFO: 20,           // Has severity information
  TIMING_INFO: 20,             // Has timing information  
  LOCATION_INFO: 15,           // Has location information
  SYMPTOMS_INFO: 15,           // Has associated symptoms
  PATTERN_INFO: 10,            // Has pattern information
  
  // Response quality factors
  RESPONSE_LENGTH: 15,         // Average response length
  RESPONSE_CLARITY: 10,        // Clarity of responses
  SPECIFICITY: 15,             // Specificity of information
  
  // Medical safety factors
  UNCERTAINTY_PENALTY: -25,    // Penalty for uncertain responses
  EMERGENCY_PENALTY: -20,      // Higher threshold for emergencies
  VAGUE_PENALTY: -15,          // Penalty for vague responses
  
  // Bonus factors
  MEDICAL_TERMS_BONUS: 10,     // Uses medical terminology
  DETAILED_RESPONSE_BONUS: 15, // Detailed responses
  CONSISTENCY_BONUS: 10        // Consistent information
}

// Quality thresholds for assessment
const QUALITY_THRESHOLDS = {
  EXCELLENT_RESPONSE_LENGTH: 30,
  GOOD_RESPONSE_LENGTH: 15,
  POOR_RESPONSE_LENGTH: 5,
  
  HIGH_CLARITY_SCORE: 80,
  MEDIUM_CLARITY_SCORE: 60,
  LOW_CLARITY_SCORE: 40,
  
  HIGH_SPECIFICITY: 80,
  MEDIUM_SPECIFICITY: 60,
  LOW_SPECIFICITY: 40
}

/**
 * Calculate quick confidence score using rule-based assessment
 * This is fast and doesn't require API calls
 */
export function calculateQuickConfidence(
  answers: string[],
  category: MedicalCategory,
  initialAnalysis: InputAnalysis,
  questionResponses?: QuestionResponse[]
): ConfidenceAssessment {
  const startTime = Date.now()
  
  // Start with medical safety baseline (higher than general chatbots)
  let confidence = SYSTEM_CONFIG.medicalSafetyBaseline
  
  // Factor 1: Information Completeness Assessment
  const completenessScore = assessInformationCompleteness(initialAnalysis, questionResponses)
  confidence += (completenessScore / 100) * 30
  
  // Factor 2: Response Quality Assessment
  const qualityScore = assessResponseQuality(answers, questionResponses)
  confidence += (qualityScore / 100) * 25
  
  // Factor 3: Medical Context Assessment
  const medicalContextScore = assessMedicalContext(initialAnalysis, category)
  confidence += (medicalContextScore / 100) * 20
  
  // Factor 4: Uncertainty and Risk Assessment
  const uncertaintyPenalty = assessUncertaintyPenalty(answers, questionResponses)
  confidence -= uncertaintyPenalty
  
  // Factor 5: Category-specific Adjustments
  const categoryAdjustment = getCategorySpecificAdjustment(category, initialAnalysis)
  confidence += categoryAdjustment
  
  // Factor 6: Consistency Check
  const consistencyBonus = assessConsistency(answers, initialAnalysis)
  confidence += consistencyBonus
  
  // Ensure confidence is within valid range
  const finalScore = Math.max(Math.min(confidence, 100), 20)
  
  const processingTime = Date.now() - startTime
  
  return {
    score: finalScore,
    method: 'quick',
    quickAssessmentScore: finalScore,
    informationCompleteness: completenessScore,
    responseQuality: qualityScore,
    medicalSafetyFactor: SYSTEM_CONFIG.medicalSafetyBaseline,
    uncertaintyPenalty,
    calculatedAt: new Date(),
    processingTimeMs: processingTime,
    apiCallsUsed: 0,
    needsMoreQuestions: finalScore < SYSTEM_CONFIG.confidenceThresholds.medium,
    suggestedQuestionCount: getSuggestedQuestionCount(finalScore),
    targetedAreas: getTargetedAreasFromScore(finalScore, initialAnalysis)
  }
}

/**
 * Assess information completeness based on available data
 */
function assessInformationCompleteness(
  analysis: InputAnalysis,
  questionResponses?: QuestionResponse[]
): number {
  let completeness = 0
  
  // Core medical information
  if (analysis.hasSeverityInfo) {
    completeness += CONFIDENCE_WEIGHTS.SEVERITY_INFO
    if (analysis.severityLevel) completeness += 5 // Bonus for specific severity
  }
  
  if (analysis.hasTimeInfo) {
    completeness += CONFIDENCE_WEIGHTS.TIMING_INFO
    if (analysis.timeframe) completeness += 5 // Bonus for specific timeframe
  }
  
  if (analysis.hasLocationInfo) {
    completeness += CONFIDENCE_WEIGHTS.LOCATION_INFO
  }
  
  if (analysis.hasAssociatedSymptoms) {
    completeness += CONFIDENCE_WEIGHTS.SYMPTOMS_INFO
    if (analysis.symptomKeywords.length > 1) completeness += 5 // Multiple symptoms
  }
  
  if (analysis.hasPatternInfo) {
    completeness += CONFIDENCE_WEIGHTS.PATTERN_INFO
  }
  
  // Question response completeness
  if (questionResponses && questionResponses.length > 0) {
    const responseCompleteness = assessQuestionResponseCompleteness(questionResponses)
    completeness += responseCompleteness
  }
  
  return Math.min(completeness, 100)
}

/**
 * Assess quality of responses provided
 */
function assessResponseQuality(
  answers: string[],
  questionResponses?: QuestionResponse[]
): number {
  if (answers.length === 0) return 0
  
  let qualityScore = 50 // Base quality score
  
  // Average response length assessment
  const avgLength = answers.reduce((sum, answer) => sum + answer.length, 0) / answers.length
  
  if (avgLength >= QUALITY_THRESHOLDS.EXCELLENT_RESPONSE_LENGTH) {
    qualityScore += CONFIDENCE_WEIGHTS.RESPONSE_LENGTH
  } else if (avgLength >= QUALITY_THRESHOLDS.GOOD_RESPONSE_LENGTH) {
    qualityScore += CONFIDENCE_WEIGHTS.RESPONSE_LENGTH * 0.7
  } else if (avgLength < QUALITY_THRESHOLDS.POOR_RESPONSE_LENGTH) {
    qualityScore -= CONFIDENCE_WEIGHTS.RESPONSE_LENGTH
  }
  
  // Response clarity assessment
  const clarityScore = assessResponseClarity(answers)
  if (clarityScore >= QUALITY_THRESHOLDS.HIGH_CLARITY_SCORE) {
    qualityScore += CONFIDENCE_WEIGHTS.RESPONSE_CLARITY
  } else if (clarityScore < QUALITY_THRESHOLDS.LOW_CLARITY_SCORE) {
    qualityScore -= CONFIDENCE_WEIGHTS.RESPONSE_CLARITY * 0.5
  }
  
  // Specificity assessment
  const specificityScore = assessResponseSpecificity(answers)
  qualityScore += (specificityScore / 100) * CONFIDENCE_WEIGHTS.SPECIFICITY
  
  // Medical terminology usage
  const medicalTermsUsed = countMedicalTerms(answers)
  if (medicalTermsUsed > 0) {
    qualityScore += Math.min(medicalTermsUsed * 2, CONFIDENCE_WEIGHTS.MEDICAL_TERMS_BONUS)
  }
  
  return Math.max(Math.min(qualityScore, 100), 0)
}

/**
 * Assess medical context and relevance
 */
function assessMedicalContext(analysis: InputAnalysis, category: MedicalCategory): number {
  let contextScore = 50 // Base score
  
  // Urgency context
  if (analysis.isUrgent) {
    contextScore += 20 // Urgent cases get priority
    if (analysis.urgencyScore >= 70) {
      contextScore += 10 // Very urgent cases
    }
  }
  
  // Medical terms and keywords
  if (analysis.medicalTermsFound.length > 0) {
    contextScore += Math.min(analysis.medicalTermsFound.length * 5, 20)
  }
  
  // Symptom specificity
  if (analysis.symptomKeywords.length > 0) {
    contextScore += Math.min(analysis.symptomKeywords.length * 3, 15)
  }
  
  // Category relevance
  if (category && category.primaryKeywords.length > 0) {
    contextScore += 10 // Proper categorization bonus
  }
  
  return Math.max(Math.min(contextScore, 100), 0)
}

/**
 * Assess uncertainty penalty based on vague or uncertain responses
 */
function assessUncertaintyPenalty(
  answers: string[],
  questionResponses?: QuestionResponse[]
): number {
  let penalty = 0
  
  // Check for uncertainty indicators in answers
  const uncertaintyKeywords = ['نمی‌دانم', 'مطمئن نیستم', 'شاید', 'احتمالاً', 'فکر می‌کنم']
  
  answers.forEach(answer => {
    const lowerAnswer = answer.toLowerCase()
    uncertaintyKeywords.forEach(keyword => {
      if (lowerAnswer.includes(keyword)) {
        penalty += CONFIDENCE_WEIGHTS.UNCERTAINTY_PENALTY / answers.length
      }
    })
  })
  
  // Check for vague responses
  const vagueResponses = answers.filter(answer => 
    answer.length < QUALITY_THRESHOLDS.POOR_RESPONSE_LENGTH ||
    /خیلی|کمی|گاهی|بعضی وقت‌ها/.test(answer.toLowerCase())
  )
  
  if (vagueResponses.length > 0) {
    penalty += (vagueResponses.length / answers.length) * Math.abs(CONFIDENCE_WEIGHTS.VAGUE_PENALTY)
  }
  
  // Question response uncertainty
  if (questionResponses) {
    const uncertainResponses = questionResponses.filter(qr => qr.containsUncertainty)
    if (uncertainResponses.length > 0) {
      penalty += (uncertainResponses.length / questionResponses.length) * 15
    }
  }
  
  return Math.max(penalty, 0)
}

/**
 * Get category-specific confidence adjustments
 */
function getCategorySpecificAdjustment(
  category: MedicalCategory,
  analysis: InputAnalysis
): number {
  let adjustment = 0
  
  switch (category.id) {
    case 'EMERGENCY_URGENT':
      // Emergency cases need higher confidence threshold
      adjustment += CONFIDENCE_WEIGHTS.EMERGENCY_PENALTY
      if (analysis.urgencyScore >= 80) {
        adjustment -= 10 // Additional penalty for very urgent cases
      }
      break
      
    case 'CHRONIC_DISEASE_MANAGEMENT':
      // Chronic conditions often have more context
      if (analysis.hasPatternInfo) {
        adjustment += 10
      }
      break
      
    case 'MEDICATION_INQUIRY':
      // Medication questions need specific information
      if (analysis.medicalTermsFound.some(term => 
        ['دارو', 'قرص', 'کپسول'].some(med => term.includes(med))
      )) {
        adjustment += 15
      }
      break
      
    case 'PREVENTIVE_CARE':
      // Preventive care can have lower threshold
      adjustment += 10
      break
      
    case 'MENTAL_HEALTH':
      // Mental health needs careful assessment
      if (analysis.emotionalIndicators.length > 0) {
        adjustment += 10
      }
      break
      
    default:
      // Standard symptom reporting
      if (analysis.hasAssociatedSymptoms && analysis.hasSeverityInfo) {
        adjustment += 5
      }
      break
  }
  
  return adjustment
}

/**
 * Assess consistency between initial analysis and responses
 */
function assessConsistency(answers: string[], analysis: InputAnalysis): number {
  let consistencyBonus = 0
  
  // Check if responses are consistent with initial analysis
  const combinedText = answers.join(' ').toLowerCase()
  
  // Severity consistency
  if (analysis.hasSeverityInfo) {
    const severityMentioned = /شدید|خفیف|متوسط|[0-9۰-۹]/.test(combinedText)
    if (severityMentioned) {
      consistencyBonus += 3
    }
  }
  
  // Time consistency
  if (analysis.hasTimeInfo) {
    const timeMentioned = /ساعت|روز|هفته|ماه|صبح|شب/.test(combinedText)
    if (timeMentioned) {
      consistencyBonus += 3
    }
  }
  
  // Symptom consistency
  if (analysis.symptomKeywords.length > 0) {
    const symptomsConsistent = analysis.symptomKeywords.some(symptom =>
      combinedText.includes(symptom.toLowerCase())
    )
    if (symptomsConsistent) {
      consistencyBonus += 4
    }
  }
  
  return Math.min(consistencyBonus, CONFIDENCE_WEIGHTS.CONSISTENCY_BONUS)
}

/**
 * Assess completeness of question responses
 */
function assessQuestionResponseCompleteness(responses: QuestionResponse[]): number {
  if (responses.length === 0) return 0
  
  let completeness = 0
  
  // Response coverage
  const responseTypes = new Set(responses.map(r => r.questionId.split('_')[0]))
  completeness += Math.min(responseTypes.size * 5, 20)
  
  // Response quality
  const avgInformationValue = responses.reduce((sum, r) => sum + r.informationValue, 0) / responses.length
  completeness += (avgInformationValue / 100) * 15
  
  // Response clarity
  const avgClarity = responses.reduce((sum, r) => sum + r.clarityScore, 0) / responses.length
  completeness += (avgClarity / 100) * 10
  
  return Math.min(completeness, 35) // Max 35 points from question responses
}

/**
 * Assess clarity of responses
 */
function assessResponseClarity(answers: string[]): number {
  let totalClarity = 0
  
  answers.forEach(answer => {
    let clarity = 70 // Base clarity
    
    // Length factors
    if (answer.length > 10 && answer.length < 200) {
      clarity += 20
    } else if (answer.length < 5) {
      clarity -= 30
    }
    
    // Uncertainty indicators
    if (/نمی‌دانم|مطمئن نیستم/.test(answer.toLowerCase())) {
      clarity -= 25
    }
    
    // Specificity indicators
    if (/[0-9۰-۹]/.test(answer)) {
      clarity += 15 // Contains numbers
    }
    
    if (/شدید|خفیف|متوسط/.test(answer.toLowerCase())) {
      clarity += 10 // Contains severity descriptors
    }
    
    totalClarity += Math.max(Math.min(clarity, 100), 0)
  })
  
  return answers.length > 0 ? totalClarity / answers.length : 0
}

/**
 * Assess specificity of responses
 */
function assessResponseSpecificity(answers: string[]): number {
  let totalSpecificity = 0
  
  answers.forEach(answer => {
    let specificity = 50 // Base specificity
    
    // Specific medical terms
    const medicalTerms = ['درد', 'تب', 'سردرد', 'شکم', 'قفسه سینه', 'تنگی نفس']
    medicalTerms.forEach(term => {
      if (answer.toLowerCase().includes(term)) {
        specificity += 5
      }
    })
    
    // Time specificity
    if (/\d+\s*(ساعت|روز|هفته|ماه)/.test(answer)) {
      specificity += 15
    }
    
    // Location specificity
    if (/راست|چپ|بالا|پایین|وسط/.test(answer.toLowerCase())) {
      specificity += 10
    }
    
    // Severity specificity
    if (/[0-9۰-۹]\s*از\s*[0-9۰-۹]/.test(answer)) {
      specificity += 20 // Numerical scale
    }
    
    totalSpecificity += Math.max(Math.min(specificity, 100), 0)
  })
  
  return answers.length > 0 ? totalSpecificity / answers.length : 0
}

/**
 * Count medical terms in responses
 */
function countMedicalTerms(answers: string[]): number {
  const medicalTerms = [
    'درد', 'تب', 'سردرد', 'شکم درد', 'تنگی نفس', 'تپش قلب',
    'سرگیجه', 'تهوع', 'استفراغ', 'اسهال', 'یبوست', 'خستگی',
    'ضعف', 'بی‌حالی', 'لرز', 'عرق', 'خونریزی', 'ورم'
  ]
  
  let count = 0
  const combinedText = answers.join(' ').toLowerCase()
  
  medicalTerms.forEach(term => {
    if (combinedText.includes(term)) {
      count++
    }
  })
  
  return count
}

/**
 * Get suggested question count based on confidence score
 */
function getSuggestedQuestionCount(confidence: number): number {
  if (confidence < SYSTEM_CONFIG.confidenceThresholds.low) {
    return SYSTEM_CONFIG.maxQuestions.progressive
  } else if (confidence < SYSTEM_CONFIG.confidenceThresholds.medium) {
    return 1
  }
  return 0
}

/**
 * Get targeted areas that need improvement based on confidence score
 */
function getTargetedAreasFromScore(
  confidence: number,
  analysis: InputAnalysis
): UncertaintyArea[] {
  const areas: UncertaintyArea[] = []
  
  if (confidence < SYSTEM_CONFIG.confidenceThresholds.medium) {
    if (!analysis.hasSeverityInfo) {
      areas.push('severity_clarification')
    }
    if (!analysis.hasTimeInfo) {
      areas.push('time_clarification')
    }
    if (!analysis.hasAssociatedSymptoms) {
      areas.push('associated_symptoms')
    }
    if (!analysis.hasPatternInfo) {
      areas.push('pattern_clarification')
    }
  }
  
  return areas
}

/**
 * Generate confidence assessment summary
 */
export function generateConfidenceSummary(assessment: ConfidenceAssessment): string {
  const score = assessment.score
  let summary = ''
  
  if (score >= 80) {
    summary = 'اطلاعات کافی و با کیفیت جمع‌آوری شده است'
  } else if (score >= 60) {
    summary = 'اطلاعات خوبی جمع‌آوری شده، ممکن است یک سوال اضافی مفید باشد'
  } else if (score >= 40) {
    summary = 'اطلاعات متوسط، نیاز به چند سوال تکمیلی'
  } else {
    summary = 'اطلاعات ناکافی، نیاز به سوالات بیشتر'
  }
  
  if (assessment.needsMoreQuestions) {
    summary += ` (${assessment.suggestedQuestionCount} سوال پیشنهادی)`
  }
  
  return summary
}

/**
 * Check if confidence is sufficient for medical advice
 */
export function isSufficientForMedicalAdvice(
  assessment: ConfidenceAssessment,
  category: MedicalCategory
): boolean {
  const threshold = category.confidenceThreshold || SYSTEM_CONFIG.confidenceThresholds.medium
  
  // Emergency cases need higher confidence
  if (category.id === 'EMERGENCY_URGENT') {
    return assessment.score >= Math.max(threshold, 75)
  }
  
  // Medication inquiries need specific information
  if (category.id === 'MEDICATION_INQUIRY') {
    return assessment.score >= Math.max(threshold, 70)
  }
  
  // General threshold
  return assessment.score >= threshold
}

export default {
  calculateQuickConfidence,
  generateConfidenceSummary,
  isSufficientForMedicalAdvice
}
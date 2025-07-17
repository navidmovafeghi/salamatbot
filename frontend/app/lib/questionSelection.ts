/**
 * Question Selection Engine for 3-Stage Enhanced Conversation Flow
 * 
 * This module implements intelligent question selection based on input analysis,
 * medical categories, and missing information to optimize conversation efficiency.
 */

import { 
  CategoryQuestion, 
  InputAnalysis, 
  MedicalCategory, 
  UncertaintyArea,
  ProgressiveQuestionSelection 
} from '../types/conversation'
import { ENHANCED_MEDICAL_CATEGORIES, getCategoryQuestions } from './medicalCategories'
import { SYSTEM_CONFIG } from './systemConfig'

// Question scoring weights for different factors
const SCORING_WEIGHTS = {
  MISSING_INFO: 40,        // High priority for missing critical information
  URGENCY_RELEVANCE: 30,   // Important for urgent cases
  INFORMATION_VALUE: 20,   // General information value
  CATEGORY_PRIORITY: 10,   // Category-specific priority
  REDUNDANCY_PENALTY: -50, // Heavy penalty for redundant questions
  UNCERTAINTY_BONUS: 25    // Bonus for addressing uncertainty areas
}

// Information completeness thresholds
const COMPLETENESS_THRESHOLDS = {
  SEVERITY: 25,
  TIMING: 25,
  LOCATION: 20,
  SYMPTOMS: 20,
  PATTERN: 10
}

/**
 * Main function to select optimal questions based on input analysis and category
 */
export function selectOptimalQuestions(
  category: MedicalCategory,
  initialAnalysis: InputAnalysis,
  maxQuestions: number = SYSTEM_CONFIG.maxQuestions.smart
): {
  questions: CategoryQuestion[]
  uncertaintyAreas: UncertaintyArea[]
  reasoning: string[]
  expectedInformationGain: number
} {
  // Get available questions for the category
  const availableQuestions = getCategoryQuestions(category, 'smart', initialAnalysis)
  
  // Score each question based on current information gaps
  const scoredQuestions = scoreQuestions(availableQuestions, initialAnalysis, category)
  
  // Identify uncertainty areas for progressive questioning
  const uncertaintyAreas = identifyUncertaintyAreas(initialAnalysis, category)
  
  // Select top questions avoiding redundancy
  const selectedQuestions = selectTopQuestions(scoredQuestions, maxQuestions, initialAnalysis)
  
  // Generate reasoning for the selection
  const reasoning = generateSelectionReasoning(selectedQuestions, initialAnalysis, uncertaintyAreas)
  
  // Calculate expected information gain
  const expectedInformationGain = calculateExpectedInformationGain(selectedQuestions, initialAnalysis)
  
  return {
    questions: selectedQuestions.map(sq => sq.question),
    uncertaintyAreas,
    reasoning,
    expectedInformationGain
  }
}

/**
 * Score questions based on missing information and relevance
 */
function scoreQuestions(
  questions: CategoryQuestion[],
  analysis: InputAnalysis,
  category: MedicalCategory
): Array<{ question: CategoryQuestion; score: number; factors: string[] }> {
  return questions.map(question => {
    let score = question.priority // Base score from question priority
    const factors: string[] = []
    
    // Factor 1: Missing Information Bonus
    const missingInfoBonus = calculateMissingInfoBonus(question, analysis)
    score += missingInfoBonus
    if (missingInfoBonus > 0) {
      factors.push(`Missing info bonus: +${missingInfoBonus}`)
    }
    
    // Factor 2: Urgency Relevance
    if (analysis.isUrgent) {
      const urgencyBonus = (question.urgencyRelevance / 100) * SCORING_WEIGHTS.URGENCY_RELEVANCE
      score += urgencyBonus
      factors.push(`Urgency relevance: +${urgencyBonus.toFixed(1)}`)
    }
    
    // Factor 3: Information Value
    const infoValue = (question.informationValue / 100) * SCORING_WEIGHTS.INFORMATION_VALUE
    score += infoValue
    factors.push(`Information value: +${infoValue.toFixed(1)}`)
    
    // Factor 4: Category Priority
    const categoryBonus = (category.priority / 100) * SCORING_WEIGHTS.CATEGORY_PRIORITY
    score += categoryBonus
    factors.push(`Category priority: +${categoryBonus.toFixed(1)}`)
    
    // Factor 5: Redundancy Penalty
    const redundancyPenalty = calculateRedundancyPenalty(question, analysis)
    score += redundancyPenalty
    if (redundancyPenalty < 0) {
      factors.push(`Redundancy penalty: ${redundancyPenalty}`)
    }
    
    // Factor 6: Uncertainty Area Bonus
    const uncertaintyBonus = calculateUncertaintyBonus(question, analysis)
    score += uncertaintyBonus
    if (uncertaintyBonus > 0) {
      factors.push(`Uncertainty bonus: +${uncertaintyBonus}`)
    }
    
    // Factor 7: Emergency Context Adjustment
    if (category.id === 'EMERGENCY_URGENT') {
      score += 20
      factors.push('Emergency context: +20')
    }
    
    return {
      question,
      score: Math.max(score, 0), // Ensure non-negative score
      factors
    }
  })
}

/**
 * Calculate bonus for addressing missing information
 */
function calculateMissingInfoBonus(question: CategoryQuestion, analysis: InputAnalysis): number {
  let bonus = 0
  
  switch (question.type) {
    case 'severity':
      if (!analysis.hasSeverityInfo) {
        bonus = SCORING_WEIGHTS.MISSING_INFO
      }
      break
      
    case 'timing':
      if (!analysis.hasTimeInfo) {
        bonus = SCORING_WEIGHTS.MISSING_INFO
      }
      break
      
    case 'location':
      if (!analysis.hasLocationInfo) {
        bonus = SCORING_WEIGHTS.MISSING_INFO * 0.8 // Slightly lower priority
      }
      break
      
    case 'associated_symptoms':
      if (!analysis.hasAssociatedSymptoms) {
        bonus = SCORING_WEIGHTS.MISSING_INFO * 0.9
      }
      break
      
    case 'pattern':
      if (!analysis.hasPatternInfo) {
        bonus = SCORING_WEIGHTS.MISSING_INFO * 0.7
      }
      break
      
    case 'medical_history':
    case 'medications':
      // Always valuable for comprehensive assessment
      bonus = SCORING_WEIGHTS.MISSING_INFO * 0.6
      break
      
    case 'clarification':
      // Valuable when clarity is low
      if (analysis.clarityScore < 60) {
        bonus = SCORING_WEIGHTS.MISSING_INFO * 0.8
      }
      break
  }
  
  return bonus
}

/**
 * Calculate penalty for redundant questions
 */
function calculateRedundancyPenalty(question: CategoryQuestion, analysis: InputAnalysis): number {
  let penalty = 0
  
  switch (question.type) {
    case 'severity':
      if (analysis.hasSeverityInfo && analysis.severityLevel) {
        penalty = SCORING_WEIGHTS.REDUNDANCY_PENALTY
      }
      break
      
    case 'timing':
      if (analysis.hasTimeInfo && analysis.timeframe) {
        penalty = SCORING_WEIGHTS.REDUNDANCY_PENALTY
      }
      break
      
    case 'location':
      if (analysis.hasLocationInfo) {
        penalty = SCORING_WEIGHTS.REDUNDANCY_PENALTY * 0.8
      }
      break
      
    case 'associated_symptoms':
      if (analysis.hasAssociatedSymptoms && analysis.symptomKeywords.length > 2) {
        penalty = SCORING_WEIGHTS.REDUNDANCY_PENALTY * 0.7
      }
      break
      
    case 'pattern':
      if (analysis.hasPatternInfo) {
        penalty = SCORING_WEIGHTS.REDUNDANCY_PENALTY * 0.6
      }
      break
  }
  
  return penalty
}

/**
 * Calculate bonus for addressing uncertainty areas
 */
function calculateUncertaintyBonus(question: CategoryQuestion, analysis: InputAnalysis): number {
  let bonus = 0
  
  // Check if question addresses identified uncertainty areas
  if (question.targetedAreas.includes('severity_clarification') && 
      analysis.hasSeverityInfo && !analysis.severityLevel) {
    bonus += SCORING_WEIGHTS.UNCERTAINTY_BONUS
  }
  
  if (question.targetedAreas.includes('time_clarification') && 
      analysis.hasTimeInfo && !analysis.timeframe) {
    bonus += SCORING_WEIGHTS.UNCERTAINTY_BONUS
  }
  
  if (question.targetedAreas.includes('associated_symptoms') && 
      analysis.symptomKeywords.length === 0) {
    bonus += SCORING_WEIGHTS.UNCERTAINTY_BONUS
  }
  
  // Bonus for low clarity or specificity scores
  if (analysis.clarityScore < 50 && question.type === 'clarification') {
    bonus += SCORING_WEIGHTS.UNCERTAINTY_BONUS * 0.8
  }
  
  if (analysis.specificityScore < 40 && question.informationValue > 80) {
    bonus += SCORING_WEIGHTS.UNCERTAINTY_BONUS * 0.6
  }
  
  return bonus
}

/**
 * Select top questions while avoiding redundancy
 */
function selectTopQuestions(
  scoredQuestions: Array<{ question: CategoryQuestion; score: number; factors: string[] }>,
  maxQuestions: number,
  analysis: InputAnalysis
): Array<{ question: CategoryQuestion; score: number; factors: string[] }> {
  // Sort by score (descending)
  const sortedQuestions = [...scoredQuestions].sort((a, b) => b.score - a.score)
  
  const selectedQuestions: Array<{ question: CategoryQuestion; score: number; factors: string[] }> = []
  const usedTypes = new Set<string>()
  
  for (const scoredQuestion of sortedQuestions) {
    if (selectedQuestions.length >= maxQuestions) break
    
    const question = scoredQuestion.question
    
    // Skip if we already have a question of this type (avoid redundancy)
    if (usedTypes.has(question.type) && question.type !== 'clarification') {
      continue
    }
    
    // Skip if question score is too low
    if (scoredQuestion.score < 20) {
      continue
    }
    
    // Skip if question is not required and we have enough information
    if (!question.isRequired && selectedQuestions.length >= 1 && analysis.specificityScore > 70) {
      continue
    }
    
    selectedQuestions.push(scoredQuestion)
    usedTypes.add(question.type)
  }
  
  // Ensure we have at least one question if available
  if (selectedQuestions.length === 0 && sortedQuestions.length > 0) {
    selectedQuestions.push(sortedQuestions[0])
  }
  
  return selectedQuestions
}

/**
 * Enhanced uncertainty area identification with priority mapping
 */
export function identifyUncertaintyAreas(
  analysis: InputAnalysis,
  category: MedicalCategory
): UncertaintyArea[] {
  const uncertainAreas: UncertaintyArea[] = []
  
  // Priority weights for different uncertainty types
  const priorityWeights = {
    severity: 0.3,
    timing: 0.25,
    location: 0.2,
    symptoms: 0.15,
    context: 0.1
  }
  
  // Severity mentioned but vague
  if (analysis.hasSeverityInfo && !analysis.severityLevel) {
    uncertainAreas.push({
      area: 'severity',
      type: 'severity_clarification',
      priority: priorityWeights.severity * (1 - (analysis.specificityScore / 100)),
      confidenceScore: analysis.specificityScore / 100,
      specificConcerns: ['شدت علائم نامشخص'],
      suggestedQuestions: ['لطفاً شدت دقیق درد یا ناراحتی را از ۱ تا ۱۰ بیان کنید']
    })
  }
  
  // Time mentioned but vague
  if (analysis.hasTimeInfo && !analysis.timeframe) {
    uncertainAreas.push({
      area: 'duration',
      type: 'time_clarification',
      priority: priorityWeights.timing * (1 - (analysis.clarityScore / 100)),
      confidenceScore: analysis.clarityScore / 100,
      specificConcerns: ['زمان شروع نامشخص'],
      suggestedQuestions: ['دقیقاً از چه زمانی این علائم شروع شده است؟']
    })
  }
  
  // Location mentioned but unclear
  if (analysis.hasLocationInfo && analysis.specificityScore < 50) {
    uncertainAreas.push({
      area: 'symptoms',
      type: 'location_clarification',
      priority: priorityWeights.location * (1 - (analysis.specificityScore / 100)),
      confidenceScore: analysis.specificityScore / 100,
      specificConcerns: ['محل دقیق علائم نامشخص'],
      suggestedQuestions: ['دقیقاً کدام قسمت از بدن درگیر است؟']
    })
  }
  
  // Pattern information missing
  if (!analysis.hasPatternInfo) {
    uncertainAreas.push({
      area: 'symptoms',
      type: 'pattern_clarification',
      priority: priorityWeights.symptoms * 0.8,
      confidenceScore: 0.3,
      specificConcerns: ['الگوی علائم نامشخص'],
      suggestedQuestions: ['آیا این علائم مداوم است یا گاه به گاه؟']
    })
  }
  
  // Associated symptoms unclear
  if (category.id === 'SYMPTOM_REPORTING' && !analysis.hasAssociatedSymptoms) {
    uncertainAreas.push({
      area: 'symptoms',
      type: 'associated_symptoms',
      priority: priorityWeights.symptoms,
      confidenceScore: 0.4,
      specificConcerns: ['علائم همراه نامشخص'],
      suggestedQuestions: ['آیا علائم دیگری همراه این مشکل دارید؟']
    })
  }
  
  // Trigger identification needed
  if (analysis.hasPatternInfo && analysis.specificityScore < 60) {
    uncertainAreas.push({
      area: 'context',
      type: 'trigger_identification',
      priority: priorityWeights.context,
      confidenceScore: analysis.specificityScore / 100,
      specificConcerns: ['عوامل تشدیدکننده نامشخص'],
      suggestedQuestions: ['آیا چیزی باعث بهتر یا بدتر شدن علائم می‌شود؟']
    })
  }
  
  // Medical history relevant for certain categories
  if (['CHRONIC_DISEASE_MANAGEMENT', 'MEDICATION_INQUIRY'].includes(category.id)) {
    uncertainAreas.push({
      area: 'medical_history',
      type: 'medical_history',
      priority: priorityWeights.context * 0.9,
      confidenceScore: 0.5,
      specificConcerns: ['سابقه پزشکی ناقص'],
      suggestedQuestions: ['آیا سابقه بیماری خاصی دارید؟']
    })
  }
  
  // Medication interaction concerns
  if (category.id === 'MEDICATION_INQUIRY') {
    uncertainAreas.push({
      area: 'medical_history',
      type: 'medication_interaction',
      priority: priorityWeights.context * 1.1,
      confidenceScore: 0.4,
      specificConcerns: ['تداخل دارویی احتمالی'],
      suggestedQuestions: ['آیا در حال حاضر داروی خاصی مصرف می‌کنید؟']
    })
  }
  
  // Lifestyle factors for preventive care
  if (category.id === 'PREVENTIVE_CARE') {
    uncertainAreas.push({
      area: 'context',
      type: 'lifestyle_factors',
      priority: priorityWeights.context * 0.7,
      confidenceScore: 0.6,
      specificConcerns: ['عوامل سبک زندگی'],
      suggestedQuestions: ['سبک زندگی و عادات روزانه شما چگونه است؟']
    })
  }
  
  // Symptom progression for chronic conditions
  if (category.id === 'CHRONIC_DISEASE_MANAGEMENT' && analysis.hasTimeInfo) {
    uncertainAreas.push({
      area: 'duration',
      type: 'symptom_progression',
      priority: priorityWeights.timing * 0.8,
      confidenceScore: analysis.clarityScore / 100,
      specificConcerns: ['روند تغییر علائم'],
      suggestedQuestions: ['آیا علائم در طول زمان تغییر کرده است؟']
    })
  }
  
  // Emergency-specific uncertainty areas
  if (category.id === 'EMERGENCY_URGENT') {
    if (!analysis.hasSeverityInfo) {
      uncertainAreas.push({
        area: 'severity',
        type: 'emergency_severity',
        priority: 0.4, // High priority for emergencies
        confidenceScore: 0.2,
        specificConcerns: ['شدت اورژانس نامشخص'],
        suggestedQuestions: ['وضعیت شما چقدر وخیم است؟ آیا نیاز فوری به کمک دارید؟']
      })
    }
  }
  
  // Sort by priority (highest first)
  return uncertainAreas.sort((a, b) => b.priority - a.priority)
}

/**
 * Generate reasoning for question selection
 */
function generateSelectionReasoning(
  selectedQuestions: Array<{ question: CategoryQuestion; score: number; factors: string[] }>,
  analysis: InputAnalysis,
  uncertaintyAreas: UncertaintyArea[]
): string[] {
  const reasoning: string[] = []
  
  // Overall strategy
  if (analysis.isUrgent) {
    reasoning.push('اولویت به سوالات مرتبط با وضعیت اورژانسی داده شد')
  }
  
  if (analysis.specificityScore < 50) {
    reasoning.push('به دلیل کمبود جزئیات، سوالات روشن‌کننده انتخاب شدند')
  }
  
  // Question-specific reasoning
  selectedQuestions.forEach((sq, index) => {
    const question = sq.question
    let reason = `سوال ${index + 1}: `
    
    if (question.type === 'severity' && !analysis.hasSeverityInfo) {
      reason += 'تعیین شدت علائم برای ارزیابی اولیه ضروری است'
    } else if (question.type === 'timing' && !analysis.hasTimeInfo) {
      reason += 'زمان شروع علائم برای تشخیص مهم است'
    } else if (question.type === 'associated_symptoms') {
      reason += 'شناسایی علائم همراه برای تشخیص دقیق‌تر'
    } else if (question.type === 'clarification') {
      reason += 'روشن‌سازی اطلاعات مبهم'
    } else {
      reason += 'جمع‌آوری اطلاعات تکمیلی مهم'
    }
    
    reasoning.push(reason)
  })
  
  // Uncertainty areas
  if (uncertaintyAreas.length > 0) {
    reasoning.push(`نواحی نامشخص شناسایی شده: ${uncertaintyAreas.length} مورد`)
  }
  
  return reasoning
}

/**
 * Calculate expected information gain from selected questions
 */
function calculateExpectedInformationGain(
  selectedQuestions: Array<{ question: CategoryQuestion; score: number; factors: string[] }>,
  analysis: InputAnalysis
): number {
  let totalGain = 0
  
  selectedQuestions.forEach(sq => {
    const question = sq.question
    let questionGain = question.informationValue
    
    // Adjust based on current information completeness
    if (question.type === 'severity' && !analysis.hasSeverityInfo) {
      questionGain *= 1.2 // 20% bonus for critical missing info
    }
    
    if (question.type === 'timing' && !analysis.hasTimeInfo) {
      questionGain *= 1.2
    }
    
    if (analysis.isUrgent && question.urgencyRelevance > 80) {
      questionGain *= 1.1 // 10% bonus for urgent relevance
    }
    
    totalGain += questionGain
  })
  
  // Normalize to 0-100 scale
  return Math.min(totalGain / selectedQuestions.length, 100)
}

/**
 * Priority-based question selection for uncertainty areas
 */
export function selectPriorityQuestions(
  uncertaintyAreas: UncertaintyArea[],
  maxQuestions: number,
  context?: ProgressiveQuestionContext
): CategoryQuestion[] {
  // Filter and sort by priority
  const prioritizedAreas = uncertaintyAreas
    .filter(area => area.priority > 0.1) // Minimum priority threshold
    .sort((a, b) => b.priority - a.priority)
    .slice(0, maxQuestions);
  
  return prioritizedAreas.map(area => createQuestionFromUncertaintyArea(area));
}

/**
 * Create a CategoryQuestion from an UncertaintyArea
 */
function createQuestionFromUncertaintyArea(area: UncertaintyArea): CategoryQuestion {
  const baseQuestion = getBaseQuestionForArea(area);
  
  return {
    ...baseQuestion,
    priority: Math.round(area.priority * 100),
    targetedAreas: [area.type],
    informationValue: Math.round((1 - area.confidenceScore) * 100),
    urgencyRelevance: area.area === 'severity' ? 90 : 70
  };
}

/**
 * Get base question template for uncertainty area
 */
function getBaseQuestionForArea(area: UncertaintyArea): CategoryQuestion {
  const questionText = area.suggestedQuestions[0] || 'لطفاً اطلاعات بیشتری ارائه دهید';
  
  return {
    id: `${area.type}_${Date.now()}`,
    text: questionText,
    type: mapAreaToQuestionType(area.area),
    priority: Math.round(area.priority * 100),
    targetedAreas: [area.type],
    prerequisites: [],
    informationValue: Math.round((1 - area.confidenceScore) * 100),
    urgencyRelevance: area.area === 'severity' ? 90 : 70,
    estimatedResponseTime: 20,
    isRequired: area.priority > 0.25,
    canSkip: area.priority <= 0.15
  };
}

/**
 * Map uncertainty area to question type
 */
function mapAreaToQuestionType(area: string): string {
  const mapping: Record<string, string> = {
    'severity': 'severity',
    'duration': 'timing',
    'symptoms': 'associated_symptoms',
    'context': 'triggers',
    'medical_history': 'medical_history'
  };
  
  return mapping[area] || 'clarification';
}

/**
 * Question context preservation across rounds
 */
export function preserveQuestionContext(
  previousQuestions: CategoryQuestion[],
  previousAnswers: string[],
  newUncertaintyAreas: UncertaintyArea[]
): ProgressiveQuestionContext {
  const askedTypes = new Set(previousQuestions.map(q => q.type));
  const contextualInfo = extractContextualInfo(previousAnswers);
  
  return {
    currentRound: 1,
    previousQuestions,
    previousAnswers,
    askedQuestionTypes: Array.from(askedTypes),
    contextualInfo,
    previousImprovement: 0,
    totalQuestionsAsked: previousQuestions.length
  };
}

/**
 * Extract contextual information from previous answers
 */
function extractContextualInfo(answers: string[]): Record<string, any> {
  const context: Record<string, any> = {};
  
  answers.forEach((answer, index) => {
    // Extract severity mentions
    const severityMatch = answer.match(/(\d+)\s*(?:از\s*\d+|\/\d+)/);
    if (severityMatch) {
      context.severityLevel = parseInt(severityMatch[1]);
    }
    
    // Extract time mentions
    const timePatterns = [
      /(\d+)\s*(روز|هفته|ماه|سال)/,
      /(دیروز|امروز|پریروز)/,
      /(صبح|ظهر|عصر|شب)/
    ];
    
    timePatterns.forEach(pattern => {
      const match = answer.match(pattern);
      if (match) {
        context.timeframe = match[0];
      }
    });
    
    // Extract location mentions
    const locationKeywords = ['سر', 'گردن', 'سینه', 'شکم', 'پا', 'دست', 'کمر', 'زانو'];
    locationKeywords.forEach(keyword => {
      if (answer.includes(keyword)) {
        context.location = context.location || [];
        context.location.push(keyword);
      }
    });
    
    // Extract yes/no responses
    if (answer.includes('بله') || answer.includes('آره')) {
      context[`answer_${index}_positive`] = true;
    } else if (answer.includes('نه') || answer.includes('خیر')) {
      context[`answer_${index}_negative`] = true;
    }
  });
  
  return context;
}

/**
 * Get targeted questions for specific uncertainty areas
 */
export function getTargetedQuestions(
  uncertaintyAreas: UncertaintyArea[],
  count: number,
  category?: MedicalCategory
): CategoryQuestion[] {
  const questionMap: Record<string, CategoryQuestion> = {
    'severity_clarification': {
      id: 'severity_clarification',
      text: 'لطفاً شدت دقیق درد یا ناراحتی را از ۱ تا ۱۰ بیان کنید',
      type: 'severity',
      priority: 90,
      targetedAreas: ['severity_clarification'],
      prerequisites: [],
      informationValue: 85,
      urgencyRelevance: 90,
      estimatedResponseTime: 15,
      isRequired: false,
      canSkip: false
    },
    'time_clarification': {
      id: 'time_clarification',
      text: 'دقیقاً از چه زمانی این علائم شروع شده است؟',
      type: 'timing',
      priority: 85,
      targetedAreas: ['time_clarification'],
      prerequisites: [],
      informationValue: 80,
      urgencyRelevance: 85,
      estimatedResponseTime: 20,
      isRequired: false,
      canSkip: false
    },
    'location_clarification': {
      id: 'location_clarification',
      text: 'دقیقاً کدام قسمت از بدن درگیر است؟',
      type: 'location',
      priority: 75,
      targetedAreas: ['location_clarification'],
      prerequisites: [],
      informationValue: 75,
      urgencyRelevance: 70,
      estimatedResponseTime: 20,
      isRequired: false,
      canSkip: true
    },
    'pattern_clarification': {
      id: 'pattern_clarification',
      text: 'آیا این علائم مداوم است یا گاه به گاه؟',
      type: 'pattern',
      priority: 70,
      targetedAreas: ['pattern_clarification'],
      prerequisites: [],
      informationValue: 70,
      urgencyRelevance: 60,
      estimatedResponseTime: 20,
      isRequired: false,
      canSkip: true
    },
    'associated_symptoms': {
      id: 'associated_symptoms',
      text: 'آیا علائم دیگری همراه این مشکل دارید؟',
      type: 'associated_symptoms',
      priority: 80,
      targetedAreas: ['associated_symptoms'],
      prerequisites: [],
      informationValue: 80,
      urgencyRelevance: 75,
      estimatedResponseTime: 25,
      isRequired: false,
      canSkip: true
    },
    'trigger_identification': {
      id: 'trigger_identification',
      text: 'آیا چیزی باعث بهتر یا بدتر شدن علائم می‌شود؟',
      type: 'triggers',
      priority: 65,
      targetedAreas: ['trigger_identification'],
      prerequisites: [],
      informationValue: 65,
      urgencyRelevance: 50,
      estimatedResponseTime: 30,
      isRequired: false,
      canSkip: true
    },
    'medical_history': {
      id: 'medical_history',
      text: 'آیا سابقه بیماری خاصی دارید؟',
      type: 'medical_history',
      priority: 70,
      targetedAreas: ['medical_history'],
      prerequisites: [],
      informationValue: 75,
      urgencyRelevance: 65,
      estimatedResponseTime: 30,
      isRequired: false,
      canSkip: true
    },
    'medication_interaction': {
      id: 'medication_interaction',
      text: 'آیا در حال حاضر داروی خاصی مصرف می‌کنید؟',
      type: 'medications',
      priority: 75,
      targetedAreas: ['medication_interaction'],
      prerequisites: [],
      informationValue: 80,
      urgencyRelevance: 70,
      estimatedResponseTime: 25,
      isRequired: false,
      canSkip: true
    },
    'lifestyle_factors': {
      id: 'lifestyle_factors',
      text: 'سبک زندگی و عادات روزانه شما چگونه است؟',
      type: 'lifestyle',
      priority: 60,
      targetedAreas: ['lifestyle_factors'],
      prerequisites: [],
      informationValue: 65,
      urgencyRelevance: 30,
      estimatedResponseTime: 40,
      isRequired: false,
      canSkip: true
    },
    'symptom_progression': {
      id: 'symptom_progression',
      text: 'آیا علائم در طول زمان تغییر کرده است؟',
      type: 'pattern',
      priority: 65,
      targetedAreas: ['symptom_progression'],
      prerequisites: [],
      informationValue: 70,
      urgencyRelevance: 60,
      estimatedResponseTime: 25,
      isRequired: false,
      canSkip: true
    }
  }
  
  return uncertaintyAreas
    .slice(0, count)
    .map(area => questionMap[area])
    .filter(Boolean)
}

/**
 * Calculate information completeness score
 */
export function calculateInformationCompleteness(analysis: InputAnalysis): number {
  let completeness = 0
  
  if (analysis.hasSeverityInfo) {
    completeness += COMPLETENESS_THRESHOLDS.SEVERITY
    if (analysis.severityLevel) completeness += 5 // Bonus for specific severity
  }
  
  if (analysis.hasTimeInfo) {
    completeness += COMPLETENESS_THRESHOLDS.TIMING
    if (analysis.timeframe) completeness += 5 // Bonus for specific timeframe
  }
  
  if (analysis.hasLocationInfo) {
    completeness += COMPLETENESS_THRESHOLDS.LOCATION
  }
  
  if (analysis.hasAssociatedSymptoms) {
    completeness += COMPLETENESS_THRESHOLDS.SYMPTOMS
    if (analysis.symptomKeywords.length > 1) completeness += 5 // Bonus for multiple symptoms
  }
  
  if (analysis.hasPatternInfo) {
    completeness += COMPLETENESS_THRESHOLDS.PATTERN
  }
  
  return Math.min(completeness, 100)
}
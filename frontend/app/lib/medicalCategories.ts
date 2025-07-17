/**
 * Medical Category System for 3-Stage Enhanced Conversation Flow
 * 
 * This module handles medical categorization, classification logic,
 * and category-specific question management for targeted medical consultations.
 */

import { MedicalCategory, CategoryQuestion, InputAnalysis } from '../types/conversation'
import { MEDICAL_CATEGORIES } from './systemConfig'

// Enhanced medical categories with additional functionality
export const ENHANCED_MEDICAL_CATEGORIES: Record<string, MedicalCategory> = {
  ...MEDICAL_CATEGORIES,
  
  // Additional specialized categories
  CHRONIC_DISEASE_MANAGEMENT: {
    id: 'CHRONIC_DISEASE_MANAGEMENT',
    name: 'مدیریت بیماری مزمن',
    nameEn: 'Chronic Disease Management',
    description: 'مدیریت و پیگیری بیماری‌های مزمن مانند دیابت، فشار خون و آسم',
    
    smartQuestions: [
      {
        id: 'chronic_condition_type',
        text: 'چه نوع بیماری مزمنی دارید؟',
        type: 'medical_history',
        priority: 95,
        targetedAreas: ['medical_history'],
        prerequisites: [],
        informationValue: 90,
        urgencyRelevance: 60,
        estimatedResponseTime: 20,
        isRequired: true,
        canSkip: false
      },
      {
        id: 'current_management',
        text: 'در حال حاضر چگونه بیماری خود را مدیریت می‌کنید؟',
        type: 'medications',
        priority: 85,
        targetedAreas: ['medication_interaction'],
        prerequisites: [],
        informationValue: 85,
        urgencyRelevance: 70,
        estimatedResponseTime: 30,
        isRequired: false,
        canSkip: true
      }
    ],
    
    progressiveQuestions: [
      {
        id: 'symptom_changes',
        text: 'آیا اخیراً تغییری در علائم خود احساس کرده‌اید؟',
        type: 'pattern',
        priority: 75,
        targetedAreas: ['symptom_progression'],
        prerequisites: [],
        informationValue: 80,
        urgencyRelevance: 75,
        estimatedResponseTime: 25,
        isRequired: false,
        canSkip: true
      }
    ],
    
    emergencyQuestions: [
      {
        id: 'acute_complication',
        text: 'آیا علائم جدید یا شدیدی پیدا کرده‌اید؟',
        type: 'associated_symptoms',
        priority: 100,
        targetedAreas: ['associated_symptoms'],
        prerequisites: [],
        informationValue: 95,
        urgencyRelevance: 100,
        estimatedResponseTime: 15,
        isRequired: true,
        canSkip: false
      }
    ],
    
    primaryKeywords: [
      'دیابت', 'فشار خون', 'آسم', 'مزمن', 'قند خون', 'انسولین'
    ],
    secondaryKeywords: [
      'کنترل', 'مدیریت', 'پیگیری', 'دارو', 'رژیم'
    ],
    emergencyKeywords: [
      'قند خون بالا', 'قند خون پایین', 'فشار خون بالا', 'حمله آسم'
    ],
    
    confidenceThreshold: 75,
    maxQuestions: 3,
    emergencyBypass: true,
    priority: 2,
    isActive: true
  },

  WOMEN_HEALTH: {
    id: 'WOMEN_HEALTH',
    name: 'سلامت زنان',
    nameEn: 'Women\'s Health',
    description: 'مسائل مربوط به سلامت زنان، بارداری، قاعدگی و یائسگی',
    
    smartQuestions: [
      {
        id: 'menstrual_concern',
        text: 'مشکل شما مربوط به قاعدگی، بارداری یا مسائل زنانه دیگر است؟',
        type: 'clarification',
        priority: 90,
        targetedAreas: ['medical_history'],
        prerequisites: [],
        informationValue: 85,
        urgencyRelevance: 70,
        estimatedResponseTime: 20,
        isRequired: true,
        canSkip: false
      },
      {
        id: 'pregnancy_status',
        text: 'آیا در حال حاضر باردار هستید یا احتمال بارداری وجود دارد؟',
        type: 'medical_history',
        priority: 95,
        targetedAreas: ['medical_history'],
        prerequisites: [],
        informationValue: 90,
        urgencyRelevance: 85,
        estimatedResponseTime: 15,
        isRequired: true,
        canSkip: false
      }
    ],
    
    progressiveQuestions: [
      {
        id: 'cycle_pattern',
        text: 'الگوی قاعدگی شما چگونه است؟',
        type: 'pattern',
        priority: 70,
        targetedAreas: ['pattern_clarification'],
        prerequisites: [],
        informationValue: 75,
        urgencyRelevance: 60,
        estimatedResponseTime: 25,
        isRequired: false,
        canSkip: true
      }
    ],
    
    emergencyQuestions: [
      {
        id: 'severe_bleeding',
        text: 'آیا خونریزی شدید یا درد شدید لگنی دارید؟',
        type: 'severity',
        priority: 100,
        targetedAreas: ['severity_clarification'],
        prerequisites: [],
        informationValue: 95,
        urgencyRelevance: 100,
        estimatedResponseTime: 10,
        isRequired: true,
        canSkip: false
      }
    ],
    
    primaryKeywords: [
      'قاعدگی', 'بارداری', 'زایمان', 'یائسگی', 'تخمدان', 'رحم'
    ],
    secondaryKeywords: [
      'هورمون', 'سیکل', 'درد لگن', 'ترشحات'
    ],
    emergencyKeywords: [
      'خونریزی شدید', 'درد شدید لگن', 'علائم بارداری خارج رحمی'
    ],
    
    confidenceThreshold: 80,
    maxQuestions: 3,
    emergencyBypass: true,
    priority: 2,
    isActive: true
  },

  MENTAL_HEALTH: {
    id: 'MENTAL_HEALTH',
    name: 'سلامت روان',
    nameEn: 'Mental Health',
    description: 'مسائل روانی، اضطراب، افسردگی و استرس',
    
    smartQuestions: [
      {
        id: 'mental_concern_type',
        text: 'نوع مشکل روانی شما چیست؟ (اضطراب، افسردگی، استرس، ...)',
        type: 'clarification',
        priority: 90,
        targetedAreas: ['medical_history'],
        prerequisites: [],
        informationValue: 85,
        urgencyRelevance: 80,
        estimatedResponseTime: 30,
        isRequired: true,
        canSkip: false
      },
      {
        id: 'symptom_duration_mental',
        text: 'این احساسات از چه مدت پیش شروع شده است؟',
        type: 'timing',
        priority: 85,
        targetedAreas: ['time_clarification'],
        prerequisites: [],
        informationValue: 80,
        urgencyRelevance: 75,
        estimatedResponseTime: 20,
        isRequired: false,
        canSkip: true
      }
    ],
    
    progressiveQuestions: [
      {
        id: 'daily_impact',
        text: 'این مشکل چقدر بر زندگی روزانه شما تأثیر گذاشته است؟',
        type: 'lifestyle',
        priority: 75,
        targetedAreas: ['lifestyle_factors'],
        prerequisites: [],
        informationValue: 75,
        urgencyRelevance: 70,
        estimatedResponseTime: 30,
        isRequired: false,
        canSkip: true
      }
    ],
    
    emergencyQuestions: [
      {
        id: 'suicide_risk',
        text: 'آیا افکار آسیب رساندن به خود یا دیگران دارید؟',
        type: 'clarification',
        priority: 100,
        targetedAreas: ['associated_symptoms'],
        prerequisites: [],
        informationValue: 100,
        urgencyRelevance: 100,
        estimatedResponseTime: 15,
        isRequired: true,
        canSkip: false
      }
    ],
    
    primaryKeywords: [
      'اضطراب', 'افسردگی', 'استرس', 'روان', 'ذهن', 'احساس'
    ],
    secondaryKeywords: [
      'خلق', 'خواب', 'اشتها', 'انرژی', 'تمرکز'
    ],
    emergencyKeywords: [
      'خودکشی', 'آسیب به خود', 'توهم', 'هذیان', 'حمله پانیک'
    ],
    
    confidenceThreshold: 85,
    maxQuestions: 3,
    emergencyBypass: true,
    priority: 1,
    isActive: true
  }
}

/**
 * Classify user input into appropriate medical category
 */
export async function classifyMedicalCategory(
  userInput: string,
  inputAnalysis: InputAnalysis
): Promise<{
  category: MedicalCategory | null
  confidence: number
  alternativeCategories: { category: MedicalCategory; confidence: number }[]
}> {
  const lowerInput = userInput.toLowerCase()
  const categoryScores: { category: MedicalCategory; confidence: number }[] = []

  // Score each category based on keyword matches and input analysis
  for (const category of Object.values(ENHANCED_MEDICAL_CATEGORIES)) {
    let score = 0

    // Primary keyword matches (high weight)
    for (const keyword of category.primaryKeywords) {
      if (lowerInput.includes(keyword.toLowerCase())) {
        score += 40
      }
    }

    // Secondary keyword matches (medium weight)
    for (const keyword of category.secondaryKeywords) {
      if (lowerInput.includes(keyword.toLowerCase())) {
        score += 20
      }
    }

    // Emergency keyword matches (very high weight)
    for (const keyword of category.emergencyKeywords) {
      if (lowerInput.includes(keyword.toLowerCase())) {
        score += 60
      }
    }

    // Input analysis bonuses
    if (inputAnalysis.isUrgent && category.emergencyBypass) {
      score += 30
    }

    if (inputAnalysis.hasSeverityInfo && category.id === 'SYMPTOM_REPORTING') {
      score += 25
    }

    if (inputAnalysis.hasTimeInfo && category.id === 'CHRONIC_DISEASE_MANAGEMENT') {
      score += 20
    }

    // Category-specific analysis
    score += getCategorySpecificScore(category, lowerInput, inputAnalysis)

    categoryScores.push({ category, confidence: Math.min(score, 100) })
  }

  // Sort by confidence score
  categoryScores.sort((a, b) => b.confidence - a.confidence)

  const topCategory = categoryScores[0]
  const alternativeCategories = categoryScores.slice(1, 4) // Top 3 alternatives

  return {
    category: topCategory.confidence >= 30 ? topCategory.category : null,
    confidence: topCategory.confidence,
    alternativeCategories
  }
}

/**
 * Get category-specific scoring based on input patterns
 */
function getCategorySpecificScore(
  category: MedicalCategory,
  lowerInput: string,
  inputAnalysis: InputAnalysis
): number {
  let score = 0

  switch (category.id) {
    case 'EMERGENCY_URGENT':
      if (inputAnalysis.urgencyScore >= 70) score += 50
      if (inputAnalysis.emergencyKeywordsFound.length > 0) score += 40
      break

    case 'MEDICATION_INQUIRY':
      if (/دارو|قرص|کپسول|شربت|تزریق/.test(lowerInput)) score += 30
      if (/عوارض|تداخل|حساسیت/.test(lowerInput)) score += 25
      break

    case 'CHRONIC_DISEASE_MANAGEMENT':
      if (/مزمن|همیشه|مدت‌ها/.test(lowerInput)) score += 35
      if (/دیابت|فشار|آسم/.test(lowerInput)) score += 40
      break

    case 'WOMEN_HEALTH':
      if (/قاعدگی|بارداری|زایمان|یائسگی/.test(lowerInput)) score += 45
      if (/هورمون|سیکل|رحم/.test(lowerInput)) score += 30
      break

    case 'MENTAL_HEALTH':
      if (/اضطراب|افسردگی|استرس|روان/.test(lowerInput)) score += 40
      if (inputAnalysis.emotionalIndicators.length > 0) score += 30
      break

    case 'PREVENTIVE_CARE':
      if (/پیشگیری|چکاپ|معاینه|واکسن/.test(lowerInput)) score += 35
      if (/سلامت|ورزش|تغذیه/.test(lowerInput)) score += 25
      break

    case 'SYMPTOM_REPORTING':
      if (inputAnalysis.hasAssociatedSymptoms) score += 20
      if (inputAnalysis.hasSeverityInfo) score += 15
      if (inputAnalysis.hasLocationInfo) score += 15
      break
  }

  return score
}

/**
 * Get questions for a specific category and phase
 */
export function getCategoryQuestions(
  category: MedicalCategory,
  phase: 'smart' | 'progressive' | 'emergency',
  inputAnalysis?: InputAnalysis
): CategoryQuestion[] {
  let questions: CategoryQuestion[]

  switch (phase) {
    case 'smart':
      questions = [...category.smartQuestions]
      break
    case 'progressive':
      questions = [...category.progressiveQuestions]
      break
    case 'emergency':
      questions = [...category.emergencyQuestions]
      break
    default:
      questions = []
  }

  // Filter and sort questions based on input analysis
  if (inputAnalysis) {
    questions = filterQuestionsByAnalysis(questions, inputAnalysis)
  }

  // Sort by priority
  questions.sort((a, b) => b.priority - a.priority)

  return questions
}

/**
 * Filter questions based on input analysis to avoid redundant questions
 */
function filterQuestionsByAnalysis(
  questions: CategoryQuestion[],
  inputAnalysis: InputAnalysis
): CategoryQuestion[] {
  return questions.filter(question => {
    // Skip severity questions if severity is already provided
    if (question.type === 'severity' && inputAnalysis.hasSeverityInfo) {
      return false
    }

    // Skip timing questions if time info is already provided
    if (question.type === 'timing' && inputAnalysis.hasTimeInfo) {
      return false
    }

    // Skip location questions if location is already provided
    if (question.type === 'location' && inputAnalysis.hasLocationInfo) {
      return false
    }

    // Skip associated symptoms if already provided
    if (question.type === 'associated_symptoms' && inputAnalysis.hasAssociatedSymptoms) {
      return false
    }

    return true
  })
}

/**
 * Get category by ID
 */
export function getCategoryById(categoryId: string): MedicalCategory | null {
  return ENHANCED_MEDICAL_CATEGORIES[categoryId] || null
}

/**
 * Get all active categories
 */
export function getActiveCategories(): MedicalCategory[] {
  return Object.values(ENHANCED_MEDICAL_CATEGORIES).filter(cat => cat.isActive)
}

/**
 * Check if category supports emergency bypass
 */
export function categorySupportsEmergencyBypass(categoryId: string): boolean {
  const category = getCategoryById(categoryId)
  return category?.emergencyBypass || false
}

/**
 * Get category priority for sorting
 */
export function getCategoryPriority(categoryId: string): number {
  const category = getCategoryById(categoryId)
  return category?.priority || 999
}

// Export the enhanced categories as default
export default ENHANCED_MEDICAL_CATEGORIES
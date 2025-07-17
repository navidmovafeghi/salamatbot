/**
 * Dynamic Question Generator for 3-Stage Enhanced Conversation Flow
 * 
 * This module generates contextually relevant questions based on medical category,
 * input analysis, and conversation progress to optimize information gathering.
 */

import { 
  CategoryQuestion, 
  MedicalCategory, 
  InputAnalysis, 
  UncertaintyArea,
  QuestionType 
} from '../types/conversation'
import { ENHANCED_MEDICAL_CATEGORIES } from './medicalCategories'
import { getTargetedQuestions } from './questionSelection'

// Question templates for dynamic generation
const QUESTION_TEMPLATES = {
  severity: {
    numeric: 'شدت {symptom} را از ۱ تا ۱۰ چگونه ارزیابی می‌کنید؟',
    descriptive: 'آیا {symptom} شما خفیف، متوسط یا شدید است؟',
    comparison: 'شدت {symptom} در مقایسه با {timeframe} چگونه است؟',
    impact: '{symptom} چقدر بر فعالیت‌های روزانه شما تأثیر گذاشته است؟'
  },
  
  timing: {
    onset: 'دقیقاً از چه زمانی {symptom} شروع شده است؟',
    duration: '{symptom} چه مدت طول کشیده است؟',
    frequency: 'چند بار در {timeperiod} این {symptom} اتفاق می‌افتد؟',
    progression: 'آیا {symptom} در طول زمان تغییر کرده است؟',
    recent_changes: 'آیا اخیراً تغییری در {symptom} احساس کرده‌اید؟'
  },
  
  location: {
    specific: 'دقیقاً کدام قسمت از {bodypart} درگیر است؟',
    radiation: 'آیا {symptom} به نواحی دیگر بدن کشیده می‌شود؟',
    bilateral: 'آیا {symptom} در هر دو طرف {bodypart} است؟',
    localized: 'آیا {symptom} در یک نقطه خاص متمرکز است؟'
  },
  
  pattern: {
    continuous: 'آیا {symptom} مداوم است یا گاه به گاه؟',
    triggers: 'چه چیزی باعث شروع یا بدتر شدن {symptom} می‌شود؟',
    relief: 'چه چیزی باعث بهتر شدن {symptom} می‌شود؟',
    daily_pattern: 'آیا {symptom} در طول روز الگوی خاصی دارد؟',
    seasonal: 'آیا {symptom} در فصل یا زمان خاصی بدتر می‌شود؟'
  },
  
  associated_symptoms: {
    general: 'آیا علائم دیگری همراه {mainsymptom} دارید؟',
    specific: 'آیا {specificsymptom} همراه {mainsymptom} دارید؟',
    systemic: 'آیا تب، لرز یا خستگی همراه {mainsymptom} دارید؟',
    related: 'آیا مشکلات {systemtype} دیگری همراه این علائم دارید؟'
  },
  
  medical_history: {
    general: 'آیا سابقه بیماری خاصی دارید؟',
    family: 'آیا در خانواده سابقه {condition} وجود دارد؟',
    previous: 'آیا قبلاً مشکل مشابهی داشته‌اید؟',
    chronic: 'آیا بیماری مزمنی دارید که نیاز به درمان دارد؟',
    surgery: 'آیا سابقه جراحی مرتبط با {area} دارید؟'
  },
  
  medications: {
    current: 'آیا در حال حاضر داروی خاصی مصرف می‌کنید؟',
    recent: 'آیا اخیراً دارویی شروع یا قطع کرده‌اید؟',
    allergies: 'آیا به داروی خاصی حساسیت دارید؟',
    effectiveness: 'آیا داروهای فعلی مؤثر هستند؟',
    side_effects: 'آیا عوارض جانبی از داروهایتان دارید؟'
  },
  
  lifestyle: {
    diet: 'رژیم غذایی شما چگونه است؟',
    exercise: 'چقدر ورزش می‌کنید؟',
    sleep: 'الگوی خواب شما چگونه است؟',
    stress: 'سطح استرس شما چگونه است؟',
    habits: 'آیا عادات خاصی دارید که ممکن است مرتبط باشد؟'
  },
  
  clarification: {
    elaborate: 'لطفاً بیشتر در مورد {topic} توضیح دهید',
    specify: 'منظورتان از {term} دقیقاً چیست؟',
    confirm: 'آیا منظورتان {interpretation} است؟',
    detail: 'می‌توانید جزئیات بیشتری از {aspect} بدهید؟'
  }
}

// Context-specific question variations
const CONTEXT_VARIATIONS = {
  urgent: {
    prefix: 'با توجه به وضعیت فوری، ',
    suffix: ' (لطفاً سریع پاسخ دهید)',
    tone: 'direct'
  },
  
  chronic: {
    prefix: 'در مورد وضعیت مزمن شما، ',
    suffix: '',
    tone: 'comprehensive'
  },
  
  preventive: {
    prefix: 'برای بررسی پیشگیرانه، ',
    suffix: '',
    tone: 'exploratory'
  },
  
  followup: {
    prefix: 'برای تکمیل اطلاعات، ',
    suffix: '',
    tone: 'clarifying'
  }
}

/**
 * Generate dynamic questions based on category and input analysis
 */
export function generateDynamicQuestions(
  category: MedicalCategory,
  inputAnalysis: InputAnalysis,
  questionType: QuestionType,
  count: number = 1,
  context?: string
): CategoryQuestion[] {
  const questions: CategoryQuestion[] = []
  
  // Extract key information from input analysis
  const mainSymptom = extractMainSymptom(inputAnalysis)
  const bodyPart = extractBodyPart(inputAnalysis)
  const timeContext = extractTimeContext(inputAnalysis)
  
  // Generate questions based on type
  switch (questionType) {
    case 'severity':
      questions.push(...generateSeverityQuestions(mainSymptom, inputAnalysis, count))
      break
      
    case 'timing':
      questions.push(...generateTimingQuestions(mainSymptom, timeContext, count))
      break
      
    case 'location':
      questions.push(...generateLocationQuestions(mainSymptom, bodyPart, count))
      break
      
    case 'pattern':
      questions.push(...generatePatternQuestions(mainSymptom, inputAnalysis, count))
      break
      
    case 'associated_symptoms':
      questions.push(...generateAssociatedSymptomsQuestions(mainSymptom, category, count))
      break
      
    case 'medical_history':
      questions.push(...generateMedicalHistoryQuestions(category, count))
      break
      
    case 'medications':
      questions.push(...generateMedicationQuestions(category, count))
      break
      
    case 'lifestyle':
      questions.push(...generateLifestyleQuestions(category, count))
      break
      
    case 'clarification':
      questions.push(...generateClarificationQuestions(inputAnalysis, count))
      break
  }
  
  // Apply context variations
  if (context) {
    questions.forEach(question => {
      question.text = applyContextVariation(question.text, context)
    })
  }
  
  return questions.slice(0, count)
}

/**
 * Generate category-specific question variations
 */
export function generateCategorySpecificQuestions(
  category: MedicalCategory,
  inputAnalysis: InputAnalysis,
  uncertaintyAreas: UncertaintyArea[],
  maxQuestions: number = 2
): CategoryQuestion[] {
  const questions: CategoryQuestion[] = []
  
  // Category-specific question generation
  switch (category.id) {
    case 'EMERGENCY_URGENT':
      questions.push(...generateEmergencyQuestions(inputAnalysis))
      break
      
    case 'CHRONIC_DISEASE_MANAGEMENT':
      questions.push(...generateChronicDiseaseQuestions(inputAnalysis))
      break
      
    case 'MEDICATION_INQUIRY':
      questions.push(...generateMedicationInquiryQuestions(inputAnalysis))
      break
      
    case 'WOMEN_HEALTH':
      questions.push(...generateWomensHealthQuestions(inputAnalysis))
      break
      
    case 'MENTAL_HEALTH':
      questions.push(...generateMentalHealthQuestions(inputAnalysis))
      break
      
    case 'PREVENTIVE_CARE':
      questions.push(...generatePreventiveCareQuestions(inputAnalysis))
      break
      
    default:
      questions.push(...generateGeneralSymptomQuestions(inputAnalysis))
      break
  }
  
  // Add uncertainty-specific questions
  uncertaintyAreas.forEach(area => {
    const targetedQuestions = getTargetedQuestions([area], 1, category)
    questions.push(...targetedQuestions)
  })
  
  // Sort by priority and return top questions
  return questions
    .sort((a, b) => b.priority - a.priority)
    .slice(0, maxQuestions)
}

/**
 * Generate progressive questions based on confidence gaps
 */
export function generateProgressiveQuestions(
  category: MedicalCategory,
  previousResponses: Array<{ questionType: QuestionType; response: string }>,
  confidenceGaps: string[],
  maxQuestions: number = 2
): CategoryQuestion[] {
  const questions: CategoryQuestion[] = []
  
  // Analyze what information is still missing
  const missingInfo = analyzeMissingInformation(previousResponses)
  
  // Generate questions to fill gaps
  confidenceGaps.forEach(gap => {
    switch (gap) {
      case 'severity_detail':
        questions.push(createQuestion(
          'severity_detail',
          'لطفاً شدت دقیق‌تری از علائم خود بیان کنید',
          'severity',
          85
        ))
        break
        
      case 'temporal_pattern':
        questions.push(createQuestion(
          'temporal_pattern',
          'الگوی زمانی علائم شما چگونه است؟',
          'pattern',
          80
        ))
        break
        
      case 'functional_impact':
        questions.push(createQuestion(
          'functional_impact',
          'این علائم چقدر بر فعالیت‌های روزانه شما تأثیر گذاشته است؟',
          'lifestyle',
          75
        ))
        break
        
      case 'red_flags':
        questions.push(createQuestion(
          'red_flags',
          'آیا علائم هشداردهنده‌ای مانند تب، خونریزی یا درد شدید دارید؟',
          'associated_symptoms',
          90
        ))
        break
    }
  })
  
  return questions.slice(0, maxQuestions)
}

/**
 * Customize questions based on patient demographics and context
 */
export function customizeQuestionsForContext(
  questions: CategoryQuestion[],
  context: {
    age?: number
    gender?: string
    urgency?: 'low' | 'medium' | 'high'
    previousVisits?: number
  }
): CategoryQuestion[] {
  return questions.map(question => {
    let customizedText = question.text
    
    // Age-specific customizations
    if (context.age) {
      if (context.age < 18) {
        customizedText = customizedText.replace('شما', 'فرزندتان')
      } else if (context.age > 65) {
        // Add more gentle language for elderly
        customizedText = 'لطفاً ' + customizedText
      }
    }
    
    // Gender-specific customizations
    if (context.gender === 'female' && question.type === 'medical_history') {
      customizedText += ' (شامل سابقه بارداری و قاعدگی)'
    }
    
    // Urgency-specific customizations
    if (context.urgency === 'high') {
      customizedText = 'فوری: ' + customizedText
    }
    
    return {
      ...question,
      text: customizedText
    }
  })
}

// Helper functions for question generation

function generateSeverityQuestions(
  symptom: string,
  analysis: InputAnalysis,
  count: number
): CategoryQuestion[] {
  const questions: CategoryQuestion[] = []
  
  if (!analysis.hasSeverityInfo) {
    questions.push(createQuestion(
      'severity_numeric',
      QUESTION_TEMPLATES.severity.numeric.replace('{symptom}', symptom),
      'severity',
      90
    ))
  }
  
  if (analysis.hasSeverityInfo && !analysis.severityLevel) {
    questions.push(createQuestion(
      'severity_descriptive',
      QUESTION_TEMPLATES.severity.descriptive.replace('{symptom}', symptom),
      'severity',
      85
    ))
  }
  
  return questions.slice(0, count)
}

function generateTimingQuestions(
  symptom: string,
  timeContext: string,
  count: number
): CategoryQuestion[] {
  const questions: CategoryQuestion[] = []
  
  questions.push(createQuestion(
    'timing_onset',
    QUESTION_TEMPLATES.timing.onset.replace('{symptom}', symptom),
    'timing',
    85
  ))
  
  if (timeContext) {
    questions.push(createQuestion(
      'timing_progression',
      QUESTION_TEMPLATES.timing.progression.replace('{symptom}', symptom),
      'timing',
      80
    ))
  }
  
  return questions.slice(0, count)
}

function generateLocationQuestions(
  symptom: string,
  bodyPart: string,
  count: number
): CategoryQuestion[] {
  const questions: CategoryQuestion[] = []
  
  questions.push(createQuestion(
    'location_specific',
    QUESTION_TEMPLATES.location.specific
      .replace('{bodypart}', bodyPart)
      .replace('{symptom}', symptom),
    'location',
    80
  ))
  
  return questions.slice(0, count)
}

function generatePatternQuestions(
  symptom: string,
  analysis: InputAnalysis,
  count: number
): CategoryQuestion[] {
  const questions: CategoryQuestion[] = []
  
  if (!analysis.hasPatternInfo) {
    questions.push(createQuestion(
      'pattern_continuous',
      QUESTION_TEMPLATES.pattern.continuous.replace('{symptom}', symptom),
      'pattern',
      75
    ))
    
    questions.push(createQuestion(
      'pattern_triggers',
      QUESTION_TEMPLATES.pattern.triggers.replace('{symptom}', symptom),
      'pattern',
      70
    ))
  }
  
  return questions.slice(0, count)
}

function generateAssociatedSymptomsQuestions(
  mainSymptom: string,
  category: MedicalCategory,
  count: number
): CategoryQuestion[] {
  const questions: CategoryQuestion[] = []
  
  questions.push(createQuestion(
    'associated_general',
    QUESTION_TEMPLATES.associated_symptoms.general.replace('{mainsymptom}', mainSymptom),
    'associated_symptoms',
    80
  ))
  
  // Category-specific associated symptoms
  if (category.id === 'SYMPTOM_REPORTING') {
    questions.push(createQuestion(
      'associated_systemic',
      QUESTION_TEMPLATES.associated_symptoms.systemic.replace('{mainsymptom}', mainSymptom),
      'associated_symptoms',
      75
    ))
  }
  
  return questions.slice(0, count)
}

function generateMedicalHistoryQuestions(category: MedicalCategory, count: number): CategoryQuestion[] {
  const questions: CategoryQuestion[] = []
  
  questions.push(createQuestion(
    'history_general',
    QUESTION_TEMPLATES.medical_history.general,
    'medical_history',
    70
  ))
  
  if (category.id === 'CHRONIC_DISEASE_MANAGEMENT') {
    questions.push(createQuestion(
      'history_chronic',
      QUESTION_TEMPLATES.medical_history.chronic,
      'medical_history',
      85
    ))
  }
  
  return questions.slice(0, count)
}

function generateMedicationQuestions(category: MedicalCategory, count: number): CategoryQuestion[] {
  const questions: CategoryQuestion[] = []
  
  questions.push(createQuestion(
    'medications_current',
    QUESTION_TEMPLATES.medications.current,
    'medications',
    80
  ))
  
  if (category.id === 'MEDICATION_INQUIRY') {
    questions.push(createQuestion(
      'medications_allergies',
      QUESTION_TEMPLATES.medications.allergies,
      'medications',
      85
    ))
  }
  
  return questions.slice(0, count)
}

function generateLifestyleQuestions(category: MedicalCategory, count: number): CategoryQuestion[] {
  const questions: CategoryQuestion[] = []
  
  if (category.id === 'PREVENTIVE_CARE') {
    questions.push(createQuestion(
      'lifestyle_diet',
      QUESTION_TEMPLATES.lifestyle.diet,
      'lifestyle',
      60
    ))
    
    questions.push(createQuestion(
      'lifestyle_exercise',
      QUESTION_TEMPLATES.lifestyle.exercise,
      'lifestyle',
      60
    ))
  }
  
  return questions.slice(0, count)
}

function generateClarificationQuestions(analysis: InputAnalysis, count: number): CategoryQuestion[] {
  const questions: CategoryQuestion[] = []
  
  if (analysis.clarityScore < 60) {
    questions.push(createQuestion(
      'clarification_elaborate',
      'لطفاً بیشتر در مورد علائم خود توضیح دهید',
      'clarification',
      70
    ))
  }
  
  return questions.slice(0, count)
}

// Category-specific question generators

function generateEmergencyQuestions(analysis: InputAnalysis): CategoryQuestion[] {
  return [
    createQuestion(
      'emergency_immediate',
      'وضعیت فعلی شما چقدر اورژانسی است؟',
      'severity',
      100
    )
  ]
}

function generateChronicDiseaseQuestions(analysis: InputAnalysis): CategoryQuestion[] {
  return [
    createQuestion(
      'chronic_management',
      'چگونه بیماری مزمن خود را مدیریت می‌کنید؟',
      'medical_history',
      85
    )
  ]
}

function generateMedicationInquiryQuestions(analysis: InputAnalysis): CategoryQuestion[] {
  return [
    createQuestion(
      'medication_specific',
      'نام دقیق داروی مورد نظر چیست؟',
      'medications',
      90
    )
  ]
}

function generateWomensHealthQuestions(analysis: InputAnalysis): CategoryQuestion[] {
  return [
    createQuestion(
      'womens_cycle',
      'آیا مشکل شما مربوط به قاعدگی یا بارداری است؟',
      'medical_history',
      85
    )
  ]
}

function generateMentalHealthQuestions(analysis: InputAnalysis): CategoryQuestion[] {
  return [
    createQuestion(
      'mental_impact',
      'این مشکل چقدر بر روحیه و زندگی روزانه شما تأثیر گذاشته است؟',
      'lifestyle',
      80
    )
  ]
}

function generatePreventiveCareQuestions(analysis: InputAnalysis): CategoryQuestion[] {
  return [
    createQuestion(
      'preventive_goal',
      'هدف اصلی شما از این مشاوره چیست؟',
      'clarification',
      75
    )
  ]
}

function generateGeneralSymptomQuestions(analysis: InputAnalysis): CategoryQuestion[] {
  return [
    createQuestion(
      'general_main',
      'اصلی‌ترین نگرانی شما چیست؟',
      'clarification',
      80
    )
  ]
}

// Utility functions

function extractMainSymptom(analysis: InputAnalysis): string {
  if (analysis.symptomKeywords.length > 0) {
    return analysis.symptomKeywords[0]
  }
  return 'علائم'
}

function extractBodyPart(analysis: InputAnalysis): string {
  // This would analyze the input for body part mentions
  // For now, return a generic term
  return 'بدن'
}

function extractTimeContext(analysis: InputAnalysis): string {
  return analysis.timeframe || 'اخیراً'
}

function applyContextVariation(questionText: string, context: string): string {
  const variation = CONTEXT_VARIATIONS[context as keyof typeof CONTEXT_VARIATIONS]
  if (variation) {
    return variation.prefix + questionText + variation.suffix
  }
  return questionText
}

function analyzeMissingInformation(responses: Array<{ questionType: QuestionType; response: string }>): string[] {
  const missing: string[] = []
  
  const hasType = (type: QuestionType) => responses.some(r => r.questionType === type)
  
  if (!hasType('severity')) missing.push('severity_detail')
  if (!hasType('timing')) missing.push('temporal_pattern')
  if (!hasType('lifestyle')) missing.push('functional_impact')
  if (!hasType('associated_symptoms')) missing.push('red_flags')
  
  return missing
}

function createQuestion(
  id: string,
  text: string,
  type: QuestionType,
  priority: number
): CategoryQuestion {
  return {
    id,
    text,
    type,
    priority,
    targetedAreas: [type + '_clarification'] as any,
    prerequisites: [],
    informationValue: priority,
    urgencyRelevance: type === 'severity' ? 90 : 60,
    estimatedResponseTime: 20,
    isRequired: false,
    canSkip: true
  }
}

export default {
  generateDynamicQuestions,
  generateCategorySpecificQuestions,
  generateProgressiveQuestions,
  customizeQuestionsForContext
}
/**
 * Input Analysis Engine for 3-Stage Medical Conversation Flow
 * 
 * This module analyzes user input to extract medical context, urgency indicators,
 * and other relevant information for smart question selection and emergency detection.
 */

import { InputAnalysis, SeverityLevel } from '../types/conversation'

// Persian medical keywords for analysis
const MEDICAL_KEYWORDS = {
  // Severity indicators
  severity: {
    low: ['خفیف', 'کم', 'اندک', 'جزئی', 'ملایم'],
    mild: ['متوسط', 'نسبی', 'قابل تحمل'],
    medium: ['متوسط', 'معمولی', 'نرمال'],
    high: ['شدید', 'زیاد', 'قوی', 'سخت'],
    severe: ['بسیار شدید', 'غیرقابل تحمل', 'وحشتناک'],
    critical: ['فوق‌العاده شدید', 'کشنده', 'مرگبار']
  },
  
  // Time indicators
  time: {
    immediate: ['الان', 'همین الان', 'فوری', 'ناگهان', 'یکدفعه'],
    recent: ['امروز', 'دیروز', 'چند ساعت', 'صبح', 'ظهر', 'شب', 'عصر'],
    days: ['روز', 'دیروز', 'پریروز', 'چند روز'],
    weeks: ['هفته', 'چند هفته'],
    months: ['ماه', 'چند ماه'],
    chronic: ['مزمن', 'همیشه', 'مدت‌ها', 'سال‌ها', 'از بچگی']
  },
  
  // Pattern indicators
  patterns: {
    continuous: ['مداوم', 'همیشه', 'تمام وقت', 'بی‌وقفه'],
    intermittent: ['گاه به گاه', 'گاهی', 'بعضی وقت‌ها', 'موقع به موقع'],
    periodic: ['دوره‌ای', 'هر چند وقت', 'منظم'],
    triggered: ['بعد از', 'قبل از', 'هنگام', 'موقع']
  },
  
  // Location indicators
  locations: {
    head: ['سر', 'سردرد', 'مغز', 'پیشانی', 'گیجگاه'],
    chest: ['قفسه سینه', 'سینه', 'قلب', 'ریه'],
    abdomen: ['شکم', 'معده', 'روده', 'کبد'],
    back: ['کمر', 'پشت', 'ستون فقرات'],
    limbs: ['دست', 'پا', 'بازو', 'ساق']
  },
  
  // Associated symptoms
  symptoms: {
    pain: ['درد', 'ناراحتی', 'سوزش', 'کوفتگی'],
    digestive: ['تهوع', 'استفراغ', 'اسهال', 'یبوست', 'نفخ'],
    respiratory: ['تنگی نفس', 'سرفه', 'خلط', 'آسم'],
    neurological: ['سرگیجه', 'گیجی', 'تشنج', 'بی‌حسی'],
    cardiovascular: ['تپش قلب', 'فشار خون', 'ورم'],
    general: ['تب', 'لرز', 'عرق', 'خستگی', 'ضعف']
  },
  
  // Urgency indicators
  urgency: {
    high: ['فوری', 'اورژانس', 'نمی‌توانم', 'خیلی بد', 'وحشتناک'],
    emergency: ['حمله قلبی', 'سکته', 'خونریزی شدید', 'بیهوشی', 'تشنج']
  },
  
  // Emotional indicators
  emotions: {
    anxiety: ['نگران', 'استرس', 'اضطراب', 'ترس', 'وحشت'],
    depression: ['غمگین', 'افسرده', 'ناامید', 'بی‌حال'],
    pain_distress: ['درد دارم', 'اذیت می‌شوم', 'رنج می‌برم']
  }
}

// Numerical patterns for Persian and English numbers
const PERSIAN_NUMBERS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
const ENGLISH_NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

/**
 * Main function to analyze user input and extract medical context
 */
export function analyzeUserInput(input: string): InputAnalysis {
  const lowerInput = input.toLowerCase().trim()
  const words = lowerInput.split(/\s+/)
  
  // Basic metrics
  const inputLength = input.length
  const wordCount = words.length
  
  // Analyze different aspects
  const severityAnalysis = analyzeSeverity(lowerInput)
  const timeAnalysis = analyzeTimeframe(lowerInput)
  const patternAnalysis = analyzePatterns(lowerInput)
  const locationAnalysis = analyzeLocation(lowerInput)
  const symptomAnalysis = analyzeSymptoms(lowerInput)
  const urgencyAnalysis = analyzeUrgency(lowerInput)
  const emotionalAnalysis = analyzeEmotions(lowerInput)
  
  // Calculate quality scores
  const clarityScore = calculateClarityScore(lowerInput, wordCount)
  const specificityScore = calculateSpecificityScore(
    severityAnalysis.found,
    timeAnalysis.found,
    locationAnalysis.found,
    symptomAnalysis.associatedSymptoms.length
  )
  
  return {
    // Content Analysis
    hasSeverityInfo: severityAnalysis.found,
    severityLevel: severityAnalysis.level,
    hasTimeInfo: timeAnalysis.found,
    timeframe: timeAnalysis.timeframe,
    hasPatternInfo: patternAnalysis.found,
    hasAssociatedSymptoms: symptomAnalysis.associatedSymptoms.length > 0,
    hasLocationInfo: locationAnalysis.found,
    
    // Urgency Assessment
    isUrgent: urgencyAnalysis.isUrgent,
    urgencyScore: urgencyAnalysis.score,
    emergencyKeywordsFound: urgencyAnalysis.emergencyKeywords,
    
    // Context Information
    medicalTermsFound: symptomAnalysis.medicalTerms,
    symptomKeywords: symptomAnalysis.symptoms,
    emotionalIndicators: emotionalAnalysis.indicators,
    
    // Quality Metrics
    inputLength,
    clarityScore,
    specificityScore
  }
}

/**
 * Analyze severity indicators in the input
 */
function analyzeSeverity(input: string): { found: boolean; level?: SeverityLevel } {
  for (const [level, keywords] of Object.entries(MEDICAL_KEYWORDS.severity)) {
    for (const keyword of keywords) {
      if (input.includes(keyword)) {
        return { found: true, level: level as SeverityLevel }
      }
    }
  }
  
  // Check for numerical severity (1-10 scale)
  const severityMatch = input.match(/([۰-۹0-9])\s*(?:از\s*(?:۱۰|10)|تا\s*(?:۱۰|10))/);
  if (severityMatch) {
    const number = convertPersianToEnglish(severityMatch[1])
    const severity = parseInt(number)
    
    if (severity >= 1 && severity <= 10) {
      let level: SeverityLevel
      if (severity <= 2) level = 'low'
      else if (severity <= 4) level = 'mild'
      else if (severity <= 6) level = 'medium'
      else if (severity <= 8) level = 'high'
      else if (severity <= 9) level = 'severe'
      else level = 'critical'
      
      return { found: true, level }
    }
  }
  
  return { found: false }
}

/**
 * Analyze timeframe indicators in the input
 */
function analyzeTimeframe(input: string): { found: boolean; timeframe?: string } {
  for (const [category, keywords] of Object.entries(MEDICAL_KEYWORDS.time)) {
    for (const keyword of keywords) {
      if (input.includes(keyword)) {
        return { found: true, timeframe: category }
      }
    }
  }
  
  // Check for specific time patterns
  const timePatterns = [
    /(\d+|[۰-۹]+)\s*ساعت/,
    /(\d+|[۰-۹]+)\s*روز/,
    /(\d+|[۰-۹]+)\s*هفته/,
    /(\d+|[۰-۹]+)\s*ماه/
  ]
  
  for (const pattern of timePatterns) {
    const match = input.match(pattern)
    if (match) {
      return { found: true, timeframe: `specific_${match[0]}` }
    }
  }
  
  return { found: false }
}

/**
 * Analyze pattern indicators in the input
 */
function analyzePatterns(input: string): { found: boolean; pattern?: string } {
  for (const [pattern, keywords] of Object.entries(MEDICAL_KEYWORDS.patterns)) {
    for (const keyword of keywords) {
      if (input.includes(keyword)) {
        return { found: true, pattern }
      }
    }
  }
  
  return { found: false }
}

/**
 * Analyze location indicators in the input
 */
function analyzeLocation(input: string): { found: boolean; locations: string[] } {
  const foundLocations: string[] = []
  
  for (const [location, keywords] of Object.entries(MEDICAL_KEYWORDS.locations)) {
    for (const keyword of keywords) {
      if (input.includes(keyword)) {
        foundLocations.push(location)
        break
      }
    }
  }
  
  return { found: foundLocations.length > 0, locations: foundLocations }
}

/**
 * Analyze symptoms and medical terms in the input
 */
function analyzeSymptoms(input: string): {
  associatedSymptoms: string[]
  symptoms: string[]
  medicalTerms: string[]
} {
  const associatedSymptoms: string[] = []
  const symptoms: string[] = []
  const medicalTerms: string[] = []
  
  for (const [category, keywords] of Object.entries(MEDICAL_KEYWORDS.symptoms)) {
    for (const keyword of keywords) {
      if (input.includes(keyword)) {
        associatedSymptoms.push(category)
        symptoms.push(keyword)
        medicalTerms.push(keyword)
        break
      }
    }
  }
  
  return { associatedSymptoms, symptoms, medicalTerms }
}

/**
 * Analyze urgency and emergency indicators
 */
function analyzeUrgency(input: string): {
  isUrgent: boolean
  score: number
  emergencyKeywords: string[]
} {
  let urgencyScore = 0
  const emergencyKeywords: string[] = []
  
  // Check high urgency keywords
  for (const keyword of MEDICAL_KEYWORDS.urgency.high) {
    if (input.includes(keyword)) {
      urgencyScore += 30
      emergencyKeywords.push(keyword)
    }
  }
  
  // Check emergency keywords
  for (const keyword of MEDICAL_KEYWORDS.urgency.emergency) {
    if (input.includes(keyword)) {
      urgencyScore += 50
      emergencyKeywords.push(keyword)
    }
  }
  
  // Check for severity-based urgency
  if (input.includes('شدید') || input.includes('بسیار')) {
    urgencyScore += 20
  }
  
  // Check for inability expressions
  if (input.includes('نمی‌توانم') || input.includes('نمیتوانم')) {
    urgencyScore += 25
  }
  
  // Check for sudden onset
  if (input.includes('ناگهان') || input.includes('یکدفعه')) {
    urgencyScore += 20
  }
  
  return {
    isUrgent: urgencyScore >= 30,
    score: Math.min(urgencyScore, 100),
    emergencyKeywords
  }
}

/**
 * Analyze emotional indicators in the input
 */
function analyzeEmotions(input: string): { indicators: string[] } {
  const indicators: string[] = []
  
  for (const [emotion, keywords] of Object.entries(MEDICAL_KEYWORDS.emotions)) {
    for (const keyword of keywords) {
      if (input.includes(keyword)) {
        indicators.push(emotion)
        break
      }
    }
  }
  
  return { indicators }
}

/**
 * Calculate clarity score based on input characteristics
 */
function calculateClarityScore(input: string, wordCount: number): number {
  let score = 50 // Base score
  
  // Length factors
  if (wordCount >= 5 && wordCount <= 20) score += 20 // Optimal length
  else if (wordCount < 3) score -= 30 // Too short
  else if (wordCount > 30) score -= 10 // Too long
  
  // Specificity factors
  if (hasNumbers(input)) score += 15 // Contains numbers
  if (hasTimeReferences(input)) score += 10 // Has time references
  if (hasLocationReferences(input)) score += 10 // Has location references
  
  // Clarity detractors
  if (input.includes('نمی‌دانم') || input.includes('مطمئن نیستم')) score -= 20
  if (input.includes('شاید') || input.includes('احتمالاً')) score -= 10
  
  return Math.max(Math.min(score, 100), 0)
}

/**
 * Calculate specificity score based on information provided
 */
function calculateSpecificityScore(
  hasSeverity: boolean,
  hasTime: boolean,
  hasLocation: boolean,
  symptomCount: number
): number {
  let score = 0
  
  if (hasSeverity) score += 25
  if (hasTime) score += 25
  if (hasLocation) score += 20
  if (symptomCount > 0) score += 15
  if (symptomCount > 1) score += 15 // Multiple symptoms
  
  return Math.min(score, 100)
}

/**
 * Helper function to check if input contains numbers
 */
function hasNumbers(input: string): boolean {
  return /[۰-۹0-9]/.test(input)
}

/**
 * Helper function to check if input contains time references
 */
function hasTimeReferences(input: string): boolean {
  const timeWords = ['ساعت', 'روز', 'هفته', 'ماه', 'صبح', 'ظهر', 'شب', 'عصر', 'دیروز', 'امروز']
  return timeWords.some(word => input.includes(word))
}

/**
 * Helper function to check if input contains location references
 */
function hasLocationReferences(input: string): boolean {
  const allLocations = Object.values(MEDICAL_KEYWORDS.locations).flat()
  return allLocations.some(location => input.includes(location))
}

/**
 * Convert Persian numbers to English numbers
 */
function convertPersianToEnglish(text: string): string {
  let result = text
  for (let i = 0; i < PERSIAN_NUMBERS.length; i++) {
    result = result.replace(new RegExp(PERSIAN_NUMBERS[i], 'g'), ENGLISH_NUMBERS[i])
  }
  return result
}

/**
 * Get severity level from numerical score (1-10)
 */
export function getSeverityFromScore(score: number): SeverityLevel {
  if (score <= 2) return 'low'
  if (score <= 4) return 'mild'
  if (score <= 6) return 'medium'
  if (score <= 8) return 'high'
  if (score <= 9) return 'severe'
  return 'critical'
}

/**
 * Get urgency level from urgency score
 */
export function getUrgencyLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score < 20) return 'low'
  if (score < 40) return 'medium'
  if (score < 70) return 'high'
  return 'critical'
}

/**
 * Extract medical category hints from input analysis
 */
export function extractCategoryHints(analysis: InputAnalysis): string[] {
  const hints: string[] = []
  
  // Emergency indicators
  if (analysis.urgencyScore >= 70) {
    hints.push('EMERGENCY_URGENT')
  }
  
  // Medication-related
  if (analysis.medicalTermsFound.some(term => 
    ['دارو', 'قرص', 'کپسول', 'شربت', 'تزریق'].some(med => term.includes(med))
  )) {
    hints.push('MEDICATION_INQUIRY')
  }
  
  // Preventive care indicators
  if (analysis.medicalTermsFound.some(term => 
    ['پیشگیری', 'چکاپ', 'معاینه', 'واکسن'].some(prev => term.includes(prev))
  )) {
    hints.push('PREVENTIVE_CARE')
  }
  
  // Default to symptom reporting if symptoms are present
  if (analysis.hasAssociatedSymptoms || analysis.symptomKeywords.length > 0) {
    hints.push('SYMPTOM_REPORTING')
  }
  
  return hints
}
/**
 * System Configuration for 3-Stage Enhanced Medical Conversation Flow
 * 
 * This file contains all configuration settings, thresholds, and parameters
 * for the optimized progressive conversation system.
 */

import { SystemConfiguration, MedicalCategory, CategoryQuestion } from '../types/conversation'

// Main system configuration
export const SYSTEM_CONFIG: SystemConfiguration = {
  // Confidence thresholds for decision making
  confidenceThresholds: {
    high: 80,           // Proceed directly to final response
    medium: 60,         // Ask 1 additional question
    low: 40,           // Ask 2 additional questions
    aiRange: [40, 75]  // Use AI confidence assessment in this range
  },
  
  // Question limits to control conversation length
  maxQuestions: {
    smart: 2,          // Always ask 2 smart questions initially
    progressive: 2,    // Maximum 2 additional progressive questions
    total: 4          // Absolute maximum questions per conversation
  },
  
  // Emergency handling configuration
  emergencyFastTrack: true,
  emergencyBypassProgressive: true,
  emergencyResponseTimeTarget: 3, // seconds
  
  // Medical safety settings (higher baseline for healthcare)
  medicalSafetyBaseline: 60,  // Higher than general chatbots (usually 50)
  requireHighConfidenceForAdvice: true,
  
  // Feature toggles for optimization
  enableQuestionCaching: true,
  enableSmartSelection: true,
  enableProgressiveDisclosure: true,
  enablePerformanceTracking: true,
  
  // API optimization settings
  maxApiCallsPerConversation: 5,
  apiTimeoutMs: 30000,
  enableFallbackResponses: true,
  
  // UI/UX configuration
  showConfidenceIndicators: true,
  showProgressIndicators: true,
  enableQuestionSkipping: false, // Disabled for medical safety
  
  // Version and metadata
  version: '1.0.0',
  lastUpdated: new Date()
}

// Medical categories with their specific configurations
export const MEDICAL_CATEGORIES: Record<string, MedicalCategory> = {
  SYMPTOM_REPORTING: {
    id: 'SYMPTOM_REPORTING',
    name: 'گزارش علائم',
    nameEn: 'Symptom Reporting',
    description: 'بیمار علائم جسمی یا روحی خود را گزارش می‌کند',
    
    smartQuestions: [
      {
        id: 'severity_assessment',
        text: 'شدت این علائم را از ۱ تا ۱۰ چگونه ارزیابی می‌کنید؟',
        type: 'severity',
        priority: 90,
        targetedAreas: ['severity_clarification'],
        prerequisites: [],
        informationValue: 85,
        urgencyRelevance: 95,
        estimatedResponseTime: 15,
        isRequired: true,
        canSkip: false
      },
      {
        id: 'symptom_timing',
        text: 'این علائم از چه زمانی شروع شده است؟',
        type: 'timing',
        priority: 85,
        targetedAreas: ['time_clarification'],
        prerequisites: [],
        informationValue: 80,
        urgencyRelevance: 90,
        estimatedResponseTime: 20,
        isRequired: true,
        canSkip: false
      },
      {
        id: 'associated_symptoms',
        text: 'آیا علائم دیگری همراه این مشکل دارید؟',
        type: 'associated_symptoms',
        priority: 75,
        targetedAreas: ['associated_symptoms'],
        prerequisites: [],
        informationValue: 75,
        urgencyRelevance: 85,
        estimatedResponseTime: 25,
        isRequired: false,
        canSkip: true
      }
    ],
    
    progressiveQuestions: [
      {
        id: 'symptom_pattern',
        text: 'آیا این علائم مداوم است یا گاه به گاه؟',
        type: 'pattern',
        priority: 70,
        targetedAreas: ['pattern_clarification'],
        prerequisites: [],
        informationValue: 65,
        urgencyRelevance: 60,
        estimatedResponseTime: 20,
        isRequired: false,
        canSkip: true
      },
      {
        id: 'trigger_factors',
        text: 'آیا چیزی باعث بهتر یا بدتر شدن علائم می‌شود؟',
        type: 'triggers',
        priority: 60,
        targetedAreas: ['trigger_identification'],
        prerequisites: [],
        informationValue: 60,
        urgencyRelevance: 50,
        estimatedResponseTime: 30,
        isRequired: false,
        canSkip: true
      }
    ],
    
    emergencyQuestions: [
      {
        id: 'emergency_severity',
        text: 'آیا درد یا ناراحتی شما بسیار شدید است؟',
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
      'درد', 'ناراحتی', 'علائم', 'احساس', 'مشکل', 'بیماری',
      'سردرد', 'شکم درد', 'قفسه سینه', 'تنگی نفس', 'تهوع'
    ],
    secondaryKeywords: [
      'خستگی', 'ضعف', 'سرگیجه', 'تب', 'لرز', 'عرق'
    ],
    emergencyKeywords: [
      'شدید', 'ناگهان', 'فوری', 'نمی‌توانم', 'خونریزی', 'بیهوشی'
    ],
    
    confidenceThreshold: 70,
    maxQuestions: 4,
    emergencyBypass: true,
    priority: 1,
    isActive: true
  },

  EMERGENCY_URGENT: {
    id: 'EMERGENCY_URGENT',
    name: 'اورژانس',
    nameEn: 'Emergency Urgent',
    description: 'موارد اورژانسی که نیاز به مداخله فوری دارند',
    
    smartQuestions: [
      {
        id: 'emergency_nature',
        text: 'لطفاً وضعیت فعلی خود را دقیق توضیح دهید',
        type: 'clarification',
        priority: 100,
        targetedAreas: ['severity_clarification', 'time_clarification'],
        prerequisites: [],
        informationValue: 95,
        urgencyRelevance: 100,
        estimatedResponseTime: 30,
        isRequired: true,
        canSkip: false
      }
    ],
    
    progressiveQuestions: [], // No progressive questions for emergencies
    emergencyQuestions: [],
    
    primaryKeywords: [
      'اورژانس', 'فوری', 'حمله قلبی', 'سکته', 'تصادف', 'خونریزی شدید'
    ],
    secondaryKeywords: [
      'درد شدید', 'نمی‌توانم تنفس کنم', 'بیهوش شدم'
    ],
    emergencyKeywords: [
      'حمله قلبی', 'سکته مغزی', 'خونریزی شدید', 'تنگی نفس شدید',
      'درد قفسه سینه', 'از هوش رفتن', 'تشنج', 'مسمومیت'
    ],
    
    confidenceThreshold: 90, // Higher threshold for emergencies
    maxQuestions: 1,
    emergencyBypass: true,
    priority: 100,
    isActive: true
  },

  MEDICATION_INQUIRY: {
    id: 'MEDICATION_INQUIRY',
    name: 'سوال دارویی',
    nameEn: 'Medication Inquiry',
    description: 'سوالات مربوط به داروها، عوارض جانبی و تداخلات دارویی',
    
    smartQuestions: [
      {
        id: 'medication_name',
        text: 'نام دقیق داروی مورد نظر چیست؟',
        type: 'clarification',
        priority: 95,
        targetedAreas: ['medication_interaction'],
        prerequisites: [],
        informationValue: 90,
        urgencyRelevance: 70,
        estimatedResponseTime: 15,
        isRequired: true,
        canSkip: false
      },
      {
        id: 'current_medications',
        text: 'آیا در حال حاضر داروی دیگری مصرف می‌کنید؟',
        type: 'medical_history',
        priority: 80,
        targetedAreas: ['medication_interaction'],
        prerequisites: [],
        informationValue: 85,
        urgencyRelevance: 80,
        estimatedResponseTime: 25,
        isRequired: false,
        canSkip: true
      }
    ],
    
    progressiveQuestions: [
      {
        id: 'dosage_timing',
        text: 'چه مقدار و چه زمانی این دارو را مصرف کرده‌اید؟',
        type: 'clarification',
        priority: 70,
        targetedAreas: ['time_clarification'],
        prerequisites: [],
        informationValue: 70,
        urgencyRelevance: 75,
        estimatedResponseTime: 20,
        isRequired: false,
        canSkip: true
      }
    ],
    
    emergencyQuestions: [
      {
        id: 'adverse_reaction',
        text: 'آیا پس از مصرف دارو واکنش نامطلوبی داشته‌اید؟',
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
      'دارو', 'قرص', 'کپسول', 'شربت', 'تزریق', 'مصرف', 'دوز'
    ],
    secondaryKeywords: [
      'عوارض', 'تداخل', 'حساسیت', 'واکنش'
    ],
    emergencyKeywords: [
      'مسمومیت دارویی', 'واکنش شدید', 'حساسیت شدید', 'تنگی نفس بعد از دارو'
    ],
    
    confidenceThreshold: 75,
    maxQuestions: 3,
    emergencyBypass: true,
    priority: 2,
    isActive: true
  },

  PREVENTIVE_CARE: {
    id: 'PREVENTIVE_CARE',
    name: 'مراقبت پیشگیرانه',
    nameEn: 'Preventive Care',
    description: 'سوالات مربوط به پیشگیری، سبک زندگی سالم و مراقبت‌های دوره‌ای',
    
    smartQuestions: [
      {
        id: 'health_goal',
        text: 'هدف اصلی شما از این مشاوره چیست؟',
        type: 'clarification',
        priority: 80,
        targetedAreas: ['lifestyle_factors'],
        prerequisites: [],
        informationValue: 75,
        urgencyRelevance: 30,
        estimatedResponseTime: 30,
        isRequired: true,
        canSkip: false
      },
      {
        id: 'current_lifestyle',
        text: 'وضعیت فعلی سبک زندگی شما چگونه است؟',
        type: 'lifestyle',
        priority: 70,
        targetedAreas: ['lifestyle_factors'],
        prerequisites: [],
        informationValue: 70,
        urgencyRelevance: 25,
        estimatedResponseTime: 45,
        isRequired: false,
        canSkip: true
      }
    ],
    
    progressiveQuestions: [
      {
        id: 'specific_concerns',
        text: 'آیا نگرانی خاصی در مورد سلامتی خود دارید؟',
        type: 'clarification',
        priority: 60,
        targetedAreas: ['medical_history'],
        prerequisites: [],
        informationValue: 65,
        urgencyRelevance: 40,
        estimatedResponseTime: 30,
        isRequired: false,
        canSkip: true
      }
    ],
    
    emergencyQuestions: [], // No emergency questions for preventive care
    
    primaryKeywords: [
      'پیشگیری', 'سلامت', 'ورزش', 'تغذیه', 'رژیم', 'سبک زندگی'
    ],
    secondaryKeywords: [
      'چکاپ', 'معاینه', 'آزمایش', 'واکسن', 'غربالگری'
    ],
    emergencyKeywords: [], // No emergency keywords for preventive care
    
    confidenceThreshold: 60, // Lower threshold for general advice
    maxQuestions: 3,
    emergencyBypass: false,
    priority: 3,
    isActive: true
  }
}

// Performance and cost optimization settings
export const PERFORMANCE_CONFIG = {
  // API call optimization
  apiOptimization: {
    batchRequests: true,
    cacheClassifications: true,
    cacheQuestions: true,
    cacheDuration: 3600000, // 1 hour in milliseconds
  },
  
  // Response time targets
  responseTimeTargets: {
    emergency: 3000,      // 3 seconds
    urgent: 5000,         // 5 seconds
    normal: 8000,         // 8 seconds
    preventive: 10000     // 10 seconds
  },
  
  // Cost tracking
  costTracking: {
    enabled: true,
    apiCostPerCall: 0.02, // $0.02 per API call
    targetMonthlyCost: 100, // $100 per month
    alertThreshold: 0.8   // Alert at 80% of budget
  },
  
  // Quality metrics
  qualityMetrics: {
    minConfidenceForAdvice: 70,
    minInformationCompleteness: 60,
    maxUncertaintyThreshold: 30
  }
}

// Error handling and fallback configuration
export const ERROR_CONFIG = {
  // API error handling
  apiErrors: {
    maxRetries: 3,
    retryDelay: 1000, // milliseconds
    timeoutMs: 30000,
    fallbackToQuickAssessment: true
  },
  
  // Fallback responses
  fallbackResponses: {
    enabled: true,
    useGenericAdvice: true,
    alwaysRecommendDoctorVisit: true
  },
  
  // Error messages in Persian
  errorMessages: {
    apiTimeout: 'متأسفانه سرویس موقتاً در دسترس نیست. لطفاً بعداً تلاش کنید.',
    apiError: 'خطایی در پردازش درخواست شما رخ داده است.',
    networkError: 'مشکل در اتصال به اینترنت. لطفاً اتصال خود را بررسی کنید.',
    unknownError: 'خطای غیرمنتظره‌ای رخ داده است. لطفاً دوباره تلاش کنید.'
  }
}

// Development and debugging configuration
export const DEBUG_CONFIG = {
  enabled: process.env.NODE_ENV === 'development',
  logLevel: 'info', // 'debug', 'info', 'warn', 'error'
  logApiCalls: true,
  logPerformanceMetrics: true,
  logConfidenceCalculations: true,
  showDebugUI: false
}

// Export default configuration
export default SYSTEM_CONFIG
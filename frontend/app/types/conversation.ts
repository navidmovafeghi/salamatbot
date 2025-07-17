/**
 * Enhanced Type Definitions for 3-Stage Medical Conversation Flow
 * 
 * This file contains all the TypeScript interfaces and types needed for the
 * optimized progressive conversation system with smart question selection,
 * confidence assessment, and progressive disclosure.
 */

// Base conversation state interface
export interface ConversationState {
  sessionId: string
  messages: Message[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Enhanced conversation state for the new 3-stage flow
export interface OptimizedProgressiveState extends ConversationState {
  // Stage 1: Smart Classification + Emergency Fast-Track
  initialAnalysis: InputAnalysis
  medicalCategory: MedicalCategory | null
  emergencyFastTrack: boolean
  
  // Stage 2A: Smart Question Selection
  smartSelectedQuestions: string[]
  questionResponses: QuestionResponse[]
  
  // Stage 2B: Confidence Assessment
  confidenceScore: number
  confidenceMethod: 'quick' | 'ai' | 'hybrid'
  
  // Stage 2C: Progressive Questions
  additionalQuestionsNeeded: number
  targetedQuestionAreas: string[]
  progressiveQuestions: string[]
  
  // Flow Control
  phase: ConversationPhase
  informationCompleteness: number
  canProceedToFinalResponse: boolean
  
  // Performance Tracking
  apiCallsUsed: number
  processingTimeMs: number
  costEstimate: number
}

// Conversation flow phases
export type ConversationPhase = 
  | 'INITIAL_INPUT'
  | 'SMART_CLASSIFICATION' 
  | 'SMART_SELECTION'
  | 'CONFIDENCE_ASSESSMENT'
  | 'PROGRESSIVE_QUESTIONS'
  | 'FINAL_RESPONSE'
  | 'COMPLETE'
  | 'EMERGENCY_FAST_TRACK'

// Input analysis results from Stage 1
export interface InputAnalysis {
  // Content Analysis
  hasSeverityInfo: boolean
  severityLevel?: SeverityLevel
  hasTimeInfo: boolean
  timeframe?: string
  hasPatternInfo: boolean
  hasAssociatedSymptoms: boolean
  hasLocationInfo: boolean
  
  // Urgency Assessment
  isUrgent: boolean
  urgencyScore: number // 0-100
  emergencyKeywordsFound: string[]
  
  // Context Information
  medicalTermsFound: string[]
  symptomKeywords: string[]
  emotionalIndicators: string[]
  
  // Quality Metrics
  inputLength: number
  clarityScore: number // 0-100
  specificityScore: number // 0-100
}

// Severity levels for medical conditions
export type SeverityLevel = 'low' | 'mild' | 'medium' | 'high' | 'severe' | 'critical'

// Medical categories for targeted questioning
export interface MedicalCategory {
  id: string
  name: string
  nameEn: string
  description: string
  
  // Question Sets
  smartQuestions: CategoryQuestion[]
  progressiveQuestions: CategoryQuestion[]
  emergencyQuestions: CategoryQuestion[]
  
  // Keywords and Patterns
  primaryKeywords: string[]
  secondaryKeywords: string[]
  emergencyKeywords: string[]
  
  // Category Configuration
  confidenceThreshold: number
  maxQuestions: number
  emergencyBypass: boolean
  
  // Metadata
  priority: number
  isActive: boolean
}

// Question structure for different categories
export interface CategoryQuestion {
  id: string
  text: string
  type: QuestionType
  priority: number
  
  // Targeting
  targetedAreas: string[]
  prerequisites: string[]
  
  // Scoring
  informationValue: number // How much this question improves understanding
  urgencyRelevance: number // How relevant for urgent cases
  
  // Metadata
  estimatedResponseTime: number // seconds
  isRequired: boolean
  canSkip: boolean
}

// Types of questions
export type QuestionType = 
  | 'severity'
  | 'timing'
  | 'location'
  | 'pattern'
  | 'associated_symptoms'
  | 'triggers'
  | 'medical_history'
  | 'medications'
  | 'lifestyle'
  | 'clarification'

// Question response tracking
export interface QuestionResponse {
  questionId: string
  questionText: string
  response: string
  timestamp: Date
  
  // Response Analysis
  responseLength: number
  containsUncertainty: boolean
  informationValue: number
  clarityScore: number
  
  // Processing
  processingTimeMs: number
  confidenceContribution: number
}

// Confidence assessment results
export interface ConfidenceAssessment {
  score: number // 0-100
  method: 'quick' | 'ai' | 'hybrid'
  
  // Breakdown
  quickAssessmentScore: number
  aiAssessmentScore?: number
  hybridAdjustment?: number
  
  // Factors
  informationCompleteness: number
  responseQuality: number
  medicalSafetyFactor: number
  uncertaintyPenalty: number
  
  // Metadata
  calculatedAt: Date
  processingTimeMs: number
  apiCallsUsed: number
  
  // Recommendations
  needsMoreQuestions: boolean
  suggestedQuestionCount: number
  targetedAreas: string[]
}

// Uncertainty areas for progressive questioning
export type UncertaintyArea = 
  | 'severity_clarification'
  | 'time_clarification'
  | 'location_clarification'
  | 'pattern_clarification'
  | 'associated_symptoms'
  | 'trigger_identification'
  | 'medical_history'
  | 'medication_interaction'
  | 'lifestyle_factors'
  | 'symptom_progression'

// Progressive question selection result
export interface ProgressiveQuestionSelection {
  questions: CategoryQuestion[]
  targetedAreas: UncertaintyArea[]
  reasoning: string
  expectedConfidenceImprovement: number
  estimatedTotalTime: number
}

// Emergency fast-track result
export interface EmergencyAssessment {
  isEmergency: boolean
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
  emergencyType: string
  
  // Fast-track decision
  bypassProgressive: boolean
  immediateResponse: boolean
  
  // Emergency indicators
  keywordsFound: string[]
  severityIndicators: string[]
  timeFactors: string[]
  
  // Actions
  recommendedActions: string[]
  emergencyContacts: string[]
  
  // Metadata
  assessedAt: Date
  processingTimeMs: number
}

// System performance metrics
export interface PerformanceMetrics {
  conversationId: string
  
  // API Usage
  totalApiCalls: number
  apiCallsByStage: Record<ConversationPhase, number>
  totalCost: number
  
  // Timing
  totalProcessingTime: number
  stageTimings: Record<ConversationPhase, number>
  averageResponseTime: number
  
  // Quality
  finalConfidenceScore: number
  informationCompleteness: number
  userSatisfactionScore?: number
  
  // Efficiency
  questionsAsked: number
  questionsSkipped: number
  emergencyBypass: boolean
  
  // Metadata
  startedAt: Date
  completedAt: Date
  version: string
}

// Enhanced message interface (extends existing Message)
export interface EnhancedMessage {
  id: string
  text: string
  type: 'user' | 'bot' | 'system'
  timestamp: Date
  
  // Enhanced properties
  isLoading?: boolean
  isError?: boolean
  isEmergency?: boolean
  
  // New properties for enhanced flow
  messageType?: MessageType
  confidenceScore?: number
  informationValue?: number
  processingTimeMs?: number
  
  // Question-specific properties
  questionId?: string
  questionType?: QuestionType
  isProgressiveQuestion?: boolean
  
  // Response metadata
  responseMetadata?: {
    method: string
    apiCallsUsed: number
    costEstimate: number
    informationCompleteness: number
  }
}

// Message types for the enhanced system
export type MessageType = 
  | 'initial_input'
  | 'smart_question'
  | 'progressive_question'
  | 'clarification_request'
  | 'confidence_check'
  | 'final_response'
  | 'emergency_response'
  | 'system_message'
  | 'error_message'

// Configuration for the enhanced system
export interface SystemConfiguration {
  // Confidence thresholds
  confidenceThresholds: {
    high: number        // Proceed to final response
    medium: number      // Ask 1 more question
    low: number         // Ask 2 more questions
    aiRange: [number, number]  // Use AI for this range
  }
  
  // Question limits
  maxQuestions: {
    smart: number       // Always ask this many smart questions
    progressive: number // Max additional questions
    total: number       // Absolute maximum
  }
  
  // Emergency handling
  emergencyFastTrack: boolean
  emergencyBypassProgressive: boolean
  emergencyResponseTimeTarget: number // seconds
  
  // Medical safety
  medicalSafetyBaseline: number  // Higher than general chatbots
  requireHighConfidenceForAdvice: boolean
  
  // Performance optimization
  enableQuestionCaching: boolean
  enableSmartSelection: boolean
  enableProgressiveDisclosure: boolean
  enablePerformanceTracking: boolean
  
  // API optimization
  maxApiCallsPerConversation: number
  apiTimeoutMs: number
  enableFallbackResponses: boolean
  
  // UI/UX
  showConfidenceIndicators: boolean
  showProgressIndicators: boolean
  enableQuestionSkipping: boolean
  
  // Version and metadata
  version: string
  lastUpdated: Date
}

// Export default configuration
export const DEFAULT_SYSTEM_CONFIG: SystemConfiguration = {
  confidenceThresholds: {
    high: 80,
    medium: 60,
    low: 40,
    aiRange: [40, 75]
  },
  maxQuestions: {
    smart: 2,
    progressive: 2,
    total: 4
  },
  emergencyFastTrack: true,
  emergencyBypassProgressive: true,
  emergencyResponseTimeTarget: 3,
  medicalSafetyBaseline: 60,
  requireHighConfidenceForAdvice: true,
  enableQuestionCaching: true,
  enableSmartSelection: true,
  enableProgressiveDisclosure: true,
  enablePerformanceTracking: true,
  maxApiCallsPerConversation: 5,
  apiTimeoutMs: 30000,
  enableFallbackResponses: true,
  showConfidenceIndicators: true,
  showProgressIndicators: true,
  enableQuestionSkipping: false,
  version: '1.0.0',
  lastUpdated: new Date()
}
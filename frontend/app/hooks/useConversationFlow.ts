/**
 * Enhanced Conversation Flow Hook for 3-Stage Medical Conversation System
 * 
 * This hook manages the complete conversation flow through the 3 stages:
 * Stage 1: Smart Classification + Emergency Fast-Track
 * Stage 2: Optimized Information Gathering (Smart Questions + Confidence + Progressive)
 * Stage 3: Comprehensive Final Response
 */

import { useState, useCallback, useRef } from 'react'
import { 
  OptimizedProgressiveState, 
  ConversationPhase, 
  InputAnalysis, 
  MedicalCategory,
  ConfidenceAssessment,
  PerformanceMetrics,
  EmergencyAssessment,
  ProgressiveQuestionSelection
} from '../types/conversation'
import { Message } from '../page'
import { analyzeUserInput, extractCategoryHints } from '../lib/inputAnalysis'
import { classifyMedicalCategory } from '../lib/medicalCategories'
import { selectOptimalQuestions, identifyUncertaintyAreas } from '../lib/questionSelection'
import { assessEmergencyLevel } from '../lib/prompts'
import { SYSTEM_CONFIG } from '../lib/systemConfig'

/**
 * Enhanced conversation flow hook
 */
export const useConversationFlow = () => {
  // Enhanced conversation state
  const [conversationState, setConversationState] = useState<OptimizedProgressiveState>({
    sessionId: '',
    messages: [],
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    
    // Stage 1: Smart Classification
    initialAnalysis: {} as InputAnalysis,
    medicalCategory: null,
    emergencyFastTrack: false,
    
    // Stage 2A: Smart Question Selection
    smartSelectedQuestions: [],
    questionResponses: [],
    
    // Stage 2B: Confidence Assessment
    confidenceScore: 0,
    confidenceMethod: 'quick',
    
    // Stage 2C: Progressive Questions
    additionalQuestionsNeeded: 0,
    targetedQuestionAreas: [],
    progressiveQuestions: [],
    
    // Flow Control
    phase: 'INITIAL_INPUT',
    informationCompleteness: 0,
    canProceedToFinalResponse: false,
    
    // Performance Tracking
    apiCallsUsed: 0,
    processingTimeMs: 0,
    costEstimate: 0
  })

  // Performance tracking
  const performanceRef = useRef<PerformanceMetrics>({
    conversationId: '',
    totalApiCalls: 0,
    apiCallsByStage: {} as Record<ConversationPhase, number>,
    totalCost: 0,
    totalProcessingTime: 0,
    stageTimings: {} as Record<ConversationPhase, number>,
    averageResponseTime: 0,
    finalConfidenceScore: 0,
    informationCompleteness: 0,
    questionsAsked: 0,
    questionsSkipped: 0,
    emergencyBypass: false,
    startedAt: new Date(),
    completedAt: new Date(),
    version: SYSTEM_CONFIG.version
  })

  /**
   * Initialize new conversation
   */
  const initializeConversation = useCallback((sessionId: string) => {
    const now = new Date()
    
    setConversationState({
      sessionId,
      messages: [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
      
      initialAnalysis: {} as InputAnalysis,
      medicalCategory: null,
      emergencyFastTrack: false,
      
      smartSelectedQuestions: [],
      questionResponses: [],
      
      confidenceScore: 0,
      confidenceMethod: 'quick',
      
      additionalQuestionsNeeded: 0,
      targetedQuestionAreas: [],
      progressiveQuestions: [],
      
      phase: 'INITIAL_INPUT',
      informationCompleteness: 0,
      canProceedToFinalResponse: false,
      
      apiCallsUsed: 0,
      processingTimeMs: 0,
      costEstimate: 0
    })

    // Reset performance tracking
    performanceRef.current = {
      conversationId: sessionId,
      totalApiCalls: 0,
      apiCallsByStage: {} as Record<ConversationPhase, number>,
      totalCost: 0,
      totalProcessingTime: 0,
      stageTimings: {} as Record<ConversationPhase, number>,
      averageResponseTime: 0,
      finalConfidenceScore: 0,
      informationCompleteness: 0,
      questionsAsked: 0,
      questionsSkipped: 0,
      emergencyBypass: false,
      startedAt: now,
      completedAt: new Date(),
      version: SYSTEM_CONFIG.version
    }
  }, [])

  /**
   * Process initial user input (Stage 1: Smart Classification)
   */
  const processInitialInput = useCallback(async (userInput: string): Promise<{
    shouldProceedToQuestions: boolean
    emergencyResponse?: string
    selectedQuestions?: string[]
  }> => {
    const startTime = Date.now()
    
    try {
      // Step 1: Analyze user input
      const inputAnalysis = analyzeUserInput(userInput)
      
      // Step 2: Emergency assessment
      const emergencyAssessment = assessEmergencyLevel(userInput)
      
      // Step 3: Medical category classification
      const categoryResult = await classifyMedicalCategory(userInput, inputAnalysis)
      
      // Update conversation state
      setConversationState(prev => ({
        ...prev,
        initialAnalysis: inputAnalysis,
        medicalCategory: categoryResult.category,
        emergencyFastTrack: emergencyAssessment.bypassProgressive,
        phase: emergencyAssessment.immediateResponse ? 'EMERGENCY_FAST_TRACK' : 'SMART_CLASSIFICATION',
        updatedAt: new Date()
      }))

      // Track performance
      const processingTime = Date.now() - startTime
      performanceRef.current.totalProcessingTime += processingTime
      performanceRef.current.totalApiCalls += 1
      performanceRef.current.apiCallsByStage['SMART_CLASSIFICATION'] = 1

      // Emergency fast-track
      if (emergencyAssessment.immediateResponse) {
        performanceRef.current.emergencyBypass = true
        return {
          shouldProceedToQuestions: false,
          emergencyResponse: generateEmergencyResponse(emergencyAssessment)
        }
      }

      // Proceed to smart question selection
      if (categoryResult.category) {
        const questionSelection = selectOptimalQuestions(
          categoryResult.category,
          inputAnalysis,
          SYSTEM_CONFIG.maxQuestions.smart
        )

        setConversationState(prev => ({
          ...prev,
          smartSelectedQuestions: questionSelection.questions.map(q => q.text),
          targetedQuestionAreas: questionSelection.uncertaintyAreas,
          phase: 'SMART_SELECTION',
          informationCompleteness: calculateInformationCompleteness(inputAnalysis)
        }))

        return {
          shouldProceedToQuestions: true,
          selectedQuestions: questionSelection.questions.map(q => q.text)
        }
      }

      return { shouldProceedToQuestions: false }

    } catch (error) {
      console.error('Error in processInitialInput:', error)
      return { shouldProceedToQuestions: false }
    }
  }, [])

  /**
   * Process question response and update conversation state
   */
  const processQuestionResponse = useCallback((questionText: string, response: string) => {
    const now = new Date()
    
    setConversationState(prev => {
      const newQuestionResponse = {
        questionId: `q_${Date.now()}`,
        questionText,
        response,
        timestamp: now,
        responseLength: response.length,
        containsUncertainty: /نمی‌دانم|مطمئن نیستم|شاید/.test(response),
        informationValue: calculateResponseInformationValue(response),
        clarityScore: calculateResponseClarity(response),
        processingTimeMs: 0,
        confidenceContribution: 0
      }

      const updatedResponses = [...prev.questionResponses, newQuestionResponse]
      
      return {
        ...prev,
        questionResponses: updatedResponses,
        updatedAt: now
      }
    })

    performanceRef.current.questionsAsked += 1
  }, [])

  /**
   * Calculate confidence score based on collected responses
   */
  const calculateConfidenceScore = useCallback((): ConfidenceAssessment => {
    const responses = conversationState.questionResponses
    const analysis = conversationState.initialAnalysis
    
    // Quick confidence calculation
    let quickScore = SYSTEM_CONFIG.medicalSafetyBaseline // Start with medical safety baseline
    
    // Response quality factors
    const avgResponseLength = responses.reduce((sum, r) => sum + r.responseLength, 0) / responses.length
    if (avgResponseLength > 15) quickScore += 15
    if (avgResponseLength < 5) quickScore -= 20

    // Information completeness
    const completeness = conversationState.informationCompleteness
    quickScore += (completeness / 100) * 20

    // Uncertainty penalty
    const uncertainResponses = responses.filter(r => r.containsUncertainty).length
    quickScore -= uncertainResponses * 10

    // Emergency category penalty (need higher confidence)
    if (conversationState.medicalCategory?.id === 'EMERGENCY_URGENT') {
      quickScore -= 15
    }

    const finalScore = Math.max(Math.min(quickScore, 100), 20)

    return {
      score: finalScore,
      method: 'quick',
      quickAssessmentScore: finalScore,
      informationCompleteness: completeness,
      responseQuality: avgResponseLength > 10 ? 80 : 60,
      medicalSafetyFactor: SYSTEM_CONFIG.medicalSafetyBaseline,
      uncertaintyPenalty: uncertainResponses * 10,
      calculatedAt: new Date(),
      processingTimeMs: 0,
      apiCallsUsed: 0,
      needsMoreQuestions: finalScore < SYSTEM_CONFIG.confidenceThresholds.medium,
      suggestedQuestionCount: finalScore < SYSTEM_CONFIG.confidenceThresholds.low ? 2 : 1,
      targetedAreas: conversationState.targetedQuestionAreas
    }
  }, [conversationState])

  /**
   * Determine if progressive questions are needed
   */
  const shouldAskProgressiveQuestions = useCallback((): {
    needed: boolean
    questions: string[]
    reasoning: string
  } => {
    const confidence = calculateConfidenceScore()
    const category = conversationState.medicalCategory

    if (!category || confidence.score >= SYSTEM_CONFIG.confidenceThresholds.high) {
      return {
        needed: false,
        questions: [],
        reasoning: 'اطمینان کافی برای ارائه پاسخ نهایی'
      }
    }

    if (conversationState.emergencyFastTrack) {
      return {
        needed: false,
        questions: [],
        reasoning: 'مسیر اورژانسی - عدم نیاز به سوالات اضافی'
      }
    }

    const questionsNeeded = confidence.suggestedQuestionCount
    const uncertaintyAreas = conversationState.targetedQuestionAreas

    // Generate progressive questions
    const progressiveQuestions = generateProgressiveQuestions(
      category,
      uncertaintyAreas,
      questionsNeeded
    )

    return {
      needed: progressiveQuestions.length > 0,
      questions: progressiveQuestions.map(q => q.text),
      reasoning: `اطمینان ${confidence.score}% - نیاز به ${questionsNeeded} سوال اضافی`
    }
  }, [conversationState, calculateConfidenceScore])

  /**
   * Advance to next phase
   */
  const advanceToNextPhase = useCallback(() => {
    setConversationState(prev => {
      let nextPhase: ConversationPhase = prev.phase

      switch (prev.phase) {
        case 'INITIAL_INPUT':
          nextPhase = 'SMART_CLASSIFICATION'
          break
        case 'SMART_CLASSIFICATION':
          nextPhase = 'SMART_SELECTION'
          break
        case 'SMART_SELECTION':
          nextPhase = 'CONFIDENCE_ASSESSMENT'
          break
        case 'CONFIDENCE_ASSESSMENT':
          const confidence = calculateConfidenceScore()
          nextPhase = confidence.needsMoreQuestions ? 'PROGRESSIVE_QUESTIONS' : 'FINAL_RESPONSE'
          break
        case 'PROGRESSIVE_QUESTIONS':
          nextPhase = 'FINAL_RESPONSE'
          break
        case 'FINAL_RESPONSE':
          nextPhase = 'COMPLETE'
          break
        case 'EMERGENCY_FAST_TRACK':
          nextPhase = 'COMPLETE'
          break
      }

      return {
        ...prev,
        phase: nextPhase,
        updatedAt: new Date()
      }
    })
  }, [calculateConfidenceScore])

  /**
   * Check if conversation is ready for final response
   */
  const isReadyForFinalResponse = useCallback((): boolean => {
    const confidence = calculateConfidenceScore()
    const hasMinimumQuestions = conversationState.questionResponses.length >= 1
    const isEmergency = conversationState.emergencyFastTrack
    
    return (
      confidence.score >= SYSTEM_CONFIG.confidenceThresholds.medium ||
      isEmergency ||
      (hasMinimumQuestions && confidence.score >= SYSTEM_CONFIG.confidenceThresholds.low)
    )
  }, [conversationState, calculateConfidenceScore])

  /**
   * Get conversation summary for final response
   */
  const getConversationSummary = useCallback(() => {
    const confidence = calculateConfidenceScore()
    
    return {
      category: conversationState.medicalCategory,
      initialAnalysis: conversationState.initialAnalysis,
      questionResponses: conversationState.questionResponses,
      confidence,
      informationCompleteness: conversationState.informationCompleteness,
      emergencyFastTrack: conversationState.emergencyFastTrack,
      phase: conversationState.phase,
      performance: performanceRef.current
    }
  }, [conversationState, calculateConfidenceScore])

  /**
   * Reset conversation state
   */
  const resetConversation = useCallback(() => {
    setConversationState(prev => ({
      ...prev,
      messages: [],
      isActive: false,
      phase: 'INITIAL_INPUT',
      smartSelectedQuestions: [],
      questionResponses: [],
      confidenceScore: 0,
      informationCompleteness: 0,
      canProceedToFinalResponse: false,
      updatedAt: new Date()
    }))
  }, [])

  return {
    // State
    conversationState,
    performanceMetrics: performanceRef.current,
    
    // Actions
    initializeConversation,
    processInitialInput,
    processQuestionResponse,
    calculateConfidenceScore,
    shouldAskProgressiveQuestions,
    advanceToNextPhase,
    isReadyForFinalResponse,
    getConversationSummary,
    resetConversation,
    
    // Computed values
    currentPhase: conversationState.phase,
    isEmergency: conversationState.emergencyFastTrack,
    questionsAsked: conversationState.questionResponses.length,
    canProceedToFinal: isReadyForFinalResponse()
  }
}

// Helper functions

function generateEmergencyResponse(assessment: EmergencyAssessment): string {
  return `⚠️ وضعیت اورژانسی شناسایی شد\n\n${assessment.recommendedActions.join('\n')}`
}

function calculateInformationCompleteness(analysis: InputAnalysis): number {
  let score = 0
  if (analysis.hasSeverityInfo) score += 25
  if (analysis.hasTimeInfo) score += 25
  if (analysis.hasLocationInfo) score += 20
  if (analysis.hasAssociatedSymptoms) score += 20
  if (analysis.hasPatternInfo) score += 10
  return Math.min(score, 100)
}

function calculateResponseInformationValue(response: string): number {
  let value = 50 // Base value
  
  if (response.length > 20) value += 20
  if (response.length < 5) value -= 30
  if (/\d/.test(response)) value += 15 // Contains numbers
  if (/شدید|خفیف|متوسط/.test(response)) value += 20 // Contains severity
  if (/ساعت|روز|هفته/.test(response)) value += 15 // Contains time
  
  return Math.max(Math.min(value, 100), 0)
}

function calculateResponseClarity(response: string): number {
  let clarity = 70 // Base clarity
  
  if (response.includes('نمی‌دانم')) clarity -= 30
  if (response.includes('مطمئن نیستم')) clarity -= 20
  if (response.includes('شاید')) clarity -= 15
  if (response.length > 10 && response.length < 100) clarity += 20
  
  return Math.max(Math.min(clarity, 100), 0)
}

function generateProgressiveQuestions(
  category: MedicalCategory,
  uncertaintyAreas: string[],
  count: number
): Array<{ text: string; type: string }> {
  // This would use the progressive questions from the category
  // For now, return empty array - will be implemented with question generator
  return []
}
import { useState, useCallback } from 'react'
import { Message } from '../page'
import { useConversationFlow } from './useConversationFlow'
import { ConversationPhase } from '../types/conversation'

/**
 * Enhanced Custom hook for managing chat messages and API communication
 * Now integrates with the 3-stage conversation flow system
 */
export const useChatManager = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [pendingQuestions, setPendingQuestions] = useState<string[]>([])
  
  // Integration with conversation flow
  const conversationFlow = useConversationFlow()

  // Function to clear conversation history
  const clearMessages = () => {
    setMessages([])
  }

  // Function to load messages from session
  const loadMessages = (sessionMessages: Message[]) => {
    setMessages(sessionMessages)
  }

  // Enhanced function to send message with 3-stage flow
  const handleSendMessage = useCallback(async (text: string) => {
    // Prevent sending if already loading
    if (isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      type: 'user',
      timestamp: new Date(),
      messageType: getMessageType()
    }

    // Add user message
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Determine conversation phase and handle accordingly
      const currentPhase = conversationFlow.currentPhase

      if (currentPhase === 'INITIAL_INPUT') {
        await handleInitialInput(text)
      } else if (currentPhase === 'SMART_SELECTION' || currentPhase === 'PROGRESSIVE_QUESTIONS') {
        await handleQuestionResponse(text)
      } else {
        await handleRegularMessage(text)
      }

    } catch (error) {
      console.error('Error in handleSendMessage:', error)
      addErrorMessage('متأسفانه خطایی در ارتباط رخ داده است. لطفاً دوباره تلاش کنید.')
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, conversationFlow.currentPhase, messages])

  // Handle initial user input (Stage 1: Smart Classification)
  const handleInitialInput = useCallback(async (text: string) => {
    // Initialize conversation if not already done
    if (!conversationFlow.conversationState.isActive) {
      conversationFlow.initializeConversation(Date.now().toString())
    }

    addLoadingMessage('در حال تحلیل پیام شما...')

    // Process initial input through conversation flow
    const result = await conversationFlow.processInitialInput(text)

    // Remove loading message
    removeLoadingMessages()

    if (result.emergencyResponse) {
      // Emergency fast-track response
      addBotMessage(result.emergencyResponse, {
        messageType: 'emergency_response',
        isEmergency: true
      })
      conversationFlow.advanceToNextPhase()
    } else if (result.shouldProceedToQuestions && result.selectedQuestions) {
      // Start smart questioning
      setPendingQuestions(result.selectedQuestions)
      setCurrentQuestionIndex(0)
      askNextQuestion(result.selectedQuestions, 0)
    } else {
      // Fallback to regular API call
      await handleRegularMessage(text)
    }
  }, [conversationFlow])

  // Handle question responses (Stage 2: Information Gathering)
  const handleQuestionResponse = useCallback(async (response: string) => {
    const currentQuestion = pendingQuestions[currentQuestionIndex]
    
    if (currentQuestion) {
      // Process the response
      conversationFlow.processQuestionResponse(currentQuestion, response)
      
      // Check if we have more questions to ask
      const nextIndex = currentQuestionIndex + 1
      
      if (nextIndex < pendingQuestions.length) {
        // Ask next question
        setCurrentQuestionIndex(nextIndex)
        addLoadingMessage('در حال آماده‌سازی سوال بعدی...')
        
        setTimeout(() => {
          removeLoadingMessages()
          askNextQuestion(pendingQuestions, nextIndex)
        }, 1000)
        
      } else {
        // All smart questions answered, check confidence
        addLoadingMessage('در حال ارزیابی اطلاعات جمع‌آوری شده...')
        
        setTimeout(async () => {
          removeLoadingMessages()
          await handleConfidenceAssessment()
        }, 1500)
      }
    }
  }, [pendingQuestions, currentQuestionIndex, conversationFlow])

  // Handle confidence assessment and progressive questions
  const handleConfidenceAssessment = useCallback(async () => {
    const progressiveResult = conversationFlow.shouldAskProgressiveQuestions()
    
    if (progressiveResult.needed) {
      // Ask progressive questions
      addBotMessage(`${progressiveResult.reasoning}\n\nسوالات تکمیلی:`)
      setPendingQuestions(progressiveResult.questions)
      setCurrentQuestionIndex(0)
      conversationFlow.advanceToNextPhase() // Move to PROGRESSIVE_QUESTIONS
      
      setTimeout(() => {
        askNextQuestion(progressiveResult.questions, 0)
      }, 500)
      
    } else {
      // Ready for final response
      await generateFinalResponse()
    }
  }, [conversationFlow])

  // Generate final comprehensive response (Stage 3)
  const generateFinalResponse = useCallback(async () => {
    addLoadingMessage('در حال تهیه پاسخ جامع...')
    
    try {
      const summary = conversationFlow.getConversationSummary()
      
      // Prepare comprehensive context for API
      const conversationHistory = messages
        .filter(msg => !msg.isLoading)
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.text
        }))

      const enhancedContext = {
        initialInput: summary.initialAnalysis,
        category: summary.category,
        questionResponses: summary.questionResponses,
        confidence: summary.confidence,
        informationCompleteness: summary.informationCompleteness,
        conversationHistory
      }

      // Call enhanced API for final response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'GENERATE_FINAL_RESPONSE',
          enhancedContext,
          conversationHistory
        })
      })

      const data = await response.json()
      
      removeLoadingMessages()
      
      // Add final response with metadata
      addBotMessage(data.response || 'پاسخ جامع آماده نشد.', {
        messageType: 'final_response',
        confidenceScore: summary.confidence.score,
        informationValue: summary.informationCompleteness,
        responseMetadata: {
          method: 'enhanced_3_stage',
          apiCallsUsed: summary.performance.totalApiCalls,
          costEstimate: summary.performance.totalCost,
          informationCompleteness: summary.informationCompleteness
        }
      })
      
      conversationFlow.advanceToNextPhase() // Move to COMPLETE
      
    } catch (error) {
      removeLoadingMessages()
      addErrorMessage('خطا در تولید پاسخ نهایی. لطفاً دوباره تلاش کنید.')
    }
  }, [conversationFlow, messages])

  // Fallback to regular API call for non-flow messages
  const handleRegularMessage = useCallback(async (text: string) => {
    addLoadingMessage('در حال فکر کردن...')

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.text
      }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          conversationHistory
        })
      })

      const data = await response.json()
      
      removeLoadingMessages()
      
      addBotMessage(data.response || data.error || 'خطایی رخ داده است.', {
        isError: !response.ok,
        isEmergency: data.isEmergency || false
      })

    } catch (error) {
      removeLoadingMessages()
      addErrorMessage('متأسفانه خطایی در ارتباط رخ داده است. لطفاً دوباره تلاش کنید.')
    }
  }, [messages])

  // Helper functions for message management
  const addLoadingMessage = useCallback((text: string) => {
    const loadingMessage: Message = {
      id: `loading_${Date.now()}`,
      text,
      type: 'bot',
      timestamp: new Date(),
      isLoading: true,
      messageType: 'system_message'
    }
    setMessages(prev => [...prev, loadingMessage])
  }, [])

  const removeLoadingMessages = useCallback(() => {
    setMessages(prev => prev.filter(msg => !msg.isLoading))
  }, [])

  const addBotMessage = useCallback((text: string, options: Partial<Message> = {}) => {
    const botMessage: Message = {
      id: Date.now().toString(),
      text,
      type: 'bot',
      timestamp: new Date(),
      ...options
    }
    setMessages(prev => [...prev, botMessage])
  }, [])

  const addErrorMessage = useCallback((text: string) => {
    addBotMessage(text, { isError: true, messageType: 'error_message' })
  }, [addBotMessage])

  const askNextQuestion = useCallback((questions: string[], index: number) => {
    if (index < questions.length) {
      const questionText = questions[index]
      addBotMessage(questionText, {
        messageType: conversationFlow.currentPhase === 'SMART_SELECTION' ? 'smart_question' : 'progressive_question',
        questionId: `q_${index}`,
        isProgressiveQuestion: conversationFlow.currentPhase === 'PROGRESSIVE_QUESTIONS'
      })
    }
  }, [conversationFlow.currentPhase, addBotMessage])

  const getMessageType = useCallback(() => {
    switch (conversationFlow.currentPhase) {
      case 'INITIAL_INPUT':
        return 'initial_input'
      case 'SMART_SELECTION':
      case 'PROGRESSIVE_QUESTIONS':
        return 'user'
      default:
        return 'user'
    }
  }, [conversationFlow.currentPhase])

  // Computed values
  const hasExistingChat = messages.length > 0

  return {
    // State
    messages,
    isLoading,
    hasExistingChat,
    
    // Enhanced conversation flow state
    conversationFlow,
    currentPhase: conversationFlow.currentPhase,
    isEmergency: conversationFlow.isEmergency,
    questionsAsked: conversationFlow.questionsAsked,
    canProceedToFinal: conversationFlow.canProceedToFinal,
    pendingQuestions,
    currentQuestionIndex,
    
    // Actions
    clearMessages,
    loadMessages,
    handleSendMessage,
    setMessages,
    
    // Enhanced actions
    resetConversation: () => {
      clearMessages()
      conversationFlow.resetConversation()
      setPendingQuestions([])
      setCurrentQuestionIndex(0)
    },
    
    // Conversation flow actions
    initializeConversation: conversationFlow.initializeConversation,
    getConversationSummary: conversationFlow.getConversationSummary,
    calculateConfidenceScore: conversationFlow.calculateConfidenceScore,
    
    // Helper functions
    addLoadingMessage,
    removeLoadingMessages,
    addBotMessage,
    addErrorMessage,
  }
}
import { useState, KeyboardEvent, useRef, useEffect } from 'react'
import { useAppContext } from '../contexts'
import ProgressiveQuestionCard from './ProgressiveQuestionCard'
import { CategoryQuestion, ProgressiveQuestionContext } from '../types/conversation'

export default function ChatForm() {
  // Get all needed data from context
  const {
    isChatMode,
    hasExistingChat,
    isReturnHomeMode,
    isLoading,
    handleSendMessage,
    continueChat,
    toggleHistoryMenu,
  } = useAppContext()
  const [inputValue, setInputValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Progressive questioning state
  const [showProgressiveQuestions, setShowProgressiveQuestions] = useState(false)
  const [progressiveQuestions, setProgressiveQuestions] = useState<CategoryQuestion[]>([])
  const [progressiveContext, setProgressiveContext] = useState<ProgressiveQuestionContext | undefined>()
  const [currentRound, setCurrentRound] = useState(1)
  const [totalRounds, setTotalRounds] = useState(1)
  const [questionsAsked, setQuestionsAsked] = useState(0)
  const [isProgressiveLoading, setIsProgressiveLoading] = useState(false)

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const scrollHeight = textarea.scrollHeight
      const maxHeight = 120 // Max height in pixels
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [inputValue])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
  }

  const sendMessage = async () => {
    const trimmedMessage = inputValue.trim()
    if (trimmedMessage && !isLoading) {
      setInputValue('')
      await handleSendMessage(trimmedMessage)
      
      // Check if we should show progressive questions after sending
      // This would be determined by the response metadata
      checkForProgressiveQuestions()
    }
  }

  // Check if progressive questions should be shown
  const checkForProgressiveQuestions = () => {
    // This would typically be triggered by the API response
    // For now, we'll simulate the logic
    // In real implementation, this would be called when the API indicates
    // that progressive questions are needed
  }

  // Handle progressive question answers
  const handleProgressiveAnswers = async (answers: string[]) => {
    setIsProgressiveLoading(true)
    
    try {
      // Combine answers into a single message
      const combinedMessage = answers
        .map((answer, index) => `سوال ${index + 1}: ${answer}`)
        .join('\n\n')
      
      // Send the progressive answers
      await handleSendMessage(combinedMessage)
      
      // Update state
      setQuestionsAsked(prev => prev + answers.length)
      setCurrentRound(prev => prev + 1)
      
      // Hide progressive questions for now
      setShowProgressiveQuestions(false)
      
    } catch (error) {
      console.error('Error handling progressive answers:', error)
    } finally {
      setIsProgressiveLoading(false)
    }
  }

  // Handle skipping a question
  const handleSkipQuestion = (questionIndex: number) => {
    console.log(`Skipping question ${questionIndex}`)
    // In real implementation, this would update the question state
  }

  // Handle clarification request
  const handleRequestClarification = (questionIndex: number, clarification: string) => {
    console.log(`Clarification requested for question ${questionIndex}: ${clarification}`)
    // In real implementation, this would send the clarification request
  }

  // Simulate showing progressive questions (for testing)
  const simulateProgressiveQuestions = () => {
    const sampleQuestions: CategoryQuestion[] = [
      {
        id: 'severity_q1',
        text: 'لطفاً شدت درد خود را از ۱ تا ۱۰ بیان کنید',
        type: 'severity',
        priority: 90,
        targetedAreas: ['severity_clarification'],
        prerequisites: [],
        informationValue: 85,
        urgencyRelevance: 90,
        estimatedResponseTime: 15,
        isRequired: true,
        canSkip: false
      },
      {
        id: 'timing_q1',
        text: 'این علائم از چه زمانی شروع شده است؟',
        type: 'timing',
        priority: 85,
        targetedAreas: ['time_clarification'],
        prerequisites: [],
        informationValue: 80,
        urgencyRelevance: 85,
        estimatedResponseTime: 20,
        isRequired: false,
        canSkip: true
      }
    ]

    setProgressiveQuestions(sampleQuestions)
    setShowProgressiveQuestions(true)
    setCurrentRound(1)
    setTotalRounds(2)
    setQuestionsAsked(0)
  }

  // Check if we can send (has text and not loading)
  const canSend = inputValue.trim().length > 0 && !isLoading
  const charCount = inputValue.length
  const maxChars = 1000
  const isNearLimit = charCount > maxChars * 0.8

  // In return home mode, show action buttons instead of input form
  if (isReturnHomeMode) {
    const { startNewChat, resumeCurrentSession } = useAppContext()
    
    return (
      <div className="chat-form">
        <div className="return-home-buttons">
          <button 
            className="return-home-btn new-chat-btn"
            onClick={startNewChat}
          >
            <i className="fa-solid fa-plus"></i>
            <span>گفتگوی جدید</span>
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          
          <button 
            className="return-home-btn continue-btn"
            onClick={resumeCurrentSession}
          >
            <i className="fa-solid fa-play"></i>
            <span>ادامه گفتگو</span>
            <i className="fa-solid fa-arrow-left"></i>
          </button>
        </div>
      </div>
    )
  }

  // Show continue chat button if on initial screen and has existing chat
  const showContinueButton = !isChatMode && hasExistingChat

  if (showContinueButton) {
    return (
      <div className="chat-form">
        <div className="continue-chat-input-area">
          <button 
            className="continue-chat-input-btn question-card-style"
            onClick={continueChat}
          >
            <i className="fa-solid fa-comments"></i>
            <span>ادامه گفتگوی قبلی</span>
            <i className="fa-solid fa-arrow-left"></i>
          </button>
        </div>
      </div>
    )
  }

  // Show progressive questions if active
  if (showProgressiveQuestions && progressiveQuestions.length > 0) {
    return (
      <div className="chat-form progressive-mode">
        <ProgressiveQuestionCard
          questions={progressiveQuestions}
          currentRound={currentRound}
          totalRounds={totalRounds}
          questionsAsked={questionsAsked}
          onAnswerSubmit={handleProgressiveAnswers}
          onSkipQuestion={handleSkipQuestion}
          onRequestClarification={handleRequestClarification}
          isLoading={isProgressiveLoading}
          context={progressiveContext}
        />
        
        {/* Option to return to normal chat */}
        <div className="progressive-actions">
          <button
            className="return-to-chat-btn secondary-btn"
            onClick={() => setShowProgressiveQuestions(false)}
            disabled={isProgressiveLoading}
          >
            <i className="fa-solid fa-arrow-right"></i>
            بازگشت به چت معمولی
          </button>
        </div>
      </div>
    )
  }

  return (
    <form className="chat-form" onSubmit={handleSubmit}>
      <div className={`chat-input-area ${canSend ? 'has-content' : ''} ${isLoading ? 'loading' : ''}`}>
        <textarea
          ref={textareaRef}
          placeholder="سوال پزشکی خود را اینجا بپرسید..."
          maxLength={maxChars}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className={`chat-textarea auto-resize ${isChatMode ? 'chat-mode' : ''}`}
          rows={1}
        />
        
        <div className="input-actions">
          {/* Progressive questions trigger button (for testing) */}
          {isChatMode && (
            <button
              type="button"
              className="progressive-trigger-btn"
              onClick={simulateProgressiveQuestions}
              disabled={isLoading}
              title="تست سوالات تدریجی"
            >
              <i className="fa-solid fa-list-check"></i>
            </button>
          )}
        </div>
        
        <div className="submit-area">
          <button 
            type="submit" 
            className={`submit-button ${canSend ? 'active' : 'disabled'}`}
            disabled={!canSend}
          >
            {isLoading ? (
              <div className="loading-spinner">
                <i className="fa-solid fa-circle-notch fa-spin"></i>
              </div>
            ) : (
              <i className="fa-solid fa-arrow-left"></i>
            )}
          </button>
        </div>
      </div>
      
      {/* Character count indicator */}
      <div className="input-meta">
        <span className={`char-count ${isNearLimit ? 'near-limit' : ''}`}>
          {charCount}/{maxChars}
        </span>
        
        {isChatMode && (
          <div className="input-hints">
            <span className="hint">
              <i className="fa-solid fa-lightbulb"></i>
              برای دریافت راهنمایی دقیق‌تر، علائم، زمان شروع و شدت را ذکر کنید
            </span>
          </div>
        )}
      </div>
    </form>
  )
}
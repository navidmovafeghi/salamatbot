/**
 * Progressive Question Card Component
 * 
 * This component provides a smooth UI for multi-stage questioning process
 * with stage indicators, question numbering, and user interaction options.
 */

import { useState } from 'react'
import { CategoryQuestion, ProgressiveQuestionContext } from '../types/conversation'

interface ProgressiveQuestionCardProps {
  questions: CategoryQuestion[]
  currentRound: number
  totalRounds: number
  questionsAsked: number
  onAnswerSubmit: (answers: string[]) => void
  onSkipQuestion: (questionIndex: number) => void
  onRequestClarification: (questionIndex: number, clarification: string) => void
  isLoading?: boolean
  context?: ProgressiveQuestionContext
}

interface QuestionState {
  answer: string
  isSkipped: boolean
  needsClarification: boolean
  clarificationText: string
}

export default function ProgressiveQuestionCard({
  questions,
  currentRound,
  totalRounds,
  questionsAsked,
  onAnswerSubmit,
  onSkipQuestion,
  onRequestClarification,
  isLoading = false,
  context
}: ProgressiveQuestionCardProps) {
  // State for each question's answer
  const [questionStates, setQuestionStates] = useState<QuestionState[]>(
    questions.map(() => ({
      answer: '',
      isSkipped: false,
      needsClarification: false,
      clarificationText: ''
    }))
  )

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showAllQuestions, setShowAllQuestions] = useState(false)

  // Update answer for a specific question
  const updateQuestionAnswer = (index: number, answer: string) => {
    setQuestionStates(prev => prev.map((state, i) => 
      i === index ? { ...state, answer, isSkipped: false } : state
    ))
  }

  // Skip a question
  const handleSkipQuestion = (index: number) => {
    if (questions[index].canSkip) {
      setQuestionStates(prev => prev.map((state, i) => 
        i === index ? { ...state, isSkipped: true, answer: '' } : state
      ))
      onSkipQuestion(index)
      
      // Move to next question if in single question mode
      if (!showAllQuestions && index < questions.length - 1) {
        setCurrentQuestionIndex(index + 1)
      }
    }
  }

  // Request clarification for a question
  const handleRequestClarification = (index: number) => {
    const clarificationText = questionStates[index].clarificationText
    if (clarificationText.trim()) {
      onRequestClarification(index, clarificationText)
      setQuestionStates(prev => prev.map((state, i) => 
        i === index ? { ...state, needsClarification: false, clarificationText: '' } : state
      ))
    }
  }

  // Submit all answers
  const handleSubmitAnswers = () => {
    const answers = questionStates
      .map((state, index) => state.isSkipped ? `[سوال ${index + 1} رد شد]` : state.answer)
      .filter(answer => answer.trim() !== '')
    
    onAnswerSubmit(answers)
  }

  // Check if we can submit (at least one question answered)
  const canSubmit = questionStates.some(state => 
    !state.isSkipped && state.answer.trim() !== ''
  ) && !isLoading

  // Calculate progress
  const answeredQuestions = questionStates.filter(state => 
    !state.isSkipped && state.answer.trim() !== ''
  ).length
  
  const progressPercentage = questions.length > 0 ? 
    (answeredQuestions / questions.length) * 100 : 0

  return (
    <div className="progressive-question-card">
      {/* Header with stage information */}
      <div className="question-card-header">
        <div className="stage-indicator">
          <div className="stage-info">
            <span className="stage-icon">🔄</span>
            <span className="stage-text">
              مرحله {currentRound} از {totalRounds}
            </span>
          </div>
          <div className="questions-count">
            {questionsAsked + answeredQuestions} سوال پرسیده شده
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="question-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="progress-text">
            {answeredQuestions} از {questions.length} سوال پاسخ داده شده
          </span>
        </div>
      </div>

      {/* Question display mode toggle */}
      <div className="display-mode-toggle">
        <button
          className={`mode-btn ${!showAllQuestions ? 'active' : ''}`}
          onClick={() => setShowAllQuestions(false)}
        >
          <i className="fa-solid fa-arrow-right"></i>
          یک به یک
        </button>
        <button
          className={`mode-btn ${showAllQuestions ? 'active' : ''}`}
          onClick={() => setShowAllQuestions(true)}
        >
          <i className="fa-solid fa-list"></i>
          همه سوالات
        </button>
      </div>

      {/* Questions container */}
      <div className="questions-container">
        {showAllQuestions ? (
          // Show all questions at once
          <div className="all-questions-view">
            {questions.map((question, index) => (
              <QuestionItem
                key={question.id}
                question={question}
                index={index}
                state={questionStates[index]}
                onAnswerChange={(answer) => updateQuestionAnswer(index, answer)}
                onSkip={() => handleSkipQuestion(index)}
                onRequestClarification={handleRequestClarification}
                updateClarificationText={(text) => 
                  setQuestionStates(prev => prev.map((state, i) => 
                    i === index ? { ...state, clarificationText: text } : state
                  ))
                }
                isLoading={isLoading}
              />
            ))}
          </div>
        ) : (
          // Show one question at a time
          <div className="single-question-view">
            {questions.length > 0 && (
              <>
                <QuestionItem
                  question={questions[currentQuestionIndex]}
                  index={currentQuestionIndex}
                  state={questionStates[currentQuestionIndex]}
                  onAnswerChange={(answer) => updateQuestionAnswer(currentQuestionIndex, answer)}
                  onSkip={() => handleSkipQuestion(currentQuestionIndex)}
                  onRequestClarification={handleRequestClarification}
                  updateClarificationText={(text) => 
                    setQuestionStates(prev => prev.map((state, i) => 
                      i === currentQuestionIndex ? { ...state, clarificationText: text } : state
                    ))
                  }
                  isLoading={isLoading}
                />
                
                {/* Navigation buttons */}
                <div className="question-navigation">
                  <button
                    className="nav-btn prev-btn"
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                  >
                    <i className="fa-solid fa-chevron-right"></i>
                    قبلی
                  </button>
                  
                  <span className="question-counter">
                    {currentQuestionIndex + 1} از {questions.length}
                  </span>
                  
                  <button
                    className="nav-btn next-btn"
                    onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                    disabled={currentQuestionIndex === questions.length - 1}
                  >
                    بعدی
                    <i className="fa-solid fa-chevron-left"></i>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="question-actions">
        <button
          className="submit-btn primary-btn"
          onClick={handleSubmitAnswers}
          disabled={!canSubmit}
        >
          {isLoading ? (
            <>
              <i className="fa-solid fa-spinner fa-spin"></i>
              در حال پردازش...
            </>
          ) : (
            <>
              <i className="fa-solid fa-paper-plane"></i>
              ارسال پاسخ‌ها
            </>
          )}
        </button>
        
        <button
          className="skip-all-btn secondary-btn"
          onClick={() => handleSubmitAnswers()}
          disabled={isLoading}
        >
          <i className="fa-solid fa-forward"></i>
          ادامه بدون پاسخ
        </button>
      </div>

      {/* Context information */}
      {context && (
        <div className="context-info">
          <details className="context-details">
            <summary className="context-summary">
              <i className="fa-solid fa-info-circle"></i>
              اطلاعات تکمیلی
            </summary>
            <div className="context-content">
              {context.previousQuestions.length > 0 && (
                <div className="previous-questions">
                  <h4>سوالات قبلی:</h4>
                  <ul>
                    {context.previousQuestions.map((q, index) => (
                      <li key={index}>{q.text}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {context.contextualInfo && Object.keys(context.contextualInfo).length > 0 && (
                <div className="contextual-info">
                  <h4>اطلاعات استخراج شده:</h4>
                  <ul>
                    {Object.entries(context.contextualInfo).map(([key, value]) => (
                      <li key={key}>
                        <strong>{key}:</strong> {String(value)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </details>
        </div>
      )}
    </div>
  )
}

// Individual Question Item Component
interface QuestionItemProps {
  question: CategoryQuestion
  index: number
  state: QuestionState
  onAnswerChange: (answer: string) => void
  onSkip: () => void
  onRequestClarification: (index: number) => void
  updateClarificationText: (text: string) => void
  isLoading: boolean
}

function QuestionItem({
  question,
  index,
  state,
  onAnswerChange,
  onSkip,
  onRequestClarification,
  updateClarificationText,
  isLoading
}: QuestionItemProps) {
  return (
    <div className={`question-item ${state.isSkipped ? 'skipped' : ''}`}>
      {/* Question header */}
      <div className="question-header">
        <div className="question-number">
          <span className="number">{index + 1}</span>
          <div className="question-type">
            <span className="type-badge">{question.type}</span>
            {question.isRequired && (
              <span className="required-badge">ضروری</span>
            )}
          </div>
        </div>
        
        <div className="question-meta">
          <span className="priority">
            اولویت: {question.priority}
          </span>
          <span className="estimated-time">
            <i className="fa-solid fa-clock"></i>
            {question.estimatedResponseTime}s
          </span>
        </div>
      </div>

      {/* Question text */}
      <div className="question-text">
        <p>{question.text}</p>
        
        {question.targetedAreas.length > 0 && (
          <div className="targeted-areas">
            <span className="areas-label">مناطق هدف:</span>
            {question.targetedAreas.map((area, i) => (
              <span key={i} className="area-tag">{area}</span>
            ))}
          </div>
        )}
      </div>

      {/* Answer input */}
      {!state.isSkipped && (
        <div className="answer-input">
          <textarea
            value={state.answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="پاسخ خود را اینجا بنویسید..."
            rows={3}
            disabled={isLoading}
            className="answer-textarea"
          />
        </div>
      )}

      {/* Question actions */}
      <div className="question-item-actions">
        {!state.isSkipped && (
          <>
            {question.canSkip && (
              <button
                className="skip-btn"
                onClick={onSkip}
                disabled={isLoading}
              >
                <i className="fa-solid fa-forward"></i>
                رد کردن
              </button>
            )}
            
            <button
              className="clarification-btn"
              onClick={() => updateClarificationText('')}
              disabled={isLoading}
            >
              <i className="fa-solid fa-question-circle"></i>
              درخواست توضیح
            </button>
          </>
        )}
        
        {state.isSkipped && (
          <div className="skipped-indicator">
            <i className="fa-solid fa-forward"></i>
            این سوال رد شد
          </div>
        )}
      </div>

      {/* Clarification input */}
      {state.needsClarification && (
        <div className="clarification-input">
          <textarea
            value={state.clarificationText}
            onChange={(e) => updateClarificationText(e.target.value)}
            placeholder="لطفاً توضیح دهید که چه چیزی نیاز به روشن‌سازی دارد..."
            rows={2}
            className="clarification-textarea"
          />
          <button
            className="send-clarification-btn"
            onClick={() => onRequestClarification(index)}
            disabled={!state.clarificationText.trim() || isLoading}
          >
            <i className="fa-solid fa-paper-plane"></i>
            ارسال درخواست
          </button>
        </div>
      )}
    </div>
  )
}
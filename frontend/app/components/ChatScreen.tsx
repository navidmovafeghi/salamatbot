import { useEffect, useRef } from 'react'
import { Message } from '../page'
import { useAppContext } from '../contexts'
import HistoryModal from './HistoryModal'
import { getConfidenceLevel, CONFIDENCE_LEVELS } from '../lib/prompts'

// Function to format message text with basic Markdown support
function formatMessageText(text: string): string {
  return text
    // Bold text: **text** or *text*
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
    // Italic text: _text_
    .replace(/_(.*?)_/g, '<em>$1</em>')
    // Line breaks
    .replace(/\n/g, '<br>')
    // Escape any remaining HTML to prevent XSS
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Re-enable our formatted tags
    .replace(/&lt;strong&gt;/g, '<strong>')
    .replace(/&lt;\/strong&gt;/g, '</strong>')
    .replace(/&lt;em&gt;/g, '<em>')
    .replace(/&lt;\/em&gt;/g, '</em>')
    .replace(/&lt;br&gt;/g, '<br>')
}

// Confidence Indicator Component
function ConfidenceIndicator({ 
  confidenceScore, 
  informationCompleteness,
  showDetails = false 
}: { 
  confidenceScore?: number
  informationCompleteness?: number
  showDetails?: boolean 
}) {
  if (confidenceScore === undefined) return null

  const confidenceLevel = getConfidenceLevel(confidenceScore)
  
  return (
    <div className="confidence-indicator">
      <div className="confidence-header">
        <span className="confidence-icon" style={{ color: confidenceLevel.color }}>
          {confidenceLevel.icon}
        </span>
        <span className="confidence-label">
          {confidenceLevel.label} ({confidenceScore}%)
        </span>
      </div>
      
      <div className="confidence-bar">
        <div 
          className="confidence-fill"
          style={{ 
            width: `${confidenceScore}%`,
            backgroundColor: confidenceLevel.color
          }}
        />
      </div>
      
      {showDetails && (
        <div className="confidence-details">
          <p className="confidence-description">{confidenceLevel.description}</p>
          
          {informationCompleteness !== undefined && (
            <div className="information-completeness">
              <span className="completeness-label">
                کیفیت اطلاعات: {informationCompleteness}%
              </span>
              <div className="completeness-bar">
                <div 
                  className="completeness-fill"
                  style={{ 
                    width: `${informationCompleteness}%`,
                    backgroundColor: informationCompleteness >= 70 ? '#22c55e' : 
                                   informationCompleteness >= 50 ? '#f59e0b' : '#ef4444'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Response Quality Metadata Component
function ResponseQualityMetadata({ 
  message 
}: { 
  message: Message 
}) {
  if (message.type === 'user' || !message.metadata) return null

  const { 
    confidenceScore, 
    informationCompleteness, 
    responseTime, 
    emergencyLevel,
    uncertaintyAreas 
  } = message.metadata

  return (
    <div className="response-quality-metadata">
      {/* Confidence Indicator */}
      <ConfidenceIndicator 
        confidenceScore={confidenceScore}
        informationCompleteness={informationCompleteness}
        showDetails={true}
      />
      
      {/* Emergency Level Indicator */}
      {emergencyLevel && emergencyLevel !== 'low' && (
        <div className={`emergency-level-indicator ${emergencyLevel}`}>
          <span className="emergency-icon">
            {emergencyLevel === 'critical' ? '🚨' : 
             emergencyLevel === 'high' ? '⚠️' : '⚡'}
          </span>
          <span className="emergency-text">
            سطح فوریت: {
              emergencyLevel === 'critical' ? 'بحرانی' :
              emergencyLevel === 'high' ? 'بالا' :
              emergencyLevel === 'medium' ? 'متوسط' : 'پایین'
            }
          </span>
        </div>
      )}
      
      {/* Response Time */}
      {responseTime && (
        <div className="response-time-indicator">
          <span className="time-icon">⏱️</span>
          <span className="time-text">زمان پاسخ: {responseTime}ms</span>
        </div>
      )}
      
      {/* Uncertainty Areas */}
      {uncertaintyAreas && uncertaintyAreas.length > 0 && (
        <div className="uncertainty-areas">
          <span className="uncertainty-label">نواحی نیازمند بررسی بیشتر:</span>
          <div className="uncertainty-tags">
            {uncertaintyAreas.map((area, index) => (
              <span key={index} className="uncertainty-tag">
                {area}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Information Quality Breakdown */}
      {informationCompleteness !== undefined && (
        <div className="information-breakdown">
          <details className="breakdown-details">
            <summary className="breakdown-summary">
              جزئیات کیفیت اطلاعات
            </summary>
            <div className="breakdown-content">
              <div className="quality-metrics">
                <div className="metric-item">
                  <span className="metric-label">🔍 جزئیات علائم:</span>
                  <span className="metric-value">{message.metadata.symptomDetails || 'N/A'}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">⏱️ اطلاعات زمانی:</span>
                  <span className="metric-value">{message.metadata.timeInfo || 'N/A'}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">📍 محل و شدت:</span>
                  <span className="metric-value">{message.metadata.locationSeverity || 'N/A'}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">🏥 سابقه پزشکی:</span>
                  <span className="metric-value">{message.metadata.medicalHistory || 'N/A'}%</span>
                </div>
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}

// Progressive Question Indicator
function ProgressiveQuestionIndicator({ 
  currentRound, 
  totalRounds, 
  questionsAsked 
}: { 
  currentRound?: number
  totalRounds?: number
  questionsAsked?: number 
}) {
  if (!currentRound || !totalRounds) return null

  return (
    <div className="progressive-question-indicator">
      <div className="progress-header">
        <span className="progress-icon">🔄</span>
        <span className="progress-text">
          مرحله {currentRound} از {totalRounds} - {questionsAsked} سوال پرسیده شده
        </span>
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${(currentRound / totalRounds) * 100}%` }}
        />
      </div>
    </div>
  )
}

export default function ChatScreen() {
  // Get all needed data from context
  const {
    isChatMode,
    messages,
    clearConversationHistory,
    handleReturnHome,
    startNewChat,
    isHistoryMenuOpen,
    isMainMenuOpen,
    toggleHistoryMenu,
    toggleMainMenu,
    closeAllMenus,
    handleComponentChange,
    canSaveSession,
    saveStatus,
    isSessionSaved,
    handleManualSave,
    showToast,
  } = useAppContext()
  
  // Component is only visible when in chat mode
  const isVisible = isChatMode
  const chatHistoryRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight
    }
  }, [messages])

  // Notify menu manager when this component becomes active
  useEffect(() => {
    if (isVisible) {
      handleComponentChange('chat')
    }
  }, [isVisible, handleComponentChange])

  if (!isVisible) return null

  const handleMainMenuClick = () => {
    toggleMainMenu('chat')
  }

  const handleHistoryClick = () => {
    closeAllMenus() // Close main menu first
    toggleHistoryMenu('chat')
  }

  const handleNewChatClick = () => {
    closeAllMenus()
    startNewChat()
  }

  const handleReturnHomeClick = () => {
    closeAllMenus()
    handleReturnHome()
  }

  const handleClearHistoryClick = () => {
    closeAllMenus()
    clearConversationHistory()
  }

  const handleSaveSessionClick = async () => {
    closeAllMenus()
    
    try {
      const result = await handleManualSave()
      
      if (result === true) {
        showToast('گفتگو ذخیره شد - از این پس خودکار بروزرسانی می‌شود', 'success', 3000)
      } else if (result === false) {
        showToast('خطا در ذخیره گفتگو. لطفاً دوباره تلاش کنید.', 'error', 3000)
      }
      // If result is void/undefined, we don't show any toast
    } catch (error) {
      showToast('خطا در ذخیره گفتگو. لطفاً دوباره تلاش کنید.', 'error', 3000)
    }
  }

  return (
    <div id="chat-screen">
      {/* Chat Header with Menu */}
      <div className="chat-header">
        <div className="main-menu-container menu-container">
          <button 
            className="main-menu-btn menu-trigger" 
            onClick={handleMainMenuClick}
          >
            <i className="fa-solid fa-bars"></i>
            <span>منو</span>
          </button>
          
          {isMainMenuOpen && (
            <div className="main-dropdown-menu dropdown-menu">
              <button className="main-menu-item" onClick={handleNewChatClick}>
                <i className="fa-solid fa-plus"></i>
                گفتگوی جدید
              </button>
              
              <button className="main-menu-item" onClick={handleHistoryClick}>
                <i className="fa-solid fa-history"></i>
                تاریخچه گفتگوها
              </button>
              
              {/* Save button - only show for unsaved conversations */}
              {!isSessionSaved && (
                <button 
                  className={`main-menu-item ${!canSaveSession ? 'disabled' : ''}`}
                  onClick={handleSaveSessionClick}
                  disabled={!canSaveSession}
                >
                  <i className={`fa-solid ${saveStatus === 'saving' ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
                  {saveStatus === 'saving' ? 'در حال ذخیره...' : 'ذخیره گفتگو'}
                </button>
              )}
              
              {/* Saved indicator - show for saved conversations */}
              {isSessionSaved && (
                <div className="main-menu-item saved-indicator">
                  <i className="fa-solid fa-check-circle"></i>
                  محفوظ شده (خودکار)
                </div>
              )}
              
              <button className="main-menu-item" onClick={handleClearHistoryClick}>
                <i className="fa-solid fa-trash"></i>
                پاک کردن گفتگو
              </button>
              
              <button className="main-menu-item" onClick={handleReturnHomeClick}>
                <i className="fa-solid fa-home"></i>
                بازگشت به خانه
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div id="chat-history" ref={chatHistoryRef}>
        {messages.map((message) => (
          <div 
            key={message.id}
            className={`chat-message ${message.type === 'user' ? 'user-message' : 'bot-message'} ${
              message.isLoading ? 'loading-message' : ''
            } ${
              message.isError ? 'error-message' : ''
            } ${
              message.isEmergency ? 'emergency-message' : ''
            } ${
              message.metadata?.confidenceScore !== undefined && message.metadata.confidenceScore < 50 ? 'low-confidence' : ''
            }`}
          >
            {message.isLoading && (
              <div className="thinking-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
            
            {/* Progressive Question Indicator for bot messages */}
            {message.type === 'bot' && message.metadata?.progressiveState && (
              <ProgressiveQuestionIndicator 
                currentRound={message.metadata.progressiveState.currentRound}
                totalRounds={message.metadata.progressiveState.maxRounds}
                questionsAsked={message.metadata.progressiveState.questionsAsked}
              />
            )}
            
            <div 
              className="message-content"
              dangerouslySetInnerHTML={{
                __html: formatMessageText(message.text)
              }}
            />
            
            {/* Response Quality Metadata for bot messages */}
            <ResponseQualityMetadata message={message} />
            
            {/* Emergency Warning */}
            {message.isEmergency && (
              <div className="emergency-warning">
                ⚠️ این پیام ممکن است نشان‌دهنده وضعیت اورژانسی باشد. در صورت نیاز فوراً با پزشک تماس بگیرید.
              </div>
            )}
            
            {/* Low Confidence Warning */}
            {message.type === 'bot' && message.metadata?.confidenceScore !== undefined && message.metadata.confidenceScore < 50 && (
              <div className="low-confidence-warning">
                ⚠️ سطح اطمینان پایین - حتماً با پزشک مشورت کنید
              </div>
            )}
            
            {/* Information Completeness Suggestion */}
            {message.type === 'bot' && message.metadata?.informationCompleteness !== undefined && message.metadata.informationCompleteness < 60 && (
              <div className="information-suggestion">
                💡 برای راهنمایی دقیق‌تر، اطلاعات بیشتری درباره علائم، زمان شروع و شدت آن‌ها ارائه دهید
              </div>
            )}
          </div>
        ))}
      </div>

      {/* History Modal */}
      <HistoryModal 
        isOpen={isHistoryMenuOpen}
        onClose={closeAllMenus}
        variant="modal"
      />
    </div>
  )
}
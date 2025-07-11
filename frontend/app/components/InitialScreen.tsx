import { useState, useEffect } from 'react'
import { getSessionList } from '../lib/sessionManager'

interface InitialScreenProps {
  isVisible: boolean
  onPromptClick: (text: string) => void
  onContinueChat?: () => void
  onStartNewChat?: () => void
  onViewHistory?: () => void
  showHistoryModal?: boolean
  onCloseHistoryModal?: () => void
  hasExistingChat?: boolean
  isReturnHomeMode?: boolean
  onLoadSession?: (sessionId: string) => void
  onDeleteSession?: (sessionId: string) => void
}

const promptSuggestions = [
  {
    text: 'علائم سرماخوردگی چیست؟',
    icon: 'fa-solid fa-head-side-cough'
  },
  {
    text: 'چگونه فشار خون را کنترل کنیم؟',
    icon: 'fa-solid fa-heart-pulse'
  },
  {
    text: 'توصیه‌هایی برای یک رژیم غذایی سالم',
    icon: 'fa-solid fa-apple-whole'
  },
  {
    text: 'اطلاعاتی در مورد دیابت نوع ۲',
    icon: 'fa-solid fa-pills'
  }
]

export default function InitialScreen({ 
  isVisible, 
  onPromptClick, 
  onContinueChat, 
  onStartNewChat,
  onViewHistory,
  showHistoryModal,
  onCloseHistoryModal,
  hasExistingChat, 
  isReturnHomeMode,
  onLoadSession,
  onDeleteSession 
}: InitialScreenProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sessionList, setSessionList] = useState<Array<{
    id: string
    title: string
    date: string
    messageCount: number
  }>>([])

  // Load sessions when history modal opens
  useEffect(() => {
    if (showHistoryModal) {
      try {
        const sessions = getSessionList() || []
        setSessionList(sessions)
      } catch (error) {
        console.error('Error loading sessions:', error)
        setSessionList([])
      }
    }
  }, [showHistoryModal])

  if (!isVisible) return null

  const handlePromptClick = (text: string) => {
    onPromptClick(text)
    setIsModalOpen(false) // Close modal after selection
  }

  return (
    <div id="initial-screen">
      {/* Main Heading */}
      <header className="main-header">
        <h1>سلام، <br />چه کمکی از من <span className="gradient-text">ساخته است؟</span></h1>
        <p>یکی از سوالات متداول زیر را انتخاب کنید یا سوال خود را بپرسید</p>
      </header>


      {/* Desktop Prompt Suggestions - Always visible on desktop */}
      <section className="prompt-suggestions desktop-suggestions">
        {promptSuggestions.map((suggestion, index) => (
          <div 
            key={index}
            className="prompt-card"
            onClick={() => handlePromptClick(suggestion.text)}
          >
            <p>{suggestion.text}</p>
            <i className={suggestion.icon}></i>
          </div>
        ))}
      </section>

      {/* Mobile Quick Questions Button */}
      <div className="mobile-suggestions-trigger">
        <button 
          className="quick-questions-btn"
          onClick={() => setIsModalOpen(true)}
        >
          <i className="fa-solid fa-lightbulb"></i>
          <span>سوالات متداول</span>
          <i className="fa-solid fa-chevron-up"></i>
        </button>
      </div>

      {/* Mobile Modal/Drawer */}
      {isModalOpen && (
        <div className="suggestions-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="suggestions-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>سوالات متداول پزشکی</h3>
              <button 
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="modal-suggestions">
              {promptSuggestions.map((suggestion, index) => (
                <div 
                  key={index}
                  className="modal-prompt-card"
                  onClick={() => handlePromptClick(suggestion.text)}
                >
                  <div className="modal-card-content">
                    <i className={suggestion.icon}></i>
                    <p>{suggestion.text}</p>
                  </div>
                  <i className="fa-solid fa-chevron-left"></i>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Divider */}
      <hr className="divider" />

      {/* Return Home Mode - Three Action Buttons */}
      {isReturnHomeMode && (
        <section className="return-home-actions">
          <button 
            className="action-btn primary-action"
            onClick={onStartNewChat}
          >
            <i className="fa-solid fa-plus"></i>
            <span>شروع گفتگوی جدید</span>
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          
          {hasExistingChat && (
            <button 
              className="action-btn secondary-action"
              onClick={onContinueChat}
            >
              <i className="fa-solid fa-comments"></i>
              <span>ادامه گفتگوی قبلی</span>
              <i className="fa-solid fa-arrow-left"></i>
            </button>
          )}
          
          <button 
            className="action-btn tertiary-action"
            onClick={onViewHistory}
          >
            <i className="fa-solid fa-history"></i>
            <span>مشاهده تاریخچه گفتگوها</span>
            <i className="fa-solid fa-arrow-left"></i>
          </button>
        </section>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="history-modal-overlay" onClick={onCloseHistoryModal}>
          <div className="history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="history-modal-header">
              <h3>تاریخچه گفتگوها</h3>
              <button 
                className="history-modal-close-btn"
                onClick={onCloseHistoryModal}
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="history-modal-content">
              {!sessionList || sessionList.length === 0 ? (
                <div className="no-history">
                  <i className="fa-solid fa-comments"></i>
                  <p>هنوز گفتگویی ذخیره نشده است</p>
                </div>
              ) : (
                <div className="history-sessions">
                  {sessionList && sessionList.map((session) => (
                    <div key={session.id} className="history-session-item">
                      <div className="session-info" onClick={() => {
                        onLoadSession?.(session.id)
                        onCloseHistoryModal?.()
                      }}>
                        <div className="session-title">
                          <i className="fa-solid fa-comment-dots"></i>
                          <span>{session.title}</span>
                        </div>
                        <div className="session-meta">
                          <span className="session-date">
                            {session.date || 'تاریخ نامشخص'}
                          </span>
                          <span className="session-messages">
                            {session.messageCount || 0} پیام
                          </span>
                        </div>
                      </div>
                      <button 
                        className="delete-session-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteSession?.(session.id)
                          // Refresh the session list
                          const updatedSessions = getSessionList()
                          setSessionList(updatedSessions)
                        }}
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
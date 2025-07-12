import { useEffect, useRef, useState } from 'react'
import { Message } from '../page'
import { getSessionList } from '../lib/sessionManager'

interface ChatScreenProps {
  isVisible: boolean
  messages: Message[]
  onClearHistory: () => void
  onReturnHome: () => void
  onStartNewChat: () => void
  onLoadSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string) => void
}

export default function ChatScreen({ isVisible, messages, onClearHistory, onReturnHome, onStartNewChat, onLoadSession, onDeleteSession }: ChatScreenProps) {
  const chatHistoryRef = useRef<HTMLDivElement>(null)
  const [showHistoryMenu, setShowHistoryMenu] = useState(false)
  const [sessionList, setSessionList] = useState<Array<{
    id: string
    title: string
    date: string
    messageCount: number
  }>>([])

  // Load session list when history menu opens
  useEffect(() => {
    if (showHistoryMenu) {
      console.log('=== LOADING HISTORY ===')
      const sessions = getSessionList()
      console.log('Sessions found:', sessions.length)
      console.log('Session details:', sessions)
      setSessionList(sessions)
    }
  }, [showHistoryMenu])

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight
    }
  }, [messages])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showHistoryMenu && !(event.target as Element).closest('.history-menu-container')) {
        setShowHistoryMenu(false)
      }
    }

    if (showHistoryMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showHistoryMenu])

  const handleClearHistory = () => {
    if (confirm('آیا مطمئن هستید که می‌خواهید تمام تاریخچه گفتگو را پاک کنید؟')) {
      onClearHistory()
    }
  }

  const handleReturnHome = () => {
    onReturnHome()
  }

  const handleStartNewChat = () => {
    onStartNewChat()
  }

  const handleHistoryMenuToggle = () => {
    setShowHistoryMenu(!showHistoryMenu)
  }

  const handleLoadSession = (sessionId: string) => {
    setShowHistoryMenu(false)
    onLoadSession(sessionId)
  }

  const handleDeleteSession = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent session loading when clicking delete
    if (confirm('آیا مطمئن هستید که می‌خواهید این گفتگو را حذف کنید؟')) {
      onDeleteSession(sessionId)
      // Refresh session list
      setSessionList(getSessionList())
    }
  }

  const handleClearFromMenu = () => {
    setShowHistoryMenu(false)
    handleClearHistory()
  }

  if (!isVisible) return null

  return (
    <div id="chat-screen">
      {/* Three buttons: Start New Chat + Clear History + Return Home */}
      <div className="chat-header">
        <div className="triple-buttons">
          <button 
            className="triple-btn left-btn question-card-style" 
            onClick={handleStartNewChat}
          >
            <i className="fa-solid fa-plus"></i>
            <span>گفتگوی جدید</span>
          </button>
          <div className="history-menu-container">
            <button 
              className="triple-btn middle-btn question-card-style" 
              onClick={handleHistoryMenuToggle}
            >
              <i className="fa-solid fa-history"></i>
              <span>تاریخچه</span>
            </button>
            {showHistoryMenu && (
              <div className="history-dropdown-menu">
                {sessionList.length === 0 ? (
                  <div className="history-empty-state">
                    <span>هیچ گفتگوی قبلی وجود ندارد</span>
                  </div>
                ) : (
                  <>
                    <div className="history-menu-header">
                      <span>گفتگوهای قبلی</span>
                    </div>
                    {sessionList.map((session) => (
                      <div 
                        key={session.id}
                        className="history-session-item"
                        onClick={() => handleLoadSession(session.id)}
                      >
                        <div className="session-info">
                          <div className="session-title">{session.title}</div>
                          <div className="session-meta">
                            <span className="session-date">{session.date}</span>
                            <span className="session-count">{session.messageCount} پیام</span>
                          </div>
                        </div>
                        <button 
                          className="session-delete-btn"
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          title="حذف گفتگو"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    ))}
                    <div className="history-menu-divider"></div>
                    <button className="history-menu-item danger" onClick={handleClearFromMenu}>
                      <i className="fa-solid fa-trash"></i>
                      <span>پاک کردن گفتگوی فعلی</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          <button 
            className="triple-btn right-btn question-card-style" 
            onClick={handleReturnHome}
          >
            <i className="fa-solid fa-home"></i>
            <span>خانه</span>
          </button>
        </div>
      </div>
      
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
            }`}
          >
            {message.isLoading && (
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
            <div className="message-content">
              {message.text}
            </div>
            {message.isEmergency && (
              <div className="emergency-warning">
                ⚠️ این پیام ممکن است نشان‌دهنده وضعیت اورژانسی باشد. در صورت نیاز فوراً با پزشک تماس بگیرید.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
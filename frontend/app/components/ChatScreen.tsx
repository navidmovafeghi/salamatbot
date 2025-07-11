import { useEffect, useRef } from 'react'
import { Message } from '../page'

interface ChatScreenProps {
  isVisible: boolean
  messages: Message[]
  onClearHistory: () => void
  onReturnHome: () => void
  onStartNewChat: () => void
}

export default function ChatScreen({ isVisible, messages, onClearHistory, onReturnHome, onStartNewChat }: ChatScreenProps) {
  const chatHistoryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight
    }
  }, [messages])

  const handleClearHistory = () => {
    if (confirm('آیا مطمئن هستید که می‌خواهید تمام تاریخچه گفتگو را پاک کنید؟')) {
      onClearHistory()
    }
  }

  const handleReturnHome = () => {
    onReturnHome()
  }

  const handleStartNewChat = () => {
    if (confirm('آیا مطمئن هستید که می‌خواهید گفتگوی جدیدی شروع کنید؟ تمام تاریخچه پاک خواهد شد.')) {
      onStartNewChat()
    }
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
          <button 
            className="triple-btn middle-btn question-card-style" 
            onClick={handleClearHistory}
          >
            <i className="fa-solid fa-trash"></i>
            <span>پاک کردن</span>
          </button>
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
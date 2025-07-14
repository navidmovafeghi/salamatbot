import { useState, useEffect } from 'react'
import { getSessionList } from '../lib/sessionManager'
import { useAppContext } from '../contexts'

interface HistoryModalProps {
  isOpen: boolean
  onClose: () => void
  variant?: 'modal' | 'dropdown'
  className?: string
}

interface SessionItem {
  id: string
  title: string
  date?: string
  messageCount?: number
}

export default function HistoryModal({ 
  isOpen, 
  onClose, 
  variant = 'modal',
  className = '' 
}: HistoryModalProps) {
  const { loadSession, handleDeleteSession } = useAppContext()
  const [sessionList, setSessionList] = useState<SessionItem[]>([])

  // Load sessions when modal opens
  useEffect(() => {
    if (isOpen) {
      const sessions = getSessionList()
      setSessionList(sessions)
    }
  }, [isOpen])

  // Don't render if not open
  if (!isOpen) return null

  const handleSessionClick = (sessionId: string) => {
    loadSession(sessionId)
    onClose()
  }

  const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    handleDeleteSession(sessionId)
    // Refresh the session list
    const updatedSessions = getSessionList()
    setSessionList(updatedSessions)
  }

  const renderContent = () => (
    <>
      <div className="history-modal-header">
        <h3>تاریخچه گفتگوها</h3>
        <button 
          className="history-modal-close-btn"
          onClick={onClose}
          aria-label="بستن"
        >
          <i className="fa-solid fa-times"></i>
        </button>
      </div>
      
      <div className="history-modal-content">
        {sessionList.length === 0 ? (
          <div className="no-history">
            <i className="fa-solid fa-comments"></i>
            <p>هنوز گفتگویی ذخیره نشده است</p>
          </div>
        ) : (
          <div className="history-sessions">
            {sessionList.map((session) => (
              <div 
                key={session.id}
                className="history-session-item"
                onClick={() => handleSessionClick(session.id)}
              >
                <div className="session-info">
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
                  onClick={(e) => handleDeleteClick(e, session.id)}
                  title="حذف گفتگو"
                  aria-label="حذف گفتگو"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )

  if (variant === 'dropdown') {
    return (
      <div className={`history-dropdown-menu ${className}`}>
        {renderContent()}
      </div>
    )
  }

  return (
    <div className="history-modal-overlay">
      <div className="history-modal">
        {renderContent()}
      </div>
    </div>
  )
}
import { useEffect, useRef } from 'react'
import { Message } from '../page'
import { useAppContext } from '../contexts'
import HistoryModal from './HistoryModal'

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
      const success = await handleManualSave()
      
      if (success === true) {
        showToast('گفتگو ذخیره شد - از این پس خودکار بروزرسانی می‌شود', 'success', 3000)
      } else {
        showToast('خطا در ذخیره گفتگو. لطفاً دوباره تلاش کنید.', 'error', 3000)
      }
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
            }`}
          >
            {message.isLoading && (
              <div className="thinking-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
            <div 
              className="message-content"
              dangerouslySetInnerHTML={{
                __html: formatMessageText(message.text)
              }}
            />
            {message.isEmergency && (
              <div className="emergency-warning">
                ⚠️ این پیام ممکن است نشان‌دهنده وضعیت اورژانسی باشد. در صورت نیاز فوراً با پزشک تماس بگیرید.
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
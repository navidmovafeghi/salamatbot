import { useState, KeyboardEvent, useRef, useEffect } from 'react'
import { useAppContext } from '../contexts'

export default function ChatForm() {
  // Get all needed data from context
  const {
    isChatMode,
    hasExistingChat,
    isReturnHomeMode,
    isLoading,
    handleSendMessage,
    continueChat,
  } = useAppContext()
  const [inputValue, setInputValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
    }
  }

  // Check if we can send (has text and not loading)
  const canSend = inputValue.trim().length > 0 && !isLoading
  const charCount = inputValue.length
  const maxChars = 1000
  const isNearLimit = charCount > maxChars * 0.8

  // In return home mode, don't show any input form
  if (isReturnHomeMode) {
    return null
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
    </form>
  )
}
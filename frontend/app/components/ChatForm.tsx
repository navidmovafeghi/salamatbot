import { useState, KeyboardEvent } from 'react'

interface ChatFormProps {
  onSendMessage: (text: string) => void
  onContinueChat?: () => void
  hasExistingChat?: boolean
  isChatMode?: boolean
}

export default function ChatForm({ onSendMessage, onContinueChat, hasExistingChat, isChatMode }: ChatFormProps) {
  const [inputValue, setInputValue] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

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

  const sendMessage = () => {
    const trimmedMessage = inputValue.trim()
    if (trimmedMessage) {
      onSendMessage(trimmedMessage)
      setInputValue('')
      setIsExpanded(false) // Collapse after sending
    }
  }

  const handleFocus = () => {
    setIsExpanded(true)
  }

  const handleBlur = () => {
    // Only collapse if input is empty
    if (!inputValue.trim()) {
      setIsExpanded(false)
    }
  }

  // Show continue chat button if on initial screen and has existing chat
  const showContinueButton = !isChatMode && hasExistingChat && onContinueChat

  if (showContinueButton) {
    return (
      <div className="chat-form">
        <div className="continue-chat-input-area">
          <button 
            className="continue-chat-input-btn question-card-style"
            onClick={onContinueChat}
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
      <div className="chat-input-area">
        <textarea
          placeholder="سوال پزشکی خود را اینجا بپرسید..."
          maxLength={1000}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`chat-textarea ${isExpanded ? 'expanded' : 'collapsed'} ${isChatMode ? 'chat-mode' : ''}`}
          rows={isExpanded ? 4 : 1}
        />
        
        <div className="submit-area">
          <button type="submit" className="submit-button">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
        </div>
      </div>
    </form>
  )
}
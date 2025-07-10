import { useState, KeyboardEvent } from 'react'

interface ChatFormProps {
  onSendMessage: (text: string) => void
}

export default function ChatForm({ onSendMessage }: ChatFormProps) {
  const [inputValue, setInputValue] = useState('')

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
    }
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
        />
        
        <div className="top-controls">
          {/* Future: Add any top controls here */}
        </div>

        <div className="bottom-controls">
          <div className="attachment-buttons">
            {/* Future: Add attachment buttons here */}
          </div>
          <div className="submit-area">
            <button type="submit" className="submit-button">
              <i className="fa-solid fa-arrow-left"></i>
            </button>
          </div>
        </div>
      </div>
      
      {/* Disclaimer */}
      <footer className="disclaimer">
        این چت‌بات یک ابزار اطلاعاتی است و جایگزین مشاوره، تشخیص یا درمان حرفه‌ای پزشکی نیست. 
        همیشه برای هرگونه سوالی در مورد وضعیت پزشکی خود از پزشک یا سایر ارائه‌دهندگان خدمات بهداشتی واجد شرایط کمک بگیرید.
      </footer>
    </form>
  )
}
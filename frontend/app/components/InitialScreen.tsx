import { useState } from 'react'

interface InitialScreenProps {
  isVisible: boolean
  onPromptClick: (text: string) => void
  onContinueChat?: () => void
  hasExistingChat?: boolean
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

export default function InitialScreen({ isVisible, onPromptClick, onContinueChat, hasExistingChat }: InitialScreenProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

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
    </div>
  )
}
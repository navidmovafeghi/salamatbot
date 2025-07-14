import { useEffect } from 'react'
import { useAppContext } from '../contexts'
import HistoryModal from './HistoryModal'

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

export default function InitialScreen() {
  // Get all needed data from context
  const {
    isChatMode,
    hasExistingChat,
    isReturnHomeMode,
    handleSuggestionClick,
    resumeCurrentSession,
    startNewChat,
    isHistoryMenuOpen,
    toggleHistoryMenu,
    closeAllMenus,
    handleComponentChange,
  } = useAppContext()
  
  // Component is only visible when not in chat mode
  const isVisible = !isChatMode

  // Notify menu manager when this component becomes active
  useEffect(() => {
    if (isVisible) {
      handleComponentChange('initial')
    }
  }, [isVisible, handleComponentChange])

  if (!isVisible) return null

  const handleHistoryClick = () => {
    toggleHistoryMenu('initial')
  }

  const handlePromptClick = (text: string) => {
    handleSuggestionClick(text)
    closeAllMenus() // Close any open menus
  }

  return (
    <div id="initial-screen">
      {/* History Button - Top Right */}
      <button 
        className="history-btn-top-right menu-trigger"
        onClick={handleHistoryClick}
        title="تاریخچه گفتگوها"
      >
        <i className="fa-solid fa-history"></i>
        <span>تاریخچه</span>
      </button>

      {/* Main Header */}
      <header className="main-header">
        <h1>
          <span className="gradient-text">چت‌بات پزشکی</span>
        </h1>
        <p>دستیار هوشمند شما برای سوالات بهداشتی و پزشکی</p>
      </header>

      {/* Prompt Suggestions */}
      <div className="prompt-suggestions">
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
      </div>

      {/* History Button - Mobile Only (under disclaimer) */}
      <button 
        className="history-btn-mobile menu-trigger"
        onClick={handleHistoryClick}
        title="تاریخچه گفتگوها"
      >
        <i className="fa-solid fa-history"></i>
        <span>مشاهده تاریخچه گفتگوها</span>
        <i className="fa-solid fa-arrow-left"></i>
      </button>

      {/* Return Home Mode - Three Action Buttons */}
      {isReturnHomeMode && (
        <section className="return-home-actions">
          <button 
            className="action-btn new-chat-btn"
            onClick={startNewChat}
          >
            <i className="fa-solid fa-plus"></i>
            <span>گفتگوی جدید</span>
          </button>
          
          <button 
            className="action-btn continue-btn"
            onClick={resumeCurrentSession}
          >
            <i className="fa-solid fa-play"></i>
            <span>ادامه گفتگو</span>
          </button>
        </section>
      )}

      {/* History Modal */}
      <HistoryModal 
        isOpen={isHistoryMenuOpen}
        onClose={closeAllMenus}
        variant="modal"
      />
    </div>
  )
}
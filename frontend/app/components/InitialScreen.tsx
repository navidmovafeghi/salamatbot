import { useEffect, useState } from 'react'
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

type TrustPopupType = 'specialized' | 'secure' | 'available' | null

const trustPopupContent = {
  specialized: {
    title: 'مشاوره تخصصی',
    content: 'سیستم ما بر اساس آخرین دانش پزشکی و با استفاده از هوش مصنوعی پیشرفته، راهنمایی‌های تخصصی و دقیق ارائه می‌دهد. تمامی پاسخ‌ها بر مبنای منابع معتبر پزشکی و رهنمودهای بالینی تنظیم شده‌اند.'
  },
  secure: {
    title: 'محرمانه و ایمن',
    content: 'تمامی اطلاعات شما کاملاً محرمانه است و در دستگاه شما ذخیره می‌شود. ما هیچ‌گونه اطلاعات شخصی یا پزشکی شما را ذخیره، ضبط یا به اشتراک نمی‌گذاریم. حریم خصوصی شما برای ما اولویت اول است.'
  },
  available: {
    title: '۲۴ ساعته در دسترس',
    content: 'سیستم مشاوره پزشکی ما ۲۴ ساعت شبانه‌روز و ۷ روز هفته در دسترس شماست. در هر زمان که نیاز به راهنمایی پزشکی داشته باشید، می‌توانید از خدمات ما استفاده کنید.'
  }
}

export default function InitialScreen() {
  const [activeTrustPopup, setActiveTrustPopup] = useState<TrustPopupType>(null)
  
  // Get all needed data from context
  const {
    isChatMode,
    hasExistingChat,
    isReturnHomeMode,
    handleSuggestionClick,
    resumeCurrentSession,
    startNewChat,
    isHistoryMenuOpen,
    isSuggestionsMenuOpen,
    toggleHistoryMenu,
    toggleSuggestionsMenu,
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

  const handleSuggestionsMenuClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleSuggestionsMenu('initial')
  }

  return (
    <div id="initial-screen">

      {/* Main Header */}
      <header className="main-header medical-header">
        <div className="header-two-column">
          {/* Right Column - Title and Subtitle */}
          <div className="header-right-column">
            <div className="medical-title-section">
              <h1>
                <span className="gradient-text">مرکز مشاوره پزشکی هوشمند</span>
              </h1>
              <p className="medical-subtitle">دستیار تخصصی شما برای سوالات بهداشتی و پزشکی</p>
            </div>
          </div>
          
          {/* Left Column - Trust Indicators */}
          <div className="header-left-column">
            <div className="trust-indicators-text">
              <button 
                className="trust-indicator-btn"
                onClick={() => setActiveTrustPopup('specialized')}
                type="button"
              >
                مشاوره تخصصی
              </button>
              <div className="trust-divider"></div>
              <button 
                className="trust-indicator-btn"
                onClick={() => setActiveTrustPopup('secure')}
                type="button"
              >
                محرمانه و ایمن
              </button>
              <div className="trust-divider"></div>
              <button 
                className="trust-indicator-btn"
                onClick={() => setActiveTrustPopup('available')}
                type="button"
              >
                ۲۴ ساعته در دسترس
              </button>
            </div>
          </div>
        </div>

        {/* Medical Questions Divider */}
        <div className="medical-divider">
          <div className="divider-line"></div>
          <div className="divider-text">
            <span>سوالات پزشکی متداول</span>
          </div>
          <div className="divider-line"></div>
        </div>
      </header>

      {/* Desktop Prompt Suggestions */}
      <div className="prompt-suggestions desktop-suggestions">
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

      {/* Mobile Suggestions Button */}
      <div className="mobile-suggestions-container">
        <button 
          className="mobile-suggestions-btn menu-trigger"
          onClick={handleSuggestionsMenuClick}
          type="button"
        >
          <i className="fa-solid fa-lightbulb"></i>
          <span>پیشنهادات سوال</span>
          <i className="fa-solid fa-chevron-down"></i>
        </button>
      </div>

      {/* Suggestions Menu - Responsive */}
      {isSuggestionsMenuOpen && (
        <>
          <div 
            className={`suggestions-backdrop ${isSuggestionsMenuOpen ? 'open' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              closeAllMenus()
            }}
          />
          <div className={`suggestions-menu ${isSuggestionsMenuOpen ? 'open' : ''}`}>
            <div className="suggestions-handle"></div>
            <div className="suggestions-header">
              <h3>پیشنهادات سوال</h3>
            </div>
            {promptSuggestions.map((suggestion, index) => (
              <button 
                key={index}
                className="suggestion-item"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handlePromptClick(suggestion.text)
                }}
                type="button"
              >
                <i className={suggestion.icon}></i>
                <span>{suggestion.text}</span>
              </button>
            ))}
          </div>
        </>
      )}


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

      {/* Trust Indicator Popup */}
      {activeTrustPopup && (
        <div className="trust-popup-overlay" onClick={() => setActiveTrustPopup(null)}>
          <div className="trust-popup" onClick={(e) => e.stopPropagation()}>
            <div className="trust-popup-header">
              <h3>{trustPopupContent[activeTrustPopup].title}</h3>
              <button 
                className="trust-popup-close"
                onClick={() => setActiveTrustPopup(null)}
                aria-label="بستن"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="trust-popup-content">
              <p>{trustPopupContent[activeTrustPopup].content}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
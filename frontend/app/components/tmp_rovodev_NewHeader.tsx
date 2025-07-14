import { useEffect, useState } from 'react'
import { useAppContext } from '../contexts'
import HistoryModal from './HistoryModal'

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

export default function NewHeader() {
  const [activeTrustPopup, setActiveTrustPopup] = useState<TrustPopupType>(null)
  const [showMenu, setShowMenu] = useState(false)
  
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

  const handleQuickAction = (type: string) => {
    switch (type) {
      case 'emergency':
        handleSuggestionClick('من علائم اورژانسی دارم و نیاز به راهنمایی فوری دارم')
        break
      case 'general':
        handleSuggestionClick('سوال عمومی پزشکی دارم')
        break
      case 'symptoms':
        handleSuggestionClick('می‌خواهم علائمم را بررسی کنم')
        break
    }
  }

  return (
    <div id="new-header-screen">
      {/* Hero Header */}
      <header className="hero-header">
        {/* Main Hero Content */}
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="title-main">🩺 دستیار هوشمند پزشکی</span>
            <span className="title-highlight">راهنمای تخصصی سلامت شما</span>
          </h1>

          <div className="trust-metrics">
            <div 
              className="metric-item"
              onClick={() => setActiveTrustPopup('available')}
            >
              <div className="metric-icon">
                <i className="fa-solid fa-clock"></i>
              </div>
              <div className="metric-text">
                <span className="metric-number">۲۴/۷</span>
                <span className="metric-label">در دسترس</span>
              </div>
            </div>
            
            <div 
              className="metric-item"
              onClick={() => setActiveTrustPopup('secure')}
            >
              <div className="metric-icon">
                <i className="fa-solid fa-lock"></i>
              </div>
              <div className="metric-text">
                <span className="metric-number">۱۰۰٪</span>
                <span className="metric-label">محرمانه</span>
              </div>
            </div>
            
            <div 
              className="metric-item"
              onClick={() => setActiveTrustPopup('specialized')}
            >
              <div className="metric-icon">
                <i className="fa-solid fa-stethoscope"></i>
              </div>
              <div className="metric-text">
                <span className="metric-number">تخصصی</span>
                <span className="metric-label">مشاوره</span>
              </div>
            </div>
          </div>

        </div>
      </header>

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

      {/* Mobile Menu Overlay */}
      {showMenu && (
        <div className="mobile-menu-overlay" onClick={() => setShowMenu(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <h3>منو</h3>
              <button 
                className="mobile-menu-close"
                onClick={() => setShowMenu(false)}
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="mobile-menu-content">
              <button className="mobile-menu-item" onClick={handleHistoryClick}>
                <i className="fa-solid fa-history"></i>
                <span>تاریخچه گفتگوها</span>
              </button>
              <button className="mobile-menu-item">
                <i className="fa-solid fa-question-circle"></i>
                <span>سوالات متداول</span>
              </button>
              <button className="mobile-menu-item">
                <i className="fa-solid fa-info-circle"></i>
                <span>درباره ما</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
import { useAppContext } from '../contexts'

export default function CTASection() {
  const { handleSuggestionClick } = useAppContext()

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
    <div className="cta-section">
      <p className="cta-text">سوال پزشکی خود را بپرسید</p>
      <div className="quick-actions">
        <button 
          className="quick-action-btn emergency"
          onClick={() => handleQuickAction('emergency')}
        >
          <i className="fa-solid fa-exclamation-triangle"></i>
          <span>اورژانس</span>
        </button>
        <button 
          className="quick-action-btn general"
          onClick={() => handleQuickAction('general')}
        >
          <i className="fa-solid fa-comments"></i>
          <span>مشاوره عمومی</span>
        </button>
        <button 
          className="quick-action-btn symptoms"
          onClick={() => handleQuickAction('symptoms')}
        >
          <i className="fa-solid fa-search"></i>
          <span>بررسی علائم</span>
        </button>
      </div>
    </div>
  )
}
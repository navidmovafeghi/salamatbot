import { useAppContext } from '../contexts'

interface CommonQuestionsModalProps {
  isOpen: boolean
  onClose: () => void
}

const commonQuestions = [
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

export default function CommonQuestionsModal({ isOpen, onClose }: CommonQuestionsModalProps) {
  const { handleSuggestionClick } = useAppContext()

  // Don't render if not open
  if (!isOpen) return null

  const handleQuestionClick = (questionText: string) => {
    handleSuggestionClick(questionText)
    onClose()
  }

  return (
    <div className="history-modal-overlay">
      <div className="history-modal">
        <div className="history-modal-header">
          <h3>سوالات متداول</h3>
          <button 
            className="history-modal-close-btn"
            onClick={onClose}
            aria-label="بستن"
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
        
        <div className="history-modal-content">
          <div className="common-questions-grid">
            {commonQuestions.map((question, index) => (
              <button
                key={index}
                className="common-question-item"
                onClick={() => handleQuestionClick(question.text)}
              >
                <div className="question-icon">
                  <i className={question.icon}></i>
                </div>
                <span className="question-text">{question.text}</span>
                <i className="fa-solid fa-arrow-left question-arrow"></i>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
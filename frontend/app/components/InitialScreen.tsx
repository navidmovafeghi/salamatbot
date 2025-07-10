interface InitialScreenProps {
  isVisible: boolean
  onPromptClick: (text: string) => void
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

export default function InitialScreen({ isVisible, onPromptClick }: InitialScreenProps) {
  if (!isVisible) return null

  return (
    <div id="initial-screen">
      {/* Main Heading */}
      <header className="main-header">
        <h1>سلام، <br />چه کمکی از من <span className="gradient-text">ساخته است؟</span></h1>
        <p>یکی از سوالات متداول زیر را انتخاب کنید یا سوال خود را بپرسید</p>
      </header>

      {/* Prompt Suggestions */}
      <section className="prompt-suggestions">
        {promptSuggestions.map((suggestion, index) => (
          <div 
            key={index}
            className="prompt-card"
            onClick={() => onPromptClick(suggestion.text)}
          >
            <p>{suggestion.text}</p>
            <i className={suggestion.icon}></i>
          </div>
        ))}
      </section>

      {/* Divider */}
      <hr className="divider" />
    </div>
  )
}
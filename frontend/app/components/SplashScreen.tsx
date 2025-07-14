import { useEffect, useState } from 'react'

interface SplashScreenProps {
  onComplete: () => void
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [animationPhase, setAnimationPhase] = useState<'fadeIn' | 'visible' | 'fadeOut'>('fadeIn')

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setAnimationPhase('visible')
    }, 300) // Slightly longer fade in for professional feel

    const timer2 = setTimeout(() => {
      setAnimationPhase('fadeOut')
    }, 3000) // Extended display time for medical context

    const timer3 = setTimeout(() => {
      setIsVisible(false)
      onComplete()
    }, 3500) // Fade out duration

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div className={`splash-screen medical-splash ${animationPhase}`}>
      <div className="splash-content">
        <div className="splash-logo">
          <div className="logo-icon medical-logo">
            <i className="fa-solid fa-stethoscope"></i>
          </div>
        </div>
        
        <div className="splash-text">
          <h1>مرکز مشاوره پزشکی هوشمند</h1>
          <p>دستیار تخصصی سلامت و بهداشت</p>
          <div className="medical-badge">
            <i className="fa-solid fa-shield-halved"></i>
            <span>مشاوره ایمن و محرمانه</span>
          </div>
        </div>
      </div>
    </div>
  )
}
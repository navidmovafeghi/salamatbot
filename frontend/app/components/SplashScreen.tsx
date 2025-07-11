import { useEffect, useState } from 'react'

interface SplashScreenProps {
  onComplete: () => void
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [animationPhase, setAnimationPhase] = useState<'fadeIn' | 'visible' | 'wipeOut'>('fadeIn')

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setAnimationPhase('visible')
    }, 300) // Quick fade in

    const timer2 = setTimeout(() => {
      setAnimationPhase('wipeOut')
    }, 2500) // Show for 2.2 seconds

    const timer3 = setTimeout(() => {
      setIsVisible(false)
      onComplete()
    }, 3200) // Wipe animation duration

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div className={`splash-screen ${animationPhase}`}>
      {/* Main Content */}
      <div className="splash-content">
        <div className="splash-logo">
          <div className="logo-icon">
            <i className="fa-solid fa-brain"></i>
          </div>
          <div className="logo-pulse"></div>
        </div>
        
        <div className="splash-text">
          <h1>راه‌حل هوشمند سلامت</h1>
          <p>مشاوره پزشکی ۲۴/۷ با هوش مصنوعی</p>
        </div>
        
        <div className="splash-features">
          <div className="feature-item">
            <i className="fa-solid fa-clock"></i>
            <span>دسترسی ۲۴ ساعته</span>
          </div>
          <div className="feature-item">
            <i className="fa-solid fa-user-shield"></i>
            <span>محرمانگی کامل</span>
          </div>
          <div className="feature-item">
            <i className="fa-solid fa-bolt"></i>
            <span>پاسخ فوری</span>
          </div>
        </div>
        
        <div className="splash-subtitle">
          <span>AI-Powered Healthcare Solutions</span>
        </div>
      </div>
      
      {/* Background */}
      <div className="splash-background">
        <div className="floating-icon floating-icon-1">
          <i className="fa-solid fa-microchip"></i>
        </div>
        <div className="floating-icon floating-icon-2">
          <i className="fa-solid fa-chart-line"></i>
        </div>
        <div className="floating-icon floating-icon-3">
          <i className="fa-solid fa-shield-heart"></i>
        </div>
        <div className="floating-icon floating-icon-4">
          <i className="fa-solid fa-network-wired"></i>
        </div>
      </div>
      
    </div>
  )
}
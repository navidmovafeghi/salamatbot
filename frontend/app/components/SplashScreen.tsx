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
    }, 200) // Quick fade in

    const timer2 = setTimeout(() => {
      setAnimationPhase('fadeOut')
    }, 2000) // Show for 1.8 seconds

    const timer3 = setTimeout(() => {
      setIsVisible(false)
      onComplete()
    }, 2500) // Fade out duration

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div className={`splash-screen ${animationPhase}`}>
      <div className="splash-content">
        <div className="splash-logo">
          <div className="logo-icon">
            <i className="fa-solid fa-stethoscope"></i>
          </div>
        </div>
        
        <div className="splash-text">
          <h1>دستیار پزشکی</h1>
          <p>مشاوره هوشمند سلامت</p>
        </div>
      </div>
    </div>
  )
}
import { useEffect, useState } from 'react'

interface SplashScreenProps {
  onComplete: () => void
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [animationPhase, setAnimationPhase] = useState<'fadeIn' | 'visible' | 'splitOut'>('fadeIn')

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setAnimationPhase('visible')
    }, 500) // Fade in duration

    const timer2 = setTimeout(() => {
      setAnimationPhase('splitOut')
    }, 3000) // Show for 2.5 seconds after fade in

    const timer3 = setTimeout(() => {
      setIsVisible(false)
      onComplete()
    }, 4000) // Split animation duration

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div className={`splash-screen ${animationPhase}`}>
      {/* Top Half - Will slide up */}
      <div className="splash-half top-half">
        <div className="splash-content">
          <div className="splash-logo">
            <div className="logo-icon">
              <i className="fa-solid fa-user-doctor"></i>
            </div>
            <div className="logo-pulse"></div>
          </div>
          
          <div className="splash-text">
            <h1>سلامت‌بات</h1>
            <p>همراه سلامتی شما</p>
          </div>
          
          <div className="splash-subtitle">
            <span>SalamatBot - Your Health Companion</span>
          </div>
        </div>
        
        <div className="splash-background">
          <div className="floating-icon floating-icon-1">
            <i className="fa-solid fa-heartbeat"></i>
          </div>
          <div className="floating-icon floating-icon-2">
            <i className="fa-solid fa-pills"></i>
          </div>
          <div className="floating-icon floating-icon-3">
            <i className="fa-solid fa-stethoscope"></i>
          </div>
          <div className="floating-icon floating-icon-4">
            <i className="fa-solid fa-heart-pulse"></i>
          </div>
        </div>
      </div>

      {/* Bottom Half - Will slide down */}
      <div className="splash-half bottom-half">
        <div className="splash-content">
          <div className="splash-logo">
            <div className="logo-icon">
              <i className="fa-solid fa-user-doctor"></i>
            </div>
            <div className="logo-pulse"></div>
          </div>
          
          <div className="splash-text">
            <h1>سلامت‌بات</h1>
            <p>همراه سلامتی شما</p>
          </div>
          
          <div className="splash-subtitle">
            <span>SalamatBot - Your Health Companion</span>
          </div>
        </div>
        
        <div className="splash-background">
          <div className="floating-icon floating-icon-1">
            <i className="fa-solid fa-heartbeat"></i>
          </div>
          <div className="floating-icon floating-icon-2">
            <i className="fa-solid fa-pills"></i>
          </div>
          <div className="floating-icon floating-icon-3">
            <i className="fa-solid fa-stethoscope"></i>
          </div>
          <div className="floating-icon floating-icon-4">
            <i className="fa-solid fa-heart-pulse"></i>
          </div>
        </div>
      </div>
    </div>
  )
}
/**
 * Emergency Alert Component
 * 
 * This component provides special UI handling for emergency cases with
 * fast-track response indicators, urgent action buttons, and emergency banners.
 */

import { useState, useEffect } from 'react'
import { assessEmergencyLevel, EMERGENCY_RESPONSE_TEMPLATES } from '../lib/prompts'

interface EmergencyAlertProps {
  message: string
  isVisible?: boolean
  onEmergencyAction?: (action: string) => void
  onDismiss?: () => void
  autoShow?: boolean
  variant?: 'banner' | 'modal' | 'inline'
}

export default function EmergencyAlert({
  message,
  isVisible = true,
  onEmergencyAction,
  onDismiss,
  autoShow = true,
  variant = 'banner'
}: EmergencyAlertProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)

  const emergencyAssessment = assessEmergencyLevel(message)

  // Auto-show actions for critical emergencies
  useEffect(() => {
    if (emergencyAssessment.urgencyLevel === 'critical' && autoShow) {
      setShowActions(true)
      setIsExpanded(true)
    }
  }, [emergencyAssessment.urgencyLevel, autoShow])

  // Timer for emergency response time tracking
  useEffect(() => {
    if (isVisible && emergencyAssessment.isEmergency) {
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1)
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [isVisible, emergencyAssessment.isEmergency])

  if (!isVisible || !emergencyAssessment.isEmergency) {
    return null
  }

  const handleEmergencyAction = (action: string) => {
    if (onEmergencyAction) {
      onEmergencyAction(action)
    }
    
    // Handle specific emergency actions
    switch (action) {
      case 'call_115':
        window.open('tel:115', '_self')
        break
      case 'call_1480':
        window.open('tel:1480', '_self')
        break
      case 'find_hospital':
        // In a real app, this would open maps or hospital finder
        window.open('https://maps.google.com/search/hospital+near+me', '_blank')
        break
      default:
        break
    }
  }

  const getEmergencyTemplate = () => {
    switch (emergencyAssessment.emergencyType) {
      case 'life_threatening':
        if (emergencyAssessment.keywordsFound.some(k => 
          ['حمله قلبی', 'سکته قلبی', 'درد قفسه سینه'].includes(k)
        )) {
          return EMERGENCY_RESPONSE_TEMPLATES.CRITICAL_CARDIAC
        }
        if (emergencyAssessment.keywordsFound.some(k => 
          ['تنگی نفس', 'خفگی', 'نمی‌توانم نفس بکشم'].includes(k)
        )) {
          return EMERGENCY_RESPONSE_TEMPLATES.CRITICAL_RESPIRATORY
        }
        return EMERGENCY_RESPONSE_TEMPLATES.HIGH_URGENCY
      case 'psychological_emergency':
        return EMERGENCY_RESPONSE_TEMPLATES.PSYCHOLOGICAL_EMERGENCY
      case 'urgent_medical':
        return EMERGENCY_RESPONSE_TEMPLATES.HIGH_URGENCY
      default:
        return EMERGENCY_RESPONSE_TEMPLATES.HIGH_URGENCY
    }
  }

  if (variant === 'modal') {
    return (
      <div className="emergency-modal-overlay">
        <div className={`emergency-modal ${emergencyAssessment.urgencyLevel}`}>
          <EmergencyContent 
            assessment={emergencyAssessment}
            template={getEmergencyTemplate()}
            timeElapsed={timeElapsed}
            isExpanded={isExpanded}
            showActions={showActions}
            onToggleExpanded={() => setIsExpanded(!isExpanded)}
            onToggleActions={() => setShowActions(!showActions)}
            onAction={handleEmergencyAction}
            onDismiss={onDismiss}
          />
        </div>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`emergency-alert inline ${emergencyAssessment.urgencyLevel}`}>
        <EmergencyContent 
          assessment={emergencyAssessment}
          template={getEmergencyTemplate()}
          timeElapsed={timeElapsed}
          isExpanded={isExpanded}
          showActions={showActions}
          onToggleExpanded={() => setIsExpanded(!isExpanded)}
          onToggleActions={() => setShowActions(!showActions)}
          onAction={handleEmergencyAction}
          onDismiss={onDismiss}
          compact={true}
        />
      </div>
    )
  }

  // Default banner variant
  return (
    <div className={`emergency-banner ${emergencyAssessment.urgencyLevel} ${isExpanded ? 'expanded' : ''}`}>
      <EmergencyContent 
        assessment={emergencyAssessment}
        template={getEmergencyTemplate()}
        timeElapsed={timeElapsed}
        isExpanded={isExpanded}
        showActions={showActions}
        onToggleExpanded={() => setIsExpanded(!isExpanded)}
        onToggleActions={() => setShowActions(!showActions)}
        onAction={handleEmergencyAction}
        onDismiss={onDismiss}
      />
    </div>
  )
}

// Emergency content component
interface EmergencyContentProps {
  assessment: ReturnType<typeof assessEmergencyLevel>
  template: string
  timeElapsed: number
  isExpanded: boolean
  showActions: boolean
  onToggleExpanded: () => void
  onToggleActions: () => void
  onAction: (action: string) => void
  onDismiss?: () => void
  compact?: boolean
}

function EmergencyContent({
  assessment,
  template,
  timeElapsed,
  isExpanded,
  showActions,
  onToggleExpanded,
  onToggleActions,
  onAction,
  onDismiss,
  compact = false
}: EmergencyContentProps) {
  const getUrgencyIcon = () => {
    switch (assessment.urgencyLevel) {
      case 'critical': return '🚨'
      case 'high': return '⚠️'
      case 'medium': return '⚡'
      default: return '📋'
    }
  }

  const getUrgencyLabel = () => {
    switch (assessment.urgencyLevel) {
      case 'critical': return 'اورژانس بحرانی'
      case 'high': return 'اورژانس بالا'
      case 'medium': return 'نیاز به توجه'
      default: return 'عادی'
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="emergency-content">
      {/* Header */}
      <div className="emergency-header">
        <div className="emergency-indicator">
          <span className="emergency-icon">{getUrgencyIcon()}</span>
          <span className="emergency-label">{getUrgencyLabel()}</span>
          {assessment.urgencyLevel === 'critical' && (
            <span className="critical-badge">فوری</span>
          )}
        </div>
        
        <div className="emergency-meta">
          {timeElapsed > 0 && (
            <span className="time-elapsed">
              <i className="fa-solid fa-clock"></i>
              {formatTime(timeElapsed)}
            </span>
          )}
          
          {onDismiss && (
            <button className="dismiss-btn" onClick={onDismiss}>
              <i className="fa-solid fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {/* Quick actions for critical cases */}
      {assessment.urgencyLevel === 'critical' && (
        <div className="critical-actions">
          <button 
            className="emergency-action-btn call-115"
            onClick={() => onAction('call_115')}
          >
            <i className="fa-solid fa-phone"></i>
            تماس با ۱۱۵
          </button>
          
          {assessment.emergencyType === 'psychological_emergency' && (
            <button 
              className="emergency-action-btn call-1480"
              onClick={() => onAction('call_1480')}
            >
              <i className="fa-solid fa-heart"></i>
              خط کمک ۱۴۸۰
            </button>
          )}
          
          <button 
            className="emergency-action-btn find-hospital"
            onClick={() => onAction('find_hospital')}
          >
            <i className="fa-solid fa-hospital"></i>
            یافتن بیمارستان
          </button>
        </div>
      )}

      {/* Emergency message */}
      <div className="emergency-message">
        {assessment.keywordsFound.length > 0 && (
          <div className="detected-keywords">
            <span className="keywords-label">علائم شناسایی شده:</span>
            <div className="keywords-list">
              {assessment.keywordsFound.map((keyword, index) => (
                <span key={index} className="keyword-tag">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {!compact && (
          <div className="emergency-description">
            <p>بر اساس علائم ذکر شده، این ممکن است نشان‌دهنده وضعیت اورژانسی باشد.</p>
          </div>
        )}
      </div>

      {/* Expandable details */}
      {!compact && (
        <div className="emergency-details">
          <button 
            className="expand-btn"
            onClick={onToggleExpanded}
          >
            <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
            {isExpanded ? 'کمتر' : 'اطلاعات بیشتر'}
          </button>
          
          {isExpanded && (
            <div className="expanded-content">
              <div 
                className="emergency-template"
                dangerouslySetInnerHTML={{ __html: template.replace(/\n/g, '<br>') }}
              />
              
              <div className="recommended-actions">
                <h4>اقدامات توصیه شده:</h4>
                <ul>
                  {assessment.recommendedActions.map((action, index) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      {!compact && (
        <div className="emergency-actions">
          <button 
            className="action-toggle-btn"
            onClick={onToggleActions}
          >
            <i className="fa-solid fa-hand-point-up"></i>
            {showActions ? 'مخفی کردن اقدامات' : 'نمایش اقدامات'}
          </button>
          
          {showActions && (
            <div className="action-buttons">
              <button 
                className="action-btn primary"
                onClick={() => onAction('call_115')}
              >
                <i className="fa-solid fa-phone"></i>
                اورژانس ۱۱۵
              </button>
              
              <button 
                className="action-btn secondary"
                onClick={() => onAction('find_hospital')}
              >
                <i className="fa-solid fa-map-marker-alt"></i>
                یافتن بیمارستان
              </button>
              
              <button 
                className="action-btn info"
                onClick={() => onAction('save_info')}
              >
                <i className="fa-solid fa-save"></i>
                ذخیره اطلاعات
              </button>
            </div>
          )}
        </div>
      )}

      {/* Progress indicator for critical cases */}
      {assessment.urgencyLevel === 'critical' && timeElapsed > 0 && (
        <div className="emergency-progress">
          <div className="progress-label">
            زمان گذشته از تشخیص اورژانس
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${Math.min((timeElapsed / 300) * 100, 100)}%`,
                backgroundColor: timeElapsed > 180 ? '#ef4444' : timeElapsed > 60 ? '#f59e0b' : '#22c55e'
              }}
            />
          </div>
          <div className="progress-message">
            {timeElapsed > 180 && 'زمان زیادی گذشته - فوراً اقدام کنید'}
            {timeElapsed > 60 && timeElapsed <= 180 && 'لطفاً سریع‌تر اقدام کنید'}
            {timeElapsed <= 60 && 'در حال پیگیری...'}
          </div>
        </div>
      )}
    </div>
  )
}

// Fast-track response indicator
interface FastTrackIndicatorProps {
  isActive: boolean
  responseTime?: number
  stage: 'analyzing' | 'responding' | 'complete'
}

export function FastTrackIndicator({ 
  isActive, 
  responseTime,
  stage 
}: FastTrackIndicatorProps) {
  if (!isActive) return null

  return (
    <div className="fast-track-indicator">
      <div className="fast-track-header">
        <span className="fast-track-icon">⚡</span>
        <span className="fast-track-label">پاسخ سریع اورژانس</span>
        {responseTime && (
          <span className="response-time">
            {responseTime}ms
          </span>
        )}
      </div>
      
      <div className="fast-track-progress">
        <div className={`progress-step ${stage === 'analyzing' ? 'active' : stage === 'responding' || stage === 'complete' ? 'complete' : ''}`}>
          <span className="step-icon">🔍</span>
          <span className="step-label">تحلیل</span>
        </div>
        
        <div className={`progress-step ${stage === 'responding' ? 'active' : stage === 'complete' ? 'complete' : ''}`}>
          <span className="step-icon">💬</span>
          <span className="step-label">پاسخ</span>
        </div>
        
        <div className={`progress-step ${stage === 'complete' ? 'complete' : ''}`}>
          <span className="step-icon">✅</span>
          <span className="step-label">تکمیل</span>
        </div>
      </div>
    </div>
  )
}

// Emergency contact component
export function EmergencyContacts() {
  const contacts = [
    { name: 'اورژانس', number: '115', icon: '🚨', description: 'اورژانس‌های پزشکی' },
    { name: 'آتش‌نشانی', number: '125', icon: '🚒', description: 'آتش‌سوزی و نجات' },
    { name: 'پلیس', number: '110', icon: '👮', description: 'اورژانس‌های امنیتی' },
    { name: 'خط کمک روانی', number: '1480', icon: '💚', description: 'مشاوره روانی' },
  ]

  return (
    <div className="emergency-contacts">
      <h3>شماره‌های اورژانس</h3>
      <div className="contacts-grid">
        {contacts.map((contact, index) => (
          <div key={index} className="contact-card">
            <div className="contact-icon">{contact.icon}</div>
            <div className="contact-info">
              <div className="contact-name">{contact.name}</div>
              <div className="contact-number">
                <a href={`tel:${contact.number}`}>{contact.number}</a>
              </div>
              <div className="contact-description">{contact.description}</div>
            </div>
            <button 
              className="call-btn"
              onClick={() => window.open(`tel:${contact.number}`, '_self')}
            >
              <i className="fa-solid fa-phone"></i>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
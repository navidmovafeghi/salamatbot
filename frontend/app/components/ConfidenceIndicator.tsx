/**
 * Confidence Indicator Component
 * 
 * This component provides visual confidence meters, information completeness
 * progress bars, and color-coded confidence levels for medical responses.
 */

import { useState } from 'react'
import { getConfidenceLevel } from '../lib/prompts'
import { ConfidenceAssessment } from '../types/conversation'

interface ConfidenceIndicatorProps {
  confidence: ConfidenceAssessment
  informationCompleteness?: number
  showDetails?: boolean
  variant?: 'compact' | 'detailed' | 'inline'
  animated?: boolean
}

export default function ConfidenceIndicator({
  confidence,
  informationCompleteness,
  showDetails = false,
  variant = 'detailed',
  animated = true
}: ConfidenceIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const confidenceLevel = getConfidenceLevel(confidence.overallScore)

  if (variant === 'compact') {
    return (
      <div className="confidence-indicator compact">
        <div className="confidence-badge" style={{ backgroundColor: confidenceLevel.color }}>
          <span className="confidence-icon">{confidenceLevel.icon}</span>
          <span className="confidence-score">{Math.round(confidence.overallScore)}%</span>
        </div>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className="confidence-indicator inline">
        <span className="confidence-icon" style={{ color: confidenceLevel.color }}>
          {confidenceLevel.icon}
        </span>
        <span className="confidence-text">
          {confidenceLevel.label} ({Math.round(confidence.overallScore)}%)
        </span>
      </div>
    )
  }

  return (
    <div className={`confidence-indicator detailed ${animated ? 'animated' : ''}`}>
      {/* Main confidence display */}
      <div className="confidence-main">
        <div className="confidence-header">
          <div className="confidence-title">
            <span className="confidence-icon" style={{ color: confidenceLevel.color }}>
              {confidenceLevel.icon}
            </span>
            <span className="confidence-label">{confidenceLevel.label}</span>
          </div>
          <div className="confidence-score-display">
            <span className="score-value">{Math.round(confidence.overallScore)}%</span>
          </div>
        </div>

        {/* Main confidence bar */}
        <div className="confidence-bar-container">
          <div className="confidence-bar">
            <div 
              className={`confidence-fill ${animated ? 'animated-fill' : ''}`}
              style={{ 
                width: `${confidence.overallScore}%`,
                backgroundColor: confidenceLevel.color,
                animationDelay: animated ? '0.2s' : '0s'
              }}
            />
          </div>
          <div className="confidence-description">
            {confidenceLevel.description}
          </div>
        </div>
      </div>

      {/* Information completeness */}
      {informationCompleteness !== undefined && (
        <div className="information-completeness">
          <div className="completeness-header">
            <span className="completeness-label">
              <i className="fa-solid fa-info-circle"></i>
              کیفیت اطلاعات
            </span>
            <span className="completeness-score">
              {Math.round(informationCompleteness)}%
            </span>
          </div>
          <div className="completeness-bar">
            <div 
              className={`completeness-fill ${animated ? 'animated-fill' : ''}`}
              style={{ 
                width: `${informationCompleteness}%`,
                backgroundColor: getCompletenessColor(informationCompleteness),
                animationDelay: animated ? '0.4s' : '0s'
              }}
            />
          </div>
          <div className="completeness-message">
            {getCompletenessMessage(informationCompleteness)}
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {showDetails && (
        <div className="confidence-details">
          <button
            className="details-toggle"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
            جزئیات ارزیابی
          </button>
          
          {isExpanded && (
            <div className="details-content">
              <CategoryBreakdown 
                categories={confidence.categoryScores}
                animated={animated}
              />
              
              {confidence.reasoning && (
                <div className="confidence-reasoning">
                  <h4>توضیحات:</h4>
                  <p>{confidence.reasoning}</p>
                </div>
              )}
              
              {confidence.recommendations && confidence.recommendations.length > 0 && (
                <div className="confidence-recommendations">
                  <h4>توصیه‌ها:</h4>
                  <ul>
                    {confidence.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Category breakdown component
interface CategoryBreakdownProps {
  categories: Array<{ category: string; score: number }>
  animated?: boolean
}

function CategoryBreakdown({ categories, animated = true }: CategoryBreakdownProps) {
  const categoryLabels: Record<string, string> = {
    'informationQuality': 'کیفیت اطلاعات',
    'symptomClarity': 'وضوح علائم',
    'urgencyLevel': 'سطح اورژانس',
    'complexity': 'پیچیدگی',
    'medicalSafety': 'ایمنی پزشکی',
    'severity': 'شدت',
    'timing': 'زمان‌بندی',
    'location': 'محل',
    'symptoms': 'علائم',
    'context': 'بافت'
  }

  const categoryIcons: Record<string, string> = {
    'informationQuality': '📊',
    'symptomClarity': '🔍',
    'urgencyLevel': '⚡',
    'complexity': '🧩',
    'medicalSafety': '🛡️',
    'severity': '📈',
    'timing': '⏰',
    'location': '📍',
    'symptoms': '🩺',
    'context': '📋'
  }

  return (
    <div className="category-breakdown">
      <h4>تفکیک دسته‌بندی:</h4>
      <div className="category-list">
        {categories.map((cat, index) => {
          const level = getConfidenceLevel(cat.score)
          return (
            <div key={cat.category} className="category-item">
              <div className="category-header">
                <span className="category-icon">
                  {categoryIcons[cat.category] || '📋'}
                </span>
                <span className="category-name">
                  {categoryLabels[cat.category] || cat.category}
                </span>
                <span className="category-score">
                  {Math.round(cat.score)}%
                </span>
              </div>
              <div className="category-bar">
                <div 
                  className={`category-fill ${animated ? 'animated-fill' : ''}`}
                  style={{ 
                    width: `${cat.score}%`,
                    backgroundColor: level.color,
                    animationDelay: animated ? `${0.6 + index * 0.1}s` : '0s'
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Confidence trend component
interface ConfidenceTrendProps {
  history: ConfidenceAssessment[]
  maxPoints?: number
}

export function ConfidenceTrend({ history, maxPoints = 10 }: ConfidenceTrendProps) {
  if (history.length < 2) return null

  const recentHistory = history.slice(-maxPoints)
  const maxScore = Math.max(...recentHistory.map(h => h.overallScore))
  const minScore = Math.min(...recentHistory.map(h => h.overallScore))
  const trend = recentHistory[recentHistory.length - 1].overallScore - recentHistory[0].overallScore

  return (
    <div className="confidence-trend">
      <div className="trend-header">
        <span className="trend-title">
          <i className="fa-solid fa-chart-line"></i>
          روند اطمینان
        </span>
        <span className={`trend-indicator ${trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'neutral'}`}>
          {trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️'}
          {trend > 0 ? '+' : ''}{Math.round(trend)}%
        </span>
      </div>
      
      <div className="trend-chart">
        <svg viewBox="0 0 200 60" className="trend-svg">
          <polyline
            points={recentHistory.map((h, i) => 
              `${(i / (recentHistory.length - 1)) * 180 + 10},${50 - ((h.overallScore - minScore) / (maxScore - minScore || 1)) * 40}`
            ).join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            className="trend-line"
          />
          {recentHistory.map((h, i) => (
            <circle
              key={i}
              cx={(i / (recentHistory.length - 1)) * 180 + 10}
              cy={50 - ((h.overallScore - minScore) / (maxScore - minScore || 1)) * 40}
              r="3"
              fill="#3b82f6"
              className="trend-point"
            />
          ))}
        </svg>
      </div>
      
      <div className="trend-summary">
        <span className="trend-range">
          دامنه: {Math.round(minScore)}% - {Math.round(maxScore)}%
        </span>
      </div>
    </div>
  )
}

// Helper functions
function getCompletenessColor(completeness: number): string {
  if (completeness >= 80) return '#22c55e'
  if (completeness >= 60) return '#84cc16'
  if (completeness >= 40) return '#f59e0b'
  return '#ef4444'
}

function getCompletenessMessage(completeness: number): string {
  if (completeness >= 80) return '✅ اطلاعات کامل و جامع'
  if (completeness >= 60) return '✓ اطلاعات مناسب'
  if (completeness >= 40) return '⚠️ اطلاعات ناکافی'
  return '❗ نیاز به اطلاعات بیشتر'
}

// Real-time confidence monitor
interface ConfidenceMonitorProps {
  currentConfidence: number
  targetConfidence?: number
  isImproving?: boolean
}

export function ConfidenceMonitor({ 
  currentConfidence, 
  targetConfidence = 75,
  isImproving = false 
}: ConfidenceMonitorProps) {
  const level = getConfidenceLevel(currentConfidence)
  const progress = (currentConfidence / targetConfidence) * 100
  
  return (
    <div className="confidence-monitor">
      <div className="monitor-header">
        <span className="monitor-title">پیش‌بینی اطمینان</span>
        <span className={`improvement-indicator ${isImproving ? 'improving' : ''}`}>
          {isImproving ? '📈' : '⏸️'}
        </span>
      </div>
      
      <div className="monitor-display">
        <div className="current-confidence">
          <span className="current-label">فعلی:</span>
          <span className="current-value" style={{ color: level.color }}>
            {Math.round(currentConfidence)}%
          </span>
        </div>
        
        <div className="target-progress">
          <span className="target-label">هدف: {targetConfidence}%</span>
          <div className="target-bar">
            <div 
              className="target-fill"
              style={{ 
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: progress >= 100 ? '#22c55e' : '#3b82f6'
              }}
            />
          </div>
        </div>
        
        {progress >= 100 && (
          <div className="target-achieved">
            <i className="fa-solid fa-check-circle"></i>
            هدف اطمینان محقق شد
          </div>
        )}
      </div>
    </div>
  )
}
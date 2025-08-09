'use client'

import { useState } from 'react'
import InitialScreen from './components/InitialScreen'
import ChatScreen from './components/ChatScreen'
import ChatForm from './components/ChatForm'
import SplashScreen from './components/SplashScreen'
import ToastContainer from './components/ToastContainer'
import CommonQuestionsModal from './components/CommonQuestionsModal'
import { AppProvider, useAppContext } from './contexts'

export interface Message {
  id: string
  text: string
  type: 'user' | 'bot'
  timestamp: Date
  isLoading?: boolean
  isError?: boolean
  isEmergency?: boolean
  options?: string[]
  specialFeatures?: {
    quickActions?: Array<{
      label: string
      action: string
      type: 'emergency' | 'info' | 'action'
      phone?: string
    }>
    visualElements?: {
      type: 'warning' | 'info' | 'success' | 'medical'
      content: string
    }
    followUpSuggestions?: string[]
  }
}

// Main App Component (restored to original design)
function AppContent() {
  const {
    showSplash,
    isChatMode,
    showSaveDialog,
    isReturnHomeMode,
    handleSplashComplete,
    generateSessionTitle,
    getMessageCount,
    handleSaveSession,
    handleDontSave,
    handleCancelSave,
    toasts,
    removeToast,
    toggleHistoryMenu,
  } = useAppContext()

  // State for common questions modal
  const [isCommonQuestionsOpen, setIsCommonQuestionsOpen] = useState(false)

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  return (
    <main className={`container ${isChatMode ? 'chat-active' : ''}`}>
      <InitialScreen />
      <ChatScreen />
      <ChatForm />
      
      {/* Action Buttons - Between ChatForm and Disclaimer */}
      {!isChatMode && (
        <div className="action-buttons-container">
          <button 
            className="action-btn menu-trigger"
            onClick={() => toggleHistoryMenu('initial')}
            title="تاریخچه گفتگوها"
          >
            <i className="fa-solid fa-history"></i>
            <span>تاریخچه</span>
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          
          <button 
            className="action-btn"
            onClick={() => setIsCommonQuestionsOpen(true)}
            title="سوالات متداول"
          >
            <i className="fa-solid fa-question-circle"></i>
            <span>سوالات متداول</span>
            <i className="fa-solid fa-arrow-left"></i>
          </button>
        </div>
      )}
      
      {/* Medical Disclaimer - Always visible */}
      {!isChatMode && (
        <div className="disclaimer">
          ⚕️ این دستیار هوشمند برای کمک اولیه و راهنمایی طراحی شده است. برای تشخیص دقیق، درمان و مراقبت‌های پزشکی، حتماً با پزشک متخصص مشورت کنید.
        </div>
      )}
      
      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="save-dialog-overlay">
          <div className="save-dialog">
            <div className="save-dialog-header">
              <h3>ذخیره گفتگو</h3>
            </div>
            <div className="save-dialog-content">
              <p>آیا می‌خواهید این گفتگو را ذخیره کنید؟</p>
              <div className="conversation-preview">
                <strong>عنوان:</strong> {generateSessionTitle()}
              </div>
              <div className="conversation-preview">
                <strong>تعداد پیام‌ها:</strong> {getMessageCount()} پیام
              </div>
            </div>
            <div className="save-dialog-actions">
              <button 
                className="save-dialog-btn cancel-btn" 
                onClick={handleCancelSave}
              >
                لغو
              </button>
              <button 
                className="save-dialog-btn dont-save-btn" 
                onClick={handleDontSave}
              >
                ذخیره نکن
              </button>
              <button 
                className="save-dialog-btn save-btn" 
                onClick={handleSaveSession}
              >
                ذخیره کن
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Common Questions Modal */}
      <CommonQuestionsModal 
        isOpen={isCommonQuestionsOpen}
        onClose={() => setIsCommonQuestionsOpen(false)}
      />
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </main>
  )
}

// Main exported component with Provider
export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
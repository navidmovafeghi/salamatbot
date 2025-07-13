'use client'

import InitialScreen from './components/InitialScreen'
import ChatScreen from './components/ChatScreen'
import ChatForm from './components/ChatForm'
import SplashScreen from './components/SplashScreen'
import { AppProvider, useAppContext } from './contexts'

export interface Message {
  id: string
  text: string
  type: 'user' | 'bot'
  timestamp: Date
  isLoading?: boolean
  isError?: boolean
  isEmergency?: boolean
}

// Main App Component (now just handles rendering)
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
  } = useAppContext()



  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  return (
    <main className={`container ${isChatMode ? 'chat-active' : ''}`}>
      <InitialScreen />
      <ChatScreen />
      <ChatForm />
      
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
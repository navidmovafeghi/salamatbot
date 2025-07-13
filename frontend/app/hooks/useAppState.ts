import { useState, useEffect } from 'react'

/**
 * Custom hook for managing general app state
 * Handles splash screen, chat mode, and UI state
 */
export const useAppState = () => {
  const [showSplash, setShowSplash] = useState(true)
  const [isChatMode, setIsChatMode] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  // Handle body class changes for chat mode
  useEffect(() => {
    if (isChatMode) {
      document.body.classList.add('chat-mode')
    } else {
      document.body.classList.remove('chat-mode')
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('chat-mode')
    }
  }, [isChatMode])

  const handleSplashComplete = () => {
    setShowSplash(false)
  }

  const viewChatHistory = () => {
    setShowHistoryModal(true)
  }
  
  const closeHistoryModal = () => {
    setShowHistoryModal(false)
  }

  const handleReturnHome = () => {
    // Always go directly to home without save dialog
    // Keep the session active in the background
    setIsChatMode(false)
  }

  const continueChat = () => {
    setIsChatMode(true)
  }

  const resumeCurrentSession = () => {
    setIsChatMode(true)
  }

  return {
    // State
    showSplash,
    isChatMode,
    showHistoryModal,
    
    // Actions
    setIsChatMode,
    handleSplashComplete,
    viewChatHistory,
    closeHistoryModal,
    handleReturnHome,
    continueChat,
    resumeCurrentSession,
  }
}
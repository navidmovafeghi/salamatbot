'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useMedicalChatApp } from '../hooks/useMedicalChatApp'
import { Message } from '../page'

// Define the context type
interface AppContextType {
  // State
  showSplash: boolean
  isChatMode: boolean
  showHistoryModal: boolean
  messages: Message[]
  isLoading: boolean
  currentSessionId: string
  isSessionSaved: boolean
  showSaveDialog: boolean
  pendingSuggestion: string
  hasExistingChat: boolean
  isReturnHomeMode: boolean
  
  // Actions
  handleSplashComplete: () => void
  viewChatHistory: () => void
  closeHistoryModal: () => void
  handleReturnHome: () => void
  continueChat: () => void
  resumeCurrentSession: () => void
  startNewChat: () => void
  clearConversationHistory: () => void
  loadSession: (sessionId: string) => void
  handleDeleteSession: (sessionId: string) => void
  handleSuggestionClick: (text: string) => void
  handleSendMessage: (text: string) => Promise<void>
  handleSaveSession: () => void
  handleDontSave: () => void
  handleCancelSave: () => void
  
  // Utilities
  generateSessionTitle: () => string
  getMessageCount: () => number
}

// Create the context
const AppContext = createContext<AppContextType | undefined>(undefined)

// Provider component
interface AppProviderProps {
  children: ReactNode
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Get all functionality from our main hook
  const appData = useMedicalChatApp()

  return (
    <AppContext.Provider value={appData}>
      {children}
    </AppContext.Provider>
  )
}

// Custom hook to use the context
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

// Export the context for advanced use cases
export { AppContext }
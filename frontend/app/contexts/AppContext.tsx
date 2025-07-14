'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useMedicalChatApp } from '../hooks/useMedicalChatApp'
import { useMenuManager, MenuType, ComponentType } from '../hooks/useMenuManager'
import { useToast, Toast } from '../hooks/useToast'
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
  
  // Menu state
  activeMenu: MenuType
  activeComponent: ComponentType
  isHistoryMenuOpen: boolean
  isMainMenuOpen: boolean
  isSuggestionsMenuOpen: boolean
  
  // Toast state
  toasts: Toast[]
  
  // Save state
  canSaveSession: boolean
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  
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
  handleManualSave: () => Promise<boolean | void>
  
  // Toast actions
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number) => string
  removeToast: (id: string) => void
  clearAllToasts: () => void
  
  // Menu actions
  openMenu: (menuType: MenuType, component: ComponentType) => void
  closeAllMenus: () => void
  toggleMenu: (menuType: MenuType, component: ComponentType) => void
  openHistoryMenu: (component: ComponentType) => void
  openMainMenu: (component: ComponentType) => void
  openSuggestionsMenu: (component: ComponentType) => void
  toggleHistoryMenu: (component: ComponentType) => void
  toggleMainMenu: (component: ComponentType) => void
  toggleSuggestionsMenu: (component: ComponentType) => void
  handleComponentChange: (component: ComponentType) => void
  
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
  const menuManager = useMenuManager()
  const toastManager = useToast()

  // Combine all data
  const contextValue = {
    ...appData,
    ...menuManager,
    ...toastManager,
  }

  return (
    <AppContext.Provider value={contextValue}>
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
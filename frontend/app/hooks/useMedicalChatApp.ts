import { useEffect, useState } from 'react'
import { useAppState } from './useAppState'
import { useSessionManager } from './useSessionManager'
import { useChatManager } from './useChatManager'
import { useSaveDialog } from './useSaveDialog'
import { generateSessionTitle } from '../lib/sessionManager'

/**
 * Main orchestrator hook that combines all app functionality
 * This is the single hook that components will use
 */
export const useMedicalChatApp = () => {
  // Initialize all sub-hooks
  const appState = useAppState()
  const sessionManager = useSessionManager()
  const chatManager = useChatManager()
  const saveDialog = useSaveDialog()
  
  // Save status state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  
  // Auto-update effect for saved sessions
  useEffect(() => {
    // Only auto-update if session is saved and has messages
    if (sessionManager.isSessionSaved && 
        sessionManager.currentSessionId && 
        chatManager.messages.length > 0 && 
        !chatManager.isLoading) {
      
      // Debounce auto-updates to avoid excessive saves
      const timeoutId = setTimeout(() => {
        try {
          sessionManager.handleSaveSession(chatManager.messages)
        } catch (error) {
          // Silent fail for auto-updates
        }
      }, 500)
      
      return () => clearTimeout(timeoutId)
    }
  }, [chatManager.messages, sessionManager.isSessionSaved, sessionManager.currentSessionId, chatManager.isLoading])

  // Load saved conversations on component mount
  useEffect(() => {
    const activeSession = sessionManager.loadSavedConversations()
    if (activeSession) {
      chatManager.loadMessages(activeSession.messages)
      if (activeSession.messages.length > 0) {
        appState.setIsChatMode(true)
      }
    }
  }, [])

  // Function to start a new chat (with save prompt if needed)
  const startNewChat = () => {
    // Check if there are unsaved messages
    if (chatManager.hasExistingChat && !sessionManager.isSessionSaved) {
      saveDialog.showSavePrompt('newChat')
    } else {
      // No unsaved messages, create new chat directly
      executeNewChat()
    }
  }

  // Function to execute new chat after save decision
  const executeNewChat = () => {
    try {
      // Completely reset everything
      chatManager.clearMessages()
      sessionManager.resetSession()
      appState.setIsChatMode(false)
    } catch (error) {
      // Handle error silently
    }
  }

  // Function to clear conversation history
  const clearConversationHistory = () => {
    try {
      sessionManager.clearSession()
      chatManager.clearMessages()
      // Don't change chat mode - stay in chat
    } catch (error) {
      // Handle error silently
    }
  }

  // Function to load a specific session
  const loadSession = (sessionId: string) => {
    const session = sessionManager.loadSession(sessionId, chatManager.messages)
    if (session) {
      chatManager.loadMessages(session.messages)
      appState.setIsChatMode(true)
    }
  }

  // Function to delete a session
  const handleDeleteSession = (sessionId: string) => {
    const wasCurrentSession = sessionManager.handleDeleteSession(sessionId)
    
    // If deleted session was current session, clear current state
    if (wasCurrentSession) {
      chatManager.clearMessages()
      appState.setIsChatMode(false)
    }
  }

  // Handle suggestion clicks with new session logic
  const handleSuggestionClick = (text: string) => {
    // If we have an active session with unsaved messages, ask to save first
    if (chatManager.hasExistingChat && !sessionManager.isSessionSaved) {
      // Store the suggestion text to send after save decision
      saveDialog.showSavePrompt('newChatWithSuggestion', text)
    } else {
      // No active session or already saved, start new session directly
      startNewSessionWithSuggestion(text)
    }
  }

  // Function to start new session with suggestion
  const startNewSessionWithSuggestion = (text: string) => {
    // Reset everything for new session
    chatManager.clearMessages()
    sessionManager.resetSession()
    appState.setIsChatMode(false)
    
    // Send the suggestion message
    handleSendMessage(text)
  }

  // Enhanced send message function with auto-update
  const handleSendMessage = async (text: string) => {
    // If this is the first message, transition to chat mode and create session if needed
    if (!appState.isChatMode) {
      appState.setIsChatMode(true)
    }
    
    // Create new session if we don't have one
    if (!sessionManager.currentSessionId) {
      sessionManager.createSession()
    }

    // Mark session as unsaved when new messages are added (for new sessions)
    if (!sessionManager.isSessionSaved) {
      sessionManager.markSessionUnsaved()
    }

    // Send the message using chat manager
    await chatManager.handleSendMessage(text)
    
    // Note: Auto-update is now handled by useEffect hook above
  }

  // Manual save function (for save button in menu)
  const handleManualSave = async () => {
    if (!chatManager.hasExistingChat || chatManager.isLoading) return
    
    setSaveStatus('saving')
    
    try {
      const savedId = sessionManager.handleSaveSession(chatManager.messages)
      if (savedId) {
        setSaveStatus('saved')
        // Reset status after showing success
        setTimeout(() => setSaveStatus('idle'), 2000)
        return true
      } else {
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 3000)
        return false
      }
    } catch (error) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
      return false
    }
  }

  // Handle save dialog - user chooses to save
  const handleSaveSession = () => {
    const savedId = sessionManager.handleSaveSession(chatManager.messages)
    if (savedId) {
      // Execute the pending action after saving
      if (saveDialog.pendingAction === 'newChat') {
        executeNewChat()
      } else if (saveDialog.pendingAction === 'returnHome') {
        appState.setIsChatMode(false)
      } else if (saveDialog.pendingAction === 'newChatWithSuggestion') {
        startNewSessionWithSuggestion(saveDialog.pendingSuggestion)
      }
    }
    saveDialog.handleCancelSave() // Close dialog
  }

  // Handle save dialog - user chooses not to save
  const handleDontSave = () => {
    // Don't save, but mark as "handled" so we don't prompt again
    sessionManager.setIsSessionSaved(true)
    
    // Execute the pending action
    if (saveDialog.pendingAction === 'newChat') {
      executeNewChat()
    } else if (saveDialog.pendingAction === 'returnHome') {
      appState.setIsChatMode(false)
    } else if (saveDialog.pendingAction === 'newChatWithSuggestion') {
      startNewSessionWithSuggestion(saveDialog.pendingSuggestion)
    }
    
    saveDialog.handleCancelSave() // Close dialog
  }

  // Computed values
  const isReturnHomeMode = !appState.isChatMode && (chatManager.hasExistingChat || !!sessionManager.currentSessionId)
  // Save button only available for new (unsaved) conversations
  const canSaveSession = chatManager.hasExistingChat && !chatManager.isLoading && !sessionManager.isSessionSaved

  return {
    // State from all hooks
    showSplash: appState.showSplash,
    isChatMode: appState.isChatMode,
    showHistoryModal: appState.showHistoryModal,
    messages: chatManager.messages,
    isLoading: chatManager.isLoading,
    currentSessionId: sessionManager.currentSessionId,
    isSessionSaved: sessionManager.isSessionSaved,
    showSaveDialog: saveDialog.showSaveDialog,
    pendingSuggestion: saveDialog.pendingSuggestion,
    
    // Computed values
    hasExistingChat: chatManager.hasExistingChat,
    isReturnHomeMode,
    canSaveSession,
    saveStatus,
    
    // Actions
    handleSplashComplete: appState.handleSplashComplete,
    viewChatHistory: appState.viewChatHistory,
    closeHistoryModal: appState.closeHistoryModal,
    handleReturnHome: appState.handleReturnHome,
    continueChat: appState.continueChat,
    resumeCurrentSession: appState.resumeCurrentSession,
    
    startNewChat,
    clearConversationHistory,
    loadSession,
    handleDeleteSession,
    handleSuggestionClick,
    handleSendMessage,
    
    handleSaveSession,
    handleDontSave,
    handleCancelSave: saveDialog.handleCancelSave,
    handleManualSave,
    
    // Utility function for save dialog
    generateSessionTitle: () => chatManager.messages.length > 0 ? generateSessionTitle(chatManager.messages) : 'گفتگوی جدید',
    getMessageCount: () => chatManager.messages.filter(m => !m.isLoading).length,
  }
}
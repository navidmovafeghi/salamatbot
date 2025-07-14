import { useState, useEffect } from 'react'
import { Message } from '../page'
import { 
  loadSessions, 
  saveCurrentSession, 
  loadSessionById, 
  deleteSession, 
  getActiveSessionId, 
  setActiveSessionId,
  createNewSession,
} from '../lib/sessionManager'

/**
 * Custom hook for managing chat sessions
 * Handles session creation, loading, saving, and deletion
 */
export const useSessionManager = () => {
  const [currentSessionId, setCurrentSessionId] = useState<string>('')
  const [isSessionSaved, setIsSessionSaved] = useState(false)

  // Load saved conversations on component mount
  const loadSavedConversations = () => {
    try {
      // Only load sessions on initial app load, not after user actions
      const activeSessionId = getActiveSessionId()
      if (activeSessionId) {
        const activeSession = loadSessionById(activeSessionId)
        if (activeSession) {
          setCurrentSessionId(activeSessionId)
          setIsSessionSaved(true) // Mark as saved since it's loaded from storage
          return activeSession
        }
      }
      
      // Start completely fresh - no session, no messages
      setCurrentSessionId('')
      setIsSessionSaved(false)
      return null
    } catch (error) {
      return null
    }
  }

  // Function to load a specific session
  const loadSession = (sessionId: string, messages: Message[]) => {
    try {
      // Check if current session needs saving before switching
      if (messages.length > 0 && !isSessionSaved && currentSessionId !== sessionId) {
        // Auto-save current session before switching
        saveCurrentSession(messages, currentSessionId)
      }
      
      // Load the selected session
      const session = loadSessionById(sessionId)
      if (session) {
        setCurrentSessionId(sessionId)
        setActiveSessionId(sessionId)
        setIsSessionSaved(true) // Loaded session is already saved
        return session
      }
      return null
    } catch (error) {
      return null
    }
  }

  // Function to delete a session
  const handleDeleteSession = (sessionId: string) => {
    try {
      deleteSession(sessionId)
      
      // If deleted session was current session, clear current state
      if (currentSessionId === sessionId) {
        setCurrentSessionId('')
        return true // Indicates current session was deleted
      }
      return false
    } catch (error) {
      return false
    }
  }

  // Function to save current session
  const handleSaveSession = (messages: Message[]) => {
    try {
      if (messages.length > 0) {
        const savedId = saveCurrentSession(messages, currentSessionId || undefined)
        
        // Update current session ID if it was a new session
        if (savedId && !currentSessionId) {
          setCurrentSessionId(savedId)
        }
        
        setIsSessionSaved(true) // Mark as saved
        return savedId
      }
      return null
    } catch (error) {
      return null
    }
  }

  // Function to create new session
  const createSession = () => {
    try {
      const newSession = createNewSession([])
      setCurrentSessionId(newSession.id)
      setActiveSessionId(newSession.id)
      setIsSessionSaved(false) // New session is not saved yet
      return newSession
    } catch (error) {
      return null
    }
  }

  // Function to clear session
  const clearSession = () => {
    try {
      if (currentSessionId) {
        deleteSession(currentSessionId)
      }
      setCurrentSessionId('')
      setIsSessionSaved(false)
    } catch (error) {
      // Handle error silently
    }
  }

  // Function to reset session state
  const resetSession = () => {
    setCurrentSessionId('')
    setIsSessionSaved(false)
    localStorage.removeItem('medical-chat-active')
  }

  // Mark session as unsaved when messages change
  const markSessionUnsaved = () => {
    setIsSessionSaved(false)
  }

  return {
    // State
    currentSessionId,
    isSessionSaved,
    
    // Actions
    loadSavedConversations,
    loadSession,
    handleDeleteSession,
    handleSaveSession,
    createSession,
    clearSession,
    resetSession,
    markSessionUnsaved,
    setCurrentSessionId,
    setIsSessionSaved,
  }
}
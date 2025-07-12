'use client'

import { useState, useEffect } from 'react'
import InitialScreen from './components/InitialScreen'
import ChatScreen from './components/ChatScreen'
import ChatForm from './components/ChatForm'
import SplashScreen from './components/SplashScreen'
import { 
  loadSessions, 
  saveCurrentSession, 
  loadSessionById, 
  deleteSession, 
  getActiveSessionId, 
  setActiveSessionId,
  createNewSession,
  getSessionList,
  generateSessionTitle,
  ChatSession
} from './lib/sessionManager'

export interface Message {
  id: string
  text: string
  type: 'user' | 'bot'
  timestamp: Date
  isLoading?: boolean
  isError?: boolean
  isEmergency?: boolean
}

export default function Home() {
  const [showSplash, setShowSplash] = useState(true)
  const [isChatMode, setIsChatMode] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string>('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<'newChat' | 'returnHome' | 'newChatWithSuggestion' | null>(null)
  const [isSessionSaved, setIsSessionSaved] = useState(false) // Track if current session is saved

  // Load saved conversations on component mount
  useEffect(() => {
    loadSavedConversations()
  }, [])

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


  // Function to load saved conversations from sessions (only on app startup)
  const loadSavedConversations = () => {
    try {
      // Only load sessions on initial app load, not after user actions
      const activeSessionId = getActiveSessionId()
      if (activeSessionId) {
        const activeSession = loadSessionById(activeSessionId)
        if (activeSession) {
          setMessages(activeSession.messages)
          setCurrentSessionId(activeSessionId)
          setIsSessionSaved(true) // Mark as saved since it's loaded from storage
          
          if (activeSession.messages.length > 0) {
            setIsChatMode(true)
          }
          return
        }
      }
      
      // Start completely fresh - no session, no messages
      console.log('Starting fresh - no active session')
      setMessages([])
      setCurrentSessionId('')
      setIsSessionSaved(false)
      setIsChatMode(false)
    } catch (error) {
      console.error('Error loading saved conversations:', error)
    }
  }

  // Function to clear conversation history
  const clearConversationHistory = () => {
    try {
      if (currentSessionId) {
        deleteSession(currentSessionId)
      }
      setMessages([])
      setCurrentSessionId('')
      // Don't change chat mode - stay in chat
    } catch (error) {
      console.error('Error clearing conversations:', error)
    }
  }

  // Function to return to home (no save dialog - direct navigation)
  const handleReturnHome = () => {
    // Always go directly to home without save dialog
    // Keep the session active in the background
    setIsChatMode(false)
  }

  // Function to start a new chat (with save prompt)
  const startNewChat = () => {
    // Check if there are unsaved messages
    if (messages.length > 0 && !isSessionSaved) {
      setPendingAction('newChat')
      setShowSaveDialog(true)
    } else {
      // No unsaved messages, create new chat directly
      executeNewChat()
    }
  }

  // Function to execute new chat after save decision
  const executeNewChat = () => {
    try {
      // Completely reset everything
      setMessages([])
      setCurrentSessionId('')
      setIsSessionSaved(false)
      setIsChatMode(false)
      
      // Clear active session from localStorage
      localStorage.removeItem('medical-chat-active')
      
      console.log('New chat started - completely fresh state')
    } catch (error) {
      console.error('Error starting new chat:', error)
    }
  }

  // Function to continue existing chat
  const continueChat = () => {
    setIsChatMode(true)
  }

  // Function to resume current active session
  const resumeCurrentSession = () => {
    setIsChatMode(true)
  }

  // Function to view chat history
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  
  const viewChatHistory = () => {
    setShowHistoryModal(true)
  }
  
  const closeHistoryModal = () => {
    setShowHistoryModal(false)
  }

  // Function to load a specific session
  const loadSession = (sessionId: string) => {
    try {
      // Check if current session needs saving before switching
      if (messages.length > 0 && !isSessionSaved && currentSessionId !== sessionId) {
        // Auto-save current session before switching
        saveCurrentSession(messages, currentSessionId)
      }
      
      // Load the selected session
      const session = loadSessionById(sessionId)
      if (session) {
        setMessages(session.messages)
        setCurrentSessionId(sessionId)
        setActiveSessionId(sessionId)
        setIsSessionSaved(true) // Loaded session is already saved
        setIsChatMode(true)
        console.log('Loaded session:', sessionId)
      }
    } catch (error) {
      console.error('Error loading session:', error)
    }
  }

  // Function to delete a session
  const handleDeleteSession = (sessionId: string) => {
    try {
      deleteSession(sessionId)
      
      // If deleted session was current session, clear current state
      if (currentSessionId === sessionId) {
        setMessages([])
        setCurrentSessionId('')
        setIsChatMode(false)
      }
    } catch (error) {
      console.error('Error deleting session:', error)
    }
  }

  // Handle save dialog - user chooses to save
  const handleSaveSession = () => {
    try {
      if (messages.length > 0 && currentSessionId) {
        console.log('=== SAVING SESSION ===')
        console.log('Session ID:', currentSessionId)
        console.log('Messages to save:', messages.length)
        console.log('Messages:', messages.map(m => ({ type: m.type, text: m.text.substring(0, 50) })))
        
        const savedId = saveCurrentSession(messages, currentSessionId)
        console.log('Session saved with ID:', savedId)
        
        // Verify it was saved
        const sessions = loadSessions()
        console.log('All sessions after save:', sessions.length)
        console.log('Session titles:', sessions.map(s => s.title))
        
        setIsSessionSaved(true) // Mark as saved
      } else {
        console.log('Cannot save - no messages or no session ID:', { 
          messagesLength: messages.length, 
          currentSessionId 
        })
      }
      
      // Execute the pending action
      executePendingAction()
    } catch (error) {
      console.error('Error saving session:', error)
    }
  }

  // Handle save dialog - user chooses not to save
  const handleDontSave = () => {
    console.log('User chose not to save session')
    // Don't save, but mark as "handled" so we don't prompt again
    setIsSessionSaved(true)
    executePendingAction()
  }

  // Execute the action that was pending save decision
  const executePendingAction = () => {
    setShowSaveDialog(false)
    
    if (pendingAction === 'newChat') {
      executeNewChat()
    } else if (pendingAction === 'returnHome') {
      setIsChatMode(false)
    } else if (pendingAction === 'newChatWithSuggestion') {
      startNewSessionWithSuggestion(pendingSuggestion)
      setPendingSuggestion('')
    }
    
    setPendingAction(null)
  }

  // Handle save dialog cancel
  const handleCancelSave = () => {
    setShowSaveDialog(false)
    setPendingAction(null)
  }

  // Check if there's existing chat history
  const hasExistingChat = messages.length > 0
  
  // Check if we're in "return home" mode (user has been chatting and returned)
  const isReturnHomeMode = !isChatMode && (hasExistingChat || currentSessionId)
  
  // Handle suggestion clicks with new session logic
  const handleSuggestionClick = (text: string) => {
    // If we have an active session with unsaved messages, ask to save first
    if (messages.length > 0 && !isSessionSaved) {
      // Store the suggestion text to send after save decision
      setPendingSuggestion(text)
      setPendingAction('newChatWithSuggestion')
      setShowSaveDialog(true)
    } else {
      // No active session or already saved, start new session directly
      startNewSessionWithSuggestion(text)
    }
  }
  
  // State for pending suggestion
  const [pendingSuggestion, setPendingSuggestion] = useState<string>('')
  
  // Function to start new session with suggestion
  const startNewSessionWithSuggestion = (text: string) => {
    // Reset everything for new session
    setMessages([])
    setCurrentSessionId('')
    setIsSessionSaved(false)
    setIsChatMode(false)
    
    // Clear active session from localStorage
    localStorage.removeItem('medical-chat-active')
    
    // Send the suggestion message
    handleSendMessage(text)
  }

  const handleSendMessage = async (text: string) => {
    // Prevent sending if already loading
    if (isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      type: 'user',
      timestamp: new Date()
    }

    // If this is the first message, transition to chat mode and create session if needed
    if (!isChatMode) {
      setIsChatMode(true)
    }
    
    // Create new session if we don't have one
    if (!currentSessionId) {
      const newSession = createNewSession([])
      console.log('Creating new session for first message:', newSession.id)
      setCurrentSessionId(newSession.id)
      setActiveSessionId(newSession.id)
      setIsSessionSaved(false) // New session is not saved yet
    }

    // Mark session as unsaved when new messages are added
    setIsSessionSaved(false)

    // Add user message
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    // Add loading message
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: 'در حال تایپ...',
      type: 'bot',
      timestamp: new Date(),
      isLoading: true
    }
    setMessages(prev => [...prev, loadingMessage])

    try {
      // Prepare conversation history for API
      const conversationHistory = messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.text
      }))

      // Call the API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          conversationHistory: conversationHistory
        })
      })

      const data = await response.json()

      // Remove loading message and add real response
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.isLoading)
        const botMessage: Message = {
          id: (Date.now() + 2).toString(),
          text: data.response || data.error || 'خطایی رخ داده است.',
          type: 'bot',
          timestamp: new Date(),
          isError: !response.ok,
          isEmergency: data.isEmergency || false
        }
        return [...withoutLoading, botMessage]
      })

    } catch (error) {
      console.error('Error calling chat API:', error)
      
      // Remove loading message and add error message
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.isLoading)
        const errorMessage: Message = {
          id: (Date.now() + 2).toString(),
          text: 'متأسفانه خطایی در ارتباط رخ داده است. لطفاً دوباره تلاش کنید.',
          type: 'bot',
          timestamp: new Date(),
          isError: true
        }
        return [...withoutLoading, errorMessage]
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSplashComplete = () => {
    setShowSplash(false)
  }

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  return (
    <main className={`container ${isChatMode ? 'chat-active' : ''}`}>
      <InitialScreen 
        isVisible={!isChatMode} 
        onPromptClick={handleSuggestionClick}
        onContinueChat={resumeCurrentSession}
        onStartNewChat={startNewChat}
        onViewHistory={viewChatHistory}
        showHistoryModal={showHistoryModal}
        onCloseHistoryModal={closeHistoryModal}
        hasExistingChat={hasExistingChat}
        isReturnHomeMode={isReturnHomeMode}
        onLoadSession={loadSession}
        onDeleteSession={handleDeleteSession}
      />
      <ChatScreen 
        isVisible={isChatMode} 
        messages={messages} 
        onClearHistory={clearConversationHistory}
        onReturnHome={handleReturnHome}
        onStartNewChat={startNewChat}
        onLoadSession={loadSession}
        onDeleteSession={handleDeleteSession}
      />
      {!isReturnHomeMode && (
        <ChatForm 
          onSendMessage={handleSendMessage}
          onContinueChat={continueChat}
          hasExistingChat={hasExistingChat}
          isChatMode={isChatMode}
        />
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
                <strong>عنوان:</strong> {messages.length > 0 ? generateSessionTitle(messages) : 'گفتگوی جدید'}
              </div>
              <div className="conversation-preview">
                <strong>تعداد پیام‌ها:</strong> {messages.filter(m => !m.isLoading).length} پیام
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
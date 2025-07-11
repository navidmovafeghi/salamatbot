'use client'

import { useState, useEffect } from 'react'
import InitialScreen from './components/InitialScreen'
import ChatScreen from './components/ChatScreen'
import ChatForm from './components/ChatForm'
import SplashScreen from './components/SplashScreen'

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

  // localStorage key for saving conversations
  const STORAGE_KEY = 'medical-chat-history'

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

  // Save conversations to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveConversations()
    }
  }, [messages])

  // Function to load saved conversations from localStorage
  const loadSavedConversations = () => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (savedData) {
        const parsedMessages: Message[] = JSON.parse(savedData)
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsedMessages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
        setMessages(messagesWithDates)
        
        // If there are saved messages, automatically enter chat mode
        if (messagesWithDates.length > 0) {
          setIsChatMode(true)
        }
      }
    } catch (error) {
      console.error('Error loading saved conversations:', error)
      // If there's an error, clear the corrupted data
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  // Function to save conversations to localStorage
  const saveConversations = () => {
    try {
      // Filter out loading messages before saving
      const messagesToSave = messages.filter(msg => !msg.isLoading)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messagesToSave))
    } catch (error) {
      console.error('Error saving conversations:', error)
      // Handle localStorage quota exceeded or other errors
    }
  }

  // Function to clear conversation history
  const clearConversationHistory = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setMessages([])
      // Don't change chat mode - stay in chat
    } catch (error) {
      console.error('Error clearing conversations:', error)
    }
  }

  // Function to return to home (keep history)
  const returnToHome = () => {
    setIsChatMode(false)
    // Keep messages intact - don't clear history
  }

  // Function to start a new chat (clear everything)
  const startNewChat = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setMessages([])
      setIsChatMode(false)
    } catch (error) {
      console.error('Error starting new chat:', error)
    }
  }

  // Function to continue existing chat
  const continueChat = () => {
    setIsChatMode(true)
  }

  // Check if there's existing chat history
  const hasExistingChat = messages.length > 0

  const handleSendMessage = async (text: string) => {
    // Prevent sending if already loading
    if (isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      type: 'user',
      timestamp: new Date()
    }

    // If this is the first message, transition to chat mode
    if (!isChatMode) {
      setIsChatMode(true)
    }

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
        onPromptClick={handleSendMessage}
        onContinueChat={continueChat}
        hasExistingChat={hasExistingChat}
      />
      <ChatScreen 
        isVisible={isChatMode} 
        messages={messages} 
        onClearHistory={clearConversationHistory}
        onReturnHome={returnToHome}
        onStartNewChat={startNewChat}
      />
      <ChatForm 
        onSendMessage={handleSendMessage}
        onContinueChat={continueChat}
        hasExistingChat={hasExistingChat}
        isChatMode={isChatMode}
      />
    </main>
  )
}
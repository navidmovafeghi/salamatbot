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
}

export default function Home() {
  const [showSplash, setShowSplash] = useState(true)
  const [isChatMode, setIsChatMode] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])

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

  const handleSendMessage = (text: string) => {
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

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'متشکرم! سوال شما دریافت شد. در حال بررسی پاسخ مناسب هستم.',
        type: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
    }, 1000)
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
      <InitialScreen isVisible={!isChatMode} onPromptClick={handleSendMessage} />
      <ChatScreen isVisible={isChatMode} messages={messages} />
      <ChatForm onSendMessage={handleSendMessage} />
    </main>
  )
}
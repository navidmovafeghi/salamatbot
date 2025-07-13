import { useState } from 'react'
import { Message } from '../page'

/**
 * Custom hook for managing chat messages and API communication
 * Handles message state, loading state, and API calls
 */
export const useChatManager = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Function to clear conversation history
  const clearMessages = () => {
    setMessages([])
  }

  // Function to load messages from session
  const loadMessages = (sessionMessages: Message[]) => {
    setMessages(sessionMessages)
  }

  // Function to send message to API
  const handleSendMessage = async (text: string) => {
    // Prevent sending if already loading
    if (isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      type: 'user',
      timestamp: new Date()
    }

    // Add user message
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    // Add loading message
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: 'در حال فکر کردن...',
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

  // Computed values
  const hasExistingChat = messages.length > 0

  return {
    // State
    messages,
    isLoading,
    hasExistingChat,
    
    // Actions
    clearMessages,
    loadMessages,
    handleSendMessage,
    setMessages,
  }
}
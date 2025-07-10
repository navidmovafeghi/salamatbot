import { useEffect, useRef } from 'react'
import { Message } from '../page'

interface ChatScreenProps {
  isVisible: boolean
  messages: Message[]
}

export default function ChatScreen({ isVisible, messages }: ChatScreenProps) {
  const chatHistoryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight
    }
  }, [messages])

  if (!isVisible) return null

  return (
    <div id="chat-screen">
      <div id="chat-history" ref={chatHistoryRef}>
        {messages.map((message) => (
          <div 
            key={message.id}
            className={`chat-message ${message.type === 'user' ? 'user-message' : 'bot-message'}`}
          >
            {message.text}
          </div>
        ))}
      </div>
    </div>
  )
}
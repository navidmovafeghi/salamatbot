'use client'

import React, { useState, useRef, useEffect } from 'react';
import TriageResult from './TriageResult';

interface TriageMessage {
  id: string;
  text: string;
  type: 'user' | 'bot';
  timestamp: Date;
  isLoading?: boolean;
  options?: string[];
}

interface TriageSession {
  sessionId: string | null;
  messages: TriageMessage[];
  isComplete: boolean;
  classification: string | null;
  template: any;
  finalResponse: any;
  disclaimer?: string;
}

export default function TriageChat() {
  const [session, setSession] = useState<TriageSession>({
    sessionId: null,
    messages: [],
    isComplete: false,
    classification: null,
    template: null,
    finalResponse: null
  });
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages]);

  // Initialize session on mount
  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'new_session' })
      });
      
      const data = await response.json();
      
      if (data.sessionId) {
        setSession(prev => ({
          ...prev,
          sessionId: data.sessionId,
          messages: [{
            id: 'welcome',
            text: 'سلام! من دستیار تریاژ پزشکی هستم. علائم یا مشکل پزشکی خود را توضیح دهید تا بتوانم به شما کمک کنم.',
            type: 'bot',
            timestamp: new Date()
          }]
        }));
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
      setSession(prev => ({
        ...prev,
        messages: [{
          id: 'error',
          text: 'متأسفانه خطایی رخ داده است. لطفاً صفحه را رفرش کنید.',
          type: 'bot',
          timestamp: new Date()
        }]
      }));
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || !session.sessionId || isLoading || session.isComplete) return;

    const userMessage: TriageMessage = {
      id: Date.now().toString(),
      text: message,
      type: 'user',
      timestamp: new Date()
    };

    // Add user message
    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          sessionId: session.sessionId
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.isComplete && data.classification) {
        // Final classification received
        setSession(prev => ({
          ...prev,
          isComplete: true,
          classification: data.classification,
          template: data.template,
          finalResponse: data.finalResponse,
          disclaimer: data.disclaimer
        }));
      } else if (data.message) {
        // Regular question
        const botMessage: TriageMessage = {
          id: (Date.now() + 1).toString(),
          text: data.message,
          type: 'bot',
          timestamp: new Date(),
          options: data.options
        };

        setSession(prev => ({
          ...prev,
          messages: [...prev.messages, botMessage]
        }));
      }

    } catch (error) {
      console.error('Send message error:', error);
      const errorMessage: TriageMessage = {
        id: (Date.now() + 1).toString(),
        text: 'متأسفانه خطایی رخ داده است. لطفاً دوباره تلاش کنید.',
        type: 'bot',
        timestamp: new Date()
      };

      setSession(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage]
      }));
    }

    setIsLoading(false);
  };

  const handleOptionClick = (option: string) => {
    sendMessage(option);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleNewSession = () => {
    setSession({
      sessionId: null,
      messages: [],
      isComplete: false,
      classification: null,
      template: null,
      finalResponse: null
    });
    initializeSession();
  };

  // Show final result if classification is complete
  if (session.isComplete && session.classification && session.template && session.finalResponse) {
    return (
      <TriageResult
        classification={session.classification}
        template={session.template}
        finalResponse={session.finalResponse}
        disclaimer={session.disclaimer}
        onNewSession={handleNewSession}
      />
    );
  }

  return (
    <div className="triage-chat">
      {/* Messages */}
      <div className="triage-messages">
        {session.messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-content">
              <div className="message-text">{message.text}</div>
              
              {/* Quick Options */}
              {message.options && message.options.length > 0 && (
                <div className="message-options">
                  {message.options.map((option, index) => (
                    <button
                      key={index}
                      className="option-btn"
                      onClick={() => handleOptionClick(option)}
                      disabled={isLoading}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="message-time">
              {message.timestamp.toLocaleTimeString('fa-IR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="message bot">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      {!session.isComplete && (
        <form className="triage-input-form" onSubmit={handleSubmit}>
          <div className="input-container">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="علائم خود را توضیح دهید..."
              disabled={isLoading || !session.sessionId}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading || !session.sessionId}
              className="send-btn"
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
          <div className="input-info">
            <span>برای بهترین نتیجه، علائم خود را با جزئیات توضیح دهید</span>
          </div>
        </form>
      )}
    </div>
  );
}
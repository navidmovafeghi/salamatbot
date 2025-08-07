'use client'

import React, { useState, useRef, useEffect } from 'react';

interface UnifiedMessage {
  id: string;
  text: string;
  type: 'user' | 'bot';
  timestamp: Date;
  isLoading?: boolean;
  options?: string[];
  category?: string;
  categoryName?: string;
  specialFeatures?: {
    quickActions?: Array<{
      label: string;
      action: string;
      type: 'emergency' | 'info' | 'action';
    }>;
    visualElements?: {
      type: 'warning' | 'info' | 'success' | 'medical';
      content: string;
    };
    followUpSuggestions?: string[];
  };
  metadata?: any;
}

interface UnifiedSession {
  sessionId: string | null;
  messages: UnifiedMessage[];
  currentCategory: string | null;
  isComplete: boolean;
}

export default function UnifiedChat() {
  const [session, setSession] = useState<UnifiedSession>({
    sessionId: null,
    messages: [],
    currentCategory: null,
    isComplete: false
  });
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryNotification, setShowCategoryNotification] = useState<string | null>(null);
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
      const response = await fetch('/api/unified', {
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
            text: 'سلام! من دستیار پزشکی SalamatBot هستم. مشکل یا سوال پزشکی خود را بیان کنید و من به بهترین نحو راهنمایی‌تان خواهم کرد.',
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

  const sendMessage = async (message: string, specialAction?: any) => {
    if (!message.trim() || !session.sessionId || isLoading) return;

    const userMessage: UnifiedMessage = {
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
      const requestBody: any = {
        message,
        sessionId: session.sessionId
      };

      if (specialAction) {
        requestBody.specialAction = specialAction;
      }

      const response = await fetch('/api/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Handle category notification
      if (data.metadata?.categoryNotification) {
        setShowCategoryNotification(data.metadata.categoryNotification.message);
        setTimeout(() => setShowCategoryNotification(null), 5000);
      }

      // Create bot response message
      const botMessage: UnifiedMessage = {
        id: (Date.now() + 1).toString(),
        text: data.message,
        type: 'bot',
        timestamp: new Date(),
        options: data.options,
        category: data.category,
        categoryName: data.categoryName,
        specialFeatures: data.specialFeatures,
        metadata: data.metadata
      };

      setSession(prev => ({
        ...prev,
        messages: [...prev.messages, botMessage],
        currentCategory: data.category,
        isComplete: data.isComplete || false
      }));

    } catch (error) {
      console.error('Send message error:', error);
      const errorMessage: UnifiedMessage = {
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

  const handleSpecialAction = (action: string, data?: any) => {
    const actionMessage = `اجرای عمل: ${action}`;
    sendMessage(actionMessage, { type: action, data });
  };

  const handleFollowUpSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleNewSession = () => {
    setSession({
      sessionId: null,
      messages: [],
      currentCategory: null,
      isComplete: false
    });
    setShowCategoryNotification(null);
    initializeSession();
  };

  const renderSpecialFeatures = (features: any) => {
    if (!features) return null;

    return (
      <div className="special-features">
        {/* Visual Elements */}
        {features.visualElements && (
          <div className={`visual-element ${features.visualElements.type}`}>
            <span className="visual-content">{features.visualElements.content}</span>
          </div>
        )}

        {/* Quick Actions */}
        {features.quickActions && features.quickActions.length > 0 && (
          <div className="quick-actions">
            <span className="quick-actions-label">عملیات سریع:</span>
            <div className="action-buttons">
              {features.quickActions.map((action: any, index: number) => (
                <button
                  key={index}
                  className={`quick-action-btn ${action.type}`}
                  onClick={() => handleSpecialAction(action.action)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Follow-up Suggestions */}
        {features.followUpSuggestions && features.followUpSuggestions.length > 0 && (
          <div className="followup-suggestions">
            <span className="suggestions-label">پیشنهادات:</span>
            <div className="suggestion-chips">
              {features.followUpSuggestions.map((suggestion: string, index: number) => (
                <button
                  key={index}
                  className="suggestion-chip"
                  onClick={() => handleFollowUpSuggestion(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="unified-chat">
      {/* Category Notification */}
      {showCategoryNotification && (
        <div className="category-notification">
          <div className="notification-content">
            <i className="fa-solid fa-info-circle"></i>
            <span>{showCategoryNotification}</span>
          </div>
        </div>
      )}

      {/* Current Category Indicator */}
      {session.currentCategory && (
        <div className="current-category">
          <i className="fa-solid fa-tag"></i>
          <span>دسته فعلی: {session.currentCategory}</span>
        </div>
      )}

      {/* Messages */}
      <div className="unified-messages">
        {session.messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-content">
              <div className="message-text">{message.text}</div>
              
              {/* Category Badge */}
              {message.categoryName && (
                <div className="category-badge">
                  <span>{message.categoryName}</span>
                </div>
              )}
              
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

              {/* Special Features */}
              {renderSpecialFeatures(message.specialFeatures)}
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
      <form className="unified-input-form" onSubmit={handleSubmit}>
        <div className="input-container">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="سوال یا مشکل پزشکی خود را بیان کنید..."
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
        
        {/* Help Text */}
        <div className="input-help">
          <span>من علائم، سوالات دارویی، اطلاعات پزشکی و مسائل سلامت شما را بررسی می‌کنم.</span>
          
          {/* New Session Button */}
          {session.messages.length > 2 && (
            <button
              type="button"
              className="new-session-btn"
              onClick={handleNewSession}
            >
              <i className="fa-solid fa-plus"></i>
              گفتگوی جدید
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
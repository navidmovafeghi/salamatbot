import { Message } from '../page'

export interface ChatSession {
  id: string
  title: string
  createdDate: string
  lastModified: string
  messages: Message[]
}

// Storage keys
const SESSIONS_KEY = 'medical-chat-sessions'
const ACTIVE_SESSION_KEY = 'medical-chat-active'
const MAX_SESSIONS = 10

// Persian date formatting
export const formatPersianDate = (date: Date): string => {
  const persianMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ]
  
  // Simple Gregorian to Persian conversion (approximate)
  const gregorianYear = date.getFullYear()
  const gregorianMonth = date.getMonth()
  const gregorianDay = date.getDate()
  
  // Rough conversion (for display purposes)
  const persianYear = gregorianYear - 621
  const persianMonth = persianMonths[gregorianMonth] || persianMonths[0]
  
  return `${gregorianDay} ${persianMonth} ${persianYear}`
}

// Generate session title from first meaningful message
export const generateSessionTitle = (messages: Message[]): string => {
  // Find first user message with meaningful content
  const meaningfulMessage = messages.find(msg => {
    if (msg.type !== 'user') return false
    
    const text = msg.text.trim()
    const greetings = ['سلام', 'درود', 'صبح بخیر', 'عصر بخیر', 'شب بخیر', 'hello', 'hi']
    const isGreeting = greetings.some(greeting => 
      text.toLowerCase().includes(greeting.toLowerCase())
    )
    
    return !isGreeting && text.length > 3
  })
  
  if (meaningfulMessage) {
    // Extract first 4-6 words
    const words = meaningfulMessage.text.trim().split(/\s+/)
    const titleWords = words.slice(0, Math.min(6, words.length))
    let title = titleWords.join(' ')
    
    // Limit title length
    if (title.length > 50) {
      title = title.substring(0, 47) + '...'
    }
    
    return title
  }
  
  // Fallback title
  const now = new Date()
  return `گفتگو ${formatPersianDate(now)}`
}

// Load all sessions from localStorage
export const loadSessions = (): ChatSession[] => {
  try {
    const sessionsData = localStorage.getItem(SESSIONS_KEY)
    if (!sessionsData) return []
    
    const sessions: ChatSession[] = JSON.parse(sessionsData)
    
    // Convert timestamp strings back to Date objects in messages
    return sessions.map(session => ({
      ...session,
      messages: session.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    }))
  } catch (error) {
    console.error('Error loading sessions:', error)
    return []
  }
}

// Save sessions to localStorage
export const saveSessions = (sessions: ChatSession[]): void => {
  try {
    // Limit to MAX_SESSIONS, keep newest
    const limitedSessions = sessions
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
      .slice(0, MAX_SESSIONS)
    
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(limitedSessions))
  } catch (error) {
    console.error('Error saving sessions:', error)
  }
}

// Get active session ID
export const getActiveSessionId = (): string | null => {
  try {
    return localStorage.getItem(ACTIVE_SESSION_KEY)
  } catch (error) {
    console.error('Error getting active session:', error)
    return null
  }
}

// Set active session ID
export const setActiveSessionId = (sessionId: string): void => {
  try {
    localStorage.setItem(ACTIVE_SESSION_KEY, sessionId)
  } catch (error) {
    console.error('Error setting active session:', error)
  }
}

// Create new session
export const createNewSession = (messages: Message[] = []): ChatSession => {
  const now = new Date()
  const sessionId = `session_${now.getTime()}`
  
  const newSession: ChatSession = {
    id: sessionId,
    title: messages.length > 0 ? generateSessionTitle(messages) : 'گفتگوی جدید',
    createdDate: now.toISOString(),
    lastModified: now.toISOString(),
    messages: messages.filter(msg => !msg.isLoading) // Remove loading messages
  }
  
  return newSession
}

// Save current session
export const saveCurrentSession = (messages: Message[], sessionId?: string): string => {
  console.log('=== saveCurrentSession called ===')
  console.log('Input sessionId:', sessionId)
  console.log('Input messages:', messages.length)
  
  const sessions = loadSessions()
  console.log('Existing sessions:', sessions.length)
  
  const now = new Date()
  
  // Filter out loading messages
  const cleanMessages = messages.filter(msg => !msg.isLoading)
  console.log('Clean messages after filtering:', cleanMessages.length)
  
  if (cleanMessages.length === 0) {
    console.log('No clean messages to save, returning early')
    return sessionId || ''
  }
  
  if (sessionId) {
    console.log('Updating existing session:', sessionId)
    // Update existing session
    const sessionIndex = sessions.findIndex(s => s.id === sessionId)
    console.log('Session index found:', sessionIndex)
    
    if (sessionIndex >= 0) {
      const title = generateSessionTitle(cleanMessages)
      console.log('Generated title:', title)
      
      sessions[sessionIndex] = {
        ...sessions[sessionIndex],
        title: title,
        lastModified: now.toISOString(),
        messages: cleanMessages
      }
      console.log('Updated session:', sessions[sessionIndex])
    } else {
      console.log('Session not found, creating new one')
      // Create new session if not found
      const newSession = createNewSession(cleanMessages)
      sessions.push(newSession)
      sessionId = newSession.id
    }
  } else {
    console.log('Creating new session')
    // Create new session
    const newSession = createNewSession(cleanMessages)
    sessions.push(newSession)
    sessionId = newSession.id
  }
  
  console.log('Final sessions array:', sessions.length)
  console.log('Saving sessions...')
  saveSessions(sessions)
  setActiveSessionId(sessionId)
  
  console.log('Session save complete, returning ID:', sessionId)
  return sessionId
}

// Load session by ID
export const loadSessionById = (sessionId: string): ChatSession | null => {
  const sessions = loadSessions()
  return sessions.find(s => s.id === sessionId) || null
}

// Delete session by ID
export const deleteSession = (sessionId: string): void => {
  const sessions = loadSessions()
  const filteredSessions = sessions.filter(s => s.id !== sessionId)
  saveSessions(filteredSessions)
  
  // If deleted session was active, clear active session
  if (getActiveSessionId() === sessionId) {
    localStorage.removeItem(ACTIVE_SESSION_KEY)
  }
}

// Get session list for display (sorted by last modified)
export const getSessionList = (): Array<{
  id: string
  title: string
  date: string
  messageCount: number
}> => {
  const sessions = loadSessions()
  
  return sessions
    .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
    .map(session => ({
      id: session.id,
      title: session.title,
      date: formatPersianDate(new Date(session.lastModified)),
      messageCount: session.messages.length
    }))
}
import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

/**
 * Custom hook for managing toast notifications
 */
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: Toast['type'] = 'info', duration: number = 3000) => {
    const id = Date.now().toString()
    const newToast: Toast = {
      id,
      message,
      type,
      duration
    }

    setToasts(prev => [...prev, newToast])

    // Auto-remove toast after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, duration)

    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  return {
    toasts,
    showToast,
    removeToast,
    clearAllToasts
  }
}
import { useEffect } from 'react'
import { Toast } from '../hooks/useToast'

interface ToastContainerProps {
  toasts: Toast[]
  onRemoveToast: (id: string) => void
}

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id)
      }, toast.duration)

      return () => clearTimeout(timer)
    }
  }, [toast.id, toast.duration, onRemove])

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return 'fa-solid fa-check-circle'
      case 'error':
        return 'fa-solid fa-exclamation-circle'
      case 'warning':
        return 'fa-solid fa-exclamation-triangle'
      case 'info':
      default:
        return 'fa-solid fa-info-circle'
    }
  }

  return (
    <div className={`toast toast-${toast.type}`}>
      <div className="toast-content">
        <i className={getIcon()}></i>
        <span className="toast-message">{toast.message}</span>
      </div>
      <button 
        className="toast-close"
        onClick={() => onRemove(toast.id)}
        aria-label="بستن پیام"
      >
        <i className="fa-solid fa-times"></i>
      </button>
    </div>
  )
}

export default function ToastContainer({ toasts, onRemoveToast }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <ToastItem 
          key={toast.id} 
          toast={toast} 
          onRemove={onRemoveToast}
        />
      ))}
    </div>
  )
}
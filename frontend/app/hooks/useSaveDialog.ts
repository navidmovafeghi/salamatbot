import { useState } from 'react'

type PendingAction = 'newChat' | 'returnHome' | 'newChatWithSuggestion' | null

/**
 * Custom hook for managing save dialog state and actions
 * Handles save prompts, pending actions, and user decisions
 */
export const useSaveDialog = () => {
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [pendingSuggestion, setPendingSuggestion] = useState<string>('')

  // Function to show save dialog with pending action
  const showSavePrompt = (action: PendingAction, suggestion?: string) => {
    setPendingAction(action)
    if (suggestion) {
      setPendingSuggestion(suggestion)
    }
    setShowSaveDialog(true)
  }

  // Handle save dialog - user chooses to save
  const handleSaveAndProceed = (onSave: () => void, onProceed: () => void) => {
    onSave()
    executePendingAction(onProceed)
  }

  // Handle save dialog - user chooses not to save
  const handleDontSaveAndProceed = (onProceed: () => void) => {
    // Don't save, but mark as "handled" so we don't prompt again
    executePendingAction(onProceed)
  }

  // Execute the action that was pending save decision
  const executePendingAction = (onProceed: () => void) => {
    setShowSaveDialog(false)
    
    if (pendingAction === 'newChat') {
      onProceed()
    } else if (pendingAction === 'returnHome') {
      onProceed()
    } else if (pendingAction === 'newChatWithSuggestion') {
      onProceed()
      setPendingSuggestion('')
    }
    
    setPendingAction(null)
  }

  // Handle save dialog cancel
  const handleCancelSave = () => {
    setShowSaveDialog(false)
    setPendingAction(null)
    setPendingSuggestion('')
  }

  return {
    // State
    showSaveDialog,
    pendingAction,
    pendingSuggestion,
    
    // Actions
    showSavePrompt,
    handleSaveAndProceed,
    handleDontSaveAndProceed,
    handleCancelSave,
    
    // Utilities
    hasPendingAction: !!pendingAction,
  }
}
import { useState, useEffect, useCallback } from 'react'

export type MenuType = 'history' | 'main' | 'suggestions' | null
export type ComponentType = 'initial' | 'chat' | null

/**
 * Centralized menu state management hook
 * Handles all menu states, interactions, and cleanup
 */
export const useMenuManager = () => {
  const [activeMenu, setActiveMenu] = useState<MenuType>(null)
  const [activeComponent, setActiveComponent] = useState<ComponentType>(null)

  // Close all menus
  const closeAllMenus = useCallback(() => {
    setActiveMenu(null)
    setActiveComponent(null)
  }, [])

  // Open specific menu
  const openMenu = useCallback((menuType: MenuType, component: ComponentType) => {
    setActiveMenu(menuType)
    setActiveComponent(component)
  }, [])

  // Toggle specific menu
  const toggleMenu = useCallback((menuType: MenuType, component: ComponentType) => {
    if (activeMenu === menuType && activeComponent === component) {
      closeAllMenus()
    } else {
      openMenu(menuType, component)
    }
  }, [activeMenu, activeComponent, openMenu, closeAllMenus])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && activeMenu) {
        closeAllMenus()
      }
    }

    if (activeMenu) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [activeMenu, closeAllMenus])

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!activeMenu) return

      const target = event.target as Element
      
      // Check if click is outside menu areas
      const isOutsideMenu = !target.closest('.menu-container') && 
                           !target.closest('.dropdown-menu') && 
                           !target.closest('.modal-overlay') &&
                           !target.closest('.history-modal') &&
                           !target.closest('.menu-trigger') &&
                           !target.closest('.suggestions-menu') &&
                           !target.closest('.suggestions-backdrop') &&
                           !target.closest('.mobile-suggestions-btn')

      if (isOutsideMenu) {
        closeAllMenus()
      }
    }

    // Add a small delay to prevent immediate closing when opening
    const timeoutId = setTimeout(() => {
      if (activeMenu) {
        document.addEventListener('mousedown', handleClickOutside)
      }
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeMenu, closeAllMenus])

  // Auto-close menus when component changes
  const handleComponentChange = useCallback((newComponent: ComponentType) => {
    if (activeComponent && activeComponent !== newComponent) {
      closeAllMenus()
    }
  }, [activeComponent, closeAllMenus])

  return {
    // State
    activeMenu,
    activeComponent,
    isHistoryMenuOpen: activeMenu === 'history',
    isMainMenuOpen: activeMenu === 'main',
    isSuggestionsMenuOpen: activeMenu === 'suggestions',
    
    // Actions
    openMenu,
    closeAllMenus,
    toggleMenu,
    handleComponentChange,
    
    // Convenience methods
    openHistoryMenu: (component: ComponentType) => openMenu('history', component),
    openMainMenu: (component: ComponentType) => openMenu('main', component),
    openSuggestionsMenu: (component: ComponentType) => openMenu('suggestions', component),
    toggleHistoryMenu: (component: ComponentType) => toggleMenu('history', component),
    toggleMainMenu: (component: ComponentType) => toggleMenu('main', component),
    toggleSuggestionsMenu: (component: ComponentType) => toggleMenu('suggestions', component),
  }
}
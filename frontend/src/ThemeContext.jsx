import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {}
})

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('agriman_theme')
      if (saved === 'dark' || saved === 'light') {
        return saved
      }
      return 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('agriman_theme', theme)
    } catch (e) {
      console.warn('Unable to persist theme to localStorage', e)
    }

    // Apply data-theme attribute and class to root element
    document.documentElement.setAttribute('data-theme', theme)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-theme')
      document.body.classList.add('dark-theme')
    } else {
      document.documentElement.classList.remove('dark-theme')
      document.body.classList.remove('dark-theme')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    return {
      theme: 'light',
      toggleTheme: () => {},
      setTheme: () => {}
    }
  }
  return context
}

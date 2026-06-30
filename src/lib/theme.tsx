'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const stored = localStorage.getItem('vault-theme') as Theme | null
    if (stored === 'dark' || stored === 'light') {
      setTheme(stored)
      document.documentElement.setAttribute('data-theme', stored)
    } else {
      // respect OS preference on first visit
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const initial: Theme = prefersDark ? 'dark' : 'light'
      setTheme(initial)
      document.documentElement.setAttribute('data-theme', initial)
    }
  }, [])

  function toggleTheme() {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('vault-theme', next)
      document.documentElement.setAttribute('data-theme', next)
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}

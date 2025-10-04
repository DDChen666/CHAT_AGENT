'use client'

import { useEffect, useState } from 'react'

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(query)
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    setMatches(mediaQuery.matches)
    mediaQuery.addEventListener('change', listener)

    return () => mediaQuery.removeEventListener('change', listener)
  }, [query])

  return matches
}


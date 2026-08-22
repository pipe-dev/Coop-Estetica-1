import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * ScrollToTop Component
 * Guarantees that every navigation transition automatically resets
 * the scroll position to the very top (0, 0) of the viewport.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Reset window viewport
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    })

    // Reset document root elements
    if (document.documentElement) document.documentElement.scrollTop = 0
    if (document.body) document.body.scrollTop = 0

    // Reset any custom main scrollable containers
    const scrollContainers = document.querySelectorAll('main, [data-scroll-container]')
    scrollContainers.forEach(el => {
      if (el && typeof el.scrollTo === 'function') {
        el.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      }
      if (el) el.scrollTop = 0
    })
  }, [pathname])

  return null
}

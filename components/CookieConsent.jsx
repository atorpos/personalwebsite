import React from 'react'
import { useRouter } from 'next/router'
import classNames from 'clsx'
import Button from '@/components/Button'
import fonts from '@/styles/fonts'
import {
  measurementId,
  saveConsent,
  startAnalytics,
  storedConsent,
  trackPageView,
} from '@/lib/analytics'

const OPEN_EVENT = 'cookie-settings'

/** Shows the banner again, for the "Cookie settings" button in the menu */
export const openCookieSettings = () => window.dispatchEvent(new Event(OPEN_EVENT))

/**
 * Asks once whether Google Analytics may be used, then reports every page the visitor opens.
 * Renders nothing without NEXT_PUBLIC_GA_ID.
 */
const CookieConsent = () => {
  const router = useRouter()
  const [consent, setConsent] = React.useState(null)
  const [open, setOpen] = React.useState(false)
  // Following a link to a heading on the same page isn't a new page view
  const path = router.asPath.split('#')[0]

  // The stored choice is only readable in the browser, after the page has been rendered
  React.useEffect(() => {
    const stored = storedConsent()
    setConsent(stored)
    setOpen(stored === null)

    const show = () => setOpen(true)
    window.addEventListener(OPEN_EVENT, show)
    return () => window.removeEventListener(OPEN_EVENT, show)
  }, [])

  React.useEffect(() => {
    if (consent !== 'granted') return
    startAnalytics()
    trackPageView()
  }, [consent, path])

  if (!measurementId || !open) return null

  const choose = (value) => {
    saveConsent(value)
    setConsent(value)
    setOpen(false)
  }

  return (
    // Above the menu bar on phones, in the bottom left corner on larger screens
    <section
      aria-label="Cookie consent"
      className={classNames(
        'fixed inset-x-3 bottom-20 z-50 bg-omega-800 p-5 font-sans text-sm leading-relaxed text-omega-100 shadow-2xl ring-1 ring-omega-700',
        'md:inset-x-auto md:bottom-6 md:left-6 md:max-w-sm lg:bottom-10 lg:left-10 xl:bottom-14 xl:left-14',
        ...fonts
      )}
    >
      <p>
        I&apos;d like to use Google Analytics cookies to see how visitors use this site. Is that OK?
      </p>
      <div className="mt-4 flex gap-6">
        <Button as="button" type="button" size="xs" onClick={() => choose('granted')}>
          Accept
        </Button>
        <Button
          as="button"
          type="button"
          size="xs"
          variant="black"
          onClick={() => choose('denied')}
        >
          Decline
        </Button>
      </div>
    </section>
  )
}

export default CookieConsent

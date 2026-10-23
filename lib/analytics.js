/** *************************************************************
 * Google Analytics 4, only after the visitor accepts it in the *
 * cookie banner (components/CookieConsent.jsx). Without        *
 * NEXT_PUBLIC_GA_ID there is no banner and nothing here runs.  *
 ****************************************************************/

const gaId = (process.env.NEXT_PUBLIC_GA_ID || '').trim()

// `npm run dev` never sends anything, so working on the site doesn't count as visits
export const measurementId =
  process.env.NODE_ENV === 'production' && /^G-[A-Z0-9]+$/i.test(gaId) ? gaId : undefined

const STORAGE_KEY = 'analytics-consent'
let started = false

/** 'granted', 'denied', or null while the visitor hasn't chosen */
export function storedConsent() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    return null
  }
}

export function saveConsent(consent) {
  try {
    localStorage.setItem(STORAGE_KEY, consent)
  } catch {
    // Private browsing without storage: the choice lasts until the page is closed
  }
  if (consent === 'granted') startAnalytics()
  else stopAnalytics()
}

/** Loads Google's script. Before this, no cookie is set. Safe to call more than once. */
export function startAnalytics() {
  if (!measurementId) return
  setDisabled(false)
  if (started) return
  started = true
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // gtag.js expects the `arguments` object itself, not an array
    window.dataLayer.push(arguments)
  }
  // Consent mode: the banner only asks about analytics cookies, so advertising features stay off
  window.gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })
  window.gtag('js', new Date())
  // Page views are sent by trackPageView, because the site changes pages without reloading
  window.gtag('config', measurementId, { send_page_view: false })
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
  document.head.append(script)
}

export function trackPageView() {
  if (!started) return
  window.gtag('event', 'page_view', {
    page_location: window.location.href,
    page_title: document.title,
  })
}

/** Stops measuring after the visitor declines, and removes the cookies Google Analytics set */
function stopAnalytics() {
  if (!measurementId) return
  setDisabled(true)
  const names = document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0].trim())
    .filter((name) => name.startsWith('_ga'))
  // The cookies are set on the site's domain, e.g. .altawoz.com for www.altawoz.com
  const parts = window.location.hostname.split('.')
  const domains = ['', ...parts.map((_, i) => `; domain=.${parts.slice(i).join('.')}`)]
  for (const name of names) {
    for (const domain of domains) document.cookie = `${name}=; Max-Age=0; path=/${domain}`
  }
}

// Google's documented switch: while `window['ga-disable-<ID>']` is true, gtag.js sends nothing
function setDisabled(disabled) {
  window[`ga-disable-${measurementId}`] = disabled
}

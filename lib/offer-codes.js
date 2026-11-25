/** *************************************************************
 * One-time-use App Store offer codes, kept in Payload CMS     *
 * (App Store > Offer codes; "App Store offer codes" in the     *
 * CMS's apps/cms/README.md). Server-side only: the CMS's      *
 * endpoints need OFFER_CODES_API_KEY, which never reaches the  *
 * browser.                                                     *
 ****************************************************************/

const PAYLOAD_URL = (process.env.PAYLOAD_URL || '').replace(/\/+$/, '')
const API_KEY = process.env.OFFER_CODES_API_KEY || ''

export const isOfferCodesEnabled = Boolean(PAYLOAD_URL && API_KEY)

// Apple's codes are capital letters and digits, e.g. ABCD1234EFGH5678JK
const isCode = (value) => typeof value === 'string' && /^[A-Z0-9]{6,64}$/.test(value)

/** Apple's redeem link for exactly this code, and nothing else */
const isRedeemUrl = (value, code) => {
  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' &&
      url.hostname === 'apps.apple.com' &&
      url.pathname === '/redeem' &&
      url.searchParams.get('code') === code
    )
  } catch {
    return false
  }
}

async function callCms(path, init = {}) {
  const res = await fetch(`${PAYLOAD_URL}/api/offer-codes/${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'X-API-Key': API_KEY, ...init.headers },
    signal: AbortSignal.timeout(10000),
  })

  return { status: res.status, body: await res.json().catch(() => null) }
}

/**
 * Gives out the next available code of `app`. `ip` is the visitor's, for the CMS's daily limit per
 * network (it keeps only a hash of it). Resolves to one of:
 *   { status: 'ok', code, url, available }   url: Apple's redeem link
 *   { status: 'sold-out' }                   every code is given out
 *   { status: 'limit' }                      this network got its codes for today
 *   { status: 'unavailable' }                not set up (PAYLOAD_URL / OFFER_CODES_API_KEY)
 *   { status: 'error' }                      the CMS couldn't be reached or failed
 */
export async function claimOfferCode({ app, ip }) {
  if (!isOfferCodesEnabled) return { status: 'unavailable' }

  try {
    const { status, body } = await callCms('claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app, ...(ip && { ip }) }),
    })

    if (status === 200 && isCode(body?.code) && isRedeemUrl(body?.url, body.code)) {
      return { status: 'ok', code: body.code, url: body.url, available: body.available }
    }

    if (status === 410) return { status: 'sold-out' }
    if (status === 429) return { status: 'limit' }

    // 404: OFFER_CODES_API_KEY isn't set in the CMS; 401: the two keys differ
    console.error(`Could not get an offer code: the CMS answered ${status}`, body?.errors || '')
    return { status: status === 404 || status === 401 ? 'unavailable' : 'error' }
  } catch (error) {
    console.error('Could not get an offer code:', error.message)
    return { status: 'error' }
  }
}

/** { available, total } codes of `app`, or null when the CMS can't say */
export async function getOfferCodeAvailability(app) {
  if (!isOfferCodesEnabled) return null

  try {
    const { status, body } = await callCms(`availability?${new URLSearchParams({ app })}`)

    if (status === 200 && Number.isInteger(body?.available) && Number.isInteger(body?.total)) {
      return { available: body.available, total: body.total }
    }

    console.error(`Could not count the offer codes: the CMS answered ${status}`)
  } catch (error) {
    console.error('Could not count the offer codes:', error.message)
  }

  return null
}

// ---------------------------------------------------------------------------------------------
// The visitor's code, remembered in a cookie so that tapping again gives back the same code
// ---------------------------------------------------------------------------------------------

const cookieName = (app) => `offer_code_${app}`
const COOKIE_MAX_AGE = 180 * 24 * 60 * 60

/** The code this browser already got ({ code, url }), or null */
export function readOfferCodeCookie(req, app) {
  try {
    const value = JSON.parse(req.cookies?.[cookieName(app)] || 'null')
    return isCode(value?.code) && isRedeemUrl(value?.url, value.code)
      ? { code: value.code, url: value.url }
      : null
  } catch {
    return null
  }
}

export function setOfferCodeCookie(req, res, app, { code, url }) {
  const isHttps =
    req.headers['x-forwarded-proto']?.split(',')[0].trim() === 'https' ||
    Boolean(req.socket?.encrypted)

  res.setHeader(
    'Set-Cookie',
    [
      `${cookieName(app)}=${encodeURIComponent(JSON.stringify({ code, url }))}`,
      'Path=/',
      `Max-Age=${COOKIE_MAX_AGE}`,
      'HttpOnly',
      'SameSite=Lax',
      ...(isHttps ? ['Secure'] : []),
    ].join('; ')
  )
}

/**
 * The visitor's IP address. Behind Vercel or a reverse proxy it's the first address in
 * X-Forwarded-For, which the proxy sets.
 */
export function clientIp(req) {
  const forwarded = [].concat(req.headers['x-forwarded-for'] || [])[0] || ''
  return (
    forwarded.split(',')[0].trim() ||
    [].concat(req.headers['x-real-ip'] || [])[0] ||
    req.socket?.remoteAddress ||
    ''
  )
}

/** iPhone, iPod touch, or an iPad that says so (iPadOS Safari usually presents itself as a Mac) */
export const isAppleMobile = (req) => /\b(iPhone|iPod|iPad)\b/.test(req.headers['user-agent'] || '')

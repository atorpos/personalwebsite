/** *************************************************************
 * POST /api/lockinminder/redeem: the "Get LockinMinder Pro     *
 * free" button of /lockinminder/redeem. Gives the visitor the  *
 * next free launch code from Payload CMS and sends them on.    *
 ****************************************************************/

import { OFFER_CODE_APP, REDEEM_PATH } from '@/lib/lockinminder'
import {
  claimOfferCode,
  clientIp,
  isAppleMobile,
  readOfferCodeCookie,
  setOfferCodeCookie,
} from '@/lib/offer-codes'

// Another site's page may not make visitors spend a code: a browser posting the form says where
// it comes from in Origin
const isFromThisSite = (req) => {
  const origin = req.headers.origin
  if (!origin) return true

  try {
    const host = [].concat(req.headers['x-forwarded-host'] || req.headers.host || [])[0]
    return new URL(origin).host === host.split(',')[0].trim()
  } catch {
    return false
  }
}

const redeem = async (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store')

  // Only the button gives a code away. Opening this address (e.g. a link preview, or someone who
  // shared it by mistake) shows the page with the button instead
  if (req.method === 'GET' || req.method === 'HEAD') {
    return res.redirect(303, REDEEM_PATH)
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Request method is not allowed.' })
  }

  if (!isFromThisSite(req)) {
    return res.redirect(303, `${REDEEM_PATH}?status=error`)
  }

  // A visitor who already got a code gets the same one again
  const known = readOfferCodeCookie(req, OFFER_CODE_APP)
  const result = known
    ? { status: 'ok', ...known }
    : await claimOfferCode({ app: OFFER_CODE_APP, ip: clientIp(req) })

  if (result.status !== 'ok') {
    return res.redirect(303, `${REDEEM_PATH}?status=${result.status}`)
  }

  if (!known) setOfferCodeCookie(req, res, OFFER_CODE_APP, result)

  // On an iPhone or iPad, straight to the App Store with the code filled in. Elsewhere, back to the
  // page, which shows the code and a QR code to scan with an iPhone
  return res.redirect(303, isAppleMobile(req) ? result.url : REDEEM_PATH)
}

export default redeem

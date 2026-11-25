/** *************************************************************
 * LockinMinder on the App Store: the addresses the product     *
 * page (content/lockinminder.md), the project page, the launch *
 * post and the redeem link use.                                *
 ****************************************************************/

// The app's Apple ID, the `id` in the App Store's links and in its offer codes' redeem links
export const APP_STORE_ID = '6830228333'

export const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`

// The one link to share for a free launch code (pages/lockinminder/redeem.jsx)
export const REDEEM_PATH = '/lockinminder/redeem'

// Which app's codes to ask Payload CMS for (offerCodeApps in the CMS)
export const OFFER_CODE_APP = 'lockinminder'

// How many codes the launch started with, for "123 of 500 left" when the CMS can't be asked
export const LAUNCH_CODES = 500

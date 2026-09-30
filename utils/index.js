export function isNumeric(str) {
  if (typeof str != 'string') return false
  return !isNaN(str) && !isNaN(parseFloat(str))
}

// Prefixes site-relative paths with the site URL; full URLs (e.g. Payload CMS images) stay as they are
export function toAbsoluteUrl(src, siteUrl) {
  return /^https?:\/\//.test(src) ? src : siteUrl + src
}

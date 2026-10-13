/** *************************************************************
 * Reads published content from Payload CMS over its REST API.  *
 * Without PAYLOAD_URL the site only uses its Markdown files    *
 * and theme.config.js.                                         *
 ****************************************************************/

const PAYLOAD_URL = (process.env.PAYLOAD_URL || '').replace(/\/+$/, '')

export const isCmsEnabled = Boolean(PAYLOAD_URL)

// Pages are re-rendered in the background at most this often (seconds), so CMS changes appear
// without a new deploy. Publishing also refreshes the affected pages at once (pages/api/revalidate.js).
export const revalidateSeconds = Number(process.env.PAYLOAD_REVALIDATE_SECONDS) || 60

// While `next build` renders every page, they share the answers (e.g. the site settings). Later
// re-renders always ask the CMS, so a page refreshed after a change never gets an older copy.
const isBuild = process.env.NEXT_PHASE === 'phase-production-build'
const buildCache = new Map()

/** GET /api/<path>; throws when the CMS can't be reached or answers with an error */
export function request(path, params = {}) {
  const url = `${PAYLOAD_URL}/api/${path}?${new URLSearchParams(params)}`

  if (!isBuild) return fetchJson(url)

  if (!buildCache.has(url)) {
    const response = fetchJson(url)
    buildCache.set(url, response)
    response.catch(() => buildCache.delete(url))
  }

  return buildCache.get(url)
}

async function fetchJson(url) {
  // Throwing (instead of returning nothing) makes a failed background re-render keep the last
  // good version of the page, rather than publishing it without its CMS content
  const res = await fetch(url, { headers: { Accept: 'application/json' } }).catch((error) => {
    throw new Error(
      `Payload CMS is unreachable: ${error.cause?.message || error.message} (GET ${url})`
    )
  })

  if (!res.ok) {
    const error = new Error(
      `Payload CMS request failed: ${res.status} ${res.statusText} (GET ${url})`
    )
    error.status = res.status
    throw error
  }

  return res.json()
}

/** Published documents of a collection (anonymous requests never see drafts) */
export async function findDocs(collection, params = {}) {
  const { docs } = await request(collection, { depth: '1', ...params })
  return docs
}

/** A global, or null until it's saved for the first time (the site then uses its own files) */
export async function findGlobal(slug) {
  const doc = await request(`globals/${slug}`, { depth: '1' })
  return doc?.updatedAt ? doc : null
}

// Upload URLs are absolute when the CMS has SERVER_URL (or S3) configured, relative otherwise
export const toAbsoluteUrl = (url) => new URL(url, `${PAYLOAD_URL}/`).toString()

/** An uploaded image in the shape of the images in the Markdown frontmatter */
export function toImage(media) {
  if (!media?.url || !media.mimeType?.startsWith('image/')) return null

  return {
    src: toAbsoluteUrl(media.url),
    alt: media.alt || '',
    ...(media.width && media.height && { width: media.width, height: media.height }),
  }
}

/** The address of any uploaded file, e.g. a resume */
export const toFileUrl = (media) => (media?.url ? toAbsoluteUrl(media.url) : null)

// SVG markup by file URL and version, so icons are downloaded again only after they change
const svgCache = new Map()

/**
 * An uploaded SVG icon, with its markup inlined like the icons in public/icons
 * (lib/computed-fields/icons.js), so the theme can color it. Null when it can't be loaded.
 */
export async function toIcon(media) {
  if (!media?.url || media.mimeType !== 'image/svg+xml') return null

  const src = toAbsoluteUrl(media.url)
  const key = `${src}#${media.updatedAt}`

  if (!svgCache.has(key)) {
    const markup = fetch(src)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(`${res.status}`))))
      .then((text) => (/<svg[\s>]/i.test(text) ? text : Promise.reject(new Error('not an SVG'))))

    svgCache.set(key, markup)
    markup.catch(() => svgCache.delete(key))

    // Keeps the cache small on a long-running server
    if (svgCache.size > 500) svgCache.delete(svgCache.keys().next().value)
  }

  try {
    return { src, source: await svgCache.get(key), alt: media.alt || '' }
  } catch (error) {
    console.warn(`Could not load the icon ${src}: ${error.message}`)
    return null
  }
}

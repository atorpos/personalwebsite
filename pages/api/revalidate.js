/** *************************************************************
 * Any file inside the folder pages/api is mapped to /api/* and *
 * will be treated as an API endpoint instead of a page.        *
 ****************************************************************/

import crypto from 'crypto'
import { getPageBySlug, getPaths } from '@/lib/mdx'
import { PAGE_GLOBALS } from '@/lib/payload'

/**
 * Called by Payload CMS (src/hooks/revalidateWebsite.ts there) when something on the website
 * changes, so the pages that show it are rebuilt right away instead of at their next background
 * refresh:
 *
 *   POST /api/revalidate
 *   Authorization: Bearer <REVALIDATE_SECRET>
 *   { "collection": "posts", "slugs": ["my-post"], "tags": ["react"] }   posts, projects or pages
 *   { "global": "personal-about" }                                       a page or Site settings
 */

// Hashing first makes the comparison constant-time regardless of the input's length
const isAuthorized = (header) => {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret || typeof header !== 'string') return false

  const hash = (value) => crypto.createHash('sha256').update(value).digest()
  return crypto.timingSafeEqual(hash(header), hash(`Bearer ${secret}`))
}

const isSlug = (value) => typeof value === 'string' && /^[\p{L}\p{N}_-]+$/u.test(value)

// A page plus its pagination pages if it lists a collection: /blog, /blog/page/1, /blog/page/2, ...
async function getListingPaths(slug) {
  const page = await getPageBySlug(slug)
  if (!page) return []

  const path = `/${slug.join('/')}`
  const totalPages = page.meta?.collection?.totalPages || 0

  return [path, ...Array.from({ length: totalPages }, (_, i) => `${path}/page/${i + 1}`)]
}

async function getPathsToRevalidate({ collection, global, slugs = [], tags = [] }) {
  slugs = [].concat(slugs).filter(isSlug)
  tags = [].concat(tags).filter(isSlug)

  if (global === 'personal-settings') {
    // The site's name, menu and social links are on every page
    return (await getPaths()).map(({ slug }) => `/${slug.join('/')}`)
  }

  if (global) {
    const path = [...PAGE_GLOBALS].find(([, slug]) => slug === global)?.[0]
    return path === undefined ? [] : getListingPaths(path.split('/').filter(Boolean))
  }

  if (collection === 'personal-projects') {
    return [...(await getListingPaths(['projects'])), ...slugs.map((slug) => `/projects/${slug}`)]
  }

  if (collection === 'pages') {
    return slugs.map((slug) => `/${slug}`)
  }

  // Posts: the posts, the home page (featured posts), the blog, and the tag pages that list them
  const listings = await Promise.all(
    [['blog'], ...tags.map((tag) => ['tags', tag])].map(getListingPaths)
  )

  return ['/', ...slugs.map((slug) => `/blog/${slug}`), ...listings.flat()]
}

// A few at a time, so that rebuilding every page doesn't overload the server
async function revalidatePaths(res, paths) {
  const failed = []

  for (let i = 0; i < paths.length; i += 5) {
    const batch = paths.slice(i, i + 5)
    // Encoded like the URL of a real request, in case a slug isn't plain ASCII
    const results = await Promise.allSettled(batch.map((path) => res.revalidate(encodeURI(path))))

    results.forEach((result, j) => {
      if (result.status === 'rejected') {
        console.error(`Could not revalidate ${batch[j]}:`, result.reason)
        failed.push(batch[j])
      }
    })
  }

  return failed
}

const revalidate = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Request method is not allowed.' })
  }

  if (!isAuthorized(req.headers.authorization)) {
    return res.status(401).json({ error: 'Invalid or missing token.' })
  }

  const paths = [...new Set(await getPathsToRevalidate(req.body || {}))]
  const failed = await revalidatePaths(res, paths)

  return res.status(failed.length > 0 ? 500 : 200).json({
    revalidated: paths.filter((path) => !failed.includes(path)),
    failed,
  })
}

export default revalidate

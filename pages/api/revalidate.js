/** *************************************************************
 * Any file inside the folder pages/api is mapped to /api/* and *
 * will be treated as an API endpoint instead of a page.        *
 ****************************************************************/

import crypto from 'crypto'
import { getPageBySlug } from '@/lib/mdx'

/**
 * Called by Payload CMS when a post is published, changed, unpublished or deleted, so the pages
 * that show it are rebuilt right away instead of at their next background refresh.
 *
 *   POST /api/revalidate
 *   Authorization: Bearer <REVALIDATE_SECRET>
 *   { "slugs": ["my-post"], "tags": ["react"] }
 */

// Hashing first makes the comparison constant-time regardless of the input's length
const isAuthorized = (header) => {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret || typeof header !== 'string') return false

  const hash = (value) => crypto.createHash('sha256').update(value).digest()
  return crypto.timingSafeEqual(hash(header), hash(`Bearer ${secret}`))
}

const isSlug = (value) => typeof value === 'string' && /^[\p{L}\p{N}_-]+$/u.test(value)

// A page that lists posts, plus its pagination pages: /blog, /blog/page/1, /blog/page/2, ...
async function getListingPaths(slug) {
  const page = await getPageBySlug(slug)
  if (!page) return []

  const path = `/${slug.join('/')}`
  const totalPages = page.meta?.collection?.totalPages || 0

  return [path, ...Array.from({ length: totalPages }, (_, i) => `${path}/page/${i + 1}`)]
}

const revalidate = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Request method is not allowed.' })
  }

  if (!isAuthorized(req.headers.authorization)) {
    return res.status(401).json({ error: 'Invalid or missing token.' })
  }

  const slugs = [].concat(req.body?.slugs || []).filter(isSlug)
  const tags = [].concat(req.body?.tags || []).filter(isSlug)

  // The posts, the home page (featured posts), the blog, and the tag pages that list the posts
  const listings = await Promise.all(
    [['blog'], ...tags.map((tag) => ['tags', tag])].map(getListingPaths)
  )
  const paths = [...new Set(['/', ...slugs.map((slug) => `/blog/${slug}`), ...listings.flat()])]

  // Encoded like the URL of a real request, in case a tag isn't plain ASCII
  const results = await Promise.allSettled(paths.map((path) => res.revalidate(encodeURI(path))))
  const failed = paths.filter((path, i) => results[i].status === 'rejected')

  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(`Could not revalidate ${paths[i]}:`, result.reason)
    }
  })

  return res.status(failed.length > 0 ? 500 : 200).json({
    revalidated: paths.filter((path) => !failed.includes(path)),
    failed,
  })
}

export default revalidate

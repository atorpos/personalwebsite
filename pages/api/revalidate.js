/** *************************************************************
 * Any file inside the folder pages/api is mapped to /api/* and *
 * will be treated as an API endpoint instead of a page.        *
 ****************************************************************/

import crypto from 'crypto'
import { getPageBySlug, getPaths } from '@/lib/mdx'
import { loadPortfolio, PAGE_GLOBALS, PHOTOS, PHOTO_TAGS } from '@/lib/payload'

/**
 * Called by Payload CMS (src/hooks/revalidateWebsite.ts there) when something on the website
 * changes, so the pages that show it are rebuilt right away instead of at their next background
 * refresh:
 *
 *   POST /api/revalidate
 *   Authorization: Bearer <REVALIDATE_SECRET>
 *   { "collection": "posts", "slugs": ["my-post"], "tags": ["react"] }   posts, projects or pages
 *   { "collection": "personal-photos", "slugs": [...], "tags": [...], "albums": ["japan"] }
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

// The photo pages that show what changed. Neighbors are photos next to a changed one in its album,
// which link to it; pages that link to a photo that's gone pick that up at their next refresh.
async function getPhotoPathsToRevalidate({ collection, slugs, tags, albums }) {
  const { photos } = await loadPortfolio()
  const albumPath = (album) => `/${PHOTOS}/${album}`

  if (collection === 'personal-photo-albums') {
    // A photo shows the title of its album; old slugs redirect its photos to the new address
    const albumPhotos = photos.filter((photo) =>
      slugs.some((slug) => photo.album.path === albumPath(slug))
    )

    return [
      `/${PHOTOS}`,
      ...slugs.map(albumPath),
      ...slugs.flatMap((slug) => albumPhotos.map((photo) => `${albumPath(slug)}/${photo.slug}`)),
    ]
  }

  const neighbors = photos.flatMap((photo, i) =>
    slugs.includes(photo.slug)
      ? [photos[i - 1], photos[i + 1]]
          .filter((other) => other?.album.path === photo.album.path)
          .map((other) => other.path)
      : []
  )

  return [
    `/${PHOTOS}`,
    ...albums.map(albumPath),
    ...albums.flatMap((album) => slugs.map((slug) => `${albumPath(album)}/${slug}`)),
    ...neighbors,
    ...tags.map((tag) => `/${PHOTOS}/${PHOTO_TAGS}/${tag}`),
  ]
}

async function getPathsToRevalidate({ collection, global, slugs = [], tags = [], albums = [] }) {
  slugs = [].concat(slugs).filter(isSlug)
  tags = [].concat(tags).filter(isSlug)
  albums = [].concat(albums).filter(isSlug)

  if (global === 'personal-settings') {
    // The site's name, menu and social links are on every page
    return (await getPaths()).map(({ slug }) => `/${slug.join('/')}`)
  }

  if (global === 'personal-photos-page') {
    return [`/${PHOTOS}`]
  }

  if (collection === 'personal-photos' || collection === 'personal-photo-albums') {
    return getPhotoPathsToRevalidate({ collection, slugs, tags, albums })
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

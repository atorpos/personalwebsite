/** *************************************************************
 * Content from Payload CMS (the apps/cms app in the           *
 * atorpos/payloadcms repo), see docs/payload-cms.md:          *
 * - posts join the Markdown posts of /blog                    *
 * - projects join the Markdown projects of /projects          *
 * - pages saved in the CMS replace their Markdown file        *
 * - Site settings replace parts of theme.config.js            *
 * - the photo portfolio at /photos exists only there          *
 * Without PAYLOAD_URL the site only uses its own files.       *
 ****************************************************************/

import { findDocs, isCmsEnabled, toIcon, toImage } from './api'
import { getGlobalPage, getPage, SITE } from './pages'
import { getPhotoPaths } from './photos'
import { prepareRichText } from './rich-text'

export { isCmsEnabled, revalidateSeconds } from './api'
export { getSiteSettings, PAGE_GLOBALS } from './pages'
export { getPhotoPage, loadPortfolio, PHOTOS, PHOTO_TAGS } from './photos'

// CMS posts are served at /blog/<slug> and projects at /projects/<slug>, and listed wherever a
// page shows the /blog or /projects collection
const BLOG = 'blog'
const PROJECTS = 'projects'

const COLLECTIONS = new Map([
  [BLOG, { slug: 'posts', sort: '-publishedAt', toFrontmatter: postFrontmatter }],
  [PROJECTS, { slug: 'personal-projects', sort: '-date', toFrontmatter: projectFrontmatter }],
])

function seoOverrides(seo) {
  return Object.fromEntries(
    Object.entries(seo || {}).filter(([key, value]) => value && typeof value === 'string')
  )
}

// A post in the same shape as the frontmatter of a Markdown post
async function postFrontmatter(post) {
  const seo = seoOverrides(post.seo)

  return {
    layout: 'Post',
    title: post.title,
    description: post.description || '',
    date: post.publishedAt || post.createdAt,
    tags: post.tags || [],
    images: (post.images || []).map(toImage).filter(Boolean),
    featured: Boolean(post.featured),
    ...(Object.keys(seo).length > 0 && { seo }),
  }
}

// A project in the same shape as the frontmatter of a Markdown project (content/projects)
async function projectFrontmatter(project) {
  const seo = seoOverrides(project.seo)
  const [cover, ...images] = (project.images || []).map(toImage).filter(Boolean)
  const overlay = toImage(project.overlay)
  const logo = await toIcon(project.logo)

  return {
    layout: 'Post',
    title: project.title,
    description: project.description || '',
    date: project.date || project.createdAt,
    tags: project.tags || [],
    // The projects page shows the overlay over the right side of the first image
    images: cover ? [{ ...cover, ...(overlay && { overlay }) }, ...images] : [],
    ...(logo && { logo }),
    attributes: (project.attributes || []).map(({ label, value }) => ({ label, value })),
    ...(Object.keys(seo).length > 0 && { seo }),
  }
}

const toCollection = (collectionPath) =>
  COLLECTIONS.get(collectionPath.split('/').filter(Boolean).join('/'))

/**
 * Published CMS posts or projects as collection records, for a collection path from the content
 * files (/blog or /projects).
 */
export async function getCmsRecords(collectionPath) {
  const collection = isCmsEnabled && toCollection(collectionPath)
  if (!collection) return []

  const docs = await findDocs(collection.slug, {
    pagination: 'false',
    'select[content]': 'false',
    sort: collection.sort,
  })
  const path = collectionPath.split('/').filter(Boolean)

  return Promise.all(
    docs.map(async (doc) => ({
      ...(await collection.toFrontmatter(doc)),
      slug: [...path, doc.slug],
    }))
  )
}

/**
 * Markdown records of a collection plus the CMS records, which replace Markdown records at the same
 * path (e.g. a project imported into the CMS whose Markdown file is still there)
 */
export function mergeRecords(markdownRecords, cmsRecords) {
  const cmsPaths = new Set(cmsRecords.map((record) => record.slug.join('/')))

  return markdownRecords.filter((record) => !cmsPaths.has(record.slug.join('/'))).concat(cmsRecords)
}

/** Paths of all published CMS posts, projects, pages and photos, e.g. ['blog', 'my-post'] */
export async function getCmsPaths() {
  if (!isCmsEnabled) return []

  const slugsOf = (collection, params = {}) =>
    findDocs(collection, { depth: '0', pagination: 'false', 'select[slug]': 'true', ...params })

  const [posts, projects, pages, photoPaths] = await Promise.all([
    slugsOf('posts'),
    slugsOf('personal-projects'),
    slugsOf('pages', { where: JSON.stringify({ sites: { in: [SITE] } }) }),
    getPhotoPaths(),
  ])

  return [
    ...posts.map((post) => [BLOG, post.slug]),
    ...projects.map((project) => [PROJECTS, project.slug]),
    ...pages.map((page) => [page.slug]),
    ...photoPaths,
  ]
}

/** A published CMS post or project as a page ({ slug, meta, content, richText }), or undefined */
async function getItemPage(slug) {
  const collection = slug.length === 2 && COLLECTIONS.get(slug[0])
  if (!collection) return

  const [doc] = await findDocs(collection.slug, {
    limit: '1',
    where: JSON.stringify({ slug: { equals: slug[1] } }),
  })

  if (!doc) return

  return {
    slug,
    content: null,
    richText: await prepareRichText(doc.content),
    meta: await collection.toFrontmatter(doc),
  }
}

/**
 * The page at `slug` from the CMS, in the shape of lib/mdx.js getPageBySlug(): a page global once
 * it's saved, a post, a project, or a page of this site in the Pages collection. Undefined when the
 * CMS has none, so the Markdown file is used.
 */
export async function getCmsPage(slug) {
  if (!isCmsEnabled) return

  const page = (await getGlobalPage(slug)) || (await getItemPage(slug)) || (await getPage(slug))

  // Page props must be plain JSON, without `undefined`
  return page && JSON.parse(JSON.stringify(page))
}

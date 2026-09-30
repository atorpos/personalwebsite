/** *************************************************************
 * Reads blog posts from Payload CMS over its REST API.         *
 * Posts published there are merged into the /blog collection   *
 * next to the Markdown posts in content/blog. Without          *
 * PAYLOAD_URL the site only uses its Markdown files.           *
 ****************************************************************/

import { serialize } from 'next-mdx-remote/serialize'
import getMdxOptions from './mdx-options'

const PAYLOAD_URL = (process.env.PAYLOAD_URL || '').replace(/\/+$/, '')

// CMS posts are served at /blog/<slug> and listed wherever a page shows the /blog collection
const BLOG = 'blog'

export const isCmsEnabled = Boolean(PAYLOAD_URL)

// Pages are re-rendered in the background at most this often (seconds), so CMS changes appear
// without a new deploy. Publishing also refreshes the affected pages at once (pages/api/revalidate.js).
export const revalidateSeconds = Number(process.env.PAYLOAD_REVALIDATE_SECONDS) || 60

async function findPosts(params) {
  const url = `${PAYLOAD_URL}/api/posts?${new URLSearchParams({ depth: '1', ...params })}`

  // Throwing (instead of returning no posts) makes a failed background re-render keep the last
  // good version of the page, rather than publishing a blog without its CMS posts
  const res = await fetch(url, { headers: { Accept: 'application/json' } }).catch((error) => {
    throw new Error(
      `Payload CMS is unreachable: ${error.cause?.message || error.message} (GET ${url})`
    )
  })

  if (!res.ok) {
    throw new Error(`Payload CMS request failed: ${res.status} ${res.statusText} (GET ${url})`)
  }

  const { docs } = await res.json()
  return docs
}

// Upload URLs are absolute when the CMS has SERVER_URL (or S3) configured, relative otherwise
const toAbsoluteUrl = (url) => new URL(url, `${PAYLOAD_URL}/`).toString()

function toImage(media) {
  if (!media?.url || !media.mimeType?.startsWith('image/')) return null

  return {
    src: toAbsoluteUrl(media.url),
    alt: media.alt || '',
    ...(media.width && media.height && { width: media.width, height: media.height }),
  }
}

// A post in the same shape as the frontmatter of a Markdown post
function toFrontmatter(post) {
  const seo = Object.fromEntries(Object.entries(post.seo || {}).filter(([, value]) => value))

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

/**
 * Published CMS posts as collection records, for a collection path from the content files.
 * Only the /blog collection has CMS posts.
 */
export async function getCmsRecords(collectionPath) {
  if (!isCmsEnabled || collectionPath.split('/').filter(Boolean).join('/') !== BLOG) return []

  const posts = await findPosts({
    pagination: 'false',
    'select[content]': 'false',
    sort: '-publishedAt',
  })

  return posts.map((post) => ({ ...toFrontmatter(post), slug: [BLOG, post.slug] }))
}

/** Slugs of all published CMS posts, e.g. ['blog', 'my-post'] */
export async function getCmsPaths() {
  if (!isCmsEnabled) return []

  const posts = await findPosts({ depth: '0', pagination: 'false', 'select[slug]': 'true' })

  return posts.map((post) => [BLOG, post.slug])
}

/** A published CMS post as a page ({ slug, meta, content, richText }), or undefined */
export async function getCmsPage(slug) {
  if (!isCmsEnabled || slug.length !== 2 || slug[0] !== BLOG) return

  const [post] = await findPosts({
    limit: '1',
    where: JSON.stringify({ slug: { equals: slug[1] } }),
  })

  if (!post) return

  return {
    slug,
    content: null,
    richText: await prepareRichText(post.content),
    meta: toFrontmatter(post),
  }
}

/*
 * Rich text
 */

// Lexical code block languages (Monaco IDs, from the CMS editor) that Prism names differently
const PRISM_LANGUAGES = { 'objective-c': 'objectivec' }

// Highlights a code block with the same Prism setup as fenced code in Markdown posts
async function highlightCode(fields, mdxOptions) {
  const code = fields.code || ''
  // The fence must be longer than any run of backticks inside the code
  const fence = '`'.repeat(Math.max(3, ...(code.match(/`+/g) || []).map((run) => run.length + 1)))
  const compile = (language) =>
    serialize(`${fence}${language}\n${code}\n${fence}`, {
      mdxOptions: { ...mdxOptions, format: 'md' },
    })

  const language = PRISM_LANGUAGES[fields.language] || fields.language || ''
  // Prism throws on languages it doesn't know; show those without highlighting
  fields.source = await compile(language).catch(() => compile(''))
}

const VIDEO_ID = /^[\w-]{11}$/

// Same rules as getYouTubeID() in the CMS (src/blocks/YouTube.ts)
function getYouTubeID(input) {
  const value = input?.trim() || ''
  if (VIDEO_ID.test(value)) return value

  let url
  try {
    url = new URL(value)
  } catch {
    return null
  }

  const host = url.hostname.replace(/^(?:www|m)\./, '')
  const id =
    host === 'youtu.be'
      ? url.pathname.split('/')[1]
      : host === 'youtube.com' || host === 'youtube-nocookie.com'
      ? url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|live|shorts)\/([^/]+)/)?.[1]
      : undefined

  return id && VIDEO_ID.test(id) ? id : null
}

const getText = (node) => node.text ?? (node.children || []).map(getText).join('')

// Heading ids in the style of rehype-slug, which Markdown posts use: "Why a CMS?" -> "why-a-cms"
function createSlugger() {
  const seen = new Map()

  return (text) => {
    const base = text
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, '')
      .replace(/\s/g, '-')
    const count = seen.get(base) || 0
    seen.set(base, count + 1)
    return count ? `${base}-${count}` : base
  }
}

/**
 * Prepares Lexical rich text for components/RichText.jsx on the server: heading anchors, highlighted
 * code, YouTube IDs, absolute image URLs, and only the fields of linked documents the page needs.
 */
async function prepareRichText(content) {
  if (!content?.root) return null

  const { options } = getMdxOptions()
  const slugify = createSlugger()
  const pending = []

  const visit = (node) => {
    if (node.type === 'heading') {
      node.anchor = slugify(getText(node))
    }

    if (node.type === 'upload' && node.value?.url) {
      // Page props can't contain `undefined`
      const {
        url,
        alt = '',
        filename = null,
        mimeType = null,
        width = null,
        height = null,
      } = node.value
      node.value = { url: toAbsoluteUrl(url), alt, filename, mimeType, width, height }
    }

    if (node.type === 'link' && node.fields?.doc?.value?.slug) {
      node.fields.doc.value = { slug: node.fields.doc.value.slug }
    }

    if (node.type === 'block' && node.fields?.blockType === 'Code') {
      pending.push(highlightCode(node.fields, options))
    }

    if (node.type === 'block' && node.fields?.blockType === 'youtube') {
      node.fields.videoId = getYouTubeID(node.fields.url)
    }

    node.children?.forEach(visit)
  }

  visit(content.root)
  await Promise.all(pending)

  return content
}

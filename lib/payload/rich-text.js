import { serialize } from 'next-mdx-remote/serialize'
import getMdxOptions from '../mdx-options'
import { toAbsoluteUrl } from './api'

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
 * Prepares Lexical rich text for components/RichText.jsx on the server: highlighted code, YouTube
 * IDs, absolute image URLs, and only the fields of linked documents the page needs. With `anchors`,
 * headings get ids and anchor links, like the headings of Markdown posts and projects.
 */
export async function prepareRichText(content, { anchors = true } = {}) {
  if (!content?.root) return null

  const { options } = getMdxOptions()
  const slugify = createSlugger()
  const pending = []

  const visit = (node) => {
    if (node.type === 'heading' && anchors) {
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

    if ((node.type === 'link' || node.type === 'autolink') && node.fields?.doc?.value?.slug) {
      const { slug, sites = null } = node.fields.doc.value
      node.fields.doc.value = { slug, sites }
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

import React from 'react'
import { MDXRemote } from 'next-mdx-remote'
import MDXComponents from '@/components/MDX'

/**
 * Renders rich text from Payload CMS (Lexical JSON, prepared by lib/payload/rich-text.js) with the
 * same components as Markdown content, so content from the CMS looks like the Markdown.
 */

const { a: Link, img: Img, Youtube } = MDXComponents

// Lexical's text format flags
const BOLD = 1
const ITALIC = 1 << 1
const STRIKETHROUGH = 1 << 2
const UNDERLINE = 1 << 3
const CODE = 1 << 4
const SUBSCRIPT = 1 << 5
const SUPERSCRIPT = 1 << 6
const HIGHLIGHT = 1 << 7

const ALIGNMENTS = ['left', 'center', 'right', 'justify', 'start', 'end']

// Alignment and indentation set in the editor
function blockStyle({ format, indent }) {
  const style = {}
  if (ALIGNMENTS.includes(format)) style.textAlign = format
  if (indent > 0) style.paddingInlineStart = `${indent * 2}em`
  return Object.keys(style).length > 0 ? style : undefined
}

function renderText({ text, format = 0 }) {
  let result = text
  if (format & BOLD) result = <strong>{result}</strong>
  if (format & ITALIC) result = <em>{result}</em>
  if (format & STRIKETHROUGH) result = <del>{result}</del>
  if (format & UNDERLINE) result = <u>{result}</u>
  if (format & HIGHLIGHT) result = <mark>{result}</mark>
  if (format & CODE) result = <code>{result}</code>
  if (format & SUBSCRIPT) result = <sub>{result}</sub>
  if (format & SUPERSCRIPT) result = <sup>{result}</sup>
  return result
}

// Where linked documents are on this site. Pages of the CMS's other sites aren't.
function getInternalPath(relationTo, { slug, sites }) {
  switch (relationTo) {
    case 'posts':
      return `/blog/${slug}`
    case 'personal-projects':
      return `/projects/${slug}`
    case 'pages':
      return sites?.includes('personal') ? `/${slug}` : null
    default:
      return null
  }
}

function getLinkProps({ fields = {} }) {
  if (fields.linkType === 'internal') {
    const { relationTo, value } = fields.doc || {}
    // Unpublished documents aren't populated for the website
    const href = value?.slug && getInternalPath(relationTo, value)
    if (!href) return null
    return { href, ...(fields.newTab && { target: '_blank' }) }
  }

  if (!fields.url) return null

  // Matches what rehype-external-links does to Markdown links (lib/mdx-options.js)
  const isExternal = /^(https?|mailto|tel):/i.test(fields.url)

  return {
    href: fields.url,
    ...((isExternal || fields.newTab) && { target: '_blank' }),
    ...(isExternal && { rel: 'nofollow' }),
  }
}

function Upload({ value }) {
  if (!value?.url) return null

  if (!value.mimeType?.startsWith('image/')) {
    return (
      <p>
        <Link href={value.url}>{value.filename}</Link>
      </p>
    )
  }

  if (!value.width || !value.height) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={value.url} alt={value.alt} />
  }

  return <Img src={value.url} alt={value.alt} width={value.width} height={value.height} />
}

function Block({ fields }) {
  switch (fields?.blockType) {
    case 'Code':
      return fields.source ? <MDXRemote {...fields.source} /> : null
    case 'youtube':
      return fields.videoId ? (
        <Youtube id={fields.videoId} title={fields.title || 'YouTube video'} />
      ) : null
    default:
      return null
  }
}

function renderNodes(nodes = [], parent) {
  return nodes.map((node, index) => renderNode(node, index, parent))
}

function renderNode(node, key, parent) {
  const children = () => renderNodes(node.children, node)

  switch (node.type) {
    case 'text':
      return <React.Fragment key={key}>{renderText(node)}</React.Fragment>
    case 'linebreak':
      return <br key={key} />
    case 'tab':
      return <React.Fragment key={key}>{'\t'}</React.Fragment>
    case 'paragraph':
      return (
        <p key={key} style={blockStyle(node)}>
          {node.children?.length ? children() : <br />}
        </p>
      )
    case 'heading': {
      // h1-h3 get the anchor links of Markdown headings (components/MDX.jsx)
      const Heading = MDXComponents[node.tag] || node.tag
      return (
        <Heading key={key} id={node.anchor} style={blockStyle(node)}>
          {children()}
        </Heading>
      )
    }
    case 'quote':
      return (
        <blockquote key={key} style={blockStyle(node)}>
          {children()}
        </blockquote>
      )
    case 'list': {
      const List = node.tag === 'ol' ? 'ol' : 'ul'
      return (
        <List
          key={key}
          start={node.tag === 'ol' && node.start > 1 ? node.start : undefined}
          className={node.listType === 'check' ? 'contains-task-list' : undefined}
        >
          {children()}
        </List>
      )
    }
    case 'listitem': {
      // A nested list is a list item that holds another list
      const hasSubList = node.children?.some((child) => child.type === 'list')

      if (parent?.listType === 'check' && !hasSubList) {
        return (
          <li key={key} className="task-list-item">
            <input type="checkbox" checked={Boolean(node.checked)} disabled readOnly /> {children()}
          </li>
        )
      }

      return (
        <li key={key} style={hasSubList ? { listStyleType: 'none' } : undefined}>
          {children()}
        </li>
      )
    }
    case 'link':
    case 'autolink': {
      const linkProps = getLinkProps(node)
      return linkProps ? (
        <Link key={key} {...linkProps}>
          {children()}
        </Link>
      ) : (
        <React.Fragment key={key}>{children()}</React.Fragment>
      )
    }
    case 'horizontalrule':
      return <hr key={key} />
    case 'upload':
      return <Upload key={key} value={node.value} />
    case 'block':
      return <Block key={key} fields={node.fields} />
    default:
      // Nodes this component doesn't know (e.g. from an editor feature added later): keep their text
      return node.children ? <React.Fragment key={key}>{children()}</React.Fragment> : null
  }
}

const RichText = ({ content }) =>
  content?.root ? <>{renderNodes(content.root.children, content.root)}</> : null

export default RichText

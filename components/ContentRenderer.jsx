import React from 'react'
import { MDXRemote } from 'next-mdx-remote'
import CmsContent from '@/components/CmsContent'

const ContentRenderer = (props) => {
  const { source } = props

  if (!source) return null

  const content = source.compiledSource || source.template ? source : source.content

  if (!content) return null

  // Sections of pages from Payload CMS come as templates (lib/payload/pages.js), Markdown as MDX
  if (content.template) return <CmsContent {...content} />

  return <MDXRemote {...content} />
}

export default ContentRenderer

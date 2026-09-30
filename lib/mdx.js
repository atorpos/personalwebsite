import path from 'path'
import fs from 'fs'
import equal from 'fast-deep-equal'
import Parser from './mdx-parser'
import { getFiles, getFileBySlug, getManyFilesBySlug } from './mdx-files'
import getMdxOptions from './mdx-options'
import generateRss from './generate-rss'
import { getCmsPage, getCmsPaths, getCmsRecords } from './payload'

export async function getPaths() {
  const mdxOptions = getMdxOptions()

  const paths = []

  const files = await getFiles(null, mdxOptions)

  await Promise.all(
    files.map(async (file) => {
      const { filePath, slug } = file
      paths.push(file)
      const { meta } = await getPageBySlug(slug)
      if (!meta || !meta.collection) return
      // if (!meta) {
      //   throw Error('missing frontmatter in collection file' + typeof filePath)
      // }
      // if (!meta.collection) {
      //   throw Error('missing collection field in collection file' + typeof filePath)
      // }
      Array.from({ length: meta.collection.totalPages }, (_, i) =>
        paths.push({
          filePath,
          slug: [...slug, 'page', (i + 1).toString()],
        })
      )
    })
  )

  const cmsPaths = await getCmsPaths()
  cmsPaths.forEach((slug) => paths.push({ slug }))

  return paths
}

export async function getPageBySlug(slug, { skipResolvers = false } = {}) {
  if (!slug || !Array.isArray(slug)) {
    throw Error('slug should be type array received ' + typeof slug)
  }

  const mdxOptions = getMdxOptions({ slug })

  const file = await getFileBySlug(slug, mdxOptions)

  const parser = new Parser({ mdxOptions })

  if (!file) {
    // Not a Markdown file, but maybe a post published in Payload CMS
    const cmsPage = await getCmsPage(slug)

    if (!cmsPage) {
      console.log('file with provided slug does not exist ' + JSON.stringify(slug))
      return
    }

    if (!skipResolvers) {
      cmsPage.meta = await parser.resolveComputedFields(cmsPage.meta)
    }

    return cmsPage
  }

  let { data, content, sections } = await parser.parseMdx(file.filePath)

  if (!skipResolvers) {
    data = await parser.resolveComputedFields(data)
    sections = await parser.resolveComputedFields(sections)
  }

  const result = {
    slug,
    content,
    meta: data,
    ...sections,
  }

  return result
}

export async function generateCollectionRss(slug) {
  if (!slug || !Array.isArray(slug)) {
    throw Error('slug should be type array received ' + typeof slug)
  }

  const mdxOptions = getMdxOptions({ slug })

  const isCollectionPage = mdxOptions.collections.find((s) => equal(s, slug))

  if (!isCollectionPage) return

  const files = await getManyFilesBySlug(slug, mdxOptions)
  const parser = new Parser({ slug, mdxOptions })

  let records = await Promise.all(
    files.map(async ({ slug, filePath }) => {
      const data = await parser.parseFrontmatter(filePath)
      return { ...data, slug }
    })
  )

  records = records.concat(await getCmsRecords(slug.join('/')))

  const rssPath = path.join(process.cwd(), mdxOptions.publicDir, 'feed', slug.join('/'))

  const feed = await generateRss(records, rssPath)

  // This also runs when a page is re-rendered on the live server, where the file system can be
  // read-only (e.g. Vercel); the feed written during the last build is served then
  try {
    await fs.promises.mkdir(rssPath, { recursive: true })
    await Promise.all([
      fs.promises.writeFile(path.join(rssPath, 'feed.xml'), feed.rss2()),
      fs.promises.writeFile(path.join(rssPath, 'feed.json'), feed.json1()),
    ])
  } catch (error) {
    console.warn(`Could not write the RSS feed to ${rssPath}: ${error.message}`)
  }
}

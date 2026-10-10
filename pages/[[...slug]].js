import React from 'react'
import { useRouter } from 'next/router'
import Seo from '@/components/Seo'
import Layout from '@/components/Layout'
import layouts from '@/layouts/index'
import { getPaths, getPageBySlug, generateCollectionRss } from '@/lib/mdx'
import { getSiteSettings, isCmsEnabled, revalidateSeconds } from '@/lib/payload'
import { siteMetaData } from '../theme.config'

// Fetch data at build time
export async function getStaticProps({ params }) {
  let slug = params.slug || []
  let currentPage = 1

  const pageIndex = slug.indexOf('page')

  if (pageIndex !== -1) {
    currentPage = parseInt(slug[pageIndex + 1])
    slug = slug.slice(0, pageIndex)
  }

  let page = await getPageBySlug(slug)

  if (!page) {
    page = await getPageBySlug(['not-found'])
  }

  // Name, menu and social links from Site settings in Payload CMS (null: theme.config.js)
  const site = await getSiteSettings()

  const props = { page, site }

  // Add pagination props for collection pages
  if (page.meta && page.meta.collection) {
    const {
      meta: {
        collection: { totalPages, records, recordsPerPage, infinitePaging },
      },
    } = page

    const pageRecords = records?.slice(
      recordsPerPage * (currentPage - 1),
      recordsPerPage * currentPage
    )

    page.meta.collection.records = pageRecords

    props.pagination = {
      infinitePaging,
      totalPages,
      currentPage,
    }
  }

  // Generate RSS feed for collections
  await generateCollectionRss(slug, site)

  // Re-render in the background from time to time to pick up changes made in Payload CMS
  return { props, ...(isCmsEnabled && { revalidate: revalidateSeconds }) }
}

// Specify dynamic routes to pre-render pages based on data.
// The HTML is generated at build time and will be reused on each request.
export async function getStaticPaths() {
  const pages = await getPaths()

  const paths = pages.map((page) => ({
    params: {
      slug: page.slug,
    },
  }))

  return { paths, fallback: true }
}

export default function Page({ pagination, page = {}, site }) {
  const { meta = {}, ...content } = page
  const router = useRouter()

  const layout = router.isFallback ? 'Fallback' : meta.layout
  const DynamicLayout = layouts[layout]
  const pageUrl = siteMetaData.siteUrl + router.asPath

  if (!DynamicLayout) return null

  return (
    <>
      <Seo {...meta} site={site} pageUrl={pageUrl} />
      <DynamicLayout {...meta} {...content} pagination={pagination} pageUrl={pageUrl} site={site} />
    </>
  )
}

Page.getLayout = function getLayout(page) {
  return <Layout site={page.props.site}>{page}</Layout>
}

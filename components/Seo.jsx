import React from 'react'
import { NextSeo } from 'next-seo'
import { toAbsoluteUrl } from '@/utils/index'
import { getSiteMetaData } from '@/utils/site'

const Seo = (props) => {
  const { seo = {}, title, description, images, pageUrl, site } = props

  // Without a title or description of its own, a page gets the site's defaults
  const metaData = {
    ...getSiteMetaData(site),
    ...(title && { title }),
    ...(description && { description }),
    ...seo,
  }

  const ogImageUrl = images?.[0]?.src ? toAbsoluteUrl(images[0].src, metaData.siteUrl) : undefined

  const openGraph = {
    url: pageUrl,
    title: metaData.title,
    description: metaData.description,
    images: [{ url: ogImageUrl }],
    site_name: metaData.siteName,
    locale: metaData.locale,
  }

  return <NextSeo {...metaData} openGraph={openGraph} />
}

export default Seo

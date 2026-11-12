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

  // Without an image of its own, a page shows the site's image in link previews
  const image = images?.find((img) => img?.src) || metaData.image
  const ogImageUrl = image?.src ? toAbsoluteUrl(image.src, metaData.siteUrl) : undefined

  const openGraph = {
    url: pageUrl,
    title: metaData.title,
    description: metaData.description,
    images: ogImageUrl
      ? [
          {
            url: ogImageUrl,
            // When they are known, so that link previews can lay out the image
            ...(image.width && image.height && { width: image.width, height: image.height }),
            ...(image.alt && { alt: image.alt }),
          },
        ]
      : [],
    site_name: metaData.siteName,
    locale: metaData.locale,
  }

  // The page's address without query string, so that e.g. ?utm_source=… isn't indexed separately
  const canonical = metaData.noindex ? undefined : pageUrl?.split(/[?#]/)[0]

  return <NextSeo {...metaData} canonical={canonical} openGraph={openGraph} />
}

export default Seo

/** *************************************************************
 * /sitemap-photos.xml: every page of the photo portfolio, with *
 * the photo it shows, for search engines and image search.     *
 * Made on request, so new photos are in it right away; listed  *
 * in robots.txt (next-sitemap.config.js).                      *
 ****************************************************************/

import { getSiteSettings, isCmsEnabled, loadPortfolio, PHOTOS } from '@/lib/payload'
import { getSiteMetaData } from '@/utils/site'

const escape = (value) =>
  String(value).replace(
    /[<>&'"]/g,
    (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[char])
  )

function toXml(siteUrl, { albums, photos }) {
  const url = ({ path, lastmod, images = [] }) =>
    [
      '<url>',
      `<loc>${escape(siteUrl + path)}</loc>`,
      lastmod && `<lastmod>${escape(lastmod)}</lastmod>`,
      ...images.map((src) => `<image:image><image:loc>${escape(src)}</image:loc></image:image>`),
      '</url>',
    ]
      .filter(Boolean)
      .join('')

  const shownAlbums = albums.filter((album) => album.photos.length)
  const latest = (items) =>
    items
      .map((item) => item.updatedAt)
      .sort()
      .at(-1)

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    url({ path: `/${PHOTOS}`, lastmod: latest(photos) }),
    ...shownAlbums.map((album) =>
      url({ path: album.path, lastmod: latest([album, ...album.photos]) })
    ),
    ...photos.map((photo) =>
      url({ path: photo.path, lastmod: photo.updatedAt, images: [photo.original.src] })
    ),
    '</urlset>',
  ].join('\n')
}

export async function getServerSideProps({ res }) {
  if (!isCmsEnabled) return { notFound: true }

  const [site, portfolio] = await Promise.all([getSiteSettings(), loadPortfolio()])

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  // Shared caches (e.g. Cloudflare) may keep it for 10 minutes
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600')
  res.end(toXml(getSiteMetaData(site).siteUrl, portfolio))

  return { props: {} }
}

export default function PhotoSitemap() {
  return null
}

/**
 * Sitemap is generated via the next-sitemap plugin. For more options see:
 * https://www.npmjs.com/package/next-sitemap
 */

// The same address as siteMetaData.siteUrl in theme.config.js. Without it, robots.txt and the
// sitemap would send search engines to localhost.
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.altawoz.com').replace(/\/$/, '')

module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  exclude: [
    // The photo portfolio has its own sitemap, made on request with every photo
    // (pages/sitemap-photos.xml.js), so new photos don't wait for the next build
    '/sitemap-photos.xml',
    '/photos',
    '/photos/*',
    // Pages kept out of search results (`noindex: true`): the theme's demo pages and "not found"
    '/index-2',
    '/index-3',
    '/index-5',
    '/new-page',
    '/not-found',
    // The first page of a list is the list itself, e.g. /blog/page/1 is /blog
    '*/page/1',
  ],
  robotsTxtOptions: {
    additionalSitemaps: [`${siteUrl}/sitemap-photos.xml`],
  },
}

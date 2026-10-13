/**
 * Sitemap is generated via the next-sitemap plugin. For more options see:
 * https://www.npmjs.com/package/next-sitemap
 */

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'http://localhost:3000'

module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  // The photo portfolio has its own sitemap, made on request with every photo
  // (pages/sitemap-photos.xml.js), so new photos don't wait for the next build
  exclude: ['/sitemap-photos.xml', '/photos', '/photos/*'],
  robotsTxtOptions: {
    additionalSitemaps: [`${siteUrl}/sitemap-photos.xml`],
  },
  // ...other options
}

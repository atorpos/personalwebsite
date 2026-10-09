import { siteMetaData } from '../theme.config'

/**
 * The site's metadata from theme.config.js, with what is set in Site settings in Payload CMS on top
 * (`site` comes from getSiteSettings() in lib/payload).
 */
export const getSiteMetaData = (site) =>
  site?.meta
    ? {
        ...siteMetaData,
        ...site.meta,
        twitter: { ...siteMetaData.twitter, ...site.meta.twitter },
      }
    : siteMetaData

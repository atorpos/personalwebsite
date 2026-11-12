import JsonLd from '@/components/JsonLd'
import { getSiteMetaData } from '@/utils/site'
import { social as themeSocial } from '../theme.config'

/**
 * Who the site is about, and the site itself (https://schema.org Person and WebSite), on the home
 * page. Search engines and AI assistants use it to connect the site with the same person's
 * profiles elsewhere (`sameAs`: the social links of the menu).
 */
const SiteJsonLd = ({ site }) => {
  const { siteUrl, siteName, authorName, description, jobTitle, locale } = getSiteMetaData(site)
  const personId = `${siteUrl}/#person`

  const person = {
    '@type': 'Person',
    '@id': personId,
    name: authorName,
    url: siteUrl,
    ...(jobTitle && { jobTitle }),
    image: `${siteUrl}/author-profile-picture.jpg`,
    sameAs: (site?.social || themeSocial).map(({ url }) => url).filter(Boolean),
  }

  const website = {
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: siteUrl,
    name: siteName,
    description,
    inLanguage: locale?.replace('_', '-'),
    author: { '@id': personId },
  }

  return (
    <JsonLd id="site" data={{ '@context': 'https://schema.org', '@graph': [person, website] }} />
  )
}

export default SiteJsonLd

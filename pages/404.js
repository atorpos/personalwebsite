/**
 * Addresses without a page answer 404 with the "not found" page: content/not-found.md, or the page
 * with the slug `not-found` in Payload CMS. Search engines then drop them instead of indexing them.
 */
import Page, { getStaticProps as getPageProps } from './[[...slug]]'

export const getStaticProps = () => getPageProps({ params: { slug: ['not-found'] } })

export default Page

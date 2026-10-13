import JsonLd from '@/components/JsonLd'
import PageTitle from '@/components/MDXPageTitle'
import PhotoBreadcrumbs from '@/components/PhotoBreadcrumbs'
import PhotoGrid from '@/components/PhotoGrid'
import { getSiteMetaData } from '@/utils/site'

/** /photos/tags/<tag>: the photos of every album with a tag */
const Layout = ({ tag, photos = [], title, pageUrl, site }) => {
  const { siteUrl } = getSiteMetaData(site)

  return (
    <div className="mx-auto w-full p-3 md:p-6 lg:p-12">
      <JsonLd
        id="photo-tag"
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: title,
          url: pageUrl,
          hasPart: photos.slice(0, 50).map((photo) => ({
            '@type': 'ImageObject',
            name: photo.title,
            contentUrl: photo.sources[photo.sources.length - 1]?.src,
            url: siteUrl + photo.path,
          })),
        }}
      />
      <PhotoBreadcrumbs items={[{ title: 'Photos', path: '/photos' }]} />
      <div className="prose mb-6 max-w-none dark:prose-invert md:mb-10">
        <PageTitle>
          <h1 className="text-3xl capitalize lg:text-4xl">{tag.name}</h1>
          <h3>
            <em>
              {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
            </em>
          </h3>
        </PageTitle>
      </div>
      <PhotoGrid photos={photos} priorityCount={3} />
    </div>
  )
}

export default Layout

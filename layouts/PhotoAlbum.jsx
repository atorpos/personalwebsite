import JsonLd from '@/components/JsonLd'
import PageTitle from '@/components/MDXPageTitle'
import PhotoBreadcrumbs from '@/components/PhotoBreadcrumbs'
import PhotoGrid from '@/components/PhotoGrid'
import { getSiteMetaData } from '@/utils/site'

const largest = (photo) => photo.sources[photo.sources.length - 1]?.src

/** /photos/<album>: the album's photos, with buttons to show only those with a tag */
const Layout = ({ album, photos = [], photoTags = [], pageUrl, site }) => {
  const { siteUrl, authorName } = getSiteMetaData(site)

  return (
    <div className="mx-auto w-full p-3 md:p-6 lg:p-12">
      <JsonLd
        id="album"
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'ImageGallery',
              name: album.title,
              description: album.description || undefined,
              url: pageUrl,
              dateModified: album.updatedAt,
              author: { '@type': 'Person', name: authorName },
              image: photos.slice(0, 50).map((photo) => ({
                '@type': 'ImageObject',
                name: photo.title,
                description: photo.alt || undefined,
                contentUrl: largest(photo),
                url: siteUrl + photo.path,
              })),
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Photos', item: `${siteUrl}/photos` },
                { '@type': 'ListItem', position: 2, name: album.title, item: pageUrl },
              ],
            },
          ],
        }}
      />
      <PhotoBreadcrumbs items={[{ title: 'Photos', path: '/photos' }]} />
      <div className="prose mb-6 max-w-none dark:prose-invert md:mb-10">
        <PageTitle>
          <h1 className="text-3xl lg:text-4xl">{album.title}</h1>
          <h3>
            <em>
              {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
            </em>
          </h3>
        </PageTitle>
        {album.description && <p>{album.description}</p>}
      </div>
      <PhotoGrid photos={photos} filterTags={photoTags} priorityCount={3} />
    </div>
  )
}

export default Layout

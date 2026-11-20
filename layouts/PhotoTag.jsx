import JsonLd from '@/components/JsonLd'
import PhotoGrid from '@/components/PhotoGrid'
import PhotoSiteFooter from '@/components/PhotoSiteFooter'
import { GalleryNav, PhotoSiteHeader } from '@/components/PhotoSiteHeader'
import { getSiteMetaData } from '@/utils/site'

/** /photos/tags/<tag>: the photos of every album with a tag, and Info and Contact */
const Layout = ({ photoSite, tag, photos = [], title, pageUrl, site }) => {
  const { siteUrl } = getSiteMetaData(site)

  return (
    <div className="w-full text-omega-100">
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
      <PhotoSiteHeader photoSite={photoSite} />
      <GalleryNav albums={photoSite.albums} />

      <div className="px-5 pt-14 text-center md:pt-20">
        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-omega-400">
          {photos.length} {photos.length === 1 ? 'photo' : 'photos'} tagged
        </p>
        <h1 className="font-serif text-5xl font-medium capitalize text-white md:text-6xl">
          {tag.name}
        </h1>
      </div>
      <div className="w-full px-5 py-14 md:px-10 md:py-20 lg:px-16">
        <PhotoGrid photos={photos} priorityCount={3} />
      </div>

      <PhotoSiteFooter photoSite={photoSite} site={site} />
    </div>
  )
}

export default Layout

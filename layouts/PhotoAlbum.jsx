import Link from 'next/link'
import JsonLd from '@/components/JsonLd'
import PhotoGrid from '@/components/PhotoGrid'
import PhotoImage from '@/components/PhotoImage'
import PhotoSiteFooter from '@/components/PhotoSiteFooter'
import { GalleryNav, PhotoSiteHeader } from '@/components/PhotoSiteHeader'
import { getSiteMetaData } from '@/utils/site'

const largest = (photo) => photo.sources[photo.sources.length - 1]?.src

const count = (n) => `${n} ${n === 1 ? 'photo' : 'photos'}`

// "Previous gallery" and "Next gallery" under the photos
const AlbumLink = ({ album, direction }) =>
  album ? (
    <Link
      href={album.path}
      rel={direction}
      className={`group no-underline ${direction === 'next' ? 'text-right' : ''}`}
    >
      <span className="block text-xs uppercase tracking-[0.25em] text-omega-400">
        {direction === 'next' ? 'Next gallery →' : '← Previous gallery'}
      </span>
      <span className="mt-2 block font-serif text-2xl text-white transition-opacity group-hover:opacity-70 md:text-3xl">
        {album.title}
      </span>
    </Link>
  ) : (
    <span />
  )

/**
 * /photos/<album>: a gallery's page, with its cover and title across the top, its photos (with
 * buttons to show only those with a tag), the galleries before and after it, and Info and Contact
 */
const Layout = (props) => {
  const { photoSite, album, photos = [], photoTags = [], previousAlbum, nextAlbum } = props
  const { pageUrl, site } = props
  const { siteUrl, authorName } = getSiteMetaData(site)

  return (
    <div className="w-full text-omega-100">
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

      <section className="relative h-[65vh] min-h-[24rem] w-full overflow-hidden bg-omega-900">
        {album.cover && (
          <PhotoImage
            photo={album.cover}
            sizes="100vw"
            priority
            className="absolute inset-0 m-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/60" />
        <PhotoSiteHeader photoSite={photoSite} overlay />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
          <p className="mb-4 text-xs uppercase tracking-[0.35em] text-white/80">
            {count(photos.length)}
          </p>
          <h1 className="font-serif text-5xl font-medium md:text-7xl">{album.title}</h1>
        </div>
      </section>

      <GalleryNav albums={photoSite.albums} active={album.path} />

      {album.description && (
        <p className="mx-auto max-w-2xl px-5 pt-14 text-center font-serif text-xl leading-relaxed text-omega-300 md:pt-20 md:text-2xl">
          {album.description}
        </p>
      )}

      <div className="w-full px-5 py-14 md:px-10 md:py-20 lg:px-16">
        <PhotoGrid photos={photos} filterTags={photoTags} priorityCount={3} />
      </div>

      {(previousAlbum || nextAlbum) && (
        <nav
          aria-label="More galleries"
          className="flex w-full items-start justify-between gap-6 px-5 pb-16 md:px-10 md:pb-24 lg:px-16"
        >
          <AlbumLink album={previousAlbum} direction="prev" />
          <AlbumLink album={nextAlbum} direction="next" />
        </nav>
      )}

      <PhotoSiteFooter photoSite={photoSite} site={site} />
    </div>
  )
}

export default Layout

import Link from 'next/link'
import JsonLd from '@/components/JsonLd'
import PhotoGrid from '@/components/PhotoGrid'
import PhotoImage from '@/components/PhotoImage'
import PhotoSiteFooter from '@/components/PhotoSiteFooter'
import PhotoTagLinks from '@/components/PhotoTagLinks'
import { GalleryNav, PhotoSiteHeader } from '@/components/PhotoSiteHeader'
import Reveal from '@/components/Reveal'
import { getSiteMetaData } from '@/utils/site'

const section = 'w-full px-5 py-16 md:px-10 md:py-24 lg:px-16'

const SectionTitle = ({ children, id }) => (
  <h2
    id={id}
    className="mb-10 text-center font-serif text-4xl font-medium text-white md:mb-14 md:text-5xl"
  >
    {children}
  </h2>
)

const AlbumCard = ({ path, title, count, cover, priority }) => (
  <Link href={path} className="group block text-center no-underline">
    {/* 4:5, with @tailwindcss/aspect-ratio (the theme turns off Tailwind's own aspect-*) */}
    <div className="overflow-hidden bg-omega-800">
      <div className="aspect-w-4 aspect-h-5">
        {cover && (
          <PhotoImage
            photo={cover}
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
            priority={priority}
            className="m-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
      </div>
    </div>
    <h3 className="mt-5 font-serif text-2xl font-medium text-white md:text-3xl">{title}</h3>
    <p className="mt-1 text-xs uppercase tracking-[0.25em] text-omega-400">
      {count} {count === 1 ? 'photo' : 'photos'}
    </p>
  </Link>
)

/**
 * /photos, laid out like a photographer's site: a photo across the top with the title over it, the
 * galleries (each a page of its own), the featured photos, the tags, and Info and Contact
 */
const Layout = (props) => {
  const { photoSite, hero, albums, featured, photoTags = [], pageUrl, site, title } = props
  const { siteUrl, authorName } = getSiteMetaData(site)

  return (
    <div className="w-full text-omega-100">
      <JsonLd
        id="photos"
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: title,
          url: pageUrl,
          author: { '@type': 'Person', name: authorName },
          hasPart: albums.list.map((album) => ({
            '@type': 'ImageGallery',
            name: album.title,
            url: siteUrl + album.path,
          })),
        }}
      />

      {hero ? (
        <section className="relative h-[85vh] min-h-[28rem] w-full overflow-hidden bg-omega-900">
          <PhotoImage
            photo={hero}
            sizes="100vw"
            priority
            className="absolute inset-0 m-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/60" />
          <PhotoSiteHeader photoSite={photoSite} overlay />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
            <h1 className="font-serif text-5xl font-medium md:text-7xl lg:text-8xl">
              {photoSite.title}
            </h1>
            {photoSite.subtitle && (
              <p className="mt-5 text-xs uppercase tracking-[0.35em] text-white/80 md:text-sm">
                {photoSite.subtitle}
              </p>
            )}
          </div>
          <a
            href="#galleries"
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-white/80 no-underline hover:text-white"
          >
            View galleries ↓
          </a>
        </section>
      ) : (
        <>
          <PhotoSiteHeader photoSite={photoSite} />
          <h1 className="px-5 pt-10 text-center font-serif text-5xl font-medium md:text-7xl">
            {photoSite.title}
          </h1>
        </>
      )}

      {photoSite.albums.length > 0 && <GalleryNav albums={photoSite.albums} active="/photos" />}
      <div className="w-full px-5 pt-8 text-center">
        <Link href="/flickr" className="text-omega-300 hover:text-white">
          Explore my Flickr photos →
        </Link>
      </div>

      {albums.list.length > 0 && (
        <section
          id="galleries"
          aria-labelledby="galleries-title"
          className={`${section} scroll-mt-16 lg:scroll-mt-20`}
        >
          <SectionTitle id="galleries-title">{albums.title}</SectionTitle>
          <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {albums.list.map((album, i) => (
              <Reveal animation="fade-in slide-in-top" delay={(i % 3) * 100} key={album.path}>
                <AlbumCard {...album} priority={i < 3} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {featured.photos.length > 0 && (
        <section aria-labelledby="featured-title" className={`${section} pt-0 md:pt-0`}>
          <SectionTitle id="featured-title">{featured.title}</SectionTitle>
          <PhotoGrid photos={featured.photos} />
        </section>
      )}

      {photoTags.length > 0 && (
        <section aria-labelledby="tags-title" className={`${section} pt-0 text-center md:pt-0`}>
          <p id="tags-title" className="mb-5 text-xs uppercase tracking-[0.3em] text-omega-500">
            Browse by tag
          </p>
          <PhotoTagLinks tags={photoTags} className="mx-auto max-w-3xl justify-center" />
        </section>
      )}

      <PhotoSiteFooter photoSite={photoSite} site={site} />
    </div>
  )
}

export default Layout

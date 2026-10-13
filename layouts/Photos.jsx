import Link from 'next/link'
import ContentRenderer from '@/components/ContentRenderer'
import JsonLd from '@/components/JsonLd'
import PhotoGrid from '@/components/PhotoGrid'
import PhotoImage from '@/components/PhotoImage'
import Reveal from '@/components/Reveal'
import Tag from '@/components/Tag'
import { getSiteMetaData } from '@/utils/site'

const AlbumCard = ({ path, title, count, cover, priority }) => (
  <Link href={path} className="group relative block overflow-hidden bg-omega-800 no-underline">
    {/* 4:3, with @tailwindcss/aspect-ratio (the theme turns off Tailwind's own aspect-*) */}
    <div className="aspect-w-4 aspect-h-3">
      {cover && (
        <PhotoImage
          photo={cover}
          sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw"
          priority={priority}
          className="m-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
    </div>
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
      <h2 className="m-0 text-xl text-white md:text-2xl">{title}</h2>
      <small className="text-omega-300">
        {count} {count === 1 ? 'photo' : 'photos'}
      </small>
    </div>
  </Link>
)

/** /photos: the introduction, the albums, featured (or the latest) photos and the tags */
const Layout = ({ intro, albums, featured, photoTags = [], pageUrl, site, title }) => {
  const { siteUrl, authorName } = getSiteMetaData(site)

  return (
    <div className="mx-auto w-full p-3 md:p-6 lg:p-12">
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
      <div className="prose max-w-none dark:prose-invert">
        <ContentRenderer source={intro} />

        {albums.list.length > 0 && (
          <section className="mt-8 md:mt-12">
            <h4>{albums.title}</h4>
            <div className="not-prose grid gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-3">
              {albums.list.map((album, i) => (
                <Reveal animation="fade-in slide-in-top" delay={(i % 3) * 100} key={album.path}>
                  <AlbumCard {...album} priority={i < 3} />
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {featured.photos.length > 0 && (
          <section className="mt-12 md:mt-16">
            <h4>{featured.title}</h4>
            <div className="not-prose">
              <PhotoGrid photos={featured.photos} />
            </div>
          </section>
        )}

        {photoTags.length > 0 && (
          <section className="mt-12 md:mt-16">
            <h4>Tags</h4>
            <div className="not-prose flex flex-wrap gap-2">
              {photoTags.map(({ tag, count, path }) => (
                <Tag key={tag} slug={path.split('/')} className="font-mono text-sm">
                  {tag.replace(/-/g, ' ')} <span className="opacity-60">{count}</span>
                </Tag>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default Layout

import React, { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { SlArrowLeft, SlArrowRight } from 'react-icons/sl'
import JsonLd from '@/components/JsonLd'
import PhotoImage from '@/components/PhotoImage'
import PhotoSiteFooter from '@/components/PhotoSiteFooter'
import PhotoTagLinks from '@/components/PhotoTagLinks'
import { GalleryNav, PhotoSiteHeader } from '@/components/PhotoSiteHeader'
import { getSiteMetaData } from '@/utils/site'
import { config } from '../theme.config'

// The CMS stores the day a photo was taken at noon UTC, so it's the same day everywhere
const formatDay = (date) =>
  new Date(date).toLocaleDateString(config.dateLocale, { ...config.dateOptions, timeZone: 'UTC' })

const Neighbor = ({ photo, direction }) => {
  if (!photo) return <span />

  const isNext = direction === 'next'
  const Arrow = isNext ? SlArrowRight : SlArrowLeft

  return (
    <Link
      href={photo.path}
      rel={direction}
      className="group flex max-w-[48%] items-center gap-3 no-underline"
    >
      {!isNext && <Arrow className="shrink-0 text-omega-400" aria-hidden="true" />}
      <span className={isNext ? 'text-right' : ''}>
        <small className="block text-xs uppercase tracking-[0.25em] text-omega-400">
          {isNext ? 'Next' : 'Previous'}
        </small>
        <span className="font-serif text-xl text-omega-100 group-hover:opacity-70">
          {photo.title}
        </span>
      </span>
      {isNext && <Arrow className="shrink-0 text-omega-400" aria-hidden="true" />}
    </Link>
  )
}

/**
 * /photos/<album>/<photo>: the photo, its texts and details, the photos next to it, and Info and
 * Contact
 */
const Layout = ({ photoSite, photo, previous, next, pageUrl, site }) => {
  const router = useRouter()
  const { siteUrl, authorName } = getSiteMetaData(site)

  // The arrow keys go to the previous and next photo of the album
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      if (event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return

      const target = { ArrowLeft: previous, ArrowRight: next }[event.key]
      if (target) router.push(target.path)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [previous, next, router])

  const details = [
    photo.takenAt && { label: 'Taken', value: formatDay(photo.takenAt) },
    photo.location && { label: 'Location', value: photo.location },
    ...photo.camera,
  ].filter(Boolean)

  return (
    <div className="w-full text-omega-100">
      <JsonLd
        id="photo"
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'ImageObject',
              name: photo.title,
              description: photo.description || undefined,
              caption: photo.alt || undefined,
              contentUrl: photo.original.src,
              thumbnailUrl: photo.sources[0].src,
              url: pageUrl,
              width: photo.original.width,
              height: photo.original.height,
              keywords: photo.tags.length ? photo.tags.join(', ') : undefined,
              dateCreated: photo.takenAt || undefined,
              datePublished: photo.createdAt,
              dateModified: photo.updatedAt,
              contentLocation: photo.location
                ? { '@type': 'Place', name: photo.location }
                : undefined,
              creator: { '@type': 'Person', name: authorName },
              creditText: authorName,
              copyrightNotice: `© ${authorName}`,
              isPartOf: {
                '@type': 'ImageGallery',
                name: photo.album.title,
                url: siteUrl + photo.album.path,
              },
              exifData: photo.camera.length
                ? photo.camera.map(({ label, value }) => ({
                    '@type': 'PropertyValue',
                    name: label,
                    value,
                  }))
                : undefined,
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Photos', item: `${siteUrl}/photos` },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: photo.album.title,
                  item: siteUrl + photo.album.path,
                },
                { '@type': 'ListItem', position: 3, name: photo.title, item: pageUrl },
              ],
            },
          ],
        }}
      />
      <PhotoSiteHeader photoSite={photoSite} />
      <GalleryNav albums={photoSite.albums} active={photo.album.path} />

      <div className="w-full px-5 py-10 md:px-10 md:py-14 lg:px-16">
        <figure className="m-0 flex items-center justify-center bg-omega-900">
          <PhotoImage
            // A new photo, not the old one resized, when the arrows go to the next photo
            key={photo.path}
            photo={photo}
            sizes="(min-width: 1024px) 75vw, 100vw"
            priority
            className="m-0 block h-auto max-h-[85vh] w-auto max-w-full"
          />
        </figure>

        <div className="mt-6 grid gap-8 md:mt-10 lg:grid-cols-3">
          <div className="prose max-w-none dark:prose-invert lg:col-span-2">
            <Link
              href={photo.album.path}
              className="text-xs uppercase tracking-[0.25em] text-omega-400 no-underline hover:text-white"
            >
              {photo.album.title}
            </Link>
            <h1 className="mb-4 mt-3 font-serif text-4xl font-medium lg:text-5xl">{photo.title}</h1>
            {photo.description
              .split(/\n\s*\n/)
              .filter((paragraph) => paragraph.trim())
              .map((paragraph, i) => (
                <p key={i}>{paragraph.trim()}</p>
              ))}
            {photo.tags.length > 0 && (
              <PhotoTagLinks tags={photo.tags.map((tag) => ({ tag }))} className="not-prose mt-6" />
            )}
          </div>

          {details.length > 0 && (
            <dl className="m-0 grid h-fit grid-cols-[auto_1fr] gap-x-6 gap-y-3 bg-omega-800 p-4 md:p-6">
              {details.map(({ label, value }) => (
                <React.Fragment key={label}>
                  <dt className="font-mono text-sm uppercase text-omega-400">{label}</dt>
                  <dd className="m-0 text-omega-100">{value}</dd>
                </React.Fragment>
              ))}
            </dl>
          )}
        </div>

        {(previous || next) && (
          <nav
            aria-label="More photos from this album"
            className="mt-10 flex items-start justify-between gap-6 border-t border-omega-700 pt-6"
          >
            <Neighbor photo={previous} direction="prev" />
            <Neighbor photo={next} direction="next" />
          </nav>
        )}
      </div>

      <PhotoSiteFooter photoSite={photoSite} site={site} />
    </div>
  )
}

export default Layout

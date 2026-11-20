import Link from 'next/link'
import Layout from '@/components/Layout'
import Seo from '@/components/Seo'
import { getSiteSettings } from '@/lib/payload'

export async function getServerSideProps({ query, res }) {
  // Never cache Flickr images in generated pages: privacy and admin changes must take effect.
  res.setHeader('Cache-Control', 'private, no-store, max-age=0')
  const requested = Number(query.page || 1)
  const page = Number.isSafeInteger(requested) && requested > 0 ? requested : 1
  const base = (process.env.PAYLOAD_URL || '').replace(/\/+$/, '')
  let gallery = null
  if (base) {
    try {
      const response = await fetch(
        `${base}/api/flickr-gallery?${new URLSearchParams({ page: String(page) })}`,
        {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(10000),
        }
      )
      if (response.ok) gallery = await response.json()
    } catch (error) {
      console.error('Could not load Flickr gallery:', error.message)
    }
  }
  const site = await getSiteSettings().catch(() => null)
  return { props: { gallery, page, site } }
}

export default function FlickrGallery({ gallery, page, site }) {
  const photos = gallery?.docs || []
  return (
    <>
      <Seo title="Flickr photos" description="Photographs from Flickr." site={site} />
      <div className="w-full px-5 py-12 text-omega-100 md:px-10 lg:px-16">
        <Link href="/photos" className="text-sm text-omega-300 hover:text-white">
          ← Photos
        </Link>
        <h1 className="mt-8 font-serif text-5xl text-white">Flickr photos</h1>
        <p className="mt-4 text-omega-300">A selection of my public photographs on Flickr.</p>
        {!gallery ? (
          <p className="mt-12" role="status">
            The gallery is temporarily unavailable. Please try again later.
          </p>
        ) : photos.length === 0 ? (
          <p className="mt-12">No photos to show on this page.</p>
        ) : (
          <ul className="m-0 mt-12 grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <li key={photo.flickrId} className="m-0 p-0">
                <a
                  href={photo.flickrUrl}
                  className="block text-inherit no-underline hover:opacity-80"
                >
                  {/* The file stays on Flickr; each photograph links back to its Flickr page. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    width={photo.width}
                    height={photo.height}
                    loading="lazy"
                    className="h-auto w-full"
                  />
                  <span className="mt-2 block text-sm">
                    {photo.title} <span className="text-omega-400">· View on Flickr</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
        {gallery && gallery.totalPages > 1 && (
          <nav aria-label="Flickr gallery pages" className="mt-12 flex items-center gap-8">
            {page > 1 && (
              <Link href={{ pathname: '/flickr', query: { page: page - 1 } }}>← Previous</Link>
            )}
            <span>
              Page {page} of {gallery.totalPages}
            </span>
            {page < gallery.totalPages && (
              <Link href={{ pathname: '/flickr', query: { page: page + 1 } }}>Next →</Link>
            )}
          </nav>
        )}
        <p className="mt-16 text-sm text-omega-400">
          This product uses the Flickr API but is not endorsed or certified by SmugMug, Inc.
        </p>
      </div>
    </>
  )
}

FlickrGallery.getLayout = (page) => <Layout site={page.props.site}>{page}</Layout>

/** *************************************************************
 * The photo portfolio, edited in Payload CMS (Photos, Photo    *
 * albums and Photos page there). There are no Markdown files   *
 * for it, so it exists only when PAYLOAD_URL is set:           *
 * - /photos                   albums and featured photos       *
 * - /photos/<album>           the photos of an album           *
 * - /photos/<album>/<photo>   a photo                          *
 * - /photos/tags/<tag>        the photos with a tag            *
 * Every page has the galleries above it and Info and Contact  *
 * below it (`photoSite`), like a portfolio site of its own.   *
 ****************************************************************/

import { findDocs, findGlobal, isCmsEnabled, toAbsoluteUrl } from './api'
import { prepareRichText, toPlainText } from './rich-text'

export const PHOTOS = 'photos'
export const PHOTO_TAGS = 'tags'

const select = (fields) => Object.fromEntries(fields.map((field) => [`select[${field}]`, 'true']))

const PHOTO_FIELDS = [
  'title',
  'alt',
  'description',
  'slug',
  'tags',
  'album',
  'takenAt',
  'location',
  'camera',
  'featured',
  // Payload builds `url` from the filename (and the S3 folder in `prefix`)
  'url',
  'filename',
  'prefix',
  'width',
  'height',
  'variants',
  'createdAt',
  'updatedAt',
]

const ALBUM_FIELDS = ['title', 'description', 'slug', 'cover', 'seo', 'updatedAt']

const toSource = (file) =>
  file?.url && file.width && file.height
    ? { src: toAbsoluteUrl(file.url), width: file.width, height: file.height }
    : null

// The sizes the CMS makes of every photo (PersonalPhotos.ts there), smallest first. The largest is
// 2560 px; the file itself (up to 4096 px) is only for search engines.
function toSources(doc) {
  const files = Object.values(doc.variants || {})
    .map(toSource)
    .filter(Boolean)
    .sort((a, b) => a.width - b.width)
    .filter((file, i, all) => i === 0 || file.width !== all[i - 1].width)

  return files.length ? files : [toSource(doc)].filter(Boolean)
}

// Camera, lens and settings as label/value pairs, without the empty ones
function toCameraDetails(camera = {}) {
  const settings = [camera.focalLength, camera.aperture, camera.shutterSpeed, camera.iso]
    .filter(Boolean)
    .join(' · ')

  return [
    { label: 'Camera', value: camera.model },
    { label: 'Lens', value: camera.lens },
    { label: 'Settings', value: settings },
  ].filter(({ value }) => value)
}

function toPhoto(doc, album) {
  const sources = toSources(doc)
  if (!sources.length) return null

  return {
    id: doc.id,
    slug: doc.slug,
    path: `/${PHOTOS}/${album.slug}/${doc.slug}`,
    title: doc.title || album.title,
    alt: doc.alt || doc.title || '',
    description: doc.description || '',
    tags: doc.tags || [],
    takenAt: doc.takenAt || null,
    location: doc.location || null,
    camera: toCameraDetails(doc.camera || undefined),
    featured: Boolean(doc.featured),
    width: doc.width,
    height: doc.height,
    sources,
    original: toSource(doc) || sources[sources.length - 1],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

// What a grid needs of a photo: the page's props stay small even for big albums
const toThumbnail = ({ slug, path, title, alt, tags, width, height, sources }) => ({
  slug,
  path,
  title,
  alt,
  tags,
  width,
  height,
  sources: sources.filter((source) => source.width <= 1600),
})

// What a full-width photo needs (the hero, an album's cover): every size, up to 2560 px
const toBanner = ({ slug, path, title, alt, width, height, sources }) => ({
  slug,
  path,
  title,
  alt,
  width,
  height,
  sources,
})

const isLandscape = (photo) => photo.width >= photo.height

// The photo across the top of /photos: the first landscape photo of those shown there
const pickHero = (shown) => shown.find(isLandscape) || shown[0] || null

// The photo beside Info: a portrait photo other than the hero, featured ones first
const pickInfoPhoto = (photos, hero) => {
  const others = photos.filter((photo) => photo.slug !== hero?.slug)
  const featured = others.filter((photo) => photo.featured)
  return (
    featured.find((photo) => !isLandscape(photo)) ||
    others.find((photo) => !isLandscape(photo)) ||
    featured[0] ||
    others[0] ||
    null
  )
}

// Without featured photos, the latest ones
const shownOnLanding = (photos) => {
  const featured = photos.filter((photo) => photo.featured)
  return featured.length
    ? featured
    : [...photos].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 12)
}

// A CMS from before the portfolio has no photo collections yet: the site builds without photos
const unlessMissing = (request, fallback) =>
  request.catch((error) => {
    if (error.status === 404) return fallback
    throw error
  })

/**
 * All published albums (in their order in the CMS) and their published photos (in their order).
 * Photos whose album isn't published are left out. During `next build` every page shares the two
 * requests (lib/payload/api.js).
 */
export async function loadPortfolio() {
  const [albumDocs, photoDocs] = await Promise.all([
    unlessMissing(
      findDocs('personal-photo-albums', {
        depth: '1',
        pagination: 'false',
        sort: '_order',
        ...select(ALBUM_FIELDS),
      }),
      []
    ),
    unlessMissing(
      findDocs('personal-photos', {
        depth: '0',
        pagination: 'false',
        sort: '_order',
        ...select(PHOTO_FIELDS),
      }),
      []
    ),
  ])

  const albums = albumDocs.map((doc) => ({ ...doc, path: `/${PHOTOS}/${doc.slug}`, photos: [] }))
  const albumById = new Map(albums.map((album) => [album.id, album]))

  for (const doc of photoDocs) {
    const album = albumById.get(doc.album)
    const photo = album && toPhoto(doc, album)
    if (photo) album.photos.push({ ...photo, album: { title: album.title, path: album.path } })
  }

  return { albums, photos: albums.flatMap((album) => album.photos) }
}

function toAlbumCard(album) {
  const coverDoc = album.cover && typeof album.cover === 'object' ? album.cover : null
  const cover =
    album.photos.find((photo) => photo.id === coverDoc?.id) ||
    (coverDoc && toPhoto(coverDoc, album)) ||
    album.photos[0]

  return {
    slug: album.slug,
    path: album.path,
    title: album.title,
    description: album.description || '',
    count: album.photos.length,
    cover: cover ? toThumbnail(cover) : null,
  }
}

// Tags by how many photos have them
function countTags(photos) {
  const counts = new Map()
  photos.forEach((photo) =>
    photo.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1))
  )

  return [...counts]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag, count]) => ({ tag, count, path: `/${PHOTOS}/${PHOTO_TAGS}/${tag}` }))
}

// A photo as the image of a page in link previews
const toPreviewImage = (photo) => {
  if (!photo) return []
  const source = photo.sources.find((s) => s.width >= 1200) || photo.sources.at(-1)
  return [{ ...source, alt: photo.alt }]
}

// The image set under SEO in the CMS, if any
const seoImage = (seo) =>
  seo?.image?.url ? [{ src: toAbsoluteUrl(seo.image.url), alt: seo.image.alt || '' }] : null

const seoOf = (seo) => ({
  ...(seo?.title && { title: seo.title }),
  ...(seo?.description && { description: seo.description }),
})

/** The Photos page in the CMS and the portfolio, for every page of it */
async function loadPhotoSite() {
  const [doc, portfolio] = await Promise.all([
    unlessMissing(findGlobal('personal-photos-page'), null),
    loadPortfolio(),
  ])

  const { albums, photos } = portfolio
  const hero = pickHero(shownOnLanding(photos))
  const infoPhoto = pickInfoPhoto(photos, hero)

  // What every page of the portfolio shows around its photos: the title and the galleries above
  // them, Info (the Photos page's introduction) and Contact below them
  const photoSite = {
    title: doc?.title || 'Photos',
    subtitle: doc?.subtitle || null,
    albums: albums
      .filter((album) => album.photos.length)
      .map(({ title, path }) => ({ title, path })),
    info: {
      intro: doc ? await prepareRichText(doc.intro, { anchors: false }) : null,
      photo: infoPhoto ? toThumbnail(infoPhoto) : null,
    },
  }

  return { doc, ...portfolio, hero, photoSite }
}

/** /photos */
async function landingPage() {
  const { doc, albums, photos, hero, photoSite } = await loadPhotoSite()

  const featured = photos.filter((photo) => photo.featured)
  const shown = shownOnLanding(photos)
  const shownAlbums = albums.filter((album) => album.photos.length)
  const intro = toPlainText(doc?.intro).slice(0, 300)

  return {
    slug: [PHOTOS],
    content: null,
    meta: {
      layout: 'Photos',
      title: doc?.title || 'Photos',
      description: intro || `Photos: ${shownAlbums.map((album) => album.title).join(', ')}.`,
      images: seoImage(doc?.seo) || toPreviewImage(hero),
      seo: seoOf(doc?.seo),
    },
    photoSite,
    hero: hero ? toBanner(hero) : null,
    albums: {
      title: doc?.albumsTitle || 'Albums',
      list: shownAlbums.map(toAlbumCard),
    },
    featured: {
      title: featured.length ? doc?.featuredTitle || 'Featured' : 'Latest photos',
      photos: shown.map(toThumbnail),
    },
    photoTags: countTags(photos).slice(0, 40),
  }
}

/** /photos/<album> */
async function albumPage(albumSlug) {
  const { albums, photoSite } = await loadPhotoSite()
  const album = albums.find(({ slug }) => slug === albumSlug)
  if (!album) return

  const shownAlbums = photoSite.albums
  const index = shownAlbums.findIndex(({ path }) => path === album.path)

  const card = toAlbumCard(album)
  const coverPhoto = album.photos.find((photo) => photo.slug === card.cover?.slug)
  // Across the top of the page: the cover chosen in the CMS, or else the first landscape photo,
  // since a portrait one would be cropped to a strip
  const banner = (album.cover && coverPhoto) || album.photos.find(isLandscape) || album.photos[0]

  return {
    slug: [PHOTOS, album.slug],
    content: null,
    meta: {
      layout: 'PhotoAlbum',
      title: album.title,
      description: album.description || `${album.photos.length} photos: ${album.title}.`,
      images: seoImage(album.seo) || toPreviewImage(banner),
      seo: seoOf(album.seo),
    },
    photoSite,
    album: {
      title: album.title,
      description: album.description || '',
      path: album.path,
      updatedAt: album.updatedAt,
      cover: banner ? toBanner(banner) : null,
    },
    photos: album.photos.map(toThumbnail),
    photoTags: countTags(album.photos),
    // The galleries before and after this one, in their order
    previousAlbum: (index > 0 && shownAlbums[index - 1]) || null,
    nextAlbum: (index !== -1 && shownAlbums[index + 1]) || null,
  }
}

/** /photos/<album>/<photo>, or a redirect when the photo moved to another album */
async function photoPage(albumSlug, photoSlug) {
  const { albums, photos, hero, photoSite } = await loadPhotoSite()
  const photo = photos.find(({ slug }) => slug === photoSlug)
  if (!photo) return

  const album = albums.find(({ path }) => path === photo.album.path)
  if (album.slug !== albumSlug) return { redirect: photo.path }

  // Info beside another photo than this one
  const infoPhoto =
    photoSite.info.photo?.slug === photo.slug
      ? pickInfoPhoto(
          photos.filter((other) => other.slug !== photo.slug),
          hero
        )
      : null

  const index = album.photos.indexOf(photo)
  const neighbor = (other) => other && { path: other.path, title: other.title }

  return {
    slug: [PHOTOS, album.slug, photo.slug],
    content: null,
    meta: {
      layout: 'Photo',
      title: photo.title,
      description: photo.description || photo.alt || `${photo.title}, from ${album.title}.`,
      images: toPreviewImage(photo),
    },
    photoSite: infoPhoto
      ? { ...photoSite, info: { ...photoSite.info, photo: toThumbnail(infoPhoto) } }
      : photoSite,
    photo,
    previous: neighbor(album.photos[index - 1]) || null,
    next: neighbor(album.photos[index + 1]) || null,
  }
}

/** /photos/tags/<tag> */
async function tagPage(tag) {
  const { photos, photoSite } = await loadPhotoSite()
  const tagged = photos.filter((photo) => photo.tags.includes(tag))
  if (!tagged.length) return

  const title = tag.replace(/-/g, ' ')

  return {
    slug: [PHOTOS, PHOTO_TAGS, tag],
    content: null,
    meta: {
      layout: 'PhotoTag',
      title: `Photos: ${title}`,
      description: `${tagged.length} ${tagged.length === 1 ? 'photo' : 'photos'} tagged ${title}.`,
      images: toPreviewImage(tagged[0]),
    },
    photoSite,
    tag: { name: title, path: `/${PHOTOS}/${PHOTO_TAGS}/${tag}` },
    photos: tagged.map(toThumbnail),
  }
}

/**
 * The page of the photo portfolio at `slug` in the shape of lib/mdx.js getPageBySlug(), a
 * `{ redirect }` to a photo's new address, or undefined when there is none
 */
export async function getPhotoPage(slug) {
  if (!isCmsEnabled || slug[0] !== PHOTOS) return

  const [, first, second] = slug
  let page

  if (slug.length === 1) page = await landingPage()
  else if (first === PHOTO_TAGS) page = slug.length === 3 ? await tagPage(second) : undefined
  else if (slug.length === 2) page = await albumPage(first)
  else if (slug.length === 3) page = await photoPage(first, second)

  // Page props must be plain JSON, without `undefined`
  return page && JSON.parse(JSON.stringify(page))
}

/** The paths of the portfolio, e.g. ['photos', 'japan', 'shibuya-crossing'] */
export async function getPhotoPaths() {
  if (!isCmsEnabled) return []

  const { albums, photos } = await loadPortfolio()
  if (!photos.length) return []

  return [
    [PHOTOS],
    ...albums.filter((album) => album.photos.length).map((album) => [PHOTOS, album.slug]),
    ...photos.map((photo) => photo.path.split('/').filter(Boolean)),
    ...countTags(photos).map(({ tag }) => [PHOTOS, PHOTO_TAGS, tag]),
  ]
}

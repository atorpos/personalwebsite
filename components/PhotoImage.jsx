import React from 'react'

/**
 * A photo from Payload CMS. The CMS already made it in several sizes (in S3 when it's on), so the
 * browser picks one from `srcSet` and loads it from there, without the Next.js image optimizer.
 * `width` and `height` keep the space for it while it loads.
 */
const PhotoImage = ({ photo, sizes, priority = false, className }) => {
  const { sources = [], alt, width, height } = photo
  if (!sources.length) return null

  const fallback = sources.find((source) => source.width >= 960) || sources[sources.length - 1]

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={fallback.src}
      srcSet={sources.map((source) => `${source.src} ${source.width}w`).join(', ')}
      sizes={sizes}
      width={width || fallback.width}
      height={height || fallback.height}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchpriority={priority ? 'high' : undefined}
      className={className}
    />
  )
}

export default PhotoImage

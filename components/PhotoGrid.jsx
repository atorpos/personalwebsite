import React, { useState } from 'react'
import classNames from 'clsx'
import Link from 'next/link'
import PhotoImage from '@/components/PhotoImage'

const sizes = '(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw'

// Buttons that show only the photos with one tag
const TagFilter = ({ tags, active, onChange }) => (
  <div
    className="mb-10 flex flex-wrap justify-center gap-x-7 gap-y-3"
    role="group"
    aria-label="Show photos by tag"
  >
    {[{ tag: null, label: 'All' }, ...tags.map(({ tag }) => ({ tag, label: tag }))].map(
      ({ tag, label }) => (
        <button
          key={label}
          type="button"
          aria-pressed={active === tag}
          onClick={() => onChange(tag)}
          className={classNames(
            'select-none border-b pb-1 text-xs uppercase tracking-[0.25em] transition-colors',
            active === tag
              ? 'border-omega-100 text-white'
              : 'border-transparent text-omega-400 hover:text-white'
          )}
        >
          {label.replace(/-/g, ' ')}
        </button>
      )
    )}
  </div>
)

/**
 * Photos in columns (a masonry grid), each linking to its page. With `filterTags`, buttons above
 * show only the photos with one of them.
 */
const PhotoGrid = ({ photos = [], filterTags, priorityCount = 0 }) => {
  const [activeTag, setActiveTag] = useState(null)
  const shown = activeTag ? photos.filter((photo) => photo.tags?.includes(activeTag)) : photos

  return (
    <>
      {filterTags?.length > 1 && (
        <TagFilter tags={filterTags} active={activeTag} onChange={setActiveTag} />
      )}
      <ul className="m-0 list-none columns-1 gap-6 p-0 sm:columns-2 md:gap-8 xl:columns-3">
        {shown.map((photo, i) => (
          <li key={photo.path} className="m-0 mb-6 break-inside-avoid p-0 md:mb-8">
            <Link
              href={photo.path}
              className="group relative block overflow-hidden bg-omega-800 no-underline"
            >
              <PhotoImage
                photo={photo}
                sizes={sizes}
                priority={i < priorityCount}
                className="m-0 block h-auto w-full transition-transform duration-700 group-hover:scale-105"
              />
              <span
                className={classNames(
                  'pointer-events-none absolute inset-x-0 bottom-0 p-3 text-sm text-white',
                  'bg-gradient-to-t from-black/70 to-transparent',
                  'opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100'
                )}
              >
                {photo.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

export default PhotoGrid

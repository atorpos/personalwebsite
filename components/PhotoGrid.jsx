import React, { useState } from 'react'
import classNames from 'clsx'
import Link from 'next/link'
import PhotoImage from '@/components/PhotoImage'

const sizes = '(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw'

// Buttons that show only the photos with one tag
const TagFilter = ({ tags, active, onChange }) => (
  <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Show photos by tag">
    {[{ tag: null, label: 'All' }, ...tags.map(({ tag }) => ({ tag, label: tag }))].map(
      ({ tag, label }) => (
        <button
          key={label}
          type="button"
          aria-pressed={active === tag}
          onClick={() => onChange(tag)}
          className={classNames(
            'select-none px-3 py-1 font-mono text-sm uppercase transition-colors',
            active === tag ? 'bg-beta text-omega-900' : 'bg-beta/10 text-beta hover:bg-beta/20'
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
      <ul className="m-0 list-none columns-1 gap-4 p-0 sm:columns-2 xl:columns-3">
        {shown.map((photo, i) => (
          <li key={photo.path} className="m-0 mb-4 break-inside-avoid p-0">
            <Link
              href={photo.path}
              className="group relative block overflow-hidden bg-omega-800 no-underline"
            >
              <PhotoImage
                photo={photo}
                sizes={sizes}
                priority={i < priorityCount}
                className="m-0 block h-auto w-full transition-transform duration-500 group-hover:scale-105"
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

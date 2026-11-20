import Link from 'next/link'
import classNames from 'clsx'

const link = 'text-inherit no-underline transition-opacity hover:opacity-60'

/**
 * The top of every page of the photo portfolio: its title, linking to /photos, and Info and Contact,
 * which every page has at its bottom. With `overlay`, it lies over the photo at the top of the page.
 */
export const PhotoSiteHeader = ({ photoSite, overlay = false }) => (
  <header
    className={classNames(
      'z-20 flex w-full items-center justify-between gap-6 px-5 py-5 md:px-10 md:py-7 lg:px-16',
      overlay ? 'absolute inset-x-0 top-0 text-white' : 'relative text-omega-100'
    )}
  >
    <Link href="/photos" className={classNames(link, 'font-serif text-2xl md:text-3xl')}>
      {photoSite.title}
    </Link>
    <nav aria-label="Photos" className="flex gap-6 text-xs uppercase tracking-[0.25em] md:gap-10">
      <a href="#info" className={link}>
        Info
      </a>
      <a href="#contact" className={link}>
        Contact
      </a>
    </nav>
  </header>
)

/**
 * The galleries, each a page of its own, with "All" for /photos. It stays at the top of the screen
 * while scrolling; the one being looked at (`active`, a path) is underlined.
 */
export const GalleryNav = ({ albums, active }) => (
  <nav
    aria-label="Galleries"
    className="sticky top-0 z-30 w-full border-y border-white/10 bg-omega-900/90 backdrop-blur lg:top-4 xl:top-8"
  >
    <ul className="m-0 flex list-none gap-7 overflow-x-auto whitespace-nowrap px-5 py-4 text-xs uppercase tracking-[0.25em] md:justify-center md:gap-10 md:px-10">
      {[{ title: 'All', path: '/photos' }, ...albums].map(({ title, path }) => (
        <li key={path} className="m-0 p-0">
          <Link
            href={path}
            aria-current={active === path ? 'page' : undefined}
            className={classNames(
              'block border-b pb-1 no-underline transition-colors',
              active === path
                ? 'border-omega-100 text-white'
                : 'border-transparent text-omega-400 hover:text-white'
            )}
          >
            {title}
          </Link>
        </li>
      ))}
    </ul>
  </nav>
)

import Link from 'next/link'
import classNames from 'clsx'

/** Links to /photos/tags/<tag>, as small uppercase words, with how many photos have it if known */
const PhotoTagLinks = ({ tags, className }) => (
  <ul
    className={classNames(
      'm-0 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 text-xs uppercase tracking-[0.2em]',
      className
    )}
  >
    {tags.map(({ tag, count }) => (
      <li key={tag} className="m-0 p-0">
        <Link
          href={`/photos/tags/${tag}`}
          className="text-omega-400 no-underline transition-colors hover:text-white"
        >
          {tag.replace(/-/g, ' ')}
          {count != null && <span className="ml-1.5 opacity-50">{count}</span>}
        </Link>
      </li>
    ))}
  </ul>
)

export default PhotoTagLinks

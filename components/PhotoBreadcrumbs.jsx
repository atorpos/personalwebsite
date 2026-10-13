import Link from 'next/link'

/** "Photos / Album" above an album, a photo or a tag */
const PhotoBreadcrumbs = ({ items }) => (
  <nav aria-label="Breadcrumb" className="mb-4 font-mono text-sm uppercase text-omega-400 md:mb-6">
    <ol className="m-0 flex list-none flex-wrap gap-2 p-0">
      {items.map(({ title, path }, i) => (
        <li key={path} className="m-0 flex items-center gap-2 p-0">
          {i > 0 && <span aria-hidden="true">/</span>}
          <Link href={path} className="text-omega-400 no-underline hover:text-beta">
            {title}
          </Link>
        </li>
      ))}
    </ol>
  </nav>
)

export default PhotoBreadcrumbs

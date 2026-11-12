import Button from '@/components/Button'
import Link from '@/components/Link'

const isInternalLink = (href) => href && (href.startsWith('/') || href.startsWith('#'))

// Links to other sites (e.g. a TestFlight invitation) are the button itself, opened in a new tab
// like links in Markdown; wrapping it in Link would put an <a> inside another <a>
const MDXButton = (props) =>
  isInternalLink(props.href) ? (
    <Link {...props} passHref legacyBehavior>
      <Button {...props} />
    </Link>
  ) : (
    <Button target="_blank" rel="noopener noreferrer" {...props} />
  )

export default MDXButton

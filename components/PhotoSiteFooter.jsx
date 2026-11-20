import Link from 'next/link'
import PhotoImage from '@/components/PhotoImage'
import RichText from '@/components/RichText'
import { iconFor, socialPlatforms } from '@/components/SiteIcons'
import { getSiteMetaData } from '@/utils/site'
import { social as themeSocial } from '../theme.config'

const eyebrow = 'mb-4 text-xs uppercase tracking-[0.3em] text-omega-400'
const button =
  'inline-block border border-omega-100 px-8 py-3 text-xs uppercase tracking-[0.25em] text-omega-100 no-underline transition-colors hover:bg-omega-100 hover:text-omega-900'

// Social links from Site settings in Payload CMS, or theme.config.js
const socialLinks = (site) =>
  site?.social?.map(({ platform, url }) => ({ url, ...iconFor(socialPlatforms, platform) })) ||
  themeSocial

/**
 * The bottom of every page of the photo portfolio, which the header's Info and Contact link to:
 * Info is the Photos page's introduction from the CMS, beside a photo; Contact the email address
 * and social links of the site, and a button to the contact form.
 */
const PhotoSiteFooter = ({ photoSite, site }) => {
  const { authorName, email } = getSiteMetaData(site)
  const { info } = photoSite

  return (
    <>
      <section
        id="info"
        aria-labelledby="photo-info-title"
        className="grid w-full scroll-mt-16 items-center gap-10 border-t border-white/10 px-5 py-16 text-omega-100 md:grid-cols-2 md:gap-16 md:px-10 md:py-24 lg:scroll-mt-20 lg:px-16"
      >
        {info.photo && (
          <div className="mx-auto w-full max-w-md overflow-hidden md:max-w-none">
            {/* 4:5, with @tailwindcss/aspect-ratio (the theme turns off Tailwind's own aspect-*) */}
            <div className="aspect-w-4 aspect-h-5">
              <PhotoImage
                photo={info.photo}
                sizes="(min-width: 768px) 40vw, 100vw"
                className="m-0 h-full w-full object-cover"
              />
            </div>
          </div>
        )}
        <div className={info.photo ? '' : 'mx-auto max-w-2xl text-center md:col-span-2'}>
          <p className={eyebrow}>Info</p>
          <h2
            id="photo-info-title"
            className="mb-2 font-serif text-4xl font-medium text-white md:text-5xl"
          >
            {authorName}
          </h2>
          {photoSite.subtitle && (
            <p className="mb-8 font-serif text-xl italic text-omega-300 md:text-2xl">
              {photoSite.subtitle}
            </p>
          )}
          <div className="prose prose-invert max-w-none prose-p:text-omega-300">
            {info.intro ? (
              <RichText content={info.intro} />
            ) : (
              <p>
                I photograph landscapes, cities and unforgettable moments as I travel around the
                world.
              </p>
            )}
          </div>
          <Link href="/about" className={`${button} mt-8`}>
            More about me
          </Link>
        </div>
      </section>

      <section
        id="contact"
        aria-labelledby="photo-contact-title"
        className="w-full scroll-mt-16 bg-black/30 px-5 py-16 text-center text-omega-100 md:px-10 md:py-24 lg:scroll-mt-20"
      >
        <p className={eyebrow}>Contact</p>
        <h2
          id="photo-contact-title"
          className="mb-6 font-serif text-4xl font-medium text-white md:text-5xl"
        >
          Get in touch
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-omega-300">
          Questions about a photo, or want to work together? I&apos;d love to hear from you.
        </p>
        {email && (
          <a
            href={`mailto:${email}`}
            className="font-serif text-2xl text-white no-underline transition-opacity hover:opacity-70 md:text-3xl"
          >
            {email}
          </a>
        )}
        <ul className="m-0 mt-8 flex list-none justify-center gap-6 p-0">
          {socialLinks(site)
            .filter(({ url, Icon }) => url && Icon)
            .map(({ url, name, Icon }) => (
              <li key={url} className="m-0 p-0">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={name}
                  aria-label={name}
                  className="text-omega-400 transition-colors hover:text-white"
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </a>
              </li>
            ))}
        </ul>
        <Link href="/contact" className={`${button} mt-10`}>
          Send a message
        </Link>
      </section>

      <footer className="w-full px-5 py-8 text-center text-xs uppercase tracking-[0.25em] text-omega-500">
        © {authorName} · {photoSite.title}
      </footer>
    </>
  )
}

export default PhotoSiteFooter

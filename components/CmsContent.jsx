import React from 'react'
import Button from '@/components/Button'
import Image from '@/components/Image'
import MDXComponents from '@/components/MDX'
import PageTitle from '@/components/MDXPageTitle'
import RichText from '@/components/RichText'
import Sep from '@/components/Sep'
import Typewriter from '@/components/Typewriter'
import { contactIcons, iconFor } from '@/components/SiteIcons'

/**
 * Renders the sections of pages edited in Payload CMS (prepared by lib/payload/pages.js) with the
 * same markup that their Markdown in content/ produces, so the layouts look the same with both.
 */

const { a: MDXLink, Button: MDXButton } = MDXComponents

const isInternal = (href) => href.startsWith('/') || href.startsWith('#')

// Plain text from the CMS, one paragraph per block of lines
const Paragraphs = ({ text }) =>
  text
    ? text
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map((paragraph, i) => <p key={i}>{paragraph}</p>)
    : null

// Like <Button href="…"> in Markdown, which puts its text in a paragraph. Files and other sites
// open in a new tab.
const CmsButton = ({ button, size, variant }) => {
  if (!button) return null

  const label = <p>{button.label}</p>

  return isInternal(button.href) ? (
    <MDXButton href={button.href} size={size} variant={variant}>
      {label}
    </MDXButton>
  ) : (
    <Button
      href={button.href}
      size={size}
      variant={variant}
      target="_blank"
      rel="noopener noreferrer"
    >
      {label}
    </Button>
  )
}

// Like the links that Markdown makes of URLs and email addresses (lib/mdx-options.js)
const ContactLink = ({ href, children }) =>
  isInternal(href) ? (
    <MDXLink href={href}>{children}</MDXLink>
  ) : (
    <MDXLink href={href} target="_blank" rel="nofollow">
      {children}
    </MDXLink>
  )

const ContactDetails = ({ details }) => (
  <small>
    {details.map(({ type, label, value, href }, i) => {
      const DetailIcon = iconFor(contactIcons, type)

      return (
        <p key={i}>
          {DetailIcon && (
            <DetailIcon size={28} className="mr-2 inline align-middle text-omega-500" />
          )}{' '}
          {label && `${label}: `}
          {href ? <ContactLink href={href}>{value}</ContactLink> : value}
        </p>
      )
    })}
  </small>
)

const templates = {
  // content/index.md: name, job titles, location and introduction
  homeIntro: ({ name, roles, location, intro }) => (
    <>
      <h1>
        <em>{name}</em>
      </h1>
      {roles.length > 0 && (
        <h2>
          <Typewriter lines={roles} />
        </h2>
      )}
      {location && (
        <h5>
          <span>{location}</span>
        </h5>
      )}
      <Sep size={6} line className="mx-auto max-w-sm" />
      <RichText content={intro} />
    </>
  ),

  // A heading and its text, e.g. above the featured posts or the blog's post list
  titleText: ({ heading: Heading = 'h3', muted, title, text, small }) => (
    <>
      {title && <Heading>{muted ? <span>{title}</span> : title}</Heading>}
      {small ? text && <small>{text}</small> : <Paragraphs text={text} />}
    </>
  ),

  // content/about.md: "01. About me", "02. …"
  numberedSections: ({ sections }) =>
    sections.map(({ title, text }, i) => (
      <React.Fragment key={i}>
        <h5>
          <span>{`${String(i + 1).padStart(2, '0')}.`}</span>
          {` ${title}`}
        </h5>
        <RichText content={text} />
      </React.Fragment>
    )),

  callToAction: ({ title, text, button }) => (
    <>
      {title && <h2>{title}</h2>}
      <Paragraphs text={text} />
      <CmsButton button={button} />
    </>
  ),

  button: ({ button, size, variant }) => (
    <CmsButton button={button} size={size} variant={variant} />
  ),

  // The introductions of content/services.md, contact.md and projects.md
  pageIntro: ({ title, subtitle, intro, text, button, buttonSize, buttonVariant, details }) => (
    <>
      {title && (
        <PageTitle>
          <h3>{title}</h3>
          {subtitle && (
            <h3>
              <em>{subtitle}</em>
            </h3>
          )}
        </PageTitle>
      )}
      <RichText content={intro} />
      <Paragraphs text={text} />
      {(button || details?.length > 0) && <Sep size="12" />}
      <CmsButton button={button} size={buttonSize} variant={buttonVariant} />
      {details?.length > 0 && <ContactDetails details={details} />}
    </>
  ),

  // The text of a service tile in content/services.md
  smallText: ({ text }) => (
    <small>
      <RichText content={text} />
    </small>
  ),

  // A page of this site from the Pages collection
  page: ({ title, heroImage, text }) => (
    <>
      <h1>{title}</h1>
      {heroImage?.width && heroImage?.height && (
        <Image
          src={heroImage.src}
          alt={heroImage.alt}
          width={heroImage.width}
          height={heroImage.height}
          sizes="(min-width: 768px) 768px, 100vw"
          priority
        />
      )}
      <RichText content={text} />
    </>
  ),
}

const CmsContent = ({ template, ...props }) => {
  const Template = Object.prototype.hasOwnProperty.call(templates, template)
    ? templates[template]
    : null

  return Template ? <Template {...props} /> : null
}

export default CmsContent

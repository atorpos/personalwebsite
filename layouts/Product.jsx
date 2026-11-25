import React from 'react'
import Head from 'next/head'
import NextLink from 'next/link'
import {
  FiBell,
  FiCheck,
  FiChevronDown,
  FiCloud,
  FiGlobe,
  FiLock,
  FiMapPin,
  FiShield,
  FiWatch,
} from 'react-icons/fi'
import Button from '@/components/Button'
import ContentRenderer from '@/components/ContentRenderer'
import Image from '@/components/Image'
import JsonLd from '@/components/JsonLd'
import Reveal from '@/components/Reveal'
import { toAbsoluteUrl } from '@/utils/index'
import { getSiteMetaData } from '@/utils/site'

/**
 * A product page for an app, e.g. /lockinminder (content/lockinminder.md): what it does, how it
 * works, privacy, pricing, questions and answers, with the App Store link throughout. Its
 * frontmatter `app` describes the app for search engines (schema.org MobileApplication), `faq`
 * becomes a FAQPage, and `offer` adds a launch offer.
 */

// The `symbol` of a feature (react-icons/fi)
const symbols = {
  bell: FiBell,
  cloud: FiCloud,
  globe: FiGlobe,
  lock: FiLock,
  map: FiMapPin,
  shield: FiShield,
  watch: FiWatch,
}

const Section = ({ id, title, children, className = '' }) => (
  <section
    id={id}
    className={`border-t border-omega-800 px-5 py-16 md:px-10 lg:px-20 ${className}`}
  >
    {title && <h2 className="mb-10 text-white">{title}</h2>}
    {children}
  </section>
)

// Kept apart, so that Button's sibling spacing (peer-even) doesn't apply inside a flex row
const Actions = ({ app, offer, offerLabel }) => (
  <div className="flex flex-wrap items-center gap-6">
    <div>
      <Button href={app.appStoreUrl} size="md">
        Download on the App Store
      </Button>
    </div>
    {offer && (
      <NextLink
        href={offer.href}
        className="font-mono text-sm text-alpha underline-offset-4 hover:underline md:text-base"
      >
        {offerLabel || offer.label} →
      </NextLink>
    )}
  </div>
)

const ProductJsonLd = ({ app, title, description, steps, features, faq, pageUrl, site }) => {
  const { siteUrl, authorName } = getSiteMetaData(site)
  const url = pageUrl.split(/[?#]/)[0]

  const application = {
    '@type': 'MobileApplication',
    '@id': `${url}#app`,
    name: app.name || title,
    description,
    url,
    ...(app.image?.src && { image: toAbsoluteUrl(app.image.src, siteUrl) }),
    screenshot: steps
      .map((step) => step.image?.src && toAbsoluteUrl(step.image.src, siteUrl))
      .filter(Boolean),
    applicationCategory: app.category,
    operatingSystem: app.operatingSystem,
    installUrl: app.appStoreUrl,
    downloadUrl: app.appStoreUrl,
    sameAs: [app.appStoreUrl],
    ...(app.released && { datePublished: app.released }),
    ...(app.languages && { inLanguage: app.languages }),
    featureList: features.map((feature) => feature.title).filter(Boolean),
    author: { '@type': 'Person', '@id': `${siteUrl}/#person`, name: authorName, url: siteUrl },
    // Free to download; Pro is an in-app purchase
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', url: app.appStoreUrl },
  }

  const questions = faq.length > 0 && {
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    mainEntity: faq.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  }

  const breadcrumbs = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: app.name || title, item: url },
    ],
  }

  return (
    <JsonLd
      id="product"
      data={{
        '@context': 'https://schema.org',
        '@graph': [application, questions, breadcrumbs].filter(Boolean),
      }}
    />
  )
}

const Layout = ({
  title,
  description,
  seo = {},
  app = {},
  offer,
  hero = {},
  featuresTitle = 'What it does',
  features = [],
  stepsTitle = 'How it works',
  steps = [],
  privacy,
  pricing,
  faqTitle = 'Questions and answers',
  faq = [],
  download,
  pageUrl,
  site,
}) => (
  <>
    <Head>
      {/* Safari on iPhone and iPad shows a banner to open or get the app (Smart App Banner) */}
      {app.appStoreId && (
        <meta name="apple-itunes-app" content={`app-id=${app.appStoreId}`} key="apple-itunes-app" />
      )}
    </Head>
    <ProductJsonLd
      app={app}
      title={title}
      description={seo.description || description}
      steps={steps}
      features={features}
      faq={faq}
      pageUrl={pageUrl}
      site={site}
    />

    <div className="w-full">
      {/* Hero */}
      <section className="grid items-center gap-10 px-5 pt-10 pb-16 md:px-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:px-20 lg:pt-16">
        <div>
          {hero.eyebrow && (
            <p className="mb-4 font-mono text-sm uppercase tracking-widest text-alpha">
              {hero.eyebrow}
            </p>
          )}
          <div className="prose prose-invert max-w-2xl prose-h1:mb-6 prose-p:text-omega-300 [&_p:first-of-type]:text-xl [&_p:first-of-type]:text-omega-100 md:[&_p:first-of-type]:text-2xl">
            <ContentRenderer source={hero} />
          </div>
          <div className="mt-8">
            <Actions app={app} offer={offer} />
          </div>
          {app.note && <p className="mt-6 text-sm text-omega-400 md:text-base">{app.note}</p>}
        </div>
        {app.image?.src && (
          <div className="order-first mx-auto w-40 md:w-56 lg:order-none lg:w-full lg:max-w-sm">
            <Image
              src={app.image.src}
              width={app.image.width}
              height={app.image.height}
              alt={app.image.alt || ''}
              animation="fade-in zoom-out"
              className="h-auto w-full drop-shadow-[0_24px_48px_rgba(59,130,246,0.3)]"
              sizes="(min-width: 1024px) 384px, 224px"
              priority
            />
          </div>
        )}
      </section>

      {/* Launch offer */}
      {offer && (
        <section className="mx-5 mb-16 flex flex-col gap-6 bg-gradient-to-r from-alpha-100 via-alpha to-beta p-6 text-omega-900 md:mx-10 md:flex-row md:items-center md:justify-between md:p-8 lg:mx-20">
          <div>
            <p className="m-0 text-xl font-bold md:text-2xl">{offer.title}</p>
            {offer.text && <p className="m-0 mt-1 text-omega-800">{offer.text}</p>}
          </div>
          <NextLink
            href={offer.href}
            className="inline-flex shrink-0 items-center justify-center bg-omega-900 px-6 py-3 font-mono text-white no-underline hover:bg-black"
          >
            {offer.label}
          </NextLink>
        </section>
      )}

      {/* Features */}
      {features.length > 0 && (
        <Section id="features" title={featuresTitle}>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => {
              const Symbol = symbols[feature.symbol] || FiCheck

              return (
                <Reveal
                  key={feature.title || i}
                  animation="fade-in slide-in-bottom"
                  delay={(i % 3) * 100}
                  className="border border-omega-700 bg-omega-800/40 p-6"
                >
                  <Symbol className="mb-4 h-8 w-8 text-alpha" aria-hidden="true" />
                  <h3 className="m-0 mb-2 text-xl text-white lg:text-xl">{feature.title}</h3>
                  <div className="prose prose-invert prose-p:my-0 prose-p:text-base prose-p:text-omega-300 prose-strong:text-omega-100">
                    <ContentRenderer source={feature} />
                  </div>
                </Reveal>
              )
            })}
          </div>
        </Section>
      )}

      {/* How it works */}
      {steps.length > 0 && (
        <Section id="how-it-works" title={stepsTitle}>
          <ol className="m-0 list-none space-y-16 p-0">
            {steps.map((step, i) => (
              <li key={step.title || i} className="m-0 p-0">
                <div className="grid items-start gap-2 md:grid-cols-[5rem_minmax(0,1fr)] md:gap-6">
                  <span className="font-mono text-4xl text-alpha md:text-5xl" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="m-0 mb-3 text-2xl text-white lg:text-3xl">{step.title}</h3>
                    <div className="prose prose-invert max-w-3xl prose-p:text-omega-300 prose-strong:text-omega-100">
                      <ContentRenderer source={step} />
                    </div>
                  </div>
                </div>
                {step.image?.src && (
                  <figure className="m-0 mt-8 overflow-hidden rounded-2xl bg-[#f1f2f4] p-2 md:p-4">
                    <Image
                      src={step.image.src}
                      width={step.image.width}
                      height={step.image.height}
                      alt={step.image.alt || ''}
                      className="h-auto w-full"
                      sizes="(min-width: 1280px) 1100px, 100vw"
                    />
                  </figure>
                )}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Privacy */}
      {privacy && (
        <Section id="privacy" title={privacy.title}>
          <div className="prose prose-invert max-w-3xl prose-p:text-omega-300 prose-strong:text-white prose-li:text-omega-300">
            <ContentRenderer source={privacy} />
          </div>
          {privacy.image?.src && (
            <figure className="m-0 mt-10 overflow-hidden rounded-2xl bg-[#f1f2f4] p-4 md:p-6">
              <Image
                src={privacy.image.src}
                width={privacy.image.width}
                height={privacy.image.height}
                alt={privacy.image.alt || ''}
                className="h-auto w-full"
                sizes="(min-width: 1280px) 1100px, 100vw"
              />
            </figure>
          )}
        </Section>
      )}

      {/* Free and Pro */}
      {pricing && (
        <Section id="pricing" title={pricing.title}>
          <div className="prose prose-invert max-w-4xl prose-p:text-omega-300 prose-strong:text-white prose-table:my-8 [&_table]:block [&_table]:overflow-x-auto md:[&_table]:table">
            <ContentRenderer source={pricing} />
          </div>
        </Section>
      )}

      {/* Questions and answers */}
      {faq.length > 0 && (
        <Section id="faq" title={faqTitle}>
          <div className="max-w-4xl divide-y divide-omega-700 border-y border-omega-700">
            {faq.map(({ question, answer }) => (
              <details key={question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-bold text-white hover:text-alpha md:text-xl [&::-webkit-details-marker]:hidden">
                  {question}
                  <FiChevronDown
                    className="h-6 w-6 shrink-0 transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-3 mb-0 max-w-3xl text-omega-300">{answer}</p>
              </details>
            ))}
          </div>
        </Section>
      )}

      {/* Download */}
      {download && (
        <Section id="download" className="text-center">
          <div className="prose prose-invert mx-auto max-w-2xl prose-p:text-omega-300">
            <ContentRenderer source={download} />
          </div>
          <div className="mt-10 flex justify-center">
            <Actions app={app} offer={offer} offerLabel={offer?.label} />
          </div>
        </Section>
      )}
    </div>
  </>
)

export default Layout

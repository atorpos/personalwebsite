import Head from 'next/head'

/** Structured data for search engines (https://schema.org), e.g. an ImageObject for a photo */
const JsonLd = ({ id, data }) => (
  <Head>
    <script
      key={`jsonld-${id}`}
      type="application/ld+json"
      // `<` can't end the script early, whatever the CMS texts contain
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  </Head>
)

export default JsonLd

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

// Images uploaded to Payload CMS are served by the CMS, or by S3/CloudFront when it stores them there
const cmsImageHosts = [process.env.PAYLOAD_URL, process.env.PAYLOAD_MEDIA_URL]
  .filter(Boolean)
  .map((origin) => {
    const { protocol, hostname, port } = new URL(origin)
    return { protocol: protocol.replace(':', ''), hostname, port }
  })

// Google Analytics needs a GA4 measurement ID (lib/analytics.js)
const gaId = (process.env.NEXT_PUBLIC_GA_ID || '').trim()
if (gaId && !/^G-[A-Z0-9]+$/i.test(gaId)) {
  console.warn(
    `NEXT_PUBLIC_GA_ID "${gaId}" isn't a Google Analytics 4 measurement ID (G-…): analytics is off.`
  )
}

module.exports = withBundleAnalyzer({
  images: {
    deviceSizes: [428, 540, 640, 768, 1024, 1120],
    remotePatterns: cmsImageHosts,
  },
  eslint: {
    dirs: ['pages', 'components', 'lib', 'layouts', 'utils'],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })
    return config
  },
})

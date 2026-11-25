/** *************************************************************
 * /lockinminder/redeem: the one link to share for a free       *
 * LockinMinder Pro launch code. Opening it gives nothing away; *
 * the button does (pages/api/lockinminder/redeem.js), so link  *
 * previews and email scanners don't use up codes.              *
 ****************************************************************/

import React from 'react'
import QRCode from 'qrcode'
import NextImage from 'next/image'
import Link from 'next/link'
import Button from '@/components/Button'
import Layout from '@/components/Layout'
import Seo from '@/components/Seo'
import { getSiteSettings } from '@/lib/payload'
import { APP_STORE_URL, LAUNCH_CODES, OFFER_CODE_APP, REDEEM_PATH } from '@/lib/lockinminder'
import {
  getOfferCodeAvailability,
  isOfferCodesEnabled,
  readOfferCodeCookie,
} from '@/lib/offer-codes'
import { getSiteMetaData } from '@/utils/site'
import appIcon from '../../public/lockinminder/app-icon.png'

// What pages/api/lockinminder/redeem.js reports back in ?status=
const STATUSES = ['sold-out', 'limit', 'unavailable', 'error']

export async function getServerSideProps({ req, res, query }) {
  // The page depends on the visitor's code and on how many codes are left
  res.setHeader('Cache-Control', 'private, no-store, max-age=0')

  const known = readOfferCodeCookie(req, OFFER_CODE_APP)
  const [availability, site] = await Promise.all([
    known ? null : getOfferCodeAvailability(OFFER_CODE_APP),
    getSiteSettings().catch(() => null),
  ])
  const pageUrl = getSiteMetaData(site).siteUrl + REDEEM_PATH

  // On a computer: a QR code that opens this page (or the visitor's code) on an iPhone
  const qr = await QRCode.toString(known ? known.url : pageUrl, {
    type: 'svg',
    margin: 1,
    errorCorrectionLevel: 'M',
  })

  return {
    props: {
      code: known?.code || null,
      url: known?.url || null,
      status: !known && STATUSES.includes(query.status) ? query.status : null,
      availability,
      enabled: isOfferCodesEnabled,
      pageUrl,
      qr,
      site,
    },
  }
}

const QrCode = ({ svg, children }) => (
  <div className="mt-10 hidden items-center gap-6 border-t border-omega-700 pt-8 md:flex">
    <div
      className="w-36 shrink-0 bg-white p-2 [&>svg]:h-auto [&>svg]:w-full"
      // Made by the qrcode package on the server, from our own URL
      dangerouslySetInnerHTML={{ __html: svg }}
    />
    <p className="m-0 text-omega-300">{children}</p>
  </div>
)

const CopyButton = ({ text }) => {
  const [copied, setCopied] = React.useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // The code stays selectable on the page
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 border border-omega-600 px-3 py-2 font-mono text-sm text-omega-200 hover:border-alpha hover:text-alpha"
    >
      <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  )
}

const YourCode = ({ code, url, qr }) => (
  <>
    <h1 className="mb-4 text-white">
      Your <em>Pro</em> code
    </h1>
    <p className="text-omega-300">
      It works once, on one Apple Account. Redeem it on your iPhone: the App Store installs
      LockinMinder and unlocks Pro.
    </p>

    <div className="my-8 flex items-center gap-4 border border-omega-700 bg-omega-900/60 p-4">
      <code className="min-w-0 flex-1 break-all font-mono text-lg tracking-wider text-alpha sm:text-xl md:text-2xl md:tracking-widest">
        {code}
      </code>
      <CopyButton text={code} />
    </div>

    <Button href={url} size="md">
      Redeem in the App Store
    </Button>

    <h2 className="mt-12 mb-3 text-lg text-white md:text-xl">If the App Store doesn&apos;t open</h2>
    <ol className="m-0 list-decimal space-y-1 pl-5 text-omega-300">
      <li>Open the App Store on your iPhone.</li>
      <li>Tap your profile picture at the top right.</li>
      <li>
        Tap <strong className="text-omega-100">Redeem Gift Card or Code</strong>, then{' '}
        <strong className="text-omega-100">Enter Code Manually</strong>, and type the code above.
      </li>
    </ol>

    <QrCode svg={qr}>
      On a computer? Scan this with your iPhone&apos;s camera to redeem the code there.
    </QrCode>
  </>
)

const messages = {
  limit: 'This network has already received the most codes for today. Please try again tomorrow.',
  error: 'Something went wrong while getting your code. Please try again in a moment.',
}

const GetCode = ({ status, availability, qr }) => {
  const total = availability?.total || LAUNCH_CODES

  return (
    <>
      <p className="mb-3 font-mono text-sm uppercase tracking-widest text-alpha">Launch offer</p>
      <h1 className="mb-4 text-white">
        Get LockinMinder <em>Pro</em> free
      </h1>
      <p className="text-omega-300">
        LockinMinder is now on the App Store. To celebrate, the first {total} people get Pro for
        free: unlimited locks, and the live distance and direction back to your padlock on the Lock
        Screen.
      </p>

      {messages[status] && (
        <p role="alert" className="my-6 border-l-4 border-alpha bg-omega-800 p-4 text-omega-100">
          {messages[status]}
        </p>
      )}

      <form method="post" action="/api/lockinminder/redeem" className="mt-8">
        <Button as="button" type="submit" size="md">
          Get my free code
        </Button>
      </form>

      <p className="mt-6 text-sm text-omega-400 md:text-base">
        One tap gives you a one-time code and opens the App Store with it. One code per person.
        {availability && ` ${availability.available} of ${availability.total} codes left.`}
      </p>

      <QrCode svg={qr}>
        On a computer? Scan this with your iPhone&apos;s camera to open this page there, and get
        your code with one tap.
      </QrCode>
    </>
  )
}

const NoCodes = ({ soldOut, availability }) => (
  <>
    <h1 className="mb-4 text-white">
      {soldOut ? 'All launch codes are taken' : 'Free codes aren’t available right now'}
    </h1>
    <p className="text-omega-300">
      {soldOut
        ? `Thank you! All ${availability?.total || LAUNCH_CODES} free Pro codes have been claimed. `
        : 'Please check back later. '}
      LockinMinder is free to download with up to three locks, and Pro is a one-time purchase in the
      app.
    </p>
    <div className="mt-8">
      <Button href={APP_STORE_URL} size="md">
        Download on the App Store
      </Button>
    </div>
  </>
)

export default function Redeem({ code, url, status, availability, enabled, qr, site }) {
  const soldOut = status === 'sold-out' || availability?.available === 0
  const unavailable = !enabled || status === 'unavailable'

  return (
    <>
      <Seo
        title="Get LockinMinder Pro free"
        description="Launch offer: a free LockinMinder Pro code for the first people to download the app that keeps your lock combinations on Apple Watch and iPhone."
        images={[
          {
            src: '/lockinminder/og-image.jpg',
            width: 1200,
            height: 630,
            alt: 'LockinMinder, now on the App Store',
          },
        ]}
        // A personal page: kept out of search results, like the sitemap (next-sitemap.config.js)
        seo={{ noindex: true }}
        site={site}
      />
      <div className="w-full px-5 py-12 md:px-10 lg:px-20 lg:py-20">
        <div className="mx-auto grid max-w-5xl items-start gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="max-w-2xl">
            {code ? (
              <YourCode code={code} url={url} qr={qr} />
            ) : soldOut || unavailable ? (
              <NoCodes soldOut={soldOut} availability={availability} />
            ) : (
              <GetCode status={status} availability={availability} qr={qr} />
            )}

            <p className="mt-12 text-sm text-omega-400 md:text-base">
              LockinMinder needs iOS 18 or later; the Apple Watch app needs watchOS 27.{' '}
              <Link href="/lockinminder" className="text-omega-200 underline hover:text-alpha">
                What is LockinMinder?
              </Link>
            </p>
          </div>

          <div className="order-first mx-auto w-32 lg:order-none lg:w-full lg:max-w-xs">
            <NextImage
              src={appIcon}
              alt="The LockinMinder app icon: a blue combination padlock"
              className="h-auto w-full drop-shadow-[0_20px_40px_rgba(59,130,246,0.25)]"
              sizes="(min-width: 1024px) 320px, 128px"
              priority
            />
          </div>
        </div>
      </div>
    </>
  )
}

Redeem.getLayout = (page) => <Layout site={page.props.site}>{page}</Layout>

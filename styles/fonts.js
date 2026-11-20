import { Cormorant_Garamond, Inter } from 'next/font/google'

const sans = Inter({
  variable: '--font-sans',
  display: 'swap',
  subsets: ['latin'],
})

// The headings of the photo portfolio (`font-serif`). Not preloaded: only those pages use it.
const serif = Cormorant_Garamond({
  variable: '--font-serif',
  display: 'swap',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  preload: false,
})

const variables = [sans.variable, serif.variable]

export default variables

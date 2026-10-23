# EdgeFolio - Next.js Theme

[EdgeFolio](https://elegantstack.netlify.app/edgefolio-demo) - the fully-functional React Next.js Portfolio and Blog Theme for creative professionals. With its sleek design, powerful features, and lightning-fast performance, EdgeFolio will help you take your online presence to the next level. Whether you're a freelancer, a content creator, or a creative professional, this theme has you covered.

- [Live Demo](https://elegantstack.netlify.app/edgefolio-demo)
- [Documentation](https://elegantstack.netlify.app/edgefolio)

## Content from Payload CMS

The pages, menu, blog posts and projects can be edited in Payload CMS instead of the Markdown files in `content/` and
`theme.config.js`, which stay in use for everything not in the CMS. The photo portfolio at `/photos` (albums, photos
with AI-written descriptions and tags) comes only from the CMS. Setup and usage: [docs/payload-cms.md](docs/payload-cms.md).

## Google Analytics

1. In [Google Analytics](https://analytics.google.com), create a GA4 property with a **Web** data stream for your domain
   (Admin → Data streams). Copy the stream's **Measurement ID**, which starts with `G-`.
2. In the same stream, open **Enhanced measurement → Page views → Show advanced settings** and turn off **Page changes
   based on browser history events**. The site reports every page itself; with this on, each page would count twice.
3. Set `NEXT_PUBLIC_GA_ID=G-…` and build the site again: the ID is added to the pages when they are built.
   - **Docker**: in `.env`, then rebuild the image (`docker build`) and restart the container.
   - **Vercel**: Project → Settings → Environment Variables, then redeploy.

Visitors see a banner asking whether the site may use Google Analytics cookies. Google's script only loads, and its
cookies are only set, after they accept. The choice is remembered, and the cookie button in the menu lets visitors
change it; declining afterwards deletes the cookies. Advertising features stay off (Google's consent mode).

Without `NEXT_PUBLIC_GA_ID` there is no banner and nothing is sent. `npm run dev` never sends anything.

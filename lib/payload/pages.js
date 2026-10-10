/** *************************************************************
 * The pages edited in Payload CMS, in the same shape as the    *
 * Markdown files in content/ (frontmatter as `meta`, sections  *
 * by name), so the layouts render both the same way. Section   *
 * content becomes { template, ...fields }, which               *
 * components/CmsContent.jsx renders like the Markdown would.   *
 ****************************************************************/

import { findDocs, findGlobal, isCmsEnabled, toFileUrl, toIcon, toImage } from './api'
import { prepareRichText } from './rich-text'

// The value of "Personal website" in the Sites field of pages in the CMS (src/sites.ts there)
export const SITE = 'personal'

/** The pages of this site that are edited as globals in the CMS, by path */
export const PAGE_GLOBALS = new Map([
  ['', 'personal-home'],
  ['about', 'personal-about'],
  ['services', 'personal-services'],
  ['projects', 'personal-projects-page'],
  ['blog', 'personal-blog-page'],
  ['contact', 'personal-contact'],
])

const template = (name, props) => ({ template: name, ...props })

// Headings of pages don't get anchor links, like the headings of Markdown pages
const pageText = (content) => prepareRichText(content, { anchors: false })

function toButton(button) {
  const href = toFileUrl(button?.file) || button?.link
  return button?.label && href ? { label: button.label, href } : null
}

function toMeta(layout, { seo }) {
  const image = toImage(seo?.image)

  return {
    layout,
    seo: {
      ...(seo?.title && { title: seo.title }),
      ...(seo?.description && { description: seo.description }),
    },
    ...(image && { images: [image] }),
  }
}

const mapAll = (items, map) => Promise.all((items || []).map(map))

/** content/index.md */
async function homePage(doc) {
  const photo = toImage(doc.photo)
  const { featuredPosts = {}, expertise = {} } = doc

  return {
    content: null,
    meta: toMeta('Home', doc),
    main: {
      // The Home layout shows the second image (other home layouts show the first on wide screens)
      ...(photo && { images: [photo, photo] }),
      content: template('homeIntro', {
        name: doc.name,
        roles: doc.roles || [],
        location: doc.location || null,
        intro: await pageText(doc.intro),
      }),
    },
    articles: {
      collection: {
        path: '/blog',
        recordsPerPage: featuredPosts.limit || 6,
        limit: featuredPosts.limit || 6,
        sortBy: 'date',
        filterBy: { featured: { $eq: true } },
      },
      content: template('titleText', {
        heading: 'h4',
        muted: true,
        title: featuredPosts.title || null,
        text: featuredPosts.text || null,
      }),
    },
    achievements: (doc.achievements || []).map(({ number, text }) => ({ number, text })),
    cta: { content: template('button', { button: toButton(doc.button), size: 'sm' }) },
    companies: {
      title: expertise.title || null,
      list: await mapAll(expertise.logos, async ({ name, logo }) => ({
        name,
        icon: await toIcon(logo),
      })),
    },
  }
}

/** content/about.md */
async function aboutPage(doc) {
  const photo = toImage(doc.photo)
  const { cta = {}, specialties = {} } = doc

  return {
    content: null,
    meta: toMeta('About', doc),
    personal_info: {
      name: doc.name,
      images: photo ? [photo] : [],
      content: template('numberedSections', {
        sections: await mapAll(doc.sections, async ({ title, text }) => ({
          title,
          text: await pageText(text),
        })),
      }),
    },
    cta: {
      content: template('callToAction', {
        title: cta.title || null,
        text: cta.text || null,
        button: toButton(cta.button),
      }),
    },
    skills_header:
      specialties.title || specialties.lines?.length
        ? {
            title: specialties.title || null,
            list: specialties.lines?.length ? specialties.lines : null,
          }
        : null,
    skills: doc.skillSets?.length
      ? await mapAll(doc.skillSets, async ({ title, skills }) => ({
          title,
          list: await mapAll(skills, async ({ name, level, icon }) => ({
            title: name,
            level,
            icon: await toIcon(icon),
          })),
        }))
      : null,
    history: doc.history?.length
      ? doc.history.map(({ title, entries }) => ({
          title,
          list: (entries || []).map(({ name, description, period }) => ({
            name,
            description: description || '',
            date: period || '',
          })),
        }))
      : null,
  }
}

/** content/services.md */
async function servicesPage(doc) {
  return {
    content: null,
    meta: toMeta('Services', doc),
    main: {
      content: template('pageIntro', {
        title: doc.title,
        subtitle: doc.subtitle || null,
        intro: await pageText(doc.intro),
        button: toButton(doc.button),
        buttonSize: 'sm',
        buttonVariant: 'white',
      }),
    },
    services: await mapAll(doc.services, async ({ title, icon, text }) => ({
      title,
      icon: await toIcon(icon),
      content: template('smallText', { text: await pageText(text) }),
    })),
  }
}

/** content/projects.md. The projects come from the /projects collection, like the Markdown ones. */
async function projectsPage(doc) {
  const { github = {}, projects = {} } = doc
  const hasGithub = Boolean(github.title || github.text || github.repositories?.length)

  return {
    content: null,
    meta: toMeta('Projects', doc),
    github: hasGithub
      ? {
          repositories: github.repositories || [],
          content: template('pageIntro', {
            title: github.title || null,
            text: github.text || null,
          }),
        }
      : null,
    projects: {
      collection: { path: '/projects', sortBy: 'date' },
      content: template('pageIntro', {
        title: projects.title || null,
        text: projects.text || null,
      }),
    },
  }
}

/** content/blog.md. The posts come from the /blog collection, like the Markdown ones. */
async function blogPage(doc) {
  const { categories = {} } = doc

  return {
    content: template('titleText', { title: doc.title, text: doc.text || null }),
    meta: {
      ...toMeta('Blog', doc),
      collection: { path: '/blog', sortBy: 'date', recordsPerPage: 9, infinitePaging: true },
    },
    categories: {
      collection: { path: '/tags', shallow: true },
      content: template('titleText', {
        title: categories.title || null,
        text: categories.text || null,
        small: true,
      }),
    },
  }
}

// Email addresses and phone numbers link to the mail and phone apps
function contactLink({ type, value, link }) {
  if (link) return link
  if (type === 'email') return `mailto:${value}`
  if (type === 'phone') return `tel:${value.replace(/[^\d+]/g, '')}`
  return null
}

/** content/contact.md. The form's questions stay in content/contact-form.json. */
async function contactPage(doc) {
  return {
    content: null,
    meta: toMeta('Contact', doc),
    main: {
      content: template('pageIntro', {
        title: doc.title,
        subtitle: doc.subtitle || null,
        intro: await pageText(doc.intro),
        details: (doc.details || []).map((detail) => ({
          type: detail.type,
          label: detail.label || null,
          value: detail.value,
          href: contactLink(detail),
        })),
      }),
    },
  }
}

const toPage = {
  'personal-home': homePage,
  'personal-about': aboutPage,
  'personal-services': servicesPage,
  'personal-projects-page': projectsPage,
  'personal-blog-page': blogPage,
  'personal-contact': contactPage,
}

/** The page at `slug` from its global in the CMS, or undefined until that global is saved */
export async function getGlobalPage(slug) {
  const global = PAGE_GLOBALS.get(slug.join('/'))
  if (!global) return

  const doc = await findGlobal(global)
  if (!doc) return

  return { slug, ...(await toPage[global](doc)) }
}

/** A published page of this site from the Pages collection (e.g. /privacy-policy), or undefined */
export async function getPage(slug) {
  if (slug.length !== 1) return

  const [page] = await findDocs('pages', {
    limit: '1',
    where: JSON.stringify({ and: [{ sites: { in: [SITE] } }, { slug: { equals: slug[0] } }] }),
  })

  if (!page) return

  const image = toImage(page.heroImage)

  return {
    slug,
    content: template('page', {
      title: page.title,
      heroImage: image,
      text: await pageText(page.content),
    }),
    meta: {
      ...toMeta('Blank', page),
      title: page.title,
      description: page.description || '',
      ...(image && { images: [image] }),
    },
  }
}

/**
 * The site's name, search engine defaults, menu and social links from Site settings in the CMS, or
 * null until they're saved. Empty fields keep the values of theme.config.js.
 */
export async function getSiteSettings() {
  const doc = isCmsEnabled ? await findGlobal('personal-settings') : null
  if (!doc) return null

  const meta = {
    siteName: doc.siteName,
    authorName: doc.authorName || doc.siteName,
    defaultTitle: doc.defaultTitle,
    ...(doc.titleTemplate && { titleTemplate: doc.titleTemplate }),
    ...(doc.description && { description: doc.description }),
    ...(doc.email && { email: doc.email }),
    ...(doc.twitterHandle && { twitter: { handle: doc.twitterHandle } }),
  }

  return {
    meta,
    menu: doc.menu?.length
      ? doc.menu.map(({ label, link, icon }) => ({ name: label, slug: link, icon }))
      : null,
    social: doc.social?.length ? doc.social.map(({ platform, url }) => ({ platform, url })) : null,
  }
}

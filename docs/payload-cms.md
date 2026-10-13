# Content from Payload CMS

The website's pages, menu, blog posts, projects and photo portfolio can be edited in Payload CMS (the `apps/cms` app in the
[atorpos/payloadcms](https://github.com/atorpos/payloadcms) repo), under **Personal website** in the admin panel.

The Markdown files stay: whatever isn't in the CMS yet still comes from `content/` and `theme.config.js`, so pages can
move to the CMS one at a time, and without `PAYLOAD_URL` the site builds exactly as before.

```
 Payload CMS (EC2)                                   This website (Next.js)
 ┌──────────────────────┐   GET /api/...             ┌────────────────────────────────────┐
 │ Personal website:    │ ─────────────────────────► │ renders every page with its layout │
 │ pages, settings,     │   (published content only) │ from layouts/; re-renders pages    │
 │ posts, projects      │                            │ in the background every 60 s       │
 │                      │                            │                                    │
 │ on save/publish/     │   POST /api/revalidate     │ re-renders the affected pages      │
 │ unpublish/delete     │ ─────────────────────────► │ right away (optional, step 4)      │
 └──────────────────────┘                            └────────────────────────────────────┘
```

## What comes from the CMS

| In the admin panel                                   | On the website                                                                                    | Until it's in the CMS          |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------ |
| Site settings                                        | Site name, browser tab titles, default description, X handle, main menu and social links          | `theme.config.js`              |
| Home page                                            | `/`: name, job titles, introduction, button, key figures, featured posts, "Expert In" logos       | `content/index.md`             |
| About page                                           | `/about`: photo, numbered sections, call to action, skills, employment and education              | `content/about.md`             |
| Services page                                        | `/services`: introduction and a tile per service                                                  | `content/services.md`          |
| Projects page                                        | `/projects`: its texts and the GitHub repositories                                                | `content/projects.md`          |
| Projects                                             | The cards on `/projects` and a page per project at `/projects/<slug>`                             | `content/projects/*.md`        |
| Blog page                                            | `/blog`: its texts                                                                                | `content/blog.md`              |
| Posts                                                | `/blog/<slug>`, the blog, tag pages, featured posts on the home page and the RSS feed             | `content/blog/**` (both shown) |
| Contact page                                         | `/contact`: introduction and contact details (the form stays as it is)                            | `content/contact.md`           |
| Photos page                                          | `/photos`: its texts                                                                              | built-in defaults              |
| Photo albums                                         | The albums on `/photos`, each at `/photos/<slug>`                                                 | (CMS only)                     |
| Photos                                               | A page per photo at `/photos/<album>/<slug>`, tag pages at `/photos/tags/<tag>`                   | (CMS only)                     |
| Pages with **Personal website** in their Sites field | `/<slug>`, e.g. `/privacy-policy`. A page with the slug `not-found` replaces the "not found" page | `content/<slug>.md`            |

- A page (Home page, About page, …) comes from the CMS once it has been saved there; before that, the website shows
  its Markdown file. The same goes for Site settings and `theme.config.js`.
- A project or page in the CMS replaces a Markdown file at the same address (e.g. after the import in step 2).
  Posts from the CMS are listed next to the Markdown posts.
- Still in this repo: the contact form's questions (`content/contact-form.json`), the tag pages (`content/tags`), the
  newsletter box, the theme's demo pages (`index-2`, `index-3`, `index-5`), and the design.

| File                                | Role                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| `lib/payload/api.js`                | Reads published content from the CMS; images and SVG icons                      |
| `lib/payload/pages.js`              | Turns the CMS's pages and Site settings into the shape of the Markdown files    |
| `lib/payload/index.js`              | Posts and projects, and which page comes from where                             |
| `lib/payload/photos.js`             | The photo portfolio: albums, photos and tag pages                               |
| `layouts/Photo*.jsx`                | The pages of the portfolio; `components/Photo*.jsx` the photos and grids        |
| `pages/sitemap-photos.xml.js`       | A sitemap of the portfolio with its images, always up to date                   |
| `lib/payload/rich-text.js`          | Prepares rich text: code highlighting, YouTube videos, image addresses          |
| `components/CmsContent.jsx`         | Renders the pages' sections with the same markup as their Markdown              |
| `components/RichText.jsx`           | Renders rich text with the same components as Markdown content                  |
| `components/SiteIcons.jsx`          | The icons that the CMS's menu, social link and contact detail choices stand for |
| `lib/mdx.js`                        | Takes a page from the CMS before its Markdown file; pre-renders the CMS's pages |
| `lib/computed-fields/collection.js` | Adds the CMS's posts and projects to the `/blog` and `/projects` lists          |
| `pages/api/revalidate.js`           | Lets the CMS refresh pages the moment something changes                         |

## Step 1: Deploy the CMS

The content model is in `apps/cms/src/personal` of the payloadcms repo. Merge it into the branch your CMS server
deploys (`op-uat-mongodb`), then on the server:

```bash
cd ~/payloadcms/apps/cms
./deploy/deploy.sh --pull
```

Open `https://cms.example.com/admin`. **Personal website** in the menu lists Posts, Projects, Site settings and the
pages.

## Step 2: Copy the current content into the CMS

Instead of typing everything again, copy the website's current content into the CMS. On the CMS server:

```bash
cd ~/payloadcms/apps/cms
./deploy/import-personal-website.sh https://github.com/atorpos/personalwebsite --dry-run   # preview, nothing is saved
./deploy/import-personal-website.sh https://github.com/atorpos/personalwebsite
```

It reads `theme.config.js`, the pages in `content/` and the projects in `content/projects` of the repo's default
branch (`<url>#<branch>` for another one), uploads their images and icons to Media and saves everything; projects
are published. Pages already saved in the CMS and projects that already exist are skipped, so running it again is
safe. The output lists anything to check, e.g. a project logo that isn't an SVG. Blog posts aren't copied: move the
ones you want by hand (see "Posts" below).

## Step 3: Point the website at the CMS

Set these environment variables for the website. They are needed when the site is built and while it runs:

| Variable                     | Value                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `PAYLOAD_URL`                | The CMS's public URL, the same as `SERVER_URL` in the CMS, e.g. `https://cms.example.com`                                             |
| `PAYLOAD_MEDIA_URL`          | Only when the CMS stores uploads in S3: the CMS's `S3_PUBLIC_URL`, or `https://<bucket>.s3.<region>.amazonaws.com` when that is empty |
| `PAYLOAD_REVALIDATE_SECONDS` | Optional. How often pages are re-rendered from the CMS in the background (default `60`)                                               |

- **Vercel**: Project → Settings → Environment Variables, then redeploy.
- **Docker** (`Dockerfile`): put them in `.env` before building the image.

From now on, changes appear on their own: a page that is older than 60 seconds is re-rendered in the background when
someone visits it.

## Step 4: Update the website the moment you save (optional)

Without this step, changes take up to a minute (plus a page visit) to show. With it, the CMS tells the website which
pages to re-render as soon as you save a page or Site settings, or publish, edit, unpublish or delete a post, project,
photo, album or page.

1. Generate a secret: `openssl rand -hex 32`
2. Website: set `REVALIDATE_SECRET=<secret>` and redeploy.
3. CMS server, in `apps/cms/.env`:

   ```bash
   WEBSITE_URL=https://www.altawoz.com
   WEBSITE_REVALIDATE_SECRET=<the same secret>
   ```

   then `./deploy/deploy.sh`.

Save something and run `docker compose logs cms` on the CMS server. It shows `Revalidated website` with the pages it
refreshed, or `Could not revalidate` with the reason. Saving Site settings refreshes every page, which takes a few
seconds.

## Editing

**Pages and Site settings** have no drafts: **Save** puts the change live. The **Versions** tab lists earlier saves;
open one and choose **Restore** to go back.

**Projects, posts, photos, photo albums and pages** have drafts: **Save Draft** keeps changes private, **Publish** makes them public, and
**Unpublish** (in the menu next to the button) takes them off the website.

- **Icons** (skills, services, "Expert In" logos, project logos) are SVG files, shown in the theme's colors, like the
  icons in `public/icons`. Upload them to Media; only SVG files can be chosen.
- **Buttons** have a text and either a link (`/contact`, or a full URL) or a file, e.g. your resume: upload it and
  the button opens it.
- **Job titles** and **Specialized in** lines are typed out one after another; press Enter after each one.
- **Main menu** items have a text, a link and an icon. **Social links** show the icon of their platform.
- **A new page**: Pages → Create New, tick **Personal website** under Sites, publish, and add it to the main menu in
  Site settings if it should be there. Its slug is its address, e.g. `privacy-policy` for `/privacy-policy`.

### Photos

The photo portfolio at `/photos` exists only in the CMS (with `PAYLOAD_URL` unset, `/photos` is "not found"). To fill
it:

1. **Photo albums → Create New**: a title (e.g. "Street", "Japan 2025") and a description, then **Publish**. Albums are
   the catalogs of `/photos`; drag them into order in the list.
2. **Photos → Bulk Upload**: drop in your photos (JPEG, PNG or WebP). Set their album for all of them at once with
   **Edit all** → **Album** → **Apply Changes**, then **Publish** (or **Save Draft** to review them first).
3. With `OPENAI_API_KEY` set in the CMS, each photo's empty title, alt text, description and tags are written by AI
   during the upload. **Generate with AI** in a photo's sidebar writes new ones to review. Without it, the title is
   the file name and you write the rest.
4. Optional: add **Location**, tick **Featured** to show a photo on `/photos`, and drag photos into order.
5. Add `/photos` to the main menu in Site settings (the **Camera** or **Picture** icon fits).

The CMS strips each photo's metadata (such as its GPS location) and stores it with copies at 480, 960, 1600 and
2560 px; the website loads the size that fits the screen straight from there (S3), without the Next.js image
optimizer. Details of the fields: "Photos" in the CMS's `apps/cms/README.md`.

For search engines, every photo has its own page with its title, description and alt text, the camera details,
structured data (`ImageObject` and breadcrumbs) and a link preview image. `/sitemap-photos.xml` lists every album and
photo page with its image; it's made on request, so new photos are in it right away, and `robots.txt` points to it.
Moving a photo to another album changes its address, and the old one redirects to the new one.

### Posts

1. **Posts → Create New**.
2. Fill in **Title** and **Description** (shown on post cards and in search results).
3. Add **Images**: the first one is the cover on post cards; all of them form the gallery at the top of the post.
   Every image needs alt text.
4. Write the **Content**. Besides text, headings, lists, quotes and links, the **+** button (or typing `/`) inserts
   images, **Code** blocks and **YouTube video**s.
5. In the sidebar, add **Tags** (e.g. `react`, `next-js`) and tick **Featured** to list the post on the home page.
   The **Slug** (the URL, `/blog/<slug>`) is generated from the title.
6. **Save Draft** keeps the post private. **Publish** makes it public.

To check that it's public, open `https://cms.example.com/api/posts` in a private browser window: published posts are
listed there, drafts aren't.

`content/blog` still contains the theme's demo posts next to your own. Delete the ones you don't want. To move a
Markdown post into the CMS, create it there with the same text and delete the `.md` file (its URL changes from
`/blog/<folder>/<file>` to `/blog/<slug>`). To show the blog in the menu, add an item with the link `/blog` in Site
settings.

A tag links to its tag page when `content/tags/<tag>.md` exists. For a new tag, copy `content/tags/react.md` to
`content/tags/<tag>.md` and change its title and `filterBy` tag.

## What rich text can contain

The rich text of pages, projects and posts is rendered by `components/RichText.jsx`:

- Paragraphs and headings (in projects and posts with the same anchor links as Markdown headings), text alignment
  and indents
- Bold, italic, underline, strikethrough, inline code, subscript and superscript
- Bulleted, numbered and check lists, quotes and horizontal rules
- Links to web pages (opened in a new tab, like links in Markdown) and to posts, projects and pages of this site
- Images from Media, optimized by `next/image`, with their alt text as caption
- Code blocks, highlighted with the same Prism theme as Markdown code
- YouTube videos

## Working on both locally

```bash
# Terminal 1: the CMS (see apps/cms/README.md, "Local development")
cd payloadcms/apps/cms
pnpm dev                                         # http://localhost:3000/admin
pnpm payload run scripts/import-personal-website.ts ../../../personalwebsite   # optional: copy the content

# Terminal 2: the website, on another port
cd personalwebsite
echo "PAYLOAD_URL=http://localhost:3000" >> .env.local
PORT=3001 npm run dev                            # http://localhost:3001
```

In development every page is rendered on each request, so changes in the CMS show up on reload.

## Troubleshooting

| Symptom                                                              | Cause / fix                                                                                                                                                                |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build fails with `Payload CMS is unreachable` or `request failed`    | `PAYLOAD_URL` is wrong or the CMS is down. The build stops rather than publishing the site without its CMS content; a failed background re-render keeps the previous page. |
| CMS images don't load: `hostname "…" is not configured under images` | `PAYLOAD_URL` / `PAYLOAD_MEDIA_URL` were missing when the site was built. Set them and redeploy.                                                                           |
| A page still shows its Markdown version                              | It hasn't been saved in the CMS yet. Open it in the admin panel and save it once.                                                                                          |
| Something doesn't show up                                            | Check that it is published (e.g. `https://cms.example.com/api/personal-projects` in a private window). Without step 4, wait a minute and reload twice.                     |
| An icon is missing                                                   | Icons must be SVG files. The build log shows `Could not load the icon` when the website can't download one.                                                                |
| A GitHub repository is missing on `/projects`                        | The build log shows `Could not load the GitHub repository` with GitHub's reason, e.g. a typo in owner/name or an invalid `GITHUB_TOKEN`.                                   |
| The CMS logs `Could not revalidate … 401`                            | `REVALIDATE_SECRET` (website) and `WEBSITE_REVALIDATE_SECRET` (CMS) differ.                                                                                                |
| A photo or album isn't on `/photos`                                  | The photo or its album is a draft: publish both. An album without published photos isn't listed.                                                                           |
| Photos don't load (broken images)                                    | The files in S3 aren't public. The CMS stores photos next to Media (`media/photos/`), so the bucket policy for Media covers them unless `S3_PHOTOS_PREFIX` moved them.     |

## Limitations

- The RSS feed (`/feed/blog/feed.xml`) is written when the site is built, and again when the blog page is
  re-rendered on a server with a writable disk (`next start`, Docker). On Vercel, new CMS posts join the feed with
  the next deploy.
- The website shows published content only; drafts can't be previewed on the website yet.

# Blog posts from Payload CMS

Blog posts can be written and published in Payload CMS (the `apps/cms` app in the
[atorpos/payloadcms](https://github.com/atorpos/payloadcms) repo) instead of as Markdown files. The Markdown posts in
`content/blog` keep working: posts from the CMS are added to them, so the blog list, its pages, the tag pages, the
home page's featured posts and the RSS feed show both.

```
 Payload CMS (EC2)                                   This website (Next.js)
 ┌──────────────────────┐   GET /api/posts           ┌────────────────────────────────────┐
 │ Posts: write, save   │ ─────────────────────────► │ builds /blog, /blog/<slug>, tags,  │
 │ drafts, publish      │   (published posts only)   │ home; re-renders pages every 60 s  │
 │                      │                            │                                    │
 │ on publish/edit/     │   POST /api/revalidate     │ re-renders the affected pages      │
 │ unpublish/delete     │ ─────────────────────────► │ right away (optional, step 4)      │
 └──────────────────────┘                            └────────────────────────────────────┘
```

| File                                | Role                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| `lib/payload.js`                    | Reads published posts from the CMS and turns them into the theme's post format  |
| `lib/computed-fields/collection.js` | Adds the CMS posts to the `/blog` collection next to the Markdown posts         |
| `lib/mdx.js`                        | Serves CMS posts at `/blog/<slug>`, pre-renders them, adds them to the RSS feed |
| `components/RichText.jsx`           | Renders a post's rich text with the same components as Markdown content         |
| `pages/api/revalidate.js`           | Lets the CMS refresh pages the moment a post changes                            |

## Step 1: Deploy the CMS with the Posts collection

The `posts` collection is in `apps/cms/src/collections/Posts.ts` of the payloadcms repo. Merge it into the branch
your CMS server deploys (`op-uat-mongodb`), then on the server:

```bash
cd ~/payloadcms/apps/cms
./deploy/deploy.sh --pull
```

Open `https://cms.example.com/admin`. **Posts** now appears next to Media and Users.

## Step 2: Write and publish a post

1. **Posts → Create New**.
2. Fill in **Title** and **Description** (shown on post cards and in search results).
3. Add **Images**: the first one is the cover on post cards; all of them form the gallery at the top of the post.
   Every image needs alt text.
4. Write the **Content**. Besides text, headings, lists, quotes and links, the **+** button (or typing `/`) inserts
   images, **Code** blocks and **YouTube video**s.
5. In the sidebar, add **Tags** (e.g. `react`, `next-js`) and tick **Featured** to list the post on the home page.
   The **Slug** (the URL, `/blog/<slug>`) is generated from the title.
6. **Save Draft** keeps the post private. **Publish** makes it public.

To check that it's public, open `https://cms.example.com/api/posts` in a private browser window: published posts
are listed there, drafts aren't.

## Step 3: Point the website at the CMS

Set these environment variables for the website. They are needed when the site is built and while it runs:

| Variable                     | Value                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `PAYLOAD_URL`                | The CMS's public URL, the same as `SERVER_URL` in the CMS, e.g. `https://cms.example.com`                                             |
| `PAYLOAD_MEDIA_URL`          | Only when the CMS stores uploads in S3: the CMS's `S3_PUBLIC_URL`, or `https://<bucket>.s3.<region>.amazonaws.com` when that is empty |
| `PAYLOAD_REVALIDATE_SECONDS` | Optional. How often pages are re-rendered from the CMS in the background (default `60`)                                               |

- **Vercel**: Project → Settings → Environment Variables, then redeploy.
- **Docker** (`Dockerfile`): put them in `.env` before building the image.

After the deploy, `/blog` lists your post and `/blog/<slug>` shows it. From now on, new and changed posts appear
on their own: a page that is older than 60 seconds is re-rendered in the background when someone visits it.

## Step 4: Update the website the moment you publish (optional)

Without this step, changes take up to a minute (plus a page visit) to show. With it, the CMS tells the website
which pages to re-render as soon as you publish, edit, unpublish or delete a post.

1. Generate a secret: `openssl rand -hex 32`
2. Website: set `REVALIDATE_SECRET=<secret>` and redeploy.
3. CMS server, in `apps/cms/.env`:

   ```bash
   WEBSITE_URL=https://www.altawoz.com
   WEBSITE_REVALIDATE_SECRET=<the same secret>
   ```

   then `./deploy/deploy.sh`.

Publish a post and run `docker compose logs cms` on the CMS server. It shows `Revalidated website` with the pages it
refreshed, or `Could not revalidate` with the reason.

## Step 5: Show the blog in the menu

The **Articles** menu item is commented out in `theme.config.js`. Uncomment it to link to `/blog`:

```js
{
  name: 'Articles',
  slug: '/blog',
  Icon: TfiPencilAlt,
},
```

`content/blog` still contains the theme's demo posts next to your own. Delete the ones you don't want. To move a
Markdown post into the CMS, create it there with the same text and delete the `.md` file (its URL changes from
`/blog/<folder>/<file>` to `/blog/<slug>`).

A tag links to its tag page when `content/tags/<tag>.md` exists. For a new tag, copy `content/tags/react.md` to
`content/tags/<tag>.md` and change its title and `filterBy` tag.

## Working on both locally

```bash
# Terminal 1: the CMS (see apps/cms/README.md, "Local development")
cd payloadcms/apps/cms
pnpm dev                                         # http://localhost:3000/admin

# Terminal 2: the website, on another port
cd personalwebsite
echo "PAYLOAD_URL=http://localhost:3000" >> .env.local
PORT=3001 npm run dev                            # http://localhost:3001/blog
```

In development every page is rendered on each request, so changes in the CMS show up on reload.

## What a post can contain

The rich text is rendered by `components/RichText.jsx`:

- Paragraphs and headings (H2 to H4, with the same anchor links as Markdown headings), text alignment and indents
- Bold, italic, underline, strikethrough, inline code, subscript and superscript
- Bulleted, numbered and check lists, quotes and horizontal rules
- Links to web pages (opened in a new tab, like links in Markdown posts) and to other posts
- Images from Media, optimized by `next/image`, with their alt text as caption
- Code blocks, highlighted with the same Prism theme as Markdown code
- YouTube videos

## Adding more sections later

Other sections can come from the CMS the same way: add a collection (e.g. `projects`) or a global (e.g. the home
page's achievements) in `apps/cms`, read it in `lib/payload.js` and map it to the fields the section's layout
already uses, like `toRecord()` does for posts.

## Troubleshooting

| Symptom                                                              | Cause / fix                                                                                                                                                            |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build fails with `Payload CMS is unreachable` or `request failed`    | `PAYLOAD_URL` is wrong or the CMS is down. The build stops rather than publishing a blog without its CMS posts; a failed background re-render keeps the previous page. |
| CMS images don't load: `hostname "…" is not configured under images` | `PAYLOAD_URL` / `PAYLOAD_MEDIA_URL` were missing when the site was built. Set them and redeploy.                                                                       |
| A post doesn't show up                                               | Check that it is published (`https://cms.example.com/api/posts` in a private window). Without step 4, wait a minute and reload twice.                                  |
| The CMS logs `Could not revalidate … 401`                            | `REVALIDATE_SECRET` (website) and `WEBSITE_REVALIDATE_SECRET` (CMS) differ.                                                                                            |

## Limitations

- The RSS feed (`/feed/blog/feed.xml`) is written when the site is built, and again when the blog page is
  re-rendered on a server with a writable disk (`next start`, Docker). On Vercel, new CMS posts join the feed with
  the next deploy.
- The website shows published posts only; drafts can't be previewed on the website yet.

# Markdown articles — setup & workflow

Your site stays a static site. A small Node build step turns Markdown into
article pages using your existing template. No database. Vercel runs the build
on every push.

## One-time setup (terminal, in ~/portfolio)

Add the new files (listed below) into your repo, then:

```bash
cd ~/portfolio
npm install            # installs marked + gray-matter (dev only)
npm run build          # generates article pages + data + sitemap
git add -A
git commit -m "Add Markdown article build pipeline"
git push
```

On Vercel: the included `vercel.json` sets the build command automatically, so
the push triggers a build and deploy. Nothing to configure in the dashboard.

> If Vercel was serving your raw files before (no build step), the first deploy
> after adding `vercel.json` switches it to running `npm run build`. Your pages
> are unchanged — the build only regenerates the article pages and data file.

## Publishing an article (the whole workflow)

1. Create `articles/posts/my-slug.md`:

   ```markdown
   ---
   title: My article title
   dek: One-line summary shown on cards and in search results.
   date: 2026-06-20
   tags: [DATA, NT]
   featured: false
   ---

   Write your article here in Markdown.

   ## A section
   Use ## and ### for headings — the table of contents builds itself.
   ```

2. Commit and push:

   ```bash
   git add -A && git commit -m "New article: my-slug" && git push
   ```

That's it. Vercel rebuilds. The article page, the homepage teaser, the library
grid, the tag filters, related articles, and the sitemap all update by
themselves. The URL is `/articles/my-slug` (clean, no `.html`).

### Frontmatter fields
- `title`, `dek`, `date` — required
- `tags` — list, drives the filter bar (uppercased automatically)
- `featured: true` — eligible for the larger homepage/library slot
- `read_mins` — optional; auto-estimated from length if omitted

## Files in this bundle

```
package.json            build script + deps
vercel.json             tells Vercel to run the build
.gitignore              ignores node_modules
scripts/
  build-articles.mjs    the Markdown -> HTML generator
  _articleutils.js      helpers appended to the data file
articles/
  _article.template.html   the page template (placeholders filled by build)
  posts/welcome.md         a sample post — delete or keep
```

`assets/articles-data.js` and `sitemap.xml` are now AUTO-GENERATED. Don't edit
them by hand — edit the `.md` files and rebuild.

## Local preview before pushing

```bash
npm run build
python3 -m http.server 8000   # then open http://localhost:8000
```

## Changing your domain
The build writes canonical URLs and the sitemap using the domain set near the
top of `scripts/build-articles.mjs` (`const SITE = ...`). Change it there if
needed.

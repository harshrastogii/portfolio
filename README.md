# harshrastogi.au

A static site. No framework, no client-side router, no build output directory —
the HTML in this repo is the HTML that ships. A small Node step turns Markdown
into article pages and stamps asset URLs; Vercel runs it on every push.

## Running it locally

```bash
npm install
npm run build
python3 scripts/devserver.py 8791
```

Then open <http://localhost:8791>. `devserver.py` is `python -m http.server`
with `Cache-Control: no-store`, so edits to CSS and JS show up on reload
instead of being masked by a cached copy.

## Publishing an article

1. Create `articles/posts/my-slug.md`:

   ```markdown
   ---
   title: My article title
   dek: One line, shown on cards and in search results.
   date: 2026-09-14
   tags: [DATA, NT]
   featured: false
   ---

   Write in Markdown. Use ## and ### for headings — the table of contents
   builds itself from them.
   ```

2. `git add -A && git commit -m "New article: my-slug" && git push`

Vercel rebuilds. The article page, the homepage teaser, the library grid, the
tag filters, related articles, the no-script fallback list and the sitemap all
update on their own. The URL is `/articles/my-slug` — `cleanUrls` in
`vercel.json` drops the `.html`.

### Frontmatter
- `title`, `dek`, `date` — required
- `tags` — drives the filter bar, uppercased automatically
- `featured: true` — eligible for the wide slot at the top of the library
- `read_mins` — optional; estimated from length at ~220 wpm if omitted

## What the build does

`npm run build` runs `scripts/build-articles.mjs`, which:

1. renders every `articles/posts/*.md` through `articles/_article.template.html`
2. regenerates `assets/articles-data.js` (the array the front end reads)
3. writes `sitemap.xml`
4. stamps every `assets/*.css|js` reference in every page with `?v=<content hash>`,
   so a deploy can't serve a visitor a stale stylesheet
5. refreshes the `<noscript>` article list on the library page

It is idempotent — running it twice produces identical files.

**Do not hand-edit** `assets/articles-data.js`, `sitemap.xml`, the generated
`articles/<slug>.html` files, or the `?v=` stamps.

## Layout

```
index.html                     home
articles/index.html            the library
articles/_article.template.html  the page every post is rendered into
articles/posts/*.md            the posts themselves

assets/tokens.css              design tokens — colour scales, type, space, motion
assets/site.css                every component, built only from those tokens
assets/app.js                  nav, reveals, marquee, stacked cards, cursor,
                               grain, page curtain, smooth scroll
assets/particle-text.js        the hero word that scatters under the cursor
assets/articles.js             renders article cards on all three surfaces
assets/article-page.js         reading view: byline, TOC, progress, scroll-spy

scripts/build-articles.mjs     the build
scripts/devserver.py           local preview with caching disabled
```

## Dependencies

Build-time: `marked` and `gray-matter`.
Runtime: Plus Jakarta Sans and IBM Plex Mono from Google Fonts, and
[Lenis](https://github.com/darkroomengineering/lenis) (~13 KB) from jsDelivr for
smooth scrolling. Lenis is optional — if it fails to load the page falls back to
native scrolling and everything else still works.

## Ground rules the code follows

- **The page works without JavaScript.** Reveal styles are gated behind
  `html.js`, which the head sets and removes again if the scripts never report
  that they booted. Worst case is a page without animation, never a blank one.
- **Nothing hard-codes a colour.** Every value resolves to a token in
  `tokens.css`.
- **Motion is opt-out.** `prefers-reduced-motion`, coarse pointers and narrow
  screens each skip the work they should skip — the particle canvas, the custom
  cursor, the grain and smooth scroll all check before starting.

## Changing the domain

`scripts/build-articles.mjs` writes canonical URLs and the sitemap from the
`SITE` constant near the top of the file.

# Articles — how it works & how to publish

This portfolio now has a three-tier Articles feature, built entirely in the
existing design language (contour, grid, registration marks, mono labels, the
GSAP reveal + 3D-tilt cards, the Three.js particle field). Nothing in the
original homepage animation set was removed or simplified.

## What was added

```
index.html                         your site + new "Writing" section (03)
articles/
  index.html                       the library (filterable card grid)
  per-capita-changes-everything.html   a real sample article = your template
assets/
  articles-data.js                 ⭐ the ONE file you edit to publish
  articles.js                      card rendering + filter + related logic
  article-page.js                  reading view: progress bar, TOC, scroll-spy
  page-shell.js                    shared particle background (extracted once)
  site.css                         your design tokens + article styles
sitemap.xml, robots.txt            SEO
```

## Publishing a new article TODAY (no backend yet)

Two steps:

1. **Add one object** to the `ARTICLES` array in `assets/articles-data.js`:
   ```js
   {
     slug: "my-new-piece",
     title: "My new piece",
     dek: "One-line summary shown on cards and in search results.",
     date: "2026-06-20",
     tags: ["DATA", "NT"],
     readMins: 6,
     featured: false
   }
   ```
   This alone updates the homepage teaser, the library grid, the filter
   counts, and related-article suggestions everywhere.

2. **Copy** `articles/per-capita-changes-everything.html` to
   `articles/my-new-piece.html`. In the new file:
   - set `<body data-slug="my-new-piece">`
   - edit the 5 SEO lines at the top (title, description, og:*, canonical)
   - edit the JSON-LD block (headline, description, datePublished)
   - replace the `<article class="prose">` body with your writing (use
     `<h2>`/`<h3>` for sections — the table of contents builds itself)

The kicker (date · reading time), tags, TOC, progress bar, and related cards
are all automatic. Reading time uses `readMins` if set, else it's estimated
from word count.

## Moving to Supabase (the admin/edit experience you wanted)

The front-end is already structured for this — every page reads
`window.ARTICLES`. To go live with a real database + admin:

1. **Create a Supabase project** (free tier). Add one table:
   ```sql
   create table articles (
     slug        text primary key,
     title       text not null,
     dek         text not null,
     body_html   text not null,
     date        date not null,
     tags        text[] not null default '{}',
     read_mins   int,
     featured    boolean default false,
     published   boolean default false
   );
   -- public can read only published rows:
   alter table articles enable row level security;
   create policy "public read" on articles
     for select using (published = true);
   ```

2. **Replace `articles-data.js`** with a fetch (Supabase handles this securely;
   the anon key is safe to expose because RLS restricts it to published rows):
   ```js
   const { createClient } =
     await import("https://esm.sh/@supabase/supabase-js@2");
   const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
   const { data } = await sb.from("articles")
     .select("*").eq("published", true).order("date", { ascending: false });
   window.ARTICLES = data.map(r => ({
     slug: r.slug, title: r.title, dek: r.dek, date: r.date,
     tags: r.tags, readMins: r.read_mins, featured: r.featured
   }));
   ```
   Nothing else in the front-end changes.

3. **Admin page** — a separate `admin.html` behind **Supabase Auth**
   (email/password or magic link). Supabase Auth handles the login securely,
   so you never hand-roll credential handling. The page is a simple editor:
   list rows, edit fields, write `body_html`, toggle `published`. Because it's
   gated by Auth + RLS (add an authenticated write policy), only you can edit.

   ⚠️ Do not deploy an admin page that writes to the live site without this
   auth in place — an unprotected editor endpoint is a serious vulnerability.

4. **Clean `/articles/article-name` URLs** (no `.html`): on Vercel add a
   rewrite in `vercel.json`, or render article bodies dynamically from the DB
   by slug. Until then the `.html` links work everywhere.

## Notes

- All pages keep the GSAP-absent failsafes: if a CDN fails to load, content
  still appears (verified). Reduced-motion is respected site-wide.
- The "featured" card spans two columns on desktop and collapses on mobile.
- Tested headless across home / library / article: cards render, filters work,
  TOC + scroll-spy + progress bar + related all function, zero JS errors.

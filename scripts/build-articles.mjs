/* ============================================================================
   build-articles.mjs
   Converts every Markdown file in articles/posts/*.md into a styled article
   page (using _article.template.html) AND regenerates assets/articles-data.js
   so the homepage teaser, library grid, filters, and related-suggestions all
   update automatically. No database. Runs on `npm run build` (Vercel).

   To publish: drop a .md file in articles/posts/ with frontmatter, commit.
============================================================================ */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import matter from "gray-matter";
import { marked } from "marked";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const POSTS_DIR = join(ROOT, "articles", "posts");
const OUT_DIR = join(ROOT, "articles");
const TEMPLATE = join(ROOT, "articles", "_article.template.html");
const DATA_OUT = join(ROOT, "assets", "articles-data.js");
const SITE = "https://harshrastogi.au"; // <- change if your domain differs

// reading time: ~220 wpm from the rendered text
function readingMins(html) {
  const words = html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}
function esc(s = "") {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
// gray-matter parses an unquoted YAML date into a Date object; normalize to
// an ISO 'YYYY-MM-DD' string regardless of whether it came in as Date or text.
function toISODate(v) {
  if (v instanceof Date) {
    return new Date(v.getTime() - v.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }
  return String(v).slice(0, 10);
}

/* ---------------------------------------------------------------------------
   Shared partials.

   The nav and the shared part of the footer used to be copied by hand into
   every page, so one change (a new email address, say) meant four edits and a
   chance to miss one. They now live once in partials/*.html, and every page
   marks where each goes:

     <!-- PARTIAL:nav current="/articles" -->
     ...filled in by the build...
     <!-- /PARTIAL:nav -->

   The build replaces whatever sits between a pair of markers with the named
   partial, so edit partials/, never the copies. Attributes on the opening
   marker fill {{name}} slots in the partial; `current` is special and marks
   the links that point at it with aria-current="page". The markers stay in
   place, which keeps this idempotent like everything else here.

   This runs first: the article template is one of the pages it fills, and
   the template has to be current before any post is rendered through it.
--------------------------------------------------------------------------- */
const PARTIALS_DIR = join(ROOT, "partials");
const PROJECTS_DIR = join(ROOT, "projects");
const PROJECT_POSTS = join(PROJECTS_DIR, "posts");
const PROJECT_TEMPLATE = join(PROJECTS_DIR, "_project.template.html");

const PARTIAL_PAGES = [
  join(ROOT, "index.html"),
  join(ROOT, "about.html"),
  join(ROOT, "404.html"),
  join(ROOT, "articles", "index.html"),
  TEMPLATE,
  PROJECT_TEMPLATE,
];

function renderPartial(name, attrString, page) {
  const file = join(PARTIALS_DIR, `${name}.html`);
  if (!existsSync(file)) throw new Error(`${basename(page)}: no partial named "${name}" (looked for partials/${name}.html)`);
  const attrs = {};
  for (const [, k, v] of attrString.matchAll(/([\w-]+)="([^"]*)"/g)) attrs[k] = v;

  let html = readFileSync(file, "utf8").replace(/\{\{([a-z][\w-]*)\}\}/g, (whole, key) => {
    if (!(key in attrs)) throw new Error(`${basename(page)}: partial "${name}" needs ${key}="…" on its marker`);
    return attrs[key];
  });
  if (attrs.current) {
    html = html.replaceAll(`href="${attrs.current}"`, `href="${attrs.current}" aria-current="page"`);
  }
  return html.endsWith("\n") ? html : html + "\n";
}

let partialPages = 0;
for (const page of PARTIAL_PAGES) {
  if (!existsSync(page)) continue;
  const before = readFileSync(page, "utf8");
  const after = before.replace(
    /(<!-- PARTIAL:([\w-]+)((?:\s+[\w-]+="[^"]*")*)\s*-->\n)[\s\S]*?([ \t]*<!-- \/PARTIAL:\2 -->)/g,
    (whole, open, name, attrs, close) => open + renderPartial(name, attrs, page) + close
  );
  if (after !== before) { writeFileSync(page, after); partialPages++; }
}
console.log(`Filled partials in ${partialPages} page(s)`);

/* ---------------------------------------------------------------------------
   Project metadata is read first: articles list related projects under
   "From the work", and project pages list "More work", from the same rows.
--------------------------------------------------------------------------- */
const projects = [];
if (existsSync(PROJECT_POSTS)) {
  for (const file of readdirSync(PROJECT_POSTS).filter((f) => f.endsWith(".md"))) {
    const slug = basename(file, ".md");
    const { data, content } = matter(readFileSync(join(PROJECT_POSTS, file), "utf8"));
    for (const k of ["title", "dek", "order", "pill"]) {
      if (data[k] === undefined || data[k] === "") throw new Error(`projects/posts/${file}: missing frontmatter "${k}"`);
    }
    projects.push({ slug, data, body: marked.parse(content) });
  }
  projects.sort((a, b) => a.data.order - b.data.order);
}
const projectBySlug = new Map(projects.map((p) => [p.slug, p]));

const pill = (d) => `<span class="pill${d.live ? " is-live" : ""}">${esc(d.pill)}</span>`;
const projectRow = (q) =>
  `        <a class="index__row" href="/projects/${q.slug}">\n` +
  `          <span class="index__num">${esc(q.data.code || "")}</span>\n` +
  `          <span class="index__name">${esc(q.data.title)} ${pill(q.data)}</span>\n` +
  `          <span class="index__note">${esc(q.data.dek)}</span>\n` +
  `          <span class="index__go">Read &rarr;</span>\n` +
  `        </a>`;

if (!existsSync(POSTS_DIR)) { mkdirSync(POSTS_DIR, { recursive: true }); }
const tpl = readFileSync(TEMPLATE, "utf8");

const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
const articles = [];

for (const file of files) {
  const slug = basename(file, ".md");
  const raw = readFileSync(join(POSTS_DIR, file), "utf8");
  const { data, content } = matter(raw);

  // required frontmatter
  for (const k of ["title", "dek", "date"]) {
    if (!data[k]) throw new Error(`${file}: missing frontmatter "${k}"`);
  }
  const tags = (data.tags || []).map((t) => String(t).toUpperCase());
  const bodyHtml = marked.parse(content);
  const mins = data.read_mins || readingMins(bodyHtml);

  articles.push({
    slug,
    title: data.title,
    dek: data.dek,
    date: toISODate(data.date),
    tags,
    readMins: mins,
    featured: !!data.featured,
  });

  // "From the work": the projects the article names in its frontmatter
  // (projects: [slug, ...]), or the three featured projects if it names none
  const picks = (data.projects || []).map((s) => {
    if (!projectBySlug.has(s)) throw new Error(`${file}: projects lists "${s}", which has no projects/posts/${s}.md`);
    return projectBySlug.get(s);
  });
  const related = (picks.length ? picks : projects.slice(0, 3)).map(projectRow).join("\n\n");

  // fill the template
  const canonical = `${SITE}/articles/${slug}`;
  let page = tpl
    .replace("{{PROJECTS}}", () => related)
    .replaceAll("{{SLUG}}", esc(slug))
    .replaceAll("{{TITLE}}", esc(data.title))
    .replaceAll("{{DEK}}", esc(data.dek))
    .replaceAll("{{DATE}}", toISODate(data.date))
    .replaceAll("{{CANONICAL}}", canonical)
    .replaceAll("{{BODY}}", bodyHtml);

  writeFileSync(join(OUT_DIR, `${slug}.html`), page);
  console.log(`  ✓ ${slug}.html  (${mins} min)`);
}

// regenerate the data layer the front-end already reads
articles.sort((a, b) => b.date.localeCompare(a.date));
const dataJs =
  `/* AUTO-GENERATED by scripts/build-articles.mjs — do not edit by hand.\n` +
  `   Edit articles in articles/posts/*.md and run \`npm run build\`. */\n` +
  `window.ARTICLES = ${JSON.stringify(articles, null, 2)};\n\n` +
  readFileSync(join(__dirname, "_articleutils.js"), "utf8");

writeFileSync(DATA_OUT, dataJs);
console.log(`\nBuilt ${articles.length} article(s) -> assets/articles-data.js`);

/* ---------------------------------------------------------------------------
   Project pages.

   Every project gets its own page, written in projects/posts/<slug>.md and
   rendered through projects/_project.template.html to projects/<slug>.html
   (served at /projects/<slug>). The homepage stays hand-written; it links to
   these pages, and the build fails if it links to one that does not exist.

   Frontmatter:
     title, dek, order (required)  name, one-line summary, position in the list
     pill, live                    status label, and whether it is a live tool
     seo_title                     a descriptive <title>; defaults to title
     code, context                 "NT·04"; what it was made for (a unit, a competition)
     built_with                    list, shown under "Built with"
     links                         list of {label, href}; the first is the main button
     note                          a line shown where the buttons would be
     cover                         {src, compact, alt} for the featured films' posters

   Where a figure needs its source kept beside it, put a YAML comment in the
   frontmatter: comments are read by people, not shipped.
--------------------------------------------------------------------------- */
function fill(template, values) {
  // Replacement through a function, so a "$" in the copy is never read as a
  // replacement pattern ("$821" must stay "$821").
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (whole, key) => {
    if (!(key in values)) throw new Error(`template placeholder {{${key}}} has no value`);
    return values[key];
  });
}

if (projects.length) {
  const ptpl = readFileSync(PROJECT_TEMPLATE, "utf8");
  const external = (href) => /^https?:\/\//.test(href);

  projects.forEach((p, i) => {
    const d = p.data;
    const canonical = `${SITE}/projects/${p.slug}`;

    // what it was made for is listed under the title, so the line above the
    // title carries only the project's code
    const metaHtml = `<span>${esc(d.code || "Project")}</span>`;

    const links = d.links || [];
    let actions = "";
    if (links.length) {
      actions = '      <div class="project-actions">\n' + links.map((l, j) => {
        const ext = external(l.href);
        return `        <a class="btn ${j ? "btn--ghost" : "btn--solid"} btn--lg" href="${esc(l.href)}"` +
          (ext ? ' target="_blank" rel="noopener"' : "") +
          `>${esc(l.label)} <span class="btn__arrow" aria-hidden="true">${ext ? "&nearr;" : "&rarr;"}</span></a>`;
      }).join("\n") + "\n      </div>";
    }
    if (d.note) actions += `\n      <p class="project-note">${esc(d.note)}</p>`;

    const facts = [["Status", pill(d)]];
    if (d.context) facts.push(["Made for", esc(d.context)]);
    if (d.built_with?.length) facts.push(["Built with", d.built_with.map(esc).join(" &middot; ")]);
    const factsHtml = facts.map(([k, v]) => `        <div><dt>${k}</dt><dd>${v}</dd></div>`).join("\n");

    let cover = "";
    if (d.cover?.src) {
      cover =
        '    <figure class="project-cover">\n      <picture>\n' +
        (d.cover.compact ? `        <source media="(max-width: 560px)" srcset="${esc(d.cover.compact)}" />\n` : "") +
        `        <img src="${esc(d.cover.src)}" alt="${esc(d.cover.alt || "")}" width="2560" height="1440" />\n` +
        "      </picture>\n    </figure>\n";
    }

    // the next three projects in list order, wrapping round, so every page
    // leads on to more work and every project is linked from three others
    const more = [1, 2, 3].map((k) => projects[(i + k) % projects.length]).map(projectRow).join("\n\n");

    const jsonld = {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: d.title,
      headline: d.seo_title || d.title,
      description: d.dek,
      url: canonical,
      mainEntityOfPage: canonical,
      keywords: (d.built_with || []).join(", ") || undefined,
      author: { "@type": "Person", "@id": `${SITE}/#harsh-rastogi`, name: "Harsh Rastogi", url: `${SITE}/` },
      ...(links.find((l) => external(l.href)) ? { sameAs: links.filter((l) => external(l.href)).map((l) => l.href) } : {}),
    };

    const page = fill(ptpl, {
      SLUG: esc(p.slug),
      TITLE: esc(d.title),
      SEO_TITLE: esc(d.seo_title || d.title),
      DEK: esc(d.dek),
      CANONICAL: canonical,
      // the posters are WebP, which LinkedIn's link previews do not show
      OG_IMAGE: `${SITE}/assets/og-card.jpg`,
      JSONLD: JSON.stringify(jsonld, null, 2).replace(/</g, "\\u003c"),
      META: metaHtml,
      ACTIONS: actions,
      FACTS: factsHtml,
      COVER: cover,
      BODY: p.body,
      MORE: more,
    });
    writeFileSync(join(PROJECTS_DIR, `${p.slug}.html`), page);
  });
  console.log(`Built ${projects.length} project page(s)`);

  // every /projects/<slug> the homepage links to must exist
  const home = readFileSync(join(ROOT, "index.html"), "utf8");
  const known = new Set(projects.map((p) => p.slug));
  for (const [, slug] of home.matchAll(/href="\/projects\/([\w-]+)"/g)) {
    if (!known.has(slug)) throw new Error(`index.html links to /projects/${slug}, which has no projects/posts/${slug}.md`);
  }
  // and every project page's "All work" link returns to /#<slug>, so the
  // homepage needs that anchor, or the link drops the visitor at the top
  for (const slug of known) {
    if (!home.includes(`id="${slug}"`)) throw new Error(`projects/${slug}: its back link goes to /#${slug}, but index.html has no element with id="${slug}"`);
  }
}

// sitemap
// lastmod is only written where the build knows it is true. The library and
// each article change when a post is published, so their dates are exact.
// The homepage changes whenever its copy is edited, which the build cannot
// see, and Google stops trusting a sitemap's dates once they prove wrong, so
// the homepage gets none rather than a guess.
const latestDate = articles[0]?.date;
const urls = [
  { loc: `${SITE}/` },
  { loc: `${SITE}/about` },
  { loc: `${SITE}/articles`, lastmod: latestDate },
  ...articles.map((a) => ({ loc: `${SITE}/articles/${a.slug}`, lastmod: a.date })),
  ...projects.map((p) => ({ loc: `${SITE}/projects/${p.slug}` })),
];
const sm =
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(({ loc, lastmod }) => `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`).join("\n") +
  `\n</urlset>\n`;
writeFileSync(join(ROOT, "sitemap.xml"), sm);
console.log("Wrote sitemap.xml");

/* ---------------------------------------------------------------------------
   Asset versioning.

   Every HTML page references assets/*.css and assets/*.js by a bare path. A
   host that serves those with a long max-age will keep handing visitors the
   copy they cached before the last deploy, so a CSS change can land and go
   unseen. Stamping each reference with a hash of the file's own contents
   makes the URL change exactly when the file does: unchanged assets stay
   cached, changed ones are fetched.

   This runs last, over the article pages the build just wrote as well as the
   hand-written ones, and is idempotent — an existing ?v= stamp is replaced.
--------------------------------------------------------------------------- */
const ASSET_DIR = join(ROOT, "assets");
const assetHashes = new Map();
for (const file of readdirSync(ASSET_DIR)) {
  if (!/\.(css|js)$/.test(file)) continue;
  const hash = createHash("sha1").update(readFileSync(join(ASSET_DIR, file))).digest("hex").slice(0, 8);
  assetHashes.set(file, hash);
}

const pages = [
  join(ROOT, "index.html"),
  join(ROOT, "about.html"),
  join(ROOT, "404.html"),
  join(ROOT, "articles", "index.html"),
  ...articles.map((a) => join(OUT_DIR, `${a.slug}.html`)),
  ...projects.map((p) => join(PROJECTS_DIR, `${p.slug}.html`)),
];

let stamped = 0;
for (const page of pages) {
  if (!existsSync(page)) continue;
  const before = readFileSync(page, "utf8");
  const after = before.replace(
    /((?:\.\.\/)?assets\/([\w.-]+\.(?:css|js)))(?:\?v=[a-f0-9]+)?/g,
    (whole, path, file) => (assetHashes.has(file) ? `${path}?v=${assetHashes.get(file)}` : whole)
  );
  if (after !== before) { writeFileSync(page, after); stamped++; }
}
console.log(`Stamped assets in ${stamped} page(s)`);

/* ---------------------------------------------------------------------------
   The library grid is rendered by JavaScript from articles-data.js. With
   scripting off that leaves an empty section, so the library page carries a
   <noscript> list between two markers and the build keeps it in step with the
   posts — a hand-maintained copy would go stale on the next publish.
--------------------------------------------------------------------------- */
const LIB = join(OUT_DIR, "index.html");
if (existsSync(LIB)) {
  const items = articles
    .map((a) => `<li><a class="footer__link" href="/articles/${a.slug}">${esc(a.title)}</a></li>`)
    .join("\n          ");
  const block = `<!-- ARTICLE-LIST:START -->\n        <ul style="list-style:none;display:grid;gap:var(--space-2)">\n          ${items}\n        </ul>\n        <!-- ARTICLE-LIST:END -->`;
  const before = readFileSync(LIB, "utf8");
  const after = before.replace(
    /<!-- ARTICLE-LIST:START -->[\s\S]*?<!-- ARTICLE-LIST:END -->/,
    block
  );
  if (after !== before) {
    writeFileSync(LIB, after);
    console.log(`Refreshed the no-script article list (${articles.length} entries)`);
  }
}

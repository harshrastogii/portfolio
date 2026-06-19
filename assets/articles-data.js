/* ============================================================================
   ARTICLES — SINGLE SOURCE OF TRUTH
   ----------------------------------------------------------------------------
   To publish a new article today (Path C / before Supabase is wired):
     1. Add one object to the ARTICLES array below.
     2. Create articles/<slug>.html from articles/article.html and write the body.
   That's it — the homepage teaser, the library grid, the tag filters, and
   "related articles" all populate themselves from this array.

   When you wire Supabase later, this whole file is replaced by a fetch:
     window.ARTICLES = await fetchArticlesFromSupabase();
   Nothing else in the front-end has to change — every page reads window.ARTICLES.

   FIELD REFERENCE
     slug        URL segment -> /articles/<slug>.html         (required, unique)
     title       display title                                 (required)
     dek         one-line summary shown on cards + <meta>      (required)
     date        ISO 'YYYY-MM-DD' — drives sorting & <time>    (required)
     tags        array, drives the filter bar & related posts  (required)
     readMins    integer estimate; omit and it's computed      (optional)
     featured    true -> eligible for the larger homepage slot (optional)
     coverNote   tiny mono caption on the card (e.g. a stat)   (optional)
============================================================================ */

window.ARTICLES = [
  {
    slug: "per-capita-changes-everything",
    title: "Per-capita changes everything",
    dek: "Why switching from raw counts to a rate quietly reorders who your data says is most affected — and who then gets served.",
    date: "2026-05-28",
    tags: ["DATA", "NT"],
    readMins: 7,
    featured: true,
    coverNote: "Fig. 01 — reordered",
  },
  {
    slug: "the-tanami-is-a-cold-spot",
    title: "The Tanami is a cold spot",
    dek: "Mapping protected-area coverage across the Territory's bioregions, and what 0.6% on 538,000 km² actually means.",
    date: "2026-04-15",
    tags: ["DATA", "NT"],
    readMins: 9,
    featured: true,
    coverNote: "0.6% coverage",
  },
  {
    slug: "ecoacoustics-trained-down-under",
    title: "Ecoacoustics, trained down under",
    dek: "Most bird-call models learn on Northern-Hemisphere species. Building one that listens to the Top End instead.",
    date: "2026-03-02",
    tags: ["ML", "NT"],
    readMins: 11,
    featured: false,
    coverNote: "field audio → labels",
  },
  {
    slug: "data-honesty-as-a-feature",
    title: "Data honesty as a feature",
    dek: "Labelling curated lists and approximations distinctly, scraping nothing, and why that constraint made Gradaroo better.",
    date: "2026-02-10",
    tags: ["ML", "CAREER"],
    readMins: 6,
    featured: false,
    coverNote: "nothing scraped",
  },
  {
    slug: "treasury-analyst-to-data-scientist",
    title: "From Treasury analyst to data scientist",
    dek: "What public-sector finance taught me that no ML course did, and the parts of the transition nobody warns you about.",
    date: "2026-01-18",
    tags: ["CAREER"],
    readMins: 8,
    featured: false,
    coverNote: "a change of frame",
  },
];

/* ----------------------------------------------------------------------------
   Small shared helpers. Pure functions — safe to call from any page.
---------------------------------------------------------------------------- */
window.ArticleUtils = {
  // Newest first.
  sorted() {
    return [...window.ARTICLES].sort((a, b) => b.date.localeCompare(a.date));
  },

  bySlug(slug) {
    return window.ARTICLES.find((a) => a.slug === slug) || null;
  },

  // Every tag in use, in first-seen order, prefixed with ALL.
  allTags() {
    const seen = [];
    window.ArticleUtils.sorted().forEach((a) =>
      a.tags.forEach((t) => {
        if (!seen.includes(t)) seen.push(t);
      })
    );
    return ["ALL", ...seen];
  },

  // Related = shares the most tags, excluding self; falls back to recency.
  related(slug, limit = 2) {
    const self = window.ArticleUtils.bySlug(slug);
    if (!self) return [];
    return window.ArticleUtils
      .sorted()
      .filter((a) => a.slug !== slug)
      .map((a) => ({
        a,
        score: a.tags.filter((t) => self.tags.includes(t)).length,
      }))
      .sort((x, y) => y.score - x.score)
      .slice(0, limit)
      .map((x) => x.a);
  },

  // "28 May 2026"
  prettyDate(iso) {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  },

  // Reading time: use the explicit value, else estimate from word count.
  readingTime(article, wordCount) {
    if (article && article.readMins) return article.readMins;
    if (!wordCount) return null;
    return Math.max(1, Math.round(wordCount / 220));
  },
};

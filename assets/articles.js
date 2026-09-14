/* ============================================================================
   ARTICLES.JS — renders every article surface: the homepage teaser, the
   library grid with its tag filter, and the related list at the foot of a
   post. Reads window.ARTICLES / window.ArticleUtils from articles-data.js,
   which the build regenerates from articles/posts/*.md.
============================================================================ */
(function () {
  "use strict";

  var U = window.ArticleUtils;
  if (!U) return;

  /* Root-absolute and extensionless, which is what the canonical URLs and the
     sitemap use.

     Document-relative links were the earlier approach and they are unsafe
     here: the host serves the library at /articles with no trailing slash,
     and a relative href from there resolves against the site root, not
     against /articles/. That silently pointed every article link at the top
     level, where nothing exists. Anchoring at / removes the whole class of
     problem — the link no longer depends on which page renders the card or
     whether its URL happens to end in a slash. */
  function hrefFor(slug) {
    return "/articles/" + slug;
  }

  function card(article, host, featured) {
    var a = document.createElement("a");
    a.className = "post-card" + (featured ? " is-featured" : "");
    a.href = hrefFor(article.slug);
    a.setAttribute("data-cursor", "Read");

    var mins = article.readMins ? article.readMins + " min read" : "";
    a.innerHTML =
      '<span class="post-card__meta">' +
        '<time datetime="' + article.date + '">' + U.prettyDate(article.date) + "</time>" +
        (mins ? '<span class="dot"></span><span>' + mins + "</span>" : "") +
      "</span>" +
      '<h3 class="post-card__title">' + article.title + "</h3>" +
      '<p class="post-card__dek">' + article.dek + "</p>" +
      '<span class="post-card__foot">' +
        article.tags.map(function (t) { return '<span class="pill">' + t + "</span>"; }).join("") +
      "</span>";
    return a;
  }

  /* -- homepage: the most recent N ------------------------------------- */
  function renderTeaser() {
    var host = document.getElementById("writing-cards");
    if (!host) return;
    var n = parseInt(host.getAttribute("data-count") || "3", 10);
    U.sorted().slice(0, n).forEach(function (article, i) {
      var el = card(article, host, false);
      el.setAttribute("data-reveal", "");
      el.style.setProperty("--reveal-delay", (i * 0.07) + "s");
      host.appendChild(el);
    });
  }

  /* -- library: all of them, filtered by tag --------------------------- */
  function renderLibrary() {
    var host = document.getElementById("library-cards");
    if (!host) return;
    var bar = document.getElementById("lib-filters");
    var active = "ALL";

    function paint() {
      var items = U.sorted().filter(function (a) {
        return active === "ALL" || a.tags.indexOf(active) !== -1;
      });
      host.innerHTML = "";

      if (!items.length) {
        var empty = document.createElement("p");
        empty.className = "lib-empty";
        empty.textContent = "Nothing filed under this tag yet.";
        host.appendChild(empty);
        return;
      }

      items.forEach(function (article, i) {
        var featured = i === 0 && article.featured && active === "ALL" && items.length >= 3;
        var el = card(article, host, featured);
        el.setAttribute("data-reveal", "");
        el.style.setProperty("--reveal-delay", (i * 0.06) + "s");
        host.appendChild(el);
      });

      if (window.Site) { window.Site.refreshReveals(); window.Site.refreshCursor(); }
    }

    if (bar) {
      U.allTags().forEach(function (tag) {
        var count = tag === "ALL"
          ? window.ARTICLES.length
          : window.ARTICLES.filter(function (a) { return a.tags.indexOf(tag) !== -1; }).length;

        var btn = document.createElement("button");
        btn.className = "lib-filter";
        btn.type = "button";
        btn.setAttribute("aria-pressed", tag === "ALL" ? "true" : "false");
        btn.innerHTML = tag + '<span class="count">' + count + "</span>";
        btn.addEventListener("click", function () {
          active = tag;
          bar.querySelectorAll(".lib-filter").forEach(function (b) {
            b.setAttribute("aria-pressed", "false");
          });
          btn.setAttribute("aria-pressed", "true");
          paint();
        });
        bar.appendChild(btn);
      });
    }
    paint();
  }

  /* -- article foot: nearest neighbours by shared tags ----------------- */
  function renderRelated() {
    var host = document.getElementById("related-cards");
    if (!host) return;
    var items = U.related(
      host.getAttribute("data-slug"),
      parseInt(host.getAttribute("data-count") || "2", 10)
    );
    if (!items.length) {
      var section = host.closest("section");
      if (section) section.remove();
      return;
    }
    items.forEach(function (article, i) {
      var el = card(article, host, false);
      el.setAttribute("data-reveal", "");
      el.style.setProperty("--reveal-delay", (i * 0.07) + "s");
      host.appendChild(el);
    });
  }

  function run() {
    renderTeaser();
    renderLibrary();
    renderRelated();
    if (window.Site) { window.Site.refreshReveals(); window.Site.refreshCursor(); }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();

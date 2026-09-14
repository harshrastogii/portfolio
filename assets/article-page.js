/* ============================================================================
   ARTICLE-PAGE.JS — the reading view: byline, auto table of contents from the
   headings, reading-progress bar, and TOC scroll-spy. Everything here is
   additive; the article itself is plain HTML rendered by the build and reads
   fine with this file missing.
============================================================================ */
(function () {
  "use strict";

  var U = window.ArticleUtils;
  var slug = document.body.getAttribute("data-slug");
  var article = U ? U.bySlug(slug) : null;

  /* -- byline: date, reading time, place, tags ------------------------- */
  function fillMeta() {
    var prose = document.getElementById("prose");
    var words = prose ? prose.textContent.trim().split(/\s+/).length : 0;
    var mins = U ? U.readingTime(article, words) : null;

    var meta = document.getElementById("article-meta");
    if (meta && article) {
      meta.innerHTML =
        '<time datetime="' + article.date + '">' + U.prettyDate(article.date) + "</time>" +
        (mins ? '<span class="dot"></span><span>' + mins + " min read</span>" : "") +
        '<span class="dot"></span><span>Darwin, NT</span>';
    }

    var tags = document.getElementById("article-tags");
    if (tags && article) {
      tags.innerHTML = article.tags
        .map(function (t) { return '<span class="pill">' + t + "</span>"; })
        .join("");
    }
  }

  /* -- table of contents, built from the headings the writer actually
        used, with ids minted where the Markdown didn't supply one ------ */
  function buildTOC() {
    var prose = document.getElementById("prose");
    var list = document.getElementById("toc-list");
    if (!prose || !list) return [];

    var heads = [].slice.call(prose.querySelectorAll("h2, h3"));
    if (!heads.length) {
      var toc = document.getElementById("toc");
      if (toc) toc.remove();
      return [];
    }

    heads.forEach(function (h, i) {
      if (!h.id) {
        h.id = h.textContent.toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || "section-" + i;
      }
      var li = document.createElement("li");
      if (h.tagName === "H3") li.className = "is-sub";
      var a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent;
      li.appendChild(a);
      list.appendChild(li);
    });
    return heads;
  }

  /* -- progress bar, measured against the article body only ------------ */
  function wireProgress() {
    var bar = document.getElementById("progress");
    var prose = document.getElementById("prose");
    if (!bar || !prose) return;

    var ticking = false;
    function update() {
      ticking = false;
      var rect = prose.getBoundingClientRect();
      var total = Math.max(rect.height - window.innerHeight + 200, 1);
      var done = Math.min(Math.max(-rect.top + 120, 0), total);
      bar.style.width = (done / total) * 100 + "%";
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* -- scroll-spy ------------------------------------------------------
     Position-based rather than observer-based. An IntersectionObserver over
     a narrow band was the first attempt, and it left the contents with no
     highlight at all whenever the reader was in the middle of a long section
     with no heading on screen. Asking "which heading did I last pass" always
     has an answer, which is what a table of contents should show.
  -------------------------------------------------------------------- */
  function wireSpy(heads) {
    if (!heads.length) return;
    var links = {};
    document.querySelectorAll("#toc-list a").forEach(function (a) {
      links[a.getAttribute("href").slice(1)] = a;
    });

    var LINE = 140; // the notional reading line, just under the nav
    var ticking = false;

    function update() {
      ticking = false;
      var current = heads[0].id;
      heads.forEach(function (h) {
        if (h.getBoundingClientRect().top <= LINE) current = h.id;
      });
      Object.keys(links).forEach(function (id) {
        links[id].classList.toggle("is-active", id === current);
      });
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  function run() {
    fillMeta();
    wireSpy(buildTOC());
    wireProgress();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();

/* ============================================================================
   ARTICLES.JS — shared rendering + motion for every article surface
   Reuses the EXACT GSAP parameters from the original site so new cards move
   identically to the existing .node / .proj elements. Depends on:
     articles-data.js (window.ARTICLES, window.ArticleUtils)
     GSAP + ScrollTrigger (loaded by each page)
============================================================================ */
(function () {
  const U = window.ArticleUtils;

  /* -- build one card's inner HTML (shared by homepage teaser + library) -- */
  function cardMarkup(article) {
    const mins = article.readMins ? `${article.readMins} min read` : "";
    const chips = article.tags
      .map((t) => `<span class="chip">${t}</span>`)
      .join("");
    return `
      <span class="card-arrow">↗</span>
      <span class="card-meta">
        <time datetime="${article.date}">${U.prettyDate(article.date)}</time>
        ${mins ? `<span class="dot"></span><span>${mins}</span>` : ""}
      </span>
      <span class="card-t">${article.title}</span>
      <span class="card-dek">${article.dek}</span>
      <span class="card-foot">${chips}</span>
    `;
  }

  function makeCard(article, { featured = false } = {}) {
    const a = document.createElement("a");
    a.className = "card" + (featured ? " is-featured" : "");
    a.href = `articles/${article.slug}.html`;
    a.setAttribute("data-tags", article.tags.join(","));
    a.innerHTML = cardMarkup(article);
    return a;
  }

  /* Path-aware href: the library page sits in /articles/, the homepage at root.
     We detect by whether a `.cards` container declares data-base. */
  function hrefFor(container, slug) {
    const base = container.getAttribute("data-base") || "articles/";
    return `${base}${slug}.html`;
  }

  /* -- HOMEPAGE: render the most-recent N into #writing-cards -- */
  function renderHomepageTeaser() {
    const host = document.getElementById("writing-cards");
    if (!host) return;
    const n = parseInt(host.getAttribute("data-count") || "3", 10);
    const items = U.sorted().slice(0, n);
    items.forEach((article, i) => {
      const featured = i === 0 && article.featured && items.length >= 3;
      const card = makeCard(article, { featured });
      card.href = hrefFor(host, article.slug);
      host.appendChild(card);
    });
    revealCards(host);
  }

  /* -- LIBRARY: render all + wire the tag filter with FLIP-style motion -- */
  function renderLibrary() {
    const host = document.getElementById("library-cards");
    if (!host) return;
    const filterHost = document.getElementById("filterbar");
    let active = "ALL";

    function paint() {
      const items = U.sorted().filter(
        (a) => active === "ALL" || a.tags.includes(active)
      );
      host.innerHTML = "";
      if (!items.length) {
        const empty = document.createElement("div");
        empty.className = "lib-empty";
        empty.textContent = "// no articles under this tag yet";
        host.appendChild(empty);
        return;
      }
      items.forEach((article, i) => {
        const featured = i === 0 && article.featured && active === "ALL";
        const card = makeCard(article, { featured });
        card.href = hrefFor(host, article.slug);
        host.appendChild(card);
      });
      revealCards(host, true);
    }

    // build filter buttons with counts
    if (filterHost) {
      U.allTags().forEach((tag) => {
        const count =
          tag === "ALL"
            ? window.ARTICLES.length
            : window.ARTICLES.filter((a) => a.tags.includes(tag)).length;
        const btn = document.createElement("button");
        btn.className = "filter";
        btn.type = "button";
        btn.setAttribute("aria-pressed", tag === "ALL" ? "true" : "false");
        btn.innerHTML = `${tag}<span class="count">${count}</span>`;
        btn.addEventListener("click", () => {
          active = tag;
          filterHost
            .querySelectorAll(".filter")
            .forEach((b) => b.setAttribute("aria-pressed", "false"));
          btn.setAttribute("aria-pressed", "true");
          paint();
        });
        filterHost.appendChild(btn);
      });
    }
    paint();
  }

  /* -- RELATED: render related cards on an article page -- */
  function renderRelated() {
    const host = document.getElementById("related-cards");
    if (!host) return;
    const slug = host.getAttribute("data-slug");
    const items = U.related(slug, parseInt(host.getAttribute("data-count") || "2", 10));
    if (!items.length) {
      const section = host.closest("section");
      if (section) section.style.display = "none";
      return;
    }
    items.forEach((article) => {
      const card = makeCard(article);
      card.href = hrefFor(host, article.slug);
      host.appendChild(card);
    });
    revealCards(host);
  }

  /* -- shared reveal: identical easing/stagger to the original .node reveal -- */
  function revealCards(host, immediate = false) {
    const cards = host.querySelectorAll(".card");
    if (!window.gsap) {
      cards.forEach((c) => (c.style.opacity = 1));
      return;
    }
    cards.forEach((card, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      gsap.to(card, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "back.out(1.2)",
        delay: immediate ? col * 0.06 + row * 0.04 : row * 0.15 + col * 0.08,
        scrollTrigger: immediate
          ? undefined
          : { trigger: host, start: "top 80%", toggleActions: "play none none reverse" },
      });
    });
    attachTilt(cards);
  }

  /* -- 3D mouse tilt: same math as the original initCardTilt() -- */
  function attachTilt(cards) {
    if (!window.gsap) return;
    cards.forEach((card) => {
      if (card.__tilt) return;
      card.__tilt = true;
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const rx = (e.clientY - r.top - r.height / 2) / 20;
        const ry = (r.width / 2 - (e.clientX - r.left)) / 20;
        gsap.to(card, { rotateX: rx, rotateY: ry, duration: 0.3, ease: "power2.out" });
      });
      card.addEventListener("mouseleave", () => {
        gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.5, ease: "power3.out" });
      });
    });
  }

  /* -- topbar: add a hairline border once the page scrolls -- */
  function wireTopbar() {
    const bar = document.querySelector(".topbar");
    if (!bar) return;
    const onScroll = () => bar.classList.toggle("scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  window.ArticlesUI = {
    renderHomepageTeaser,
    renderLibrary,
    renderRelated,
    wireTopbar,
    revealCards,
  };
})();

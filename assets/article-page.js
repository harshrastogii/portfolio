/* ============================================================================
   ARTICLE-PAGE.JS — the reading experience for an individual article.
   Reads the current article from window.ARTICLES via <body data-slug>.
   Provides: kicker (date · reading time), auto TOC from h2/h3, reading-progress
   bar, TOC scroll-spy, prose reveal, related cards. All motion matches the site.
============================================================================ */
(function () {
  const U = window.ArticleUtils;
  const slug = document.body.getAttribute("data-slug");
  const article = U ? U.bySlug(slug) : null;

  /* -- kicker: date · reading time · tags, kept in sync with the data array -- */
  function fillMeta() {
    const prose = document.getElementById("prose");
    const words = prose ? prose.textContent.trim().split(/\s+/).length : 0;
    const mins = U.readingTime(article, words);

    const kicker = document.getElementById("article-kicker");
    if (kicker && article) {
      kicker.innerHTML =
        `<time datetime="${article.date}">${U.prettyDate(article.date)}</time>` +
        (mins ? `<span class="dot"></span><span>${mins} min read</span>` : "") +
        `<span class="dot"></span><span>Darwin, NT</span>`;
    }

    const tagHost = document.getElementById("article-tags");
    if (tagHost && article) {
      tagHost.innerHTML = article.tags
        .map((t) => `<span class="chip">${t}</span>`)
        .join("");
    }
  }

  /* -- build the table of contents from headings, with anchor ids -- */
  function buildTOC() {
    const prose = document.getElementById("prose");
    const list = document.getElementById("toc-list");
    if (!prose || !list) return [];
    const heads = [...prose.querySelectorAll("h2, h3")];
    if (!heads.length) {
      const toc = document.getElementById("toc");
      if (toc) toc.style.display = "none";
      return [];
    }
    heads.forEach((h, i) => {
      if (!h.id) {
        h.id =
          h.textContent
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "section-" + i;
      }
      const li = document.createElement("li");
      if (h.tagName === "H3") li.className = "sub";
      const a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent;
      a.addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById(h.id).scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", "#" + h.id);
      });
      li.appendChild(a);
      list.appendChild(li);
    });
    return heads;
  }

  /* -- reading-progress bar tied to article scroll extent -- */
  function wireProgress() {
    const bar = document.getElementById("progress");
    const prose = document.getElementById("prose");
    if (!bar || !prose) return;
    function update() {
      const rect = prose.getBoundingClientRect();
      const total = rect.height - window.innerHeight + 200;
      const scrolled = Math.min(Math.max(-rect.top + 120, 0), Math.max(total, 1));
      bar.style.width = (scrolled / Math.max(total, 1)) * 100 + "%";
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* -- scroll-spy: highlight the TOC entry for the heading in view -- */
  function wireScrollSpy(heads) {
    if (!heads.length || !("IntersectionObserver" in window)) return;
    const links = {};
    document.querySelectorAll("#toc-list a").forEach((a) => {
      links[a.getAttribute("href").slice(1)] = a;
    });
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            Object.values(links).forEach((l) => l.classList.remove("active"));
            const link = links[entry.target.id];
            if (link) link.classList.add("active");
          }
        });
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );
    heads.forEach((h) => obs.observe(h));
  }

  /* -- entrance animations: same easings as the rest of the site -- */
  function initMotion() {
    if (!window.gsap) {
      // failsafe: ensure everything is visible without GSAP
      document.querySelectorAll(".article-kicker, .article-title, .article-dek, .article-tags, .prose > *")
        .forEach((el) => (el.style.opacity = 1));
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    gsap.to(".article-kicker", { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", delay: 0.1 });
    gsap.to(".article-title", { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.25 });
    gsap.to(".article-dek", { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.4 });
    gsap.to(".article-tags", { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", delay: 0.55 });

    gsap.utils.toArray(".prose > *").forEach((el) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.7, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none reverse" },
      });
    });

    gsap.utils.toArray(".sec-head").forEach((head) => {
      gsap.timeline({ scrollTrigger: { trigger: head, start: "top 88%", toggleActions: "play none none reverse" } })
        .to(head, { opacity: 1, x: 0, y: 0, duration: 0.8, ease: "power3.out" })
        .to(head.querySelector(".rule"), { scaleX: 1, duration: 0.6, ease: "power2.out" }, "-=0.3");
    });

    gsap.to("#contour-svg", {
      yPercent: 30, ease: "none",
      scrollTrigger: { trigger: ".article-head", start: "top top", end: "bottom top", scrub: 1 },
    });

    gsap.timeline({ scrollTrigger: { trigger: "#footer", start: "top 85%", toggleActions: "play none none reverse" } })
      .to(".foot-cta", { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" })
      .to(".foot-links a", { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" }, "-=0.3")
      .to(".sign", { opacity: 1, duration: 0.6, ease: "power2.out" }, "-=0.2");
  }

  // failsafe for prose in case ScrollTrigger never fires
  setTimeout(() => {
    document.querySelectorAll(".prose > *").forEach((el) => {
      if (getComputedStyle(el).opacity === "0") el.style.opacity = 1;
    });
  }, 2500);

  window.addEventListener("load", () => {
    try { window.PageShell && PageShell.initParticles(); }
    catch (e) { const c = document.getElementById("particle-canvas"); if (c) c.style.display = "none"; }

    fillMeta();
    const heads = buildTOC();
    wireProgress();
    wireScrollSpy(heads);

    if (window.ArticlesUI) {
      ArticlesUI.wireTopbar();
      ArticlesUI.renderRelated();
    }

    initMotion();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
})();

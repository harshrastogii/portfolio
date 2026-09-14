/* ============================================================================
   APP.JS — every behaviour on the site, in one file, in load order.

   Principles:
   - Content is visible without JS. Reveal styles are gated behind `html.js`,
     which is set inline in the document head, so a failed script leaves a
     plain, complete, readable page rather than a blank one.
   - Nothing here assumes a library loaded. Lenis is optional; if the CDN is
     unreachable the page falls back to native scrolling and everything else
     still works.
   - Anything expensive is skipped on coarse pointers, narrow screens, or
     when the visitor has asked for reduced motion.
============================================================================ */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(pointer: coarse)").matches;
  var narrow = window.innerWidth < 860;

  /* ==========================================================================
     1. SMOOTH SCROLL
     Lenis drives a lerped scroll position. Anchor clicks are routed through it
     so in-page jumps ease rather than snap.
  ========================================================================== */
  var lenis = null;

  function initScroll() {
    if (reduced || !window.Lenis) { wireAnchors(null); return; }
    lenis = new window.Lenis({
      duration: 1.1,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      touchMultiplier: 1.6
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    wireAnchors(lenis);
  }

  function wireAnchors(l) {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (id === "#" || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (l) l.scrollTo(target, { offset: -90 });
      else target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", id);
    });
  }

  /* ==========================================================================
     2. NAV
     Three behaviours: the pill contracts and frosts past a threshold; the
     wordmark drops every non-initial character so "Harsh Rastogi" resolves to
     "H R"; and the pill flips its ink when it is sitting over a light band.
  ========================================================================== */
  function initNav() {
    var nav = document.querySelector(".nav");
    if (!nav) return;

    buildWordmark(nav.querySelector("[data-wordmark]"));
    buildRollLinks(nav);

    var lightZones = [].slice.call(document.querySelectorAll("[data-nav-light]"));
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY || window.pageYOffset;
      nav.classList.toggle("is-scrolled", y > 40);

      if (lightZones.length) {
        var probe = nav.getBoundingClientRect();
        var mid = probe.top + probe.height / 2;
        var onLight = lightZones.some(function (zone) {
          var r = zone.getBoundingClientRect();
          return r.top <= mid && r.bottom >= mid;
        });
        nav.classList.toggle("is-on-light", onLight);
      }
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }

  /* Wrap each character so the non-initials can collapse to zero width.
     Read from a data attribute rather than mutating text, so the accessible
     name stays "Harsh Rastogi" at every scroll position. */
  function buildWordmark(el) {
    if (!el) return;
    var text = el.getAttribute("data-wordmark");
    var frag = document.createDocumentFragment();
    var atWordStart = true;

    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      var span = document.createElement("span");
      span.setAttribute("aria-hidden", "true");
      if (ch === " ") {
        span.className = "nav__ch nav__ch--space";
        span.innerHTML = "&nbsp;";
        atWordStart = true;
      } else if (atWordStart) {
        span.className = "nav__ch";
        span.textContent = ch;
        atWordStart = false;
      } else {
        span.className = "nav__ch nav__ch--drop";
        span.textContent = ch;
      }
      frag.appendChild(span);
    }
    var sr = document.createElement("span");
    sr.className = "sr-only";
    sr.textContent = text;
    el.textContent = "";
    el.appendChild(sr);
    el.appendChild(frag);
  }

  /* Duplicate each nav label into a two-row slot so hover rolls it upward. */
  function buildRollLinks(nav) {
    nav.querySelectorAll("[data-roll]").forEach(function (a) {
      var label = a.textContent.trim();
      a.innerHTML =
        '<span class="nav__slot"><span>' + label + "</span><span>" + label + "</span></span>";
    });
  }

  /* ==========================================================================
     3. BUTTONS — the fill blob grows from wherever the pointer entered
  ========================================================================== */
  function initButtons() {
    document.querySelectorAll(".btn").forEach(function (btn) {
      if (btn.querySelector(".btn__blob")) return;
      var inner = btn.innerHTML;
      btn.innerHTML =
        '<span class="btn__blob"></span><span class="btn__content">' + inner + "</span>";
      var blob = btn.querySelector(".btn__blob");

      function place(e) {
        var r = btn.getBoundingClientRect();
        blob.style.left = (e.clientX - r.left) + "px";
        blob.style.top = (e.clientY - r.top) + "px";
      }
      btn.addEventListener("mouseenter", place);
      btn.addEventListener("mouseleave", place);
    });
  }

  /* ==========================================================================
     4. REVEALS
     One observer for everything. Elements carry data-reveal (fade + rise) or
     data-reveal-lines (each line clipped and slid up). Both are no-ops
     without JS because the styles are gated behind html.js.
  ========================================================================== */
  function initReveals() {
    var items = document.querySelectorAll("[data-reveal], [data-reveal-lines]");
    if (!items.length) return;

    document.querySelectorAll("[data-reveal-lines]").forEach(splitLines);

    if (!("IntersectionObserver" in window) || reduced) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        io.unobserve(en.target);
        settleAfter(en.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });

    items.forEach(function (el, i) {
      if (!el.style.getPropertyValue("--reveal-delay")) {
        var stagger = el.getAttribute("data-reveal-stagger");
        if (stagger) el.style.setProperty("--reveal-delay", (parseFloat(stagger) || 0) + "s");
      }
      io.observe(el);
    });
  }

  /* A transform transition keeps the element on its own compositor layer for
     as long as the transition is declared. Once it has played there is
     nothing left to animate, so the styles are dropped and the element folds
     back into the normal paint — one fewer layer per revealed element, which
     adds up on a long page. */
  function settleAfter(el) {
    var done = function () { el.classList.add("is-settled"); };
    el.addEventListener("transitionend", done, { once: true });
    setTimeout(done, 1600);
  }

  /* Wrap each visual line of a heading in a clip so it can slide up.
     Measured from the live layout, so it follows whatever the text wraps to. */
  function splitLines(el) {
    if (el.dataset.split === "done") return;
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = "";

    var probes = words.map(function (w, i) {
      var s = document.createElement("span");
      s.textContent = w;
      s.style.display = "inline-block";
      el.appendChild(s);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
      return s;
    });

    var lines = [], current = null, lastTop = null;
    probes.forEach(function (s) {
      var top = Math.round(s.offsetTop);
      if (lastTop === null || top !== lastTop) { current = []; lines.push(current); lastTop = top; }
      current.push(s.textContent);
    });

    el.textContent = "";
    lines.forEach(function (line, i) {
      var clip = document.createElement("span");
      clip.className = "line-clip";
      var inner = document.createElement("span");
      inner.className = "line-inner";
      inner.textContent = line.join(" ");
      inner.style.setProperty("--line-delay", (i * 0.07) + "s");
      clip.appendChild(inner);
      el.appendChild(clip);
    });
    el.dataset.split = "done";
  }

  /* ==========================================================================
     5. HERO — words rise out of their clips on load
  ========================================================================== */
  function initHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) return;
    hero.querySelectorAll(".word-inner").forEach(function (w, i) {
      w.style.setProperty("--word-delay", (0.15 + i * 0.045) + "s");
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { hero.classList.add("is-ready"); });
    });
    // the hero words are transformed too; release their layers once landed
    setTimeout(function () { hero.classList.add("is-settled"); }, 1600);
  }

  /* ==========================================================================
     6. MARQUEE — duplicate the track so the loop has no seam
  ========================================================================== */
  function initMarquee() {
    document.querySelectorAll("[data-marquee]").forEach(function (m) {
      var track = m.querySelector(".marquee__track");
      if (!track || track.dataset.doubled) return;
      /* Duplicate the items inside the one track rather than cloning the
         track. The loop then translates the track by exactly half its own
         width, which lands the second copy where the first began — no seam,
         and no dependence on the content happening to fill the viewport. */
      var items = [].slice.call(track.children);
      items.forEach(function (item) {
        var copy = item.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        track.appendChild(copy);
      });
      track.dataset.doubled = "1";
    });
  }

  /* ==========================================================================
     7. APPROACH STACK — the odometer counts along with the visible card
  ========================================================================== */
  function initStack() {
    var stack = document.querySelector("[data-stack]");
    if (!stack) return;
    var cards = [].slice.call(stack.querySelectorAll(".stack__card"));
    var col = stack.querySelector(".odo__col");
    if (!cards.length || !col) return;

    var ticking = false;
    function update() {
      ticking = false;
      /* The active card is the last one whose top edge has crossed a little
         past the middle of the viewport — by then it is the card the reader
         is actually looking at, even though the one beneath is still pinned. */
      // panels pin just above mid-screen, so that is where the count turns over
      var anchor = window.innerHeight * 0.34;
      var active = 0;
      cards.forEach(function (card, i) {
        if (card.getBoundingClientRect().top <= anchor) active = i;
      });
      /* The clip is one step tall, so the column moves by whole steps. The
         panels themselves need no transform: each one's background is the
         page colour, so sliding up wipes the one before it. */
      col.style.transform = "translateY(calc(" + (-active) + " * var(--space-7)))";
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ==========================================================================
     8. CURSOR PILL — follows the pointer while it is over a work card
  ========================================================================== */
  function initCursor() {
    if (coarse || reduced) return;
    var targets = document.querySelectorAll("[data-cursor]");
    if (!targets.length) return;

    var pill = document.createElement("div");
    pill.className = "cursor-pill";
    pill.setAttribute("aria-hidden", "true");
    document.body.appendChild(pill);

    var tx = 0, ty = 0, cx = 0, cy = 0, active = false, raf = null;

    function loop() {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      pill.style.transform =
        "translate(" + cx + "px," + cy + "px) translate(-50%,-50%) scale(" + (active ? 1 : 0.6) + ")";
      raf = active || Math.abs(tx - cx) > 0.5 ? requestAnimationFrame(loop) : null;
    }

    document.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!raf) { cx = tx; cy = ty; raf = requestAnimationFrame(loop); }
    }, { passive: true });

    targets.forEach(function (t) {
      t.addEventListener("mouseenter", function () {
        pill.textContent = t.getAttribute("data-cursor") || "View";
        active = true;
        pill.classList.add("is-visible");
        if (!raf) raf = requestAnimationFrame(loop);
      });
      t.addEventListener("mouseleave", function () {
        active = false;
        pill.classList.remove("is-visible");
      });
    });
  }

  /* ==========================================================================
     9. GRAIN
     One noise tile, repeated at 1:1 so the texture stays pixel-sized on any
     screen. Two earlier versions were worse: stretching a single canvas over
     the viewport scaled the texels into visible blocks, and swapping data
     URLs on an interval repainted a full-viewport layer several times a
     second. This generates the tile once and lets a stepped CSS animation
     shift its background-position, which the compositor handles on its own.
  ========================================================================== */
  function initGrain() {
    if (reduced) return;
    var host = document.querySelector("[data-grain]");
    if (!host) return;

    var TILE = 128, ALPHA = 20;
    var work = document.createElement("canvas");
    work.width = work.height = TILE;
    var ctx = work.getContext("2d");
    var img = ctx.createImageData(TILE, TILE);
    var d = img.data;

    for (var i = 0; i < d.length; i += 4) {
      var v = (Math.random() * 255) | 0;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = ALPHA;
    }
    ctx.putImageData(img, 0, 0);

    host.style.backgroundImage = "url(" + work.toDataURL("image/png") + ")";
    host.style.backgroundRepeat = "repeat";
    host.style.backgroundSize = TILE + "px " + TILE + "px";
    host.classList.add("is-animated");
  }

  /* ==========================================================================
     10. INTRO — the name, then the panel lifts away

     Shown on the first page of a visit only. Moving between pages after that
     is the curtain's job; replaying the intro on every click would be a toll
     booth rather than an entrance. The panel is in the markup but hidden
     until html.js is set, so it can never strand a visitor behind it.
  ========================================================================== */
  function initIntro() {
    var intro = document.getElementById("intro");
    if (!intro) return;

    var SEEN = "hr:intro-seen";
    var seen = false;
    try { seen = sessionStorage.getItem(SEEN) === "1"; } catch (e) { /* private mode */ }

    if (seen || reduced) {
      intro.classList.add("is-done");
      return;
    }

    // hold the page still underneath so the reveal is of a page at the top
    if (lenis) lenis.stop();
    document.documentElement.style.overflow = "hidden";

    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      try { sessionStorage.setItem(SEEN, "1"); } catch (e) {}
      document.documentElement.style.overflow = "";
      if (lenis) lenis.start();
      intro.classList.add("is-leaving");
      setTimeout(function () { intro.classList.add("is-done"); }, 1100);
    }

    // let the name sit for a beat, and don't lift before the fonts have
    // settled or the reveal lands on a page that is still reflowing
    var hold = new Promise(function (r) { setTimeout(r, 900); });
    var fonts = document.fonts && document.fonts.ready
      ? document.fonts.ready
      : Promise.resolve();

    Promise.all([hold, fonts]).then(function () { setTimeout(finish, 120); });
    setTimeout(finish, 3500); // never trap the page on a slow font
  }

  /* ==========================================================================
     11. PAGE CURTAIN — a panel wipes up over the old page, down off the new
  ========================================================================== */
  function initCurtain() {
    var curtain = document.querySelector("[data-curtain]");
    if (!curtain || reduced) return;

    document.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (!a) return;
      var href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      if (a.hostname && a.hostname !== window.location.hostname) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

      e.preventDefault();
      curtain.classList.add("is-entering");
      setTimeout(function () { window.location.href = href; }, 520);
    });

    // coming back via the bfcache should not leave the curtain drawn
    window.addEventListener("pageshow", function (ev) {
      if (ev.persisted) curtain.className = "curtain";
    });
  }

  /* ==========================================================================
     BOOT
  ========================================================================== */
  function boot() {
    // tells the head's safety timer that the scripts are alive
    document.documentElement.setAttribute("data-booted", "");
    initScroll();
    initNav();
    initButtons();
    initHero();
    initMarquee();
    initStack();
    initCursor();
    initGrain();
    initIntro();
    initCurtain();
    // reveals run last so any markup the other modules injected is observed
    initReveals();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.Site = {
    get lenis() { return lenis; },
    refreshReveals: initReveals,
    refreshButtons: initButtons,
    refreshCursor: initCursor
  };
})();

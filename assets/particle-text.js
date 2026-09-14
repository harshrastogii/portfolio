/* ============================================================================
   PARTICLE-TEXT.JS
   One word in a heading becomes a field of dots that drift continuously, flee
   the cursor, and spring back.

   The real text stays in the DOM the whole time — it is what screen readers
   announce, what search engines index, and what renders if this script never
   runs. The canvas only takes over (and the text only fades out) once dots
   have actually been sampled.

   The simulation below is a faithful port of the reference implementation
   this site's hero was modelled on, which runs the same maths in a WebGL
   point cloud. Everything here is in CSS pixels instead of world units, so
   the constants that were expressed as fractions of the element height stay
   fractions of the element height, and the two that were world-space
   accelerations are divided through by the same px-per-world-unit factor.
   Getting this right matters more than it looks: the character of the effect
   lives almost entirely in the numbers.

   The parts that are easy to get wrong, and why they matter:
   - Sampling is a strict 2px grid, not a jittered one. The dots are wider
     than the grid pitch, so they fuse into strokes and fray at the edges on
     their own. Jittering the sample points instead produces mush.
   - Every dot oscillates forever on its own frequency and phase. Without it
     the word sits dead on the page between cursor passes.
   - The repel radius is small — 0.6 of the element height. A large radius
     blows the whole word apart; this punches a tight hole and leaves the
     rest legible.
   - The force is applied to each dot's *displaced* position, not its home,
     which is what makes dots pile into a ring rather than scatter evenly.
============================================================================ */
(function () {
  "use strict";

  /* --- constants, named as in the original ------------------------------ */
  var PAD_RATIO     = 0.4;    // canvas bleed each side, as a fraction of elH
  var SAMPLE_STEP   = 2;      // sampling pitch in CSS px
  var ALPHA_CUTOFF  = 128;
  var REPEL_RATIO   = 0.6;    // repel radius, as a fraction of elH
  var REPEL_FORCE   = 100;    // acceleration at the centre, in world units/s²
  var REPEL_SPRING  = 20;     // pull back toward home
  var REPEL_DAMP    = 3.5;    // velocity decay exponent
  var BOOST_DECAY   = 4;      // how fast the size bump fades
  var APPROACH      = 4.5;    // easing toward the sampled target
  var WOBBLE_AMP    = 0.045;  // ambient drift amplitude, in world units
  var WOBBLE_FREQ   = 8;      // base angular frequency
  /* Dot diameter, as a fraction of the element height. The original sets
     this indirectly through a WebGL point size and a perspective divide, so
     it was calibrated instead: at this value the rendered word matches the
     reference on ink coverage (~27%), on dot diameter relative to the ink
     box (~0.057) and on the share of a stroke that is ink rather than gap
     (~0.49) — which together are what decide whether the strokes read as
     chains of dots or as a solid slab. Recalibrated when the renderer moved
     from a feathered sprite to a hard-edged arc: the old sprite's soft rim
     fell below the measuring threshold, so the same nominal radius covers
     noticeably more ground now. */
  var DOT_RATIO     = 0.029;
  /* Random z per dot, as a fraction of the element height. The original uses
     0.25. Its depth becomes a radial offset under perspective, so the scatter
     grows with distance from the centre of the word — which means the same
     number frays a long word far more than a short one. Their hero word is
     five characters; scale that up to ten and the ends blow apart. This is
     scaled down so the scatter lands at the same number of pixels the
     original produces, rather than the same proportion. */
  var DEPTH_SPREAD  = 0.25;
  var DEPTH_REF_W   = 260;    // the word width the original was tuned against
  var CAM_DISTANCE  = 5;      // camera distance in world units
  var SPAWN_RISE    = 0.4;    // seconds for a dot to pop in
  var SPAWN_SETTLE  = 0.45;   // seconds for it to fall back from the overshoot
  var SPAWN_PEAK    = 2.6;    // how far past full size it overshoots
  var LETTER_STAGGER = 0.1;   // seconds between letters lighting up
  var MAX_DOTS      = 9000;

  /* The original works in a perspective camera's world units: the canvas
     height spans `10 * tan(25°)` of them. Two constants above are expressed
     in those units, so this is the factor that brings them into pixels. */
  var WORLD_SPAN = 10 * Math.tan(25 * Math.PI / 180);
  var TAU = Math.PI * 2;

  function supported() {
    if (!window.matchMedia) return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    if (window.matchMedia("(pointer: coarse)").matches) return false;
    if (window.innerWidth < 760) return false;
    return true;
  }

  /* True while anything between the source and the root still carries a
     transform, i.e. the entrance animation has not settled. */
  function hasLiveTransform(from, to) {
    var node = from;
    while (node && node !== to.parentNode) {
      var t = getComputedStyle(node).transform;
      if (t && t !== "none" && t !== "matrix(1, 0, 0, 1, 0, 0)") return true;
      node = node.parentNode;
    }
    return false;
  }

  /* Where the text baseline sits inside the element, measured rather than
     derived. Font metrics vary per face and per weight, and a baseline
     guessed from the font size lands the dots visibly off the line. */
  function baselineOffset(el) {
    var probe = document.createElement("span");
    probe.style.cssText =
      "display:inline-block;width:0;height:0;vertical-align:baseline;";
    el.appendChild(probe);
    var y = probe.getBoundingClientRect().top - el.getBoundingClientRect().top;
    el.removeChild(probe);
    return y;
  }

  function ParticleWord(root) {
    this.root = root;
    this.source = root.querySelector("[data-particle-source]");
    this.holder = null;
    this.canvas = null;
    this.ctx = null;
    this.p = null;              // the particle arrays
    this.pointer = { x: -99999, y: -99999 };
    this.raf = null;
    this.running = false;
    this.startedAt = null;
    this.lastT = null;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
  }

  ParticleWord.prototype.isMoving = function () {
    return hasLiveTransform(this.source, this.root);
  };

  ParticleWord.prototype.build = function () {
    var rect = this.source.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    if (this.isMoving()) return false;

    var elW = rect.width;
    var elH = rect.height;
    var pad = Math.round(PAD_RATIO * elH);
    var w = Math.round(elW + pad * 2);
    var h = Math.round(elH + pad * 2);

    if (!this.holder) {
      this.holder = document.createElement("div");
      this.holder.className = "particle-word__canvas";
      this.canvas = document.createElement("canvas");
      this.holder.appendChild(this.canvas);
      this.root.appendChild(this.holder);
      this.ctx = this.canvas.getContext("2d");
    }

    /* The source sits a couple of wrappers deep inside the reveal clip, which
       carries its own padding. Measure the real offset rather than assuming
       the source starts at the root's origin. */
    var rootRect = this.root.getBoundingClientRect();
    this.holder.style.top = (rect.top - rootRect.top - pad) + "px";
    this.holder.style.left = (rect.left - rootRect.left - pad) + "px";
    this.holder.style.width = w + "px";
    this.holder.style.height = h + "px";
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = w + "px";
    this.canvas.style.height = h + "px";

    this.elW = elW; this.elH = elH; this.pad = pad; this.w = w; this.h = h;

    // px per world unit, so the two world-space constants can be converted
    this.pxPerWorld = h / WORLD_SPAN;

    var pts = this.sample();
    if (!pts) return false;
    this.seed(pts);
    this.startedAt = null;
    this.lastT = null;
    return this.p.count > 0;
  };

  /* Draw the word offscreen at its computed style, then read back the ink. */
  ParticleWord.prototype.sample = function () {
    var cs = getComputedStyle(this.source);
    var dpr = this.dpr;
    var text = this.source.textContent;
    var pad = this.pad;

    var off = document.createElement("canvas");
    off.width = Math.round(this.w * dpr);
    off.height = Math.round(this.h * dpr);
    var g = off.getContext("2d", { willReadFrequently: true });

    g.scale(dpr, dpr);
    g.fillStyle = "#fff";
    g.font = cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
    g.textAlign = "center";
    g.textBaseline = "alphabetic";
    try { g.letterSpacing = cs.letterSpacing; } catch (e) { /* older engines */ }

    /* Canvas text metrics and DOM text metrics disagree slightly — tracking,
       kerning and subpixel rounding all differ. Scaling the drawn word to the
       element's measured width makes the dots line up with where the real
       text was, instead of drifting a few pixels wider or narrower. */
    var measured = g.measureText(text).width;
    var scaleX = measured > 0 ? this.elW / measured : 1;
    var baseY = pad + baselineOffset(this.source);

    g.save();
    g.translate(pad + this.elW / 2, 0);
    g.scale(scaleX, 1);
    g.fillText(text, 0, baseY);
    g.restore();

    /* Where each letter starts, so dots can light up left to right. */
    var n = text.length;
    var originX = pad + this.elW / 2;
    var edges = new Float32Array(n + 1);
    for (var c = 0; c <= n; c++) {
      edges[c] = originX + scaleX * (g.measureText(text.slice(0, c)).width - measured / 2);
    }

    var data;
    try {
      data = g.getImageData(0, 0, off.width, off.height).data;
    } catch (e) {
      return null; // tainted canvas; fall back to plain text
    }

    var step = Math.max(1, Math.round(SAMPLE_STEP * dpr));
    var xs = [], ys = [], li = [];

    for (var y = 0; y < off.height; y += step) {
      for (var x = 0; x < off.width; x += step) {
        if (data[(y * off.width + x) * 4 + 3] > ALPHA_CUTOFF) {
          var px = x / dpr, py = y / dpr;
          xs.push(px);
          ys.push(py);
          var idx = n - 1;
          for (var k = 1; k < edges.length; k++) {
            if (px < edges[k]) { idx = k - 1; break; }
          }
          li.push(idx);
        }
      }
    }
    if (!xs.length) return null;
    return { xs: xs, ys: ys, li: li, color: cs.color };
  };

  /* Give every dot its home, its own drift frequencies and phase, its size,
     and the moment it is allowed to appear. */
  ParticleWord.prototype.seed = function (pts) {
    var count = Math.min(pts.xs.length, MAX_DOTS);
    var stride = pts.xs.length / count;

    var p = {
      count: count,
      hx: new Float32Array(count), hy: new Float32Array(count),
      x:  new Float32Array(count), y:  new Float32Array(count),
      ox: new Float32Array(count), oy: new Float32Array(count),   // repel offset
      vx: new Float32Array(count), vy: new Float32Array(count),   // repel velocity
      phase: new Float32Array(count),
      freqX: new Float32Array(count), freqY: new Float32Array(count),
      amp:   new Float32Array(count),
      size:  new Float32Array(count),
      persp: new Float32Array(count),
      boost: new Float32Array(count),
      spawn: new Float32Array(count),
      delay: new Float32Array(count)
    };

    var dotBase = this.elH * DOT_RATIO;
    // hold the scatter to a fixed pixel budget however long the word is
    var depthTrim = Math.min(1, DEPTH_REF_W / Math.max(this.elW, 1));

    for (var i = 0; i < count; i++) {
      var s = Math.floor(i * stride);
      p.hx[i] = p.x[i] = pts.xs[s];
      p.hy[i] = p.y[i] = pts.ys[s];
      p.phase[i] = Math.random() * Math.PI * 2;
      p.freqX[i] = WOBBLE_FREQ * (0.6 + 0.8 * Math.random());
      p.freqY[i] = WOBBLE_FREQ * (0.6 + 0.8 * Math.random());
      p.amp[i]   = 0.6 + 0.8 * Math.random();
      p.size[i]  = dotBase * (0.9 + 0.7 * Math.random());
      p.delay[i] = LETTER_STAGGER * pts.li[s] + 0.05 * Math.random();

      /* The original scatters dots through a shallow slab of depth and lets
         a perspective camera do the rest. That depth is doing real work: a
         dot nearer the camera projects further from the centre of frame and
         draws slightly larger, so the field frays at the edges and the dot
         sizes vary. Flattening it to 2D — as a first port of this did — packs
         every dot exactly onto the glyph and the word fuses into a solid
         slab. Here the projection is precomputed per dot, since the camera
         never moves. */
      var z = (Math.random() - 0.5) * this.elH * DEPTH_SPREAD * depthTrim / this.pxPerWorld;
      p.persp[i] = CAM_DISTANCE / (CAM_DISTANCE - z);
    }

    this.p = p;
    this.color = pts.color;
  };

  ParticleWord.prototype.frame = function (now) {
    var p = this.p;
    if (!p) return;

    var t = now / 1000;
    if (this.startedAt === null) { this.startedAt = t; this.lastT = t; }
    var dt = Math.min(t - this.lastT, 1 / 30);
    this.lastT = t;
    var age = t - this.startedAt;

    var approach = 1 - Math.exp(-APPROACH * dt);
    var damp = Math.exp(-REPEL_DAMP * dt);
    var boostDecay = 1 - Math.exp(-BOOST_DECAY * dt);

    var repelR = this.elH * REPEL_RATIO;
    var force = REPEL_FORCE * this.pxPerWorld;
    var wobble = WOBBLE_AMP * this.pxPerWorld;

    var mx = this.pointer.x, my = this.pointer.y;
    var ctx = this.ctx, dpr = this.dpr;
    var cx = this.w / 2, cy = this.h / 2;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);

    /* Every dot goes into one path and is filled in a single call. The first
       version stamped a pre-rendered sprite per dot, but a 64px sprite scaled
       down to about five pixels is resampled into a soft blob, and at this
       size that softness is most of the dot — the field reads as dust rather
       than as circles. Canvas antialiasing on a real arc gives the crisp edge
       a GPU point sprite has. */
    ctx.fillStyle = this.color;
    ctx.beginPath();

    for (var i = 0; i < p.count; i++) {
      // ease toward the sampled home, so a re-measure glides rather than jumps
      p.x[i] += (p.hx[i] - p.x[i]) * approach;
      p.y[i] += (p.hy[i] - p.y[i]) * approach;

      // entrance: pop in past full size, then settle back to it
      var a = age - p.delay[i];
      if (a <= 0) {
        p.spawn[i] = 0;
      } else if (a < SPAWN_RISE) {
        var u = a / SPAWN_RISE;
        p.spawn[i] = SPAWN_PEAK * (u * u * (3 - 2 * u));
      } else {
        var v = Math.min(1, (a - SPAWN_RISE) / SPAWN_SETTLE);
        p.spawn[i] = 1 + (SPAWN_PEAK - 1) * (1 - v * v * (3 - 2 * v));
      }

      // repulsion, measured from where the dot actually is right now
      var dx = p.x[i] + p.ox[i] - mx;
      var dy = p.y[i] + p.oy[i] - my;
      var d = Math.sqrt(dx * dx + dy * dy);

      if (d < repelR && d > 1e-4) {
        var k = 1 - d / repelR;
        var f = k * k * force;
        p.vx[i] += (dx / d) * f * dt;
        p.vy[i] += (dy / d) * f * dt;
        if (k > p.boost[i]) p.boost[i] = k;
      }
      p.vx[i] -= REPEL_SPRING * p.ox[i] * dt;
      p.vy[i] -= REPEL_SPRING * p.oy[i] * dt;
      p.vx[i] *= damp;
      p.vy[i] *= damp;
      p.ox[i] += p.vx[i] * dt;
      p.oy[i] += p.vy[i] * dt;

      p.boost[i] += (0 - p.boost[i]) * boostDecay;

      // the drift that never stops
      var amp = wobble * p.amp[i];
      var wx = amp * Math.sin(t * p.freqX[i] + p.phase[i]);
      var wy = amp * Math.cos(t * p.freqY[i] + p.phase[i]);

      var pr = p.persp[i];
      var r = p.size[i] * p.spawn[i] * (1 + p.boost[i]) * pr * 0.5;
      if (r <= 0.05) continue;

      // project about the centre of frame, exactly as the camera would
      var sx = cx + (p.x[i] + p.ox[i] + wx - cx) * pr;
      var sy = cy + (p.y[i] + p.oy[i] + wy - cy) * pr;

      ctx.moveTo(sx + r, sy);
      ctx.arc(sx, sy, r, 0, TAU);
    }
    ctx.fill();

    this.raf = requestAnimationFrame(this.boundFrame);
  };

  ParticleWord.prototype.start = function () {
    if (this.running) return;
    // the reveal clip would shear the dot bleed, so open it before measuring
    this.root.classList.add("is-live");
    if (!this.build()) { this.root.classList.remove("is-live"); return; }
    this.running = true;
    this.boundFrame = this.frame.bind(this);
    // a handle on the element, so the simulation can be inspected or stepped
    // by hand when debugging (the rAF loop pauses in a backgrounded tab)
    this.root.__particleWord = this;

    var self = this;
    this._move = function (e) {
      var box = self.holder.getBoundingClientRect();
      self.pointer.x = e.clientX - box.left;
      self.pointer.y = e.clientY - box.top;
    };
    this._leave = function () { self.pointer.x = -99999; self.pointer.y = -99999; };

    window.addEventListener("mousemove", this._move, { passive: true });
    window.addEventListener("blur", this._leave);

    function play() {
      if (!self.raf) { self.lastT = null; self.startedAt = self.startedAt; self.raf = requestAnimationFrame(self.boundFrame); }
    }
    function pause() {
      if (self.raf) { cancelAnimationFrame(self.raf); self.raf = null; self.lastT = null; }
    }
    this._play = play; this._pause = pause;

    // don't burn frames on a word that is off screen or in a hidden tab
    var onScreen = true;
    if ("IntersectionObserver" in window) {
      this._io = new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        onScreen && !document.hidden ? play() : pause();
      }, { rootMargin: "100px" });
      this._io.observe(this.root);
    }
    this._vis = function () { onScreen && !document.hidden ? play() : pause(); };
    document.addEventListener("visibilitychange", this._vis);
    play();

    /* Re-sample whenever the word's box changes — a resize, a late webfont, a
       stylesheet arriving after first paint. Without this the canvas keeps
       painting at a position the text no longer occupies. */
    this._remeasure = debounce(function () {
      var wasRunning = !!self.raf;
      pause();
      if (self.build() && wasRunning) play();
    }, 180);
    window.addEventListener("resize", this._remeasure);

    if ("ResizeObserver" in window) {
      var first = true, lw = 0, lh = 0;
      this._ro = new ResizeObserver(function (entries) {
        var r = entries[0] && entries[0].contentRect;
        if (!r) return;
        if (first) { first = false; lw = r.width; lh = r.height; return; }
        if (Math.abs(r.width - lw) < 2 && Math.abs(r.height - lh) < 2) return;
        lw = r.width; lh = r.height;
        self._remeasure();
      });
      this._ro.observe(this.source);
    }
  };

  function debounce(fn, ms) {
    var t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  function init() {
    if (!supported()) return;
    var roots = document.querySelectorAll("[data-particle-word]");
    if (!roots.length) return;

    var start = function () {
      Array.prototype.forEach.call(roots, function (root) {
        var inner = root.querySelector(".word-inner");
        var word = new ParticleWord(root);
        var attempts = 0;

        /* Sampling depends on the word having reached its final position and
           final metrics, and there are several ways that can still be untrue
           at the moment we look: a webfont that swaps late, a stylesheet that
           arrives after first paint, an entrance transition that has not
           finished. Rather than try to enumerate them, just retry — start()
           is cheap and a no-op once it has succeeded. */
        function attempt() {
          if (word.running) return;
          word.start();
          if (!word.running && ++attempts < 8) setTimeout(attempt, 250 * attempts);
        }

        if (inner) {
          inner.addEventListener("transitionend", function (e) {
            if (e.propertyName === "transform") attempt();
          });
        }
        setTimeout(attempt, 1400);
        window.addEventListener("load", function () { setTimeout(attempt, 120); });
      });
    };

    // wait for the webfont, or the sampled glyphs are the fallback face
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { setTimeout(start, 60); });
    } else {
      window.addEventListener("load", start);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

/*
  Tree Measure Pro — script comun pentru index, support și privacy.

  Se încarcă în <head> (nu `defer`): limba trebuie hotărâtă înainte de prima randare, altfel
  pagina clipește în limba greșită. Restul așteaptă DOMContentLoaded.

  Limba implicită urmează regula aplicației (LanguageManager.defaultLanguage): româna doar dacă
  e prima limbă preferată a browserului, engleza în rest. Prioritate: ?lang= din URL →
  alegerea salvată → browserul.
*/
(function () {
  "use strict";

  var KEY = "tmp-lang";
  var root = document.documentElement;

  function valid(l) { return l === "ro" || l === "en"; }

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function remember(l) {
    try { localStorage.setItem(KEY, l); } catch (e) { /* fereastră privată etc. */ }
  }

  function initialLang() {
    var q = null;
    try { q = new URLSearchParams(location.search).get("lang"); } catch (e) {}
    if (valid(q)) return q;
    var s = stored();
    if (valid(s)) return s;
    var first = (navigator.languages && navigator.languages[0]) || navigator.language || "en";
    return first.toLowerCase().indexOf("ro") === 0 ? "ro" : "en";
  }

  root.lang = initialLang();
  root.classList.add("js");

  function syncControls() {
    var l = root.lang;
    document.querySelectorAll("[data-set-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-set-lang") === l));
    });
    var skip = document.querySelector(".skip-link");
    if (skip) {
      skip.textContent = l === "en" ? "Skip to content" : "Sari la conținut";
      var target = skip.getAttribute("data-target-" + l);
      if (target) skip.setAttribute("href", target);
    }
    var title = root.getAttribute("data-title-" + l);
    if (title) document.title = title;
  }

  function setLang(l) {
    if (!valid(l)) return;
    root.lang = l;
    remember(l);
    // Un <video> ascuns cu display:none continuă să cânte; fiecare limbă are copia ei.
    document.querySelectorAll("video").forEach(function (v) { if (!v.paused) v.pause(); });
    syncControls();
    revealVisible();
  }

  var observer = null;

  /* Un element apare, apoi i se scoate clasa de animație: altfel tranziția ei (cu întârzierea
     de apariție) ar rămâne și peste efectele de hover. */
  function show(el) {
    el.classList.add("in");
    var delay = parseFloat(el.style.getPropertyValue("--d")) || 0;
    setTimeout(function () {
      el.classList.remove("reveal", "in");
      el.style.removeProperty("--d");
    }, delay * 1000 + 900);
    countUp(el);
  }

  function revealVisible() {
    document.querySelectorAll(".reveal:not(.in)").forEach(function (el) {
      var r = el.getBoundingClientRect();
      var visibleX = r.right > 0 && r.left < window.innerWidth;
      if (r.top < window.innerHeight - 40 && r.bottom > 0 && visibleX) show(el);
    });
  }

  /* Cardurile dintr-o grilă apar pe rând, nu toate deodată. */
  function staggerChildren() {
    document.querySelectorAll(".modules, .features, .steps, .outputs, .readout, .gallery").forEach(function (box) {
      var group = box.closest(".group.reveal");
      if (group) {
        group.classList.remove("reveal");
        var head = group.querySelector(".group-head");
        if (head) head.classList.add("reveal");
      }
      box.classList.remove("reveal");
      Array.prototype.forEach.call(box.children, function (el, i) {
        el.classList.add("reveal");
        el.style.setProperty("--d", (Math.min(i, 6) * 0.08).toFixed(2) + "s");
      });
    });
  }

  /* Cifrele din banda de sub hero cresc de la zero când intră în ecran. */
  function countUp(root) {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    root.querySelectorAll(".r-val").forEach(function (el) {
      var target = el.textContent.trim();
      if (!/^\d+$/.test(target) || el.dataset.counted) return;
      el.dataset.counted = "1";
      var end = parseInt(target, 10), t0 = null, dur = 1100;
      function step(t) {
        if (t0 === null) t0 = t;
        var k = Math.min(1, (t - t0) / dur);
        el.textContent = String(Math.round(end * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(step); else el.textContent = target;
      }
      requestAnimationFrame(step);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-set-lang]").forEach(function (b) {
      b.addEventListener("click", function () { setLang(b.getAttribute("data-set-lang")); });
    });
    syncControls();

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      // Animațiile SVG (SMIL) nu ascultă de CSS: le oprim explicit, pe un cadru în care
      // desenul e „așezat” (caliperele fixate, bula în inel), nu pe primul cadru.
      document.querySelectorAll("svg").forEach(function (svg) {
        if (!svg.pauseAnimations) return;
        try { svg.setCurrentTime(2.4); svg.pauseAnimations(); } catch (e) {}
      });
    }

    staggerChildren();

    if (reduce || !("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
    } else {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          show(e.target);
          observer.unobserve(e.target);
        });
      }, { threshold: 0.08 });
      document.querySelectorAll(".reveal").forEach(function (el) { observer.observe(el); });
      revealVisible();
    }

    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  });
})();

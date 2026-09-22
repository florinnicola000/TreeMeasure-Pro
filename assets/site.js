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
    syncControls();
    revealVisible();
  }

  var observer = null;
  function revealVisible() {
    document.querySelectorAll(".reveal:not(.in)").forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight - 40 && r.bottom > 0) el.classList.add("in");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-set-lang]").forEach(function (b) {
      b.addEventListener("click", function () { setLang(b.getAttribute("data-set-lang")); });
    });
    syncControls();

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
    } else {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); observer.unobserve(e.target); }
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

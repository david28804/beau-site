/* ==========================================================================
   B.E.A.U — Interactions du site
   ========================================================================== */
(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- En-tête : ombre au défilement ---------- */
  const header = $(".header");
  const toTop = $(".to-top");
  const onScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle("is-scrolled", y > 10);
    if (toTop) toTop.classList.toggle("is-visible", y > 600);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  /* ---------- Menu hamburger ---------- */
  const burger = $(".burger");
  const nav = $("#nav");
  if (burger && nav) {
    const setOpen = (open) => {
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
    };
    burger.addEventListener("click", () => setOpen(burger.getAttribute("aria-expanded") !== "true"));
    $$("a", nav).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
    window.addEventListener("resize", () => { if (window.innerWidth > 960) setOpen(false); });
  }

  /* ---------- Animations au défilement ---------- */
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Compteurs (chiffres clés) ---------- */
  const counters = $$("[data-count]");
  const animateCounter = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || "";
    const prefix = el.dataset.prefix || "";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { el.textContent = prefix + target + suffix; return; }
    const duration = 1600;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (counters.length && "IntersectionObserver" in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { animateCounter(entry.target); cio.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach((c) => cio.observe(c));
  } else {
    counters.forEach((c) => { c.textContent = (c.dataset.prefix || "") + c.dataset.count + (c.dataset.suffix || ""); });
  }

  /* ---------- Filtres de la galerie ---------- */
  const filterBtns = $$(".filter-btn");
  const items = $$(".project-item");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.filter;
      filterBtns.forEach((b) => { b.classList.toggle("is-active", b === btn); b.setAttribute("aria-pressed", String(b === btn)); });
      items.forEach((item) => {
        const show = f === "all" || item.dataset.category === f;
        item.classList.toggle("is-hidden", !show);
        if (show) { item.classList.remove("is-visible"); void item.offsetWidth; item.classList.add("is-visible"); }
      });
    });
  });

  /* ---------- Fenêtre de détail d'un projet ---------- */
  const modal = $("#project-modal");
  if (modal) {
    let lastFocus = null;
    const fields = {
      img: $("[data-modal-img]", modal),
      title: $("[data-modal-title]", modal),
      place: $("[data-modal-place]", modal),
      year: $("[data-modal-year]", modal),
      domain: $("[data-modal-domain]", modal),
      client: $("[data-modal-client]", modal),
      desc: $("[data-modal-desc]", modal),
    };
    const open = (card) => {
      const d = card.dataset;
      fields.img.src = d.img;
      fields.img.alt = d.title;
      fields.title.textContent = d.title;
      fields.place.textContent = d.place;
      fields.year.textContent = d.year;
      fields.domain.textContent = d.domain;
      fields.client.textContent = d.client || "—";
      fields.desc.textContent = d.desc;
      lastFocus = document.activeElement;
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      $(".modal__close", modal).focus();
    };
    const close = () => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    };
    $$("[data-project]").forEach((card) => card.addEventListener("click", () => open(card)));
    modal.addEventListener("click", (e) => { if (e.target === modal || e.target.closest(".modal__close")) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.classList.contains("is-open")) close(); });
  }

  /* ---------- Comparateur avant / après ---------- */
  $$(".ba").forEach((ba) => {
    const range = $(".ba__range", ba);
    if (!range) return;
    const update = () => ba.style.setProperty("--pos", range.value + "%");
    range.addEventListener("input", update);
    update();
  });

  /* ---------- Formulaire de contact ---------- */
  const form = $("#contact-form");
  if (form) {
    const status = $(".form-status", form);
    const submitBtn = $("button[type=submit]", form);
    const icons = {
      ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg>',
      err: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>',
    };
    const rules = {
      nom: (v) => v.trim().length >= 2 || "Veuillez indiquer votre nom et prénom.",
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "Veuillez saisir une adresse e-mail valide.",
      telephone: (v) => v.trim() === "" || /^[+0-9 ().-]{6,20}$/.test(v.trim()) || "Numéro de téléphone invalide.",
      sujet: (v) => v.trim() !== "" || "Veuillez choisir le sujet de votre demande.",
      message: (v) => v.trim().length >= 10 || "Votre message doit contenir au moins 10 caractères.",
      consentement: (_, el) => el.checked || "Merci d'accepter le traitement de vos données.",
    };
    const validateField = (el) => {
      const rule = rules[el.name];
      if (!rule) return true;
      const res = rule(el.value, el);
      const field = el.closest(".field") || el.closest(".consent");
      const errEl = field && $(".field__error", field.closest(".field") || field.parentElement);
      const ok = res === true;
      if (field) field.classList.toggle("has-error", !ok);
      el.setAttribute("aria-invalid", String(!ok));
      if (errEl) errEl.textContent = ok ? "" : res;
      return ok;
    };
    $$("input, select, textarea", form).forEach((el) => {
      el.addEventListener("blur", () => validateField(el));
      el.addEventListener("input", () => { if (el.getAttribute("aria-invalid") === "true") validateField(el); });
    });

    const showStatus = (type, html) => {
      status.className = "form-status is-" + type;
      status.innerHTML = (type === "success" ? icons.ok : icons.err) + "<div>" + html + "</div>";
      status.setAttribute("tabindex", "-1");
      status.focus({ preventScroll: true });
      status.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fieldsToCheck = $$("input, select, textarea", form).filter((el) => rules[el.name]);
      const allOk = fieldsToCheck.map(validateField).every(Boolean);
      if (!allOk) {
        const firstErr = $("[aria-invalid=true]", form);
        if (firstErr) firstErr.focus();
        return;
      }

      const label = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.textContent = "Envoi en cours…";
      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          form.reset();
          showStatus("success", "<strong>Merci, votre demande a bien été envoyée.</strong><br>Notre équipe vous répondra dans les meilleurs délais (sous 48 h ouvrées).");
        } else {
          showStatus("error", data.message || "Une erreur est survenue. Veuillez réessayer ou nous écrire directement à <a href=\"mailto:contact@beau-urbanisme.com\">contact@beau-urbanisme.com</a>.");
        }
      } catch (err) {
        showStatus("error", "Impossible de joindre le serveur pour le moment. Veuillez réessayer ou nous écrire à <a href=\"mailto:contact@beau-urbanisme.com\">contact@beau-urbanisme.com</a>.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = label;
      }
    });
  }

  /* ---------- Année du pied de page ---------- */
  $$("[data-current-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
})();

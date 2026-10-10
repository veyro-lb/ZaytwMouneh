/* Google Reviews invitation: genuine, non-incentivized feedback only. */
(function () {
  "use strict";
  if (window.__ZWM_GOOGLE_REVIEW_INVITE__) return;
  window.__ZWM_GOOGLE_REVIEW_INVITE__ = true;

  // Existing official business listing link, already used by the storefront.
  // Replace with the Business Profile's official "Ask for reviews" link when available.
  var GOOGLE_LISTING = "https://www.google.com/maps/place/JC9Q%2BQ7X+Zayt+w+Mouneh,+Sebline/data=!4m2!3m1!1s0x151ee5003a80dda9:0xfd1d4309d0331f15!18m1!1e1?utm_source=mstt_1&entry=gps";
  var STORAGE_UNTIL = "zwm:google-review-invite:until:v1";
  var SESSION_START = "zwm:google-review-invite:session-start:v1";
  var SESSION_ENGAGED = "zwm:google-review-invite:engaged:v1";
  var WAIT_MS = 85000;
  var DAY = 86400000;
  var langs = {
    en: {
      eyebrow: "A NOTE FROM OUR FAMILY", title: "Your experience matters.",
      description: "Have you shopped with Zayt w Mouneh? Share your honest experience on Google and help other customers discover us.",
      primary: "Review us on Google", later: "Maybe later", close: "Close review invitation",
      footerTitle: "Have you enjoyed Zayt w Mouneh?", footerLink: "Share a Google review",
      footerHint: "Genuine customer experiences help our family business grow."
    },
    ar: {
      eyebrow: "رسالة من عائلة زيت ومونة", title: "رأيك بيهمّنا.",
      description: "سبق وتسوّقت من زيت ومونة؟ شارك تجربتك الصادقة على Google وساعد غيرك يتعرّف علينا.",
      primary: "قيّمنا على Google", later: "ربما لاحقاً", close: "إغلاق دعوة التقييم",
      footerTitle: "كيف كانت تجربتك مع زيت ومونة؟", footerLink: "شارك تقييمك على Google",
      footerHint: "تجارب الزبائن الحقيقية بتساعد مشروعنا العائلي يكبر."
    },
    fr: {
      eyebrow: "UN MOT DE NOTRE FAMILLE", title: "Votre avis compte.",
      description: "Vous avez déjà commandé chez Zayt w Mouneh ? Partagez votre expérience sincère sur Google pour aider d'autres clients à nous découvrir.",
      primary: "Donner un avis sur Google", later: "Peut-être plus tard", close: "Fermer l'invitation",
      footerTitle: "Vous aimez Zayt w Mouneh ?", footerLink: "Partager un avis Google",
      footerHint: "Les expériences authentiques soutiennent notre entreprise familiale."
    }
  };

  function language() {
    try {
      if (window.ZWM_LOCALE && typeof window.ZWM_LOCALE.get === "function") {
        var code = window.ZWM_LOCALE.get();
        if (langs[code]) return code;
      }
      var stored = localStorage.getItem("zwm-locale-v3");
      if (langs[stored]) return stored;
    } catch (error) {}
    var htmlLang = (document.documentElement.lang || "en").slice(0, 2);
    return langs[htmlLang] ? htmlLang : "en";
  }
  function tr() { return langs[language()]; }
  function read(store, key) { try { return store.getItem(key); } catch (error) { return null; } }
  function write(store, key, value) { try { store.setItem(key, String(value)); } catch (error) {} }
  function postponed() {
    var expires = Number(read(localStorage, STORAGE_UNTIL));
    return Number.isFinite(expires) && expires > Date.now();
  }
  function postpone(days) { write(localStorage, STORAGE_UNTIL, Date.now() + days * DAY); }

  var footer, popup, shown = false, engaged = read(sessionStorage, SESSION_ENGAGED) === "1";
  var firstVisit = Number(read(sessionStorage, SESSION_START));
  if (!Number.isFinite(firstVisit) || firstVisit <= 0 || firstVisit > Date.now()) {
    firstVisit = Date.now();
    write(sessionStorage, SESSION_START, firstVisit);
  }
  function markEngaged() {
    if (engaged) return;
    engaged = true;
    write(sessionStorage, SESSION_ENGAGED, "1");
  }
  function footerMarkup() {
    var t = tr();
    return '<span class="zwm-gr-emblem" aria-hidden="true">G</span>' +
      '<span class="zwm-gr-footer-copy"><strong>' + t.footerTitle +
      '</strong><small>' + t.footerHint + '</small></span>' +
      '<a href="' + GOOGLE_LISTING + '" target="_blank" rel="noopener noreferrer" class="zwm-gr-footer-action">' +
      t.footerLink + '<span aria-hidden="true"> ↗</span></a>';
  }
  function showFooter() {
    if (!footer) {
      var target = document.querySelector("footer .footer-main");
      if (!target) return;
      footer = document.createElement("aside");
      footer.className = "zwm-gr-footer";
      footer.setAttribute("aria-label", "Google reviews");
      target.appendChild(footer);
      footer.addEventListener("click", function (event) {
        if (event.target.closest("a")) postpone(180);
      });
    }
    footer.lang = language();
    footer.dir = language() === "ar" ? "rtl" : "ltr";
    footer.innerHTML = footerMarkup();
  }
  function popupMarkup() {
    var t = tr();
    return '<button type="button" class="zwm-gr-close" data-gr-close aria-label="' + t.close + '">×</button>' +
      '<div class="zwm-gr-kicker"><span class="zwm-gr-emblem" aria-hidden="true">G</span><span>' + t.eyebrow + '</span></div>' +
      '<h2 id="zwmGoogleReviewTitle">' + t.title + '</h2>' +
      '<p id="zwmGoogleReviewDescription">' + t.description + '</p>' +
      '<a href="' + GOOGLE_LISTING + '" target="_blank" rel="noopener noreferrer" class="zwm-gr-action" data-gr-google>' +
      t.primary + '<span aria-hidden="true"> ↗</span></a>' +
      '<button type="button" class="zwm-gr-later" data-gr-close>' + t.later + '</button>';
  }
  function close(days) {
    if (popup) popup.hidden = true;
    shown = true;
    postpone(days);
  }
  function initPopup() {
    if (popup) return;
    popup = document.createElement("section");
    popup.id = "zwmGoogleReviewInvite";
    popup.className = "zwm-gr-invite";
    popup.hidden = true;
    popup.setAttribute("role", "dialog");
    popup.setAttribute("aria-modal", "false");
    popup.setAttribute("aria-labelledby", "zwmGoogleReviewTitle");
    popup.setAttribute("aria-describedby", "zwmGoogleReviewDescription");
    popup.addEventListener("click", function (event) {
      if (event.target.closest("[data-gr-google]")) close(180);
      else if (event.target.closest("[data-gr-close]")) close(30);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && popup && !popup.hidden) close(30);
    });
    document.body.appendChild(popup);
  }
  function busy() {
    if (document.body.classList.contains("welcome-open") ||
        document.body.classList.contains("gh-popup-open") ||
        document.body.classList.contains("modal-open") ||
        document.body.classList.contains("cart-open")) return true;
    var selectors = ["#ghCampaignPopup.gh-is-open", "#languageWelcome:not([hidden])",
      "#productModal.is-open", "#cartDrawer.is-open", ".cart-drawer.is-open",
      "[role='dialog'][aria-modal='true']:not([hidden])"];
    return selectors.some(function (selector) {
      return Array.from(document.querySelectorAll(selector)).some(function (node) {
        return node !== popup && node.getClientRects().length > 0 &&
          getComputedStyle(node).visibility !== "hidden";
      });
    });
  }
  function maybeShow() {
    if (shown || postponed() || !engaged || !popup || !popup.hidden) return;
    if (Date.now() - firstVisit < WAIT_MS || document.visibilityState !== "visible" || busy()) return;
    popup.lang = language();
    popup.dir = language() === "ar" ? "rtl" : "ltr";
    popup.innerHTML = popupMarkup();
    popup.hidden = false;
    shown = true;
  }
  function boot() {
    showFooter();
    var page = document.body.dataset.page || "";
    // No sales interruption on checkout, account, policy, admin or order flows.
    if (!["home", "shop", "about", "contact", "gift", "recipes", "wholesale"].includes(page)) return;
    initPopup();
    window.addEventListener("scroll", function () {
      if (window.scrollY > 200) markEngaged();
    }, { passive: true });
    document.addEventListener("click", function (event) {
      if (event.target.closest("a, button, [role='button']")) markEngaged();
    }, { passive: true });
    document.addEventListener("zwm:localechange", function () {
      showFooter();
      if (popup && !popup.hidden) {
        popup.lang = language();
        popup.dir = language() === "ar" ? "rtl" : "ltr";
        popup.innerHTML = popupMarkup();
      }
    });
    document.addEventListener("visibilitychange", maybeShow);
    window.addEventListener("pageshow", maybeShow);
    window.setInterval(maybeShow, 9000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();

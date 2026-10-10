/* Google Reviews invitation: genuine, non-incentivized feedback only. */
(function () {
  "use strict";
  if (window.__ZWM_GOOGLE_REVIEW_INVITE__) return;
  window.__ZWM_GOOGLE_REVIEW_INVITE__ = true;

  // Google's Place ID is verified for the Zayt w Mouneh listing in Sebline.
  // All five star choices lead to exactly the same public Google review form.
  // No rating is submitted, prefilled, filtered or stored by our site.
  var GOOGLE_WRITE_REVIEW = "https://search.google.com/local/writereview?placeid=ChIJqd2AOgDlHhURFR8z0AlDHf0";
  var GOOGLE_LISTING = "https://www.google.com/maps/place/Zayt+w+Mouneh/@33.6194906,35.438234,631m/data=!3m1!1e3!4m8!3m7!1s0x151ee5003a80dda9:0xfd1d4309d0331f15!8m2!3d33.6194906!4d35.438234!9m1!1b1!16s%2Fg%2F11z3jj30wq!18m1!1e1?entry=ttu";
  // Verified snapshot, NOT live: confirmed from the public business listing on 2026-10-10.
  var VERIFIED_GOOGLE_RATING = { score: "5.0", total: 5, checked: "2026-10-10" };
  var STORAGE_UNTIL = "zwm:google-review-invite:until:v1";
  var SESSION_START = "zwm:google-review-invite:session-start:v1";
  var SESSION_ENGAGED = "zwm:google-review-invite:engaged:v1";
  var WAIT_MS = 85000;
  var DAY = 86400000;
  var langs = {
    en: {
      eyebrow: "A NOTE FROM OUR FAMILY", title: "Your experience matters.",
      description: "Have you shopped with Zayt w Mouneh? Share your honest experience on Google and help other customers discover us.",
      later: "Maybe later", close: "Close review invitation",
      footerTitle: "How was your Zayt w Mouneh experience?",
      footerHint: "Tap a star to share an honest Google review.",
      starNote: "You'll choose your rating again on Google.",
      starLabel: "star", googleReview: "Google customer reviews", googleRating: "Google Rating",
      ratingAt: "Rating checked 10 Oct 2026", viewReviews: "See reviews on Google"
    },
    ar: {
      eyebrow: "رسالة من عائلة زيت ومونة", title: "رأيك بيهمّنا.",
      description: "سبق وتسوّقت من زيت ومونة؟ شارك تجربتك الصادقة على Google وساعد غيرك يتعرّف علينا.",
      later: "ربما لاحقاً", close: "إغلاق دعوة التقييم",
      footerTitle: "كيف كانت تجربتك مع زيت ومونة؟",
      footerHint: "اختار عدد النجوم وشارك تقييمك الصادق على Google.",
      starNote: "ستختار تقييمك من جديد على Google.",
      starLabel: "نجمة", googleReview: "تقييمات العملاء على Google", googleRating: "تقييم Google",
      ratingAt: "تم التحقق في ١٠ تشرين الأول ٢٠٢٦", viewReviews: "شاهد التقييمات على Google"
    },
    fr: {
      eyebrow: "UN MOT DE NOTRE FAMILLE", title: "Votre avis compte.",
      description: "Vous avez déjà commandé chez Zayt w Mouneh ? Partagez votre expérience sincère sur Google pour aider d'autres clients à nous découvrir.",
      later: "Peut-être plus tard", close: "Fermer l'invitation",
      footerTitle: "Comment s'est passée votre expérience chez Zayt w Mouneh ?",
      footerHint: "Touchez une étoile pour partager un avis sincère sur Google.",
      starNote: "Vous choisirez à nouveau votre note sur Google.",
      starLabel: "étoile", googleReview: "Avis clients Google", googleRating: "Note Google",
      ratingAt: "Note vérifiée le 10 octobre 2026", viewReviews: "Voir les avis sur Google"
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
  function starLinks() {
    var t = tr(), stars = "";
    for (var rating = 1; rating <= 5; rating++) {
      stars += '<a class="zwm-gr-star" data-gr-google data-gr-star="' + rating +
        '" href="' + GOOGLE_WRITE_REVIEW + '" target="_blank" rel="noopener noreferrer"' +
        ' aria-label="' + rating + ' ' + t.starLabel + ': Google">' +
        '<span aria-hidden="true">★</span></a>';
    }
    return '<div class="zwm-gr-stars" role="group" aria-label="' + t.footerHint + '" dir="ltr">' +
      stars + '</div>';
  }
  function starInfo() { return '<small class="zwm-gr-star-note">' + tr().starNote + '</small>'; }
  function paintStars(group, rating) {
    group.querySelectorAll("[data-gr-star]").forEach(function (star) {
      star.classList.toggle("is-active", Number(star.dataset.grStar) <= rating);
    });
  }
  function wireStars(root) {
    root.querySelectorAll(".zwm-gr-stars").forEach(function (group) {
      group.addEventListener("pointerover", function (event) {
        var star = event.target.closest("[data-gr-star]");
        if (star) paintStars(group, Number(star.dataset.grStar));
      });
      group.addEventListener("pointerleave", function () { paintStars(group, 0); });
      group.addEventListener("focusin", function (event) {
        var star = event.target.closest("[data-gr-star]");
        if (star) paintStars(group, Number(star.dataset.grStar));
      });
      group.addEventListener("focusout", function (event) {
        if (!group.contains(event.relatedTarget)) paintStars(group, 0);
      });
    });
  }
  function footerMarkup() {
    var t = tr();
    return '<span class="zwm-gr-emblem" aria-hidden="true">G</span>' +
      '<span class="zwm-gr-footer-copy"><strong>' + t.footerTitle +
      '</strong><small>' + t.footerHint + '</small></span>' +
      '<span class="zwm-gr-footer-choice">' + starLinks() + starInfo() + '</span>';
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
        if (event.target.closest("[data-gr-google]")) postpone(180);
      });
    }
    footer.lang = language();
    footer.dir = language() === "ar" ? "rtl" : "ltr";
    footer.innerHTML = footerMarkup();
    wireStars(footer);
  }
  function popupMarkup() {
    var t = tr();
    return '<button type="button" class="zwm-gr-close" data-gr-close aria-label="' + t.close + '">×</button>' +
      '<div class="zwm-gr-kicker"><span class="zwm-gr-emblem" aria-hidden="true">G</span><span>' + t.eyebrow + '</span></div>' +
      '<h2 id="zwmGoogleReviewTitle">' + t.title + '</h2>' +
      '<p id="zwmGoogleReviewDescription">' + t.description + '</p>' +
      '<div class="zwm-gr-popup-choice">' + starLinks() + starInfo() + '</div>' +
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
  function homeMarkup() {
    var t = tr();
    // One compact, fully-clickable Google rating link; not an interactive rating control.
    // The five stars reflect the dated verified snapshot, not the visitor's choice.
    return '<a class="zwm-gr-home-link" href="' + GOOGLE_LISTING +
      '" target="_blank" rel="noopener noreferrer" aria-label="' +
      t.googleRating + ': ' + VERIFIED_GOOGLE_RATING.score + ' / 5. ' +
      t.ratingAt + '">' +
      '<span class="zwm-gr-home-stars" aria-hidden="true">★★★★★</span>' +
      '<strong class="zwm-gr-home-score" dir="ltr">5/5</strong>' +
      '<span class="zwm-gr-home-label">' + t.googleRating + '</span></a>';
  }
  function showHomeRating() {
    if (document.body.dataset.page !== "home") return;
    var node = document.getElementById("zwmGoogleReviewsRating");
    if (!node) {
      var featured = document.getElementById("featured");
      if (!featured) return;
      node = document.createElement("aside");
      node.id = "zwmGoogleReviewsRating";
      node.className = "zwm-gr-home";
      node.setAttribute("aria-label", "Verified Google Reviews rating");
      featured.parentNode.insertBefore(node, featured);
    }
    node.lang = language();
    node.dir = language() === "ar" ? "rtl" : "ltr";
    node.innerHTML = homeMarkup();
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
    wireStars(popup);
    shown = true;
  }
  function boot() {
    showFooter();
    showHomeRating();
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
      showHomeRating();
      if (popup && !popup.hidden) {
        popup.lang = language();
        popup.dir = language() === "ar" ? "rtl" : "ltr";
        popup.innerHTML = popupMarkup();
        wireStars(popup);
      }
    });
    document.addEventListener("visibilitychange", maybeShow);
    window.addEventListener("pageshow", maybeShow);
    window.setInterval(maybeShow, 9000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();

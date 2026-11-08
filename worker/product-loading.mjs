/** Temporary Merchant landing UI only; the product runtime replaces it normally. */
const copy = {
  en: {loading: 'Opening your product', note: 'Loading current sizes, prices and availability…', shop: 'Browse the shop', brand: 'Zayt w Mouneh'},
  ar: {loading: 'عم نجهّزلك المنتج', note: 'عم نحمّل الأحجام والأسعار والتوفّر الحالي…', shop: 'تصفّح المتجر', brand: 'زيت ومونة'},
  fr: {loading: 'Votre produit arrive', note: 'Chargement des formats, prix et disponibilités…', shop: 'Voir la boutique', brand: 'Zayt w Mouneh'}
};
function esc(value) {
  return String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
}
export function productLoadingHTML({name, category, sizes, description, locale}) {
  const t = copy[locale] || copy.en;
  const shop = (locale === 'ar' ? '/ar' : locale === 'fr' ? '/fr' : '') + '/shop';
  // Category illustration, never a substitute photograph or a claim about packaging.
  const grain = /grain|flour|rice|seed|bulgur|legume/i.test(category);
  const drawing = grain
    ? '<path d="M60 106V34m0 43C37 77 32 65 33 54c17 0 27 10 27 23Zm0-20C42 57 39 46 40 37c13 1 20 9 20 20Zm0 30c23 0 28-12 27-23-17 0-27 10-27 23Zm0-20c18 0 21-11 20-20-13 1-20 9-20 20ZM60 37c-9-9-8-19 0-27 8 8 9 18 0 27Z"/>'
    : /oil/i.test(category + ' ' + name)
    ? '<path d="M49 17h22v18l11 17v53H38V52l11-17V17Zm-1 0h24M49 28h22M38 61h44M38 91h44M60 67c-13 15-13 21 0 21s13-6 0-21Z"/>'
    : '<path d="M39 22h42v15H39V22Zm4 15-9 14v51c0 5 4 8 9 8h34c5 0 9-3 9-8V51l-9-14M34 60h52M34 92h52M60 86V67m0 11c-10 0-14-6-14-11 9 0 14 5 14 11Zm0 6c10 0 14-6 14-11-9 0-14 5-14 11Z"/>';
  return `<style>
.zwm-product-loading{--ink:#193f2b;--muted:#697566;box-sizing:border-box;max-width:960px;margin:48px auto 64px;padding:clamp(24px,5vw,52px);border:1px solid #dedbc9;border-radius:28px;background:#fffef9;box-shadow:0 18px 65px #193f2b08;color:var(--ink);text-align:start;font-family:"DM Sans","Noto Kufi Arabic",sans-serif}
.zwm-product-loading *{box-sizing:border-box}.zwm-pl-brand{font-size:12px;font-weight:700;letter-spacing:.1em;margin:0 0 28px;color:var(--muted)}
.zwm-pl-layout{display:grid;grid-template-columns:180px minmax(0,1fr);gap:36px;align-items:center}.zwm-pl-art{display:grid;place-items:center;aspect-ratio:1;background:radial-gradient(circle,#e9eadb,#f5f3e9 70%);border-radius:50%;color:#697940}.zwm-pl-art svg{width:96px;height:110px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.zwm-pl-category{font-size:12px;font-weight:700;color:#77854c;margin:0 0 8px}.zwm-product-loading .c6-product-title{font-size:clamp(28px,4vw,44px);line-height:1.15;margin:0 0 12px;overflow-wrap:anywhere}.zwm-pl-sizes{font-size:14px;color:var(--muted);margin:0 0 22px}.zwm-pl-status{font-size:14px;font-weight:600;margin:0;display:flex;align-items:center;gap:10px}.zwm-pl-dot{width:8px;height:8px;flex:none;border-radius:50%;background:#899354;animation:zwm-pl-pulse 1.6s ease-in-out infinite}.zwm-pl-note{font-size:13px;color:var(--muted);margin:8px 0 18px;line-height:1.7}.zwm-pl-track{height:3px;border-radius:8px;background:#eeecdf;overflow:hidden;max-width:300px}.zwm-pl-track:after{content:"";display:block;width:38%;height:100%;background:#899354;animation:zwm-pl-slide 1.8s ease-in-out infinite;border-radius:inherit}.zwm-pl-link{display:inline-flex;margin-top:28px;color:var(--ink);font-size:13px;font-weight:600;text-decoration:underline;text-underline-offset:5px;padding:8px 0}.zwm-pl-link:focus-visible{outline:2px solid #899354;outline-offset:5px}.zwm-pl-description{font-size:12px;color:var(--muted);line-height:1.7;margin:24px 0 0;padding-top:20px;border-top:1px solid #eeecdf}
@keyframes zwm-pl-pulse{50%{opacity:.35}}@keyframes zwm-pl-slide{0%{transform:translateX(-110%)}100%{transform:translateX(370%)}}
@media(max-width:600px){.zwm-product-loading{margin:24px auto 36px;border-radius:22px}.zwm-pl-layout{grid-template-columns:1fr;gap:24px}.zwm-pl-art{width:116px;justify-self:center}.zwm-pl-art svg{width:64px;height:80px}.zwm-pl-brand{margin-bottom:20px}.zwm-pl-track{max-width:none}}
@media(prefers-reduced-motion:reduce){.zwm-pl-dot,.zwm-pl-track:after{animation:none}.zwm-pl-track:after{width:45%}}
</style><section class="zwm-product-loading" aria-labelledby="zwmLoadingTitle"><p class="zwm-pl-brand">${esc(t.brand)}</p><div class="zwm-pl-layout"><div class="zwm-pl-art" aria-hidden="true"><svg viewBox="0 0 120 120">${drawing}</svg></div><div><p class="zwm-pl-category">${esc(category)}</p><h1 class="c6-product-title">${esc(name)}</h1>${sizes ? '<p class="zwm-pl-sizes">' + esc(sizes) + '</p>' : ''}<p class="zwm-pl-status" id="zwmLoadingTitle" role="status"><span class="zwm-pl-dot" aria-hidden="true"></span>${esc(t.loading)}</p><p class="zwm-pl-note">${esc(t.note)}</p><div class="zwm-pl-track" aria-hidden="true"></div><a class="zwm-pl-link" href="${shop}">${esc(t.shop)}</a></div></div><p class="zwm-pl-description">${esc(description)}</p></section>`;
}

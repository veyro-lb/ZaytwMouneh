/**
 * Product-route-only HTML SEO enhancement for the existing Cloudflare static storefront.
 * Does not handle checkout, admin, accounts, inventory, prices or other URLs.
 * Product prices and availability remain the responsibility of the live browser runtime.
 */
const ORIGIN = "https://zaytwmouneh.com";
const CATALOGUE_PREFIX = "const PRODUCTS_DATA=";
// Mirrors the runtime's explicit catalogue alias map so Google never indexes duplicate slugs.
const PRODUCT_ALIASES = new Map([
  ["barly-flour", "barley-flour"],
  ["bezer-el-kettan", "bezer-al-ketan"],
  ["sekar-nabet", "secar-nabat"]
]);
let cataloguePromise;

function clean(value) {
  return String(value == null ? "" : value).replace(/[\u202a-\u202e\u2066-\u2069]/g, "").trim();
}
function escapeHTML(value) {
  return clean(value).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function productPath(id, locale) {
  return (locale === "ar" ? "/ar" : locale === "fr" ? "/fr" : "") + "/product/" + encodeURIComponent(id);
}
export function parseCatalogue(source) {
  const start = source.indexOf(CATALOGUE_PREFIX);
  if (start < 0) throw new Error("PRODUCTS_DATA declaration not found");
  const from = start + CATALOGUE_PREFIX.length;
  const until = source.indexOf("];", from);
  if (until < 0) throw new Error("PRODUCTS_DATA closing delimiter not found");
  const products = JSON.parse(source.slice(from, until + 1));
  if (!Array.isArray(products) || products.length < 300) throw new Error("Catalogue invalid");
  // Match the catalogue's published Arabic spelling fixes rather than raw PDF RTL/OCR text.
  const arBlock = source.match(/const AR_PRODUCT_NAME_FIXES=Object\.freeze\((\{[\s\S]*?\})\);/);
  if (arBlock) {
    const fixes = JSON.parse(arBlock[1].replace(/,\s*}/g, "}"));
    products.forEach(p => { if (fixes[p.id]) p.nameAr = fixes[p.id]; });
  }
  return new Map(products.map(p => [p.id, p]));
}
async function getCatalogue(env, request) {
  if (!cataloguePromise) {
    cataloguePromise = (async () => {
      const url = new URL("/products-data.js", request.url);
      const response = await env.ASSETS.fetch(new Request(url));
      if (!response.ok) throw new Error("Catalogue asset missing");
      return parseCatalogue(await response.text());
    })().catch(error => { cataloguePromise = undefined; throw error; });
  }
  return cataloguePromise;
}
export function seoProductHTML(html, product, locale) {
  const id = clean(product.id);
  const name = clean(locale === "ar" ? product.nameAr || product.nameEn :
    locale === "fr" ? product.nameFr || product.nameEn : product.nameEn || product.nameAr);
  const category = clean(product.category || "Pantry");
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const sizes = [...new Set(variants.map(v => clean(locale === "ar" ? v.sizeAr || v.sizeEn :
    locale === "fr" ? v.sizeFr || v.sizeEn : v.sizeEn)).filter(Boolean))].slice(0, 6);
  const sizePart = sizes.length ? sizes.join(", ") : "";
  const description = locale === "ar"
    ? "تعرّف على " + name + " من زيت ومونة. الفئة: " + category + (sizePart ? ". الأحجام المدرجة: " + sizePart : "") + ". اطّلع على تفاصيل المنتج والسعر الحالي."
    : locale === "fr"
    ? "Découvrez " + name + " chez Zayt W Mouneh. Catégorie : " + category + (sizePart ? ". Formats : " + sizePart : "") + ". Consultez les détails et prix actuels."
    : "Explore " + name + " at Zayt W Mouneh. Category: " + category + (sizePart ? ". Listed sizes: " + sizePart : "") + ". Check current details and prices.";
  const url = ORIGIN + productPath(id, locale);
  const title = name + " | Zayt W Mouneh";
  const alternatives = [
    ["en-LB", ORIGIN + productPath(id, "en")],
    ["ar-LB", ORIGIN + productPath(id, "ar")],
    ["fr-LB", ORIGIN + productPath(id, "fr")],
    ["x-default", ORIGIN + productPath(id, "en")]
  ];
  const schema = {
    "@context": "https://schema.org", "@type": "Product",
    name, sku: id, category, description, url
  };
  // On browser load, product-page-v1.js updates this same script with owner-verified facts.
  const json = JSON.stringify(schema).replace(/</g, "\\u003c");
  const tags = [
    '<link rel="canonical" href="' + escapeHTML(url) + '">',
    ...alternatives.map(a => '<link rel="alternate" hreflang="' + a[0] + '" href="' + escapeHTML(a[1]) + '">'),
    '<meta property="og:title" content="' + escapeHTML(title) + '">',
    '<meta property="og:description" content="' + escapeHTML(description) + '">',
    '<meta property="og:url" content="' + escapeHTML(url) + '">',
    '<meta name="twitter:title" content="' + escapeHTML(title) + '">',
    '<meta name="twitter:description" content="' + escapeHTML(description) + '">',
    '<script id="c6ProductSchema" type="application/ld+json">' + json + '</script>'
  ].join("\n");
  return html
    .replace(/<html lang="en" dir="ltr">/i, '<html lang="' + locale + '" dir="' + (locale === "ar" ? "rtl" : "ltr") + '">')
    .replace(/<title>[^<]*<\/title>/i, "<title>" + escapeHTML(title) + "</title>")
    .replace(/<meta name="description" content="[^"]*">/i, '<meta name="description" content="' + escapeHTML(description) + '">')
    .replace(/<\/head>/i, tags + "\n</head>")
    .replace("<strong>Loading product…</strong>",
      '<h1 class="c6-product-title">' + escapeHTML(name) + '</h1>' +
      '<p class="c6-product-summary">' + escapeHTML(description) + '</p>' +
      '<p><a href="' + escapeHTML(locale === "ar" ? "/ar/shop" : locale === "fr" ? "/fr/shop" : "/shop") + '">' +
      (locale === "ar" ? "تصفّح المتجر" : locale === "fr" ? "Voir la boutique" : "Browse the shop") + '</a></p>');
}
function notFoundHTML(html) {
  return html.replace(/<meta name="robots" content="[^"]*">/i, '<meta name="robots" content="noindex,follow">')
    .replace(/<title>[^<]*<\/title>/i, "<title>Product not found | Zayt W Mouneh</title>")
    .replace("<strong>Loading product…</strong>",
      '<h1 class="c6-product-title">Product not found</h1><p><a href="/shop">Browse all products</a></p>');
}
function htmlResponse(html, sourceResponse, status) {
  const headers = new Headers(sourceResponse.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");
  headers.set("Content-Type", "text/html; charset=UTF-8");
  if (status === 404) headers.set("X-Robots-Tag", "noindex, follow");
  return new Response(html, {status, headers});
}
export default {
  async fetch(request, env) {
    const pathname = new URL(request.url).pathname;
    const matched = /^\/(?:(ar|fr)\/)?product\/([a-z0-9][a-z0-9-]*)\/?$/.exec(pathname);
    if (!matched || request.method !== "GET") return env.ASSETS.fetch(request);
    const locale = matched[1] || "en";
    let products;
    try { products = await getCatalogue(env, request); }
    catch { return env.ASSETS.fetch(request); } // Fail open: existing static storefront remains usable.
    const shell = await env.ASSETS.fetch(new Request(new URL("/product.html", request.url)));
    if (!shell.ok) return env.ASSETS.fetch(request);
    const html = await shell.text();
    if (!html.includes("<strong>Loading product…</strong>")) return htmlResponse(html, shell, shell.status);
    const canonicalId = PRODUCT_ALIASES.get(matched[2]);
    if (canonicalId) {
      return Response.redirect(ORIGIN + productPath(canonicalId, locale), 301);
    }
    const product = products.get(matched[2]);
    if (!product) return htmlResponse(notFoundHTML(html), shell, 404);
    return htmlResponse(seoProductHTML(html, product, locale), shell, 200);
  }
};

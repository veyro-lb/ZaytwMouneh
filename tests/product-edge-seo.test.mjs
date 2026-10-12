import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import seoWorker, {parseCatalogue, seoProductHTML} from "../worker/product-seo.mjs";

const shell = readFileSync(new URL("../public/product.html", import.meta.url), "utf8");
const source = readFileSync(new URL("../public/products-data.js", import.meta.url), "utf8");
const catalogue = parseCatalogue(source);
const product = catalogue.get("aadas-aarid");
assert.ok(product, "example catalogue product exists");
const makeEnv = () => ({
  ASSETS: {fetch: async req => {
    const path = new URL(req.url).pathname;
    if (path === "/products-data.js") return new Response(source, {status:200});
    if (path === "/product.html") return new Response(shell, {status:200, headers:{"Content-Type":"text/html"}});
    return new Response("STATIC ASSET", {status:200});
  }}
});
test("catalogue can be parsed from shipped JavaScript without executing it", () => {
  assert.ok(catalogue.size >= 300);
  assert.equal(catalogue.get("baking-powder").nameEn, "Baking Powder");
  assert.equal(catalogue.get("brown-sugar").nameAr, "سكر بني");
});
test("three product locales have crawlable titles, content, canonical and hreflang", async () => {
  for (const lang of ["en", "ar", "fr"]) {
    const path = (lang === "en" ? "" : "/" + lang) + "/product/aadas-aarid";
    const res = await seoWorker.fetch(new Request("https://zaytwmouneh.com" + path), makeEnv());
    const html = await res.text();
    assert.equal(res.status, 200);
    assert.match(html, /<h1 class="c6-product-title">[^<]+<\/h1>/);
    assert.ok(html.includes('<link rel="canonical" href="https://zaytwmouneh.com' + path + '">'));
    assert.match(html, /<meta property="og:title"/);
    assert.match(html, /<meta name="description" content="[^"]+">/);
    assert.ok(html.includes('<html lang="' + lang + '" dir="' + (lang === "ar" ? "rtl" : "ltr") + '">'));
    assert.ok(html.includes('id="c6ProductSchema" type="application/ld+json"'));
    assert.ok(html.includes('<script src="/product-page-v1.js'));
    assert.equal((html.match(/<link rel="canonical"/g)||[]).length, 1);
    for (const tag of ["en-LB", "ar-LB", "fr-LB", "x-default"]) {
      assert.ok(html.includes('hreflang="' + tag + '"'));
    }
  }
});
test("hidden and nonexistent products are noindex 404 rather than phantom sitemap content", async () => {
  for (const slug of ["sekar-nabet", "made-up-product"]) {
    const response = await seoWorker.fetch(new Request("https://zaytwmouneh.com/product/" + slug), makeEnv());
    assert.equal(response.status, 404);
    assert.match(response.headers.get("X-Robots-Tag"), /noindex/);
    assert.match(await response.text(), /<meta name="robots" content="noindex,follow">/);
  }
});
test("nonproduct traffic, including checkout and admin, bypasses product SEO", async () => {
  for (const path of ["/", "/checkout", "/admin", "/gift", "/ar/shop", "/sitemap.xml", "/product-page-v1.js"]) {
    const response = await seoWorker.fetch(new Request("https://zaytwmouneh.com" + path), makeEnv());
    assert.equal(await response.text(), "STATIC ASSET");
  }
});
test("HTML injection escapes source text and product-specific metadata contains no fabricated stock", () => {
  const page = seoProductHTML(shell, {
    id:"safe-product", nameEn:'A <script>alert("X")</script>',category:"Food",
    variants:[{sizeEn:"1 kg"}]
  }, "en");
  assert.ok(!page.includes('<h1 class="c6-product-title">A <script>'));
  assert.match(page, /A &lt;script&gt;/);
  assert.ok(!page.includes("https://schema.org/InStock"));
  assert.ok(!page.includes('"price":'));
});

#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const PRODUCTS_FILE = path.join(PUBLIC, "products-data.js");
const PHOTOS_FILE = path.join(PUBLIC, "product-photos.js");

const ALLOWED_CATEGORIES = new Set([
  "Condiments","Dates","Debsy Carob","Distillates + Syrups","Dried Foods","Flour","Grains",
  "Herbs","Honey","Molasses","Mouneh","Nuts + Seeds","Oils","Olive Oil","Olives","Pickles",
  "Pulses","Soap","Spices","Sweets + Candy","Vinegars"
]);

const BIDI_RE = /[\u202A-\u202E\u2066-\u2069]/g;
const BIDI_TEST_RE = /[\u202A-\u202E\u2066-\u2069]/;
const SIZE_RE = /^(?:\d+(?:\.\d+)?\s*(?:g|kg|ml|L)|Size not listed)$/i;

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function extractLiteral(source, marker, open, close) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error("Missing marker: " + marker);
  const start = source.indexOf(open, markerIndex + marker.length);
  if (start < 0) throw new Error("Missing opening " + open + " for " + marker);

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === open) depth += 1;
    if (ch === close) {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error("Unclosed literal for " + marker);
}

function parseCatalogue() {
  const source = read(PRODUCTS_FILE);
  return JSON.parse(extractLiteral(source, "const PRODUCTS_DATA", "[", "]"));
}

function parsePhotoMap() {
  const source = read(PHOTOS_FILE);
  return JSON.parse(extractLiteral(source, "const map", "{", "}"));
}

function clean(value) {
  return String(value == null ? "" : value).replace(BIDI_RE, "").trim().normalize("NFC");
}

function duplicateGroups(items, getter) {
  const grouped = new Map();
  for (const item of items) {
    const value = clean(getter(item));
    if (!value) continue;
    const key = value.toLocaleLowerCase("en");
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(item);
  }
  return [...grouped.values()]
    .filter(group => group.length > 1)
    .map(group => ({
      name: clean(getter(group[0])),
      ids: group.map(item => item.id)
    }));
}

function decimals(value) {
  const text = String(value);
  if (/e/i.test(text)) {
    const fixed = Number(value).toFixed(12).replace(/0+$/, "").replace(/\.$/, "");
    return (fixed.split(".")[1] || "").length;
  }
  return (text.split(".")[1] || "").length;
}

function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

function validate() {
  const products = parseCatalogue();
  const photoMap = parsePhotoMap();
  const structuralErrors = [];
  const warnings = [];

  if (!Array.isArray(products)) structuralErrors.push("PRODUCTS_DATA is not an array.");

  const productIdSeen = new Set();
  const duplicateProductIds = [];
  const variants = [];
  const malformedProducts = [];
  const missingEnglish = [];
  const missingArabic = [];
  const missingFrench = [];
  const invalidCategories = [];
  const productsWithoutVariants = [];
  const bidiProducts = [];

  for (const product of products) {
    if (!product || typeof product !== "object" || Array.isArray(product)) {
      malformedProducts.push("(non-object)");
      continue;
    }
    if (!clean(product.id)) malformedProducts.push("(missing id)");
    if (productIdSeen.has(product.id)) duplicateProductIds.push(product.id);
    productIdSeen.add(product.id);

    if (!clean(product.nameEn)) missingEnglish.push(product.id);
    if (!clean(product.nameAr)) missingArabic.push(product.id);
    if (!clean(product.nameFr)) missingFrench.push(product.id);
    if (!ALLOWED_CATEGORIES.has(product.category)) invalidCategories.push({id: product.id, category: product.category});

    if (!Array.isArray(product.variants) || product.variants.length === 0) {
      productsWithoutVariants.push(product.id);
    } else {
      for (const variant of product.variants) variants.push({productId: product.id, variant});
    }

    if (BIDI_TEST_RE.test(JSON.stringify(product))) bidiProducts.push(product.id);
  }

  const variantIdSeen = new Set();
  const duplicateVariantIds = [];
  const variantsWithoutIds = [];
  const invalidPrices = [];
  const nonPositivePrices = [];
  const excessivePrecision = [];
  const malformedSizes = [];
  const nonStandardSizes = [];

  for (const {productId, variant} of variants) {
    if (!variant || typeof variant !== "object" || Array.isArray(variant)) {
      structuralErrors.push("Malformed variant object under " + productId + ".");
      continue;
    }
    if (!clean(variant.id)) variantsWithoutIds.push(productId);
    else if (variantIdSeen.has(variant.id)) duplicateVariantIds.push(variant.id);
    else variantIdSeen.add(variant.id);

    if (typeof variant.price !== "number" || !Number.isFinite(variant.price)) {
      invalidPrices.push({productId, variantId: variant.id || null, price: variant.price});
    } else {
      if (variant.price <= 0) nonPositivePrices.push({productId, variantId: variant.id, price: variant.price});
      if (decimals(variant.price) > 2) excessivePrecision.push({productId, variantId: variant.id, price: variant.price});
    }

    const size = clean(variant.sizeEn);
    if (!size) malformedSizes.push({productId, variantId: variant.id || null, sizeEn: variant.sizeEn});
    else if (!SIZE_RE.test(size)) {
      if (/unit not listed/i.test(size)) nonStandardSizes.push({productId, variantId: variant.id, sizeEn: variant.sizeEn});
      else malformedSizes.push({productId, variantId: variant.id, sizeEn: variant.sizeEn});
    }
  }

  const duplicateEnglishNames = duplicateGroups(products, product => product.nameEn);
  const duplicateArabicNames = duplicateGroups(products, product => product.nameAr);
  const duplicateFrenchNames = duplicateGroups(products.filter(product => clean(product.nameFr)), product => product.nameFr);

  const mappedIds = Object.keys(photoMap);
  const missingPhotos = products.filter(product => !photoMap[product.id]).map(product => product.id);
  const orphanPhotoMappings = mappedIds.filter(id => !productIdSeen.has(id));
  const brokenImageReferences = [];
  const externalImageMappings = [];
  const pathGroups = new Map();

  for (const [id, media] of Object.entries(photoMap)) {
    const url = media && typeof media.url === "string" ? media.url.trim() : "";
    if (!url) {
      brokenImageReferences.push({id, url: ""});
      continue;
    }
    if (/^https?:\/\//i.test(url)) {
      externalImageMappings.push({id, url});
      continue;
    }
    const normalized = url.replace(/^\/+/, "");
    const absolute = path.join(PUBLIC, normalized);
    if (!fs.existsSync(absolute)) brokenImageReferences.push({id, url});
    if (!pathGroups.has(url)) pathGroups.set(url, []);
    pathGroups.get(url).push(id);
  }

  const duplicatePhotoPaths = [...pathGroups.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([url, ids]) => ({url, ids}));

  if (malformedProducts.length) structuralErrors.push("Malformed product objects: " + malformedProducts.join(", "));
  if (duplicateProductIds.length) structuralErrors.push("Duplicate product IDs: " + duplicateProductIds.join(", "));
  if (duplicateVariantIds.length) structuralErrors.push("Duplicate variant IDs: " + duplicateVariantIds.join(", "));
  if (variantsWithoutIds.length) structuralErrors.push("Variants without IDs under: " + [...new Set(variantsWithoutIds)].join(", "));
  if (invalidPrices.length) structuralErrors.push("Invalid/NaN prices: " + invalidPrices.length);
  if (nonPositivePrices.length) structuralErrors.push("Zero/negative prices: " + nonPositivePrices.length);
  if (excessivePrecision.length) structuralErrors.push("Prices with >2 decimal places: " + excessivePrecision.length);
  if (missingEnglish.length) structuralErrors.push("Products missing English names: " + missingEnglish.join(", "));
  if (productsWithoutVariants.length) structuralErrors.push("Products without variants: " + productsWithoutVariants.join(", "));
  if (invalidCategories.length) structuralErrors.push("Invalid categories: " + invalidCategories.map(row => row.id + "=" + row.category).join(", "));
  if (brokenImageReferences.length) structuralErrors.push("Mapped local image references missing/invalid: " + brokenImageReferences.length);

  if (missingArabic.length) warnings.push("Missing Arabic names: " + missingArabic.length);
  if (missingFrench.length) warnings.push("Missing structured French names (nameFr): " + missingFrench.length);
  if (missingPhotos.length) warnings.push("Products without exact photo mapping: " + missingPhotos.length);
  if (orphanPhotoMappings.length) warnings.push("Orphan photo mappings: " + orphanPhotoMappings.length);
  if (duplicateEnglishNames.length) warnings.push("Duplicate English display-name groups: " + duplicateEnglishNames.length);
  if (duplicateArabicNames.length) warnings.push("Duplicate Arabic display-name groups: " + duplicateArabicNames.length);
  if (duplicateFrenchNames.length) warnings.push("Duplicate French display-name groups: " + duplicateFrenchNames.length);
  if (bidiProducts.length) warnings.push("Products containing Unicode bidi controls: " + bidiProducts.length);
  if (malformedSizes.length) warnings.push("Malformed/noncanonical size labels: " + malformedSizes.length);
  if (nonStandardSizes.length) warnings.push("Explicit unknown-unit size labels requiring owner review: " + nonStandardSizes.length);
  if (duplicatePhotoPaths.length) warnings.push("Shared/duplicate photo paths (not automatically wrong): " + duplicatePhotoPaths.length);

  return {
    generatedAt: new Date().toISOString(),
    source: rel(PRODUCTS_FILE),
    photoMap: rel(PHOTOS_FILE),
    counts: {
      products: products.length,
      variants: variants.length,
      uniqueProductIds: productIdSeen.size,
      uniqueVariantIds: variantIdSeen.size,
      categories: new Set(products.map(product => product.category)).size,
      exactPhotoMappings: products.length - missingPhotos.length,
      missingPhotoMappings: missingPhotos.length,
      photoCoveragePercent: Number((((products.length - missingPhotos.length) / Math.max(products.length, 1)) * 100).toFixed(2)),
      structuredFrenchNames: products.length - missingFrench.length,
      structuredFrenchCoveragePercent: Number((((products.length - missingFrench.length) / Math.max(products.length, 1)) * 100).toFixed(2))
    },
    duplicateProductIds,
    duplicateVariantIds,
    duplicateEnglishNames,
    duplicateArabicNames,
    duplicateFrenchNames,
    missingEnglish,
    missingArabic,
    missingFrench,
    invalidCategories,
    productsWithoutVariants,
    invalidPrices,
    nonPositivePrices,
    excessivePrecision,
    malformedSizes,
    nonStandardSizes,
    bidiProducts,
    missingPhotos,
    orphanPhotoMappings,
    brokenImageReferences,
    duplicatePhotoPaths,
    externalImageMappings,
    structuralErrors,
    warnings
  };
}

function printHuman(report) {
  const c = report.counts;
  console.log("Zayt w Mouneh catalogue validation");
  console.log("=================================");
  console.log("Products: " + c.products + " (" + c.uniqueProductIds + " unique IDs)");
  console.log("Variants: " + c.variants + " (" + c.uniqueVariantIds + " unique IDs)");
  console.log("Categories: " + c.categories);
  console.log("Exact photo mappings: " + c.exactPhotoMappings + "/" + c.products + " (" + c.photoCoveragePercent + "%)");
  console.log("Structured French names: " + c.structuredFrenchNames + "/" + c.products + " (" + c.structuredFrenchCoveragePercent + "%)");
  console.log("Duplicate English names: " + report.duplicateEnglishNames.length);
  console.log("Duplicate Arabic names: " + report.duplicateArabicNames.length);
  console.log("Duplicate French names: " + report.duplicateFrenchNames.length);
  console.log("Unicode bidi-control products: " + report.bidiProducts.length);
  console.log("Missing photo mappings: " + report.missingPhotos.length);
  console.log("Orphan photo mappings: " + report.orphanPhotoMappings.length);
  console.log("Broken mapped assets: " + report.brokenImageReferences.length);
  console.log("");
  if (report.structuralErrors.length) {
    console.error("STRUCTURAL ERRORS");
    for (const issue of report.structuralErrors) console.error("- " + issue);
  } else {
    console.log("Structural validation: PASS");
  }
  if (report.warnings.length) {
    console.log("");
    console.log("Warnings / owner-review signals");
    for (const issue of report.warnings) console.log("- " + issue);
  }
}

let report;
try {
  report = validate();
} catch (error) {
  console.error("Catalogue validator crashed:", error && error.stack ? error.stack : error);
  process.exit(2);
}

if (process.argv.includes("--json")) {
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
} else {
  printHuman(report);
}

if (process.argv.includes("--ci") && report.structuralErrors.length) {
  process.exitCode = 1;
}

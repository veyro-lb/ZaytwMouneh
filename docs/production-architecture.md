# Production architecture

## Source of truth
Cloudflare deploys `public/` as static assets. `worker.js` is the request layer. Root-level storefront copies are legacy and must not be used for production edits.

## Commerce invariant
Customers build a cart and submit the order on the website. Orders enter the shared order system and can appear in the owner console and customer account. Availability, delivery and payment details may still require confirmation before a sale is final. WhatsApp is support/communication only and is not required to place an order.

Guest checkout stays enabled to reduce conversion friction. A random claim token is saved locally after checkout so a guest order can later be linked to the authenticated member; the backend validates that token before linking.

## Routes
Canonical public routes use clean URLs: `/shop`, `/gift`, `/recipes`, `/about`, `/contact`, `/privacy`, `/terms`. Legacy `.html` routes redirect permanently.

Products have server-rendered URLs at `/products/<id>`. The Worker builds Product JSON-LD and the sitemap from the same catalogue data used by the storefront and merges live public product overrides.

## Caching
HTML is revalidated. Versioned JS/CSS can be cached for a week. Versioned media/assets can be cached for one year. Account, checkout, order and admin pages are never cached.

## Mobile media
Autoplay video is suppressed when reduced motion is requested, Save-Data is enabled, the connection reports 2G, or the viewport is phone-sized. Posters render first; manual playback remains available.

## Security
Sensitive data lives behind Supabase authorization. Public browser code contains only the publishable Supabase key. Privileged rewards/checkout/customer-order implementations live in the non-exposed `private` schema and are called through security-invoker public wrappers. Global response headers include CSP, HSTS, frame denial, MIME sniffing protection and restrictive permissions policy.

## Domain migration
Canonical URLs for Worker-rendered routes use the request origin. When a custom domain is attached, product URLs, sitemap and robots automatically use it. Static public-page canonicals are rewritten by the Worker for the clean public routes.

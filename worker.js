let catalogPromise;

const securityHeaders={
  "X-Content-Type-Options":"nosniff",
  "X-Frame-Options":"DENY",
  "Referrer-Policy":"strict-origin-when-cross-origin",
  "Permissions-Policy":"camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security":"max-age=31536000; includeSubDomains",
  "Content-Security-Policy":"default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
};

function esc(value){
  return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function jsonForHtml(value){return JSON.stringify(value).replace(/</g,"\\u003c");}
function money(value){return "$"+Number(value||0).toFixed(2);}
async function getCatalog(env,request){
  if(!catalogPromise){
    const url=new URL("/product-index.json",request.url);
    catalogPromise=env.ASSETS.fetch(url).then(async r=>{
      if(!r.ok)throw new Error("Product index unavailable");
      return (await r.json()).products||[];
    }).catch(err=>{catalogPromise=null;throw err;});
  }
  return catalogPromise;
}
function productHtml(product,request){
  const url=new URL(request.url);
  const origin=url.origin;
  const canonical=origin+"/products/"+encodeURIComponent(product.id);
  const imagePath=product.image?"/"+String(product.image).replace(/^\//,""):"/assets/logo.svg";
  const imageUrl=origin+imagePath;
  const sizes=(product.variants||[]).map(v=>v.sizeEn).filter(Boolean);
  const minPrice=Math.min(...(product.variants||[]).map(v=>Number(v.price)||0));
  const description=("Shop "+product.nameEn+(product.nameAr?" ("+product.nameAr+")":"")+" from Zayt w Mouneh. "+product.category+". "+(sizes.length?"Available in "+sizes.join(", ")+". ":"")+"Order through secure website checkout with delivery across Lebanon.").slice(0,220);
  const offers=(product.variants||[]).map(v=>({
    "@type":"Offer",
    "sku":v.id,
    "url":canonical,
    "priceCurrency":"USD",
    "price":Number(v.price||0).toFixed(2),
    "availability":"https://schema.org/InStock",
    "itemCondition":"https://schema.org/NewCondition"
  }));
  const schema={
    "@context":"https://schema.org",
    "@type":"Product",
    "name":product.nameEn,
    "alternateName":product.nameAr||undefined,
    "image":[imageUrl],
    "description":description,
    "category":product.category,
    "sku":product.id,
    "brand":{"@type":"Brand","name":"Zayt w Mouneh"},
    "offers":offers
  };
  const rows=(product.variants||[]).map(v=>'<tr><td>'+esc(v.sizeEn)+'</td><td dir="rtl">'+esc(v.sizeAr||v.sizeEn)+'</td><td>'+esc(money(v.price))+'</td></tr>').join("");
  return `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0f4a20">
<title>${esc(product.nameEn)} | Zayt w Mouneh</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="product">
<meta property="og:title" content="${esc(product.nameEn)} | Zayt w Mouneh">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(imageUrl)}">
<meta property="og:locale" content="en_LB">
<meta property="og:locale:alternate" content="ar_LB">
<script type="application/ld+json">${jsonForHtml(schema)}</script>
<style>
:root{font-family:Arial,"Noto Kufi Arabic",sans-serif;color:#17351f;background:#f4efe5}*{box-sizing:border-box}body{margin:0}.shell{width:min(1120px,calc(100% - 32px));margin:auto}.top{border-bottom:1px solid #d9d0bf;background:#fffdf8}.top .shell{min-height:76px;display:flex;align-items:center;justify-content:space-between;gap:18px}.brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit;font-weight:800}.brand img{width:46px;height:46px}.nav{display:flex;gap:14px;flex-wrap:wrap}.nav a{color:#285538;text-decoration:none;font-weight:700}.crumbs{padding:22px 0 8px;font-size:13px;color:#667266}.crumbs a{color:inherit}.product{display:grid;grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr);gap:34px;padding:28px 0 52px}.visual{background:#fff;border:1px solid #ded5c4;border-radius:24px;min-height:480px;display:grid;place-items:center;padding:28px}.visual img{max-width:100%;max-height:520px;object-fit:contain}.copy{background:#fffdf8;border:1px solid #ded5c4;border-radius:24px;padding:30px}.kicker{margin:0 0 8px;text-transform:uppercase;letter-spacing:.12em;font-size:12px;color:#62705f}.copy h1{font:700 clamp(34px,5vw,62px)/.98 Georgia,serif;margin:0 0 8px}.arabic{font-size:21px;margin:0 0 22px;color:#3a5e43}.lede{font-size:16px;line-height:1.65;color:#526153}.price{font-size:25px;font-weight:800;margin:20px 0}.table{width:100%;border-collapse:collapse;margin:18px 0 24px}.table th,.table td{padding:11px 8px;border-bottom:1px solid #e7dfd2;text-align:left}.table th{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#647064}.actions{display:flex;gap:10px;flex-wrap:wrap}.actions a{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 18px;border-radius:999px;text-decoration:none;font-weight:800}.primary{background:#174d29;color:#fff}.secondary{background:#eee7da;color:#17351f}.note{margin:20px 0 0;padding:14px 16px;border-radius:16px;background:#eef4ea;font-size:13px;line-height:1.55}.foot{border-top:1px solid #d9d0bf;padding:26px 0 40px;color:#657064;font-size:13px}@media(max-width:760px){.top .shell{min-height:68px}.nav a:nth-child(2){display:none}.product{grid-template-columns:1fr;gap:18px;padding-top:18px}.visual{min-height:330px}.copy{padding:22px}.copy h1{font-size:40px}.table th,.table td{padding:10px 5px;font-size:13px}}
</style>
</head>
<body>
<header class="top"><div class="shell"><a class="brand" href="/"><img src="/assets/logo.svg" alt=""><span>Zayt w Mouneh</span></a><nav class="nav" aria-label="Primary"><a href="/shop">Shop</a><a href="/gift">Gifts</a><a href="/account">Account</a></nav></div></header>
<main class="shell">
<div class="crumbs"><a href="/">Home</a> / <a href="/shop">Shop</a> / ${esc(product.category)}</div>
<section class="product">
<div class="visual"><img src="${esc(imagePath)}" alt="${esc(product.nameEn)}" width="800" height="800"></div>
<article class="copy">
<p class="kicker">${esc(product.category)}</p>
<h1>${esc(product.nameEn)}</h1>
${product.nameAr?'<p class="arabic" lang="ar" dir="rtl">'+esc(product.nameAr)+'</p>':""}
<p class="lede">${esc(description)}</p>
<p class="price">From ${esc(money(minPrice))}</p>
<table class="table"><thead><tr><th>Size</th><th>الحجم</th><th>Price</th></tr></thead><tbody>${rows}</tbody></table>
<div class="actions"><a class="primary" href="/shop?product=${encodeURIComponent(product.id)}#shop">Choose size & add to pantry</a><a class="secondary" href="/shop">Browse all products</a></div>
<p class="note"><strong>Website checkout:</strong> place the order directly on Zayt w Mouneh. WhatsApp is optional for support and transactional status updates.<br><span lang="ar" dir="rtl"><strong>إتمام الطلب عبر الموقع:</strong> أرسل طلبك مباشرة من زيت ومونة، وواتساب متاح للمساعدة أو تحديثات حالة الطلب الاختيارية.</span></p>
</article>
</section>
</main>
<footer class="foot"><div class="shell">Zayt w Mouneh · Lebanese pantry essentials · Delivery across Lebanon</div></footer>
</body></html>`;
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    const match=url.pathname.match(/^\/products\/([a-z0-9-]+)\/?$/);
    if(!match)return env.ASSETS.fetch(request);
    try{
      const products=await getCatalog(env,request);
      const product=products.find(p=>p.id===match[1]);
      if(!product)return new Response("Product not found",{status:404,headers:{"Content-Type":"text/plain; charset=utf-8",...securityHeaders}});
      return new Response(productHtml(product,request),{status:200,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",...securityHeaders}});
    }catch{
      return new Response("Product page temporarily unavailable",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store",...securityHeaders}});
    }
  }
};

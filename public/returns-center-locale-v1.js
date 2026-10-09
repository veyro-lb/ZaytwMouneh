(function(){
"use strict";
if(window.__ZWM_RETURNS_CENTER_LOCALE_V1__)return;
window.__ZWM_RETURNS_CENTER_LOCALE_V1__=true;

function get(k){try{return localStorage.getItem(k)}catch(e){return null}}
function currentLocale(){
  var match=location.pathname.match(/^\/(ar|fr)(?:\/|$)/);
  if(match)return match[1];
  try{
    if(window.ZWM_LOCALE&&typeof window.ZWM_LOCALE.get==="function"){
      var fromApi=window.ZWM_LOCALE.get();
      if(fromApi==="ar"||fromApi==="fr"||fromApi==="en")return fromApi;
    }
  }catch(e){}
  var canonical=get("zwm-locale-v3");
  if(canonical==="ar"||canonical==="fr"||canonical==="en")return canonical;
  if(get("zwm:french:v1")==="1")return "fr";
  return get("zwm-lang-v2")==="ar"?"ar":"en";
}
function localePath(path,locale){
  try{
    if(window.ZWM_LOCALE&&typeof window.ZWM_LOCALE.localePath==="function")return window.ZWM_LOCALE.localePath(path,locale);
  }catch(e){}
  var clean=String(path||"/").replace(/^\/(ar|fr)(?=\/|$)/,"")||"/";
  if(clean.charAt(0)!=="/")clean="/"+clean;
  return locale==="en"?clean:"/"+locale+(clean==="/"?"/":clean);
}
function q(selector){return document.querySelector(selector)}
function qa(selector){return Array.from(document.querySelectorAll(selector))}
function setText(selector,value){var el=q(selector);if(el)el.textContent=value}
function setAttr(selector,name,value){var el=q(selector);if(el)el.setAttribute(name,value)}

var COPY={
  en:{
    title:"Returns & Product Issues | Zayt w Mouneh",
    description:"Report a genuine product or order problem within 24 hours of delivery. Contact Zayt w Mouneh for further help.",
    skip:"Skip to content",
    eyebrow:"Customer care",
    heading:"Returns & Product Issues",
    intro:"Returns are only for genuine product or order problems and must be reported within 24 hours of delivery. Verify your order to report an issue, or contact us for further help.",
    cardTitle:"Find your order securely",
    cardIntro:"Enter your order code and the contact information used for the order. We verify ownership before showing private order details.",
    codeLabel:"Order code",
    codePlaceholder:"Example: ZW-…",
    codeHint:"Use the code shown on your Zayt w Mouneh order confirmation or receipt.",
    contactLabel:"Email or phone used on the order",
    contactPlaceholder:"Email address or phone number",
    contactHint:"For guest orders, this must match the email or phone used when ordering. If you are signed in to the account that owns the order, the order code is enough.",
    security:[
      ["Find the order","Enter the order code shown on your confirmation or receipt."],
      ["Confirm it is yours","We match your signed-in account or the contact details used for the order."],
      ["Continue securely","Once verified, you can view the order and submit an eligible request."]
    ],
    verify:"Verify order",
    sideTitle:"What you can report",
    sideIntro:"Only genuine product or order problems qualify. Report within 24 hours of delivery.",
    items:["Damaged, broken or leaking products","Missing or incorrect products","Quality, spoilage or safety problems","24 hours to report after delivery"],
    sideOutro:"No change-of-mind returns. For late reports or anything else, contact us directly.",
    policy:"Read the Returns & Product Issues Policy"
  },
  ar:{
    title:"الإرجاع ومشاكل المنتجات | زيت ومونة",
    description:"تحقق من طلب زيت ومونة وقدّم بأمان طلب إرجاع أو استبدال أو بلاغاً عن مشكلة في منتج.",
    skip:"الانتقال إلى المحتوى",
    eyebrow:"خدمة العملاء",
    heading:"الإرجاع ومشاكل المنتجات",
    intro:"يُقبل الإرجاع فقط عند وجود مشكلة فعلية في المنتج أو الطلب، ويجب الإبلاغ خلال 24 ساعة من التسليم. تحقّق من طلبك للإبلاغ عن المشكلة أو تواصل معنا للمساعدة.",
    cardTitle:"اعثر على طلبك بأمان",
    cardIntro:"أدخل رمز الطلب وبيانات التواصل المستخدمة فيه. نتحقق من ملكية الطلب قبل إظهار تفاصيله الخاصة.",
    codeLabel:"رمز الطلب",
    codePlaceholder:"مثال: ZW-…",
    codeHint:"استخدم الرمز الظاهر في تأكيد طلب زيت ومونة أو على الإيصال.",
    contactLabel:"البريد الإلكتروني أو رقم الهاتف المستخدم في الطلب",
    contactPlaceholder:"البريد الإلكتروني أو رقم الهاتف",
    contactHint:"في طلبات الزوار، يجب أن يطابق ذلك البريد الإلكتروني أو رقم الهاتف المستخدم عند الطلب. وإذا كنت مسجّل الدخول إلى الحساب المرتبط بالطلب، فيكفي رمز الطلب.",
    security:[
      ["العثور على الطلب","أدخل رمز الطلب الظاهر في التأكيد أو الإيصال."],
      ["تأكيد ملكية الطلب","نطابق الحساب المسجّل أو بيانات التواصل المستخدمة في الطلب."],
      ["المتابعة بأمان","بعد التحقق، يمكنك عرض الطلب وإرسال طلب مؤهل."]
    ],
    verify:"تحقق من الطلب",
    sideTitle:"ما يمكنك الإبلاغ عنه",
    sideIntro:"فقط المشاكل الفعلية في المنتج أو الطلب مؤهلة للإرجاع. يرجى الإبلاغ خلال 24 ساعة من التسليم.",
    items:["منتجات متضررة أو مكسورة أو تسرّب","منتجات ناقصة أو خاطئة","مشاكل الجودة أو التلف أو السلامة","مهلة الإبلاغ 24 ساعة من التسليم"],
    sideOutro:"لا نقبل الإرجاع بسبب تغيير الرأي. للبلاغات المتأخرة أو المساعدة الإضافية تواصل معنا مباشرةً.",
    policy:"اقرأ سياسة الإرجاع ومشاكل المنتجات"
  },
  fr:{
    title:"Retours et problèmes produits | Zayt w Mouneh",
    description:"Vérifiez une commande Zayt w Mouneh et envoyez en toute sécurité une demande de retour, d’échange ou un signalement produit.",
    skip:"Aller au contenu",
    eyebrow:"Service client",
    heading:"Retours et problèmes produits",
    intro:"Les retours sont réservés aux vrais problèmes de produit ou de commande signalés dans les 24 heures suivant la livraison. Vérifiez votre commande ou contactez-nous pour toute aide.",
    cardTitle:"Retrouvez votre commande en toute sécurité",
    cardIntro:"Saisissez le code de commande et les coordonnées utilisées pour la commande. Nous vérifions qu’elle vous appartient avant d’afficher ses informations privées.",
    codeLabel:"Code de commande",
    codePlaceholder:"Exemple : ZW-…",
    codeHint:"Utilisez le code figurant sur votre confirmation de commande Zayt w Mouneh ou votre reçu.",
    contactLabel:"E-mail ou téléphone utilisé pour la commande",
    contactPlaceholder:"Adresse e-mail ou numéro de téléphone",
    contactHint:"Pour une commande invité, ces informations doivent correspondre à l’e-mail ou au téléphone utilisé lors de la commande. Si vous êtes connecté au compte propriétaire de la commande, le code suffit.",
    security:[
      ["Retrouver la commande","Saisissez le code figurant sur votre confirmation ou votre reçu."],
      ["Confirmer qu’elle est bien à vous","Nous faisons correspondre votre compte connecté ou les coordonnées utilisées pour la commande."],
      ["Continuer en toute sécurité","Une fois la commande vérifiée, vous pouvez la consulter et envoyer une demande éligible."]
    ],
    verify:"Vérifier la commande",
    sideTitle:"Ce que vous pouvez signaler",
    sideIntro:"Seuls les vrais problèmes de produit ou de commande sont éligibles. Signalez-les dans les 24 heures suivant la livraison.",
    items:["Produits endommagés, cassés ou fuyants","Produits manquants ou incorrects","Problèmes de qualité, d’altération ou de sécurité","24 heures pour signaler après livraison"],
    sideOutro:"Pas de retour pour changement d’avis. Pour tout signalement tardif ou autre question, contactez-nous directement.",
    policy:"Lire la politique de retours et problèmes produits"
  }
};

function apply(){
  if(!document.body||document.body.dataset.page!=="returns")return;
  var locale=currentLocale(),copy=COPY[locale]||COPY.en;
  document.documentElement.lang=locale;
  document.documentElement.dir=locale==="ar"?"rtl":"ltr";
  document.documentElement.dataset.zwmLocale=locale;
  document.title=copy.title;
  var meta=q('meta[name="description"]');if(meta)meta.setAttribute("content",copy.description);
  setText("#skipLink",copy.skip);
  var shell=q(".returns-center-shell");
  if(shell){shell.lang=locale;shell.dir=locale==="ar"?"rtl":"ltr";shell.dataset.returnsLocale=locale}
  setText(".returns-center-hero > small",copy.eyebrow);
  setText(".returns-center-hero > h1",copy.heading);
  setText(".returns-center-hero > p",copy.intro);
  setText(".returns-center-card > h2",copy.cardTitle);
  setText(".returns-center-card > p",copy.cardIntro);
  var labels=qa(".returns-center-form > label");
  if(labels[0]){
    var firstSpan=labels[0].querySelector("span"),firstSmall=labels[0].querySelector("small");
    if(firstSpan)firstSpan.textContent=copy.codeLabel;
    if(firstSmall)firstSmall.textContent=copy.codeHint;
  }
  if(labels[1]){
    var secondSpan=labels[1].querySelector("span"),secondSmall=labels[1].querySelector("small");
    if(secondSpan)secondSpan.textContent=copy.contactLabel;
    if(secondSmall)secondSmall.textContent=copy.contactHint;
  }
  setAttr("#returnsLookupReference","placeholder",copy.codePlaceholder);
  setAttr("#returnsLookupContact","placeholder",copy.contactPlaceholder);
  qa(".returns-center-security > div").forEach(function(row,index){
    var pair=copy.security[index];if(!pair)return;
    var strong=row.querySelector("strong"),small=row.querySelector("small");
    if(strong)strong.textContent=pair[0];if(small)small.textContent=pair[1];
  });
  setText('#returnsLookupForm button[type="submit"]',copy.verify);
  setText(".returns-center-side > h2",copy.sideTitle);
  var sideParagraphs=qa(".returns-center-side > p");
  if(sideParagraphs[0])sideParagraphs[0].textContent=copy.sideIntro;
  if(sideParagraphs[1])sideParagraphs[1].textContent=copy.sideOutro;
  qa(".returns-center-side > ul > li").forEach(function(li,index){if(copy.items[index])li.textContent=copy.items[index]});
  var policy=q(".returns-center-policy-link");
  if(policy){policy.textContent=copy.policy;policy.href=localePath("/returns-policy",locale)}
}
window.ZWM_APPLY_RETURNS_CENTER_LOCALE=apply;
document.addEventListener("zwm:localechange",apply);
window.addEventListener("pageshow",apply,{passive:true});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",apply,{once:true});else apply();
})();
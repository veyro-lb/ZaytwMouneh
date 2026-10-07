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
    title:"Returns & Product Issues | Zayt W Mouneh",
    description:"Verify a Zayt W Mouneh order and submit a secure return, exchange or product issue request.",
    skip:"Skip to content",
    eyebrow:"Customer care",
    heading:"Returns & Product Issues",
    intro:"Have a problem with an order? Enter the order code from your receipt or order confirmation. We verify the order before showing its products or allowing a request.",
    cardTitle:"Find your order securely",
    cardIntro:"Your order code identifies the order, but it is not treated as a password. We verify ownership before revealing order details.",
    codeLabel:"Order code",
    codePlaceholder:"Example: ZW-…",
    codeHint:"Use the code shown on your Zayt W Mouneh order confirmation or receipt.",
    contactLabel:"Email or phone used on the order",
    contactPlaceholder:"Email address or phone number",
    contactHint:"For guest orders, this must match the email or phone used when ordering. If you are signed in to the account that owns the order, the order code is enough.",
    security:[
      ["Order code check","We confirm the code exists without revealing customer data."],
      ["Ownership verification","Signed-in ownership or matching order contact details are required."],
      ["Temporary access","Successful verification creates a short-lived access token. Repeated incorrect attempts are rate-limited."]
    ],
    verify:"Verify order",
    sideTitle:"What you can report",
    sideIntro:"This center is available even before you place an order, but a request can only be opened for a verified delivered order.",
    items:["Damaged, broken or leaking products","Missing or incorrect products","Quality, spoilage or safety concerns","Return or exchange of an eligible unopened product"],
    sideOutro:"Submitting a request does not automatically approve a refund. Every resolution is reviewed against the actual order, quantities and amount paid.",
    policy:"Read the Returns & Product Issues Policy"
  },
  ar:{
    title:"الإرجاع ومشاكل المنتجات | زيت ومونة",
    description:"تحقق من طلب زيت ومونة وقدّم بأمان طلب إرجاع أو استبدال أو بلاغاً عن مشكلة في منتج.",
    skip:"الانتقال إلى المحتوى",
    eyebrow:"خدمة العملاء",
    heading:"الإرجاع ومشاكل المنتجات",
    intro:"هل لديك مشكلة في طلب؟ أدخل رمز الطلب الموجود على الإيصال أو تأكيد الطلب. نتحقق من الطلب قبل إظهار منتجاته أو السماح بإرسال طلب.",
    cardTitle:"اعثر على طلبك بأمان",
    cardIntro:"رمز الطلب يحدد طلبك، لكنه لا يُعامل ككلمة مرور. نتحقق من ملكية الطلب قبل إظهار أي تفاصيل.",
    codeLabel:"رمز الطلب",
    codePlaceholder:"مثال: ZW-…",
    codeHint:"استخدم الرمز الظاهر في تأكيد طلب زيت ومونة أو على الإيصال.",
    contactLabel:"البريد الإلكتروني أو رقم الهاتف المستخدم في الطلب",
    contactPlaceholder:"البريد الإلكتروني أو رقم الهاتف",
    contactHint:"في طلبات الزوار، يجب أن يطابق ذلك البريد الإلكتروني أو رقم الهاتف المستخدم عند الطلب. وإذا كنت مسجّل الدخول إلى الحساب المرتبط بالطلب، فيكفي رمز الطلب.",
    security:[
      ["التحقق من رمز الطلب","نتأكد من وجود الرمز من دون كشف بيانات العميل."],
      ["التحقق من ملكية الطلب","يلزم أن يكون الطلب مرتبطاً بالحساب المسجّل أو أن تتطابق بيانات التواصل مع الطلب."],
      ["وصول مؤقت","بعد التحقق الناجح يتم إنشاء رمز وصول قصير المدة، كما يتم تقييد المحاولات الخاطئة المتكررة."]
    ],
    verify:"تحقق من الطلب",
    sideTitle:"ما يمكنك الإبلاغ عنه",
    sideIntro:"يمكنك فتح هذا المركز في أي وقت، لكن لا يمكن إنشاء طلب إرجاع أو بلاغ إلا لطلب تم التحقق منه وتسجيله كمُسلَّم.",
    items:["منتجات متضررة أو مكسورة أو تسرّب","منتجات ناقصة أو خاطئة","مشاكل الجودة أو التلف أو السلامة","إرجاع أو استبدال منتج مؤهل غير مفتوح"],
    sideOutro:"إرسال الطلب لا يعني الموافقة التلقائية على استرداد المبلغ. تتم مراجعة كل حل بالاستناد إلى الطلب الفعلي والكميات والمبلغ المدفوع.",
    policy:"اقرأ سياسة الإرجاع ومشاكل المنتجات"
  },
  fr:{
    title:"Retours et problèmes produits | Zayt W Mouneh",
    description:"Vérifiez une commande Zayt W Mouneh et envoyez en toute sécurité une demande de retour, d’échange ou un signalement produit.",
    skip:"Aller au contenu",
    eyebrow:"Service client",
    heading:"Retours et problèmes produits",
    intro:"Un problème avec une commande ? Saisissez le code figurant sur votre reçu ou confirmation. Nous vérifions la commande avant d’afficher ses produits ou d’autoriser une demande.",
    cardTitle:"Retrouvez votre commande en toute sécurité",
    cardIntro:"Le code de commande identifie votre commande, mais n’est pas considéré comme un mot de passe. Nous vérifions que la commande vous appartient avant d’en afficher les détails.",
    codeLabel:"Code de commande",
    codePlaceholder:"Exemple : ZW-…",
    codeHint:"Utilisez le code figurant sur votre confirmation de commande Zayt W Mouneh ou votre reçu.",
    contactLabel:"E-mail ou téléphone utilisé pour la commande",
    contactPlaceholder:"Adresse e-mail ou numéro de téléphone",
    contactHint:"Pour une commande invité, ces informations doivent correspondre à l’e-mail ou au téléphone utilisé lors de la commande. Si vous êtes connecté au compte propriétaire de la commande, le code suffit.",
    security:[
      ["Vérification du code","Nous confirmons que le code existe sans révéler les données du client."],
      ["Vérification du propriétaire","Le compte connecté doit être propriétaire de la commande ou les coordonnées doivent correspondre à celles de la commande."],
      ["Accès temporaire","Une vérification réussie crée un jeton d’accès de courte durée. Les tentatives incorrectes répétées sont limitées."]
    ],
    verify:"Vérifier la commande",
    sideTitle:"Ce que vous pouvez signaler",
    sideIntro:"Ce centre est accessible à tout moment, mais une demande ne peut être ouverte que pour une commande vérifiée et marquée comme livrée.",
    items:["Produits endommagés, cassés ou fuyants","Produits manquants ou incorrects","Problèmes de qualité, d’altération ou de sécurité","Retour ou échange d’un produit non ouvert éligible"],
    sideOutro:"L’envoi d’une demande n’approuve pas automatiquement un remboursement. Chaque solution est examinée selon la commande réelle, les quantités et le montant payé.",
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
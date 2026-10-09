(function(){
"use strict";
if(window.__ZWM_RETURNS_POLICY_LOCALE_V1__)return;
window.__ZWM_RETURNS_POLICY_LOCALE_V1__=true;

function currentLocale(){
  var first=String(location.pathname||"/").split("/")[1];
  if(first==="ar"||first==="fr")return first;
  try{
    if(window.ZWM_LOCALE&&typeof window.ZWM_LOCALE.get==="function"){
      var fromApi=window.ZWM_LOCALE.get();
      if(fromApi==="ar"||fromApi==="fr"||fromApi==="en")return fromApi;
    }
  }catch(e){}
  try{
    var canonical=localStorage.getItem("zwm-locale-v3");
    if(canonical==="ar"||canonical==="fr"||canonical==="en")return canonical;
    if(localStorage.getItem("zwm:french:v1")==="1")return "fr";
    if(localStorage.getItem("zwm-lang-v2")==="ar")return "ar";
  }catch(e){}
  var lang=(document.documentElement.lang||"en").toLowerCase();
  return lang==="ar"||lang==="fr"?lang:"en";
}
function localePath(path,locale){
  try{
    if(window.ZWM_LOCALE&&typeof window.ZWM_LOCALE.localePath==="function")return window.ZWM_LOCALE.localePath(path,locale);
  }catch(e){}
  return path;
}
function sectionHtml(section){
  return '<section'+(section.legal?' class="policy-legal"':'')+'><h2>'+section.title+'</h2>'+
    section.paragraphs.map(function(p){return '<p>'+p+'</p>';}).join('')+'</section>';
}

var COPY={
  "en": {
    "title": "Return Policy | Zayt w Mouneh",
    "description": "Zayt w Mouneh accepts return requests only for products with a genuine problem, reported within 24 hours of delivery. Contact us for further help.",
    "skip": "Skip to content",
    "eyebrow": "Customer care",
    "heading": "Return Policy",
    "updated": "Last updated: 9 October 2026",
    "intro": "Returns are accepted only when something is wrong with the product or order. Please report the problem within 24 hours of delivery. We will review your request and explain the next steps.",
    "primary": "Report a product problem",
    "secondary": "Contact us",
    "summaryTitle": "At a glance",
    "summary": [
      "Returns are only for damaged, defective, leaking, spoiled, incorrect or missing products.",
      "Report the problem within 24 hours of delivery.",
      "No returns for a change of mind, personal taste or simply because an item is unopened.",
      "For further help or reports after 24 hours, contact us directly. Your statutory rights remain protected."
    ],
    "sections": [
      {
        "title": "1. When a return is possible",
        "paragraphs": [
          "We accept return or replacement requests <strong>only if something is wrong with the product or the order</strong>, such as a damaged or leaking item, a genuine quality or safety defect, a spoiled product, or an incorrect or missing item.",
          "We do not accept returns or exchanges just because you changed your mind, no longer need the item, dislike its taste, or want to return an otherwise correct, undamaged product. Being unopened does not, by itself, make a product returnable."
        ]
      },
      {
        "title": "2. Report within 24 hours",
        "paragraphs": [
          "Please submit your product-problem request <strong>within 24 hours after delivery</strong>, using the delivery time as the starting point—not the order or payment time.",
          "If more than 24 hours have passed, or the recorded delivery time is incorrect, please <a href=\"/contact\">contact us</a> so we can advise you. This reporting procedure does not limit any rights you have under applicable law."
        ]
      },
      {
        "title": "3. How to report a problem",
        "paragraphs": [
          "Go to <strong>Returns &amp; Product Issues</strong>, verify your order code and order contact information, then select the affected product, describe what is wrong and submit the request. Add photographs where helpful.",
          "Please keep the item and packaging for review when safe to do so. If you suspect a food-safety problem, stop using or consuming the product; do not keep or transport anything unsafe."
        ]
      },
      {
        "title": "4. Review and possible outcomes",
        "paragraphs": [
          "Submitting a request does not automatically approve a return or refund. We review the problem and may ask for photos or more information.",
          "If the issue is confirmed, we will agree on an appropriate solution, which may be a replacement, exchange or a partial or full refund for the <strong>affected item(s)</strong>. A problem with one item does not automatically qualify the entire order for a refund."
        ]
      },
      {
        "title": "5. Refunds and arrangements",
        "paragraphs": [
          "Any approved refund is based on the amount actually paid for the affected item(s), accounting for discounts and any previous refunds. We will explain the refund method and timing after reviewing the case.",
          "If collection, return or redelivery is needed, we will confirm the arrangements before asking you to send anything back. For a mistake on our side, we will arrange reasonable corrective steps."
        ]
      },
      {
        "title": "6. More help and consumer rights",
        "legal": true,
        "paragraphs": [
          "For other questions, late reports or anything not covered above, <strong>please contact Zayt w Mouneh</strong> through our <a href=\"/contact\">contact page</a> or <a href=\"https://wa.me/96170381412\" target=\"_blank\" rel=\"noopener\">WhatsApp (<bdi dir=\"ltr\" translate=\"no\">+961 70 381 412</bdi>)</a>.",
          "<strong>Nothing in this policy removes or limits rights granted by applicable Lebanese consumer-protection law.</strong> We will consider any issue that must be addressed under the law even outside our usual 24-hour reporting process."
        ]
      }
    ]
  },
  "ar": {
    "title": "سياسة الإرجاع | زيت ومونة",
    "description": "الإرجاع لدى زيت ومونة يقتصر على وجود مشكلة فعلية في المنتج مع الإبلاغ خلال 24 ساعة من التسليم. تواصل معنا للمساعدة.",
    "skip": "الانتقال إلى المحتوى",
    "eyebrow": "خدمة العملاء",
    "heading": "سياسة الإرجاع",
    "updated": "آخر تحديث: 9 أكتوبر 2026",
    "intro": "يُقبل الإرجاع فقط عند وجود مشكلة فعلية في المنتج أو الطلب. يرجى الإبلاغ خلال 24 ساعة من التسليم. نراجع الطلب ونوضح الخطوات التالية.",
    "primary": "الإبلاغ عن مشكلة في منتج",
    "secondary": "تواصل معنا",
    "summaryTitle": "باختصار",
    "summary": [
      "يُقبل الإرجاع فقط للمنتجات المتضررة أو المعيبة أو المسرّبة أو الفاسدة أو الخاطئة أو الناقصة.",
      "يجب الإبلاغ عن المشكلة خلال 24 ساعة من التسليم.",
      "لا نقبل الإرجاع بسبب تغيير الرأي أو عدم الإعجاب بالطعم أو لمجرد أن المنتج غير مفتوح.",
      "للمساعدة أو للإبلاغ بعد 24 ساعة، تواصل معنا مباشرةً. تبقى حقوقك القانونية محفوظة."
    ],
    "sections": [
      {
        "title": "1. متى يُقبل الإرجاع؟",
        "paragraphs": [
          "نقبل طلب الإرجاع أو الاستبدال <strong>فقط عند وجود مشكلة فعلية في المنتج أو الطلب</strong>، مثل التلف أو التسريب أو عيب في الجودة أو السلامة أو فساد المنتج أو استلام منتج خاطئ أو ناقص.",
          "لا نقبل الإرجاع أو التبديل بسبب تغيير الرأي أو عدم الحاجة إلى المنتج أو عدم الإعجاب بالطعم أو الرغبة بإرجاع منتج سليم ومطابق للطلب. كون المنتج غير مفتوح لا يجعله مؤهلاً للإرجاع بحد ذاته."
        ]
      },
      {
        "title": "2. الإبلاغ خلال 24 ساعة",
        "paragraphs": [
          "يرجى إرسال طلب الإبلاغ عن المشكلة <strong>خلال 24 ساعة من تسلّم الطلب</strong>، وتُحتسب المدة من وقت التسليم وليس من وقت الطلب أو الدفع.",
          "إذا مرّت أكثر من 24 ساعة، أو كان وقت التسليم المسجّل غير صحيح، يرجى <a href=\"/contact\">التواصل معنا</a> لنساعدك. لا تحد هذه الإجراءات من أي حقوق يضمنها القانون النافذ."
        ]
      },
      {
        "title": "3. كيف تُبلّغ عن المشكلة؟",
        "paragraphs": [
          "افتح صفحة <strong>الإرجاع ومشاكل المنتجات</strong>، وتحقق من طلبك باستخدام رمزه وبيانات التواصل المرتبطة به، ثم اختر المنتج المتأثر واشرح المشكلة وأرسل الطلب. يمكنك إرفاق صور عند الحاجة.",
          "يرجى الاحتفاظ بالمنتج وعبوته للمراجعة إذا كان ذلك آمناً. إذا شككت بسلامة منتج غذائي فتوقف عن استهلاكه، ولا تحتفظ به أو تنقله إذا كان ذلك غير آمن."
        ]
      },
      {
        "title": "4. المراجعة والحلول الممكنة",
        "paragraphs": [
          "إرسال البلاغ لا يعني الموافقة تلقائياً على الإرجاع أو استرداد المال. نراجع المشكلة وقد نطلب صوراً أو معلومات إضافية.",
          "عند التأكد من المشكلة، نتفق معك على حل مناسب، مثل استبدال المنتج أو تبديله أو استرداد جزء من المبلغ أو كامل قيمة <strong>المنتج أو المنتجات المتأثرة</strong>. وجود مشكلة في منتج واحد لا يعني استرداد قيمة الطلب كاملاً تلقائياً."
        ]
      },
      {
        "title": "5. المبالغ المستردة والترتيبات",
        "paragraphs": [
          "تُحتسب أي مبالغ مستردة معتمدة وفق المبلغ المدفوع فعلياً مقابل المنتج المتأثر، بعد احتساب الخصومات وأي مبالغ سبق استردادها. نوضح طريقة وموعد الاسترداد بعد مراجعة الحالة.",
          "إذا لزم استلام المنتج أو إرجاعه أو إعادة توصيله، نؤكد الترتيبات قبل إرسال أي شيء. وفي حال كان الخطأ من طرفنا، نتولى خطوات التصحيح المعقولة."
        ]
      },
      {
        "title": "6. المساعدة الإضافية وحقوق المستهلك",
        "legal": true,
        "paragraphs": [
          "للاستفسارات الأخرى أو البلاغات بعد انتهاء المدة أو أي موضوع غير مذكور هنا، <strong>يرجى التواصل مع زيت ومونة</strong> عبر <a href=\"/contact\">صفحة التواصل</a> أو <a href=\"https://wa.me/96170381412\" target=\"_blank\" rel=\"noopener\">واتساب (<bdi dir=\"ltr\" translate=\"no\">+961 70 381 412</bdi>)</a>.",
          "<strong>لا تُلغي هذه السياسة ولا تُقيّد حقوق المستهلك التي يكفلها القانون اللبناني النافذ.</strong> وسنراجع أي حالة يجب معالجتها قانوناً حتى لو كانت خارج مهلة الإبلاغ المعتادة البالغة 24 ساعة."
        ]
      }
    ]
  },
  "fr": {
    "title": "Politique de retour | Zayt w Mouneh",
    "description": "Les retours sont réservés aux vrais problèmes de produit signalés dans les 24 heures suivant la livraison. Contactez-nous pour toute aide.",
    "skip": "Aller au contenu",
    "eyebrow": "Service client",
    "heading": "Politique de retour",
    "updated": "Dernière mise à jour : 9 octobre 2026",
    "intro": "Un retour n’est possible que si le produit ou la commande présente un réel problème. Signalez-le dans les 24 heures suivant la livraison ; nous examinerons la demande et vous expliquerons la suite.",
    "primary": "Signaler un problème produit",
    "secondary": "Nous contacter",
    "summaryTitle": "En bref",
    "summary": [
      "Les retours concernent uniquement les produits endommagés, défectueux, qui fuient, altérés, incorrects ou manquants.",
      "Signalez le problème dans les 24 heures suivant la livraison.",
      "Pas de retour pour changement d’avis, préférence gustative ou simplement parce qu’un produit est non ouvert.",
      "Après 24 heures ou pour toute autre aide, contactez-nous. Vos droits légaux restent protégés."
    ],
    "sections": [
      {
        "title": "1. Dans quels cas un retour est-il possible ?",
        "paragraphs": [
          "Nous acceptons les demandes de retour ou de remplacement <strong>uniquement lorsqu’il existe un véritable problème avec le produit ou la commande</strong> : dommage, fuite, défaut de qualité ou de sécurité, altération, article incorrect ou manquant.",
          "Nous n’acceptons pas les retours pour simple changement d’avis, parce que le produit n’est plus nécessaire, parce que son goût ne plaît pas ou lorsqu’il est conforme et en bon état. Un produit non ouvert n’est pas automatiquement éligible."
        ]
      },
      {
        "title": "2. Signalement dans les 24 heures",
        "paragraphs": [
          "Veuillez envoyer votre signalement <strong>dans les 24 heures suivant la livraison</strong>. Le délai commence au moment de la livraison, et non lors de la commande ou du paiement.",
          "Si plus de 24 heures se sont écoulées, ou si l’heure de livraison enregistrée est incorrecte, veuillez <a href=\"/contact\">nous contacter</a> pour obtenir de l’aide. Cette procédure ne limite aucun droit reconnu par la loi applicable."
        ]
      },
      {
        "title": "3. Comment signaler le problème",
        "paragraphs": [
          "Ouvrez la page <strong>Retours et problèmes produits</strong>, vérifiez votre commande avec son code et les coordonnées associées, puis sélectionnez le produit concerné, décrivez le problème et envoyez la demande. Joignez des photos si cela peut aider.",
          "Conservez le produit et son emballage pour examen lorsque cela ne présente pas de danger. Si vous soupçonnez un problème de sécurité alimentaire, cessez toute consommation et ne conservez ni ne transportez un article dangereux."
        ]
      },
      {
        "title": "4. Examen et solutions possibles",
        "paragraphs": [
          "L’envoi d’une demande ne garantit pas un retour ou un remboursement. Nous examinons la situation et pouvons demander des photos ou des renseignements complémentaires.",
          "Si le problème est confirmé, nous conviendrons d’une solution appropriée : remplacement, échange, remboursement partiel ou intégral du ou des <strong>articles concernés</strong>. Un problème concernant un seul produit n’entraîne pas automatiquement le remboursement de toute la commande."
        ]
      },
      {
        "title": "5. Remboursements et organisation",
        "paragraphs": [
          "Tout remboursement approuvé tient compte du montant réellement payé pour les articles concernés, des remises et des remboursements précédents. Nous préciserons la méthode et le délai après examen.",
          "Si une collecte, un retour ou une nouvelle livraison s’avère nécessaire, nous confirmerons les modalités avant tout renvoi. En cas d’erreur de notre part, nous organiserons les mesures correctives raisonnables."
        ]
      },
      {
        "title": "6. Aide complémentaire et droits des consommateurs",
        "legal": true,
        "paragraphs": [
          "Pour les autres questions, les signalements tardifs ou tout cas non mentionné ici, <strong>contactez Zayt w Mouneh</strong> via notre <a href=\"/contact\">page de contact</a> ou <a href=\"https://wa.me/96170381412\" target=\"_blank\" rel=\"noopener\">WhatsApp (<bdi dir=\"ltr\" translate=\"no\">+961 70 381 412</bdi>)</a>.",
          "<strong>Cette politique ne supprime ni ne limite les droits des consommateurs prévus par la législation libanaise applicable.</strong> Nous examinerons tout cas devant être pris en charge légalement, même au-delà du délai habituel de 24 heures."
        ]
      }
    ]
  }
};

function render(){
  var locale=currentLocale();
  var copy=COPY[locale];
  if(!copy)return;

  document.documentElement.lang=locale;
  document.documentElement.dir=locale==="ar"?"rtl":"ltr";
  document.title=copy.title;
  var meta=document.querySelector('meta[name="description"]');
  if(meta)meta.setAttribute("content",copy.description);

  var skip=document.getElementById("skipLink");
  if(skip)skip.textContent=copy.skip;

  var root=document.querySelector(".policy-shell");
  if(!root)return;
  root.lang=locale;
  root.dir=locale==="ar"?"rtl":"ltr";
  root.dataset.policyLocale=locale;

  var returnsHref=localePath("/returns",locale);
  var ordersHref=localePath("/contact",locale);
  root.innerHTML=
    '<section class="policy-hero">'+
      '<p>'+copy.eyebrow+'</p>'+
      '<h1>'+copy.heading+'</h1>'+
      '<span>'+copy.updated+'</span>'+
      '<p>'+copy.intro+'</p>'+
      '<div class="policy-hero-actions">'+
        '<a class="policy-primary" href="'+returnsHref+'">'+copy.primary+'</a>'+
        '<a class="policy-secondary" href="'+ordersHref+'">'+copy.secondary+'</a>'+
      '</div>'+
    '</section>'+
    '<div class="policy-layout">'+
      '<aside class="policy-summary"><strong>'+copy.summaryTitle+'</strong><ul>'+
        copy.summary.map(function(item){return '<li>'+item+'</li>';}).join('')+
      '</ul></aside>'+
      '<article class="policy-content">'+copy.sections.map(sectionHtml).join('')+'</article>'+
    '</div>';
}

document.addEventListener("zwm:localechange",render);
window.addEventListener("pageshow",render,{passive:true});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",render,{once:true});
else render();
})();
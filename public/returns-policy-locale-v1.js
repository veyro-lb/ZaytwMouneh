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
  ar:{
    title:"سياسة الإرجاع ومشاكل المنتجات | زيت ومونة",
    description:"سياسة زيت ومونة للإرجاع والاستبدال والاسترداد ومشاكل المنتجات.",
    skip:"الانتقال إلى المحتوى",
    eyebrow:"خدمة العملاء",
    heading:"سياسة الإرجاع والاستبدال ومشاكل المنتجات",
    updated:"آخر تحديث: 7 أكتوبر 2026",
    intro:"نريد في زيت ومونة أن يكون كل عميل راضياً عن طلبه. إذا وصل منتج متضرراً أو خاطئاً أو ناقصاً، أو ظهرت فيه مشكلة حقيقية تتعلق بالجودة أو السلامة، يمكنك إرسال طلب للمراجعة من خلال الطلب المرتبط به.",
    primary:"ابدأ طلب إرجاع أو أبلغ عن مشكلة",
    secondary:"عرض طلباتي",
    summaryTitle:"باختصار",
    summary:[
      "طلبات تغيير الرأي للمنتجات غير المفتوحة: عادةً خلال 10 أيام تقويمية من التسليم.",
      "مشاكل التسليم الظاهرة: يرجى الإبلاغ عنها خلال 48 ساعة متى كان ذلك ممكناً بشكل معقول.",
      "يمكن الإبلاغ بشكل مستقل عن مشاكل الجودة أو التلف أو السلامة حتى بعد فتح المنتج.",
      "إرسال الطلب يعني أنه سيخضع للمراجعة؛ ولا يعني استرداداً تلقائياً."
    ],
    sections:[
      {
        title:"1. المنتجات غير المستخدمة وغير المفتوحة",
        paragraphs:[
          "قد تكون المنتجات غير المستخدمة وغير المفتوحة مؤهلة للإرجاع أو الاستبدال إذا قُدّم الطلب خلال <strong>10 أيام تقويمية من التسليم</strong>، شرط أن يبقى المنتج مختوماً وغير مستخدم وفي حالته وعبوته الأصليتين وأن يكون مناسباً للفحص والإرجاع.",
          "تُحتسب مهلة الأيام العشرة من تاريخ التسليم، وليس من تاريخ الطلب أو الدفع. وإذا لم يتوافر وقت تسليم موثوق، يُحال الطلب إلى مراجعة يدوية بدلاً من افتراض تاريخ غير مؤكد.",
          "المنتجات التي فُتحت أو استُخدمت لا تكون عادةً مؤهلة لإرجاع أو استبدال بسبب تغيير الرأي. ولا يمنع ذلك الإبلاغ عن عيب حقيقي أو مشكلة جودة أو سلامة أو منتج خاطئ أو ناقص أو أي حالة أخرى تحميها القوانين النافذة."
        ]
      },
      {
        title:"2. المنتجات المتضررة أو المسرِّبة أو الناقصة أو الخاطئة",
        paragraphs:[
          "في حال وجود مشكلة ظاهرة عند التسليم، مثل الكسر أو التسريب أو نقص منتج أو استلام منتج خاطئ، يرجى التواصل مع زيت ومونة <strong>خلال 48 ساعة متى كان ذلك ممكناً بشكل معقول</strong> حتى نتمكن من التحقق من الحالة بسرعة.",
          "فترة الـ48 ساعة هي مدة موصى بها للإبلاغ وليست مهلة رفض تلقائية. ويمكن إرسال الطلب بعد ذلك أيضاً وسيخضع للمراجعة اليدوية.",
          "قد نطلب معلومات داعمة معقولة، مثل صورة واضحة للمنتج المتأثر أو العبوة أو الملصق أو رقم التشغيلة/الدفعة أو تاريخ الصلاحية عندما تكون هذه التفاصيل مفيدة. ولا نطلب صورة لعلبة فارغة لمجرد الإبلاغ عن منتج ناقص."
        ]
      },
      {
        title:"3. مشاكل الجودة أو التلف أو السلامة",
        paragraphs:[
          "لا تُعامل مشكلة الجودة أو التلف أو السلامة كإرجاع عادي بسبب تغيير الرأي. ويمكنك الإبلاغ عن عيب خفي حقيقي أو مشكلة سلامة حتى لو كان المنتج قد فُتح أو انتهت مهلة الأيام العشرة العادية الخاصة بتغيير الرأي.",
          "لا تستهلك المزيد من أي منتج تعتقد أنه قد يكون غير آمن لمجرد إثبات المشكلة. ولن نطلب نقل أو إعادة منتج غير آمن أو غير عملي التعامل معه فقط لغرض الإثبات. ويمكن لزيت ومونة اعتبار الإرجاع غير مطلوب لأسباب تتعلق بالسلامة.",
          "عند الحاجة، قد نسأل متى تم اكتشاف المشكلة ونطلب معلومات عن المنتج أو العبوة أو تاريخ الأفضل قبل/الصلاحية أو رقم التشغيلة/الدفعة أو التخزين أو طريقة الاستخدام حتى نتمكن من التحقيق بشكل مسؤول."
        ]
      },
      {
        title:"4. الذوق الشخصي والمشاكل الناتجة عن العميل",
        paragraphs:[
          "<strong>الذوق أو التفضيل الشخصي وحده لا يُعتبر عيباً في المنتج</strong> عندما يكون المنتج آمناً وموصوفاً بشكل صحيح ومطابقاً لما تم شراؤه. فمثلاً، عدم الإعجاب بالنكهة أو اكتشاف أن الطعم أقوى أو أحلى من المتوقع بعد فتح المنتج لا يجعله عادةً معيباً.",
          "قد يُرفض الطلب عندما تُظهر المعلومات المتاحة بشكل معقول أن المشكلة نتجت عن تخزين غير مناسب أو سوء استخدام أو عبث أو ضرر تسبب به العميل. نحن نراجع ظروف الحالة ولا نفترض تلقائياً أن العميل ارتكب خطأ."
        ]
      },
      {
        title:"5. يرجى الاحتفاظ بالمنتج والعبوة",
        paragraphs:[
          "يرجى الاحتفاظ بالمنتج المتأثر وعبوته الأصلية إلى أن تتم مراجعة الطلب، إلا إذا كان الاحتفاظ به غير آمن أو غير عملي. يساعد ذلك في حفظ معلومات الحالة والملصق ورقم التشغيلة/الدفعة وتاريخ الصلاحية."
        ]
      },
      {
        title:"6. المراجعة والحلول الممكنة",
        paragraphs:[
          "إرسال الطلب لا يضمن تلقائياً استرداداً أو استبدالاً. تتم مراجعة كل طلب على حدة، كما أن تقديم صور أو أدلة أخرى لا يعني تلقائياً الموافقة.",
          "بحسب ظروف الحالة، قد يشمل الحل المعتمد استبدال المنتج بمنتج مماثل، أو التبديل، أو استرداداً جزئياً، أو استرداداً كاملاً لقيمة المنتج أو المنتجات المتأثرة. وجود مشكلة في منتج واحد لا يجعل كامل الطلب قابلاً للاسترداد تلقائياً.",
          "في حالات الإرجاع أو الاستبدال العادية بسبب تغيير الرأي، قد تكون تكاليف التوصيل أو الاستلام على عاتق العميل حيثما يسمح بذلك. أما إذا كان الخطأ من زيت ومونة، مثل إرسال منتج غير صحيح، فسنتحمل عادةً التكاليف المعقولة اللازمة للحل."
        ]
      },
      {
        title:"7. الاستبدال والمواد الغذائية المُعادة",
        paragraphs:[
          "يتم تقييم أي طلب استبدال والموافقة عليه قبل تنفيذه. وإقرار العميل بأن المنتج غير مفتوح لا يكفي وحده لإتمام الاستبدال. كما أن المواد الغذائية المُعادة لا تعود تلقائياً إلى المخزون القابل للبيع؛ بل تحتاج إلى قرار صريح بعد الفحص وتقييم المخزون، مع إعطاء سلامة الغذاء الأولوية."
        ]
      },
      {
        title:"8. معالجة المبالغ المستردة",
        paragraphs:[
          "تسجل زيت ومونة حالياً عمليات الاسترداد المعتمدة من خلال نظام الدفع والطلبات القائم. ولا يُسجّل الاسترداد كمكتمل إلا بعد تنفيذ خطوة الدفع أو إعادة المبلغ فعلياً وتسجيلها من قبل مالك أو مسؤول مخوّل.",
          "يقتصر الاسترداد على المبلغ المدفوع فعلياً مقابل المنتج أو الكمية المتأثرة بعد احتساب الخصومات والعروض وأي مبالغ سبق استردادها. ولا نطلب أرقام البطاقات الكاملة أو رموز CVV أو كلمات مرور الخدمات المصرفية الإلكترونية لمعالجة طلب إرجاع."
        ]
      },
      {
        title:"9. كيفية إرسال الطلب ومتابعته",
        paragraphs:[
          "افتح <strong>الإرجاع والمشاكل</strong> من قائمة الموقع وأدخل رمز الطلب الظاهر في تأكيد الطلب أو الإيصال. نتحقق من أن الطلب يعود إليك قبل إظهار تفاصيله. وبعد التحقق من طلب مؤهل تم تسليمه، اختر المنتج المتأثر ونوع المشكلة وأدخل التفاصيل المناسبة وأرفق الصور عند الحاجة. ستحصل على رقم مرجعي غير متسلسل يبدأ بـ <strong>ZWM-RR-</strong>.",
          "يمكن للعملاء المسجلين الدخول متابعة حالة الطلب والتحديثات الظاهرة للعميل من حسابهم. وإذا طلبنا معلومات إضافية، يرجى الرد ضمن الطلب الحالي بدلاً من فتح مطالبة مكررة."
        ]
      },
      {
        title:"10. حقوق المستهلك المطبقة",
        legal:true,
        paragraphs:[
          "<strong>لا يحد أي شيء في هذه السياسة من حقوق المستهلك التي يقرها القانون اللبناني النافذ.</strong> توضح هذه السياسة آلية العمل لدى زيت ومونة ولا تستبدل أو تلغي الحماية القانونية المقررة للمستهلك."
        ]
      }
    ]
  },
  fr:{
    title:"Politique de retours et problèmes produits | Zayt W Mouneh",
    description:"Politique Zayt W Mouneh concernant les retours, échanges, remboursements et problèmes produits.",
    skip:"Aller au contenu",
    eyebrow:"Service client",
    heading:"Politique de retours, échanges et problèmes produits",
    updated:"Dernière mise à jour : 7 octobre 2026",
    intro:"Zayt W Mouneh souhaite que chaque client soit satisfait de sa commande. Si un article arrive endommagé, incorrect ou manquant, ou présente un véritable problème de qualité ou de sécurité, vous pouvez envoyer une demande liée à la commande afin qu’elle soit examinée.",
    primary:"Commencer un retour ou signaler un problème",
    secondary:"Voir mes commandes",
    summaryTitle:"En bref",
    summary:[
      "Retours pour changement d’avis sur un article non ouvert : normalement dans les 10 jours calendaires suivant la livraison.",
      "Problèmes visibles à la livraison : merci de les signaler dans les 48 heures lorsque cela est raisonnablement possible.",
      "Les problèmes de qualité, d’altération ou de sécurité peuvent toujours être signalés séparément, même après ouverture.",
      "Une demande envoyée est examinée ; elle ne déclenche pas automatiquement un remboursement."
    ],
    sections:[
      {
        title:"1. Produits non utilisés et non ouverts",
        paragraphs:[
          "Les produits non utilisés et non ouverts peuvent être éligibles à un retour ou à un échange si la demande est faite dans les <strong>10 jours calendaires suivant la livraison</strong>, à condition que le produit reste scellé, non utilisé, dans son état et son emballage d’origine, et qu’il puisse être inspecté et retourné.",
          "Le délai de 10 jours est calculé à partir de la livraison, et non de la date de commande ou de paiement. Si aucun horodatage de livraison fiable n’est disponible, la demande est transmise pour examen manuel plutôt que d’utiliser une date supposée.",
          "Les produits ouverts ou utilisés ne sont normalement pas éligibles à un retour ou à un échange pour simple changement d’avis. Cela ne vous empêche pas de signaler un défaut réel, un problème de qualité ou de sécurité, un produit incorrect ou manquant, ou toute autre situation protégée par la loi applicable."
        ]
      },
      {
        title:"2. Produits endommagés, fuyants, manquants ou incorrects",
        paragraphs:[
          "Pour les problèmes visibles à la livraison, tels qu’une casse, une fuite, un article manquant ou un article incorrect, merci de contacter Zayt W Mouneh <strong>dans les 48 heures lorsque cela est raisonnablement possible</strong> afin que la situation puisse être examinée rapidement.",
          "Le délai de 48 heures est une période de signalement recommandée et non une limite entraînant un refus automatique. Une demande envoyée plus tard peut toujours être soumise et sera examinée manuellement.",
          "Nous pouvons demander des éléments justificatifs raisonnables, comme une photo claire de l’article concerné, de l’emballage, de l’étiquette, du numéro de lot ou de la date d’expiration lorsque ces informations sont utiles. Une photo d’une boîte vide n’est pas exigée uniquement pour signaler un article manquant."
        ]
      },
      {
        title:"3. Qualité, altération et sécurité des produits",
        paragraphs:[
          "Un problème de qualité, d’altération ou de sécurité n’est pas traité comme un simple retour pour changement d’avis. Vous pouvez signaler un véritable défaut caché ou un problème de sécurité même si le produit a été ouvert ou si le délai ordinaire de 10 jours est dépassé.",
          "Ne consommez pas davantage un produit que vous pensez potentiellement dangereux uniquement pour prouver le problème. Nous n’exigerons pas le transport ou le retour d’un produit dangereux ou difficile à manipuler uniquement comme preuve. Zayt W Mouneh peut décider qu’aucun retour physique n’est nécessaire pour des raisons de sécurité.",
          "Lorsque cela est pertinent, nous pouvons demander quand le problème a été découvert ainsi que des informations sur le produit, son emballage, la date de durabilité minimale ou d’expiration, le numéro de lot, le stockage ou l’utilisation afin d’enquêter de manière responsable."
        ]
      },
      {
        title:"4. Goût personnel et problèmes causés par le client",
        paragraphs:[
          "<strong>Le goût ou la préférence personnelle, à eux seuls, ne constituent pas un défaut du produit</strong> lorsque le produit est sûr, correctement décrit et conforme à ce qui a été acheté. Par exemple, ne pas aimer une saveur ou trouver, après ouverture, qu’un produit est plus fort ou plus sucré que prévu ne le rend normalement pas défectueux.",
          "Une demande peut être refusée lorsque les informations disponibles établissent raisonnablement que le problème résulte d’un mauvais stockage, d’une mauvaise utilisation, d’une altération volontaire ou d’un dommage causé par le client. Nous examinons les circonstances sans accuser automatiquement le client."
        ]
      },
      {
        title:"5. Conservez le produit et son emballage",
        paragraphs:[
          "Merci de conserver le produit concerné et son emballage d’origine jusqu’à l’examen de votre demande, sauf si cela est dangereux ou impraticable. Cela permet de préserver les informations sur l’état, l’étiquette, le numéro de lot et la date d’expiration."
        ]
      },
      {
        title:"6. Examen et solutions possibles",
        paragraphs:[
          "L’envoi d’une demande ne garantit pas automatiquement un remboursement ou un échange. Chaque demande est examinée individuellement. Fournir des photos ou d’autres preuves ne garantit pas non plus automatiquement une approbation.",
          "Selon les circonstances, une solution approuvée peut comprendre un remplacement, un échange, un remboursement partiel ou un remboursement intégral de l’article ou des articles concernés. Un problème touchant un seul article ne rend pas automatiquement toute la commande remboursable.",
          "Pour un retour ou un échange ordinaire lié à un changement d’avis, les frais de livraison ou de collecte peuvent être à la charge du client lorsque cela est permis. Lorsque l’erreur vient de Zayt W Mouneh, par exemple si un produit incorrect a été fourni, nous prenons normalement en charge les frais raisonnables nécessaires à la résolution."
        ]
      },
      {
        title:"7. Échanges et denrées alimentaires retournées",
        paragraphs:[
          "Un échange est examiné et autorisé avant d’être effectué. La simple déclaration du client indiquant qu’un article n’a pas été ouvert ne suffit pas à finaliser l’échange. Les denrées alimentaires retournées ne sont pas automatiquement remises en stock pour la vente ; une décision explicite d’inspection et de gestion du stock est nécessaire, la sécurité alimentaire restant prioritaire."
        ]
      },
      {
        title:"8. Traitement des remboursements",
        paragraphs:[
          "Zayt W Mouneh enregistre actuellement les remboursements approuvés dans son processus existant de paiement et de gestion des commandes. Un remboursement n’est marqué comme terminé qu’une fois le paiement ou le remboursement réellement effectué et enregistré par un propriétaire ou administrateur autorisé.",
          "Les remboursements sont limités au montant effectivement payé pour l’article ou la quantité concernés, après prise en compte des remises, promotions et remboursements antérieurs. Nous ne demandons jamais un numéro complet de carte bancaire, un code CVV ou un mot de passe de banque en ligne pour traiter une demande de retour."
        ]
      },
      {
        title:"9. Envoyer et suivre une demande",
        paragraphs:[
          "Ouvrez <strong>Retours &amp; problèmes</strong> depuis le menu du site et saisissez le code de commande figurant sur votre confirmation ou votre reçu. Nous vérifions que la commande vous appartient avant d’en révéler les détails. Une fois une commande livrée et éligible vérifiée, sélectionnez le produit concerné, choisissez le type de problème, fournissez les informations utiles et joignez des photos si nécessaire. Vous recevrez une référence non séquentielle commençant par <strong>ZWM-RR-</strong>.",
          "Les clients connectés peuvent suivre le statut de leur demande et les mises à jour visibles depuis leur compte. Si nous demandons des informations supplémentaires, répondez dans la demande existante au lieu d’ouvrir une demande en double."
        ]
      },
      {
        title:"10. Droits des consommateurs applicables",
        legal:true,
        paragraphs:[
          "<strong>Rien dans cette politique ne limite les droits des consommateurs prévus par la législation libanaise applicable.</strong> Cette politique décrit le processus opérationnel de Zayt W Mouneh et ne remplace ni ne réduit les protections légales des consommateurs."
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
  var ordersHref=localePath("/account",locale)+"#orders";
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
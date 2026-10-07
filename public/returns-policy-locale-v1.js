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
      "مشاكل التسليم الظاهرة: يُفضّل الإبلاغ خلال 48 ساعة متى كان ذلك ممكناً بشكل معقول؛ ويمكن مراجعة البلاغات المتأخرة أيضاً.",
      "يمكن الإبلاغ عن مشاكل الجودة أو التلف أو السلامة حتى بعد فتح المنتج.",
      "إرسال الطلب يبدأ المراجعة؛ ويعتمد الحل على ظروف الحالة."
    ],
    sections:[
      {
        title:"1. المنتجات غير المفتوحة وتغيير الرأي",
        paragraphs:[
          "قد تكون المنتجات غير المستخدمة وغير المفتوحة مؤهلة للإرجاع أو الاستبدال إذا قُدّم الطلب خلال <strong>10 أيام تقويمية من التسليم</strong>، شرط أن يبقى المنتج مختوماً وغير مستخدم وفي حالته وعبوته الأصليتين ومناسباً للفحص والإرجاع.",
          "تُحتسب مهلة الأيام العشرة من تاريخ التسليم، وليس من تاريخ الطلب أو الدفع. وإذا لم يتوافر تاريخ تسليم موثوق، نراجع التوقيت بالاستناد إلى المعلومات المتاحة بدلاً من افتراض تاريخ.",
          "المنتجات التي فُتحت أو استُخدمت لا تكون عادةً مؤهلة لإرجاع أو استبدال بسبب تغيير الرأي. ويمكنك مع ذلك الإبلاغ عن عيب حقيقي أو مشكلة جودة أو سلامة أو منتج خاطئ أو ناقص أو أي حالة أخرى تحميها القوانين النافذة."
        ]
      },
      {
        title:"2. المنتجات المتضررة أو الخاطئة أو الناقصة",
        paragraphs:[
          "في حال وجود مشكلة ظاهرة عند التسليم، مثل الكسر أو التسريب أو نقص منتج أو استلام منتج خاطئ، يرجى الإبلاغ عنها <strong>خلال 48 ساعة متى كان ذلك ممكناً بشكل معقول</strong> حتى نراجعها بسرعة.",
          "فترة الـ48 ساعة هي مدة موصى بها وليست مهلة رفض تلقائية. ويمكن إرسال البلاغ بعد ذلك أيضاً ومراجعته.",
          "قد نطلب معلومات داعمة معقولة، مثل صور المنتج المتأثر أو العبوة والملصق ورقم التشغيلة/الدفعة أو تاريخ الصلاحية عندما تكون هذه التفاصيل ذات صلة."
        ]
      },
      {
        title:"3. مشاكل جودة المنتج أو سلامته",
        paragraphs:[
          "تختلف مشكلة الجودة أو التلف أو السلامة الحقيقية عن الإرجاع بسبب تغيير الرأي. ويمكنك الإبلاغ عنها حتى لو فُتح المنتج أو انتهت مهلة الأيام العشرة العادية.",
          "إذا كنت تعتقد أن المنتج قد يكون غير آمن، فتوقف عن استخدامه أو استهلاكه. ولا يلزم الاحتفاظ بمنتج أو نقله أو إعادته عندما يكون ذلك غير آمن أو غير عملي.",
          "عند الحاجة، قد نسأل متى تم اكتشاف المشكلة ونطلب معلومات عن المنتج أو العبوة أو تاريخ الأفضل قبل/الصلاحية أو رقم التشغيلة/الدفعة أو التخزين أو طريقة الاستخدام حتى نراجع الحالة بشكل مسؤول."
        ]
      },
      {
        title:"4. الذوق الشخصي والمشاكل الناتجة عن العميل",
        paragraphs:[
          "<strong>الذوق أو التفضيل الشخصي وحده لا يُعتبر عيباً في المنتج</strong> عندما يكون المنتج آمناً وموصوفاً بشكل صحيح ومطابقاً لما تم شراؤه. فعدم الإعجاب بالنكهة أو اكتشاف أن المنتج المفتوح أقوى أو أحلى من المتوقع لا يجعله عادةً معيباً.",
          "قد يُرفض الطلب عندما تُظهر المعلومات المتاحة بشكل معقول أن المشكلة نتجت عن تخزين غير مناسب أو سوء استخدام أو عبث أو ضرر تسبب به العميل."
        ]
      },
      {
        title:"5. الأدلة والاحتفاظ بالمنتج",
        paragraphs:[
          "يرجى الاحتفاظ بالمنتج المتأثر وعبوته الأصلية إلى أن تتم مراجعة الطلب، إلا إذا كان الاحتفاظ بهما غير آمن أو غير عملي.",
          "قد نطلب صوراً أو معلومات أخرى معقولة عندما تساعدنا على فهم المشكلة. وما نطلبه يعتمد على نوع الحالة."
        ]
      },
      {
        title:"6. ماذا يحدث بعد إرسال الطلب",
        paragraphs:[
          "إرسال الطلب يبدأ المراجعة ولا يعني بحد ذاته تأكيد استرداد أو استبدال. نراجع الطلب المرتبط والمنتج أو الكمية المتأثرة ووصفك وأي معلومات داعمة تكون مطلوبة بشكل معقول.",
          "إذا احتجنا إلى معلومات إضافية، سنطلبها ضمن الطلب. وبعد ذلك نطلعك على نتيجة المراجعة والخطوات المتاحة."
        ]
      },
      {
        title:"7. الحلول الممكنة والاستبدال",
        paragraphs:[
          "بحسب ظروف الحالة، قد يشمل الحل المعتمد استبدال المنتج بمنتج مماثل أو التبديل أو استرداداً جزئياً أو استرداداً كاملاً لقيمة المنتج أو المنتجات المتأثرة. وجود مشكلة في منتج واحد لا يجعل كامل الطلب قابلاً للاسترداد تلقائياً.",
          "إذا لزم استبدال أو إرجاع فعلي، نؤكد الخطوات التالية قبل إرسال أو تسليم أي شيء. ويتم تقييم المواد الغذائية المُعادة قبل أي تعامل لاحق، مع إعطاء سلامة الغذاء الأولوية."
        ]
      },
      {
        title:"8. المبالغ المستردة وتكاليف الاستلام أو التوصيل",
        paragraphs:[
          "إذا تمت الموافقة على استرداد، فيقتصر على المبلغ المدفوع فعلياً مقابل المنتج أو الكمية المتأثرة بعد احتساب الخصومات والعروض وأي مبالغ سبق استردادها.",
          "لا ينشر الموقع حالياً طريقة موحدة لإعادة المبالغ أو مدة معالجة ثابتة. وإذا تمت الموافقة على استرداد، يتم تأكيد طريقة إعادة المبلغ وأي مدة معالجة تنطبق معك ضمن الحل.",
          "في حالات الإرجاع أو الاستبدال العادية بسبب تغيير الرأي، قد تكون تكاليف التوصيل أو الاستلام على عاتق العميل حيثما يسمح بذلك. أما إذا كان الخطأ من زيت ومونة، مثل إرسال منتج غير صحيح، فسنتحمل عادةً التكاليف المعقولة اللازمة للحل. وإذا لزم الاستلام أو إعادة التوصيل، نؤكد الترتيب بعد المراجعة."
        ]
      },
      {
        title:"9. كيفية إرسال الطلب ومتابعته",
        paragraphs:[
          "افتح <strong>الإرجاع والمشاكل</strong> من الموقع وأدخل رمز الطلب الظاهر في تأكيد الطلب أو الإيصال. نتحقق من أن الطلب يعود إليك قبل إظهار تفاصيله الخاصة. وللطلب المؤهل بعد التسليم، اختر المنتج المتأثر ونوع المشكلة وأضف التفاصيل المناسبة وأرفق الصور عند الحاجة.",
          "بعد الإرسال، ستحصل على رقم مرجعي للطلب. ويمكن للعملاء المسجلين الدخول متابعة الحالة والتحديثات من حسابهم. وإذا طلبنا معلومات إضافية، يرجى الرد ضمن الطلب الحالي بدلاً من فتح طلب مكرر."
        ]
      },
      {
        title:"10. حقوق المستهلك",
        legal:true,
        paragraphs:[
          "<strong>لا يحد أي شيء في هذه السياسة من حقوق المستهلك التي يقرها القانون اللبناني النافذ.</strong> تشرح هذه السياسة آلية زيت ومونة للإرجاع ومشاكل المنتجات ولا تستبدل أو تلغي الحماية القانونية المقررة للمستهلك."
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
      "Problèmes visibles à la livraison : merci de les signaler dans les 48 heures lorsque cela est raisonnablement possible ; les signalements plus tardifs peuvent aussi être examinés.",
      "Les problèmes de qualité, d’altération ou de sécurité peuvent être signalés même après ouverture.",
      "L’envoi d’une demande déclenche un examen ; la solution dépend des circonstances."
    ],
    sections:[
      {
        title:"1. Produits non ouverts et changement d’avis",
        paragraphs:[
          "Les produits non utilisés et non ouverts peuvent être éligibles à un retour ou à un échange si la demande est faite dans les <strong>10 jours calendaires suivant la livraison</strong>, à condition que le produit reste scellé, non utilisé, dans son état et son emballage d’origine, et qu’il puisse être inspecté et retourné.",
          "Le délai de 10 jours est calculé à partir de la livraison, et non de la date de commande ou de paiement. Si aucune date de livraison fiable n’est disponible, nous examinons le délai à partir des informations disponibles plutôt que de supposer une date.",
          "Les produits ouverts ou utilisés ne sont normalement pas éligibles à un retour ou à un échange pour simple changement d’avis. Vous pouvez néanmoins signaler un défaut réel, un problème de qualité ou de sécurité, un produit incorrect ou manquant, ou toute autre situation protégée par la loi applicable."
        ]
      },
      {
        title:"2. Articles endommagés, incorrects ou manquants",
        paragraphs:[
          "Pour les problèmes visibles à la livraison, tels qu’une casse, une fuite, un article manquant ou un article incorrect, merci de les signaler <strong>dans les 48 heures lorsque cela est raisonnablement possible</strong> afin que nous puissions les examiner rapidement.",
          "Le délai de 48 heures est recommandé ; il ne constitue pas une limite entraînant un refus automatique. Un signalement plus tardif peut toujours être envoyé et examiné.",
          "Nous pouvons demander des éléments justificatifs raisonnables, comme des photos de l’article concerné ou de l’emballage et de l’étiquette, ainsi que le numéro de lot ou la date d’expiration lorsque ces informations sont pertinentes."
        ]
      },
      {
        title:"3. Qualité ou sécurité du produit",
        paragraphs:[
          "Un véritable problème de qualité, d’altération ou de sécurité est différent d’un retour pour changement d’avis. Vous pouvez le signaler même si le produit a été ouvert ou si le délai ordinaire de 10 jours est dépassé.",
          "Si vous pensez qu’un produit peut être dangereux, cessez de l’utiliser ou de le consommer. Vous n’avez pas à conserver, transporter ou retourner un produit lorsque cela serait dangereux ou impraticable.",
          "Lorsque cela est pertinent, nous pouvons demander quand le problème a été découvert ainsi que des informations sur le produit, son emballage, la date de durabilité minimale ou d’expiration, le numéro de lot, le stockage ou l’utilisation afin d’examiner la situation de manière responsable."
        ]
      },
      {
        title:"4. Goût personnel et problèmes causés par le client",
        paragraphs:[
          "<strong>Le goût ou la préférence personnelle, à eux seuls, ne constituent pas un défaut du produit</strong> lorsque le produit est sûr, correctement décrit et conforme à ce qui a été acheté. Ne pas aimer une saveur ou trouver, après ouverture, qu’un produit est plus fort ou plus sucré que prévu ne le rend normalement pas défectueux.",
          "Une demande peut être refusée lorsque les informations disponibles montrent raisonnablement que le problème résulte d’un mauvais stockage, d’une mauvaise utilisation, d’une altération volontaire ou d’un dommage causé par le client."
        ]
      },
      {
        title:"5. Preuves et conservation du produit",
        paragraphs:[
          "Merci de conserver le produit concerné et son emballage d’origine jusqu’à l’examen de la demande, sauf si cela est dangereux ou impraticable.",
          "Nous pouvons demander des photos ou d’autres informations raisonnables lorsqu’elles nous aident à comprendre le problème. Ce qui est demandé dépend du type de situation."
        ]
      },
      {
        title:"6. Après l’envoi de votre demande",
        paragraphs:[
          "L’envoi d’une demande déclenche un examen ; il ne confirme pas à lui seul un remboursement ou un échange. Nous examinons la commande concernée, l’article ou la quantité touchés, votre description et les éléments justificatifs raisonnablement nécessaires.",
          "Si nous avons besoin d’informations supplémentaires, nous les demanderons dans la demande. Nous vous communiquerons ensuite le résultat de l’examen et les prochaines étapes disponibles."
        ]
      },
      {
        title:"7. Solutions possibles et échanges",
        paragraphs:[
          "Selon les circonstances, une solution approuvée peut comprendre un remplacement, un échange, un remboursement partiel ou un remboursement intégral de l’article ou des articles concernés. Un problème touchant un seul article ne rend pas automatiquement toute la commande remboursable.",
          "Si un échange ou un retour physique est nécessaire, nous confirmerons les étapes avant que vous n’envoyiez ou ne remettiez quoi que ce soit. Les denrées alimentaires retournées sont évaluées avant toute autre manipulation, la sécurité alimentaire restant prioritaire."
        ]
      },
      {
        title:"8. Remboursements et frais de collecte ou de livraison",
        paragraphs:[
          "Si un remboursement est approuvé, il est limité au montant effectivement payé pour l’article ou la quantité concernés, après prise en compte des remises, promotions et remboursements antérieurs.",
          "Le site ne publie actuellement ni méthode de remboursement unique ni délai de traitement standard. Si un remboursement est approuvé, la méthode de remboursement et tout délai applicable vous seront confirmés dans le cadre de la solution.",
          "Pour un retour ou un échange ordinaire lié à un changement d’avis, les frais de livraison ou de collecte peuvent être à la charge du client lorsque cela est permis. Lorsque l’erreur vient de Zayt W Mouneh, par exemple si un produit incorrect a été fourni, nous prenons normalement en charge les frais raisonnables nécessaires à la résolution. Si une collecte ou une nouvelle livraison est nécessaire, nous confirmerons l’organisation après examen."
        ]
      },
      {
        title:"9. Envoyer et suivre une demande",
        paragraphs:[
          "Ouvrez <strong>Retours &amp; problèmes</strong> sur le site et saisissez le code figurant sur votre confirmation ou votre reçu. Nous vérifions que la commande vous appartient avant d’afficher ses informations privées. Pour une commande livrée éligible, sélectionnez le produit concerné, choisissez le type de problème, ajoutez les informations utiles et joignez des photos lorsque cela est approprié.",
          "Après l’envoi, vous recevrez une référence de demande. Les clients connectés peuvent suivre le statut et les mises à jour depuis leur compte. Si nous demandons des informations supplémentaires, répondez dans la demande existante plutôt que d’en ouvrir une autre."
        ]
      },
      {
        title:"10. Droits des consommateurs",
        legal:true,
        paragraphs:[
          "<strong>Rien dans cette politique ne limite les droits des consommateurs prévus par la législation libanaise applicable.</strong> Cette politique explique le processus de Zayt W Mouneh concernant les retours et problèmes produits et ne remplace ni ne réduit les protections légales des consommateurs."
        ]
      }
    ]
  }
}

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
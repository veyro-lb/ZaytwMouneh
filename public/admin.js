(() => {
  "use strict";

  const cfg = window.ZWM_CMS_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  const clone = (v) => typeof structuredClone === "function" ? structuredClone(v) : JSON.parse(JSON.stringify(v));
  const baseProducts = typeof PRODUCTS_DATA !== "undefined" ? clone(PRODUCTS_DATA) : [];
  const baseById = new Map(baseProducts.map(p => [p.id, p]));
  const basePhotoMap = window.ZWM_PRODUCT_PHOTOS?.map || {};
  const ADMIN_LANG_KEY = "zwm:admin-lang:v1";
  const CMS_SYNC_KEY = "zwm:cms:admin-sync:v1";
  const originalTextNodes = new WeakMap();
  const originalAttributes = new WeakMap();
  let languageObserver = null;

  function readAdminLanguage() {
    try { return localStorage.getItem(ADMIN_LANG_KEY)==="ar" ? "ar" : "en"; }
    catch { return "en"; }
  }

  const AR_TRANSLATIONS = Object.freeze({
    "Run the rewards club from the same owner console.":"إدارة نقاط المونة",
    "Points settle only when an order is marked delivered. Cancelling a rewards order reverses its order-linked points and releases reserved vouchers.":"تُضاف النقاط بعد تأكيد تسليم الطلب. عند الإلغاء، تُعكس النقاط المرتبطة بالطلب وتُحرّر القسائم المحجوزة.",
    "Customer accounts":"حسابات العملاء",
    "Sign-in & verification setup":"إعداد تسجيل الدخول والتحقق",
    "Live status from the account service":"حالة مباشرة من خدمة الحسابات",
    "Email + password":"البريد الإلكتروني وكلمة المرور",
    "Checking…":"جارٍ التحقق…",
    "Website-created Zayt w Mouneh accounts":"حسابات زيت ومونة المُنشأة عبر الموقع",
    "Email confirmation":"تأكيد البريد الإلكتروني",
    "Required before rewards enrollment":"مطلوب قبل الانضمام إلى برنامج المكافآت",
    "Google sign-in":"تسجيل الدخول عبر Google",
    "Google OAuth provider":"خدمة تسجيل الدخول عبر Google",
    "Branded email sender":"بريد إرسال رسائل الحساب",
    "Not checked":"لم يتم التحقق",
    "Sender settings are managed in the account service.":"تُدار إعدادات المرسِل في خدمة الحسابات.",
    "Referral protection":"حماية مكافآت الإحالة",
    "Delivery is the confirmation step.":"تأكيد التسليم هو شرط استحقاق المكافأة.",
    "A referral code alone never earns points. The friend must join with the code":"رمز الإحالة وحده لا يمنح نقاطاً. يجب أن ينضم الصديق باستخدام الرمز",
    "before ordering":"قبل تقديم الطلب",
    "their first delivered order must be at least $25 after discount, and the order must be marked":"ويجب أن تبلغ قيمة أول طلب مُسلّم 25 دولاراً على الأقل بعد الخصم، ثم يحدّد المالك حالة الطلب بأنه",
    "by the owner in Orders & history. The database issues each referral bonus only once, normalizes Lebanese phone formats, blocks same-phone referrals, and does not allow retroactive referral credit.":"في قسم الطلبات والسجل. تُمنح مكافأة كل إحالة مرة واحدة فقط، ويقوم النظام بتوحيد صيغ أرقام الهاتف اللبنانية، ويمنع الإحالات برقم الهاتف نفسه، ولا يسمح بإضافة استحقاق الإحالة بأثر رجعي.",
    "Members":"الأعضاء",
    "Joined rewards accounts":"الحسابات المنضمّة للمكافآت",
    "Points outstanding":"النقاط المتاحة للأعضاء",
    "Positive member balances":"مجموع الأرصدة الموجبة",
    "Available vouchers":"القسائم المتاحة",
    "Wallet value not yet used":"قيمة القسائم غير المستخدمة",
    "Active boosts":"حملات المضاعفة الجارية",
    "Live multiplier campaigns":"الحملات الجارية حالياً",
    "Golden members":"الأعضاء الذهبيون",
    "Top annual-spend tier":"أعلى مستوى حسب الإنفاق السنوي",
    "Balances, tiers & rewards":"الأرصدة والمستويات والمكافآت",
    "Refresh ↻":"تحديث ↻",
    "Search member, phone, code or tier…":"ابحث بالاسم أو الهاتف أو الرمز أو المستوى…",
    "0 members":"0 أعضاء",
    "Open this section to load rewards members.":"افتح هذا القسم لعرض أعضاء المكافآت.",
    "Program":"البرنامج",
    "Core earning settings":"إعدادات كسب النقاط",
    "Rewards program enabled":"برنامج المكافآت مفعّل",
    "Base points per $1":"النقاط الأساسية لكل دولار",
    "Default is 1 point per $1 of product subtotal. Tier and campaign multipliers are applied automatically.":"المعدل الافتراضي نقطة لكل دولار من قيمة المنتجات. تُطبّق مضاعفات المستوى والحملات تلقائياً.",
    "Save program settings":"حفظ إعدادات البرنامج",
    "Reward ladder":"سُلّم المكافآت",
    "Edit point milestones and voucher values":"مستويات النقاط وقيم القسائم",
    "Minimum order protects margin when a voucher is used.":"حدّد النقاط وقيمة الخصم والحد الأدنى للطلب لكل مكافأة.",
    "Add reward level":"إضافة مستوى مكافأة",
    "New reward level":"مستوى مكافأة جديد",
    "Points required":"النقاط المطلوبة",
    "Discount ($)":"قيمة الخصم (دولار)",
    "Minimum order ($)":"الحد الأدنى للطلب (دولار)",
    "Add to ladder":"إضافة إلى السُلّم",
    "Cancel":"إلغاء",
    "Save to publish this level to customers. Existing vouchers keep their original value.":"احفظ لنشر المستوى للعملاء. تحتفظ القسائم السابقة بقيمتها الأصلية.",
    "Pause a level to hide it from new redemptions; existing vouchers stay valid.":"أوقف المستوى لإخفائه من الاستبدالات الجديدة؛ تبقى القسائم السابقة صالحة.",
    "Point boosts":"مضاعفة النقاط",
    "Create a limited-time multiplier":"إنشاء حملة مضاعفة محدودة المدة",
    "Choose a category for a targeted boost, or all categories for the whole pantry.":"اختر فئة لحملة مخصّصة أو اتركها فارغة لتشمل جميع المنتجات.",
    "Title":"العنوان بالإنجليزية",
    "Arabic title":"العنوان بالعربية",
    "Category":"الفئة",
    "All categories":"جميع الفئات",
    "Olive Week":"أسبوع الزيتون",
    "Multiplier":"المضاعِف",
    "Starts":"البداية",
    "Ends":"النهاية",
    "Create boost":"إنشاء الحملة",
    "Mouneh Points member":"عضو نقاط المونة",
    "Member":"عضو",
    "Adjust points":"تعديل النقاط",
    "Add a bonus or subtract points with an owner reason. Every adjustment is logged.":"أضف أو اخصم نقاطاً مع توضيح السبب. يُحفظ كل تعديل في السجل.",
    "Points (+ / −)":"النقاط (+ / −)",
    "Reason":"السبب",
    "Customer care bonus":"مكافأة لخدمة العميل",
    "Apply point adjustment":"تطبيق تعديل النقاط",
    "Tier override":"تحديد المستوى يدوياً",
    "Leave automatic to use annual delivered spend: Olive at $200, Golden at $500.":"اختر المستوى التلقائي حسب قيمة الطلبات المسلّمة سنوياً: الزيتوني عند 200 دولار والذهبي عند 500 دولار.",
    "Tier":"المستوى",
    "Automatic":"تلقائي",
    "Olive":"زيتوني",
    "Golden":"ذهبي",
    "Save tier":"حفظ المستوى",
    "Gift a voucher":"إهداء قسيمة",
    "Add a no-points-cost voucher directly to this member’s wallet.":"أضف قسيمة إلى محفظة العضو دون خصم نقاط.",
    "Voucher value ($)":"قيمة القسيمة (دولار)",
    "Thank you":"شكراً لك",
    "Add voucher":"إضافة القسيمة",
    "Close":"إغلاق",
    "Save changes before refreshing.":"احفظ التعديلات قبل التحديث.",

    "Zayt w Mouneh":"زيت ومونة",
    "Owner Console":"لوحة المالك",
    "Zayt w Mouneh — Owner Console":"Zayt w Mouneh — لوحة المالك",
    "Loading":"جارٍ التحميل",
    "Secure backend required":"يلزم ربط آمن",
    "The dashboard UI is installed.":"واجهة لوحة الإدارة مثبّتة.",
    "Connect the owner backend to activate it.":"اربط نظام المالك الخلفي لتفعيلها.",
    "For security, this page will not accept a hard-coded browser password. Product changes, uploads and analytics require the dedicated protected database configured in admin-config.js.":"لأسباب أمنية، لا تقبل هذه الصفحة كلمة مرور مخزنة داخل المتصفح. تعديلات المنتجات ورفع الصور والتحليلات تحتاج إلى قاعدة البيانات المحمية المخصصة في admin-config.js.",
    "For security, this page will not accept a hard-coded browser password. Product changes, uploads and analytics require the dedicated protected database configured in":"لأسباب أمنية، لا تقبل هذه الصفحة كلمة مرور مخزنة داخل المتصفح. تعديلات المنتجات ورفع الصور والتحليلات تحتاج إلى قاعدة البيانات المحمية المخصصة في",
    "Use the included":"استخدم ملف",
    "schema.":"المرفق.",
    "Add only the owner's Auth user UUID to":"أضف فقط معرّف UUID الخاص بحساب المالك إلى",
    "Create the dedicated backend":"إنشاء النظام الخلفي المخصص",
    "Use the included supabase/admin_dashboard.sql schema.":"استخدم مخطط supabase/admin_dashboard.sql المرفق.",
    "Create the owner account":"إنشاء حساب المالك",
    "Add only the owner's Auth user UUID to admin_users.":"أضف فقط معرّف UUID الخاص بحساب المالك إلى admin_users.",
    "Add public connection values":"إضافة بيانات الاتصال العامة",
    "Set the project URL and publishable key, then enable the config.":"أدخل رابط المشروع والمفتاح العام ثم فعّل الإعداد.",
    "Back to website":"العودة إلى الموقع",
    "Private owner access":"دخول خاص بالمالك",
    "Owner sign in":"تسجيل دخول المالك",
    "Run the pantry":"أدِر المونة",
    "from one place.":"من مكان واحد.",
    "This area is not part of the customer website. Only approved owner accounts can continue.":"هذه المنطقة ليست جزءاً من موقع العملاء. يمكن فقط لحسابات المالك المعتمدة المتابعة.",
    "Email":"البريد الإلكتروني",
    "Password":"كلمة المرور",
    "Sign in securely":"تسجيل الدخول بأمان",
    "First time here? Create the owner account":"أول مرة هنا؟ أنشئ حساب المالك",
    "This is a one-time activation. Choose the email and password you want to use for the owner dashboard, then enter the setup code.":"هذا تفعيل لمرة واحدة. اختر البريد الإلكتروني وكلمة المرور للوحة المالك، ثم أدخل رمز الإعداد.",
    "Owner name":"اسم المالك",
    "Owner email":"بريد المالك",
    "Create password":"إنشاء كلمة مرور",
    "One-time setup code":"رمز الإعداد لمرة واحدة",
    "Create owner account":"إنشاء حساب المالك",
    "Protected by authenticated sessions, an owner allowlist and database row-level security.":"محمي بجلسات مصادقة وقائمة سماح للمالك وحماية RLS على مستوى قاعدة البيانات.",
    "Back to Zayt w Mouneh website":"العودة إلى موقع Zayt w Mouneh",
    "Close menu":"إغلاق القائمة",
    "Owner dashboard":"لوحة المالك",
    "Overview":"نظرة عامة",
    "Products":"المنتجات",
    "Orders & history":"الطلبات والسجل",
    "Orders & deliveries":"الطلبات والتوصيل",
    "Website content":"محتوى الموقع",
    "Analytics":"التحليلات",
    "Activity":"النشاط",
    "Settings":"الإعدادات",
    "View live site":"عرض الموقع",
    "Sign out":"تسجيل الخروج",
    "Open dashboard menu":"فتح قائمة لوحة الإدارة",
    "Owner workspace":"مساحة عمل المالك",
    "Refresh data":"تحديث البيانات",
    "+ Add product":"+ إضافة منتج",
    "+ Add category":"+ إضافة فئة",
    "+ Add":"+ إضافة",
    "Delete product":"حذف المنتج",
    "Delete this product permanently? This cannot be undone.":"هل تريد حذف هذا المنتج نهائياً؟ لا يمكن التراجع عن ذلك.",
    "Product deleted.":"تم حذف المنتج.",
    "Could not delete product.":"تعذّر حذف المنتج.",
    "Category name (English):":"اسم الفئة بالإنجليزية:",
    "Category name (Arabic):":"اسم الفئة بالعربية:",
    "Category added.":"تمت إضافة الفئة.",
    "That category already exists.":"هذه الفئة موجودة مسبقاً.",
    "Could not add category.":"تعذّرت إضافة الفئة.",
    "Add product":"إضافة منتج",
    "Owner":"المالك",
    "Today at a glance":"ملخص اليوم",
    "Keep the pantry accurate, clear and easy to order.":"حافظ على المونة دقيقة وواضحة وسهلة الطلب.",
    "Loading dashboard…":"جارٍ تحميل لوحة الإدارة…",
    "Manage products":"إدارة المنتجات",
    "Page views · 7 days":"مشاهدات الصفحات · 7 أيام",
    "Unique sessions · 7 days":"الجلسات الفريدة · 7 أيام",
    "WhatsApp clicks · 7 days":"نقرات واتساب · 7 أيام",
    "High-intent customer action":"تفاعل يدل على نية طلب عالية",
    "Live catalogue":"الكتالوج المنشور",
    "Products visible":"منتجات ظاهرة",
    "Traffic":"الزيارات",
    "Last 7 days":"آخر 7 أيام",
    "Full analytics →":"التحليلات الكاملة ←",
    "Catalogue health":"حالة الكتالوج",
    "Needs attention":"يحتاج مراجعة",
    "Missing photos":"صور ناقصة",
    "Hidden products":"منتجات مخفية",
    "Draft products":"منتجات مسودة",
    "Review →":"مراجعة ←",
    "Top pages":"الصفحات الأكثر زيارة",
    "Where customers browse":"أين يتصفح العملاء",
    "No analytics yet.":"لا توجد بيانات تحليلية بعد.",
    "Recent owner activity":"نشاط المالك الأخير",
    "Latest changes":"آخر التغييرات",
    "See all →":"عرض الكل ←",
    "No changes yet.":"لا تغييرات بعد.",
    "Search product, category or ID…":"ابحث عن منتج أو فئة أو معرّف…",
    "Filter category":"تصفية حسب الفئة",
    "All categories":"كل الفئات",
    "Filter status":"تصفية حسب الحالة",
    "All statuses":"كل الحالات",
    "Live":"منشور",
    "Edited":"معدّل",
    "New":"جديد",
    "Hidden":"مخفي",
    "Draft":"مسودة",
    "Missing photo":"صورة ناقصة",
    "Export changes ↓":"تصدير التغييرات ↓",
    "Product":"المنتج",
    "Category":"الفئة",
    "Price":"السعر",
    "Status":"الحالة",
    "Updated":"آخر تحديث",
    "Edit":"تعديل",
    "No photo":"بلا صورة",
    "Receive and manage every website and owner-created order in one place.":"استقبل وأدر كل طلبات الموقع والطلبات التي ينشئها المالك في مكان واحد.",
    "Website checkout orders appear automatically. Use the status controls to confirm, prepare, dispatch, deliver or cancel orders.":"تظهر طلبات الدفع عبر الموقع تلقائياً. استخدم عناصر التحكم بالحالة لتأكيد الطلب أو تحضيره أو إرساله للتوصيل أو تسليمه أو إلغائه.",
    "Needs review":"يحتاج مراجعة",
    "Needs owner review":"يحتاج مراجعة المالك",
    "Order received":"تم استلام الطلب",
    "Confirmed":"تم التأكيد",
    "Approved by owner":"تمت الموافقة من المالك",
    "Preparing":"قيد التحضير",
    "Being prepared":"قيد التحضير الآن",
    "Delivery completed":"اكتمل التسليم",
    "Payment":"الدفع",
    "Payment pending":"الدفع معلّق",
    "Payment received":"تم استلام الدفع",
    "Payment failed":"فشل الدفع",
    "Refunded":"تم رد المبلغ",
    "Partially refunded":"تم رد جزء من المبلغ",
    "No payment required":"لا يتطلب دفعاً",
    "Money not confirmed received":"لم يتم تأكيد استلام المبلغ",
    "Points require both checks":"النقاط تتطلب تأكيدين",
    "Mouneh Points are issued only when the order is Delivered and payment is marked Received.":"تُضاف نقاط المونة فقط عندما يكون الطلب مُسلّماً ويتم تأكيد استلام الدفع.",
    "Matches the customer tracking page.":"مطابق لصفحة تتبع العميل.",
    "Confirm payment received":"تأكيد استلام الدفع",
    "Points earned":"تم استحقاق النقاط",
    "No points":"لا توجد نقاط",
    "Waiting for payment":"بانتظار الدفع",
    "Waiting for delivery":"بانتظار التسليم",
    "Pending":"معلّق",
    "Confirmed / preparing":"مؤكد / قيد التحضير",
    "Out for delivery":"خرج للتوصيل",
    "On the way":"في الطريق",
    "Delivered":"تم التوصيل",
    "Completed history":"طلبات مكتملة",
    "Active":"نشطة",
    "Past orders":"الطلبات السابقة",
    "All history":"السجل الكامل",
    "Order history view":"عرض سجل الطلبات",
    "Search code, customer, area or product…":"ابحث بالرمز أو العميل أو المنطقة أو المنتج…",
    "Filter delivery status":"تصفية حسب حالة التوصيل",
    "Confirmed":"مؤكد",
    "Cancelled":"ملغى",
    "Filter order type":"تصفية حسب نوع الطلب",
    "All types":"كل الأنواع",
    "Pantry orders":"طلبات المونة",
    "Gifts":"الهدايا",
    "Export history ↓":"تصدير السجل ↓",
    "Use the status menu to update delivery progress.":"استخدم قائمة الحالة لتحديث مراحل التوصيل.",
    "WhatsApp code":"رمز واتساب",
    "Customer / area":"العميل / المنطقة",
    "Items":"العناصر",
    "Total":"الإجمالي",
    "Sent":"الإرسال",
    "Details":"التفاصيل",
    "Pantry":"مونة",
    "Gift":"هدية",
    "Pantry order":"طلب مونة",
    "Gift order":"طلب هدية",
    "WhatsApp code":"رمز واتساب",
    "Area not supplied":"لم تُذكر المنطقة",
    "View full order & history":"عرض الطلب والسجل كاملين",
    "Order history":"سجل الطلبات",
    "Order details":"تفاصيل الطلب",
    "Close order details":"إغلاق تفاصيل الطلب",
    "WhatsApp order code":"رمز طلب واتساب",
    "Copy code":"نسخ الرمز",
    "Customer / recipient":"العميل / المستلم",
    "Order type":"نوع الطلب",
    "English order":"طلب بالإنجليزية",
    "Arabic order":"طلب بالعربية",
    "Current status":"الحالة الحالية",
    "Full order":"الطلب الكامل",
    "Customer notes":"ملاحظات العميل",
    "No notes.":"لا توجد ملاحظات.",
    "Gift details":"تفاصيل الهدية",
    "Status history":"سجل الحالات",
    "Order timeline":"تسلسل الطلب",
    "Recipient":"المستلم",
    "Occasion":"المناسبة",
    "Packing":"التغليف",
    "Theme":"التصميم",
    "Card language":"لغة البطاقة",
    "Hide prices":"إخفاء الأسعار",
    "Yes":"نعم",
    "No":"لا",
    "Website content":"محتوى الموقع",
    "Change common customer-facing details without editing HTML.":"غيّر تفاصيل الموقع الظاهرة للعملاء من دون تعديل HTML.",
    "Changes publish after save.":"تُنشر التغييرات بعد الحفظ.",
    "Announcement bar":"شريط الإعلان",
    "Top-of-site message":"رسالة أعلى الموقع",
    "English message":"الرسالة بالإنجليزية",
    "Arabic message":"الرسالة بالعربية",
    "Orders":"الطلبات",
    "WhatsApp destination":"رقم واتساب للطلبات",
    "WhatsApp number":"رقم واتساب",
    "Digits only, including country code. Existing WhatsApp order buttons will use this number.":"أرقام فقط مع رمز الدولة. ستستخدم أزرار طلب واتساب الحالية هذا الرقم.",
    "Promo message":"رسالة ترويجية",
    "Optional customer notice":"تنبيه اختياري للعملاء",
    "English title":"العنوان بالإنجليزية",
    "Arabic title":"العنوان بالعربية",
    "Save website content":"حفظ محتوى الموقع",
    "Website analytics":"تحليلات الموقع",
    "Simple signals that help you improve the store.":"مؤشرات بسيطة تساعدك على تحسين المتجر.",
    "Last 30 days":"آخر 30 يوماً",
    "Last 90 days":"آخر 90 يوماً",
    "Page views":"مشاهدات الصفحات",
    "Unique sessions":"الجلسات الفريدة",
    "Selected period":"الفترة المحددة",
    "Add to pantry":"إضافة إلى المونة",
    "Product intent":"اهتمام بالمنتج",
    "WhatsApp clicks":"نقرات واتساب",
    "Order/contact intent":"نية طلب / تواصل",
    "Daily traffic":"الزيارات اليومية",
    "Page views and customer actions":"مشاهدات الصفحات وتفاعلات العملاء",
    "Most viewed":"الأكثر مشاهدة",
    "Top products":"المنتجات الأكثر مشاهدة",
    "Most viewed products":"المنتجات الأكثر مشاهدة",
    "Customer intent":"اهتمام العملاء",
    "Useful conversion signals":"مؤشرات مفيدة للتحويل",
    "Product views":"مشاهدات المنتجات",
    "Searches":"عمليات البحث",
    "Owner activity":"نشاط المالك",
    "A simple audit trail of dashboard changes.":"سجل واضح وبسيط لتغييرات لوحة الإدارة.",
    "Security":"الأمان",
    "Owner access":"دخول المالك",
    "Protected":"محمي",
    "Signed in as":"مسجل الدخول باسم",
    "Authorization":"الصلاحيات",
    "Owner allowlist + RLS":"قائمة سماح المالك + RLS",
    "Session":"الجلسة",
    "Supabase Auth":"مصادقة Supabase",
    "Sign out on this device":"تسجيل الخروج من هذا الجهاز",
    "Backend":"النظام الخلفي",
    "Connection health":"حالة الاتصال",
    "Checking":"جارٍ الفحص",
    "Database":"قاعدة البيانات",
    "Product images":"صور المنتجات",
    "Checking…":"جارٍ الفحص…",
    "Run health check":"فحص حالة الاتصال",
    "Data":"البيانات",
    "Owner backups":"نسخ المالك الاحتياطية",
    "Export all dashboard-managed product overrides and public settings as JSON. The original static catalogue stays untouched as a fallback.":"صدّر جميع تعديلات المنتجات وإعدادات الموقع التي تديرها اللوحة بصيغة JSON. يبقى الكتالوج الأصلي كما هو كنسخة احتياطية.",
    "Export dashboard backup ↓":"تصدير نسخة احتياطية للوحة ↓",
    "Product editor":"محرر المنتج",
    "Close":"إغلاق",
    "Product details":"تفاصيل المنتج",
    "English name":"الاسم بالإنجليزية",
    "Arabic name":"الاسم بالعربية",
    "Product ID":"معرّف المنتج",
    "Original / supplier name":"الاسم الأصلي / اسم المورّد",
    "Sizes & prices":"الأحجام والأسعار",
    "Add every size a customer can choose.":"أضف كل حجم يمكن للعميل اختياره.",
    "+ Add size":"+ إضافة حجم",
    "Visibility":"الظهور",
    "Draft products stay out of the live shop.":"تبقى المنتجات المسودة خارج المتجر المنشور.",
    "Visible to customers":"ظاهر للعملاء",
    "Saved but not shown":"محفوظ وغير ظاهر",
    "Temporarily removed":"مخفي مؤقتاً",
    "Product photo":"صورة المنتج",
    "Choose / replace":"اختيار / استبدال",
    "Remove photo":"حذف الصورة",
    "Use the clearest original image available. Max 10 MB. Drag the preview or use the controls below to position it.":"استخدم أوضح صورة أصلية متاحة، بحد أقصى 10 ميغابايت. اسحب المعاينة أو استخدم الأدوات أدناه لضبط موضع الصورة.",
    "Horizontal position":"الموضع الأفقي",
    "Vertical position":"الموضع العمودي",
    "Zoom":"التكبير",
    "Reset framing":"إعادة ضبط الإطار",
    "Quick checks":"مراجعة سريعة",
    "English + Arabic names":"الاسمان الإنجليزي والعربي",
    "Correct category":"الفئة الصحيحة",
    "At least one size and price":"حجم وسعر واحد على الأقل",
    "Clear product photo when available":"صورة واضحة للمنتج عند توفرها",
    "Hide product":"إخفاء المنتج",
    "Restore base version":"استعادة النسخة الأصلية",
    "Cancel":"إلغاء",
    "Save product":"حفظ المنتج",
    "Size (EN)":"الحجم (EN)",
    "Size (AR)":"الحجم (AR)",
    "Price (USD)":"السعر (USD)",
    "Remove size":"حذف الحجم",
    "Base catalogue product":"منتج من الكتالوج الأصلي",
    "Dashboard-managed product":"منتج مُدار من لوحة الإدارة",
    "New catalogue product":"منتج جديد في الكتالوج",
    "Edit product":"تعديل المنتج",
    "Base catalogue":"الكتالوج الأصلي",
    "No items":"لا توجد عناصر",
    "No item details stored.":"لا توجد تفاصيل محفوظة للعناصر.",
    "No extra gift details stored.":"لا توجد تفاصيل إضافية محفوظة للهدية.",
    "No status history yet.":"لا يوجد سجل حالات بعد.",
    "Website order":"طلب من الموقع",
    "Owner update":"تحديث من المالك",
    "product views":"مشاهدات المنتج",
    "views":"مشاهدة",
    "Connected":"متصل",
    "Configured":"مُعدّ",
    "Healthy":"سليم",
    "Error":"خطأ",
    "No session data yet":"لا توجد بيانات جلسات بعد",
    "No sessions yet":"لا توجد جلسات بعد",
    "just now":"الآن",
    "Save":"حفظ",
    "A product ID is required.":"معرّف المنتج مطلوب.",
    "Category is required.":"الفئة مطلوبة.",
    "Every size needs a name and valid price.":"كل حجم يحتاج إلى اسم وسعر صحيح.",
    "That product ID already exists.":"معرّف المنتج هذا موجود مسبقاً.",
    "Could not save product.":"تعذّر حفظ المنتج.",
    "Product updated.":"تم تحديث المنتج.",
    "Product added.":"تمت إضافة المنتج.",
    "Product hidden from customers.":"تم إخفاء المنتج عن العملاء.",
    "Base catalogue version restored.":"تمت استعادة نسخة الكتالوج الأصلية.",
    "New dashboard products cannot be restored to a base version.":"لا يمكن استعادة المنتجات الجديدة المضافة من اللوحة إلى نسخة أصلية.",
    "Image is larger than 10 MB.":"حجم الصورة أكبر من 10 ميغابايت.",
    "Could not read image.":"تعذّرت قراءة الصورة.",
    "Photo removed. Save the product to publish this change.":"تم حذف الصورة. احفظ المنتج لنشر هذا التغيير.",
    "Uploading image…":"جارٍ رفع الصورة…",
    "Saving…":"جارٍ الحفظ…",
    "Saved and published.":"تم الحفظ والنشر.",
    "Website content saved.":"تم حفظ محتوى الموقع.",
    "Could not load product changes.":"تعذّر تحميل تعديلات المنتجات.",
    "Could not load website settings.":"تعذّر تحميل إعدادات الموقع.",
    "Could not load order history.":"تعذّر تحميل سجل الطلبات.",
    "Could not update order.":"تعذّر تحديث الطلب.",
    "Order code copied.":"تم نسخ رمز الطلب.",
    "Could not copy the order code.":"تعذّر نسخ رمز الطلب.",
    "Dashboard refreshed.":"تم تحديث لوحة الإدارة.",
    "Backend health check passed.":"نجح فحص حالة النظام الخلفي.",
    "One backend service needs attention.":"إحدى خدمات النظام الخلفي تحتاج إلى مراجعة.",
    "Sign-in failed.":"فشل تسجيل الدخول.",
    "Signing in securely…":"جارٍ تسجيل الدخول بأمان…",
    "Opening owner dashboard…":"جارٍ فتح لوحة المالك…",
    "Email or password is incorrect.":"البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    "The secure login server did not respond in time. Please try again.":"لم يستجب خادم تسجيل الدخول الآمن في الوقت المحدد. حاول مرة أخرى.",
    "Could not reach the secure login server. Check your connection and try again.":"تعذّر الوصول إلى خادم تسجيل الدخول الآمن. تحقق من الاتصال وحاول مرة أخرى.",
    "Login succeeded but the secure session was incomplete.":"نجح تسجيل الدخول لكن الجلسة الآمنة لم تكتمل.",
    "Owner session is no longer valid.":"جلسة المالك لم تعد صالحة.",
    "Your owner session expired. Please sign in again.":"انتهت جلسة المالك. سجّل الدخول من جديد.",
    "This account is not approved for owner access.":"هذا الحساب غير معتمد لدخول المالك.",
    "Signed out.":"تم تسجيل الخروج.",
    "Creating the protected owner account…":"جارٍ إنشاء حساب المالك المحمي…",
    "Owner created. Signing you in…":"تم إنشاء حساب المالك. جارٍ تسجيل الدخول…",
    "Owner account activated.":"تم تفعيل حساب المالك.",
    "Could not create owner account.":"تعذّر إنشاء حساب المالك.",
    "Owner setup failed.":"فشل إعداد حساب المالك.",
    "Use a password with at least 12 characters.":"استخدم كلمة مرور من 12 حرفاً على الأقل.",
    "Dashboard initialization failed. Check the backend connection.":"فشل تشغيل لوحة الإدارة. تحقق من اتصال النظام الخلفي.",
    "New category name:":"اسم الفئة الجديدة:",
    "+ New category…":"+ فئة جديدة…",
    "Condiments":"مستلزمات المطبخ",
    "Dates":"تمر",
    "Debsy Carob":"دبسي خروب",
    "Distillates + Syrups":"مقطرات وشرابات",
    "Dried Foods":"أطعمة مجففة",
    "Flour":"طحين",
    "Grains":"حبوب",
    "Herbs":"أعشاب",
    "Honey":"عسل",
    "Molasses":"دبس",
    "Mouneh":"مونة",
    "Nuts + Seeds":"مكسرات وبذور",
    "Oils":"زيوت",
    "Olive Oil":"زيت زيتون",
    "Olives":"زيتون",
    "Pickles":"مخللات",
    "Pulses":"بقوليات",
    "Soap":"صابون",
    "Spices":"بهارات",
    "Sweets + Candy":"حلويات وسكاكر",
    "Vinegars":"خل",
    "Sun":"أحد",
    "Mon":"اثن",
    "Tue":"ثلا",
    "Wed":"أرب",
    "Thu":"خمي",
    "Fri":"جمع",
    "Sat":"سبت",
    "Customers":"العملاء",
    "Mouneh Points":"نقاط المونة",
    "Search everything":"ابحث في كل شيء",
    "Quick actions":"إجراءات سريعة",
    "What do you want to do?":"ماذا تريد أن تفعل؟",
    "Manual order":"طلب يدوي",
    "Create promo":"إنشاء عرض",
    "Phone, Instagram or walk-in order":"طلب عبر الهاتف أو إنستغرام أو من المحل",
    "Open website promo controls":"فتح إعدادات العرض في الموقع",
    "Order command center":"مركز إدارة الطلبات",
    "Today":"اليوم",
    "New orders":"طلبات جديدة",
    "Sales today":"مبيعات اليوم",
    "Being handled":"قيد المعالجة",
    "Waiting 30m+":"بانتظار أكثر من 30 دقيقة",
    "Delivered today":"تم توصيلها اليوم",
    "All availability":"كل حالات التوفر",
    "Filter availability":"تصفية حسب التوفر",
    "In stock":"متوفر",
    "Out of stock":"غير متوفر",
    "Coming soon":"قريباً",
    "Needs attention":"يحتاج مراجعة",
    "Incomplete products":"منتجات غير مكتملة",
    "Select visible":"تحديد الظاهر",
    "Clear":"مسح",
    "Choose bulk action…":"اختر إجراءً جماعياً…",
    "Change availability":"تغيير التوفر",
    "Change visibility":"تغيير الظهور",
    "Change category":"تغيير الفئة",
    "Delete selected":"حذف المحدد",
    "Apply":"تطبيق",
    "selected":"محدد",
    "Customer history":"سجل العميل",
    "See repeat customers, order history and spending at a glance.":"شاهد العملاء المتكررين وسجل الطلبات والإنفاق بسرعة.",
    "Customers are grouped by phone when available, otherwise by name and area.":"يتم تجميع العملاء حسب رقم الهاتف عند توفره، وإلا حسب الاسم والمنطقة.",
    "Search customer, phone or area…":"ابحث عن عميل أو هاتف أو منطقة…",
    "Most recent":"الأحدث",
    "Most orders":"الأكثر طلباً",
    "Highest spend":"الأعلى إنفاقاً",
    "View orders":"عرض الطلبات",
    "No customer history yet.":"لا يوجد سجل عملاء بعد.",
    "Delivery defaults":"إعدادات التوصيل",
    "Keep delivery rules in one place":"احتفظ بقواعد التوصيل في مكان واحد",
    "Default fee (USD)":"رسوم التوصيل الافتراضية (USD)",
    "Free delivery above (USD)":"توصيل مجاني فوق (USD)",
    "Minimum order (USD)":"الحد الأدنى للطلب (USD)",
    "Estimated delivery":"مدة التوصيل المتوقعة",
    "Start date & time":"تاريخ ووقت البدء",
    "End date & time":"تاريخ ووقت الانتهاء",
    "Leave dates empty to show the promo whenever it is enabled.":"اترك التواريخ فارغة لعرض الإعلان كلما كان مفعّلاً.",
    "Orders":"الطلبات",
    "Order value":"قيمة الطلبات",
    "Average order":"متوسط الطلب",
    "Gift share":"نسبة الهدايا",
    "Top ordered products":"المنتجات الأكثر طلباً",
    "What customers actually order":"ما يطلبه العملاء فعلياً",
    "Top viewed products":"المنتجات الأكثر مشاهدة",
    "What customers browse":"ما يتصفحه العملاء",
    "Phone app":"تطبيق الهاتف",
    "Install Owner Console":"تثبيت لوحة المالك",
    "Install on this device":"تثبيت على هذا الجهاز",
    "Overview":"نظرة عامة",
    "Customize your home screen":"خصّص الصفحة الرئيسية",
    "Choose what you want to see first when you open the owner console on your phone.":"اختر ما تريد رؤيته أولاً عند فتح لوحة المالك على هاتفك.",
    "Traffic chart":"مخطط الزيارات",
    "Catalogue health":"حالة الكتالوج",
    "Recent activity":"النشاط الأخير",
    "Availability":"التوفر",
    "Keep stock simple for customers.":"اجعل حالة التوفر واضحة وبسيطة للعملاء.",
    "Can be ordered":"يمكن طلبه",
    "Visible, ordering disabled":"ظاهر والطلب متوقف",
    "Private owner note":"ملاحظة خاصة للمالك",
    "Supplier note, replacement, reminder… customers never see this.":"ملاحظة للمورّد أو بديل أو تذكير… لا يراها العملاء.",
    "Rotate":"تدوير",
    "Fill frame":"ملء الإطار",
    "Fit whole photo":"إظهار الصورة كاملة",
    "Card preview":"معاينة البطاقة",
    "Popup preview":"معاينة النافذة",
    "Version history":"سجل النسخ",
    "Restore a recent product version.":"استعد نسخة سابقة من المنتج.",
    "Restore":"استعادة",
    "WhatsApp tools":"أدوات واتساب",
    "Customer updates":"تحديثات العميل",
    "Order confirmed":"تم تأكيد الطلب",
    "Internal notes":"ملاحظات داخلية",
    "Save note":"حفظ الملاحظة",
    "Previous orders":"الطلبات السابقة",
    "Search everything":"البحث في كل شيء",
    "Find anything fast":"اعثر على أي شيء بسرعة",
    "Product, order code, customer, area…":"منتج أو رمز طلب أو عميل أو منطقة…",
    "Add an order from anywhere":"أضف طلباً من أي مصدر",
    "Customer name":"اسم العميل",
    "Phone / WhatsApp":"الهاتف / واتساب",
    "Delivery area":"منطقة التوصيل",
    "Order type":"نوع الطلب",
    "Products":"المنتجات",
    "Add products and quantities.":"أضف المنتجات والكميات.",
    "+ Add item":"+ إضافة عنصر",
    "Delivery fee (USD)":"رسوم التوصيل (USD)",
    "Customer/order notes":"ملاحظات العميل / الطلب",
    "Create order":"إنشاء الطلب",
    "Restore backup":"استعادة نسخة احتياطية",
    "Delivery areas":"مناطق التوصيل",
    "Optional area-specific fee and ETA overrides.":"رسوم ومدة توصيل مخصصة لكل منطقة بشكل اختياري.",
    "+ Add area":"+ إضافة منطقة",
    "Area":"المنطقة",
    "Fee (USD)":"الرسوم (USD)",
    "ETA":"مدة التوصيل",
    "Remove area":"حذف المنطقة",
    "Preview mobile":"معاينة الهاتف",
    "Preview desktop":"معاينة الكمبيوتر",
    "Website preview":"معاينة الموقع",
    "Preview before publishing":"معاينة قبل النشر",
    "Announcement":"الإعلان",
    "Announcement bar hidden":"شريط الإعلان مخفي",
    "Unsaved preview only — nothing is published until you press Save.":"هذه معاينة غير محفوظة — لن يُنشر شيء حتى تضغط حفظ.",
    "Done":"تم",
    "Create cloud backup":"إنشاء نسخة سحابية",
    "No cloud backups yet.":"لا توجد نسخ سحابية بعد.",
    "Download":"تنزيل",
    "Cloud backup created.":"تم إنشاء النسخة السحابية.",
    "Cloud backup restored.":"تمت استعادة النسخة السحابية.",
    "Could not create cloud backup.":"تعذّر إنشاء النسخة السحابية.",
    "Could not load cloud backups.":"تعذّر تحميل النسخ السحابية.",
    "Ready to install on this device.":"جاهز للتثبيت على هذا الجهاز.",
    "No phone saved":"لا يوجد رقم هاتف محفوظ",
    "total spend":"إجمالي الإنفاق",
    "orders":"طلبات",
    "delivered":"تم توصيلها",
    "Owner inbox":"صندوق المالك",
    "What needs your attention":"ما يحتاج إلى انتباهك",
    "Everything looks good.":"كل شيء يبدو جيداً.",
    "No urgent owner actions right now.":"لا توجد إجراءات عاجلة حالياً.",
    "Waiting for owner review.":"بانتظار مراجعة المالك.",
    "These active orders have been waiting the longest.":"هذه الطلبات النشطة تنتظر منذ مدة أطول.",
    "Missing names, category, price, photo or availability.":"ينقصها اسم أو فئة أو سعر أو صورة أو حالة توفر.",
    "Clear photos make the catalogue easier to shop.":"الصور الواضحة تجعل التسوق من الكتالوج أسهل.",
    "Visible to customers but ordering is disabled.":"ظاهر للعملاء لكن الطلب متوقف.",
    "Visible products that cannot be ordered yet.":"منتجات ظاهرة لكن لا يمكن طلبها بعد.",
    "Enabled promo has expired":"العرض المفعّل انتهت صلاحيته",
    "It is no longer shown to customers.":"لم يعد ظاهراً للعملاء.",
    "Promo ends soon":"العرض ينتهي قريباً",
    "Cloud backup recommended":"يُنصح بإنشاء نسخة سحابية",
    "Latest backup is more than a day old.":"آخر نسخة احتياطية أقدم من يوم.",
    "No cloud backup is available yet.":"لا توجد نسخة سحابية بعد.",
    "Review orders":"مراجعة الطلبات",
    "Open waiting":"عرض الطلبات المنتظرة",
    "Fix products":"إصلاح المنتجات",
    "Review photos":"مراجعة الصور",
    "Review stock":"مراجعة التوفر",
    "Review products":"مراجعة المنتجات",
    "Update promo":"تحديث العرض",
    "Back up now":"إنشاء نسخة الآن",
    "Data tools":"أدوات البيانات",
    "Import / Export Center":"مركز الاستيراد والتصدير",
    "Import / Export":"استيراد / تصدير",
    "Excel, CSV and backups":"Excel وCSV والنسخ الاحتياطية",
    "Download":"تنزيل",
    "Excel, CSV & backup files":"ملفات Excel وCSV والنسخ الاحتياطية",
    "Phone-friendly downloads":"تنزيلات مناسبة للهاتف",
    "Products, variants, availability and categories.":"المنتجات والأحجام والتوفر والفئات.",
    "Full order history with codes, customer and items.":"سجل الطلبات الكامل مع الرموز والعملاء والعناصر.",
    "Repeat customers, phone, area, orders and spend.":"العملاء المتكررون والهاتف والمنطقة والطلبات والإنفاق.",
    "Owner report":"تقرير المالك",
    "One Excel workbook with products, orders, customers and categories.":"ملف Excel واحد للمنتجات والطلبات والعملاء والفئات.",
    "Restorable backup":"نسخة قابلة للاستعادة",
    "JSON backup for restoring products, settings and private notes.":"نسخة JSON لاستعادة المنتجات والإعدادات والملاحظات الخاصة.",
    "Excel report":"تقرير Excel",
    "Backup JSON":"نسخة JSON",
    "Readable Excel":"Excel للقراءة",
    "Upload":"رفع",
    "Update products from Excel or CSV":"تحديث المنتجات من Excel أو CSV",
    "A safety backup is created first":"يتم إنشاء نسخة أمان أولاً",
    "Choose Excel or CSV file":"اختر ملف Excel أو CSV",
    "Best workflow: export Products, edit it, then upload the edited file here.":"أفضل طريقة: صدّر المنتجات، عدّل الملف، ثم ارفع النسخة المعدلة هنا.",
    "Products found":"المنتجات الموجودة",
    "Ready":"جاهز",
    "Issues":"مشاكل",
    "Fix these before importing":"أصلح هذه المشاكل قبل الاستيراد",
    "File is ready to import.":"الملف جاهز للاستيراد.",
    "Result":"النتيجة",
    "Clear file":"مسح الملف",
    "Apply product import":"تطبيق استيراد المنتجات",
    "Excel / CSV":"Excel / CSV",
    "Import / Export Center":"مركز الاستيراد والتصدير",
    "No data to export.":"لا توجد بيانات للتصدير.",
    "Excel tools are still loading. Try again in a moment.":"أدوات Excel ما زالت قيد التحميل. حاول بعد لحظة.",
    "The spreadsheet has no product rows.":"ملف الجدول لا يحتوي على صفوف منتجات.",
    "No spreadsheet sheet was found.":"لم يتم العثور على ورقة داخل الملف.",
    "Could not read spreadsheet.":"تعذّرت قراءة ملف الجدول.",
    "Product import failed.":"فشل استيراد المنتجات.",
    "Live traffic and customer activity from one synchronized event stream.":"حركة الموقع ونشاط العملاء مباشرة من مصدر بيانات واحد ومتزامن.",
    "Loading analytics…":"جارٍ تحميل التحليلات…",
    "Page views & sessions":"مشاهدات الصفحات والجلسات",
    "Page views & sessions · 7 days":"مشاهدات الصفحات والجلسات · 7 أيام",
    "Analytics connection needs attention":"اتصال التحليلات يحتاج إلى مراجعة",
    "No tracked website activity yet":"لا يوجد نشاط موقع مسجّل بعد",
    "Backup":"نسخة احتياطية",
    "Restorable JSON":"JSON قابل للاستعادة",
    "30-day daily traffic, sessions, WhatsApp activity, searches and top pages.":"حركة يومية لمدة 30 يوماً، الجلسات، نشاط واتساب، البحث وأهم الصفحات.",
    "JSON is the restorable backup.":"ملف JSON هو النسخة القابلة للاستعادة.",
    "Excel is a readable reference copy of the same owner data.":"ملف Excel نسخة مرجعية مقروءة من بيانات المالك نفسها.",
    "Download a complete owner backup or readable Excel report. JSON is used for restore; Excel/CSV are for viewing, editing and reporting.":"نزّل نسخة مالك كاملة أو تقرير Excel مقروء. يُستخدم JSON للاستعادة، بينما Excel وCSV للعرض والتعديل والتقارير.",
    "same data source as Overview":"نفس مصدر البيانات في نظرة عامة"
  });

  function translatePhrase(value) {
    const text=String(value??"").trim();
    if(!text)return text;
    if(AR_TRANSLATIONS[text])return AR_TRANSLATIONS[text];

    let m=text.match(/^(\d+) products?$/);
    if(m)return `${m[1]} منتج`;
    m=text.match(/^(\d+) orders? · (active|past|all history)$/);
    if(m){
      const scope={active:"نشطة",past:"سابقة","all history":"كل السجل"}[m[2]]||m[2];
      return `${m[1]} طلب · ${scope}`;
    }
    m=text.match(/^(\d+) total items$/);
    if(m)return `${m[1]} عنصر إجمالاً`;
    m=text.match(/^(\d+) items?$/);
    if(m)return `${m[1]} عنصر`;
    m=text.match(/^(\d+) avg \/ day$/);
    if(m)return `متوسط ${m[1]} يومياً`;
    m=text.match(/^([\d.]+) views \/ session$/);
    if(m)return `${m[1]} مشاهدة / جلسة`;
    m=text.match(/^(\d+) hidden or draft$/);
    if(m)return `${m[1]} مخفي أو مسودة`;
    m=text.match(/^(\d+) day period$/);
    if(m)return `فترة ${m[1]} يوم`;
    m=text.match(/^Updated (.+)$/);
    if(m)return `آخر تحديث ${m[1]}`;
    m=text.match(/^Created (.+)$/);
    if(m)return `أُنشئ ${m[1]}`;
    m=text.match(/^(\d+)m ago$/);
    if(m)return `منذ ${m[1]} د`;
    m=text.match(/^(\d+)h ago$/);
    if(m)return `منذ ${m[1]} س`;
    m=text.match(/^(\d+)d ago$/);
    if(m)return `منذ ${m[1]} ي`;
    m=text.match(/^Qty (\d+)$/);
    if(m)return `الكمية ${m[1]}`;
    m=text.match(/^(.+) · Website order$/);
    if(m)return `${m[1]} · طلب من الموقع`;
    m=text.match(/^(.+) · Owner update$/);
    if(m)return `${m[1]} · تحديث من المالك`;
    m=text.match(/^(Pantry|Gift) · WhatsApp code$/);
    if(m)return `${translatePhrase(m[1])} · رمز واتساب`;
    m=text.match(/^(Pantry order|Gift order|Pantry|Gift) · (.+)$/);
    if(m)return `${translatePhrase(m[1])} · ${translatePhrase(m[2])}`;
    m=text.match(/^(.+): (New|Confirmed|Preparing|Out for delivery|Delivered|Cancelled)$/);
    if(m)return `${m[1]}: ${translatePhrase(m[2])}`;
    m=text.match(/^(\d+) new orders?$/);
    if(m)return `${m[1]} طلب جديد`;
    m=text.match(/^(\d+) orders? waiting 30\+ min$/);
    if(m)return `${m[1]} طلب بانتظار أكثر من 30 دقيقة`;
    m=text.match(/^(\d+) incomplete products?$/);
    if(m)return `${m[1]} منتج غير مكتمل`;
    m=text.match(/^(\d+) products? missing photos$/);
    if(m)return `${m[1]} منتج بدون صورة`;
    m=text.match(/^(\d+) out of stock$/);
    if(m)return `${m[1]} غير متوفر`;
    m=text.match(/^(\d+) coming soon$/);
    if(m)return `${m[1]} قريباً`;
    m=text.match(/^(\d+) selected$/);
    if(m)return `${m[1]} محدد`;
    m=text.match(/^(\d+) issues?$/);
    if(m)return `${m[1]} مشكلة`;
    m=text.match(/^(\d+) products? imported successfully\.$/);
    if(m)return `تم استيراد ${m[1]} منتج بنجاح.`;
    m=text.match(/^(\d+) views · (\d+) sessions · Last tracked event (.+)$/);
    if(m)return `${m[1]} مشاهدة · ${m[2]} جلسة · آخر نشاط مسجّل ${translatePhrase(m[3])}`;
    return text;
  }

  function localizeDom(root=document.body) {
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes){
      const parent=node.parentElement;
      if(!parent||parent.closest("script,style,code,[data-no-i18n]"))continue;
      if(!originalTextNodes.has(node))originalTextNodes.set(node,node.nodeValue);
      const original=originalTextNodes.get(node);
      const core=original.trim();
      if(!core)continue;
      const leading=(original.match(/^\s*/)||[""])[0];
      const trailing=(original.match(/\s*$/)||[""])[0];
      node.nodeValue=leading+(state.lang==="ar"?translatePhrase(core):core)+trailing;
    }

    const elements=root.nodeType===1?[root,...root.querySelectorAll("*")]:[...document.querySelectorAll("*")];
    for(const el of elements){
      if(el.closest?.("[data-no-i18n]"))continue;
      for(const attr of ["placeholder","aria-label","title"]){
        if(!el.hasAttribute?.(attr))continue;
        let store=originalAttributes.get(el);
        if(!store){store={};originalAttributes.set(el,store);}
        if(!(attr in store))store[attr]=el.getAttribute(attr);
        const base=store[attr]||"";
        el.setAttribute(attr,state.lang==="ar"?translatePhrase(base):base);
      }
    }
  }

  function updateLanguageButtons() {
    $$("[data-admin-lang]").forEach(btn=>{
      const active=btn.dataset.adminLang===state.lang;
      btn.classList.toggle("is-active",active);
      btn.setAttribute("aria-pressed",active?"true":"false");
    });
  }

  function applyAdminLanguage(lang,persist=true) {
    state.lang=lang==="ar"?"ar":"en";
    if(persist){
      try{localStorage.setItem(ADMIN_LANG_KEY,state.lang);}catch{}
    }
    document.documentElement.lang=state.lang;
    document.documentElement.dir=state.lang==="ar"?"rtl":"ltr";
    document.body.classList.toggle("admin-rtl",state.lang==="ar");
    document.title=state.lang==="ar"?"زيت ومونة — لوحة المالك":"Zayt w Mouneh — Owner Console";
    localizeDom(document.body);

    if(state.products?.length){
      populateCategoryControls();
      renderProducts();
      renderOrders();
      renderOverview();
      renderAnalytics();
      renderActivity();
      renderSettings();
      localizeDom($("adminApp"));
    }
    updateLanguageButtons();
    document.dispatchEvent(new CustomEvent("zwm:admin-language"));
    if($("contentPreviewModal")&&!$("contentPreviewModal").hidden)sendContentPreviewDraft();
  }

  function toggleAdminLanguage() {
    applyAdminLanguage(state.lang==="ar"?"en":"ar",true);
  }

  function chooseAdminLanguage(lang) {
    applyAdminLanguage(lang==="ar"?"ar":"en",true);
  }

  function startLanguageObserver() {
    if(languageObserver)return;
    languageObserver=new MutationObserver(mutations=>{
      if(state.lang!=="ar")return;
      for(const mutation of mutations){
        for(const node of mutation.addedNodes){
          if(node.nodeType===1)localizeDom(node);
          else if(node.nodeType===3&&node.parentElement)localizeDom(node.parentElement);
        }
      }
      updateLanguageButtons();
    });
    languageObserver.observe(document.body,{childList:true,subtree:true});
  }

  const state = {
    client: null, user: null, membership: null,
    overrides: new Map(), settings: new Map(), events: [], activity: [], orders: [], notes: new Map(), backups: [], analyticsError:null,
    products: [], editingId: null, imageFile: null, imageDims: null,
    activeView: "overview", productFilter: { q:"", category:"", status:"", availability:"" },
    selectedProducts:new Set(),
    orderFilter: { q:"", status:"", kind:"" }, orderScope:"active", orderCommand:"", selectedOrderReference:null,
    customerFilter:{q:"",sort:"recent"},
    imagePosition:{x:50,y:50,zoom:100,rotation:0,fit:"cover",preview:"card"}, previewObjectUrl:null,
    installPrompt:null, productImport:null,
    contentDirty:false,
    session:null, sessionRefreshTimer:null,
    orderChannel:null, orderSyncTimer:null, orderSyncBusy:false,
    lang:readAdminLanguage()
  };

  function enabled() {
    return !!(cfg.enabled && cfg.supabaseUrl && cfg.supabasePublishableKey && window.supabase?.createClient);
  }

  function safeText(value) { return String(value ?? ""); }
  function slugify(value) {
    return safeText(value).toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,140);
  }
  function money(v) {
    const n = Number(v);
    return Number.isFinite(n) ? `$${n.toFixed(2)}` : "—";
  }
  function when(ts) {
    if (!ts) return "Base catalogue";
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "—";
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff/86400000)}d ago`;
    return d.toLocaleDateString(undefined,{month:"short",day:"numeric"});
  }
  function setStatus(el, message="", type="") {
    if (!el) return;
    el.textContent = message;
    el.classList.toggle("is-error", type==="error");
    el.classList.toggle("is-success", type==="success");
  }
  function toast(message, type="") {
    const wrap = $("toastStack");
    if (!wrap) return;
    const el = document.createElement("div");
    el.className = "admin-toast" + (type==="error" ? " is-error" : "");
    el.textContent = message;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }
  function esc(v) {
    return safeText(v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function downloadBlob(filename, blob) {
    let url="";
    let a=null;
    try{
      url=URL.createObjectURL(blob);
      a=document.createElement("a");
      a.href=url;
      a.download=filename;
      a.rel="noopener";
      a.style.display="none";
      document.body.appendChild(a);
      if("download" in a){
        a.click();
      }else{
        a.target="_blank";
        a.click();
      }
      toast(`Download started: ${filename}`);
    }catch(err){
      console.error("Download failed:",err);
      toast("Could not start the download on this device.","error");
      throw err;
    }finally{
      setTimeout(()=>{a?.remove();if(url)URL.revokeObjectURL(url);},5000);
    }
  }
  function downloadJson(filename, data) {
    downloadBlob(filename,new Blob([JSON.stringify(data,null,2)],{type:"application/json;charset=utf-8"}));
  }
  function csvCell(value) {
    const text=safeText(value);
    return /[",\n\r]/.test(text)?`"${text.replace(/"/g,'""')}"`:text;
  }
  function downloadCsv(filename, rows) {
    const list=Array.isArray(rows)?rows:[];
    if(!list.length)return toast("No data to export.","error");
    const headers=[...new Set(list.flatMap(row=>Object.keys(row||{})))];
    const csv="\ufeff"+[headers.map(csvCell).join(","),...list.map(row=>headers.map(h=>csvCell(row?.[h]??"")).join(","))].join("\r\n");
    downloadBlob(filename,new Blob([csv],{type:"text/csv;charset=utf-8"}));
  }

  function showOnly(id) {
    for (const key of ["setupScreen","loginScreen","adminApp"]) {
      const el = $(key);
      if (el) el.hidden = key !== id;
    }
  }

  const OWNER_SESSION_KEY = "zwm:owner-session:v3";
  const LEGACY_OWNER_SESSION_KEY = "zwm:owner-session:v2";

  function anonymousClient() {
    return window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey, {
      auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
    });
  }

  function authenticatedClient(accessToken) {
    return window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey, {
      accessToken: async () => accessToken,
      auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
    });
  }

  function readOwnerSession() {
    try{
      localStorage.removeItem(LEGACY_OWNER_SESSION_KEY);
      const raw=sessionStorage.getItem(OWNER_SESSION_KEY);
      const value=raw?JSON.parse(raw):null;
      return value&&value.access_token&&value.refresh_token?value:null;
    }catch{return null;}
  }

  function saveOwnerSession(session) {
    try{sessionStorage.setItem(OWNER_SESSION_KEY,JSON.stringify(session));}catch{}
  }

  function clearOwnerSession() {
    try{sessionStorage.removeItem(OWNER_SESSION_KEY);}catch{}
    try{localStorage.removeItem(LEGACY_OWNER_SESSION_KEY);}catch{}
    if(state.sessionRefreshTimer){
      clearTimeout(state.sessionRefreshTimer);
      state.sessionRefreshTimer=null;
    }
    if(state.orderSyncTimer){clearInterval(state.orderSyncTimer);state.orderSyncTimer=null;}
    if(state.orderChannel&&state.client){try{state.client.removeChannel(state.orderChannel)}catch{} state.orderChannel=null;}
    state.session=null;
  }

  async function fetchWithTimeout(url,options={},timeoutMs=12000) {
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),timeoutMs);
    try{
      return await fetch(url,{...options,signal:controller.signal});
    }catch(err){
      if(err?.name==="AbortError")throw new Error("The secure login server did not respond in time. Please try again.");
      throw new Error("Could not reach the secure login server. Check your connection and try again.");
    }finally{
      clearTimeout(timeout);
    }
  }

  function authRequestHeaders(accessToken="") {
    return {
      "apikey":cfg.supabasePublishableKey,
      "Authorization":`Bearer ${accessToken||cfg.supabasePublishableKey}`,
      "Content-Type":"application/json"
    };
  }

  function normalizeSession(payload) {
    const now=Math.floor(Date.now()/1000);
    return {
      access_token:payload.access_token,
      refresh_token:payload.refresh_token,
      token_type:payload.token_type||"bearer",
      expires_in:Number(payload.expires_in)||3600,
      expires_at:Number(payload.expires_at)||now+(Number(payload.expires_in)||3600),
      user:payload.user||null
    };
  }

  async function passwordGrant(email,password) {
    const response=await fetchWithTimeout(
      cfg.supabaseUrl.replace(/\/$/,"")+"/auth/v1/token?grant_type=password",
      {
        method:"POST",
        headers:authRequestHeaders(),
        body:JSON.stringify({email,password})
      }
    );
    const result=await response.json().catch(()=>({}));
    if(!response.ok){
      const message=result?.msg||result?.message||result?.error_description||"Email or password is incorrect.";
      throw new Error(message);
    }
    if(!result?.access_token||!result?.refresh_token||!result?.user)throw new Error("Login succeeded but the secure session was incomplete.");
    return normalizeSession(result);
  }

  async function refreshGrant(refreshToken) {
    const response=await fetchWithTimeout(
      cfg.supabaseUrl.replace(/\/$/,"")+"/auth/v1/token?grant_type=refresh_token",
      {
        method:"POST",
        headers:authRequestHeaders(),
        body:JSON.stringify({refresh_token:refreshToken})
      }
    );
    const result=await response.json().catch(()=>({}));
    if(!response.ok||!result?.access_token||!result?.refresh_token)throw new Error("Your owner session expired. Please sign in again.");
    return normalizeSession(result);
  }

  async function authUser(accessToken) {
    const response=await fetchWithTimeout(
      cfg.supabaseUrl.replace(/\/$/,"")+"/auth/v1/user",
      {method:"GET",headers:authRequestHeaders(accessToken)}
    );
    if(!response.ok)throw new Error("Owner session is no longer valid.");
    return response.json();
  }

  function scheduleOwnerRefresh() {
    if(state.sessionRefreshTimer)clearTimeout(state.sessionRefreshTimer);
    if(!state.session?.refresh_token)return;
    const now=Math.floor(Date.now()/1000);
    const refreshIn=Math.max(30000,((state.session.expires_at||now+3600)-now-120)*1000);
    state.sessionRefreshTimer=setTimeout(async()=>{
      try{
        const next=await refreshGrant(state.session.refresh_token);
        await activateOwnerSession(next,false);
      }catch{
        clearOwnerSession();
        state.client=anonymousClient();
        showOnly("loginScreen");
        setStatus($("loginStatus"),"Your owner session expired. Please sign in again.","error");
      }
    },refreshIn);
  }

  async function activateOwnerSession(session,persist=true) {
    state.session=session;
    if(persist)saveOwnerSession(session);
    state.client=authenticatedClient(session.access_token);
    scheduleOwnerRefresh();
    const user=session.user||await authUser(session.access_token);
    state.session.user=user;
    if(persist)saveOwnerSession(state.session);
    await enterAs(user);
  }

  async function restoreOwnerSession() {
    const stored=readOwnerSession();
    if(!stored)return false;
    try{
      let session=stored;
      const now=Math.floor(Date.now()/1000);
      if(!session.expires_at||session.expires_at<=now+60)session=await refreshGrant(session.refresh_token);
      else session.user=await authUser(session.access_token);
      await activateOwnerSession(session,true);
      return true;
    }catch{
      clearOwnerSession();
      return false;
    }
  }

  async function init() {
    applyAdminLanguage(state.lang,false);
    startLanguageObserver();
    bindStaticUi();
    if($("ownerBootstrap"))$("ownerBootstrap").hidden=cfg.allowBootstrap!==true;
    if (!enabled()) {
      showOnly("setupScreen");
      return;
    }
    state.client=anonymousClient();
    const restored=await restoreOwnerSession();
    if(!restored)showOnly("loginScreen");
  }

  async function refreshOrdersLive(){
    if(state.orderSyncBusy||!state.client||!state.user||document.hidden)return;
    state.orderSyncBusy=true;
    const selected=state.selectedOrderReference;
    try{
      const ordersRes=await loadAllOrders();
      if(ordersRes.error)throw ordersRes.error;
      state.orders=ordersRes.data||[];
      renderOrders();renderCustomers();renderOverview();renderAnalytics();
      if(selected&&$("orderModal")&&!$("orderModal").hidden)openOrderDetails(selected);
      localizeDom($("adminApp"));
    }catch(err){
      console.warn("Live order refresh failed:",err);
      toast("Could not refresh incoming orders. Retrying automatically.","error");
    }finally{state.orderSyncBusy=false;}
  }
  function startOrderLiveSync(){
    if(state.orderChannel){try{state.client.removeChannel(state.orderChannel)}catch{} state.orderChannel=null;}
    if(state.orderSyncTimer){clearInterval(state.orderSyncTimer);state.orderSyncTimer=null;}
    try{
      state.orderChannel=state.client.channel("zwm-owner-orders")
        .on("postgres_changes",{event:"*",schema:"public",table:cfg.tables.orders||"orders"},()=>refreshOrdersLive())
        .subscribe();
    }catch(err){console.warn("Order realtime unavailable:",err);}
    state.orderSyncTimer=setInterval(()=>refreshOrdersLive(),30000);
  }

  async function enterAs(user) {
    state.user = user;
    const { data, error } = await state.client
      .from(cfg.tables.admins)
      .select("user_id,label")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) {
      clearOwnerSession();
      state.client=anonymousClient();
      showOnly("loginScreen");
      setStatus($("loginStatus"), "This account is not approved for owner access.", "error");
      return;
    }

    state.membership = data;
    $("ownerName").textContent = data.label || "Owner";
    $("ownerEmail").textContent = user.email || "Owner";
    $("ownerInitial").textContent = (data.label || user.email || "O").charAt(0).toUpperCase();
    $("settingsEmail").textContent = user.email || "—";
    showOnly("adminApp");
    await refreshAll();
    startOrderLiveSync();
    await ensureDailyCloudBackup();
  }

  async function loadAllEvents(since) {
    const rows=[];
    const pageSize=1000;
    let from=0;
    while(true){
      const {data,error}=await state.client
        .from(cfg.tables.events)
        .select("*")
        .gte("created_at",since)
        .order("created_at",{ascending:false})
        .range(from,from+pageSize-1);
      if(error)return {data:rows,error};
      rows.push(...(data||[]));
      if(!data||data.length<pageSize)break;
      from+=pageSize;
    }
    return {data:rows,error:null};
  }

  async function loadAllOrders() {
    const rows=[];
    const pageSize=1000;
    let from=0;
    while(true){
      const {data,error}=await state.client
        .from(cfg.tables.orders || "orders")
        .select("*")
        .order("submitted_at",{ascending:false})
        .range(from,from+pageSize-1);
      if(error)return {data:rows,error};
      rows.push(...(data||[]));
      if(!data||data.length<pageSize)break;
      from+=pageSize;
    }
    return {data:rows,error:null};
  }

  async function refreshAll() {
    const since = new Date(Date.now() - 90*86400000).toISOString();
    const [overridesRes, settingsRes, eventsRes, activityRes, ordersRes, notesRes, backupsRes] = await Promise.all([
      state.client.from(cfg.tables.products).select("*").order("updated_at",{ascending:false}),
      state.client.from(cfg.tables.settings).select("*"),
      loadAllEvents(since),
      state.client.from(cfg.tables.activity).select("*").order("created_at",{ascending:false}).limit(300),
      loadAllOrders(),
      state.client.from(cfg.tables.notes || "admin_notes").select("*").order("updated_at",{ascending:false}).limit(5000),
      state.client.from(cfg.tables.backups || "admin_backups").select("*").order("created_at",{ascending:false}).limit(12)
    ]);

    if (overridesRes.error) toast("Could not load product changes.", "error");
    if (settingsRes.error) toast("Could not load website settings.", "error");
    if (eventsRes.error) toast("Could not load website analytics.", "error");
    if (ordersRes.error) toast("Could not load order history.", "error");
    if (notesRes.error) toast("Could not load private notes.", "error");
    if (backupsRes.error) toast("Could not load cloud backups.", "error");

    state.overrides = new Map((overridesRes.data || []).map(r => [r.product_id,r]));
    if(!settingsRes.error) state.settings = new Map((settingsRes.data || []).map(r => [r.key,r.value]));
    state.events = eventsRes.data || [];
    state.analyticsError = eventsRes.error || null;
    state.activity = activityRes.data || [];
    state.orders = ordersRes.data || [];
    state.notes = new Map((notesRes.data || []).map(n => [`${n.subject_type}:${n.subject_id}`,n]));
    state.backups = backupsRes.data || [];
    rebuildProducts();
    renderEverything();
    $("lastUpdated").textContent = `Updated ${new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}`;
  }

  function rebuildProducts() {
    const products = baseProducts.map(base => {
      const row = state.overrides.get(base.id);
      if (!row) return {...clone(base), __status:"live", __source:"base", __updated:null};
      const payload = row.payload || {};
      if (payload.deleted === true) return null;
      return {
        ...clone(base), ...clone(payload),
        id: base.id,
        variants: Array.isArray(payload.variants) ? clone(payload.variants) : clone(base.variants || []),
        __status: payload.status || (row.action==="hide" ? "hidden" : "live"),
        __source:"edited", __updated:row.updated_at
      };
    }).filter(Boolean);
    for (const [id,row] of state.overrides) {
      if (baseById.has(id) || row.action==="hide" || row.payload?.deleted === true) continue;
      const p = clone(row.payload || {});
      p.id = id;
      p.variants = Array.isArray(p.variants) ? p.variants : [];
      p.__status = p.status || "live";
      p.__source = "new";
      p.__updated = row.updated_at;
      products.push(p);
    }
    state.products = products.sort((a,b) => safeText(a.nameEn).localeCompare(safeText(b.nameEn)));
  }

  function photoFor(product) {
    if (product?.photoRemoved) return null;
    if (product?.image?.url) return product.image;
    return basePhotoMap[product?.id] || null;
  }

  function statusFor(product) {
    if (product.__status==="hidden") return "hidden";
    if (product.__status==="draft") return "draft";
    if (product.__source==="new") return "new";
    if (product.__source==="edited") return "edited";
    return "live";
  }

  function visibleProducts() {
    return state.products.filter(p => !["hidden","draft"].includes(p.__status));
  }

  function renderEverything() {
    populateCategoryControls();
    renderProducts();
    renderOrders();
    renderCustomers();
    if(!state.contentDirty) renderContent();
    renderOverview();
    renderAnalytics();
    renderActivity();
    renderSettings();
    applyOverviewPreferences();
    localizeDom($("adminApp"));
    updateLanguageButtons();
  }

  function storedCategoryRecords() {
    const raw=state.settings.get("product_categories");
    const items=Array.isArray(raw?.items)?raw.items:[];
    return items
      .map(item=>({en:safeText(item?.en).trim(),ar:safeText(item?.ar).trim()}))
      .filter(item=>item.en);
  }

  function categoryRecords() {
    const map=new Map();
    for(const p of state.products){
      const en=safeText(p.category).trim();
      if(en&&!map.has(en))map.set(en,{en,ar:AR_TRANSLATIONS[en]||""});
    }
    for(const item of storedCategoryRecords()){
      const existing=map.get(item.en);
      map.set(item.en,{en:item.en,ar:item.ar||existing?.ar||AR_TRANSLATIONS[item.en]||""});
    }
    return [...map.values()].sort((a,b)=>a.en.localeCompare(b.en));
  }

  function categoryDisplayName(en) {
    const record=categoryRecords().find(item=>item.en===en);
    if(state.lang==="ar")return record?.ar||AR_TRANSLATIONS[en]||en;
    return en;
  }

  function populateCategoryControls() {
    const categories=categoryRecords();
    const values=categories.map(c=>c.en);
    const filter=$("productCategoryFilter");
    const current=filter.value;
    const allLabel=state.lang==="ar"?translatePhrase("All categories"):"All categories";
    filter.innerHTML=`<option value="">${esc(allLabel)}</option>` + categories.map(c=>`<option value="${esc(c.en)}">${esc(state.lang==="ar"?(c.ar||AR_TRANSLATIONS[c.en]||c.en):c.en)}</option>`).join("");
    filter.value=values.includes(current)?current:"";

    const editor=$("productCategory");
    const editorCurrent=editor.value;
    editor.innerHTML=categories.map(c=>`<option value="${esc(c.en)}">${esc(state.lang==="ar"?(c.ar||AR_TRANSLATIONS[c.en]||c.en):c.en)}</option>`).join("");
    if(values.includes(editorCurrent))editor.value=editorCurrent;
  }

  async function addCategory() {
    if(!state.user)return;
    const enPrompt=state.lang==="ar"?translatePhrase("Category name (English):"):"Category name (English):";
    const arPrompt=state.lang==="ar"?translatePhrase("Category name (Arabic):"):"Category name (Arabic):";
    const en=prompt(enPrompt)?.trim();
    if(!en)return;
    const existing=categoryRecords().find(item=>item.en.toLowerCase()===en.toLowerCase());
    if(existing){
      toast(state.lang==="ar"?translatePhrase("That category already exists."):"That category already exists.","error");
      return existing.en;
    }
    const ar=prompt(arPrompt)?.trim()||"";
    const items=storedCategoryRecords();
    items.push({en,ar});
    const row={
      key:"product_categories",
      value:{items},
      updated_by:state.user.id,
      updated_at:new Date().toISOString()
    };
    const {error}=await state.client.from(cfg.tables.settings).upsert(row,{onConflict:"key"});
    if(error){
      toast(state.lang==="ar"?translatePhrase("Could not add category."):"Could not add category.","error");
      return;
    }
    await logActivity("create_category","category",en,{ar});
    state.settings.set("product_categories",{items});
    populateCategoryControls();
    localizeDom($("adminApp"));
    toast(state.lang==="ar"?translatePhrase("Category added."):"Category added.");
    return en;
  }

  const AVAILABILITY_LABELS={
    in_stock:"In stock",
    out_of_stock:"Out of stock",
    coming_soon:"Coming soon"
  };

  function availabilityFor(product){
    return ["in_stock","out_of_stock","coming_soon"].includes(product?.availability)?product.availability:"in_stock";
  }

  function productQualityScore(product){
    const checks=[
      !!safeText(product?.nameEn).trim(),
      !!safeText(product?.nameAr).trim(),
      !!safeText(product?.category).trim(),
      Array.isArray(product?.variants)&&product.variants.some(v=>safeText(v?.sizeEn||v?.sizeAr).trim()&&Number.isFinite(Number(v?.price))),
      !!photoFor(product),
      !!availabilityFor(product)
    ];
    return Math.round((checks.filter(Boolean).length/checks.length)*100);
  }

  function filteredProducts(){
    const {q,category,status,availability}=state.productFilter;
    const term=q.trim().toLowerCase();
    return state.products.filter(p=>{
      if(category&&p.category!==category)return false;
      if(availability&&availabilityFor(p)!==availability)return false;
      const st=statusFor(p);
      if(status==="missing-photo"&&photoFor(p))return false;
      if(status==="needs-attention"&&productQualityScore(p)>=100)return false;
      if(status&& !["missing-photo","needs-attention"].includes(status) && st!==status)return false;
      if(term){
        const hay=[p.id,p.nameEn,p.nameAr,p.category,p.original,availabilityFor(p)].join(" ").toLowerCase();
        if(!hay.includes(term))return false;
      }
      return true;
    });
  }

  function renderProducts() {
    const list=filteredProducts();
    $("productResultCount").textContent=`${list.length} product${list.length===1?"":"s"}`;
    $("navProductCount").textContent=state.products.length;

    // Drop selection for products that no longer exist.
    for(const id of [...state.selectedProducts])if(!state.products.some(p=>p.id===id))state.selectedProducts.delete(id);

    $("productTableBody").innerHTML=list.map(productRowHtml).join("")||'<tr><td colspan="8"><p class="empty-state">No products match these filters.</p></td></tr>';
    $("productCardsMobile").innerHTML=list.map(productCardHtml).join("")||'<p class="empty-state">No products match these filters.</p>';
    renderBulkProductBar();
  }

  function productRowHtml(p) {
    const photo=photoFor(p);
    const firstPrice=p.variants?.length?Math.min(...p.variants.map(v=>Number(v.price)).filter(Number.isFinite)):NaN;
    const status=statusFor(p);
    const availability=availabilityFor(p);
    const checked=state.selectedProducts.has(p.id);
    return `<tr class="${checked?"is-selected":""}">
      <td class="select-col"><label class="selection-check"><input type="checkbox" data-select-product="${esc(p.id)}" ${checked?"checked":""}><span></span></label></td>
      <td><div class="product-row-main">${photo?`<img class="product-thumb" src="${esc(photo.url)}" alt="">`:'<span class="product-thumb-placeholder">No photo</span>'}<div><b>${esc(p.nameEn||p.id)}</b><small>${esc(p.nameAr||p.id)} · ${esc(p.id)} · ${productQualityScore(p)}% complete</small></div></div></td>
      <td>${esc(p.category?categoryDisplayName(p.category):"—")}</td>
      <td>${money(firstPrice)}</td>
      <td><span class="availability-badge availability-${availability}">${esc(AVAILABILITY_LABELS[availability])}</span></td>
      <td><span class="status-badge status-${status}">${status.replace("-"," ")}</span></td>
      <td>${esc(when(p.__updated))}</td>
      <td><div class="row-actions"><button type="button" class="row-action" data-edit-product="${esc(p.id)}">Edit</button></div></td>
    </tr>`;
  }

  function productCardHtml(p) {
    const photo=photoFor(p),st=statusFor(p),availability=availabilityFor(p),checked=state.selectedProducts.has(p.id);
    return `<article class="product-mobile-card ${checked?"is-selected":""}">
      <label class="selection-check product-card-select"><input type="checkbox" data-select-product="${esc(p.id)}" ${checked?"checked":""}><span></span></label>
      ${photo?`<img class="product-thumb" src="${esc(photo.url)}" alt="">`:'<span class="product-thumb-placeholder">No photo</span>'}
      <div><b>${esc(p.nameEn||p.id)}</b><p>${esc(p.category?categoryDisplayName(p.category):"—")} · ${productQualityScore(p)}% complete</p><p><span class="availability-badge availability-${availability}">${esc(AVAILABILITY_LABELS[availability])}</span> <span class="status-badge status-${st}">${st}</span></p></div>
      <button type="button" data-edit-product="${esc(p.id)}">Edit</button>
    </article>`;
  }

  function renderBulkProductBar(){
    const count=state.selectedProducts.size;
    $("bulkProductBar").hidden=count===0;
    $("bulkSelectedCount").textContent=`${count} selected`;
  }

  function toggleProductSelection(id,checked){
    if(checked)state.selectedProducts.add(id);
    else state.selectedProducts.delete(id);
    renderProducts();
  }

  function clearProductSelection(){
    state.selectedProducts.clear();
    renderProducts();
  }

  function configureBulkValue(){
    const action=$("bulkProductAction").value;
    const select=$("bulkProductValue");
    if(!action||action==="delete"){select.hidden=true;select.innerHTML="";return;}
    select.hidden=false;
    if(action==="availability"){
      select.innerHTML=Object.entries(AVAILABILITY_LABELS).map(([v,l])=>`<option value="${v}">${l}</option>`).join("");
    }else if(action==="visibility"){
      select.innerHTML='<option value="live">Live</option><option value="draft">Draft</option><option value="hidden">Hidden</option>';
    }else if(action==="category"){
      select.innerHTML=categoryRecords().map(c=>`<option value="${esc(c.en)}">${esc(state.lang==="ar"?(c.ar||AR_TRANSLATIONS[c.en]||c.en):c.en)}</option>`).join("");
    }
  }

  async function saveProductRevision(product,reason="edit"){
    if(!product||!state.user)return;
    const snapshot=clone(product);
    delete snapshot.__source;delete snapshot.__status;delete snapshot.__updated;
    try{
      await state.client.from(cfg.tables.revisions||"product_revisions").insert({
        product_id:product.id,
        snapshot,
        reason,
        created_by:state.user.id
      });
    }catch{}
  }

  async function applyBulkProductAction(){
    const ids=[...state.selectedProducts];
    const action=$("bulkProductAction").value;
    const value=$("bulkProductValue").value;
    if(!ids.length||!action)return;
    if(action==="delete"&&!confirm(`Delete ${ids.length} selected products? This cannot be undone.`))return;
    await createCloudBackup(`before_bulk_${action}`,true);
    $("applyBulkProductAction").disabled=true;
    try{
      for(const id of ids){
        const product=state.products.find(p=>p.id===id);if(!product)continue;
        await saveProductRevision(product,`bulk_${action}`);
        if(action==="delete"){
          if(baseById.has(id)){
            const {error}=await state.client.from(cfg.tables.products).upsert({
              product_id:id,action:"hide",payload:{id,status:"hidden",deleted:true},
              updated_at:new Date().toISOString(),updated_by:state.user.id
            },{onConflict:"product_id"}); if(error)throw error;
          }else{
            const {error}=await state.client.from(cfg.tables.products).delete().eq("product_id",id);if(error)throw error;
          }
          continue;
        }
        const payload=clone(product);
        delete payload.__source;delete payload.__status;delete payload.__updated;
        if(action==="availability")payload.availability=value;
        if(action==="visibility")payload.status=value;
        if(action==="category")payload.category=value;
        const {error}=await state.client.from(cfg.tables.products).upsert({
          product_id:id,action:"upsert",payload,
          updated_at:new Date().toISOString(),updated_by:state.user.id
        },{onConflict:"product_id"});
        if(error)throw error;
      }
      await logActivity("bulk_product_update","product",ids.join(","),{action,value,count:ids.length});
      toast(`${ids.length} products updated.`);
      state.selectedProducts.clear();
      $("bulkProductAction").value="";
      configureBulkValue();
      await refreshAll();
    }catch(err){toast(err.message||"Bulk update failed.","error");}
    finally{$("applyBulkProductAction").disabled=false;}
  }

  const ORDER_STATUS_LABELS = {
    new:"Order received",
    confirmed:"Confirmed",
    preparing:"Preparing",
    out_for_delivery:"Out for delivery",
    delivered:"Delivered",
    cancelled:"Cancelled"
  };
  const PAYMENT_STATUS_LABELS=Object.freeze({
    pending:"Payment pending",
    paid:"Payment received",
    failed:"Payment failed",
    refunded:"Refunded",
    partially_refunded:"Partially refunded",
    not_required:"No payment required"
  });
  function paymentMethodLabel(method){
    const value=safeText(method||"cash_on_delivery");
    if(value==="cash_on_delivery")return "Cash on Delivery";
    if(value==="whish"||value==="wish")return "Whish";
    if(value==="omt")return "OMT";
    return value.replace(/_/g," ").replace(/\b\w/g,ch=>ch.toUpperCase());
  }
  function paymentStatusLabel(order){return PAYMENT_STATUS_LABELS[order?.payment_status||"pending"]||safeText(order?.payment_status||"pending");}
  function orderRewardsState(order){
    if(order.status==="cancelled"||["failed","refunded","partially_refunded"].includes(order.payment_status))return {label:"No points",help:"Cancelled, failed or refunded orders do not earn points.",className:"is-none"};
    if(order.status==="delivered"&&order.payment_status==="paid")return {label:"Points earned",help:"Delivery and payment are both confirmed.",className:"is-earned"};
    if(order.status==="delivered")return {label:"Waiting for payment",help:"Delivered, but money has not been confirmed received yet.",className:"is-waiting"};
    if(order.payment_status==="paid")return {label:"Waiting for delivery",help:"Payment received. Points will settle after delivery.",className:"is-waiting"};
    return {label:"Pending",help:"Points wait for both delivery and payment confirmation.",className:"is-waiting"};
  }
  function paymentBadgeHtml(order){
    const status=order?.payment_status||"pending";
    return `<span class="order-payment-badge payment-${esc(status)}">${esc(paymentStatusLabel(order))}</span>`;
  }
  function paymentActionHtml(order){
    if((order?.payment_status||"pending")==="pending"){
      return `<button type="button" class="order-payment-confirm" data-order-payment-received="${esc(order.reference)}">Confirm payment received</button>`;
    }
    return "";
  }

  const PAST_ORDER_STATUSES = new Set(["delivered","cancelled"]);

  function orderItemSummary(order) {
    const items=Array.isArray(order.items)?order.items:[];
    if(!items.length)return "No items";
    const first=items.slice(0,2).map(i=>`${Number(i.qty)||1}× ${i.name||i.product_id||"Item"}`).join(", ");
    return items.length>2?`${first} +${items.length-2} more`:first;
  }

  function orderSearchText(order) {
    return [
      order.reference,order.customer_name,order.customer_phone,order.area,order.notes,order.kind,order.status,
      ...(Array.isArray(order.items)?order.items.flatMap(i=>[i.name,i.product_id,i.size]):[])
    ].join(" ").toLowerCase();
  }

  function isToday(value){
    const d=new Date(value); if(Number.isNaN(d.getTime()))return false;
    const now=new Date();
    return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth()&&d.getDate()===now.getDate();
  }

  function orderMatchesScope(order) {
    if(state.orderScope==="past"&&!PAST_ORDER_STATUSES.has(order.status))return false;
    if(state.orderScope==="active"&&PAST_ORDER_STATUSES.has(order.status))return false;
    if(state.orderCommand==="today"&&!isToday(order.submitted_at))return false;
    if(state.orderCommand==="waiting"){
      const age=Date.now()-new Date(order.submitted_at).getTime();
      if(PAST_ORDER_STATUSES.has(order.status)||age<30*60000)return false;
    }
    if(state.orderCommand==="delivered_today"&&!(order.status==="delivered"&&isToday(order.delivered_at||order.updated_at)))return false;
    return true;
  }

  function renderOrders() {
    const {q,status,kind}=state.orderFilter;
    const term=q.trim().toLowerCase();
    const list=state.orders.filter(order=>{
      if(!orderMatchesScope(order))return false;
      if(status&&order.status!==status)return false;
      if(kind&&order.kind!==kind)return false;
      if(term&&!orderSearchText(order).includes(term))return false;
      return true;
    });

    const active=state.orders.filter(o=>!PAST_ORDER_STATUSES.has(o.status)).length;
    const past=state.orders.filter(o=>PAST_ORDER_STATUSES.has(o.status)).length;
    $("navOrderCount").textContent=active;
    if($("mobileOrderCount"))$("mobileOrderCount").textContent=active;
    $("orderActiveTabCount").textContent=active;
    $("orderPastTabCount").textContent=past;
    $("orderAllTabCount").textContent=state.orders.length;
    $$("[data-order-scope]").forEach(btn=>btn.classList.toggle("is-active",btn.dataset.orderScope===state.orderScope));
    $$("[data-order-command]").forEach(btn=>btn.classList.toggle("is-active",btn.dataset.orderCommand===state.orderCommand));

    $("ordersNewCount").textContent=state.orders.filter(o=>o.status==="new").length;
    if($("ordersConfirmedCount"))$("ordersConfirmedCount").textContent=state.orders.filter(o=>o.status==="confirmed").length;
    $("ordersPreparingCount").textContent=state.orders.filter(o=>o.status==="preparing").length;
    $("ordersOutCount").textContent=state.orders.filter(o=>o.status==="out_for_delivery").length;
    $("ordersDeliveredCount").textContent=state.orders.filter(o=>o.status==="delivered").length;
    if($("ordersPaymentPendingCount"))$("ordersPaymentPendingCount").textContent=state.orders.filter(o=>o.status!=="cancelled"&&(o.payment_status||"pending")==="pending").length;
    $("orderResultCount").textContent=`${list.length} order${list.length===1?"":"s"} · ${state.orderCommand||state.orderScope}`;

    $("orderTableBody").innerHTML=list.map(orderRowHtml).join("")||'<tr><td colspan="7"><p class="empty-state">No orders match these filters.</p></td></tr>';
    $("orderCardsMobile").innerHTML=list.map(orderCardHtml).join("")||'<p class="empty-state">No orders match these filters.</p>';
  }
  const ORDER_NEXT_STATUS=Object.freeze({
    new:["confirmed","cancelled"],
    confirmed:["preparing","cancelled"],
    preparing:["out_for_delivery","cancelled"],
    out_for_delivery:["delivered","cancelled"],
    delivered:["cancelled"],
    cancelled:[]
  });
  function orderStatusSelect(order,extraClass="") {
    const allowed=new Set([order.status,...(ORDER_NEXT_STATUS[order.status]||[])]);
    return `<select class="order-status-select status-${esc(order.status)} ${extraClass}" data-order-status="${esc(order.reference)}" aria-label="Status for ${esc(order.reference)}">${Object.entries(ORDER_STATUS_LABELS).filter(([value])=>allowed.has(value)).map(([value,label])=>`<option value="${value}" ${order.status===value?"selected":""}>${label}</option>`).join("")}</select>`;
  }
  function orderSourceLabel(order){
    const source=order.created_source||order.extra?.source||"other";
    if(source==="website"||source==="native_checkout")return "Website";
    if(source==="admin"||source==="manual")return "Owner";
    if(source==="whatsapp_manual"||source==="cart")return "WhatsApp legacy";
    if(source==="phone_manual")return "Phone";
    return "Other";
  }
  const ORDER_QUICK_LABELS=Object.freeze({
    confirmed:"Approve order",
    preparing:"Start preparing",
    out_for_delivery:"Taken / out for delivery",
    delivered:"Mark delivered"
  });
  function orderQuickActionHtml(order){
    const next=(ORDER_NEXT_STATUS[order.status]||[]).find(s=>s!=="cancelled");
    if(!next)return "";
    return `<button type="button" data-order-quick-status="${esc(next)}" data-order-ref="${esc(order.reference)}">${esc(ORDER_QUICK_LABELS[next]||ORDER_STATUS_LABELS[next])}</button>`;
  }

  function orderRowHtml(order) {
    const extra=order.extra||{};
    const customer=order.kind==="gift"?(extra.recipient||order.customer_name||"Gift order"):(order.customer_name||"Customer");
    const kindLabel=order.kind==="gift"?"Gift":"Pantry";
    return `<tr>
      <td><div class="order-code-cell"><b>${esc(order.reference)}</b><small>${kindLabel} · ${esc(orderSourceLabel(order))}</small></div></td>
      <td><div class="order-customer-cell"><b>${esc(customer)}</b><small>${esc(order.area||"Area not supplied")}</small></div></td>
      <td><div class="order-items-cell"><b>${esc(orderItemSummary(order))}</b><small>${Array.isArray(order.items)?order.items.reduce((n,i)=>n+(Number(i.qty)||0),0):0} total items</small></div></td>
      <td><div class="order-total-payment"><b>${money(order.total)}</b>${paymentBadgeHtml(order)}</div></td>
      <td><div class="order-status-stack">${orderStatusSelect(order)}<small>${esc(ORDER_STATUS_LABELS[order.status]||order.status)}</small></div></td>
      <td><div class="order-date-cell"><b>${esc(when(order.submitted_at))}</b><small>${esc(new Date(order.submitted_at).toLocaleString([], {month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}))}</small></div></td>
      <td><button class="row-action" type="button" data-view-order="${esc(order.reference)}">Details</button></td>
    </tr>`;
  }

  function orderCardHtml(order) {
    const extra=order.extra||{};
    const customer=order.kind==="gift"?(extra.recipient||order.customer_name||"Gift order"):(order.customer_name||"Customer");
    return `<article class="order-mobile-card">
      <div class="order-mobile-head"><div><b>${esc(order.reference)}</b><small>${order.kind==="gift"?"Gift":"Pantry order"} · ${esc(orderSourceLabel(order))} · ${esc(when(order.submitted_at))}</small></div><strong>${money(order.total)}</strong></div>
      <p><b>${esc(customer)}</b> · ${esc(order.area||"Area not supplied")}</p>
      <p>${esc(orderItemSummary(order))}</p>
      <div class="order-mobile-state-row"><div><small>Delivery</small>${orderStatusSelect(order)}</div><div><small>Payment</small>${paymentBadgeHtml(order)}</div></div>
      <div class="order-card-quick-actions">${orderQuickActionHtml(order)}${paymentActionHtml(order)}</div>
      <button class="button-secondary order-details-button" type="button" data-view-order="${esc(order.reference)}">View full order & history</button>
    </article>`;
  }

  function customerKey(order){
    if(order.customer_id)return "uid:"+order.customer_id;
    const phone=safeText(order.customer_phone).replace(/\D/g,"");
    if(phone)return "phone:"+phone;
    const name=safeText(order.customer_name||order.extra?.recipient).trim().toLowerCase();
    const area=safeText(order.area).trim().toLowerCase();
    return "name:"+name+"|"+area;
  }

  function customerGroups(){
    const map=new Map();
    for(const order of state.orders){
      const key=customerKey(order);
      if(!key||key==="name:|")continue;
      if(!map.has(key))map.set(key,{key,name:order.customer_name||order.extra?.recipient||"Customer",phone:order.customer_phone||"",area:order.area||"",orders:[],total:0,last:null});
      const c=map.get(key);
      c.orders.push(order);
      c.total+=Number(order.total)||0;
      const d=new Date(order.submitted_at).getTime();
      if(!c.last||d>new Date(c.last).getTime()){c.last=order.submitted_at;c.name=order.customer_name||order.extra?.recipient||c.name;c.area=order.area||c.area;c.phone=order.customer_phone||c.phone;}
    }
    return [...map.values()];
  }

  function renderCustomers(){
    const allCustomers=customerGroups();
    let items=[...allCustomers];
    const q=state.customerFilter.q.trim().toLowerCase();
    if(q)items=items.filter(c=>[c.name,c.phone,c.area].join(" ").toLowerCase().includes(q));
    if(state.customerFilter.sort==="orders")items.sort((a,b)=>b.orders.length-a.orders.length);
    else if(state.customerFilter.sort==="spend")items.sort((a,b)=>b.total-a.total);
    else items.sort((a,b)=>new Date(b.last)-new Date(a.last));
    $("navCustomerCount").textContent=allCustomers.length;
    $("customerGrid").innerHTML=items.length?items.map(c=>`
      <article class="customer-card" data-customer-key="${esc(c.key)}">
        <div class="customer-card-head"><div><b>${esc(c.name)}</b><small>${esc(c.phone||c.area||"No phone saved")}</small></div><strong>${money(c.total)}</strong></div>
        <div class="customer-card-stats"><span><b>${c.orders.length}</b> orders</span><span>Last ${esc(when(c.last))}</span></div>
        <div class="customer-card-actions">
          <button type="button" data-customer-orders="${esc(c.key)}">View orders</button>
          ${c.phone?`<a href="https://wa.me/${esc(c.phone.replace(/\D/g,""))}" target="_blank" rel="noopener">WhatsApp</a>`:""}
        </div>
      </article>`).join(""):'<p class="empty-state">No customer history yet.</p>';
  }

  function customerHistoryFor(order){
    const key=customerKey(order);
    return customerGroups().find(c=>c.key===key)||null;
  }
  function normalizedOrderHistory(order) {
    const history=Array.isArray(order.status_history)?order.status_history.filter(Boolean):[];
    const items=[{status:"new",at:order.submitted_at,source:"website"},...history];
    const seen=new Set();
    return items
      .filter(item=>item?.status&&item?.at)
      .filter(item=>{
        const key=`${item.status}|${item.at}`;
        if(seen.has(key))return false;
        seen.add(key);return true;
      })
      .sort((a,b)=>new Date(a.at)-new Date(b.at));
  }

  function renderOrderTimeline(order) {
    const history=normalizedOrderHistory(order);
    $("orderDetailTimeline").innerHTML=history.map((item,index)=>`
      <div class="order-timeline-row">
        <span class="order-timeline-dot"></span>
        <div><b>${esc(ORDER_STATUS_LABELS[item.status]||item.status)}</b><small>${esc(new Date(item.at).toLocaleString([], {year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}))}${item.source==="website"?" · Website order":" · Owner update"}</small></div>
      </div>`).join("") || '<p class="empty-state">No status history yet.</p>';
  }

  function openOrderDetails(reference) {
    const order=state.orders.find(o=>o.reference===reference);
    if(!order)return;
    state.selectedOrderReference=reference;
    const extra=order.extra||{};
    const customer=order.kind==="gift"?(extra.recipient||order.customer_name||"Gift order"):(order.customer_name||"Customer");
    const items=Array.isArray(order.items)?order.items:[];
    $("orderDetailTitle").textContent=order.kind==="gift"?"Gift order":"Pantry order";
    $("orderDetailCode").textContent=order.reference;
    $("orderDetailSent").textContent=`Created ${new Date(order.submitted_at).toLocaleString([], {year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}`;
    $("orderDetailCustomer").textContent=customer;
    $("orderDetailArea").textContent=order.area||"Area not supplied";
    $("orderDetailPhone").textContent=order.customer_phone||"No phone saved";
    $("orderDetailKind").textContent=order.kind==="gift"?"Gift order":"Pantry order";
    $("orderDetailLanguage").textContent=order.language==="ar"?"Arabic order":"English order";
    if($("orderDetailSource"))$("orderDetailSource").textContent=orderSourceLabel(order);
    $("orderDetailTotal").textContent=money(order.total);
    if($("orderDetailBreakdown")){
      const parts=[`Products ${money(order.subtotal ?? extra.products_subtotal ?? order.total)}`];
      if(Number(order.reward_discount||extra.mouneh_discount||0)>0)parts.push(`Reward -${money(order.reward_discount||extra.mouneh_discount)}`);
      parts.push(Number(order.delivery_fee||extra.delivery_fee||0)>0?`Delivery ${money(order.delivery_fee||extra.delivery_fee)}`:"Delivery free");
      $("orderDetailBreakdown").textContent=parts.join(" · ");
    }
    $("orderDetailStatus").innerHTML=orderStatusSelect(order,"order-detail-status-select");
    if($("orderDetailPaymentStatus"))$("orderDetailPaymentStatus").innerHTML=paymentBadgeHtml(order)+(order.paid_at?`<small class="payment-paid-at">Confirmed ${esc(new Date(order.paid_at).toLocaleString([], {month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}))}</small>`:"");
    if($("orderDetailPaymentMethod"))$("orderDetailPaymentMethod").textContent=paymentMethodLabel(order.payment_method);
    if($("orderDetailPaymentAction"))$("orderDetailPaymentAction").innerHTML=paymentActionHtml(order);
    const rewardsState=orderRewardsState(order);
    if($("orderDetailRewardsState")){$("orderDetailRewardsState").textContent=rewardsState.label;$("orderDetailRewardsState").className=rewardsState.className;}
    if($("orderDetailRewardsHelp"))$("orderDetailRewardsHelp").textContent=rewardsState.help;
    $("orderDetailItemCount").textContent=`${items.reduce((n,i)=>n+(Number(i.qty)||0),0)} item${items.reduce((n,i)=>n+(Number(i.qty)||0),0)===1?"":"s"}`;
    $("orderDetailItems").innerHTML=items.map((item,i)=>`
      <div class="order-detail-item">
        <span>${i+1}</span>
        <div><b>${esc(item.name||item.product_id||"Item")}</b><small>${esc(item.size||"")} · Qty ${Number(item.qty)||1}</small></div>
        <strong>${money(item.subtotal ?? ((Number(item.unit_price)||0)*(Number(item.qty)||1)))}</strong>
      </div>`).join("")||'<p class="empty-state">No item details stored.</p>';
    $("orderDetailNotes").textContent=order.notes||"No notes.";
    $("orderPrivateNote").value=order.private_notes||state.notes.get(`order:${order.reference}`)?.note||"";
    const customerHistory=customerHistoryFor(order);
    $("orderCustomerHistory").innerHTML=customerHistory?
      `<div class="customer-history-summary"><div><b>${customerHistory.orders.length}</b><span>orders</span></div><div><b>${money(customerHistory.total)}</b><span>total spend</span></div></div>
       <div class="customer-history-orders">${customerHistory.orders.slice().sort((a,b)=>new Date(b.submitted_at)-new Date(a.submitted_at)).slice(0,5).map(o=>`<button type="button" data-view-order="${esc(o.reference)}"><span>${esc(o.reference)}</span><b>${money(o.total)}</b><small>${esc(when(o.submitted_at))}</small></button>`).join("")}</div>`
      :'<p class="empty-state">No previous orders found.</p>';
    $("orderGiftDetails").hidden=order.kind!=="gift";
    if(order.kind==="gift"){
      const fields=[
        ["Recipient",extra.recipient],["Recipient phone",extra.recipient_phone],["Occasion",extra.occasion],["Packing",extra.packing],
        ["Theme",extra.theme],["Card language",extra.card_language],["Gift message",extra.gift_message],
        ["Hide prices",extra.hide_prices===true?"Yes":extra.hide_prices===false?"No":""]
      ].filter(([,v])=>v!==undefined&&v!==null&&v!=="");
      $("orderDetailGift").innerHTML=fields.map(([k,v])=>`<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join("")||'<p class="empty-state">No extra gift details stored.</p>';
    }
    renderOrderTimeline(order);
    $("orderModal").hidden=false;
    document.body.style.overflow="hidden";
  }

  function closeOrderDetails() {
    $("orderModal").hidden=true;
    state.selectedOrderReference=null;
    if($("productModal").hidden)document.body.style.overflow="";
  }

  async function copyOrderCode() {
    const code=state.selectedOrderReference;
    if(!code)return;
    try{
      await navigator.clipboard.writeText(code);
      toast("Order code copied.");
    }catch{
      toast("Could not copy the order code.","error");
    }
  }

  function orderMessage(order,status){
    const name=order.customer_name||order.extra?.recipient||"";
    const code=order.reference;
    const en={
      confirmed:`Hello ${name || "there"} 👋 Your Zayt w Mouneh order ${code} is confirmed. We’ll keep you updated as it moves forward.`,
      preparing:`Hello ${name || "there"} 👋 Your Zayt w Mouneh order ${code} is being prepared now.`,
      out_for_delivery:`Hello ${name || "there"} 👋 Your Zayt w Mouneh order ${code} is out for delivery and on the way.`,
      delivered:`Hello ${name || "there"} 👋 Your Zayt w Mouneh order ${code} has been delivered. Thank you! 🌿`
    };
    const ar={
      confirmed:`مرحباً ${name || ""} 👋 تم تأكيد طلبك من زيت ومونة رقم ${code}. سنبقيك على اطلاع على المراحل التالية.`,
      preparing:`مرحباً ${name || ""} 👋 طلبك من زيت ومونة رقم ${code} قيد التحضير الآن.`,
      out_for_delivery:`مرحباً ${name || ""} 👋 طلبك من زيت ومونة رقم ${code} خرج للتوصيل وهو في الطريق.`,
      delivered:`مرحباً ${name || ""} 👋 تم توصيل طلبك من زيت ومونة رقم ${code}. شكراً لك 🌿`
    };
    return (order.language==="ar"?ar:en)[status]||en[status]||"";
  }

  async function sendOrderMessage(status){
    const order=state.orders.find(o=>o.reference===state.selectedOrderReference);
    if(!order)return;
    const message=orderMessage(order,status);
    const phone=safeText(order.customer_phone).replace(/\D/g,"");
    if(phone){
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`,"_blank","noopener,noreferrer");
      return;
    }
    try{await navigator.clipboard.writeText(message);toast("Customer update copied.");}
    catch{toast("Could not copy customer update.","error");}
  }

  async function notifyOrderStatusWhatsApp(order,status){
    if(!order||!status||!state.session?.access_token)return {sent:false,reason:"no_owner_session"};
    if(!order.customer_phone)return {sent:false,reason:"missing_phone"};
    try{
      const endpoint=cfg.supabaseUrl.replace(/\/$/,"")+"/functions/v1/order-status-whatsapp";
      const response=await fetchWithTimeout(endpoint,{
        method:"POST",
        headers:{
          "apikey":cfg.supabasePublishableKey,
          "Authorization":"Bearer "+state.session.access_token,
          "Content-Type":"application/json"
        },
        body:JSON.stringify({reference:order.reference,status})
      },12000);
      const result=await response.json().catch(()=>({}));
      if(response.ok&&result?.sent){
        await logActivity("whatsapp_status_sent","order",order.reference,{status,provider_message_id:result.provider_message_id||null});
        return {sent:true};
      }
      await logActivity("whatsapp_status_pending","order",order.reference,{status,reason:result?.reason||result?.error||"not_sent"});
      return {
        sent:false,
        reason:result?.reason||"not_sent",
        error:result?.error||"",
        fallbackUrl:result?.fallback_url||"",
        message:result?.message||orderMessage(order,status)
      };
    }catch(err){
      await logActivity("whatsapp_status_pending","order",order.reference,{status,reason:"network_error"});
      return {sent:false,reason:"network_error",error:err?.message||String(err),message:orderMessage(order,status)};
    }
  }

  async function saveOrderPrivateNote(){
    const order=state.orders.find(o=>o.reference===state.selectedOrderReference);
    if(!order)return;
    const note=$("orderPrivateNote").value.trim();
    const {error}=await state.client.from(cfg.tables.orders||"orders").update({private_notes:note,updated_at:new Date().toISOString()}).eq("reference",order.reference);
    if(error){toast("Could not save private note.","error");return;}
    await upsertAdminNote("order",order.reference,note);
    toast("Private note saved.");
    await refreshAll();
    openOrderDetails(order.reference);
  }

  async function upsertAdminNote(subjectType,subjectId,note){
    if(!state.user)return;
    const key=`${subjectType}:${subjectId}`;
    if(!note){
      await state.client.from(cfg.tables.notes||"admin_notes").delete().eq("subject_type",subjectType).eq("subject_id",subjectId);
      state.notes.delete(key);
      return;
    }
    const row={subject_type:subjectType,subject_id:subjectId,note,updated_at:new Date().toISOString(),updated_by:state.user.id};
    const {error}=await state.client.from(cfg.tables.notes||"admin_notes").upsert(row,{onConflict:"subject_type,subject_id"});
    if(!error)state.notes.set(key,row);
  }

  async function confirmOrderPayment(reference){
    const order=state.orders.find(o=>o.reference===reference);
    if(!order||order.payment_status==="paid")return;
    if((order.payment_status||"pending")!=="pending"){
      toast("This payment is not in a pending state.","error");
      return;
    }
    const confirmed=window.confirm(
      "Confirm payment was actually received?\n\n"+
      reference+" · "+money(order.total)+"\n\n"+
      "Only confirm after the money has been received. Mouneh Points require BOTH payment received and Delivered status."
    );
    if(!confirmed)return;
    const {error}=await state.client.from(cfg.tables.orders||"orders").update({payment_status:"paid"}).eq("reference",reference);
    if(error){toast(error.message||"Could not confirm payment.","error");await refreshOrdersLive();return;}
    await logActivity("payment_received","order",reference,{amount:Number(order.total)||0,method:order.payment_method||"cash_on_delivery"});
    toast(reference+": payment received ✓");
    await refreshAll();
    if(state.selectedOrderReference===reference)openOrderDetails(reference);
    $("rewardsRefresh")?.click();
  }

  async function updateOrderStatus(reference,status) {
    if(!ORDER_STATUS_LABELS[status])return;
    const order=state.orders.find(o=>o.reference===reference);
    if(!order||order.status===status)return;
    if(!(ORDER_NEXT_STATUS[order.status]||[]).includes(status)){
      toast("That status change is not allowed. Move the order through the next delivery step.","error");
      renderOrders();
      if(state.selectedOrderReference===reference)openOrderDetails(reference);
      return;
    }
    if(status==="delivered"){
      const confirmed=window.confirm(
        "Confirm this order was actually delivered?\n\n"+
        reference+"\n\n"+
        (order.payment_status==="paid"
          ?"Payment is already confirmed received. Marking Delivered can now finalize Mouneh Points and referral rewards."
          :"Payment is still pending. You can mark the delivery complete, but NO points will be issued until payment is separately confirmed received.")+
        "\n\nThis action is recorded in owner history."
      );
      if(!confirmed){
        renderOrders();
        if(state.selectedOrderReference===reference)openOrderDetails(reference);
        return;
      }
    }
    const patch={status};
    const {error}=await state.client.from(cfg.tables.orders||"orders").update(patch).eq("reference",reference);
    if(error){toast(error.message||"Could not update order.","error");await refreshAll();return;}
    await logActivity("update_delivery_status","order",reference,{from:order.status,status});
    toast(`${reference}: ${ORDER_STATUS_LABELS[status]}`);
    const notice=await notifyOrderStatusWhatsApp(order,status);
    if(notice.sent){
      toast("Customer notified on WhatsApp.");
    }else if(notice.reason==="not_opted_in"){
      toast("Status updated. Customer did not opt in to automatic WhatsApp updates.");
    }else if(notice.reason==="whatsapp_business_not_configured"){
      toast("Status updated. WhatsApp Business auto-send still needs provider setup.");
    }else if(notice.reason==="missing_phone"){
      toast("Status updated. No customer WhatsApp number is saved.");
    }else if(notice.reason==="provider_error"){
      toast("Status updated, but WhatsApp could not send automatically.","error");
    }
    await refreshAll();
    if(state.selectedOrderReference===reference)openOrderDetails(reference);
  }

  function exportOrders() {
    downloadJson(`zwm-orders-${new Date().toISOString().slice(0,10)}.json`,state.orders);
  }

  function ownerInboxItems(){
    const items=[];
    const now=Date.now();
    const activeOrders=state.orders.filter(o=>!PAST_ORDER_STATUSES.has(o.status));
    const newOrders=activeOrders.filter(o=>o.status==="new");
    const waiting=activeOrders.filter(o=>now-new Date(o.submitted_at).getTime()>=30*60000);
    const deliveredUnpaid=state.orders.filter(o=>o.status==="delivered"&&(o.payment_status||"pending")==="pending");
    const incomplete=state.products.filter(p=>productQualityScore(p)<100&&!["hidden","draft"].includes(p.__status));
    const missingPhotos=state.products.filter(p=>!photoFor(p)&&!["hidden","draft"].includes(p.__status));
    const outOfStock=state.products.filter(p=>availabilityFor(p)==="out_of_stock"&&!["hidden","draft"].includes(p.__status));
    const comingSoon=state.products.filter(p=>availabilityFor(p)==="coming_soon"&&!["hidden","draft"].includes(p.__status));

    if(newOrders.length)items.push({key:"new_orders",level:"urgent",icon:"◎",title:`${newOrders.length} new order${newOrders.length===1?"":"s"}`,body:"Waiting for owner review.",action:"Review orders"});
    if(waiting.length)items.push({key:"waiting_orders",level:"urgent",icon:"◷",title:`${waiting.length} order${waiting.length===1?"":"s"} waiting 30+ min`,body:"These active orders have been waiting the longest.",action:"Open waiting"});
    if(deliveredUnpaid.length)items.push({key:"delivered_unpaid",level:"urgent",icon:"$",title:`${deliveredUnpaid.length} delivered order${deliveredUnpaid.length===1?"":"s"} awaiting payment confirmation`,body:"Points are blocked until money received is confirmed.",action:"Review payments"});
    if(incomplete.length)items.push({key:"incomplete_products",level:"attention",icon:"▦",title:`${incomplete.length} incomplete product${incomplete.length===1?"":"s"}`,body:"Missing names, category, price, photo or availability.",action:"Fix products"});
    if(missingPhotos.length)items.push({key:"missing_photos",level:"attention",icon:"◫",title:`${missingPhotos.length} product${missingPhotos.length===1?"":"s"} missing photos`,body:"Clear photos make the catalogue easier to shop.",action:"Review photos"});
    if(outOfStock.length)items.push({key:"out_of_stock",level:"info",icon:"○",title:`${outOfStock.length} out of stock`,body:"Visible to customers but ordering is disabled.",action:"Review stock"});
    if(comingSoon.length)items.push({key:"coming_soon",level:"info",icon:"◌",title:`${comingSoon.length} coming soon`,body:"Visible products that cannot be ordered yet.",action:"Review products"});

    const promo=state.settings.get("promo")||{};
    if(promo.enabled&&promo.endsAt){
      const end=new Date(promo.endsAt).getTime();
      const diff=end-now;
      if(Number.isFinite(end)&&diff<0)items.push({key:"promo_expired",level:"urgent",icon:"✦",title:"Enabled promo has expired",body:"It is no longer shown to customers.",action:"Update promo"});
      else if(Number.isFinite(end)&&diff<=48*3600000)items.push({key:"promo_ending",level:"attention",icon:"✦",title:"Promo ends soon",body:`Ends ${new Date(end).toLocaleString()}`,action:"Review promo"});
    }

    const latestBackup=state.backups[0]?.created_at?new Date(state.backups[0].created_at).getTime():0;
    if(!latestBackup||now-latestBackup>36*3600000){
      items.push({key:"backup_due",level:"info",icon:"↧",title:"Cloud backup recommended",body:latestBackup?"Latest backup is more than a day old.":"No cloud backup is available yet.",action:"Back up now"});
    }
    return items;
  }

  function renderOwnerInbox(){
    const items=ownerInboxItems();
    const count=items.length;
    $("ownerInboxCount").textContent=count;
    $("navInboxCount").textContent=count;
    $("navInboxCount").hidden=count===0;
    $("mobileInboxCount").textContent=count;
    $("mobileInboxCount").hidden=count===0;
    const root=$("ownerInboxList");
    if(!items.length){
      root.innerHTML='<div class="owner-inbox-clear"><span>✓</span><div><b>Everything looks good.</b><small>No urgent owner actions right now.</small></div></div>';
      return;
    }
    root.innerHTML=items.map(item=>`<button type="button" class="owner-inbox-item inbox-${item.level}" data-inbox-action="${esc(item.key)}">
      <span class="owner-inbox-icon">${item.icon}</span>
      <span class="owner-inbox-copy"><b>${esc(item.title)}</b><small>${esc(item.body)}</small></span>
      <em>${esc(item.action)} →</em>
    </button>`).join("");
  }

  async function handleInboxAction(action){
    if(action==="new_orders"){
      setView("orders");state.orderScope="active";state.orderCommand="";state.orderFilter.status="new";$("orderStatusFilter").value="new";renderOrders();return;
    }
    if(action==="waiting_orders"){
      setView("orders");state.orderScope="all";state.orderCommand="waiting";state.orderFilter.status="";$("orderStatusFilter").value="";renderOrders();return;
    }
    if(["incomplete_products","missing_photos","out_of_stock","coming_soon"].includes(action)){
      setView("products");
      state.productFilter.status=action==="incomplete_products"?"needs-attention":action==="missing_photos"?"missing-photo":"";
      state.productFilter.availability=action==="out_of_stock"?"out_of_stock":action==="coming_soon"?"coming_soon":"";
      $("productStatusFilter").value=state.productFilter.status;
      $("productAvailabilityFilter").value=state.productFilter.availability;
      renderProducts();return;
    }
    if(action==="promo_expired"||action==="promo_ending"){
      setView("content");setTimeout(()=>$("promoTitleEn")?.focus(),100);return;
    }
    if(action==="backup_due"){
      await createCloudBackup("owner_inbox",false);
      renderOwnerInbox();
    }
  }

  function renderOverview() {
    const stats=analyticsSnapshot(7);
    $("metricViews").textContent=stats.views.length.toLocaleString();
    $("metricSessions").textContent=stats.sessions.size.toLocaleString();
    $("metricWhatsApp").textContent=stats.whats.length.toLocaleString();
    $("metricProducts").textContent=visibleProducts().length.toLocaleString();
    $("metricViewsHint").textContent=`${(stats.views.length/7).toFixed(1)} avg / day`;
    $("metricSessionsHint").textContent=stats.sessions.size?`${(stats.views.length/stats.sessions.size).toFixed(1)} views / session`:"No session data yet";
    $("metricProductsHint").textContent=`${state.products.length-visibleProducts().length} hidden or draft`;

    const todayOrders=state.orders.filter(o=>isToday(o.submitted_at));
    const deliveredToday=state.orders.filter(o=>o.status==="delivered"&&isToday(o.delivered_at||o.updated_at));
    $("todayNewOrders").textContent=todayOrders.filter(o=>o.status==="new").length;
    $("todayPreparingOrders").textContent=todayOrders.filter(o=>["confirmed","preparing"].includes(o.status)).length;
    $("todayOutOrders").textContent=todayOrders.filter(o=>o.status==="out_for_delivery").length;
    $("todaySales").textContent=money(deliveredToday.reduce((sum,o)=>sum+(Number(o.total)||0),0));
    $("todayDeliveredOrders").textContent=`${deliveredToday.length} delivered`;

    const incomplete=state.products.filter(p=>productQualityScore(p)<100&&!["hidden","draft"].includes(p.__status)).length;
    const missing=state.products.filter(p=>!photoFor(p)&&!["hidden","draft"].includes(p.__status)).length;
    const hidden=state.products.filter(p=>p.__status==="hidden").length;
    const drafts=state.products.filter(p=>p.__status==="draft").length;
    $("incompleteProductsCount").textContent=incomplete;
    $("missingPhotosCount").textContent=missing;
    $("hiddenProductsCount").textContent=hidden;
    $("draftProductsCount").textContent=drafts;
    renderOwnerInbox();

    renderTrafficChart($("overviewChart"),stats.daily,{views:stats.views.length,sessions:stats.sessions.size});
    renderRankList($("topPagesList"),rankBy(stats.views,e=>cleanPath(e.page_path)).slice(0,5),"views");
    renderRecentActivity();
  }

  const OVERVIEW_PREF_KEY="zwm:overview-prefs:v1";
  function readOverviewPreferences(){
    try{return {...{inbox:true,orders:true,traffic:true,health:true,pages:true,activity:true},...JSON.parse(localStorage.getItem(OVERVIEW_PREF_KEY)||"{}")};}
    catch{return {inbox:true,orders:true,traffic:true,health:true,pages:true,activity:true};}
  }
  function applyOverviewPreferences(){
    const prefs=readOverviewPreferences();
    $$("[data-overview-widget]").forEach(el=>{el.hidden=prefs[el.dataset.overviewWidget]===false;});
    $$("[data-overview-pref]").forEach(input=>{input.checked=prefs[input.dataset.overviewPref]!==false;});
  }
  function saveOverviewPreference(key,value){
    const prefs=readOverviewPreferences();prefs[key]=value;
    try{localStorage.setItem(OVERVIEW_PREF_KEY,JSON.stringify(prefs));}catch{}
    applyOverviewPreferences();
  }

  function analyticsStart(days){
    const d=new Date();
    d.setHours(0,0,0,0);
    d.setDate(d.getDate()-Math.max(1,Number(days)||1)+1);
    return d;
  }

  function eventsWithin(days) {
    const min=analyticsStart(days).getTime();
    const max=Date.now();
    return state.events.filter(e=>{
      const t=new Date(e.created_at).getTime();
      return Number.isFinite(t)&&t>=min&&t<=max;
    });
  }

  function cleanPath(path) {
    const raw=safeText(path)||"/";
    const pathname=raw.split(/[?#]/,1)[0]||"/";
    const clean=pathname
      .replace(/\/index\.html$/,"/")
      .replace(/\.html$/,"")
      .replace(/^\//,"")
      .replace(/\/$/,"");
    return clean?clean.replace(/[-_]+/g," ").replace(/^./,c=>c.toUpperCase()):"Home";
  }

  function dailyTraffic(events,days) {
    const out=[];
    const start=analyticsStart(days);
    for(let i=0;i<days;i++){
      const d=new Date(start);d.setDate(start.getDate()+i);
      const next=new Date(d);next.setDate(d.getDate()+1);
      const dayEvents=events.filter(e=>{
        const t=new Date(e.created_at);
        return t>=d&&t<next;
      });
      const views=dayEvents.filter(e=>e.event_name==="page_view");
      const sessions=new Set(views.map(e=>e.session_id).filter(Boolean));
      out.push({
        label:d.toLocaleDateString(undefined,days>10?{month:"short",day:"numeric"}:{weekday:"short"}),
        fullLabel:d.toLocaleDateString(undefined,{month:"short",day:"numeric"}),
        views:views.length,
        sessions:sessions.size,
        date:d
      });
    }
    return out;
  }

  function analyticsSnapshot(days){
    const events=eventsWithin(days);
    const views=events.filter(e=>e.event_name==="page_view");
    const sessions=new Set(views.map(e=>e.session_id).filter(Boolean));
    const adds=events.filter(e=>e.event_name==="add_to_cart");
    const whats=events.filter(e=>e.event_name==="whatsapp_click");
    const productViews=events.filter(e=>e.event_name==="product_view");
    const searches=events.filter(e=>e.event_name==="search");
    return {days,events,views,sessions,adds,whats,productViews,searches,daily:dailyTraffic(events,days)};
  }

  function rankBy(list,keyFn) {
    const map=new Map();
    for(const item of list){const k=keyFn(item);if(k)map.set(k,(map.get(k)||0)+1);}
    return [...map].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value);
  }

  function renderTrafficChart(root,data,totals={}) {
    if(!root)return;
    const rows=Array.isArray(data)?data:[];
    const totalViews=Number.isFinite(Number(totals.views))?Number(totals.views):rows.reduce((sum,d)=>sum+d.views,0);
    const totalSessions=Number.isFinite(Number(totals.sessions))?Number(totals.sessions):rows.reduce((sum,d)=>sum+d.sessions,0);
    const width=700,height=180,left=24,right=14,top=18,bottom=22;
    const innerW=width-left-right,innerH=height-top-bottom;
    const max=Math.max(1,...rows.flatMap(d=>[d.views,d.sessions]));
    const x=i=>rows.length<=1?left+innerW/2:left+(i/(rows.length-1))*innerW;
    const y=v=>top+innerH-(v/max)*innerH;
    const viewPoints=rows.map((d,i)=>`${x(i).toFixed(1)},${y(d.views).toFixed(1)}`).join(" ");
    const sessionPoints=rows.map((d,i)=>`${x(i).toFixed(1)},${y(d.sessions).toFixed(1)}`).join(" ");
    const grid=[0,.25,.5,.75,1].map(p=>{
      const yy=top+innerH-(p*innerH);
      const val=Math.round(max*p);
      return `<line x1="${left}" y1="${yy}" x2="${width-right}" y2="${yy}" class="traffic-grid-line"/><text x="0" y="${yy+3}" class="traffic-y-label">${val}</text>`;
    }).join("");
    const step=rows.length<=8?1:Math.ceil(rows.length/7);
    const labels=rows.map((d,i)=>(i%step===0||i===rows.length-1)
      ?`<text x="${x(i)}" y="${height-4}" text-anchor="middle" class="traffic-x-label">${esc(d.label)}</text>`
      :"").join("");
    const dots=rows.map((d,i)=>`
      <circle cx="${x(i)}" cy="${y(d.views)}" r="3.8" class="traffic-dot traffic-dot-views"><title>${esc(d.fullLabel)} · ${d.views} page views</title></circle>
      <circle cx="${x(i)}" cy="${y(d.sessions)}" r="3.4" class="traffic-dot traffic-dot-sessions"><title>${esc(d.fullLabel)} · ${d.sessions} sessions</title></circle>`).join("");
    root.classList.add("traffic-chart");
    root.innerHTML=`
      <div class="traffic-chart-legend">
        <span><i class="traffic-key traffic-key-views"></i>Page views <b>${totalViews.toLocaleString()}</b></span>
        <span><i class="traffic-key traffic-key-sessions"></i>Sessions <b>${totalSessions.toLocaleString()}</b></span>
      </div>
      <div class="traffic-chart-canvas">
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Website traffic over time">
          ${grid}
          ${rows.length?`<polyline points="${viewPoints}" class="traffic-line traffic-line-views"/><polyline points="${sessionPoints}" class="traffic-line traffic-line-sessions"/>`:""}
          ${dots}
          ${labels}
        </svg>
      </div>`;
  }

  function renderRankList(root,items,unit="") {
    if(!root)return;
    if(!items.length){root.innerHTML='<p class="empty-state">No data yet.</p>';return;}
    root.innerHTML=items.map((it,i)=>`<div class="rank-item"><span>${i+1}</span><div><b>${esc(it.label)}</b><small>${esc(unit)}</small></div><em>${it.value.toLocaleString()}</em></div>`).join("");
  }
  function renderRecentActivity() {
    const root=$("recentActivityList");
    if(!state.activity.length){root.innerHTML='<p class="empty-state">No dashboard changes yet.</p>';return;}
    root.innerHTML=state.activity.slice(0,6).map(a=>`<div class="activity-item"><span class="activity-dot"></span><div><b>${esc(activityLabel(a))}</b><small>${esc(a.target_id||a.target_type||"")}</small></div><time>${esc(when(a.created_at))}</time></div>`).join("");
  }
  function activityLabel(a){
    return safeText(a.action).replace(/_/g," ").replace(/^./,c=>c.toUpperCase());
  }

  function renderContent() {
    const announcement = state.settings.get("announcement") || {};
    const contact = state.settings.get("contact") || {};
    const promo = state.settings.get("promo") || {};
    $("announcementEnabled").checked = announcement.enabled !== false;
    $("announcementEn").value = announcement.en || "Authentic Lebanese pantry essentials · Since 2006";
    $("announcementAr").value = announcement.ar || "";
    $("contentWhatsApp").value = contact.whatsapp || "96181581230";
    $("promoEnabled").checked = !!promo.enabled;
    $("promoTitleEn").value = promo.titleEn || "";
    $("promoTitleAr").value = promo.titleAr || "";
    $("promoBodyEn").value = promo.bodyEn || "";
    $("promoBodyAr").value = promo.bodyAr || "";
    $("promoStartsAt").value = promo.startsAt ? new Date(promo.startsAt).toISOString().slice(0,16) : "";
    $("promoEndsAt").value = promo.endsAt ? new Date(promo.endsAt).toISOString().slice(0,16) : "";
    const delivery=state.settings.get("delivery")||{};
    if($("deliveryEnabled"))$("deliveryEnabled").value=delivery.enabled===false?"0":"1";
    if($("deliveryEligibilityBasis"))$("deliveryEligibilityBasis").value=delivery.eligibilityBasis==="after_discount"?"after_discount":"before_discount";
    $("deliveryFee").value=Number.isFinite(Number(delivery.fee))?delivery.fee:"";
    $("deliveryFreeAbove").value=Number.isFinite(Number(delivery.freeAbove))?delivery.freeAbove:"";
    $("deliveryMinimum").value=Number.isFinite(Number(delivery.minimum))?delivery.minimum:"";
    $("deliveryEta").value=delivery.eta||"";
    $("deliveryZoneRows").innerHTML="";
    (Array.isArray(delivery.zones)?delivery.zones:[]).forEach(deliveryZoneRow);
  }

  function deliveryZoneRow(zone={}){
    const row=document.createElement("div");
    row.className="delivery-zone-row";
    row.innerHTML=`
      <label>Area<input data-zone="area" maxlength="120" value="${esc(zone.area||"")}" placeholder="e.g. Baabda"></label>
      <label>Fee (USD)<input data-zone="fee" type="number" min="0" step="0.01" value="${Number.isFinite(Number(zone.fee))?esc(zone.fee):""}"></label>
      <label>ETA<input data-zone="eta" maxlength="80" value="${esc(zone.eta||"")}" placeholder="e.g. Same day"></label>
      <button type="button" data-remove-zone aria-label="Remove area">×</button>`;
    $("deliveryZoneRows").appendChild(row);
  }

  function collectDeliveryZones(){
    return $$(".delivery-zone-row").map(row=>({
      area:row.querySelector('[data-zone="area"]').value.trim(),
      fee:Math.max(0,Number(row.querySelector('[data-zone="fee"]').value)||0),
      eta:row.querySelector('[data-zone="eta"]').value.trim()
    })).filter(z=>z.area);
  }

  function deliverySettingsFromForm(){
    const existing=state.settings.get("delivery")||{};
    return {
      enabled:$("deliveryEnabled")?$("deliveryEnabled").value!=="0":existing.enabled!==false,
      fee:Math.max(0,Number($("deliveryFee").value)||0),
      freeEnabled:true,
      freeAbove:Math.max(0,Number($("deliveryFreeAbove").value)||0),
      minimum:Math.max(0,Number($("deliveryMinimum").value)||0),
      eligibilityBasis:$("deliveryEligibilityBasis")?.value==="after_discount"?"after_discount":"before_discount",
      eta:$("deliveryEta").value.trim(),
      zones:collectDeliveryZones()
    };
  }

  function contentSettingsFromForm(){
    return {
      announcement:{enabled:$("announcementEnabled").checked,en:$("announcementEn").value.trim(),ar:$("announcementAr").value.trim()},
      contact:{whatsapp:$("contentWhatsApp").value.replace(/\D/g,"")},
      promo:{
        enabled:$("promoEnabled").checked,
        titleEn:$("promoTitleEn").value.trim(),titleAr:$("promoTitleAr").value.trim(),
        bodyEn:$("promoBodyEn").value.trim(),bodyAr:$("promoBodyAr").value.trim(),
        startsAt:$("promoStartsAt").value?new Date($("promoStartsAt").value).toISOString():null,
        endsAt:$("promoEndsAt").value?new Date($("promoEndsAt").value).toISOString():null
      },
      delivery:deliverySettingsFromForm()
    };
  }

  function contentValidationError(settings){
    const number=settings.contact.whatsapp;
    if(number.length<8||number.length>15)return "Enter a valid WhatsApp number including country code.";
    if(settings.announcement.enabled&&!settings.announcement.en&&!settings.announcement.ar)return "Add an announcement message or switch the announcement off.";
    const promo=settings.promo;
    if(promo.enabled&&!promo.titleEn&&!promo.titleAr&&!promo.bodyEn&&!promo.bodyAr)return "Add promo text or switch the promo off.";
    if(promo.startsAt&&promo.endsAt&&new Date(promo.endsAt).getTime()<new Date(promo.startsAt).getTime())return "Promo end date must be after the start date.";
    return "";
  }

  function markContentDirty(){
    state.contentDirty=true;
    setStatus($("contentStatus"),"Unsaved changes");
    const button=$("saveContentButton");
    if(button){button.disabled=false;button.textContent="Save website content";}
  }

  function selectedContentPreviewPage(){
    const allowed=new Set(["index.html","shop.html","gift.html","contact.html"]);
    const value=$("contentPreviewPage")?.value||"index.html";
    return allowed.has(value)?value:"index.html";
  }

  function updateLivePreviewLink(){
    const link=$("openLivePreviewPage");
    if(link)link.href=selectedContentPreviewPage();
  }

  function loadContentPreviewPage(force=false){
    const frame=$("contentPreviewFrame");
    if(!frame)return;
    const page=selectedContentPreviewPage();
    updateLivePreviewLink();
    const next=page+"?zwm_admin_preview=1";
    if(force||frame.dataset.previewPage!==page){
      frame.dataset.previewPage=page;
      frame.src=next;
      return;
    }
    sendContentPreviewDraft();
  }

  function broadcastSiteUpdate(kind,id=""){
    try{localStorage.setItem(CMS_SYNC_KEY,JSON.stringify({kind,id,at:Date.now()}));}catch{}
  }

  function sendContentPreviewDraft(){
    const frame=$("contentPreviewFrame");
    if(!frame?.contentWindow)return;
    frame.contentWindow.postMessage({
      type:"zwm-admin-preview",
      settings:contentSettingsFromForm(),
      lang:state.lang
    },location.origin);
  }

  function setContentPreviewMode(mode="desktop"){
    const resolved=mode==="mobile"?"mobile":"desktop";
    const device=$("contentPreviewDevice");
    device.classList.toggle("is-mobile",resolved==="mobile");
    device.classList.toggle("is-desktop",resolved==="desktop");
    $$("[data-content-preview-mode]").forEach(btn=>btn.classList.toggle("is-active",btn.dataset.contentPreviewMode===resolved));
    sendContentPreviewDraft();
  }

  function openContentPreview(mode="desktop"){
    $("contentPreviewModal").hidden=false;
    document.body.style.overflow="hidden";
    setContentPreviewMode(mode);
    loadContentPreviewPage();
  }

  function closeContentPreview(){
    $("contentPreviewModal").hidden=true;
    if($("productModal").hidden&&$("orderModal").hidden&&$("manualOrderModal").hidden&&$("globalSearchModal").hidden)document.body.style.overflow="";
  }

  function renderAnalytics() {
    const days=Number($("analyticsRange").value||7);
    const stats=analyticsSnapshot(days);
    $("analyticsViews").textContent=stats.views.length.toLocaleString();
    $("analyticsSessions").textContent=stats.sessions.size.toLocaleString();
    $("analyticsAdds").textContent=stats.adds.length.toLocaleString();
    $("analyticsWhatsApp").textContent=stats.whats.length.toLocaleString();
    $("analyticsViewsSub").textContent=`${days} day period`;
    $("analyticsSessionsSub").textContent=stats.sessions.size?`${(stats.views.length/stats.sessions.size).toFixed(1)} views / session`:"No sessions yet";
    const latestEvent=state.events[0]?.created_at;
    $("analyticsFreshness").textContent=state.analyticsError
      ?"Analytics connection needs attention"
      :latestEvent?`${stats.views.length.toLocaleString()} views · ${stats.sessions.size.toLocaleString()} sessions · Last tracked event ${when(latestEvent)}`:"No tracked website activity yet";
    renderTrafficChart($("analyticsChart"),stats.daily,{views:stats.views.length,sessions:stats.sessions.size});
    renderRankList($("analyticsPages"),rankBy(stats.views,e=>cleanPath(e.page_path)).slice(0,8),"views");
    const productViews=stats.productViews.filter(e=>e.meta?.product_id);
    const ranked=rankBy(productViews,e=>e.meta?.product_id).slice(0,8).map(r=>({...r,label:state.products.find(p=>p.id===r.label)?.nameEn||r.label}));
    renderRankList($("analyticsProducts"),ranked,"product views");

    const start=analyticsStart(days).getTime();
    const periodOrders=state.orders.filter(o=>new Date(o.submitted_at).getTime()>=start);
    const valueOrders=periodOrders.filter(o=>o.status!=="cancelled");
    const orderValue=valueOrders.reduce((sum,o)=>sum+(Number(o.total)||0),0);
    $("analyticsOrders").textContent=periodOrders.length.toLocaleString();
    $("analyticsOrderValue").textContent=money(orderValue);
    $("analyticsAvgOrder").textContent=valueOrders.length?money(orderValue/valueOrders.length):money(0);
    const gifts=periodOrders.filter(o=>o.kind==="gift").length;
    $("analyticsGiftShare").textContent=periodOrders.length?`${Math.round((gifts/periodOrders.length)*100)}%`:"0%";

    const productCounts=new Map();
    for(const order of periodOrders){
      for(const item of Array.isArray(order.items)?order.items:[]){
        const id=item.product_id||item.name||"Item";
        const qty=Number(item.qty)||1;
        const entry=productCounts.get(id)||{label:item.name||state.products.find(p=>p.id===id)?.nameEn||id,value:0};
        entry.value+=qty;productCounts.set(id,entry);
      }
    }
    renderRankList($("analyticsOrderedProducts"),[...productCounts.values()].sort((a,b)=>b.value-a.value).slice(0,8),"items ordered");
    $("intentBreakdown").innerHTML=[
      ["Product views",productViews.length],
      ["Add to pantry",stats.adds.length],
      ["WhatsApp clicks",stats.whats.length],
      ["Searches",stats.searches.length]
    ].map(([label,value])=>`<div class="intent-card"><strong>${value.toLocaleString()}</strong><span>${esc(label)}</span></div>`).join("");
  }

  function renderActivity() {
    const root=$("activityTimeline");
    if(!state.activity.length){root.innerHTML='<p class="empty-state">No owner changes have been logged yet.</p>';return;}
    root.innerHTML=state.activity.map(a=>`<div class="timeline-row"><time>${esc(new Date(a.created_at).toLocaleString([], {month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}))}</time><span class="timeline-marker"></span><div class="timeline-copy"><b>${esc(activityLabel(a))}</b><p>${esc([a.target_type,a.target_id].filter(Boolean).join(" · "))}</p></div></div>`).join("");
  }

  function renderSettings() {
    $("backendDatabase").textContent = state.overrides instanceof Map ? "Connected" : "Unavailable";
    $("backendAnalytics").textContent=state.analyticsError?"Error":"Connected";
    $("backendStorage").textContent="Configured";
    const badge=$("backendStatusBadge");
    const ok=!state.analyticsError;
    badge.textContent=ok?"Connected":"Needs attention";
    badge.className="status-badge "+(ok?"status-live":"status-hidden");
    renderCloudBackups();
  }

  function renderCloudBackups(){
    const root=$("cloudBackupList");
    if(!root)return;
    if(!state.backups.length){root.innerHTML='<p class="empty-state">No cloud backups yet.</p>';return;}
    root.innerHTML=state.backups.slice(0,6).map(b=>`
      <div class="cloud-backup-row">
        <div><b>${esc(b.reason.replace(/_/g," "))}</b><small>${esc(new Date(b.created_at).toLocaleString())}</small></div>
        <div><button type="button" data-download-cloud-backup="${b.id}">Download</button><button type="button" data-restore-cloud-backup="${b.id}">Restore</button></div>
      </div>`).join("");
  }

  function setView(view) {
    state.activeView=view;
    $$(".dashboard-view").forEach(p=>p.classList.toggle("is-active",p.dataset.viewPanel===view));
    $$(".admin-nav button").forEach(b=>b.classList.toggle("is-active",b.dataset.view===view));
    $$("#mobileAdminNav [data-mobile-view]").forEach(b=>b.classList.toggle("is-active",b.dataset.mobileView===view));
    const titles={overview:"Overview",products:"Products",orders:"Orders & history",customers:"Customers",rewards:"Mouneh Points",content:"Website content",analytics:"Analytics",activity:"Activity",settings:"Settings"};
    $("viewTitle").textContent=titles[view]||"Owner Console";
    localizeDom($("viewTitle"));
    closeSidebar();
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function openSidebar(){
    $("adminSidebar").classList.add("is-open");
    $("sidebarBackdrop").hidden=false;
    document.body.classList.add("admin-menu-open");
    $("mobileMenuButton")?.setAttribute("aria-expanded","true");
    $("adminSidebar")?.setAttribute("aria-hidden","false");
    requestAnimationFrame(()=>$("sidebarClose")?.focus({preventScroll:true}));
  }

  function closeSidebar(){
    $("adminSidebar").classList.remove("is-open");
    $("sidebarBackdrop").hidden=true;
    document.body.classList.remove("admin-menu-open");
    $("mobileMenuButton")?.setAttribute("aria-expanded","false");
    $("adminSidebar")?.setAttribute("aria-hidden","true");
  }

  async function handleLogin(e) {
    e.preventDefault();
    const email=$("loginEmail").value.trim().toLowerCase();
    const password=$("loginPassword").value;
    const button=$("loginButton");
    setStatus($("loginStatus"),"Signing in securely…");
    button.disabled=true;
    try{
      const session=await passwordGrant(email,password);
      setStatus($("loginStatus"),"Opening owner dashboard…","success");
      await activateOwnerSession(session,true);
      $("loginPassword").value="";
    }catch(err){
      setStatus($("loginStatus"),err.message||"Sign-in failed.","error");
    }finally{
      button.disabled=false;
    }
  }

  async function handleBootstrap(e) {
    e.preventDefault();
    const name=$("bootstrapName").value.trim()||"Owner";
    const email=$("bootstrapEmail").value.trim().toLowerCase();
    const password=$("bootstrapPassword").value;
    const setupCode=$("bootstrapCode").value.trim();
    if(password.length<12){
      setStatus($("bootstrapStatus"),"Use a password with at least 12 characters.","error");
      return;
    }
    const button=$("bootstrapButton");
    button.disabled=true;
    setStatus($("bootstrapStatus"),"Creating the protected owner account…");
    try{
      const endpoint=cfg.supabaseUrl.replace(/\/$/,"")+"/functions/v1/"+(cfg.bootstrapFunction||"bootstrap-owner");
      const response=await fetch(endpoint,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({email,password,setupCode,label:name})
      });
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.error||"Could not create owner account.");

      setStatus($("bootstrapStatus"),"Owner created. Signing you in…","success");
      const session=await passwordGrant(email,password);
      $("loginEmail").value=email;
      $("loginPassword").value="";
      $("bootstrapPassword").value="";
      $("bootstrapCode").value="";
      await activateOwnerSession(session,true);
      toast("Owner account activated.");
    }catch(err){
      setStatus($("bootstrapStatus"),err.message||"Owner setup failed.","error");
    }finally{
      button.disabled=false;
    }
  }

  async function signOut() {
    clearOwnerSession();
    state.user=null;
    state.membership=null;
    state.client=anonymousClient();
    showOnly("loginScreen");
    setStatus($("loginStatus"),"Signed out.","success");
  }

  async function saveContent(e) {
    e.preventDefault();
    const settings=contentSettingsFromForm();
    const validationError=contentValidationError(settings);
    if(validationError){setStatus($("contentStatus"),validationError,"error");return;}
    const rows=Object.entries(settings).map(([key,value])=>({key,value,updated_by:state.user.id,updated_at:new Date().toISOString()}));
    const button=$("saveContentButton");
    if(button){button.disabled=true;button.textContent="Saving…";}
    setStatus($("contentStatus"),"Saving and publishing…");
    try{
      const {error}=await state.client.from(cfg.tables.settings).upsert(rows,{onConflict:"key"});
      if(error)throw error;
      rows.forEach(row=>state.settings.set(row.key,row.value));
      state.contentDirty=false;
      await logActivity("update_site_content","site_settings","public",{keys:rows.map(r=>r.key)});
      broadcastSiteUpdate("site_settings","public");
      await refreshAll();
      const stamp=new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
      setStatus($("contentStatus"),"Saved, live and synced · "+stamp,"success");
      toast("Website content saved and published.");
      if(!$("contentPreviewModal")?.hidden)sendContentPreviewDraft();
    }catch(err){
      state.contentDirty=true;
      setStatus($("contentStatus"),err.message||"Could not save website content.","error");
    }finally{
      if(button){button.disabled=false;button.textContent="Save website content";}
    }
  }

  function variantRow(v={}) {
    const row=document.createElement("div");
    row.className="variant-row";
    row.innerHTML=`
      <label>Size (EN)<input data-v="sizeEn" value="${esc(v.sizeEn||"")}" placeholder="500 g" required></label>
      <label>Size (AR)<input data-v="sizeAr" value="${esc(v.sizeAr||"")}" placeholder="500 غ" dir="rtl"></label>
      <label>Price (USD)<input data-v="price" type="number" inputmode="decimal" min="0" step="0.01" value="${Number.isFinite(Number(v.price))?esc(v.price):""}" required></label>
      <button type="button" data-remove-variant aria-label="Remove size">×</button>`;
    $("variantRows").appendChild(row);
  }

  function setImageFraming(x=50,y=50,zoom=100) {
    state.imagePosition={
      ...state.imagePosition,
      x:Math.max(0,Math.min(100,Number(x)||50)),
      y:Math.max(0,Math.min(100,Number(y)||50)),
      zoom:Math.max(100,Math.min(180,Number(zoom)||100))
    };
    $("imagePositionX").value=state.imagePosition.x;
    $("imagePositionY").value=state.imagePosition.y;
    $("imageZoom").value=state.imagePosition.zoom;
    $("imagePositionXValue").textContent=`${Math.round(state.imagePosition.x)}%`;
    $("imagePositionYValue").textContent=`${Math.round(state.imagePosition.y)}%`;
    $("imageZoomValue").textContent=`${Math.round(state.imagePosition.zoom)}%`;
    applyPreviewFraming();
  }

  function applyPreviewFraming() {
    const img=$("imagePreview").querySelector("img");
    if(!img)return;
    const {x,y,zoom,rotation,fit,preview}=state.imagePosition;
    img.style.objectPosition=`${x}% ${y}%`;
    img.style.objectFit=fit||"cover";
    img.style.transform=`rotate(${rotation||0}deg) scale(${zoom/100})`;
    img.style.transformOrigin=`${x}% ${y}%`;
    $("imagePreview").classList.toggle("is-modal-preview",preview==="modal");
    $$("[data-image-fit]").forEach(btn=>btn.classList.toggle("is-active",btn.dataset.imageFit===fit));
    $$("[data-image-preview]").forEach(btn=>btn.classList.toggle("is-active",btn.dataset.imagePreview===preview));
  }

  function setImageRemoved(removed) {
    $("imageRemoved").value=removed?"1":"0";
    $("imagePositionControls").classList.toggle("is-disabled",removed);
    $("removeProductImage").disabled=removed||!$("imagePreview").querySelector("img");
  }

  function openProductEditor(id=null) {
    state.editingId=id;
    state.imageFile=null; state.imageDims=null;
    if(state.previewObjectUrl){URL.revokeObjectURL(state.previewObjectUrl);state.previewObjectUrl=null;}
    $("productForm").reset();
    $("variantRows").innerHTML="";
    setStatus($("productFormStatus"),"");
    const p=id?state.products.find(x=>x.id===id):null;
    $("productEditorTitle").textContent=p?"Edit product":"Add product";
    $("productEditorKicker").textContent=p?(p.__source==="base"?"Base catalogue product":"Dashboard-managed product"):"New catalogue product";
    $("productEditingId").value=id||"";
    $("productId").value=p?.id||"";
    $("productId").disabled=!!p;
    $("productNameEn").value=p?.nameEn||"";
    $("productNameAr").value=p?.nameAr||"";
    $("productOriginal").value=p?.original||"";
    if(p?.category && [...$("productCategory").options].some(o=>o.value===p.category)) $("productCategory").value=p.category;
    else $("productCategory").selectedIndex=0;
    (p?.variants?.length?p.variants:[{}]).forEach(variantRow);
    const status=p?.__status||"live";
    const radio=document.querySelector(`input[name="productVisibility"][value="${status==="draft"?"draft":status==="hidden"?"hidden":"live"}"]`);
    if(radio)radio.checked=true;
    const photo=p?photoFor(p):null;
    $("existingImageUrl").value=photo?.url||"";
    $("existingImageWidth").value=photo?.width||"";
    $("existingImageHeight").value=photo?.height||"";
    renderImagePreview(photo?.url||"");
    state.imagePosition.rotation=Number(photo?.rotation)||0;
    state.imagePosition.fit=photo?.fit==="contain"?"contain":"cover";
    state.imagePosition.preview="card";
    setImageFraming(photo?.positionX??50,photo?.positionY??50,photo?.zoom??100);
    setImageRemoved(!!p?.photoRemoved || !photo);
    const availability=availabilityFor(p||{});
    const availabilityRadio=document.querySelector(`input[name="productAvailability"][value="${availability}"]`);
    if(availabilityRadio)availabilityRadio.checked=true;
    $("productPrivateNote").value=p?state.notes.get(`product:${p.id}`)?.note||"":"";
    loadProductRevisions(id);
    $("deleteProductButton").hidden=!p;
    $("hideProductButton").hidden=!p||status==="hidden";
    $("restoreProductButton").hidden=!p||!state.overrides.has(p.id);
    $("productModal").hidden=false;
    document.body.style.overflow="hidden";
  }

  function closeProductEditor() {
    $("productModal").hidden=true; 
    if($("orderModal").hidden)document.body.style.overflow="";
    state.editingId=null; state.imageFile=null; state.imageDims=null;
    if(state.previewObjectUrl){URL.revokeObjectURL(state.previewObjectUrl);state.previewObjectUrl=null;}
  }

  function renderImagePreview(url) {
    $("imagePreview").innerHTML=url?`<img src="${esc(url)}" alt="Product preview" draggable="false">`:"<span>No photo</span>";
    applyPreviewFraming();
  }

  async function inspectImage(file) {
    return new Promise((resolve,reject)=>{
      const img=new Image(), url=URL.createObjectURL(file);
      img.onload=()=>{resolve({width:img.naturalWidth,height:img.naturalHeight,url});};
      img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("Could not read image."));};
      img.src=url;
    });
  }

  async function onImageSelected() {
    const file=$("productImage").files?.[0];
    if(!file)return;
    if(file.size>10*1024*1024){toast("Image is larger than 10 MB.","error");$("productImage").value="";return;}
    try{
      const dims=await inspectImage(file);
      if(state.previewObjectUrl)URL.revokeObjectURL(state.previewObjectUrl);
      state.previewObjectUrl=dims.url;
      state.imageFile=file; state.imageDims={width:dims.width,height:dims.height};
      $("imageRemoved").value="0";
      setImageFraming(50,50,100);
      renderImagePreview(dims.url);
      setImageRemoved(false);
    }catch(err){toast(err.message,"error");}
  }

  function removeProductPhoto() {
    state.imageFile=null; state.imageDims=null;
    $("productImage").value="";
    if(state.previewObjectUrl){URL.revokeObjectURL(state.previewObjectUrl);state.previewObjectUrl=null;}
    $("existingImageUrl").value="";
    $("existingImageWidth").value="";
    $("existingImageHeight").value="";
    renderImagePreview("");
    setImageFraming(50,50,100);
    setImageRemoved(true);
    toast("Photo removed. Save the product to publish this change.");
  }

  function resetImageFraming() {
    state.imagePosition.rotation=0;
    state.imagePosition.fit="cover";
    state.imagePosition.preview="card";
    setImageFraming(50,50,100);
  }

  function rotateImage(delta){
    state.imagePosition.rotation=((Number(state.imagePosition.rotation)||0)+delta+360)%360;
    applyPreviewFraming();
  }

  function setImageFit(fit){
    state.imagePosition.fit=fit==="contain"?"contain":"cover";
    applyPreviewFraming();
  }

  function setImagePreviewMode(mode){
    state.imagePosition.preview=mode==="modal"?"modal":"card";
    applyPreviewFraming();
  }

  function updateFramingFromControls() {
    setImageFraming($("imagePositionX").value,$("imagePositionY").value,$("imageZoom").value);
  }

  function positionPreviewFromPointer(e) {
    const preview=$("imagePreview");
    if(!preview.querySelector("img")||$("imageRemoved").value==="1")return;
    const rect=preview.getBoundingClientRect();
    const x=((e.clientX-rect.left)/rect.width)*100;
    const y=((e.clientY-rect.top)/rect.height)*100;
    setImageFraming(x,y,state.imagePosition.zoom);
  }

  function bindImageDrag() {
    const preview=$("imagePreview");
    preview.addEventListener("pointerdown",e=>{
      if(!preview.querySelector("img"))return;
      preview.setPointerCapture?.(e.pointerId);
      preview.dataset.dragging="1";
      positionPreviewFromPointer(e);
    });
    preview.addEventListener("pointermove",e=>{
      if(preview.dataset.dragging==="1")positionPreviewFromPointer(e);
    });
    const stop=e=>{
      preview.dataset.dragging="";
      try{preview.releasePointerCapture?.(e.pointerId);}catch{}
    };
    preview.addEventListener("pointerup",stop);
    preview.addEventListener("pointercancel",stop);
  }

  function collectVariants(productId) {
    return $$(".variant-row").map((row,i)=>{
      const sizeEn=row.querySelector('[data-v="sizeEn"]').value.trim();
      const sizeAr=row.querySelector('[data-v="sizeAr"]').value.trim()||sizeEn;
      const price=Number(row.querySelector('[data-v="price"]').value);
      if(!sizeEn||!Number.isFinite(price)||price<0)throw new Error("Every size needs a name and valid price.");
      return {id:`${productId}-${slugify(sizeEn)||i+1}`,sizeEn,sizeAr,price};
    });
  }

  async function uploadProductImage(productId) {
    if($("imageRemoved").value==="1")return null;
    const framing={
      positionX:Math.round(state.imagePosition.x),
      positionY:Math.round(state.imagePosition.y),
      zoom:Math.round(state.imagePosition.zoom),
      rotation:Number(state.imagePosition.rotation)||0,
      fit:state.imagePosition.fit==="contain"?"contain":"cover"
    };
    if(!state.imageFile) {
      const url=$("existingImageUrl").value;
      return url?{url,width:Number($("existingImageWidth").value)||1200,height:Number($("existingImageHeight").value)||1200,...framing}:null;
    }
    const ext=(state.imageFile.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"");
    const path=`products/${productId}/${Date.now()}-${slugify(state.imageFile.name.replace(/\.[^.]+$/,""))||"image"}.${ext}`;
    const {error}=await state.client.storage.from(cfg.storageBucket).upload(path,state.imageFile,{cacheControl:"31536000",upsert:false,contentType:state.imageFile.type});
    if(error)throw error;
    const {data}=state.client.storage.from(cfg.storageBucket).getPublicUrl(path);
    return {url:data.publicUrl,width:state.imageDims?.width||1200,height:state.imageDims?.height||1200,path,...framing};
  }

  async function saveProduct(e) {
    e.preventDefault();
    const originalId=state.editingId;
    const id=originalId||slugify($("productId").value||$("productNameEn").value);
    if(!id) return setStatus($("productFormStatus"),"A product ID is required.","error");
    if(!originalId && (baseById.has(id)||state.overrides.has(id))) return setStatus($("productFormStatus"),"That product ID already exists.","error");
    $("saveProductButton").disabled=true;
    setStatus($("productFormStatus"),state.imageFile?"Uploading image…":"Saving…");
    try{
      let category=$("productCategory").value;
      if(category==="__new"){
        category=await addCategory();
        if(!category)throw new Error("Category is required.");
      }
      const variants=collectVariants(id);
      const image=await uploadProductImage(id);
      const visibility=document.querySelector('input[name="productVisibility"]:checked')?.value||"live";
      const availability=document.querySelector('input[name="productAvailability"]:checked')?.value||"in_stock";
      const previous=originalId?state.products.find(p=>p.id===originalId):null;
      if(previous)await saveProductRevision(previous,"edit");
      const payload={
        id,category,
        nameEn:$("productNameEn").value.trim(),
        nameAr:$("productNameAr").value.trim(),
        original:$("productOriginal").value.trim()||$("productNameEn").value.trim().toUpperCase(),
        variants,status:visibility,availability,
        photoRemoved:$("imageRemoved").value==="1",
        image:image||null
      };
      const row={product_id:id,action:"upsert",payload,updated_at:new Date().toISOString(),updated_by:state.user.id};
      const {error}=await state.client.from(cfg.tables.products).upsert(row,{onConflict:"product_id"});
      if(error)throw error;
      await upsertAdminNote("product",id,$("productPrivateNote").value.trim());
      await logActivity(originalId?"update_product":"create_product","product",id,{status:visibility,availability,category});
      toast(originalId?"Product updated.":"Product added.");
      closeProductEditor();
      await refreshAll();
    }catch(err){
      setStatus($("productFormStatus"),err.message||"Could not save product.","error");
      toast(err.message||"Could not save product.","error");
    }finally{$("saveProductButton").disabled=false;}
  }

  async function loadProductRevisions(productId){
    const panel=$("productHistoryPanel"),root=$("productRevisionList");
    if(!productId){panel.hidden=true;root.innerHTML="";return;}
    const {data,error}=await state.client.from(cfg.tables.revisions||"product_revisions")
      .select("*").eq("product_id",productId).order("created_at",{ascending:false}).limit(8);
    if(error||!data?.length){panel.hidden=true;root.innerHTML="";return;}
    panel.hidden=false;
    root.innerHTML=data.map(r=>`<button type="button" data-restore-revision="${r.id}"><span><b>${esc(r.reason.replace(/_/g," "))}</b><small>${esc(new Date(r.created_at).toLocaleString())}</small></span><em>Restore</em></button>`).join("");
  }

  async function restoreProductRevision(revisionId){
    const {data,error}=await state.client.from(cfg.tables.revisions||"product_revisions").select("*").eq("id",revisionId).single();
    if(error||!data)return toast("Could not load that version.","error");
    await createCloudBackup("before_revision_restore",true);
    const current=state.products.find(p=>p.id===data.product_id);
    if(current)await saveProductRevision(current,"before_restore");
    const snapshot=clone(data.snapshot||{});
    const {error:saveError}=await state.client.from(cfg.tables.products).upsert({
      product_id:data.product_id,action:"upsert",payload:snapshot,
      updated_at:new Date().toISOString(),updated_by:state.user.id
    },{onConflict:"product_id"});
    if(saveError)return toast("Could not restore product version.","error");
    await logActivity("restore_product_revision","product",data.product_id,{revision_id:revisionId});
    closeProductEditor();toast("Previous product version restored.");await refreshAll();
  }
  async function hideCurrentProduct() {
    const id=state.editingId;if(!id)return;
    const p=state.products.find(x=>x.id===id);if(!p)return;
    await saveProductRevision(p,"hide");
    const existing=state.overrides.get(id);
    const payload={...clone(p),status:"hidden"};
    delete payload.__status;delete payload.__source;delete payload.__updated;
    const {error}=await state.client.from(cfg.tables.products).upsert({product_id:id,action:"upsert",payload,updated_at:new Date().toISOString(),updated_by:state.user.id},{onConflict:"product_id"});
    if(error){toast(error.message,"error");return;}
    await logActivity("hide_product","product",id,{});
    closeProductEditor();toast("Product hidden from customers.");await refreshAll();
  }

  async function restoreCurrentProduct() {
    const id=state.editingId;if(!id||!state.overrides.has(id))return;
    if(!baseById.has(id)){
      toast("New dashboard products cannot be restored to a base version.","error");return;
    }
    const {error}=await state.client.from(cfg.tables.products).delete().eq("product_id",id);
    if(error){toast(error.message,"error");return;}
    await logActivity("restore_base_product","product",id,{});
    closeProductEditor();toast("Base catalogue version restored.");await refreshAll();
  }

  async function deleteCurrentProduct() {
    const id=state.editingId;
    if(!id)return;
    const product=state.products.find(p=>p.id===id);
    if(!product)return;
    const question=state.lang==="ar"?translatePhrase("Delete this product permanently? This cannot be undone."):"Delete this product permanently? This cannot be undone.";
    if(!window.confirm(question))return;
    await createCloudBackup("before_delete_product",true);
    await saveProductRevision(product,"delete");

    const button=$("deleteProductButton");
    button.disabled=true;
    try{
      let error=null;
      if(baseById.has(id)){
        const result=await state.client.from(cfg.tables.products).upsert({
          product_id:id,
          action:"hide",
          payload:{id,status:"hidden",deleted:true},
          updated_at:new Date().toISOString(),
          updated_by:state.user.id
        },{onConflict:"product_id"});
        error=result.error;
      }else{
        const result=await state.client.from(cfg.tables.products).delete().eq("product_id",id);
        error=result.error;
      }
      if(error)throw error;

      if(product.image?.path){
        await state.client.storage.from(cfg.storageBucket).remove([product.image.path]).catch(()=>{});
      }
      await logActivity("delete_product","product",id,{name:product.nameEn||product.nameAr||id});
      closeProductEditor();
      toast(state.lang==="ar"?translatePhrase("Product deleted."):"Product deleted.");
      await refreshAll();
    }catch(err){
      toast(state.lang==="ar"?translatePhrase("Could not delete product."):"Could not delete product.","error");
    }finally{
      button.disabled=false;
    }
  }

  async function logActivity(action,targetType,targetId,details={}) {
    if(!state.user)return;
    const row={actor:state.user.id,action,target_type:targetType,target_id:targetId,details};
    const {error}=await state.client.from(cfg.tables.activity).insert(row);
    if(error) console.warn("Activity log:",error.message);
    if(["product","category","site_settings"].includes(targetType))broadcastSiteUpdate(targetType,targetId);
  }

  function applyHealthFilter(type) {
    state.productFilter.q="";
    state.productFilter.category="";
    state.productFilter.status=type;
    state.productFilter.availability="";
    if($("productSearch"))$("productSearch").value="";
    if($("productCategoryFilter"))$("productCategoryFilter").value="";
    if($("productStatusFilter"))$("productStatusFilter").value=type;
    if($("productAvailabilityFilter"))$("productAvailabilityFilter").value="";
    setView("products");
    renderProducts();
    requestAnimationFrame(()=>$("productResultCount")?.scrollIntoView({block:"center",behavior:"smooth"}));
  }

  async function runHealthCheck() {
    const badge=$("backendStatusBadge");
    badge.textContent="Checking";badge.className="status-badge";
    const [db,storage,analytics]=await Promise.all([
      state.client.from(cfg.tables.products).select("product_id",{head:true,count:"exact"}).limit(1),
      state.client.storage.from(cfg.storageBucket).list("",{limit:1}),
      state.client.from(cfg.tables.events).select("id",{head:true,count:"exact"}).limit(1)
    ]);
    $("backendDatabase").textContent=db.error?"Error":"Connected";
    $("backendStorage").textContent=storage.error?"Error":"Connected";
    $("backendAnalytics").textContent=analytics.error?"Error":"Connected";
    state.analyticsError=analytics.error||null;
    const ok=!db.error&&!storage.error&&!analytics.error;
    badge.textContent=ok?"Healthy":"Needs attention";badge.className="status-badge "+(ok?"status-live":"status-hidden");
    toast(ok?"Backend health check passed.":"One backend service needs attention.",ok?"":"error");
  }


  function exportStamp() {
    return new Date().toISOString().slice(0,10);
  }

  function requireXlsx() {
    if(!window.XLSX){
      toast("Excel tools could not load. Refresh once or use CSV as a fallback.","error");
      return false;
    }
    return true;
  }

  function productSpreadsheetRows() {
    const categories=new Map(categoryRecords().map(c=>[c.en,c]));
    const rows=[];
    for(const p of state.products){
      const photo=photoFor(p)||{};
      const category=categories.get(p.category)||{en:p.category||"",ar:AR_TRANSLATIONS[p.category]||""};
      const visibility=["hidden","draft"].includes(p.__status)?p.__status:"live";
      const note=state.notes.get(`product:${p.id}`)?.note||"";
      const variants=Array.isArray(p.variants)&&p.variants.length?p.variants:[{}];
      const photoStatus=photo?.url?"Has photo":"Missing photo";
      const completeness=productQualityScore(p);
      const orderable=visibility==="live"&&availabilityFor(p)==="in_stock"?"Yes":"No";
      const source=p.__source==="new"?"New in dashboard":p.__source==="edited"?"Edited in dashboard":"Base catalogue";
      variants.forEach(v=>rows.push({
        "Product ID":p.id,
        "English Name":p.nameEn||"",
        "Arabic Name":p.nameAr||"",
        "Category":category.en||"",
        "Category Arabic":category.ar||"",
        "Availability":availabilityFor(p),
        "Visibility":visibility,
        "Orderable":orderable,
        "Completeness %":completeness,
        "Variant ID":v.id||"",
        "Size EN":v.sizeEn||"",
        "Size AR":v.sizeAr||"",
        "Price USD":Number.isFinite(Number(v.price))?Number(v.price):"",
        "Photo Status":photoStatus,
        "Photo URL":photo.url||"",
        "Photo Position X":Number(photo.positionX??50),
        "Photo Position Y":Number(photo.positionY??50),
        "Photo Zoom":Number(photo.zoom??100),
        "Photo Rotation":Number(photo.rotation??0),
        "Photo Fit":photo.fit==="contain"?"contain":"cover",
        "Original / Supplier Name":p.original||"",
        "Record Source":source,
        "Last Updated":p.__updated||"",
        "Private Note":note
      }));
    }
    return rows;
  }

  function orderSpreadsheetRows() {
    return state.orders.map(order=>{
      const items=Array.isArray(order.items)?order.items:[];
      return {
        "Order Code":order.reference,
        "Type":order.kind,
        "Status":order.status,
        "Customer":order.customer_name||order.extra?.recipient||"",
        "Phone / WhatsApp":order.customer_phone||"",
        "Area":order.area||"",
        "Item Lines":items.length,
        "Total Quantity":items.reduce((sum,i)=>sum+(Number(i.qty)||1),0),
        "Items":items.map(i=>`${Number(i.qty)||1}× ${i.name||i.product_id||"Item"}${i.size?` (${i.size})`:""}`).join(" | "),
        "Order Total USD":Number(order.total)||0,
        "Customer Notes":order.notes||"",
        "Private Owner Note":order.private_notes||state.notes.get(`order:${order.reference}`)?.note||"",
        "Language":order.language||"",
        "Submitted At":order.submitted_at||"",
        "Confirmed At":order.confirmed_at||"",
        "Out For Delivery At":order.out_for_delivery_at||"",
        "Delivered At":order.delivered_at||"",
        "Cancelled At":order.cancelled_at||"",
        "Items JSON":JSON.stringify(items)
      };
    });
  }

  function customerSpreadsheetRows() {
    return customerGroups().sort((a,b)=>new Date(b.last)-new Date(a.last)).map(c=>({
      "Customer":c.name||"",
      "Phone / WhatsApp":c.phone||"",
      "Area":c.area||"",
      "Orders":c.orders.length,
      "Total Spend USD":Number(c.total)||0,
      "Average Order USD":c.orders.length?(Number(c.total)||0)/c.orders.length:0,
      "Last Order":c.last||"",
      "Latest Order Code":c.orders.slice().sort((a,b)=>new Date(b.submitted_at)-new Date(a.submitted_at))[0]?.reference||""
    }));
  }

  function categorySpreadsheetRows() {
    return categoryRecords().map(c=>({
      "Category":c.en,
      "Category Arabic":c.ar||AR_TRANSLATIONS[c.en]||"",
      "Products":state.products.filter(p=>p.category===c.en).length
    }));
  }

  function settingsSpreadsheetRows() {
    return [...state.settings.entries()].map(([key,value])=>({
      "Setting":key,
      "Value JSON":JSON.stringify(value)
    }));
  }

  function notesSpreadsheetRows() {
    return [...state.notes.values()].map(n=>({
      "Type":n.subject_type,
      "ID":n.subject_id,
      "Private Note":n.note||"",
      "Updated At":n.updated_at||""
    }));
  }

  function analyticsSpreadsheetRows(days=30) {
    const stats=analyticsSnapshot(days);
    return stats.daily.map(day=>{
      const start=day.date;
      const end=new Date(start);end.setDate(start.getDate()+1);
      const dayEvents=stats.events.filter(e=>{
        const t=new Date(e.created_at);
        return t>=start&&t<end;
      });
      return {
        "Date":day.date.toLocaleDateString(undefined,{year:"numeric",month:"2-digit",day:"2-digit"}),
        "Page Views":day.views,
        "Sessions":day.sessions,
        "WhatsApp Clicks":dayEvents.filter(e=>e.event_name==="whatsapp_click").length,
        "Add to Pantry":dayEvents.filter(e=>e.event_name==="add_to_cart").length,
        "Product Views":dayEvents.filter(e=>e.event_name==="product_view").length,
        "Searches":dayEvents.filter(e=>e.event_name==="search").length
      };
    });
  }

  function topPageSpreadsheetRows(days=30) {
    const stats=analyticsSnapshot(days);
    return rankBy(stats.views,e=>cleanPath(e.page_path)).map(row=>({
      "Page":row.label,
      "Views":row.value
    }));
  }

  function ownerSummaryRows() {
    const s7=analyticsSnapshot(7),s30=analyticsSnapshot(30);
    const live=state.products.filter(p=>!["hidden","draft"].includes(p.__status));
    return [
      {"Metric":"Exported at","Value":new Date().toLocaleString()},
      {"Metric":"Total products","Value":state.products.length},
      {"Metric":"Live catalogue","Value":live.length},
      {"Metric":"Hidden products","Value":state.products.filter(p=>p.__status==="hidden").length},
      {"Metric":"Draft products","Value":state.products.filter(p=>p.__status==="draft").length},
      {"Metric":"In stock","Value":live.filter(p=>availabilityFor(p)==="in_stock").length},
      {"Metric":"Out of stock","Value":live.filter(p=>availabilityFor(p)==="out_of_stock").length},
      {"Metric":"Coming soon","Value":live.filter(p=>availabilityFor(p)==="coming_soon").length},
      {"Metric":"Categories","Value":categoryRecords().length},
      {"Metric":"Orders · all history","Value":state.orders.length},
      {"Metric":"Orders · new","Value":state.orders.filter(o=>o.status==="new").length},
      {"Metric":"Orders · delivered","Value":state.orders.filter(o=>o.status==="delivered").length},
      {"Metric":"Customers","Value":customerGroups().length},
      {"Metric":"Page views · 7 days","Value":s7.views.length},
      {"Metric":"Sessions · 7 days","Value":s7.sessions.size},
      {"Metric":"WhatsApp clicks · 7 days","Value":s7.whats.length},
      {"Metric":"Page views · 30 days","Value":s30.views.length},
      {"Metric":"Sessions · 30 days","Value":s30.sessions.size}
    ];
  }

  function appendWorkbookSheet(workbook,name,rows) {
    const safeRows=Array.isArray(rows)&&rows.length?rows:[{"No data":""}];
    const sheet=window.XLSX.utils.json_to_sheet(safeRows);
    const headers=Object.keys(safeRows[0]||{});
    sheet["!cols"]=headers.map(header=>{
      let width=header.length+2;
      for(const row of safeRows.slice(0,150)){
        const text=safeText(row?.[header]).replace(/[\r\n]+/g," ");
        width=Math.max(width,Math.min(38,text.length+2));
      }
      return {wch:Math.max(10,Math.min(38,width))};
    });
    if(sheet["!ref"])sheet["!autofilter"]={ref:sheet["!ref"]};
    window.XLSX.utils.book_append_sheet(workbook,sheet,name.slice(0,31));
  }

  function productSpreadsheetInstructions() {
    return [
      {"Field":"Workflow","What to do":"Export Products → edit the Products sheet → upload the edited file in Import / Export Center."},
      {"Field":"Product ID","What to do":"Do not change this for an existing product. It is the stable key used to match updates."},
      {"Field":"Availability","What to do":"Use only: in_stock, out_of_stock, coming_soon."},
      {"Field":"Visibility","What to do":"Use only: live, draft, hidden."},
      {"Field":"Variants","What to do":"Keep one row per size/price. Products with multiple sizes use multiple rows with the same Product ID."},
      {"Field":"Price USD","What to do":"Use numbers only, e.g. 4.50."},
      {"Field":"Category","What to do":"Existing or new category name. Category Arabic is optional but recommended for new categories."},
      {"Field":"Photos","What to do":"Photo URL/framing columns can be left unchanged. Blank Photo URL keeps the current product photo."},
      {"Field":"Safety","What to do":"Import never deletes products omitted from the file. A cloud backup is created before applying an import."}
    ];
  }

  function downloadWorkbook(filename,sheets) {
    if(!requireXlsx())return;
    const workbook=window.XLSX.utils.book_new();
    for(const [name,rows] of sheets)appendWorkbookSheet(workbook,name,rows);
    const bytes=window.XLSX.write(workbook,{bookType:"xlsx",type:"array",compression:true});
    downloadBlob(filename,new Blob([bytes],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}));
  }

  function exportData(dataset,format) {
    const stamp=exportStamp();
    const products=productSpreadsheetRows();
    const orders=orderSpreadsheetRows();
    const customers=customerSpreadsheetRows();
    const categories=categorySpreadsheetRows();
    const analytics=analyticsSpreadsheetRows(30);
    const topPages=topPageSpreadsheetRows(30);
    const summary=ownerSummaryRows();

    if(dataset==="products"){
      if(format==="csv")downloadCsv(`zwm-products-${stamp}.csv`,products);
      else downloadWorkbook(`zwm-products-${stamp}.xlsx`,[
        ["Products",products],
        ["Categories",categories],
        ["How to Edit",productSpreadsheetInstructions()]
      ]);
      return;
    }
    if(dataset==="orders"){
      if(format==="csv")downloadCsv(`zwm-orders-${stamp}.csv`,orders);
      else downloadWorkbook(`zwm-orders-${stamp}.xlsx`,[["Orders",orders],["Summary",summary]]);
      return;
    }
    if(dataset==="customers"){
      if(format==="csv")downloadCsv(`zwm-customers-${stamp}.csv`,customers);
      else downloadWorkbook(`zwm-customers-${stamp}.xlsx`,[["Customers",customers],["Summary",summary]]);
      return;
    }
    if(dataset==="analytics"){
      if(format==="csv")downloadCsv(`zwm-analytics-30-days-${stamp}.csv`,analytics);
      else downloadWorkbook(`zwm-analytics-30-days-${stamp}.xlsx`,[
        ["Analytics · 30 days",analytics],
        ["Top Pages",topPages],
        ["Summary",summary]
      ]);
      return;
    }
    if(dataset==="report"){
      downloadWorkbook(`zwm-owner-report-${stamp}.xlsx`,[
        ["Summary",summary],
        ["Orders",orders],
        ["Products",products],
        ["Customers",customers],
        ["Analytics · 30 days",analytics],
        ["Top Pages",topPages],
        ["Categories",categories],
        ["Settings",settingsSpreadsheetRows()],
        ["Private Notes",notesSpreadsheetRows()],
        ["How to Edit Products",productSpreadsheetInstructions()]
      ]);
      return;
    }
    if(dataset==="backup"){
      if(format==="json"){
        exportBackup();
      }else{
        downloadWorkbook(`zwm-readable-backup-${stamp}.xlsx`,[
          ["Summary",summary],
          ["Products",products],
          ["Orders",orders],
          ["Customers",customers],
          ["Categories",categories],
          ["Settings",settingsSpreadsheetRows()],
          ["Private Notes",notesSpreadsheetRows()],
          ["Analytics · 30 days",analytics],
          ["How to Edit Products",productSpreadsheetInstructions()]
        ]);
      }
    }
  }

  function openDataCenter(dataset="") {
    $("dataCenterModal").hidden=false;
    document.body.style.overflow="hidden";
    if(dataset){
      const button=document.querySelector(`[data-export-dataset="${dataset}"]`);
      button?.closest("article")?.scrollIntoView({block:"center",behavior:"smooth"});
    }
  }

  function closeDataCenter() {
    $("dataCenterModal").hidden=true;
    document.body.classList.remove("mobile-more-open");
    clearProductImport();
    if($("productModal").hidden&&$("orderModal").hidden&&$("manualOrderModal").hidden&&$("globalSearchModal").hidden&&$("contentPreviewModal").hidden){
      document.body.style.overflow="";
    }
  }

  function normalizeImportKey(key) {
    return safeText(key).trim().toLowerCase().replace(/[^a-z0-9]+/g,"");
  }

  function importValue(row,names) {
    const map=new Map(Object.entries(row||{}).map(([k,v])=>[normalizeImportKey(k),v]));
    for(const name of names){
      const value=map.get(normalizeImportKey(name));
      if(value!==undefined&&value!==null)return value;
    }
    return "";
  }

  function normalizeAvailability(value) {
    const v=safeText(value).trim().toLowerCase().replace(/[\s-]+/g,"_");
    if(["in_stock","instock","available","متوفر"].includes(v))return "in_stock";
    if(["out_of_stock","outofstock","unavailable","غير_متوفر","غيرمتوفر"].includes(v))return "out_of_stock";
    if(["coming_soon","comingsoon","soon","قريباً","قريبا"].includes(v))return "coming_soon";
    return "";
  }

  function normalizeVisibility(value) {
    const v=safeText(value).trim().toLowerCase();
    if(["live","visible","published","منشور"].includes(v))return "live";
    if(["draft","مسودة"].includes(v))return "draft";
    if(["hidden","مخفي"].includes(v))return "hidden";
    return "";
  }

  function prepareProductImport(rows,fileName="") {
    const groups=new Map();
    const globalIssues=[];
    rows.forEach((row,rowIndex)=>{
      const id=safeText(importValue(row,["Product ID","ID","product_id"])).trim();
      if(!id){globalIssues.push(`Row ${rowIndex+2}: Product ID is required.`);return;}
      if(!/^[A-Za-z0-9][A-Za-z0-9._-]{0,179}$/.test(id)){
        globalIssues.push(`Row ${rowIndex+2}: Product ID "${id}" contains unsupported characters.`);
        return;
      }
      if(!groups.has(id))groups.set(id,{id,rows:[],issues:[],result:"Ready"});
      groups.get(id).rows.push({...row,__rowNumber:rowIndex+2});
    });

    const prepared=[];
    const categoryUpdates=new Map(storedCategoryRecords().map(c=>[c.en,c]));
    for(const group of groups.values()){
      const existing=state.products.find(p=>p.id===group.id)||null;
      const first=group.rows[0];
      const nameEn=safeText(importValue(first,["English Name","Name EN","nameEn"])).trim()||existing?.nameEn||"";
      const nameAr=safeText(importValue(first,["Arabic Name","Name AR","nameAr"])).trim()||existing?.nameAr||"";
      const category=safeText(importValue(first,["Category"])).trim()||existing?.category||"";
      const categoryAr=safeText(importValue(first,["Category Arabic","Arabic Category"])).trim();
      const original=safeText(importValue(first,["Original / Supplier Name","Original","Supplier Name"])).trim()||existing?.original||nameEn.toUpperCase();
      const availability=normalizeAvailability(importValue(first,["Availability"]))||availabilityFor(existing||{});
      const visibility=normalizeVisibility(importValue(first,["Visibility","Status"]))||(["hidden","draft"].includes(existing?.__status)?existing.__status:"live");
      const note=safeText(importValue(first,["Private Note","Owner Note"]));
      const photoUrl=safeText(importValue(first,["Photo URL","Image URL"])).trim();

      if(!nameEn&&!nameAr)group.issues.push("English or Arabic product name is required.");
      if(!category)group.issues.push("Category is required.");
      if(category&&categoryAr)categoryUpdates.set(category,{en:category,ar:categoryAr});

      const variants=[];
      const variantIds=new Set();
      for(const [index,row] of group.rows.entries()){
        const sizeEn=safeText(importValue(row,["Size EN","Size","English Size"])).trim();
        const sizeAr=safeText(importValue(row,["Size AR","Arabic Size"])).trim();
        const rawPrice=importValue(row,["Price USD","Price","USD"]);
        const price=Number(rawPrice);
        let variantId=safeText(importValue(row,["Variant ID","Size ID"])).trim();
        if(!variantId)variantId=`${group.id}-${slugify(sizeEn||sizeAr||String(index+1))||index+1}`;
        if(!sizeEn&&!sizeAr)group.issues.push(`Row ${row.__rowNumber}: size is required.`);
        if(rawPrice===""||!Number.isFinite(price)||price<0)group.issues.push(`Row ${row.__rowNumber}: valid Price USD is required.`);
        if(variantIds.has(variantId))group.issues.push(`Duplicate Variant ID "${variantId}".`);
        variantIds.add(variantId);
        if((sizeEn||sizeAr)&&Number.isFinite(price)&&price>=0)variants.push({id:variantId,sizeEn,sizeAr,price});
      }
      if(!variants.length)group.issues.push("At least one valid size/price row is required.");

      const currentPhoto=existing?photoFor(existing):null;
      let image=existing?.image?clone(existing.image):null;
      if(photoUrl){
        image={
          url:photoUrl,
          width:Number(importValue(first,["Photo Width"]))||image?.width||1200,
          height:Number(importValue(first,["Photo Height"]))||image?.height||1200,
          positionX:Math.max(0,Math.min(100,Number(importValue(first,["Photo Position X"]))||currentPhoto?.positionX||50)),
          positionY:Math.max(0,Math.min(100,Number(importValue(first,["Photo Position Y"]))||currentPhoto?.positionY||50)),
          zoom:Math.max(100,Math.min(180,Number(importValue(first,["Photo Zoom"]))||currentPhoto?.zoom||100)),
          rotation:Number(importValue(first,["Photo Rotation"]))||currentPhoto?.rotation||0,
          fit:safeText(importValue(first,["Photo Fit"])).trim().toLowerCase()==="contain"?"contain":"cover"
        };
      }

      const payload={
        id:group.id,
        nameEn,nameAr,category,original,variants,
        status:visibility,availability,
        photoRemoved:existing?.photoRemoved||false,
        image
      };
      prepared.push({
        id:group.id,
        payload,
        note,
        categoryAr,
        existing:!!existing,
        issues:[...new Set(group.issues)]
      });
    }

    const issues=[...globalIssues,...prepared.flatMap(p=>p.issues.map(issue=>`${p.id}: ${issue}`))];
    return {fileName,products:prepared,categories:[...categoryUpdates.values()],issues};
  }

  function renderProductImportPreview() {
    const data=state.productImport;
    const panel=$("importPreviewPanel");
    if(!data){panel.hidden=true;return;}
    panel.hidden=false;
    const valid=data.products.filter(p=>!p.issues.length);
    $("importProductCount").textContent=data.products.length;
    $("importValidCount").textContent=valid.length;
    $("importIssueCount").textContent=data.issues.length;
    $("importIssueList").innerHTML=data.issues.length
      ? `<div class="import-issues-box"><b>Fix these before importing</b>${data.issues.slice(0,30).map(x=>`<span>${esc(x)}</span>`).join("")}${data.issues.length>30?`<span>+${data.issues.length-30} more issues</span>`:""}</div>`
      : '<div class="import-ready-box">✓ File is ready to import.</div>';
    $("importPreviewBody").innerHTML=data.products.slice(0,40).map(p=>`<tr>
      <td>${esc(p.id)}</td>
      <td><b>${esc(p.payload.nameEn||p.payload.nameAr||p.id)}</b></td>
      <td>${esc(p.payload.category||"—")}</td>
      <td>${esc(AVAILABILITY_LABELS[p.payload.availability]||p.payload.availability)}</td>
      <td>${p.payload.variants.length}</td>
      <td><span class="status-badge ${p.issues.length?"status-hidden":"status-live"}">${p.issues.length?`${p.issues.length} issue${p.issues.length===1?"":"s"}`:p.existing?"Update":"New"}</span></td>
    </tr>`).join("");
    $("applyProductImport").disabled=!!data.issues.length||!valid.length;
  }

  async function readProductImportFile(file) {
    if(!file)return;
    if(!requireXlsx())return;
    try{
      const bytes=await file.arrayBuffer();
      const workbook=window.XLSX.read(bytes,{type:"array",cellDates:false});
      const sheetName=workbook.SheetNames.find(name=>name.toLowerCase().includes("product"))||workbook.SheetNames[0];
      if(!sheetName)throw new Error("No spreadsheet sheet was found.");
      const rows=window.XLSX.utils.sheet_to_json(workbook.Sheets[sheetName],{defval:"",raw:false});
      if(!rows.length)throw new Error("The spreadsheet has no product rows.");
      state.productImport=prepareProductImport(rows,file.name);
      renderProductImportPreview();
    }catch(err){
      state.productImport=null;
      renderProductImportPreview();
      toast(err.message||"Could not read spreadsheet.","error");
    }
  }

  function clearProductImport(clearInput=true) {
    state.productImport=null;
    if(clearInput&&$("productImportFile"))$("productImportFile").value="";
    renderProductImportPreview();
  }

  async function applyProductImport() {
    const data=state.productImport;
    if(!data||data.issues.length||!data.products.length)return;
    const button=$("applyProductImport");
    button.disabled=true;
    try{
      await createCloudBackup("before_spreadsheet_import",true);

      const existingCustom=storedCategoryRecords();
      const categoryMap=new Map(existingCustom.map(c=>[c.en,c]));
      for(const category of data.categories){
        if(category?.en)categoryMap.set(category.en,{en:category.en,ar:category.ar||categoryMap.get(category.en)?.ar||""});
      }
      const categoryRow={
        key:"product_categories",
        value:{items:[...categoryMap.values()]},
        updated_by:state.user.id,
        updated_at:new Date().toISOString()
      };
      const {error:categoryError}=await state.client.from(cfg.tables.settings).upsert(categoryRow,{onConflict:"key"});
      if(categoryError)throw categoryError;

      for(const item of data.products){
        const existing=state.products.find(p=>p.id===item.id);
        if(existing)await saveProductRevision(existing,"spreadsheet_import");
        const {error}=await state.client.from(cfg.tables.products).upsert({
          product_id:item.id,
          action:"upsert",
          payload:item.payload,
          updated_at:new Date().toISOString(),
          updated_by:state.user.id
        },{onConflict:"product_id"});
        if(error)throw error;
        await upsertAdminNote("product",item.id,item.note);
      }

      await logActivity("spreadsheet_product_import","product","catalogue",{
        file:data.fileName,
        products:data.products.length
      });
      toast(`${data.products.length} products imported successfully.`);
      clearProductImport();
      closeDataCenter();
      await refreshAll();
      setView("products");
    }catch(err){
      toast(err.message||"Product import failed.","error");
    }finally{
      button.disabled=false;
    }
  }

  function exportOverrides() {
    downloadJson(`zwm-product-changes-${new Date().toISOString().slice(0,10)}.json`,[...state.overrides.values()]);
  }
  function exportBackup() {
    const exportedAt=new Date().toISOString();
    downloadJson(`zwm-dashboard-backup-${exportedAt.slice(0,10)}.json`,{
      schemaVersion:2,
      exportedAt,
      summary:Object.fromEntries(ownerSummaryRows().map(row=>[row.Metric,row.Value])),
      catalogueSnapshot:state.products.map(p=>clone(p)),
      productOverrides:[...state.overrides.values()],
      siteSettings:Object.fromEntries(state.settings),
      privateNotes:[...state.notes.values()],
      orders:state.orders,
      analytics30Days:analyticsSpreadsheetRows(30)
    });
  }

  function backupSnapshot(includeOrders=false){
    const snapshot={
      exportedAt:new Date().toISOString(),
      productOverrides:[...state.overrides.values()],
      siteSettings:Object.fromEntries(state.settings),
      privateNotes:[...state.notes.values()]
    };
    if(includeOrders)snapshot.orders=state.orders;
    return snapshot;
  }

  async function createCloudBackup(reason="manual",silent=false){
    if(!state.user)return null;
    const row={reason:String(reason).slice(0,100),snapshot:backupSnapshot(false),created_by:state.user.id};
    const {data,error}=await state.client.from(cfg.tables.backups||"admin_backups").insert(row).select("*").single();
    if(error){if(!silent)toast("Could not create cloud backup.","error");return null;}
    state.backups=[data,...state.backups].slice(0,12);
    renderCloudBackups();
    if($("ownerInboxList"))renderOwnerInbox();
    if(!silent)toast("Cloud backup created.");
    return data;
  }

  async function ensureDailyCloudBackup(){
    const day=new Date().toISOString().slice(0,10);
    if(state.backups.some(b=>safeText(b.reason).includes(day)))return;
    await createCloudBackup(`auto_daily_${day}`,true);
  }

  async function applyBackupSnapshot(data){
    const overrides=Array.isArray(data?.productOverrides)?data.productOverrides:[];
    const backupProductIds=new Set(overrides.map(r=>safeText(r?.product_id)).filter(Boolean));
    const productDeletes=[...state.overrides.keys()].filter(id=>!backupProductIds.has(id));
    if(productDeletes.length){
      const {error}=await state.client.from(cfg.tables.products).delete().in("product_id",productDeletes);
      if(error)throw error;
    }
    for(const row of overrides){
      if(!row?.product_id)continue;
      const {error}=await state.client.from(cfg.tables.products).upsert({
        product_id:row.product_id,
        action:row.action||"upsert",
        payload:row.payload||{},
        updated_at:new Date().toISOString(),
        updated_by:state.user.id
      },{onConflict:"product_id"});
      if(error)throw error;
    }

    const settings=data?.siteSettings&&typeof data.siteSettings==="object"?data.siteSettings:{};
    const backupSettingKeys=new Set(Object.keys(settings));
    const knownSettingKeys=["announcement","contact","promo","delivery","product_categories"];
    const settingDeletes=knownSettingKeys.filter(key=>state.settings.has(key)&&!backupSettingKeys.has(key));
    if(settingDeletes.length){
      const {error}=await state.client.from(cfg.tables.settings).delete().in("key",settingDeletes);
      if(error)throw error;
    }
    const settingRows=Object.entries(settings).map(([key,value])=>({
      key,value,updated_at:new Date().toISOString(),updated_by:state.user.id
    }));
    if(settingRows.length){
      const {error}=await state.client.from(cfg.tables.settings).upsert(settingRows,{onConflict:"key"});
      if(error)throw error;
    }

    const notes=Array.isArray(data?.privateNotes)?data.privateNotes:[];
    const noteKey=n=>`${n?.subject_type||""}:${n?.subject_id||""}`;
    const backupNoteKeys=new Set(notes.map(noteKey).filter(k=>k!==":"));
    for(const [key,note] of state.notes){
      if(backupNoteKeys.has(key))continue;
      const {error}=await state.client.from(cfg.tables.notes||"admin_notes").delete()
        .eq("subject_type",note.subject_type).eq("subject_id",note.subject_id);
      if(error)throw error;
    }
    for(const note of notes){
      if(!note?.subject_type||!note?.subject_id)continue;
      const {error}=await state.client.from(cfg.tables.notes||"admin_notes").upsert({
        subject_type:note.subject_type,
        subject_id:note.subject_id,
        note:note.note||"",
        updated_at:new Date().toISOString(),
        updated_by:state.user.id
      },{onConflict:"subject_type,subject_id"});
      if(error)throw error;
    }
    return {products:overrides.length,settings:settingRows.length,notes:notes.length};
  }

  async function restoreCloudBackup(id){
    const backup=state.backups.find(b=>String(b.id)===String(id));
    if(!backup)return;
    if(!confirm("Restore products, settings and private notes from this cloud backup? Order history will not be changed."))return;
    try{
      await createCloudBackup("before_cloud_restore",true);
      const counts=await applyBackupSnapshot(backup.snapshot||{});
      await logActivity("restore_cloud_backup","backup",String(id),counts);
      toast("Cloud backup restored.");
      await refreshAll();
    }catch(err){toast(err.message||"Could not restore cloud backup.","error");}
  }

  function openQuickActions(){
    $("quickActionSheet").hidden=false;$("quickActionBackdrop").hidden=false;
    document.body.classList.add("mobile-more-open");
  }
  function closeQuickActions(){
    $("quickActionSheet").hidden=true;$("quickActionBackdrop").hidden=true;
    document.body.classList.remove("mobile-more-open");
  }

  function openGlobalSearch(){
    $("globalSearchModal").hidden=false;document.body.style.overflow="hidden";
    $("globalSearchInput").value="";renderGlobalSearchResults("");
    setTimeout(()=>$("globalSearchInput").focus(),30);
  }
  function closeGlobalSearch(){
    $("globalSearchModal").hidden=true;
    if($("productModal").hidden&&$("orderModal").hidden&&$("manualOrderModal").hidden)document.body.style.overflow="";
  }
  function renderGlobalSearchResults(query){
    const q=safeText(query).trim().toLowerCase();
    const root=$("globalSearchResults");
    if(q.length<2){root.innerHTML='<p class="empty-state">Start typing to search products, orders and customers.</p>';return;}
    const products=state.products.filter(p=>[p.id,p.nameEn,p.nameAr,p.category].join(" ").toLowerCase().includes(q)).slice(0,6);
    const orders=state.orders.filter(o=>orderSearchText(o).includes(q)).slice(0,6);
    const customers=customerGroups().filter(c=>[c.name,c.phone,c.area].join(" ").toLowerCase().includes(q)).slice(0,6);
    const sections=[];
    if(products.length)sections.push(`<section><h3>Products</h3>${products.map(p=>`<button type="button" data-search-product="${esc(p.id)}"><span><b>${esc(p.nameEn||p.id)}</b><small>${esc(categoryDisplayName(p.category||""))}</small></span><em>${esc(AVAILABILITY_LABELS[availabilityFor(p)])}</em></button>`).join("")}</section>`);
    if(orders.length)sections.push(`<section><h3>Orders</h3>${orders.map(o=>`<button type="button" data-search-order="${esc(o.reference)}"><span><b>${esc(o.reference)}</b><small>${esc(o.customer_name||o.area||"Order")}</small></span><em>${money(o.total)}</em></button>`).join("")}</section>`);
    if(customers.length)sections.push(`<section><h3>Customers</h3>${customers.map(c=>`<button type="button" data-search-customer="${esc(c.key)}"><span><b>${esc(c.name)}</b><small>${esc(c.phone||c.area)}</small></span><em>${c.orders.length} orders</em></button>`).join("")}</section>`);
    root.innerHTML=sections.join("")||'<p class="empty-state">No matching products, orders or customers.</p>';
  }

  function manualReference(){
    const d=new Date();
    const stamp=[String(d.getFullYear()).slice(-2),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0"),String(d.getHours()).padStart(2,"0"),String(d.getMinutes()).padStart(2,"0")].join("");
    const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes=new Uint8Array(4);crypto.getRandomValues(bytes);
    const suffix=[...bytes].map(n=>chars[n%chars.length]).join("");
    return `ZW-MANUAL-${stamp}-${suffix}`;
  }
  function manualProductOptions(){
    const out=[];
    for(const p of state.products.filter(p=>availabilityFor(p)==="in_stock"&&!["hidden","draft"].includes(p.__status))){
      for(const v of p.variants||[])out.push(`<option value="${esc(p.id)}|${esc(v.id)}">${esc(p.nameEn||p.id)} · ${esc(v.sizeEn||v.sizeAr||"")} · ${money(v.price)}</option>`);
    }
    return out.join("");
  }
  function addManualItemRow(){
    const row=document.createElement("div");row.className="manual-order-item";
    row.innerHTML=`<select data-manual-product required><option value="">Choose product…</option>${manualProductOptions()}</select><input data-manual-qty type="number" min="1" step="1" value="1" inputmode="numeric"><button type="button" data-remove-manual-item aria-label="Remove">×</button>`;
    $("manualOrderItems").appendChild(row);renderManualOrderTotal();
  }
  function manualOrderRows(){
    return $$(".manual-order-item").map(row=>{
      const raw=row.querySelector("[data-manual-product]").value;
      if(!raw)return null;
      const [productId,variantId]=raw.split("|");
      const p=state.products.find(x=>x.id===productId),v=p?.variants?.find(x=>x.id===variantId);
      const qty=Math.max(1,Number(row.querySelector("[data-manual-qty]").value)||1);
      return p&&v?{p,v,qty}:null;
    }).filter(Boolean);
  }
  function renderManualOrderTotal(){
    const rows=manualOrderRows();
    const products=rows.reduce((sum,r)=>sum+Number(r.v.price)*r.qty,0);
    const fee=Math.max(0,Number($("manualDeliveryFee").value)||0);
    $("manualOrderTotal").textContent=money(products+fee);
  }

  function matchingDeliveryZone(area){
    const value=safeText(area).trim().toLowerCase();
    if(!value)return null;
    const delivery=state.settings.get("delivery")||{};
    const zones=Array.isArray(delivery.zones)?delivery.zones:[];
    return zones.find(z=>{
      const name=safeText(z.area).trim().toLowerCase();
      return name&&(value===name||value.includes(name)||name.includes(value));
    })||null;
  }

  function updateManualDeliveryFromArea(){
    const delivery=state.settings.get("delivery")||{};
    const zone=matchingDeliveryZone($("manualOrderArea").value);
    const rows=manualOrderRows();
    const productTotal=rows.reduce((sum,r)=>sum+Number(r.v.price)*r.qty,0);
    const freeAbove=Math.max(0,Number(delivery.freeAbove)||0);
    let fee=zone?Math.max(0,Number(zone.fee)||0):Math.max(0,Number(delivery.fee)||0);
    if(freeAbove>0&&productTotal>=freeAbove)fee=0;
    $("manualDeliveryFee").value=fee;
    renderManualOrderTotal();
  }
  function openManualOrder(){
    $("manualOrderForm").reset();$("manualOrderItems").innerHTML="";
    const delivery=state.settings.get("delivery")||{};
    $("manualDeliveryFee").value=Number(delivery.fee)||0;
    addManualItemRow();renderManualOrderTotal();
    $("manualOrderModal").hidden=false;document.body.style.overflow="hidden";
  }
  function closeManualOrder(){
    $("manualOrderModal").hidden=true;
    if($("productModal").hidden&&$("orderModal").hidden&&$("globalSearchModal").hidden)document.body.style.overflow="";
  }
  async function createManualOrder(e){
    e.preventDefault();
    const rows=manualOrderRows();if(!rows.length)return toast("Add at least one product.","error");
    const fee=Math.max(0,Number($("manualDeliveryFee").value)||0);
    const productTotal=rows.reduce((sum,r)=>sum+Number(r.v.price)*r.qty,0);
    const reference=manualReference();
    const order={
      reference,kind:$("manualOrderKind").value==="gift"?"gift":"order",status:"new",
      customer_name:$("manualCustomerName").value.trim(),customer_phone:$("manualCustomerPhone").value.trim(),area:$("manualOrderArea").value.trim(),
      notes:$("manualOrderNotes").value.trim(),private_notes:$("manualPrivateNote").value.trim(),
      items:rows.map(r=>({product_id:r.p.id,name:r.p.nameEn||r.p.id,size:r.v.sizeEn||r.v.sizeAr||"",qty:r.qty,unit_price:Number(r.v.price),subtotal:Number(r.v.price)*r.qty})),
      subtotal:productTotal,discount_total:0,reward_discount:0,delivery_fee:fee,
      total:productTotal+fee,currency:"USD",language:state.lang==="ar"?"ar":"en",
      payment_method:"cash_on_delivery",payment_status:"pending",created_source:"admin",
      extra:{source:"manual",delivery_fee:fee,products_subtotal:productTotal},status_history:[{status:"new",at:new Date().toISOString(),source:"owner"}],submitted_at:new Date().toISOString(),updated_at:new Date().toISOString()
    };
    const {error}=await state.client.from(cfg.tables.orders||"orders").insert(order);
    if(error)return toast(error.message||"Could not create manual order.","error");
    await logActivity("create_manual_order","order",reference,{total:order.total});
    closeManualOrder();toast(`Manual order ${reference} created.`);await refreshAll();setView("orders");openOrderDetails(reference);
  }

  async function restoreBackup(file){
    if(!file)return;
    try{
      const data=JSON.parse(await file.text());
      if(!data||typeof data!=="object")throw new Error("Invalid backup file.");
      if(!confirm("Restore products, public settings and private notes from this backup? Current order history will not be changed."))return;
      await createCloudBackup("before_file_restore",true);
      const counts=await applyBackupSnapshot(data);
      await logActivity("restore_backup","backup","dashboard",counts);
      toast("Backup restored.");
      await refreshAll();
    }catch(err){toast(err.message||"Could not restore backup.","error");}
    finally{$("restoreBackupInput").value="";}
  }

  function setupInstallPrompt(){
    window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();state.installPrompt=e;$("installAdminHint").textContent="Ready to install on this device.";});
    if("serviceWorker" in navigator){
      let reloadingForWorker=false;
      navigator.serviceWorker.addEventListener("controllerchange",()=>{
        if(reloadingForWorker)return;
        reloadingForWorker=true;
        location.reload();
      });
      navigator.serviceWorker.register("admin-sw.js?v=20261004-adminqa2",{updateViaCache:"none"})
        .then(reg=>reg.update().catch(()=>{}))
        .catch(()=>{});
    }
    window.addEventListener("pageshow",event=>{if(event.persisted)location.reload()});
  }
  async function installAdminApp(){
    if(state.installPrompt){
      state.installPrompt.prompt();await state.installPrompt.userChoice;state.installPrompt=null;return;
    }
    toast("On iPhone: Share → Add to Home Screen. On Android: browser menu → Install app.");
  }

  function bindCriticalActions() {
    document.addEventListener("click",e=>{
      const edit=e.target.closest("[data-edit-product]");
      if(edit){
        e.preventDefault();
        try{openProductEditor(edit.dataset.editProduct||null);}
        catch(err){console.error("Product editor failed:",err);toast("Could not open the product editor. Refresh and try again.","error");}
        return;
      }

      const health=e.target.closest("[data-health-filter]");
      if(health){
        e.preventDefault();
        try{applyHealthFilter(health.dataset.healthFilter);}
        catch(err){console.error("Catalogue health shortcut failed:",err);toast("Could not open that product list. Refresh and try again.","error");}
        return;
      }

      const exportButton=e.target.closest("[data-export-dataset][data-export-format]");
      if(exportButton){
        e.preventDefault();
        try{exportData(exportButton.dataset.exportDataset,exportButton.dataset.exportFormat);}
        catch(err){console.error("Export failed:",err);toast("Could not create that download. Please try again.","error");}
      }
    },true);
  }

  function bindStaticUi() {
    bindCriticalActions();
    document.addEventListener("click",e=>{
      const btn=e.target.closest("[data-admin-lang]");
      if(!btn)return;
      e.preventDefault();
      chooseAdminLanguage(btn.dataset.adminLang);
    },true);
    $("loginForm")?.addEventListener("submit",handleLogin);
    $("bootstrapForm")?.addEventListener("submit",handleBootstrap);
    $("signOutButton")?.addEventListener("click",signOut);
    $("settingsSignOut")?.addEventListener("click",signOut);
    $("refreshButton")?.addEventListener("click",()=>refreshAll().then(()=>toast("Dashboard refreshed.")));
    $("mobileMenuButton")?.setAttribute("aria-expanded","false");
    $("adminSidebar")?.setAttribute("aria-hidden",window.matchMedia("(max-width: 900px)").matches?"true":"false");
    $("mobileMenuButton")?.addEventListener("click",e=>{
      e.preventDefault();
      if($("adminSidebar").classList.contains("is-open"))closeSidebar();
      else openSidebar();
    });
    $("sidebarClose")?.addEventListener("click",closeSidebar);
    $("sidebarBackdrop")?.addEventListener("click",closeSidebar);
    $("adminNav")?.addEventListener("click",e=>{
      const button=e.target.closest("button[data-view]");
      if(!button)return;
      e.preventDefault();
      setView(button.dataset.view);
    });
    $$("[data-jump-view]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.jumpView)));
    $("quickAddProduct")?.addEventListener("click",openQuickActions);
    $("addProductButton")?.addEventListener("click",()=>openProductEditor());
    $("addCategoryButton")?.addEventListener("click",addCategory);
    $("addCategoryEditorButton")?.addEventListener("click",async()=>{const category=await addCategory();if(category)$("productCategory").value=category;});
    $("closeProductModal")?.addEventListener("click",closeProductEditor);
    $("cancelProductButton")?.addEventListener("click",closeProductEditor);
    $("productModal")?.addEventListener("click",e=>{if(e.target===$("productModal"))closeProductEditor();});
    $("productForm")?.addEventListener("submit",saveProduct);
    $("addVariantButton")?.addEventListener("click",()=>variantRow({}));
    $("variantRows")?.addEventListener("click",e=>{const b=e.target.closest("[data-remove-variant]");if(b&&$$(".variant-row").length>1)b.closest(".variant-row").remove();});
    $("productImage")?.addEventListener("change",onImageSelected);
    $("removeProductImage")?.addEventListener("click",removeProductPhoto);
    $("resetImagePosition")?.addEventListener("click",resetImageFraming);
    $("imagePositionX")?.addEventListener("input",updateFramingFromControls);
    $("imagePositionY")?.addEventListener("input",updateFramingFromControls);
    $("imageZoom")?.addEventListener("input",updateFramingFromControls);
    $("rotateImageLeft")?.addEventListener("click",()=>rotateImage(-90));
    $("rotateImageRight")?.addEventListener("click",()=>rotateImage(90));
    $$("[data-image-fit]").forEach(btn=>btn.addEventListener("click",()=>setImageFit(btn.dataset.imageFit)));
    $$("[data-image-preview]").forEach(btn=>btn.addEventListener("click",()=>setImagePreviewMode(btn.dataset.imagePreview)));
    $("productRevisionList")?.addEventListener("click",e=>{const b=e.target.closest("[data-restore-revision]");if(b)restoreProductRevision(Number(b.dataset.restoreRevision));});
    try{bindImageDrag();}catch(err){console.warn("Image drag controls unavailable:",err);}
    $("deleteProductButton")?.addEventListener("click",deleteCurrentProduct);
    $("hideProductButton")?.addEventListener("click",hideCurrentProduct);
    $("restoreProductButton")?.addEventListener("click",restoreCurrentProduct);
    $("contentForm")?.addEventListener("submit",saveContent);
    $("productSearch")?.addEventListener("input",e=>{state.productFilter.q=e.target.value;renderProducts();});
    $("productCategoryFilter")?.addEventListener("change",e=>{state.productFilter.category=e.target.value;renderProducts();});
    $("productStatusFilter")?.addEventListener("change",e=>{state.productFilter.status=e.target.value;renderProducts();});
    $("productAvailabilityFilter")?.addEventListener("change",e=>{state.productFilter.availability=e.target.value;renderProducts();});
    $("bulkProductAction")?.addEventListener("change",configureBulkValue);
    $("applyBulkProductAction")?.addEventListener("click",applyBulkProductAction);
    $("clearProductSelection")?.addEventListener("click",clearProductSelection);
    $("deselectAllProducts")?.addEventListener("click",clearProductSelection);
    $("selectVisibleProducts")?.addEventListener("click",()=>{filteredProducts().forEach(p=>state.selectedProducts.add(p.id));renderProducts();});
    const selectionHandler=e=>{const input=e.target.closest("[data-select-product]");if(input)toggleProductSelection(input.dataset.selectProduct,input.checked);};
    $("productTableBody")?.addEventListener("change",selectionHandler);
    $("productCardsMobile")?.addEventListener("change",selectionHandler);
    $$("[data-order-scope]").forEach(btn=>btn.addEventListener("click",()=>{state.orderScope=btn.dataset.orderScope;state.orderCommand="";renderOrders();}));
    $$("[data-order-command]").forEach(btn=>btn.addEventListener("click",()=>{state.orderCommand=state.orderCommand===btn.dataset.orderCommand?"":btn.dataset.orderCommand;state.orderScope="all";renderOrders();}));
    $$("[data-overview-order-filter]").forEach(btn=>btn.addEventListener("click",()=>{setView("orders");const v=btn.dataset.overviewOrderFilter;if(v==="delivered_today"){state.orderCommand="delivered_today";state.orderScope="all";state.orderFilter.status="";}else{state.orderCommand="today";state.orderScope="all";state.orderFilter.status=v;}$("orderStatusFilter").value=state.orderFilter.status;renderOrders();}));
    $("manualOrderButton")?.addEventListener("click",openManualOrder);
    $("orderSearch")?.addEventListener("input",e=>{state.orderFilter.q=e.target.value;renderOrders();});
    $("orderStatusFilter")?.addEventListener("change",e=>{state.orderFilter.status=e.target.value;renderOrders();});
    $("orderKindFilter")?.addEventListener("change",e=>{state.orderFilter.kind=e.target.value;renderOrders();});
    const orderStatusHandler=e=>{const select=e.target.closest("[data-order-status]");if(select)updateOrderStatus(select.dataset.orderStatus,select.value);};
    $("orderTableBody")?.addEventListener("change",orderStatusHandler);
    $("orderCardsMobile")?.addEventListener("change",orderStatusHandler);
    const orderDetailsHandler=e=>{const btn=e.target.closest("[data-view-order]");if(btn)openOrderDetails(btn.dataset.viewOrder);};
    $("orderTableBody")?.addEventListener("click",orderDetailsHandler);
    $("orderCardsMobile")?.addEventListener("click",orderDetailsHandler);
    $("orderCardsMobile")?.addEventListener("click",e=>{const b=e.target.closest("[data-order-quick-status]");if(b){e.stopPropagation();updateOrderStatus(b.dataset.orderRef,b.dataset.orderQuickStatus);}});
    const paymentHandler=e=>{const b=e.target.closest("[data-order-payment-received]");if(b){e.preventDefault();e.stopPropagation();confirmOrderPayment(b.dataset.orderPaymentReceived);}};
    $("orderTableBody")?.addEventListener("click",paymentHandler);
    $("orderCardsMobile")?.addEventListener("click",paymentHandler);
    $("orderDetailPaymentAction")?.addEventListener("click",paymentHandler);
    $("orderCustomerHistory")?.addEventListener("click",orderDetailsHandler);
    $("orderDetailStatus")?.addEventListener("change",orderStatusHandler);
    $("closeOrderModal")?.addEventListener("click",closeOrderDetails);
    $("orderModal")?.addEventListener("click",e=>{if(e.target===$("orderModal"))closeOrderDetails();});
    $("copyOrderCode")?.addEventListener("click",copyOrderCode);
    $("orderWhatsAppTools")?.addEventListener("click",e=>{const b=e.target.closest("[data-order-message]");if(b)sendOrderMessage(b.dataset.orderMessage);});
    $("saveOrderPrivateNote")?.addEventListener("click",saveOrderPrivateNote);
    $("exportOrdersButton")?.addEventListener("click",()=>openDataCenter("orders"));
    $("customerSearch")?.addEventListener("input",e=>{state.customerFilter.q=e.target.value;renderCustomers();});
    $("customerSort")?.addEventListener("change",e=>{state.customerFilter.sort=e.target.value;renderCustomers();});
    $("customerExportButton")?.addEventListener("click",()=>openDataCenter("customers"));
    $("customerGrid")?.addEventListener("click",e=>{const b=e.target.closest("[data-customer-orders]");if(!b)return;const c=customerGroups().find(x=>x.key===b.dataset.customerOrders);if(!c)return;setView("orders");state.orderScope="all";state.orderCommand="";state.orderFilter.q=c.phone||c.name;$("orderSearch").value=state.orderFilter.q;renderOrders();});
    $("ownerInboxList")?.addEventListener("click",e=>{const b=e.target.closest("[data-inbox-action]");if(b)handleInboxAction(b.dataset.inboxAction);});
    $("analyticsRange")?.addEventListener("change",renderAnalytics);
    $("exportProductsButton")?.addEventListener("click",()=>openDataCenter("products"));
    $("exportBackupButton")?.addEventListener("click",()=>openDataCenter("backup"));
    $("openDataCenterButton")?.addEventListener("click",()=>openDataCenter());
    $("restoreBackupInput")?.addEventListener("change",e=>restoreBackup(e.target.files?.[0]));
    $("installAdminApp")?.addEventListener("click",installAdminApp);
    $$("[data-overview-pref]").forEach(input=>input.addEventListener("change",()=>saveOverviewPreference(input.dataset.overviewPref,input.checked)));
    $("runHealthCheck")?.addEventListener("click",runHealthCheck);
    $("addDeliveryZone")?.addEventListener("click",()=>deliveryZoneRow({}));
    $("deliveryZoneRows")?.addEventListener("click",e=>{const b=e.target.closest("[data-remove-zone]");if(b)b.closest(".delivery-zone-row").remove();});
    $("previewContentMobile")?.addEventListener("click",()=>openContentPreview("mobile"));
    $("previewContentDesktop")?.addEventListener("click",()=>openContentPreview("desktop"));
    $$("[data-content-preview-mode]").forEach(btn=>btn.addEventListener("click",()=>setContentPreviewMode(btn.dataset.contentPreviewMode)));
    $("contentPreviewFrame")?.addEventListener("load",()=>setTimeout(sendContentPreviewDraft,0));
    $("contentPreviewPage")?.addEventListener("change",()=>loadContentPreviewPage(true));
    updateLivePreviewLink();
    window.addEventListener("message",e=>{if(e.origin===location.origin&&e.data?.type==="zwm-preview-ready")sendContentPreviewDraft();});
    $("contentForm")?.addEventListener("input",()=>{markContentDirty();if(!$("contentPreviewModal").hidden)sendContentPreviewDraft();});
    $("contentForm")?.addEventListener("change",()=>{markContentDirty();if(!$("contentPreviewModal").hidden)sendContentPreviewDraft();});
    $("closeContentPreview")?.addEventListener("click",closeContentPreview);
    $("closeContentPreviewFooter")?.addEventListener("click",closeContentPreview);
    $("contentPreviewModal")?.addEventListener("click",e=>{if(e.target===$("contentPreviewModal"))closeContentPreview();});
    $("createCloudBackup")?.addEventListener("click",()=>createCloudBackup("manual"));
    $("cloudBackupList")?.addEventListener("click",e=>{
      const restore=e.target.closest("[data-restore-cloud-backup]");
      if(restore){restoreCloudBackup(restore.dataset.restoreCloudBackup);return;}
      const download=e.target.closest("[data-download-cloud-backup]");
      if(download){const b=state.backups.find(x=>String(x.id)===String(download.dataset.downloadCloudBackup));if(b)downloadJson(`zwm-cloud-backup-${b.id}.json`,b.snapshot);}
    });
    $("closeDataCenter")?.addEventListener("click",closeDataCenter);
    $("dataCenterModal")?.addEventListener("click",e=>{if(e.target===$("dataCenterModal"))closeDataCenter();});
    $("productImportFile")?.addEventListener("change",e=>readProductImportFile(e.target.files?.[0]));
    $("clearProductImport")?.addEventListener("click",()=>clearProductImport());
    $("applyProductImport")?.addEventListener("click",applyProductImport);
    $("productImportDropzone")?.addEventListener("dragover",e=>{e.preventDefault();e.currentTarget.classList.add("is-dragging");});
    $("productImportDropzone")?.addEventListener("dragleave",e=>e.currentTarget.classList.remove("is-dragging"));
    $("productImportDropzone")?.addEventListener("drop",e=>{
      e.preventDefault();e.currentTarget.classList.remove("is-dragging");
      const file=e.dataTransfer?.files?.[0];
      if(file){const input=$("productImportFile");const dt=new DataTransfer();dt.items.add(file);input.files=dt.files;readProductImportFile(file);}
    });
    $("globalSearchButton")?.addEventListener("click",openGlobalSearch);
    $("mobileGlobalSearchButton")?.addEventListener("click",()=>{document.querySelector("#mobileMoreSheet").hidden=true;document.querySelector("#mobileMoreBackdrop").hidden=true;document.body.classList.remove("mobile-more-open");openGlobalSearch();});
    $("mobileDataCenterButton")?.addEventListener("click",()=>{document.querySelector("#mobileMoreSheet").hidden=true;document.querySelector("#mobileMoreBackdrop").hidden=true;document.body.classList.remove("mobile-more-open");openDataCenter();});
    $("closeGlobalSearch")?.addEventListener("click",closeGlobalSearch);
    $("globalSearchModal")?.addEventListener("click",e=>{if(e.target===$("globalSearchModal"))closeGlobalSearch();});
    $("globalSearchInput")?.addEventListener("input",e=>renderGlobalSearchResults(e.target.value));
    $("globalSearchResults")?.addEventListener("click",e=>{
      const p=e.target.closest("[data-search-product]");if(p){closeGlobalSearch();setView("products");openProductEditor(p.dataset.searchProduct);return;}
      const o=e.target.closest("[data-search-order]");if(o){closeGlobalSearch();setView("orders");openOrderDetails(o.dataset.searchOrder);return;}
      const c=e.target.closest("[data-search-customer]");if(c){closeGlobalSearch();setView("customers");state.customerFilter.q="";$("customerSearch").value="";renderCustomers();const card=document.querySelector(`[data-customer-key="${CSS.escape(c.dataset.searchCustomer)}"]`);card?.scrollIntoView({behavior:"smooth",block:"center"});}
    });
    $("quickActionBackdrop")?.addEventListener("click",closeQuickActions);
    $("closeQuickActions")?.addEventListener("click",closeQuickActions);
    $("quickActionSheet")?.addEventListener("click",e=>{const b=e.target.closest("[data-quick-action]");if(!b)return;closeQuickActions();if(b.dataset.quickAction==="product")openProductEditor();if(b.dataset.quickAction==="category")addCategory();if(b.dataset.quickAction==="order")openManualOrder();if(b.dataset.quickAction==="promo"){setView("content");setTimeout(()=>$("promoTitleEn")?.focus(),150);}});
    $("closeManualOrder")?.addEventListener("click",closeManualOrder);
    $("cancelManualOrder")?.addEventListener("click",closeManualOrder);
    $("manualOrderModal")?.addEventListener("click",e=>{if(e.target===$("manualOrderModal"))closeManualOrder();});
    $("manualOrderForm")?.addEventListener("submit",createManualOrder);
    $("addManualOrderItem")?.addEventListener("click",addManualItemRow);
    $("manualOrderItems")?.addEventListener("click",e=>{const b=e.target.closest("[data-remove-manual-item]");if(b){b.closest(".manual-order-item").remove();if(!document.querySelector(".manual-order-item"))addManualItemRow();renderManualOrderTotal();}});
    $("manualOrderItems")?.addEventListener("change",()=>{updateManualDeliveryFromArea();});
    $("manualOrderItems")?.addEventListener("input",()=>{updateManualDeliveryFromArea();});
    $("manualOrderArea")?.addEventListener("input",updateManualDeliveryFromArea);
    $("manualOrderArea")?.addEventListener("change",updateManualDeliveryFromArea);
    $("manualDeliveryFee")?.addEventListener("input",renderManualOrderTotal);
    setupInstallPrompt();
    document.addEventListener("keydown",e=>{
      if(e.key!=="Escape")return;
      if(!$("dataCenterModal")?.hidden){closeDataCenter();return;}
      if(!$("contentPreviewModal")?.hidden){closeContentPreview();return;}
      if(!$("globalSearchModal")?.hidden){closeGlobalSearch();return;}
      if(!$("manualOrderModal")?.hidden){closeManualOrder();return;}
      if(!$("productModal")?.hidden){closeProductEditor();return;}
      if(!$("orderModal")?.hidden){closeOrderDetails();return;}
      if(!$("quickActionSheet")?.hidden){closeQuickActions();return;}
      if($("adminSidebar")?.classList.contains("is-open")){closeSidebar();return;}
    });
    window.addEventListener("resize",()=>{
      if(window.innerWidth>900&&$("adminSidebar")?.classList.contains("is-open"))closeSidebar();
      if(window.innerWidth>900)$("adminSidebar")?.setAttribute("aria-hidden","false");
      else if(!$("adminSidebar")?.classList.contains("is-open"))$("adminSidebar")?.setAttribute("aria-hidden","true");
    });
    window.addEventListener("beforeunload",e=>{
      if(!state.contentDirty)return;
      e.preventDefault();
      e.returnValue="";
    });
  }

  init().catch(err => {
    console.error(err);
    if (enabled()) {
      showOnly("loginScreen");
      setStatus($("loginStatus"),"Dashboard initialization failed. Check the backend connection.","error");
    } else showOnly("setupScreen");
  });
})();

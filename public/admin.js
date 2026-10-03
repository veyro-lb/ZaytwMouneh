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
  const originalTextNodes = new WeakMap();
  const originalAttributes = new WeakMap();
  let languageObserver = null;

  function readAdminLanguage() {
    try { return localStorage.getItem(ADMIN_LANG_KEY)==="ar" ? "ar" : "en"; }
    catch { return "en"; }
  }

  const AR_TRANSLATIONS = Object.freeze({
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
    "Track every order sent from the website by its WhatsApp code.":"تتبّع كل طلب أُرسل من الموقع باستخدام رمز واتساب الخاص به.",
    "“Sent” means the customer opened WhatsApp with the prepared order. Mark delivery progress here.":"«تم الإرسال» يعني أن العميل فتح واتساب مع الطلب الجاهز. حدّث مراحل التوصيل من هنا.",
    "Needs review":"يحتاج مراجعة",
    "Preparing":"قيد التحضير",
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
    "WhatsApp order code copied.":"تم نسخ رمز طلب واتساب.",
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
    "Sat":"سبت"
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
    document.title=state.lang==="ar"?"Zayt w Mouneh — لوحة المالك":"Zayt w Mouneh — Owner Console";
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
    overrides: new Map(), settings: new Map(), events: [], activity: [], orders: [],
    products: [], editingId: null, imageFile: null, imageDims: null,
    activeView: "overview", productFilter: { q:"", category:"", status:"" },
    orderFilter: { q:"", status:"", kind:"" }, orderScope:"active", selectedOrderReference:null,
    imagePosition:{x:50,y:50,zoom:100}, previewObjectUrl:null,
    session:null, sessionRefreshTimer:null,
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
  function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function showOnly(id) {
    for (const key of ["setupScreen","loginScreen","adminApp"]) {
      const el = $(key);
      if (el) el.hidden = key !== id;
    }
  }

  const OWNER_SESSION_KEY = "zwm:owner-session:v2";

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
      const raw=localStorage.getItem(OWNER_SESSION_KEY);
      const value=raw?JSON.parse(raw):null;
      return value&&value.access_token&&value.refresh_token?value:null;
    }catch{return null;}
  }

  function saveOwnerSession(session) {
    try{localStorage.setItem(OWNER_SESSION_KEY,JSON.stringify(session));}catch{}
  }

  function clearOwnerSession() {
    try{localStorage.removeItem(OWNER_SESSION_KEY);}catch{}
    if(state.sessionRefreshTimer){
      clearTimeout(state.sessionRefreshTimer);
      state.sessionRefreshTimer=null;
    }
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
    if (!enabled()) {
      showOnly("setupScreen");
      return;
    }
    state.client=anonymousClient();
    const restored=await restoreOwnerSession();
    if(!restored)showOnly("loginScreen");
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
    const [overridesRes, settingsRes, eventsRes, activityRes, ordersRes] = await Promise.all([
      state.client.from(cfg.tables.products).select("*").order("updated_at",{ascending:false}),
      state.client.from(cfg.tables.settings).select("*"),
      state.client.from(cfg.tables.events).select("*").gte("created_at",since).order("created_at",{ascending:false}).limit(10000),
      state.client.from(cfg.tables.activity).select("*").order("created_at",{ascending:false}).limit(300),
      loadAllOrders()
    ]);

    if (overridesRes.error) toast("Could not load product changes.", "error");
    if (settingsRes.error) toast("Could not load website settings.", "error");
    if (ordersRes.error) toast("Could not load order history.", "error");

    state.overrides = new Map((overridesRes.data || []).map(r => [r.product_id,r]));
    state.settings = new Map((settingsRes.data || []).map(r => [r.key,r.value]));
    state.events = eventsRes.data || [];
    state.activity = activityRes.data || [];
    state.orders = ordersRes.data || [];
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
    renderContent();
    renderOverview();
    renderAnalytics();
    renderActivity();
    renderSettings();
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

  function renderProducts() {
    const {q,category,status} = state.productFilter;
    const term = q.trim().toLowerCase();
    const list = state.products.filter(p => {
      if (category && p.category !== category) return false;
      const st = statusFor(p);
      if (status==="missing-photo" && photoFor(p)) return false;
      if (status && status!=="missing-photo" && st!==status) return false;
      if (term) {
        const hay = [p.id,p.nameEn,p.nameAr,p.category,p.original].join(" ").toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
    $("productResultCount").textContent = `${list.length} product${list.length===1?"":"s"}`;
    $("navProductCount").textContent = state.products.length;
    const tbody = $("productTableBody");
    tbody.innerHTML = list.map(productRowHtml).join("") || '<tr><td colspan="6"><p class="empty-state">No products match these filters.</p></td></tr>';
    $("productCardsMobile").innerHTML = list.map(productCardHtml).join("") || '<p class="empty-state">No products match these filters.</p>';
  }

  function productRowHtml(p) {
    const photo = photoFor(p);
    const firstPrice = p.variants?.length ? Math.min(...p.variants.map(v=>Number(v.price)).filter(Number.isFinite)) : NaN;
    const status = statusFor(p);
    return `<tr>
      <td><div class="product-row-main">${photo ? `<img class="product-thumb" src="${esc(photo.url)}" alt="">` : '<span class="product-thumb-placeholder">No photo</span>'}<div><b>${esc(p.nameEn||p.id)}</b><small>${esc(p.nameAr||p.id)} · ${esc(p.id)}</small></div></div></td>
      <td>${esc(p.category?categoryDisplayName(p.category):"—")}</td>
      <td>${money(firstPrice)}</td>
      <td><span class="status-badge status-${status}">${status.replace("-"," ")}</span></td>
      <td>${esc(when(p.__updated))}</td>
      <td><div class="row-actions"><button class="row-action" data-edit-product="${esc(p.id)}">Edit</button></div></td>
    </tr>`;
  }

  function productCardHtml(p) {
    const photo = photoFor(p), st=statusFor(p);
    return `<article class="product-mobile-card">
      ${photo ? `<img class="product-thumb" src="${esc(photo.url)}" alt="">` : '<span class="product-thumb-placeholder">No photo</span>'}
      <div><b>${esc(p.nameEn||p.id)}</b><p>${esc(p.category?categoryDisplayName(p.category):"—")} · <span class="status-badge status-${st}">${st}</span></p></div>
      <button type="button" data-edit-product="${esc(p.id)}">Edit</button>
    </article>`;
  }

  const ORDER_STATUS_LABELS = {
    new:"New",
    confirmed:"Confirmed",
    preparing:"Preparing",
    out_for_delivery:"Out for delivery",
    delivered:"Delivered",
    cancelled:"Cancelled"
  };

  const PAST_ORDER_STATUSES = new Set(["delivered","cancelled"]);

  function orderItemSummary(order) {
    const items=Array.isArray(order.items)?order.items:[];
    if(!items.length)return "No items";
    const first=items.slice(0,2).map(i=>`${Number(i.qty)||1}× ${i.name||i.product_id||"Item"}`).join(", ");
    return items.length>2?`${first} +${items.length-2} more`:first;
  }

  function orderSearchText(order) {
    return [
      order.reference,order.customer_name,order.area,order.notes,order.kind,order.status,
      ...(Array.isArray(order.items)?order.items.flatMap(i=>[i.name,i.product_id,i.size]):[])
    ].join(" ").toLowerCase();
  }

  function orderMatchesScope(order) {
    if(state.orderScope==="past")return PAST_ORDER_STATUSES.has(order.status);
    if(state.orderScope==="active")return !PAST_ORDER_STATUSES.has(order.status);
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
    $("orderActiveTabCount").textContent=active;
    $("orderPastTabCount").textContent=past;
    $("orderAllTabCount").textContent=state.orders.length;
    $$("[data-order-scope]").forEach(btn=>btn.classList.toggle("is-active",btn.dataset.orderScope===state.orderScope));

    $("ordersNewCount").textContent=state.orders.filter(o=>o.status==="new").length;
    $("ordersPreparingCount").textContent=state.orders.filter(o=>["confirmed","preparing"].includes(o.status)).length;
    $("ordersOutCount").textContent=state.orders.filter(o=>o.status==="out_for_delivery").length;
    $("ordersDeliveredCount").textContent=state.orders.filter(o=>o.status==="delivered").length;
    $("orderResultCount").textContent=`${list.length} order${list.length===1?"":"s"} · ${state.orderScope==="all"?"all history":state.orderScope}`;

    $("orderTableBody").innerHTML=list.map(orderRowHtml).join("")||'<tr><td colspan="7"><p class="empty-state">No orders match these filters.</p></td></tr>';
    $("orderCardsMobile").innerHTML=list.map(orderCardHtml).join("")||'<p class="empty-state">No orders match these filters.</p>';
  }

  function orderStatusSelect(order,extraClass="") {
    return `<select class="order-status-select status-${esc(order.status)} ${extraClass}" data-order-status="${esc(order.reference)}" aria-label="Status for ${esc(order.reference)}">${Object.entries(ORDER_STATUS_LABELS).map(([value,label])=>`<option value="${value}" ${order.status===value?"selected":""}>${label}</option>`).join("")}</select>`;
  }

  function orderRowHtml(order) {
    const extra=order.extra||{};
    const customer=order.kind==="gift"?(extra.recipient||order.customer_name||"Gift order"):(order.customer_name||"Customer");
    const kindLabel=order.kind==="gift"?"Gift":"Pantry";
    return `<tr>
      <td><div class="order-code-cell"><b>${esc(order.reference)}</b><small>${kindLabel} · WhatsApp code</small></div></td>
      <td><div class="order-customer-cell"><b>${esc(customer)}</b><small>${esc(order.area||"Area not supplied")}</small></div></td>
      <td><div class="order-items-cell"><b>${esc(orderItemSummary(order))}</b><small>${Array.isArray(order.items)?order.items.reduce((n,i)=>n+(Number(i.qty)||0),0):0} total items</small></div></td>
      <td><b>${money(order.total)}</b></td>
      <td>${orderStatusSelect(order)}</td>
      <td><div class="order-date-cell"><b>${esc(when(order.submitted_at))}</b><small>${esc(new Date(order.submitted_at).toLocaleString([], {month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}))}</small></div></td>
      <td><button class="row-action" type="button" data-view-order="${esc(order.reference)}">Details</button></td>
    </tr>`;
  }

  function orderCardHtml(order) {
    const extra=order.extra||{};
    const customer=order.kind==="gift"?(extra.recipient||order.customer_name||"Gift order"):(order.customer_name||"Customer");
    return `<article class="order-mobile-card">
      <div class="order-mobile-head"><div><b>${esc(order.reference)}</b><small>${order.kind==="gift"?"Gift":"Pantry order"} · ${esc(when(order.submitted_at))}</small></div><strong>${money(order.total)}</strong></div>
      <p><b>${esc(customer)}</b> · ${esc(order.area||"Area not supplied")}</p>
      <p>${esc(orderItemSummary(order))}</p>
      ${orderStatusSelect(order)}
      <button class="button-secondary order-details-button" type="button" data-view-order="${esc(order.reference)}">View full order & history</button>
    </article>`;
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
    $("orderDetailKind").textContent=order.kind==="gift"?"Gift order":"Pantry order";
    $("orderDetailLanguage").textContent=order.language==="ar"?"Arabic order":"English order";
    $("orderDetailTotal").textContent=money(order.total);
    $("orderDetailStatus").innerHTML=orderStatusSelect(order,"order-detail-status-select");
    $("orderDetailItemCount").textContent=`${items.reduce((n,i)=>n+(Number(i.qty)||0),0)} item${items.reduce((n,i)=>n+(Number(i.qty)||0),0)===1?"":"s"}`;
    $("orderDetailItems").innerHTML=items.map((item,i)=>`
      <div class="order-detail-item">
        <span>${i+1}</span>
        <div><b>${esc(item.name||item.product_id||"Item")}</b><small>${esc(item.size||"")} · Qty ${Number(item.qty)||1}</small></div>
        <strong>${money(item.subtotal ?? ((Number(item.unit_price)||0)*(Number(item.qty)||1)))}</strong>
      </div>`).join("")||'<p class="empty-state">No item details stored.</p>';
    $("orderDetailNotes").textContent=order.notes||"No notes.";
    $("orderGiftDetails").hidden=order.kind!=="gift";
    if(order.kind==="gift"){
      const fields=[
        ["Recipient",extra.recipient],["Occasion",extra.occasion],["Packing",extra.packing],
        ["Theme",extra.theme],["Card language",extra.card_language],
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
      toast("WhatsApp order code copied.");
    }catch{
      toast("Could not copy the order code.","error");
    }
  }

  async function updateOrderStatus(reference,status) {
    if(!ORDER_STATUS_LABELS[status])return;
    const order=state.orders.find(o=>o.reference===reference);
    if(!order||order.status===status)return;
    const now=new Date().toISOString();
    const history=Array.isArray(order.status_history)?clone(order.status_history):[];
    history.push({status,previous:order.status,at:now,source:"owner"});
    const patch={status,updated_at:now,status_history:history};
    if(status==="confirmed")patch.confirmed_at=now;
    if(status==="out_for_delivery")patch.out_for_delivery_at=now;
    if(status==="delivered")patch.delivered_at=now;
    if(status==="cancelled")patch.cancelled_at=now;
    const {error}=await state.client.from(cfg.tables.orders||"orders").update(patch).eq("reference",reference);
    if(error){toast(error.message||"Could not update order.","error");await refreshAll();return;}
    await logActivity("update_delivery_status","order",reference,{from:order.status,status});
    toast(`${reference}: ${ORDER_STATUS_LABELS[status]}`);
    await refreshAll();
    if(state.selectedOrderReference===reference)openOrderDetails(reference);
  }

  function exportOrders() {
    downloadJson(`zwm-orders-${new Date().toISOString().slice(0,10)}.json`,state.orders);
  }

  function renderOverview() {
    const ev7 = eventsWithin(7);
    const views = ev7.filter(e=>e.event_name==="page_view");
    const sessions = new Set(ev7.map(e=>e.session_id).filter(Boolean));
    const whats = ev7.filter(e=>e.event_name==="whatsapp_click");
    $("metricViews").textContent = views.length.toLocaleString();
    $("metricSessions").textContent = sessions.size.toLocaleString();
    $("metricWhatsApp").textContent = whats.length.toLocaleString();
    $("metricProducts").textContent = visibleProducts().length.toLocaleString();
    $("metricViewsHint").textContent = `${Math.round(views.length/7)} avg / day`;
    $("metricSessionsHint").textContent = sessions.size ? `${(views.length/sessions.size).toFixed(1)} views / session` : "No session data yet";
    $("metricProductsHint").textContent = `${state.products.length-visibleProducts().length} hidden or draft`;

    const missing = state.products.filter(p=>!photoFor(p) && !["hidden","draft"].includes(p.__status)).length;
    const hidden = state.products.filter(p=>p.__status==="hidden").length;
    const drafts = state.products.filter(p=>p.__status==="draft").length;
    $("missingPhotosCount").textContent = missing;
    $("hiddenProductsCount").textContent = hidden;
    $("draftProductsCount").textContent = drafts;

    renderBarChart($("overviewChart"), dailyCounts(ev7,7,"page_view"));
    renderRankList($("topPagesList"), rankBy(views, e=>cleanPath(e.page_path)).slice(0,5), "views");
    renderRecentActivity();
  }

  function eventsWithin(days) {
    const min = Date.now() - days*86400000;
    return state.events.filter(e => new Date(e.created_at).getTime() >= min);
  }
  function cleanPath(path) {
    const p=safeText(path)||"/";
    return p.replace(/\/index\.html$/,"/").replace(/^\//,"") || "Home";
  }
  function dailyCounts(events, days, eventName) {
    const out=[];
    for(let i=days-1;i>=0;i--){
      const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-i);
      const next=new Date(d); next.setDate(next.getDate()+1);
      const value=events.filter(e=>(!eventName||e.event_name===eventName)&&new Date(e.created_at)>=d&&new Date(e.created_at)<next).length;
      out.push({label:d.toLocaleDateString(undefined,{weekday:"short"}),value,date:d});
    }
    return out;
  }
  function rankBy(list,keyFn) {
    const map=new Map();
    for(const item of list){const k=keyFn(item); if(k) map.set(k,(map.get(k)||0)+1);}
    return [...map].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value);
  }
  function renderBarChart(root,data) {
    if(!root)return;
    const max=Math.max(1,...data.map(d=>d.value));
    root.innerHTML=data.map(d=>`<div class="chart-col"><div class="chart-bar" style="height:${Math.max(4,Math.round((d.value/max)*92))}%"><span>${d.value}</span></div><small>${esc(d.label)}</small></div>`).join("");
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
  }

  function renderAnalytics() {
    const days=Number($("analyticsRange").value||7);
    const events=eventsWithin(days);
    const views=events.filter(e=>e.event_name==="page_view");
    const sessions=new Set(events.map(e=>e.session_id).filter(Boolean));
    const adds=events.filter(e=>e.event_name==="add_to_cart");
    const whats=events.filter(e=>e.event_name==="whatsapp_click");
    $("analyticsViews").textContent=views.length.toLocaleString();
    $("analyticsSessions").textContent=sessions.size.toLocaleString();
    $("analyticsAdds").textContent=adds.length.toLocaleString();
    $("analyticsWhatsApp").textContent=whats.length.toLocaleString();
    $("analyticsViewsSub").textContent=`${days} day period`;
    $("analyticsSessionsSub").textContent=sessions.size? `${(views.length/sessions.size).toFixed(1)} views / session`:"No sessions yet";
    renderBarChart($("analyticsChart"),dailyCounts(events,Math.min(days,30),"page_view"));
    renderRankList($("analyticsPages"),rankBy(views,e=>cleanPath(e.page_path)).slice(0,8),"views");
    const productViews=events.filter(e=>e.event_name==="product_view"&&e.meta?.product_id);
    const ranked=rankBy(productViews,e=>e.meta?.product_id).slice(0,8).map(r=>({...r,label:state.products.find(p=>p.id===r.label)?.nameEn||r.label}));
    renderRankList($("analyticsProducts"),ranked,"product views");
    $("intentBreakdown").innerHTML=[
      ["Product views",productViews.length],
      ["Add to pantry",adds.length],
      ["WhatsApp clicks",whats.length],
      ["Searches",events.filter(e=>e.event_name==="search").length]
    ].map(([label,value])=>`<div class="intent-card"><strong>${value.toLocaleString()}</strong><span>${esc(label)}</span></div>`).join("");
  }

  function renderActivity() {
    const root=$("activityTimeline");
    if(!state.activity.length){root.innerHTML='<p class="empty-state">No owner changes have been logged yet.</p>';return;}
    root.innerHTML=state.activity.map(a=>`<div class="timeline-row"><time>${esc(new Date(a.created_at).toLocaleString([], {month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}))}</time><span class="timeline-marker"></span><div class="timeline-copy"><b>${esc(activityLabel(a))}</b><p>${esc([a.target_type,a.target_id].filter(Boolean).join(" · "))}</p></div></div>`).join("");
  }

  function renderSettings() {
    $("backendDatabase").textContent = state.overrides instanceof Map ? "Connected" : "Unavailable";
    $("backendAnalytics").textContent = "Connected";
    $("backendStorage").textContent = "Configured";
    const badge=$("backendStatusBadge");
    badge.textContent="Connected"; badge.className="status-badge status-live";
  }

  function setView(view) {
    state.activeView=view;
    $$(".dashboard-view").forEach(p=>p.classList.toggle("is-active",p.dataset.viewPanel===view));
    $$(".admin-nav button").forEach(b=>b.classList.toggle("is-active",b.dataset.view===view));
    const titles={overview:"Overview",products:"Products",orders:"Orders & history",content:"Website content",analytics:"Analytics",activity:"Activity",settings:"Settings"};
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
    const rows=[
      {key:"announcement",value:{enabled:$("announcementEnabled").checked,en:$("announcementEn").value.trim(),ar:$("announcementAr").value.trim()}},
      {key:"contact",value:{whatsapp:$("contentWhatsApp").value.replace(/\D/g,"")}},
      {key:"promo",value:{enabled:$("promoEnabled").checked,titleEn:$("promoTitleEn").value.trim(),titleAr:$("promoTitleAr").value.trim(),bodyEn:$("promoBodyEn").value.trim(),bodyAr:$("promoBodyAr").value.trim()}}
    ].map(r=>({...r,updated_by:state.user.id,updated_at:new Date().toISOString()}));
    setStatus($("contentStatus"),"Saving…");
    const {error}=await state.client.from(cfg.tables.settings).upsert(rows,{onConflict:"key"});
    if(error){setStatus($("contentStatus"),error.message,"error");return;}
    await logActivity("update_site_content","site_settings","public",{keys:rows.map(r=>r.key)});
    setStatus($("contentStatus"),"Saved and published.","success");
    toast("Website content saved.");
    await refreshAll();
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
    const {x,y,zoom}=state.imagePosition;
    img.style.objectPosition=`${x}% ${y}%`;
    img.style.transform=`scale(${zoom/100})`;
    img.style.transformOrigin=`${x}% ${y}%`;
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
    const radio=$(`input[name="productVisibility"][value="${status==="draft"?"draft":status==="hidden"?"hidden":"live"}"]`);
    if(radio)radio.checked=true;
    const photo=p?photoFor(p):null;
    $("existingImageUrl").value=photo?.url||"";
    $("existingImageWidth").value=photo?.width||"";
    $("existingImageHeight").value=photo?.height||"";
    renderImagePreview(photo?.url||"");
    setImageFraming(photo?.positionX??50,photo?.positionY??50,photo?.zoom??100);
    setImageRemoved(!!p?.photoRemoved || !photo);
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
    setImageFraming(50,50,100);
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
      zoom:Math.round(state.imagePosition.zoom)
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
      const payload={
        id,category,
        nameEn:$("productNameEn").value.trim(),
        nameAr:$("productNameAr").value.trim(),
        original:$("productOriginal").value.trim()||$("productNameEn").value.trim().toUpperCase(),
        variants,status:visibility,
        photoRemoved:$("imageRemoved").value==="1",
        image:image||null
      };
      const row={product_id:id,action:"upsert",payload,updated_at:new Date().toISOString(),updated_by:state.user.id};
      const {error}=await state.client.from(cfg.tables.products).upsert(row,{onConflict:"product_id"});
      if(error)throw error;
      await logActivity(originalId?"update_product":"create_product","product",id,{status:visibility,category});
      toast(originalId?"Product updated.":"Product added.");
      closeProductEditor();
      await refreshAll();
    }catch(err){
      setStatus($("productFormStatus"),err.message||"Could not save product.","error");
      toast(err.message||"Could not save product.","error");
    }finally{$("saveProductButton").disabled=false;}
  }

  async function hideCurrentProduct() {
    const id=state.editingId;if(!id)return;
    const p=state.products.find(x=>x.id===id);if(!p)return;
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
  }

  function applyHealthFilter(type) {
    setView("products");
    $("productStatusFilter").value=type;
    state.productFilter.status=type;
    renderProducts();
  }

  async function runHealthCheck() {
    const badge=$("backendStatusBadge");
    badge.textContent="Checking";badge.className="status-badge";
    const [db,storage]=await Promise.all([
      state.client.from(cfg.tables.products).select("product_id",{head:true,count:"exact"}).limit(1),
      state.client.storage.from(cfg.storageBucket).list("",{limit:1})
    ]);
    $("backendDatabase").textContent=db.error?"Error":"Connected";
    $("backendStorage").textContent=storage.error?"Error":"Connected";
    $("backendAnalytics").textContent="Connected";
    const ok=!db.error&&!storage.error;
    badge.textContent=ok?"Healthy":"Needs attention";badge.className="status-badge "+(ok?"status-live":"status-hidden");
    toast(ok?"Backend health check passed.":"One backend service needs attention.",ok?"":"error");
  }

  function exportOverrides() {
    downloadJson(`zwm-product-changes-${new Date().toISOString().slice(0,10)}.json`,[...state.overrides.values()]);
  }
  function exportBackup() {
    downloadJson(`zwm-dashboard-backup-${new Date().toISOString().slice(0,10)}.json`,{
      exportedAt:new Date().toISOString(),
      productOverrides:[...state.overrides.values()],
      siteSettings:Object.fromEntries(state.settings),
      orders:state.orders
    });
  }

  function bindStaticUi() {
    $$("[data-admin-lang]").forEach(btn=>btn.addEventListener("click",()=>chooseAdminLanguage(btn.dataset.adminLang)));
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
    $("quickAddProduct")?.addEventListener("click",()=>openProductEditor());
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
    bindImageDrag();
    $("deleteProductButton")?.addEventListener("click",deleteCurrentProduct);
    $("hideProductButton")?.addEventListener("click",hideCurrentProduct);
    $("restoreProductButton")?.addEventListener("click",restoreCurrentProduct);
    $("contentForm")?.addEventListener("submit",saveContent);
    $("productSearch")?.addEventListener("input",e=>{state.productFilter.q=e.target.value;renderProducts();});
    $("productCategoryFilter")?.addEventListener("change",e=>{state.productFilter.category=e.target.value;renderProducts();});
    $("productStatusFilter")?.addEventListener("change",e=>{state.productFilter.status=e.target.value;renderProducts();});
    $("productTableBody")?.addEventListener("click",e=>{const b=e.target.closest("[data-edit-product]");if(b)openProductEditor(b.dataset.editProduct);});
    $("productCardsMobile")?.addEventListener("click",e=>{const b=e.target.closest("[data-edit-product]");if(b)openProductEditor(b.dataset.editProduct);});
    $$("[data-order-scope]").forEach(btn=>btn.addEventListener("click",()=>{state.orderScope=btn.dataset.orderScope;renderOrders();}));
    $("orderSearch")?.addEventListener("input",e=>{state.orderFilter.q=e.target.value;renderOrders();});
    $("orderStatusFilter")?.addEventListener("change",e=>{state.orderFilter.status=e.target.value;renderOrders();});
    $("orderKindFilter")?.addEventListener("change",e=>{state.orderFilter.kind=e.target.value;renderOrders();});
    const orderStatusHandler=e=>{const select=e.target.closest("[data-order-status]");if(select)updateOrderStatus(select.dataset.orderStatus,select.value);};
    $("orderTableBody")?.addEventListener("change",orderStatusHandler);
    $("orderCardsMobile")?.addEventListener("change",orderStatusHandler);
    const orderDetailsHandler=e=>{const btn=e.target.closest("[data-view-order]");if(btn)openOrderDetails(btn.dataset.viewOrder);};
    $("orderTableBody")?.addEventListener("click",orderDetailsHandler);
    $("orderCardsMobile")?.addEventListener("click",orderDetailsHandler);
    $("orderDetailStatus")?.addEventListener("change",orderStatusHandler);
    $("closeOrderModal")?.addEventListener("click",closeOrderDetails);
    $("orderModal")?.addEventListener("click",e=>{if(e.target===$("orderModal"))closeOrderDetails();});
    $("copyOrderCode")?.addEventListener("click",copyOrderCode);
    $("exportOrdersButton")?.addEventListener("click",exportOrders);
    $("analyticsRange")?.addEventListener("change",renderAnalytics);
    $("healthMissingPhotos")?.addEventListener("click",()=>applyHealthFilter("missing-photo"));
    $("healthHiddenProducts")?.addEventListener("click",()=>applyHealthFilter("hidden"));
    $("healthDraftProducts")?.addEventListener("click",()=>applyHealthFilter("draft"));
    $("exportProductsButton")?.addEventListener("click",exportOverrides);
    $("exportBackupButton")?.addEventListener("click",exportBackup);
    $("runHealthCheck")?.addEventListener("click",runHealthCheck);
    document.addEventListener("keydown",e=>{
      if(e.key!=="Escape")return;
      if($("adminSidebar")?.classList.contains("is-open")){closeSidebar();return;}
      if(!$("productModal")?.hidden)closeProductEditor();
      else if(!$("orderModal")?.hidden)closeOrderDetails();
    });
    window.addEventListener("resize",()=>{
      if(window.innerWidth>900&&$("adminSidebar")?.classList.contains("is-open"))closeSidebar();
      if(window.innerWidth>900)$("adminSidebar")?.setAttribute("aria-hidden","false");
      else if(!$("adminSidebar")?.classList.contains("is-open"))$("adminSidebar")?.setAttribute("aria-hidden","true");
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

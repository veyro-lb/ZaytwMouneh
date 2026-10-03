(() => {
  "use strict";

  const cfg = window.ZWM_CMS_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  const clone = (v) => typeof structuredClone === "function" ? structuredClone(v) : JSON.parse(JSON.stringify(v));
  const baseProducts = typeof PRODUCTS_DATA !== "undefined" ? clone(PRODUCTS_DATA) : [];
  const baseById = new Map(baseProducts.map(p => [p.id, p]));
  const basePhotoMap = window.ZWM_PRODUCT_PHOTOS?.map || {};
  const state = {
    client: null, user: null, membership: null,
    overrides: new Map(), settings: new Map(), events: [], activity: [], orders: [],
    products: [], editingId: null, imageFile: null, imageDims: null,
    activeView: "overview", productFilter: { q:"", category:"", status:"" },
    orderFilter: { q:"", status:"", kind:"" }
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

  async function init() {
    bindStaticUi();
    if (!enabled()) {
      showOnly("setupScreen");
      return;
    }
    state.client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey, {
      auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
    });

    const { data, error } = await state.client.auth.getUser();
    if (error || !data?.user) {
      showOnly("loginScreen");
      return;
    }
    await enterAs(data.user);
  }

  async function enterAs(user) {
    state.user = user;
    const { data, error } = await state.client
      .from(cfg.tables.admins)
      .select("user_id,label")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) {
      await state.client.auth.signOut();
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

  async function refreshAll() {
    const since = new Date(Date.now() - 90*86400000).toISOString();
    const [overridesRes, settingsRes, eventsRes, activityRes, ordersRes] = await Promise.all([
      state.client.from(cfg.tables.products).select("*").order("updated_at",{ascending:false}),
      state.client.from(cfg.tables.settings).select("*"),
      state.client.from(cfg.tables.events).select("*").gte("created_at",since).order("created_at",{ascending:false}).limit(10000),
      state.client.from(cfg.tables.activity).select("*").order("created_at",{ascending:false}).limit(300),
      state.client.from(cfg.tables.orders || "orders").select("*").order("submitted_at",{ascending:false}).limit(1000)
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
      return {
        ...clone(base), ...clone(payload),
        id: base.id,
        variants: Array.isArray(payload.variants) ? clone(payload.variants) : clone(base.variants || []),
        __status: payload.status || (row.action==="hide" ? "hidden" : "live"),
        __source:"edited", __updated:row.updated_at
      };
    });
    for (const [id,row] of state.overrides) {
      if (baseById.has(id) || row.action==="hide") continue;
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
  }

  function populateCategoryControls() {
    const categories = [...new Set(state.products.map(p => p.category).filter(Boolean))].sort();
    const filter = $("productCategoryFilter");
    const current = filter.value;
    filter.innerHTML = '<option value="">All categories</option>' + categories.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("");
    filter.value = categories.includes(current) ? current : "";
    const editor = $("productCategory");
    const editorCurrent = editor.value;
    editor.innerHTML = categories.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("") + '<option value="__new">+ New category…</option>';
    if (categories.includes(editorCurrent)) editor.value = editorCurrent;
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
      <td>${esc(p.category||"—")}</td>
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
      <div><b>${esc(p.nameEn||p.id)}</b><p>${esc(p.category||"—")} · <span class="status-badge status-${st}">${st}</span></p></div>
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

  function renderOrders() {
    const {q,status,kind}=state.orderFilter;
    const term=q.trim().toLowerCase();
    const list=state.orders.filter(order=>{
      if(status&&order.status!==status)return false;
      if(kind&&order.kind!==kind)return false;
      if(term&&!orderSearchText(order).includes(term))return false;
      return true;
    });

    const active=state.orders.filter(o=>!["delivered","cancelled"].includes(o.status)).length;
    $("navOrderCount").textContent=active;
    $("ordersNewCount").textContent=state.orders.filter(o=>o.status==="new").length;
    $("ordersPreparingCount").textContent=state.orders.filter(o=>["confirmed","preparing"].includes(o.status)).length;
    $("ordersOutCount").textContent=state.orders.filter(o=>o.status==="out_for_delivery").length;
    $("ordersDeliveredCount").textContent=state.orders.filter(o=>o.status==="delivered").length;
    $("orderResultCount").textContent=`${list.length} order${list.length===1?"":"s"}`;

    $("orderTableBody").innerHTML=list.map(orderRowHtml).join("")||'<tr><td colspan="6"><p class="empty-state">No orders match these filters.</p></td></tr>';
    $("orderCardsMobile").innerHTML=list.map(orderCardHtml).join("")||'<p class="empty-state">No orders match these filters.</p>';
  }

  function orderStatusSelect(order) {
    return `<select class="order-status-select status-${esc(order.status)}" data-order-status="${esc(order.reference)}" aria-label="Status for ${esc(order.reference)}">${Object.entries(ORDER_STATUS_LABELS).map(([value,label])=>`<option value="${value}" ${order.status===value?"selected":""}>${label}</option>`).join("")}</select>`;
  }

  function orderRowHtml(order) {
    const extra=order.extra||{};
    const customer=order.kind==="gift"?(extra.recipient||order.customer_name||"Gift order"):(order.customer_name||"Customer");
    const kindLabel=order.kind==="gift"?"Gift":"Pantry";
    return `<tr>
      <td><div class="order-code-cell"><b>${esc(order.reference)}</b><small>${kindLabel}</small></div></td>
      <td><div class="order-customer-cell"><b>${esc(customer)}</b><small>${esc(order.area||"Area not supplied")}</small></div></td>
      <td><div class="order-items-cell"><b>${esc(orderItemSummary(order))}</b><small>${Array.isArray(order.items)?order.items.reduce((n,i)=>n+(Number(i.qty)||0),0):0} total items</small></div></td>
      <td><b>${money(order.total)}</b></td>
      <td>${orderStatusSelect(order)}</td>
      <td><div class="order-date-cell"><b>${esc(when(order.submitted_at))}</b><small>${esc(new Date(order.submitted_at).toLocaleString([], {month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}))}</small></div></td>
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
    </article>`;
  }

  async function updateOrderStatus(reference,status) {
    if(!ORDER_STATUS_LABELS[status])return;
    const now=new Date().toISOString();
    const patch={status,updated_at:now};
    if(status==="confirmed")patch.confirmed_at=now;
    if(status==="out_for_delivery")patch.out_for_delivery_at=now;
    if(status==="delivered")patch.delivered_at=now;
    if(status==="cancelled")patch.cancelled_at=now;
    const {error}=await state.client.from(cfg.tables.orders||"orders").update(patch).eq("reference",reference);
    if(error){toast(error.message||"Could not update order.","error");await refreshAll();return;}
    await logActivity("update_delivery_status","order",reference,{status});
    toast(`${reference}: ${ORDER_STATUS_LABELS[status]}`);
    await refreshAll();
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
    const titles={overview:"Overview",products:"Products",orders:"Orders & deliveries",content:"Website content",analytics:"Analytics",activity:"Activity",settings:"Settings"};
    $("viewTitle").textContent=titles[view]||"Owner Console";
    closeSidebar();
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function openSidebar(){ $("adminSidebar").classList.add("is-open"); $("sidebarBackdrop").hidden=false; }
  function closeSidebar(){ $("adminSidebar").classList.remove("is-open"); $("sidebarBackdrop").hidden=true; }

  async function handleLogin(e) {
    e.preventDefault();
    const email=$("loginEmail").value.trim(), password=$("loginPassword").value;
    setStatus($("loginStatus"),"Signing in…");
    $("loginButton").disabled=true;
    const {data,error}=await state.client.auth.signInWithPassword({email,password});
    $("loginButton").disabled=false;
    if(error||!data?.user){setStatus($("loginStatus"),error?.message||"Sign-in failed.","error");return;}
    await enterAs(data.user);
  }

  async function signOut() {
    if(state.client) await state.client.auth.signOut();
    state.user=null; state.membership=null;
    showOnly("loginScreen");
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

  function openProductEditor(id=null) {
    state.editingId=id;
    state.imageFile=null; state.imageDims=null;
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
    $("hideProductButton").hidden=!p||status==="hidden";
    $("restoreProductButton").hidden=!p||!state.overrides.has(p.id);
    $("productModal").hidden=false;
    document.body.style.overflow="hidden";
  }

  function closeProductEditor() {
    $("productModal").hidden=true; document.body.style.overflow="";
    state.editingId=null; state.imageFile=null; state.imageDims=null;
  }
  function renderImagePreview(url) {
    $("imagePreview").innerHTML=url?`<img src="${esc(url)}" alt="Product preview">`:"<span>No photo</span>";
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
      state.imageFile=file; state.imageDims={width:dims.width,height:dims.height};
      renderImagePreview(dims.url);
    }catch(err){toast(err.message,"error");}
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
    if(!state.imageFile) {
      const url=$("existingImageUrl").value;
      return url?{url,width:Number($("existingImageWidth").value)||1200,height:Number($("existingImageHeight").value)||1200}:null;
    }
    const ext=(state.imageFile.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"");
    const path=`products/${productId}/${Date.now()}-${slugify(state.imageFile.name.replace(/\.[^.]+$/,""))||"image"}.${ext}`;
    const {error}=await state.client.storage.from(cfg.storageBucket).upload(path,state.imageFile,{cacheControl:"31536000",upsert:false,contentType:state.imageFile.type});
    if(error)throw error;
    const {data}=state.client.storage.from(cfg.storageBucket).getPublicUrl(path);
    return {url:data.publicUrl,width:state.imageDims?.width||1200,height:state.imageDims?.height||1200,path};
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
        category=prompt("New category name:")?.trim();
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
        ...(image?{image}: {})
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
      siteSettings:Object.fromEntries(state.settings)
    });
  }

  function bindStaticUi() {
    $("loginForm")?.addEventListener("submit",handleLogin);
    $("signOutButton")?.addEventListener("click",signOut);
    $("settingsSignOut")?.addEventListener("click",signOut);
    $("refreshButton")?.addEventListener("click",()=>refreshAll().then(()=>toast("Dashboard refreshed.")));
    $("mobileMenuButton")?.addEventListener("click",openSidebar);
    $("sidebarClose")?.addEventListener("click",closeSidebar);
    $("sidebarBackdrop")?.addEventListener("click",closeSidebar);
    $$("#adminNav button").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
    $$("[data-jump-view]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.jumpView)));
    $("quickAddProduct")?.addEventListener("click",()=>openProductEditor());
    $("addProductButton")?.addEventListener("click",()=>openProductEditor());
    $("closeProductModal")?.addEventListener("click",closeProductEditor);
    $("cancelProductButton")?.addEventListener("click",closeProductEditor);
    $("productModal")?.addEventListener("click",e=>{if(e.target===$("productModal"))closeProductEditor();});
    $("productForm")?.addEventListener("submit",saveProduct);
    $("addVariantButton")?.addEventListener("click",()=>variantRow({}));
    $("variantRows")?.addEventListener("click",e=>{const b=e.target.closest("[data-remove-variant]");if(b&&$$(".variant-row").length>1)b.closest(".variant-row").remove();});
    $("productImage")?.addEventListener("change",onImageSelected);
    $("hideProductButton")?.addEventListener("click",hideCurrentProduct);
    $("restoreProductButton")?.addEventListener("click",restoreCurrentProduct);
    $("contentForm")?.addEventListener("submit",saveContent);
    $("productSearch")?.addEventListener("input",e=>{state.productFilter.q=e.target.value;renderProducts();});
    $("productCategoryFilter")?.addEventListener("change",e=>{state.productFilter.category=e.target.value;renderProducts();});
    $("productStatusFilter")?.addEventListener("change",e=>{state.productFilter.status=e.target.value;renderProducts();});
    $("productTableBody")?.addEventListener("click",e=>{const b=e.target.closest("[data-edit-product]");if(b)openProductEditor(b.dataset.editProduct);});
    $("productCardsMobile")?.addEventListener("click",e=>{const b=e.target.closest("[data-edit-product]");if(b)openProductEditor(b.dataset.editProduct);});
    $("orderSearch")?.addEventListener("input",e=>{state.orderFilter.q=e.target.value;renderOrders();});
    $("orderStatusFilter")?.addEventListener("change",e=>{state.orderFilter.status=e.target.value;renderOrders();});
    $("orderKindFilter")?.addEventListener("change",e=>{state.orderFilter.kind=e.target.value;renderOrders();});
    const orderStatusHandler=e=>{const select=e.target.closest("[data-order-status]");if(select)updateOrderStatus(select.dataset.orderStatus,select.value);};
    $("orderTableBody")?.addEventListener("change",orderStatusHandler);
    $("orderCardsMobile")?.addEventListener("change",orderStatusHandler);
    $("exportOrdersButton")?.addEventListener("click",exportOrders);
    $("analyticsRange")?.addEventListener("change",renderAnalytics);
    $("healthMissingPhotos")?.addEventListener("click",()=>applyHealthFilter("missing-photo"));
    $("healthHiddenProducts")?.addEventListener("click",()=>applyHealthFilter("hidden"));
    $("healthDraftProducts")?.addEventListener("click",()=>applyHealthFilter("draft"));
    $("exportProductsButton")?.addEventListener("click",exportOverrides);
    $("exportBackupButton")?.addEventListener("click",exportBackup);
    $("runHealthCheck")?.addEventListener("click",runHealthCheck);
    document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("productModal")?.hidden)closeProductEditor();});
  }

  init().catch(err => {
    console.error(err);
    if (enabled()) {
      showOnly("loginScreen");
      setStatus($("loginStatus"),"Dashboard initialization failed. Check the backend connection.","error");
    } else showOnly("setupScreen");
  });
})();

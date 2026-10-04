CREATE OR REPLACE FUNCTION mouneh.api(action text, p jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare u uuid:=auth.uid(); m mouneh.members; r mouneh.rewards; w mouneh.wallet; prod jsonb; v jsonb; item jsonb; clean jsonb:='[]'; ref text; claim text; sub numeric:=0; weighted numeric:=0; price numeric; qty integer; boost numeric; disc numeric:=0; rate numeric; admin boolean; target uuid; n integer; rr record;
begin
 admin:=u is not null and exists(select 1 from public.admin_users where user_id=u);
 if action='public' then return jsonb_build_object('rewards',(select coalesce(jsonb_agg(to_jsonb(x) order by points),'[]') from mouneh.rewards x where active),'campaigns',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from mouneh.campaigns x where active and now() between starts_at and ends_at),'config',(select to_jsonb(c) from mouneh.config c)); end if;
 if action like 'admin_%' and not admin then raise exception 'Owner access required'; end if;
 if action='admin_data' then return jsonb_build_object('members',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from(select mem.*,mouneh.spend(mem.user_id) annual_spend,mouneh.tier(mem.user_id) tier from mouneh.members mem order by mem.created_at desc)x),'ledger',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from(select * from mouneh.ledger order by created_at desc limit 500)x),'wallet',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from mouneh.wallet x),'rewards',(select jsonb_agg(to_jsonb(x) order by points) from mouneh.rewards x),'campaigns',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from mouneh.campaigns x),'config',(select to_jsonb(c) from mouneh.config c),'reviews',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from mouneh.reviews x)); end if;
 if action='admin_adjust' then
  target:=(p->>'user_id')::uuid; n:=(p->>'points')::integer;
  if n=0 or abs(n)>10000 or length(trim(p->>'reason'))<3 then raise exception 'Enter a reason and between -10000 and 10000 points'; end if;
  perform 1 from mouneh.members where user_id=target for update; if not found then raise exception 'Member not found'; end if;
  perform mouneh.credit(target,n,left(p->>'reason',250),'adjust:'||(p->>'request_id'));
 elsif action='admin_tier' then update mouneh.members set tier_override=nullif(p->>'tier','') where user_id=(p->>'user_id')::uuid;
 elsif action='admin_reward' then
  insert into mouneh.wallet(user_id,points,value,minimum) values((p->>'user_id')::uuid,0,(p->>'value')::numeric,(p->>'minimum')::numeric) returning * into w;
  if w.value<=0 or w.value>100 or w.minimum<w.value then raise exception 'Invalid voucher value or minimum'; end if;
  perform mouneh.credit(w.user_id,0,'Owner voucher: $'||w.value||' — '||left(coalesce(p->>'reason','Thank you'),200),'gift:'||w.id);
 elsif action='admin_config' then update mouneh.config set enabled=(p->>'enabled')::boolean,base_rate=(p->>'base_rate')::numeric;
 elsif action in ('admin_reward_rule','admin_reward_create') then
  if jsonb_typeof(p->'points') is distinct from 'number' or jsonb_typeof(p->'value') is distinct from 'number' or jsonb_typeof(p->'minimum') is distinct from 'number' or jsonb_typeof(p->'active') is distinct from 'boolean' then raise exception 'Complete all reward fields'; end if;
  if (p->>'points')::numeric <> trunc((p->>'points')::numeric) or (p->>'points')::numeric not between 1 and 1000000 or (p->>'value')::numeric not between 0.01 and 1000 or (p->>'minimum')::numeric < (p->>'value')::numeric or (p->>'minimum')::numeric > 1000000 then raise exception 'Invalid reward points, discount or minimum order'; end if;
  if coalesce(p->>'id','') !~ '^[a-zA-Z0-9_-]{1,64}$' then raise exception 'Invalid reward identifier'; end if;
  perform pg_advisory_xact_lock(hashtextextended('mouneh-reward-ladder',0));
  if (p->>'active')::boolean and exists(select 1 from mouneh.rewards where active and points=(p->>'points')::integer and id<>p->>'id') then raise exception 'An active reward already uses this points level'; end if;
  if action='admin_reward_create' then
    insert into mouneh.rewards(id,points,value,minimum,active) values(p->>'id',(p->>'points')::integer,round((p->>'value')::numeric,2),round((p->>'minimum')::numeric,2),(p->>'active')::boolean);
  else
    update mouneh.rewards set points=(p->>'points')::integer,value=round((p->>'value')::numeric,2),minimum=round((p->>'minimum')::numeric,2),active=(p->>'active')::boolean where id=p->>'id';
    if not found then raise exception 'Reward no longer exists'; end if;
  end if;
 elsif action='admin_campaign' then
  if p ? 'id' then update mouneh.campaigns set active=false where id=(p->>'id')::uuid;
  else insert into mouneh.campaigns(title,title_ar,category,multiplier,starts_at,ends_at) values(left(p->>'title',100),left(coalesce(p->>'title_ar',''),100),nullif(p->>'category',''),(p->>'multiplier')::numeric,(p->>'starts_at')::timestamptz,(p->>'ends_at')::timestamptz); end if;
 elsif action='submit' then
  if nullif(p->>'request_id','') is null or length(coalesce(p->>'claim_token',''))<64 then raise exception 'Missing order request token'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p->>'request_id',0));
  select * into rr from mouneh.order_links where request_id=(p->>'request_id')::uuid;
  if found then
   if (rr.user_id is not null and rr.user_id=u) or (rr.user_id is null and rr.claim_hash=md5(p->>'claim_token')) then
    return jsonb_build_object('reference',rr.reference,'discount',rr.discount,'subtotal',rr.subtotal,'claim_token',case when rr.user_id is null then p->>'claim_token' else null end,'pending_points',floor(rr.weighted_subtotal*(1-rr.discount/nullif(rr.subtotal,0))));
   end if;
   raise exception 'Order request already used';
  end if;
  select base_rate into rate from mouneh.config where enabled; rate:=coalesce(rate,0);
  if jsonb_typeof(p->'items')<>'array' or jsonb_array_length(p->'items') not between 1 and 100 then raise exception 'Invalid basket'; end if;
  if u is not null then select * into m from mouneh.members where user_id=u for update; end if;
  for item in select value from jsonb_array_elements(p->'items') loop
   select c.payload into prod from mouneh.catalog c where c.product_id=item->>'product_id';
   select coalesce(prod,'{}'::jsonb)||o.payload||jsonb_build_object('_action',o.action) into prod from public.product_overrides o where product_id=item->>'product_id';
   if not found then select payload into prod from mouneh.catalog where product_id=item->>'product_id'; end if;
   if prod is null or prod->>'_action'='hide' or prod->>'status' in ('draft','hidden') or coalesce(prod->>'availability','in_stock')<>'in_stock' or prod->>'deleted'='true' then raise exception 'An item is no longer available. Refresh your basket.'; end if;
   select value into v from jsonb_array_elements(prod->'variants') where value->>'id'=item->>'variant_id' or (not(item ? 'variant_id') and value->>'sizeEn'=item->>'size') limit 1;
   if v is null then raise exception 'A size has changed. Refresh your basket.'; end if;
   qty:=(item->>'qty')::integer; price:=(v->>'price')::numeric;
   if qty not between 1 and 999 or price<0 then raise exception 'Invalid quantity or price'; end if;
   select greatest(1,coalesce(max(multiplier),1)) into boost from mouneh.campaigns where active and now() between starts_at and ends_at and (category is null or category=prod->>'category');
   sub:=sub+price*qty; weighted:=weighted+price*qty*boost*rate;
   clean:=clean||jsonb_build_array(jsonb_build_object('product_id',prod->>'id','variant_id',v->>'id','name',prod->>'nameEn','size',v->>'sizeEn','qty',qty,'unit_price',price,'subtotal',price*qty));
  end loop;
  if abs(sub-coalesce((p->'extra'->>'products_subtotal')::numeric,sub))>0.01 then raise exception 'Prices changed. Refresh your basket before ordering.'; end if;
  if nullif(p->>'wallet_id','') is not null then
   if m.user_id is null then raise exception 'Sign in to use a reward'; end if;
   select * into w from mouneh.wallet where id=(p->>'wallet_id')::uuid and user_id=u for update;
   if not found or w.status<>'available' or sub<w.minimum then raise exception 'Reward unavailable or basket below minimum'; end if;
   disc:=w.value;
  end if;
  ref:='ZW'||case when p->>'kind'='gift' then '-GIFT' else '' end||'-'||to_char(now(),'YYMMDDHH24MI')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,4));
  claim:=p->>'claim_token';
  insert into public.orders(reference,kind,status,customer_name,customer_phone,area,notes,items,total,language,extra)
  values(ref,case when p->>'kind'='gift' then 'gift' else 'order' end,'new',left(coalesce(p->>'customer_name',''),120),left(coalesce(p->>'customer_phone',''),40),left(coalesce(p->>'area',''),180),left(coalesce(p->>'notes',''),800),clean,sub-disc+greatest(0,least(100,coalesce((p->'extra'->>'delivery_fee')::numeric,0))),case when p->>'language'='ar' then 'ar' else 'en' end,coalesce(p->'extra','{}')||jsonb_build_object('mouneh_discount',disc,'mouneh_member',m.user_id is not null,'products_subtotal',sub));
  insert into mouneh.order_links(request_id,reference,user_id,claim_hash,subtotal,discount,weighted_subtotal) values((p->>'request_id')::uuid,ref,m.user_id,case when m.user_id is null then md5(claim) else null end,sub,disc,weighted);
  if w.id is not null then update mouneh.wallet set status='reserved',order_ref=ref where id=w.id; end if;
  return jsonb_build_object('reference',ref,'discount',disc,'subtotal',sub,'claim_token',case when m.user_id is null then claim else null end,'pending_points',floor(weighted*(1-disc/nullif(sub,0))*case mouneh.tier(u) when 'golden' then 1.5 when 'olive' then 1.25 else 1 end));
 else
  if u is null or not exists(select 1 from auth.users where id=u and email_confirmed_at is not null and not is_anonymous) then raise exception 'Please sign in with a verified email'; end if;
  if action='join' then
   if not exists(select 1 from mouneh.config where enabled) then raise exception 'Rewards enrollment is currently paused'; end if;
   insert into mouneh.members(user_id,name,phone,referrer) values(u,left(coalesce(p->>'name',''),120),left(coalesce(p->>'phone',''),40),(select user_id from mouneh.members where code=upper(trim(p->>'referral')) and user_id<>u)) on conflict(user_id) do nothing;
   perform mouneh.credit(u,10,'Welcome to Mouneh Rewards','join:'||u);
  end if;
  select * into m from mouneh.members where user_id=u for update;
  if m.user_id is null then raise exception 'Join Mouneh Rewards first'; end if;
  if action='redeem' then
   if nullif(p->>'request_id','') is null then raise exception 'Missing redemption request'; end if;
   if exists(select 1 from mouneh.wallet where request_id=(p->>'request_id')::uuid and user_id=u) then return mouneh.api('dashboard','{}'); end if;
   select * into r from mouneh.rewards where id=p->>'reward_id' and active;
   if not found or m.balance<r.points then raise exception 'Not enough points for this reward'; end if;
   insert into mouneh.wallet(request_id,user_id,reward_id,points,value,minimum) values((p->>'request_id')::uuid,u,r.id,r.points,r.value,r.minimum) returning * into w;
   perform mouneh.credit(u,-r.points,'Redeemed $'||r.value||' reward','redeem:'||w.id);
  elsif action='favorites' then
   if jsonb_typeof(p->'ids')<>'array' or jsonb_array_length(p->'ids')>500 then raise exception 'Invalid favourites'; end if;
   update mouneh.members set favorites=p->'ids' where user_id=u;
  elsif action='profile' then
   if nullif(p->>'birthday','')::date>current_date then raise exception 'Birthday cannot be in the future'; end if;
   update mouneh.members set name=left(coalesce(p->>'name',name),120),phone=left(coalesce(p->>'phone',phone),40),address=left(coalesce(p->>'address',address),500),birthday=coalesce(birthday,nullif(p->>'birthday','')::date) where user_id=u;
  elsif action='claim' then
   ref:=p->>'reference';
   perform 1 from public.orders where reference=ref for update;
   update mouneh.order_links set user_id=u,claim_hash=null where reference=ref and user_id is null and claim_hash=md5(p->>'claim_token');
   if not found then raise exception 'Order already linked or claim link invalid'; end if;
   perform mouneh.settle(ref);
  elsif action='birthday' then
   if m.birthday is null or to_char(m.birthday,'MM-DD')<>to_char(now(),'MM-DD') or m.created_at>now()-interval '30 days' then raise exception 'Birthday bonus is available on your birthday, after 30 days of membership'; end if;
   perform mouneh.credit(u,25,'Birthday surprise','birthday:'||u||':'||extract(year from now()));
  elsif action='review' then
   if not exists(select 1 from mouneh.order_links l join public.orders o using(reference),jsonb_array_elements(o.items) i where l.user_id=u and o.status='delivered' and i->>'product_id'=p->>'product_id') then raise exception 'A delivered purchase is required'; end if;
   insert into mouneh.reviews(user_id,product_id,rating,body) values(u,p->>'product_id',(p->>'rating')::integer,trim(p->>'body'));
   perform mouneh.credit(u,5,'Verified purchase review','review:'||u||':'||(p->>'product_id'));
  elsif action not in ('join','dashboard') then raise exception 'Unknown action'; end if;
  return jsonb_build_object('member',(select to_jsonb(mm)||jsonb_build_object('annual_spend',mouneh.spend(u),'tier',mouneh.tier(u)) from mouneh.members mm where user_id=u),'wallet',(select coalesce(jsonb_agg(to_jsonb(x) order by created_at desc),'[]') from mouneh.wallet x where user_id=u),'ledger',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from(select points,reason,order_ref,created_at from mouneh.ledger where user_id=u order by created_at desc limit 100)x),'orders',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from(select o.reference,o.status,o.items,o.total,o.submitted_at,l.awarded,l.discount from mouneh.order_links l join public.orders o using(reference) where l.user_id=u order by o.submitted_at desc limit 100)x),'referrals',(select count(*) from mouneh.members where referrer=u));
 end if;
 if action like 'admin_%' then
  insert into public.admin_activity(actor,action,target_type,target_id,details) values(u,action,'rewards',coalesce(p->>'user_id',p->>'id','settings'),p);
 end if;
 return jsonb_build_object('ok',true);
end $function$
;

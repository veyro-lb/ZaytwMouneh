-- Fix delivery-area resolution: blank zone_id must not mask a valid typed/selected area.
create or replace function private.zwm_delivery_quote(p_subtotal numeric,p_discount numeric,p jsonb)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  d jsonb;
  zones jsonb;
  z jsonb;
  requested text;
  zone_id text;
  zone_name_en text;
  zone_name_ar text;
  fee numeric:=0;
  threshold numeric:=0;
  minimum numeric:=0;
  basis text:='before_discount';
  eligible numeric:=0;
  free_enabled boolean:=true;
  delivery_enabled boolean:=true;
  zone_active boolean:=true;
  eta_en text:='';
  eta_ar text:='';
begin
  select value into d from public.site_settings where key='delivery';
  d:=coalesce(d,'{}'::jsonb);
  delivery_enabled:=coalesce(nullif(d->>'enabled','')::boolean,true);
  if not delivery_enabled then raise exception 'Delivery is currently unavailable.'; end if;

  zones:=case when jsonb_typeof(d->'zones')='array' then d->'zones' else '[]'::jsonb end;

  requested:=trim(coalesce(
    nullif(p#>>'{delivery,zone_id}',''),
    nullif(p#>>'{delivery,area}',''),
    nullif(p->>'area',''),
    nullif(p#>>'{delivery,district}',''),
    nullif(p#>>'{delivery,governorate}',''),
    ''
  ));

  if jsonb_array_length(zones)>0 then
    select value into z
    from jsonb_array_elements(zones)
    where lower(trim(coalesce(value->>'id','')))=lower(requested)
       or lower(trim(coalesce(value->>'area','')))=lower(requested)
       or lower(trim(coalesce(value->>'name_en','')))=lower(requested)
       or lower(trim(coalesce(value->>'name_ar','')))=lower(requested)
    limit 1;
    if z is null then raise exception 'Delivery is currently unavailable in this area.'; end if;
    zone_active:=coalesce(nullif(z->>'active','')::boolean,true);
    if not zone_active then raise exception 'Delivery is currently unavailable in this area.'; end if;
  else
    if requested='' then raise exception 'Please select or enter a delivery area.'; end if;
    z:='{}'::jsonb;
  end if;

  zone_id:=coalesce(nullif(z->>'id',''),nullif(z->>'area',''),nullif(z->>'name_en',''),requested);
  zone_name_en:=coalesce(nullif(z->>'name_en',''),nullif(z->>'area',''),requested);
  zone_name_ar:=coalesce(nullif(z->>'name_ar',''),zone_name_en);
  fee:=greatest(0,coalesce(nullif(z->>'fee','')::numeric,nullif(d->>'fee','')::numeric,0));
  threshold:=greatest(0,coalesce(
    nullif(z->>'free_delivery_threshold','')::numeric,
    nullif(z->>'freeAbove','')::numeric,
    nullif(d->>'freeAbove','')::numeric,
    50
  ));
  minimum:=greatest(0,coalesce(
    nullif(z->>'minimum_order','')::numeric,
    nullif(z->>'minimum','')::numeric,
    nullif(d->>'minimum','')::numeric,
    0
  ));
  basis:=case when coalesce(z->>'eligibility_basis',d->>'eligibilityBasis','before_discount')='after_discount'
              then 'after_discount' else 'before_discount' end;
  free_enabled:=coalesce(nullif(z->>'free_enabled','')::boolean,nullif(d->>'freeEnabled','')::boolean,true);
  eligible:=case when basis='after_discount' then greatest(0,p_subtotal-p_discount) else greatest(0,p_subtotal) end;
  if eligible<minimum then
    raise exception 'Minimum order is $%.',trim(to_char(minimum,'FM999999990.00'));
  end if;
  if free_enabled and threshold>0 and eligible>=threshold then fee:=0; end if;
  eta_en:=coalesce(nullif(z->>'eta_en',''),nullif(z->>'eta',''),nullif(d->>'eta_en',''),nullif(d->>'eta',''),'');
  eta_ar:=coalesce(nullif(z->>'eta_ar',''),eta_en);

  return jsonb_build_object(
    'zone_id',zone_id,
    'zone_name_en',zone_name_en,
    'zone_name_ar',zone_name_ar,
    'fee',round(fee,2),
    'free_delivery_threshold',round(threshold,2),
    'minimum_order',round(minimum,2),
    'eligibility_basis',basis,
    'eligible_subtotal',round(eligible,2),
    'free_delivery',fee=0 and free_enabled and threshold>0 and eligible>=threshold,
    'eta_en',eta_en,
    'eta_ar',eta_ar
  );
end
$$;

notify pgrst,'reload schema';


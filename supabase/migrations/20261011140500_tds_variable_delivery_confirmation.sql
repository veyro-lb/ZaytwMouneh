-- Additive delivery confirmation: existing orders and delivery zones are untouched.
create or replace function private.zwm_stamp_delivery_estimate()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.created_source='website'
     and not (coalesce(new.extra,'{}'::jsonb) ? 'delivery_fee_confirmation') then
    new.extra := coalesce(new.extra,'{}'::jsonb) ||
      jsonb_build_object('delivery_fee_confirmation',jsonb_build_object(
        'status','pending','estimated_fee',coalesce(new.delivery_fee,0),
        'created_at',now()
      ));
  end if;
  return new;
end;
$$;
create trigger zwm_stamp_delivery_estimate
before insert or update of created_source on public.orders
for each row execute function private.zwm_stamp_delivery_estimate();

-- SECURITY INVOKER deliberately preserves existing admin-only orders RLS.
create or replace function public.zwm_admin_confirm_delivery_fee(
  p_reference text, p_fee numeric, p_customer_approved boolean, p_expected_updated_at timestamptz
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_order public.orders%rowtype;
  v_total numeric;
  v_time timestamptz := now();
  v_old_fee numeric;
begin
  if auth.uid() is null or not exists(select 1 from public.admin_users where user_id=auth.uid()) then
    raise exception 'Admin access required.' using errcode='42501';
  end if;
  if p_reference is null or length(trim(p_reference))<4 then
    raise exception 'Invalid order reference.';
  end if;
  if p_fee is null or p_fee<0 or p_fee>200 then
    raise exception 'Enter a delivery fee between $0 and $200.';
  end if;
  if p_customer_approved is distinct from true then
    raise exception 'Please confirm that the customer accepted the final delivery price.';
  end if;
  if p_expected_updated_at is null then
    raise exception 'Refresh the order before confirming its fee.';
  end if;
  select * into v_order from public.orders where reference=p_reference for update;
  if not found then raise exception 'Order not found or access denied.'; end if;
  if v_order.updated_at is distinct from p_expected_updated_at then
    raise exception 'Order changed elsewhere. Refresh and retry.';
  end if;
  if v_order.status not in ('new','confirmed','preparing') then
    raise exception 'Cannot reprice a dispatched, delivered or cancelled order.';
  end if;
  if v_order.payment_status is distinct from 'pending' then
    raise exception 'Cannot reprice after payment processing.';
  end if;
  v_old_fee := coalesce(v_order.delivery_fee,0);
  if p_fee>0 and v_order.created_source='website' and
      (v_old_fee=0 or coalesce((v_order.extra#>>'{delivery_quote,free_delivery}')::boolean,false)) then
    raise exception 'Free delivery was promised and must be honored.';
  end if;
  v_total := round(greatest(0,coalesce(v_order.total,0)-v_old_fee+p_fee),2);
  update public.orders set delivery_fee=round(p_fee,2),total=v_total,
    extra=coalesce(extra,'{}'::jsonb) || jsonb_build_object(
      'delivery_fee',round(p_fee,2),
      'delivery_fee_confirmation',jsonb_build_object(
        'status','confirmed','fee',round(p_fee,2),'previous_fee',v_old_fee,
        'customer_approved',true,'confirmed_at',v_time,'confirmed_by',auth.uid()
      )
    ),updated_at=v_time
  where reference=v_order.reference;
  insert into public.admin_activity(actor,action,target_type,target_id,details)
  values(auth.uid(),'confirm_delivery_fee','order',v_order.reference,
    jsonb_build_object('previous_fee',v_old_fee,'final_fee',round(p_fee,2),
                       'new_total',v_total,'customer_approved',true));
  return jsonb_build_object('reference',v_order.reference,'delivery_fee',round(p_fee,2),
                            'total',v_total,'confirmed_at',v_time);
end;
$$;
revoke all on function public.zwm_admin_confirm_delivery_fee(text,numeric,boolean,timestamptz) from public, anon;
grant execute on function public.zwm_admin_confirm_delivery_fee(text,numeric,boolean,timestamptz) to authenticated;

-- Expose only the delivery-confirmation state to the authorized order viewer.
CREATE OR REPLACE FUNCTION private.zwm_customer_order_payload(o orders, l mouneh.order_links, p_user uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  hist jsonb := '[]'::jsonb;
  gift jsonb := null;
  multiplier numeric := 1;
  pending integer := 0;
  base_points numeric := 0;
  item_count integer := 0;
begin
  if p_user is not null and exists(select 1 from mouneh.members where user_id=p_user) then
    multiplier := case mouneh.tier(p_user)
      when 'golden' then 1.5
      when 'olive' then 1.25
      else 1
    end;
  end if;

  if coalesce(l.subtotal,0) > 0 then
    base_points := greatest(0,coalesce(l.weighted_subtotal,0)*(1-coalesce(l.discount,0)/nullif(l.subtotal,0)));
  end if;

  pending := case
    when o.status='cancelled' or o.payment_status in ('failed','refunded','partially_refunded') then 0
    when coalesce(l.awarded,0)>0 then 0
    else floor(base_points*multiplier)::integer
  end;

  select coalesce(sum(greatest(1,coalesce((x->>'qty')::integer,1))),0)::integer
  into item_count
  from jsonb_array_elements(case when jsonb_typeof(o.items)='array' then o.items else '[]'::jsonb end) x;

  select coalesce(
    jsonb_agg(
      jsonb_strip_nulls(jsonb_build_object(
        'status',h.value->>'status','previous',nullif(h.value->>'previous',''),
        'at',h.value->>'at','source',nullif(h.value->>'source','')
      )) order by h.ord
    ),
    '[]'::jsonb
  )
  into hist
  from jsonb_array_elements(coalesce(o.status_history,'[]'::jsonb)) with ordinality h(value,ord);

  if o.kind='gift' then
    gift:=jsonb_strip_nulls(jsonb_build_object(
      'recipient',nullif(o.extra->>'recipient',''),
      'recipient_phone',nullif(o.extra->>'recipient_phone',''),
      'occasion',nullif(o.extra->>'occasion',''),
      'packing',nullif(o.extra->>'packing',''),
      'theme',nullif(o.extra->>'theme',''),
      'card_language',nullif(o.extra->>'card_language',''),
      'hide_prices',case when o.extra ? 'hide_prices' then (o.extra->>'hide_prices')::boolean else null end,
      'gift_message',nullif(o.extra->>'gift_message','')
    ));
  end if;

  return jsonb_strip_nulls(jsonb_build_object(
    'reference',o.reference,'kind',o.kind,'status',o.status,'customer_name',o.customer_name,
    'items',coalesce(o.items,'[]'::jsonb),'item_count',item_count,
    'subtotal',coalesce(o.subtotal,0),'discount_total',coalesce(o.discount_total,0),
    'reward_discount',coalesce(l.discount,o.reward_discount,0),'delivery_fee',coalesce(o.delivery_fee,0),
    'delivery_fee_confirmation',coalesce(o.extra->'delivery_fee_confirmation',jsonb_build_object('status','legacy')),
    'total',coalesce(o.total,0),'currency',o.currency,'language',o.language,
    'delivery_area',coalesce(o.delivery_address->>'area',o.area),'delivery_address',coalesce(o.delivery_address,'{}'::jsonb),
    'payment_method',coalesce(o.payment_method,'cash_on_delivery'),'payment_status',coalesce(o.payment_status,'pending'),
    'paid_at',o.paid_at,
    'notes',nullif(o.notes,''),'gift',gift,'submitted_at',o.submitted_at,'updated_at',o.updated_at,
    'confirmed_at',o.confirmed_at,'preparing_at',o.preparing_at,'out_for_delivery_at',o.out_for_delivery_at,
    'delivered_at',o.delivered_at,'cancelled_at',o.cancelled_at,'cancellation_reason',nullif(o.cancellation_reason,''),
    'status_history',hist,'points_awarded',coalesce(l.awarded,0),'pending_points',pending,
    'rewards_state',case
      when o.status='cancelled' or o.payment_status in ('failed','refunded','partially_refunded') then 'none'
      when coalesce(l.awarded,0)>0 then 'earned'
      when o.status='delivered' and o.payment_status<>'paid' then 'waiting_payment'
      when o.status<>'delivered' and o.payment_status='paid' then 'waiting_delivery'
      else 'pending'
    end,
    'can_cancel',o.status='new',
    'owned_by_account',p_user is not null and (o.customer_id=p_user or l.user_id=p_user),
    'claimable',p_user is not null and l.user_id is null,
    'support_phone',coalesce((select value->>'whatsapp' from public.site_settings where key='contact'),'96181581230')
  ));
end
$function$
;

-- Expose payment-aware reward state through the customer-safe order payload.

create or replace function private.zwm_customer_order_payload(
  o public.orders,
  l mouneh.order_links,
  p_user uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  hist jsonb := '[]'::jsonb;
  gift jsonb := null;
  multiplier numeric := 1;
  pending integer := 0;
  base_points numeric := 0;
  item_count integer := 0;
begin
  if p_user is not null and exists(select 1 from mouneh.members where user_id=p_user) then
    multiplier := case mouneh.tier(p_user) when 'golden' then 1.5 when 'olive' then 1.25 else 1 end;
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
    jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'status',h.value->>'status','previous',nullif(h.value->>'previous',''),
      'at',h.value->>'at','source',nullif(h.value->>'source','')
    )) order by h.ord),
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
    'total',coalesce(o.total,0),'currency',o.currency,'language',o.language,
    'delivery_area',coalesce(o.delivery_address->>'area',o.area),'delivery_address',coalesce(o.delivery_address,'{}'::jsonb),
    'payment_method',coalesce(o.payment_method,'cash_on_delivery'),'payment_status',coalesce(o.payment_status,'pending'),
    'paid_at',o.paid_at,'notes',nullif(o.notes,''),'gift',gift,
    'submitted_at',o.submitted_at,'updated_at',o.updated_at,'confirmed_at',o.confirmed_at,
    'preparing_at',o.preparing_at,'out_for_delivery_at',o.out_for_delivery_at,
    'delivered_at',o.delivered_at,'cancelled_at',o.cancelled_at,
    'cancellation_reason',nullif(o.cancellation_reason,''),'status_history',hist,
    'points_awarded',coalesce(l.awarded,0),'pending_points',pending,
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
$$;

revoke all on function private.zwm_customer_order_payload(public.orders,mouneh.order_links,uuid)
from public,anon,authenticated;

notify pgrst,'reload schema';

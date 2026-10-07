-- Let owners record the real current delivery stage even if an earlier
-- internal preparation step was not recorded. Customer cancellation rules
-- remain unchanged, and Delivered still requires Out for delivery first.

create or replace function mouneh.order_status_guard()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  admin_user boolean:=false;
  customer_cancel boolean:=false;
  allowed boolean:=false;
  source_name text;
begin
  admin_user:=auth.uid() is not null and exists(
    select 1 from public.admin_users where user_id=auth.uid()
  );
  customer_cancel:=coalesce(current_setting('app.zwm_customer_cancel',true),'')='1';

  if not admin_user and not customer_cancel then
    raise exception 'Owner authentication required';
  end if;

  if customer_cancel and not(old.status='new' and new.status='cancelled') then
    raise exception 'Customer cancellation is not allowed for this status';
  end if;

  allowed:=case old.status
    when 'new' then new.status in ('confirmed','preparing','out_for_delivery','cancelled')
    when 'confirmed' then new.status in ('preparing','out_for_delivery','cancelled')
    when 'preparing' then new.status in ('out_for_delivery','cancelled')
    when 'out_for_delivery' then new.status in ('delivered','cancelled')
    when 'delivered' then admin_user and new.status='cancelled'
    when 'cancelled' then false
    else false
  end;

  if old.status<>new.status and not allowed then
    raise exception 'Invalid order status transition: % to %',old.status,new.status;
  end if;

  source_name:=case when customer_cancel then 'customer' else 'owner' end;
  new.updated_at:=now();

  if new.status='confirmed' then
    new.confirmed_at:=coalesce(new.confirmed_at,now());
  end if;
  if new.status='preparing' then
    new.preparing_at:=coalesce(new.preparing_at,now());
  end if;
  if new.status='out_for_delivery' then
    new.out_for_delivery_at:=coalesce(new.out_for_delivery_at,now());
  end if;
  if new.status='delivered' then
    new.delivered_at:=coalesce(new.delivered_at,now());
  end if;
  if new.status='cancelled' then
    new.cancelled_at:=coalesce(new.cancelled_at,now());
  end if;

  new.status_history:=coalesce(old.status_history,'[]'::jsonb)
    || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
      'status',new.status,
      'previous',old.status,
      'at',now(),
      'source',source_name,
      'actor',case when admin_user then auth.uid()::text else null end
    )));

  return new;
end
$$;

notify pgrst,'reload schema';

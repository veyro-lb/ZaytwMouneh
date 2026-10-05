create or replace function private.notification_order_insert()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_admin record; v_item_count integer;
begin
  v_item_count := case when jsonb_typeof(new.items)='array' then jsonb_array_length(new.items) else 0 end;
  for v_admin in select a.user_id from public.admin_users a loop
    perform private.notification_create(
      v_admin.user_id,'admin','ORDER_CREATED','new_order','order',new.reference,
      'admin_new_order_title','admin_new_order_body','{}'::jsonb,
      jsonb_build_object('reference',new.reference,'total',new.total,'currency',new.currency,'item_count',v_item_count),
      '/admin.html?view=orders&order='||new.reference,'critical',
      jsonb_build_object('reference',new.reference,'total',new.total,'currency',new.currency,'item_count',v_item_count),
      'admin:ORDER_CREATED:'||new.reference,null
    );
  end loop;
  if new.customer_id is not null then
    perform private.notification_create(
      new.customer_id,'customer','ORDER_CREATED','order_updates','order',new.reference,
      'customer_order_received_title','customer_order_received_body','{}'::jsonb,
      jsonb_build_object('reference',new.reference),'/account?notification_ref='||new.reference,'important',
      jsonb_build_object('reference',new.reference,'status',new.status),
      'customer:ORDER_CREATED:'||new.reference,null
    );
  end if;
  return new;
end;
$$;
create trigger zwm_notification_order_insert after insert on public.orders for each row execute function private.notification_order_insert();

create or replace function private.notification_order_update()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_admin record;
begin
  if old.status is distinct from new.status and new.customer_id is not null
     and new.status in ('confirmed','preparing','out_for_delivery','delivered','cancelled') then
    perform private.notification_create(
      new.customer_id,'customer','ORDER_STATUS_CHANGED','order_updates','order',new.reference,
      'customer_order_'||new.status||'_title','customer_order_status_body','{}'::jsonb,
      jsonb_build_object('reference',new.reference,'status',new.status),'/account?notification_ref='||new.reference,
      case when new.status in ('delivered','cancelled') then 'important' else 'informational' end,
      jsonb_build_object('reference',new.reference,'status',new.status),
      'customer:ORDER_STATUS:'||new.reference||':'||new.status,null
    );
  end if;
  if old.payment_status is distinct from new.payment_status and new.payment_status='failed' then
    for v_admin in select a.user_id from public.admin_users a loop
      perform private.notification_create(
        v_admin.user_id,'admin','PAYMENT_FAILED','payment_issue','order',new.reference,
        'admin_payment_failed_title','admin_payment_failed_body','{}'::jsonb,
        jsonb_build_object('reference',new.reference),'/admin.html?view=orders&order='||new.reference,'critical',
        jsonb_build_object('reference',new.reference,'payment_status',new.payment_status),
        'admin:PAYMENT_FAILED:'||new.reference,null
      );
    end loop;
  end if;
  return new;
end;
$$;
create trigger zwm_notification_order_update after update of status,payment_status on public.orders for each row execute function private.notification_order_update();

create or replace function private.notification_wholesale_insert()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_admin record;
begin
  for v_admin in select a.user_id from public.admin_users a loop
    perform private.notification_create(
      v_admin.user_id,'admin','WHOLESALE_INQUIRY_CREATED','wholesale','wholesale_inquiry',new.id::text,
      'admin_wholesale_title','admin_wholesale_body','{}'::jsonb,jsonb_build_object('business_name',new.business_name),
      '/admin.html?view=wholesale&lead='||new.id::text,'critical',
      jsonb_build_object('lead_id',new.id,'business_name',new.business_name,'business_type',new.business_type),
      'admin:WHOLESALE_INQUIRY_CREATED:'||new.id::text,null
    );
  end loop;
  return new;
end;
$$;
create trigger zwm_notification_wholesale_insert after insert on public.wholesale_leads for each row execute function private.notification_wholesale_insert();

create or replace function private.notification_admin_removed()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  update public.push_subscriptions set enabled=false,revoked_at=now(),updated_at=now()
  where user_id=old.user_id and audience='admin' and revoked_at is null;
  return old;
end;
$$;
create trigger zwm_notification_admin_removed after delete on public.admin_users for each row execute function private.notification_admin_removed();

create or replace function private.notification_review_insert()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_admin record;
begin
  for v_admin in select a.user_id from public.admin_users a loop
    perform private.notification_create(
      v_admin.user_id,'admin','REVIEW_CREATED','reviews','review',new.id::text,
      'admin_review_title','admin_review_body','{}'::jsonb,jsonb_build_object('product_id',new.product_id,'rating',new.rating),
      '/admin.html?view=products','important',
      jsonb_build_object('review_id',new.id,'product_id',new.product_id,'rating',new.rating),
      'admin:REVIEW_CREATED:'||new.id::text,null
    );
  end loop;
  return new;
end;
$$;
create trigger zwm_notification_review_insert after insert on public.storefront_reviews for each row execute function private.notification_review_insert();
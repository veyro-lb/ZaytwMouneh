create index if not exists return_order_lookup_attempts_order_idx
  on private.return_order_lookup_attempts(order_reference_hash,created_at desc)
  where success=false;

create or replace function public.zwm_return_verify_order(
  p_reference text,
  p_contact text default null,
  p_ip_hash text default null,
  p_user_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  ref text:=upper(trim(coalesce(p_reference,'')));
  contact text:=trim(coalesce(p_contact,''));
  ip text:=trim(coalesce(p_ip_hash,''));
  ref_hash text;
  o public.orders;
  l mouneh.order_links;
  user_owns boolean:=false;
  contact_ok boolean:=false;
  contact_digits text;
  order_digits text;
  failed_ip integer:=0;
  failed_ref integer:=0;
  failed_order integer:=0;
  token text;
  expiry timestamptz:=now()+interval '30 minutes';
  context jsonb;
begin
  if char_length(ref) not between 6 and 80 or ref !~ '^[A-Z0-9-]+$'
     or char_length(ip) not between 32 and 128
     or char_length(contact)>254 then
    return jsonb_build_object('verified',false);
  end if;

  delete from private.return_order_access_tokens where expires_at<=now();
  delete from private.return_order_lookup_attempts where created_at<now()-interval '24 hours';

  ref_hash:=encode(extensions.digest(ref,'sha256'),'hex');

  select count(*) into failed_ip
  from private.return_order_lookup_attempts a
  where a.ip_hash=ip
    and not a.success
    and a.created_at>now()-interval '15 minutes';

  select count(*) into failed_ref
  from private.return_order_lookup_attempts a
  where a.ip_hash=ip
    and a.order_reference_hash=ref_hash
    and not a.success
    and a.created_at>now()-interval '15 minutes';

  select count(*) into failed_order
  from private.return_order_lookup_attempts a
  where a.order_reference_hash=ref_hash
    and not a.success
    and a.created_at>now()-interval '30 minutes';

  if failed_ip>=20 or failed_ref>=6 or failed_order>=30 then
    return jsonb_build_object('verified',false,'rate_limited',true);
  end if;

  select * into o from public.orders where reference=ref;
  if o.reference is not null then
    select * into l from mouneh.order_links where reference=ref;
    user_owns:=p_user_id is not null
      and (o.customer_id=p_user_id or l.user_id=p_user_id);

    if not user_owns and contact<>'' then
      if position('@' in contact)>0 then
        contact_ok:=lower(trim(coalesce(o.customer_email,'')))=lower(contact);
      else
        contact_digits:=regexp_replace(contact,'[^0-9]+','','g');
        order_digits:=regexp_replace(coalesce(o.customer_phone,''),'[^0-9]+','','g');
        contact_ok:=char_length(contact_digits)>=7
          and char_length(order_digits)>=7
          and (
            contact_digits=order_digits
            or (
              char_length(contact_digits)>=8
              and char_length(order_digits)>=8
              and right(contact_digits,8)=right(order_digits,8)
            )
          );
      end if;
    end if;
  end if;

  if o.reference is null or (not user_owns and not contact_ok) then
    insert into private.return_order_lookup_attempts(ip_hash,order_reference_hash,success)
    values(ip,ref_hash,false);
    return jsonb_build_object('verified',false);
  end if;

  token:=encode(extensions.gen_random_bytes(32),'hex');

  insert into private.return_order_access_tokens(
    order_reference,token_hash,issued_to_user,ip_hash,expires_at
  )
  values(
    ref,
    encode(extensions.digest(token,'sha256'),'hex'),
    p_user_id,
    ip,
    expiry
  );

  insert into private.return_order_lookup_attempts(ip_hash,order_reference_hash,success)
  values(ip,ref_hash,true);

  context:=private.zwm_returns(
    'order_context',
    jsonb_build_object('reference',ref,'claim_token',token)
  );

  return jsonb_build_object(
    'verified',true,
    'access_token',token,
    'expires_at',expiry,
    'context',context
  );
end
$$;

revoke all on function public.zwm_return_verify_order(text,text,text,uuid)
from public,anon,authenticated;
grant execute on function public.zwm_return_verify_order(text,text,text,uuid)
to service_role;

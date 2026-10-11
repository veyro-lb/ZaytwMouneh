begin;
do $test$
declare u uuid:=gen_random_uuid(); u2 uuid:=gen_random_uuid(); r text:='ZW-9912312359-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,4)); r2 text:='ZW-9912312358-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,4)); before_balance integer;
begin
 insert into auth.users(id,email,email_confirmed_at) values (u,u::text||'@example.invalid',now()),(u2,u2::text||'@example.invalid',now());
 insert into mouneh.members(user_id,name,phone) values(u,'Reward Test','+961 03 987654'),(u2,'Reward Test Two','03987654');
 insert into public.orders(reference,created_source,status,payment_status,subtotal,total,customer_id,customer_phone,submitted_at)
 values(r,'website','delivered','paid',12,12,u,'+961 3 987654',now()+interval '1 second');
 insert into mouneh.order_links(reference,user_id,subtotal,weighted_subtotal) values(r,u,12,12);
 perform mouneh.settle(r);
 if (select count(*) from private.first_order_reward_claims where user_id=u)<>1
 or (select balance from mouneh.members where user_id=u)<>32 then raise exception 'Expected 12 normal +20 existing first order only'; end if;
 perform mouneh.settle(r);perform private.award_first_order_reward(r);
 if (select balance from mouneh.members where user_id=u)<>32 then raise exception 'Duplicate awarded'; end if;
 insert into public.orders(reference,created_source,status,payment_status,subtotal,total,customer_id,customer_phone,submitted_at)
 values(r2,'website','delivered','paid',12,12,u2,'00396103987654',now()+interval '2 seconds');
 -- Test correct international alias separately below.
 update public.orders set customer_phone='00961 03 987654' where reference=r2;
 insert into mouneh.order_links(reference,user_id,subtotal,weighted_subtotal) values(r2,u2,12,12);
 perform mouneh.settle(r2);
 if exists(select 1 from private.first_order_reward_claims where user_id=u2) then raise exception 'Same phone alias received second promotion'; end if;
 insert into public.admin_users(user_id) values(u);
 perform set_config('request.jwt.claim.sub',u::text,true);
 update public.orders set payment_status='refunded' where reference=r;
 if (select balance from mouneh.members where user_id=u)<>0 then raise exception 'Refund failed to reverse bonus'; end if;
 if not exists(select 1 from private.first_order_reward_claims where user_id=u) then raise exception 'Refund reset eligibility'; end if;
 if has_function_privilege('anon','private.award_first_order_reward(text)','execute')
 or has_function_privilege('authenticated','private.award_first_order_reward(text)','execute') then raise exception 'Customer can call award helper'; end if;
 if has_table_privilege('authenticated','private.first_order_reward_claims','insert') then raise exception 'Customer can forge claims'; end if;
end $test$;
rollback;
select 'PASS: existing rewards preserved; one bonus; repeat and same-phone alias denied; refund reversed; durable claim; client permissions denied; all fixtures rolled back' as result;

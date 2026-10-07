create index if not exists return_order_access_tokens_user_idx on private.return_order_access_tokens(issued_to_user) where issued_to_user is not null;

-- DigiForge Neon schema (finance-hardened)
-- Apply in Neon SQL Editor, then set STORE_MODE=relational and run npm run db:migrate

create extension if not exists pgcrypto;

do $$ begin
  create type user_role as enum ('client', 'freelancer', 'admin');
exception when duplicate_object then null; end $$;
do $$ begin
  create type crypto_network as enum ('TRC20', 'ERC20');
exception when duplicate_object then null; end $$;
do $$ begin
  create type crypto_asset as enum ('USDT');
exception when duplicate_object then null; end $$;
do $$ begin
  create type project_status as enum ('open', 'in_progress', 'delivered', 'completed', 'disputed', 'cancelled');
exception when duplicate_object then null; end $$;
do $$ begin
  create type escrow_status as enum (
    'pending_funding', 'funded', 'in_progress', 'delivered', 'released', 'disputed', 'refunded'
  );
exception when duplicate_object then null; end $$;
do $$ begin
  create type ledger_kind as enum (
    'deposit', 'withdraw', 'withdraw_hold', 'withdraw_release',
    'escrow_lock', 'escrow_release', 'escrow_refund', 'fee', 'prime'
  );
exception when duplicate_object then null; end $$;
do $$ begin
  create type deposit_status as enum ('awaiting', 'confirming', 'completed', 'expired');
exception when duplicate_object then null; end $$;
do $$ begin
  create type withdrawal_status as enum ('pending', 'processing', 'completed', 'rejected');
exception when duplicate_object then null; end $$;

-- Full document mirror (CAS) while nested UI fields migrate
create table if not exists app_store (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists store_meta (
  id text primary key,
  version int not null default 0,
  finance_policy_version int not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists users (
  id text primary key,
  email text unique not null,
  password_hash text not null,
  name text not null,
  role user_role not null,
  title text,
  bio text,
  skills text[] not null default '{}',
  rating numeric(3,1) not null default 0,
  review_count int not null default 0,
  wallet_address text,
  wallet_network crypto_network,
  wallet_asset crypto_asset,
  two_fa_enabled boolean not null default false,
  two_fa_secret text,
  two_fa_pending_secret text,
  session_version int not null default 0,
  email_verified_at timestamptz,
  email_verify_token_hash text,
  email_verify_expires_at timestamptz,
  digi_prime_until timestamptz,
  sensitive_changed_at timestamptz,
  deactivated_at timestamptz,
  profile_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id text primary key,
  client_id text not null references users(id),
  title text not null,
  description text not null,
  category text not null,
  budget numeric(18,2),
  currency text not null default 'USDT',
  deadline_days int not null,
  status project_status not null default 'open',
  bids_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists bids (
  id text primary key,
  project_id text not null references projects(id),
  freelancer_id text not null references users(id),
  amount numeric(18,2) not null,
  days int not null,
  comment text not null,
  transfer_copyright boolean not null default false,
  hide_from_others boolean not null default false,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists deals (
  id text primary key,
  project_id text not null references projects(id),
  client_id text not null references users(id),
  freelancer_id text not null references users(id),
  bid_id text not null references bids(id),
  amount numeric(18,2) not null check (amount > 0),
  fee_percent numeric(5,2) not null default 10,
  fee_amount numeric(18,2) not null,
  status escrow_status not null,
  funded_at timestamptz,
  delivered_at timestamptz,
  released_at timestamptz,
  disputed_at timestamptz,
  funding_deadline_at timestamptz,
  auto_release_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists ledger_entries (
  id text primary key,
  user_id text not null references users(id),
  kind ledger_kind not null,
  amount numeric(18,2) not null,
  asset crypto_asset not null,
  network crypto_network,
  note text not null,
  tx_hash text,
  deal_id text references deals(id),
  deposit_id text,
  withdrawal_id text,
  created_at timestamptz not null default now(),
  settled_at timestamptz
);

create unique index if not exists ledger_tx_hash_uidx on ledger_entries (tx_hash) where tx_hash is not null;
create unique index if not exists ledger_deal_kind_uidx
  on ledger_entries (deal_id, kind)
  where deal_id is not null and kind in ('escrow_lock', 'escrow_release', 'escrow_refund', 'fee');
create unique index if not exists ledger_deposit_uidx
  on ledger_entries (deposit_id)
  where deposit_id is not null and kind = 'deposit';
create unique index if not exists ledger_withdraw_hold_uidx
  on ledger_entries (withdrawal_id)
  where withdrawal_id is not null and kind = 'withdraw_hold';

create table if not exists threads (
  id text primary key,
  deal_id text references deals(id),
  project_id text references projects(id),
  title text not null,
  updated_at timestamptz not null default now()
);

create table if not exists thread_participants (
  thread_id text not null references threads(id),
  user_id text not null references users(id),
  primary key (thread_id, user_id)
);

create table if not exists messages (
  id text primary key,
  thread_id text not null references threads(id),
  sender_id text not null references users(id),
  body text not null,
  attachment_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id text primary key,
  from_user_id text not null references users(id),
  to_user_id text not null references users(id),
  deal_id text not null,
  rating int not null check (rating between 1 and 5),
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists portfolio_cases (
  id text primary key,
  freelancer_id text not null references users(id),
  title text not null,
  summary text not null,
  tags text[] not null default '{}',
  cover_url text,
  price_usdt numeric(18,2),
  project_url text,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id text primary key,
  user_id text not null references users(id),
  title text not null,
  body text not null,
  read boolean not null default false,
  href text,
  created_at timestamptz not null default now()
);

create table if not exists deposits (
  id text primary key,
  user_id text not null references users(id),
  amount numeric(18,2) not null check (amount > 0),
  asset crypto_asset not null,
  network crypto_network not null,
  address text not null,
  status deposit_status not null,
  tx_hash text unique,
  provider_ref text,
  invoice_url text,
  pay_amount numeric(18,2),
  pay_currency text,
  provider_simulated boolean not null default false,
  expires_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists withdrawals (
  id text primary key,
  user_id text not null references users(id),
  amount numeric(18,2) not null check (amount > 0),
  asset crypto_asset not null,
  network crypto_network not null,
  address text not null,
  status withdrawal_status not null,
  tx_hash text unique,
  provider_ref text,
  provider_simulated boolean not null default false,
  reviewed_by text references users(id),
  reviewed_at timestamptz,
  reject_reason text,
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id text primary key,
  at timestamptz not null default now(),
  actor_user_id text references users(id),
  action text not null,
  entity_type text,
  entity_id text,
  ip text,
  meta jsonb not null default '{}'::jsonb
);

create table if not exists webhook_events (
  id text primary key,
  provider text not null,
  event_key text not null,
  deposit_id text references deposits(id),
  payload_hash text not null,
  status text not null,
  created_at timestamptz not null default now(),
  unique (provider, event_key)
);

create table if not exists rate_limit_buckets (
  bucket_key text primary key,
  timestamps timestamptz[] not null default '{}',
  updated_at timestamptz not null default now()
);

create index if not exists audit_log_at_idx on audit_log (at desc);
create index if not exists ledger_user_created_idx on ledger_entries (user_id, created_at desc);
create index if not exists deals_status_idx on deals (status);
create index if not exists deals_auto_release_idx on deals (auto_release_at) where auto_release_at is not null;
create index if not exists withdrawals_status_idx on withdrawals (status);
create index if not exists deposits_status_idx on deposits (status);

-- DigiForge Neon / Lakebase schema (ready for migration from file store)

create type user_role as enum ('client', 'freelancer', 'admin');
create type crypto_network as enum ('TRC20', 'ERC20');
create type crypto_asset as enum ('USDT');
create type project_status as enum ('open', 'in_progress', 'delivered', 'completed', 'disputed', 'cancelled');
create type escrow_status as enum ('pending_funding', 'funded', 'in_progress', 'delivered', 'released', 'disputed', 'refunded');
create type ledger_kind as enum ('deposit', 'withdraw', 'escrow_lock', 'escrow_release', 'escrow_refund', 'fee', 'prime');

create table users (
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
  digi_prime_until timestamptz,
  created_at timestamptz not null default now()
);

create table projects (
  id text primary key,
  client_id text not null references users(id),
  title text not null,
  description text not null,
  category text not null,
  budget_min numeric(18,2) not null,
  budget_max numeric(18,2) not null,
  currency text not null default 'USDT',
  deadline_days int not null,
  status project_status not null default 'open',
  bids_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create table bids (
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

create table deals (
  id text primary key,
  project_id text not null references projects(id),
  client_id text not null references users(id),
  freelancer_id text not null references users(id),
  bid_id text not null references bids(id),
  amount numeric(18,2) not null,
  fee_percent numeric(5,2) not null default 10,
  status escrow_status not null,
  funded_at timestamptz,
  delivered_at timestamptz,
  released_at timestamptz,
  created_at timestamptz not null default now()
);

create table ledger_entries (
  id text primary key,
  user_id text not null references users(id),
  kind ledger_kind not null,
  amount numeric(18,2) not null,
  asset crypto_asset not null,
  network crypto_network,
  note text not null,
  tx_hash text,
  deal_id text references deals(id),
  created_at timestamptz not null default now(),
  settled_at timestamptz
);

create table threads (
  id text primary key,
  deal_id text references deals(id),
  project_id text references projects(id),
  title text not null,
  updated_at timestamptz not null default now()
);

create table thread_participants (
  thread_id text not null references threads(id),
  user_id text not null references users(id),
  primary key (thread_id, user_id)
);

create table messages (
  id text primary key,
  thread_id text not null references threads(id),
  sender_id text not null references users(id),
  body text not null,
  created_at timestamptz not null default now()
);

create table reviews (
  id text primary key,
  from_user_id text not null references users(id),
  to_user_id text not null references users(id),
  deal_id text not null,
  rating int not null check (rating between 1 and 5),
  text text not null,
  created_at timestamptz not null default now()
);

create table portfolio_cases (
  id text primary key,
  freelancer_id text not null references users(id),
  title text not null,
  summary text not null,
  tags text[] not null default '{}',
  cover_url text,
  created_at timestamptz not null default now()
);

create table notifications (
  id text primary key,
  user_id text not null references users(id),
  title text not null,
  body text not null,
  read boolean not null default false,
  href text,
  created_at timestamptz not null default now()
);

create table deposits (
  id text primary key,
  user_id text not null references users(id),
  amount numeric(18,2) not null,
  asset crypto_asset not null,
  network crypto_network not null,
  address text not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table withdrawals (
  id text primary key,
  user_id text not null references users(id),
  amount numeric(18,2) not null,
  asset crypto_asset not null,
  network crypto_network not null,
  address text not null,
  status text not null,
  created_at timestamptz not null default now()
);

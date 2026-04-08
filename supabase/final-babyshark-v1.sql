-- BabyShark V1 - schema Supabase / Postgres
-- A exécuter dans l'éditeur SQL Supabase à la fin du branchage.

create extension if not exists pgcrypto;

create table if not exists structures (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  timezone text not null default 'Europe/Brussels',
  currency text not null default 'EUR',
  country text not null default 'Belgique',
  tagline text,
  address text,
  phone text,
  email text,
  website_title text,
  created_at timestamptz not null default now()
);

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  structure_id uuid not null references structures(id) on delete cascade,
  name text not null,
  color_class text,
  sort_order integer not null default 0
);

create table if not exists user_profiles (
  id uuid primary key,
  structure_id uuid not null references structures(id) on delete cascade,
  role text not null check (role in ('superadmin','admin','manager','team','parent')),
  full_name text not null,
  email text not null,
  title text,
  visible_in_team_app boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists parents (
  id uuid primary key default gen_random_uuid(),
  structure_id uuid not null references structures(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  payer boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists children (
  id uuid primary key default gen_random_uuid(),
  structure_id uuid not null references structures(id) on delete cascade,
  group_id uuid references groups(id) on delete set null,
  first_name text not null,
  last_name text not null,
  birth_date date,
  medical_notes text,
  allergies text[] not null default '{}',
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists child_parents (
  child_id uuid not null references children(id) on delete cascade,
  parent_id uuid not null references parents(id) on delete cascade,
  primary key (child_id, parent_id)
);

create table if not exists authorized_pickups (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  full_name text not null
);

create table if not exists preregistrations (
  id uuid primary key default gen_random_uuid(),
  structure_id uuid not null references structures(id) on delete cascade,
  child_name text not null,
  parent_name text not null,
  email text not null,
  phone text,
  requested_start_date date,
  requested_rhythm text,
  source text not null check (source in ('website','backoffice')),
  status text not null check (status in ('new','qualified','accepted','rejected')),
  notes text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  structure_id uuid not null references structures(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  payer_parent_id uuid not null references parents(id) on delete restrict,
  start_date date not null,
  end_date date,
  schedule_label text,
  pricing_label text,
  status text not null check (status in ('draft','ready_for_signature','active','ended')),
  signature_status text not null check (signature_status in ('not_started','pending','signed')),
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  structure_id uuid not null references structures(id) on delete cascade,
  parent_id uuid not null references parents(id) on delete restrict,
  contract_id uuid references contracts(id) on delete set null,
  label text not null,
  month text,
  amount numeric(10,2) not null default 0,
  paid_amount numeric(10,2) not null default 0,
  number text,
  status text not null check (status in ('proforma','final','paid','partial','overdue')),
  created_at timestamptz not null default now()
);

create table if not exists transmissions (
  id uuid primary key default gen_random_uuid(),
  structure_id uuid not null references structures(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  author_id uuid references user_profiles(id) on delete set null,
  category text not null check (category in ('presence','meal','nap','change','health','activity','photo','note')),
  title text not null,
  details text,
  visibility text not null check (visibility in ('parent','internal','management','medical')),
  created_at timestamptz not null default now()
);

create table if not exists family_requests (
  id uuid primary key default gen_random_uuid(),
  structure_id uuid not null references structures(id) on delete cascade,
  parent_id uuid not null references parents(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  type text not null check (type in ('absence','delay','reservation','document')),
  request_date date,
  details text,
  status text not null check (status in ('submitted','approved','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  structure_id uuid not null references structures(id) on delete cascade,
  title text not null,
  category text not null check (category in ('contract','medical','parent','internal','invoice')),
  linked_type text not null check (linked_type in ('child','parent','contract','structure')),
  linked_id uuid not null,
  file_path text,
  created_at timestamptz not null default now()
);

create table if not exists devices (
  id uuid primary key default gen_random_uuid(),
  structure_id uuid not null references structures(id) on delete cascade,
  label text not null,
  type text not null check (type in ('reception','section','mobile')),
  enrollment_code text not null,
  visible_modules text[] not null default '{}',
  last_seen timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists team_shifts (
  id uuid primary key default gen_random_uuid(),
  structure_id uuid not null references structures(id) on delete cascade,
  user_id uuid not null references user_profiles(id) on delete cascade,
  day_label text not null,
  start_time text,
  end_time text,
  status text not null check (status in ('planned','present','absence')),
  created_at timestamptz not null default now()
);

create table if not exists message_threads (
  id uuid primary key default gen_random_uuid(),
  structure_id uuid not null references structures(id) on delete cascade,
  title text not null,
  audience text not null check (audience in ('internal','parent')),
  last_message text,
  updated_at timestamptz not null default now()
);

alter table structures enable row level security;
alter table groups enable row level security;
alter table user_profiles enable row level security;
alter table parents enable row level security;
alter table children enable row level security;
alter table preregistrations enable row level security;
alter table contracts enable row level security;
alter table invoices enable row level security;
alter table transmissions enable row level security;
alter table family_requests enable row level security;
alter table documents enable row level security;
alter table devices enable row level security;
alter table team_shifts enable row level security;
alter table message_threads enable row level security;

-- Policies simples de démarrage à raffiner pendant le vrai branchement Auth/RBAC.
create policy if not exists "structure members can read structures" on structures for select using (true);
create policy if not exists "structure members can read groups" on groups for select using (true);
create policy if not exists "structure members can read user profiles" on user_profiles for select using (true);
create policy if not exists "structure members can read parents" on parents for select using (true);
create policy if not exists "structure members can read children" on children for select using (true);
create policy if not exists "structure members can read preregistrations" on preregistrations for select using (true);
create policy if not exists "structure members can read contracts" on contracts for select using (true);
create policy if not exists "structure members can read invoices" on invoices for select using (true);
create policy if not exists "structure members can read transmissions" on transmissions for select using (true);
create policy if not exists "structure members can read family requests" on family_requests for select using (true);
create policy if not exists "structure members can read documents" on documents for select using (true);
create policy if not exists "structure members can read devices" on devices for select using (true);
create policy if not exists "structure members can read team shifts" on team_shifts for select using (true);
create policy if not exists "structure members can read threads" on message_threads for select using (true);


alter table child_parents enable row level security;
alter table authorized_pickups enable row level security;

create policy if not exists "structure members can read child parents" on child_parents for select using (true);
create policy if not exists "structure members can read pickups" on authorized_pickups for select using (true);

create policy if not exists "public can insert structures for bootstrap" on structures for insert with check (true);
create policy if not exists "public can update structures for bootstrap" on structures for update using (true) with check (true);
create policy if not exists "public can insert groups for bootstrap" on groups for insert with check (true);
create policy if not exists "public can update groups for bootstrap" on groups for update using (true) with check (true);
create policy if not exists "public can insert user profiles for bootstrap" on user_profiles for insert with check (true);
create policy if not exists "public can update user profiles for bootstrap" on user_profiles for update using (true) with check (true);
create policy if not exists "public can insert parents for bootstrap" on parents for insert with check (true);
create policy if not exists "public can update parents for bootstrap" on parents for update using (true) with check (true);
create policy if not exists "public can insert children for bootstrap" on children for insert with check (true);
create policy if not exists "public can update children for bootstrap" on children for update using (true) with check (true);
create policy if not exists "public can insert child parents for bootstrap" on child_parents for insert with check (true);
create policy if not exists "public can update child parents for bootstrap" on child_parents for update using (true) with check (true);
create policy if not exists "public can insert pickups for bootstrap" on authorized_pickups for insert with check (true);
create policy if not exists "public can update pickups for bootstrap" on authorized_pickups for update using (true) with check (true);
create policy if not exists "public can insert preregistrations for bootstrap" on preregistrations for insert with check (true);
create policy if not exists "public can update preregistrations for bootstrap" on preregistrations for update using (true) with check (true);
create policy if not exists "public can insert contracts for bootstrap" on contracts for insert with check (true);
create policy if not exists "public can update contracts for bootstrap" on contracts for update using (true) with check (true);
create policy if not exists "public can insert invoices for bootstrap" on invoices for insert with check (true);
create policy if not exists "public can update invoices for bootstrap" on invoices for update using (true) with check (true);
create policy if not exists "public can insert transmissions for bootstrap" on transmissions for insert with check (true);
create policy if not exists "public can update transmissions for bootstrap" on transmissions for update using (true) with check (true);
create policy if not exists "public can insert family requests for bootstrap" on family_requests for insert with check (true);
create policy if not exists "public can update family requests for bootstrap" on family_requests for update using (true) with check (true);
create policy if not exists "public can insert documents for bootstrap" on documents for insert with check (true);
create policy if not exists "public can update documents for bootstrap" on documents for update using (true) with check (true);
create policy if not exists "public can insert devices for bootstrap" on devices for insert with check (true);
create policy if not exists "public can update devices for bootstrap" on devices for update using (true) with check (true);
create policy if not exists "public can insert team shifts for bootstrap" on team_shifts for insert with check (true);
create policy if not exists "public can update team shifts for bootstrap" on team_shifts for update using (true) with check (true);
create policy if not exists "public can insert threads for bootstrap" on message_threads for insert with check (true);
create policy if not exists "public can update threads for bootstrap" on message_threads for update using (true) with check (true);

-- =============================================================
-- DocuCamp — Schéma de base de données
-- PostgreSQL via Supabase
-- =============================================================

-- Extension pour UUID
create extension if not exists "pgcrypto";

-- =============================================================
-- ENUMS
-- =============================================================

do $$ begin
  create type user_role as enum ('STUDENT', 'ADMIN');
exception when duplicate_object then null; end $$;

do $$ begin
  create type resource_type as enum (
    'EXAM', 'ASSIGNMENT', 'CORRECTION', 'REVISION_SHEET',
    'COURSE', 'TP', 'OTHER'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type material_category as enum (
    'CALCULATOR', 'BOOK', 'ELECTRONICS', 'TP_KIT',
    'STATIONERY', 'COMPUTER_ACCESSORY', 'OTHER'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type transaction_type as enum ('SALE', 'RENT', 'DONATION');
exception when duplicate_object then null; end $$;

do $$ begin
  create type material_condition as enum (
    'NEW', 'VERY_GOOD', 'GOOD', 'ACCEPTABLE', 'TO_REPAIR'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type resource_status as enum ('PENDING', 'PUBLISHED', 'REJECTED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type material_status as enum (
    'PENDING', 'PUBLISHED', 'SOLD', 'RENTED', 'CLOSED', 'REJECTED'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_reason as enum (
    'INAPPROPRIATE', 'SPAM', 'FRAUD', 'INCORRECT',
    'ILLEGAL', 'MISLEADING', 'OTHER'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum ('OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED');
exception when duplicate_object then null; end $$;

-- =============================================================
-- TABLE : profiles
-- Liée à auth.users (Supabase Auth)
-- =============================================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null unique,
  phone text not null check (phone ~ '^\+?[0-9\s\-()]{7,20}$'),
  avatar_url text,
  institution_id uuid,
  program_id uuid,
  level text,
  role user_role not null default 'STUDENT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================
-- TABLE : institutions
-- =============================================================

create table if not exists institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 200),
  city text,
  country text,
  created_at timestamptz not null default now()
);

-- =============================================================
-- TABLE : programs
-- =============================================================

create table if not exists programs (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 200),
  created_at timestamptz not null default now(),
  unique (institution_id, name)
);

-- =============================================================
-- TABLE : subjects
-- =============================================================

create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 200),
  code text,
  created_at timestamptz not null default now(),
  unique (program_id, name)
);

-- Ajout des FK différées sur profiles
alter table profiles
  drop constraint if exists profiles_institution_id_fkey,
  add constraint profiles_institution_id_fkey
    foreign key (institution_id) references institutions(id) on delete set null;

alter table profiles
  drop constraint if exists profiles_program_id_fkey,
  add constraint profiles_program_id_fkey
    foreign key (program_id) references programs(id) on delete set null;

-- =============================================================
-- TABLE : resources (documents)
-- =============================================================

create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 200),
  description text check (char_length(description) <= 2000),
  resource_type resource_type not null,
  institution_id uuid references institutions(id) on delete set null,
  program_id uuid references programs(id) on delete set null,
  subject_id uuid references subjects(id) on delete set null,
  level text not null,
  academic_year text not null check (academic_year ~ '^\d{4}(-\d{4})?$'),
  semester text check (semester in ('S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'ANNUAL')),
  file_url text not null,
  file_name text not null,
  file_size integer not null check (file_size > 0 and file_size <= 20971520),
  uploaded_by uuid not null references profiles(id) on delete cascade,
  status resource_status not null default 'PENDING',
  download_count integer not null default 0 check (download_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================
-- TABLE : materials
-- =============================================================

create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 200),
  description text check (char_length(description) <= 2000),
  category material_category not null,
  transaction_type transaction_type not null,
  price numeric(12, 2) check (price is null or price >= 0),
  rental_period text,
  condition material_condition not null,
  institution_id uuid references institutions(id) on delete set null,
  seller_id uuid not null references profiles(id) on delete cascade,
  status material_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Contraintes métier
  constraint price_required_for_sale check (
    transaction_type <> 'SALE' or price is not null
  ),
  constraint no_price_for_donation check (
    transaction_type <> 'DONATION' or price is null or price = 0
  ),
  constraint rental_period_for_rent check (
    transaction_type <> 'RENT' or rental_period is not null
  )
);

-- =============================================================
-- TABLE : material_images
-- =============================================================

create table if not exists material_images (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references materials(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

-- =============================================================
-- TABLE : reports
-- =============================================================

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reported_by uuid not null references profiles(id) on delete cascade,
  resource_id uuid references resources(id) on delete cascade,
  material_id uuid references materials(id) on delete cascade,
  reason report_reason not null,
  description text check (char_length(description) <= 2000),
  status report_status not null default 'OPEN',
  created_at timestamptz not null default now(),
  -- Exactement une cible
  constraint report_one_target check (
    (resource_id is not null and material_id is null)
    or (resource_id is null and material_id is not null)
  )
);

-- =============================================================
-- TABLE : admin_audit_logs
-- =============================================================

create table if not exists admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references profiles(id) on delete cascade,
  action text not null check (char_length(action) between 2 and 100),
  target_type text not null check (target_type in ('RESOURCE', 'MATERIAL', 'REPORT', 'PROFILE')),
  target_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =============================================================
-- TRIGGERS : updated_at
-- =============================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

drop trigger if exists trg_resources_updated_at on resources;
create trigger trg_resources_updated_at
  before update on resources
  for each row execute function set_updated_at();

drop trigger if exists trg_materials_updated_at on materials;
create trigger trg_materials_updated_at
  before update on materials
  for each row execute function set_updated_at();

-- =============================================================
-- TRIGGER : création automatique du profil après signup
-- =============================================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Étudiant'),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', '0000000000'),
    'STUDENT'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
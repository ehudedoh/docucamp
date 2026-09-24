-- =============================================================
-- Migration 001 — Téléchargements, favoris, notifications, buckets
-- IDEMPOTENTE : peut être exécutée plusieurs fois sans risque.
-- À lancer dans Supabase → SQL Editor.
--
-- Pourquoi : le backend utilise les tables `download_history`,
-- `favorites` et `notifications` ainsi que les buckets Storage
-- `documents` / `material-images`, qui n'étaient pas créés par schema.sql.
-- =============================================================

-- -------------------------------------------------------------
-- download_history
-- -------------------------------------------------------------
create table if not exists download_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  resource_id uuid not null references resources(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists idx_download_history_user
  on download_history(user_id, created_at desc);

-- -------------------------------------------------------------
-- favorites
-- -------------------------------------------------------------
create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  resource_id uuid references resources(id) on delete cascade,
  material_id uuid references materials(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorite_one_target check (
    (resource_id is not null and material_id is null)
    or (resource_id is null and material_id is not null)
  )
);
create unique index if not exists uq_favorites_resource
  on favorites(user_id, resource_id) where resource_id is not null;
create unique index if not exists uq_favorites_material
  on favorites(user_id, material_id) where material_id is not null;

-- -------------------------------------------------------------
-- notifications
-- -------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text,
  link text,
  reason text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user
  on notifications(user_id, read, created_at desc);

-- RLS : accès uniquement via le backend (service_role)
alter table download_history enable row level security;
alter table favorites        enable row level security;
alter table notifications    enable row level security;

grant all on download_history, favorites, notifications
  to anon, authenticated, service_role;

-- -------------------------------------------------------------
-- Compteur de téléchargements atomique
-- -------------------------------------------------------------
create or replace function increment_download_count(p_resource_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update resources
     set download_count = download_count + 1
   where id = p_resource_id;
$$;

-- Seul le backend (service_role) peut incrémenter, pas les clients directs
revoke execute on function increment_download_count(uuid) from public, anon, authenticated;
grant  execute on function increment_download_count(uuid) to service_role;

-- -------------------------------------------------------------
-- Buckets Storage
--   documents       : PRIVÉ  (accès via URL signée générée par le backend)
--   material-images : PUBLIC (les <img> ont besoin d'une URL publique)
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('documents',       'documents',       false, 20971520),
  ('material-images', 'material-images', true,  5242880)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit;

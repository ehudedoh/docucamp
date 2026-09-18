-- =============================================================
-- DocuCamp — Row Level Security (RLS)
-- Principe : Never trust the client
-- =============================================================

-- =============================================================
-- GRANTS — indispensables pour que les rôles Supabase puissent
-- accéder aux tables (RLS filtre ensuite ligne par ligne)
-- =============================================================
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on routines to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;

-- -------------------------------------------------------------
-- Activer RLS sur toutes les tables sensibles
-- -------------------------------------------------------------
alter table profiles enable row level security;
alter table institutions enable row level security;
alter table programs enable row level security;
alter table subjects enable row level security;
alter table resources enable row level security;
alter table materials enable row level security;
alter table material_images enable row level security;
alter table reports enable row level security;
alter table admin_audit_logs enable row level security;

-- -------------------------------------------------------------
-- Helper : vérifier si l'utilisateur courant est ADMIN
-- -------------------------------------------------------------
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'ADMIN'
  );
$$ language sql security definer stable;

-- -------------------------------------------------------------
-- profiles
-- -------------------------------------------------------------
drop policy if exists profiles_select_self on profiles;
create policy profiles_select_self on profiles
  for select using (auth.uid() = id or is_admin());

drop policy if exists profiles_update_self on profiles;
create policy profiles_update_self on profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- Empêche l'auto-promotion : le rôle doit rester STUDENT
    and role = (select role from profiles where id = auth.uid())
  );

drop policy if exists profiles_insert_self on profiles;
create policy profiles_insert_self on profiles
  for insert with check (auth.uid() = id);

-- -------------------------------------------------------------
-- institutions / programs / subjects : lecture publique
-- -------------------------------------------------------------
drop policy if exists institutions_read_all on institutions;
create policy institutions_read_all on institutions
  for select using (true);

drop policy if exists institutions_admin_write on institutions;
create policy institutions_admin_write on institutions
  for all using (is_admin()) with check (is_admin());

drop policy if exists programs_read_all on programs;
create policy programs_read_all on programs
  for select using (true);

drop policy if exists programs_admin_write on programs;
create policy programs_admin_write on programs
  for all using (is_admin()) with check (is_admin());

drop policy if exists subjects_read_all on subjects;
create policy subjects_read_all on subjects
  for select using (true);

drop policy if exists subjects_admin_write on subjects;
create policy subjects_admin_write on subjects
  for all using (is_admin()) with check (is_admin());

-- -------------------------------------------------------------
-- resources
-- -------------------------------------------------------------
-- Lecture : PUBLISHED pour tous, PENDING/REJECTED pour le propriétaire ou admin
drop policy if exists resources_select on resources;
create policy resources_select on resources
  for select using (
    status = 'PUBLISHED'
    or uploaded_by = auth.uid()
    or is_admin()
  );

-- Insertion : l'utilisateur ne peut créer que pour lui-même, statut PENDING forcé
drop policy if exists resources_insert on resources;
create policy resources_insert on resources
  for insert with check (
    auth.uid() = uploaded_by
    and status = 'PENDING'
  );

-- Mise à jour : propriétaire (champs limités) ou admin
drop policy if exists resources_update_owner on resources;
create policy resources_update_owner on resources
  for update using (
    uploaded_by = auth.uid() or is_admin()
  ) with check (
    -- Un étudiant ne peut pas s'auto-publier
    uploaded_by = auth.uid()
    and status = (select status from resources where id = resources.id)
  );

drop policy if exists resources_admin_update on resources;
create policy resources_admin_update on resources
  for update using (is_admin()) with check (is_admin());

-- Suppression : propriétaire ou admin
drop policy if exists resources_delete on resources;
create policy resources_delete on resources
  for delete using (uploaded_by = auth.uid() or is_admin());

-- -------------------------------------------------------------
-- materials
-- -------------------------------------------------------------
drop policy if exists materials_select on materials;
create policy materials_select on materials
  for select using (
    status in ('PUBLISHED', 'SOLD', 'RENTED', 'CLOSED')
    or seller_id = auth.uid()
    or is_admin()
  );

drop policy if exists materials_insert on materials;
create policy materials_insert on materials
  for insert with check (
    auth.uid() = seller_id
    and status = 'PENDING'
  );

drop policy if exists materials_update_owner on materials;
create policy materials_update_owner on materials
  for update using (
    seller_id = auth.uid() or is_admin()
  ) with check (
    seller_id = auth.uid()
    -- Interdit à un étudiant de s'auto-publier
    and status in ('PENDING', 'SOLD', 'RENTED', 'CLOSED')
  );

drop policy if exists materials_admin_update on materials;
create policy materials_admin_update on materials
  for update using (is_admin()) with check (is_admin());

drop policy if exists materials_delete on materials;
create policy materials_delete on materials
  for delete using (seller_id = auth.uid() or is_admin());

-- -------------------------------------------------------------
-- material_images
-- -------------------------------------------------------------
drop policy if exists material_images_select on material_images;
create policy material_images_select on material_images
  for select using (
    exists (
      select 1 from materials m
      where m.id = material_images.material_id
        and (
          m.status in ('PUBLISHED', 'SOLD', 'RENTED', 'CLOSED')
          or m.seller_id = auth.uid()
          or is_admin()
        )
    )
  );

drop policy if exists material_images_write on material_images;
create policy material_images_write on material_images
  for all using (
    exists (
      select 1 from materials m
      where m.id = material_images.material_id
        and (m.seller_id = auth.uid() or is_admin())
    )
  ) with check (
    exists (
      select 1 from materials m
      where m.id = material_images.material_id
        and (m.seller_id = auth.uid() or is_admin())
    )
  );

-- -------------------------------------------------------------
-- reports
-- -------------------------------------------------------------
-- L'auteur voit ses signalements, l'admin voit tout
drop policy if exists reports_select on reports;
create policy reports_select on reports
  for select using (reported_by = auth.uid() or is_admin());

drop policy if exists reports_insert on reports;
create policy reports_insert on reports
  for insert with check (
    auth.uid() = reported_by
    and status = 'OPEN'
  );

drop policy if exists reports_admin_update on reports;
create policy reports_admin_update on reports
  for update using (is_admin()) with check (is_admin());

-- -------------------------------------------------------------
-- admin_audit_logs
-- -------------------------------------------------------------
drop policy if exists audit_select_admin on admin_audit_logs;
create policy audit_select_admin on admin_audit_logs
  for select using (is_admin());

drop policy if exists audit_insert_admin on admin_audit_logs;
create policy audit_insert_admin on admin_audit_logs
  for insert with check (is_admin());

-- =============================================================
-- NOTE : le backend Flask utilise la clé SERVICE_ROLE qui
-- bypasse RLS. Les policies servent de seconde ligne de défense
-- pour tout accès direct (ex: SDK Supabase côté client).
-- =============================================================
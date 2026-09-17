-- =============================================================
-- DocuCamp — Index de performance
-- =============================================================

-- profiles
create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_profiles_institution on profiles(institution_id);
create index if not exists idx_profiles_program on profiles(program_id);

-- programs
create index if not exists idx_programs_institution on programs(institution_id);

-- subjects
create index if not exists idx_subjects_program on subjects(program_id);

-- resources
create index if not exists idx_resources_status on resources(status);
create index if not exists idx_resources_institution on resources(institution_id);
create index if not exists idx_resources_program on resources(program_id);
create index if not exists idx_resources_subject on resources(subject_id);
create index if not exists idx_resources_level on resources(level);
create index if not exists idx_resources_type on resources(resource_type);
create index if not exists idx_resources_year on resources(academic_year);
create index if not exists idx_resources_semester on resources(semester);
create index if not exists idx_resources_uploader on resources(uploaded_by);
create index if not exists idx_resources_created_at on resources(created_at desc);
-- Index de recherche full-text simple
create index if not exists idx_resources_title_trgm
  on resources using gin (title gin_trgm_ops);

-- materials
create index if not exists idx_materials_status on materials(status);
create index if not exists idx_materials_category on materials(category);
create index if not exists idx_materials_transaction on materials(transaction_type);
create index if not exists idx_materials_institution on materials(institution_id);
create index if not exists idx_materials_seller on materials(seller_id);
create index if not exists idx_materials_price on materials(price);
create index if not exists idx_materials_created_at on materials(created_at desc);
create index if not exists idx_materials_title_trgm
  on materials using gin (title gin_trgm_ops);

-- material_images
create index if not exists idx_material_images_material on material_images(material_id, sort_order);

-- reports
create index if not exists idx_reports_status on reports(status);
create index if not exists idx_reports_resource on reports(resource_id);
create index if not exists idx_reports_material on reports(material_id);
create index if not exists idx_reports_reporter on reports(reported_by);

-- admin_audit_logs
create index if not exists idx_audit_admin on admin_audit_logs(admin_id);
create index if not exists idx_audit_target on admin_audit_logs(target_type, target_id);
create index if not exists idx_audit_created_at on admin_audit_logs(created_at desc);

-- Extension trigram (nécessaire pour idx_*_title_trgm)
create extension if not exists pg_trgm;
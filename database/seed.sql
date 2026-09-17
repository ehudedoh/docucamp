-- =============================================================
-- DocuCamp — Données de démonstration
-- =============================================================
-- ⚠️ À exécuter APRÈS avoir créé les utilisateurs de démo via
-- Supabase Auth (Dashboard > Authentication > Add user).
-- Les UUID ci-dessous doivent être remplacés par les vrais.
--
-- Comptes à créer manuellement :
--   etudiant@docucamp.demo  / DemoEtudiant2024!
--   admin@docucamp.demo     / DemoAdmin2024!
-- =============================================================

-- -------------------------------------------------------------
-- Institutions
-- -------------------------------------------------------------
insert into institutions (id, name, city, country) values
  ('11111111-1111-1111-1111-111111111111', 'Université de Dakar', 'Dakar', 'Sénégal'),
  ('22222222-2222-2222-2222-222222222222', 'Université Cheikh Anta Diop', 'Dakar', 'Sénégal'),
  ('33333333-3333-3333-3333-333333333333', 'Institut Polytechnique de Dakar', 'Dakar', 'Sénégal')
on conflict (id) do nothing;

-- -------------------------------------------------------------
-- Programs
-- -------------------------------------------------------------
insert into programs (id, institution_id, name) values
  ('aaaaaaa1-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Génie Informatique'),
  ('aaaaaaa1-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Génie Civil'),
  ('aaaaaaa1-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Génie Électrique'),
  ('aaaaaaa1-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'Mathématiques'),
  ('aaaaaaa1-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333', 'Réseaux et Télécoms')
on conflict (id) do nothing;

-- -------------------------------------------------------------
-- Subjects
-- -------------------------------------------------------------
insert into subjects (id, program_id, name, code) values
  ('bbbbbbb1-0000-0000-0000-000000000001', 'aaaaaaa1-0000-0000-0000-000000000001', 'Algorithmique', 'ALGO101'),
  ('bbbbbbb1-0000-0000-0000-000000000002', 'aaaaaaa1-0000-0000-0000-000000000001', 'Structures de données', 'SD102'),
  ('bbbbbbb1-0000-0000-0000-000000000003', 'aaaaaaa1-0000-0000-0000-000000000001', 'Bases de données', 'BDD201'),
  ('bbbbbbb1-0000-0000-0000-000000000004', 'aaaaaaa1-0000-0000-0000-000000000001', 'Réseaux', 'RES201'),
  ('bbbbbbb1-0000-0000-0000-000000000005', 'aaaaaaa1-0000-0000-0000-000000000002', 'Résistance des matériaux', 'RDM201'),
  ('bbbbbbb1-0000-0000-0000-000000000006', 'aaaaaaa1-0000-0000-0000-000000000004', 'Analyse', 'ANA101'),
  ('bbbbbbb1-0000-0000-0000-000000000007', 'aaaaaaa1-0000-0000-0000-000000000005', 'Télécommunications', 'TEL301')
on conflict (id) do nothing;

-- -------------------------------------------------------------
-- ⚠️ IMPORTANT : créez d'abord les 2 utilisateurs dans Supabase Auth
-- puis remplacez les UUID ci-dessous par les leurs.
-- -------------------------------------------------------------

-- Exemple (à adapter) :
-- update profiles set role = 'ADMIN' where id = '<uuid-admin>';
-- update profiles set institution_id = '11111111-1111-1111-1111-111111111111',
--                     program_id = 'aaaaaaa1-0000-0000-0000-000000000001',
--                     level = 'L3'
--               where id = '<uuid-etudiant>';

-- -------------------------------------------------------------
-- Documents de démonstration (15)
-- Remplacer <UUID_ETUDIANT> par l'UUID réel du compte étudiant.
-- -------------------------------------------------------------
-- insert into resources (title, description, resource_type, institution_id, program_id, subject_id,
--   level, academic_year, semester, file_url, file_name, file_size, uploaded_by, status)
-- values
--   ('Examen Algorithmique 2023', 'Sujet complet avec barème.', 'EXAM',
--    '11111111-1111-1111-1111-111111111111', 'aaaaaaa1-0000-0000-0000-000000000001',
--    'bbbbbbb1-0000-0000-0000-000000000001', 'L2', '2022-2023', 'S2',
--    'https://example.com/files/algo2023.pdf', 'algo2023.pdf', 245760,
--    '<UUID_ETUDIANT>', 'PUBLISHED'),
--   ... (14 autres)
-- ;

-- -------------------------------------------------------------
-- Matériel de démonstration (10 annonces)
-- -------------------------------------------------------------
-- insert into materials (title, description, category, transaction_type, price, rental_period,
--   condition, institution_id, seller_id, status)
-- values
--   ('Calculatrice Casio FX-991', 'Très bon état, peu utilisée.', 'CALCULATOR', 'SALE',
--    15000, null, 'VERY_GOOD', '11111111-1111-1111-1111-111111111111',
--    '<UUID_ETUDIANT>', 'PUBLISHED'),
--   ... (9 autres)
-- ;

-- -------------------------------------------------------------
-- Images de matériel
-- -------------------------------------------------------------
-- insert into material_images (material_id, image_url, sort_order)
-- values ('<UUID_MATERIAL>', 'https://example.com/img/calc1.jpg', 0);

-- =============================================================
-- FIN DU SEED
-- =============================================================
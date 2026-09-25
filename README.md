# DocuCamp

> Apprendre. Partager. S'équiper.

PWA d'entraide académique et matérielle pour étudiants.

## Stack

- Frontend : React + JavaScript (Vite, Tailwind, Lucide)
- Backend : Flask (REST API)
- Base de données : PostgreSQL via Supabase
- Auth : Supabase Auth
- Stockage : Supabase Storage

## Structure

- `frontend/` — PWA React
- `backend/` — API Flask
- `database/` — schéma SQL, RLS, seed

## Installation

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev

## Base de données

Exécuter dans l'ordre (Supabase → SQL Editor) :
1. `database/schema.sql`
2. `database/policies.sql`
3. `database/migrations/001_downloads_favorites_notifications_storage.sql`
   (tables `download_history`, `favorites`, `notifications`, fonction
   `increment_download_count`, buckets `documents` [privé] et `material-images` [public])


## PWA & logo

- **Changer le logo** : remplacer `frontend/branding/logo.svg` (ou `logo.png`), puis `cd frontend && npm run icons`.
  Voir `frontend/branding/README.md`. Génère favicon, icônes PWA, icône iOS et logo de la barre de navigation.
- **Installation** : l'appli est installable (Chrome/Edge/Android : bouton « Installer » + bannière ;
  iOS Safari : instructions « Sur l'écran d'accueil »). L'installation exige **HTTPS** (ou `localhost`).
- Le manifest est généré par `vite-plugin-pwa` dans `frontend/vite.config.js` :
  ne pas recréer `public/manifest.webmanifest`.
- Tester en local : `npm run build && npm run preview`, puis Chrome → DevTools → Application → Manifest.

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
create table if not exists profiles (id uuid primary key, full_name text, role text default 'user', created_at timestamptz default now());
create table if not exists documents (id bigint generated always as identity primary key, title text not null, description text, owner_id uuid references profiles(id), created_at timestamptz default now());
create table if not exists materials (id bigint generated always as identity primary key, name text not null, description text, owner_id uuid references profiles(id), created_at timestamptz default now());

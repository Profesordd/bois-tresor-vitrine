-- =============================================
-- BOIS TRESOR — Schéma Supabase
-- À exécuter dans l'éditeur SQL de Supabase
--
-- État actuel du site : le catalogue (produits/catégories) affiché sur le
-- site est géré en dur dans lib/products.ts (aucune clé Supabase requise
-- pour l'aperçu). Les tables ci-dessous préparent la bascule future vers un
-- vrai catalogue en base, et sont déjà utilisées par :
--   - le suivi de commande (app/api/orders/track) → tables orders/order_items
--   - rien d'autre pour l'instant (pas de paiement réel branché)
-- =============================================

create extension if not exists "uuid-ossp";

-- =============================================
-- TYPES
-- =============================================
create type order_status as enum (
  'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
);

-- =============================================
-- TABLES CATALOGUE (prêtes pour une future bascule depuis lib/products.ts)
-- =============================================

create table if not exists categories (
  id         uuid primary key default uuid_generate_v4(),
  slug       text not null unique,
  name       text not null,
  family     text not null check (family in ('bois-de-chauffage', 'granules')),
  created_at timestamptz not null default now()
);

create table if not exists products (
  id             uuid primary key default uuid_generate_v4(),
  slug           text not null unique,
  name           text not null,
  tagline        text,
  description    text,
  price          numeric(10,2) not null check (price >= 0),
  original_price numeric(10,2)         check (original_price >= 0),
  stock          integer not null default 0 check (stock >= 0),
  family         text not null check (family in ('bois-de-chauffage', 'granules')),
  subtype        text not null check (subtype in ('buche', 'granule')),
  specs          jsonb not null default '[]',
  category_id    uuid references categories(id) on delete set null,
  badge          text,
  rating         numeric(2,1),
  review_count   integer default 0,
  created_at     timestamptz not null default now()
);

insert into categories (slug, name, family) values
  ('bois-de-chauffage',   'Bois de chauffage',   'bois-de-chauffage'),
  ('granules-et-pellets', 'Granulés & pellets',  'granules')
on conflict (slug) do nothing;

-- =============================================
-- COMMANDES — utilisées par le suivi de commande
-- =============================================

create table if not exists orders (
  id                   uuid primary key default uuid_generate_v4(),
  order_number         text not null unique default upper(substr(md5(random()::text), 1, 8)),
  status               order_status not null default 'pending',
  total                numeric(10,2) not null check (total >= 0),
  customer_email       text not null,
  customer_name        text not null,
  customer_phone       text,
  shipping_address     jsonb not null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table if not exists order_items (
  id            uuid primary key default uuid_generate_v4(),
  order_id      uuid not null references orders(id) on delete cascade,
  product_id    uuid references products(id) on delete set null,
  quantity      integer not null check (quantity > 0),
  price         numeric(10,2) not null check (price >= 0),
  product_name  text not null
);

-- =============================================
-- INDEX
-- =============================================
create index if not exists products_slug_idx      on products(slug);
create index if not exists products_category_idx  on products(category_id);
create index if not exists orders_order_number_idx on orders(order_number);
create index if not exists orders_email_idx        on orders(customer_email);
create index if not exists order_items_order_idx   on order_items(order_id);

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_updated_at
  before update on orders
  for each row execute procedure update_updated_at();

-- =============================================
-- RLS
-- =============================================
alter table categories   enable row level security;
alter table products     enable row level security;
alter table orders       enable row level security;
alter table order_items  enable row level security;

create policy "Lecture publique categories" on categories for select using (true);
create policy "Lecture publique products"   on products   for select using (true);

-- Le site actuel ne crée pas encore de commandes réelles (pas de paiement
-- branché) — ces policies servent uniquement le futur flux de commande.
create policy "Insert public orders" on orders for insert with check (true);
create policy "Select public orders" on orders for select using (true);
create policy "Update orders"        on orders for update using (true);

create policy "Insert public order_items" on order_items for insert with check (true);
create policy "Select public order_items" on order_items for select using (true);

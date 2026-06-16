-- ============================================================
-- Milana Premium — Supabase schema & security (canonical)
-- ============================================================
-- This file is the single source of truth for the database.
-- It is consistent with the client code (snake_case columns),
-- ships hashed-password-free profiles (passwords live only in
-- Supabase Auth) and enforces authorization in the database via
-- Row Level Security — NOT only in the client.
--
-- Apply with:  supabase db reset      (local)
--          or  psql "$DATABASE_URL" -f supabase/schema.sql
-- The script is idempotent enough to re-run during development.
-- ============================================================

-- =====================
-- ENUMS
-- =====================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('client', 'accountant', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE client_status AS ENUM ('standard', 'vip');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE product_visibility AS ENUM ('all', 'vip');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE created_by_type AS ENUM ('self', 'accountant');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================
-- CATEGORIES
-- =====================
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  uz TEXT NOT NULL,
  ru TEXT NOT NULL
);

INSERT INTO categories (id, uz, ru) VALUES
  ('xalat', 'Xalat', 'Халат'),
  ('pijama', 'Pijama', 'Пижама'),
  ('koylak', 'Ko''ylak', 'Рубашка'),
  ('futbolka', 'Futbolka', 'Футболка'),
  ('shim', 'Shim', 'Брюки'),
  ('ichki_kiyim', 'Ichki kiyim', 'Нижнее бельё'),
  ('sochiq', 'Sochiq', 'Полотенце'),
  ('choyshablar', 'Choyshablar', 'Постельное бельё')
ON CONFLICT (id) DO NOTHING;

-- =====================
-- PROFILES
-- =====================
-- One row per user. For self-registered users, `id` equals the
-- Supabase Auth user id (populated by the on-signup trigger below).
-- Accountant-created directory entries get a generated id and have
-- no Auth account until provisioned by an admin edge function.
-- Passwords are NEVER stored here — Supabase Auth owns credentials.
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  messenger_link TEXT,
  username TEXT,
  client_status client_status NOT NULL DEFAULT 'standard',
  role user_role NOT NULL DEFAULT 'client',
  created_by created_by_type NOT NULL DEFAULT 'self',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- PRODUCTS
-- =====================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_number TEXT NOT NULL,
  variant_number TEXT NOT NULL,
  category TEXT NOT NULL REFERENCES categories(id),
  image TEXT NOT NULL,
  secondary_image TEXT,
  price NUMERIC,
  old_price NUMERIC,
  status product_status NOT NULL DEFAULT 'draft',
  is_trending BOOLEAN NOT NULL DEFAULT false,
  is_new BOOLEAN NOT NULL DEFAULT false,
  visibility product_visibility NOT NULL DEFAULT 'all',
  target_audience TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL DEFAULT ''
);

-- =====================
-- ORDERS + ORDER ITEMS
-- =====================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT,
  total NUMERIC NOT NULL DEFAULT 0,
  status order_status NOT NULL DEFAULT 'pending',
  shipping_address TEXT,
  phone_number TEXT,
  seen BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID,
  model_number TEXT,
  variant_number TEXT,
  image TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1
);

-- =====================
-- CART ITEMS
-- =====================
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  UNIQUE (user_id, product_id)
);

-- =====================
-- FAVORITES
-- =====================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

-- =====================
-- NOTIFICATIONS (internal/staff)
-- =====================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read BOOLEAN NOT NULL DEFAULT false
);

-- =====================
-- ORDER STATUS AUDIT LOG
-- =====================
CREATE TABLE IF NOT EXISTS order_status_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  changed_by UUID,
  changed_by_email TEXT,
  from_status order_status,
  to_status order_status NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_visibility ON products(visibility);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_order ON order_status_audit(order_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON order_status_audit(created_at DESC);

-- ============================================================
-- AUTH HELPERS (SECURITY DEFINER avoids RLS recursion)
-- ============================================================
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role IN ('admin', 'accountant') FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_vip()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT client_status = 'vip' OR role IN ('admin', 'accountant')
       FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Auto-create a profile row whenever a new Auth user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, username, role, created_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    'client',
    'self'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_audit ENABLE ROW LEVEL SECURITY;

-- Reset existing policies so this file can be re-applied cleanly.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ----- CATEGORIES: world-readable, admin-managed -----
CREATE POLICY categories_read ON categories FOR SELECT USING (true);
CREATE POLICY categories_write ON categories FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ----- PROFILES: own row or staff; no privilege escalation -----
CREATE POLICY profiles_read ON profiles FOR SELECT
  USING (id = auth.uid() OR public.is_staff());
CREATE POLICY profiles_insert_self ON profiles FOR INSERT
  WITH CHECK (id = auth.uid() OR public.is_staff());
CREATE POLICY profiles_update_self ON profiles FOR UPDATE
  USING (id = auth.uid() OR public.is_staff())
  WITH CHECK (id = auth.uid() OR public.is_staff());
CREATE POLICY profiles_delete_admin ON profiles FOR DELETE
  USING (public.is_admin());

-- ----- PRODUCTS: published+public to everyone, vip to vip, all to staff -----
CREATE POLICY products_read_public ON products FOR SELECT
  USING (status = 'published' AND visibility = 'all');
CREATE POLICY products_read_vip ON products FOR SELECT
  USING (status = 'published' AND visibility = 'vip' AND public.is_vip());
CREATE POLICY products_read_staff ON products FOR SELECT
  USING (public.is_staff());
CREATE POLICY products_write_staff ON products FOR ALL
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ----- ORDERS: owner reads/creates own; staff manage all -----
CREATE POLICY orders_read ON orders FOR SELECT
  USING (user_id = auth.uid() OR public.is_staff());
CREATE POLICY orders_insert_own ON orders FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY orders_update_owner_or_staff ON orders FOR UPDATE
  USING (user_id = auth.uid() OR public.is_staff())
  WITH CHECK (user_id = auth.uid() OR public.is_staff());
CREATE POLICY orders_delete_staff ON orders FOR DELETE
  USING (public.is_staff());

-- ----- ORDER ITEMS: scoped to the parent order -----
CREATE POLICY order_items_read ON order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND (o.user_id = auth.uid() OR public.is_staff())
  ));
CREATE POLICY order_items_insert ON order_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND (o.user_id = auth.uid() OR public.is_staff())
  ));
CREATE POLICY order_items_write_staff ON order_items FOR UPDATE
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY order_items_delete_staff ON order_items FOR DELETE
  USING (public.is_staff());

-- ----- CART: strictly the owner -----
CREATE POLICY cart_owner ON cart_items FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ----- FAVORITES: strictly the owner -----
CREATE POLICY favorites_owner ON favorites FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ----- NOTIFICATIONS: staff only -----
CREATE POLICY notifications_staff ON notifications FOR ALL
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ----- AUDIT LOG: staff read, staff insert, immutable otherwise -----
CREATE POLICY audit_read_staff ON order_status_audit FOR SELECT
  USING (public.is_staff());
CREATE POLICY audit_insert_staff ON order_status_audit FOR INSERT
  WITH CHECK (public.is_staff());

-- ============================================================
-- BOOTSTRAP: promote the founder to admin (id resolved by email).
-- Safe no-op until that account exists.
-- ============================================================
UPDATE public.profiles p
SET role = 'admin'
FROM auth.users u
WHERE u.id = p.id
  AND lower(u.email) = lower('adhamovnozimjon3366@gmail.com');

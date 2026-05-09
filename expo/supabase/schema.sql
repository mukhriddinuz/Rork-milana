-- ============================================
-- Supabase Schema for Milana B2B Textile Platform
-- ============================================

-- =====================
-- ENUMS
-- =====================

CREATE TYPE user_role AS ENUM ('warehouse', 'accountant', 'client');
CREATE TYPE product_status AS ENUM ('draft', 'published');
CREATE TYPE client_status AS ENUM ('standard', 'vip');
CREATE TYPE product_visibility AS ENUM ('all', 'vip');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled');
CREATE TYPE created_by_type AS ENUM ('self', 'accountant');

-- =====================
-- CATEGORIES
-- =====================

CREATE TABLE categories (
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
  ('choyshablar', 'Choyshablar', 'Постельное бельё');

-- =====================
-- USERS
-- =====================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'client',
  username TEXT UNIQUE NOT NULL,
  password TEXT
);

-- =====================
-- CLIENT PROFILES
-- =====================

CREATE TABLE "clientProfiles" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  location TEXT NOT NULL,
  phone TEXT NOT NULL,
  "messengerLink" TEXT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  "clientStatus" client_status NOT NULL DEFAULT 'standard',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdBy" created_by_type NOT NULL DEFAULT 'self'
);

-- =====================
-- PRODUCTS
-- =====================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "modelNumber" TEXT NOT NULL,
  "variantNumber" TEXT NOT NULL,
  category TEXT NOT NULL REFERENCES categories(id),
  image TEXT NOT NULL,
  price NUMERIC,
  "oldPrice" NUMERIC,
  status product_status NOT NULL DEFAULT 'draft',
  "isTrending" BOOLEAN NOT NULL DEFAULT false,
  visibility product_visibility NOT NULL DEFAULT 'all',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdBy" TEXT NOT NULL
);

-- =====================
-- ORDERS
-- =====================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "clientId" TEXT NOT NULL,
  "clientName" TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total NUMERIC NOT NULL DEFAULT 0,
  status order_status NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  seen BOOLEAN NOT NULL DEFAULT false
);

-- =====================
-- NOTIFICATIONS
-- =====================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId" TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  read BOOLEAN NOT NULL DEFAULT false
);

-- =====================
-- CART ITEMS
-- =====================

CREATE TABLE "cartItems" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "productId" UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  UNIQUE ("userId", "productId")
);

-- =====================
-- FAVORITES
-- =====================

CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "productId" UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("userId", "productId")
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clientProfiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cartItems" ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- =====================
-- READ POLICIES (all users can read)
-- =====================

CREATE POLICY "Allow public read on categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Allow public read on users"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Allow public read on clientProfiles"
  ON "clientProfiles" FOR SELECT
  USING (true);

CREATE POLICY "Allow public read on products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Allow public read on orders"
  ON orders FOR SELECT
  USING (true);

CREATE POLICY "Allow public read on notifications"
  ON notifications FOR SELECT
  USING (true);

CREATE POLICY "Allow public read on cartItems"
  ON "cartItems" FOR SELECT
  USING (true);

CREATE POLICY "Allow public read on favorites"
  ON favorites FOR SELECT
  USING (true);

-- =====================
-- WRITE POLICIES (open for now — tighten later)
-- =====================

CREATE POLICY "Allow public insert on products"
  ON products FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on products"
  ON products FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on products"
  ON products FOR DELETE USING (true);

CREATE POLICY "Allow public insert on orders"
  ON orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on orders"
  ON orders FOR UPDATE USING (true);

CREATE POLICY "Allow public insert on clientProfiles"
  ON "clientProfiles" FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on clientProfiles"
  ON "clientProfiles" FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on clientProfiles"
  ON "clientProfiles" FOR DELETE USING (true);

CREATE POLICY "Allow public insert on users"
  ON users FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on users"
  ON users FOR UPDATE USING (true);

CREATE POLICY "Allow public insert on cartItems"
  ON "cartItems" FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on cartItems"
  ON "cartItems" FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on cartItems"
  ON "cartItems" FOR DELETE USING (true);

CREATE POLICY "Allow public insert on favorites"
  ON favorites FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete on favorites"
  ON favorites FOR DELETE USING (true);

CREATE POLICY "Allow public insert on notifications"
  ON notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on notifications"
  ON notifications FOR UPDATE USING (true);

CREATE POLICY "Allow public insert on categories"
  ON categories FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on categories"
  ON categories FOR UPDATE USING (true);

-- =====================
-- INDEXES
-- =====================

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_visibility ON products(visibility);
CREATE INDEX idx_orders_client_id ON orders("clientId");
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_cart_user ON "cartItems"("userId");
CREATE INDEX idx_favorites_user ON favorites("userId");
CREATE INDEX idx_notifications_order ON notifications("orderId");

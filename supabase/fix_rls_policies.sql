-- ============================================================================
-- SCRIPT DE CORRECCIÓN DE POLÍTICAS RLS EN SUPABASE POSTGRES
-- Ejecuta este script en el SQL Editor de tu Dashboard de Supabase
-- (https://supabase.com/dashboard/project/kuixombfmlwcaxbwcmmr/sql/new)
-- ============================================================================

-- 1. Habilitar RLS en todas las tablas
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas restrictivas anteriores
DROP POLICY IF EXISTS "Public Read Business" ON businesses;
DROP POLICY IF EXISTS "Allow Insert Business" ON businesses;
DROP POLICY IF EXISTS "Allow Update Business" ON businesses;
DROP POLICY IF EXISTS "Allow All Businesses" ON businesses;

DROP POLICY IF EXISTS "Public Read Categories" ON categories;
DROP POLICY IF EXISTS "Admin CRUD Categories" ON categories;
DROP POLICY IF EXISTS "Allow All Categories" ON categories;

DROP POLICY IF EXISTS "Public Read Products" ON products;
DROP POLICY IF EXISTS "Admin CRUD Products" ON products;
DROP POLICY IF EXISTS "Allow All Products" ON products;

DROP POLICY IF EXISTS "Public Insert Order" ON orders;
DROP POLICY IF EXISTS "Public Read Order by ID" ON orders;
DROP POLICY IF EXISTS "Admin CRUD Orders" ON orders;
DROP POLICY IF EXISTS "Allow All Orders" ON orders;

DROP POLICY IF EXISTS "Public Insert Order Items" ON order_items;
DROP POLICY IF EXISTS "Public Read Order Items" ON order_items;
DROP POLICY IF EXISTS "Admin CRUD Order Items" ON order_items;
DROP POLICY IF EXISTS "Allow All Order Items" ON order_items;

DROP POLICY IF EXISTS "Users Read Own Profile" ON business_users;
DROP POLICY IF EXISTS "Allow All Business Users" ON business_users;

-- 3. Crear políticas globales permisivas para INSERT, SELECT, UPDATE y DELETE
CREATE POLICY "Allow All Businesses" ON businesses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Order Items" ON order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Business Users" ON business_users FOR ALL USING (true) WITH CHECK (true);

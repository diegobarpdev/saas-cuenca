-- ============================================================================
-- SAAS CUENCA - BASE DE DATOS MULTI-TENANT CON RLS Y SECUENCIAL DE PEDIDOS
-- ============================================================================

-- 1. EXTENSIONES NECESARIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE NEGOCIOS (Tenants)
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  ruc TEXT,
  telefono_whatsapp TEXT NOT NULL,
  direccion TEXT,
  logo_url TEXT,
  datos_bancarios JSONB DEFAULT '{
    "banco": "Banco Pichincha",
    "tipo_cuenta": "Ahorros",
    "numero_cuenta": "",
    "titular": "",
    "ruc_ci": "",
    "email": ""
  }'::jsonb,
  zonas_envio JSONB DEFAULT '[
    {"id": "z1", "zona": "Centro Histórico / El Ejido", "costo": 1.50},
    {"id": "z2", "zona": "Totoracocha / Monay", "costo": 2.00},
    {"id": "z3", "zona": "Yanuncay / Baños", "costo": 2.50},
    {"id": "z4", "zona": "Challuabamba", "costo": 3.50}
  ]'::jsonb,
  payphone_token TEXT,
  plan TEXT DEFAULT 'trial',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USUARIOS DEL NEGOCIO (Auth aislada)
CREATE TABLE IF NOT EXISTS business_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('dueño', 'cajero')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CATEGORÍAS DE PRODUCTOS
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PRODUCTOS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  en_oferta BOOLEAN DEFAULT false,
  precio_oferta NUMERIC(10,2),
  etiqueta_promo TEXT,
  stock INTEGER DEFAULT 0,
  imagen_url TEXT,
  disponible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PEDIDOS (Orders)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  numero_pedido INTEGER NOT NULL,
  cliente_nombre TEXT NOT NULL,
  cliente_telefono TEXT NOT NULL,
  cliente_direccion TEXT,
  latitud NUMERIC(10,8),
  longitud NUMERIC(11,8),
  tipo_entrega TEXT NOT NULL CHECK (tipo_entrega IN ('domicilio', 'retiro_local', 'mesa')),
  numero_mesa TEXT,
  costo_envio NUMERIC(10,2) DEFAULT 0.00,
  subtotal NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('efectivo', 'payphone', 'transferencia')),
  estado_pago TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'pagado', 'verificando', 'rechazado')),
  comprobante_pago_url TEXT,
  payphone_transaction_id TEXT,
  requiere_factura BOOLEAN DEFAULT false,
  datos_facturacion JSONB DEFAULT '{}'::jsonb,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptado', 'en_preparacion', 'listo', 'entregado', 'cancelado')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ÍTEMS DEL PEDIDO (Order Items)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(10,2) NOT NULL,
  notas TEXT
);

-- -------------------------------------------------------------
-- TRIGGER PARA GENERAR NUMERO DE PEDIDO SECUENCIAL POR NEGOCIO
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_next_order_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(numero_pedido), 0) + 1
  INTO next_num
  FROM orders
  WHERE business_id = NEW.business_id;

  NEW.numero_pedido := next_num;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_order_number ON orders;
CREATE TRIGGER trg_set_order_number
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION generate_next_order_number();

-- -------------------------------------------------------------
-- HELPER FUNCTION PARA RLS SIN RECURSIÓN
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_auth_business_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT business_id FROM business_users WHERE id = auth.uid() LIMIT 1;
$$;

-- -------------------------------------------------------------
-- -------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) - POLÍTICAS COMPLETAS Y PERMISIVAS
-- -------------------------------------------------------------
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Limpieza de políticas previas
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

-- Políticas de acceso universal sin restricciones de auth.uid() para desarrollo / client-side
CREATE POLICY "Allow All Businesses" ON businesses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Order Items" ON order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Business Users" ON business_users FOR ALL USING (true) WITH CHECK (true);

-- Habilitar Supabase Realtime para la tabla de pedidos
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

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
  -- Módulos / Add-ons Contratados
  has_payphone BOOLEAN DEFAULT false,
  has_live_kitchen BOOLEAN DEFAULT false,
  has_pos_printing BOOLEAN DEFAULT false,
  has_crm_export BOOLEAN DEFAULT false,
  has_custom_domain BOOLEAN DEFAULT false,
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
  aceptado_at TIMESTAMPTZ,
  en_preparacion_at TIMESTAMPTZ,
  listo_at TIMESTAMPTZ,
  entregado_at TIMESTAMPTZ,
  cancelado_at TIMESTAMPTZ,
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

-- 8. TURNOS Y APERTURA DE CAJA
CREATE TABLE IF NOT EXISTS business_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rol_ejecutado TEXT NOT NULL CHECK (rol_ejecutado IN ('dueño', 'cajero', 'cocinero', 'cajero-1', 'cajero-2')),
  fecha_apertura TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_cierre TIMESTAMPTZ,
  estado TEXT NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CAJAS REGISTRADORAS Y ARQUEOS
CREATE TABLE IF NOT EXISTS cash_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES business_shifts(id) ON DELETE CASCADE,
  nombre_caja TEXT NOT NULL DEFAULT 'Caja 1',
  monto_apertura NUMERIC(10,2) NOT NULL CHECK (monto_apertura >= 0),
  monto_cierre_declarado NUMERIC(10,2),
  ventas_efectivo_calculado NUMERIC(10,2) DEFAULT 0.00,
  ventas_transferencia_calculado NUMERIC(10,2) DEFAULT 0.00,
  ventas_payphone_calculado NUMERIC(10,2) DEFAULT 0.00,
  ingresos_manuales_efectivo NUMERIC(10,2) DEFAULT 0.00,
  egresos_manuales_efectivo NUMERIC(10,2) DEFAULT 0.00,
  diferencia_efectivo NUMERIC(10,2) DEFAULT 0.00,
  estado_auditoria TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_auditoria IN ('pendiente', 'aprobado_sin_novedad', 'ajustado_con_observacion')),
  comentarios_auditoria TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TRANSACCIONES MANUALES DE CAJA CHICA
CREATE TABLE IF NOT EXISTS cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  register_id UUID NOT NULL REFERENCES cash_registers(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  monto NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  motivo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS para las nuevas tablas
ALTER TABLE business_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS permisivas
CREATE POLICY "Allow All Business Shifts" ON business_shifts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Cash Registers" ON cash_registers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Cash Transactions" ON cash_transactions FOR ALL USING (true) WITH CHECK (true);

-- Agregar relación a orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES business_shifts(id) ON DELETE SET NULL;

-- 11. GRUPO DE OPCIONES DE PRODUCTO
CREATE TABLE IF NOT EXISTS product_option_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  seleccion_minima INTEGER NOT NULL DEFAULT 1 CHECK (seleccion_minima >= 0),
  seleccion_maxima INTEGER NOT NULL DEFAULT 1 CHECK (seleccion_maxima >= 1),
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. VALORES DE OPCIONES / MODIFICADORES
CREATE TABLE IF NOT EXISTS product_option_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES product_option_groups(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  precio_adicional NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (precio_adicional >= 0),
  disponible BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. ACTUALIZACIÓN EN DETALLES DEL PEDIDO
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS opciones_seleccionadas JSONB DEFAULT '[]'::jsonb;

-- Habilitar RLS para las nuevas tablas de personalización
ALTER TABLE product_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_values ENABLE ROW LEVEL SECURITY;

-- Políticas de desarrollo abiertas
CREATE POLICY "Allow All Option Groups" ON product_option_groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Option Values" ON product_option_values FOR ALL USING (true) WITH CHECK (true);

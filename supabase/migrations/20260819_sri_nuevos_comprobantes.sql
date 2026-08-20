-- Nuevas columnas en business_sri_config
ALTER TABLE business_sri_config
  ADD COLUMN IF NOT EXISTS regimen_tributario TEXT NOT NULL DEFAULT 'GENERAL'
    CHECK (regimen_tributario IN ('GENERAL', 'RIMPE_EMPRENDEDOR', 'RIMPE_NEGOCIO_POPULAR')),
  ADD COLUMN IF NOT EXISTS es_agente_retencion BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS numero_resolucion_retencion TEXT,
  ADD COLUMN IF NOT EXISTS es_contribuyente_especial BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS numero_contribuyente_especial TEXT,
  ADD COLUMN IF NOT EXISTS obligado_contabilidad BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS secuencial_nota_credito INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS secuencial_retencion INTEGER NOT NULL DEFAULT 1;

-- Tabla notas_credito
CREATE TABLE IF NOT EXISTS notas_credito (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  factura_id UUID NOT NULL REFERENCES facturas_electronicas(id),
  clave_acceso TEXT NOT NULL UNIQUE,
  numero_autorizacion TEXT,
  fecha_autorizacion TIMESTAMPTZ,
  ambiente TEXT NOT NULL DEFAULT 'pruebas' CHECK (ambiente IN ('pruebas', 'produccion')),
  estado TEXT NOT NULL DEFAULT 'generada' CHECK (estado IN ('generada', 'en_proceso', 'autorizada', 'rechazada')),
  xml_firmado TEXT,
  xml_autorizado TEXT,
  ride_pdf_url TEXT,
  numero_secuencial TEXT NOT NULL,
  fecha_emision DATE NOT NULL,
  motivo TEXT NOT NULL,
  cod_doc_modificado TEXT NOT NULL DEFAULT '01',
  num_doc_modificado TEXT NOT NULL,
  fecha_emision_doc_sustento DATE NOT NULL,
  subtotal_sin_impuestos NUMERIC(10,2) NOT NULL DEFAULT 0,
  iva NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  receptor_tipo_doc TEXT CHECK (receptor_tipo_doc IN ('RUC', 'CEDULA', 'PASAPORTE')),
  receptor_num_doc TEXT,
  receptor_razon_social TEXT,
  email_enviado BOOLEAN DEFAULT false,
  errores JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notas_credito ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all notas_credito" ON notas_credito FOR ALL USING (true) WITH CHECK (true);

-- Tabla comprobantes_retencion
CREATE TABLE IF NOT EXISTS comprobantes_retencion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  clave_acceso TEXT NOT NULL UNIQUE,
  numero_autorizacion TEXT,
  fecha_autorizacion TIMESTAMPTZ,
  ambiente TEXT NOT NULL DEFAULT 'pruebas' CHECK (ambiente IN ('pruebas', 'produccion')),
  estado TEXT NOT NULL DEFAULT 'generada' CHECK (estado IN ('generada', 'en_proceso', 'autorizada', 'rechazada')),
  xml_firmado TEXT,
  xml_autorizado TEXT,
  ride_pdf_url TEXT,
  numero_secuencial TEXT NOT NULL,
  fecha_emision DATE NOT NULL,
  periodo_fiscal TEXT NOT NULL,
  proveedor_tipo_doc TEXT NOT NULL CHECK (proveedor_tipo_doc IN ('RUC', 'CEDULA', 'PASAPORTE')),
  proveedor_num_doc TEXT NOT NULL,
  proveedor_razon_social TEXT NOT NULL,
  proveedor_email TEXT,
  num_doc_sustento TEXT NOT NULL,
  fecha_doc_sustento DATE NOT NULL,
  num_autorizacion_sustento TEXT,
  total_sin_impuestos NUMERIC(10,2) NOT NULL DEFAULT 0,
  retenciones JSONB NOT NULL DEFAULT '[]',
  total_retenido NUMERIC(10,2) NOT NULL DEFAULT 0,
  email_enviado BOOLEAN DEFAULT false,
  errores JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE comprobantes_retencion ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all comprobantes_retencion" ON comprobantes_retencion FOR ALL USING (true) WITH CHECK (true);

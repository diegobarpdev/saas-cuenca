# Prompt para desarrollo: SaaS de pedidos multi-negocio con pagos locales e impresión de tickets (Cuenca - Ecuador)

---

## PROMPT

Quiero que me ayudes a construir el MVP de un SaaS multi-tenant (multi-empresa) de pedidos online y catálogo digital para negocios de retail, gastronomía y comercio local en Cuenca, Ecuador. Actúa como un **ingeniero de software senior full-stack y diseñador UI/UX líder** aplicando las mejores prácticas en cada decisión. Antes de escribir código, propón la estructura de carpetas y pídeme confirmación.

---

### Contexto del producto

**El problema que resuelve:** Los negocios locales reciben pedidos por WhatsApp como texto libre ("hola quiero 2 camisas talla M"), y alguien tiene que volver a transcribir esto manualmente a una venta. Esto genera errores, demoras y pérdida de clientes por atención lenta. 

**Nuestra solución:** El cliente arma su pedido en un catálogo web optimizado para móviles (sin necesidad de crear cuenta), elige su método de pago (PayPhone, Transferencia/Deuna con comprobante, o Efectivo), ingresa opcionalmente sus datos de facturación (RUC/Cédula) y envía el pedido. El pedido llega **estructurado y en tiempo real** al panel del negocio con alerta sonora y formato listo para **impresión de ticket/comanda térmica**. El cliente recibe una URL única para rastrear el estado de su pedido en vivo.

---

### Requisitos Críticos e Innegociables

#### 1. Aislamiento Multi-Empresa Estricto (Zero-Data-Leakage)
- **Multi-tenant desde la base de datos:** Cada negocio es un registro en la tabla `businesses`. Absolutamente TODAS las tablas hijas (`categories`, `products`, `orders`, `order_items`, `business_users`) deben incluir la columna `business_id`.
- **Row Level Security (RLS) en Supabase Mandatorio:** RLS activo en TODAS las tablas. Ninguna query directa desde el frontend o cliente API podrá leer, modificar o eliminar datos de otro negocio diferente al autenticado en el token JWT (`auth.uid() -> business_id`).
- **Seguridad en la API pública:** El catálogo público del cliente lee únicamente productos con `disponible = true` filtrados strictly por el `slug` del negocio consultado.
- **Auditoría de Aislamiento:** En cada fase del desarrollo, debes incluir pruebas explícitas de RLS asegurando que el Negocio A jamás pueda ver los productos, clientes ni pedidos del Negocio B.

#### 2. Datos de Facturación (Requerimiento Legal Ecuador)
- En el checkout, el cliente tendrá la opción de marcar **"¿Requieres Factura con Datos?"**
- Campos obligatorios si requiere factura:
  - **Tipo de documento:** Cédula / RUC / Pasaporte.
  - **Número de identificación:** (Cédula 10 dígitos / RUC 13 dígitos).
  - **Razón Social / Nombre Completo**.
  - **Correo electrónico de facturación**.
  - **Dirección fiscal**.
- Si no requiere factura, el pedido se procesa automáticamente etiquetado como **"Consumidor Final"**.
- Estos datos deben guardarse estructurados en la orden (`datos_facturacion` JSONB) y mostrarse claramente en el panel de control y en el ticket impreso.

#### 3. Impresión de Tickets / Comandas Térmicas (58mm / 80mm)
- **Botón de 1-clic "Imprimir Ticket"** en el panel del negocio para cada pedido.
- **Vista de impresión optimizada (CSS Media `@media print`):** Formato idéntico a impresora POS térmica de 58mm y 80mm.
- **Contenido del Ticket:**
  - Encabezado: Nombre del negocio, RUC, Dirección y Teléfono.
  - Cabecera del pedido: Número Secuencial (ej: `#0048`), Fecha/Hora, Tipo de Entrega (Domicilio/Retiro/Mesa).
  - Datos del Cliente: Nombre, Teléfono, Dirección de entrega.
  - Desglose de Facturación: RUC/CI, Razón Social, Email de facturación.
  - Tabla de Productos: Cantidad, Nombre del producto, Precio unitario, Subtotal.
  - Totales: Subtotal, Costo de envío, Total a Pagar.
  - Método de Pago y Estado del Pago (Ej: *PAYPHONE - PAGADO*, *TRANSFERENCIA - POR VERIFICAR*, *EFECTIVO*).

---

### Directivas de Diseño UI/UX y Estética Premium (Design System)

Como Diseñador UI/UX y Frontend Engineer, debes asegurar que el producto se vea **moderno, elegante y sumamente intuitivo**. Aplica las siguientes directivas:

1. **Aesthetic & WOW Factor (Estética de Alto Impacto):**
   - Evita colores planos primarios o diseños aburridos/genéricos.
   - Utiliza una paleta de colores curada y armónica (ej: tonos oscuros profundos para el panel del negocio y tonos limpios/vibrantes para el catálogo).
   - Implementa tipografía moderna de **Google Fonts** (`Plus Jakarta Sans`, `Outfit` o `Inter`).
   - Usa degradados suaves, bordes sutiles de `1px` con opacidad (`border-slate-200/60` o `border-white/10`), y elevación mediante sombras difuminadas (*blur shadows*).

2. **Diseño Mobile-First & Touch-Friendly (Catálogo y Checkout):**
   - El 90% de los usuarios navegarán desde smartphones. Todas las zonas de interacción (botones de agregar al carrito, selectores de cantidad) deben tener un objetivo táctil mínimo de `44px x 44px`.
   - Carrito flotante inferior que se despliega mediante modales fluidos estilo *Bottom Sheet*.
   - Estados de carga (*Skeleton Loaders*) durante la sincronización para evitar saltos de pantalla (CLS).

3. **Micro-interacciones y Estados Activos:**
   - Feedback háptico/visual inmediato al presionar botones (efectos de escala activa `active:scale-95`).
   - Badges animados para estados del pedido (ej: un punto verde pulsante para pedidos *En preparación*).
   - Notificación emergente (Toast) y sonido distintivo tipo "caja registradora" cuando entra un pedido en el panel del negocio.

4. **Diseño Específico del Ticket de Impresión:**
   - Estilo térmico limpio, fuente monospaciada (`Courier New` o `monospace`), alineación perfecta de columnas y divisores punteados (`--------------------------------`).

---

### Flujo Funcional Esperado

1. **Catálogo Público (`tuapp.com/{slug-del-negocio}`):** Cliente explora productos por categorías con fotos, precios y stock.
2. **Carrito y Checkout Mobile-First:**
   - Selección de Tipo de Entrega: *Envío a domicilio* (tarifado dinámicamente por zonas de Cuenca), *Retiro en local* ($0), o *Pedido en Mesa* (si escaneó QR presencial).
   - Selección de Método de Pago:
     - **PayPhone (Tarjeta / App):** Pago en línea seguro mediante el botón/SDK de PayPhone Ecuador.
     - **Transferencia / Deuna!:** Muestra los datos bancarios del negocio y permite adjuntar la foto del comprobante de pago.
     - **Efectivo / Contra entrega.**
   - Formulario de Facturación: Consumidor Final o Datos de Factura (RUC/CI).
3. **Generación del Pedido con Secuencial Único:** Se asigna un `numero_pedido` secuencial por negocio (ej: `#0001`, `#0002`).
4. **Tracking para el Cliente (`tuapp.com/{slug}/pedido/{order_id}`):** URL pública donde el cliente observa la barra de estado en vivo (*Pendiente ➔ Aceptado ➔ En preparación ➔ Listo / En camino*).
5. **Panel del Negocio en Tiempo Real:**
   - Sonido de alerta de nuevo pedido.
   - Panel de control estilo Kanban / Lista con actualización sin recargar la página (Supabase Realtime).
   - Botón directo para **Imprimir Ticket Thermal**, botón para **Abrir Chat de WhatsApp con Ticket Formateado**, y visualizador del comprobante de pago subido.

---

### Stack Técnico Recomendado

- **Backend / DB / Realtime / Auth / Storage:** **Supabase** (Postgres con RLS + Storage para imágenes de productos y comprobantes + Edge Functions para Webhooks de PayPhone).
- **Frontend:** **Next.js (App Router)** + React para optimización SEO en catálogo público y experiencia PWA ultra rápida en el panel.
- **Estilos / UI:** **Tailwind CSS** + Lucide Icons + Google Fonts (`Plus Jakarta Sans`) + CSS para impresión de tickets térmicos (`@media print`).
- **Pagos:** API / SDK de **PayPhone Ecuador**.
- **Hosting:** Vercel (Frontend) + Supabase (Backend Cloud).

---

### Esquema de Base de Datos Enriquecido

```sql
-- 1. TABLA NEGOCIOS (Tenants)
businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  nombre text NOT NULL,
  ruc text,
  telefono_whatsapp text NOT NULL,
  direccion text,
  logo_url text,
  datos_bancarios jsonb DEFAULT '{}', -- { banco, tipo_cuenta, numero_cuenta, ruc, titular, email }
  zonas_envio jsonb DEFAULT '[]',     -- [{"zona": "Centro / Ejido", "costo": 1.50}, {"zona": "Challuabamba", "costo": 3.00}]
  payphone_token text,               -- Token/Client ID de PayPhone del negocio (encriptado)
  plan text DEFAULT 'trial',         -- 'trial', 'basico', 'pro'
  created_at timestamp with time zone DEFAULT now()
);

-- 2. USUARIOS DEL NEGOCIO (Auth aislada)
business_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  rol text NOT NULL CHECK (rol IN ('dueño', 'cajero')),
  created_at timestamp with time zone DEFAULT now()
);

-- 3. CATEGORÍAS DE PRODUCTOS
categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  orden integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. PRODUCTOS
products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  nombre text NOT NULL,
  descripcion text,
  precio numeric(10,2) NOT NULL CHECK (precio >= 0),
  stock integer DEFAULT 0,
  imagen_url text,
  disponible boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 5. PEDIDOS (Orders)
orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  numero_pedido integer NOT NULL,     -- Secuencial por negocio (#1, #2, #3...)
  cliente_nombre text NOT NULL,
  cliente_telefono text NOT NULL,
  cliente_direccion text,
  latitud numeric(10,8),
  longitud numeric(11,8),
  tipo_entrega text NOT NULL CHECK (tipo_entrega IN ('domicilio', 'retiro_local', 'mesa')),
  numero_mesa text,
  costo_envio numeric(10,2) DEFAULT 0.00,
  subtotal numeric(10,2) NOT NULL,
  total numeric(10,2) NOT NULL,
  metodo_pago text NOT NULL CHECK (metodo_pago IN ('efectivo', 'payphone', 'transferencia')),
  estado_pago text NOT NULL DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'pagado', 'verificando', 'rechazado')),
  comprobante_pago_url text,           -- Foto de comprobante de transferencia / Deuna
  payphone_transaction_id text,
  
  -- DATOS DE FACTURACIÓN ECUADOR
  requiere_factura boolean DEFAULT false,
  datos_facturacion jsonb DEFAULT '{}', -- { tipo_doc: 'RUC'|'CEDULA', num_doc: '0102...', razon_social: '...', email: '...', direccion: '...' }
  
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptado', 'en_preparacion', 'listo', 'entregado', 'cancelado')),
  created_at timestamp with time zone DEFAULT now()
);

-- 6. ÍTEMS DEL PEDIDO (Order Items)
order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  precio_unitario numeric(10,2) NOT NULL, -- Snapshot del precio en el momento de la venta
  notas text                             -- Ej: "Sin cebolla", "Talla M"
);
```

---

### Alcance Definido para el MVP

**SI Incluir:**
1. **Multi-tenancy con RLS Estricto:** Políticas RLS verificadas en Postgres para aislamiento absoluto entre empresas.
2. **Diseño UI/UX Premium & Mobile-First:** Guía de estilos moderna con Tailwind, Google Fonts, micro-interacciones y Skeleton Loaders.
3. **Panel de Gestión de Negocio:** Login, gestión de productos/categorías, configuración de datos bancarios, RUC y zonas de envío.
4. **Catálogo Público y Checkout Móvil:** Con selección de entrega, datos de facturación (Cédula/RUC), subida de comprobante y pago PayPhone.
5. **Panel de Pedidos en Tiempo Real:** Alerta sonora de nuevo pedido, tablero de estados en vivo.
6. **Módulo de Impresión de Tickets / Comandas:** Vista de impresión optimizada para tickets de 58mm y 80mm con datos completos de facturación y pedido.
7. **Webhooks de PayPhone:** Supabase Edge Function para actualización automática del pago.

**NO Incluir por ahora:**
- Emisión directa de XML/Facturación electrónica SRI (se dejan los datos de facturación listos para integrar un proveedor SRI en la fase 2).
- WhatsApp Business API oficial de cobro mensual (usar redirección directa `wa.me`).
- Multi-sucursal por negocio.

---

### Metodología y Fases de Ejecución

1. **Fase 1 - Arquitectura, Base de Datos y Design System:** Propón la estructura de carpetas de Next.js, la paleta de colores/fuentes en Tailwind y el script SQL definitivo para Supabase con políticas RLS y Triggers para el secuencial `numero_pedido`. **Pídeme confirmación antes de escribir código.**
2. **Fase 2 - Panel de Negocio, RLS Testing y UI Base:** Implementar Auth + CRUD de productos con interfaz premium y probar que un usuario del Negocio A jamás pueda acceder a registros del Negocio B.
3. **Fase 3 - Catálogo Público, Facturación y Checkout Mobile-First:** Construir el catálogo y checkout móvil con formulario de RUC/Cédula, subida de comprobantes y botón PayPhone.
4. **Fase 4 - Realtime, Ticket de Impresión y Tracking:** Implementar las notificaciones en vivo en el panel, el diseño del ticket térmico de 58mm/80mm y la URL de seguimiento para el cliente.
5. **Fase 5 - Webhooks y Despliegue:** Configurar la Edge Function de PayPhone y desplegar en Vercel + Supabase.

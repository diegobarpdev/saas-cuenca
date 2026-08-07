# 🧠 MEMORIA DEL PROYECTO — YAPI.EC (SaaS Pedidos Multi-Empresa)

Este archivo sirve como **fuente única de verdad y memoria técnica** para cualquier sesión o agente AI en este proyecto.

---

## 📌 1. Identidad de Marca & Visión
* **Nombre Comercial Oficial:** **`Yapi`** (`Yapi.ec` / `yapiec.com`)
* **Contacto Oficial / WhatsApp Admin:** **`+593 96 930 7527`** (`593969307527`)
* **Propósito:** Plataforma SaaS multi-inquilino (*multi-tenant*) de comercio electrónico y pedidos en línea en tiempo real para restaurantes, panaderías, cafeterías y tiendas en **Cuenca y Ecuador**.
* **Diferenciador Clave:** 0% comisiones por venta (Modelo SaaS de Plan Base $15/mes + Add-ons a la carta). El concepto "Yapi" evoca la "yapa" o beneficio directo para el negocio y cliente.

---

## 🔐 2. Credenciales y Accesos de Desarrollo
* **Super Admin Portal:** `/super-admin/login`
  * **Usuario:** `admin`
  * **Contraseña:** `cuenca2026`
* **Negocio de Prueba Activo en Supabase DB:**
  * **Nombre:** `Restaurante Tiopamba`
  * **Slug URL Público:** `/restaurante-tiopamba`
  * **ID en Supabase:** `04a106fb-4db1-4142-974c-c6dc74c7e4f9`
* **Supabase Project:** `kuixombfmlwcaxbwcmmr.supabase.co`
  * Credenciales guardadas en [`.env.local`](file:///C:/Users/soportectin/Documents/dbdp/saas-cuenca/.env.local).

---

## 🗄️ 3. Arquitectura de Base de Datos (Supabase Postgres DB)
El esquema completo está sincronizado en [`supabase/schema.sql`](file:///C:/Users/soportectin/Documents/dbdp/saas-cuenca/supabase/schema.sql):

1. **`businesses`**: Empresas registradas con slug único, RUC, WhatsApp, plan (`trial`, `basico`, `pro`), datos bancarios de Deuna!/Pichincha y token PayPhone.
2. **`business_users`**: Usuarios vinculados a empresas con roles (`admin`, `staff`). Usa la función `SECURITY DEFINER` `get_auth_business_id()` para evitar recursión RLS (`42P17`).
3. **`categories`**: Categorías de productos ordenadas por `orden`.
4. **`products`**: Productos del menú con precio, stock, URL foto y bandera de disponibilidad.
5. **`orders`**: Pedidos en tiempo real con número secuencial (trigger `trg_set_order_number`), tipo de entrega (`domicilio`, `retiro_local`, `mesa`), método de pago (`payphone`, `transferencia`, `efectivo`), datos de facturación para Ecuador y estado del pedido (`pendiente`, `aceptado`, `en_preparacion`, `listo`, `entregado`).
6. **`order_items`**: Ítems del pedido con cantidad, precio unitario y notas personalizadas.

---

## 🎨 4. Sistema de Diseño UI & Componentes Clave
* **Estilo Estético:** *"Luxe Bistro / Obsidian & Gold"* con paleta de colores oscura obsidian (`#090C15`), acentos dorados (`amber-400`), púrpura master y esmeralda.
* **Tipografías Google Fonts:** `Outfit` (Headings), `Space Grotesk` (Precios/Badges) y `Plus Jakarta Sans` (Body). Cargadas en [`app/layout.tsx`](file:///C:/Users/soportectin/Documents/dbdp/saas-cuenca/app/layout.tsx) y [`app/globals.css`](file:///C:/Users/soportectin/Documents/dbdp/saas-cuenca/app/globals.css).
* **Componentes Principales:**
  * [`CustomSelect.tsx`](file:///C:/Users/soportectin/Documents/dbdp/saas-cuenca/components/ui/CustomSelect.tsx): Componente desplegable personalizado con diseño glassmorphic neón (sin selectores nativos feos).
  * [`SkeletonCatalog.tsx`](file:///C:/Users/soportectin/Documents/dbdp/saas-cuenca/components/ui/SkeletonCatalog.tsx): Esqueleto de carga resplandeciente mientras consulta en vivo Supabase (cero datos falsos mock).
  * [`CustomerOrdersDrawer.tsx`](file:///C:/Users/soportectin/Documents/dbdp/saas-cuenca/components/catalog/CustomerOrdersDrawer.tsx): Cajón flotante de rastreo en tiempo real para compras del cliente.
  * [`useCustomerOrders.ts`](file:///C:/Users/soportectin/Documents/dbdp/saas-cuenca/hooks/useCustomerOrders.ts): Sistema de auto-completado seguro local (`localStorage`) alineado a la LOPDP de Ecuador.
  * [`TicketThermal.tsx`](file:///C:/Users/soportectin/Documents/dbdp/saas-cuenca/components/ticket/TicketThermal.tsx): Impresión térmica POS de comandas de cocina (58mm / 80mm).

---

## 📄 5. Enlaces a Documentación Relevante
* **Plan Financiero y Estrategia Comercial:** [`PLAN_FINANCIERO_YAPI.md`](file:///C:/Users/soportectin/Documents/dbdp/saas-cuenca/PLAN_FINANCIERO_YAPI.md)
* **Esquema SQL de Supabase:** [`supabase/schema.sql`](file:///C:/Users/soportectin/Documents/dbdp/saas-cuenca/supabase/schema.sql)

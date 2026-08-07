---
name: database-architect
description: Master database design, relational schema architecture, Supabase PostgreSQL optimizations, RLS security policies, and real-time subscription management.
---

# Database Architect Guidelines (Supabase & PostgreSQL)

## 1. Schema Integrity & Relationships
- **Primary Keys**: Use `UUID` with `gen_random_uuid()` for all public/multi-tenant entities (`negocios`, `pedidos`, `productos`).
- **Foreign Keys**: Enforce `ON DELETE CASCADE` or `ON DELETE RESTRICT` with explicit indexed foreign keys.
- **Timestamps**: All tables must include `created_at TIMESTAMPTZ DEFAULT NOW()` and `updated_at TIMESTAMPTZ DEFAULT NOW()`.

## 2. Row Level Security (RLS) & Multi-Tenancy
- **Enable RLS**: Every table in Supabase must have `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`.
- **Tenant Isolation**: Isolate business data using `business_id` (or `slug` lookup):
  ```sql
  CREATE POLICY "Public read active business products"
  ON productos FOR SELECT
  USING (is_active = true);

  CREATE POLICY "Admin full access to business orders"
  ON pedidos FOR ALL
  USING (business_id = auth.uid());
  ```

## 3. Query Optimization & Indexing
- **Composite Indexes**: Add B-tree indexes for high-frequency filters (e.g. `CREATE INDEX idx_pedidos_business_estado ON pedidos(business_id, estado);`).
- **JSONB Strategy**: Use `jsonb` for flexible structures (like `datos_facturacion` or `detalles_orden`) with GIN indexing when queried.
- **Pagination**: Use cursor-based or `created_at` indexed range queries over expensive `OFFSET` queries.

## 4. Real-time Subscriptions & Triggers
- Enable Supabase Realtime publication selectively on high-priority operational tables (`pedidos`):
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;
  ```
- **Automated Triggers**: Use Postgres triggers for automated timestamp updates and stock calculation.

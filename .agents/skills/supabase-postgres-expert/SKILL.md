---
name: supabase-postgres-expert
description: Best practices for Supabase SSR client integration, type generation, edge functions, storage compression, and real-time listeners in Next.js App Router.
---

# Supabase & PostgreSQL Expert Workflow

## 1. Supabase SSR Integration (`@supabase/ssr`)
- Separate client creation into `lib/supabase/client.ts` (Browser) and `lib/supabase/server.ts` (Server Components & API Routes).
- Always type client queries using generated database types from `lib/types/database.ts`.

## 2. Real-time Subscription Hooks
- Manage realtime channels inside custom React hooks (`useRealtimeOrders`) with clean cleanup on unmount:
  ```typescript
  const channel = supabase
    .channel('orders-db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, handlePayload)
    .subscribe();
  return () => { supabase.removeChannel(channel); };
  ```

## 3. Storage & Image Compression
- Compress images client-side (`imageCompressor.ts`) before uploading to Supabase Storage buckets to save bandwidth and reduce latency.
- Serve images using CDN public URLs with caching headers.

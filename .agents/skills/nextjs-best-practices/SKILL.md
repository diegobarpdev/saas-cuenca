---
name: nextjs-best-practices
description: Next.js App Router best practices, Server Components, client state isolation, route handlers, and performance optimization.
---

# Next.js App Router Best Practices

## 1. Server vs Client Components
- Keep pages as **Server Components** by default to minimize client JS bundles.
- Use `'use client'` only at the leaves for interactive UI components (drawers, modals, forms, sound players).

## 2. Dynamic Routing & Multi-Tenancy
- Group slug routes under `app/[slug]/` for business catalog landing, checkout, and order tracking pages.
- Handle metadata dynamically using `generateMetadata` for custom business SEO titles and og-images.

## 3. Performance & Asset Optimization
- Use Next.js `font/google` for custom font loading with zero Layout Shift (CLS).
- Optimize imports for `lucide-react` to prevent tree-shaking overhead.

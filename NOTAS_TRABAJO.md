# Notas de Trabajo — Kaltiro SaaS

## Última sesión: 2026-08-19

---

## Lo que se hizo hoy

### 1. Facturación electrónica SRI — Firma XAdES-BES corregida
- **Problema**: Error `[39] FIRMA INVALIDA` al enviar al SRI
- **Causa raíz**: `<xades:SignedProperties>` no incluía `xmlns:ds` en forma standalone; C14N inclusivo renderiza todos los namespaces en scope, pero al calcular el digest standalone faltaba el `xmlns:ds` heredado del ancestro `<ds:Signature>`
- **Fixes aplicados en `lib/sri/signer.ts`**:
  - Agregado `xmlns:ds="..."` al root de `signedPropsTemplate`
  - Selección de certificado por módulo RSA (no `[0]` que puede ser CA)
  - Orden correcto de referencias en SignedInfo: SignedProperties primero, documento segundo
  - `URI="#comprobante"` en vez de `URI=""`
  - `DataObjectFormat` en SignedProperties
  - SigningTime sin milisegundos
- **Estado**: Factura autorizada exitosamente por el SRI

### 2. Cuenta demo nunca expira
- Fix en `AdminLayoutClient.tsx`: `slug !== 'restaurante-demo'` en el check de trial
- Fix en `usePlanLimits.ts`: slug correcto `'restaurante-demo'`

### 3. Número de factura completo en UI
- Se extrae `001-001-000000001` directo de `clave_acceso` (posiciones 24-26, 27-29, 30-38)
- No requiere query adicional

### 4. Notas de Crédito y Comprobantes de Retención — IMPLEMENTADO
**Archivos nuevos:**
- `lib/sri/xml-nota-credito.ts` — XML codDoc='04' v1.1.0
- `lib/sri/xml-retencion.ts` — XML codDoc='07' v2.0.0
- `lib/sri/engine-nota-credito.ts`
- `lib/sri/engine-retencion.ts`
- `lib/sri/ride-nota-credito.ts`
- `lib/sri/ride-retencion.ts`
- `app/api/sri/nota-credito/route.ts`
- `app/api/sri/retencion/route.ts`
- `supabase/migrations/20260819_sri_nuevos_comprobantes.sql`

**Archivos modificados:**
- `lib/sri/types.ts` — NotaCreditoRequest, RetencionRequest, RetencionDetalle, DocSustentoRetencion
- `lib/sri/clave.ts` — tipoComprobante acepta '01' | '02' | '04' | '07'
- `lib/sri/xml.ts` — exporta calcularTotales y formatFechaSRI
- `lib/sri/email.ts` — acepta tipoDocumento y numeroDocumento opcionales
- `lib/types/database.ts` — NotaCredito, ComprobanteRetencion, BusinessSriConfig extendido
- `app/[slug]/app/sri-config/page.tsx` — sección Régimen y Obligaciones
- `app/[slug]/app/facturacion/page.tsx` — tabs Facturas / Notas de Crédito / Retenciones

**DB aplicada en Supabase** (proyecto `kuixombfmlwcaxbwcmmr`):
- 8 columnas nuevas en `business_sri_config`
- Tabla `notas_credito`
- Tabla `comprobantes_retencion`

---

## Pendiente / Para mañana

### Prioridad alta
- [ ] **Probar Nota de Crédito end-to-end** — emitir NC sobre una factura autorizada real en pruebas
- [ ] **Probar Retención end-to-end** — configurar negocio como agente de retención y emitir
- [ ] **Nota de Venta (RIMPE Negocio Popular)** — codDoc='02', sin IVA desglosado, `<rise>` en XML. No implementado aún. Solo aplica para negocios con régimen RIMPE_NEGOCIO_POPULAR.

### Prioridad media
- [ ] **Múltiples establecimientos/puntos de emisión** — para cadenas tipo KFC con varios locales. Requiere UI para gestionar varios `business_sri_config` por negocio.
- [ ] **Reenvío manual de RIDE por email** — botón en la UI para reenviar el PDF al cliente
- [ ] **Descarga directa del XML autorizado** — para el cliente que necesita el XML original del SRI
- [ ] **Consulta de estado de facturas en proceso** — botón "Verificar con SRI" para facturas en estado `en_proceso`

### Prioridad baja
- [ ] **Guía de Remisión** — codDoc='06', para traslado de mercadería entre locales. Solo cadenas grandes.
- [ ] **Liquidación de Compra** — codDoc='03', para proveedores sin RUC (artesanos, agricultores informales)

---

## Arquitectura SRI actual

```
lib/sri/
  types.ts          — Todos los tipos (SriConfig, FacturaRequest, NotaCreditoRequest, RetencionRequest...)
  clave.ts          — generarClaveAcceso(), numeroFactura()
  xml.ts            — generarXmlFactura(), calcularTotales(), formatFechaSRI()
  xml-nota-credito  — generarXmlNotaCredito()
  xml-retencion     — generarXmlRetencion()
  signer.ts         — firmarXml() XAdES-BES — NO TOCAR
  soap.ts           — enviarComprobante(), autorizarConReintentos()
  engine.ts         — emitirFactura()
  engine-nota-credito — emitirNotaCredito()
  engine-retencion  — emitirRetencion()
  ride.ts           — generarRidePdf() para facturas
  ride-nota-credito — generarRideNotaCreditoPdf()
  ride-retencion    — generarRideRetencionPdf()
  email.ts          — enviarRideEmail()

app/api/sri/
  emitir/           — POST facturas
  nota-credito/     — POST notas de crédito
  retencion/        — POST comprobantes de retención
```

## Endpoints SRI Ecuador
- **Pruebas recepción**: `https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl`
- **Pruebas autorización**: `https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl`
- **Producción recepción**: `https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl`
- **Producción autorización**: `https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl`

## Formato clave de acceso (49 dígitos)
```
[0-7]   fecha DDMMAAAA
[8-9]   tipo comprobante (01=factura, 02=nota venta, 04=NC, 07=retención)
[10-22] RUC emisor (13 dígitos)
[23]    ambiente (1=pruebas, 2=producción)
[24-26] establecimiento
[27-29] punto de emisión
[30-38] secuencial (9 dígitos)
[39-46] código numérico aleatorio (8 dígitos)
[47]    tipo emisión (1=normal)
[48]    dígito verificador módulo 11
```

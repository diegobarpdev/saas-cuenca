import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { emitirFactura } from '@/lib/sri/engine';
import { generarRidePdf } from '@/lib/sri/ride';
import { enviarRideEmail } from '@/lib/sri/email';
import { numeroFactura } from '@/lib/sri/clave';
import type { FacturaItem, FacturaReceptor, SriConfig } from '@/lib/sri/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const FORMA_PAGO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia bancaria',
  tarjeta: 'Tarjeta / PayPhone',
};

export async function POST(req: Request) {
  try {
    const { orderId, businessId } = await req.json();

    if (!orderId || !businessId) {
      return NextResponse.json({ error: 'orderId y businessId son requeridos' }, { status: 400 });
    }

    // 1. Verificar que no hay factura previa autorizada
    const { data: facturaExistente } = await supabase
      .from('facturas_electronicas')
      .select('id, estado')
      .eq('order_id', orderId)
      .in('estado', ['autorizada', 'en_proceso'])
      .maybeSingle();

    if (facturaExistente) {
      return NextResponse.json({ error: 'Este pedido ya tiene una factura en proceso o autorizada' }, { status: 409 });
    }

    // 2. Cargar config SRI del negocio
    const { data: sriConfig, error: configError } = await supabase
      .from('business_sri_config')
      .select('*')
      .eq('business_id', businessId)
      .eq('activo', true)
      .maybeSingle();

    if (configError || !sriConfig) {
      return NextResponse.json({ error: 'El negocio no tiene configuración SRI activa' }, { status: 404 });
    }
    if (!sriConfig.certificado_p12_base64 || !sriConfig.certificado_clave) {
      return NextResponse.json({ error: 'El negocio no tiene certificado digital cargado' }, { status: 400 });
    }

    // 3. Cargar el pedido con sus items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*, products(nombre, precio))')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }
    if (!order.requiere_factura || !order.datos_facturacion) {
      return NextResponse.json({ error: 'Este pedido no tiene datos de facturación' }, { status: 400 });
    }

    // 4. Preparar datos
    const datos = order.datos_facturacion;

    const receptor: FacturaReceptor = {
      tipoDoc: datos.tipo_doc,
      numDoc: datos.num_doc,
      razonSocial: datos.razon_social,
      email: datos.email,
      direccion: datos.direccion,
    };

    const items: FacturaItem[] = (order.order_items ?? []).map((item: any, idx: number) => {
      const nombre = item.nombre_producto ?? item.products?.nombre ?? `Ítem ${idx + 1}`;
      return {
        codigo: String(idx + 1).padStart(3, '0'),
        descripcion: nombre,
        cantidad: item.cantidad,
        precioUnitario: parseFloat(item.precio_unitario),
        descuento: 0,
        ivaCodigoPorcentaje: 4 as 4,
        ivaTarifa: 15 as 15,
      };
    });

    if (items.length === 0) {
      return NextResponse.json({ error: 'El pedido no tiene items' }, { status: 400 });
    }

    const config: SriConfig = {
      rucEmisor: sriConfig.ruc_emisor,
      razonSocial: sriConfig.razon_social,
      nombreComercial: sriConfig.nombre_comercial,
      direccionMatriz: sriConfig.direccion_matriz,
      codigoEstablecimiento: sriConfig.codigo_establecimiento,
      codigoPuntoEmision: sriConfig.codigo_punto_emision,
      secuencial: sriConfig.secuencial_actual,
      ambiente: sriConfig.ambiente,
      certificadoP12Base64: sriConfig.certificado_p12_base64,
      certificadoClave: sriConfig.certificado_clave,
    };

    const metodoPago = order.metodo_pago === 'payphone' ? 'tarjeta' : order.metodo_pago;

    // 5. Emitir factura ante el SRI
    const result = await emitirFactura({ config, receptor, items, metodoPago, fechaEmision: new Date(order.created_at), orderId });

    // 6. Calcular totales para almacenar
    const subtotal = parseFloat(order.subtotal);
    const total = parseFloat(order.total);
    const ivaCalculado = parseFloat((total - subtotal).toFixed(2));
    const numFact = numeroFactura(sriConfig.codigo_establecimiento, sriConfig.codigo_punto_emision, sriConfig.secuencial_actual);

    // 7. Guardar factura en DB
    const { data: factura, error: insertError } = await supabase
      .from('facturas_electronicas')
      .insert({
        business_id: businessId,
        order_id: orderId,
        clave_acceso: result.claveAcceso,
        numero_autorizacion: result.numeroAutorizacion,
        fecha_autorizacion: result.fechaAutorizacion,
        ambiente: sriConfig.ambiente,
        estado: result.estado === 'error' ? 'rechazada' : result.estado,
        xml_firmado: result.xmlFirmado,
        xml_autorizado: result.xmlAutorizado,
        numero_secuencial: result.secuencialUsado.toString().padStart(9, '0'),
        fecha_emision: new Date(order.created_at).toISOString().split('T')[0],
        subtotal_sin_impuestos: subtotal,
        iva: ivaCalculado > 0 ? ivaCalculado : 0,
        total,
        receptor_tipo_doc: receptor.tipoDoc,
        receptor_num_doc: receptor.numDoc,
        receptor_razon_social: receptor.razonSocial,
        receptor_email: receptor.email,
        receptor_direccion: receptor.direccion,
        errores: result.errores,
      })
      .select()
      .single();

    if (insertError) console.error('Error guardando factura:', insertError);

    // 8. Incrementar secuencial si fue exitoso
    if (result.success) {
      await supabase
        .from('business_sri_config')
        .update({ secuencial_actual: sriConfig.secuencial_actual + 1, updated_at: new Date().toISOString() })
        .eq('id', sriConfig.id);
    }

    // 9. Generar RIDE PDF y enviar email (solo si autorizada o en_proceso)
    if (result.success && factura && receptor.email) {
      try {
        const fechaStr = new Date(order.created_at).toLocaleDateString('es-EC', {
          day: '2-digit', month: '2-digit', year: 'numeric',
        });

        // Items para el RIDE
        const rideItems = items.map(item => {
          const precioTotal = item.precioUnitario * item.cantidad - (item.descuento ?? 0);
          return {
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            descuento: item.descuento ?? 0,
            precioTotalSinImpuesto: precioTotal,
            iva: parseFloat(((precioTotal * item.ivaTarifa) / 100).toFixed(2)),
          };
        });

        const pdfBuffer = await generarRidePdf({
          rucEmisor: sriConfig.ruc_emisor,
          razonSocialEmisor: sriConfig.razon_social,
          nombreComercial: sriConfig.nombre_comercial,
          direccionMatriz: sriConfig.direccion_matriz,
          codigoEstablecimiento: sriConfig.codigo_establecimiento,
          codigoPuntoEmision: sriConfig.codigo_punto_emision,
          numeroFactura: numFact,
          claveAcceso: result.claveAcceso,
          fechaEmision: fechaStr,
          ambiente: sriConfig.ambiente,
          numeroAutorizacion: result.numeroAutorizacion,
          fechaAutorizacion: result.fechaAutorizacion,
          tipoDocReceptor: receptor.tipoDoc,
          numDocReceptor: receptor.numDoc,
          razonSocialReceptor: receptor.razonSocial,
          emailReceptor: receptor.email,
          direccionReceptor: receptor.direccion,
          items: rideItems,
          subtotalSinImpuestos: subtotal,
          iva: ivaCalculado > 0 ? ivaCalculado : 0,
          total,
          metodoPago: FORMA_PAGO_LABEL[metodoPago] ?? metodoPago,
        });

        // Subir PDF a Supabase Storage
        const pdfPath = `${businessId}/${factura.id}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from('rides')
          .upload(pdfPath, pdfBuffer, { contentType: 'application/pdf', upsert: true });

        let rideUrl: string | null = null;
        if (!uploadError) {
          const { data: signedUrl } = await supabase.storage
            .from('rides')
            .createSignedUrl(pdfPath, 60 * 60 * 24 * 365); // 1 año
          rideUrl = signedUrl?.signedUrl ?? null;

          await supabase
            .from('facturas_electronicas')
            .update({ ride_pdf_url: rideUrl })
            .eq('id', factura.id);
        }

        // Enviar email con el PDF adjunto
        const emailResult = await enviarRideEmail({
          toEmail: receptor.email,
          toNombre: receptor.razonSocial,
          emisorNombre: sriConfig.nombre_comercial ?? sriConfig.razon_social,
          numeroFactura: numFact,
          fechaEmision: fechaStr,
          total,
          pdfBuffer,
          claveAcceso: result.claveAcceso,
        });

        if (emailResult.success) {
          await supabase
            .from('facturas_electronicas')
            .update({ email_enviado: true })
            .eq('id', factura.id);
        } else {
          console.error('Error enviando email RIDE:', emailResult.error);
        }
      } catch (rideErr) {
        // No fallar la request si el RIDE/email falla — la factura ya está en SRI
        console.error('Error generando RIDE o enviando email:', rideErr);
      }
    }

    return NextResponse.json({
      success: result.success,
      facturaId: factura?.id,
      claveAcceso: result.claveAcceso,
      estado: result.estado,
      numeroAutorizacion: result.numeroAutorizacion,
      numeroFactura: numFact,
      errores: result.errores,
    });
  } catch (err: any) {
    console.error('Error en /api/sri/emitir:', err);
    return NextResponse.json({ error: err.message ?? 'Error interno' }, { status: 500 });
  }
}

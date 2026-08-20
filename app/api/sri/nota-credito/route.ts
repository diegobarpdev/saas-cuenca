import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { emitirNotaCredito } from '@/lib/sri/engine-nota-credito';
import { generarRideNotaCreditoPdf } from '@/lib/sri/ride-nota-credito';
import { enviarRideEmail } from '@/lib/sri/email';
import { numeroFactura } from '@/lib/sri/clave';
import type { FacturaItem, FacturaReceptor, SriConfig } from '@/lib/sri/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const { facturaId, motivo, businessId } = await req.json();

    if (!facturaId || !motivo || !businessId) {
      return NextResponse.json({ error: 'facturaId, motivo y businessId son requeridos' }, { status: 400 });
    }

    // 1. Cargar config SRI del negocio
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

    // 2. Cargar la factura original
    const { data: factura, error: facturaError } = await supabase
      .from('facturas_electronicas')
      .select('*')
      .eq('id', facturaId)
      .eq('business_id', businessId)
      .eq('estado', 'autorizada')
      .maybeSingle();

    if (facturaError || !factura) {
      return NextResponse.json({ error: 'Factura no encontrada o no está autorizada' }, { status: 404 });
    }

    // 3. Verificar que no hay nota de crédito activa para esta factura
    const { data: ncExistente } = await supabase
      .from('notas_credito')
      .select('id, estado')
      .eq('factura_id', facturaId)
      .in('estado', ['autorizada', 'en_proceso'])
      .maybeSingle();

    if (ncExistente) {
      return NextResponse.json({ error: 'Esta factura ya tiene una nota de crédito autorizada o en proceso' }, { status: 409 });
    }

    // 4. Cargar el pedido con sus items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*, products(nombre, precio))')
      .eq('id', factura.order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido original no encontrado' }, { status: 404 });
    }

    // 5. Preparar datos del receptor
    const receptor: FacturaReceptor = {
      tipoDoc: factura.receptor_tipo_doc as 'RUC' | 'CEDULA' | 'PASAPORTE',
      numDoc: factura.receptor_num_doc,
      razonSocial: factura.receptor_razon_social,
      email: factura.receptor_email ?? undefined,
      direccion: factura.receptor_direccion ?? undefined,
    };

    // 6. Preparar items
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

    // 7. Extraer número de la factura original de la clave de acceso
    const ca = factura.clave_acceso ?? '';
    const numDocModificado = ca.length >= 39
      ? `${ca.slice(24, 27)}-${ca.slice(27, 30)}-${ca.slice(30, 39)}`
      : factura.numero_secuencial;

    // 8. Construir SriConfig con el secuencial de nota de crédito
    const config: SriConfig = {
      rucEmisor: sriConfig.ruc_emisor,
      razonSocial: sriConfig.razon_social,
      nombreComercial: sriConfig.nombre_comercial,
      direccionMatriz: sriConfig.direccion_matriz,
      codigoEstablecimiento: sriConfig.codigo_establecimiento,
      codigoPuntoEmision: sriConfig.codigo_punto_emision,
      secuencial: sriConfig.secuencial_nota_credito ?? 1,
      ambiente: sriConfig.ambiente,
      certificadoP12Base64: sriConfig.certificado_p12_base64,
      certificadoClave: sriConfig.certificado_clave,
      obligadoContabilidad: sriConfig.obligado_contabilidad ?? false,
      contribuyenteEspecial: sriConfig.numero_contribuyente_especial ?? null,
      regimenTributario: sriConfig.regimen_tributario ?? 'GENERAL',
    };

    const fechaEmisionDocSustento = new Date(factura.fecha_emision);

    // 9. Emitir nota de crédito ante el SRI
    const result = await emitirNotaCredito({
      config,
      receptor,
      items,
      motivo,
      codDocModificado: '01',
      numDocModificado,
      fechaEmisionDocSustento,
    });

    // 10. Calcular totales
    const subtotal = parseFloat(order.subtotal);
    const total = parseFloat(order.total);
    const ivaCalculado = parseFloat((total - subtotal).toFixed(2));

    const numNC = numeroFactura(
      sriConfig.codigo_establecimiento,
      sriConfig.codigo_punto_emision,
      sriConfig.secuencial_nota_credito ?? 1,
    );

    // 11. Guardar nota de crédito en DB
    const { data: nc, error: insertError } = await supabase
      .from('notas_credito')
      .insert({
        business_id: businessId,
        factura_id: facturaId,
        clave_acceso: result.claveAcceso,
        numero_autorizacion: result.numeroAutorizacion,
        fecha_autorizacion: result.fechaAutorizacion,
        ambiente: sriConfig.ambiente,
        estado: result.estado === 'error' ? 'rechazada' : result.estado,
        xml_firmado: result.xmlFirmado,
        xml_autorizado: result.xmlAutorizado,
        numero_secuencial: numNC,
        fecha_emision: new Date().toISOString().split('T')[0],
        motivo,
        cod_doc_modificado: '01',
        num_doc_modificado: numDocModificado,
        fecha_emision_doc_sustento: factura.fecha_emision,
        subtotal_sin_impuestos: subtotal,
        iva: ivaCalculado > 0 ? ivaCalculado : 0,
        total,
        receptor_tipo_doc: receptor.tipoDoc,
        receptor_num_doc: receptor.numDoc,
        receptor_razon_social: receptor.razonSocial,
        errores: result.errores,
      })
      .select()
      .single();

    if (insertError) console.error('Error guardando nota de crédito:', insertError);

    // 12. Incrementar secuencial si fue exitoso
    if (result.success) {
      await supabase
        .from('business_sri_config')
        .update({
          secuencial_nota_credito: (sriConfig.secuencial_nota_credito ?? 1) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sriConfig.id);

      // Marcar factura original como anulada si la NC fue autorizada
      if (result.estado === 'autorizada') {
        await supabase
          .from('facturas_electronicas')
          .update({ estado: 'anulada' })
          .eq('id', facturaId);
      }
    }

    // 13. Generar RIDE PDF y enviar email
    if (result.success && nc) {
      try {
        const fechaStr = new Date().toLocaleDateString('es-EC', {
          day: '2-digit', month: '2-digit', year: 'numeric',
        });
        const fechaDocStr = fechaEmisionDocSustento.toLocaleDateString('es-EC', {
          day: '2-digit', month: '2-digit', year: 'numeric',
        });

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

        const pdfBuffer = await generarRideNotaCreditoPdf({
          rucEmisor: sriConfig.ruc_emisor,
          razonSocialEmisor: sriConfig.razon_social,
          nombreComercial: sriConfig.nombre_comercial,
          direccionMatriz: sriConfig.direccion_matriz,
          numeroNC: numNC,
          claveAcceso: result.claveAcceso,
          fechaEmision: fechaStr,
          ambiente: sriConfig.ambiente,
          numeroAutorizacion: result.numeroAutorizacion,
          fechaAutorizacion: result.fechaAutorizacion,
          numDocModificado,
          fechaDocModificado: fechaDocStr,
          motivoCredito: motivo,
          receptor: {
            tipoDoc: receptor.tipoDoc,
            numDoc: receptor.numDoc,
            razonSocial: receptor.razonSocial,
            email: receptor.email,
          },
          items: rideItems,
          subtotalSinImpuestos: subtotal,
          iva: ivaCalculado > 0 ? ivaCalculado : 0,
          total,
        });

        const pdfPath = `${businessId}/nc-${nc.id}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from('rides')
          .upload(pdfPath, pdfBuffer, { contentType: 'application/pdf', upsert: true });

        if (!uploadError) {
          const { data: signedUrl } = await supabase.storage
            .from('rides')
            .createSignedUrl(pdfPath, 60 * 60 * 24 * 365);
          const rideUrl = signedUrl?.signedUrl ?? null;

          await supabase
            .from('notas_credito')
            .update({ ride_pdf_url: rideUrl })
            .eq('id', nc.id);

          // Enviar email si hay dirección de email del receptor
          if (receptor.email) {
            const emailResult = await enviarRideEmail({
              toEmail: receptor.email,
              toNombre: receptor.razonSocial,
              emisorNombre: sriConfig.nombre_comercial ?? sriConfig.razon_social,
              numeroFactura: numNC,
              fechaEmision: fechaStr,
              total,
              pdfBuffer,
              claveAcceso: result.claveAcceso,
              tipoDocumento: 'Nota de Crédito',
              numeroDocumento: numNC,
            });

            if (emailResult.success) {
              await supabase
                .from('notas_credito')
                .update({ email_enviado: true })
                .eq('id', nc.id);
            } else {
              console.error('Error enviando email NC:', emailResult.error);
            }
          }
        }
      } catch (rideErr) {
        console.error('Error generando RIDE NC o enviando email:', rideErr);
      }
    }

    return NextResponse.json({
      success: result.success,
      ncId: nc?.id,
      estado: result.estado,
      claveAcceso: result.claveAcceso,
      numeroAutorizacion: result.numeroAutorizacion,
      numeroNC: numNC,
      errores: result.errores,
    });
  } catch (err: any) {
    console.error('Error en /api/sri/nota-credito:', err);
    return NextResponse.json({ error: err.message ?? 'Error interno' }, { status: 500 });
  }
}

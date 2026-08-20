import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { emitirRetencion } from '@/lib/sri/engine-retencion';
import { generarRideRetencionPdf } from '@/lib/sri/ride-retencion';
import { enviarRideEmail } from '@/lib/sri/email';
import { numeroFactura } from '@/lib/sri/clave';
import type { SriConfig, RetencionDetalle, DocSustentoRetencion } from '@/lib/sri/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      businessId,
      sujetoRetenido,
      periodoFiscal,
      numDocSustento,
      fechaDocSustento,
      numAutDocSustento,
      totalSinImpuestos,
      importeTotal,
      retenciones,
    } = body;

    // 1. Validar inputs
    if (!businessId || !sujetoRetenido || !periodoFiscal || !numDocSustento || !fechaDocSustento || !retenciones?.length) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }
    if (!sujetoRetenido.tipoDoc || !sujetoRetenido.numDoc || !sujetoRetenido.razonSocial) {
      return NextResponse.json({ error: 'Datos del sujeto retenido incompletos' }, { status: 400 });
    }

    // 2. Cargar config SRI
    const { data: sriConfig, error: configError } = await supabase
      .from('business_sri_config')
      .select('*')
      .eq('business_id', businessId)
      .eq('activo', true)
      .maybeSingle();

    if (configError || !sriConfig) {
      return NextResponse.json({ error: 'El negocio no tiene configuración SRI activa' }, { status: 404 });
    }
    if (!sriConfig.es_agente_retencion) {
      return NextResponse.json({ error: 'El negocio no está habilitado como agente de retención' }, { status: 403 });
    }
    if (!sriConfig.certificado_p12_base64 || !sriConfig.certificado_clave) {
      return NextResponse.json({ error: 'El negocio no tiene certificado digital cargado' }, { status: 400 });
    }

    // 3. Construir SriConfig
    const config: SriConfig = {
      rucEmisor: sriConfig.ruc_emisor,
      razonSocial: sriConfig.razon_social,
      nombreComercial: sriConfig.nombre_comercial,
      direccionMatriz: sriConfig.direccion_matriz,
      codigoEstablecimiento: sriConfig.codigo_establecimiento,
      codigoPuntoEmision: sriConfig.codigo_punto_emision,
      secuencial: sriConfig.secuencial_retencion ?? 1,
      ambiente: sriConfig.ambiente,
      certificadoP12Base64: sriConfig.certificado_p12_base64,
      certificadoClave: sriConfig.certificado_clave,
      obligadoContabilidad: sriConfig.obligado_contabilidad ?? false,
      contribuyenteEspecial: sriConfig.numero_contribuyente_especial ?? null,
      regimenTributario: sriConfig.regimen_tributario ?? 'GENERAL',
    };

    // 4. Construir retenciones
    const retencionesDetalle: RetencionDetalle[] = retenciones.map((r: any) => ({
      tipo: r.tipo,
      codigo: r.codigo,
      codigoRetencion: r.codigoRetencion,
      baseImponible: parseFloat(r.baseImponible),
      tarifa: parseFloat(r.tarifa),
      valorRetenido: parseFloat(r.valorRetenido),
    }));

    const totalRetenido = retencionesDetalle.reduce((acc, r) => acc + r.valorRetenido, 0);

    const docSustento: DocSustentoRetencion = {
      codDocSustento: '01',
      numDocSustento,
      fechaEmisionDocSustento: new Date(fechaDocSustento),
      numAutDocSustento: numAutDocSustento ?? '',
      totalSinImpuestos: parseFloat(totalSinImpuestos),
      importeTotal: parseFloat(importeTotal),
      retenciones: retencionesDetalle,
    };

    // 5. Emitir retención
    const result = await emitirRetencion({
      config,
      sujetoRetenido: {
        tipoDoc: sujetoRetenido.tipoDoc as 'RUC' | 'CEDULA' | 'PASAPORTE',
        numDoc: sujetoRetenido.numDoc,
        razonSocial: sujetoRetenido.razonSocial,
        email: sujetoRetenido.email,
      },
      periodoFiscal,
      docsSustento: [docSustento],
    });

    const numRet = numeroFactura(
      sriConfig.codigo_establecimiento,
      sriConfig.codigo_punto_emision,
      sriConfig.secuencial_retencion ?? 1,
    );

    // 6. Guardar en DB
    const { data: retencion, error: insertError } = await supabase
      .from('comprobantes_retencion')
      .insert({
        business_id: businessId,
        clave_acceso: result.claveAcceso,
        numero_autorizacion: result.numeroAutorizacion,
        fecha_autorizacion: result.fechaAutorizacion,
        ambiente: sriConfig.ambiente,
        estado: result.estado === 'error' ? 'rechazada' : result.estado,
        xml_firmado: result.xmlFirmado,
        xml_autorizado: result.xmlAutorizado,
        numero_secuencial: numRet,
        fecha_emision: new Date().toISOString().split('T')[0],
        periodo_fiscal: periodoFiscal,
        proveedor_tipo_doc: sujetoRetenido.tipoDoc,
        proveedor_num_doc: sujetoRetenido.numDoc,
        proveedor_razon_social: sujetoRetenido.razonSocial,
        proveedor_email: sujetoRetenido.email ?? null,
        num_doc_sustento: numDocSustento,
        fecha_doc_sustento: new Date(fechaDocSustento).toISOString().split('T')[0],
        num_autorizacion_sustento: numAutDocSustento ?? null,
        total_sin_impuestos: parseFloat(totalSinImpuestos),
        retenciones: retencionesDetalle,
        total_retenido: totalRetenido,
        errores: result.errores,
      })
      .select()
      .single();

    if (insertError) console.error('Error guardando retención:', insertError);

    // 7. Incrementar secuencial si fue exitoso
    if (result.success) {
      await supabase
        .from('business_sri_config')
        .update({
          secuencial_retencion: (sriConfig.secuencial_retencion ?? 1) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sriConfig.id);
    }

    // 8. Generar RIDE PDF
    if (result.success && retencion) {
      try {
        const fechaStr = new Date().toLocaleDateString('es-EC', {
          day: '2-digit', month: '2-digit', year: 'numeric',
        });
        const fechaDocStr = new Date(fechaDocSustento).toLocaleDateString('es-EC', {
          day: '2-digit', month: '2-digit', year: 'numeric',
        });

        const pdfBuffer = await generarRideRetencionPdf({
          rucEmisor: sriConfig.ruc_emisor,
          razonSocialEmisor: sriConfig.razon_social,
          nombreComercial: sriConfig.nombre_comercial,
          direccionMatriz: sriConfig.direccion_matriz,
          numeroRetencion: numRet,
          claveAcceso: result.claveAcceso,
          fechaEmision: fechaStr,
          ambiente: sriConfig.ambiente,
          numeroAutorizacion: result.numeroAutorizacion,
          fechaAutorizacion: result.fechaAutorizacion,
          periodoFiscal,
          sujetoRetenido: {
            tipoDoc: sujetoRetenido.tipoDoc,
            numDoc: sujetoRetenido.numDoc,
            razonSocial: sujetoRetenido.razonSocial,
          },
          numDocSustento,
          fechaDocSustento: fechaDocStr,
          retenciones: retencionesDetalle.map(r => ({
            tipo: r.tipo,
            codigoRetencion: r.codigoRetencion,
            baseImponible: r.baseImponible,
            tarifa: r.tarifa,
            valorRetenido: r.valorRetenido,
          })),
          totalRetenido,
        });

        const pdfPath = `${businessId}/ret-${retencion.id}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from('rides')
          .upload(pdfPath, pdfBuffer, { contentType: 'application/pdf', upsert: true });

        if (!uploadError) {
          const { data: signedUrl } = await supabase.storage
            .from('rides')
            .createSignedUrl(pdfPath, 60 * 60 * 24 * 365);
          const rideUrl = signedUrl?.signedUrl ?? null;

          await supabase
            .from('comprobantes_retencion')
            .update({ ride_pdf_url: rideUrl })
            .eq('id', retencion.id);

          // Enviar email si hay dirección de email del sujeto retenido
          if (sujetoRetenido.email) {
            const emailResult = await enviarRideEmail({
              toEmail: sujetoRetenido.email,
              toNombre: sujetoRetenido.razonSocial,
              emisorNombre: sriConfig.nombre_comercial ?? sriConfig.razon_social,
              numeroFactura: numRet,
              fechaEmision: fechaStr,
              total: totalRetenido,
              pdfBuffer,
              claveAcceso: result.claveAcceso,
              tipoDocumento: 'Comprobante de Retención',
              numeroDocumento: numRet,
            });

            if (emailResult.success) {
              await supabase
                .from('comprobantes_retencion')
                .update({ email_enviado: true })
                .eq('id', retencion.id);
            } else {
              console.error('Error enviando email retención:', emailResult.error);
            }
          }
        }
      } catch (rideErr) {
        console.error('Error generando RIDE retención:', rideErr);
      }
    }

    return NextResponse.json({
      success: result.success,
      retencionId: retencion?.id,
      estado: result.estado,
      claveAcceso: result.claveAcceso,
      numeroAutorizacion: result.numeroAutorizacion,
      numeroRetencion: numRet,
      errores: result.errores,
    });
  } catch (err: any) {
    console.error('Error en /api/sri/retencion:', err);
    return NextResponse.json({ error: err.message ?? 'Error interno' }, { status: 500 });
  }
}
